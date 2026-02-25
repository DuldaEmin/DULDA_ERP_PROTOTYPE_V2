const UnitModule = {
    state: {
        activeUnitId: null,
        view: 'list', // view: list | dashboard | machines | stock | personnel | cncLibrary | sawCut | unitLibraryEmpty
        stockTab: 'ROD',
        selectedCncCardId: null,
        cncSearchName: '',
        cncSearchId: '',
        cncFormOpen: false,
        cncEditingId: null,
        cncDraftId: null,
        cncDraftOperations: [],
        cncDraftDrawing: null,
        sawSourceFilter: 'ALL',
        sawSearchName: '',
        sawSearchCode: '',
        sawSearchLen: '',
        sawMaterialSearchName: '',
        sawMaterialSearchCode: '',
        sawSelectedKey: null,
        sawSelectedOrderId: null,
        sawCutLen: '',
        sawAlias: '',
        sawNote: '',
        sawFormOpen: false,
        sawEditingId: null,
        sawDraftAttachment: null
    },

    render: (container) => {
        const { view, activeUnitId } = UnitModule.state;

        if (!DB.data.data.inventory) DB.data.data.inventory = [];
        if (!DB.data.data.cncCards) DB.data.data.cncCards = [];

        // Seed Data 
        if (!DB.data.data.units || DB.data.data.units.length === 0) {
            DB.data.data.units = [
                { id: 'u1', name: 'CNC ATÖLYESİ', type: 'internal' },
                { id: 'u2', name: 'EKSTRÜDER ATÖLYESİ', type: 'internal' },
                { id: 'u3', name: 'MONTAJ', type: 'internal' },
                { id: 'u4', name: 'PAKETLEME', type: 'internal' },
                { id: 'u5', name: 'PLEKSİ POLİSAJ ATÖLYESİ', type: 'internal' },
                { id: 'u7', name: 'TESTERE ATÖLYESİ', type: 'internal' },
                { id: 'u8', name: 'AKPA ALÜMİNYUM A.Ş', type: 'external' },
                { id: 'u9', name: 'HİLAL PWD', type: 'external' },
                { id: 'u10', name: 'İBRAHİM POLİSAJ', type: 'external' },
                { id: 'u11', name: 'TEKİN ELOKSAL', type: 'external' }
            ];
            if (DB.fileHandle) DB.save();
        }

        // Punta atolyesi artik kullanilmiyor; eski kayitlardan da temizle.
        const puntaIds = (DB.data.data.units || [])
            .filter(u => String(u?.name || '').toUpperCase().includes('PUNTA AT'))
            .map(u => u.id);
        if (puntaIds.length > 0) {
            DB.data.data.units = (DB.data.data.units || []).filter(u => !puntaIds.includes(u.id));
            if (Array.isArray(DB.data.data.machines)) {
                DB.data.data.machines = DB.data.data.machines.filter(m => !puntaIds.includes(m.unitId));
            }
            if (UnitModule.state.activeUnitId && puntaIds.includes(UnitModule.state.activeUnitId)) {
                UnitModule.state.activeUnitId = null;
                UnitModule.state.view = 'list';
            }
            DB.markDirty();
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
        } else if (view === 'cncLibrary') {
            UnitModule.renderCncLibrary(container, activeUnitId);
        } else if (view === 'sawCut') {
            UnitModule.renderSawCut(container, activeUnitId);
        } else if (view === 'unitLibraryEmpty') {
            UnitModule.renderUnitLibraryPlaceholder(container, activeUnitId);
        }
    },

    openUnit: (id) => { UnitModule.state.activeUnitId = id; UnitModule.state.view = 'dashboard'; UI.renderCurrentPage(); },
    openMachines: (id) => { if (id) UnitModule.state.activeUnitId = id; UnitModule.state.view = 'machines'; UI.renderCurrentPage(); },
    openStock: (id) => { if (id) UnitModule.state.activeUnitId = id; UnitModule.state.view = 'stock'; UnitModule.state.stockTab = 'ROD'; UI.renderCurrentPage(); },
    openPersonnel: (id) => { if (id) UnitModule.state.activeUnitId = id; UnitModule.state.view = 'personnel'; UI.renderCurrentPage(); },
    openCncLibrary: (id) => {
        UnitModule.state.activeUnitId = id;
        UnitModule.state.view = 'cncLibrary';
        UnitModule.state.selectedCncCardId = null;
        UnitModule.state.cncFormOpen = false;
        UnitModule.state.cncEditingId = null;
        UnitModule.state.cncDraftId = null;
        UnitModule.state.cncDraftOperations = [];
        UnitModule.state.cncDraftDrawing = null;
        if (typeof CncLibraryModule !== 'undefined') {
            CncLibraryModule.state.searchName = '';
            CncLibraryModule.state.searchId = '';
            CncLibraryModule.state.selectedId = null;
            CncLibraryModule.state.formOpen = false;
            CncLibraryModule.state.editingId = null;
            CncLibraryModule.state.draftId = null;
            CncLibraryModule.state.draftOperations = [];
            CncLibraryModule.state.draftDrawing = null;
        }
        UI.renderCurrentPage();
    },
    openSawCut: (id) => {
        UnitModule.state.activeUnitId = id;
        UnitModule.state.view = 'sawCut';
        UnitModule.state.sawSourceFilter = 'ALL';
        UnitModule.state.sawSearchName = '';
        UnitModule.state.sawSearchCode = '';
        UnitModule.state.sawSearchLen = '';
        UnitModule.state.sawMaterialSearchName = '';
        UnitModule.state.sawMaterialSearchCode = '';
        UnitModule.state.sawSelectedKey = null;
        UnitModule.state.sawSelectedOrderId = null;
        UnitModule.state.sawCutLen = '';
        UnitModule.state.sawAlias = '';
        UnitModule.state.sawNote = '';
        UnitModule.state.sawFormOpen = false;
        UnitModule.state.sawEditingId = null;
        UnitModule.state.sawDraftAttachment = null;
        UI.renderCurrentPage();
    },
    openUnitLibrary: (id) => {
        const unit = (DB.data.data.units || []).find(u => u.id === id);
        const unitName = String(unit?.name || '').toUpperCase();
        if (unitName.includes('CNC')) {
            UnitModule.openCncLibrary(id);
            return;
        }
        if (unitName.includes('TESTERE')) {
            UnitModule.openSawCut(id);
            return;
        }
        UnitModule.state.activeUnitId = id;
        UnitModule.state.view = 'unitLibraryEmpty';
        UI.renderCurrentPage();
    },
    setStockTab: (t) => { UnitModule.state.stockTab = t; UI.renderCurrentPage(); },


    renderList: (container) => {
        const units = DB.data.data.units;
        const internals = units.filter(u => u.type === 'internal');
        const externals = units.filter(u => u.type === 'external');
        const canManage = UnitModule.isSuperAdmin();
        const badgeStyles = {
            u1: { bg: '#dbeafe', fg: '#1d4ed8' },
            u2: { bg: '#dcfce7', fg: '#15803d' },
            u3: { bg: '#ede9fe', fg: '#6d28d9' },
            u4: { bg: '#fee2e2', fg: '#b91c1c' },
            u5: { bg: '#fce7f3', fg: '#be185d' },
            u7: { bg: '#fef3c7', fg: '#b45309' },
            u8: { bg: '#ffedd5', fg: '#c2410c' },
            u9: { bg: '#ffedd5', fg: '#ea580c' },
            u10: { bg: '#fed7aa', fg: '#9a3412' },
            u11: { bg: '#fde68a', fg: '#92400e' },
        };
        const getUnitInitials = (name) => {
            const raw = String(name || '');
            const words = raw
                .replace(/[^A-Za-z0-9\u00C7\u011E\u0130\u00D6\u015E\u00DC\u00E7\u011F\u0131\u00F6\u015F\u00FC\s]/g, ' ')
                .split(/\s+/)
                .filter(Boolean);
            const skip = new Set(['AT\u00D6LYES\u0130', 'ATOLYESI', 'A', '\u015E', 'AS']);
            const filtered = words.filter(w => !skip.has(w.toLocaleUpperCase('tr-TR')));
            const src = filtered.length > 0 ? filtered : words;
            if (src.length === 0) return '??';
            if (src.length === 1) {
                const w = src[0].toLocaleUpperCase('tr-TR');
                return (w[0] || '?') + (w[1] || w[0] || '?');
            }
            return (src[0][0] + src[1][0]).toLocaleUpperCase('tr-TR');
        };
        const renderCard = (u) => {
            const palette = badgeStyles[u.id] || (u.type === 'internal'
                ? { bg: '#eff6ff', fg: '#2563eb' }
                : { bg: '#fff7ed', fg: '#ea580c' });
            const initials = getUnitInitials(u.name);
            return `
            <div class="app-card" style="padding:1.5rem; position:relative; cursor:pointer;" onclick="UnitModule.openUnit('${u.id}')">
                ${canManage ? `
                <div style="position:absolute; top:0.75rem; right:0.75rem; display:flex; gap:0.35rem;">
                    <button class="btn-sm" title="Birim duzenle" style="padding:0.35rem 0.45rem; display:flex; align-items:center; justify-content:center; color:#94a3b8; opacity:0.8; background:#f8fafc; border-color:#dbe3ee;" onclick="event.stopPropagation(); UnitModule.openUnitEditModal('${u.id}')">
                        <i data-lucide="pencil" width="14" height="14"></i>
                    </button>
                    <button class="btn-sm" title="Birimi sil" style="padding:0.35rem 0.45rem; color:#f87171; opacity:0.8; background:#fffafb; border-color:#f3d4d8; display:flex; align-items:center; justify-content:center;" onclick="event.stopPropagation(); UnitModule.deleteUnit('${u.id}')">
                        <i data-lucide="trash-2" width="14" height="14"></i>
                    </button>
                </div>
                ` : ''}
                <div style="width:3.25rem; height:3.25rem; border-radius:0.95rem; margin:0 auto 1rem; background:${palette.bg}; color:${palette.fg}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.95rem; letter-spacing:0.04em; box-shadow:0 8px 16px -10px rgba(15,23,42,0.35); border:1px solid rgba(255,255,255,0.7)">${initials}</div>
                <div style="font-weight:700; color:#334155; font-size:0.9rem">${u.name}</div>
            </div>
        `;
        };
        container.innerHTML = `
            <div class="page-header"><h2 class="page-title">Birimler</h2></div>
            <h3 style="margin:1.5rem 0; color:#334155; padding-left:0.5rem">&#304;&ccedil; Birimler</h3>
            <div class="apps-grid" style="margin-bottom:3rem;">${internals.map(u => renderCard(u)).join('')}</div>
            <h3 style="margin:1.5rem 0; color:#334155; padding-left:0.5rem">D&#305;&#351; Birimler</h3>
            <div class="apps-grid">${externals.map(u => renderCard(u)).join('')}</div>
        `;
    },
    renderUnitDashboard: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);
        const isExternalUnit = unit?.type === 'external';
        const productLibraryCard = `
            <a href="#" onclick="UnitModule.openUnitLibrary('${unitId}')" class="app-card">
                <div class="icon-box" style="background:linear-gradient(135deg,#bfdbfe,#7dd3fc); color:#1d4ed8"><i data-lucide="library" width="40" height="40"></i></div>
                <div class="app-name">&#220;r&#252;n K&#252;t&#252;phanesi</div>
            </a>
        `;
        if (isExternalUnit) {
            container.innerHTML = `
                <div class="page-header">
                     <h2 class="page-title">${unit.name}</h2>
                </div>
                <div class="apps-grid">
                    ${productLibraryCard}
                </div>
            `;
            return;
        }
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
                    <div class="app-name">Birim Sto&#287;u</div>
                </a>
                ${productLibraryCard}
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

    renderUnitLibraryPlaceholder: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);
        container.innerHTML = `
            <div style="margin-bottom:1.25rem; display:flex; justify-content:space-between; align-items:center">
                <div style="display:flex; align-items:center; gap:1rem">
                    <button onclick="UnitModule.openUnit('${unitId}')" style="background:white; padding:0.5rem; border-radius:0.5rem; border:1px solid #e2e8f0; cursor:pointer"><i data-lucide="arrow-left" width="20"></i></button>
                    <div>
                        <h2 class="page-title" style="margin:0; display:flex; align-items:center; gap:0.5rem"><i data-lucide="library" color="#1d4ed8"></i> &#220;r&#252;n K&#252;t&#252;phanesi</h2>
                        <div style="font-size:0.875rem; color:#64748b">${unit?.name || ''} • Bu birim için modül henüz tanımlanmadı.</div>
                    </div>
                </div>
            </div>
            <div class="card-table" style="padding:2rem; text-align:center; color:#94a3b8">
                <div style="font-weight:700; color:#475569; margin-bottom:0.5rem">Boş Sayfa</div>
                <div style="font-size:0.9rem">Bu birimin ürün ekleme modülü daha sonra eklenecek.</div>
            </div>
        `;
    },
    renderCncLibrary: (container, unitId) => {
        CncLibraryModule.render(container, unitId);
    },

    getSawMaterials: () => {
        const extruderProducts = (DB.data.data.products || []).filter(p => {
            const category = String(p?.category || '').toUpperCase();
            const type = String(p?.type || '').toUpperCase();
            return category.includes('EKSTR') || type === 'ROD' || type === 'PIPE';
        }).map(p => {
            let title = p?.name || 'Ekstruder urunu';
            if (p?.specs) {
                const dia = p.specs.diameter ?? '-';
                const len = p.specs.length ?? '-';
                const surf = p.specs.surface ? ` / ${p.specs.surface}` : '';
                const thick = p.specs.thickness ? ` / ${p.specs.thickness} mm` : '';
                const color = p.specs.color ? ` / ${p.specs.color}` : '';
                title = `Cap ${dia} mm / boy ${len} mm${thick}${surf}${color}`;
            }
            return {
                key: `ext-${p.id}`,
                source: 'EKSTRUDER',
                materialId: p.id,
                code: p.code || p.id?.slice?.(0, 8) || '-',
                name: title,
                previewImage: p.image || p.imageUrl || null,
                previewPdf: p.pdf || p.pdfUrl || p.pdfDataUrl || p.drawingPdf || null
            };
        });

        const aluminumProfiles = (DB.data.data.aluminumProfiles || []).map(p => {
            const surface = p.anodizedColor ? `${p.anodizedColor} eloksal` : (p.paintColor ? `${p.paintColor} boya` : 'hams');
            return {
                key: `alu-${p.id}`,
                source: 'ALUMINYUM PROFIL',
                materialId: p.id,
                code: p.code || p.id?.slice?.(0, 8) || '-',
                name: `${p.name || 'Profil'} / ${surface} / ${p.length || '-'} mm`,
                previewImage: p.image || p.imageUrl || null,
                previewPdf: p.pdf || p.pdfUrl || p.pdfDataUrl || p.drawingPdf || null
            };
        });

        return [...extruderProducts, ...aluminumProfiles];
    },

    renderSawCut: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);
        const allMaterials = UnitModule.getSawMaterials();
        const showForm = UnitModule.state.sawFormOpen || !!UnitModule.state.sawEditingId;

        const rows = (DB.data.data.sawCutOrders || []).filter(x => x.unitId === unitId).sort((a, b) => {
            return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
        });
        const nameQuery = String(UnitModule.state.sawSearchName || '').trim().toLowerCase();
        const codeQuery = String(UnitModule.state.sawSearchCode || '').trim().toLowerCase();
        const lenQuery = String(UnitModule.state.sawSearchLen || '').trim();
        const filteredRows = rows.filter(r => {
            const display = r.alias ? `${r.alias} / ${r.materialName}` : r.materialName;
            if (nameQuery && !display.toLowerCase().includes(nameQuery)) return false;
            if (codeQuery && !String(r.materialCode || '').toLowerCase().includes(codeQuery)) return false;
            if (lenQuery && String(r.cutLengthMm || '') !== lenQuery) return false;
            return true;
        });

        const source = UnitModule.state.sawSourceFilter || 'ALL';
        const matNameQuery = String(UnitModule.state.sawMaterialSearchName || '').trim().toLowerCase();
        const matCodeQuery = String(UnitModule.state.sawMaterialSearchCode || '').trim().toLowerCase();
        const filteredMaterials = allMaterials.filter(m => {
            if (source === 'EXTRUDER' && m.source !== 'EKSTRUDER') return false;
            if (source === 'ALUMINUM' && m.source !== 'ALUMINYUM PROFIL') return false;
            if (matNameQuery && !String(m.name || '').toLowerCase().includes(matNameQuery)) return false;
            if (matCodeQuery && !String(m.code || '').toLowerCase().includes(matCodeQuery)) return false;
            return true;
        });
        const draftAttachment = UnitModule.state.sawDraftAttachment;

        container.innerHTML = `
            <div style="margin-bottom:1.25rem; display:flex; justify-content:space-between; align-items:center">
                <div style="display:flex; align-items:center; gap:1rem">
                    <button onclick="UnitModule.openUnit('${unitId}')" style="background:white; padding:0.5rem; border-radius:0.5rem; border:1px solid #e2e8f0; cursor:pointer"><i data-lucide="arrow-left" width="20"></i></button>
                    <div>
                        <h2 class="page-title" style="margin:0; display:flex; align-items:center; gap:0.5rem"><i data-lucide="scissors" color="#047857"></i> &#220;r&#252;n K&#252;t&#252;phanesi</h2>
                        <div style="font-size:0.875rem; color:#64748b">${unit?.name || 'TESTERE'} • Kayitlar burada listelenir</div>
                    </div>
                </div>
                <button class="btn-primary" onclick="UnitModule.openSawForm()" style="height:42px; padding:0 1rem">${showForm ? 'Vazgeç' : 'Ürün ekle +'}</button>
            </div>

            <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.75rem; margin-bottom:0.75rem; display:grid; grid-template-columns: 1fr 1fr 1fr; gap:0.6rem">
                <input id="saw_list_name" value="${UnitModule.state.sawSearchName || ''}" oninput="UnitModule.setSawListFilter('name', this.value, 'saw_list_name')" placeholder="isimle ara" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.55rem 0.75rem; font-weight:600; color:#334155">
                <input id="saw_list_code" value="${UnitModule.state.sawSearchCode || ''}" oninput="UnitModule.setSawListFilter('code', this.value, 'saw_list_code')" placeholder="ID / kod ile ara" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.55rem 0.75rem; font-weight:600; color:#334155">
                <input id="saw_list_len" value="${UnitModule.state.sawSearchLen || ''}" oninput="UnitModule.setSawListFilter('len', this.value, 'saw_list_len')" placeholder="boy ile ara" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.55rem 0.75rem; font-weight:600; color:#334155">
            </div>

            <div id="saw_list_block" class="card-table" style="margin-bottom:1rem">
                <table>
                    <thead>
                        <tr>
                            <th>URUN ISMI</th>
                            <th style="font-family:monospace">KOD</th>
                            <th style="text-align:center">BOY (mm)</th>
                            <th style="text-align:center">DUZENLE</th>
                            <th style="text-align:right">SEC</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredRows.length === 0 ? `<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:#94a3b8">Eklenmis urun yok.</td></tr>` : filteredRows.map(r => `
                            <tr style="${UnitModule.state.sawSelectedOrderId === r.id ? 'background:#f0f9ff' : ''}">
                                <td style="font-weight:600; color:#334155">${r.alias ? `${r.alias} / ${r.materialName}` : r.materialName}</td>
                                <td style="font-family:monospace; color:#64748b">${r.materialCode || '-'}</td>
                                <td style="text-align:center; font-weight:700; color:#0f766e">${r.cutLengthMm}</td>
                                <td style="text-align:center">
                                    <button class="btn-sm" onclick="UnitModule.editSawRow('${r.id}')">duzenle</button>
                                </td>
                                <td style="text-align:right">
                                    <button class="btn-sm" onclick="UnitModule.selectSawRow('${r.id}')" style="${UnitModule.state.sawSelectedOrderId === r.id ? 'background:#0f172a; color:white; border-color:#0f172a' : ''}">sec</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            ${showForm ? `
            <div id="saw_form_block" style="background:white; border:2px solid #e2e8f0; border-radius:1rem; padding:1rem">
                <div style="display:grid; grid-template-columns: 1fr 300px; gap:1rem; margin-bottom:1rem">
                    <div>
                        <div style="display:flex; gap:0.6rem; margin-bottom:0.6rem">
                            <button class="btn-sm" onclick="UnitModule.setSawSourceFilter('EXTRUDER')" style="padding:0.7rem 1rem; ${source === 'EXTRUDER' ? 'background:#0f172a; color:white; border-color:#0f172a' : ''}">ekstruder</button>
                            <button class="btn-sm" onclick="UnitModule.setSawSourceFilter('ALUMINUM')" style="padding:0.7rem 1rem; ${source === 'ALUMINUM' ? 'background:#93c5fd; color:#0f172a; border-color:#60a5fa' : ''}">aluminyum profil</button>
                        </div>
                        <div style="display:flex; gap:0.6rem; margin-bottom:0.6rem">
                            <input id="saw_mat_name" value="${UnitModule.state.sawMaterialSearchName || ''}" oninput="UnitModule.setSawMaterialFilter('name', this.value, 'saw_mat_name')" placeholder="isim ile ara" style="flex:1; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.55rem 0.75rem; font-weight:600; color:#334155">
                            <input id="saw_mat_code" value="${UnitModule.state.sawMaterialSearchCode || ''}" oninput="UnitModule.setSawMaterialFilter('code', this.value, 'saw_mat_code')" placeholder="kod ile ara" style="flex:1; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.55rem 0.75rem; font-weight:600; color:#334155">
                        </div>
                    </div>
                    <div style="border:1px dashed #94a3b8; border-radius:1rem; padding:0.9rem; display:flex; flex-direction:column; gap:0.5rem; justify-content:center">
                        <label style="font-weight:700; color:#334155; font-size:0.85rem">dosya ekle (opsiyonel)</label>
                        <input id="saw_file" type="file" accept=".pdf,image/*" onchange="UnitModule.handleSawAttachment(this)" style="font-size:0.8rem">
                        <div style="font-size:0.78rem; color:#64748b">${draftAttachment?.name || 'Dosya secilmedi'}</div>
                        <div style="display:flex; gap:0.4rem">
                            <button class="btn-sm" onclick="UnitModule.previewSawAttachment()" ${draftAttachment ? '' : 'disabled'}>gor</button>
                            <button class="btn-sm" onclick="UnitModule.clearSawAttachment()" ${draftAttachment ? '' : 'disabled'}>kaldir</button>
                        </div>
                    </div>
                </div>

                <div class="card-table" style="margin-bottom:1rem">
                    <table>
                        <thead>
                            <tr>
                                <th>KAYNAK</th>
                                <th>MALZEME</th>
                                <th style="font-family:monospace">KOD</th>
                                <th style="text-align:center">ONIZLEME</th>
                                <th style="text-align:right">ISLEM</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredMaterials.length === 0 ? `<tr><td colspan="5" style="text-align:center; padding:1rem; color:#94a3b8">Malzeme bulunamadi.</td></tr>` : filteredMaterials.map(m => `
                                <tr style="${UnitModule.state.sawSelectedKey === m.key ? 'background:#ecfeff' : ''}">
                                    <td><span style="font-size:0.72rem; font-weight:700; color:#475569; background:#f8fafc; border:1px solid #e2e8f0; padding:0.25rem 0.55rem; border-radius:0.5rem">${m.source}</span></td>
                                    <td style="font-weight:600; color:#334155">${m.name}</td>
                                    <td style="font-family:monospace; color:#64748b">${m.code}</td>
                                    <td style="text-align:center">
                                        ${(m.previewImage || m.previewPdf) ? `<button class="btn-sm" onclick="UnitModule.previewSawMaterial('${m.key}')">gor</button>` : `<span style="color:#cbd5e1">-</span>`}
                                    </td>
                                    <td style="text-align:right">
                                        <button class="btn-sm" onclick="UnitModule.selectSawMaterial('${m.key}')" style="${UnitModule.state.sawSelectedKey === m.key ? 'background:#16a34a; color:white; border-color:#16a34a' : ''}">${UnitModule.state.sawSelectedKey === m.key ? 'secili' : 'sec'}</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.7rem; margin-bottom:0.8rem">
                    <input id="saw_alias" value="${UnitModule.state.sawAlias || ''}" oninput="UnitModule.state.sawAlias=this.value" placeholder="malzemenin adi (opsiyonel)" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.6rem 0.75rem; font-weight:600; color:#334155">
                    <input id="saw_cut_len" type="number" min="1" value="${UnitModule.state.sawCutLen || ''}" oninput="UnitModule.state.sawCutLen=this.value" placeholder="malzeme boyu mm" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.6rem 0.75rem; font-weight:700; color:#334155">
                </div>
                <textarea id="saw_note" oninput="UnitModule.state.sawNote=this.value" placeholder="not ekle" style="width:100%; min-height:72px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.65rem 0.75rem; color:#334155; font-weight:500">${UnitModule.state.sawNote || ''}</textarea>

                <div style="display:flex; justify-content:flex-end; gap:0.6rem; margin-top:0.8rem">
                    <button class="btn-sm" onclick="UnitModule.resetSawDraft(false)">vazgec</button>
                    <button class="btn-primary" onclick="UnitModule.saveSawCut('${unitId}')">${UnitModule.state.sawEditingId ? 'Degisiklikleri Kaydet' : 'Kaydet'}</button>
                </div>
            </div>
            ` : ''}
        `;

        // UI rule: form always opens above list rows.
        if (showForm) {
            const formEl = document.getElementById('saw_form_block');
            const listEl = document.getElementById('saw_list_block');
            if (formEl && listEl && listEl.parentElement) {
                listEl.parentElement.insertBefore(formEl, listEl);
            }
        }
    },

    openSawForm: () => {
        if (UnitModule.state.sawFormOpen || UnitModule.state.sawEditingId) {
            UnitModule.resetSawDraft(false);
            return;
        }
        UnitModule.state.sawFormOpen = true;
        UnitModule.state.sawEditingId = null;
        UI.renderCurrentPage();
    },

    setSawSourceFilter: (value) => {
        UnitModule.state.sawSourceFilter = value;
        UI.renderCurrentPage();
    },

    setSawListFilter: (field, value, focusId) => {
        if (field === 'name') UnitModule.state.sawSearchName = value;
        if (field === 'code') UnitModule.state.sawSearchCode = value;
        if (field === 'len') UnitModule.state.sawSearchLen = value;
        UI.renderCurrentPage();
        if (!focusId) return;
        setTimeout(() => {
            const el = document.getElementById(focusId);
            if (!el) return;
            el.focus();
            const len = el.value.length;
            try { el.setSelectionRange(len, len); } catch (_) { }
        }, 0);
    },

    setSawMaterialFilter: (field, value, focusId) => {
        if (field === 'name') UnitModule.state.sawMaterialSearchName = value;
        if (field === 'code') UnitModule.state.sawMaterialSearchCode = value;
        UI.renderCurrentPage();
        if (!focusId) return;
        setTimeout(() => {
            const el = document.getElementById(focusId);
            if (!el) return;
            el.focus();
            const len = el.value.length;
            try { el.setSelectionRange(len, len); } catch (_) { }
        }, 0);
    },

    selectSawMaterial: (key) => {
        UnitModule.state.sawSelectedKey = key;
        UI.renderCurrentPage();
    },

    selectSawRow: (id) => {
        UnitModule.state.sawSelectedOrderId = id;
        UI.renderCurrentPage();
    },

    editSawRow: (id) => {
        const row = (DB.data.data.sawCutOrders || []).find(x => x.id === id);
        if (!row) return;
        const materials = UnitModule.getSawMaterials();
        const match = materials.find(m => m.materialId === row.materialId && m.source === row.source);

        UnitModule.state.sawFormOpen = true;
        UnitModule.state.sawEditingId = id;
        UnitModule.state.sawSelectedOrderId = id;
        UnitModule.state.sawSourceFilter = row.source === 'ALUMINYUM PROFIL' ? 'ALUMINUM' : 'EXTRUDER';
        UnitModule.state.sawSelectedKey = match?.key || null;
        UnitModule.state.sawCutLen = String(row.cutLengthMm || '');
        UnitModule.state.sawAlias = row.alias || '';
        UnitModule.state.sawNote = row.note || '';
        UnitModule.state.sawDraftAttachment = row.customAttachment || null;
        UI.renderCurrentPage();
    },

    handleSawAttachment: (input) => {
        const file = input?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            UnitModule.state.sawDraftAttachment = {
                name: file.name,
                type: file.type || '',
                dataUrl: String(reader.result || '')
            };
            UI.renderCurrentPage();
        };
        reader.readAsDataURL(file);
    },

    clearSawAttachment: () => {
        UnitModule.state.sawDraftAttachment = null;
        UI.renderCurrentPage();
    },

    previewSawAttachment: () => {
        const att = UnitModule.state.sawDraftAttachment;
        if (!att?.dataUrl) return;
        if (String(att.type || '').startsWith('image/')) {
            Modal.open('Dosya onizleme', `
                <div style="display:flex; justify-content:center; align-items:center">
                    <img src="${att.dataUrl}" style="max-width:100%; max-height:75vh; object-fit:contain; border:1px solid #e2e8f0; border-radius:0.5rem">
                </div>
            `, { maxWidth: '1000px' });
            return;
        }
        UnitModule.openSawPdf(att.dataUrl);
    },

    saveSawCut: async (unitId) => {
        const selected = UnitModule.getSawMaterials().find(m => m.key === UnitModule.state.sawSelectedKey);
        const lenVal = Number(UnitModule.state.sawCutLen);
        if (!selected) return alert('Lutfen bir malzeme seciniz.');
        if (!lenVal || lenVal <= 0) return alert('Lutfen malzeme boyu giriniz.');

        const alias = String(UnitModule.state.sawAlias || '').trim();
        const note = String(UnitModule.state.sawNote || '').trim();

        if (!Array.isArray(DB.data.data.sawCutOrders)) DB.data.data.sawCutOrders = [];

        if (UnitModule.state.sawEditingId) {
            const row = DB.data.data.sawCutOrders.find(x => x.id === UnitModule.state.sawEditingId);
            if (row) {
                row.source = selected.source;
                row.materialKey = selected.key;
                row.materialId = selected.materialId;
                row.materialCode = selected.code;
                row.materialName = selected.name;
                row.alias = alias || '';
                row.note = note || '';
                row.cutLengthMm = lenVal;
                row.customAttachment = UnitModule.state.sawDraftAttachment || null;
                row.updated_at = new Date().toISOString();
            }
            UnitModule.state.sawSelectedOrderId = UnitModule.state.sawEditingId;
        } else {
            const rowId = crypto.randomUUID();
            DB.data.data.sawCutOrders.push({
                id: rowId,
                unitId,
                source: selected.source,
                materialKey: selected.key,
                materialId: selected.materialId,
                materialCode: selected.code,
                materialName: selected.name,
                alias: alias || '',
                note: note || '',
                cutLengthMm: lenVal,
                customAttachment: UnitModule.state.sawDraftAttachment || null,
                created_at: new Date().toISOString()
            });
            UnitModule.state.sawSelectedOrderId = rowId;
        }

        await DB.save();
        UnitModule.resetSawDraft(false);
    },

    resetSawDraft: (keepOpen = false) => {
        UnitModule.state.sawEditingId = null;
        UnitModule.state.sawSelectedKey = null;
        UnitModule.state.sawCutLen = '';
        UnitModule.state.sawAlias = '';
        UnitModule.state.sawNote = '';
        UnitModule.state.sawMaterialSearchName = '';
        UnitModule.state.sawMaterialSearchCode = '';
        UnitModule.state.sawDraftAttachment = null;
        UnitModule.state.sawFormOpen = !!keepOpen;
        UI.renderCurrentPage();
    },

    previewSawMaterial: (key) => {
        const item = UnitModule.getSawMaterials().find(m => m.key === key);
        if (!item) return;

        if (item.previewImage) {
            Modal.open('Malzeme onizleme', `
                <div style="display:flex; justify-content:center; align-items:center">
                    <img src="${item.previewImage}" style="max-width:100%; max-height:75vh; object-fit:contain; border:1px solid #e2e8f0; border-radius:0.5rem">
                </div>
            `, { maxWidth: '1000px' });
            return;
        }

        if (item.previewPdf) {
            UnitModule.openSawPdf(item.previewPdf);
            return;
        }

        alert('Bu malzeme icin resim/PDF bulunamadi.');
    },

    openSawPdf: (pdfRef) => {
        if (!pdfRef) return;
        if (typeof pdfRef === 'string') {
            const opened = window.open(pdfRef, '_blank');
            if (!opened) alert('Tarayici acilir pencereyi engelledi.');
            return;
        }

        const dataUrl = pdfRef?.dataUrl || pdfRef?.url || null;
        if (!dataUrl) return alert('PDF verisi bulunamadi.');
        const opened = window.open(dataUrl, '_blank');
        if (!opened) alert('Tarayici acilir pencereyi engelledi.');
    },

    renderMachineList: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);
        const machines = (DB.data.data.machines || []).filter(m => m.unitId === unitId);
        const canManage = UnitModule.isSuperAdmin();

        container.innerHTML = `
            <div class="page-header">
                 <h2 class="page-title">${unit.name} > Makineler</h2>
                 <button class="btn-primary" onclick="UnitModule.addMachineModal('${unitId}')" ${canManage ? '' : 'disabled'} style="${canManage ? '' : 'opacity:0.6; cursor:not-allowed;'}">+ Yeni Makine</button>
            </div>
            ${canManage ? '' : `<div style="font-size:0.85rem; color:#94a3b8; margin-bottom:0.8rem;">Makine ekleme / duzenleme sadece super admin icin acik.</div>`}

            <div class="apps-grid">
                ${machines.length === 0 ? '<div style="grid-column:1/-1; text-align:center; padding:3rem; color:#94a3b8">Kayitli makine yok.</div>' : ''}
                ${machines.map(m => `
                    <div class="app-card" style="align-items:flex-start; text-align:left; justify-content:flex-start; padding:1.5rem">
                        <div style="display:flex; justify-content:space-between; width:100%; margin-bottom:1rem">
                            <h4 style="font-weight:700; font-size:1.1rem; margin:0">${m.name}</h4>
                            <span style="font-size:1.5rem">${m.status === 'ACTIVE' ? '<i data-lucide="check-circle" color="#22c55e"></i>' : m.status === 'MAINTENANCE' ? '<i data-lucide="x-circle" color="#ef4444"></i>' : '<i data-lucide="alert-circle" color="#eab308"></i>'}</span>
                        </div>
                        <div style="font-size:0.8rem; color:#64748b; margin-bottom:1.5rem;">Durum: ${m.status}</div>
                        <div style="display:flex; gap:0.5rem; margin-top:auto; width:100%">
                             <button class="btn-sm" style="flex:1" onclick="UnitModule.setMachineStatus('${m.id}','ACTIVE')" ${canManage ? '' : 'disabled'}>Calisiyor</button>
                             <button class="btn-sm" style="flex:1" onclick="UnitModule.setMachineStatus('${m.id}','MAINTENANCE')" ${canManage ? '' : 'disabled'}>Ariza</button>
                        </div>
                        <div style="display:flex; gap:0.5rem; margin-top:0.6rem; width:100%">
                             <button class="btn-sm" style="flex:1; display:flex; align-items:center; justify-content:center; gap:0.35rem" onclick="UnitModule.openMachineEditModal('${m.id}')" ${canManage ? '' : 'disabled'}>
                                <i data-lucide="pencil" width="14" height="14"></i> Duzenle
                             </button>
                             <button class="btn-sm" style="flex:1; color:#dc2626; display:flex; align-items:center; justify-content:center; gap:0.35rem" onclick="UnitModule.deleteMachine('${m.id}')" ${canManage ? '' : 'disabled'}>
                                <i data-lucide="trash-2" width="14" height="14"></i> Sil
                             </button>
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
    openMachines: (id) => { if (id) UnitModule.state.activeUnitId = id; UnitModule.state.view = 'machines'; UI.renderCurrentPage(); },
    openStock: (id) => { if (id) UnitModule.state.activeUnitId = id; UnitModule.state.view = 'stock'; UnitModule.state.stockTab = 'ROD'; UI.renderCurrentPage(); },
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
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        const m = DB.data.data.machines.find(x => x.id === mid);
        if (m) { m.status = status; await DB.save(); UI.renderCurrentPage(); }
    },
    addMachineModal: (uid) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        Modal.open('Makine Ekle', `
            <input id="new_mac_name" class="form-input" placeholder="Makine Adi (Orn: Cnc-2)" style="width:100%; padding:0.8rem; border:1px solid #ccc; border-radius:0.5rem; margin-bottom:1rem">
            <button class="btn-primary" style="width:100%" onclick="UnitModule.saveMachine('${uid}')">Kaydet</button>
        `);
    },
    saveMachine: async (uid) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        const name = document.getElementById('new_mac_name').value;
        if (name) {
            DB.data.data.machines.push({ id: crypto.randomUUID(), unitId: uid, name, status: 'ACTIVE' });
            await DB.save(); Modal.close(); UI.renderCurrentPage();
        }
    },
    openMachineEditModal: (machineId) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        const machine = (DB.data.data.machines || []).find(m => m.id === machineId);
        if (!machine) return;

        Modal.open('Makine Duzenle', `
            <div style="display:flex; flex-direction:column; gap:0.8rem">
                <input id="edit_mac_name" class="form-input" value="${machine.name}" placeholder="Makine Adi" style="width:100%; padding:0.8rem; border:1px solid #ccc; border-radius:0.5rem">
                <select id="edit_mac_status" style="width:100%; padding:0.8rem; border:1px solid #ccc; border-radius:0.5rem">
                    <option value="ACTIVE" ${machine.status === 'ACTIVE' ? 'selected' : ''}>ACTIVE</option>
                    <option value="MAINTENANCE" ${machine.status === 'MAINTENANCE' ? 'selected' : ''}>MAINTENANCE</option>
                    <option value="IDLE" ${machine.status === 'IDLE' ? 'selected' : ''}>IDLE</option>
                </select>
                <button class="btn-primary" style="width:100%" onclick="UnitModule.saveMachineEdit('${machineId}')">Kaydet</button>
            </div>
        `);
    },
    saveMachineEdit: async (machineId) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        const machine = (DB.data.data.machines || []).find(m => m.id === machineId);
        if (!machine) return;

        const name = document.getElementById('edit_mac_name')?.value?.trim() || '';
        const status = document.getElementById('edit_mac_status')?.value || 'IDLE';
        if (!name) {
            alert('Makine adi zorunlu.');
            return;
        }

        machine.name = name;
        machine.status = status;
        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },
    deleteMachine: async (machineId) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        if (!confirm('Bu makine silinsin mi?')) return;

        DB.data.data.machines = (DB.data.data.machines || []).filter(m => m.id !== machineId);
        await DB.save();
        UI.renderCurrentPage();
    },
    openUnitEditModal: (unitId) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        const unit = (DB.data.data.units || []).find(u => u.id === unitId);
        if (!unit) return;

        Modal.open('Birimi Duzenle', `
            <div style="display:flex; flex-direction:column; gap:0.8rem">
                <input id="edit_unit_name" class="form-input" value="${unit.name}" placeholder="Birim adi" style="width:100%; padding:0.8rem; border:1px solid #ccc; border-radius:0.5rem">
                <button class="btn-primary" style="width:100%" onclick="UnitModule.saveUnit('${unitId}')">Kaydet</button>
            </div>
        `);
    },
    saveUnit: async (unitId) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        const unit = (DB.data.data.units || []).find(u => u.id === unitId);
        if (!unit) return;

        const name = document.getElementById('edit_unit_name')?.value?.trim() || '';
        if (!name) {
            alert('Birim adi zorunlu.');
            return;
        }

        unit.name = name.toUpperCase();
        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },
    deleteUnit: async (unitId) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        const unit = (DB.data.data.units || []).find(u => u.id === unitId);
        if (!unit) return;
        if (!confirm(`"${unit.name}" birimi silinsin mi?`)) return;

        DB.data.data.units = (DB.data.data.units || []).filter(u => u.id !== unitId);
        DB.data.data.machines = (DB.data.data.machines || []).filter(m => m.unitId !== unitId);
        DB.data.data.inventory = (DB.data.data.inventory || []).filter(i => i.unitId !== unitId);
        DB.data.data.personnel = (DB.data.data.personnel || []).filter(p => p.unitId !== unitId);
        DB.data.data.cncCards = (DB.data.data.cncCards || []).filter(c => c.unitId !== unitId);

        if (UnitModule.state.activeUnitId === unitId) {
            UnitModule.state.activeUnitId = null;
            UnitModule.state.view = 'list';
        }

        await DB.save();
        UI.renderCurrentPage();
    },
    isSuperAdmin: () => {
        const role = String(DB.data?.meta?.activeRole || 'super-admin').toLowerCase();
        return role === 'super-admin';
    }
};








