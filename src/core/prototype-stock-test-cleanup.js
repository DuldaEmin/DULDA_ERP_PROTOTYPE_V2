/**
 * DULDA ERP - Prototype STOCK Test Cohort Cleanup
 *
 * STOCK kaynaklı eski test PLN/WO zincirini exact kimliklerle planlar ve
 * atomik apply için deterministik bir manifest üretir. Kaynak stoğa tüketim
 * iadesi yapmaz; yalnız hedef zincire ait kayıtları kaldırır.
 */
const PrototypeStockTestCleanup = (() => {
    const VERSION = '2.0.0';
    const MODE = 'PROTOTYPE_STOCK_TEST_COHORT_CLEANUP_V2';
    const WHOLE_ROW_COLLECTIONS = Object.freeze([
        'planningDemands',
        'workOrders',
        'workOrderTransactions',
        'stock_movements',
        'stockDepotItems',
        'workOrderExternalSupplierAssignments',
        'outsourceTransfers',
        'montageJobDispatches',
        'partWorkOrders'
    ]);
    const SENSITIVE_COLLECTIONS = Object.freeze([
        'orders',
        'montageDispatchPlans',
        'montageDispatchShipments',
        'montageCompletionTransfers',
        'sanalTaksimAllocationInstructions',
        'salesShipmentPlans',
        'salesShipments'
    ]);
    const text = (value) => String(value ?? '').trim();
    const upper = (value) => text(value).toUpperCase();
    const asArray = (value) => (Array.isArray(value) ? value : []);
    const dataRoot = (state) => (state?.data && typeof state.data === 'object' ? state.data : state || {});
    const clone = (value) => JSON.parse(JSON.stringify(value));
    const canonicalize = (value) => {
        if (Array.isArray(value)) return value.map(canonicalize);
        if (!value || typeof value !== 'object') return value;
        return Object.keys(value).sort().reduce((output, key) => {
            output[key] = canonicalize(value[key]);
            return output;
        }, {});
    };
    const canonicalStringify = (value) => JSON.stringify(canonicalize(value));
    const firstDifference = (expected, incoming, path = '$') => {
        if (Object.is(expected, incoming)) return null;
        if (Array.isArray(expected) || Array.isArray(incoming)) {
            if (!Array.isArray(expected) || !Array.isArray(incoming)) return { path, expectedType: typeof expected, incomingType: typeof incoming };
            if (expected.length !== incoming.length) return { path: `${path}.length`, expected: expected.length, incoming: incoming.length };
            for (let index = 0; index < expected.length; index += 1) {
                const difference = firstDifference(expected[index], incoming[index], `${path}[${index}]`);
                if (difference) return difference;
            }
            return null;
        }
        const expectedObject = expected && typeof expected === 'object';
        const incomingObject = incoming && typeof incoming === 'object';
        if (expectedObject || incomingObject) {
            if (!expectedObject || !incomingObject) return { path, expectedType: typeof expected, incomingType: typeof incoming };
            const expectedKeys = Object.keys(expected).sort();
            const incomingKeys = Object.keys(incoming).sort();
            if (JSON.stringify(expectedKeys) !== JSON.stringify(incomingKeys)) {
                return { path, expectedKeys, incomingKeys };
            }
            for (const key of expectedKeys) {
                const difference = firstDifference(expected[key], incoming[key], `${path}.${key}`);
                if (difference) return difference;
            }
            return null;
        }
        return { path, expected, incoming };
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
    const recordId = (row) => text(row?.id);
    const recordCode = (row) => text(row?.demandCode || row?.workOrderCode || row?.dispatchNo
        || row?.movementNo || row?.code || row?.id);
    const workOrderId = (row) => text(row?.workOrderId || row?.sourceWorkOrderId);
    const workOrderCode = (row) => upper(row?.workOrderCode || row?.sourceWorkOrderCode || row?.workOrderText);
    const demandId = (row) => text(row?.demandId || row?.sourceDemandId || row?.planningDemandId);

    const build = (state) => {
        const data = dataRoot(state);
        const issues = [];
        const issueKeys = new Set();
        const addIssue = (reasonCode, message, evidenceIds = []) => {
            const evidence = Array.from(new Set(asArray(evidenceIds).map(text).filter(Boolean))).sort();
            const key = `${reasonCode}|${message}|${evidence.join('|')}`;
            if (issueKeys.has(key)) return;
            issueKeys.add(key);
            issues.push({ reasonCode, message, evidenceIds: evidence });
        };
        const ensureUniqueIds = (collection, rows) => {
            const seen = new Set();
            rows.forEach((row) => {
                const id = recordId(row);
                if (!id || seen.has(id)) {
                    addIssue('TARGET_ID_NOT_UNIQUE', `${collection} hedef kimliği eksik veya mükerrer.`, [id]);
                    return;
                }
                seen.add(id);
            });
        };

        const demands = asArray(data.planningDemands)
            .filter((row) => upper(row?.sourceType) === 'STOCK');
        ensureUniqueIds('planningDemands', demands);
        const demandIds = new Set(demands.map(recordId).filter(Boolean));
        const demandCodes = new Set(demands.map((row) => upper(row?.demandCode)).filter(Boolean));
        if (!demands.length) {
            return {
                contractVersion: 2,
                plannerVersion: VERSION,
                mode: MODE,
                ok: true,
                failClosed: false,
                readOnly: true,
                noOp: true,
                noStockRestore: true,
                issues: [],
                targets: Object.fromEntries(WHOLE_ROW_COLLECTIONS.map((key) => [key, []])),
                partialTargets: { outsourceDispatchDrafts: [], workOrderDispatchNotes: [] },
                summary: { totalDeleted: 0, stockReturnQty: 0 },
                manifestSignature: stableHash('[]')
            };
        }

        const explicitWorkOrderIds = new Set();
        demands.forEach((demand) => {
            [demand?.workOrderId, ...asArray(demand?.workOrderIds)].map(text).filter(Boolean)
                .forEach((id) => explicitWorkOrderIds.add(id));
        });
        const workOrders = asArray(data.workOrders).filter((row) => {
            const id = recordId(row);
            const sourceId = text(row?.sourceId || row?.demandId || row?.planningDemandId);
            const sourceCode = upper(row?.sourceCode || row?.demandCode);
            return explicitWorkOrderIds.has(id)
                || (sourceId && demandIds.has(sourceId))
                || (sourceCode && demandCodes.has(sourceCode));
        });
        ensureUniqueIds('workOrders', workOrders);
        const workOrderIds = new Set(workOrders.map(recordId).filter(Boolean));
        const workOrderCodes = new Set(workOrders.map((row) => upper(row?.workOrderCode)).filter(Boolean));
        explicitWorkOrderIds.forEach((id) => {
            if (!workOrderIds.has(id)) addIssue('LINKED_WORK_ORDER_MISSING', 'STOCK PLN bağlı WO kimliği bulunamadı.', [id]);
        });
        const isLinkedWorkOrder = (row) => {
            const id = workOrderId(row);
            const code = workOrderCode(row);
            return (id && workOrderIds.has(id)) || (code && workOrderCodes.has(code));
        };
        const isLinkedDemand = (row) => {
            const id = demandId(row);
            return id && demandIds.has(id);
        };
        const demandRefKeys = new Set(['demandId', 'sourceDemandId', 'planningDemandId']);
        const workOrderRefKeys = new Set(['workOrderId', 'sourceWorkOrderId']);
        const workOrderCodeKeys = new Set(['workOrderCode', 'sourceWorkOrderCode', 'workOrderText']);
        const hasLinkedIdentityRef = (value) => {
            if (!value || typeof value !== 'object') return false;
            if (Array.isArray(value)) return value.some(hasLinkedIdentityRef);
            return Object.entries(value).some(([key, child]) => {
                const normalized = text(child);
                if (demandRefKeys.has(key) && demandIds.has(normalized)) return true;
                if (workOrderRefKeys.has(key) && workOrderIds.has(normalized)) return true;
                if (workOrderCodeKeys.has(key) && workOrderCodes.has(upper(child))) return true;
                return child && typeof child === 'object' ? hasLinkedIdentityRef(child) : false;
            });
        };

        const transactions = asArray(data.workOrderTransactions).filter(isLinkedWorkOrder);
        const movements = asArray(data.stock_movements).filter((row) => isLinkedWorkOrder(row) || isLinkedDemand(row));
        movements.forEach((row) => {
            const type = upper(row?.movementType || row?.type);
            if (!['WORK_ORDER_ISSUE', 'STORE'].includes(type)) {
                addIssue('STOCK_MOVEMENT_TYPE_UNSUPPORTED', `STOCK test hareket türü güvenli temizlenemedi: ${type || '-'}.`, [row?.id]);
            }
        });
        const derivedStockRows = asArray(data.stockDepotItems).filter((row) =>
            upper(row?.sourceType) === 'STOCK' && demandIds.has(text(row?.demandId || row?.sourceDemandId)));
        derivedStockRows.forEach((row) => {
            const amount = Number(row?.qty ?? row?.quantity ?? row?.amount ?? 0);
            if (!Number.isFinite(amount) || amount < 0) {
                addIssue('DERIVED_STOCK_QTY_INVALID', 'STOCK test türetilmiş stok miktarı geçersiz.', [row?.id]);
            }
        });
        const assignments = asArray(data.workOrderExternalSupplierAssignments).filter(isLinkedWorkOrder);
        const outsourceTransfers = asArray(data.outsourceTransfers).filter(isLinkedWorkOrder);
        const montageDispatches = asArray(data.montageJobDispatches)
            .filter((row) => isLinkedWorkOrder(row) || isLinkedDemand(row));
        const partWorkOrders = asArray(data.partWorkOrders).filter(isLinkedWorkOrder);

        const transformDraft = (draft) => {
            let changed = false;
            const items = asArray(draft?.items).map((item) => {
                const refs = asArray(item?.workOrderRefs);
                const keptRefs = refs.filter((ref) => !isLinkedWorkOrder(ref));
                if (keptRefs.length === refs.length) return item;
                changed = true;
                if (!keptRefs.length) return null;
                const qty = keptRefs.reduce((sum, ref) => sum + Number(ref?.qty || 0), 0);
                return { ...item, workOrderRefs: keptRefs, qty };
            }).filter(Boolean);
            if (!changed) return { changed: false, next: draft };
            return { changed: true, next: items.length ? { ...draft, items } : null };
        };
        const draftTargets = asArray(data.outsourceDispatchDrafts).map((row) => {
            const transformed = transformDraft(row);
            return transformed.changed ? { id: recordId(row), next: transformed.next } : null;
        }).filter(Boolean);
        const noteTargets = asArray(data.workOrderDispatchNotes).map((note) => {
            const rows = asArray(note?.rows);
            const keptRows = rows.filter((row) => !isLinkedWorkOrder(row));
            if (keptRows.length === rows.length) return null;
            return { id: recordId(note), next: keptRows.length ? { ...note, rows: keptRows } : null };
        }).filter(Boolean);

        const targetStockIds = new Set(derivedStockRows.map(recordId));
        const stockRefKeys = new Set([
            'stockRowId', 'stockItemId', 'stockDepotItemId', 'sourceStockItemId', 'sourceStockDepotItemId',
            'targetStockDepotItemId', 'outputStockItemId', 'finishedProductStockItemId'
        ]);
        const hasTargetStockRef = (value) => {
            if (!value || typeof value !== 'object') return false;
            if (Array.isArray(value)) return value.some(hasTargetStockRef);
            return Object.entries(value).some(([key, child]) =>
                (stockRefKeys.has(key) && targetStockIds.has(text(child)))
                || (child && typeof child === 'object' && hasTargetStockRef(child)));
        };
        const targetMovementIds = new Set(movements.map(recordId));
        const foreignStockRefs = [
            ...asArray(data.stock_movements).filter((row) => !targetMovementIds.has(recordId(row))),
            ...SENSITIVE_COLLECTIONS.flatMap((key) => asArray(data[key]))
        ].filter(hasTargetStockRef);
        if (foreignStockRefs.length) {
            addIssue('DERIVED_STOCK_HAS_FOREIGN_REFERENCE', 'STOCK test çıktı satırı yabancı fiziksel kayıt tarafından kullanılıyor.',
                foreignStockRefs.map(recordId));
        }
        SENSITIVE_COLLECTIONS.forEach((collection) => {
            const hits = asArray(data[collection]).filter(hasLinkedIdentityRef);
            if (hits.length) {
                addIssue('STOCK_CHAIN_HAS_SENSITIVE_REFERENCE', `${collection} içinde STOCK test zincirine bağlı paylaşımlı kayıt bulundu.`,
                    hits.map(recordId));
            }
        });

        const targets = {
            planningDemands: demands,
            workOrders,
            workOrderTransactions: transactions,
            stock_movements: movements,
            stockDepotItems: derivedStockRows,
            workOrderExternalSupplierAssignments: assignments,
            outsourceTransfers,
            montageJobDispatches: montageDispatches,
            partWorkOrders
        };
        Object.entries(targets).forEach(([collection, rows]) => ensureUniqueIds(collection, rows));
        const descriptors = Object.entries(targets).flatMap(([collection, rows]) => rows.map((row) => ({
            collection,
            id: recordId(row),
            code: recordCode(row),
            record: row
        }))).sort((left, right) => `${left.collection}|${left.id}`.localeCompare(`${right.collection}|${right.id}`));
        const signaturePayload = {
            targets: descriptors,
            outsourceDispatchDrafts: draftTargets,
            workOrderDispatchNotes: noteTargets,
            noStockRestore: true
        };
        const summaryByCollection = Object.fromEntries(Object.entries(targets)
            .map(([collection, rows]) => [collection, rows.length]));
        const partialDeleteCount = draftTargets.filter((row) => row.next === null).length
            + noteTargets.filter((row) => row.next === null).length;
        return {
            contractVersion: 2,
            plannerVersion: VERSION,
            mode: MODE,
            ok: issues.length === 0,
            failClosed: issues.length > 0,
            readOnly: true,
            noOp: false,
            noStockRestore: true,
            issues,
            targets: Object.fromEntries(Object.entries(targets).map(([key, rows]) => [key, rows.map((row) => ({
                id: recordId(row), code: recordCode(row)
            }))])),
            partialTargets: {
                outsourceDispatchDrafts: draftTargets,
                workOrderDispatchNotes: noteTargets
            },
            summary: {
                ...summaryByCollection,
                outsourceDispatchDrafts: draftTargets.length,
                workOrderDispatchNotes: noteTargets.length,
                totalDeleted: descriptors.length + partialDeleteCount,
                stockReturnQty: 0
            },
            manifestSignature: stableHash(JSON.stringify(signaturePayload))
        };
    };

    const apply = (state, approvedPlan) => {
        const currentPlan = build(state);
        if (!currentPlan.ok) return { ok: false, code: 'STOCK_CLEANUP_UNCERTAIN', issues: currentPlan.issues };
        if (!approvedPlan || text(approvedPlan?.manifestSignature) !== currentPlan.manifestSignature) {
            return { ok: false, code: 'STOCK_CLEANUP_STALE_PLAN', issues: [] };
        }
        if (currentPlan.noOp) return { ok: true, noOp: true, plan: currentPlan, summary: currentPlan.summary };
        const data = dataRoot(state);
        Object.entries(currentPlan.targets).forEach(([collection, rows]) => {
            const ids = new Set(rows.map((row) => text(row?.id)).filter(Boolean));
            if (Array.isArray(data[collection])) data[collection] = data[collection].filter((row) => !ids.has(recordId(row)));
        });
        Object.entries(currentPlan.partialTargets).forEach(([collection, entries]) => {
            if (!Array.isArray(data[collection]) || !entries.length) return;
            const byId = new Map(entries.map((entry) => [text(entry?.id), entry?.next]));
            data[collection] = data[collection].map((row) => {
                const id = recordId(row);
                return byId.has(id) ? byId.get(id) : row;
            }).filter(Boolean);
        });
        return { ok: true, noOp: false, plan: currentPlan, summary: currentPlan.summary };
    };

    const diagnoseTransition = (currentState, incomingState, approval) => {
        if (text(approval?.type) !== 'stock_demand_demo_cleanup'
            || Number(approval?.meta?.stockCleanupVersion) !== 2
            || approval?.meta?.noStockRestore !== true) return { ok: false, reasonCode: 'APPROVAL_INVALID' };
        const plan = build(currentState);
        if (!plan.ok) return { ok: false, reasonCode: 'CURRENT_PLAN_UNCERTAIN', issues: plan.issues };
        if (plan.noOp) return { ok: false, reasonCode: 'CURRENT_PLAN_EMPTY' };
        if (text(approval?.meta?.manifestSignature) !== plan.manifestSignature) {
            return { ok: false, reasonCode: 'MANIFEST_SIGNATURE_MISMATCH', expected: plan.manifestSignature };
        }
        const expected = clone(currentState);
        const applied = apply(expected, plan);
        if (!applied.ok) return { ok: false, reasonCode: 'EXPECTED_APPLY_FAILED', code: applied.code };
        const expectedData = canonicalStringify(dataRoot(expected));
        const incomingData = canonicalStringify(dataRoot(incomingState));
        if (expectedData !== incomingData) {
            return {
                ok: false,
                reasonCode: 'INCOMING_DATA_MISMATCH',
                expectedHash: stableHash(expectedData),
                incomingHash: stableHash(incomingData),
                difference: firstDifference(dataRoot(expected), dataRoot(incomingState))
            };
        }
        const currentMeta = clone(currentState?.meta || {});
        const incomingMeta = clone(incomingState?.meta || {});
        delete currentMeta.updated_at;
        delete incomingMeta.updated_at;
        if (canonicalStringify(currentMeta) !== canonicalStringify(incomingMeta)) {
            return { ok: false, reasonCode: 'INCOMING_META_MISMATCH' };
        }
        return { ok: true, reasonCode: '' };
    };
    const verifyTransition = (currentState, incomingState, approval) =>
        diagnoseTransition(currentState, incomingState, approval).ok === true;

    return {
        VERSION, MODE, WHOLE_ROW_COLLECTIONS, SENSITIVE_COLLECTIONS,
        build, apply, diagnoseTransition, verifyTransition, clone
    };
})();

if (typeof module !== 'undefined' && module?.exports) module.exports = PrototypeStockTestCleanup;
