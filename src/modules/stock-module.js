const StockModule = {
    state: {
        topTab: 'all',
        selectedKey: 'managed:main',
        panelTab: 'stocks',
        searchName: '',
        searchCategory: '',
        searchCode: ''
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

        if (!DB.data.meta.seedFlags.stockDepotsSeededV2) {
            if (DB.data.data.stockDepots.length === 0) {
                DB.data.data.stockDepots = [
                    {
                        id: 'depot_granul',
                        name: 'GRANUL DEPO',
                        note: 'Hammadde ve granul icin ayrilan depo',
                        isActive: true,
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 'depot_profil',
                        name: 'PROFIL DEPO',
                        note: 'Profil ve uzun malzemeler icin depo',
                        isActive: true,
                        created_at: new Date().toISOString()
                    }
                ];
            }
            if (DB.data.data.stockDepotLocations.length === 0) {
                DB.data.data.stockDepotLocations = [
                    { id: crypto.randomUUID(), depotId: 'main', rafCode: 'R01', cellCode: 'A1', note: '' },
                    { id: crypto.randomUUID(), depotId: 'main', rafCode: 'R01', cellCode: 'A2', note: '' },
                    { id: crypto.randomUUID(), depotId: 'main', rafCode: 'R02', cellCode: 'A1', note: '' },
                    { id: crypto.randomUUID(), depotId: 'depot_granul', rafCode: 'R01', cellCode: 'A1', note: '' },
                    { id: crypto.randomUUID(), depotId: 'depot_profil', rafCode: 'R01', cellCode: 'A1', note: '' }
                ];
            }
            DB.data.meta.seedFlags.stockDepotsSeededV2 = true;
            DB.markDirty();
        }
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
        note: 'Kapali ana depo / rafli hucre yapisi',
        kind: 'managed',
        editable: true,
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
                note: 'Kayitli olmayan veya tek seferlik fasonlar',
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
                note: 'Transfer ve rota gecis operasyon alani',
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
                    note: 'Atolye deposu / sadece goruntuleme',
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
                note: 'Kayitli olmayan veya tek seferlik fasonlar',
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
                    note: 'Fason / dis birim',
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

    getDepotItems: (depotId) => {
        return (DB.data.data.stockDepotItems || [])
            .filter((row) => String(row?.depotId || '') === String(depotId || ''))
            .slice()
            .sort((a, b) => String(a?.productCode || '').localeCompare(String(b?.productCode || ''), 'tr'));
    },

    getManagedSummary: (depotId) => {
        const items = StockModule.getDepotItems(depotId);
        const locations = StockModule.getDepotLocations(depotId);
        const occupiedKeys = new Set(items.map((row) => `${String(row?.rafCode || '')}|${String(row?.cellCode || '')}`));
        return {
            itemCount: items.length,
            totalQty: items.reduce((sum, row) => sum + Number(row?.qty || 0), 0),
            locationCount: locations.length,
            occupiedCount: occupiedKeys.size
        };
    },

    getUnitSummary: (unitId) => {
        const empty = { waiting: 0, inProcess: 0, ready: 0 };
        if (typeof UnitModule === 'undefined' || !UnitModule || typeof UnitModule.getUnitWorkRows !== 'function') return empty;
        const rows = UnitModule.getUnitWorkRows(unitId);
        return {
            waiting: rows.reduce((sum, row) => sum + Number(row?.metrics?.availableQty || 0), 0),
            inProcess: rows.reduce((sum, row) => sum + Number(row?.metrics?.inProcessQty || 0), 0),
            ready: rows.reduce((sum, row) => sum + Number(row?.metrics?.doneQty || 0), 0)
        };
    },

    getTransferRows: () => {
        const unitMap = {};
        (DB.data?.data?.units || []).forEach((row) => { unitMap[String(row?.id || '')] = String(row?.name || row?.id || ''); });
        return (DB.data.data.depoTransferTasks || [])
            .slice()
            .sort((a, b) => new Date(b?.updated_at || b?.created_at || 0) - new Date(a?.updated_at || a?.created_at || 0))
            .map((row) => ({
                name: String(row?.taskName || '-'),
                category: 'depo transfer',
                unit: '-',
                qty: '-',
                size: '-',
                color: '-',
                model: String(unitMap[String(row?.targetUnitId || '')] || row?.targetUnitId || '-'),
                package: '-',
                supplier: '-',
                code: String(row?.taskCode || '-')
            }));
    },

    getManagedRows: (depotId) => {
        return StockModule.getDepotItems(depotId).map((row) => ({
            name: String(row?.productName || '-'),
            category: String(row?.kind || '-'),
            unit: String(row?.unit || 'adet'),
            qty: Number(row?.qty || 0),
            size: String(row?.size || '-'),
            color: String(row?.color || '-'),
            model: String(row?.model || '-'),
            package: String(row?.package || '-'),
            supplier: String(row?.supplier || '-'),
            code: String(row?.productCode || '-')
        }));
    },

    getUnitRows: (unitId) => {
        if (typeof UnitModule === 'undefined' || !UnitModule || typeof UnitModule.getUnitWorkRows !== 'function') return [];
        return UnitModule.getUnitWorkRows(unitId).map((row) => ({
            name: String(row?.line?.componentName || row?.order?.productName || '-'),
            category: 'birim deposu',
            unit: 'adet',
            qty: Number(row?.metrics?.availableQty || 0) + Number(row?.metrics?.inProcessQty || 0) + Number(row?.metrics?.doneQty || 0),
            size: '-',
            color: '-',
            model: `Bek:${Number(row?.metrics?.availableQty || 0)} / Ism:${Number(row?.metrics?.inProcessQty || 0)} / Haz:${Number(row?.metrics?.doneQty || 0)}`,
            package: String(row?.order?.productName || '-'),
            supplier: '-',
            code: String(row?.line?.componentCode || row?.order?.productCode || '-')
        })).filter((row) => Number(row.qty || 0) > 0);
    },

    getExternalRows: (node) => {
        const supplierName = StockModule.normalize(node?.name || '');
        const jobs = (DB.data?.data?.freeExternalVendorJobs || []).slice();
        const filtered = node?.id === 'free_external'
            ? jobs
            : jobs.filter((row) => StockModule.normalize(row?.supplierName || '').includes(supplierName));
        return filtered
            .sort((a, b) => new Date(b?.updated_at || b?.created_at || 0) - new Date(a?.updated_at || a?.created_at || 0))
            .map((row) => ({
                name: String(row?.productName || '-'),
                category: 'fason',
                unit: 'adet',
                qty: Number(row?.qty || 0),
                size: '-',
                color: '-',
                model: String(row?.status || '-'),
                package: String(row?.docNo || '-'),
                supplier: String(row?.supplierName || '-'),
                code: String(row?.productCode || row?.jobCode || '-')
            }));
    },

    getSelectedRows: () => {
        const node = StockModule.getSelectedNode();
        if (node.kind === 'managed') return StockModule.getManagedRows(node.id);
        if (node.kind === 'transfer') return StockModule.getTransferRows();
        if (node.kind === 'unit') return StockModule.getUnitRows(node.id);
        if (node.kind === 'external') return StockModule.getExternalRows(node);
        return [];
    },

    getFilteredRows: () => {
        const qName = StockModule.normalize(StockModule.state.searchName);
        const qCategory = StockModule.normalize(StockModule.state.searchCategory);
        const qCode = StockModule.normalize(StockModule.state.searchCode);
        return StockModule.getSelectedRows().filter((row) => {
            const nameOk = !qName || StockModule.normalize(row?.name || '').includes(qName);
            const categoryOk = !qCategory || StockModule.normalize(row?.category || '').includes(qCategory) || StockModule.normalize(row?.model || '').includes(qCategory);
            const codeOk = !qCode || StockModule.normalize(row?.code || '').includes(qCode);
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

    setPanelTab: (tabId) => {
        StockModule.state.panelTab = String(tabId || 'stocks');
        UI.renderCurrentPage();
    },

    openDepotCreateModal: () => {
        Modal.open('Yeni Depo Ekle', `
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
                <div>
                    <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Depo adi</label>
                    <input id="stock_depot_name" placeholder="or: Mafsal Depo" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                </div>
                <div>
                    <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Lokasyon notu</label>
                    <textarea id="stock_depot_note" rows="3" placeholder="or: Idari bina yani acik alan" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.55rem; resize:vertical;"></textarea>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button class="btn-sm" onclick="Modal.close()">Vazgec</button>
                    <button class="btn-primary" onclick="StockModule.saveDepot()">Kaydet</button>
                </div>
            </div>
        `);
    },

    saveDepot: async () => {
        const name = String(document.getElementById('stock_depot_name')?.value || '').trim();
        const note = String(document.getElementById('stock_depot_note')?.value || '').trim();
        if (!name) return alert('Depo adi zorunlu.');
        DB.data.data.stockDepots.push({
            id: crypto.randomUUID(),
            name: name.toUpperCase(),
            note,
            isActive: true,
            created_at: new Date().toISOString()
        });
        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
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
                    <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Lokasyon notu</label>
                    <textarea id="stock_depot_edit_note" rows="3" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.55rem; resize:vertical;">${StockModule.escapeHtml(depot.note || '')}</textarea>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button class="btn-sm" onclick="Modal.close()">Vazgec</button>
                    <button class="btn-primary" onclick="StockModule.saveDepotEdit('${String(depotId || '')}')">Kaydet</button>
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

    openLocationCreateModal: (depotId) => {
        const node = StockModule.getSelectedNode();
        if (!node.allowLocations) return;
        Modal.open(`${StockModule.escapeHtml(node.name)} - Hucre Ekle`, `
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.65rem;">
                    <div>
                        <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Raf kodu</label>
                        <input id="stock_loc_raf" placeholder="or: R01" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Hucre kodu</label>
                        <input id="stock_loc_cell" placeholder="or: A1" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                    </div>
                </div>
                <div>
                    <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Not</label>
                    <textarea id="stock_loc_note" rows="3" placeholder="opsiyonel" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.55rem; resize:vertical;"></textarea>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button class="btn-sm" onclick="Modal.close()">Vazgec</button>
                    <button class="btn-primary" onclick="StockModule.saveLocation('${String(depotId || '')}')">Kaydet</button>
                </div>
            </div>
        `);
    },

    saveLocation: async (depotId) => {
        const rafCode = String(document.getElementById('stock_loc_raf')?.value || '').trim().toUpperCase();
        const cellCode = String(document.getElementById('stock_loc_cell')?.value || '').trim().toUpperCase();
        const note = String(document.getElementById('stock_loc_note')?.value || '').trim();
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
        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },

    renderSidebarSection: (title, items, options = {}) => {
        const canEdit = !!options.canEdit;
        if (items.length === 0) return '';
        return `
            <div style="margin-bottom:0.9rem;">
                <div style="font-size:0.72rem; color:#64748b; font-weight:800; text-transform:uppercase; margin:0 0 0.45rem 0.15rem;">${title}</div>
                <div style="display:flex; flex-direction:column; gap:0.42rem;">
                    ${items.map((item) => {
            const selected = String(StockModule.state.selectedKey || '') === String(item.key || '');
            return `
                            <div style="display:grid; grid-template-columns:1fr auto; gap:0.35rem; align-items:center;">
                                <button onclick="StockModule.selectNode('${StockModule.escapeHtml(item.key || '')}')" style="height:34px; border:1px solid ${selected ? '#0f172a' : '#cbd5e1'}; background:${selected ? '#0f172a' : 'white'}; color:${selected ? 'white' : '#111827'}; border-radius:0.6rem; padding:0 0.7rem; text-align:left; font-weight:${selected ? '800' : '600'}; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    ${StockModule.escapeHtml(item.name || '-')}
                                </button>
                                ${canEdit ? `<button class="btn-sm" onclick="event.stopPropagation(); StockModule.openDepotEditModal('${StockModule.escapeHtml(item.id || '')}')" style="height:34px; padding:0 0.55rem;">duzenle</button>` : '<div></div>'}
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    },

    renderLocationsTable: (node) => {
        const rows = StockModule.getDepotLocations(node.id).map((location) => {
            const item = StockModule.getDepotItems(node.id).find((row) =>
                String(row?.rafCode || '') === String(location?.rafCode || '')
                && String(row?.cellCode || '') === String(location?.cellCode || '')
            );
            return { location, item };
        });
        return `
            <div class="card-table" style="margin-top:0.8rem;">
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="border-bottom:1px solid #e2e8f0; color:#94a3b8; font-size:0.66rem; text-transform:uppercase;">
                            <th style="padding:0.55rem; text-align:left;">Raf</th>
                            <th style="padding:0.55rem; text-align:left;">Hucre</th>
                            <th style="padding:0.55rem; text-align:left;">Durum</th>
                            <th style="padding:0.55rem; text-align:left;">Icerik</th>
                            <th style="padding:0.55rem; text-align:left;">Not</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.length === 0 ? `<tr><td colspan="5" style="padding:1rem; text-align:center; color:#94a3b8;">Henuz hucre tanimi yok.</td></tr>` : rows.map((row) => `
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:0.55rem; font-weight:700;">${StockModule.escapeHtml(row.location.rafCode || '-')}</td>
                                <td style="padding:0.55rem; font-weight:700;">${StockModule.escapeHtml(row.location.cellCode || '-')}</td>
                                <td style="padding:0.55rem;">${row.item ? '<span style="color:#047857; font-weight:700;">dolu</span>' : '<span style="color:#94a3b8; font-weight:700;">bos</span>'}</td>
                                <td style="padding:0.55rem;">${StockModule.escapeHtml(row.item?.productName || '-')}</td>
                                <td style="padding:0.55rem; color:#64748b;">${StockModule.escapeHtml(row.location.note || '-')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderRowsTable: (rows) => {
        return `
            <div class="card-table" style="margin-top:0.75rem;">
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="border-bottom:1px solid #e2e8f0; color:#94a3b8; font-size:0.66rem; text-transform:uppercase;">
                            <th style="padding:0.55rem; text-align:left;">Urun adi</th>
                            <th style="padding:0.55rem; text-align:left;">Kategori</th>
                            <th style="padding:0.55rem; text-align:left;">Birim</th>
                            <th style="padding:0.55rem; text-align:center;">Birim miktar</th>
                            <th style="padding:0.55rem; text-align:left;">Boy</th>
                            <th style="padding:0.55rem; text-align:left;">Renk</th>
                            <th style="padding:0.55rem; text-align:left;">Marka/model</th>
                            <th style="padding:0.55rem; text-align:left;">Ambalaj</th>
                            <th style="padding:0.55rem; text-align:left;">Tedarikci</th>
                            <th style="padding:0.55rem; text-align:left;">Kod</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.length === 0 ? `<tr><td colspan="10" style="padding:1rem; text-align:center; color:#94a3b8;">Secili depoda gosterilecek kayit yok.</td></tr>` : rows.map((row) => `
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:0.55rem; font-weight:700; color:#334155;">${StockModule.escapeHtml(row.name || '-')}</td>
                                <td style="padding:0.55rem;">${StockModule.escapeHtml(row.category || '-')}</td>
                                <td style="padding:0.55rem;">${StockModule.escapeHtml(row.unit || '-')}</td>
                                <td style="padding:0.55rem; text-align:center; font-weight:700;">${StockModule.escapeHtml(row.qty ?? '-')}</td>
                                <td style="padding:0.55rem;">${StockModule.escapeHtml(row.size || '-')}</td>
                                <td style="padding:0.55rem;">${StockModule.escapeHtml(row.color || '-')}</td>
                                <td style="padding:0.55rem;">${StockModule.escapeHtml(row.model || '-')}</td>
                                <td style="padding:0.55rem;">${StockModule.escapeHtml(row.package || '-')}</td>
                                <td style="padding:0.55rem;">${StockModule.escapeHtml(row.supplier || '-')}</td>
                                <td style="padding:0.55rem; font-family:monospace; color:#1d4ed8;">${StockModule.escapeHtml(row.code || '-')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },
