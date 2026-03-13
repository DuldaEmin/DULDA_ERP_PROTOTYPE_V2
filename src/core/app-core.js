/**
 * DULDA ERP - Offline Prototype Core
 * Synced with ASIL Design System
 */
const STORAGE_KEY = "DULDA_ERP_STATE";
const CONFLICT_DRAFT_KEY = "DULDA_ERP_STATE_CONFLICT_DRAFT";

const MojibakeFix = {
    markerRegex: /[ÃÂâÄÅÆƒ‚�]/,
    attrs: ['placeholder', 'title', 'aria-label', 'value'],
    observer: null,

    needsFix: (text) => {
        if (!text) return false;
        return MojibakeFix.markerRegex.test(String(text));
    },

    decodePass: (text) => {
        try {
            // Reinterpret mojibake text as latin1 bytes and decode as UTF-8.
            return decodeURIComponent(escape(String(text)));
        } catch (_e) {
            return String(text);
        }
    },

    normalize: (text) => {
        let out = String(text ?? '');
        if (!MojibakeFix.needsFix(out)) return out;
        for (let i = 0; i < 3; i += 1) {
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
        if (!MojibakeFix.needsFix(raw)) return;
        const fixed = MojibakeFix.normalize(raw);
        if (fixed !== raw) node.nodeValue = fixed;
    },

    sanitizeElementAttrs: (el) => {
        if (!el || !el.getAttribute) return;
        MojibakeFix.attrs.forEach((attr) => {
            const raw = el.getAttribute(attr);
            if (!MojibakeFix.needsFix(raw)) return;
            const fixed = MojibakeFix.normalize(raw);
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
        depoTransferTasks: 'DTT',
        depoTransferLogs: 'DTL',
        depoRoutes: 'DRT',
        workOrders: 'WKO',
        workOrderTransactions: 'WKT',
        outsourceTransfers: 'OST'
    },

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

        return changed;
    }
};
window.IdentityPolicy = IdentityPolicy;

const App = {
    init: async () => {
        console.log("DULDA ERP Initializing...");

        await DB.loadState();

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
            } catch (e) {
                console.error("localStorage verisi bozuk, temiz başlangıç yapılacak.", e);
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
        }

        if (loaded) DB.data = loaded;
        DB.normalizeData();
        DB.baseRevision = Number(DB.data?.meta?.revision || 0);
        const repairedMojibake = MojibakeFix.sanitizeObjectStrings(DB.data);
        if (repairedMojibake) {
            console.warn("Mojibake metinler bulundu ve otomatik duzeltildi.");
        }

        // If local wins, sync it to disk so next run is consistent.
        if (loaded && (DB.storageMode === "localStorage" || repairedMojibake)) {
            await DB.save();
        }

        if (!loaded) console.log("No saved data found, starting fresh.");
        else console.log(`Data loaded from ${DB.storageMode}`);
    },

    saveToDisk: async (state = DB.data) => {
        const resp = await fetch("/api/state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                state,
                baseRevision: DB.baseRevision,
                sessionId: DB.clientSessionId
            })
        });
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

    save: async () => {
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
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(DB.data));
                    localStorage.removeItem(CONFLICT_DRAFT_KEY);
                    UI.updateStatus("🟢 Dosyaya Otomatik Kayıt");
                    console.log("Data saved to demo_state.json");
                } catch (diskError) {
                    if (diskError?.code === "save_conflict") {
                        try {
                            localStorage.setItem(CONFLICT_DRAFT_KEY, JSON.stringify(snapshot));
                        } catch (_) { }
                        UI.updateStatus("🟠 Kayit cakismasi - veri korunuyor");
                        console.warn("Save conflict prevented.", diskError?.payload || diskError);
                        alert("Kayit cakismasi algilandi. Bu sekmedeki veri diskteki daha yeni kaydin ustune yazilmadi. Lutfen sayfayi yenileyin.");
                    } else {
                        try {
                            localStorage.setItem(CONFLICT_DRAFT_KEY, JSON.stringify(snapshot));
                            UI.updateStatus("🟡 Gecici yedek alindi");
                            console.warn("Disk save failed, stored local recovery draft.", diskError);
                        } catch (e) {
                            console.error("Save failed", e);
                            alert("Kayıt başarısız. Lütfen tekrar deneyin.");
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
    get: async (key) => {
        return new Promise(r => {
            const req = indexedDB.open('dulda_sys', 1);
            req.onupgradeneeded = e => e.target.result.createObjectStore('handles');
            req.onsuccess = e => {
                const tx = e.target.result.transaction('handles', 'readonly');
                const store = tx.objectStore('handles');
                const g = store.get(key);
                g.onsuccess = () => r(g.result);
                g.onerror = () => r(null);
            };
            req.onerror = () => r(null);
        });
    },
    set: async (key, val) => {
        return new Promise(r => {
            const req = indexedDB.open('dulda_sys', 1);
            req.onsuccess = e => {
                const tx = e.target.result.transaction('handles', 'readwrite');
                tx.objectStore('handles').put(val, key);
                tx.oncomplete = () => r();
            };
        });
    }
};

const Router = {
    currentPage: 'dashboard',
    history: [],
    init: () => {
        Router.history = [];
        Router.navigate('dashboard', { skipHistory: true });
    },
    navigate: (pageId, options = {}) => {
        const { fromBack = false, skipHistory = false } = options;
        if (!skipHistory && !fromBack && Router.currentPage && Router.currentPage !== pageId) {
            Router.history.push(Router.currentPage);
        }
        // Fresh open rule: entering Units from another page should start at unit list.
        if (pageId === 'units' && Router.currentPage !== 'units' && !fromBack) {
            UnitModule.state.view = 'list';
            UnitModule.state.activeUnitId = null;
        }
        // Fresh open rule: entering Product workspace starts from menu.
        if (pageId === 'products' && Router.currentPage !== 'products' && !fromBack) {
            ProductLibraryModule.state.workspaceView = 'menu';
        }
        // Fresh open rule: entering Stock workspace starts from menu.
        if (pageId === 'stock' && Router.currentPage !== 'stock' && !fromBack) {
            StockModule.state.workspaceView = 'menu';
            StockModule.state.selectedKey = 'all';
        }
        Router.currentPage = pageId;
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
            { id: 'sales', title: 'Satış', icon: 'shopping-bag', gradient: 'g-orange' },
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
                    <a href="#" onclick="Router.navigate('${app.id}')" class="app-card">
                        <div class="icon-box ${app.gradient}"><i data-lucide="${app.icon}" width="32" height="32"></i></div>
                        <div class="app-name">${app.title}</div>
                    </a>
                `).join('')}
            </div>
            <div style="text-align:center; margin-top:4rem; color:#94a3b8; font-size:0.8rem">Faz 1 - Temel Yapı</div>
        `;
    }
};
