/**
 * DULDA ERP - Prototype Test Cohort / Clean Baseline Planner
 *
 * Saf ve salt okunur FAZ 1 planner. Bu modül state üzerinde mutation, apply
 * veya save yapmaz; yalnız kanıta dayalı KEEP / DELETE /
 * RESET_TO_BASELINE / UNCERTAIN manifesti üretir.
 */
const PrototypeTestCohortPlanner = (() => {
    const VERSION = '1.0.0';
    const EPSILON = 0.000001;
    const ACTIONS = Object.freeze({
        KEEP: 'KEEP',
        DELETE: 'DELETE',
        RESET_TO_BASELINE: 'RESET_TO_BASELINE',
        UNCERTAIN: 'UNCERTAIN'
    });

    const OPERATIONAL_COLLECTIONS = Object.freeze([
        'orders',
        'planningDemands',
        'workOrders',
        'workOrderTransactions',
        'workOrderExternalSupplierAssignments',
        'outsourceDispatchDrafts',
        'outsourceTransfers',
        'workOrderDispatchNotes',
        'montageJobDispatches',
        'partWorkOrders',
        'montageDispatchPlans',
        'montageDispatchShipments',
        'montageCompletionTransfers',
        'sanalTaksimAllocationInstructions',
        'salesShipmentPlans',
        'salesShipments'
    ]);

    const MASTER_COLLECTIONS = Object.freeze([
        'products', 'customers', 'suppliers', 'personnel', 'units', 'machines',
        'productCategories', 'stockDepots', 'stockDepotLocations',
        'partComponentCards', 'colorLibrary', 'salesCatalogProducts',
        'salesProductVariants', 'salesAnchorageProducts', 'catalogProductVariants',
        'montageCards', 'cncCards', 'plexiPolishCards', 'pvdCards',
        'eloksalCards', 'ibrahimPolishCards', 'extruderLibraryCards',
        'semiFinishedCards', 'externalProcessSupplierLinks'
    ]);

    const OPERATIONAL_MOVEMENT_TYPES = new Set([
        'STORE', 'WORK_ORDER_ISSUE', 'TRANSFER',
        'MONTAGE_DISPATCH_OUT', 'MONTAGE_DISPATCH_RECEIPT',
        'MONTAGE_COMPONENT_CONSUMPTION', 'MONTAGE_FINISHED_PRODUCT_IN',
        'SALES_COMPONENT_SURPLUS_RELEASE', 'SALES_SHIPMENT_OUT'
    ]);

    const STOCK_REFERENCE_KEYS = new Set([
        'stockRowId', 'stockItemId', 'stockDepotItemId',
        'sourceStockItemId', 'sourceStockDepotItemId',
        'targetStockItemId', 'targetStockDepotItemId',
        'outputStockItemId', 'finishedProductStockItemId'
    ]);

    const text = (value) => String(value ?? '').trim();
    const upper = (value) => text(value).toUpperCase();
    const asArray = (value) => (Array.isArray(value) ? value : []);
    const qty = (value) => Number(value ?? 0);
    const sameQty = (left, right) => Number.isFinite(qty(left))
        && Number.isFinite(qty(right))
        && Math.abs(qty(left) - qty(right)) <= EPSILON;
    const compareText = (left, right) => text(left).localeCompare(text(right), 'tr');
    const dataRoot = (state) => (state?.data && typeof state.data === 'object' ? state.data : state || {});
    const recordId = (record, index) => text(record?.id) || `@index:${index}`;
    const recordCode = (record) => text(record?.orderNo || record?.orderCode
        || record?.demandCode || record?.workOrderCode || record?.docNo
        || record?.planNo || record?.shipmentNo || record?.transferNo
        || record?.instructionCode || record?.dispatchNo || record?.code);
    const getRowQty = (row) => qty(row?.qty ?? row?.quantity ?? row?.amount);

    const manualDocNoFromStockRow = (row) => {
        const match = text(row?.note).match(/(?:^|\s|\/)\s*(EK-\d{4}-(?:\d{6}|[1-9]\d{6,}))(?:\s|$)/i);
        return match ? upper(match[1]) : '';
    };

    const collectStockReferences = (value, parentKey = '', output = new Set()) => {
        if (value == null) return output;
        if (typeof value === 'string') {
            if (STOCK_REFERENCE_KEYS.has(parentKey)) {
                const normalized = text(value).replace(/^STOCK\|/i, '');
                if (normalized) output.add(normalized);
            }
            return output;
        }
        if (Array.isArray(value)) {
            value.forEach((child) => collectStockReferences(child, parentKey, output));
            return output;
        }
        if (typeof value === 'object') {
            Object.entries(value).forEach(([key, child]) => collectStockReferences(child, key, output));
        }
        return output;
    };

    const visitRangeObjects = (value, callback) => {
        if (!value || typeof value !== 'object') return;
        if (Array.isArray(value)) {
            value.forEach((child) => visitRangeObjects(child, callback));
            return;
        }
        const hasStart = Object.prototype.hasOwnProperty.call(value, 'segmentOffsetStart');
        const hasEnd = Object.prototype.hasOwnProperty.call(value, 'segmentOffsetEnd');
        if (hasStart || hasEnd) callback(value);
        Object.values(value).forEach((child) => {
            if (child && typeof child === 'object') visitRangeObjects(child, callback);
        });
    };

    const stableHash = (value) => {
        const input = text(value);
        let hash = 2166136261;
        for (let index = 0; index < input.length; index += 1) {
            hash ^= input.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
    };

    const build = (state, options = {}) => {
        const data = dataRoot(state);
        const classifications = {
            [ACTIONS.KEEP]: [],
            [ACTIONS.DELETE]: [],
            [ACTIONS.RESET_TO_BASELINE]: [],
            [ACTIONS.UNCERTAIN]: []
        };
        const classifiedByKey = new Map();
        const issues = [];
        const issueKeys = new Set();
        const baselineDocNos = Array.from(new Set(asArray(options?.baselineManualEntryDocNos)
            .map(upper).filter(Boolean))).sort(compareText);
        const testSeedLocationCodes = new Set(asArray(options?.testSeedLocationCodes)
            .map(upper).filter(Boolean));

        const addIssue = (reasonCode, message, evidenceIds = []) => {
            const normalizedEvidenceIds = Array.from(new Set(asArray(evidenceIds)
                .map(text).filter(Boolean))).sort(compareText);
            const key = `${reasonCode}|${message}|${normalizedEvidenceIds.join('|')}`;
            if (issueKeys.has(key)) return;
            issueKeys.add(key);
            const issue = { reasonCode, message, evidenceIds: normalizedEvidenceIds };
            issues.push(issue);
            classifications[ACTIONS.UNCERTAIN].push({
                collection: 'diagnostics',
                id: reasonCode,
                code: reasonCode,
                action: ACTIONS.UNCERTAIN,
                reasonCodes: [reasonCode],
                evidenceIds: normalizedEvidenceIds,
                message
            });
        };

        const classify = (collection, record, index, action, reasonCodes = [], evidenceIds = [], extra = {}) => {
            const id = recordId(record, index);
            const key = `${collection}|${id}|${index}`;
            const normalizedReasons = Array.from(new Set(asArray(reasonCodes).map(text).filter(Boolean))).sort(compareText);
            const normalizedEvidence = Array.from(new Set(asArray(evidenceIds).map(text).filter(Boolean))).sort(compareText);
            const previous = classifiedByKey.get(key);
            if (previous) {
                if (previous.action !== action) {
                    addIssue('CLASSIFICATION_CONFLICT',
                        `Aynı kayıt birden fazla aksiyona sınıflandı: ${collection}/${id}.`,
                        [id, previous.action, action]);
                }
                return previous;
            }
            const descriptor = {
                collection,
                id,
                code: recordCode(record),
                action,
                reasonCodes: normalizedReasons,
                evidenceIds: normalizedEvidence,
                ...extra
            };
            classifiedByKey.set(key, descriptor);
            classifications[action].push(descriptor);
            return descriptor;
        };

        if (!baselineDocNos.length) {
            addIssue('BASELINE_POLICY_MISSING', 'Prototype baseline manuel giriş belge listesi verilmedi.');
        }

        const manualEntries = asArray(data.stockManualEntries);
        const movements = asArray(data.stock_movements);
        const stockRows = asArray(data.stockDepotItems);
        const movementIndexes = new Map(movements.map((row, index) => [row, index]));
        const stockIndexes = new Map(stockRows.map((row, index) => [row, index]));
        const manualIndexes = new Map(manualEntries.map((row, index) => [row, index]));
        const selectedBaselineEntryIds = new Set();
        const selectedBaselineMovementIds = new Set();
        const selectedBaselineStockIds = new Set();
        let baselineQtyTotal = 0;

        baselineDocNos.forEach((docNo) => {
            const entries = manualEntries.filter((row) => upper(row?.docNo) === docNo);
            const docMovements = movements.filter((row) => upper(row?.movementType || row?.type) === 'MANUAL_ENTRY'
                && upper(row?.docNo) === docNo);
            const docStockRows = stockRows.filter((row) => manualDocNoFromStockRow(row) === docNo);
            if (entries.length !== 1 || docMovements.length !== 1 || docStockRows.length !== 1) {
                addIssue('BASELINE_DOCUMENT_LINK_NOT_UNIQUE',
                    `Baseline belgesi manuel giriş, movement ve stock row ile tekil bağlanamadı: ${docNo}.`,
                    [docNo, ...entries.map((row) => row?.id), ...docMovements.map((row) => row?.id), ...docStockRows.map((row) => row?.id)]);
                return;
            }
            const entry = entries[0];
            const movement = docMovements[0];
            const stockRow = docStockRows[0];
            const expectedQty = qty(entry?.qty);
            const identityExact = text(entry?.productId || entry?.productRefId) === text(stockRow?.productId)
                && upper(entry?.productCode) === upper(stockRow?.productCode || stockRow?.code)
                && upper(entry?.unit) === upper(stockRow?.unit)
                && text(entry?.depotId) === text(stockRow?.depotId)
                && text(entry?.locationId) === text(stockRow?.locationId)
                && upper(entry?.productCode) === upper(movement?.productCode || movement?.code)
                && upper(entry?.unit) === upper(movement?.unit)
                && text(entry?.depotId) === text(movement?.depotId)
                && text(entry?.locationId) === text(movement?.locationId)
                && expectedQty > 0
                && sameQty(expectedQty, movement?.qty ?? movement?.quantity);
            if (!identityExact) {
                addIssue('BASELINE_DOCUMENT_IDENTITY_CONFLICT',
                    `Baseline belgesi exact ürün/depo/lokasyon/miktar kanıtıyla uyuşmuyor: ${docNo}.`,
                    [docNo, entry?.id, movement?.id, stockRow?.id]);
                return;
            }
            selectedBaselineEntryIds.add(text(entry?.id));
            selectedBaselineMovementIds.add(text(movement?.id));
            selectedBaselineStockIds.add(text(stockRow?.id));
            baselineQtyTotal += expectedQty;
            classify('stockManualEntries', entry, manualIndexes.get(entry), ACTIONS.KEEP,
                ['AUTHORITATIVE_BASELINE_DOCUMENT'], [docNo, movement?.id, stockRow?.id],
                { baselineQty: expectedQty });
            classify('stock_movements', movement, movementIndexes.get(movement), ACTIONS.KEEP,
                ['AUTHORITATIVE_BASELINE_MOVEMENT'], [docNo, entry?.id, stockRow?.id],
                { baselineQty: expectedQty });
            classify('stockDepotItems', stockRow, stockIndexes.get(stockRow),
                sameQty(getRowQty(stockRow), expectedQty) ? ACTIONS.KEEP : ACTIONS.RESET_TO_BASELINE,
                [sameQty(getRowQty(stockRow), expectedQty)
                    ? 'AUTHORITATIVE_BASELINE_STOCK' : 'BASELINE_QTY_DRIFT'],
                [docNo, entry?.id, movement?.id],
                { currentQty: getRowQty(stockRow), baselineQty: expectedQty });
        });

        manualEntries.forEach((entry, index) => {
            if (selectedBaselineEntryIds.has(text(entry?.id))) return;
            const docNo = upper(entry?.docNo);
            const isTestSeed = testSeedLocationCodes.has(upper(entry?.locationCode));
            if (!isTestSeed) {
                classify('stockManualEntries', entry, index, ACTIONS.UNCERTAIN,
                    ['NON_BASELINE_MANUAL_ENTRY_UNCLASSIFIED'], [docNo]);
                addIssue('NON_BASELINE_MANUAL_ENTRY_UNCLASSIFIED',
                    `Baseline dışı manuel giriş test seed kanıtına bağlı değil: ${docNo || entry?.id || '-'}.`,
                    [entry?.id, docNo]);
                return;
            }
            const docMovements = movements.filter((row) => upper(row?.movementType || row?.type) === 'MANUAL_ENTRY'
                && upper(row?.docNo) === docNo);
            const docStockRows = stockRows.filter((row) => manualDocNoFromStockRow(row) === docNo);
            if (!docNo || docMovements.length !== 1 || docStockRows.length !== 1) {
                classify('stockManualEntries', entry, index, ACTIONS.UNCERTAIN,
                    ['TEST_SEED_LINK_NOT_UNIQUE'], [docNo]);
                addIssue('TEST_SEED_LINK_NOT_UNIQUE',
                    `Test seed manuel giriş movement ve stock row ile tekil bağlanamadı: ${docNo || entry?.id || '-'}.`,
                    [entry?.id, docNo]);
                return;
            }
            classify('stockManualEntries', entry, index, ACTIONS.DELETE,
                ['EXPLICIT_TEST_SEED_LOCATION'], [docNo, docMovements[0]?.id, docStockRows[0]?.id]);
            classify('stock_movements', docMovements[0], movementIndexes.get(docMovements[0]), ACTIONS.DELETE,
                ['EXPLICIT_TEST_SEED_MOVEMENT'], [docNo, entry?.id, docStockRows[0]?.id]);
            classify('stockDepotItems', docStockRows[0], stockIndexes.get(docStockRows[0]), ACTIONS.DELETE,
                ['EXPLICIT_TEST_SEED_STOCK'], [docNo, entry?.id, docMovements[0]?.id]);
        });

        OPERATIONAL_COLLECTIONS.forEach((collection) => {
            asArray(data[collection]).forEach((record, index) => {
                classify(collection, record, index, ACTIONS.DELETE,
                    ['FULL_OPERATIONAL_TEST_COHORT'], [record?.id]);
            });
        });

        const deleteStockReferences = new Set();
        classifications[ACTIONS.DELETE].forEach((descriptor) => {
            const rows = asArray(data[descriptor.collection]);
            const source = rows.find((row, index) => recordId(row, index) === descriptor.id);
            if (source) collectStockReferences(source).forEach((id) => deleteStockReferences.add(id));
        });

        movements.forEach((movement, index) => {
            if (selectedBaselineMovementIds.has(text(movement?.id))) return;
            const key = `stock_movements|${recordId(movement, index)}|${index}`;
            if (classifiedByKey.has(key)) {
                collectStockReferences(movement).forEach((id) => deleteStockReferences.add(id));
                return;
            }
            const movementType = upper(movement?.movementType || movement?.type);
            if (OPERATIONAL_MOVEMENT_TYPES.has(movementType)) {
                classify('stock_movements', movement, index, ACTIONS.DELETE,
                    ['OPERATIONAL_TEST_LEDGER_MOVEMENT'], [movement?.id, movementType]);
                collectStockReferences(movement).forEach((id) => deleteStockReferences.add(id));
                return;
            }
            classify('stock_movements', movement, index, ACTIONS.UNCERTAIN,
                ['MOVEMENT_TYPE_UNCLASSIFIED'], [movement?.id, movementType]);
            addIssue('MOVEMENT_TYPE_UNCLASSIFIED',
                `Baseline dışı stock movement güvenli test türüne sınıflanamadı: ${movementType || movement?.id || '-'}.`,
                [movement?.id]);
        });

        stockRows.forEach((row, index) => {
            if (selectedBaselineStockIds.has(text(row?.id))) return;
            const key = `stockDepotItems|${recordId(row, index)}|${index}`;
            if (classifiedByKey.has(key)) return;
            const rowId = text(row?.id);
            const hasOperationalDepotReceiptMarker = /^Depoya alindi\s*:/i.test(text(row?.note));
            const knownOperationalOrigin = ['SALES_ORDER', 'STOCK'].includes(upper(row?.sourceType))
                || upper(row?.stockClass) === 'MONTAGE_RECEIVED'
                || hasOperationalDepotReceiptMarker
                || deleteStockReferences.has(rowId);
            if (knownOperationalOrigin) {
                classify('stockDepotItems', row, index, ACTIONS.DELETE,
                    ['EXACT_OPERATIONAL_PROVENANCE'], [rowId, row?.sourceOrderId, row?.demandId,
                        row?.sourceShipmentId, row?.completionTransferId]);
                return;
            }
            classify('stockDepotItems', row, index, ACTIONS.UNCERTAIN,
                ['PHYSICAL_STOCK_PROVENANCE_UNCLASSIFIED'], [rowId]);
            addIssue('PHYSICAL_STOCK_PROVENANCE_UNCLASSIFIED',
                `Baseline dışı fiziksel stock row exact test provenance taşımıyor: ${rowId || '-'}.`,
                [rowId]);
        });

        const allPhysicalRecords = [
            ...OPERATIONAL_COLLECTIONS,
            'stock_movements', 'stockDepotItems'
        ].flatMap((collection) => asArray(data[collection]).map((record) => ({ collection, record })));
        allPhysicalRecords.forEach(({ collection, record }) => {
            visitRangeObjects(record, (range) => {
                const physicalSegmentId = text(range?.physicalSegmentId);
                const stockRowId = text(range?.stockRowId || range?.stockDepotItemId);
                const start = Number(range?.segmentOffsetStart);
                const end = Number(range?.segmentOffsetEnd);
                const amount = Number(range?.qty ?? range?.reservedQty);
                const exact = physicalSegmentId && stockRowId
                    && Number.isFinite(start) && Number.isFinite(end) && Number.isFinite(amount)
                    && start >= 0 && end > start && amount > 0 && sameQty(end - start, amount)
                    && (!/^STOCK\|/i.test(physicalSegmentId) || physicalSegmentId === `STOCK|${stockRowId}`);
                if (!exact) {
                    addIssue('PHYSICAL_RANGE_INVALID',
                        `Exact physical segment/range kanıtı geçersiz: ${collection}/${recordId(record, 0)}.`,
                        [record?.id, physicalSegmentId, stockRowId]);
                }
            });
        });

        const plans = asArray(data.montageDispatchPlans);
        const shipments = asArray(data.montageDispatchShipments);
        const transfers = asArray(data.montageCompletionTransfers);
        shipments.forEach((shipment) => {
            const shipmentId = text(shipment?.id);
            const planId = text(shipment?.planId);
            const planMatches = plans.filter((row) => text(row?.id) === planId);
            if (!shipmentId || planMatches.length !== 1) {
                addIssue('MGS_PLAN_LINK_INVALID',
                    `MGS exact MGP bağı tekil değil: ${recordCode(shipment) || shipmentId || '-'}.`,
                    [shipmentId, planId]);
                return;
            }
            const plan = planMatches[0];
            const planReservationKeys = new Set(asArray(plan?.exactReservations)
                .map((row) => text(row?.reservationKey)).filter(Boolean));
            asArray(shipment?.parts).forEach((part) => {
                asArray(part?.allocations).forEach((allocation) => {
                    const allocationKeys = asArray(allocation?.exactReservationKeys)
                        .map(text).filter(Boolean);
                    const ranges = asArray(allocation?.segmentRanges);
                    if (planReservationKeys.size > 0
                        && (!allocationKeys.length
                            || allocationKeys.some((key) => !planReservationKeys.has(key)))) {
                        addIssue('EXACT_RESERVATION_LINK_INVALID',
                            `MGS allocation exact reservation bağı MGP kanıtıyla uyuşmuyor: ${recordCode(shipment) || shipmentId}.`,
                            [shipmentId, planId, ...allocationKeys]);
                    }
                    if (ranges.some((range) => !allocationKeys.includes(text(range?.reservationKey))
                        || text(range?.planId) !== planId)) {
                        addIssue('EXACT_RESERVATION_RANGE_LINK_INVALID',
                            `MGS segment range reservation/plan bağı geçersiz: ${recordCode(shipment) || shipmentId}.`,
                            [shipmentId, planId]);
                    }
                });
            });
        });
        transfers.forEach((transfer) => {
            const transferId = text(transfer?.id);
            const shipmentId = text(transfer?.sourceShipmentId || transfer?.shipmentId);
            if (!transferId || shipments.filter((row) => text(row?.id) === shipmentId).length !== 1) {
                addIssue('MCT_SHIPMENT_LINK_INVALID',
                    `MCT exact MGS bağı tekil değil: ${recordCode(transfer) || transferId || '-'}.`,
                    [transferId, shipmentId]);
                return;
            }
            if (upper(transfer?.status) === 'POSTED') {
                const outputStockId = text(transfer?.finishedProductStockItemId);
                const outputMovementId = text(transfer?.finishedProductMovementId);
                if (!outputStockId || stockRows.filter((row) => text(row?.id) === outputStockId).length !== 1
                    || !outputMovementId || movements.filter((row) => text(row?.id) === outputMovementId).length !== 1) {
                    addIssue('MCT_POSTED_OUTPUT_LINK_INVALID',
                        `POSTED MCT finished stock/movement bağı tekil değil: ${recordCode(transfer) || transferId}.`,
                        [transferId, outputStockId, outputMovementId]);
                }
            }
        });
        plans.forEach((plan) => {
            const audit = plan?.rebindAudit;
            if (!audit) return;
            const sourcePlanId = text(audit?.sourcePlanId);
            const targetPlanId = text(audit?.targetPlanId);
            const exact = text(audit?.rebindKey)
                && ['SOURCE', 'TARGET'].includes(upper(audit?.role))
                && plans.filter((row) => text(row?.id) === sourcePlanId).length === 1
                && plans.filter((row) => text(row?.id) === targetPlanId).length === 1
                && asArray(audit?.exactReservations).length > 0;
            if (!exact) {
                addIssue('OPERATIONAL_REBIND_INVALID',
                    `Operational rebind exact source/target/range kanıtı geçersiz: ${recordCode(plan) || plan?.id || '-'}.`,
                    [plan?.id, sourcePlanId, targetPlanId]);
            }
        });

        Object.values(classifications).forEach((rows) => rows.sort((left, right) =>
            `${left.collection}|${left.code}|${left.id}`.localeCompare(
                `${right.collection}|${right.code}|${right.id}`, 'tr')));
        issues.sort((left, right) => `${left.reasonCode}|${left.message}`
            .localeCompare(`${right.reasonCode}|${right.message}`, 'tr'));
        const manifestRows = Object.entries(classifications).flatMap(([action, rows]) => rows.map((row) => ({
            action,
            collection: row.collection,
            id: row.id,
            code: row.code,
            reasonCodes: row.reasonCodes,
            currentQty: row.currentQty,
            baselineQty: row.baselineQty
        }))).sort((left, right) => `${left.action}|${left.collection}|${left.id}`
            .localeCompare(`${right.action}|${right.collection}|${right.id}`, 'tr'));

        return {
            contractVersion: 1,
            plannerVersion: VERSION,
            mode: 'PROTOTYPE_TEST_COHORT_BASELINE_PLAN_V1',
            ok: issues.length === 0,
            failClosed: issues.length > 0,
            readOnly: true,
            writes: 0,
            classifications,
            uncertainties: issues,
            baseline: {
                manualEntryDocNos: baselineDocNos,
                manualEntryCount: classifications[ACTIONS.KEEP]
                    .filter((row) => row.collection === 'stockManualEntries').length,
                movementCount: classifications[ACTIONS.KEEP]
                    .filter((row) => row.collection === 'stock_movements').length,
                stockRowCount: [...classifications[ACTIONS.KEEP], ...classifications[ACTIONS.RESET_TO_BASELINE]]
                    .filter((row) => row.collection === 'stockDepotItems').length,
                authoritativeQtyTotal: Number(baselineQtyTotal.toFixed(6))
            },
            protectedMasterCollections: MASTER_COLLECTIONS.map((collection) => ({
                collection,
                count: asArray(data[collection]).length
            })),
            summary: Object.fromEntries(Object.entries(classifications)
                .map(([action, rows]) => [action, rows.length])),
            manifestSignature: stableHash(JSON.stringify(manifestRows))
        };
    };

    return {
        VERSION,
        ACTIONS,
        OPERATIONAL_COLLECTIONS,
        MASTER_COLLECTIONS,
        build
    };
})();

if (typeof module !== 'undefined' && module?.exports) {
    module.exports = PrototypeTestCohortPlanner;
}
