/**
 * DULDA ERP - Operational Code High-Water Policy
 *
 * Bir kez kalıcı state'e giren operasyon kodunun, ilgili kayıt daha sonra
 * kaldırılsa bile yeniden kullanılmasını engelleyen ortak server/client policy.
 */
const OperationalCodeHighWater = (() => {
    const VERSION = '3.0.0';
    const MIN_DIGITS = 6;
    const ZERO = 0n;
    const ONE = 1n;
    const SPECS = Object.freeze([
        { prefix: 'SOR', collection: 'orders', fields: ['orderNo', 'orderCode'] },
        { prefix: 'PLN', collection: 'planningDemands', fields: ['demandCode'] },
        { prefix: 'WO', collection: 'workOrders', fields: ['workOrderCode'] },
        { prefix: 'MGP', collection: 'montageDispatchPlans', fields: ['planNo'] },
        { prefix: 'MGS', collection: 'montageDispatchShipments', fields: ['shipmentNo'] },
        { prefix: 'MCT', collection: 'montageCompletionTransfers', fields: ['transferNo'] },
        { prefix: 'STAI', collection: 'sanalTaksimAllocationInstructions', fields: ['instructionCode'] },
        { prefix: 'SVP', collection: 'salesShipmentPlans', fields: ['planNo'] },
        { prefix: 'TF', collection: 'salesShipments', fields: ['shipmentNo'] },
        { prefix: 'FTS', collection: 'outsourceDispatchDrafts', fields: ['dispatchNo'] }
    ]);
    const ADDITIONAL_SPECS = Object.freeze([
        { prefix: 'DSI', collection: 'workOrderDispatchNotes', fields: ['docNo'], bootstrapFromLive: true },
        { prefix: 'SDT', collection: 'freeExternalVendorJobs', fields: ['jobCode'], bootstrapFromLive: true },
        { prefix: 'DTR', collection: 'depoTransferTasks', fields: ['taskCode'], bootstrapFromLive: true }
    ]);
    const YEAR_SPECS = Object.freeze([
        { prefix: 'MK', collection: 'stockGoodsReceipts', fields: ['docNo'], bootstrapFromLive: true },
        { prefix: 'EK', collection: 'stockManualEntries', fields: ['docNo'], bootstrapFromLive: true }
    ]);
    const MASTER_SPECS = Object.freeze([
        { prefix: 'CNC', collection: 'cncCards', fields: ['cncId'], bootstrapFromLive: true },
        { prefix: 'TST', collection: 'sawCutOrders', fields: ['code'], bootstrapFromLive: true },
        { prefix: 'EKS', collection: 'extruderLibraryCards', fields: ['cardCode'], bootstrapFromLive: true },
        { prefix: 'PLSJ', collection: 'plexiPolishCards', fields: ['cardCode'], bootstrapFromLive: true },
        { prefix: 'PVD', collection: 'pvdCards', fields: ['cardCode'], bootstrapFromLive: true },
        { prefix: 'IPS', collection: 'ibrahimPolishCards', fields: ['cardCode'], bootstrapFromLive: true },
        { prefix: 'ELX', collection: 'eloksalCards', fields: ['cardCode'], bootstrapFromLive: true, sharedCollection: true },
        { prefix: 'STB', collection: 'eloksalCards', fields: ['cardCode'], bootstrapFromLive: true, sharedCollection: true },
        { prefix: 'MON', collection: 'montageCards', fields: ['cardCode'], bootstrapFromLive: true },
        { prefix: 'SVR', collection: 'salesProductVariants', fields: ['variantCode'], bootstrapFromLive: true, sharedCollection: true },
        { prefix: 'PRC', collection: 'partComponentCards', fields: ['code'], bootstrapFromLive: true },
        { prefix: 'YRM', collection: 'semiFinishedCards', fields: ['code'], bootstrapFromLive: true },
        { prefix: 'GRP', collection: 'assemblyGroups', fields: ['code'], bootstrapFromLive: true },
        {
            prefix: 'URM', collection: 'catalogProductVariants', fields: ['familyCode'],
            bootstrapFromLive: true, allowSameGroupField: 'familyId'
        },
        { prefix: 'MUS', collection: 'customers', fields: ['customerCode'], bootstrapFromLive: true },
        { prefix: 'MREF', collection: 'customers', fields: ['customerRefId'], bootstrapFromLive: true },
        { prefix: 'TREF', collection: 'suppliers', fields: ['supplierRefId'], bootstrapFromLive: true },
        { prefix: 'SAL', collection: 'salesCatalogProducts', fields: ['idCode'], bootstrapFromLive: true, sharedCollection: true },
        { prefix: 'ANK', collection: 'salesAnchorageProducts', fields: ['idCode'], bootstrapFromLive: true },
        { prefix: 'SRF', collection: 'products', fields: ['code'], bootstrapFromLive: true, sharedCollection: true },
        { prefix: 'KLI', collection: 'products', fields: ['code'], bootstrapFromLive: true, sharedCollection: true },
        { prefix: 'LOC', collection: 'stockDepotLocations', fields: ['idCode'], bootstrapFromLive: true, sharedCollection: true },
        { prefix: 'PER', collection: 'personnel', fields: ['personCode'], bootstrapFromLive: true }
    ]);
    const SIMPLE_SPECS = Object.freeze([...SPECS, ...ADDITIONAL_SPECS, ...MASTER_SPECS]);

    const text = (value) => String(value ?? '').trim();
    const code = (value) => text(value).toUpperCase();
    const rows = (value) => (Array.isArray(value) ? value : []);
    const dataRoot = (state) => (state?.data && typeof state.data === 'object' && !Array.isArray(state.data)
        ? state.data : state || {});
    const normalizePrefix = (value) => code(value).replace(/[^A-Z0-9]/g, '');
    const normalizeMarkKey = (value) => {
        const normalized = code(value);
        return /^[A-Z0-9]+(?::\d{4})?$/.test(normalized) ? normalized : '';
    };
    const escapeRegExp = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parseDecimal = (value, options = {}) => {
        const allowZero = options?.allowZero === true;
        if (typeof value === 'bigint') return value > ZERO || (allowZero && value === ZERO) ? value : null;
        if (typeof value === 'number') {
            if (!Number.isSafeInteger(value) || value < 0 || (!allowZero && value === 0)) return null;
            return BigInt(value);
        }
        if (typeof value !== 'string') return null;
        const normalized = value.trim();
        const pattern = allowZero ? /^(?:0|[1-9]\d*)$/ : /^[1-9]\d*$/;
        if (!pattern.test(normalized)) return null;
        try {
            return BigInt(normalized);
        } catch (_) {
            return null;
        }
    };
    const serializeSequence = (value) => {
        const parsed = parseDecimal(value, { allowZero: true });
        return parsed === null ? '' : parsed.toString();
    };
    const maxSequence = (...values) => values.reduce((max, value) => {
        const parsed = parseDecimal(value, { allowZero: true });
        return parsed !== null && parsed > max ? parsed : max;
    }, ZERO);
    const parseCodeSequence = (value, prefix) => {
        const safePrefix = normalizePrefix(prefix);
        if (!safePrefix) return null;
        const match = code(value).match(new RegExp(`^${escapeRegExp(safePrefix)}-(\\d{${MIN_DIGITS}}|[1-9]\\d{${MIN_DIGITS},})$`));
        if (!match) return null;
        try {
            const sequence = BigInt(match[1]);
            return sequence > ZERO ? sequence : null;
        } catch (_) {
            return null;
        }
    };
    const isValidCode = (value, prefix) => parseCodeSequence(value, prefix) !== null;
    const yearMarkKey = (prefix, year) => `${normalizePrefix(prefix)}:${String(year || '').trim()}`;
    const parseYearCode = (value, prefix) => {
        const safePrefix = normalizePrefix(prefix);
        if (!safePrefix) return null;
        const match = code(value).match(new RegExp(
            `^${escapeRegExp(safePrefix)}-(\\d{4})-(\\d{${MIN_DIGITS}}|[1-9]\\d{${MIN_DIGITS},})$`
        ));
        if (!match) return null;
        try {
            const sequence = BigInt(match[2]);
            return sequence > ZERO
                ? { year: match[1], sequence, markKey: yearMarkKey(safePrefix, match[1]) }
                : null;
        } catch (_) {
            return null;
        }
    };
    const isValidYearCode = (value, prefix) => parseYearCode(value, prefix) !== null;
    const formatCode = (prefix, value, minimumDigits = MIN_DIGITS) => {
        const safePrefix = normalizePrefix(prefix);
        const sequence = parseDecimal(value);
        const widthValue = Number(minimumDigits);
        const width = Number.isSafeInteger(widthValue) && widthValue > 0 ? widthValue : MIN_DIGITS;
        if (!safePrefix || sequence === null) return '';
        return `${safePrefix}-${sequence.toString().padStart(width, '0')}`;
    };
    const formatYearCode = (prefix, year, value, minimumDigits = MIN_DIGITS) => {
        const safePrefix = normalizePrefix(prefix);
        const safeYear = String(year || '').trim();
        const sequence = parseDecimal(value);
        const widthValue = Number(minimumDigits);
        const width = Number.isSafeInteger(widthValue) && widthValue > 0 ? widthValue : MIN_DIGITS;
        if (!safePrefix || !/^\d{4}$/.test(safeYear) || sequence === null) return '';
        return `${safePrefix}-${safeYear}-${sequence.toString().padStart(width, '0')}`;
    };
    const recordCode = (record, spec) => {
        for (const field of spec.fields) {
            const value = code(record?.[field]);
            if (value) return value;
        }
        return '';
    };
    const ignoresSharedCollectionValue = (value, spec) => {
        if (!spec?.sharedCollection) return false;
        const normalized = code(value);
        if (!normalized) return true;
        if (parseCodeSequence(normalized, spec.prefix) !== null) return false;
        const marker = `${spec.prefix}-`;
        if (!normalized.startsWith(marker)) return true;
        return !/^\d/.test(normalized.slice(marker.length));
    };
    const scanFamilyMaxValue = (state, spec) => rows(dataRoot(state)?.[spec.collection])
        .reduce((max, record) => {
            const sequence = parseCodeSequence(recordCode(record, spec), spec.prefix);
            return sequence !== null && sequence > max ? sequence : max;
        }, ZERO);
    const scanFamilyMax = (state, spec) => serializeSequence(scanFamilyMaxValue(state, spec));
    const storedMarkInfo = (state, prefix) => {
        const marks = state?.meta?.operationalCodeHighWaterMarks;
        const safePrefix = normalizeMarkKey(prefix);
        const present = !!marks && typeof marks === 'object'
            && Object.prototype.hasOwnProperty.call(marks, safePrefix);
        if (!present) return { present: false, valid: true, value: ZERO };
        const value = parseDecimal(marks[safePrefix], { allowZero: true });
        return { present: true, valid: value !== null, value: value ?? ZERO };
    };
    const storedMarkValue = (state, prefix) => storedMarkInfo(state, prefix).value;
    const getHighWaterMark = (state, prefix) => serializeSequence(storedMarkValue(state, prefix));
    const storedYearMarkInfo = (state, prefix, year) => storedMarkInfo(state, yearMarkKey(prefix, year));
    const scanYearFamilyMaxima = (state, spec) => {
        const maxima = new Map();
        rows(dataRoot(state)?.[spec.collection]).forEach((record) => {
            const parsed = parseYearCode(recordCode(record, spec), spec.prefix);
            if (!parsed) return;
            const current = maxima.get(parsed.year) || ZERO;
            if (parsed.sequence > current) maxima.set(parsed.year, parsed.sequence);
        });
        return maxima;
    };
    const collectYearScopes = (spec, ...states) => {
        const years = new Set();
        states.filter(Boolean).forEach((state) => {
            scanYearFamilyMaxima(state, spec).forEach((_, year) => years.add(year));
            const marks = state?.meta?.operationalCodeHighWaterMarks;
            if (!marks || typeof marks !== 'object') return;
            Object.keys(marks).forEach((key) => {
                const match = key.match(new RegExp(`^${escapeRegExp(spec.prefix)}:(\\d{4})$`));
                if (match) years.add(match[1]);
            });
        });
        return Array.from(years).sort();
    };
    const scanYearFamilyMaxValue = (state, spec, year) => scanYearFamilyMaxima(state, spec).get(String(year)) || ZERO;
    const isYearFamilyUntrusted = (state, spec, year) => {
        const key = yearMarkKey(spec.prefix, year);
        const mark = storedYearMarkInfo(state, spec.prefix, year);
        return storedUntrustedFamilies(state).has(key)
            || !mark.valid
            || (!spec.bootstrapFromLive && mark.value === ZERO
                && scanYearFamilyMaxValue(state, spec, year) > ZERO);
    };
    const currentYearFloorValue = (state, spec, year) => maxSequence(
        storedYearMarkInfo(state, spec.prefix, year).value,
        scanYearFamilyMaxValue(state, spec, year)
    );
    const storedUntrustedFamilies = (state) => new Set(rows(
        state?.meta?.operationalCodeHighWaterUntrustedFamilies
    ).map(code).filter(Boolean));
    const isFamilyUntrusted = (state, spec) => {
        const mark = storedMarkInfo(state, spec.prefix);
        return storedUntrustedFamilies(state).has(spec.prefix)
            || !mark.valid
            || (!spec.bootstrapFromLive && mark.value === ZERO && scanFamilyMaxValue(state, spec) > ZERO);
    };
    const currentFloorValue = (state, spec) => maxSequence(
        storedMarkValue(state, spec.prefix),
        scanFamilyMaxValue(state, spec)
    );
    const buildPersistentMarks = (currentState, incomingState) => {
        const marks = {};
        SIMPLE_SPECS.forEach((spec) => {
            const currentStored = currentState ? storedMarkInfo(currentState, spec.prefix) : null;
            const incomingStored = storedMarkInfo(incomingState, spec.prefix);
            const trustedStored = currentStored?.valid
                ? currentStored.value
                : (incomingStored.valid ? incomingStored.value : ZERO);
            const maximum = maxSequence(
                trustedStored,
                scanFamilyMaxValue(currentState, spec),
                scanFamilyMaxValue(incomingState, spec)
            );
            if (maximum > ZERO) marks[spec.prefix] = serializeSequence(maximum);
        });
        YEAR_SPECS.forEach((spec) => {
            collectYearScopes(spec, currentState, incomingState).forEach((year) => {
                const key = yearMarkKey(spec.prefix, year);
                const currentStored = currentState ? storedYearMarkInfo(currentState, spec.prefix, year) : null;
                const incomingStored = storedYearMarkInfo(incomingState, spec.prefix, year);
                const trustedStored = currentStored?.valid
                    ? currentStored.value
                    : (incomingStored.valid ? incomingStored.value : ZERO);
                const maximum = maxSequence(
                    trustedStored,
                    scanYearFamilyMaxValue(currentState, spec, year),
                    scanYearFamilyMaxValue(incomingState, spec, year)
                );
                if (maximum > ZERO) marks[key] = serializeSequence(maximum);
            });
        });
        return marks;
    };
    const buildUntrustedFamilies = (currentState, incomingState) => {
        const baseline = currentState || incomingState;
        const untrusted = storedUntrustedFamilies(baseline);
        SIMPLE_SPECS.forEach((spec) => {
            if (isFamilyUntrusted(baseline, spec)) untrusted.add(spec.prefix);
        });
        YEAR_SPECS.forEach((spec) => {
            collectYearScopes(spec, baseline).forEach((year) => {
                const key = yearMarkKey(spec.prefix, year);
                if (isYearFamilyUntrusted(baseline, spec, year)) untrusted.add(key);
            });
        });
        const knownKeys = [
            ...SIMPLE_SPECS.map((spec) => spec.prefix),
            ...YEAR_SPECS.flatMap((spec) => collectYearScopes(spec, baseline).map((year) => yearMarkKey(spec.prefix, year)))
        ];
        return knownKeys.filter((key, index) => untrusted.has(key) && knownKeys.indexOf(key) === index);
    };
    const diagnoseTransition = (currentState, incomingState) => {
        const issues = [];
        if (!incomingState || typeof incomingState !== 'object') {
            return {
                ok: false,
                issues: [{ reasonCode: 'INCOMING_STATE_INVALID', family: '', code: '' }],
                marks: {},
                untrustedFamilies: []
            };
        }
        if (!currentState || typeof currentState !== 'object') {
            return {
                ok: true,
                issues,
                marks: buildPersistentMarks(null, incomingState),
                untrustedFamilies: buildUntrustedFamilies(null, incomingState)
            };
        }

        const currentData = dataRoot(currentState);
        const incomingData = dataRoot(incomingState);
        SIMPLE_SPECS.forEach((spec) => {
            const floor = currentFloorValue(currentState, spec);
            const familyUntrusted = isFamilyUntrusted(currentState, spec);
            const currentRows = rows(currentData?.[spec.collection]);
            const incomingRows = rows(incomingData?.[spec.collection]);
            const currentById = new Map(currentRows
                .map((record) => [text(record?.id), record])
                .filter(([id]) => !!id));
            const incomingCodes = new Map();

            incomingRows.forEach((record) => {
                const id = text(record?.id);
                const value = recordCode(record, spec);
                const sequence = parseCodeSequence(value, spec.prefix);
                const existing = id ? currentById.get(id) : null;
                const existingCode = existing ? recordCode(existing, spec) : '';

                if (ignoresSharedCollectionValue(value, spec)) {
                    if (existingCode && parseCodeSequence(existingCode, spec.prefix) !== null
                        && existingCode !== value) {
                        issues.push({
                            reasonCode: 'OPERATIONAL_CODE_CHANGED',
                            family: spec.prefix,
                            code: value,
                            previousCode: existingCode,
                            recordId: id
                        });
                    }
                    return;
                }

                if (!value || sequence === null) {
                    issues.push({
                        reasonCode: 'OPERATIONAL_CODE_INVALID',
                        family: spec.prefix,
                        code: value,
                        recordId: id
                    });
                    if (existingCode && existingCode !== value) {
                        issues.push({
                            reasonCode: 'OPERATIONAL_CODE_CHANGED',
                            family: spec.prefix,
                            code: value,
                            previousCode: existingCode,
                            recordId: id
                        });
                    }
                    return;
                }

                if (!incomingCodes.has(value)) incomingCodes.set(value, []);
                incomingCodes.get(value).push(id);

                if (existing) {
                    if (existingCode && existingCode !== value) {
                        issues.push({
                            reasonCode: 'OPERATIONAL_CODE_CHANGED',
                            family: spec.prefix,
                            code: value,
                            previousCode: existingCode,
                            recordId: id
                        });
                    } else if (!existingCode && familyUntrusted) {
                        issues.push({
                            reasonCode: 'OPERATIONAL_CODE_HIGH_WATER_UNTRUSTED',
                            family: spec.prefix,
                            code: value,
                            highWater: serializeSequence(floor),
                            recordId: id
                        });
                    } else if (!existingCode && sequence <= floor) {
                        issues.push({
                            reasonCode: 'OPERATIONAL_CODE_REUSE',
                            family: spec.prefix,
                            code: value,
                            highWater: serializeSequence(floor),
                            recordId: id
                        });
                    }
                    return;
                }

                const sameGroupField = String(spec?.allowSameGroupField || '').trim();
                const groupValue = sameGroupField ? text(record?.[sameGroupField]) : '';
                const extendsExistingGroup = !!groupValue && currentRows.some((currentRecord) =>
                    recordCode(currentRecord, spec) === value
                    && text(currentRecord?.[sameGroupField]) === groupValue
                );
                if (extendsExistingGroup) return;

                if (familyUntrusted) {
                    issues.push({
                        reasonCode: 'OPERATIONAL_CODE_HIGH_WATER_UNTRUSTED',
                        family: spec.prefix,
                        code: value,
                        highWater: serializeSequence(floor),
                        recordId: id
                    });
                } else if (sequence <= floor) {
                    issues.push({
                        reasonCode: 'OPERATIONAL_CODE_REUSE',
                        family: spec.prefix,
                        code: value,
                        highWater: serializeSequence(floor),
                        recordId: id
                    });
                }
            });

            incomingCodes.forEach((ids, value) => {
                if (ids.length <= 1) return;
                const sameGroupField = String(spec?.allowSameGroupField || '').trim();
                if (sameGroupField) {
                    const matchingRecords = incomingRows.filter((record) => recordCode(record, spec) === value);
                    const groupValues = matchingRecords.map((record) => text(record?.[sameGroupField]));
                    const groups = new Set(groupValues.filter(Boolean));
                    if (groupValues.every(Boolean) && groups.size === 1) return;
                }
                issues.push({
                    reasonCode: 'OPERATIONAL_CODE_DUPLICATE',
                    family: spec.prefix,
                    code: value,
                    recordIds: ids
                });
            });
        });

        YEAR_SPECS.forEach((spec) => {
            const currentRows = rows(currentData?.[spec.collection]);
            const incomingRows = rows(incomingData?.[spec.collection]);
            const currentById = new Map(currentRows
                .map((record) => [text(record?.id), record])
                .filter(([id]) => !!id));
            const incomingCodes = new Map();

            incomingRows.forEach((record) => {
                const id = text(record?.id);
                const value = recordCode(record, spec);
                const parsed = parseYearCode(value, spec.prefix);
                const existing = id ? currentById.get(id) : null;
                const existingCode = existing ? recordCode(existing, spec) : '';

                if (!value || !parsed) {
                    issues.push({
                        reasonCode: 'OPERATIONAL_CODE_INVALID',
                        family: spec.prefix,
                        code: value,
                        recordId: id
                    });
                    if (existingCode && existingCode !== value) {
                        issues.push({
                            reasonCode: 'OPERATIONAL_CODE_CHANGED',
                            family: spec.prefix,
                            code: value,
                            previousCode: existingCode,
                            recordId: id
                        });
                    }
                    return;
                }

                if (!incomingCodes.has(value)) incomingCodes.set(value, []);
                incomingCodes.get(value).push(id);
                if (existing) {
                    if (existingCode && existingCode !== value) {
                        issues.push({
                            reasonCode: 'OPERATIONAL_CODE_CHANGED',
                            family: spec.prefix,
                            scope: parsed.year,
                            code: value,
                            previousCode: existingCode,
                            recordId: id
                        });
                    }
                    return;
                }

                const floor = currentYearFloorValue(currentState, spec, parsed.year);
                if (isYearFamilyUntrusted(currentState, spec, parsed.year)) {
                    issues.push({
                        reasonCode: 'OPERATIONAL_CODE_HIGH_WATER_UNTRUSTED',
                        family: spec.prefix,
                        scope: parsed.year,
                        code: value,
                        highWater: serializeSequence(floor),
                        recordId: id
                    });
                } else if (parsed.sequence <= floor) {
                    issues.push({
                        reasonCode: 'OPERATIONAL_CODE_REUSE',
                        family: spec.prefix,
                        scope: parsed.year,
                        code: value,
                        highWater: serializeSequence(floor),
                        recordId: id
                    });
                }
            });

            incomingCodes.forEach((ids, value) => {
                if (ids.length <= 1) return;
                const parsed = parseYearCode(value, spec.prefix);
                issues.push({
                    reasonCode: 'OPERATIONAL_CODE_DUPLICATE',
                    family: spec.prefix,
                    scope: parsed?.year || '',
                    code: value,
                    recordIds: ids
                });
            });
        });

        return {
            ok: issues.length === 0,
            issues,
            marks: buildPersistentMarks(currentState, incomingState),
            untrustedFamilies: buildUntrustedFamilies(currentState, incomingState)
        };
    };
    const applyPersistentMarks = (state, marks, untrustedFamilies = []) => {
        if (!state || typeof state !== 'object') return false;
        if (!state.meta || typeof state.meta !== 'object') state.meta = {};
        const normalizedMarks = {};
        SIMPLE_SPECS.forEach((spec) => {
            const mark = parseDecimal(marks?.[spec.prefix], { allowZero: true });
            if (mark !== null && mark > ZERO) normalizedMarks[spec.prefix] = serializeSequence(mark);
        });
        YEAR_SPECS.forEach((spec) => {
            Object.keys(marks || {}).forEach((key) => {
                const match = key.match(new RegExp(`^${escapeRegExp(spec.prefix)}:(\\d{4})$`));
                if (!match) return;
                const mark = parseDecimal(marks[key], { allowZero: true });
                if (mark !== null && mark > ZERO) normalizedMarks[key] = serializeSequence(mark);
            });
        });
        state.meta.operationalCodeHighWaterMarks = normalizedMarks;
        state.meta.operationalCodeHighWaterUntrustedFamilies = rows(untrustedFamilies)
            .map(code)
            .filter((prefix, index, all) => (
                SIMPLE_SPECS.some((spec) => spec.prefix === prefix)
                || YEAR_SPECS.some((spec) => new RegExp(`^${escapeRegExp(spec.prefix)}:\\d{4}$`).test(prefix))
            ) && all.indexOf(prefix) === index);
        return true;
    };
    const nextCode = (state, prefix, extraCodes = []) => {
        const safePrefix = normalizePrefix(prefix);
        const spec = SIMPLE_SPECS.find((candidate) => candidate.prefix === safePrefix);
        let maximum = spec ? currentFloorValue(state, spec) : storedMarkValue(state, safePrefix);
        rows(extraCodes).forEach((value) => {
            const sequence = parseCodeSequence(value, safePrefix);
            if (sequence !== null && sequence > maximum) maximum = sequence;
        });
        return formatCode(safePrefix, maximum + ONE);
    };
    const nextYearCode = (state, prefix, year, extraCodes = []) => {
        const safePrefix = normalizePrefix(prefix);
        const safeYear = String(year || '').trim();
        const spec = YEAR_SPECS.find((candidate) => candidate.prefix === safePrefix);
        if (!spec || !/^\d{4}$/.test(safeYear)) return '';
        let maximum = currentYearFloorValue(state, spec, safeYear);
        rows(extraCodes).forEach((value) => {
            const parsed = parseYearCode(value, safePrefix);
            if (parsed?.year === safeYear && parsed.sequence > maximum) maximum = parsed.sequence;
        });
        return formatYearCode(safePrefix, safeYear, maximum + ONE);
    };

    return {
        VERSION,
        MIN_DIGITS,
        SPECS,
        ADDITIONAL_SPECS,
        YEAR_SPECS,
        MASTER_SPECS,
        parseDecimal,
        parseCodeSequence,
        parseYearCode,
        serializeSequence,
        formatCode,
        formatYearCode,
        isValidCode,
        isValidYearCode,
        yearMarkKey,
        getHighWaterMark,
        nextCode,
        nextYearCode,
        buildPersistentMarks,
        buildUntrustedFamilies,
        diagnoseTransition,
        applyPersistentMarks,
        scanFamilyMax
    };
})();

if (typeof module !== 'undefined' && module?.exports) module.exports = OperationalCodeHighWater;
