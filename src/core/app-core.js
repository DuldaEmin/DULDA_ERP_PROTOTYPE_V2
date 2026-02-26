/**
 * DULDA ERP - Offline Prototype Core
 * Synced with ASIL Design System
 */
const STORAGE_KEY = "DULDA_ERP_STATE";

const App = {
    init: async () => {
        console.log("DULDA ERP Initializing...");

        await DB.loadState();

        // Initialize Router and UI
        Router.init();
        UI.init();
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
            stock_movements: [],
            orders: [],
            units: [],
            machines: [],
            inventory: [],
            aluminumProfiles: [],
            cncCards: [],
            plexiPolishCards: [],
            pvdCards: [],
            eloksalCards: [],
            ibrahimPolishCards: [],
            processColorLists: {},
            polishSurfaceLists: {},
            extruderLibraryCards: [],
            depoTransferLogs: [],
            depoRoutes: []
        }
    },
    saveTimeout: null,
    storageMode: "localStorage",

    normalizeData: () => {
        if (!DB.data || typeof DB.data !== "object") {
            DB.data = { schema_version: 1, meta: {}, data: {} };
        }

        if (!DB.data.meta || typeof DB.data.meta !== "object") DB.data.meta = {};
        if (!DB.data.meta.created_at) DB.data.meta.created_at = new Date().toISOString();

        if (!DB.data.data || typeof DB.data.data !== "object") DB.data.data = {};
        const d = DB.data.data;

        if (!Array.isArray(d.products)) d.products = [];
        if (!Array.isArray(d.customers)) d.customers = [];
        if (!Array.isArray(d.stock_movements)) d.stock_movements = [];
        if (!Array.isArray(d.orders)) d.orders = [];
        if (!Array.isArray(d.units)) d.units = [];
        if (!Array.isArray(d.machines)) d.machines = [];
        if (!Array.isArray(d.inventory)) d.inventory = [];
        if (!Array.isArray(d.aluminumProfiles)) d.aluminumProfiles = [];
        if (!Array.isArray(d.cncCards)) d.cncCards = [];
        if (!Array.isArray(d.plexiPolishCards)) d.plexiPolishCards = [];
        if (!Array.isArray(d.pvdCards)) d.pvdCards = [];
        if (!Array.isArray(d.eloksalCards)) d.eloksalCards = [];
        if (!Array.isArray(d.ibrahimPolishCards)) d.ibrahimPolishCards = [];
        if (!d.processColorLists || typeof d.processColorLists !== "object" || Array.isArray(d.processColorLists)) d.processColorLists = {};
        if (!d.polishSurfaceLists || typeof d.polishSurfaceLists !== "object" || Array.isArray(d.polishSurfaceLists)) d.polishSurfaceLists = {};
        if (!Array.isArray(d.extruderLibraryCards)) d.extruderLibraryCards = [];
        if (!Array.isArray(d.depoTransferLogs)) d.depoTransferLogs = [];
        if (!Array.isArray(d.depoRoutes)) d.depoRoutes = [];

        if (Array.isArray(d.productCategories)) {
            const seen = new Set();
            d.productCategories = d.productCategories.filter(c => {
                if (!c || !c.id) return false;
                if (seen.has(c.id)) return false;
                seen.add(c.id);
                return true;
            });
        }
    },

    loadState: async () => {
        let diskState = null;
        let localState = null;
        let loaded = null;

        const dataCount = (state) => {
            if (!state || typeof state !== "object") return 0;
            const d = state.data || {};
            const keys = [
                "products",
                "customers",
                "orders",
                "stock_movements",
                "inventory",
                "aluminumProfiles",
                "cncCards",
                "plexiPolishCards",
                "extruderLibraryCards",
                "suppliers",
                "productCategories",
                "personnel"
            ];
            return keys.reduce((sum, key) => {
                const arr = d[key];
                return sum + (Array.isArray(arr) ? arr.length : 0);
            }, 0);
        };

        const stateTime = (state) => {
            const ts = state?.meta?.updated_at || state?.meta?.created_at || "";
            const ms = Date.parse(ts);
            return Number.isFinite(ms) ? ms : 0;
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

        // Decide best source (prevents accidental empty overwrite)
        if (diskState && localState) {
            const diskCount = dataCount(diskState);
            const localCount = dataCount(localState);
            const diskTime = stateTime(diskState);
            const localTime = stateTime(localState);

            if (localCount > diskCount) {
                loaded = localState;
                DB.storageMode = "localStorage";
            } else if (diskCount > localCount) {
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

        // If local wins, sync it to disk so next run is consistent.
        if (loaded && DB.storageMode === "localStorage") {
            await DB.save();
        }

        if (!loaded) console.log("No saved data found, starting fresh.");
        else console.log(`Data loaded from ${DB.storageMode}`);
    },

    saveToDisk: async () => {
        const resp = await fetch("/api/state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state: DB.data })
        });
        if (!resp.ok) throw new Error(`Disk save failed (${resp.status})`);
    },

    save: async () => {
        DB.data.meta.updated_at = new Date().toISOString();
        DB.normalizeData();

        try {
            await DB.saveToDisk();
            DB.storageMode = "disk";
            // Keep local copy as backup.
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DB.data));
            UI.showSavingIndicator(false);
            UI.updateStatus("🟢 Dosyaya Otomatik Kayıt");
            console.log("Data saved to demo_state.json");
        } catch (diskError) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(DB.data));
                DB.storageMode = "localStorage";
                UI.showSavingIndicator(false);
                UI.updateStatus("🟡 Tarayıcı Kaydı (Yedek)");
                console.warn("Disk save failed, using localStorage backup.", diskError);
            } catch (e) {
                console.error("Save failed", e);
                alert("Kayıt başarısız. Lütfen tekrar deneyin.");
            }
        }
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
    init: () => { },
    updateStatus: (msg) => {
        const ind = document.getElementById('dbStatusIndicator');
        if (ind) ind.innerHTML = `<i data-lucide="database" width="16" height="16"></i> ${msg}`;
        if (window.lucide) window.lucide.createIcons();
    },
    showSavingIndicator: (show) => {
        const ind = document.getElementById('dbStatusIndicator');
        if (ind) ind.innerHTML = show
            ? '<i data-lucide="loader-2" class="spin" width="16" height="16"></i> Kaydediliyor...'
            : `<i data-lucide="database" width="16" height="16"></i> ${DB.storageMode === "disk" ? "Dosyaya Otomatik Kayıt" : "Tarayıcı Kaydı (Yedek)"}`;
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
