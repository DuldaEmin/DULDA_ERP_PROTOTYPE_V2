const StockModule = {
    state: {
        view: 'home',
        selectedDepotId: 'main',
        depotTab: 'stocks'
    },

    ensureData: () => {
        if (!DB.data || typeof DB.data !== 'object') DB.data = {};
        if (!DB.data.data || typeof DB.data.data !== 'object') DB.data.data = {};
        if (!DB.data.meta || typeof DB.data.meta !== 'object') DB.data.meta = {};
        if (!DB.data.meta.seedFlags || typeof DB.data.meta.seedFlags !== 'object') DB.data.meta.seedFlags = {};
        if (!Array.isArray(DB.data.data.stockDepots)) DB.data.data.stockDepots = [];
        if (!Array.isArray(DB.data.data.stockDepotLocations)) DB.data.data.stockDepotLocations = [];
        if (!Array.isArray(DB.data.data.stockDepotItems)) DB.data.data.stockDepotItems = [];

        if (!DB.data.meta.seedFlags.stockDepotsSeededV1) {
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
            DB.data.meta.seedFlags.stockDepotsSeededV1 = true;
            DB.markDirty();
        }
    },

    escapeHtml: (value) => {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    render: (container) => {
        if (!container) return;
        StockModule.ensureData();

        if (StockModule.state.view === 'depot') {
            StockModule.renderDepotDetail(container, StockModule.state.selectedDepotId || 'main');
        } else {
            StockModule.renderHome(container);
        }

        if (window.lucide) window.lucide.createIcons();
    },

    goHome: () => {
        StockModule.state.view = 'home';
        StockModule.state.selectedDepotId = 'main';
        StockModule.state.depotTab = 'stocks';
        UI.renderCurrentPage();
    },

    getMainDepot: () => ({
        id: 'main',
        name: 'ANA DEPO',
        note: 'Kapali ana depo / rafli hucre yapisi'
    }),

    getCustomDepots: () => {
        return (DB.data.data.stockDepots || [])
            .filter(row => row?.isActive !== false)
            .slice()
            .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'tr'));
    },

    getDepotById: (depotId) => {
        const key = String(depotId || '').trim();
        if (key === 'main') return StockModule.getMainDepot();
        return StockModule.getCustomDepots().find(row => String(row?.id || '') === key) || null;
    },

    getDepotLocations: (depotId) => {
        return (DB.data.data.stockDepotLocations || [])
            .filter(row => String(row?.depotId || '') === String(depotId || ''))
            .slice()
            .sort((a, b) => {
                const rafCmp = String(a?.rafCode || '').localeCompare(String(b?.rafCode || ''), 'tr');
                if (rafCmp !== 0) return rafCmp;
                return String(a?.cellCode || '').localeCompare(String(b?.cellCode || ''), 'tr');
            });
    },

    getDepotItems: (depotId) => {
        return (DB.data.data.stockDepotItems || [])
            .filter(row => String(row?.depotId || '') === String(depotId || ''))
            .slice()
            .sort((a, b) => String(a?.productCode || '').localeCompare(String(b?.productCode || ''), 'tr'));
    },

    getDepotSummary: (depotId) => {
        const items = StockModule.getDepotItems(depotId);
        const locations = StockModule.getDepotLocations(depotId);
        const occupiedKeys = new Set(items.map(row => `${String(row?.rafCode || '')}|${String(row?.cellCode || '')}`));
        const totalQty = items.reduce((sum, row) => sum + Number(row?.qty || 0), 0);
        const criticalCount = items.filter(row => Number(row?.minQty || 0) > 0 && Number(row?.qty || 0) < Number(row?.minQty || 0)).length;
        return {
            productCount: items.length,
            totalQty,
            locationCount: locations.length,
            occupiedCount: occupiedKeys.size,
            emptyCount: Math.max(0, locations.length - occupiedKeys.size),
            criticalCount
        };
    },

    getUnitDepotCards: () => {
        const units = (DB.data?.data?.units || [])
            .filter(row => String(row?.type || '') === 'internal' && String(row?.id || '') !== 'u_dtm')
            .slice()
            .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'tr'));

        return units.map(unit => {
            let waiting = 0;
            let inProcess = 0;
            let ready = 0;
            if (typeof UnitModule !== 'undefined' && UnitModule && typeof UnitModule.getUnitWorkRows === 'function') {
                const rows = UnitModule.getUnitWorkRows(unit.id);
                waiting = rows.reduce((sum, row) => sum + Number(row?.metrics?.availableQty || 0), 0);
                inProcess = rows.reduce((sum, row) => sum + Number(row?.metrics?.inProcessQty || 0), 0);
                ready = rows.reduce((sum, row) => sum + Number(row?.metrics?.doneQty || 0), 0);
            }
            return { unit, waiting, inProcess, ready };
        });
    },

    openDepot: (depotId) => {
        StockModule.state.selectedDepotId = String(depotId || 'main');
        StockModule.state.view = 'depot';
        StockModule.state.depotTab = 'stocks';
        UI.renderCurrentPage();
    },

    openUnitDepot: (unitId) => {
        if (typeof Router === 'undefined' || typeof UnitModule === 'undefined' || !UnitModule) return;
        Router.navigate('units');
        if (typeof UnitModule.openUnitDepot === 'function') UnitModule.openUnitDepot(unitId);
    },

    setDepotTab: (tabId) => {
        StockModule.state.depotTab = String(tabId || 'stocks');
        UI.renderCurrentPage();
    },

    openDepotCreateModal: () => {
        Modal.open('Yeni Depo Ekle', `
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
                <div>
                    <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Depo adi</label>
                    <input id="stock_depot_name" placeholder="or: Sevkiyat Alani" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
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
        const name = String(document.getElementById('stock_depot_name')?.value || '').trim().toUpperCase();
        const note = String(document.getElementById('stock_depot_note')?.value || '').trim();
        if (!name) return alert('Depo adi zorunlu.');
        if (!Array.isArray(DB.data.data.stockDepots)) DB.data.data.stockDepots = [];
        DB.data.data.stockDepots.push({
            id: crypto.randomUUID(),
            name,
            note,
            isActive: true,
            created_at: new Date().toISOString()
        });
        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },

    openLocationCreateModal: (depotId) => {
        const depot = StockModule.getDepotById(depotId);
        if (!depot) return;
        Modal.open(`${StockModule.escapeHtml(depot.name)} - Hucre Ekle`, `
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
        if (!Array.isArray(DB.data.data.stockDepotLocations)) DB.data.data.stockDepotLocations = [];
        const exists = DB.data.data.stockDepotLocations.some(row =>
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

    renderHome: (container) => {
        const mainDepot = StockModule.getMainDepot();
        const mainSummary = StockModule.getDepotSummary('main');
        const customDepots = StockModule.getCustomDepots();
        const unitCards = StockModule.getUnitDepotCards();
        const renderStat = (label, value) => `<div style="display:flex; flex-direction:column; gap:0.15rem;"><span style="font-size:0.72rem; color:#64748b;">${label}</span><strong style="font-size:0.95rem; color:#0f172a;">${value}</strong></div>`;
        const renderManagedDepotCard = (depot) => {
            const summary = StockModule.getDepotSummary(depot.id);
            return `
                <button onclick="StockModule.openDepot('${StockModule.escapeHtml(depot.id)}')" style="text-align:left; background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:1rem; box-shadow:0 12px 24px rgba(15,23,42,0.05); cursor:pointer;">
                    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:0.8rem; margin-bottom:0.85rem;">
                        <div>
                            <div style="font-size:1rem; font-weight:800; color:#0f172a;">${StockModule.escapeHtml(depot.name || '-')}</div>
                            <div style="font-size:0.78rem; color:#64748b; margin-top:0.2rem;">${StockModule.escapeHtml(depot.note || 'Kullanici yonetimli depo')}</div>
                        </div>
                        <div style="width:2.75rem; height:2.75rem; border-radius:0.85rem; background:#ecfdf5; color:#059669; display:flex; align-items:center; justify-content:center;">
                            <i data-lucide="warehouse" width="20" height="20"></i>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.55rem;">
                        ${renderStat('Toplam urun', summary.productCount)}
                        ${renderStat('Toplam miktar', summary.totalQty)}
                        ${renderStat('Dolu hucre', summary.occupiedCount)}
                        ${renderStat('Kritik', summary.criticalCount)}
                    </div>
                </button>
            `;
        };
        const renderUnitCard = (row) => `
            <button onclick="StockModule.openUnitDepot('${StockModule.escapeHtml(row.unit.id)}')" style="text-align:left; background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:1rem; box-shadow:0 12px 24px rgba(15,23,42,0.05); cursor:pointer;">
                <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:0.8rem; margin-bottom:0.85rem;">
                    <div>
                        <div style="font-size:1rem; font-weight:800; color:#0f172a;">${StockModule.escapeHtml(row.unit.name || '-')}</div>
                        <div style="font-size:0.78rem; color:#64748b; margin-top:0.2rem;">Sadece goruntuleme / operasyon deposu</div>
                    </div>
                    <div style="width:2.75rem; height:2.75rem; border-radius:0.85rem; background:#eff6ff; color:#2563eb; display:flex; align-items:center; justify-content:center;">
                        <i data-lucide="factory" width="20" height="20"></i>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.55rem;">
                    ${renderStat('Bekleyen', row.waiting)}
                    ${renderStat('Islemde', row.inProcess)}
                    ${renderStat('Hazir', row.ready)}
                </div>
            </button>
        `;

        container.innerHTML = `
            <main style="padding:1.5rem; min-height:420px;">
                <section style="max-width:1380px; margin:0 auto;">
                    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:1.1rem;">
                        <div>
                            <h2 style="margin:0; font-size:1.9rem; line-height:1.1; color:#0f172a; font-weight:900;">Depo & Stok Merkezi</h2>
                            <div style="margin-top:0.35rem; font-size:0.92rem; color:#64748b;">Ana depo, kullanici depolari ve birim / atolye depolarini tek merkezden gor.</div>
                        </div>
                        <button class="btn-primary" onclick="StockModule.openDepotCreateModal()" style="min-width:150px;">Depo Ekle +</button>
                    </div>

                    <div style="margin-bottom:1.25rem;">
                        <div style="font-size:0.82rem; font-weight:800; color:#64748b; letter-spacing:0.04em; text-transform:uppercase; margin:0 0 0.55rem 0.2rem;">Ana Depo</div>
                        ${renderManagedDepotCard(mainDepot)}
                    </div>

                    <div style="margin-bottom:1.25rem;">
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:0.8rem; flex-wrap:wrap; margin-bottom:0.55rem;">
                            <div style="font-size:0.82rem; font-weight:800; color:#64748b; letter-spacing:0.04em; text-transform:uppercase; margin-left:0.2rem;">Kullanici Depolari</div>
                            <div style="font-size:0.8rem; color:#64748b;">Yeni depolar eklenebilir, raf / hucre yonetilebilir.</div>
                        </div>
                        ${customDepots.length === 0 ? `
                            <div style="background:white; border:1px dashed #cbd5e1; border-radius:1rem; padding:1.1rem; color:#94a3b8; text-align:center;">Henuz kullanici deposu yok. <button class="btn-sm" onclick="StockModule.openDepotCreateModal()" style="margin-left:0.4rem;">ilk depoyu ekle</button></div>
                        ` : `
                            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:0.8rem;">
                                ${customDepots.map(renderManagedDepotCard).join('')}
                            </div>
                        `}
                    </div>

                    <div>
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:0.8rem; flex-wrap:wrap; margin-bottom:0.55rem;">
                            <div style="font-size:0.82rem; font-weight:800; color:#64748b; letter-spacing:0.04em; text-transform:uppercase; margin-left:0.2rem;">Birim / Atolye Depolari</div>
                            <div style="font-size:0.8rem; color:#64748b;">Bu depolar sadece goruntulenir, yapisi buradan degistirilmez.</div>
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:0.8rem;">
                            ${unitCards.map(renderUnitCard).join('')}
                        </div>
                    </div>
                </section>
            </main>
        `;
    },

    renderDepotDetail: (container, depotId) => {
        const depot = StockModule.getDepotById(depotId);
        if (!depot) {
            StockModule.goHome();
            return;
        }
        const summary = StockModule.getDepotSummary(depotId);
        const locations = StockModule.getDepotLocations(depotId);
        const items = StockModule.getDepotItems(depotId);
        const tab = String(StockModule.state.depotTab || 'stocks');
        const locationRows = locations.map(location => {
            const item = items.find(row =>
                String(row?.rafCode || '') === String(location?.rafCode || '')
                && String(row?.cellCode || '') === String(location?.cellCode || '')
            );
            return { location, item };
        });
        const renderTab = (id, label) => `
            <button class="btn-sm" onclick="StockModule.setDepotTab('${id}')" style="${tab === id ? 'background:#0f172a; color:#fff; border-color:#0f172a;' : ''}">
                ${label}
            </button>
        `;

        container.innerHTML = `
            <main style="padding:1.5rem; min-height:420px;">
                <section style="max-width:1380px; margin:0 auto;">
                    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:1rem;">
                        <div style="display:flex; align-items:flex-start; gap:0.75rem;">
                            <button onclick="StockModule.goHome()" style="background:white; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem; cursor:pointer;">
                                <i data-lucide="arrow-left" width="18" height="18"></i>
                            </button>
                            <div>
                                <h2 style="margin:0; font-size:1.8rem; line-height:1.1; color:#0f172a; font-weight:900;">${StockModule.escapeHtml(depot.name || '-')}</h2>
                                <div style="margin-top:0.35rem; font-size:0.9rem; color:#64748b;">${StockModule.escapeHtml(depot.note || 'Depo iskeleti. Alt bolumler zamanla detaylandirilacak.')}</div>
                            </div>
                        </div>
                        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                            <button class="btn-sm" onclick="StockModule.openLocationCreateModal('${StockModule.escapeHtml(depot.id)}')">Hucre Ekle</button>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.7rem; margin-bottom:1rem;">
                        <div style="background:white; border:1px solid #e2e8f0; border-radius:0.8rem; padding:0.8rem 0.9rem;"><div style="font-size:0.74rem; color:#64748b;">Toplam urun</div><div style="font-size:1.15rem; font-weight:900; color:#0f172a;">${summary.productCount}</div></div>
                        <div style="background:white; border:1px solid #e2e8f0; border-radius:0.8rem; padding:0.8rem 0.9rem;"><div style="font-size:0.74rem; color:#64748b;">Toplam miktar</div><div style="font-size:1.15rem; font-weight:900; color:#0f172a;">${summary.totalQty}</div></div>
                        <div style="background:white; border:1px solid #e2e8f0; border-radius:0.8rem; padding:0.8rem 0.9rem;"><div style="font-size:0.74rem; color:#64748b;">Dolu hucre</div><div style="font-size:1.15rem; font-weight:900; color:#0f172a;">${summary.occupiedCount}</div></div>
                        <div style="background:white; border:1px solid #e2e8f0; border-radius:0.8rem; padding:0.8rem 0.9rem;"><div style="font-size:0.74rem; color:#64748b;">Kritik stok</div><div style="font-size:1.15rem; font-weight:900; color:#b91c1c;">${summary.criticalCount}</div></div>
                    </div>

                    <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.8rem; margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap;">
                        <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                            ${renderTab('stocks', 'Stoklar')}
                            ${renderTab('locations', 'Raf / Hucreler')}
                            ${renderTab('movements', 'Hareketler')}
                        </div>
                        <div style="font-size:0.8rem; color:#64748b;">Ilk faz iskelet ekran. Stok hareket detaylari sonra baglanacak.</div>
                    </div>

                    ${tab === 'stocks' ? `
                        <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:1rem;">
                            <div class="card-table">
                                <table style="width:100%; border-collapse:collapse;">
                                    <thead>
                                        <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                                            <th style="padding:0.55rem; text-align:left;">Kod</th>
                                            <th style="padding:0.55rem; text-align:left;">Urun</th>
                                            <th style="padding:0.55rem; text-align:left;">Tur</th>
                                            <th style="padding:0.55rem; text-align:center;">Miktar</th>
                                            <th style="padding:0.55rem; text-align:left;">Konum</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${items.length === 0 ? `<tr><td colspan="5" style="padding:1rem; text-align:center; color:#94a3b8;">Bu depoda henuz manuel stok kaydi yok. Iskelet hazir, altini sonra dolduracagiz.</td></tr>` : items.map(item => `
                                            <tr style="border-bottom:1px solid #f1f5f9;">
                                                <td style="padding:0.55rem; font-family:monospace; font-weight:700; color:#1d4ed8;">${StockModule.escapeHtml(item.productCode || '-')}</td>
                                                <td style="padding:0.55rem; font-weight:700; color:#334155;">${StockModule.escapeHtml(item.productName || '-')}</td>
                                                <td style="padding:0.55rem;">${StockModule.escapeHtml(item.kind || '-')}</td>
                                                <td style="padding:0.55rem; text-align:center; font-weight:800;">${Number(item.qty || 0)}</td>
                                                <td style="padding:0.55rem;">${StockModule.escapeHtml(`${item.rafCode || '-'} / ${item.cellCode || '-'}`)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ` : ''}

                    ${tab === 'locations' ? `
                        <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:1rem;">
                            <div style="display:flex; justify-content:flex-end; margin-bottom:0.7rem;">
                                <button class="btn-primary" onclick="StockModule.openLocationCreateModal('${StockModule.escapeHtml(depot.id)}')">Hucre Ekle +</button>
                            </div>
                            <div class="card-table">
                                <table style="width:100%; border-collapse:collapse;">
                                    <thead>
                                        <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                                            <th style="padding:0.55rem; text-align:left;">Raf</th>
                                            <th style="padding:0.55rem; text-align:left;">Hucre</th>
                                            <th style="padding:0.55rem; text-align:left;">Durum</th>
                                            <th style="padding:0.55rem; text-align:left;">Icerik</th>
                                            <th style="padding:0.55rem; text-align:left;">Not</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${locationRows.length === 0 ? `<tr><td colspan="5" style="padding:1rem; text-align:center; color:#94a3b8;">Henuz raf / hucre tanimi yok.</td></tr>` : locationRows.map(row => `
                                            <tr style="border-bottom:1px solid #f1f5f9;">
                                                <td style="padding:0.55rem; font-weight:700; color:#334155;">${StockModule.escapeHtml(row.location.rafCode || '-')}</td>
                                                <td style="padding:0.55rem; font-weight:700; color:#334155;">${StockModule.escapeHtml(row.location.cellCode || '-')}</td>
                                                <td style="padding:0.55rem;">${row.item ? '<span style="color:#047857; font-weight:700;">Dolu</span>' : '<span style="color:#94a3b8; font-weight:700;">Bos</span>'}</td>
                                                <td style="padding:0.55rem;">${StockModule.escapeHtml(row.item?.productName || '-')}</td>
                                                <td style="padding:0.55rem; color:#64748b;">${StockModule.escapeHtml(row.location.note || '-')}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ` : ''}

                    ${tab === 'movements' ? `
                        <div style="background:white; border:1px dashed #cbd5e1; border-radius:1rem; padding:2rem; text-align:center;">
                            <div style="font-size:1.05rem; font-weight:800; color:#334155; margin-bottom:0.45rem;">Hareketler</div>
                            <div style="font-size:0.9rem; color:#64748b;">Bu sekmede daha sonra depo giris, transfer, sevkiyat ve fason hareketleri listelenecek.</div>
                        </div>
                    ` : ''}
                </section>
            </main>
        `;
    }
};
