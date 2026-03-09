const StockModule = {
    state: {
        topTab: 'all',
        selectedKey: 'managed:main',
        searchName: '',
        searchCategory: '',
        searchCode: '',
        depotDraftName: '',
        depotDraftNote: '',
        locationDraftRaf: '',
        locationDraftCell: '',
        locationDraftNote: ''
    },

    ensureData: () => {
        if (!DB.data || typeof DB.data !== 'object') DB.data = {};
        if (!DB.data.data || typeof DB.data.data !== 'object') DB.data.data = {};
        if (!DB.data.meta || typeof DB.data.meta !== 'object') DB.data.meta = {};
        if (!DB.data.meta.seedFlags || typeof DB.data.meta.seedFlags !== 'object') DB.data.meta.seedFlags = {};
        if (!Array.isArray(DB.data.data.stockDepots)) DB.data.data.stockDepots = [];
        if (!Array.isArray(DB.data.data.stockDepotLocations)) DB.data.data.stockDepotLocations = [];
        if (!Array.isArray(DB.data.data.stockDepotItems)) DB.data.data.stockDepotItems = [];
        if (!Array.isArray(DB.data.data.depoTransferTasks)) DB.data.data.depoTransferTasks = [];
        if (!Array.isArray(DB.data.data.freeExternalVendorJobs)) DB.data.data.freeExternalVendorJobs = [];
        if (!Array.isArray(DB.data.data.suppliers)) DB.data.data.suppliers = [];

        let changed = false;
        if (!DB.data.meta.seedFlags.stockDepotsSeededV3) {
            if (DB.data.data.stockDepots.length === 0) {
                DB.data.data.stockDepots = [
                    {
                        id: 'depot_granul',
                        name: 'GRANUL DEPO',
                        note: 'Hammadde ve granul icin ayrilan fiziksel alan',
                        isActive: true,
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 'depot_profil',
                        name: 'PROFIL DEPO',
                        note: 'Profil ve uzun malzemeler icin ayrilan fiziksel alan',
                        isActive: true,
                        created_at: new Date().toISOString()
                    }
                ];
                changed = true;
            }
            if (DB.data.data.stockDepotLocations.length === 0) {
                DB.data.data.stockDepotLocations = [
                    { id: crypto.randomUUID(), depotId: 'main', rafCode: 'R01', cellCode: 'A1', note: 'Giris tarafi ilk raf', created_at: new Date().toISOString() },
                    { id: crypto.randomUUID(), depotId: 'main', rafCode: 'R01', cellCode: 'A2', note: '', created_at: new Date().toISOString() },
                    { id: crypto.randomUUID(), depotId: 'main', rafCode: 'R02', cellCode: 'A1', note: '', created_at: new Date().toISOString() },
                    { id: crypto.randomUUID(), depotId: 'depot_granul', rafCode: 'R01', cellCode: 'A1', note: '', created_at: new Date().toISOString() },
                    { id: crypto.randomUUID(), depotId: 'depot_profil', rafCode: 'R01', cellCode: 'A1', note: '', created_at: new Date().toISOString() }
                ];
                changed = true;
            }
            DB.data.meta.seedFlags.stockDepotsSeededV3 = true;
            changed = true;
        }

        (DB.data.data.stockDepots || []).forEach((row) => {
            if (!row.created_at) {
                row.created_at = new Date().toISOString();
                changed = true;
            }
        });
        (DB.data.data.stockDepotLocations || []).forEach((row) => {
            if (!row.created_at) {
                row.created_at = new Date().toISOString();
                changed = true;
            }
        });

        if (changed) DB.markDirty();
    },

    escapeHtml: (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;'),

    normalize: (value) => String(value || '').trim().toLocaleLowerCase('tr-TR'),

    render: (container) => {
        if (!container) return;
        StockModule.ensureData();
        container.innerHTML = StockModule.renderLayout();
        if (window.lucide) window.lucide.createIcons();
    },

    getMainDepot: () => ({
        id: 'main',
        key: 'managed:main',
        name: 'Ana depo',
        note: 'Merkez fiziksel depo adresleri burada tutulur.',
        kind: 'managed',
        editable: false,
        allowLocations: true
    }),

    getCustomDepots: () => {
        return (DB.data.data.stockDepots || [])
            .filter((row) => row?.isActive !== false)
            .slice()
            .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'tr'))
            .map((row) => ({
                ...row,
                key: `managed:${String(row?.id || '')}`,
                kind: 'managed',
                editable: true,
                allowLocations: true
            }));
    },

    getUnitRowsMeta: () => {
        return (DB.data?.data?.units || [])
            .filter((row) => String(row?.type || '') === 'internal')
            .slice()
            .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'tr'))
            .map((row) => ({
                ...row,
                key: String(row?.id || '') === 'u_dtm' ? 'transfer:u_dtm' : `unit:${String(row?.id || '')}`,
                kind: String(row?.id || '') === 'u_dtm' ? 'transfer' : 'unit',
                editable: false,
                allowLocations: false
            }));
    },

    getExternalRowsMeta: () => {
        const unitRows = (DB.data?.data?.units || [])
            .filter((row) => String(row?.type || '') === 'external')
            .slice()
            .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'tr'))
            .map((row) => ({
                ...row,
                key: `external:${String(row?.id || '')}`,
                kind: 'external',
                editable: false,
                allowLocations: false
            }));
        return [
            ...unitRows,
            {
                id: 'free_external',
                key: 'external:free',
                name: 'serbest dis fason',
                note: 'Kayitli olmayan veya tek seferlik dis birim referansi',
                kind: 'external',
                editable: false,
                allowLocations: false
            }
        ];
    },

    getSelectedNode: () => {
        const key = String(StockModule.state.selectedKey || 'managed:main');
        if (key === 'managed:main') return StockModule.getMainDepot();
        if (key.startsWith('managed:')) {
            const depotId = key.split(':').slice(1).join(':');
            return StockModule.getCustomDepots().find((row) => String(row?.id || '') === depotId) || StockModule.getMainDepot();
        }
        if (key === 'transfer:u_dtm') {
            const unit = (DB.data?.data?.units || []).find((row) => String(row?.id || '') === 'u_dtm');
            return {
                id: 'u_dtm',
                key,
                name: unit?.name || 'Depo Transfer',
                note: 'Burasi fiziksel adres degil; transfer akislarinda referans olarak gorunur.',
                kind: 'transfer',
                editable: false,
                allowLocations: false
            };
        }
        if (key.startsWith('unit:')) {
            const unitId = key.split(':').slice(1).join(':');
            const unit = (DB.data?.data?.units || []).find((row) => String(row?.id || '') === unitId);
            if (unit) {
                return {
                    ...unit,
                    key,
                    name: unit.name,
                    note: 'Atolye alani; fiziksel operasyon burada degil, sadece referans bilgisi tutulur.',
                    kind: 'unit',
                    editable: false,
                    allowLocations: false
                };
            }
        }
        if (key === 'external:free') {
            return {
                id: 'free_external',
                key,
                name: 'serbest dis fason',
                note: 'Kayitli olmayan veya tek seferlik dis birim referansi',
                kind: 'external',
                editable: false,
                allowLocations: false
            };
        }
        if (key.startsWith('external:')) {
            const unitId = key.split(':').slice(1).join(':');
            const unit = (DB.data?.data?.units || []).find((row) => String(row?.id || '') === unitId);
            if (unit) {
                return {
                    ...unit,
                    key,
                    name: unit.name,
                    note: 'Dis birim veya fason nokta; burada sadece yonlendirme amacli listelenir.',
                    kind: 'external',
                    editable: false,
                    allowLocations: false
                };
            }
        }
        return StockModule.getMainDepot();
    },

    getDepotLocations: (depotId) => {
        return (DB.data.data.stockDepotLocations || [])
            .filter((row) => String(row?.depotId || '') === String(depotId || ''))
            .slice()
            .sort((a, b) => {
                const rafCmp = String(a?.rafCode || '').localeCompare(String(b?.rafCode || ''), 'tr');
                if (rafCmp !== 0) return rafCmp;
                return String(a?.cellCode || '').localeCompare(String(b?.cellCode || ''), 'tr');
            });
    },

    getLocationCode: (location) => {
        const rafCode = String(location?.rafCode || '').trim().toUpperCase();
        const cellCode = String(location?.cellCode || '').trim().toUpperCase();
        if (rafCode && cellCode) return `${rafCode}-${cellCode}`;
        if (rafCode) return rafCode;
        return cellCode || '-';
    },

    getManagedSummary: (depotId) => {
        const locations = StockModule.getDepotLocations(depotId);
        const rafCount = new Set(locations.map((row) => String(row?.rafCode || '').trim().toUpperCase()).filter(Boolean)).size;
        const notedCount = locations.filter((row) => String(row?.note || '').trim()).length;
        return {
            locationCount: locations.length,
            rafCount,
            notedCount
        };
    },

    getOverviewSummary: () => {
        const customDepots = StockModule.getCustomDepots();
        const managedIds = new Set(['main', ...customDepots.map((row) => String(row?.id || ''))]);
        const managedCount = managedIds.size;
        const locationCount = (DB.data.data.stockDepotLocations || []).filter((row) => managedIds.has(String(row?.depotId || ''))).length;
        const unitCount = StockModule.getUnitRowsMeta().filter((row) => row.kind === 'unit').length;
        const externalCount = StockModule.getExternalRowsMeta().length;
        return { managedCount, locationCount, unitCount, externalCount };
    },

    getFilteredLocations: (node) => {
        const qName = StockModule.normalize(StockModule.state.searchName);
        const qCategory = StockModule.normalize(StockModule.state.searchCategory);
        const qCode = StockModule.normalize(StockModule.state.searchCode);
        return StockModule.getDepotLocations(node.id).filter((row) => {
            const code = StockModule.normalize(StockModule.getLocationCode(row));
            const depotName = StockModule.normalize(node?.name || '');
            const note = StockModule.normalize(row?.note || '');
            const rafCode = StockModule.normalize(row?.rafCode || '');
            const cellCode = StockModule.normalize(row?.cellCode || '');
            const nameOk = !qName || depotName.includes(qName) || note.includes(qName);
            const categoryOk = !qCategory || rafCode.includes(qCategory) || cellCode.includes(qCategory) || note.includes(qCategory);
            const codeOk = !qCode || code.includes(qCode);
            return nameOk && categoryOk && codeOk;
        });
    },

    setTopTab: (tabId) => {
        StockModule.state.topTab = String(tabId || 'all');
        if (StockModule.state.topTab === 'transfer') {
            StockModule.state.selectedKey = 'transfer:u_dtm';
        } else if (String(StockModule.state.selectedKey || '') === 'transfer:u_dtm') {
            StockModule.state.selectedKey = 'managed:main';
        }
        UI.renderCurrentPage();
    },

    selectNode: (key) => {
        StockModule.state.selectedKey = String(key || 'managed:main');
        StockModule.state.topTab = StockModule.state.selectedKey === 'transfer:u_dtm' ? 'transfer' : 'all';
        UI.renderCurrentPage();
    },

    setSearch: (field, value) => {
        if (field === 'name') StockModule.state.searchName = String(value || '');
        if (field === 'category') StockModule.state.searchCategory = String(value || '');
        if (field === 'code') StockModule.state.searchCode = String(value || '');
        UI.renderCurrentPage();
    },

    setDraftField: (field, value) => {
        if (field === 'depotName') StockModule.state.depotDraftName = String(value || '');
        if (field === 'depotNote') StockModule.state.depotDraftNote = String(value || '');
        if (field === 'locRaf') StockModule.state.locationDraftRaf = String(value || '').toUpperCase();
        if (field === 'locCell') StockModule.state.locationDraftCell = String(value || '').toUpperCase();
        if (field === 'locNote') StockModule.state.locationDraftNote = String(value || '');
    },

    openDepotEditModal: (depotId) => {
        const depot = (DB.data.data.stockDepots || []).find((row) => String(row?.id || '') === String(depotId || ''));
        if (!depot) return;
        Modal.open('Depo Duzenle', `
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
                <div>
                    <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Depo adi</label>
                    <input id="stock_depot_edit_name" value="${StockModule.escapeHtml(depot.name || '')}" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                </div>
                <div>
                    <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Aciklama / not</label>
                    <textarea id="stock_depot_edit_note" rows="3" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.55rem; resize:vertical;">${StockModule.escapeHtml(depot.note || '')}</textarea>
                </div>
                <div style="display:flex; justify-content:space-between; gap:0.5rem;">
                    <button class="btn-sm" onclick="StockModule.deleteDepot('${StockModule.escapeHtml(depot.id || '')}')">Sil</button>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn-sm" onclick="Modal.close()">Vazgec</button>
                        <button class="btn-primary" onclick="StockModule.saveDepotEdit('${StockModule.escapeHtml(depot.id || '')}')">Kaydet</button>
                    </div>
                </div>
            </div>
        `);
    },

    saveDepotEdit: async (depotId) => {
        const depot = (DB.data.data.stockDepots || []).find((row) => String(row?.id || '') === String(depotId || ''));
        if (!depot) return;
        const name = String(document.getElementById('stock_depot_edit_name')?.value || '').trim();
        const note = String(document.getElementById('stock_depot_edit_note')?.value || '').trim();
        if (!name) return alert('Depo adi zorunlu.');
        depot.name = name.toUpperCase();
        depot.note = note;
        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },

    deleteDepot: async (depotId) => {
        const hasLocations = (DB.data.data.stockDepotLocations || []).some((row) => String(row?.depotId || '') === String(depotId || ''));
        if (hasLocations) {
            alert('Bu depoda kayitli hucreler var. Once hucreleri silin.');
            return;
        }
        const depot = (DB.data.data.stockDepots || []).find((row) => String(row?.id || '') === String(depotId || ''));
        if (!depot) return;
        if (!confirm('Bu depoyu listeden kaldirmak istiyor musunuz?')) return;
        depot.isActive = false;
        if (String(StockModule.state.selectedKey || '') === `managed:${String(depotId || '')}`) {
            StockModule.state.selectedKey = 'managed:main';
        }
        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },

    saveDepotInline: async () => {
        const name = String(StockModule.state.depotDraftName || '').trim();
        const note = String(StockModule.state.depotDraftNote || '').trim();
        if (!name) return alert('Depo adi zorunlu.');
        const newId = crypto.randomUUID();
        DB.data.data.stockDepots.push({
            id: newId,
            name: name.toUpperCase(),
            note,
            isActive: true,
            created_at: new Date().toISOString()
        });
        StockModule.state.depotDraftName = '';
        StockModule.state.depotDraftNote = '';
        StockModule.state.selectedKey = `managed:${newId}`;
        StockModule.state.topTab = 'all';
        await DB.save();
        UI.renderCurrentPage();
    },

    openLocationEditModal: (locationId) => {
        const location = (DB.data.data.stockDepotLocations || []).find((row) => String(row?.id || '') === String(locationId || ''));
        if (!location) return;
        Modal.open('Hucre Duzenle', `
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.65rem;">
                    <div>
                        <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Raf kodu</label>
                        <input id="stock_loc_edit_raf" value="${StockModule.escapeHtml(location.rafCode || '')}" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Hucre kodu</label>
                        <input id="stock_loc_edit_cell" value="${StockModule.escapeHtml(location.cellCode || '')}" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                    </div>
                </div>
                <div>
                    <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Not</label>
                    <textarea id="stock_loc_edit_note" rows="3" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.55rem; resize:vertical;">${StockModule.escapeHtml(location.note || '')}</textarea>
                </div>
                <div style="display:flex; justify-content:space-between; gap:0.5rem;">
                    <button class="btn-sm" onclick="StockModule.deleteLocation('${StockModule.escapeHtml(location.id || '')}')">Sil</button>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn-sm" onclick="Modal.close()">Vazgec</button>
                        <button class="btn-primary" onclick="StockModule.saveLocationEdit('${StockModule.escapeHtml(location.id || '')}')">Kaydet</button>
                    </div>
                </div>
            </div>
        `);
    },

    saveLocationEdit: async (locationId) => {
        const location = (DB.data.data.stockDepotLocations || []).find((row) => String(row?.id || '') === String(locationId || ''));
        if (!location) return;
        const rafCode = String(document.getElementById('stock_loc_edit_raf')?.value || '').trim().toUpperCase();
        const cellCode = String(document.getElementById('stock_loc_edit_cell')?.value || '').trim().toUpperCase();
        const note = String(document.getElementById('stock_loc_edit_note')?.value || '').trim();
        if (!rafCode || !cellCode) return alert('Raf ve hucre kodu zorunlu.');
        const exists = (DB.data.data.stockDepotLocations || []).some((row) =>
            String(row?.id || '') !== String(locationId || '')
            && String(row?.depotId || '') === String(location?.depotId || '')
            && String(row?.rafCode || '').trim().toUpperCase() === rafCode
            && String(row?.cellCode || '').trim().toUpperCase() === cellCode
        );
        if (exists) return alert('Bu raf / hucre zaten var.');
        location.rafCode = rafCode;
        location.cellCode = cellCode;
        location.note = note;
        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },

    deleteLocation: async (locationId) => {
        if (!confirm('Bu hucre kaydini silmek istiyor musunuz?')) return;
        DB.data.data.stockDepotLocations = (DB.data.data.stockDepotLocations || []).filter((row) => String(row?.id || '') !== String(locationId || ''));
        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },

    saveLocationInline: async (depotId) => {
        const rafCode = String(StockModule.state.locationDraftRaf || '').trim().toUpperCase();
        const cellCode = String(StockModule.state.locationDraftCell || '').trim().toUpperCase();
        const note = String(StockModule.state.locationDraftNote || '').trim();
        if (!rafCode || !cellCode) return alert('Raf ve hucre kodu zorunlu.');
        const exists = (DB.data.data.stockDepotLocations || []).some((row) =>
            String(row?.depotId || '') === String(depotId || '')
            && String(row?.rafCode || '').trim().toUpperCase() === rafCode
            && String(row?.cellCode || '').trim().toUpperCase() === cellCode
        );
        if (exists) return alert('Bu raf / hucre zaten var.');
        DB.data.data.stockDepotLocations.push({
            id: crypto.randomUUID(),
            depotId: String(depotId || ''),
            rafCode,
            cellCode,
            note,
            created_at: new Date().toISOString()
        });
        StockModule.state.locationDraftRaf = '';
        StockModule.state.locationDraftCell = '';
        StockModule.state.locationDraftNote = '';
        await DB.save();
        UI.renderCurrentPage();
    },
