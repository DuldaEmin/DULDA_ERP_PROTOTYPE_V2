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
            const matchSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.code.toLowerCase().includes(searchQuery.toLowerCase());
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
                        <input value="${searchQuery}" oninput="StockModule.setSearch(this.value)" placeholder="Stok ara..." class="bg-slate-100 rounded-lg text-sm font-semibold outline-none" style="background:#f1f5f9; padding:0.5rem 1rem 0.5rem 2.5rem; border-radius:0.5rem; border:none; width:200px">
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


