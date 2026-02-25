const PurchasingModule = {
    state: { activeTab: 'orders', searchTerm: '' }, // orders | requests | suppliers

    normalizeText: (value) => String(value || '').trim().toLocaleLowerCase('tr-TR'),

    parseCommaList: (raw) => {
        return (raw || '')
            .split(',')
            .map(x => x.trim())
            .filter(Boolean)
            .filter((v, i, arr) => arr.findIndex(z => z.toLowerCase() === v.toLowerCase()) === i);
    },

    normalizeSupplierRecord: (raw, index) => {
        const src = (raw && typeof raw === 'object') ? raw : {};
        const contactRaw = (src.contact && typeof src.contact === 'object') ? src.contact : {};

        return {
            ...src,
            id: src.id || crypto.randomUUID(),
            name: (src.name || '').trim() || `Tedarikci ${index + 1}`,
            entityType: src.entityType || 'company',
            tags: Array.isArray(src.tags) ? src.tags.filter(Boolean) : [],
            notes: typeof src.notes === 'string' ? src.notes : '',
            contact: {
                person: contactRaw.person || '',
                phone: contactRaw.phone || '',
                email: contactRaw.email || '',
                web: contactRaw.web || '',
                tax: contactRaw.tax || '',
                address: contactRaw.address || '',
                city: contactRaw.city || '',
                country: contactRaw.country || ''
            }
        };
    },

    supplierMatchesRef: (supplier, ref) => {
        if (!ref) return false;

        if (typeof ref === 'object') {
            const refId = String(ref.id || '').trim();
            const refName = String(ref.name || '').trim();
            if (supplier.id && refId && refId === supplier.id) return true;
            if (refName && PurchasingModule.normalizeText(refName) === PurchasingModule.normalizeText(supplier.name)) return true;
            return false;
        }

        const refStr = String(ref).trim();
        if (!refStr) return false;
        if (supplier.id && refStr === supplier.id) return true;
        return PurchasingModule.normalizeText(refStr) === PurchasingModule.normalizeText(supplier.name);
    },

    getSupplierRefsFromProduct: (product) => {
        const refs = [];
        const pushRef = (val) => {
            if (val === undefined || val === null) return;
            if (Array.isArray(val)) {
                val.forEach(pushRef);
                return;
            }
            if (typeof val === 'string' && val.includes(',')) {
                PurchasingModule.parseCommaList(val).forEach(v => refs.push(v));
                return;
            }
            refs.push(val);
        };

        if (!product || typeof product !== 'object') return refs;
        pushRef(product.suppliers);
        pushRef(product.supplierIds);
        pushRef(product.supplierId);
        pushRef(product.supplierNames);
        pushRef(product.supplierName);
        return refs;
    },

    getLinkedProductsForSupplier: (supplier) => {
        const linked = [];

        const addProductName = (name) => {
            const label = String(name || '').trim();
            if (!label) return;
            linked.push(label);
        };

        (DB.data.data.aluminumProfiles || []).forEach(profile => {
            const refs = Array.isArray(profile?.suppliers) ? profile.suppliers : [];
            if (refs.some(ref => PurchasingModule.supplierMatchesRef(supplier, ref))) {
                addProductName(profile?.name || profile?.code || profile?.id || 'Adsiz urun');
            }
        });

        (DB.data.data.products || []).forEach(product => {
            const refs = PurchasingModule.getSupplierRefsFromProduct(product);
            if (refs.some(ref => PurchasingModule.supplierMatchesRef(supplier, ref))) {
                addProductName(product?.name || product?.productName || product?.code || product?.id || 'Adsiz urun');
            }
        });

        const uniqByKey = new Map();
        linked.forEach(item => {
            const key = PurchasingModule.normalizeText(item);
            if (key && !uniqByKey.has(key)) uniqByKey.set(key, item);
        });

        return Array.from(uniqByKey.values()).sort((a, b) => a.localeCompare(b, 'tr'));
    },

    ensureDataDefaults: () => {
        if (!DB.data.data.orders) DB.data.data.orders = [];
        if (!DB.data.data.requests) DB.data.data.requests = [];
        if (!DB.data.data.suppliers) DB.data.data.suppliers = [];

        // Keep demo seed only if list is empty.
        if (DB.data.data.suppliers.length === 0) {
            DB.data.data.suppliers = [
                {
                    id: 'sup1',
                    name: 'AKPA ALUMINYUM',
                    entityType: 'company',
                    tags: ['Hammadde'],
                    notes: '',
                    contact: {
                        person: 'Ahmet Yilmaz',
                        phone: '0532 111 22 33',
                        email: '',
                        web: '',
                        tax: '1234567890',
                        address: 'OSB Mah.',
                        city: 'Istanbul',
                        country: 'Turkiye'
                    }
                },
                {
                    id: 'sup2',
                    name: 'TEKIN ELOKSAL',
                    entityType: 'company',
                    tags: ['Kaplama'],
                    notes: '',
                    contact: {
                        person: 'Mehmet Demir',
                        phone: '0555 444 55 66',
                        email: '',
                        web: '',
                        tax: '0987654321',
                        address: 'Sanayi Sit.',
                        city: 'Istanbul',
                        country: 'Turkiye'
                    }
                }
            ];
        }

        let changed = false;
        DB.data.data.suppliers = (DB.data.data.suppliers || []).map((supplier, index) => {
            const normalized = PurchasingModule.normalizeSupplierRecord(supplier, index);
            if (
                !supplier ||
                !supplier.id ||
                !supplier.contact ||
                !Array.isArray(supplier.tags) ||
                typeof supplier.notes !== 'string' ||
                !supplier.entityType
            ) {
                changed = true;
            }
            return normalized;
        });

        if (changed && typeof DB.markDirty === 'function') DB.markDirty();
    },

    render: (container) => {
        PurchasingModule.ensureDataDefaults();

        const { activeTab, searchTerm } = PurchasingModule.state;
        const orders = DB.data.data.orders || [];
        const requests = DB.data.data.requests || [];
        const suppliers = DB.data.data.suppliers || [];
        const term = PurchasingModule.normalizeText(searchTerm);
        const linkedCache = new Map();
        const getLinkedProducts = (supplier) => {
            const key = supplier.id || `name:${PurchasingModule.normalizeText(supplier.name)}`;
            if (!linkedCache.has(key)) linkedCache.set(key, PurchasingModule.getLinkedProductsForSupplier(supplier));
            return linkedCache.get(key);
        };

        const filteredSuppliers = suppliers.filter(s => {
            if (!term) return true;
            const linkedProducts = getLinkedProducts(s);
            return (
                PurchasingModule.normalizeText(s.name).includes(term) ||
                PurchasingModule.normalizeText(s.contact?.person).includes(term) ||
                PurchasingModule.normalizeText(s.contact?.phone).includes(term) ||
                PurchasingModule.normalizeText(s.contact?.tax).includes(term) ||
                PurchasingModule.normalizeText(linkedProducts.join(' ')).includes(term)
            );
        });

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

        if (activeTab === 'orders') {
            const pendingOrders = orders.filter(o => o.status === 'pending');
            contentHtml = `
                <div class="space-y-4">
                    <div class="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3">
                        <div class="text-blue-500"><i data-lucide="info" width="20"></i></div>
                        <p class="text-blue-700 text-sm"><b>Not:</b> Siparisler alanini sonra detaylandiracagiz.</p>
                    </div>
                    ${pendingOrders.length === 0
                    ? `<div class="text-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-400">Bekleyen siparis yok.</div>`
                    : pendingOrders.map(o => `
                            <div class="bg-white p-4 rounded-2xl border border-slate-100">
                                <b>${o.supplierName || 'Tedarikci'}</b> - ${o.itemName || '-'} (${o.quantity || 0} adet)
                            </div>
                        `).join('')}
                </div>
            `;
        } else if (activeTab === 'requests') {
            contentHtml = `
                <div class="space-y-4">
                    <div class="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-3">
                        <div class="text-amber-500"><i data-lucide="alert-triangle" width="20"></i></div>
                        <p class="text-amber-700 text-sm"><b>Not:</b> Talep havuzu alanini sonra detaylandiracagiz.</p>
                    </div>
                    ${requests.length === 0
                    ? `<div class="text-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-400">Bekleyen talep yok.</div>`
                    : requests.map(r => `
                            <div class="bg-white p-4 rounded-2xl border border-slate-100">
                                <b>${r.productName || '-'}</b> - ${r.quantity || 0} adet
                            </div>
                        `).join('')}
                </div>
            `;
        } else {
            contentHtml = `
                <div style="display:flex; flex-direction:column; gap:1rem">
                    <div style="display:flex; gap:0.75rem; align-items:center; background:white; border:1px solid #e2e8f0; border-radius:0.9rem; padding:0.9rem">
                        <div style="flex:1; position:relative">
                            <input
                                value="${searchTerm}"
                                oninput="PurchasingModule.setSearch(this.value, this.selectionStart)"
                                placeholder="Firma, yetkili, telefon, urun ara..."
                                style="width:100%; padding:0.75rem 0.75rem 0.75rem 2.2rem; border:1px solid #e2e8f0; border-radius:0.7rem; outline:none; background:#f8fafc"
                            />
                            <i data-lucide="search" width="18" style="position:absolute; left:10px; top:12px; color:#94a3b8"></i>
                        </div>
                        <button onclick="PurchasingModule.newSupplierModal()" style="border:none; background:#0f172a; color:white; padding:0.75rem 1rem; border-radius:0.7rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:0.4rem">
                            <i data-lucide="plus" width="18"></i> Yeni tedarikci
                        </button>
                    </div>

                    <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; overflow:hidden">
                        <table style="width:100%; border-collapse:collapse">
                            <thead>
                                <tr style="background:#f8fafc; color:#64748b; font-size:0.78rem; text-transform:uppercase">
                                    <th style="text-align:left; padding:0.9rem 1rem">Firma</th>
                                    <th style="text-align:left; padding:0.9rem 1rem">Yetkili</th>
                                    <th style="text-align:left; padding:0.9rem 1rem">Telefon</th>
                                    <th style="text-align:left; padding:0.9rem 1rem">Bagli urun</th>
                                    <th style="text-align:right; padding:0.9rem 1rem">Islem</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredSuppliers.length === 0
                    ? `<tr><td colspan="5" style="padding:2rem; text-align:center; color:#94a3b8">Tedarikci kaydi yok.</td></tr>`
                    : filteredSuppliers.map(s => {
                        const linkedProducts = getLinkedProducts(s);
                        const linkedCount = linkedProducts.length;
                        const linkedPreview = linkedProducts.slice(0, 2).join(', ');
                        return `
                                        <tr onclick="PurchasingModule.editSupplier('${s.id}')" style="border-top:1px solid #f1f5f9; cursor:pointer">
                                            <td style="padding:0.9rem 1rem">
                                                <div style="font-weight:700; color:#334155">${s.name || '-'}</div>
                                                <div style="font-size:0.75rem; color:#94a3b8">${s.contact?.tax || ''}</div>
                                            </td>
                                            <td style="padding:0.9rem 1rem; color:#475569">${s.contact?.person || '-'}</td>
                                            <td style="padding:0.9rem 1rem; color:#64748b">${s.contact?.phone || '-'}</td>
                                            <td style="padding:0.9rem 1rem; color:#64748b">
                                                ${linkedCount > 0 ? `${linkedCount} urun` : '-'}
                                                ${linkedPreview ? `<div style="font-size:0.75rem; color:#94a3b8; margin-top:0.2rem">${linkedPreview}${linkedCount > 2 ? ', ...' : ''}</div>` : ''}
                                            </td>
                                            <td style="padding:0.9rem 1rem; text-align:right">
                                                <button onclick="event.stopPropagation(); PurchasingModule.deleteSupplier('${s.id}')" style="border:none; background:none; color:#cbd5e1; cursor:pointer"><i data-lucide="trash-2" width="18"></i></button>
                                            </td>
                                        </tr>
                                    `;
                    }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="max-w-7xl mx-auto space-y-8 p-6 md:p-10 font-sans">
                <div class="flex flex-col gap-4">
                    <button onclick="location.reload()" class="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors w-fit">
                        <i data-lucide="arrow-left" width="20"></i>
                        <span>Ana Menuye Don</span>
                    </button>

                    <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 class="text-3xl font-bold text-slate-800 tracking-tight">Satin Alma Yonetimi</h1>
                            <p class="text-slate-500 mt-1">Hammadde tedariki, siparis takibi ve ic talepler.</p>
                        </div>
                        <div class="flex gap-4">
                            ${renderStat('Bekleyen', orders.filter(o => o.status === 'pending').length, 'clock', 'text-orange-600', 'bg-orange-100')}
                            ${renderStat('Talepler', requests.length, 'alert-triangle', 'text-red-600', 'bg-red-100')}
                        </div>
                    </div>
                </div>

                <div class="flex gap-2 overflow-x-auto pb-2">
                    ${renderTabBtn('orders', 'Siparisler', 'truck')}
                    ${renderTabBtn('requests', 'Talep Havuzu', 'file-text')}
                    ${renderTabBtn('suppliers', 'Tedarikciler', 'users')}
                </div>

                <div class="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    ${contentHtml}
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
    },

    setTab: (tabId) => {
        PurchasingModule.state.activeTab = tabId;
        UI.renderCurrentPage();
    },

    setSearch: (value, caretPos = null) => {
        PurchasingModule.state.searchTerm = value;
        UI.renderCurrentPage();
        setTimeout(() => {
            const el = document.querySelector('input[placeholder*="ara"]');
            if (el) {
                el.focus();
                el.value = value;
                const pos = Number.isInteger(caretPos) ? caretPos : value.length;
                if (typeof el.setSelectionRange === 'function') {
                    el.setSelectionRange(pos, pos);
                }
            }
        }, 10);
    },

    newOrderModal: () => {
        alert('Siparis olusturma modali (hazirlaniyor...)');
    },

    newSupplierModal: () => PurchasingModule.openSupplierModal(null),

    editSupplier: (id) => PurchasingModule.openSupplierModal(id || null),

    openSupplierModal: (editId = null) => {
        const supplier = editId ? (DB.data.data.suppliers || []).find(x => x.id === editId) : null;
        const linkedProducts = supplier ? PurchasingModule.getLinkedProductsForSupplier(supplier) : [];
        const linkedProductsText = linkedProducts.length > 0
            ? linkedProducts.join(', ')
            : 'Urun kartinda bu tedarikci secildikce burada otomatik gorunur.';

        const inp = 'width:100%; padding:0.65rem 0.75rem; border:1.5px solid #94a3b8; border-radius:0.65rem; outline:none; font-size:0.92rem; background:white; color:#0f172a';
        const lbl = 'display:block; font-size:0.78rem; font-weight:800; color:#475569; margin-bottom:0.35rem; text-transform:uppercase; letter-spacing:0.04em';
        const section = 'border:1.5px solid #cbd5e1; border-radius:0.9rem; padding:0.95rem; background:#f8fafc';
        const sectionTitle = 'margin:0 0 0.75rem; font-size:0.83rem; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; color:#334155';

        const modalContent = `
            <div style="font-family:Inter,sans-serif; display:flex; flex-direction:column; gap:0.9rem;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; padding-bottom:0.6rem; border-bottom:1px solid #e2e8f0;">
                    <div>
                        <h3 style="margin:0; font-size:1.2rem; color:#0f172a; font-weight:800">Tedarikci Karti</h3>
                        <p style="margin:0.35rem 0 0; color:#64748b; font-size:0.86rem">Kaydet ve sonra duzenleyebil.</p>
                    </div>
                    <button onclick="Modal.close()" style="border:1.5px solid #cbd5e1; background:white; width:32px; height:32px; border-radius:0.6rem; font-size:1.25rem; color:#64748b; cursor:pointer; line-height:1;">&times;</button>
                </div>

                <div style="${section}">
                    <h4 style="${sectionTitle}">Temel Bilgiler</h4>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:0.85rem;">
                        <div><label style="${lbl}">Firma adi</label><input id="new_sup_name" style="${inp}" placeholder="Ornek: AKPA ALUMINYUM"></div>
                        <div><label style="${lbl}">Tip</label><select id="new_sup_entity_type" style="${inp}"><option value="company">Sirket</option><option value="person">Bireysel</option></select></div>
                        <div><label style="${lbl}">Yetkili kisi</label><input id="new_sup_person" style="${inp}" placeholder="Ad Soyad"></div>
                        <div><label style="${lbl}">Telefon</label><input id="new_sup_phone" style="${inp}" placeholder="05xx xxx xx xx"></div>
                        <div><label style="${lbl}">E-posta</label><input id="new_sup_email" style="${inp}" placeholder="mail@firma.com"></div>
                        <div><label style="${lbl}">Web</label><input id="new_sup_web" style="${inp}" placeholder="https://firma.com"></div>
                        <div><label style="${lbl}">VKN/TCKN</label><input id="new_sup_tax" style="${inp}" placeholder="Vergi no"></div>
                        <div><label style="${lbl}">Etiket</label><input id="new_sup_tags" style="${inp}" placeholder="Hammadde, Kaplama, Kritik"></div>
                    </div>
                </div>

                <div style="${section}">
                    <h4 style="${sectionTitle}">Bagli Urunler</h4>
                    <div>
                        <label style="${lbl}">Bagli urunler (otomatik)</label>
                        <div id="sup_auto_items" style="${inp}; min-height:66px; color:#334155; background:#f1f5f9; line-height:1.45; border-color:#94a3b8;">${linkedProductsText}</div>
                        <div style="font-size:0.78rem; color:#94a3b8; margin-top:0.35rem;">Bu alan elle yazilmaz. Urun kartinda tedarikci secildikce otomatik baglanir.</div>
                    </div>
                </div>

                <div style="${section}">
                    <h4 style="${sectionTitle}">Adres ve Not</h4>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:0.85rem;">
                        <div style="grid-column:1 / -1;"><label style="${lbl}">Adres</label><input id="new_sup_addr1" style="${inp}" placeholder="Adres satiri"></div>
                        <div><label style="${lbl}">Sehir / Ilce</label><input id="new_sup_city" style="${inp}" placeholder="Sehir / Ilce"></div>
                        <div><label style="${lbl}">Ulke</label><input id="new_sup_country" style="${inp}" placeholder="Turkiye"></div>
                        <div style="grid-column:1 / -1;"><label style="${lbl}">Not</label><textarea id="new_sup_notes" style="${inp}; min-height:74px; resize:vertical" placeholder="Teslim suresi, odeme notu, kalite notu"></textarea></div>
                    </div>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:0.6rem; padding-top:0.7rem; border-top:1px solid #e2e8f0;">
                    <button onclick="Modal.close()" style="border:1.5px solid #94a3b8; background:white; color:#334155; padding:0.62rem 1.05rem; border-radius:0.65rem; font-weight:800; cursor:pointer;">Vazgec</button>
                    <button id="new_sup_save_btn" style="border:1.5px solid #0f172a; background:#0f172a; color:white; padding:0.65rem 1.15rem; border-radius:0.65rem; font-weight:800; cursor:pointer;">Kaydet</button>
                </div>
            </div>
        `;

        Modal.open('', modalContent, { maxWidth: '920px', showHeader: false });

        if (supplier) {
            document.getElementById('new_sup_name').value = supplier.name || '';
            document.getElementById('new_sup_entity_type').value = supplier.entityType || 'company';
            document.getElementById('new_sup_person').value = supplier.contact?.person || '';
            document.getElementById('new_sup_phone').value = supplier.contact?.phone || '';
            document.getElementById('new_sup_email').value = supplier.contact?.email || '';
            document.getElementById('new_sup_web').value = supplier.contact?.web || '';
            document.getElementById('new_sup_tax').value = supplier.contact?.tax || '';
            document.getElementById('new_sup_tags').value = (supplier.tags || []).join(', ');
            document.getElementById('new_sup_addr1').value = supplier.contact?.address || '';
            document.getElementById('new_sup_city').value = supplier.contact?.city || '';
            document.getElementById('new_sup_country').value = supplier.contact?.country || '';
            document.getElementById('new_sup_notes').value = supplier.notes || '';
        }

        const saveBtn = document.getElementById('new_sup_save_btn');
        if (saveBtn) {
            saveBtn.textContent = supplier ? 'Guncelle' : 'Kaydet';
            saveBtn.onclick = () => PurchasingModule.saveSupplier(editId);
        }
    },

    saveSupplier: async (editId = null) => {
        const name = (document.getElementById('new_sup_name')?.value || '').trim();
        const entityType = (document.getElementById('new_sup_entity_type')?.value || 'company').trim();
        const person = (document.getElementById('new_sup_person')?.value || '').trim();
        const phone = (document.getElementById('new_sup_phone')?.value || '').trim();
        const email = (document.getElementById('new_sup_email')?.value || '').trim();
        const web = (document.getElementById('new_sup_web')?.value || '').trim();
        const tax = (document.getElementById('new_sup_tax')?.value || '').trim();
        const address = (document.getElementById('new_sup_addr1')?.value || '').trim();
        const city = (document.getElementById('new_sup_city')?.value || '').trim();
        const country = (document.getElementById('new_sup_country')?.value || '').trim();
        const tags = PurchasingModule.parseCommaList(document.getElementById('new_sup_tags')?.value || '');
        const notes = (document.getElementById('new_sup_notes')?.value || '').trim();

        if (!name) {
            alert('Lutfen firma adini giriniz.');
            return;
        }

        const payload = {
            name,
            entityType,
            tags,
            notes,
            contact: { person, phone, email, web, tax, address, city, country }
        };

        if (!DB.data.data.suppliers) DB.data.data.suppliers = [];

        if (editId) {
            const idx = DB.data.data.suppliers.findIndex(s => s.id === editId);
            if (idx !== -1) DB.data.data.suppliers[idx] = { ...DB.data.data.suppliers[idx], ...payload };
        } else {
            DB.data.data.suppliers.push({ id: crypto.randomUUID(), ...payload });
        }

        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },

    deleteSupplier: async (id) => {
        if (confirm('Silmek istediginize emin misiniz?')) {
            DB.data.data.suppliers = DB.data.data.suppliers.filter(s => s.id !== id);
            await DB.save();
            UI.renderCurrentPage();
        }
    }
};
