const fs = require("fs");
const fsp = fs.promises;
const http = require("http");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { pathToFileURL } = require("url");
const SanalTaksimResolver = require("./src/core/sanal-taksim-resolver.js");
const OperationalCodeHighWater = require("./src/core/operational-code-high-water.js");
const PrototypeStockTestCleanup = require("./src/core/prototype-stock-test-cleanup.js");
const PrototypeSalesTestCohortCleanup = require("./src/core/prototype-sales-test-cohort-cleanup.js");

const portArg = Number(process.argv[2]);
const port = Number.isFinite(portArg) && portArg > 0 ? portArg : 5500;
const runtimeModeArg = process.argv.slice(3)
  .find((arg) => String(arg || "").trim().toLowerCase().startsWith("--runtime-mode="));
const requestedRuntimeMode = String(
  runtimeModeArg ? runtimeModeArg.split("=").slice(1).join("=") : process.env.DULDA_ERP_RUNTIME_MODE || "LIVE"
).trim().toUpperCase();
const demoTestResetEnabled = ["PROTOTYPE", "DEMO"].includes(requestedRuntimeMode);
const runtimeMode = demoTestResetEnabled ? "PROTOTYPE" : "LIVE";
const demoCleanupApprovalTypes = new Set([
  "sales_order_demo_cleanup",
  "stock_demand_demo_cleanup",
  "sor000001_montage_demo_cleanup",
]);
const root = __dirname;
const dataFile = path.join(root, "demo_state.json");
const historyDir = path.join(root, ".state-history");
const historyRetentionCount = 500;
const maxBodySize = 200 * 1024 * 1024;
const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};
let pdfBrowserPromise = null;

const criticalStateCollections = [
  "partComponentCards",
  "salesProductVariants",
  "orders",
  "planningDemands",
  "semiFinishedCards",
  "workOrders",
  "workOrderTransactions",
  "stock_movements",
  "stockDepotItems",
  "montageDispatchPlans",
  "montageDispatchShipments",
  "montageCompletionTransfers",
  "salesShipmentPlans",
  "salesShipments",
  "sanalTaksimAllocationInstructions",
];
const criticalDropThreshold = 0.30;
const criticalDropApprovalCollections = {
  sales_order_demo_cleanup: new Set([
    "orders",
    "planningDemands",
    "workOrders",
    "workOrderTransactions",
    "stock_movements",
    "stockDepotItems",
    "montageDispatchPlans",
    "montageDispatchShipments",
    "montageCompletionTransfers",
    "salesShipmentPlans",
    "salesShipments",
    "sanalTaksimAllocationInstructions",
  ]),
  stock_demand_demo_cleanup: new Set([
    "planningDemands",
    "workOrders",
    "workOrderTransactions",
    "stock_movements",
    "stockDepotItems",
  ]),
  sor000001_montage_demo_cleanup: new Set([
    "montageDispatchPlans",
    "montageDispatchShipments",
    "montageCompletionTransfers",
    "stock_movements",
    "stockDepotItems",
  ]),
};

const mimeMap = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8", ...noCacheHeaders });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxBodySize) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function sanitizeDownloadName(value) {
  const raw = String(value || "teslim-belgesi")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, "-")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, "_")
    .replace(/\.+$/g, "");
  const normalized = raw || "teslim-belgesi";
  return normalized.slice(0, 96);
}

function buildContentDisposition(fileNameBase, extension = "pdf") {
  const base = sanitizeDownloadName(fileNameBase || "teslim-belgesi");
  const ext = String(extension || "pdf").replace(/[^a-z0-9]+/gi, "").toLowerCase() || "pdf";
  const fullName = `${base}.${ext}`;
  const asciiFallback = fullName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 128) || `document.${ext}`;
  const encoded = encodeURIComponent(fullName)
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function getStateDataRoot(state) {
  return isPlainObject(state?.data) ? state.data : {};
}

function getCollectionCount(state, collection) {
  const data = getStateDataRoot(state);
  const rows = data?.[collection];
  return Array.isArray(rows) ? rows.length : 0;
}

const sanalTaksimInstructionStatuses = new Set(["ACTIVE", "CANCELLED", "COMPLETED"]);
const sanalTaksimUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sanalTaksimQtyEpsilon = 1e-6;

function sanalTaksimText(value) {
  return String(value ?? "").trim();
}

function sanalTaksimCode(value) {
  return sanalTaksimText(value).toLocaleUpperCase("tr-TR");
}

function sanalTaksimSameQty(left, right) {
  return Math.abs(Number(left || 0) - Number(right || 0)) <= sanalTaksimQtyEpsilon;
}

function sanalTaksimIsPositiveQty(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function sanalTaksimIsIsoDate(value) {
  const raw = sanalTaksimText(value);
  return !!raw && Number.isFinite(Date.parse(raw));
}

function sanalTaksimGetQty(row) {
  const present = ["qty", "quantity", "amount"]
    .filter((key) => Object.prototype.hasOwnProperty.call(row || {}, key)
      && row?.[key] !== "" && row?.[key] !== null && row?.[key] !== undefined)
    .map((key) => Number(row[key]));
  if (!present.length || present.some((value) => !Number.isFinite(value))) return null;
  return present.every((value) => sanalTaksimSameQty(value, present[0])) ? present[0] : null;
}

function sanalTaksimBuildLineageKey(record, audit) {
  return [
    "LINEAGE",
    sanalTaksimText(record?.prcId),
    sanalTaksimCode(record?.prcCode),
    sanalTaksimCode(record?.unit),
    sanalTaksimCode(audit?.originSourceType),
    sanalTaksimText(audit?.originOrderId),
    sanalTaksimText(audit?.originOrderLineId),
    sanalTaksimText(audit?.originDemandId),
    sanalTaksimText(audit?.originItemKey),
    sanalTaksimText(audit?.originWorkOrderId),
    sanalTaksimText(audit?.originWorkOrderLineId),
  ].join("|");
}

function sanalTaksimStockFingerprint(row) {
  if (!row) return "";
  return JSON.stringify({
    id: sanalTaksimText(row?.id),
    qty: sanalTaksimGetQty(row),
    prcId: sanalTaksimText(row?.refId || row?.productId),
    prcCode: sanalTaksimCode(row?.productCode || row?.code),
    unit: sanalTaksimCode(row?.unit),
    depotId: sanalTaksimText(row?.depotId).toLowerCase(),
    nodeKey: sanalTaksimText(row?.nodeKey).toLowerCase(),
    stockClass: sanalTaksimCode(row?.stockClass || row?.status),
    allocationType: sanalTaksimCode(row?.allocationType),
    sourceType: sanalTaksimCode(row?.sourceType),
    sourceOrderId: sanalTaksimText(row?.sourceOrderId),
    sourceLineId: sanalTaksimText(row?.sourceLineId),
    demandId: sanalTaksimText(row?.demandId),
    itemKey: sanalTaksimText(row?.itemKey),
    workOrderId: sanalTaksimText(row?.workOrderId),
    workOrderLineId: sanalTaksimText(row?.workOrderLineId),
  });
}

function validateSanalTaksimAllocationInstructions(state) {
  const data = getStateDataRoot(state);
  const rawRows = data?.sanalTaksimAllocationInstructions;
  if (rawRows !== undefined && !Array.isArray(rawRows)) {
    return ["sanalTaksimAllocationInstructions koleksiyonu dizi olmalıdır."];
  }
  const rows = Array.isArray(rawRows) ? rawRows : [];
  const stockRows = Array.isArray(data?.stockDepotItems) ? data.stockDepotItems : [];
  const cards = Array.isArray(data?.partComponentCards) ? data.partComponentCards : [];
  const orders = Array.isArray(data?.orders) ? data.orders : [];
  const demands = Array.isArray(data?.planningDemands) ? data.planningDemands : [];
  const stockMovements = Array.isArray(data?.stock_movements) ? data.stock_movements : [];
  const issues = [];
  const ids = new Set();
  const instructionCodes = new Set();
  const idempotencyKeys = new Set();
  const sliceKeys = new Set();
  const activeRangesBySegment = new Map();
  let trustedPhysicalSegments = [];
  try {
    const sourceSnapshot = {
      ...data,
      montageDispatchPlans: [],
      montageDispatchShipments: [],
      montageCompletionTransfers: [],
      sanalTaksimAllocationInstructions: [],
    };
    const resolved = SanalTaksimResolver.resolve(sourceSnapshot);
    trustedPhysicalSegments = Array.isArray(resolved?.segments) ? resolved.segments : [];
  } catch (_error) {
    trustedPhysicalSegments = [];
  }

  rows.forEach((record, recordIndex) => {
    const label = sanalTaksimText(record?.instructionCode || `sanalTaksimAllocationInstructions[${recordIndex}]`);
    const id = sanalTaksimText(record?.id);
    const instructionCode = sanalTaksimCode(record?.instructionCode);
    const idempotencyKey = sanalTaksimText(record?.idempotencyKey);
    const status = sanalTaksimCode(record?.status);
    const prcId = sanalTaksimText(record?.prcId);
    const prcCode = sanalTaksimCode(record?.prcCode);
    const unit = sanalTaksimCode(record?.unit);
    const qty = Number(record?.qty);
    const target = isPlainObject(record?.target) ? record.target : null;
    const slices = Array.isArray(record?.slices) ? record.slices : [];
    const events = Array.isArray(record?.events) ? record.events : null;

    if (!sanalTaksimUuidPattern.test(id)) issues.push(`${label}: id geçerli UUID olmalıdır.`);
    if (!OperationalCodeHighWater.isValidCode(instructionCode, 'STAI')) {
      issues.push(`${label}: instructionCode STAI-000001 veya daha uzun canonical sıra biçiminde olmalıdır.`);
    }
    if (!idempotencyKey) issues.push(`${label}: idempotencyKey zorunludur.`);
    if (Number(record?.contractVersion) !== 1) issues.push(`${label}: contractVersion 1 olmalıdır.`);
    if (!sanalTaksimInstructionStatuses.has(status)) issues.push(`${label}: status geçersizdir.`);
    if (!prcId || !prcCode || !unit) issues.push(`${label}: exact PRC ve birim zorunludur.`);
    if (!sanalTaksimIsPositiveQty(qty)) issues.push(`${label}: qty pozitif ve sonlu olmalıdır.`);
    if (!sanalTaksimText(record?.reason)) issues.push(`${label}: reason zorunludur.`);
    if (!sanalTaksimIsIsoDate(record?.createdAt)) issues.push(`${label}: createdAt geçerli ISO zaman olmalıdır.`);
    if (!sanalTaksimText(record?.createdBy)) issues.push(`${label}: createdBy zorunludur.`);
    if (!events) issues.push(`${label}: events dizi olmalıdır.`);
    if (!slices.length) issues.push(`${label}: en az bir exact stok dilimi zorunludur.`);
    if (!target || ["sourceOrderId", "sourceLineId", "demandId", "itemKey"]
      .some((key) => !sanalTaksimText(target?.[key]))) {
      issues.push(`${label}: exact SALES target kimlikleri zorunludur.`);
    }
    if (ids.has(id)) issues.push(`${label}: id mükerrerdir.`);
    if (instructionCodes.has(instructionCode)) issues.push(`${label}: instructionCode mükerrerdir.`);
    if (idempotencyKeys.has(idempotencyKey)) issues.push(`${label}: idempotencyKey mükerrerdir.`);
    if (id) ids.add(id);
    if (instructionCode) instructionCodes.add(instructionCode);
    if (idempotencyKey) idempotencyKeys.add(idempotencyKey);

    if (target) {
      const orderMatches = orders.filter((row) => sanalTaksimText(row?.id) === sanalTaksimText(target.sourceOrderId));
      const lineMatches = orderMatches.length === 1
        ? (Array.isArray(orderMatches[0]?.lines) ? orderMatches[0].lines : [])
          .filter((line) => sanalTaksimText(line?.id) === sanalTaksimText(target.sourceLineId))
        : [];
      const demandMatches = demands.filter((row) => sanalTaksimText(row?.id) === sanalTaksimText(target.demandId));
      const demand = demandMatches.length === 1 ? demandMatches[0] : null;
      const itemMatches = demand
        ? (Array.isArray(demand?.items) ? demand.items : [])
          .filter((item) => sanalTaksimText(item?.id || item?.itemKey) === sanalTaksimText(target.itemKey))
        : [];
      if (orderMatches.length !== 1 || lineMatches.length !== 1 || demandMatches.length !== 1 || itemMatches.length !== 1
        || sanalTaksimCode(demand?.sourceType) !== "SALES_ORDER"
        || sanalTaksimText(demand?.sourceOrderId) !== sanalTaksimText(target.sourceOrderId)
        || sanalTaksimText(demand?.sourceLineId) !== sanalTaksimText(target.sourceLineId)) {
        issues.push(`${label}: target tek bir SALES sipariş/PLN/item zincirine bağlanmalıdır.`);
      }
    }

    let sliceTotal = 0;
    slices.forEach((slice, sliceIndex) => {
      const sliceLabel = `${label}/slice[${sliceIndex}]`;
      const sliceKey = sanalTaksimText(slice?.sliceKey);
      const stockRowId = sanalTaksimText(slice?.stockRowId);
      const physicalSegmentId = sanalTaksimText(slice?.physicalSegmentId);
      const capacity = Number(slice?.segmentCapacityQtyAtCreate);
      const start = Number(slice?.segmentOffsetStart);
      const end = Number(slice?.segmentOffsetEnd);
      const sliceQty = Number(slice?.qty);
      const audit = isPlainObject(slice?.physicalOriginAudit) ? slice.physicalOriginAudit : null;
      const evidenceIds = Array.isArray(audit?.evidenceIds)
        ? audit.evidenceIds.map(sanalTaksimText).filter(Boolean)
        : [];
      const stockMatches = stockRows.filter((row) => sanalTaksimText(row?.id) === stockRowId);
      const stockRow = stockMatches.length === 1 ? stockMatches[0] : null;
      const stockQty = sanalTaksimGetQty(stockRow);
      const rowPrcCode = sanalTaksimCode(stockRow?.productCode || stockRow?.code);
      const rowPrcId = sanalTaksimText(stockRow?.refId || stockRow?.productId);
      const cardMatches = cards.filter((card) => sanalTaksimText(card?.id) === prcId
        && sanalTaksimCode(card?.code) === prcCode);
      const mainDepot = sanalTaksimText(stockRow?.depotId).toLowerCase() === "main"
        || sanalTaksimText(stockRow?.nodeKey).toLowerCase() === "managed:main";
      const originSourceType = sanalTaksimCode(audit?.originSourceType);
      const stockState = sanalTaksimCode(stockRow?.stockClass || stockRow?.status);
      const allocationType = sanalTaksimCode(stockRow?.allocationType);
      const sourceKind = sanalTaksimCode(audit?.sourceKind);
      const isStockSource = sourceKind === "CURRENT_STOCK_ROW"
        && !!stockRowId
        && physicalSegmentId === `STOCK|${stockRowId}`;
      const wipMatches = trustedPhysicalSegments.filter((segment) =>
        sanalTaksimText(segment?.segmentKey) === physicalSegmentId
        && sanalTaksimCode(segment?.sourceKind) === "WORK_ORDER"
        && ["IN_PROCESS", "TRANSFER_PENDING", "DEPOT_PENDING"].includes(sanalTaksimCode(segment?.stage))
        && !sanalTaksimText(segment?.stockRowId));
      const wipSegment = wipMatches.length === 1 ? wipMatches[0] : null;
      const isWipSource = sourceKind === "WORK_ORDER"
        && !stockRowId
        && !!physicalSegmentId
        && !physicalSegmentId.startsWith("STOCK|")
        && !!sanalTaksimText(audit?.originWorkOrderId)
        && !!sanalTaksimText(audit?.originWorkOrderLineId);

      if (!sliceKey) issues.push(`${sliceLabel}: sliceKey zorunludur.`);
      if (sliceKeys.has(sliceKey)) issues.push(`${sliceLabel}: sliceKey mükerrerdir.`);
      if (sliceKey) sliceKeys.add(sliceKey);
      if (!isStockSource && !isWipSource) issues.push(`${sliceLabel}: exact stok/WIP kaynak referansı geçersizdir.`);
      if (!sanalTaksimIsPositiveQty(capacity) || !sanalTaksimIsPositiveQty(sliceQty)
        || !Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start
        || !sanalTaksimSameQty(end - start, sliceQty) || end > capacity + sanalTaksimQtyEpsilon) {
        issues.push(`${sliceLabel}: exact miktar aralığı geçersizdir.`);
      }
      if (!audit || !["CURRENT_STOCK_ROW", "WORK_ORDER"].includes(sourceKind)
        || !["SALES_ORDER", "STOCK"].includes(originSourceType)
        || !sanalTaksimText(audit?.originDemandId)
        || !sanalTaksimText(audit?.originItemKey)
        || !evidenceIds.length) {
        issues.push(`${sliceLabel}: canonical physicalOriginAudit eksik veya UNSCOPED durumdadır.`);
      }
      if (sanalTaksimText(slice?.lineageKey) !== sanalTaksimBuildLineageKey(record, audit)) {
        issues.push(`${sliceLabel}: lineageKey canonical origin ile uyuşmuyor.`);
      }
      const activeStockInvalid = isStockSource && (stockMatches.length !== 1 || stockQty === null
        || !sanalTaksimSameQty(stockQty, capacity) || !mainDepot || rowPrcCode !== prcCode
        || (rowPrcId && rowPrcId !== prcId) || sanalTaksimCode(stockRow?.unit) !== unit
        || cardMatches.length !== 1
        || sanalTaksimCode(cardMatches[0]?.unit || cardMatches[0]?.stockUnit || "ADET") !== unit
        || ["RESERVED", "LOCKED", "UNCERTAIN", "CONSUMED", "SHIPPED"].includes(stockState)
        || ["RESERVED", "LOCKED", "UNCERTAIN", "CONSUMED", "SHIPPED", "FROM_SEMI"].includes(allocationType));
      const activeWipInvalid = isWipSource && (!wipSegment
        || !sanalTaksimSameQty(wipSegment?.physicalQty, capacity)
        || sanalTaksimText(wipSegment?.prcId) !== prcId
        || sanalTaksimCode(wipSegment?.prcCode) !== prcCode
        || sanalTaksimCode(wipSegment?.unit) !== unit
        || wipSegment?.productionOriginVerified !== true
        || wipSegment?.physicalOrigin?.verified !== true
        || sanalTaksimSemanticStringify(audit)
          !== sanalTaksimSemanticStringify({
            sourceKind: sanalTaksimText(wipSegment?.sourceKind),
            originSourceType: sanalTaksimCode(wipSegment?.originSourceType),
            originOrderId: sanalTaksimText(wipSegment?.originOrderId),
            originOrderLineId: sanalTaksimText(wipSegment?.originOrderLineId),
            originDemandId: sanalTaksimText(wipSegment?.originDemandId),
            originItemKey: sanalTaksimText(wipSegment?.originItemKey),
            originWorkOrderId: sanalTaksimText(wipSegment?.originWorkOrderId),
            originWorkOrderLineId: sanalTaksimText(wipSegment?.originWorkOrderLineId),
            evidenceIds: Array.isArray(wipSegment?.evidenceIds) ? wipSegment.evidenceIds.slice() : [],
          }));
      if (status === "ACTIVE" && (activeStockInvalid || activeWipInvalid || (!isStockSource && !isWipSource))) {
        issues.push(`${sliceLabel}: güncel exact PRC stok/WIP kaynağı birim/kapasite/origin kanıtıyla uyuşmuyor.`);
      }
      if (status === "ACTIVE" && isStockSource && stockRow && audit) {
        if (sanalTaksimCode(stockRow?.sourceType) !== originSourceType
          || sanalTaksimText(stockRow?.sourceOrderId) !== sanalTaksimText(audit?.originOrderId)
          || sanalTaksimText(stockRow?.sourceLineId) !== sanalTaksimText(audit?.originOrderLineId)
          || sanalTaksimText(stockRow?.demandId) !== sanalTaksimText(audit?.originDemandId)
          || sanalTaksimText(stockRow?.itemKey) !== sanalTaksimText(audit?.originItemKey)
          || !evidenceIds.includes(stockRowId)) {
          issues.push(`${sliceLabel}: physical origin stok satırıyla uyuşmuyor.`);
        }
        const auditWorkOrderId = sanalTaksimText(audit?.originWorkOrderId);
        const auditWorkOrderLineId = sanalTaksimText(audit?.originWorkOrderLineId);
        if (auditWorkOrderId || auditWorkOrderLineId) {
          const movementMatches = stockMovements.filter((movement) => {
            const movementId = sanalTaksimText(movement?.id);
            const movementPrcId = sanalTaksimText(movement?.refId || movement?.productId);
            const movementPrcCode = sanalTaksimCode(movement?.productCode || movement?.code);
            return evidenceIds.includes(movementId)
              && (!movementPrcId || movementPrcId === prcId)
              && movementPrcCode === prcCode
              && sanalTaksimText(movement?.workOrderId) === auditWorkOrderId
              && sanalTaksimText(movement?.workOrderLineId || movement?.lineId) === auditWorkOrderLineId
              && sanalTaksimText(movement?.demandId) === sanalTaksimText(audit?.originDemandId)
              && sanalTaksimText(movement?.itemKey) === sanalTaksimText(audit?.originItemKey);
          });
          if (movementMatches.length !== 1) {
            issues.push(`${sliceLabel}: physical origin WO/hareket kanıtı tekil değildir.`);
          }
        }
      }
      sliceTotal += Number.isFinite(sliceQty) ? sliceQty : 0;
      if (status === "ACTIVE" && physicalSegmentId && Number.isFinite(start) && Number.isFinite(end)) {
        if (!activeRangesBySegment.has(physicalSegmentId)) activeRangesBySegment.set(physicalSegmentId, []);
        activeRangesBySegment.get(physicalSegmentId).push({ start, end, label });
      }
    });
    if (!sanalTaksimSameQty(sliceTotal, qty)) issues.push(`${label}: qty dilim toplamıyla uyuşmuyor.`);

    if (events) {
      const eventIds = new Set();
      events.forEach((event, eventIndex) => {
        const eventLabel = `${label}/events[${eventIndex}]`;
        const eventId = sanalTaksimText(event?.eventId);
        const type = sanalTaksimCode(event?.type);
        if (!eventId || eventIds.has(eventId)) issues.push(`${eventLabel}: eventId zorunlu ve tekil olmalıdır.`);
        if (eventId) eventIds.add(eventId);
        if (!sanalTaksimIsIsoDate(event?.at) || !sanalTaksimText(event?.by) || !sanalTaksimText(event?.reason)) {
          issues.push(`${eventLabel}: olay audit alanları eksiktir.`);
        }
        if (!["CANCELLED", "COMPLETED"].includes(type)) issues.push(`${eventLabel}: olay türü geçersizdir.`);
      });
      if (status === "ACTIVE" && events.length !== 0) issues.push(`${label}: ACTIVE talimat events dizisi boş olmalıdır.`);
      if (status === "CANCELLED" && (events.length !== 1 || sanalTaksimCode(events[0]?.type) !== "CANCELLED")) {
        issues.push(`${label}: CANCELLED status tek CANCELLED olayıyla doğrulanmalıdır.`);
      }
      if (status === "COMPLETED" && (!events.length || sanalTaksimCode(events[events.length - 1]?.type) !== "COMPLETED")) {
        issues.push(`${label}: COMPLETED status COMPLETED olayıyla doğrulanmalıdır.`);
      }
    }
  });

  activeRangesBySegment.forEach((ranges, physicalSegmentId) => {
    const sorted = ranges.slice().sort((left, right) => left.start - right.start || left.end - right.end);
    for (let index = 1; index < sorted.length; index += 1) {
      if (sorted[index].start < sorted[index - 1].end - sanalTaksimQtyEpsilon) {
        issues.push(`${physicalSegmentId}: ACTIVE talimat exact aralıkları kesişemez.`);
        break;
      }
    }
  });
  return issues;
}

function sanalTaksimIsExactPlanBoundPair(instruction, slice, plan, reservation) {
  const target = isPlainObject(instruction?.target) ? instruction.target : {};
  return sanalTaksimText(plan?.id)
    && sanalTaksimText(plan?.id) === sanalTaksimText(slice?.planId)
    && sanalTaksimText(reservation?.planId) === sanalTaksimText(plan?.id)
    && sanalTaksimText(reservation?.reservationKey) === sanalTaksimText(slice?.reservationKey)
    && sanalTaksimText(reservation?.instructionId) === sanalTaksimText(instruction?.id)
    && sanalTaksimText(reservation?.instructionSliceKey) === sanalTaksimText(slice?.sliceKey)
    && sanalTaksimCode(reservation?.sourceType) === "SALES_ORDER"
    && sanalTaksimText(reservation?.sourceOrderId) === sanalTaksimText(target?.sourceOrderId)
    && sanalTaksimText(reservation?.sourceLineId) === sanalTaksimText(target?.sourceLineId)
    && sanalTaksimText(reservation?.demandId) === sanalTaksimText(target?.demandId)
    && sanalTaksimText(reservation?.itemKey) === sanalTaksimText(target?.itemKey)
    && sanalTaksimText(reservation?.prcId) === sanalTaksimText(instruction?.prcId)
    && sanalTaksimCode(reservation?.prcCode) === sanalTaksimCode(instruction?.prcCode)
    && sanalTaksimCode(reservation?.unit) === sanalTaksimCode(instruction?.unit)
    && sanalTaksimText(reservation?.stockRowId) === sanalTaksimText(slice?.stockRowId)
    && sanalTaksimText(reservation?.physicalSegmentId) === sanalTaksimText(slice?.physicalSegmentId)
    && sanalTaksimSameQty(reservation?.segmentOffsetStart, slice?.segmentOffsetStart)
    && sanalTaksimSameQty(reservation?.segmentOffsetEnd, slice?.segmentOffsetEnd)
    && sanalTaksimSameQty(reservation?.qty, slice?.qty);
}

function sanalTaksimGetPlanBoundMontageBundle(data, plan, expectedInstructionStatus = "") {
  const planId = sanalTaksimText(plan?.id);
  const reservations = Array.isArray(plan?.exactReservations) ? plan.exactReservations : [];
  const instructions = Array.isArray(data?.sanalTaksimAllocationInstructions)
    ? data.sanalTaksimAllocationInstructions : [];
  if (!planId || !reservations.length
    || reservations.some((reservation) => !sanalTaksimText(reservation?.instructionId)
      || !sanalTaksimText(reservation?.instructionSliceKey)
      || !sanalTaksimText(reservation?.reservationKey)
      || sanalTaksimText(reservation?.planId) !== planId)) return null;
  const reservationKeys = new Set();
  const sliceLinks = new Set();
  const instructionById = new Map();
  const pairs = [];
  for (const reservation of reservations) {
    const reservationKey = sanalTaksimText(reservation?.reservationKey);
    const instructionId = sanalTaksimText(reservation?.instructionId);
    const instructionSliceKey = sanalTaksimText(reservation?.instructionSliceKey);
    const sliceLink = `${instructionId}|${instructionSliceKey}`;
    if (reservationKeys.has(reservationKey) || sliceLinks.has(sliceLink)) return null;
    const instructionMatches = instructions.filter((instruction) =>
      sanalTaksimText(instruction?.id) === instructionId);
    if (instructionMatches.length !== 1) return null;
    const instruction = instructionMatches[0];
    if (expectedInstructionStatus
      && sanalTaksimCode(instruction?.status) !== sanalTaksimCode(expectedInstructionStatus)) return null;
    const sliceMatches = (Array.isArray(instruction?.slices) ? instruction.slices : [])
      .filter((slice) => sanalTaksimText(slice?.sliceKey) === instructionSliceKey);
    if (sliceMatches.length !== 1
      || !sanalTaksimIsExactPlanBoundPair(instruction, sliceMatches[0], plan, reservation)) return null;
    reservationKeys.add(reservationKey);
    sliceLinks.add(sliceLink);
    instructionById.set(instructionId, instruction);
    pairs.push({ reservation, instruction, slice: sliceMatches[0] });
  }
  for (const instruction of instructionById.values()) {
    const slices = Array.isArray(instruction?.slices) ? instruction.slices : [];
    if (!slices.length || pairs.filter((pair) => pair.instruction === instruction).length !== slices.length
      || slices.some((slice) => sanalTaksimText(slice?.planId) !== planId
        || !sanalTaksimText(slice?.reservationKey))) return null;
  }
  return {
    plan,
    reservations,
    instructions: Array.from(instructionById.values()),
    pairs,
  };
}

function sanalTaksimShipmentTransfersPlanBoundReservations(plan, shipment) {
  if (!plan || !shipment
    || sanalTaksimText(shipment?.planId) !== sanalTaksimText(plan?.id)
    || !["IN_TRANSIT", "DISPATCHED", "RECEIVED"].includes(sanalTaksimCode(shipment?.status))
    || sanalTaksimCode(shipment?.stockTransferMode) !== "POST_ON_RECEIPT_V1") return false;
  const reservations = Array.isArray(plan?.exactReservations) ? plan.exactReservations : [];
  const ranges = (Array.isArray(shipment?.parts) ? shipment.parts : [])
    .flatMap((part) => (Array.isArray(part?.allocations) ? part.allocations : []))
    .flatMap((allocation) => (Array.isArray(allocation?.segmentRanges) ? allocation.segmentRanges : []));
  if (!reservations.length || ranges.length !== reservations.length) return false;
  const matchedRangeIndexes = new Set();
  return reservations.every((reservation) => {
    const matches = ranges.map((range, index) => ({ range, index })).filter(({ range, index }) =>
      !matchedRangeIndexes.has(index)
      && sanalTaksimText(range?.reservationKey) === sanalTaksimText(reservation?.reservationKey)
      && sanalTaksimText(range?.planId) === sanalTaksimText(plan?.id)
      && sanalTaksimCode(range?.sourceType) === sanalTaksimCode(reservation?.sourceType)
      && sanalTaksimText(range?.sourceOrderId) === sanalTaksimText(reservation?.sourceOrderId)
      && sanalTaksimText(range?.sourceLineId) === sanalTaksimText(reservation?.sourceLineId)
      && sanalTaksimText(range?.demandId) === sanalTaksimText(reservation?.demandId)
      && sanalTaksimText(range?.itemKey) === sanalTaksimText(reservation?.itemKey)
      && sanalTaksimText(range?.prcId) === sanalTaksimText(reservation?.prcId)
      && sanalTaksimCode(range?.prcCode) === sanalTaksimCode(reservation?.prcCode)
      && sanalTaksimCode(range?.unit) === sanalTaksimCode(reservation?.unit)
      && sanalTaksimText(range?.stockRowId) === sanalTaksimText(reservation?.stockRowId)
      && sanalTaksimText(range?.physicalSegmentId) === sanalTaksimText(reservation?.physicalSegmentId)
      && sanalTaksimSameQty(range?.segmentOffsetStart, reservation?.segmentOffsetStart)
      && sanalTaksimSameQty(range?.segmentOffsetEnd, reservation?.segmentOffsetEnd)
      && sanalTaksimSameQty(range?.qty, reservation?.qty));
    if (matches.length !== 1) return false;
    matchedRangeIndexes.add(matches[0].index);
    return true;
  });
}

function sanalTaksimInstructionLifecycleAppendMatches(current, incoming, eventType) {
  const currentCore = { ...current };
  const incomingCore = { ...incoming };
  delete currentCore.status;
  delete currentCore.events;
  delete incomingCore.status;
  delete incomingCore.events;
  const currentEvents = Array.isArray(current?.events) ? current.events : [];
  const incomingEvents = Array.isArray(incoming?.events) ? incoming.events : [];
  const appended = incomingEvents[currentEvents.length];
  return JSON.stringify(currentCore) === JSON.stringify(incomingCore)
    && sanalTaksimCode(current?.status) === "ACTIVE"
    && sanalTaksimCode(incoming?.status) === sanalTaksimCode(eventType)
    && incomingEvents.length === currentEvents.length + 1
    && JSON.stringify(incomingEvents.slice(0, currentEvents.length)) === JSON.stringify(currentEvents)
    && sanalTaksimCode(appended?.type) === sanalTaksimCode(eventType);
}

function sanalTaksimSameCollectionsExcept(currentData, incomingData, ignoredKeys) {
  const currentOther = { ...currentData };
  const incomingOther = { ...incomingData };
  ignoredKeys.forEach((key) => {
    delete currentOther[key];
    delete incomingOther[key];
  });
  return JSON.stringify(currentOther) === JSON.stringify(incomingOther);
}

function sanalTaksimSemanticStringify(value) {
  if (Array.isArray(value)) return `[${value.map(sanalTaksimSemanticStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${sanalTaksimSemanticStringify(value[key])}`
    ).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sanalTaksimMgsBusinessCore(shipment) {
  const core = { ...(shipment || {}) };
  delete core.operationalRebindEvents;
  delete core.updated_at;
  delete core.updatedAt;
  delete core.revision;
  delete core._revision;
  return core;
}

function sanalTaksimMgsTransitionCore(shipment) {
  const core = { ...(shipment || {}) };
  delete core.updated_at;
  delete core.updatedAt;
  delete core.revision;
  delete core._revision;
  return core;
}

function isSanalTaksimInTransitMgsOperationalRebind(currentState, incomingState) {
  const currentData = getStateDataRoot(currentState);
  const incomingData = getStateDataRoot(incomingState);
  const currentRows = Array.isArray(currentData?.montageDispatchShipments)
    ? currentData.montageDispatchShipments : [];
  const incomingRows = Array.isArray(incomingData?.montageDispatchShipments)
    ? incomingData.montageDispatchShipments : [];
  if (currentRows.length !== incomingRows.length
    || !sanalTaksimSameCollectionsExcept(currentData, incomingData, ["montageDispatchShipments"])) return false;
  const currentIds = currentRows.map((row) => sanalTaksimText(row?.id));
  const incomingIds = incomingRows.map((row) => sanalTaksimText(row?.id));
  if (currentIds.some((id) => !id || currentIds.filter((value) => value === id).length !== 1)
    || incomingIds.some((id) => !id || incomingIds.filter((value) => value === id).length !== 1)
    || currentIds.some((id) => !incomingIds.includes(id))) return false;
  const changed = currentRows.map((current) => ({
    current,
    incoming: incomingRows.find((row) => sanalTaksimText(row?.id) === sanalTaksimText(current?.id))
  })).filter(({ current, incoming }) =>
    !incoming || sanalTaksimSemanticStringify(sanalTaksimMgsTransitionCore(current))
      !== sanalTaksimSemanticStringify(sanalTaksimMgsTransitionCore(incoming))
  );
  if (changed.length !== 1) return false;
  const { current, incoming } = changed[0];
  if (!incoming
    || sanalTaksimCode(current?.status) !== "IN_TRANSIT"
    || sanalTaksimCode(incoming?.status) !== "IN_TRANSIT"
    || sanalTaksimCode(current?.stockTransferMode) !== "POST_ON_RECEIPT_V1"
    || sanalTaksimCode(incoming?.stockTransferMode) !== "POST_ON_RECEIPT_V1"
    || sanalTaksimSemanticStringify(sanalTaksimMgsBusinessCore(current))
      !== sanalTaksimSemanticStringify(sanalTaksimMgsBusinessCore(incoming))) return false;
  const currentEvents = Array.isArray(current?.operationalRebindEvents)
    ? current.operationalRebindEvents : [];
  const incomingEvents = Array.isArray(incoming?.operationalRebindEvents)
    ? incoming.operationalRebindEvents : [];
  if (currentEvents.length !== 0 || incomingEvents.length !== 1) return false;
  const event = incomingEvents[0];
  const target = event?.toTarget && typeof event.toTarget === "object" ? event.toTarget : {};
  const selection = SanalTaksimResolver.resolveInTransitMgsOperationalRebindSelection(currentData, target);
  if (!selection?.ok) return false;
  const candidateMatches = (Array.isArray(selection?.candidates) ? selection.candidates : [])
    .filter((candidate) => sanalTaksimText(candidate?.shipmentId) === sanalTaksimText(current?.id));
  if (candidateMatches.length !== 1) return false;
  const candidate = candidateMatches[0];
  const eventMatchesCandidate = Number(event?.contractVersion) === 1
    && sanalTaksimCode(event?.type) === "OPERATIONAL_REBIND"
    && sanalTaksimText(event?.eventId)
    && sanalTaksimText(event?.rebindKey) === sanalTaksimText(candidate?.rebindKey)
    && sanalTaksimSemanticStringify(event?.fromTarget) === sanalTaksimSemanticStringify(candidate?.fromTarget)
    && sanalTaksimSemanticStringify(event?.toTarget) === sanalTaksimSemanticStringify(candidate?.toTarget)
    && sanalTaksimSameQty(event?.setQty, candidate?.setQty)
    && sanalTaksimCode(event?.unit) === sanalTaksimCode(candidate?.unit)
    && sanalTaksimText(event?.productFingerprint) === sanalTaksimText(candidate?.productFingerprint)
    && sanalTaksimText(event?.recipeFingerprint) === sanalTaksimText(candidate?.recipeFingerprint)
    && sanalTaksimText(event?.exactRangeFingerprint) === sanalTaksimText(candidate?.exactRangeFingerprint)
    && sanalTaksimIsIsoDate(event?.at)
    && sanalTaksimText(event?.by)
    && sanalTaksimText(event?.reason);
  if (!eventMatchesCandidate) return false;
  const allEvents = incomingRows.flatMap((row) => Array.isArray(row?.operationalRebindEvents)
    ? row.operationalRebindEvents : []);
  const eventId = sanalTaksimText(event?.eventId);
  const rebindKey = sanalTaksimText(event?.rebindKey);
  if (allEvents.filter((row) => sanalTaksimText(row?.eventId) === eventId).length !== 1
    || allEvents.filter((row) => sanalTaksimText(row?.rebindKey) === rebindKey).length !== 1) return false;
  const effective = SanalTaksimResolver.resolveMontageShipmentOperationalTarget(incoming);
  if (!effective?.ok || effective?.rebound !== true) return false;
  let prospective;
  try {
    prospective = SanalTaksimResolver.resolve(incomingData);
  } catch (_error) {
    return false;
  }
  const invariants = prospective?.diagnostics?.invariants || {};
  if (prospective?.diagnostics?.exactHoldLedger?.valid !== true
    || invariants.exactHoldKeysConsumedOnce !== true
    || invariants.segmentKeysConsumedOnce !== true
    || invariants.exactPrcAndUnitOnly !== true
    || invariants.sourceIdentityExact !== true
    || invariants.originEvidencePreserved !== true) return false;
  const reservationKeys = Array.isArray(candidate?.reservationKeys) ? candidate.reservationKeys : [];
  return reservationKeys.length > 0;
}

function sanalTaksimMgsReceiptImmutableCore(shipment) {
  const core = JSON.parse(JSON.stringify(shipment || {}));
  ["status", "receivedAt", "updatedAt", "updated_at", "targetLocationId", "receiptKey", "receiptOwnership"]
    .forEach((key) => delete core[key]);
  (Array.isArray(core.parts) ? core.parts : []).forEach((part) => {
    (Array.isArray(part?.allocations) ? part.allocations : []).forEach((allocation) => {
      delete allocation.stockMovementId;
      delete allocation.stockTransferredAt;
    });
  });
  return core;
}

function sanalTaksimStockCoreWithoutQty(row) {
  const core = { ...(row || {}) };
  delete core.qty;
  delete core.quantity;
  delete core.amount;
  delete core.updated_at;
  delete core.updatedAt;
  return core;
}

function sanalTaksimReceiptTargetExists(data, target) {
  const orders = Array.isArray(data?.orders) ? data.orders : [];
  const demands = Array.isArray(data?.planningDemands) ? data.planningDemands : [];
  const orderMatches = orders.filter((row) => sanalTaksimText(row?.id) === sanalTaksimText(target?.sourceOrderId));
  const lineMatches = orderMatches.length === 1
    ? (Array.isArray(orderMatches[0]?.lines) ? orderMatches[0].lines : [])
      .filter((row) => sanalTaksimText(row?.id) === sanalTaksimText(target?.sourceLineId))
    : [];
  const demandMatches = demands.filter((row) => sanalTaksimText(row?.id) === sanalTaksimText(target?.demandId));
  const demand = demandMatches.length === 1 ? demandMatches[0] : null;
  const itemMatches = demand
    ? (Array.isArray(demand?.items) ? demand.items : [])
      .filter((row) => sanalTaksimText(row?.id || row?.itemKey) === sanalTaksimText(target?.itemKey))
    : [];
  return orderMatches.length === 1
    && lineMatches.length === 1
    && demandMatches.length === 1
    && itemMatches.length === 1
    && sanalTaksimCode(demand?.sourceType) === "SALES_ORDER"
    && sanalTaksimText(demand?.sourceOrderId) === sanalTaksimText(target?.sourceOrderId)
    && sanalTaksimText(demand?.sourceLineId) === sanalTaksimText(target?.sourceLineId);
}

function sanalTaksimReceiptOwnershipMatches(ownership, shipment, effective) {
  const target = ownership?.target && typeof ownership.target === "object" ? ownership.target : {};
  return Number(ownership?.contractVersion) === 1
    && sanalTaksimCode(ownership?.type) === "MONTAGE_RECEIPT_OWNERSHIP"
    && sanalTaksimSemanticStringify(target) === sanalTaksimSemanticStringify(effective?.target)
    && sanalTaksimText(ownership?.operationalRebindEventId) === sanalTaksimText(effective?.event?.eventId)
    && sanalTaksimText(ownership?.operationalRebindKey) === sanalTaksimText(effective?.event?.rebindKey)
    && sanalTaksimText(ownership?.exactRangeFingerprint) === sanalTaksimText(effective?.event?.exactRangeFingerprint)
    && sanalTaksimText(ownership?.receiptKey) === sanalTaksimText(shipment?.receiptKey)
    && sanalTaksimIsIsoDate(ownership?.lockedAt)
    && sanalTaksimText(ownership?.lockedAt) === sanalTaksimText(shipment?.receivedAt);
}

function isSanalTaksimReboundMgsAtomicReceipt(currentState, incomingState) {
  const currentData = getStateDataRoot(currentState);
  const incomingData = getStateDataRoot(incomingState);
  if (!sanalTaksimSameCollectionsExcept(currentData, incomingData, [
    "montageDispatchShipments", "stockDepotItems", "stock_movements", "stockDepotLocations",
  ])) return false;
  const currentShipments = Array.isArray(currentData?.montageDispatchShipments)
    ? currentData.montageDispatchShipments : [];
  const incomingShipments = Array.isArray(incomingData?.montageDispatchShipments)
    ? incomingData.montageDispatchShipments : [];
  if (currentShipments.length !== incomingShipments.length) return false;
  const changed = currentShipments.map((current) => ({
    current,
    incoming: incomingShipments.find((row) => sanalTaksimText(row?.id) === sanalTaksimText(current?.id)),
  })).filter(({ current, incoming }) => !incoming
    || sanalTaksimSemanticStringify(current) !== sanalTaksimSemanticStringify(incoming));
  if (changed.length !== 1 || incomingShipments.some((incoming) =>
    !currentShipments.some((current) => sanalTaksimText(current?.id) === sanalTaksimText(incoming?.id)))) return false;
  const { current, incoming } = changed[0];
  if (!incoming
    || sanalTaksimCode(current?.status) !== "IN_TRANSIT"
    || sanalTaksimCode(incoming?.status) !== "RECEIVED"
    || sanalTaksimCode(current?.stockTransferMode) !== "POST_ON_RECEIPT_V1"
    || sanalTaksimCode(incoming?.stockTransferMode) !== "POST_ON_RECEIPT_V1"
    || sanalTaksimText(current?.receivedAt)
    || sanalTaksimText(current?.receiptKey)
    || current?.receiptOwnership
    || !sanalTaksimIsIsoDate(incoming?.receivedAt)
    || sanalTaksimText(incoming?.receiptKey) !== `MONTAGE_SHIPMENT_RECEIPT|${sanalTaksimText(current?.id)}`
    || !sanalTaksimText(incoming?.targetLocationId)
    || sanalTaksimSemanticStringify(sanalTaksimMgsReceiptImmutableCore(current))
      !== sanalTaksimSemanticStringify(sanalTaksimMgsReceiptImmutableCore(incoming))) return false;
  const effectiveCurrent = SanalTaksimResolver.resolveMontageShipmentOperationalTarget(current);
  const effectiveIncoming = SanalTaksimResolver.resolveMontageShipmentOperationalTarget(incoming);
  if (!effectiveCurrent?.ok || effectiveCurrent?.rebound !== true
    || !effectiveIncoming?.ok || effectiveIncoming?.rebound !== true
    || sanalTaksimSemanticStringify(effectiveCurrent.target)
      !== sanalTaksimSemanticStringify(effectiveIncoming.target)
    || !sanalTaksimReceiptTargetExists(incomingData, effectiveIncoming.target)
    || !sanalTaksimReceiptOwnershipMatches(incoming?.receiptOwnership, incoming, effectiveIncoming)) return false;

  const currentStocks = Array.isArray(currentData?.stockDepotItems) ? currentData.stockDepotItems : [];
  const incomingStocks = Array.isArray(incomingData?.stockDepotItems) ? incomingData.stockDepotItems : [];
  const currentStockIds = new Set(currentStocks.map((row) => sanalTaksimText(row?.id)));
  if (currentStockIds.size !== currentStocks.length
    || new Set(incomingStocks.map((row) => sanalTaksimText(row?.id))).size !== incomingStocks.length) return false;
  const allocationSpecs = [];
  const parts = Array.isArray(current?.parts) ? current.parts : [];
  for (const part of parts) {
    for (const allocation of (Array.isArray(part?.allocations) ? part.allocations : [])) {
      const stockRowId = sanalTaksimText(allocation?.stockRowId || allocation?.stockDepotItemId);
      const qty = Number(allocation?.qty);
      const ranges = Array.isArray(allocation?.segmentRanges) ? allocation.segmentRanges : [];
      if (!stockRowId || !sanalTaksimIsPositiveQty(qty) || !ranges.length
        || ranges.some((range) => !sanalTaksimText(range?.reservationKey)
          || sanalTaksimText(range?.stockRowId) !== stockRowId
          || sanalTaksimText(range?.physicalSegmentId) !== `STOCK|${stockRowId}`)) return false;
      allocationSpecs.push({ part, allocation, stockRowId, qty });
    }
  }
  if (!allocationSpecs.length) return false;
  const sourceQtyByRow = new Map();
  allocationSpecs.forEach((spec) => sourceQtyByRow.set(
    spec.stockRowId,
    Number(((sourceQtyByRow.get(spec.stockRowId) || 0) + spec.qty).toFixed(6))
  ));
  const activeInstructions = (Array.isArray(currentData?.sanalTaksimAllocationInstructions)
    ? currentData.sanalTaksimAllocationInstructions : []).filter((row) => sanalTaksimCode(row?.status) === "ACTIVE");
  if (activeInstructions.some((instruction) => (Array.isArray(instruction?.slices) ? instruction.slices : [])
    .some((slice) => sourceQtyByRow.has(sanalTaksimText(slice?.stockRowId))))) return false;
  for (const currentRow of currentStocks) {
    const rowId = sanalTaksimText(currentRow?.id);
    const matches = incomingStocks.filter((row) => sanalTaksimText(row?.id) === rowId);
    if (matches.length !== 1) return false;
    const incomingRow = matches[0];
    if (!sourceQtyByRow.has(rowId)) {
      if (sanalTaksimSemanticStringify(currentRow) !== sanalTaksimSemanticStringify(incomingRow)) return false;
      continue;
    }
    const currentQty = sanalTaksimGetQty(currentRow);
    const incomingQty = sanalTaksimGetQty(incomingRow);
    if (currentQty === null || incomingQty === null
      || !sanalTaksimSameQty(incomingQty, currentQty - sourceQtyByRow.get(rowId))
      || incomingQty < -sanalTaksimQtyEpsilon
      || sanalTaksimSemanticStringify(sanalTaksimStockCoreWithoutQty(currentRow))
        !== sanalTaksimSemanticStringify(sanalTaksimStockCoreWithoutQty(incomingRow))) return false;
  }
  const newStocks = incomingStocks.filter((row) => !currentStockIds.has(sanalTaksimText(row?.id)));
  if (newStocks.length !== parts.length) return false;
  const receiptOwnership = incoming.receiptOwnership;
  const target = receiptOwnership.target;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const receiptLineKey = `${incoming.receiptKey}|${index}|${sanalTaksimText(part?.refId)}|${sanalTaksimCode(part?.code)}`;
    const matches = newStocks.filter((row) => sanalTaksimText(row?.receiptLineKey) === receiptLineKey);
    if (matches.length !== 1) return false;
    const row = matches[0];
    if (sanalTaksimText(row?.sourceShipmentId || row?.shipmentId) !== sanalTaksimText(incoming?.id)
      || sanalTaksimText(row?.receiptKey) !== sanalTaksimText(incoming?.receiptKey)
      || sanalTaksimText(row?.refId || row?.productId) !== sanalTaksimText(part?.refId)
      || sanalTaksimCode(row?.productCode || row?.code) !== sanalTaksimCode(part?.code)
      || sanalTaksimCode(row?.unit) !== sanalTaksimCode(part?.unit)
      || !sanalTaksimSameQty(sanalTaksimGetQty(row), part?.shippedQty)
      || sanalTaksimText(row?.depotId) !== "unit:u3"
      || sanalTaksimText(row?.locationId) !== sanalTaksimText(incoming?.targetLocationId)
      || sanalTaksimCode(row?.status) !== "MONTAGE_RECEIVED_AWAITING_START"
      || sanalTaksimSemanticStringify(row?.receiptOwnership) !== sanalTaksimSemanticStringify(receiptOwnership)
      || ["sourceOrderId", "sourceLineId", "demandId", "itemKey"].some((key) =>
        sanalTaksimText(row?.[key]) !== sanalTaksimText(target?.[key]))) return false;
  }

  const currentMovements = Array.isArray(currentData?.stock_movements) ? currentData.stock_movements : [];
  const incomingMovements = Array.isArray(incomingData?.stock_movements) ? incomingData.stock_movements : [];
  const currentMovementIds = new Set(currentMovements.map((row) => sanalTaksimText(row?.id)));
  if (currentMovementIds.size !== currentMovements.length
    || currentMovements.some((row) => {
      const incomingRow = incomingMovements.find((candidate) => sanalTaksimText(candidate?.id) === sanalTaksimText(row?.id));
      return !incomingRow || sanalTaksimSemanticStringify(row) !== sanalTaksimSemanticStringify(incomingRow);
    })) return false;
  const newMovements = incomingMovements.filter((row) => !currentMovementIds.has(sanalTaksimText(row?.id)));
  if (newMovements.length !== allocationSpecs.length + parts.length) return false;
  const incomingAllocationByKey = new Map(
    (Array.isArray(incoming?.parts) ? incoming.parts : [])
      .flatMap((part) => Array.isArray(part?.allocations) ? part.allocations : [])
      .map((allocation) => [sanalTaksimText(allocation?.idempotencyKey), allocation])
  );
  for (const spec of allocationSpecs) {
    const incomingAllocation = incomingAllocationByKey.get(sanalTaksimText(spec.allocation?.idempotencyKey));
    const movementId = sanalTaksimText(incomingAllocation?.stockMovementId);
    const matches = newMovements.filter((row) => sanalTaksimText(row?.id) === movementId
      && sanalTaksimCode(row?.movementType || row?.type) === "MONTAGE_DISPATCH_OUT");
    if (matches.length !== 1
      || sanalTaksimText(matches[0]?.shipmentId) !== sanalTaksimText(incoming?.id)
      || sanalTaksimText(matches[0]?.stockDepotItemId) !== spec.stockRowId
      || !sanalTaksimSameQty(matches[0]?.qty ?? matches[0]?.quantity, spec.qty)
      || sanalTaksimText(matches[0]?.physicalSegmentId) !== sanalTaksimText(spec.allocation?.physicalSegmentId)
      || sanalTaksimSemanticStringify(matches[0]?.exactReservationKeys || [])
        !== sanalTaksimSemanticStringify(spec.allocation?.exactReservationKeys || [])) return false;
  }
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const receiptLineKey = `${incoming.receiptKey}|${index}|${sanalTaksimText(part?.refId)}|${sanalTaksimCode(part?.code)}`;
    const expectedSourceIds = (Array.isArray(part?.allocations) ? part.allocations : [])
      .map((allocation) => sanalTaksimText(
        incomingAllocationByKey.get(sanalTaksimText(allocation?.idempotencyKey))?.stockMovementId
      ));
    const matches = newMovements.filter((row) => sanalTaksimCode(row?.movementType || row?.type) === "MONTAGE_DISPATCH_RECEIPT"
      && sanalTaksimText(row?.receiptLineKey) === receiptLineKey);
    if (matches.length !== 1
      || sanalTaksimText(matches[0]?.shipmentId) !== sanalTaksimText(incoming?.id)
      || !sanalTaksimSameQty(matches[0]?.qty ?? matches[0]?.quantity, part?.shippedQty)
      || sanalTaksimSemanticStringify(matches[0]?.sourceMovementIds || [])
        !== sanalTaksimSemanticStringify(expectedSourceIds)
      || sanalTaksimSemanticStringify(matches[0]?.receiptOwnership) !== sanalTaksimSemanticStringify(receiptOwnership)
      || ["sourceOrderId", "sourceLineId", "demandId", "itemKey"].some((key) =>
        sanalTaksimText(matches[0]?.[key]) !== sanalTaksimText(target?.[key]))) return false;
  }

  const currentLocations = Array.isArray(currentData?.stockDepotLocations) ? currentData.stockDepotLocations : [];
  const incomingLocations = Array.isArray(incomingData?.stockDepotLocations) ? incomingData.stockDepotLocations : [];
  if (incomingLocations.length < currentLocations.length || incomingLocations.length > currentLocations.length + 1
    || currentLocations.some((row) => {
      const incomingRow = incomingLocations.find((candidate) => sanalTaksimText(candidate?.id) === sanalTaksimText(row?.id));
      return !incomingRow || sanalTaksimSemanticStringify(row) !== sanalTaksimSemanticStringify(incomingRow);
    })) return false;
  const locationMatches = incomingLocations.filter((row) =>
    sanalTaksimText(row?.id) === sanalTaksimText(incoming?.targetLocationId)
    && sanalTaksimText(row?.depotId) === "unit:u3"
    && sanalTaksimCode(row?.purpose) === "MONTAGE_DISPATCH_RECEIPT");
  return locationMatches.length === 1;
}

function validateSanalTaksimInTransitMgsOperationalRebindTransitions(currentState, incomingState) {
  const currentData = getStateDataRoot(currentState);
  const incomingData = getStateDataRoot(incomingState);
  const currentRows = Array.isArray(currentData?.montageDispatchShipments)
    ? currentData.montageDispatchShipments : [];
  const incomingRows = Array.isArray(incomingData?.montageDispatchShipments)
    ? incomingData.montageDispatchShipments : [];
  const currentById = new Map(currentRows.map((row) => [sanalTaksimText(row?.id), row]));
  const trackedChange = incomingRows.some((incoming) => {
    const current = currentById.get(sanalTaksimText(incoming?.id));
    const currentEvents = Array.isArray(current?.operationalRebindEvents) ? current.operationalRebindEvents : [];
    const incomingEvents = Array.isArray(incoming?.operationalRebindEvents) ? incoming.operationalRebindEvents : [];
    return incomingEvents.length > 0
      && (!current || sanalTaksimSemanticStringify(sanalTaksimMgsTransitionCore(current))
        !== sanalTaksimSemanticStringify(sanalTaksimMgsTransitionCore(incoming)))
      || currentEvents.length > 0
        && (!incoming || sanalTaksimSemanticStringify(sanalTaksimMgsTransitionCore(current))
          !== sanalTaksimSemanticStringify(sanalTaksimMgsTransitionCore(incoming)));
  }) || currentRows.some((current) => {
    if (!Array.isArray(current?.operationalRebindEvents) || current.operationalRebindEvents.length === 0) return false;
    return !incomingRows.some((incoming) => sanalTaksimText(incoming?.id) === sanalTaksimText(current?.id));
  });
  if (!trackedChange) return [];
  return isSanalTaksimInTransitMgsOperationalRebind(currentState, incomingState)
    || isSanalTaksimReboundMgsAtomicReceipt(currentState, incomingState)
    ? []
    : ["IN_TRANSIT MGS operational rebind yalnız tek append-only event ile; rebound receive yalnız doğrulanmış ownership ve atomik stok/movement geçişiyle yapılabilir."];
}

function validateSanalTaksimPlanBoundMontageLinks(state) {
  const data = getStateDataRoot(state);
  const instructions = Array.isArray(data?.sanalTaksimAllocationInstructions)
    ? data.sanalTaksimAllocationInstructions : [];
  const plans = Array.isArray(data?.montageDispatchPlans) ? data.montageDispatchPlans : [];
  const issues = [];
  const linkedSliceKeys = new Set();
  const linkedReservationKeys = new Set();

  instructions.forEach((instruction) => {
    const slices = Array.isArray(instruction?.slices) ? instruction.slices : [];
    const boundSlices = slices.filter((slice) => sanalTaksimText(slice?.planId)
      || sanalTaksimText(slice?.reservationKey));
    if (!boundSlices.length) return;
    const label = sanalTaksimText(instruction?.instructionCode || instruction?.id || "Instruction");
    if (boundSlices.length !== slices.length) {
      issues.push(`${label}: plan-bound instruction bütün dilimlerinde planId ve reservationKey taşımalıdır.`);
    }
    const boundPlanIds = new Set();
    boundSlices.forEach((slice) => {
      const planId = sanalTaksimText(slice?.planId);
      const reservationKey = sanalTaksimText(slice?.reservationKey);
      const linkKey = `${planId}|${reservationKey}`;
      if (!planId || !reservationKey || linkedSliceKeys.has(linkKey)) {
        issues.push(`${label}: plan-bound dilim bağı eksik veya mükerrerdir.`);
        return;
      }
      linkedSliceKeys.add(linkKey);
      boundPlanIds.add(planId);
      const planMatches = plans.filter((plan) => sanalTaksimText(plan?.id) === planId);
      const plan = planMatches.length === 1 ? planMatches[0] : null;
      const reservationMatches = plan
        ? (Array.isArray(plan?.exactReservations) ? plan.exactReservations : [])
          .filter((reservation) => sanalTaksimText(reservation?.reservationKey) === reservationKey)
        : [];
      if (!plan || reservationMatches.length !== 1
        || !sanalTaksimIsExactPlanBoundPair(instruction, slice, plan, reservationMatches[0])) {
        issues.push(`${label}: MGP exact rezerviyle birebir plan-bound bağ doğrulanamadı.`);
      }
    });
    if (boundPlanIds.size !== 1) {
      issues.push(`${label}: bir instruction yalnız tek bir MGP kaydına bağlanabilir.`);
    }
  });

  plans.forEach((plan) => {
    const reservations = Array.isArray(plan?.exactReservations) ? plan.exactReservations : [];
    const boundReservations = reservations.filter((reservation) =>
      sanalTaksimText(reservation?.instructionId) || sanalTaksimText(reservation?.instructionSliceKey));
    if (!boundReservations.length) return;
    const label = sanalTaksimText(plan?.planNo || plan?.id || "MGP");
    const linkedInstructions = [];
    if (boundReservations.length !== reservations.length) {
      issues.push(`${label}: plan-bound MGP bütün exact rezervlerinde instruction bağı taşımalıdır.`);
    }
    boundReservations.forEach((reservation) => {
      const instructionId = sanalTaksimText(reservation?.instructionId);
      const instructionSliceKey = sanalTaksimText(reservation?.instructionSliceKey);
      const reservationKey = sanalTaksimText(reservation?.reservationKey);
      const linkKey = `${sanalTaksimText(plan?.id)}|${reservationKey}`;
      if (!instructionId || !instructionSliceKey || !reservationKey || linkedReservationKeys.has(linkKey)) {
        issues.push(`${label}: plan-bound exact rezerv bağı eksik veya mükerrerdir.`);
        return;
      }
      linkedReservationKeys.add(linkKey);
      const instructionMatches = instructions.filter((instruction) => sanalTaksimText(instruction?.id) === instructionId);
      const instruction = instructionMatches.length === 1 ? instructionMatches[0] : null;
      const sliceMatches = instruction
        ? (Array.isArray(instruction?.slices) ? instruction.slices : [])
          .filter((slice) => sanalTaksimText(slice?.sliceKey) === instructionSliceKey)
        : [];
      if (!instruction || sliceMatches.length !== 1
        || !sanalTaksimIsExactPlanBoundPair(instruction, sliceMatches[0], plan, reservation)) {
        issues.push(`${label}: instruction exact dilimiyle birebir plan-bound bağ doğrulanamadı.`);
      } else {
        linkedInstructions.push(instruction);
      }
    });
    const planStatus = sanalTaksimCode(plan?.status);
    const expectedInstructionStatus = planStatus === "DRAFT"
      ? "ACTIVE"
      : planStatus === "CANCELLED"
        ? "CANCELLED"
        : planStatus === "DISPATCHED_TO_MONTAGE"
          ? "COMPLETED"
          : "";
    if (!expectedInstructionStatus || !linkedInstructions.length
      || linkedInstructions.some((instruction) =>
        sanalTaksimCode(instruction?.status) !== expectedInstructionStatus)) {
      issues.push(`${label}: MGP ve plan-bound instruction yaşam döngüsü durumları uyuşmuyor.`);
    }
    const linkedShipments = (Array.isArray(data?.montageDispatchShipments)
      ? data.montageDispatchShipments : [])
      .filter((shipment) => sanalTaksimText(shipment?.planId) === sanalTaksimText(plan?.id)
        && !["CANCELLED", "REJECTED"].includes(sanalTaksimCode(shipment?.status)));
    if (planStatus === "DISPATCHED_TO_MONTAGE") {
      if (linkedShipments.length !== 1
        || !sanalTaksimShipmentTransfersPlanBoundReservations(plan, linkedShipments[0])) {
        issues.push(`${label}: plan-bound exact rezervler tek bir MGS yaşam döngüsüne devredilmelidir.`);
      }
    } else if (linkedShipments.length) {
      issues.push(`${label}: DRAFT/CANCELLED plan-bound MGP aktif MGS kaydı taşıyamaz.`);
    }
  });
  return Array.from(new Set(issues));
}

function isSanalTaksimPlanBoundMontageAtomicCreate(currentState, incomingState) {
  const currentData = getStateDataRoot(currentState);
  const incomingData = getStateDataRoot(incomingState);
  const currentInstructions = Array.isArray(currentData?.sanalTaksimAllocationInstructions)
    ? currentData.sanalTaksimAllocationInstructions : [];
  const incomingInstructions = Array.isArray(incomingData?.sanalTaksimAllocationInstructions)
    ? incomingData.sanalTaksimAllocationInstructions : [];
  const currentPlans = Array.isArray(currentData?.montageDispatchPlans) ? currentData.montageDispatchPlans : [];
  const incomingPlans = Array.isArray(incomingData?.montageDispatchPlans) ? incomingData.montageDispatchPlans : [];
  const currentInstructionIds = new Set(currentInstructions.map((row) => sanalTaksimText(row?.id)));
  const currentPlanIds = new Set(currentPlans.map((row) => sanalTaksimText(row?.id)));
  const newInstructions = incomingInstructions.filter((row) => !currentInstructionIds.has(sanalTaksimText(row?.id)));
  const newPlans = incomingPlans.filter((row) => !currentPlanIds.has(sanalTaksimText(row?.id)));
  if (!newInstructions.length || newPlans.length !== 1
    || incomingInstructions.length !== currentInstructions.length + newInstructions.length
    || incomingPlans.length !== currentPlans.length + 1) return false;
  if (currentInstructions.some((current) => {
    const incoming = incomingInstructions.find((row) => sanalTaksimText(row?.id) === sanalTaksimText(current?.id));
    return !incoming || JSON.stringify(incoming) !== JSON.stringify(current);
  })) return false;
  if (currentPlans.some((current) => {
    const incoming = incomingPlans.find((row) => sanalTaksimText(row?.id) === sanalTaksimText(current?.id));
    return !incoming || JSON.stringify(incoming) !== JSON.stringify(current);
  })) return false;

  const currentOtherData = { ...currentData };
  const incomingOtherData = { ...incomingData };
  delete currentOtherData.sanalTaksimAllocationInstructions;
  delete incomingOtherData.sanalTaksimAllocationInstructions;
  delete currentOtherData.montageDispatchPlans;
  delete incomingOtherData.montageDispatchPlans;
  if (JSON.stringify(currentOtherData) !== JSON.stringify(incomingOtherData)) return false;

  const newPlan = newPlans[0];
  const planId = sanalTaksimText(newPlan?.id);
  const reservations = Array.isArray(newPlan?.exactReservations) ? newPlan.exactReservations : [];
  if (!planId || sanalTaksimCode(newPlan?.status) !== "DRAFT" || !reservations.length) return false;
  const newInstructionIds = new Set(newInstructions.map((row) => sanalTaksimText(row?.id)));
  if (newInstructionIds.size !== newInstructions.length) return false;
  if (newInstructions.some((instruction) => sanalTaksimCode(instruction?.status) !== "ACTIVE"
    || !Array.isArray(instruction?.events) || instruction.events.length !== 0
    || !(Array.isArray(instruction?.slices) && instruction.slices.length)
    || instruction.slices.some((slice) => sanalTaksimText(slice?.planId) !== planId))) return false;
  if (reservations.some((reservation) => !newInstructionIds.has(sanalTaksimText(reservation?.instructionId)))) return false;
  const allSlices = newInstructions.flatMap((instruction) => instruction.slices.map((slice) => ({ instruction, slice })));
  if (allSlices.length !== reservations.length) return false;
  return allSlices.every(({ instruction, slice }) => {
    const matches = reservations.filter((reservation) =>
      sanalTaksimText(reservation?.reservationKey) === sanalTaksimText(slice?.reservationKey)
      && sanalTaksimText(reservation?.instructionId) === sanalTaksimText(instruction?.id)
      && sanalTaksimText(reservation?.instructionSliceKey) === sanalTaksimText(slice?.sliceKey));
    return matches.length === 1 && sanalTaksimIsExactPlanBoundPair(instruction, slice, newPlan, matches[0]);
  });
}

function isSanalTaksimPlanBoundMontageAtomicCancel(currentState, incomingState) {
  const currentData = getStateDataRoot(currentState);
  const incomingData = getStateDataRoot(incomingState);
  const currentPlans = Array.isArray(currentData?.montageDispatchPlans) ? currentData.montageDispatchPlans : [];
  const incomingPlans = Array.isArray(incomingData?.montageDispatchPlans) ? incomingData.montageDispatchPlans : [];
  const currentInstructions = Array.isArray(currentData?.sanalTaksimAllocationInstructions)
    ? currentData.sanalTaksimAllocationInstructions : [];
  const incomingInstructions = Array.isArray(incomingData?.sanalTaksimAllocationInstructions)
    ? incomingData.sanalTaksimAllocationInstructions : [];
  if (currentPlans.length !== incomingPlans.length
    || currentInstructions.length !== incomingInstructions.length
    || !sanalTaksimSameCollectionsExcept(currentData, incomingData, [
      "montageDispatchPlans", "sanalTaksimAllocationInstructions",
    ])) return false;
  const changedPlans = currentPlans.map((current) => ({
    current,
    incoming: incomingPlans.find((row) => sanalTaksimText(row?.id) === sanalTaksimText(current?.id)),
  })).filter(({ current, incoming }) => !incoming || JSON.stringify(current) !== JSON.stringify(incoming));
  if (changedPlans.length !== 1 || incomingPlans.some((incoming) =>
    !currentPlans.some((current) => sanalTaksimText(current?.id) === sanalTaksimText(incoming?.id)))) return false;
  const { current: currentPlan, incoming: incomingPlan } = changedPlans[0];
  if (!incomingPlan || sanalTaksimCode(currentPlan?.status) !== "DRAFT"
    || sanalTaksimCode(incomingPlan?.status) !== "CANCELLED"
    || !sanalTaksimIsIsoDate(incomingPlan?.cancelledAt)
    || !sanalTaksimIsIsoDate(incomingPlan?.updatedAt)) return false;
  const currentPlanCore = { ...currentPlan };
  const incomingPlanCore = { ...incomingPlan };
  ["status", "cancelledAt", "updatedAt"].forEach((key) => {
    delete currentPlanCore[key];
    delete incomingPlanCore[key];
  });
  if (JSON.stringify(currentPlanCore) !== JSON.stringify(incomingPlanCore)) return false;
  const currentBundle = sanalTaksimGetPlanBoundMontageBundle(currentData, currentPlan, "ACTIVE");
  const incomingBundle = sanalTaksimGetPlanBoundMontageBundle(incomingData, incomingPlan, "CANCELLED");
  if (!currentBundle || !incomingBundle) return false;
  const boundIds = new Set(currentBundle.instructions.map((row) => sanalTaksimText(row?.id)));
  if (boundIds.size !== incomingBundle.instructions.length
    || incomingBundle.instructions.some((row) => !boundIds.has(sanalTaksimText(row?.id)))) return false;
  const changedInstructionIds = new Set();
  for (const current of currentInstructions) {
    const incoming = incomingInstructions.find((row) => sanalTaksimText(row?.id) === sanalTaksimText(current?.id));
    if (!incoming) return false;
    if (JSON.stringify(current) === JSON.stringify(incoming)) continue;
    changedInstructionIds.add(sanalTaksimText(current?.id));
    if (!boundIds.has(sanalTaksimText(current?.id))
      || !sanalTaksimInstructionLifecycleAppendMatches(current, incoming, "CANCELLED")) return false;
  }
  return changedInstructionIds.size === boundIds.size
    && Array.from(boundIds).every((id) => changedInstructionIds.has(id))
    && validateSanalTaksimPlanBoundMontageLinks(incomingState).length === 0;
}

function isSanalTaksimDraftPlanBoundAtomicRebind(currentState, incomingState) {
  const currentData = getStateDataRoot(currentState);
  const incomingData = getStateDataRoot(incomingState);
  const currentPlans = Array.isArray(currentData?.montageDispatchPlans) ? currentData.montageDispatchPlans : [];
  const incomingPlans = Array.isArray(incomingData?.montageDispatchPlans) ? incomingData.montageDispatchPlans : [];
  const currentInstructions = Array.isArray(currentData?.sanalTaksimAllocationInstructions)
    ? currentData.sanalTaksimAllocationInstructions : [];
  const incomingInstructions = Array.isArray(incomingData?.sanalTaksimAllocationInstructions)
    ? incomingData.sanalTaksimAllocationInstructions : [];
  if (incomingPlans.length !== currentPlans.length + 1
    || incomingInstructions.length <= currentInstructions.length
    || !sanalTaksimSameCollectionsExcept(currentData, incomingData, [
      "montageDispatchPlans", "sanalTaksimAllocationInstructions",
    ])) return false;

  const currentPlanIds = new Set(currentPlans.map((row) => sanalTaksimText(row?.id)));
  const currentInstructionIds = new Set(currentInstructions.map((row) => sanalTaksimText(row?.id)));
  const newPlans = incomingPlans.filter((row) => !currentPlanIds.has(sanalTaksimText(row?.id)));
  const newInstructions = incomingInstructions.filter((row) =>
    !currentInstructionIds.has(sanalTaksimText(row?.id)));
  if (newPlans.length !== 1 || !newInstructions.length) return false;
  const targetPlan = newPlans[0];
  const targetAudit = isPlainObject(targetPlan?.rebindAudit) ? targetPlan.rebindAudit : null;
  const targetPlanId = sanalTaksimText(targetPlan?.id);
  const sourcePlanId = sanalTaksimText(targetAudit?.sourcePlanId);
  const rebindKey = sanalTaksimText(targetAudit?.rebindKey);
  const partialWholePlanCancel = Number(targetAudit?.contractVersion) === 2
    && sanalTaksimCode(targetAudit?.mode) === "WHOLE_SOURCE_PARTIAL_TARGET_V1"
    && targetAudit?.cancelWholeSourcePlan === true;
  if (!targetAudit || sanalTaksimCode(targetAudit?.role) !== "TARGET"
    || !(Number(targetAudit?.contractVersion) === 1 || partialWholePlanCancel)
    || !targetPlanId || sanalTaksimText(targetAudit?.targetPlanId) !== targetPlanId
    || !sourcePlanId || sourcePlanId === targetPlanId
    || !(partialWholePlanCancel
      ? rebindKey.startsWith(`D2C1A_PARTIAL_REBIND|${sourcePlanId}|${targetPlanId}|`)
      : rebindKey.startsWith(`D2C1A_REBIND|${sourcePlanId}|${targetPlanId}|`))
    || sanalTaksimCode(targetPlan?.status) !== "DRAFT"
    || !sanalTaksimIsIsoDate(targetAudit?.at)
    || !sanalTaksimText(targetAudit?.by)
    || !sanalTaksimText(targetAudit?.reason)
    || !sanalTaksimIsPositiveQty(targetAudit?.qty)
    || (partialWholePlanCancel && (!Number.isSafeInteger(Number(targetAudit?.sourcePlanQty))
      || !Number.isSafeInteger(Number(targetAudit?.requestedTargetQty))
      || Number(targetAudit.sourcePlanQty) <= Number(targetAudit.requestedTargetQty)
      || !sanalTaksimSameQty(targetAudit?.qty, targetAudit?.requestedTargetQty)
      || !sanalTaksimSameQty(targetAudit?.releasedSetQty,
        Number(targetAudit.sourcePlanQty) - Number(targetAudit.requestedTargetQty))))
    || !Array.isArray(targetAudit?.exactReservations)
    || !targetAudit.exactReservations.length) return false;

  const sourcePlanMatches = currentPlans.filter((row) => sanalTaksimText(row?.id) === sourcePlanId);
  const incomingSourceMatches = incomingPlans.filter((row) => sanalTaksimText(row?.id) === sourcePlanId);
  if (sourcePlanMatches.length !== 1 || incomingSourceMatches.length !== 1) return false;
  const sourcePlan = sourcePlanMatches[0];
  const incomingSourcePlan = incomingSourceMatches[0];
  const sourceAudit = isPlainObject(incomingSourcePlan?.rebindAudit) ? incomingSourcePlan.rebindAudit : null;
  const withoutRole = (audit) => {
    const value = { ...(audit || {}) };
    delete value.role;
    return value;
  };
  if (!sourceAudit || sanalTaksimCode(sourceAudit?.role) !== "SOURCE"
    || JSON.stringify(withoutRole(sourceAudit)) !== JSON.stringify(withoutRole(targetAudit))
    || sanalTaksimCode(sourcePlan?.status) !== "DRAFT"
    || sourcePlan?.rebindAudit != null
    || sanalTaksimCode(incomingSourcePlan?.status) !== "CANCELLED"
    || !sanalTaksimIsIsoDate(incomingSourcePlan?.cancelledAt)
    || !sanalTaksimIsIsoDate(incomingSourcePlan?.updatedAt)) return false;
  const sourceItems = Array.isArray(sourcePlan?.items) ? sourcePlan.items : [];
  const targetItems = Array.isArray(targetPlan?.items) ? targetPlan.items : [];
  if (sourceItems.length !== 1 || targetItems.length !== 1) return false;
  const sourceItem = sourceItems[0];
  const targetItem = targetItems[0];
  const sourceIdentity = {
    orderId: sanalTaksimText(sourceItem?.sourceOrderId),
    lineId: sanalTaksimText(sourceItem?.sourceLineId),
    demandId: sanalTaksimText(sourceItem?.demandId),
    itemKey: sanalTaksimText(sourceItem?.itemKey),
  };
  const targetIdentity = {
    orderId: sanalTaksimText(targetItem?.sourceOrderId),
    lineId: sanalTaksimText(targetItem?.sourceLineId),
    demandId: sanalTaksimText(targetItem?.demandId),
    itemKey: sanalTaksimText(targetItem?.itemKey),
  };
  const productFingerprint = (item) => [
    sanalTaksimText(item?.productId),
    sanalTaksimText(item?.variantId || item?.variationId),
    sanalTaksimCode(item?.variantCode),
  ];
  const recipeFingerprint = (item) => {
    const totals = new Map();
    for (const part of (Array.isArray(item?.recipeParts) ? item.recipeParts : [])) {
      const prcId = sanalTaksimText(part?.refId || part?.prcId);
      const prcCode = sanalTaksimCode(part?.code || part?.prcCode);
      const unit = sanalTaksimCode(part?.unit);
      const qtyPerSet = Number(part?.qtyPerSet);
      if (!prcId || !prcCode || !unit || !sanalTaksimIsPositiveQty(qtyPerSet)) return "";
      const key = `${prcId}|${prcCode}|${unit}`;
      totals.set(key, Number(((totals.get(key) || 0) + qtyPerSet).toFixed(6)));
    }
    return Array.from(totals.entries()).sort((left, right) => left[0].localeCompare(right[0], "tr"))
      .map(([key, qty]) => `${key}|${qty}`).join(";");
  };
  if (sanalTaksimCode(sourceItem?.sourceType) !== "SALES_ORDER"
    || sanalTaksimCode(targetItem?.sourceType) !== "SALES_ORDER"
    || Object.values(sourceIdentity).some((value) => !value)
    || Object.values(targetIdentity).some((value) => !value)
    || sourceIdentity.orderId === targetIdentity.orderId
    || (partialWholePlanCancel && (productFingerprint(sourceItem).some((value) => !value)
      || JSON.stringify(productFingerprint(sourceItem)) !== JSON.stringify(productFingerprint(targetItem))))
    || (partialWholePlanCancel
      ? !sanalTaksimSameQty(sourceItem?.plannedQty, targetAudit?.sourcePlanQty)
        || !sanalTaksimSameQty(targetItem?.plannedQty, targetAudit?.requestedTargetQty)
        || Number(sourceItem?.plannedQty) <= Number(targetItem?.plannedQty)
      : !sanalTaksimSameQty(sourceItem?.plannedQty, targetItem?.plannedQty))
    || !sanalTaksimSameQty(targetItem?.plannedQty, targetAudit?.qty)
    || !recipeFingerprint(sourceItem)
    || recipeFingerprint(sourceItem) !== recipeFingerprint(targetItem)
    || JSON.stringify(targetAudit?.sourceOrderIds) !== JSON.stringify([sourceIdentity.orderId])
    || JSON.stringify(targetAudit?.sourceLineIds) !== JSON.stringify([sourceIdentity.lineId])
    || JSON.stringify(targetAudit?.sourceDemandIds) !== JSON.stringify([sourceIdentity.demandId])
    || JSON.stringify(targetAudit?.sourceItemKeys) !== JSON.stringify([sourceIdentity.itemKey])
    || sanalTaksimText(targetAudit?.targetOrderId) !== targetIdentity.orderId
    || sanalTaksimText(targetAudit?.targetLineId) !== targetIdentity.lineId
    || sanalTaksimText(targetAudit?.targetDemandId) !== targetIdentity.demandId
    || sanalTaksimText(targetAudit?.targetItemKey) !== targetIdentity.itemKey) return false;
  const currentSourceCore = { ...sourcePlan };
  const incomingSourceCore = { ...incomingSourcePlan };
  ["status", "cancelledAt", "updatedAt", "rebindAudit"].forEach((key) => {
    delete currentSourceCore[key];
    delete incomingSourceCore[key];
  });
  if (JSON.stringify(currentSourceCore) !== JSON.stringify(incomingSourceCore)) return false;

  const currentBundle = sanalTaksimGetPlanBoundMontageBundle(currentData, sourcePlan, "ACTIVE");
  const cancelledBundle = sanalTaksimGetPlanBoundMontageBundle(incomingData, incomingSourcePlan, "CANCELLED");
  const targetBundle = sanalTaksimGetPlanBoundMontageBundle(incomingData, targetPlan, "ACTIVE");
  if (!currentBundle || !cancelledBundle || !targetBundle) return false;
  const sourceInstructionIds = new Set(currentBundle.instructions.map((row) => sanalTaksimText(row?.id)));
  const newInstructionIds = new Set(newInstructions.map((row) => sanalTaksimText(row?.id)));
  if (sourceInstructionIds.size !== cancelledBundle.instructions.length
    || cancelledBundle.instructions.some((row) => !sourceInstructionIds.has(sanalTaksimText(row?.id)))
    || newInstructionIds.size !== newInstructions.length
    || targetBundle.instructions.length !== newInstructions.length
    || targetBundle.instructions.some((row) => !newInstructionIds.has(sanalTaksimText(row?.id)))) return false;

  const changedOldInstructionIds = new Set();
  for (const current of currentInstructions) {
    const incoming = incomingInstructions.find((row) => sanalTaksimText(row?.id) === sanalTaksimText(current?.id));
    if (!incoming) return false;
    if (JSON.stringify(current) === JSON.stringify(incoming)) continue;
    const instructionId = sanalTaksimText(current?.id);
    changedOldInstructionIds.add(instructionId);
    const events = Array.isArray(incoming?.events) ? incoming.events : [];
    const event = events[events.length - 1];
    if (!sourceInstructionIds.has(instructionId)
      || !sanalTaksimInstructionLifecycleAppendMatches(current, incoming, "CANCELLED")
      || sanalTaksimText(event?.rebindKey) !== rebindKey
      || sanalTaksimText(event?.sourcePlanId) !== sourcePlanId
      || sanalTaksimText(event?.targetPlanId) !== targetPlanId) return false;
  }
  if (changedOldInstructionIds.size !== sourceInstructionIds.size
    || Array.from(sourceInstructionIds).some((id) => !changedOldInstructionIds.has(id))) return false;
  if (newInstructions.some((instruction) => {
    const audit = isPlainObject(instruction?.rebindAudit) ? instruction.rebindAudit : null;
    return sanalTaksimCode(instruction?.status) !== "ACTIVE"
      || !Array.isArray(instruction?.events) || instruction.events.length !== 0
      || !audit || sanalTaksimCode(audit?.role) !== "TARGET"
      || sanalTaksimText(audit?.rebindKey) !== rebindKey
      || sanalTaksimText(audit?.sourcePlanId) !== sourcePlanId
      || sanalTaksimText(audit?.targetPlanId) !== targetPlanId;
  })) return false;

  const currentSourceReservations = currentBundle.reservations;
  const targetReservations = targetBundle.reservations;
  const auditRows = targetAudit.exactReservations;
  const exactTotalsMatchPlan = (reservations, item) => {
    const expected = new Map();
    const actual = new Map();
    for (const part of (Array.isArray(item?.recipeParts) ? item.recipeParts : [])) {
      const key = `${sanalTaksimText(part?.refId || part?.prcId)}|${sanalTaksimCode(part?.code || part?.prcCode)}|${sanalTaksimCode(part?.unit)}`;
      const qty = Number(part?.qtyPerSet) * Number(item?.plannedQty);
      if (!key || !sanalTaksimIsPositiveQty(qty)) return false;
      expected.set(key, Number(((expected.get(key) || 0) + qty).toFixed(6)));
    }
    for (const reservation of reservations) {
      const key = `${sanalTaksimText(reservation?.prcId)}|${sanalTaksimCode(reservation?.prcCode)}|${sanalTaksimCode(reservation?.unit)}`;
      if (!sanalTaksimIsPositiveQty(reservation?.qty)) return false;
      actual.set(key, Number(((actual.get(key) || 0) + Number(reservation.qty)).toFixed(6)));
    }
    return expected.size === actual.size
      && Array.from(expected.entries()).every(([key, qty]) => sanalTaksimSameQty(actual.get(key), qty));
  };
  if (auditRows.length !== targetReservations.length
    || !exactTotalsMatchPlan(currentSourceReservations, sourceItem)
    || !exactTotalsMatchPlan(targetReservations, targetItem)
    || (!partialWholePlanCancel && currentSourceReservations.length !== targetReservations.length)) return false;
  const exactPhysicalMatch = (left, right) =>
    sanalTaksimText(left?.prcId) === sanalTaksimText(right?.prcId)
    && sanalTaksimCode(left?.prcCode) === sanalTaksimCode(right?.prcCode)
    && sanalTaksimCode(left?.unit) === sanalTaksimCode(right?.unit)
    && sanalTaksimText(left?.stockRowId) === sanalTaksimText(right?.stockRowId)
    && sanalTaksimText(left?.physicalSegmentId) === sanalTaksimText(right?.physicalSegmentId)
    && sanalTaksimSameQty(left?.segmentOffsetStart, right?.segmentOffsetStart)
    && sanalTaksimSameQty(left?.segmentOffsetEnd, right?.segmentOffsetEnd)
    && sanalTaksimSameQty(left?.qty, right?.qty);
  const sourceContainsTarget = (source, target) =>
    sanalTaksimText(source?.prcId) === sanalTaksimText(target?.prcId)
    && sanalTaksimCode(source?.prcCode) === sanalTaksimCode(target?.prcCode)
    && sanalTaksimCode(source?.unit) === sanalTaksimCode(target?.unit)
    && sanalTaksimText(source?.stockRowId) === sanalTaksimText(target?.stockRowId)
    && sanalTaksimText(source?.physicalSegmentId) === sanalTaksimText(target?.physicalSegmentId)
    && Number(target?.segmentOffsetStart) >= Number(source?.segmentOffsetStart) - 0.000001
    && Number(target?.segmentOffsetEnd) <= Number(source?.segmentOffsetEnd) + 0.000001
    && sanalTaksimSameQty(Number(target?.segmentOffsetEnd) - Number(target?.segmentOffsetStart), target?.qty);
  const matchedTargetKeys = new Set();
  const matchedSourceKeys = new Set();
  for (const targetReservation of targetReservations) {
    const sourceMatches = currentSourceReservations.filter((row) => partialWholePlanCancel
      ? sourceContainsTarget(row, targetReservation)
      : exactPhysicalMatch(row, targetReservation));
    if (sourceMatches.length !== 1) return false;
    const sourceReservation = sourceMatches[0];
    const auditMatches = auditRows.filter((row) =>
      sanalTaksimText(row?.sourceReservationKey) === sanalTaksimText(sourceReservation?.reservationKey)
      && sanalTaksimText(row?.sourceInstructionId) === sanalTaksimText(sourceReservation?.instructionId)
      && sanalTaksimText(row?.targetReservationKey) === sanalTaksimText(targetReservation?.reservationKey)
      && exactPhysicalMatch(targetReservation, row));
    if (auditMatches.length !== 1
      || (partialWholePlanCancel && (!sanalTaksimSameQty(auditMatches[0]?.sourceSegmentOffsetStart,
        sourceReservation?.segmentOffsetStart)
        || !sanalTaksimSameQty(auditMatches[0]?.sourceSegmentOffsetEnd, sourceReservation?.segmentOffsetEnd)
        || !sanalTaksimSameQty(auditMatches[0]?.sourceQty, sourceReservation?.qty)))
      || sanalTaksimText(auditMatches[0]?.sourceOrderId)
        !== sanalTaksimText(sourceReservation?.sourceOrderId)
      || sanalTaksimText(auditMatches[0]?.sourceLineId)
        !== sanalTaksimText(sourceReservation?.sourceLineId)
      || sanalTaksimText(auditMatches[0]?.sourceDemandId)
        !== sanalTaksimText(sourceReservation?.demandId)
      || sanalTaksimText(auditMatches[0]?.sourceItemKey)
        !== sanalTaksimText(sourceReservation?.itemKey)
      || sanalTaksimText(auditMatches[0]?.targetOrderId) !== sanalTaksimText(targetAudit?.targetOrderId)
      || sanalTaksimText(auditMatches[0]?.targetLineId) !== sanalTaksimText(targetAudit?.targetLineId)
      || sanalTaksimText(auditMatches[0]?.targetDemandId) !== sanalTaksimText(targetAudit?.targetDemandId)
      || sanalTaksimText(auditMatches[0]?.targetItemKey) !== sanalTaksimText(targetAudit?.targetItemKey)) return false;
    const targetKey = sanalTaksimText(targetReservation?.reservationKey);
    const sourceKey = sanalTaksimText(sourceReservation?.reservationKey);
    if (!targetKey || matchedTargetKeys.has(targetKey) || matchedSourceKeys.has(sourceKey)) return false;
    matchedTargetKeys.add(targetKey);
    matchedSourceKeys.add(sourceKey);
  }
  if (matchedTargetKeys.size !== targetReservations.length
    || (!partialWholePlanCancel && matchedSourceKeys.size !== currentSourceReservations.length)) return false;
  if ((Array.isArray(currentData?.montageDispatchShipments) ? currentData.montageDispatchShipments : [])
    .some((row) => sanalTaksimText(row?.planId) === sourcePlanId)
    || (Array.isArray(currentData?.montageCompletionTransfers) ? currentData.montageCompletionTransfers : [])
      .some((row) => sanalTaksimText(row?.sourcePlanId) === sourcePlanId)) return false;

  const changedPlanIds = currentPlans.filter((current) => {
    const incoming = incomingPlans.find((row) => sanalTaksimText(row?.id) === sanalTaksimText(current?.id));
    return !incoming || JSON.stringify(current) !== JSON.stringify(incoming);
  }).map((row) => sanalTaksimText(row?.id));
  return changedPlanIds.length === 1 && changedPlanIds[0] === sourcePlanId
    && validateSanalTaksimPlanBoundMontageLinks(incomingState).length === 0;
}

function isSanalTaksimPlanBoundMontageAtomicDispatch(currentState, incomingState) {
  const currentData = getStateDataRoot(currentState);
  const incomingData = getStateDataRoot(incomingState);
  const currentPlans = Array.isArray(currentData?.montageDispatchPlans) ? currentData.montageDispatchPlans : [];
  const incomingPlans = Array.isArray(incomingData?.montageDispatchPlans) ? incomingData.montageDispatchPlans : [];
  const currentShipments = Array.isArray(currentData?.montageDispatchShipments)
    ? currentData.montageDispatchShipments : [];
  const incomingShipments = Array.isArray(incomingData?.montageDispatchShipments)
    ? incomingData.montageDispatchShipments : [];
  const currentInstructions = Array.isArray(currentData?.sanalTaksimAllocationInstructions)
    ? currentData.sanalTaksimAllocationInstructions : [];
  const incomingInstructions = Array.isArray(incomingData?.sanalTaksimAllocationInstructions)
    ? incomingData.sanalTaksimAllocationInstructions : [];
  if (currentPlans.length !== incomingPlans.length
    || incomingShipments.length !== currentShipments.length + 1
    || currentInstructions.length !== incomingInstructions.length
    || !sanalTaksimSameCollectionsExcept(currentData, incomingData, [
      "montageDispatchPlans", "montageDispatchShipments", "sanalTaksimAllocationInstructions",
    ])) return false;
  if (currentShipments.some((current) => {
    const incoming = incomingShipments.find((row) => sanalTaksimText(row?.id) === sanalTaksimText(current?.id));
    return !incoming || JSON.stringify(incoming) !== JSON.stringify(current);
  })) return false;
  const currentShipmentIds = new Set(currentShipments.map((row) => sanalTaksimText(row?.id)));
  const newShipments = incomingShipments.filter((row) => !currentShipmentIds.has(sanalTaksimText(row?.id)));
  const changedPlans = currentPlans.map((current) => ({
    current,
    incoming: incomingPlans.find((row) => sanalTaksimText(row?.id) === sanalTaksimText(current?.id)),
  })).filter(({ current, incoming }) => !incoming || JSON.stringify(current) !== JSON.stringify(incoming));
  if (newShipments.length !== 1 || changedPlans.length !== 1
    || incomingPlans.some((incoming) =>
      !currentPlans.some((current) => sanalTaksimText(current?.id) === sanalTaksimText(incoming?.id)))) return false;
  const shipment = newShipments[0];
  const { current: currentPlan, incoming: incomingPlan } = changedPlans[0];
  if (!incomingPlan || sanalTaksimCode(currentPlan?.status) !== "DRAFT"
    || sanalTaksimCode(incomingPlan?.status) !== "DISPATCHED_TO_MONTAGE"
    || sanalTaksimText(incomingPlan?.shipmentId) !== sanalTaksimText(shipment?.id)
    || sanalTaksimText(incomingPlan?.shipmentNo) !== sanalTaksimText(shipment?.shipmentNo)
    || !sanalTaksimIsIsoDate(incomingPlan?.dispatchedAt)
    || !sanalTaksimIsIsoDate(incomingPlan?.updatedAt)) return false;
  const currentPlanCore = { ...currentPlan };
  const incomingPlanCore = { ...incomingPlan };
  ["status", "shipmentId", "shipmentNo", "dispatchedAt", "updatedAt"].forEach((key) => {
    delete currentPlanCore[key];
    delete incomingPlanCore[key];
  });
  if (JSON.stringify(currentPlanCore) !== JSON.stringify(incomingPlanCore)
    || !sanalTaksimShipmentTransfersPlanBoundReservations(incomingPlan, shipment)) return false;
  const currentBundle = sanalTaksimGetPlanBoundMontageBundle(currentData, currentPlan, "ACTIVE");
  const incomingBundle = sanalTaksimGetPlanBoundMontageBundle(incomingData, incomingPlan, "COMPLETED");
  if (!currentBundle || !incomingBundle) return false;
  const boundIds = new Set(currentBundle.instructions.map((row) => sanalTaksimText(row?.id)));
  if (boundIds.size !== incomingBundle.instructions.length
    || incomingBundle.instructions.some((row) => !boundIds.has(sanalTaksimText(row?.id)))) return false;
  const changedInstructionIds = new Set();
  for (const current of currentInstructions) {
    const incoming = incomingInstructions.find((row) => sanalTaksimText(row?.id) === sanalTaksimText(current?.id));
    if (!incoming) return false;
    if (JSON.stringify(current) === JSON.stringify(incoming)) continue;
    changedInstructionIds.add(sanalTaksimText(current?.id));
    if (!boundIds.has(sanalTaksimText(current?.id))
      || !sanalTaksimInstructionLifecycleAppendMatches(current, incoming, "COMPLETED")) return false;
  }
  return changedInstructionIds.size === boundIds.size
    && Array.from(boundIds).every((id) => changedInstructionIds.has(id))
    && validateSanalTaksimPlanBoundMontageLinks(incomingState).length === 0;
}

function validateSanalTaksimAllocationInstructionTransitions(currentState, incomingState) {
  const currentData = getStateDataRoot(currentState);
  const incomingData = getStateDataRoot(incomingState);
  const currentRows = Array.isArray(currentData?.sanalTaksimAllocationInstructions)
    ? currentData.sanalTaksimAllocationInstructions : [];
  const incomingRows = Array.isArray(incomingData?.sanalTaksimAllocationInstructions)
    ? incomingData.sanalTaksimAllocationInstructions : [];
  const currentById = new Map(currentRows.map((row) => [sanalTaksimText(row?.id), row]));
  const incomingById = new Map(incomingRows.map((row) => [sanalTaksimText(row?.id), row]));
  const issues = [];
  let collectionChanged = currentRows.length !== incomingRows.length;
  const planBoundAtomicCancel = isSanalTaksimPlanBoundMontageAtomicCancel(currentState, incomingState);
  const planBoundAtomicDispatch = isSanalTaksimPlanBoundMontageAtomicDispatch(currentState, incomingState);
  const draftPlanBoundAtomicRebind = isSanalTaksimDraftPlanBoundAtomicRebind(currentState, incomingState);

  currentRows.forEach((current) => {
    const id = sanalTaksimText(current?.id);
    const incoming = incomingById.get(id);
    if (!incoming) {
      issues.push(`${sanalTaksimText(current?.instructionCode || id)}: talimat kaydı silinemez.`);
      collectionChanged = true;
      return;
    }
    if (JSON.stringify(current) === JSON.stringify(incoming)) return;
    collectionChanged = true;
    const currentCore = { ...current };
    const incomingCore = { ...incoming };
    delete currentCore.status;
    delete currentCore.events;
    delete incomingCore.status;
    delete incomingCore.events;
    if (JSON.stringify(currentCore) !== JSON.stringify(incomingCore)) {
      issues.push(`${sanalTaksimText(current?.instructionCode || id)}: talimat çekirdek alanları değiştirilemez.`);
      return;
    }
    const currentStatus = sanalTaksimCode(current?.status);
    const incomingStatus = sanalTaksimCode(incoming?.status);
    const currentEvents = Array.isArray(current?.events) ? current.events : [];
    const incomingEvents = Array.isArray(incoming?.events) ? incoming.events : [];
    const immutablePrefix = JSON.stringify(incomingEvents.slice(0, currentEvents.length)) === JSON.stringify(currentEvents);
    const appended = incomingEvents[currentEvents.length];
    const validCancelled = currentStatus === "ACTIVE" && incomingStatus === "CANCELLED"
      && incomingEvents.length === currentEvents.length + 1 && immutablePrefix
      && sanalTaksimCode(appended?.type) === "CANCELLED";
    const validPlanBoundCompleted = planBoundAtomicDispatch
      && currentStatus === "ACTIVE" && incomingStatus === "COMPLETED"
      && incomingEvents.length === currentEvents.length + 1 && immutablePrefix
      && sanalTaksimCode(appended?.type) === "COMPLETED";
    if (!validCancelled && !validPlanBoundCompleted) {
      issues.push(`${sanalTaksimText(current?.instructionCode || id)}: yalnız ACTIVE → CANCELLED veya doğrulanmış plan-bound sevkte ACTIVE → COMPLETED append-only geçişine izin verilir.`);
    }
  });

  incomingRows.forEach((incoming) => {
    const id = sanalTaksimText(incoming?.id);
    if (currentById.has(id)) return;
    collectionChanged = true;
    if (sanalTaksimCode(incoming?.status) !== "ACTIVE"
      || !Array.isArray(incoming?.events) || incoming.events.length !== 0) {
      issues.push(`${sanalTaksimText(incoming?.instructionCode || id)}: yeni talimat yalnız ACTIVE ve events=[] olabilir.`);
    }
  });

  if (collectionChanged) {
    const currentOtherData = { ...currentData };
    const incomingOtherData = { ...incomingData };
    delete currentOtherData.sanalTaksimAllocationInstructions;
    delete incomingOtherData.sanalTaksimAllocationInstructions;
    if (JSON.stringify(currentOtherData) !== JSON.stringify(incomingOtherData)
      && !isSanalTaksimPlanBoundMontageAtomicCreate(currentState, incomingState)
      && !planBoundAtomicCancel
      && !planBoundAtomicDispatch
      && !draftPlanBoundAtomicRebind) {
      issues.push("Talimat create/cancel kaydı başka veri koleksiyonlarıyla aynı save içinde değiştirilemez.");
    }
  }
  return issues;
}

function validateSanalTaksimActiveStockRowProtection(currentState, incomingState) {
  const currentData = getStateDataRoot(currentState);
  const incomingData = getStateDataRoot(incomingState);
  const currentRows = Array.isArray(currentData?.sanalTaksimAllocationInstructions)
    ? currentData.sanalTaksimAllocationInstructions : [];
  const currentStocks = Array.isArray(currentData?.stockDepotItems) ? currentData.stockDepotItems : [];
  const incomingStocks = Array.isArray(incomingData?.stockDepotItems) ? incomingData.stockDepotItems : [];
  const issues = [];
  currentRows.filter((record) => sanalTaksimCode(record?.status) === "ACTIVE").forEach((record) => {
    (Array.isArray(record?.slices) ? record.slices : []).forEach((slice) => {
      const stockRowId = sanalTaksimText(slice?.stockRowId);
      const physicalSegmentId = sanalTaksimText(slice?.physicalSegmentId);
      const audit = isPlainObject(slice?.physicalOriginAudit) ? slice.physicalOriginAudit : null;
      const isCanonicalWipSource = sanalTaksimCode(audit?.sourceKind) === "WORK_ORDER"
        && !stockRowId
        && physicalSegmentId.startsWith("WORK|")
        && !!sanalTaksimText(audit?.originWorkOrderId)
        && !!sanalTaksimText(audit?.originWorkOrderLineId);
      if (isCanonicalWipSource) return;
      const currentMatches = currentStocks.filter((row) => sanalTaksimText(row?.id) === stockRowId);
      const incomingMatches = incomingStocks.filter((row) => sanalTaksimText(row?.id) === stockRowId);
      if (currentMatches.length !== 1 || incomingMatches.length !== 1
        || sanalTaksimStockFingerprint(currentMatches[0]) !== sanalTaksimStockFingerprint(incomingMatches[0])) {
        issues.push(`${sanalTaksimText(record?.instructionCode || record?.id)}: ACTIVE talimatlı stok satırı değiştirilemez veya silinemez.`);
      }
    });
  });
  return issues;
}

function sanalTaksimResolveReceivedMgsLiveStocks(data, shipment, resolved) {
  const fail = () => ({ ok: false, receiptStocks: [] });
  const shipmentId = sanalTaksimText(shipment?.id);
  const receiptKey = sanalTaksimText(shipment?.receiptKey);
  if (sanalTaksimCode(shipment?.status) !== "RECEIVED"
    || !shipmentId
    || (Array.isArray(data?.montageDispatchShipments) ? data.montageDispatchShipments : [])
      .filter((row) => sanalTaksimText(row?.id) === shipmentId).length !== 1
    || !sanalTaksimIsIsoDate(shipment?.receivedAt)
    || receiptKey !== `MONTAGE_SHIPMENT_RECEIPT|${shipmentId}`
    || sanalTaksimText(shipment?.targetUnitId) !== "u3"
    || !sanalTaksimText(shipment?.targetLocationId)
    || sanalTaksimCode(shipment?.stockTransferMode) !== "POST_ON_RECEIPT_V1"
    || resolved?.lifecycle?.contractActive !== true) return fail();

  const effective = SanalTaksimResolver.resolveMontageShipmentOperationalTarget(shipment);
  if (!effective?.ok || !sanalTaksimReceiptTargetExists(data, effective?.target)) return fail();
  if ((effective?.rebound === true || shipment?.receiptOwnership)
    && !sanalTaksimReceiptOwnershipMatches(shipment?.receiptOwnership, shipment, effective)) return fail();

  const uncertain = Array.isArray(resolved?.uncertain) ? resolved.uncertain : [];
  if (uncertain.some((row) => sanalTaksimText(row?.id) === shipmentId)) return fail();
  const evidence = (Array.isArray(resolved?.lifecycle?.evidence) ? resolved.lifecycle.evidence : [])
    .filter((row) => sanalTaksimCode(row?.kind) === "MGS_RECEIVED_JOIN"
      && sanalTaksimText(row?.id) === shipmentId);
  if (evidence.length !== 1
    || evidence[0]?.physical !== true
    || sanalTaksimText(evidence[0]?.planId) !== sanalTaksimText(shipment?.planId)
    || sanalTaksimText(evidence[0]?.receiptKey) !== receiptKey) return fail();

  const receiptStockIds = Array.isArray(evidence[0]?.stockRowIds)
    ? evidence[0].stockRowIds.map((id) => sanalTaksimText(id)).filter(Boolean) : [];
  if (!receiptStockIds.length || new Set(receiptStockIds).size !== receiptStockIds.length) return fail();
  const stocks = Array.isArray(data?.stockDepotItems) ? data.stockDepotItems : [];
  const linkedReceiptStocks = stocks.filter((row) =>
    (sanalTaksimText(row?.sourceShipmentId || row?.shipmentId) === shipmentId
      || sanalTaksimText(row?.receiptKey) === receiptKey)
    && sanalTaksimCode(row?.stockClass) === "MONTAGE_RECEIVED"
  );
  if (linkedReceiptStocks.length !== receiptStockIds.length
    || linkedReceiptStocks.some((row) => !receiptStockIds.includes(sanalTaksimText(row?.id)))) return fail();
  const receiptStocks = receiptStockIds.map((id) =>
    stocks.filter((row) => sanalTaksimText(row?.id) === id)
  );
  if (receiptStocks.some((matches) => matches.length !== 1)) return fail();
  const rows = receiptStocks.map((matches) => matches[0]);
  if (rows.some((row) =>
    sanalTaksimText(row?.sourceShipmentId || row?.shipmentId) !== shipmentId
    || sanalTaksimText(row?.receiptKey) !== receiptKey
    || sanalTaksimText(row?.depotId) !== "unit:u3"
    || sanalTaksimText(row?.locationId) !== sanalTaksimText(shipment?.targetLocationId)
    || sanalTaksimCode(row?.stockClass) !== "MONTAGE_RECEIVED"
    || sanalTaksimCode(row?.status) !== "MONTAGE_RECEIVED_AWAITING_START"
    || !Number.isFinite(sanalTaksimGetQty(row))
    || sanalTaksimGetQty(row) < -sanalTaksimQtyEpsilon)) return fail();

  const parts = Array.isArray(shipment?.parts) ? shipment.parts : [];
  const movements = Array.isArray(data?.stock_movements) ? data.stock_movements : [];
  const receiptMovements = movements.filter((row) =>
    sanalTaksimCode(row?.movementType || row?.type) === "MONTAGE_DISPATCH_RECEIPT"
    && (sanalTaksimText(row?.shipmentId) === shipmentId
      || sanalTaksimText(row?.receiptKey) === receiptKey)
  );
  if (!parts.length || parts.length !== rows.length || receiptMovements.length !== rows.length
    || new Set(receiptMovements.map((row) => sanalTaksimText(row?.id))).size !== receiptMovements.length) return fail();
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const receiptLineKey = `${receiptKey}|${index}|${sanalTaksimText(part?.refId)}|${sanalTaksimCode(part?.code)}`;
    const rowMatches = rows.filter((row) => sanalTaksimText(row?.receiptLineKey) === receiptLineKey);
    const movementMatches = receiptMovements.filter((row) => sanalTaksimText(row?.receiptLineKey) === receiptLineKey);
    const expectedSourceMovementIds = (Array.isArray(part?.allocations) ? part.allocations : [])
      .map((allocation) => sanalTaksimText(allocation?.stockMovementId));
    if (rowMatches.length !== 1 || movementMatches.length !== 1
      || !expectedSourceMovementIds.length || expectedSourceMovementIds.some((id) => !id)
      || new Set(expectedSourceMovementIds).size !== expectedSourceMovementIds.length
      || sanalTaksimSemanticStringify(movementMatches[0]?.sourceMovementIds || [])
        !== sanalTaksimSemanticStringify(expectedSourceMovementIds)
      || !sanalTaksimSameQty(movementMatches[0]?.qty ?? movementMatches[0]?.quantity, part?.shippedQty)) return fail();
  }

  const receivedSegments = (Array.isArray(resolved?.segments) ? resolved.segments : [])
    .filter((row) => sanalTaksimText(row?.shipmentId) === shipmentId
      && sanalTaksimCode(row?.stage) === "MONTAGE_RECEIVED"
      && sanalTaksimCode(row?.sourceKind) === "MGS_RECEIPT_JOIN");
  const segmentSlices = receivedSegments.flatMap((segment) =>
    (Array.isArray(segment?.stockSlices) ? segment.stockSlices : [])
      .map((slice) => ({ segment, slice }))
  );
  const lifecycleEvidence = Array.isArray(resolved?.lifecycle?.evidence)
    ? resolved.lifecycle.evidence : [];
  const linkedTransfers = (Array.isArray(data?.montageCompletionTransfers)
    ? data.montageCompletionTransfers : [])
    .filter((transfer) => sanalTaksimText(transfer?.sourceShipmentId) === shipmentId
      && !["CANCELLED", "REJECTED"].includes(sanalTaksimCode(transfer?.status)));
  const linkedTransferIds = linkedTransfers.map((transfer) => sanalTaksimText(transfer?.id));
  const postedProofs = lifecycleEvidence.filter((row) =>
    sanalTaksimCode(row?.kind) === "MCT_POSTED_PROOF"
    && sanalTaksimText(row?.shipmentId) === shipmentId
  );
  const postedProofIds = postedProofs.map((row) => sanalTaksimText(row?.id));
  const linkedTransferIdSet = new Set(linkedTransferIds);
  const postedProofIdSet = new Set(postedProofIds);
  const pendingLifecycleExists = lifecycleEvidence.some((row) =>
    sanalTaksimCode(row?.kind) === "MCT_PENDING"
    && sanalTaksimText(row?.shipmentId) === shipmentId
  ) || (Array.isArray(resolved?.segments) ? resolved.segments : []).some((row) =>
    sanalTaksimText(row?.shipmentId) === shipmentId
    && sanalTaksimCode(row?.stage) === "MONTAGE_PENDING_DEPOT_RECEIPT"
  );
  const relatedUncertainExists = uncertain.some((row) => {
    const id = sanalTaksimText(row?.id);
    return id === shipmentId || linkedTransferIdSet.has(id);
  });
  const invariants = resolved?.diagnostics?.invariants || {};
  const invariantValues = Object.values(invariants);
  const terminallyConsumed = rows.every((row) => sanalTaksimSameQty(sanalTaksimGetQty(row), 0))
    && receivedSegments.length === 0
    && !pendingLifecycleExists
    && linkedTransfers.length > 0
    && linkedTransferIds.every(Boolean)
    && linkedTransferIdSet.size === linkedTransferIds.length
    && linkedTransfers.every((transfer) => sanalTaksimCode(transfer?.status) === "POSTED"
      && !transfer?.reversedAt && !transfer?.reversalId)
    && postedProofIds.every(Boolean)
    && postedProofIdSet.size === postedProofIds.length
    && postedProofIdSet.size === linkedTransferIdSet.size
    && Array.from(linkedTransferIdSet).every((id) => postedProofIdSet.has(id))
    && !relatedUncertainExists
    && invariantValues.length > 0
    && invariantValues.every((value) => value === true)
    && resolved?.diagnostics?.exactHoldLedger?.valid === true;
  if (terminallyConsumed) {
    return { ok: true, receiptStocks: [], terminallyConsumed: true };
  }

  if (!receivedSegments.length || segmentSlices.length !== rows.length || rows.some((row) => {
    const matches = segmentSlices.filter(({ slice }) =>
      sanalTaksimText(slice?.stockRowId) === sanalTaksimText(row?.id)
    );
    return matches.length !== 1
      || !sanalTaksimIsPositiveQty(sanalTaksimGetQty(row))
      || !sanalTaksimSameQty(matches[0].slice?.qty, sanalTaksimGetQty(row))
      || sanalTaksimText(matches[0].segment?.prcId) !== sanalTaksimText(row?.refId || row?.productId)
      || sanalTaksimCode(matches[0].segment?.prcCode) !== sanalTaksimCode(row?.productCode || row?.code)
      || sanalTaksimCode(matches[0].segment?.unit) !== sanalTaksimCode(row?.unit)
      || ["sourceOrderId", "sourceLineId", "demandId", "itemKey"].some((key) =>
        sanalTaksimText(matches[0].segment?.[key]) !== sanalTaksimText(effective?.target?.[key]));
  })) return fail();

  return { ok: true, receiptStocks: rows, terminallyConsumed: false };
}

function validateSanalTaksimOperationalHoldConflicts(state) {
  const data = getStateDataRoot(state);
  const instructions = Array.isArray(data?.sanalTaksimAllocationInstructions)
    ? data.sanalTaksimAllocationInstructions.filter((record) => sanalTaksimCode(record?.status) === "ACTIVE")
    : [];
  if (!instructions.length) return [];
  const operationalRows = [];
  const collect = (value, owner) => {
    const ownerMeta = isPlainObject(owner) ? owner : { label: sanalTaksimText(owner) };
    if (Array.isArray(value)) {
      value.forEach((entry) => collect(entry, ownerMeta));
      return;
    }
    if (!isPlainObject(value)) return;
    const ranges = Array.isArray(value?.segmentRanges) ? value.segmentRanges : [];
    if (ranges.length) {
      ranges.forEach((range) => collect({
        ...range,
        stockRowId: range?.stockRowId || value?.stockRowId || value?.stockItemId || value?.sourceStockItemId,
        physicalSegmentId: range?.physicalSegmentId || value?.physicalSegmentId,
      }, ownerMeta));
    } else {
      const physicalSegmentId = sanalTaksimText(value?.physicalSegmentId);
      const stockRowId = sanalTaksimText(value?.stockRowId || value?.stockItemId || value?.sourceStockItemId)
        || (physicalSegmentId.startsWith("STOCK|") ? physicalSegmentId.slice("STOCK|".length) : "");
      const sourceSegmentId = physicalSegmentId || (stockRowId ? `STOCK|${stockRowId}` : "");
      if (sourceSegmentId && (Object.prototype.hasOwnProperty.call(value, "qty")
        || Object.prototype.hasOwnProperty.call(value, "reservedQty")
        || Object.prototype.hasOwnProperty.call(value, "allocatedQty")
        || Object.prototype.hasOwnProperty.call(value, "segmentOffsetStart"))) {
        operationalRows.push({
          owner: sanalTaksimText(ownerMeta?.label),
          ownerKind: sanalTaksimCode(ownerMeta?.kind),
          plan: ownerMeta?.plan || null,
          reservation: value,
          stockRowId,
          physicalSegmentId: sourceSegmentId,
          start: Number(value?.segmentOffsetStart),
          end: Number(value?.segmentOffsetEnd),
        });
      }
      Object.values(value).forEach((entry) => collect(entry, owner));
    }
  };
  (Array.isArray(data?.montageDispatchPlans) ? data.montageDispatchPlans : [])
    .filter((plan) => sanalTaksimCode(plan?.status) === "DRAFT")
    .forEach((plan) => collect(plan?.exactReservations, {
      kind: "MGP_DRAFT",
      label: sanalTaksimText(plan?.planNo || plan?.id || "MGP"),
      plan,
    }));
  let resolvedLifecycle = null;
  try {
    resolvedLifecycle = SanalTaksimResolver.resolve(data);
  } catch (_error) {
    resolvedLifecycle = null;
  }
  const stockRows = Array.isArray(data?.stockDepotItems) ? data.stockDepotItems : [];
  (Array.isArray(data?.montageDispatchShipments) ? data.montageDispatchShipments : [])
    .filter((shipment) => !["CANCELLED", "REJECTED"].includes(sanalTaksimCode(shipment?.status)))
    .forEach((shipment) => {
      const owner = sanalTaksimText(shipment?.shipmentNo || shipment?.id || "MGS");
      if (sanalTaksimCode(shipment?.status) !== "RECEIVED") {
        collect(shipment, owner);
        return;
      }
      const received = sanalTaksimResolveReceivedMgsLiveStocks(data, shipment, resolvedLifecycle);
      if (!received.ok) collect(shipment, owner);
      const shipmentId = sanalTaksimText(shipment?.id);
      const receiptKey = sanalTaksimText(shipment?.receiptKey);
      const protectedReceiptStocks = received.ok
        ? received.receiptStocks
        : stockRows.filter((row) =>
          (shipmentId && sanalTaksimText(row?.sourceShipmentId || row?.shipmentId) === shipmentId)
          || (receiptKey && sanalTaksimText(row?.receiptKey) === receiptKey)
        );
      protectedReceiptStocks.forEach((row) => collect({
        stockRowId: sanalTaksimText(row?.id),
        qty: sanalTaksimGetQty(row),
      }, owner));
    });
  (Array.isArray(data?.montageCompletionTransfers) ? data.montageCompletionTransfers : [])
    .filter((transfer) => !["CANCELLED", "REJECTED"].includes(sanalTaksimCode(transfer?.status)))
    .forEach((transfer) => collect(transfer?.componentAllocations, sanalTaksimText(transfer?.transferNo || transfer?.id || "MCT")));
  (Array.isArray(data?.salesShipmentPlans) ? data.salesShipmentPlans : [])
    .filter((plan) => sanalTaksimCode(plan?.status) === "PLANNED")
    .forEach((plan) => collect(plan?.items, sanalTaksimText(plan?.planNo || plan?.id || "SVP")));

  const issues = [];
  instructions.forEach((instruction) => {
    (Array.isArray(instruction?.slices) ? instruction.slices : []).forEach((slice) => {
      const sliceSegmentId = sanalTaksimText(slice?.physicalSegmentId)
        || (sanalTaksimText(slice?.stockRowId) ? `STOCK|${sanalTaksimText(slice?.stockRowId)}` : "");
      operationalRows.filter((row) => row.physicalSegmentId === sliceSegmentId).forEach((row) => {
        if (row.ownerKind === "MGP_DRAFT"
          && sanalTaksimIsExactPlanBoundPair(instruction, slice, row.plan, row.reservation)) return;
        const hasRange = Number.isFinite(row.start) && Number.isFinite(row.end) && row.end > row.start;
        const overlap = hasRange
          && row.start < Number(slice?.segmentOffsetEnd) - sanalTaksimQtyEpsilon
          && row.end > Number(slice?.segmentOffsetStart) + sanalTaksimQtyEpsilon;
        if (!hasRange || overlap) {
          issues.push(`${sanalTaksimText(instruction?.instructionCode || instruction?.id)}: ${row.owner} exact operasyon hold'u ile stok/WIP dilimi ayrıştırılamıyor.`);
        }
      });
    });
  });
  return Array.from(new Set(issues));
}

function analyzeCriticalCollectionDrops(currentState, incomingState) {
  if (!currentState || !incomingState) return [];

  const issues = [];
  for (const collection of criticalStateCollections) {
    const beforeCount = getCollectionCount(currentState, collection);
    const afterCount = getCollectionCount(incomingState, collection);
    if (beforeCount <= 0 || afterCount >= beforeCount) continue;

    const dropRatio = (beforeCount - afterCount) / beforeCount;
    if (afterCount === 0 || dropRatio > criticalDropThreshold) {
      issues.push({
        collection,
        beforeCount,
        afterCount,
        dropRatio: Number(dropRatio.toFixed(4)),
        reason: afterCount === 0 ? "collection_cleared" : "collection_drop_over_threshold",
      });
    }
  }

  return issues;
}

function validateSanalTaksimSalesShipmentPlanTransitions(currentState, incomingState) {
  if (!currentState || !incomingState) return [];
  const currentData = getStateDataRoot(currentState);
  const incomingData = getStateDataRoot(incomingState);
  const currentPlans = Array.isArray(currentData?.salesShipmentPlans) ? currentData.salesShipmentPlans : [];
  const incomingPlans = Array.isArray(incomingData?.salesShipmentPlans) ? incomingData.salesShipmentPlans : [];
  const issues = [];
  const currentById = new Map(currentPlans.map((plan) => [String(plan?.id || "").trim(), plan]));
  const incomingById = new Map(incomingPlans.map((plan) => [String(plan?.id || "").trim(), plan]));
  const immutableCore = (plan) => JSON.stringify({
    id: plan?.id,
    planNo: plan?.planNo,
    sourceOrderId: plan?.sourceOrderId,
    sourceOrderNo: plan?.sourceOrderNo,
    idempotencyKey: plan?.idempotencyKey,
    createdAt: plan?.createdAt,
    items: plan?.items,
  });

  currentPlans.forEach((currentPlan) => {
    const id = String(currentPlan?.id || "").trim();
    const incomingPlan = incomingById.get(id);
    if (!id || !incomingPlan) {
      issues.push(`${String(currentPlan?.planNo || id || "SVP")}: mevcut sevkiyat planı silinemez.`);
      return;
    }
    const currentStatus = String(currentPlan?.status || "").trim().toUpperCase();
    const incomingStatus = String(incomingPlan?.status || "").trim().toUpperCase();
    if (immutableCore(currentPlan) !== immutableCore(incomingPlan)) {
      issues.push(`${String(currentPlan?.planNo || id)}: exact SVP allocation taahhüdü değiştirilemez.`);
    }
    if (currentStatus === "PLANNED"
      && !new Set(["PLANNED", "CANCELLED", "DISPATCHED"]).has(incomingStatus)) {
      issues.push(`${String(currentPlan?.planNo || id)}: PLANNED durum geçişi desteklenmiyor.`);
    }
    if (currentStatus !== "PLANNED" && incomingStatus !== currentStatus) {
      issues.push(`${String(currentPlan?.planNo || id)}: final/iptal SVP durumu değiştirilemez.`);
    }
  });

  const newPlans = incomingPlans.filter((plan) => {
    const id = String(plan?.id || "").trim();
    return id && !currentById.has(id);
  });
  if (newPlans.some((plan) => String(plan?.status || "").trim().toUpperCase() !== "PLANNED")) {
    issues.push("Yeni sevkiyat planı yalnız PLANNED durumunda oluşturulabilir.");
  }
  if (!newPlans.length) return issues;

  let resolved;
  try {
    resolved = SanalTaksimResolver.resolve(currentData);
  } catch (error) {
    issues.push(`Yeni SVP için Sanal Taksim resolver çalıştırılamadı: ${String(error?.message || "resolver_error")}`);
    return issues;
  }
  const invariants = resolved?.diagnostics?.invariants || {};
  if (!invariants.finishedAllocationWithinQty
    || !invariants.productAllocationWithinOpenDebt
    || !invariants.segmentConsumedOnce) {
    issues.push("Yeni SVP için canonical bitmiş ürün tek-sayım invariantı doğrulanamadı.");
    return issues;
  }
  const dynamicAllocations = (Array.isArray(resolved?.finishedReadyAllocations)
    ? resolved.finishedReadyAllocations
    : []).filter((allocation) => allocation?.fixedBySalesShipmentPlan !== true);
  const allocationByKey = new Map(dynamicAllocations.map((allocation) => [
    String(allocation?.allocationKey || "").trim(),
    allocation,
  ]));
  const requestedByAllocationKey = new Map();
  newPlans.forEach((plan) => {
    const planOrderId = String(plan?.sourceOrderId || "").trim();
    (Array.isArray(plan?.items) ? plan.items : []).forEach((item, itemIndex) => {
      const targetLineId = String(item?.sourceLineId || "").trim();
      (Array.isArray(item?.stockAllocations) ? item.stockAllocations : []).forEach((allocation) => {
        const proof = allocation?.sanalTaksimAllocationProof;
        const sourceAllocationKey = String(proof?.sourceAllocationKey || "").trim();
        const dynamic = allocationByKey.get(sourceAllocationKey);
        const qty = Number(allocation?.allocatedQty);
        const exact = !!proof
          && !!dynamic
          && String(proof?.resolverVersion || "").trim() === String(resolved?.version || "").trim()
          && String(proof?.physicalSegmentId || "").trim() === String(dynamic?.physicalSegmentId || "").trim()
          && String(proof?.stockItemId || "").trim() === String(allocation?.stockItemId || "").trim()
          && String(proof?.stockItemId || "").trim() === String(dynamic?.stockItemId || "").trim()
          && String(proof?.completionTransferId || "").trim() === String(dynamic?.completionTransferId || "").trim()
          && String(proof?.inputMovementId || "").trim() === String(dynamic?.inputMovementId || "").trim()
          && String(proof?.targetProductDebtKey || "").trim() === String(dynamic?.targetProductDebtKey || "").trim()
          && String(proof?.targetOrderId || "").trim() === planOrderId
          && String(proof?.targetOrderId || "").trim() === String(dynamic?.targetOrderId || "").trim()
          && String(proof?.targetOrderLineId || "").trim() === targetLineId
          && String(proof?.targetOrderLineId || "").trim() === String(dynamic?.targetOrderLineId || "").trim()
          && String(proof?.targetDemandId || "").trim() === String(dynamic?.targetDemandId || "").trim()
          && String(proof?.targetItemKey || "").trim() === String(dynamic?.targetItemKey || "").trim()
          && String(proof?.productId || "").trim() === String(item?.productId || "").trim()
          && String(proof?.variantId || "").trim().replace(/^salesvar_/i, "")
            === String(item?.variantId || "").trim().replace(/^salesvar_/i, "")
          && String(proof?.variantCode || "").trim().toUpperCase()
            === String(item?.variantCode || item?.svrCode || "").trim().toUpperCase()
          && String(proof?.unit || "").trim().toUpperCase() === "ADET"
          && Number.isSafeInteger(qty)
          && qty > 0
          && Number(proof?.qty) === qty
          && Number(proof?.sourceAllocationQty) === Number(dynamic?.qty)
          && qty <= Number(dynamic?.qty);
        if (!exact) {
          issues.push(`${String(plan?.planNo || plan?.id || "SVP")} / satır ${itemIndex + 1}: exact resolver allocation proof doğrulanamadı.`);
          return;
        }
        requestedByAllocationKey.set(sourceAllocationKey,
          (requestedByAllocationKey.get(sourceAllocationKey) || 0) + qty);
      });
    });
  });
  requestedByAllocationKey.forEach((qty, allocationKey) => {
    const dynamic = allocationByKey.get(allocationKey);
    if (!dynamic || qty > Number(dynamic?.qty || 0)) {
      issues.push(`${allocationKey || "SVP allocation"}: yeni PLANNED SVP toplamı resolver allocation miktarını aşıyor.`);
    }
  });
  return issues;
}

function validateSalesShipmentPlans(state) {
  const data = getStateDataRoot(state);
  const plans = data?.salesShipmentPlans;
  if (!Array.isArray(plans)) return ["salesShipmentPlans koleksiyonu dizi olmalıdır."];

  const issues = [];
  const orders = Array.isArray(data?.orders) ? data.orders : [];
  const stockRows = Array.isArray(data?.stockDepotItems) ? data.stockDepotItems : [];
  const movements = Array.isArray(data?.stock_movements) ? data.stock_movements : [];
  const completionTransfers = Array.isArray(data?.montageCompletionTransfers) ? data.montageCompletionTransfers : [];
  const ids = new Set();
  const planNos = new Set();
  const idempotencyKeys = new Set();
  const activeOrderIds = new Set();
  const activeAllocatedQtyByStockId = new Map();
  plans.forEach((plan, planIndex) => {
    const label = String(plan?.planNo || `salesShipmentPlans[${planIndex}]`).trim();
    const id = String(plan?.id || "").trim();
    const planNo = String(plan?.planNo || "").trim().toUpperCase();
    const status = String(plan?.status || "").trim().toUpperCase();
    const sourceOrderId = String(plan?.sourceOrderId || "").trim();
    const sourceOrderNo = String(plan?.sourceOrderNo || "").trim();
    const idempotencyKey = String(plan?.idempotencyKey || "").trim();
    const createdAt = String(plan?.createdAt || "").trim();
    const updatedAt = String(plan?.updatedAt || "").trim();
    const items = Array.isArray(plan?.items) ? plan.items : [];
    const order = orders.find((row) => String(row?.id || "").trim() === sourceOrderId) || null;
    if (!id || ids.has(id)) issues.push(`${label}: id eksik veya mükerrer.`);
    if (!OperationalCodeHighWater.isValidCode(planNo, 'SVP') || planNos.has(planNo)) {
      issues.push(`${label}: planNo geçersiz veya mükerrer.`);
    }
    if (!idempotencyKey || idempotencyKeys.has(idempotencyKey)) issues.push(`${label}: idempotencyKey eksik veya mükerrer.`);
    if (!sourceOrderId || !sourceOrderNo) issues.push(`${label}: sipariş kimliği eksik.`);
    if (!createdAt || !updatedAt) issues.push(`${label}: oluşturma veya güncelleme zamanı eksik.`);
    if (!order || String(order?.orderNo || "").trim() !== sourceOrderNo) issues.push(`${label}: sipariş kaydıyla kesin eşleşme kurulamadı.`);
    if (!new Set(["PLANNED", "DISPATCHED", "CANCELLED"]).has(status)) issues.push(`${label}: desteklenmeyen durum. Yalnız PLANNED, DISPATCHED veya CANCELLED kabul edilir.`);
    const cancelledAt = String(plan?.cancelledAt || "").trim();
    const dispatchedAt = String(plan?.dispatchedAt || "").trim();
    const shipmentId = String(plan?.shipmentId || "").trim();
    const shipmentNo = String(plan?.shipmentNo || "").trim().toUpperCase();
    if (status === "DISPATCHED"
      && (!dispatchedAt || !shipmentId || !OperationalCodeHighWater.isValidCode(shipmentNo, 'TF'))) {
      issues.push(`${label}: DISPATCHED planın sevk tarihi veya teslim fişi bağlantısı eksik.`);
    }
    if (status === "DISPATCHED" && cancelledAt) issues.push(`${label}: DISPATCHED plan cancelledAt içeremez.`);
    if (status === "CANCELLED" && !cancelledAt) issues.push(`${label}: CANCELLED planın cancelledAt zamanı zorunludur.`);
    if (status === "CANCELLED" && (dispatchedAt || shipmentId || shipmentNo)) {
      issues.push(`${label}: CANCELLED plan sevk tarihi veya teslim fişi bağlantısı içeremez.`);
    }
    if (status === "PLANNED" && (cancelledAt || dispatchedAt || shipmentId || shipmentNo)) {
      issues.push(`${label}: PLANNED plan iptal, sevk veya teslim fişi bağlantısı içeremez.`);
    }
    if (!items.length) issues.push(`${label}: en az bir plan satırı bulunmalıdır.`);
    if (id) ids.add(id);
    if (planNo) planNos.add(planNo);
    if (idempotencyKey) idempotencyKeys.add(idempotencyKey);
    if (status === "PLANNED" && sourceOrderId) {
      if (activeOrderIds.has(sourceOrderId)) issues.push(`${label}: aynı sipariş için birden fazla aktif sevkiyat planı bulunamaz.`);
      activeOrderIds.add(sourceOrderId);
    }

    const sourceLineIds = new Set();
    const allocatedStockIds = new Set();
    items.forEach((item, itemIndex) => {
      const itemLabel = `${label} / satır ${itemIndex + 1}`;
      const sourceLineId = String(item?.sourceLineId || "").trim();
      const lineKey = String(item?.lineKey || "").trim();
      const productId = String(item?.productId || "").trim();
      const productCode = String(item?.productCode || "").trim();
      const variantId = String(item?.variantId || "").trim();
      const variantCode = String(item?.variantCode || "").trim();
      const salCode = String(item?.salCode || "").trim();
      const svrCode = String(item?.svrCode || "").trim();
      const productName = String(item?.productName || "").trim();
      const orderQty = Number(item?.orderQty);
      const plannedQty = Number(item?.plannedQty);
      const allocations = Array.isArray(item?.stockAllocations) ? item.stockAllocations : [];
      const orderLine = (Array.isArray(order?.lines) ? order.lines : [])
        .find((row) => String(row?.id || row?.lineId || "").trim() === sourceLineId) || null;
      const orderVariantId = String(orderLine?.variationId || orderLine?.variantId || "").trim().replace(/^salesvar_/i, "");
      const orderSalCode = String(orderLine?.idCode || orderLine?.productCode || "").trim().toUpperCase();
      const orderSvrCode = String(orderLine?.variantCode || orderLine?.variationCode || "").trim().toUpperCase();
      if (!sourceLineId || sourceLineIds.has(sourceLineId)) issues.push(`${itemLabel}: sourceLineId eksik veya mükerrer.`);
      sourceLineIds.add(sourceLineId);
      if (lineKey !== `SALES_ORDER|${sourceOrderId}|${sourceLineId}`) issues.push(`${itemLabel}: lineKey sipariş satırıyla uyuşmuyor.`);
      if (!productId || !productCode || !variantId || !variantCode || !salCode || !svrCode || !productName) issues.push(`${itemLabel}: ürün, varyant, SAL, SVR veya ürün adı eksik.`);
      if (!orderLine
        || String(orderLine?.productId || "").trim() !== productId
        || orderVariantId !== variantId.replace(/^salesvar_/i, "")
        || orderSalCode !== salCode.toUpperCase()
        || orderSvrCode !== svrCode.toUpperCase()
        || productCode.toUpperCase() !== salCode.toUpperCase()
        || variantCode.toUpperCase() !== svrCode.toUpperCase()
        || Number(orderLine?.qty ?? orderLine?.quantity ?? orderLine?.amount) !== orderQty) {
        issues.push(`${itemLabel}: ürün/varyant veya SAL/SVR satış satırıyla uyuşmuyor.`);
      }
      if (!Number.isSafeInteger(orderQty) || orderQty <= 0 || !Number.isSafeInteger(plannedQty) || plannedQty <= 0 || plannedQty > orderQty) {
        issues.push(`${itemLabel}: sipariş veya planlanan adet geçersiz.`);
      }
      if (String(item?.unit || "").trim().toUpperCase() !== "ADET") issues.push(`${itemLabel}: birim ADET olmalıdır.`);
      let allocatedTotal = 0;
      allocations.forEach((allocation) => {
        const stockItemId = String(allocation?.stockItemId || "").trim();
        const allocatedQty = Number(allocation?.allocatedQty);
        const proof = allocation?.sanalTaksimAllocationProof;
        const stockRow = stockRows.find((row) => String(row?.id || "").trim() === stockItemId) || null;
        const stockVariantId = String(stockRow?.variantId || stockRow?.variationId || "").trim().replace(/^salesvar_/i, "");
        const stockVariantCode = String(stockRow?.variantCode || stockRow?.productCode || stockRow?.code || "").trim().toUpperCase();
        const stockQty = Number(stockRow?.qty ?? stockRow?.quantity ?? stockRow?.amount);
        if (!stockItemId || allocatedStockIds.has(stockItemId)) issues.push(`${itemLabel}: stok allocation kimliği eksik veya mükerrer.`);
        if (stockItemId) allocatedStockIds.add(stockItemId);
        if (!Number.isSafeInteger(allocatedQty) || allocatedQty <= 0) issues.push(`${itemLabel}: allocation miktarı geçersiz.`);
        if (String(allocation?.depotId || "").trim() !== "depot_profil"
          || !String(allocation?.locationId || "").trim()
          || String(allocation?.sourceOrderId || "").trim() !== sourceOrderId
          || String(allocation?.sourceLineId || "").trim() !== sourceLineId) {
          issues.push(`${itemLabel}: allocation Sevkiyat Depo veya sipariş satırıyla uyuşmuyor.`);
        }
        const staticTargetExact = String(stockRow?.sourceType || "").trim().toUpperCase() === "SALES_ORDER"
          && String(stockRow?.sourceOrderId || "").trim() === sourceOrderId
          && String(stockRow?.sourceLineId || "").trim() === sourceLineId;
        const proofTargetExact = !!proof
          && String(proof?.resolverVersion || "").trim() === String(SanalTaksimResolver.VERSION || "").trim()
          && String(proof?.sourceAllocationKey || "").trim()
          && Number(proof?.sourceAllocationQty) >= allocatedQty
          && String(proof?.physicalSegmentId || "").trim()
          && String(proof?.stockItemId || "").trim() === stockItemId
          && String(proof?.targetOrderId || "").trim() === sourceOrderId
          && String(proof?.targetOrderLineId || "").trim() === sourceLineId
          && String(proof?.productId || "").trim() === productId
          && String(proof?.variantId || "").trim().replace(/^salesvar_/i, "") === variantId.replace(/^salesvar_/i, "")
          && String(proof?.variantCode || "").trim().toUpperCase() === svrCode.toUpperCase()
          && String(proof?.unit || "").trim().toUpperCase() === "ADET"
          && Number(proof?.qty) === allocatedQty;
        if (!stockRow
          || (!staticTargetExact && !proofTargetExact)
          || String(stockRow?.productId || "").trim() !== productId
          || stockVariantId !== variantId.replace(/^salesvar_/i, "")
          || stockVariantCode !== svrCode.toUpperCase()
          || String(stockRow?.depotId || "").trim() !== "depot_profil"
          || String(stockRow?.locationId || stockRow?.targetLocationId || "").trim() !== String(allocation?.locationId || "").trim()
          || String(stockRow?.stockClass || "").trim().toUpperCase() !== "KULLANILABILIR"
          || String(stockRow?.status || "").trim().toUpperCase() !== "KULLANILABILIR"
          || String(stockRow?.unit || "").trim().toUpperCase() !== "ADET"
          || !Number.isSafeInteger(stockQty)
          || stockQty < 0
          || (status === "PLANNED" && (stockQty <= 0 || allocatedQty > stockQty))) {
          issues.push(`${itemLabel}: allocation canonical fiziksel stokla doğrulanamadı.`);
        }
        const transfer = completionTransfers.find((row) =>
          String(row?.status || "").trim().toUpperCase() === "POSTED"
          && String(row?.finishedProductStockItemId || "").trim() === stockItemId
          && String(row?.productId || "").trim() === productId
          && String(row?.variantId || row?.variationId || "").trim().replace(/^salesvar_/i, "") === variantId.replace(/^salesvar_/i, "")
          && String(row?.variantCode || "").trim().toUpperCase() === svrCode.toUpperCase()
        ) || null;
        const movement = transfer
          ? movements.find((row) =>
              String(row?.id || "").trim() === String(transfer?.finishedProductMovementId || "").trim()
              && String(row?.productId || "").trim() === productId
              && String(row?.variantId || row?.variationId || "").trim().replace(/^salesvar_/i, "") === variantId.replace(/^salesvar_/i, "")
              && String(row?.variantCode || row?.productCode || "").trim().toUpperCase() === svrCode.toUpperCase()
              && String(row?.stockDepotItemId || "").trim() === stockItemId
              && String(row?.targetDepotId || "").trim() === "depot_profil"
              && String(row?.targetLocationId || "").trim() === String(allocation?.locationId || "").trim()
            ) || null
          : null;
        if (!transfer || !movement) issues.push(`${itemLabel}: canonical MCT ve stok giriş hareketi zinciri doğrulanamadı.`);
        if (proofTargetExact && transfer && movement
          && (String(proof?.completionTransferId || "").trim() !== String(transfer?.id || "").trim()
            || String(proof?.inputMovementId || "").trim() !== String(movement?.id || "").trim())) {
          issues.push(`${itemLabel}: Sanal Taksim allocation lineage kanıtı uyuşmuyor.`);
        }
        if (status === "PLANNED" && stockItemId && Number.isSafeInteger(allocatedQty) && allocatedQty > 0) {
          activeAllocatedQtyByStockId.set(stockItemId,
            (activeAllocatedQtyByStockId.get(stockItemId) || 0) + allocatedQty);
        }
        allocatedTotal += Number.isSafeInteger(allocatedQty) ? allocatedQty : 0;
      });
      if (allocatedTotal !== plannedQty) issues.push(`${itemLabel}: allocation toplamı planlanan adede eşit değil.`);
    });
  });
  activeAllocatedQtyByStockId.forEach((allocatedQty, stockItemId) => {
    const stockRow = stockRows.find((row) => String(row?.id || "").trim() === stockItemId) || null;
    const stockQty = Number(stockRow?.qty ?? stockRow?.quantity ?? stockRow?.amount);
    if (!stockRow || !Number.isSafeInteger(stockQty) || allocatedQty > stockQty) {
      issues.push(`${stockItemId}: aktif PLANNED SVP toplamı güncel canonical stok miktarını aşıyor.`);
    }
  });
  return issues;
}

function validateSalesShipments(state) {
  const data = getStateDataRoot(state);
  const shipments = data?.salesShipments;
  if (!Array.isArray(shipments)) return ["salesShipments koleksiyonu dizi olmalıdır."];
  const plans = Array.isArray(data?.salesShipmentPlans) ? data.salesShipmentPlans : [];
  const stockRows = Array.isArray(data?.stockDepotItems) ? data.stockDepotItems : [];
  const movements = Array.isArray(data?.stock_movements) ? data.stock_movements : [];
  const issues = [];
  const ids = new Set();
  const shipmentNos = new Set();
  const planIds = new Set();
  const idempotencyKeys = new Set();
  const allExpectedMovementIds = new Set();
  shipments.forEach((shipment, shipmentIndex) => {
    const label = String(shipment?.shipmentNo || `salesShipments[${shipmentIndex}]`).trim();
    const id = String(shipment?.id || "").trim();
    const shipmentNo = String(shipment?.shipmentNo || "").trim().toUpperCase();
    const status = String(shipment?.status || "").trim().toUpperCase();
    const shipmentPlanId = String(shipment?.shipmentPlanId || "").trim();
    const shipmentPlanNo = String(shipment?.shipmentPlanNo || "").trim().toUpperCase();
    const sourceOrderId = String(shipment?.sourceOrderId || "").trim();
    const sourceOrderNo = String(shipment?.sourceOrderNo || "").trim();
    const dispatchedAt = String(shipment?.dispatchedAt || "").trim();
    const createdAt = String(shipment?.createdAt || "").trim();
    const idempotencyKey = String(shipment?.idempotencyKey || "").trim();
    const snapshot = isPlainObject(shipment?.snapshot) ? shipment.snapshot : null;
    const plan = plans.find((row) => String(row?.id || "").trim() === shipmentPlanId) || null;
    if (!id || ids.has(id)) issues.push(`${label}: id eksik veya mükerrer.`);
    if (!OperationalCodeHighWater.isValidCode(shipmentNo, 'TF') || shipmentNos.has(shipmentNo)) {
      issues.push(`${label}: shipmentNo geçersiz veya mükerrer.`);
    }
    if (!shipmentPlanId || planIds.has(shipmentPlanId)) issues.push(`${label}: aynı sevkiyat planı için birden fazla gerçek sevkiyat bulunamaz.`);
    if (!idempotencyKey || idempotencyKeys.has(idempotencyKey) || idempotencyKey !== `SALES_SHIPMENT_DISPATCH|${shipmentPlanId}`) {
      issues.push(`${label}: idempotencyKey eksik, geçersiz veya mükerrer.`);
    }
    if (status !== "DISPATCHED" || !dispatchedAt || !createdAt) issues.push(`${label}: durum veya sevk zamanı geçersiz.`);
    if (!plan
      || String(plan?.status || "").trim().toUpperCase() !== "DISPATCHED"
      || String(plan?.planNo || "").trim().toUpperCase() !== shipmentPlanNo
      || String(plan?.sourceOrderId || "").trim() !== sourceOrderId
      || String(plan?.sourceOrderNo || "").trim() !== sourceOrderNo
      || String(plan?.shipmentId || "").trim() !== id
      || String(plan?.shipmentNo || "").trim().toUpperCase() !== shipmentNo
      || String(plan?.dispatchedAt || "").trim() !== dispatchedAt) {
      issues.push(`${label}: DISPATCHED plan bağlantısı uyuşmuyor.`);
    }
    if (!snapshot
      || String(snapshot?.shipmentNo || "").trim().toUpperCase() !== shipmentNo
      || String(snapshot?.shipmentPlanNo || "").trim().toUpperCase() !== shipmentPlanNo
      || String(snapshot?.sourceOrderId || "").trim() !== sourceOrderId
      || String(snapshot?.sourceOrderNo || "").trim() !== sourceOrderNo
      || String(snapshot?.dispatchedAt || "").trim() !== dispatchedAt
      || !String(snapshot?.customerName || "").trim()
      || !String(snapshot?.deliveryAddress || "").trim()) {
      issues.push(`${label}: değişmez teslim fişi snapshot üst bilgileri eksik veya çelişkili.`);
    }
    const snapshotItems = Array.isArray(snapshot?.items) ? snapshot.items : [];
    const planItems = Array.isArray(plan?.items) ? plan.items : [];
    if (!snapshotItems.length || snapshotItems.length !== planItems.length) issues.push(`${label}: snapshot ürün satırları eksik.`);
    const seenLineIds = new Set();
    const expectedMovementIds = new Set();
    let totalDispatchedQty = 0;
    let totalPackageCount = 0;
    let totalWeightKg = 0;
    snapshotItems.forEach((item, itemIndex) => {
      const itemLabel = `${label} / snapshot satır ${itemIndex + 1}`;
      const sourceLineId = String(item?.sourceLineId || "").trim();
      const planItem = planItems.find((row) => String(row?.sourceLineId || "").trim() === sourceLineId) || null;
      const dispatchedQty = Number(item?.dispatchQty);
      const packageCount = Number(item?.packageCount);
      const weightKg = Number(item?.weightKg);
      if (!sourceLineId || seenLineIds.has(sourceLineId) || !planItem) issues.push(`${itemLabel}: sourceLineId eksik, mükerrer veya planda yok.`);
      seenLineIds.add(sourceLineId);
      if (!planItem
        || String(item?.productId || "").trim() !== String(planItem?.productId || "").trim()
        || String(item?.variantId || "").trim().replace(/^salesvar_/i, "") !== String(planItem?.variantId || "").trim().replace(/^salesvar_/i, "")
        || String(item?.salCode || "").trim().toUpperCase() !== String(planItem?.salCode || "").trim().toUpperCase()
        || String(item?.svrCode || "").trim().toUpperCase() !== String(planItem?.svrCode || "").trim().toUpperCase()
        || dispatchedQty !== Number(planItem?.plannedQty)) {
        issues.push(`${itemLabel}: ürün kimliği veya sevk miktarı planla uyuşmuyor.`);
      }
      if (!Number.isSafeInteger(dispatchedQty) || dispatchedQty <= 0
        || !Number.isSafeInteger(packageCount) || packageCount < 0
        || !Number.isFinite(weightKg) || weightKg < 0) {
        issues.push(`${itemLabel}: adet, koli veya ağırlık geçersiz.`);
      }
      const snapshotAllocations = Array.isArray(item?.stockAllocations) ? item.stockAllocations : [];
      const planAllocations = Array.isArray(planItem?.stockAllocations) ? planItem.stockAllocations : [];
      if (snapshotAllocations.length !== planAllocations.length) issues.push(`${itemLabel}: allocation snapshot sayısı planla uyuşmuyor.`);
      let allocationTotal = 0;
      snapshotAllocations.forEach((allocation) => {
        const stockItemId = String(allocation?.stockItemId || "").trim();
        const allocatedQty = Number(allocation?.allocatedQty);
        const stockMovementId = String(allocation?.stockMovementId || "").trim();
        const planAllocation = planAllocations.find((row) => String(row?.stockItemId || "").trim() === stockItemId) || null;
        const stockRow = stockRows.find((row) => String(row?.id || "").trim() === stockItemId) || null;
        const movement = movements.find((row) => String(row?.id || "").trim() === stockMovementId) || null;
        if (!planAllocation
          || allocatedQty !== Number(planAllocation?.allocatedQty)
          || String(allocation?.sourceOrderId || "").trim() !== sourceOrderId
          || String(allocation?.sourceLineId || "").trim() !== sourceLineId
          || String(allocation?.depotId || "").trim() !== String(planAllocation?.depotId || "").trim()
          || String(allocation?.locationId || "").trim() !== String(planAllocation?.locationId || "").trim()) {
          issues.push(`${itemLabel}: kullanılan canonical allocation planla uyuşmuyor.`);
        }
        const stockQty = Number(stockRow?.qty ?? stockRow?.quantity ?? stockRow?.amount);
        if (!stockRow || !Number.isSafeInteger(stockQty) || stockQty < 0) issues.push(`${itemLabel}: sevk sonrası canonical stok satırı geçersiz.`);
        if (!movement
          || String(movement?.movementType || movement?.type || "").trim().toUpperCase() !== "SALES_SHIPMENT_OUT"
          || String(movement?.shipmentId || "").trim() !== id
          || String(movement?.shipmentNo || "").trim().toUpperCase() !== shipmentNo
          || String(movement?.shipmentPlanId || "").trim() !== shipmentPlanId
          || String(movement?.shipmentPlanNo || "").trim().toUpperCase() !== shipmentPlanNo
          || String(movement?.sourceType || "").trim().toUpperCase() !== "SALES_ORDER"
          || String(movement?.sourceOrderId || "").trim() !== sourceOrderId
          || String(movement?.sourceOrderNo || "").trim() !== sourceOrderNo
          || String(movement?.sourceLineId || "").trim() !== sourceLineId
          || String(movement?.stockItemId || movement?.stockDepotItemId || "").trim() !== stockItemId
          || String(movement?.depotId || movement?.sourceDepotId || "").trim() !== String(allocation?.depotId || "").trim()
          || String(movement?.locationId || movement?.sourceLocationId || "").trim() !== String(allocation?.locationId || "").trim()
          || String(movement?.productId || "").trim() !== String(item?.productId || "").trim()
          || String(movement?.variantId || "").trim().replace(/^salesvar_/i, "") !== String(item?.variantId || "").trim().replace(/^salesvar_/i, "")
          || String(movement?.salCode || movement?.productCode || "").trim().toUpperCase() !== String(item?.salCode || "").trim().toUpperCase()
          || String(movement?.svrCode || movement?.variantCode || "").trim().toUpperCase() !== String(item?.svrCode || "").trim().toUpperCase()
          || Number(movement?.qty ?? movement?.quantity) !== allocatedQty
          || String(movement?.unit || "").trim().toUpperCase() !== "ADET"
          || allocatedQty <= 0) {
          issues.push(`${itemLabel}: SALES_SHIPMENT_OUT hareketi eksik veya çelişkili.`);
        }
        if (stockMovementId) {
          if (expectedMovementIds.has(stockMovementId)) issues.push(`${itemLabel}: aynı çıkış hareketi birden fazla allocation tarafından kullanılıyor.`);
          if (allExpectedMovementIds.has(stockMovementId)) issues.push(`${itemLabel}: çıkış hareketi başka bir sevkiyat tarafından kullanılıyor.`);
          expectedMovementIds.add(stockMovementId);
          allExpectedMovementIds.add(stockMovementId);
        }
        allocationTotal += Number.isSafeInteger(allocatedQty) ? allocatedQty : 0;
      });
      if (allocationTotal !== dispatchedQty) issues.push(`${itemLabel}: allocation toplamı sevk edilen adede eşit değil.`);
      totalDispatchedQty += Number.isSafeInteger(dispatchedQty) ? dispatchedQty : 0;
      totalPackageCount += Number.isSafeInteger(packageCount) ? packageCount : 0;
      totalWeightKg += Number.isFinite(weightKg) ? weightKg : 0;
    });
    const shipmentMovements = movements.filter((movement) =>
      String(movement?.shipmentId || "").trim() === id
      && String(movement?.movementType || movement?.type || "").trim().toUpperCase() === "SALES_SHIPMENT_OUT"
    );
    if (shipmentMovements.length !== expectedMovementIds.size
      || shipmentMovements.some((movement) => !expectedMovementIds.has(String(movement?.id || "").trim()))) {
      issues.push(`${label}: sevkiyat çıkış hareketi kümesi snapshot allocation kümesiyle uyuşmuyor.`);
    }
    if (Number(snapshot?.totalDispatchedQty) !== totalDispatchedQty
      || Number(snapshot?.totalPackageCount) !== totalPackageCount
      || Math.abs(Number(snapshot?.totalWeightKg) - totalWeightKg) > 0.000001) {
      issues.push(`${label}: snapshot toplamları ürün satırlarıyla uyuşmuyor.`);
    }
    if (id) ids.add(id);
    if (shipmentNo) shipmentNos.add(shipmentNo);
    if (shipmentPlanId) planIds.add(shipmentPlanId);
    if (idempotencyKey) idempotencyKeys.add(idempotencyKey);
  });
  plans.forEach((plan) => {
    const planId = String(plan?.id || "").trim();
    const status = String(plan?.status || "").trim().toUpperCase();
    const linked = shipments.filter((shipment) => String(shipment?.shipmentPlanId || "").trim() === planId);
    if (status === "DISPATCHED" && linked.length !== 1) {
      issues.push(`${String(plan?.planNo || planId || "SVP")}: DISPATCHED plan tek bir gerçek sevkiyat kaydına bağlı olmalıdır.`);
    }
    if (status === "PLANNED" && linked.length) {
      issues.push(`${String(plan?.planNo || planId || "SVP")}: PLANNED plan gerçek sevkiyat kaydına bağlı olamaz.`);
    }
  });
  movements
    .filter((movement) => String(movement?.movementType || movement?.type || "").trim().toUpperCase() === "SALES_SHIPMENT_OUT")
    .forEach((movement) => {
      if (!allExpectedMovementIds.has(String(movement?.id || "").trim())) {
        issues.push(`${String(movement?.id || "SALES_SHIPMENT_OUT")}: gerçek sevkiyat snapshot bağlantısı olmayan çıkış hareketi bulunamaz.`);
      }
    });
  return issues;
}

function validateSalesShipmentImmutability(currentState, incomingState) {
  const currentRows = Array.isArray(getStateDataRoot(currentState)?.salesShipments)
    ? getStateDataRoot(currentState).salesShipments
    : [];
  const incomingRows = Array.isArray(getStateDataRoot(incomingState)?.salesShipments)
    ? getStateDataRoot(incomingState).salesShipments
    : [];
  const incomingById = new Map(incomingRows.map((row) => [String(row?.id || "").trim(), row]));
  const issues = [];
  currentRows.forEach((row) => {
    const id = String(row?.id || "").trim();
    const incoming = incomingById.get(id);
    if (!id || !incoming || JSON.stringify(incoming) !== JSON.stringify(row)) {
      issues.push(`${String(row?.shipmentNo || id || "salesShipment")}: gerçek sevkiyat kaydı değiştirilemez veya silinemez.`);
    }
  });
  return issues;
}

function isVerifiedSalesOrderPrototypeReset(currentState, incomingState, approval) {
  if (String(approval?.type || "").trim() !== "sales_order_demo_cleanup"
    || ![3, 4, 5, 6].includes(Number(approval?.meta?.prototypeResetVersion))) return false;
  if ([5, 6].includes(Number(approval?.meta?.prototypeResetVersion))) {
    return PrototypeSalesTestCohortCleanup.verifyTransition(currentState, incomingState, approval);
  }
  if (Number(approval?.meta?.prototypeResetVersion) === 4) {
    return isVerifiedSalesOrderPrototypeDetachV4(currentState, incomingState, approval);
  }
  const orderId = String(approval?.meta?.orderId || "").trim();
  const orderNo = String(approval?.meta?.orderNo || "").trim();
  if (!orderId || !orderNo || !currentState || !incomingState) return false;
  const current = getStateDataRoot(currentState);
  const incoming = getStateDataRoot(incomingState);
  const text = (value) => String(value || "").trim();
  const code = (value) => text(value).toUpperCase();
  const type = (row) => code(row?.movementType || row?.type);
  const qty = (row) => Number(row?.qty ?? row?.quantity ?? row?.amount);
  const currentOrders = Array.isArray(current?.orders) ? current.orders : [];
  const incomingOrders = Array.isArray(incoming?.orders) ? incoming.orders : [];
  const orderMatches = currentOrders.filter((row) => text(row?.id) === orderId && text(row?.orderNo || row?.orderCode) === orderNo);
  if (orderMatches.length !== 1 || incomingOrders.some((row) => text(row?.id) === orderId)) return false;
  const orderLineIds = new Set((Array.isArray(orderMatches[0]?.lines) ? orderMatches[0].lines : [])
    .map((line) => text(line?.id || line?.lineId)).filter(Boolean));
  if (!orderLineIds.size) return false;

  const collectionResetOk = (collection, targetIds) => {
    const beforeRows = Array.isArray(current?.[collection]) ? current[collection] : [];
    const afterRows = Array.isArray(incoming?.[collection]) ? incoming[collection] : [];
    const afterById = new Map(afterRows.map((row) => [text(row?.id), row]));
    if (afterRows.some((row) => targetIds.has(text(row?.id)))) return false;
    const untouched = beforeRows.filter((row) => !targetIds.has(text(row?.id)));
    if (afterRows.length !== untouched.length) return false;
    return untouched.every((row) => {
      const id = text(row?.id);
      return id && afterById.has(id) && JSON.stringify(afterById.get(id)) === JSON.stringify(row);
    });
  };
  const currentPlans = Array.isArray(current?.salesShipmentPlans) ? current.salesShipmentPlans : [];
  const currentShipments = Array.isArray(current?.salesShipments) ? current.salesShipments : [];
  const currentMovements = Array.isArray(current?.stock_movements) ? current.stock_movements : [];
  const currentStocks = Array.isArray(current?.stockDepotItems) ? current.stockDepotItems : [];
  const incomingStocks = Array.isArray(incoming?.stockDepotItems) ? incoming.stockDepotItems : [];
  const targetPlans = currentPlans.filter((plan) => text(plan?.sourceOrderId) === orderId);
  const targetPlanIds = new Set(targetPlans.map((plan) => text(plan?.id)).filter(Boolean));
  for (const plan of targetPlans) {
    const items = Array.isArray(plan?.items) ? plan.items : [];
    if (!targetPlanIds.has(text(plan?.id)) || text(plan?.sourceOrderNo) !== orderNo
      || !["PLANNED", "DISPATCHED", "CANCELLED"].includes(code(plan?.status)) || !items.length
      || items.some((item) => !orderLineIds.has(text(item?.sourceLineId)))) return false;
  }
  const targetShipments = currentShipments.filter((shipment) => text(shipment?.sourceOrderId) === orderId
    || targetPlanIds.has(text(shipment?.shipmentPlanId)));
  const targetShipmentIds = new Set(targetShipments.map((shipment) => text(shipment?.id)).filter(Boolean));
  if (targetShipments.some((shipment) => code(shipment?.status) !== "DISPATCHED"
    || !targetPlanIds.has(text(shipment?.shipmentPlanId))
    || text(shipment?.sourceOrderId) !== orderId || text(shipment?.sourceOrderNo) !== orderNo)) return false;
  if ((targetPlans.length && validateSalesShipmentPlans(currentState).length)
    || (targetShipments.length && validateSalesShipments(currentState).length)) return false;
  if (!collectionResetOk("salesShipmentPlans", targetPlanIds)
    || !collectionResetOk("salesShipments", targetShipmentIds)) return false;

  const targetOutMovements = currentMovements.filter((movement) => type(movement) === "SALES_SHIPMENT_OUT"
    && (text(movement?.sourceOrderId) === orderId
      || targetPlanIds.has(text(movement?.shipmentPlanId))
      || targetShipmentIds.has(text(movement?.shipmentId))));
  const targetOutIds = new Set(targetOutMovements.map((movement) => text(movement?.id)).filter(Boolean));
  const incomingMovements = Array.isArray(incoming?.stock_movements) ? incoming.stock_movements : [];
  if (targetOutMovements.some((movement) => text(movement?.sourceOrderId) !== orderId
    || !targetPlanIds.has(text(movement?.shipmentPlanId))
    || !targetShipmentIds.has(text(movement?.shipmentId)))
    || incomingMovements.some((movement) => targetOutIds.has(text(movement?.id)))) return false;
  const currentForeignOut = currentMovements.filter((movement) => type(movement) === "SALES_SHIPMENT_OUT"
    && !targetOutIds.has(text(movement?.id)));
  const incomingForeignOutById = new Map(incomingMovements
    .filter((movement) => type(movement) === "SALES_SHIPMENT_OUT")
    .map((movement) => [text(movement?.id), movement]));
  if (currentForeignOut.length !== incomingForeignOutById.size
    || currentForeignOut.some((movement) => JSON.stringify(incomingForeignOutById.get(text(movement?.id))) !== JSON.stringify(movement))) return false;

  const targetStockIds = new Set();
  targetPlans.forEach((plan) => (Array.isArray(plan?.items) ? plan.items : []).forEach((item) =>
    (Array.isArray(item?.stockAllocations) ? item.stockAllocations : []).forEach((allocation) => {
      const stockItemId = text(allocation?.stockItemId);
      if (stockItemId) targetStockIds.add(stockItemId);
    })));
  const referencesTargetStock = (value) => {
    if (!value || typeof value !== "object") return false;
    if (Array.isArray(value)) return value.some(referencesTargetStock);
    return Object.entries(value).some(([key, child]) =>
      (["stockItemId", "stockDepotItemId", "sourceStockItemId", "sourceStockDepotItemId"].includes(key)
        && targetStockIds.has(text(child)))
      || (child && typeof child === "object" && referencesTargetStock(child)));
  };
  if (currentPlans.some((plan) => !targetPlanIds.has(text(plan?.id)) && referencesTargetStock(plan))
    || currentShipments.some((shipment) => !targetShipmentIds.has(text(shipment?.id)) && referencesTargetStock(shipment))) return false;
  const allowedProvenanceMovementIds = new Set((Array.isArray(current?.montageCompletionTransfers)
    ? current.montageCompletionTransfers
    : []).filter((transfer) => code(transfer?.status) === "POSTED"
      && targetStockIds.has(text(transfer?.finishedProductStockItemId)))
    .map((transfer) => text(transfer?.finishedProductMovementId)).filter(Boolean));
  const incomingMovementById = new Map(incomingMovements.map((movement) => [text(movement?.id), movement]));
  if (incomingMovements.some((movement) => referencesTargetStock(movement)
    && !allowedProvenanceMovementIds.has(text(movement?.id)))) return false;
  for (const movementId of allowedProvenanceMovementIds) {
    const beforeMovement = currentMovements.find((movement) => text(movement?.id) === movementId) || null;
    const afterMovement = incomingMovementById.get(movementId) || null;
    if (afterMovement && JSON.stringify(afterMovement) !== JSON.stringify(beforeMovement)) return false;
  }

  const currentMgp = Array.isArray(current?.montageDispatchPlans) ? current.montageDispatchPlans : [];
  const targetMgpIds = new Set(currentMgp.filter((plan) => (Array.isArray(plan?.items) ? plan.items : [])
    .some((item) => text(item?.sourceOrderId) === orderId)).map((plan) => text(plan?.id)).filter(Boolean));
  const currentMgs = Array.isArray(current?.montageDispatchShipments) ? current.montageDispatchShipments : [];
  const targetMgsIds = new Set(currentMgs.filter((shipment) => targetMgpIds.has(text(shipment?.planId)))
    .map((shipment) => text(shipment?.id)).filter(Boolean));
  const currentMct = Array.isArray(current?.montageCompletionTransfers) ? current.montageCompletionTransfers : [];
  const targetMctIds = new Set(currentMct.filter((transfer) => text(transfer?.sourceOrderId) === orderId
    || targetMgsIds.has(text(transfer?.sourceShipmentId))).map((transfer) => text(transfer?.id)).filter(Boolean));
  const targetInstructionIds = new Set(currentMgp.filter((plan) => targetMgpIds.has(text(plan?.id)))
    .flatMap((plan) => Array.isArray(plan?.exactReservations) ? plan.exactReservations : [])
    .map((reservation) => text(reservation?.instructionId)).filter(Boolean));
  if (!collectionResetOk("montageDispatchPlans", targetMgpIds)
    || !collectionResetOk("montageDispatchShipments", targetMgsIds)
    || !collectionResetOk("montageCompletionTransfers", targetMctIds)
    || !collectionResetOk("sanalTaksimAllocationInstructions", targetInstructionIds)) return false;

  const returnedQtyByStockId = new Map();
  targetOutMovements.forEach((movement) => {
    const stockItemId = text(movement?.stockItemId || movement?.stockDepotItemId);
    const amount = Number(movement?.qty ?? movement?.quantity);
    if (!stockItemId || !Number.isFinite(amount) || amount <= 0) return;
    returnedQtyByStockId.set(stockItemId, (returnedQtyByStockId.get(stockItemId) || 0) + amount);
  });
  for (const stockItemId of targetStockIds) {
    const beforeMatches = currentStocks.filter((row) => text(row?.id) === stockItemId);
    if (beforeMatches.length !== 1) return false;
    const afterMatches = incomingStocks.filter((row) => text(row?.id) === stockItemId);
    const targetMct = currentMct.find((transfer) => targetMctIds.has(text(transfer?.id))
      && text(transfer?.finishedProductStockItemId) === stockItemId) || null;
    if (!afterMatches.length && targetMct) continue;
    if (afterMatches.length !== 1) return false;
    const expectedQty = qty(beforeMatches[0]) + Number(returnedQtyByStockId.get(stockItemId) || 0);
    if (!Number.isFinite(expectedQty) || Math.abs(qty(afterMatches[0]) - expectedQty) > 0.000001) return false;
  }
  return true;
}

function isVerifiedSalesOrderPrototypeDetachV4(currentState, incomingState, approval) {
  const meta = approval?.meta || {};
  if (String(meta?.prototypeResetMode || "").trim() !== "RETAINED_EVIDENCE_DETACH") return false;
  const orderId = String(meta?.orderId || "").trim();
  const orderNo = String(meta?.orderNo || "").trim();
  const planSignature = String(meta?.planSignature || "").trim();
  if (!orderId || !orderNo || !planSignature || !currentState || !incomingState) return false;
  const current = getStateDataRoot(currentState);
  const incoming = getStateDataRoot(incomingState);
  const text = (value) => String(value || "").trim();
  const sortedUnique = (values) => Array.from(new Set((Array.isArray(values) ? values : [])
    .map(text).filter(Boolean))).sort();
  const sameIdList = (left, right) => JSON.stringify(sortedUnique(left)) === JSON.stringify(sortedUnique(right));
  const currentOrders = Array.isArray(current?.orders) ? current.orders : [];
  const incomingOrders = Array.isArray(incoming?.orders) ? incoming.orders : [];
  const orderMatches = currentOrders.filter((row) => text(row?.id) === orderId
    && text(row?.orderNo || row?.orderCode) === orderNo);
  if (orderMatches.length !== 1 || incomingOrders.length !== currentOrders.length) return false;
  const incomingOrderById = new Map(incomingOrders.map((row) => [text(row?.id), row]));
  for (const before of currentOrders) {
    const id = text(before?.id);
    const after = incomingOrderById.get(id);
    if (!id || !after) return false;
    if (id !== orderId) {
      if (JSON.stringify(after) !== JSON.stringify(before)) return false;
      continue;
    }
    if (before?.prototypeResetTombstone != null) return false;
    const marker = after?.prototypeResetTombstone;
    if (Number(marker?.contractVersion) !== 1
      || text(marker?.type) !== "PROTOTYPE_TEST_RESET_RETAINED_EVIDENCE"
      || text(marker?.orderId) !== orderId
      || text(marker?.orderNo) !== orderNo
      || text(marker?.planSignature) !== planSignature
      || !text(marker?.detachedAt)) return false;
    const normalizedAfter = { ...after };
    delete normalizedAfter.prototypeResetTombstone;
    if (JSON.stringify(normalizedAfter) !== JSON.stringify(before)) return false;
  }

  const currentDemands = Array.isArray(current?.planningDemands) ? current.planningDemands : [];
  const incomingDemands = Array.isArray(incoming?.planningDemands) ? incoming.planningDemands : [];
  const targetDemands = currentDemands.filter((row) => text(row?.sourceType).toUpperCase() === "SALES_ORDER"
    && text(row?.sourceOrderId) === orderId);
  const targetDemandIds = targetDemands.map((row) => text(row?.id)).filter(Boolean);
  if (!targetDemandIds.length || !sameIdList(targetDemandIds, meta?.demandIds)
    || incomingDemands.length !== currentDemands.length) return false;
  const targetDemandIdSet = new Set(targetDemandIds);
  const incomingDemandById = new Map(incomingDemands.map((row) => [text(row?.id), row]));
  for (const before of currentDemands) {
    const id = text(before?.id);
    const after = incomingDemandById.get(id);
    if (!id || !after) return false;
    if (!targetDemandIdSet.has(id)) {
      if (JSON.stringify(after) !== JSON.stringify(before)) return false;
      continue;
    }
    if (before?.prototypeResetTombstone != null) return false;
    const marker = after?.prototypeResetTombstone;
    if (Number(marker?.contractVersion) !== 1
      || text(marker?.type) !== "PROTOTYPE_TEST_RESET_RETAINED_EVIDENCE"
      || text(marker?.orderId) !== orderId
      || text(marker?.orderNo) !== orderNo
      || text(marker?.planSignature) !== planSignature
      || !text(marker?.detachedAt)
      || text(after?.status) !== "PROTOTYPE_RESET_TOMBSTONE"
      || text(marker?.previousStatus) !== text(before?.status)) return false;
    const normalizedAfter = { ...after, status: marker.previousStatus };
    delete normalizedAfter.prototypeResetTombstone;
    if (JSON.stringify(normalizedAfter) !== JSON.stringify(before)) return false;
  }

  const currentWorkOrders = Array.isArray(current?.workOrders) ? current.workOrders : [];
  const incomingWorkOrders = Array.isArray(incoming?.workOrders) ? incoming.workOrders : [];
  const demandLinkedWorkOrderIds = new Set(targetDemands.flatMap((demand) => [
    ...(Array.isArray(demand?.workOrderIds) ? demand.workOrderIds : []),
    demand?.workOrderId
  ].map(text).filter(Boolean)));
  currentWorkOrders.forEach((workOrder) => {
    if (targetDemandIdSet.has(text(workOrder?.sourceId || workOrder?.demandId || workOrder?.planningDemandId))) {
      demandLinkedWorkOrderIds.add(text(workOrder?.id));
    }
  });
  if (!demandLinkedWorkOrderIds.size
    || !sameIdList(Array.from(demandLinkedWorkOrderIds), meta?.workOrderIds)
    || incomingWorkOrders.length !== currentWorkOrders.length) return false;
  const incomingWorkOrderById = new Map(incomingWorkOrders.map((row) => [text(row?.id), row]));
  for (const before of currentWorkOrders) {
    const id = text(before?.id);
    const after = incomingWorkOrderById.get(id);
    if (!id || !after) return false;
    if (!demandLinkedWorkOrderIds.has(id)) {
      if (JSON.stringify(after) !== JSON.stringify(before)) return false;
      continue;
    }
    if (before?.prototypeResetTombstone != null) return false;
    const marker = after?.prototypeResetTombstone;
    if (Number(marker?.contractVersion) !== 1
      || text(marker?.type) !== "PROTOTYPE_TEST_RESET_RETAINED_EVIDENCE"
      || text(marker?.orderId) !== orderId
      || text(marker?.orderNo) !== orderNo
      || text(marker?.planSignature) !== planSignature
      || !text(marker?.detachedAt)) return false;
    const normalizedAfter = { ...after };
    delete normalizedAfter.prototypeResetTombstone;
    if (JSON.stringify(normalizedAfter) !== JSON.stringify(before)) return false;
  }

  const allowedRootChanges = new Set(["orders", "planningDemands", "workOrders"]);
  const rootKeys = new Set([...Object.keys(current || {}), ...Object.keys(incoming || {})]);
  for (const key of rootKeys) {
    if (allowedRootChanges.has(key)) continue;
    if (JSON.stringify(incoming?.[key]) !== JSON.stringify(current?.[key])) return false;
  }
  return true;
}

function normalizeCriticalDropIssuesForApproval(issues) {
  return (Array.isArray(issues) ? issues : [])
    .map((issue) => ({
      collection: String(issue?.collection || "").trim(),
      beforeCount: Number(issue?.beforeCount),
      afterCount: Number(issue?.afterCount),
      reason: String(issue?.reason || "").trim(),
      dropRatio: Number(issue?.dropRatio),
    }))
    .filter((issue) =>
      issue.collection &&
      Number.isFinite(issue.beforeCount) &&
      Number.isFinite(issue.afterCount) &&
      issue.beforeCount >= 0 &&
      issue.afterCount >= 0 &&
      issue.reason
    )
    .sort((a, b) => a.collection.localeCompare(b.collection));
}

function areCriticalDropIssuesApproved(issues, approval) {
  const type = String(approval?.type || "").trim();
  const allowedCollections = criticalDropApprovalCollections[type];
  if (!allowedCollections) return false;
  const actual = normalizeCriticalDropIssuesForApproval(issues);
  const expected = normalizeCriticalDropIssuesForApproval(approval?.issues);
  if (!actual.length || actual.length !== expected.length) return false;
  for (let i = 0; i < actual.length; i += 1) {
    const a = actual[i];
    const e = expected[i];
    if (!allowedCollections.has(a.collection)) return false;
    if (
      a.collection !== e.collection ||
      a.beforeCount !== e.beforeCount ||
      a.afterCount !== e.afterCount ||
      a.reason !== e.reason ||
      a.dropRatio !== e.dropRatio
    ) {
      return false;
    }
  }
  return true;
}

function parsePdfNumber(value, fallback, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  if (num < min || num > max) return fallback;
  return num;
}

function parsePdfLength(value, fallback) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  if (!/^\d+(\.\d+)?(mm|cm|in|px)$/i.test(raw)) return fallback;
  return raw;
}

function resolvePdfRenderOptions(value) {
  const options = isPlainObject(value) ? value : {};
  const defaultViewport = { width: 1366, height: 960 };
  const viewportSource = isPlainObject(options.viewport) ? options.viewport : {};
  const marginSource = isPlainObject(options.margin) ? options.margin : {};
  const allowedFormats = new Set(["A4", "A3", "A5", "LETTER", "LEGAL", "TABLOID"]);
  const formatRaw = String(options.format || "A4").trim().toUpperCase();
  const format = allowedFormats.has(formatRaw) ? formatRaw : "A4";
  const media = String(options.media || "print").trim().toLowerCase() === "screen" ? "screen" : "print";
  return {
    media,
    format,
    landscape: !!options.landscape,
    printBackground: options.printBackground !== false,
    preferCSSPageSize: options.preferCSSPageSize !== false,
    scale: parsePdfNumber(options.scale, 1, 0.1, 2),
    margin: {
      top: parsePdfLength(marginSource.top, "10mm"),
      right: parsePdfLength(marginSource.right, "10mm"),
      bottom: parsePdfLength(marginSource.bottom, "10mm"),
      left: parsePdfLength(marginSource.left, "10mm"),
    },
    viewport: {
      width: Math.round(parsePdfNumber(viewportSource.width, defaultViewport.width, 640, 4000)),
      height: Math.round(parsePdfNumber(viewportSource.height, defaultViewport.height, 480, 4000)),
    },
  };
}

async function getPdfBrowser() {
  if (!pdfBrowserPromise) {
    let playwright;
    try {
      playwright = require("playwright");
    } catch (_) {
      throw new Error("playwright_not_available");
    }
    const chromium = playwright?.chromium;
    if (!chromium) throw new Error("playwright_not_available");
    pdfBrowserPromise = (async () => {
      const launchAttempts = [
        { headless: true },
        { headless: true, channel: "chrome" },
        { headless: true, channel: "msedge" },
      ];
      const errors = [];
      for (const options of launchAttempts) {
        try {
          return await chromium.launch(options);
        } catch (err) {
          const label = options.channel ? `channel:${options.channel}` : "bundled";
          errors.push(`${label}:${String(err?.message || err)}`);
        }
      }
      throw new Error(`playwright_launch_failed:${errors.join(" | ")}`);
    })();
  }
  return pdfBrowserPromise;
}

function getPdfBrowserExecutableCandidates() {
  const envBrowser = String(process.env.PDF_BROWSER_PATH || process.env.BROWSER || "").trim();
  const candidates = [];
  if (envBrowser) candidates.push(envBrowser);
  if (process.platform === "win32") {
    const programFiles = process.env.ProgramFiles || "C:\\Program Files";
    const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
    const localAppData = process.env.LOCALAPPDATA || "";
    candidates.push(
      path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(programFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
      path.join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe")
    );
    if (localAppData) {
      candidates.push(
        path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
        path.join(localAppData, "Microsoft", "Edge", "Application", "msedge.exe")
      );
    }
  }
  candidates.push("google-chrome", "chrome", "chromium", "chromium-browser", "msedge");
  return [...new Set(candidates.filter(Boolean))];
}

function execFileAsync(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(file, args, options, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function renderPdfFromHtmlWithBrowserCli(html) {
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "dulda-pdf-"));
  const htmlPath = path.join(tmpDir, "source.html");
  const pdfPath = path.join(tmpDir, "output.pdf");
  const profileDir = path.join(tmpDir, "profile");
  const errors = [];
  try {
    await fsp.mkdir(profileDir, { recursive: true });
    await fsp.writeFile(htmlPath, String(html || ""), "utf8");
    const sourceUrl = pathToFileURL(htmlPath).href;
    for (const browserPath of getPdfBrowserExecutableCandidates()) {
      if (path.isAbsolute(browserPath) && !fs.existsSync(browserPath)) continue;
      for (const headlessFlag of ["--headless=new", "--headless"]) {
        const args = [
          headlessFlag,
          "--disable-gpu",
          "--disable-extensions",
          "--no-first-run",
          "--no-default-browser-check",
          "--print-to-pdf-no-header",
          `--user-data-dir=${profileDir}`,
          `--print-to-pdf=${pdfPath}`,
          sourceUrl,
        ];
        try {
          await execFileAsync(browserPath, args, { timeout: 45000, windowsHide: true });
          const pdfBuffer = await fsp.readFile(pdfPath);
          if (pdfBuffer.length > 0) return pdfBuffer;
          errors.push(`${browserPath}:${headlessFlag}:empty_pdf`);
        } catch (err) {
          errors.push(`${browserPath}:${headlessFlag}:${String(err?.message || err)}`);
        }
      }
    }
    throw new Error(`browser_cli_pdf_failed:${errors.join(" | ")}`);
  } finally {
    await fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function renderPdfFromHtml(html, renderOptions = {}) {
  const options = resolvePdfRenderOptions(renderOptions);
  try {
    const browser = await getPdfBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.setViewportSize(options.viewport);
      await page.setContent(String(html || ""), { waitUntil: "domcontentloaded" });
      await page.emulateMedia({ media: options.media });
      const pdfBuffer = await page.pdf({
        format: options.format,
        landscape: options.landscape,
        printBackground: options.printBackground,
        margin: options.margin,
        preferCSSPageSize: options.preferCSSPageSize,
        scale: options.scale,
      });
      return pdfBuffer;
    } finally {
      await context.close();
    }
  } catch (err) {
    console.warn("Playwright PDF render failed; trying browser CLI fallback.", String(err?.message || err));
    return renderPdfFromHtmlWithBrowserCli(html);
  }
}

async function loadState() {
  try {
    const raw = await fsp.readFile(dataFile, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

function getStateTimestamp(state) {
  const ts = state?.meta?.updated_at || state?.meta?.created_at || "";
  const ms = Date.parse(ts);
  return Number.isFinite(ms) ? ms : 0;
}

function getStateRevision(state) {
  const revision = Number(state?.meta?.revision);
  return Number.isInteger(revision) && revision >= 0 ? revision : 0;
}

async function ensureHistoryDir() {
  await fsp.mkdir(historyDir, { recursive: true });
}

async function writeHistorySnapshot(state, label) {
  if (!state || typeof state !== "object") return;
  await ensureHistoryDir();
  const revision = getStateRevision(state);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safeLabel = String(label || "snapshot").replace(/[^a-zA-Z0-9_-]+/g, "_");
  const fileName = `${stamp}_r${String(revision).padStart(6, "0")}_${safeLabel}.json`;
  await fsp.writeFile(path.join(historyDir, fileName), JSON.stringify(state, null, 2), "utf8");
}

async function pruneHistorySnapshots(limit = historyRetentionCount) {
  if (!Number.isInteger(limit) || limit < 1) return;
  let entries;
  try {
    entries = await fsp.readdir(historyDir, { withFileTypes: true });
  } catch (err) {
    if (err?.code === "ENOENT") return;
    throw err;
  }

  const files = entries
    .filter((entry) => entry?.isFile?.() && String(entry.name || "").toLowerCase().endsWith(".json"))
    .map((entry) => String(entry.name || ""))
    .sort()
    .reverse();

  const staleFiles = files.slice(limit);
  if (!staleFiles.length) return;

  await Promise.allSettled(
    staleFiles.map((fileName) => fsp.unlink(path.join(historyDir, fileName)))
  );
}

async function saveState(state, options = {}) {
  const current = await loadState();
  const baseRevision = Number(options?.baseRevision);
  const incomingTs = getStateTimestamp(state);
  const currentTs = getStateTimestamp(current);
  const currentRevision = getStateRevision(current);

  if (demoCleanupApprovalTypes.has(String(options?.criticalDropApproval?.type || "").trim())
    && !demoTestResetEnabled) {
    return {
      written: false,
      blocked: true,
      error: "demo_test_reset_disabled",
      message: "Demo test ortamı sıfırlama işlemi yalnız PROTOTYPE runtime modunda kullanılabilir.",
      currentRevision,
    };
  }

  if (current && Number.isInteger(baseRevision) && baseRevision !== currentRevision) {
    return { written: false, stale: true, conflict: true, currentRevision };
  }

  // Prevent older payloads from entering any mutation validator when revision is not provided.
  if (current && (!Number.isInteger(baseRevision)) && incomingTs > 0 && currentTs > 0 && incomingTs < currentTs) {
    return { written: false, stale: true, conflict: true, currentRevision };
  }

  const operationalCodeTransition = OperationalCodeHighWater.diagnoseTransition(current, state);
  if (!operationalCodeTransition.ok) {
    return {
      written: false,
      blocked: true,
      error: "operational_code_high_water_conflict",
      message: "Operasyon kodu monoton high-water sözleşmesine uymuyor.",
      issues: operationalCodeTransition.issues,
      currentRevision,
    };
  }

  const verifiedSalesOrderPrototypeReset = isVerifiedSalesOrderPrototypeReset(
    current,
    state,
    options?.criticalDropApproval
  );
  const attemptedStockCohortCleanup = String(options?.criticalDropApproval?.type || "").trim()
    === "stock_demand_demo_cleanup"
    && Number(options?.criticalDropApproval?.meta?.stockCleanupVersion) === 2;
  const stockCohortCleanupVerification = PrototypeStockTestCleanup.diagnoseTransition(
    current,
    state,
    options?.criticalDropApproval
  );
  const verifiedStockCohortCleanup = stockCohortCleanupVerification.ok === true;
  if (attemptedStockCohortCleanup && !verifiedStockCohortCleanup) {
    return {
      written: false,
      blocked: true,
      error: "invalid_stock_test_cohort_cleanup",
      message: "STOCK test kohortu atomik cleanup sözleşmesi doğrulanamadı.",
      issues: [stockCohortCleanupVerification],
      currentRevision,
    };
  }
  const verifiedControlledPrototypeCleanup = verifiedSalesOrderPrototypeReset || verifiedStockCohortCleanup;

  const sanalTaksimMgsOperationalRebindIssues =
    validateSanalTaksimInTransitMgsOperationalRebindTransitions(current, state);
  if (sanalTaksimMgsOperationalRebindIssues.length && !verifiedControlledPrototypeCleanup) {
    return {
      written: false,
      blocked: true,
      error: "invalid_in_transit_mgs_operational_rebind",
      message: "IN_TRANSIT MGS operational rebind geçişi doğrulanamadı.",
      issues: sanalTaksimMgsOperationalRebindIssues,
      currentRevision,
    };
  }

  const sanalTaksimInstructionIssues = validateSanalTaksimAllocationInstructions(state);
  if (sanalTaksimInstructionIssues.length && !verifiedControlledPrototypeCleanup) {
    return {
      written: false,
      blocked: true,
      error: "invalid_sanal_taksim_allocation_instructions",
      message: "Sanal Taksim tahsis talimatı verisi doğrulanamadı.",
      issues: sanalTaksimInstructionIssues,
      currentRevision,
    };
  }

  const sanalTaksimPlanBoundLinkIssues = validateSanalTaksimPlanBoundMontageLinks(state);
  if (sanalTaksimPlanBoundLinkIssues.length && !verifiedControlledPrototypeCleanup) {
    return {
      written: false,
      blocked: true,
      error: "invalid_sanal_taksim_plan_bound_montage_links",
      message: "MGP ve Sanal Taksim tahsis talimatı bağı doğrulanamadı.",
      issues: sanalTaksimPlanBoundLinkIssues,
      currentRevision,
    };
  }

  const sanalTaksimOperationalHoldIssues = validateSanalTaksimOperationalHoldConflicts(state);
  if (sanalTaksimOperationalHoldIssues.length && !verifiedControlledPrototypeCleanup) {
    return {
      written: false,
      blocked: true,
      error: "sanal_taksim_instruction_operational_hold_conflict",
      message: "Sanal Taksim talimatı operasyonel exact hold ile çakışıyor.",
      issues: sanalTaksimOperationalHoldIssues,
      currentRevision,
    };
  }

  const sanalTaksimTransitionIssues = validateSanalTaksimAllocationInstructionTransitions(current, state);
  if (sanalTaksimTransitionIssues.length && !verifiedControlledPrototypeCleanup) {
    return {
      written: false,
      blocked: true,
      error: "immutable_sanal_taksim_allocation_instruction_changed",
      message: "Sanal Taksim tahsis talimatı append-only sözleşmesine uymuyor.",
      issues: sanalTaksimTransitionIssues,
      currentRevision,
    };
  }

  const sanalTaksimStockProtectionIssues = validateSanalTaksimActiveStockRowProtection(current, state);
  if (sanalTaksimStockProtectionIssues.length && !verifiedControlledPrototypeCleanup) {
    return {
      written: false,
      blocked: true,
      error: "active_sanal_taksim_stock_row_changed",
      message: "ACTIVE Sanal Taksim talimatına bağlı stok satırı korunuyor.",
      issues: sanalTaksimStockProtectionIssues,
      currentRevision,
    };
  }

  const sanalTaksimSalesShipmentPlanTransitionIssues =
    validateSanalTaksimSalesShipmentPlanTransitions(current, state);
  if (sanalTaksimSalesShipmentPlanTransitionIssues.length && !verifiedControlledPrototypeCleanup) {
    return {
      written: false,
      blocked: true,
      error: "invalid_sanal_taksim_sales_shipment_plan_transition",
      message: "Sevkiyat planı exact Sanal Taksim allocation sözleşmesine uymuyor.",
      issues: sanalTaksimSalesShipmentPlanTransitionIssues,
      currentRevision,
    };
  }

  const salesShipmentPlanIssues = validateSalesShipmentPlans(state);
  if (salesShipmentPlanIssues.length && !verifiedControlledPrototypeCleanup) {
    return {
      written: false,
      blocked: true,
      error: "invalid_sales_shipment_plans",
      message: "Satış sevkiyat planı verisi doğrulanamadı.",
      issues: salesShipmentPlanIssues,
      currentRevision,
    };
  }

  const salesShipmentIssues = validateSalesShipments(state);
  if (salesShipmentIssues.length && !verifiedControlledPrototypeCleanup) {
    return {
      written: false,
      blocked: true,
      error: "invalid_sales_shipments",
      message: "Gerçek satış sevkiyatı verisi doğrulanamadı.",
      issues: salesShipmentIssues,
      currentRevision,
    };
  }

  const salesShipmentImmutabilityIssues = validateSalesShipmentImmutability(current, state);
  if (salesShipmentImmutabilityIssues.length && !verifiedControlledPrototypeCleanup) {
    return {
      written: false,
      blocked: true,
      error: "immutable_sales_shipment_changed",
      message: "Gerçek satış sevkiyatı kaydı değiştirilemez.",
      issues: salesShipmentImmutabilityIssues,
      currentRevision,
    };
  }

  const criticalDropIssues = analyzeCriticalCollectionDrops(current, state);
  if (criticalDropIssues.length && !areCriticalDropIssuesApproved(criticalDropIssues, options?.criticalDropApproval)) {
    console.error("Critical data loss risk blocked. demo_state.json was not modified.", criticalDropIssues);
    return {
      written: false,
      blocked: true,
      error: "critical_data_loss_risk",
      message: "Kritik veri kaybı riski nedeniyle kayıt engellendi.",
      issues: criticalDropIssues,
      currentRevision,
    };
  }
  if (criticalDropIssues.length) {
    console.warn("Approved critical collection drop for controlled demo cleanup.", criticalDropIssues);
  }

  const nextRevision = currentRevision + 1;
  if (!state.meta || typeof state.meta !== "object") state.meta = {};
  OperationalCodeHighWater.applyPersistentMarks(
    state,
    operationalCodeTransition.marks,
    operationalCodeTransition.untrustedFamilies
  );
  state.meta.revision = nextRevision;

  if (current) {
    await writeHistorySnapshot(current, "before-save");
  }
  const tmp = `${dataFile}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
  await fsp.rename(tmp, dataFile);
  await writeHistorySnapshot(state, "after-save");
  try {
    await pruneHistorySnapshots();
  } catch (err) {
    console.warn("History snapshot cleanup failed.", err);
  }
  return {
    written: true,
    stale: false,
    conflict: false,
    revision: nextRevision,
    operationalCodeHighWaterMarks: { ...operationalCodeTransition.marks },
    operationalCodeHighWaterUntrustedFamilies: [...operationalCodeTransition.untrustedFamilies],
  };
}

const server = http.createServer(async (req, res) => {
  const reqPath = decodeURIComponent((req.url || "/").split("?")[0]);

  if (req.method === "GET" && reqPath === "/api/state") {
    try {
      const state = await loadState();
      return sendJson(res, 200, {
        ok: true,
        state,
        runtime: { mode: runtimeMode, demoTestResetEnabled },
      });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: "state_read_failed" });
    }
  }

  if (req.method === "POST" && reqPath === "/api/state") {
    try {
      const body = await readBody(req);
      const payload = JSON.parse(body || "{}");
      const state = payload?.state || payload;
      const baseRevision = payload?.baseRevision;
      const criticalDropApproval = payload?.criticalDropApproval || null;
      if (!state || typeof state !== "object") {
        return sendJson(res, 400, { ok: false, error: "invalid_state" });
      }

      const result = await saveState(state, { baseRevision, criticalDropApproval });
      if (result?.blocked) {
        return sendJson(res, 422, { ok: false, ...result });
      }
      if (result?.conflict) {
        return sendJson(res, 409, { ok: false, error: "save_conflict", ...result });
      }
      return sendJson(res, 200, { ok: true, ...result });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: "state_write_failed" });
    }
  }

  if (req.method === "POST" && reqPath === "/api/dispatch-pdf") {
    try {
      const body = await readBody(req);
      const payload = JSON.parse(body || "{}");
      const html = String(payload?.html || "");
      if (!html.trim()) {
        return sendJson(res, 400, { ok: false, error: "invalid_html" });
      }
      const fileName = sanitizeDownloadName(payload?.fileName || "teslim-belgesi");
      const pdfBuffer = await renderPdfFromHtml(html, payload?.pdfOptions);
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": buildContentDisposition(fileName, "pdf"),
        "Content-Length": String(pdfBuffer.length),
        ...noCacheHeaders,
      });
      res.end(pdfBuffer);
      return;
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: "pdf_build_failed", message: String(err?.message || err) });
    }
  }

  const safePath = path.normalize(reqPath).replace(/^([.][.][/\\])+/, "");
  let filePath = path.join(root, safePath === "/" ? "index.html" : safePath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statErr, stat) => {
    if (!statErr && stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", ...noCacheHeaders });
        res.end("Not Found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeMap[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType, ...noCacheHeaders });
      res.end(data);
    });
  });
});

if (require.main === module) {
  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      console.error(`Port ${port} kullanımda.`);
      process.exit(1);
    }
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`Dulda ERP demo hazır: http://localhost:${port}/index.html`);
    console.log(`Kalıcı veri dosyası: ${dataFile}`);
    console.log(`Runtime modu: ${runtimeMode} / demo test sıfırlama: ${demoTestResetEnabled ? "açık" : "kapalı"}`);
  });

  process.on("exit", () => {
    if (!pdfBrowserPromise) return;
    Promise.resolve(pdfBrowserPromise)
      .then((browser) => browser?.close?.())
      .catch(() => {});
  });
}

module.exports = {
  runtimeMode,
  demoTestResetEnabled,
  analyzeCriticalCollectionDrops,
  validateSanalTaksimAllocationInstructions,
  validateSanalTaksimPlanBoundMontageLinks,
  validateSanalTaksimAllocationInstructionTransitions,
  isSanalTaksimDraftPlanBoundAtomicRebind,
  validateSanalTaksimActiveStockRowProtection,
  validateSanalTaksimOperationalHoldConflicts,
  isSanalTaksimInTransitMgsOperationalRebind,
  isSanalTaksimReboundMgsAtomicReceipt,
  validateSanalTaksimInTransitMgsOperationalRebindTransitions,
  validateSanalTaksimSalesShipmentPlanTransitions,
  validateSalesShipmentPlans,
  validateSalesShipments,
  validateSalesShipmentImmutability,
  isVerifiedSalesOrderPrototypeReset,
  isVerifiedPrototypeStockTestCleanup: PrototypeStockTestCleanup.verifyTransition,
  isVerifiedPrototypeSalesTestCohortCleanup: PrototypeSalesTestCohortCleanup.verifyTransition,
  OperationalCodeHighWater,
};
