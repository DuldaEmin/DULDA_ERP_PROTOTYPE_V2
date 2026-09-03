const CncImportService = {
    normalizeText: (value) => String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLocaleLowerCase('tr'),

    normalizeCode: (value) => String(value || '')
        .trim()
        .toUpperCase()
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-'),

    isObject: (value) => !!value && typeof value === 'object' && !Array.isArray(value),

    toNumber: (value, fallback = 0) => {
        const n = Number(value);
        if (!Number.isFinite(n)) return fallback;
        return n;
    },

    toSafeInt: (value, minValue = 0, fallback = 0) => {
        const n = Math.floor(CncImportService.toNumber(value, fallback));
        if (!Number.isFinite(n)) return fallback;
        return Math.max(minValue, n);
    },

    isIsoDateLike: (value) => {
        const text = String(value || '').trim();
        if (!text) return false;
        const ms = Date.parse(text);
        return Number.isFinite(ms) && ms > 0;
    },

    summarizeBinary: (value) => {
        const text = String(value || '');
        if (!text) return '';
        const head = text.slice(0, 96);
        const tail = text.slice(-96);
        return `${head}|len:${text.length}|${tail}`;
    },

    hashString: (input) => {
        const text = String(input || '');
        let hash = 0x811c9dc5;
        for (let i = 0; i < text.length; i += 1) {
            hash ^= text.charCodeAt(i);
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }
        return `h${(hash >>> 0).toString(16).padStart(8, '0')}`;
    },

    randomId: () => {
        if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
            return globalThis.crypto.randomUUID();
        }
        return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    },

    getDataRoot: (state) => {
        if (CncImportService.isObject(state?.data)) return state.data;
        if (CncImportService.isObject(state)) return state;
        return {};
    },

    getSourceBundles: (sourceState) => {
        if (Array.isArray(sourceState)) {
            return {
                cards: sourceState,
                categories: []
            };
        }
        const root = CncImportService.getDataRoot(sourceState);
        return {
            cards: Array.isArray(root?.cncCards) ? root.cncCards : [],
            categories: Array.isArray(root?.cncCategories) ? root.cncCategories : []
        };
    },

    buildSourceCategoryNameMap: (categories) => {
        const map = new Map();
        (Array.isArray(categories) ? categories : []).forEach((row) => {
            if (!CncImportService.isObject(row)) return;
            const key = String(row.id || '').trim();
            if (!key) return;
            const name = String(row.name || '').trim();
            if (!name) return;
            map.set(key, name);
        });
        return map;
    },

    pickIncomingCardsForUnit: (cards, unitId) => {
        const list = Array.isArray(cards) ? cards.filter(CncImportService.isObject) : [];
        const wantedUnitId = String(unitId || '').trim();
        if (!wantedUnitId) return list;
        const exact = list.filter((row) => String(row?.unitId || '').trim() === wantedUnitId);
        if (exact.length > 0) return exact;
        return list;
    },

    resolveIncomingCategoryName: (card, sourceCategoryMap) => {
        const fromCard = String(card?.categoryName || '').trim();
        if (fromCard) return fromCard;
        const fromMap = sourceCategoryMap.get(String(card?.categoryId || '').trim());
        return String(fromMap || '').trim();
    },

    buildOperationSignature: (op) => {
        const gcodeBody = String(op?.gcodeText || '').trim() || CncImportService.summarizeBinary(op?.gcodeFileDataUrl || '');
        const gcodeHash = CncImportService.hashString(gcodeBody);
        return [
            CncImportService.normalizeText(op?.name || ''),
            CncImportService.normalizeText(op?.machineType || ''),
            String(CncImportService.toSafeInt(op?.durationSec, 0, 0)),
            CncImportService.normalizeText(op?.note || ''),
            CncImportService.normalizeText(op?.gcodeFileName || ''),
            gcodeHash
        ].join('|');
    },

    buildDrawingSignature: (drawing) => {
        if (!CncImportService.isObject(drawing)) return '';
        const kind = CncImportService.normalizeText(drawing?.kind || '');
        const mime = CncImportService.normalizeText(drawing?.mime || '');
        const fileName = CncImportService.normalizeText(drawing?.name || '');
        const dataHash = CncImportService.hashString(CncImportService.summarizeBinary(drawing?.dataUrl || ''));
        return `${kind}|${mime}|${fileName}|${dataHash}`;
    },

    buildCardFingerprint: (card, categoryName = '') => {
        const ops = Array.isArray(card?.operations) ? [...card.operations] : [];
        const opSignature = ops
            .sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0))
            .map((op) => CncImportService.buildOperationSignature(op))
            .join('||');
        const drawingSignature = CncImportService.buildDrawingSignature(card?.technicalDrawing);
        const canonical = [
            CncImportService.normalizeText(card?.productName || card?.name || ''),
            CncImportService.normalizeText(categoryName || card?.categoryName || ''),
            CncImportService.normalizeText(card?.notes || ''),
            drawingSignature,
            opSignature
        ].join('###');
        return CncImportService.hashString(canonical);
    },

    getExistingCategoryMapForUnit: (targetState, unitId) => {
        const data = CncImportService.getDataRoot(targetState);
        const rows = Array.isArray(data?.cncCategories) ? data.cncCategories : [];
        const byNormalized = new Map();
        rows.forEach((row) => {
            if (!CncImportService.isObject(row)) return;
            if (String(row.unitId || '').trim() !== String(unitId || '').trim()) return;
            const key = CncImportService.normalizeText(row?.name || '');
            if (!key) return;
            byNormalized.set(key, row);
        });
        return byNormalized;
    },

    collectGlobalCodes: (targetState) => {
        if (typeof IdentityPolicy !== 'undefined'
            && IdentityPolicy
            && typeof IdentityPolicy.collectGlobalCodes === 'function') {
            return new Set(IdentityPolicy.collectGlobalCodes(targetState));
        }

        const data = CncImportService.getDataRoot(targetState);
        const bag = new Set();
        const add = (value) => {
            const normalized = CncImportService.normalizeCode(value);
            if (!normalized) return;
            bag.add(normalized);
        };
        const readMany = (list, fields) => {
            if (!Array.isArray(list)) return;
            list.forEach((row) => {
                fields.forEach((field) => add(row?.[field]));
            });
        };

        readMany(data?.products, ['code']);
        readMany(data?.cncCards, ['cncId']);
        readMany(data?.sawCutOrders, ['code']);
        readMany(data?.extruderLibraryCards, ['cardCode']);
        readMany(data?.plexiPolishCards, ['cardCode']);
        readMany(data?.pvdCards, ['cardCode']);
        readMany(data?.ibrahimPolishCards, ['cardCode']);
        readMany(data?.eloksalCards, ['cardCode']);
        readMany(data?.aluminumProfiles, ['code']);
        readMany(data?.montageCards, ['cardCode', 'productCode']);
        readMany(data?.workOrders, ['workOrderCode']);
        readMany(data?.depoTransferTasks, ['taskCode']);
        readMany(data?.salesCatalogProducts, ['idCode']);
        return bag;
    },

    nextCodeFromUsed: (usedCodes, prefix = 'CNC', digits = 6) => {
        if (typeof IdentityPolicy !== 'undefined'
            && IdentityPolicy
            && typeof IdentityPolicy.nextCodeFromUsed === 'function') {
            return IdentityPolicy.nextCodeFromUsed(usedCodes, prefix, digits);
        }
        const safePrefix = String(prefix || 'ID').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'ID';
        const width = Math.max(1, Number(digits || 6) || 6);
        const pattern = new RegExp(`^${safePrefix}-(\\d+)$`);
        let maxSeq = 0n;
        usedCodes.forEach((code) => {
            const match = String(code || '').match(pattern);
            if (!match) return;
            const seq = BigInt(match[1]);
            if (seq > maxSeq) maxSeq = seq;
        });
        let nextSeq = maxSeq + 1n;
        let candidate = `${safePrefix}-${nextSeq.toString().padStart(width, '0')}`;
        while (usedCodes.has(CncImportService.normalizeCode(candidate))) {
            nextSeq += 1n;
            candidate = `${safePrefix}-${nextSeq.toString().padStart(width, '0')}`;
        }
        return candidate;
    },

    getNextGlobalCode: (usedCodes, prefix = 'CNC', digits = 6, targetState = null) => {
        const next = targetState
            && typeof IdentityPolicy !== 'undefined'
            && IdentityPolicy
            && typeof IdentityPolicy.getNextMonotonicCode === 'function'
            ? IdentityPolicy.getNextMonotonicCode(targetState, { prefix, digits, usedCodes })
            : CncImportService.nextCodeFromUsed(usedCodes, prefix, digits);
        usedCodes.add(CncImportService.normalizeCode(next));
        return next;
    },

    validateCardForImport: (card) => {
        if (!CncImportService.isObject(card)) {
            return { ok: false, reason: 'INVALID_STRUCTURE' };
        }
        const name = String(card.productName || card.name || '').trim();
        if (!name) return { ok: false, reason: 'MISSING_PRODUCT_NAME' };
        const ops = Array.isArray(card.operations) ? card.operations : [];
        if (!ops.length) return { ok: false, reason: 'MISSING_OPERATIONS' };
        const invalidOp = ops.find((op) => {
            const opName = String(op?.name || '').trim();
            const machine = String(op?.machineType || '').trim();
            const duration = CncImportService.toNumber(op?.durationSec, 0);
            return !opName || !machine || !(duration > 0);
        });
        if (invalidOp) return { ok: false, reason: 'INVALID_OPERATION_FIELDS' };
        return { ok: true, reason: 'OK' };
    },

    reasonLabel: (reason) => {
        const map = {
            CONTENT_MATCH: 'Icerik eslesmesi (mevcut kart var)',
            SOURCE_DUPLICATE: 'Kaynak dosyada tekrar eden kart',
            INVALID_STRUCTURE: 'Gecersiz kart yapisi',
            MISSING_PRODUCT_NAME: 'Urun ismi eksik',
            MISSING_OPERATIONS: 'Operasyon listesi bos',
            INVALID_OPERATION_FIELDS: 'Operasyon alanlari eksik/gecersiz',
            UNKNOWN: 'Bilinmeyen neden'
        };
        return map[String(reason || '').trim()] || map.UNKNOWN;
    },

    buildDryRun: ({ targetState, sourceState, unitId }) => {
        const wantedUnitId = String(unitId || '').trim();
        const targetData = CncImportService.getDataRoot(targetState);
        const existingCardsInUnit = (Array.isArray(targetData?.cncCards) ? targetData.cncCards : [])
            .filter((row) => String(row?.unitId || '').trim() === wantedUnitId);

        const sourceBundle = CncImportService.getSourceBundles(sourceState);
        const sourceCategoryMap = CncImportService.buildSourceCategoryNameMap(sourceBundle.categories);
        const incomingCards = CncImportService.pickIncomingCardsForUnit(sourceBundle.cards, wantedUnitId);

        const existingByFingerprint = new Map();
        existingCardsInUnit.forEach((row) => {
            const categoryName = String(row?.categoryName || '').trim();
            const fp = CncImportService.buildCardFingerprint(row, categoryName);
            if (!fp || existingByFingerprint.has(fp)) return;
            existingByFingerprint.set(fp, row);
        });

        const existingCategoryMap = CncImportService.getExistingCategoryMapForUnit(targetState, wantedUnitId);
        const pendingCategoryNames = new Set();
        const usedCodes = CncImportService.collectGlobalCodes(targetState);
        const skipped = [];
        const toAdd = [];
        const seenIncomingFingerprints = new Set();

        incomingCards.forEach((card, sourceIndex) => {
            const categoryName = CncImportService.resolveIncomingCategoryName(card, sourceCategoryMap);
            const validation = CncImportService.validateCardForImport(card);
            if (!validation.ok) {
                skipped.push({
                    sourceIndex,
                    sourceId: String(card?.id || ''),
                    sourceCncId: String(card?.cncId || ''),
                    productName: String(card?.productName || card?.name || ''),
                    categoryName,
                    reason: validation.reason,
                    reasonLabel: CncImportService.reasonLabel(validation.reason)
                });
                return;
            }

            const fingerprint = CncImportService.buildCardFingerprint(card, categoryName);
            const matched = existingByFingerprint.get(fingerprint);
            if (matched) {
                skipped.push({
                    sourceIndex,
                    sourceId: String(card?.id || ''),
                    sourceCncId: String(card?.cncId || ''),
                    productName: String(card?.productName || card?.name || ''),
                    categoryName,
                    reason: 'CONTENT_MATCH',
                    reasonLabel: CncImportService.reasonLabel('CONTENT_MATCH'),
                    matchedId: String(matched?.id || ''),
                    matchedCncId: String(matched?.cncId || ''),
                    matchedProductName: String(matched?.productName || matched?.name || '')
                });
                return;
            }

            if (seenIncomingFingerprints.has(fingerprint)) {
                skipped.push({
                    sourceIndex,
                    sourceId: String(card?.id || ''),
                    sourceCncId: String(card?.cncId || ''),
                    productName: String(card?.productName || card?.name || ''),
                    categoryName,
                    reason: 'SOURCE_DUPLICATE',
                    reasonLabel: CncImportService.reasonLabel('SOURCE_DUPLICATE')
                });
                return;
            }
            seenIncomingFingerprints.add(fingerprint);

            const proposedCode = CncImportService.getNextGlobalCode(usedCodes, 'CNC', 6, targetState);
            const categoryKey = CncImportService.normalizeText(categoryName);
            if (categoryKey && !existingCategoryMap.has(categoryKey)) pendingCategoryNames.add(categoryName.trim());

            toAdd.push({
                sourceIndex,
                sourceId: String(card?.id || ''),
                sourceCncId: String(card?.cncId || ''),
                productName: String(card?.productName || card?.name || '').trim(),
                categoryName: String(categoryName || '').trim(),
                fingerprint,
                proposedCncId: proposedCode
            });
        });

        return {
            generatedAt: new Date().toISOString(),
            unitId: wantedUnitId,
            sourceStats: {
                sourceCardCount: Array.isArray(sourceBundle.cards) ? sourceBundle.cards.length : 0,
                selectedForUnitCount: incomingCards.length
            },
            summary: {
                incoming: incomingCards.length,
                skipped: skipped.length,
                addable: toAdd.length,
                categoriesToCreate: pendingCategoryNames.size
            },
            categoriesToCreate: [...pendingCategoryNames].sort((a, b) => a.localeCompare(b, 'tr')),
            skipped,
            toAdd
        };
    },

    sanitizeOperation: (raw, order) => ({
        id: CncImportService.randomId(),
        order,
        name: String(raw?.name || '').trim(),
        machineType: String(raw?.machineType || '').trim(),
        durationSec: Math.max(1, CncImportService.toSafeInt(raw?.durationSec, 0, 1)),
        note: String(raw?.note || '').trim(),
        gcodeText: String(raw?.gcodeText || '').trim(),
        gcodeFileName: String(raw?.gcodeFileName || '').trim(),
        gcodeFileDataUrl: String(raw?.gcodeFileDataUrl || '').trim()
    }),

    sanitizeDrawing: (raw) => {
        if (!CncImportService.isObject(raw)) return null;
        const dataUrl = String(raw?.dataUrl || '').trim();
        if (!dataUrl) return null;
        return {
            name: String(raw?.name || '').trim(),
            mime: String(raw?.mime || '').trim(),
            kind: String(raw?.kind || '').trim(),
            dataUrl,
            uploadedAt: CncImportService.isIsoDateLike(raw?.uploadedAt) ? String(raw.uploadedAt) : new Date().toISOString()
        };
    },

    commitImport: ({ targetState, sourceState, unitId, sourceFileName = '' }) => {
        const wantedUnitId = String(unitId || '').trim();
        const dryRun = CncImportService.buildDryRun({ targetState, sourceState, unitId: wantedUnitId });
        const targetData = CncImportService.getDataRoot(targetState);
        if (!Array.isArray(targetData.cncCards)) targetData.cncCards = [];
        if (!Array.isArray(targetData.cncCategories)) targetData.cncCategories = [];

        const existingCategoryMap = CncImportService.getExistingCategoryMapForUnit(targetState, wantedUnitId);
        const createdCategories = [];
        dryRun.categoriesToCreate.forEach((name) => {
            const key = CncImportService.normalizeText(name);
            if (!key || existingCategoryMap.has(key)) return;
            const row = {
                id: CncImportService.randomId(),
                unitId: wantedUnitId,
                name: String(name || '').trim(),
                createdAt: new Date().toISOString()
            };
            targetData.cncCategories.push(row);
            existingCategoryMap.set(key, row);
            createdCategories.push({ ...row });
        });

        const sourceBundle = CncImportService.getSourceBundles(sourceState);
        const sourceCategoryMap = CncImportService.buildSourceCategoryNameMap(sourceBundle.categories);
        const incomingCards = CncImportService.pickIncomingCardsForUnit(sourceBundle.cards, wantedUnitId);
        const usedCodes = CncImportService.collectGlobalCodes(targetState);

        const added = [];
        dryRun.toAdd.forEach((item) => {
            const raw = incomingCards[item.sourceIndex];
            if (!raw) return;

            const categoryName = String(CncImportService.resolveIncomingCategoryName(raw, sourceCategoryMap) || '').trim();
            const categoryKey = CncImportService.normalizeText(categoryName);
            const categoryRow = categoryKey ? existingCategoryMap.get(categoryKey) : null;
            const opsRaw = Array.isArray(raw?.operations) ? raw.operations : [];
            const operations = opsRaw
                .sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0))
                .map((op, idx) => CncImportService.sanitizeOperation(op, idx + 1));

            const cncId = CncImportService.getNextGlobalCode(usedCodes, 'CNC', 6, targetState);
            const now = new Date().toISOString();
            const payload = {
                id: CncImportService.randomId(),
                unitId: wantedUnitId,
                productName: String(raw?.productName || raw?.name || '').trim(),
                cncId,
                categoryId: String(categoryRow?.id || ''),
                categoryName: String(categoryRow?.name || categoryName || '').trim(),
                notes: String(raw?.notes || '').trim(),
                operations,
                technicalDrawing: CncImportService.sanitizeDrawing(raw?.technicalDrawing),
                createdAt: CncImportService.isIsoDateLike(raw?.createdAt) ? String(raw.createdAt) : now,
                updatedAt: now
            };
            targetData.cncCards.push(payload);
            added.push({
                id: payload.id,
                cncId: payload.cncId,
                productName: payload.productName,
                sourceCncId: String(raw?.cncId || '').trim()
            });
        });

        const result = {
            executedAt: new Date().toISOString(),
            sourceFileName: String(sourceFileName || ''),
            unitId: wantedUnitId,
            dryRun,
            summary: {
                incoming: dryRun.summary.incoming,
                skipped: dryRun.summary.skipped,
                added: added.length,
                createdCategories: createdCategories.length
            },
            skipped: dryRun.skipped,
            added,
            createdCategories
        };
        result.reportText = CncImportService.buildReportText(result);
        return result;
    },

    buildReportText: (result) => {
        const lines = [];
        lines.push('CNC IMPORT RAPORU');
        lines.push(`Tarih: ${String(result?.executedAt || '')}`);
        lines.push(`Kaynak dosya: ${String(result?.sourceFileName || '-')}`);
        lines.push(`Birim: ${String(result?.unitId || '-')}`);
        lines.push(`Gelen kart: ${Number(result?.summary?.incoming || 0)}`);
        lines.push(`Eklenen kart: ${Number(result?.summary?.added || 0)}`);
        lines.push(`Atlanan kart: ${Number(result?.summary?.skipped || 0)}`);
        lines.push(`Yeni kategori: ${Number(result?.summary?.createdCategories || 0)}`);
        lines.push('Yedek: Kayit oncesi snapshot .state-history klasorune otomatik yazilir.');
        lines.push('');

        const added = Array.isArray(result?.added) ? result.added : [];
        if (added.length > 0) {
            lines.push('EKLENEN KARTLAR');
            added.forEach((row, idx) => {
                lines.push(`${idx + 1}. ${row.cncId} | ${row.productName} | kaynak: ${row.sourceCncId || '-'}`);
            });
            lines.push('');
        }

        const skipped = Array.isArray(result?.skipped) ? result.skipped : [];
        if (skipped.length > 0) {
            lines.push('ATLANAN KARTLAR');
            skipped.forEach((row, idx) => {
                const reason = String(row?.reasonLabel || row?.reason || '-');
                const sourceCode = String(row?.sourceCncId || '-');
                const sourceName = String(row?.productName || '-');
                const matchInfo = row?.matchedCncId ? ` | mevcut: ${row.matchedCncId}` : '';
                lines.push(`${idx + 1}. ${sourceCode} | ${sourceName} | ${reason}${matchInfo}`);
            });
        }

        return lines.join('\n');
    }
};

window.CncImportService = CncImportService;
