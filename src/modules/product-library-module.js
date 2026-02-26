const ProductLibraryModule = {
    state: {
        activeCategory: null,
        extruderTab: 'ROD', // ROD | PIPE
        filters: { dia: '', len: '', thick: '', color: '', bubble: false },
        hardwareFilters: { shape: '', dia: '', len: '', mat: '' }, // New filters for Hardware
        boxSearchName: '',
        boxSearchSize: '',
        boxFormOpen: false,
        boxEditingId: null,
        boxSelectedId: null,
        boxDraftName: '',
        boxDraftWidth: '',
        boxDraftLength: '',
        boxDraftHeight: '',
        boxDraftPrint: 'YAZISIZ',
        boxDraftNote: '',
        consumableSearchName: '',
        consumableSearchType: '',
        consumableSearchId: '',
        consumableFormOpen: false,
        consumableEditingId: null,
        consumableSelectedId: null,
        consumableDraftName: '',
        consumableDraftType: 'BANT',
        consumableDraftTypeCustom: '',
        consumableDraftUnit: 'adet',
        consumableDraftBrand: '',
        consumableDraftPack: '',
        consumableDraftSuppliers: [],
        consumableDraftSupplierInput: '',
        consumableDraftNote: '',
        consumableDraftImageData: '',
        editingProductId: null,
        isFormVisible: false, // New State
        masterFilters: { categoryId: '', name: '', length: '', color: '', code: '' },
        masterFormOpen: false,
        masterEditingId: null,
        masterSelectedId: null,
        masterDraftCategoryId: 'cat1',
        masterDraftName: '',
        masterDraftUnit: 'adet',
        masterDraftUnitAmount: '',
        masterDraftBrand: '',
        masterDraftPack: '',
        masterDraftLength: '',
        masterDraftColor: '',
        masterDraftSupplierIds: [],
        masterDraftSupplierLinks: [],
        masterDraftSupplierCode: '',
        masterDraftNote: '',
        masterDraftAttachment: null,
        workspaceView: 'menu' // menu | models | components | master
    },

    render: (container) => {
        ProductLibraryModule.ensureMasterDefaults();
        const view = String(ProductLibraryModule.state.workspaceView || 'menu');
        if (view === 'master') {
            ProductLibraryModule.renderMasterPage(container);
            return;
        }
        if (view === 'models') {
            ProductLibraryModule.renderWorkspacePlaceholder(
                container,
                'Urun Modelleri Olusturma',
                'Bu alan daha sonra acilacak.'
            );
            return;
        }
        if (view === 'components') {
            ProductLibraryModule.renderWorkspacePlaceholder(
                container,
                'Parca ve Bilesen Olusturma',
                'Bu alan daha sonra acilacak.'
            );
            return;
        }
        ProductLibraryModule.renderWorkspaceMenu(container);
    },

    openWorkspace: (view) => {
        ProductLibraryModule.state.workspaceView = String(view || 'menu');
        UI.renderCurrentPage();
    },

    goWorkspaceMenu: () => {
        ProductLibraryModule.state.workspaceView = 'menu';
        UI.renderCurrentPage();
    },

    renderWorkspaceMenu: (container) => {
        container.innerHTML = `
            <div style="max-width:1050px; margin:0 auto;">
                <div style="text-align:center; margin:0.5rem 0 2rem 0;">
                    <h2 class="page-title" style="margin:0; font-size:2rem;">Urun ve Parca Olusturma</h2>
                    <div style="color:#64748b; margin-top:0.4rem;">Uretim kartlarini buradan yonetin</div>
                </div>

                <div class="apps-grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:1.35rem;">
                    <a href="#" onclick="ProductLibraryModule.openWorkspace('models'); return false;" class="app-card" style="min-height:220px;">
                        <div class="icon-box g-blue"><i data-lucide="file-plus-2" width="30" height="30"></i></div>
                        <div class="app-name">Urun Modelleri Olusturma</div>
                    </a>
                    <a href="#" onclick="ProductLibraryModule.openWorkspace('components'); return false;" class="app-card" style="min-height:220px;">
                        <div class="icon-box g-orange"><i data-lucide="component" width="30" height="30"></i></div>
                        <div class="app-name">Parca & Bilesen Olusturma</div>
                    </a>
                    <a href="#" onclick="ProductLibraryModule.openWorkspace('master'); return false;" class="app-card" style="min-height:220px;">
                        <div class="icon-box g-pink"><i data-lucide="library" width="30" height="30"></i></div>
                        <div class="app-name">Master Urun Kutuphanesi</div>
                    </a>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    renderWorkspacePlaceholder: (container, title, subtitle) => {
        container.innerHTML = `
            <div style="max-width:960px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h2 class="page-title" style="margin:0;">${ProductLibraryModule.escapeHtml(title)}</h2>
                    <button class="btn-sm" onclick="ProductLibraryModule.goWorkspaceMenu()">geri</button>
                </div>
                <div class="card-table" style="padding:2.2rem; text-align:center; color:#94a3b8;">
                    <div style="font-weight:800; color:#334155; margin-bottom:0.45rem;">Hazirlaniyor</div>
                    <div style="font-size:0.92rem;">${ProductLibraryModule.escapeHtml(subtitle || 'Bu sayfa daha sonra acilacak.')}</div>
                </div>
            </div>
        `;
    },

    ensureMasterDefaults: () => {
        if (!DB.data.data.productCategories || DB.data.data.productCategories.length === 0) {
            DB.data.data.productCategories = [
                { id: 'cat1', name: 'Alüminyum profil', icon: '🏗️', prefix: 'ALM' },
                { id: 'cat3', name: 'Hırdavat & Vida', icon: '🔩', prefix: 'VID' },
                { id: 'cat_ext', name: 'Ekstrüder pleksi', icon: '🏭', prefix: 'AKS' },
                { id: 'cat_box', name: 'Koli', icon: '[ ]', prefix: 'KLI' },
                { id: 'cat_sarf', name: 'Sarf & Genel Malzeme', icon: 'SG', prefix: 'SRF' }
            ];
        }

        const defaults = [
            { id: 'cat1', name: 'Alüminyum profil', icon: '🏗️', prefix: 'ALM' },
            { id: 'cat3', name: 'Hırdavat & Vida', icon: '🔩', prefix: 'VID' },
            { id: 'cat_ext', name: 'Ekstrüder pleksi', icon: '🏭', prefix: 'AKS' },
            { id: 'cat_box', name: 'Koli', icon: '[ ]', prefix: 'KLI' },
            { id: 'cat_sarf', name: 'Sarf & Genel Malzeme', icon: 'SG', prefix: 'SRF' }
        ];
        defaults.forEach(def => {
            if (!DB.data.data.productCategories.some(c => c.id === def.id)) {
                DB.data.data.productCategories.push({ ...def });
            }
        });

        DB.data.data.productCategories = (DB.data.data.productCategories || [])
            .filter(Boolean)
            .map(c => {
                const safeName = String(c.name || '').trim() || 'Adsiz Kategori';
                return {
                    ...c,
                    name: safeName,
                    icon: c.icon || '📦',
                    prefix: ProductLibraryModule.buildCategoryPrefix(c.prefix || safeName, c.id)
                };
            });

        if (!Array.isArray(DB.data.data.products)) DB.data.data.products = [];
        if (!Array.isArray(DB.data.data.suppliers)) DB.data.data.suppliers = [];
        if (!DB.data.meta.options || typeof DB.data.meta.options !== 'object') DB.data.meta.options = {};
        if (!Array.isArray(DB.data.meta.options.masterUnits) || DB.data.meta.options.masterUnits.length === 0) {
            DB.data.meta.options.masterUnits = ['adet', 'kg', 'mt', 'koli'];
        }
        if (!Array.isArray(DB.data.meta.options.masterColors) || DB.data.meta.options.masterColors.length === 0) {
            DB.data.meta.options.masterColors = ['Siyah', 'Beyaz', 'Antrasit', 'Fume'];
        }

        const cats = ProductLibraryModule.getMasterCategories();
        const firstCategoryId = cats[0]?.id || '';
        if (!cats.some(c => c.id === ProductLibraryModule.state.masterDraftCategoryId)) {
            ProductLibraryModule.state.masterDraftCategoryId = firstCategoryId;
        }
        const unitOptions = ProductLibraryModule.getMasterUnitOptions();
        if (!unitOptions.includes(ProductLibraryModule.state.masterDraftUnit)) {
            ProductLibraryModule.state.masterDraftUnit = unitOptions[0] || '';
        }
    },

    normalizeAsciiUpper: (value) => {
        return String(value || '')
            .replace(/ı/g, 'i')
            .replace(/İ/g, 'I')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase();
    },

    buildCategoryPrefix: (rawPrefix, categoryId = '') => {
        const id = String(categoryId || '').toLowerCase();
        const src = String(rawPrefix || '').trim();
        let prefix = ProductLibraryModule.normalizeAsciiUpper(src).slice(0, 3);
        if (!prefix) {
            if (id === 'cat1') prefix = 'ALM';
            else if (id === 'cat3') prefix = 'VID';
            else if (id === 'cat_ext') prefix = 'AKS';
            else if (id === 'cat_box') prefix = 'KLI';
            else if (id === 'cat_sarf') prefix = 'SRF';
            else prefix = 'URN';
        }
        return prefix.padEnd(3, 'X');
    },

    getMasterCategories: () => {
        return [...(DB.data.data.productCategories || [])].sort((a, b) => {
            return String(a?.name || '').localeCompare(String(b?.name || ''), 'tr');
        });
    },

    getMasterUnitOptions: () => {
        if (!DB.data.meta.options || typeof DB.data.meta.options !== 'object') DB.data.meta.options = {};
        if (!Array.isArray(DB.data.meta.options.masterUnits)) DB.data.meta.options.masterUnits = ['adet'];
        return DB.data.meta.options.masterUnits;
    },

    getMasterColorOptions: () => {
        if (!DB.data.meta.options || typeof DB.data.meta.options !== 'object') DB.data.meta.options = {};
        if (!Array.isArray(DB.data.meta.options.masterColors)) DB.data.meta.options.masterColors = [];
        return DB.data.meta.options.masterColors;
    },

    getMasterSuppliers: () => {
        return (DB.data.data.suppliers || [])
            .map(s => ({
                id: String(s?.id || ''),
                name: String(s?.name || '').trim()
            }))
            .filter(s => s.id && s.name)
            .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    },

    collectGlobalCodes: (exclude = null) => {
        const bag = new Set();
        const add = (value) => {
            const normalized = String(value || '').trim().toUpperCase();
            if (!normalized) return;
            bag.add(normalized);
        };
        const shouldSkip = (collection, row, field) => {
            if (!exclude || !row) return false;
            if (exclude.collection !== collection) return false;
            if (String(exclude.id || '') !== String(row.id || '')) return false;
            if (exclude.field && exclude.field !== field) return false;
            return true;
        };
        const readMany = (collection, list, fields) => {
            if (!Array.isArray(list)) return;
            list.forEach(row => {
                fields.forEach(field => {
                    if (shouldSkip(collection, row, field)) return;
                    add(row?.[field]);
                });
            });
        };

        readMany('products', DB.data?.data?.products, ['code']);
        readMany('cncCards', DB.data?.data?.cncCards, ['productCode', 'cncId']);
        readMany('sawCutOrders', DB.data?.data?.sawCutOrders, ['code']);
        readMany('extruderLibraryCards', DB.data?.data?.extruderLibraryCards, ['cardCode']);
        readMany('plexiPolishCards', DB.data?.data?.plexiPolishCards, ['cardCode']);
        readMany('pvdCards', DB.data?.data?.pvdCards, ['cardCode']);
        readMany('ibrahimPolishCards', DB.data?.data?.ibrahimPolishCards, ['cardCode']);
        readMany('eloksalCards', DB.data?.data?.eloksalCards, ['cardCode']);
        readMany('aluminumProfiles', DB.data?.data?.aluminumProfiles, ['code']);
        return bag;
    },

    isGlobalCodeTaken: (code, exclude = null) => {
        const normalized = String(code || '').trim().toUpperCase();
        if (!normalized) return false;
        return ProductLibraryModule.collectGlobalCodes(exclude).has(normalized);
    },

    getUnitAmountType: (unit) => {
        const u = ProductLibraryModule.normalizeAsciiUpper(unit || '');
        if (u === 'MT' || u === 'M' || u === 'METRE' || u === 'METER') return 'mm';
        if (u === 'KG' || u === 'KILOGRAM') return 'gram';
        if (u === 'ADET') return 'adet';
        return String(unit || '').trim() || 'adet';
    },

    resolveCategoryForProduct: (product) => {
        const categories = ProductLibraryModule.getMasterCategories();
        const byId = categories.find(c => c.id === product?.categoryId);
        if (byId) return byId;

        const raw = String(product?.category || '').trim();
        const rawNorm = ProductLibraryModule.normalizeAsciiUpper(raw);
        const exact = categories.find(c => ProductLibraryModule.normalizeAsciiUpper(c.name) === rawNorm);
        if (exact) return exact;

        const type = ProductLibraryModule.normalizeAsciiUpper(product?.type || '');
        if (rawNorm.includes('HIRDAVAT') || rawNorm.includes('VIDA') || rawNorm.includes('HARDWARE')) {
            return categories.find(c => c.id === 'cat3') || null;
        }
        if (rawNorm.includes('EKSTR') || rawNorm.includes('PLEKSI') || type === 'ROD' || type === 'PIPE') {
            return categories.find(c => c.id === 'cat_ext') || null;
        }
        if (rawNorm.includes('KOLI') || rawNorm.includes('KUTU')) {
            return categories.find(c => c.id === 'cat_box') || null;
        }
        if (rawNorm.includes('SARF') || rawNorm.includes('GENEL')) {
            return categories.find(c => c.id === 'cat_sarf') || null;
        }
        if (rawNorm.includes('ALUMINYUM') || rawNorm.includes('ALUMINUM')) {
            return categories.find(c => c.id === 'cat1') || null;
        }

        if (raw) {
            return {
                id: '',
                name: raw,
                icon: '📦',
                prefix: ProductLibraryModule.buildCategoryPrefix(raw)
            };
        }
        return categories[0] || { id: '', name: 'Diger', icon: '📦', prefix: 'URN' };
    },

    extractSupplierRefs: (product) => {
        const supplierOptions = ProductLibraryModule.getMasterSuppliers();
        const refs = [];
        const pushRef = (value) => {
            if (!value) return;
            if (Array.isArray(value)) {
                value.forEach(pushRef);
                return;
            }
            if (typeof value === 'object') {
                const id = String(value.id || '').trim();
                const name = String(value.name || '').trim();
                if (id || name) refs.push({ id, name });
                return;
            }
            const text = String(value || '').trim();
            if (!text) return;
            const byId = supplierOptions.find(x => x.id === text);
            if (byId) {
                refs.push({ id: byId.id, name: byId.name });
                return;
            }
            const byName = supplierOptions.find(x =>
                ProductLibraryModule.normalizeAsciiUpper(x.name) === ProductLibraryModule.normalizeAsciiUpper(text)
            );
            if (byName) refs.push({ id: byName.id, name: byName.name });
            else refs.push({ id: '', name: text });
        };

        pushRef(product?.suppliers);
        pushRef(product?.supplierIds);
        pushRef(product?.supplierId);
        pushRef(product?.supplierNames);
        pushRef(product?.supplierName);
        pushRef(product?.specs?.suppliers);

        const uniq = new Map();
        refs.forEach(ref => {
            const key = `${ref.id || ''}|${ProductLibraryModule.normalizeAsciiUpper(ref.name || '')}`;
            if (!uniq.has(key)) uniq.set(key, ref);
        });
        return Array.from(uniq.values());
    },

    extractSupplierLinks: (product) => {
        const refs = ProductLibraryModule.extractSupplierRefs(product);
        const directLinks = Array.isArray(product?.supplierLinks)
            ? product.supplierLinks
            : Array.isArray(product?.specs?.supplierLinks)
                ? product.specs.supplierLinks
                : [];
        const fallbackCode = String(product?.supplierProductCode || product?.specs?.supplierProductCode || '').trim();

        if (directLinks.length > 0) {
            const normalized = directLinks.map(link => ({
                supplierId: String(link?.supplierId || link?.id || '').trim(),
                supplierName: String(link?.supplierName || link?.name || '').trim(),
                supplierCode: String(link?.supplierCode || link?.code || '').trim()
            })).filter(link => link.supplierId || link.supplierName);

            const uniq = new Map();
            normalized.forEach(link => {
                const key = link.supplierId || ProductLibraryModule.normalizeAsciiUpper(link.supplierName || '');
                if (!uniq.has(key)) uniq.set(key, link);
            });
            return Array.from(uniq.values());
        }

        return refs.map(ref => ({
            supplierId: String(ref?.id || '').trim(),
            supplierName: String(ref?.name || '').trim(),
            supplierCode: fallbackCode
        }));
    },

    getMasterProducts: () => {
        return (DB.data.data.products || []).map((raw, index) => {
            const category = ProductLibraryModule.resolveCategoryForProduct(raw);
            const specs = (raw?.specs && typeof raw.specs === 'object') ? raw.specs : {};
            const supplierLinks = ProductLibraryModule.extractSupplierLinks(raw);
            const suppliers = supplierLinks.length > 0
                ? supplierLinks.map(link => ({ id: link.supplierId, name: link.supplierName }))
                : ProductLibraryModule.extractSupplierRefs(raw);
            return {
                id: raw?.id,
                raw,
                orderIndex: index,
                createdAt: String(raw?.created_at || ''),
                updatedAt: String(raw?.updated_at || ''),
                name: String(raw?.name || raw?.productName || '').trim(),
                categoryId: category?.id || '',
                categoryName: String(category?.name || raw?.category || 'Diger'),
                categoryPrefix: String(category?.prefix || ProductLibraryModule.buildCategoryPrefix(category?.name || raw?.category)),
                code: String(raw?.code || ''),
                unit: String(specs?.unit || raw?.unit || '').trim(),
                unitAmount: String(specs?.unitAmount ?? raw?.unitAmount ?? '').trim(),
                unitAmountType: String(specs?.unitAmountType || raw?.unitAmountType || ProductLibraryModule.getUnitAmountType(specs?.unit || raw?.unit || '')).trim(),
                brand: String(specs?.brandModel || specs?.brand || raw?.brandModel || '').trim(),
                pack: String(specs?.packageInfo || specs?.packaging || raw?.packageInfo || '').trim(),
                length: String(specs?.lengthMm ?? specs?.length ?? raw?.length ?? '').trim(),
                color: String(specs?.color || raw?.color || raw?.anodizedColor || raw?.paintColor || '').trim(),
                suppliers,
                supplierLinks,
                supplierCode: String(specs?.supplierProductCode || raw?.supplierProductCode || '').trim(),
                note: String(specs?.note || raw?.note || '').trim(),
                attachment: raw?.attachment || null,
                previewImage: raw?.image || raw?.imageUrl || null,
                previewPdf: raw?.pdf || raw?.pdfUrl || raw?.pdfDataUrl || raw?.drawingPdf || null
            };
        });
    },

    getMasterProductById: (id) => {
        return ProductLibraryModule.getMasterProducts().find(x => x.id === id) || null;
    },

    renderMasterPage: (container) => {
        const state = ProductLibraryModule.state;
        const categories = ProductLibraryModule.getMasterCategories();
        const unitOptions = ProductLibraryModule.getMasterUnitOptions();
        const colorOptions = ProductLibraryModule.getMasterColorOptions();
        const suppliers = ProductLibraryModule.getMasterSuppliers();
        const records = ProductLibraryModule.getMasterProducts();

        const showForm = state.masterFormOpen || !!state.masterEditingId;
        const selectedId = state.masterSelectedId;
        const editingRecord = state.masterEditingId ? records.find(x => x.id === state.masterEditingId) : null;
        const selectedSupplierRowsHtml = (state.masterDraftSupplierLinks || []).map((link, index) => {
            const label = String(link?.supplierName || '').trim();
            const code = String(link?.supplierCode || '').trim();
            const text = code ? `${label} ${code}` : label;
            return `
                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.45rem; padding:0.32rem 0.42rem; border-bottom:1px dashed #e2e8f0;">
                    <div style="font-weight:700; color:#334155; font-size:0.94rem;">${ProductLibraryModule.escapeHtml(text || '-')}</div>
                    <button type="button" onclick="ProductLibraryModule.removeMasterSupplierLink(${index})" style="height:24px; min-width:44px; border:1px solid #fecaca; background:#fff1f2; color:#b91c1c; border-radius:0.42rem; cursor:pointer; font-weight:700; font-size:0.78rem;">sil</button>
                </div>
            `;
        });

        const draftCode = editingRecord?.code || ProductLibraryModule.generateMasterCode(state.masterDraftCategoryId);

        const qCategoryId = String(state.masterFilters.categoryId || '').trim();
        const qName = String(state.masterFilters.name || '').trim().toLocaleLowerCase('tr-TR');
        const qLen = String(state.masterFilters.length || '').trim().toLocaleLowerCase('tr-TR');
        const qColor = String(state.masterFilters.color || '').trim().toLocaleLowerCase('tr-TR');
        const qCode = String(state.masterFilters.code || '').trim().toLocaleLowerCase('tr-TR');

        const toMs = (value) => {
            const ms = Date.parse(String(value || ''));
            return Number.isFinite(ms) ? ms : 0;
        };

        const byNewest = (a, b) => {
            const aMs = Math.max(toMs(a.updatedAt), toMs(a.createdAt));
            const bMs = Math.max(toMs(b.updatedAt), toMs(b.createdAt));
            if (aMs !== bMs) return bMs - aMs;
            return Number(b.orderIndex || 0) - Number(a.orderIndex || 0);
        };

        const byAddedOrder = (a, b) => {
            return Number(a.orderIndex || 0) - Number(b.orderIndex || 0);
        };

        const filtered = records.filter(p => {
            if (qCategoryId && p.categoryId !== qCategoryId) return false;
            if (qName && !String(p.name || '').toLocaleLowerCase('tr-TR').includes(qName)) return false;
            if (qLen) {
                const lengthMatch = String(p.length || '').toLocaleLowerCase('tr-TR').includes(qLen);
                const unitAmountMatch = String(p.unitAmount || '').toLocaleLowerCase('tr-TR').includes(qLen);
                if (!lengthMatch && !unitAmountMatch) return false;
            }
            if (qColor && !String(p.color || '').toLocaleLowerCase('tr-TR').includes(qColor)) return false;
            if (qCode) {
                const codeMatch = String(p.code || '').toLocaleLowerCase('tr-TR').includes(qCode);
                const idMatch = String(p.id || '').toLocaleLowerCase('tr-TR').includes(qCode);
                if (!codeMatch && !idMatch) return false;
            }
            return true;
        });

        const sorted = [...filtered].sort((a, b) => {
            if (qCategoryId) {
                // Category selected: keep plain add order
                return byAddedOrder(a, b);
            }
            // All products: grouped by category, newest on top inside each category
            const catCmp = a.categoryName.localeCompare(b.categoryName, 'tr');
            if (catCmp !== 0) return catCmp;
            return byNewest(a, b);
        });

        let currentCategory = '';
        const rowsHtml = sorted.length === 0
            ? `<tr><td colspan="14" style="text-align:center; padding:1.3rem; color:#94a3b8;">Kayit bulunamadi.</td></tr>`
            : sorted.map(p => {
                const categoryHeader = (!qCategoryId && p.categoryName !== currentCategory)
                    ? `<tr><td colspan="14" style="padding:0.55rem 0.7rem; background:#f8fafc; color:#334155; font-weight:800; border-top:1px solid #e2e8f0;">${ProductLibraryModule.escapeHtml(p.categoryName)}</td></tr>`
                    : '';
                currentCategory = p.categoryName;
                const suppliersText = (p.supplierLinks || []).length > 0
                    ? p.supplierLinks
                        .map(link => {
                            const label = String(link?.supplierName || '').trim();
                            const code = String(link?.supplierCode || '').trim();
                            return code ? `${label} ${code}` : label;
                        })
                        .filter(Boolean)
                        .join(', ')
                    : p.suppliers.map(s => s.name || s.id).filter(Boolean).join(', ');
                const hasPreview = !!(p.attachment?.data || p.previewImage || p.previewPdf);
                const selectedStyle = selectedId === p.id ? 'background:#ecfeff;' : '';
                return `
                    ${categoryHeader}
                    <tr style="border-bottom:1px solid #eef2f7; ${selectedStyle}">
                        <td style="padding:0.55rem; font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(p.name || '-')}</td>
                        <td style="padding:0.55rem; color:#64748b;">${ProductLibraryModule.escapeHtml(p.categoryName)}</td>
                        <td style="padding:0.55rem; text-align:center;">${ProductLibraryModule.escapeHtml(p.unit || '-')}</td>
                        <td style="padding:0.55rem; text-align:center;">${ProductLibraryModule.escapeHtml((p.unitAmount ? `${p.unitAmount} ${p.unitAmountType || ''}` : '-').trim())}</td>
                        <td style="padding:0.55rem; text-align:center;">${ProductLibraryModule.escapeHtml(p.length || '-')}</td>
                        <td style="padding:0.55rem; text-align:center;">${ProductLibraryModule.escapeHtml(p.color || '-')}</td>
                        <td style="padding:0.55rem;">${ProductLibraryModule.escapeHtml(p.brand || '-')}</td>
                        <td style="padding:0.55rem;">${ProductLibraryModule.escapeHtml(p.pack || '-')}</td>
                        <td style="padding:0.55rem;">${ProductLibraryModule.escapeHtml(suppliersText || '-')}</td>
                        <td style="padding:0.55rem; font-family:monospace; color:#475569;">${ProductLibraryModule.escapeHtml(p.code || '-')}</td>
                        <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.previewMasterAttachment('${p.id}')" ${hasPreview ? '' : 'disabled'}>goruntule</button></td>
                        <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.editMasterProduct('${p.id}')">duzenle</button></td>
                        <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.selectMasterProduct('${p.id}')" style="${selectedId === p.id ? 'background:#0f172a; color:white; border-color:#0f172a;' : ''}">sec</button></td>
                        <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.deleteMasterProduct('${p.id}')">sil</button></td>
                    </tr>
                `;
            }).join('');

        container.innerHTML = `
            <div style="max-width:1920px; margin:0 auto; font-family:'Inter',sans-serif;">
                <div style="background:rgba(255,255,255,0.86); border:1px solid #e2e8f0; border-radius:1.25rem; padding:1rem; margin-bottom:1.2rem;">
                    <div style="display:grid; grid-template-columns: 280px 1fr 190px 190px 190px 170px; gap:0.65rem; align-items:center;">
                        <select onchange="ProductLibraryModule.setMasterFilter('categoryId', this.value)" style="width:100%; height:50px; border:1px solid #cbd5e1; border-radius:0.65rem; padding:0 0.7rem; font-weight:700;">
                            <option value="">tum urunler (varsayilan)</option>
                            ${categories.map(c => `<option value="${c.id}" ${qCategoryId === c.id ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(c.name)}</option>`).join('')}
                        </select>
                        <input id="master_filter_name" value="${ProductLibraryModule.escapeHtml(state.masterFilters.name || '')}" oninput="ProductLibraryModule.setMasterFilter('name', this.value)" placeholder="urun adiyla ara" style="height:50px; border:1px solid #cbd5e1; border-radius:0.65rem; padding:0 0.75rem; font-weight:600;">
                        <input id="master_filter_length" value="${ProductLibraryModule.escapeHtml(state.masterFilters.length || '')}" oninput="ProductLibraryModule.setMasterFilter('length', this.value)" placeholder="boy ara" style="height:50px; border:1px solid #cbd5e1; border-radius:0.65rem; padding:0 0.75rem; font-weight:600;">
                        <input id="master_filter_color" value="${ProductLibraryModule.escapeHtml(state.masterFilters.color || '')}" oninput="ProductLibraryModule.setMasterFilter('color', this.value)" placeholder="renk ile ara" style="height:50px; border:1px solid #cbd5e1; border-radius:0.65rem; padding:0 0.75rem; font-weight:600;">
                        <input id="master_filter_code" value="${ProductLibraryModule.escapeHtml(state.masterFilters.code || '')}" oninput="ProductLibraryModule.setMasterFilter('code', this.value)" placeholder="ID kod ile ara" style="height:50px; border:1px solid #cbd5e1; border-radius:0.65rem; padding:0 0.75rem; font-weight:600;">
                        <button class="btn-primary" onclick="ProductLibraryModule.toggleMasterForm()" style="height:50px; border-radius:0.75rem; text-transform:lowercase;">${showForm ? 'vazgec' : 'urun ekle +'}</button>
                    </div>
                    ${showForm ? `<div style="margin-top:0.95rem;">${ProductLibraryModule.renderMasterFormHtml({ categories, unitOptions, colorOptions, suppliers, selectedSupplierRowsHtml, draftCode })}</div>` : ''}
                    <div class="card-table" style="margin-top:0.85rem;">
                        <table>
                            <thead>
                                <tr>
                                    <th>URUN ADI</th>
                                    <th>KATEGORI</th>
                                    <th style="text-align:center;">BIRIM</th>
                                    <th style="text-align:center;">BIRIM MIKTAR</th>
                                    <th style="text-align:center;">BOY</th>
                                    <th style="text-align:center;">RENK</th>
                                    <th>MARKA/MODEL</th>
                                    <th>AMBALAJ</th>
                                    <th>TEDARIKCI</th>
                                    <th style="font-family:monospace">KOD</th>
                                    <th style="text-align:center;">GORUNTULE</th>
                                    <th style="text-align:center;">DUZENLE</th>
                                    <th style="text-align:center;">SEC</th>
                                    <th style="text-align:center;">SIL</th>
                                </tr>
                            </thead>
                            <tbody>${rowsHtml}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    renderMasterFormHtml: ({ categories, unitOptions, colorOptions, suppliers, selectedSupplierRowsHtml, draftCode }) => {
        const state = ProductLibraryModule.state;
        return `
            <div style="background:white; border:2px solid #0f172a; border-radius:1.25rem; padding:1.2rem 1.2rem 1.45rem; font-size:1.06rem;">
                <div style="font-weight:800; color:#1e293b; margin-bottom:0.95rem; font-size:1.62rem;">Kutuphaneye urun ekle</div>
                <div style="display:grid; grid-template-columns: 220px 1fr 230px 220px; gap:0.75rem; align-items:end; margin-bottom:0.75rem;">
                    <div>
                        <div style="font-size:0.66rem; color:#3b82f6; font-weight:700; margin:0 0 0.2rem 0.15rem; cursor:pointer;" onclick="ProductLibraryModule.openMasterDictionary('category')">+ YONET (EKLE-SIL)</div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">kategori *</label>
                        <select onchange="ProductLibraryModule.setMasterDraft('categoryId', this.value)" ${state.masterEditingId ? 'disabled' : ''} style="width:100%; height:45px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-weight:700;">
                            ${categories.map(c => `<option value="${c.id}" ${state.masterDraftCategoryId === c.id ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(c.name)}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">URUNUN ADI *</label>
                        <input value="${ProductLibraryModule.escapeHtml(state.masterDraftName || '')}" oninput="ProductLibraryModule.setMasterDraft('name', this.value)" style="width:100%; height:45px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-weight:700;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">marka model</label>
                        <input value="${ProductLibraryModule.escapeHtml(state.masterDraftBrand || '')}" oninput="ProductLibraryModule.setMasterDraft('brand', this.value)" style="width:100%; height:45px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">ambalaj icerik</label>
                        <input value="${ProductLibraryModule.escapeHtml(state.masterDraftPack || '')}" oninput="ProductLibraryModule.setMasterDraft('pack', this.value)" style="width:100%; height:45px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 220px 220px 220px 1fr; gap:0.75rem; align-items:end; margin-bottom:0.75rem;">
                    <div>
                        <div style="font-size:0.66rem; color:#3b82f6; font-weight:700; margin:0 0 0.2rem 0.15rem; cursor:pointer;" onclick="ProductLibraryModule.openMasterDictionary('unit')">+ YONET (EKLE-SIL)</div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">Birim *</label>
                        <select onchange="ProductLibraryModule.setMasterDraft('unit', this.value)" style="width:100%; height:45px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                            ${unitOptions.map(x => `<option value="${ProductLibraryModule.escapeHtml(x)}" ${state.masterDraftUnit === x ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(x)}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">birim miktar (${ProductLibraryModule.escapeHtml(ProductLibraryModule.getUnitAmountType(state.masterDraftUnit || 'adet'))})</label>
                        <input value="${ProductLibraryModule.escapeHtml(state.masterDraftUnitAmount || '')}" oninput="ProductLibraryModule.setMasterDraft('unitAmount', this.value)" style="width:100%; height:45px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                    </div>
                    <div>
                        <div style="font-size:0.66rem; color:#3b82f6; font-weight:700; margin:0 0 0.2rem 0.15rem; cursor:pointer;" onclick="ProductLibraryModule.openMasterDictionary('color')">+ YONET (EKLE-SIL)</div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">renk</label>
                        <select onchange="ProductLibraryModule.setMasterDraft('color', this.value)" style="width:100%; height:45px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                            <option value="">renk seciniz</option>
                            ${colorOptions.map(x => `<option value="${ProductLibraryModule.escapeHtml(x)}" ${state.masterDraftColor === x ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(x)}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">kod</label>
                        <input disabled value="${ProductLibraryModule.escapeHtml(draftCode)}" style="width:100%; height:45px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace; font-weight:700;">
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 340px 210px 1fr 1fr; gap:0.75rem; align-items:start; margin-bottom:0.75rem;">
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">tedarikciler sec</label>
                        <select id="master_supplier_select" multiple onchange="ProductLibraryModule.setMasterSupplierSelection(this)" style="width:100%; min-height:110px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.4rem;">
                            ${suppliers.length === 0 ? `<option value="">Kayitli tedarikci yok</option>` : suppliers.map(s => `<option value="${s.id}" ${state.masterDraftSupplierIds.includes(s.id) ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(s.name)}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">tedarikcideki kodu</label>
                        <input value="${ProductLibraryModule.escapeHtml(state.masterDraftSupplierCode || '')}" oninput="ProductLibraryModule.setMasterDraft('supplierCode', this.value)" style="width:100%; height:45px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                        <button type="button" onclick="ProductLibraryModule.addMasterSupplierLink()" style="width:100%; height:42px; margin-top:0.45rem; border:1px solid #0f172a; background:white; color:#0f172a; border-radius:0.6rem; font-weight:800; cursor:pointer;">ekle+</button>
                    </div>
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">tedarikci listesi</label>
                        <div style="width:100%; min-height:110px; max-height:170px; overflow:auto; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.35rem; background:white;">
                            ${(selectedSupplierRowsHtml && selectedSupplierRowsHtml.length > 0)
                                ? selectedSupplierRowsHtml.join('')
                                : `<div style="color:#94a3b8; font-size:0.9rem; padding:0.45rem;">Kayitli tedarikci yok.</div>`
                            }
                        </div>
                    </div>
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">resim / pdf dosya + ekle (opsiyonel)</label>
                        <div style="border:1px dashed #cbd5e1; border-radius:0.55rem; padding:0.55rem;">
                            <input type="file" accept=".pdf,image/*" onchange="ProductLibraryModule.handleMasterAttachment(this)" style="font-size:0.82rem;">
                            <div style="font-size:0.78rem; color:#64748b; margin-top:0.35rem;">${ProductLibraryModule.escapeHtml(state.masterDraftAttachment?.name || 'Dosya secilmedi')}</div>
                            <div style="display:flex; gap:0.4rem; margin-top:0.45rem;">
                                <button class="btn-sm" onclick="ProductLibraryModule.previewMasterDraftAttachment()" ${state.masterDraftAttachment ? '' : 'disabled'}>gor</button>
                                <button class="btn-sm" onclick="ProductLibraryModule.clearMasterAttachment()" ${state.masterDraftAttachment ? '' : 'disabled'}>kaldir</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr auto; gap:0.75rem; align-items:end;">
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">not ekle</label>
                        <textarea rows="3" oninput="ProductLibraryModule.setMasterDraft('note', this.value)" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.5rem; resize:vertical;">${ProductLibraryModule.escapeHtml(state.masterDraftNote || '')}</textarea>
                    </div>
                    <div style="display:flex; gap:0.6rem;">
                        <button class="btn-sm" onclick="ProductLibraryModule.loadSelectedMasterForEdit()" ${state.masterSelectedId ? '' : 'disabled'} style="height:40px; padding:0 1rem;">duzenle</button>
                        <button class="btn-primary" onclick="ProductLibraryModule.saveMasterProduct()" style="height:40px; padding:0 1.2rem; border-radius:0.7rem;">kaydet</button>
                    </div>
                </div>
            </div>
        `;
    },

    setMasterFilter: (key, value) => {
        const active = document.activeElement;
        const activeId = active?.id || '';
        const start = typeof active?.selectionStart === 'number' ? active.selectionStart : null;
        const end = typeof active?.selectionEnd === 'number' ? active.selectionEnd : null;

        ProductLibraryModule.state.masterFilters[key] = value || '';
        UI.renderCurrentPage();

        if (activeId && activeId.startsWith('master_filter_')) {
            const next = document.getElementById(activeId);
            if (next) {
                next.focus();
                if (start !== null && end !== null) {
                    try { next.setSelectionRange(start, end); } catch (_) { }
                }
            }
        }
    },

    setMasterDraft: (key, value) => {
        if (key === 'categoryId') ProductLibraryModule.state.masterDraftCategoryId = value || '';
        if (key === 'name') ProductLibraryModule.state.masterDraftName = value || '';
        if (key === 'unit') ProductLibraryModule.state.masterDraftUnit = value || '';
        if (key === 'unitAmount') ProductLibraryModule.state.masterDraftUnitAmount = value || '';
        if (key === 'brand') ProductLibraryModule.state.masterDraftBrand = value || '';
        if (key === 'pack') ProductLibraryModule.state.masterDraftPack = value || '';
        if (key === 'length') ProductLibraryModule.state.masterDraftLength = value || '';
        if (key === 'color') ProductLibraryModule.state.masterDraftColor = value || '';
        if (key === 'supplierCode') ProductLibraryModule.state.masterDraftSupplierCode = value || '';
        if (key === 'note') ProductLibraryModule.state.masterDraftNote = value || '';
        if (key === 'categoryId' || key === 'unit' || key === 'color') UI.renderCurrentPage();
    },

    resetMasterDraft: (keepFormOpen = true) => {
        const cats = ProductLibraryModule.getMasterCategories();
        ProductLibraryModule.state.masterDraftCategoryId = cats[0]?.id || '';
        ProductLibraryModule.state.masterDraftName = '';
        ProductLibraryModule.state.masterDraftUnit = ProductLibraryModule.getMasterUnitOptions()[0] || 'adet';
        ProductLibraryModule.state.masterDraftUnitAmount = '';
        ProductLibraryModule.state.masterDraftBrand = '';
        ProductLibraryModule.state.masterDraftPack = '';
        ProductLibraryModule.state.masterDraftLength = '';
        ProductLibraryModule.state.masterDraftColor = '';
        ProductLibraryModule.state.masterDraftSupplierIds = [];
        ProductLibraryModule.state.masterDraftSupplierLinks = [];
        ProductLibraryModule.state.masterDraftSupplierCode = '';
        ProductLibraryModule.state.masterDraftNote = '';
        ProductLibraryModule.state.masterDraftAttachment = null;
        ProductLibraryModule.state.masterEditingId = null;
        ProductLibraryModule.state.masterFormOpen = !!keepFormOpen;
    },

    toggleMasterForm: () => {
        const show = ProductLibraryModule.state.masterFormOpen || !!ProductLibraryModule.state.masterEditingId;
        if (show) ProductLibraryModule.resetMasterDraft(false);
        else ProductLibraryModule.resetMasterDraft(true);
        UI.renderCurrentPage();
    },

    setMasterSupplierSelection: (el) => {
        ProductLibraryModule.state.masterDraftSupplierIds = Array.from(el?.selectedOptions || [])
            .map(opt => String(opt.value || '').trim())
            .filter(Boolean);
        UI.renderCurrentPage();
    },

    addMasterSupplierLink: () => {
        const supplierIds = Array.isArray(ProductLibraryModule.state.masterDraftSupplierIds)
            ? ProductLibraryModule.state.masterDraftSupplierIds
            : [];
        const code = String(ProductLibraryModule.state.masterDraftSupplierCode || '').trim();
        if (supplierIds.length === 0) {
            alert('Lutfen tedarikci seciniz.');
            return;
        }
        if (!code) {
            alert('Lutfen tedarikci kodu giriniz.');
            return;
        }

        const supplierOptions = ProductLibraryModule.getMasterSuppliers();
        const current = Array.isArray(ProductLibraryModule.state.masterDraftSupplierLinks)
            ? ProductLibraryModule.state.masterDraftSupplierLinks
            : [];
        const next = [...current];

        supplierIds.forEach(id => {
            const found = supplierOptions.find(s => s.id === id);
            if (!found) return;
            const idx = next.findIndex(x => (x?.supplierId || '') === id);
            const row = {
                supplierId: found.id,
                supplierName: found.name,
                supplierCode: code
            };
            if (idx >= 0) next[idx] = row;
            else next.push(row);
        });

        ProductLibraryModule.state.masterDraftSupplierLinks = next;
        ProductLibraryModule.state.masterDraftSupplierCode = '';
        UI.renderCurrentPage();
    },

    removeMasterSupplierLink: (index) => {
        const links = Array.isArray(ProductLibraryModule.state.masterDraftSupplierLinks)
            ? [...ProductLibraryModule.state.masterDraftSupplierLinks]
            : [];
        if (index < 0 || index >= links.length) return;
        links.splice(index, 1);
        ProductLibraryModule.state.masterDraftSupplierLinks = links;
        ProductLibraryModule.state.masterDraftSupplierIds = Array.from(
            new Set(
                links
                    .map(link => String(link?.supplierId || '').trim())
                    .filter(Boolean)
            )
        );
        UI.renderCurrentPage();
    },

    handleMasterAttachment: (input) => {
        const file = input?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            ProductLibraryModule.state.masterDraftAttachment = {
                name: file.name || 'dosya',
                type: file.type || '',
                data: String(reader.result || '')
            };
            UI.renderCurrentPage();
        };
        reader.readAsDataURL(file);
    },

    clearMasterAttachment: () => {
        ProductLibraryModule.state.masterDraftAttachment = null;
        UI.renderCurrentPage();
    },

    previewMasterDraftAttachment: () => {
        const file = ProductLibraryModule.state.masterDraftAttachment;
        if (!file?.data) return;
        ProductLibraryModule.openPreviewModal(file);
    },

    previewMasterAttachment: (id) => {
        const rec = ProductLibraryModule.getMasterProductById(id);
        if (!rec) return;
        const attachment = rec.attachment?.data
            ? rec.attachment
            : rec.previewPdf
                ? { name: 'pdf', type: 'application/pdf', data: rec.previewPdf }
                : rec.previewImage
                    ? { name: 'resim', type: 'image/*', data: rec.previewImage }
                    : null;
        if (!attachment?.data) return alert('Goruntulenecek dosya yok.');
        ProductLibraryModule.openPreviewModal(attachment);
    },

    openPreviewModal: (attachment) => {
        const type = String(attachment?.type || '').toLowerCase();
        const data = String(attachment?.data || '');
        const isPdf = type.includes('pdf') || data.startsWith('data:application/pdf');
        const content = isPdf
            ? `<iframe src="${data}" style="width:100%; height:72vh; border:none; border-radius:0.6rem;"></iframe>`
            : `<img src="${data}" alt="dosya" style="max-width:100%; max-height:72vh; border-radius:0.6rem; display:block; margin:0 auto;">`;
        Modal.open('Dosya Onizleme', content, { maxWidth: '980px' });
    },

    selectMasterProduct: (id) => {
        ProductLibraryModule.state.masterSelectedId = id;
        UI.renderCurrentPage();
    },

    loadMasterDraftFromRecord: (record) => {
        if (!record) return;
        const suppliers = ProductLibraryModule.getMasterSuppliers();
        const supplierIds = record.suppliers
            .map(ref => {
                if (ref?.id) return ref.id;
                const byName = suppliers.find(s =>
                    ProductLibraryModule.normalizeAsciiUpper(s.name) === ProductLibraryModule.normalizeAsciiUpper(ref?.name || '')
                );
                return byName?.id || '';
            })
            .filter(Boolean);

        ProductLibraryModule.state.masterFormOpen = true;
        ProductLibraryModule.state.masterEditingId = record.id;
        ProductLibraryModule.state.masterSelectedId = record.id;
        ProductLibraryModule.state.masterDraftCategoryId = record.categoryId || ProductLibraryModule.state.masterDraftCategoryId;
        ProductLibraryModule.state.masterDraftName = record.name || '';
        ProductLibraryModule.state.masterDraftUnit = record.unit || ProductLibraryModule.getMasterUnitOptions()[0] || 'adet';
        ProductLibraryModule.state.masterDraftUnitAmount = record.unitAmount || '';
        ProductLibraryModule.state.masterDraftBrand = record.brand || '';
        ProductLibraryModule.state.masterDraftPack = record.pack || '';
        ProductLibraryModule.state.masterDraftLength = record.length || '';
        ProductLibraryModule.state.masterDraftColor = record.color || '';
        ProductLibraryModule.state.masterDraftSupplierIds = Array.from(new Set(supplierIds));
        const draftLinks = Array.isArray(record.supplierLinks)
            ? record.supplierLinks.map(link => ({
                supplierId: String(link?.supplierId || '').trim(),
                supplierName: String(link?.supplierName || '').trim(),
                supplierCode: String(link?.supplierCode || '').trim()
            })).filter(link => link.supplierId || link.supplierName)
            : [];
        if (draftLinks.length === 0 && Array.isArray(record.suppliers)) {
            record.suppliers.forEach(ref => {
                draftLinks.push({
                    supplierId: String(ref?.id || '').trim(),
                    supplierName: String(ref?.name || '').trim(),
                    supplierCode: String(record.supplierCode || '').trim()
                });
            });
        }
        ProductLibraryModule.state.masterDraftSupplierLinks = draftLinks;
        ProductLibraryModule.state.masterDraftSupplierCode = '';
        ProductLibraryModule.state.masterDraftNote = record.note || '';
        ProductLibraryModule.state.masterDraftAttachment = record.attachment?.data ? record.attachment : null;
    },

    editMasterProduct: (id) => {
        const record = ProductLibraryModule.getMasterProductById(id);
        if (!record) return;
        ProductLibraryModule.loadMasterDraftFromRecord(record);
        UI.renderCurrentPage();
    },

    loadSelectedMasterForEdit: () => {
        if (!ProductLibraryModule.state.masterSelectedId) {
            alert('Once bir kayit seciniz.');
            return;
        }
        ProductLibraryModule.editMasterProduct(ProductLibraryModule.state.masterSelectedId);
    },

    generateMasterCode: (categoryId) => {
        const categories = ProductLibraryModule.getMasterCategories();
        const cat = categories.find(c => c.id === categoryId);
        const prefix = ProductLibraryModule.buildCategoryPrefix(cat?.prefix || cat?.name || 'URN', categoryId);
        const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`^${escaped}-?(\\d{1,12})$`, 'i');
        let maxNum = 0;
        (DB.data.data.products || []).forEach(p => {
            const code = String(p?.code || '').toUpperCase();
            const m = code.match(regex);
            if (!m) return;
            const n = Number(m[1]);
            if (Number.isFinite(n) && n > maxNum) maxNum = n;
        });
        let nextNum = maxNum + 1;
        let candidate = `${prefix}${String(nextNum).padStart(4, '0')}`;
        while (ProductLibraryModule.isGlobalCodeTaken(candidate)) {
            nextNum += 1;
            candidate = `${prefix}${String(nextNum).padStart(4, '0')}`;
        }
        return candidate;
    },

    saveMasterProduct: async () => {
        const s = ProductLibraryModule.state;
        const name = String(s.masterDraftName || '').trim();
        if (!name) return alert('Urun adi zorunlu.');

        const categories = ProductLibraryModule.getMasterCategories();
        const unitOptions = ProductLibraryModule.getMasterUnitOptions();
        const suppliers = ProductLibraryModule.getMasterSuppliers();
        const allProducts = DB.data.data.products || [];

        let finalCategory = categories.find(c => c.id === s.masterDraftCategoryId);
        if (s.masterEditingId) {
            const current = allProducts.find(x => x.id === s.masterEditingId);
            const resolved = ProductLibraryModule.resolveCategoryForProduct(current);
            if (resolved?.id) {
                finalCategory = categories.find(c => c.id === resolved.id) || finalCategory;
            }
        }
        if (!finalCategory) return alert('Kategori seciniz.');

        const unit = String(s.masterDraftUnit || '').trim();
        if (!unit) return alert('Birim zorunlu.');
        if (!unitOptions.includes(unit)) return alert('Birim listeden secilmelidir.');

        const unitAmount = String(s.masterDraftUnitAmount || '').trim();
        const unitAmountType = ProductLibraryModule.getUnitAmountType(unit);
        const brand = String(s.masterDraftBrand || '').trim();
        const pack = String(s.masterDraftPack || '').trim();
        const length = String(s.masterDraftLength || '').trim();
        const color = String(s.masterDraftColor || '').trim();
        const note = String(s.masterDraftNote || '').trim();
        const now = new Date().toISOString();

        const supplierLinks = Array.isArray(s.masterDraftSupplierLinks)
            ? s.masterDraftSupplierLinks.map(link => ({
                supplierId: String(link?.supplierId || '').trim(),
                supplierName: String(link?.supplierName || '').trim(),
                supplierCode: String(link?.supplierCode || '').trim()
            })).filter(link => link.supplierId || link.supplierName)
            : [];

        if (supplierLinks.length === 0 && Array.isArray(s.masterDraftSupplierIds) && s.masterDraftSupplierIds.length > 0) {
            const fallbackCode = String(s.masterDraftSupplierCode || '').trim();
            s.masterDraftSupplierIds.forEach(id => {
                const found = suppliers.find(x => x.id === id);
                if (!found) return;
                supplierLinks.push({
                    supplierId: found.id,
                    supplierName: found.name,
                    supplierCode: fallbackCode
                });
            });
        }

        const supplierRefs = Array.from(new Map(
            supplierLinks.map(link => {
                const key = link.supplierId || ProductLibraryModule.normalizeAsciiUpper(link.supplierName || '');
                return [key, { id: link.supplierId, name: link.supplierName }];
            })
        ).values()).filter(ref => ref.id || ref.name);
        const firstSupplierCode = supplierLinks[0]?.supplierCode || '';

        if (s.masterEditingId) {
            const idx = allProducts.findIndex(x => x.id === s.masterEditingId);
            if (idx === -1) {
                ProductLibraryModule.resetMasterDraft(false);
                UI.renderCurrentPage();
                return;
            }
            const old = allProducts[idx];
            const oldSpecs = (old?.specs && typeof old.specs === 'object') ? old.specs : {};
            allProducts[idx] = {
                ...old,
                categoryId: finalCategory.id,
                category: finalCategory.name,
                name,
                unitAmount,
                unitAmountType,
                suppliers: supplierRefs,
                supplierLinks,
                supplierIds: supplierRefs.map(x => x.id),
                supplierNames: supplierRefs.map(x => x.name),
                supplierProductCode: firstSupplierCode,
                attachment: s.masterDraftAttachment?.data ? s.masterDraftAttachment : old.attachment || null,
                specs: {
                    ...oldSpecs,
                    unit,
                    unitAmount,
                    unitAmountType,
                    brandModel: brand,
                    packageInfo: pack,
                    lengthMm: length,
                    color,
                    suppliers: supplierRefs.map(x => x.name),
                    supplierLinks,
                    supplierProductCode: firstSupplierCode,
                    note
                },
                updated_at: now
            };
            ProductLibraryModule.state.masterSelectedId = old.id;
        } else {
            const id = crypto.randomUUID();
            const code = ProductLibraryModule.generateMasterCode(finalCategory.id);
            allProducts.push({
                id,
                categoryId: finalCategory.id,
                category: finalCategory.name,
                type: 'MASTER',
                name,
                code,
                unitAmount,
                unitAmountType,
                suppliers: supplierRefs,
                supplierLinks,
                supplierIds: supplierRefs.map(x => x.id),
                supplierNames: supplierRefs.map(x => x.name),
                supplierProductCode: firstSupplierCode,
                attachment: s.masterDraftAttachment?.data ? s.masterDraftAttachment : null,
                specs: {
                    unit,
                    unitAmount,
                    unitAmountType,
                    brandModel: brand,
                    packageInfo: pack,
                    lengthMm: length,
                    color,
                    suppliers: supplierRefs.map(x => x.name),
                    supplierLinks,
                    supplierProductCode: firstSupplierCode,
                    note
                },
                created_at: now,
                updated_at: now
            });
            ProductLibraryModule.state.masterSelectedId = id;
        }

        await DB.save();
        ProductLibraryModule.resetMasterDraft(false);
        UI.renderCurrentPage();
    },

    deleteMasterProduct: async (id) => {
        const all = DB.data.data.products || [];
        const row = all.find(x => x.id === id);
        if (!row) return;
        if (!confirm('Bu urun silinsin mi?')) return;
        DB.data.data.products = all.filter(x => x.id !== id);
        if (ProductLibraryModule.state.masterSelectedId === id) ProductLibraryModule.state.masterSelectedId = null;
        if (ProductLibraryModule.state.masterEditingId === id) ProductLibraryModule.resetMasterDraft(false);
        await DB.save();
        UI.renderCurrentPage();
    },

    openMasterDictionary: (kind) => {
        if (kind === 'category') {
            const categories = ProductLibraryModule.getMasterCategories();
            Modal.open('Kategori + Yonet', `
                <div style="display:flex; flex-direction:column; gap:0.8rem;">
                    <div style="display:grid; grid-template-columns:1fr 110px auto; gap:0.5rem;">
                        <input id="master_cat_name" placeholder="kategori adi" style="height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                        <input id="master_cat_prefix" placeholder="kod" maxlength="3" style="height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; text-transform:uppercase; font-family:monospace; font-weight:700;">
                        <button class="btn-primary" onclick="ProductLibraryModule.addMasterCategory()" style="height:38px; border-radius:0.55rem;">ekle</button>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:0.4rem; max-height:380px; overflow:auto;">
                        ${categories.map(c => `
                            <div style="display:grid; grid-template-columns:1fr 90px auto auto; gap:0.45rem; align-items:center; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem 0.55rem;">
                                <div style="font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(c.name)}</div>
                                <div style="font-family:monospace; font-weight:700; color:#64748b;">${ProductLibraryModule.escapeHtml(c.prefix || '-')}</div>
                                <button class="btn-sm" onclick="ProductLibraryModule.renameMasterCategory('${c.id}')">duzenle</button>
                                <button class="btn-sm" onclick="ProductLibraryModule.removeMasterCategory('${c.id}')">sil</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `, { maxWidth: '720px' });
            return;
        }

        const isUnit = kind === 'unit';
        const key = isUnit ? 'masterUnits' : 'masterColors';
        const title = isUnit ? 'Birim + Yonet' : 'Renk + Yonet';
        const items = isUnit ? ProductLibraryModule.getMasterUnitOptions() : ProductLibraryModule.getMasterColorOptions();
        Modal.open(title, `
            <div style="display:flex; flex-direction:column; gap:0.8rem;">
                <div style="display:grid; grid-template-columns:1fr auto; gap:0.5rem;">
                    <input id="master_list_item" placeholder="yeni deger" style="height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                    <button class="btn-primary" onclick="ProductLibraryModule.addMasterOption('${key}')" style="height:38px; border-radius:0.55rem;">ekle</button>
                </div>
                <div style="display:flex; flex-direction:column; gap:0.4rem; max-height:350px; overflow:auto;">
                    ${items.map((item, idx) => `
                        <div style="display:grid; grid-template-columns:1fr auto auto; gap:0.45rem; align-items:center; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem 0.55rem;">
                            <div style="font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(item)}</div>
                            <button class="btn-sm" onclick="ProductLibraryModule.renameMasterOption('${key}', ${idx})">duzenle</button>
                            <button class="btn-sm" onclick="ProductLibraryModule.removeMasterOption('${key}', ${idx})">sil</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `, { maxWidth: '620px' });
    },

    addMasterCategory: async () => {
        const name = String(document.getElementById('master_cat_name')?.value || '').trim();
        const rawPrefix = String(document.getElementById('master_cat_prefix')?.value || '').trim();
        if (!name) return alert('Kategori adi zorunlu.');

        const exists = (DB.data.data.productCategories || []).some(c =>
            ProductLibraryModule.normalizeAsciiUpper(c?.name || '') === ProductLibraryModule.normalizeAsciiUpper(name)
        );
        if (exists) return alert('Bu kategori zaten var.');

        DB.data.data.productCategories.push({
            id: crypto.randomUUID(),
            name,
            icon: '📦',
            prefix: ProductLibraryModule.buildCategoryPrefix(rawPrefix || name)
        });
        await DB.save();
        ProductLibraryModule.ensureMasterDefaults();
        ProductLibraryModule.openMasterDictionary('category');
        UI.renderCurrentPage();
    },

    renameMasterCategory: async (id) => {
        const idx = (DB.data.data.productCategories || []).findIndex(c => c.id === id);
        if (idx === -1) return;
        const row = DB.data.data.productCategories[idx];
        const newName = prompt('Yeni kategori adi:', row.name || '');
        if (!newName) return;
        const newPrefix = prompt('Kod kisaltma (3 harf):', row.prefix || '');
        DB.data.data.productCategories[idx] = {
            ...row,
            name: String(newName || '').trim() || row.name,
            prefix: ProductLibraryModule.buildCategoryPrefix(newPrefix || row.prefix || row.name, row.id)
        };
        await DB.save();
        ProductLibraryModule.ensureMasterDefaults();
        ProductLibraryModule.openMasterDictionary('category');
        UI.renderCurrentPage();
    },

    removeMasterCategory: async (id) => {
        const cat = (DB.data.data.productCategories || []).find(c => c.id === id);
        const inUse = (DB.data.data.products || []).some(p => {
            if (p?.categoryId === id) return true;
            return cat && ProductLibraryModule.normalizeAsciiUpper(p?.category || '') === ProductLibraryModule.normalizeAsciiUpper(cat.name || '');
        });
        if (inUse) {
            alert('Bu kategori urunlerde kullaniliyor. Once urunleri tasiyin/silin.');
            return;
        }
        if (!confirm('Kategori silinsin mi?')) return;
        DB.data.data.productCategories = (DB.data.data.productCategories || []).filter(c => c.id !== id);
        await DB.save();
        ProductLibraryModule.ensureMasterDefaults();
        ProductLibraryModule.openMasterDictionary('category');
        UI.renderCurrentPage();
    },

    addMasterOption: async (key) => {
        const val = String(document.getElementById('master_list_item')?.value || '').trim();
        if (!val) return;
        if (!DB.data.meta.options || typeof DB.data.meta.options !== 'object') DB.data.meta.options = {};
        if (!Array.isArray(DB.data.meta.options[key])) DB.data.meta.options[key] = [];
        const list = DB.data.meta.options[key];
        const exists = list.some(x => ProductLibraryModule.normalizeAsciiUpper(String(x || '')) === ProductLibraryModule.normalizeAsciiUpper(val));
        if (exists) return alert('Bu deger zaten var.');
        list.push(val);
        await DB.save();
        ProductLibraryModule.openMasterDictionary(key === 'masterUnits' ? 'unit' : 'color');
        UI.renderCurrentPage();
    },

    renameMasterOption: async (key, index) => {
        if (!Array.isArray(DB.data.meta.options?.[key])) return;
        const list = DB.data.meta.options[key];
        if (index < 0 || index >= list.length) return;
        const oldVal = String(list[index] || '');
        const next = prompt('Yeni deger:', oldVal);
        if (!next) return;
        list[index] = String(next).trim() || oldVal;
        await DB.save();
        ProductLibraryModule.openMasterDictionary(key === 'masterUnits' ? 'unit' : 'color');
        UI.renderCurrentPage();
    },

    removeMasterOption: async (key, index) => {
        if (!Array.isArray(DB.data.meta.options?.[key])) return;
        const list = DB.data.meta.options[key];
        if (index < 0 || index >= list.length) return;
        if (!confirm('Bu deger silinsin mi?')) return;
        list.splice(index, 1);
        await DB.save();
        ProductLibraryModule.openMasterDictionary(key === 'masterUnits' ? 'unit' : 'color');
        UI.renderCurrentPage();
    },

    renderMain: (container) => {
        const categories = DB.data.data.productCategories;

        container.innerHTML = `
            <div style="max-width:1000px; margin:0 auto">
                <!-- Action Header -->
                <div style="margin-bottom:2rem; display:flex; justify-content:center">
                    <button onclick="ProductLibraryModule.openCategoryModal()" class="btn-primary" style="display:flex; align-items:center; gap:0.5rem; padding:1rem 2rem; font-size:1.1rem; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1)">
                        <i data-lucide="plus-circle" width="24"></i> Yeni Kategori Ekle
                    </button>
                </div>

                <!-- Categories Grid -->
                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:1.5rem">
                    ${categories.map(c => `
                        <div class="group relative" style="position:relative">
                            <div onclick="ProductLibraryModule.openCategory('${c.id}')" style="background:white; border:1px solid #e2e8f0; border-radius:1.5rem; padding:2rem; display:flex; flex-direction:column; align-items:center; gap:1rem; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 20px 25px -5px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.05)'">
                                <div style="font-size:3rem; line-height:1">${c.icon}</div>
                                <div style="font-weight:700; color:#334155; font-size:1.1rem; text-align:center">${c.name}</div>
                            </div>
                            <!-- Edit/Delete Actions -->
                            <div style="position:absolute; top:10px; right:10px; display:flex; gap:0.25rem; z-index:10;">
                                <button onclick="event.preventDefault(); event.stopPropagation(); ProductLibraryModule.openCategoryModal('${c.id}')" style="background:white; border:1px solid #cbd5e1; border-radius:0.5rem; padding:0.4rem; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; box-shadow:0 2px 4px rgba(0,0,0,0.05)" onmouseover="this.style.color='#3b82f6'; this.style.borderColor='#3b82f6'" onmouseout="this.style.color='#64748b'; this.style.borderColor='#cbd5e1'">
                                    <i data-lucide="edit-2" width="16"></i>
                                </button>
                                <button onclick="event.preventDefault(); event.stopPropagation(); ProductLibraryModule.deleteCategory('${c.id}')" style="background:white; border:1px solid #cbd5e1; border-radius:0.5rem; padding:0.4rem; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; box-shadow:0 2px 4px rgba(0,0,0,0.05)" onmouseover="this.style.color='#ef4444'; this.style.borderColor='#ef4444'" onmouseout="this.style.color='#64748b'; this.style.borderColor='#cbd5e1'">
                                    <i data-lucide="trash-2" width="16"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    renderList: (category) => {
        const products = (DB.data.data.products || []).filter(p => p.category === category.name || p.categoryId === category.id);
        if (products.length === 0) return '<div style="text-align:center; padding:2rem; color:#cbd5e1">Bu kategoride henüz ürün yok.</div>';
        return products.map(p => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border-bottom:1px solid #f1f5f9">
                <span style="font-weight:600; color:#334155">${p.name}</span>
                <span style="font-family:monospace; color:#94a3b8; font-size:0.9rem">${p.code || '---'}</span>
            </div>
        `).join('');
    },

    renderCategoryDetail: (container) => {
        const catId = ProductLibraryModule.state.activeCategory;
        const category = DB.data.data.productCategories.find(c => c.id === catId);

        if (!category) { ProductLibraryModule.state.activeCategory = null; UI.renderCurrentPage(); return; }

        // --- CUSTOM UI FOR EXTRUDER & PLEXI ---
        if (category.name.toLowerCase().includes('ekstrüder') || category.name.toLowerCase().includes('pleksi') || category.id === 'cat_ext') {
            ProductLibraryModule.renderExtruderPage(container);
            return;
        }

        // --- HARDWARE MODULE ROUTING ---
        if (category.name.toLowerCase().includes('hırdavat') || category.name.toLowerCase().includes('vida') || category.id === 'cat3') {
            ProductLibraryModule.renderHardwarePage(container);
            return;
        }

        // --- BOX MODULE ROUTING ---
        if (category.id === 'cat_box' || category.name.toLowerCase().includes('koli')) {
            ProductLibraryModule.renderBoxPage(container);
            return;
        }

        // --- CONSUMABLE MODULE ROUTING ---
        if (category.id === 'cat_sarf' || category.name.toLowerCase().includes('sarf') || category.name.toLowerCase().includes('genel malzeme')) {
            ProductLibraryModule.renderConsumablePage(container);
            return;
        }

        container.innerHTML = `
            <div style="max-width:1100px; margin:0 auto; font-family: 'Inter', sans-serif;">
                <!-- Header -->
                <div style="text-align:center; margin-bottom:3rem; position:relative">
                    <h1 style="font-size:2.5rem; color:#1e293b; letter-spacing:-0.03em; font-weight:300;">${category.name.toLowerCase()} <span style="font-weight:700">envanter</span></h1>
                </div>

                <!-- ACTIONS ROW -->
                <div style="display:flex; flex-wrap:wrap; gap:1rem; align-items:center; margin-bottom:3rem; justify-content:space-between">
                     <!-- Search Capsules (Generic) -->
                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; flex:1; justify-content:center">
                         <div class="search-capsule">
                            <input type="text" placeholder="ürün ara..." style="width:200px">
                            <i data-lucide="search" width="16" style="color:#94a3b8"></i>
                         </div>
                    </div>

                    <!-- ADD BUTTON -->
                    <div style="flex-shrink:0">
                        ${(ProductLibraryModule.state.isFormVisible) ?
                `<button onclick="ProductLibraryModule.toggleExtruderForm()" class="btn-primary" style="background:#ef4444; padding:0.8rem 2rem; border-radius:1rem">İptal</button>`
                :
                `<button onclick="ProductLibraryModule.toggleExtruderForm()" class="btn-primary" style="padding:0.8rem 2rem; border-radius:1rem; font-size:1rem; box-shadow:0 4px 10px rgba(0,0,0,0.05)">Ürün ekle +</button>`
            }
                    </div>
                </div>

                <!-- LIST (Empty State for now) -->
               <div style="display:flex; flex-direction:column; gap:0; border-top:2px solid #334155">
                     <div style="padding:4rem; text-align:center; color:#94a3b8">
                        Henüz ürün bulunamadı.
                     </div>
                </div>

                <!-- ADD FORM (CONDITIONAL) -->
                ${(ProductLibraryModule.state.isFormVisible) ? `
                    <div id="extFormSection" style="margin-top:4rem; background:white; border:2px solid #e2e8f0; border-radius:2rem; padding:3rem; position:relative; box-shadow:0 20px 40px -10px rgba(0,0,0,0.05); animation: slideDown 0.3s ease-out">
                         <h3 style="font-size:1.5rem; color:#334155; margin-bottom:2rem; font-weight:700">Yeni Ürün Ekle</h3>
                         <div style="text-align:center; color:#64748b">
                            Bu kategori için form yapısı henüz oluşturulmadı.
                         </div>
                    </div>
                ` : ''}
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    openCategory: (id) => {
        ProductLibraryModule.state.activeCategory = id;
        ProductLibraryModule.state.isFormVisible = false;
        ProductLibraryModule.state.filters = { dia: '', len: '', thick: '', color: '', surface: '' };
        ProductLibraryModule.state.boxSearchName = '';
        ProductLibraryModule.state.boxSearchSize = '';
        ProductLibraryModule.state.boxFormOpen = false;
        ProductLibraryModule.state.boxEditingId = null;
        ProductLibraryModule.state.boxSelectedId = null;
        ProductLibraryModule.state.boxDraftName = '';
        ProductLibraryModule.state.boxDraftWidth = '';
        ProductLibraryModule.state.boxDraftLength = '';
        ProductLibraryModule.state.boxDraftHeight = '';
        ProductLibraryModule.state.boxDraftPrint = 'YAZISIZ';
        ProductLibraryModule.state.boxDraftNote = '';
        ProductLibraryModule.state.consumableSearchName = '';
        ProductLibraryModule.state.consumableSearchType = '';
        ProductLibraryModule.state.consumableSearchId = '';
        ProductLibraryModule.state.consumableFormOpen = false;
        ProductLibraryModule.state.consumableEditingId = null;
        ProductLibraryModule.state.consumableSelectedId = null;
        ProductLibraryModule.state.consumableDraftName = '';
        ProductLibraryModule.state.consumableDraftType = 'BANT';
        ProductLibraryModule.state.consumableDraftTypeCustom = '';
        ProductLibraryModule.state.consumableDraftUnit = 'adet';
        ProductLibraryModule.state.consumableDraftBrand = '';
        ProductLibraryModule.state.consumableDraftPack = '';
        ProductLibraryModule.state.consumableDraftSuppliers = [];
        ProductLibraryModule.state.consumableDraftSupplierInput = '';
        ProductLibraryModule.state.consumableDraftNote = '';
        ProductLibraryModule.state.consumableDraftImageData = '';
        UI.renderCurrentPage();
    },

    openCategoryModal: (editId = null) => {
        const cat = editId ? DB.data.data.productCategories.find(c => c.id === editId) : null;
        window.selectedEmoji = cat ? cat.icon : '📦';

        Modal.open(editId ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle', `
            <div style="display:flex; flex-direction:column; gap:1.5rem">
                <div>
                    <label style="display:block; font-weight:700; color:#334155; margin-bottom:0.5rem">Kategori Adı</label>
                    <input id="new_cat_name" value="${cat ? cat.name : ''}" placeholder="Örn: Profil, Civata, Kutu..." style="width:100%; padding:0.8rem; border:1px solid #cbd5e1; border-radius:0.5rem; font-size:1rem">
                </div>
                <div>
                    <label style="display:block; font-weight:700; color:#334155; margin-bottom:0.5rem">Emoji Simgesi</label>
                    <div style="display:grid; grid-template-columns:repeat(6, 1fr); gap:0.5rem">
                        ${['📦', '🏗️', '🔩', '🔮', '⚙️', '🔌', '🧰', '🧵', '🪵', '📐', '🧪', '🛡️'].map(e => `
                            <button onclick="document.querySelectorAll('.emoji-btn').forEach(b => b.style.background='white'); this.style.background='#eff6ff'; window.selectedEmoji='${e}'" class="emoji-btn" style="font-size:1.5rem; padding:0.5rem; border:1px solid #e2e8f0; border-radius:0.5rem; background:${e === window.selectedEmoji ? '#eff6ff' : 'white'}; cursor:pointer; transition:all 0.1s">${e}</button>
                        `).join('')}
                    </div>
                </div>
                <button onclick="ProductLibraryModule.saveCategory('${editId || ''}')" class="btn-primary" style="padding:1rem">${editId ? 'Güncelle' : 'Oluştur'}</button>
            </div>
        `);
    },

    saveCategory: async (editId) => {
        const name = document.getElementById('new_cat_name').value;
        if (!name) return alert('Kategori adı giriniz.');

        if (editId && editId !== 'undefined' && editId !== 'null' && editId !== '') {
            const idx = DB.data.data.productCategories.findIndex(c => c.id === editId);
            if (idx !== -1) {
                DB.data.data.productCategories[idx] = { ...DB.data.data.productCategories[idx], name, icon: window.selectedEmoji };
            }
        } else {
            DB.data.data.productCategories.push({
                id: crypto.randomUUID(),
                name,
                icon: window.selectedEmoji || '📦'
            });
        }

        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },

    deleteCategory: async (id) => {
        if (confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) {
            DB.data.data.productCategories = DB.data.data.productCategories.filter(c => c.id !== id);
            await DB.save();
            UI.renderCurrentPage();
        }
    },

    // --- EXTRUDER SPECIFIC LOGIC ---
    renderExtruderPage: (container) => {
        const { extruderTab, filters } = ProductLibraryModule.state;

        // Initial Defaults for Options - ROBUST MERGE
        if (!DB.data.meta.options) DB.data.meta.options = {};
        const defaults = {
            colors: ['Füme', 'Antrasit', 'Şeffaf', 'Beyaz'],
            diameters: [50, 60, 65, 70],
            thicknesses: [2, 3, 5],
            surfaces: ['Kabarcıksız', 'Kabarcıklı']
        };
        for (let k in defaults) {
            if (!DB.data.meta.options[k]) DB.data.meta.options[k] = defaults[k];
        }

        const opts = DB.data.meta.options;

        container.innerHTML = `
            <div style="max-width:1400px; margin:0 auto; font-family: 'Inter', sans-serif;">
                
                <!-- MAIN TITLE -->
                <div style="text-align:center; margin-bottom:3rem; position:relative">
                    <h1 style="font-size:2.5rem; color:#1e293b; letter-spacing:-0.03em; font-weight:300;">ekstrüder <span style="font-weight:700">envanter</span></h1>
                </div>

                <!-- TABS & ACTIONS ROW -->
                <div style="display:flex; flex-wrap:wrap; gap:1rem; align-items:center; margin-bottom:3rem; justify-content:space-between">
                     <!-- TABS -->
                    <div style="display:flex; gap:1rem;">
                        <button onclick="ProductLibraryModule.setExtruderTab('ROD')" 
                            class="${extruderTab === 'ROD' ? 'active-tab' : 'inactive-tab'}">
                            çubuk
                        </button>
                        <button onclick="ProductLibraryModule.setExtruderTab('PIPE')" 
                            class="${extruderTab === 'PIPE' ? 'active-tab' : 'inactive-tab'}">
                            boru
                        </button>
                    </div>

                    <!-- SEARCH CAPSULES (Filters) -->
                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; flex:1; justify-content:center">
                         ${ProductLibraryModule.renderCapsule('çap ile ara', 'dia', opts.diameters)}
                         ${ProductLibraryModule.renderCapsule(extruderTab === 'ROD' ? 'yüzey ile ara' : 'kalınlık ile ara', extruderTab === 'ROD' ? 'surface' : 'thick', extruderTab === 'ROD' ? opts.surfaces : opts.thicknesses)}
                         ${ProductLibraryModule.renderCapsule('renk ile ara', 'color', opts.colors)}
                         
                         <!-- Length Capsule (Text Input) -->
                        <div class="search-capsule">
                            <input type="number" placeholder="boy ile ara" oninput="ProductLibraryModule.setFilter('len', this.value)" value="${filters.len || ''}">
                        </div>

                         <button class="search-btn" onclick="ProductLibraryModule.resetFilters()">temizle</button>
                    </div>

                    <!-- ADD BUTTON -->
                    <div style="flex-shrink:0">
                        ${(ProductLibraryModule.state.isFormVisible) ?
                `<button onclick="ProductLibraryModule.toggleExtruderForm()" class="btn-primary" style="background:#ef4444; padding:0.8rem 2rem; border-radius:1rem">İptal</button>`
                :
                `<button onclick="ProductLibraryModule.toggleExtruderForm()" class="btn-primary" style="padding:0.8rem 2rem; border-radius:1rem; font-size:1rem; box-shadow:0 4px 10px rgba(0,0,0,0.05)">Ürün ekle +</button>`
            }
                    </div>
                </div>

                <!-- STYLES -->
                <style>
                    .active-tab { padding:0.8rem 2rem; background:#1e293b; color:white; border-radius:1rem; font-weight:600; border:none; cursor:pointer; font-size:1rem; transition:all 0.2s; }
                    .inactive-tab { padding:0.8rem 2rem; background:white; color:#64748b; border:1px solid #e2e8f0; border-radius:1rem; font-weight:500; cursor:pointer; font-size:1rem; transition:all 0.2s; }
                    .inactive-tab:hover { border-color:#94a3b8; color:#334155; }

                    .search-capsule { border:1px solid #94a3b8; border-radius:1rem; padding:0 1rem; background:white; display:flex; align-items:center; height:46px; transition:all 0.2s }
                    .search-capsule:focus-within { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1) }
                    .search-capsule select, .search-capsule input { border:none; outline:none; font-size:0.95rem; color:#334155; font-weight:600; text-align:center; background:transparent; width:130px; appearance:none; cursor:pointer }
                    .search-capsule input { width:100px }
                    .search-btn { border:2px solid #1e293b; color:#1e293b; background:transparent; border-radius:1rem; padding:0 1.5rem; height:46px; font-weight:800; cursor:pointer; transition:all 0.2s; text-transform:uppercase; font-size:0.8rem }
                    .search-btn:hover { background:#1e293b; color:white }
                </style>

                <!-- LIST -->
                <div style="display:flex; flex-direction:column; gap:0; border-top:2px solid #334155" id="product_list_container">
                    ${ProductLibraryModule.renderProductList()}
                </div>

                <!-- ADD FORM (CONDITIONAL) -->
                ${(ProductLibraryModule.state.isFormVisible) ? `
                    <div id="extFormSection" style="margin-top:4rem; background:white; border:2px solid #e2e8f0; border-radius:2rem; padding:3rem; position:relative; box-shadow:0 20px 40px -10px rgba(0,0,0,0.05); animation: slideDown 0.3s ease-out">
                         <h3 style="font-size:1.5rem; color:#334155; margin-bottom:2rem; font-weight:700">Yeni Ekstrüder Ürünü Ekle</h3>
                         
                         <!-- Re-using existing check logic but presented better -->
                         <div style="display:flex; gap:2rem; flex-wrap:wrap; align-items:flex-end">
                            ${ProductLibraryModule.renderInputGroup('çap / ebat', 'dia', opts.diameters, 'mm')}
                             <!-- Length Input for Form -->
                            <div style="display:flex; flex-direction:column; gap:0.5rem; min-width:140px;">
                                <div style="border:2px solid #94a3b8; border-radius:1.5rem; padding:0 1rem; height:56px; display:flex; align-items:center;">
                                    <input type="number" placeholder="boy" oninput="ProductLibraryModule.setFilter('len', this.value)" value="${filters.len || ''}" style="width:100%; border:none; background:transparent; font-size:1.1rem; color:#334155; font-weight:600; outline:none; text-align:center;">
                                    <span style="font-size:0.9rem; font-weight:600; color:#94a3b8; margin-left:0.25rem">mm</span>
                                </div>
                            </div>

                            ${extruderTab === 'ROD' ?
                    ProductLibraryModule.renderInputGroup('kabarcık', 'surface', opts.surfaces || ['Kabarcıksız', 'Kabarcıklı'], '') :
                    ProductLibraryModule.renderInputGroup('kalınlık', 'thick', opts.thicknesses, 'mm')
                }
                            
                            ${ProductLibraryModule.renderInputGroup('renk', 'color', opts.colors, '')}

                            <div style="margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem" id="duplicate_check_container">
                                ${ProductLibraryModule.renderDuplicateCheckButton()}
                            </div>
                         </div>
                    </div>
                ` : ''}
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    renderCapsule: (placeholder, key, options) => {
        const val = ProductLibraryModule.state.filters[key];
        return `
            <div class="search-capsule" style="position:relative">
                <select onchange="ProductLibraryModule.setFilter('${key}', this.value)" style="width:100%; padding-right:1rem">
                    <option value="">${val ? val : placeholder}</option>
                    ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
                </select>
                <i data-lucide="chevron-down" width="14" style="position:absolute; right:10px; pointer-events:none; color:#94a3b8"></i>
            </div>
        `;
    },

    toggleExtruderForm: () => {
        ProductLibraryModule.state.isFormVisible = !ProductLibraryModule.state.isFormVisible;
        // Clean filters when closing/opening to start fresh or keep context? 
        // Strategy: Keep filters as 'Form Data' since they are shared.
        UI.renderCurrentPage();
        if (ProductLibraryModule.state.isFormVisible) {
            setTimeout(() => {
                const el = document.getElementById('extFormSection');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        }
    },

    resetFilters: () => {
        ProductLibraryModule.state.filters = { dia: '', len: '', thick: '', color: '', surface: '' };
        UI.renderCurrentPage();
    },

    renderInputGroup: (label, key, options, unit) => {
        const val = ProductLibraryModule.state.filters[key];
        return `
            <div style="display:flex; flex-direction:column; gap:0.5rem; min-width:140px;">
                <button onclick="ProductLibraryModule.openOptionLibrary('${key}')" style="font-size:0.65rem; color:#3b82f6; text-align:center; background:none; border:none; cursor:pointer; font-weight:600">( + YÖNET ekle/sil )</button>
                <div style="border:2px solid #94a3b8; border-radius:1.5rem; padding:0.2rem 1rem; position:relative; height:56px; display:flex; align-items:center;">
                   <select onchange="ProductLibraryModule.setFilter('${key}', this.value)" style="width:100%; border:none; background:transparent; font-size:1.1rem; color:#334155; font-weight:600; outline:none; appearance:none; cursor:pointer; text-align-last:center; padding-right:1rem">
                        <option value="">${label}</option>
                        ${options.map(o => `<option value="${o}" ${val == o ? 'selected' : ''}>${o}${unit ? ' ' + unit : ''}</option>`).join('')}
                   </select>
                   <i data-lucide="chevron-down" width="16" style="position:absolute; right:10px; pointer-events:none; color:#94a3b8"></i>
                </div>
            </div>
        `;
    },

    renderBubbleCheck: () => {
        // Deprecated //
        const val = ProductLibraryModule.state.filters.bubble;
        return `
             <div style="display:flex; flex-direction:column; gap:0.5rem; min-width:140px;">
                <button style="font-size:0.65rem; color:#3b82f6; text-align:center; background:none; border:none; cursor:pointer; font-weight:600; opacity:0">.</button>
                <div onclick="ProductLibraryModule.toggleBubble()" style="border:2px solid #94a3b8; border-radius:1.5rem; padding:0 1rem; height:56px; display:flex; align-items:center; justify-content:center; cursor:pointer; background:${val ? '#eff6ff' : 'transparent'}; border-color:${val ? '#3b82f6' : '#94a3b8'}">
                    <span style="font-size:1.1rem; font-weight:600; color:${val ? '#1d4ed8' : '#334155'}">kabarcık</span>
                    ${val ? '<i data-lucide="check" width="16" style="margin-left:0.5rem; color:#1d4ed8"></i>' : ''}
                </div>
            </div>
        `;
    },

    setExtruderTab: (t) => {
        ProductLibraryModule.state.extruderTab = t;
        ProductLibraryModule.state.filters = { dia: '', len: '', thick: '', color: '', surface: '' }; // Reset filters
        UI.renderCurrentPage();
    },

    setFilter: (key, val) => {
        ProductLibraryModule.state.filters[key] = val;

        // If updating 'len' (Length text input), DO NOT re-render the whole page.
        // Just update the dynamic parts (Button & List).
        if (key === 'len') {
            ProductLibraryModule.updateDynamicContent();
        } else {
            // For other dropdowns, full re-render is fine and safer to ensure all selects update
            UI.renderCurrentPage();
        }
    },

    updateDynamicContent: () => {
        const btnContainer = document.getElementById('duplicate_check_container');
        const listContainer = document.getElementById('product_list_container');

        if (btnContainer) btnContainer.innerHTML = ProductLibraryModule.renderDuplicateCheckButton();
        if (listContainer) listContainer.innerHTML = ProductLibraryModule.renderProductList();
    },

    renderDuplicateCheckButton: () => {
        const { extruderTab, filters } = ProductLibraryModule.state;
        const allProducts = DB.data.data.products || [];
        const exactMatchExp = allProducts.find(p =>
            p.category === 'Ekstrüder' &&
            p.type === extruderTab &&
            p.specs.diameter == filters.dia &&
            p.specs.length == filters.len &&
            p.specs.color === filters.color &&
            (extruderTab === 'ROD' ? (p.specs.surface === filters.surface) : (p.specs.thickness == filters.thick))
        );

        const isFilled = filters.dia && filters.len && filters.color && (extruderTab === 'PIPE' ? filters.thick : filters.surface);
        const isDuplicate = !!exactMatchExp;
        const btnDisabled = !isFilled || isDuplicate;
        const btnText = isDuplicate ? 'Zaten Mevcut!' : 'Ürün Ekle +';
        const btnStyle = isDuplicate ? 'background:#f1f5f9; color:#94a3b8; border-color:#cbd5e1; cursor:not-allowed' : (isFilled ? 'background:#10b981; color:white; border-color:#059669; cursor:pointer' : 'background:white; color:#94a3b8; border-color:#cbd5e1; cursor:not-allowed');

        return `
            ${isDuplicate ? '<div style="font-size:0.8rem; color:#ef4444; font-weight:700">⚠️ Bu kombinasyon zaten kayıtlı</div>' : ''}
            <button id="btnAddExtProduct" onclick="ProductLibraryModule.addExtruderProduct()" ${btnDisabled ? 'disabled' : ''} style="padding:1rem 3rem; border:2px solid; border-radius:1.5rem; font-size:1.1rem; font-weight:600; transition:all 0.2s; ${btnStyle}">
                ${btnText}
            </button>
        `;
    },

    renderProductList: () => {
        const { extruderTab, filters } = ProductLibraryModule.state;
        // Re-calculate filtered products locally
        const products = (DB.data.data.products || []).filter(p => p.category === 'Ekstrüder' && p.type === extruderTab);

        // SORTING: Diameter/Size (smart sort) -> Length (asc) -> Color (alpha)
        products.sort((a, b) => {
            // Use localeCompare with numeric:true to handle "20", "100", "40x40" correctly
            const valA = String(a.specs.diameter || '');
            const valB = String(b.specs.diameter || '');
            const diffDia = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
            if (diffDia !== 0) return diffDia;

            const diffLen = Number(a.specs.length) - Number(b.specs.length);
            if (diffLen !== 0) return diffLen;

            return (a.specs.color || '').localeCompare(b.specs.color || '', 'tr');
        });

        let filteredProducts = products;
        if (filters.dia) filteredProducts = filteredProducts.filter(p => p.specs.diameter == filters.dia);
        if (filters.len) filteredProducts = filteredProducts.filter(p => p.specs.length == filters.len);
        if (filters.color) filteredProducts = filteredProducts.filter(p => p.specs.color === filters.color);
        if (extruderTab === 'ROD' && filters.surface) filteredProducts = filteredProducts.filter(p => p.specs.surface === filters.surface);
        if (extruderTab === 'PIPE' && filters.thick) filteredProducts = filteredProducts.filter(p => p.specs.thickness == filters.thick);

        return `
            ${filteredProducts.length === 0 ? '<div style="text-align:center; color:#cbd5e1; padding:3rem; font-size:1.2rem; font-weight:300">Bu kriterlerde ürün yok. Yeni ekleyebilirsiniz.</div>' : ''}
            
            ${filteredProducts.map(p => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:1.5rem 0; border-bottom:1px solid #64748b;">
                    <div style="font-size:1.2rem; color:#334155; font-weight:500">
                        ${ProductLibraryModule.formatProductTitle(p)}
                    </div>
                    <div style="display:flex; align-items:center; gap:3rem">
                        <div style="font-family:monospace; color:#64748b; font-size:1rem">ID; ${p.code || p.id.substring(0, 8)}</div>
                        <div style="display:flex; gap:0.5rem; align-items:center">
                            <button class="list-btn" onclick="ProductLibraryModule.editExtruderProduct('${p.id}')">düzenle</button>
                            <span style="color:#cbd5e1">/</span>
                            <button class="list-btn" onclick="ProductLibraryModule.deleteExtruderProduct('${p.id}')">sil</button>
                        </div>
                        <input type="checkbox" style="width:1.5rem; height:1.5rem; border:2px solid #94a3b8; border-radius:0.4rem; cursor:pointer">
                        <span style="color:#64748b; font-size:0.9rem">seç</span>
                    </div>
                </div>
            `).join('')}
         `;
    },

    toggleBubble: () => {
        // Deprecated //
    },

    formatProductTitle: (p) => {
        let text = `Çap ${p.specs.diameter} mm / boy ${p.specs.length} mm`;
        if (p.specs.thickness) text += ` / ${p.specs.thickness} mm`;
        if (p.specs.surface) text += ` / ${p.specs.surface}`;
        // Backward comp for bubble boolean if needed
        else if (p.specs.bubble) text += ` / kabarcıklı`;

        text += ` / ${p.specs.color} renk`;
        return text;
    },

    manageOption: (key) => {
        // Renaming/Routing to new Modal System
        ProductLibraryModule.openOptionLibrary(key);
    },

    openOptionLibrary: (key) => {
        const mapping = {
            dia: { t: 'Çap Kütüphanesi', i: 'circle-dashed', k: 'diameters' },
            thick: { t: 'Kalınlık Kütüphanesi', i: 'layers', k: 'thicknesses' },
            color: { t: 'Renk Kütüphanesi', i: 'palette', k: 'colors' },
            surface: { t: 'Yüzey Tipi Kütüphanesi', i: 'scan-line', k: 'surfaces' },
            consumableTypes: { t: 'Alt Tür Kütüphanesi', i: 'list', k: 'consumableTypes' },
            // Hardware Mappings
            hardwareShapes: { t: 'Şekil Kütüphanesi', i: 'shapes', k: 'hardwareShapes' },
            hardwareDias: { t: 'Çap Kütüphanesi', i: 'circle-dashed', k: 'hardwareDias' },
            hardwareMaterials: { t: 'Malzeme Kütüphanesi', i: 'layers', k: 'hardwareMaterials' },
            hardwareLengths: { t: 'Boy Kütüphanesi', i: 'ruler', k: 'hardwareLengths' },
            // Aluminum Mappings
            aluAnodized: { t: 'Eloksal Renk Kütüphanesi', i: 'palette', k: 'aluAnodized' },
            aluPainted: { t: 'Boya Renk Kütüphanesi', i: 'palette', k: 'aluPainted' },
            aluLengths: { t: 'Profil Boyu Kütüphanesi', i: 'ruler', k: 'aluLengths' }
        };
        const conf = mapping[key];
        if (!conf) return;

        // Ensure array exists
        if (!DB.data.meta.options[conf.k]) DB.data.meta.options[conf.k] = [];
        const items = DB.data.meta.options[conf.k];

        const modalHtml = `
            <div id="libModal_${key}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center">
                <div style="background:white; width:420px; border-radius:1.5rem; padding:1.5rem; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); animation: zoomIn 0.2s; font-family:'Inter',sans-serif">
                    
                    <!-- Header -->
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
                        <h3 style="font-weight:800; color:#334155; display:flex; align-items:center; gap:0.5rem; font-size:1.1rem">
                            <i data-lucide="${conf.i}" color="#8b5cf6" width="22"></i> ${conf.t}
                        </h3>
                        <button onclick="document.getElementById('libModal_${key}').remove(); UI.renderCurrentPage()" style="background:none; border:none; color:#94a3b8; cursor:pointer; padding:0.2rem"><i data-lucide="x" width="22"></i></button>
                    </div>

                    <!-- Add New -->
                    <div style="display:flex; gap:0.5rem; margin-bottom:1.5rem">
                        <input id="newLibItemInput" placeholder="Yeni değer..." onkeydown="if(event.key==='Enter') ProductLibraryModule.addLibraryItem('${key}')" style="flex:1; padding:0.75rem 1rem; border:2px solid #e2e8f0; border-radius:0.75rem; font-weight:600; color:#475569; outline:none; font-size:0.95rem; transition:border-color 0.2s" onfocus="this.style.borderColor='#a78bfa'" onblur="this.style.borderColor='#e2e8f0'">
                        <button onclick="ProductLibraryModule.addLibraryItem('${key}')" style="background:#8b5cf6; color:white; border:none; padding:0 1.5rem; border-radius:0.75rem; font-weight:700; cursor:pointer; box-shadow:0 4px 6px -1px rgba(139, 92, 246, 0.4); transition:transform 0.1s" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">Ekle</button>
                    </div>

                    <!-- List -->
                    <div style="max-height:350px; overflow-y:auto; display:flex; flex-direction:column; gap:0.6rem; padding-right:0.5rem">
                        ${items.length === 0 ? '<div style="text-align:center; color:#cbd5e1; padding:1.5rem; font-style:italic">Liste boş.</div>' : ''}
                        
                        ${items.map(item => `
                            <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:0.8rem 1rem; border-radius:0.75rem; border:1px solid #f1f5f9; group">
                                <div style="display:flex; align-items:center; gap:0.75rem">
                                    ${key === 'color' ? `<div style="width:18px; height:18px; border-radius:50%; border:1px solid #cbd5e1; background:${ProductLibraryModule.getColorCode(item)}"></div>` : '<i data-lucide="hash" width="14" style="color:#cbd5e1"></i>'}
                                    <span style="font-weight:700; color:#475569; font-size:0.95rem;">${item}</span>
                                </div>
                                <div style="display:flex; gap:0.25rem">
                                    <button title="Düzenle" onclick="ProductLibraryModule.editLibraryItem('${key}', '${item}')" style="background:none; border:none; color:#cbd5e1; cursor:pointer; padding:0.3rem" onmouseover="this.style.color='#64748b'" onmouseout="this.style.color='#cbd5e1'"><i data-lucide="pencil" width="16"></i></button>
                                    <button title="Sil" onclick="ProductLibraryModule.deleteLibraryItem('${key}', '${item}')" style="background:none; border:none; color:#cbd5e1; cursor:pointer; padding:0.3rem" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#cbd5e1'"><i data-lucide="trash-2" width="16"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="margin-top:1.5rem; text-align:center; font-size:0.75rem; color:#cbd5e1; font-weight:500">
                        Değişiklikler anında kaydedilir.
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (window.lucide) window.lucide.createIcons();
        document.getElementById('newLibItemInput').focus();
    },

    getColorCode: (c) => {
        const map = { 'Siyah': '#000', 'Beyaz': '#fff', 'Şeffaf': 'transparent', 'Antrasit': '#374151', 'Füme': '#525252', 'Gri': '#9ca3af', 'Kırmızı': '#ef4444', 'Sarı': '#facc15', 'Mavi': '#3b82f6' };
        return map[c] || '#cbd5e1';
    },

    addLibraryItem: async (key) => {
        const inp = document.getElementById('newLibItemInput');
        let val = inp.value.trim();
        if (!val) return;

        // Mapping to get array key
        const mapping = {
            dia: 'diameters', thick: 'thicknesses', color: 'colors', surface: 'surfaces',
            hardwareShapes: 'hardwareShapes', hardwareDias: 'hardwareDias', hardwareLengths: 'hardwareLengths', hardwareMaterials: 'hardwareMaterials',
            aluAnodized: 'aluAnodized', aluPainted: 'aluPainted', aluLengths: 'aluLengths',
            consumableTypes: 'consumableTypes'
        };
        const metaKey = mapping[key];
        if (!metaKey) return;
        if (!Array.isArray(DB.data.meta.options[metaKey])) DB.data.meta.options[metaKey] = [];
        const current = DB.data.meta.options[metaKey];

        // Type conversion (Strict for Thickness only, Smart for Dia)
        if (key === 'thick' || key === 'hardwareDias' || key === 'hardwareLengths') {
            if (isNaN(Number(val))) return alert('Lütfen sayısal bir değer giriniz.');
            val = Number(val);
        } else if (key === 'dia') {
            // Keep as number if it's a pure number, otherwise string (for 40x40)
            if (!isNaN(Number(val)) && val.trim() !== '') {
                val = Number(val);
            }
        } else if (key === 'consumableTypes') {
            val = val.toUpperCase();
        }

        if (current.some(x => String(x).toLowerCase() === String(val).toLowerCase())) {
            alert('Bu değer zaten listede var.');
            return;
        }

        current.push(val);
        // Sort if number
        if (typeof val === 'number') current.sort((a, b) => a - b);

        await DB.save();

        // Refresh Modal
        document.getElementById(`libModal_${key}`).remove();
        ProductLibraryModule.openOptionLibrary(key);
    },

    deleteLibraryItem: async (key, itemVal) => {
        if (!confirm('Silmek istediğinize emin misiniz?')) return;

        const mapping = {
            dia: 'diameters', thick: 'thicknesses', color: 'colors', surface: 'surfaces',
            hardwareShapes: 'hardwareShapes', hardwareDias: 'hardwareDias', hardwareLengths: 'hardwareLengths', hardwareMaterials: 'hardwareMaterials',
            aluAnodized: 'aluAnodized', aluPainted: 'aluPainted', aluLengths: 'aluLengths',
            consumableTypes: 'consumableTypes'
        };
        const metaKey = mapping[key];
        if (!metaKey) return;
        if (!Array.isArray(DB.data.meta.options[metaKey])) DB.data.meta.options[metaKey] = [];
        let current = DB.data.meta.options[metaKey];

        // Type check for filtering
        if (key === 'dia' || key === 'thick' || key === 'hardwareDias' || key === 'hardwareLengths') itemVal = Number(itemVal);

        DB.data.meta.options[metaKey] = current.filter(x => x !== itemVal);
        await DB.save();

        // Refresh Modal
        document.getElementById(`libModal_${key}`).remove();
        ProductLibraryModule.openOptionLibrary(key);
    },

    editLibraryItem: async (key, oldVal) => {
        const mapping = {
            dia: 'diameters', thick: 'thicknesses', color: 'colors', surface: 'surfaces',
            hardwareShapes: 'hardwareShapes', hardwareDias: 'hardwareDias', hardwareLengths: 'hardwareLengths', hardwareMaterials: 'hardwareMaterials',
            aluAnodized: 'aluAnodized', aluPainted: 'aluPainted', aluLengths: 'aluLengths',
            consumableTypes: 'consumableTypes'
        };
        const metaKey = mapping[key];
        if (!metaKey) return;
        if (!Array.isArray(DB.data.meta.options[metaKey])) DB.data.meta.options[metaKey] = [];
        const current = DB.data.meta.options[metaKey];

        const newVal = prompt("Yeni değeri giriniz:", oldVal);
        if (!newVal || newVal == oldVal) return;

        let processedVal = newVal.trim();

        if (key === 'thick' || key === 'hardwareDias' || key === 'hardwareLengths') {
            if (isNaN(Number(processedVal))) return alert('Lütfen sayısal bir değer giriniz.');
            processedVal = Number(processedVal);
        } else if (key === 'dia') {
            // Smart type for dia
            if (!isNaN(Number(processedVal)) && processedVal.trim() !== '') {
                processedVal = Number(processedVal);
            }
        }

        // Update in place
        const idx = current.indexOf(key === 'dia' || key === 'thick' || key === 'hardwareDias' || key === 'hardwareLengths' ? Number(oldVal) : oldVal);
        if (idx !== -1) {
            current[idx] = processedVal;
            if (typeof processedVal === 'number') current.sort((a, b) => a - b);
            await DB.save();
            // Refresh Modal
            document.getElementById(`libModal_${key}`).remove();
            ProductLibraryModule.openOptionLibrary(key);
        }
    },

    // --- HARDWARE (CIVATA & HIRDAVAT) SPECIFIC LOGIC ---
    renderHardwarePage: (container) => {
        const { hardwareFilters } = ProductLibraryModule.state;

        // Initial Defaults
        if (!DB.data.meta.options) DB.data.meta.options = {};
        const defaults = {
            hardwareShapes: ['Havşa Baş', 'Anahtar Baş', 'İnbus', 'Havşa Baş İnbus', 'Gijon Saplama', 'Somun', 'Pul', 'Kelebek Somun', 'Akıllı Vida'],
            hardwareDias: ['M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12', 'M14', 'M16', 'M18', 'M20', '3.9', '4.2', '4.8'],
            hardwareMaterials: ['Siyah', 'Galvaniz', 'Paslanmaz', 'İnox', 'Pirinç']
        };
        for (let k in defaults) {
            if (!DB.data.meta.options[k]) DB.data.meta.options[k] = defaults[k];
        }
        const opts = DB.data.meta.options;

        // Filter Products
        if (!DB.data.data.products) DB.data.data.products = [];
        let products = DB.data.data.products.filter(p => p.category === 'Hardware');

        // Client-side Filtering
        let filteredProducts = products;
        if (hardwareFilters.shape) filteredProducts = filteredProducts.filter(p => p.specs.shape === hardwareFilters.shape);
        if (hardwareFilters.dia) filteredProducts = filteredProducts.filter(p => p.specs.diameter === hardwareFilters.dia);
        if (hardwareFilters.len) filteredProducts = filteredProducts.filter(p => p.specs.length == hardwareFilters.len);
        if (hardwareFilters.mat) filteredProducts = filteredProducts.filter(p => p.specs.material === hardwareFilters.mat);

        // Sorting
        filteredProducts.sort((a, b) => {
            const shapeA = a.specs.shape || '';
            const shapeB = b.specs.shape || '';
            if (shapeA !== shapeB) return shapeA.localeCompare(shapeB, 'tr');

            const diaA = String(a.specs.diameter || '');
            const diaB = String(b.specs.diameter || '');
            const diffDia = diaA.localeCompare(diaB, undefined, { numeric: true, sensitivity: 'base' });
            if (diffDia !== 0) return diffDia;

            return Number(a.specs.length || 0) - Number(b.specs.length || 0);
        });

        container.innerHTML = `
            <div style="max-width:1400px; margin:0 auto; font-family: 'Inter', sans-serif;">
                <!-- MAIN TITLE -->
                <div style="text-align:center; margin-bottom:3rem; position:relative">
                    <h1 style="font-size:2.5rem; color:#1e293b; letter-spacing:-0.03em; font-weight:300;">hırdavat & <span style="font-weight:700">bağlantı elemanları</span></h1>
                </div>

                <!-- ACTIONS ROW -->
                <div style="display:flex; flex-wrap:wrap; gap:1rem; align-items:center; margin-bottom:3rem; justify-content:space-between">
                     <!-- SEARCH CAPSULES -->
                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; flex:1; justify-content:center">
                         ${ProductLibraryModule.renderHardwareCapsule('şekil ile ara', 'shape', opts.hardwareShapes)}
                         ${ProductLibraryModule.renderHardwareCapsule('çap ile ara', 'dia', opts.hardwareDias)}

                         <!-- Length Capsule -->
                        <div class="search-capsule">
                            <input type="number" placeholder="boy ile ara" oninput="ProductLibraryModule.setHardwareFilter('len', this.value)" value="${hardwareFilters.len || ''}">
                        </div>

                         ${ProductLibraryModule.renderHardwareCapsule('malzeme ile ara', 'mat', opts.hardwareMaterials)}

                         <button class="search-btn" onclick="ProductLibraryModule.resetHardwareFilters()">temizle</button>
                    </div>

                    <!-- ADD BUTTON -->
                    <div style="flex-shrink:0">
                        ${(ProductLibraryModule.state.isFormVisible) ?
                `<button onclick="ProductLibraryModule.toggleHardwareForm()" class="btn-primary" style="background:#ef4444; padding:0.8rem 2rem; border-radius:1rem">İptal</button>`
                :
                `<button onclick="ProductLibraryModule.toggleHardwareForm()" class="btn-primary" style="padding:0.8rem 2rem; border-radius:1rem; font-size:1rem; box-shadow:0 4px 10px rgba(0,0,0,0.05)">Ürün ekle +</button>`
            }
                    </div>
                </div>

                <!-- STYLES -->
                <style>
                    .search-capsule { border:1px solid #94a3b8; border-radius:1rem; padding:0 1rem; background:white; display:flex; align-items:center; height:46px; transition:all 0.2s }
                    .search-capsule:focus-within { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1) }
                    .search-capsule select, .search-capsule input { border:none; outline:none; font-size:0.95rem; color:#334155; font-weight:600; text-align:center; background:transparent; width:130px; appearance:none; cursor:pointer }
                    .search-capsule input { width:100px }
                    .search-btn { border:2px solid #1e293b; color:#1e293b; background:transparent; border-radius:1rem; padding:0 1.5rem; height:46px; font-weight:800; cursor:pointer; transition:all 0.2s; text-transform:uppercase; font-size:0.8rem }
                    .search-btn:hover { background:#1e293b; color:white }
                </style>

                <!-- LIST -->
                <div style="display:flex; flex-direction:column; gap:0; border-top:2px solid #334155" id="hw_list_container">
                    ${ProductLibraryModule.renderHardwareList(filteredProducts)}
                </div>

                <!-- ADD FORM (CONDITIONAL) -->
                ${(ProductLibraryModule.state.isFormVisible) ? `
                    <div id="hwFormSection" style="margin-top:4rem; background:white; border:2px solid #e2e8f0; border-radius:2rem; padding:3rem; position:relative; box-shadow:0 20px 40px -10px rgba(0,0,0,0.05); animation: slideDown 0.3s ease-out">
                         <h3 style="font-size:1.5rem; color:#334155; margin-bottom:2rem; font-weight:700">Yeni Hırdavat/Cıvata Ekle</h3>

                         <div style="display:flex; gap:2rem; flex-wrap:wrap; align-items:flex-end">
                            ${ProductLibraryModule.renderHardwareInputGroup('civata şekli', 'shape', opts.hardwareShapes, '')}
                            ${ProductLibraryModule.renderHardwareInputGroup('çap / ebat', 'dia', opts.hardwareDias, '')}

                             <!-- Length Input for Form -->
                            <div style="display:flex; flex-direction:column; gap:0.5rem; min-width:140px;">
                                <div style="border:2px solid #94a3b8; border-radius:1.5rem; padding:0 1rem; height:56px; display:flex; align-items:center;">
                                    <input type="number" placeholder="boy" oninput="ProductLibraryModule.setHardwareFilter('len', this.value)" value="${hardwareFilters.len || ''}" style="width:100%; border:none; background:transparent; font-size:1.1rem; color:#334155; font-weight:600; outline:none; text-align:center;">
                                    <span style="font-size:0.9rem; font-weight:600; color:#94a3b8; margin-left:0.25rem">mm</span>
                                </div>
                            </div>

                            ${ProductLibraryModule.renderHardwareInputGroup('malzeme cinsi', 'mat', opts.hardwareMaterials, '')}

                            <div style="margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem">
                                <button onclick="ProductLibraryModule.addHardwareProduct()" class="btn-primary" style="padding:1rem 3rem; border-radius:1.5rem; font-size:1.1rem; font-weight:600">
                                    ÜRÜNÜ EKLE +
                                </button>
                            </div>
                         </div>
                    </div>
                ` : ''}
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    renderHardwareCapsule: (placeholder, key, options) => {
        const val = ProductLibraryModule.state.hardwareFilters[key];
        return `
            <div class="search-capsule" style="position:relative">
                <select onchange="ProductLibraryModule.setHardwareFilter('${key}', this.value)" style="width:100%; padding-right:1rem">
                    <option value="">${val ? val : placeholder}</option>
                    ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
                </select>
                <i data-lucide="chevron-down" width="14" style="position:absolute; right:10px; pointer-events:none; color:#94a3b8"></i>
            </div>
        `;
    },

    renderHardwareInputGroup: (label, key, options, unit) => {
        const val = ProductLibraryModule.state.hardwareFilters[key];
        return `
            <div style="display:flex; flex-direction:column; gap:0.5rem; min-width:140px;">
                 <button onclick="ProductLibraryModule.openOptionLibrary('${key === 'shape' ? 'hardwareShapes' : (key === 'dia' ? 'hardwareDias' : 'hardwareMaterials')}')" style="font-size:0.65rem; color:#3b82f6; text-align:center; background:none; border:none; cursor:pointer; font-weight:600">( + YÖNET ekle/sil )</button>
                <div style="border:2px solid #94a3b8; border-radius:1.5rem; padding:0.2rem 1rem; position:relative; height:56px; display:flex; align-items:center;">
                   <select onchange="ProductLibraryModule.setHardwareFilter('${key}', this.value)" style="width:100%; border:none; background:transparent; font-size:1.1rem; color:#334155; font-weight:600; outline:none; appearance:none; cursor:pointer; text-align-last:center; padding-right:1rem">
                        <option value="">${label.toUpperCase()}</option>
                        ${options.map(o => `<option value="${o}" ${val == o ? 'selected' : ''}>${o}${unit ? ' ' + unit : ''}</option>`).join('')}
                   </select>
                   <i data-lucide="chevron-down" width="16" style="position:absolute; right:10px; pointer-events:none; color:#94a3b8"></i>
                </div>
            </div>
         `;
    },

    setHardwareFilter: (key, val) => {
        ProductLibraryModule.state.hardwareFilters[key] = val;
        UI.renderCurrentPage();
    },

    resetHardwareFilters: () => {
        ProductLibraryModule.state.hardwareFilters = { shape: '', dia: '', len: '', mat: '' };
        UI.renderCurrentPage();
    },

    toggleHardwareForm: () => {
        ProductLibraryModule.state.isFormVisible = !ProductLibraryModule.state.isFormVisible;
        UI.renderCurrentPage();
        if (ProductLibraryModule.state.isFormVisible) {
            setTimeout(() => {
                const el = document.getElementById('hwFormSection');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        }
    },

    renderHardwareList: (products) => {
        if (products.length === 0) return '<div style="text-align:center; color:#cbd5e1; padding:3rem; font-size:1.2rem; font-weight:300">Bu kriterlerde ürün yok. Yeni ekleyebilirsiniz.</div>';

        return products.map(p => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:1.5rem 0; border-bottom:1px solid #64748b;">
                <div style="font-size:1.2rem; color:#334155; font-weight:500; display:flex; gap:1rem; align-items:baseline">
                    <span style="font-weight:700">${p.specs.shape}</span>
                    <span>${p.specs.diameter}${p.specs.length ? ' x ' + p.specs.length + ' mm' : ''}</span>
                    <span style="color:#64748b; font-size:1rem">/ ${p.specs.material}</span>
                </div>
                <div style="display:flex; align-items:center; gap:3rem">
                    <div style="font-family:monospace; color:#3b82f6; font-size:0.9rem; font-weight:600">ID: ${p.code || '---'}</div>
                    <div style="display:flex; gap:0.5rem; align-items:center">
                        <button class="list-btn" onclick="ProductLibraryModule.editHardwareProduct('${p.id}')">düzenle</button>
                        <span style="color:#cbd5e1">/</span>
                        <button class="list-btn" onclick="ProductLibraryModule.deleteHardwareProduct('${p.id}')">sil</button>
                    </div>
                    <div style="display:flex; align-items:center; gap:0.5rem; border-left:1px solid #e2e8f0; padding-left:1rem; margin-left:1rem">
                        <input type="checkbox" style="width:1.5rem; height:1.5rem; border:2px solid #94a3b8; border-radius:0.4rem; cursor:pointer">
                        <span style="color:#64748b; font-size:0.9rem">seç</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    getConsumableProducts: () => {
        return (DB.data.data.products || []).filter(p =>
            p.categoryId === 'cat_sarf' ||
            String(p.category || '').toLowerCase().includes('sarf') ||
            p.type === 'CONSUMABLE'
        );
    },

    getConsumableTypeOptions: () => {
        if (!DB.data.meta) DB.data.meta = {};
        if (!DB.data.meta.options) DB.data.meta.options = {};
        if (!Array.isArray(DB.data.meta.options.consumableTypes) || DB.data.meta.options.consumableTypes.length === 0) {
            DB.data.meta.options.consumableTypes = ['BANT', 'ZIMPARA', 'YAPISTIRICI', 'TEMIZLIK', 'AMBALAJ', 'DIGER'];
        }
        return DB.data.meta.options.consumableTypes;
    },

    getConsumableSupplierOptions: () => {
        if (!DB.data.meta) DB.data.meta = {};
        if (!DB.data.meta.options) DB.data.meta.options = {};
        if (!Array.isArray(DB.data.meta.options.consumableSuppliers)) {
            DB.data.meta.options.consumableSuppliers = [];
        }
        const dynamic = ProductLibraryModule.getConsumableProducts()
            .flatMap(p => Array.isArray(p?.specs?.suppliers) ? p.specs.suppliers : [])
            .filter(Boolean);
        return Array.from(new Set([...DB.data.meta.options.consumableSuppliers, ...dynamic]));
    },

    renderConsumablePage: (container) => {
        const showForm = ProductLibraryModule.state.consumableFormOpen || !!ProductLibraryModule.state.consumableEditingId;
        const rows = ProductLibraryModule.getConsumableProducts().sort((a, b) =>
            new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)
        );
        const typeOptions = ProductLibraryModule.getConsumableTypeOptions();
        const unitOptions = ['adet', 'rulo', 'paket', 'koli', 'kg', 'litre', 'metre', 'kutu'];
        const supplierOptions = ProductLibraryModule.getConsumableSupplierOptions();

        const qName = String(ProductLibraryModule.state.consumableSearchName || '').trim().toLowerCase();
        const qType = String(ProductLibraryModule.state.consumableSearchType || '').trim().toLowerCase();
        const qId = String(ProductLibraryModule.state.consumableSearchId || '').trim().toLowerCase();
        const filtered = rows.filter(p => {
            const nameOk = !qName || String(p.name || '').toLowerCase().includes(qName);
            const typeOk = !qType || String(p?.specs?.subType || '').toLowerCase().includes(qType);
            const idOk = !qId || String(p.code || '').toLowerCase().includes(qId) || String(p.id || '').toLowerCase().includes(qId);
            return nameOk && typeOk && idOk;
        });

        const editing = ProductLibraryModule.state.consumableEditingId
            ? rows.find(x => x.id === ProductLibraryModule.state.consumableEditingId)
            : null;
        const draftCode = editing?.code || ProductLibraryModule.generateConsumableCode();
        const manualType = ProductLibraryModule.state.consumableDraftType === 'MANUEL';

        container.innerHTML = `
            <div style="max-width:1300px; margin:0 auto; font-family:'Inter', sans-serif;">
                <div style="display:flex; flex-wrap:wrap; gap:1rem; align-items:center; margin-bottom:1.25rem; justify-content:space-between">
                    <div style="text-align:left;">
                        <h1 style="font-size:2rem; color:#1e293b; letter-spacing:-0.03em; font-weight:300; margin:0;">sarf & <span style="font-weight:700">genel malzeme</span></h1>
                    </div>
                    <button onclick="ProductLibraryModule.toggleConsumableForm()" class="btn-primary" style="padding:0.8rem 1.4rem; border-radius:0.9rem;">${showForm ? 'Vazgec' : 'Urun ekle +'}</button>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem;">
                    <div style="display:flex; gap:0.6rem; margin-bottom:0.8rem; flex-wrap:wrap;">
                        <input id="cons_search_name" value="${ProductLibraryModule.escapeHtml(ProductLibraryModule.state.consumableSearchName || '')}" oninput="ProductLibraryModule.setConsumableFilter('name', this.value, 'cons_search_name')" placeholder="urun adi ile ara" style="height:38px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.75rem; min-width:220px; font-weight:600;">
                        <input id="cons_search_type" value="${ProductLibraryModule.escapeHtml(ProductLibraryModule.state.consumableSearchType || '')}" oninput="ProductLibraryModule.setConsumableFilter('type', this.value, 'cons_search_type')" placeholder="alt tur ile ara" style="height:38px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.75rem; min-width:200px; font-weight:600;">
                        <input id="cons_search_id" value="${ProductLibraryModule.escapeHtml(ProductLibraryModule.state.consumableSearchId || '')}" oninput="ProductLibraryModule.setConsumableFilter('id', this.value, 'cons_search_id')" placeholder="ID / kod ile ara" style="height:38px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.75rem; min-width:200px; font-weight:600;">
                    </div>

                    <div id="cons_list_block" style="border:1px solid #e2e8f0; border-radius:0.8rem; overflow:hidden;">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.75rem; text-transform:uppercase;">
                                    <th style="padding:0.65rem; text-align:left;">Urun adi</th>
                                    <th style="padding:0.65rem; text-align:left;">Alt tur</th>
                                    <th style="padding:0.65rem; text-align:center;">Birim</th>
                                    <th style="padding:0.65rem; text-align:left;">Marka/Model</th>
                                    <th style="padding:0.65rem; text-align:left;">Ambalaj</th>
                                    <th style="padding:0.65rem; text-align:left;">Tedarikci</th>
                                    <th style="padding:0.65rem; text-align:left;">ID</th>
                                    <th style="padding:0.65rem; text-align:right;">Duzenle</th>
                                    <th style="padding:0.65rem; text-align:right;">Sec</th>
                                    <th style="padding:0.65rem; text-align:right;">Sil</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.length === 0 ? `<tr><td colspan="10" style="padding:1.2rem; text-align:center; color:#94a3b8;">Kayit bulunamadi.</td></tr>` : filtered.map(p => `
                                    <tr style="border-bottom:1px solid #f1f5f9; ${ProductLibraryModule.state.consumableSelectedId === p.id ? 'background:#ecfeff;' : ''}">
                                        <td style="padding:0.65rem; font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(p.name || '-')}</td>
                                        <td style="padding:0.65rem;">${ProductLibraryModule.escapeHtml(p.specs?.subType || '-')}</td>
                                        <td style="padding:0.65rem; text-align:center;">${ProductLibraryModule.escapeHtml(p.specs?.unit || '-')}</td>
                                        <td style="padding:0.65rem;">${ProductLibraryModule.escapeHtml(p.specs?.brandModel || '-')}</td>
                                        <td style="padding:0.65rem;">${ProductLibraryModule.escapeHtml(p.specs?.packageInfo || '-')}</td>
                                        <td style="padding:0.65rem;">${ProductLibraryModule.escapeHtml((p.specs?.suppliers || []).join(', ') || '-')}</td>
                                        <td style="padding:0.65rem; font-family:monospace; color:#64748b;">${ProductLibraryModule.escapeHtml(p.code || '-')}</td>
                                        <td style="padding:0.65rem; text-align:right;"><button class="list-btn" onclick="ProductLibraryModule.editConsumableProduct('${p.id}')">duzenle</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button class="list-btn" onclick="ProductLibraryModule.selectConsumableProduct('${p.id}')">sec</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button class="list-btn" onclick="ProductLibraryModule.deleteConsumableProduct('${p.id}')">sil</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${showForm ? `
                    <div id="cons_form_block" style="margin-top:1rem; background:white; border:2px solid #111827; border-radius:1rem; padding:1rem; box-shadow:0 8px 18px rgba(15,23,42,0.08);">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.8rem;">
                            <strong>${editing ? 'Sarf urunu duzenle' : 'Yeni sarf urunu ekle'}</strong>
                            <div style="display:flex; gap:0.4rem;">
                                <button onclick="ProductLibraryModule.resetConsumableDraft(false)" style="border:1px solid #cbd5e1; background:white; border-radius:0.4rem; padding:0.25rem 0.55rem; cursor:pointer;">Vazgec</button>
                                <button onclick="ProductLibraryModule.saveConsumableProduct()" class="btn-primary" style="padding:0.3rem 0.6rem;">Kaydet</button>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); gap:0.6rem;">
                            <div style="grid-column:span 3;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">urun adi *</label><input value="${ProductLibraryModule.escapeHtml(ProductLibraryModule.state.consumableDraftName || '')}" oninput="ProductLibraryModule.state.consumableDraftName=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;"></div>
                            <div style="grid-column:span 2;">
                                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.35rem; margin-bottom:0.2rem;">
                                    <label style="display:block; font-size:0.74rem; color:#64748b;">alt tur *</label>
                                    <button type="button" onclick="ProductLibraryModule.openOptionLibrary('consumableTypes')" style="font-size:0.65rem; color:#3b82f6; background:none; border:none; cursor:pointer; font-weight:600; padding:0;">(+YONET)</button>
                                </div>
                                <select onchange="ProductLibraryModule.state.consumableDraftType=this.value; if(this.value!=='MANUEL'){ProductLibraryModule.state.consumableDraftTypeCustom='';} UI.renderCurrentPage();" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                                    ${typeOptions.map(t => `<option value="${t}" ${ProductLibraryModule.state.consumableDraftType === t ? 'selected' : ''}>${t}</option>`).join('')}
                                    <option value="MANUEL" ${ProductLibraryModule.state.consumableDraftType === 'MANUEL' ? 'selected' : ''}>MANUEL</option>
                                </select>
                            </div>
                            <div style="grid-column:span 2;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">birim *</label><select onchange="ProductLibraryModule.state.consumableDraftUnit=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">${unitOptions.map(u => `<option value="${u}" ${ProductLibraryModule.state.consumableDraftUnit === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
                            <div style="grid-column:span 2;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">marka/model</label><input value="${ProductLibraryModule.escapeHtml(ProductLibraryModule.state.consumableDraftBrand || '')}" oninput="ProductLibraryModule.state.consumableDraftBrand=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;"></div>
                            <div style="grid-column:span 2;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">ambalaj/icerik</label><input value="${ProductLibraryModule.escapeHtml(ProductLibraryModule.state.consumableDraftPack || '')}" oninput="ProductLibraryModule.state.consumableDraftPack=this.value" placeholder="750 ml / 50m rulo" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;"></div>
                            <div style="grid-column:span 1;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">kod</label><input disabled value="${ProductLibraryModule.escapeHtml(draftCode)}" style="width:100%; height:38px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace;"></div>
                            ${manualType ? `<div style="grid-column:span 3;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">manuel alt tur *</label><input value="${ProductLibraryModule.escapeHtml(ProductLibraryModule.state.consumableDraftTypeCustom || '')}" oninput="ProductLibraryModule.state.consumableDraftTypeCustom=this.value" placeholder="ornek: Is guvenlik" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;"></div>` : ''}
                            <div style="grid-column:span 6;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">tedarikciler (coklu secim)</label><select id="cons_suppliers" multiple onchange="ProductLibraryModule.updateConsumableSuppliers()" style="width:100%; min-height:90px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.4rem;">${supplierOptions.length === 0 ? `<option value="">Kayitli tedarikci yok</option>` : supplierOptions.map(s => `<option value="${ProductLibraryModule.escapeHtml(s)}" ${ProductLibraryModule.state.consumableDraftSuppliers.includes(s) ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(s)}</option>`).join('')}</select></div>
                            <div style="grid-column:span 6;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">yeni tedarikci(ler) (virgul ile)</label><input value="${ProductLibraryModule.escapeHtml(ProductLibraryModule.state.consumableDraftSupplierInput || '')}" oninput="ProductLibraryModule.state.consumableDraftSupplierInput=this.value" placeholder="ornek: Tedarikci A, Tedarikci B" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;"></div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); gap:0.6rem; margin-top:0.6rem;">
                            <div style="grid-column:span 7;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">not</label><textarea rows="3" oninput="ProductLibraryModule.state.consumableDraftNote=this.value" placeholder="not" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.5rem; resize:vertical;">${ProductLibraryModule.escapeHtml(ProductLibraryModule.state.consumableDraftNote || '')}</textarea></div>
                            <div style="grid-column:span 5;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">resim (opsiyonel)</label>
                                <input type="file" accept="image/*" onchange="ProductLibraryModule.handleConsumableImage(event)" style="width:100%; border:1px dashed #cbd5e1; border-radius:0.55rem; padding:0.45rem; background:#f8fafc;">
                                ${ProductLibraryModule.state.consumableDraftImageData ? `
                                    <div style="margin-top:0.5rem; display:flex; gap:0.6rem; align-items:flex-start;">
                                        <img src="${ProductLibraryModule.state.consumableDraftImageData}" alt="resim" style="width:72px; height:72px; object-fit:cover; border-radius:0.45rem; border:1px solid #cbd5e1;">
                                        <button onclick="ProductLibraryModule.state.consumableDraftImageData=''; UI.renderCurrentPage();" type="button" style="border:1px solid #cbd5e1; background:white; border-radius:0.4rem; padding:0.25rem 0.6rem; cursor:pointer;">resmi kaldir</button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        if (showForm) {
            const formEl = document.getElementById('cons_form_block');
            const listEl = document.getElementById('cons_list_block');
            if (formEl && listEl && listEl.parentElement) listEl.parentElement.insertBefore(formEl, listEl);
        }
        if (window.lucide) window.lucide.createIcons();
    },

    toggleConsumableForm: () => {
        if (ProductLibraryModule.state.consumableFormOpen || ProductLibraryModule.state.consumableEditingId) {
            ProductLibraryModule.resetConsumableDraft(false);
            return;
        }
        ProductLibraryModule.state.consumableFormOpen = true;
        ProductLibraryModule.state.consumableEditingId = null;
        ProductLibraryModule.state.consumableDraftName = '';
        ProductLibraryModule.state.consumableDraftType = 'BANT';
        ProductLibraryModule.state.consumableDraftTypeCustom = '';
        ProductLibraryModule.state.consumableDraftUnit = 'adet';
        ProductLibraryModule.state.consumableDraftBrand = '';
        ProductLibraryModule.state.consumableDraftPack = '';
        ProductLibraryModule.state.consumableDraftSuppliers = [];
        ProductLibraryModule.state.consumableDraftSupplierInput = '';
        ProductLibraryModule.state.consumableDraftNote = '';
        ProductLibraryModule.state.consumableDraftImageData = '';
        UI.renderCurrentPage();
    },

    resetConsumableDraft: (keepOpen = false) => {
        ProductLibraryModule.state.consumableFormOpen = !!keepOpen;
        ProductLibraryModule.state.consumableEditingId = null;
        ProductLibraryModule.state.consumableDraftName = '';
        ProductLibraryModule.state.consumableDraftType = 'BANT';
        ProductLibraryModule.state.consumableDraftTypeCustom = '';
        ProductLibraryModule.state.consumableDraftUnit = 'adet';
        ProductLibraryModule.state.consumableDraftBrand = '';
        ProductLibraryModule.state.consumableDraftPack = '';
        ProductLibraryModule.state.consumableDraftSuppliers = [];
        ProductLibraryModule.state.consumableDraftSupplierInput = '';
        ProductLibraryModule.state.consumableDraftNote = '';
        ProductLibraryModule.state.consumableDraftImageData = '';
        UI.renderCurrentPage();
    },

    setConsumableFilter: (key, value, focusId) => {
        if (key === 'name') ProductLibraryModule.state.consumableSearchName = value || '';
        if (key === 'type') ProductLibraryModule.state.consumableSearchType = value || '';
        if (key === 'id') ProductLibraryModule.state.consumableSearchId = value || '';
        UI.renderCurrentPage();
        if (!focusId) return;
        setTimeout(() => {
            const el = document.getElementById(focusId);
            if (!el) return;
            el.focus();
            const len = el.value.length;
            try { el.setSelectionRange(len, len); } catch (_e) { }
        }, 0);
    },

    updateConsumableSuppliers: () => {
        const el = document.getElementById('cons_suppliers');
        if (!el) return;
        ProductLibraryModule.state.consumableDraftSuppliers = Array.from(el.selectedOptions || [])
            .map(opt => String(opt.value || '').trim())
            .filter(Boolean);
    },

    handleConsumableImage: (event) => {
        const file = event?.target?.files?.[0];
        if (!file) return;
        if (!String(file.type || '').startsWith('image/')) {
            alert('Lutfen sadece gorsel dosyasi secin.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            ProductLibraryModule.state.consumableDraftImageData = String(reader.result || '');
            UI.renderCurrentPage();
        };
        reader.readAsDataURL(file);
    },

    selectConsumableProduct: (id) => {
        ProductLibraryModule.state.consumableSelectedId = id;
        UI.renderCurrentPage();
    },

    editConsumableProduct: (id) => {
        const p = ProductLibraryModule.getConsumableProducts().find(x => x.id === id);
        if (!p) return;
        const s = p.specs || {};
        ProductLibraryModule.state.consumableFormOpen = true;
        ProductLibraryModule.state.consumableEditingId = id;
        ProductLibraryModule.state.consumableSelectedId = id;
        ProductLibraryModule.state.consumableDraftName = p.name || '';
        ProductLibraryModule.state.consumableDraftType = ['BANT', 'ZIMPARA', 'YAPISTIRICI', 'TEMIZLIK', 'AMBALAJ', 'DIGER'].includes(String(s.subType || '').toUpperCase())
            ? String(s.subType || '').toUpperCase()
            : 'MANUEL';
        ProductLibraryModule.state.consumableDraftTypeCustom = ProductLibraryModule.state.consumableDraftType === 'MANUEL' ? String(s.subType || '') : '';
        ProductLibraryModule.state.consumableDraftUnit = s.unit || 'adet';
        ProductLibraryModule.state.consumableDraftBrand = s.brandModel || '';
        ProductLibraryModule.state.consumableDraftPack = s.packageInfo || '';
        ProductLibraryModule.state.consumableDraftSuppliers = Array.isArray(s.suppliers) ? s.suppliers : [];
        ProductLibraryModule.state.consumableDraftSupplierInput = '';
        ProductLibraryModule.state.consumableDraftNote = s.note || '';
        ProductLibraryModule.state.consumableDraftImageData = s.imageData || '';
        UI.renderCurrentPage();
    },

    saveConsumableProduct: async () => {
        const name = String(ProductLibraryModule.state.consumableDraftName || '').trim();
        const rawType = String(ProductLibraryModule.state.consumableDraftType || '').trim();
        const typeCustom = String(ProductLibraryModule.state.consumableDraftTypeCustom || '').trim();
        const subType = rawType === 'MANUEL' ? typeCustom : rawType;
        const unit = String(ProductLibraryModule.state.consumableDraftUnit || 'adet').trim() || 'adet';
        const brandModel = String(ProductLibraryModule.state.consumableDraftBrand || '').trim();
        const packageInfo = String(ProductLibraryModule.state.consumableDraftPack || '').trim();
        const selectedSuppliers = Array.isArray(ProductLibraryModule.state.consumableDraftSuppliers)
            ? ProductLibraryModule.state.consumableDraftSuppliers
            : [];
        const typedSuppliers = String(ProductLibraryModule.state.consumableDraftSupplierInput || '')
            .split(',')
            .map(x => x.trim())
            .filter(Boolean);
        const suppliers = Array.from(new Set([...selectedSuppliers, ...typedSuppliers]));
        const note = String(ProductLibraryModule.state.consumableDraftNote || '').trim();
        const imageData = String(ProductLibraryModule.state.consumableDraftImageData || '');

        if (!name) return alert('Lutfen urun adi giriniz.');
        if (!subType) return alert('Lutfen alt tur seciniz veya yaziniz.');

        if (!DB.data.meta) DB.data.meta = {};
        if (!DB.data.meta.options) DB.data.meta.options = {};
        if (!Array.isArray(DB.data.meta.options.consumableSuppliers)) {
            DB.data.meta.options.consumableSuppliers = [];
        }
        DB.data.meta.options.consumableSuppliers = Array.from(new Set([
            ...DB.data.meta.options.consumableSuppliers,
            ...suppliers
        ]));

        if (!Array.isArray(DB.data.data.products)) DB.data.data.products = [];
        const now = new Date().toISOString();

        if (ProductLibraryModule.state.consumableEditingId) {
            const idx = DB.data.data.products.findIndex(x => x.id === ProductLibraryModule.state.consumableEditingId);
            if (idx === -1) return;
            const old = DB.data.data.products[idx];
            DB.data.data.products[idx] = {
                ...old,
                category: 'Sarf & Genel Malzeme',
                categoryId: 'cat_sarf',
                type: 'CONSUMABLE',
                name,
                specs: {
                    ...(old.specs || {}),
                    subType,
                    unit,
                    brandModel,
                    packageInfo,
                    suppliers,
                    note,
                    imageData
                },
                updated_at: now
            };
            ProductLibraryModule.state.consumableSelectedId = old.id;
        } else {
            const id = crypto.randomUUID();
            DB.data.data.products.push({
                id,
                category: 'Sarf & Genel Malzeme',
                categoryId: 'cat_sarf',
                type: 'CONSUMABLE',
                name,
                code: ProductLibraryModule.generateConsumableCode(),
                specs: {
                    subType,
                    unit,
                    brandModel,
                    packageInfo,
                    suppliers,
                    note,
                    imageData
                },
                created_at: now,
                updated_at: now
            });
            ProductLibraryModule.state.consumableSelectedId = id;
        }

        await DB.save();
        ProductLibraryModule.resetConsumableDraft(false);
    },

    deleteConsumableProduct: async (id) => {
        const p = ProductLibraryModule.getConsumableProducts().find(x => x.id === id);
        if (!p) return;
        if (!confirm('Bu sarf urunu silinsin mi?')) return;
        DB.data.data.products = (DB.data.data.products || []).filter(x => x.id !== id);
        if (ProductLibraryModule.state.consumableSelectedId === id) ProductLibraryModule.state.consumableSelectedId = null;
        if (ProductLibraryModule.state.consumableEditingId === id) ProductLibraryModule.resetConsumableDraft(false);
        await DB.save();
        UI.renderCurrentPage();
    },

    generateConsumableCode: () => {
        const all = ProductLibraryModule.getConsumableProducts();
        let maxNum = 0;
        all.forEach(p => {
            const code = String(p?.code || '').toUpperCase();
            const m = code.match(/^SRF-(\d{1,12})$/);
            if (!m) return;
            const n = Number(m[1]);
            if (Number.isFinite(n) && n > maxNum) maxNum = n;
        });
        let nextNum = maxNum + 1;
        let candidate = `SRF-${String(nextNum).padStart(6, '0')}`;
        while (ProductLibraryModule.isGlobalCodeTaken(candidate)) {
            nextNum += 1;
            candidate = `SRF-${String(nextNum).padStart(6, '0')}`;
        }
        return candidate;
    },

    getBoxProducts: () => {
        return (DB.data.data.products || []).filter(p =>
            p.categoryId === 'cat_box' || String(p.category || '').toLowerCase() === 'koli'
        );
    },

    parseBoxSizeQuery: (query) => {
        const raw = String(query || '').trim();
        if (!raw) return null;
        const parts = raw.split(',').map(x => x.trim()).filter(Boolean);
        if (parts.length !== 3) return null;
        const nums = parts.map(x => Number(x));
        if (nums.some(n => !Number.isFinite(n))) return null;
        return { w: nums[0], l: nums[1], h: nums[2] };
    },

    renderBoxPage: (container) => {
        const showForm = ProductLibraryModule.state.boxFormOpen || !!ProductLibraryModule.state.boxEditingId;
        const cards = ProductLibraryModule.getBoxProducts().sort((a, b) => {
            return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
        });

        const qName = String(ProductLibraryModule.state.boxSearchName || '').trim().toLowerCase();
        const qSizeRaw = String(ProductLibraryModule.state.boxSearchSize || '').trim();
        const parsedSize = ProductLibraryModule.parseBoxSizeQuery(qSizeRaw);
        const filtered = cards.filter(p => {
            const nameOk = !qName || String(p.name || '').toLowerCase().includes(qName);
            let sizeOk = true;
            const sw = Number(p?.specs?.widthMm);
            const sl = Number(p?.specs?.lengthMm);
            const sh = Number(p?.specs?.heightMm);
            if (qSizeRaw) {
                if (parsedSize) sizeOk = sw === parsedSize.w && sl === parsedSize.l && sh === parsedSize.h;
                else sizeOk = `${sw},${sl},${sh}`.includes(qSizeRaw.replace(/\s+/g, ''));
            }
            return nameOk && sizeOk;
        });

        const editing = ProductLibraryModule.state.boxEditingId
            ? cards.find(x => x.id === ProductLibraryModule.state.boxEditingId)
            : null;
        const draftCode = editing?.code || ProductLibraryModule.generateBoxCode();

        container.innerHTML = `
            <div style="max-width:1300px; margin:0 auto; font-family:'Inter', sans-serif;">
                <div style="display:flex; flex-wrap:wrap; gap:1rem; align-items:center; margin-bottom:1.25rem; justify-content:space-between">
                    <div style="text-align:left;">
                        <h1 style="font-size:2rem; color:#1e293b; letter-spacing:-0.03em; font-weight:300; margin:0;">koli <span style="font-weight:700">kutuphanesi</span></h1>
                    </div>
                    <button onclick="ProductLibraryModule.toggleBoxForm()" class="btn-primary" style="padding:0.8rem 1.4rem; border-radius:0.9rem;">${showForm ? 'Vazgec' : 'Urun ekle +'}</button>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem;">
                    <div style="display:flex; gap:0.6rem; margin-bottom:0.8rem; flex-wrap:wrap;">
                        <input id="box_search_name" value="${ProductLibraryModule.escapeHtml(ProductLibraryModule.state.boxSearchName || '')}" oninput="ProductLibraryModule.setBoxFilter('name', this.value, 'box_search_name')" placeholder="koli adi ile ara" style="height:38px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.75rem; min-width:230px; font-weight:600;">
                        <input id="box_search_size" value="${ProductLibraryModule.escapeHtml(ProductLibraryModule.state.boxSearchSize || '')}" oninput="ProductLibraryModule.setBoxFilter('size', this.value, 'box_search_size')" placeholder="olcu ile ara (1250,200,350)" style="height:38px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.75rem; min-width:290px; font-weight:600;">
                    </div>

                    <div id="box_list_block" style="border:1px solid #e2e8f0; border-radius:0.8rem; overflow:hidden;">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.75rem; text-transform:uppercase;">
                                    <th style="padding:0.65rem; text-align:left;">Koli adi</th>
                                    <th style="padding:0.65rem; text-align:center;">Olculer (mm)</th>
                                    <th style="padding:0.65rem; text-align:center;">Yazi durumu</th>
                                    <th style="padding:0.65rem; text-align:left;">Not</th>
                                    <th style="padding:0.65rem; text-align:left;">Kod</th>
                                    <th style="padding:0.65rem; text-align:right;">Duzenle</th>
                                    <th style="padding:0.65rem; text-align:right;">Sec</th>
                                    <th style="padding:0.65rem; text-align:right;">Sil</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.length === 0 ? `<tr><td colspan="8" style="padding:1.2rem; text-align:center; color:#94a3b8;">Kayit bulunamadi.</td></tr>` : filtered.map(p => `
                                    <tr style="border-bottom:1px solid #f1f5f9; ${ProductLibraryModule.state.boxSelectedId === p.id ? 'background:#ecfeff;' : ''}">
                                        <td style="padding:0.65rem; font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(p.name || '-')}</td>
                                        <td style="padding:0.65rem; text-align:center; font-family:monospace;">${Number(p.specs?.widthMm || 0)},${Number(p.specs?.lengthMm || 0)},${Number(p.specs?.heightMm || 0)}</td>
                                        <td style="padding:0.65rem; text-align:center;">${ProductLibraryModule.escapeHtml(p.specs?.printType || '-')}</td>
                                        <td style="padding:0.65rem; color:#64748b;">${ProductLibraryModule.escapeHtml(p.specs?.note || '-')}</td>
                                        <td style="padding:0.65rem; font-family:monospace; color:#64748b;">${ProductLibraryModule.escapeHtml(p.code || '-')}</td>
                                        <td style="padding:0.65rem; text-align:right;"><button class="list-btn" onclick="ProductLibraryModule.editBoxProduct('${p.id}')">duzenle</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button class="list-btn" onclick="ProductLibraryModule.selectBoxProduct('${p.id}')">sec</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button class="list-btn" onclick="ProductLibraryModule.deleteBoxProduct('${p.id}')">sil</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${showForm ? `
                    <div id="box_form_block" style="margin-top:1rem; background:white; border:2px solid #111827; border-radius:1rem; padding:1rem; box-shadow:0 8px 18px rgba(15,23,42,0.08);">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.8rem;">
                            <strong>${editing ? 'Koli duzenle' : 'Yeni koli ekle'}</strong>
                            <div style="display:flex; gap:0.4rem;">
                                <button onclick="ProductLibraryModule.resetBoxDraft(false)" style="border:1px solid #cbd5e1; background:white; border-radius:0.4rem; padding:0.25rem 0.55rem; cursor:pointer;">Vazgec</button>
                                <button onclick="ProductLibraryModule.saveBoxProduct()" class="btn-primary" style="padding:0.3rem 0.6rem;">Kaydet</button>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); gap:0.6rem;">
                            <div style="grid-column:span 3;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">koli adi *</label><input id="box_name" value="${ProductLibraryModule.escapeHtml(ProductLibraryModule.state.boxDraftName || '')}" oninput="ProductLibraryModule.state.boxDraftName=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;"></div>
                            <div style="grid-column:span 2;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">en (mm) *</label><input id="box_w" type="number" min="1" value="${ProductLibraryModule.escapeHtml(String(ProductLibraryModule.state.boxDraftWidth || ''))}" oninput="ProductLibraryModule.state.boxDraftWidth=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;"></div>
                            <div style="grid-column:span 2;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">boy (mm) *</label><input id="box_l" type="number" min="1" value="${ProductLibraryModule.escapeHtml(String(ProductLibraryModule.state.boxDraftLength || ''))}" oninput="ProductLibraryModule.state.boxDraftLength=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;"></div>
                            <div style="grid-column:span 2;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">yukseklik (mm) *</label><input id="box_h" type="number" min="1" value="${ProductLibraryModule.escapeHtml(String(ProductLibraryModule.state.boxDraftHeight || ''))}" oninput="ProductLibraryModule.state.boxDraftHeight=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;"></div>
                            <div style="grid-column:span 2;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">yazi durumu</label><select id="box_print" onchange="ProductLibraryModule.state.boxDraftPrint=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;"><option value="YAZISIZ" ${ProductLibraryModule.state.boxDraftPrint === 'YAZISIZ' ? 'selected' : ''}>Yazisiz</option><option value="YAZILI" ${ProductLibraryModule.state.boxDraftPrint === 'YAZILI' ? 'selected' : ''}>Yazili</option></select></div>
                            <div style="grid-column:span 1;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">kod</label><input disabled value="${ProductLibraryModule.escapeHtml(draftCode)}" style="width:100%; height:38px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace;"></div>
                        </div>

                        <div style="margin-top:0.7rem;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">not</label><textarea id="box_note" rows="3" oninput="ProductLibraryModule.state.boxDraftNote=this.value" placeholder="not" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.5rem; resize:vertical;">${ProductLibraryModule.escapeHtml(ProductLibraryModule.state.boxDraftNote || '')}</textarea></div>
                    </div>
                ` : ''}
            </div>
        `;

        if (showForm) {
            const formEl = document.getElementById('box_form_block');
            const listEl = document.getElementById('box_list_block');
            if (formEl && listEl && listEl.parentElement) listEl.parentElement.insertBefore(formEl, listEl);
        }
        if (window.lucide) window.lucide.createIcons();
    },

    toggleBoxForm: () => {
        if (ProductLibraryModule.state.boxFormOpen || ProductLibraryModule.state.boxEditingId) {
            ProductLibraryModule.resetBoxDraft(false);
            return;
        }
        ProductLibraryModule.state.boxFormOpen = true;
        ProductLibraryModule.state.boxEditingId = null;
        ProductLibraryModule.state.boxDraftName = '';
        ProductLibraryModule.state.boxDraftWidth = '';
        ProductLibraryModule.state.boxDraftLength = '';
        ProductLibraryModule.state.boxDraftHeight = '';
        ProductLibraryModule.state.boxDraftPrint = 'YAZISIZ';
        ProductLibraryModule.state.boxDraftNote = '';
        UI.renderCurrentPage();
    },

    resetBoxDraft: (keepOpen = false) => {
        ProductLibraryModule.state.boxFormOpen = !!keepOpen;
        ProductLibraryModule.state.boxEditingId = null;
        ProductLibraryModule.state.boxDraftName = '';
        ProductLibraryModule.state.boxDraftWidth = '';
        ProductLibraryModule.state.boxDraftLength = '';
        ProductLibraryModule.state.boxDraftHeight = '';
        ProductLibraryModule.state.boxDraftPrint = 'YAZISIZ';
        ProductLibraryModule.state.boxDraftNote = '';
        UI.renderCurrentPage();
    },

    setBoxFilter: (key, value, focusId) => {
        if (key === 'name') ProductLibraryModule.state.boxSearchName = value || '';
        if (key === 'size') ProductLibraryModule.state.boxSearchSize = value || '';
        UI.renderCurrentPage();
        if (!focusId) return;
        setTimeout(() => {
            const el = document.getElementById(focusId);
            if (!el) return;
            el.focus();
            const len = el.value.length;
            try { el.setSelectionRange(len, len); } catch (_e) { }
        }, 0);
    },

    selectBoxProduct: (id) => {
        ProductLibraryModule.state.boxSelectedId = id;
        UI.renderCurrentPage();
    },

    editBoxProduct: (id) => {
        const p = ProductLibraryModule.getBoxProducts().find(x => x.id === id);
        if (!p) return;
        ProductLibraryModule.state.boxFormOpen = true;
        ProductLibraryModule.state.boxEditingId = id;
        ProductLibraryModule.state.boxSelectedId = id;
        ProductLibraryModule.state.boxDraftName = p.name || '';
        ProductLibraryModule.state.boxDraftWidth = String(p.specs?.widthMm || '');
        ProductLibraryModule.state.boxDraftLength = String(p.specs?.lengthMm || '');
        ProductLibraryModule.state.boxDraftHeight = String(p.specs?.heightMm || '');
        ProductLibraryModule.state.boxDraftPrint = p.specs?.printType || 'YAZISIZ';
        ProductLibraryModule.state.boxDraftNote = p.specs?.note || '';
        UI.renderCurrentPage();
    },

    saveBoxProduct: async () => {
        const name = String(ProductLibraryModule.state.boxDraftName || '').trim();
        const width = Number(ProductLibraryModule.state.boxDraftWidth);
        const length = Number(ProductLibraryModule.state.boxDraftLength);
        const height = Number(ProductLibraryModule.state.boxDraftHeight);
        const printType = String(ProductLibraryModule.state.boxDraftPrint || 'YAZISIZ');
        const note = String(ProductLibraryModule.state.boxDraftNote || '').trim();

        if (!name) return alert('Lutfen koli adi giriniz.');
        if (!Number.isFinite(width) || width <= 0) return alert('En degeri zorunlu.');
        if (!Number.isFinite(length) || length <= 0) return alert('Boy degeri zorunlu.');
        if (!Number.isFinite(height) || height <= 0) return alert('Yukseklik degeri zorunlu.');

        if (!Array.isArray(DB.data.data.products)) DB.data.data.products = [];
        const now = new Date().toISOString();

        if (ProductLibraryModule.state.boxEditingId) {
            const idx = DB.data.data.products.findIndex(x => x.id === ProductLibraryModule.state.boxEditingId);
            if (idx === -1) return;
            const old = DB.data.data.products[idx];
            DB.data.data.products[idx] = {
                ...old,
                category: 'Koli',
                categoryId: 'cat_box',
                type: 'BOX',
                name,
                specs: {
                    ...(old.specs || {}),
                    widthMm: width,
                    lengthMm: length,
                    heightMm: height,
                    printType,
                    note
                },
                updated_at: now
            };
            ProductLibraryModule.state.boxSelectedId = old.id;
        } else {
            const id = crypto.randomUUID();
            DB.data.data.products.push({
                id,
                category: 'Koli',
                categoryId: 'cat_box',
                type: 'BOX',
                name,
                code: ProductLibraryModule.generateBoxCode(),
                specs: {
                    widthMm: width,
                    lengthMm: length,
                    heightMm: height,
                    printType,
                    note
                },
                created_at: now,
                updated_at: now
            });
            ProductLibraryModule.state.boxSelectedId = id;
        }

        await DB.save();
        ProductLibraryModule.resetBoxDraft(false);
    },

    deleteBoxProduct: async (id) => {
        const p = ProductLibraryModule.getBoxProducts().find(x => x.id === id);
        if (!p) return;
        if (!confirm('Bu koli urunu silinsin mi?')) return;
        DB.data.data.products = (DB.data.data.products || []).filter(x => x.id !== id);
        if (ProductLibraryModule.state.boxSelectedId === id) ProductLibraryModule.state.boxSelectedId = null;
        if (ProductLibraryModule.state.boxEditingId === id) ProductLibraryModule.resetBoxDraft(false);
        await DB.save();
        UI.renderCurrentPage();
    },

    generateBoxCode: () => {
        const all = ProductLibraryModule.getBoxProducts();
        let maxNum = 0;
        all.forEach(p => {
            const code = String(p?.code || '').toUpperCase();
            const m = code.match(/^KLI-(\d{1,12})$/);
            if (!m) return;
            const n = Number(m[1]);
            if (Number.isFinite(n) && n > maxNum) maxNum = n;
        });
        let nextNum = maxNum + 1;
        let candidate = `KLI-${String(nextNum).padStart(6, '0')}`;
        while (ProductLibraryModule.isGlobalCodeTaken(candidate)) {
            nextNum += 1;
            candidate = `KLI-${String(nextNum).padStart(6, '0')}`;
        }
        return candidate;
    },

    escapeHtml: (value) => {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },
    addHardwareProduct: async () => {
        const { hardwareFilters } = ProductLibraryModule.state;
        // Validation
        if (!hardwareFilters.shape || !hardwareFilters.dia || !hardwareFilters.mat) {
            alert("Lütfen Şekil, Çap ve Malzeme seçiniz.");
            return;
        }

        // Auto Generate ID Logic
        // Map Shape
        const shapeMap = {
            'Havşa Baş': 'HB', 'Anahtar Baş': 'AB', 'İnbus': 'INB', 'Havşa Baş İnbus': 'HBI',
            'Gijon Saplama': 'GSP', 'Somun': 'SOM', 'Pul': 'PUL', 'Kelebek Somun': 'KLB', 'Akıllı Vida': 'AKL'
        };
        const matMap = { 'Siyah': 'SYH', 'Galvaniz': 'GLV', 'Paslanmaz': 'PSL', 'İnox': 'INOX', 'Pirinç': 'PRC' };

        const sCode = shapeMap[hardwareFilters.shape] || hardwareFilters.shape.substring(0, 3).toUpperCase();
        const mCode = matMap[hardwareFilters.mat] || hardwareFilters.mat.substring(0, 3).toUpperCase();
        const dia = hardwareFilters.dia.replace('.', ''); // Remove dots in dia
        const len = hardwareFilters.len || '00';
        let code = '';
        for (let i = 0; i < 5000; i += 1) {
            const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const candidate = `${sCode}-${dia}-${len}-${mCode}-${suffix}`;
            if (!ProductLibraryModule.isGlobalCodeTaken(candidate)) {
                code = candidate;
                break;
            }
        }
        if (!code) {
            alert('Benzersiz urun kodu uretilemedi. Lutfen tekrar deneyin.');
            return;
        }

        const newProduct = {
            id: crypto.randomUUID(),
            category: 'Hardware',
            type: 'Cıvata',
            name: `${hardwareFilters.shape} ${hardwareFilters.dia} ${hardwareFilters.len ? 'x ' + hardwareFilters.len : ''}`,
            code: code,
            specs: {
                shape: hardwareFilters.shape,
                diameter: hardwareFilters.dia,
                length: hardwareFilters.len,
                material: hardwareFilters.mat
            },
            created_at: new Date().toISOString()
        };

        if (!DB.data.data.products) DB.data.data.products = [];
        DB.data.data.products.push(newProduct);
        await DB.save();

        ProductLibraryModule.state.hardwareFilters = { shape: '', dia: '', len: '', mat: '' };
        ProductLibraryModule.state.isFormVisible = false;
        UI.renderCurrentPage();
    },

    deleteHardwareProduct: async (id) => {
        if (confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
            DB.data.data.products = DB.data.data.products.filter(p => p.id !== id);
            await DB.save();
            UI.renderCurrentPage();
        }
    },

    editHardwareProduct: (id) => {
        const p = DB.data.data.products.find(x => x.id === id);
        if (!p) return;

        ProductLibraryModule.state.hardwareFilters = {
            shape: p.specs.shape,
            dia: p.specs.diameter,
            len: p.specs.length || '',
            mat: p.specs.material
        };

        ProductLibraryModule.state.isFormVisible = true;
        UI.renderCurrentPage();
        setTimeout(() => {
            const el = document.getElementById('hwFormSection');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            alert("Ürün bilgileri forma yüklendi. Düzenleyip 'Ürün Ekle' diyerek yeni bir kayıt oluşturabilirsiniz.");
        }, 50);
    },

    addExtruderProduct: async () => {
        const { extruderTab, filters } = ProductLibraryModule.state;

        // Validate required fields based on Tab
        if (!filters.dia || !filters.len || !filters.color) {
            alert("Lütfen çap, boy ve renk seçiniz.");
            return;
        }
        if (extruderTab === 'PIPE' && !filters.thick) {
            alert("Lütfen kalınlık seçiniz.");
            return;
        }
        if (extruderTab === 'ROD' && !filters.surface) {
            alert("Lütfen yüzey tipi seçiniz.");
            return;
        }

        // Generate ID / Code
        const typeCode = extruderTab === 'ROD' ? 'CB' : 'BR'; // CB: Çubuk, BR: Boru
        const specCode = `${filters.dia}-${filters.len}-${filters.color.substring(0, 3).toUpperCase()}`;
        let code = '';
        for (let i = 0; i < 5000; i += 1) {
            const uniqueSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const candidate = `${typeCode}-${specCode}-${uniqueSuffix}`;
            if (!ProductLibraryModule.isGlobalCodeTaken(candidate)) {
                code = candidate;
                break;
            }
        }
        if (!code) {
            alert('Benzersiz urun kodu uretilemedi. Lutfen tekrar deneyin.');
            return;
        }

        const newProduct = {
            id: crypto.randomUUID(),
            category: 'Ekstrüder',
            type: extruderTab,
            name: `${filters.dia}mm ${extruderTab === 'ROD' ? 'Çubuk' : 'Boru'}`,
            code: code,
            specs: {
                diameter: filters.dia,
                length: filters.len,
                color: filters.color,
                thickness: filters.thick || null,
                surface: filters.surface || null,
                // bubble: filters.surface === 'Kabarcıklı' // Keep backward compat logic if needed - REMOVED
            },
            created_at: new Date().toISOString()
        };

        if (!DB.data.data.products) DB.data.data.products = [];
        DB.data.data.products.push(newProduct);
        await DB.save();

        // Reset Inputs after successful add
        ProductLibraryModule.state.filters = { dia: '', len: '', thick: '', color: '', surface: '' };
        ProductLibraryModule.state.isFormVisible = false; // Close form
        UI.renderCurrentPage();
    },

    deleteExtruderProduct: async (id) => {
        if (confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
            DB.data.data.products = DB.data.data.products.filter(p => p.id !== id);
            await DB.save();
            UI.renderCurrentPage();
        }
    },

    editExtruderProduct: async (id) => {
        // Simplified Edit: Just delete and ask to re-add for now, or populate filters?
        // Populating filters is better
        const p = DB.data.data.products.find(x => x.id === id);
        if (!p) return;

        ProductLibraryModule.state.extruderTab = p.type;
        ProductLibraryModule.state.filters = {
            dia: p.specs.diameter,
            len: p.specs.length,
            color: p.specs.color,
            thick: p.specs.thickness || '',
            surface: p.specs.surface || (p.specs.bubble ? 'Kabarcıklı' : 'Kabarcıksız')
        };
        // We should probably delete the old one if they click "Update" but we only have "Add" button right now.
        // For Prototype, let's just populate the fields so they can add a NEW similar one or delete the old one.
        // Open Form
        ProductLibraryModule.state.isFormVisible = true;
        UI.renderCurrentPage();

        setTimeout(() => {
            const el = document.getElementById('extFormSection');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            alert("Ürün özellikleri forma aktarıldı. Düzenleyip 'Ürün Ekle' diyerek yeni bir kayıt oluşturabilirsiniz.");
        }, 100);
    }
};







