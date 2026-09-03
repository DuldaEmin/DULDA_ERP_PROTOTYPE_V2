/**
 * DULDA ERP - Prototype Combined Test Cohort Atomic Cleanup
 *
 * FAZ 1 cohort/baseline manifestini tek atomik apply sözleşmesine dönüştürür.
 * DELETE kayıtlarını kaldırır, authoritative baseline stock satırlarını resetler
 * ve master/sayaç verilerine dokunmaz.
 */
const PrototypeSalesTestCohortCleanup = (() => {
    const VERSION = '6.0.0';
    const MODE = 'PROTOTYPE_COMBINED_TEST_COHORT_ATOMIC_CLEANUP_V6';
    const BASELINE_DOC_NOS = Object.freeze(
        Array.from({ length: 9 }, (_, index) => `EK-2026-${String(index + 1).padStart(6, '0')}`)
    );
    const TEST_SEED_LOCATION_CODES = Object.freeze(['FAZ5-TEST-01']);
    const getOperationalCodePolicy = () => {
        if (typeof OperationalCodeHighWater !== 'undefined') return OperationalCodeHighWater;
        if (typeof require === 'function') return require('./operational-code-high-water.js');
        return null;
    };
    const OPERATIONAL_CODE_SPECS = Object.freeze(
        (getOperationalCodePolicy()?.SPECS || []).map((spec) => Object.freeze({
            prefix: spec.prefix,
            collection: spec.collection,
            fields: [...spec.fields]
        }))
    );
    const text = (value) => String(value ?? '').trim();
    const upper = (value) => text(value).toUpperCase();
    const asArray = (value) => (Array.isArray(value) ? value : []);
    const clone = (value) => JSON.parse(JSON.stringify(value));
    const dataRoot = (state) => (state?.data && typeof state.data === 'object' ? state.data : state || {});
    const recordId = (row, index) => text(row?.id) || `@index:${index}`;
    const canonicalize = (value) => {
        if (Array.isArray(value)) return value.map(canonicalize);
        if (!value || typeof value !== 'object') return value;
        return Object.keys(value).sort().reduce((output, key) => {
            output[key] = canonicalize(value[key]);
            return output;
        }, {});
    };
    const canonicalStringify = (value) => JSON.stringify(canonicalize(value));
    const stableHash = (value) => {
        const input = text(value);
        let hash = 2166136261;
        for (let index = 0; index < input.length; index += 1) {
            hash ^= input.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
    };
    const getPlanner = () => {
        if (typeof PrototypeTestCohortPlanner !== 'undefined') return PrototypeTestCohortPlanner;
        if (typeof require === 'function') return require('./prototype-test-cohort-planner.js');
        return null;
    };
    const plannerOptions = () => ({
        baselineManualEntryDocNos: [...BASELINE_DOC_NOS],
        testSeedLocationCodes: [...TEST_SEED_LOCATION_CODES]
    });
    const buildOperationalCodeHighWaterMarks = (state) => {
        const policy = getOperationalCodePolicy();
        return policy?.buildPersistentMarks(state, state) || {};
    };

    const build = (state) => {
        const planner = getPlanner();
        if (!planner || typeof planner.build !== 'function') {
            return {
                contractVersion: 6,
                mode: MODE,
                ok: false,
                failClosed: true,
                noOp: false,
                issues: [{ reasonCode: 'COHORT_PLANNER_MISSING', message: 'FAZ 1 cohort planner yüklenemedi.', evidenceIds: [] }]
            };
        }
        const basePlan = planner.build(state, plannerOptions());
        const data = dataRoot(state);
        const issues = [...asArray(basePlan?.uncertainties)];
        const addIssue = (reasonCode, message, evidenceIds = []) => {
            issues.push({ reasonCode, message, evidenceIds: asArray(evidenceIds).map(text).filter(Boolean) });
        };
        if (Number(basePlan?.baseline?.manualEntryCount) !== 9
            || Number(basePlan?.baseline?.movementCount) !== 9
            || Number(basePlan?.baseline?.stockRowCount) !== 9
            || Number(basePlan?.baseline?.authoritativeQtyTotal) !== 13200) {
            addIssue('BASELINE_CONTRACT_MISMATCH', 'Dokuz satırlı authoritative 13.200 baseline sözleşmesi doğrulanamadı.');
        }
        const deletes = asArray(basePlan?.classifications?.DELETE);
        const resets = asArray(basePlan?.classifications?.RESET_TO_BASELINE);
        const keep = asArray(basePlan?.classifications?.KEEP);
        const operationalCodeHighWaterMarks = buildOperationalCodeHighWaterMarks(state);
        deletes.forEach((descriptor) => {
            const rows = asArray(data[descriptor?.collection]);
            const matches = rows.filter((row, index) => recordId(row, index) === text(descriptor?.id));
            if (matches.length !== 1) {
                addIssue('DELETE_TARGET_NOT_UNIQUE', `DELETE hedefi güncel state içinde tekil değil: ${descriptor?.collection}/${descriptor?.id}.`,
                    [descriptor?.id]);
            }
        });
        resets.forEach((descriptor) => {
            if (descriptor?.collection !== 'stockDepotItems'
                || !Number.isFinite(Number(descriptor?.baselineQty))
                || Number(descriptor?.baselineQty) <= 0) {
                addIssue('BASELINE_RESET_INVALID', `Baseline reset hedefi geçersiz: ${descriptor?.collection}/${descriptor?.id}.`,
                    [descriptor?.id]);
            }
        });
        const manifestPayload = {
            currentDataHash: stableHash(canonicalStringify(data)),
            baseManifestSignature: text(basePlan?.manifestSignature),
            deletes: deletes.map((row) => ({ collection: row.collection, id: row.id, code: row.code })),
            resets: resets.map((row) => ({ collection: row.collection, id: row.id, code: row.code, baselineQty: Number(row.baselineQty) })),
            keep: keep.map((row) => ({ collection: row.collection, id: row.id, code: row.code })),
            operationalCodeHighWaterMarks,
            baseline: basePlan?.baseline
        };
        return {
            contractVersion: 6,
            plannerVersion: VERSION,
            mode: MODE,
            ok: basePlan?.ok === true && issues.length === 0,
            failClosed: basePlan?.ok !== true || issues.length > 0,
            readOnly: true,
            noOp: deletes.length === 0 && resets.length === 0,
            issues,
            baseManifestSignature: text(basePlan?.manifestSignature),
            manifestSignature: stableHash(canonicalStringify(manifestPayload)),
            targets: {
                DELETE: deletes.map((row) => ({
                    collection: row.collection,
                    id: row.id,
                    code: row.code,
                    reasonCodes: row.reasonCodes
                })),
                RESET_TO_BASELINE: resets.map((row) => ({
                    collection: row.collection,
                    id: row.id,
                    code: row.code,
                    currentQty: Number(row.currentQty),
                    baselineQty: Number(row.baselineQty)
                })),
                KEEP: keep.map((row) => ({ collection: row.collection, id: row.id, code: row.code }))
            },
            baseline: clone(basePlan?.baseline || {}),
            protectedMasterCollections: clone(basePlan?.protectedMasterCollections || []),
            operationalCodeHighWaterMarks: clone(operationalCodeHighWaterMarks),
            summary: {
                DELETE: deletes.length,
                RESET_TO_BASELINE: resets.length,
                KEEP: keep.length,
                UNCERTAIN: issues.length,
                baselineQtyTotal: Number(basePlan?.baseline?.authoritativeQtyTotal || 0)
            }
        };
    };

    const setBaselineQty = (row, amount) => {
        const normalized = Number(amount);
        row.qty = normalized;
        row.quantity = normalized;
        row.amount = normalized;
    };

    const apply = (state, approvedPlan) => {
        const currentPlan = build(state);
        if (!currentPlan.ok) return { ok: false, code: 'SALES_COHORT_CLEANUP_UNCERTAIN', issues: currentPlan.issues };
        if (!approvedPlan || text(approvedPlan?.manifestSignature) !== currentPlan.manifestSignature) {
            return { ok: false, code: 'SALES_COHORT_CLEANUP_STALE_PLAN', issues: [] };
        }
        if (currentPlan.noOp) return { ok: true, noOp: true, plan: currentPlan, summary: currentPlan.summary };
        const data = dataRoot(state);
        const deleteByCollection = new Map();
        currentPlan.targets.DELETE.forEach((descriptor) => {
            const collection = text(descriptor?.collection);
            if (!deleteByCollection.has(collection)) deleteByCollection.set(collection, new Set());
            deleteByCollection.get(collection).add(text(descriptor?.id));
        });
        deleteByCollection.forEach((ids, collection) => {
            if (!Array.isArray(data[collection])) return;
            data[collection] = data[collection].filter((row, index) => !ids.has(recordId(row, index)));
        });
        currentPlan.targets.RESET_TO_BASELINE.forEach((descriptor) => {
            const rows = asArray(data[descriptor?.collection]);
            const row = rows.find((candidate, index) => recordId(candidate, index) === text(descriptor?.id));
            if (row) setBaselineQty(row, descriptor.baselineQty);
        });
        if (!state.meta || typeof state.meta !== 'object') state.meta = {};
        state.meta.operationalCodeHighWaterMarks = clone(currentPlan.operationalCodeHighWaterMarks);
        return { ok: true, noOp: false, plan: currentPlan, summary: currentPlan.summary };
    };

    const diagnoseTransition = (currentState, incomingState, approval) => {
        if (text(approval?.type) !== 'sales_order_demo_cleanup'
            || Number(approval?.meta?.prototypeResetVersion) !== 6
            || text(approval?.meta?.prototypeResetMode) !== MODE) {
            return { ok: false, reasonCode: 'APPROVAL_INVALID' };
        }
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
                incomingHash: stableHash(incomingData)
            };
        }
        const currentMeta = clone(expected?.meta || {});
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
        VERSION, MODE, BASELINE_DOC_NOS, TEST_SEED_LOCATION_CODES, OPERATIONAL_CODE_SPECS,
        build, apply, diagnoseTransition, verifyTransition, buildOperationalCodeHighWaterMarks, clone
    };
})();

if (typeof module !== 'undefined' && module?.exports) module.exports = PrototypeSalesTestCohortCleanup;
