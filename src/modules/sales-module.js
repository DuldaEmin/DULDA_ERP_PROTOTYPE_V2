const SalesModule = {
    state: {
        workspaceView: 'menu',
        customerFilters: {
            name: '',
            city: ''
        },
        customerDetailId: null,
        customerDetailMode: 'view',
        customerEditDraft: null,
        catalogActiveCategoryId: '',
        catalogDraft: null
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
        if (!Array.isArray(DB.data.data.salesCatalogProducts)) DB.data.data.salesCatalogProducts = [];
    },

    openWorkspace: (viewId) => {
        SalesModule.ensureData();
        SalesModule.state.workspaceView = String(viewId || 'menu');
        if (SalesModule.state.workspaceView === 'customers') {
            SalesModule.state.customerDetailId = null;
            SalesModule.state.customerDetailMode = 'view';
            SalesModule.state.customerEditDraft = null;
        }
        if (SalesModule.state.workspaceView === 'products') {
            SalesModule.ensureCatalogState();
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

    getCatalogTree: () => ([
        {
            id: 'rail-aluminum',
            label: 'Aluminyum korkuluk',
            children: [
                { id: 'rail-aluminum-baba', label: 'Aluminyum korkuluk babalari' },
                { id: 'rail-aluminum-dikme', label: 'Aluminyum korkuluk dikmeleri' },
                { id: 'rail-aluminum-bottle', label: 'Sise model dikmeleri' },
                { id: 'rail-aluminum-accessory', label: 'Aksesuarlar' }
            ]
        },
        {
            id: 'rail-lux',
            label: 'Lux seri korkuluk',
            children: [
                { id: 'rail-lux-baba', label: 'Lux seri babalari' },
                { id: 'rail-lux-dikme', label: 'Lux seri dikmeleri' },
                { id: 'rail-lux-accessory', label: 'Aksesuarlar' }
            ]
        },
        {
            id: 'rail-stainless',
            label: 'Paslanmaz korkuluk',
            children: [
                { id: 'rail-stainless-baba', label: 'Paslanmaz babalari' },
                { id: 'rail-stainless-dikme', label: 'Paslanmaz dikmeleri' },
                { id: 'rail-stainless-accessory', label: 'Aksesuarlar' }
            ]
        }
    ]),

    getCatalogLeafNodes: () => SalesModule.getCatalogTree().flatMap((group) => (group.children || [])
        .map((leaf) => ({
            ...leaf,
            groupId: group.id,
            groupLabel: group.label
        }))),

    getCatalogLeafById: (categoryId) => {
        const id = String(categoryId || '').trim();
        if (!id) return null;
        return SalesModule.getCatalogLeafNodes().find((leaf) => leaf.id === id) || null;
    },

    ensureCatalogState: () => {
        const leafNodes = SalesModule.getCatalogLeafNodes();
        if (!leafNodes.length) return;
        const active = String(SalesModule.state.catalogActiveCategoryId || '').trim();
        if (!active || !leafNodes.some((leaf) => leaf.id === active)) {
            SalesModule.state.catalogActiveCategoryId = String(leafNodes[0].id || '');
        }
    },

    getCatalogProducts: () => {
        const rows = Array.isArray(DB.data?.data?.salesCatalogProducts) ? DB.data.data.salesCatalogProducts : [];
        return rows
            .map((row) => {
                const item = row && typeof row === 'object' ? row : {};
                const diameters = Array.isArray(item.diameters)
                    ? item.diameters.map((v) => String(v || '').trim()).filter(Boolean)
                    : [];
                const colors = item.colors && typeof item.colors === 'object' ? item.colors : {};
                const images = item.images && typeof item.images === 'object' ? item.images : {};
                return {
                    id: String(item.id || '').trim(),
                    categoryId: String(item.categoryId || '').trim(),
                    name: String(item.name || '').trim(),
                    productCode: String(item.productCode || '').trim(),
                    idCode: String(item.idCode || '').trim(),
                    diameters,
                    selectedDiameter: String(item.selectedDiameter || diameters[0] || '').trim(),
                    colors: {
                        accessory: {
                            category: String(colors.accessory?.category || '').trim(),
                            color: String(colors.accessory?.color || '').trim()
                        },
                        tube: {
                            category: String(colors.tube?.category || '').trim(),
                            color: String(colors.tube?.color || '').trim()
                        },
                        plexi: {
                            category: String(colors.plexi?.category || '').trim(),
                            color: String(colors.plexi?.color || '').trim()
                        }
                    },
                    bubble: String(item.bubble || 'yok').trim() === 'var' ? 'var' : 'yok',
                    lowerTubeLength: String(item.lowerTubeLength || 'standart').trim() || 'standart',
                    note: String(item.note || '').trim(),
                    images: {
                        product: String(images.product || '').trim(),
                        technical: String(images.technical || '').trim(),
                        application: String(images.application || '').trim()
                    },
                    created_at: String(item.created_at || ''),
                    updated_at: String(item.updated_at || '')
                };
            })
            .filter((row) => row.id && row.categoryId && row.name);
    },

    getCatalogProductsByCategory: (categoryId) => {
        const id = String(categoryId || '').trim();
        if (!id) return [];
        return SalesModule.getCatalogProducts()
            .filter((row) => row.categoryId === id)
            .sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')));
    },

    getCatalogCategoryPathText: (categoryId) => {
        const leaf = SalesModule.getCatalogLeafById(categoryId);
        if (!leaf) return 'Korkuluk';
        return `Korkuluk / ${leaf.groupLabel} / ${leaf.label}`;
    },

    getCatalogColorCategoryOptions: (field) => {
        if (String(field || '') === 'plexi') {
            return [
                { value: 'pleksi-seri', label: 'Pleksi seri' },
                { value: 'opal-seri', label: 'Opal seri' },
                { value: 'ozel-seri', label: 'Ozel seri' }
            ];
        }
        return [
            { value: 'anodize-seri', label: 'Anodize seri' },
            { value: 'elektrostatik-seri', label: 'Elektrostatik seri' },
            { value: 'pvd-seri', label: 'PVD seri' },
            { value: 'ozel-seri', label: 'Ozel seri' }
        ];
    },

    getCatalogColorOptions: (field, category) => {
        const key = String(category || '').trim();
        if (String(field || '') === 'plexi') {
            const plexiMap = {
                'pleksi-seri': ['Seffaf', 'Fume', 'Bronz', 'Buzlu'],
                'opal-seri': ['Opal Beyaz', 'Sut Beyaz', 'Kirik Beyaz'],
                'ozel-seri': ['Siyah Cam', 'Antrasit Cam', 'Katalog disi']
            };
            return Array.isArray(plexiMap[key]) ? plexiMap[key] : ['Seciniz'];
        }
        const metalMap = {
            'anodize-seri': ['Parlak Inox', 'Sampanya', 'Siyah Anodize'],
            'elektrostatik-seri': ['Mat Siyah', 'Antrasit', 'Beyaz'],
            'pvd-seri': ['Gold', 'Rose Gold', 'Inox PVD'],
            'ozel-seri': ['Boyali Ozel', 'Katalog disi']
        };
        return Array.isArray(metalMap[key]) ? metalMap[key] : ['Seciniz'];
    },

    buildCatalogDraft: (categoryId, source = null) => {
        const row = source && typeof source === 'object' ? source : {};
        const now = SalesModule.getCatalogProducts().length + 1;
        const colorDefaults = (field, sourceValue = {}) => {
            const categories = SalesModule.getCatalogColorCategoryOptions(field);
            const fallbackCategory = String(categories[0]?.value || '');
            const selectedCategory = String(sourceValue?.category || fallbackCategory);
            const colors = SalesModule.getCatalogColorOptions(field, selectedCategory);
            return {
                category: selectedCategory,
                color: String(sourceValue?.color || colors[0] || '')
            };
        };
        return {
            categoryId: String(categoryId || '').trim(),
            name: String(row.name || '').trim(),
            productCode: String(row.productCode || `KRL-${String(now).padStart(4, '0')}`).trim(),
            idCode: String(row.idCode || `ID-${String(now).padStart(5, '0')}`).trim(),
            diameters: Array.isArray(row.diameters) && row.diameters.length
                ? row.diameters.map((v) => String(v || '').trim()).filter(Boolean)
                : ['40', '50', '65'],
            selectedDiameter: String(row.selectedDiameter || '').trim() || '40',
            lowerTubeLength: String(row.lowerTubeLength || 'standart').trim() || 'standart',
            bubble: String(row.bubble || 'yok').trim() === 'var' ? 'var' : 'yok',
            note: String(row.note || '').trim(),
            colors: {
                accessory: colorDefaults('accessory', row.colors?.accessory),
                tube: colorDefaults('tube', row.colors?.tube),
                plexi: colorDefaults('plexi', row.colors?.plexi)
            },
            images: {
                product: String(row.images?.product || '').trim(),
                technical: String(row.images?.technical || '').trim(),
                application: String(row.images?.application || '').trim()
            }
        };
    },

    generateCatalogRowId: () => {
        const rows = Array.isArray(DB.data?.data?.salesCatalogProducts) ? DB.data.data.salesCatalogProducts : [];
        const used = new Set(rows.map((row) => String(row?.id || '').trim()).filter(Boolean));
        if (typeof IdentityPolicy !== 'undefined' && IdentityPolicy && typeof IdentityPolicy.makeId === 'function') {
            return IdentityPolicy.makeId('SCP', used);
        }
        let seq = rows.length + 1;
        while (used.has(`SCP-${String(seq).padStart(6, '0')}`)) seq += 1;
        return `SCP-${String(seq).padStart(6, '0')}`;
    },

    setCatalogActiveCategory: (categoryId) => {
        const leaf = SalesModule.getCatalogLeafById(categoryId);
        if (!leaf) return;
        SalesModule.state.catalogActiveCategoryId = leaf.id;
        UI.renderCurrentPage();
    },

    renderCatalogColorCategoryOptionsHtml: (field, selectedValue) => {
        return SalesModule.getCatalogColorCategoryOptions(field)
            .map((opt) => `<option value="${SalesModule.escapeHtml(opt.value)}" ${opt.value === selectedValue ? 'selected' : ''}>${SalesModule.escapeHtml(opt.label)}</option>`)
            .join('');
    },

    renderCatalogColorOptionsHtml: (field, selectedCategory, selectedColor) => {
        return SalesModule.getCatalogColorOptions(field, selectedCategory)
            .map((opt) => `<option value="${SalesModule.escapeHtml(opt)}" ${String(opt) === String(selectedColor || '') ? 'selected' : ''}>${SalesModule.escapeHtml(opt)}</option>`)
            .join('');
    },

    renderCatalogDiameterButtonsHtml: (diameters, selectedDiameter, clickHandlerName) => {
        const list = Array.isArray(diameters) ? diameters : [];
        return list.map((dia) => {
            const value = String(dia || '').trim();
            if (!value) return '';
            const active = value === String(selectedDiameter || '').trim();
            return `<button type="button" class="sales-catalog-chip ${active ? 'is-active' : ''}" onclick="${SalesModule.escapeHtml(clickHandlerName)}('${SalesModule.escapeHtml(value)}')">O ${SalesModule.escapeHtml(value)}</button>`;
        }).join('');
    },

    renderCatalogUploadPreviewHtml: (kind, imageData) => {
        const hasImage = !!String(imageData || '').trim();
        const labelMap = {
            product: 'Urun gorseli',
            technical: 'Teknik resim',
            application: 'Uygulama resmi'
        };
        const label = labelMap[String(kind || '')] || 'Dosya';
        if (!hasImage) return `<div class="sales-catalog-upload-empty">${SalesModule.escapeHtml(label)} ekle +</div>`;
        return `
            <img src="${SalesModule.escapeHtml(String(imageData || ''))}" alt="${SalesModule.escapeHtml(label)}" class="sales-catalog-upload-image">
            <button type="button" class="sales-catalog-upload-clear" onclick="event.stopPropagation(); SalesModule.clearCatalogImage('${SalesModule.escapeHtml(String(kind || ''))}')">kaldir</button>
        `;
    },

    renderCatalogTreeHtml: () => {
        const tree = SalesModule.getCatalogTree();
        const activeId = String(SalesModule.state.catalogActiveCategoryId || '').trim();
        return tree.map((group) => `
            <div class="sales-catalog-tree-group">
                <div class="sales-catalog-tree-group-title">${SalesModule.escapeHtml(group.label)}</div>
                <div class="sales-catalog-tree-leaf-list">
                    ${(group.children || []).map((leaf) => `
                        <button class="sales-catalog-tree-leaf ${leaf.id === activeId ? 'is-active' : ''}" onclick="SalesModule.setCatalogActiveCategory('${SalesModule.escapeHtml(leaf.id)}')">
                            ${SalesModule.escapeHtml(leaf.label)}
                        </button>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    renderCatalogCardsHtml: () => {
        const activeCategoryId = String(SalesModule.state.catalogActiveCategoryId || '').trim();
        const rows = SalesModule.getCatalogProductsByCategory(activeCategoryId);
        if (!rows.length) {
            return `
                <div class="sales-catalog-empty">
                    <div class="sales-catalog-empty-title">Bu kategoride urun yok</div>
                    <div class="sales-catalog-empty-text">Yeni urun ekle butonuyla katalog karti olusturabilirsiniz.</div>
                </div>
            `;
        }
        return rows.map((row) => {
            const image = row.images?.product || row.images?.application || '';
            const id = SalesModule.escapeHtml(String(row.id || ''));
            return `
                <button class="sales-catalog-card" onclick="SalesModule.openCatalogDetailModal('${id}')">
                    <div class="sales-catalog-card-media ${image ? '' : 'is-empty'}">
                        ${image
                    ? `<img src="${SalesModule.escapeHtml(image)}" alt="${SalesModule.escapeHtml(row.name || 'Urun')}" class="sales-catalog-card-image">`
                    : '<div class="sales-catalog-card-placeholder">Gorsel yok</div>'}
                    </div>
                    <div class="sales-catalog-card-body">
                        <div class="sales-catalog-card-title">${SalesModule.escapeHtml(row.name || '-')}</div>
                        <div class="sales-catalog-card-code">${SalesModule.escapeHtml(row.productCode || '-')}</div>
                        <div class="sales-catalog-card-meta-row">
                            <span class="sales-catalog-pill">${row.bubble === 'var' ? 'Kabarcik var' : 'Kabarcik yok'}</span>
                            <span class="sales-catalog-pill">O ${SalesModule.escapeHtml(row.selectedDiameter || '-')}</span>
                        </div>
                    </div>
                </button>
            `;
        }).join('');
    },

    renderProductsLayout: () => {
        SalesModule.ensureCatalogState();
        const activeCategoryId = String(SalesModule.state.catalogActiveCategoryId || '').trim();
        const pathText = SalesModule.getCatalogCategoryPathText(activeCategoryId);
        const categoryCount = SalesModule.getCatalogProductsByCategory(activeCategoryId).length;
        return `
            <section class="stock-shell">
                <div class="stock-subpage-shell">
                    <div class="stock-subpage-head">
                        <h2 class="stock-title">satis & pazarlama / urunler</h2>
                        <button class="btn-sm" onclick="SalesModule.openWorkspace('menu')">geri</button>
                    </div>

                    <div class="sales-catalog-shell">
                        <aside class="sales-catalog-left">
                            <div class="sales-catalog-root">Korkuluk urun gruplari</div>
                            <div class="sales-catalog-root-note">Bu ekran sadece korkuluk kategorisi icin calisir.</div>
                            ${SalesModule.renderCatalogTreeHtml()}
                        </aside>

                        <section class="sales-catalog-right">
                            <div class="sales-catalog-right-head">
                                <div>
                                    <div class="sales-catalog-path">${SalesModule.escapeHtml(pathText)}</div>
                                    <div class="sales-catalog-sub">${SalesModule.escapeHtml(String(categoryCount))} kayitli urun</div>
                                </div>
                                <button class="btn-primary" onclick="SalesModule.openCreateCatalogModal()">yeni urun ekle +</button>
                            </div>

                            <div class="sales-catalog-grid">
                                ${SalesModule.renderCatalogCardsHtml()}
                            </div>
                        </section>
                    </div>
                </div>
            </section>
        `;
    },

    openCreateCatalogModal: () => {
        SalesModule.ensureCatalogState();
        const categoryId = String(SalesModule.state.catalogActiveCategoryId || '').trim();
        if (!SalesModule.getCatalogLeafById(categoryId)) {
            alert('Once bir alt kategori secmelisiniz.');
            return;
        }
        SalesModule.state.catalogDraft = SalesModule.buildCatalogDraft(categoryId);
        const html = SalesModule.renderCreateCatalogModalHtml();
        Modal.open('Yeni urun ekle', html, { maxWidth: '1220px' });
    },

    renderCreateCatalogModalHtml: () => {
        const draft = SalesModule.state.catalogDraft || SalesModule.buildCatalogDraft(SalesModule.state.catalogActiveCategoryId || '');
        const categoryText = SalesModule.getCatalogCategoryPathText(draft.categoryId || SalesModule.state.catalogActiveCategoryId || '');
        return `
            <div class="sales-catalog-create-wrap">
                <div class="sales-catalog-modal-kicker">${SalesModule.escapeHtml(categoryText)}</div>
                <div class="sales-catalog-create-grid-top">
                    <div>
                        <label class="sales-catalog-label">Urun adi *</label>
                        <input id="sales_catalog_name" class="sales-catalog-input" value="${SalesModule.escapeHtml(draft.name || '')}" oninput="SalesModule.setCatalogDraftField('name', this.value)" placeholder="or: Kral 2034">
                    </div>
                    <div>
                        <label class="sales-catalog-label">Urun kodu</label>
                        <input id="sales_catalog_product_code" class="sales-catalog-input" value="${SalesModule.escapeHtml(draft.productCode || '')}" oninput="SalesModule.setCatalogDraftField('productCode', this.value)">
                    </div>
                    <div>
                        <label class="sales-catalog-label">ID kodu</label>
                        <input id="sales_catalog_id_code" class="sales-catalog-input" value="${SalesModule.escapeHtml(draft.idCode || '')}" oninput="SalesModule.setCatalogDraftField('idCode', this.value)">
                    </div>
                </div>

                <div class="sales-catalog-create-grid-mid">
                    <div class="sales-catalog-field-block">
                        <label class="sales-catalog-label">Caplari ekle</label>
                        <div class="sales-catalog-inline">
                            <input id="sales_catalog_diameter_input" class="sales-catalog-input" placeholder="or: 75">
                            <button type="button" class="sales-catalog-mini-btn" onclick="SalesModule.addCatalogDiameter()">cap ekle +</button>
                        </div>
                        <div id="sales_catalog_diameter_box" class="sales-catalog-chip-row">
                            ${SalesModule.renderCatalogDiameterButtonsHtml(draft.diameters, draft.selectedDiameter, 'SalesModule.selectCatalogDiameter')}
                        </div>
                    </div>
                    <div class="sales-catalog-field-block">
                        <label class="sales-catalog-label">Kabarcik</label>
                        <div id="sales_catalog_bubble_toggle" class="sales-catalog-toggle">
                            <button type="button" class="sales-catalog-toggle-btn ${draft.bubble === 'var' ? 'is-active' : ''}" onclick="SalesModule.setCatalogBubble('var')">var</button>
                            <button type="button" class="sales-catalog-toggle-btn ${draft.bubble === 'yok' ? 'is-active' : ''}" onclick="SalesModule.setCatalogBubble('yok')">yok</button>
                        </div>
                    </div>
                    <div class="sales-catalog-field-block">
                        <label class="sales-catalog-label">Alt boru uzunlugu</label>
                        <input id="sales_catalog_lower_tube" class="sales-catalog-input" value="${SalesModule.escapeHtml(draft.lowerTubeLength || 'standart')}" oninput="SalesModule.setCatalogDraftField('lowerTubeLength', this.value)" placeholder="standart veya ozel olcu">
                    </div>
                </div>

                <div class="sales-catalog-color-grid">
                    ${['accessory', 'tube', 'plexi'].map((field) => {
            const titleMap = {
                accessory: 'Aksesuar rengi',
                tube: 'Boru rengi',
                plexi: 'Pleksi rengi'
            };
            const value = draft.colors?.[field] || {};
            return `
                            <div class="sales-catalog-field-block">
                                <label class="sales-catalog-label">${SalesModule.escapeHtml(titleMap[field] || field)}</label>
                                <div class="sales-catalog-inline-select">
                                    <select id="sales_catalog_${field}_category" class="sales-catalog-select" onchange="SalesModule.setCatalogColorCategory('${field}', this.value)">
                                        ${SalesModule.renderCatalogColorCategoryOptionsHtml(field, value.category)}
                                    </select>
                                    <select id="sales_catalog_${field}_color" class="sales-catalog-select" onchange="SalesModule.setCatalogColorValue('${field}', this.value)">
                                        ${SalesModule.renderCatalogColorOptionsHtml(field, value.category, value.color)}
                                    </select>
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>

                <div class="sales-catalog-upload-grid">
                    ${['product', 'technical', 'application'].map((kind) => `
                        <button type="button" class="sales-catalog-upload-card" onclick="SalesModule.triggerCatalogImageInput('${kind}')">
                            <input type="file" id="sales_catalog_file_${kind}" accept="image/*" style="display:none;" onchange="SalesModule.handleCatalogImageUpload('${kind}', this)">
                            <div id="sales_catalog_upload_${kind}" class="sales-catalog-upload-inner">
                                ${SalesModule.renderCatalogUploadPreviewHtml(kind, draft.images?.[kind] || '')}
                            </div>
                        </button>
                    `).join('')}
                </div>

                <div>
                    <label class="sales-catalog-label">Not ekle</label>
                    <textarea id="sales_catalog_note" class="sales-catalog-textarea" oninput="SalesModule.setCatalogDraftField('note', this.value)">${SalesModule.escapeHtml(draft.note || '')}</textarea>
                </div>

                <div class="sales-catalog-modal-actions">
                    <button class="btn-sm" onclick="Modal.close()">iptal</button>
                    <button class="btn-primary" onclick="SalesModule.saveCatalogProduct()">listeye ekle</button>
                </div>
            </div>
        `;
    },

    setCatalogDraftField: (field, value) => {
        const key = String(field || '').trim();
        if (!key) return;
        if (!SalesModule.state.catalogDraft || typeof SalesModule.state.catalogDraft !== 'object') return;
        SalesModule.state.catalogDraft[key] = String(value || '');
    },

    setCatalogColorCategory: (field, category) => {
        const key = String(field || '').trim();
        if (!key || !SalesModule.state.catalogDraft) return;
        if (!SalesModule.state.catalogDraft.colors || typeof SalesModule.state.catalogDraft.colors !== 'object') {
            SalesModule.state.catalogDraft.colors = {};
        }
        if (!SalesModule.state.catalogDraft.colors[key] || typeof SalesModule.state.catalogDraft.colors[key] !== 'object') {
            SalesModule.state.catalogDraft.colors[key] = { category: '', color: '' };
        }
        const selectedCategory = String(category || '').trim();
        SalesModule.state.catalogDraft.colors[key].category = selectedCategory;
        const nextColors = SalesModule.getCatalogColorOptions(key, selectedCategory);
        const currentColor = String(SalesModule.state.catalogDraft.colors[key].color || '').trim();
        if (!nextColors.includes(currentColor)) {
            SalesModule.state.catalogDraft.colors[key].color = String(nextColors[0] || '');
        }
        const colorSelect = document.getElementById(`sales_catalog_${key}_color`);
        if (colorSelect) {
            colorSelect.innerHTML = SalesModule.renderCatalogColorOptionsHtml(
                key,
                selectedCategory,
                SalesModule.state.catalogDraft.colors[key].color
            );
        }
    },

    setCatalogColorValue: (field, colorValue) => {
        const key = String(field || '').trim();
        if (!key || !SalesModule.state.catalogDraft) return;
        if (!SalesModule.state.catalogDraft.colors || typeof SalesModule.state.catalogDraft.colors !== 'object') {
            SalesModule.state.catalogDraft.colors = {};
        }
        if (!SalesModule.state.catalogDraft.colors[key] || typeof SalesModule.state.catalogDraft.colors[key] !== 'object') {
            SalesModule.state.catalogDraft.colors[key] = { category: '', color: '' };
        }
        SalesModule.state.catalogDraft.colors[key].color = String(colorValue || '').trim();
    },

    addCatalogDiameter: () => {
        if (!SalesModule.state.catalogDraft) return;
        const input = document.getElementById('sales_catalog_diameter_input');
        const raw = String(input?.value || '').trim();
        const value = raw.replace(/[^\d.,]/g, '').replace(',', '.');
        if (!value) return;
        if (!Array.isArray(SalesModule.state.catalogDraft.diameters)) {
            SalesModule.state.catalogDraft.diameters = [];
        }
        if (!SalesModule.state.catalogDraft.diameters.includes(value)) {
            SalesModule.state.catalogDraft.diameters.push(value);
        }
        SalesModule.state.catalogDraft.selectedDiameter = value;
        if (input) input.value = '';
        SalesModule.refreshCatalogDiameterButtons();
    },

    refreshCatalogDiameterButtons: () => {
        const draft = SalesModule.state.catalogDraft;
        if (!draft) return;
        const box = document.getElementById('sales_catalog_diameter_box');
        if (!box) return;
        box.innerHTML = SalesModule.renderCatalogDiameterButtonsHtml(
            draft.diameters,
            draft.selectedDiameter,
            'SalesModule.selectCatalogDiameter'
        );
    },

    selectCatalogDiameter: (value) => {
        if (!SalesModule.state.catalogDraft) return;
        SalesModule.state.catalogDraft.selectedDiameter = String(value || '').trim();
        SalesModule.refreshCatalogDiameterButtons();
    },

    setCatalogBubble: (value) => {
        if (!SalesModule.state.catalogDraft) return;
        SalesModule.state.catalogDraft.bubble = String(value || '').trim() === 'var' ? 'var' : 'yok';
        const box = document.getElementById('sales_catalog_bubble_toggle');
        if (!box) return;
        box.innerHTML = `
            <button type="button" class="sales-catalog-toggle-btn ${SalesModule.state.catalogDraft.bubble === 'var' ? 'is-active' : ''}" onclick="SalesModule.setCatalogBubble('var')">var</button>
            <button type="button" class="sales-catalog-toggle-btn ${SalesModule.state.catalogDraft.bubble === 'yok' ? 'is-active' : ''}" onclick="SalesModule.setCatalogBubble('yok')">yok</button>
        `;
    },

    triggerCatalogImageInput: (kind) => {
        const key = String(kind || '').trim();
        if (!key) return;
        const input = document.getElementById(`sales_catalog_file_${key}`);
        if (input) input.click();
    },

    handleCatalogImageUpload: (kind, input) => {
        const key = String(kind || '').trim();
        if (!key || !SalesModule.state.catalogDraft) return;
        const file = input?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (!SalesModule.state.catalogDraft?.images || typeof SalesModule.state.catalogDraft.images !== 'object') {
                SalesModule.state.catalogDraft.images = {};
            }
            SalesModule.state.catalogDraft.images[key] = String(reader.result || '');
            SalesModule.refreshCatalogImagePreview(key);
        };
        reader.readAsDataURL(file);
    },

    clearCatalogImage: (kind) => {
        const key = String(kind || '').trim();
        if (!key || !SalesModule.state.catalogDraft) return;
        if (!SalesModule.state.catalogDraft.images || typeof SalesModule.state.catalogDraft.images !== 'object') {
            SalesModule.state.catalogDraft.images = {};
        }
        SalesModule.state.catalogDraft.images[key] = '';
        const input = document.getElementById(`sales_catalog_file_${key}`);
        if (input) input.value = '';
        SalesModule.refreshCatalogImagePreview(key);
    },

    refreshCatalogImagePreview: (kind) => {
        const key = String(kind || '').trim();
        const draft = SalesModule.state.catalogDraft;
        if (!key || !draft) return;
        const box = document.getElementById(`sales_catalog_upload_${key}`);
        if (!box) return;
        box.innerHTML = SalesModule.renderCatalogUploadPreviewHtml(key, draft.images?.[key] || '');
    },

    saveCatalogProduct: async () => {
        SalesModule.ensureData();
        const draft = SalesModule.state.catalogDraft;
        if (!draft || typeof draft !== 'object') return;
        const categoryId = String(draft.categoryId || SalesModule.state.catalogActiveCategoryId || '').trim();
        if (!SalesModule.getCatalogLeafById(categoryId)) {
            alert('Gecerli bir kategori secmelisiniz.');
            return;
        }
        const name = String(draft.name || '').trim();
        if (!name) {
            alert('Urun adi zorunlu.');
            return;
        }
        const diameters = Array.isArray(draft.diameters)
            ? draft.diameters.map((v) => String(v || '').trim()).filter(Boolean)
            : [];
        const selectedDiameter = String(draft.selectedDiameter || diameters[0] || '').trim();
        const nowIso = new Date().toISOString();
        const row = {
            id: SalesModule.generateCatalogRowId(),
            categoryId,
            name,
            productCode: String(draft.productCode || '').trim(),
            idCode: String(draft.idCode || '').trim(),
            diameters,
            selectedDiameter,
            bubble: String(draft.bubble || 'yok').trim() === 'var' ? 'var' : 'yok',
            lowerTubeLength: String(draft.lowerTubeLength || 'standart').trim() || 'standart',
            note: String(draft.note || '').trim(),
            colors: {
                accessory: {
                    category: String(draft.colors?.accessory?.category || '').trim(),
                    color: String(draft.colors?.accessory?.color || '').trim()
                },
                tube: {
                    category: String(draft.colors?.tube?.category || '').trim(),
                    color: String(draft.colors?.tube?.color || '').trim()
                },
                plexi: {
                    category: String(draft.colors?.plexi?.category || '').trim(),
                    color: String(draft.colors?.plexi?.color || '').trim()
                }
            },
            images: {
                product: String(draft.images?.product || '').trim(),
                technical: String(draft.images?.technical || '').trim(),
                application: String(draft.images?.application || '').trim()
            },
            created_at: nowIso,
            updated_at: nowIso
        };
        DB.data.data.salesCatalogProducts.push(row);
        await DB.save();
        Modal.close();
        SalesModule.state.catalogDraft = null;
        UI.renderCurrentPage();
        alert('Urun karti kataloga eklendi.');
    },

    openCatalogDetailModal: (productId) => {
        const id = String(productId || '').trim();
        if (!id) return;
        const row = SalesModule.getCatalogProducts().find((item) => String(item.id || '') === id);
        if (!row) return alert('Urun karti bulunamadi.');
        const html = SalesModule.renderCatalogDetailModalHtml(row);
        Modal.open('Urun karti detay', html, { maxWidth: '1180px' });
    },

    renderCatalogDetailModalHtml: (row) => {
        const pathText = SalesModule.getCatalogCategoryPathText(row.categoryId);
        const accessory = row.colors?.accessory || {};
        const tube = row.colors?.tube || {};
        const plexi = row.colors?.plexi || {};
        const productImage = row.images?.product || row.images?.application || '';
        const technicalImage = row.images?.technical || '';
        return `
            <div class="sales-catalog-detail-wrap">
                <div class="sales-catalog-modal-kicker">${SalesModule.escapeHtml(pathText)}</div>
                <div class="sales-catalog-detail-grid">
                    <div class="sales-catalog-detail-left">
                        <div class="sales-catalog-preview-combo">
                            <div class="sales-catalog-preview-panel is-dark">
                                ${productImage
                ? `<img src="${SalesModule.escapeHtml(productImage)}" alt="${SalesModule.escapeHtml(row.name || 'Urun')}" class="sales-catalog-preview-image">`
                : '<div class="sales-catalog-preview-placeholder">Urun gorseli yok</div>'}
                            </div>
                            <div class="sales-catalog-preview-panel is-light">
                                ${technicalImage
                ? `<img src="${SalesModule.escapeHtml(technicalImage)}" alt="Teknik cizim" class="sales-catalog-preview-image">`
                : '<div class="sales-catalog-preview-placeholder">Teknik resim yok</div>'}
                            </div>
                        </div>
                    </div>

                    <div class="sales-catalog-detail-right">
                        <div class="sales-catalog-detail-head">
                            <div class="sales-catalog-detail-title">${SalesModule.escapeHtml(row.name || '-')}</div>
                            <div class="sales-catalog-detail-codes">
                                <span class="sales-catalog-code-primary">${SalesModule.escapeHtml(row.productCode || '-')}</span>
                                <span class="sales-catalog-code-secondary">ID: ${SalesModule.escapeHtml(row.idCode || '-')}</span>
                            </div>
                        </div>

                        <div class="sales-catalog-detail-fields">
                            ${SalesModule.renderCatalogDetailColorField('Aksesuar rengi', 'accessory', accessory)}
                            ${SalesModule.renderCatalogDetailColorField('Boru rengi', 'tube', tube)}
                            ${SalesModule.renderCatalogDetailColorField('Pleksi rengi', 'plexi', plexi)}
                            <div class="sales-catalog-field-block">
                                <label class="sales-catalog-label">Kabarcik</label>
                                <div class="sales-catalog-toggle is-disabled">
                                    <button type="button" class="sales-catalog-toggle-btn ${row.bubble === 'var' ? 'is-active' : ''}" disabled>var</button>
                                    <button type="button" class="sales-catalog-toggle-btn ${row.bubble === 'yok' ? 'is-active' : ''}" disabled>yok</button>
                                </div>
                            </div>
                            <div class="sales-catalog-field-block">
                                <label class="sales-catalog-label">Cap</label>
                                <div class="sales-catalog-chip-row">
                                    ${SalesModule.renderCatalogDiameterButtonsHtml(row.diameters, row.selectedDiameter, 'SalesModule.noop')}
                                </div>
                            </div>
                            <div class="sales-catalog-field-block">
                                <label class="sales-catalog-label">Alt boru uzunlugu</label>
                                <input class="sales-catalog-input" value="${SalesModule.escapeHtml(row.lowerTubeLength || 'standart')}" readonly>
                            </div>
                        </div>

                        <div>
                            <label class="sales-catalog-label">Not</label>
                            <textarea class="sales-catalog-textarea" readonly>${SalesModule.escapeHtml(row.note || '')}</textarea>
                        </div>

                        <div class="sales-catalog-modal-actions">
                            <button class="btn-sm" onclick="Modal.close()">kapat</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderCatalogDetailColorField: (label, field, valueObj) => {
        const category = String(valueObj?.category || '').trim();
        const color = String(valueObj?.color || '').trim();
        return `
            <div class="sales-catalog-field-block">
                <label class="sales-catalog-label">${SalesModule.escapeHtml(label)}</label>
                <div class="sales-catalog-inline-select">
                    <select class="sales-catalog-select" disabled>
                        ${SalesModule.renderCatalogColorCategoryOptionsHtml(field, category)}
                    </select>
                    <select class="sales-catalog-select" disabled>
                        ${SalesModule.renderCatalogColorOptionsHtml(field, category, color)}
                    </select>
                </div>
            </div>
        `;
    },

    noop: () => {},

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
                    <button class="stock-hub-card" onclick="SalesModule.openWorkspace('products')">
                        <div class="stock-hub-icon" style="background:linear-gradient(135deg,#f97316 0%, #ef4444 100%);"><i data-lucide="boxes" width="24" height="24"></i></div>
                        <div class="stock-hub-label">Urunler</div>
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
        if (view === 'products') return SalesModule.renderProductsLayout();
        return SalesModule.renderMenuLayout();
    }
};
