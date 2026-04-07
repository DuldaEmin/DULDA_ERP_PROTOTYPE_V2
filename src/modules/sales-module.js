const SalesModule = {
    state: {
        workspaceView: 'menu',
        customerFilters: {
            name: '',
            city: ''
        },
        customerDetailId: null,
        customerDetailMode: 'view',
        customerEditDraft: null
    },

    escapeHtml: (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;'),

    normalize: (value) => String(value || '').trim().toLocaleLowerCase('tr-TR'),

    ensureData: () => {
        if (!DB.data || typeof DB.data !== 'object') DB.data = {};
        if (!DB.data.data || typeof DB.data.data !== 'object') DB.data.data = {};
        if (!Array.isArray(DB.data.data.customers)) DB.data.data.customers = [];
        if (!Array.isArray(DB.data.data.orders)) DB.data.data.orders = [];
        if (!Array.isArray(DB.data.data.personnel)) DB.data.data.personnel = [];
    },

    openWorkspace: (viewId) => {
        SalesModule.ensureData();
        SalesModule.state.workspaceView = String(viewId || 'menu');
        if (SalesModule.state.workspaceView === 'customers') {
            SalesModule.state.customerDetailId = null;
            SalesModule.state.customerDetailMode = 'view';
            SalesModule.state.customerEditDraft = null;
        }
        UI.renderCurrentPage();
    },

    render: (container) => {
        if (!container) return;
        SalesModule.ensureData();
        container.innerHTML = SalesModule.renderLayout();
        if (window.lucide) window.lucide.createIcons();
    },

    parsePercent: (value) => {
        if (String(value || '').trim() === '') return 0;
        const num = Number(String(value || '').replace(',', '.'));
        if (!Number.isFinite(num)) return 0;
        return Math.max(0, Math.min(100, Number(num.toFixed(2))));
    },

    parseMoney: (value) => {
        if (String(value || '').trim() === '') return 0;
        const num = Number(String(value || '').replace(',', '.'));
        if (!Number.isFinite(num)) return 0;
        return Math.max(0, Number(num.toFixed(2)));
    },

    parseDays: (value) => {
        if (String(value || '').trim() === '') return 0;
        const num = Number(String(value || '').replace(',', '.'));
        if (!Number.isFinite(num)) return 0;
        return Math.max(0, Math.floor(num));
    },

    generateCustomerCode: () => {
        const rows = Array.isArray(DB.data?.data?.customers) ? DB.data.data.customers : [];
        let maxSeq = 0;
        rows.forEach((row) => {
            const code = String(row?.customerCode || '').trim().toUpperCase();
            const match = code.match(/^MUS-(\d{6})$/);
            if (!match) return;
            const seq = Number(match[1] || 0);
            if (seq > maxSeq) maxSeq = seq;
        });
        return `MUS-${String(maxSeq + 1).padStart(6, '0')}`;
    },

    getCustomerStatusMeta: (isActive) => {
        if (isActive === false) return { text: 'Pasif', bg: '#fee2e2', color: '#991b1b', border: '#fecaca' };
        return { text: 'Aktif', bg: '#dcfce7', color: '#166534', border: '#86efac' };
    },

    getSalesPersonnelRows: () => {
        if (typeof PersonnelModule !== 'undefined' && PersonnelModule && typeof PersonnelModule.ensureData === 'function') {
            PersonnelModule.ensureData();
        }
        return (DB.data?.data?.personnel || [])
            .filter((row) => row?.isActive !== false)
            .filter((row) => row?.isSalesMarketingPersonnel === true)
            .sort((a, b) => String(a?.fullName || '').localeCompare(String(b?.fullName || ''), 'tr'));
    },

    getCustomers: () => {
        const rows = Array.isArray(DB.data?.data?.customers) ? DB.data.data.customers : [];
        return rows
            .map((row) => ({
                id: String(row?.id || '').trim(),
                customerCode: String(row?.customerCode || '').trim().toUpperCase(),
                name: String(row?.name || '').trim(),
                city: String(row?.city || '').trim(),
                district: String(row?.district || '').trim(),
                phone: String(row?.phone || '').trim(),
                email: String(row?.email || '').trim(),
                taxOffice: String(row?.taxOffice || '').trim(),
                taxNo: String(row?.taxNo || '').trim(),
                address: String(row?.address || '').trim(),
                authorizedPerson: String(row?.authorizedPerson || '').trim(),
                discountRate: SalesModule.parsePercent(row?.discountRate || 0),
                paymentTermDays: SalesModule.parseDays(row?.paymentTermDays || 0),
                riskLimit: SalesModule.parseMoney(row?.riskLimit || 0),
                tags: Array.isArray(row?.tags) ? row.tags.map((item) => String(item || '').trim()).filter(Boolean) : [],
                note: String(row?.note || '').trim(),
                isActive: row?.isActive !== false,
                created_at: String(row?.created_at || ''),
                updated_at: String(row?.updated_at || '')
            }))
            .filter((row) => row.id && row.name)
            .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'tr'));
    },

    getCustomerById: (customerId) => {
        const id = String(customerId || '').trim();
        if (!id) return null;
        return SalesModule.getCustomers().find((row) => String(row?.id || '') === id) || null;
    },

    getFilteredCustomers: () => {
        const filters = SalesModule.state.customerFilters || { name: '', city: '' };
        const qName = SalesModule.normalize(filters.name || '');
        const qCity = SalesModule.normalize(filters.city || '');
        return SalesModule.getCustomers().filter((row) => {
            if (qName && !SalesModule.normalize(`${row.name} ${row.customerCode}`).includes(qName)) return false;
            if (qCity && !SalesModule.normalize(`${row.city} ${row.district}`).includes(qCity)) return false;
            return true;
        });
    },

    setCustomerFilter: (field, value) => {
        const key = String(field || '').trim();
        if (!key) return;
        const active = document.activeElement;
        const inputId = `sales_customer_filter_${key}`;
        const shouldRestore = !!(active && String(active.id || '') === inputId);
        const start = typeof active?.selectionStart === 'number' ? active.selectionStart : null;
        const end = typeof active?.selectionEnd === 'number' ? active.selectionEnd : null;

        const current = (SalesModule.state.customerFilters && typeof SalesModule.state.customerFilters === 'object')
            ? SalesModule.state.customerFilters
            : { name: '', city: '' };
        current[key] = String(value || '');
        SalesModule.state.customerFilters = current;
        UI.renderCurrentPage();

        if (shouldRestore) {
            const next = document.getElementById(inputId);
            if (next) {
                next.focus();
                if (start !== null && end !== null) {
                    try { next.setSelectionRange(start, end); } catch (_) { }
                }
            }
        }
    },

    buildCustomerDraft: (source = null) => {
        const row = source && typeof source === 'object' ? source : {};
        const tags = Array.isArray(row?.tags) ? row.tags : [];
        return {
            name: String(row?.name || '').trim(),
            city: String(row?.city || '').trim(),
            district: String(row?.district || '').trim(),
            phone: String(row?.phone || '').trim(),
            email: String(row?.email || '').trim(),
            taxOffice: String(row?.taxOffice || '').trim(),
            taxNo: String(row?.taxNo || '').trim(),
            address: String(row?.address || '').trim(),
            authorizedPerson: String(row?.authorizedPerson || '').trim(),
            discountRate: SalesModule.parsePercent(row?.discountRate || 0),
            paymentTermDays: SalesModule.parseDays(row?.paymentTermDays || 0),
            riskLimit: SalesModule.parseMoney(row?.riskLimit || 0),
            tagsText: tags.join(', '),
            note: String(row?.note || '').trim(),
            isActive: row?.isActive !== false
        };
    },

    validateCustomerDraft: (draft) => {
        if (!draft || typeof draft !== 'object') return { ok: false, message: 'Musteri taslagi bulunamadi.' };
        if (!String(draft.name || '').trim()) return { ok: false, message: 'Musteri adi zorunlu.' };
        return { ok: true };
    },

    openCreateCustomerModal: () => {
        const draft = SalesModule.buildCustomerDraft();
        const html = SalesModule.renderCustomerModalFormHtml(draft, false);
        Modal.open('Yeni Musteri Ekle', html, { maxWidth: '940px' });
    },

    renderCustomerModalFormHtml: (draft, isEdit) => {
        return `
            <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.6rem;">
                <div>
                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Musteri adi *</label>
                    <input id="sales_customer_name" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.name || ''))}" placeholder="or: Akpa Aluminyum">
                </div>
                <div>
                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Sehir</label>
                    <input id="sales_customer_city" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.city || ''))}" placeholder="or: Istanbul">
                </div>
                <div>
                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Ilce</label>
                    <input id="sales_customer_district" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.district || ''))}" placeholder="or: Umraniye">
                </div>
                <div>
                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Telefon</label>
                    <input id="sales_customer_phone" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.phone || ''))}" placeholder="or: 0532...">
                </div>
                <div>
                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">E-posta</label>
                    <input id="sales_customer_email" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.email || ''))}" placeholder="or: satis@firma.com">
                </div>
                <div>
                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Yetkili kisi</label>
                    <input id="sales_customer_authorized" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.authorizedPerson || ''))}" placeholder="or: Ahmet Yilmaz">
                </div>
                <div>
                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Vergi dairesi</label>
                    <input id="sales_customer_tax_office" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.taxOffice || ''))}">
                </div>
                <div>
                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Vergi no</label>
                    <input id="sales_customer_tax_no" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.taxNo || ''))}">
                </div>
                <div>
                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Genel iskonto (%)</label>
                    <input id="sales_customer_discount" type="number" min="0" max="100" step="0.01" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.discountRate || 0))}">
                </div>
                <div>
                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Odeme vadesi (gun)</label>
                    <input id="sales_customer_term_days" type="number" min="0" step="1" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.paymentTermDays || 0))}">
                </div>
                <div>
                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Risk limiti</label>
                    <input id="sales_customer_risk_limit" type="number" min="0" step="0.01" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.riskLimit || 0))}">
                </div>
                <div>
                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Etiketler</label>
                    <input id="sales_customer_tags" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.tagsText || ''))}" placeholder="bayi, proje, perakende">
                </div>
                <div style="grid-column:span 3;">
                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Adres</label>
                    <textarea id="sales_customer_address" class="stock-textarea" style="min-height:72px;">${SalesModule.escapeHtml(String(draft?.address || ''))}</textarea>
                </div>
                <div style="grid-column:span 3;">
                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Not</label>
                    <textarea id="sales_customer_note" class="stock-textarea" style="min-height:72px;">${SalesModule.escapeHtml(String(draft?.note || ''))}</textarea>
                </div>
                <div style="grid-column:span 3; display:flex; justify-content:flex-end; gap:0.45rem;">
                    <button class="btn-sm" onclick="Modal.close()">iptal</button>
                    <button class="btn-primary" onclick="${isEdit ? 'SalesModule.saveCustomerDetail()' : 'SalesModule.saveCustomerFromModal()'}">kaydet</button>
                </div>
            </div>
        `;
    },

    readCustomerDraftFromDom: () => {
        const read = (id) => document.getElementById(id)?.value ?? '';
        return {
            name: String(read('sales_customer_name')).trim(),
            city: String(read('sales_customer_city')).trim(),
            district: String(read('sales_customer_district')).trim(),
            phone: String(read('sales_customer_phone')).trim(),
            email: String(read('sales_customer_email')).trim(),
            authorizedPerson: String(read('sales_customer_authorized')).trim(),
            taxOffice: String(read('sales_customer_tax_office')).trim(),
            taxNo: String(read('sales_customer_tax_no')).trim(),
            address: String(read('sales_customer_address')).trim(),
            note: String(read('sales_customer_note')).trim(),
            discountRate: SalesModule.parsePercent(read('sales_customer_discount')),
            paymentTermDays: SalesModule.parseDays(read('sales_customer_term_days')),
            riskLimit: SalesModule.parseMoney(read('sales_customer_risk_limit')),
            tagsText: String(read('sales_customer_tags')).trim(),
            isActive: true
        };
    },

    saveCustomerFromModal: async () => {
        SalesModule.ensureData();
        const draft = SalesModule.readCustomerDraftFromDom();
        const validation = SalesModule.validateCustomerDraft(draft);
        if (!validation.ok) return alert(validation.message || 'Kayit yapilamadi.');
        const now = new Date().toISOString();
        const tags = String(draft.tagsText || '')
            .split(',')
            .map((item) => String(item || '').trim())
            .filter(Boolean);
        const row = {
            id: crypto.randomUUID(),
            customerCode: SalesModule.generateCustomerCode(),
            name: draft.name,
            city: draft.city,
            district: draft.district,
            phone: draft.phone,
            email: draft.email,
            taxOffice: draft.taxOffice,
            taxNo: draft.taxNo,
            address: draft.address,
            authorizedPerson: draft.authorizedPerson,
            discountRate: draft.discountRate,
            paymentTermDays: draft.paymentTermDays,
            riskLimit: draft.riskLimit,
            tags,
            note: draft.note,
            isActive: true,
            created_at: now,
            updated_at: now
        };
        DB.data.data.customers.push(row);
        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
        alert(`${row.customerCode} olusturuldu.`);
    },

    getCustomerOrderHistory: (customer) => {
        const rows = Array.isArray(DB.data?.data?.orders) ? DB.data.data.orders : [];
        if (!customer || typeof customer !== 'object') return [];
        const id = String(customer.id || '').trim();
        const nameNorm = SalesModule.normalize(customer.name || '');
        return rows
            .filter((row) => {
                const customerId = String(row?.customerId || row?.customer?.id || '').trim();
                const customerName = SalesModule.normalize(row?.customerName || row?.customer?.name || row?.customer || '');
                if (id && customerId && customerId === id) return true;
                if (nameNorm && customerName && customerName === nameNorm) return true;
                return false;
            })
            .map((row) => ({
                id: String(row?.id || '').trim(),
                orderNo: String(row?.orderNo || row?.orderCode || row?.code || row?.id || '-').trim(),
                orderDate: String(row?.orderDate || row?.created_at || '').trim(),
                status: String(row?.status || 'Taslak').trim(),
                total: Number(row?.totalAmount ?? row?.total ?? row?.grandTotal ?? 0)
            }))
            .sort((a, b) => {
                const aMs = Date.parse(String(a?.orderDate || ''));
                const bMs = Date.parse(String(b?.orderDate || ''));
                return (Number.isFinite(bMs) ? bMs : 0) - (Number.isFinite(aMs) ? aMs : 0);
            });
    },

    openCustomerDetail: (customerId, mode = 'view') => {
        const row = SalesModule.getCustomerById(customerId);
        if (!row) return;
        SalesModule.state.customerDetailId = String(row.id || '');
        SalesModule.state.customerDetailMode = String(mode || 'view') === 'edit' ? 'edit' : 'view';
        SalesModule.state.customerEditDraft = SalesModule.state.customerDetailMode === 'edit'
            ? SalesModule.buildCustomerDraft(row)
            : null;
        UI.renderCurrentPage();
    },

    closeCustomerDetail: () => {
        SalesModule.state.customerDetailId = null;
        SalesModule.state.customerDetailMode = 'view';
        SalesModule.state.customerEditDraft = null;
        UI.renderCurrentPage();
    },

    setCustomerEditDraftField: (field, value) => {
        const draft = SalesModule.state.customerEditDraft;
        if (!draft || typeof draft !== 'object') return;
        const key = String(field || '').trim();
        if (!key) return;
        if (key === 'discountRate') {
            draft.discountRate = SalesModule.parsePercent(value);
            UI.renderCurrentPage();
            return;
        }
        if (key === 'paymentTermDays') {
            draft.paymentTermDays = SalesModule.parseDays(value);
            UI.renderCurrentPage();
            return;
        }
        if (key === 'riskLimit') {
            draft.riskLimit = SalesModule.parseMoney(value);
            UI.renderCurrentPage();
            return;
        }
        draft[key] = String(value || '');
    },

    saveCustomerDetail: async () => {
        SalesModule.ensureData();
        const targetId = String(SalesModule.state.customerDetailId || '').trim();
        if (!targetId) return;
        const draft = SalesModule.state.customerEditDraft || {};
        const validation = SalesModule.validateCustomerDraft(draft);
        if (!validation.ok) return alert(validation.message || 'Kayit yapilamadi.');
        const rows = Array.isArray(DB.data?.data?.customers) ? DB.data.data.customers : [];
        const idx = rows.findIndex((row) => String(row?.id || '').trim() === targetId);
        if (idx === -1) return alert('Musteri kaydi bulunamadi.');
        const prev = rows[idx] || {};
        rows[idx] = {
            ...prev,
            name: String(draft.name || '').trim(),
            city: String(draft.city || '').trim(),
            district: String(draft.district || '').trim(),
            phone: String(draft.phone || '').trim(),
            email: String(draft.email || '').trim(),
            taxOffice: String(draft.taxOffice || '').trim(),
            taxNo: String(draft.taxNo || '').trim(),
            address: String(draft.address || '').trim(),
            authorizedPerson: String(draft.authorizedPerson || '').trim(),
            discountRate: SalesModule.parsePercent(draft.discountRate || 0),
            paymentTermDays: SalesModule.parseDays(draft.paymentTermDays || 0),
            riskLimit: SalesModule.parseMoney(draft.riskLimit || 0),
            tags: String(draft.tagsText || '')
                .split(',')
                .map((item) => String(item || '').trim())
                .filter(Boolean),
            note: String(draft.note || '').trim(),
            updated_at: new Date().toISOString()
        };
        await DB.save();
        SalesModule.state.customerDetailMode = 'view';
        SalesModule.state.customerEditDraft = null;
        UI.renderCurrentPage();
        alert('Musteri guncellendi.');
    },

    renderMenuLayout: () => `
        <section class="stock-shell">
            <div class="stock-hub">
                <div class="stock-hub-head">
                    <h2 class="stock-title">satis & pazarlama</h2>
                </div>
                <div class="stock-hub-grid" style="justify-content:flex-start;">
                    <button class="stock-hub-card" onclick="SalesModule.openWorkspace('customers')">
                        <div class="stock-hub-icon stock-hub-icon-blue"><i data-lucide="users" width="24" height="24"></i></div>
                        <div class="stock-hub-label">Musteriler</div>
                    </button>
                    <button class="stock-hub-card" onclick="SalesModule.openWorkspace('personnel')">
                        <div class="stock-hub-icon stock-hub-icon-sky"><i data-lucide="user-round-cog" width="24" height="24"></i></div>
                        <div class="stock-hub-label">Personel</div>
                    </button>
                </div>
            </div>
        </section>
    `,

    renderCustomerDetailLayout: (row, mode = 'view') => {
        const isEdit = mode === 'edit';
        const draft = isEdit ? (SalesModule.state.customerEditDraft || SalesModule.buildCustomerDraft(row)) : null;
        const orderRows = SalesModule.getCustomerOrderHistory(row);
        const statusMeta = SalesModule.getCustomerStatusMeta(row?.isActive !== false);
        return `
            <section class="stock-shell">
                <div class="stock-subpage-shell">
                    <div class="stock-subpage-head">
                        <h2 class="stock-title">satis / musteri detay</h2>
                        <button class="btn-sm" onclick="SalesModule.closeCustomerDetail()">geri</button>
                    </div>

                    <div class="card-table" style="padding:1rem 1.1rem; margin-bottom:1rem;">
                        <div style="display:flex; justify-content:space-between; gap:0.6rem; align-items:center; flex-wrap:wrap; margin-bottom:0.8rem;">
                            <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
                                <div style="font-size:1.02rem; font-weight:800; color:#0f172a;">${SalesModule.escapeHtml(String(row?.name || '-'))}</div>
                                <span style="display:inline-flex; align-items:center; padding:0.2rem 0.62rem; border:1px solid ${SalesModule.escapeHtml(statusMeta.border)}; border-radius:999px; font-size:0.74rem; font-weight:700; background:${SalesModule.escapeHtml(statusMeta.bg)}; color:${SalesModule.escapeHtml(statusMeta.color)};">${SalesModule.escapeHtml(statusMeta.text)}</span>
                                <span style="font-family:Consolas, monospace; color:#1d4ed8; font-weight:800;">${SalesModule.escapeHtml(String(row?.customerCode || '-'))}</span>
                            </div>
                            <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                                ${isEdit
                ? `<button class="btn-sm" onclick="SalesModule.openCustomerDetail('${SalesModule.escapeHtml(String(row?.id || ''))}','view')">vazgec</button><button class="btn-primary" onclick="SalesModule.saveCustomerDetail()">kaydet</button>`
                : `<button class="btn-primary" onclick="SalesModule.openCustomerDetail('${SalesModule.escapeHtml(String(row?.id || ''))}','edit')">duzenle</button>`}
                            </div>
                        </div>

                        ${isEdit ? `
                            <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.55rem;">
                                <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Musteri adi *</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.name || ''))}" oninput="SalesModule.setCustomerEditDraftField('name', this.value)"></div>
                                <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Sehir</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.city || ''))}" oninput="SalesModule.setCustomerEditDraftField('city', this.value)"></div>
                                <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Ilce</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.district || ''))}" oninput="SalesModule.setCustomerEditDraftField('district', this.value)"></div>
                                <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Telefon</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.phone || ''))}" oninput="SalesModule.setCustomerEditDraftField('phone', this.value)"></div>
                                <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">E-posta</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.email || ''))}" oninput="SalesModule.setCustomerEditDraftField('email', this.value)"></div>
                                <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Yetkili kisi</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.authorizedPerson || ''))}" oninput="SalesModule.setCustomerEditDraftField('authorizedPerson', this.value)"></div>
                                <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Vergi dairesi</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.taxOffice || ''))}" oninput="SalesModule.setCustomerEditDraftField('taxOffice', this.value)"></div>
                                <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Vergi no</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.taxNo || ''))}" oninput="SalesModule.setCustomerEditDraftField('taxNo', this.value)"></div>
                                <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Genel iskonto (%)</label><input class="stock-input stock-input-tall" type="number" min="0" max="100" step="0.01" value="${SalesModule.escapeHtml(String(draft?.discountRate || 0))}" onchange="SalesModule.setCustomerEditDraftField('discountRate', this.value)"></div>
                                <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Odeme vadesi (gun)</label><input class="stock-input stock-input-tall" type="number" min="0" step="1" value="${SalesModule.escapeHtml(String(draft?.paymentTermDays || 0))}" onchange="SalesModule.setCustomerEditDraftField('paymentTermDays', this.value)"></div>
                                <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Risk limiti</label><input class="stock-input stock-input-tall" type="number" min="0" step="0.01" value="${SalesModule.escapeHtml(String(draft?.riskLimit || 0))}" onchange="SalesModule.setCustomerEditDraftField('riskLimit', this.value)"></div>
                                <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Etiketler</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.tagsText || ''))}" placeholder="bayi, proje, perakende" oninput="SalesModule.setCustomerEditDraftField('tagsText', this.value)"></div>
                                <div style="grid-column:span 3;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Adres</label><textarea class="stock-textarea" style="min-height:66px;" oninput="SalesModule.setCustomerEditDraftField('address', this.value)">${SalesModule.escapeHtml(String(draft?.address || ''))}</textarea></div>
                                <div style="grid-column:span 3;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Not</label><textarea class="stock-textarea" style="min-height:66px;" oninput="SalesModule.setCustomerEditDraftField('note', this.value)">${SalesModule.escapeHtml(String(draft?.note || ''))}</textarea></div>
                            </div>
                        ` : `
                            <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.6rem;">
                                <div><div style="font-size:0.73rem; color:#64748b;">Sehir / Ilce</div><div style="font-weight:700; color:#334155;">${SalesModule.escapeHtml([row?.city, row?.district].filter(Boolean).join(' / ') || '-')}</div></div>
                                <div><div style="font-size:0.73rem; color:#64748b;">Telefon</div><div style="font-weight:700; color:#334155;">${SalesModule.escapeHtml(String(row?.phone || '-'))}</div></div>
                                <div><div style="font-size:0.73rem; color:#64748b;">E-posta</div><div style="font-weight:700; color:#334155;">${SalesModule.escapeHtml(String(row?.email || '-'))}</div></div>
                                <div><div style="font-size:0.73rem; color:#64748b;">Yetkili kisi</div><div style="font-weight:700; color:#334155;">${SalesModule.escapeHtml(String(row?.authorizedPerson || '-'))}</div></div>
                                <div><div style="font-size:0.73rem; color:#64748b;">Vergi dairesi / no</div><div style="font-weight:700; color:#334155;">${SalesModule.escapeHtml(([row?.taxOffice, row?.taxNo].filter(Boolean).join(' / ')) || '-')}</div></div>
                                <div><div style="font-size:0.73rem; color:#64748b;">Genel iskonto</div><div style="font-weight:700; color:#334155;">% ${SalesModule.escapeHtml(String(row?.discountRate || 0))}</div></div>
                                <div><div style="font-size:0.73rem; color:#64748b;">Odeme vadesi</div><div style="font-weight:700; color:#334155;">${SalesModule.escapeHtml(String(row?.paymentTermDays || 0))} gun</div></div>
                                <div><div style="font-size:0.73rem; color:#64748b;">Risk limiti</div><div style="font-weight:700; color:#334155;">${SalesModule.escapeHtml(String(row?.riskLimit || 0))}</div></div>
                                <div style="grid-column:span 4;"><div style="font-size:0.73rem; color:#64748b;">Adres</div><div style="font-weight:700; color:#334155; white-space:pre-wrap;">${SalesModule.escapeHtml(String(row?.address || '-'))}</div></div>
                                <div style="grid-column:span 4;"><div style="font-size:0.73rem; color:#64748b;">Etiketler</div><div style="font-weight:700; color:#334155;">${SalesModule.escapeHtml((Array.isArray(row?.tags) ? row.tags.join(', ') : '') || '-')}</div></div>
                                <div style="grid-column:span 4;"><div style="font-size:0.73rem; color:#64748b;">Not</div><div style="font-weight:700; color:#334155; white-space:pre-wrap;">${SalesModule.escapeHtml(String(row?.note || '-'))}</div></div>
                            </div>
                        `}
                    </div>

                    <div class="card-table" style="padding:1rem 1.1rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; flex-wrap:wrap; margin-bottom:0.6rem;">
                            <div style="font-size:0.95rem; font-weight:800; color:#0f172a;">Siparis gecmisi</div>
                            <div style="font-size:0.8rem; color:#64748b;">${orderRows.length} kayit</div>
                        </div>
                        <div style="overflow:auto;">
                            <table style="width:100%; min-width:760px; border-collapse:collapse;">
                                <thead>
                                    <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.73rem; text-transform:uppercase;">
                                        <th style="padding:0.55rem; text-align:left;">Siparis no</th>
                                        <th style="padding:0.55rem; text-align:left;">Tarih</th>
                                        <th style="padding:0.55rem; text-align:left;">Durum</th>
                                        <th style="padding:0.55rem; text-align:right;">Toplam</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${orderRows.length === 0
                ? '<tr><td colspan="4" style="padding:1rem; text-align:center; color:#94a3b8;">Bu musteriye ait siparis gecmisi yok.</td></tr>'
                : orderRows.map((order) => `
                                            <tr style="border-bottom:1px solid #f1f5f9;">
                                                <td style="padding:0.55rem; font-family:Consolas, monospace; font-weight:800; color:#1d4ed8;">${SalesModule.escapeHtml(String(order?.orderNo || '-'))}</td>
                                                <td style="padding:0.55rem;">${SalesModule.escapeHtml(order?.orderDate ? new Date(order.orderDate).toLocaleString('tr-TR') : '-')}</td>
                                                <td style="padding:0.55rem;">${SalesModule.escapeHtml(String(order?.status || '-'))}</td>
                                                <td style="padding:0.55rem; text-align:right; font-weight:800;">${SalesModule.escapeHtml(String(Number(order?.total || 0).toFixed(2)))}</td>
                                            </tr>
                                        `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        `;
    },

    renderPersonnelLayout: () => {
        const rows = SalesModule.getSalesPersonnelRows();
        return `
            <section class="stock-shell">
                <div class="stock-subpage-shell">
                    <div class="stock-subpage-head">
                        <h2 class="stock-title">satis & pazarlama / personel</h2>
                        <button class="btn-sm" onclick="SalesModule.openWorkspace('menu')">geri</button>
                    </div>

                    <div class="card-table" style="padding:1rem 1.1rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap; margin-bottom:0.7rem;">
                            <div>
                                <div style="font-size:1.05rem; font-weight:800; color:#0f172a;">Satis & pazarlama personel listesi</div>
                                <div style="font-size:0.9rem; color:#64748b; margin-top:0.3rem;">Genel personel kartinda "satis & pazarlama" secili olan aktif personeller burada gorunur.</div>
                            </div>
                            <button class="btn-primary" onclick="Router.navigate('personnel')">personel yonetimine git</button>
                        </div>
                        <div style="overflow:auto;">
                            <table style="width:100%; min-width:860px; border-collapse:collapse;">
                                <thead>
                                    <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.73rem; text-transform:uppercase;">
                                        <th style="padding:0.55rem; text-align:left;">Ad soyad</th>
                                        <th style="padding:0.55rem; text-align:left;">Unvan</th>
                                        <th style="padding:0.55rem; text-align:left;">Personel kodu</th>
                                        <th style="padding:0.55rem; text-align:left;">Kullanici adi</th>
                                        <th style="padding:0.55rem; text-align:left;">Durum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows.length === 0
                ? '<tr><td colspan="5" style="padding:1.3rem; text-align:center; color:#94a3b8;">Kayitli satis & pazarlama personeli yok.</td></tr>'
                : rows.map((person) => `
                                            <tr style="border-bottom:1px solid #f1f5f9;">
                                                <td style="padding:0.55rem; font-weight:700; color:#334155;">${SalesModule.escapeHtml(String(person?.fullName || '-'))}</td>
                                                <td style="padding:0.55rem;">${SalesModule.escapeHtml(String(person?.title || '-'))}</td>
                                                <td style="padding:0.55rem; font-family:Consolas, monospace; font-weight:800; color:#1d4ed8;">${SalesModule.escapeHtml(String(person?.personCode || '-'))}</td>
                                                <td style="padding:0.55rem;">${SalesModule.escapeHtml(String(person?.username || '-'))}</td>
                                                <td style="padding:0.55rem;">${SalesModule.escapeHtml(String(person?.status || 'aktif'))}</td>
                                            </tr>
                                        `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        `;
    },

    renderCustomersLayout: () => {
        const rows = SalesModule.getFilteredCustomers();
        const filters = SalesModule.state.customerFilters || { name: '', city: '' };
        const detailId = String(SalesModule.state.customerDetailId || '').trim();
        if (detailId) {
            const row = SalesModule.getCustomerById(detailId);
            if (row) return SalesModule.renderCustomerDetailLayout(row, SalesModule.state.customerDetailMode || 'view');
            SalesModule.state.customerDetailId = null;
            SalesModule.state.customerDetailMode = 'view';
            SalesModule.state.customerEditDraft = null;
        }

        return `
            <section class="stock-shell">
                <div class="stock-subpage-shell">
                    <div class="stock-subpage-head">
                        <h2 class="stock-title">satis / musteriler</h2>
                        <button class="btn-sm" onclick="SalesModule.openWorkspace('menu')">geri</button>
                    </div>

                    <div class="card-table" style="padding:1rem 1.1rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap; margin-bottom:0.7rem;">
                            <div style="font-size:0.96rem; font-weight:800; color:#0f172a;">Kayitli musteriler</div>
                            <button class="btn-primary" onclick="SalesModule.openCreateCustomerModal()">yeni musteri ekle +</button>
                        </div>
                        <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:0.55rem; margin-bottom:0.75rem;">
                            <input id="sales_customer_filter_name" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(filters.name || ''))}" oninput="SalesModule.setCustomerFilter('name', this.value)" placeholder="isme gore ara (ad veya kod)">
                            <input id="sales_customer_filter_city" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(filters.city || ''))}" oninput="SalesModule.setCustomerFilter('city', this.value)" placeholder="sehre gore ara">
                        </div>
                        <div style="overflow:auto;">
                            <table style="width:100%; min-width:980px; border-collapse:collapse;">
                                <thead>
                                    <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.73rem; text-transform:uppercase;">
                                        <th style="padding:0.55rem; text-align:left;">Kod</th>
                                        <th style="padding:0.55rem; text-align:left;">Musteri</th>
                                        <th style="padding:0.55rem; text-align:left;">Sehir</th>
                                        <th style="padding:0.55rem; text-align:left;">Telefon</th>
                                        <th style="padding:0.55rem; text-align:right;">Iskonto</th>
                                        <th style="padding:0.55rem; text-align:left;">Durum</th>
                                        <th style="padding:0.55rem; text-align:center;">Islem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows.length === 0
                ? '<tr><td colspan="7" style="padding:1rem; text-align:center; color:#94a3b8;">Kayit bulunamadi.</td></tr>'
                : rows.map((row) => {
                    const meta = SalesModule.getCustomerStatusMeta(row?.isActive !== false);
                    const rowId = SalesModule.escapeHtml(String(row?.id || ''));
                    return `
                                                <tr style="border-bottom:1px solid #f1f5f9;">
                                                    <td style="padding:0.55rem; font-family:Consolas, monospace; font-weight:800; color:#1d4ed8;">${SalesModule.escapeHtml(String(row?.customerCode || '-'))}</td>
                                                    <td style="padding:0.55rem; font-weight:700; color:#334155;">${SalesModule.escapeHtml(String(row?.name || '-'))}</td>
                                                    <td style="padding:0.55rem;">${SalesModule.escapeHtml([row?.city, row?.district].filter(Boolean).join(' / ') || '-')}</td>
                                                    <td style="padding:0.55rem;">${SalesModule.escapeHtml(String(row?.phone || '-'))}</td>
                                                    <td style="padding:0.55rem; text-align:right; font-weight:800;">% ${SalesModule.escapeHtml(String(row?.discountRate || 0))}</td>
                                                    <td style="padding:0.55rem;">
                                                        <span style="display:inline-flex; align-items:center; padding:0.22rem 0.62rem; border:1px solid ${SalesModule.escapeHtml(meta.border)}; border-radius:999px; font-size:0.74rem; font-weight:700; background:${SalesModule.escapeHtml(meta.bg)}; color:${SalesModule.escapeHtml(meta.color)};">${SalesModule.escapeHtml(meta.text)}</span>
                                                    </td>
                                                    <td style="padding:0.55rem; text-align:center;">
                                                        <div style="display:inline-flex; gap:0.35rem; flex-wrap:wrap; justify-content:center;">
                                                            <button class="btn-sm" onclick="SalesModule.openCustomerDetail('${rowId}','view')">goruntule</button>
                                                            <button class="btn-sm" onclick="SalesModule.openCustomerDetail('${rowId}','edit')">duzenle</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `;
                }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        `;
    },

    renderLayout: () => {
        const view = String(SalesModule.state.workspaceView || 'menu');
        if (view === 'customers') return SalesModule.renderCustomersLayout();
        if (view === 'personnel') return SalesModule.renderPersonnelLayout();
        return SalesModule.renderMenuLayout();
    }
};
