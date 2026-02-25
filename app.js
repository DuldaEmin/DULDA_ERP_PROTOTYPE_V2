/**
 * DULDA ERP - Offline Prototype Core
 * Synced with ASIL Design System
 */
const App = {
    init: async () => {
        console.log("DULDA ERP Initializing...");

        // Load data from LocalStorage immediately
        DB.loadState();

        // Initialize Router and UI
        Router.init();
        UI.init();
        UI.updateStatus('🟢 Otomatik Kayıt Aktif');
    },

    db: {
        // Legacy reference, keeping for compatibility if utilized elsewhere, but DB object handles logic now
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
            aluminumProfiles: [] // New Schema
        }
    },
    saveTimeout: null,

    loadState: () => {
        const saved = localStorage.getItem("DULDA_ERP_STATE");
        if (saved) {
            try {
                DB.data = JSON.parse(saved);
                // Schema Migration / Init Checks
                if (!DB.data.data.aluminumProfiles) DB.data.data.aluminumProfiles = [];

                // FIX DUPLICATE CATEGORIES (Keep First)
                if (DB.data.data.productCategories) {
                    const seen = new Set();
                    DB.data.data.productCategories = DB.data.data.productCategories.filter(c => {
                        if (seen.has(c.id)) return false;
                        seen.add(c.id);
                        return true;
                    });
                }

                console.log("Data loaded from LocalStorage");
            } catch (e) {
                console.error("Save file corrupted, starting fresh.", e);
            }
        } else {
            console.log("No saved data found, starting fresh.");
        }
    },

    save: () => {
        try {
            DB.data.meta.updated_at = new Date().toISOString();
            localStorage.setItem("DULDA_ERP_STATE", JSON.stringify(DB.data));
            UI.showSavingIndicator(false);
            console.log("Data saved to LocalStorage");
        } catch (e) {
            console.error("Save failed (Quota exceeded?)", e);
            alert("Kayıt Başarısız! Depolama alanı dolmuş olabilir (Resimleri kontrol edin).");
        }
    },

    markDirty: () => {
        UI.showSavingIndicator(true);
        if (DB.saveTimeout) clearTimeout(DB.saveTimeout);
        DB.saveTimeout = setTimeout(() => {
            DB.save();
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
    init: () => Router.navigate('dashboard'),
    navigate: (pageId) => {
        Router.currentPage = pageId;
        UI.renderCurrentPage();
    },
    back: () => {
        // Smart Back Logic
        // DEBUG
        alert('Back clicked. View: ' + UnitModule.state.view);

        if (UnitModule.state.view !== 'list') {
            if (['machines', 'stock', 'personnel'].includes(UnitModule.state.view)) {
                UnitModule.state.view = 'dashboard';
            } else {
                UnitModule.state.view = 'list';
            }
            UI.renderCurrentPage();
        } else if (ProductLibraryModule.state.activeCategory) {
            ProductLibraryModule.state.activeCategory = null;
            UI.renderCurrentPage();
        } else {
            Router.navigate('dashboard');
        }
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
        if (ind) ind.innerHTML = show ? '<i data-lucide="loader-2" class="spin" width="16" height="16"></i> Kaydediliyor...' : '<i data-lucide="database" width="16" height="16"></i> Otomatik Kayıt';
        if (window.lucide) window.lucide.createIcons();
    },
    showConnectionScreen: (type) => {
        const main = document.getElementById('main-content');
        if (!main) return;

        main.innerHTML = `
            <div style="height:80vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
                <div style="font-size:4rem; margin-bottom:1rem">🗄️</div>
                <h1 style="font-size:2rem; font-weight:800; color:#1e293b; margin-bottom:1rem">
                    ${type === 'PERMISSION' ? 'Dosya Erişimi Gerekli' : 'Veri Dosyası Seçin'}
                </h1>
                <p style="color:#64748b; max-width:400px; margin-bottom:2rem; line-height:1.6">
                    ${type === 'PERMISSION'
                ? 'Güvenlik nedeniyle tarayıcı sayfayı yenilediğinizde dosya erişim iznini sıfırlar. Devam etmek için lütfen aşağıdaki butona tıklayıp erişim onay verin.'
                : 'Başlamak için lütfen bilgisayarınızdaki DULDA ERP veri dosyasını (JSON) seçin.'}
                </p>
                <button onclick="DB.connectAndReload()" style="background:#2563eb; color:white; font-size:1.1rem; font-weight:700; padding:1rem 2.5rem; border-radius:1rem; border:none; cursor:pointer; box-shadow:0 10px 15px -3px rgba(37, 99, 235, 0.3); transition:all 0.2s">
                    ${type === 'PERMISSION' ? '🔓 Erişimi Onayla ve Devam Et' : '📂 Dosya Seç'}
                </button>
            </div>
        `;
    },

    renderCurrentPage: () => {
        const page = Router.currentPage;
        const container = document.getElementById('main-content');
        const navBack = document.getElementById('navBack');
        const pageTitle = document.getElementById('pageTitle');

        // Header Logic
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
        else if (page === 'products') { pageTitle.innerText = 'ÜRÜN KÜTÜPHANESİ'; ProductLibraryModule.render(container); }
        else if (page === 'aluminum-inventory') {
            pageTitle.innerText = 'ALÜMİNYUM PROFİL ENVANTERİ';
            // Custom back logic for this module
            navBack.onclick = () => Router.navigate('products');
            AluminumModule.render(container);
        }
        else container.innerHTML = `<div style="text-align:center; padding:4rem; color:#94a3b8;"><h3>🚧 Modül Hazırlanıyor: ${page}</h3></div>`;

        // Render Icons
        if (window.lucide) window.lucide.createIcons();
    },

    renderDashboard: (container) => {
        const apps = [
            { id: 'planlama', title: 'Planlama', icon: 'calendar', gradient: 'g-blue' },
            { id: 'purchasing', title: 'Satın Alma', icon: 'shopping-cart', gradient: 'g-purple' },
            { id: 'sales', title: 'Satış', icon: 'shopping-bag', gradient: 'g-orange' },
            { id: 'stock', title: 'Depo & Stok', icon: 'package', gradient: 'g-emerald' },
            { id: 'units', title: 'Birimler & Atölyeler', icon: 'hammer', gradient: 'g-yellow' },
            { id: 'products', title: 'Ürün Kütüphanesi', icon: 'library', gradient: 'g-pink' },
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

const UnitModule = {
    state: { activeUnitId: null, view: 'list', stockTab: 'ROD' }, // view: list | dashboard | machines | stock

    render: (container) => {
        const { view, activeUnitId } = UnitModule.state;

        if (!DB.data.data.inventory) DB.data.data.inventory = [];

        // Seed Data 
        if (!DB.data.data.units || DB.data.data.units.length === 0) {
            DB.data.data.units = [
                { id: 'u1', name: 'CNC ATÖLYESİ', type: 'internal' },
                { id: 'u2', name: 'EKSTRÜDER ATÖLYESİ', type: 'internal' },
                { id: 'u3', name: 'MONTAJ', type: 'internal' },
                { id: 'u4', name: 'PAKETLEME', type: 'internal' },
                { id: 'u5', name: 'PLEKSİ POLİSAJ ATÖLYESİ', type: 'internal' },
                { id: 'u6', name: 'PUNTA ATÖLYESİ', type: 'internal' },
                { id: 'u7', name: 'TESTERE ATÖLYESİ', type: 'internal' },
                { id: 'u8', name: 'AKPA ALÜMİNYUM A.Ş', type: 'external' },
                { id: 'u9', name: 'HİLAL PWD', type: 'external' },
                { id: 'u10', name: 'İBRAHİM POLİSAJ', type: 'external' },
                { id: 'u11', name: 'TEKİN ELOKSAL', type: 'external' }
            ];
            if (DB.fileHandle) DB.save();
        }

        if (!DB.data.data.machines || DB.data.data.machines.length === 0) {
            DB.data.data.machines = [
                { id: 'm1', unitId: 'u2', name: 'Ekstrüder Hattı 1', status: 'ACTIVE' },
                { id: 'm2', unitId: 'u2', name: 'Ekstrüder Hattı 2', status: 'MAINTENANCE' },
                { id: 'm3', unitId: 'u1', name: 'CNC Kesim 1', status: 'IDLE' }
            ];
        }

        if (view === 'list') {
            UnitModule.renderList(container);
        } else if (view === 'dashboard') {
            UnitModule.renderUnitDashboard(container, activeUnitId);
        } else if (view === 'machines') {
            UnitModule.renderMachineList(container, activeUnitId);
        } else if (view === 'stock') {
            UnitModule.renderUnitStock(container, activeUnitId);
        } else if (view === 'personnel') {
            UnitModule.renderUnitPersonnel(container, activeUnitId);
        }
    },

    openUnit: (id) => { UnitModule.state.activeUnitId = id; UnitModule.state.view = 'dashboard'; UI.renderCurrentPage(); },
    openMachines: (id) => { UnitModule.state.view = 'machines'; UI.renderCurrentPage(); },
    openStock: (id) => { UnitModule.state.view = 'stock'; UnitModule.state.stockTab = 'ROD'; UI.renderCurrentPage(); },
    openPersonnel: (id) => { UnitModule.state.view = 'personnel'; UI.renderCurrentPage(); },
    setStockTab: (t) => { UnitModule.state.stockTab = t; UI.renderCurrentPage(); },


    renderList: (container) => {
        const units = DB.data.data.units;
        const internals = units.filter(u => u.type === 'internal');
        const externals = units.filter(u => u.type === 'external');

        const renderCard = (u, icon) => `
            <a href="#" onclick="UnitModule.openUnit('${u.id}')" class="app-card" style="padding:1.5rem;">
                <div class="icon-box" style="background:${u.type === 'internal' ? '#eff6ff' : '#fff7ed'}; color:${u.type === 'internal' ? '#2563eb' : '#ea580c'}; padding:0.5rem; border-radius:1rem; margin-bottom:1rem; width:auto; height:auto; "><i data-lucide="${icon}" width="32" height="32"></i></div>
                <div style="font-weight:700; color:#334155; font-size:0.9rem">${u.name}</div>
            </a>
        `;

        container.innerHTML = `
            <div class="page-header"><h2 class="page-title">Birimler</h2></div>
            <h3 style="margin:1.5rem 0; color:#334155; padding-left:0.5rem">🏭 İç Birimler</h3>
            <div class="apps-grid" style="margin-bottom:3rem;">${internals.map(u => renderCard(u, 'hammer')).join('')}</div>
            <h3 style="margin:1.5rem 0; color:#334155; padding-left:0.5rem">🚚 Dış Birimler</h3>
            <div class="apps-grid">${externals.map(u => renderCard(u, 'truck')).join('')}</div>
        `;
    },

    renderUnitDashboard: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);
        container.innerHTML = `
            <div class="page-header">
                 <h2 class="page-title">${unit.name}</h2>
            </div>
            <div class="apps-grid">
                <a href="#" onclick="UnitModule.openMachines('${unitId}')" class="app-card">
                    <div class="icon-box g-orange"><i data-lucide="settings" width="40" height="40"></i></div>
                    <div class="app-name">Makine Parkuru</div>
                </a>
                <a href="#" class="app-card" onclick="UnitModule.openPersonnel('${unitId}')">
                    <div class="icon-box g-blue"><i data-lucide="users" width="40" height="40"></i></div>
                    <div class="app-name">Personel</div>
                </a>
                 <a href="#" onclick="UnitModule.openStock('${unitId}')" class="app-card">
                    <div class="icon-box g-emerald"><i data-lucide="package" width="40" height="40"></i></div>
                    <div class="app-name">Birim Stoğu</div>
                </a>
            </div>
        `;
    },

    renderUnitPersonnel: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);

        // Ensure Personnel Data Exists
        if (!DB.data.data.personnel) DB.data.data.personnel = [];

        // Default Data Check
        let personnel = DB.data.data.personnel.filter(p => p.unitId === unitId && p.isActive);
        if (personnel.length === 0 && !DB.data.meta.personnelInitialized?.[unitId]) {
            // Seed defaults ONLY ONCE
            const defaults = [
                { id: crypto.randomUUID(), unitId, fullName: 'Ahmet Yılmaz', permissions: { production: true, waste: true, admin: true }, isActive: true },
                { id: crypto.randomUUID(), unitId, fullName: 'Mehmet Demir', permissions: { production: true, waste: false, admin: false }, isActive: true },
            ];
            DB.data.data.personnel.push(...defaults);
            if (!DB.data.meta.personnelInitialized) DB.data.meta.personnelInitialized = {};
            DB.data.meta.personnelInitialized[unitId] = true;
            personnel = defaults;
            // DB.save(); // Don't auto-save just for view
        }

        container.innerHTML = `
            <div style="margin-bottom:2rem; display:flex; justify-content:space-between; align-items:center">
                <div style="display:flex; align-items:center; gap:1rem">
                     <button onclick="UnitModule.openUnit('${unitId}')" style="background:white; padding:0.5rem; border-radius:0.5rem; border:1px solid #e2e8f0; cursor:pointer"><i data-lucide="arrow-left" width="20"></i></button>
                     <div>
                        <h2 class="page-title" style="margin:0; display:flex; align-items:center; gap:0.5rem"><i data-lucide="users" color="#2563eb"></i> Personel Yönetimi</h2>
                        <div style="font-size:0.875rem; color:#64748b">${unit.name} • Çalışan listesi ve yetkilendirme</div>
                     </div>
                </div>
                <button onclick="UnitModule.openPersonnelModal('${unitId}')" class="btn-primary" style="display:flex; gap:0.5rem; align-items:center">
                    <i data-lucide="plus" width="20"></i> Yeni Personel Ekle
                </button>
            </div>

            <div class="card-table">
                <table style="width:100%; text-align:left; border-collapse:collapse">
                    <thead>
                        <tr style="border-bottom:1px solid #f1f5f9; color:#94a3b8; font-size:0.75rem; text-transform:uppercase">
                            <th style="padding:1.5rem">Ad Soyad</th>
                            <th style="padding:1.5rem">Yetkiler</th>
                            <th style="padding:1.5rem; text-align:right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${personnel.length === 0 ? '<tr><td colspan="3" style="padding:2rem; text-align:center; color:#94a3b8">Kayıtlı personel yok.</td></tr>' : personnel.map(p => `
                            <tr style="border-bottom:1px solid #f1f5f9" class="hover:bg-slate-50">
                                <td style="padding:1.5rem">
                                    <div style="display:flex; align-items:center; gap:0.75rem font-weight:600; color:#334155">
                                        <div style="width:2.5rem; height:2.5rem; background:#f1f5f9; border-radius:99px; display:flex; align-items:center; justify-content:center; color:#64748b; font-weight:700; margin-right:0.75rem">${p.fullName.charAt(0)}</div>
                                        ${p.fullName}
                                    </div>
                                </td>
                                <td style="padding:1.5rem">
                                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap">
                                        ${p.permissions.admin ? '<span style="background:#faf5ff; color:#9333ea; padding:0.25rem 0.5rem; border-radius:0.25rem; font-size:0.75rem; font-weight:700; display:flex; gap:0.25rem; align-items:center"><i data-lucide="shield" width="12"></i> Admin</span>' : ''}
                                        ${p.permissions.production ? '<span style="background:#ecfdf5; color:#047857; padding:0.25rem 0.5rem; border-radius:0.25rem; font-size:0.75rem; font-weight:700; display:flex; gap:0.25rem; align-items:center"><i data-lucide="factory" width="12"></i> Üretim</span>' : ''}
                                        ${p.permissions.waste ? '<span style="background:#ffedd5; color:#c2410c; padding:0.25rem 0.5rem; border-radius:0.25rem; font-size:0.75rem; font-weight:700; display:flex; gap:0.25rem; align-items:center"><i data-lucide="alert-circle" width="12"></i> Fire</span>' : ''}
                                    </div>
                                </td>
                                <td style="padding:1.5rem; text-align:right">
                                     <button onclick="UnitModule.openPersonnelModal('${unitId}', '${p.id}')" style="cursor:pointer; color:#94a3b8; margin-right:0.5rem" onmouseover="this.style.color='#2563eb'" onmouseout="this.style.color='#94a3b8'"><i data-lucide="edit-2" width="18"></i></button>
                                     <button onclick="UnitModule.deletePersonnel('${p.id}', '${unitId}')" style="cursor:pointer; color:#94a3b8" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#94a3b8'"><i data-lucide="trash-2" width="18"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    openPersonnelModal: (unitId, personId = null) => {
        const person = personId ? DB.data.data.personnel.find(p => p.id === personId) : null;
        const perms = person?.permissions || { production: true, waste: false, admin: false };

        Modal.open(person ? 'Personeli Düzenle' : 'Yeni Personel Ekle', `
            <div style="display:flex; flex-direction:column; gap:1rem">
                <div>
                    <label style="display:block; font-size:0.875rem; font-weight:700; color:#334155; margin-bottom:0.25rem">Ad Soyad</label>
                    <input id="p_name" type="text" value="${person?.fullName || ''}" class="form-input" style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:0.5rem">
                </div>
                
                <h4 style="margin:0; font-size:0.875rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em">Yetkiler</h4>
                
                <label style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem; border:1px solid #f1f5f9; border-radius:0.5rem; cursor:pointer" class="hover:bg-slate-50">
                    <div style="display:flex; gap:0.75rem; align-items:center">
                        <div style="background:#ecfdf5; color:#047857; padding:0.5rem; border-radius:0.25rem"><i data-lucide="factory" width="18"></i></div>
                        <div>
                            <div style="font-weight:600; font-size:0.9rem">Üretim Başlatabilir</div>
                            <div style="font-size:0.75rem; color:#94a3b8">İş emri yetkisi</div>
                        </div>
                    </div>
                    <input id="p_perm_prod" type="checkbox" ${perms.production ? 'checked' : ''} style="width:1.25rem; height:1.25rem">
                </label>

                <label style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem; border:1px solid #f1f5f9; border-radius:0.5rem; cursor:pointer" class="hover:bg-slate-50">
                     <div style="display:flex; gap:0.75rem; align-items:center">
                        <div style="background:#ffedd5; color:#c2410c; padding:0.5rem; border-radius:0.25rem"><i data-lucide="alert-circle" width="18"></i></div>
                        <div>
                            <div style="font-weight:600; font-size:0.9rem">Fire Onayı Verebilir</div>
                            <div style="font-size:0.75rem; color:#94a3b8">Hatalı üretim girişi</div>
                        </div>
                    </div>
                    <input id="p_perm_waste" type="checkbox" ${perms.waste ? 'checked' : ''} style="width:1.25rem; height:1.25rem">
                </label>

                <label style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem; border:1px solid #f1f5f9; border-radius:0.5rem; cursor:pointer" class="hover:bg-slate-50">
                     <div style="display:flex; gap:0.75rem; align-items:center">
                        <div style="background:#faf5ff; color:#9333ea; padding:0.5rem; border-radius:0.25rem"><i data-lucide="shield" width="18"></i></div>
                        <div>
                            <div style="font-weight:600; font-size:0.9rem">Birim Admini</div>
                            <div style="font-size:0.75rem; color:#94a3b8">Tam yetki</div>
                        </div>
                    </div>
                    <input id="p_perm_admin" type="checkbox" ${perms.admin ? 'checked' : ''} style="width:1.25rem; height:1.25rem">
                </label>

                <button class="btn-primary" style="padding:1rem; margin-top:0.5rem" onclick="UnitModule.savePersonnel('${unitId}', '${personId || ''}')">Kaydet</button>
            </div>
        `);
    },

    savePersonnel: async (unitId, personId) => {
        const name = document.getElementById('p_name').value;
        const prod = document.getElementById('p_perm_prod').checked;
        const waste = document.getElementById('p_perm_waste').checked;
        const admin = document.getElementById('p_perm_admin').checked;

        if (!name) return alert("İsim giriniz.");

        if (!DB.data.data.personnel) DB.data.data.personnel = [];

        if (personId) {
            const p = DB.data.data.personnel.find(x => x.id === personId);
            if (p) {
                p.fullName = name;
                p.permissions = { production: prod, waste, admin };
            }
        } else {
            DB.data.data.personnel.push({
                id: crypto.randomUUID(),
                unitId,
                fullName: name,
                permissions: { production: prod, waste, admin },
                isActive: true
            });
        }

        await DB.save();
        Modal.close();
        UnitModule.renderUnitPersonnel(document.getElementById('main-content'), unitId);
    },

    deletePersonnel: async (id, unitId) => {
        if (!confirm("Bu personeli silmek (pasife almak) istediğinize emin misiniz?")) return;
        const p = DB.data.data.personnel.find(x => x.id === id);
        if (p) p.isActive = false; // Soft delete
        await DB.save();
        UnitModule.renderUnitPersonnel(document.getElementById('main-content'), unitId);
    },

    renderMachineList: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);
        const machines = (DB.data.data.machines || []).filter(m => m.unitId === unitId);

        container.innerHTML = `
            <div class="page-header">
                 <h2 class="page-title">${unit.name} > Makineler</h2>
                 <button class="btn-primary" onclick="UnitModule.addMachineModal('${unitId}')">+ Yeni Makine</button>
            </div>

            <div class="apps-grid">
                ${machines.length === 0 ? '<div style="grid-column:1/-1; text-align:center; padding:3rem; color:#94a3b8">Kayıtlı makine yok.</div>' : ''}
                ${machines.map(m => `
                    <div class="app-card" style="align-items:flex-start; text-align:left; justify-content:flex-start; padding:1.5rem">
                        <div style="display:flex; justify-content:space-between; width:100%; margin-bottom:1rem">
                            <h4 style="font-weight:700; font-size:1.1rem; margin:0">${m.name}</h4>
                            <span style="font-size:1.5rem">${m.status === 'ACTIVE' ? '<i data-lucide="check-circle" color="#22c55e"></i>' : m.status === 'MAINTENANCE' ? '<i data-lucide="x-circle" color="#ef4444"></i>' : '<i data-lucide="alert-circle" color="#eab308"></i>'}</span>
                        </div>
                        <div style="font-size:0.8rem; color:#64748b; margin-bottom:1.5rem;">Durum: ${m.status}</div>
                        <div style="display:flex; gap:0.5rem; margin-top:auto; width:100%">
                             <button class="btn-sm" style="flex:1" onclick="UnitModule.setMachineStatus('${m.id}','ACTIVE')">✅ Çalışıyor</button>
                             <button class="btn-sm" style="flex:1" onclick="UnitModule.setMachineStatus('${m.id}','MAINTENANCE')">🔧 Arıza</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // --- NEW: SPECIFIC STOCK IMPLEMENTATION ---
    renderUnitStock: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);

        // EXTRA SECURITY: Strictly restrict to Extruder
        if (!unit.name.includes('EKSTRÜDER')) {
            container.innerHTML = `<div style="text-align:center; padding:4rem; color:#94a3b8"><h3>⛔ Bu birim için stok yönetimi aktif değil.</h3></div>`;
            return;
        }

        const tab = UnitModule.state.stockTab;
        const inventory = (DB.data.data.inventory || []).filter(i => i.unitId === unitId && i.category === tab);

        // Ensure Colors Exist
        if (!DB.data.data.unitColors) DB.data.data.unitColors = {};
        if (!DB.data.data.unitColors[unitId]) DB.data.data.unitColors[unitId] = ['Şeffaf', 'Beyaz', 'Siyah', 'Antrasit'];
        const colors = DB.data.data.unitColors[unitId];

        // Specific Header for Extruder
        const title = unit.name.includes('EKSTRÜDER') ? 'EKSTRÜDER STOK EKLEME PANELİ' : `${unit.name} STOK PANELİ`;

        container.innerHTML = `
            <div style="margin-bottom:2rem; padding-left:0.25rem">
                <h1 style="font-size:1.8rem; font-weight:700; color:#1e293b; display:flex; align-items:center; gap:0.75rem">
                    <span style="color:#10b981"><i data-lucide="box" width="32" height="32"></i></span> ${title}
                </h1>
            </div>

            <!-- TABS -->
            <div style="display:flex; gap:0.5rem; margin-bottom:0; padding-left:0.25rem">
                <button onclick="UnitModule.setStockTab('ROD')" class="tab-btn ${tab === 'ROD' ? 'active' : ''}">ÇUBUK</button>
                <button onclick="UnitModule.setStockTab('PIPE')" class="tab-btn ${tab === 'PIPE' ? 'active' : ''}">BORU</button>
                <button onclick="UnitModule.setStockTab('PROFILE')" class="tab-btn ${tab === 'PROFILE' ? 'active' : ''}">ÖZEL PROFİLLER</button>
            </div>
            <style>
                .tab-btn { padding: 0.75rem 2.5rem; border-radius: 1rem 1rem 0 0; font-weight:800; font-size:0.85rem; cursor:pointer; border:1px solid transparent; background:#e2e8f0; color:#94a3b8; letter-spacing:0.05em; }
                .tab-btn.active { background:white; color:#1e293b; border-color:#e2e8f0; border-bottom-color:white; box-shadow:0 -4px 6px -1px rgba(0,0,0,0.05); z-index:10; }
            </style>

            <!-- MAIN CARD -->
            <div style="background:white; border-radius:0 1.5rem 1.5rem 1.5rem; border:1px solid #e2e8f0; padding:1.5rem; box-shadow:0 1px 3px rgba(0,0,0,0.05); min-height:500px">
                
                <!-- INPUT ROW -->
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:1rem; padding:1.5rem; margin-bottom:2rem">
                    <div style="font-size:0.75rem; font-weight:800; color:#52525b; margin-bottom:1rem; letter-spacing:0.1em; display:flex; gap:0.5rem; align-items:center; text-transform:uppercase">
                        <i data-lucide="plus" width="16" height="16" color="#10b981"></i>
                        HIZLI STOK GİRİŞİ (${tab === 'ROD' ? '<span style="color:#059669">ÇUBUK</span>' : tab === 'PIPE' ? '<span style="color:#059669">BORU</span>' : '<span style="color:#059669">PROFİL</span>'})
                    </div>
                    
                    <div style="display:grid; grid-template-columns: repeat(12, 1fr); gap:1rem; align-items:end">
                        ${tab === 'PROFILE' ? `
                            <div style="grid-column:span 2">
                                <label class="lbl">PROFİL ADI</label>
                                <input id="stk_name" class="inp" placeholder="40x40 Kare">
                            </div>
                        ` : `
                            <div style="grid-column:span 1">
                                <label class="lbl">ÇAP (mm)</label>
                                <input id="stk_dia" type="number" class="inp text-center" placeholder="50">
                            </div>
                        `}
                        
                        ${tab === 'PIPE' ? `
                             <div style="grid-column:span 1">
                                <label class="lbl">KALINLIK</label>
                                <input id="stk_thick" type="number" class="inp text-center" placeholder="2">
                            </div>
                        ` : ''}

                        <div style="grid-column:span 1">
                            <label class="lbl">BOY (mm)</label>
                            <input id="stk_len" type="number" class="inp" placeholder="2000">
                        </div>

                        <div style="grid-column:span 2">
                            <label class="lbl" style="display:flex; justify-content:space-between">
                                RENK
                                <button onclick="UnitModule.openColorModal('${unitId}')" style="color:#3b82f6; font-size:0.6rem; cursor:pointer; font-weight:700; background:none; border:none">[ + YÖNET (EKLE/SİL) ]</button>
                            </label>
                            <select id="stk_col" class="inp" style="cursor:pointer">
                                <option value="Tanımsız">Seçiniz</option>
                                ${colors.map(c => `<option value="${c}">${c}</option>`).join('')}
                            </select>
                        </div>

                        ${tab === 'ROD' ? `
                            <div style="grid-column:span 1; display:flex; justify-content:center; padding-bottom:0.8rem">
                                <label style="display:flex; flex-direction:column; align-items:center; cursor:pointer">
                                    <input id="stk_bub" type="checkbox" style="width:1.25rem; height:1.25rem; accent-color:#10b981; cursor:pointer">
                                    <span style="font-size:0.6rem; font-weight:700; color:#64748b; margin-top:0.25rem">Kabarcıklı</span>
                                </label>
                            </div>
                        ` : '<div style="grid-column:span 1"></div>'}

                        <div style="grid-column:span 1"></div>

                        <div style="grid-column:span 1">
                            <label class="lbl">ADET</label>
                            <input id="stk_qty" type="number" class="inp text-center" style="border-width:2px; color:#10b981; font-weight:bold" placeholder="0">
                        </div>

                        <div style="grid-column:span 1">
                            <label class="lbl">HEDEF</label>
                            <input id="stk_target" type="number" class="inp text-center" placeholder="100">
                        </div>

                        <div style="grid-column:span 2" style="position:relative">
                            <label class="lbl">ADRES / NOT</label>
                            <div style="position:relative">
                                <input id="stk_addr" class="inp" placeholder="Not Giriniz..." style="padding-right:2rem">
                                <i data-lucide="edit-2" width="14" height="14" style="position:absolute; right:10px; top:14px; color:#94a3b8"></i>
                            </div>
                        </div>


                        <div style="grid-column:span 2; display:flex; gap:0.5rem">
                            ${UnitModule.state.editingId ? `
                                <button onclick="UnitModule.saveStock('${unitId}')" class="btn-primary" style="flex:2; height:42px; background:#2563eb; box-shadow:0 4px 6px -1px rgba(37, 99, 235, 0.2); display:flex; align-items:center; justify-content:center; gap:0.5rem">
                                    <i data-lucide="save" width="18" height="18"></i> GÜNCELLE
                                </button>
                                <button onclick="UnitModule.cancelEdit()" class="btn-primary" style="flex:1; height:42px; background:#94a3b8; box-shadow:0 4px 6px -1px rgba(148, 163, 184, 0.2); display:flex; align-items:center; justify-content:center; gap:0.5rem">
                                    <i data-lucide="rotate-ccw" width="18" height="18"></i> VAZGEÇ
                                </button>
                            ` : `
                                <button onclick="UnitModule.saveStock('${unitId}')" class="btn-primary" style="width:100%; height:42px; background:#059669; box-shadow:0 4px 6px -1px rgba(16, 185, 129, 0.2); display:flex; align-items:center; justify-content:center; gap:0.5rem">
                                    <i data-lucide="plus" width="18" height="18"></i> EKLE
                                </button>
                            `}
                        </div>
                    </div>
                </div>

                <style>
                    .lbl { display:block; font-size:0.65rem; font-weight:700; color:#64748b; margin-bottom:0.4rem; margin-left:0.25rem; }
                    .inp { width:100%; height:42px; padding:0 0.75rem; border:1px solid #cbd5e1; border-radius:0.75rem; font-size:0.9rem; font-weight:600; color:#334155; outline:none; transition:all 0.2s; }
                    .inp:focus { border-color:#10b981; box-shadow:0 0 0 3px rgba(16, 185, 129, 0.1); }
                    .text-center { text-align:center; }
                </style>

                <!-- LIST TABLE -->
                <div class="card-table">
                    <table>
                        <thead style="background:#f8fafc">
                            <tr>
                                <th style="font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Ürün Adı</th>
                                <th style="text-align:center; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Çap (mm)</th>
                                ${tab === 'PIPE' ? '<th style="text-align:center; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Kalınlık</th>' : ''}
                                <th style="text-align:center; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Boy (mm)</th>
                                <th style="text-align:center; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Renk</th>
                                <th style="text-align:center; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Özellik</th>
                                <th style="text-align:center; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Not / Adres</th>
                                <th style="text-align:right; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Miktar / Hedef</th>
                                <th style="text-align:right; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${inventory.length === 0 ? `<tr><td colspan="10" style="text-align:center; padding:4rem; color:#94a3b8"><div style="display:flex; justify-content:center; margin-bottom:1rem"><div style="background:#f8fafc; padding:1.5rem; border-radius:50%"><i data-lucide="box" width="32" height="32" color="#cbd5e1"></i></div></div><div style="font-weight:700; margin-bottom:0.5rem">Stok kaydı bulunamadı</div><div style="font-size:0.85rem">Bu kategori için henüz giriş yapılmamış.</div></td></tr>` : ''}
                            ${inventory.map(i => {
            // Color Logic
            let rowClass = '';
            if (i.targetStock > 0) {
                const ratio = i.quantity / i.targetStock;
                if (ratio <= 0.25) rowClass = 'bg-red-100'; // Critical
                else if (ratio <= 0.50) rowClass = 'bg-orange-50'; // Warning
            }

            return `
                                <tr class="${rowClass}">
                                    <td>
                                        <div style="display:flex; align-items:center; gap:0.75rem">
                                            <div style="padding:0.5rem; background:white; border:1px solid #f1f5f9; border-radius:0.5rem; color:#94a3b8"><i data-lucide="package" width="16" height="16"></i></div>
                                            <div>
                                                <div style="font-weight:700; color:#334155">${i.name}</div>
                                                <div style="font-size:0.65rem; color:#94a3b8; font-family:monospace">ID: ...${i.id.slice(-4)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="text-align:center;"><span style="background:rgba(255,255,255,0.5); padding:0.25rem 0.5rem; border-radius:0.25rem; font-weight:700; color:#475569">${i.diameter || '-'}</span></td>
                                    ${tab === 'PIPE' ? `<td style="text-align:center; background:rgba(255,255,255,0.5)">${i.thickness || '-'}</td>` : ''}
                                    <td style="text-align:center;"><span style="background:rgba(255,255,255,0.5); padding:0.25rem 0.5rem; border-radius:0.25rem; font-weight:700; color:#475569">${i.length}</span></td>
                                    <td style="text-align:center"><span style="background:white; border:1px solid #e2e8f0; color:#64748b; padding:0.25rem 0.75rem; border-radius:0.5rem; font-size:0.75rem; font-weight:700">${i.color}</span></td>
                                    <td style="text-align:center">${i.isBubble ? '<span style="background:#eff6ff; color:#2563eb; border:1px solid #dbeafe; padding:0.25rem 0.75rem; border-radius:1rem; font-size:0.65rem; font-weight:800">KABARCIKLI</span>' : '<span style="background:#f8fafc; color:#64748b; border:1px solid #e2e8f0; padding:0.25rem 0.75rem; border-radius:1rem; font-size:0.65rem; font-weight:700">KABARCIKSIZ</span>'}</td>
                                    <td style="text-align:center; font-size:0.8rem; color:#64748b">${i.address ? `<span style="background:#fffbeb; color:#d97706; border:1px solid #fcd34d; padding:0.15rem 0.5rem; border-radius:0.25rem; font-size:0.75rem; font-weight:600; display:inline-flex; align-items:center; gap:0.25rem"><i data-lucide="map-pin" width="10" height="10"></i> ${i.address}</span>` : '-'}</td>
                                    <td style="text-align:right">
                                        <div style="font-weight:800; font-size:1.1rem; color:#1e293b">${i.quantity} <span style="font-size:0.7rem; color:#94a3b8; font-weight:500">Adet</span></div>
                                        <div style="font-size:0.7rem; color:#94a3b8; background:white; padding:0.1rem 0.4rem; border-radius:0.25rem; border:1px solid #f1f5f9; display:inline-block; margin-top:0.1rem; display:flex; align-items:center; gap:0.25rem; justify-content:flex-end">
                                            Hedef: ${i.targetStock}
                                            ${i.targetStock > 0 && (i.quantity / i.targetStock) <= 0.5 ? '<i data-lucide="alert-circle" width="12" height="12" color="#ef4444"></i>' : ''}
                                        </div>
                                    </td>
                                    <td style="text-align:right">
                                        <div style="display:flex; justify-content:flex-end; gap:0.5rem">
                                            ${UnitModule.state.editingId === i.id ? `
                                                <button style="padding:0.5rem; border-radius:0.5rem; border:1px solid #60a5fa; background:#eff6ff; color:#2563eb; cursor:pointer"><i data-lucide="loader-2" width="16" height="16"></i></button>
                                            ` : `
                                                <button onclick="UnitModule.editStock('${i.id}')" style="padding:0.5rem; border-radius:0.5rem; border:1px solid #e2e8f0; background:white; color:#94a3b8; cursor:pointer; transition:all 0.2s" onmouseover="this.style.color='#3b82f6'" onmouseout="this.style.color='#94a3b8'"><i data-lucide="edit-2" width="16" height="16"></i></button>
                                                <button onclick="UnitModule.deleteStock('${i.id}')" style="padding:0.5rem; border-radius:0.5rem; border:1px solid #e2e8f0; background:white; color:#94a3b8; cursor:pointer; transition:all 0.2s" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#94a3b8'"><i data-lucide="trash-2" width="16" height="16"></i></button>
                                            `}
                                        </div>
                                    </td>
                                </tr>
                            `}).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    openColorModal: (unitId) => {
        const colors = DB.data.data.unitColors[unitId] || [];
        const modalHtml = `
            <div id="colorModalOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center">
                <div style="background:white; width:400px; border-radius:1.5rem; padding:1.5rem; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); animation: zoomIn 0.2s">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
                        <h3 style="font-weight:800; color:#334155; display:flex; align-items:center; gap:0.5rem">
                            <i data-lucide="palette" color="#a855f7" width="20"></i> Renk Kütüphanesi
                        </h3>
                        <button onclick="document.getElementById('colorModalOverlay').remove()" style="background:none; border:none; color:#94a3b8; cursor:pointer"><i data-lucide="x" width="20"></i></button>
                    </div>

                    <div style="display:flex; gap:0.5rem; margin-bottom:1.5rem">
                        <input id="newColorInput" placeholder="Yeni renk ismi..." style="flex:1; padding:0.75rem; border:2px solid #e2e8f0; border-radius:0.75rem; font-weight:700; color:#475569; outline:none; font-size:0.9rem">
                        <button onclick="UnitModule.addColor('${unitId}')" style="background:#a855f7; color:white; border:none; padding:0 1.25rem; border-radius:0.75rem; font-weight:800; cursor:pointer; box-shadow:0 4px 6px -1px rgba(168, 85, 247, 0.3)">Ekle</button>
                    </div>

                    <div style="max-height:300px; overflow-y:auto; display:flex; flex-direction:column; gap:0.5rem">
                        ${colors.length === 0 ? '<div style="text-align:center; color:#cbd5e1; padding:1rem">Henüz renk eklenmemiş.</div>' : ''}
                        ${colors.map(c => `
                            <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:0.75rem 1rem; border-radius:0.75rem; border:1px solid #f1f5f9">
                                <div style="display:flex; align-items:center; gap:0.75rem">
                                    <div style="width:16px; height:16px; border-radius:50%; border:1px solid #cbd5e1; background:${c === 'Şeffaf' ? 'transparent' : c === 'Siyah' ? '#000' : c === 'Beyaz' ? '#fff' : c === 'Antrasit' ? '#374151' : c === 'Sarı' || c === 'Sari' ? '#facc15' : c === 'Kırmızı' || c === 'Kirmizi' ? '#ef4444' : '#cbd5e1'}"></div>
                                    <span style="font-weight:700; color:#475569; font-size:0.9rem; text-transform:uppercase">${c}</span>
                                </div>
                                <button onclick="UnitModule.deleteColor('${unitId}','${c}')" style="background:none; border:none; color:#cbd5e1; cursor:pointer; transition:color 0.2s" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#cbd5e1'"><i data-lucide="trash-2" width="14"></i></button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (window.lucide) window.lucide.createIcons();
        document.getElementById('newColorInput').focus();
    },

    addColor: async (unitId) => {
        const val = document.getElementById('newColorInput').value.trim();
        if (val) {
            if (!DB.data.data.unitColors[unitId].includes(val)) {
                DB.data.data.unitColors[unitId].push(val);
                await DB.save();
                document.getElementById('colorModalOverlay').remove();
                UnitModule.openColorModal(unitId); // Re-open to refresh list
                // Also refresh the main UI to update the select box
                UnitModule.renderUnitStock(document.getElementById('main-content'), unitId);
                if (window.lucide) window.lucide.createIcons();
                // But we must immediately re-open the modal, effectively refreshing it
                document.getElementById('colorModalOverlay').remove(); // remove old one from re-render
                UnitModule.openColorModal(unitId);
            }
        }
    },

    deleteColor: async (unitId, color) => {
        if (confirm(color + ' silinsin mi?')) {
            DB.data.data.unitColors[unitId] = DB.data.data.unitColors[unitId].filter(c => c !== color);
            await DB.save();
            document.getElementById('colorModalOverlay').remove();
            UnitModule.openColorModal(unitId);
            UnitModule.renderUnitStock(document.getElementById('main-content'), unitId);
            if (window.lucide) window.lucide.createIcons();
            document.getElementById('colorModalOverlay').remove();
            UnitModule.openColorModal(unitId);
        }
    },

    openUnit: (id) => { UnitModule.state.activeUnitId = id; UnitModule.state.view = 'dashboard'; UI.renderCurrentPage(); },
    openMachines: (id) => { UnitModule.state.view = 'machines'; UI.renderCurrentPage(); },
    openStock: (id) => { UnitModule.state.view = 'stock'; UnitModule.state.stockTab = 'ROD'; UI.renderCurrentPage(); },
    setStockTab: (t) => { UnitModule.state.stockTab = t; UI.renderCurrentPage(); },
    goBack: () => {
        if (UnitModule.state.view === 'list') Router.navigate('dashboard');
        else if (UnitModule.state.view === 'dashboard') UnitModule.state.view = 'list';
        else UnitModule.state.view = 'dashboard';
        UI.renderCurrentPage();
    },

    // --- STOCK EDITING LOGIC ---
    // Sets the UI to 'Edit Mode' for a specific item
    editStock: (id) => {
        const item = DB.data.data.inventory.find(i => i.id === id);
        if (!item) return;

        UnitModule.state.editingId = id;
        UnitModule.state.stockTab = item.category; // Switch to correct tab
        UI.renderCurrentPage(); // Re-render to show fields and update button state

        // We must delay slightly to ensure DOM is ready after re-render
        setTimeout(() => {
            if (document.getElementById('stk_dia')) document.getElementById('stk_dia').value = item.diameter || '';
            if (document.getElementById('stk_thick')) document.getElementById('stk_thick').value = item.thickness || '';
            if (document.getElementById('stk_len')) document.getElementById('stk_len').value = item.length || '';
            if (document.getElementById('stk_col')) document.getElementById('stk_col').value = item.color || 'Tanımsız';
            if (document.getElementById('stk_qty')) document.getElementById('stk_qty').value = item.quantity || '';
            if (document.getElementById('stk_target')) document.getElementById('stk_target').value = item.targetStock || '';
            if (document.getElementById('stk_addr')) document.getElementById('stk_addr').value = item.address || '';
            if (document.getElementById('stk_name')) document.getElementById('stk_name').value = item.name || '';
            if (document.getElementById('stk_bub')) document.getElementById('stk_bub').checked = item.isBubble || false;

            // Scroll to top to see the form
            document.querySelector('.page-title').scrollIntoView({ behavior: 'smooth' });
        }, 50);
    },

    cancelEdit: () => {
        UnitModule.state.editingId = null;
        UI.renderCurrentPage();
    },

    saveStock: async (uid) => {
        const tab = UnitModule.state.stockTab;
        const dia = document.getElementById('stk_dia')?.value;
        const thick = document.getElementById('stk_thick')?.value;
        const len = document.getElementById('stk_len')?.value;
        const col = document.getElementById('stk_col')?.value;
        const qty = document.getElementById('stk_qty')?.value;
        const target = document.getElementById('stk_target')?.value;
        const addr = document.getElementById('stk_addr')?.value;
        const nameInp = document.getElementById('stk_name')?.value;
        const isBub = document.getElementById('stk_bub')?.checked;

        if (!qty || !target) { alert('Adet ve Hedef zorunludur.'); return; }

        let name = '';
        if (tab === 'ROD') name = `Ø${dia} Çubuk`;
        else if (tab === 'PIPE') name = `Ø${dia} Boru`;
        else name = nameInp || 'Özel Profil';

        if (UnitModule.state.editingId) {
            // UPDATE EXISTING
            const idx = DB.data.data.inventory.findIndex(i => i.id === UnitModule.state.editingId);
            if (idx !== -1) {
                DB.data.data.inventory[idx] = {
                    ...DB.data.data.inventory[idx],
                    name, diameter: dia, thickness: thick, length: len, color: col,
                    quantity: Number(qty), targetStock: Number(target), address: addr, isBubble: isBub,
                    updated_at: new Date().toISOString()
                };
            }
            UnitModule.state.editingId = null;
        } else {
            // CREATE NEW
            const item = {
                id: crypto.randomUUID(),
                unitId: uid,
                category: tab,
                name,
                diameter: dia,
                thickness: thick,
                length: len,
                color: col,
                quantity: Number(qty),
                targetStock: Number(target),
                address: addr,
                isBubble: isBub,
                created_at: new Date().toISOString()
            };
            if (!DB.data.data.inventory) DB.data.data.inventory = [];
            DB.data.data.inventory.push(item);
        }

        await DB.save();
        UI.renderCurrentPage();
    },

    deleteStock: async (id) => {
        if (confirm('Silmek istediğinize emin misiniz?')) {
            DB.data.data.inventory = DB.data.data.inventory.filter(i => i.id !== id);
            await DB.save();
            UI.renderCurrentPage();
        }
    },

    setMachineStatus: async (mid, status) => {
        const m = DB.data.data.machines.find(x => x.id === mid);
        if (m) { m.status = status; await DB.save(); UI.renderCurrentPage(); }
    },
    addMachineModal: (uid) => {
        Modal.open('Makine Ekle', `
            <input id="new_mac_name" class="form-input" placeholder="Makine Adı (Örn: Cnc-2)" style="width:100%; padding:0.8rem; border:1px solid #ccc; border-radius:0.5rem; margin-bottom:1rem">
            <button class="btn-primary" style="width:100%" onclick="UnitModule.saveMachine('${uid}')">Kaydet</button>
        `);
    },
    saveMachine: async (uid) => {
        const name = document.getElementById('new_mac_name').value;
        if (name) {
            DB.data.data.machines.push({ id: crypto.randomUUID(), unitId: uid, name, status: 'ACTIVE' });
            await DB.save(); Modal.close(); UI.renderCurrentPage();
        }
    }
};

const ProductLibraryModule = {
    state: {
        activeCategory: null,
        extruderTab: 'ROD', // ROD | PIPE
        filters: { dia: '', len: '', thick: '', color: '', bubble: false },
        hardwareFilters: { shape: '', dia: '', len: '', mat: '' }, // New filters for Hardware
        editingProductId: null,
        isFormVisible: false // New State
    },

    render: (container) => {
        // Ensure Categories Exist
        // --- INITIALIZATION & CLEANUP ---
        // 1. Eğer hiç kategori yoksa standart 3'lüyü oluştur.
        if (!DB.data.data.productCategories || DB.data.data.productCategories.length === 0) {
            DB.data.data.productCategories = [
                { id: 'cat1', name: 'Alüminyum profil', icon: '🏗️' },
                { id: 'cat3', name: 'Hırdavat & Vida', icon: '🔩' },
                { id: 'cat_ext', name: 'Ekstrüder pleksi', icon: '🏭' }
            ];
        }

        // 2. "Şekil değiştiren" (shapeshifting) sorunu çözümü:
        // Eski 'Pleksi (Akrilik)' veya 'Ekstrüder' gibi tekil kalan kategorileri
        // tek bir 'Ekstrüder pleksi' çatısı altında birleştir ve kopyaları temizle.
        const cats = DB.data.data.productCategories;
        const hasLegacyPlexi = cats.some(c => c.name === 'Pleksi (Akrilik)');
        const hasLegacyExt = cats.some(c => c.name === 'Ekstrüder');

        if (hasLegacyPlexi || hasLegacyExt) {
            // Standart dışı olanları temizle, sadece bizim istediklerimiz ve kullanıcının yeni ekledikleri kalsın.
            // Ancak, kullanıcının özel eklediği kategorilere dokunmamalıyız.
            // Sadece bilinen ESKİ hatalı isimleri filtreliyoruz.
            DB.data.data.productCategories = DB.data.data.productCategories.filter(c =>
                c.name !== 'Pleksi (Akrilik)' &&
                c.name !== 'Ekstrüder'
            );

            // Eğer ana 'Ekstrüder pleksi' silindiyse veya yoksa geri ekle
            const mainExtExists = DB.data.data.productCategories.find(c => c.id === 'cat_ext');
            if (!mainExtExists) {
                DB.data.data.productCategories.push({ id: 'cat_ext', name: 'Ekstrüder pleksi', icon: '🏭' });
            }
        }

        if (ProductLibraryModule.state.activeCategory) {
            ProductLibraryModule.renderCategoryDetail(container);
        } else {
            ProductLibraryModule.renderMain(container);
        }
    },

    renderMain: (container) => {
        const categories = DB.data.data.productCategories;

        container.innerHTML = `
            <div style="max-width:1000px; margin:0 auto">
                <!-- Action Header -->
                <div style="margin-bottom:2rem; display:flex; justify-content:center">
                    <button onclick="ProductLibraryModule.openCategoryModal()" class="btn-primary" style="display:flex; align-items:center; gap:0.5rem; padding:1rem 2rem; font-size:1.1rem; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1)">
                        <i data-lucide="plus-circle" width="24"></i> Yeni Kategori Ekle
                    </button>
                </div>

                <!-- Categories Grid -->
                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:1.5rem">
                    ${categories.map(c => `
                        <div class="group relative" style="position:relative">
                            <div onclick="ProductLibraryModule.openCategory('${c.id}')" style="background:white; border:1px solid #e2e8f0; border-radius:1.5rem; padding:2rem; display:flex; flex-direction:column; align-items:center; gap:1rem; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 20px 25px -5px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.05)'">
                                <div style="font-size:3rem; line-height:1">${c.icon}</div>
                                <div style="font-weight:700; color:#334155; font-size:1.1rem; text-align:center">${c.name}</div>
                            </div>
                            <!-- Edit/Delete Actions -->
                            <div style="position:absolute; top:10px; right:10px; display:flex; gap:0.25rem; z-index:10;">
                                <button onclick="event.preventDefault(); event.stopPropagation(); ProductLibraryModule.openCategoryModal('${c.id}')" style="background:white; border:1px solid #cbd5e1; border-radius:0.5rem; padding:0.4rem; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; box-shadow:0 2px 4px rgba(0,0,0,0.05)" onmouseover="this.style.color='#3b82f6'; this.style.borderColor='#3b82f6'" onmouseout="this.style.color='#64748b'; this.style.borderColor='#cbd5e1'">
                                    <i data-lucide="edit-2" width="16"></i>
                                </button>
                                <button onclick="event.preventDefault(); event.stopPropagation(); ProductLibraryModule.deleteCategory('${c.id}')" style="background:white; border:1px solid #cbd5e1; border-radius:0.5rem; padding:0.4rem; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; box-shadow:0 2px 4px rgba(0,0,0,0.05)" onmouseover="this.style.color='#ef4444'; this.style.borderColor='#ef4444'" onmouseout="this.style.color='#64748b'; this.style.borderColor='#cbd5e1'">
                                    <i data-lucide="trash-2" width="16"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    renderList: (category) => {
        const products = (DB.data.data.products || []).filter(p => p.category === category.name || p.categoryId === category.id);
        if (products.length === 0) return '<div style="text-align:center; padding:2rem; color:#cbd5e1">Bu kategoride henüz ürün yok.</div>';
        return products.map(p => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border-bottom:1px solid #f1f5f9">
                <span style="font-weight:600; color:#334155">${p.name}</span>
                <span style="font-family:monospace; color:#94a3b8; font-size:0.9rem">${p.code || '---'}</span>
            </div>
        `).join('');
    },

    renderCategoryDetail: (container) => {
        const catId = ProductLibraryModule.state.activeCategory;
        const category = DB.data.data.productCategories.find(c => c.id === catId);

        if (!category) { ProductLibraryModule.state.activeCategory = null; UI.renderCurrentPage(); return; }

        // --- CUSTOM UI FOR EXTRUDER & PLEXI ---
        if (category.name.toLowerCase().includes('ekstrüder') || category.name.toLowerCase().includes('pleksi') || category.id === 'cat_ext') {
            ProductLibraryModule.renderExtruderPage(container);
            return;
        }

        // --- HARDWARE MODULE ROUTING ---
        if (category.name.toLowerCase().includes('hırdavat') || category.name.toLowerCase().includes('vida') || category.id === 'cat3') {
            ProductLibraryModule.renderHardwarePage(container);
            return;
        } container.innerHTML = `
            <div style="max-width:1100px; margin:0 auto; font-family: 'Inter', sans-serif;">
                <!-- Header -->
                <div style="text-align:center; margin-bottom:3rem; position:relative">
                    <h1 style="font-size:2.5rem; color:#1e293b; letter-spacing:-0.03em; font-weight:300;">${category.name.toLowerCase()} <span style="font-weight:700">envanter</span></h1>
                </div>

                <!-- ACTIONS ROW -->
                <div style="display:flex; flex-wrap:wrap; gap:1rem; align-items:center; margin-bottom:3rem; justify-content:space-between">
                     <!-- Search Capsules (Generic) -->
                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; flex:1; justify-content:center">
                         <div class="search-capsule">
                            <input type="text" placeholder="ürün ara..." style="width:200px">
                            <i data-lucide="search" width="16" style="color:#94a3b8"></i>
                         </div>
                    </div>

                    <!-- ADD BUTTON -->
                    <div style="flex-shrink:0">
                        ${(ProductLibraryModule.state.isFormVisible) ?
                `<button onclick="ProductLibraryModule.toggleExtruderForm()" class="btn-primary" style="background:#ef4444; padding:0.8rem 2rem; border-radius:1rem">İptal</button>`
                :
                `<button onclick="ProductLibraryModule.toggleExtruderForm()" class="btn-primary" style="padding:0.8rem 2rem; border-radius:1rem; font-size:1rem; box-shadow:0 4px 10px rgba(0,0,0,0.05)">Ürün ekle +</button>`
            }
                    </div>
                </div>

                <!-- LIST (Empty State for now) -->
               <div style="display:flex; flex-direction:column; gap:0; border-top:2px solid #334155">
                     <div style="padding:4rem; text-align:center; color:#94a3b8">
                        Henüz ürün bulunamadı.
                     </div>
                </div>

                <!-- ADD FORM (CONDITIONAL) -->
                ${(ProductLibraryModule.state.isFormVisible) ? `
                    <div id="extFormSection" style="margin-top:4rem; background:white; border:2px solid #e2e8f0; border-radius:2rem; padding:3rem; position:relative; box-shadow:0 20px 40px -10px rgba(0,0,0,0.05); animation: slideDown 0.3s ease-out">
                         <h3 style="font-size:1.5rem; color:#334155; margin-bottom:2rem; font-weight:700">Yeni Ürün Ekle</h3>
                         <div style="text-align:center; color:#64748b">
                            Bu kategori için form yapısı henüz oluşturulmadı.
                         </div>
                    </div>
                ` : ''}
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    openCategory: (id) => {
        // Find category to check its name
        const cat = DB.data.data.productCategories.find(c => c.id === id);

        // Redirect Aluminum to new module if name matches or ID matches
        if (id === 'cat1' || (cat && cat.name.toLowerCase().includes('alüminyum'))) {
            Router.navigate('aluminum-inventory');
            return;
        }

        ProductLibraryModule.state.activeCategory = id;
        ProductLibraryModule.state.isFormVisible = false;
        ProductLibraryModule.state.filters = { dia: '', len: '', thick: '', color: '', surface: '' };
        UI.renderCurrentPage();
    },

    openCategoryModal: (editId = null) => {
        const cat = editId ? DB.data.data.productCategories.find(c => c.id === editId) : null;
        window.selectedEmoji = cat ? cat.icon : '📦';

        Modal.open(editId ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle', `
            <div style="display:flex; flex-direction:column; gap:1.5rem">
                <div>
                    <label style="display:block; font-weight:700; color:#334155; margin-bottom:0.5rem">Kategori Adı</label>
                    <input id="new_cat_name" value="${cat ? cat.name : ''}" placeholder="Örn: Profil, Civata, Kutu..." style="width:100%; padding:0.8rem; border:1px solid #cbd5e1; border-radius:0.5rem; font-size:1rem">
                </div>
                <div>
                    <label style="display:block; font-weight:700; color:#334155; margin-bottom:0.5rem">Emoji Simgesi</label>
                    <div style="display:grid; grid-template-columns:repeat(6, 1fr); gap:0.5rem">
                        ${['📦', '🏗️', '🔩', '🔮', '⚙️', '🔌', '🧰', '🧵', '🪵', '📐', '🧪', '🛡️'].map(e => `
                            <button onclick="document.querySelectorAll('.emoji-btn').forEach(b => b.style.background='white'); this.style.background='#eff6ff'; window.selectedEmoji='${e}'" class="emoji-btn" style="font-size:1.5rem; padding:0.5rem; border:1px solid #e2e8f0; border-radius:0.5rem; background:${e === window.selectedEmoji ? '#eff6ff' : 'white'}; cursor:pointer; transition:all 0.1s">${e}</button>
                        `).join('')}
                    </div>
                </div>
                <button onclick="ProductLibraryModule.saveCategory('${editId || ''}')" class="btn-primary" style="padding:1rem">${editId ? 'Güncelle' : 'Oluştur'}</button>
            </div>
        `);
    },

    saveCategory: async (editId) => {
        const name = document.getElementById('new_cat_name').value;
        if (!name) return alert('Kategori adı giriniz.');

        if (editId && editId !== 'undefined' && editId !== 'null' && editId !== '') {
            const idx = DB.data.data.productCategories.findIndex(c => c.id === editId);
            if (idx !== -1) {
                DB.data.data.productCategories[idx] = { ...DB.data.data.productCategories[idx], name, icon: window.selectedEmoji };
            }
        } else {
            DB.data.data.productCategories.push({
                id: crypto.randomUUID(),
                name,
                icon: window.selectedEmoji || '📦'
            });
        }

        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },

    deleteCategory: async (id) => {
        if (confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) {
            DB.data.data.productCategories = DB.data.data.productCategories.filter(c => c.id !== id);
            await DB.save();
            UI.renderCurrentPage();
        }
    },

    // --- EXTRUDER SPECIFIC LOGIC ---
    renderExtruderPage: (container) => {
        const { extruderTab, filters } = ProductLibraryModule.state;

        // Initial Defaults for Options - ROBUST MERGE
        if (!DB.data.meta.options) DB.data.meta.options = {};
        const defaults = {
            colors: ['Füme', 'Antrasit', 'Şeffaf', 'Beyaz'],
            diameters: [50, 60, 65, 70],
            thicknesses: [2, 3, 5],
            surfaces: ['Kabarcıksız', 'Kabarcıklı']
        };
        for (let k in defaults) {
            if (!DB.data.meta.options[k]) DB.data.meta.options[k] = defaults[k];
        }

        const opts = DB.data.meta.options;

        container.innerHTML = `
            <div style="max-width:1400px; margin:0 auto; font-family: 'Inter', sans-serif;">
                
                <!-- MAIN TITLE -->
                <div style="text-align:center; margin-bottom:3rem; position:relative">
                    <h1 style="font-size:2.5rem; color:#1e293b; letter-spacing:-0.03em; font-weight:300;">ekstrüder <span style="font-weight:700">envanter</span></h1>
                </div>

                <!-- TABS & ACTIONS ROW -->
                <div style="display:flex; flex-wrap:wrap; gap:1rem; align-items:center; margin-bottom:3rem; justify-content:space-between">
                     <!-- TABS -->
                    <div style="display:flex; gap:1rem;">
                        <button onclick="ProductLibraryModule.setExtruderTab('ROD')" 
                            class="${extruderTab === 'ROD' ? 'active-tab' : 'inactive-tab'}">
                            çubuk
                        </button>
                        <button onclick="ProductLibraryModule.setExtruderTab('PIPE')" 
                            class="${extruderTab === 'PIPE' ? 'active-tab' : 'inactive-tab'}">
                            boru
                        </button>
                    </div>

                    <!-- SEARCH CAPSULES (Filters) -->
                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; flex:1; justify-content:center">
                         ${ProductLibraryModule.renderCapsule('çap ile ara', 'dia', opts.diameters)}
                         ${ProductLibraryModule.renderCapsule(extruderTab === 'ROD' ? 'yüzey ile ara' : 'kalınlık ile ara', extruderTab === 'ROD' ? 'surface' : 'thick', extruderTab === 'ROD' ? opts.surfaces : opts.thicknesses)}
                         ${ProductLibraryModule.renderCapsule('renk ile ara', 'color', opts.colors)}
                         
                         <!-- Length Capsule (Text Input) -->
                        <div class="search-capsule">
                            <input type="number" placeholder="boy ile ara" oninput="ProductLibraryModule.setFilter('len', this.value)" value="${filters.len || ''}">
                        </div>

                         <button class="search-btn" onclick="ProductLibraryModule.resetFilters()">temizle</button>
                    </div>

                    <!-- ADD BUTTON -->
                    <div style="flex-shrink:0">
                        ${(ProductLibraryModule.state.isFormVisible) ?
                `<button onclick="ProductLibraryModule.toggleExtruderForm()" class="btn-primary" style="background:#ef4444; padding:0.8rem 2rem; border-radius:1rem">İptal</button>`
                :
                `<button onclick="ProductLibraryModule.toggleExtruderForm()" class="btn-primary" style="padding:0.8rem 2rem; border-radius:1rem; font-size:1rem; box-shadow:0 4px 10px rgba(0,0,0,0.05)">Ürün ekle +</button>`
            }
                    </div>
                </div>

                <!-- STYLES -->
                <style>
                    .active-tab { padding:0.8rem 2rem; background:#1e293b; color:white; border-radius:1rem; font-weight:600; border:none; cursor:pointer; font-size:1rem; transition:all 0.2s; }
                    .inactive-tab { padding:0.8rem 2rem; background:white; color:#64748b; border:1px solid #e2e8f0; border-radius:1rem; font-weight:500; cursor:pointer; font-size:1rem; transition:all 0.2s; }
                    .inactive-tab:hover { border-color:#94a3b8; color:#334155; }

                    .search-capsule { border:1px solid #94a3b8; border-radius:1rem; padding:0 1rem; background:white; display:flex; align-items:center; height:46px; transition:all 0.2s }
                    .search-capsule:focus-within { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1) }
                    .search-capsule select, .search-capsule input { border:none; outline:none; font-size:0.95rem; color:#334155; font-weight:600; text-align:center; background:transparent; width:130px; appearance:none; cursor:pointer }
                    .search-capsule input { width:100px }
                    .search-btn { border:2px solid #1e293b; color:#1e293b; background:transparent; border-radius:1rem; padding:0 1.5rem; height:46px; font-weight:800; cursor:pointer; transition:all 0.2s; text-transform:uppercase; font-size:0.8rem }
                    .search-btn:hover { background:#1e293b; color:white }
                </style>

                <!-- LIST -->
                <div style="display:flex; flex-direction:column; gap:0; border-top:2px solid #334155" id="product_list_container">
                    ${ProductLibraryModule.renderProductList()}
                </div>

                <!-- ADD FORM (CONDITIONAL) -->
                ${(ProductLibraryModule.state.isFormVisible) ? `
                    <div id="extFormSection" style="margin-top:4rem; background:white; border:2px solid #e2e8f0; border-radius:2rem; padding:3rem; position:relative; box-shadow:0 20px 40px -10px rgba(0,0,0,0.05); animation: slideDown 0.3s ease-out">
                         <h3 style="font-size:1.5rem; color:#334155; margin-bottom:2rem; font-weight:700">Yeni Ekstrüder Ürünü Ekle</h3>
                         
                         <!-- Re-using existing check logic but presented better -->
                         <div style="display:flex; gap:2rem; flex-wrap:wrap; align-items:flex-end">
                            ${ProductLibraryModule.renderInputGroup('çap / ebat', 'dia', opts.diameters, 'mm')}
                             <!-- Length Input for Form -->
                            <div style="display:flex; flex-direction:column; gap:0.5rem; min-width:140px;">
                                <div style="border:2px solid #94a3b8; border-radius:1.5rem; padding:0 1rem; height:56px; display:flex; align-items:center;">
                                    <input type="number" placeholder="boy" oninput="ProductLibraryModule.setFilter('len', this.value)" value="${filters.len || ''}" style="width:100%; border:none; background:transparent; font-size:1.1rem; color:#334155; font-weight:600; outline:none; text-align:center;">
                                    <span style="font-size:0.9rem; font-weight:600; color:#94a3b8; margin-left:0.25rem">mm</span>
                                </div>
                            </div>

                            ${extruderTab === 'ROD' ?
                    ProductLibraryModule.renderInputGroup('kabarcık', 'surface', opts.surfaces || ['Kabarcıksız', 'Kabarcıklı'], '') :
                    ProductLibraryModule.renderInputGroup('kalınlık', 'thick', opts.thicknesses, 'mm')
                }
                            
                            ${ProductLibraryModule.renderInputGroup('renk', 'color', opts.colors, '')}

                            <div style="margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem" id="duplicate_check_container">
                                ${ProductLibraryModule.renderDuplicateCheckButton()}
                            </div>
                         </div>
                    </div>
                ` : ''}
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    renderCapsule: (placeholder, key, options) => {
        const val = ProductLibraryModule.state.filters[key];
        return `
            <div class="search-capsule" style="position:relative">
                <select onchange="ProductLibraryModule.setFilter('${key}', this.value)" style="width:100%; padding-right:1rem">
                    <option value="">${val ? val : placeholder}</option>
                    ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
                </select>
                <i data-lucide="chevron-down" width="14" style="position:absolute; right:10px; pointer-events:none; color:#94a3b8"></i>
            </div>
        `;
    },

    toggleExtruderForm: () => {
        ProductLibraryModule.state.isFormVisible = !ProductLibraryModule.state.isFormVisible;
        // Clean filters when closing/opening to start fresh or keep context? 
        // Strategy: Keep filters as 'Form Data' since they are shared.
        UI.renderCurrentPage();
        if (ProductLibraryModule.state.isFormVisible) {
            setTimeout(() => {
                const el = document.getElementById('extFormSection');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        }
    },

    resetFilters: () => {
        ProductLibraryModule.state.filters = { dia: '', len: '', thick: '', color: '', surface: '' };
        UI.renderCurrentPage();
    },

    renderInputGroup: (label, key, options, unit) => {
        const val = ProductLibraryModule.state.filters[key];
        return `
            <div style="display:flex; flex-direction:column; gap:0.5rem; min-width:140px;">
                <button onclick="ProductLibraryModule.openOptionLibrary('${key}')" style="font-size:0.65rem; color:#3b82f6; text-align:center; background:none; border:none; cursor:pointer; font-weight:600">( + YÖNET ekle/sil )</button>
                <div style="border:2px solid #94a3b8; border-radius:1.5rem; padding:0.2rem 1rem; position:relative; height:56px; display:flex; align-items:center;">
                   <select onchange="ProductLibraryModule.setFilter('${key}', this.value)" style="width:100%; border:none; background:transparent; font-size:1.1rem; color:#334155; font-weight:600; outline:none; appearance:none; cursor:pointer; text-align-last:center; padding-right:1rem">
                        <option value="">${label}</option>
                        ${options.map(o => `<option value="${o}" ${val == o ? 'selected' : ''}>${o}${unit ? ' ' + unit : ''}</option>`).join('')}
                   </select>
                   <i data-lucide="chevron-down" width="16" style="position:absolute; right:10px; pointer-events:none; color:#94a3b8"></i>
                </div>
            </div>
        `;
    },

    renderBubbleCheck: () => {
        // Deprecated //
        const val = ProductLibraryModule.state.filters.bubble;
        return `
             <div style="display:flex; flex-direction:column; gap:0.5rem; min-width:140px;">
                <button style="font-size:0.65rem; color:#3b82f6; text-align:center; background:none; border:none; cursor:pointer; font-weight:600; opacity:0">.</button>
                <div onclick="ProductLibraryModule.toggleBubble()" style="border:2px solid #94a3b8; border-radius:1.5rem; padding:0 1rem; height:56px; display:flex; align-items:center; justify-content:center; cursor:pointer; background:${val ? '#eff6ff' : 'transparent'}; border-color:${val ? '#3b82f6' : '#94a3b8'}">
                    <span style="font-size:1.1rem; font-weight:600; color:${val ? '#1d4ed8' : '#334155'}">kabarcık</span>
                    ${val ? '<i data-lucide="check" width="16" style="margin-left:0.5rem; color:#1d4ed8"></i>' : ''}
                </div>
            </div>
        `;
    },

    setExtruderTab: (t) => {
        ProductLibraryModule.state.extruderTab = t;
        ProductLibraryModule.state.filters = { dia: '', len: '', thick: '', color: '', surface: '' }; // Reset filters
        UI.renderCurrentPage();
    },

    setFilter: (key, val) => {
        ProductLibraryModule.state.filters[key] = val;

        // If updating 'len' (Length text input), DO NOT re-render the whole page.
        // Just update the dynamic parts (Button & List).
        if (key === 'len') {
            ProductLibraryModule.updateDynamicContent();
        } else {
            // For other dropdowns, full re-render is fine and safer to ensure all selects update
            UI.renderCurrentPage();
        }
    },

    updateDynamicContent: () => {
        const btnContainer = document.getElementById('duplicate_check_container');
        const listContainer = document.getElementById('product_list_container');

        if (btnContainer) btnContainer.innerHTML = ProductLibraryModule.renderDuplicateCheckButton();
        if (listContainer) listContainer.innerHTML = ProductLibraryModule.renderProductList();
    },

    renderDuplicateCheckButton: () => {
        const { extruderTab, filters } = ProductLibraryModule.state;
        const allProducts = DB.data.data.products || [];
        const exactMatchExp = allProducts.find(p =>
            p.category === 'Ekstrüder' &&
            p.type === extruderTab &&
            p.specs.diameter == filters.dia &&
            p.specs.length == filters.len &&
            p.specs.color === filters.color &&
            (extruderTab === 'ROD' ? (p.specs.surface === filters.surface) : (p.specs.thickness == filters.thick))
        );

        const isFilled = filters.dia && filters.len && filters.color && (extruderTab === 'PIPE' ? filters.thick : filters.surface);
        const isDuplicate = !!exactMatchExp;
        const btnDisabled = !isFilled || isDuplicate;
        const btnText = isDuplicate ? 'Zaten Mevcut!' : 'Ürün Ekle +';
        const btnStyle = isDuplicate ? 'background:#f1f5f9; color:#94a3b8; border-color:#cbd5e1; cursor:not-allowed' : (isFilled ? 'background:#10b981; color:white; border-color:#059669; cursor:pointer' : 'background:white; color:#94a3b8; border-color:#cbd5e1; cursor:not-allowed');

        return `
            ${isDuplicate ? '<div style="font-size:0.8rem; color:#ef4444; font-weight:700">⚠️ Bu kombinasyon zaten kayıtlı</div>' : ''}
            <button id="btnAddExtProduct" onclick="ProductLibraryModule.addExtruderProduct()" ${btnDisabled ? 'disabled' : ''} style="padding:1rem 3rem; border:2px solid; border-radius:1.5rem; font-size:1.1rem; font-weight:600; transition:all 0.2s; ${btnStyle}">
                ${btnText}
            </button>
        `;
    },

    renderProductList: () => {
        const { extruderTab, filters } = ProductLibraryModule.state;
        // Re-calculate filtered products locally
        const products = (DB.data.data.products || []).filter(p => p.category === 'Ekstrüder' && p.type === extruderTab);

        // SORTING: Diameter/Size (smart sort) -> Length (asc) -> Color (alpha)
        products.sort((a, b) => {
            // Use localeCompare with numeric:true to handle "20", "100", "40x40" correctly
            const valA = String(a.specs.diameter || '');
            const valB = String(b.specs.diameter || '');
            const diffDia = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
            if (diffDia !== 0) return diffDia;

            const diffLen = Number(a.specs.length) - Number(b.specs.length);
            if (diffLen !== 0) return diffLen;

            return (a.specs.color || '').localeCompare(b.specs.color || '', 'tr');
        });

        let filteredProducts = products;
        if (filters.dia) filteredProducts = filteredProducts.filter(p => p.specs.diameter == filters.dia);
        if (filters.len) filteredProducts = filteredProducts.filter(p => p.specs.length == filters.len);
        if (filters.color) filteredProducts = filteredProducts.filter(p => p.specs.color === filters.color);
        if (extruderTab === 'ROD' && filters.surface) filteredProducts = filteredProducts.filter(p => p.specs.surface === filters.surface);
        if (extruderTab === 'PIPE' && filters.thick) filteredProducts = filteredProducts.filter(p => p.specs.thickness == filters.thick);

        return `
            ${filteredProducts.length === 0 ? '<div style="text-align:center; color:#cbd5e1; padding:3rem; font-size:1.2rem; font-weight:300">Bu kriterlerde ürün yok. Yeni ekleyebilirsiniz.</div>' : ''}
            
            ${filteredProducts.map(p => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:1.5rem 0; border-bottom:1px solid #64748b;">
                    <div style="font-size:1.2rem; color:#334155; font-weight:500">
                        ${ProductLibraryModule.formatProductTitle(p)}
                    </div>
                    <div style="display:flex; align-items:center; gap:3rem">
                        <div style="font-family:monospace; color:#64748b; font-size:1rem">ID; ${p.code || p.id.substring(0, 8)}</div>
                        <div style="display:flex; gap:0.5rem; align-items:center">
                            <button class="list-btn" onclick="ProductLibraryModule.editExtruderProduct('${p.id}')">düzenle</button>
                            <span style="color:#cbd5e1">/</span>
                            <button class="list-btn" onclick="ProductLibraryModule.deleteExtruderProduct('${p.id}')">sil</button>
                        </div>
                        <input type="checkbox" style="width:1.5rem; height:1.5rem; border:2px solid #94a3b8; border-radius:0.4rem; cursor:pointer">
                        <span style="color:#64748b; font-size:0.9rem">seç</span>
                    </div>
                </div>
            `).join('')}
         `;
    },

    toggleBubble: () => {
        // Deprecated //
    },

    formatProductTitle: (p) => {
        let text = `Çap ${p.specs.diameter} mm / boy ${p.specs.length} mm`;
        if (p.specs.thickness) text += ` / ${p.specs.thickness} mm`;
        if (p.specs.surface) text += ` / ${p.specs.surface}`;
        // Backward comp for bubble boolean if needed
        else if (p.specs.bubble) text += ` / kabarcıklı`;

        text += ` / ${p.specs.color} renk`;
        return text;
    },

    manageOption: (key) => {
        // Renaming/Routing to new Modal System
        ProductLibraryModule.openOptionLibrary(key);
    },

    openOptionLibrary: (key) => {
        const mapping = {
            dia: { t: 'Çap Kütüphanesi', i: 'circle-dashed', k: 'diameters' },
            thick: { t: 'Kalınlık Kütüphanesi', i: 'layers', k: 'thicknesses' },
            color: { t: 'Renk Kütüphanesi', i: 'palette', k: 'colors' },
            surface: { t: 'Yüzey Tipi Kütüphanesi', i: 'scan-line', k: 'surfaces' },
            // Hardware Mappings
            hardwareShapes: { t: 'Şekil Kütüphanesi', i: 'shapes', k: 'hardwareShapes' },
            hardwareDias: { t: 'Çap Kütüphanesi', i: 'circle-dashed', k: 'hardwareDias' },
            hardwareMaterials: { t: 'Malzeme Kütüphanesi', i: 'layers', k: 'hardwareMaterials' },
            hardwareLengths: { t: 'Boy Kütüphanesi', i: 'ruler', k: 'hardwareLengths' },
            // Aluminum Mappings
            aluAnodized: { t: 'Eloksal Renk Kütüphanesi', i: 'palette', k: 'aluAnodized' },
            aluPainted: { t: 'Boya Renk Kütüphanesi', i: 'palette', k: 'aluPainted' },
            aluLengths: { t: 'Profil Boyu Kütüphanesi', i: 'ruler', k: 'aluLengths' }
        };
        const conf = mapping[key];
        if (!conf) return;

        // Ensure array exists
        if (!DB.data.meta.options[conf.k]) DB.data.meta.options[conf.k] = [];
        const items = DB.data.meta.options[conf.k];

        const modalHtml = `
            <div id="libModal_${key}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center">
                <div style="background:white; width:420px; border-radius:1.5rem; padding:1.5rem; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); animation: zoomIn 0.2s; font-family:'Inter',sans-serif">
                    
                    <!-- Header -->
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
                        <h3 style="font-weight:800; color:#334155; display:flex; align-items:center; gap:0.5rem; font-size:1.1rem">
                            <i data-lucide="${conf.i}" color="#8b5cf6" width="22"></i> ${conf.t}
                        </h3>
                        <button onclick="document.getElementById('libModal_${key}').remove(); UI.renderCurrentPage()" style="background:none; border:none; color:#94a3b8; cursor:pointer; padding:0.2rem"><i data-lucide="x" width="22"></i></button>
                    </div>

                    <!-- Add New -->
                    <div style="display:flex; gap:0.5rem; margin-bottom:1.5rem">
                        <input id="newLibItemInput" placeholder="Yeni değer..." onkeydown="if(event.key==='Enter') ProductLibraryModule.addLibraryItem('${key}')" style="flex:1; padding:0.75rem 1rem; border:2px solid #e2e8f0; border-radius:0.75rem; font-weight:600; color:#475569; outline:none; font-size:0.95rem; transition:border-color 0.2s" onfocus="this.style.borderColor='#a78bfa'" onblur="this.style.borderColor='#e2e8f0'">
                        <button onclick="ProductLibraryModule.addLibraryItem('${key}')" style="background:#8b5cf6; color:white; border:none; padding:0 1.5rem; border-radius:0.75rem; font-weight:700; cursor:pointer; box-shadow:0 4px 6px -1px rgba(139, 92, 246, 0.4); transition:transform 0.1s" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">Ekle</button>
                    </div>

                    <!-- List -->
                    <div style="max-height:350px; overflow-y:auto; display:flex; flex-direction:column; gap:0.6rem; padding-right:0.5rem">
                        ${items.length === 0 ? '<div style="text-align:center; color:#cbd5e1; padding:1.5rem; font-style:italic">Liste boş.</div>' : ''}
                        
                        ${items.map(item => `
                            <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:0.8rem 1rem; border-radius:0.75rem; border:1px solid #f1f5f9; group">
                                <div style="display:flex; align-items:center; gap:0.75rem">
                                    ${key === 'color' ? `<div style="width:18px; height:18px; border-radius:50%; border:1px solid #cbd5e1; background:${ProductLibraryModule.getColorCode(item)}"></div>` : '<i data-lucide="hash" width="14" style="color:#cbd5e1"></i>'}
                                    <span style="font-weight:700; color:#475569; font-size:0.95rem;">${item}</span>
                                </div>
                                <div style="display:flex; gap:0.25rem">
                                    <button title="Düzenle" onclick="ProductLibraryModule.editLibraryItem('${key}', '${item}')" style="background:none; border:none; color:#cbd5e1; cursor:pointer; padding:0.3rem" onmouseover="this.style.color='#64748b'" onmouseout="this.style.color='#cbd5e1'"><i data-lucide="pencil" width="16"></i></button>
                                    <button title="Sil" onclick="ProductLibraryModule.deleteLibraryItem('${key}', '${item}')" style="background:none; border:none; color:#cbd5e1; cursor:pointer; padding:0.3rem" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#cbd5e1'"><i data-lucide="trash-2" width="16"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="margin-top:1.5rem; text-align:center; font-size:0.75rem; color:#cbd5e1; font-weight:500">
                        Değişiklikler anında kaydedilir.
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (window.lucide) window.lucide.createIcons();
        document.getElementById('newLibItemInput').focus();
    },

    getColorCode: (c) => {
        const map = { 'Siyah': '#000', 'Beyaz': '#fff', 'Şeffaf': 'transparent', 'Antrasit': '#374151', 'Füme': '#525252', 'Gri': '#9ca3af', 'Kırmızı': '#ef4444', 'Sarı': '#facc15', 'Mavi': '#3b82f6' };
        return map[c] || '#cbd5e1';
    },

    addLibraryItem: async (key) => {
        const inp = document.getElementById('newLibItemInput');
        let val = inp.value.trim();
        if (!val) return;

        // Mapping to get array key
        const mapping = {
            dia: 'diameters', thick: 'thicknesses', color: 'colors', surface: 'surfaces',
            hardwareShapes: 'hardwareShapes', hardwareDias: 'hardwareDias', hardwareLengths: 'hardwareLengths', hardwareMaterials: 'hardwareMaterials',
            aluAnodized: 'aluAnodized', aluPainted: 'aluPainted', aluLengths: 'aluLengths'
        };
        const metaKey = mapping[key];
        const current = DB.data.meta.options[metaKey];

        // Type conversion (Strict for Thickness only, Smart for Dia)
        if (key === 'thick' || key === 'hardwareDias' || key === 'hardwareLengths') {
            if (isNaN(Number(val))) return alert('Lütfen sayısal bir değer giriniz.');
            val = Number(val);
        } else if (key === 'dia') {
            // Keep as number if it's a pure number, otherwise string (for 40x40)
            if (!isNaN(Number(val)) && val.trim() !== '') {
                val = Number(val);
            }
        }

        if (current.includes(val)) {
            alert('Bu değer zaten listede var.');
            return;
        }

        current.push(val);
        // Sort if number
        if (typeof val === 'number') current.sort((a, b) => a - b);

        await DB.save();

        // Refresh Modal
        document.getElementById(`libModal_${key}`).remove();
        ProductLibraryModule.openOptionLibrary(key);
    },

    deleteLibraryItem: async (key, itemVal) => {
        if (!confirm('Silmek istediğinize emin misiniz?')) return;

        const mapping = {
            dia: 'diameters', thick: 'thicknesses', color: 'colors', surface: 'surfaces',
            hardwareShapes: 'hardwareShapes', hardwareDias: 'hardwareDias', hardwareLengths: 'hardwareLengths', hardwareMaterials: 'hardwareMaterials'
        };
        const metaKey = mapping[key];
        let current = DB.data.meta.options[metaKey];

        // Type check for filtering
        if (key === 'dia' || key === 'thick' || key === 'hardwareDias' || key === 'hardwareLengths') itemVal = Number(itemVal);

        DB.data.meta.options[metaKey] = current.filter(x => x !== itemVal);
        await DB.save();

        // Refresh Modal
        document.getElementById(`libModal_${key}`).remove();
        ProductLibraryModule.openOptionLibrary(key);
    },

    editLibraryItem: async (key, oldVal) => {
        const mapping = {
            dia: 'diameters', thick: 'thicknesses', color: 'colors', surface: 'surfaces',
            hardwareShapes: 'hardwareShapes', hardwareDias: 'hardwareDias', hardwareLengths: 'hardwareLengths', hardwareMaterials: 'hardwareMaterials'
        };
        const metaKey = mapping[key];
        const current = DB.data.meta.options[metaKey];

        const newVal = prompt("Yeni değeri giriniz:", oldVal);
        if (!newVal || newVal == oldVal) return;

        let processedVal = newVal.trim();

        if (key === 'thick' || key === 'hardwareDias' || key === 'hardwareLengths') {
            if (isNaN(Number(processedVal))) return alert('Lütfen sayısal bir değer giriniz.');
            processedVal = Number(processedVal);
        } else if (key === 'dia') {
            // Smart type for dia
            if (!isNaN(Number(processedVal)) && processedVal.trim() !== '') {
                processedVal = Number(processedVal);
            }
        }

        // Update in place
        const idx = current.indexOf(key === 'dia' || key === 'thick' || key === 'hardwareDias' || key === 'hardwareLengths' ? Number(oldVal) : oldVal);
        if (idx !== -1) {
            current[idx] = processedVal;
            if (typeof processedVal === 'number') current.sort((a, b) => a - b);
            await DB.save();
            // Refresh Modal
            document.getElementById(`libModal_${key}`).remove();
            ProductLibraryModule.openOptionLibrary(key);
        }
    },

    // --- HARDWARE (CIVATA & HIRDAVAT) SPECIFIC LOGIC ---
    renderHardwarePage: (container) => {
        const { hardwareFilters } = ProductLibraryModule.state;

        // Initial Defaults
        if (!DB.data.meta.options) DB.data.meta.options = {};
        const defaults = {
            hardwareShapes: ['Havşa Baş', 'Anahtar Baş', 'İnbus', 'Havşa Baş İnbus', 'Gijon Saplama', 'Somun', 'Pul', 'Kelebek Somun', 'Akıllı Vida'],
            hardwareDias: ['M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12', 'M14', 'M16', 'M18', 'M20', '3.9', '4.2', '4.8'],
            hardwareMaterials: ['Siyah', 'Galvaniz', 'Paslanmaz', 'İnox', 'Pirinç']
        };
        for (let k in defaults) {
            if (!DB.data.meta.options[k]) DB.data.meta.options[k] = defaults[k];
        }
        const opts = DB.data.meta.options;

        // Filter Products
        if (!DB.data.data.products) DB.data.data.products = [];
        let products = DB.data.data.products.filter(p => p.category === 'Hardware');

        // Client-side Filtering
        let filteredProducts = products;
        if (hardwareFilters.shape) filteredProducts = filteredProducts.filter(p => p.specs.shape === hardwareFilters.shape);
        if (hardwareFilters.dia) filteredProducts = filteredProducts.filter(p => p.specs.diameter === hardwareFilters.dia);
        if (hardwareFilters.len) filteredProducts = filteredProducts.filter(p => p.specs.length == hardwareFilters.len);
        if (hardwareFilters.mat) filteredProducts = filteredProducts.filter(p => p.specs.material === hardwareFilters.mat);

        // Sorting
        filteredProducts.sort((a, b) => {
            const shapeA = a.specs.shape || '';
            const shapeB = b.specs.shape || '';
            if (shapeA !== shapeB) return shapeA.localeCompare(shapeB, 'tr');

            const diaA = String(a.specs.diameter || '');
            const diaB = String(b.specs.diameter || '');
            const diffDia = diaA.localeCompare(diaB, undefined, { numeric: true, sensitivity: 'base' });
            if (diffDia !== 0) return diffDia;

            return Number(a.specs.length || 0) - Number(b.specs.length || 0);
        });

        container.innerHTML = `
            <div style="max-width:1400px; margin:0 auto; font-family: 'Inter', sans-serif;">
                <!-- MAIN TITLE -->
                <div style="text-align:center; margin-bottom:3rem; position:relative">
                    <h1 style="font-size:2.5rem; color:#1e293b; letter-spacing:-0.03em; font-weight:300;">hırdavat & <span style="font-weight:700">bağlantı elemanları</span></h1>
                </div>

                <!-- ACTIONS ROW -->
                <div style="display:flex; flex-wrap:wrap; gap:1rem; align-items:center; margin-bottom:3rem; justify-content:space-between">
                     <!-- SEARCH CAPSULES -->
                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; flex:1; justify-content:center">
                         ${ProductLibraryModule.renderHardwareCapsule('şekil ile ara', 'shape', opts.hardwareShapes)}
                         ${ProductLibraryModule.renderHardwareCapsule('çap ile ara', 'dia', opts.hardwareDias)}

                         <!-- Length Capsule -->
                        <div class="search-capsule">
                            <input type="number" placeholder="boy ile ara" oninput="ProductLibraryModule.setHardwareFilter('len', this.value)" value="${hardwareFilters.len || ''}">
                        </div>

                         ${ProductLibraryModule.renderHardwareCapsule('malzeme ile ara', 'mat', opts.hardwareMaterials)}

                         <button class="search-btn" onclick="ProductLibraryModule.resetHardwareFilters()">temizle</button>
                    </div>

                    <!-- ADD BUTTON -->
                    <div style="flex-shrink:0">
                        ${(ProductLibraryModule.state.isFormVisible) ?
                `<button onclick="ProductLibraryModule.toggleHardwareForm()" class="btn-primary" style="background:#ef4444; padding:0.8rem 2rem; border-radius:1rem">İptal</button>`
                :
                `<button onclick="ProductLibraryModule.toggleHardwareForm()" class="btn-primary" style="padding:0.8rem 2rem; border-radius:1rem; font-size:1rem; box-shadow:0 4px 10px rgba(0,0,0,0.05)">Ürün ekle +</button>`
            }
                    </div>
                </div>

                <!-- STYLES -->
                <style>
                    .search-capsule { border:1px solid #94a3b8; border-radius:1rem; padding:0 1rem; background:white; display:flex; align-items:center; height:46px; transition:all 0.2s }
                    .search-capsule:focus-within { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1) }
                    .search-capsule select, .search-capsule input { border:none; outline:none; font-size:0.95rem; color:#334155; font-weight:600; text-align:center; background:transparent; width:130px; appearance:none; cursor:pointer }
                    .search-capsule input { width:100px }
                    .search-btn { border:2px solid #1e293b; color:#1e293b; background:transparent; border-radius:1rem; padding:0 1.5rem; height:46px; font-weight:800; cursor:pointer; transition:all 0.2s; text-transform:uppercase; font-size:0.8rem }
                    .search-btn:hover { background:#1e293b; color:white }
                </style>

                <!-- LIST -->
                <div style="display:flex; flex-direction:column; gap:0; border-top:2px solid #334155" id="hw_list_container">
                    ${ProductLibraryModule.renderHardwareList(filteredProducts)}
                </div>

                <!-- ADD FORM (CONDITIONAL) -->
                ${(ProductLibraryModule.state.isFormVisible) ? `
                    <div id="hwFormSection" style="margin-top:4rem; background:white; border:2px solid #e2e8f0; border-radius:2rem; padding:3rem; position:relative; box-shadow:0 20px 40px -10px rgba(0,0,0,0.05); animation: slideDown 0.3s ease-out">
                         <h3 style="font-size:1.5rem; color:#334155; margin-bottom:2rem; font-weight:700">Yeni Hırdavat/Cıvata Ekle</h3>

                         <div style="display:flex; gap:2rem; flex-wrap:wrap; align-items:flex-end">
                            ${ProductLibraryModule.renderHardwareInputGroup('civata şekli', 'shape', opts.hardwareShapes, '')}
                            ${ProductLibraryModule.renderHardwareInputGroup('çap / ebat', 'dia', opts.hardwareDias, '')}

                             <!-- Length Input for Form -->
                            <div style="display:flex; flex-direction:column; gap:0.5rem; min-width:140px;">
                                <div style="border:2px solid #94a3b8; border-radius:1.5rem; padding:0 1rem; height:56px; display:flex; align-items:center;">
                                    <input type="number" placeholder="boy" oninput="ProductLibraryModule.setHardwareFilter('len', this.value)" value="${hardwareFilters.len || ''}" style="width:100%; border:none; background:transparent; font-size:1.1rem; color:#334155; font-weight:600; outline:none; text-align:center;">
                                    <span style="font-size:0.9rem; font-weight:600; color:#94a3b8; margin-left:0.25rem">mm</span>
                                </div>
                            </div>

                            ${ProductLibraryModule.renderHardwareInputGroup('malzeme cinsi', 'mat', opts.hardwareMaterials, '')}

                            <div style="margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem">
                                <button onclick="ProductLibraryModule.addHardwareProduct()" class="btn-primary" style="padding:1rem 3rem; border-radius:1.5rem; font-size:1.1rem; font-weight:600">
                                    ÜRÜNÜ EKLE +
                                </button>
                            </div>
                         </div>
                    </div>
                ` : ''}
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    renderHardwareCapsule: (placeholder, key, options) => {
        const val = ProductLibraryModule.state.hardwareFilters[key];
        return `
            <div class="search-capsule" style="position:relative">
                <select onchange="ProductLibraryModule.setHardwareFilter('${key}', this.value)" style="width:100%; padding-right:1rem">
                    <option value="">${val ? val : placeholder}</option>
                    ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
                </select>
                <i data-lucide="chevron-down" width="14" style="position:absolute; right:10px; pointer-events:none; color:#94a3b8"></i>
            </div>
        `;
    },

    renderHardwareInputGroup: (label, key, options, unit) => {
        const val = ProductLibraryModule.state.hardwareFilters[key];
        return `
            <div style="display:flex; flex-direction:column; gap:0.5rem; min-width:140px;">
                 <button onclick="ProductLibraryModule.openOptionLibrary('${key === 'shape' ? 'hardwareShapes' : (key === 'dia' ? 'hardwareDias' : 'hardwareMaterials')}')" style="font-size:0.65rem; color:#3b82f6; text-align:center; background:none; border:none; cursor:pointer; font-weight:600">( + YÖNET ekle/sil )</button>
                <div style="border:2px solid #94a3b8; border-radius:1.5rem; padding:0.2rem 1rem; position:relative; height:56px; display:flex; align-items:center;">
                   <select onchange="ProductLibraryModule.setHardwareFilter('${key}', this.value)" style="width:100%; border:none; background:transparent; font-size:1.1rem; color:#334155; font-weight:600; outline:none; appearance:none; cursor:pointer; text-align-last:center; padding-right:1rem">
                        <option value="">${label.toUpperCase()}</option>
                        ${options.map(o => `<option value="${o}" ${val == o ? 'selected' : ''}>${o}${unit ? ' ' + unit : ''}</option>`).join('')}
                   </select>
                   <i data-lucide="chevron-down" width="16" style="position:absolute; right:10px; pointer-events:none; color:#94a3b8"></i>
                </div>
            </div>
         `;
    },

    setHardwareFilter: (key, val) => {
        ProductLibraryModule.state.hardwareFilters[key] = val;
        UI.renderCurrentPage();
    },

    resetHardwareFilters: () => {
        ProductLibraryModule.state.hardwareFilters = { shape: '', dia: '', len: '', mat: '' };
        UI.renderCurrentPage();
    },

    toggleHardwareForm: () => {
        ProductLibraryModule.state.isFormVisible = !ProductLibraryModule.state.isFormVisible;
        UI.renderCurrentPage();
        if (ProductLibraryModule.state.isFormVisible) {
            setTimeout(() => {
                const el = document.getElementById('hwFormSection');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        }
    },

    renderHardwareList: (products) => {
        if (products.length === 0) return '<div style="text-align:center; color:#cbd5e1; padding:3rem; font-size:1.2rem; font-weight:300">Bu kriterlerde ürün yok. Yeni ekleyebilirsiniz.</div>';

        return products.map(p => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:1.5rem 0; border-bottom:1px solid #64748b;">
                <div style="font-size:1.2rem; color:#334155; font-weight:500; display:flex; gap:1rem; align-items:baseline">
                    <span style="font-weight:700">${p.specs.shape}</span>
                    <span>${p.specs.diameter}${p.specs.length ? ' x ' + p.specs.length + ' mm' : ''}</span>
                    <span style="color:#64748b; font-size:1rem">/ ${p.specs.material}</span>
                </div>
                <div style="display:flex; align-items:center; gap:3rem">
                    <div style="font-family:monospace; color:#3b82f6; font-size:0.9rem; font-weight:600">ID: ${p.code || '---'}</div>
                    <div style="display:flex; gap:0.5rem; align-items:center">
                        <button class="list-btn" onclick="ProductLibraryModule.editHardwareProduct('${p.id}')">düzenle</button>
                        <span style="color:#cbd5e1">/</span>
                        <button class="list-btn" onclick="ProductLibraryModule.deleteHardwareProduct('${p.id}')">sil</button>
                    </div>
                    <div style="display:flex; align-items:center; gap:0.5rem; border-left:1px solid #e2e8f0; padding-left:1rem; margin-left:1rem">
                        <input type="checkbox" style="width:1.5rem; height:1.5rem; border:2px solid #94a3b8; border-radius:0.4rem; cursor:pointer">
                        <span style="color:#64748b; font-size:0.9rem">seç</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    addHardwareProduct: async () => {
        const { hardwareFilters } = ProductLibraryModule.state;
        // Validation
        if (!hardwareFilters.shape || !hardwareFilters.dia || !hardwareFilters.mat) {
            alert("Lütfen Şekil, Çap ve Malzeme seçiniz.");
            return;
        }

        // Auto Generate ID Logic
        // Map Shape
        const shapeMap = {
            'Havşa Baş': 'HB', 'Anahtar Baş': 'AB', 'İnbus': 'INB', 'Havşa Baş İnbus': 'HBI',
            'Gijon Saplama': 'GSP', 'Somun': 'SOM', 'Pul': 'PUL', 'Kelebek Somun': 'KLB', 'Akıllı Vida': 'AKL'
        };
        const matMap = { 'Siyah': 'SYH', 'Galvaniz': 'GLV', 'Paslanmaz': 'PSL', 'İnox': 'INOX', 'Pirinç': 'PRC' };

        const sCode = shapeMap[hardwareFilters.shape] || hardwareFilters.shape.substring(0, 3).toUpperCase();
        const mCode = matMap[hardwareFilters.mat] || hardwareFilters.mat.substring(0, 3).toUpperCase();
        const dia = hardwareFilters.dia.replace('.', ''); // Remove dots in dia
        const len = hardwareFilters.len || '00';
        const suffix = Math.floor(Math.random() * 1000).toString().padStart(4, '0');

        const code = `${sCode}-${dia}-${len}-${mCode}-${suffix}`;

        const newProduct = {
            id: crypto.randomUUID(),
            category: 'Hardware',
            type: 'Cıvata',
            name: `${hardwareFilters.shape} ${hardwareFilters.dia} ${hardwareFilters.len ? 'x ' + hardwareFilters.len : ''}`,
            code: code,
            specs: {
                shape: hardwareFilters.shape,
                diameter: hardwareFilters.dia,
                length: hardwareFilters.len,
                material: hardwareFilters.mat
            },
            created_at: new Date().toISOString()
        };

        if (!DB.data.data.products) DB.data.data.products = [];
        DB.data.data.products.push(newProduct);
        await DB.save();

        ProductLibraryModule.state.hardwareFilters = { shape: '', dia: '', len: '', mat: '' };
        ProductLibraryModule.state.isFormVisible = false;
        UI.renderCurrentPage();
    },

    deleteHardwareProduct: async (id) => {
        if (confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
            DB.data.data.products = DB.data.data.products.filter(p => p.id !== id);
            await DB.save();
            UI.renderCurrentPage();
        }
    },

    editHardwareProduct: (id) => {
        const p = DB.data.data.products.find(x => x.id === id);
        if (!p) return;

        ProductLibraryModule.state.hardwareFilters = {
            shape: p.specs.shape,
            dia: p.specs.diameter,
            len: p.specs.length || '',
            mat: p.specs.material
        };

        ProductLibraryModule.state.isFormVisible = true;
        UI.renderCurrentPage();
        setTimeout(() => {
            const el = document.getElementById('hwFormSection');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            alert("Ürün bilgileri forma yüklendi. Düzenleyip 'Ürün Ekle' diyerek yeni bir kayıt oluşturabilirsiniz.");
        }, 50);
    },

    addExtruderProduct: async () => {
        const { extruderTab, filters } = ProductLibraryModule.state;

        // Validate required fields based on Tab
        if (!filters.dia || !filters.len || !filters.color) {
            alert("Lütfen çap, boy ve renk seçiniz.");
            return;
        }
        if (extruderTab === 'PIPE' && !filters.thick) {
            alert("Lütfen kalınlık seçiniz.");
            return;
        }
        if (extruderTab === 'ROD' && !filters.surface) {
            alert("Lütfen yüzey tipi seçiniz.");
            return;
        }

        // Generate ID / Code
        const typeCode = extruderTab === 'ROD' ? 'CB' : 'BR'; // CB: Çubuk, BR: Boru
        const specCode = `${filters.dia}-${filters.len}-${filters.color.substring(0, 3).toUpperCase()}`;
        const uniqueSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const code = `${typeCode}-${specCode}-${uniqueSuffix}`;

        const newProduct = {
            id: crypto.randomUUID(),
            category: 'Ekstrüder',
            type: extruderTab,
            name: `${filters.dia}mm ${extruderTab === 'ROD' ? 'Çubuk' : 'Boru'}`,
            code: code,
            specs: {
                diameter: filters.dia,
                length: filters.len,
                color: filters.color,
                thickness: filters.thick || null,
                surface: filters.surface || null,
                // bubble: filters.surface === 'Kabarcıklı' // Keep backward compat logic if needed - REMOVED
            },
            created_at: new Date().toISOString()
        };

        if (!DB.data.data.products) DB.data.data.products = [];
        DB.data.data.products.push(newProduct);
        await DB.save();

        // Reset Inputs after successful add
        ProductLibraryModule.state.filters = { dia: '', len: '', thick: '', color: '', surface: '' };
        ProductLibraryModule.state.isFormVisible = false; // Close form
        UI.renderCurrentPage();
    },

    deleteExtruderProduct: async (id) => {
        if (confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
            DB.data.data.products = DB.data.data.products.filter(p => p.id !== id);
            await DB.save();
            UI.renderCurrentPage();
        }
    },

    editExtruderProduct: async (id) => {
        // Simplified Edit: Just delete and ask to re-add for now, or populate filters?
        // Populating filters is better
        const p = DB.data.data.products.find(x => x.id === id);
        if (!p) return;

        ProductLibraryModule.state.extruderTab = p.type;
        ProductLibraryModule.state.filters = {
            dia: p.specs.diameter,
            len: p.specs.length,
            color: p.specs.color,
            thick: p.specs.thickness || '',
            surface: p.specs.surface || (p.specs.bubble ? 'Kabarcıklı' : 'Kabarcıksız')
        };
        // We should probably delete the old one if they click "Update" but we only have "Add" button right now.
        // For Prototype, let's just populate the fields so they can add a NEW similar one or delete the old one.
        // Open Form
        ProductLibraryModule.state.isFormVisible = true;
        UI.renderCurrentPage();

        setTimeout(() => {
            const el = document.getElementById('extFormSection');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            alert("Ürün özellikleri forma aktarıldı. Düzenleyip 'Ürün Ekle' diyerek yeni bir kayıt oluşturabilirsiniz.");
        }, 100);
    }
};


const PurchasingModule = {
    state: { activeTab: 'orders', searchTerm: '' }, // orders | requests | suppliers

    render: (c) => {
        const { activeTab, searchTerm } = PurchasingModule.state;

        // --- Mock Data Helpers (Connect to DB later) ---
        if (!DB.data.data.orders) DB.data.data.orders = [];
        if (!DB.data.data.suppliers) DB.data.data.suppliers = [];

        // Ensure suppliers has data if empty for demo
        if (DB.data.data.suppliers.length === 0) {
            DB.data.data.suppliers = [
                { id: 'sup1', name: 'AKPA ALÜMİNYUM', contact: { person: 'Ahmet Yılmaz', phone: '0532 111 22 33', address: 'OSB Mah.', tax: '1234567890' } },
                { id: 'sup2', name: 'TEKİN ELOKSAL', contact: { person: 'Mehmet Demir', phone: '0555 444 55 66', address: 'Sanayi Sit.', tax: '0987654321' } }
            ];
        }

        const orders = DB.data.data.orders;
        const requests = DB.data.data.requests || [];
        const suppliers = DB.data.data.suppliers;

        // --- FILTERING ---
        const filteredSuppliers = suppliers.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.contact?.person || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        const renderTabBtn = (id, label, icon) => `
            <button onclick="PurchasingModule.setTab('${id}')" 
                class="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === id ? 'bg-slate-800 text-white shadow-lg scale-105' : 'bg-white text-slate-500 hover:bg-slate-50'}">
                <i data-lucide="${icon}" width="20"></i> ${label}
            </button>
        `;

        const renderStat = (title, val, icon, color, bg) => `
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div class="p-4 rounded-xl ${bg} ${color}">
                    <i data-lucide="${icon}" width="24"></i>
                </div>
                <div>
                    <p class="text-sm text-slate-400 font-medium">${title}</p>
                    <h3 class="text-2xl font-bold text-slate-700">${val}</h3>
                </div>
            </div>
        `;

        let contentHtml = '';

        // --- 1. ORDERS TAB ---
        if (activeTab === 'orders') {
            const pendingOrders = orders.filter(o => o.status === 'pending');
            contentHtml = `
                <div class="space-y-6">
                    <!-- Toolbar -->
                    <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <div class="flex gap-2">
                            <input value="${searchTerm}" oninput="PurchasingModule.setSearch(this.value)" placeholder="Sipariş ara..." class="bg-slate-50 px-4 py-2 rounded-lg text-sm outline-none focus:ring-2 ring-blue-100">
                            <button class="p-2 bg-slate-100 rounded-lg text-slate-500"><i data-lucide="filter" width="18"></i></button>
                        </div>
                        <button onclick="PurchasingModule.newOrderModal()" class="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-emerald-200 transition-all">
                            <i data-lucide="plus" width="18"></i> Yeni Sipariş Gir
                        </button>
                    </div>

                    <!-- List -->
                    <div class="grid gap-4">
                        ${pendingOrders.length === 0 ? `
                            <div class="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                                <span class="mx-auto text-slate-200 mb-4 block w-12"><i data-lucide="truck" width="48" height="48"></i></span>
                                <p class="text-slate-400 font-medium">Henüz sipariş kaydı yok.</p>
                            </div>
                        ` : pendingOrders.map(o => `
                            <div class="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-blue-200 transition-colors">
                                <div class="flex items-center gap-6">
                                    <div class="p-4 rounded-xl bg-orange-100 text-orange-600">
                                        <i data-lucide="clock" width="24"></i>
                                    </div>
                                    <div>
                                        <div class="flex items-center gap-2 mb-1">
                                            <h4 class="font-bold text-slate-800 text-lg">${o.supplierName || 'Tedarikçi'}</h4>
                                            <span class="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">PO-${o.id.slice(0, 4)}</span>
                                        </div>
                                        <p class="text-slate-500">
                                            <span class="font-semibold text-slate-700">${o.itemName}</span> ürününden
                                            <span class="font-bold text-slate-900 mx-1">${o.quantity}</span> adet bekleniyor.
                                        </p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-600">Yolda / Bekleniyor</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        // --- 2. REQUESTS TAB ---
        else if (activeTab === 'requests') {
            contentHtml = `
                <div class="space-y-4">
                    <div class="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3">
                        <div class="text-blue-500"><i data-lucide="alert-triangle" width="20"></i></div>
                        <p class="text-blue-700 text-sm"><b>İpucu:</b> Atölyedeki ustalar mobil ekrandan "Malzeme İste" dediğinde buraya düşecek.</p>
                    </div>
                    
                    ${requests.length === 0 ? `
                        <div class="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                             <span class="mx-auto text-slate-200 mb-4 block w-12"><i data-lucide="file-text" width="48" height="48"></i></span>
                            <p class="text-slate-400 font-medium">Bekleyen talep yok.</p>
                        </div>
                    ` : requests.map(req => `
                        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group hover:shadow-md transition-shadow">
                            <div class="flex items-center gap-4">
                                <div class="p-3 bg-red-100 text-red-600 rounded-full">
                                    <i data-lucide="alert-triangle" width="20"></i>
                                </div>
                                <div>
                                    <h4 class="font-bold text-slate-700 text-lg">${req.productName || 'Ürün ???'}</h4>
                                    <p class="text-sm text-slate-400">
                                        İsteyen: <span class="text-slate-600 font-semibold">${req.unitName || 'Birim'}</span> •
                                        Miktar: <span class="text-slate-600 font-bold">${req.quantity}</span>
                                    </p>
                                </div>
                            </div>
                            <button class="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-700">
                                Siparişe Dönüştür
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        // --- 3. SUPPLIERS TAB ---
        else if (activeTab === 'suppliers') {
            contentHtml = `
                 <div class="space-y-6" style="display:flex; flex-direction:column; gap:1.5rem">
                    <!-- TOOLBAR -->
                    <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 gap-4" style="display:flex; justify-content:space-between; background:white; padding:1rem; border-radius:0.75rem; border:1px solid #f1f5f9; align-items:center">
                        <div class="flex gap-2 w-full md:w-auto relative group" style="display:flex; gap:0.5rem; flex:1">
                            <input value="${searchTerm}" oninput="PurchasingModule.setSearch(this.value)" placeholder="Akıllı Arama: Firma Adı, Yetkili..." class="bg-slate-50 px-10 py-3 rounded-xl text-sm outline-none w-full" style="width:100%; background:#f8fafc; padding:0.75rem 2.5rem; border-radius:0.75rem; border:1px solid #e2e8f0; outline:none">
                            <i data-lucide="search" width="20" style="position:absolute; left:12px; top:12px; color:#94a3b8"></i>
                        </div>
                        <button onclick="PurchasingModule.newSupplierModal()" class="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-slate-200 transition-all" style="background:#0f172a; color:white; padding:0.75rem 1.5rem; border-radius:0.75rem; font-weight:700; display:flex; gap:0.5rem; align-items:center; cursor:pointer">
                            <i data-lucide="plus" width="20"></i> Yeni Tedarikçi
                        </button>
                    </div>

                    <!-- TABLE -->
                    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" style="background:white; border-radius:1rem; border:1px solid #f1f5f9; overflow:hidden">
                        <table class="w-full text-left border-collapse" style="width:100%; border-collapse:collapse">
                            <thead>
                                <tr class="bg-slate-50/50 border-b border-slate-200 text-xs uppercase text-slate-400 font-bold tracking-wider" style="background:#f8fafc; border-bottom:1px solid #e2e8f0; color:#94a3b8; font-size:0.75rem; text-transform:uppercase; font-weight:700">
                                    <th class="px-6 py-4" style="padding:1rem 1.5rem; text-align:left">Firma Ünvanı</th>
                                    <th class="px-6 py-4" style="padding:1rem 1.5rem; text-align:left">Yetkili Kişi</th>
                                    <th class="px-6 py-4" style="padding:1rem 1.5rem; text-align:left">Telefon</th>
                                    <th class="px-6 py-4 text-right" style="padding:1rem 1.5rem; text-align:right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                ${filteredSuppliers.length === 0 ? '<tr><td colspan="4" class="py-10 text-center text-slate-400">Tedarikçi yok.</td></tr>' :
                    filteredSuppliers.map(s => `
                                    <tr class="hover:bg-blue-50/30 transition-colors group" style="border-bottom:1px solid #f1f5f9; cursor:pointer" onclick="PurchasingModule.editSupplier('${s.id}')">
                                        <td class="px-6 py-4" style="padding:1rem 1.5rem">
                                            <div class="flex items-center gap-3" style="display:flex; align-items:center; gap:0.75rem">
                                                <div class="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold" style="width:2.5rem; height:2.5rem; background:#faf5ff; color:#9333ea; display:flex; align-items:center; justify-content:center; border-radius:0.5rem">${s.name.substring(0, 2)}</div>
                                                <div class="font-bold text-slate-700 text-base" style="font-weight:700; color:#334155">
                                                    ${s.name}
                                                    <div class="text-xs text-slate-400 font-normal">${s.contact?.tax || ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4" style="padding:1rem 1.5rem"><span class="font-medium text-slate-600">${s.contact?.person || '-'}</span></td>
                                        <td class="px-6 py-4" style="padding:1rem 1.5rem"><span class="text-slate-500 font-mono text-sm">${s.contact?.phone || '-'}</span></td>
                                        <td class="px-6 py-4 text-right" style="padding:1rem 1.5rem; text-align:right">
                                            <button onclick="event.stopPropagation(); PurchasingModule.deleteSupplier('${s.id}')" style="color:#cbd5e1; cursor:pointer" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#cbd5e1'"><i data-lucide="trash-2" width="18"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                 </div>
            `;
        }



        // --- RENDER MAIN LAYOUT ---
        c.innerHTML = `
            <div class="max-w-7xl mx-auto space-y-8 p-6 md:p-10 font-sans">
                <div class="flex flex-col gap-4">
                    <button onclick="location.reload()" class="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors w-fit">
                        <i data-lucide="arrow-left" width="20"></i>
                        <span>Ana Menüye Dön</span>
                    </button>

                    <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 class="text-3xl font-bold text-slate-800 tracking-tight">Satın Alma Yönetimi</h1>
                            <p class="text-slate-500 mt-1">Hammadde tedariki, sipariş takibi ve iç talepler.</p>
                        </div>
                        <div class="flex gap-4">
                            ${renderStat('Bekleyen', orders.filter(o => o.status === 'pending').length, 'clock', 'text-orange-600', 'bg-orange-100')}
                            ${renderStat('Talepler', requests.length, 'alert-triangle', 'text-red-600', 'bg-red-100')}
                        </div>
                    </div>
                </div>

                <div class="flex gap-2 overflow-x-auto pb-2">
                    ${renderTabBtn('orders', 'Siparişler (Yoldakiler)', 'truck')}
                    ${renderTabBtn('requests', 'Talep Havuzu', 'file-text')}
                    ${renderTabBtn('suppliers', 'Tedarikçiler', 'users')}
                </div>

                <div class="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    ${contentHtml}
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
    },

    setTab: (t) => {
        PurchasingModule.state.activeTab = t;
        UI.renderCurrentPage();
    },

    setSearch: (val) => {
        PurchasingModule.state.searchTerm = val;
        UI.renderCurrentPage();
        // Keep focus
        setTimeout(() => {
            const el = document.querySelector('input[placeholder*="Arama"]');
            if (el) {
                el.focus();
                el.value = val;
            }
        }, 10);
    },

    newOrderModal: () => {
        alert("Sipariş Oluşturma Modalı (Hazırlanıyor...)");
    },

    newSupplierModal: () => {
        const modalContent = `
            <div class="flex flex-col gap-6 font-sans">
                <!-- Top Section: Avatar & Main Info -->
                <div class="flex flex-col md:flex-row gap-6">
                    <!-- Left: Avatar Placeholder -->
                    <div class="w-24 h-24 md:w-32 md:h-32 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center relative group cursor-pointer hover:border-blue-400 transition-colors shrink-0">
                        <i data-lucide="camera" class="text-slate-300 w-8 h-8 md:w-10 md:h-10"></i>
                        <div class="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                            <span class="text-xs font-bold text-slate-600">Düzenle</span>
                        </div>
                    </div>

                    <!-- Right: Main Inputs -->
                    <div class="flex-1 space-y-4">
                        <div class="space-y-1">
                            <input id="new_sup_name" class="w-full text-2xl md:text-3xl font-bold bg-transparent border-b-2 border-slate-200 focus:border-blue-500 outline-none pb-2 placeholder-slate-300 text-slate-800 transition-all font-serif" placeholder="İsim (şirket veya kişi)">
                            <div class="flex gap-4 pt-1">
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="entity_type" value="company" checked class="accent-blue-600">
                                    <span class="text-slate-600 text-sm font-medium"><i data-lucide="building-2" width="14" class="inline mb-0.5"></i> Şirket</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="entity_type" value="person" class="accent-blue-600">
                                    <span class="text-slate-600 text-sm font-medium"><i data-lucide="user" width="14" class="inline mb-0.5"></i> Bireysel</span>
                                </label>
                            </div>
                        </div>

                        <div class="grid gap-3 pt-2 max-w-lg">
                            <div class="flex items-center gap-3">
                                <span class="w-20 text-right text-sm font-bold text-slate-400">E-posta</span>
                                <input id="new_sup_email" class="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 ring-blue-100 focus:border-blue-400" placeholder="mail@ornek.com">
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="w-20 text-right text-sm font-bold text-slate-400">Telefon</span>
                                <input id="new_sup_phone" class="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 ring-blue-100 focus:border-blue-400" placeholder="0532...">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Middle Section: Tabs Navigation -->
                <div class="flex gap-6 border-b border-slate-200 text-sm font-bold text-slate-500 overflow-x-auto">
                    <button class="pb-3 border-b-2 border-blue-600 text-blue-700">Genel Bilgiler</button>
                    <button class="pb-3 border-b-2 border-transparent hover:text-slate-700">Satış & Satınalma</button>
                    <button class="pb-3 border-b-2 border-transparent hover:text-slate-700">Notlar</button>
                </div>

                <!-- Tab Content: Address & Other Details -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 text-sm">
                    <!-- Left Column: Address -->
                    <div class="space-y-4">
                        <div class="flex gap-4">
                            <span class="w-24 font-bold text-slate-700 shrink-0 pt-2">Adres</span>
                            <div class="flex-1 space-y-2">
                                <input id="new_sup_addr1" class="w-full bg-transparent border-b border-slate-200 focus:border-blue-400 outline-none py-1 placeholder-slate-300" placeholder="Adres satırı 1...">
                                <input id="new_sup_addr2" class="w-full bg-transparent border-b border-slate-200 focus:border-blue-400 outline-none py-1 placeholder-slate-300" placeholder="Adres satırı 2...">
                                <div class="flex gap-2">
                                    <input id="new_sup_city" class="w-1/2 bg-transparent border-b border-slate-200 focus:border-blue-400 outline-none py-1 placeholder-slate-300" placeholder="İlçe / Şehir">
                                    <input id="new_sup_country" class="w-1/2 bg-transparent border-b border-slate-200 focus:border-blue-400 outline-none py-1 placeholder-slate-300" placeholder="Ülke">
                                </div>
                            </div>
                        </div>
                        
                         <div class="flex gap-4 items-center pt-2">
                            <span class="w-24 font-bold text-slate-700 shrink-0">VKN/TCKN</span>
                            <div class="flex-1 relative">
                                <input id="new_sup_tax" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400" placeholder="Vergi No / TCKN">
                                <i data-lucide="help-circle" class="absolute right-2 top-1.5 text-slate-300 w-4 h-4 cursor-help" title="Vergi Kimlik Numarası"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Job & Web -->
                    <div class="space-y-4">
                        <div class="flex gap-4 items-center">
                            <span class="w-24 font-bold text-slate-700 shrink-0">Yetkili Kişi</span>
                            <input id="new_sup_person" class="flex-1 bg-transparent border-b border-slate-200 focus:border-blue-400 outline-none py-1 placeholder-slate-300" placeholder="İlgili kişi adı...">
                        </div>
                        <div class="flex gap-4 items-center">
                            <span class="w-24 font-bold text-slate-700 shrink-0">İş Pozisyonu</span>
                            <input id="new_sup_job" class="flex-1 bg-transparent border-b border-slate-200 focus:border-blue-400 outline-none py-1 placeholder-slate-300" placeholder="Örn. Satış Yöneticisi">
                        </div>
                        <div class="flex gap-4 items-center">
                            <span class="w-24 font-bold text-slate-700 shrink-0">Websitesi</span>
                            <input id="new_sup_web" class="flex-1 bg-transparent border-b border-slate-200 focus:border-blue-400 outline-none py-1 placeholder-slate-300" placeholder="https://www.firma.com">
                        </div>
                         <div class="flex gap-4 items-center">
                            <span class="w-24 font-bold text-slate-700 shrink-0">Etiketler</span>
                            <input id="new_sup_tags" class="flex-1 bg-transparent border-b border-slate-200 focus:border-blue-400 outline-none py-1 placeholder-slate-300" placeholder="Örn. VIP, Hammadde...">
                        </div>
                    </div>
                </div>

                <!-- Footer Action -->
                <div class="pt-6 border-t border-slate-100 flex justify-end gap-3">
                    <button class="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors" onclick="Modal.close()">Vazgeç</button>
                    <button class="px-8 py-2.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all flex items-center gap-2" onclick="PurchasingModule.saveSupplier()">
                        <i data-lucide="save" width="18"></i> Kaydet
                    </button>
                </div>
            </div>
            <!-- Re-init icons inside modal -->
            <script>lucide.createIcons();</script>
        `;
        Modal.open('', modalContent); // Title empty for cleaner look
    },

    editSupplier: (id) => {
        const s = DB.data.data.suppliers.find(x => x.id === id);
        if (!s) return;
        PurchasingModule.newSupplierModal();
        setTimeout(() => {
            document.getElementById('new_sup_name').value = s.name;
            document.getElementById('new_sup_person').value = s.contact?.person || '';
            document.getElementById('new_sup_phone').value = s.contact?.phone || '';
            document.getElementById('new_sup_addr1').value = s.contact?.address || '';
            document.getElementById('new_sup_tax').value = s.contact?.tax || '';

            // New fields validation
            if (s.contact?.email) document.getElementById('new_sup_email').value = s.contact.email;
            if (s.contact?.job) document.getElementById('new_sup_job').value = s.contact.job;
            if (s.contact?.web) document.getElementById('new_sup_web').value = s.contact.web;

            const btn = document.querySelector('button[onclick="PurchasingModule.saveSupplier()"]');
            btn.onclick = () => PurchasingModule.saveSupplier(id);
            btn.innerHTML = '<i data-lucide="save" width="18"></i> Güncelle';
            lucide.createIcons();
        }, 50);
    },

    saveSupplier: async (editId = null) => {
        const name = document.getElementById('new_sup_name').value;
        const person = document.getElementById('new_sup_person').value;
        const phone = document.getElementById('new_sup_phone').value;
        const email = document.getElementById('new_sup_email').value;
        const address = document.getElementById('new_sup_addr1').value; // Main addr
        const tax = document.getElementById('new_sup_tax').value;
        const job = document.getElementById('new_sup_job').value;
        const web = document.getElementById('new_sup_web').value;

        if (!name) {
            alert("Lütfen firma ismini giriniz.");
            return;
        }

        if (!DB.data.data.suppliers) DB.data.data.suppliers = [];

        const data = {
            name,
            contact: { person, phone, email, address, tax, job, web }
        };

        if (editId) {
            const idx = DB.data.data.suppliers.findIndex(s => s.id === editId);
            if (idx !== -1) {
                DB.data.data.suppliers[idx] = { ...DB.data.data.suppliers[idx], ...data };
            }
        } else {
            DB.data.data.suppliers.push({
                id: crypto.randomUUID(),
                ...data
            });
        }

        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },

    deleteSupplier: async (id) => {
        if (confirm('Silmek istediğinize emin misiniz?')) {
            DB.data.data.suppliers = DB.data.data.suppliers.filter(s => s.id !== id);
            await DB.save();
            UI.renderCurrentPage();
        }
    }
};

const StockModule = {
    state: { activeTab: 'VIEW', activeLocation: 'ALL', searchQuery: '', isOpModalOpen: false },

    render: (c) => {
        const { activeTab, activeLocation, searchQuery } = StockModule.state;

        // --- DATA PREP ---
        const LOCATIONS = [
            { id: 'ALL', label: 'TÜMÜ' },
            { id: 'MAIN', label: 'ANA DEPO' },
            { id: 'EKSTRÜZYON', label: 'EKSTRÜZYON' },
            { id: 'CNC', label: 'CNC' },
            { id: 'TESTERE', label: 'TESTERE' },
            { id: 'PLEKSİ', label: 'PLEKSİ POLİSAJ' },
            { id: 'PUNTA', label: 'PUNTA' },
            { id: 'PAKETLEME', label: 'PAKETLEME' },
        ];

        // Ensure Data Exists
        if (!DB.data.data.stock_movements) DB.data.data.stock_movements = [];
        if (!DB.data.data.products || DB.data.data.products.length === 0) {
            DB.data.data.products = [
                { id: 'p1', name: 'Alüminyum Profil 20x20', code: 'AL-2020' },
                { id: 'p2', name: 'M5 Vida', code: 'VD-M5' },
                { id: 'p3', name: 'Pleksi Levha 3mm', code: 'PL-3MM' }
            ];
            // Seed some movements if empty
            if (DB.data.data.stock_movements.length === 0) {
                DB.data.data.stock_movements = [
                    { id: 't1', date: new Date().toISOString(), productId: 'p1', type: 'INBOUND', toLocation: 'MAIN', quantity: 1000, user: 'Admin' },
                    { id: 't2', date: new Date().toISOString(), productId: 'p1', type: 'TRANSFER', fromLocation: 'MAIN', toLocation: 'CNC', quantity: 150, user: 'Vardiya Amiri' }
                ];
            }
        }

        const txns = DB.data.data.stock_movements;
        const products = DB.data.data.products;

        // Calculate Stock
        const stockItems = products.map(p => {
            const item = { ...p, stock: {}, total: 0 };
            txns.forEach(t => {
                if (t.productId !== p.id) return;
                const mod = (loc, qty) => item.stock[loc] = (item.stock[loc] || 0) + qty;

                if (t.type === 'INBOUND') mod(t.toLocation, t.quantity);
                else if (t.type === 'OUTBOUND') mod(t.fromLocation, -t.quantity);
                else if (t.type === 'TRANSFER') { mod(t.fromLocation, -t.quantity); mod(t.toLocation, t.quantity); }
                else if (t.type === 'CORRECTION') mod(t.toLocation, t.quantity);
            });
            item.total = Object.values(item.stock).reduce((a, b) => a + b, 0);
            return item;
        });

        // Filter
        const filteredStock = stockItems.filter(i => {
            const matchSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.code.toLowerCase().includes(searchTerm.toLowerCase());
            let matchLoc = true;
            if (activeLocation !== 'ALL') matchLoc = (i.stock[activeLocation] || 0) > 0;
            return matchSearch && matchLoc;
        });

        const filteredTxns = txns.filter(t => {
            if (activeLocation === 'ALL') return true;
            return t.fromLocation === activeLocation || t.toLocation === activeLocation;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));


        // --- HTML GENERATORS ---
        const renderHeader = () => `
            <header class="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm mb-4" style="margin:-1rem -1rem 1rem -1rem; padding:1rem; display:flex; justify-content:space-between; align-items:center">
                <div class="flex items-center gap-4" style="display:flex; align-items:center; gap:1rem">
                    <div>
                        <h1 class="text-2xl font-bold flex items-center gap-2 text-slate-800" style="font-size:1.5rem; font-weight:700; color:#1e293b; display:flex; align-items:center; gap:0.5rem">
                            <i data-lucide="package" class="text-blue-600" style="color:#2563eb"></i> DEPO & STOK
                        </h1>
                        <p class="text-slate-500 text-sm" style="color:#64748b; font-size:0.875rem">Merkezi stok yönetimi ve depo hareketleri</p>
                    </div>
                </div>
                <div class="flex bg-slate-100 p-1 rounded-xl" style="background:#f1f5f9; padding:0.25rem; border-radius:0.75rem; display:flex; gap:0.25rem">
                    <button onclick="StockModule.setTab('VIEW')" class="px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'VIEW' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}" style="${activeTab === 'VIEW' ? 'background:white; color:#2563eb; box-shadow:0 1px 2px 0 rgba(0,0,0,0.05)' : 'color:#64748b'}">Stok Görünümü</button>
                    <button onclick="StockModule.setTab('OPS')" class="px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'OPS' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}" style="${activeTab === 'OPS' ? 'background:white; color:#2563eb; box-shadow:0 1px 2px 0 rgba(0,0,0,0.05)' : 'color:#64748b'}">Depo İşlemleri</button>
                </div>
            </header>
        `;

        const renderFilters = () => `
             <div class="px-6 pb-0 flex items-center justify-between gap-4 border-t border-slate-50 pt-2 mb-4" style="display:flex; justify-content:space-between; gap:1rem; border-top:1px solid #f8fafc; padding-top:0.5rem; margin-bottom:1rem">
                <!-- Locations -->
                <div class="flex gap-1 overflow-x-auto" style="display:flex; gap:0.25rem">
                    ${LOCATIONS.map(loc => `
                        <button onclick="StockModule.setLoc('${loc.id}')" class="px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeLocation === loc.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}" style="${activeLocation === loc.id ? 'border-bottom:2px solid #2563eb; color:#2563eb; background:#eff6ff' : 'color:#64748b'}">
                            ${loc.label}
                        </button>
                    `).join('')}
                </div>
                <!-- Tools -->
                <div class="flex items-center gap-3 pb-2" style="display:flex; gap:0.75rem">
                    <div class="relative">
                        <input value="${searchTerm}" oninput="StockModule.setSearch(this.value)" placeholder="Stok ara..." class="bg-slate-100 rounded-lg text-sm font-semibold outline-none" style="background:#f1f5f9; padding:0.5rem 1rem 0.5rem 2.5rem; border-radius:0.5rem; border:none; width:200px">
                        <i data-lucide="search" size="16" style="position:absolute; left:12px; top:10px; color:#94a3b8; width:16px"></i>
                    </div>
                    ${activeTab === 'OPS' ? `
                        <button onclick="StockModule.openOpModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-200 text-sm" style="background:#2563eb; color:white; padding:0.5rem 1rem; border-radius:0.5rem; display:flex; align-items:center; gap:0.5rem; cursor:pointer">
                            <i data-lucide="plus" width="16"></i> Yeni İşlem
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        const renderMatrix = () => `
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" style="background:white; border-radius:0.75rem; border:1px solid #e2e8f0; overflow:hidden">
                <table class="w-full text-left border-collapse" style="width:100%; border-collapse:collapse">
                    <thead class="bg-slate-50 border-b border-slate-200" style="background:#f8fafc; border-bottom:1px solid #e2e8f0">
                        <tr>
                            <th class="p-4 font-bold text-slate-600 w-1/4" style="padding:1rem; text-align:left; color:#475569">Malzeme / Ürün</th>
                            <th class="p-4 font-bold text-slate-600 text-center bg-blue-50/50 border-x border-slate-200 w-24" style="padding:1rem; text-align:center; color:#475569; background:#eff6ff; border-left:1px solid #e2e8f0; border-right:1px solid #e2e8f0">TOPLAM</th>
                            ${LOCATIONS.filter(l => l.id !== 'ALL').map(l => `<th class="p-4 font-semibold text-xs text-slate-500 text-center ${activeLocation === l.id ? 'bg-yellow-50 text-yellow-700 font-bold' : ''}" style="padding:1rem; text-align:center; font-size:0.75rem; color:#64748b; ${activeLocation === l.id ? 'background:#fefce8; color:#a16207; font-weight:700' : ''}">${l.label.split(' ')[0]}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${filteredStock.length === 0 ? '<tr><td colspan="10" class="p-12 text-center text-slate-400">Veri bulunamadı.</td></tr>' :
                filteredStock.map(i => `
                            <tr class="hover:bg-slate-50 group transition-colors" style="border-bottom:1px solid #f1f5f9">
                                <td class="p-4" style="padding:1rem">
                                    <div class="font-bold text-slate-800" style="color:#1e293b; font-weight:700">${i.name}</div>
                                    <div class="text-xs text-slate-400 font-mono flex items-center gap-2" style="font-size:0.75rem; color:#94a3b8; font-family:monospace">
                                        ${i.code}
                                        ${i.total < (i.minLimit || 50) ? '<span class="text-red-500 flex items-center gap-1" style="color:#ef4444; display:flex; align-items:center; gap:0.25rem"><i data-lucide="alert-circle" width="10"></i> Kritik</span>' : ''}
                                    </div>
                                </td>
                                <td class="p-4 text-center bg-blue-50/10 border-x border-slate-100 font-bold text-slate-800 text-lg" style="padding:1rem; text-align:center; font-size:1.125rem; font-weight:700; color:#1e293b; background:#f8fafc; border-left:1px solid #f1f5f9; border-right:1px solid #f1f5f9">${i.total}</td>
                                ${LOCATIONS.filter(l => l.id !== 'ALL').map(l => `
                                    <td class="p-4 text-center" style="padding:1rem; text-align:center; ${activeLocation === l.id ? 'background:#fefce8' : ''}">
                                        <span class="${(i.stock[l.id] || 0) > 0 ? 'font-bold text-slate-700' : 'text-slate-300 text-xs'}" style="${(i.stock[l.id] || 0) > 0 ? 'color:#334155; font-weight:700' : 'color:#cbd5e1; font-size:0.75rem'}">${(i.stock[l.id] || 0) > 0 ? i.stock[l.id] : '-'}</span>
                                    </td>
                                `).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        const renderOps = () => `
            <div class="space-y-4">
                <div class="bg-blue-50 border border-blue-100 text-blue-700 p-4 rounded-xl flex items-start gap-3" style="background:#eff6ff; border:1px solid #dbeafe; padding:1rem; border-radius:0.75rem; display:flex; gap:0.75rem; color:#1d4ed8">
                    <i data-lucide="history" size="20"></i>
                    <div>
                        <p class="font-bold text-sm" style="font-weight:700; font-size:0.875rem">Denetim Günlüğü (Audit Log)</p>
                        <p class="text-xs opacity-80" style="font-size:0.75rem; opacity:0.8">Stok değişimi yapmanıza gerek yoktur, yapılan her işlem otomatik olarak stokları günceller.</p>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" style="background:white; border-radius:0.75rem; border:1px solid #e2e8f0">
                    <table class="w-full text-left" style="width:100%">
                         <thead class="bg-slate-50 border-b border-slate-200" style="background:#f8fafc; border-bottom:1px solid #e2e8f0">
                            <tr>
                                <th class="p-4 font-bold text-slate-600" style="padding:1rem; text-align:left; color:#475569">Tarih / Kullanıcı</th>
                                <th class="p-4 font-bold text-slate-600" style="padding:1rem; text-align:left; color:#475569">İşlem Türü</th>
                                <th class="p-4 font-bold text-slate-600" style="padding:1rem; text-align:left; color:#475569">Ürün</th>
                                <th class="p-4 font-bold text-slate-600 text-center" style="padding:1rem; text-align:center; color:#475569">Miktar</th>
                                <th class="p-4 font-bold text-slate-600" style="padding:1rem; text-align:left; color:#475569">Detay (Nereden -> Nereye)</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${filteredTxns.map(t => {
            const p = products.find(prod => prod.id === t.productId) || { name: '?', code: '?' };
            const badgeStyle = t.type === 'INBOUND' ? 'bg-green-100 text-green-700' : t.type === 'OUTBOUND' ? 'bg-red-100 text-red-700' : t.type === 'TRANSFER' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700';

            return `
                                <tr class="hover:bg-slate-50" style="border-bottom:1px solid #f1f5f9">
                                    <td class="p-4" style="padding:1rem">
                                        <div class="font-semibold text-slate-700" style="font-weight:600; color:#334155">${new Date(t.date).toLocaleDateString()}</div>
                                        <div class="text-xs text-slate-400" style="font-size:0.75rem; color:#94a3b8">${t.user}</div>
                                    </td>
                                    <td class="p-4" style="padding:1rem">
                                        <span class="${badgeStyle} px-2 py-1 rounded text-xs font-bold flex items-center w-max gap-1" style="padding:0.25rem 0.5rem; border-radius:0.25rem; font-size:0.75rem; font-weight:700; width:max-content; display:flex; gap:0.25rem">
                                            ${t.type}
                                        </span>
                                    </td>
                                    <td class="p-4" style="padding:1rem">
                                        <div class="font-bold text-slate-800" style="font-weight:700; color:#1e293b">${p.name}</div>
                                    </td>
                                    <td class="p-4 text-center font-mono font-bold text-lg" style="padding:1rem; text-align:center; font-family:monospace; font-weight:700; font-size:1.125rem">
                                        ${t.type === 'OUTBOUND' ? '-' : '+'}${Math.abs(t.quantity)}
                                    </td>
                                    <td class="p-4 text-sm text-slate-600" style="padding:1rem; font-size:0.875rem; color:#475569">
                                        ${t.type === 'INBOUND' ? `Giriş -> <b>${t.toLocation}</b>` : t.type === 'OUTBOUND' ? `<b>${t.fromLocation}</b> -> Çıkış` : `<b>${t.fromLocation}</b> -> <b>${t.toLocation}</b>`}
                                    </td>
                                </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        c.innerHTML = `
            ${renderHeader()}
            <main class="flex-1 p-6 overflow-auto" style="padding:1.5rem">
                ${renderFilters()}
                ${activeTab === 'VIEW' ? renderMatrix() : renderOps()}
            </main>
        `;

        if (window.lucide) window.lucide.createIcons();
    },

    setTab: (t) => { StockModule.state.activeTab = t; UI.renderCurrentPage(); },
    setLoc: (l) => { StockModule.state.activeLocation = l; UI.renderCurrentPage(); },
    setSearch: (s) => { StockModule.state.searchQuery = s; UI.renderCurrentPage(); },

    openOpModal: () => {
        const LOCS = [
            { id: 'MAIN', label: 'ANA DEPO' },
            { id: 'EKSTRÜZYON', label: 'EKSTRÜZYON' },
            { id: 'CNC', label: 'CNC' },
            { id: 'TESTERE', label: 'TESTERE' },
            { id: 'PLEKSİ', label: 'PLEKSİ POLİSAJ' },
            { id: 'PUNTA', label: 'PUNTA' },
            { id: 'PAKETLEME', label: 'PAKETLEME' },
        ];
        const products = DB.data.data.products;

        Modal.open('Yeni Depo İşlemi', `
            <div style="display:flex; gap:0.5rem; margin-bottom:1.5rem; background:#f8fafc; padding:0.25rem; border-radius:0.5rem">
                <button onclick="StockModule.setOpType('INBOUND')" id="btn_op_INBOUND" class="op-btn" style="flex:1; padding:0.5rem; border-radius:0.5rem; border:none; cursor:pointer; font-weight:700; font-size:0.75rem">GİRİŞ</button>
                <button onclick="StockModule.setOpType('TRANSFER')" id="btn_op_TRANSFER" class="op-btn" style="flex:1; padding:0.5rem; border-radius:0.5rem; border:none; cursor:pointer; font-weight:700; font-size:0.75rem">TRANSFER</button>
                <button onclick="StockModule.setOpType('OUTBOUND')" id="btn_op_OUTBOUND" class="op-btn" style="flex:1; padding:0.5rem; border-radius:0.5rem; border:none; cursor:pointer; font-weight:700; font-size:0.75rem">ÇIKIŞ</button>
            </div>

            <div style="display:flex; flex-direction:column; gap:1rem">
                <div>
                    <label style="display:block; font-size:0.875rem; font-weight:700; color:#334155; margin-bottom:0.25rem">Ürün Seçimi</label>
                    <select id="op_prod" class="form-input" style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:0.5rem">
                        <option value="">Seçiniz</option>
                        ${products.map(p => `<option value="${p.id}">${p.code} - ${p.name}</option>`).join('')}
                    </select>
                </div>

                <div>
                    <label style="display:block; font-size:0.875rem; font-weight:700; color:#334155; margin-bottom:0.25rem">Miktar</label>
                    <input id="op_qty" type="number" class="form-input" style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:0.5rem; font-weight:700; font-size:1.1rem">
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem">
                    <div id="div_from">
                        <label style="display:block; font-size:0.875rem; font-weight:700; color:#334155; margin-bottom:0.25rem">Çıkış Yeri</label>
                        <select id="op_from" class="form-input" style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:0.5rem">
                             ${LOCS.map(l => `<option value="${l.id}">${l.label}</option>`).join('')}
                        </select>
                    </div>
                    <div id="div_to">
                         <label style="display:block; font-size:0.875rem; font-weight:700; color:#334155; margin-bottom:0.25rem">Giriş/Hedef Yeri</label>
                        <select id="op_to" class="form-input" style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:0.5rem">
                             ${LOCS.map(l => `<option value="${l.id}">${l.label}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <button class="btn-primary" style="width:100%; padding:1rem; margin-top:1rem" onclick="StockModule.saveOp()">İşlemi Onayla</button>
            </div>
        `);
        StockModule.setOpType('INBOUND');
    },

    setOpType: (t) => {
        StockModule.currOp = t;
        document.querySelectorAll('.op-btn').forEach(b => {
            b.style.background = 'transparent'; b.style.color = '#94a3b8'; b.style.boxShadow = 'none';
        });
        const btn = document.getElementById(`btn_op_${t}`);
        if (btn) { btn.style.background = 'white'; btn.style.color = '#2563eb'; btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; }

        if (t === 'INBOUND') {
            document.getElementById('div_from').style.display = 'none';
            document.getElementById('div_to').style.display = 'block';
        } else if (t === 'OUTBOUND') {
            document.getElementById('div_from').style.display = 'block';
            document.getElementById('div_to').style.display = 'none';
        } else {
            document.getElementById('div_from').style.display = 'block';
            document.getElementById('div_to').style.display = 'block';
        }
    },

    saveOp: async () => {
        const type = StockModule.currOp;
        const pid = document.getElementById('op_prod').value;
        const qty = Number(document.getElementById('op_qty').value);
        const from = document.getElementById('op_from').value;
        const to = document.getElementById('op_to').value;

        if (!pid || qty <= 0) return alert("Hatalı giriş.");

        const txn = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            productId: pid,
            type,
            quantity: qty,
            user: 'Demo User',
            fromLocation: (type === 'OUTBOUND' || type === 'TRANSFER') ? from : undefined,
            toLocation: (type === 'INBOUND' || type === 'TRANSFER') ? to : undefined
        };

        DB.data.data.stock_movements.push(txn);
        await DB.save();
        Modal.close();

        // Refresh
        StockModule.render(document.getElementById('main-content'));
    }
};

const Modal = {
    open: (t, h) => {
        const d = document.createElement('div'); d.className = 'modal-overlay'; d.id = 'm';
        d.innerHTML = `<div class="modal-box">
            <div style="display:flex; justify-content:space-between; margin-bottom:1.5rem">
                <h3 style="margin:0; font-size:1.25rem">${t}</h3>
                <button onclick="Modal.close()" style="border:none; background:none; font-size:1.5rem; cursor:pointer">&times;</button>
            </div>
            <div>${h}</div>
        </div>`;
        document.body.appendChild(d);
    },
    close: () => document.getElementById('m')?.remove()
};

window.addEventListener('DOMContentLoaded', App.init);

// --- ALUMINUM MODULE ---
// AluminumModule moved to aluminum_module_v2.js
