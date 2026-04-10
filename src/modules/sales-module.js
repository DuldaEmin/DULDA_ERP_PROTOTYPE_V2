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
        customerModalEditId: '',
        customerImportPreview: null,
        catalogActiveMainId: 'korkuluk',
        catalogActiveGroupId: '',
        catalogActiveCategoryId: '',
        catalogExpandedMainId: 'korkuluk',
        catalogExpandedGroupId: '',
        catalogHighlightKey: 'group:rail-aluminum',
        catalogSearchText: '',
        catalogEditingProductId: '',
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
        SalesModule.ensureCatalogPublicIds();
    },

    ensureCatalogPublicIds: () => {
        const rows = Array.isArray(DB.data?.data?.salesCatalogProducts) ? DB.data.data.salesCatalogProducts : [];
        rows.forEach((row) => {
            if (!row || typeof row !== 'object') return;
            const current = String(row.idCode || '').trim();
            if (current) return;
            row.idCode = SalesModule.generateCatalogPublicId({ rowId: String(row.id || '').trim() });
        });
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
                phoneCountryCode: String(row?.phoneCountryCode || '').trim(),
                phoneAreaCode: String(row?.phoneAreaCode || '').trim(),
                phoneAlt: String(row?.phoneAlt || '').trim(),
                email: String(row?.email || '').trim(),
                taxOffice: String(row?.taxOffice || '').trim(),
                taxNo: String(row?.taxNo || '').trim(),
                address: String(row?.address || '').trim(),
                addressNo: String(row?.addressNo || '').trim(),
                postalCode: String(row?.postalCode || '').trim(),
                country: String(row?.country || '').trim(),
                externalCode: String(row?.externalCode || '').trim(),
                faxNo: String(row?.faxNo || '').trim(),
                modemNo: String(row?.modemNo || '').trim(),
                authorizedPerson: String(row?.authorizedPerson || '').trim(),
                discountRate: SalesModule.parsePercent(row?.discountRate || 0),
                paymentTermDays: SalesModule.parseDays(row?.paymentTermDays || 0),
                riskLimit: SalesModule.parseMoney(row?.riskLimit || 0),
                customerTypes: SalesModule.normalizeCustomerTypeList(
                    Array.isArray(row?.customerTypes) ? row.customerTypes : (Array.isArray(row?.tags) ? row.tags : [])
                ),
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

    getCustomerTypeOptions: () => ([
        'Korkuluk',
        'Boru/Cubuk',
        'Mobilya',
        'Aksesuar',
        'Diger'
    ]),

    normalizeCustomerTypeValue: (value) => {
        const token = SalesModule.normalizeImportToken(value);
        if (!token) return '';
        if (token.includes('korkuluk')) return 'Korkuluk';
        if (token.includes('boru') || token.includes('cubuk')) return 'Boru/Cubuk';
        if (token.includes('mobilya')) return 'Mobilya';
        if (token.includes('aksesuar')) return 'Aksesuar';
        if (token.includes('diger') || token.includes('other')) return 'Diger';
        return '';
    },

    normalizeCustomerTypeList: (values = []) => {
        const normalized = Array.isArray(values) ? values : [];
        const mapped = normalized
            .map((item) => SalesModule.normalizeCustomerTypeValue(item))
            .filter(Boolean);
        return Array.from(new Set(mapped));
    },

    getCountryOptions: () => ([
        'Turkiye', 'Moldova', 'Almanya', 'Hollanda', 'Belcika', 'Fransa', 'Avusturya', 'Isvicre',
        'Ingiltere', 'Irlanda', 'Italya', 'Ispanya', 'Portekiz', 'Yunanistan', 'Bulgaristan', 'Romanya',
        'Sirbistan', 'Bosna Hersek', 'Karadag', 'Kosova', 'Kuzey Makedonya', 'Arnavutluk', 'Macaristan',
        'Polonya', 'Cekya', 'Slovakya', 'Slovenya', 'Hirvatistan', 'Ukrayna', 'Rusya', 'Azerbaycan',
        'Gurcistan', 'Irak', 'Suriye', 'Iran', 'Suudi Arabistan', 'Katar', 'Birlesik Arap Emirlikleri',
        'Kuveyt', 'Misir', 'Tunus', 'Cezayir', 'Libya', 'Fas', 'Kanada', 'Amerika Birlesik Devletleri'
    ]),

    renderCountryDatalistHtml: (id = 'sales_customer_country_options') => `
        <datalist id="${SalesModule.escapeHtml(id)}">
            ${SalesModule.getCountryOptions().map((country) => `<option value="${SalesModule.escapeHtml(country)}"></option>`).join('')}
        </datalist>
    `,

    renderCustomerTypePickerHtml: (selected = [], options = {}) => {
        const chosen = SalesModule.normalizeCustomerTypeList(selected);
        const inputName = String(options?.inputName || 'sales_customer_types').trim() || 'sales_customer_types';
        const onchange = String(options?.onchange || '').trim();
        const disabled = !!options?.disabled;
        return `
            <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                ${SalesModule.getCustomerTypeOptions().map((type) => {
            const checked = chosen.includes(type);
            return `
                        <label style="display:inline-flex; align-items:center; gap:0.34rem; border:1px solid ${checked ? '#93c5fd' : '#cbd5e1'}; background:${checked ? '#eff6ff' : '#fff'}; color:${checked ? '#1d4ed8' : '#334155'}; border-radius:999px; padding:0.22rem 0.58rem; font-size:0.76rem; font-weight:700; cursor:pointer;">
                            <input type="checkbox" name="${SalesModule.escapeHtml(inputName)}" value="${SalesModule.escapeHtml(type)}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} ${onchange ? `onchange="${onchange}"` : ''} style="margin:0;">
                            <span>${SalesModule.escapeHtml(type)}</span>
                        </label>
                    `;
        }).join('')}
            </div>
        `;
    },

    toggleCustomerEditType: (value, checked) => {
        const draft = SalesModule.state.customerEditDraft;
        if (!draft || typeof draft !== 'object') return;
        const normalized = SalesModule.normalizeCustomerTypeValue(value);
        if (!normalized) return;
        const list = Array.isArray(draft.customerTypes) ? draft.customerTypes.slice() : [];
        const set = new Set(SalesModule.normalizeCustomerTypeList(list));
        if (checked) set.add(normalized);
        else set.delete(normalized);
        draft.customerTypes = Array.from(set);
    },

    buildCustomerDraft: (source = null) => {
        const row = source && typeof source === 'object' ? source : {};
        const tags = Array.isArray(row?.tags) ? row.tags : [];
        const rowTypes = Array.isArray(row?.customerTypes) ? row.customerTypes : [];
        const fallbackTypes = SalesModule.normalizeCustomerTypeList(tags);
        return {
            name: String(row?.name || '').trim(),
            city: String(row?.city || '').trim(),
            district: String(row?.district || '').trim(),
            phone: String(row?.phone || '').trim(),
            phoneCountryCode: String(row?.phoneCountryCode || '').trim(),
            phoneAreaCode: String(row?.phoneAreaCode || '').trim(),
            phoneAlt: String(row?.phoneAlt || '').trim(),
            email: String(row?.email || '').trim(),
            taxOffice: String(row?.taxOffice || '').trim(),
            taxNo: String(row?.taxNo || '').trim(),
            address: String(row?.address || '').trim(),
            addressNo: String(row?.addressNo || '').trim(),
            postalCode: String(row?.postalCode || '').trim(),
            country: String(row?.country || '').trim(),
            externalCode: String(row?.externalCode || '').trim(),
            faxNo: String(row?.faxNo || '').trim(),
            modemNo: String(row?.modemNo || '').trim(),
            authorizedPerson: String(row?.authorizedPerson || '').trim(),
            discountRate: SalesModule.parsePercent(row?.discountRate || 0),
            paymentTermDays: SalesModule.parseDays(row?.paymentTermDays || 0),
            riskLimit: SalesModule.parseMoney(row?.riskLimit || 0),
            customerTypes: SalesModule.normalizeCustomerTypeList(rowTypes.length ? rowTypes : fallbackTypes),
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
        SalesModule.state.customerModalEditId = '';
        const draft = SalesModule.buildCustomerDraft();
        const html = SalesModule.renderCustomerModalFormHtml(draft, false);
        Modal.open('Yeni Musteri Ekle', html, { maxWidth: '940px' });
    },

    openEditCustomerModal: (customerId) => {
        SalesModule.ensureData();
        const row = SalesModule.getCustomerById(customerId);
        if (!row) return alert('Musteri kaydi bulunamadi.');
        SalesModule.state.customerModalEditId = String(row.id || '').trim();
        const draft = SalesModule.buildCustomerDraft(row);
        const html = SalesModule.renderCustomerModalFormHtml(draft, true);
        Modal.open('Musteriyi Duzenle', html, { maxWidth: '940px' });
    },

    closeCustomerFormModal: () => {
        SalesModule.state.customerModalEditId = '';
        Modal.close();
    },

    renderCustomerModalFormHtml: (draft, isEdit) => {
        return `
            ${SalesModule.renderCountryDatalistHtml('sales_customer_country_options')}
            <div style="display:flex; flex-direction:column; gap:0.7rem;">
                <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.6rem;">
                    <div style="font-size:0.78rem; font-weight:800; color:#334155; margin-bottom:0.45rem;">Kimlik ve Iletisim</div>
                    <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.6rem;">
                        <div>
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Musteri adi *</label>
                            <input id="sales_customer_name" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.name || ''))}" placeholder="or: Akpa Aluminyum">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Yetkili kisi</label>
                            <input id="sales_customer_authorized" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.authorizedPerson || ''))}" placeholder="or: Ahmet Yilmaz">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">E-posta</label>
                            <input id="sales_customer_email" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.email || ''))}" placeholder="or: satis@firma.com">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Sabit tel</label>
                            <input id="sales_customer_phone" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.phone || ''))}" placeholder="or: 312 349 06 10">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.18rem;">GSM tel</label>
                            <input id="sales_customer_phone_alt" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.phoneAlt || ''))}" placeholder="or: 5xx xxx xx xx">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.18rem;">Tel ulke / bolge kodu</label>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.35rem;">
                                <input id="sales_customer_phone_country_code" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.phoneCountryCode || ''))}" placeholder="ulke: 90">
                                <input id="sales_customer_phone_area_code" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.phoneAreaCode || ''))}" placeholder="bolge: 312">
                            </div>
                        </div>
                        <div style="grid-column:span 3;">
                            <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">Musteri tipi</label>
                            ${SalesModule.renderCustomerTypePickerHtml(draft?.customerTypes || [], { inputName: 'sales_customer_types' })}
                        </div>
                    </div>
                </div>

                <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.6rem;">
                    <div style="font-size:0.78rem; font-weight:800; color:#334155; margin-bottom:0.45rem;">Adres ve Konum</div>
                    <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.6rem;">
                        <div>
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Ulke</label>
                            <input id="sales_customer_country" list="sales_customer_country_options" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.country || ''))}" placeholder="yazmaya basla: Moldova">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Sehir</label>
                            <input id="sales_customer_city" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.city || ''))}" placeholder="or: Ankara">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Ilce</label>
                            <input id="sales_customer_district" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.district || ''))}" placeholder="or: Siteler">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.18rem;">Posta kodu</label>
                            <input id="sales_customer_postal_code" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.postalCode || ''))}">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.18rem;">Adres no</label>
                            <input id="sales_customer_address_no" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.addressNo || ''))}">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.18rem;">Cari kodu</label>
                            <input id="sales_customer_external_code" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.externalCode || ''))}" placeholder="or: 120.01.A.002">
                        </div>
                        <div style="grid-column:span 3;">
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Adres</label>
                            <textarea id="sales_customer_address" class="stock-textarea" style="min-height:72px;">${SalesModule.escapeHtml(String(draft?.address || ''))}</textarea>
                        </div>
                    </div>
                </div>

                <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.6rem;">
                    <div style="font-size:0.78rem; font-weight:800; color:#334155; margin-bottom:0.45rem;">Ticari ve Resmi Bilgiler</div>
                    <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.6rem;">
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
                        <div style="grid-column:span 3;">
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Not</label>
                            <textarea id="sales_customer_note" class="stock-textarea" style="min-height:72px;">${SalesModule.escapeHtml(String(draft?.note || ''))}</textarea>
                        </div>
                    </div>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:0.45rem;">
                    <button class="btn-sm" onclick="SalesModule.closeCustomerFormModal()">iptal</button>
                    <button class="btn-primary" onclick="${isEdit ? 'SalesModule.saveCustomerEditFromModal()' : 'SalesModule.saveCustomerFromModal()'}">kaydet</button>
                </div>
            </div>
        `;
    },

    readCustomerDraftFromDom: () => {
        const read = (id) => document.getElementById(id)?.value ?? '';
        const customerTypes = Array.from(document.querySelectorAll('input[name="sales_customer_types"]:checked'))
            .map((item) => String(item?.value || '').trim())
            .filter(Boolean);
        return {
            name: String(read('sales_customer_name')).trim(),
            city: String(read('sales_customer_city')).trim(),
            district: String(read('sales_customer_district')).trim(),
            phone: String(read('sales_customer_phone')).trim(),
            phoneCountryCode: String(read('sales_customer_phone_country_code')).trim(),
            phoneAreaCode: String(read('sales_customer_phone_area_code')).trim(),
            phoneAlt: String(read('sales_customer_phone_alt')).trim(),
            email: String(read('sales_customer_email')).trim(),
            authorizedPerson: String(read('sales_customer_authorized')).trim(),
            taxOffice: String(read('sales_customer_tax_office')).trim(),
            taxNo: String(read('sales_customer_tax_no')).trim(),
            address: String(read('sales_customer_address')).trim(),
            addressNo: String(read('sales_customer_address_no')).trim(),
            postalCode: String(read('sales_customer_postal_code')).trim(),
            country: String(read('sales_customer_country')).trim(),
            externalCode: String(read('sales_customer_external_code')).trim(),
            note: String(read('sales_customer_note')).trim(),
            discountRate: SalesModule.parsePercent(read('sales_customer_discount')),
            paymentTermDays: SalesModule.parseDays(read('sales_customer_term_days')),
            riskLimit: SalesModule.parseMoney(read('sales_customer_risk_limit')),
            customerTypes: SalesModule.normalizeCustomerTypeList(customerTypes),
            isActive: true
        };
    },

    saveCustomerFromModal: async () => {
        SalesModule.ensureData();
        const draft = SalesModule.readCustomerDraftFromDom();
        const validation = SalesModule.validateCustomerDraft(draft);
        if (!validation.ok) return alert(validation.message || 'Kayit yapilamadi.');
        const now = new Date().toISOString();
        const row = {
            id: crypto.randomUUID(),
            customerCode: SalesModule.generateCustomerCode(),
            name: draft.name,
            city: draft.city,
            district: draft.district,
            phone: draft.phone,
            phoneCountryCode: draft.phoneCountryCode,
            phoneAreaCode: draft.phoneAreaCode,
            phoneAlt: draft.phoneAlt,
            email: draft.email,
            taxOffice: draft.taxOffice,
            taxNo: draft.taxNo,
            address: draft.address,
            addressNo: draft.addressNo,
            postalCode: draft.postalCode,
            country: draft.country,
            externalCode: draft.externalCode,
            authorizedPerson: draft.authorizedPerson,
            discountRate: draft.discountRate,
            paymentTermDays: draft.paymentTermDays,
            riskLimit: draft.riskLimit,
            customerTypes: SalesModule.normalizeCustomerTypeList(draft.customerTypes || []),
            tags: [],
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

    saveCustomerEditFromModal: async () => {
        SalesModule.ensureData();
        const targetId = String(SalesModule.state.customerModalEditId || '').trim();
        if (!targetId) return alert('Duzenlenecek musteri secilemedi.');
        const draft = SalesModule.readCustomerDraftFromDom();
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
            phoneCountryCode: String(draft.phoneCountryCode || '').trim(),
            phoneAreaCode: String(draft.phoneAreaCode || '').trim(),
            phoneAlt: String(draft.phoneAlt || '').trim(),
            email: String(draft.email || '').trim(),
            taxOffice: String(draft.taxOffice || '').trim(),
            taxNo: String(draft.taxNo || '').trim(),
            address: String(draft.address || '').trim(),
            addressNo: String(draft.addressNo || '').trim(),
            postalCode: String(draft.postalCode || '').trim(),
            country: String(draft.country || '').trim(),
            externalCode: String(draft.externalCode || '').trim(),
            authorizedPerson: String(draft.authorizedPerson || '').trim(),
            discountRate: SalesModule.parsePercent(draft.discountRate || 0),
            paymentTermDays: SalesModule.parseDays(draft.paymentTermDays || 0),
            riskLimit: SalesModule.parseMoney(draft.riskLimit || 0),
            customerTypes: SalesModule.normalizeCustomerTypeList(draft.customerTypes || []),
            tags: Array.isArray(prev?.tags) ? prev.tags : [],
            note: String(draft.note || '').trim(),
            updated_at: new Date().toISOString()
        };
        await DB.save();
        SalesModule.state.customerModalEditId = '';
        Modal.close();
        UI.renderCurrentPage();
        alert('Musteri guncellendi.');
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
        if (String(mode || 'view') === 'edit') {
            SalesModule.openEditCustomerModal(customerId);
            return;
        }
        SalesModule.state.customerDetailId = String(row.id || '');
        SalesModule.state.customerDetailMode = 'view';
        SalesModule.state.customerEditDraft = null;
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
            phoneCountryCode: String(draft.phoneCountryCode || '').trim(),
            phoneAreaCode: String(draft.phoneAreaCode || '').trim(),
            phoneAlt: String(draft.phoneAlt || '').trim(),
            email: String(draft.email || '').trim(),
            taxOffice: String(draft.taxOffice || '').trim(),
            taxNo: String(draft.taxNo || '').trim(),
            address: String(draft.address || '').trim(),
            addressNo: String(draft.addressNo || '').trim(),
            postalCode: String(draft.postalCode || '').trim(),
            country: String(draft.country || '').trim(),
            externalCode: String(draft.externalCode || '').trim(),
            authorizedPerson: String(draft.authorizedPerson || '').trim(),
            discountRate: SalesModule.parsePercent(draft.discountRate || 0),
            paymentTermDays: SalesModule.parseDays(draft.paymentTermDays || 0),
            riskLimit: SalesModule.parseMoney(draft.riskLimit || 0),
            customerTypes: SalesModule.normalizeCustomerTypeList(draft.customerTypes || []),
            tags: Array.isArray(prev?.tags) ? prev.tags : [],
            note: String(draft.note || '').trim(),
            updated_at: new Date().toISOString()
        };
        await DB.save();
        SalesModule.state.customerDetailMode = 'view';
        SalesModule.state.customerEditDraft = null;
        UI.renderCurrentPage();
        alert('Musteri guncellendi.');
    },

    deleteCustomer: async (customerId) => {
        SalesModule.ensureData();
        const targetId = String(customerId || '').trim();
        if (!targetId) return;
        const rows = Array.isArray(DB.data?.data?.customers) ? DB.data.data.customers : [];
        const idx = rows.findIndex((row) => String(row?.id || '').trim() === targetId);
        if (idx === -1) return alert('Musteri kaydi bulunamadi.');
        const row = rows[idx] || {};
        const customerName = String(row?.name || row?.customerCode || targetId).trim() || targetId;

        const linkedOrders = SalesModule.getCustomerOrderHistory(row);
        if (linkedOrders.length > 0) {
            return alert(`Bu musteriye bagli ${linkedOrders.length} siparis var. Veri butunlugu icin once siparis kayitlarini duzenleyin.`);
        }

        if (!confirm(`${customerName} musterisini silmek istediginizden emin misiniz?`)) return;

        DB.data.data.customers = rows.filter((item) => String(item?.id || '').trim() !== targetId);
        if (String(SalesModule.state.customerDetailId || '').trim() === targetId) {
            SalesModule.state.customerDetailId = null;
            SalesModule.state.customerDetailMode = 'view';
            SalesModule.state.customerEditDraft = null;
        }
        await DB.save();
        UI.renderCurrentPage();
        alert('Musteri silindi.');
    },

    ensureXlsxLib: async () => {
        if (typeof window !== 'undefined' && window.XLSX) return window.XLSX;
        const scriptId = 'xlsx-lib-cdn';
        const existing = document.getElementById(scriptId);
        if (existing) {
            await new Promise((resolve, reject) => {
                if (window.XLSX) return resolve();
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', () => reject(new Error('XLSX kutuphanesi yuklenemedi.')), { once: true });
            });
            return window.XLSX;
        }
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('XLSX kutuphanesi yuklenemedi.'));
            document.head.appendChild(script);
        });
        if (!window.XLSX) throw new Error('XLSX kutuphanesi kullanilamiyor.');
        return window.XLSX;
    },

    normalizeImportToken: (value) => String(value || '')
        .trim()
        .toLocaleLowerCase('tr-TR')
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'i')
        .replace(/ş/g, 's')
        .replace(/Ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/Ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/Ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/Ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'c')
        .replace(/[^a-z0-9]+/g, ''),

    normalizeCustomerNameKey: (value) => String(value || '')
        .trim()
        .toLocaleUpperCase('tr-TR')
        .replace(/\s+/g, ' '),

    normalizePhoneKey: (value) => String(value || '').replace(/\D+/g, ''),

    normalizeTaxKey: (value) => String(value || '')
        .trim()
        .toLocaleUpperCase('tr-TR')
        .replace(/\s+/g, ''),

    findImportColumnIndex: (headerMap, names = []) => {
        for (let i = 0; i < names.length; i += 1) {
            const key = SalesModule.normalizeImportToken(names[i]);
            if (!key) continue;
            if (Object.prototype.hasOwnProperty.call(headerMap, key)) return headerMap[key];
        }
        return -1;
    },

    buildImportAddress: (...parts) => parts
        .map((part) => String(part || '').trim())
        .filter(Boolean)
        .join(' '),

    toImportRowValue: (row, idx) => String(Array.isArray(row) ? (row[idx] ?? '') : '').trim(),

    parseCustomersFromWorksheetRows: (sheetRows = []) => {
        if (!Array.isArray(sheetRows) || !sheetRows.length) {
            return { parsedRows: [], skippedRows: [], fileRowCount: 0 };
        }
        const headerRaw = Array.isArray(sheetRows[0]) ? sheetRows[0] : [];
        const headerMap = {};
        const addressColumnIndexes = [];
        headerRaw.forEach((cell, index) => {
            const key = SalesModule.normalizeImportToken(cell);
            if (!key) return;
            if (key.startsWith('adres') && key !== 'adresno') addressColumnIndexes.push(index);
            if (!Object.prototype.hasOwnProperty.call(headerMap, key)) headerMap[key] = index;
        });

        const idxCariCode = SalesModule.findImportColumnIndex(headerMap, ['cari kodu', 'cari kod', 'cari kodu']);
        const idxName = SalesModule.findImportColumnIndex(headerMap, ['cari adi', 'cari adi', 'musteri adi', 'unvan']);
        const idxAddressNo = SalesModule.findImportColumnIndex(headerMap, ['adres no', 'adresno']);
        const idxPostal = SalesModule.findImportColumnIndex(headerMap, ['posta kodu', 'posta kod']);
        const idxDistrict = SalesModule.findImportColumnIndex(headerMap, ['ilce', 'ilceadi']);
        const idxCity = SalesModule.findImportColumnIndex(headerMap, ['il']);
        const idxCountry = SalesModule.findImportColumnIndex(headerMap, ['ulke']);
        const idxTelCountry = SalesModule.findImportColumnIndex(headerMap, ['tel ulke kodu', 'telefon ulke kodu']);
        const idxTelArea = SalesModule.findImportColumnIndex(headerMap, ['tel bolge kodu', 'telefon bolge kodu']);
        const idxTel1 = SalesModule.findImportColumnIndex(headerMap, ['tel no1', 'telefon', 'tel no']);
        const idxTel2 = SalesModule.findImportColumnIndex(headerMap, ['tel no2', 'telefon2']);
        const idxFax = SalesModule.findImportColumnIndex(headerMap, ['fax no', 'fax']);
        const idxModem = SalesModule.findImportColumnIndex(headerMap, ['modem no', 'modem']);
        const idxTaxNo = SalesModule.findImportColumnIndex(headerMap, ['vergi no', 'vkn', 'tc kimlik no', 'tc']);
        const idxTaxOffice = SalesModule.findImportColumnIndex(headerMap, ['vergi dairesi']);
        const idxNote = SalesModule.findImportColumnIndex(headerMap, ['ozel not', 'not']);
        const idxEmail = SalesModule.findImportColumnIndex(headerMap, ['eposta', 'e posta', 'mail']);
        const idxAuthorized = SalesModule.findImportColumnIndex(headerMap, ['yetkili', 'yetkili kisi', 'yetkili ad']);

        const parsedRows = [];
        const skippedRows = [];

        for (let i = 1; i < sheetRows.length; i += 1) {
            const row = Array.isArray(sheetRows[i]) ? sheetRows[i] : [];
            const rawName = SalesModule.toImportRowValue(row, idxName);
            const name = String(rawName || '').trim();
            if (!name) {
                const isCompletelyEmpty = row.every((cell) => String(cell || '').trim() === '');
                if (isCompletelyEmpty) continue;
                skippedRows.push({ sheetRow: i + 1, reason: 'Musteri adi bos oldugu icin atlandi.' });
                continue;
            }

            const phoneCountryCode = SalesModule.toImportRowValue(row, idxTelCountry);
            const phoneAreaCode = SalesModule.toImportRowValue(row, idxTelArea);
            const phoneRaw = SalesModule.toImportRowValue(row, idxTel1);
            const phoneAlt = SalesModule.toImportRowValue(row, idxTel2);
            const phone = String(phoneRaw || [phoneCountryCode, phoneAreaCode].filter(Boolean).join(' ')).trim();

            const addressParts = (addressColumnIndexes.length ? addressColumnIndexes : [])
                .map((colIdx) => SalesModule.toImportRowValue(row, colIdx));
            const address = SalesModule.buildImportAddress(...addressParts);

            parsedRows.push({
                sourceRow: i + 1,
                externalCode: SalesModule.toImportRowValue(row, idxCariCode),
                name,
                addressNo: SalesModule.toImportRowValue(row, idxAddressNo),
                address,
                postalCode: SalesModule.toImportRowValue(row, idxPostal),
                district: SalesModule.toImportRowValue(row, idxDistrict),
                city: SalesModule.toImportRowValue(row, idxCity),
                country: SalesModule.toImportRowValue(row, idxCountry),
                phoneCountryCode,
                phoneAreaCode,
                phone,
                phoneAlt,
                faxNo: SalesModule.toImportRowValue(row, idxFax),
                modemNo: SalesModule.toImportRowValue(row, idxModem),
                taxNo: SalesModule.toImportRowValue(row, idxTaxNo),
                taxOffice: SalesModule.toImportRowValue(row, idxTaxOffice),
                email: SalesModule.toImportRowValue(row, idxEmail),
                authorizedPerson: SalesModule.toImportRowValue(row, idxAuthorized),
                note: SalesModule.toImportRowValue(row, idxNote),
                isActive: true
            });
        }

        return { parsedRows, skippedRows, fileRowCount: Math.max(0, sheetRows.length - 1) };
    },

    buildCustomerImportPreview: (parsedRows = [], skippedRows = []) => {
        const existing = SalesModule.getCustomers();
        const existingTax = new Set();
        const existingNamePhone = new Set();

        existing.forEach((row) => {
            const taxKey = SalesModule.normalizeTaxKey(row?.taxNo || '');
            if (taxKey) existingTax.add(taxKey);
            const nameKey = SalesModule.normalizeCustomerNameKey(row?.name || '');
            const phoneKey = SalesModule.normalizePhoneKey(row?.phone || '');
            if (nameKey && phoneKey) existingNamePhone.add(`${nameKey}|${phoneKey}`);
        });

        const incomingTax = new Set();
        const incomingNamePhone = new Set();
        const previewRows = parsedRows.map((row) => {
            const warnings = [];
            const taxKey = SalesModule.normalizeTaxKey(row?.taxNo || '');
            const nameKey = SalesModule.normalizeCustomerNameKey(row?.name || '');
            const phoneKey = SalesModule.normalizePhoneKey(row?.phone || '');
            const namePhoneKey = (nameKey && phoneKey) ? `${nameKey}|${phoneKey}` : '';
            let status = 'ready';
            let reason = '';

            if (!phoneKey) warnings.push('Telefon eksik');
            if (!taxKey) warnings.push('Vergi no eksik');
            if (!String(row?.city || '').trim()) warnings.push('Sehir eksik');

            if (taxKey && (existingTax.has(taxKey) || incomingTax.has(taxKey))) {
                status = 'duplicate';
                reason = 'Vergi no ayni oldugu icin mukerrer.';
            } else if (namePhoneKey && (existingNamePhone.has(namePhoneKey) || incomingNamePhone.has(namePhoneKey))) {
                status = 'duplicate';
                reason = 'Isim + telefon ayni oldugu icin mukerrer.';
            }

            if (status !== 'duplicate') {
                if (taxKey) incomingTax.add(taxKey);
                if (namePhoneKey) incomingNamePhone.add(namePhoneKey);
            }

            if (status === 'ready' && warnings.length > 0) {
                status = 'warning';
                reason = warnings.join(', ');
            }

            return {
                ...row,
                status,
                reason,
                warnings,
                importable: status === 'ready' || status === 'warning'
            };
        });

        const counters = {
            ready: previewRows.filter((row) => row.status === 'ready').length,
            warning: previewRows.filter((row) => row.status === 'warning').length,
            duplicate: previewRows.filter((row) => row.status === 'duplicate').length,
            skipped: Array.isArray(skippedRows) ? skippedRows.length : 0
        };

        return { rows: previewRows, skippedRows, counters };
    },

    renderCustomerImportPreviewRowsHtml: (rows = []) => {
        if (!Array.isArray(rows) || !rows.length) {
            return '<tr><td colspan="7" style="padding:0.9rem; text-align:center; color:#94a3b8;">Aktarilacak uygun satir bulunamadi.</td></tr>';
        }
        return rows.map((row) => {
            const statusMeta = row.status === 'duplicate'
                ? { text: 'Mukerrer', bg: '#fee2e2', color: '#991b1b', border: '#fecaca' }
                : (row.status === 'warning'
                    ? { text: 'Eksik Bilgi', bg: '#fef3c7', color: '#92400e', border: '#fcd34d' }
                    : { text: 'Eklenecek', bg: '#dcfce7', color: '#166534', border: '#86efac' });
            return `
                <tr style="border-bottom:1px solid #eef2f7;">
                    <td style="padding:0.5rem; font-family:Consolas,monospace; color:#475569;">${SalesModule.escapeHtml(String(row?.sourceRow || '-'))}</td>
                    <td style="padding:0.5rem;">
                        <span style="display:inline-flex; align-items:center; padding:0.18rem 0.52rem; border:1px solid ${SalesModule.escapeHtml(statusMeta.border)}; border-radius:999px; background:${SalesModule.escapeHtml(statusMeta.bg)}; color:${SalesModule.escapeHtml(statusMeta.color)}; font-size:0.72rem; font-weight:800;">${SalesModule.escapeHtml(statusMeta.text)}</span>
                    </td>
                    <td style="padding:0.5rem; font-family:Consolas,monospace;">${SalesModule.escapeHtml(String(row?.externalCode || '-'))}</td>
                    <td style="padding:0.5rem; font-weight:700; color:#334155;">${SalesModule.escapeHtml(String(row?.name || '-'))}</td>
                    <td style="padding:0.5rem;">${SalesModule.escapeHtml(String(row?.phone || '-'))}</td>
                    <td style="padding:0.5rem;">${SalesModule.escapeHtml(String(row?.city || '-'))}</td>
                    <td style="padding:0.5rem; color:#64748b;">${SalesModule.escapeHtml(String(row?.reason || '-'))}</td>
                </tr>
            `;
        }).join('');
    },

    openCustomerExcelImportPicker: () => {
        const input = document.getElementById('sales_customer_excel_import_input');
        if (!input) return alert('Dosya secme alani bulunamadi.');
        input.value = '';
        input.click();
    },

    handleCustomerExcelImportInput: async (input) => {
        try {
            const file = input?.files?.[0];
            if (!file) return;
            await SalesModule.ensureXlsxLib();
            const buffer = await file.arrayBuffer();
            const workbook = window.XLSX.read(buffer, { type: 'array', raw: false, cellText: true, cellDates: false });
            const firstSheetName = Array.isArray(workbook?.SheetNames) ? workbook.SheetNames[0] : '';
            if (!firstSheetName) return alert('Dosyada sayfa bulunamadi.');
            const sheet = workbook.Sheets[firstSheetName];
            const sheetRows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
            const parsed = SalesModule.parseCustomersFromWorksheetRows(sheetRows);
            const preview = SalesModule.buildCustomerImportPreview(parsed.parsedRows, parsed.skippedRows);
            SalesModule.state.customerImportPreview = {
                fileName: String(file?.name || 'dosya'),
                fileRowCount: parsed.fileRowCount,
                rows: preview.rows,
                skippedRows: preview.skippedRows,
                counters: preview.counters
            };
            SalesModule.openCustomerImportPreviewModal();
        } catch (error) {
            console.error(error);
            alert(`Excel dosyasi okunamadi: ${error?.message || 'Bilinmeyen hata'}`);
        } finally {
            if (input) input.value = '';
        }
    },

    openCustomerImportPreviewModal: () => {
        const preview = SalesModule.state.customerImportPreview;
        if (!preview || !Array.isArray(preview.rows)) return alert('Onizleme verisi bulunamadi.');
        const counters = preview.counters || { ready: 0, warning: 0, duplicate: 0, skipped: 0 };
        const importableCount = preview.rows.filter((row) => row.importable).length;
        const skippedHtml = (preview.skippedRows || []).length
            ? `
                <div style="margin-top:0.55rem; border:1px solid #fcd34d; background:#fffbeb; color:#92400e; border-radius:0.6rem; padding:0.55rem; font-size:0.82rem;">
                    <strong>Atlanan satirlar:</strong>
                    ${(preview.skippedRows || []).slice(0, 8).map((item) => `Satir ${SalesModule.escapeHtml(String(item?.sheetRow || '-'))}: ${SalesModule.escapeHtml(String(item?.reason || '-'))}`).join(' | ')}
                    ${(preview.skippedRows || []).length > 8 ? ` | +${(preview.skippedRows || []).length - 8} satir daha` : ''}
                </div>
            `
            : '';

        const html = `
            <div style="display:flex; flex-direction:column; gap:0.65rem;">
                <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.55rem;">
                    <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Dosya satiri</div><div style="font-weight:800; color:#0f172a;">${SalesModule.escapeHtml(String(preview.fileRowCount || 0))}</div></div>
                    <div style="border:1px solid #bbf7d0; background:#f0fdf4; border-radius:0.6rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#166534;">Eklenecek</div><div style="font-weight:800; color:#166534;">${SalesModule.escapeHtml(String(counters.ready || 0))}</div></div>
                    <div style="border:1px solid #fde68a; background:#fffbeb; border-radius:0.6rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#92400e;">Eksik bilgi ile</div><div style="font-weight:800; color:#92400e;">${SalesModule.escapeHtml(String(counters.warning || 0))}</div></div>
                    <div style="border:1px solid #fecaca; background:#fef2f2; border-radius:0.6rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#991b1b;">Mukerrer/atlanan</div><div style="font-weight:800; color:#991b1b;">${SalesModule.escapeHtml(String((counters.duplicate || 0) + (counters.skipped || 0)))}</div></div>
                </div>
                <div style="font-size:0.82rem; color:#64748b;">Dosya: <strong>${SalesModule.escapeHtml(String(preview.fileName || '-'))}</strong></div>
                <div style="max-height:52vh; overflow:auto; border:1px solid #e2e8f0; border-radius:0.7rem;">
                    <table style="width:100%; min-width:900px; border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:1px solid #e2e8f0; background:#f8fafc; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                                <th style="padding:0.5rem; text-align:left;">Satir</th>
                                <th style="padding:0.5rem; text-align:left;">Durum</th>
                                <th style="padding:0.5rem; text-align:left;">Cari kodu</th>
                                <th style="padding:0.5rem; text-align:left;">Musteri</th>
                                <th style="padding:0.5rem; text-align:left;">Telefon</th>
                                <th style="padding:0.5rem; text-align:left;">Sehir</th>
                                <th style="padding:0.5rem; text-align:left;">Aciklama</th>
                            </tr>
                        </thead>
                        <tbody>${SalesModule.renderCustomerImportPreviewRowsHtml(preview.rows)}</tbody>
                    </table>
                </div>
                ${skippedHtml}
                <div style="display:flex; justify-content:flex-end; gap:0.45rem;">
                    <button class="btn-sm" onclick="Modal.close()">vazgec</button>
                    <button class="btn-primary" onclick="SalesModule.commitCustomerExcelImport()" ${importableCount > 0 ? '' : 'disabled'}>${importableCount} kaydi iceri al</button>
                </div>
            </div>
        `;
        Modal.open('Musteri Excel Iceri Aktarma Onizleme', html, { maxWidth: '1200px' });
    },

    commitCustomerExcelImport: async () => {
        SalesModule.ensureData();
        const preview = SalesModule.state.customerImportPreview;
        if (!preview || !Array.isArray(preview.rows)) return alert('Aktarma onizlemesi bulunamadi.');
        const importableRows = preview.rows.filter((row) => row.importable);
        if (!importableRows.length) return alert('Iceri alinacak kayit yok.');
        const now = new Date().toISOString();
        let added = 0;
        importableRows.forEach((item) => {
            const row = {
                id: crypto.randomUUID(),
                customerCode: SalesModule.generateCustomerCode(),
                name: String(item?.name || '').trim(),
                city: String(item?.city || '').trim(),
                district: String(item?.district || '').trim(),
                phone: String(item?.phone || '').trim(),
                phoneCountryCode: String(item?.phoneCountryCode || '').trim(),
                phoneAreaCode: String(item?.phoneAreaCode || '').trim(),
                phoneAlt: String(item?.phoneAlt || '').trim(),
                email: String(item?.email || '').trim(),
                taxOffice: String(item?.taxOffice || '').trim(),
                taxNo: String(item?.taxNo || '').trim(),
                address: String(item?.address || '').trim(),
                addressNo: String(item?.addressNo || '').trim(),
                postalCode: String(item?.postalCode || '').trim(),
                country: String(item?.country || '').trim(),
                externalCode: String(item?.externalCode || '').trim(),
                faxNo: String(item?.faxNo || '').trim(),
                modemNo: String(item?.modemNo || '').trim(),
                authorizedPerson: String(item?.authorizedPerson || '').trim(),
                discountRate: 0,
                paymentTermDays: 0,
                riskLimit: 0,
                customerTypes: [],
                tags: [],
                note: String(item?.note || '').trim(),
                isActive: true,
                created_at: now,
                updated_at: now
            };
            if (!row.name) return;
            DB.data.data.customers.push(row);
            added += 1;
        });
        await DB.save();
        SalesModule.state.customerImportPreview = null;
        Modal.close();
        UI.renderCurrentPage();
        const duplicateCount = Number(preview?.counters?.duplicate || 0) + Number(preview?.counters?.skipped || 0);
        const warningCount = Number(preview?.counters?.warning || 0);
        alert(`Iceri aktarma tamamlandi. Eklenen: ${added}, Eksik bilgi ile eklenen: ${warningCount}, Atlanan: ${duplicateCount}.`);
    },

    getCatalogTree: () => ([
        {
            id: 'korkuluk',
            label: 'Korkuluk',
            kind: 'catalog',
            children: [
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
            ]
        },
        {
            id: 'boru-cubuk',
            label: 'Boru & cubuk',
            kind: 'placeholder',
            children: [
                {
                    id: 'boru-cubuk-group',
                    label: 'Boru & cubuk',
                    children: [
                        { id: 'boru', label: 'Boru' },
                        { id: 'cubuk', label: 'Cubuk' },
                        { id: 'ozel-profiller', label: 'Ozel profiller' }
                    ]
                }
            ]
        },
        {
            id: 'pleksi-mobilya',
            label: 'Pleksi mobilya',
            kind: 'placeholder',
            children: [
                {
                    id: 'pleksi-mobilya-group',
                    label: 'Pleksi mobilya',
                    children: [
                        { id: 'sehpa', label: 'Sehpalar' },
                        { id: 'mobilya-ayak', label: 'Mobilya ayaklari' },
                        { id: 'diger-aksesuar', label: 'Diger aksesuarlar' }
                    ]
                }
            ]
        }
    ]),

    getCatalogMainById: (mainId) => {
        const id = String(mainId || '').trim();
        if (!id) return null;
        return SalesModule.getCatalogTree().find((item) => item.id === id) || null;
    },

    getCatalogGroupsByMain: (mainId) => {
        const main = SalesModule.getCatalogMainById(mainId);
        return Array.isArray(main?.children) ? main.children : [];
    },

    getCatalogGroupById: (mainId, groupId) => {
        const id = String(groupId || '').trim();
        if (!id) return null;
        return SalesModule.getCatalogGroupsByMain(mainId).find((item) => String(item.id || '') === id) || null;
    },

    getCatalogLeafNodes: () => {
        return SalesModule.getCatalogTree().flatMap((main) => (
            (main.children || []).flatMap((group) => (
                (group.children || []).map((leaf) => ({
                    ...leaf,
                    mainId: String(main.id || ''),
                    mainLabel: String(main.label || ''),
                    mainKind: String(main.kind || ''),
                    groupId: String(group.id || ''),
                    groupLabel: String(group.label || '')
                }))
            ))
        ));
    },

    getCatalogLeafById: (categoryId) => {
        const id = String(categoryId || '').trim();
        if (!id) return null;
        return SalesModule.getCatalogLeafNodes().find((leaf) => leaf.id === id) || null;
    },

    ensureCatalogState: () => {
        const mains = SalesModule.getCatalogTree();
        const mainIds = mains.map((item) => String(item.id || '')).filter(Boolean);
        const activeMain = String(SalesModule.state.catalogActiveMainId || '').trim();
        if (!activeMain || !mainIds.includes(activeMain)) {
            SalesModule.state.catalogActiveMainId = String(mainIds[0] || 'korkuluk');
        }
        const groups = SalesModule.getCatalogGroupsByMain(SalesModule.state.catalogActiveMainId);
        const groupIds = groups.map((item) => String(item.id || '')).filter(Boolean);
        const activeGroup = String(SalesModule.state.catalogActiveGroupId || '').trim();
        if (!activeGroup || !groupIds.includes(activeGroup)) {
            SalesModule.state.catalogActiveGroupId = String(groupIds[0] || '');
        }

        const activeGroupNode = SalesModule.getCatalogGroupById(
            SalesModule.state.catalogActiveMainId,
            SalesModule.state.catalogActiveGroupId
        );
        const leaves = Array.isArray(activeGroupNode?.children) ? activeGroupNode.children : [];
        const leafIds = leaves.map((item) => String(item.id || '')).filter(Boolean);
        const activeLeaf = String(SalesModule.state.catalogActiveCategoryId || '').trim();
        if (!activeLeaf || !leafIds.includes(activeLeaf)) {
            SalesModule.state.catalogActiveCategoryId = String(leafIds[0] || '');
        }

        const expandedMain = String(SalesModule.state.catalogExpandedMainId || '').trim();
        if (expandedMain && !mainIds.includes(expandedMain)) {
            SalesModule.state.catalogExpandedMainId = '';
        }
        const expandedMainGroups = SalesModule.state.catalogExpandedMainId
            ? SalesModule.getCatalogGroupsByMain(SalesModule.state.catalogExpandedMainId)
            : [];
        const expandedGroupIds = expandedMainGroups.map((item) => String(item.id || '')).filter(Boolean);
        const expandedGroup = String(SalesModule.state.catalogExpandedGroupId || '').trim();
        if (expandedGroup && !expandedGroupIds.includes(expandedGroup)) {
            SalesModule.state.catalogExpandedGroupId = '';
        }

        const highlight = String(SalesModule.state.catalogHighlightKey || '').trim();
        if (!highlight) {
            if (String(SalesModule.state.catalogActiveGroupId || '').trim()) {
                SalesModule.state.catalogHighlightKey = `group:${String(SalesModule.state.catalogActiveGroupId || '')}`;
            } else if (String(SalesModule.state.catalogActiveMainId || '').trim()) {
                SalesModule.state.catalogHighlightKey = `main:${String(SalesModule.state.catalogActiveMainId || '')}`;
            } else {
                SalesModule.state.catalogHighlightKey = '';
            }
        }
    },

    getCatalogProducts: () => {
        const rows = Array.isArray(DB.data?.data?.salesCatalogProducts) ? DB.data.data.salesCatalogProducts : [];
        return rows
            .map((row) => {
                const item = row && typeof row === 'object' ? row : {};
                const diameters = Array.isArray(item.diameters)
                    ? item.diameters.map((v) => SalesModule.normalizeCatalogDiameterValue(v)).filter(Boolean)
                    : [];
                const selectedDiameterRaw = SalesModule.normalizeCatalogDiameterValue(item.selectedDiameter || '');
                const colors = item.colors && typeof item.colors === 'object' ? item.colors : {};
                const images = item.images && typeof item.images === 'object' ? item.images : {};
                const pipe = item.pipe && typeof item.pipe === 'object' ? item.pipe : {};
                return {
                    id: String(item.id || '').trim(),
                    categoryId: String(item.categoryId || '').trim(),
                    name: String(item.name || '').trim(),
                    productCode: String(item.productCode || '').trim(),
                    idCode: String(item.idCode || '').trim(),
                    diameters,
                    selectedDiameter: diameters.includes(selectedDiameterRaw) ? selectedDiameterRaw : String(diameters[0] || ''),
                    colors: {
                        accessory: {
                            category: SalesModule.normalizeCatalogColorType(colors.accessory?.category || ''),
                            color: String(colors.accessory?.color || '').trim()
                        },
                        tube: {
                            category: SalesModule.normalizeCatalogColorType(colors.tube?.category || ''),
                            color: String(colors.tube?.color || '').trim()
                        },
                        plexi: {
                            category: SalesModule.normalizeCatalogColorType(colors.plexi?.category || ''),
                            color: String(colors.plexi?.color || '').trim()
                        }
                    },
                    bubble: String(item.bubble || 'yok').trim() === 'var' ? 'var' : 'yok',
                    lowerTubeLength: String(item.lowerTubeLength || 'standart').trim() || 'standart',
                    pipe: {
                        thickness: String(pipe.thickness || item.pipeThickness || '').trim(),
                        lengthMm: String(pipe.lengthMm || item.pipeLengthMm || '').trim()
                    },
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
        const rows = SalesModule.getCatalogProducts()
            .filter((row) => row.categoryId === id);
        if (SalesModule.isPipeCategory(id)) {
            return rows.sort((a, b) => {
                const byDiameter = SalesModule.compareCatalogDiameterValues(a.selectedDiameter || '', b.selectedDiameter || '');
                if (byDiameter !== 0) return byDiameter;
                const byThickness = SalesModule.compareCatalogDiameterValues(a.pipe?.thickness || '', b.pipe?.thickness || '');
                if (byThickness !== 0) return byThickness;
                const byLength = SalesModule.compareCatalogDiameterValues(a.pipe?.lengthMm || '', b.pipe?.lengthMm || '');
                if (byLength !== 0) return byLength;
                return String(a.name || '').localeCompare(String(b.name || ''), 'tr');
            });
        }
        if (SalesModule.isRodCategory(id)) {
            return rows.sort((a, b) => {
                const byDiameter = SalesModule.compareCatalogDiameterValues(a.selectedDiameter || '', b.selectedDiameter || '');
                if (byDiameter !== 0) return byDiameter;
                const byLength = SalesModule.compareCatalogDiameterValues(a.pipe?.lengthMm || '', b.pipe?.lengthMm || '');
                if (byLength !== 0) return byLength;
                return String(a.name || '').localeCompare(String(b.name || ''), 'tr');
            });
        }
        if (SalesModule.isSpecialProfileCategory(id)) {
            return rows.sort((a, b) => {
                const byName = String(a.name || '').localeCompare(String(b.name || ''), 'tr');
                if (byName !== 0) return byName;
                return SalesModule.compareCatalogDiameterValues(a.pipe?.lengthMm || '', b.pipe?.lengthMm || '');
            });
        }
        return rows.sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')));
    },

    getCatalogFilteredProductsByCategory: (categoryId, searchText = '') => {
        const rows = SalesModule.getCatalogProductsByCategory(categoryId);
        const query = SalesModule.normalize(searchText || '');
        if (!query) return rows;
        return rows.filter((row) => {
            const fields = [
                String(row?.name || ''),
                String(row?.productCode || ''),
                String(row?.idCode || ''),
                String(row?.id || '')
            ];
            return fields.some((value) => SalesModule.normalize(value).includes(query));
        });
    },

    getCatalogCategoryPathText: (categoryId) => {
        const leaf = SalesModule.getCatalogLeafById(categoryId);
        if (leaf && String(leaf.id || '') === 'boru') return 'Pleksi boru';
        if (leaf && String(leaf.id || '') === 'cubuk') return 'Pleksi cubuk';
        if (leaf && String(leaf.id || '') === 'ozel-profiller') return 'Ozel profiller';
        if (leaf) return `${leaf.mainLabel} / ${leaf.groupLabel} / ${leaf.label}`;
        const main = SalesModule.getCatalogMainById(SalesModule.state.catalogActiveMainId || '');
        const group = SalesModule.getCatalogGroupById(main?.id || '', SalesModule.state.catalogActiveGroupId || '');
        if (main && group) return `${main.label} / ${group.label}`;
        if (main) return String(main.label || 'Urun grubu');
        return 'Urun grubu';
    },

    isPipeCategory: (categoryId) => String(categoryId || '').trim() === 'boru',
    isRodCategory: (categoryId) => String(categoryId || '').trim() === 'cubuk',
    isSpecialProfileCategory: (categoryId) => String(categoryId || '').trim() === 'ozel-profiller',
    isPipeFamilyCategory: (categoryId) => {
        const id = String(categoryId || '').trim();
        return id === 'boru' || id === 'cubuk' || id === 'ozel-profiller';
    },

    normalizeCatalogColorType: (value) => {
        const raw = String(value || '').trim();
        if (!raw) return '';
        const map = {
            'anodize-seri': 'eloksal',
            'elektrostatik-seri': 'boya',
            'pvd-seri': 'pvd',
            'pleksi-seri': 'pleksi',
            'opal-seri': 'pleksi',
            'ozel-seri': 'pleksi',
            eloksal: 'eloksal',
            pvd: 'pvd',
            boya: 'boya',
            pleksi: 'pleksi'
        };
        if (map[raw]) return map[raw];
        if (typeof ProductLibraryModule !== 'undefined' && ProductLibraryModule && typeof ProductLibraryModule.normalizeColorType === 'function') {
            return String(ProductLibraryModule.normalizeColorType(raw) || '');
        }
        const normalized = SalesModule.normalize(raw);
        if (normalized.includes('eloksal') || normalized.includes('aloksal')) return 'eloksal';
        if (normalized.includes('pvd')) return 'pvd';
        if (normalized.includes('boya') || normalized.includes('elektrostatik')) return 'boya';
        if (normalized.includes('pleksi')) return 'pleksi';
        return '';
    },

    getCatalogColorTypeMetaOptions: () => {
        if (typeof ProductLibraryModule !== 'undefined' && ProductLibraryModule && typeof ProductLibraryModule.getColorTypeOptions === 'function') {
            return ProductLibraryModule.getColorTypeOptions()
                .map((opt) => ({
                    value: SalesModule.normalizeCatalogColorType(opt?.id || ''),
                    label: String(opt?.label || '').trim()
                }))
                .filter((opt) => opt.value && opt.label);
        }
        return [
            { value: 'eloksal', label: 'Eloksal Renkleri' },
            { value: 'pvd', label: 'Pvd krom kaplama' },
            { value: 'boya', label: 'Elektrostatik boya' },
            { value: 'pleksi', label: 'Pleksi renk' }
        ];
    },

    getCatalogColorCategoryOptions: (field) => {
        const key = String(field || '').trim();
        const all = SalesModule.getCatalogColorTypeMetaOptions();
        if (key === 'plexi') return all.filter((opt) => opt.value === 'pleksi');
        return all.filter((opt) => opt.value !== 'pleksi');
    },

    getCatalogColorLibraryItemsByType: (type) => {
        const normalizedType = SalesModule.normalizeCatalogColorType(type);
        if (!normalizedType) return [];
        if (typeof ProductLibraryModule !== 'undefined' && ProductLibraryModule && typeof ProductLibraryModule.getColorLibraryItemsByType === 'function') {
            return ProductLibraryModule.getColorLibraryItemsByType(normalizedType)
                .map((row) => String(row?.name || '').trim())
                .filter(Boolean);
        }
        const rows = Array.isArray(DB.data?.data?.colorLibrary) ? DB.data.data.colorLibrary : [];
        return rows
            .filter((row) => SalesModule.normalizeCatalogColorType(row?.type || row?.processType || row?.category || '') === normalizedType)
            .map((row) => String(row?.name || row?.colorName || '').trim())
            .filter(Boolean);
    },

    getCatalogColorOptions: (_field, category) => {
        const type = SalesModule.normalizeCatalogColorType(category);
        if (!type) return [];
        const uniq = new Map();
        SalesModule.getCatalogColorLibraryItemsByType(type).forEach((name) => {
            const key = String(name || '').trim().toLocaleLowerCase('tr-TR');
            if (!key) return;
            if (!uniq.has(key)) uniq.set(key, String(name || '').trim());
        });
        return Array.from(uniq.values()).sort((a, b) => String(a || '').localeCompare(String(b || ''), 'tr'));
    },

    normalizeCatalogDiameterValue: (value) => {
        const text = String(value || '').trim().replace(',', '.').replace(/[^0-9.]/g, '');
        if (!text) return '';
        const num = Number(text);
        if (!Number.isFinite(num) || num <= 0) return '';
        if (Math.abs(num - Math.round(num)) < 0.000001) return String(Math.round(num));
        return String(Number(num.toFixed(2))).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
    },

    compareCatalogDiameterValues: (a, b) => {
        const numA = Number(String(a || '').replace(',', '.'));
        const numB = Number(String(b || '').replace(',', '.'));
        if (Number.isFinite(numA) && Number.isFinite(numB)) return numA - numB;
        return String(a || '').localeCompare(String(b || ''), 'tr');
    },

    ensureCatalogDiameterLibrary: () => {
        if (!DB.data || typeof DB.data !== 'object') DB.data = {};
        if (!DB.data.meta || typeof DB.data.meta !== 'object') DB.data.meta = {};
        if (!DB.data.meta.options || typeof DB.data.meta.options !== 'object') DB.data.meta.options = {};
        if (!Array.isArray(DB.data.meta.options.catalogDiameters)) DB.data.meta.options.catalogDiameters = ['40', '50', '65'];
        const source = DB.data.meta.options.catalogDiameters || [];
        const uniq = new Map();
        source.forEach((raw) => {
            const value = SalesModule.normalizeCatalogDiameterValue(raw);
            if (!value) return;
            if (!uniq.has(value)) uniq.set(value, value);
        });
        const list = Array.from(uniq.values()).sort((a, b) => SalesModule.compareCatalogDiameterValues(a, b));
        DB.data.meta.options.catalogDiameters = list.length ? list : ['40', '50', '65'];
    },

    getCatalogDiameterLibrary: () => {
        SalesModule.ensureCatalogDiameterLibrary();
        return [...(DB.data?.meta?.options?.catalogDiameters || [])];
    },

    renderCatalogDiameterPickerOptionsHtml: (selectedDiameters = [], selectedValue = '') => {
        const selectedSet = new Set((Array.isArray(selectedDiameters) ? selectedDiameters : [])
            .map((item) => SalesModule.normalizeCatalogDiameterValue(item))
            .filter(Boolean));
        const rows = SalesModule.getCatalogDiameterLibrary()
            .filter((value) => !selectedSet.has(value));
        const selected = SalesModule.normalizeCatalogDiameterValue(selectedValue || '');
        const placeholder = `<option value="" ${selected ? '' : 'selected'}>listeden cap sec</option>`;
        const options = rows.map((value) => `<option value="${SalesModule.escapeHtml(value)}" ${value === selected ? 'selected' : ''}>Ø ${SalesModule.escapeHtml(value)}</option>`).join('');
        return `${placeholder}${options}`;
    },

    renderCatalogDiameterManagerListHtml: () => {
        const rows = SalesModule.getCatalogDiameterLibrary();
        if (!rows.length) return '<div class="sales-catalog-empty-text">Tanimli cap bulunamadi.</div>';
        return rows.map((value) => `
            <div class="sales-catalog-manage-row">
                <div class="sales-catalog-manage-value">Ø ${SalesModule.escapeHtml(value)}</div>
                <button type="button" class="btn-sm" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;" onclick="SalesModule.removeCatalogDiameterLibraryItem('${SalesModule.escapeHtml(value)}')">sil</button>
            </div>
        `).join('');
    },

    buildCatalogDraft: (categoryId, source = null) => {
        const row = source && typeof source === 'object' ? source : {};
        const now = SalesModule.getCatalogProducts().length + 1;
        const colorDefaults = (field, sourceValue = {}) => {
            const categories = SalesModule.getCatalogColorCategoryOptions(field);
            const requestedCategory = SalesModule.normalizeCatalogColorType(sourceValue?.category || '');
            const sourceColor = String(sourceValue?.color || '').trim();
            let selectedCategory = categories.some((item) => item.value === requestedCategory) ? requestedCategory : '';
            if (!selectedCategory && sourceColor && typeof ProductLibraryModule !== 'undefined' && ProductLibraryModule && typeof ProductLibraryModule.resolveLinkedColorInfo === 'function') {
                const linked = ProductLibraryModule.resolveLinkedColorInfo({ colorName: sourceColor });
                const guessed = SalesModule.normalizeCatalogColorType(linked?.type || '');
                if (categories.some((item) => item.value === guessed)) selectedCategory = guessed;
            }
            const colors = SalesModule.getCatalogColorOptions(field, selectedCategory);
            return {
                category: selectedCategory,
                color: colors.includes(sourceColor) ? sourceColor : ''
            };
        };
        const draftDiameters = Array.isArray(row.diameters) && row.diameters.length
            ? row.diameters.map((v) => SalesModule.normalizeCatalogDiameterValue(v)).filter(Boolean)
            : SalesModule.getCatalogDiameterLibrary().slice(0, 3);
        const draftSelectedDiameter = SalesModule.normalizeCatalogDiameterValue(String(row.selectedDiameter || '').trim());
        return {
            categoryId: String(categoryId || '').trim(),
            name: String(row.name || '').trim(),
            productCode: String(row.productCode || `KRL-${String(now).padStart(4, '0')}`).trim(),
            idCode: String(row.idCode || SalesModule.generateCatalogPublicId({ rowId: String(row.id || '').trim() })).trim(),
            diameters: draftDiameters,
            selectedDiameter: draftDiameters.includes(draftSelectedDiameter) ? draftSelectedDiameter : String(draftDiameters[0] || ''),
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

    buildPipeDraft: (categoryId, source = null) => {
        const row = source && typeof source === 'object' ? source : {};
        const categoryKey = String(categoryId || '').trim();
        const isBoru = SalesModule.isPipeCategory(categoryKey);
        const isCubuk = SalesModule.isRodCategory(categoryKey);
        const isOzel = SalesModule.isSpecialProfileCategory(categoryKey);
        const diameter = SalesModule.normalizeCatalogDiameterValue(
            row.selectedDiameter || (Array.isArray(row.diameters) ? row.diameters[0] : '')
        );
        const plexiColors = SalesModule.getCatalogColorOptions('plexi', 'pleksi');
        const sourcePlexiColor = String(row.colors?.plexi?.color || '').trim();
        const selectedPlexiColor = plexiColors.includes(sourcePlexiColor) ? sourcePlexiColor : String(plexiColors[0] || '');
        const thickness = isBoru ? SalesModule.normalizeCatalogDiameterValue(row.pipe?.thickness || row.pipeThickness || '') : '';
        const lengthMm = SalesModule.normalizeCatalogDiameterValue(row.pipe?.lengthMm || row.pipeLengthMm || '');
        const defaultName = isBoru
            ? (diameter ? `Boru Ø ${diameter}` : 'Boru')
            : (isCubuk ? (diameter ? `Cubuk Ø ${diameter}` : 'Cubuk') : '');
        const bubbleValue = String(row.bubble || 'yok').trim() === 'var' ? 'var' : 'yok';
        return {
            categoryId: categoryKey,
            name: String(row.name || defaultName).trim(),
            productCode: String(row.productCode || '').trim(),
            idCode: String(row.idCode || SalesModule.generateCatalogPublicId()).trim(),
            diameters: isOzel ? [] : (diameter ? [diameter] : []),
            selectedDiameter: isOzel ? '' : diameter,
            lowerTubeLength: String(row.lowerTubeLength || 'standart').trim() || 'standart',
            bubble: isBoru ? 'yok' : bubbleValue,
            note: String(row.note || '').trim(),
            pipe: {
                thickness,
                lengthMm
            },
            colors: {
                accessory: { category: '', color: '' },
                tube: { category: '', color: '' },
                plexi: { category: 'pleksi', color: selectedPlexiColor }
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

    generateCatalogPublicId: (options = {}) => {
        const rowId = String(options?.rowId || '').trim();
        const exclude = rowId
            ? { collection: 'salesCatalogProducts', id: rowId, field: 'idCode' }
            : null;

        const normalizeCode = (value) => {
            if (typeof IdentityPolicy !== 'undefined'
                && IdentityPolicy
                && typeof IdentityPolicy.normalizeCode === 'function') {
                return IdentityPolicy.normalizeCode(value);
            }
            return String(value ?? '').trim().toUpperCase().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
        };

        if (typeof IdentityPolicy !== 'undefined'
            && IdentityPolicy
            && typeof IdentityPolicy.collectGlobalCodes === 'function') {
            const usedCodes = IdentityPolicy.collectGlobalCodes(DB.data, exclude);
            if (typeof IdentityPolicy.makeId === 'function') {
                for (let i = 0; i < 30; i += 1) {
                    const candidate = String(IdentityPolicy.makeId('SAL', usedCodes) || '').trim();
                    if (!candidate) continue;
                    const normalized = normalizeCode(candidate);
                    if (!normalized || usedCodes.has(normalized)) continue;
                    return normalized;
                }
            }
            if (typeof IdentityPolicy.getNextGlobalCode === 'function') {
                return IdentityPolicy.getNextGlobalCode(DB.data, { prefix: 'SAL', digits: 6, exclude });
            }
        }
        const rows = Array.isArray(DB.data?.data?.salesCatalogProducts) ? DB.data.data.salesCatalogProducts : [];
        const used = new Set(
            rows
                .filter((row) => !rowId || String(row?.id || '').trim() !== rowId)
                .map((row) => normalizeCode(row?.idCode || ''))
                .filter(Boolean)
        );

        const buildRandomCandidate = () => {
            const token = (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
                ? globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
                : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
            return `SAL-${token}`;
        };

        for (let i = 0; i < 30; i += 1) {
            const candidate = normalizeCode(buildRandomCandidate());
            if (!candidate || used.has(candidate)) continue;
            return candidate;
        }
        let seq = rows.length + 1;
        let candidate = normalizeCode(`SAL-${String(seq).padStart(6, '0')}`);
        while (used.has(candidate)) {
            seq += 1;
            candidate = normalizeCode(`SAL-${String(seq).padStart(6, '0')}`);
        }
        return candidate;
    },

    setCatalogActiveMain: (mainId) => {
        const id = String(mainId || '').trim();
        if (!id) return;
        const main = SalesModule.getCatalogMainById(id);
        if (!main) return;
        const isExpanded = String(SalesModule.state.catalogExpandedMainId || '') === id;
        if (isExpanded) {
            SalesModule.state.catalogExpandedMainId = '';
            SalesModule.state.catalogExpandedGroupId = '';
            SalesModule.state.catalogHighlightKey = `main:${id}`;
            UI.renderCurrentPage();
            return;
        }
        SalesModule.state.catalogActiveMainId = id;
        SalesModule.state.catalogExpandedMainId = id;
        const groups = SalesModule.getCatalogGroupsByMain(id);
        SalesModule.state.catalogActiveGroupId = String(groups[0]?.id || '');
        SalesModule.state.catalogExpandedGroupId = '';
        const leaves = Array.isArray(groups[0]?.children) ? groups[0].children : [];
        SalesModule.state.catalogActiveCategoryId = String(leaves[0]?.id || '');
        SalesModule.state.catalogHighlightKey = SalesModule.state.catalogActiveGroupId
            ? `group:${SalesModule.state.catalogActiveGroupId}`
            : `main:${id}`;
        UI.renderCurrentPage();
    },

    setCatalogActiveGroup: (groupId) => {
        const id = String(groupId || '').trim();
        if (!id) return;
        const group = SalesModule.getCatalogGroupById(SalesModule.state.catalogActiveMainId, id);
        if (!group) return;
        const isExpanded = String(SalesModule.state.catalogExpandedGroupId || '') === id;
        SalesModule.state.catalogHighlightKey = `group:${id}`;
        if (isExpanded) {
            SalesModule.state.catalogExpandedGroupId = '';
            UI.renderCurrentPage();
            return;
        }
        SalesModule.state.catalogActiveGroupId = id;
        SalesModule.state.catalogExpandedGroupId = id;
        const leaves = Array.isArray(group.children) ? group.children : [];
        SalesModule.state.catalogActiveCategoryId = String(leaves[0]?.id || '');
        UI.renderCurrentPage();
    },

    setCatalogActiveCategory: (categoryId) => {
        const leaf = SalesModule.getCatalogLeafById(categoryId);
        if (!leaf) return;
        SalesModule.state.catalogActiveMainId = String(leaf.mainId || '');
        SalesModule.state.catalogActiveGroupId = String(leaf.groupId || '');
        SalesModule.state.catalogActiveCategoryId = String(leaf.id || '');
        SalesModule.state.catalogExpandedMainId = String(leaf.mainId || '');
        SalesModule.state.catalogExpandedGroupId = String(leaf.groupId || '');
        SalesModule.state.catalogHighlightKey = `leaf:${String(leaf.id || '')}`;
        UI.renderCurrentPage();
    },

    setCatalogSearchText: (value) => {
        const active = document.activeElement;
        const inputId = 'sales_catalog_search_input';
        const shouldRestore = !!(active && String(active.id || '') === inputId);
        const start = typeof active?.selectionStart === 'number' ? active.selectionStart : null;
        const end = typeof active?.selectionEnd === 'number' ? active.selectionEnd : null;

        SalesModule.state.catalogSearchText = String(value || '');
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

    clearCatalogSearch: () => {
        SalesModule.state.catalogSearchText = '';
        UI.renderCurrentPage();
        const next = document.getElementById('sales_catalog_search_input');
        if (next) next.focus();
    },

    renderCatalogColorCategoryOptionsHtml: (field, selectedValue) => {
        const selected = SalesModule.normalizeCatalogColorType(selectedValue || '');
        const options = SalesModule.getCatalogColorCategoryOptions(field)
            .map((opt) => `<option value="${SalesModule.escapeHtml(opt.value)}" ${opt.value === selected ? 'selected' : ''}>${SalesModule.escapeHtml(opt.label)}</option>`)
            .join('');
        const placeholder = `<option value="" ${selected ? '' : 'selected'}>kategori sec</option>`;
        return `${placeholder}${options}`;
    },

    renderCatalogColorOptionsHtml: (field, selectedCategory, selectedColor) => {
        const category = SalesModule.normalizeCatalogColorType(selectedCategory || '');
        const colors = SalesModule.getCatalogColorOptions(field, category);
        const selected = String(selectedColor || '').trim();
        if (!category) return '<option value="" selected>renk sec</option>';
        const options = colors
            .map((opt) => `<option value="${SalesModule.escapeHtml(opt)}" ${String(opt) === selected ? 'selected' : ''}>${SalesModule.escapeHtml(opt)}</option>`)
            .join('');
        const placeholder = `<option value="" ${selected ? '' : 'selected'}>renk sec</option>`;
        return `${placeholder}${options}`;
    },

    renderCatalogDiameterButtonsHtml: (diameters, selectedDiameter, clickHandlerName, removeHandlerName = '') => {
        const list = Array.isArray(diameters) ? diameters : [];
        return list.map((dia) => {
            const value = SalesModule.normalizeCatalogDiameterValue(dia);
            if (!value) return '';
            const active = value === String(selectedDiameter || '').trim();
            return `
                <span class="sales-catalog-chip-wrap ${active ? 'is-active' : ''}">
                    <button type="button" class="sales-catalog-chip ${active ? 'is-active' : ''}" onclick="${SalesModule.escapeHtml(clickHandlerName)}('${SalesModule.escapeHtml(value)}')">Ø ${SalesModule.escapeHtml(value)}</button>
                    ${removeHandlerName ? `<button type="button" class="sales-catalog-chip-remove" onclick="event.stopPropagation(); ${SalesModule.escapeHtml(removeHandlerName)}('${SalesModule.escapeHtml(value)}')">&times;</button>` : ''}
                </span>
            `;
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
        const mains = SalesModule.getCatalogTree();
        const expandedMainId = String(SalesModule.state.catalogExpandedMainId || '').trim();
        const expandedGroupId = String(SalesModule.state.catalogExpandedGroupId || '').trim();
        const highlightKey = String(SalesModule.state.catalogHighlightKey || '').trim();
        return `
            <div class="sales-catalog-tree">
                ${mains.map((main) => {
                const mainId = String(main.id || '');
                const mainLabel = String(main.label || '-');
                const isMainOpen = mainId === expandedMainId;
                const groups = isMainOpen ? SalesModule.getCatalogGroupsByMain(mainId) : [];
                const hasGroups = groups.length > 0;
                const hasSingleSameNamedGroup = hasGroups
                    && groups.length === 1
                    && SalesModule.normalize(groups[0]?.label || '') === SalesModule.normalize(mainLabel);
                const singleGroupId = hasSingleSameNamedGroup ? String(groups[0]?.id || '') : '';
                const isMainActive = highlightKey === `main:${mainId}`
                    || (hasSingleSameNamedGroup && highlightKey === `group:${singleGroupId}`);
                return `
                        <div class="sales-catalog-tree-main ${isMainOpen ? 'is-open' : ''}">
                            <button class="sales-catalog-tree-main-btn ${isMainActive ? 'is-active' : ''}" onclick="SalesModule.setCatalogActiveMain('${SalesModule.escapeHtml(mainId)}')">
                                <span>${SalesModule.escapeHtml(mainLabel)}</span>
                                <span class="sales-catalog-tree-arrow">${isMainOpen ? 'v' : '>'}</span>
                            </button>

                            ${isMainOpen ? `
                                <div class="sales-catalog-tree-main-panel">
                                    <div class="sales-catalog-tree-group-list">
                                    ${hasGroups
                ? (hasSingleSameNamedGroup
                    ? (() => {
                        const onlyGroup = groups[0] || {};
                        const leaves = Array.isArray(onlyGroup.children) ? onlyGroup.children : [];
                        return `
                                                <div class="sales-catalog-tree-group is-open">
                                                    <div class="sales-catalog-tree-leaf-list">
                                                        ${leaves.length ? leaves.map((leaf) => {
                                const leafId = String(leaf.id || '');
                                const leafLabel = String(leaf.label || '-');
                                const isLeafActive = highlightKey === `leaf:${leafId}`;
                                return `
                                                            <button class="sales-catalog-tree-leaf-btn ${isLeafActive ? 'is-active' : ''}" onclick="SalesModule.setCatalogActiveCategory('${SalesModule.escapeHtml(leafId)}')">
                                                                ${SalesModule.escapeHtml(leafLabel)}
                                                            </button>
                                                        `;
                            }).join('') : '<div class="sales-catalog-tree-empty">Alt urun bulunamadi.</div>'}
                                                    </div>
                                                </div>
                                            `;
                    })()
                    : groups.map((group) => {
                        const groupId = String(group.id || '');
                        const groupLabel = String(group.label || '-');
                        const isGroupOpen = groupId === expandedGroupId;
                        const isGroupActive = highlightKey === `group:${groupId}`;
                        const leaves = Array.isArray(group.children) ? group.children : [];
                        return `
                                            <div class="sales-catalog-tree-group ${isGroupOpen ? 'is-open' : ''}">
                                                <button class="sales-catalog-tree-group-btn ${isGroupActive ? 'is-active' : ''}" onclick="SalesModule.setCatalogActiveGroup('${SalesModule.escapeHtml(groupId)}')">
                                                    <span>${SalesModule.escapeHtml(groupLabel)}</span>
                                                    <span class="sales-catalog-tree-arrow">${isGroupOpen ? 'v' : '>'}</span>
                                                </button>

                                                ${isGroupOpen ? `
                                                    <div class="sales-catalog-tree-leaf-list">
                                                        ${leaves.length ? leaves.map((leaf) => {
                            const leafId = String(leaf.id || '');
                            const leafLabel = String(leaf.label || '-');
                            const isLeafActive = highlightKey === `leaf:${leafId}`;
                            return `
                                                                    <button class="sales-catalog-tree-leaf-btn ${isLeafActive ? 'is-active' : ''}" onclick="SalesModule.setCatalogActiveCategory('${SalesModule.escapeHtml(leafId)}')">
                                                                        ${SalesModule.escapeHtml(leafLabel)}
                                                                    </button>
                                                                `;
                        }).join('') : '<div class="sales-catalog-tree-empty">Alt urun bulunamadi.</div>'}
                                                    </div>
                                                ` : ''}
                                            </div>
                                        `;
                    }).join(''))
                : '<div class="sales-catalog-tree-empty">Bu kategoride grup bulunamadi.</div>'}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `;
            }).join('')}
            </div>
        `;
    },

    renderCatalogCardsHtml: (rows, searchText = '', options = {}) => {
        const list = Array.isArray(rows) ? rows : [];
        const requestedSelectAction = String(options?.onSelectAction || '').trim();
        const hasCustomSelectAction = /^[A-Za-z_$][A-Za-z0-9_$.]*$/.test(requestedSelectAction);
        const viewButtonLabel = String(options?.viewButtonLabel || '').trim() || 'goruntule';
        if (!list.length) {
            return `
                <div class="sales-catalog-empty">
                    <div class="sales-catalog-empty-title">${String(searchText || '').trim() ? 'Sonuc bulunamadi' : 'Bu kategoride urun yok'}</div>
                    <div class="sales-catalog-empty-text">${String(searchText || '').trim()
                ? `"${SalesModule.escapeHtml(String(searchText || '').trim())}" ile eslesen urun yok.`
                : 'Yeni urun ekle butonuyla katalog karti olusturabilirsiniz.'}</div>
                </div>
            `;
        }
        return list.map((row) => {
            const image = row.images?.product || row.images?.application || '';
            const id = SalesModule.escapeHtml(String(row.id || ''));
            const isBoru = SalesModule.isPipeCategory(row.categoryId);
            const isCubuk = SalesModule.isRodCategory(row.categoryId);
            const isOzel = SalesModule.isSpecialProfileCategory(row.categoryId);
            const selectAction = hasCustomSelectAction
                ? `${requestedSelectAction}('${id}')`
                : `SalesModule.openCatalogDetailModal('${id}')`;
            return `
                <button class="sales-catalog-card" onclick="${selectAction}">
                    <div class="sales-catalog-card-media ${image ? '' : 'is-empty'}">
                        ${image
                    ? `<img src="${SalesModule.escapeHtml(image)}" alt="${SalesModule.escapeHtml(row.name || 'Urun')}" class="sales-catalog-card-image">`
                    : '<div class="sales-catalog-card-placeholder">Gorsel yok</div>'}
                    </div>
                    <div class="sales-catalog-card-body">
                        <div class="sales-catalog-card-title">${SalesModule.escapeHtml(row.name || '-')}</div>
                        <div class="sales-catalog-card-code">${SalesModule.escapeHtml(row.productCode || row.idCode || '-')}</div>
                        <div class="sales-catalog-card-meta-row">
                            ${isBoru ? `<span class="sales-catalog-pill">Ø ${SalesModule.escapeHtml(row.selectedDiameter || '-')}</span>
                                   <span class="sales-catalog-pill">kalinlik ${SalesModule.escapeHtml(row.pipe?.thickness || '-')}</span>
                                   <span class="sales-catalog-pill">boy ${SalesModule.escapeHtml(row.pipe?.lengthMm || '-')} mm</span>` : ''}
                            ${isCubuk ? `<span class="sales-catalog-pill">Ø ${SalesModule.escapeHtml(row.selectedDiameter || '-')}</span>
                                   <span class="sales-catalog-pill">boy ${SalesModule.escapeHtml(row.pipe?.lengthMm || '-')} mm</span>
                                   <span class="sales-catalog-pill">${row.bubble === 'var' ? 'Kabarcik var' : 'Kabarcik yok'}</span>` : ''}
                            ${isOzel ? `<span class="sales-catalog-pill">boy ${SalesModule.escapeHtml(row.pipe?.lengthMm || '-')} mm</span>
                                   <span class="sales-catalog-pill">${row.bubble === 'var' ? 'Kabarcik var' : 'Kabarcik yok'}</span>` : ''}
                            ${(!isBoru && !isCubuk && !isOzel) ? `<span class="sales-catalog-pill">${row.bubble === 'var' ? 'Kabarcik var' : 'Kabarcik yok'}</span>
                                   <span class="sales-catalog-pill">Ø ${SalesModule.escapeHtml(row.selectedDiameter || '-')}</span>` : ''}
                        </div>
                        <div class="sales-catalog-card-actions">
                            <button type="button" class="sales-catalog-card-action-btn" onclick="event.stopPropagation(); ${selectAction}">${SalesModule.escapeHtml(viewButtonLabel)}</button>
                            <button type="button" class="sales-catalog-card-action-btn" onclick="event.stopPropagation(); SalesModule.openEditCatalogModal('${id}')">duzenle</button>
                        </div>
                    </div>
                </button>
            `;
        }).join('');
    },

    renderPipeRowsTableHtml: (rows, searchText = '', options = {}) => {
        const list = Array.isArray(rows) ? rows : [];
        const requestedSelectAction = String(options?.onSelectAction || '').trim();
        const hasCustomSelectAction = /^[A-Za-z_$][A-Za-z0-9_$.]*$/.test(requestedSelectAction);
        const viewButtonLabel = String(options?.viewButtonLabel || '').trim() || 'goruntule';
        if (!list.length) {
            return `
                <div class="sales-catalog-empty">
                    <div class="sales-catalog-empty-title">${String(searchText || '').trim() ? 'Sonuc bulunamadi' : 'Bu kategoride urun yok'}</div>
                    <div class="sales-catalog-empty-text">${String(searchText || '').trim()
                ? `"${SalesModule.escapeHtml(String(searchText || '').trim())}" ile eslesen urun yok.`
                : 'Yeni urun ekle butonuyla katalog satiri olusturabilirsiniz.'}</div>
                </div>
            `;
        }

        const activeCategoryId = String(SalesModule.state.catalogActiveCategoryId || list[0]?.categoryId || '').trim();
        const isBoru = SalesModule.isPipeCategory(activeCategoryId);
        const isCubuk = SalesModule.isRodCategory(activeCategoryId);
        const isOzel = SalesModule.isSpecialProfileCategory(activeCategoryId);

        return `
            <div class="sales-catalog-table-wrap">
                <table class="sales-catalog-table">
                    <thead>
                        <tr>
                            <th>Urun</th>
                            <th>Urun ID</th>
                            <th>Pleksi renk</th>
                            ${(isBoru || isCubuk) ? '<th>Cap</th>' : ''}
                            ${isBoru ? '<th>Kalinlik</th>' : ''}
                            <th>Boy (mm)</th>
                            ${(isCubuk || isOzel) ? '<th>Kabarcik</th>' : ''}
                            <th class="sales-catalog-table-actions-col">Islemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.map((row) => {
                const id = SalesModule.escapeHtml(String(row.id || ''));
                const bubbleText = String(row.bubble || 'yok').trim() === 'var' ? 'var' : 'yok';
                const selectAction = hasCustomSelectAction
                    ? `${requestedSelectAction}('${id}')`
                    : `SalesModule.openCatalogDetailModal('${id}')`;
                return `
                                <tr>
                                    <td>${SalesModule.escapeHtml(row.name || '-')}</td>
                                    <td>${SalesModule.escapeHtml(row.idCode || '-')}</td>
                                    <td>${SalesModule.escapeHtml(row.colors?.plexi?.color || '-')}</td>
                                    ${(isBoru || isCubuk) ? `<td>${SalesModule.escapeHtml(row.selectedDiameter || '-')}</td>` : ''}
                                    ${isBoru ? `<td>${SalesModule.escapeHtml(row.pipe?.thickness || '-')}</td>` : ''}
                                    <td>${SalesModule.escapeHtml(row.pipe?.lengthMm || '-')}</td>
                                    ${(isCubuk || isOzel) ? `<td>${SalesModule.escapeHtml(bubbleText)}</td>` : ''}
                                    <td class="sales-catalog-table-actions">
                                        <button type="button" class="sales-catalog-card-action-btn" onclick="${selectAction}">${SalesModule.escapeHtml(viewButtonLabel)}</button>
                                        <button type="button" class="sales-catalog-card-action-btn" onclick="SalesModule.openEditCatalogModal('${id}')">duzenle</button>
                                        <button type="button" class="sales-catalog-card-action-btn" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;" onclick="SalesModule.deleteCatalogProduct('${id}')">sil</button>
                                    </td>
                                </tr>
                            `;
            }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderProductsLayout: (options = {}) => {
        SalesModule.ensureCatalogState();
        const host = String(options?.host || 'sales').trim();
        const isEmbeddedInProducts = host === 'product-library';
        const backAction = isEmbeddedInProducts
            ? 'ProductLibraryModule.goWorkspaceMenu()'
            : "SalesModule.openWorkspace('menu')";
        const titleText = isEmbeddedInProducts ? 'master urun kutuphanesi / satis urun kutuphanesi' : 'satis urun kutuphanesi';
        const subtitleText = isEmbeddedInProducts
            ? 'bu ekran master tarafinda referans icin gorunur. yeni urun ekleme sadece satis modulu ekranindan yapilir.'
            : 'burada sadece satilan urunler eklenir.';
        const activeMain = SalesModule.getCatalogMainById(SalesModule.state.catalogActiveMainId || 'korkuluk');
        const activeGroup = SalesModule.getCatalogGroupById(SalesModule.state.catalogActiveMainId || '', SalesModule.state.catalogActiveGroupId || '');
        const activeLeaf = SalesModule.getCatalogLeafById(SalesModule.state.catalogActiveCategoryId || '');
        const isCatalogMain = String(activeMain?.id || '') === 'korkuluk';
        const activeCategoryId = String(SalesModule.state.catalogActiveCategoryId || '').trim();
        const isPipeLeaf = SalesModule.isPipeFamilyCategory(activeCategoryId);
        const supportsCrud = isCatalogMain || isPipeLeaf;
        const searchText = String(SalesModule.state.catalogSearchText || '');
        const pathText = SalesModule.getCatalogCategoryPathText(activeCategoryId);
        const totalCategoryCount = (supportsCrud && activeLeaf) ? SalesModule.getCatalogProductsByCategory(activeCategoryId).length : 0;
        const filteredRows = (supportsCrud && activeLeaf)
            ? SalesModule.getCatalogFilteredProductsByCategory(activeCategoryId, searchText)
            : [];
        const filteredCount = filteredRows.length;
        const createButtonHtml = (() => {
            if (!(supportsCrud && activeGroup && activeLeaf)) return '';
            if (isEmbeddedInProducts) {
                return '';
            }
            return '<button class="btn-primary" onclick="SalesModule.openCreateCatalogModal()">yeni urun ekle +</button>';
        })();
        return `
            <section class="stock-shell">
                <div class="stock-subpage-shell">
                    <div class="stock-subpage-head">
                        <div>
                            <h2 class="stock-title">${SalesModule.escapeHtml(titleText)}</h2>
                            <div style="font-size:0.84rem; color:#64748b; margin-top:0.1rem;">${SalesModule.escapeHtml(subtitleText)}</div>
                        </div>
                        <button class="btn-sm" onclick="${backAction}">geri</button>
                    </div>

                    <div class="sales-catalog-shell">
                        <aside class="sales-catalog-left">
                            <div class="sales-catalog-root">Urun gruplari</div>
                            <div class="sales-catalog-root-note">Tikladikca asagi acilan menu ile urun tipine inin.</div>
                            ${SalesModule.renderCatalogTreeHtml()}
                        </aside>

                        <section class="sales-catalog-right">
                            <div class="sales-catalog-right-head">
                                <div>
                                    <div class="sales-catalog-path">${SalesModule.escapeHtml(pathText)}</div>
                                    <div class="sales-catalog-sub">${supportsCrud
                ? `${SalesModule.escapeHtml(String(filteredCount))}${String(searchText || '').trim() ? ` sonuc / ${SalesModule.escapeHtml(String(totalCategoryCount))} kayit` : ' kayitli urun'}`
                : 'Bu alan icin urun ekleme modulu ayri gelistirilecek.'}</div>
                                    ${(supportsCrud && activeLeaf) ? `
                                        <div class="sales-catalog-search-row">
                                            <input id="sales_catalog_search_input" class="sales-catalog-search-input" value="${SalesModule.escapeHtml(searchText)}" oninput="SalesModule.setCatalogSearchText(this.value)" placeholder="isim, urun kodu, id kodu veya kayit id ara">
                                            ${String(searchText || '').trim() ? '<button class="btn-sm" type="button" onclick="SalesModule.clearCatalogSearch()">temizle</button>' : ''}
                                        </div>
                                    ` : ''}
                                </div>
                                ${createButtonHtml}
                            </div>

                            <div class="${isPipeLeaf ? 'sales-catalog-list' : 'sales-catalog-grid'}">
                                ${(supportsCrud && activeLeaf)
                ? (isPipeLeaf
                    ? SalesModule.renderPipeRowsTableHtml(filteredRows, searchText, options)
                    : SalesModule.renderCatalogCardsHtml(filteredRows, searchText, options))
                : `<div class="sales-catalog-empty">
                                        <div class="sales-catalog-empty-title">Bu sekme simdilik bos</div>
                                        <div class="sales-catalog-empty-text">"${SalesModule.escapeHtml(String(activeMain?.label || 'Bu alan'))}" icin urun ekleme menusu sonraki adimda eklenecek.</div>
                                   </div>`}
                            </div>
                        </section>
                    </div>
                </div>
            </section>
        `;
    },

    openCreateCatalogModal: () => {
        SalesModule.ensureCatalogState();
        if (!String(SalesModule.state.catalogActiveGroupId || '').trim()) {
            alert('Once bir alt grup secmelisiniz.');
            return;
        }
        const categoryId = String(SalesModule.state.catalogActiveCategoryId || '').trim();
        if (!SalesModule.getCatalogLeafById(categoryId)) {
            alert('Once bir alt kategori secmelisiniz.');
            return;
        }
        SalesModule.state.catalogEditingProductId = '';
        if (SalesModule.isPipeFamilyCategory(categoryId)) {
            SalesModule.state.catalogDraft = SalesModule.buildPipeDraft(categoryId);
            const html = SalesModule.renderPipeCatalogModalHtml();
            Modal.open('Yeni urun ekle', html, { maxWidth: '840px' });
            return;
        }
        if (String(SalesModule.state.catalogActiveMainId || '') !== 'korkuluk') {
            alert('Bu sekme icin urun ekleme formu henuz aktif degil.');
            return;
        }
        SalesModule.state.catalogDraft = SalesModule.buildCatalogDraft(categoryId);
        const html = SalesModule.renderCreateCatalogModalHtml();
        Modal.open('Yeni urun ekle', html, { maxWidth: '1220px' });
    },

    openEditCatalogModal: (productId) => {
        const id = String(productId || '').trim();
        if (!id) return;
        const row = SalesModule.getCatalogProducts().find((item) => String(item.id || '') === id);
        if (!row) return alert('Urun bulunamadi.');
        SalesModule.state.catalogEditingProductId = id;
        if (SalesModule.isPipeFamilyCategory(row.categoryId)) {
            SalesModule.state.catalogDraft = SalesModule.buildPipeDraft(row.categoryId, row);
            const html = SalesModule.renderPipeCatalogModalHtml();
            Modal.open('Urunu duzenle', html, { maxWidth: '840px' });
            return;
        }
        SalesModule.state.catalogDraft = SalesModule.buildCatalogDraft(row.categoryId, row);
        const html = SalesModule.renderCreateCatalogModalHtml();
        Modal.open('Urunu duzenle', html, { maxWidth: '1220px' });
    },

    deleteCatalogProduct: async (productId = '') => {
        const id = String(productId || SalesModule.state.catalogEditingProductId || '').trim();
        if (!id) return;
        const rows = Array.isArray(DB.data?.data?.salesCatalogProducts) ? DB.data.data.salesCatalogProducts : [];
        const idx = rows.findIndex((item) => String(item?.id || '').trim() === id);
        if (idx < 0) return alert('Silinecek urun bulunamadi.');
        if (!confirm('Bu urunu silmek istiyor musunuz?')) return;
        rows.splice(idx, 1);
        if (typeof ProductLibraryModule !== 'undefined'
            && ProductLibraryModule
            && typeof ProductLibraryModule.syncSalesCatalogProductsToMaster === 'function') {
            ProductLibraryModule.syncSalesCatalogProductsToMaster({ markDirty: false });
        }
        await DB.save();
        SalesModule.state.catalogEditingProductId = '';
        SalesModule.state.catalogDraft = null;
        Modal.close();
        UI.renderCurrentPage();
        alert('Urun silindi.');
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
                        <input id="sales_catalog_id_code" class="sales-catalog-input" value="${SalesModule.escapeHtml(draft.idCode || '')}" readonly disabled>
                    </div>
                </div>

                <div class="sales-catalog-create-grid-mid">
                    <div class="sales-catalog-field-block">
                        <div class="sales-catalog-label-row">
                            <label class="sales-catalog-label" style="margin-bottom:0;">Caplari ekle</label>
                            <button type="button" class="sales-catalog-link-btn" onclick="SalesModule.openCatalogDiameterManager()">yonet ekle/sil</button>
                        </div>
                        <div class="sales-catalog-inline">
                            <select id="sales_catalog_diameter_picker" class="sales-catalog-select">
                                ${SalesModule.renderCatalogDiameterPickerOptionsHtml(draft.diameters, '')}
                            </select>
                            <button type="button" class="sales-catalog-mini-btn" onclick="SalesModule.addCatalogDiameterFromPicker()">cap ekle +</button>
                        </div>
                        <div id="sales_catalog_diameter_box" class="sales-catalog-chip-row">
                            ${SalesModule.renderCatalogDiameterButtonsHtml(draft.diameters, draft.selectedDiameter, 'SalesModule.selectCatalogDiameter', 'SalesModule.removeCatalogDiameterFromDraft')}
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
                                    <select id="sales_catalog_${field}_color" class="sales-catalog-select" ${value.category ? '' : 'disabled'} onchange="SalesModule.setCatalogColorValue('${field}', this.value)">
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
                    ${SalesModule.state.catalogEditingProductId
                ? '<button class="btn-sm" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;" onclick="SalesModule.deleteCatalogProduct()">sil</button><button class="btn-primary" onclick="SalesModule.saveCatalogProduct()">guncelle</button>'
                : '<button class="btn-primary" onclick="SalesModule.saveCatalogProduct()">listeye ekle</button>'}
                </div>
            </div>
        `;
    },

    renderPipeCatalogModalHtml: () => {
        const categoryId = String(SalesModule.state.catalogActiveCategoryId || '');
        const draft = SalesModule.state.catalogDraft || SalesModule.buildPipeDraft(categoryId);
        const targetCategory = String(draft.categoryId || categoryId);
        const isBoru = SalesModule.isPipeCategory(targetCategory);
        const isCubuk = SalesModule.isRodCategory(targetCategory);
        const isOzel = SalesModule.isSpecialProfileCategory(targetCategory);
        const categoryText = SalesModule.getCatalogCategoryPathText(targetCategory);
        const plexiCategoryText = SalesModule.getCatalogColorCategoryOptions('plexi')
            .find((item) => item.value === 'pleksi')?.label || 'Pleksi renk';
        const isEdit = !!String(SalesModule.state.catalogEditingProductId || '').trim();
        return `
            <div class="sales-catalog-create-wrap">
                <div class="sales-catalog-modal-kicker">${SalesModule.escapeHtml(categoryText)}</div>

                <div class="sales-catalog-create-grid-top">
                    <div class="sales-catalog-field-block">
                        <label class="sales-catalog-label">Pleksi rengi</label>
                        <div class="sales-catalog-inline-select">
                            <select class="sales-catalog-select" disabled>
                                <option value="pleksi" selected>${SalesModule.escapeHtml(plexiCategoryText)}</option>
                            </select>
                            <select id="sales_catalog_pipe_plexi_color" class="sales-catalog-select" onchange="SalesModule.setCatalogColorValue('plexi', this.value)">
                                ${SalesModule.renderCatalogColorOptionsHtml('plexi', 'pleksi', draft.colors?.plexi?.color || '')}
                            </select>
                        </div>
                    </div>
                    <div class="sales-catalog-field-block">
                        <label class="sales-catalog-label">Urun ID</label>
                        <input class="sales-catalog-input" value="${SalesModule.escapeHtml(draft.idCode || '')}" readonly disabled>
                    </div>
                </div>

                <div class="sales-catalog-create-grid-mid">
                    ${(isBoru || isCubuk) ? `
                    <div class="sales-catalog-field-block">
                        <label class="sales-catalog-label">Cap (Ø)</label>
                        <input class="sales-catalog-input" value="${SalesModule.escapeHtml(draft.selectedDiameter || '')}" oninput="SalesModule.setPipeDraftField('selectedDiameter', this.value)" placeholder="or: 40">
                    </div>` : `
                    <div class="sales-catalog-field-block">
                        <label class="sales-catalog-label">Urun ismi</label>
                        <input class="sales-catalog-input" value="${SalesModule.escapeHtml(draft.name || '')}" oninput="SalesModule.setCatalogDraftField('name', this.value)" placeholder="or: Ozel profil 2040">
                    </div>`}
                    ${isBoru ? `
                    <div class="sales-catalog-field-block">
                        <label class="sales-catalog-label">Kalinlik</label>
                        <input class="sales-catalog-input" value="${SalesModule.escapeHtml(draft.pipe?.thickness || '')}" oninput="SalesModule.setPipeDraftField('thickness', this.value)" placeholder="or: 1.5">
                    </div>` : ''}
                    <div class="sales-catalog-field-block">
                        <label class="sales-catalog-label">Boy (mm)</label>
                        <input class="sales-catalog-input" value="${SalesModule.escapeHtml(draft.pipe?.lengthMm || '')}" oninput="SalesModule.setPipeDraftField('lengthMm', this.value)" placeholder="or: 600">
                    </div>
                    ${(isCubuk || isOzel) ? `
                    <div class="sales-catalog-field-block">
                        <label class="sales-catalog-label">Kabarcik</label>
                        <div id="sales_catalog_bubble_toggle" class="sales-catalog-toggle">
                            <button type="button" class="sales-catalog-toggle-btn ${draft.bubble === 'var' ? 'is-active' : ''}" onclick="SalesModule.setCatalogBubble('var')">var</button>
                            <button type="button" class="sales-catalog-toggle-btn ${draft.bubble === 'yok' ? 'is-active' : ''}" onclick="SalesModule.setCatalogBubble('yok')">yok</button>
                        </div>
                    </div>` : ''}
                </div>

                <div class="sales-catalog-modal-actions">
                    <button class="btn-sm" onclick="Modal.close()">iptal</button>
                    ${isEdit
                ? '<button class="btn-sm" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;" onclick="SalesModule.deleteCatalogProduct()">sil</button><button class="btn-primary" onclick="SalesModule.saveCatalogProduct()">guncelle</button>'
                : '<button class="btn-primary" onclick="SalesModule.saveCatalogProduct()">listeye ekle</button>'}
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

    setPipeDraftField: (field, value) => {
        const key = String(field || '').trim();
        if (!key) return;
        if (!SalesModule.state.catalogDraft || typeof SalesModule.state.catalogDraft !== 'object') return;
        if (!SalesModule.state.catalogDraft.pipe || typeof SalesModule.state.catalogDraft.pipe !== 'object') {
            SalesModule.state.catalogDraft.pipe = { thickness: '', lengthMm: '' };
        }
        const categoryId = String(SalesModule.state.catalogDraft.categoryId || '').trim();
        if (key === 'selectedDiameter') {
            const normalized = SalesModule.normalizeCatalogDiameterValue(value || '');
            SalesModule.state.catalogDraft.selectedDiameter = normalized;
            SalesModule.state.catalogDraft.diameters = normalized ? [normalized] : [];
            if (SalesModule.isPipeCategory(categoryId)) {
                if (!SalesModule.state.catalogDraft.name || SalesModule.normalize(SalesModule.state.catalogDraft.name).startsWith('boru')) {
                    SalesModule.state.catalogDraft.name = normalized ? `Boru Ø ${normalized}` : 'Boru';
                }
            } else if (SalesModule.isRodCategory(categoryId)) {
                if (!SalesModule.state.catalogDraft.name || SalesModule.normalize(SalesModule.state.catalogDraft.name).startsWith('cubuk')) {
                    SalesModule.state.catalogDraft.name = normalized ? `Cubuk Ø ${normalized}` : 'Cubuk';
                }
            }
            return;
        }
        if (key === 'thickness') {
            SalesModule.state.catalogDraft.pipe.thickness = SalesModule.normalizeCatalogDiameterValue(value || '');
            return;
        }
        if (key === 'lengthMm') {
            SalesModule.state.catalogDraft.pipe.lengthMm = SalesModule.normalizeCatalogDiameterValue(value || '');
        }
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
        const selectedCategory = SalesModule.normalizeCatalogColorType(category || '');
        SalesModule.state.catalogDraft.colors[key].category = selectedCategory;
        const nextColors = SalesModule.getCatalogColorOptions(key, selectedCategory);
        const currentColor = String(SalesModule.state.catalogDraft.colors[key].color || '').trim();
        if (!selectedCategory) {
            SalesModule.state.catalogDraft.colors[key].color = '';
        } else if (!nextColors.includes(currentColor)) {
            SalesModule.state.catalogDraft.colors[key].color = '';
        }
        const colorSelect = document.getElementById(`sales_catalog_${key}_color`);
        if (colorSelect) {
            colorSelect.innerHTML = SalesModule.renderCatalogColorOptionsHtml(
                key,
                selectedCategory,
                SalesModule.state.catalogDraft.colors[key].color
            );
            colorSelect.disabled = !selectedCategory;
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
        const value = String(colorValue || '').trim();
        const category = SalesModule.normalizeCatalogColorType(SalesModule.state.catalogDraft.colors[key].category || '');
        const allowed = SalesModule.getCatalogColorOptions(key, category);
        if (!value) {
            SalesModule.state.catalogDraft.colors[key].color = '';
            return;
        }
        SalesModule.state.catalogDraft.colors[key].color = allowed.includes(value) ? value : '';
    },

    openCatalogDiameterManager: () => {
        const html = SalesModule.renderCatalogDiameterManagerHtml();
        Modal.open('Cap yonetimi', html, { maxWidth: '560px', closeExisting: false });
    },

    renderCatalogDiameterManagerHtml: () => {
        return `
            <div class="sales-catalog-manage-wrap">
                <div class="sales-catalog-empty-text" style="text-align:left;">Yeni cap ekle, gereksiz caplari sil.</div>
                <div class="sales-catalog-inline" style="margin-top:0.4rem;">
                    <input id="sales_catalog_manage_diameter_input" class="sales-catalog-input" placeholder="or: 75" onkeydown="if(event.key==='Enter'){event.preventDefault(); SalesModule.addCatalogDiameterLibraryItem();}">
                    <button type="button" class="sales-catalog-mini-btn" onclick="SalesModule.addCatalogDiameterLibraryItem()">listeye ekle</button>
                </div>
                <div id="sales_catalog_manage_diameter_list" class="sales-catalog-manage-list">
                    ${SalesModule.renderCatalogDiameterManagerListHtml()}
                </div>
                <div class="sales-catalog-modal-actions">
                    <button class="btn-sm" onclick="Modal.close()">kapat</button>
                </div>
            </div>
        `;
    },

    refreshCatalogDiameterManagerList: () => {
        const box = document.getElementById('sales_catalog_manage_diameter_list');
        if (!box) return;
        box.innerHTML = SalesModule.renderCatalogDiameterManagerListHtml();
    },

    refreshCatalogDiameterPicker: () => {
        const draft = SalesModule.state.catalogDraft;
        const picker = document.getElementById('sales_catalog_diameter_picker');
        if (!picker) return;
        const current = SalesModule.normalizeCatalogDiameterValue(picker.value || '');
        picker.innerHTML = SalesModule.renderCatalogDiameterPickerOptionsHtml(
            draft?.diameters || [],
            current
        );
    },

    addCatalogDiameterLibraryItem: async () => {
        SalesModule.ensureCatalogDiameterLibrary();
        const input = document.getElementById('sales_catalog_manage_diameter_input');
        const value = SalesModule.normalizeCatalogDiameterValue(input?.value || '');
        if (!value) return alert('Gecerli bir cap giriniz.');
        const list = SalesModule.getCatalogDiameterLibrary();
        if (list.includes(value)) {
            if (input) input.value = '';
            return alert('Bu cap zaten listede.');
        }
        const next = [...list, value].sort((a, b) => SalesModule.compareCatalogDiameterValues(a, b));
        DB.data.meta.options.catalogDiameters = next;
        await DB.save();
        if (input) input.value = '';
        SalesModule.refreshCatalogDiameterManagerList();
        SalesModule.refreshCatalogDiameterPicker();
    },

    removeCatalogDiameterLibraryItem: async (value) => {
        SalesModule.ensureCatalogDiameterLibrary();
        const target = SalesModule.normalizeCatalogDiameterValue(value || '');
        if (!target) return;
        const prev = SalesModule.getCatalogDiameterLibrary();
        const next = prev.filter((item) => item !== target);
        if (!next.length) return alert('En az bir cap kalmali.');
        DB.data.meta.options.catalogDiameters = next;
        if (SalesModule.state.catalogDraft && Array.isArray(SalesModule.state.catalogDraft.diameters)) {
            const filteredDraft = SalesModule.state.catalogDraft.diameters
                .map((item) => SalesModule.normalizeCatalogDiameterValue(item))
                .filter((item) => item && item !== target);
            SalesModule.state.catalogDraft.diameters = filteredDraft;
            if (!filteredDraft.includes(SalesModule.state.catalogDraft.selectedDiameter || '')) {
                SalesModule.state.catalogDraft.selectedDiameter = String(filteredDraft[0] || '');
            }
            SalesModule.refreshCatalogDiameterButtons();
        }
        await DB.save();
        SalesModule.refreshCatalogDiameterManagerList();
        SalesModule.refreshCatalogDiameterPicker();
    },

    addCatalogDiameterFromPicker: () => {
        const draft = SalesModule.state.catalogDraft;
        if (!draft) return;
        const picker = document.getElementById('sales_catalog_diameter_picker');
        const value = SalesModule.normalizeCatalogDiameterValue(picker?.value || '');
        if (!value) return;
        if (!Array.isArray(draft.diameters)) draft.diameters = [];
        const set = new Set(draft.diameters.map((item) => SalesModule.normalizeCatalogDiameterValue(item)).filter(Boolean));
        set.add(value);
        draft.diameters = Array.from(set.values()).sort((a, b) => SalesModule.compareCatalogDiameterValues(a, b));
        draft.selectedDiameter = value;
        if (picker) picker.value = '';
        SalesModule.refreshCatalogDiameterButtons();
        SalesModule.refreshCatalogDiameterPicker();
    },

    removeCatalogDiameterFromDraft: (value) => {
        const draft = SalesModule.state.catalogDraft;
        if (!draft || !Array.isArray(draft.diameters)) return;
        const target = SalesModule.normalizeCatalogDiameterValue(value || '');
        if (!target) return;
        draft.diameters = draft.diameters
            .map((item) => SalesModule.normalizeCatalogDiameterValue(item))
            .filter((item) => item && item !== target);
        if (!draft.diameters.length) {
            draft.selectedDiameter = '';
        } else if (!draft.diameters.includes(SalesModule.normalizeCatalogDiameterValue(draft.selectedDiameter || ''))) {
            draft.selectedDiameter = String(draft.diameters[0] || '');
        }
        SalesModule.refreshCatalogDiameterButtons();
        SalesModule.refreshCatalogDiameterPicker();
    },

    refreshCatalogDiameterButtons: () => {
        const draft = SalesModule.state.catalogDraft;
        if (!draft) return;
        const uniqueDiameters = Array.from(new Set((Array.isArray(draft.diameters) ? draft.diameters : [])
            .map((item) => SalesModule.normalizeCatalogDiameterValue(item))
            .filter(Boolean)))
            .sort((a, b) => SalesModule.compareCatalogDiameterValues(a, b));
        draft.diameters = uniqueDiameters;
        const normalizedSelected = SalesModule.normalizeCatalogDiameterValue(draft.selectedDiameter || '');
        if (!uniqueDiameters.includes(normalizedSelected)) {
            draft.selectedDiameter = String(uniqueDiameters[0] || '');
        } else {
            draft.selectedDiameter = normalizedSelected;
        }
        const box = document.getElementById('sales_catalog_diameter_box');
        if (!box) return;
        box.innerHTML = SalesModule.renderCatalogDiameterButtonsHtml(
            draft.diameters,
            draft.selectedDiameter,
            'SalesModule.selectCatalogDiameter',
            'SalesModule.removeCatalogDiameterFromDraft'
        );
    },

    selectCatalogDiameter: (value) => {
        if (!SalesModule.state.catalogDraft) return;
        SalesModule.state.catalogDraft.selectedDiameter = SalesModule.normalizeCatalogDiameterValue(String(value || '').trim());
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

        const isBoru = SalesModule.isPipeCategory(categoryId);
        const isCubuk = SalesModule.isRodCategory(categoryId);
        const isOzel = SalesModule.isSpecialProfileCategory(categoryId);
        const isPipeFamily = SalesModule.isPipeFamilyCategory(categoryId);

        const normalizedDiameter = SalesModule.normalizeCatalogDiameterValue(draft.selectedDiameter || '');
        const normalizedThickness = SalesModule.normalizeCatalogDiameterValue(draft.pipe?.thickness || '');
        const normalizedLength = SalesModule.normalizeCatalogDiameterValue(draft.pipe?.lengthMm || '');

        if ((isBoru || isCubuk) && !normalizedDiameter) {
            return alert('Gecerli bir cap giriniz.');
        }

        let name = String(draft.name || '').trim();
        if (isBoru && !name) name = normalizedDiameter ? `Boru Ø ${normalizedDiameter}` : 'Boru';
        if (isCubuk && !name) name = normalizedDiameter ? `Cubuk Ø ${normalizedDiameter}` : 'Cubuk';

        if (isOzel && !name) {
            return alert('Ozel profiller icin urun ismi zorunlu.');
        }

        if (!isPipeFamily && !name) {
            return alert('Urun adi zorunlu.');
        }

        const diameters = Array.isArray(draft.diameters)
            ? draft.diameters.map((v) => SalesModule.normalizeCatalogDiameterValue(v)).filter(Boolean)
            : [];

        if (!isPipeFamily && !diameters.length) {
            return alert('En az bir cap eklemelisiniz.');
        }

        const selectedDiameterRaw = SalesModule.normalizeCatalogDiameterValue(draft.selectedDiameter || '');
        const selectedDiameter = diameters.includes(selectedDiameterRaw) ? selectedDiameterRaw : String(diameters[0] || '');

        const editingId = String(SalesModule.state.catalogEditingProductId || '').trim();
        const existingIdx = editingId
            ? DB.data.data.salesCatalogProducts.findIndex((item) => String(item?.id || '').trim() === editingId)
            : -1;
        const existingRow = existingIdx >= 0 ? (DB.data.data.salesCatalogProducts[existingIdx] || {}) : {};
        const nowIso = new Date().toISOString();
        const normalizeIdCode = (value) => {
            if (typeof IdentityPolicy !== 'undefined'
                && IdentityPolicy
                && typeof IdentityPolicy.normalizeCode === 'function') {
                return IdentityPolicy.normalizeCode(value);
            }
            return String(value || '').trim().replace(/\s+/g, '-').toUpperCase();
        };
        const resolvedIdCode = String(draft.idCode || '').trim()
            || String(existingRow.idCode || '').trim()
            || SalesModule.generateCatalogPublicId({ rowId: editingId });
        let normalizedIdCode = normalizeIdCode(resolvedIdCode);
        if (!normalizedIdCode) {
            return alert('Urun ID zorunlu.');
        }

        const isIdCodeTaken = (candidateCode) => ((typeof IdentityPolicy !== 'undefined'
            && IdentityPolicy
            && typeof IdentityPolicy.isGlobalCodeTaken === 'function')
            ? IdentityPolicy.isGlobalCodeTaken(DB.data, candidateCode, editingId ? { collection: 'salesCatalogProducts', id: editingId, field: 'idCode' } : null)
            : DB.data.data.salesCatalogProducts.some((item) => {
                const rowId = String(item?.id || '').trim();
                const rowIdCode = String(item?.idCode || '').trim().replace(/\s+/g, '-').toUpperCase();
                if (!rowIdCode) return false;
                if (editingId && rowId === editingId) return false;
                return rowIdCode === candidateCode;
            }));

        if (isIdCodeTaken(normalizedIdCode)) {
            if (editingId) return alert(`Bu Urun ID zaten kullaniliyor: ${normalizedIdCode}`);
            let regenerated = '';
            for (let i = 0; i < 5; i += 1) {
                const nextCode = normalizeIdCode(SalesModule.generateCatalogPublicId());
                if (!nextCode || isIdCodeTaken(nextCode)) continue;
                regenerated = nextCode;
                break;
            }
            if (!regenerated) return alert('Urun ID benzersiz olusturulamadi. Lutfen tekrar deneyiniz.');
            normalizedIdCode = regenerated;
            if (SalesModule.state.catalogDraft && typeof SalesModule.state.catalogDraft === 'object') {
                SalesModule.state.catalogDraft.idCode = normalizedIdCode;
            }
        }
        const row = {
            id: SalesModule.generateCatalogRowId(),
            categoryId,
            name,
            productCode: String(draft.productCode || '').trim(),
            idCode: normalizedIdCode,
            diameters: isPipeFamily
                ? ((isBoru || isCubuk) && normalizedDiameter ? [normalizedDiameter] : [])
                : diameters,
            selectedDiameter: isPipeFamily
                ? ((isBoru || isCubuk) ? normalizedDiameter : '')
                : selectedDiameter,
            bubble: isPipeFamily
                ? (isBoru ? 'yok' : (String(draft.bubble || 'yok').trim() === 'var' ? 'var' : 'yok'))
                : (String(draft.bubble || 'yok').trim() === 'var' ? 'var' : 'yok'),
            lowerTubeLength: String(draft.lowerTubeLength || 'standart').trim() || 'standart',
            pipe: {
                thickness: isBoru ? normalizedThickness : '',
                lengthMm: normalizedLength
            },
            note: String(draft.note || '').trim(),
            colors: {
                accessory: {
                    category: SalesModule.normalizeCatalogColorType(draft.colors?.accessory?.category || ''),
                    color: String(draft.colors?.accessory?.color || '').trim()
                },
                tube: {
                    category: SalesModule.normalizeCatalogColorType(draft.colors?.tube?.category || ''),
                    color: String(draft.colors?.tube?.color || '').trim()
                },
                plexi: {
                    category: SalesModule.normalizeCatalogColorType(draft.colors?.plexi?.category || ''),
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

        if (editingId) {
            if (existingIdx >= 0) {
                const prev = existingRow;
                row.id = editingId;
                row.created_at = String(prev.created_at || nowIso);
                DB.data.data.salesCatalogProducts[existingIdx] = row;
            } else {
                DB.data.data.salesCatalogProducts.push(row);
            }
        } else {
            DB.data.data.salesCatalogProducts.push(row);
        }
        if (typeof ProductLibraryModule !== 'undefined'
            && ProductLibraryModule
            && typeof ProductLibraryModule.syncSalesCatalogProductsToMaster === 'function') {
            ProductLibraryModule.syncSalesCatalogProductsToMaster({ markDirty: false });
        }
        await DB.save();
        Modal.close();
        SalesModule.state.catalogEditingProductId = '';
        SalesModule.state.catalogDraft = null;
        UI.renderCurrentPage();
        alert(editingId ? 'Urun guncellendi.' : 'Urun karti kataloga eklendi.');
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
        if (SalesModule.isPipeFamilyCategory(row.categoryId)) {
            const isBoru = SalesModule.isPipeCategory(row.categoryId);
            const isCubuk = SalesModule.isRodCategory(row.categoryId);
            const isOzel = SalesModule.isSpecialProfileCategory(row.categoryId);
            return `
                <div class="sales-catalog-detail-wrap">
                    <div class="sales-catalog-modal-kicker">${SalesModule.escapeHtml(pathText)}</div>
                    <div class="sales-catalog-detail-fields">
                        ${SalesModule.renderCatalogDetailColorField('Pleksi rengi', 'plexi', row.colors?.plexi || {})}
                        <div class="sales-catalog-field-block">
                            <label class="sales-catalog-label">Urun ID</label>
                            <input class="sales-catalog-input" value="${SalesModule.escapeHtml(row.idCode || '-')}" readonly>
                        </div>
                        ${(isBoru || isCubuk) ? `
                        <div class="sales-catalog-field-block">
                            <label class="sales-catalog-label">Cap (Ø)</label>
                            <input class="sales-catalog-input" value="${SalesModule.escapeHtml(row.selectedDiameter || '-')}" readonly>
                        </div>` : ''}
                        ${isBoru ? `
                        <div class="sales-catalog-field-block">
                            <label class="sales-catalog-label">Kalinlik</label>
                            <input class="sales-catalog-input" value="${SalesModule.escapeHtml(row.pipe?.thickness || '-')}" readonly>
                        </div>` : ''}
                        <div class="sales-catalog-field-block">
                            <label class="sales-catalog-label">Boy (mm)</label>
                            <input class="sales-catalog-input" value="${SalesModule.escapeHtml(row.pipe?.lengthMm || '-')}" readonly>
                        </div>
                        ${(isCubuk || isOzel) ? `
                        <div class="sales-catalog-field-block">
                            <label class="sales-catalog-label">Kabarcik</label>
                            <div class="sales-catalog-toggle is-disabled">
                                <button type="button" class="sales-catalog-toggle-btn ${row.bubble === 'var' ? 'is-active' : ''}" disabled>var</button>
                                <button type="button" class="sales-catalog-toggle-btn ${row.bubble === 'yok' ? 'is-active' : ''}" disabled>yok</button>
                            </div>
                        </div>` : ''}
                        ${isOzel ? `
                        <div class="sales-catalog-field-block">
                            <label class="sales-catalog-label">Urun ismi</label>
                            <input class="sales-catalog-input" value="${SalesModule.escapeHtml(row.name || '-')}" readonly>
                        </div>` : ''}
                        <div>
                            <label class="sales-catalog-label">Not</label>
                            <textarea class="sales-catalog-textarea" readonly>${SalesModule.escapeHtml(row.note || '')}</textarea>
                        </div>
                    </div>
                    <div class="sales-catalog-modal-actions">
                        <button class="btn-sm" onclick="Modal.close()">kapat</button>
                        <button class="btn-primary" onclick="Modal.close(); SalesModule.openEditCatalogModal('${SalesModule.escapeHtml(String(row.id || ''))}')">duzenle</button>
                    </div>
                </div>
            `;
        }
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
                        <div class="stock-hub-label">Satis Urun Kutuphanesi</div>
                    </button>
                </div>
            </div>
        </section>
    `,

    renderCustomerInlineEditFormHtml: (draft = {}) => `
        ${SalesModule.renderCountryDatalistHtml('sales_customer_country_options_detail')}
        <div style="display:flex; flex-direction:column; gap:0.7rem;">
            <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.6rem;">
                <div style="font-size:0.78rem; font-weight:800; color:#334155; margin-bottom:0.45rem;">Kimlik ve Iletisim</div>
                <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.6rem;">
                    <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Musteri adi *</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.name || ''))}" oninput="SalesModule.setCustomerEditDraftField('name', this.value)"></div>
                    <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Yetkili kisi</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.authorizedPerson || ''))}" oninput="SalesModule.setCustomerEditDraftField('authorizedPerson', this.value)"></div>
                    <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">E-posta</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.email || ''))}" oninput="SalesModule.setCustomerEditDraftField('email', this.value)"></div>
                    <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Sabit tel</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.phone || ''))}" oninput="SalesModule.setCustomerEditDraftField('phone', this.value)"></div>
                    <div><label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.18rem;">GSM tel</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.phoneAlt || ''))}" oninput="SalesModule.setCustomerEditDraftField('phoneAlt', this.value)"></div>
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.18rem;">Tel ulke / bolge kodu</label>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.35rem;">
                            <input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.phoneCountryCode || ''))}" placeholder="ulke: 90" oninput="SalesModule.setCustomerEditDraftField('phoneCountryCode', this.value)">
                            <input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.phoneAreaCode || ''))}" placeholder="bolge: 312" oninput="SalesModule.setCustomerEditDraftField('phoneAreaCode', this.value)">
                        </div>
                    </div>
                    <div style="grid-column:span 3;">
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">Musteri tipi</label>
                        ${SalesModule.renderCustomerTypePickerHtml(draft?.customerTypes || [], { inputName: 'sales_customer_types_detail', onchange: 'SalesModule.toggleCustomerEditType(this.value,this.checked)' })}
                    </div>
                </div>
            </div>

            <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.6rem;">
                <div style="font-size:0.78rem; font-weight:800; color:#334155; margin-bottom:0.45rem;">Adres ve Konum</div>
                <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.6rem;">
                    <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Ulke</label><input list="sales_customer_country_options_detail" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.country || ''))}" placeholder="yazmaya basla: Moldova" oninput="SalesModule.setCustomerEditDraftField('country', this.value)"></div>
                    <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Sehir</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.city || ''))}" oninput="SalesModule.setCustomerEditDraftField('city', this.value)"></div>
                    <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Ilce</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.district || ''))}" oninput="SalesModule.setCustomerEditDraftField('district', this.value)"></div>
                    <div><label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.18rem;">Posta kodu</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.postalCode || ''))}" oninput="SalesModule.setCustomerEditDraftField('postalCode', this.value)"></div>
                    <div><label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.18rem;">Adres no</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.addressNo || ''))}" oninput="SalesModule.setCustomerEditDraftField('addressNo', this.value)"></div>
                    <div><label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.18rem;">Cari kodu</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.externalCode || ''))}" oninput="SalesModule.setCustomerEditDraftField('externalCode', this.value)"></div>
                    <div style="grid-column:span 3;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Adres</label><textarea class="stock-textarea" style="min-height:66px;" oninput="SalesModule.setCustomerEditDraftField('address', this.value)">${SalesModule.escapeHtml(String(draft?.address || ''))}</textarea></div>
                </div>
            </div>

            <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.6rem;">
                <div style="font-size:0.78rem; font-weight:800; color:#334155; margin-bottom:0.45rem;">Ticari ve Resmi Bilgiler</div>
                <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.6rem;">
                    <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Vergi dairesi</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.taxOffice || ''))}" oninput="SalesModule.setCustomerEditDraftField('taxOffice', this.value)"></div>
                    <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Vergi no</label><input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.taxNo || ''))}" oninput="SalesModule.setCustomerEditDraftField('taxNo', this.value)"></div>
                    <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Genel iskonto (%)</label><input class="stock-input stock-input-tall" type="number" min="0" max="100" step="0.01" value="${SalesModule.escapeHtml(String(draft?.discountRate || 0))}" onchange="SalesModule.setCustomerEditDraftField('discountRate', this.value)"></div>
                    <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Odeme vadesi (gun)</label><input class="stock-input stock-input-tall" type="number" min="0" step="1" value="${SalesModule.escapeHtml(String(draft?.paymentTermDays || 0))}" onchange="SalesModule.setCustomerEditDraftField('paymentTermDays', this.value)"></div>
                    <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Risk limiti</label><input class="stock-input stock-input-tall" type="number" min="0" step="0.01" value="${SalesModule.escapeHtml(String(draft?.riskLimit || 0))}" onchange="SalesModule.setCustomerEditDraftField('riskLimit', this.value)"></div>
                    <div style="grid-column:span 3;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Not</label><textarea class="stock-textarea" style="min-height:66px;" oninput="SalesModule.setCustomerEditDraftField('note', this.value)">${SalesModule.escapeHtml(String(draft?.note || ''))}</textarea></div>
                </div>
            </div>
        </div>
    `,

    renderCustomerSummaryHtml: (row = {}) => {
        const customerTypes = SalesModule.normalizeCustomerTypeList(row?.customerTypes || []);
        const typeHtml = customerTypes.length
            ? customerTypes.map((type) => `<span style="display:inline-flex; align-items:center; padding:0.18rem 0.55rem; border:1px solid #bfdbfe; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-size:0.72rem; font-weight:800;">${SalesModule.escapeHtml(type)}</span>`).join(' ')
            : '-';
        return `
            <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.6rem;">
                <div><div style="font-size:0.73rem; color:#64748b;">Sehir / Ilce</div><div style="font-weight:700; color:#334155;">${SalesModule.escapeHtml([row?.city, row?.district].filter(Boolean).join(' / ') || '-')}</div></div>
                <div><div style="font-size:0.73rem; color:#64748b;">Telefon</div><div style="font-weight:700; color:#334155;">${SalesModule.escapeHtml(String(row?.phone || '-'))}</div></div>
                <div><div style="font-size:0.73rem; color:#64748b;">GSM</div><div style="font-weight:700; color:#334155;">${SalesModule.escapeHtml(String(row?.phoneAlt || '-'))}</div></div>
                <div><div style="font-size:0.73rem; color:#64748b;">E-posta</div><div style="font-weight:700; color:#334155;">${SalesModule.escapeHtml(String(row?.email || '-'))}</div></div>
                <div><div style="font-size:0.73rem; color:#64748b;">Yetkili kisi</div><div style="font-weight:700; color:#334155;">${SalesModule.escapeHtml(String(row?.authorizedPerson || '-'))}</div></div>
                <div><div style="font-size:0.73rem; color:#64748b;">Vergi dairesi / no</div><div style="font-weight:700; color:#334155;">${SalesModule.escapeHtml(([row?.taxOffice, row?.taxNo].filter(Boolean).join(' / ')) || '-')}</div></div>
                <div><div style="font-size:0.73rem; color:#64748b;">Genel iskonto</div><div style="font-weight:700; color:#334155;">% ${SalesModule.escapeHtml(String(row?.discountRate || 0))}</div></div>
                <div><div style="font-size:0.73rem; color:#64748b;">Odeme vadesi / risk</div><div style="font-weight:700; color:#334155;">${SalesModule.escapeHtml(String(row?.paymentTermDays || 0))} gun / ${SalesModule.escapeHtml(String(row?.riskLimit || 0))}</div></div>
                <div><div style="font-size:0.73rem; color:#64748b;">Musteri tipi</div><div style="display:flex; gap:0.35rem; flex-wrap:wrap;">${typeHtml}</div></div>
                <div><div style="font-size:0.73rem; color:#64748b;">Cari kodu</div><div style="font-weight:700; color:#334155;">${SalesModule.escapeHtml(String(row?.externalCode || '-'))}</div></div>
                <div><div style="font-size:0.73rem; color:#64748b;">Ulke</div><div style="font-weight:700; color:#334155;">${SalesModule.escapeHtml(String(row?.country || '-'))}</div></div>
                <div><div style="font-size:0.73rem; color:#64748b;">Posta kodu / Adres no</div><div style="font-weight:700; color:#334155;">${SalesModule.escapeHtml(([row?.postalCode, row?.addressNo].filter(Boolean).join(' / ')) || '-')}</div></div>
                <div style="grid-column:span 4;"><div style="font-size:0.73rem; color:#64748b;">Adres</div><div style="font-weight:700; color:#334155; white-space:pre-wrap;">${SalesModule.escapeHtml(String(row?.address || '-'))}</div></div>
                <div style="grid-column:span 4;"><div style="font-size:0.73rem; color:#64748b;">Not</div><div style="font-weight:700; color:#334155; white-space:pre-wrap;">${SalesModule.escapeHtml(String(row?.note || '-'))}</div></div>
            </div>
        `;
    },

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

                        ${isEdit
                ? SalesModule.renderCustomerInlineEditFormHtml(draft)
                : SalesModule.renderCustomerSummaryHtml(row)}
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
                            <div style="display:flex; gap:0.45rem; align-items:center; flex-wrap:wrap;">
                                <input id="sales_customer_excel_import_input" type="file" accept=".xls,.xlsx" style="display:none;" onchange="SalesModule.handleCustomerExcelImportInput(this)">
                                <button class="btn-sm" onclick="SalesModule.openCustomerExcelImportPicker()">excelden ice aktar</button>
                                <button class="btn-primary" onclick="SalesModule.openCreateCustomerModal()">yeni musteri ekle +</button>
                            </div>
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
                                                            <button class="btn-sm" data-skip-delete-confirm="true" onclick="SalesModule.deleteCustomer('${rowId}')" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;">sil</button>
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


