/**
 * DULDA ERP - Sanal Taksim Faz 1
 *
 * Bağımsız, deterministik ve salt okunur current-stage resolver.
 * Bu dosya Faz 1'de çalışma zamanına bağlanmaz.
 */
const SanalTaksimResolver = (() => {
    const VERSION = '6.0.0-origin-independent-phase-b';
    const EPSILON = 0.000001;
    const MONTAGE_STOCK_TRANSFER_MODE = 'POST_ON_RECEIPT_V1';
    const WORK_TXN_TYPES = new Set(['TAKE', 'COMPLETE', 'STORE']);
    const SOURCE_BUCKETS = Object.freeze({
        STOCK: 'FROM_STOCK',
        SEMI: 'FROM_SEMI',
        PRODUCTION: 'FROM_PRODUCTION'
    });
    const PHYSICAL_ALLOCATION_STATES = Object.freeze({
        REALLOCATABLE: 'REALLOCATABLE',
        RESERVED: 'RESERVED',
        LOCKED: 'LOCKED',
        UNCERTAIN: 'UNCERTAIN',
        CONSUMED: 'CONSUMED',
        SHIPPED: 'SHIPPED'
    });
    const STAGE_ORDER = new Map([
        ['IN_PROCESS', 10],
        ['TRANSFER_PENDING', 20],
        ['DEPOT_PENDING', 30],
        ['DEPOT_STOCK', 40],
        ['MONTAGE_IN_TRANSIT', 50],
        ['MONTAGE_RECEIVED', 60],
        ['MONTAGE_PENDING_DEPOT_RECEIPT', 70],
        ['MONTAGE_FINISHED_STOCK', 80]
    ]);

    const asArray = (value) => (Array.isArray(value) ? value : []);
    const text = (value) => String(value ?? '').trim();
    const code = (value) => text(value).toLocaleUpperCase('tr-TR');
    const roundQty = (value) => Number(Number(value || 0).toFixed(6));
    const isPositiveQty = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
    const sameQty = (left, right) => Math.abs(Number(left || 0) - Number(right || 0)) <= EPSILON;
    const compareText = (left, right) => String(left || '').localeCompare(String(right || ''), 'tr');

    const buildAllocationInstructionOriginAudit = (segment) => ({
        sourceKind: text(segment?.sourceKind),
        originSourceType: code(segment?.originSourceType),
        originOrderId: text(segment?.originOrderId),
        originOrderLineId: text(segment?.originOrderLineId),
        originDemandId: text(segment?.originDemandId),
        originItemKey: text(segment?.originItemKey),
        originWorkOrderId: text(segment?.originWorkOrderId),
        originWorkOrderLineId: text(segment?.originWorkOrderLineId),
        evidenceIds: asArray(segment?.evidenceIds).map(text).filter(Boolean).sort(compareText)
    });

    const buildAllocationInstructionLineageKey = (record, audit) => [
        'LINEAGE',
        text(record?.prcId),
        code(record?.prcCode),
        code(record?.unit),
        code(audit?.originSourceType),
        text(audit?.originOrderId),
        text(audit?.originOrderLineId),
        text(audit?.originDemandId),
        text(audit?.originItemKey),
        text(audit?.originWorkOrderId),
        text(audit?.originWorkOrderLineId)
    ].join('|');

    const normalizeAllocationInstructionOriginAudit = (audit) => ({
        sourceKind: text(audit?.sourceKind),
        originSourceType: code(audit?.originSourceType),
        originOrderId: text(audit?.originOrderId),
        originOrderLineId: text(audit?.originOrderLineId),
        originDemandId: text(audit?.originDemandId),
        originItemKey: text(audit?.originItemKey),
        originWorkOrderId: text(audit?.originWorkOrderId),
        originWorkOrderLineId: text(audit?.originWorkOrderLineId),
        evidenceIds: asArray(audit?.evidenceIds).map(text).filter(Boolean).sort(compareText)
    });

    const stableSort = (rows, selector) => asArray(rows)
        .map((row, index) => ({ row, index, key: String(selector(row, index) || '') }))
        .sort((left, right) => compareText(left.key, right.key) || left.index - right.index)
        .map((entry) => entry.row);

    const normalizeSalesTarget = (value) => ({
        sourceOrderId: text(value?.sourceOrderId || value?.orderId),
        sourceLineId: text(value?.sourceLineId || value?.orderLineId || value?.lineId),
        demandId: text(value?.demandId || value?.sourceDemandId),
        itemKey: text(value?.itemKey || value?.sourceItemKey)
    });

    const isCompleteSalesTarget = (target) => Object.values(normalizeSalesTarget(target)).every(Boolean);
    const sameSalesTarget = (left, right) => {
        const a = normalizeSalesTarget(left);
        const b = normalizeSalesTarget(right);
        return a.sourceOrderId === b.sourceOrderId
            && a.sourceLineId === b.sourceLineId
            && a.demandId === b.demandId
            && a.itemKey === b.itemKey;
    };
    const buildSalesTargetKey = (target) => {
        const normalized = normalizeSalesTarget(target);
        return [
            normalized.sourceOrderId,
            normalized.sourceLineId,
            normalized.demandId,
            normalized.itemKey
        ].map((value) => encodeURIComponent(value)).join('|');
    };
    const normalizeVariantId = (value) => text(value).replace(/^salesvar_/i, '');
    const buildMontageProductFingerprint = (item) => {
        const productId = text(item?.productId);
        const variantId = normalizeVariantId(item?.variantId || item?.variationId);
        const variantCode = code(item?.variantCode || item?.variationCode || item?.productCode);
        if (!productId || !variantId || !variantCode) return '';
        return ['MGS_PRODUCT_V1', productId, variantId, variantCode]
            .map((value) => encodeURIComponent(value)).join('|');
    };
    const buildMontageRecipeFingerprint = (item) => {
        const totals = new Map();
        for (const part of asArray(item?.recipeParts)) {
            const prcId = text(part?.refId || part?.prcId);
            const prcCode = code(part?.code || part?.prcCode);
            const unit = code(part?.unit);
            const qtyPerSet = Number(part?.qtyPerSet);
            if (!prcId || !prcCode || !unit || !isPositiveQty(qtyPerSet)) return '';
            const key = [prcId, prcCode, unit].map((value) => encodeURIComponent(value)).join('|');
            totals.set(key, roundQty((totals.get(key) || 0) + qtyPerSet));
        }
        if (!totals.size) return '';
        return `MGS_RECIPE_V1|${Array.from(totals.entries())
            .sort((left, right) => compareText(left[0], right[0]))
            .map(([key, qty]) => `${key}|${qty}`).join(';')}`;
    };
    const getMontageShipmentExactRanges = (shipment) => asArray(shipment?.parts)
        .flatMap((part) => asArray(part?.allocations).flatMap((allocation) =>
            asArray(allocation?.segmentRanges).map((range) => ({
                part,
                allocation,
                range
            }))
        ));
    const buildMontageExactRangeFingerprint = (shipment) => {
        const rows = [];
        for (const { part, allocation, range } of getMontageShipmentExactRanges(shipment)) {
            const normalized = {
                reservationKey: text(range?.reservationKey),
                planId: text(range?.planId),
                prcId: text(range?.prcId || part?.refId),
                prcCode: code(range?.prcCode || part?.code),
                unit: code(range?.unit || allocation?.unit || part?.unit),
                sourceBucket: code(range?.sourceBucket || allocation?.sourceBucket),
                stockRowId: text(range?.stockRowId || allocation?.stockRowId || allocation?.stockDepotItemId),
                physicalSegmentId: text(range?.physicalSegmentId || allocation?.physicalSegmentId),
                segmentOffsetStart: Number(range?.segmentOffsetStart),
                segmentOffsetEnd: Number(range?.segmentOffsetEnd),
                qty: Number(range?.qty)
            };
            if (!normalized.reservationKey || !normalized.planId || !normalized.prcId
                || !normalized.prcCode || !normalized.unit || !normalized.sourceBucket
                || !normalized.stockRowId
                || normalized.physicalSegmentId !== `STOCK|${normalized.stockRowId}`
                || !Number.isFinite(normalized.segmentOffsetStart)
                || !Number.isFinite(normalized.segmentOffsetEnd)
                || !isPositiveQty(normalized.qty)
                || normalized.segmentOffsetStart < 0
                || normalized.segmentOffsetEnd <= normalized.segmentOffsetStart
                || !sameQty(normalized.segmentOffsetEnd - normalized.segmentOffsetStart, normalized.qty)) return '';
            rows.push(normalized);
        }
        if (!rows.length) return '';
        return `MGS_RANGE_V1|${stableSort(rows, (row) => [
            row.prcCode,
            row.unit,
            row.physicalSegmentId,
            String(row.segmentOffsetStart).padStart(30, '0'),
            row.reservationKey
        ].join('|')).map((row) => [
            row.reservationKey,
            row.planId,
            row.prcId,
            row.prcCode,
            row.unit,
            row.sourceBucket,
            row.stockRowId,
            row.physicalSegmentId,
            roundQty(row.segmentOffsetStart),
            roundQty(row.segmentOffsetEnd),
            roundQty(row.qty)
        ].map((value) => encodeURIComponent(String(value))).join('|')).join(';')}`;
    };
    const buildMontageOperationalRebindKey = ({ shipmentId, fromTarget, toTarget, exactRangeFingerprint }) => [
        'D2C1B1_REBIND',
        encodeURIComponent(text(shipmentId)),
        buildSalesTargetKey(fromTarget),
        buildSalesTargetKey(toTarget),
        encodeURIComponent(text(exactRangeFingerprint))
    ].join('|');

    const resolveMontageShipmentOperationalTarget = (shipment) => {
        const items = asArray(shipment?.items);
        const events = asArray(shipment?.operationalRebindEvents);
        if (!events.length) {
            return {
                ok: true,
                reasonCode: '',
                rebound: false,
                target: items.length === 1 ? normalizeSalesTarget(items[0]) : null,
                event: null
            };
        }
        const item = items.length === 1 ? items[0] : null;
        const event = events.length === 1 ? events[0] : null;
        if (!item || !event) {
            return { ok: false, reasonCode: events.length > 1 ? 'MGS_OPERATIONAL_REBIND_MULTIPLE' : 'MGS_OPERATIONAL_REBIND_ITEM_INVALID' };
        }
        const fromTarget = normalizeSalesTarget(event?.fromTarget);
        const toTarget = normalizeSalesTarget(event?.toTarget);
        const originalTarget = normalizeSalesTarget(item);
        const productFingerprint = buildMontageProductFingerprint(item);
        const recipeFingerprint = buildMontageRecipeFingerprint(item);
        const exactRangeFingerprint = buildMontageExactRangeFingerprint(shipment);
        const expectedRebindKey = buildMontageOperationalRebindKey({
            shipmentId: shipment?.id,
            fromTarget,
            toTarget,
            exactRangeFingerprint
        });
        const valid = Number(event?.contractVersion) === 1
            && code(event?.type) === 'OPERATIONAL_REBIND'
            && text(event?.eventId)
            && text(event?.rebindKey) === expectedRebindKey
            && sameSalesTarget(fromTarget, originalTarget)
            && isCompleteSalesTarget(toTarget)
            && !sameSalesTarget(fromTarget, toTarget)
            && Number.isSafeInteger(Number(event?.setQty))
            && Number(event.setQty) > 0
            && sameQty(event.setQty, item?.shippedQty)
            && code(event?.unit) === 'ADET'
            && productFingerprint
            && text(event?.productFingerprint) === productFingerprint
            && recipeFingerprint
            && text(event?.recipeFingerprint) === recipeFingerprint
            && exactRangeFingerprint
            && text(event?.exactRangeFingerprint) === exactRangeFingerprint
            && Number.isFinite(Date.parse(text(event?.at)))
            && text(event?.by)
            && text(event?.reason);
        return valid
            ? { ok: true, reasonCode: '', rebound: true, target: toTarget, fromTarget, event }
            : { ok: false, reasonCode: 'MGS_OPERATIONAL_REBIND_EVENT_INVALID' };
    };

    const resolveMontageShipmentOperationalItems = (shipment) => {
        const resolution = resolveMontageShipmentOperationalTarget(shipment);
        if (!resolution.ok) return { ...resolution, items: [] };
        if (!resolution.rebound) return { ...resolution, items: asArray(shipment?.items) };
        return {
            ...resolution,
            items: [{
                ...asArray(shipment?.items)[0],
                sourceType: 'SALES_ORDER',
                sourceOrderId: resolution.target.sourceOrderId,
                sourceOrderNo: '',
                sourceLineId: resolution.target.sourceLineId,
                demandId: resolution.target.demandId,
                demandCode: '',
                itemKey: resolution.target.itemKey
            }]
        };
    };

    const getQtyAliasResult = (row) => {
        const fields = ['qty', 'quantity', 'amount'];
        const present = fields
            .filter((field) => Object.prototype.hasOwnProperty.call(row || {}, field)
                && row?.[field] !== ''
                && row?.[field] !== null
                && row?.[field] !== undefined)
            .map((field) => ({ field, value: Number(row[field]) }));
        if (!present.length) return { ok: false, reasonCode: 'QTY_MISSING', qty: 0, fields: [] };
        if (present.some((entry) => !Number.isFinite(entry.value))) {
            return { ok: false, reasonCode: 'QTY_INVALID', qty: 0, fields: present };
        }
        const first = present[0].value;
        if (present.some((entry) => !sameQty(entry.value, first))) {
            return { ok: false, reasonCode: 'QTY_ALIAS_CONFLICT', qty: 0, fields: present };
        }
        return { ok: true, reasonCode: '', qty: roundQty(first), fields: present };
    };

    const createPrcIndex = (cards) => {
        const byCode = new Map();
        const byId = new Map();
        asArray(cards).forEach((card) => {
            const cardCode = code(card?.code);
            const cardId = text(card?.id);
            if (cardCode) {
                if (!byCode.has(cardCode)) byCode.set(cardCode, []);
                byCode.get(cardCode).push(card);
            }
            if (cardId) {
                if (!byId.has(cardId)) byId.set(cardId, []);
                byId.get(cardId).push(card);
            }
        });
        return { byCode, byId };
    };

    const resolveExactPrc = (prcIndex, rawCode, rawRefId = '') => {
        const prcCode = code(rawCode);
        const refId = text(rawRefId);
        if (!prcCode) return { ok: false, reasonCode: 'PRC_CODE_MISSING', candidates: [] };
        const codeMatches = asArray(prcIndex?.byCode?.get(prcCode));
        let card = null;
        if (refId) {
            const idMatches = asArray(prcIndex?.byId?.get(refId));
            if (idMatches.length !== 1) {
                return {
                    ok: false,
                    reasonCode: idMatches.length > 1 ? 'PRC_REF_DUPLICATE' : 'PRC_REF_CODE_CONFLICT',
                    candidates: idMatches.map((row) => code(row?.code)).filter(Boolean).sort(compareText)
                };
            }
            card = idMatches[0];
            if (code(card?.code) !== prcCode) {
                return {
                    ok: false,
                    reasonCode: 'PRC_REF_CODE_CONFLICT',
                    candidates: [code(card?.code)].filter(Boolean)
                };
            }
        } else if (codeMatches.length === 1) {
            card = codeMatches[0];
        } else {
            return {
                ok: false,
                reasonCode: codeMatches.length > 1 ? 'PRC_CODE_DUPLICATE' : 'PRC_NOT_FOUND',
                candidates: codeMatches.map((card) => text(card?.id)).filter(Boolean).sort(compareText)
            };
        }
        return {
            ok: true,
            reasonCode: '',
            card,
            prcId: text(card?.id),
            prcCode,
            unit: code(card?.unit || card?.stockUnit || 'ADET') || 'ADET',
            candidates: []
        };
    };

    const normalizeRoute = (route, index) => ({
        raw: route,
        index,
        routeId: text(route?.id),
        routeSeq: index + 1,
        declaredSeq: Number(route?.seq || 0),
        stationId: text(route?.stationId),
        processId: code(route?.processId)
    });

    const validateRoutes = (line) => {
        const routes = asArray(line?.routes).map(normalizeRoute);
        if (!routes.length) return { ok: false, reasonCode: 'ROUTE_MISSING', routes: [] };
        if (routes.some((route) => !route.stationId)) {
            return { ok: false, reasonCode: 'ROUTE_STATION_MISSING', routes };
        }
        if (routes.some((route) => route.declaredSeq > 0 && route.declaredSeq !== route.routeSeq)) {
            return { ok: false, reasonCode: 'ROUTE_DEFINITION_SEQ_CONFLICT', routes };
        }
        const routeIds = routes.map((route) => route.routeId).filter(Boolean);
        if (new Set(routeIds).size !== routeIds.length) {
            return { ok: false, reasonCode: 'ROUTE_ID_DUPLICATE', routes };
        }
        return { ok: true, reasonCode: '', routes };
    };

    const resolveTransactionRoute = (line, txn) => {
        const routeValidation = validateRoutes(line);
        if (!routeValidation.ok) {
            return { ok: false, reasonCode: routeValidation.reasonCode, routeIndex: -1, candidates: [] };
        }
        const routes = routeValidation.routes;
        const stationId = text(txn?.stationId);
        const txnRouteId = text(txn?.routeId);
        const txnRouteSeq = Math.max(0, Number(txn?.routeSeq || 0));
        const txnProcessId = code(txn?.processId);
        if (!stationId) {
            return { ok: false, reasonCode: 'TXN_STATION_MISSING', routeIndex: -1, candidates: [] };
        }

        if (txnRouteId) {
            const matches = routes.filter((route) => route.routeId === txnRouteId && route.stationId === stationId);
            if (matches.length !== 1) {
                return {
                    ok: false,
                    reasonCode: matches.length > 1 ? 'TXN_ROUTE_ID_DUPLICATE' : 'TXN_ROUTE_ID_MISMATCH',
                    routeIndex: -1,
                    candidates: matches.map((route) => route.routeId || String(route.routeSeq))
                };
            }
            const match = matches[0];
            if (txnRouteSeq > 0 && txnRouteSeq !== match.routeSeq) {
                return {
                    ok: false,
                    reasonCode: 'TXN_ROUTE_ID_SEQ_CONFLICT',
                    routeIndex: -1,
                    candidates: [match.routeId, String(txnRouteSeq)].filter(Boolean)
                };
            }
            if (txnProcessId && match.processId && txnProcessId !== match.processId) {
                return {
                    ok: false,
                    reasonCode: 'TXN_ROUTE_ID_PROCESS_CONFLICT',
                    routeIndex: -1,
                    candidates: [match.processId, txnProcessId].filter(Boolean)
                };
            }
            return { ok: true, reasonCode: '', routeIndex: match.index, candidates: [] };
        }

        if (txnRouteSeq > 0) {
            const match = routes[txnRouteSeq - 1];
            if (!match) {
                return { ok: false, reasonCode: 'TXN_ROUTE_SEQ_OUT_OF_RANGE', routeIndex: -1, candidates: [] };
            }
            if (match.stationId !== stationId) {
                return {
                    ok: false,
                    reasonCode: 'TXN_ROUTE_SEQ_STATION_CONFLICT',
                    routeIndex: -1,
                    candidates: [match.stationId, stationId].filter(Boolean)
                };
            }
            if (txnProcessId && match.processId && txnProcessId !== match.processId) {
                return {
                    ok: false,
                    reasonCode: 'TXN_ROUTE_SEQ_PROCESS_CONFLICT',
                    routeIndex: -1,
                    candidates: [match.processId, txnProcessId].filter(Boolean)
                };
            }
            return { ok: true, reasonCode: '', routeIndex: match.index, candidates: [] };
        }

        if (txnProcessId) {
            const processMatches = routes.filter((route) =>
                route.stationId === stationId && route.processId === txnProcessId
            );
            if (processMatches.length === 1) {
                return { ok: true, reasonCode: '', routeIndex: processMatches[0].index, candidates: [] };
            }
            if (processMatches.length > 1) {
                return {
                    ok: false,
                    reasonCode: 'TXN_STATION_PROCESS_DUPLICATE',
                    routeIndex: -1,
                    candidates: processMatches.map((route) => route.routeId || String(route.routeSeq))
                };
            }
        }

        const stationMatches = routes.filter((route) => route.stationId === stationId);
        if (stationMatches.length === 1) {
            return { ok: true, reasonCode: '', routeIndex: stationMatches[0].index, candidates: [] };
        }
        return {
            ok: false,
            reasonCode: stationMatches.length > 1 ? 'TXN_STATION_REPEATED_AMBIGUOUS' : 'TXN_STATION_NOT_IN_ROUTE',
            routeIndex: -1,
            candidates: stationMatches.map((route) => route.routeId || String(route.routeSeq))
        };
    };

    const createUncertain = ({
        kind,
        id = '',
        reasonCode,
        prcCode = '',
        unit = '',
        reportedQty = null,
        workOrderId = '',
        lineId = '',
        candidates = [],
        evidenceIds = [],
        targetDebtKey = '',
        sourceOrderId = '',
        sourceLineId = '',
        demandId = '',
        itemKey = ''
    }) => ({
        kind: text(kind) || 'UNKNOWN',
        id: text(id),
        reasonCode: text(reasonCode) || 'UNCERTAIN',
        prcCode: code(prcCode),
        unit: code(unit),
            reportedQty: reportedQty !== null
                && reportedQty !== undefined
                && reportedQty !== ""
                && Number.isFinite(Number(reportedQty))
                ? roundQty(reportedQty)
                : null,
        quantitySemantics: 'EVIDENCE_ONLY',
        allocatable: false,
        allocatableQty: 0,
        workOrderId: text(workOrderId),
        lineId: text(lineId),
        targetDebtKey: text(targetDebtKey),
        sourceOrderId: text(sourceOrderId),
        sourceLineId: text(sourceLineId),
        demandId: text(demandId),
        itemKey: text(itemKey),
        candidates: asArray(candidates).map(text).filter(Boolean).sort(compareText),
        evidenceIds: asArray(evidenceIds).map(text).filter(Boolean).sort(compareText)
    });

    const createWorkSegment = ({
        stage,
        qty,
        prc,
        order,
        line,
        route,
        evidenceIds
    }) => ({
        segmentKey: `WORK|${text(order?.id)}|${text(line?.id)}|${stage}|${Number(route?.routeSeq || 0)}`,
        itemType: 'PRC',
        prcId: prc.prcId,
        prcCode: prc.prcCode,
        unit: prc.unit,
        stage,
        qty: roundQty(qty),
        physicalQty: roundQty(qty),
        allocatable: true,
        allocatableQty: roundQty(qty),
        sourceKind: 'WORK_ORDER',
        originWorkOrderId: text(order?.id),
        originWorkOrderCode: text(order?.workOrderCode),
        originWorkOrderLineId: text(line?.id),
        originDemandId: text(order?.sourceId),
        originItemKey: text(order?.sourceItemKey),
        routeId: text(route?.routeId),
        routeSeq: Number(route?.routeSeq || 0),
        stationId: text(route?.stationId),
        processId: code(route?.processId),
        evidenceIds: asArray(evidenceIds).map(text).filter(Boolean).sort(compareText)
    });

    const classifyStockSource = (row) => {
        const sourceType = code(row?.sourceType);
        const sourceOrderId = text(row?.sourceOrderId);
        const sourceLineId = text(row?.sourceLineId);
        const demandId = text(row?.demandId);
        const itemKey = text(row?.itemKey);
        const hasCanonicalFields = [sourceOrderId, sourceLineId, demandId, itemKey].some(Boolean);
        if (sourceType === 'SALES_ORDER') {
            if (!sourceOrderId || !sourceLineId || !demandId || !itemKey) {
                return { ok: false, reasonCode: 'STOCK_SOURCE_PARTIAL', sourceType };
            }
            return { ok: true, reasonCode: '', sourceType };
        }
        if (sourceType === 'STOCK') {
            if (!demandId || !itemKey) return { ok: false, reasonCode: 'STOCK_SOURCE_PARTIAL', sourceType };
            return { ok: true, reasonCode: '', sourceType };
        }
        if (hasCanonicalFields) {
            return { ok: false, reasonCode: 'STOCK_SOURCE_CONFLICT', sourceType };
        }
        return { ok: true, reasonCode: '', sourceType: sourceType || 'UNSCOPED' };
    };

    const getStockLocationKey = (row) => text(
        row?.locationId
        || row?.locationCode
        || row?.depotId
        || row?.unitId
        || row?.stationId
        || row?.nodeKey
    );

    const isMainDepotEvidence = (row) => {
        const depotId = text(row?.depotId).toLowerCase();
        const nodeKey = text(row?.nodeKey).toLowerCase();
        if (depotId && depotId !== 'main') return false;
        if (nodeKey && nodeKey !== 'managed:main') return false;
        return depotId === 'main' || nodeKey === 'managed:main';
    };

    const resolveProductionStockOrigin = ({
        row,
        qty,
        prc,
        sourceType,
        movements,
        workOrders,
        prcIndex
    }) => {
        const demandId = text(row?.demandId);
        const itemKey = text(row?.itemKey);
        if (!['SALES_ORDER', 'STOCK'].includes(sourceType) || !demandId || !itemKey) {
            return {
                verified: false,
                reasonCode: 'PRODUCTION_ORIGIN_NOT_APPLICABLE',
                evidenceIds: []
            };
        }
        if (!isMainDepotEvidence(row)) {
            return {
                verified: false,
                reasonCode: 'PRODUCTION_MAIN_DEPOT_EVIDENCE_MISSING',
                evidenceIds: [text(row?.id)].filter(Boolean)
            };
        }

        const candidates = asArray(movements).filter((movement) => {
            const movementType = code(movement?.movementType || movement?.type);
            const movementQty = getQtyAliasResult(movement);
            if (movementType !== 'STORE'
                || !movementQty.ok
                || !sameQty(movementQty.qty, qty)
                || !isMainDepotEvidence(movement)
                || text(movement?.demandId) !== demandId
                || text(movement?.itemKey) !== itemKey
                || code(movement?.sourceType) !== sourceType
                || code(movement?.productCode || movement?.code) !== prc.prcCode
                || code(movement?.unit) !== prc.unit) {
                return false;
            }
            const sourceOrderId = text(row?.sourceOrderId);
            const sourceLineId = text(row?.sourceLineId);
            return (!sourceOrderId || text(movement?.sourceOrderId) === sourceOrderId)
                && (!sourceLineId || text(movement?.sourceLineId) === sourceLineId);
        });
        if (candidates.length !== 1) {
            return {
                verified: false,
                reasonCode: candidates.length > 1
                    ? 'PRODUCTION_STORE_ORIGIN_AMBIGUOUS'
                    : 'PRODUCTION_STORE_EVIDENCE_MISSING',
                evidenceIds: candidates.map((movement) => text(movement?.id)).filter(Boolean).sort(compareText)
            };
        }

        const movement = candidates[0];
        const workOrderId = text(movement?.workOrderId);
        const workOrderLineId = text(movement?.workOrderLineId || movement?.lineId);
        const matchingOrders = asArray(workOrders).filter((order) => text(order?.id) === workOrderId);
        if (!workOrderId || matchingOrders.length !== 1) {
            return {
                verified: false,
                reasonCode: matchingOrders.length > 1
                    ? 'PRODUCTION_STORE_WO_AMBIGUOUS'
                    : 'PRODUCTION_STORE_WO_MISSING',
                evidenceIds: [text(movement?.id)].filter(Boolean)
            };
        }
        const order = matchingOrders[0];
        const matchingLines = asArray(order?.lines)
            .filter((line) => text(line?.id) === workOrderLineId);
        if (!workOrderLineId || matchingLines.length !== 1) {
            return {
                verified: false,
                reasonCode: matchingLines.length > 1
                    ? 'PRODUCTION_STORE_WO_LINE_AMBIGUOUS'
                    : 'PRODUCTION_STORE_WO_LINE_MISSING',
                evidenceIds: [text(movement?.id), workOrderId].filter(Boolean).sort(compareText)
            };
        }
        const line = matchingLines[0];
        const linePrc = resolveExactPrc(
            prcIndex,
            line?.componentCode,
            line?.componentId || line?.refId
        );
        const rowWorkOrderId = text(row?.workOrderId);
        const rowWorkOrderLineId = text(row?.workOrderLineId);
        if (text(order?.sourceId) !== demandId
            || text(order?.sourceItemKey) !== itemKey
            || !linePrc.ok
            || linePrc.prcId !== prc.prcId
            || linePrc.prcCode !== prc.prcCode
            || linePrc.unit !== prc.unit
            || (code(line?.unit) && code(line?.unit) !== prc.unit)
            || (rowWorkOrderId && rowWorkOrderId !== workOrderId)
            || (rowWorkOrderLineId && rowWorkOrderLineId !== workOrderLineId)) {
            return {
                verified: false,
                reasonCode: 'PRODUCTION_STORE_ORIGIN_CONFLICT',
                evidenceIds: [text(movement?.id), workOrderId, workOrderLineId]
                    .filter(Boolean)
                    .sort(compareText)
            };
        }
        return {
            verified: true,
            reasonCode: '',
            workOrderId,
            workOrderLineId,
            movementId: text(movement?.id),
            demandId,
            itemKey,
            evidenceIds: [text(row?.id), text(movement?.id), workOrderId, workOrderLineId]
                .filter(Boolean)
                .sort(compareText)
        };
    };

    const createStockSegment = ({ row, qty, prc, sourceType, productionOrigin }) => {
        const stockClass = code(row?.stockClass || row?.status || 'KULLANILABILIR');
        const stage = stockClass === 'MONTAGE_RECEIVED' ? 'MONTAGE_RECEIVED' : 'DEPOT_STOCK';
        return {
            segmentKey: `STOCK|${text(row?.id)}`,
            itemType: 'PRC',
            prcId: prc.prcId,
            prcCode: prc.prcCode,
            unit: prc.unit,
            stage,
            qty: roundQty(qty),
            physicalQty: roundQty(qty),
            allocatable: true,
            allocatableQty: roundQty(qty),
            sourceKind: 'CURRENT_STOCK_ROW',
            stockRowId: text(row?.id),
            stockClass,
            locationKey: getStockLocationKey(row),
            mainDepot: isMainDepotEvidence(row),
            allocationType: code(row?.allocationType),
            originSourceType: sourceType,
            originWorkOrderId: text(productionOrigin?.workOrderId || row?.workOrderId),
            originWorkOrderLineId: text(productionOrigin?.workOrderLineId || row?.workOrderLineId),
            originDemandId: text(row?.demandId),
            originItemKey: text(row?.itemKey),
            originOrderId: text(row?.sourceOrderId),
            originOrderLineId: text(row?.sourceLineId),
            productionOriginVerified: productionOrigin?.verified === true,
            productionOriginReasonCode: text(productionOrigin?.reasonCode),
            physicalOrigin: {
                sourceType,
                demandId: text(row?.demandId),
                itemKey: text(row?.itemKey),
                workOrderId: text(productionOrigin?.workOrderId || row?.workOrderId),
                workOrderLineId: text(productionOrigin?.workOrderLineId || row?.workOrderLineId),
                storeMovementId: text(productionOrigin?.movementId),
                verified: productionOrigin?.verified === true,
                reasonCode: text(productionOrigin?.reasonCode)
            },
            evidenceIds: asArray(productionOrigin?.evidenceIds).length
                ? asArray(productionOrigin.evidenceIds)
                : [text(row?.id)].filter(Boolean)
        };
    };

    const classifyPhysicalSegment = (segment) => {
        const physicalQty = roundQty(segment?.physicalQty ?? segment?.qty);
        const stage = code(segment?.stage);
        const sourceKind = code(segment?.sourceKind);
        let allocationState = PHYSICAL_ALLOCATION_STATES.UNCERTAIN;
        let allocationStateReasonCode = 'PHYSICAL_EVIDENCE_UNCERTAIN';

        if (stage.includes('SHIPPED') || sourceKind === 'SALES_SHIPMENT') {
            allocationState = PHYSICAL_ALLOCATION_STATES.SHIPPED;
            allocationStateReasonCode = 'PHYSICAL_QTY_SHIPPED';
        } else if (stage.includes('CONSUMED') || sourceKind === 'MCT_CONSUMPTION') {
            allocationState = PHYSICAL_ALLOCATION_STATES.CONSUMED;
            allocationStateReasonCode = 'PHYSICAL_QTY_CONSUMED';
        } else if (segment?.allocatableToOthers === false
            || sourceKind === 'MGS_SHIPMENT'
            || stage.startsWith('MONTAGE_')) {
            allocationState = PHYSICAL_ALLOCATION_STATES.LOCKED;
            allocationStateReasonCode = 'LIFECYCLE_TARGET_LOCKED';
        } else if (sourceKind === 'WORK_ORDER'
            && ['IN_PROCESS', 'TRANSFER_PENDING', 'DEPOT_PENDING'].includes(stage)
            && text(segment?.originWorkOrderId)
            && text(segment?.originWorkOrderLineId)
            && text(segment?.routeId)
            && Number.isFinite(Number(segment?.routeSeq))
            && asArray(segment?.evidenceIds).length > 0) {
            allocationState = PHYSICAL_ALLOCATION_STATES.REALLOCATABLE;
            allocationStateReasonCode = '';
        } else if (sourceKind === 'CURRENT_STOCK_ROW' && stage === 'DEPOT_STOCK') {
            const originSourceType = code(segment?.originSourceType);
            const stockClass = code(segment?.stockClass);
            const allocationType = code(segment?.allocationType);
            const explicitlyUnavailable = [
                'RESERVED', 'LOCKED', 'UNCERTAIN', 'CONSUMED', 'SHIPPED'
            ].includes(stockClass) || [
                'RESERVED', 'LOCKED', 'UNCERTAIN', 'CONSUMED', 'SHIPPED', 'FROM_SEMI'
            ].includes(allocationType);
            const canonicalSourceProof = (originSourceType === 'SALES_ORDER'
                && text(segment?.originOrderId)
                && text(segment?.originOrderLineId)
                && text(segment?.originDemandId)
                && text(segment?.originItemKey))
                || (originSourceType === 'STOCK'
                    && text(segment?.originDemandId)
                    && text(segment?.originItemKey));
            const originProofConflict = [
                'PRODUCTION_STORE_ORIGIN_AMBIGUOUS',
                'PRODUCTION_STORE_ORIGIN_CONFLICT',
                'PRODUCTION_STORE_WO_AMBIGUOUS',
                'PRODUCTION_STORE_WO_LINE_AMBIGUOUS'
            ].includes(text(segment?.productionOriginReasonCode));
            const auditedManualFree = code(segment?.allocationType) === 'FREE'
                && originSourceType === 'UNSCOPED'
                && text(segment?.stockRowId)
                && text(segment?.locationKey)
                && asArray(segment?.evidenceIds).includes(text(segment?.stockRowId));
            if (explicitlyUnavailable) {
                allocationStateReasonCode = 'STOCK_EXPLICITLY_UNAVAILABLE';
            } else if (segment?.mainDepot !== true) {
                allocationStateReasonCode = 'STOCK_OUTSIDE_MAIN_DEPOT';
            } else if (segment?.productionOriginVerified === true
                || auditedManualFree
                || (canonicalSourceProof && !originProofConflict)) {
                allocationState = PHYSICAL_ALLOCATION_STATES.REALLOCATABLE;
                allocationStateReasonCode = '';
            } else if (originSourceType === 'UNSCOPED') {
                allocationStateReasonCode = 'UNSCOPED_STOCK_EVIDENCE_MISSING';
            } else {
                allocationStateReasonCode = text(segment?.productionOriginReasonCode)
                    || 'STOCK_ORIGIN_EVIDENCE_MISSING';
            }
        }

        const reallocatable = allocationState === PHYSICAL_ALLOCATION_STATES.REALLOCATABLE
            && physicalQty > EPSILON;
        return {
            ...segment,
            allocationState,
            allocationStateReasonCode,
            reallocatable,
            reallocatableQty: reallocatable ? physicalQty : 0,
            ...(allocationState === PHYSICAL_ALLOCATION_STATES.UNCERTAIN
                ? { allocatable: false, allocatableQty: 0 }
                : {})
        };
    };

    const validateShipmentItems = (shipment) => {
        const items = asArray(shipment?.items);
        if (!items.length) return { ok: false, reasonCode: 'MGS_ITEM_SNAPSHOT_MISSING' };
        for (const item of items) {
            const sourceType = code(item?.sourceType);
            const demandId = text(item?.demandId);
            const itemKey = text(item?.itemKey);
            if (!isPositiveQty(item?.shippedQty) || !demandId || !itemKey) {
                return { ok: false, reasonCode: 'MGS_ITEM_SNAPSHOT_INVALID' };
            }
            if (sourceType === 'SALES_ORDER') {
                if (!text(item?.sourceOrderId) || !text(item?.sourceLineId)) {
                    return { ok: false, reasonCode: 'MGS_SALES_IDENTITY_MISSING' };
                }
            } else if (sourceType !== 'STOCK') {
                return { ok: false, reasonCode: 'MGS_SOURCE_TYPE_INVALID' };
            }
        }
        return { ok: true, reasonCode: '' };
    };

    const validateShipmentPart = ({ shipment, part, prcIndex, movementById, stockRows = [] }) => {
        const prc = resolveExactPrc(prcIndex, part?.code, part?.refId);
        if (!prc.ok) return { ok: false, reasonCode: prc.reasonCode, prc, qty: Number(part?.shippedQty || 0) };
        const partUnit = code(part?.unit);
        if (!partUnit || partUnit !== prc.unit) {
            return { ok: false, reasonCode: 'MGS_PART_UNIT_MISMATCH', prc, qty: Number(part?.shippedQty || 0) };
        }
        const shippedQty = Number(part?.shippedQty || 0);
        if (!isPositiveQty(shippedQty)) {
            return { ok: false, reasonCode: 'MGS_PART_QTY_INVALID', prc, qty: shippedQty };
        }
        const allocations = asArray(part?.allocations);
        if (!allocations.length) {
            return { ok: false, reasonCode: 'MGS_ALLOCATION_MISSING', prc, qty: shippedQty };
        }
        const deferredStockTransfer = code(shipment?.stockTransferMode) === MONTAGE_STOCK_TRANSFER_MODE;
        const shipmentStatus = code(shipment?.status);
        const stockRowsById = new Map();
        asArray(stockRows).forEach((row) => {
            const rowId = text(row?.id);
            if (!rowId) return;
            if (!stockRowsById.has(rowId)) stockRowsById.set(rowId, []);
            stockRowsById.get(rowId).push(row);
        });
        const allocationKeys = new Set();
        const reservationKeys = new Set();
        const exactHolds = [];
        let allocationQty = 0;
        for (const allocation of allocations) {
            const qty = Number(allocation?.qty || 0);
            const movementId = text(allocation?.stockMovementId);
            if (!isPositiveQty(qty)) {
                return { ok: false, reasonCode: 'MGS_ALLOCATION_INVALID', prc, qty: shippedQty };
            }
            if (deferredStockTransfer) {
                const allocationKey = text(allocation?.idempotencyKey);
                const movementKey = text(allocation?.movementIdempotencyKey);
                const stockRowId = text(allocation?.stockRowId || allocation?.stockDepotItemId);
                const physicalSegmentId = text(allocation?.physicalSegmentId);
                const sourceBucket = code(allocation?.sourceBucket);
                const rowMatches = asArray(stockRowsById.get(stockRowId));
                const row = rowMatches.length === 1 ? rowMatches[0] : null;
                const rowQty = row ? getQtyAliasResult(row) : { ok: false, qty: 0 };
                const rowScopeId = text(row?.depotId || row?.nodeId)
                    || (text(row?.nodeKey || row?.depotKey || row?.key).startsWith('managed:')
                        ? text(row?.nodeKey || row?.depotKey || row?.key).slice('managed:'.length)
                        : text(row?.nodeKey || row?.depotKey || row?.key))
                    || (text(row?.unitId || row?.stationId) ? `unit:${text(row?.unitId || row?.stationId)}` : '');
                if (!allocationKey
                    || !movementKey
                    || allocationKeys.has(allocationKey)
                    || !stockRowId
                    || physicalSegmentId !== `STOCK|${stockRowId}`
                    || ![SOURCE_BUCKETS.STOCK, SOURCE_BUCKETS.PRODUCTION].includes(sourceBucket)
                    || text(allocation?.prcId) !== prc.prcId
                    || code(allocation?.prcCode) !== prc.prcCode
                    || code(allocation?.unit) !== prc.unit
                    || !row
                    || !rowQty.ok
                    || ((shipmentStatus === 'IN_TRANSIT' || shipmentStatus === 'DISPATCHED')
                        && rowQty.qty < qty - EPSILON)
                    || code(row?.productCode || row?.code) !== prc.prcCode
                    || code(row?.unit) !== prc.unit
                    || (text(row?.refId || row?.productId) && text(row?.refId || row?.productId) !== prc.prcId)
                    || rowScopeId !== text(allocation?.sourceDepotId)
                    || text(row?.locationId) !== text(allocation?.sourceLocationId)) {
                    return { ok: false, reasonCode: 'MGS_DEFERRED_ALLOCATION_CONFLICT', prc, qty: shippedQty };
                }
                allocationKeys.add(allocationKey);
                const ranges = asArray(allocation?.segmentRanges);
                if (!ranges.length) {
                    return { ok: false, reasonCode: 'MGS_DEFERRED_RANGE_MISSING', prc, qty: shippedQty };
                }
                let rangeQty = 0;
                for (const range of ranges) {
                    const reservationKey = text(range?.reservationKey);
                    const start = Number(range?.segmentOffsetStart);
                    const end = Number(range?.segmentOffsetEnd);
                    const rangeAmount = Number(range?.qty || 0);
                    const sourceType = code(range?.sourceType);
                    if (!reservationKey
                        || reservationKeys.has(reservationKey)
                        || text(range?.planId) !== text(shipment?.planId)
                        || !['SALES_ORDER', 'STOCK'].includes(sourceType)
                        || (sourceType === 'SALES_ORDER'
                            && (!text(range?.sourceOrderId) || !text(range?.sourceLineId)))
                        || !text(range?.demandId)
                        || !text(range?.itemKey)
                        || text(range?.stockRowId) !== stockRowId
                        || text(range?.physicalSegmentId) !== physicalSegmentId
                        || text(range?.prcId) !== prc.prcId
                        || code(range?.prcCode) !== prc.prcCode
                        || code(range?.unit) !== prc.unit
                        || code(range?.sourceBucket) !== sourceBucket
                        || !Number.isFinite(start)
                        || !Number.isFinite(end)
                        || !isPositiveQty(rangeAmount)
                        || start < 0
                        || end <= start
                        || !sameQty(end - start, rangeAmount)) {
                        return { ok: false, reasonCode: 'MGS_DEFERRED_RANGE_CONFLICT', prc, qty: shippedQty };
                    }
                    reservationKeys.add(reservationKey);
                    rangeQty = roundQty(rangeQty + rangeAmount);
                    exactHolds.push({
                        holdKey: `MGS_HOLD|${text(shipment?.id)}|${reservationKey}`,
                        shipmentId: text(shipment?.id),
                        planId: text(shipment?.planId),
                        reservationKey,
                        physicalSegmentId,
                        stockRowId,
                        sourceBucket,
                        sourceType,
                        sourceOrderId: text(range?.sourceOrderId),
                        sourceLineId: text(range?.sourceLineId),
                        demandId: text(range?.demandId),
                        itemKey: text(range?.itemKey),
                        prcId: prc.prcId,
                        prcCode: prc.prcCode,
                        unit: prc.unit,
                        segmentOffsetStart: roundQty(start),
                        segmentOffsetEnd: roundQty(end),
                        qty: roundQty(rangeAmount)
                    });
                }
                if (!sameQty(rangeQty, qty)) {
                    return { ok: false, reasonCode: 'MGS_DEFERRED_RANGE_QTY_CONFLICT', prc, qty: shippedQty };
                }
                if (shipmentStatus === 'IN_TRANSIT' || shipmentStatus === 'DISPATCHED') {
                    if (movementId) {
                        return { ok: false, reasonCode: 'MGS_DEFERRED_EARLY_MOVEMENT', prc, qty: shippedQty };
                    }
                    allocationQty += qty;
                    continue;
                }
                if (!movementId) {
                    return { ok: false, reasonCode: 'MGS_DEFERRED_RECEIPT_MOVEMENT_MISSING', prc, qty: shippedQty };
                }
            } else if (!movementId) {
                return { ok: false, reasonCode: 'MGS_ALLOCATION_INVALID', prc, qty: shippedQty };
            }
            const movements = asArray(movementById.get(movementId));
            if (movements.length !== 1) {
                return {
                    ok: false,
                    reasonCode: movements.length > 1 ? 'MGS_MOVEMENT_DUPLICATE' : 'MGS_MOVEMENT_MISSING',
                    prc,
                    qty: shippedQty
                };
            }
            const movement = movements[0];
            const movementType = code(movement?.movementType || movement?.type);
            const movementQty = Number(movement?.qty ?? movement?.quantity ?? 0);
            if (movementType !== 'MONTAGE_DISPATCH_OUT'
                || text(movement?.shipmentId) !== text(shipment?.id)
                || code(movement?.productCode || movement?.code) !== prc.prcCode
                || code(movement?.unit) !== prc.unit
                || !sameQty(movementQty, qty)) {
                return { ok: false, reasonCode: 'MGS_MOVEMENT_CONFLICT', prc, qty: shippedQty };
            }
            allocationQty += qty;
        }
        if (!sameQty(allocationQty, shippedQty)) {
            return { ok: false, reasonCode: 'MGS_ALLOCATION_QTY_CONFLICT', prc, qty: shippedQty };
        }
        return {
            ok: true,
            reasonCode: '',
            prc,
            qty: roundQty(shippedQty),
            evidenceIds: deferredStockTransfer && (shipmentStatus === 'IN_TRANSIT' || shipmentStatus === 'DISPATCHED')
                ? exactHolds.map((hold) => hold.reservationKey)
                : allocations.map((allocation) => text(allocation?.stockMovementId)).filter(Boolean),
            exactHolds: deferredStockTransfer ? exactHolds : []
        };
    };

    const createMontageTransitSegment = ({ shipment, part, partIndex, validation }) => ({
        segmentKey: `MGS|${text(shipment?.id)}|${partIndex}|${validation.prc.prcCode}`,
        itemType: 'PRC',
        prcId: validation.prc.prcId,
        prcCode: validation.prc.prcCode,
        unit: validation.prc.unit,
        stage: 'MONTAGE_IN_TRANSIT',
        qty: validation.qty,
        physicalQty: validation.qty,
        allocatable: true,
        allocatableQty: validation.qty,
        sourceKind: 'MGS_SHIPMENT',
        shipmentId: text(shipment?.id),
        shipmentNo: text(shipment?.shipmentNo),
        originWorkOrderId: '',
        originWorkOrderLineId: '',
        originDemandId: '',
        evidenceIds: [text(shipment?.id), ...validation.evidenceIds].filter(Boolean).sort(compareText)
    });

    const getLifecycleTarget = (item, prc) => {
        const sourceType = code(item?.sourceType);
        const sourceOrderId = text(item?.sourceOrderId);
        const sourceLineId = text(item?.sourceLineId);
        const demandId = text(item?.demandId);
        const itemKey = text(item?.itemKey);
        if (!demandId || !itemKey) {
            return { ok: false, reasonCode: 'LIFECYCLE_DEMAND_ITEM_IDENTITY_MISSING' };
        }
        if (sourceType === 'SALES_ORDER') {
            if (!sourceOrderId || !sourceLineId) {
                return { ok: false, reasonCode: 'LIFECYCLE_SALES_IDENTITY_MISSING' };
            }
        } else if (sourceType !== 'STOCK') {
            return { ok: false, reasonCode: 'LIFECYCLE_SOURCE_TYPE_INVALID' };
        }
        const prcCode = code(prc?.prcCode);
        const unit = code(prc?.unit);
        if (!prcCode || !unit) return { ok: false, reasonCode: 'LIFECYCLE_PRC_IDENTITY_MISSING' };
        return {
            ok: true,
            reasonCode: '',
            sourceType,
            sourceOrderId,
            sourceLineId,
            demandId,
            itemKey,
            targetDebtKey: [
                'LIFECYCLE_DEBT',
                sourceType,
                sourceOrderId,
                sourceLineId,
                demandId,
                itemKey,
                prcCode,
                unit
            ].join('|')
        };
    };

    const normalizeLifecycleRecipe = (rawParts, prcIndex) => {
        const parts = [];
        const seen = new Set();
        for (const raw of asArray(rawParts)) {
            const prc = resolveExactPrc(prcIndex, raw?.code, raw?.refId);
            if (!prc.ok) return { ok: false, reasonCode: prc.reasonCode, parts: [] };
            const unit = code(raw?.unit);
            const qtyPerSet = Number(raw?.qtyPerSet);
            if (!unit || unit !== prc.unit) {
                return { ok: false, reasonCode: 'LIFECYCLE_RECIPE_UNIT_MISMATCH', parts: [] };
            }
            if (!isPositiveQty(qtyPerSet)) {
                return { ok: false, reasonCode: 'LIFECYCLE_RECIPE_QTY_INVALID', parts: [] };
            }
            const key = `${prc.prcId}|${prc.prcCode}|${prc.unit}`;
            if (seen.has(key)) {
                return { ok: false, reasonCode: 'LIFECYCLE_RECIPE_PART_DUPLICATE', parts: [] };
            }
            seen.add(key);
            parts.push({
                key,
                prcId: prc.prcId,
                prcCode: prc.prcCode,
                unit: prc.unit,
                qtyPerSet: roundQty(qtyPerSet)
            });
        }
        if (!parts.length) return { ok: false, reasonCode: 'LIFECYCLE_RECIPE_MISSING', parts: [] };
        return {
            ok: true,
            reasonCode: '',
            parts: stableSort(parts, (part) => part.key)
        };
    };

    const normalizeLifecycleItem = ({ item, qtyField, prcIndex }) => {
        const productId = text(item?.productId);
        const variantId = text(item?.variantId || item?.variationId);
        const variantCode = code(item?.variantCode);
        const montageCardId = text(item?.montageCardId);
        const montageCardCode = code(item?.montageCardCode);
        const setQty = Number(item?.[qtyField]);
        if (!productId || !variantId || !variantCode || !montageCardId || !montageCardCode) {
            return { ok: false, reasonCode: 'LIFECYCLE_PRODUCT_SNAPSHOT_MISSING' };
        }
        if (!isPositiveQty(setQty)) return { ok: false, reasonCode: 'LIFECYCLE_ITEM_QTY_INVALID' };
        const recipe = normalizeLifecycleRecipe(item?.recipeParts, prcIndex);
        if (!recipe.ok) return recipe;
        const firstTarget = getLifecycleTarget(item, recipe.parts[0]);
        if (!firstTarget.ok) return firstTarget;
        return {
            ok: true,
            reasonCode: '',
            item: {
                sourceType: firstTarget.sourceType,
                sourceOrderId: firstTarget.sourceOrderId,
                sourceLineId: firstTarget.sourceLineId,
                demandId: firstTarget.demandId,
                itemKey: firstTarget.itemKey,
                originWorkOrderId: text(item?.originWorkOrderId || item?.workOrderId),
                productId,
                variantId,
                variantCode,
                montageCardId,
                montageCardCode,
                setQty: roundQty(setQty),
                recipeParts: recipe.parts
            }
        };
    };

    const validateLifecycleItemAgainstCurrent = ({ item, orders, demands }) => {
        const demandMatches = asArray(demands).filter((row) => text(row?.id) === item.demandId);
        if (demandMatches.length !== 1) {
            return {
                ok: false,
                reasonCode: demandMatches.length > 1
                    ? 'LIFECYCLE_DEMAND_DUPLICATE'
                    : 'LIFECYCLE_DEMAND_NOT_FOUND'
            };
        }
        const demand = demandMatches[0];
        if (code(demand?.sourceType) !== item.sourceType
            || text(demand?.sourceOrderId) !== item.sourceOrderId
            || text(demand?.sourceLineId) !== item.sourceLineId) {
            return { ok: false, reasonCode: 'LIFECYCLE_DEMAND_SOURCE_CONFLICT' };
        }
        const demandItemMatches = asArray(demand?.items).filter((row) => text(row?.id) === item.itemKey);
        if (demandItemMatches.length !== 1) {
            return {
                ok: false,
                reasonCode: demandItemMatches.length > 1
                    ? 'LIFECYCLE_DEMAND_ITEM_DUPLICATE'
                    : 'LIFECYCLE_DEMAND_ITEM_NOT_FOUND'
            };
        }
        const demandItem = demandItemMatches[0];
        if (code(demandItem?.variantCode || demandItem?.productCode) !== item.variantCode) {
            return { ok: false, reasonCode: 'LIFECYCLE_DEMAND_ITEM_VARIANT_CONFLICT' };
        }
        if (item.sourceType === 'STOCK') return { ok: true, reasonCode: '' };

        const orderMatches = asArray(orders).filter((row) => text(row?.id) === item.sourceOrderId);
        if (orderMatches.length !== 1) {
            return {
                ok: false,
                reasonCode: orderMatches.length > 1
                    ? 'LIFECYCLE_SOR_DUPLICATE'
                    : 'LIFECYCLE_SOR_NOT_FOUND'
            };
        }
        const orderLineMatches = asArray(orderMatches[0]?.lines)
            .filter((row) => text(row?.id) === item.sourceLineId);
        if (orderLineMatches.length !== 1) {
            return {
                ok: false,
                reasonCode: orderLineMatches.length > 1
                    ? 'LIFECYCLE_SOR_LINE_DUPLICATE'
                    : 'LIFECYCLE_SOR_LINE_NOT_FOUND'
            };
        }
        const orderLine = orderLineMatches[0];
        if (text(orderLine?.productId) !== item.productId
            || code(orderLine?.variantCode || orderLine?.productCode) !== item.variantCode) {
            return { ok: false, reasonCode: 'LIFECYCLE_SOR_LINE_PRODUCT_CONFLICT' };
        }
        return { ok: true, reasonCode: '' };
    };

    const getLifecycleItemIdentity = (item) => [
        item.sourceType,
        item.sourceOrderId,
        item.sourceLineId,
        item.demandId,
        item.itemKey,
        item.productId,
        item.variantId,
        item.variantCode,
        item.montageCardId,
        item.montageCardCode
    ].join('|');

    const getLifecycleRecipeSignature = (parts) => stableSort(parts, (part) => part.key)
        .map((part) => `${part.key}|${part.qtyPerSet}`)
        .join('||');

    const buildLifecycleExpectedParts = (items) => {
        const totals = new Map();
        asArray(items).forEach((item) => {
            item.recipeParts.forEach((part) => {
                if (!totals.has(part.key)) {
                    totals.set(part.key, {
                        key: part.key,
                        prcId: part.prcId,
                        prcCode: part.prcCode,
                        unit: part.unit,
                        qty: 0
                    });
                }
                const total = totals.get(part.key);
                total.qty = roundQty(total.qty + (part.qtyPerSet * item.setQty));
            });
        });
        return totals;
    };

    const normalizeLifecycleAggregateParts = ({ parts, qtyField, prcIndex }) => {
        const totals = new Map();
        for (const raw of asArray(parts)) {
            const prc = resolveExactPrc(prcIndex, raw?.code, raw?.refId);
            if (!prc.ok) return { ok: false, reasonCode: prc.reasonCode, totals: new Map() };
            const unit = code(raw?.unit);
            const qty = Number(raw?.[qtyField]);
            if (!unit || unit !== prc.unit) {
                return { ok: false, reasonCode: 'LIFECYCLE_PART_UNIT_MISMATCH', totals: new Map() };
            }
            if (!isPositiveQty(qty)) {
                return { ok: false, reasonCode: 'LIFECYCLE_PART_QTY_INVALID', totals: new Map() };
            }
            const key = `${prc.prcId}|${prc.prcCode}|${prc.unit}`;
            if (totals.has(key)) {
                return { ok: false, reasonCode: 'LIFECYCLE_AGGREGATE_PART_DUPLICATE', totals: new Map() };
            }
            totals.set(key, {
                key,
                raw,
                prcId: prc.prcId,
                prcCode: prc.prcCode,
                unit: prc.unit,
                qty: roundQty(qty)
            });
        }
        if (!totals.size) {
            return { ok: false, reasonCode: 'LIFECYCLE_AGGREGATE_PART_MISSING', totals };
        }
        return { ok: true, reasonCode: '', totals };
    };

    const compareLifecyclePartTotals = (expected, actual) => {
        const keys = new Set([...expected.keys(), ...actual.keys()]);
        for (const key of keys) {
            if (!expected.has(key) || !actual.has(key)
                || !sameQty(expected.get(key)?.qty, actual.get(key)?.qty)) {
                return { ok: false, reasonCode: 'LIFECYCLE_RECIPE_AGGREGATE_CONFLICT', key };
            }
        }
        return { ok: true, reasonCode: '', key: '' };
    };

    const normalizeLifecyclePlan = ({ plan, prcIndex, orders, demands }) => {
        const planId = text(plan?.id);
        if (!planId) return { ok: false, reasonCode: 'MGP_ID_MISSING' };
        const items = [];
        for (const rawItem of asArray(plan?.items)) {
            const normalized = normalizeLifecycleItem({ item: rawItem, qtyField: 'plannedQty', prcIndex });
            if (!normalized.ok) return { ok: false, reasonCode: `MGP_${normalized.reasonCode}` };
            const current = validateLifecycleItemAgainstCurrent({
                item: normalized.item,
                orders,
                demands
            });
            if (!current.ok) return { ok: false, reasonCode: `MGP_${current.reasonCode}` };
            items.push(normalized.item);
        }
        if (!items.length) return { ok: false, reasonCode: 'MGP_ITEM_SNAPSHOT_MISSING' };
        const parts = normalizeLifecycleAggregateParts({
            parts: plan?.parts,
            qtyField: 'requiredQty',
            prcIndex
        });
        if (!parts.ok) return { ok: false, reasonCode: `MGP_${parts.reasonCode}` };
        const aggregate = compareLifecyclePartTotals(buildLifecycleExpectedParts(items), parts.totals);
        if (!aggregate.ok) return { ok: false, reasonCode: `MGP_${aggregate.reasonCode}` };
        return { ok: true, reasonCode: '', planId, items, parts: parts.totals };
    };

    const sameLifecycleItem = (left, right) => getLifecycleItemIdentity(left) === getLifecycleItemIdentity(right)
        && sameQty(left?.setQty, right?.setQty)
        && getLifecycleRecipeSignature(left?.recipeParts) === getLifecycleRecipeSignature(right?.recipeParts);

    const getLifecycleStockQty = (row) => {
        const result = getQtyAliasResult(row);
        if (!result.ok || result.qty < -EPSILON) {
            return { ok: false, reasonCode: `LIFECYCLE_STOCK_${result.reasonCode || 'QTY_NEGATIVE'}`, qty: 0 };
        }
        return { ok: true, reasonCode: '', qty: roundQty(Math.max(0, result.qty)) };
    };

    const createLifecyclePrcSegment = ({
        stage,
        sourceKind,
        shipment,
        plan,
        item,
        itemIndex,
        part,
        qty,
        evidenceIds,
        stockSlices = []
    }) => {
        const target = getLifecycleTarget(item, part);
        return {
            segmentKey: `LIFECYCLE|${text(shipment?.id)}|${itemIndex}|${part.prcId}|${stage}`,
            representationKey: `MONTAGE|${text(shipment?.id)}|${itemIndex}|${part.prcId}`,
            lifecycleKey: `MONTAGE|${text(shipment?.id)}|${itemIndex}`,
            itemType: 'PRC',
            itemCode: part.prcCode,
            prcId: part.prcId,
            prcCode: part.prcCode,
            unit: part.unit,
            stage,
            qty: roundQty(qty),
            physicalQty: roundQty(qty),
            allocatable: true,
            allocatableQty: roundQty(qty),
            allocatableToOthers: false,
            targetDebtKey: target.targetDebtKey,
            sourceKind,
            shipmentId: text(shipment?.id),
            shipmentNo: text(shipment?.shipmentNo),
            planId: text(plan?.id),
            sourceType: item.sourceType,
            sourceOrderId: item.sourceOrderId,
            sourceLineId: item.sourceLineId,
            demandId: item.demandId,
            itemKey: item.itemKey,
            originWorkOrderId: item.originWorkOrderId,
            originDemandId: item.demandId,
            originOrderId: item.sourceOrderId,
            originOrderLineId: item.sourceLineId,
            productId: item.productId,
            variantId: item.variantId,
            variantCode: item.variantCode,
            stockSlices: asArray(stockSlices),
            evidenceIds: Array.from(new Set(asArray(evidenceIds).map(text).filter(Boolean))).sort(compareText)
        };
    };

    const createLifecycleSvrSegment = ({
        stage,
        sourceKind,
        shipment,
        plan,
        item,
        itemIndex,
        transfer,
        qty,
        stockRow,
        evidenceIds,
        supersedesSegmentKeys = []
    }) => ({
        segmentKey: `LIFECYCLE|${text(transfer?.id)}|SVR|${stage}`,
        representationKey: `MONTAGE|${text(shipment?.id)}|${itemIndex}|SVR|${text(transfer?.id)}`,
        lifecycleKey: `MONTAGE|${text(shipment?.id)}|${itemIndex}`,
        itemType: 'SVR',
        itemCode: item.variantCode,
        prcId: '',
        prcCode: '',
        productId: item.productId,
        variantId: item.variantId,
        variantCode: item.variantCode,
        unit: code(transfer?.unit || stockRow?.unit || 'ADET') || 'ADET',
        stage,
        qty: roundQty(qty),
        physicalQty: roundQty(qty),
        allocatable: true,
        allocatableQty: roundQty(qty),
        allocatableToOthers: false,
        targetDebtKey: [
            'LIFECYCLE_SET_DEBT',
            item.sourceType,
            item.sourceOrderId,
            item.sourceLineId,
            item.demandId,
            item.itemKey,
            item.variantCode,
            code(transfer?.unit || stockRow?.unit || 'ADET') || 'ADET'
        ].join('|'),
        sourceKind,
        shipmentId: text(shipment?.id),
        shipmentNo: text(shipment?.shipmentNo),
        planId: text(plan?.id),
        transferId: text(transfer?.id),
        stockRowId: text(stockRow?.id),
        sourceType: item.sourceType,
        sourceOrderId: item.sourceOrderId,
        sourceLineId: item.sourceLineId,
        demandId: item.demandId,
        itemKey: item.itemKey,
        originWorkOrderId: item.originWorkOrderId,
        originDemandId: item.demandId,
        originOrderId: item.sourceOrderId,
        originOrderLineId: item.sourceLineId,
        supersedesSegmentKeys: asArray(supersedesSegmentKeys).map(text).filter(Boolean).sort(compareText),
        evidenceIds: Array.from(new Set(asArray(evidenceIds).map(text).filter(Boolean))).sort(compareText)
    });

    const validatePostedTransferEvidence = ({ transfer, item, stockRows, movementById }) => {
        const transferId = text(transfer?.id);
        const stockItemId = text(transfer?.finishedProductStockItemId);
        const movementId = text(transfer?.finishedProductMovementId);
        const stockMatches = stockRows.filter((row) => text(row?.id) === stockItemId);
        const movementMatches = asArray(movementById.get(movementId));
        if (!stockItemId || stockMatches.length !== 1) {
            return {
                ok: false,
                reasonCode: stockMatches.length > 1
                    ? 'MCT_FINISHED_STOCK_DUPLICATE'
                    : 'MCT_FINISHED_STOCK_MISSING'
            };
        }
        if (!movementId || movementMatches.length !== 1) {
            return {
                ok: false,
                reasonCode: movementMatches.length > 1
                    ? 'MCT_FINISHED_MOVEMENT_DUPLICATE'
                    : 'MCT_FINISHED_MOVEMENT_MISSING'
            };
        }
        const stockRow = stockMatches[0];
        const stockQty = getLifecycleStockQty(stockRow);
        const movement = movementMatches[0];
        const transferQty = Number(transfer?.qty ?? transfer?.quantity);
        const movementQty = Number(movement?.qty ?? movement?.quantity);
        if (!stockQty.ok
            || text(stockRow?.completionTransferId || stockRow?.transferId) !== transferId
            || text(stockRow?.productId) !== item.productId
            || text(stockRow?.variantId || stockRow?.variationId) !== item.variantId
            || code(stockRow?.variantCode || stockRow?.productCode || stockRow?.code) !== item.variantCode
            || code(stockRow?.cardType) !== 'SVR'
            || text(movement?.completionTransferId || movement?.transferId) !== transferId
            || text(movement?.stockDepotItemId) !== stockItemId
            || code(movement?.movementType || movement?.type) !== 'MONTAGE_FINISHED_PRODUCT_IN'
            || code(movement?.variantCode || movement?.productCode) !== item.variantCode
            || !sameQty(movementQty, transferQty)) {
            return { ok: false, reasonCode: stockQty.reasonCode || 'MCT_FINISHED_EVIDENCE_CONFLICT' };
        }

        const allocationTotals = new Map();
        for (const allocation of asArray(transfer?.componentAllocations)) {
            const prc = item.recipeParts.find((part) =>
                part.prcId === text(allocation?.refId)
                && part.prcCode === code(allocation?.code)
                && part.unit === code(allocation?.unit)
            );
            const allocationQty = Number(allocation?.qty);
            const componentMovementId = text(allocation?.stockMovementId);
            const componentMovements = asArray(movementById.get(componentMovementId));
            if (!prc || !isPositiveQty(allocationQty) || componentMovements.length !== 1) {
                return { ok: false, reasonCode: 'MCT_COMPONENT_ALLOCATION_INVALID' };
            }
            const componentMovement = componentMovements[0];
            if (code(componentMovement?.movementType || componentMovement?.type) !== 'MONTAGE_COMPONENT_CONSUMPTION'
                || text(componentMovement?.completionTransferId || componentMovement?.transferId) !== transferId
                || text(componentMovement?.stockDepotItemId) !== text(allocation?.stockDepotItemId)
                || code(componentMovement?.productCode || componentMovement?.code) !== prc.prcCode
                || code(componentMovement?.unit) !== prc.unit
                || !sameQty(componentMovement?.qty ?? componentMovement?.quantity, allocationQty)) {
                return { ok: false, reasonCode: 'MCT_COMPONENT_MOVEMENT_CONFLICT' };
            }
            allocationTotals.set(prc.key, roundQty((allocationTotals.get(prc.key) || 0) + allocationQty));
        }
        for (const part of item.recipeParts) {
            const expectedQty = roundQty(part.qtyPerSet * transferQty);
            if (!sameQty(allocationTotals.get(part.key) || 0, expectedQty)) {
                return { ok: false, reasonCode: 'MCT_COMPONENT_QTY_CONFLICT' };
            }
        }
        return {
            ok: true,
            reasonCode: '',
            stockRow,
            stockQty: stockQty.qty,
            movement,
            evidenceIds: [
                stockItemId,
                movementId,
                ...asArray(transfer?.componentAllocations).map((row) => text(row?.stockMovementId))
            ]
        };
    };

    const resolveMontageLifecycle = ({
        plans,
        shipments,
        transfers,
        stockRows,
        movements,
        prcIndex,
        orders,
        demands
    }) => {
        const segments = [];
        const reservations = [];
        const evidence = [];
        const uncertain = [];
        const exactHolds = [];
        const handledStockRowIds = new Set();
        const handledShipmentIds = new Set();
        const handledTransferIds = new Set();
        const deferredCandidateRowsByShipment = new Map();
        const validDeferredShipmentIds = new Set();

        const movementById = new Map();
        asArray(movements).forEach((movement) => {
            const id = text(movement?.id);
            if (!id) return;
            if (!movementById.has(id)) movementById.set(id, []);
            movementById.get(id).push(movement);
        });
        const planById = new Map();
        const planIdCounts = new Map();
        asArray(plans).forEach((plan) => {
            const id = text(plan?.id);
            if (!id) return;
            if (!planById.has(id)) planById.set(id, []);
            planById.get(id).push(plan);
            planIdCounts.set(id, (planIdCounts.get(id) || 0) + 1);
        });
        const shipmentIdCounts = new Map();
        asArray(shipments).forEach((shipment) => {
            const id = text(shipment?.id);
            if (id) shipmentIdCounts.set(id, (shipmentIdCounts.get(id) || 0) + 1);
        });
        const transferIdCounts = new Map();
        asArray(transfers).forEach((transfer) => {
            const id = text(transfer?.id);
            if (id) transferIdCounts.set(id, (transferIdCounts.get(id) || 0) + 1);
        });
        const normalizedPlanById = new Map();
        const getNormalizedPlan = (plan) => {
            const id = text(plan?.id);
            if (!normalizedPlanById.has(id)) {
                normalizedPlanById.set(id, normalizeLifecyclePlan({
                    plan,
                    prcIndex,
                    orders,
                    demands
                }));
            }
            return normalizedPlanById.get(id);
        };
        const pushUncertain = ({
            kind,
            id,
            reasonCode,
            source = null,
            prcCode = '',
            unit = '',
            reportedQty = null,
            candidates = [],
            evidenceIds = []
        }) => {
            const target = source
                ? getLifecycleTarget(source, { prcCode, unit })
                : { targetDebtKey: '' };
            uncertain.push(createUncertain({
                kind,
                id,
                reasonCode,
                prcCode,
                unit,
                reportedQty,
                candidates,
                evidenceIds,
                targetDebtKey: target.targetDebtKey,
                sourceOrderId: source?.sourceOrderId,
                sourceLineId: source?.sourceLineId,
                demandId: source?.demandId,
                itemKey: source?.itemKey
            }));
        };

        stableSort(plans, (plan, index) => `${text(plan?.id)}|${text(plan?.planNo)}|${index}`)
            .forEach((plan) => {
                if (code(plan?.status) !== 'DRAFT') return;
                const planId = text(plan?.id);
                if (!planId || planIdCounts.get(planId) !== 1) {
                    pushUncertain({
                        kind: 'MGP_DRAFT',
                        id: planId,
                        reasonCode: !planId ? 'MGP_ID_MISSING' : 'MGP_ID_DUPLICATE',
                        evidenceIds: [planId]
                    });
                    return;
                }
                const normalized = getNormalizedPlan(plan);
                if (!normalized.ok) {
                    pushUncertain({
                        kind: 'MGP_DRAFT',
                        id: planId,
                        reasonCode: normalized.reasonCode,
                        evidenceIds: [planId]
                    });
                    return;
                }
                normalized.items.forEach((item, itemIndex) => {
                    item.recipeParts.forEach((part) => {
                        const target = getLifecycleTarget(item, part);
                        const qty = roundQty(item.setQty * part.qtyPerSet);
                        reservations.push({
                            reservationKey: `MGP|${planId}|${itemIndex}|${part.prcId}`,
                            representationKey: `MGP_DRAFT|${planId}|${itemIndex}|${part.prcId}`,
                            lifecycleKey: `MONTAGE_PLAN|${planId}|${itemIndex}`,
                            kind: 'MGP_DRAFT_RESERVATION',
                            planId,
                            planNo: text(plan?.planNo),
                            itemIndex,
                            itemType: 'PRC',
                            prcId: part.prcId,
                            prcCode: part.prcCode,
                            unit: part.unit,
                            qty,
                            reservedQty: qty,
                            physicalQty: 0,
                            allocatable: false,
                            allocatableQty: 0,
                            allocatableToOthers: false,
                            targetDebtKey: target.targetDebtKey,
                            sourceType: item.sourceType,
                            sourceOrderId: item.sourceOrderId,
                            sourceLineId: item.sourceLineId,
                            demandId: item.demandId,
                            itemKey: item.itemKey,
                            originWorkOrderId: item.originWorkOrderId,
                            productId: item.productId,
                            variantId: item.variantId,
                            variantCode: item.variantCode,
                            evidenceIds: [planId]
                        });
                    });
                });
            });

        const activeTransfers = asArray(transfers).filter((transfer) =>
            !transfer?.reversedAt
            && ['PENDING_DEPOT_RECEIPT', 'POSTED'].includes(code(transfer?.status))
        );
        stableSort(shipments, (shipment, index) => `${text(shipment?.id)}|${text(shipment?.shipmentNo)}|${index}`)
            .forEach((shipment) => {
                const status = code(shipment?.status);
                if (!['IN_TRANSIT', 'DISPATCHED', 'RECEIVED'].includes(status)) return;
                const shipmentId = text(shipment?.id);
                const deferredStockTransfer = code(shipment?.stockTransferMode) === MONTAGE_STOCK_TRANSFER_MODE;
                if (deferredStockTransfer && (status === 'IN_TRANSIT' || status === 'DISPATCHED')) {
                    deferredCandidateRowsByShipment.set(
                        shipmentId,
                        new Set(asArray(shipment?.parts)
                            .flatMap((part) => asArray(part?.allocations))
                            .map((allocation) => text(allocation?.stockRowId || allocation?.stockDepotItemId))
                            .filter(Boolean))
                    );
                }
                if (shipmentId) handledShipmentIds.add(shipmentId);
                const linkedActiveTransfers = activeTransfers.filter((transfer) =>
                    text(transfer?.sourceShipmentId) === shipmentId
                );
                linkedActiveTransfers.forEach((transfer) => {
                    const id = text(transfer?.id);
                    if (id) handledTransferIds.add(id);
                });
                const linkedReceiptRows = stockRows.filter((row) =>
                    text(row?.sourceShipmentId || row?.shipmentId) === shipmentId
                    && code(row?.stockClass) === 'MONTAGE_RECEIVED'
                );
                linkedReceiptRows.forEach((row) => {
                    const id = text(row?.id);
                    if (id) handledStockRowIds.add(id);
                });
                const linkedFinishedRows = stockRows.filter((row) =>
                    text(row?.sourceShipmentId) === shipmentId
                    && code(row?.cardType) === 'SVR'
                );
                linkedFinishedRows.forEach((row) => {
                    const id = text(row?.id);
                    if (id) handledStockRowIds.add(id);
                });

                const planId = text(shipment?.planId);
                const planMatches = asArray(planById.get(planId));
                if (!shipmentId || shipmentIdCounts.get(shipmentId) !== 1) {
                    pushUncertain({
                        kind: 'MGS_SHIPMENT',
                        id: shipmentId,
                        reasonCode: !shipmentId ? 'MGS_ID_MISSING' : 'MGS_ID_DUPLICATE',
                        evidenceIds: [shipmentId, planId]
                    });
                    return;
                }
                if (!planId || planMatches.length !== 1) {
                    pushUncertain({
                        kind: 'MGS_SHIPMENT',
                        id: shipmentId,
                        reasonCode: planMatches.length > 1 ? 'MGS_MGP_DUPLICATE' : 'MGS_MGP_MISSING',
                        candidates: planMatches.map((row) => row?.id),
                        evidenceIds: [shipmentId, planId]
                    });
                    return;
                }
                const plan = planMatches[0];
                if (code(plan?.status) !== 'DISPATCHED_TO_MONTAGE') {
                    pushUncertain({
                        kind: 'MGS_SHIPMENT',
                        id: shipmentId,
                        reasonCode: 'MGS_MGP_STATUS_CONFLICT',
                        evidenceIds: [shipmentId, planId]
                    });
                    return;
                }
                const normalizedPlan = getNormalizedPlan(plan);
                if (!normalizedPlan.ok) {
                    pushUncertain({
                        kind: 'MGS_SHIPMENT',
                        id: shipmentId,
                        reasonCode: normalizedPlan.reasonCode,
                        evidenceIds: [shipmentId, planId]
                    });
                    return;
                }

                const normalizedItems = [];
                for (const rawItem of asArray(shipment?.items)) {
                    const normalized = normalizeLifecycleItem({
                        item: rawItem,
                        qtyField: 'shippedQty',
                        prcIndex
                    });
                    if (!normalized.ok) {
                        pushUncertain({
                            kind: 'MGS_SHIPMENT',
                            id: shipmentId,
                            reasonCode: `MGS_${normalized.reasonCode}`,
                            evidenceIds: [shipmentId, planId]
                        });
                        return;
                    }
                    normalizedItems.push(normalized.item);
                }
                if (!normalizedItems.length || normalizedItems.length !== normalizedPlan.items.length
                    || normalizedItems.some((item, index) => !sameLifecycleItem(item, normalizedPlan.items[index]))) {
                    pushUncertain({
                        kind: 'MGS_SHIPMENT',
                        id: shipmentId,
                        reasonCode: 'MGS_MGP_ITEM_CONFLICT',
                        evidenceIds: [shipmentId, planId]
                    });
                    return;
                }
                const operationalTarget = resolveMontageShipmentOperationalTarget(shipment);
                if (!operationalTarget.ok
                    || (operationalTarget.rebound
                        && (!deferredStockTransfer || status !== 'IN_TRANSIT'))) {
                    pushUncertain({
                        kind: 'MGS_SHIPMENT',
                        id: shipmentId,
                        reasonCode: operationalTarget.ok
                            ? 'MGS_OPERATIONAL_REBIND_SCOPE_INVALID'
                            : operationalTarget.reasonCode,
                        evidenceIds: [shipmentId, planId]
                    });
                    return;
                }
                const normalizedParts = normalizeLifecycleAggregateParts({
                    parts: shipment?.parts,
                    qtyField: 'shippedQty',
                    prcIndex
                });
                if (!normalizedParts.ok) {
                    pushUncertain({
                        kind: 'MGS_SHIPMENT',
                        id: shipmentId,
                        reasonCode: `MGS_${normalizedParts.reasonCode}`,
                        evidenceIds: [shipmentId, planId]
                    });
                    return;
                }
                const aggregate = compareLifecyclePartTotals(
                    buildLifecycleExpectedParts(normalizedItems),
                    normalizedParts.totals
                );
                if (!aggregate.ok) {
                    pushUncertain({
                        kind: 'MGS_SHIPMENT',
                        id: shipmentId,
                        reasonCode: `MGS_${aggregate.reasonCode}`,
                        evidenceIds: [shipmentId, planId]
                    });
                    return;
                }
                const validatedPartEvidence = new Map();
                const validatedExactHolds = [];
                for (const [key, part] of normalizedParts.totals.entries()) {
                    const validation = validateShipmentPart({
                        shipment,
                        part: part.raw,
                        prcIndex,
                        movementById,
                        stockRows
                    });
                    if (!validation.ok) {
                        pushUncertain({
                            kind: 'MGS_PART',
                            id: `${shipmentId}|${key}`,
                            reasonCode: validation.reasonCode,
                            prcCode: part.prcCode,
                            unit: part.unit,
                            reportedQty: part.qty,
                            evidenceIds: [shipmentId, planId]
                        });
                        return;
                    }
                    validatedPartEvidence.set(key, validation.evidenceIds);
                    const partHolds = asArray(validation.exactHolds);
                    if (operationalTarget.rebound && partHolds.some((hold) =>
                        code(hold?.sourceType) !== 'SALES_ORDER'
                        || !sameSalesTarget(hold, operationalTarget.fromTarget)
                    )) {
                        pushUncertain({
                            kind: 'MGS_SHIPMENT',
                            id: shipmentId,
                            reasonCode: 'MGS_OPERATIONAL_REBIND_ORIGIN_CONFLICT',
                            evidenceIds: [shipmentId, planId]
                        });
                        return;
                    }
                    validatedExactHolds.push(...partHolds.map((hold) => operationalTarget.rebound
                        ? {
                            ...hold,
                            sourceType: 'SALES_ORDER',
                            sourceOrderId: operationalTarget.target.sourceOrderId,
                            sourceLineId: operationalTarget.target.sourceLineId,
                            demandId: operationalTarget.target.demandId,
                            itemKey: operationalTarget.target.itemKey,
                            operationalRebindEventId: text(operationalTarget.event?.eventId),
                            operationalRebindKey: text(operationalTarget.event?.rebindKey),
                            originalCommercialTarget: operationalTarget.fromTarget
                        }
                        : hold));
                }

                if (status === 'IN_TRANSIT' || status === 'DISPATCHED') {
                    if (deferredStockTransfer) {
                        const holdKeys = new Set();
                        const intervalsBySegment = new Map();
                        const heldQtyByStockRow = new Map();
                        for (const hold of validatedExactHolds) {
                            if (holdKeys.has(hold.holdKey)) {
                                pushUncertain({
                                    kind: 'MGS_SHIPMENT',
                                    id: shipmentId,
                                    reasonCode: 'MGS_DEFERRED_HOLD_DUPLICATE',
                                    evidenceIds: [shipmentId, planId]
                                });
                                return;
                            }
                            holdKeys.add(hold.holdKey);
                            if (!intervalsBySegment.has(hold.physicalSegmentId)) {
                                intervalsBySegment.set(hold.physicalSegmentId, []);
                            }
                            intervalsBySegment.get(hold.physicalSegmentId).push(hold);
                            heldQtyByStockRow.set(
                                hold.stockRowId,
                                roundQty((heldQtyByStockRow.get(hold.stockRowId) || 0) + hold.qty)
                            );
                        }
                        const overlaps = Array.from(intervalsBySegment.values()).some((ranges) => {
                            ranges.sort((left, right) =>
                                left.segmentOffsetStart - right.segmentOffsetStart
                                || left.segmentOffsetEnd - right.segmentOffsetEnd
                            );
                            return ranges.some((range, index) =>
                                index > 0
                                && range.segmentOffsetStart < ranges[index - 1].segmentOffsetEnd - EPSILON
                            );
                        });
                        const insufficientRow = Array.from(heldQtyByStockRow.entries()).find(([rowId, heldQty]) => {
                            const matches = stockRows.filter((row) => text(row?.id) === rowId);
                            const qtyResult = matches.length === 1
                                ? getQtyAliasResult(matches[0])
                                : { ok: false, qty: 0 };
                            return !qtyResult.ok || heldQty > qtyResult.qty + EPSILON;
                        });
                        if (!validatedExactHolds.length || overlaps || insufficientRow) {
                            pushUncertain({
                                kind: 'MGS_SHIPMENT',
                                id: shipmentId,
                                reasonCode: !validatedExactHolds.length
                                    ? 'MGS_DEFERRED_HOLD_MISSING'
                                    : overlaps
                                        ? 'MGS_DEFERRED_HOLD_OVERLAP'
                                        : 'MGS_DEFERRED_HOLD_QTY_CONFLICT',
                                evidenceIds: [shipmentId, planId]
                            });
                            return;
                        }
                        exactHolds.push(...validatedExactHolds);
                        validDeferredShipmentIds.add(shipmentId);
                        evidence.push({
                            kind: 'MGS_IN_TRANSIT_EXACT_HOLD',
                            id: shipmentId,
                            planId,
                            status,
                            physical: false,
                            stockRowIds: Array.from(heldQtyByStockRow.keys()).sort(compareText),
                            holdKeys: validatedExactHolds.map((hold) => hold.holdKey).sort(compareText),
                            evidenceIds: [shipmentId, planId]
                        });
                        return;
                    }
                    normalizedItems.forEach((item, itemIndex) => {
                        item.recipeParts.forEach((part) => {
                            const qty = roundQty(item.setQty * part.qtyPerSet);
                            segments.push(createLifecyclePrcSegment({
                                stage: 'MONTAGE_IN_TRANSIT',
                                sourceKind: 'MGS_LOCKED_SHIPMENT',
                                shipment,
                                plan,
                                item,
                                itemIndex,
                                part,
                                qty,
                                evidenceIds: [
                                    shipmentId,
                                    planId,
                                    ...asArray(validatedPartEvidence.get(part.key))
                                ]
                            }));
                        });
                    });
                    evidence.push({
                        kind: 'MGS_IN_TRANSIT_LOCK',
                        id: shipmentId,
                        planId,
                        status,
                        physical: true,
                        evidenceIds: [shipmentId, planId]
                    });
                    return;
                }

                const receiptKey = text(shipment?.receiptKey);
                if (!receiptKey || text(shipment?.targetUnitId) !== 'u3') {
                    pushUncertain({
                        kind: 'MGS_RECEIVED',
                        id: shipmentId,
                        reasonCode: !receiptKey ? 'MGS_RECEIPT_KEY_MISSING' : 'MGS_RECEIPT_TARGET_CONFLICT',
                        evidenceIds: [shipmentId, planId, receiptKey]
                    });
                    return;
                }
                const shipmentTransfers = linkedActiveTransfers;
                const pendingByItem = new Map();
                const postedByItem = new Map();
                const transferResults = [];
                let transferReason = '';
                for (const transfer of shipmentTransfers) {
                    const transferId = text(transfer?.id);
                    if (transferId) handledTransferIds.add(transferId);
                    const itemIndex = Number(transfer?.sourceShipmentItemIndex);
                    const item = Number.isInteger(itemIndex) ? normalizedItems[itemIndex] : null;
                    const qtyResult = getQtyAliasResult(transfer);
                    if (!transferId || transferIdCounts.get(transferId) !== 1) {
                        transferReason = !transferId ? 'MCT_ID_MISSING' : 'MCT_ID_DUPLICATE';
                        break;
                    }
                    if (!item) {
                        transferReason = 'MCT_SOURCE_ITEM_MISSING';
                        break;
                    }
                    const normalizedTransfer = normalizeLifecycleItem({
                        item: transfer,
                        qtyField: 'qty',
                        prcIndex
                    });
                    if (!normalizedTransfer.ok || !sameLifecycleItem(normalizedTransfer.item, {
                        ...item,
                        setQty: normalizedTransfer.item?.setQty
                    })) {
                        transferReason = normalizedTransfer.ok
                            ? 'MCT_SOURCE_IDENTITY_CONFLICT'
                            : `MCT_${normalizedTransfer.reasonCode}`;
                        break;
                    }
                    if (!qtyResult.ok || !isPositiveQty(qtyResult.qty)
                        || !sameQty(qtyResult.qty, normalizedTransfer.item.setQty)
                        || text(transfer?.sourcePlanId) !== planId) {
                        transferReason = !qtyResult.ok
                            ? `MCT_${qtyResult.reasonCode}`
                            : 'MCT_QTY_OR_PLAN_CONFLICT';
                        break;
                    }
                    const targetMap = code(transfer?.status) === 'POSTED' ? postedByItem : pendingByItem;
                    targetMap.set(itemIndex, roundQty((targetMap.get(itemIndex) || 0) + qtyResult.qty));
                    let postedEvidence = null;
                    if (code(transfer?.status) === 'POSTED') {
                        const stockItemId = text(transfer?.finishedProductStockItemId);
                        if (stockItemId) handledStockRowIds.add(stockItemId);
                        postedEvidence = validatePostedTransferEvidence({
                            transfer,
                            item,
                            stockRows,
                            movementById
                        });
                        if (!postedEvidence.ok) {
                            transferReason = postedEvidence.reasonCode;
                            break;
                        }
                    }
                    transferResults.push({
                        transfer,
                        transferId,
                        item,
                        itemIndex,
                        qty: qtyResult.qty,
                        status: code(transfer?.status),
                        postedEvidence
                    });
                }
                if (!transferReason) {
                    normalizedItems.forEach((item, itemIndex) => {
                        if ((pendingByItem.get(itemIndex) || 0) + (postedByItem.get(itemIndex) || 0)
                            > item.setQty + EPSILON) {
                            transferReason = 'MCT_CUMULATIVE_QTY_EXCEEDS_MGS';
                        }
                    });
                }
                if (transferReason) {
                    pushUncertain({
                        kind: 'MGS_MCT_LIFECYCLE',
                        id: shipmentId,
                        reasonCode: transferReason,
                        candidates: shipmentTransfers.map((row) => row?.id),
                        evidenceIds: [shipmentId, planId, ...shipmentTransfers.map((row) => row?.id)]
                    });
                    return;
                }

                const receiptMovementRows = movements.filter((movement) =>
                    code(movement?.movementType || movement?.type) === 'MONTAGE_DISPATCH_RECEIPT'
                    && text(movement?.shipmentId) === shipmentId
                );
                const receiptStockByPart = new Map();
                const receiptEvidenceByPart = new Map();
                let receiptReason = '';
                for (const [key, aggregatePart] of normalizedParts.totals.entries()) {
                    const rowMatches = linkedReceiptRows.filter((row) =>
                        text(row?.receiptKey) === receiptKey
                        && text(row?.refId || row?.productId) === aggregatePart.prcId
                        && code(row?.productCode || row?.code) === aggregatePart.prcCode
                        && code(row?.unit) === aggregatePart.unit
                    );
                    const movementMatches = receiptMovementRows.filter((movement) =>
                        text(movement?.receiptKey) === receiptKey
                        && text(movement?.refId || movement?.productId) === aggregatePart.prcId
                        && code(movement?.productCode || movement?.code) === aggregatePart.prcCode
                        && code(movement?.unit) === aggregatePart.unit
                        && sameQty(movement?.qty ?? movement?.quantity, aggregatePart.qty)
                    );
                    if (rowMatches.length !== 1) {
                        receiptReason = rowMatches.length > 1
                            ? 'MGS_RECEIPT_STOCK_DUPLICATE'
                            : 'MGS_RECEIPT_STOCK_MISSING';
                        break;
                    }
                    if (movementMatches.length !== 1) {
                        receiptReason = movementMatches.length > 1
                            ? 'MGS_RECEIPT_MOVEMENT_DUPLICATE'
                            : 'MGS_RECEIPT_MOVEMENT_MISSING';
                        break;
                    }
                    const stockQty = getLifecycleStockQty(rowMatches[0]);
                    const expectedCurrentQty = roundQty(normalizedItems.reduce((sum, item, itemIndex) => {
                        const recipePart = item.recipeParts.find((part) => part.key === key);
                        const postedQty = postedByItem.get(itemIndex) || 0;
                        return sum + (recipePart ? recipePart.qtyPerSet * (item.setQty - postedQty) : 0);
                    }, 0));
                    if (!stockQty.ok || !sameQty(stockQty.qty, expectedCurrentQty)
                        || text(rowMatches[0]?.sourcePlanId || rowMatches[0]?.planId) !== planId) {
                        receiptReason = stockQty.reasonCode || 'MGS_RECEIPT_STOCK_QTY_CONFLICT';
                        break;
                    }
                    receiptStockByPart.set(key, rowMatches[0]);
                    receiptEvidenceByPart.set(key, [
                        text(rowMatches[0]?.id),
                        text(movementMatches[0]?.id)
                    ]);
                }
                if (receiptReason) {
                    pushUncertain({
                        kind: 'MGS_RECEIVED',
                        id: shipmentId,
                        reasonCode: receiptReason,
                        candidates: linkedReceiptRows.map((row) => row?.id),
                        evidenceIds: [
                            shipmentId,
                            planId,
                            ...linkedReceiptRows.map((row) => row?.id),
                            ...receiptMovementRows.map((row) => row?.id)
                        ]
                    });
                    return;
                }

                normalizedItems.forEach((item, itemIndex) => {
                    const pendingQty = pendingByItem.get(itemIndex) || 0;
                    const postedQty = postedByItem.get(itemIndex) || 0;
                    const receivedSetQty = roundQty(item.setQty - pendingQty - postedQty);
                    if (receivedSetQty <= EPSILON) return;
                    item.recipeParts.forEach((part) => {
                        const qty = roundQty(receivedSetQty * part.qtyPerSet);
                        const stockRow = receiptStockByPart.get(part.key);
                        segments.push(createLifecyclePrcSegment({
                            stage: 'MONTAGE_RECEIVED',
                            sourceKind: 'MGS_RECEIPT_JOIN',
                            shipment,
                            plan,
                            item,
                            itemIndex,
                            part,
                            qty,
                            stockSlices: [{ stockRowId: text(stockRow?.id), qty }],
                            evidenceIds: [
                                shipmentId,
                                planId,
                                ...asArray(validatedPartEvidence.get(part.key)),
                                ...asArray(receiptEvidenceByPart.get(part.key))
                            ]
                        }));
                    });
                });
                transferResults.forEach((result) => {
                    const supersedesSegmentKeys = result.item.recipeParts.map((part) =>
                        `LIFECYCLE|${shipmentId}|${result.itemIndex}|${part.prcId}|MONTAGE_RECEIVED`
                    );
                    if (result.status === 'PENDING_DEPOT_RECEIPT') {
                        segments.push(createLifecycleSvrSegment({
                            stage: 'MONTAGE_PENDING_DEPOT_RECEIPT',
                            sourceKind: 'MCT_PENDING_REPRESENTATION',
                            shipment,
                            plan,
                            item: result.item,
                            itemIndex: result.itemIndex,
                            transfer: result.transfer,
                            qty: result.qty,
                            evidenceIds: [shipmentId, planId, result.transferId],
                            supersedesSegmentKeys
                        }));
                        evidence.push({
                            kind: 'MCT_PENDING',
                            id: result.transferId,
                            shipmentId,
                            physical: true,
                            representationKey: `MONTAGE|${shipmentId}|${result.itemIndex}|SVR|${result.transferId}`
                        });
                    } else {
                        const postedEvidence = result.postedEvidence;
                        if (postedEvidence.stockQty > EPSILON) {
                            segments.push(createLifecycleSvrSegment({
                                stage: 'MONTAGE_FINISHED_STOCK',
                                sourceKind: 'CURRENT_SVR_STOCK_ROW',
                                shipment,
                                plan,
                                item: result.item,
                                itemIndex: result.itemIndex,
                                transfer: result.transfer,
                                qty: postedEvidence.stockQty,
                                stockRow: postedEvidence.stockRow,
                                evidenceIds: [
                                    shipmentId,
                                    planId,
                                    result.transferId,
                                    ...postedEvidence.evidenceIds
                                ],
                                supersedesSegmentKeys
                            }));
                        }
                        evidence.push({
                            kind: 'MCT_POSTED_PROOF',
                            id: result.transferId,
                            shipmentId,
                            physical: false,
                            stockRowId: text(postedEvidence.stockRow?.id),
                            evidenceIds: postedEvidence.evidenceIds
                        });
                    }
                });
                evidence.push({
                    kind: 'MGS_RECEIVED_JOIN',
                    id: shipmentId,
                    planId,
                    receiptKey,
                    physical: true,
                    stockRowIds: linkedReceiptRows.map((row) => text(row?.id)).filter(Boolean).sort(compareText)
                });
            });

        activeTransfers.forEach((transfer) => {
            const transferId = text(transfer?.id);
            if (handledTransferIds.has(transferId)) return;
            const stockItemId = text(transfer?.finishedProductStockItemId);
            if (stockItemId) handledStockRowIds.add(stockItemId);
            pushUncertain({
                kind: 'MCT_TRANSFER',
                id: transferId,
                reasonCode: 'MCT_SOURCE_SHIPMENT_MISSING',
                source: transfer,
                reportedQty: transfer?.qty ?? transfer?.quantity,
                evidenceIds: [transferId, transfer?.sourceShipmentId, transfer?.sourcePlanId]
            });
        });

        const failClosedStockRowIds = new Set();
        deferredCandidateRowsByShipment.forEach((rowIds, shipmentId) => {
            if (validDeferredShipmentIds.has(shipmentId)) return;
            rowIds.forEach((rowId) => failClosedStockRowIds.add(rowId));
        });
        return {
            segments,
            reservations: stableSort(reservations, (row) => row.reservationKey),
            evidence: stableSort(evidence, (row) => `${text(row?.kind)}|${text(row?.id)}`),
            uncertain,
            exactHolds: stableSort(exactHolds, (row) => row.holdKey),
            handledStockRowIds,
            handledShipmentIds,
            failClosedStockRowIds,
            diagnostics: {
                planCount: asArray(plans).length,
                activeDraftReservationCount: reservations.length,
                lifecycleSegmentCount: segments.length,
                lifecycleEvidenceCount: evidence.length,
                exactHoldCount: exactHolds.length,
                uncertainCount: uncertain.length
            }
        };
    };

    const normalizeDebtType = (value) => {
        const sourceType = code(value);
        if (sourceType === 'SALES' || sourceType === 'SALES_ORDER') return 'SALES';
        if (sourceType === 'STOCK') return 'STOCK';
        return '';
    };

    const getPositiveLineQty = (line) => {
        const present = ['qty', 'quantity']
            .filter((field) => Object.prototype.hasOwnProperty.call(line || {}, field)
                && line?.[field] !== ''
                && line?.[field] !== null
                && line?.[field] !== undefined)
            .map((field) => Number(line[field]));
        if (!present.length || present.some((value) => !Number.isFinite(value))) return null;
        if (present.some((value) => !sameQty(value, present[0]))) return null;
        return present[0] > EPSILON ? roundQty(present[0]) : 0;
    };

    const getDateEvidence = (value) => {
        const raw = text(value);
        const timestamp = Date.parse(raw);
        if (!raw || !Number.isFinite(timestamp)) return { ok: false, raw, timestamp: null, iso: '' };
        return { ok: true, raw, timestamp, iso: new Date(timestamp).toISOString() };
    };

    const resolveProductionQueue = (order) => {
        const hasQueue = Object.prototype.hasOwnProperty.call(order || {}, 'productionQueue');
        if (!hasQueue || order?.productionQueue === null || order?.productionQueue === undefined) {
            return {
                present: false,
                ok: true,
                manualOrder: null,
                updatedAt: '',
                updatedBy: '',
                reasonCode: ''
            };
        }
        const queue = order.productionQueue;
        if (!queue || typeof queue !== 'object' || Array.isArray(queue)) {
            return {
                present: true,
                ok: false,
                manualOrder: null,
                updatedAt: '',
                updatedBy: '',
                reasonCode: 'SOR_MANUAL_QUEUE_INVALID'
            };
        }
        const hasManualOrder = Object.prototype.hasOwnProperty.call(queue, 'manualOrder')
            && queue.manualOrder !== ''
            && queue.manualOrder !== null
            && queue.manualOrder !== undefined;
        if (!hasManualOrder) {
            return {
                present: false,
                ok: true,
                manualOrder: null,
                updatedAt: '',
                updatedBy: '',
                reasonCode: ''
            };
        }
        const manualOrder = Number(queue.manualOrder);
        if (!Number.isSafeInteger(manualOrder) || manualOrder <= 0) {
            return {
                present: true,
                ok: false,
                manualOrder: null,
                updatedAt: text(queue.updatedAt),
                updatedBy: text(queue.updatedBy),
                reasonCode: 'SOR_MANUAL_ORDER_INVALID'
            };
        }
        const updatedAt = getDateEvidence(queue.updatedAt);
        const updatedBy = text(queue.updatedBy);
        if (!updatedAt.ok || !updatedBy) {
            return {
                present: true,
                ok: false,
                manualOrder,
                updatedAt: updatedAt.iso,
                updatedBy,
                reasonCode: 'SOR_MANUAL_AUDIT_INVALID'
            };
        }
        return {
            present: true,
            ok: true,
            manualOrder,
            updatedAt: updatedAt.iso,
            updatedBy,
            reasonCode: ''
        };
    };

    const containsText = (values, expected) => {
        const target = text(expected);
        return !!target && asArray(values).some((value) => text(value) === target);
    };

    const demandReferencesWorkOrder = (demand, order) => {
        const workOrderId = text(order?.id);
        const workOrderCode = text(order?.workOrderCode);
        return (workOrderId && (
            text(demand?.workOrderId) === workOrderId
            || containsText(demand?.workOrderIds, workOrderId)
        )) || (workOrderCode && (
            text(demand?.workOrderCode) === workOrderCode
            || containsText(demand?.workOrderCodes, workOrderCode)
        ));
    };

    const resolveWorkOrderDemand = ({ order, demands, demandIdCounts }) => {
        const sourceId = text(order?.sourceId);
        const sourceCode = text(order?.sourceCode);
        const workOrderId = text(order?.id);
        const workOrderCode = text(order?.workOrderCode);
        const directById = sourceId ? demands.filter((demand) => text(demand?.id) === sourceId) : [];
        const directByCode = sourceCode
            ? demands.filter((demand) => text(demand?.demandCode) === sourceCode)
            : [];
        const reciprocal = demands.filter((demand) => demandReferencesWorkOrder(demand, order));
        let candidates = directById.length ? directById : directByCode.length ? directByCode : reciprocal;
        candidates = candidates.filter((demand, index) => candidates.indexOf(demand) === index);
        if (candidates.length !== 1) {
            return {
                ok: false,
                reasonCode: candidates.length > 1 ? 'WO_PLN_LINK_DUPLICATE' : 'WO_PLN_LINK_MISSING',
                demand: null
            };
        }

        const demand = candidates[0];
        const demandId = text(demand?.id);
        if (!demandId || demandIdCounts.get(demandId) !== 1) {
            return { ok: false, reasonCode: 'PLN_ID_DUPLICATE', demand };
        }
        if ((sourceId && demandId !== sourceId)
            || (sourceCode && text(demand?.demandCode) !== sourceCode)) {
            return { ok: false, reasonCode: 'WO_PLN_LINK_CONFLICT', demand };
        }
        const competing = reciprocal.filter((row) => row !== demand);
        if (competing.length) return { ok: false, reasonCode: 'WO_PLN_LINK_CONFLICT', demand };
        if (asArray(demand?.workOrderIds).length
            && !containsText(demand.workOrderIds, workOrderId)) {
            return { ok: false, reasonCode: 'PLN_WO_ID_CONFLICT', demand };
        }
        if (asArray(demand?.workOrderCodes).length
            && !containsText(demand.workOrderCodes, workOrderCode)) {
            return { ok: false, reasonCode: 'PLN_WO_CODE_CONFLICT', demand };
        }

        const sourceItemKey = text(order?.sourceItemKey);
        const itemMatches = sourceItemKey
            ? asArray(demand?.items).filter((item) => text(item?.id || item?.itemKey || item?.key) === sourceItemKey)
            : [];
        if (!sourceItemKey || itemMatches.length !== 1) {
            return {
                ok: false,
                reasonCode: itemMatches.length > 1 ? 'WO_PLN_ITEM_DUPLICATE' : 'WO_PLN_ITEM_MISSING',
                demand
            };
        }
        return { ok: true, reasonCode: '', demand, demandItem: itemMatches[0] };
    };

    const getPlanningSourceSelection = (row, {
        sourceBucket,
        selectedField,
        qtyField
    }) => {
        const hasSelected = Object.prototype.hasOwnProperty.call(row || {}, selectedField);
        const selectedValue = row?.[selectedField];
        const hasQty = Object.prototype.hasOwnProperty.call(row || {}, qtyField)
            && row?.[qtyField] !== ''
            && row?.[qtyField] !== null
            && row?.[qtyField] !== undefined;
        const qty = hasQty ? Number(row[qtyField]) : 0;
        if (hasSelected && typeof selectedValue !== 'boolean') {
            return {
                selected: true,
                sourceBucket,
                qty: 0,
                ok: false,
                reasonCode: 'PLANNING_SOURCE_FLAG_INVALID'
            };
        }
        if (hasQty && (!Number.isFinite(qty) || qty < 0)) {
            return {
                selected: hasSelected ? selectedValue === true : true,
                sourceBucket,
                qty: 0,
                ok: false,
                reasonCode: 'PLANNING_SOURCE_QTY_INVALID'
            };
        }
        const selected = hasSelected ? selectedValue === true : qty > EPSILON;
        if (!selected && qty > EPSILON) {
            return {
                selected: true,
                sourceBucket,
                qty: roundQty(qty),
                ok: false,
                reasonCode: 'PLANNING_SOURCE_FLAG_QTY_CONFLICT'
            };
        }
        if (selected && qty <= EPSILON) {
            return {
                selected: true,
                sourceBucket,
                qty: 0,
                ok: false,
                reasonCode: 'PLANNING_SOURCE_SELECTED_QTY_MISSING'
            };
        }
        return {
            selected,
            sourceBucket,
            qty: selected ? roundQty(qty) : 0,
            ok: true,
            reasonCode: ''
        };
    };

    const buildPlanningSourceEntitlements = ({ demands, prcIndex }) => {
        const sourceFields = [
            {
                sourceBucket: SOURCE_BUCKETS.STOCK,
                selectedField: 'useStockSelected',
                qtyField: 'useStockQty'
            },
            {
                sourceBucket: SOURCE_BUCKETS.SEMI,
                selectedField: 'useSemiSelected',
                qtyField: 'useSemiQty'
            },
            {
                sourceBucket: SOURCE_BUCKETS.PRODUCTION,
                selectedField: 'useNetSelected',
                qtyField: 'netQty'
            }
        ];
        const entitlements = [];
        stableSort(demands, (demand, index) => `${text(demand?.id)}|${index}`)
            .forEach((demand) => {
                const demandId = text(demand?.id);
                const demandItems = asArray(demand?.items);
                const rows = asArray(demand?.poolAnalysis?.rows);
                const virtualStockAccounting = code(demand?.poolAnalysis?.stockAccountingMode) === 'VIRTUAL_V1';
                stableSort(rows, (row, index) => `${text(row?.key)}|${text(row?.itemKey)}|${code(row?.code)}|${index}`)
                    .forEach((row, rowIndex) => {
                        const itemKey = text(row?.itemKey);
                        const itemMatches = itemKey
                            ? demandItems.filter((item) =>
                                text(item?.id || item?.itemKey || item?.key) === itemKey
                            )
                            : [];
                        const prc = resolveExactPrc(
                            prcIndex,
                            row?.code || row?.componentCode,
                            row?.componentId || row?.refId
                        );
                        const rowUnit = code(row?.unit || prc?.unit);
                        const baseReasons = [];
                        if (!demandId) baseReasons.push('PLANNING_DEMAND_ID_MISSING');
                        if (!itemKey || itemMatches.length !== 1) {
                            baseReasons.push(itemMatches.length > 1
                                ? 'PLANNING_ITEM_KEY_DUPLICATE'
                                : 'PLANNING_ITEM_KEY_MISSING');
                        }
                        if (!prc.ok) baseReasons.push(prc.reasonCode);
                        else if (!rowUnit || rowUnit !== prc.unit) baseReasons.push('PLANNING_SOURCE_UNIT_MISMATCH');

                        sourceFields.forEach((sourceField) => {
                            if (!virtualStockAccounting
                                && (sourceField.sourceBucket === SOURCE_BUCKETS.STOCK
                                    || sourceField.sourceBucket === SOURCE_BUCKETS.SEMI)) return;
                            const selection = getPlanningSourceSelection(row, sourceField);
                            if (!selection.selected) return;
                            const reasonCodes = Array.from(new Set([
                                ...baseReasons,
                                ...(selection.ok ? [] : [selection.reasonCode])
                            ])).sort(compareText);
                            const planningRowKey = text(row?.key) || [
                                demandId,
                                itemKey,
                                prc?.prcId || text(row?.componentId),
                                prc?.prcCode || code(row?.code),
                                rowIndex
                            ].join('|');
                            entitlements.push({
                                entitlementKey: [
                                    'SOURCE',
                                    selection.sourceBucket,
                                    demandId,
                                    itemKey,
                                    prc?.prcId || text(row?.componentId),
                                    prc?.prcCode || code(row?.code),
                                    rowUnit,
                                    planningRowKey
                                ].join('|'),
                                planningRowKey,
                                sourceBucket: selection.sourceBucket,
                                demandId,
                                demandCode: text(demand?.demandCode),
                                demandSourceType: code(demand?.sourceType),
                                originItemKey: itemKey,
                                sourceOrderId: text(demand?.sourceOrderId),
                                sourceOrderNo: text(demand?.sourceOrderNo),
                                sourceLineId: text(demand?.sourceLineId),
                                prcId: prc?.prcId || '',
                                prcCode: prc?.prcCode || code(row?.code),
                                unit: prc?.unit || rowUnit,
                                plannedQty: selection.qty,
                                requiredQty: isPositiveQty(row?.requiredQty)
                                    ? roundQty(row.requiredQty)
                                    : null,
                                itemQty: isPositiveQty(row?.itemQty || itemMatches[0]?.qty)
                                    ? roundQty(row?.itemQty || itemMatches[0]?.qty)
                                    : null,
                                allocatable: reasonCodes.length === 0 && selection.qty > EPSILON,
                                allocatableQty: 0,
                                reasonCode: reasonCodes[0] || '',
                                reasonCodes
                            });
                        });
                    });
            });

        const identityCounts = new Map();
        entitlements.forEach((entry) => {
            const identity = [
                entry.sourceBucket,
                entry.demandId,
                entry.originItemKey,
                entry.prcId,
                entry.prcCode,
                entry.unit
            ].join('|');
            entry.identityKey = identity;
            identityCounts.set(identity, (identityCounts.get(identity) || 0) + 1);
        });
        entitlements.forEach((entry) => {
            if (identityCounts.get(entry.identityKey) === 1) return;
            entry.reasonCodes = Array.from(new Set([
                ...entry.reasonCodes,
                'PLANNING_SOURCE_DUPLICATE'
            ])).sort(compareText);
            entry.reasonCode = entry.reasonCodes[0];
            entry.allocatable = false;
        });
        return stableSort(entitlements, (entry) => entry.entitlementKey);
    };

    const isInactiveOrder = (order) => {
        const status = code(order?.status);
        return !!order?.deleted
            || !!order?.cancelled
            || ['CANCELLED', 'CANCELED', 'IPTAL', 'İPTAL', 'ARSIV', 'ARŞİV', 'ARCHIVED'].includes(status);
    };

    const isInactiveOrderLine = (line) => {
        const status = code(line?.status);
        return !!line?.deleted
            || !!line?.cancelled
            || ['CANCELLED', 'CANCELED', 'IPTAL', 'İPTAL', 'ARSIV', 'ARŞİV', 'ARCHIVED'].includes(status);
    };

    const buildSalesReadiness = ({ order, demands }) => {
        const orderId = text(order?.id);
        const reasonCodes = [];
        if (!orderId || isInactiveOrder(order)) reasonCodes.push('SOR_INACTIVE_OR_ID_MISSING');
        const positiveLines = [];
        asArray(order?.lines).forEach((line) => {
            if (isInactiveOrderLine(line)) return;
            const qty = getPositiveLineQty(line);
            if (qty === null) reasonCodes.push('SOR_LINE_QTY_UNCERTAIN');
            else if (qty > EPSILON) positiveLines.push(line);
        });
        if (!positiveLines.length) reasonCodes.push('SOR_POSITIVE_LINE_MISSING');

        const releasedByLine = new Map();
        const releaseDates = [];
        const dueDates = [];
        positiveLines.forEach((line) => {
            const lineId = text(line?.id);
            if (!lineId) {
                reasonCodes.push('SOR_LINE_ID_MISSING');
                return;
            }
            const linked = demands.filter((demand) =>
                normalizeDebtType(demand?.sourceType) === 'SALES'
                && text(demand?.sourceOrderId) === orderId
                && text(demand?.sourceLineId) === lineId
                && !['CANCELLED', 'CANCELED', 'IPTAL', 'İPTAL', 'ARCHIVED'].includes(code(demand?.status))
            );
            if (linked.length !== 1) {
                reasonCodes.push(linked.length > 1 ? 'SOR_PLN_LINK_DUPLICATE' : 'SOR_PARTIAL_RELEASE');
                return;
            }
            const demand = linked[0];
            const releasedAt = getDateEvidence(demand?.released_at);
            if (code(demand?.status) !== 'RELEASED' || !releasedAt.ok) {
                reasonCodes.push('SOR_PARTIAL_RELEASE');
                return;
            }
            const demandItems = asArray(demand?.items);
            if (demandItems.length !== 1) {
                reasonCodes.push(demandItems.length > 1 ? 'SOR_PLN_ITEM_DUPLICATE' : 'SOR_PLN_ITEM_MISSING');
                return;
            }
            const orderVariantCode = code(line?.variantCode || line?.svrCode);
            const demandVariantCode = code(demandItems[0]?.variantCode || demand?.variantCode);
            if (orderVariantCode && demandVariantCode && orderVariantCode !== demandVariantCode) {
                reasonCodes.push('SOR_PLN_VARIANT_CONFLICT');
                return;
            }
            releasedByLine.set(lineId, demand);
            releaseDates.push(releasedAt);
            const dueDate = getDateEvidence(demand?.dueDate);
            if (dueDate.ok) dueDates.push(dueDate);
        });

        const orderDueDate = getDateEvidence(order?.deliveryDate || order?.dueDate);
        if (!orderDueDate.ok) reasonCodes.push('SOR_DUE_DATE_MISSING');
        if (orderDueDate.ok && dueDates.some((entry) => entry.timestamp !== orderDueDate.timestamp)) {
            reasonCodes.push('SOR_DUE_DATE_CONFLICT');
        }
        const latestRelease = releaseDates.length
            ? releaseDates.slice().sort((left, right) => right.timestamp - left.timestamp)[0]
            : null;
        return {
            ok: reasonCodes.length === 0 && releasedByLine.size === positiveLines.length,
            reasonCodes: Array.from(new Set(reasonCodes)).sort(compareText),
            releasedByLine,
            productionReadyAt: latestRelease?.iso || '',
            productionReadyTimestamp: latestRelease?.timestamp ?? null,
            dueDate: orderDueDate.ok ? orderDueDate.raw : '',
            dueTimestamp: orderDueDate.timestamp,
            sorKey: `${text(order?.orderNo)}|${orderId}`
        };
    };

    const getShipmentItemQty = (item) => {
        const fields = ['dispatchQty', 'shippedQty']
            .filter((field) => Object.prototype.hasOwnProperty.call(item || {}, field)
                && item?.[field] !== ''
                && item?.[field] !== null
                && item?.[field] !== undefined)
            .map((field) => Number(item[field]));
        if (!fields.length || fields.some((value) => !Number.isFinite(value) || value <= 0)) return null;
        if (fields.some((value) => !sameQty(value, fields[0]))) return null;
        return roundQty(fields[0]);
    };

    const validateFrozenRecipePart = ({ parts, prc, quantity }) => {
        const matches = asArray(parts).filter((part) => code(part?.code) === prc.prcCode);
        if (matches.length !== 1) {
            return {
                ok: false,
                reasonCode: matches.length > 1 ? 'DISPATCH_RECIPE_PRC_DUPLICATE' : 'DISPATCH_RECIPE_PRC_MISSING'
            };
        }
        const part = matches[0];
        const resolved = resolveExactPrc(
            { byCode: new Map([[prc.prcCode, [prc.card]]]), byId: new Map([[prc.prcId, [prc.card]]]) },
            part?.code,
            part?.refId
        );
        const partUnit = code(part?.unit);
        const qtyPerSet = Number(part?.qtyPerSet);
        if (!resolved.ok || resolved.prcId !== prc.prcId) {
            return { ok: false, reasonCode: 'DISPATCH_RECIPE_PRC_CONFLICT' };
        }
        if (!partUnit || partUnit !== prc.unit) {
            return { ok: false, reasonCode: 'DISPATCH_RECIPE_UNIT_MISMATCH' };
        }
        if (!isPositiveQty(qtyPerSet)) {
            return { ok: false, reasonCode: 'DISPATCH_RECIPE_QTY_INVALID' };
        }
        return { ok: true, qty: roundQty(Number(quantity) * qtyPerSet) };
    };

    const shipmentItemMatchesOrderLine = ({ item, shipment, order, orderLine }) => {
        const orderId = text(order?.id);
        const lineId = text(orderLine?.id);
        const itemOrderId = text(item?.sourceOrderId || shipment?.sourceOrderId || shipment?.snapshot?.sourceOrderId);
        if (itemOrderId !== orderId || text(item?.sourceLineId) !== lineId) return false;
        const expectedProductId = text(orderLine?.productId);
        const actualProductId = text(item?.productId);
        if (expectedProductId && actualProductId && expectedProductId !== actualProductId) return false;
        const expectedVariantId = text(orderLine?.variationId || orderLine?.variantId);
        const actualVariantId = text(item?.variantId || item?.variationId);
        if (expectedVariantId && actualVariantId && expectedVariantId !== actualVariantId) return false;
        const expectedVariantCode = code(orderLine?.variantCode || orderLine?.svrCode);
        const actualVariantCode = code(item?.variantCode || item?.svrCode);
        return !(expectedVariantCode && actualVariantCode && expectedVariantCode !== actualVariantCode);
    };

    const resolveDispatchedQty = ({
        debt,
        order,
        orderLine,
        prc,
        salesShipments,
        shipmentIdCounts,
        shipmentKeyCounts,
        completionTransfers,
        completionTransferIdCounts
    }) => {
        let dispatchedQty = 0;
        const evidenceIds = [];
        const relevant = salesShipments.filter((shipment) =>
            code(shipment?.status) === 'DISPATCHED'
            && text(shipment?.sourceOrderId || shipment?.snapshot?.sourceOrderId) === text(order?.id)
        );
        for (const shipment of relevant) {
            const shipmentId = text(shipment?.id);
            const idempotencyKey = text(shipment?.idempotencyKey);
            const shipmentOrderNo = text(shipment?.sourceOrderNo || shipment?.snapshot?.sourceOrderNo);
            if (!shipmentId || shipmentIdCounts.get(shipmentId) !== 1) {
                return { ok: false, reasonCode: 'DISPATCH_ID_DUPLICATE', dispatchedQty: null, evidenceIds };
            }
            if (idempotencyKey && shipmentKeyCounts.get(idempotencyKey) !== 1) {
                return { ok: false, reasonCode: 'DISPATCH_IDEMPOTENCY_DUPLICATE', dispatchedQty: null, evidenceIds };
            }
            if (shipmentOrderNo && shipmentOrderNo !== text(order?.orderNo)) {
                return { ok: false, reasonCode: 'DISPATCH_SOR_CONFLICT', dispatchedQty: null, evidenceIds };
            }
            const items = asArray(shipment?.snapshot?.items).length
                ? asArray(shipment.snapshot.items)
                : asArray(shipment?.items);
            const matches = items.filter((item) => shipmentItemMatchesOrderLine({
                item,
                shipment,
                order,
                orderLine
            }));
            const sameLine = items.filter((item) => text(item?.sourceLineId) === text(orderLine?.id));
            if (sameLine.length && matches.length !== sameLine.length) {
                return { ok: false, reasonCode: 'DISPATCH_PRODUCT_CONFLICT', dispatchedQty: null, evidenceIds };
            }
            if (!matches.length) continue;
            if (matches.length !== 1) {
                return { ok: false, reasonCode: 'DISPATCH_LINE_DUPLICATE', dispatchedQty: null, evidenceIds };
            }
            const item = matches[0];
            const shippedSets = getShipmentItemQty(item);
            if (!isPositiveQty(shippedSets)) {
                return { ok: false, reasonCode: 'DISPATCH_QTY_INVALID', dispatchedQty: null, evidenceIds };
            }

            let recipeResult;
            if (asArray(item?.recipeParts).length) {
                recipeResult = validateFrozenRecipePart({ parts: item.recipeParts, prc, quantity: shippedSets });
            } else {
                const allocations = asArray(item?.stockAllocations);
                if (!allocations.length) {
                    return {
                        ok: false,
                        reasonCode: 'DISPATCH_FROZEN_RECIPE_MISSING',
                        dispatchedQty: null,
                        evidenceIds
                    };
                }
                let allocatedSets = 0;
                let convertedQty = 0;
                for (const allocation of allocations) {
                    const allocationQty = Number(allocation?.allocatedQty);
                    const transferId = text(allocation?.completionTransferId);
                    if (!isPositiveQty(allocationQty)
                        || !transferId
                        || completionTransferIdCounts.get(transferId) !== 1) {
                        return {
                            ok: false,
                            reasonCode: 'DISPATCH_MCT_EVIDENCE_INVALID',
                            dispatchedQty: null,
                            evidenceIds
                        };
                    }
                    const transfer = completionTransfers.find((row) => text(row?.id) === transferId);
                    if (!transfer
                        || code(transfer?.status) !== 'POSTED'
                        || text(transfer?.sourceOrderId) !== text(order?.id)
                        || text(transfer?.sourceLineId) !== text(orderLine?.id)) {
                        return {
                            ok: false,
                            reasonCode: 'DISPATCH_MCT_EVIDENCE_CONFLICT',
                            dispatchedQty: null,
                            evidenceIds
                        };
                    }
                    const recipe = validateFrozenRecipePart({
                        parts: transfer?.recipeParts,
                        prc,
                        quantity: allocationQty
                    });
                    if (!recipe.ok) {
                        return { ...recipe, dispatchedQty: null, evidenceIds };
                    }
                    allocatedSets = roundQty(allocatedSets + allocationQty);
                    convertedQty = roundQty(convertedQty + recipe.qty);
                    evidenceIds.push(transferId);
                }
                if (!sameQty(allocatedSets, shippedSets)) {
                    return {
                        ok: false,
                        reasonCode: 'DISPATCH_MCT_QTY_CONFLICT',
                        dispatchedQty: null,
                        evidenceIds
                    };
                }
                recipeResult = { ok: true, qty: convertedQty };
            }
            if (!recipeResult.ok) return { ...recipeResult, dispatchedQty: null, evidenceIds };
            dispatchedQty = roundQty(dispatchedQty + recipeResult.qty);
            evidenceIds.push(shipmentId);
        }
        if (dispatchedQty > debt.targetQty + EPSILON) {
            return {
                ok: false,
                reasonCode: 'DISPATCH_EXCEEDS_TARGET',
                dispatchedQty: null,
                evidenceIds
            };
        }
        return {
            ok: true,
            reasonCode: '',
            dispatchedQty,
            evidenceIds: Array.from(new Set(evidenceIds)).sort(compareText)
        };
    };

    const getExactHoldTargetKey = (row) => [
        code(row?.sourceType),
        text(row?.sourceOrderId),
        text(row?.sourceLineId),
        text(row?.demandId),
        text(row?.itemKey || row?.originItemKey),
        text(row?.prcId || row?.refId),
        code(row?.prcCode || row?.code),
        code(row?.unit)
    ].join('|');

    const buildExactHoldLedger = ({ input, segments, exactHolds, lifecycleReservations }) => {
        const holds = [];
        const issues = [];
        const invalidSegmentKeys = new Set();
        const instructionInvalidSegmentKeys = new Set();
        const instructionLineageCandidateSegmentKeys = new Set();
        const invalidIdentityKeys = new Set();
        const segmentCounts = new Map();
        const segmentByKey = new Map();
        asArray(segments).forEach((segment) => {
            const key = text(segment?.segmentKey);
            if (!key) return;
            segmentCounts.set(key, (segmentCounts.get(key) || 0) + 1);
            if (!segmentByKey.has(key)) segmentByKey.set(key, segment);
        });
        const identityKey = (row) => [
            text(row?.prcId || row?.refId),
            code(row?.prcCode || row?.code),
            code(row?.unit)
        ].join('|');
        const addIssue = (reasonCode, {
            segmentKeys = [], identities = [], holdKey = '', ownerId = '',
            instructionId = '', instructionCode = '', instructionSliceKey = '', instructionRelated = false
        } = {}) => {
            asArray(segmentKeys).map(text).filter(Boolean).forEach((key) => {
                invalidSegmentKeys.add(key);
                if (instructionRelated) instructionInvalidSegmentKeys.add(key);
            });
            asArray(identities).forEach((row) => {
                const key = identityKey(row);
                if (key !== '||') invalidIdentityKeys.add(key);
            });
            issues.push({
                reasonCode,
                holdKey: text(holdKey),
                ownerId: text(ownerId),
                instructionId: text(instructionId),
                instructionCode: code(instructionCode),
                instructionSliceKey: text(instructionSliceKey),
                segmentKeys: asArray(segmentKeys).map(text).filter(Boolean).sort(compareText)
            });
        };
        const normalizeRangeHold = (raw, { holdKind, holdState, ownerId, holdKey }) => {
            const physicalSegmentId = text(raw?.physicalSegmentId);
            const stockRowId = text(raw?.stockRowId)
                || (text(raw?.physicalSegmentId).startsWith('STOCK|')
                    ? text(raw?.physicalSegmentId).slice('STOCK|'.length)
                    : '');
            const qty = Number(raw?.qty ?? raw?.reservedQty);
            const start = Number(raw?.segmentOffsetStart);
            const end = Number(raw?.segmentOffsetEnd);
            const sourceType = code(raw?.sourceType);
            const sourceBucket = code(raw?.sourceBucket);
            const normalized = {
                holdKey: text(holdKey),
                holdKind,
                holdState,
                ownerId: text(ownerId),
                planId: text(raw?.planId),
                shipmentId: text(raw?.shipmentId),
                reservationKey: text(raw?.reservationKey),
                physicalSegmentId,
                stockRowId,
                sourceBucket,
                sourceType,
                sourceOrderId: text(raw?.sourceOrderId),
                sourceLineId: text(raw?.sourceLineId),
                demandId: text(raw?.demandId),
                itemKey: text(raw?.itemKey || raw?.originItemKey),
                prcId: text(raw?.prcId || raw?.refId),
                prcCode: code(raw?.prcCode || raw?.code),
                unit: code(raw?.unit),
                segmentOffsetStart: roundQty(start),
                segmentOffsetEnd: roundQty(end),
                qty: roundQty(qty),
                hasExactRange: true,
                fixedTarget: true
            };
            const valid = normalized.holdKey
                && physicalSegmentId
                && (!stockRowId || physicalSegmentId === `STOCK|${stockRowId}`)
                && ['SALES_ORDER', 'STOCK'].includes(sourceType)
                && (sourceType !== 'SALES_ORDER'
                    || (normalized.sourceOrderId && normalized.sourceLineId))
                && normalized.demandId
                && normalized.itemKey
                && normalized.prcId
                && normalized.prcCode
                && normalized.unit
                && [SOURCE_BUCKETS.STOCK, SOURCE_BUCKETS.PRODUCTION].includes(sourceBucket)
                && isPositiveQty(qty)
                && Number.isFinite(start)
                && Number.isFinite(end)
                && start >= 0
                && end > start
                && sameQty(end - start, qty);
            return valid ? { ok: true, hold: normalized } : { ok: false, hold: normalized };
        };

        const activeMgpPlans = stableSort(
            asArray(input?.montageDispatchPlans).filter((plan) => code(plan?.status) === 'DRAFT'),
            (plan, index) => `${text(plan?.id)}|${text(plan?.planNo)}|${index}`
        );
        const planBoundReservationsByKey = new Map();
        activeMgpPlans.forEach((plan) => {
            const planId = text(plan?.id);
            asArray(plan?.exactReservations).forEach((reservation) => {
                const reservationKey = text(reservation?.reservationKey);
                if (!planId || !reservationKey) return;
                const key = `${planId}|${reservationKey}`;
                if (!planBoundReservationsByKey.has(key)) planBoundReservationsByKey.set(key, []);
                planBoundReservationsByKey.get(key).push({ plan, reservation });
            });
        });
        const consumedPlanBoundReservationKeys = new Set();
        const isExactPlanBoundPair = ({ record, target, slice, instructionId, sliceKey, candidate }) => {
            const plan = candidate?.plan;
            const reservation = candidate?.reservation;
            return text(plan?.id) === text(slice?.planId)
                && text(reservation?.planId) === text(plan?.id)
                && text(reservation?.reservationKey) === text(slice?.reservationKey)
                && text(reservation?.instructionId) === instructionId
                && text(reservation?.instructionSliceKey) === sliceKey
                && code(reservation?.sourceType) === 'SALES_ORDER'
                && text(reservation?.sourceOrderId) === text(target?.sourceOrderId)
                && text(reservation?.sourceLineId) === text(target?.sourceLineId)
                && text(reservation?.demandId) === text(target?.demandId)
                && text(reservation?.itemKey) === text(target?.itemKey)
                && text(reservation?.prcId) === text(record?.prcId)
                && code(reservation?.prcCode) === code(record?.prcCode)
                && code(reservation?.unit) === code(record?.unit)
                && text(reservation?.stockRowId) === text(slice?.stockRowId)
                && text(reservation?.physicalSegmentId) === text(slice?.physicalSegmentId)
                && sameQty(reservation?.segmentOffsetStart, slice?.segmentOffsetStart)
                && sameQty(reservation?.segmentOffsetEnd, slice?.segmentOffsetEnd)
                && sameQty(reservation?.qty, slice?.qty);
        };

        const instructionRows = asArray(input?.sanalTaksimAllocationInstructions);
        const instructionIdCounts = new Map();
        const instructionCodeCounts = new Map();
        const instructionIdempotencyCounts = new Map();
        instructionRows.forEach((record) => {
            const id = text(record?.id);
            const instructionCode = code(record?.instructionCode);
            const idempotencyKey = text(record?.idempotencyKey);
            if (id) instructionIdCounts.set(id, (instructionIdCounts.get(id) || 0) + 1);
            if (instructionCode) instructionCodeCounts.set(instructionCode, (instructionCodeCounts.get(instructionCode) || 0) + 1);
            if (idempotencyKey) instructionIdempotencyCounts.set(idempotencyKey, (instructionIdempotencyCounts.get(idempotencyKey) || 0) + 1);
        });
        const dispatchedPlanBoundReservationsByKey = new Map();
        asArray(input?.montageDispatchPlans)
            .filter((plan) => code(plan?.status) === 'DISPATCHED_TO_MONTAGE')
            .forEach((plan) => {
                const planId = text(plan?.id);
                asArray(plan?.exactReservations).forEach((reservation) => {
                    const reservationKey = text(reservation?.reservationKey);
                    if (!planId || !reservationKey
                        || !text(reservation?.instructionId)
                        || !text(reservation?.instructionSliceKey)) return;
                    const key = `${planId}|${reservationKey}`;
                    if (!dispatchedPlanBoundReservationsByKey.has(key)) {
                        dispatchedPlanBoundReservationsByKey.set(key, []);
                    }
                    dispatchedPlanBoundReservationsByKey.get(key).push({ plan, reservation });
                });
            });
        const resolvePlanBoundMgsTransfer = (raw) => {
            const key = `${text(raw?.planId)}|${text(raw?.reservationKey)}`;
            const candidates = asArray(dispatchedPlanBoundReservationsByKey.get(key));
            if (!candidates.length) return { present: false, valid: false };
            if (candidates.length !== 1) return { present: true, valid: false };
            const candidate = candidates[0];
            const instructionId = text(candidate?.reservation?.instructionId);
            const sliceKey = text(candidate?.reservation?.instructionSliceKey);
            const instructionMatches = instructionRows.filter((record) => text(record?.id) === instructionId);
            if (instructionMatches.length !== 1) return { present: true, valid: false };
            const record = instructionMatches[0];
            const slices = asArray(record?.slices).filter((slice) => text(slice?.sliceKey) === sliceKey);
            const target = record?.target && typeof record.target === 'object' && !Array.isArray(record.target)
                ? record.target : {};
            const events = asArray(record?.events);
            const reservation = candidate.reservation;
            const operationalRebindEventId = text(raw?.operationalRebindEventId);
            const operationalRebindKey = text(raw?.operationalRebindKey);
            const originalCommercialTarget = raw?.originalCommercialTarget
                && typeof raw.originalCommercialTarget === 'object'
                && !Array.isArray(raw.originalCommercialTarget)
                ? raw.originalCommercialTarget : null;
            const hasOperationalRebindBinding = Boolean(
                operationalRebindEventId
                || operationalRebindKey
                || originalCommercialTarget
            );
            const operationalRebindBindingValid = !hasOperationalRebindBinding
                || (Boolean(operationalRebindEventId)
                    && Boolean(operationalRebindKey)
                    && isCompleteSalesTarget(originalCommercialTarget));
            const commercialBindingTarget = hasOperationalRebindBinding
                ? originalCommercialTarget : raw;
            const rawMatchesReservation = text(raw?.planId) === text(candidate?.plan?.id)
                && text(raw?.reservationKey) === text(reservation?.reservationKey)
                && code(raw?.sourceType) === code(reservation?.sourceType)
                && operationalRebindBindingValid
                && text(commercialBindingTarget?.sourceOrderId) === text(reservation?.sourceOrderId)
                && text(commercialBindingTarget?.sourceLineId) === text(reservation?.sourceLineId)
                && text(commercialBindingTarget?.demandId) === text(reservation?.demandId)
                && text(commercialBindingTarget?.itemKey) === text(reservation?.itemKey)
                && text(raw?.prcId) === text(reservation?.prcId)
                && code(raw?.prcCode) === code(reservation?.prcCode)
                && code(raw?.unit) === code(reservation?.unit)
                && text(raw?.stockRowId) === text(reservation?.stockRowId)
                && text(raw?.physicalSegmentId) === text(reservation?.physicalSegmentId)
                && sameQty(raw?.segmentOffsetStart, reservation?.segmentOffsetStart)
                && sameQty(raw?.segmentOffsetEnd, reservation?.segmentOffsetEnd)
                && sameQty(raw?.qty, reservation?.qty);
            const valid = code(record?.status) === 'COMPLETED'
                && events.length > 0
                && code(events[events.length - 1]?.type) === 'COMPLETED'
                && instructionIdCounts.get(instructionId) === 1
                && instructionCodeCounts.get(code(record?.instructionCode)) === 1
                && instructionIdempotencyCounts.get(text(record?.idempotencyKey)) === 1
                && slices.length === 1
                && isExactPlanBoundPair({
                    record,
                    target,
                    slice: slices[0],
                    instructionId,
                    sliceKey,
                    candidate
                })
                && rawMatchesReservation;
            return {
                present: true,
                valid,
                instructionId,
                instructionCode: code(record?.instructionCode),
                instructionSliceKey: sliceKey
            };
        };
        stableSort(instructionRows.filter((record) => code(record?.status) === 'ACTIVE'), (record, index) =>
            `${text(record?.id)}|${code(record?.instructionCode)}|${index}`
        ).forEach((record) => {
            const instructionId = text(record?.id);
            const instructionCode = code(record?.instructionCode);
            const idempotencyKey = text(record?.idempotencyKey);
            const target = record?.target && typeof record.target === 'object' && !Array.isArray(record.target)
                ? record.target
                : {};
            const slices = asArray(record?.slices);
            const recordQty = Number(record?.qty);
            const recordCoreValid = instructionId
                && instructionCode
                && idempotencyKey
                && Number(record?.contractVersion) === 1
                && text(record?.prcId)
                && code(record?.prcCode)
                && code(record?.unit)
                && isPositiveQty(recordQty)
                && text(record?.reason)
                && Number.isFinite(Date.parse(text(record?.createdAt)))
                && text(record?.createdBy)
                && Array.isArray(record?.events)
                && record.events.length === 0
                && slices.length > 0
                && text(target?.sourceOrderId)
                && text(target?.sourceLineId)
                && text(target?.demandId)
                && text(target?.itemKey)
                && instructionIdCounts.get(instructionId) === 1
                && instructionCodeCounts.get(instructionCode) === 1
                && instructionIdempotencyCounts.get(idempotencyKey) === 1
                && sameQty(slices.reduce((sum, slice) => sum + Number(slice?.qty || 0), 0), recordQty);
            if (!recordCoreValid) {
                const segmentKeys = slices.map((slice) => text(slice?.physicalSegmentId)).filter(Boolean);
                slices.forEach((slice) => {
                    const audit = normalizeAllocationInstructionOriginAudit(slice?.physicalOriginAudit);
                    const lineageKey = buildAllocationInstructionLineageKey(record, audit);
                    asArray(segments).filter((segment) =>
                        buildAllocationInstructionLineageKey(record, buildAllocationInstructionOriginAudit(segment)) === lineageKey
                    ).forEach((segment) => instructionLineageCandidateSegmentKeys.add(text(segment?.segmentKey)));
                });
                addIssue('USER_INSTRUCTION_SCHEMA_INVALID', {
                    segmentKeys,
                    instructionId,
                    instructionCode,
                    instructionRelated: true
                });
                return;
            }

            const recordSliceKeys = new Set();
            slices.forEach((slice) => {
                const sliceKey = text(slice?.sliceKey);
                const physicalSegmentId = text(slice?.physicalSegmentId);
                const stockRowId = text(slice?.stockRowId);
                const boundPlanId = text(slice?.planId);
                const boundReservationKey = text(slice?.reservationKey);
                const hasPlanBindingField = !!(boundPlanId || boundReservationKey);
                const planBindingKey = boundPlanId && boundReservationKey
                    ? `${boundPlanId}|${boundReservationKey}`
                    : '';
                const planBindingCandidates = planBindingKey
                    ? asArray(planBoundReservationsByKey.get(planBindingKey))
                    : [];
                const planBinding = planBindingCandidates.length === 1
                    && isExactPlanBoundPair({
                        record,
                        target,
                        slice,
                        instructionId,
                        sliceKey,
                        candidate: planBindingCandidates[0]
                    })
                    ? planBindingCandidates[0]
                    : null;
                const capacityAtCreate = Number(slice?.segmentCapacityQtyAtCreate);
                const audit = normalizeAllocationInstructionOriginAudit(slice?.physicalOriginAudit);
                const segment = segmentByKey.get(physicalSegmentId);
                const canonicalAudit = buildAllocationInstructionOriginAudit(segment);
                const expectedLineageKey = buildAllocationInstructionLineageKey(record, audit);
                const canonicalLineageKey = buildAllocationInstructionLineageKey(record, canonicalAudit);
                const normalized = normalizeRangeHold({
                    ...slice,
                    sourceType: 'SALES_ORDER',
                    sourceBucket: SOURCE_BUCKETS.STOCK,
                    sourceOrderId: target.sourceOrderId,
                    sourceLineId: target.sourceLineId,
                    demandId: target.demandId,
                    itemKey: target.itemKey,
                    prcId: record.prcId,
                    prcCode: record.prcCode,
                    unit: record.unit
                }, {
                    holdKind: 'USER_INSTRUCTION_EXACT',
                    holdState: PHYSICAL_ALLOCATION_STATES.RESERVED,
                    ownerId: instructionId,
                    holdKey: `USER_INSTRUCTION|${instructionId}|${sliceKey}`
                });
                const segmentValid = !!segment
                    && segmentCounts.get(physicalSegmentId) === 1
                    && segment.sourceKind === 'CURRENT_STOCK_ROW'
                    && segment.stage === 'DEPOT_STOCK'
                    && segment.mainDepot === true
                    && segment.allocationState === PHYSICAL_ALLOCATION_STATES.REALLOCATABLE
                    && segment.reallocatable === true
                    && code(segment.originSourceType) !== 'UNSCOPED'
                    && text(segment.stockRowId) === stockRowId
                    && physicalSegmentId === `STOCK|${stockRowId}`
                    && segment.prcId === text(record.prcId)
                    && segment.prcCode === code(record.prcCode)
                    && segment.unit === code(record.unit)
                    && sameQty(segment.physicalQty, capacityAtCreate)
                    && JSON.stringify(canonicalAudit) === JSON.stringify(audit)
                    && text(slice?.lineageKey) === expectedLineageKey
                    && expectedLineageKey === canonicalLineageKey;
                const sliceValid = normalized.ok
                    && sliceKey
                    && !recordSliceKeys.has(sliceKey)
                    && isPositiveQty(capacityAtCreate)
                    && segmentValid
                    && (!hasPlanBindingField || !!planBinding);
                if (!sliceValid) {
                    asArray(segments).filter((candidate) =>
                        buildAllocationInstructionLineageKey(record, buildAllocationInstructionOriginAudit(candidate)) === expectedLineageKey
                    ).forEach((candidate) => instructionLineageCandidateSegmentKeys.add(text(candidate?.segmentKey)));
                    addIssue(hasPlanBindingField
                        ? 'USER_INSTRUCTION_PLAN_BINDING_INVALID'
                        : 'USER_INSTRUCTION_SLICE_INVALID', {
                        segmentKeys: [physicalSegmentId],
                        identities: [record],
                        holdKey: normalized.hold?.holdKey,
                        ownerId: instructionId,
                        instructionId,
                        instructionCode,
                        instructionSliceKey: sliceKey,
                        instructionRelated: true
                    });
                    return;
                }
                recordSliceKeys.add(sliceKey);
                if (planBindingKey) consumedPlanBoundReservationKeys.add(planBindingKey);
                holds.push({
                    ...normalized.hold,
                    holdPriority: 0,
                    instructionId,
                    instructionCode,
                    instructionSliceKey: sliceKey,
                    instructionQty: roundQty(recordQty),
                    instructionSegmentCapacityQtyAtCreate: roundQty(capacityAtCreate),
                    instructionLineageKey: expectedLineageKey,
                    instructionPhysicalOriginAudit: audit,
                    planBound: !!planBinding,
                    planBoundMontagePlanId: boundPlanId,
                    planBoundMontagePlanNo: text(planBinding?.plan?.planNo),
                    planBoundReservationKey: boundReservationKey
                });
            });
        });

        asArray(exactHolds).forEach((raw) => {
            const planBoundTransfer = resolvePlanBoundMgsTransfer(raw);
            const normalized = normalizeRangeHold(raw, {
                holdKind: 'MGS_EXACT',
                holdState: PHYSICAL_ALLOCATION_STATES.LOCKED,
                ownerId: raw?.shipmentId,
                holdKey: raw?.holdKey
            });
            if (!normalized.ok) {
                addIssue('MGS_EXACT_HOLD_INVALID', {
                    segmentKeys: [raw?.physicalSegmentId],
                    identities: [raw],
                    holdKey: raw?.holdKey,
                    ownerId: raw?.shipmentId
                });
                return;
            }
            if (planBoundTransfer.present && !planBoundTransfer.valid) {
                addIssue('USER_INSTRUCTION_PLAN_BINDING_INVALID', {
                    segmentKeys: [raw?.physicalSegmentId],
                    identities: [raw],
                    holdKey: raw?.holdKey,
                    ownerId: raw?.shipmentId,
                    instructionId: planBoundTransfer.instructionId,
                    instructionCode: planBoundTransfer.instructionCode,
                    instructionSliceKey: planBoundTransfer.instructionSliceKey,
                    instructionRelated: true
                });
            }
            holds.push({
                ...normalized.hold,
                holdPriority: 1,
                planBoundInstructionTransfer: planBoundTransfer.valid === true,
                instructionId: planBoundTransfer.valid ? planBoundTransfer.instructionId : '',
                instructionCode: planBoundTransfer.valid ? planBoundTransfer.instructionCode : '',
                instructionSliceKey: planBoundTransfer.valid ? planBoundTransfer.instructionSliceKey : ''
            });
        });

        const mgpPlanIdCounts = new Map();
        activeMgpPlans.forEach((plan) => {
            const planId = text(plan?.id);
            if (planId) mgpPlanIdCounts.set(planId, (mgpPlanIdCounts.get(planId) || 0) + 1);
        });
        const expectedMgpByPlan = new Map();
        asArray(lifecycleReservations)
            .filter((row) => code(row?.kind) === 'MGP_DRAFT_RESERVATION')
            .forEach((row) => {
                const planId = text(row?.planId);
                if (!expectedMgpByPlan.has(planId)) expectedMgpByPlan.set(planId, []);
                expectedMgpByPlan.get(planId).push(row);
            });
        activeMgpPlans.forEach((plan) => {
            const planId = text(plan?.id);
            const expected = asArray(expectedMgpByPlan.get(planId));
            const rawReservations = asArray(plan?.exactReservations);
            const planSegmentKeys = rawReservations.map((row) => text(row?.physicalSegmentId)).filter(Boolean);
            const planIdentities = [...expected, ...rawReservations];
            if (!planId || mgpPlanIdCounts.get(planId) !== 1) {
                addIssue(!planId ? 'MGP_DRAFT_ID_MISSING' : 'MGP_DRAFT_ID_DUPLICATE', {
                    segmentKeys: planSegmentKeys,
                    identities: planIdentities,
                    ownerId: planId
                });
                return;
            }
            if (!expected.length || !Object.prototype.hasOwnProperty.call(plan, 'exactReservations')
                || !rawReservations.length) {
                addIssue(!expected.length
                    ? 'MGP_DRAFT_TARGET_UNRESOLVED'
                    : 'MGP_LEGACY_EXACT_RESERVATION_MISSING', {
                    segmentKeys: planSegmentKeys,
                    identities: planIdentities,
                    ownerId: planId
                });
                return;
            }
            const normalizedPlanHolds = [];
            const reservationKeys = new Set();
            let invalid = false;
            rawReservations.forEach((raw, index) => {
                const reservationKey = text(raw?.reservationKey) || [
                    'MGP_EXACT', planId, getExactHoldTargetKey(raw), text(raw?.physicalSegmentId),
                    roundQty(raw?.segmentOffsetStart), roundQty(raw?.segmentOffsetEnd)
                ].join('|');
                const normalized = normalizeRangeHold({ ...raw, planId, reservationKey }, {
                    holdKind: 'MGP_DRAFT_EXACT',
                    holdState: PHYSICAL_ALLOCATION_STATES.RESERVED,
                    ownerId: planId,
                    holdKey: `MGP_HOLD|${planId}|${reservationKey || index}`
                });
                const hasInstructionBinding = !!(text(raw?.instructionId) || text(raw?.instructionSliceKey));
                const planBindingKey = `${planId}|${reservationKey}`;
                const planBindingValid = !hasInstructionBinding
                    || (text(raw?.instructionId)
                        && text(raw?.instructionSliceKey)
                        && consumedPlanBoundReservationKeys.has(planBindingKey));
                if (!normalized.ok || reservationKeys.has(reservationKey) || !planBindingValid) {
                    invalid = true;
                    return;
                }
                reservationKeys.add(reservationKey);
                normalizedPlanHolds.push({
                    ...normalized.hold,
                    holdPriority: 1,
                    planBound: hasInstructionBinding,
                    instructionId: text(raw?.instructionId),
                    instructionSliceKey: text(raw?.instructionSliceKey),
                    planBoundReservationKey: reservationKey
                });
            });
            const expectedQtyByTarget = new Map();
            expected.forEach((row) => {
                const key = getExactHoldTargetKey(row);
                expectedQtyByTarget.set(key, roundQty((expectedQtyByTarget.get(key) || 0) + Number(row?.qty || 0)));
            });
            const heldQtyByTarget = new Map();
            normalizedPlanHolds.forEach((hold) => {
                const key = getExactHoldTargetKey(hold);
                heldQtyByTarget.set(key, roundQty((heldQtyByTarget.get(key) || 0) + hold.qty));
            });
            const targetKeys = new Set([...expectedQtyByTarget.keys(), ...heldQtyByTarget.keys()]);
            const totalsMatch = Array.from(targetKeys).every((key) =>
                sameQty(expectedQtyByTarget.get(key) || 0, heldQtyByTarget.get(key) || 0)
            );
            if (invalid || !totalsMatch) {
                addIssue(invalid ? 'MGP_EXACT_RESERVATION_INVALID' : 'MGP_EXACT_RESERVATION_QTY_MISMATCH', {
                    segmentKeys: planSegmentKeys,
                    identities: planIdentities,
                    ownerId: planId
                });
                return;
            }
            holds.push(...normalizedPlanHolds.filter((hold) =>
                !consumedPlanBoundReservationKeys.has(`${planId}|${text(hold?.reservationKey)}`)
            ));
        });

        const activeSvpPlans = stableSort(
            asArray(input?.salesShipmentPlans).filter((plan) => code(plan?.status) === 'PLANNED'),
            (plan, index) => `${text(plan?.id)}|${text(plan?.planNo)}|${index}`
        );
        const svpPlanIdCounts = new Map();
        activeSvpPlans.forEach((plan) => {
            const planId = text(plan?.id);
            if (planId) svpPlanIdCounts.set(planId, (svpPlanIdCounts.get(planId) || 0) + 1);
        });
        activeSvpPlans.forEach((plan) => {
            const planId = text(plan?.id);
            const referencedSegmentKeys = asArray(plan?.items).flatMap((item) =>
                asArray(item?.stockAllocations).map((allocation) =>
                    `STOCK|${text(allocation?.stockItemId)}`
                ).filter((key) => key !== 'STOCK|')
            );
            if (!planId || svpPlanIdCounts.get(planId) !== 1) {
                addIssue(!planId ? 'SVP_ID_MISSING' : 'SVP_ID_DUPLICATE', {
                    segmentKeys: referencedSegmentKeys,
                    ownerId: planId
                });
                return;
            }
            asArray(plan?.items).forEach((item, itemIndex) => {
                const allocations = asArray(item?.stockAllocations);
                const plannedQty = Number(item?.plannedQty);
                const allocationQty = allocations.reduce((sum, row) => sum + Number(row?.allocatedQty || 0), 0);
                const itemSegmentKeys = allocations.map((row) => `STOCK|${text(row?.stockItemId)}`);
                const itemValid = text(plan?.sourceOrderId)
                    && text(item?.sourceLineId)
                    && Number.isSafeInteger(plannedQty)
                    && plannedQty > 0
                    && allocations.length > 0
                    && sameQty(allocationQty, plannedQty)
                    && allocations.every((row) =>
                        text(row?.stockItemId)
                        && Number.isSafeInteger(Number(row?.allocatedQty))
                        && Number(row?.allocatedQty) > 0
                        && text(row?.sourceOrderId) === text(plan?.sourceOrderId)
                        && text(row?.sourceLineId) === text(item?.sourceLineId)
                    );
                if (!itemValid) {
                    addIssue('SVP_PLANNED_EXACT_RESERVATION_INVALID', {
                        segmentKeys: itemSegmentKeys,
                        ownerId: planId
                    });
                    return;
                }
                allocations.forEach((row, allocationIndex) => {
                    const stockRowId = text(row?.stockItemId);
                    holds.push({
                        holdKey: `SVP_HOLD|${planId}|${itemIndex}|${allocationIndex}|${stockRowId}`,
                        holdKind: 'SVP_PLANNED_EXACT',
                        holdState: PHYSICAL_ALLOCATION_STATES.RESERVED,
                        ownerId: planId,
                        planId,
                        physicalSegmentId: `STOCK|${stockRowId}`,
                        stockRowId,
                        sourceOrderId: text(plan?.sourceOrderId),
                        sourceLineId: text(item?.sourceLineId),
                        qty: roundQty(row?.allocatedQty),
                        hasExactRange: false,
                        fixedTarget: false,
                        holdPriority: 1
                    });
                });
            });
        });

        const holdKeyCounts = new Map();
        const holdsBySegment = new Map();
        holds.forEach((hold) => {
            holdKeyCounts.set(hold.holdKey, (holdKeyCounts.get(hold.holdKey) || 0) + 1);
            if (!holdsBySegment.has(hold.physicalSegmentId)) holdsBySegment.set(hold.physicalSegmentId, []);
            holdsBySegment.get(hold.physicalSegmentId).push(hold);
        });
        holds.forEach((hold) => {
            const segment = segmentByKey.get(hold.physicalSegmentId);
            const segmentQty = Number(segment?.physicalQty ?? segment?.qty ?? 0);
            if (!segment && hold.holdKind === 'SVP_PLANNED_EXACT') return;
            if (holdKeyCounts.get(hold.holdKey) !== 1
                || segmentCounts.get(hold.physicalSegmentId) !== 1
                || !segment
                || !isPositiveQty(hold.qty)
                || (hold.stockRowId && text(segment?.stockRowId) !== hold.stockRowId)
                || (hold.prcId && text(segment?.prcId) !== hold.prcId)
                || (hold.prcCode && code(segment?.prcCode) !== hold.prcCode)
                || (hold.unit && code(segment?.unit) !== hold.unit)
                || (hold.hasExactRange && hold.segmentOffsetEnd > segmentQty + EPSILON)) {
                addIssue('EXACT_HOLD_SEGMENT_CONFLICT', {
                    segmentKeys: [hold.physicalSegmentId],
                    identities: [hold],
                    holdKey: hold.holdKey,
                    ownerId: hold.ownerId,
                    instructionId: hold.instructionId,
                    instructionCode: hold.instructionCode,
                    instructionSliceKey: hold.instructionSliceKey,
                    instructionRelated: hold.holdKind === 'USER_INSTRUCTION_EXACT'
                });
            }
        });
        holdsBySegment.forEach((segmentHolds, segmentKey) => {
            const segment = segmentByKey.get(segmentKey);
            if (!segment) return;
            const ranges = segmentHolds.filter((hold) => hold.hasExactRange).slice().sort((left, right) =>
                left.segmentOffsetStart - right.segmentOffsetStart
                || left.segmentOffsetEnd - right.segmentOffsetEnd
                || compareText(left.holdKey, right.holdKey)
            );
            const quantityOnly = segmentHolds.filter((hold) => !hold.hasExactRange);
            const overlap = ranges.some((range, index) => index > 0
                && range.segmentOffsetStart < ranges[index - 1].segmentOffsetEnd - EPSILON);
            const totalQty = roundQty(segmentHolds.reduce((sum, hold) => sum + hold.qty, 0));
            const capacity = Number(segment?.physicalQty ?? segment?.qty ?? 0);
            if (overlap || (ranges.length && quantityOnly.length) || totalQty > capacity + EPSILON) {
                const reasonCode = overlap
                    ? 'EXACT_HOLD_RANGE_OVERLAP'
                    : ranges.length && quantityOnly.length
                        ? 'EXACT_HOLD_RANGE_PROOF_CONFLICT'
                        : 'EXACT_HOLD_QTY_EXCEEDS_SEGMENT';
                const instructionHolds = segmentHolds.filter((hold) =>
                    hold.holdKind === 'USER_INSTRUCTION_EXACT'
                );
                if (!instructionHolds.length) {
                    addIssue(reasonCode, {
                        segmentKeys: [segmentKey],
                        instructionRelated: false
                    });
                } else {
                    instructionHolds.forEach((hold) => addIssue(reasonCode, {
                        segmentKeys: [segmentKey],
                        holdKey: hold.holdKey,
                        ownerId: hold.ownerId,
                        instructionId: hold.instructionId,
                        instructionCode: hold.instructionCode,
                        instructionSliceKey: hold.instructionSliceKey,
                        instructionRelated: true
                    }));
                }
            }
        });
        invalidIdentityKeys.forEach((key) => {
            asArray(segments).filter((segment) => identityKey(segment) === key)
                .forEach((segment) => invalidSegmentKeys.add(segment.segmentKey));
        });
        instructionLineageCandidateSegmentKeys.forEach((segmentKey) => {
            invalidSegmentKeys.add(segmentKey);
            instructionInvalidSegmentKeys.add(segmentKey);
        });
        return {
            holds: holds.filter((hold) =>
                segmentByKey.has(hold.physicalSegmentId)
                && !invalidSegmentKeys.has(hold.physicalSegmentId)
            ).slice().sort((left, right) =>
                Number(left?.holdPriority || 0) - Number(right?.holdPriority || 0)
                || compareText(left?.holdKey, right?.holdKey)
            ),
            issues: stableSort(issues, (issue, index) =>
                `${issue.reasonCode}|${issue.ownerId}|${issue.holdKey}|${index}`),
            invalidSegmentKeys,
            instructionInvalidSegmentKeys,
            instructionLineageCandidateSegmentKeys,
            outOfScopeHoldCount: holds.filter((hold) => !segmentByKey.has(hold.physicalSegmentId)).length,
            activeInstructionCount: instructionRows.filter((record) => code(record?.status) === 'ACTIVE').length,
            valid: issues.length === 0
        };
    };

    const buildExactSourceSelectionReadModel = ({
        input,
        prcIndex,
        target,
        debts,
        segments,
        holdLedger
    }) => {
        const fail = (reasonCode, message) => ({
            ok: false,
            reasonCode,
            message,
            target: null,
            targetDebtKey: '',
            targetOpenQty: null,
            slices: [],
            totalSelectableQty: 0,
            readOnly: true,
            writes: 0
        });
        const normalizedTarget = {
            sourceOrderId: text(target?.sourceOrderId),
            sourceLineId: text(target?.sourceLineId),
            demandId: text(target?.demandId),
            itemKey: text(target?.itemKey),
            prcId: text(target?.prcId),
            prcCode: code(target?.prcCode),
            unit: code(target?.unit)
        };
        if (Object.values(normalizedTarget).some((value) => !value)) {
            return fail(
                'INSTRUCTION_REQUEST_INVALID',
                'Exact kaynak seçimi için sipariş, satır, talep, kalem, PRC ve birim kimlikleri zorunludur.'
            );
        }
        const prc = resolveExactPrc(prcIndex, normalizedTarget.prcCode, normalizedTarget.prcId);
        if (!prc.ok || prc.prcId !== normalizedTarget.prcId
            || prc.prcCode !== normalizedTarget.prcCode
            || prc.unit !== normalizedTarget.unit) {
            return fail(
                'INSTRUCTION_TARGET_DEBT_INVALID',
                'Hedef borcun exact PRC ve birim kimliği doğrulanamadı.'
            );
        }

        const orderMatches = asArray(input?.orders).filter((order) =>
            text(order?.id) === normalizedTarget.sourceOrderId
        );
        const orderLineMatches = orderMatches.length === 1
            ? asArray(orderMatches[0]?.lines).filter((line) =>
                text(line?.id || line?.lineId) === normalizedTarget.sourceLineId
            )
            : [];
        const demandMatches = asArray(input?.planningDemands).filter((demand) =>
            text(demand?.id) === normalizedTarget.demandId
        );
        const demand = demandMatches.length === 1 ? demandMatches[0] : null;
        const demandItemMatches = demand
            ? asArray(demand?.items).filter((item) =>
                text(item?.id) === normalizedTarget.itemKey
            )
            : [];
        if (orderMatches.length !== 1
            || orderLineMatches.length !== 1
            || demandMatches.length !== 1
            || code(demand?.sourceType) !== 'SALES_ORDER'
            || text(demand?.sourceOrderId) !== normalizedTarget.sourceOrderId
            || text(demand?.sourceLineId) !== normalizedTarget.sourceLineId
            || demandItemMatches.length !== 1) {
            return fail(
                'INSTRUCTION_TARGET_DEBT_INVALID',
                'Hedef SALES sipariş, satır, talep veya kalem kimliği tekil olarak doğrulanamadı.'
            );
        }

        const debtMatches = asArray(debts).filter((debt) =>
            debt?.debtType === 'SALES'
            && text(debt?.originOrderId) === normalizedTarget.sourceOrderId
            && text(debt?.originOrderLineId) === normalizedTarget.sourceLineId
            && text(debt?.originDemandId) === normalizedTarget.demandId
            && text(debt?.originItemKey) === normalizedTarget.itemKey
            && text(debt?.prcId) === normalizedTarget.prcId
            && code(debt?.prcCode) === normalizedTarget.prcCode
            && code(debt?.unit) === normalizedTarget.unit
        );
        const debt = debtMatches.length === 1 ? debtMatches[0] : null;
        if (!debt
            || debt?.allocationEligible !== true
            || !Number.isFinite(Number(debt?.openDebtQty))
            || Number(debt.openDebtQty) <= EPSILON) {
            return fail(
                'INSTRUCTION_TARGET_DEBT_INVALID',
                'Hedef SALES borcu tekil, açık ve tahsise uygun olarak doğrulanamadı.'
            );
        }

        const segmentCounts = new Map();
        asArray(segments).forEach((segment) => {
            const key = text(segment?.segmentKey);
            if (key) segmentCounts.set(key, (segmentCounts.get(key) || 0) + 1);
        });
        const holdsBySegment = new Map();
        asArray(holdLedger?.holds).forEach((hold) => {
            const segmentKey = text(hold?.physicalSegmentId);
            if (!segmentKey) return;
            if (!holdsBySegment.has(segmentKey)) holdsBySegment.set(segmentKey, []);
            holdsBySegment.get(segmentKey).push(hold);
        });

        const slices = [];
        stableSort(segments, (segment) => text(segment?.segmentKey)).forEach((segment) => {
            const physicalSegmentId = text(segment?.segmentKey);
            const stockRowId = text(segment?.stockRowId);
            const physicalQty = Number(segment?.physicalQty ?? segment?.qty);
            const physicalOriginAudit = buildAllocationInstructionOriginAudit(segment);
            const originAuditValid = ['SALES_ORDER', 'STOCK'].includes(physicalOriginAudit.originSourceType)
                && physicalOriginAudit.originDemandId
                && physicalOriginAudit.originItemKey
                && physicalOriginAudit.evidenceIds.length > 0;
            if (!physicalSegmentId
                || segmentCounts.get(physicalSegmentId) !== 1
                || holdLedger?.invalidSegmentKeys?.has(physicalSegmentId)
                || segment?.sourceKind !== 'CURRENT_STOCK_ROW'
                || segment?.stage !== 'DEPOT_STOCK'
                || segment?.mainDepot !== true
                || segment?.allocationState !== PHYSICAL_ALLOCATION_STATES.REALLOCATABLE
                || segment?.reallocatable !== true
                || !stockRowId
                || physicalSegmentId !== `STOCK|${stockRowId}`
                || segment?.prcId !== normalizedTarget.prcId
                || segment?.prcCode !== normalizedTarget.prcCode
                || segment?.unit !== normalizedTarget.unit
                || !Number.isFinite(physicalQty)
                || physicalQty <= EPSILON
                || !originAuditValid) return;

            const segmentHolds = asArray(holdsBySegment.get(physicalSegmentId));
            if (segmentHolds.some((hold) => !hold?.hasExactRange && Number(hold?.qty) > EPSILON)) {
                return;
            }
            const occupied = segmentHolds.slice().sort((left, right) =>
                Number(left?.segmentOffsetStart) - Number(right?.segmentOffsetStart)
                || Number(left?.segmentOffsetEnd) - Number(right?.segmentOffsetEnd)
                || compareText(left?.holdKey, right?.holdKey)
            );
            const rangesValid = occupied.every((hold, index) => {
                const start = Number(hold?.segmentOffsetStart);
                const end = Number(hold?.segmentOffsetEnd);
                const qty = Number(hold?.qty);
                const previousEnd = index > 0 ? Number(occupied[index - 1]?.segmentOffsetEnd) : 0;
                return Number.isFinite(start)
                    && Number.isFinite(end)
                    && Number.isFinite(qty)
                    && start >= 0
                    && end <= physicalQty + EPSILON
                    && end > start
                    && sameQty(end - start, qty)
                    && (index === 0 || start >= previousEnd - EPSILON);
            });
            if (!rangesValid) return;

            let cursor = 0;
            const freeRanges = [];
            occupied.forEach((hold) => {
                const start = roundQty(hold.segmentOffsetStart);
                const end = roundQty(hold.segmentOffsetEnd);
                if (start > cursor + EPSILON) freeRanges.push([cursor, start]);
                cursor = Math.max(cursor, end);
            });
            if (cursor < physicalQty - EPSILON) freeRanges.push([cursor, roundQty(physicalQty)]);
            const lineageKey = buildAllocationInstructionLineageKey(normalizedTarget, physicalOriginAudit);
            freeRanges.forEach(([start, end]) => {
                const qty = roundQty(end - start);
                if (qty <= EPSILON) return;
                slices.push({
                    stockRowId,
                    physicalSegmentId,
                    prcId: normalizedTarget.prcId,
                    prcCode: normalizedTarget.prcCode,
                    unit: normalizedTarget.unit,
                    locationKey: text(segment?.locationKey),
                    mainDepot: true,
                    sourceKind: segment.sourceKind,
                    stage: segment.stage,
                    allocationState: segment.allocationState,
                    allocationStateReasonCode: text(segment?.allocationStateReasonCode),
                    physicalQty: roundQty(physicalQty),
                    heldQty: roundQty(segment?.heldQty),
                    sharedPoolQty: roundQty(segment?.sharedPoolQty),
                    segmentCapacityQtyAtCreate: roundQty(physicalQty),
                    segmentOffsetStart: roundQty(start),
                    segmentOffsetEnd: roundQty(end),
                    qty,
                    lineageKey,
                    physicalOriginAudit,
                    targetDebtKey: text(debt?.debtKey),
                    reasonCode: ''
                });
            });
        });
        const sortedSlices = stableSort(slices, (slice) => [
            slice.physicalSegmentId,
            Number(slice.segmentOffsetStart).toFixed(6).padStart(30, '0'),
            Number(slice.segmentOffsetEnd).toFixed(6).padStart(30, '0')
        ].join('|'));
        return {
            ok: true,
            reasonCode: '',
            message: '',
            target: normalizedTarget,
            targetDebtKey: text(debt.debtKey),
            targetOpenQty: roundQty(debt.openDebtQty),
            slices: sortedSlices,
            totalSelectableQty: roundQty(sortedSlices.reduce((sum, slice) => sum + slice.qty, 0)),
            readOnly: true,
            writes: 0
        };
    };

    const buildCommercialAllocation = ({
        input,
        prcIndex,
        workOrders,
        segments,
        executions,
        completionTransfers,
        exactHolds = [],
        lifecycleReservations = [],
        exactSourceTarget = null
    }) => {
        const orders = asArray(input.orders);
        const demands = asArray(input.planningDemands);
        const salesShipments = asArray(input.salesShipments);
        const sourceEntitlements = buildPlanningSourceEntitlements({ demands, prcIndex });
        const sourceContractDemandIds = new Set(demands
            .filter((demand) => asArray(demand?.poolAnalysis?.rows).length > 0)
            .map((demand) => text(demand?.id))
            .filter(Boolean));
        const demandIdCounts = new Map();
        const orderIdCounts = new Map();
        const shipmentIdCounts = new Map();
        const shipmentKeyCounts = new Map();
        const completionTransferIdCounts = new Map();
        demands.forEach((row) => {
            const id = text(row?.id);
            if (id) demandIdCounts.set(id, (demandIdCounts.get(id) || 0) + 1);
        });
        orders.forEach((row) => {
            const id = text(row?.id);
            if (id) orderIdCounts.set(id, (orderIdCounts.get(id) || 0) + 1);
        });
        salesShipments.forEach((row) => {
            const id = text(row?.id);
            const key = text(row?.idempotencyKey);
            if (id) shipmentIdCounts.set(id, (shipmentIdCounts.get(id) || 0) + 1);
            if (key) shipmentKeyCounts.set(key, (shipmentKeyCounts.get(key) || 0) + 1);
        });
        completionTransfers.forEach((row) => {
            const id = text(row?.id);
            if (id) completionTransferIdCounts.set(id, (completionTransferIdCounts.get(id) || 0) + 1);
        });

        const readinessByOrderId = new Map();
        const getReadiness = (order) => {
            const orderId = text(order?.id);
            if (!readinessByOrderId.has(orderId)) {
                readinessByOrderId.set(orderId, buildSalesReadiness({ order, demands }));
            }
            return readinessByOrderId.get(orderId);
        };
        const workLineCounts = new Map();
        workOrders.forEach((order) => asArray(order?.lines).forEach((line) => {
            const key = `${text(order?.id)}|${text(line?.id)}`;
            workLineCounts.set(key, (workLineCounts.get(key) || 0) + 1);
        }));

        const debts = [];
        stableSort(workOrders, (order, index) => `${text(order?.id)}|${text(order?.workOrderCode)}|${index}`)
            .forEach((order) => stableSort(asArray(order?.lines), (line, index) =>
                `${text(line?.id)}|${code(line?.componentCode)}|${index}`
            ).forEach((line) => {
                const targetQty = Number(line?.targetQty);
                if (!isPositiveQty(targetQty)) return;
                const workOrderId = text(order?.id);
                const lineId = text(line?.id);
                const reasonCodes = [];
                const prc = resolveExactPrc(prcIndex, line?.componentCode, line?.componentId || line?.refId);
                const lineUnit = code(line?.unit || prc?.unit);
                if (!workOrderId || !lineId) reasonCodes.push('DEBT_WO_LINE_IDENTITY_MISSING');
                else if (workLineCounts.get(`${workOrderId}|${lineId}`) !== 1) {
                    reasonCodes.push('DEBT_WO_LINE_IDENTITY_DUPLICATE');
                }
                if (!prc.ok) reasonCodes.push(prc.reasonCode);
                else if (!lineUnit || lineUnit !== prc.unit) reasonCodes.push('DEBT_UNIT_MISMATCH');

                const demandResolution = resolveWorkOrderDemand({ order, demands, demandIdCounts });
                if (!demandResolution.ok) reasonCodes.push(demandResolution.reasonCode);
                const demand = demandResolution.demand;
                const originItemKey = text(order?.sourceItemKey);
                const sourceContractActive = sourceContractDemandIds.has(text(demand?.id));
                const sourceBucket = sourceContractActive
                    ? SOURCE_BUCKETS.PRODUCTION
                    : 'LEGACY_SHARED';
                const productionSourceMatches = sourceContractActive && demand && prc.ok
                    ? sourceEntitlements.filter((entry) =>
                        entry.sourceBucket === SOURCE_BUCKETS.PRODUCTION
                        && entry.demandId === text(demand?.id)
                        && entry.originItemKey === originItemKey
                        && entry.prcId === prc.prcId
                        && entry.prcCode === prc.prcCode
                        && entry.unit === prc.unit
                    )
                    : [];
                const productionSource = productionSourceMatches.length === 1
                    ? productionSourceMatches[0]
                    : null;
                if (sourceContractActive && demand && prc.ok && productionSourceMatches.length !== 1) {
                    reasonCodes.push(productionSourceMatches.length > 1
                        ? 'PLANNING_PRODUCTION_SOURCE_DUPLICATE'
                        : 'PLANNING_PRODUCTION_SOURCE_MISSING');
                } else if (productionSource && !productionSource.allocatable) {
                    reasonCodes.push(...productionSource.reasonCodes);
                } else if (productionSource && !sameQty(productionSource.plannedQty, targetQty)) {
                    reasonCodes.push('PLANNING_PRODUCTION_QTY_CONFLICT');
                }
                const debtType = normalizeDebtType(demand?.sourceType);
                if (demand && !debtType) reasonCodes.push('PLN_SOURCE_TYPE_INVALID');
                if (demand && code(demand?.status) !== 'RELEASED') reasonCodes.push('PLN_NOT_RELEASED');
                const releaseEvidence = getDateEvidence(demand?.released_at);
                if (demand && !releaseEvidence.ok) reasonCodes.push('PLN_RELEASE_DATE_MISSING');

                let originOrder = null;
                let originOrderLine = null;
                let dueDate = '';
                let dueTimestamp = null;
                let productionReadyAt = releaseEvidence.ok ? releaseEvidence.iso : '';
                let productionReadyTimestamp = releaseEvidence.timestamp;
                let sorKey = '';
                let manualOrder = null;
                let manualOrderUpdatedAt = '';
                let manualOrderUpdatedBy = '';
                if (debtType === 'SALES') {
                    const matchingOrders = orders.filter((row) => text(row?.id) === text(demand?.sourceOrderId));
                    if (matchingOrders.length !== 1 || orderIdCounts.get(text(demand?.sourceOrderId)) !== 1) {
                        reasonCodes.push(matchingOrders.length > 1 ? 'SOR_ID_DUPLICATE' : 'SOR_NOT_FOUND');
                    } else {
                        originOrder = matchingOrders[0];
                        if (text(demand?.sourceOrderNo)
                            && text(demand.sourceOrderNo) !== text(originOrder?.orderNo)) {
                            reasonCodes.push('PLN_SOR_NUMBER_CONFLICT');
                        }
                        const matchingLines = asArray(originOrder?.lines)
                            .filter((row) => text(row?.id) === text(demand?.sourceLineId));
                        if (matchingLines.length !== 1) {
                            reasonCodes.push(matchingLines.length > 1 ? 'SOR_LINE_DUPLICATE' : 'SOR_LINE_NOT_FOUND');
                        } else {
                            originOrderLine = matchingLines[0];
                        }
                        const readiness = getReadiness(originOrder);
                        if (!readiness.ok) reasonCodes.push(...readiness.reasonCodes);
                        if (readiness.releasedByLine.get(text(demand?.sourceLineId)) !== demand) {
                            reasonCodes.push('SOR_DEBT_PLN_CONFLICT');
                        }
                        dueDate = readiness.dueDate;
                        dueTimestamp = readiness.dueTimestamp;
                        productionReadyAt = readiness.productionReadyAt;
                        productionReadyTimestamp = readiness.productionReadyTimestamp;
                        sorKey = readiness.sorKey;
                        const productionQueue = resolveProductionQueue(originOrder);
                        if (!productionQueue.ok) reasonCodes.push(productionQueue.reasonCode);
                        manualOrder = productionQueue.manualOrder;
                        manualOrderUpdatedAt = productionQueue.updatedAt;
                        manualOrderUpdatedBy = productionQueue.updatedBy;
                    }
                } else if (debtType === 'STOCK') {
                    const stockDue = getDateEvidence(demand?.dueDate);
                    dueDate = stockDue.ok ? stockDue.raw : '';
                    dueTimestamp = stockDue.timestamp;
                    sorKey = `${text(demand?.demandCode)}|${text(demand?.id)}`;
                }

                const debtKey = [
                    'DEBT',
                    debtType || 'UNCERTAIN',
                    sourceBucket,
                    text(demand?.id),
                    originItemKey,
                    workOrderId,
                    lineId,
                    prc?.prcId || '',
                    prc?.prcCode || code(line?.componentCode),
                    lineUnit
                ].join('|');
                const debt = {
                    debtKey,
                    debtType: debtType || 'UNCERTAIN',
                    sourceBucket,
                    sourceEntitlementKey: text(productionSource?.entitlementKey),
                    prcId: prc?.prcId || '',
                    prcCode: prc?.prcCode || code(line?.componentCode),
                    unit: prc?.unit || lineUnit,
                    targetQty: roundQty(targetQty),
                    plannedSourceQty: sourceContractActive ? productionSource?.plannedQty ?? null : null,
                    dispatchedQty: debtType === 'STOCK' ? 0 : null,
                    openDebtQty: debtType === 'STOCK' ? roundQty(targetQty) : null,
                    allocationEligible: false,
                    reasonCodes: [],
                    dueDate,
                    productionReadyAt,
                    originWorkOrderId: workOrderId,
                    originWorkOrderCode: text(order?.workOrderCode),
                    originWorkOrderLineId: lineId,
                    originDemandId: text(demand?.id),
                    originDemandCode: text(demand?.demandCode),
                    originItemKey,
                    originOrderId: text(originOrder?.id || demand?.sourceOrderId),
                    originOrderNo: text(originOrder?.orderNo || demand?.sourceOrderNo),
                    originOrderLineId: text(originOrderLine?.id || demand?.sourceLineId),
                    originStockDemandId: debtType === 'STOCK' ? text(demand?.id) : '',
                    sorKey,
                    manualOrder,
                    manualOrderUpdatedAt,
                    manualOrderUpdatedBy,
                    dueTimestamp,
                    productionReadyTimestamp,
                    dispatchEvidenceIds: []
                };

                if (debtType === 'SALES' && originOrder && originOrderLine && prc.ok) {
                    const dispatch = resolveDispatchedQty({
                        debt,
                        order: originOrder,
                        orderLine: originOrderLine,
                        prc,
                        salesShipments,
                        shipmentIdCounts,
                        shipmentKeyCounts,
                        completionTransfers,
                        completionTransferIdCounts
                    });
                    if (!dispatch.ok) reasonCodes.push(dispatch.reasonCode);
                    else {
                        debt.dispatchedQty = dispatch.dispatchedQty;
                        debt.openDebtQty = roundQty(Math.max(0, targetQty - dispatch.dispatchedQty));
                    }
                    debt.dispatchEvidenceIds = dispatch.evidenceIds;
                }
                debt.reasonCodes = Array.from(new Set(reasonCodes)).sort(compareText);
                debt.allocationEligible = debt.reasonCodes.length === 0
                    && Number.isFinite(debt.openDebtQty);
                debts.push(debt);
            }));

        const productionDebtCountByEntitlement = new Map();
        debts.forEach((debt) => {
            if (debt.sourceBucket !== SOURCE_BUCKETS.PRODUCTION || !debt.sourceEntitlementKey) return;
            productionDebtCountByEntitlement.set(
                debt.sourceEntitlementKey,
                (productionDebtCountByEntitlement.get(debt.sourceEntitlementKey) || 0) + 1
            );
        });
        debts.forEach((debt) => {
            if (!debt.sourceEntitlementKey
                || productionDebtCountByEntitlement.get(debt.sourceEntitlementKey) <= 1) return;
            debt.reasonCodes = Array.from(new Set([
                ...debt.reasonCodes,
                'PLANNING_PRODUCTION_WO_DUPLICATE'
            ])).sort(compareText);
            debt.allocationEligible = false;
        });

        const createSourceDebt = (entitlement) => {
            const matchingDemands = demands.filter((demand) => text(demand?.id) === entitlement.demandId);
            const demand = matchingDemands.length === 1 ? matchingDemands[0] : null;
            const debtType = normalizeDebtType(demand?.sourceType);
            const reasonCodes = [...entitlement.reasonCodes];
            if (!demand || demandIdCounts.get(entitlement.demandId) !== 1) {
                reasonCodes.push(matchingDemands.length > 1 ? 'PLN_ID_DUPLICATE' : 'WO_PLN_LINK_MISSING');
            }
            if (demand && !debtType) reasonCodes.push('PLN_SOURCE_TYPE_INVALID');
            if (demand && code(demand?.status) !== 'RELEASED') reasonCodes.push('PLN_NOT_RELEASED');
            const releaseEvidence = getDateEvidence(demand?.released_at);
            if (demand && !releaseEvidence.ok) reasonCodes.push('PLN_RELEASE_DATE_MISSING');

            let originOrder = null;
            let originOrderLine = null;
            let dueDate = '';
            let dueTimestamp = null;
            let productionReadyAt = releaseEvidence.ok ? releaseEvidence.iso : '';
            let productionReadyTimestamp = releaseEvidence.timestamp;
            let sorKey = `${text(demand?.demandCode)}|${entitlement.demandId}`;
            let manualOrder = null;
            let manualOrderUpdatedAt = '';
            let manualOrderUpdatedBy = '';
            if (debtType === 'SALES') {
                const matchingOrders = orders.filter((order) =>
                    text(order?.id) === text(demand?.sourceOrderId)
                );
                if (matchingOrders.length !== 1
                    || orderIdCounts.get(text(demand?.sourceOrderId)) !== 1) {
                    reasonCodes.push(matchingOrders.length > 1 ? 'SOR_ID_DUPLICATE' : 'SOR_NOT_FOUND');
                } else {
                    originOrder = matchingOrders[0];
                    const matchingLines = asArray(originOrder?.lines).filter((line) =>
                        text(line?.id) === text(demand?.sourceLineId)
                    );
                    if (matchingLines.length !== 1) {
                        reasonCodes.push(matchingLines.length > 1 ? 'SOR_LINE_DUPLICATE' : 'SOR_LINE_NOT_FOUND');
                    } else {
                        originOrderLine = matchingLines[0];
                    }
                    const readiness = getReadiness(originOrder);
                    if (!readiness.ok) reasonCodes.push(...readiness.reasonCodes);
                    dueDate = readiness.dueDate;
                    dueTimestamp = readiness.dueTimestamp;
                    productionReadyAt = readiness.productionReadyAt;
                    productionReadyTimestamp = readiness.productionReadyTimestamp;
                    sorKey = readiness.sorKey;
                    const productionQueue = resolveProductionQueue(originOrder);
                    if (!productionQueue.ok) reasonCodes.push(productionQueue.reasonCode);
                    manualOrder = productionQueue.manualOrder;
                    manualOrderUpdatedAt = productionQueue.updatedAt;
                    manualOrderUpdatedBy = productionQueue.updatedBy;
                }
            } else {
                const stockDue = getDateEvidence(demand?.dueDate);
                dueDate = stockDue.ok ? stockDue.raw : '';
                dueTimestamp = stockDue.timestamp;
            }

            if (entitlement.sourceBucket === SOURCE_BUCKETS.SEMI) {
                reasonCodes.push('SEMI_EXACT_PHYSICAL_EVIDENCE_MISSING');
            }
            if (entitlement.sourceBucket === SOURCE_BUCKETS.PRODUCTION) {
                reasonCodes.push('PRODUCTION_WORK_ORDER_MISSING');
            }
            const normalizedReasons = Array.from(new Set(reasonCodes)).sort(compareText);
            return {
                debtKey: [
                    'DEBT',
                    debtType || 'UNCERTAIN',
                    entitlement.sourceBucket,
                    entitlement.demandId,
                    entitlement.originItemKey,
                    entitlement.prcId,
                    entitlement.prcCode,
                    entitlement.unit,
                    entitlement.entitlementKey
                ].join('|'),
                debtType: debtType || 'UNCERTAIN',
                sourceBucket: entitlement.sourceBucket,
                sourceEntitlementKey: entitlement.entitlementKey,
                prcId: entitlement.prcId,
                prcCode: entitlement.prcCode,
                unit: entitlement.unit,
                targetQty: entitlement.plannedQty,
                plannedSourceQty: entitlement.plannedQty,
                dispatchedQty: 0,
                openDebtQty: entitlement.plannedQty,
                allocationEligible: normalizedReasons.length === 0
                    && entitlement.sourceBucket === SOURCE_BUCKETS.STOCK
                    && entitlement.plannedQty > EPSILON,
                reasonCodes: normalizedReasons,
                dueDate,
                productionReadyAt,
                originWorkOrderId: '',
                originWorkOrderCode: '',
                originWorkOrderLineId: '',
                originDemandId: entitlement.demandId,
                originDemandCode: entitlement.demandCode,
                originItemKey: entitlement.originItemKey,
                originOrderId: text(originOrder?.id || demand?.sourceOrderId),
                originOrderNo: text(originOrder?.orderNo || demand?.sourceOrderNo),
                originOrderLineId: text(originOrderLine?.id || demand?.sourceLineId),
                originStockDemandId: debtType === 'STOCK' ? entitlement.demandId : '',
                sorKey,
                manualOrder,
                manualOrderUpdatedAt,
                manualOrderUpdatedBy,
                dueTimestamp,
                productionReadyTimestamp,
                dispatchEvidenceIds: []
            };
        };

        sourceEntitlements.forEach((entitlement) => {
            if (entitlement.sourceBucket === SOURCE_BUCKETS.PRODUCTION
                && productionDebtCountByEntitlement.get(entitlement.entitlementKey)) return;
            debts.push(createSourceDebt(entitlement));
        });

        const debtKeyCounts = new Map();
        debts.forEach((debt) => debtKeyCounts.set(debt.debtKey, (debtKeyCounts.get(debt.debtKey) || 0) + 1));
        debts.forEach((debt) => {
            if (debtKeyCounts.get(debt.debtKey) !== 1) {
                debt.reasonCodes = Array.from(new Set([...debt.reasonCodes, 'DEBT_KEY_DUPLICATE'])).sort(compareText);
                debt.allocationEligible = false;
            }
        });

        const manualOrderOwners = new Map();
        debts
            .filter((debt) => debt.debtType === 'SALES'
                && debt.allocationEligible
                && Number(debt.openDebtQty) > EPSILON
                && Number.isSafeInteger(debt.manualOrder))
            .forEach((debt) => {
                if (!manualOrderOwners.has(debt.manualOrder)) manualOrderOwners.set(debt.manualOrder, new Set());
                manualOrderOwners.get(debt.manualOrder).add(debt.originOrderId);
            });
        const duplicateManualOrders = new Set(Array.from(manualOrderOwners.entries())
            .filter(([, orderIds]) => orderIds.size > 1)
            .map(([manualOrder]) => manualOrder));
        if (duplicateManualOrders.size) {
            debts.forEach((debt) => {
                if (debt.debtType !== 'SALES'
                    || !duplicateManualOrders.has(debt.manualOrder)
                    || Number(debt.openDebtQty) <= EPSILON) return;
                debt.reasonCodes = Array.from(new Set([
                    ...debt.reasonCodes,
                    'SOR_MANUAL_ORDER_DUPLICATE'
                ])).sort(compareText);
                debt.allocationEligible = false;
            });
        }

        const compareDebts = (left, right) => {
            const leftType = left.debtType === 'SALES' ? 0 : left.debtType === 'STOCK' ? 1 : 2;
            const rightType = right.debtType === 'SALES' ? 0 : right.debtType === 'STOCK' ? 1 : 2;
            if (leftType !== rightType) return leftType - rightType;
            if (leftType === 0 && rightType === 0) {
                const leftHasManualOrder = Number.isSafeInteger(left.manualOrder);
                const rightHasManualOrder = Number.isSafeInteger(right.manualOrder);
                if (leftHasManualOrder !== rightHasManualOrder) return leftHasManualOrder ? -1 : 1;
                if (leftHasManualOrder && left.manualOrder !== right.manualOrder) {
                    return left.manualOrder - right.manualOrder;
                }
            }
            const leftDue = Number.isFinite(left.dueTimestamp) ? left.dueTimestamp : Number.MAX_SAFE_INTEGER;
            const rightDue = Number.isFinite(right.dueTimestamp) ? right.dueTimestamp : Number.MAX_SAFE_INTEGER;
            if (leftDue !== rightDue) return leftDue - rightDue;
            const leftReady = Number.isFinite(left.productionReadyTimestamp)
                ? left.productionReadyTimestamp
                : Number.MAX_SAFE_INTEGER;
            const rightReady = Number.isFinite(right.productionReadyTimestamp)
                ? right.productionReadyTimestamp
                : Number.MAX_SAFE_INTEGER;
            return leftReady - rightReady
                || compareText(left.sorKey, right.sorKey)
                || compareText(left.debtKey, right.debtKey);
        };
        const orderedDebts = debts.slice().sort(compareDebts);

        const constraints = input.virtualAllocationConstraints || input.allocationConstraints || {};
        const reservedSegmentKeys = new Set(asArray(constraints?.reservedSegmentKeys).map(text).filter(Boolean));
        const lockedSegmentKeys = new Set(asArray(constraints?.lockedSegmentKeys).map(text).filter(Boolean));
        const segmentKeyCounts = new Map();
        segments.forEach((segment) => {
            segmentKeyCounts.set(segment.segmentKey, (segmentKeyCounts.get(segment.segmentKey) || 0) + 1);
        });
        const holdLedger = buildExactHoldLedger({
            input,
            segments,
            exactHolds,
            lifecycleReservations
        });
        segments.forEach((segment) => {
            if (holdLedger.invalidSegmentKeys.has(segment.segmentKey)) {
                Object.assign(segment, {
                    allocationState: PHYSICAL_ALLOCATION_STATES.UNCERTAIN,
                    allocationStateReasonCode: holdLedger.instructionInvalidSegmentKeys.has(segment.segmentKey)
                        ? 'INSTRUCTION_FAIL_CLOSED'
                        : 'EXACT_HOLD_PROOF_INVALID',
                    reallocatable: false,
                    reallocatableQty: 0,
                    allocatable: false,
                    allocatableQty: 0
                });
            } else if (reservedSegmentKeys.has(segment.segmentKey)) {
                Object.assign(segment, {
                    allocationState: PHYSICAL_ALLOCATION_STATES.RESERVED,
                    allocationStateReasonCode: 'WHOLE_SEGMENT_RESERVED',
                    reallocatable: false,
                    reallocatableQty: 0
                });
            } else if (lockedSegmentKeys.has(segment.segmentKey)) {
                Object.assign(segment, {
                    allocationState: PHYSICAL_ALLOCATION_STATES.LOCKED,
                    allocationStateReasonCode: 'WHOLE_SEGMENT_LOCKED',
                    reallocatable: false,
                    reallocatableQty: 0
                });
            }
        });
        const matchesLifecycleTarget = (segment, debt) => {
            if (segment?.allocatableToOthers !== false) return true;
            const sourceType = code(segment?.sourceType);
            const expectedDebtType = sourceType === 'SALES_ORDER' ? 'SALES' : sourceType === 'STOCK' ? 'STOCK' : '';
            if (!expectedDebtType || debt?.debtType !== expectedDebtType) return false;
            if (text(segment?.demandId) !== text(debt?.originDemandId)
                || segment?.prcId !== debt?.prcId
                || segment?.prcCode !== debt?.prcCode
                || segment?.unit !== debt?.unit) return false;
            if (expectedDebtType === 'SALES') {
                return text(segment?.sourceOrderId) === text(debt?.originOrderId)
                    && text(segment?.sourceLineId) === text(debt?.originOrderLineId);
            }
            return true;
        };
        const resolvedLifecycleDebtBySegment = new Map();
        const unresolvedLifecycleSegmentKeys = [];
        segments.filter((segment) => segment?.allocatableToOthers === false).forEach((segment) => {
            const matches = debts.filter((debt) => debt.allocationEligible && matchesLifecycleTarget(segment, debt));
            if (matches.length === 1) {
                resolvedLifecycleDebtBySegment.set(segment.segmentKey, matches[0].debtKey);
            } else {
                unresolvedLifecycleSegmentKeys.push(segment.segmentKey);
            }
        });
        const matchesExactTechnicalIdentity = (segment, debt) =>
            segment?.prcId === debt?.prcId
            && segment?.prcCode === debt?.prcCode
            && segment?.unit === debt?.unit;
        const segmentCanServeDebt = (segment, debt) => {
            if (!matchesExactTechnicalIdentity(segment, debt)) return false;
            const lockedDebtKey = resolvedLifecycleDebtBySegment.get(segment?.segmentKey);
            if (lockedDebtKey) return lockedDebtKey === debt?.debtKey;
            return segment?.allocationState === PHYSICAL_ALLOCATION_STATES.REALLOCATABLE
                && segment?.reallocatable === true
                && isPositiveQty(segment?.reallocatableQty);
        };
        const availableSegments = segments
            .filter((segment) => isPositiveQty(segment.allocatableQty)
                && segmentKeyCounts.get(segment.segmentKey) === 1
                && !reservedSegmentKeys.has(segment.segmentKey)
                && !lockedSegmentKeys.has(segment.segmentKey)
                && !holdLedger.invalidSegmentKeys.has(segment.segmentKey)
                && (segment.allocationState === PHYSICAL_ALLOCATION_STATES.REALLOCATABLE
                    || resolvedLifecycleDebtBySegment.has(segment.segmentKey)))
            .slice()
            .sort((left, right) =>
                (STAGE_ORDER.get(right.stage) || 0) - (STAGE_ORDER.get(left.stage) || 0)
                || Number(right.routeSeq || 0) - Number(left.routeSeq || 0)
                || compareText(left.segmentKey, right.segmentKey)
            );

        const allocations = [];
        const debtRemainders = new Map(orderedDebts.map((debt) => [
            debt.debtKey,
            Number.isFinite(debt.openDebtQty) ? debt.openDebtQty : null
        ]));
        const segmentRemainders = new Map(availableSegments.map((segment) => [
            segment.segmentKey,
            roundQty(segment.allocatableQty)
        ]));
        const heldQtyBySegment = new Map();
        const unallocatedHoldQtyBySegment = new Map();
        const fixedAllocatedHoldKeys = new Set();
        const unresolvedExactHoldKeys = [];
        const instructionDiagnostics = [];
        const addInstructionDiagnostic = (hold, reasonCode, {
            quarantinedQty = 0,
            allocatedByInstructionQty = 0,
            targetOpenQty = null
        } = {}) => {
            if (hold?.holdKind !== 'USER_INSTRUCTION_EXACT') return;
            instructionDiagnostics.push({
                instructionId: text(hold?.instructionId),
                instructionCode: code(hold?.instructionCode),
                instructionSliceKey: text(hold?.instructionSliceKey),
                physicalSegmentId: text(hold?.physicalSegmentId),
                stockRowId: text(hold?.stockRowId),
                reasonCode: code(reasonCode),
                quarantinedQty: roundQty(quarantinedQty),
                instructionQty: roundQty(hold?.instructionQty ?? hold?.qty),
                allocatedByInstructionQty: roundQty(allocatedByInstructionQty),
                targetOpenQty: targetOpenQty !== null
                    && targetOpenQty !== undefined
                    && targetOpenQty !== ''
                    && Number.isFinite(Number(targetOpenQty))
                    ? roundQty(targetOpenQty)
                    : null,
                targetDemandId: text(hold?.demandId),
                targetItemKey: text(hold?.itemKey)
            });
        };
        holdLedger.holds.forEach((hold) => {
            const segment = availableSegments.find((row) =>
                row.segmentKey === text(hold?.physicalSegmentId)
            );
            const holdQty = Number(hold?.qty || 0);
            const segmentRemaining = segment
                ? Number(segmentRemainders.get(segment.segmentKey) || 0)
                : 0;
            const expectedDebtType = code(hold?.sourceType) === 'SALES_ORDER'
                ? 'SALES'
                : code(hold?.sourceType) === 'STOCK'
                    ? 'STOCK'
                    : '';
            const matchingDebts = hold?.fixedTarget ? orderedDebts.filter((debt) =>
                debt.allocationEligible
                && debt.debtType === expectedDebtType
                && (hold?.holdKind === 'USER_INSTRUCTION_EXACT'
                    || hold?.planBoundInstructionTransfer === true
                    || debt.sourceBucket === code(hold?.sourceBucket))
                && text(debt.originDemandId) === text(hold?.demandId)
                && text(debt.originItemKey) === text(hold?.itemKey)
                && debt.prcId === text(hold?.prcId)
                && debt.prcCode === code(hold?.prcCode)
                && debt.unit === code(hold?.unit)
                && (expectedDebtType !== 'SALES'
                    || (text(debt.originOrderId) === text(hold?.sourceOrderId)
                        && text(debt.originOrderLineId) === text(hold?.sourceLineId)))
            ) : [];
            const debt = matchingDebts.length === 1 ? matchingDebts[0] : null;
            const debtRemaining = debt ? Number(debtRemainders.get(debt.debtKey) || 0) : 0;
            const segmentMatches = !!segment
                && segment.sourceKind === 'CURRENT_STOCK_ROW'
                && segment.stage === 'DEPOT_STOCK'
                && segment.stockRowId === text(hold?.stockRowId)
                && (!text(hold?.prcId) || segment.prcId === text(hold?.prcId))
                && (!code(hold?.prcCode) || segment.prcCode === code(hold?.prcCode))
                && (!code(hold?.unit) || segment.unit === code(hold?.unit));
            if (!segmentMatches
                || !isPositiveQty(holdQty)
                || segmentRemaining < holdQty - EPSILON) {
                unresolvedExactHoldKeys.push(text(hold?.holdKey));
                return;
            }
            segmentRemainders.set(segment.segmentKey, roundQty(segmentRemaining - holdQty));
            heldQtyBySegment.set(
                segment.segmentKey,
                roundQty((heldQtyBySegment.get(segment.segmentKey) || 0) + holdQty)
            );
            if (!hold?.fixedTarget) {
                unallocatedHoldQtyBySegment.set(
                    segment.segmentKey,
                    roundQty((unallocatedHoldQtyBySegment.get(segment.segmentKey) || 0) + holdQty)
                );
                return;
            }
            const exactTargetMatches = !!debt
                && matchesExactTechnicalIdentity(segment, debt)
                && text(debt.originDemandId) === text(hold?.demandId)
                && text(debt.originItemKey) === text(hold?.itemKey)
                && (expectedDebtType !== 'SALES'
                    || (text(debt.originOrderId) === text(hold?.sourceOrderId)
                        && text(debt.originOrderLineId) === text(hold?.sourceLineId)));
            if (!exactTargetMatches) {
                unresolvedExactHoldKeys.push(text(hold?.holdKey));
                addInstructionDiagnostic(hold, 'INSTRUCTION_TARGET_DEBT_UNRESOLVED', {
                    quarantinedQty: holdQty,
                    allocatedByInstructionQty: 0,
                    targetOpenQty: debt ? debtRemaining : null
                });
                const failClosedRemainder = hold?.holdKind === 'USER_INSTRUCTION_EXACT'
                    ? roundQty(segmentRemainders.get(segment.segmentKey) || 0)
                    : 0;
                if (failClosedRemainder > EPSILON) segmentRemainders.set(segment.segmentKey, 0);
                unallocatedHoldQtyBySegment.set(
                    segment.segmentKey,
                    roundQty((unallocatedHoldQtyBySegment.get(segment.segmentKey) || 0) + holdQty + failClosedRemainder)
                );
                if (hold?.holdKind === 'USER_INSTRUCTION_EXACT') {
                    segment.allocationState = PHYSICAL_ALLOCATION_STATES.UNCERTAIN;
                    segment.allocationStateReasonCode = 'INSTRUCTION_FAIL_CLOSED';
                    segment.reallocatable = false;
                    segment.reallocatableQty = 0;
                    segment.allocatable = false;
                    segment.allocatableQty = 0;
                }
                return;
            }
            const allocatedHoldQty = roundQty(Math.min(holdQty, Math.max(0, debtRemaining)));
            const quarantinedHoldQty = roundQty(Math.max(0, holdQty - allocatedHoldQty));
            if (quarantinedHoldQty > EPSILON) {
                unresolvedExactHoldKeys.push(text(hold?.holdKey));
                addInstructionDiagnostic(hold, 'INSTRUCTION_QTY_EXCEEDS_TARGET_OPEN_QTY', {
                    quarantinedQty: quarantinedHoldQty,
                    allocatedByInstructionQty: allocatedHoldQty,
                    targetOpenQty: debtRemaining
                });
                unallocatedHoldQtyBySegment.set(
                    segment.segmentKey,
                    roundQty((unallocatedHoldQtyBySegment.get(segment.segmentKey) || 0) + quarantinedHoldQty)
                );
            } else {
                fixedAllocatedHoldKeys.add(hold.holdKey);
            }
            if (allocatedHoldQty <= EPSILON) return;
            debtRemainders.set(debt.debtKey, roundQty(debtRemaining - allocatedHoldQty));
            allocations.push({
                physicalSegmentId: segment.segmentKey,
                targetDebtKey: debt.debtKey,
                qty: allocatedHoldQty,
                allocatedQty: allocatedHoldQty,
                allocatableQty: allocatedHoldQty,
                allocatable: true,
                reasonCode: '',
                sourceBucket: debt.sourceBucket,
                targetSourceBucket: debt.sourceBucket,
                physicalSourceBucket: segment.sourceKind === 'WORK_ORDER'
                    || segment.productionOriginVerified === true
                    ? SOURCE_BUCKETS.PRODUCTION
                    : SOURCE_BUCKETS.STOCK,
                demandId: text(segment.originDemandId) || debt.originDemandId,
                originItemKey: text(segment.originItemKey) || debt.originItemKey,
                prcId: debt.prcId,
                prcCode: debt.prcCode,
                unit: debt.unit,
                stage: segment.stage,
                originWorkOrderId: text(segment.originWorkOrderId),
                originDemandId: text(segment.originDemandId),
                physicalOriginItemKey: text(segment.originItemKey),
                physicalOrigin: segment.physicalOrigin || null,
                physicalOriginAudit: buildAllocationInstructionOriginAudit(segment),
                targetDemandId: debt.originDemandId,
                targetItemKey: debt.originItemKey,
                targetOrderId: debt.originOrderId,
                targetOrderLineId: debt.originOrderLineId,
                stockRowId: text(segment.stockRowId),
                fixedByExactHold: true,
                physicalAllocationState: hold.holdState,
                holdKind: hold.holdKind,
                exactHoldKey: text(hold?.holdKey),
                shipmentId: text(hold?.shipmentId),
                reservationKey: text(hold?.reservationKey),
                instructionId: text(hold?.instructionId),
                instructionCode: code(hold?.instructionCode),
                instructionSliceKey: text(hold?.instructionSliceKey),
                instructionSegmentOffsetStart: Number.isFinite(Number(hold?.segmentOffsetStart))
                    ? roundQty(hold.segmentOffsetStart)
                    : null,
                instructionSegmentOffsetEnd: Number.isFinite(Number(hold?.segmentOffsetEnd))
                    ? roundQty(hold.segmentOffsetEnd)
                    : null,
                allocatedByInstructionQty: hold?.holdKind === 'USER_INSTRUCTION_EXACT'
                    ? allocatedHoldQty
                    : 0
            });
        });

        orderedDebts.filter((debt) => debt.allocationEligible && debt.openDebtQty > EPSILON)
            .forEach((debt) => {
                let debtRemaining = debtRemainders.get(debt.debtKey);
                for (const segment of availableSegments) {
                    if (debtRemaining <= EPSILON) break;
                    if (!segmentCanServeDebt(segment, debt)) continue;
                    const lockedDebtKey = resolvedLifecycleDebtBySegment.get(segment.segmentKey);
                    if (lockedDebtKey && lockedDebtKey !== debt.debtKey) continue;
                    const segmentRemaining = segmentRemainders.get(segment.segmentKey) || 0;
                    if (segmentRemaining <= EPSILON) continue;
                    const qty = roundQty(Math.min(debtRemaining, segmentRemaining));
                    if (qty <= EPSILON) continue;
                    segmentRemainders.set(segment.segmentKey, roundQty(segmentRemaining - qty));
                    debtRemaining = roundQty(debtRemaining - qty);
                    allocations.push({
                        physicalSegmentId: segment.segmentKey,
                        targetDebtKey: debt.debtKey,
                        qty,
                        allocatedQty: qty,
                        allocatableQty: qty,
                        allocatable: true,
                        reasonCode: '',
                        sourceBucket: debt.sourceBucket,
                        targetSourceBucket: debt.sourceBucket,
                        physicalSourceBucket: segment.sourceKind === 'WORK_ORDER'
                            || segment.productionOriginVerified === true
                            ? SOURCE_BUCKETS.PRODUCTION
                            : SOURCE_BUCKETS.STOCK,
                        demandId: text(segment.originDemandId) || debt.originDemandId,
                        originItemKey: text(segment.originItemKey) || debt.originItemKey,
                        prcId: debt.prcId,
                        prcCode: debt.prcCode,
                        unit: debt.unit,
                        stage: segment.stage,
                        originWorkOrderId: text(segment.originWorkOrderId),
                        originDemandId: text(segment.originDemandId),
                        physicalOriginItemKey: text(segment.originItemKey),
                        physicalOrigin: segment.physicalOrigin || null,
                        physicalOriginAudit: {
                            sourceKind: text(segment.sourceKind),
                            originOrderId: text(segment.originOrderId),
                            originOrderLineId: text(segment.originOrderLineId),
                            originDemandId: text(segment.originDemandId),
                            originItemKey: text(segment.originItemKey),
                            originWorkOrderId: text(segment.originWorkOrderId),
                            originWorkOrderLineId: text(segment.originWorkOrderLineId),
                            evidenceIds: asArray(segment.evidenceIds).slice()
                        },
                        targetDemandId: debt.originDemandId,
                        targetItemKey: debt.originItemKey,
                        fixedByExactHold: false,
                        physicalAllocationState: segment.allocationState
                    });
                }
                debtRemainders.set(debt.debtKey, debtRemaining);
            });

        availableSegments.forEach((segment) => {
            const heldQty = roundQty(heldQtyBySegment.get(segment.segmentKey) || 0);
            const sharedPoolQty = roundQty(Math.max(0, Number(segment.allocatableQty || 0) - heldQty));
            const segmentHolds = holdLedger.holds.filter((hold) =>
                hold.physicalSegmentId === segment.segmentKey
            );
            Object.assign(segment, {
                heldQty,
                sharedPoolQty,
                reallocatableQty: segment.allocationState === PHYSICAL_ALLOCATION_STATES.REALLOCATABLE
                    ? sharedPoolQty
                    : 0,
                remainingAllocatableQty: roundQty(segmentRemainders.get(segment.segmentKey) || 0)
            });
            if (heldQty > EPSILON && sharedPoolQty <= EPSILON
                && segment.allocationState === PHYSICAL_ALLOCATION_STATES.REALLOCATABLE) {
                const hasLockedHold = segmentHolds.some((hold) =>
                    hold.holdState === PHYSICAL_ALLOCATION_STATES.LOCKED
                );
                segment.allocationState = hasLockedHold
                    ? PHYSICAL_ALLOCATION_STATES.LOCKED
                    : PHYSICAL_ALLOCATION_STATES.RESERVED;
                segment.allocationStateReasonCode = hasLockedHold
                    ? 'EXACT_LIFECYCLE_HOLD'
                    : 'EXACT_RESERVATION_HOLD';
                segment.reallocatable = false;
            }
        });

        const uncoveredDebts = orderedDebts
            .filter((debt) => !debt.allocationEligible
                ? debt.openDebtQty === null || debt.openDebtQty > EPSILON
                : (debtRemainders.get(debt.debtKey) || 0) > EPSILON)
            .map((debt) => ({
                debtKey: debt.debtKey,
                qty: debt.allocationEligible ? roundQty(debtRemainders.get(debt.debtKey) || 0) : debt.openDebtQty,
                status: debt.allocationEligible ? 'UNCOVERED' : 'UNCERTAIN',
                reasonCode: debt.allocationEligible
                    ? debt.sourceBucket === SOURCE_BUCKETS.PRODUCTION
                        ? 'PRODUCTION_EXACT_STOCK_NOT_AVAILABLE'
                        : debt.sourceBucket === SOURCE_BUCKETS.STOCK
                            ? 'STOCK_EXACT_QTY_NOT_AVAILABLE'
                            : debt.sourceBucket === SOURCE_BUCKETS.SEMI
                                ? 'SEMI_EXACT_PHYSICAL_EVIDENCE_MISSING'
                                : 'INSUFFICIENT_PHYSICAL_QTY'
                    : debt.reasonCodes[0] || 'COMMERCIAL_LINK_UNCERTAIN'
            }));

        const allocationBySegment = new Map();
        const allocationByDebt = new Map();
        const operationalAllocationByDebt = new Map();
        allocations.forEach((allocation) => {
            allocationBySegment.set(
                allocation.physicalSegmentId,
                roundQty((allocationBySegment.get(allocation.physicalSegmentId) || 0) + allocation.qty)
            );
            allocationByDebt.set(
                allocation.targetDebtKey,
                roundQty((allocationByDebt.get(allocation.targetDebtKey) || 0) + allocation.qty)
            );
            const segment = segments.find((row) => row.segmentKey === allocation.physicalSegmentId);
            const debt = debts.find((row) => row.debtKey === allocation.targetDebtKey);
            const segmentDemandId = text(segment?.originDemandId || segment?.demandId);
            const segmentItemKey = text(segment?.originItemKey || segment?.itemKey);
            const sourceBoundToTarget = !!segment && !!debt
                && (!segmentDemandId || segmentDemandId === text(debt.originDemandId))
                && (!segmentItemKey || segmentItemKey === text(debt.originItemKey));
            const operationallyBound = allocation.fixedByExactHold === true
                || resolvedLifecycleDebtBySegment.get(allocation.physicalSegmentId) === allocation.targetDebtKey
                || sourceBoundToTarget;
            if (operationallyBound) {
                operationalAllocationByDebt.set(
                    allocation.targetDebtKey,
                    roundQty((operationalAllocationByDebt.get(allocation.targetDebtKey) || 0) + allocation.qty)
                );
            }
        });
        const segmentAllocationWithinQty = availableSegments.every((segment) =>
            (allocationBySegment.get(segment.segmentKey) || 0) <= segment.allocatableQty + EPSILON
        );
        const debtAllocationWithinOpenDebt = debts.every((debt) =>
            debt.openDebtQty === null
            || (allocationByDebt.get(debt.debtKey) || 0) <= debt.openDebtQty + EPSILON
        );
        const sourceAllocationWithinPlannedQty = debts.every((debt) =>
            debt.plannedSourceQty === null
            || debt.plannedSourceQty === undefined
            || (allocationByDebt.get(debt.debtKey) || 0) <= debt.plannedSourceQty + EPSILON
        );
        const segmentKeysConsumedOnce = availableSegments.every((segment) => {
            const allocatedQty = roundQty(allocationBySegment.get(segment.segmentKey) || 0);
            const heldWithoutAllocationQty = roundQty(unallocatedHoldQtyBySegment.get(segment.segmentKey) || 0);
            const remainingQty = roundQty(segmentRemainders.get(segment.segmentKey) || 0);
            const initialQty = roundQty(segment.physicalQty ?? segment.qty ?? segment.allocatableQty);
            return allocatedQty >= -EPSILON
                && heldWithoutAllocationQty >= -EPSILON
                && remainingQty >= -EPSILON
                && Math.abs(roundQty(allocatedQty + heldWithoutAllocationQty + remainingQty) - initialQty) <= EPSILON;
        });
        const exactHoldQtyWithinPhysical = Array.from(heldQtyBySegment.entries()).every(([segmentKey, qty]) => {
            const segment = segments.find((row) => row.segmentKey === segmentKey);
            return !!segment && qty <= Number(segment.physicalQty || 0) + EPSILON;
        });
        const exactHoldKeysConsumedOnce = fixedAllocatedHoldKeys.size
            + holdLedger.holds.filter((hold) => !hold.fixedTarget).length
            + unresolvedExactHoldKeys.length
            === holdLedger.holds.length;

        const remainingExecutionCommitments = executions.map((execution) => ({
            workOrderId: execution.workOrderId,
            lineId: execution.lineId,
            prcId: execution.prcId,
            prcCode: execution.prcCode,
            unit: execution.unit,
            targetQty: execution.targetQty,
            firstRouteTakenQty: execution.firstRouteCumulativeTake,
            unstartedExecutionQty: execution.unstartedExecutionQty,
            status: execution.status,
            reasonCode: execution.reasonCode
        }));
        const uncoveredByDebt = new Map(uncoveredDebts.map((entry) => [entry.debtKey, entry]));
        const allocatedByEntitlement = new Map();
        debts.forEach((debt) => {
            if (!debt.sourceEntitlementKey) return;
            allocatedByEntitlement.set(
                debt.sourceEntitlementKey,
                roundQty((allocatedByEntitlement.get(debt.sourceEntitlementKey) || 0)
                    + (operationalAllocationByDebt.get(debt.debtKey) || 0))
            );
        });
        const publicSourceEntitlements = sourceEntitlements.map((entitlement) => {
            const relatedDebts = debts.filter((debt) =>
                debt.sourceEntitlementKey === entitlement.entitlementKey
            );
            const allocatedQty = roundQty(allocatedByEntitlement.get(entitlement.entitlementKey) || 0);
            const reasonCodes = Array.from(new Set([
                ...entitlement.reasonCodes,
                ...relatedDebts.flatMap((debt) => debt.reasonCodes),
                ...relatedDebts
                    .map((debt) => uncoveredByDebt.get(debt.debtKey)?.reasonCode)
                    .filter(Boolean)
            ])).sort(compareText);
            return {
                ...entitlement,
                allocatedQty,
                allocatableQty: allocatedQty,
                allocatable: entitlement.allocatable && allocatedQty > EPSILON,
                reasonCode: allocatedQty > EPSILON ? '' : reasonCodes[0] || 'SOURCE_NOT_ALLOCATABLE',
                reasonCodes
            };
        });
        const planningRows = new Map();
        publicSourceEntitlements.forEach((entitlement) => {
            if (!planningRows.has(entitlement.planningRowKey)) {
                planningRows.set(entitlement.planningRowKey, []);
            }
            planningRows.get(entitlement.planningRowKey).push(entitlement);
        });
        const componentReadiness = stableSort(Array.from(planningRows.entries()), ([key]) => key)
            .map(([planningRowKey, entries]) => {
                const first = entries[0];
                const allocatedQty = roundQty(entries.reduce((sum, entry) =>
                    sum + Number(entry.allocatedQty || 0), 0));
                const requiredQty = first.requiredQty;
                const itemQty = first.itemQty;
                const exactQuantities = isPositiveQty(requiredQty) && isPositiveQty(itemQty);
                const allocatableQty = exactQuantities
                    ? roundQty(Math.min(itemQty, itemQty * Math.min(allocatedQty, requiredQty) / requiredQty))
                    : 0;
                const reasonCodes = Array.from(new Set(entries.flatMap((entry) => entry.reasonCodes)))
                    .sort(compareText);
                if (!exactQuantities) reasonCodes.push('PLANNING_REQUIRED_QTY_MISSING');
                if (allocatableQty <= EPSILON && !reasonCodes.length) {
                    reasonCodes.push('SOURCE_EXACT_PHYSICAL_QTY_NOT_AVAILABLE');
                }
                return {
                    planningRowKey,
                    demandId: first.demandId,
                    originItemKey: first.originItemKey,
                    prcId: first.prcId,
                    prcCode: first.prcCode,
                    unit: first.unit,
                    sourceBuckets: entries.map((entry) => entry.sourceBucket).sort(compareText),
                    requiredQty,
                    itemQty,
                    allocatedQty,
                    allocatableQty,
                    allocatable: allocatableQty > EPSILON,
                    reasonCode: allocatableQty > EPSILON ? '' : reasonCodes[0] || '',
                    reasonCodes
                };
            });
        const demandItemReadiness = new Map();
        componentReadiness.forEach((entry) => {
            const key = `${entry.demandId}|${entry.originItemKey}`;
            if (!demandItemReadiness.has(key)) demandItemReadiness.set(key, []);
            demandItemReadiness.get(key).push(entry);
        });
        const readinessByDemandItem = stableSort(Array.from(demandItemReadiness.entries()), ([key]) => key)
            .map(([, components]) => {
                const first = components[0];
                const allocatableQty = roundQty(Math.min(...components.map((entry) =>
                    Number(entry.allocatableQty || 0)
                )));
                const reasonCodes = Array.from(new Set(components.flatMap((entry) => entry.reasonCodes)))
                    .sort(compareText);
                return {
                    demandId: first.demandId,
                    originItemKey: first.originItemKey,
                    allocatableQty,
                    allocatable: allocatableQty > EPSILON,
                    reasonCode: allocatableQty > EPSILON ? '' : reasonCodes[0] || 'ITEM_NOT_ALLOCATABLE',
                    reasonCodes,
                    components
                };
            });
        const publicDebts = orderedDebts.map((debt) => {
            const {
                dueTimestamp,
                productionReadyTimestamp,
                sorKey: ignoredSorKey,
                ...publicDebt
            } = debt;
            const allocatedQty = roundQty(allocationByDebt.get(debt.debtKey) || 0);
            const uncovered = uncoveredByDebt.get(debt.debtKey);
            return {
                ...publicDebt,
                allocatedQty,
                allocatableQty: allocatedQty,
                allocatable: debt.allocationEligible && allocatedQty > EPSILON,
                reasonCode: allocatedQty > EPSILON
                    ? ''
                    : uncovered?.reasonCode || debt.reasonCodes[0] || 'SOURCE_NOT_ALLOCATABLE'
            };
        });
        const exactSourceSelection = exactSourceTarget
            ? buildExactSourceSelectionReadModel({
                input,
                prcIndex,
                target: exactSourceTarget,
                debts: orderedDebts,
                segments,
                holdLedger
            })
            : null;

        return {
            debts: publicDebts,
            sourceEntitlements: publicSourceEntitlements,
            readinessByDemandItem,
            allocations,
            uncoveredDebts,
            remainingExecutionCommitments,
            ...(exactSourceSelection ? { exactSourceSelection } : {}),
            diagnostics: {
                inputCounts: {
                    orders: orders.length,
                    planningDemands: demands.length,
                    salesShipments: salesShipments.length,
                    sanalTaksimAllocationInstructions: asArray(input?.sanalTaksimAllocationInstructions).length,
                    sourceEntitlements: sourceEntitlements.length
                },
                allocationOrder: orderedDebts
                    .filter((debt) => debt.allocationEligible && debt.openDebtQty > EPSILON)
                    .map((debt) => debt.debtKey),
                evaluatedDebtOrder: orderedDebts.map((debt) => debt.debtKey),
                segmentOrder: availableSegments.map((segment) => segment.segmentKey),
                failClosedDebts: orderedDebts
                    .filter((debt) => !debt.allocationEligible)
                    .map((debt) => ({ debtKey: debt.debtKey, reasonCodes: debt.reasonCodes })),
                excludedReservedSegmentKeys: Array.from(reservedSegmentKeys).sort(compareText),
                excludedLockedSegmentKeys: Array.from(lockedSegmentKeys).sort(compareText),
                unresolvedLifecycleSegmentKeys: unresolvedLifecycleSegmentKeys.sort(compareText),
                unresolvedExactHoldKeys: unresolvedExactHoldKeys.sort(compareText),
                exactHoldLedger: {
                    valid: holdLedger.valid,
                    holdCount: holdLedger.holds.length,
                    activeInstructionCount: holdLedger.activeInstructionCount,
                    outOfScopeHoldCount: holdLedger.outOfScopeHoldCount,
                    invalidSegmentKeys: Array.from(holdLedger.invalidSegmentKeys).sort(compareText),
                    instructionInvalidSegmentKeys: Array.from(holdLedger.instructionInvalidSegmentKeys).sort(compareText),
                    instructionLineageCandidateSegmentKeys: Array.from(holdLedger.instructionLineageCandidateSegmentKeys).sort(compareText),
                    instructionDiagnostics: stableSort(instructionDiagnostics, (row, index) =>
                        `${row.reasonCode}|${row.instructionId}|${row.instructionSliceKey}|${index}`
                    ),
                    issues: holdLedger.issues
                },
                duplicateSegmentKeys: Array.from(segmentKeyCounts)
                    .filter(([, count]) => count > 1)
                    .map(([segmentKey]) => segmentKey)
                    .sort(compareText),
                invariants: {
                    segmentAllocationWithinQty,
                    debtAllocationWithinOpenDebt,
                    sourceAllocationWithinPlannedQty,
                    segmentKeysConsumedOnce,
                    exactHoldQtyWithinPhysical,
                    exactHoldKeysConsumedOnce,
                    exactPrcAndUnitOnly: allocations.every((allocation) => {
                        const segment = segments.find((row) => row.segmentKey === allocation.physicalSegmentId);
                        const debt = debts.find((row) => row.debtKey === allocation.targetDebtKey);
                        return !!segment && !!debt
                            && segment.prcId === debt.prcId
                            && segment.prcCode === debt.prcCode
                            && segment.unit === debt.unit;
                    }),
                    reallocationPolicyRespected: allocations.every((allocation) => {
                        const segment = segments.find((row) => row.segmentKey === allocation.physicalSegmentId);
                        const debt = debts.find((row) => row.debtKey === allocation.targetDebtKey);
                        if (!segment || !debt) return false;
                        if (allocation.fixedByExactHold === true) {
                            return [PHYSICAL_ALLOCATION_STATES.RESERVED, PHYSICAL_ALLOCATION_STATES.LOCKED]
                                .includes(allocation.physicalAllocationState)
                                && !!text(allocation.exactHoldKey);
                        }
                        const lifecycleDebtKey = resolvedLifecycleDebtBySegment.get(segment.segmentKey);
                        if (lifecycleDebtKey) return lifecycleDebtKey === debt.debtKey;
                        return segment.allocationState === PHYSICAL_ALLOCATION_STATES.REALLOCATABLE
                            && segment.reallocatable === true;
                    }),
                    sourceIdentityExact: allocations.every((allocation) => {
                        const segment = segments.find((row) => row.segmentKey === allocation.physicalSegmentId);
                        if (!segment) return false;
                        if (allocation.fixedByExactHold === true) return !!text(allocation.exactHoldKey);
                        if (resolvedLifecycleDebtBySegment.has(segment.segmentKey)) {
                            return resolvedLifecycleDebtBySegment.get(segment.segmentKey)
                                === allocation.targetDebtKey;
                        }
                        return segment.allocationState === PHYSICAL_ALLOCATION_STATES.REALLOCATABLE
                            && allocation.physicalSourceBucket
                            && allocation.targetSourceBucket === allocation.sourceBucket;
                    }),
                    originEvidencePreserved: allocations.every((allocation) => {
                        const segment = segments.find((row) => row.segmentKey === allocation.physicalSegmentId);
                        return !!segment
                            && allocation.originWorkOrderId === text(segment.originWorkOrderId)
                            && allocation.originDemandId === text(segment.originDemandId)
                            && allocation.physicalOriginItemKey === text(segment.originItemKey)
                            && allocation.physicalOriginAudit?.originOrderId === text(segment.originOrderId)
                            && allocation.physicalOriginAudit?.originOrderLineId === text(segment.originOrderLineId)
                            && allocation.physicalOriginAudit?.originDemandId === text(segment.originDemandId)
                            && allocation.physicalOriginAudit?.originItemKey === text(segment.originItemKey)
                            && allocation.physicalOriginAudit?.originWorkOrderId === text(segment.originWorkOrderId)
                            && allocation.physicalOriginAudit?.originWorkOrderLineId === text(segment.originWorkOrderLineId)
                            && JSON.stringify(allocation.physicalOriginAudit?.evidenceIds || [])
                                === JSON.stringify(asArray(segment.evidenceIds));
                    })
                },
                persistence: {
                    dbSaveCalls: 0,
                    stockMovementWrites: 0,
                    transactionWrites: 0,
                    metadataWrites: 0
                }
            }
        };
    };

    const resolve = (snapshot = {}, options = {}) => {
        const input = snapshot && typeof snapshot === 'object' ? snapshot : {};
        const cards = asArray(input.partComponentCards);
        const workOrders = asArray(input.workOrders);
        const transactions = asArray(input.workOrderTransactions);
        const stockRows = asArray(input.stockDepotItems);
        const lifecycleContractActive = Object.prototype.hasOwnProperty.call(input, 'montageDispatchPlans');
        const plans = asArray(input.montageDispatchPlans);
        const shipments = asArray(input.montageDispatchShipments);
        // MCT PENDING/POSTED kayıtları Faz 1'de ikinci PRC fiziksel segmenti değildir.
        // İlgili güncel stok satırı fiziksel doğruluk kaynağı olarak tek kez okunur.
        const completionTransfers = asArray(input.montageCompletionTransfers);
        const movements = asArray(input.stock_movements);
        const prcIndex = createPrcIndex(cards);
        const segments = [];
        const executions = [];
        const uncertain = [];
        let excludedStockRowCount = 0;
        let ignoredTransactionCount = 0;
        const lifecycle = lifecycleContractActive
            ? resolveMontageLifecycle({
                plans,
                shipments,
                transfers: completionTransfers,
                stockRows,
                movements,
                prcIndex,
                orders: asArray(input.orders),
                demands: asArray(input.planningDemands)
            })
            : {
                segments: [],
                reservations: [],
                evidence: [],
                uncertain: [],
                exactHolds: [],
                handledStockRowIds: new Set(),
                handledShipmentIds: new Set(),
                failClosedStockRowIds: new Set(),
                diagnostics: {
                    planCount: 0,
                    activeDraftReservationCount: 0,
                    lifecycleSegmentCount: 0,
                    lifecycleEvidenceCount: 0,
                    uncertainCount: 0
                }
            };
        segments.push(...lifecycle.segments);
        uncertain.push(...lifecycle.uncertain);

        const lineKeyCounts = new Map();
        workOrders.forEach((order) => {
            asArray(order?.lines).forEach((line) => {
                const key = `${text(order?.id)}|${text(line?.id)}`;
                lineKeyCounts.set(key, (lineKeyCounts.get(key) || 0) + 1);
            });
        });

        const transactionsByLine = new Map();
        const knownLineKeys = new Set(lineKeyCounts.keys());
        transactions.forEach((txn) => {
            const workOrderId = text(txn?.workOrderId);
            const lineId = text(txn?.lineId);
            const txnType = code(txn?.type);
            if (!WORK_TXN_TYPES.has(txnType)) {
                ignoredTransactionCount += 1;
                return;
            }
            const key = `${workOrderId}|${lineId}`;
            if (!workOrderId || !lineId || !knownLineKeys.has(key)) {
                uncertain.push(createUncertain({
                    kind: 'WORK_TRANSACTION',
                    id: txn?.id,
                    reasonCode: !workOrderId || !lineId ? 'TXN_WORK_IDENTITY_MISSING' : 'TXN_WORK_LINE_NOT_FOUND',
                    reportedQty: txn?.qty,
                    workOrderId,
                    lineId,
                    evidenceIds: [txn?.id]
                }));
                return;
            }
            if (!transactionsByLine.has(key)) transactionsByLine.set(key, []);
            transactionsByLine.get(key).push(txn);
        });

        stableSort(workOrders, (order, index) => `${text(order?.id)}|${text(order?.workOrderCode)}|${index}`)
            .forEach((order) => {
                const workOrderId = text(order?.id);
                stableSort(asArray(order?.lines), (line, index) => `${text(line?.id)}|${code(line?.componentCode)}|${index}`)
                    .forEach((line) => {
                        const lineId = text(line?.id);
                        const key = `${workOrderId}|${lineId}`;
                        const prc = resolveExactPrc(prcIndex, line?.componentCode, line?.componentId || line?.refId);
                        const lineUnit = code(line?.unit || prc?.unit);
                        const targetQty = Number(line?.targetQty || 0);
                        const routeValidation = validateRoutes(line);
                        let lineReason = '';

                        if (!workOrderId || !lineId) lineReason = 'WORK_LINE_IDENTITY_MISSING';
                        else if (lineKeyCounts.get(key) !== 1) lineReason = 'WORK_LINE_IDENTITY_DUPLICATE';
                        else if (!prc.ok) lineReason = prc.reasonCode;
                        else if (!lineUnit || lineUnit !== prc.unit) lineReason = 'WORK_LINE_UNIT_MISMATCH';
                        else if (!isPositiveQty(targetQty)) lineReason = 'WORK_TARGET_QTY_INVALID';
                        else if (!routeValidation.ok) lineReason = routeValidation.reasonCode;

                        const lineTxns = stableSort(transactionsByLine.get(key), (txn, index) =>
                            `${text(txn?.created_at)}|${text(txn?.id)}|${index}`
                        );
                        const resolvedTxns = [];
                        if (!lineReason) {
                            lineTxns.forEach((txn) => {
                                const qty = Number(txn?.qty || 0);
                                const routeResult = resolveTransactionRoute(line, txn);
                                if (!isPositiveQty(qty)) {
                                    lineReason = lineReason || 'TXN_QTY_INVALID';
                                    uncertain.push(createUncertain({
                                        kind: 'WORK_TRANSACTION',
                                        id: txn?.id,
                                        reasonCode: 'TXN_QTY_INVALID',
                                        prcCode: prc.prcCode,
                                        unit: prc.unit,
                                        reportedQty: txn?.qty,
                                        workOrderId,
                                        lineId,
                                        evidenceIds: [txn?.id]
                                    }));
                                    return;
                                }
                                if (!routeResult.ok) {
                                    lineReason = lineReason || routeResult.reasonCode;
                                    uncertain.push(createUncertain({
                                        kind: 'WORK_TRANSACTION',
                                        id: txn?.id,
                                        reasonCode: routeResult.reasonCode,
                                        prcCode: prc.prcCode,
                                        unit: prc.unit,
                                        reportedQty: qty,
                                        workOrderId,
                                        lineId,
                                        candidates: routeResult.candidates,
                                        evidenceIds: [txn?.id]
                                    }));
                                    return;
                                }
                                resolvedTxns.push({
                                    txn,
                                    type: code(txn?.type),
                                    qty: roundQty(qty),
                                    routeIndex: routeResult.routeIndex
                                });
                            });
                        }

                        if (lineReason) {
                            if (!uncertain.some((entry) => entry.workOrderId === workOrderId && entry.lineId === lineId)) {
                                uncertain.push(createUncertain({
                                    kind: 'WORK_LINE',
                                    id: lineId,
                                    reasonCode: lineReason,
                                    prcCode: prc?.prcCode || line?.componentCode,
                                    unit: prc?.unit || lineUnit,
                                    reportedQty: targetQty,
                                    workOrderId,
                                    lineId,
                                    candidates: prc?.candidates,
                                    evidenceIds: lineTxns.map((txn) => txn?.id)
                                }));
                            }
                            executions.push({
                                workOrderId,
                                workOrderCode: text(order?.workOrderCode),
                                lineId,
                                prcId: prc?.prcId || '',
                                prcCode: prc?.prcCode || code(line?.componentCode),
                                unit: prc?.unit || lineUnit,
                                targetQty: isPositiveQty(targetQty) ? roundQty(targetQty) : null,
                                firstRouteCumulativeTake: null,
                                unstartedExecutionQty: null,
                                operationalAvailableQty: null,
                                status: 'UNCERTAIN',
                                allocatable: false,
                                reasonCode: lineReason
                            });
                            return;
                        }

                        const routeCount = routeValidation.routes.length;
                        const take = Array(routeCount).fill(0);
                        const complete = Array(routeCount).fill(0);
                        const store = Array(routeCount).fill(0);
                        const evidenceByTypeRoute = new Map();
                        resolvedTxns.forEach((entry) => {
                            const target = entry.type === 'TAKE' ? take : entry.type === 'COMPLETE' ? complete : store;
                            target[entry.routeIndex] = roundQty(target[entry.routeIndex] + entry.qty);
                            const evidenceKey = `${entry.type}|${entry.routeIndex}`;
                            if (!evidenceByTypeRoute.has(evidenceKey)) evidenceByTypeRoute.set(evidenceKey, []);
                            evidenceByTypeRoute.get(evidenceKey).push(text(entry.txn?.id));
                        });

                        let invariantReason = '';
                        if (take[0] > targetQty + EPSILON) invariantReason = 'FIRST_ROUTE_TAKE_EXCEEDS_TARGET';
                        for (let index = 0; index < routeCount && !invariantReason; index += 1) {
                            if (complete[index] > take[index] + EPSILON) {
                                invariantReason = 'COMPLETE_EXCEEDS_TAKE';
                                break;
                            }
                            if (index > 0 && take[index] > complete[index - 1] + EPSILON) {
                                invariantReason = 'DOWNSTREAM_TAKE_EXCEEDS_UPSTREAM_COMPLETE';
                                break;
                            }
                            if (index < routeCount - 1 && store[index] > EPSILON) {
                                invariantReason = 'STORE_ON_NON_FINAL_ROUTE';
                                break;
                            }
                        }
                        if (!invariantReason && store[routeCount - 1] > complete[routeCount - 1] + EPSILON) {
                            invariantReason = 'STORE_EXCEEDS_FINAL_COMPLETE';
                        }
                        if (invariantReason) {
                            uncertain.push(createUncertain({
                                kind: 'WORK_LINE',
                                id: lineId,
                                reasonCode: invariantReason,
                                prcCode: prc.prcCode,
                                unit: prc.unit,
                                reportedQty: targetQty,
                                workOrderId,
                                lineId,
                                evidenceIds: lineTxns.map((txn) => txn?.id)
                            }));
                            executions.push({
                                workOrderId,
                                workOrderCode: text(order?.workOrderCode),
                                lineId,
                                prcId: prc.prcId,
                                prcCode: prc.prcCode,
                                unit: prc.unit,
                                targetQty: roundQty(targetQty),
                                firstRouteCumulativeTake: null,
                                unstartedExecutionQty: null,
                                operationalAvailableQty: null,
                                status: 'UNCERTAIN',
                                allocatable: false,
                                reasonCode: invariantReason
                            });
                            return;
                        }

                        let operationalAvailableQty = 0;
                        routeValidation.routes.forEach((route, index) => {
                            const inProcessQty = roundQty(Math.max(0, take[index] - complete[index]));
                            if (inProcessQty > EPSILON) {
                                segments.push(createWorkSegment({
                                    stage: 'IN_PROCESS',
                                    qty: inProcessQty,
                                    prc,
                                    order,
                                    line,
                                    route,
                                    evidenceIds: [
                                        ...asArray(evidenceByTypeRoute.get(`TAKE|${index}`)),
                                        ...asArray(evidenceByTypeRoute.get(`COMPLETE|${index}`))
                                    ]
                                }));
                            }
                            if (index < routeCount - 1) {
                                const transferPendingQty = roundQty(Math.max(0, complete[index] - take[index + 1]));
                                operationalAvailableQty = roundQty(operationalAvailableQty + transferPendingQty);
                                if (transferPendingQty > EPSILON) {
                                    segments.push(createWorkSegment({
                                        stage: 'TRANSFER_PENDING',
                                        qty: transferPendingQty,
                                        prc,
                                        order,
                                        line,
                                        route,
                                        evidenceIds: [
                                            ...asArray(evidenceByTypeRoute.get(`COMPLETE|${index}`)),
                                            ...asArray(evidenceByTypeRoute.get(`TAKE|${index + 1}`))
                                        ]
                                    }));
                                }
                            } else {
                                const depotPendingQty = roundQty(Math.max(0, complete[index] - store[index]));
                                if (depotPendingQty > EPSILON) {
                                    segments.push(createWorkSegment({
                                        stage: 'DEPOT_PENDING',
                                        qty: depotPendingQty,
                                        prc,
                                        order,
                                        line,
                                        route,
                                        evidenceIds: [
                                            ...asArray(evidenceByTypeRoute.get(`COMPLETE|${index}`)),
                                            ...asArray(evidenceByTypeRoute.get(`STORE|${index}`))
                                        ]
                                    }));
                                }
                            }
                        });

                        executions.push({
                            workOrderId,
                            workOrderCode: text(order?.workOrderCode),
                            lineId,
                            prcId: prc.prcId,
                            prcCode: prc.prcCode,
                            unit: prc.unit,
                            targetQty: roundQty(targetQty),
                            firstRouteCumulativeTake: roundQty(take[0]),
                            unstartedExecutionQty: roundQty(Math.max(0, targetQty - take[0])),
                            operationalAvailableQty,
                            status: 'RESOLVED',
                            allocatable: true,
                            reasonCode: ''
                        });
                    });
            });

        const stockIdCounts = new Map();
        stockRows.forEach((row) => {
            const id = text(row?.id);
            if (id) stockIdCounts.set(id, (stockIdCounts.get(id) || 0) + 1);
        });
        stableSort(stockRows, (row, index) => `${text(row?.id)}|${code(row?.productCode || row?.code)}|${index}`)
            .forEach((row) => {
                const stockRowId = text(row?.id);
                if (lifecycleContractActive && lifecycle.handledStockRowIds.has(stockRowId)) return;
                if (lifecycleContractActive && lifecycle.failClosedStockRowIds.has(stockRowId)) {
                    excludedStockRowCount += 1;
                    return;
                }
                const qtyResult = getQtyAliasResult(row);
                if (qtyResult.ok && Math.abs(qtyResult.qty) <= EPSILON) {
                    excludedStockRowCount += 1;
                    return;
                }
                const prc = resolveExactPrc(prcIndex, row?.productCode || row?.code, row?.refId || row?.productId);
                const rowUnit = code(row?.unit);
                const stockClass = code(row?.stockClass || row?.status || 'KULLANILABILIR');
                const source = classifyStockSource(row);
                let reasonCode = '';
                if (!stockRowId) reasonCode = 'STOCK_ROW_ID_MISSING';
                else if (stockIdCounts.get(stockRowId) !== 1) reasonCode = 'STOCK_ROW_ID_DUPLICATE';
                else if (!qtyResult.ok) reasonCode = `STOCK_${qtyResult.reasonCode}`;
                else if (qtyResult.qty < 0) reasonCode = 'STOCK_QTY_NEGATIVE';
                else if (!prc.ok) {
                    if (prc.reasonCode === 'PRC_NOT_FOUND' || prc.reasonCode === 'PRC_CODE_MISSING') {
                        excludedStockRowCount += 1;
                        return;
                    }
                    reasonCode = `STOCK_${prc.reasonCode}`;
                } else if (!rowUnit || rowUnit !== prc.unit) reasonCode = 'STOCK_UNIT_MISMATCH';
                else if (!getStockLocationKey(row)) reasonCode = 'STOCK_LOCATION_MISSING';
                else if (stockClass === 'WIP' || stockClass === 'ISLEMDE') {
                    excludedStockRowCount += 1;
                    return;
                } else if (!['KULLANILABILIR', 'MONTAGE_RECEIVED'].includes(stockClass)) {
                    reasonCode = 'STOCK_CLASS_UNTRUSTED';
                } else if (!source.ok) reasonCode = source.reasonCode;

                if (reasonCode) {
                    uncertain.push(createUncertain({
                        kind: 'STOCK_ROW',
                        id: stockRowId,
                        reasonCode,
                        prcCode: prc?.prcCode || row?.productCode || row?.code,
                        unit: prc?.unit || rowUnit,
                        reportedQty: qtyResult.ok ? qtyResult.qty : null,
                        evidenceIds: [stockRowId]
                    }));
                    return;
                }
                if (qtyResult.qty > EPSILON) {
                    const productionOrigin = resolveProductionStockOrigin({
                        row,
                        qty: qtyResult.qty,
                        prc,
                        sourceType: source.sourceType,
                        movements,
                        workOrders,
                        prcIndex
                    });
                    segments.push(createStockSegment({
                        row,
                        qty: qtyResult.qty,
                        prc,
                        sourceType: source.sourceType,
                        productionOrigin
                    }));
                }
            });

        const movementById = new Map();
        movements.forEach((movement) => {
            const id = text(movement?.id);
            if (!id) return;
            if (!movementById.has(id)) movementById.set(id, []);
            movementById.get(id).push(movement);
        });
        const shipmentIdCounts = new Map();
        shipments.forEach((shipment) => {
            const id = text(shipment?.id);
            if (id) shipmentIdCounts.set(id, (shipmentIdCounts.get(id) || 0) + 1);
        });
        stableSort(shipments, (shipment, index) => `${text(shipment?.id)}|${text(shipment?.shipmentNo)}|${index}`)
            .forEach((shipment) => {
                if (lifecycleContractActive) return;
                const status = code(shipment?.status);
                if (status !== 'IN_TRANSIT' && status !== 'DISPATCHED') return;
                const shipmentId = text(shipment?.id);
                const itemValidation = validateShipmentItems(shipment);
                if (!shipmentId || shipmentIdCounts.get(shipmentId) !== 1 || !itemValidation.ok) {
                    uncertain.push(createUncertain({
                        kind: 'MGS_SHIPMENT',
                        id: shipmentId,
                        reasonCode: !shipmentId
                            ? 'MGS_ID_MISSING'
                            : shipmentIdCounts.get(shipmentId) !== 1
                                ? 'MGS_ID_DUPLICATE'
                                : itemValidation.reasonCode,
                        evidenceIds: [shipmentId]
                    }));
                    return;
                }
                const parts = asArray(shipment?.parts);
                if (!parts.length) {
                    uncertain.push(createUncertain({
                        kind: 'MGS_SHIPMENT',
                        id: shipmentId,
                        reasonCode: 'MGS_PART_SNAPSHOT_MISSING',
                        evidenceIds: [shipmentId]
                    }));
                    return;
                }
                const validatedParts = parts.map((part) =>
                    validateShipmentPart({ shipment, part, prcIndex, movementById, stockRows })
                );
                const invalidIndex = validatedParts.findIndex((result) => !result.ok);
                if (invalidIndex >= 0) {
                    const invalid = validatedParts[invalidIndex];
                    uncertain.push(createUncertain({
                        kind: 'MGS_PART',
                        id: `${shipmentId}|${invalidIndex}`,
                        reasonCode: invalid.reasonCode,
                        prcCode: invalid?.prc?.prcCode || parts[invalidIndex]?.code,
                        unit: invalid?.prc?.unit || parts[invalidIndex]?.unit,
                        reportedQty: invalid.qty,
                        evidenceIds: [shipmentId]
                    }));
                    return;
                }
                if (code(shipment?.stockTransferMode) === MONTAGE_STOCK_TRANSFER_MODE) {
                    uncertain.push(createUncertain({
                        kind: 'MGS_SHIPMENT',
                        id: shipmentId,
                        reasonCode: 'MGS_DEFERRED_LIFECYCLE_CONTRACT_MISSING',
                        evidenceIds: [shipmentId]
                    }));
                    return;
                }
                validatedParts.forEach((validation, partIndex) => {
                    segments.push(createMontageTransitSegment({
                        shipment,
                        part: parts[partIndex],
                        partIndex,
                        validation
                    }));
                });
            });

        const classifiedSegments = segments.map(classifyPhysicalSegment);
        const sortedSegments = stableSort(classifiedSegments, (segment) => [
            segment.prcCode,
            String(STAGE_ORDER.get(segment.stage) || 0).padStart(3, '0'),
            segment.segmentKey
        ].join('|'));
        const sortedExecutions = stableSort(executions, (execution) => [
            execution.prcCode,
            execution.workOrderId,
            execution.lineId
        ].join('|'));
        const sortedUncertain = stableSort(uncertain, (entry) => [
            entry.prcCode,
            entry.reasonCode,
            entry.kind,
            entry.id
        ].join('|'));

        const totalKeys = new Set();
        sortedSegments.forEach((segment) => {
            if (segment.itemType === 'PRC' && segment.prcCode) {
                totalKeys.add(`${segment.prcCode}|${segment.unit}`);
            }
        });
        sortedExecutions.forEach((execution) => {
            if (execution.prcCode) totalKeys.add(`${execution.prcCode}|${execution.unit}`);
        });
        sortedUncertain.forEach((entry) => {
            if (entry.prcCode) totalKeys.add(`${entry.prcCode}|${entry.unit}`);
        });
        const totalsByPrc = stableSort(Array.from(totalKeys), (value) => value).map((key) => {
            const [prcCode, unit] = key.split('|');
            const matchingSegments = sortedSegments.filter((segment) =>
                segment.prcCode === prcCode && segment.unit === unit
            );
            const matchingExecutions = sortedExecutions.filter((execution) =>
                execution.prcCode === prcCode && execution.unit === unit
            );
            const matchingUncertain = sortedUncertain.filter((entry) =>
                entry.prcCode === prcCode && (!entry.unit || entry.unit === unit)
            );
            const resolvedExecutions = matchingExecutions.filter((execution) => execution.status === 'RESOLVED');
            return {
                prcId: matchingSegments[0]?.prcId || matchingExecutions[0]?.prcId || '',
                prcCode,
                unit,
                physicalQty: roundQty(matchingSegments.reduce((sum, segment) => sum + segment.physicalQty, 0)),
                unstartedExecutionQty: roundQty(resolvedExecutions.reduce((sum, row) =>
                    sum + Number(row.unstartedExecutionQty || 0), 0)),
                operationalAvailableQty: roundQty(resolvedExecutions.reduce((sum, row) =>
                    sum + Number(row.operationalAvailableQty || 0), 0)),
                uncertainRecordCount: matchingUncertain.length,
                uncertainQty: matchingUncertain.length ? null : 0,
                uncertainQtyAdditive: false
            };
        });
        const itemTotalKeys = new Set(sortedSegments
            .filter((segment) => segment.itemCode && segment.unit)
            .map((segment) => `${segment.itemType}|${segment.itemCode}|${segment.unit}`));
        const totalsByItem = stableSort(Array.from(itemTotalKeys), (value) => value).map((key) => {
            const [itemType, itemCode, unit] = key.split('|');
            const matchingSegments = sortedSegments.filter((segment) =>
                segment.itemType === itemType
                && segment.itemCode === itemCode
                && segment.unit === unit
            );
            return {
                itemType,
                itemCode,
                unit,
                physicalQty: roundQty(matchingSegments.reduce((sum, segment) =>
                    sum + Number(segment.physicalQty || 0), 0)),
                segmentCount: matchingSegments.length
            };
        });
        const commercial = buildCommercialAllocation({
            input,
            prcIndex,
            workOrders,
            segments: sortedSegments.filter((segment) => segment.itemType === 'PRC'),
            executions: sortedExecutions,
            completionTransfers,
            exactHolds: lifecycle.exactHolds,
            lifecycleReservations: lifecycle.reservations,
            exactSourceTarget: options?.exactSourceTarget || null
        });

        return {
            version: VERSION,
            mode: lifecycleContractActive ? 'READ_ONLY_PHASE_5A_CONTRACT' : 'READ_ONLY_PHASE_1',
            segments: sortedSegments,
            executions: sortedExecutions,
            uncertain: sortedUncertain,
            totalsByPrc,
            totalsByItem,
            lifecycle: {
                contractActive: lifecycleContractActive,
                reservations: lifecycle.reservations,
                evidence: lifecycle.evidence,
                diagnostics: lifecycle.diagnostics
            },
            debts: commercial.debts,
            sourceEntitlements: commercial.sourceEntitlements,
            readinessByDemandItem: commercial.readinessByDemandItem,
            allocations: commercial.allocations,
            uncoveredDebts: commercial.uncoveredDebts,
            remainingExecutionCommitments: commercial.remainingExecutionCommitments,
            ...(commercial.exactSourceSelection
                ? { exactSourceSelection: commercial.exactSourceSelection }
                : {}),
            diagnostics: {
                inputCounts: {
                    partComponentCards: cards.length,
                    workOrders: workOrders.length,
                    workOrderTransactions: transactions.length,
                    stockDepotItems: stockRows.length,
                    montageDispatchPlans: plans.length,
                    montageDispatchShipments: shipments.length,
                    montageCompletionTransfers: completionTransfers.length,
                    stock_movements: movements.length,
                    ...commercial.diagnostics.inputCounts
                },
                excludedStockRowCount,
                ignoredTransactionCount,
                nonPhysicalCompletionTransferViewCount: completionTransfers.length,
                lifecycleContractActive,
                lifecycle: lifecycle.diagnostics,
                allocationOrder: commercial.diagnostics.allocationOrder,
                evaluatedDebtOrder: commercial.diagnostics.evaluatedDebtOrder,
                segmentOrder: commercial.diagnostics.segmentOrder,
                failClosedDebts: commercial.diagnostics.failClosedDebts,
                excludedReservedSegmentKeys: commercial.diagnostics.excludedReservedSegmentKeys,
                excludedLockedSegmentKeys: commercial.diagnostics.excludedLockedSegmentKeys,
                unresolvedLifecycleSegmentKeys: commercial.diagnostics.unresolvedLifecycleSegmentKeys,
                unresolvedExactHoldKeys: commercial.diagnostics.unresolvedExactHoldKeys,
                exactHoldLedger: commercial.diagnostics.exactHoldLedger,
                duplicateSegmentKeys: commercial.diagnostics.duplicateSegmentKeys,
                invariants: commercial.diagnostics.invariants,
                persistence: commercial.diagnostics.persistence,
                dbSaveCalls: 0,
                writes: 0
            }
        };
    };

    const resolveExactSourceSelection = (snapshot = {}, target = {}) => {
        const resolved = resolve(snapshot, { exactSourceTarget: target });
        return resolved.exactSourceSelection || {
            ok: false,
            reasonCode: 'INSTRUCTION_REQUEST_INVALID',
            message: 'Exact kaynak seçim hedefi doğrulanamadı.',
            target: null,
            targetDebtKey: '',
            targetOpenQty: null,
            slices: [],
            totalSelectableQty: 0,
            readOnly: true,
            writes: 0
        };
    };

    const resolveDraftPlanBoundRebindSelection = (snapshot = {}, request = {}) => {
        const fail = (reasonCode, message) => ({
            ok: false,
            reasonCode,
            message,
            target: null,
            packages: [],
            totalSelectableSetQty: 0,
            readOnly: true,
            writes: 0
        });
        const input = snapshot && typeof snapshot === 'object' ? snapshot : {};
        const target = {
            sourceOrderId: text(request?.sourceOrderId),
            sourceLineId: text(request?.sourceLineId),
            demandId: text(request?.demandId),
            itemKey: text(request?.itemKey)
        };
        const rawRequirements = asArray(request?.requirements);
        if (Object.values(target).some((value) => !value) || !rawRequirements.length) {
            return fail('DRAFT_REBIND_TARGET_INVALID', 'Hedef SALES satırı ve exact reçete zorunludur.');
        }

        const prcIndex = createPrcIndex(input.partComponentCards);
        const requirementsByKey = new Map();
        for (const raw of rawRequirements) {
            const prcId = text(raw?.prcId || raw?.refId);
            const prcCode = code(raw?.prcCode || raw?.code);
            const unit = code(raw?.unit);
            const qtyPerSet = Number(raw?.qtyPerSet);
            const prc = resolveExactPrc(prcIndex, prcCode, prcId);
            if (!prc.ok || prc.prcId !== prcId || prc.prcCode !== prcCode || prc.unit !== unit
                || !isPositiveQty(qtyPerSet)) {
                return fail('DRAFT_REBIND_EXACT_REQUIREMENT_INVALID', 'Hedef reçetede exact PRC veya birim doğrulanamadı.');
            }
            const key = `${prcId}|${prcCode}|${unit}`;
            const current = requirementsByKey.get(key);
            if (!current) requirementsByKey.set(key, { key, prcId, prcCode, unit, qtyPerSet: roundQty(qtyPerSet) });
            else current.qtyPerSet = roundQty(current.qtyPerSet + qtyPerSet);
        }

        const orders = asArray(input.orders);
        const demands = asArray(input.planningDemands);
        const orderMatches = orders.filter((order) => text(order?.id) === target.sourceOrderId);
        const lineMatches = orderMatches.length === 1
            ? asArray(orderMatches[0]?.lines).filter((line) => text(line?.id || line?.lineId) === target.sourceLineId)
            : [];
        const demandMatches = demands.filter((demand) => text(demand?.id) === target.demandId);
        const demand = demandMatches.length === 1 ? demandMatches[0] : null;
        const itemMatches = demand
            ? asArray(demand?.items).filter((item) => text(item?.id || item?.itemKey) === target.itemKey)
            : [];
        if (orderMatches.length !== 1 || lineMatches.length !== 1 || demandMatches.length !== 1
            || itemMatches.length !== 1 || code(demand?.sourceType) !== 'SALES_ORDER'
            || text(demand?.sourceOrderId) !== target.sourceOrderId
            || text(demand?.sourceLineId) !== target.sourceLineId) {
            return fail('DRAFT_REBIND_TARGET_INVALID', 'Hedef SALES sipariş, PLN ve kalem bağı tekil doğrulanamadı.');
        }

        let resolved;
        try {
            resolved = resolve(input);
        } catch (_error) {
            return fail('DRAFT_REBIND_RESOLVER_FAILED', 'Güncel Sanal Taksim hesabı tamamlanamadı.');
        }
        const invariants = resolved?.diagnostics?.invariants || {};
        const requiredInvariants = [
            'segmentAllocationWithinQty',
            'debtAllocationWithinOpenDebt',
            'sourceAllocationWithinPlannedQty',
            'segmentKeysConsumedOnce',
            'exactHoldQtyWithinPhysical',
            'exactHoldKeysConsumedOnce',
            'exactPrcAndUnitOnly',
            'sourceIdentityExact',
            'originEvidencePreserved'
        ];
        if (requiredInvariants.some((name) => invariants[name] !== true)
            || resolved?.diagnostics?.exactHoldLedger?.valid !== true) {
            return fail('DRAFT_REBIND_RESOLVER_UNTRUSTED', 'Exact hold defteri güvenilir değildir.');
        }

        let targetMaxSetQty = Number.MAX_SAFE_INTEGER;
        for (const requirement of requirementsByKey.values()) {
            const debtMatches = asArray(resolved?.debts).filter((debt) =>
                debt?.debtType === 'SALES'
                && debt?.allocationEligible === true
                && text(debt?.originOrderId) === target.sourceOrderId
                && text(debt?.originOrderLineId) === target.sourceLineId
                && text(debt?.originDemandId) === target.demandId
                && text(debt?.originItemKey) === target.itemKey
                && text(debt?.prcId) === requirement.prcId
                && code(debt?.prcCode) === requirement.prcCode
                && code(debt?.unit) === requirement.unit
                && Number.isFinite(Number(debt?.openDebtQty))
                && Number(debt.openDebtQty) > EPSILON
            );
            if (debtMatches.length !== 1) {
                return fail('DRAFT_REBIND_TARGET_DEBT_INVALID', 'Hedef exact SALES borcu tekil ve açık değildir.');
            }
            targetMaxSetQty = Math.min(
                targetMaxSetQty,
                Math.floor((Number(debtMatches[0].openDebtQty) + EPSILON) / requirement.qtyPerSet)
            );
        }
        if (!Number.isFinite(targetMaxSetQty) || targetMaxSetQty <= 0) {
            return fail('DRAFT_REBIND_TARGET_DEBT_INVALID', 'Hedef siparişin kullanılabilir açık borcu yoktur.');
        }

        const plans = asArray(input.montageDispatchPlans);
        const shipments = asArray(input.montageDispatchShipments);
        const transfers = asArray(input.montageCompletionTransfers);
        const instructions = asArray(input.sanalTaksimAllocationInstructions);
        const stockRows = asArray(input.stockDepotItems);
        const lifecycleReservations = asArray(resolved?.lifecycle?.reservations);
        const allocations = asArray(resolved?.allocations);
        const planIdCounts = new Map();
        plans.forEach((plan) => {
            const planId = text(plan?.id);
            if (planId) planIdCounts.set(planId, (planIdCounts.get(planId) || 0) + 1);
        });
        const instructionIdCounts = new Map();
        instructions.forEach((instruction) => {
            const instructionId = text(instruction?.id);
            if (instructionId) instructionIdCounts.set(instructionId, (instructionIdCounts.get(instructionId) || 0) + 1);
        });
        const packages = [];

        stableSort(plans.filter((plan) => code(plan?.status) === 'DRAFT'), (plan, index) =>
            `${text(plan?.createdAt)}|${text(plan?.id)}|${index}`
        ).forEach((plan) => {
            const planId = text(plan?.id);
            const reservations = asArray(plan?.exactReservations);
            const planItems = asArray(plan?.items);
            const sourceItem = planItems.length === 1 ? planItems[0] : null;
            const sourcePlannedQty = Number(sourceItem?.plannedQty);
            if (!planId || planIdCounts.get(planId) !== 1 || !reservations.length
                || plan?.rebindAudit != null || !sourceItem
                || code(sourceItem?.sourceType) !== 'SALES_ORDER'
                || !text(sourceItem?.sourceOrderId) || text(sourceItem?.sourceOrderId) === target.sourceOrderId
                || !text(sourceItem?.sourceLineId) || !text(sourceItem?.demandId) || !text(sourceItem?.itemKey)
                || !Number.isSafeInteger(sourcePlannedQty) || sourcePlannedQty <= 0) return;
            const sourceRecipeByKey = new Map();
            for (const part of asArray(sourceItem?.recipeParts)) {
                const prcId = text(part?.refId || part?.prcId);
                const prcCode = code(part?.code || part?.prcCode);
                const unit = code(part?.unit);
                const qtyPerSet = Number(part?.qtyPerSet);
                const key = `${prcId}|${prcCode}|${unit}`;
                if (!requirementsByKey.has(key) || !isPositiveQty(qtyPerSet)) {
                    sourceRecipeByKey.clear();
                    break;
                }
                const current = sourceRecipeByKey.get(key);
                if (!current) sourceRecipeByKey.set(key, roundQty(qtyPerSet));
                else sourceRecipeByKey.set(key, roundQty(current + qtyPerSet));
            }
            if (sourceRecipeByKey.size !== requirementsByKey.size
                || Array.from(requirementsByKey.values()).some((requirement) =>
                    !sameQty(sourceRecipeByKey.get(requirement.key), requirement.qtyPerSet))) return;
            if (shipments.some((shipment) => text(shipment?.planId) === planId)
                || transfers.some((transfer) => text(transfer?.sourcePlanId) === planId)) return;

            const packageRows = [];
            const instructionById = new Map();
            const reservationKeys = new Set();
            const sliceLinks = new Set();
            let packageValid = true;
            for (const reservation of reservations) {
                const reservationKey = text(reservation?.reservationKey);
                const instructionId = text(reservation?.instructionId);
                const instructionSliceKey = text(reservation?.instructionSliceKey);
                const instructionMatches = instructions.filter((instruction) => text(instruction?.id) === instructionId);
                const instruction = instructionMatches.length === 1 ? instructionMatches[0] : null;
                const slices = instruction ? asArray(instruction?.slices) : [];
                const sliceMatches = slices.filter((slice) => text(slice?.sliceKey) === instructionSliceKey);
                const slice = sliceMatches.length === 1 ? sliceMatches[0] : null;
                const instructionTarget = instruction?.target && typeof instruction.target === 'object'
                    ? instruction.target : {};
                const stockRowId = text(reservation?.stockRowId);
                const physicalSegmentId = text(reservation?.physicalSegmentId);
                const stockMatches = stockRows.filter((row) => text(row?.id) === stockRowId);
                const linkKey = `${instructionId}|${instructionSliceKey}`;
                const qty = Number(reservation?.qty);
                const start = Number(reservation?.segmentOffsetStart);
                const end = Number(reservation?.segmentOffsetEnd);
                if (!reservationKey || reservationKeys.has(reservationKey)
                    || !instructionId || instructionIdCounts.get(instructionId) !== 1
                    || !instructionSliceKey || sliceLinks.has(linkKey)
                    || !instruction || code(instruction?.status) !== 'ACTIVE'
                    || !Array.isArray(instruction?.events) || instruction.events.length !== 0
                    || !slice || text(slice?.planId) !== planId
                    || text(slice?.reservationKey) !== reservationKey
                    || text(reservation?.planId) !== planId
                    || code(reservation?.sourceType) !== 'SALES_ORDER'
                    || text(reservation?.sourceOrderId) !== text(sourceItem?.sourceOrderId)
                    || text(reservation?.sourceLineId) !== text(sourceItem?.sourceLineId)
                    || text(reservation?.demandId) !== text(sourceItem?.demandId)
                    || text(reservation?.itemKey) !== text(sourceItem?.itemKey)
                    || text(reservation?.sourceOrderId) !== text(instructionTarget?.sourceOrderId)
                    || text(reservation?.sourceLineId) !== text(instructionTarget?.sourceLineId)
                    || text(reservation?.demandId) !== text(instructionTarget?.demandId)
                    || text(reservation?.itemKey) !== text(instructionTarget?.itemKey)
                    || text(reservation?.prcId) !== text(instruction?.prcId)
                    || code(reservation?.prcCode) !== code(instruction?.prcCode)
                    || code(reservation?.unit) !== code(instruction?.unit)
                    || stockMatches.length !== 1
                    || !stockRowId || physicalSegmentId !== `STOCK|${stockRowId}`
                    || text(slice?.stockRowId) !== stockRowId
                    || text(slice?.physicalSegmentId) !== physicalSegmentId
                    || !sameQty(slice?.segmentOffsetStart, start)
                    || !sameQty(slice?.segmentOffsetEnd, end)
                    || !sameQty(slice?.qty, qty)
                    || !isPositiveQty(qty) || !Number.isFinite(start) || !Number.isFinite(end)
                    || start < 0 || end <= start || !sameQty(end - start, qty)
                    || !text(slice?.lineageKey)
                    || !slice?.physicalOriginAudit || !asArray(slice.physicalOriginAudit?.evidenceIds).length) {
                    packageValid = false;
                    break;
                }
                reservationKeys.add(reservationKey);
                sliceLinks.add(linkKey);
                instructionById.set(instructionId, instruction);
                packageRows.push({
                    sourceReservationKey: reservationKey,
                    sourceInstructionId: instructionId,
                    sourceInstructionSliceKey: instructionSliceKey,
                    sourceType: code(reservation?.sourceType),
                    sourceOrderId: text(reservation?.sourceOrderId),
                    sourceLineId: text(reservation?.sourceLineId),
                    demandId: text(reservation?.demandId),
                    itemKey: text(reservation?.itemKey),
                    prcId: text(reservation?.prcId),
                    prcCode: code(reservation?.prcCode),
                    unit: code(reservation?.unit),
                    partSource: text(reservation?.partSource || 'component').toLocaleLowerCase('tr-TR') || 'component',
                    stockRowId,
                    physicalSegmentId,
                    sourceBucket: code(reservation?.sourceBucket),
                    segmentCapacityQtyAtCreate: Number(slice?.segmentCapacityQtyAtCreate),
                    segmentOffsetStart: roundQty(start),
                    segmentOffsetEnd: roundQty(end),
                    qty: roundQty(qty),
                    lineageKey: text(slice?.lineageKey),
                    physicalOriginAudit: slice.physicalOriginAudit
                });
            }
            if (!packageValid || !packageRows.length) return;
            if (Array.from(instructionById.values()).some((instruction) => {
                const slices = asArray(instruction?.slices);
                return !slices.length || slices.some((slice) => text(slice?.planId) !== planId)
                    || slices.length !== packageRows.filter((row) => row.sourceInstructionId === text(instruction?.id)).length;
            })) return;

            const lifecycleTotals = new Map();
            lifecycleReservations.filter((row) => text(row?.planId) === planId).forEach((row) => {
                const key = `${text(row?.prcId)}|${code(row?.prcCode)}|${code(row?.unit)}`;
                lifecycleTotals.set(key, roundQty((lifecycleTotals.get(key) || 0) + Number(row?.reservedQty || row?.qty || 0)));
            });
            const packageTotals = new Map();
            packageRows.forEach((row) => {
                const key = `${row.prcId}|${row.prcCode}|${row.unit}`;
                packageTotals.set(key, roundQty((packageTotals.get(key) || 0) + row.qty));
            });
            if (lifecycleTotals.size !== packageTotals.size
                || Array.from(packageTotals.entries()).some(([key, qty]) => !sameQty(lifecycleTotals.get(key), qty))
                || packageTotals.size !== requirementsByKey.size) return;

            let setQty = null;
            for (const requirement of requirementsByKey.values()) {
                const packageQty = packageTotals.get(requirement.key);
                const candidateSetQty = Number(packageQty) / requirement.qtyPerSet;
                if (!isPositiveQty(packageQty) || !Number.isFinite(candidateSetQty)
                    || !sameQty(candidateSetQty, Math.round(candidateSetQty))) {
                    packageValid = false;
                    break;
                }
                if (setQty === null) setQty = Math.round(candidateSetQty);
                else if (!sameQty(setQty, candidateSetQty)) {
                    packageValid = false;
                    break;
                }
            }
            if (!packageValid || !Number.isSafeInteger(setQty) || setQty <= 0
                || setQty !== sourcePlannedQty || setQty > targetMaxSetQty) return;

            const packageReservationKeys = new Set(packageRows.map((row) => row.sourceReservationKey));
            const fixedRows = allocations.filter((allocation) =>
                allocation?.fixedByExactHold === true
                && code(allocation?.holdKind) === 'USER_INSTRUCTION_EXACT'
                && packageReservationKeys.has(text(allocation?.reservationKey))
            );
            if (fixedRows.length !== packageRows.length
                || packageRows.some((row) => fixedRows.filter((allocation) =>
                    text(allocation?.reservationKey) === row.sourceReservationKey
                    && text(allocation?.instructionId) === row.sourceInstructionId
                    && sameQty(allocation?.qty, row.qty)
                ).length !== 1)) return;

            packages.push({
                sourcePlanId: planId,
                sourcePlanNo: text(plan?.planNo),
                sourceOrderIds: Array.from(new Set(packageRows.map((row) => row.sourceOrderId))).sort(compareText),
                sourceLineIds: Array.from(new Set(packageRows.map((row) => row.sourceLineId))).sort(compareText),
                sourceDemandIds: Array.from(new Set(packageRows.map((row) => row.demandId))).sort(compareText),
                sourceItemKeys: Array.from(new Set(packageRows.map((row) => row.itemKey))).sort(compareText),
                setQty,
                reservations: stableSort(packageRows, (row) => [
                    row.prcCode,
                    row.unit,
                    row.physicalSegmentId,
                    String(row.segmentOffsetStart).padStart(24, '0')
                ].join('|')),
                instructionIds: Array.from(instructionById.keys()).sort(compareText),
                readOnly: true
            });
        });

        const sortedPackages = stableSort(packages, (row) => `${row.sourcePlanNo}|${row.sourcePlanId}`);
        return {
            ok: true,
            reasonCode: '',
            message: '',
            target,
            requirements: Array.from(requirementsByKey.values()).sort((left, right) => compareText(left.key, right.key)),
            packages: sortedPackages,
            totalSelectableSetQty: sortedPackages.reduce((sum, row) => sum + Number(row.setQty || 0), 0),
            readOnly: true,
            writes: 0
        };
    };

    const resolveInTransitMgsOperationalRebindSelection = (snapshot = {}, request = {}) => {
        const fail = (reasonCode, message) => ({
            ok: false,
            reasonCode,
            message,
            target: null,
            candidates: [],
            totalSelectableSetQty: 0,
            readOnly: true,
            writes: 0
        });
        const input = snapshot && typeof snapshot === 'object' ? snapshot : {};
        const target = normalizeSalesTarget(request);
        if (!isCompleteSalesTarget(target)) {
            return fail('MGS_REBIND_TARGET_INVALID', 'Hedef SALES sipariş, satır, talep ve kalem kimliği zorunludur.');
        }
        const orders = asArray(input.orders);
        const demands = asArray(input.planningDemands);
        const orderMatches = orders.filter((row) => text(row?.id) === target.sourceOrderId);
        const order = orderMatches.length === 1 ? orderMatches[0] : null;
        const lineMatches = order ? asArray(order?.lines).filter((row) =>
            text(row?.id || row?.lineId) === target.sourceLineId
        ) : [];
        const targetLine = lineMatches.length === 1 ? lineMatches[0] : null;
        const demandMatches = demands.filter((row) => text(row?.id) === target.demandId);
        const demand = demandMatches.length === 1 ? demandMatches[0] : null;
        const itemMatches = demand ? asArray(demand?.items).filter((row) =>
            text(row?.id || row?.itemKey) === target.itemKey
        ) : [];
        if (!order || !targetLine || !demand || itemMatches.length !== 1
            || code(demand?.sourceType) !== 'SALES_ORDER'
            || text(demand?.sourceOrderId) !== target.sourceOrderId
            || text(demand?.sourceLineId) !== target.sourceLineId) {
            return fail('MGS_REBIND_TARGET_INVALID', 'Hedef SALES sipariş, PLN ve kalem bağı tekil doğrulanamadı.');
        }
        const targetProductFingerprint = buildMontageProductFingerprint({
            productId: targetLine?.productId,
            variantId: targetLine?.variationId || targetLine?.variantId,
            variantCode: targetLine?.variantCode || targetLine?.variationCode
        });
        if (!targetProductFingerprint) {
            return fail('MGS_REBIND_TARGET_PRODUCT_INVALID', 'Hedef ürün kimliği exact doğrulanamadı.');
        }

        let resolved;
        try {
            resolved = resolve(input);
        } catch (_error) {
            return fail('MGS_REBIND_RESOLVER_FAILED', 'Güncel Sanal Taksim hesabı tamamlanamadı.');
        }
        const invariants = resolved?.diagnostics?.invariants || {};
        const requiredInvariants = [
            'segmentAllocationWithinQty',
            'debtAllocationWithinOpenDebt',
            'sourceAllocationWithinPlannedQty',
            'segmentKeysConsumedOnce',
            'exactHoldQtyWithinPhysical',
            'exactHoldKeysConsumedOnce',
            'exactPrcAndUnitOnly',
            'sourceIdentityExact',
            'originEvidencePreserved'
        ];
        if (requiredInvariants.some((name) => invariants[name] !== true)
            || resolved?.diagnostics?.exactHoldLedger?.valid !== true) {
            return fail('MGS_REBIND_RESOLVER_UNTRUSTED', 'Exact hold defteri güvenilir değildir.');
        }

        const shipments = asArray(input.montageDispatchShipments);
        const plans = asArray(input.montageDispatchPlans);
        const transfers = asArray(input.montageCompletionTransfers);
        const stockRows = asArray(input.stockDepotItems);
        const movements = asArray(input.stock_movements);
        const salesPlans = asArray(input.salesShipmentPlans);
        const salesShipments = asArray(input.salesShipments);
        const shipmentIdCounts = new Map();
        const shipmentNoCounts = new Map();
        shipments.forEach((shipment) => {
            const id = text(shipment?.id);
            const no = code(shipment?.shipmentNo);
            if (id) shipmentIdCounts.set(id, (shipmentIdCounts.get(id) || 0) + 1);
            if (no) shipmentNoCounts.set(no, (shipmentNoCounts.get(no) || 0) + 1);
        });
        const referencesMgs = (row, shipmentId) => {
            if (!row || typeof row !== 'object') return false;
            const keys = ['sourceShipmentId', 'montageShipmentId', 'mgsId', 'sourceMgsId'];
            if (keys.some((key) => text(row?.[key]) === shipmentId)) return true;
            return Object.values(row).some((value) => Array.isArray(value)
                ? value.some((entry) => referencesMgs(entry, shipmentId))
                : value && typeof value === 'object' && referencesMgs(value, shipmentId));
        };
        const candidates = [];

        stableSort(shipments, (shipment, index) =>
            `${text(shipment?.dispatchedAt || shipment?.createdAt)}|${text(shipment?.id)}|${index}`
        ).forEach((shipment) => {
            const shipmentId = text(shipment?.id);
            const shipmentNo = code(shipment?.shipmentNo);
            const item = asArray(shipment?.items).length === 1 ? shipment.items[0] : null;
            const fromTarget = item ? normalizeSalesTarget(item) : null;
            if (!shipmentId || shipmentIdCounts.get(shipmentId) !== 1
                || !shipmentNo || shipmentNoCounts.get(shipmentNo) !== 1
                || code(shipment?.status) !== 'IN_TRANSIT'
                || code(shipment?.stockTransferMode) !== MONTAGE_STOCK_TRANSFER_MODE
                || asArray(shipment?.operationalRebindEvents).length !== 0
                || !item || code(item?.sourceType) !== 'SALES_ORDER'
                || !isCompleteSalesTarget(fromTarget)
                || fromTarget.sourceOrderId === target.sourceOrderId
                || !Number.isSafeInteger(Number(item?.shippedQty))
                || Number(item.shippedQty) <= 0) return;
            const planMatches = plans.filter((plan) => text(plan?.id) === text(shipment?.planId));
            if (planMatches.length !== 1 || code(planMatches[0]?.status) !== 'DISPATCHED_TO_MONTAGE'
                || text(planMatches[0]?.shipmentId) !== shipmentId
                || text(planMatches[0]?.shipmentNo) !== text(shipment?.shipmentNo)) return;
            const planItem = asArray(planMatches[0]?.items).length === 1 ? planMatches[0].items[0] : null;
            if (!planItem
                || !sameSalesTarget(planItem, fromTarget)
                || !Number.isSafeInteger(Number(planItem?.plannedQty))
                || Number(planItem.plannedQty) !== Number(item.shippedQty)
                || buildMontageProductFingerprint(planItem) !== buildMontageProductFingerprint(item)
                || buildMontageRecipeFingerprint(planItem) !== buildMontageRecipeFingerprint(item)) return;
            if (transfers.some((row) => text(row?.sourceShipmentId) === shipmentId)
                || stockRows.some((row) => text(row?.sourceShipmentId || row?.shipmentId) === shipmentId)
                || movements.some((row) => text(row?.shipmentId) === shipmentId)
                || salesPlans.some((row) => referencesMgs(row, shipmentId))
                || salesShipments.some((row) => referencesMgs(row, shipmentId))) return;

            const productFingerprint = buildMontageProductFingerprint(item);
            const recipeFingerprint = buildMontageRecipeFingerprint(item);
            const exactRangeFingerprint = buildMontageExactRangeFingerprint(shipment);
            if (!productFingerprint || productFingerprint !== targetProductFingerprint
                || !recipeFingerprint || !exactRangeFingerprint) return;
            const ranges = getMontageShipmentExactRanges(shipment).map((entry) => entry.range);
            if (!ranges.length || ranges.some((range) =>
                code(range?.sourceType) !== 'SALES_ORDER'
                || !sameSalesTarget(range, fromTarget)
            )) return;

            const requirements = new Map();
            let recipeValid = true;
            for (const part of asArray(item?.recipeParts)) {
                const prcId = text(part?.refId || part?.prcId);
                const prcCode = code(part?.code || part?.prcCode);
                const unit = code(part?.unit);
                const qtyPerSet = Number(part?.qtyPerSet);
                if (!prcId || !prcCode || !unit || !isPositiveQty(qtyPerSet)) {
                    recipeValid = false;
                    break;
                }
                const key = `${prcId}|${prcCode}|${unit}`;
                const current = requirements.get(key);
                if (!current) requirements.set(key, { prcId, prcCode, unit, qtyPerSet: roundQty(qtyPerSet) });
                else current.qtyPerSet = roundQty(current.qtyPerSet + qtyPerSet);
            }
            if (!recipeValid || !requirements.size) return;
            const shippedPartTotals = new Map();
            for (const part of asArray(shipment?.parts)) {
                const prcId = text(part?.refId || part?.prcId);
                const prcCode = code(part?.code || part?.prcCode);
                const unit = code(part?.unit);
                const shippedQty = Number(part?.shippedQty);
                const key = `${prcId}|${prcCode}|${unit}`;
                if (!requirements.has(key) || !isPositiveQty(shippedQty)) {
                    recipeValid = false;
                    break;
                }
                shippedPartTotals.set(key, roundQty((shippedPartTotals.get(key) || 0) + shippedQty));
            }
            if (!recipeValid
                || shippedPartTotals.size !== requirements.size
                || Array.from(requirements.entries()).some(([key, requirement]) =>
                    !sameQty(shippedPartTotals.get(key), Number(item.shippedQty) * requirement.qtyPerSet)
                )) return;
            let targetMaxSetQty = Number.MAX_SAFE_INTEGER;
            for (const requirement of requirements.values()) {
                const debtMatches = asArray(resolved?.debts).filter((debt) =>
                    debt?.debtType === 'SALES'
                    && debt?.allocationEligible === true
                    && text(debt?.originOrderId) === target.sourceOrderId
                    && text(debt?.originOrderLineId) === target.sourceLineId
                    && text(debt?.originDemandId) === target.demandId
                    && text(debt?.originItemKey) === target.itemKey
                    && text(debt?.prcId) === requirement.prcId
                    && code(debt?.prcCode) === requirement.prcCode
                    && code(debt?.unit) === requirement.unit
                    && Number.isFinite(Number(debt?.openDebtQty))
                    && Number(debt.openDebtQty) > EPSILON
                );
                if (debtMatches.length !== 1) {
                    targetMaxSetQty = 0;
                    break;
                }
                targetMaxSetQty = Math.min(
                    targetMaxSetQty,
                    Math.floor((Number(debtMatches[0].openDebtQty) + EPSILON) / requirement.qtyPerSet)
                );
            }
            const setQty = Number(item.shippedQty);
            if (targetMaxSetQty < setQty) return;

            const reservationKeys = ranges.map((range) => text(range?.reservationKey));
            if (reservationKeys.some((keyValue, index) => !keyValue
                || reservationKeys.indexOf(keyValue) !== index)) return;

            candidates.push({
                shipmentId,
                shipmentNo: text(shipment?.shipmentNo),
                planId: text(shipment?.planId),
                planNo: text(shipment?.planNo),
                fromTarget,
                toTarget: target,
                setQty,
                unit: 'ADET',
                productFingerprint,
                recipeFingerprint,
                exactRangeFingerprint,
                rebindKey: buildMontageOperationalRebindKey({
                    shipmentId,
                    fromTarget,
                    toTarget: target,
                    exactRangeFingerprint
                }),
                reservationKeys: reservationKeys.slice().sort(compareText),
                readOnly: true
            });
        });

        const sortedCandidates = stableSort(candidates, (row) =>
            `${String(row.setQty).padStart(16, '0')}|${row.shipmentNo}|${row.shipmentId}`
        );
        return {
            ok: true,
            reasonCode: '',
            message: '',
            target,
            candidates: sortedCandidates,
            totalSelectableSetQty: sortedCandidates.reduce((sum, row) => sum + Number(row.setQty || 0), 0),
            readOnly: true,
            writes: 0
        };
    };

    return {
        VERSION,
        resolve,
        resolveExactSourceSelection,
        resolveDraftPlanBoundRebindSelection,
        resolveInTransitMgsOperationalRebindSelection,
        resolveMontageShipmentOperationalTarget,
        resolveMontageShipmentOperationalItems,
        buildMontageProductFingerprint,
        buildMontageRecipeFingerprint,
        buildMontageExactRangeFingerprint,
        buildMontageOperationalRebindKey,
        resolveExactPrc,
        resolveTransactionRoute,
        resolveMontageLifecycle: (snapshot = {}) => {
            const input = snapshot && typeof snapshot === 'object' ? snapshot : {};
            return resolveMontageLifecycle({
                plans: asArray(input.montageDispatchPlans),
                shipments: asArray(input.montageDispatchShipments),
                transfers: asArray(input.montageCompletionTransfers),
                stockRows: asArray(input.stockDepotItems),
                movements: asArray(input.stock_movements),
                prcIndex: createPrcIndex(input.partComponentCards),
                orders: asArray(input.orders),
                demands: asArray(input.planningDemands)
            });
        }
    };
})();

if (typeof module !== 'undefined' && module?.exports) {
    module.exports = SanalTaksimResolver;
}
