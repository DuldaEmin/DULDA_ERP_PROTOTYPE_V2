const UnitModule = {
    state: {
        activeUnitId: null,
        view: 'list', // view: list | dashboard | machines | stock | personnel | cncLibrary | sawCut | plexiLibrary | pvdLibrary | eloksalLibrary | polishLibrary | extruderLibrary | unitLibraryEmpty | depoTransfer
        stockTab: 'ROD',
        selectedCncCardId: null,
        cncSearchName: '',
        cncSearchId: '',
        cncFormOpen: false,
        cncEditingId: null,
        cncDraftId: null,
        cncDraftOperations: [],
        cncDraftDrawing: null,
        sawSearchName: '',
        sawSearchCode: '',
        sawSearchLen: '',
        sawSelectedOrderId: null,
        sawProcessName: '',
        sawCutLen: '',
        sawChamfer: false,
        sawNote: '',
        sawFormOpen: false,
        sawEditingId: null,
        sawDraftCode: '',
        plexiSearchName: '',
        plexiSearchId: '',
        plexiSelectedId: null,
        plexiFormOpen: false,
        plexiEditingId: null,
        plexiProcessName: '',
        plexiUseFire: false,
        plexiUseBrush: false,
        plexiOvenMinutes: '',
        plexiNote: '',
        pvdSearchName: '',
        pvdSearchId: '',
        pvdSelectedId: null,
        pvdFormOpen: false,
        pvdEditingId: null,
        pvdProductName: '',
        pvdColor: '',
        pvdNote: '',
        elxSearchName: '',
        elxSearchId: '',
        elxSelectedId: null,
        elxFormOpen: false,
        elxEditingId: null,
        elxProductName: '',
        elxProcessType: 'ELOKSAL',
        elxColor: '',
        elxNote: '',
        polishSearchName: '',
        polishSearchId: '',
        polishSelectedId: null,
        polishFormOpen: false,
        polishEditingId: null,
        polishProductName: '',
        polishSurface: '',
        polishNote: '',
        extruderSearchDia: '',
        extruderSearchLen: '',
        extruderSearchColor: '',
        extruderSearchKind: '',
        extruderSearchCode: '',
        extruderSelectedId: null,
        extruderFormOpen: false,
        extruderEditingId: null,
        extruderDraftType: 'ROD',
        extruderDraftName: '',
        extruderDraftDia: '',
        extruderDraftThick: '',
        extruderDraftLen: '',
        extruderDraftColor: '',
        extruderDraftBubble: false,
        extruderDraftNote: ''
    },

    render: (container) => {
        const { view, activeUnitId } = UnitModule.state;

        if (!DB.data.data.inventory) DB.data.data.inventory = [];
        if (!DB.data.data.cncCards) DB.data.data.cncCards = [];
        if (!DB.data.data.plexiPolishCards) DB.data.data.plexiPolishCards = [];
        if (!DB.data.data.pvdCards) DB.data.data.pvdCards = [];
        if (!DB.data.data.eloksalCards) DB.data.data.eloksalCards = [];
        if (!DB.data.data.ibrahimPolishCards) DB.data.data.ibrahimPolishCards = [];
        if (!DB.data.data.processColorLists || typeof DB.data.data.processColorLists !== 'object') DB.data.data.processColorLists = {};
        if (!DB.data.data.polishSurfaceLists || typeof DB.data.data.polishSurfaceLists !== 'object') DB.data.data.polishSurfaceLists = {};
        if (!DB.data.data.extruderLibraryCards) DB.data.data.extruderLibraryCards = [];
        if (!DB.data.data.depoTransferLogs) DB.data.data.depoTransferLogs = [];
        if (!DB.data.data.depoRoutes) DB.data.data.depoRoutes = [];

        // Seed Data 
        if (!DB.data.data.units || DB.data.data.units.length === 0) {
            DB.data.data.units = [
                { id: 'u1', name: 'CNC ATOLYESI', type: 'internal' },
                { id: 'u2', name: 'EKSTRUDER ATOLYESI', type: 'internal' },
                { id: 'u3', name: 'MONTAJ', type: 'internal' },
                { id: 'u4', name: 'PAKETLEME', type: 'internal' },
                { id: 'u5', name: 'PLEKSI POLISAJ ATOLYESI', type: 'internal' },
                { id: 'u7', name: 'TESTERE ATOLYESI', type: 'internal' },
                { id: 'u_dtm', name: 'DEPO TRANSFER MERKEZI', type: 'internal' },
                { id: 'u8', name: 'AKPA ALUMINYUM A.S.', type: 'external' },
                { id: 'u9', name: 'HILAL PWD', type: 'external' },
                { id: 'u10', name: 'IBRAHIM POLISAJ', type: 'external' },
                { id: 'u11', name: 'TEKIN ELOKSAL', type: 'external' }
            ];
            if (DB.fileHandle) DB.save();
        }


        // System unit: keep Depo Transfer Merkezi in internal units.
        if (!(DB.data.data.units || []).some(u => u.id === 'u_dtm')) {
            DB.data.data.units.push({ id: 'u_dtm', name: 'DEPO TRANSFER MERKEZI', type: 'internal' });
            DB.markDirty();
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
                { id: 'm1', unitId: 'u2', name: 'Ekstruder Hatti 1', status: 'ACTIVE' },
                { id: 'm2', unitId: 'u2', name: 'Ekstruder Hatti 2', status: 'MAINTENANCE' },
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
        } else if (view === 'plexiLibrary') {
            UnitModule.renderPlexiLibrary(container, activeUnitId);
        } else if (view === 'pvdLibrary') {
            UnitModule.renderPvdLibrary(container, activeUnitId);
        } else if (view === 'eloksalLibrary') {
            UnitModule.renderEloksalLibrary(container, activeUnitId);
        } else if (view === 'polishLibrary') {
            UnitModule.renderPolishLibrary(container, activeUnitId);
        } else if (view === 'extruderLibrary') {
            UnitModule.renderExtruderLibrary(container, activeUnitId);
        } else if (view === 'unitLibraryEmpty') {
            UnitModule.renderUnitLibraryPlaceholder(container, activeUnitId);
        } else if (view === 'depoTransfer') {
            UnitModule.renderDepoTransfer(container);
        }
    },

    openUnit: (id) => { if (id === 'u_dtm') return UnitModule.openDepoTransfer(); UnitModule.state.activeUnitId = id; UnitModule.state.view = 'dashboard'; UI.renderCurrentPage(); },
    openDepoTransfer: () => { UnitModule.state.activeUnitId = null; UnitModule.state.view = 'depoTransfer'; UI.renderCurrentPage(); },
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
        if (!DB.data.data.sawCutMeta || typeof DB.data.data.sawCutMeta !== 'object') DB.data.data.sawCutMeta = {};
        if (!DB.data.data.sawCutMeta.v2ResetApplied) {
            DB.data.data.sawCutOrders = [];
            DB.data.data.sawCutMeta.v2ResetApplied = true;
            DB.markDirty();
            DB.save();
        }
        UnitModule.state.sawSearchName = '';
        UnitModule.state.sawSearchCode = '';
        UnitModule.state.sawSearchLen = '';
        UnitModule.state.sawSelectedOrderId = null;
        UnitModule.state.sawProcessName = '';
        UnitModule.state.sawCutLen = '';
        UnitModule.state.sawChamfer = false;
        UnitModule.state.sawNote = '';
        UnitModule.state.sawFormOpen = false;
        UnitModule.state.sawEditingId = null;
        UnitModule.state.sawDraftCode = '';
        UI.renderCurrentPage();
    },
    openPlexiLibrary: (id) => {
        UnitModule.state.activeUnitId = id;
        UnitModule.state.view = 'plexiLibrary';
        UnitModule.state.plexiSearchName = '';
        UnitModule.state.plexiSearchId = '';
        UnitModule.state.plexiSelectedId = null;
        UnitModule.state.plexiFormOpen = false;
        UnitModule.state.plexiEditingId = null;
        UnitModule.state.plexiProcessName = '';
        UnitModule.state.plexiUseFire = false;
        UnitModule.state.plexiUseBrush = false;
        UnitModule.state.plexiOvenMinutes = '';
        UnitModule.state.plexiNote = '';
        UI.renderCurrentPage();
    },
    openPvdLibrary: (id) => {
        UnitModule.state.activeUnitId = id;
        UnitModule.state.view = 'pvdLibrary';
        UnitModule.state.pvdSearchName = '';
        UnitModule.state.pvdSearchId = '';
        UnitModule.state.pvdSelectedId = null;
        UnitModule.state.pvdFormOpen = false;
        UnitModule.state.pvdEditingId = null;
        UnitModule.state.pvdProductName = '';
        UnitModule.state.pvdColor = '';
        UnitModule.state.pvdNote = '';
        UI.renderCurrentPage();
    },
    openEloksalLibrary: (id) => {
        UnitModule.state.activeUnitId = id;
        UnitModule.state.view = 'eloksalLibrary';
        UnitModule.state.elxSearchName = '';
        UnitModule.state.elxSearchId = '';
        UnitModule.state.elxSelectedId = null;
        UnitModule.state.elxFormOpen = false;
        UnitModule.state.elxEditingId = null;
        UnitModule.state.elxProductName = '';
        UnitModule.state.elxProcessType = 'ELOKSAL';
        UnitModule.state.elxColor = '';
        UnitModule.state.elxNote = '';
        UI.renderCurrentPage();
    },
    openPolishLibrary: (id) => {
        UnitModule.state.activeUnitId = id;
        UnitModule.state.view = 'polishLibrary';
        UnitModule.state.polishSearchName = '';
        UnitModule.state.polishSearchId = '';
        UnitModule.state.polishSelectedId = null;
        UnitModule.state.polishFormOpen = false;
        UnitModule.state.polishEditingId = null;
        UnitModule.state.polishProductName = '';
        UnitModule.state.polishSurface = '';
        UnitModule.state.polishNote = '';
        UI.renderCurrentPage();
    },
    openExtruderLibrary: (id) => {
        UnitModule.state.activeUnitId = id;
        UnitModule.state.view = 'extruderLibrary';
        UnitModule.state.extruderSearchDia = '';
        UnitModule.state.extruderSearchLen = '';
        UnitModule.state.extruderSearchColor = '';
        UnitModule.state.extruderSearchKind = '';
        UnitModule.state.extruderSearchCode = '';
        UnitModule.state.extruderSelectedId = null;
        UnitModule.state.extruderFormOpen = false;
        UnitModule.state.extruderEditingId = null;
        UnitModule.state.extruderDraftType = 'ROD';
        UnitModule.state.extruderDraftName = '';
        UnitModule.state.extruderDraftDia = '';
        UnitModule.state.extruderDraftThick = '';
        UnitModule.state.extruderDraftLen = '';
        UnitModule.state.extruderDraftColor = '';
        UnitModule.state.extruderDraftBubble = false;
        UnitModule.state.extruderDraftNote = '';
        UI.renderCurrentPage();
    },
    openUnitLibrary: (id) => {
        const unit = (DB.data.data.units || []).find(u => u.id === id);
        const unitName = String(unit?.name || '').toUpperCase();
        if (unitName.includes('CNC')) {
            UnitModule.openCncLibrary(id);
            return;
        }
        if (id === 'u2' || unitName.includes('EKSTR')) {
            UnitModule.openExtruderLibrary(id);
            return;
        }
        if (unitName.includes('TESTERE')) {
            UnitModule.openSawCut(id);
            return;
        }
        if (id === 'u9' || unitName.includes('PVD') || unitName.includes('PWD')) {
            UnitModule.openPvdLibrary(id);
            return;
        }
        if (id === 'u11' || unitName.includes('ELOKSAL')) {
            UnitModule.openEloksalLibrary(id);
            return;
        }
        if (id === 'u10' || unitName.includes('IBRAHIM POLISAJ')) {
            UnitModule.openPolishLibrary(id);
            return;
        }
        if (id === 'u5' || unitName.includes('PLEKS') || unitName.includes('POLISAJ')) {
            UnitModule.openPlexiLibrary(id);
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
            u_dtm: { bg: '#dbeafe', fg: '#1e40af' },
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
            const isDepoTransfer = u.id === 'u_dtm';
            const palette = badgeStyles[u.id] || (u.type === 'internal'
                ? { bg: '#eff6ff', fg: '#2563eb' }
                : { bg: '#fff7ed', fg: '#ea580c' });
            const initials = getUnitInitials(u.name);
            const cardAction = isDepoTransfer ? 'UnitModule.openDepoTransfer()' : `UnitModule.openUnit('${u.id}')`;
            return `
            <div class="app-card" style="padding:1.5rem; position:relative; cursor:pointer;" onclick="${cardAction}">
                ${canManage && !isDepoTransfer ? `
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
    renderDepoTransfer: (container) => {
        const units = (DB.data.data.units || []).slice();
        const unitMap = {};
        units.forEach(u => { unitMap[u.id] = u.name; });
        const routes = (DB.data.data.depoRoutes || [])
            .slice()
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        const unitOptions = units.map(u => `<option value="${u.id}">${UnitModule.escapeHtml(u.name)} (${u.type === 'external' ? 'Dis' : 'Ic'})</option>`).join('');

        container.innerHTML = `
            <div style="margin-bottom:1.25rem; display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <button onclick="UnitModule.state.view='list'; UI.renderCurrentPage();" style="background:white; border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.5rem; cursor:pointer;">
                        <i data-lucide="arrow-left" width="18" height="18"></i>
                    </button>
                    <div>
                        <h2 class="page-title" style="margin:0;">Depo Transfer Merkezi</h2>
                        <div style="font-size:0.85rem; color:#64748b;">Depocular icin rota yonetim ekrani</div>
                    </div>
                </div>
                <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:0.7rem; padding:0.5rem 0.8rem; font-weight:700; color:#0f172a;">
                        Kayitli Rota: ${routes.length}
                    </div>
                </div>
            </div>

            <div style="margin-bottom:1rem; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:0.8rem; padding:0.75rem; color:#475569; font-size:0.82rem;">
                Aldim/Verdim transfer formlari sonraki fazda eklenecek. Bu ekranda su an sadece rota tanimlanir.
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:1rem;">
                    <div style="font-weight:800; color:#0f172a; margin-bottom:0.8rem; display:flex; align-items:center; gap:0.45rem;">
                        <i data-lucide="workflow" width="16" height="16"></i> Urun Rotasi Tanimla
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.65rem;">
                        <input id="route_name" placeholder="Rota Adi (orn: Boru Standart)" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.55rem 0.65rem; font-weight:600;">
                        <input id="route_product" placeholder="Urun Kod/Adi" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.55rem 0.65rem; font-weight:600;">
                        <select id="route_step_1" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.55rem 0.65rem; font-weight:600;"><option value="">Adim 1</option>${unitOptions}</select>
                        <select id="route_step_2" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.55rem 0.65rem; font-weight:600;"><option value="">Adim 2</option>${unitOptions}</select>
                        <select id="route_step_3" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.55rem 0.65rem; font-weight:600;"><option value="">Adim 3</option>${unitOptions}</select>
                        <select id="route_step_4" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.55rem 0.65rem; font-weight:600;"><option value="">Adim 4</option>${unitOptions}</select>
                    </div>
                    <div style="font-size:0.77rem; color:#64748b; margin-top:0.55rem;">Rota seciminde sadece bu sayfadaki istasyonlar kullanilir.</div>
                    <button class="btn-primary" onclick="UnitModule.saveDepoRoute()" style="margin-top:0.8rem; display:inline-flex; align-items:center; gap:0.45rem;">
                        <i data-lucide="save" width="16" height="16"></i> Rotayi Kaydet
                    </button>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:1rem;">
                    <div style="font-weight:800; color:#0f172a; margin-bottom:0.8rem; display:flex; align-items:center; gap:0.45rem;">
                        <i data-lucide="list-tree" width="16" height="16"></i> Kayitli Rotalar
                    </div>
                    <div class="card-table">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                                    <th style="padding:0.55rem; text-align:left;">Rota</th>
                                    <th style="padding:0.55rem; text-align:left;">Urun</th>
                                    <th style="padding:0.55rem; text-align:left;">Istasyonlar</th>
                                    <th style="padding:0.55rem; text-align:right;">Islem</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${routes.length === 0 ? `<tr><td colspan="4" style="padding:1rem; color:#94a3b8; text-align:center;">Kayitli rota yok.</td></tr>` : routes.map(r => `
                                    <tr style="border-bottom:1px solid #f1f5f9;">
                                        <td style="padding:0.55rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(r.routeName || '-')}</td>
                                        <td style="padding:0.55rem; color:#475569;">${UnitModule.escapeHtml(r.productKey || '-')}</td>
                                        <td style="padding:0.55rem; color:#475569; font-size:0.82rem;">
                                            ${(Array.isArray(r.stationIds) ? r.stationIds : []).map(id => UnitModule.escapeHtml(unitMap[id] || id)).join(' &rarr; ')}
                                        </td>
                                        <td style="padding:0.55rem; text-align:right;">
                                            <button class="btn-sm" onclick="UnitModule.deleteDepoRoute('${r.id}')" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;">Sil</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },
    saveDepoRoute: async () => {
        const routeName = String(document.getElementById('route_name')?.value || '').trim();
        const productKey = String(document.getElementById('route_product')?.value || '').trim();
        const rawStationIds = [
            String(document.getElementById('route_step_1')?.value || '').trim(),
            String(document.getElementById('route_step_2')?.value || '').trim(),
            String(document.getElementById('route_step_3')?.value || '').trim(),
            String(document.getElementById('route_step_4')?.value || '').trim()
        ];
        const stationIds = rawStationIds.filter(Boolean);

        if (!routeName) return alert('Rota adi zorunlu.');
        if (!productKey) return alert('Urun kod/adi zorunlu.');
        if (stationIds.length < 2) return alert('Rota icin en az 2 adim seciniz.');

        const uniqueCount = new Set(stationIds).size;
        if (uniqueCount !== stationIds.length) return alert('Ayni istasyon rota icinde tekrar edemez.');

        const validUnitIds = new Set((DB.data.data.units || []).map(u => u.id));
        if (stationIds.some(id => !validUnitIds.has(id))) return alert('Rota disi bir istasyon secildi.');

        if (!Array.isArray(DB.data.data.depoRoutes)) DB.data.data.depoRoutes = [];
        DB.data.data.depoRoutes.push({
            id: crypto.randomUUID(),
            routeName,
            productKey,
            stationIds,
            created_at: new Date().toISOString()
        });

        await DB.save();
        UnitModule.renderDepoTransfer(document.getElementById('main-content'));
    },
    deleteDepoRoute: async (routeId) => {
        const row = (DB.data.data.depoRoutes || []).find(x => x.id === routeId);
        if (!row) return;
        if (!confirm(`"${row.routeName}" rotasi silinsin mi?`)) return;

        DB.data.data.depoRoutes = (DB.data.data.depoRoutes || []).filter(x => x.id !== routeId);
        await DB.save();
        UnitModule.renderDepoTransfer(document.getElementById('main-content'));
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
                { id: crypto.randomUUID(), unitId, fullName: 'Ahmet Yilmaz', permissions: { production: true, waste: true, admin: true }, isActive: true },
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
                        <h2 class="page-title" style="margin:0; display:flex; align-items:center; gap:0.5rem"><i data-lucide="users" color="#2563eb"></i> Personel Yonetimi</h2>
                        <div style="font-size:0.875rem; color:#64748b">${unit.name} - Calisan listesi ve yetkilendirme</div>
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
                            <th style="padding:1.5rem; text-align:right">Islemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${personnel.length === 0 ? '<tr><td colspan="3" style="padding:2rem; text-align:center; color:#94a3b8">Kayitli personel yok.</td></tr>' : personnel.map(p => `
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
                                        ${p.permissions.production ? '<span style="background:#ecfdf5; color:#047857; padding:0.25rem 0.5rem; border-radius:0.25rem; font-size:0.75rem; font-weight:700; display:flex; gap:0.25rem; align-items:center"><i data-lucide="factory" width="12"></i> Uretim</span>' : ''}
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

        Modal.open(person ? 'Personeli Duzenle' : 'Yeni Personel Ekle', `
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
                            <div style="font-weight:600; font-size:0.9rem">Uretim Baslatabilir</div>
                            <div style="font-size:0.75rem; color:#94a3b8">Is emri yetkisi</div>
                        </div>
                    </div>
                    <input id="p_perm_prod" type="checkbox" ${perms.production ? 'checked' : ''} style="width:1.25rem; height:1.25rem">
                </label>

                <label style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem; border:1px solid #f1f5f9; border-radius:0.5rem; cursor:pointer" class="hover:bg-slate-50">
                     <div style="display:flex; gap:0.75rem; align-items:center">
                        <div style="background:#ffedd5; color:#c2410c; padding:0.5rem; border-radius:0.25rem"><i data-lucide="alert-circle" width="18"></i></div>
                        <div>
                            <div style="font-weight:600; font-size:0.9rem">Fire Onayi Verebilir</div>
                            <div style="font-size:0.75rem; color:#94a3b8">Hatali uretim girisi</div>
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

        if (!name) return alert("Isim giriniz.");

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
        if (!confirm("Bu personeli silmek (pasife almak) istediginize emin misiniz?")) return;
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
                        <div style="font-size:0.875rem; color:#64748b">${unit?.name || ''} ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Bu birim iÃƒÆ’Ã‚Â§in modÃƒÆ’Ã‚Â¼l henÃƒÆ’Ã‚Â¼z tanÃƒâ€Ã‚Â±mlanmadÃƒâ€Ã‚Â±.</div>
                    </div>
                </div>
            </div>
            <div class="card-table" style="padding:2rem; text-align:center; color:#94a3b8">
                <div style="font-weight:700; color:#475569; margin-bottom:0.5rem">Bos Sayfa</div>
                <div style="font-size:0.9rem">Bu birimin urun ekleme modulu daha sonra eklenecek.</div>
            </div>
        `;
    },
    renderCncLibrary: (container, unitId) => {
        CncLibraryModule.render(container, unitId);
    },

    collectGlobalCodes: (exclude = null) => {
        const bag = new Set();
        const add = (value) => {
            const normalized = String(value || '').trim().toUpperCase();
            if (!normalized) return;
            bag.add(normalized);
        };
        const shouldSkip = (collection, row, field) => {
            if (!exclude || !row) return false;
            if (exclude.collection !== collection) return false;
            if (String(exclude.id || '') !== String(row.id || '')) return false;
            if (exclude.field && exclude.field !== field) return false;
            return true;
        };
        const readMany = (collection, list, fields) => {
            if (!Array.isArray(list)) return;
            list.forEach(row => {
                fields.forEach(field => {
                    if (shouldSkip(collection, row, field)) return;
                    add(row?.[field]);
                });
            });
        };

        readMany('products', DB.data?.data?.products, ['code']);
        readMany('cncCards', DB.data?.data?.cncCards, ['cncId']);
        readMany('sawCutOrders', DB.data?.data?.sawCutOrders, ['code']);
        readMany('extruderLibraryCards', DB.data?.data?.extruderLibraryCards, ['cardCode']);
        readMany('plexiPolishCards', DB.data?.data?.plexiPolishCards, ['cardCode']);
        readMany('pvdCards', DB.data?.data?.pvdCards, ['cardCode']);
        readMany('ibrahimPolishCards', DB.data?.data?.ibrahimPolishCards, ['cardCode']);
        readMany('eloksalCards', DB.data?.data?.eloksalCards, ['cardCode']);
        readMany('aluminumProfiles', DB.data?.data?.aluminumProfiles, ['code']);
        return bag;
    },

    isGlobalCodeTaken: (code, exclude = null) => {
        const normalized = String(code || '').trim().toUpperCase();
        if (!normalized) return false;
        return UnitModule.collectGlobalCodes(exclude).has(normalized);
    },

    getNextSawProcessCode: () => {
        if (!Array.isArray(DB.data.data.sawCutOrders)) DB.data.data.sawCutOrders = [];
        const max = DB.data.data.sawCutOrders.reduce((acc, row) => {
            const code = String(row?.code || '').trim().toUpperCase();
            const match = code.match(/^TST-(\d{6})$/);
            if (!match) return acc;
            return Math.max(acc, Number(match[1]));
        }, 0);
        let nextNum = max + 1;
        let candidate = `TST-${String(nextNum).padStart(6, '0')}`;
        while (UnitModule.isGlobalCodeTaken(candidate)) {
            nextNum += 1;
            candidate = `TST-${String(nextNum).padStart(6, '0')}`;
        }
        return candidate;
    },

    renderSawCut: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);
        const showForm = UnitModule.state.sawFormOpen || !!UnitModule.state.sawEditingId;

        const rows = (DB.data.data.sawCutOrders || [])
            .filter(x => x.unitId === unitId)
            .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

        const nameQuery = String(UnitModule.state.sawSearchName || '').trim().toLowerCase();
        const codeQuery = String(UnitModule.state.sawSearchCode || '').trim().toLowerCase();
        const lenQuery = String(UnitModule.state.sawSearchLen || '').trim().toLowerCase();
        const filteredRows = rows.filter(r => {
            const processName = String(r.processName || '').toLowerCase();
            const code = String(r.code || '').toLowerCase();
            const len = String(r.lengthMm ?? r.cutLengthMm ?? '').toLowerCase();
            if (nameQuery && !processName.includes(nameQuery)) return false;
            if (codeQuery && !code.includes(codeQuery)) return false;
            if (lenQuery && !len.includes(lenQuery)) return false;
            return true;
        });

        const activeCode = UnitModule.state.sawDraftCode || UnitModule.getNextSawProcessCode();

        container.innerHTML = `
            <div style="margin-bottom:1.25rem; display:flex; justify-content:space-between; align-items:center">
                <div style="display:flex; align-items:center; gap:1rem">
                    <button onclick="UnitModule.openUnit('${unitId}')" style="background:white; padding:0.5rem; border-radius:0.5rem; border:1px solid #e2e8f0; cursor:pointer"><i data-lucide="arrow-left" width="20"></i></button>
                    <div>
                        <h2 class="page-title" style="margin:0; display:flex; align-items:center; gap:0.5rem"><i data-lucide="scissors" color="#047857"></i> &#220;r&#252;n K&#252;t&#252;phanesi</h2>
                        <div style="font-size:0.875rem; color:#64748b">${unit?.name || 'TESTERE'} &#8226; Olcu kayitlari burada listelenir</div>
                    </div>
                </div>
                <button class="btn-primary" onclick="UnitModule.openSawForm()" style="height:42px; padding:0 1rem">${showForm ? 'vazgec' : 'urun ekle +'}</button>
            </div>

            <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.85rem; margin-bottom:0.85rem; display:grid; grid-template-columns: 1fr 1fr 1fr; gap:0.65rem">
                <input id="saw_list_name" value="${UnitModule.state.sawSearchName || ''}" oninput="UnitModule.setSawListFilter('name', this.value, 'saw_list_name')" placeholder="islemin adi ile ara" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.6rem 0.75rem; font-weight:600; color:#334155">
                <input id="saw_list_len" value="${UnitModule.state.sawSearchLen || ''}" oninput="UnitModule.setSawListFilter('len', this.value, 'saw_list_len')" placeholder="olcu ile ara (mm)" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.6rem 0.75rem; font-weight:600; color:#334155">
                <input id="saw_list_code" value="${UnitModule.state.sawSearchCode || ''}" oninput="UnitModule.setSawListFilter('code', this.value, 'saw_list_code')" placeholder="islem ID ile ara" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.6rem 0.75rem; font-weight:600; color:#334155">
            </div>

            ${showForm ? `
            <div id="saw_form_block" style="background:white; border:2px solid #111827; border-radius:1rem; padding:1rem; margin-bottom:1rem; box-shadow:0 8px 18px rgba(15,23,42,0.08);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem">
                    <div style="font-size:2rem; font-weight:700; color:#0f172a; line-height:1">yeni olcu olustur</div>
                    <div style="display:flex; gap:0.5rem">
                        <button class="btn-sm" onclick="UnitModule.resetSawDraft(false)">vazgec</button>
                        <button class="btn-primary" onclick="UnitModule.saveSawCut('${unitId}')">kaydet</button>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap:0.8rem; align-items:end; margin-bottom:0.8rem">
                    <div>
                        <label style="display:block; font-size:0.85rem; color:#64748b; margin-bottom:0.25rem">islemin adi</label>
                        <input value="${UnitModule.state.sawProcessName || ''}" oninput="UnitModule.state.sawProcessName=this.value" placeholder="islemin adi" style="width:100%; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.65rem 0.75rem; font-weight:600; color:#334155">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.85rem; color:#64748b; margin-bottom:0.25rem">olcu giriniz mm.</label>
                        <input type="number" min="1" step="0.01" value="${UnitModule.state.sawCutLen || ''}" oninput="UnitModule.state.sawCutLen=this.value" placeholder="olcu giriniz mm." style="width:100%; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.65rem 0.75rem; font-weight:600; color:#334155">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.85rem; color:#64748b; margin-bottom:0.25rem">pah kirma ekle +</label>
                        <div style="display:flex; gap:0.45rem">
                            <button class="btn-sm" onclick="UnitModule.setSawChamfer(true)" style="flex:1; padding:0.62rem 0.7rem; ${UnitModule.state.sawChamfer ? 'background:#0f172a; color:white; border-color:#0f172a' : ''}">VAR</button>
                            <button class="btn-sm" onclick="UnitModule.setSawChamfer(false)" style="flex:1; padding:0.62rem 0.7rem; ${!UnitModule.state.sawChamfer ? 'background:#e2e8f0; color:#0f172a; border-color:#cbd5e1' : ''}">YOK</button>
                        </div>
                    </div>
                    <div>
                        <label style="display:block; font-size:0.85rem; color:#64748b; margin-bottom:0.25rem">islem ID</label>
                        <input value="${activeCode}" readonly style="width:100%; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.65rem 0.75rem; font-family:monospace; font-weight:700; color:#334155; background:#f8fafc">
                    </div>
                </div>

                <div>
                    <label style="display:block; font-size:0.85rem; color:#64748b; margin-bottom:0.25rem">not ekle</label>
                    <textarea oninput="UnitModule.state.sawNote=this.value" placeholder="not ekle" style="width:100%; min-height:88px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.7rem 0.8rem; color:#334155; font-weight:500">${UnitModule.state.sawNote || ''}</textarea>
                </div>
            </div>
            ` : ''}

            <div id="saw_list_block" class="card-table" style="margin-bottom:1rem">
                <table>
                    <thead>
                        <tr>
                            <th>ISLEM ADI</th>
                            <th style="text-align:center">OLCU (mm)</th>
                            <th style="text-align:center">PAH</th>
                            <th style="font-family:monospace">ID</th>
                            <th style="text-align:center">DUZENLE</th>
                            <th style="text-align:center">SEC</th>
                            <th style="text-align:right">SIL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredRows.length === 0 ? `<tr><td colspan="7" style="text-align:center; padding:1.5rem; color:#94a3b8">Kayit yok.</td></tr>` : filteredRows.map(r => `
                            <tr style="${UnitModule.state.sawSelectedOrderId === r.id ? 'background:#f0f9ff' : ''}">
                                <td style="font-weight:700; color:#334155">${r.processName || '-'}</td>
                                <td style="text-align:center; font-weight:700; color:#0f766e">${r.lengthMm ?? r.cutLengthMm ?? '-'}</td>
                                <td style="text-align:center">
                                    <span style="display:inline-flex; padding:0.2rem 0.55rem; border-radius:999px; font-size:0.72rem; font-weight:700; border:1px solid ${r.hasChamfer ? '#16a34a' : '#cbd5e1'}; color:${r.hasChamfer ? '#166534' : '#475569'}; background:${r.hasChamfer ? '#dcfce7' : '#f8fafc'}">${r.hasChamfer ? 'VAR' : 'YOK'}</span>
                                </td>
                                <td style="font-family:monospace; color:#475569; font-weight:700">${r.code || '-'}</td>
                                <td style="text-align:center"><button class="btn-sm" onclick="UnitModule.editSawRow('${r.id}')">duzenle</button></td>
                                <td style="text-align:center"><button class="btn-sm" onclick="UnitModule.selectSawRow('${r.id}')" style="${UnitModule.state.sawSelectedOrderId === r.id ? 'background:#0f172a; color:white; border-color:#0f172a' : ''}">sec</button></td>
                                <td style="text-align:right"><button class="btn-sm btn-danger" onclick="UnitModule.deleteSawRow('${r.id}')">sil</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    openSawForm: () => {
        if (UnitModule.state.sawFormOpen || UnitModule.state.sawEditingId) {
            UnitModule.resetSawDraft(false);
            return;
        }
        UnitModule.state.sawFormOpen = true;
        UnitModule.state.sawEditingId = null;
        UnitModule.state.sawDraftCode = UnitModule.getNextSawProcessCode();
        UI.renderCurrentPage();
    },

    setSawChamfer: (value) => {
        UnitModule.state.sawChamfer = !!value;
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

    selectSawRow: (id) => {
        UnitModule.state.sawSelectedOrderId = id;
        UI.renderCurrentPage();
    },

    editSawRow: (id) => {
        const row = (DB.data.data.sawCutOrders || []).find(x => x.id === id);
        if (!row) return;
        UnitModule.state.sawFormOpen = true;
        UnitModule.state.sawEditingId = id;
        UnitModule.state.sawSelectedOrderId = id;
        UnitModule.state.sawProcessName = row.processName || '';
        UnitModule.state.sawCutLen = String(row.lengthMm ?? row.cutLengthMm ?? '');
        UnitModule.state.sawChamfer = !!row.hasChamfer;
        UnitModule.state.sawNote = row.note || '';
        UnitModule.state.sawDraftCode = row.code || UnitModule.getNextSawProcessCode();
        UI.renderCurrentPage();
    },

    deleteSawRow: async (id) => {
        if (!confirm('Kayit silinsin mi?')) return;
        DB.data.data.sawCutOrders = (DB.data.data.sawCutOrders || []).filter(x => x.id !== id);
        if (UnitModule.state.sawSelectedOrderId === id) UnitModule.state.sawSelectedOrderId = null;
        if (UnitModule.state.sawEditingId === id) UnitModule.resetSawDraft(false);
        await DB.save();
        UI.renderCurrentPage();
    },

    saveSawCut: async (unitId) => {
        const processName = String(UnitModule.state.sawProcessName || '').trim();
        const lenVal = Number(UnitModule.state.sawCutLen);
        const code = String(UnitModule.state.sawDraftCode || UnitModule.getNextSawProcessCode()).trim().toUpperCase();
        const note = String(UnitModule.state.sawNote || '').trim();

        if (!processName) return alert('Lutfen islemin adini giriniz.');
        if (!lenVal || lenVal <= 0) return alert('Lutfen olcu (mm) giriniz.');
        if (UnitModule.isGlobalCodeTaken(code, UnitModule.state.sawEditingId ? {
            collection: 'sawCutOrders',
            id: UnitModule.state.sawEditingId,
            field: 'code'
        } : null)) {
            return alert('Bu ID kodu zaten kullaniliyor. Tum kodlar benzersiz olmalidir.');
        }

        if (!Array.isArray(DB.data.data.sawCutOrders)) DB.data.data.sawCutOrders = [];
        const now = new Date().toISOString();

        if (UnitModule.state.sawEditingId) {
            const row = DB.data.data.sawCutOrders.find(x => x.id === UnitModule.state.sawEditingId);
            if (row) {
                row.processName = processName;
                row.lengthMm = lenVal;
                row.cutLengthMm = lenVal;
                row.hasChamfer = !!UnitModule.state.sawChamfer;
                row.note = note || '';
                row.code = code || UnitModule.getNextSawProcessCode();
                row.updated_at = now;
            }
            UnitModule.state.sawSelectedOrderId = UnitModule.state.sawEditingId;
        } else {
            const rowId = crypto.randomUUID();
            DB.data.data.sawCutOrders.push({
                id: rowId,
                unitId,
                processName,
                lengthMm: lenVal,
                cutLengthMm: lenVal,
                hasChamfer: !!UnitModule.state.sawChamfer,
                note: note || '',
                code,
                created_at: now
            });
            UnitModule.state.sawSelectedOrderId = rowId;
        }

        await DB.save();
        UnitModule.resetSawDraft(false);
    },

    resetSawDraft: (keepOpen = false) => {
        UnitModule.state.sawEditingId = null;
        UnitModule.state.sawProcessName = '';
        UnitModule.state.sawCutLen = '';
        UnitModule.state.sawChamfer = false;
        UnitModule.state.sawNote = '';
        UnitModule.state.sawDraftCode = keepOpen ? UnitModule.getNextSawProcessCode() : '';
        UnitModule.state.sawFormOpen = !!keepOpen;
        UI.renderCurrentPage();
    },
    renderExtruderLibrary: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);
        if (!Array.isArray(DB.data.data.extruderLibraryCards)) DB.data.data.extruderLibraryCards = [];
        if (!DB.data.data.unitColors) DB.data.data.unitColors = {};
        if (!DB.data.data.unitColors[unitId]) DB.data.data.unitColors[unitId] = ['Seffaf', 'Beyaz', 'Siyah', 'Antrasit'];
        const colors = DB.data.data.unitColors[unitId] || [];
        const showForm = UnitModule.state.extruderFormOpen || !!UnitModule.state.extruderEditingId;

        const cards = (DB.data.data.extruderLibraryCards || [])
            .filter(x => x.unitId === unitId)
            .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

        const qDia = String(UnitModule.state.extruderSearchDia || '').trim();
        const qLen = String(UnitModule.state.extruderSearchLen || '').trim();
        const qColor = String(UnitModule.state.extruderSearchColor || '').trim().toLowerCase();
        const qKind = String(UnitModule.state.extruderSearchKind || '').trim().toUpperCase();
        const qCode = String(UnitModule.state.extruderSearchCode || '').trim().toLowerCase();
        const filtered = cards.filter(row => {
            const diaOk = !qDia || String(row.diameterMm ?? '').trim() === qDia;
            const lenOk = !qLen || String(row.lengthMm ?? '').trim() === qLen;
            const colorOk = !qColor || String(row.color || '').toLowerCase().includes(qColor);
            const kindOk = !qKind || String(row.kind || '').toUpperCase() === qKind;
            const codeOk = !qCode
                || String(row.cardCode || '').toLowerCase().includes(qCode)
                || String(row.id || '').toLowerCase().includes(qCode);
            return diaOk && lenOk && colorOk && kindOk && codeOk;
        });

        const editing = UnitModule.state.extruderEditingId
            ? cards.find(x => x.id === UnitModule.state.extruderEditingId)
            : null;
        const draftCode = editing?.cardCode || UnitModule.generateExtruderCardCode();
        const draftType = String(UnitModule.state.extruderDraftType || 'ROD');
        const typeLabel = (kind) => kind === 'PIPE' ? 'BORU' : (kind === 'PROFILE' ? 'OZEL PROFIL' : 'CUBUK');

        container.innerHTML = `
            <div style="max-width:1300px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap; margin-bottom:1rem; padding:0.2rem 0.1rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                        <button onclick="UnitModule.openUnit('${unitId}')" style="background:white; border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.45rem; cursor:pointer;">
                            <i data-lucide="arrow-left" width="18"></i>
                        </button>
                        <div>
                            <h2 class="page-title" style="margin:0; display:flex; gap:0.4rem; align-items:center;">
                                <i data-lucide="library" color="#1d4ed8"></i> Ekstruder Urun Kutuphanesi
                            </h2>
                            <div style="font-size:0.82rem; color:#64748b; font-weight:700;">${unit?.name || ''}</div>
                        </div>
                    </div>
                    <button onclick="UnitModule.toggleExtruderForm()" class="btn-primary" style="padding:0.55rem 1.15rem; border-radius:0.75rem;">${showForm ? 'Vazgec' : 'Urun ekle +'}</button>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem;">
                    <div style="display:flex; gap:0.6rem; margin-bottom:0.8rem; flex-wrap:wrap;">
                        <input id="ext_search_dia" value="${UnitModule.escapeHtml(UnitModule.state.extruderSearchDia || '')}" oninput="UnitModule.setExtruderListFilter('dia', this.value, 'ext_search_dia')" placeholder="cap ile ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:190px; font-weight:600;">
                        <input id="ext_search_len" value="${UnitModule.escapeHtml(UnitModule.state.extruderSearchLen || '')}" oninput="UnitModule.setExtruderListFilter('len', this.value, 'ext_search_len')" placeholder="boy ile ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:190px; font-weight:600;">
                        <input id="ext_search_color" value="${UnitModule.escapeHtml(UnitModule.state.extruderSearchColor || '')}" oninput="UnitModule.setExtruderListFilter('color', this.value, 'ext_search_color')" placeholder="renk ile ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:190px; font-weight:600;">
                        <select id="ext_search_kind" onchange="UnitModule.setExtruderListFilter('kind', this.value, 'ext_search_kind')" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:190px; font-weight:600; background:white;">
                            <option value="">cinsi ile ara</option>
                            <option value="ROD" ${String(UnitModule.state.extruderSearchKind || '') === 'ROD' ? 'selected' : ''}>CUBUK</option>
                            <option value="PIPE" ${String(UnitModule.state.extruderSearchKind || '') === 'PIPE' ? 'selected' : ''}>BORU</option>
                            <option value="PROFILE" ${String(UnitModule.state.extruderSearchKind || '') === 'PROFILE' ? 'selected' : ''}>OZEL PROFIL</option>
                        </select>
                        <input id="ext_search_code" value="${UnitModule.escapeHtml(UnitModule.state.extruderSearchCode || '')}" oninput="UnitModule.setExtruderListFilter('code', this.value, 'ext_search_code')" placeholder="ID ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                    </div>
                    <div id="ext_list_block" class="card-table">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.75rem; text-transform:uppercase;">
                                    <th style="padding:0.65rem; text-align:left;">Tip</th>
                                    <th style="padding:0.65rem; text-align:left;">Urun adi</th>
                                    <th style="padding:0.65rem; text-align:center;">Cap</th>
                                    <th style="padding:0.65rem; text-align:center;">Kalinlik</th>
                                    <th style="padding:0.65rem; text-align:center;">Boy</th>
                                    <th style="padding:0.65rem; text-align:center;">Renk</th>
                                    <th style="padding:0.65rem; text-align:center;">Ozellik</th>
                                    <th style="padding:0.65rem; text-align:left;">ID</th>
                                    <th style="padding:0.65rem; text-align:right;">Duzenle</th>
                                    <th style="padding:0.65rem; text-align:right;">Sec</th>
                                    <th style="padding:0.65rem; text-align:right;">Sil</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.length === 0 ? `<tr><td colspan="11" style="padding:1rem; text-align:center; color:#94a3b8;">Kayit bulunamadi.</td></tr>` : filtered.map(row => `
                                    <tr style="border-bottom:1px solid #f1f5f9; ${UnitModule.state.extruderSelectedId === row.id ? 'background:#ecfeff;' : ''}">
                                        <td style="padding:0.65rem;"><span style="font-size:0.72rem; font-weight:700; color:#475569; background:#f8fafc; border:1px solid #e2e8f0; padding:0.25rem 0.55rem; border-radius:0.5rem">${typeLabel(row.kind)}</span></td>
                                        <td style="padding:0.65rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.productName || '-')}</td>
                                        <td style="padding:0.65rem; text-align:center;">${Number.isFinite(Number(row.diameterMm)) ? Number(row.diameterMm) : '-'}</td>
                                        <td style="padding:0.65rem; text-align:center;">${row.kind === 'PIPE' && Number.isFinite(Number(row.thicknessMm)) ? Number(row.thicknessMm) : '-'}</td>
                                        <td style="padding:0.65rem; text-align:center; font-weight:700; color:#0f766e;">${Number.isFinite(Number(row.lengthMm)) ? Number(row.lengthMm) : '-'}</td>
                                        <td style="padding:0.65rem; text-align:center;">${UnitModule.escapeHtml(row.color || '-')}</td>
                                        <td style="padding:0.65rem; text-align:center;">${row.isBubble ? '<span style="border:1px solid #93c5fd; background:#dbeafe; color:#1d4ed8; border-radius:999px; padding:0.15rem 0.5rem; font-size:0.72rem; font-weight:700;">Kabarcikli</span>' : '-'}</td>
                                        <td style="padding:0.65rem; font-family:monospace; color:#64748b;">${UnitModule.escapeHtml(row.cardCode || '-')}</td>
                                        <td style="padding:0.65rem; text-align:right;">
                                            <button onclick="UnitModule.editExtruderRow('${row.id}')" class="btn-sm">duzenle</button>
                                        </td>
                                        <td style="padding:0.65rem; text-align:right;">
                                            <button onclick="UnitModule.selectExtruderRow('${row.id}')" class="btn-sm" style="${UnitModule.state.extruderSelectedId === row.id ? 'background:#0f172a; color:white; border-color:#0f172a' : ''}">sec</button>
                                        </td>
                                        <td style="padding:0.65rem; text-align:right;">
                                            <button onclick="UnitModule.deleteExtruderRow('${row.id}')" class="btn-sm" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;">sil</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${showForm ? `
                    <div id="ext_form_block" style="background:white; border:2px solid #111827; border-radius:1rem; padding:1rem; margin-top:1rem; box-shadow:0 8px 18px rgba(15,23,42,0.08);">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.7rem;">
                            <strong>${editing ? 'Urun duzenle' : 'Yeni urun olustur'}</strong>
                            <div style="display:flex; gap:0.4rem;">
                                <button onclick="UnitModule.resetExtruderDraft(false)" style="border:1px solid #cbd5e1; background:white; border-radius:0.4rem; padding:0.25rem 0.55rem; cursor:pointer;">Vazgec</button>
                                <button onclick="UnitModule.saveExtruderRow('${unitId}')" class="btn-primary" style="padding:0.3rem 0.6rem;">Kaydet</button>
                            </div>
                        </div>

                        <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem; flex-wrap:wrap;">
                            <button onclick="UnitModule.setExtruderDraftType('ROD')" style="border:1px solid ${draftType === 'ROD' ? '#2563eb' : '#cbd5e1'}; background:${draftType === 'ROD' ? '#eff6ff' : 'white'}; color:${draftType === 'ROD' ? '#1d4ed8' : '#334155'}; border-radius:0.55rem; padding:0.4rem 0.8rem; font-weight:700; cursor:pointer;">CUBUK</button>
                            <button onclick="UnitModule.setExtruderDraftType('PIPE')" style="border:1px solid ${draftType === 'PIPE' ? '#2563eb' : '#cbd5e1'}; background:${draftType === 'PIPE' ? '#eff6ff' : 'white'}; color:${draftType === 'PIPE' ? '#1d4ed8' : '#334155'}; border-radius:0.55rem; padding:0.4rem 0.8rem; font-weight:700; cursor:pointer;">BORU</button>
                            <button onclick="UnitModule.setExtruderDraftType('PROFILE')" style="border:1px solid ${draftType === 'PROFILE' ? '#2563eb' : '#cbd5e1'}; background:${draftType === 'PROFILE' ? '#eff6ff' : 'white'}; color:${draftType === 'PROFILE' ? '#1d4ed8' : '#334155'}; border-radius:0.55rem; padding:0.4rem 0.8rem; font-weight:700; cursor:pointer;">OZEL PROFIL</button>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:0.6rem;">
                            ${draftType === 'PROFILE' ? `
                                <div style="grid-column:span 4;">
                                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">profil adi *</label>
                                    <input id="ext_name" value="${UnitModule.escapeHtml(UnitModule.state.extruderDraftName || '')}" oninput="UnitModule.state.extruderDraftName=this.value" placeholder="40x40 kare profil" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                                </div>
                            ` : `
                                <div style="grid-column:span 2;">
                                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">cap (mm) *</label>
                                    <input id="ext_dia" type="number" min="0" value="${UnitModule.escapeHtml(String(UnitModule.state.extruderDraftDia || ''))}" oninput="UnitModule.state.extruderDraftDia=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                                </div>
                            `}
                            ${draftType === 'PIPE' ? `
                                <div style="grid-column:span 2;">
                                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">kalinlik (mm) *</label>
                                    <input id="ext_thick" type="number" min="0" value="${UnitModule.escapeHtml(String(UnitModule.state.extruderDraftThick || ''))}" oninput="UnitModule.state.extruderDraftThick=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                                </div>
                            ` : ''}
                            <div style="grid-column:span 2;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">boy (mm) *</label>
                                <input id="ext_len" type="number" min="0" value="${UnitModule.escapeHtml(String(UnitModule.state.extruderDraftLen || ''))}" oninput="UnitModule.state.extruderDraftLen=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                            </div>
                            <div style="grid-column:span 3;">
                                <label style="display:flex; justify-content:space-between; font-size:0.65rem; font-weight:700; color:#64748b; margin-bottom:0.4rem; margin-left:0.25rem;">
                                    RENK
                                    <button onclick="UnitModule.openColorModal('${unitId}')" style="color:#3b82f6; font-size:0.6rem; cursor:pointer; font-weight:700; background:none; border:none">[ + YONET (EKLE/SIL) ]</button>
                                </label>
                                <select id="ext_color" onchange="UnitModule.state.extruderDraftColor=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                                    <option value="">Seciniz</option>
                                    ${colors.map(c => `<option value="${UnitModule.escapeHtml(c)}" ${String(UnitModule.state.extruderDraftColor || '') === String(c) ? 'selected' : ''}>${UnitModule.escapeHtml(c)}</option>`).join('')}
                                </select>
                            </div>
                            <div style="grid-column:span 3;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">kart ID</label>
                                <input id="ext_card_id" disabled value="${UnitModule.escapeHtml(draftCode)}" style="width:100%; height:38px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace;">
                            </div>
                        </div>

                        ${draftType === 'ROD' ? `
                            <div style="margin-top:0.7rem;">
                                <label style="display:inline-flex; align-items:center; gap:0.45rem; font-size:0.84rem; color:#334155; font-weight:700;">
                                    <input id="ext_bubble" type="checkbox" ${UnitModule.state.extruderDraftBubble ? 'checked' : ''} onchange="UnitModule.state.extruderDraftBubble=this.checked">
                                    kabarcikli
                                </label>
                            </div>
                        ` : ''}

                        <div style="margin-top:0.7rem;">
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">not (opsiyonel)</label>
                            <textarea id="ext_note" rows="3" oninput="UnitModule.state.extruderDraftNote=this.value" placeholder="not ekle" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.5rem; resize:vertical;">${UnitModule.escapeHtml(UnitModule.state.extruderDraftNote || '')}</textarea>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // UI rule: form always opens above list rows.
        if (showForm) {
            const formEl = document.getElementById('ext_form_block');
            const listEl = document.getElementById('ext_list_block');
            if (formEl && listEl && listEl.parentElement) {
                listEl.parentElement.insertBefore(formEl, listEl);
            }
        }
    },
    setExtruderListFilter: (field, value, focusId) => {
        if (field === 'dia') UnitModule.state.extruderSearchDia = value || '';
        if (field === 'len') UnitModule.state.extruderSearchLen = value || '';
        if (field === 'color') UnitModule.state.extruderSearchColor = value || '';
        if (field === 'kind') UnitModule.state.extruderSearchKind = String(value || '').toUpperCase();
        if (field === 'code') UnitModule.state.extruderSearchCode = value || '';
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
    toggleExtruderForm: () => {
        if (UnitModule.state.extruderFormOpen || UnitModule.state.extruderEditingId) {
            UnitModule.resetExtruderDraft(false);
            return;
        }
        UnitModule.state.extruderFormOpen = true;
        UnitModule.state.extruderEditingId = null;
        UnitModule.state.extruderDraftType = 'ROD';
        UnitModule.state.extruderDraftName = '';
        UnitModule.state.extruderDraftDia = '';
        UnitModule.state.extruderDraftThick = '';
        UnitModule.state.extruderDraftLen = '';
        UnitModule.state.extruderDraftColor = '';
        UnitModule.state.extruderDraftBubble = false;
        UnitModule.state.extruderDraftNote = '';
        UI.renderCurrentPage();
    },
    setExtruderDraftType: (kind) => {
        UnitModule.state.extruderDraftType = kind;
        if (kind !== 'ROD') UnitModule.state.extruderDraftBubble = false;
        if (kind !== 'PIPE') UnitModule.state.extruderDraftThick = '';
        UI.renderCurrentPage();
    },
    selectExtruderRow: (id) => {
        UnitModule.state.extruderSelectedId = id;
        UI.renderCurrentPage();
    },
    editExtruderRow: (id) => {
        const row = (DB.data.data.extruderLibraryCards || []).find(x => x.id === id);
        if (!row) return;
        UnitModule.state.extruderFormOpen = true;
        UnitModule.state.extruderEditingId = id;
        UnitModule.state.extruderSelectedId = id;
        UnitModule.state.extruderDraftType = row.kind || 'ROD';
        UnitModule.state.extruderDraftName = row.productName || '';
        UnitModule.state.extruderDraftDia = Number.isFinite(Number(row.diameterMm)) ? String(row.diameterMm) : '';
        UnitModule.state.extruderDraftThick = Number.isFinite(Number(row.thicknessMm)) ? String(row.thicknessMm) : '';
        UnitModule.state.extruderDraftLen = Number.isFinite(Number(row.lengthMm)) ? String(row.lengthMm) : '';
        UnitModule.state.extruderDraftColor = row.color || '';
        UnitModule.state.extruderDraftBubble = !!row.isBubble;
        UnitModule.state.extruderDraftNote = row.note || '';
        UI.renderCurrentPage();
    },
    saveExtruderRow: async (unitId) => {
        const kind = String(UnitModule.state.extruderDraftType || 'ROD');
        const name = String(UnitModule.state.extruderDraftName || '').trim();
        const diaRaw = String(UnitModule.state.extruderDraftDia || '').trim();
        const thickRaw = String(UnitModule.state.extruderDraftThick || '').trim();
        const lenRaw = String(UnitModule.state.extruderDraftLen || '').trim();
        const color = String(UnitModule.state.extruderDraftColor || '').trim();
        const isBubble = !!UnitModule.state.extruderDraftBubble;
        const note = String(UnitModule.state.extruderDraftNote || '').trim();

        const dia = diaRaw === '' ? null : Number(diaRaw);
        const thick = thickRaw === '' ? null : Number(thickRaw);
        const len = lenRaw === '' ? null : Number(lenRaw);

        if (!Number.isFinite(len) || Number(len) <= 0) {
            alert('Boy (mm) zorunlu ve 0dan buyuk olmali.');
            return;
        }
        if (!color) {
            alert('Renk seciniz.');
            return;
        }

        if (kind === 'PROFILE') {
            if (!name) {
                alert('Ozel profil adi zorunlu.');
                return;
            }
        } else if (kind === 'ROD') {
            if (!Number.isFinite(dia) || Number(dia) <= 0) {
                alert('Cubuk icin cap zorunlu.');
                return;
            }
        } else if (kind === 'PIPE') {
            if (!Number.isFinite(dia) || Number(dia) <= 0) {
                alert('Boru icin cap zorunlu.');
                return;
            }
            if (!Number.isFinite(thick) || Number(thick) <= 0) {
                alert('Boru icin kalinlik zorunlu.');
                return;
            }
        }

        const productName = kind === 'PROFILE'
            ? name
            : `${kind === 'PIPE' ? 'O' + dia + ' Boru' : 'O' + dia + ' Cubuk'}`;

        if (!Array.isArray(DB.data.data.extruderLibraryCards)) DB.data.data.extruderLibraryCards = [];
        const all = DB.data.data.extruderLibraryCards;
        const now = new Date().toISOString();

        if (UnitModule.state.extruderEditingId) {
            const row = all.find(x => x.id === UnitModule.state.extruderEditingId);
            if (!row) return;
            row.kind = kind;
            row.productName = productName;
            row.diameterMm = Number.isFinite(dia) ? Number(dia) : null;
            row.thicknessMm = kind === 'PIPE' && Number.isFinite(thick) ? Number(thick) : null;
            row.lengthMm = Number(len);
            row.color = color;
            row.isBubble = kind === 'ROD' ? isBubble : false;
            row.note = note || '';
            row.updated_at = now;
            UnitModule.state.extruderSelectedId = row.id;
        } else {
            const rowId = crypto.randomUUID();
            all.push({
                id: rowId,
                unitId,
                cardCode: UnitModule.generateExtruderCardCode(),
                kind,
                productName,
                diameterMm: Number.isFinite(dia) ? Number(dia) : null,
                thicknessMm: kind === 'PIPE' && Number.isFinite(thick) ? Number(thick) : null,
                lengthMm: Number(len),
                color,
                isBubble: kind === 'ROD' ? isBubble : false,
                note: note || '',
                created_at: now,
                updated_at: now
            });
            UnitModule.state.extruderSelectedId = rowId;
        }

        await DB.save();
        UnitModule.resetExtruderDraft(false);
    },
    deleteExtruderRow: async (id) => {
        const row = (DB.data.data.extruderLibraryCards || []).find(x => x.id === id);
        if (!row) return;
        if (!confirm(`"${row.cardCode || 'Kayit'}" silinsin mi?`)) return;

        DB.data.data.extruderLibraryCards = (DB.data.data.extruderLibraryCards || []).filter(x => x.id !== id);
        if (UnitModule.state.extruderSelectedId === id) UnitModule.state.extruderSelectedId = null;
        if (UnitModule.state.extruderEditingId === id) UnitModule.resetExtruderDraft(false);
        await DB.save();
        UI.renderCurrentPage();
    },
    resetExtruderDraft: (keepOpen = false) => {
        UnitModule.state.extruderFormOpen = !!keepOpen;
        UnitModule.state.extruderEditingId = null;
        UnitModule.state.extruderDraftType = 'ROD';
        UnitModule.state.extruderDraftName = '';
        UnitModule.state.extruderDraftDia = '';
        UnitModule.state.extruderDraftThick = '';
        UnitModule.state.extruderDraftLen = '';
        UnitModule.state.extruderDraftColor = '';
        UnitModule.state.extruderDraftBubble = false;
        UnitModule.state.extruderDraftNote = '';
        UI.renderCurrentPage();
    },
    generateExtruderCardCode: () => {
        const all = DB.data.data.extruderLibraryCards || [];
        let maxNum = 0;
        all.forEach(row => {
            const code = String(row?.cardCode || '').toUpperCase();
            const match = code.match(/^EKS-(\d{1,12})$/);
            if (!match) return;
            const n = Number(match[1]);
            if (Number.isFinite(n) && n > maxNum) maxNum = n;
        });
        let nextNum = maxNum + 1;
        let candidate = `EKS-${String(nextNum).padStart(6, '0')}`;
        while (UnitModule.isGlobalCodeTaken(candidate)) {
            nextNum += 1;
            candidate = `EKS-${String(nextNum).padStart(6, '0')}`;
        }
        return candidate;
    },
    renderPlexiLibrary: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);
        if (!Array.isArray(DB.data.data.plexiPolishCards)) DB.data.data.plexiPolishCards = [];
        const showForm = UnitModule.state.plexiFormOpen || !!UnitModule.state.plexiEditingId;
        const canDelete = UnitModule.canManageUnitCodes();

        const cards = (DB.data.data.plexiPolishCards || [])
            .filter(x => x.unitId === unitId)
            .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

        const qName = String(UnitModule.state.plexiSearchName || '').trim().toLowerCase();
        const qId = String(UnitModule.state.plexiSearchId || '').trim().toLowerCase();
        const filtered = cards.filter(row => {
            const nameOk = !qName || String(row.processName || '').toLowerCase().includes(qName);
            const idOk = !qId
                || String(row.cardCode || '').toLowerCase().includes(qId)
                || String(row.id || '').toLowerCase().includes(qId);
            return nameOk && idOk;
        });

        const editing = UnitModule.state.plexiEditingId
            ? cards.find(x => x.id === UnitModule.state.plexiEditingId)
            : null;
        const draftCode = editing?.cardCode || UnitModule.generatePlexiCardCode();

        container.innerHTML = `
            <div style="max-width:1300px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap; margin-bottom:1rem; padding:0.2rem 0.1rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                        <button onclick="UnitModule.openUnit('${unitId}')" style="background:white; border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.45rem; cursor:pointer;">
                            <i data-lucide="arrow-left" width="18"></i>
                        </button>
                        <div>
                            <h2 class="page-title" style="margin:0; display:flex; gap:0.4rem; align-items:center;">
                                <i data-lucide="library" color="#1d4ed8"></i> Urun Kutuphanesi
                            </h2>
                            <div style="font-size:0.82rem; color:#64748b; font-weight:700;">${unit?.name || ''} - Islem envanteri</div>
                        </div>
                    </div>
                    <button onclick="UnitModule.togglePlexiForm()" class="btn-primary" style="padding:0.55rem 1.15rem; border-radius:0.75rem;">${showForm ? 'Vazgec' : 'Yeni islem ekle +'}</button>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem;">
                    <div style="display:flex; gap:0.6rem; margin-bottom:0.8rem; flex-wrap:wrap;">
                        <input id="plexi_search_name" value="${UnitModule.escapeHtml(UnitModule.state.plexiSearchName || '')}" oninput="UnitModule.setPlexiListFilter('name', this.value, 'plexi_search_name')" placeholder="islem adi ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                        <input id="plexi_search_id" value="${UnitModule.escapeHtml(UnitModule.state.plexiSearchId || '')}" oninput="UnitModule.setPlexiListFilter('id', this.value, 'plexi_search_id')" placeholder="ID ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                    </div>
                    <div id="plexi_list_block" class="card-table">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.75rem; text-transform:uppercase;">
                                    <th style="padding:0.65rem; text-align:left;">Islem adi</th>
                                    <th style="padding:0.65rem; text-align:center;">Ates</th>
                                    <th style="padding:0.65rem; text-align:center;">Firca</th>
                                    <th style="padding:0.65rem; text-align:center;">Firin (dk)</th>
                                    <th style="padding:0.65rem; text-align:left;">ID</th>
                                    <th style="padding:0.65rem; text-align:right;">Duzenle</th>
                                    <th style="padding:0.65rem; text-align:right;">Sec</th>
                                    <th style="padding:0.65rem; text-align:right;">Sil</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.length === 0 ? `<tr><td colspan="8" style="padding:1rem; text-align:center; color:#94a3b8;">Kayit bulunamadi.</td></tr>` : filtered.map(row => `
                                    <tr style="border-bottom:1px solid #f1f5f9; ${UnitModule.state.plexiSelectedId === row.id ? 'background:#ecfeff;' : ''}">
                                        <td style="padding:0.65rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.processName || '-')}</td>
                                        <td style="padding:0.65rem; text-align:center;">
                                            <span style="display:inline-block; min-width:48px; border:1px solid ${row.firePolish ? '#22c55e' : '#cbd5e1'}; background:${row.firePolish ? '#dcfce7' : 'white'}; color:${row.firePolish ? '#166534' : '#64748b'}; border-radius:999px; padding:0.15rem 0.5rem; font-size:0.73rem; font-weight:700;">${row.firePolish ? 'Var' : '-'}</span>
                                        </td>
                                        <td style="padding:0.65rem; text-align:center;">
                                            <span style="display:inline-block; min-width:48px; border:1px solid ${row.brushPolish ? '#22c55e' : '#cbd5e1'}; background:${row.brushPolish ? '#dcfce7' : 'white'}; color:${row.brushPolish ? '#166534' : '#64748b'}; border-radius:999px; padding:0.15rem 0.5rem; font-size:0.73rem; font-weight:700;">${row.brushPolish ? 'Var' : '-'}</span>
                                        </td>
                                        <td style="padding:0.65rem; text-align:center; font-weight:700; color:#0f766e;">${Number.isFinite(Number(row.ovenMinutes)) ? Number(row.ovenMinutes) : '-'}</td>
                                        <td style="padding:0.65rem; font-family:monospace; color:#64748b;">${UnitModule.escapeHtml(row.cardCode || '-')}</td>
                                        <td style="padding:0.65rem; text-align:right;">
                                            <button onclick="UnitModule.editPlexiRow('${row.id}')" class="btn-sm">duzenle</button>
                                        </td>
                                        <td style="padding:0.65rem; text-align:right;">
                                            <button onclick="UnitModule.selectPlexiRow('${row.id}')" class="btn-sm" style="${UnitModule.state.plexiSelectedId === row.id ? 'background:#0f172a; color:white; border-color:#0f172a' : ''}">sec</button>
                                        </td>
                                        <td style="padding:0.65rem; text-align:right;">
                                            <button onclick="UnitModule.deletePlexiRow('${row.id}')" class="btn-sm" ${canDelete ? '' : 'disabled'} style="${canDelete ? 'color:#b91c1c; border-color:#fecaca; background:#fef2f2;' : 'opacity:0.45; cursor:not-allowed;'}">sil</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${showForm ? `
                    <div id="plexi_form_block" style="background:white; border:2px solid #111827; border-radius:1rem; padding:1rem; margin-top:1rem; box-shadow:0 8px 18px rgba(15,23,42,0.08);">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.7rem;">
                            <strong>${editing ? 'Islem duzenle' : 'Yeni islem olustur'}</strong>
                            <div style="display:flex; gap:0.4rem;">
                                <button onclick="UnitModule.resetPlexiDraft(false)" style="border:1px solid #cbd5e1; background:white; border-radius:0.4rem; padding:0.25rem 0.55rem; cursor:pointer;">Vazgec</button>
                                <button onclick="UnitModule.savePlexiRow('${unitId}')" class="btn-primary" style="padding:0.3rem 0.6rem;">Kaydet</button>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:0.6rem;">
                            <div style="grid-column:span 7;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">islem adi (opsiyonel)</label>
                                <input id="plexi_process_name" value="${UnitModule.escapeHtml(UnitModule.state.plexiProcessName || '')}" oninput="UnitModule.state.plexiProcessName=this.value" placeholder="atesle parlatma" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                            </div>
                            <div style="grid-column:span 3;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">kart ID</label>
                                <input id="plexi_card_id" disabled value="${UnitModule.escapeHtml(draftCode)}" style="width:100%; height:38px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace;">
                            </div>
                            <div style="grid-column:span 2;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">firin (dk)</label>
                                <input id="plexi_oven_min" type="number" min="0" value="${UnitModule.escapeHtml(String(UnitModule.state.plexiOvenMinutes || ''))}" oninput="UnitModule.state.plexiOvenMinutes=this.value" placeholder="dk" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-weight:700;">
                            </div>
                        </div>

                        <div style="display:flex; gap:0.55rem; margin-top:0.75rem; flex-wrap:wrap;">
                            <button onclick="UnitModule.togglePlexiFlag('fire')" style="border:1px solid ${UnitModule.state.plexiUseFire ? '#22c55e' : '#cbd5e1'}; background:${UnitModule.state.plexiUseFire ? '#dcfce7' : 'white'}; color:${UnitModule.state.plexiUseFire ? '#166534' : '#334155'}; border-radius:0.55rem; padding:0.45rem 0.8rem; font-weight:700; cursor:pointer;">atesle polisaj ${UnitModule.state.plexiUseFire ? 'AKTIF' : '+'}</button>
                            <button onclick="UnitModule.togglePlexiFlag('brush')" style="border:1px solid ${UnitModule.state.plexiUseBrush ? '#22c55e' : '#cbd5e1'}; background:${UnitModule.state.plexiUseBrush ? '#dcfce7' : 'white'}; color:${UnitModule.state.plexiUseBrush ? '#166534' : '#334155'}; border-radius:0.55rem; padding:0.45rem 0.8rem; font-weight:700; cursor:pointer;">firca ile polisaj ${UnitModule.state.plexiUseBrush ? 'AKTIF' : '+'}</button>
                        </div>

                        <div style="margin-top:0.7rem;">
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">not (opsiyonel)</label>
                            <textarea id="plexi_note" rows="4" oninput="UnitModule.state.plexiNote=this.value" placeholder="not ekle" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.5rem; resize:vertical;">${UnitModule.escapeHtml(UnitModule.state.plexiNote || '')}</textarea>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // UI rule: form always opens above list rows.
        if (showForm) {
            const formEl = document.getElementById('plexi_form_block');
            const listEl = document.getElementById('plexi_list_block');
            if (formEl && listEl && listEl.parentElement) {
                listEl.parentElement.insertBefore(formEl, listEl);
            }
        }
    },
    setPlexiListFilter: (field, value, focusId) => {
        if (field === 'name') UnitModule.state.plexiSearchName = value || '';
        if (field === 'id') UnitModule.state.plexiSearchId = value || '';
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
    togglePlexiForm: () => {
        if (UnitModule.state.plexiFormOpen || UnitModule.state.plexiEditingId) {
            UnitModule.resetPlexiDraft(false);
            return;
        }
        UnitModule.state.plexiFormOpen = true;
        UnitModule.state.plexiEditingId = null;
        UnitModule.state.plexiProcessName = '';
        UnitModule.state.plexiUseFire = false;
        UnitModule.state.plexiUseBrush = false;
        UnitModule.state.plexiOvenMinutes = '';
        UnitModule.state.plexiNote = '';
        UI.renderCurrentPage();
    },
    togglePlexiFlag: (flag) => {
        if (flag === 'fire') UnitModule.state.plexiUseFire = !UnitModule.state.plexiUseFire;
        if (flag === 'brush') UnitModule.state.plexiUseBrush = !UnitModule.state.plexiUseBrush;
        UI.renderCurrentPage();
    },
    selectPlexiRow: (id) => {
        UnitModule.state.plexiSelectedId = id;
        UI.renderCurrentPage();
    },
    editPlexiRow: (id) => {
        const row = (DB.data.data.plexiPolishCards || []).find(x => x.id === id);
        if (!row) return;
        UnitModule.state.plexiFormOpen = true;
        UnitModule.state.plexiEditingId = id;
        UnitModule.state.plexiSelectedId = id;
        UnitModule.state.plexiProcessName = row.processName || '';
        UnitModule.state.plexiUseFire = !!row.firePolish;
        UnitModule.state.plexiUseBrush = !!row.brushPolish;
        UnitModule.state.plexiOvenMinutes = Number.isFinite(Number(row.ovenMinutes)) ? String(row.ovenMinutes) : '';
        UnitModule.state.plexiNote = row.note || '';
        UI.renderCurrentPage();
    },
    savePlexiRow: async (unitId) => {
        const processName = String(UnitModule.state.plexiProcessName || '').trim();
        const firePolish = !!UnitModule.state.plexiUseFire;
        const brushPolish = !!UnitModule.state.plexiUseBrush;
        const ovenRaw = String(UnitModule.state.plexiOvenMinutes || '').trim();
        const note = String(UnitModule.state.plexiNote || '').trim();

        let ovenMinutes = null;
        if (ovenRaw !== '') {
            ovenMinutes = Number(ovenRaw);
            if (!Number.isFinite(ovenMinutes) || ovenMinutes < 0) {
                alert('Firin suresi sayi olmali.');
                return;
            }
        }

        if (!processName && !firePolish && !brushPolish && ovenMinutes === null && !note) {
            alert('En az bir alan doldurun.');
            return;
        }

        if (!Array.isArray(DB.data.data.plexiPolishCards)) DB.data.data.plexiPolishCards = [];
        const all = DB.data.data.plexiPolishCards;
        const now = new Date().toISOString();

        if (UnitModule.state.plexiEditingId) {
            const row = all.find(x => x.id === UnitModule.state.plexiEditingId);
            if (!row) return;
            row.processName = processName || '';
            row.firePolish = firePolish;
            row.brushPolish = brushPolish;
            row.ovenMinutes = ovenMinutes;
            row.note = note || '';
            row.updated_at = now;
            UnitModule.state.plexiSelectedId = row.id;
        } else {
            const rowId = crypto.randomUUID();
            all.push({
                id: rowId,
                unitId,
                cardCode: UnitModule.generatePlexiCardCode(),
                processName: processName || '',
                firePolish,
                brushPolish,
                ovenMinutes,
                note: note || '',
                created_at: now,
                updated_at: now
            });
            UnitModule.state.plexiSelectedId = rowId;
        }

        await DB.save();
        UnitModule.resetPlexiDraft(false);
    },
    deletePlexiRow: async (id) => {
        if (!UnitModule.canManageUnitCodes()) {
            alert('Silme yetkisi sadece birim admin veya super admin icindir.');
            return;
        }
        const row = (DB.data.data.plexiPolishCards || []).find(x => x.id === id);
        if (!row) return;
        if (!confirm(`"${row.cardCode || 'Kayit'}" silinsin mi?`)) return;

        DB.data.data.plexiPolishCards = (DB.data.data.plexiPolishCards || []).filter(x => x.id !== id);
        if (UnitModule.state.plexiSelectedId === id) UnitModule.state.plexiSelectedId = null;
        if (UnitModule.state.plexiEditingId === id) UnitModule.resetPlexiDraft(false);
        await DB.save();
        UI.renderCurrentPage();
    },
    resetPlexiDraft: (keepOpen = false) => {
        UnitModule.state.plexiFormOpen = !!keepOpen;
        UnitModule.state.plexiEditingId = null;
        UnitModule.state.plexiProcessName = '';
        UnitModule.state.plexiUseFire = false;
        UnitModule.state.plexiUseBrush = false;
        UnitModule.state.plexiOvenMinutes = '';
        UnitModule.state.plexiNote = '';
        UI.renderCurrentPage();
    },
    generatePlexiCardCode: () => {
        const all = DB.data.data.plexiPolishCards || [];
        let maxNum = 0;
        all.forEach(row => {
            const code = String(row?.cardCode || '').toUpperCase();
            const match = code.match(/^PLSJ-(\d{1,12})$/);
            if (!match) return;
            const n = Number(match[1]);
            if (Number.isFinite(n) && n > maxNum) maxNum = n;
        });
        let nextNum = maxNum + 1;
        let candidate = `PLSJ-${String(nextNum).padStart(6, '0')}`;
        while (UnitModule.isGlobalCodeTaken(candidate)) {
            nextNum += 1;
            candidate = `PLSJ-${String(nextNum).padStart(6, '0')}`;
        }
        return candidate;
    },
    renderPvdLibrary: (container, unitId) => {
        const unit = (DB.data.data.units || []).find(u => u.id === unitId);
        if (!Array.isArray(DB.data.data.pvdCards)) DB.data.data.pvdCards = [];
        if (!DB.data.data.unitColors) DB.data.data.unitColors = {};
        if (!Array.isArray(DB.data.data.unitColors[unitId])) {
            DB.data.data.unitColors[unitId] = ['Titanyum Gold', 'Rose Gold', 'Siyah', 'Gumus'];
        }

        const showForm = UnitModule.state.pvdFormOpen || !!UnitModule.state.pvdEditingId;
        const cards = (DB.data.data.pvdCards || [])
            .filter(x => x.unitId === unitId)
            .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

        const qName = String(UnitModule.state.pvdSearchName || '').trim().toLowerCase();
        const qId = String(UnitModule.state.pvdSearchId || '').trim().toLowerCase();
        const filtered = cards.filter(row => {
            const nameOk = !qName || String(row.productName || '').toLowerCase().includes(qName);
            const idOk = !qId || String(row.cardCode || '').toLowerCase().includes(qId);
            return nameOk && idOk;
        });

        const editing = UnitModule.state.pvdEditingId
            ? cards.find(x => x.id === UnitModule.state.pvdEditingId)
            : null;
        const draftCode = editing?.cardCode || UnitModule.generatePvdCardCode();
        const colors = DB.data.data.unitColors[unitId] || [];

        container.innerHTML = `
            <div style="max-width:1300px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap; margin-bottom:1rem; padding:0.2rem 0.1rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                        <button onclick="UnitModule.openUnit('${unitId}')" style="background:white; border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.45rem; cursor:pointer;">
                            <i data-lucide="arrow-left" width="18"></i>
                        </button>
                        <div>
                            <h2 class="page-title" style="margin:0; display:flex; gap:0.4rem; align-items:center;">
                                <i data-lucide="library" color="#1d4ed8"></i> Urun Kutuphanesi
                            </h2>
                            <div style="font-size:0.82rem; color:#64748b; font-weight:700;">${unit?.name || ''} - Titanyum PVD renk envanteri</div>
                        </div>
                    </div>
                    <button onclick="UnitModule.togglePvdForm()" class="btn-primary" style="padding:0.55rem 1.15rem; border-radius:0.75rem;">${showForm ? 'Vazgec' : 'Yeni urun ekle +'}</button>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem;">
                    <div style="display:flex; gap:0.6rem; margin-bottom:0.8rem; flex-wrap:wrap;">
                        <input id="pvd_search_name" value="${UnitModule.escapeHtml(UnitModule.state.pvdSearchName || '')}" oninput="UnitModule.setPvdListFilter('name', this.value, 'pvd_search_name')" placeholder="urun adi ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                        <input id="pvd_search_id" value="${UnitModule.escapeHtml(UnitModule.state.pvdSearchId || '')}" oninput="UnitModule.setPvdListFilter('id', this.value, 'pvd_search_id')" placeholder="ID ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                    </div>
                    <div id="pvd_list_block" class="card-table">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.75rem; text-transform:uppercase;">
                                    <th style="padding:0.65rem; text-align:left;">Urun adi</th>
                                    <th style="padding:0.65rem; text-align:left;">Renk</th>
                                    <th style="padding:0.65rem; text-align:left;">Not</th>
                                    <th style="padding:0.65rem; text-align:left;">ID</th>
                                    <th style="padding:0.65rem; text-align:right;">Duzenle</th>
                                    <th style="padding:0.65rem; text-align:right;">Sec</th>
                                    <th style="padding:0.65rem; text-align:right;">Sil</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.length === 0 ? `<tr><td colspan="7" style="padding:1rem; text-align:center; color:#94a3b8;">Kayit bulunamadi.</td></tr>` : filtered.map(row => `
                                    <tr style="border-bottom:1px solid #f1f5f9; ${UnitModule.state.pvdSelectedId === row.id ? 'background:#ecfeff;' : ''}">
                                        <td style="padding:0.65rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.productName || '-')}</td>
                                        <td style="padding:0.65rem;">
                                            <span style="display:inline-block; border:1px solid #cbd5e1; border-radius:999px; padding:0.2rem 0.6rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.color || '-')}</span>
                                        </td>
                                        <td style="padding:0.65rem; color:#475569;">${UnitModule.escapeHtml(row.note || '-')}</td>
                                        <td style="padding:0.65rem; font-family:monospace; color:#64748b;">${UnitModule.escapeHtml(row.cardCode || '-')}</td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="UnitModule.editPvdRow('${row.id}')" class="btn-sm">duzenle</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="UnitModule.selectPvdRow('${row.id}')" class="btn-sm" style="${UnitModule.state.pvdSelectedId === row.id ? 'background:#0f172a; color:white; border-color:#0f172a' : ''}">sec</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="UnitModule.deletePvdRow('${row.id}')" class="btn-sm" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;">sil</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${showForm ? `
                    <div id="pvd_form_block" style="background:white; border:2px solid #111827; border-radius:1rem; padding:1rem; margin-top:1rem; box-shadow:0 8px 18px rgba(15,23,42,0.08);">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.7rem;">
                            <strong>${editing ? 'Urun duzenle' : 'Yeni urun olustur'}</strong>
                            <div style="display:flex; gap:0.4rem;">
                                <button onclick="UnitModule.resetPvdDraft(false)" style="border:1px solid #cbd5e1; background:white; border-radius:0.4rem; padding:0.25rem 0.55rem; cursor:pointer;">Vazgec</button>
                                <button onclick="UnitModule.savePvdRow('${unitId}')" class="btn-primary" style="padding:0.3rem 0.6rem;">Kaydet</button>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:0.6rem;">
                            <div style="grid-column:span 5;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">urun adi (opsiyonel)</label>
                                <input id="pvd_product_name" value="${UnitModule.escapeHtml(UnitModule.state.pvdProductName || '')}" oninput="UnitModule.state.pvdProductName=this.value" placeholder="ornek: 40x40 boru tutacak" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                            </div>
                            <div style="grid-column:span 4;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem; display:flex; justify-content:space-between;">
                                    renk
                                    <button onclick="UnitModule.openColorModal('${unitId}')" type="button" style="color:#2563eb; font-size:0.68rem; font-weight:800; background:none; border:none; cursor:pointer;">+ YONET (EKLE-SIL)</button>
                                </label>
                                <select id="pvd_color" onchange="UnitModule.state.pvdColor=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-weight:700;">
                                    <option value="">Renk seciniz</option>
                                    ${colors.map(c => `<option value="${UnitModule.escapeHtml(c)}" ${String(UnitModule.state.pvdColor || '') === String(c) ? 'selected' : ''}>${UnitModule.escapeHtml(c)}</option>`).join('')}
                                </select>
                            </div>
                            <div style="grid-column:span 3;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">kart ID</label>
                                <input id="pvd_card_id" disabled value="${UnitModule.escapeHtml(draftCode)}" style="width:100%; height:38px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace;">
                            </div>
                        </div>

                        <div style="margin-top:0.7rem;">
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">not (opsiyonel)</label>
                            <textarea id="pvd_note" rows="4" oninput="UnitModule.state.pvdNote=this.value" placeholder="not ekle" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.5rem; resize:vertical;">${UnitModule.escapeHtml(UnitModule.state.pvdNote || '')}</textarea>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        if (showForm) {
            const formEl = document.getElementById('pvd_form_block');
            const listEl = document.getElementById('pvd_list_block');
            if (formEl && listEl && listEl.parentElement) {
                listEl.parentElement.insertBefore(formEl, listEl);
            }
        }
    },
    setPvdListFilter: (field, value, focusId) => {
        if (field === 'name') UnitModule.state.pvdSearchName = value || '';
        if (field === 'id') UnitModule.state.pvdSearchId = value || '';
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
    togglePvdForm: () => {
        if (UnitModule.state.pvdFormOpen || UnitModule.state.pvdEditingId) {
            UnitModule.resetPvdDraft(false);
            return;
        }
        UnitModule.state.pvdFormOpen = true;
        UnitModule.state.pvdEditingId = null;
        UnitModule.state.pvdProductName = '';
        UnitModule.state.pvdColor = '';
        UnitModule.state.pvdNote = '';
        UI.renderCurrentPage();
    },
    selectPvdRow: (id) => {
        UnitModule.state.pvdSelectedId = id;
        UI.renderCurrentPage();
    },
    editPvdRow: (id) => {
        const row = (DB.data.data.pvdCards || []).find(x => x.id === id);
        if (!row) return;
        UnitModule.state.pvdFormOpen = true;
        UnitModule.state.pvdEditingId = id;
        UnitModule.state.pvdSelectedId = id;
        UnitModule.state.pvdProductName = row.productName || '';
        UnitModule.state.pvdColor = row.color || '';
        UnitModule.state.pvdNote = row.note || '';
        UI.renderCurrentPage();
    },
    savePvdRow: async (unitId) => {
        const productName = String(UnitModule.state.pvdProductName || '').trim();
        const color = String(UnitModule.state.pvdColor || '').trim();
        const note = String(UnitModule.state.pvdNote || '').trim();

        if (!color) return alert('Renk zorunlu.');

        if (!Array.isArray(DB.data.data.pvdCards)) DB.data.data.pvdCards = [];
        const all = DB.data.data.pvdCards;
        const now = new Date().toISOString();

        const hasSameColor = all.some(row =>
            row.unitId === unitId
            && String(row.color || '').toLowerCase() === color.toLowerCase()
            && row.id !== UnitModule.state.pvdEditingId
        );
        if (hasSameColor) {
            alert('Bu renk zaten tanimli. Ayni renkten ikinci kart acilamaz.');
            return;
        }

        if (UnitModule.state.pvdEditingId) {
            const row = all.find(x => x.id === UnitModule.state.pvdEditingId);
            if (!row) return;
            row.productName = productName;
            row.color = color;
            row.note = note || '';
            row.updated_at = now;
            UnitModule.state.pvdSelectedId = row.id;
        } else {
            const rowId = crypto.randomUUID();
            all.push({
                id: rowId,
                unitId,
                cardCode: UnitModule.generatePvdCardCode(),
                productName,
                color,
                note: note || '',
                created_at: now,
                updated_at: now
            });
            UnitModule.state.pvdSelectedId = rowId;
        }

        await DB.save();
        UnitModule.resetPvdDraft(false);
    },
    deletePvdRow: async (id) => {
        const row = (DB.data.data.pvdCards || []).find(x => x.id === id);
        if (!row) return;
        if (!confirm(`"${row.cardCode || 'Kayit'}" silinsin mi?`)) return;

        DB.data.data.pvdCards = (DB.data.data.pvdCards || []).filter(x => x.id !== id);
        if (UnitModule.state.pvdSelectedId === id) UnitModule.state.pvdSelectedId = null;
        if (UnitModule.state.pvdEditingId === id) UnitModule.resetPvdDraft(false);
        await DB.save();
        UI.renderCurrentPage();
    },
    resetPvdDraft: (keepOpen = false) => {
        UnitModule.state.pvdFormOpen = !!keepOpen;
        UnitModule.state.pvdEditingId = null;
        UnitModule.state.pvdProductName = '';
        UnitModule.state.pvdColor = '';
        UnitModule.state.pvdNote = '';
        UI.renderCurrentPage();
    },
    generatePvdCardCode: () => {
        const all = DB.data.data.pvdCards || [];
        let maxNum = 0;
        all.forEach(row => {
            const code = String(row?.cardCode || '').toUpperCase();
            const match = code.match(/^PVD-(\d{1,12})$/);
            if (!match) return;
            const n = Number(match[1]);
            if (Number.isFinite(n) && n > maxNum) maxNum = n;
        });
        let nextNum = maxNum + 1;
        let candidate = `PVD-${String(nextNum).padStart(6, '0')}`;
        while (UnitModule.isGlobalCodeTaken(candidate)) {
            nextNum += 1;
            candidate = `PVD-${String(nextNum).padStart(6, '0')}`;
        }
        return candidate;
    },
    ensurePolishSurfaceList: (unitId) => {
        if (!DB.data.data.polishSurfaceLists || typeof DB.data.data.polishSurfaceLists !== 'object') {
            DB.data.data.polishSurfaceLists = {};
        }
        if (!Array.isArray(DB.data.data.polishSurfaceLists[unitId])) {
            DB.data.data.polishSurfaceLists[unitId] = ['Parlak', 'Mat', 'Satine'];
        }
        return DB.data.data.polishSurfaceLists[unitId];
    },
    renderPolishLibrary: (container, unitId) => {
        const unit = (DB.data.data.units || []).find(u => u.id === unitId);
        if (!Array.isArray(DB.data.data.ibrahimPolishCards)) DB.data.data.ibrahimPolishCards = [];
        const surfaces = UnitModule.ensurePolishSurfaceList(unitId);
        const showForm = UnitModule.state.polishFormOpen || !!UnitModule.state.polishEditingId;

        const cards = (DB.data.data.ibrahimPolishCards || [])
            .filter(x => x.unitId === unitId)
            .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

        const qName = String(UnitModule.state.polishSearchName || '').trim().toLowerCase();
        const qId = String(UnitModule.state.polishSearchId || '').trim().toLowerCase();
        const filtered = cards.filter(row => {
            const nameOk = !qName || String(row.productName || '').toLowerCase().includes(qName);
            const idOk = !qId || String(row.cardCode || '').toLowerCase().includes(qId);
            return nameOk && idOk;
        });

        const editing = UnitModule.state.polishEditingId
            ? cards.find(x => x.id === UnitModule.state.polishEditingId)
            : null;
        const draftCode = editing?.cardCode || UnitModule.generatePolishCardCode();

        container.innerHTML = `
            <div style="max-width:1300px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap; margin-bottom:1rem; padding:0.2rem 0.1rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                        <button onclick="UnitModule.openUnit('${unitId}')" style="background:white; border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.45rem; cursor:pointer;">
                            <i data-lucide="arrow-left" width="18"></i>
                        </button>
                        <div>
                            <h2 class="page-title" style="margin:0; display:flex; gap:0.4rem; align-items:center;">
                                <i data-lucide="library" color="#1d4ed8"></i> Urun Kutuphanesi
                            </h2>
                            <div style="font-size:0.82rem; color:#64748b; font-weight:700;">${unit?.name || ''} - Yuzey envanteri</div>
                        </div>
                    </div>
                    <button onclick="UnitModule.togglePolishForm()" class="btn-primary" style="padding:0.55rem 1.15rem; border-radius:0.75rem;">${showForm ? 'Vazgec' : 'Yeni urun ekle +'}</button>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem;">
                    <div style="display:flex; gap:0.6rem; margin-bottom:0.8rem; flex-wrap:wrap;">
                        <input id="polish_search_name" value="${UnitModule.escapeHtml(UnitModule.state.polishSearchName || '')}" oninput="UnitModule.setPolishListFilter('name', this.value, 'polish_search_name')" placeholder="urun adi ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                        <input id="polish_search_id" value="${UnitModule.escapeHtml(UnitModule.state.polishSearchId || '')}" oninput="UnitModule.setPolishListFilter('id', this.value, 'polish_search_id')" placeholder="ID ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                    </div>
                    <div id="polish_list_block" class="card-table">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.75rem; text-transform:uppercase;">
                                    <th style="padding:0.65rem; text-align:left;">Urun adi</th>
                                    <th style="padding:0.65rem; text-align:left;">Yuzey</th>
                                    <th style="padding:0.65rem; text-align:left;">Not</th>
                                    <th style="padding:0.65rem; text-align:left;">ID</th>
                                    <th style="padding:0.65rem; text-align:right;">Duzenle</th>
                                    <th style="padding:0.65rem; text-align:right;">Sec</th>
                                    <th style="padding:0.65rem; text-align:right;">Sil</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.length === 0 ? `<tr><td colspan="7" style="padding:1rem; text-align:center; color:#94a3b8;">Kayit bulunamadi.</td></tr>` : filtered.map(row => `
                                    <tr style="border-bottom:1px solid #f1f5f9; ${UnitModule.state.polishSelectedId === row.id ? 'background:#ecfeff;' : ''}">
                                        <td style="padding:0.65rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.productName || '-')}</td>
                                        <td style="padding:0.65rem;"><span style="display:inline-block; border:1px solid #cbd5e1; border-radius:999px; padding:0.2rem 0.6rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.surface || '-')}</span></td>
                                        <td style="padding:0.65rem; color:#475569;">${UnitModule.escapeHtml(row.note || '-')}</td>
                                        <td style="padding:0.65rem; font-family:monospace; color:#64748b;">${UnitModule.escapeHtml(row.cardCode || '-')}</td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="UnitModule.editPolishRow('${row.id}')" class="btn-sm">duzenle</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="UnitModule.selectPolishRow('${row.id}')" class="btn-sm" style="${UnitModule.state.polishSelectedId === row.id ? 'background:#0f172a; color:white; border-color:#0f172a' : ''}">sec</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="UnitModule.deletePolishRow('${row.id}')" class="btn-sm" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;">sil</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${showForm ? `
                    <div id="polish_form_block" style="background:white; border:2px solid #111827; border-radius:1rem; padding:1rem; margin-top:1rem; box-shadow:0 8px 18px rgba(15,23,42,0.08);">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.7rem;">
                            <strong>${editing ? 'Urun duzenle' : 'Yeni urun olustur'}</strong>
                            <div style="display:flex; gap:0.4rem;">
                                <button onclick="UnitModule.resetPolishDraft(false)" style="border:1px solid #cbd5e1; background:white; border-radius:0.4rem; padding:0.25rem 0.55rem; cursor:pointer;">Vazgec</button>
                                <button onclick="UnitModule.savePolishRow('${unitId}')" class="btn-primary" style="padding:0.3rem 0.6rem;">Kaydet</button>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:0.6rem;">
                            <div style="grid-column:span 5;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">urun adi (opsiyonel)</label>
                                <input id="polish_product_name" value="${UnitModule.escapeHtml(UnitModule.state.polishProductName || '')}" oninput="UnitModule.state.polishProductName=this.value" placeholder="ornek: dikme basligi" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                            </div>
                            <div style="grid-column:span 4;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem; display:flex; justify-content:space-between;">
                                    yuzey
                                    <button type="button" onclick="UnitModule.openPolishSurfaceModal('${unitId}')" style="color:#2563eb; font-size:0.68rem; font-weight:800; background:none; border:none; cursor:pointer;">+ YONET (EKLE-SIL)</button>
                                </label>
                                <select id="polish_surface" onchange="UnitModule.state.polishSurface=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-weight:700;">
                                    <option value="">Yuzey seciniz</option>
                                    ${surfaces.map(s => `<option value="${UnitModule.escapeHtml(s)}" ${String(UnitModule.state.polishSurface || '') === String(s) ? 'selected' : ''}>${UnitModule.escapeHtml(s)}</option>`).join('')}
                                </select>
                            </div>
                            <div style="grid-column:span 3;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">kart ID</label>
                                <input id="polish_card_id" disabled value="${UnitModule.escapeHtml(draftCode)}" style="width:100%; height:38px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace;">
                            </div>
                        </div>

                        <div style="margin-top:0.7rem;">
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">not (opsiyonel)</label>
                            <textarea id="polish_note" rows="4" oninput="UnitModule.state.polishNote=this.value" placeholder="not ekle" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.5rem; resize:vertical;">${UnitModule.escapeHtml(UnitModule.state.polishNote || '')}</textarea>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        if (showForm) {
            const formEl = document.getElementById('polish_form_block');
            const listEl = document.getElementById('polish_list_block');
            if (formEl && listEl && listEl.parentElement) {
                listEl.parentElement.insertBefore(formEl, listEl);
            }
        }
    },
    setPolishListFilter: (field, value, focusId) => {
        if (field === 'name') UnitModule.state.polishSearchName = value || '';
        if (field === 'id') UnitModule.state.polishSearchId = value || '';
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
    togglePolishForm: () => {
        if (UnitModule.state.polishFormOpen || UnitModule.state.polishEditingId) {
            UnitModule.resetPolishDraft(false);
            return;
        }
        UnitModule.state.polishFormOpen = true;
        UnitModule.state.polishEditingId = null;
        UnitModule.state.polishProductName = '';
        UnitModule.state.polishSurface = '';
        UnitModule.state.polishNote = '';
        UI.renderCurrentPage();
    },
    selectPolishRow: (id) => {
        UnitModule.state.polishSelectedId = id;
        UI.renderCurrentPage();
    },
    editPolishRow: (id) => {
        const row = (DB.data.data.ibrahimPolishCards || []).find(x => x.id === id);
        if (!row) return;
        UnitModule.state.polishFormOpen = true;
        UnitModule.state.polishEditingId = id;
        UnitModule.state.polishSelectedId = id;
        UnitModule.state.polishProductName = row.productName || '';
        UnitModule.state.polishSurface = row.surface || '';
        UnitModule.state.polishNote = row.note || '';
        UI.renderCurrentPage();
    },
    savePolishRow: async (unitId) => {
        const productName = String(UnitModule.state.polishProductName || '').trim();
        const surface = String(UnitModule.state.polishSurface || '').trim();
        const note = String(UnitModule.state.polishNote || '').trim();
        if (!surface) return alert('Yuzey zorunlu.');

        if (!Array.isArray(DB.data.data.ibrahimPolishCards)) DB.data.data.ibrahimPolishCards = [];
        const all = DB.data.data.ibrahimPolishCards;
        const now = new Date().toISOString();

        if (UnitModule.state.polishEditingId) {
            const row = all.find(x => x.id === UnitModule.state.polishEditingId);
            if (!row) return;
            row.productName = productName;
            row.surface = surface;
            row.note = note || '';
            row.updated_at = now;
            UnitModule.state.polishSelectedId = row.id;
        } else {
            const rowId = crypto.randomUUID();
            all.push({
                id: rowId,
                unitId,
                cardCode: UnitModule.generatePolishCardCode(),
                productName,
                surface,
                note: note || '',
                created_at: now,
                updated_at: now
            });
            UnitModule.state.polishSelectedId = rowId;
        }

        await DB.save();
        UnitModule.resetPolishDraft(false);
    },
    deletePolishRow: async (id) => {
        const row = (DB.data.data.ibrahimPolishCards || []).find(x => x.id === id);
        if (!row) return;
        if (!confirm(`"${row.cardCode || 'Kayit'}" silinsin mi?`)) return;

        DB.data.data.ibrahimPolishCards = (DB.data.data.ibrahimPolishCards || []).filter(x => x.id !== id);
        if (UnitModule.state.polishSelectedId === id) UnitModule.state.polishSelectedId = null;
        if (UnitModule.state.polishEditingId === id) UnitModule.resetPolishDraft(false);
        await DB.save();
        UI.renderCurrentPage();
    },
    resetPolishDraft: (keepOpen = false) => {
        UnitModule.state.polishFormOpen = !!keepOpen;
        UnitModule.state.polishEditingId = null;
        UnitModule.state.polishProductName = '';
        UnitModule.state.polishSurface = '';
        UnitModule.state.polishNote = '';
        UI.renderCurrentPage();
    },
    generatePolishCardCode: () => {
        const all = DB.data.data.ibrahimPolishCards || [];
        let maxNum = 0;
        all.forEach(row => {
            const code = String(row?.cardCode || '').toUpperCase();
            const match = code.match(/^IPS-(\d{1,12})$/);
            if (!match) return;
            const n = Number(match[1]);
            if (Number.isFinite(n) && n > maxNum) maxNum = n;
        });
        let nextNum = maxNum + 1;
        let candidate = `IPS-${String(nextNum).padStart(6, '0')}`;
        while (UnitModule.isGlobalCodeTaken(candidate)) {
            nextNum += 1;
            candidate = `IPS-${String(nextNum).padStart(6, '0')}`;
        }
        return candidate;
    },
    openPolishSurfaceModal: (unitId) => {
        const surfaces = UnitModule.ensurePolishSurfaceList(unitId);
        const old = document.getElementById('polishSurfaceModalOverlay');
        if (old) old.remove();

        const modalHtml = `
            <div id="polishSurfaceModalOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center">
                <div style="background:white; width:420px; border-radius:1.25rem; padding:1.2rem; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h3 style="font-weight:800; color:#334155; margin:0;">Yuzey Listesi</h3>
                        <button onclick="document.getElementById('polishSurfaceModalOverlay').remove()" style="background:none; border:none; color:#94a3b8; cursor:pointer"><i data-lucide="x" width="20"></i></button>
                    </div>
                    <div style="display:flex; gap:0.5rem; margin-bottom:1rem;">
                        <input id="polishSurfaceInput" placeholder="Yeni yuzey..." style="flex:1; padding:0.7rem; border:1px solid #cbd5e1; border-radius:0.65rem; font-weight:700;">
                        <button onclick="UnitModule.addPolishSurface('${unitId}')" style="background:#2563eb; color:white; border:none; border-radius:0.65rem; padding:0 1rem; font-weight:800; cursor:pointer;">Ekle</button>
                    </div>
                    <div style="max-height:280px; overflow-y:auto; display:flex; flex-direction:column; gap:0.45rem;">
                        ${surfaces.length === 0 ? '<div style="text-align:center; color:#94a3b8; padding:1rem;">Yuzey yok.</div>' : ''}
                        ${surfaces.map(s => {
                            const safe = String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                            return `<div style="display:flex; justify-content:space-between; align-items:center; border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem 0.7rem;">
                                <span style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(s)}</span>
                                <button onclick="UnitModule.deletePolishSurface('${unitId}','${safe}')" style="background:none; border:none; color:#dc2626; cursor:pointer;">sil</button>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (window.lucide) window.lucide.createIcons();
        const input = document.getElementById('polishSurfaceInput');
        if (input) input.focus();
    },
    addPolishSurface: async (unitId) => {
        const val = String(document.getElementById('polishSurfaceInput')?.value || '').trim();
        if (!val) return;
        const arr = UnitModule.ensurePolishSurfaceList(unitId);
        const exists = arr.some(x => String(x).toLowerCase() === val.toLowerCase());
        if (exists) return alert('Bu yuzey zaten var.');
        arr.push(val);
        await DB.save();
        UnitModule.openPolishSurfaceModal(unitId);
        if (UnitModule.state.activeUnitId === unitId) UI.renderCurrentPage();
    },
    deletePolishSurface: async (unitId, surface) => {
        if (!confirm(`${surface} silinsin mi?`)) return;
        const arr = UnitModule.ensurePolishSurfaceList(unitId);
        DB.data.data.polishSurfaceLists[unitId] = arr.filter(x => x !== surface);
        await DB.save();
        UnitModule.openPolishSurfaceModal(unitId);
        if (UnitModule.state.activeUnitId === unitId) UI.renderCurrentPage();
    },
    ensureProcessColorLists: (unitId) => {
        if (!DB.data.data.processColorLists || typeof DB.data.data.processColorLists !== 'object') {
            DB.data.data.processColorLists = {};
        }
        if (!DB.data.data.processColorLists[unitId] || typeof DB.data.data.processColorLists[unitId] !== 'object') {
            DB.data.data.processColorLists[unitId] = {};
        }
        const store = DB.data.data.processColorLists[unitId];
        if (!Array.isArray(store.ELOKSAL)) store.ELOKSAL = ['Sampanya', 'Inox', 'Siyah', 'Bronz'];
        if (!Array.isArray(store.STATIK_BOYA)) store.STATIK_BOYA = ['Mat Siyah', 'Antrasit', 'Beyaz', 'Krem'];
        return store;
    },
    renderEloksalLibrary: (container, unitId) => {
        const unit = (DB.data.data.units || []).find(u => u.id === unitId);
        if (!Array.isArray(DB.data.data.eloksalCards)) DB.data.data.eloksalCards = [];
        const processColors = UnitModule.ensureProcessColorLists(unitId);
        const showForm = UnitModule.state.elxFormOpen || !!UnitModule.state.elxEditingId;

        const cards = (DB.data.data.eloksalCards || [])
            .filter(x => x.unitId === unitId)
            .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

        const qName = String(UnitModule.state.elxSearchName || '').trim().toLowerCase();
        const qId = String(UnitModule.state.elxSearchId || '').trim().toLowerCase();
        const filtered = cards.filter(row => {
            const nameOk = !qName || String(row.productName || '').toLowerCase().includes(qName);
            const idOk = !qId || String(row.cardCode || '').toLowerCase().includes(qId);
            return nameOk && idOk;
        });

        const editing = UnitModule.state.elxEditingId
            ? cards.find(x => x.id === UnitModule.state.elxEditingId)
            : null;
        const processType = UnitModule.state.elxProcessType || 'ELOKSAL';
        const colorsForProcess = Array.isArray(processColors[processType]) ? processColors[processType] : [];
        const draftCode = editing?.cardCode || UnitModule.generateEloksalCardCode(processType);

        container.innerHTML = `
            <div style="max-width:1300px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap; margin-bottom:1rem; padding:0.2rem 0.1rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                        <button onclick="UnitModule.openUnit('${unitId}')" style="background:white; border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.45rem; cursor:pointer;">
                            <i data-lucide="arrow-left" width="18"></i>
                        </button>
                        <div>
                            <h2 class="page-title" style="margin:0; display:flex; gap:0.4rem; align-items:center;">
                                <i data-lucide="library" color="#1d4ed8"></i> Urun Kutuphanesi
                            </h2>
                            <div style="font-size:0.82rem; color:#64748b; font-weight:700;">${unit?.name || ''} - Eloksal / Statik Boya envanteri</div>
                        </div>
                    </div>
                    <button onclick="UnitModule.toggleEloksalForm()" class="btn-primary" style="padding:0.55rem 1.15rem; border-radius:0.75rem;">${showForm ? 'Vazgec' : 'Yeni urun ekle +'}</button>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem;">
                    <div style="display:flex; gap:0.6rem; margin-bottom:0.8rem; flex-wrap:wrap;">
                        <input id="elx_search_name" value="${UnitModule.escapeHtml(UnitModule.state.elxSearchName || '')}" oninput="UnitModule.setEloksalListFilter('name', this.value, 'elx_search_name')" placeholder="urun adi ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                        <input id="elx_search_id" value="${UnitModule.escapeHtml(UnitModule.state.elxSearchId || '')}" oninput="UnitModule.setEloksalListFilter('id', this.value, 'elx_search_id')" placeholder="ID ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                    </div>
                    <div id="elx_list_block" class="card-table">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.75rem; text-transform:uppercase;">
                                    <th style="padding:0.65rem; text-align:left;">Urun adi</th>
                                    <th style="padding:0.65rem; text-align:left;">Islem tipi</th>
                                    <th style="padding:0.65rem; text-align:left;">Renk</th>
                                    <th style="padding:0.65rem; text-align:left;">Not</th>
                                    <th style="padding:0.65rem; text-align:left;">ID</th>
                                    <th style="padding:0.65rem; text-align:right;">Duzenle</th>
                                    <th style="padding:0.65rem; text-align:right;">Sec</th>
                                    <th style="padding:0.65rem; text-align:right;">Sil</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.length === 0 ? `<tr><td colspan="8" style="padding:1rem; text-align:center; color:#94a3b8;">Kayit bulunamadi.</td></tr>` : filtered.map(row => `
                                    <tr style="border-bottom:1px solid #f1f5f9; ${UnitModule.state.elxSelectedId === row.id ? 'background:#ecfeff;' : ''}">
                                        <td style="padding:0.65rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.productName || '-')}</td>
                                        <td style="padding:0.65rem;">
                                            <span style="display:inline-block; border:1px solid #cbd5e1; border-radius:999px; padding:0.2rem 0.6rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.processType || '-')}</span>
                                        </td>
                                        <td style="padding:0.65rem;">
                                            <span style="display:inline-block; border:1px solid #cbd5e1; border-radius:999px; padding:0.2rem 0.6rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.color || '-')}</span>
                                        </td>
                                        <td style="padding:0.65rem; color:#475569;">${UnitModule.escapeHtml(row.note || '-')}</td>
                                        <td style="padding:0.65rem; font-family:monospace; color:#64748b;">${UnitModule.escapeHtml(row.cardCode || '-')}</td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="UnitModule.editEloksalRow('${row.id}')" class="btn-sm">duzenle</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="UnitModule.selectEloksalRow('${row.id}')" class="btn-sm" style="${UnitModule.state.elxSelectedId === row.id ? 'background:#0f172a; color:white; border-color:#0f172a' : ''}">sec</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="UnitModule.deleteEloksalRow('${row.id}')" class="btn-sm" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;">sil</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${showForm ? `
                    <div id="elx_form_block" style="background:white; border:2px solid #111827; border-radius:1rem; padding:1rem; margin-top:1rem; box-shadow:0 8px 18px rgba(15,23,42,0.08);">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.7rem;">
                            <strong>${editing ? 'Urun duzenle' : 'Yeni urun olustur'}</strong>
                            <div style="display:flex; gap:0.4rem;">
                                <button onclick="UnitModule.resetEloksalDraft(false)" style="border:1px solid #cbd5e1; background:white; border-radius:0.4rem; padding:0.25rem 0.55rem; cursor:pointer;">Vazgec</button>
                                <button onclick="UnitModule.saveEloksalRow('${unitId}')" class="btn-primary" style="padding:0.3rem 0.6rem;">Kaydet</button>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:0.6rem;">
                            <div style="grid-column:span 4;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">urun adi (opsiyonel)</label>
                                <input id="elx_product_name" value="${UnitModule.escapeHtml(UnitModule.state.elxProductName || '')}" oninput="UnitModule.state.elxProductName=this.value" placeholder="ornek: dikme basligi" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                            </div>
                            <div style="grid-column:span 5;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">islem tipi (tek secim)</label>
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:0.5rem;">
                                    <button type="button" onclick="UnitModule.setEloksalProcessType('ELOKSAL', false); UnitModule.openProcessColorModal('${unitId}', 'ELOKSAL')" style="height:26px; width:100%; border:1px solid #0f172a; background:white; color:#2563eb; border-radius:0.5rem; padding:0 0.45rem; font-size:0.72rem; font-weight:800; cursor:pointer; white-space:nowrap; display:flex; align-items:center; justify-content:center;">YONET (EKLE-SIL)</button>
                                    <button type="button" onclick="UnitModule.setEloksalProcessType('STATIK_BOYA', false); UnitModule.openProcessColorModal('${unitId}', 'STATIK_BOYA')" style="height:26px; width:100%; border:1px solid #0f172a; background:white; color:#2563eb; border-radius:0.5rem; padding:0 0.45rem; font-size:0.72rem; font-weight:800; cursor:pointer; white-space:nowrap; display:flex; align-items:center; justify-content:center;">YONET (EKLE-SIL)</button>
                                </div>
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
                                    <button type="button" onclick="UnitModule.setEloksalProcessType('ELOKSAL')" style="height:38px; width:100%; border:1px solid ${processType === 'ELOKSAL' ? '#0f172a' : '#cbd5e1'}; background:${processType === 'ELOKSAL' ? '#0f172a' : 'white'}; color:${processType === 'ELOKSAL' ? 'white' : '#334155'}; border-radius:0.55rem; padding:0 0.85rem; font-weight:800; cursor:pointer;">ELOKSAL</button>
                                    <button type="button" onclick="UnitModule.setEloksalProcessType('STATIK_BOYA')" style="height:38px; width:100%; border:1px solid ${processType === 'STATIK_BOYA' ? '#0f172a' : '#cbd5e1'}; background:${processType === 'STATIK_BOYA' ? '#0f172a' : 'white'}; color:${processType === 'STATIK_BOYA' ? 'white' : '#334155'}; border-radius:0.55rem; padding:0 0.85rem; font-weight:800; cursor:pointer;">STATIK BOYA</button>
                                </div>
                            </div>
                            <div style="grid-column:span 3;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">kart ID</label>
                                <input id="elx_card_id" disabled value="${UnitModule.escapeHtml(draftCode)}" style="width:100%; height:38px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace;">
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:0.6rem; margin-top:0.7rem;">
                            <div style="grid-column:span 12;">
                                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.6rem; flex-wrap:wrap; margin-bottom:0.2rem;"><label style="display:block; font-size:0.74rem; color:#64748b;">renk</label></div>
                                <select id="elx_color" onchange="UnitModule.state.elxColor=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-weight:700;">
                                    <option value="">Renk seciniz</option>
                                    ${colorsForProcess.map(c => `<option value="${UnitModule.escapeHtml(c)}" ${String(UnitModule.state.elxColor || '') === String(c) ? 'selected' : ''}>${UnitModule.escapeHtml(c)}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div style="margin-top:0.7rem;">
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">not (opsiyonel)</label>
                            <textarea id="elx_note" rows="4" oninput="UnitModule.state.elxNote=this.value" placeholder="not ekle" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.5rem; resize:vertical;">${UnitModule.escapeHtml(UnitModule.state.elxNote || '')}</textarea>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        if (showForm) {
            const formEl = document.getElementById('elx_form_block');
            const listEl = document.getElementById('elx_list_block');
            if (formEl && listEl && listEl.parentElement) {
                listEl.parentElement.insertBefore(formEl, listEl);
            }
        }
    },
    setEloksalProcessType: (type, rerender = true) => {
        const nextType = type === 'STATIK_BOYA' ? 'STATIK_BOYA' : 'ELOKSAL';
        UnitModule.state.elxProcessType = nextType;
        const unitId = UnitModule.state.activeUnitId;
        const processColors = UnitModule.ensureProcessColorLists(unitId);
        const options = Array.isArray(processColors[nextType]) ? processColors[nextType] : [];
        if (!options.includes(UnitModule.state.elxColor)) UnitModule.state.elxColor = '';
        if (rerender) UI.renderCurrentPage();
    },
    setEloksalListFilter: (field, value, focusId) => {
        if (field === 'name') UnitModule.state.elxSearchName = value || '';
        if (field === 'id') UnitModule.state.elxSearchId = value || '';
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
    toggleEloksalForm: () => {
        if (UnitModule.state.elxFormOpen || UnitModule.state.elxEditingId) {
            UnitModule.resetEloksalDraft(false);
            return;
        }
        UnitModule.state.elxFormOpen = true;
        UnitModule.state.elxEditingId = null;
        UnitModule.state.elxProductName = '';
        UnitModule.state.elxProcessType = 'ELOKSAL';
        UnitModule.state.elxColor = '';
        UnitModule.state.elxNote = '';
        UI.renderCurrentPage();
    },
    selectEloksalRow: (id) => {
        UnitModule.state.elxSelectedId = id;
        UI.renderCurrentPage();
    },
    editEloksalRow: (id) => {
        const row = (DB.data.data.eloksalCards || []).find(x => x.id === id);
        if (!row) return;
        UnitModule.state.elxFormOpen = true;
        UnitModule.state.elxEditingId = id;
        UnitModule.state.elxSelectedId = id;
        UnitModule.state.elxProductName = row.productName || '';
        UnitModule.state.elxProcessType = row.processType || 'ELOKSAL';
        UnitModule.state.elxColor = row.color || '';
        UnitModule.state.elxNote = row.note || '';
        UI.renderCurrentPage();
    },
    saveEloksalRow: async (unitId) => {
        const productName = String(UnitModule.state.elxProductName || '').trim();
        const processType = UnitModule.state.elxProcessType === 'STATIK_BOYA' ? 'STATIK_BOYA' : 'ELOKSAL';
        const color = String(UnitModule.state.elxColor || '').trim();
        const note = String(UnitModule.state.elxNote || '').trim();

        if (!color) return alert('Renk zorunlu.');

        if (!Array.isArray(DB.data.data.eloksalCards)) DB.data.data.eloksalCards = [];
        const all = DB.data.data.eloksalCards;
        const now = new Date().toISOString();

        const hasSameColor = all.some(row =>
            row.unitId === unitId
            && String(row.color || '').toLowerCase() === color.toLowerCase()
            && row.id !== UnitModule.state.elxEditingId
        );
        if (hasSameColor) {
            alert('Bu renk zaten tanimli. ELOKSAL ve STATIK BOYA icin tekrar acilamaz.');
            return;
        }

        if (UnitModule.state.elxEditingId) {
            const row = all.find(x => x.id === UnitModule.state.elxEditingId);
            if (!row) return;
            const oldType = row.processType || 'ELOKSAL';
            row.processType = processType;
            row.cardCode = oldType === processType ? row.cardCode : UnitModule.generateEloksalCardCode(processType);
            row.productName = productName;
            row.color = color;
            row.note = note || '';
            row.updated_at = now;
            UnitModule.state.elxSelectedId = row.id;
        } else {
            const rowId = crypto.randomUUID();
            all.push({
                id: rowId,
                unitId,
                processType,
                cardCode: UnitModule.generateEloksalCardCode(processType),
                productName,
                color,
                note: note || '',
                created_at: now,
                updated_at: now
            });
            UnitModule.state.elxSelectedId = rowId;
        }

        await DB.save();
        UnitModule.resetEloksalDraft(false);
    },
    deleteEloksalRow: async (id) => {
        const row = (DB.data.data.eloksalCards || []).find(x => x.id === id);
        if (!row) return;
        if (!confirm(`"${row.cardCode || 'Kayit'}" silinsin mi?`)) return;

        DB.data.data.eloksalCards = (DB.data.data.eloksalCards || []).filter(x => x.id !== id);
        if (UnitModule.state.elxSelectedId === id) UnitModule.state.elxSelectedId = null;
        if (UnitModule.state.elxEditingId === id) UnitModule.resetEloksalDraft(false);
        await DB.save();
        UI.renderCurrentPage();
    },
    resetEloksalDraft: (keepOpen = false) => {
        UnitModule.state.elxFormOpen = !!keepOpen;
        UnitModule.state.elxEditingId = null;
        UnitModule.state.elxProductName = '';
        UnitModule.state.elxProcessType = 'ELOKSAL';
        UnitModule.state.elxColor = '';
        UnitModule.state.elxNote = '';
        UI.renderCurrentPage();
    },
    generateEloksalCardCode: (processType) => {
        const type = processType === 'STATIK_BOYA' ? 'STATIK_BOYA' : 'ELOKSAL';
        const prefix = type === 'STATIK_BOYA' ? 'STB' : 'ELX';
        const all = DB.data.data.eloksalCards || [];
        let maxNum = 0;
        all.forEach(row => {
            const code = String(row?.cardCode || '').toUpperCase();
            const match = code.match(new RegExp(`^${prefix}-(\\d{1,12})$`));
            if (!match) return;
            const n = Number(match[1]);
            if (Number.isFinite(n) && n > maxNum) maxNum = n;
        });
        let nextNum = maxNum + 1;
        let candidate = `${prefix}-${String(nextNum).padStart(6, '0')}`;
        while (UnitModule.isGlobalCodeTaken(candidate)) {
            nextNum += 1;
            candidate = `${prefix}-${String(nextNum).padStart(6, '0')}`;
        }
        return candidate;
    },
    openProcessColorModal: (unitId, processType) => {
        const type = processType === 'STATIK_BOYA' ? 'STATIK_BOYA' : 'ELOKSAL';
        UnitModule.state.elxProcessType = type;
        const lists = UnitModule.ensureProcessColorLists(unitId);
        const colors = lists[type] || [];

        const old = document.getElementById('processColorModalOverlay');
        if (old) old.remove();

        const modalHtml = `
            <div id="processColorModalOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center">
                <div style="background:white; width:430px; border-radius:1.25rem; padding:1.2rem; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h3 style="font-weight:800; color:#334155; margin:0;">${type === 'ELOKSAL' ? 'Eloksal' : 'Statik Boya'} Renkleri</h3>
                        <button onclick="document.getElementById('processColorModalOverlay').remove()" style="background:none; border:none; color:#94a3b8; cursor:pointer"><i data-lucide="x" width="20"></i></button>
                    </div>
                    <div style="display:flex; gap:0.5rem; margin-bottom:1rem;">
                        <input id="processColorInput" placeholder="Yeni renk..." style="flex:1; padding:0.7rem; border:1px solid #cbd5e1; border-radius:0.65rem; font-weight:700;">
                        <button onclick="UnitModule.addProcessColor('${unitId}','${type}')" style="background:#2563eb; color:white; border:none; border-radius:0.65rem; padding:0 1rem; font-weight:800; cursor:pointer;">Ekle</button>
                    </div>
                    <div style="max-height:280px; overflow-y:auto; display:flex; flex-direction:column; gap:0.45rem;">
                        ${colors.length === 0 ? '<div style="text-align:center; color:#94a3b8; padding:1rem;">Renk yok.</div>' : ''}
                        ${colors.map(c => {
                            const colorArg = String(c).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                            return `<div style="display:flex; justify-content:space-between; align-items:center; border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem 0.7rem;">
                                <span style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(c)}</span>
                                <button onclick="UnitModule.deleteProcessColor('${unitId}','${type}','${colorArg}')" style="background:none; border:none; color:#dc2626; cursor:pointer;">sil</button>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (window.lucide) window.lucide.createIcons();
        const input = document.getElementById('processColorInput');
        if (input) input.focus();
    },
    addProcessColor: async (unitId, processType) => {
        const type = processType === 'STATIK_BOYA' ? 'STATIK_BOYA' : 'ELOKSAL';
        UnitModule.state.elxProcessType = type;
        const val = String(document.getElementById('processColorInput')?.value || '').trim();
        if (!val) return;
        const lists = UnitModule.ensureProcessColorLists(unitId);
        const arr = lists[type] || [];
        const exists = arr.some(c => String(c).toLowerCase() === val.toLowerCase());
        if (exists) return alert('Bu renk zaten var.');
        arr.push(val);
        lists[type] = arr;
        await DB.save();
        const activeUnitId = UnitModule.state.activeUnitId;
        UnitModule.openProcessColorModal(unitId, type);
        if (activeUnitId === unitId) UI.renderCurrentPage();
    },
    deleteProcessColor: async (unitId, processType, color) => {
        const type = processType === 'STATIK_BOYA' ? 'STATIK_BOYA' : 'ELOKSAL';
        UnitModule.state.elxProcessType = type;
        if (!confirm(`${color} silinsin mi?`)) return;
        const lists = UnitModule.ensureProcessColorLists(unitId);
        lists[type] = (lists[type] || []).filter(c => c !== color);
        await DB.save();
        const activeUnitId = UnitModule.state.activeUnitId;
        UnitModule.openProcessColorModal(unitId, type);
        if (activeUnitId === unitId) UI.renderCurrentPage();
    },
    canManageUnitCodes: () => {
        const role = String(DB.data?.meta?.activeRole || 'super-admin').toLowerCase();
        if (role === 'super-admin') return true;
        if (role === 'birim-admin' || role === 'unit-admin') return true;
        if (role === 'birim_admin' || role === 'unit_admin') return true;
        return role.includes('admin') && (role.includes('birim') || role.includes('unit'));
    },
    escapeHtml: (value) => {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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
        if (!unit.name.includes('EKSTRÃƒÆ’Ã…â€œDER')) {
            container.innerHTML = `<div style="text-align:center; padding:4rem; color:#94a3b8"><h3>ÃƒÂ¢Ã¢â‚¬ÂºÃ¢â‚¬Â Bu birim iÃƒÆ’Ã‚Â§in stok yÃƒÆ’Ã‚Â¶netimi aktif deÃƒâ€Ã…Â¸il.</h3></div>`;
            return;
        }

        const tab = UnitModule.state.stockTab;
        const inventory = (DB.data.data.inventory || []).filter(i => i.unitId === unitId && i.category === tab);

        // Ensure Colors Exist
        if (!DB.data.data.unitColors) DB.data.data.unitColors = {};
        if (!DB.data.data.unitColors[unitId]) DB.data.data.unitColors[unitId] = ['ÃƒÂ¯Ã‚Â¿Ã‚Â½?effaf', 'Beyaz', 'Siyah', 'Antrasit'];
        const colors = DB.data.data.unitColors[unitId];

        // Specific Header for Extruder
        const title = unit.name.includes('EKSTRÃƒÆ’Ã…â€œDER') ? 'EKSTRÃƒÆ’Ã…â€œDER STOK EKLEME PANELÃƒâ€Ã‚Â°' : `${unit.name} STOK PANELÃƒâ€Ã‚Â°`;

        container.innerHTML = `
            <div style="margin-bottom:2rem; padding-left:0.25rem">
                <h1 style="font-size:1.8rem; font-weight:700; color:#1e293b; display:flex; align-items:center; gap:0.75rem">
                    <span style="color:#10b981"><i data-lucide="box" width="32" height="32"></i></span> ${title}
                </h1>
            </div>

            <!-- TABS -->
            <div style="display:flex; gap:0.5rem; margin-bottom:0; padding-left:0.25rem">
                <button onclick="UnitModule.setStockTab('ROD')" class="tab-btn ${tab === 'ROD' ? 'active' : ''}">ÃƒÆ’Ã¢â‚¬Â¡UBUK</button>
                <button onclick="UnitModule.setStockTab('PIPE')" class="tab-btn ${tab === 'PIPE' ? 'active' : ''}">BORU</button>
                <button onclick="UnitModule.setStockTab('PROFILE')" class="tab-btn ${tab === 'PROFILE' ? 'active' : ''}">ÃƒÆ’Ã¢â‚¬â€œZEL PROFÃƒâ€Ã‚Â°LLER</button>
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
                        HIZLI STOK GÃƒâ€Ã‚Â°RÃƒâ€Ã‚Â°ÃƒÂ¯Ã‚Â¿Ã‚Â½?Ãƒâ€Ã‚Â° (${tab === 'ROD' ? '<span style="color:#059669">ÃƒÆ’Ã¢â‚¬Â¡UBUK</span>' : tab === 'PIPE' ? '<span style="color:#059669">BORU</span>' : '<span style="color:#059669">PROFÃƒâ€Ã‚Â°L</span>'})
                    </div>
                    
                    <div style="display:grid; grid-template-columns: repeat(12, 1fr); gap:1rem; align-items:end">
                        ${tab === 'PROFILE' ? `
                            <div style="grid-column:span 2">
                                <label class="lbl">PROFÃƒâ€Ã‚Â°L ADI</label>
                                <input id="stk_name" class="inp" placeholder="40x40 Kare">
                            </div>
                        ` : `
                            <div style="grid-column:span 1">
                                <label class="lbl">ÃƒÆ’Ã¢â‚¬Â¡AP (mm)</label>
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
                                <button onclick="UnitModule.openColorModal('${unitId}')" style="color:#3b82f6; font-size:0.6rem; cursor:pointer; font-weight:700; background:none; border:none">[ + YÃƒÆ’Ã¢â‚¬â€œNET (EKLE/SÃƒâ€Ã‚Â°L) ]</button>
                            </label>
                            <select id="stk_col" class="inp" style="cursor:pointer">
                                <option value="TanÃƒâ€Ã‚Â±msÃƒâ€Ã‚Â±z">SeÃƒÆ’Ã‚Â§iniz</option>
                                ${colors.map(c => `<option value="${c}">${c}</option>`).join('')}
                            </select>
                        </div>

                        ${tab === 'ROD' ? `
                            <div style="grid-column:span 1; display:flex; justify-content:center; padding-bottom:0.8rem">
                                <label style="display:flex; flex-direction:column; align-items:center; cursor:pointer">
                                    <input id="stk_bub" type="checkbox" style="width:1.25rem; height:1.25rem; accent-color:#10b981; cursor:pointer">
                                    <span style="font-size:0.6rem; font-weight:700; color:#64748b; margin-top:0.25rem">KabarcÃƒâ€Ã‚Â±klÃƒâ€Ã‚Â±</span>
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
                                    <i data-lucide="save" width="18" height="18"></i> GÃƒÆ’Ã…â€œNCELLE
                                </button>
                                <button onclick="UnitModule.cancelEdit()" class="btn-primary" style="flex:1; height:42px; background:#94a3b8; box-shadow:0 4px 6px -1px rgba(148, 163, 184, 0.2); display:flex; align-items:center; justify-content:center; gap:0.5rem">
                                    <i data-lucide="rotate-ccw" width="18" height="18"></i> VAZGEÃƒÆ’Ã¢â‚¬Â¡
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
                                <th style="font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">ÃƒÆ’Ã…â€œrÃƒÆ’Ã‚Â¼n AdÃƒâ€Ã‚Â±</th>
                                <th style="text-align:center; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">ÃƒÆ’Ã¢â‚¬Â¡ap (mm)</th>
                                ${tab === 'PIPE' ? '<th style="text-align:center; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">KalÃƒâ€Ã‚Â±nlÃƒâ€Ã‚Â±k</th>' : ''}
                                <th style="text-align:center; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Boy (mm)</th>
                                <th style="text-align:center; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Renk</th>
                                <th style="text-align:center; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">ÃƒÆ’Ã¢â‚¬â€œzellik</th>
                                <th style="text-align:center; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Not / Adres</th>
                                <th style="text-align:right; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Miktar / Hedef</th>
                                <th style="text-align:right; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Ãƒâ€Ã‚Â°Ãƒâ€¦Ã…Â¸lem</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${inventory.length === 0 ? `<tr><td colspan="10" style="text-align:center; padding:4rem; color:#94a3b8"><div style="display:flex; justify-content:center; margin-bottom:1rem"><div style="background:#f8fafc; padding:1.5rem; border-radius:50%"><i data-lucide="box" width="32" height="32" color="#cbd5e1"></i></div></div><div style="font-weight:700; margin-bottom:0.5rem">Stok kaydÃƒâ€Ã‚Â± bulunamadÃƒâ€Ã‚Â±</div><div style="font-size:0.85rem">Bu kategori iÃƒÆ’Ã‚Â§in henÃƒÆ’Ã‚Â¼z giriÃƒâ€¦Ã…Â¸ yapÃƒâ€Ã‚Â±lmamÃƒâ€Ã‚Â±Ãƒâ€¦Ã…Â¸.</div></td></tr>` : ''}
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
        if (!DB.data.data.unitColors) DB.data.data.unitColors = {};
        if (!Array.isArray(DB.data.data.unitColors[unitId])) {
            DB.data.data.unitColors[unitId] = ['Seffaf', 'Beyaz', 'Siyah', 'Antrasit'];
        }
        const colors = DB.data.data.unitColors[unitId] || [];
        const normalize = (txt) => String(txt || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
        const swatchColor = (name) => {
            const n = normalize(name);
            if (n.includes('seffaf') || n.includes('saydam') || n.includes('transparan')) return 'transparent';
            if (n.includes('siyah')) return '#000000';
            if (n.includes('beyaz')) return '#ffffff';
            if (n.includes('antrasit')) return '#374151';
            if (n.includes('sari')) return '#facc15';
            if (n.includes('kirmizi')) return '#ef4444';
            if (n.includes('mavi')) return '#2563eb';
            if (n.includes('yesil')) return '#22c55e';
            if (n.includes('gri')) return '#9ca3af';
            return '#cbd5e1';
        };

        const old = document.getElementById('colorModalOverlay');
        if (old) old.remove();

        const modalHtml = `
            <div id="colorModalOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center">
                <div style="background:white; width:400px; border-radius:1.5rem; padding:1.5rem; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); animation: zoomIn 0.2s">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
                        <h3 style="font-weight:800; color:#334155; display:flex; align-items:center; gap:0.5rem">
                            <i data-lucide="palette" color="#a855f7" width="20"></i> Renk Kutuphanesi
                        </h3>
                        <button onclick="document.getElementById('colorModalOverlay').remove()" style="background:none; border:none; color:#94a3b8; cursor:pointer"><i data-lucide="x" width="20"></i></button>
                    </div>

                    <div style="display:flex; gap:0.5rem; margin-bottom:1.5rem">
                        <input id="newColorInput" placeholder="Yeni renk ismi..." style="flex:1; padding:0.75rem; border:2px solid #e2e8f0; border-radius:0.75rem; font-weight:700; color:#475569; outline:none; font-size:0.9rem">
                        <button onclick="UnitModule.addColor('${unitId}')" style="background:#a855f7; color:white; border:none; padding:0 1.25rem; border-radius:0.75rem; font-weight:800; cursor:pointer; box-shadow:0 4px 6px -1px rgba(168, 85, 247, 0.3)">Ekle</button>
                    </div>

                    <div style="max-height:300px; overflow-y:auto; display:flex; flex-direction:column; gap:0.5rem">
                        ${colors.length === 0 ? '<div style="text-align:center; color:#cbd5e1; padding:1rem">Henuz renk eklenmemis.</div>' : ''}
                        ${colors.map(c => {
                            const colorArg = String(c).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                            return `
                                <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:0.75rem 1rem; border-radius:0.75rem; border:1px solid #f1f5f9">
                                    <div style="display:flex; align-items:center; gap:0.75rem">
                                        <div style="width:16px; height:16px; border-radius:50%; border:1px solid #cbd5e1; background:${swatchColor(c)}"></div>
                                        <span style="font-weight:700; color:#475569; font-size:0.9rem; text-transform:uppercase">${UnitModule.escapeHtml(c)}</span>
                                    </div>
                                    <button onclick="UnitModule.deleteColor('${unitId}','${colorArg}')" style="background:none; border:none; color:#cbd5e1; cursor:pointer; transition:color 0.2s" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#cbd5e1'"><i data-lucide="trash-2" width="14"></i></button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (window.lucide) window.lucide.createIcons();
        const input = document.getElementById('newColorInput');
        if (input) input.focus();
    },

    addColor: async (unitId) => {
        const val = document.getElementById('newColorInput')?.value.trim() || '';
        if (!val) return;
        if (!Array.isArray(DB.data.data.unitColors?.[unitId])) DB.data.data.unitColors[unitId] = [];

        const exists = DB.data.data.unitColors[unitId].some(c => String(c).toLowerCase() === val.toLowerCase());
        if (exists) {
            alert('Bu renk zaten var.');
            return;
        }

        DB.data.data.unitColors[unitId].push(val);
        await DB.save();
        const overlay = document.getElementById('colorModalOverlay');
        if (overlay) overlay.remove();
        UI.renderCurrentPage();
        UnitModule.openColorModal(unitId);
    },

    deleteColor: async (unitId, color) => {
        if (!confirm(color + ' silinsin mi?')) return;
        DB.data.data.unitColors[unitId] = (DB.data.data.unitColors[unitId] || []).filter(c => c !== color);
        await DB.save();
        const overlay = document.getElementById('colorModalOverlay');
        if (overlay) overlay.remove();
        UI.renderCurrentPage();
        UnitModule.openColorModal(unitId);
    },
    openUnit: (id) => { if (id === 'u_dtm') return UnitModule.openDepoTransfer(); UnitModule.state.activeUnitId = id; UnitModule.state.view = 'dashboard'; UI.renderCurrentPage(); },
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
            if (document.getElementById('stk_col')) document.getElementById('stk_col').value = item.color || 'TanÃƒâ€Ã‚Â±msÃƒâ€Ã‚Â±z';
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
        if (tab === 'ROD') name = `ÃƒÆ’Ã‹Å“${dia} ÃƒÆ’Ã¢â‚¬Â¡ubuk`;
        else if (tab === 'PIPE') name = `ÃƒÆ’Ã‹Å“${dia} Boru`;
        else name = nameInp || 'ÃƒÆ’Ã¢â‚¬â€œzel Profil';

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
        if (confirm('Silmek istediginize emin misiniz?')) {
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
