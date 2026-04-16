/**
 * DULDA ERP - Offline Prototype Core
 * Synced with ASIL Design System
 */
const STORAGE_KEY = "DULDA_ERP_STATE";
const CONFLICT_DRAFT_KEY = "DULDA_ERP_STATE_CONFLICT_DRAFT";
const BROWSER_MIRROR_IDB_KEY = "DULDA_ERP_STATE_IDB_MIRROR";
const CONFLICT_DRAFT_IDB_KEY = "DULDA_ERP_STATE_CONFLICT_DRAFT_IDB";

const TextStylePolicy = {
    targetSelector: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'button', 'label', 'th',
        '.nav-btn', '.page-breadcrumb', '.app-name', '.stock-title', '.stock-hub-label'
    ].join(','),
    titleCaseSelector: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'button', 'label', 'th',
        '.nav-btn', '.page-breadcrumb', '.app-name', '.stock-title', '.stock-hub-label'
    ].join(','),
    attrNames: ['placeholder', 'title', 'aria-label'],
    wordRegex: /[A-Za-zÇĞİIÖŞÜçğıöşü]+/g,
    stopWords: new Set(['ve', 'veya', 'ile', 'için', 'de', 'da']),
    acronyms: new Set(['erp', 'cnc', 'pvd', 'wip', 'api', 'id', 'json', 'pdf', 'tl', 'usd', 'eur']),
    exactPhraseMap: new Map([
        ['ana sayfa', 'Ana Sayfa'],
        ['geri', 'Geri'],
        ['değişiklikleri kaydet', 'Değişiklikleri Kaydet'],
        ['degisiklikleri kaydet', 'Değişiklikleri Kaydet'],
        ['dosyaya otomatik kayıt', 'Dosyaya Otomatik Kayıt'],
        ['dosyaya otomatik kayit', 'Dosyaya Otomatik Kayıt'],
        ['otomatik kayıt', 'Otomatik Kayıt'],
        ['otomatik kayit', 'Otomatik Kayıt'],
        ['kaydediliyor...', 'Kaydediliyor...'],
        ['satış & pazarlama', 'Satış & Pazarlama'],
        ['satis & pazarlama', 'Satış & Pazarlama'],
        ['satış / sipariş oluşturma', 'Satış / Sipariş Oluşturma'],
        ['satis / siparis olusturma', 'Satış / Sipariş Oluşturma'],
        ['yeni sipariş', 'Yeni Sipariş'],
        ['yeni siparis', 'Yeni Sipariş'],
        ['siparişi kaydet', 'Siparişi Kaydet'],
        ['siparisi kaydet', 'Siparişi Kaydet'],
        ['müşteri seç', 'Müşteri Seç'],
        ['musteri sec', 'Müşteri Seç'],
        ['ürün seç', 'Ürün Seç'],
        ['urun sec', 'Ürün Seç'],
        ['satır ekle +', 'Satır Ekle +'],
        ['satir ekle +', 'Satır Ekle +'],
        ['kayıtlı sipariş yok.', 'Kayıtlı Sipariş Yok.'],
        ['kayitli siparis yok.', 'Kayıtlı Sipariş Yok.']
    ]),
    wordMap: new Map([
        ['satis', 'satış'],
        ['satış', 'satış'],
        ['siparis', 'sipariş'],
        ['sipariş', 'sipariş'],
        ['musteri', 'müşteri'],
        ['müşteri', 'müşteri'],
        ['urun', 'ürün'],
        ['ürün', 'ürün'],
        ['satir', 'satır'],
        ['satır', 'satır'],
        ['kayit', 'kayıt'],
        ['kayıt', 'kayıt'],
        ['kayitli', 'kayıtlı'],
        ['kayıtlı', 'kayıtlı'],
        ['degisiklikleri', 'değişiklikleri'],
        ['değişiklikleri', 'değişiklikleri'],
        ['olusturma', 'oluşturma'],
        ['oluşturma', 'oluşturma'],
        ['yonetim', 'yönetim'],
        ['yönetim', 'yönetim'],
        ['yonetimi', 'yönetimi'],
        ['yönetimi', 'yönetimi'],
        ['atolye', 'atölye'],
        ['atölye', 'atölye'],
        ['kutuphanesi', 'kütüphanesi'],
        ['kütüphanesi', 'kütüphanesi'],
        ['guncel', 'güncel'],
        ['güncel', 'güncel'],
        ['guncelle', 'güncelle'],
        ['güncelle', 'güncelle']
    ]),

    normalizeSpaces: (text) => String(text ?? '').replace(/\s+/g, ' ').trim(),

    isProcessableElement: (el) => {
        if (!el || typeof el.matches !== 'function') return false;
        if (el.closest?.('[data-skip-text-policy="true"]')) return false;
        return el.matches(TextStylePolicy.targetSelector);
    },

    shouldTitleCaseElement: (el) => {
        if (!el || typeof el.matches !== 'function') return false;
        return el.matches(TextStylePolicy.titleCaseSelector);
    },

    capitalizeTr: (word) => {
        const text = String(word || '').trim();
        if (!text) return '';
        const chars = Array.from(text);
        const first = chars.shift() || '';
        return first.toLocaleUpperCase('tr-TR') + chars.join('').toLocaleLowerCase('tr-TR');
    },

    applyOriginalCase: (rawWord, normalizedWord) => {
        const raw = String(rawWord || '');
        const next = String(normalizedWord || '');
        if (!raw) return next;
        if (raw === raw.toLocaleUpperCase('tr-TR')) return next.toLocaleUpperCase('tr-TR');
        const rawLower = raw.toLocaleLowerCase('tr-TR');
        const firstUpper = raw[0] === raw[0].toLocaleUpperCase('tr-TR');
        const restLower = raw.slice(1) === raw.slice(1).toLocaleLowerCase('tr-TR');
        if (firstUpper && restLower && raw !== rawLower) return TextStylePolicy.capitalizeTr(next);
        return next.toLocaleLowerCase('tr-TR');
    },

    replaceKnownWords: (text) => {
        return String(text ?? '').replace(TextStylePolicy.wordRegex, (word) => {
            const lower = String(word || '').toLocaleLowerCase('tr-TR');
            const mapped = TextStylePolicy.wordMap.get(lower);
            if (!mapped) return word;
            return TextStylePolicy.applyOriginalCase(word, mapped);
        });
    },

    toTitleCaseTr: (text) => {
        let wordIndex = 0;
        return String(text ?? '').replace(TextStylePolicy.wordRegex, (word) => {
            const lower = String(word || '').toLocaleLowerCase('tr-TR');
            const isFirst = wordIndex === 0;
            wordIndex += 1;
            if (TextStylePolicy.acronyms.has(lower)) return lower.toLocaleUpperCase('tr-TR');
            if (!isFirst && TextStylePolicy.stopWords.has(lower)) return lower;
            return TextStylePolicy.capitalizeTr(lower);
        });
    },

    normalizeUiText: (rawText, el = null) => {
        const base = TextStylePolicy.normalizeSpaces(rawText);
        if (!base) return String(rawText ?? '');

        const lookup = base.toLocaleLowerCase('tr-TR');
        let out = TextStylePolicy.exactPhraseMap.get(lookup) || base;
        out = TextStylePolicy.replaceKnownWords(out);

        if (el && TextStylePolicy.shouldTitleCaseElement(el)) {
            out = TextStylePolicy.toTitleCaseTr(out);
        }
        return out;
    },

    normalizeTextNodeValue: (rawText, node) => {
        const parent = node?.parentElement || null;
        if (!TextStylePolicy.isProcessableElement(parent)) return String(rawText ?? '');
        return TextStylePolicy.normalizeUiText(rawText, parent);
    },

    normalizeAttributeValue: (rawText, el, attr) => {
        if (!TextStylePolicy.attrNames.includes(String(attr || '').toLowerCase())) return String(rawText ?? '');
        return TextStylePolicy.normalizeUiText(rawText, el);
    }
};
window.TextStylePolicy = TextStylePolicy;

const MojibakeFix = {
    markerRegex: /[\u00C3\u00C2\u00E2\u00C4\u00C5\u00C6\uFFFD]/,
    suspiciousRegex: /[\u00C3\u00C2\u00E2\u00C4\u00C5\u00C6\u0192\u201A\u0152\u0153\uFFFD]/,
    cp1252UnicodeToByte: new Map([
        [0x20AC, 0x80], [0x201A, 0x82], [0x0192, 0x83], [0x201E, 0x84], [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87],
        [0x02C6, 0x88], [0x2030, 0x89], [0x0160, 0x8A], [0x2039, 0x8B], [0x0152, 0x8C], [0x017D, 0x8E], [0x2018, 0x91],
        [0x2019, 0x92], [0x201C, 0x93], [0x201D, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97], [0x02DC, 0x98],
        [0x2122, 0x99], [0x0161, 0x9A], [0x203A, 0x9B], [0x0153, 0x9C], [0x017E, 0x9E], [0x0178, 0x9F]
    ]),
    cpChunkRegex: /[A-Za-z0-9\u00A0-\u00FF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u02C6\u02DC\u2013\u2014\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2026\u2030\u2039\u203A€]+/g,
    attrs: ['placeholder', 'title', 'aria-label', 'value'],
    observer: null,

    needsFix: (text) => {
        if (!text) return false;
        return MojibakeFix.suspiciousRegex.test(String(text));
    },

    shouldSkipString: (text) => {
        const raw = String(text || '');
        if (!MojibakeFix.needsFix(raw)) return true;
        if (/^data:[^\n]{0,200};base64,/i.test(raw)) return true;
        if (raw.length > 120000 && /base64,/i.test(raw)) return true;
        return false;
    },

    decodeChunk: (chunk) => {
        if (!MojibakeFix.markerRegex.test(chunk)) return chunk;
        const bytes = [];
        for (const ch of String(chunk || '')) {
            const cp = ch.codePointAt(0);
            if (cp <= 0xFF) {
                bytes.push(cp);
                continue;
            }
            const mapped = MojibakeFix.cp1252UnicodeToByte.get(cp);
            if (typeof mapped === 'number') {
                bytes.push(mapped);
                continue;
            }
            return String(chunk || '');
        }
        let decoded = '';
        try {
            decoded = new TextDecoder('utf-8').decode(new Uint8Array(bytes));
        } catch (_e) {
            return String(chunk || '');
        }
        if (!decoded) return String(chunk || '');
        if (decoded.includes('\uFFFD')) return String(chunk || '');
        const beforeBad = (String(chunk || '').match(/[\u00C3\u00C2\u00E2\u00C4\u00C5\u00C6\uFFFD]/g) || []).length;
        const afterBad = (String(decoded || '').match(/[\u00C3\u00C2\u00E2\u00C4\u00C5\u00C6\uFFFD]/g) || []).length;
        if (afterBad > beforeBad) return String(chunk || '');
        return decoded;
    },

    decodePass: (text) => {
        const raw = String(text ?? '');
        return raw.replace(MojibakeFix.cpChunkRegex, (chunk) => MojibakeFix.decodeChunk(chunk));
    },

    normalize: (text) => {
        let out = String(text ?? '');
        if (!MojibakeFix.needsFix(out)) return out;
        for (let i = 0; i < 4; i += 1) {
            const next = MojibakeFix.decodePass(out);
            if (!next || next === out) break;
            out = next;
            if (!MojibakeFix.needsFix(out)) break;
        }
        return out;
    },

    sanitizeObjectStrings: (value, seen = new WeakSet()) => {
        if (!value || typeof value !== 'object') return false;
        if (seen.has(value)) return false;
        seen.add(value);

        let changed = false;

        if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i += 1) {
                const entry = value[i];
                if (typeof entry === 'string') {
                    if (MojibakeFix.shouldSkipString(entry)) continue;
                    const fixed = MojibakeFix.normalize(entry);
                    if (fixed !== entry) {
                        value[i] = fixed;
                        changed = true;
                    }
                    continue;
                }
                if (entry && typeof entry === 'object' && MojibakeFix.sanitizeObjectStrings(entry, seen)) {
                    changed = true;
                }
            }
            return changed;
        }

        Object.keys(value).forEach((key) => {
            const entry = value[key];
            if (typeof entry === 'string') {
                if (MojibakeFix.shouldSkipString(entry)) return;
                const fixed = MojibakeFix.normalize(entry);
                if (fixed !== entry) {
                    value[key] = fixed;
                    changed = true;
                }
                return;
            }
            if (entry && typeof entry === 'object' && MojibakeFix.sanitizeObjectStrings(entry, seen)) {
                changed = true;
            }
        });

        return changed;
    },

    sanitizeTextNode: (node) => {
        const raw = node?.nodeValue;
        if (typeof raw !== 'string') return;
        let fixed = MojibakeFix.needsFix(raw) ? MojibakeFix.normalize(raw) : raw;
        fixed = TextStylePolicy.normalizeTextNodeValue(fixed, node);
        if (fixed !== raw) node.nodeValue = fixed;
    },

    sanitizeElementAttrs: (el) => {
        if (!el || !el.getAttribute) return;
        MojibakeFix.attrs.forEach((attr) => {
            const raw = el.getAttribute(attr);
            if (raw == null) return;
            let fixed = MojibakeFix.needsFix(raw) ? MojibakeFix.normalize(raw) : String(raw);
            if (String(attr || '').toLowerCase() !== 'value') {
                fixed = TextStylePolicy.normalizeAttributeValue(fixed, el, attr);
            }
            if (fixed !== raw) el.setAttribute(attr, fixed);
            if (attr === 'value' && 'value' in el && typeof el.value === 'string' && MojibakeFix.needsFix(el.value)) {
                el.value = MojibakeFix.normalize(el.value);
            }
        });
    },

    sanitizeTree: (root) => {
        const start = root || document.body;
        if (!start) return;

        if (start.nodeType === Node.TEXT_NODE) {
            MojibakeFix.sanitizeTextNode(start);
            return;
        }

        if (start.nodeType !== Node.ELEMENT_NODE && start.nodeType !== Node.DOCUMENT_NODE) return;

        const walker = document.createTreeWalker(start, NodeFilter.SHOW_TEXT, null);
        let textNode = walker.nextNode();
        while (textNode) {
            MojibakeFix.sanitizeTextNode(textNode);
            textNode = walker.nextNode();
        }

        if (start.querySelectorAll) {
            MojibakeFix.sanitizeElementAttrs(start);
            start.querySelectorAll('*').forEach((el) => MojibakeFix.sanitizeElementAttrs(el));
        }
    },

    installObserver: () => {
        if (MojibakeFix.observer || !document?.body) return;
        MojibakeFix.observer = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                if (m.type === 'characterData') {
                    MojibakeFix.sanitizeTextNode(m.target);
                    return;
                }
                m.addedNodes.forEach((n) => MojibakeFix.sanitizeTree(n));
            });
        });
        MojibakeFix.observer.observe(document.body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }
};
window.MojibakeFix = MojibakeFix;

const IdentityPolicy = {
    entityPrefixes: {
        products: 'URN',
        customers: 'MUS',
        suppliers: 'TED',
        personnel: 'USR',
        orders: 'SIP',
        stock_movements: 'TRX',
        units: 'UNT',
        machines: 'MAC',
        productCategories: 'CAT',
        inventory: 'INV',
        aluminumProfiles: 'ALM',
        cncCards: 'CNC',
        plexiPolishCards: 'PLX',
        pvdCards: 'PVD',
        eloksalCards: 'ELX',
        ibrahimPolishCards: 'POL',
        extruderLibraryCards: 'EXT',
        montageCards: 'MNT',
        catalogProductVariants: 'UPV',
        salesCatalogProducts: 'SCP',
        depoTransferTasks: 'DTT',
        depoTransferLogs: 'DTL',
        depoRoutes: 'DRT',
        workOrders: 'WKO',
        workOrderTransactions: 'WKT',
        outsourceTransfers: 'OST'
    },

    codeFieldDefinitions: [
        { collection: 'products', field: 'code', prefix: 'PRD', digits: 6, repair: false },
        { collection: 'cncCards', field: 'cncId', prefix: 'CNC', digits: 6, repair: true },
        { collection: 'sawCutOrders', field: 'code', prefix: 'TST', digits: 6, repair: true },
        { collection: 'extruderLibraryCards', field: 'cardCode', prefix: 'EXT', digits: 6, repair: true },
        { collection: 'plexiPolishCards', field: 'cardCode', prefix: 'PLSJ', digits: 6, repair: true },
        { collection: 'pvdCards', field: 'cardCode', prefix: 'PVD', digits: 6, repair: true },
        { collection: 'ibrahimPolishCards', field: 'cardCode', prefix: 'POL', digits: 6, repair: true },
        { collection: 'eloksalCards', field: 'cardCode', prefix: 'ELX', digits: 6, repair: true },
        { collection: 'aluminumProfiles', field: 'code', prefix: 'ALM', digits: 6, repair: false },
        { collection: 'colorLibrary', field: 'code', prefix: 'CLR', digits: 6, repair: false },
        { collection: 'partComponentCards', field: 'code', prefix: 'CMP', digits: 6, repair: false },
        { collection: 'semiFinishedCards', field: 'code', prefix: 'SEM', digits: 6, repair: false },
        { collection: 'assemblyGroups', field: 'code', prefix: 'GRP', digits: 6, repair: false },
        { collection: 'catalogProductVariants', field: 'familyCode', prefix: 'FAM', digits: 6, repair: false },
        { collection: 'catalogProductVariants', field: 'variantCode', prefix: 'VAR', digits: 6, repair: false },
        { collection: 'montageCards', field: 'cardCode', prefix: 'MNT', digits: 6, repair: true },
        { collection: 'montageCards', field: 'productCode', prefix: 'MNP', digits: 6, repair: false },
        { collection: 'workOrders', field: 'workOrderCode', prefix: 'WKO', digits: 6, repair: true },
        { collection: 'depoTransferTasks', field: 'taskCode', prefix: 'DTR', digits: 6, repair: true },
        { collection: 'freeExternalVendorJobs', field: 'jobCode', prefix: 'FEV', digits: 6, repair: true },
        { collection: 'salesCatalogProducts', field: 'idCode', prefix: 'SAL', digits: 6, repair: true }
    ],

    normalizeId: (value) => String(value ?? '').trim(),

    makeId: (prefix, usedIds) => {
        const cleanPrefix = String(prefix || 'ID')
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase()
            .slice(0, 3) || 'ID';

        for (let i = 0; i < 20; i += 1) {
            const token = (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
                ? globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
                : Math.random().toString(36).slice(2, 10).toUpperCase();
            const candidate = `${cleanPrefix}-${token}`;
            if (!usedIds.has(candidate)) return candidate;
        }

        let seq = 1;
        while (true) {
            const candidate = `${cleanPrefix}-${String(seq).padStart(6, '0')}`;
            if (!usedIds.has(candidate)) return candidate;
            seq += 1;
        }
    },

    getDataRoot: (root) => {
        if (!root || typeof root !== 'object') return null;
        if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) return root.data;
        return root;
    },

    normalizeCode: (value) => String(value ?? '')
        .trim()
        .toUpperCase()
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-'),

    collectGlobalCodes: (root, exclude = null) => {
        const dataRoot = IdentityPolicy.getDataRoot(root);
        const bag = new Set();
        if (!dataRoot) return bag;

        const shouldSkip = (collection, row, field) => {
            if (!exclude || !row) return false;
            if (exclude.collection && String(exclude.collection || '') !== String(collection || '')) return false;
            if (exclude.id && String(exclude.id || '') !== String(row.id || '')) return false;
            if (exclude.field && String(exclude.field || '') !== String(field || '')) return false;
            return true;
        };

        IdentityPolicy.codeFieldDefinitions.forEach((def) => {
            const list = dataRoot?.[def.collection];
            if (!Array.isArray(list)) return;
            list.forEach((row) => {
                if (!row || typeof row !== 'object') return;
                if (shouldSkip(def.collection, row, def.field)) return;
                const code = IdentityPolicy.normalizeCode(row?.[def.field]);
                if (!code) return;
                bag.add(code);
            });
        });

        return bag;
    },

    isGlobalCodeTaken: (root, code, exclude = null) => {
        const normalized = IdentityPolicy.normalizeCode(code);
        if (!normalized) return false;
        return IdentityPolicy.collectGlobalCodes(root, exclude).has(normalized);
    },

    nextCodeFromUsed: (usedCodes, prefix, digits = 6) => {
        const safePrefix = String(prefix || 'ID')
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase() || 'ID';
        const width = Number.isFinite(Number(digits)) ? Math.max(1, Number(digits)) : 6;
        const pattern = new RegExp(`^${safePrefix}-(\\d+)$`);
        let maxSeq = 0;
        usedCodes.forEach((code) => {
            const match = String(code || '').match(pattern);
            if (!match) return;
            const seq = Number(match[1]);
            if (Number.isFinite(seq) && seq > maxSeq) maxSeq = seq;
        });
        let nextSeq = maxSeq + 1;
        let candidate = `${safePrefix}-${String(nextSeq).padStart(width, '0')}`;
        while (usedCodes.has(IdentityPolicy.normalizeCode(candidate))) {
            nextSeq += 1;
            candidate = `${safePrefix}-${String(nextSeq).padStart(width, '0')}`;
        }
        return candidate;
    },

    getNextGlobalCode: (root, options = {}) => {
        const prefix = String(options?.prefix || 'ID');
        const digits = Number(options?.digits || 6);
        const exclude = options?.exclude || null;
        const used = IdentityPolicy.collectGlobalCodes(root, exclude);
        return IdentityPolicy.nextCodeFromUsed(used, prefix, digits);
    },

    enforceGlobalCodeUniqueness: (root) => {
        const dataRoot = IdentityPolicy.getDataRoot(root);
        if (!dataRoot) return false;

        const usedCodes = new Set();
        let changed = false;

        IdentityPolicy.codeFieldDefinitions
            .filter(Boolean)
            .forEach((def) => {
                const list = dataRoot?.[def.collection];
                if (!Array.isArray(list)) return;
                list.forEach((row) => {
                    if (!row || typeof row !== 'object') return;
                    const currentRaw = String(row?.[def.field] ?? '').trim();
                    const currentCode = IdentityPolicy.normalizeCode(currentRaw);

                    if (!currentCode) {
                        if (def.repair === false) return;
                        const generatedMissing = IdentityPolicy.nextCodeFromUsed(usedCodes, def.prefix || 'ID', def.digits || 6);
                        if (String(row?.[def.field] ?? '') !== generatedMissing) {
                            row[def.field] = generatedMissing;
                            changed = true;
                        }
                        usedCodes.add(IdentityPolicy.normalizeCode(generatedMissing));
                        return;
                    }

                    if (currentCode && !usedCodes.has(currentCode)) {
                        if (String(row?.[def.field] ?? '') !== currentRaw) {
                            row[def.field] = currentRaw;
                            changed = true;
                        }
                        usedCodes.add(currentCode);
                        return;
                    }

                    if (def.repair === false) return;

                    const generated = IdentityPolicy.nextCodeFromUsed(usedCodes, def.prefix || 'ID', def.digits || 6);
                    if (String(row?.[def.field] ?? '') !== generated) {
                        row[def.field] = generated;
                        changed = true;
                    }
                    usedCodes.add(IdentityPolicy.normalizeCode(generated));
                });
            });

        return changed;
    },

    ensureCollectionIds: (list, prefix, usedIds) => {
        if (!Array.isArray(list)) return false;
        let changed = false;

        for (let i = 0; i < list.length; i += 1) {
            const row = list[i];
            if (!row || typeof row !== 'object') continue;

            const current = IdentityPolicy.normalizeId(row.id);
            if (!current || usedIds.has(current)) {
                row.id = IdentityPolicy.makeId(prefix, usedIds);
                changed = true;
            } else if (String(row.id) !== current) {
                row.id = current;
                changed = true;
            }
            usedIds.add(String(row.id));
        }

        return changed;
    },

    enforce: (root) => {
        const d = root?.data;
        if (!d || typeof d !== 'object') return false;

        const usedIds = new Set();
        let changed = false;

        Object.keys(IdentityPolicy.entityPrefixes).forEach((key) => {
            const list = d[key];
            if (!Array.isArray(list)) return;
            if (IdentityPolicy.ensureCollectionIds(list, IdentityPolicy.entityPrefixes[key], usedIds)) {
                changed = true;
            }
        });

        if (IdentityPolicy.enforceGlobalCodeUniqueness(root)) {
            changed = true;
        }

        return changed;
    }
};
window.IdentityPolicy = IdentityPolicy;

const ActionGuard = {
    installed: false,
    inFlight: new Set(),
    moduleNames: [
        "CncLibraryModule",
        "MontageLibraryModule",
        "UnitModule",
        "ProductLibraryModule",
        "PurchasingModule",
        "SalesModule",
        "StockModule",
        "PlanningModule",
        "PersonnelModule",
        "AluminumModule"
    ],
    methodRegex: /^(save|submit)/i,

    argToken: (value) => {
        if (value === null) return "null";
        if (value === undefined) return "undefined";
        const type = typeof value;
        if (type === "string" || type === "number" || type === "boolean" || type === "bigint") {
            return String(value);
        }
        if (type === "function") return "[fn]";
        try {
            return JSON.stringify(value);
        } catch (_e) {
            return Object.prototype.toString.call(value);
        }
    },

    makeKey: (moduleName, methodName, args) => {
        const argKey = Array.isArray(args)
            ? args.slice(0, 4).map((arg) => ActionGuard.argToken(arg)).join("::")
            : "";
        return `${moduleName}.${methodName}::${argKey}`;
    },

    wrapMethod: (moduleName, moduleObj, methodName) => {
        if (!moduleObj || typeof moduleObj[methodName] !== "function") return;
        const original = moduleObj[methodName];
        if (original.__actionGuardWrapped) return;

        const wrapped = function (...args) {
            const key = ActionGuard.makeKey(moduleName, methodName, args);
            if (ActionGuard.inFlight.has(key)) {
                console.warn(`[ActionGuard] Duplicate call ignored: ${moduleName}.${methodName}`);
                return undefined;
            }

            ActionGuard.inFlight.add(key);

            let result;
            try {
                result = original.apply(this, args);
            } catch (error) {
                ActionGuard.inFlight.delete(key);
                throw error;
            }

            if (result && typeof result.then === "function") {
                return result.finally(() => {
                    ActionGuard.inFlight.delete(key);
                });
            }

            ActionGuard.inFlight.delete(key);
            return result;
        };

        wrapped.__actionGuardWrapped = true;
        moduleObj[methodName] = wrapped;
    },

    install: () => {
        if (ActionGuard.installed) return;
        ActionGuard.installed = true;

        ActionGuard.moduleNames.forEach((moduleName) => {
            const moduleObj = globalThis?.[moduleName];
            if (!moduleObj || typeof moduleObj !== "object") return;

            Object.keys(moduleObj).forEach((methodName) => {
                if (!ActionGuard.methodRegex.test(methodName)) return;
                ActionGuard.wrapMethod(moduleName, moduleObj, methodName);
            });
        });
    }
};

const RuntimePerformance = {
    installed: false,
    installLucideBatcher: () => {
        if (RuntimePerformance.installed) return;
        RuntimePerformance.installed = true;

        if (!globalThis.lucide || typeof globalThis.lucide.createIcons !== "function") return;
        if (globalThis.lucide.createIcons.__batchedCreateIcons) return;
        const rawCreateIcons = globalThis.lucide.createIcons.bind(globalThis.lucide);

        let scheduled = false;
        let latestArgs = [];

        const flush = () => {
            scheduled = false;
            try {
                rawCreateIcons(...latestArgs);
            } catch (error) {
                console.warn("Lucide icon refresh failed.", error);
            }
        };

        const batchedCreateIcons = (...args) => {
            latestArgs = args;
            if (scheduled) return;
            scheduled = true;
            const runner = globalThis.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
            runner(flush);
        };

        batchedCreateIcons.__batchedCreateIcons = true;
        globalThis.lucide.createIcons = batchedCreateIcons;
    }
};

const NavigationGuard = {
    installed: false,
    installLinkClickGuard: () => {
        if (NavigationGuard.installed) return;
        NavigationGuard.installed = true;

        document.addEventListener("click", (event) => {
            const targetNode = event.target;
            const targetElement = targetNode && targetNode.nodeType === 1
                ? targetNode
                : targetNode?.parentElement || null;
            const link = targetElement?.closest?.('a[href="#"], a[href="javascript:void(0)"]');
            if (!link) return;
            event.preventDefault();
        }, true);
    }
};

const App = {
    init: async () => {
        console.log("DULDA ERP Initializing...");

        RuntimePerformance.installLucideBatcher();
        await DB.loadState();
        ActionGuard.install();
        NavigationGuard.installLinkClickGuard();

        // Initialize Router and UI
        Router.init();
        UI.init();
        MojibakeFix.installObserver();
        MojibakeFix.sanitizeTree(document.body);
        if (DB.storageMode === "disk") UI.updateStatus("🟢 Dosyaya Otomatik Kayıt");
        else UI.updateStatus("🟡 Tarayıcı Kaydı (Yedek)");
    },

    db: {
        // Legacy reference, keeping for compatibility if utilized elsewhere.
    }
};

const DB = {
    data: {
        schema_version: 1,
        meta: { created_at: new Date().toISOString() },
        data: {
            products: [],
            customers: [],
            suppliers: [],
            personnel: [],
            stock_movements: [],
            orders: [],
            units: [],
            machines: [],
            inventory: [],
            aluminumProfiles: [],
            cncCards: [],
            cncCategories: [],
            plexiPolishCards: [],
            pvdCards: [],
            eloksalCards: [],
            ibrahimPolishCards: [],
            processColorLists: {},
            polishSurfaceLists: {},
            extruderLibraryCards: [],
            montageCards: [],
            catalogProductVariants: [],
            salesCatalogProducts: [],
            planningDemands: [],
            depoTransferTasks: [],
            workOrders: [],
            workOrderTransactions: [],
            outsourceTransfers: [],
            depoTransferLogs: [],
            depoRoutes: []
        }
    },
    saveTimeout: null,
    storageMode: "localStorage",
    saveInProgress: false,
    saveQueued: false,
    baseRevision: 0,
    clientSessionId: (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
        ? globalThis.crypto.randomUUID()
        : `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,

    mirrorStateToLocalStorage: (state = DB.data) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            return true;
        } catch (error) {
            console.warn("Disk save succeeded, but browser mirror could not be updated.", error);
            return false;
        }
    },

    clearConflictDrafts: async () => {
        try {
            localStorage.removeItem(CONFLICT_DRAFT_KEY);
        } catch (error) {
            console.warn("Could not clear local conflict draft key.", error);
        }
        const cleared = await IDB.del(CONFLICT_DRAFT_IDB_KEY);
        if (!cleared) {
            console.warn("Could not clear IndexedDB conflict draft key.");
        }
    },

    mirrorStateToBrowserBackup: async (state = DB.data) => {
        const localMirrored = DB.mirrorStateToLocalStorage(state);
        const idbMirrored = await IDB.set(BROWSER_MIRROR_IDB_KEY, state);
        if (!idbMirrored) {
            console.warn("Disk save succeeded, but IndexedDB mirror could not be updated.");
        }
        await DB.clearConflictDrafts();
        return {
            localMirrored,
            idbMirrored,
            mirrored: localMirrored || idbMirrored
        };
    },

    storeConflictDraft: async (snapshot) => {
        let localSaved = false;
        try {
            localStorage.setItem(CONFLICT_DRAFT_KEY, JSON.stringify(snapshot));
            localSaved = true;
        } catch (error) {
            console.warn("Could not write local recovery draft.", error);
        }
        const idbSaved = await IDB.set(CONFLICT_DRAFT_IDB_KEY, snapshot);
        if (!idbSaved) {
            console.warn("Could not write IndexedDB recovery draft.");
        }
        return {
            saved: localSaved || idbSaved,
            localSaved,
            idbSaved
        };
    },

    normalizeData: () => {
        if (!DB.data || typeof DB.data !== "object") {
            DB.data = { schema_version: 1, meta: {}, data: {} };
        }

        if (!DB.data.meta || typeof DB.data.meta !== "object") DB.data.meta = {};
        if (!DB.data.meta.created_at) DB.data.meta.created_at = new Date().toISOString();
        if (!Number.isInteger(DB.data.meta.revision) || DB.data.meta.revision < 0) DB.data.meta.revision = 0;

        if (!DB.data.data || typeof DB.data.data !== "object") DB.data.data = {};
        const d = DB.data.data;

        if (!Array.isArray(d.products)) d.products = [];
        if (!Array.isArray(d.customers)) d.customers = [];
        if (!Array.isArray(d.suppliers)) d.suppliers = [];
        if (!Array.isArray(d.personnel)) d.personnel = [];
        if (!Array.isArray(d.stock_movements)) d.stock_movements = [];
        if (!Array.isArray(d.orders)) d.orders = [];
        if (!Array.isArray(d.units)) d.units = [];
        if (!Array.isArray(d.machines)) d.machines = [];
        if (!Array.isArray(d.inventory)) d.inventory = [];
        if (!Array.isArray(d.aluminumProfiles)) d.aluminumProfiles = [];
        if (!Array.isArray(d.cncCards)) d.cncCards = [];
        if (!Array.isArray(d.cncCategories)) d.cncCategories = [];
        if (!Array.isArray(d.plexiPolishCards)) d.plexiPolishCards = [];
        if (!Array.isArray(d.pvdCards)) d.pvdCards = [];
        if (!Array.isArray(d.eloksalCards)) d.eloksalCards = [];
        if (!Array.isArray(d.ibrahimPolishCards)) d.ibrahimPolishCards = [];
        if (!d.processColorLists || typeof d.processColorLists !== "object" || Array.isArray(d.processColorLists)) d.processColorLists = {};
        if (!d.polishSurfaceLists || typeof d.polishSurfaceLists !== "object" || Array.isArray(d.polishSurfaceLists)) d.polishSurfaceLists = {};
        if (!Array.isArray(d.extruderLibraryCards)) d.extruderLibraryCards = [];
        if (!Array.isArray(d.montageCards)) d.montageCards = [];
        if (!Array.isArray(d.catalogProductVariants)) d.catalogProductVariants = [];
        if (!Array.isArray(d.salesCatalogProducts)) d.salesCatalogProducts = [];
        if (!Array.isArray(d.planningDemands)) d.planningDemands = [];
        if (!Array.isArray(d.depoTransferTasks)) d.depoTransferTasks = [];
        if (!Array.isArray(d.workOrders)) d.workOrders = [];
        if (!Array.isArray(d.workOrderTransactions)) d.workOrderTransactions = [];
        if (!Array.isArray(d.outsourceTransfers)) d.outsourceTransfers = [];
        if (!Array.isArray(d.depoTransferLogs)) d.depoTransferLogs = [];
        if (!Array.isArray(d.depoRoutes)) d.depoRoutes = [];
        if (!Array.isArray(d.productCategories)) d.productCategories = [];

        const identityChanged = IdentityPolicy.enforce(DB.data);
        if (identityChanged) {
            console.warn("ID Anayasasi uygulandi: eksik veya tekrar eden id alanlari duzeltildi.");
        }
    },

    loadState: async () => {
        let diskState = null;
        let localState = null;
        let localStateSource = "";
        let recoveryDraftState = null;
        let loaded = null;

        const stateTime = (state) => {
            const ts = state?.meta?.updated_at || state?.meta?.created_at || "";
            const ms = Date.parse(ts);
            return Number.isFinite(ms) ? ms : 0;
        };
        const stateRevision = (state) => {
            const revision = Number(state?.meta?.revision);
            return Number.isInteger(revision) && revision >= 0 ? revision : 0;
        };

        // Disk file
        try {
            const resp = await fetch("/api/state", { cache: "no-store" });
            if (resp.ok) {
                const payload = await resp.json();
                if (payload?.ok && payload.state) {
                    diskState = payload.state;
                }
            }
        } catch (e) {
            console.warn("Disk state unavailable, fallback to localStorage.", e);
        }

        // localStorage backup
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                localState = JSON.parse(saved);
                localStateSource = "localStorage";
            } catch (e) {
                console.error("localStorage verisi bozuk, temiz başlangıç yapılacak.", e);
            }
        }
        if (!localState) {
            const indexedMirror = await IDB.get(BROWSER_MIRROR_IDB_KEY);
            if (indexedMirror && typeof indexedMirror === "object") {
                localState = indexedMirror;
                localStateSource = "indexedDB";
            }
        }

        const recoveryDraftRaw = localStorage.getItem(CONFLICT_DRAFT_KEY);
        if (recoveryDraftRaw) {
            try {
                recoveryDraftState = JSON.parse(recoveryDraftRaw);
            } catch (e) {
                console.warn("local conflict draft bozuk, atlandi.", e);
            }
        }
        if (!recoveryDraftState) {
            const indexedDraft = await IDB.get(CONFLICT_DRAFT_IDB_KEY);
            if (indexedDraft && typeof indexedDraft === "object") {
                recoveryDraftState = indexedDraft;
            }
        }

        // Decide best source:
        // Prefer higher revision. On ties, prefer newest timestamp. On full ties, prefer disk.
        if (diskState && localState) {
            const diskRevision = stateRevision(diskState);
            const localRevision = stateRevision(localState);
            const diskTime = stateTime(diskState);
            const localTime = stateTime(localState);

            if (localRevision > diskRevision) {
                loaded = localState;
                DB.storageMode = "localStorage";
            } else if (diskRevision > localRevision) {
                loaded = diskState;
                DB.storageMode = "disk";
            } else if (localTime > diskTime) {
                loaded = localState;
                DB.storageMode = "localStorage";
            } else {
                loaded = diskState;
                DB.storageMode = "disk";
            }
        } else if (diskState) {
            loaded = diskState;
            DB.storageMode = "disk";
        } else if (localState) {
            loaded = localState;
            DB.storageMode = "localStorage";
        } else if (recoveryDraftState) {
            loaded = recoveryDraftState;
            DB.storageMode = "localStorage";
            console.warn("Recovered unsynced state draft from browser backup.");
        }

        if (loaded) DB.data = loaded;
        DB.normalizeData();
        DB.baseRevision = Number(DB.data?.meta?.revision || 0);
        // localStorage kazandiysa, ilk disk kaydini diskteki revizyona gore yap.
        if (loaded && DB.storageMode === "localStorage" && diskState) {
            DB.baseRevision = stateRevision(diskState);
        }
        const repairedMojibake = MojibakeFix.sanitizeObjectStrings(DB.data);
        if (repairedMojibake) {
            console.warn("Mojibake metinler bulundu ve otomatik duzeltildi.");
        }

        // If local wins, sync it to disk so next run is consistent.
        if (loaded && (DB.storageMode === "localStorage" || repairedMojibake)) {
            await DB.save();
        }

        if (!loaded) {
            console.log("No saved data found, starting fresh.");
        } else {
            const sourceSuffix = (loaded === localState && localStateSource === "indexedDB")
                ? " (IndexedDB mirror)"
                : "";
            console.log(`Data loaded from ${DB.storageMode}${sourceSuffix}`);
        }
    },

    saveToDisk: async (state = DB.data, options = {}) => {
        const overrideRevision = Number(options?.baseRevision);
        const baseRevision = Number.isInteger(overrideRevision) && overrideRevision >= 0
            ? overrideRevision
            : DB.baseRevision;
        let resp;
        try {
            resp = await fetch("/api/state", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    state,
                    baseRevision,
                    sessionId: DB.clientSessionId
                })
            });
        } catch (networkErr) {
            const error = new Error("state_service_unreachable");
            error.code = "state_service_unreachable";
            error.cause = networkErr;
            throw error;
        }
        let payload = null;
        try {
            payload = await resp.json();
        } catch (_e) {
            payload = null;
        }
        if (!resp.ok || !payload?.ok) {
            const error = new Error(payload?.error || `Disk save failed (${resp.status})`);
            error.code = payload?.error || "disk_save_failed";
            error.payload = payload || {};
            throw error;
        }
        return payload;
    },

    resolveConflictAndSaveLatest: async (snapshot, conflictPayload = null) => {
        let currentRevision = Number(conflictPayload?.currentRevision);
        if (!Number.isInteger(currentRevision) || currentRevision < 0) {
            const resp = await fetch("/api/state", { cache: "no-store" });
            if (!resp.ok) throw new Error("state_read_failed");
            const payload = await resp.json();
            const revision = Number(payload?.state?.meta?.revision);
            if (!Number.isInteger(revision) || revision < 0) throw new Error("invalid_revision");
            currentRevision = revision;
        }

        const latestSnapshot = JSON.parse(JSON.stringify(snapshot || DB.data || {}));
        if (!latestSnapshot.meta || typeof latestSnapshot.meta !== "object") latestSnapshot.meta = {};
        latestSnapshot.meta.updated_at = new Date().toISOString();

        const result = await DB.saveToDisk(latestSnapshot, { baseRevision: currentRevision });
        const nextRevision = Number(result?.revision);
        if (Number.isInteger(nextRevision) && nextRevision >= 0) {
            DB.baseRevision = nextRevision;
            latestSnapshot.meta.revision = nextRevision;
        }
        DB.data = latestSnapshot;
        DB.storageMode = "disk";
        const backup = await DB.mirrorStateToBrowserBackup(DB.data);
        UI.updateStatus(backup.mirrored ? "🟢 Otomatik Kayit" : "🟢 Otomatik Kayit (Tarayici yedegi sinirli)");
        console.warn("Save conflict auto-resolved with latest snapshot.");
        return result;
    },

    save: async () => {
        UI.showSavingIndicator(true);
        DB.data.meta.updated_at = new Date().toISOString();
        DB.normalizeData();

        if (DB.saveInProgress) {
            DB.saveQueued = true;
            return;
        }

        DB.saveInProgress = true;
        try {
            do {
                DB.saveQueued = false;
                const snapshot = JSON.parse(JSON.stringify(DB.data));
                try {
                    const result = await DB.saveToDisk(snapshot);
                    const nextRevision = Number(result?.revision);
                    if (Number.isInteger(nextRevision) && nextRevision >= 0) {
                        DB.baseRevision = nextRevision;
                        DB.data.meta.revision = nextRevision;
                    }
                    DB.storageMode = "disk";
                    // Keep local copy as backup mirror of the accepted disk state.
                    const backup = await DB.mirrorStateToBrowserBackup(DB.data);
                    UI.updateStatus(backup.mirrored ? "🟢 Dosyaya Otomatik Kayıt" : "🟢 Dosyaya Otomatik Kayıt (Tarayici yedegi sinirli)");
                    console.log("Data saved to demo_state.json");
                } catch (diskError) {
                    if (diskError?.code === "save_conflict") {
                        try {
                            await DB.resolveConflictAndSaveLatest(snapshot, diskError?.payload || null);
                        } catch (retryError) {
                            const draftResult = await DB.storeConflictDraft(snapshot);
                            UI.updateStatus(draftResult.saved ? "🟠 Kayit cakismasi - veri korunuyor" : "🔴 Kayit cakismasi - yedek alinamadi");
                            console.warn("Save conflict could not be auto-resolved.", retryError);
                        }
                    } else {
                        const draftResult = await DB.storeConflictDraft(snapshot);
                        const serviceDown = diskError?.code === "state_service_unreachable";
                        if (draftResult.saved) {
                            const backupLabel = draftResult.localSaved ? "localStorage" : "IndexedDB";
                            UI.updateStatus(serviceDown
                                ? `🟡 Kayit sunucusu gecici ulasilamiyor - yedek alindi (${backupLabel})`
                                : `🟡 Gecici yedek alindi (${backupLabel})`);
                            console.warn("Disk save failed, stored browser recovery draft.", diskError);
                        } else {
                            UI.updateStatus("🔴 Disk kaydi ve tarayici yedegi basarisiz");
                            console.error("Save failed", diskError);
                        }
                    }
                }
            } while (DB.saveQueued);
        } finally {
            DB.saveInProgress = false;
            UI.showSavingIndicator(false);
        }
    },

    saveNow: async () => {
        if (DB.saveTimeout) {
            clearTimeout(DB.saveTimeout);
            DB.saveTimeout = null;
        }
        UI.showSavingIndicator(true);
        await DB.save();
    },

    flushOnUnload: () => {
        // Disabled by constitution: tab close / page hide must not overwrite disk state.
    },

    markDirty: () => {
        UI.showSavingIndicator(true);
        if (DB.saveTimeout) clearTimeout(DB.saveTimeout);
        DB.saveTimeout = setTimeout(() => {
            void DB.save();
        }, 1000); // 1-second debounce
    }
};

const IDB = {
    open: async () => {
        return new Promise((resolve) => {
            if (typeof indexedDB === "undefined") {
                resolve(null);
                return;
            }
            const req = indexedDB.open('dulda_sys', 1);
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles');
            };
            req.onsuccess = e => resolve(e.target.result);
            req.onerror = () => resolve(null);
        });
    },
    get: async (key) => {
        const db = await IDB.open();
        if (!db) return null;
        return new Promise((resolve) => {
            let settled = false;
            const done = (value) => {
                if (settled) return;
                settled = true;
                try { db.close(); } catch (_e) {}
                resolve(value);
            };
            try {
                const tx = db.transaction('handles', 'readonly');
                const store = tx.objectStore('handles');
                const g = store.get(key);
                g.onsuccess = () => done(g.result ?? null);
                g.onerror = () => done(null);
                tx.onerror = () => done(null);
                tx.onabort = () => done(null);
            } catch (_e) {
                done(null);
            }
        });
    },
    set: async (key, val) => {
        const db = await IDB.open();
        if (!db) return false;
        return new Promise((resolve) => {
            let settled = false;
            const done = (ok) => {
                if (settled) return;
                settled = true;
                try { db.close(); } catch (_e) {}
                resolve(!!ok);
            };
            try {
                const tx = db.transaction('handles', 'readwrite');
                const putReq = tx.objectStore('handles').put(val, key);
                tx.oncomplete = () => done(true);
                tx.onerror = () => done(false);
                tx.onabort = () => done(false);
                putReq.onerror = () => done(false);
            } catch (_e) {
                done(false);
            }
        });
    },
    del: async (key) => {
        const db = await IDB.open();
        if (!db) return false;
        return new Promise((resolve) => {
            let settled = false;
            const done = (ok) => {
                if (settled) return;
                settled = true;
                try { db.close(); } catch (_e) {}
                resolve(!!ok);
            };
            try {
                const tx = db.transaction('handles', 'readwrite');
                const delReq = tx.objectStore('handles').delete(key);
                tx.oncomplete = () => done(true);
                tx.onerror = () => done(false);
                tx.onabort = () => done(false);
                delReq.onerror = () => done(false);
            } catch (_e) {
                done(false);
            }
        });
    }
};

const Router = {
    currentPage: 'dashboard',
    history: [],
    lastNavigateAt: 0,
    lastNavigateTarget: '',
    minNavigateIntervalMs: 220,
    init: () => {
        Router.history = [];
        Router.navigate('dashboard', { skipHistory: true });
    },
    navigate: (pageId, options = {}) => {
        const targetPage = String(pageId || 'dashboard');
        const currentPage = String(Router.currentPage || '');
        const now = Date.now();
        const requestRefresh = !!options?.force || !!options?.fromBack || !!options?.preserveProductsState || !!options?.skipHistory;
        const isBurstDuplicate = !requestRefresh
            && Router.lastNavigateTarget === targetPage
            && (now - Router.lastNavigateAt) < Router.minNavigateIntervalMs;
        Router.lastNavigateTarget = targetPage;
        Router.lastNavigateAt = now;

        if (isBurstDuplicate) return;
        if (!requestRefresh && targetPage === currentPage) return;

        const { fromBack = false, skipHistory = false } = options;
        if (!skipHistory && !fromBack && currentPage && currentPage !== targetPage) {
            Router.history.push(Router.currentPage);
        }
        // Fresh open rule: entering Units from another page should start at unit list.
        if (targetPage === 'units' && currentPage !== 'units' && !fromBack) {
            UnitModule.state.view = 'list';
            UnitModule.state.activeUnitId = null;
        }
        // Fresh open rule: entering Product workspace resets open panels/forms unless caller explicitly preserves UI state.
        if (targetPage === 'products' && currentPage !== 'products') {
            const preserveProductsState = !!options.preserveProductsState;
            if (!preserveProductsState) {
                if (typeof ProductLibraryModule?.resetWorkspaceEntryUiState === 'function') {
                    ProductLibraryModule.resetWorkspaceEntryUiState();
                } else {
                    ProductLibraryModule.state.workspaceView = 'menu';
                }
            }
        }
        // Fresh open rule: entering Stock workspace starts from menu.
        if (targetPage === 'stock' && currentPage !== 'stock' && !fromBack) {
            StockModule.state.workspaceView = 'menu';
            StockModule.state.selectedKey = 'all';
        }
        if (targetPage === 'planlama' && currentPage !== 'planlama' && !fromBack) {
            PlanningModule.state.workspaceView = 'menu';
        }
        if (targetPage === 'sales' && currentPage !== 'sales' && !fromBack) {
            SalesModule.state.workspaceView = 'menu';
            SalesModule.state.customerDetailId = null;
            SalesModule.state.customerDetailMode = 'view';
            SalesModule.state.customerEditDraft = null;
        }
        Router.currentPage = targetPage;
        UI.renderCurrentPage();
    },
    back: () => {
        // Module-internal navigation first
        if (Router.currentPage === 'units' && UnitModule.state.view !== 'list') {
            if (['machines', 'stock', 'personnel', 'cncLibrary', 'sawCut', 'plexiLibrary', 'extruderLibrary'].includes(UnitModule.state.view)) UnitModule.state.view = 'dashboard';
            else UnitModule.state.view = 'list';
            UI.renderCurrentPage();
            return;
        }
        if (Router.currentPage === 'products') {
            if (ProductLibraryModule.state.workspaceView && ProductLibraryModule.state.workspaceView !== 'menu') {
                ProductLibraryModule.state.workspaceView = 'menu';
                UI.renderCurrentPage();
                return;
            }
            if (ProductLibraryModule.state.activeCategory) {
                ProductLibraryModule.state.activeCategory = null;
                UI.renderCurrentPage();
                return;
            }
        }

        if (Router.currentPage === 'stock' && String(StockModule.state.workspaceView || 'menu') !== 'menu') {
            StockModule.state.workspaceView = 'menu';
            UI.renderCurrentPage();
            return;
        }

        if (Router.currentPage === 'planlama' && String(PlanningModule.state.workspaceView || 'menu') !== 'menu') {
            PlanningModule.state.workspaceView = 'menu';
            UI.renderCurrentPage();
            return;
        }

        if (Router.currentPage === 'sales') {
            if (String(SalesModule.state.customerDetailId || '').trim()) {
                SalesModule.state.customerDetailId = null;
                SalesModule.state.customerDetailMode = 'view';
                SalesModule.state.customerEditDraft = null;
                UI.renderCurrentPage();
                return;
            }
            if (String(SalesModule.state.workspaceView || 'menu') !== 'menu') {
                SalesModule.state.workspaceView = 'menu';
                UI.renderCurrentPage();
                return;
            }
        }

        if (Router.currentPage === 'aluminum-inventory') {
            Router.navigate('products', { fromBack: true });
            return;
        }

        // Then page history
        const previous = Router.history.pop();
        if (previous) Router.navigate(previous, { fromBack: true });
        else Router.navigate('dashboard', { fromBack: true });
    }
};

const UI = {
    init: () => {
        const manualSaveButton = document.getElementById('manualSaveButton');
        if (manualSaveButton && !manualSaveButton.dataset.bound) {
            manualSaveButton.dataset.bound = 'true';
            manualSaveButton.addEventListener('click', () => {
                void DB.saveNow();
            });
        }
        UI.updateManualSaveButton(false);
    },
    updateManualSaveButton: (isSaving) => {
        const button = document.getElementById('manualSaveButton');
        if (!button) return;
        button.disabled = !!isSaving;
        button.innerHTML = isSaving
            ? '<i data-lucide="loader-2" class="spin" width="16" height="16"></i> Kaydediliyor...'
            : '<i data-lucide="save" width="16" height="16"></i> Degisiklikleri Kaydet';
        if (window.lucide) window.lucide.createIcons();
    },
    updateStatus: (msg) => {
        const ind = document.getElementById('dbStatusIndicator');
        if (ind) ind.innerHTML = `<i data-lucide="database" width="16" height="16"></i> ${msg}`;
        UI.updateManualSaveButton(false);
        if (window.lucide) window.lucide.createIcons();
    },
    showSavingIndicator: (show) => {
        const ind = document.getElementById('dbStatusIndicator');
        if (ind) ind.innerHTML = show
            ? '<i data-lucide="loader-2" class="spin" width="16" height="16"></i> Kaydediliyor...'
            : `<i data-lucide="database" width="16" height="16"></i> ${DB.storageMode === "disk" ? "Dosyaya Otomatik Kayıt" : "Tarayıcı Kaydı (Yedek)"}`;
        UI.updateManualSaveButton(show);
        if (window.lucide) window.lucide.createIcons();
    },
    showConnectionScreen: (type) => {
        const main = document.getElementById('main-content');
        if (!main) return;

        main.innerHTML = `
            <div style="height:80vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
                <div style="font-size:4rem; margin-bottom:1rem">🗂️</div>
                <h1 style="font-size:2rem; font-weight:800; color:#1e293b; margin-bottom:1rem">
                    ${type === 'PERMISSION' ? 'Dosya Erişimi Gerekli' : 'Veri Dosyası Seçin'}
                </h1>
                <p style="color:#64748b; max-width:400px; margin-bottom:2rem; line-height:1.6">
                    ${type === 'PERMISSION'
                ? 'Sayfayı yenilediğinizde erişim izni sıfırlanır. Devam için lütfen aşağıdaki butona tıklayıp erişim onayı verin.'
                : 'Başlamak için lütfen bilgisayarınızdaki DULDA ERP veri dosyasını (JSON) seçin.'}
                </p>
                <button onclick="DB.connectAndReload()" style="background:#2563eb; color:white; font-size:1.1rem; font-weight:700; padding:1rem 2.5rem; border-radius:1rem; border:none; cursor:pointer; box-shadow:0 10px 15px -3px rgba(37, 99, 235, 0.3); transition:all 0.2s">
                    ${type === 'PERMISSION' ? '🔐 Erişimi Onayla ve Devam Et' : '📂 Dosya Seç'}
                </button>
            </div>
        `;
    },

    renderCurrentPage: () => {
        const page = Router.currentPage;
        const container = document.getElementById('main-content');
        const navBack = document.getElementById('navBack');
        const pageTitle = document.getElementById('pageTitle');
        navBack.onclick = () => Router.back();

        if (page === 'dashboard') {
            navBack.style.display = 'none';
            container.style.maxWidth = '1200px';
            pageTitle.innerText = 'DULDA ERP';
        } else {
            navBack.style.display = 'flex';
            container.style.maxWidth = '100%';
        }

        if (page === 'dashboard') UI.renderDashboard(container);
        else if (page === 'planlama') { pageTitle.innerText = 'PLANLAMA'; PlanningModule.render(container); }
        else if (page === 'sales') { pageTitle.innerText = 'SATIŞ & PAZARLAMA'; SalesModule.render(container); }
        else if (page === 'stock') { pageTitle.innerText = 'STOK YÖNETİMİ'; StockModule.render(container); }
        else if (page === 'purchasing') { pageTitle.innerText = 'SATIN ALMA'; PurchasingModule.render(container); }
        else if (page === 'units') { pageTitle.innerText = 'BİRİM YÖNETİMİ'; UnitModule.render(container); }
        else if (page === 'personnel') { pageTitle.innerText = 'PERSONEL'; PersonnelModule.render(container); }
        else if (page === 'products') {
            const workspaceView = String(ProductLibraryModule.state.workspaceView || 'menu');
            pageTitle.innerText = workspaceView === 'master'
                ? 'ÜRÜN KÜTÜPHANESİ'
                : 'ÜRÜN VE PARÇA OLUŞTURMA';
            ProductLibraryModule.render(container);
        }
        else if (page === 'aluminum-inventory') {
            pageTitle.innerText = 'ALÜMİNYUM PROFİL ENVANTERİ';
            AluminumModule.render(container);
        }
        else container.innerHTML = `<div style="text-align:center; padding:4rem; color:#94a3b8;"><h3>🚧 Modül Hazırlanıyor: ${page}</h3></div>`;

        MojibakeFix.sanitizeTree(container);
        if (window.lucide) window.lucide.createIcons();
    },

    renderDashboard: (container) => {
        const apps = [
            { id: 'planlama', title: 'Planlama', icon: 'calendar', gradient: 'g-blue' },
            { id: 'purchasing', title: 'Satın Alma', icon: 'shopping-cart', gradient: 'g-purple' },
            { id: 'sales', title: 'Satış & Pazarlama', icon: 'shopping-bag', gradient: 'g-orange' },
            { id: 'stock', title: 'Depo & Stok', icon: 'package', gradient: 'g-emerald' },
            { id: 'units', title: 'Birimler & Atölyeler', icon: 'hammer', gradient: 'g-yellow' },
            { id: 'products', title: 'Ürün ve Parça Oluşturma', icon: 'boxes', gradient: 'g-pink' },
            { id: 'personnel', title: 'Personel', icon: 'users', gradient: 'g-cyan' },
            { id: 'settings', title: 'Ayarlar', icon: 'settings', gradient: 'g-gray' },
        ];

        container.innerHTML = `
            <div class="dashboard-header">
                <h1 class="app-title">Dulda ERP</h1>
                <p style="color:#64748b; font-size:1.1rem;">ASIL - Fabrika Yönetim Sistemi</p>
            </div>
            <div class="apps-grid">
                ${apps.map(app => `
                    <a href="#" onclick="Router.navigate('${app.id}'); return false;" class="app-card">
                        <div class="icon-box ${app.gradient}"><i data-lucide="${app.icon}" width="32" height="32"></i></div>
                        <div class="app-name">${app.title}</div>
                    </a>
                `).join('')}
            </div>
            <div style="text-align:center; margin-top:4rem; color:#94a3b8; font-size:0.8rem">Faz 1 - Temel Yapı</div>
        `;
    }
};

