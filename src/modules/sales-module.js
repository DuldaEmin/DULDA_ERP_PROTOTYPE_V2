const SalesModule = {
    state: {
        workspaceView: 'menu',
        customerFilters: {
            name: '',
            city: '',
            status: 'ALL',
            editor: 'ALL'
        },
        customerContactRowsDraft: [],
        customerContactModal: null,
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
        catalogDraft: null,
        salesOrderDraft: null,
        salesOrderHistoryFilters: {
            query: '',
            status: 'ALL',
            period: 'ALL'
        },
        salesWorkspaceTab: 'ORDERS',
        salesOrderEditorModalOpen: false,
        salesPendingFocusLineId: '',
        salesOrderLinePicker: null,
        salesOrderLineLibraryPickerPending: false,
        salesOrderLineLibraryPickerContext: null,
        salesPaymentMethodDraft: '',
        priceListDraft: null,
        priceListLineDraft: {
            productId: '',
            unitPrice: '',
            minQty: '1',
            note: ''
        },
        priceListEditingId: '',
        priceListActiveId: '',
        priceListExpandedProducts: {},
        proformaSettingsDraft: null,
        proformaBankDraft: {
            bankName: '',
            branchCode: '',
            accountNo: '',
            iban: ''
        },
        proformaSettingsSnapshot: ''
    },

    escapeHtml: (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;'),

    normalize: (value) => String(value || '').trim().toLocaleLowerCase('tr-TR'),

    normalizeSearchText: (value) => {
        const normalized = (window.MojibakeFix && typeof window.MojibakeFix.normalize === 'function')
            ? window.MojibakeFix.normalize(String(value || ''))
            : String(value || '');
        const lowered = normalized.toLocaleLowerCase('tr-TR');
        const folded = lowered
            .replace(/[ıİ]/g, 'i')
            .replace(/[şŞ]/g, 's')
            .replace(/[ğĞ]/g, 'g')
            .replace(/[üÜ]/g, 'u')
            .replace(/[öÖ]/g, 'o')
            .replace(/[çÇ]/g, 'c');
        return folded
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    },

    buildCustomerSearchIndex: (row = {}) => {
        const contacts = Array.isArray(row?.customerContacts)
            ? row.customerContacts
            : (Array.isArray(row?.contacts) ? row.contacts : []);
        const contactText = contacts
            .map((contact) => {
                const phones = Array.isArray(contact?.phones)
                    ? contact.phones.join(' ')
                    : `${contact?.phone || ''} ${contact?.mobile || ''}`;
                return [
                    contact?.name,
                    contact?.position,
                    phones,
                    contact?.email,
                    contact?.note
                ].filter(Boolean).join(' ');
            })
            .join(' ');
        const typeText = Array.isArray(row?.customerTypes) ? row.customerTypes.join(' ') : '';
        const tagText = Array.isArray(row?.tags) ? row.tags.join(' ') : '';
        const bag = [
            row?.name,
            row?.customerCode,
            row?.externalCode,
            row?.taxNo,
            row?.taxOffice,
            row?.country,
            row?.city,
            row?.district,
            row?.address,
            row?.postalCode,
            row?.addressNo,
            row?.authorizedPerson,
            row?.phone,
            row?.phoneAlt,
            row?.email,
            row?.note,
            typeText,
            tagText,
            contactText
        ].filter(Boolean).join(' ');
        return SalesModule.normalizeSearchText(bag);
    },

    ensureData: () => {
        if (!DB.data || typeof DB.data !== 'object') DB.data = {};
        if (!DB.data.data || typeof DB.data.data !== 'object') DB.data.data = {};
        if (!Array.isArray(DB.data.data.customers)) DB.data.data.customers = [];
        if (!Array.isArray(DB.data.data.orders)) DB.data.data.orders = [];
        if (!Array.isArray(DB.data.data.personnel)) DB.data.data.personnel = [];
        if (!Array.isArray(DB.data.data.salesCatalogProducts)) DB.data.data.salesCatalogProducts = [];
        SalesModule.ensureCatalogPublicIds();
        SalesModule.ensureSettingsData();
    },

    normalizeSalesPaymentMethod: (value) => String(value || '')
        .replace(/\s+/g, ' ')
        .trim(),

    buildDefaultSalesPaymentMethods: () => ([
        'Nakit',
        'Havale',
        'EFT'
    ]),

    normalizeSalesPaymentMethods: (rows = []) => {
        const source = Array.isArray(rows) ? rows : [];
        const normalized = source
            .map((row) => SalesModule.normalizeSalesPaymentMethod(row))
            .filter(Boolean);
        const merged = [];
        const seen = new Set();
        [...SalesModule.buildDefaultSalesPaymentMethods(), ...normalized].forEach((item) => {
            const key = SalesModule.normalizeSearchText(item);
            if (!key || seen.has(key)) return;
            seen.add(key);
            merged.push(item);
        });
        return merged;
    },

    buildDefaultProformaSettings: () => ({
        logoDataUrl: '',
        logoFileName: '',
        bankAccounts: [],
        defaultNotes: ''
    }),

    normalizeProformaBankAccount: (row = {}) => {
        const source = row && typeof row === 'object' ? row : {};
        return {
            id: String(source.id || crypto.randomUUID()).trim(),
            bankName: String(source.bankName || source.name || '').trim(),
            branchCode: String(source.branchCode || source.branch || '').trim(),
            accountNo: String(source.accountNo || source.account || '').trim(),
            iban: String(source.iban || '').replace(/\s+/g, ' ').trim()
        };
    },

    normalizeProformaSettings: (value = {}) => {
        const source = value && typeof value === 'object' ? value : {};
        const bankAccounts = (Array.isArray(source.bankAccounts) ? source.bankAccounts : [])
            .map((row) => SalesModule.normalizeProformaBankAccount(row))
            .filter((row) => row.bankName || row.branchCode || row.accountNo || row.iban);
        return {
            logoDataUrl: String(source.logoDataUrl || '').trim(),
            logoFileName: String(source.logoFileName || '').trim(),
            bankAccounts,
            defaultNotes: String(source.defaultNotes || '').trim()
        };
    },

    serializeProformaSettings: (value = {}) => {
        const normalized = SalesModule.normalizeProformaSettings(value);
        const serializable = {
            logoDataUrl: normalized.logoDataUrl,
            logoFileName: normalized.logoFileName,
            defaultNotes: normalized.defaultNotes,
            bankAccounts: normalized.bankAccounts.map((row) => ({
                bankName: row.bankName,
                branchCode: row.branchCode,
                accountNo: row.accountNo,
                iban: row.iban
            }))
        };
        return JSON.stringify(serializable);
    },

    ensureSettingsData: () => {
        if (!DB.data || typeof DB.data !== 'object') DB.data = {};
        if (!DB.data.data || typeof DB.data.data !== 'object') DB.data.data = {};
        if (!DB.data.data.salesSettings || typeof DB.data.data.salesSettings !== 'object' || Array.isArray(DB.data.data.salesSettings)) {
            DB.data.data.salesSettings = {};
        }
        const defaults = SalesModule.buildDefaultProformaSettings();
        const normalized = SalesModule.normalizeProformaSettings(DB.data.data.salesSettings.proforma || {});
        DB.data.data.salesSettings.proforma = {
            ...defaults,
            ...normalized
        };
        if (!Array.isArray(DB.data.data.salesSettings.priceLists)) DB.data.data.salesSettings.priceLists = [];
        DB.data.data.salesSettings.priceLists = DB.data.data.salesSettings.priceLists
            .map((row) => SalesModule.normalizePriceList(row))
            .filter((row) => row.name);
        DB.data.data.salesSettings.paymentMethods = SalesModule.normalizeSalesPaymentMethods(DB.data.data.salesSettings.paymentMethods);
    },

    getSalesPaymentMethods: () => {
        SalesModule.ensureSettingsData();
        const rows = Array.isArray(DB.data?.data?.salesSettings?.paymentMethods)
            ? DB.data.data.salesSettings.paymentMethods
            : [];
        return SalesModule.normalizeSalesPaymentMethods(rows);
    },

    getSalesPaymentMethodSuggestions: (draft = null) => {
        SalesModule.ensureData();
        const source = draft && typeof draft === 'object' ? draft : (SalesModule.state.salesOrderDraft || {});
        const bag = [
            ...SalesModule.getSalesPaymentMethods(),
            String(source?.paymentMethod || '').trim()
        ];
        if (source?.customerId) {
            const customer = SalesModule.getCustomerById(source.customerId);
            bag.push(String(customer?.defaultPaymentMethod || '').trim());
        }
        const orders = Array.isArray(DB.data?.data?.orders) ? DB.data.data.orders : [];
        orders.slice(-50).forEach((row) => bag.push(String(row?.paymentMethod || '').trim()));
        return SalesModule.normalizeSalesPaymentMethods(bag);
    },

    upsertSalesPaymentMethod: (value) => {
        const normalized = SalesModule.normalizeSalesPaymentMethod(value);
        if (!normalized) return false;
        SalesModule.ensureSettingsData();
        const store = Array.isArray(DB.data?.data?.salesSettings?.paymentMethods)
            ? DB.data.data.salesSettings.paymentMethods
            : [];
        const key = SalesModule.normalizeSearchText(normalized);
        const exists = store.some((row) => SalesModule.normalizeSearchText(row) === key);
        if (exists) return false;
        store.push(normalized);
        DB.data.data.salesSettings.paymentMethods = SalesModule.normalizeSalesPaymentMethods(store);
        if (typeof DB.markDirty === 'function') DB.markDirty();
        return true;
    },

    getProformaSettings: () => {
        SalesModule.ensureSettingsData();
        return SalesModule.normalizeProformaSettings(DB.data?.data?.salesSettings?.proforma || {});
    },

    buildProformaSettingsDraft: (value = {}) => {
        const normalized = SalesModule.normalizeProformaSettings(value);
        return {
            logoDataUrl: normalized.logoDataUrl,
            logoFileName: normalized.logoFileName,
            bankAccounts: normalized.bankAccounts.map((row) => ({ ...row })),
            defaultNotes: normalized.defaultNotes
        };
    },

    buildDefaultPriceList: () => ({
        id: '',
        name: '',
        scope: 'global', // global | customer
        customerId: '',
        currency: 'USD',
        isActive: true,
        startDate: '',
        endDate: '',
        lines: [],
        createdAt: '',
        updatedAt: ''
    }),

    normalizePriceListVariantPrice: (row = {}) => {
        const source = row && typeof row === 'object' ? row : {};
        const unitPrice = Number(String(source.unitPrice ?? '').replace(',', '.'));
        return {
            id: String(source.id || crypto.randomUUID()).trim(),
            variationId: String(source.variationId || source.variantId || '').trim(),
            variantCode: String(source.variantCode || source.code || '').trim().toUpperCase(),
            unitPrice: Number.isFinite(unitPrice) ? Math.max(0, Number(unitPrice.toFixed(2))) : 0,
            isOverride: source.isOverride === true,
            needsUpdate: source.needsUpdate === true,
            updatedAt: String(source.updatedAt || source.updated_at || '').trim()
        };
    },

    normalizePriceListLine: (row = {}) => {
        const source = row && typeof row === 'object' ? row : {};
        const unitPrice = Number(String(source.unitPrice ?? '').replace(',', '.'));
        const minQtyRaw = Number(String(source.minQty ?? '1').replace(',', '.'));
        const variantPrices = (Array.isArray(source.variantPrices) ? source.variantPrices : [])
            .map((item) => SalesModule.normalizePriceListVariantPrice(item))
            .filter((item) => item.variationId || item.variantCode);
        return {
            id: String(source.id || crypto.randomUUID()).trim(),
            productId: String(source.productId || '').trim(),
            categoryId: String(source.categoryId || '').trim(),
            unitPrice: Number.isFinite(unitPrice) ? Math.max(0, Number(unitPrice.toFixed(2))) : 0,
            minQty: Number.isFinite(minQtyRaw) ? Math.max(1, Math.floor(minQtyRaw)) : 1,
            note: String(source.note || '').trim(),
            variantPrices,
            updatedAt: String(source.updatedAt || source.updated_at || '').trim()
        };
    },

    normalizePriceList: (row = {}) => {
        const source = row && typeof row === 'object' ? row : {};
        const lines = (Array.isArray(source.lines) ? source.lines : [])
            .map((line) => SalesModule.normalizePriceListLine(line))
            .filter((line) => line.productId);
        return {
            id: String(source.id || crypto.randomUUID()).trim(),
            name: String(source.name || '').trim(),
            scope: String(source.scope || 'global').trim() === 'customer' ? 'customer' : 'global',
            customerId: String(source.customerId || '').trim(),
            currency: ['USD', 'TL', 'EUR'].includes(String(source.currency || '').trim().toUpperCase())
                ? String(source.currency || '').trim().toUpperCase()
                : 'USD',
            isActive: source.isActive !== false,
            startDate: String(source.startDate || '').trim(),
            endDate: String(source.endDate || '').trim(),
            lines,
            createdAt: String(source.createdAt || source.created_at || '').trim(),
            updatedAt: String(source.updatedAt || source.updated_at || '').trim()
        };
    },

    getPriceLists: () => {
        SalesModule.ensureSettingsData();
        const rows = Array.isArray(DB.data?.data?.salesSettings?.priceLists)
            ? DB.data.data.salesSettings.priceLists
            : [];
        return rows
            .map((row) => SalesModule.normalizePriceList(row))
            .filter((row) => row.name);
    },

    getMutablePriceListStore: () => {
        SalesModule.ensureSettingsData();
        if (!Array.isArray(DB.data?.data?.salesSettings?.priceLists)) DB.data.data.salesSettings.priceLists = [];
        DB.data.data.salesSettings.priceLists = DB.data.data.salesSettings.priceLists
            .map((row) => SalesModule.normalizePriceList(row))
            .filter((row) => row.name);
        return DB.data.data.salesSettings.priceLists;
    },

    ensurePriceListActiveSelection: () => {
        const store = SalesModule.getMutablePriceListStore();
        let changed = false;
        if (!store.length) {
            const now = new Date().toISOString();
            store.push(SalesModule.normalizePriceList({
                id: crypto.randomUUID(),
                name: 'Genel Liste',
                scope: 'global',
                customerId: '',
                currency: 'USD',
                isActive: true,
                startDate: new Date().toISOString().slice(0, 10),
                endDate: '',
                lines: [],
                createdAt: now,
                updatedAt: now
            }));
            changed = true;
        }

        const preferredId = String(SalesModule.state.priceListActiveId || '').trim();
        const preferred = preferredId
            ? store.find((row) => String(row?.id || '') === preferredId)
            : null;
        const currentlyActive = store.find((row) => row.isActive !== false) || null;
        const target = preferred || currentlyActive || store[0];
        const targetId = String(target?.id || '').trim();

        store.forEach((row) => {
            const nextActive = String(row?.id || '').trim() === targetId;
            if (!!row.isActive !== nextActive) {
                row.isActive = nextActive;
                changed = true;
            }
        });
        if (String(SalesModule.state.priceListActiveId || '').trim() !== targetId) {
            SalesModule.state.priceListActiveId = targetId;
        }
        if (changed && typeof DB.markDirty === 'function') DB.markDirty();
        return targetId;
    },

    getActivePriceList: () => {
        const activeId = SalesModule.ensurePriceListActiveSelection();
        const store = SalesModule.getMutablePriceListStore();
        return store.find((row) => String(row?.id || '') === String(activeId || '')) || null;
    },

    setActivePriceList: (id) => {
        const targetId = String(id || '').trim();
        if (!targetId) return;
        const store = SalesModule.getMutablePriceListStore();
        let found = false;
        store.forEach((row) => {
            const nextActive = String(row?.id || '').trim() === targetId;
            if (nextActive) found = true;
            row.isActive = nextActive;
        });
        if (!found) return;
        SalesModule.state.priceListActiveId = targetId;
        if (typeof DB.markDirty === 'function') DB.markDirty();
        UI.renderCurrentPage();
    },

    createQuickPriceList: () => {
        SalesModule.ensureSettingsData();
        const raw = prompt('Yeni fiyat listesi adi');
        const name = String(raw || '').trim();
        if (!name) return;
        const store = SalesModule.getMutablePriceListStore();
        if (store.some((row) => SalesModule.normalize(String(row?.name || '')) === SalesModule.normalize(name))) {
            alert('Bu isimde fiyat listesi zaten var.');
            return;
        }
        const now = new Date().toISOString();
        const row = SalesModule.normalizePriceList({
            id: crypto.randomUUID(),
            name,
            scope: 'global',
            customerId: '',
            currency: 'USD',
            isActive: true,
            startDate: new Date().toISOString().slice(0, 10),
            endDate: '',
            lines: [],
            createdAt: now,
            updatedAt: now
        });
        store.forEach((item) => { item.isActive = false; });
        row.isActive = true;
        store.push(row);
        SalesModule.state.priceListActiveId = String(row.id || '').trim();
        if (typeof DB.markDirty === 'function') DB.markDirty();
        UI.renderCurrentPage();
    },

    deleteActivePriceList: async () => {
        SalesModule.ensureSettingsData();
        const active = SalesModule.getActivePriceList();
        if (!active) return;
        if (!confirm(`"${active.name}" listesi silinsin mi?`)) return;
        const targetId = String(active.id || '').trim();
        DB.data.data.salesSettings.priceLists = SalesModule.getMutablePriceListStore()
            .filter((row) => String(row?.id || '').trim() !== targetId);
        SalesModule.state.priceListActiveId = '';
        SalesModule.ensurePriceListActiveSelection();
        await DB.save();
        UI.renderCurrentPage();
    },

    isPriceListActiveOnDate: (list, dateIso = '') => {
        if (!list || typeof list !== 'object') return false;
        if (list.isActive === false) return false;
        const target = String(dateIso || '').trim() || new Date().toISOString().slice(0, 10);
        const targetMs = Date.parse(target);
        const startMs = Date.parse(String(list.startDate || '').trim());
        const endMs = Date.parse(String(list.endDate || '').trim());
        if (Number.isFinite(startMs) && Number.isFinite(targetMs) && targetMs < startMs) return false;
        if (Number.isFinite(endMs) && Number.isFinite(targetMs) && targetMs > endMs) return false;
        return true;
    },

    findBestPriceListLine: (lines = [], productId = '', qty = 1) => {
        const targetProductId = String(productId || '').trim();
        if (!targetProductId) return null;
        const filtered = (Array.isArray(lines) ? lines : [])
            .map((line) => SalesModule.normalizePriceListLine(line))
            .filter((line) => line.productId === targetProductId)
            .filter((line) => Number(line.unitPrice || 0) > 0)
            .filter((line) => Number(line.minQty || 1) <= Math.max(1, Number(qty || 1)));
        if (!filtered.length) return null;
        filtered.sort((a, b) => Number(b.minQty || 1) - Number(a.minQty || 1));
        return filtered[0];
    },

    normalizeSalesCurrency: (value = 'USD') => {
        const normalized = String(value || '').trim().toUpperCase();
        return ['USD', 'EUR', 'TL'].includes(normalized) ? normalized : 'USD';
    },

    parseSalesQuantity: (value, fallback = 1) => {
        const parsed = Number(String(value ?? '').replace(',', '.'));
        if (!Number.isFinite(parsed)) return Number(fallback || 1);
        return Math.max(0.01, Number(parsed.toFixed(2)));
    },

    normalizeSalesLineUnit: (value = 'adet') => {
        const normalized = SalesModule.normalize(String(value || 'adet'));
        if (['metre', 'meter', 'm'].includes(normalized)) return 'metre';
        if (['kilogram', 'kg', 'kilo'].includes(normalized)) return 'kilogram';
        return 'adet';
    },

    getSalesLineUnitLabel: (value = 'adet') => {
        const unit = SalesModule.normalizeSalesLineUnit(value);
        if (unit === 'metre') return 'Metre';
        if (unit === 'kilogram') return 'Kilogram';
        return 'Adet';
    },

    getPriceListLineUnitPriceByVariation: (line, variationId = '') => {
        const normalizedLine = SalesModule.normalizePriceListLine(line || {});
        const variationKey = String(variationId || '').trim();
        if (variationKey) {
            const hit = (Array.isArray(normalizedLine.variantPrices) ? normalizedLine.variantPrices : [])
                .map((row) => SalesModule.normalizePriceListVariantPrice(row))
                .find((row) => String(row?.variationId || '').trim() === variationKey);
            if (hit && Number(hit.unitPrice || 0) > 0) return Number(hit.unitPrice || 0);
        }
        return Number(normalizedLine.unitPrice || 0);
    },

    getLastSalesPriceForCustomerProduct: (customerId, productId, options = {}) => {
        const targetCustomerId = String(customerId || '').trim();
        const targetProductId = String(productId || '').trim();
        const targetVariationId = String(options?.variationId || '').trim();
        if (!targetCustomerId || !targetProductId) return null;
        const lookbackDays = Number(options.lookbackDays || 365);
        const threshold = Date.now() - (lookbackDays * 24 * 60 * 60 * 1000);
        const rows = Array.isArray(DB.data?.data?.orders) ? DB.data.data.orders : [];

        const isIgnoredStatus = (status) => {
            const text = SalesModule.normalize(String(status || ''));
            if (!text) return false;
            return text.includes('iptal') || text.includes('arsiv') || text.includes('sil');
        };

        const candidates = [];
        rows.forEach((order) => {
            const orderCustomerId = String(order?.customerId || order?.customer?.id || '').trim();
            if (orderCustomerId !== targetCustomerId) return;
            if (isIgnoredStatus(order?.status)) return;
            const orderDate = String(order?.orderDate || order?.created_at || '').trim();
            const orderMs = Date.parse(orderDate);
            if (Number.isFinite(orderMs) && orderMs < threshold) return;
            const lines = Array.isArray(order?.lines) ? order.lines : [];
            lines.forEach((line) => {
                const lineProductId = String(line?.productId || '').trim();
                const lineVariationId = String(line?.variationId || '').trim();
                if (lineProductId !== targetProductId) return;
                if (targetVariationId && lineVariationId && lineVariationId !== targetVariationId) return;
                const unitPrice = Number(line?.unitPrice || 0);
                if (!(unitPrice > 0)) return;
                candidates.push({
                    unitPrice: Number(unitPrice.toFixed(2)),
                    orderDate,
                    orderNo: String(order?.orderNo || order?.code || order?.id || '-').trim(),
                    variationMatch: targetVariationId ? lineVariationId === targetVariationId : true
                });
            });
        });
        if (!candidates.length) return null;
        candidates.sort((a, b) => {
            if (!!a.variationMatch !== !!b.variationMatch) return a.variationMatch ? -1 : 1;
            const aMs = Date.parse(String(a.orderDate || ''));
            const bMs = Date.parse(String(b.orderDate || ''));
            return (Number.isFinite(bMs) ? bMs : 0) - (Number.isFinite(aMs) ? aMs : 0);
        });
        return candidates[0];
    },

    getSalesPriceSuggestion: (customerId, productId, qty = 1, orderDate = '', variationId = '') => {
        const targetCustomerId = String(customerId || '').trim();
        const targetProductId = String(productId || '').trim();
        const targetVariationId = String(variationId || '').trim();
        const quantity = Math.max(0.01, Number(qty || 1));
        if (!targetProductId) return null;

        const lastSales = SalesModule.getLastSalesPriceForCustomerProduct(targetCustomerId, targetProductId, {
            lookbackDays: 365,
            variationId: targetVariationId
        });
        if (lastSales) {
            const dateText = lastSales.orderDate ? new Date(lastSales.orderDate).toLocaleDateString('tr-TR') : '-';
            return {
                source: 'last-sale',
                unitPrice: Number(lastSales.unitPrice || 0),
                currency: 'USD',
                label: `Son satis: ${dateText} / ${lastSales.orderNo || '-'}`
            };
        }

        const priceLists = SalesModule.getPriceLists();
        const activeLists = priceLists.filter((list) => SalesModule.isPriceListActiveOnDate(list, orderDate));
        const chooseWinner = (lists = [], source) => {
            const candidates = lists
                .map((list) => ({ list, line: SalesModule.findBestPriceListLine(list.lines, targetProductId, quantity) }))
                .filter((item) => item.line)
                .map((item) => {
                    const unitPrice = SalesModule.getPriceListLineUnitPriceByVariation(item.line, targetVariationId);
                    return { ...item, unitPrice: Number(unitPrice || 0) };
                })
                .filter((item) => item.unitPrice > 0);
            candidates.sort((a, b) => String(b.list.updatedAt || '').localeCompare(String(a.list.updatedAt || ''), 'tr'));
            if (!candidates.length) return null;
            const winner = candidates[0];
            return {
                source,
                unitPrice: Number(winner.unitPrice || 0),
                currency: winner.list.currency || 'USD',
                label: `${source === 'customer-price-list' ? 'Musteri fiyat listesi' : 'Liste fiyati'}: ${winner.list.name}`
            };
        };

        const customerLists = activeLists.filter((list) => list.scope === 'customer' && String(list.customerId || '') === targetCustomerId);
        const customerWinner = chooseWinner(customerLists, 'customer-price-list');
        if (customerWinner) return customerWinner;

        const globalLists = activeLists.filter((list) => list.scope !== 'customer');
        const globalWinner = chooseWinner(globalLists, 'global-price-list');
        if (globalWinner) return globalWinner;
        return null;
    },

    createSalesOrderLineDraft: (seed = {}) => ({
        id: String(seed.id || crypto.randomUUID()).trim(),
        productId: String(seed.productId || '').trim(),
        variationId: String(seed.variationId || '').trim(),
        unit: SalesModule.normalizeSalesLineUnit(seed.unit || seed.quantityUnit || 'adet'),
        qty: SalesModule.parseSalesQuantity(seed.qty, 1),
        unitPrice: Number(seed.unitPrice || 0) > 0 ? Number(Number(seed.unitPrice || 0).toFixed(2)) : 0,
        isManualPrice: !!seed.isManualPrice
    }),

    buildSalesOrderDraft: (seed = {}) => {
        const source = seed && typeof seed === 'object' ? seed : {};
        const orderDate = String(source.orderDate || new Date().toISOString().slice(0, 10)).trim();
        const rawVatRate = Number(String(source.vatRate ?? 20).replace(',', '.'));
        const vatRate = rawVatRate === 0 ? 0 : 20;
        const discountRaw = source.globalDiscountRate ?? source.discountRate ?? 0;
        const hasLineArray = Array.isArray(source.lines);
        const lines = (hasLineArray ? source.lines : [])
            .map((line) => SalesModule.createSalesOrderLineDraft(line));
        const preparedBy = String(source.preparedBy || SalesModule.getCurrentEditorName() || 'Demo User').trim() || 'Demo User';
        return {
            editingOrderId: String(source.editingOrderId || source.id || '').trim(),
            orderDate,
            customerId: String(source.customerId || '').trim(),
            status: String(source.status || 'Onay Bekliyor').trim() || 'Onay Bekliyor',
            currency: SalesModule.normalizeSalesCurrency(source.currency || 'USD'),
            exchangeRate: SalesModule.parseMoney(source.exchangeRate || 0),
            preparedBy,
            globalDiscountRate: SalesModule.parsePercent(discountRaw),
            vatRate,
            deliveryLeadDays: SalesModule.parseDays(source.deliveryLeadDays || 0),
            deliveryAddress: String(source.deliveryAddress || '').trim(),
            paymentMethod: String(source.paymentMethod || source.deliveryMethod || 'Nakit').trim() || 'Nakit',
            note: String(source.note || '').trim(),
            revisionNo: Math.max(1, Number(source.revisionNo || 1)),
            approvalDate: String(source.approvalDate || '').trim(),
            lines
        };
    },

    buildSalesOrderHistoryFilters: (seed = {}) => ({
        query: String(seed?.query || '').trim(),
        status: ['ALL', 'WAITING', 'APPROVED', 'ARCHIVED', 'CANCELLED'].includes(String(seed?.status || '').trim().toUpperCase())
            ? String(seed?.status || '').trim().toUpperCase()
            : 'ALL',
        period: ['ALL', 'TODAY', 'THIS_WEEK', 'THIS_MONTH'].includes(String(seed?.period || '').trim().toUpperCase())
            ? String(seed?.period || '').trim().toUpperCase()
            : 'ALL'
    }),

    ensureSalesOrderHistoryFilters: () => {
        const current = SalesModule.state.salesOrderHistoryFilters;
        SalesModule.state.salesOrderHistoryFilters = SalesModule.buildSalesOrderHistoryFilters(current || {});
    },

    normalizeSalesOrderStatusGroup: (status) => {
        const text = SalesModule.normalize(String(status || ''));
        if (!text) return 'WAITING';
        if (text.includes('arsiv')) return 'ARCHIVED';
        if (text.includes('iptal') || text.includes('cancel')) return 'CANCELLED';
        if (text.includes('bekliyor') || text.includes('teklif') || text.includes('taslak')) return 'WAITING';
        if (text.includes('tamam') || text.includes('teslim') || text.includes('sevk') || text.includes('donus')) return 'APPROVED';
        if (text.includes('onay')) return 'APPROVED';
        return 'WAITING';
    },

    getSalesOrderStatusMeta: (status) => {
        const group = SalesModule.normalizeSalesOrderStatusGroup(status);
        const rawLabel = String(status || '').trim();
        if (group === 'APPROVED') {
            return { group, text: rawLabel || 'Onaylandi', border: '#86efac', bg: '#f0fdf4', color: '#166534' };
        }
        if (group === 'WAITING') {
            return { group, text: rawLabel || 'Onay Bekliyor', border: '#bfdbfe', bg: '#eff6ff', color: '#1d4ed8' };
        }
        if (group === 'ARCHIVED') {
            return { group, text: rawLabel || 'Arsiv', border: '#cbd5e1', bg: '#f8fafc', color: '#475569' };
        }
        if (group === 'CANCELLED') {
            return { group, text: rawLabel || 'Iptal', border: '#fecaca', bg: '#fff1f2', color: '#be123c' };
        }
        return { group, text: rawLabel || 'Onay Bekliyor', border: '#e2e8f0', bg: '#f8fafc', color: '#475569' };
    },

    getSalesOrderHistoryRows: () => {
        const rows = Array.isArray(DB.data?.data?.orders) ? DB.data.data.orders : [];
        return rows
            .filter((row) => {
                const orderType = SalesModule.normalize(String(row?.orderType || ''));
                if (orderType === 'proforma' || orderType === 'sales') return true;
                const orderNo = String(row?.orderNo || row?.orderCode || '').trim().toUpperCase();
                if (/^SOR-\d{6}$/.test(orderNo)) return true;
                const lines = Array.isArray(row?.lines) ? row.lines : [];
                return !!(String(row?.customerId || '').trim() && lines.some((line) => String(line?.productId || '').trim()));
            })
            .map((row) => {
                const dateRaw = String(row?.orderDate || row?.created_at || '').trim();
                const dateMs = Date.parse(dateRaw);
                const lines = Array.isArray(row?.lines) ? row.lines : [];
                return {
                    id: String(row?.id || '').trim(),
                    orderNo: String(row?.orderNo || row?.orderCode || row?.code || '-').trim(),
                    customerId: String(row?.customerId || row?.customer?.id || '').trim(),
                    customerName: String(row?.customerName || row?.customer?.name || '-').trim(),
                    orderDate: dateRaw,
                    orderDateMs: Number.isFinite(dateMs) ? dateMs : 0,
                    status: String(row?.status || 'Onay Bekliyor').trim(),
                    statusGroup: SalesModule.normalizeSalesOrderStatusGroup(row?.status),
                    currency: String(row?.currency || 'USD').trim().toUpperCase() || 'USD',
                    lineCount: lines.length,
                    total: Number(row?.totalAmount ?? row?.total ?? row?.grandTotal ?? 0),
                    source: row
                };
            })
            .sort((a, b) => Number(b.orderDateMs || 0) - Number(a.orderDateMs || 0));
    },

    isSalesOrderInSelectedPeriod: (orderDate, period) => {
        const targetPeriod = String(period || 'ALL').trim().toUpperCase();
        if (!targetPeriod || targetPeriod === 'ALL') return true;
        const orderMs = Date.parse(String(orderDate || '').trim());
        if (!Number.isFinite(orderMs)) return false;

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        if (targetPeriod === 'TODAY') {
            const tomorrowStart = todayStart + (24 * 60 * 60 * 1000);
            return orderMs >= todayStart && orderMs < tomorrowStart;
        }
        if (targetPeriod === 'THIS_WEEK') {
            const dayIndex = (new Date(todayStart).getDay() + 6) % 7; // Monday = 0
            const weekStart = todayStart - (dayIndex * 24 * 60 * 60 * 1000);
            return orderMs >= weekStart;
        }
        if (targetPeriod === 'THIS_MONTH') {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            return orderMs >= monthStart;
        }
        return true;
    },

    getFilteredSalesOrderHistoryRows: (rows = []) => {
        SalesModule.ensureSalesOrderHistoryFilters();
        const filters = SalesModule.state.salesOrderHistoryFilters || SalesModule.buildSalesOrderHistoryFilters();
        const query = SalesModule.normalize(filters.query || '');
        const status = String(filters.status || 'ALL').trim().toUpperCase();
        const period = String(filters.period || 'ALL').trim().toUpperCase();

        return (Array.isArray(rows) ? rows : []).filter((row) => {
            if (status !== 'ALL' && String(row?.statusGroup || '').trim().toUpperCase() !== status) return false;
            if (!SalesModule.isSalesOrderInSelectedPeriod(row?.orderDate, period)) return false;
            if (!query) return true;
            const haystack = [
                String(row?.orderNo || ''),
                String(row?.customerName || ''),
                String(row?.status || ''),
                String(row?.currency || '')
            ];
            return haystack.some((item) => SalesModule.normalize(item).includes(query));
        });
    },

    computeSalesOrderTotals: (draft = null) => {
        const source = draft && typeof draft === 'object' ? draft : (SalesModule.state.salesOrderDraft || {});
        const lines = Array.isArray(source.lines) ? source.lines : [];
        let subtotal = 0;
        const discountRate = SalesModule.parsePercent(source.globalDiscountRate || 0);
        const vatRate = Number(String(source.vatRate ?? 20).replace(',', '.')) === 0 ? 0 : 20;
        const normalizedLines = lines.map((line) => {
            const unit = SalesModule.normalizeSalesLineUnit(line?.unit || line?.quantityUnit || 'adet');
            const qty = SalesModule.parseSalesQuantity(line?.qty, 1);
            const unitPrice = Math.max(0, Number(line?.unitPrice || 0));
            const lineSubtotal = Number((qty * unitPrice).toFixed(2));
            subtotal += lineSubtotal;
            return {
                ...line,
                unit,
                qty,
                unitPrice: Number(unitPrice.toFixed(2)),
                lineSubtotal,
                lineTotal: lineSubtotal
            };
        });
        const discountTotal = Number((subtotal * (discountRate / 100)).toFixed(2));
        const taxBase = Number((subtotal - discountTotal).toFixed(2));
        const vatTotal = Number((taxBase * (vatRate / 100)).toFixed(2));
        const grandTotal = Number((taxBase + vatTotal).toFixed(2));
        return {
            lines: normalizedLines,
            subtotal: Number(subtotal.toFixed(2)),
            discountRate,
            discountTotal,
            taxBase,
            vatRate,
            vatTotal,
            grandTotal,
            netTotal: grandTotal
        };
    },

    applyPriceSuggestionToOrderLine: (line, draft) => {
        if (!line || typeof line !== 'object') return;
        const suggestion = SalesModule.getSalesPriceSuggestion(
            String(draft?.customerId || '').trim(),
            String(line?.productId || '').trim(),
            Number(line?.qty || 1),
            String(draft?.orderDate || '').trim(),
            String(line?.variationId || '').trim()
        );
        if (!suggestion) return;
        if (line.isManualPrice && Number(line.unitPrice || 0) > 0) return;
        line.unitPrice = Number(suggestion.unitPrice || 0);
        line.isManualPrice = false;
    },

    ensureSalesOrderDraft: () => {
        const current = SalesModule.state.salesOrderDraft;
        if (!current || typeof current !== 'object') {
            SalesModule.state.salesOrderDraft = SalesModule.buildSalesOrderDraft();
            return;
        }
        SalesModule.state.salesOrderDraft = SalesModule.buildSalesOrderDraft(current);
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
        if (SalesModule.state.workspaceView === 'sales') {
            SalesModule.ensureSalesOrderDraft();
            SalesModule.ensureSalesOrderHistoryFilters();
        }
        if (SalesModule.state.workspaceView !== 'settings-proforma') {
            SalesModule.state.proformaSettingsDraft = null;
            SalesModule.state.proformaBankDraft = { bankName: '', branchCode: '', accountNo: '', iban: '' };
            SalesModule.state.proformaSettingsSnapshot = '';
        }
        if (SalesModule.state.workspaceView !== 'settings-price-lists') {
            SalesModule.state.priceListDraft = null;
            SalesModule.state.priceListLineDraft = { productId: '', unitPrice: '', minQty: '1', note: '' };
            SalesModule.state.priceListEditingId = '';
        }
        UI.renderCurrentPage();
    },

    openSettingsPage: () => {
        SalesModule.openWorkspace('settings');
    },

    openProformaSettingsPage: () => {
        SalesModule.ensureData();
        const settings = SalesModule.getProformaSettings();
        const draft = SalesModule.buildProformaSettingsDraft(settings);
        SalesModule.state.proformaSettingsDraft = draft;
        SalesModule.state.proformaBankDraft = { bankName: '', branchCode: '', accountNo: '', iban: '' };
        SalesModule.state.proformaSettingsSnapshot = SalesModule.serializeProformaSettings(draft);
        SalesModule.state.workspaceView = 'settings-proforma';
        UI.renderCurrentPage();
    },

    openPriceListsSettingsPage: () => {
        SalesModule.ensureData();
        SalesModule.ensureCatalogState();
        SalesModule.ensurePriceListActiveSelection();
        SalesModule.state.workspaceView = 'settings-price-lists';
        SalesModule.state.priceListDraft = null;
        SalesModule.state.priceListLineDraft = { productId: '', unitPrice: '', minQty: '1', note: '' };
        SalesModule.state.priceListEditingId = '';
        SalesModule.syncActivePriceListCategoryRows();
        UI.renderCurrentPage();
    },

    startNewPriceListDraft: () => {
        const now = new Date().toISOString();
        SalesModule.state.priceListEditingId = '';
        SalesModule.state.priceListDraft = SalesModule.normalizePriceList({
            id: crypto.randomUUID(),
            name: '',
            scope: 'global',
            customerId: '',
            currency: 'USD',
            isActive: true,
            startDate: new Date().toISOString().slice(0, 10),
            endDate: '',
            lines: [],
            createdAt: now,
            updatedAt: now
        });
        SalesModule.state.priceListLineDraft = { productId: '', unitPrice: '', minQty: '1', note: '' };
        UI.renderCurrentPage();
    },

    editPriceListDraft: (id) => {
        SalesModule.ensureData();
        const targetId = String(id || '').trim();
        if (!targetId) return;
        const rows = SalesModule.getPriceLists();
        const selected = rows.find((row) => String(row?.id || '') === targetId);
        if (!selected) return alert('Fiyat listesi bulunamadi.');
        SalesModule.state.priceListEditingId = targetId;
        SalesModule.state.priceListDraft = SalesModule.normalizePriceList(selected);
        SalesModule.state.priceListLineDraft = { productId: '', unitPrice: '', minQty: '1', note: '' };
        UI.renderCurrentPage();
    },

    cancelPriceListDraft: () => {
        SalesModule.state.priceListDraft = null;
        SalesModule.state.priceListLineDraft = { productId: '', unitPrice: '', minQty: '1', note: '' };
        SalesModule.state.priceListEditingId = '';
        UI.renderCurrentPage();
    },

    setPriceListDraftField: (field, value) => {
        const draft = SalesModule.state.priceListDraft;
        if (!draft || typeof draft !== 'object') return;
        const key = String(field || '').trim();
        if (!key) return;
        if (key === 'scope') {
            draft.scope = String(value || '').trim() === 'customer' ? 'customer' : 'global';
            if (draft.scope !== 'customer') draft.customerId = '';
            UI.renderCurrentPage();
            return;
        }
        if (key === 'isActive') {
            draft.isActive = value === true || String(value || '').trim() === 'true';
            UI.renderCurrentPage();
            return;
        }
        if (key === 'currency') {
            const normalized = String(value || '').trim().toUpperCase();
            draft.currency = ['USD', 'TL', 'EUR'].includes(normalized) ? normalized : 'USD';
            UI.renderCurrentPage();
            return;
        }
        draft[key] = String(value || '').trim();
    },

    setPriceListLineDraftField: (field, value) => {
        const key = String(field || '').trim();
        if (!key) return;
        const draft = SalesModule.state.priceListLineDraft && typeof SalesModule.state.priceListLineDraft === 'object'
            ? SalesModule.state.priceListLineDraft
            : { productId: '', unitPrice: '', minQty: '1', note: '' };
        draft[key] = String(value || '');
        SalesModule.state.priceListLineDraft = draft;
        if (key === 'productId' && String(draft.unitPrice || '').trim() === '') {
            const product = SalesModule.getCatalogProducts().find((row) => String(row?.id || '') === String(draft.productId || ''));
            if (product) {
                const suggestion = SalesModule.getSalesPriceSuggestion('', String(product.id || ''), 1, new Date().toISOString().slice(0, 10));
                if (suggestion && Number(suggestion.unitPrice || 0) > 0) {
                    draft.unitPrice = String(Number(suggestion.unitPrice || 0).toFixed(2));
                }
            }
        }
        UI.renderCurrentPage();
    },

    addPriceListLineToDraft: () => {
        const listDraft = SalesModule.state.priceListDraft;
        const lineDraft = SalesModule.state.priceListLineDraft;
        if (!listDraft || typeof listDraft !== 'object') return;
        if (!lineDraft || typeof lineDraft !== 'object') return;
        const normalized = SalesModule.normalizePriceListLine({
            id: crypto.randomUUID(),
            productId: String(lineDraft.productId || '').trim(),
            unitPrice: String(lineDraft.unitPrice || '').trim(),
            minQty: String(lineDraft.minQty || '1').trim(),
            note: String(lineDraft.note || '').trim()
        });
        if (!normalized.productId) return alert('Urun secmelisin.');
        if (!(Number(normalized.unitPrice || 0) > 0)) return alert('Birim fiyat sifirdan buyuk olmali.');
        const rows = Array.isArray(listDraft.lines) ? listDraft.lines : [];
        const sameIdx = rows.findIndex((row) => String(row?.productId || '') === normalized.productId && Number(row?.minQty || 1) === Number(normalized.minQty || 1));
        if (sameIdx >= 0) {
            rows[sameIdx] = normalized;
        } else {
            rows.push(normalized);
        }
        listDraft.lines = rows;
        SalesModule.state.priceListLineDraft = { productId: '', unitPrice: '', minQty: '1', note: '' };
        UI.renderCurrentPage();
    },

    removePriceListLineFromDraft: (lineId) => {
        const targetId = String(lineId || '').trim();
        if (!targetId) return;
        const draft = SalesModule.state.priceListDraft;
        if (!draft || typeof draft !== 'object') return;
        draft.lines = (Array.isArray(draft.lines) ? draft.lines : [])
            .filter((line) => String(line?.id || '').trim() !== targetId);
        UI.renderCurrentPage();
    },

    savePriceListDraft: async () => {
        SalesModule.ensureSettingsData();
        const draft = SalesModule.state.priceListDraft;
        if (!draft || typeof draft !== 'object') return;
        const normalized = SalesModule.normalizePriceList(draft);
        if (!normalized.name) return alert('Fiyat listesi adi zorunlu.');
        if (normalized.scope === 'customer' && !normalized.customerId) return alert('Musteri ozel liste icin musteri secmelisin.');
        if (!Array.isArray(normalized.lines) || normalized.lines.length === 0) return alert('En az bir urun satiri eklemelisin.');

        const now = new Date().toISOString();
        normalized.updatedAt = now;
        if (!normalized.createdAt) normalized.createdAt = now;

        const store = Array.isArray(DB.data?.data?.salesSettings?.priceLists) ? DB.data.data.salesSettings.priceLists : [];
        const idx = store.findIndex((row) => String(row?.id || '').trim() === String(normalized.id || '').trim());
        if (idx >= 0) store[idx] = normalized;
        else store.push(normalized);
        DB.data.data.salesSettings.priceLists = store;
        await DB.save();
        alert(idx >= 0 ? 'Fiyat listesi guncellendi.' : 'Fiyat listesi kaydedildi.');
        SalesModule.cancelPriceListDraft();
    },

    deletePriceList: async (id) => {
        SalesModule.ensureSettingsData();
        const targetId = String(id || '').trim();
        if (!targetId) return;
        if (!confirm('Fiyat listesi silinsin mi?')) return;
        const store = Array.isArray(DB.data?.data?.salesSettings?.priceLists) ? DB.data.data.salesSettings.priceLists : [];
        DB.data.data.salesSettings.priceLists = store.filter((row) => String(row?.id || '').trim() !== targetId);
        await DB.save();
        UI.renderCurrentPage();
    },

    getSalesVariationsForCatalogProduct: (productId) => {
        const id = String(productId || '').trim();
        if (!id) return [];
        if (typeof ProductLibraryModule !== 'undefined'
            && ProductLibraryModule
            && typeof ProductLibraryModule.getSalesProductVariationRows === 'function') {
            return ProductLibraryModule.getSalesProductVariationRows(id)
                .map((row) => ({
                    id: String(row?.id || '').trim(),
                    variantCode: String(row?.variantCode || '').trim().toUpperCase(),
                    productName: String(row?.productName || '').trim(),
                    updatedAt: String(row?.updatedAt || row?.updated_at || row?.createdAt || '').trim()
                }))
                .filter((row) => row.id && row.variantCode);
        }
        const rows = Array.isArray(DB.data?.data?.salesProductVariants) ? DB.data.data.salesProductVariants : [];
        return rows
            .filter((row) => String(row?.sourceCatalogProductId || '').trim() === id)
            .map((row) => ({
                id: String(row?.id || '').trim(),
                variantCode: String(row?.variantCode || '').trim().toUpperCase(),
                productName: String(row?.productName || '').trim(),
                updatedAt: String(row?.updated_at || row?.created_at || '').trim()
            }))
            .filter((row) => row.id && row.variantCode);
    },

    syncPriceListLineVariants: (line, baseUnitPrice = 0) => {
        const target = line && typeof line === 'object' ? line : null;
        if (!target) return false;
        const before = JSON.stringify(target);
        const variations = SalesModule.getSalesVariationsForCatalogProduct(target.productId);
        const existingMap = new Map(
            (Array.isArray(target.variantPrices) ? target.variantPrices : [])
                .map((row) => SalesModule.normalizePriceListVariantPrice(row))
                .map((row) => [String(row.variationId || '').trim(), row])
                .filter(([id]) => id)
        );
        const normalizedBase = Math.max(0, Number(baseUnitPrice || 0));
        const next = variations.map((variation) => {
            const key = String(variation.id || '').trim();
            const prev = existingMap.get(key);
            if (!prev) {
                return SalesModule.normalizePriceListVariantPrice({
                    id: crypto.randomUUID(),
                    variationId: key,
                    variantCode: variation.variantCode,
                    unitPrice: normalizedBase,
                    isOverride: false,
                    needsUpdate: true,
                    updatedAt: new Date().toISOString()
                });
            }
            const merged = SalesModule.normalizePriceListVariantPrice({
                ...prev,
                variationId: key,
                variantCode: variation.variantCode
            });
            if (!merged.isOverride) merged.unitPrice = Number(normalizedBase.toFixed(2));
            return merged;
        });
        target.variantPrices = next;
        const after = JSON.stringify(target);
        return before !== after;
    },

    syncActivePriceListCategoryRows: (options = {}) => {
        SalesModule.ensureSettingsData();
        const categoryId = String(options?.categoryId || SalesModule.state.catalogActiveCategoryId || '').trim();
        const active = SalesModule.getActivePriceList();
        if (!active || !categoryId) return { changed: false, addedProductIds: [] };
        const products = SalesModule.getCatalogProductsByCategory(categoryId)
            .filter((row) => String(row?.id || '').trim());
        if (!products.length) return { changed: false, addedProductIds: [] };

        const now = new Date().toISOString();
        let changed = false;
        const addedProductIds = [];
        if (!Array.isArray(active.lines)) active.lines = [];
        const lineByProduct = new Map(
            active.lines
                .map((line) => SalesModule.normalizePriceListLine(line))
                .map((line) => [String(line.productId || '').trim(), line])
                .filter(([id]) => id)
        );

        products.forEach((product) => {
            const productId = String(product.id || '').trim();
            const categoryValue = String(product.categoryId || categoryId).trim();
            let line = lineByProduct.get(productId);
            if (!line) {
                line = SalesModule.normalizePriceListLine({
                    id: crypto.randomUUID(),
                    productId,
                    categoryId: categoryValue,
                    unitPrice: 0,
                    minQty: 1,
                    note: '',
                    variantPrices: [],
                    updatedAt: now
                });
                lineByProduct.set(productId, line);
                active.lines.push(line);
                addedProductIds.push(productId);
                changed = true;
            } else if (String(line.categoryId || '').trim() !== categoryValue) {
                line.categoryId = categoryValue;
                changed = true;
            }
            const lineBefore = JSON.stringify(line);
            const didVariantSync = SalesModule.syncPriceListLineVariants(line, Number(line.unitPrice || 0));
            if (didVariantSync) changed = true;
            const lineAfter = JSON.stringify(line);
            if (lineBefore !== lineAfter) line.updatedAt = now;
        });

        if (changed) {
            active.lines = Array.from(lineByProduct.values()).map((row) => SalesModule.normalizePriceListLine(row));
            active.updatedAt = now;
            const store = SalesModule.getMutablePriceListStore();
            const idx = store.findIndex((row) => String(row?.id || '').trim() === String(active.id || '').trim());
            if (idx >= 0) store[idx] = SalesModule.normalizePriceList(active);
            if (typeof DB.markDirty === 'function') DB.markDirty();
        }

        if (addedProductIds.length > 0) {
            if (!SalesModule.state.priceListExpandedProducts || typeof SalesModule.state.priceListExpandedProducts !== 'object') {
                SalesModule.state.priceListExpandedProducts = {};
            }
            addedProductIds.forEach((productId) => {
                SalesModule.state.priceListExpandedProducts[String(productId || '').trim()] = true;
            });
        }
        return { changed, addedProductIds };
    },

    setPriceListMainProductPrice: (productId, value) => {
        const id = String(productId || '').trim();
        if (!id) return;
        const active = SalesModule.getActivePriceList();
        if (!active) return;
        const price = SalesModule.parseMoney(value);
        const line = (Array.isArray(active.lines) ? active.lines : [])
            .map((row) => SalesModule.normalizePriceListLine(row))
            .find((row) => String(row.productId || '').trim() === id);
        if (!line) return;
        line.unitPrice = price;
        line.updatedAt = new Date().toISOString();
        (Array.isArray(line.variantPrices) ? line.variantPrices : []).forEach((row) => {
            const item = SalesModule.normalizePriceListVariantPrice(row);
            if (!item.isOverride) item.unitPrice = Number(price.toFixed(2));
        });
        SalesModule.syncPriceListLineVariants(line, price);
        const nextLines = (Array.isArray(active.lines) ? active.lines : [])
            .map((row) => {
                const normalized = SalesModule.normalizePriceListLine(row);
                if (String(normalized.productId || '').trim() !== id) return normalized;
                return SalesModule.normalizePriceListLine(line);
            });
        active.lines = nextLines;
        active.updatedAt = new Date().toISOString();
        const store = SalesModule.getMutablePriceListStore();
        const idx = store.findIndex((row) => String(row?.id || '').trim() === String(active.id || '').trim());
        if (idx >= 0) store[idx] = SalesModule.normalizePriceList(active);
        if (typeof DB.markDirty === 'function') DB.markDirty();
        UI.renderCurrentPage();
    },

    setPriceListVariantPrice: (productId, variationId, value) => {
        const productKey = String(productId || '').trim();
        const variationKey = String(variationId || '').trim();
        if (!productKey || !variationKey) return;
        const active = SalesModule.getActivePriceList();
        if (!active) return;
        const price = SalesModule.parseMoney(value);
        const lines = Array.isArray(active.lines) ? active.lines : [];
        const lineIdx = lines.findIndex((row) => String(row?.productId || '').trim() === productKey);
        if (lineIdx < 0) return;
        const line = SalesModule.normalizePriceListLine(lines[lineIdx]);
        const list = Array.isArray(line.variantPrices) ? line.variantPrices.map((row) => SalesModule.normalizePriceListVariantPrice(row)) : [];
        const idx = list.findIndex((row) => String(row?.variationId || '').trim() === variationKey);
        if (idx < 0) return;
        const row = list[idx];
        row.unitPrice = price;
        row.isOverride = Math.abs(Number(price || 0) - Number(line.unitPrice || 0)) > 0.0001;
        row.needsUpdate = false;
        row.updatedAt = new Date().toISOString();
        list[idx] = row;
        line.variantPrices = list;
        line.updatedAt = new Date().toISOString();
        lines[lineIdx] = SalesModule.normalizePriceListLine(line);
        active.lines = lines;
        active.updatedAt = new Date().toISOString();
        const store = SalesModule.getMutablePriceListStore();
        const storeIdx = store.findIndex((item) => String(item?.id || '').trim() === String(active.id || '').trim());
        if (storeIdx >= 0) store[storeIdx] = SalesModule.normalizePriceList(active);
        if (typeof DB.markDirty === 'function') DB.markDirty();
        UI.renderCurrentPage();
    },

    resetPriceListVariantToInherited: (productId, variationId) => {
        const productKey = String(productId || '').trim();
        const variationKey = String(variationId || '').trim();
        if (!productKey || !variationKey) return;
        const active = SalesModule.getActivePriceList();
        if (!active) return;
        const lines = Array.isArray(active.lines) ? active.lines : [];
        const lineIdx = lines.findIndex((row) => String(row?.productId || '').trim() === productKey);
        if (lineIdx < 0) return;
        const line = SalesModule.normalizePriceListLine(lines[lineIdx]);
        const idx = (Array.isArray(line.variantPrices) ? line.variantPrices : [])
            .findIndex((row) => String(row?.variationId || '').trim() === variationKey);
        if (idx < 0) return;
        const list = (Array.isArray(line.variantPrices) ? line.variantPrices : [])
            .map((row) => SalesModule.normalizePriceListVariantPrice(row));
        list[idx] = SalesModule.normalizePriceListVariantPrice({
            ...list[idx],
            unitPrice: Number(line.unitPrice || 0),
            isOverride: false,
            needsUpdate: false,
            updatedAt: new Date().toISOString()
        });
        line.variantPrices = list;
        line.updatedAt = new Date().toISOString();
        lines[lineIdx] = SalesModule.normalizePriceListLine(line);
        active.lines = lines;
        active.updatedAt = new Date().toISOString();
        const store = SalesModule.getMutablePriceListStore();
        const storeIdx = store.findIndex((item) => String(item?.id || '').trim() === String(active.id || '').trim());
        if (storeIdx >= 0) store[storeIdx] = SalesModule.normalizePriceList(active);
        if (typeof DB.markDirty === 'function') DB.markDirty();
        UI.renderCurrentPage();
    },

    togglePriceListProductRow: (productId) => {
        const key = String(productId || '').trim();
        if (!key) return;
        if (!SalesModule.state.priceListExpandedProducts || typeof SalesModule.state.priceListExpandedProducts !== 'object') {
            SalesModule.state.priceListExpandedProducts = {};
        }
        const current = !!SalesModule.state.priceListExpandedProducts[key];
        SalesModule.state.priceListExpandedProducts[key] = !current;
        UI.renderCurrentPage();
    },

    getPriceListLineStatusBadges: (line = {}) => {
        const unitPrice = Number(line?.unitPrice || 0);
        const variants = Array.isArray(line?.variantPrices) ? line.variantPrices : [];
        const hasOverride = variants.some((row) => !!row?.isOverride);
        const hasNeedsUpdate = variants.some((row) => !!row?.needsUpdate);
        const badges = [];
        if (!(unitPrice > 0)) badges.push({ text: 'fiyat belirtilmedi', tone: 'danger' });
        else badges.push({ text: 'miras fiyat', tone: 'ok' });
        if (hasOverride) badges.push({ text: 'ozel fiyat var', tone: 'info' });
        if (hasNeedsUpdate) badges.push({ text: 'fiyat guncellenmedi', tone: 'warn' });
        return badges;
    },

    renderPriceListBadgeHtml: (badge = {}) => {
        const tone = String(badge?.tone || '').trim();
        const map = {
            ok: { border: '#86efac', bg: '#f0fdf4', color: '#166534' },
            warn: { border: '#fcd34d', bg: '#fffbeb', color: '#92400e' },
            danger: { border: '#fecaca', bg: '#fff1f2', color: '#b91c1c' },
            info: { border: '#bfdbfe', bg: '#eff6ff', color: '#1d4ed8' }
        };
        const meta = map[tone] || map.info;
        return `<span style="display:inline-flex; align-items:center; padding:0.13rem 0.48rem; border:1px solid ${meta.border}; border-radius:999px; background:${meta.bg}; color:${meta.color}; font-size:0.72rem; font-weight:800;">${SalesModule.escapeHtml(String(badge?.text || '-'))}</span>`;
    },

    getSalesVariationRowById: (productId, variationId) => {
        const productKey = String(productId || '').trim();
        const variationKey = String(variationId || '').trim();
        if (!productKey || !variationKey) return null;
        if (typeof ProductLibraryModule !== 'undefined'
            && ProductLibraryModule
            && typeof ProductLibraryModule.getSalesProductVariationRows === 'function') {
            const rows = ProductLibraryModule.getSalesProductVariationRows(productKey);
            return rows.find((row) => String(row?.id || '').trim() === variationKey) || null;
        }
        const rows = Array.isArray(DB.data?.data?.salesProductVariants) ? DB.data.data.salesProductVariants : [];
        const hit = rows.find((row) =>
            String(row?.sourceCatalogProductId || '').trim() === productKey
            && String(row?.id || '').trim() === variationKey
        );
        if (!hit) return null;
        return {
            id: String(hit?.id || '').trim(),
            variantCode: String(hit?.variantCode || '').trim().toUpperCase(),
            productName: String(hit?.productName || '').trim(),
            bubble: String(hit?.bubble || 'yok').trim() === 'var' ? 'var' : 'yok',
            selectedDiameter: String(hit?.selectedDiameter || '').trim(),
            lowerTubeLengthMm: String(hit?.lowerTubeLengthMm || '').trim(),
            colors: hit?.colors && typeof hit.colors === 'object' ? hit.colors : {},
            note: String(hit?.note || '').trim()
        };
    },

    renderSalesVariationDetailModalHtml: (product = {}, variation = {}) => {
        const pathText = SalesModule.getCatalogCategoryPathText(product?.categoryId || '');
        const productImage = String(product?.images?.product || product?.images?.application || '').trim();
        const technicalImage = String(product?.images?.technical || '').trim();
        const accessory = variation?.colors?.accessory && typeof variation.colors.accessory === 'object'
            ? variation.colors.accessory
            : (product?.colors?.accessory || {});
        const tube = variation?.colors?.tube && typeof variation.colors.tube === 'object'
            ? variation.colors.tube
            : (product?.colors?.tube || {});
        const plexi = variation?.colors?.plexi && typeof variation.colors.plexi === 'object'
            ? variation.colors.plexi
            : (product?.colors?.plexi || {});
        const selectedDiameter = String(variation?.selectedDiameter || product?.selectedDiameter || '').trim();
        const diameters = Array.isArray(product?.diameters) ? product.diameters : [];
        const lowerTubeLength = String(variation?.lowerTubeLengthMm || product?.lowerTubeLength || 'standart').trim() || 'standart';
        const bubble = String(variation?.bubble || product?.bubble || 'yok').trim() === 'var' ? 'var' : 'yok';
        return `
            <div class="sales-catalog-detail-wrap">
                <div class="sales-catalog-modal-kicker">${SalesModule.escapeHtml(pathText)}</div>
                <div class="sales-catalog-detail-grid">
                    <div class="sales-catalog-detail-left">
                        <div class="sales-catalog-preview-combo">
                            <div class="sales-catalog-preview-panel is-dark">
                                ${productImage
                ? `<img src="${SalesModule.escapeHtml(productImage)}" alt="${SalesModule.escapeHtml(product?.name || 'Urun')}" class="sales-catalog-preview-image">`
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
                            <div class="sales-catalog-detail-title">${SalesModule.escapeHtml(String(variation?.productName || product?.name || '-'))}</div>
                            <div class="sales-catalog-detail-codes">
                                <span class="sales-catalog-code-primary">${SalesModule.escapeHtml(String(variation?.variantCode || '-'))}</span>
                                <span class="sales-catalog-code-secondary">ID: ${SalesModule.escapeHtml(String(product?.idCode || '-'))}</span>
                            </div>
                        </div>

                        <div class="sales-catalog-detail-fields">
                            ${SalesModule.renderCatalogDetailColorField('Aksesuar rengi', 'accessory', accessory)}
                            ${SalesModule.renderCatalogDetailColorField('Boru rengi', 'tube', tube)}
                            ${SalesModule.renderCatalogDetailColorField('Pleksi rengi', 'plexi', plexi)}
                            <div class="sales-catalog-field-block">
                                <label class="sales-catalog-label">Varyasyon ID</label>
                                <input class="sales-catalog-input" value="${SalesModule.escapeHtml(String(variation?.id || '-'))}" readonly>
                            </div>
                            <div class="sales-catalog-field-block">
                                <label class="sales-catalog-label">Kabarcik</label>
                                <div class="sales-catalog-toggle is-disabled">
                                    <button type="button" class="sales-catalog-toggle-btn ${bubble === 'var' ? 'is-active' : ''}" disabled>var</button>
                                    <button type="button" class="sales-catalog-toggle-btn ${bubble === 'yok' ? 'is-active' : ''}" disabled>yok</button>
                                </div>
                            </div>
                            <div class="sales-catalog-field-block">
                                <label class="sales-catalog-label">Cap</label>
                                <div class="sales-catalog-chip-row">
                                    ${SalesModule.renderCatalogDiameterButtonsHtml(diameters, selectedDiameter, 'SalesModule.noop')}
                                </div>
                            </div>
                            <div class="sales-catalog-field-block">
                                <label class="sales-catalog-label">Alt boru uzunlugu</label>
                                <input class="sales-catalog-input" value="${SalesModule.escapeHtml(lowerTubeLength)}" readonly>
                            </div>
                        </div>

                        <div>
                            <label class="sales-catalog-label">Not</label>
                            <textarea class="sales-catalog-textarea" readonly>${SalesModule.escapeHtml(String(variation?.note || ''))}</textarea>
                        </div>

                        <div class="sales-catalog-modal-actions">
                            <button class="btn-sm" onclick="Modal.close()">kapat</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderSalesProductPriceModalHtml: (product = {}, line = {}, currency = 'USD', listName = '') => {
        const pathText = SalesModule.getCatalogCategoryPathText(product?.categoryId || '');
        const productImage = String(product?.images?.product || product?.images?.application || '').trim();
        const technicalImage = String(product?.images?.technical || '').trim();
        const currentPrice = SalesModule.formatPriceListInputValue(Number(line?.unitPrice || 0));
        return `
            <div class="sales-catalog-detail-wrap">
                <div class="sales-catalog-modal-kicker">${SalesModule.escapeHtml(pathText)}</div>
                <div class="sales-catalog-detail-grid">
                    <div class="sales-catalog-detail-left">
                        <div class="sales-catalog-preview-combo">
                            <div class="sales-catalog-preview-panel is-dark">
                                ${productImage
                ? `<img src="${SalesModule.escapeHtml(productImage)}" alt="${SalesModule.escapeHtml(product?.name || 'Urun')}" class="sales-catalog-preview-image">`
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
                            <div class="sales-catalog-detail-title">${SalesModule.escapeHtml(String(product?.name || '-'))}</div>
                            <div class="sales-catalog-detail-codes">
                                <span class="sales-catalog-code-primary">${SalesModule.escapeHtml(String(product?.productCode || '-'))}</span>
                                <span class="sales-catalog-code-secondary">ID: ${SalesModule.escapeHtml(String(product?.idCode || '-'))}</span>
                            </div>
                        </div>

                        <div style="border:1px solid #e2e8f0; border-radius:0.78rem; padding:0.7rem; background:#f8fafc;">
                            <div style="font-size:0.78rem; color:#64748b;">Aktif liste</div>
                            <div style="font-size:0.9rem; font-weight:800; color:#0f172a; margin-top:0.15rem;">${SalesModule.escapeHtml(String(listName || '-'))}</div>
                            <div style="display:grid; grid-template-columns:1fr auto; gap:0.55rem; margin-top:0.55rem; align-items:end;">
                                <div>
                                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Ana urun birim fiyat (${SalesModule.escapeHtml(currency)})</label>
                                    <input id="sales_price_list_main_price_modal_input" type="number" min="0" step="0.01" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(currentPrice)}">
                                </div>
                                <button class="btn-primary" type="button" onclick="SalesModule.setPriceListMainProductPriceFromModal('${SalesModule.escapeHtml(String(product?.id || ''))}')">kaydet</button>
                            </div>
                            <div style="font-size:0.78rem; color:#64748b; margin-top:0.35rem;">Bu fiyat override olmayan varyasyonlara miras gider.</div>
                        </div>

                        <div style="margin-top:0.6rem;">
                            <label class="sales-catalog-label">Not</label>
                            <textarea class="sales-catalog-textarea" readonly>${SalesModule.escapeHtml(String(product?.note || ''))}</textarea>
                        </div>

                        <div class="sales-catalog-modal-actions">
                            <button class="btn-sm" onclick="Modal.close()">kapat</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    openSalesProductFromPriceList: (productId) => {
        const productKey = String(productId || '').trim();
        if (!productKey) return;
        const product = SalesModule.getCatalogProducts().find((row) => String(row?.id || '').trim() === productKey);
        if (!product) return alert('Urun bulunamadi.');
        const line = SalesModule.getActivePriceListLineByProductId(productKey) || {};
        const active = SalesModule.getActivePriceList();
        const currency = String(active?.currency || 'USD').trim().toUpperCase() || 'USD';
        const html = SalesModule.renderSalesProductPriceModalHtml(product, line, currency, String(active?.name || 'Genel Liste'));
        Modal.open('Urun karti detay', html, { maxWidth: '1180px' });
    },

    setPriceListMainProductPriceFromModal: (productId) => {
        const productKey = String(productId || '').trim();
        if (!productKey) return;
        const input = document.getElementById('sales_price_list_main_price_modal_input');
        const value = input ? String(input.value || '') : '';
        SalesModule.setPriceListMainProductPrice(productKey, value);
        Modal.close();
    },

    formatPriceListInputValue: (value) => {
        const num = Number(value || 0);
        if (!(num > 0)) return '';
        return Number(num.toFixed(2)).toString();
    },

    getActivePriceListLineByProductId: (productId) => {
        const key = String(productId || '').trim();
        if (!key) return null;
        const active = SalesModule.getActivePriceList();
        if (!active) return null;
        const lines = Array.isArray(active.lines) ? active.lines : [];
        const row = lines.find((item) => String(item?.productId || '').trim() === key);
        return row ? SalesModule.normalizePriceListLine(row) : null;
    },

    openSalesVariationFromPriceList: (productId, variationId = '') => {
        const productKey = String(productId || '').trim();
        const variationKey = String(variationId || '').trim();
        if (!productKey) return;
        const product = SalesModule.getCatalogProducts().find((row) => String(row?.id || '').trim() === productKey);
        if (!product) return alert('Urun bulunamadi.');
        const variation = variationKey ? SalesModule.getSalesVariationRowById(productKey, variationKey) : null;
        if (!variation) return alert('Varyasyon kaydi bulunamadi.');
        const html = SalesModule.renderSalesVariationDetailModalHtml(product, variation);
        Modal.open('Urun karti detay', html, { maxWidth: '1180px' });
    },

    setSalesOrderDraftField: (field, value) => {
        SalesModule.ensureSalesOrderDraft();
        const draft = SalesModule.state.salesOrderDraft;
        const key = String(field || '').trim();
        if (!draft || !key) return;
        if (key === 'currency') {
            draft.currency = SalesModule.normalizeSalesCurrency(value || 'USD');
            if (draft.currency === 'TL') draft.exchangeRate = 0;
            SalesModule.refreshSalesOrderUi();
            return;
        }
        if (key === 'exchangeRate') {
            draft.exchangeRate = SalesModule.parseMoney(value || 0);
            SalesModule.refreshSalesOrderUi();
            return;
        }
        if (key === 'globalDiscountRate') {
            draft.globalDiscountRate = SalesModule.parsePercent(value || 0);
            SalesModule.refreshSalesOrderUi();
            return;
        }
        if (key === 'vatRate') {
            const numeric = Number(String(value || '').replace(',', '.'));
            draft.vatRate = numeric === 0 ? 0 : 20;
            SalesModule.refreshSalesOrderUi();
            return;
        }
        if (key === 'deliveryLeadDays') {
            draft.deliveryLeadDays = SalesModule.parseDays(value || 0);
            SalesModule.refreshSalesOrderUi();
            return;
        }
        if (key === 'paymentMethod') {
            draft.paymentMethod = SalesModule.normalizeSalesPaymentMethod(value || '');
            SalesModule.refreshSalesOrderUi();
            return;
        }
        draft[key] = String(value || '').trim();
        if (key === 'customerId') {
            const customer = SalesModule.getCustomerById(draft.customerId);
            draft.deliveryAddress = customer ? String(customer.address || '').trim() : '';
            if (customer) {
                draft.currency = SalesModule.normalizeSalesCurrency(customer.preferredCurrency || draft.currency || 'USD');
                if (draft.currency === 'TL') draft.exchangeRate = 0;
                draft.paymentMethod = String(customer.defaultPaymentMethod || draft.paymentMethod || 'Nakit').trim() || 'Nakit';
            }
            (Array.isArray(draft.lines) ? draft.lines : []).forEach((line) => {
                if (line && typeof line === 'object') {
                    line.isManualPrice = false;
                    SalesModule.applyPriceSuggestionToOrderLine(line, draft);
                }
            });
        }
        if (key === 'orderDate') {
            (Array.isArray(draft.lines) ? draft.lines : []).forEach((line) => {
                if (line && typeof line === 'object') SalesModule.applyPriceSuggestionToOrderLine(line, draft);
            });
        }
        SalesModule.refreshSalesOrderUi();
    },

    openSalesPaymentMethodModal: () => {
        SalesModule.ensureSalesOrderDraft();
        SalesModule.state.salesPaymentMethodDraft = '';
        const html = `
            <div style="display:flex; flex-direction:column; gap:0.65rem;">
                <div style="font-size:0.84rem; color:#475569;">Yeni odeme sekli ekleyebilirsin. Kaydedince siparis formuna otomatik secilir.</div>
                <div>
                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.25rem;">Odeme sekli</label>
                    <input id="sales_payment_method_new_input" class="stock-input stock-input-tall" value="" placeholder="or: Cek / Senet" oninput="SalesModule.state.salesPaymentMethodDraft = this.value">
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.45rem;">
                    <button class="btn-sm" type="button" onclick="Modal.close()">vazgec</button>
                    <button class="btn-primary" type="button" onclick="SalesModule.saveSalesPaymentMethodFromModal()">ekle ve sec</button>
                </div>
            </div>
        `;
        Modal.open('Odeme sekli ekle', html, { maxWidth: '460px', closeExisting: false });
        setTimeout(() => {
            const input = document.getElementById('sales_payment_method_new_input');
            if (input && typeof input.focus === 'function') input.focus();
        }, 0);
    },

    saveSalesPaymentMethodFromModal: () => {
        SalesModule.ensureSalesOrderDraft();
        const draft = SalesModule.state.salesOrderDraft;
        const input = document.getElementById('sales_payment_method_new_input');
        const value = SalesModule.normalizeSalesPaymentMethod(input ? input.value : SalesModule.state.salesPaymentMethodDraft);
        if (!value) return alert('Odeme sekli bos olamaz.');
        SalesModule.upsertSalesPaymentMethod(value);
        if (draft && typeof draft === 'object') {
            draft.paymentMethod = value;
        }
        SalesModule.state.salesPaymentMethodDraft = '';
        Modal.close();
        SalesModule.refreshSalesOrderUi();
    },

    addSalesOrderLine: (options = {}) => {
        SalesModule.ensureSalesOrderDraft();
        const draft = SalesModule.state.salesOrderDraft;
        if (!draft || typeof draft !== 'object') return;
        const nextLine = SalesModule.createSalesOrderLineDraft();
        const rows = Array.isArray(draft.lines) ? draft.lines : [];
        rows.push(nextLine);
        draft.lines = rows;
        SalesModule.state.salesPendingFocusLineId = String(nextLine.id || '');
        SalesModule.refreshSalesOrderUi();
        const shouldOpenPicker = options?.openPicker !== false;
        if (shouldOpenPicker) {
            SalesModule.state.salesPendingFocusLineId = '';
            setTimeout(() => {
                SalesModule.openSalesOrderLineProductLibraryPicker(String(nextLine.id || ''));
            }, 0);
            return;
        }
        setTimeout(() => {
            const node = document.getElementById(`sales_line_product_${SalesModule.state.salesPendingFocusLineId}`);
            if (node && typeof node.focus === 'function') node.focus();
            SalesModule.state.salesPendingFocusLineId = '';
        }, 0);
    },

    startAddSalesOrderLineFromCatalog: () => {
        SalesModule.addSalesOrderLine({ openPicker: true });
    },

    clearSalesOrderLineLibraryPickerState: () => {
        SalesModule.state.salesOrderLineLibraryPickerPending = false;
        SalesModule.state.salesOrderLineLibraryPickerContext = null;
    },

    restoreSalesOrderAfterLibraryPicker: (reopenModal = true) => {
        const shouldReopenModal = reopenModal !== false;
        if (typeof Router !== 'undefined' && Router && typeof Router.navigate === 'function') {
            Router.navigate('sales', { fromBack: true });
            if (shouldReopenModal) {
                setTimeout(() => {
                    SalesModule.openSalesOrderEditorModal({ reset: false });
                }, 0);
            }
            return;
        }
        if (shouldReopenModal) {
            SalesModule.openSalesOrderEditorModal({ reset: false });
            return;
        }
        UI.renderCurrentPage();
    },

    resolveSalesOrderLineLibrarySelection: (modelId) => {
        const rawId = String(modelId || '').trim();
        if (!rawId) return { ok: false, message: 'Secilen varyant gecersiz.' };
        if (typeof ProductLibraryModule === 'undefined' || !ProductLibraryModule) {
            return { ok: false, message: 'Urun kutuphanesi modulu bulunamadi.' };
        }
        const planningRow = typeof ProductLibraryModule.getPlanningModelById === 'function'
            ? ProductLibraryModule.getPlanningModelById(rawId)
            : null;
        const variationId = (typeof ProductLibraryModule.getSalesVariationIdFromPlanningModelId === 'function'
            ? ProductLibraryModule.getSalesVariationIdFromPlanningModelId(rawId)
            : rawId) || '';
        let productId = String(planningRow?.sourceCatalogProductId || '').trim();
        if (!productId && variationId && typeof ProductLibraryModule.getAllSalesProductVariationRows === 'function') {
            const variationRow = ProductLibraryModule.getAllSalesProductVariationRows()
                .find((row) => String(row?.id || '').trim() === String(variationId || '').trim()) || null;
            productId = String(variationRow?.sourceCatalogProductId || '').trim();
        }
        if (!productId || !variationId) {
            return { ok: false, message: 'Secilen kayit satis varyasyonuna bagli degil.' };
        }
        const productRows = SalesModule.getCatalogProducts();
        const hasProduct = productRows.some((row) => String(row?.id || '').trim() === productId);
        if (!hasProduct) return { ok: false, message: 'Secilen urun katalogda bulunamadi.' };
        const hasVariation = SalesModule.getSalesVariationsForCatalogProduct(productId)
            .some((row) => String(row?.id || '').trim() === String(variationId || '').trim());
        if (!hasVariation) return { ok: false, message: 'Secilen varyant urun kaydiyla eslesmedi.' };
        return {
            ok: true,
            productId,
            variationId: String(variationId || '').trim()
        };
    },

    openSalesOrderLineProductLibraryPicker: (lineId) => {
        SalesModule.ensureSalesOrderDraft();
        const draft = SalesModule.state.salesOrderDraft;
        const targetLineId = String(lineId || '').trim();
        if (!draft || !targetLineId) return;
        const line = (Array.isArray(draft.lines) ? draft.lines : []).find((row) => String(row?.id || '').trim() === targetLineId);
        if (!line) return;
        const allProducts = SalesModule.getCatalogProducts();
        if (!allProducts.length) {
            alert('Katalog urunu bulunamadi. Once urun kutuphanesine kayit ekleyin.');
            return;
        }
        if (typeof ProductLibraryModule === 'undefined' || !ProductLibraryModule) {
            alert('Satis urun kutuphanesi acilamadi.');
            return;
        }
        SalesModule.state.salesOrderLineLibraryPickerPending = true;
        SalesModule.state.salesOrderLineLibraryPickerContext = {
            lineId: targetLineId,
            reopenModal: !!SalesModule.state.salesOrderEditorModalOpen
        };
        SalesModule.state.salesOrderLinePicker = null;
        if (SalesModule.state.salesOrderEditorModalOpen) {
            SalesModule.state.salesOrderEditorModalOpen = false;
            if (typeof Modal !== 'undefined' && Modal && typeof Modal.close === 'function') Modal.close();
        }
        if (typeof ProductLibraryModule.resetLibraryAccordionState === 'function') {
            ProductLibraryModule.resetLibraryAccordionState();
        }
        ProductLibraryModule.state.masterPickerSource = '';
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.planningPickerSource = 'model';
        ProductLibraryModule.state.workspaceView = 'sales-products';
        ProductLibraryModule.state.salesProductEntrySource = 'sales';
        ProductLibraryModule.state.salesProductDetailId = '';
        ProductLibraryModule.state.salesVariationEditorMode = '';
        ProductLibraryModule.state.salesVariationEditingId = '';
        ProductLibraryModule.state.salesVariationDraft = null;
        if (typeof Router !== 'undefined' && Router && typeof Router.navigate === 'function') {
            Router.navigate('products', { fromBack: true, preserveProductsState: true });
            return;
        }
        UI.renderCurrentPage();
    },

    selectSalesOrderLineFromLibrary: (modelId) => {
        SalesModule.ensureSalesOrderDraft();
        const draft = SalesModule.state.salesOrderDraft;
        const isPending = !!SalesModule.state.salesOrderLineLibraryPickerPending;
        if (!draft || !isPending) return false;
        const context = SalesModule.state.salesOrderLineLibraryPickerContext && typeof SalesModule.state.salesOrderLineLibraryPickerContext === 'object'
            ? SalesModule.state.salesOrderLineLibraryPickerContext
            : {};
        const targetLineId = String(context.lineId || '').trim();
        const resolved = SalesModule.resolveSalesOrderLineLibrarySelection(modelId);
        if (!resolved.ok) {
            alert(resolved.message || 'Secilen urun siparis satirina baglanamadi.');
            return false;
        }
        const lines = Array.isArray(draft.lines) ? draft.lines : [];
        let line = lines.find((item) => String(item?.id || '').trim() === targetLineId);
        if (!line) {
            line = SalesModule.createSalesOrderLineDraft();
            lines.push(line);
            draft.lines = lines;
        }
        line.productId = String(resolved.productId || '').trim();
        line.variationId = String(resolved.variationId || '').trim();
        line.isManualPrice = false;
        SalesModule.applyPriceSuggestionToOrderLine(line, draft);
        SalesModule.clearSalesOrderLineLibraryPickerState();
        SalesModule.restoreSalesOrderAfterLibraryPicker(context.reopenModal !== false);
        return true;
    },

    cancelSalesOrderLineLibraryPicker: () => {
        const context = SalesModule.state.salesOrderLineLibraryPickerContext && typeof SalesModule.state.salesOrderLineLibraryPickerContext === 'object'
            ? SalesModule.state.salesOrderLineLibraryPickerContext
            : {};
        SalesModule.clearSalesOrderLineLibraryPickerState();
        SalesModule.restoreSalesOrderAfterLibraryPicker(context.reopenModal !== false);
    },

    openSalesOrderLineProductPicker: (lineId) => {
        SalesModule.ensureSalesOrderDraft();
        const draft = SalesModule.state.salesOrderDraft;
        const targetLineId = String(lineId || '').trim();
        if (!draft || !targetLineId) return;
        const line = (Array.isArray(draft.lines) ? draft.lines : []).find((row) => String(row?.id || '').trim() === targetLineId);
        if (!line) return;

        const allProducts = SalesModule.getCatalogProducts();
        if (!allProducts.length) {
            alert('Katalog urunu bulunamadi. Once urun kutuphanesine kayit ekleyin.');
            return;
        }
        const categoryCounts = new Map();
        allProducts.forEach((row) => {
            const categoryId = String(row?.categoryId || '').trim();
            if (!categoryId) return;
            categoryCounts.set(categoryId, Number(categoryCounts.get(categoryId) || 0) + 1);
        });
        const leafNodes = SalesModule.getCatalogLeafNodes().filter((leaf) => Number(categoryCounts.get(String(leaf?.id || '').trim()) || 0) > 0);
        if (!leafNodes.length) {
            alert('Secilebilir kategori bulunamadi.');
            return;
        }

        const selectedProduct = allProducts.find((row) => String(row?.id || '').trim() === String(line?.productId || '').trim());
        const preferredCategoryId = String(selectedProduct?.categoryId || line?.categoryId || '').trim();
        const firstCategoryId = String(leafNodes[0]?.id || '').trim();
        const categoryId = leafNodes.some((leaf) => String(leaf?.id || '').trim() === preferredCategoryId)
            ? preferredCategoryId
            : firstCategoryId;
        SalesModule.state.salesOrderLinePicker = {
            lineId: targetLineId,
            categoryId,
            searchText: '',
            productId: String(selectedProduct?.id || '').trim()
        };
        SalesModule.renderSalesOrderLineProductPickerModal();
    },

    closeSalesOrderLineProductPicker: () => {
        SalesModule.state.salesOrderLinePicker = null;
        Modal.close();
    },

    setSalesOrderLinePickerField: (field, value) => {
        const picker = SalesModule.state.salesOrderLinePicker;
        if (!picker || typeof picker !== 'object') return;
        const key = String(field || '').trim();
        if (!key) return;
        if (key === 'categoryId') {
            picker.categoryId = String(value || '').trim();
            picker.productId = '';
        } else if (key === 'searchText') {
            picker.searchText = String(value || '');
        } else if (key === 'productId') {
            picker.productId = String(value || '').trim();
        }
        SalesModule.renderSalesOrderLineProductPickerModal({ reopen: true });
    },

    renderSalesOrderLineProductPickerModal: (options = {}) => {
        SalesModule.ensureSalesOrderDraft();
        const draft = SalesModule.state.salesOrderDraft;
        const picker = SalesModule.state.salesOrderLinePicker;
        if (!draft || !picker || typeof picker !== 'object') return;

        const targetLineId = String(picker.lineId || '').trim();
        const targetLine = (Array.isArray(draft.lines) ? draft.lines : []).find((row) => String(row?.id || '').trim() === targetLineId);
        if (!targetLine) {
            SalesModule.state.salesOrderLinePicker = null;
            return;
        }

        const products = SalesModule.getCatalogProducts();
        const categoryCounts = new Map();
        products.forEach((row) => {
            const categoryId = String(row?.categoryId || '').trim();
            if (!categoryId) return;
            categoryCounts.set(categoryId, Number(categoryCounts.get(categoryId) || 0) + 1);
        });
        const categories = SalesModule.getCatalogLeafNodes()
            .filter((leaf) => Number(categoryCounts.get(String(leaf?.id || '').trim()) || 0) > 0)
            .sort((a, b) => String(a?.label || '').localeCompare(String(b?.label || ''), 'tr'));
        if (!categories.length) {
            SalesModule.state.salesOrderLinePicker = null;
            alert('Secilebilir kategori bulunamadi.');
            return;
        }

        const selectedCategoryId = categories.some((leaf) => String(leaf?.id || '').trim() === String(picker.categoryId || '').trim())
            ? String(picker.categoryId || '').trim()
            : String(categories[0]?.id || '').trim();
        picker.categoryId = selectedCategoryId;

        const query = SalesModule.normalizeSearchText(picker.searchText || '');
        const categoryProducts = SalesModule.getCatalogProductsByCategory(selectedCategoryId)
            .filter((row) => {
                if (!query) return true;
                const bag = [
                    String(row?.name || ''),
                    String(row?.productCode || ''),
                    String(row?.idCode || ''),
                    String(row?.id || '')
                ].join(' ');
                return SalesModule.normalizeSearchText(bag).includes(query);
            });

        const selectedProductId = categoryProducts.some((row) => String(row?.id || '').trim() === String(picker.productId || '').trim())
            ? String(picker.productId || '').trim()
            : String(categoryProducts[0]?.id || '').trim();
        picker.productId = selectedProductId;
        const selectedProduct = categoryProducts.find((row) => String(row?.id || '').trim() === selectedProductId) || null;
        const variations = selectedProduct ? SalesModule.getSalesVariationsForCatalogProduct(selectedProduct.id) : [];

        const resolveColor = (obj = {}) => {
            const category = String(obj?.category || '').trim();
            const color = String(obj?.color || '').trim();
            if (category && color) return `${category} / ${color}`;
            return color || category || '-';
        };

        const modalHtml = `
            <div style="display:grid; grid-template-columns:300px minmax(0,1fr); gap:0.85rem; min-height:520px;">
                <div style="border:1px solid #dbe2ec; border-radius:0.75rem; padding:0.6rem; display:flex; flex-direction:column; gap:0.5rem; background:#f8fafc;">
                    <div style="font-size:0.82rem; color:#475569; font-weight:700;">Urun secimi</div>
                    <select class="stock-input stock-input-tall" onchange="SalesModule.setSalesOrderLinePickerField('categoryId', this.value)">
                        ${categories.map((leaf) => {
            const id = String(leaf?.id || '').trim();
            const selected = id === selectedCategoryId ? 'selected' : '';
            const count = Number(categoryCounts.get(id) || 0);
            const label = `${leaf?.mainLabel || ''} / ${leaf?.groupLabel || ''} / ${leaf?.label || ''}`;
            return `<option value="${SalesModule.escapeHtml(id)}" ${selected}>${SalesModule.escapeHtml(label)} (${count})</option>`;
        }).join('')}
                    </select>
                    <input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(picker.searchText || ''))}" oninput="SalesModule.setSalesOrderLinePickerField('searchText', this.value)" placeholder="urun adi / urun kodu / id kodu ara">
                    <div style="overflow:auto; border:1px solid #e2e8f0; border-radius:0.65rem; background:#fff; min-height:350px;">
                        ${!categoryProducts.length
                ? '<div style="padding:0.8rem; color:#94a3b8; font-size:0.84rem;">Aramaya uygun urun bulunamadi.</div>'
                : categoryProducts.map((row) => {
                    const id = String(row?.id || '').trim();
                    const active = id === selectedProductId;
                    const variantCount = SalesModule.getSalesVariationsForCatalogProduct(id).length;
                    return `
                                    <button type="button" onclick="SalesModule.setSalesOrderLinePickerField('productId','${SalesModule.escapeHtml(id)}')" style="width:100%; text-align:left; border:none; border-bottom:1px solid #f1f5f9; background:${active ? '#eff6ff' : '#fff'}; padding:0.55rem 0.58rem; cursor:pointer;">
                                        <div style="font-weight:700; color:${active ? '#1d4ed8' : '#0f172a'};">${SalesModule.escapeHtml(String(row?.name || '-'))}</div>
                                        <div style="font-size:0.73rem; color:#64748b; margin-top:0.14rem;">${SalesModule.escapeHtml(String(row?.productCode || '-'))} | ${SalesModule.escapeHtml(String(row?.idCode || '-'))}</div>
                                        <div style="font-size:0.72rem; color:#475569; margin-top:0.12rem;">varyant: ${variantCount}</div>
                                    </button>
                                `;
                }).join('')}
                    </div>
                </div>

                <div style="border:1px solid #dbe2ec; border-radius:0.75rem; padding:0.65rem; background:#fff; display:flex; flex-direction:column; gap:0.6rem;">
                    <div style="display:flex; justify-content:space-between; gap:0.65rem; align-items:flex-start; flex-wrap:wrap;">
                        <div>
                            <div style="font-size:0.76rem; color:#64748b;">Secilen satir</div>
                            <div style="font-size:0.86rem; font-weight:700; color:#0f172a;">${SalesModule.escapeHtml(`${(Array.isArray(draft.lines) ? draft.lines : []).findIndex((row) => String(row?.id || '').trim() === targetLineId) + 1}. satir`)}</div>
                            <div style="font-size:0.75rem; color:#64748b; margin-top:0.22rem;">${SalesModule.escapeHtml(SalesModule.getSalesLineUnitLabel(targetLine?.unit || 'adet'))}: ${SalesModule.escapeHtml(String(Number(targetLine?.qty || 1).toFixed(2)))}</div>
                        </div>
                        ${selectedProduct
                ? `<button class="btn-sm" type="button" onclick="SalesModule.openSalesCatalogVariationPage('${SalesModule.escapeHtml(String(selectedProduct.id || ''))}')">urun karti</button>`
                : ''}
                    </div>

                    ${selectedProduct
                ? `
                    <div style="font-size:0.9rem; font-weight:800; color:#0f172a;">${SalesModule.escapeHtml(String(selectedProduct?.name || '-'))}</div>
                    <div style="font-size:0.76rem; color:#475569;">${SalesModule.escapeHtml(String(selectedProduct?.productCode || '-'))} | ${SalesModule.escapeHtml(String(selectedProduct?.idCode || '-'))}</div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.7rem; overflow:auto;">
                        <table style="width:100%; min-width:900px; border-collapse:collapse;">
                            <thead>
                                <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                                    <th style="padding:0.35rem; text-align:left;">Varyant</th>
                                    <th style="padding:0.35rem; text-align:left;">Cap</th>
                                    <th style="padding:0.35rem; text-align:left;">Aksesuar</th>
                                    <th style="padding:0.35rem; text-align:left;">Boru</th>
                                    <th style="padding:0.35rem; text-align:left;">Pleksi</th>
                                    <th style="padding:0.35rem; text-align:left;">Kabarcik</th>
                                    <th style="padding:0.35rem; text-align:left;">Alt boru</th>
                                    <th style="padding:0.35rem; text-align:right;">Islem</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${!variations.length
                        ? '<tr><td colspan="8" style="padding:0.72rem; color:#94a3b8; text-align:center;">Bu urun icin varyant bulunamadi.</td></tr>'
                        : variations.map((row) => {
                            const variation = SalesModule.getSalesVariationRowById(selectedProduct.id, row.id) || row;
                            const accessory = variation?.colors?.accessory && typeof variation.colors.accessory === 'object'
                                ? variation.colors.accessory
                                : (selectedProduct?.colors?.accessory || {});
                            const tube = variation?.colors?.tube && typeof variation.colors.tube === 'object'
                                ? variation.colors.tube
                                : (selectedProduct?.colors?.tube || {});
                            const plexi = variation?.colors?.plexi && typeof variation.colors.plexi === 'object'
                                ? variation.colors.plexi
                                : (selectedProduct?.colors?.plexi || {});
                            return `
                                            <tr style="border-bottom:1px solid #f1f5f9;">
                                                <td style="padding:0.38rem; font-family:Consolas,monospace; color:#0f172a;">${SalesModule.escapeHtml(String(variation?.variantCode || row?.variantCode || '-'))}</td>
                                                <td style="padding:0.38rem;">${SalesModule.escapeHtml(String(variation?.selectedDiameter || selectedProduct?.selectedDiameter || '-'))}</td>
                                                <td style="padding:0.38rem;">${SalesModule.escapeHtml(resolveColor(accessory))}</td>
                                                <td style="padding:0.38rem;">${SalesModule.escapeHtml(resolveColor(tube))}</td>
                                                <td style="padding:0.38rem;">${SalesModule.escapeHtml(resolveColor(plexi))}</td>
                                                <td style="padding:0.38rem;">${SalesModule.escapeHtml(String(variation?.bubble || selectedProduct?.bubble || 'yok'))}</td>
                                                <td style="padding:0.38rem;">${SalesModule.escapeHtml(String(variation?.lowerTubeLengthMm || selectedProduct?.lowerTubeLength || 'standart'))}</td>
                                                <td style="padding:0.38rem; text-align:right;"><button class="btn-sm" type="button" onclick="SalesModule.selectSalesOrderLineVariation('${SalesModule.escapeHtml(targetLineId)}','${SalesModule.escapeHtml(String(selectedProduct.id || ''))}','${SalesModule.escapeHtml(String(row?.id || ''))}')">bu varyanti sec</button></td>
                                            </tr>
                                        `;
                        }).join('')}
                            </tbody>
                        </table>
                    </div>
                `
                : '<div style="padding:1rem; border:1px dashed #cbd5e1; border-radius:0.7rem; color:#64748b;">Soldan bir urun secerek varyantlarini ac.</div>'}

                    <div style="display:flex; justify-content:flex-end; gap:0.45rem; margin-top:auto;">
                        <button class="btn-sm" type="button" onclick="SalesModule.closeSalesOrderLineProductPicker()">kapat</button>
                    </div>
                </div>
            </div>
        `;
        if (options?.reopen === true) {
            Modal.close();
        }
        Modal.open('Siparis satiri urun secimi', modalHtml, { maxWidth: '1500px', closeExisting: false });
    },

    selectSalesOrderLineVariation: (lineId, productId, variationId) => {
        SalesModule.ensureSalesOrderDraft();
        const draft = SalesModule.state.salesOrderDraft;
        const targetLineId = String(lineId || '').trim();
        const targetProductId = String(productId || '').trim();
        const targetVariationId = String(variationId || '').trim();
        if (!draft || !targetLineId || !targetProductId || !targetVariationId) return;
        const line = (Array.isArray(draft.lines) ? draft.lines : []).find((item) => String(item?.id || '').trim() === targetLineId);
        if (!line) return;
        line.productId = targetProductId;
        line.variationId = targetVariationId;
        line.isManualPrice = false;
        SalesModule.applyPriceSuggestionToOrderLine(line, draft);
        SalesModule.state.salesOrderLinePicker = null;
        Modal.close();
        SalesModule.refreshSalesOrderUi();
    },

    removeSalesOrderLine: (lineId) => {
        SalesModule.ensureSalesOrderDraft();
        const draft = SalesModule.state.salesOrderDraft;
        const targetId = String(lineId || '').trim();
        if (!draft || !targetId) return;
        if (!confirm('Satir kalici olarak silinsin mi?')) return;
        draft.lines = (Array.isArray(draft.lines) ? draft.lines : [])
            .filter((line) => String(line?.id || '').trim() !== targetId);
        SalesModule.refreshSalesOrderUi();
    },

    setSalesOrderLineField: (lineId, field, value) => {
        SalesModule.ensureSalesOrderDraft();
        const draft = SalesModule.state.salesOrderDraft;
        if (!draft || typeof draft !== 'object') return;
        const targetId = String(lineId || '').trim();
        const key = String(field || '').trim();
        if (!targetId || !key) return;
        const line = (Array.isArray(draft.lines) ? draft.lines : []).find((item) => String(item?.id || '') === targetId);
        if (!line) return;

        if (key === 'qty') {
            line.qty = SalesModule.parseSalesQuantity(value, 1);
            if (!line.isManualPrice) SalesModule.applyPriceSuggestionToOrderLine(line, draft);
            SalesModule.refreshSalesOrderUi();
            return;
        }
        if (key === 'unit') {
            line.unit = SalesModule.normalizeSalesLineUnit(value || 'adet');
            SalesModule.refreshSalesOrderUi();
            return;
        }
        if (key === 'unitPrice') {
            const unitPrice = Number(String(value || '').replace(',', '.'));
            line.unitPrice = Number.isFinite(unitPrice) ? Math.max(0, Number(unitPrice.toFixed(2))) : 0;
            line.isManualPrice = true;
            SalesModule.refreshSalesOrderUi();
            return;
        }
        if (key === 'productId') {
            line.productId = String(value || '').trim();
            line.variationId = '';
            line.isManualPrice = false;
            SalesModule.applyPriceSuggestionToOrderLine(line, draft);
            SalesModule.refreshSalesOrderUi();
            return;
        }
        if (key === 'variationId') {
            line.variationId = String(value || '').trim();
            line.isManualPrice = false;
            SalesModule.applyPriceSuggestionToOrderLine(line, draft);
            SalesModule.refreshSalesOrderUi();
            return;
        }
    },

    applyRecommendedPriceToLine: (lineId) => {
        SalesModule.ensureSalesOrderDraft();
        const draft = SalesModule.state.salesOrderDraft;
        const targetId = String(lineId || '').trim();
        if (!draft || !targetId) return;
        const line = (Array.isArray(draft.lines) ? draft.lines : []).find((item) => String(item?.id || '') === targetId);
        if (!line) return;
        line.isManualPrice = false;
        SalesModule.applyPriceSuggestionToOrderLine(line, draft);
        SalesModule.refreshSalesOrderUi();
    },

    resetSalesOrderDraft: () => {
        SalesModule.state.salesOrderDraft = SalesModule.buildSalesOrderDraft();
        SalesModule.refreshSalesOrderUi();
    },

    refreshSalesOrderUi: () => {
        if (SalesModule.state.salesOrderEditorModalOpen) {
            SalesModule.renderSalesOrderEditorModal();
            return;
        }
        UI.renderCurrentPage();
    },

    hasSalesOrderDraftChanges: (draft = null) => {
        const source = draft && typeof draft === 'object' ? draft : SalesModule.state.salesOrderDraft;
        if (!source || typeof source !== 'object') return false;
        if (String(source.customerId || '').trim()) return true;
        if (String(source.deliveryAddress || '').trim()) return true;
        if (String(source.note || '').trim()) return true;
        if (String(source.paymentMethod || '').trim() && SalesModule.normalize(String(source.paymentMethod || '')) !== 'nakit') return true;
        if (Number(source.globalDiscountRate || 0) > 0) return true;
        if (SalesModule.normalizeSalesCurrency(source.currency || 'USD') !== 'USD') return true;
        if (Number(source.exchangeRate || 0) > 0) return true;
        if (Number(source.deliveryLeadDays || 0) > 0) return true;
        if (Number(source.vatRate || 20) === 0) return true;
        const lines = Array.isArray(source.lines) ? source.lines : [];
        return lines.some((line) => {
            if (!line || typeof line !== 'object') return false;
            if (String(line.productId || '').trim()) return true;
            if (String(line.variationId || '').trim()) return true;
            if (Number(line.unitPrice || 0) > 0) return true;
            const qty = Number(line.qty || 0);
            return Math.abs(qty - 1) > 0.0001;
        });
    },

    openSalesOrderEditorModal: (options = {}) => {
        SalesModule.ensureSalesOrderDraft();
        if (options?.reset === true) {
            SalesModule.state.salesOrderDraft = SalesModule.buildSalesOrderDraft();
        }
        SalesModule.clearSalesOrderLineLibraryPickerState();
        SalesModule.state.salesOrderLinePicker = null;
        SalesModule.state.salesPaymentMethodDraft = '';
        SalesModule.state.salesOrderEditorModalOpen = true;
        SalesModule.renderSalesOrderEditorModal();
    },

    renderSalesOrderEditorModal: () => {
        SalesModule.ensureSalesOrderDraft();
        const html = `
            <div style="padding:0;">
                ${SalesModule.renderSalesOrderEditorCardHtml({ inModal: true })}
            </div>
        `;
        Modal.open('Siparis olusturma', html, { maxWidth: '2200px', showHeader: false });
    },

    closeSalesOrderEditorModal: () => {
        SalesModule.state.salesOrderEditorModalOpen = false;
        SalesModule.clearSalesOrderLineLibraryPickerState();
        SalesModule.state.salesOrderLinePicker = null;
        SalesModule.state.salesPaymentMethodDraft = '';
        Modal.close();
        UI.renderCurrentPage();
    },

    openNewOrderModal: () => {
        SalesModule.openSalesOrderEditorModal({ reset: true });
    },

    setSalesWorkspaceTab: (tabId) => {
        const next = String(tabId || 'ORDERS').trim().toUpperCase();
        SalesModule.state.salesWorkspaceTab = ['ORDERS', 'QUOTES', 'ARCHIVE'].includes(next) ? next : 'ORDERS';
        UI.renderCurrentPage();
    },

    setSalesOrderHistoryFilter: (field, value) => {
        SalesModule.ensureSalesOrderHistoryFilters();
        const key = String(field || '').trim();
        if (!key) return;
        const filters = SalesModule.state.salesOrderHistoryFilters || SalesModule.buildSalesOrderHistoryFilters();
        if (key === 'query') filters.query = String(value || '').trim();
        if (key === 'status') {
            const next = String(value || 'ALL').trim().toUpperCase();
            filters.status = ['ALL', 'WAITING', 'APPROVED', 'ARCHIVED', 'CANCELLED'].includes(next) ? next : 'ALL';
        }
        if (key === 'period') {
            const next = String(value || 'ALL').trim().toUpperCase();
            filters.period = ['ALL', 'TODAY', 'THIS_WEEK', 'THIS_MONTH'].includes(next) ? next : 'ALL';
        }
        SalesModule.state.salesOrderHistoryFilters = filters;
        UI.renderCurrentPage();
    },

    getSalesWorkspaceRows: () => {
        const rows = SalesModule.getFilteredSalesOrderHistoryRows(SalesModule.getSalesOrderHistoryRows());
        const tab = String(SalesModule.state.salesWorkspaceTab || 'ORDERS').trim().toUpperCase();
        return rows.filter((row) => {
            if (tab === 'ARCHIVE') return String(row?.statusGroup || '') === 'ARCHIVED';
            if (tab === 'QUOTES') return ['WAITING', 'APPROVED'].includes(String(row?.statusGroup || ''));
            return String(row?.statusGroup || '') !== 'ARCHIVED';
        });
    },

    openSalesOrderForEdit: (orderId) => {
        SalesModule.ensureData();
        const targetId = String(orderId || '').trim();
        if (!targetId) return;
        const rows = Array.isArray(DB.data?.data?.orders) ? DB.data.data.orders : [];
        const row = rows.find((item) => String(item?.id || '').trim() === targetId);
        if (!row) return alert('Kayit bulunamadi.');
        SalesModule.state.salesOrderDraft = SalesModule.buildSalesOrderDraft({
            ...row,
            editingOrderId: targetId,
            lines: (Array.isArray(row?.lines) ? row.lines : []).map((line) => ({
                id: String(line?.id || crypto.randomUUID()),
                productId: String(line?.productId || '').trim(),
                variationId: String(line?.variationId || '').trim(),
                unit: SalesModule.normalizeSalesLineUnit(line?.unit || line?.quantityUnit || 'adet'),
                qty: Number(line?.qty || 1),
                unitPrice: Number(line?.unitPrice || 0),
                isManualPrice: true
            }))
        });
        if (!Array.isArray(SalesModule.state.salesOrderDraft.lines) || !SalesModule.state.salesOrderDraft.lines.length) {
            SalesModule.state.salesOrderDraft.lines = [SalesModule.createSalesOrderLineDraft()];
        }
        SalesModule.openSalesOrderEditorModal({ reset: false });
    },

    deleteSalesOrder: async (orderId) => {
        SalesModule.ensureData();
        const targetId = String(orderId || '').trim();
        if (!targetId) return;
        if (!confirm('Siparis kaydi kalici olarak silinsin mi?')) return;
        const rows = Array.isArray(DB.data?.data?.orders) ? DB.data.data.orders : [];
        const next = rows.filter((row) => String(row?.id || '').trim() !== targetId);
        DB.data.data.orders = next;
        await DB.save();
        UI.renderCurrentPage();
    },

    setSalesOrderStatus: async (orderId, statusText) => {
        SalesModule.ensureData();
        const targetId = String(orderId || '').trim();
        if (!targetId) return;
        const rows = Array.isArray(DB.data?.data?.orders) ? DB.data.data.orders : [];
        const idx = rows.findIndex((row) => String(row?.id || '').trim() === targetId);
        if (idx < 0) return;
        const nextStatus = String(statusText || '').trim() || rows[idx].status || 'Onay Bekliyor';
        rows[idx].status = nextStatus;
        if (SalesModule.normalize(nextStatus).includes('onay') && !String(rows[idx].approvalDate || '').trim()) {
            rows[idx].approvalDate = new Date().toISOString().slice(0, 10);
        }
        rows[idx].updated_at = new Date().toISOString();
        await DB.save();
        UI.renderCurrentPage();
    },

    buildSalesOrderComparableSignature: (orderLike = {}) => {
        const source = orderLike && typeof orderLike === 'object' ? orderLike : {};
        const normalized = {
            customerId: String(source.customerId || '').trim(),
            orderDate: String(source.orderDate || '').trim(),
            currency: SalesModule.normalizeSalesCurrency(source.currency || 'USD'),
            exchangeRate: Number(Number(source.exchangeRate || 0).toFixed(4)),
            globalDiscountRate: Number(Number(source.globalDiscountRate || 0).toFixed(2)),
            vatRate: Number(source.vatRate || 20) === 0 ? 0 : 20,
            deliveryLeadDays: SalesModule.parseDays(source.deliveryLeadDays || 0),
            deliveryAddress: String(source.deliveryAddress || '').trim(),
            paymentMethod: String(source.paymentMethod || '').trim(),
            note: String(source.note || '').trim(),
            lines: (Array.isArray(source.lines) ? source.lines : [])
                .map((line) => ({
                    productId: String(line?.productId || '').trim(),
                    variationId: String(line?.variationId || '').trim(),
                    unit: SalesModule.normalizeSalesLineUnit(line?.unit || line?.quantityUnit || 'adet'),
                    qty: SalesModule.parseSalesQuantity(line?.qty, 1),
                    unitPrice: Number(Number(line?.unitPrice || 0).toFixed(2))
                }))
                .sort((a, b) => {
                    const aKey = `${a.productId}|${a.variationId}|${a.unit}|${a.qty}|${a.unitPrice}`;
                    const bKey = `${b.productId}|${b.variationId}|${b.unit}|${b.qty}|${b.unitPrice}`;
                    return aKey.localeCompare(bKey, 'tr');
                })
        };
        return JSON.stringify(normalized);
    },

    buildSalesOrderLinePayloads: (lines = []) => {
        const productMap = new Map(SalesModule.getCatalogProducts().map((row) => [String(row.id || ''), row]));
        const resolveColorText = (source = {}) => {
            const category = String(source?.category || '').trim();
            const color = String(source?.color || '').trim();
            if (category && color) return `${category} / ${color}`;
            return color || category || '-';
        };
        return (Array.isArray(lines) ? lines : []).map((line) => {
            const product = productMap.get(String(line.productId || '')) || {};
            const variation = SalesModule.getSalesVariationRowById(String(line.productId || ''), String(line.variationId || '')) || {};
            const selectedDiameter = String(variation?.selectedDiameter || product?.selectedDiameter || '').trim();
            const lowerTubeLength = String(variation?.lowerTubeLengthMm || product?.lowerTubeLength || 'standart').trim() || 'standart';
            const bubble = String(variation?.bubble || product?.bubble || 'yok').trim() === 'var' ? 'var' : 'yok';
            const accessory = variation?.colors?.accessory && typeof variation.colors.accessory === 'object'
                ? variation.colors.accessory
                : (product?.colors?.accessory || {});
            const tube = variation?.colors?.tube && typeof variation.colors.tube === 'object'
                ? variation.colors.tube
                : (product?.colors?.tube || {});
            const plexi = variation?.colors?.plexi && typeof variation.colors.plexi === 'object'
                ? variation.colors.plexi
                : (product?.colors?.plexi || {});
            const normalizedUnit = SalesModule.normalizeSalesLineUnit(line.unit || line.quantityUnit || 'adet');
            return {
                id: String(line.id || crypto.randomUUID()),
                productId: String(line.productId || '').trim(),
                variationId: String(line.variationId || '').trim(),
                variantCode: String(variation?.variantCode || '-').trim(),
                productName: String(product?.name || variation?.productName || '-').trim(),
                productCode: String(product?.productCode || '-').trim(),
                idCode: String(product?.idCode || '-').trim(),
                selectedDiameter,
                accessoryColor: resolveColorText(accessory),
                tubeColor: resolveColorText(tube),
                plexiColor: resolveColorText(plexi),
                bubble,
                lowerTubeLength,
                unit: normalizedUnit,
                quantityUnit: normalizedUnit,
                qty: SalesModule.parseSalesQuantity(line.qty, 1),
                unitPrice: Number(Number(line.unitPrice || 0).toFixed(2)),
                lineSubtotal: Number(Number(line.lineSubtotal || 0).toFixed(2)),
                lineTotal: Number(Number(line.lineTotal || 0).toFixed(2))
            };
        });
    },

    buildSalesOrderPreviewPayloadFromDraft: (draft = null) => {
        SalesModule.ensureSalesOrderDraft();
        const source = draft && typeof draft === 'object' ? draft : SalesModule.state.salesOrderDraft;
        if (!source || typeof source !== 'object') return null;
        const customer = SalesModule.getCustomerById(source.customerId);
        if (!customer) return null;
        const totals = SalesModule.computeSalesOrderTotals(source);
        const lines = SalesModule.buildSalesOrderLinePayloads(
            totals.lines.filter((line) => String(line?.productId || '').trim())
        );
        return {
            orderNo: String(source.orderNo || source.orderCode || 'ONIZLEME').trim(),
            orderDate: String(source.orderDate || new Date().toISOString().slice(0, 10)).trim(),
            customerId: String(customer.id || '').trim(),
            customerName: String(customer.name || '-').trim(),
            customerDisplayId: String(customer.externalCode || customer.customerCode || customer.id || '-').trim(),
            status: String(source.status || 'Onay Bekliyor').trim() || 'Onay Bekliyor',
            currency: SalesModule.normalizeSalesCurrency(source.currency || 'USD'),
            exchangeRate: Number(Number(source.exchangeRate || 0).toFixed(4)),
            preparedBy: String(source.preparedBy || SalesModule.getCurrentEditorName()).trim(),
            globalDiscountRate: Number(Number(source.globalDiscountRate || 0).toFixed(2)),
            vatRate: Number(source.vatRate || 20) === 0 ? 0 : 20,
            deliveryLeadDays: SalesModule.parseDays(source.deliveryLeadDays || 0),
            deliveryAddress: String(source.deliveryAddress || '').trim(),
            paymentMethod: String(source.paymentMethod || 'Nakit').trim() || 'Nakit',
            note: String(source.note || '').trim(),
            lines,
            subtotal: totals.subtotal,
            discountTotal: totals.discountTotal,
            taxBase: totals.taxBase,
            vatTotal: totals.vatTotal,
            totalAmount: totals.grandTotal,
            grandTotal: totals.grandTotal
        };
    },

    previewCurrentSalesOrderProforma: () => {
        const payload = SalesModule.buildSalesOrderPreviewPayloadFromDraft();
        if (!payload) return alert('Onizleme icin once musteri secmelisin.');
        const html = SalesModule.buildProformaPreviewDocumentHtml(SalesModule.getProformaSettings(), payload);
        Modal.open('Proforma goruntule', html, { maxWidth: '1260px', closeExisting: false });
    },

    previewSavedSalesOrderProforma: (orderId) => {
        SalesModule.ensureData();
        const targetId = String(orderId || '').trim();
        if (!targetId) return;
        const rows = Array.isArray(DB.data?.data?.orders) ? DB.data.data.orders : [];
        const order = rows.find((row) => String(row?.id || '').trim() === targetId);
        if (!order) return alert('Kayit bulunamadi.');
        const html = SalesModule.buildProformaPreviewDocumentHtml(SalesModule.getProformaSettings(), order);
        Modal.open('Proforma goruntule', html, { maxWidth: '1260px' });
    },

    convertSalesOrderPlaceholder: () => {
        alert('Siparise donustur akisi sonraki asamada uretim modulu ile baglanacak. Su an tetikleme kapali.');
    },

    addSalesOrderLineAnchoragePlaceholder: (lineId) => {
        const targetId = String(lineId || '').trim();
        if (!targetId) return;
        alert('Ankraj ekleme akisini bir sonraki adimda birlikte tamamlayacagiz.');
    },

    addSalesOrderAnchoragePlaceholder: () => {
        alert('Ankraj ekle butonu hazir. Detay akisina bir sonraki adimda gececegiz.');
    },

    generateSalesOrderNo: () => {
        const rows = Array.isArray(DB.data?.data?.orders) ? DB.data.data.orders : [];
        let maxSeq = 0;
        rows.forEach((row) => {
            const code = String(row?.orderNo || row?.orderCode || '').trim().toUpperCase();
            const match = code.match(/^SOR-(\d{6})$/);
            if (!match) return;
            const seq = Number(match[1] || 0);
            if (seq > maxSeq) maxSeq = seq;
        });
        return `SOR-${String(maxSeq + 1).padStart(6, '0')}`;
    },

    saveSalesOrderDraft: async () => {
        SalesModule.ensureData();
        SalesModule.ensureSalesOrderDraft();
        const draft = SalesModule.state.salesOrderDraft;
        if (!draft || typeof draft !== 'object') return;
        const customer = SalesModule.getCustomerById(draft.customerId);
        if (!customer) return alert('Proforma icin musteri secmelisin.');
        if (SalesModule.normalizeSalesCurrency(draft.currency) !== 'TL' && !(Number(draft.exchangeRate || 0) > 0)) {
            return alert('USD/EUR icin kur alani zorunludur.');
        }
        if (!(Number(draft.deliveryLeadDays || 0) > 0)) {
            return alert('Teslim tarihi kurali (onaydan sonra kac gun) zorunludur.');
        }
        const totals = SalesModule.computeSalesOrderTotals(draft);
        const lineIssues = [];
        const validLines = totals.lines
            .map((line, index) => {
                const rowNo = index + 1;
                const productId = String(line?.productId || '').trim();
                const variationId = String(line?.variationId || '').trim();
                const qty = SalesModule.parseSalesQuantity(line?.qty, 1);
                const unitPrice = Number(line?.unitPrice || 0);
                const quantityLabel = SalesModule.getSalesLineUnitLabel(line?.unit || 'adet');
                if (!productId) lineIssues.push(`${rowNo}. satir: Urun secmelisin.`);
                if (!variationId) lineIssues.push(`${rowNo}. satir: Varyant secmelisin.`);
                if (!(qty > 0)) lineIssues.push(`${rowNo}. satir: ${quantityLabel} miktari 0'dan buyuk olmali.`);
                if (!(unitPrice > 0)) lineIssues.push(`${rowNo}. satir: Birim fiyat zorunludur.`);
                return {
                    ...line,
                    productId,
                    variationId,
                    qty,
                    unitPrice: Number(unitPrice.toFixed(2))
                };
            })
            .filter((line) => line.productId);
        if (!validLines.length) return alert('En az bir urun satiri eklemelisin.');
        if (lineIssues.length) return alert(lineIssues.slice(0, 6).join('\n'));
        const now = new Date().toISOString();
        const editorName = SalesModule.getCurrentEditorName();
        const rowPayload = SalesModule.buildSalesOrderLinePayloads(validLines);

        const basePayload = {
            orderType: 'PROFORMA',
            orderDate: String(draft.orderDate || '').trim() || new Date().toISOString().slice(0, 10),
            customerId: String(customer.id || '').trim(),
            customerName: String(customer.name || '').trim(),
            customerDisplayId: String(customer.externalCode || customer.customerCode || customer.id || '-').trim(),
            status: String(draft.status || 'Onay Bekliyor').trim() || 'Onay Bekliyor',
            currency: SalesModule.normalizeSalesCurrency(draft.currency || 'USD'),
            exchangeRate: Number(Number(draft.exchangeRate || 0).toFixed(4)),
            preparedBy: String(draft.preparedBy || editorName).trim() || editorName,
            globalDiscountRate: Number(Number(draft.globalDiscountRate || 0).toFixed(2)),
            vatRate: Number(draft.vatRate || 20) === 0 ? 0 : 20,
            deliveryLeadDays: SalesModule.parseDays(draft.deliveryLeadDays || 0),
            deliveryAddress: String(draft.deliveryAddress || '').trim(),
            paymentMethod: String(draft.paymentMethod || 'Nakit').trim() || 'Nakit',
            deliveryMethod: String(draft.paymentMethod || 'Nakit').trim() || 'Nakit',
            note: String(draft.note || '').trim(),
            lines: rowPayload,
            subtotal: totals.subtotal,
            discountRate: totals.discountRate,
            discountTotal: totals.discountTotal,
            taxBase: totals.taxBase,
            vatTotal: totals.vatTotal,
            totalAmount: totals.grandTotal,
            grandTotal: totals.grandTotal,
            updated_at: now
        };

        const store = Array.isArray(DB.data?.data?.orders) ? DB.data.data.orders : [];
        const editingId = String(draft.editingOrderId || '').trim();
        const idx = editingId ? store.findIndex((row) => String(row?.id || '').trim() === editingId) : -1;
        let savedOrderNo = '';
        if (idx >= 0) {
            const prev = store[idx] || {};
            const prevSignature = SalesModule.buildSalesOrderComparableSignature(prev);
            const nextSignature = SalesModule.buildSalesOrderComparableSignature(basePayload);
            const hasChange = prevSignature !== nextSignature;
            const nextRevisionNo = hasChange ? (Math.max(1, Number(prev?.revisionNo || 1)) + 1) : Math.max(1, Number(prev?.revisionNo || 1));
            const revisionHistory = Array.isArray(prev?.revisionHistory) ? prev.revisionHistory.slice() : [];
            if (hasChange) {
                revisionHistory.push({
                    version: `v${nextRevisionNo}`,
                    editor: editorName,
                    at: now
                });
            }
            store[idx] = {
                ...prev,
                ...basePayload,
                id: String(prev.id || editingId || crypto.randomUUID()),
                orderNo: String(prev.orderNo || prev.orderCode || SalesModule.generateSalesOrderNo()),
                created_at: String(prev.created_at || now),
                revisionNo: nextRevisionNo,
                revisionHistory
            };
            if (!hasChange) {
                alert('Kayitta degisiklik algilanmadi.');
                UI.renderCurrentPage();
                return;
            }
            savedOrderNo = String(store[idx].orderNo || '-');
        } else {
            const newOrder = {
                ...basePayload,
                id: crypto.randomUUID(),
                orderNo: SalesModule.generateSalesOrderNo(),
                created_at: now,
                revisionNo: 1,
                revisionHistory: [{
                    version: 'v1',
                    editor: editorName,
                    at: now
                }]
            };
            store.push(newOrder);
            savedOrderNo = String(newOrder.orderNo || '-');
        }
        customer.preferredCurrency = SalesModule.normalizeSalesCurrency(draft.currency || 'USD');
        customer.defaultPaymentMethod = String(draft.paymentMethod || 'Nakit').trim() || 'Nakit';
        SalesModule.upsertSalesPaymentMethod(draft.paymentMethod || '');
        await DB.save();
        alert(`Proforma kaydedildi: ${savedOrderNo}`);
        SalesModule.state.salesOrderDraft = SalesModule.buildSalesOrderDraft({
            customerId: String(customer.id || '').trim(),
            deliveryAddress: String(draft.deliveryAddress || '').trim(),
            paymentMethod: String(draft.paymentMethod || 'Nakit').trim() || 'Nakit',
            currency: SalesModule.normalizeSalesCurrency(draft.currency || 'USD')
        });
        if (SalesModule.state.salesOrderEditorModalOpen) {
            SalesModule.state.salesOrderEditorModalOpen = false;
            Modal.close();
        }
        UI.renderCurrentPage();
    },

    hasProformaSettingsChanges: () => {
        const draft = SalesModule.state.proformaSettingsDraft;
        if (!draft) return false;
        const baseline = String(SalesModule.state.proformaSettingsSnapshot || '');
        if (!baseline) return false;
        return SalesModule.serializeProformaSettings(draft) !== baseline;
    },

    setProformaSettingsDraftField: (field, value) => {
        if (!SalesModule.state.proformaSettingsDraft || typeof SalesModule.state.proformaSettingsDraft !== 'object') return;
        const key = String(field || '').trim();
        if (!key) return;
        SalesModule.state.proformaSettingsDraft[key] = String(value || '');
    },

    setProformaBankDraftField: (field, value) => {
        const key = String(field || '').trim();
        if (!key) return;
        const next = (SalesModule.state.proformaBankDraft && typeof SalesModule.state.proformaBankDraft === 'object')
            ? SalesModule.state.proformaBankDraft
            : { bankName: '', branchCode: '', accountNo: '', iban: '' };
        next[key] = String(value || '');
        SalesModule.state.proformaBankDraft = next;
    },

    addProformaBankAccount: () => {
        const draft = SalesModule.state.proformaSettingsDraft;
        if (!draft || typeof draft !== 'object') return;
        const nextBank = SalesModule.normalizeProformaBankAccount({
            id: crypto.randomUUID(),
            bankName: SalesModule.state.proformaBankDraft?.bankName,
            branchCode: SalesModule.state.proformaBankDraft?.branchCode,
            accountNo: SalesModule.state.proformaBankDraft?.accountNo,
            iban: SalesModule.state.proformaBankDraft?.iban
        });
        if (!nextBank.bankName) {
            alert('Banka adi zorunlu.');
            return;
        }
        if (!nextBank.iban) {
            alert('IBAN zorunlu.');
            return;
        }
        const list = Array.isArray(draft.bankAccounts) ? draft.bankAccounts : [];
        list.push(nextBank);
        draft.bankAccounts = list;
        SalesModule.state.proformaBankDraft = { bankName: '', branchCode: '', accountNo: '', iban: '' };
        UI.renderCurrentPage();
    },

    removeProformaBankAccount: (id) => {
        const targetId = String(id || '').trim();
        if (!targetId) return;
        const draft = SalesModule.state.proformaSettingsDraft;
        if (!draft || typeof draft !== 'object') return;
        if (!confirm('Banka hesabi silinsin mi?')) return;
        draft.bankAccounts = (Array.isArray(draft.bankAccounts) ? draft.bankAccounts : [])
            .filter((row) => String(row?.id || '').trim() !== targetId);
        UI.renderCurrentPage();
    },

    handleProformaLogoInput: (input) => {
        const file = input?.files?.[0];
        if (!file) return;
        const type = String(file.type || '').toLowerCase();
        if (!(type.includes('png') || type.includes('jpeg') || type.includes('jpg'))) {
            alert('Logo icin PNG veya JPG dosyasi secin.');
            if (input) input.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const draft = SalesModule.state.proformaSettingsDraft;
            if (!draft || typeof draft !== 'object') return;
            draft.logoDataUrl = String(reader.result || '');
            draft.logoFileName = String(file.name || '').trim();
            UI.renderCurrentPage();
        };
        reader.readAsDataURL(file);
        if (input) input.value = '';
    },

    clearProformaLogo: () => {
        const draft = SalesModule.state.proformaSettingsDraft;
        if (!draft || typeof draft !== 'object') return;
        draft.logoDataUrl = '';
        draft.logoFileName = '';
        UI.renderCurrentPage();
    },

    cancelProformaSettings: () => {
        if (SalesModule.hasProformaSettingsChanges()) {
            const proceed = confirm('Kaydedilmemis degisiklikler var. Ayarlar sayfasina donulsun mu?');
            if (!proceed) return;
        }
        SalesModule.openWorkspace('settings');
    },

    saveProformaSettings: async () => {
        SalesModule.ensureSettingsData();
        const draft = SalesModule.state.proformaSettingsDraft;
        if (!draft || typeof draft !== 'object') return;
        const normalized = SalesModule.normalizeProformaSettings(draft);
        const invalidRow = normalized.bankAccounts.find((row) => !row.bankName || !row.iban);
        if (invalidRow) {
            alert('Banka hesaplarinda banka adi ve IBAN zorunludur.');
            return;
        }
        DB.data.data.salesSettings.proforma = normalized;
        await DB.save();
        SalesModule.state.proformaSettingsDraft = SalesModule.buildProformaSettingsDraft(normalized);
        SalesModule.state.proformaSettingsSnapshot = SalesModule.serializeProformaSettings(normalized);
        alert('Proforma ayarlari kaydedildi.');
        UI.renderCurrentPage();
    },

    buildProformaPreviewDocumentHtml: (draft = {}, orderData = null) => {
        const settings = SalesModule.normalizeProformaSettings(draft || {});
        const logoDataUrl = String(settings.logoDataUrl || '').trim();
        const bankAccounts = Array.isArray(settings.bankAccounts) ? settings.bankAccounts : [];
        const sampleOrder = {
            orderNo: 'ONIZLEME',
            orderDate: new Date().toISOString().slice(0, 10),
            customerName: 'Musteri secilmedi',
            status: 'Onay Bekliyor',
            currency: 'USD',
            exchangeRate: 45,
            preparedBy: SalesModule.getCurrentEditorName(),
            globalDiscountRate: 0,
            vatRate: 20,
            deliveryLeadDays: 7,
            deliveryAddress: '-',
            paymentMethod: 'Nakit',
            note: '',
            lines: [{
                productName: 'Ornek urun',
                productCode: 'ORNEK-001',
                idCode: 'SAL-000001',
                selectedDiameter: '40',
                accessoryColor: '-',
                tubeColor: '-',
                plexiColor: '-',
                bubble: 'yok',
                lowerTubeLength: 'standart',
                qty: 1,
                unitPrice: 10,
                lineTotal: 10
            }]
        };
        const order = orderData && typeof orderData === 'object' ? orderData : sampleOrder;
        const currency = SalesModule.normalizeSalesCurrency(order.currency || 'USD');
        const exchangeRate = Number(order.exchangeRate || 0);
        const discountRate = SalesModule.parsePercent(order.globalDiscountRate ?? order.discountRate ?? 0);
        const vatRate = Number(order.vatRate || 20) === 0 ? 0 : 20;
        const rawLines = Array.isArray(order.lines) ? order.lines : [];
        const lines = rawLines.map((line) => {
            const qty = SalesModule.parseSalesQuantity(line?.qty, 1);
            const unitPrice = Number(Number(line?.unitPrice || 0).toFixed(2));
            const lineSubtotal = Number((qty * unitPrice).toFixed(2));
            const lineTotal = Number(line?.lineTotal || line?.lineSubtotal || lineSubtotal);
            return {
                ...line,
                qty,
                unitPrice,
                lineSubtotal,
                lineTotal: Number(lineTotal.toFixed(2))
            };
        });

        const subtotalRaw = lines.reduce((sum, line) => sum + Number(line?.lineTotal || line?.lineSubtotal || 0), 0);
        const subtotal = Number(subtotalRaw.toFixed(2));
        const discountTotal = Number((subtotal * (discountRate / 100)).toFixed(2));
        const taxBase = Number((subtotal - discountTotal).toFixed(2));
        const vatTotal = Number((taxBase * (vatRate / 100)).toFixed(2));
        const grandTotal = Number((taxBase + vatTotal).toFixed(2));
        const totalTl = currency === 'TL'
            ? grandTotal
            : (exchangeRate > 0 ? Number((grandTotal * exchangeRate).toFixed(2)) : 0);

        const formatter = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const fmtMoney = (value, curr = currency) => {
            const amount = Number(value || 0);
            if (curr === 'USD') return `$${formatter.format(amount)}`;
            if (curr === 'EUR') return `${formatter.format(amount)} EUR`;
            return `${formatter.format(amount)} TL`;
        };
        const fmtQty = (value) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0));
        const notesBag = [String(settings.defaultNotes || '').trim(), String(order.note || '').trim()].filter(Boolean).join('\n');
        const notesHtml = SalesModule.escapeHtml(notesBag || 'Not girilmedi.').replace(/\n/g, '<br>');
        const statusMeta = SalesModule.getSalesOrderStatusMeta(order.status);
        const logoHtml = logoDataUrl
            ? `<img src="${SalesModule.escapeHtml(logoDataUrl)}" alt="logo" style="max-height:72px; max-width:220px; object-fit:contain;">`
            : '<div style="font-size:2.8rem; font-style:italic; font-weight:700; color:#334155; letter-spacing:0.01em;">dulda</div>';

        const bankRowsHtml = bankAccounts.length === 0
            ? `<tr><td style="padding:0.32rem 0.35rem; border-bottom:1px solid #e2e8f0; color:#94a3b8;" colspan="4">Banka hesabi eklenmedi.</td></tr>`
            : bankAccounts.map((row) => `
                <tr>
                    <td style="padding:0.32rem 0.35rem; border-bottom:1px solid #e2e8f0; color:#0f172a;">${SalesModule.escapeHtml(String(row?.bankName || '-'))}</td>
                    <td style="padding:0.32rem 0.35rem; border-bottom:1px solid #e2e8f0; color:#0f172a;">${SalesModule.escapeHtml(String(row?.branchCode || '-'))}</td>
                    <td style="padding:0.32rem 0.35rem; border-bottom:1px solid #e2e8f0; color:#0f172a;">${SalesModule.escapeHtml(String(row?.accountNo || '-'))}</td>
                    <td style="padding:0.32rem 0.35rem; border-bottom:1px solid #e2e8f0; color:#0f172a;">${SalesModule.escapeHtml(String(row?.iban || '-'))}</td>
                </tr>
            `).join('');

        const lineRowsHtml = lines.length === 0
            ? `<tr><td colspan="12" style="padding:0.5rem; border-top:1px solid #e2e8f0; color:#94a3b8; text-align:center;">Satir bulunmuyor.</td></tr>`
            : lines.map((line) => `
                <tr>
                    <td style="padding:0.36rem; border-top:1px solid #e2e8f0;">${SalesModule.escapeHtml(String(line?.productName || '-'))}</td>
                    <td style="padding:0.36rem; border-top:1px solid #e2e8f0; font-family:Consolas,monospace;">${SalesModule.escapeHtml(String(line?.productCode || '-'))}</td>
                    <td style="padding:0.36rem; border-top:1px solid #e2e8f0; font-family:Consolas,monospace; color:#1d4ed8;">${SalesModule.escapeHtml(String(line?.idCode || '-'))}</td>
                    <td style="padding:0.36rem; border-top:1px solid #e2e8f0;">${SalesModule.escapeHtml(String(line?.selectedDiameter || '-'))}</td>
                    <td style="padding:0.36rem; border-top:1px solid #e2e8f0;">${SalesModule.escapeHtml(String(line?.accessoryColor || '-'))}</td>
                    <td style="padding:0.36rem; border-top:1px solid #e2e8f0;">${SalesModule.escapeHtml(String(line?.tubeColor || '-'))}</td>
                    <td style="padding:0.36rem; border-top:1px solid #e2e8f0;">${SalesModule.escapeHtml(String(line?.plexiColor || '-'))}</td>
                    <td style="padding:0.36rem; border-top:1px solid #e2e8f0;">${SalesModule.escapeHtml(String(line?.bubble || 'yok'))}</td>
                    <td style="padding:0.36rem; border-top:1px solid #e2e8f0;">${SalesModule.escapeHtml(String(line?.lowerTubeLength || '-'))}</td>
                    <td style="padding:0.36rem; border-top:1px solid #e2e8f0; text-align:right;">${fmtQty(line?.qty || 0)}</td>
                    <td style="padding:0.36rem; border-top:1px solid #e2e8f0; text-align:right;">${fmtMoney(line?.unitPrice || 0)}</td>
                    <td style="padding:0.36rem; border-top:1px solid #e2e8f0; text-align:right; font-weight:700;">${fmtMoney(line?.lineTotal || 0)}</td>
                </tr>
            `).join('');

        const kdvTitle = vatRate === 0 ? 'KDV (0%) - KDV Haric' : `KDV (%${vatRate})`;
        const kurText = currency === 'TL' ? '-' : (exchangeRate > 0 ? Number(exchangeRate).toFixed(4) : '-');
        const orderDateText = order.orderDate ? new Date(order.orderDate).toLocaleDateString('tr-TR') : '-';
        const updateDateText = order.updated_at ? new Date(order.updated_at).toLocaleString('tr-TR') : '-';
        return `
            <div style="background:#fff; border:1px solid #cbd5e1; border-radius:0.9rem; padding:1rem; overflow:auto;">
                <div style="width:100%; min-width:1000px; max-width:1240px; margin:0 auto; border:1px solid #e2e8f0; background:white; padding:1rem 1.1rem;">
                    <div style="display:grid; grid-template-columns:1fr 1.5fr; gap:0.8rem; align-items:start;">
                        <div>${logoHtml}</div>
                        <div style="text-align:right; font-size:0.74rem; color:#0f172a; line-height:1.4;">
                            <div style="font-weight:800;">DULDA MERDIVEN SISTEMLERI INS.SAN.TIC.LTD.STI.</div>
                            <div>S.S ISTANBUL KUCUK MARMERCILER SAN.SIT.YAP.KOOP.</div>
                            <div>29.SOK. 3.CADDE NO:10 KOSELER MAH. DILOVASI / KOCAELI</div>
                            <div>Tel: +90 262 502 22 11 / Fax: +90 262 502 22 11</div>
                            <div>www.dulda.com - sales@dulda.com</div>
                        </div>
                    </div>

                    <div style="margin-top:0.65rem; border-top:3px solid #334155;"></div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.8rem; margin-top:0.85rem;">
                        <div style="background:#f1f5f9; border:1px solid #e2e8f0; padding:0.55rem 0.7rem;">
                            <div style="font-size:0.9rem; font-weight:800; color:#0f172a;">TEKLIF ALAN</div>
                            <div style="font-weight:700; margin-top:0.25rem;">${SalesModule.escapeHtml(String(order.customerName || '-'))}</div>
                            <div style="margin-top:0.2rem; color:#334155;">${SalesModule.escapeHtml(String(order.deliveryAddress || '-'))}</div>
                        </div>
                        <div style="background:#f1f5f9; border:1px solid #e2e8f0; padding:0.55rem 0.7rem;">
                            <div style="font-size:0.9rem; font-weight:800; color:#0f172a;">TEKLIF DETAYLARI</div>
                            <div style="display:grid; grid-template-columns:120px 1fr; gap:0.25rem; margin-top:0.28rem; font-size:0.82rem;">
                                <strong>Teklif No</strong><span>: ${SalesModule.escapeHtml(String(order.orderNo || '-'))}</span>
                                <strong>Tarih</strong><span>: ${SalesModule.escapeHtml(orderDateText)}</span>
                                <strong>Hazirlayan</strong><span>: ${SalesModule.escapeHtml(String(order.preparedBy || '-'))}</span>
                                <strong>Para Birimi</strong><span>: ${SalesModule.escapeHtml(currency)}</span>
                                <strong>Kur</strong><span>: ${SalesModule.escapeHtml(kurText)}</span>
                                <strong>Durum</strong><span>: <span style="display:inline-flex; padding:0.05rem 0.42rem; border:1px solid ${SalesModule.escapeHtml(statusMeta.border)}; border-radius:999px; background:${SalesModule.escapeHtml(statusMeta.bg)}; color:${SalesModule.escapeHtml(statusMeta.color)}; font-weight:700;">${SalesModule.escapeHtml(statusMeta.text)}</span></span>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top:0.8rem; border:1px solid #cbd5e1; overflow:auto;">
                        <table style="width:100%; min-width:1250px; border-collapse:collapse; font-size:0.78rem;">
                            <thead>
                                <tr style="background:#334155; color:white; text-align:left;">
                                    <th style="padding:0.35rem;">Urun Adi</th>
                                    <th style="padding:0.35rem;">Urun Kodu</th>
                                    <th style="padding:0.35rem;">ID Kodu</th>
                                    <th style="padding:0.35rem;">Cap</th>
                                    <th style="padding:0.35rem;">Aksesuar Rengi</th>
                                    <th style="padding:0.35rem;">Boru Rengi</th>
                                    <th style="padding:0.35rem;">Pleksi Rengi</th>
                                    <th style="padding:0.35rem;">Kabarcik</th>
                                    <th style="padding:0.35rem;">Alt Boru Uzunlugu</th>
                                    <th style="padding:0.35rem; text-align:right;">Adet</th>
                                    <th style="padding:0.35rem; text-align:right;">Birim Fiyat</th>
                                    <th style="padding:0.35rem; text-align:right;">Tutar</th>
                                </tr>
                            </thead>
                            <tbody>${lineRowsHtml}</tbody>
                        </table>
                    </div>

                    <div style="display:flex; justify-content:space-between; gap:0.75rem; margin-top:0.7rem; align-items:flex-start;">
                        <div style="flex:1; font-size:0.82rem; color:#334155;">
                            <div style="font-weight:800; color:#0f172a; margin-bottom:0.2rem;">Aciklamalar</div>
                            <div style="white-space:normal; line-height:1.5;">${notesHtml}</div>
                            <div style="margin-top:0.45rem; font-size:0.78rem; color:#64748b;">Son duzenleme: ${SalesModule.escapeHtml(updateDateText)}</div>
                        </div>
                        <div style="min-width:350px; font-size:0.9rem;">
                            <div style="display:flex; justify-content:space-between; padding:0.1rem 0;"><span>Ara Toplam</span><strong>${fmtMoney(subtotal)}</strong></div>
                            <div style="display:flex; justify-content:space-between; padding:0.1rem 0; color:#dc2626;"><span>Iskonto (%${SalesModule.escapeHtml(String(discountRate))})</span><strong>-${fmtMoney(discountTotal)}</strong></div>
                            <div style="display:flex; justify-content:space-between; padding:0.1rem 0;"><span>KDV Matrahi</span><strong>${fmtMoney(taxBase)}</strong></div>
                            <div style="display:flex; justify-content:space-between; padding:0.1rem 0;"><span>${kdvTitle}</span><strong>${fmtMoney(vatTotal)}</strong></div>
                            <div style="display:flex; justify-content:space-between; padding:0.12rem 0; font-size:1.06rem; border-top:1px solid #e2e8f0; margin-top:0.14rem;"><span><strong>Genel Toplam</strong></span><strong>${fmtMoney(grandTotal)}</strong></div>
                            <div style="display:flex; justify-content:space-between; padding:0.1rem 0;"><span>Genel Toplam (TL)</span><strong>${fmtMoney(totalTl, 'TL')}</strong></div>
                        </div>
                    </div>

                    <div style="margin-top:0.8rem; font-size:0.9rem; color:#0f172a;">
                        <div style="display:grid; grid-template-columns:180px 1fr; gap:0.35rem; padding:0.16rem 0;"><strong>ODEME SEKLI</strong><span>${SalesModule.escapeHtml(String(order.paymentMethod || 'Nakit'))}</span></div>
                        <div style="display:grid; grid-template-columns:180px 1fr; gap:0.35rem; padding:0.16rem 0;"><strong>TESLIM KOSULLARI</strong><span>Onaydan sonra ${SalesModule.escapeHtml(String(order.deliveryLeadDays || 0))} gun / ${SalesModule.escapeHtml(String(order.deliveryAddress || '-'))}</span></div>
                    </div>

                    <div style="margin-top:0.7rem;">
                        <div style="font-weight:800; color:#0f172a; margin-bottom:0.35rem;">BANKA BILGILERI</div>
                        <table style="width:100%; border-collapse:collapse; font-size:0.82rem; border:1px solid #e2e8f0;">
                            <thead>
                                <tr style="background:#f1f5f9; text-align:left;">
                                    <th style="padding:0.35rem;">Banka Adi</th>
                                    <th style="padding:0.35rem;">Sube Kodu</th>
                                    <th style="padding:0.35rem;">Hesap No</th>
                                    <th style="padding:0.35rem;">IBAN</th>
                                </tr>
                            </thead>
                            <tbody>${bankRowsHtml}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    renderProformaSettingsPreview: () => {
        const container = document.getElementById('sales_proforma_preview_container');
        if (!container) return;
        const draft = SalesModule.state.proformaSettingsDraft || SalesModule.getProformaSettings();
        container.innerHTML = SalesModule.buildProformaPreviewDocumentHtml(draft);
    },

    openSalesCatalogVariationPage: (productId) => {
        const id = String(productId || '').trim();
        if (!id) return;
        if (typeof ProductLibraryModule !== 'undefined' && ProductLibraryModule) {
            ProductLibraryModule.state.workspaceView = 'sales-products';
            ProductLibraryModule.state.salesProductEntrySource = 'sales';
            ProductLibraryModule.state.salesProductDetailId = id;
            ProductLibraryModule.state.salesVariationEditorMode = '';
            ProductLibraryModule.state.salesVariationEditingId = '';
            ProductLibraryModule.state.salesVariationDraft = null;
            if (typeof Router !== 'undefined' && Router && typeof Router.navigate === 'function') {
                Router.navigate('products', { preserveProductsState: true });
                return;
            }
        }
        SalesModule.openCatalogDetailModal(id);
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

    getCustomerMissingInfoWarnings: (row = {}) => {
        const warnings = [];
        if (!String(row?.externalCode || '').trim()) warnings.push('Cari kodu eksik');
        if (!String(row?.phone || '').trim()) warnings.push('Telefon eksik');
        if (!String(row?.taxNo || '').trim()) warnings.push('Vergi no eksik');
        if (!String(row?.city || '').trim()) warnings.push('Sehir eksik');
        return warnings;
    },

    getCurrentEditorName: () => {
        const meta = DB.data?.meta || {};
        const candidates = [
            meta.activeUserName,
            meta.activeUsername,
            meta.currentUserName,
            meta.currentUser,
            meta.loggedUserName,
            meta.loggedUser,
            meta.operatorName
        ];
        const found = candidates.find((item) => String(item || '').trim());
        return String(found || 'Yerel Kullanici').trim();
    },

    getCustomerMissingFields: (row = {}) => {
        const contacts = Array.isArray(row?.customerContacts) ? row.customerContacts : [];
        const selectedTypes = SalesModule.normalizeCustomerTypeList(row?.customerTypes || []);
        const fields = [
            { key: 'name', label: 'Musteri Unvani', ok: !!String(row?.name || '').trim() },
            { key: 'contacts', label: 'Yetkili', ok: contacts.length > 0 },
            { key: 'customerTypes', label: 'Tip', ok: selectedTypes.length > 0 },
            { key: 'country', label: 'Ulke', ok: !!String(row?.country || '').trim() },
            { key: 'city', label: 'Sehir', ok: !!String(row?.city || '').trim() },
            { key: 'customerCode', label: 'Cari Kod', ok: !!String(row?.externalCode || '').trim() },
            { key: 'address', label: 'Adres', ok: !!String(row?.address || '').trim() }
        ];
        return fields.filter((item) => !item.ok);
    },

    getCustomerCompletionStatus: (row = {}) => (
        SalesModule.getCustomerMissingFields(row).length === 0 ? 'COMPLETED' : 'INCOMPLETE'
    ),

    getCustomerEditorStats: (rows = []) => {
        const list = Array.isArray(rows) ? rows : [];
        const bag = new Map();
        list.forEach((row) => {
            const key = String(row?.lastEditor || '').trim();
            if (!key) return;
            bag.set(key, (bag.get(key) || 0) + 1);
        });
        return Array.from(bag.entries())
            .map(([lastEditor, count]) => ({ lastEditor, count }))
            .sort((a, b) => String(a.lastEditor || '').localeCompare(String(b.lastEditor || ''), 'tr'));
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
            .map((row) => {
                const customerContacts = SalesModule.buildCustomerContactsFromRow(row);
                const firstContact = customerContacts[0] || {};
                const firstPhone = Array.isArray(firstContact?.phones) && firstContact.phones.length
                    ? String(firstContact.phones[0] || '').trim()
                    : '';
                return {
                    id: String(row?.id || '').trim(),
                    customerCode: String(row?.customerCode || '').trim().toUpperCase(),
                    name: String(row?.name || '').trim(),
                    city: String(row?.city || '').trim(),
                    district: String(row?.district || '').trim(),
                    phone: String(row?.phone || '').trim(),
                    phoneCountryCode: String(row?.phoneCountryCode || '').trim(),
                    phoneAreaCode: String(row?.phoneAreaCode || '').trim(),
                    phoneAlt: String(row?.phoneAlt || firstPhone).trim(),
                    email: String(row?.email || firstContact?.email || '').trim(),
                    taxOffice: String(row?.taxOffice || '').trim(),
                    taxNo: String(row?.taxNo || '').trim(),
                    address: String(row?.address || '').trim(),
                    addressNo: String(row?.addressNo || '').trim(),
                    postalCode: String(row?.postalCode || '').trim(),
                    country: String(row?.country || '').trim(),
                    externalCode: String(row?.externalCode || '').trim(),
                    faxNo: String(row?.faxNo || '').trim(),
                    modemNo: String(row?.modemNo || '').trim(),
                    authorizedPerson: String(row?.authorizedPerson || firstContact?.name || '').trim(),
                    discountRate: SalesModule.parsePercent(row?.discountRate || 0),
                    paymentTermDays: SalesModule.parseDays(row?.paymentTermDays || 0),
                    riskLimit: SalesModule.parseMoney(row?.riskLimit || 0),
                    customerTypes: SalesModule.normalizeCustomerTypeList(
                        Array.isArray(row?.customerTypes) ? row.customerTypes : (Array.isArray(row?.tags) ? row.tags : [])
                    ),
                    customerContacts,
                    contacts: customerContacts,
                    tags: Array.isArray(row?.tags) ? row.tags.map((item) => String(item || '').trim()).filter(Boolean) : [],
                    note: String(row?.note || '').trim(),
                    isActive: row?.isActive !== false,
                    lastEditor: String(row?.lastEditor || row?.updatedBy || '').trim(),
                    status: 'INCOMPLETE',
                    created_at: String(row?.created_at || ''),
                    updated_at: String(row?.updated_at || ''),
                    updatedAt: String(row?.updated_at || row?.updatedAt || row?.created_at || '')
                };
            })
            .map((row) => ({
                ...row,
                status: SalesModule.getCustomerCompletionStatus(row),
                missingFields: SalesModule.getCustomerMissingFields(row)
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
        const filters = SalesModule.state.customerFilters || { name: '', city: '', status: 'ALL', editor: 'ALL' };
        const qName = SalesModule.normalizeSearchText(filters.name || '');
        const qCity = SalesModule.normalizeSearchText(filters.city || '');
        const qStatus = String(filters.status || 'ALL').trim().toUpperCase();
        const qEditor = String(filters.editor || 'ALL').trim();
        return SalesModule.getCustomers().filter((row) => {
            if (qName && !SalesModule.buildCustomerSearchIndex(row).includes(qName)) return false;
            if (qCity && !SalesModule.normalizeSearchText(`${row.city} ${row.district} ${row.country}`).includes(qCity)) return false;
            if (qStatus !== 'ALL' && String(row?.status || '').toUpperCase() !== qStatus) return false;
            if (qEditor !== 'ALL' && String(row?.lastEditor || '').trim() !== qEditor) return false;
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
            : { name: '', city: '', status: 'ALL', editor: 'ALL' };
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

    getCityOptions: () => ([
        'Adana', 'Ankara', 'Antalya', 'Bursa', 'Diyarbakir', 'Eskisehir', 'Gaziantep', 'Istanbul',
        'Izmir', 'Kayseri', 'Kocaeli', 'Konya', 'Mersin', 'Samsun', 'Tekirdag', 'Trabzon'
    ]),

    renderCityDatalistHtml: (id = 'sales_customer_city_options') => `
        <datalist id="${SalesModule.escapeHtml(id)}">
            ${SalesModule.getCityOptions().map((city) => `<option value="${SalesModule.escapeHtml(city)}"></option>`).join('')}
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

    applyCustomerGroupChipVisualState: (chipEl, isSelected) => {
        if (!chipEl) return;
        chipEl.style.borderColor = isSelected ? '#2563eb' : '#cbd5e1';
        chipEl.style.background = isSelected ? '#2563eb' : '#ffffff';
        chipEl.style.color = isSelected ? '#ffffff' : '#334155';
        chipEl.style.boxShadow = isSelected ? '0 2px 8px rgba(37,99,235,0.22)' : 'none';
    },

    refreshCustomerGroupWrapState: () => {
        const wrap = document.getElementById('sales_customer_group_wrap');
        if (!wrap) return;
        const anyChecked = !!wrap.querySelector('input[name="sales_customer_types"]:checked');
        wrap.style.borderColor = anyChecked ? '#93c5fd' : '#fda4af';
        wrap.style.background = anyChecked ? '#f8fbff' : '#fff1f2';
    },

    toggleCustomerGroupChip: (inputEl) => {
        const input = inputEl;
        if (!input) return;
        const chip = input.closest('[data-customer-group-chip="1"]');
        SalesModule.applyCustomerGroupChipVisualState(chip, !!input.checked);
        SalesModule.refreshCustomerGroupWrapState();
    },

    normalizeCustomerContactRow: (row = {}, options = {}) => {
        const source = row && typeof row === 'object' ? row : {};
        const keepEmptyPhoneSlot = options?.keepEmptyPhoneSlot === true;
        const rawPhones = Array.isArray(source?.phones)
            ? source.phones
            : (String(source?.phone || '').split(','));
        const phones = rawPhones
            .map((item) => String(item || '').trim())
            .filter(Boolean);
        if (keepEmptyPhoneSlot && phones.length === 0) phones.push('');
        return {
            id: String(source?.id || crypto.randomUUID()).trim(),
            name: String(source?.name || source?.fullName || '').trim(),
            position: String(source?.position || source?.title || '').trim(),
            phones,
            email: String(source?.email || '').trim(),
            note: String(source?.note || '').trim()
        };
    },

    normalizeCustomerContactList: (rows = [], options = {}) => {
        const list = Array.isArray(rows) ? rows : [];
        const keepEmptyPhoneSlot = options?.keepEmptyPhoneSlot === true;
        const allowEmptyRow = options?.allowEmptyRow === true;
        const normalized = list
            .map((row) => SalesModule.normalizeCustomerContactRow(row, { keepEmptyPhoneSlot }))
            .filter((row) => {
                if (allowEmptyRow) return true;
                if (row.phones.some((phone) => String(phone || '').trim())) return true;
                return !!(row.name || row.position || row.email || row.note);
            });
        if (allowEmptyRow && normalized.length === 0) {
            normalized.push(SalesModule.normalizeCustomerContactRow({}, { keepEmptyPhoneSlot: true }));
        }
        return normalized;
    },

    buildCustomerContactsFromRow: (row = {}) => {
        const source = row && typeof row === 'object' ? row : {};
        const direct = Array.isArray(source?.customerContacts)
            ? source.customerContacts
            : (Array.isArray(source?.contacts) ? source.contacts : []);
        if (direct.length > 0) {
            return SalesModule.normalizeCustomerContactList(direct, { allowEmptyRow: true, keepEmptyPhoneSlot: true });
        }
        const phones = [String(source?.phoneAlt || '').trim(), String(source?.phone || '').trim()]
            .filter(Boolean);
        return SalesModule.normalizeCustomerContactList([{
            id: crypto.randomUUID(),
            name: String(source?.authorizedPerson || '').trim(),
            position: '',
            phones,
            email: String(source?.email || '').trim(),
            note: ''
        }], { allowEmptyRow: true, keepEmptyPhoneSlot: true });
    },

    renderCustomerContactRowsHtml: (rows = []) => {
        const list = SalesModule.normalizeCustomerContactList(rows, { allowEmptyRow: false, keepEmptyPhoneSlot: false });
        return list.map((row, index) => {
            const rowIndex = Number(index || 0);
            const phones = Array.isArray(row?.phones) && row.phones.length ? row.phones : [''];
            const phoneValue = String(phones[0] || '').trim();
            const phoneText = phoneValue || '-';
            const emailText = String(row?.email || '').trim() || '-';
            const noteText = String(row?.note || '').trim() || '-';
            return `
                <tr data-contact-row-index="${rowIndex}" style="border-bottom:1px solid #f1f5f9; background:#ffffff;">
                    <td style="padding:0.56rem 0.7rem;">
                        <div style="font-weight:700; color:#0f172a;">${SalesModule.escapeHtml(String(row?.name || '-'))}</div>
                    </td>
                    <td style="padding:0.56rem 0.7rem;">
                        <div style="color:#4f46e5; font-weight:700;">${SalesModule.escapeHtml(String(row?.position || '-'))}</div>
                    </td>
                    <td style="padding:0.56rem 0.7rem;">
                        <div style="display:flex; flex-direction:column; gap:0.24rem;">
                            <div style="display:flex; align-items:center; gap:0.35rem;">
                                <span style="font-size:0.74rem; color:#94a3b8;">tel</span>
                                <span style="font-size:0.82rem; color:#334155; font-weight:600;">${SalesModule.escapeHtml(phoneText)}</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:0.35rem;">
                                <span style="font-size:0.74rem; color:#94a3b8;">mail</span>
                                <span style="font-size:0.82rem; color:#334155; font-weight:600;">${SalesModule.escapeHtml(emailText)}</span>
                            </div>
                        </div>
                    </td>
                    <td style="padding:0.56rem 0.7rem;">
                        <div style="font-size:0.82rem; color:#475569;">${SalesModule.escapeHtml(noteText)}</div>
                    </td>
                    <td style="padding:0.56rem 0.7rem; text-align:right;">
                        <div style="display:flex; gap:0.35rem; justify-content:flex-end;">
                            <button type="button" class="btn-sm" style="height:30px;" onclick="SalesModule.openCustomerContactModal(${rowIndex})">duzenle</button>
                            <button type="button" class="btn-sm" style="height:30px; color:#dc2626; border-color:#fecaca; background:#fff1f2;" onclick="SalesModule.removeCustomerContactRow(${rowIndex})">sil</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    getCustomerContactRowsFromDom: () => {
        const rows = Array.isArray(SalesModule.state.customerContactRowsDraft)
            ? SalesModule.state.customerContactRowsDraft
            : [];
        return SalesModule.normalizeCustomerContactList(rows, { allowEmptyRow: false, keepEmptyPhoneSlot: false });
    },

    setCustomerContactRowsToDom: (rows = []) => {
        SalesModule.state.customerContactRowsDraft = SalesModule.normalizeCustomerContactList(rows, { allowEmptyRow: false, keepEmptyPhoneSlot: false });
        const tbody = document.getElementById('sales_customer_contacts_tbody');
        if (!tbody) return;
        tbody.innerHTML = SalesModule.renderCustomerContactRowsHtml(SalesModule.state.customerContactRowsDraft);
        SalesModule.syncCustomerContactTableState();
    },

    syncCustomerContactTableState: () => {
        const tbody = document.getElementById('sales_customer_contacts_tbody');
        if (!tbody) return;
        const tableWrap = document.getElementById('sales_customer_contacts_table_wrap');
        const emptyWrap = document.getElementById('sales_customer_contacts_empty');
        const hasRows = tbody.querySelectorAll('tr[data-contact-row-index]').length > 0;
        if (tableWrap) tableWrap.style.display = hasRows ? 'block' : 'none';
        if (emptyWrap) emptyWrap.style.display = hasRows ? 'none' : 'flex';
    },

    addCustomerContactRow: () => {
        SalesModule.openCustomerContactModal(-1);
    },

    removeCustomerContactRow: (rowIndex) => {
        const idx = Number(rowIndex);
        if (!Number.isFinite(idx) || idx < 0) return;
        const rows = SalesModule.getCustomerContactRowsFromDom();
        const next = rows.filter((_, i) => i !== idx);
        SalesModule.setCustomerContactRowsToDom(next);
    },

    openCustomerContactModal: (rowIndex = -1) => {
        const idx = Number(rowIndex);
        const rows = SalesModule.getCustomerContactRowsFromDom();
        const editing = Number.isFinite(idx) && idx >= 0 && !!rows[idx];
        const draft = editing
            ? { ...rows[idx] }
            : SalesModule.normalizeCustomerContactRow({}, { keepEmptyPhoneSlot: true });
        const firstPhone = Array.isArray(draft.phones) && draft.phones.length ? String(draft.phones[0] || '').trim() : '';
        SalesModule.state.customerContactModal = {
            editIndex: editing ? idx : -1
        };
        const html = `
            <div style="display:flex; flex-direction:column; gap:0.7rem;">
                <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.6rem;">
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; font-weight:700; margin-bottom:0.2rem;">Ad Soyad <span style="color:#e11d48;">*</span></label>
                        <input id="sales_contact_modal_name" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft.name || ''))}" placeholder="or: Ahmet Yilmaz">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; font-weight:700; margin-bottom:0.2rem;">Pozisyon / Gorevi</label>
                        <input id="sales_contact_modal_position" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft.position || ''))}" placeholder="or: Satin Alma">
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.6rem;">
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; font-weight:700; margin-bottom:0.2rem;">Telefon</label>
                        <input id="sales_contact_modal_phone" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(firstPhone)}" placeholder="05xx xxx xx xx">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; font-weight:700; margin-bottom:0.2rem;">E-posta</label>
                        <input id="sales_contact_modal_email" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft.email || ''))}" placeholder="or: satin-alma@firma.com">
                    </div>
                </div>
                <div>
                    <label style="display:block; font-size:0.72rem; color:#64748b; font-weight:700; margin-bottom:0.2rem;">Not</label>
                    <textarea id="sales_contact_modal_note" class="stock-textarea" style="min-height:72px;">${SalesModule.escapeHtml(String(draft.note || ''))}</textarea>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.45rem;">
                    <button class="btn-sm" onclick="SalesModule.closeCustomerContactModal()">vazgec</button>
                    <button class="btn-primary" onclick="SalesModule.saveCustomerContactModal()">${editing ? 'guncelle' : 'ekle'}</button>
                </div>
            </div>
        `;
        Modal.open(editing ? 'Yetkili Kisiyi Duzenle' : 'Yeni Yetkili Kisi', html, { maxWidth: '620px', closeExisting: false });
    },

    closeCustomerContactModal: () => {
        SalesModule.state.customerContactModal = null;
        Modal.close();
    },

    saveCustomerContactModal: () => {
        const read = (id) => String(document.getElementById(id)?.value || '').trim();
        const row = SalesModule.normalizeCustomerContactRow({
            id: crypto.randomUUID(),
            name: read('sales_contact_modal_name'),
            position: read('sales_contact_modal_position'),
            phones: [read('sales_contact_modal_phone')],
            email: read('sales_contact_modal_email'),
            note: read('sales_contact_modal_note')
        }, { keepEmptyPhoneSlot: false });
        if (!row.name) return alert('Ad Soyad zorunlu.');
        const ctx = SalesModule.state.customerContactModal || { editIndex: -1 };
        const idx = Number(ctx.editIndex);
        const rows = SalesModule.getCustomerContactRowsFromDom();
        if (Number.isFinite(idx) && idx >= 0 && rows[idx]) rows[idx] = row;
        else rows.push(row);
        SalesModule.setCustomerContactRowsToDom(rows);
        SalesModule.closeCustomerContactModal();
    },

    buildCustomerDraft: (source = null) => {
        const row = source && typeof source === 'object' ? source : {};
        const tags = Array.isArray(row?.tags) ? row.tags : [];
        const rowTypes = Array.isArray(row?.customerTypes) ? row.customerTypes : [];
        const fallbackTypes = SalesModule.normalizeCustomerTypeList(tags);
        const customerContacts = SalesModule.buildCustomerContactsFromRow(row);
        const firstContact = customerContacts[0] || {};
        const firstContactPhone = Array.isArray(firstContact?.phones) && firstContact.phones.length
            ? String(firstContact.phones[0] || '').trim()
            : '';
        return {
            name: String(row?.name || '').trim(),
            city: String(row?.city || '').trim(),
            district: String(row?.district || '').trim(),
            phone: String(row?.phone || '').trim(),
            phoneCountryCode: String(row?.phoneCountryCode || '').trim(),
            phoneAreaCode: String(row?.phoneAreaCode || '').trim(),
            phoneAlt: String(row?.phoneAlt || firstContactPhone).trim(),
            email: String(row?.email || firstContact?.email || '').trim(),
            taxOffice: String(row?.taxOffice || '').trim(),
            taxNo: String(row?.taxNo || '').trim(),
            address: String(row?.address || '').trim(),
            addressNo: String(row?.addressNo || '').trim(),
            postalCode: String(row?.postalCode || '').trim(),
            country: String(row?.country || '').trim(),
            externalCode: String(row?.externalCode || '').trim(),
            faxNo: String(row?.faxNo || '').trim(),
            modemNo: String(row?.modemNo || '').trim(),
            authorizedPerson: String(row?.authorizedPerson || firstContact?.name || '').trim(),
            discountRate: SalesModule.parsePercent(row?.discountRate || 0),
            paymentTermDays: SalesModule.parseDays(row?.paymentTermDays || 0),
            riskLimit: SalesModule.parseMoney(row?.riskLimit || 0),
            customerTypes: SalesModule.normalizeCustomerTypeList(rowTypes.length ? rowTypes : fallbackTypes),
            customerContacts,
            note: String(row?.note || '').trim(),
            isActive: row?.isActive !== false
        };
    },

    validateCustomerDraft: (draft) => {
        if (!draft || typeof draft !== 'object') return { ok: false, message: 'Musteri taslagi bulunamadi.' };
        if (!String(draft.name || '').trim()) return { ok: false, message: 'Musteri adi zorunlu.' };
        if (!Array.isArray(draft.customerTypes) || draft.customerTypes.length === 0) return { ok: false, message: 'En az bir urun grubu sec.' };
        if (!String(draft.externalCode || '').trim()) return { ok: false, message: 'Cari kodu zorunlu.' };
        if (!String(draft.country || '').trim()) return { ok: false, message: 'Ulke zorunlu.' };
        if (!String(draft.city || '').trim()) return { ok: false, message: 'Sehir zorunlu.' };
        if (!String(draft.address || '').trim()) return { ok: false, message: 'Acik adres zorunlu.' };
        return { ok: true };
    },

    openCreateCustomerModal: () => {
        SalesModule.state.customerModalEditId = '';
        const draft = SalesModule.buildCustomerDraft();
        SalesModule.state.customerContactRowsDraft = SalesModule.normalizeCustomerContactList(draft?.customerContacts || [], {
            allowEmptyRow: false,
            keepEmptyPhoneSlot: false
        });
        SalesModule.state.customerContactModal = null;
        const html = SalesModule.renderCustomerModalFormHtml(draft, false);
        Modal.open('Yeni Musteri Ekle', html, { maxWidth: '940px' });
    },

    openEditCustomerModal: (customerId) => {
        SalesModule.ensureData();
        const row = SalesModule.getCustomerById(customerId);
        if (!row) return alert('Musteri kaydi bulunamadi.');
        SalesModule.state.customerModalEditId = String(row.id || '').trim();
        const draft = SalesModule.buildCustomerDraft(row);
        SalesModule.state.customerContactRowsDraft = SalesModule.normalizeCustomerContactList(draft?.customerContacts || [], {
            allowEmptyRow: false,
            keepEmptyPhoneSlot: false
        });
        SalesModule.state.customerContactModal = null;
        const html = SalesModule.renderCustomerModalFormHtml(draft, true);
        Modal.open('Musteriyi Duzenle', html, { maxWidth: '940px' });
    },

    closeCustomerFormModal: () => {
        SalesModule.state.customerModalEditId = '';
        SalesModule.state.customerContactRowsDraft = [];
        SalesModule.state.customerContactModal = null;
        Modal.close();
    },

    renderCustomerModalFormHtml: (draft, isEdit) => {
        const selectedTypes = SalesModule.normalizeCustomerTypeList(draft?.customerTypes || []);
        const customerContacts = SalesModule.normalizeCustomerContactList(draft?.customerContacts || [], {
            allowEmptyRow: false,
            keepEmptyPhoneSlot: true
        });
        const isTypeMissing = selectedTypes.length === 0;
        const isMissing = (value) => !String(value ?? '').trim();
        const missing = {
            name: isMissing(draft?.name),
            country: isMissing(draft?.country),
            city: isMissing(draft?.city),
            customerCode: isMissing(draft?.externalCode),
            address: isMissing(draft?.address)
        };
        const fieldStyle = (flag) => flag ? 'border-color:#fda4af; background:#fff1f2;' : '';
        const hasContacts = customerContacts.length > 0;
        const sectionTitle = (index, title, color = 'blue') => {
            const palette = {
                blue: { bg: '#dbeafe', fg: '#1d4ed8', bd: '#bfdbfe' },
                indigo: { bg: '#e0e7ff', fg: '#4338ca', bd: '#c7d2fe' },
                emerald: { bg: '#d1fae5', fg: '#047857', bd: '#a7f3d0' },
                gray: { bg: '#f1f5f9', fg: '#334155', bd: '#e2e8f0' }
            };
            const tone = palette[color] || palette.blue;
            return `
            <div style="display:flex; align-items:center; gap:0.55rem; font-size:0.95rem; font-weight:800; color:#1e293b; margin-bottom:0.8rem; padding-bottom:0.5rem; border-bottom:1px solid #e2e8f0;">
                <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:999px; background:${tone.bg}; color:${tone.fg}; font-size:0.74rem; font-weight:800; border:1px solid ${tone.bd};">${SalesModule.escapeHtml(String(index))}</span>
                <span>${SalesModule.escapeHtml(String(title || ''))}</span>
            </div>
        `;
        };

        return `
            ${SalesModule.renderCountryDatalistHtml('sales_customer_country_options')}
            ${SalesModule.renderCityDatalistHtml('sales_customer_city_options')}
            <div style="display:flex; flex-direction:column; gap:0.95rem;">
                <div style="border:1px solid #e2e8f0; border-radius:0.95rem; padding:0.9rem; background:#ffffff;">
                    ${sectionTitle(1, 'Musteri Kimlik Karti', 'blue')}
                    <div style="display:grid; grid-template-columns:minmax(0,1.55fr) minmax(0,1fr); gap:0.85rem;">
                        <div style="display:flex; flex-direction:column; gap:0.72rem;">
                            <div>
                                <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.22rem;">Musteri unvani <span style="color:#e11d48;">*</span></label>
                                <input id="sales_customer_name" class="stock-input stock-input-tall" style="${fieldStyle(missing.name)}" value="${SalesModule.escapeHtml(String(draft?.name || ''))}" placeholder="or: Akpa Aluminyum A.S.">
                            </div>
                            <div>
                                <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.22rem;">Urun grubu <span style="color:#e11d48;">*</span></label>
                                <div id="sales_customer_group_wrap" style="display:flex; gap:0.45rem; flex-wrap:wrap; border:1px solid ${isTypeMissing ? '#fda4af' : '#dbe7ff'}; border-radius:0.7rem; padding:0.45rem; background:${isTypeMissing ? '#fff1f2' : '#f8fbff'};">
                                    ${SalesModule.getCustomerTypeOptions().map((type) => {
                const checked = selectedTypes.includes(type);
                return `
                                            <label data-customer-group-chip="1" style="display:inline-flex; align-items:center; border:1px solid ${checked ? '#2563eb' : '#cbd5e1'}; border-radius:999px; padding:0.34rem 0.74rem; font-size:0.79rem; font-weight:800; letter-spacing:0.01em; color:${checked ? '#fff' : '#334155'}; background:${checked ? '#2563eb' : '#fff'}; box-shadow:${checked ? '0 2px 8px rgba(37,99,235,0.22)' : 'none'}; cursor:pointer; user-select:none; transition:all 0.12s ease;">
                                                <input type="checkbox" name="sales_customer_types" value="${SalesModule.escapeHtml(type)}" ${checked ? 'checked' : ''} onchange="SalesModule.toggleCustomerGroupChip(this)" style="position:absolute; opacity:0; pointer-events:none;">
                                                ${SalesModule.escapeHtml(type)}
                                            </label>
                                        `;
            }).join('')}
                                </div>
                            </div>
                        </div>
                        <div style="border:1px solid #e2e8f0; border-radius:0.8rem; background:#f8fafc; padding:0.65rem;">
                            <div style="font-size:0.66rem; text-transform:uppercase; letter-spacing:0.04em; font-weight:800; color:#64748b; margin-bottom:0.45rem;">Cari ve vergi bilgileri</div>
                            <div style="display:flex; flex-direction:column; gap:0.5rem;">
                                <div>
                                    <label style="display:block; font-size:0.7rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Cari kodu <span style="color:#e11d48;">*</span></label>
                                    <input id="sales_customer_external_code" class="stock-input stock-input-tall" style="${fieldStyle(missing.customerCode)}" value="${SalesModule.escapeHtml(String(draft?.externalCode || ''))}" placeholder="or: 120.01.A.002">
                                </div>
                                <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.45rem;">
                                    <div>
                                        <label style="display:block; font-size:0.7rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Vergi dairesi</label>
                                        <input id="sales_customer_tax_office" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.taxOffice || ''))}">
                                    </div>
                                    <div>
                                        <label style="display:block; font-size:0.7rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Vergi no</label>
                                        <input id="sales_customer_tax_no" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.taxNo || ''))}">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="border:1px solid #e2e8f0; border-radius:0.95rem; padding:0.9rem; background:#ffffff;">
                    ${sectionTitle(2, 'Yetkili Kisiler (Temas Noktalari)', 'indigo')}
                    <div style="display:flex; justify-content:flex-end; margin-bottom:0.5rem;">
                        <button type="button" class="btn-sm" style="height:33px; color:#4338ca; border-color:#c7d2fe; background:#eef2ff; font-weight:700;" onclick="SalesModule.addCustomerContactRow()">yeni yetkili ekle</button>
                    </div>
                    <div id="sales_customer_contacts_empty" style="display:${hasContacts ? 'none' : 'flex'}; align-items:center; justify-content:center; border:2px dashed #dbe5f0; border-radius:0.8rem; min-height:86px; color:#94a3b8; font-size:0.84rem; background:#f8fafc;">Henuz bir yetkili kisi eklenmedi.</div>
                    <div id="sales_customer_contacts_table_wrap" style="display:${hasContacts ? 'block' : 'none'}; border:1px solid #e2e8f0; border-radius:0.8rem; overflow:auto;">
                        <table style="width:100%; min-width:860px; border-collapse:separate; border-spacing:0;">
                            <thead style="background:#f8fafc;">
                                <tr style="color:#64748b; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.03em;">
                                    <th style="padding:0.56rem 0.7rem; text-align:left; border-bottom:1px solid #e2e8f0;">Ad Soyad</th>
                                    <th style="padding:0.56rem 0.7rem; text-align:left; border-bottom:1px solid #e2e8f0;">Gorevi</th>
                                    <th style="padding:0.56rem 0.7rem; text-align:left; border-bottom:1px solid #e2e8f0;">Iletisim</th>
                                    <th style="padding:0.56rem 0.7rem; text-align:left; border-bottom:1px solid #e2e8f0;">Not</th>
                                    <th style="padding:0.56rem 0.7rem; text-align:right; border-bottom:1px solid #e2e8f0; width:88px;">Islem</th>
                                </tr>
                            </thead>
                            <tbody id="sales_customer_contacts_tbody">
                                ${SalesModule.renderCustomerContactRowsHtml(customerContacts)}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style="border:1px solid #e2e8f0; border-radius:0.95rem; padding:0.9rem; background:#ffffff;">
                    ${sectionTitle(3, 'Adres ve Konum Bilgileri', 'emerald')}
                    <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.65rem;">
                        <div>
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Sehir <span style="color:#e11d48;">*</span></label>
                            <input id="sales_customer_city" list="sales_customer_city_options" class="stock-input stock-input-tall" style="${fieldStyle(missing.city)}" value="${SalesModule.escapeHtml(String(draft?.city || ''))}" placeholder="or: Ankara">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Ilce</label>
                            <input id="sales_customer_district" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.district || ''))}" placeholder="or: Siteler">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Ulke <span style="color:#e11d48;">*</span></label>
                            <input id="sales_customer_country" list="sales_customer_country_options" class="stock-input stock-input-tall" style="${fieldStyle(missing.country)}" value="${SalesModule.escapeHtml(String(draft?.country || 'Turkiye'))}" placeholder="Turkiye">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.18rem;">Posta kodu</label>
                            <input id="sales_customer_postal_code" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.postalCode || ''))}">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.18rem;">Adres no</label>
                            <input id="sales_customer_address_no" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.addressNo || ''))}">
                        </div>
                        <div style="grid-column:span 3;">
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Acik adres <span style="color:#e11d48;">*</span></label>
                            <textarea id="sales_customer_address" class="stock-textarea" style="min-height:72px; ${fieldStyle(missing.address)}">${SalesModule.escapeHtml(String(draft?.address || ''))}</textarea>
                        </div>
                    </div>
                </div>

                <div style="border:1px solid #e2e8f0; border-radius:0.95rem; padding:0.9rem; background:#ffffff;">
                    ${sectionTitle(4, 'Finansal ve Ozel Notlar', 'gray')}
                    <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.65rem;">
                        <div>
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Genel iskonto (%)</label>
                            <input id="sales_customer_discount" type="number" min="0" max="100" step="0.01" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.discountRate || 0))}">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Odeme vadesi (gun)</label>
                            <input id="sales_customer_term_days" type="number" min="0" step="1" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.paymentTermDays || 0))}">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Risk limiti</label>
                            <input id="sales_customer_risk_limit" type="number" min="0" step="0.01" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(draft?.riskLimit || 0))}">
                        </div>
                        <div style="grid-column:span 3;">
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Not</label>
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
        const customerContacts = SalesModule.normalizeCustomerContactList(
            SalesModule.getCustomerContactRowsFromDom(),
            { allowEmptyRow: false, keepEmptyPhoneSlot: false }
        );
        const firstContact = customerContacts[0] || {};
        const firstContactPhones = Array.isArray(firstContact?.phones) ? firstContact.phones : [];
        const firstPhone = String(firstContactPhones[0] || '').trim();
        const secondPhone = String(firstContactPhones[1] || '').trim();
        return {
            name: String(read('sales_customer_name')).trim(),
            city: String(read('sales_customer_city')).trim(),
            district: String(read('sales_customer_district')).trim(),
            phone: secondPhone,
            phoneCountryCode: '90',
            phoneAreaCode: '',
            phoneAlt: firstPhone,
            email: String(firstContact?.email || '').trim(),
            authorizedPerson: String(firstContact?.name || '').trim(),
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
            customerContacts,
            isActive: true
        };
    },

    saveCustomerFromModal: async () => {
        SalesModule.ensureData();
        const draft = SalesModule.readCustomerDraftFromDom();
        const validation = SalesModule.validateCustomerDraft(draft);
        if (!validation.ok) return alert(validation.message || 'Kayit yapilamadi.');
        const editorName = SalesModule.getCurrentEditorName();
        const customerContacts = SalesModule.normalizeCustomerContactList(draft.customerContacts || [], {
            allowEmptyRow: false,
            keepEmptyPhoneSlot: false
        });
        const firstContact = customerContacts[0] || {};
        const firstPhones = Array.isArray(firstContact?.phones) ? firstContact.phones : [];
        const now = new Date().toISOString();
        const row = {
            id: crypto.randomUUID(),
            customerCode: SalesModule.generateCustomerCode(),
            name: draft.name,
            city: draft.city,
            district: draft.district,
            phone: String(draft.phone || firstPhones[1] || '').trim(),
            phoneCountryCode: draft.phoneCountryCode,
            phoneAreaCode: draft.phoneAreaCode,
            phoneAlt: String(draft.phoneAlt || firstPhones[0] || '').trim(),
            email: String(draft.email || firstContact?.email || '').trim(),
            taxOffice: draft.taxOffice,
            taxNo: draft.taxNo,
            address: draft.address,
            addressNo: draft.addressNo,
            postalCode: draft.postalCode,
            country: draft.country,
            externalCode: draft.externalCode,
            authorizedPerson: String(draft.authorizedPerson || firstContact?.name || '').trim(),
            discountRate: draft.discountRate,
            paymentTermDays: draft.paymentTermDays,
            riskLimit: draft.riskLimit,
            customerTypes: SalesModule.normalizeCustomerTypeList(draft.customerTypes || []),
            customerContacts,
            tags: [],
            note: draft.note,
            isActive: true,
            lastEditor: editorName,
            created_at: now,
            updated_at: now
        };
        DB.data.data.customers.push(row);
        await DB.save();
        SalesModule.state.customerModalEditId = '';
        SalesModule.state.customerContactRowsDraft = [];
        SalesModule.state.customerContactModal = null;
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
        const editorName = SalesModule.getCurrentEditorName();
        const customerContacts = SalesModule.normalizeCustomerContactList(draft.customerContacts || [], {
            allowEmptyRow: false,
            keepEmptyPhoneSlot: false
        });
        const firstContact = customerContacts[0] || {};
        const firstPhones = Array.isArray(firstContact?.phones) ? firstContact.phones : [];
        const rows = Array.isArray(DB.data?.data?.customers) ? DB.data.data.customers : [];
        const idx = rows.findIndex((row) => String(row?.id || '').trim() === targetId);
        if (idx === -1) return alert('Musteri kaydi bulunamadi.');
        const prev = rows[idx] || {};
        rows[idx] = {
            ...prev,
            name: String(draft.name || '').trim(),
            city: String(draft.city || '').trim(),
            district: String(draft.district || '').trim(),
            phone: String(draft.phone || firstPhones[1] || '').trim(),
            phoneCountryCode: String(draft.phoneCountryCode || '').trim(),
            phoneAreaCode: String(draft.phoneAreaCode || '').trim(),
            phoneAlt: String(draft.phoneAlt || firstPhones[0] || '').trim(),
            email: String(draft.email || firstContact?.email || '').trim(),
            taxOffice: String(draft.taxOffice || '').trim(),
            taxNo: String(draft.taxNo || '').trim(),
            address: String(draft.address || '').trim(),
            addressNo: String(draft.addressNo || '').trim(),
            postalCode: String(draft.postalCode || '').trim(),
            country: String(draft.country || '').trim(),
            externalCode: String(draft.externalCode || '').trim(),
            authorizedPerson: String(draft.authorizedPerson || firstContact?.name || '').trim(),
            discountRate: SalesModule.parsePercent(draft.discountRate || 0),
            paymentTermDays: SalesModule.parseDays(draft.paymentTermDays || 0),
            riskLimit: SalesModule.parseMoney(draft.riskLimit || 0),
            customerTypes: SalesModule.normalizeCustomerTypeList(draft.customerTypes || []),
            customerContacts,
            tags: Array.isArray(prev?.tags) ? prev.tags : [],
            note: String(draft.note || '').trim(),
            lastEditor: editorName,
            updated_at: new Date().toISOString()
        };
        await DB.save();
        SalesModule.state.customerModalEditId = '';
        SalesModule.state.customerContactRowsDraft = [];
        SalesModule.state.customerContactModal = null;
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
        const editorName = SalesModule.getCurrentEditorName();
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
            lastEditor: editorName,
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

    parseCustomerTypesFromImport: (value) => {
        const raw = String(value || '').trim();
        if (!raw) return [];
        const parts = raw
            .split(/[;,]+/)
            .map((item) => String(item || '').trim())
            .filter(Boolean);
        const source = parts.length ? parts : [raw];
        return SalesModule.normalizeCustomerTypeList(source);
    },

    buildImportContactEntry: (name, position, phone, email, note) => {
        const normalizedName = String(name || '').trim();
        const normalizedPosition = String(position || '').trim();
        const normalizedEmail = String(email || '').trim();
        const normalizedNote = String(note || '').trim();
        const phones = String(phone || '')
            .split(/[,;]+/)
            .map((item) => String(item || '').trim())
            .filter(Boolean);
        if (!normalizedName && !normalizedPosition && !normalizedEmail && !normalizedNote && phones.length === 0) return null;
        return {
            id: crypto.randomUUID(),
            name: normalizedName,
            position: normalizedPosition,
            phones,
            email: normalizedEmail,
            note: normalizedNote
        };
    },

    buildImportContactsFromRow: (row = [], headerMap = {}) => {
        const contacts = [];
        const idxPrimaryName = SalesModule.findImportColumnIndex(headerMap, ['yetkili kisi', 'yetkili', 'yetkili ad']);
        const idxPrimaryRole = SalesModule.findImportColumnIndex(headerMap, ['yetkili gorevi', 'gorevi', 'gorev']);
        const idxPrimaryPhone = SalesModule.findImportColumnIndex(headerMap, ['telefon', 'gsm tel', 'sabit tel', 'tel no1', 'tel no', 'cep telefonu']);
        const idxPrimaryEmail = SalesModule.findImportColumnIndex(headerMap, ['eposta', 'e posta', 'mail']);
        const primary = SalesModule.buildImportContactEntry(
            SalesModule.toImportRowValue(row, idxPrimaryName),
            SalesModule.toImportRowValue(row, idxPrimaryRole),
            SalesModule.toImportRowValue(row, idxPrimaryPhone),
            SalesModule.toImportRowValue(row, idxPrimaryEmail),
            ''
        );
        if (primary) contacts.push(primary);

        for (let n = 1; n <= 10; n += 1) {
            const idxName = SalesModule.findImportColumnIndex(headerMap, [`yetkili ${n} ad`, `yetkili${n} ad`]);
            const idxRole = SalesModule.findImportColumnIndex(headerMap, [`yetkili ${n} gorev`, `yetkili${n} gorev`]);
            const idxPhone = SalesModule.findImportColumnIndex(headerMap, [`yetkili ${n} telefon`, `yetkili${n} telefon`]);
            const idxEmail = SalesModule.findImportColumnIndex(headerMap, [`yetkili ${n} e posta`, `yetkili${n} e posta`, `yetkili ${n} eposta`, `yetkili${n} eposta`]);
            const idxNote = SalesModule.findImportColumnIndex(headerMap, [`yetkili ${n} not`, `yetkili${n} not`]);
            const contact = SalesModule.buildImportContactEntry(
                SalesModule.toImportRowValue(row, idxName),
                SalesModule.toImportRowValue(row, idxRole),
                SalesModule.toImportRowValue(row, idxPhone),
                SalesModule.toImportRowValue(row, idxEmail),
                SalesModule.toImportRowValue(row, idxNote)
            );
            if (contact) contacts.push(contact);
        }

        const unique = new Map();
        contacts.forEach((contact) => {
            const key = [
                String(contact?.name || '').trim().toLocaleUpperCase('tr-TR'),
                String(contact?.position || '').trim().toLocaleUpperCase('tr-TR'),
                String(Array.isArray(contact?.phones) ? contact.phones.join(',') : '').replace(/\D+/g, ''),
                String(contact?.email || '').trim().toLocaleLowerCase('tr-TR')
            ].join('|');
            if (!unique.has(key)) unique.set(key, contact);
        });

        return SalesModule.normalizeCustomerContactList(Array.from(unique.values()), { allowEmptyRow: false, keepEmptyPhoneSlot: false });
    },

    normalizeImportToken: (value) => {
        const raw = String(value || '').trim().toLocaleLowerCase('tr-TR');
        if (!raw) return '';
        const cleaned = (window.MojibakeFix && typeof window.MojibakeFix.normalize === 'function')
            ? window.MojibakeFix.normalize(raw)
            : raw;
        return cleaned
            .replace(/[ıİ]/g, 'i')
            .replace(/[şŞ]/g, 's')
            .replace(/[ğĞ]/g, 'g')
            .replace(/[üÜ]/g, 'u')
            .replace(/[öÖ]/g, 'o')
            .replace(/[çÇ]/g, 'c')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '');
    },

    normalizeExternalCodeKey: (value) => String(value || '')
        .trim()
        .toLocaleUpperCase('tr-TR')
        .replace(/\s+/g, ''),

    buildCustomerImportIdentity: (row = {}) => {
        const externalCodeKey = SalesModule.normalizeExternalCodeKey(row?.externalCode || '');
        const taxKey = SalesModule.normalizeTaxKey(row?.taxNo || '');
        const nameKey = SalesModule.normalizeCustomerNameKey(row?.name || '');
        const phoneKey = SalesModule.normalizePhoneKey(row?.phone || row?.phoneAlt || '');
        const namePhoneKey = (nameKey && phoneKey) ? `${nameKey}|${phoneKey}` : '';
        return { externalCodeKey, taxKey, namePhoneKey };
    },

    getCustomerImportMatchKey: (row = {}) => {
        const identity = SalesModule.buildCustomerImportIdentity(row);
        if (identity.externalCodeKey) return `external:${identity.externalCodeKey}`;
        if (identity.taxKey) return `tax:${identity.taxKey}`;
        if (identity.namePhoneKey) return `namePhone:${identity.namePhoneKey}`;
        return '';
    },

    isValidCustomerCode: (value) => /^MUS-\d{6}$/i.test(String(value || '').trim()),

    isValidUuid: (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim()),

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

        const idxCariCode = SalesModule.findImportColumnIndex(headerMap, ['cari kodu', 'cari kod']);
        const idxName = SalesModule.findImportColumnIndex(headerMap, ['musteri unvani', 'musteri adi', 'cari adi', 'unvan']);
        const idxAddressNo = SalesModule.findImportColumnIndex(headerMap, ['adres no', 'adresno']);
        const idxPostal = SalesModule.findImportColumnIndex(headerMap, ['posta kodu', 'posta kod']);
        const idxDistrict = SalesModule.findImportColumnIndex(headerMap, ['ilce', 'ilceadi']);
        const idxCity = SalesModule.findImportColumnIndex(headerMap, ['sehir', 'il']);
        const idxCountry = SalesModule.findImportColumnIndex(headerMap, ['ulke']);
        const idxTelCountry = SalesModule.findImportColumnIndex(headerMap, ['tel ulke kodu', 'telefon ulke kodu']);
        const idxTelArea = SalesModule.findImportColumnIndex(headerMap, ['tel bolge kodu', 'telefon bolge kodu']);
        const idxTel1 = SalesModule.findImportColumnIndex(headerMap, ['gsm tel', 'tel no1', 'telefon', 'tel no', 'cep telefonu']);
        const idxTel2 = SalesModule.findImportColumnIndex(headerMap, ['sabit tel', 'tel no2', 'telefon2']);
        const idxFax = SalesModule.findImportColumnIndex(headerMap, ['fax no', 'fax']);
        const idxModem = SalesModule.findImportColumnIndex(headerMap, ['modem no', 'modem']);
        const idxTaxNo = SalesModule.findImportColumnIndex(headerMap, ['vergi no', 'vkn', 'tc kimlik no', 'tc']);
        const idxTaxOffice = SalesModule.findImportColumnIndex(headerMap, ['vergi dairesi']);
        const idxNote = SalesModule.findImportColumnIndex(headerMap, ['musteri notu', 'ozel not', 'not']);
        const idxEmail = SalesModule.findImportColumnIndex(headerMap, ['eposta', 'e posta', 'mail']);
        const idxAuthorized = SalesModule.findImportColumnIndex(headerMap, ['yetkili', 'yetkili kisi', 'yetkili ad']);
        const idxCustomerTypes = SalesModule.findImportColumnIndex(headerMap, ['musteri tipi', 'musteri turu', 'urun grubu']);
        const idxDiscount = SalesModule.findImportColumnIndex(headerMap, ['genel iskonto', 'iskonto']);
        const idxPaymentTermDays = SalesModule.findImportColumnIndex(headerMap, ['odeme vadesi gun', 'vade gun', 'odeme vadesi']);
        const idxRiskLimit = SalesModule.findImportColumnIndex(headerMap, ['risk limiti']);

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
            const customerContacts = SalesModule.buildImportContactsFromRow(row, headerMap);
            const firstContact = customerContacts[0] || {};
            const firstContactPhone = Array.isArray(firstContact?.phones) && firstContact.phones.length
                ? String(firstContact.phones[0] || '').trim()
                : '';
            const phone = String(phoneRaw || firstContactPhone || [phoneCountryCode, phoneAreaCode].filter(Boolean).join(' ')).trim();

            const addressParts = (addressColumnIndexes.length ? addressColumnIndexes : [])
                .map((colIdx) => SalesModule.toImportRowValue(row, colIdx));
            const address = SalesModule.buildImportAddress(...addressParts);
            const customerTypes = SalesModule.parseCustomerTypesFromImport(
                SalesModule.toImportRowValue(row, idxCustomerTypes)
            );
            const authorizedPerson = SalesModule.toImportRowValue(row, idxAuthorized) || String(firstContact?.name || '').trim();

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
                authorizedPerson,
                discountRate: SalesModule.toImportRowValue(row, idxDiscount),
                paymentTermDays: SalesModule.toImportRowValue(row, idxPaymentTermDays),
                riskLimit: SalesModule.toImportRowValue(row, idxRiskLimit),
                note: SalesModule.toImportRowValue(row, idxNote),
                customerTypes,
                tags: customerTypes,
                customerContacts,
                contacts: customerContacts,
                isActive: true
            });
        }

        return { parsedRows, skippedRows, fileRowCount: Math.max(0, sheetRows.length - 1) };
    },

    buildCustomerImportPreview: (parsedRows = [], skippedRows = []) => {
        const existing = SalesModule.getCustomers();
        const existingByMatchKey = new Map();
        existing.forEach((row) => {
            const key = SalesModule.getCustomerImportMatchKey(row);
            if (!key) return;
            if (!existingByMatchKey.has(key)) {
                existingByMatchKey.set(key, String(row?.id || '').trim());
            }
        });

        const previewRows = [];
        const latestRowByMatchKey = new Map();
        parsedRows.forEach((row) => {
            const matchKey = SalesModule.getCustomerImportMatchKey(row);
            if (matchKey && latestRowByMatchKey.has(matchKey)) {
                const previousIndex = latestRowByMatchKey.get(matchKey);
                if (typeof previousIndex === 'number' && previousIndex >= 0 && previewRows[previousIndex]) {
                    const previous = previewRows[previousIndex];
                    previewRows[previousIndex] = {
                        ...previous,
                        status: 'duplicate',
                        reason: `Dosyada tekrarlandi. Son satir (${String(row?.sourceRow || '-')}) esas alindi.`,
                        warnings: [],
                        matchedCustomerId: '',
                        importable: false
                    };
                }
            }

            const warnings = [];
            const taxKey = SalesModule.normalizeTaxKey(row?.taxNo || '');
            const firstContactPhone = (Array.isArray(row?.customerContacts) && row.customerContacts[0] && Array.isArray(row.customerContacts[0].phones))
                ? String(row.customerContacts[0].phones[0] || '').trim()
                : '';
            const phoneKey = SalesModule.normalizePhoneKey(row?.phone || row?.phoneAlt || firstContactPhone || '');
            const matchedCustomerId = matchKey ? String(existingByMatchKey.get(matchKey) || '').trim() : '';
            let status = 'ready';
            let reason = '';

            if (!phoneKey) warnings.push('Telefon eksik');
            if (!taxKey) warnings.push('Vergi no eksik');
            if (!String(row?.city || '').trim()) warnings.push('Sehir eksik');

            if (status !== 'duplicate' && matchedCustomerId) {
                status = 'update';
                reason = 'Mevcut musteri guncellenecek.';
            }

            if ((status === 'ready' || status === 'update') && warnings.length > 0) {
                if (status === 'ready') status = 'warning';
                reason = reason
                    ? `${reason} Uyari: ${warnings.join(', ')}.`
                    : warnings.join(', ');
            } else if ((status === 'ready' || status === 'warning') && !reason) {
                reason = 'Yeni musteri eklenecek.';
            }

            previewRows.push({
                ...row,
                status,
                reason,
                warnings,
                matchedCustomerId,
                importable: status === 'ready' || status === 'warning' || status === 'update'
            });
            if (matchKey) latestRowByMatchKey.set(matchKey, previewRows.length - 1);
        });

        const counters = {
            ready: previewRows.filter((row) => row.status === 'ready').length,
            update: previewRows.filter((row) => row.status === 'update').length,
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
                : (row.status === 'update'
                    ? { text: 'Guncelle', bg: '#e0f2fe', color: '#075985', border: '#bae6fd' }
                    : (row.status === 'warning'
                    ? { text: 'Eksik Bilgi', bg: '#fef3c7', color: '#92400e', border: '#fcd34d' }
                    : { text: 'Eklenecek', bg: '#dcfce7', color: '#166534', border: '#86efac' }));
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
        const counters = preview.counters || { ready: 0, update: 0, warning: 0, duplicate: 0, skipped: 0 };
        const importableCount = preview.rows.filter((row) => row.importable).length;
        const skippedAndDuplicate = Number(counters.duplicate || 0) + Number(counters.skipped || 0);
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
                    <div style="border:1px solid #bbf7d0; background:#f0fdf4; border-radius:0.6rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#166534;">Yeni eklenecek</div><div style="font-weight:800; color:#166534;">${SalesModule.escapeHtml(String(counters.ready || 0))}</div></div>
                    <div style="border:1px solid #bae6fd; background:#f0f9ff; border-radius:0.6rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#075985;">Guncellenecek</div><div style="font-weight:800; color:#075985;">${SalesModule.escapeHtml(String(counters.update || 0))}</div></div>
                    <div style="border:1px solid #fecaca; background:#fef2f2; border-radius:0.6rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#991b1b;">Atlanan / Mukerrer</div><div style="font-weight:800; color:#991b1b;">${SalesModule.escapeHtml(String(skippedAndDuplicate))}</div></div>
                </div>
                <div style="font-size:0.8rem; color:#92400e;">Eksik bilgi ile islenecek: <strong>${SalesModule.escapeHtml(String(counters.warning || 0))}</strong></div>
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
        const customerRows = Array.isArray(DB.data?.data?.customers) ? DB.data.data.customers : [];
        const customerIndexById = new Map(
            customerRows.map((row, index) => [String(row?.id || '').trim(), index])
        );
        const pickText = (incoming, current = '') => {
            const normalizedIncoming = String(incoming || '').trim();
            if (normalizedIncoming) return normalizedIncoming;
            return String(current || '').trim();
        };
        const pickNumber = (incoming, current, parser) => {
            const incomingText = String(incoming || '').trim();
            if (!incomingText) return parser(current || 0);
            return parser(incomingText);
        };
        const now = new Date().toISOString();
        let added = 0;
        let updated = 0;
        importableRows.forEach((item) => {
            const name = String(item?.name || '').trim();
            if (!name) return;
            const incomingTypes = SalesModule.normalizeCustomerTypeList(
                Array.isArray(item?.customerTypes) ? item.customerTypes : []
            );
            const incomingContacts = SalesModule.normalizeCustomerContactList(
                Array.isArray(item?.customerContacts) ? item.customerContacts : [],
                { allowEmptyRow: false, keepEmptyPhoneSlot: false }
            );
            const firstContact = incomingContacts[0] || {};
            const firstContactPhone = Array.isArray(firstContact?.phones) && firstContact.phones.length
                ? String(firstContact.phones[0] || '').trim()
                : '';
            const firstContactName = String(firstContact?.name || '').trim();
            const firstContactEmail = String(firstContact?.email || '').trim();

            const matchedCustomerId = String(item?.matchedCustomerId || '').trim();
            const targetIndex = matchedCustomerId ? customerIndexById.get(matchedCustomerId) : -1;

            if (Number.isInteger(targetIndex) && targetIndex >= 0) {
                const prev = customerRows[targetIndex] || {};
                const preservedId = SalesModule.isValidUuid(prev?.id) ? String(prev.id).trim() : crypto.randomUUID();
                const rawCustomerCode = String(prev?.customerCode || '').trim().toUpperCase();
                const preservedCustomerCode = SalesModule.isValidCustomerCode(rawCustomerCode)
                    ? rawCustomerCode
                    : SalesModule.generateCustomerCode();
                customerRows[targetIndex] = {
                    ...prev,
                    id: preservedId,
                    customerCode: preservedCustomerCode,
                    name,
                    city: pickText(item?.city, prev?.city),
                    district: pickText(item?.district, prev?.district),
                    phone: pickText(item?.phone || firstContactPhone, prev?.phone),
                    phoneCountryCode: pickText(item?.phoneCountryCode, prev?.phoneCountryCode),
                    phoneAreaCode: pickText(item?.phoneAreaCode, prev?.phoneAreaCode),
                    phoneAlt: pickText(item?.phoneAlt || firstContactPhone, prev?.phoneAlt),
                    email: pickText(item?.email || firstContactEmail, prev?.email),
                    taxOffice: pickText(item?.taxOffice, prev?.taxOffice),
                    taxNo: pickText(item?.taxNo, prev?.taxNo),
                    address: pickText(item?.address, prev?.address),
                    addressNo: pickText(item?.addressNo, prev?.addressNo),
                    postalCode: pickText(item?.postalCode, prev?.postalCode),
                    country: pickText(item?.country, prev?.country),
                    externalCode: pickText(item?.externalCode, prev?.externalCode),
                    faxNo: pickText(item?.faxNo, prev?.faxNo),
                    modemNo: pickText(item?.modemNo, prev?.modemNo),
                    authorizedPerson: pickText(item?.authorizedPerson || firstContactName, prev?.authorizedPerson),
                    discountRate: pickNumber(item?.discountRate, prev?.discountRate, SalesModule.parsePercent),
                    paymentTermDays: pickNumber(item?.paymentTermDays, prev?.paymentTermDays, SalesModule.parseDays),
                    riskLimit: pickNumber(item?.riskLimit, prev?.riskLimit, SalesModule.parseMoney),
                    customerTypes: incomingTypes.length ? incomingTypes : SalesModule.normalizeCustomerTypeList(prev?.customerTypes || []),
                    tags: incomingTypes.length ? incomingTypes : SalesModule.normalizeCustomerTypeList(prev?.tags || []),
                    customerContacts: incomingContacts.length
                        ? incomingContacts
                        : SalesModule.normalizeCustomerContactList(prev?.customerContacts || prev?.contacts || [], { allowEmptyRow: false, keepEmptyPhoneSlot: false }),
                    contacts: incomingContacts.length
                        ? incomingContacts
                        : SalesModule.normalizeCustomerContactList(prev?.customerContacts || prev?.contacts || [], { allowEmptyRow: false, keepEmptyPhoneSlot: false }),
                    note: pickText(item?.note, prev?.note),
                    isActive: true,
                    created_at: String(prev?.created_at || now),
                    updated_at: now
                };
                updated += 1;
                return;
            }

            const row = {
                id: crypto.randomUUID(),
                customerCode: SalesModule.generateCustomerCode(),
                name,
                city: String(item?.city || '').trim(),
                district: String(item?.district || '').trim(),
                phone: String(item?.phone || firstContactPhone || '').trim(),
                phoneCountryCode: String(item?.phoneCountryCode || '').trim(),
                phoneAreaCode: String(item?.phoneAreaCode || '').trim(),
                phoneAlt: String(item?.phoneAlt || firstContactPhone || '').trim(),
                email: String(item?.email || firstContactEmail || '').trim(),
                taxOffice: String(item?.taxOffice || '').trim(),
                taxNo: String(item?.taxNo || '').trim(),
                address: String(item?.address || '').trim(),
                addressNo: String(item?.addressNo || '').trim(),
                postalCode: String(item?.postalCode || '').trim(),
                country: String(item?.country || '').trim(),
                externalCode: String(item?.externalCode || '').trim(),
                faxNo: String(item?.faxNo || '').trim(),
                modemNo: String(item?.modemNo || '').trim(),
                authorizedPerson: String(item?.authorizedPerson || firstContactName || '').trim(),
                discountRate: SalesModule.parsePercent(item?.discountRate || 0),
                paymentTermDays: SalesModule.parseDays(item?.paymentTermDays || 0),
                riskLimit: SalesModule.parseMoney(item?.riskLimit || 0),
                customerTypes: incomingTypes,
                tags: incomingTypes,
                customerContacts: incomingContacts,
                contacts: incomingContacts,
                note: String(item?.note || '').trim(),
                isActive: true,
                created_at: now,
                updated_at: now
            };
            customerRows.push(row);
            customerIndexById.set(String(row.id || '').trim(), customerRows.length - 1);
            added += 1;
        });
        await DB.save();
        SalesModule.state.customerImportPreview = null;
        Modal.close();
        UI.renderCurrentPage();
        const duplicateCount = Number(preview?.counters?.duplicate || 0) + Number(preview?.counters?.skipped || 0);
        const warningCount = Number(preview?.counters?.warning || 0);
        alert(`Iceri aktarma tamamlandi. Yeni: ${added}, Guncellenen: ${updated}, Eksik bilgi ile islenen: ${warningCount}, Atlanan: ${duplicateCount}.`);
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
            <div class="sales-catalog-upload-preview">
                <div class="sales-catalog-upload-image-wrap">
                    <img src="${SalesModule.escapeHtml(String(imageData || ''))}" alt="${SalesModule.escapeHtml(label)}" class="sales-catalog-upload-image">
                </div>
                <div class="sales-catalog-upload-actions">
                    <button type="button" class="sales-catalog-upload-clear" onclick="event.stopPropagation(); SalesModule.clearCatalogImage('${SalesModule.escapeHtml(String(kind || ''))}')">kaldir</button>
                </div>
            </div>
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
                : `SalesModule.openSalesCatalogVariationPage('${id}')`;
            return `
                <div class="sales-catalog-card" role="button" tabindex="0" onclick="${selectAction}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault(); ${selectAction};}">
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
                </div>
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
                    : `SalesModule.openSalesCatalogVariationPage('${id}')`;
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
        const titleText = isEmbeddedInProducts ? 'urun ve parca olusturma / satilan urun kutuphanesi' : 'satis urun kutuphanesi';
        const subtitleText = isEmbeddedInProducts
            ? 'bu ekran master tarafinda referans icin gorunur. urun ekleme ve duzenleme bu ekrandan da yapilabilir.'
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
                <div class="stock-hub-head" style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap;">
                    <div>
                        <h2 class="stock-title" style="margin:0;">satis & pazarlama</h2>
                        <div style="font-size:0.84rem; color:#64748b; margin-top:0.22rem;">Proforma ve diger genel ayarlar icin Ayarlar ekranini kullan.</div>
                    </div>
                    <button class="btn-primary" onclick="SalesModule.openSettingsPage()" style="display:inline-flex; align-items:center; gap:0.45rem;">
                        <i data-lucide="settings" width="15" height="15"></i>
                        Ayarlar
                    </button>
                </div>
                <div class="stock-hub-grid" style="justify-content:flex-start;">
                    <button class="stock-hub-card" onclick="SalesModule.openWorkspace('sales')">
                        <div class="stock-hub-icon" style="background:linear-gradient(135deg,#16a34a 0%, #15803d 100%);"><i data-lucide="shopping-cart" width="24" height="24"></i></div>
                        <div class="stock-hub-label">Satis</div>
                    </button>
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

    renderSalesWorkspaceOrderRowsHtml: (rows = []) => {
        const fmtMoney = (value, currency = 'USD') => {
            const amount = Number(value || 0);
            const out = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
            if (String(currency || '').toUpperCase() === 'USD') return `$${out}`;
            if (String(currency || '').toUpperCase() === 'EUR') return `${out} EUR`;
            return `${out} TL`;
        };
        if (!Array.isArray(rows) || rows.length === 0) {
            return '<tr><td colspan="9" style="padding:0.8rem; text-align:center; color:#94a3b8;">Kayit bulunamadi.</td></tr>';
        }
        return rows.map((row) => {
            const source = row?.source || {};
            const statusMeta = SalesModule.getSalesOrderStatusMeta(row?.status || '');
            const updatedMs = Date.parse(String(source?.updated_at || source?.created_at || row?.orderDate || ''));
            const daysPassed = Number.isFinite(updatedMs)
                ? Math.max(0, Math.floor((Date.now() - updatedMs) / (24 * 60 * 60 * 1000)))
                : '-';
            const revisionNo = Math.max(1, Number(source?.revisionNo || 1));
            const statusGroup = String(row?.statusGroup || '');
            const canApprove = statusGroup === 'WAITING';
            const canArchive = statusGroup !== 'ARCHIVED';
            const id = SalesModule.escapeHtml(String(row?.id || ''));
            return `
                <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:0.42rem; font-family:Consolas,monospace; font-weight:800; color:#1d4ed8;">${SalesModule.escapeHtml(String(row?.orderNo || '-'))}</td>
                    <td style="padding:0.42rem;">${SalesModule.escapeHtml(String(row?.customerName || '-'))}</td>
                    <td style="padding:0.42rem;">${SalesModule.escapeHtml(String(row?.orderDate || '-'))}</td>
                    <td style="padding:0.42rem;"><span style="display:inline-flex; padding:0.12rem 0.45rem; border:1px solid ${SalesModule.escapeHtml(statusMeta.border)}; border-radius:999px; background:${SalesModule.escapeHtml(statusMeta.bg)}; color:${SalesModule.escapeHtml(statusMeta.color)}; font-size:0.72rem; font-weight:800;">${SalesModule.escapeHtml(statusMeta.text)}</span></td>
                    <td style="padding:0.42rem; text-align:right;">${fmtMoney(row?.total || 0, String(row?.currency || 'USD'))}</td>
                    <td style="padding:0.42rem; text-align:center;">${SalesModule.escapeHtml(String(row?.currency || 'USD'))}</td>
                    <td style="padding:0.42rem; text-align:center;">v${SalesModule.escapeHtml(String(revisionNo))}</td>
                    <td style="padding:0.42rem; text-align:center;">${SalesModule.escapeHtml(String(daysPassed))}</td>
                    <td style="padding:0.42rem; text-align:right;">
                        <div style="display:flex; gap:0.3rem; flex-wrap:wrap; justify-content:flex-end;">
                            <button class="btn-sm" type="button" onclick="SalesModule.previewSavedSalesOrderProforma('${id}')">proforma</button>
                            <button class="btn-sm" type="button" onclick="SalesModule.openSalesOrderForEdit('${id}')">duzenle</button>
                            ${canApprove ? `<button class="btn-sm" type="button" style="color:#166534; border-color:#86efac; background:#f0fdf4;" onclick="SalesModule.setSalesOrderStatus('${id}','Onaylandi')">onayla</button>` : ''}
                            ${canArchive
                    ? `<button class="btn-sm" type="button" onclick="SalesModule.setSalesOrderStatus('${id}','Arsiv')">arsive al</button>`
                    : `<button class="btn-sm" type="button" onclick="SalesModule.setSalesOrderStatus('${id}','Onay Bekliyor')">arsivden cikar</button>`}
                            <button class="btn-sm" type="button" style="color:#b91c1c; border-color:#fecaca; background:#fff1f2;" onclick="SalesModule.deleteSalesOrder('${id}')">sil</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderSalesWorkspaceDraftLineRowsHtml: (draft, catalogProducts = [], productMap = new Map(), currency = 'USD') => {
        const fmtMoney = (value) => {
            const amount = Number(value || 0);
            const out = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
            if (currency === 'USD') return `$${out}`;
            if (currency === 'EUR') return `${out} EUR`;
            return `${out} TL`;
        };
        const lines = Array.isArray(draft?.lines) ? draft.lines : [];
        if (!lines.length) {
            return '<tr><td colspan="7" style="padding:0.8rem; text-align:center; color:#94a3b8;">Satir bulunmuyor. "urun satiri ekle +" ile devam edebilirsin.</td></tr>';
        }
        return lines.map((line, index) => {
            const lineId = String(line?.id || '').trim();
            const productId = String(line?.productId || '').trim();
            const variationId = String(line?.variationId || '').trim();
            const product = productMap.get(productId) || {};
            const variation = (productId && variationId) ? SalesModule.getSalesVariationRowById(productId, variationId) : null;
            const resolveColor = (obj = {}) => {
                const category = String(obj?.category || '').trim();
                const color = String(obj?.color || '').trim();
                if (category && color) return `${category} / ${color}`;
                return color || category || '-';
            };
            const accessory = variation?.colors?.accessory && typeof variation.colors.accessory === 'object' ? variation.colors.accessory : (product?.colors?.accessory || {});
            const tube = variation?.colors?.tube && typeof variation.colors.tube === 'object' ? variation.colors.tube : (product?.colors?.tube || {});
            const plexi = variation?.colors?.plexi && typeof variation.colors.plexi === 'object' ? variation.colors.plexi : (product?.colors?.plexi || {});
            const lineUnit = SalesModule.normalizeSalesLineUnit(line?.unit || 'adet');
            const lineUnitLabel = SalesModule.getSalesLineUnitLabel(lineUnit);
            const qty = SalesModule.parseSalesQuantity(line?.qty, 1);
            const unitPrice = Number(line?.unitPrice || 0);
            const lineTotal = Number((qty * unitPrice).toFixed(2));
            const summaryColumns = [
                { label: 'urun adi', value: String(product?.name || (productId ? '-' : 'urun secilmedi')) },
                { label: 'urun kodu', value: String(variation?.variantCode || product?.productCode || '-') },
                { label: 'id kodu', value: String(product?.idCode || '-') },
                { label: 'cap', value: String(variation?.selectedDiameter || product?.selectedDiameter || '-') },
                { label: 'aksesuar rengi', value: resolveColor(accessory) },
                { label: 'boru rengi', value: resolveColor(tube) },
                { label: 'pleksi rengi', value: resolveColor(plexi) },
                { label: 'kabarcik', value: String(variation?.bubble || product?.bubble || 'yok') },
                { label: 'alt boru uzunlugu', value: String(variation?.lowerTubeLengthMm || product?.lowerTubeLength || 'standart') },
                { label: 'birim', value: lineUnitLabel }
            ];
            const summaryHeaderHtml = summaryColumns
                .map((item) => `<div style="padding:0.08rem 0.24rem; border:1px solid #e2e8f0; border-radius:0.33rem; background:#f8fafc; font-size:0.62rem; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.02em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${SalesModule.escapeHtml(item.label)}</div>`)
                .join('');
            const summaryValueHtml = summaryColumns
                .map((item) => `<div style="padding:0.14rem 0.24rem; border:1px solid #e2e8f0; border-radius:0.33rem; background:#ffffff; font-size:0.77rem; font-weight:700; color:${productId && variationId ? '#0f172a' : '#94a3b8'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${SalesModule.escapeHtml(String(item.value || '-'))}</div>`)
                .join('');
            const unitOptionsHtml = [
                { value: 'adet', label: 'Adet' },
                { value: 'metre', label: 'Metre' },
                { value: 'kilogram', label: 'Kilogram' }
            ]
                .map((item) => `<option value="${SalesModule.escapeHtml(item.value)}" ${item.value === lineUnit ? 'selected' : ''}>${SalesModule.escapeHtml(item.label)}</option>`)
                .join('');
            return `
                <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:0.34rem; text-align:center; color:#64748b; min-width:42px;">${index + 1}</td>
                    <td style="padding:0.34rem; min-width:680px;">
                        <div style="max-width:100%; overflow:auto; padding-bottom:0.06rem;">
                            <div style="display:grid; grid-template-columns:repeat(10,minmax(92px,1fr)); gap:0.3rem;">${summaryHeaderHtml}</div>
                            <div style="display:grid; grid-template-columns:repeat(10,minmax(92px,1fr)); gap:0.3rem; margin-top:0.16rem;">${summaryValueHtml}</div>
                        </div>
                    </td>
                    <td style="padding:0.34rem; min-width:106px; text-align:center;">
                        <button class="btn-sm" type="button" style="height:30px; padding:0 0.5rem;" onclick="SalesModule.addSalesOrderLineAnchoragePlaceholder('${SalesModule.escapeHtml(lineId)}')">ankraj ekle +</button>
                    </td>
                    <td style="padding:0.34rem; min-width:196px;">
                        <div style="display:grid; grid-template-columns:minmax(84px,1fr) minmax(94px,1fr); gap:0.3rem;">
                            <select class="stock-input stock-input-tall" onchange="SalesModule.setSalesOrderLineField('${SalesModule.escapeHtml(lineId)}','unit', this.value)">${unitOptionsHtml}</select>
                            <input class="stock-input stock-input-tall" type="number" min="0.01" step="0.01" value="${SalesModule.escapeHtml(String(Number(qty).toFixed(2)))}" onchange="SalesModule.setSalesOrderLineField('${SalesModule.escapeHtml(lineId)}','qty', this.value)" style="text-align:right;" placeholder="miktar">
                        </div>
                    </td>
                    <td style="padding:0.34rem; min-width:104px;"><input class="stock-input stock-input-tall" type="number" min="0" step="0.01" value="${SalesModule.escapeHtml(String(Number(unitPrice || 0).toFixed(2)))}" onchange="SalesModule.setSalesOrderLineField('${SalesModule.escapeHtml(lineId)}','unitPrice', this.value)" style="text-align:right;"></td>
                    <td style="padding:0.34rem; text-align:right; font-weight:800; min-width:88px;">${fmtMoney(lineTotal)}</td>
                    <td style="padding:0.34rem; text-align:center; min-width:52px;"><button class="btn-sm" type="button" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;" onclick="SalesModule.removeSalesOrderLine('${SalesModule.escapeHtml(lineId)}')">sil</button></td>
                </tr>
            `;
        }).join('');
    },

    renderSalesOrderEditorCardHtml: (options = {}) => {
        const inModal = options?.inModal === true;
        SalesModule.ensureSalesOrderDraft();
        const draft = SalesModule.state.salesOrderDraft || SalesModule.buildSalesOrderDraft();
        const totals = SalesModule.computeSalesOrderTotals(draft);
        const customers = SalesModule.getCustomers().slice().sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'tr'));
        const catalogProducts = SalesModule.getCatalogProducts().slice().sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'tr'));
        const productMap = new Map(catalogProducts.map((row) => [String(row?.id || ''), row]));
        const currency = SalesModule.normalizeSalesCurrency(draft.currency || 'USD');
        const fmtMoney = (value) => {
            const out = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0));
            if (currency === 'USD') return `$${out}`;
            if (currency === 'EUR') return `${out} EUR`;
            return `${out} TL`;
        };
        const customerOptions = customers.map((row) => {
            const id = String(row?.id || '').trim();
            const selected = id === String(draft.customerId || '').trim() ? 'selected' : '';
            const extCode = String(row?.externalCode || row?.customerCode || '-').trim();
            return `<option value="${SalesModule.escapeHtml(id)}" ${selected}>${SalesModule.escapeHtml(String(row?.name || '-'))} (${SalesModule.escapeHtml(extCode)})</option>`;
        }).join('');
        const paymentMethodSuggestions = SalesModule.getSalesPaymentMethodSuggestions(draft);
        const paymentMethodOptionsHtml = paymentMethodSuggestions
            .map((item) => `<option value="${SalesModule.escapeHtml(String(item || ''))}"></option>`)
            .join('');
        const lineRowsHtml = SalesModule.renderSalesWorkspaceDraftLineRowsHtml(draft, catalogProducts, productMap, currency);
        return `
            <div class="card-table" style="padding:0.95rem; border:none; box-shadow:none; background:transparent;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; flex-wrap:wrap;">
                    <div style="font-size:1.02rem; font-weight:800; color:#0f172a;">siparis olusturma ekrani</div>
                    <div style="display:flex; align-items:center; gap:0.45rem;">
                        <div style="display:flex; gap:0.45rem; font-size:0.76rem; color:#64748b;">
                            <span>hazirlayan: <strong>${SalesModule.escapeHtml(String(draft.preparedBy || '-'))}</strong></span>
                            <span>tarih: <strong>${SalesModule.escapeHtml(String(draft.orderDate || '-'))}</strong></span>
                        </div>
                        ${inModal
                ? `<button class="btn-sm" type="button" style="height:30px;" onclick="SalesModule.closeSalesOrderEditorModal()">kapat</button>`
                : ''}
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:minmax(220px,1.4fr) repeat(6,minmax(110px,1fr)); gap:0.55rem; margin-top:0.68rem;">
                    <div><label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">Musteri sec <span style="color:#e11d48;">*</span></label><select class="stock-input stock-input-tall" onchange="SalesModule.setSalesOrderDraftField('customerId', this.value)"><option value="">musteri sec *</option>${customerOptions}</select></div>
                    <div><label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">Para Birimi</label><select class="stock-input stock-input-tall" onchange="SalesModule.setSalesOrderDraftField('currency', this.value)"><option value="USD" ${currency === 'USD' ? 'selected' : ''}>USD</option><option value="EUR" ${currency === 'EUR' ? 'selected' : ''}>EUR</option><option value="TL" ${currency === 'TL' ? 'selected' : ''}>TL</option></select></div>
                    <div><label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">Kur ${currency === 'TL' ? '' : '<span style="color:#e11d48;">*</span>'}</label><input class="stock-input stock-input-tall" type="number" min="0" step="0.0001" ${currency === 'TL' ? 'disabled' : ''} value="${SalesModule.escapeHtml(String(Number(draft.exchangeRate || 0).toFixed(4)))}" onchange="SalesModule.setSalesOrderDraftField('exchangeRate', this.value)"></div>
                    <div><label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">Genel Iskonto (%)</label><input class="stock-input stock-input-tall" type="number" min="0" max="100" step="0.01" value="${SalesModule.escapeHtml(String(Number(draft.globalDiscountRate || 0).toFixed(2)))}" onchange="SalesModule.setSalesOrderDraftField('globalDiscountRate', this.value)"></div>
                    <div><label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">KDV</label><select class="stock-input stock-input-tall" onchange="SalesModule.setSalesOrderDraftField('vatRate', this.value)"><option value="20" ${Number(draft.vatRate || 20) === 20 ? 'selected' : ''}>%20</option><option value="0" ${Number(draft.vatRate || 20) === 0 ? 'selected' : ''}>%0</option></select></div>
                    <div><label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">Teslim (gun) <span style="color:#e11d48;">*</span></label><input class="stock-input stock-input-tall" type="number" min="1" step="1" value="${SalesModule.escapeHtml(String(draft.deliveryLeadDays || ''))}" onchange="SalesModule.setSalesOrderDraftField('deliveryLeadDays', this.value)"></div>
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">Odeme Sekli</label>
                        <div style="display:grid; grid-template-columns:minmax(0,1fr) auto; gap:0.35rem;">
                            <input class="stock-input stock-input-tall" list="sales_payment_method_list" value="${SalesModule.escapeHtml(String(draft.paymentMethod || 'Nakit'))}" onchange="SalesModule.setSalesOrderDraftField('paymentMethod', this.value)" placeholder="odeme sekli yaz veya sec">
                            <button class="btn-sm" type="button" style="height:36px; min-width:40px;" onclick="SalesModule.openSalesPaymentMethodModal()">+</button>
                        </div>
                        <datalist id="sales_payment_method_list">${paymentMethodOptionsHtml}</datalist>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:minmax(0,1fr) minmax(260px,1fr); gap:0.6rem; margin-top:0.62rem;">
                    <div><label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">Teslim yeri</label><textarea class="stock-textarea" style="min-height:68px;" oninput="SalesModule.setSalesOrderDraftField('deliveryAddress', this.value)">${SalesModule.escapeHtml(String(draft.deliveryAddress || ''))}</textarea></div>
                    <div><label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">Not</label><textarea class="stock-textarea" style="min-height:68px;" oninput="SalesModule.setSalesOrderDraftField('note', this.value)">${SalesModule.escapeHtml(String(draft.note || ''))}</textarea></div>
                </div>

                <div style="margin-top:0.62rem; display:flex; gap:0.4rem; flex-wrap:wrap;">
                    <button class="btn-sm" type="button" style="height:34px; padding:0 0.92rem; border-color:#0f172a; background:#0f172a; color:#ffffff; font-weight:800;" onclick="SalesModule.startAddSalesOrderLineFromCatalog()">urun satiri ekle +</button>
                </div>
                <div style="margin-top:0.55rem; border:1px solid #dbe2ec; border-radius:0.8rem; overflow:auto;">
                    <table style="width:100%; min-width:1180px; border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                                <th style="padding:0.38rem;">Sira</th>
                                <th style="padding:0.38rem; text-align:left;">Satir Ozeti</th>
                                <th style="padding:0.38rem; text-align:center;">Ankraj</th>
                                <th style="padding:0.38rem; text-align:left;">Birim / Miktar</th>
                                <th style="padding:0.38rem; text-align:left;">Fiyat</th>
                                <th style="padding:0.38rem; text-align:right;">Tutar</th>
                                <th style="padding:0.38rem;">Sil</th>
                            </tr>
                        </thead>
                        <tbody>${lineRowsHtml}</tbody>
                    </table>
                </div>

                <div style="display:grid; grid-template-columns:minmax(0,1fr) 320px; gap:0.65rem; margin-top:0.72rem;">
                    <div style="font-size:0.8rem; color:#64748b;">
                        <div><span style="color:#e11d48;">*</span> zorunlu alanlar kayit sirasinda kontrol edilir.</div>
                        <div style="margin-top:0.22rem;">Fiyat = onceki siparis / fiyat listesi / manuel giris. Fiyat 0 ise kayit olmaz.</div>
                    </div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.72rem; padding:0.62rem; background:#f8fafc;">
                        <div style="display:flex; justify-content:space-between; padding:0.12rem 0; font-size:0.84rem;"><span>Ara Toplam</span><strong>${fmtMoney(totals.subtotal)}</strong></div>
                        <div style="display:flex; justify-content:space-between; padding:0.12rem 0; font-size:0.84rem; color:#dc2626;"><span>Iskonto (%${SalesModule.escapeHtml(String(totals.discountRate || 0))})</span><strong>-${fmtMoney(totals.discountTotal)}</strong></div>
                        <div style="display:flex; justify-content:space-between; padding:0.12rem 0; font-size:0.84rem;"><span>KDV Matrahi</span><strong>${fmtMoney(totals.taxBase)}</strong></div>
                        <div style="display:flex; justify-content:space-between; padding:0.12rem 0; font-size:0.84rem;"><span>${Number(draft.vatRate || 20) === 0 ? 'KDV (0%) - KDV Haric' : `KDV (%${Number(draft.vatRate || 20) === 0 ? 0 : 20})`}</span><strong>${fmtMoney(totals.vatTotal)}</strong></div>
                        <div style="display:flex; justify-content:space-between; padding:0.18rem 0; font-size:1rem; border-top:1px solid #dbe2ec; margin-top:0.14rem;"><span><strong>Genel Toplam</strong></span><strong>${fmtMoney(totals.grandTotal)}</strong></div>
                    </div>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:0.42rem; margin-top:0.72rem;">
                    <button class="btn-sm" type="button" onclick="SalesModule.previewCurrentSalesOrderProforma()">onizle</button>
                    <button class="btn-primary" type="button" onclick="SalesModule.saveSalesOrderDraft()">kaydet</button>
                    <button class="btn-sm" type="button" style="border-color:#86efac; color:#166534; background:#f0fdf4;" onclick="SalesModule.convertSalesOrderPlaceholder()">siparise donustur +</button>
                </div>
            </div>
        `;
    },

    renderSalesWorkspaceLayout: () => {
        SalesModule.ensureSalesOrderHistoryFilters();
        const rows = SalesModule.getSalesWorkspaceRows();
        const tab = String(SalesModule.state.salesWorkspaceTab || 'ORDERS').trim().toUpperCase();
        const query = String(SalesModule.state.salesOrderHistoryFilters?.query || '').trim();
        const statusFilter = String(SalesModule.state.salesOrderHistoryFilters?.status || 'ALL').trim().toUpperCase();
        const periodFilter = String(SalesModule.state.salesOrderHistoryFilters?.period || 'ALL').trim().toUpperCase();
        const orderRowsHtml = SalesModule.renderSalesWorkspaceOrderRowsHtml(rows);
        return `
            <section class="stock-shell">
                <div class="stock-subpage-shell">
                    <div class="stock-subpage-head">
                        <h2 class="stock-title">satis / siparis olusturma</h2>
                        <button class="btn-sm" onclick="SalesModule.openWorkspace('menu')">geri</button>
                    </div>

                    <div class="card-table" style="padding:0.9rem; margin-bottom:0.75rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; flex-wrap:wrap;">
                            <div style="display:flex; gap:0.34rem;">
                                <button class="btn-sm" type="button" style="${tab === 'ORDERS' ? 'border-color:#1d4ed8; background:#eff6ff; color:#1d4ed8; font-weight:800;' : ''}" onclick="SalesModule.setSalesWorkspaceTab('ORDERS')">siparisler</button>
                                <button class="btn-sm" type="button" style="${tab === 'QUOTES' ? 'border-color:#1d4ed8; background:#eff6ff; color:#1d4ed8; font-weight:800;' : ''}" onclick="SalesModule.setSalesWorkspaceTab('QUOTES')">teklifler</button>
                                <button class="btn-sm" type="button" style="${tab === 'ARCHIVE' ? 'border-color:#1d4ed8; background:#eff6ff; color:#1d4ed8; font-weight:800;' : ''}" onclick="SalesModule.setSalesWorkspaceTab('ARCHIVE')">siparis arsivi</button>
                            </div>
                            <div style="display:flex; gap:0.35rem; align-items:center; flex-wrap:wrap;">
                                <input class="stock-input stock-input-tall" style="min-width:220px;" value="${SalesModule.escapeHtml(query)}" placeholder="siparis no / musteri ara" oninput="SalesModule.setSalesOrderHistoryFilter('query', this.value)">
                                <select class="stock-input stock-input-tall" onchange="SalesModule.setSalesOrderHistoryFilter('status', this.value)">
                                    <option value="ALL" ${statusFilter === 'ALL' ? 'selected' : ''}>Tum durumlar</option>
                                    <option value="WAITING" ${statusFilter === 'WAITING' ? 'selected' : ''}>Onay bekliyor</option>
                                    <option value="APPROVED" ${statusFilter === 'APPROVED' ? 'selected' : ''}>Onaylandi</option>
                                    <option value="ARCHIVED" ${statusFilter === 'ARCHIVED' ? 'selected' : ''}>Arsiv</option>
                                    <option value="CANCELLED" ${statusFilter === 'CANCELLED' ? 'selected' : ''}>Iptal</option>
                                </select>
                                <select class="stock-input stock-input-tall" onchange="SalesModule.setSalesOrderHistoryFilter('period', this.value)">
                                    <option value="ALL" ${periodFilter === 'ALL' ? 'selected' : ''}>Tum tarih</option>
                                    <option value="TODAY" ${periodFilter === 'TODAY' ? 'selected' : ''}>Bugun</option>
                                    <option value="THIS_WEEK" ${periodFilter === 'THIS_WEEK' ? 'selected' : ''}>Bu hafta</option>
                                    <option value="THIS_MONTH" ${periodFilter === 'THIS_MONTH' ? 'selected' : ''}>Bu ay</option>
                                </select>
                                <button class="btn-primary" type="button" onclick="SalesModule.openNewOrderModal()">yeni siparis +</button>
                            </div>
                        </div>
                        <div style="overflow:auto; margin-top:0.62rem; border:1px solid #e2e8f0; border-radius:0.75rem;">
                            <table style="width:100%; min-width:980px; border-collapse:collapse;">
                                <thead>
                                    <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                                        <th style="padding:0.42rem; text-align:left;">Siparis No</th>
                                        <th style="padding:0.42rem; text-align:left;">Musteri</th>
                                        <th style="padding:0.42rem; text-align:left;">Tarih</th>
                                        <th style="padding:0.42rem; text-align:left;">Durum</th>
                                        <th style="padding:0.42rem; text-align:right;">Toplam</th>
                                        <th style="padding:0.42rem; text-align:center;">Kur</th>
                                        <th style="padding:0.42rem; text-align:center;">Revizyon</th>
                                        <th style="padding:0.42rem; text-align:center;">Gecen Gun</th>
                                        <th style="padding:0.42rem; text-align:right;">Islem</th>
                                    </tr>
                                </thead>
                                <tbody>${orderRowsHtml}</tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card-table" style="padding:1rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; flex-wrap:wrap;">
                            <div style="font-size:0.96rem; font-weight:800; color:#0f172a;">Siparis formu buyuk popup modal olarak acilir.</div>
                            <button class="btn-primary" type="button" onclick="SalesModule.openNewOrderModal()">Yeni Siparis +</button>
                        </div>
                        <div style="font-size:0.84rem; color:#64748b; margin-top:0.35rem;">Duzenle butonuna bastiginda da ayni modal editor acilir.</div>
                    </div>
                </div>
            </section>
        `;
    },

    renderSettingsLayout: () => `
        <section class="stock-shell">
            <div class="stock-subpage-shell">
                <div class="stock-subpage-head">
                    <h2 class="stock-title">satis & pazarlama / ayarlar</h2>
                    <button class="btn-sm" onclick="SalesModule.openWorkspace('menu')">geri</button>
                </div>

                <div class="card-table" style="padding:1rem 1.1rem;">
                    <div style="font-size:1.06rem; font-weight:800; color:#0f172a;">Ayarlar Merkezi</div>
                    <div style="font-size:0.88rem; color:#64748b; margin-top:0.25rem;">Proforma, fiyat listeleri ve yeni eklenecek ayarlar bu ekrandan yonetilecek.</div>

                    <div style="margin-top:0.9rem; display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:0.8rem;">
                        <button class="stock-hub-card" style="width:100%; text-align:left; align-items:flex-start; min-height:160px; padding:1rem;" onclick="SalesModule.openProformaSettingsPage()">
                            <div class="stock-hub-icon" style="background:linear-gradient(135deg,#1d4ed8 0%, #1e40af 100%);"><i data-lucide="file-text" width="22" height="22"></i></div>
                            <div style="font-size:1rem; font-weight:800; color:#0f172a; margin-top:0.55rem;">Proforma Ayarlari</div>
                            <div style="font-size:0.82rem; color:#64748b; margin-top:0.3rem;">Logo, banka hesaplari ve varsayilan notlari yonet.</div>
                            <div style="margin-top:0.5rem; display:inline-flex; align-items:center; padding:0.14rem 0.52rem; border:1px solid #86efac; border-radius:999px; background:#f0fdf4; color:#166534; font-size:0.72rem; font-weight:800;">aktif</div>
                        </button>

                        <button class="stock-hub-card" style="width:100%; text-align:left; align-items:flex-start; min-height:160px; padding:1rem;" onclick="SalesModule.openPriceListsSettingsPage()">
                            <div class="stock-hub-icon" style="background:linear-gradient(135deg,#334155 0%, #0f172a 100%);"><i data-lucide="list-todo" width="22" height="22"></i></div>
                            <div style="font-size:1rem; font-weight:800; color:#0f172a; margin-top:0.55rem;">Fiyat Listeleri</div>
                            <div style="font-size:0.82rem; color:#64748b; margin-top:0.3rem;">Genel ve musteri bazli liste fiyatlarini yonet.</div>
                            <div style="margin-top:0.5rem; display:inline-flex; align-items:center; padding:0.14rem 0.52rem; border:1px solid #86efac; border-radius:999px; background:#f0fdf4; color:#166534; font-size:0.72rem; font-weight:800;">aktif</div>
                        </button>

                        <button class="stock-hub-card" style="width:100%; text-align:left; align-items:flex-start; min-height:160px; padding:1rem; opacity:0.78; cursor:not-allowed;" disabled>
                            <div class="stock-hub-icon" style="background:linear-gradient(135deg,#7c3aed 0%, #4338ca 100%);"><i data-lucide="sliders-horizontal" width="22" height="22"></i></div>
                            <div style="font-size:1rem; font-weight:800; color:#0f172a; margin-top:0.55rem;">Diger Ayarlar</div>
                            <div style="font-size:0.82rem; color:#64748b; margin-top:0.3rem;">Ihtiyaca gore yeni ayar bolumleri bu alana eklenecek.</div>
                            <div style="margin-top:0.5rem; display:inline-flex; align-items:center; padding:0.14rem 0.52rem; border:1px solid #cbd5e1; border-radius:999px; background:#f8fafc; color:#475569; font-size:0.72rem; font-weight:800;">yakinda</div>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    `,

    renderPriceListsSettingsLayout: () => {
        SalesModule.ensureCatalogState();
        SalesModule.ensurePriceListActiveSelection();
        SalesModule.syncActivePriceListCategoryRows();

        const activeList = SalesModule.getActivePriceList();
        const priceLists = SalesModule.getPriceLists()
            .slice()
            .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'tr'));
        const activeCategoryId = String(SalesModule.state.catalogActiveCategoryId || '').trim();
        const activeLeaf = SalesModule.getCatalogLeafById(activeCategoryId);
        const pathText = SalesModule.getCatalogCategoryPathText(activeCategoryId);
        const products = activeCategoryId ? SalesModule.getCatalogProductsByCategory(activeCategoryId) : [];
        const lineMap = new Map(
            (Array.isArray(activeList?.lines) ? activeList.lines : [])
                .map((row) => SalesModule.normalizePriceListLine(row))
                .map((row) => [String(row.productId || ''), row])
                .filter(([id]) => id)
        );
        const currency = String(activeList?.currency || 'USD').trim().toUpperCase() || 'USD';
        const activeListId = String(activeList?.id || '').trim();
        const expanded = SalesModule.state.priceListExpandedProducts && typeof SalesModule.state.priceListExpandedProducts === 'object'
            ? SalesModule.state.priceListExpandedProducts
            : {};

        return `
            <section class="stock-shell">
                <div class="stock-subpage-shell">
                    <div class="stock-subpage-head">
                        <h2 class="stock-title">satis & pazarlama / fiyat listeleri</h2>
                        <button class="btn-sm" onclick="SalesModule.openWorkspace('settings')">geri</button>
                    </div>

                    <div class="sales-catalog-shell">
                        <aside class="sales-catalog-left">
                            <div class="sales-catalog-root">Urun gruplari</div>
                            <div class="sales-catalog-root-note">Fiyat girmek istedigin urun grubunu soldan sec.</div>
                            ${SalesModule.renderCatalogTreeHtml()}
                        </aside>

                        <section class="sales-catalog-right">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.75rem; flex-wrap:wrap;">
                                <div>
                                    <div class="sales-catalog-path">${SalesModule.escapeHtml(pathText)}</div>
                                    <div class="sales-catalog-sub">${activeLeaf
                ? `${SalesModule.escapeHtml(String(products.length))} ana urun satiri`
                : 'Soldan bir alt kategori secerek fiyat satirlarini ac.'}</div>
                                </div>
                                <span style="display:inline-flex; align-items:center; padding:0.18rem 0.62rem; border:1px solid #bfdbfe; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-size:0.74rem; font-weight:800;">
                                    sadece aktif listeye eklenir
                                </span>
                            </div>

                            <div style="display:grid; grid-template-columns:minmax(220px,1fr) 130px 130px; gap:0.55rem; align-items:end;">
                                <div>
                                    <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">Aktif fiyat listesi</label>
                                    <select class="stock-input stock-input-tall" onchange="SalesModule.setActivePriceList(this.value)">
                                        ${priceLists.map((row) => {
                    const id = String(row?.id || '').trim();
                    const selected = id === activeListId ? 'selected' : '';
                    return `<option value="${SalesModule.escapeHtml(id)}" ${selected}>${SalesModule.escapeHtml(String(row?.name || '-'))}</option>`;
                }).join('')}
                                    </select>
                                </div>
                                <button class="btn-sm" type="button" onclick="SalesModule.createQuickPriceList()">yeni liste +</button>
                                <button class="btn-sm" type="button" onclick="SalesModule.deleteActivePriceList()" style="color:#b91c1c; border-color:#fecaca; background:#fff1f2;">listeyi sil</button>
                            </div>

                            <div style="display:flex; align-items:center; justify-content:space-between; gap:0.7rem; flex-wrap:wrap; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.55rem 0.65rem; background:#f8fafc;">
                                <div style="font-size:0.82rem; color:#334155;">
                                    <strong>${SalesModule.escapeHtml(String(activeList?.name || 'Genel Liste'))}</strong> listesi icin fiyat giriyorsun.
                                </div>
                                <div style="font-size:0.8rem; color:#64748b;">Para birimi: <strong>${SalesModule.escapeHtml(currency)}</strong></div>
                            </div>

                            <div style="border:1px solid #dbe2ec; border-radius:0.9rem; overflow:auto; background:#fff;">
                                <table style="width:100%; min-width:980px; border-collapse:collapse;">
                                    <thead>
                                        <tr style="border-bottom:1px solid #e2e8f0; background:#f8fafc; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                                            <th style="padding:0.52rem; text-align:center; width:74px;">Detay</th>
                                            <th style="padding:0.52rem; text-align:left;">Urun</th>
                                            <th style="padding:0.52rem; text-align:left; width:170px;">Urun kodu</th>
                                            <th style="padding:0.52rem; text-align:left; width:180px;">ID kodu</th>
                                            <th style="padding:0.52rem; text-align:right; width:180px;">Birim fiyat (${SalesModule.escapeHtml(currency)})</th>
                                            <th style="padding:0.52rem; text-align:left; width:260px;">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${!activeLeaf
                ? '<tr><td colspan="6" style="padding:1.2rem; text-align:center; color:#94a3b8;">Soldan once bir alt urun grubu sec.</td></tr>'
                : (!products.length
                    ? '<tr><td colspan="6" style="padding:1.2rem; text-align:center; color:#94a3b8;">Bu kategoride ana urun yok.</td></tr>'
                    : products.map((product) => {
                        const productId = String(product?.id || '').trim();
                        const line = lineMap.get(productId) || SalesModule.normalizePriceListLine({
                            id: crypto.randomUUID(),
                            productId,
                            categoryId: activeCategoryId,
                            unitPrice: 0,
                            minQty: 1,
                            note: '',
                            variantPrices: []
                        });
                        const variants = (Array.isArray(line.variantPrices) ? line.variantPrices : [])
                            .map((row) => SalesModule.normalizePriceListVariantPrice(row))
                            .sort((a, b) => String(a?.variantCode || '').localeCompare(String(b?.variantCode || ''), 'tr'));
                        const productBadges = SalesModule.getPriceListLineStatusBadges(line);
                        const isOpen = !!expanded[productId];
                        const productIdEsc = SalesModule.escapeHtml(productId);
                        const productName = SalesModule.escapeHtml(String(product?.name || '-'));
                        const productCode = SalesModule.escapeHtml(String(product?.productCode || '-'));
                        const idCodeRaw = String(product?.idCode || '-');
                        const idCode = SalesModule.escapeHtml(idCodeRaw);
                        const badgeHtml = productBadges.length
                            ? productBadges.map((badge) => SalesModule.renderPriceListBadgeHtml(badge)).join(' ')
                            : '<span style="color:#94a3b8;">-</span>';
                        const toggleButton = variants.length > 0
                            ? `<button class="btn-sm" type="button" onclick="SalesModule.togglePriceListProductRow('${productIdEsc}')">${isOpen ? 'kapat' : `varyasyon (${variants.length})`}</button>`
                            : '<span style="font-size:0.78rem; color:#94a3b8;">varyasyon yok</span>';
                        const rowHtml = `
                            <tr style="border-bottom:1px solid #eef2f7;">
                                <td style="padding:0.5rem; text-align:center;">${toggleButton}</td>
                                <td style="padding:0.5rem;">
                                    <div style="font-weight:800; color:#0f172a;">${productName}</div>
                                </td>
                                <td style="padding:0.5rem; font-family:Consolas,monospace; color:#334155;">${productCode}</td>
                                <td style="padding:0.5rem; font-family:Consolas,monospace; color:#1d4ed8; font-weight:800;">
                                    <button class="btn-sm" type="button" style="font-family:Consolas,monospace; font-weight:800; color:#1d4ed8; border-color:#bfdbfe; background:#eff6ff;" onclick="SalesModule.openSalesProductFromPriceList('${productIdEsc}')">${idCode}</button>
                                </td>
                                <td style="padding:0.5rem; text-align:right;">
                                    <input type="number" min="0" step="0.01" class="stock-input stock-input-tall" style="text-align:right; max-width:160px; margin-left:auto;" value="${SalesModule.escapeHtml(SalesModule.formatPriceListInputValue(line.unitPrice))}" onchange="SalesModule.setPriceListMainProductPrice('${productIdEsc}', this.value)">
                                </td>
                                <td style="padding:0.5rem;">
                                    <div style="display:flex; gap:0.3rem; flex-wrap:wrap;">${badgeHtml}</div>
                                </td>
                            </tr>
                        `;
                        if (!isOpen || variants.length === 0) return rowHtml;

                        const variationRows = variants.map((variant) => {
                            const variationId = SalesModule.escapeHtml(String(variant?.variationId || ''));
                            const variantCode = SalesModule.escapeHtml(String(variant?.variantCode || '-'));
                            const isOverride = !!variant?.isOverride;
                            const badges = [];
                            if (isOverride) badges.push({ text: 'ozel fiyat', tone: 'info' });
                            else badges.push({ text: 'ana urunden miras', tone: 'ok' });
                            if (variant?.needsUpdate) badges.push({ text: 'fiyat guncellenmedi', tone: 'warn' });
                            const variationBadgeHtml = badges.map((badge) => SalesModule.renderPriceListBadgeHtml(badge)).join(' ');
                            return `
                                <tr style="border-bottom:1px solid #f1f5f9; background:#f8fafc;">
                                    <td style="padding:0.45rem; text-align:center; color:#94a3b8;">-</td>
                                    <td style="padding:0.45rem;">
                                        <button class="btn-sm" type="button" style="font-family:Consolas,monospace; font-weight:800; color:#1d4ed8; border-color:#bfdbfe; background:#eff6ff;" onclick="SalesModule.openSalesVariationFromPriceList('${productIdEsc}', '${variationId}')">${variantCode}</button>
                                    </td>
                                    <td style="padding:0.45rem; color:#64748b;">varyasyon</td>
                                    <td style="padding:0.45rem; color:#64748b;">ana urun: ${idCode}</td>
                                    <td style="padding:0.45rem; text-align:right;">
                                        <input type="number" min="0" step="0.01" class="stock-input stock-input-tall" style="text-align:right; max-width:160px; margin-left:auto;" value="${SalesModule.escapeHtml(SalesModule.formatPriceListInputValue(variant?.unitPrice || 0))}" onchange="SalesModule.setPriceListVariantPrice('${productIdEsc}', '${variationId}', this.value)">
                                    </td>
                                    <td style="padding:0.45rem;">
                                        <div style="display:flex; gap:0.32rem; flex-wrap:wrap; align-items:center;">
                                            ${variationBadgeHtml}
                                            ${isOverride
                    ? `<button class="btn-sm" type="button" onclick="SalesModule.resetPriceListVariantToInherited('${productIdEsc}', '${variationId}')">mirasa don</button>`
                    : ''}
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('');
                        return `${rowHtml}${variationRows}`;
                    }).join(''))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </div>
            </section>
        `;
    },

    renderProformaSettingsLayout: () => {
        const settings = SalesModule.getProformaSettings();
        if (!SalesModule.state.proformaSettingsDraft || typeof SalesModule.state.proformaSettingsDraft !== 'object') {
            SalesModule.state.proformaSettingsDraft = SalesModule.buildProformaSettingsDraft(settings);
            SalesModule.state.proformaSettingsSnapshot = SalesModule.serializeProformaSettings(SalesModule.state.proformaSettingsDraft);
        }
        const draft = SalesModule.state.proformaSettingsDraft;
        const bankDraft = (SalesModule.state.proformaBankDraft && typeof SalesModule.state.proformaBankDraft === 'object')
            ? SalesModule.state.proformaBankDraft
            : { bankName: '', branchCode: '', accountNo: '', iban: '' };
        const bankAccounts = Array.isArray(draft.bankAccounts) ? draft.bankAccounts : [];
        const hasChanges = SalesModule.hasProformaSettingsChanges();

        return `
            <section class="stock-shell">
                <div class="stock-subpage-shell">
                    <div class="stock-subpage-head">
                        <h2 class="stock-title">satis & pazarlama / proforma ayarlari</h2>
                        <button class="btn-sm" onclick="SalesModule.cancelProformaSettings()">geri</button>
                    </div>

                    <div class="card-table" style="padding:1.15rem 1.2rem;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.8rem; flex-wrap:wrap; margin-bottom:0.85rem;">
                            <div>
                                <div style="font-size:1.32rem; font-weight:800; color:#1e293b;">Proforma Ayarlari</div>
                                <div style="font-size:0.9rem; color:#64748b; margin-top:0.2rem;">PDF ciktilarinda kullanilacak logo, banka hesaplari ve varsayilan notlari buradan duzenleyebilirsin.</div>
                            </div>
                            <span style="display:inline-flex; align-items:center; padding:0.2rem 0.62rem; border:1px solid ${hasChanges ? '#fcd34d' : '#86efac'}; border-radius:999px; background:${hasChanges ? '#fffbeb' : '#f0fdf4'}; color:${hasChanges ? '#92400e' : '#166534'}; font-size:0.74rem; font-weight:800;">
                                ${hasChanges ? 'kaydedilmemis degisiklik var' : 'tum degisiklikler kayitli'}
                            </span>
                        </div>

                        <div style="border-top:1px solid #e2e8f0; padding-top:0.9rem;">
                            <div style="font-size:1rem; font-weight:800; color:#1e293b;">Logo</div>
                            <div style="margin-top:0.55rem; display:flex; align-items:center; gap:0.7rem; flex-wrap:wrap;">
                                <input id="sales_proforma_logo_input" type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" style="display:none;" onchange="SalesModule.handleProformaLogoInput(this)">
                                <button class="btn-sm" type="button" onclick="document.getElementById('sales_proforma_logo_input')?.click()">
                                    <i data-lucide="upload" width="14" height="14"></i>
                                    Logo Degistir
                                </button>
                                <button class="btn-sm" type="button" onclick="SalesModule.clearProformaLogo()" ${draft.logoDataUrl ? '' : 'disabled'}>Logo Temizle</button>
                                <div style="border:1px solid #e2e8f0; border-radius:0.72rem; min-height:70px; min-width:170px; padding:0.35rem; display:flex; align-items:center; justify-content:center; background:#f8fafc;">
                                    ${draft.logoDataUrl
                ? `<img src="${SalesModule.escapeHtml(draft.logoDataUrl)}" alt="logo" style="max-height:62px; max-width:160px; object-fit:contain;">`
                : '<div style="font-size:0.8rem; color:#94a3b8; font-weight:700;">Logo secilmedi</div>'}
                                </div>
                            </div>
                            <div style="font-size:0.82rem; color:#64748b; margin-top:0.35rem;">En iyi sonuc icin PNG veya JPG formatinda bir logo yukleyin.</div>
                        </div>

                        <div style="border-top:1px solid #e2e8f0; margin-top:0.95rem; padding-top:0.9rem;">
                            <div style="font-size:1rem; font-weight:800; color:#1e293b; margin-bottom:0.55rem;">Banka Hesaplari</div>
                            <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.85rem;">
                                <div style="display:flex; flex-direction:column; gap:0.45rem;">
                                    ${bankAccounts.length === 0
                ? '<div style="padding:0.7rem; border:1px dashed #cbd5e1; border-radius:0.62rem; color:#94a3b8; font-size:0.86rem;">Kayitli banka hesabi yok.</div>'
                : bankAccounts.map((row) => `
                                            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; border:1px solid #e2e8f0; border-radius:0.62rem; background:#f8fafc; padding:0.55rem 0.62rem;">
                                                <div style="min-width:0;">
                                                    <div style="font-size:1.02rem; font-weight:800; color:#1e3a8a;">${SalesModule.escapeHtml(row?.bankName || '-')}</div>
                                                    <div style="font-size:0.84rem; color:#64748b; margin-top:0.15rem;">${SalesModule.escapeHtml(row?.iban || '-')}</div>
                                                </div>
                                                <button class="btn-sm" type="button" onclick="SalesModule.removeProformaBankAccount('${SalesModule.escapeHtml(String(row?.id || ''))}')" style="color:#dc2626; border-color:#fecaca; background:#fff1f2;">
                                                    <i data-lucide="trash-2" width="14" height="14"></i>
                                                </button>
                                            </div>
                                        `).join('')}
                                </div>

                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-top:0.75rem;">
                                    <input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(bankDraft.bankName || ''))}" placeholder="Banka Adi" oninput="SalesModule.setProformaBankDraftField('bankName', this.value)">
                                    <input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(bankDraft.branchCode || ''))}" placeholder="Sube Kodu" oninput="SalesModule.setProformaBankDraftField('branchCode', this.value)">
                                    <input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(bankDraft.accountNo || ''))}" placeholder="Hesap No" oninput="SalesModule.setProformaBankDraftField('accountNo', this.value)">
                                    <input class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(bankDraft.iban || ''))}" placeholder="IBAN" oninput="SalesModule.setProformaBankDraftField('iban', this.value)">
                                </div>
                                <button class="btn-primary" type="button" onclick="SalesModule.addProformaBankAccount()" style="width:100%; margin-top:0.65rem;">
                                    <i data-lucide="plus-circle" width="14" height="14"></i>
                                    Hesap Ekle
                                </button>
                            </div>
                        </div>

                        <div style="border-top:1px solid #e2e8f0; margin-top:0.95rem; padding-top:0.9rem;">
                            <div style="font-size:1rem; font-weight:800; color:#1e293b;">Varsayilan Notlar</div>
                            <textarea class="stock-textarea" style="margin-top:0.5rem; min-height:150px;" oninput="SalesModule.setProformaSettingsDraftField('defaultNotes', this.value); SalesModule.renderProformaSettingsPreview();" placeholder="Satis kosullari gibi proforma altina eklenecek standart notlari buraya girin.">${SalesModule.escapeHtml(String(draft.defaultNotes || ''))}</textarea>
                        </div>

                        <div style="border-top:1px solid #e2e8f0; margin-top:0.95rem; padding-top:0.9rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; flex-wrap:wrap;">
                                <div>
                                    <div style="font-size:1rem; font-weight:800; color:#1e293b;">Proforma Onizleme</div>
                                    <div style="font-size:0.82rem; color:#64748b; margin-top:0.2rem;">Ayarlarin ornek proforma gorunumu asagida yer alir.</div>
                                </div>
                                <button class="btn-sm" type="button" onclick="SalesModule.renderProformaSettingsPreview()">onizlemeyi yenile</button>
                            </div>
                            <div id="sales_proforma_preview_container" style="margin-top:0.6rem;">
                                ${SalesModule.buildProformaPreviewDocumentHtml(draft)}
                            </div>
                        </div>

                        <div style="display:flex; justify-content:flex-end; gap:0.45rem; margin-top:1rem;">
                            <button class="btn-sm" type="button" onclick="SalesModule.cancelProformaSettings()">iptal</button>
                            <button class="btn-primary" type="button" onclick="SalesModule.saveProformaSettings()">
                                <i data-lucide="save" width="14" height="14"></i>
                                Ayarlari Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        `;
    },

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
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">Urun grubu</label>
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
                <div><div style="font-size:0.73rem; color:#64748b;">Urun grubu</div><div style="display:flex; gap:0.35rem; flex-wrap:wrap;">${typeHtml}</div></div>
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
        const allRows = SalesModule.getCustomers();
        const rows = SalesModule.getFilteredCustomers();
        const filters = SalesModule.state.customerFilters || { name: '', city: '', status: 'ALL', editor: 'ALL' };
        const editorStats = SalesModule.getCustomerEditorStats(allRows);
        const completedCount = rows.filter((row) => String(row?.status || '') === 'COMPLETED').length;
        const incompleteCount = rows.filter((row) => String(row?.status || '') === 'INCOMPLETE').length;
        const activeStatus = String(filters.status || 'ALL').trim().toUpperCase();
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

                    <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.65rem; margin-bottom:0.85rem;">
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:0.95rem; padding:0.8rem 0.9rem; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="font-size:0.76rem; color:#64748b; font-weight:700;">Toplam Liste</div>
                                <div style="font-size:1.5rem; font-weight:900; color:#0f172a;">${rows.length}</div>
                            </div>
                            <div style="width:34px; height:34px; border-radius:999px; background:#eff6ff; color:#1d4ed8; display:flex; align-items:center; justify-content:center; font-weight:900;">#</div>
                        </div>
                        <div style="background:#fff; border:1px solid #bbf7d0; border-radius:0.95rem; padding:0.8rem 0.9rem; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="font-size:0.76rem; color:#15803d; font-weight:700;">Tamamlanan</div>
                                <div style="font-size:1.5rem; font-weight:900; color:#166534;">${completedCount}</div>
                            </div>
                            <div style="width:34px; height:34px; border-radius:999px; background:#f0fdf4; color:#15803d; display:flex; align-items:center; justify-content:center; font-size:0.72rem; font-weight:900;">OK</div>
                        </div>
                        <div style="background:#fff; border:1px solid #fecdd3; border-radius:0.95rem; padding:0.8rem 0.9rem; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="font-size:0.76rem; color:#be123c; font-weight:700;">Eksik (Tamamlanacak)</div>
                                <div style="font-size:1.5rem; font-weight:900; color:#be123c;">${incompleteCount}</div>
                            </div>
                            <div style="width:34px; height:34px; border-radius:999px; background:#fff1f2; color:#be123c; display:flex; align-items:center; justify-content:center; font-weight:900;">!</div>
                        </div>
                    </div>

                    <div class="card-table" style="padding:1rem 1.1rem;">
                        <div style="display:flex; flex-direction:column; gap:0.7rem; margin-bottom:0.7rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap;">
                                <div style="font-size:0.96rem; font-weight:800; color:#0f172a;">Kayitli musteriler</div>
                                <div style="display:flex; gap:0.45rem; align-items:center; flex-wrap:wrap;">
                                    <input id="sales_customer_excel_import_input" type="file" accept=".xls,.xlsx" style="display:none;" onchange="SalesModule.handleCustomerExcelImportInput(this)">
                                    <button class="btn-sm" onclick="SalesModule.openCustomerExcelImportPicker()">excelden ice aktar</button>
                                    <button class="btn-primary" onclick="SalesModule.openCreateCustomerModal()">yeni musteri ekle +</button>
                                </div>
                            </div>
                            <div style="display:flex; gap:0.55rem; align-items:center; flex-wrap:wrap;">
                                <div style="position:relative; flex:1; min-width:280px;">
                                    <input id="sales_customer_filter_name" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(filters.name || ''))}" oninput="SalesModule.setCustomerFilter('name', this.value)" placeholder="Musteri unvani, cari kod veya vergi no ile ara..." style="padding-right:84px;">
                                    <button class="btn-sm" type="button" onclick="UI.renderCurrentPage()" style="position:absolute; right:6px; top:6px; height:30px;">ara</button>
                                </div>
                                <div style="display:flex; gap:0.35rem; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.2rem;">
                                    <button class="btn-sm" type="button" onclick="SalesModule.setCustomerFilter('status','ALL')" style="${activeStatus === 'ALL' ? 'background:#fff; border-color:#cbd5e1; font-weight:800;' : 'background:transparent; border-color:transparent;'}">Hepsi</button>
                                    <button class="btn-sm" type="button" onclick="SalesModule.setCustomerFilter('status','COMPLETED')" style="${activeStatus === 'COMPLETED' ? 'background:#fff; border-color:#86efac; color:#166534; font-weight:800;' : 'background:transparent; border-color:transparent;'}">Tamamlananlar</button>
                                    <button class="btn-sm" type="button" onclick="SalesModule.setCustomerFilter('status','INCOMPLETE')" style="${activeStatus === 'INCOMPLETE' ? 'background:#fff; border-color:#fda4af; color:#be123c; font-weight:800;' : 'background:transparent; border-color:transparent;'}">Eksikler</button>
                                </div>
                                <div style="display:flex; align-items:center; gap:0.35rem; padding:0.2rem 0.45rem; border:1px solid #e2e8f0; border-radius:0.65rem; background:#f8fafc;">
                                    <span style="font-size:0.65rem; color:#94a3b8; font-weight:800; text-transform:uppercase;">Duzenleyen</span>
                                    <select class="stock-input stock-input-tall" style="min-width:180px; height:30px; padding:0 0.45rem; font-size:0.8rem;" onchange="SalesModule.setCustomerFilter('editor', this.value)">
                                        <option value="ALL" ${String(filters.editor || 'ALL') === 'ALL' ? 'selected' : ''}>Hepsi (${allRows.length})</option>
                                        ${editorStats.map((stat) => `<option value="${SalesModule.escapeHtml(String(stat.lastEditor || ''))}" ${String(filters.editor || '') === String(stat.lastEditor || '') ? 'selected' : ''}>${SalesModule.escapeHtml(String(stat.lastEditor || ''))} (${SalesModule.escapeHtml(String(stat.count || 0))})</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            <div style="display:grid; grid-template-columns:1fr; gap:0.55rem;">
                                <input id="sales_customer_filter_city" class="stock-input stock-input-tall" value="${SalesModule.escapeHtml(String(filters.city || ''))}" oninput="SalesModule.setCustomerFilter('city', this.value)" placeholder="sehre gore ara (opsiyonel)">
                            </div>
                        </div>
                        <div style="overflow:auto;">
                            <table style="width:100%; min-width:1180px; border-collapse:collapse;">
                                <thead>
                                    <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.73rem; text-transform:uppercase;">
                                        <th style="padding:0.55rem; text-align:left;">Durum</th>
                                        <th style="padding:0.55rem; text-align:left;">Musteri unvani</th>
                                        <th style="padding:0.55rem; text-align:left;">Yetkili kisi</th>
                                        <th style="padding:0.55rem; text-align:left;">GSM</th>
                                        <th style="padding:0.55rem; text-align:left;">Sehir</th>
                                        <th style="padding:0.55rem; text-align:left;">Cari kodu</th>
                                        <th style="padding:0.55rem; text-align:left;">Vergi no</th>
                                        <th style="padding:0.55rem; text-align:left;">Duzenleyen</th>
                                        <th style="padding:0.55rem; text-align:right;">Islem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows.length === 0
                ? '<tr><td colspan="9" style="padding:1rem; text-align:center; color:#94a3b8;">Kayit bulunamadi.</td></tr>'
                : rows.map((row) => {
                    const isCompleted = String(row?.status || '') === 'COMPLETED';
                    const missing = Array.isArray(row?.missingFields) ? row.missingFields : [];
                    const firstContact = Array.isArray(row?.customerContacts) && row.customerContacts.length ? row.customerContacts[0] : null;
                    const primaryName = String(firstContact?.name || row?.authorizedPerson || '').trim();
                    const primaryPhone = Array.isArray(firstContact?.phones) && firstContact.phones.length
                        ? String(firstContact.phones[0] || '').trim()
                        : String(row?.phoneAlt || '').trim();
                    const editorName = String(row?.lastEditor || '-').trim() || '-';
                    const updatedAtText = row?.updatedAt
                        ? new Date(row.updatedAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '-';
                    const rowId = SalesModule.escapeHtml(String(row?.id || ''));
                    return `
                                                <tr style="border-bottom:1px solid #f1f5f9; background:${isCompleted ? '#ffffff' : '#fff7f8'};">
                                                    <td style="padding:0.55rem;">
                                                        <span style="display:inline-flex; align-items:center; padding:0.2rem 0.58rem; border:1px solid ${isCompleted ? '#86efac' : '#fecdd3'}; border-radius:999px; font-size:0.72rem; font-weight:800; background:${isCompleted ? '#f0fdf4' : '#fff1f2'}; color:${isCompleted ? '#166534' : '#be123c'};">
                                                            ${isCompleted ? 'Tamamlandi' : 'Eksik'}
                                                        </span>
                                                    </td>
                                                    <td style="padding:0.55rem;">
                                                        <div style="font-weight:800; color:#334155;">${SalesModule.escapeHtml(String(row?.name || '-'))}</div>
                                                        ${!isCompleted && missing.length > 0
                        ? `<div style="display:flex; flex-wrap:wrap; gap:0.22rem; margin-top:0.28rem;">
                                                                ${missing.slice(0, 3).map((item) => `<span style="font-size:0.62rem; border:1px solid #fecdd3; background:#fff1f2; color:#be123c; border-radius:999px; padding:0.08rem 0.32rem;">${SalesModule.escapeHtml(String(item?.label || 'Eksik'))} eksik</span>`).join('')}
                                                                ${missing.length > 3 ? `<span style="font-size:0.62rem; border:1px solid #fecdd3; background:#fff1f2; color:#be123c; border-radius:999px; padding:0.08rem 0.32rem;">+${SalesModule.escapeHtml(String(missing.length - 3))} daha</span>` : ''}
                                                           </div>`
                        : ''}
                                                    </td>
                                                    <td style="padding:0.55rem; color:#334155; font-weight:700;">${SalesModule.escapeHtml(primaryName || '-')}</td>
                                                    <td style="padding:0.55rem; color:#334155;">${SalesModule.escapeHtml(primaryPhone || '-')}</td>
                                                    <td style="padding:0.55rem;">${SalesModule.escapeHtml([row?.city, row?.district].filter(Boolean).join(' / ') || '-')}</td>
                                                    <td style="padding:0.55rem; font-family:Consolas, monospace; font-weight:800; color:#1d4ed8;">${SalesModule.escapeHtml(String(row?.externalCode || '-'))}</td>
                                                    <td style="padding:0.55rem;">${SalesModule.escapeHtml(String(row?.taxNo || '-'))}</td>
                                                    <td style="padding:0.55rem;">
                                                        <div style="display:flex; flex-direction:column; gap:0.15rem;">
                                                            <span style="display:inline-flex; align-items:center; width:max-content; padding:0.1rem 0.45rem; border:1px solid #bfdbfe; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-size:0.7rem; font-weight:800;">${SalesModule.escapeHtml(editorName)}</span>
                                                            <span style="font-size:0.66rem; color:#94a3b8;">${SalesModule.escapeHtml(updatedAtText)}</span>
                                                        </div>
                                                    </td>
                                                    <td style="padding:0.55rem; text-align:right;">
                                                        <div style="display:inline-flex; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end;">
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
        if (view === 'sales') return SalesModule.renderSalesWorkspaceLayout();
        if (view === 'customers') return SalesModule.renderCustomersLayout();
        if (view === 'personnel') return SalesModule.renderPersonnelLayout();
        if (view === 'products') return SalesModule.renderProductsLayout();
        if (view === 'settings') return SalesModule.renderSettingsLayout();
        if (view === 'settings-price-lists') return SalesModule.renderPriceListsSettingsLayout();
        if (view === 'settings-proforma') return SalesModule.renderProformaSettingsLayout();
        return SalesModule.renderMenuLayout();
    }
};




