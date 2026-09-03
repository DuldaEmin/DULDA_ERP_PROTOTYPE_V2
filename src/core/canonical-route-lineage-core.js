/**
 * Canonical route/lineage helpers shared by catalogue views and read-only resolvers.
 * Route ids are deliberately excluded from technical comparison.
 */
const CanonicalRouteLineageCore = (() => {
    const text = (value) => String(value ?? '').trim();
    const code = (value) => text(value).toUpperCase();
    const asArray = (value) => (Array.isArray(value) ? value : []);
    const isCanonicalDtrCode = (value) => {
        if (typeof OperationalCodeHighWater !== 'undefined'
            && typeof OperationalCodeHighWater?.isValidCode === 'function') {
            return OperationalCodeHighWater.isValidCode(value, 'DTR');
        }
        if (typeof require === 'function') {
            try {
                const policy = require('./operational-code-high-water.js');
                if (typeof policy?.isValidCode === 'function') return policy.isValidCode(value, 'DTR');
            } catch (_) {
                // Browser ve izole test fallback'i aşağıdadır.
            }
        }
        return /^DTR-(?:\d{6}|[1-9]\d{6,})$/.test(code(value));
    };

    const normalizeStep = (route = {}, index = 0) => {
        const stationId = text(route?.stationId);
        const processId = code(route?.processId);
        const routeSeq = index + 1;
        const declaredRaw = route?.seq ?? route?.routeSeq;
        const hasDeclaredSeq = declaredRaw !== undefined && declaredRaw !== null && text(declaredRaw) !== '';
        const declaredSeq = hasDeclaredSeq ? Number(declaredRaw) : routeSeq;
        if (!stationId) {
            return { ok: false, reasonCode: 'ROUTE_STATION_MISSING', routeSeq, stationId, processId, token: '' };
        }
        if (!processId) {
            return { ok: false, reasonCode: 'ROUTE_PROCESS_MISSING', routeSeq, stationId, processId, token: '' };
        }
        if (!Number.isSafeInteger(declaredSeq) || declaredSeq !== routeSeq) {
            return { ok: false, reasonCode: 'ROUTE_DEFINITION_SEQ_CONFLICT', routeSeq, stationId, processId, token: '' };
        }
        const isCanonicalDtr = stationId.toLowerCase() === 'u_dtm' && isCanonicalDtrCode(processId);
        return {
            ok: true,
            reasonCode: '',
            routeSeq,
            stationId,
            processId,
            token: isCanonicalDtr ? 'DTR' : `${code(stationId)}::${processId}`
        };
    };

    const buildRoute = (routes = []) => {
        const rows = asArray(routes);
        if (!rows.length) return { ok: false, reasonCode: 'ROUTE_MISSING', steps: [], tokens: [] };
        const steps = rows.map((route, index) => normalizeStep(route, index));
        const invalid = steps.find((step) => !step.ok);
        if (invalid) {
            return { ok: false, reasonCode: invalid.reasonCode, steps, tokens: [] };
        }
        return { ok: true, reasonCode: '', steps, tokens: steps.map((step) => step.token) };
    };

    const sameRoute = (left = [], right = []) => {
        const leftRoute = buildRoute(left);
        const rightRoute = buildRoute(right);
        if (!leftRoute.ok || !rightRoute.ok) {
            return {
                ok: false,
                same: false,
                reasonCode: !leftRoute.ok ? `SOURCE_${leftRoute.reasonCode}` : `TARGET_${rightRoute.reasonCode}`,
                left: leftRoute,
                right: rightRoute
            };
        }
        const same = leftRoute.tokens.length === rightRoute.tokens.length
            && leftRoute.tokens.every((token, index) => token === rightRoute.tokens[index]);
        return { ok: true, same, reasonCode: '', left: leftRoute, right: rightRoute };
    };

    const compareRoutes = (left = [], right = []) => {
        const leftRoute = buildRoute(left);
        const rightRoute = buildRoute(right);
        if (!leftRoute.ok || !rightRoute.ok) {
            return {
                ok: false,
                reasonCode: !leftRoute.ok ? `SOURCE_${leftRoute.reasonCode}` : `TARGET_${rightRoute.reasonCode}`,
                commonPrefixLength: 0,
                sourceNextToken: '',
                targetNextToken: '',
                hasConcreteBranch: false,
                left: leftRoute,
                right: rightRoute
            };
        }
        let commonPrefixLength = 0;
        while (commonPrefixLength < leftRoute.tokens.length
            && commonPrefixLength < rightRoute.tokens.length
            && leftRoute.tokens[commonPrefixLength] === rightRoute.tokens[commonPrefixLength]) {
            commonPrefixLength += 1;
        }
        const sourceNextToken = leftRoute.tokens[commonPrefixLength] || '';
        const targetNextToken = rightRoute.tokens[commonPrefixLength] || '';
        return {
            ok: true,
            reasonCode: '',
            commonPrefixLength,
            sourceNextToken,
            targetNextToken,
            hasConcreteBranch: !!sourceNextToken && !!targetNextToken && sourceNextToken !== targetNextToken,
            left: leftRoute,
            right: rightRoute
        };
    };

    const getDeclaredRootIdentity = (row = {}) => {
        const rowId = text(row?.id);
        const rowCode = code(row?.code);
        const rootId = text(row?.rootComponentId || row?.variantParentId);
        const rootCode = code(row?.rootComponentCode || row?.variantParentCode);
        const variantFlag = row?.isVariant === true || ['TRUE', '1', 'EVET'].includes(code(row?.isVariant));
        const hasFamilyReference = variantFlag || !!rootId || !!rootCode;
        return {
            ok: !!rowId && !!rowCode && (!hasFamilyReference || (!!rootId && !!rootCode)),
            reasonCode: !rowId || !rowCode
                ? 'PRC_IDENTITY_MISSING'
                : (hasFamilyReference && (!rootId || !rootCode) ? 'ROOT_IDENTITY_INCOMPLETE' : ''),
            id: hasFamilyReference ? rootId : rowId,
            code: hasFamilyReference ? rootCode : rowCode,
            referenced: hasFamilyReference
        };
    };

    const buildNormalizedKinshipLineageIdentity = (row = {}) => {
        const masterCode = code(row?.masterCode) || '-';
        const finalCode = code(row?.code) || '-';
        const route = buildRoute(row?.routes);
        const routeTokens = route.ok ? route.tokens : [`UNCERTAIN:${route.reasonCode}`];
        return `${[masterCode, ...routeTokens].join(' / ')} = ${finalCode}`;
    };

    return {
        normalizeStep,
        buildRoute,
        sameRoute,
        compareRoutes,
        getDeclaredRootIdentity,
        buildNormalizedKinshipLineageIdentity
    };
})();

if (typeof module !== 'undefined' && module?.exports) {
    module.exports = CanonicalRouteLineageCore;
}
