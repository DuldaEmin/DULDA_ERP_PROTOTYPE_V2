const StockModule = {
    state: {
        workspaceView: 'menu',
        topTab: 'all',
        selectedKey: 'all',
        searchName: '',
        searchCode: '',
        depotDraftName: '',
        depotDraftNote: '',
        locationDraftRaf: '',
        locationDraftCell: '',
        locationDraftNote: '',
        depotDraftLocations: [],
        depotEditingId: null
    },

    managedDepotSeed: [
        { id: 'depot_transfer', name: 'TRANSFER DEPO', note: 'Atolyeler arasinda bekleyen ve yonlendirilecek urunler burada gorunur.' },
        { id: 'depot_granul', name: 'GRANUL DEPO', note: 'Hammadde ve granul icin ayrilan fiziksel alan.' },
        { id: 'depot_profil', name: 'PROFIL DEPO', note: 'Profil ve uzun malzemeler icin ayrilan fiziksel alan.' },
        { id: 'depot_mafsal', name: 'MAFSAL DEPO', note: 'Mafsal ve benzeri yarimamul / bitmis unsur alanlari.' }
    ],

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

    ensureData: () => {
        if (!DB.data || typeof DB.data !== 'object') DB.data = {};
        if (!DB.data.data || typeof DB.data.data !== 'object') DB.data.data = {};
        if (!DB.data.meta || typeof DB.data.meta !== 'object') DB.data.meta = {};
        if (!DB.data.meta.seedFlags || typeof DB.data.meta.seedFlags !== 'object') DB.data.meta.seedFlags = {};
        if (!Array.isArray(DB.data.data.units)) DB.data.data.units = [];
        if (!Array.isArray(DB.data.data.stockDepots)) DB.data.data.stockDepots = [];
        if (!Array.isArray(DB.data.data.stockDepotLocations)) DB.data.data.stockDepotLocations = [];
        if (!Array.isArray(DB.data.data.stockDepotItems)) DB.data.data.stockDepotItems = [];

        let changed = false;
        const now = new Date().toISOString();

        if (DB.data.data.units.length === 0) {
            DB.data.data.units = [
                { id: 'u1', name: 'CNC ATOLYESI', type: 'internal' },
                { id: 'u2', name: 'EKSTRUDER ATOLYESI', type: 'internal' },
                { id: 'u3', name: 'MONTAJ', type: 'internal' },
                { id: 'u4', name: 'PAKETLEME', type: 'internal' },
                { id: 'u5', name: 'PLEKSI POLISAJ ATOLYESI', type: 'internal' },
                { id: 'u7', name: 'TESTERE ATOLYESI', type: 'internal' },
                { id: 'u_dtm', name: 'ANA DEPO', type: 'internal' },
                { id: 'u8', name: 'AKPA ALUMINYUM A.S.', type: 'external' },
                { id: 'u9', name: 'HILAL PWD', type: 'external' },
                { id: 'u10', name: 'IBRAHIM POLISAJ', type: 'external' },
                { id: 'u11', name: 'TEKIN ELOKSAL', type: 'external' }
            ];
            changed = true;
        }

        const mainDepotUnit = (DB.data.data.units || []).find((row) => String(row?.id || '') === 'u_dtm');
        if (!mainDepotUnit) {
            DB.data.data.units.push({ id: 'u_dtm', name: 'ANA DEPO', type: 'internal' });
            changed = true;
        } else if (String(mainDepotUnit.name || '').trim().toUpperCase() !== 'ANA DEPO') {
            mainDepotUnit.name = 'ANA DEPO';
            changed = true;
        }

        StockModule.managedDepotSeed.forEach((seed) => {
            const row = (DB.data.data.stockDepots || []).find((item) => String(item?.id || '') === String(seed.id));
            if (!row) {
                DB.data.data.stockDepots.push({
                    id: seed.id,
                    name: seed.name,
                    note: seed.note,
                    isActive: true,
                    created_at: now
                });
                changed = true;
                return;
            }
            if (!row.name) {
                row.name = seed.name;
                changed = true;
            }
            if (!row.note) {
                row.note = seed.note;
                changed = true;
            }
            if (typeof row.isActive === 'undefined') {
                row.isActive = true;
                changed = true;
            }
            if (!row.created_at) {
                row.created_at = now;
                changed = true;
            }
        });

        if (!DB.data.meta.seedFlags.stockDepotsSeededV4) {
            [
                { depotId: 'main', rafCode: 'R01', cellCode: 'A1', note: 'Ana depo giris rafi' },
                { depotId: 'main', rafCode: 'R01', cellCode: 'A2', note: '' },
                { depotId: 'main', rafCode: 'R02', cellCode: 'A1', note: '' },
                { depotId: 'depot_granul', rafCode: 'R01', cellCode: 'A1', note: '' },
                { depotId: 'depot_profil', rafCode: 'R01', cellCode: 'A1', note: '' }
            ].forEach((seed) => {
                const exists = (DB.data.data.stockDepotLocations || []).some((row) =>
                    String(row?.depotId || '') === seed.depotId
                    && String(row?.rafCode || '').trim().toUpperCase() === seed.rafCode
                    && String(row?.cellCode || '').trim().toUpperCase() === seed.cellCode
                );
                if (exists) return;
                DB.data.data.stockDepotLocations.push({
                    id: crypto.randomUUID(),
                    depotId: seed.depotId,
                    rafCode: seed.rafCode,
                    cellCode: seed.cellCode,
                    note: seed.note,
                    created_at: now
                });
                changed = true;
            });
            DB.data.meta.seedFlags.stockDepotsSeededV4 = true;
            changed = true;
        }

        (DB.data.data.stockDepots || []).forEach((row) => {
            if (!row.created_at) {
                row.created_at = now;
                changed = true;
            }
        });
        (DB.data.data.stockDepotLocations || []).forEach((row) => {
            if (!row.created_at) {
                row.created_at = now;
                changed = true;
            }
        });

        if (changed) DB.markDirty();
    },

    getMainDepot: () => ({
        id: 'main',
        key: 'managed:main',
        name: 'ANA DEPO',
        note: 'Kapali ana depo. Fiziksel raf ve hucre tanimlari burada tutulur.',
        kind: 'managed',
        editable: true,
        allowLocations: true
    }),

    getLocationCode: (location) => {
        const rafCode = String(location?.rafCode || '').trim().toUpperCase();
        const cellCode = String(location?.cellCode || '').trim().toUpperCase();
        if (rafCode && cellCode) return `${rafCode}-${cellCode}`;
        if (rafCode) return rafCode;
        return cellCode || '-';
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

    getCustomDepots: () => {
        const order = ['depot_transfer', 'depot_granul', 'depot_profil', 'depot_mafsal'];
        const rows = (DB.data.data.stockDepots || [])
            .filter((row) => row?.isActive !== false)
            .map((row) => ({
                ...row,
                key: `managed:${String(row?.id || '')}`,
                kind: 'managed',
                editable: true,
                allowLocations: true
            }));
        return rows.sort((a, b) => {
            const aIndex = order.indexOf(String(a?.id || ''));
            const bIndex = order.indexOf(String(b?.id || ''));
            if (aIndex !== -1 || bIndex !== -1) {
                return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
            }
            return String(a?.name || '').localeCompare(String(b?.name || ''), 'tr');
        });
    },

    getUnitRowsMeta: () => {
        const formatName = (name) => {
            const upper = String(name || '').trim().toUpperCase();
            if (upper.includes('EKSTRUDER')) return 'EKSTRUDER DEPO';
            if (upper.includes('TESTERE')) return 'TESTERE DEPO';
            if (upper.includes('PLEKSI')) return 'PLEKSI POLISAJ DEPO';
            if (upper.includes('CNC')) return 'CNC DEPO';
            if (upper.includes('MONTAJ')) return 'MONTAJ DEPO';
            return upper;
        };
        const rows = (DB.data?.data?.units || [])
            .filter((row) => String(row?.type || '') === 'internal')
            .filter((row) => String(row?.id || '') !== 'u_dtm')
            .map((row) => ({
                ...row,
                key: `unit:${String(row?.id || '')}`,
                name: formatName(row?.name || ''),
                note: 'Bu alan fiziksel raf / hucre tanimi almaz. Sadece izleme icin gorunur.',
                kind: 'unit',
                editable: false,
                allowLocations: false
            }));
        const ordered = ['EKSTRUDER', 'TESTERE', 'PLEKSI', 'CNC', 'MONTAJ'];
        return rows.sort((a, b) => {
            const aKey = ordered.findIndex((item) => String(a?.name || '').includes(item));
            const bKey = ordered.findIndex((item) => String(b?.name || '').includes(item));
            return (aKey === -1 ? 999 : aKey) - (bKey === -1 ? 999 : bKey);
        });
    },

    getExternalRowsMeta: () => {
        const rows = (DB.data?.data?.units || [])
            .filter((row) => String(row?.type || '') === 'external')
            .map((row) => ({
                ...row,
                key: `external:${String(row?.id || '')}`,
                name: String(row?.name || '').trim().toUpperCase(),
                note: 'Dis birim veya fason nokta. Burada sadece izleme amacli gorunur.',
                kind: 'external',
                editable: false,
                allowLocations: false
            }))
            .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'tr'));
        rows.push({
            id: 'free_external',
            key: 'external:free',
            name: 'SERBEST DIS FASON',
            note: 'Kayitli olmayan dis birim referansi.',
            kind: 'external',
            editable: false,
            allowLocations: false
        });
        return rows;
    },

    getSelectedNode: () => {
        const key = String(StockModule.state.selectedKey || 'all');
        if (key === 'all') {
            return { id: 'all', key: 'all', name: 'TUM DEPOLAR', note: 'Depo secilmediginde arama tum depolarda calisir.', kind: 'all', editable: false, allowLocations: false };
        }
        const nodes = [
            StockModule.getMainDepot(),
            ...StockModule.getCustomDepots(),
            ...StockModule.getUnitRowsMeta(),
            ...StockModule.getExternalRowsMeta()
        ];
        return nodes.find((row) => String(row?.key || '') === key) || StockModule.getMainDepot();
    },

    getOverviewSummary: () => {
        const managedIds = new Set(['main', ...StockModule.getCustomDepots().map((row) => String(row?.id || ''))]);
        return {
            managedCount: managedIds.size,
            locationCount: (DB.data.data.stockDepotLocations || []).filter((row) => managedIds.has(String(row?.depotId || ''))).length,
            unitCount: StockModule.getUnitRowsMeta().length,
            externalCount: StockModule.getExternalRowsMeta().length
        };
    },

    getManagedSummary: (depotId) => {
        const locations = StockModule.getDepotLocations(depotId);
        return {
            rafCount: new Set(locations.map((row) => String(row?.rafCode || '').trim().toUpperCase()).filter(Boolean)).size,
            locationCount: locations.length
        };
    },

    resolveInventoryNode: (raw) => {
        const nodeId = String(raw?.depotId || raw?.nodeId || raw?.unitId || raw?.stationId || '');
        const nodeKey = String(raw?.nodeKey || raw?.depotKey || raw?.key || '');
        const nodes = [
            StockModule.getMainDepot(),
            ...StockModule.getCustomDepots(),
            ...StockModule.getUnitRowsMeta(),
            ...StockModule.getExternalRowsMeta()
        ];
        return nodes.find((row) => String(row?.key || '') === nodeKey || String(row?.id || '') === nodeId) || null;
    },

    getInventoryRows: () => {
        const products = Array.isArray(DB.data?.data?.products) ? DB.data.data.products : [];
        const locationMap = new Map((DB.data.data.stockDepotLocations || []).map((row) => [String(row?.id || ''), row]));
        return (DB.data.data.stockDepotItems || []).map((raw) => {
            const product = products.find((row) => String(row?.id || '') === String(raw?.productId || '')) || null;
            const node = StockModule.resolveInventoryNode(raw);
            const location = locationMap.get(String(raw?.locationId || '')) || null;
            const quantity = raw?.quantity ?? raw?.qty ?? raw?.amount ?? '';
            return {
                id: String(raw?.id || product?.id || ''),
                name: String(raw?.productName || raw?.name || product?.name || '').trim(),
                code: String(raw?.productCode || raw?.code || product?.code || '').trim(),
                quantity,
                unit: String(raw?.unit || product?.unit || product?.specs?.unit || '').trim(),
                status: String(raw?.status || '').trim(),
                note: String(raw?.note || '').trim(),
                locationCode: raw?.locationCode
                    ? String(raw.locationCode)
                    : location
                        ? StockModule.getLocationCode(location)
                        : [raw?.rafCode, raw?.cellCode].filter(Boolean).join('-'),
                depotNode: node,
                depotName: node?.name || String(raw?.depotName || '-')
            };
        });
    },

    getFilteredInventoryRows: (node) => {
        const qName = StockModule.normalize(StockModule.state.searchName);
        const qCode = StockModule.normalize(StockModule.state.searchCode);
        const targetKey = String(node?.key || 'all');
        return StockModule.getInventoryRows().filter((row) => {
            if (targetKey !== 'all' && String(row?.depotNode?.key || '') !== targetKey) return false;
            const hayName = [row?.name, row?.depotName, row?.note].map(StockModule.normalize).join(' ');
            const hayCode = [row?.code, row?.locationCode].map(StockModule.normalize).join(' ');
            return (!qName || hayName.includes(qName)) && (!qCode || hayCode.includes(qCode));
        });
    },

    getInventoryGroups: (node) => {
        const rows = StockModule.getFilteredInventoryRows(node);
        if (String(node?.key || '') !== 'all') {
            return [{ key: String(node?.key || 'single'), title: String(node?.name || '-'), rows }];
        }
        const map = new Map();
        rows.forEach((row) => {
            const key = String(row?.depotNode?.key || 'unknown');
            const title = String(row?.depotNode?.name || row?.depotName || 'Bilinmeyen depo');
            if (!map.has(key)) map.set(key, { key, title, rows: [] });
            map.get(key).rows.push(row);
        });
        return Array.from(map.values()).sort((a, b) => String(a?.title || '').localeCompare(String(b?.title || ''), 'tr'));
    },

    openWorkspace: (viewId) => {
        StockModule.state.workspaceView = String(viewId || 'menu');
        UI.renderCurrentPage();
    },

    setTopTab: (tabId) => {
        const nextTab = String(tabId || 'all');
        StockModule.state.topTab = nextTab;
        StockModule.state.selectedKey = nextTab === 'transfer' ? 'managed:depot_transfer' : 'all';
        UI.renderCurrentPage();
    },

    selectNode: (key) => {
        const nextKey = String(key || 'all');
        StockModule.state.selectedKey = nextKey;
        StockModule.state.topTab = nextKey === 'managed:depot_transfer' ? 'transfer' : 'all';
        UI.renderCurrentPage();
    },

    restoreSearchFocus: (field) => {
        const targetId = field === 'code' ? 'stock-search-code' : 'stock-search-name';
        requestAnimationFrame(() => {
            const input = document.getElementById(targetId);
            if (!input) return;
            input.focus();
            const end = String(input.value || '').length;
            if (typeof input.setSelectionRange === 'function') input.setSelectionRange(end, end);
        });
    },

    setSearch: (field, value) => {
        if (field === 'name') StockModule.state.searchName = String(value || '');
        if (field === 'code') StockModule.state.searchCode = String(value || '');
        UI.renderCurrentPage();
        StockModule.restoreSearchFocus(field);
    },

    setDraftField: (field, value) => {
        if (field === 'depotName') StockModule.state.depotDraftName = String(value || '');
        if (field === 'depotNote') StockModule.state.depotDraftNote = String(value || '');
        if (field === 'locRaf') StockModule.state.locationDraftRaf = String(value || '').toUpperCase();
        if (field === 'locCell') StockModule.state.locationDraftCell = String(value || '').toUpperCase();
        if (field === 'locNote') StockModule.state.locationDraftNote = String(value || '');
    },

    resetDepotDraft: () => {
        StockModule.state.depotDraftName = '';
        StockModule.state.depotDraftNote = '';
        StockModule.state.locationDraftRaf = '';
        StockModule.state.locationDraftCell = '';
        StockModule.state.locationDraftNote = '';
        StockModule.state.depotDraftLocations = [];
        StockModule.state.depotEditingId = null;
    },

    makeDepotId: (name) => {
        const slug = String(name || '')
            .trim()
            .toLocaleLowerCase('tr-TR')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            || 'depo';
        let candidate = `depot_${slug}`;
        let index = 2;
        const used = new Set((DB.data.data.stockDepots || []).map((row) => String(row?.id || '')));
        while (used.has(candidate)) {
            candidate = `depot_${slug}_${index}`;
            index += 1;
        }
        return candidate;
    },

    openDepotCreateModal: () => {
        StockModule.resetDepotDraft();
        StockModule.renderDepotModal();
    },

    openDepotEditModal: (depotId) => {
        const targetId = String(depotId || '');
        const depot = targetId === 'main'
            ? StockModule.getMainDepot()
            : (DB.data.data.stockDepots || []).find((row) => String(row?.id || '') === targetId);
        if (!depot) return;
        StockModule.resetDepotDraft();
        StockModule.state.depotEditingId = String(depot.id || '');
        StockModule.state.depotDraftName = String(depot.name || '');
        StockModule.state.depotDraftNote = String(depot.note || '');
        StockModule.state.depotDraftLocations = StockModule.getDepotLocations(depot.id).map((row) => ({
            id: String(row?.id || ''),
            rafCode: String(row?.rafCode || '').trim().toUpperCase(),
            cellCode: String(row?.cellCode || '').trim().toUpperCase(),
            note: String(row?.note || '')
        }));
        StockModule.renderDepotModal();
    },

    addDraftLocation: () => {
        const rafCode = String(StockModule.state.locationDraftRaf || '').trim().toUpperCase();
        const cellCode = String(StockModule.state.locationDraftCell || '').trim().toUpperCase();
        const note = String(StockModule.state.locationDraftNote || '').trim();
        if (!rafCode || !cellCode) return alert('Raf ve hucre kodu giriniz.');
        const exists = (StockModule.state.depotDraftLocations || []).some((row) =>
            String(row?.rafCode || '').trim().toUpperCase() === rafCode
            && String(row?.cellCode || '').trim().toUpperCase() === cellCode
        );
        if (exists) return alert('Bu raf / hucre zaten listede var.');
        StockModule.state.depotDraftLocations.push({ id: '', rafCode, cellCode, note });
        StockModule.state.locationDraftRaf = '';
        StockModule.state.locationDraftCell = '';
        StockModule.state.locationDraftNote = '';
        StockModule.renderDepotModal();
    },

    removeDraftLocation: (index) => {
        StockModule.state.depotDraftLocations = (StockModule.state.depotDraftLocations || []).filter((_row, idx) => idx !== Number(index));
        StockModule.renderDepotModal();
    },

    renderDepotDraftRows: () => {
        const rows = StockModule.state.depotDraftLocations || [];
        if (rows.length === 0) {
            return `<tr><td colspan="5" class="stock-empty">Henuz hucre eklenmedi. Istersen bos depo olarak da kaydedebilirsin.</td></tr>`;
        }
        return rows.map((row, index) => `
            <tr>
                <td>${StockModule.escapeHtml(row.rafCode || '-')}</td>
                <td>${StockModule.escapeHtml(row.cellCode || '-')}</td>
                <td>${StockModule.escapeHtml(row.note || '-')}</td>
                <td style="font-family:monospace; color:#1d4ed8; font-weight:700;">${StockModule.escapeHtml(StockModule.getLocationCode(row))}</td>
                <td style="text-align:right;"><button class="btn-sm" onclick="StockModule.removeDraftLocation(${index})">sil</button></td>
            </tr>
        `).join('');
    },

    renderDepotModal: () => {
        const editing = !!String(StockModule.state.depotEditingId || '');
        const editingMain = String(StockModule.state.depotEditingId || '') === 'main';
        Modal.open(editing ? 'Depo Duzenle' : 'Depo Olustur', `
            <div class="stock-modal-form">
                <div class="stock-modal-title">${editing ? 'Secili depoyu duzenle' : 'Yeni depo tanimi'}</div>
                <div class="stock-modal-note">${editingMain ? 'Ana depoda ayni pencereden raf / hucre ekleyebilirsin.' : 'Depo adi ve notu gir. Istersen ayni pencerede raf / hucre de ekleyebilirsin.'}</div>

                <div class="stock-modal-grid">
                    <div>
                        <label class="stock-modal-label">Depo adi</label>
                        <input class="stock-input stock-input-tall" value="${StockModule.escapeHtml(StockModule.state.depotDraftName)}" oninput="StockModule.setDraftField('depotName', this.value)" placeholder="or: SEVKIYATA GIDECEK URUNLER" ${editingMain ? 'disabled' : ''}>
                    </div>
                    <div>
                        <label class="stock-modal-label">Not</label>
                        <textarea class="stock-textarea" oninput="StockModule.setDraftField('depotNote', this.value)" placeholder="or: Merdiven yani alan" ${editingMain ? 'disabled' : ''}>${StockModule.escapeHtml(StockModule.state.depotDraftNote)}</textarea>
                    </div>
                </div>

                <div class="stock-modal-divider"></div>
                <div class="stock-modal-subtitle">Hucre ekle</div>

                <div class="stock-modal-row">
                    <div>
                        <label class="stock-modal-label">Raf</label>
                        <input class="stock-input stock-input-tall" value="${StockModule.escapeHtml(StockModule.state.locationDraftRaf)}" oninput="StockModule.setDraftField('locRaf', this.value)" placeholder="or: R01">
                    </div>
                    <div>
                        <label class="stock-modal-label">Hucre</label>
                        <input class="stock-input stock-input-tall" value="${StockModule.escapeHtml(StockModule.state.locationDraftCell)}" oninput="StockModule.setDraftField('locCell', this.value)" placeholder="or: A1">
                    </div>
                    <div>
                        <label class="stock-modal-label">Hucre notu</label>
                        <input class="stock-input stock-input-tall" value="${StockModule.escapeHtml(StockModule.state.locationDraftNote)}" oninput="StockModule.setDraftField('locNote', this.value)" placeholder="opsiyonel">
                    </div>
                    <div class="stock-modal-action">
                        <button class="btn-primary" onclick="StockModule.addDraftLocation()">hucre ekle +</button>
                    </div>
                </div>

                <div class="stock-table-card" style="margin-top:0.9rem;">
                    <table>
                        <thead>
                            <tr>
                                <th style="text-align:left;">Raf</th>
                                <th style="text-align:left;">Hucre</th>
                                <th style="text-align:left;">Not</th>
                                <th style="text-align:left;">Kod</th>
                                <th style="text-align:right;">Islem</th>
                            </tr>
                        </thead>
                        <tbody>${StockModule.renderDepotDraftRows()}</tbody>
                    </table>
                </div>

                <div class="stock-modal-footer">
                    ${editing && !editingMain ? `<button class="btn-sm" onclick="StockModule.deleteDepot('${StockModule.escapeHtml(StockModule.state.depotEditingId || '')}')">Sil</button>` : '<div></div>'}
                    <div style="display:flex; gap:0.55rem;">
                        <button class="btn-sm" onclick="StockModule.resetDepotDraft(); Modal.close()">Vazgec</button>
                        <button class="btn-primary" onclick="StockModule.saveDepotModal()">${editing ? 'Kaydet' : 'Depoyu kaydet'}</button>
                    </div>
                </div>
            </div>
        `, { maxWidth: '960px' });
    },

    saveDepotModal: async () => {
        const name = String(StockModule.state.depotDraftName || '').trim().toUpperCase();
        const note = String(StockModule.state.depotDraftNote || '').trim();
        const editingId = String(StockModule.state.depotEditingId || '');
        const editingMain = editingId === 'main';
        if (!name) return alert('Depo adi zorunlu.');

        const duplicateName = (DB.data.data.stockDepots || []).some((row) =>
            String(row?.id || '') !== editingId
            && String(row?.name || '').trim().toUpperCase() === name
            && row?.isActive !== false
        );
        if (duplicateName) return alert('Bu isimde bir depo zaten var.');

        let depotId = editingId;
        const now = new Date().toISOString();
        if (editingId) {
            if (!editingMain) {
                const depot = (DB.data.data.stockDepots || []).find((row) => String(row?.id || '') === editingId);
                if (!depot) return;
                depot.name = name;
                depot.note = note;
                depot.isActive = true;
            }
        } else {
            depotId = StockModule.makeDepotId(name);
            DB.data.data.stockDepots.push({ id: depotId, name, note, isActive: true, created_at: now });
        }

        const nextLocations = (StockModule.state.depotDraftLocations || []).map((row) => ({
            id: String(row?.id || '').trim() || crypto.randomUUID(),
            depotId,
            rafCode: String(row?.rafCode || '').trim().toUpperCase(),
            cellCode: String(row?.cellCode || '').trim().toUpperCase(),
            note: String(row?.note || '').trim(),
            created_at: now
        }));

        DB.data.data.stockDepotLocations = (DB.data.data.stockDepotLocations || [])
            .filter((row) => String(row?.depotId || '') !== depotId)
            .concat(nextLocations);

        StockModule.state.selectedKey = `managed:${depotId}`;
        StockModule.state.topTab = depotId === 'depot_transfer' ? 'transfer' : 'all';
        await DB.save();
        StockModule.resetDepotDraft();
        Modal.close();
        UI.renderCurrentPage();
    },

    deleteDepot: async (depotId) => {
        const depot = (DB.data.data.stockDepots || []).find((row) => String(row?.id || '') === String(depotId || ''));
        if (!depot) return;
        if (!confirm('Bu depoyu listeden kaldirmak istiyor musunuz?')) return;
        depot.isActive = false;
        DB.data.data.stockDepotLocations = (DB.data.data.stockDepotLocations || []).filter((row) => String(row?.depotId || '') !== String(depotId || ''));
        if (String(StockModule.state.selectedKey || '') === `managed:${String(depotId || '')}`) {
            StockModule.state.selectedKey = 'all';
            StockModule.state.topTab = 'all';
        }
        await DB.save();
        StockModule.resetDepotDraft();
        Modal.close();
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
            const rowCanEdit = canEdit && item?.editable === true;
            return `
                            <div class="stock-side-row${rowCanEdit ? ' with-edit' : ''}">
                                <button onclick="StockModule.selectNode('${StockModule.escapeHtml(item.key || '')}')" class="stock-side-btn${selected ? ' active' : ''}">${StockModule.escapeHtml(item.name || '-')}</button>
                                ${rowCanEdit ? `<button class="stock-side-edit" onclick="event.stopPropagation(); StockModule.openDepotEditModal('${StockModule.escapeHtml(item.id || '')}')">duzenle</button>` : ''}
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    },

    renderInventoryGroups: (node) => {
        const groups = StockModule.getInventoryGroups(node);
        if (groups.length === 0 || groups.every((group) => group.rows.length === 0)) {
            return `<div class="stock-table-card"><div class="stock-empty">Bu alanda listelenecek urun henuz yok. Diger moduller malzeme yerlestirdikce burada gorunecek.</div></div>`;
        }
        return groups.map((group) => `
            <div class="stock-group-card">
                ${String(node?.key || '') === 'all' ? `<div class="stock-group-title">${StockModule.escapeHtml(group.title)}</div>` : ''}
                <div class="stock-table-card" style="margin-top:${String(node?.key || '') === 'all' ? '0.65rem' : '0'};">
                    <table>
                        <thead>
                            <tr>
                                <th style="text-align:left;">Urun adi</th>
                                <th style="text-align:left;">ID kodu</th>
                                <th style="text-align:left;">Detay</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${group.rows.map((row) => {
            const detail = [];
            if (row.locationCode) detail.push(`Konum: ${row.locationCode}`);
            if (row.quantity !== '' && row.quantity !== null && row.quantity !== undefined) detail.push(`Miktar: ${row.quantity}${row.unit ? ` ${row.unit}` : ''}`);
            if (row.status) detail.push(`Durum: ${row.status}`);
            return `
                                    <tr>
                                        <td style="font-weight:700; color:#0f172a;">${StockModule.escapeHtml(row.name || '-')}</td>
                                        <td style="font-family:monospace; color:#1d4ed8; font-weight:700;">${StockModule.escapeHtml(row.code || '-')}</td>
                                        <td style="color:#64748b;">${StockModule.escapeHtml(detail.join(' • ') || 'Detay daha sonra zenginlestirilecek.')}</td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `).join('');
    },

    renderLocationsCard: (node) => {
        if (node.kind !== 'managed') return '';
        const locations = StockModule.getDepotLocations(node.id);
        return `
            <div class="stock-location-card">
                <div class="stock-location-head">
                    <div class="stock-location-title">tanimli konumlar</div>
                    ${node.editable ? `<button class="btn-sm" onclick="StockModule.openDepotEditModal('${StockModule.escapeHtml(node.id || '')}')">hucreleri duzenle</button>` : ''}
                </div>
                ${locations.length === 0 ? `<div class="stock-location-empty">Bu depoda henuz raf / hucre tanimi yok.</div>` : `
                    <div class="stock-location-list">
                        ${locations.map((row) => `
                            <div class="stock-location-chip">
                                <div class="stock-location-chip-code">${StockModule.escapeHtml(StockModule.getLocationCode(row))}</div>
                                <div class="stock-location-chip-note">${StockModule.escapeHtml(row.note || 'not yok')}</div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    },

    renderReferenceNotice: (node) => {
        if (node.kind !== 'unit' && node.kind !== 'external' && node.kind !== 'all') return '';
        return `
            <div class="stock-ref-card">
                <div class="stock-ref-label">${node.kind === 'all' ? 'Tum depo gorunumu' : node.kind === 'unit' ? 'Atolye gozlemi' : 'Dis birim gozlemi'}</div>
                <div class="stock-ref-title">${StockModule.escapeHtml(node.name || '-')}</div>
                <div class="stock-ref-text">Bu ekran bu alanlarda stok hareketi yapmaz. Sadece urunlerin nerede oldugunu ve hangi depoda gorundugunu izlemek icin kullanilir.</div>
            </div>
        `;
    },

    renderMenuLayout: () => {
        return `
            <section class="stock-shell">
                <div class="stock-hub">
                    <div class="stock-hub-head">
                        <h2 class="stock-title">depo & stok</h2>
                    </div>

                    <div class="stock-hub-grid">
                        <button class="stock-hub-card" onclick="StockModule.openWorkspace('depots')">
                            <div class="stock-hub-icon"><i data-lucide="warehouse" width="24" height="24"></i></div>
                            <div class="stock-hub-label">Tum depolar</div>
                        </button>
                    </div>
                </div>
            </section>
        `;
    },

    renderDepotsLayout: () => {
        const node = StockModule.getSelectedNode();
        const mainDepot = StockModule.getMainDepot();
        const customDepots = StockModule.getCustomDepots();
        const transferDepot = customDepots.find((row) => String(row?.id || '') === 'depot_transfer') || null;
        const userDepots = customDepots.filter((row) => String(row?.id || '') !== 'depot_transfer');
        const unitDepots = StockModule.getUnitRowsMeta();
        const workshopDepots = transferDepot ? [transferDepot, ...unitDepots] : unitDepots;
        const externalDepots = StockModule.getExternalRowsMeta();
        const overview = StockModule.getOverviewSummary();
        const managedSummary = node.kind === 'managed' ? StockModule.getManagedSummary(node.id) : null;

        const customDepotSection = `
            ${StockModule.renderSidebarSection('Kullanici depolari', userDepots, { canEdit: true })}
            <div class="stock-side-row"><button onclick="StockModule.openDepotCreateModal()" class="stock-side-add">depo ekle +</button></div>
        `;
        const sidebarHtml = `
            <div class="stock-side-row"><button onclick="StockModule.selectNode('all')" class="stock-side-btn${String(StockModule.state.selectedKey || '') === 'all' ? ' active' : ''}">TUM DEPOLAR</button></div>
            ${StockModule.renderSidebarSection('Ana depo', [mainDepot], { canEdit: true })}
            ${customDepotSection}
            ${StockModule.renderSidebarSection('Birim / atolye depolari', workshopDepots, { canEdit: true })}
            ${StockModule.renderSidebarSection('Fason / dis birimler', externalDepots)}
        `;

        return `
            <section class="stock-shell">
                <div class="stock-hero">
                    <div class="stock-hero-header">
                        <div>
                            <h2 class="stock-title">depo & stok</h2>
                            <div class="stock-desc">Bu ekran depo adreslerini insa etmek ve fabrikadaki urunlerin hangi depoda gorundugunu izlemek icin kullanilir. Mal kabul, sevk, teslim alma ve transfer modulleri hedef lokasyonu buradan secer.</div>
                        </div>
                    </div>

                    <div class="stock-metrics">
                        <div class="stock-metric"><div class="stock-metric-label">Tanimli depo</div><div class="stock-metric-value">${overview.managedCount}</div></div>
                        <div class="stock-metric"><div class="stock-metric-label">Toplam konum</div><div class="stock-metric-value">${overview.locationCount}</div></div>
                        <div class="stock-metric"><div class="stock-metric-label">Atolye depolari</div><div class="stock-metric-value">${overview.unitCount}</div></div>
                        <div class="stock-metric"><div class="stock-metric-label">Dis birim</div><div class="stock-metric-value">${overview.externalCount}</div></div>
                    </div>

                    <div class="stock-note-banner">
                        <div style="display:flex; justify-content:space-between; gap:0.8rem; align-items:flex-start; flex-wrap:wrap;">
                            <div>
                                <div class="stock-banner-title">${StockModule.escapeHtml(node.name || '-')}</div>
                                <div class="stock-banner-note">${StockModule.escapeHtml(node.note || '')}</div>
                            </div>
                            <div style="display:flex; gap:0.55rem; flex-wrap:wrap;">
                                ${node.kind === 'managed' && node.editable ? `<button class="btn-sm" onclick="StockModule.openDepotEditModal('${StockModule.escapeHtml(node.id || '')}')">duzenle</button>` : ''}
                                <button class="btn-primary" onclick="StockModule.openDepotCreateModal()">depo ekle +</button>
                            </div>
                        </div>
                        ${node.kind === 'managed' && managedSummary ? `
                            <div class="stock-banner-meta">
                                <div class="stock-banner-meta-item"><div class="stock-banner-meta-label">Secili depo</div><div class="stock-banner-meta-value">${StockModule.escapeHtml(node.name || '-')}</div></div>
                                <div class="stock-banner-meta-item"><div class="stock-banner-meta-label">Raf sayisi</div><div class="stock-banner-meta-value">${managedSummary.rafCount}</div></div>
                                <div class="stock-banner-meta-item"><div class="stock-banner-meta-label">Hucre sayisi</div><div class="stock-banner-meta-value">${managedSummary.locationCount}</div></div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="stock-workspace">
                    <aside class="stock-sidebar">${sidebarHtml}</aside>

                    <div class="stock-content">
                        <div class="stock-section-head">
                            <div class="stock-section-title">${String(node?.key || '') === 'all' ? 'tum depo icerigi' : `${StockModule.escapeHtml(node.name || '-')} / urun gorunumu`}</div>
                            <div class="stock-section-helper">${String(node?.key || '') === 'all' ? 'Depo secilmediginde arama tum depolarda calisir.' : 'Arama secili deponun icinde urun adi ve ID koduna gore calisir.'}</div>
                        </div>

                        <div class="stock-search-grid stock-search-grid-2">
                            <input id="stock-search-name" class="stock-input" value="${StockModule.escapeHtml(StockModule.state.searchName)}" oninput="StockModule.setSearch('name', this.value)" placeholder="urun adi ile ara">
                            <input id="stock-search-code" class="stock-input" value="${StockModule.escapeHtml(StockModule.state.searchCode)}" oninput="StockModule.setSearch('code', this.value)" placeholder="ID kod ile ara">
                        </div>

                        ${StockModule.renderInventoryGroups(node)}
                        ${StockModule.renderLocationsCard(node)}
                        ${StockModule.renderReferenceNotice(node)}
                    </div>
                </div>
            </section>
        `;
    },

    renderLayout: () => {
        if (String(StockModule.state.workspaceView || 'menu') === 'depots') {
            return StockModule.renderDepotsLayout();
        }
        return StockModule.renderMenuLayout();
    }
};
