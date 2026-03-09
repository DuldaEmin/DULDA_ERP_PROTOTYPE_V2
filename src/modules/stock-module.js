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

    renderSidebarSection: (title, items, options = {}) => {
        const canEdit = !!options.canEdit;
        if (items.length === 0) return '';
        return `
            <div class="stock-side-group">
                <div class="stock-side-group-title">${title}</div>
                <div class="stock-side-list">
                    ${items.map((item) => {
            const selected = String(StockModule.state.selectedKey || '') === String(item.key || '');
            return `
                            <div class="stock-side-row${canEdit ? ' with-edit' : ''}">
                                <button onclick="StockModule.selectNode('${StockModule.escapeHtml(item.key || '')}')" class="stock-side-btn${selected ? ' active' : ''}">
                                    ${StockModule.escapeHtml(item.name || '-')}
                                </button>
                                ${canEdit ? `<button class="stock-side-edit" onclick="event.stopPropagation(); StockModule.openDepotEditModal('${StockModule.escapeHtml(item.id || '')}')">duzenle</button>` : ''}
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    },

    renderLocationsTable: (node) => {
        const rows = StockModule.getFilteredLocations(node);
        return `
            <div class="stock-table-card">
                <table>
                    <thead>
                        <tr>
                            <th style="text-align:left;">Konum kodu</th>
                            <th style="text-align:left;">Raf</th>
                            <th style="text-align:left;">Hucre</th>
                            <th style="text-align:left;">Not</th>
                            <th style="text-align:left;">Olusturma</th>
                            <th style="text-align:right;">Islem</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.length === 0 ? `<tr><td colspan="6" class="stock-empty">Secili depoda gosterilecek konum yok.</td></tr>` : rows.map((row) => `
                            <tr>
                                <td style="font-family:monospace; color:#1d4ed8; font-weight:700;">${StockModule.escapeHtml(StockModule.getLocationCode(row))}</td>
                                <td style="font-weight:700;">${StockModule.escapeHtml(row.rafCode || '-')}</td>
                                <td style="font-weight:700;">${StockModule.escapeHtml(row.cellCode || '-')}</td>
                                <td style="color:#64748b;">${StockModule.escapeHtml(row.note || '-')}</td>
                                <td style="color:#64748b;">${StockModule.escapeHtml(String(row.created_at || '').slice(0, 10) || '-')}</td>
                                <td style="text-align:right;">
                                    <button class="btn-sm" onclick="StockModule.openLocationEditModal('${StockModule.escapeHtml(row.id || '')}')">duzenle</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderReferenceCard: (node) => {
        const typeLabel = node.kind === 'transfer'
            ? 'Transfer referansi'
            : node.kind === 'unit'
                ? 'Atolye referansi'
                : 'Dis birim referansi';
        return `
            <div class="stock-ref-card">
                <div class="stock-ref-label">${typeLabel}</div>
                <div class="stock-ref-title">${StockModule.escapeHtml(node.name || '-')}</div>
                <div class="stock-ref-text">
                    Bu alan bu sayfada fiziksel hucre veya stok hareketi yonetmez. Sadece diger modullerde secilebilecek bir adres / hedef bilgisi olarak listelenir.
                </div>
                <div class="stock-ref-callout">
                    Islem mantigi baska sayfalarda kalir. Buradaki ekran fiziksel yerlesim ve yonlendirme bilgisini netlestirmek icin kullanilir.
                </div>
            </div>
        `;
    },

    renderDepotCreateCard: () => {
        return `
            <div class="card" style="padding:1rem 1.05rem;">
                <div style="font-size:1rem; font-weight:800; color:#0f172a;">depo olustur</div>
                <div style="margin-top:0.3rem; color:#64748b;">Yeni bir fiziksel alan tanimla. Sistem ici id arka planda olusur, kullanici sadece adi gorur.</div>
                <div style="display:flex; flex-direction:column; gap:0.75rem; margin-top:0.95rem;">
                    <div>
                        <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Depo adi</label>
                        <input value="${StockModule.escapeHtml(StockModule.state.depotDraftName)}" oninput="StockModule.setDraftField('depotName', this.value)" placeholder="or: Mafsal depo" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.7rem; padding:0 0.75rem;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Not</label>
                        <textarea oninput="StockModule.setDraftField('depotNote', this.value)" rows="4" placeholder="or: Acik alan, giris kapisi saga bakiyor" style="width:100%; border:1px solid #cbd5e1; border-radius:0.7rem; padding:0.7rem; resize:vertical;">${StockModule.escapeHtml(StockModule.state.depotDraftNote)}</textarea>
                    </div>
                    <div style="display:flex; justify-content:flex-end;">
                        <button class="btn-primary" onclick="StockModule.saveDepotInline()">Kaydet</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderLocationCreateCard: (node) => {
        if (node.kind !== 'managed') {
            return `
                <div class="card" style="padding:1rem 1.05rem;">
                    <div style="font-size:1rem; font-weight:800; color:#0f172a;">konum olustur</div>
                    <div style="margin-top:0.45rem; color:#64748b; line-height:1.55;">
                        Secili alan fiziksel hucre tanimi almiyor. Yeni hucre eklemek icin soldan yonetilebilir bir depo sec.
                    </div>
                </div>
            `;
        }
        const previewCode = StockModule.getLocationCode({
            rafCode: StockModule.state.locationDraftRaf,
            cellCode: StockModule.state.locationDraftCell
        });
        return `
            <div class="card" style="padding:1rem 1.05rem;">
                <div style="font-size:1rem; font-weight:800; color:#0f172a;">${StockModule.escapeHtml(node.name || '-')} / hucre olustur</div>
                <div style="margin-top:0.3rem; color:#64748b;">Burada olusan kod sadece bu depo icindeki fiziksel adresi anlatir. Global bir birim kodu mantigi kurulmaz.</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-top:0.95rem;">
                    <div>
                        <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Raf</label>
                        <input value="${StockModule.escapeHtml(StockModule.state.locationDraftRaf)}" oninput="StockModule.setDraftField('locRaf', this.value)" placeholder="or: R01" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.7rem; padding:0 0.75rem;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Hucre</label>
                        <input value="${StockModule.escapeHtml(StockModule.state.locationDraftCell)}" oninput="StockModule.setDraftField('locCell', this.value)" placeholder="or: A1" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.7rem; padding:0 0.75rem;">
                    </div>
                </div>
                <div style="margin-top:0.75rem;">
                    <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Hucre notu</label>
                    <input value="${StockModule.escapeHtml(StockModule.state.locationDraftNote)}" oninput="StockModule.setDraftField('locNote', this.value)" placeholder="or: Uzun profil icin ayrildi" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.7rem; padding:0 0.75rem;">
                </div>
                <div style="margin-top:0.85rem; padding:0.8rem 0.9rem; border-radius:0.75rem; background:#f8fafc; border:1px dashed #cbd5e1;">
                    <div style="font-size:0.72rem; color:#64748b; text-transform:uppercase; font-weight:800;">Onizleme kod</div>
                    <div style="margin-top:0.3rem; font-family:monospace; font-size:1rem; font-weight:800; color:#1d4ed8;">${StockModule.escapeHtml(previewCode)}</div>
                </div>
                <div style="display:flex; justify-content:flex-end; margin-top:0.85rem;">
                    <button class="btn-primary" onclick="StockModule.saveLocationInline('${StockModule.escapeHtml(node.id || '')}')">Hucre ekle +</button>
                </div>
            </div>
        `;
    },

    renderLayout: () => {
        const node = StockModule.getSelectedNode();
        const mainDepot = StockModule.getMainDepot();
        const customDepots = StockModule.getCustomDepots();
        const unitMeta = StockModule.getUnitRowsMeta();
        const transferMeta = unitMeta.filter((row) => row.kind === 'transfer');
        const unitDepots = unitMeta.filter((row) => row.kind === 'unit');
        const externalDepots = StockModule.getExternalRowsMeta();
        const managedSummary = node.kind === 'managed' ? StockModule.getManagedSummary(node.id) : null;
        const overview = StockModule.getOverviewSummary();

        const topButton = (id, label) => `
            <button onclick="StockModule.setTopTab('${id}')" class="stock-tab${StockModule.state.topTab === id ? ' active' : ''}">
                ${label}
            </button>
        `;

        const headerSummary = `
            <div class="stock-metrics">
                <div class="stock-metric"><div class="stock-metric-label">Tanimli depo</div><div class="stock-metric-value">${overview.managedCount}</div></div>
                <div class="stock-metric"><div class="stock-metric-label">Toplam konum</div><div class="stock-metric-value">${overview.locationCount}</div></div>
                <div class="stock-metric"><div class="stock-metric-label">Atolye referansi</div><div class="stock-metric-value">${overview.unitCount}</div></div>
                <div class="stock-metric"><div class="stock-metric-label">Dis birim</div><div class="stock-metric-value">${overview.externalCount}</div></div>
            </div>
        `;

        const nodeSummary = node.kind === 'managed' && managedSummary
            ? `
                <div class="stock-banner-meta">
                    <div class="stock-banner-meta-item">
                        <div class="stock-banner-meta-label">Secili depo</div>
                        <div class="stock-banner-meta-value">${StockModule.escapeHtml(node.name || '-')}</div>
                    </div>
                    <div class="stock-banner-meta-item">
                        <div class="stock-banner-meta-label">Raf sayisi</div>
                        <div class="stock-banner-meta-value">${managedSummary.rafCount}</div>
                    </div>
                    <div class="stock-banner-meta-item">
                        <div class="stock-banner-meta-label">Hucre sayisi</div>
                        <div class="stock-banner-meta-value">${managedSummary.locationCount}</div>
                    </div>
                </div>
            `
            : '';

        const sidebarHtml = StockModule.state.topTab === 'transfer'
            ? `
                ${StockModule.renderSidebarSection('Depo transfer', transferMeta)}
                <div class="stock-side-hint">
                    Bu sekme artik stok hareket ekrani degil. Transfer alani sadece yonlendirme referansi olarak gorunur.
                </div>
            `
            : `
                ${StockModule.renderSidebarSection('Ana depo', [mainDepot])}
                ${StockModule.renderSidebarSection('Kullanici depolari', customDepots, { canEdit: true })}
                ${StockModule.renderSidebarSection('Birim / atolye depolari', unitDepots)}
                ${StockModule.renderSidebarSection('Fason / dis birimler', externalDepots)}
            `;

        const tableTitle = node.kind === 'managed' ? `${StockModule.escapeHtml(node.name || '-')} / konum listesi` : `${StockModule.escapeHtml(node.name || '-')} / referans alani`;
        const bodyHtml = node.kind === 'managed' ? StockModule.renderLocationsTable(node) : StockModule.renderReferenceCard(node);

        return `
            <section class="stock-shell">
                <div class="stock-hero">
                    <div class="stock-hero-header">
                        <div>
                            <h2 class="stock-title">depo & stok</h2>
                            <div class="stock-desc">Bu ekran artik stok giris-cikis islemi yapmaz. Fiziksel depo, raf ve hucre adreslerini tanimlamak; sonradan baska modullerde bu adresleri referans gostermek icin kullanilir.</div>
                        </div>
                        <div class="stock-tabs">
                            ${topButton('all', 'tum depolar')}
                            ${topButton('transfer', 'depo transfer')}
                        </div>
                    </div>
                    ${headerSummary}
                    <div class="stock-note-banner">
                        <div style="display:flex; justify-content:space-between; gap:0.8rem; align-items:flex-start; flex-wrap:wrap;">
                            <div>
                                <div class="stock-banner-title">${StockModule.escapeHtml(node.name || '-')}</div>
                                <div class="stock-banner-note">${StockModule.escapeHtml(node.note || '')}</div>
                            </div>
                            ${node.kind === 'managed' && node.editable ? `<button class="btn-sm" onclick="StockModule.openDepotEditModal('${StockModule.escapeHtml(node.id || '')}')" style="height:34px;">duzenle</button>` : ''}
                        </div>
                        ${nodeSummary}
                    </div>
                </div>

                <div class="stock-workspace">
                    <aside class="stock-sidebar">
                        ${sidebarHtml}
                    </aside>

                    <div class="stock-content">
                        <div class="stock-section-head">
                            <div class="stock-section-title">
                                ${tableTitle}
                            </div>
                            <div class="stock-section-helper">
                                ${node.kind === 'managed' ? 'Arama bu deponun icindeki fiziksel konumlarda calisir.' : 'Bu alan sadece secim / yonlendirme icin gorunur.'}
                            </div>
                        </div>

                        <div class="stock-search-grid">
                            <input class="stock-input" value="${StockModule.escapeHtml(StockModule.state.searchName)}" oninput="StockModule.setSearch('name', this.value)" placeholder="depo adi veya not ile ara">
                            <input class="stock-input" value="${StockModule.escapeHtml(StockModule.state.searchCategory)}" oninput="StockModule.setSearch('category', this.value)" placeholder="raf / hucre / not ile ara">
                            <input class="stock-input" value="${StockModule.escapeHtml(StockModule.state.searchCode)}" oninput="StockModule.setSearch('code', this.value)" placeholder="konum kodu ile ara">
                        </div>

                        ${bodyHtml}
                    </div>
                </div>
            </section>
        `;
    }
};
