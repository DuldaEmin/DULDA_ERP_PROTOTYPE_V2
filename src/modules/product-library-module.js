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
        masterFilters: { categoryId: '', name: '', length: '', colorType: '', color: '', code: '' },
        masterCategoryExpanded: {},
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
        masterDraftColorType: '',
        masterDraftColor: '',
        masterDraftColorCode: '',
        masterDraftSupplierIds: [],
        masterDraftSupplierLinks: [],
        masterDraftSupplierSearch: '',
        masterDraftSupplierCode: '',
        masterDraftNote: '',
        masterDraftAttachment: null,
        colorActiveType: '',
        colorFilters: { name: '', code: '' },
        colorEditingId: null,
        colorSelectedId: null,
        colorDraftName: '',
        colorDraftNote: '',
        componentFilters: { name: '', group: '', colorType: '', subGroup: '', code: '' },
        componentCategoryExpanded: {},
        componentLibraryKind: 'PART',
        componentFormOpen: false,
        componentEditingId: null,
        componentViewingId: null,
        componentViewPreviewIndex: 0,
        componentViewReturnContext: null,
        assemblyViewReturnContext: null,
        componentDraftCode: '',
        componentDraftName: '',
        componentDraftGroup: '',
        componentDraftColorType: '',
        componentDraftSubGroup: '',
        componentDraftColorCode: '',
        componentDraftMasterCode: '',
        componentDraftRoutes: [],
        componentDraftRouteStationId: '',
        componentRoutePicker: null,
        componentDraftNote: '',
        componentDraftFiles: [],
        assemblyFilters: { name: '', code: '' },
        assemblySourceFilters: { source: 'all', name: '', code: '' },
        assemblyFormOpen: false,
        assemblyEditingId: null,
        assemblyViewingId: null,
        assemblySelectedId: null,
        assemblyDraftCode: '',
        assemblyDraftName: '',
        assemblyDraftNote: '',
        assemblyDraftItems: [],
        assemblyDraftRoutes: [],
        assemblyDraftRouteStationId: '',
        assemblyDraftFiles: [],
        modelFilters: { group: '', name: '', code: '', plexiType: '', plexi: '', accessoryType: '', accessory: '', tubeType: '', tube: '' },
        modelGroupExpanded: {},
        modelFamilyExpanded: {},
        modelFormOpen: false,
        modelViewingId: null,
        modelEditingId: null,
        modelSelectedId: null,
        modelDraftFamilyId: '',
        modelDraftFamilyCode: '',
        modelDraftFamilyName: '',
        modelDraftVariantCode: '',
        modelDraftName: '',
        modelDraftGroup: '',
        modelDraftPlexiColorType: '',
        modelDraftPlexiColor: '',
        modelDraftPlexiColorCode: '',
        modelDraftAccessoryColorType: '',
        modelDraftAccessoryColor: '',
        modelDraftAccessoryColorCode: '',
        modelDraftTubeColorType: '',
        modelDraftTubeColor: '',
        modelDraftTubeColorCode: '',
        modelDraftMasterRefs: [],
        modelDraftMasterRef: null,
        modelDraftItems: [],
        modelDraftMontageCard: null,
        modelDraftProductFiles: [],
        modelDraftExplodedFiles: [],
        modelDraftNote: '',
        modelMasterPickerRowId: '',
        modelComponentPickerRowId: '',
        salesVariationComponentPickerRowId: '',
        componentPickerSource: '',
        masterPickerSource: '',
        planningPickerSource: '',
        assemblyFormModalOpen: false,
        salesProductDetailId: '',
        salesProductEntrySource: '',
        salesVariationEditorMode: '',
        salesVariationEditingId: '',
        salesVariationDraft: null,
        workspaceView: 'menu' // menu | models | components | semi-components | assembly | master | colors | sales-products
    },

    render: (container) => {
        ProductLibraryModule.ensureModelDefaults();
        ProductLibraryModule.ensureMasterDefaults();
        ProductLibraryModule.ensureColorLibraryDefaults();
        ProductLibraryModule.ensureComponentDefaults();
        ProductLibraryModule.ensureAssemblyDefaults();
        const view = String(ProductLibraryModule.state.workspaceView || 'menu');
        if (view === 'assembly') {
            // ParÃƒÂ§a grup ÃƒÂ¶zelliÃ„Å¸i devre dÃ„Â±Ã…Å¸Ã„Â±: assembly gÃƒÂ¶rÃƒÂ¼nÃƒÂ¼mÃƒÂ¼nÃƒÂ¼ komponent listesine yÃƒÂ¶nlendir.
            ProductLibraryModule.state.componentLibraryKind = 'PART';
            ProductLibraryModule.state.workspaceView = 'components';
            ProductLibraryModule.renderComponentsPage(container);
            return;
        }
        if (view === 'master') {
            ProductLibraryModule.renderMasterPage(container);
            return;
        }
        if (view === 'models') {
            ProductLibraryModule.renderModelsPage(container);
            return;
        }
        if (view === 'components') {
            ProductLibraryModule.renderComponentsPage(container);
            return;
        }
        if (view === 'semi-components') {
            ProductLibraryModule.renderComponentsPage(container);
            return;
        }
        if (view === 'assembly') {
            ProductLibraryModule.renderAssemblyPage(container);
            return;
        }
        if (view === 'colors') {
            ProductLibraryModule.renderColorLibraryPage(container);
            return;
        }
        if (view === 'sales-products') {
            ProductLibraryModule.renderSalesProductBuilderPage(container);
            return;
        }
        ProductLibraryModule.renderWorkspaceMenu(container);
    },

    openWorkspace: (view) => {
        const candidate = String(view || 'menu');
        const nextView = candidate === 'assembly' ? 'components' : candidate; // assembly devre dÃ„Â±Ã…Å¸Ã„Â±
        if (String(ProductLibraryModule.state.workspaceView || '') === 'models' && nextView !== 'models') {
            ProductLibraryModule.resetModelAccordionState();
        }
        if (
            (String(ProductLibraryModule.state.workspaceView || '') === 'components'
                || String(ProductLibraryModule.state.workspaceView || '') === 'semi-components')
            && nextView !== 'components'
            && nextView !== 'semi-components'
        ) {
            ProductLibraryModule.state.componentCategoryExpanded = {};
        }
        if (nextView === 'components') {
            ProductLibraryModule.state.componentLibraryKind = 'PART';
            ProductLibraryModule.state.componentCategoryExpanded = {};
            ProductLibraryModule.state.assemblyViewReturnContext = null;
            ProductLibraryModule.state.componentViewingId = null;
        }
        if (nextView === 'semi-components') {
            ProductLibraryModule.state.componentLibraryKind = 'SEMI';
            ProductLibraryModule.state.componentCategoryExpanded = {};
            ProductLibraryModule.state.assemblyViewReturnContext = null;
            ProductLibraryModule.state.componentViewingId = null;
        }
        if (nextView === 'assembly') {
            ProductLibraryModule.state.assemblyViewReturnContext = null;
        }
        if (nextView === 'sales-products') {
            if (String(ProductLibraryModule.state.salesProductEntrySource || '').trim().toLowerCase() !== 'sales') {
                ProductLibraryModule.state.salesProductEntrySource = 'product-library';
            }
        }
        if (nextView !== 'sales-products') {
            ProductLibraryModule.state.salesProductDetailId = '';
            ProductLibraryModule.state.salesProductEntrySource = '';
            ProductLibraryModule.state.salesVariationEditorMode = '';
            ProductLibraryModule.state.salesVariationEditingId = '';
            ProductLibraryModule.state.salesVariationDraft = null;
        }
        ProductLibraryModule.state.workspaceView = nextView;
        if (nextView !== 'master') ProductLibraryModule.state.masterPickerSource = '';
        if (nextView !== 'components' && nextView !== 'semi-components') ProductLibraryModule.state.componentPickerSource = '';
        if (nextView !== 'models' && nextView !== 'components' && nextView !== 'semi-components') ProductLibraryModule.state.planningPickerSource = '';
        UI.renderCurrentPage();
    },

    goWorkspaceMenu: () => {
        ProductLibraryModule.resetModelAccordionState();
        ProductLibraryModule.state.componentCategoryExpanded = {};
        ProductLibraryModule.state.masterPickerSource = '';
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.planningPickerSource = '';
        ProductLibraryModule.state.workspaceView = 'menu';
        if (typeof Router !== 'undefined' && Router && typeof Router.back === 'function') {
            Router.back();
        } else {
            UI.renderCurrentPage();
        }
    },

    openPlanningPicker: (kind) => {
        const raw = String(kind || '').trim().toLowerCase();
        const normalized = raw === 'component' ? 'component' : (raw === 'semi' ? 'semi' : 'model');
        ProductLibraryModule.resetLibraryAccordionState();
        ProductLibraryModule.state.masterPickerSource = '';
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.planningPickerSource = normalized;
        if (normalized === 'component') ProductLibraryModule.state.componentLibraryKind = 'PART';
        if (normalized === 'semi') ProductLibraryModule.state.componentLibraryKind = 'SEMI';
        ProductLibraryModule.state.workspaceView = normalized === 'model'
            ? 'sales-products'
            : (normalized === 'semi' ? 'semi-components' : 'components');
        Router.navigate('products', { fromBack: true, preserveProductsState: true });
    },

    openSalesProductLibrary: () => {
        if (typeof Router !== 'undefined' && Router && typeof Router.navigate === 'function') {
            Router.navigate('sales');
            if (typeof SalesModule !== 'undefined' && SalesModule && typeof SalesModule.openWorkspace === 'function') {
                SalesModule.openWorkspace('products');
            }
            return;
        }
        alert('Satis modulu su anda erisilebilir degil.');
    },

    cancelPlanningPicker: () => {
        ProductLibraryModule.resetLibraryAccordionState();
        ProductLibraryModule.state.planningPickerSource = '';
        ProductLibraryModule.state.workspaceView = 'menu';
        ProductLibraryModule.state.salesProductEntrySource = '';
        if (typeof StockModule !== 'undefined' && StockModule && StockModule.state?.inventoryRegistrationPickerPending) {
            if (typeof StockModule.cancelInventoryRegistrationProductPicker === 'function') {
                StockModule.cancelInventoryRegistrationProductPicker();
            }
            if (typeof Router !== 'undefined' && Router && typeof Router.navigate === 'function') {
                Router.navigate('stock', { fromBack: true });
                return;
            }
        }
        Router.navigate('planlama', { fromBack: true });
    },

    resetModelAccordionState: () => {
        ProductLibraryModule.state.modelGroupExpanded = {};
        ProductLibraryModule.state.modelFamilyExpanded = {};
    },

    resetLibraryAccordionState: () => {
        ProductLibraryModule.resetModelAccordionState();
        ProductLibraryModule.state.componentCategoryExpanded = {};
        ProductLibraryModule.state.masterCategoryExpanded = {};
    },

    resetWorkspaceEntryUiState: () => {
        ProductLibraryModule.resetLibraryAccordionState();
        ProductLibraryModule.state.workspaceView = 'menu';

        ProductLibraryModule.state.masterFormOpen = false;
        ProductLibraryModule.state.masterEditingId = null;

        ProductLibraryModule.state.componentFormOpen = false;
        ProductLibraryModule.state.componentEditingId = null;
        ProductLibraryModule.state.componentViewingId = null;
        ProductLibraryModule.state.componentViewReturnContext = null;

        ProductLibraryModule.state.assemblyFormOpen = false;
        ProductLibraryModule.state.assemblyEditingId = null;
        ProductLibraryModule.state.assemblyViewingId = null;
        ProductLibraryModule.state.assemblyViewReturnContext = null;
        ProductLibraryModule.state.assemblyFormModalOpen = false;

        ProductLibraryModule.state.modelFormOpen = false;
        ProductLibraryModule.state.modelViewingId = null;
        ProductLibraryModule.state.modelEditingId = null;
        ProductLibraryModule.state.modelMasterPickerRowId = '';
        ProductLibraryModule.state.modelComponentPickerRowId = '';

        ProductLibraryModule.state.componentRoutePicker = null;
        ProductLibraryModule.state.masterPickerSource = '';
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.planningPickerSource = '';
        ProductLibraryModule.state.salesProductDetailId = '';
        ProductLibraryModule.state.salesVariationEditorMode = '';
        ProductLibraryModule.state.salesVariationEditingId = '';
        ProductLibraryModule.state.salesVariationDraft = null;
    },

    renderWorkspaceMenu: (container) => {
        container.innerHTML = `
            <div style="max-width:1050px; margin:0 auto;">
                <div style="text-align:center; margin:0.5rem 0 2rem 0;">
                    <h2 class="page-title" style="margin:0; font-size:2rem;">Urun ve Parca Olusturma</h2>
                    <div style="color:#64748b; margin-top:0.4rem;">Uretim kartlarini buradan yonetin</div>
                </div>

                <div class="apps-grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:1.35rem;">
                    <a href="#" onclick="ProductLibraryModule.openWorkspace('components'); return false;" class="app-card" style="min-height:220px;">
                        <div class="icon-box g-orange"><i data-lucide="component" width="30" height="30"></i></div>
                        <div class="app-name">Parca & Bilesen Olusturma</div>
                    </a>
                    <a href="#" onclick="ProductLibraryModule.openWorkspace('master'); return false;" class="app-card" style="min-height:220px;">
                        <div class="icon-box g-pink"><i data-lucide="library" width="30" height="30"></i></div>
                        <div class="app-name">Master Urun Kutuphanesi</div>
                    </a>
                    <a href="#" onclick="ProductLibraryModule.openWorkspace('colors'); return false;" class="app-card" style="min-height:220px;">
                        <div class="icon-box g-cyan"><i data-lucide="palette" width="30" height="30"></i></div>
                        <div class="app-name">Renk Kutuphanesi</div>
                    </a>
                    <a href="#" onclick="ProductLibraryModule.openWorkspace('semi-components'); return false;" class="app-card" style="min-height:220px;">
                        <div class="icon-box g-emerald"><i data-lucide="factory" width="30" height="30"></i></div>
                        <div class="app-name">Yari Mamul Kutuphanesi</div>
                    </a>
                    <a href="#" onclick="ProductLibraryModule.openWorkspace('sales-products'); return false;" class="app-card" style="min-height:220px;">
                        <div class="icon-box g-purple"><i data-lucide="shopping-bag" width="30" height="30"></i></div>
                        <div class="app-name">Satılan Ürün Kütüphanesi</div>
                    </a>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    renderSalesProductBuilderPage: (container) => {
        const isPlanningModelPicker = String(ProductLibraryModule.state.planningPickerSource || '') === 'model';
        const isStockInventoryPicker = isPlanningModelPicker
            && typeof StockModule !== 'undefined'
            && !!StockModule?.state?.inventoryRegistrationPickerPending;
        const selectedProductId = String(ProductLibraryModule.state.salesProductDetailId || '').trim();
        if (selectedProductId) {
            const selectedProduct = ProductLibraryModule.getSalesCatalogProductById(selectedProductId);
            if (selectedProduct) {
                ProductLibraryModule.renderSalesProductVariationPage(container, selectedProduct);
                return;
            }
            ProductLibraryModule.state.salesProductDetailId = '';
        }
        if (typeof SalesModule !== 'undefined' && SalesModule && typeof SalesModule.renderProductsLayout === 'function') {
            SalesModule.ensureCatalogState();
            const layoutHtml = SalesModule.renderProductsLayout({
                host: 'product-library',
                onSelectAction: 'ProductLibraryModule.openSalesProductVariationPage',
                viewButtonLabel: 'varyasyonlar'
            });
            container.innerHTML = isPlanningModelPicker
                ? `
                    <div style="max-width:1880px; margin:0 auto 0.85rem;">
                        <div style="background:#eff6ff; border:2px solid #1d4ed8; color:#1e3a8a; border-radius:0.9rem; padding:0.7rem 0.85rem; display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap;">
                            <div style="font-weight:700;">${isStockInventoryPicker
                        ? 'Envantere elle kayit icin satilan urun varyasyonu secimi modundasin. Once urunu ac, sonra varyasyon satirindan "ekle" butonuna bas.'
                        : 'Planlama icin satilan urun varyasyonu secimi modundasin. Once urunu ac, sonra varyasyon satirindan "ekle" butonuna bas.'}</div>
                            <button class="btn-sm" onclick="ProductLibraryModule.cancelPlanningPicker()">${isStockInventoryPicker ? 'envantere don' : 'planlamaya don'}</button>
                        </div>
                    </div>
                    ${layoutHtml}
                `
                : layoutHtml;
            return;
        }
        ProductLibraryModule.renderWorkspacePlaceholder(
            container,
            'Satılan Ürün Kütüphanesi',
            'Satis modulu yuklenmedigi icin bu ekran acilamadi.'
        );
    },

    openSalesProductVariationPage: (productId) => {
        const id = String(productId || '').trim();
        if (!id) return;
        ProductLibraryModule.state.salesProductEntrySource = 'product-library';
        ProductLibraryModule.state.salesProductDetailId = id;
        ProductLibraryModule.state.salesVariationEditorMode = '';
        ProductLibraryModule.state.salesVariationEditingId = '';
        ProductLibraryModule.state.salesVariationDraft = null;
        UI.renderCurrentPage();
    },

    closeSalesProductVariationPage: () => {
        const source = String(ProductLibraryModule.state.salesProductEntrySource || '').trim().toLowerCase();
        ProductLibraryModule.state.salesProductDetailId = '';
        ProductLibraryModule.state.salesVariationEditorMode = '';
        ProductLibraryModule.state.salesVariationEditingId = '';
        ProductLibraryModule.state.salesVariationDraft = null;
        if (source === 'sales' && typeof Router !== 'undefined' && Router && typeof Router.navigate === 'function') {
            if (typeof SalesModule !== 'undefined' && SalesModule?.state) {
                SalesModule.state.workspaceView = 'products';
            }
            ProductLibraryModule.state.salesProductEntrySource = '';
            Router.navigate('sales', { fromBack: true });
            return;
        }
        ProductLibraryModule.state.salesProductEntrySource = '';
        UI.renderCurrentPage();
    },

    getSalesCatalogProductById: (id) => {
        const list = Array.isArray(DB.data?.data?.salesCatalogProducts) ? DB.data.data.salesCatalogProducts : [];
        return list.find((row) => String(row?.id || '').trim() === String(id || '').trim()) || null;
    },

    ensureSalesVariationDefaults: () => {
        if (!DB.data || typeof DB.data !== 'object') DB.data = {};
        if (!DB.data.data || typeof DB.data.data !== 'object') DB.data.data = {};
        if (!Array.isArray(DB.data.data.salesProductVariants)) DB.data.data.salesProductVariants = [];
        if (!['create', 'edit', 'view'].includes(String(ProductLibraryModule.state.salesVariationEditorMode || ''))) {
            ProductLibraryModule.state.salesVariationEditorMode = '';
        }
    },

    normalizeSalesVariantCodeBase: (value) => {
        const raw = String(value || '').trim();
        const normalized = String(ProductLibraryModule.normalizeAsciiUpper(raw) || '')
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 18);
        return normalized || 'VAR';
    },

    getSalesProductVariationRows: (productId) => {
        ProductLibraryModule.ensureSalesVariationDefaults();
        const sourceId = String(productId || '').trim();
        if (!sourceId) return [];
        const rows = Array.isArray(DB.data?.data?.salesProductVariants) ? DB.data.data.salesProductVariants : [];
        return rows
            .filter((row) => String(row?.sourceCatalogProductId || '').trim() === sourceId)
            .map((row, index) => {
                const colors = row?.colors && typeof row.colors === 'object' ? row.colors : {};
                const normalizeColor = (key) => {
                    const colorRow = colors?.[key] && typeof colors[key] === 'object' ? colors[key] : {};
                    const category = (typeof SalesModule !== 'undefined' && SalesModule && typeof SalesModule.normalizeCatalogColorType === 'function')
                        ? SalesModule.normalizeCatalogColorType(colorRow?.category || '')
                        : ProductLibraryModule.normalizeColorType(colorRow?.category || '');
                    return {
                        category,
                        color: String(colorRow?.color || '').trim()
                    };
                };
                return {
                    id: String(row?.id || '').trim(),
                    orderIndex: index,
                    sourceCatalogProductId: sourceId,
                    sourceCatalogProductCode: String(row?.sourceCatalogProductCode || row?.sourceCatalogCode || '').trim().toUpperCase(),
                    sourceCatalogIdCode: String(row?.sourceCatalogIdCode || '').trim().toUpperCase(),
                    sourceCatalogName: String(row?.sourceCatalogName || '').trim(),
                    variantCode: String(row?.variantCode || '').trim().toUpperCase(),
                    productName: String(row?.productName || '').trim(),
                    bubble: String(row?.bubble || 'yok').trim() === 'var' ? 'var' : 'yok',
                    selectedDiameter: String(row?.selectedDiameter || '').trim(),
                    lowerTubeLengthMm: String(row?.lowerTubeLengthMm ?? '').trim(),
                    colors: {
                        accessory: normalizeColor('accessory'),
                        tube: normalizeColor('tube'),
                        plexi: normalizeColor('plexi')
                    },
                    montageCard: row?.montageCard && typeof row.montageCard === 'object'
                        ? {
                            cardCode: String(row.montageCard.cardCode || '').trim().toUpperCase(),
                            productCode: String(row.montageCard.productCode || '').trim().toUpperCase(),
                            productName: String(row.montageCard.productName || '').trim()
                        }
                        : null,
                    masterRefs: Array.isArray(row?.masterRefs)
                        ? row.masterRefs.map((item) => ({
                            id: String(item?.id || crypto.randomUUID()),
                            refId: String(item?.refId || '').trim(),
                            code: String(item?.code || '').trim().toUpperCase(),
                            name: String(item?.name || '').trim(),
                            qty: Math.max(1, Number(item?.qty || 1))
                        })).filter((item) => item.code)
                        : [],
                    items: Array.isArray(row?.items)
                        ? row.items.map((item) => ({
                            id: String(item?.id || crypto.randomUUID()),
                            refId: String(item?.refId || '').trim(),
                            code: String(item?.code || '').trim().toUpperCase(),
                            name: String(item?.name || '').trim(),
                            qty: Math.max(1, Number(item?.qty || 1))
                        })).filter((item) => item.code)
                        : [],
                    explodedFiles: Array.isArray(row?.explodedFiles)
                        ? row.explodedFiles.map((file) => ({
                            name: String(file?.name || 'dosya').trim() || 'dosya',
                            type: String(file?.type || '').trim(),
                            size: Number(file?.size || 0),
                            data: String(file?.data || '')
                        })).filter((file) => file.data)
                        : [],
                    note: String(row?.note || '').trim(),
                    productionReady: !!row?.productionReady,
                    createdAt: String(row?.created_at || ''),
                    updatedAt: String(row?.updated_at || '')
                };
            })
            .map((row) => {
                const status = ProductLibraryModule.getSalesVariationProductionStatus(row);
                return {
                    ...row,
                    productionReady: status.ready,
                    productionStatusReason: status.reason
                };
            })
            .filter((row) => row.id && row.variantCode)
            .sort((a, b) => {
                const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
                const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
                return bTime - aTime;
            });
    },

    getSalesVariationProductionStatus: (row = {}) => {
        const variationId = String(row?.id || row?.sourceVariationId || '').trim();
        const planningModelId = variationId
            ? ProductLibraryModule.getPlanningModelIdFromSalesVariationId(variationId)
            : '';
        const demands = Array.isArray(DB.data?.data?.planningDemands) ? DB.data.data.planningDemands : [];
        const hasProductionPlan = !!planningModelId && demands.some((demand) => {
            const demandVariantId = String(demand?.variantId || '').trim();
            if (demandVariantId === planningModelId || demandVariantId === variationId) return true;
            const items = Array.isArray(demand?.items) ? demand.items : [];
            return items.some((item) => {
                const kind = String(item?.itemType || '').trim().toUpperCase();
                if (kind !== 'MODEL') return false;
                const itemVariantId = String(item?.variantId || '').trim();
                return itemVariantId === planningModelId || itemVariantId === variationId;
            });
        });
        const montageCode = String(row?.montageCard?.cardCode || row?.montageCardCode || '').trim();
        const hasMasterRefs = Array.isArray(row?.masterRefs) && row.masterRefs.some((item) =>
            String(item?.code || item?.refId || '').trim()
        );
        const hasComponentItems = Array.isArray(row?.items)
            ? row.items.some((item) => String(item?.code || item?.refId || '').trim())
            : (Array.isArray(row?.componentItems) && row.componentItems.some((item) => String(item?.code || item?.refId || '').trim()));
        const missing = [];
        if (!hasProductionPlan) missing.push('uretim plani');
        if (!montageCode) missing.push('montaj karti');
        if (!hasMasterRefs) missing.push('master urun bagi');
        if (!hasComponentItems) missing.push('parca/bilesen bagi');
        if (!missing.length) return { ready: true, reason: '' };
        return { ready: false, reason: `Eksik: ${missing.join(', ')}` };
    },

    getPlanningModelIdFromSalesVariationId: (variationId) => {
        const id = String(variationId || '').trim();
        return id ? `salesvar_${id}` : '';
    },

    isSalesPlanningModelId: (id) => {
        return String(id || '').trim().toLowerCase().startsWith('salesvar_');
    },

    getSalesVariationIdFromPlanningModelId: (id) => {
        const raw = String(id || '').trim();
        if (!raw) return '';
        if (ProductLibraryModule.isSalesPlanningModelId(raw)) return raw.slice('salesvar_'.length).trim();
        return raw;
    },

    getAllSalesProductVariationRows: () => {
        ProductLibraryModule.ensureSalesVariationDefaults();
        const products = Array.isArray(DB.data?.data?.salesCatalogProducts) ? DB.data.data.salesCatalogProducts : [];
        const all = [];
        products.forEach((product) => {
            const sourceId = String(product?.id || '').trim();
            if (!sourceId) return;
            all.push(...ProductLibraryModule.getSalesProductVariationRows(sourceId));
        });
        return all;
    },

    resolvePlanningModelMontageCard: (montageRaw = {}) => {
        const options = ProductLibraryModule.getModelMontageCardOptions();
        const rawId = String(montageRaw?.id || '').trim();
        const rawCardCode = String(montageRaw?.cardCode || '').trim().toUpperCase();
        const rawProductCode = String(montageRaw?.productCode || '').trim().toUpperCase();
        const rawProductName = String(montageRaw?.productName || '').trim();

        let hit = null;
        if (rawId) hit = options.find((row) => String(row?.id || '').trim() === rawId) || null;
        if (!hit && rawCardCode) {
            hit = options.find((row) => String(row?.cardCode || '').trim().toUpperCase() === rawCardCode) || null;
        }
        if (!hit && rawProductCode) {
            hit = options.find((row) => String(row?.productCode || '').trim().toUpperCase() === rawProductCode) || null;
        }

        if (hit) {
            return {
                id: String(hit?.id || '').trim(),
                cardCode: String(hit?.cardCode || '').trim().toUpperCase(),
                productCode: String(hit?.productCode || '').trim().toUpperCase(),
                productName: String(hit?.productName || '').trim()
            };
        }
        if (!rawId && !rawCardCode && !rawProductCode && !rawProductName) return null;
        return {
            id: rawId,
            cardCode: rawCardCode,
            productCode: rawProductCode,
            productName: rawProductName
        };
    },

    normalizePlanningModelColorFromSalesVariation: (block = {}) => {
        const type = ProductLibraryModule.normalizeColorType(block?.category || block?.type || '');
        const initialName = String(block?.color || block?.name || '').trim();
        const initialCode = String(block?.code || '').trim().toUpperCase();
        const strict = ProductLibraryModule.resolveStrictLibraryColorSelection({
            colorType: type,
            colorCode: initialCode,
            colorName: initialName
        });
        if (strict?.found) {
            return { type: strict.type, name: strict.name, code: strict.code };
        }
        if (type && initialName) {
            const hit = ProductLibraryModule.getColorLibraryItemsByType(type).find((row) =>
                String(row?.name || '').trim().toLocaleLowerCase('tr-TR') === initialName.toLocaleLowerCase('tr-TR')
            ) || null;
            if (hit) {
                return {
                    type,
                    name: String(hit?.name || initialName).trim(),
                    code: String(hit?.code || initialCode).trim().toUpperCase()
                };
            }
        }
        return { type, name: initialName, code: initialCode };
    },

    inferPlanningModelItemSource: (item = {}) => {
        const rawSource = String(item?.source || '').trim().toLowerCase();
        if (rawSource === 'master') return 'master';
        if (['semi', 'yarimamul', 'semi-finished'].includes(rawSource)) return 'semi';
        const refId = String(item?.refId || '').trim();
        if (refId) {
            const semiCards = Array.isArray(DB.data?.data?.semiFinishedCards) ? DB.data.data.semiFinishedCards : [];
            if (semiCards.some((row) => String(row?.id || '').trim() === refId)) return 'semi';
        }
        const code = String(item?.code || '').trim().toUpperCase();
        if (code.startsWith('YRM-')) return 'semi';
        return 'component';
    },

    buildPlanningModelFromSalesVariation: (variationRow = {}) => {
        const sourceVariationId = String(variationRow?.id || '').trim();
        if (!sourceVariationId) return null;
        const id = ProductLibraryModule.getPlanningModelIdFromSalesVariationId(sourceVariationId);
        const sourceCatalogProductId = String(variationRow?.sourceCatalogProductId || '').trim();
        const sourceProduct = ProductLibraryModule.getSalesCatalogProductById(sourceCatalogProductId);
        const categoryId = String(sourceProduct?.categoryId || variationRow?.sourceCatalogCategoryId || '').trim();
        const categoryPath = (typeof SalesModule !== 'undefined' && SalesModule && typeof SalesModule.getCatalogCategoryPathText === 'function')
            ? String(SalesModule.getCatalogCategoryPathText(categoryId) || '').trim()
            : categoryId;
        const montageCard = ProductLibraryModule.resolvePlanningModelMontageCard(variationRow?.montageCard || null);
        const updatedAt = String(variationRow?.updatedAt || variationRow?.updated_at || variationRow?.createdAt || variationRow?.created_at || '').trim();
        const createdAt = String(variationRow?.createdAt || variationRow?.created_at || updatedAt || new Date().toISOString()).trim();
        const items = (Array.isArray(variationRow?.items) ? variationRow.items : [])
            .map((item) => ({
                id: String(item?.id || crypto.randomUUID()),
                source: ProductLibraryModule.inferPlanningModelItemSource(item),
                refId: String(item?.refId || '').trim(),
                code: String(item?.code || '').trim().toUpperCase(),
                name: String(item?.name || '').trim(),
                qty: Math.max(1, Number(item?.qty || item?.quantity || 1))
            }))
            .filter((item) => item.code);
        const masterRefs = (Array.isArray(variationRow?.masterRefs) ? variationRow.masterRefs : [])
            .map((item) => ({
                rowId: String(item?.rowId || item?.id || crypto.randomUUID()),
                id: String(item?.refId || item?.id || '').trim(),
                code: String(item?.code || '').trim().toUpperCase(),
                name: String(item?.name || '').trim(),
                categoryName: String(item?.categoryName || '').trim(),
                qty: Math.max(1, Number(item?.qty || 1))
            }))
            .filter((item) => item.code);
        const variantCode = String(variationRow?.variantCode || '').trim().toUpperCase();
        const productName = String(variationRow?.productName || sourceProduct?.name || variationRow?.sourceCatalogName || '').trim();
        if (!variantCode || !productName) return null;

        return {
            id,
            orderIndex: Number(variationRow?.orderIndex || 0),
            familyId: sourceCatalogProductId || id,
            familyCode: String(sourceProduct?.productCode || variationRow?.sourceCatalogProductCode || variationRow?.sourceCatalogIdCode || '').trim().toUpperCase(),
            familyName: String(sourceProduct?.name || variationRow?.sourceCatalogName || productName).trim(),
            variantCode,
            productName,
            productGroup: String(categoryPath || categoryId || 'Satilan Urunler').trim(),
            masterRefs,
            masterRef: masterRefs[0] || null,
            items,
            montageCard,
            colors: {
                plexi: ProductLibraryModule.normalizePlanningModelColorFromSalesVariation(variationRow?.colors?.plexi || {}),
                accessory: ProductLibraryModule.normalizePlanningModelColorFromSalesVariation(variationRow?.colors?.accessory || {}),
                tube: ProductLibraryModule.normalizePlanningModelColorFromSalesVariation(variationRow?.colors?.tube || {})
            },
            productFiles: [],
            explodedFiles: (Array.isArray(variationRow?.explodedFiles) ? variationRow.explodedFiles : [])
                .map((file) => ({
                    name: String(file?.name || 'dosya').trim() || 'dosya',
                    type: String(file?.type || '').trim(),
                    size: Number(file?.size || 0),
                    data: String(file?.data || '')
                }))
                .filter((file) => file.data),
            note: String(variationRow?.note || '').trim(),
            createdAt,
            updatedAt,
            created_at: createdAt,
            updated_at: updatedAt,
            sourceType: 'SALES_VARIATION',
            sourceVariationId,
            sourceCatalogProductId
        };
    },

    getPlanningModelVariants: () => {
        const salesMapped = ProductLibraryModule.getAllSalesProductVariationRows()
            .map((row) => ProductLibraryModule.buildPlanningModelFromSalesVariation(row))
            .filter(Boolean);
        const salesIds = new Set(salesMapped.map((row) => String(row?.id || '')));
        const legacyRows = ProductLibraryModule.getCatalogProductVariants()
            .filter((row) => !salesIds.has(String(row?.id || '')));
        return [...salesMapped, ...legacyRows].sort((a, b) => {
            const ga = String(a?.productGroup || '');
            const gb = String(b?.productGroup || '');
            if (ga !== gb) return ga.localeCompare(gb, 'tr');
            const na = String(a?.productName || '');
            const nb = String(b?.productName || '');
            if (na !== nb) return na.localeCompare(nb, 'tr');
            return String(a?.variantCode || '').localeCompare(String(b?.variantCode || ''), 'tr');
        });
    },

    getPlanningModelById: (id) => {
        const key = String(id || '').trim();
        if (!key) return null;
        if (ProductLibraryModule.isSalesPlanningModelId(key)) {
            const salesVariationId = ProductLibraryModule.getSalesVariationIdFromPlanningModelId(key);
            const salesRow = ProductLibraryModule.getAllSalesProductVariationRows()
                .find((row) => String(row?.id || '').trim() === salesVariationId) || null;
            return salesRow ? ProductLibraryModule.buildPlanningModelFromSalesVariation(salesRow) : null;
        }
        const legacy = ProductLibraryModule.getCatalogVariantById(key);
        if (legacy) return legacy;
        const directSalesRow = ProductLibraryModule.getAllSalesProductVariationRows()
            .find((row) => String(row?.id || '').trim() === key) || null;
        return directSalesRow ? ProductLibraryModule.buildPlanningModelFromSalesVariation(directSalesRow) : null;
    },

    generateSalesVariantCode: (product, excludeId = '') => {
        const sourceProduct = product && typeof product === 'object' ? product : {};
        const sourceId = String(sourceProduct?.id || '').trim();
        const base = ProductLibraryModule.normalizeSalesVariantCodeBase(
            sourceProduct?.productCode || sourceProduct?.idCode || sourceProduct?.name || 'VAR'
        );
        const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`^${escapedBase}-(\\d{3})$`);
        const rows = ProductLibraryModule.getSalesProductVariationRows(sourceId);
        let maxSeq = 0;
        const used = new Set();
        rows.forEach((row) => {
            if (excludeId && String(row?.id || '') === String(excludeId || '')) return;
            const code = String(row?.variantCode || '').trim().toUpperCase();
            if (!code) return;
            used.add(code);
            const match = code.match(regex);
            if (!match) return;
            const seq = Number(match[1] || 0);
            if (Number.isFinite(seq) && seq > maxSeq) maxSeq = seq;
        });
        let next = maxSeq + 1;
        let candidate = `${base}-${String(next).padStart(3, '0')}`;
        while (used.has(candidate)) {
            next += 1;
            candidate = `${base}-${String(next).padStart(3, '0')}`;
        }
        return candidate;
    },

    buildSalesVariationDraft: (product, source = null, options = {}) => {
        const sourceProduct = product && typeof product === 'object' ? product : {};
        const sourceRow = source && typeof source === 'object' ? source : null;
        const asCopy = !!options?.asCopy;
        const diameters = Array.isArray(sourceProduct?.diameters)
            ? sourceProduct.diameters.map((value) => String(value || '').trim()).filter(Boolean)
            : [];
        const selectedDiameter = String(sourceRow?.selectedDiameter || sourceProduct?.selectedDiameter || diameters[0] || '').trim();
        const normalizeLowerTubeLength = (value) => {
            const text = String(value ?? '').trim();
            return text || 'standart';
        };
        const sourceColors = sourceRow?.colors || {};
        const productColors = sourceProduct?.colors || {};
        return {
            id: asCopy ? '' : String(sourceRow?.id || '').trim(),
            sourceCatalogProductId: String(sourceProduct?.id || '').trim(),
            productName: String(sourceRow?.productName || sourceProduct?.name || '').trim(),
            variantCode: (!sourceRow || asCopy)
                ? ProductLibraryModule.generateSalesVariantCode(sourceProduct)
                : String(sourceRow?.variantCode || ProductLibraryModule.generateSalesVariantCode(sourceProduct, sourceRow?.id || '')).trim().toUpperCase(),
            bubble: String(sourceRow?.bubble || sourceProduct?.bubble || 'yok').trim() === 'var' ? 'var' : 'yok',
            selectedDiameter,
            lowerTubeLengthMm: normalizeLowerTubeLength(sourceRow?.lowerTubeLengthMm || sourceProduct?.lowerTubeLength || ''),
            colors: {
                accessory: { category: String(sourceColors?.accessory?.category || productColors?.accessory?.category || '').trim(), color: String(sourceColors?.accessory?.color || productColors?.accessory?.color || '').trim() },
                tube: { category: String(sourceColors?.tube?.category || productColors?.tube?.category || '').trim(), color: String(sourceColors?.tube?.color || productColors?.tube?.color || '').trim() },
                plexi: { category: String(sourceColors?.plexi?.category || productColors?.plexi?.category || '').trim(), color: String(sourceColors?.plexi?.color || productColors?.plexi?.color || '').trim() }
            },
            montageCardCode: String(sourceRow?.montageCard?.cardCode || '').trim().toUpperCase(),
            masterRefs: Array.isArray(sourceRow?.masterRefs) ? sourceRow.masterRefs.map((item) => ({ id: String(item?.id || crypto.randomUUID()), refId: String(item?.refId || '').trim(), code: String(item?.code || '').trim().toUpperCase(), name: String(item?.name || '').trim(), qty: Math.max(1, Number(item?.qty || 1)) })).filter((item) => item.code) : [],
            componentItems: Array.isArray(sourceRow?.items) ? sourceRow.items.map((item) => ({ id: String(item?.id || crypto.randomUUID()), refId: String(item?.refId || '').trim(), code: String(item?.code || '').trim().toUpperCase(), name: String(item?.name || '').trim(), qty: Math.max(1, Number(item?.qty || 1)) })).filter((item) => item.code) : [],
            explodedFiles: Array.isArray(sourceRow?.explodedFiles) ? sourceRow.explodedFiles.map((file) => ({ name: String(file?.name || 'dosya').trim() || 'dosya', type: String(file?.type || '').trim(), size: Number(file?.size || 0), data: String(file?.data || '') })).filter((file) => file.data) : [],
            note: String(sourceRow?.note || '').trim()
        };
    },

    openSalesVariationEditor: (mode = 'create', variationId = '') => {
        ProductLibraryModule.ensureSalesVariationDefaults();
        const sourceProductId = String(ProductLibraryModule.state.salesProductDetailId || '').trim();
        const sourceProduct = ProductLibraryModule.getSalesCatalogProductById(sourceProductId);
        if (!sourceProduct) return alert('Urun karti bulunamadi.');
        const normalizedMode = ['create', 'edit', 'view'].includes(String(mode || ''))
            ? String(mode || '')
            : 'create';
        if (normalizedMode === 'create') {
            ProductLibraryModule.state.salesVariationEditorMode = 'create';
            ProductLibraryModule.state.salesVariationEditingId = '';
            ProductLibraryModule.state.salesVariationDraft = ProductLibraryModule.buildSalesVariationDraft(sourceProduct);
            ProductLibraryModule.state.salesVariationComponentPickerRowId = '';
            UI.renderCurrentPage();
            return;
        }
        const rows = ProductLibraryModule.getSalesProductVariationRows(sourceProductId);
        const selected = rows.find((item) => String(item?.id || '') === String(variationId || ''));
        if (!selected) return alert('Varyasyon kaydi bulunamadi.');
        ProductLibraryModule.state.salesVariationEditorMode = normalizedMode;
        ProductLibraryModule.state.salesVariationEditingId = String(selected.id || '');
        ProductLibraryModule.state.salesVariationDraft = ProductLibraryModule.buildSalesVariationDraft(sourceProduct, selected);
        ProductLibraryModule.state.salesVariationComponentPickerRowId = '';
        UI.renderCurrentPage();
    },

    closeSalesVariationEditor: () => {
        ProductLibraryModule.state.salesVariationEditorMode = '';
        ProductLibraryModule.state.salesVariationEditingId = '';
        ProductLibraryModule.state.salesVariationDraft = null;
        ProductLibraryModule.state.salesVariationComponentPickerRowId = '';
        UI.renderCurrentPage();
    },

    setSalesVariationDraftField: (key, value) => {
        if (!ProductLibraryModule.state.salesVariationDraft || typeof ProductLibraryModule.state.salesVariationDraft !== 'object') return;
        ProductLibraryModule.state.salesVariationDraft[key] = String(value ?? '');
    },

    setSalesVariationColorCategory: (field, value) => {
        const key = String(field || '').trim();
        if (!ProductLibraryModule.state.salesVariationDraft || !key) return;
        if (!ProductLibraryModule.state.salesVariationDraft.colors || typeof ProductLibraryModule.state.salesVariationDraft.colors !== 'object') {
            ProductLibraryModule.state.salesVariationDraft.colors = {};
        }
        const current = ProductLibraryModule.state.salesVariationDraft.colors[key] || { category: '', color: '' };
        const normalizedCategory = (typeof SalesModule !== 'undefined' && SalesModule && typeof SalesModule.normalizeCatalogColorType === 'function')
            ? SalesModule.normalizeCatalogColorType(value || '')
            : ProductLibraryModule.normalizeColorType(value || '');
        ProductLibraryModule.state.salesVariationDraft.colors[key] = {
            ...current,
            category: normalizedCategory,
            color: ''
        };
        UI.renderCurrentPage();
    },

    setSalesVariationColorValue: (field, value) => {
        const key = String(field || '').trim();
        if (!ProductLibraryModule.state.salesVariationDraft || !key) return;
        if (!ProductLibraryModule.state.salesVariationDraft.colors || typeof ProductLibraryModule.state.salesVariationDraft.colors !== 'object') {
            ProductLibraryModule.state.salesVariationDraft.colors = {};
        }
        const current = ProductLibraryModule.state.salesVariationDraft.colors[key] || { category: '', color: '' };
        ProductLibraryModule.state.salesVariationDraft.colors[key] = {
            ...current,
            color: String(value || '').trim()
        };
    },

    setSalesVariationBubble: (value) => {
        if (!ProductLibraryModule.state.salesVariationDraft) return;
        ProductLibraryModule.state.salesVariationDraft.bubble = String(value || '').trim() === 'var' ? 'var' : 'yok';
        UI.renderCurrentPage();
    },

    setSalesVariationDiameter: (value) => {
        if (!ProductLibraryModule.state.salesVariationDraft) return;
        ProductLibraryModule.state.salesVariationDraft.selectedDiameter = String(value || '').trim();
        UI.renderCurrentPage();
    },

    setSalesVariationLowerTubeMm: (value) => {
        if (!ProductLibraryModule.state.salesVariationDraft) return;
        ProductLibraryModule.state.salesVariationDraft.lowerTubeLengthMm = String(value ?? '');
    },

    addSalesVariationMasterRef: () => {
        if (!ProductLibraryModule.state.salesVariationDraft) return;
        ProductLibraryModule.state.masterPickerSource = 'sales-variation';
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.masterFormOpen = false;
        ProductLibraryModule.state.masterEditingId = null;
        ProductLibraryModule.state.workspaceView = 'master';
        UI.renderCurrentPage();
    },

    removeSalesVariationMasterRef: (id) => {
        if (!ProductLibraryModule.state.salesVariationDraft) return;
        const list = Array.isArray(ProductLibraryModule.state.salesVariationDraft.masterRefs)
            ? ProductLibraryModule.state.salesVariationDraft.masterRefs
            : [];
        ProductLibraryModule.state.salesVariationDraft.masterRefs = list.filter((item) => String(item?.id || '') !== String(id || ''));
        UI.renderCurrentPage();
    },

    setSalesVariationMasterQty: (id, value) => {
        if (!ProductLibraryModule.state.salesVariationDraft) return;
        const list = Array.isArray(ProductLibraryModule.state.salesVariationDraft.masterRefs)
            ? ProductLibraryModule.state.salesVariationDraft.masterRefs
            : [];
        const target = list.find((item) => String(item?.id || '') === String(id || ''));
        if (!target) return;
        target.qty = Math.max(1, Number(String(value || '').replace(',', '.')) || 1);
    },

    addSalesVariationComponentItem: () => {
        if (!ProductLibraryModule.state.salesVariationDraft) return;
        ProductLibraryModule.state.masterPickerSource = '';
        ProductLibraryModule.state.componentPickerSource = 'sales-variation-component';
        ProductLibraryModule.state.salesVariationComponentPickerRowId = '';
        ProductLibraryModule.state.componentLibraryKind = 'PART';
        ProductLibraryModule.state.componentViewingId = null;
        ProductLibraryModule.state.componentFormOpen = false;
        ProductLibraryModule.state.workspaceView = 'components';
        UI.renderCurrentPage();
    },

    editSalesVariationComponentItem: (id) => {
        if (!ProductLibraryModule.state.salesVariationDraft) return;
        const rowId = String(id || '').trim();
        if (!rowId) return;
        ProductLibraryModule.state.masterPickerSource = '';
        ProductLibraryModule.state.componentPickerSource = 'sales-variation-component-row';
        ProductLibraryModule.state.salesVariationComponentPickerRowId = rowId;
        ProductLibraryModule.state.componentLibraryKind = 'PART';
        ProductLibraryModule.state.componentViewingId = null;
        ProductLibraryModule.state.componentFormOpen = false;
        ProductLibraryModule.state.workspaceView = 'components';
        UI.renderCurrentPage();
    },

    selectSalesVariationMaster: (id) => {
        const record = ProductLibraryModule.getMasterProductById(id);
        if (!record || !ProductLibraryModule.state.salesVariationDraft) return;
        const code = String(record.code || '').trim().toUpperCase();
        if (!code) {
            alert('Secilen kayitta master urun kodu bulunamadi.');
            return;
        }
        const list = Array.isArray(ProductLibraryModule.state.salesVariationDraft.masterRefs)
            ? ProductLibraryModule.state.salesVariationDraft.masterRefs
            : [];
        if (list.some((item) => String(item?.code || '').trim().toUpperCase() === code)) {
            alert('Bu master urun zaten listede var.');
            return;
        }
        list.push({
            id: crypto.randomUUID(),
            refId: String(record.id || '').trim(),
            code,
            name: String(record.name || '').trim(),
            qty: 1
        });
        ProductLibraryModule.state.salesVariationDraft.masterRefs = list;
        ProductLibraryModule.state.masterPickerSource = '';
        ProductLibraryModule.state.workspaceView = 'sales-products';
        UI.renderCurrentPage();
    },

    selectSalesVariationComponent: (id) => {
        const row = ProductLibraryModule.getComponentCardById(id);
        if (!row || !ProductLibraryModule.state.salesVariationDraft) return;
        const source = String(ProductLibraryModule.state.componentPickerSource || '').trim();
        const editingRowId = source === 'sales-variation-component-row'
            ? String(ProductLibraryModule.state.salesVariationComponentPickerRowId || '').trim()
            : '';
        const code = String(row.code || '').trim().toUpperCase();
        if (!code) {
            alert('Secilen kayitta parca/bilesen kodu bulunamadi.');
            return;
        }
        const list = Array.isArray(ProductLibraryModule.state.salesVariationDraft.componentItems)
            ? ProductLibraryModule.state.salesVariationDraft.componentItems
            : [];
        const duplicate = list.some((item) => {
            const sameCode = String(item?.code || '').trim().toUpperCase() === code;
            if (!sameCode) return false;
            if (!editingRowId) return true;
            return String(item?.id || '').trim() !== editingRowId;
        });
        if (duplicate) {
            alert('Bu parca/bilesen zaten listede var.');
            return;
        }
        if (editingRowId) {
            const target = list.find((item) => String(item?.id || '').trim() === editingRowId);
            if (target) {
                target.refId = String(row.id || '').trim();
                target.code = code;
                target.name = String(row.name || '').trim();
            } else {
                list.push({
                    id: crypto.randomUUID(),
                    refId: String(row.id || '').trim(),
                    code,
                    name: String(row.name || '').trim(),
                    qty: 1
                });
            }
        } else {
            list.push({
                id: crypto.randomUUID(),
                refId: String(row.id || '').trim(),
                code,
                name: String(row.name || '').trim(),
                qty: 1
            });
        }
        ProductLibraryModule.state.salesVariationDraft.componentItems = list;
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.salesVariationComponentPickerRowId = '';
        ProductLibraryModule.state.workspaceView = 'sales-products';
        UI.renderCurrentPage();
    },

    openSalesVariationLinkedRecord: (kind, refId = '', code = '') => {
        const type = String(kind || '').trim().toLowerCase();
        const normalizedRefId = String(refId || '').trim();
        const normalizedCode = String(code || '').trim().toUpperCase();

        if (type === 'master') {
            let target = normalizedRefId ? ProductLibraryModule.getMasterProductById(normalizedRefId) : null;
            if (!target && normalizedCode) {
                target = ProductLibraryModule.getMasterProducts().find((row) =>
                    String(row?.code || '').trim().toUpperCase() === normalizedCode
                ) || null;
            }
            if (!target) return alert('Bagli master urun kaydi bulunamadi.');
            const summaryHtml = `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.55rem;">
                    <div><div style="font-size:0.72rem; color:#64748b;">urun adi</div><div style="font-weight:700; color:#111827;">${ProductLibraryModule.escapeHtml(target.name || '-')}</div></div>
                    <div><div style="font-size:0.72rem; color:#64748b;">kategori</div><div style="font-weight:700; color:#111827;">${ProductLibraryModule.escapeHtml(target.categoryName || '-')}</div></div>
                    <div><div style="font-size:0.72rem; color:#64748b;">ID kod</div><div style="font-weight:700; font-family:monospace; color:#0f172a;">${ProductLibraryModule.escapeHtml(target.code || '-')}</div></div>
                    <div><div style="font-size:0.72rem; color:#64748b;">olcu / birim</div><div style="font-weight:700; color:#111827;">${ProductLibraryModule.escapeHtml([target.unitAmount, target.unitAmountType].filter(Boolean).join(' ') || target.unit || '-')}</div></div>
                    <div style="grid-column:1 / -1;"><div style="font-size:0.72rem; color:#64748b;">not</div><div style="color:#334155; white-space:pre-wrap;">${ProductLibraryModule.escapeHtml(target.note || 'Not bulunmuyor.')}</div></div>
                </div>`;
            if (typeof Modal !== 'undefined' && Modal && typeof Modal.open === 'function') {
                Modal.open('Master urun bilgisi', summaryHtml, { maxWidth: '560px' });
            } else {
                alert(`${target.name || 'Master urun'}\n${target.code || ''}`.trim());
            }
            return;
        }

        if (type === 'component') {
            let target = normalizedRefId
                ? (ProductLibraryModule.getComponentCardById(normalizedRefId) || ProductLibraryModule.getSemiFinishedCardById(normalizedRefId))
                : null;
            let libraryKind = ProductLibraryModule.getSemiFinishedCardById(String(target?.id || '')) ? 'SEMI' : 'PART';
            if (!target && normalizedCode) {
                const partHit = ProductLibraryModule.getComponentCardsByKind('PART').find((row) =>
                    String(row?.code || '').trim().toUpperCase() === normalizedCode
                ) || null;
                const semiHit = ProductLibraryModule.getComponentCardsByKind('SEMI').find((row) =>
                    String(row?.code || '').trim().toUpperCase() === normalizedCode
                ) || null;
                target = partHit || semiHit || null;
                libraryKind = semiHit ? 'SEMI' : 'PART';
            }
            if (!target) return alert('Bagli parca/bilesen kaydi bulunamadi.');
            const routes = Array.isArray(target?.routes) ? target.routes : [];
            const files = Array.isArray(target?.attachments) ? target.attachments : [];
            const unitMap = ProductLibraryModule.getRouteStationMap();
            const routeRows = routes.length === 0
                ? '<tr><td colspan="4" style="padding:0.6rem; color:#94a3b8;">Rota tanimli degil.</td></tr>'
                : routes.map((r, idx) => `
                    <tr style="border-bottom:1px solid #f1f5f9;">
                        <td style="padding:0.45rem;">${idx + 1}</td>
                        <td style="padding:0.45rem;">${ProductLibraryModule.escapeHtml(unitMap[r?.stationId] || r?.stationId || '-')}</td>
                        <td style="padding:0.45rem; font-family:monospace; color:#334155;">${ProductLibraryModule.escapeHtml(ProductLibraryModule.getRouteProcessDisplayValue(r) || '-')}</td>
                        <td style="padding:0.45rem; color:#334155; font-weight:700;">${ProductLibraryModule.escapeHtml(ProductLibraryModule.getRouteProcessName(r) || '-')}</td>
                    </tr>
                `).join('');
            const summaryHtml = `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.55rem;">
                    <div><div style="font-size:0.72rem; color:#64748b;">urun adi</div><div style="font-weight:700; color:#111827;">${ProductLibraryModule.escapeHtml(target.name || '-')}</div></div>
                    <div><div style="font-size:0.72rem; color:#64748b;">kutuphane</div><div style="font-weight:700; color:#111827;">${libraryKind === 'SEMI' ? 'Yari Mamul' : 'Parca ve Bilesen'}</div></div>
                    <div><div style="font-size:0.72rem; color:#64748b;">kategori</div><div style="font-weight:700; color:#111827;">${ProductLibraryModule.escapeHtml(target.group || '-')}</div></div>
                    <div><div style="font-size:0.72rem; color:#64748b;">renk</div><div style="font-weight:700; color:#111827;">${ProductLibraryModule.escapeHtml(target.subGroup || '-')}</div></div>
                    <div><div style="font-size:0.72rem; color:#64748b;">ID kod</div><div style="font-weight:700; font-family:monospace; color:#0f172a;">${ProductLibraryModule.escapeHtml(target.code || '-')}</div></div>
                    <div><div style="font-size:0.72rem; color:#64748b;">bagli master kod</div><div style="font-weight:700; font-family:monospace; color:#0f172a;">${ProductLibraryModule.escapeHtml(target.masterCode || '-')}</div></div>
                    <div><div style="font-size:0.72rem; color:#64748b;">dosya sayisi</div><div style="font-weight:700; color:#111827;">${String(files.length)}</div></div>
                    <div><div style="font-size:0.72rem; color:#64748b;">rota adimi</div><div style="font-weight:700; color:#111827;">${String(routes.length)}</div></div>
                    <div style="grid-column:1 / -1;"><div style="font-size:0.72rem; color:#64748b;">not</div><div style="color:#334155; white-space:pre-wrap;">${ProductLibraryModule.escapeHtml(target.note || 'Not bulunmuyor.')}</div></div>
                </div>
                <div style="margin-top:0.75rem;">
                    <div style="font-size:0.78rem; color:#64748b; margin-bottom:0.28rem;">rota</div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.6rem; overflow:auto;">
                        <table style="width:100%; border-collapse:collapse; min-width:560px;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; background:#f8fafc; color:#64748b; font-size:0.73rem; text-transform:uppercase;">
                                    <th style="padding:0.45rem; text-align:left;">Sira</th>
                                    <th style="padding:0.45rem; text-align:left;">Istasyon</th>
                                    <th style="padding:0.45rem; text-align:left;">Islem ID</th>
                                    <th style="padding:0.45rem; text-align:left;">Islem adi</th>
                                </tr>
                            </thead>
                            <tbody>${routeRows}</tbody>
                        </table>
                    </div>
                </div>
            `;
            if (typeof Modal !== 'undefined' && Modal && typeof Modal.open === 'function') {
                Modal.open('Parca / Bilesen bilgisi', summaryHtml, { maxWidth: '900px' });
            } else {
                alert(`${target.name || 'Parca/bilesen'}\n${target.code || ''}`.trim());
            }
        }
    },

    openSalesVariationMontagePicker: () => {
        const unitId = UnitModule?.state?.activeUnitId || 'u3';
        if (typeof MontageLibraryModule !== 'undefined') {
            MontageLibraryModule.state.pickerContext = { source: 'sales-variation' };
        }
        if (typeof UnitModule !== 'undefined' && UnitModule && typeof UnitModule.openMontageLibrary === 'function') {
            if (typeof Router !== 'undefined' && Router && typeof Router.navigate === 'function') {
                Router.navigate('units', { fromBack: true });
            }
            UnitModule.openMontageLibrary(unitId, { preserveState: true });
            UI.renderCurrentPage();
            return;
        }
        alert('Montaj kutuphanesi acilamadi.');
    },

    removeSalesVariationComponentItem: (id) => {
        if (!ProductLibraryModule.state.salesVariationDraft) return;
        const list = Array.isArray(ProductLibraryModule.state.salesVariationDraft.componentItems)
            ? ProductLibraryModule.state.salesVariationDraft.componentItems
            : [];
        ProductLibraryModule.state.salesVariationDraft.componentItems = list.filter((item) => String(item?.id || '') !== String(id || ''));
        UI.renderCurrentPage();
    },

    setSalesVariationComponentQty: (id, value) => {
        if (!ProductLibraryModule.state.salesVariationDraft) return;
        const list = Array.isArray(ProductLibraryModule.state.salesVariationDraft.componentItems)
            ? ProductLibraryModule.state.salesVariationDraft.componentItems
            : [];
        const target = list.find((item) => String(item?.id || '') === String(id || ''));
        if (!target) return;
        target.qty = Math.max(1, Number(String(value || '').replace(',', '.')) || 1);
    },

    handleSalesVariationExplodedFiles: (input) => {
        if (!ProductLibraryModule.state.salesVariationDraft) return;
        const files = Array.from(input?.files || []);
        if (!files.length) return;
        const readers = files.map((file) => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
                name: String(file?.name || 'dosya').trim() || 'dosya',
                type: String(file?.type || '').trim(),
                size: Number(file?.size || 0),
                data: String(reader.result || '')
            });
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        }));
        Promise.all(readers).then((loaded) => {
            const valid = loaded.filter((item) => item && item.data);
            if (!Array.isArray(ProductLibraryModule.state.salesVariationDraft.explodedFiles)) {
                ProductLibraryModule.state.salesVariationDraft.explodedFiles = [];
            }
            ProductLibraryModule.state.salesVariationDraft.explodedFiles.push(...valid);
            UI.renderCurrentPage();
        });
    },

    removeSalesVariationExplodedFile: (index) => {
        if (!ProductLibraryModule.state.salesVariationDraft) return;
        const list = Array.isArray(ProductLibraryModule.state.salesVariationDraft.explodedFiles)
            ? ProductLibraryModule.state.salesVariationDraft.explodedFiles
            : [];
        list.splice(Number(index) || 0, 1);
        ProductLibraryModule.state.salesVariationDraft.explodedFiles = list;
        UI.renderCurrentPage();
    },

    saveSalesVariation: async (asCopy = false) => {
        ProductLibraryModule.ensureSalesVariationDefaults();
        const sourceProductId = String(ProductLibraryModule.state.salesProductDetailId || '').trim();
        const sourceProduct = ProductLibraryModule.getSalesCatalogProductById(sourceProductId);
        if (!sourceProduct) return alert('Kaynak urun bulunamadi.');
        const draft = ProductLibraryModule.state.salesVariationDraft;
        if (!draft || typeof draft !== 'object') return;

        const store = Array.isArray(DB.data?.data?.salesProductVariants) ? DB.data.data.salesProductVariants : [];
        const editingId = String(ProductLibraryModule.state.salesVariationEditingId || draft.id || '').trim();
        const mode = String(ProductLibraryModule.state.salesVariationEditorMode || '').trim();
        const isCreate = asCopy || mode === 'create' || !editingId;
        const normalizedCode = (() => {
            // "Farkli Kaydet" her zaman yeni bir varyasyon kodu uretmeli.
            // Eski satiri dislamak burada ayni kodu tekrar uretebiliyordu (ornek: 2015-001).
            if (asCopy) return ProductLibraryModule.generateSalesVariantCode(sourceProduct);
            return String(draft.variantCode || '').trim().toUpperCase();
        })();
        if (!normalizedCode) return alert('Varyasyon ID zorunlu.');
        const duplicate = store.find((row) => {
            if (String(row?.sourceCatalogProductId || '').trim() !== sourceProductId) return false;
            if (!isCreate && String(row?.id || '').trim() === editingId) return false;
            return String(row?.variantCode || '').trim().toUpperCase() === normalizedCode;
        });
        if (duplicate) return alert(`Bu varyasyon ID zaten var: ${normalizedCode}`);

        const lowerTubeText = String(draft.lowerTubeLengthMm ?? '').trim() || 'standart';

        const normalizeColorBlock = (block) => {
            const raw = block && typeof block === 'object' ? block : {};
            const category = (typeof SalesModule !== 'undefined' && SalesModule && typeof SalesModule.normalizeCatalogColorType === 'function')
                ? SalesModule.normalizeCatalogColorType(raw?.category || '')
                : ProductLibraryModule.normalizeColorType(raw?.category || '');
            const color = String(raw?.color || '').trim();
            return { category, color };
        };

        const now = new Date().toISOString();
        const id = isCreate ? crypto.randomUUID() : editingId;
        const idx = isCreate ? -1 : store.findIndex((row) => String(row?.id || '').trim() === editingId);
        const prev = idx >= 0 ? store[idx] : null;
        const savedRow = {
            id,
            scope: 'sales-library',
            sourceCatalogProductId: sourceProductId,
            sourceCatalogIdCode: String(sourceProduct?.idCode || '').trim().toUpperCase(),
            sourceCatalogProductCode: String(sourceProduct?.productCode || '').trim().toUpperCase(),
            sourceCatalogCategoryId: String(sourceProduct?.categoryId || '').trim(),
            sourceCatalogName: String(sourceProduct?.name || '').trim(),
            variantCode: normalizedCode,
            productName: String(draft.productName || sourceProduct?.name || '').trim(),
            bubble: String(draft.bubble || 'yok').trim() === 'var' ? 'var' : 'yok',
            selectedDiameter: String(draft.selectedDiameter || '').trim(),
            lowerTubeLengthMm: lowerTubeText,
            colors: {
                accessory: normalizeColorBlock(draft.colors?.accessory),
                tube: normalizeColorBlock(draft.colors?.tube),
                plexi: normalizeColorBlock(draft.colors?.plexi)
            },
            montageCard: String(draft.montageCardCode || '').trim()
                ? { cardCode: String(draft.montageCardCode || '').trim().toUpperCase(), productCode: '', productName: '' }
                : null,
            masterRefs: (Array.isArray(draft.masterRefs) ? draft.masterRefs : []).map((item) => ({ id: String(item?.id || crypto.randomUUID()), refId: String(item?.refId || '').trim(), code: String(item?.code || '').trim().toUpperCase(), name: String(item?.name || '').trim(), qty: Math.max(1, Number(item?.qty || 1)) })).filter((item) => item.code),
            items: (Array.isArray(draft.componentItems) ? draft.componentItems : []).map((item) => ({ id: String(item?.id || crypto.randomUUID()), refId: String(item?.refId || '').trim(), code: String(item?.code || '').trim().toUpperCase(), name: String(item?.name || '').trim(), qty: Math.max(1, Number(item?.qty || 1)) })).filter((item) => item.code),
            explodedFiles: (Array.isArray(draft.explodedFiles) ? draft.explodedFiles : []).map((file) => ({ name: String(file?.name || 'dosya').trim() || 'dosya', type: String(file?.type || '').trim(), size: Number(file?.size || 0), data: String(file?.data || '') })).filter((file) => file.data),
            note: String(draft.note || '').trim(),
            created_at: String(prev?.created_at || now),
            updated_at: now
        };
        const productionStatus = ProductLibraryModule.getSalesVariationProductionStatus(savedRow);
        savedRow.productionReady = productionStatus.ready;

        if (idx >= 0 && !isCreate) store[idx] = savedRow;
        else store.push(savedRow);

        await DB.save();
        ProductLibraryModule.state.salesVariationEditorMode = '';
        ProductLibraryModule.state.salesVariationEditingId = '';
        ProductLibraryModule.state.salesVariationDraft = null;
        ProductLibraryModule.state.salesVariationComponentPickerRowId = '';
        UI.renderCurrentPage();
        alert(asCopy ? `Yeni varyasyon olusturuldu: ${normalizedCode}` : (isCreate ? 'Yeni varyasyon olusturuldu.' : 'Varyasyon guncellendi.'));
    },

    deleteSalesVariation: async () => {
        ProductLibraryModule.ensureSalesVariationDefaults();
        const editingId = String(ProductLibraryModule.state.salesVariationEditingId || '').trim();
        if (!editingId) return;
        if (!confirm('Bu varyasyon silinsin mi?')) return;
        const store = Array.isArray(DB.data?.data?.salesProductVariants) ? DB.data.data.salesProductVariants : [];
        DB.data.data.salesProductVariants = store.filter((row) => String(row?.id || '').trim() !== editingId);
        await DB.save();
        ProductLibraryModule.state.salesVariationEditorMode = '';
        ProductLibraryModule.state.salesVariationEditingId = '';
        ProductLibraryModule.state.salesVariationDraft = null;
        ProductLibraryModule.state.salesVariationComponentPickerRowId = '';
        UI.renderCurrentPage();
        alert('Varyasyon silindi.');
    },

    renderSalesVariationColorField: (field, label, draft, readOnly = false) => {
        const key = String(field || '').trim();
        const colorRow = draft?.colors?.[key] || { category: '', color: '' };
        const category = String(colorRow?.category || '').trim();
        const color = String(colorRow?.color || '').trim();
        const categoryOptions = (typeof SalesModule !== 'undefined' && SalesModule && typeof SalesModule.getCatalogColorCategoryOptions === 'function')
            ? SalesModule.getCatalogColorCategoryOptions(key)
            : ProductLibraryModule.getColorTypeOptions().map((opt) => ({ value: opt.id, label: opt.label }));
        const colorOptions = (typeof SalesModule !== 'undefined' && SalesModule && typeof SalesModule.getCatalogColorOptions === 'function')
            ? SalesModule.getCatalogColorOptions(key, category)
            : [];

        if (readOnly) {
            const labelMap = new Map((typeof SalesModule !== 'undefined' && SalesModule && typeof SalesModule.getCatalogColorTypeMetaOptions === 'function')
                ? SalesModule.getCatalogColorTypeMetaOptions().map((item) => [String(item?.value || ''), String(item?.label || '')])
                : []);
            return `
                <div>
                    <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">${ProductLibraryModule.escapeHtml(label)}</label>
                    <div style="display:grid; grid-template-columns:42% 58%; gap:0.35rem;">
                        <input readonly value="${ProductLibraryModule.escapeHtml(labelMap.get(category) || category || '-')}" style="height:38px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.6rem; background:#f8fafc; color:#64748b;">
                        <input readonly value="${ProductLibraryModule.escapeHtml(color || '-')}" style="height:38px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.6rem; background:#f8fafc; color:#334155;">
                    </div>
                </div>
            `;
        }
        return `
            <div>
                <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">${ProductLibraryModule.escapeHtml(label)}</label>
                <div style="display:grid; grid-template-columns:42% 58%; gap:0.35rem;">
                    <select onchange="ProductLibraryModule.setSalesVariationColorCategory('${ProductLibraryModule.escapeHtml(key)}', this.value)" style="height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.6rem; font-weight:700;">
                        <option value="">kategori sec</option>
                        ${categoryOptions.map((item) => {
            const value = String(item?.value || '').trim();
            const text = String(item?.label || value || '').trim();
            return `<option value="${ProductLibraryModule.escapeHtml(value)}" ${value === category ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(text)}</option>`;
        }).join('')}
                    </select>
                    <select ${category ? '' : 'disabled'} onchange="ProductLibraryModule.setSalesVariationColorValue('${ProductLibraryModule.escapeHtml(key)}', this.value)" style="height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.6rem; font-weight:700; color:${category ? '#111827' : '#94a3b8'};">
                        <option value="">renk sec</option>
                        ${colorOptions.map((name) => {
            const option = String(name || '').trim();
            return `<option value="${ProductLibraryModule.escapeHtml(option)}" ${option === color ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(option)}</option>`;
        }).join('')}
                    </select>
                </div>
            </div>
        `;
    },

    renderSalesVariationEditorPanel: (product) => {
        const mode = String(ProductLibraryModule.state.salesVariationEditorMode || '').trim();
        const draft = ProductLibraryModule.state.salesVariationDraft;
        if (!mode || !draft) return '';
        const readOnly = mode === 'view';
        const sourceProduct = product && typeof product === 'object' ? product : {};
        const diameters = Array.isArray(sourceProduct?.diameters)
            ? sourceProduct.diameters.map((value) => String(value || '').trim()).filter(Boolean)
            : [];
        const diameterOptions = diameters.length > 0
            ? diameters
            : [String(sourceProduct?.selectedDiameter || '').trim()].filter(Boolean);
        const explodedFiles = Array.isArray(draft?.explodedFiles) ? draft.explodedFiles : [];
        const masterRefs = Array.isArray(draft?.masterRefs) ? draft.masterRefs : [];
        const componentItems = Array.isArray(draft?.componentItems) ? draft.componentItems : [];
        const categoryPath = (typeof SalesModule !== 'undefined' && SalesModule && typeof SalesModule.getCatalogCategoryPathText === 'function')
            ? SalesModule.getCatalogCategoryPathText(sourceProduct?.categoryId || '')
            : String(sourceProduct?.categoryId || '').trim();
        const productImage = String(sourceProduct?.images?.product || sourceProduct?.images?.application || '').trim();
        const technicalImage = String(sourceProduct?.images?.technical || '').trim();
        const statusCode = String(sourceProduct?.idCode || sourceProduct?.productCode || '-').trim();
        const isSalesEntry = String(ProductLibraryModule.state.salesProductEntrySource || '').trim().toLowerCase() === 'sales';

        return `
            <div class="card-table" style="padding:1.2rem; margin-top:0.95rem; border:1.5px solid #111827; border-radius:1rem;">
                <style>
                    .svx-grid{display:grid; gap:1rem;}
                    .svx-top{grid-template-columns:minmax(420px,1.08fr) minmax(420px,1fr);}
                    .svx-bottom{grid-template-columns:minmax(460px,1fr) minmax(280px,0.62fr);}
                    .svx-soft{border:1px solid #d4dbe7; border-radius:0.85rem; background:#fff;}
                    .svx-orange{border:1px solid #cbd5e1; border-radius:0.75rem; padding:0.35rem 0.45rem;}
                    .svx-label{display:block; font-size:0.73rem; color:#475569; margin-bottom:0.2rem; font-weight:700;}
                    .svx-input{width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.62rem; font-weight:700;}
                    .svx-input[readonly], .svx-input:disabled{background:#f8fafc; color:#64748b;}
                    .svx-chip{height:30px; border:1px solid #cbd5e1; border-radius:999px; padding:0 0.62rem; background:white; font-size:0.78rem; font-weight:800;}
                    .svx-chip.is-active{border-color:#16a34a; background:#dcfce7; color:#166534;}
                    .svx-row{display:grid; gap:0.35rem; align-items:center;}
                    .svx-row.master{grid-template-columns:28px 1fr 68px 56px 56px;}
                    .svx-row.comp{grid-template-columns:28px 1fr 72px 56px 56px;}
                    .svx-mini{height:30px; border:1px solid #cbd5e1; border-radius:0.5rem; padding:0 0.3rem; background:white; font-size:0.75rem; text-align:center; font-weight:700; -moz-appearance:textfield; appearance:textfield;}
                    .svx-mini::-webkit-outer-spin-button,
                    .svx-mini::-webkit-inner-spin-button{-webkit-appearance:none; margin:0;}
                    .svx-mini[readonly]{background:#f8fafc; color:#64748b;}
                    .svx-note{max-width:62%;}
                    @media (max-width: 1260px){
                        .svx-top,.svx-bottom{grid-template-columns:1fr;}
                        .svx-note{max-width:100%;}
                    }
                </style>

                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.8rem; margin-bottom:0.85rem;">
                    <div>
                        <div style="font-size:1.75rem; font-weight:900; color:#111827; line-height:1;">Urun karti detay</div>
                        <div style="margin-top:0.45rem; display:inline-flex; align-items:center; border:1px solid #cbd5e1; border-radius:0.65rem; padding:0.26rem 0.5rem; font-size:0.76rem; font-weight:800; color:#334155;">${ProductLibraryModule.escapeHtml(categoryPath || '-')}</div>
                    </div>
                    <button class="btn-sm" onclick="ProductLibraryModule.closeSalesVariationEditor()" style="min-width:36px;">x</button>
                </div>

                <div class="svx-grid svx-top">
                    <div class="svx-soft" style="padding:0.35rem; min-height:390px;">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.35rem; height:100%;">
                            <div style="border:1px solid #e2e8f0; border-radius:0.8rem; overflow:hidden; min-height:380px; background:${productImage ? '#0f172a' : '#f8fafc'}; display:flex; align-items:center; justify-content:center;">
                                ${productImage
                ? `<img src="${ProductLibraryModule.escapeHtml(productImage)}" alt="${ProductLibraryModule.escapeHtml(sourceProduct?.name || 'Urun')}" style="width:100%; height:100%; object-fit:cover;">`
                : '<div style="font-weight:800; color:#94a3b8;">Urun resmi yok</div>'}
                            </div>
                            <div style="border:1px solid #e2e8f0; border-radius:0.8rem; overflow:hidden; min-height:380px; background:${technicalImage ? '#fff' : '#f8fafc'}; display:flex; align-items:center; justify-content:center;">
                                ${technicalImage
                ? `<img src="${ProductLibraryModule.escapeHtml(technicalImage)}" alt="Teknik resim" style="width:100%; height:100%; object-fit:contain; background:white;">`
                : '<div style="font-weight:800; color:#94a3b8;">Teknik resim yok</div>'}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div style="display:grid; grid-template-columns:1fr 184px; gap:0.9rem; align-items:end; margin-bottom:0.35rem;">
                            <div>
                                <div style="font-size:3.05rem; line-height:1; font-weight:900; color:#111827; letter-spacing:-0.02em;">${ProductLibraryModule.escapeHtml(draft.productName || sourceProduct?.name || '-')}</div>
                                <div style="margin-top:0.28rem; display:flex; align-items:center; gap:0.6rem; border-bottom:1px solid #e2e8f0; padding-bottom:0.28rem;">
                                    <div style="font-size:1.95rem; font-weight:900; color:#ef4444; line-height:1;">${ProductLibraryModule.escapeHtml(statusCode)}</div>
                                    <div style="font-size:0.93rem; color:#334155; font-weight:800;">ID: ${ProductLibraryModule.escapeHtml(draft.variantCode || '-')}</div>
                                </div>
                            </div>
                            <div>
                                <label class="svx-label">Varyasyon ID</label>
                                <input class="svx-input" readonly value="${ProductLibraryModule.escapeHtml(draft.variantCode || '-')}" />
                            </div>
                        </div>

                        <div class="svx-orange">${ProductLibraryModule.renderSalesVariationColorField('accessory', 'Aksesuar rengi', draft, readOnly)}</div>
                        <div class="svx-orange" style="margin-top:0.34rem;">${ProductLibraryModule.renderSalesVariationColorField('tube', 'Boru rengi', draft, readOnly)}</div>
                        <div class="svx-orange" style="margin-top:0.34rem;">${ProductLibraryModule.renderSalesVariationColorField('plexi', 'Pleksi rengi', draft, readOnly)}</div>

                        <div style="display:grid; grid-template-columns:122px 1fr; gap:0.65rem; margin-top:0.34rem;">
                            <div class="svx-orange">
                                <label class="svx-label">Kabarcik</label>
                                <div style="display:flex; gap:0.35rem;">
                                    <button type="button" ${readOnly ? 'disabled' : ''} onclick="ProductLibraryModule.setSalesVariationBubble('var')" class="svx-chip ${draft.bubble === 'var' ? 'is-active' : ''}">var</button>
                                    <button type="button" ${readOnly ? 'disabled' : ''} onclick="ProductLibraryModule.setSalesVariationBubble('yok')" class="svx-chip ${draft.bubble === 'yok' ? 'is-active' : ''}">yok</button>
                                </div>
                            </div>
                            <div>
                                <div class="svx-orange">
                                    <label class="svx-label">Cap</label>
                                    <div style="display:flex; flex-wrap:wrap; gap:0.35rem;">
                                        ${diameterOptions.length > 0 ? diameterOptions.map((dia) => {
                const value = String(dia || '').trim();
                const active = value === String(draft.selectedDiameter || '').trim();
                return `<button type="button" ${readOnly ? 'disabled' : ''} onclick="ProductLibraryModule.setSalesVariationDiameter('${ProductLibraryModule.escapeHtml(value)}')" class="svx-chip ${active ? 'is-active' : ''}">Ø ${ProductLibraryModule.escapeHtml(value)}</button>`;
            }).join('') : '<span style="font-size:0.8rem; color:#94a3b8;">Cap bilgisi yok</span>'}
                                    </div>
                                </div>
                                <div class="svx-orange" style="margin-top:0.34rem;">
                                    <label class="svx-label">Alt boru uzunlugu (Standart / mm)</label>
                                    <input ${readOnly ? 'readonly' : ''} class="svx-input" type="text" value="${ProductLibraryModule.escapeHtml(draft.lowerTubeLengthMm || 'standart')}" oninput="ProductLibraryModule.setSalesVariationLowerTubeMm(this.value)" placeholder="standart veya 220 mm">
                                </div>
                            </div>
                        </div>

                        ${isSalesEntry ? '' : `
                            <div style="margin-top:0.44rem;">
                                <label class="svx-label">Montaj Islem Karti</label>
                                <div style="display:grid; grid-template-columns:1fr 84px 58px; gap:0.35rem;">
                                    <input ${readOnly ? 'readonly' : ''} class="svx-input" value="${ProductLibraryModule.escapeHtml(draft.montageCardCode || '')}" oninput="ProductLibraryModule.setSalesVariationDraftField('montageCardCode', this.value.toUpperCase())" placeholder="montaj karti secilmedi">
                                    <button class="btn-sm" type="button" onclick="ProductLibraryModule.openSalesVariationMontagePicker()" style="${String(draft.montageCardCode || '').trim() ? 'background:#ecfdf5; border-color:#86efac; color:#166534;' : ''}">goruntule</button>
                                    ${readOnly
                ? '<button class="btn-sm" type="button" disabled>sil</button>'
                : '<button class="btn-sm" type="button" onclick="ProductLibraryModule.setSalesVariationDraftField(\'montageCardCode\', \'\'); UI.renderCurrentPage();">sil</button>'}
                                </div>
                            </div>

                            <div style="margin-top:0.55rem;">
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem;">
                                    <label class="svx-label" style="margin:0;">Master Urun Kutuphanesi</label>
                                    ${readOnly ? '' : '<button class="btn-primary" type="button" onclick="ProductLibraryModule.addSalesVariationMasterRef()" style="height:28px; padding:0 0.55rem;">master urun ekle +</button>'}
                                </div>
                                <div style="margin-top:0.25rem; display:flex; flex-direction:column; gap:0.25rem;">
                                    ${masterRefs.length === 0
                ? '<div style="font-size:0.8rem; color:#94a3b8; border:1px dashed #cbd5e1; border-radius:0.55rem; padding:0.45rem;">Bu varyanta bagli master urun yok.</div>'
                : masterRefs.map((item, idx) => `
                                            <div class="svx-row master">
                                                <div style="font-size:0.74rem; color:#64748b;">${idx + 1}</div>
                                                <div style="border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.28rem 0.4rem;">
                                                    <button type="button" onclick="ProductLibraryModule.openSalesVariationLinkedRecord('master', '${ProductLibraryModule.escapeHtml(item?.refId || '')}', '${ProductLibraryModule.escapeHtml(item?.code || '')}')" style="font-size:0.74rem; font-weight:800; color:#1d4ed8; font-family:monospace; background:none; border:none; padding:0; cursor:pointer; text-align:left;">${ProductLibraryModule.escapeHtml(item?.code || '-')}</button>
                                                    <div style="font-size:0.71rem; color:#64748b;">${ProductLibraryModule.escapeHtml(item?.name || '-')}</div>
                                                </div>
                                                <button class="btn-sm" type="button" onclick="ProductLibraryModule.openSalesVariationLinkedRecord('master', '${ProductLibraryModule.escapeHtml(item?.refId || '')}', '${ProductLibraryModule.escapeHtml(item?.code || '')}')" style="height:30px;">goruntule</button>
                                                <input ${readOnly ? 'readonly' : ''} class="svx-mini" type="number" min="1" value="${ProductLibraryModule.escapeHtml(String(item?.qty || 1))}" oninput="ProductLibraryModule.setSalesVariationMasterQty('${ProductLibraryModule.escapeHtml(item?.id || '')}', this.value)">
                                                ${readOnly ? '<button class="btn-sm" type="button" disabled style="height:30px;">sil</button>' : `<button class="btn-sm" type="button" onclick="ProductLibraryModule.removeSalesVariationMasterRef('${ProductLibraryModule.escapeHtml(item?.id || '')}')" style="height:30px;">sil</button>`}
                                            </div>
                                        `).join('')}
                                </div>
                            </div>
                        `}
                    </div>
                </div>

                ${isSalesEntry ? '' : `
                <div class="svx-grid svx-bottom" style="margin-top:0.95rem;">
                    <div class="svx-soft" style="padding:0.68rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem;">
                            <div>
                                <div style="font-size:1rem; font-weight:900; color:#0f172a;">Parca ve Bilesen Baglantilari</div>
                                <div style="font-size:0.76rem; color:#64748b;">Patlatilmis resimdeki parcalari satir satir ekleyin.</div>
                            </div>
                            ${readOnly ? '' : '<button class="btn-primary" type="button" onclick="ProductLibraryModule.addSalesVariationComponentItem()" style="height:32px;">parca bilesen ekle +</button>'}
                        </div>
                        <div style="margin-top:0.5rem; display:flex; flex-direction:column; gap:0.3rem;">
                            ${componentItems.length === 0
                ? '<div style="font-size:0.84rem; color:#94a3b8; border:1px dashed #cbd5e1; border-radius:0.6rem; padding:0.6rem;">Bagli parca/bilesen yok.</div>'
                : componentItems.map((item, idx) => `
                                        <div style="display:grid; grid-template-columns:28px minmax(360px, 1fr) 210px 150px 150px; gap:0.42rem; align-items:center;">
                                            <div style="font-size:0.76rem; color:#64748b;">${idx + 1}</div>
                                            <div style="border:1px solid #dbe2eb; border-radius:0.75rem; padding:0.45rem 0.6rem; background:#f8fafc;">
                                                <button type="button" onclick="ProductLibraryModule.openSalesVariationLinkedRecord('component', '${ProductLibraryModule.escapeHtml(item?.refId || '')}', '${ProductLibraryModule.escapeHtml(item?.code || '')}')" style="font-size:0.9rem; font-weight:900; color:#1d4ed8; font-family:monospace; background:none; border:none; padding:0; cursor:pointer; text-align:left;">${ProductLibraryModule.escapeHtml(item?.code || '-')}</button>
                                                <div style="font-size:0.8rem; color:#64748b; margin-top:0.12rem;">${ProductLibraryModule.escapeHtml(item?.name || '-')}</div>
                                            </div>
                                            <div style="display:flex; align-items:center; gap:0.45rem;">
                                                <input ${readOnly ? 'readonly' : ''} class="svx-mini" type="number" min="1" value="${ProductLibraryModule.escapeHtml(String(item?.qty || 1))}" oninput="ProductLibraryModule.setSalesVariationComponentQty('${ProductLibraryModule.escapeHtml(item?.id || '')}', this.value)" style="height:44px; width:92px; border-radius:0.75rem; font-size:1.55rem; font-weight:500;">
                                                <span style="font-size:0.72rem; font-weight:800; color:#334155; letter-spacing:0.02em;">adet</span>
                                            </div>
                                            <button class="btn-sm" type="button" onclick="ProductLibraryModule.openSalesVariationLinkedRecord('component', '${ProductLibraryModule.escapeHtml(item?.refId || '')}', '${ProductLibraryModule.escapeHtml(item?.code || '')}')" style="height:44px; border-radius:0.75rem; font-size:0.82rem; font-weight:800;">goruntule</button>
                                            ${readOnly
                    ? '<button class="btn-sm" type="button" disabled style="height:44px; border-radius:0.75rem; font-size:0.82rem; font-weight:800;">duzenle</button>'
                    : `<button class="btn-sm" type="button" onclick="ProductLibraryModule.editSalesVariationComponentItem('${ProductLibraryModule.escapeHtml(item?.id || '')}')" style="height:44px; border-radius:0.75rem; font-size:0.82rem; font-weight:800;">duzenle</button>`}
                                        </div>
                                    `).join('')}
                        </div>
                    </div>

                    <div class="svx-soft" style="padding:0.82rem; min-height:208px;">
                        <div style="font-size:1.08rem; font-weight:900; color:#0f172a; text-align:center;">Urun Fotografi / Teknik Resim</div>
                        <div style="font-size:0.86rem; color:#64748b; margin-top:0.2rem; text-align:center;">Resim/PDF dosya + ekle</div>
                        ${readOnly ? '' : '<input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onchange="ProductLibraryModule.handleSalesVariationExplodedFiles(this)" style="margin-top:0.4rem;">'}
                        <div style="margin-top:0.45rem; display:flex; flex-direction:column; gap:0.35rem; max-height:128px; overflow:auto;">
                            ${explodedFiles.length === 0
                ? '<div style="font-size:0.82rem; color:#94a3b8;">Dosya secilmedi.</div>'
                : explodedFiles.map((file, idx) => `
                                        <div style="display:flex; align-items:center; justify-content:space-between; gap:0.35rem; border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.3rem 0.42rem;">
                                            <div style="font-size:0.78rem; color:#334155;">${ProductLibraryModule.escapeHtml(file?.name || 'dosya')}</div>
                                            ${readOnly ? '' : `<button class="btn-sm" type="button" onclick="ProductLibraryModule.removeSalesVariationExplodedFile(${idx})">sil</button>`}
                                        </div>
                                    `).join('')}
                        </div>
                    </div>
                </div>
                `}

                <div class="svx-note" style="margin-top:0.95rem;">
                    <label class="svx-label" style="font-size:1rem; color:#0f172a; font-weight:900;">not</label>
                    <textarea ${readOnly ? 'readonly' : ''} rows="4" oninput="ProductLibraryModule.setSalesVariationDraftField('note', this.value)" style="width:100%; border:1px solid #94a3b8; border-radius:0.72rem; padding:0.65rem; resize:vertical; min-height:118px; ${readOnly ? 'background:#f8fafc; color:#64748b;' : ''}">${ProductLibraryModule.escapeHtml(draft.note || '')}</textarea>
                </div>

                <div style="margin-top:0.9rem; display:flex; align-items:center; justify-content:space-between; gap:0.45rem; flex-wrap:wrap;">
                    <div>${mode === 'edit' ? '<button class="btn-sm" onclick="ProductLibraryModule.deleteSalesVariation()" style="color:#b91c1c; border-color:#fecaca; background:#fff1f2;">sil</button>' : ''}</div>
                    <div style="display:flex; justify-content:flex-end; gap:0.45rem; flex-wrap:wrap;">
                        ${mode === 'view' ? `<button class="btn-sm" onclick="ProductLibraryModule.openSalesVariationEditor('edit', '${ProductLibraryModule.escapeHtml(ProductLibraryModule.state.salesVariationEditingId || '')}')">duzenle</button>` : ''}
                        ${mode === 'edit' ? '<button class="btn-primary" onclick="ProductLibraryModule.saveSalesVariation(true)" style="background:#6b7280;">Farkli Kaydet</button>' : ''}
                        <button class="btn-sm" onclick="ProductLibraryModule.closeSalesVariationEditor()">Vazgec</button>
                        ${mode === 'view' ? '' : '<button class="btn-primary" onclick="ProductLibraryModule.saveSalesVariation(false)">Kaydet</button>'}
                    </div>
                </div>
            </div>
        `;
    },

    renderSalesProductVariationPage: (container, product) => {
        const row = product && typeof product === 'object' ? product : null;
        if (!row) {
            ProductLibraryModule.renderWorkspacePlaceholder(
                container,
                'Urun Detayi',
                'Urun kaydi bulunamadi.'
            );
            return;
        }

        const image = String(row?.images?.product || row?.images?.application || '').trim();
        const technicalImage = String(row?.images?.technical || '').trim();
        const categoryPath = (typeof SalesModule !== 'undefined' && SalesModule && typeof SalesModule.getCatalogCategoryPathText === 'function')
            ? SalesModule.getCatalogCategoryPathText(row?.categoryId || '')
            : String(row?.categoryId || '').trim();
        const diameters = Array.isArray(row?.diameters) ? row.diameters.filter(Boolean) : [];
        const variantRows = ProductLibraryModule.getSalesProductVariationRows(row?.id);
        const isPlanningModelPicker = String(ProductLibraryModule.state.planningPickerSource || '') === 'model';
        const isStockInventoryPicker = isPlanningModelPicker
            && typeof StockModule !== 'undefined'
            && !!StockModule?.state?.inventoryRegistrationPickerPending;
        const editorPanelHtml = ProductLibraryModule.renderSalesVariationEditorPanel(row);

        container.innerHTML = `
            <div style="max-width:1500px; margin:0 auto;">
                ${isPlanningModelPicker ? `
                    <div style="background:#eff6ff; border:2px solid #1d4ed8; color:#1e3a8a; border-radius:0.9rem; padding:0.7rem 0.85rem; margin-bottom:0.85rem; display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap;">
                        <div style="font-weight:700;">${isStockInventoryPicker
                ? 'Envantere elle kayit icin varyasyon secimi modundasin. Satirdaki "ekle" butonuyla secim yapabilirsin.'
                : 'Planlama icin varyasyon secimi modundasin. Satirdaki "ekle" butonuyla secim yapabilirsin.'}</div>
                        <button class="btn-sm" onclick="ProductLibraryModule.cancelPlanningPicker()">${isStockInventoryPicker ? 'envantere don' : 'planlamaya don'}</button>
                    </div>
                ` : ''}
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; margin-bottom:0.85rem;">
                    <div>
                        <h2 class="page-title" style="margin:0;">Urun Detayi ve Varyasyonlar</h2>
                        <div style="font-size:0.82rem; color:#64748b; margin-top:0.15rem;">Satis kutuphanesi urun karti ustte sabit kalir, varyasyonlar asagida satir bazinda yonetilir.</div>
                    </div>
                    <button class="btn-sm" onclick="ProductLibraryModule.closeSalesProductVariationPage()">listeye don</button>
                </div>

                <div class="card-table" style="padding:0.9rem; margin-bottom:0.9rem;">
                    <div style="display:grid; grid-template-columns:320px 1fr; gap:0.9rem;">
                        <div style="border:1px solid #e2e8f0; border-radius:0.9rem; overflow:hidden; min-height:220px; background:${image ? '#0f172a' : '#f8fafc'}; display:flex; align-items:center; justify-content:center;">
                            ${image
                ? `<img src="${ProductLibraryModule.escapeHtml(image)}" alt="${ProductLibraryModule.escapeHtml(row?.name || 'Urun')}" style="width:100%; height:100%; object-fit:cover;">`
                : '<div style="color:#94a3b8; font-weight:700;">Gorsel yok</div>'}
                        </div>
                        <div style="display:flex; flex-direction:column; gap:0.55rem;">
                            <div style="font-size:0.8rem; color:#64748b;">${ProductLibraryModule.escapeHtml(categoryPath || '-')}</div>
                            <div style="font-size:1.4rem; font-weight:800; color:#0f172a;">${ProductLibraryModule.escapeHtml(row?.name || '-')}</div>
                            <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                                <span style="padding:0.2rem 0.55rem; border-radius:999px; border:1px solid #cbd5e1; font-size:0.8rem; color:#334155; font-weight:700;">ID: ${ProductLibraryModule.escapeHtml(row?.idCode || '-')}</span>
                                <span style="padding:0.2rem 0.55rem; border-radius:999px; border:1px solid #cbd5e1; font-size:0.8rem; color:#334155; font-weight:700;">Urun kodu: ${ProductLibraryModule.escapeHtml(row?.productCode || '-')}</span>
                                <span style="padding:0.2rem 0.55rem; border-radius:999px; border:1px solid #cbd5e1; font-size:0.8rem; color:#334155; font-weight:700;">Caplar: ${ProductLibraryModule.escapeHtml(diameters.length > 0 ? diameters.join(', ') : (row?.selectedDiameter || '-'))}</span>
                                <span style="padding:0.2rem 0.55rem; border-radius:999px; border:1px solid #cbd5e1; font-size:0.8rem; color:#334155; font-weight:700;">Kabarcik: ${ProductLibraryModule.escapeHtml(String(row?.bubble || 'yok').trim() || 'yok')}</span>
                                <span style="padding:0.2rem 0.55rem; border-radius:999px; border:1px solid #cbd5e1; font-size:0.8rem; color:#334155; font-weight:700;">Boy: ${ProductLibraryModule.escapeHtml(row?.pipe?.lengthMm || '-')} mm</span>
                                <span style="padding:0.2rem 0.55rem; border-radius:999px; border:1px solid #cbd5e1; font-size:0.8rem; color:#334155; font-weight:700;">Pleksi: ${ProductLibraryModule.escapeHtml(row?.colors?.plexi?.color || '-')}</span>
                                <span style="padding:0.2rem 0.55rem; border-radius:999px; border:1px solid #cbd5e1; font-size:0.8rem; color:#334155; font-weight:700;">Aksesuar: ${ProductLibraryModule.escapeHtml(row?.colors?.accessory?.color || '-')}</span>
                                <span style="padding:0.2rem 0.55rem; border-radius:999px; border:1px solid #cbd5e1; font-size:0.8rem; color:#334155; font-weight:700;">Boru: ${ProductLibraryModule.escapeHtml(row?.colors?.tube?.color || '-')}</span>
                            </div>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; margin-top:0.2rem;">
                                <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.55rem; min-height:84px;">
                                    <div style="font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">teknik gorsel</div>
                                    ${technicalImage ? `<div style="font-size:0.82rem; color:#334155; font-weight:700;">Yuklu</div>` : `<div style="font-size:0.82rem; color:#94a3b8;">Yok</div>`}
                                </div>
                                <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.55rem; min-height:84px;">
                                    <div style="font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">not</div>
                                    <div style="font-size:0.82rem; color:#334155;">${ProductLibraryModule.escapeHtml(row?.note || '-')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card-table" style="padding:0.9rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; margin-bottom:0.65rem;">
                        <div>
                            <div style="font-weight:800; color:#0f172a; font-size:1.02rem;">Varyasyonlar</div>
                            <div style="font-size:0.8rem; color:#64748b; margin-top:0.15rem;">Bu urune bagli varyasyonlar satir satir listelenir.</div>
                        </div>
                        <button class="btn-primary" type="button" onclick="ProductLibraryModule.openSalesVariationEditor('create')">yeni varyasyon olustur</button>
                    </div>

                    <div style="border:1px solid #e2e8f0; border-radius:0.85rem; overflow:auto;">
                        <table style="width:100%; min-width:1280px; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; background:#f8fafc; color:#64748b; font-size:0.73rem; text-transform:uppercase;">
                                    <th style="padding:0.58rem; text-align:left;">Urun adi</th>
                                    <th style="padding:0.58rem; text-align:left;">Urun kodu</th>
                                    <th style="padding:0.58rem; text-align:left;">ID kodu</th>
                                    <th style="padding:0.58rem; text-align:left;">Cap</th>
                                    <th style="padding:0.58rem; text-align:left;">Aksesuar rengi</th>
                                    <th style="padding:0.58rem; text-align:left;">Boru rengi</th>
                                    <th style="padding:0.58rem; text-align:left;">Pleksi rengi</th>
                                    <th style="padding:0.58rem; text-align:left;">Kabarcik</th>
                                    <th style="padding:0.58rem; text-align:left;">Alt boru uzunlugu</th>
                                    <th style="padding:0.58rem; text-align:left;">Islem</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${variantRows.length === 0
                ? '<tr><td colspan="10" style="padding:1.05rem; color:#94a3b8; text-align:center;">Bu urune henuz varyasyon eklenmedi.</td></tr>'
                : variantRows.map((item) => {
                    const productCode = String(item?.variantCode || item?.sourceCatalogProductCode || '').trim() || '-';
                    const idCode = String(item?.sourceCatalogIdCode || row?.idCode || '').trim() || '-';
                    const diameter = String(item?.selectedDiameter || row?.selectedDiameter || '').trim() || '-';
                    const accessoryColor = String(item?.colors?.accessory?.color || item?.colors?.accessory?.name || '').trim() || '-';
                    const tubeColor = String(item?.colors?.tube?.color || item?.colors?.tube?.name || '').trim() || '-';
                    const plexiColor = String(item?.colors?.plexi?.color || item?.colors?.plexi?.name || '').trim() || '-';
                    const bubble = String(item?.bubble || 'yok').trim() || 'yok';
                    const lowerTubeValue = String(item?.lowerTubeLengthMm ?? row?.lowerTubeLength ?? '').trim();
                    const lowerTubeText = !lowerTubeValue || lowerTubeValue.toLocaleLowerCase('tr-TR') === 'standart'
                        ? 'standart'
                        : lowerTubeValue;
                    const productionStatus = ProductLibraryModule.getSalesVariationProductionStatus(item);
                    const isIncomplete = !productionStatus.ready;
                    const rowStyle = isIncomplete ? 'border-bottom:1px solid #fecdd3; background:#fff1f2;' : 'border-bottom:1px solid #f1f5f9;';
                    return `
                                        <tr style="${rowStyle}" title="${ProductLibraryModule.escapeHtml(isIncomplete ? productionStatus.reason : '')}">
                                            <td style="padding:0.58rem; color:#0f172a; font-weight:700;">
                                                ${ProductLibraryModule.escapeHtml(item?.productName || '-')}
                                                ${isIncomplete ? '<span style="margin-left:0.4rem; display:inline-flex; align-items:center; padding:0.1rem 0.45rem; border:1px solid #fda4af; border-radius:999px; background:#ffe4e6; color:#be123c; font-size:0.68rem; font-weight:800;">URETIM PLANI EKSIK!</span>' : ''}
                                            </td>
                                            <td style="padding:0.58rem; font-family:monospace; color:#334155;">${ProductLibraryModule.escapeHtml(productCode)}</td>
                                            <td style="padding:0.58rem; font-family:monospace; color:#334155;">${ProductLibraryModule.escapeHtml(idCode)}</td>
                                            <td style="padding:0.58rem; color:#334155;">${ProductLibraryModule.escapeHtml(diameter)}</td>
                                            <td style="padding:0.58rem; color:#334155;">${ProductLibraryModule.escapeHtml(accessoryColor)}</td>
                                            <td style="padding:0.58rem; color:#334155;">${ProductLibraryModule.escapeHtml(tubeColor)}</td>
                                            <td style="padding:0.58rem; color:#334155;">${ProductLibraryModule.escapeHtml(plexiColor)}</td>
                                            <td style="padding:0.58rem; color:#334155;">${ProductLibraryModule.escapeHtml(bubble)}</td>
                                            <td style="padding:0.58rem; color:#334155;">${ProductLibraryModule.escapeHtml(lowerTubeText)}</td>
                                            <td style="padding:0.58rem;">
                                                <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
                                                    <button class="btn-sm" type="button" onclick="ProductLibraryModule.openSalesVariationEditor('view', '${ProductLibraryModule.escapeHtml(item?.id || '')}')">goruntule</button>
                                                    <button class="btn-sm" type="button" onclick="ProductLibraryModule.openSalesVariationEditor('edit', '${ProductLibraryModule.escapeHtml(item?.id || '')}')">duzenle</button>
                                                    ${isPlanningModelPicker ? `<button class="btn-sm" type="button" style="border-color:#bfdbfe; color:#1d4ed8; background:#eff6ff;" onclick="ProductLibraryModule.selectPlanningModel('${ProductLibraryModule.escapeHtml(ProductLibraryModule.getPlanningModelIdFromSalesVariationId(item?.id || ''))}')">ekle</button>` : ''}
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ${editorPanelHtml}
            </div>
        `;
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
                    <div style="font-size:0.92rem;">${ProductLibraryModule.escapeHtml(subtitle || 'Sayfa yapim asamasindadir.')}</div>
                </div>
            </div>
        `;
    },

    getColorTypeOptions: () => ([
        { id: 'eloksal', label: 'Eloksal Renkleri', shortLabel: 'Eloksal', prefix: 'ELO' },
        { id: 'pvd', label: 'Pvd krom kaplama', shortLabel: 'PVD', prefix: 'PVD' },
        { id: 'boya', label: 'Elektrostatik boya', shortLabel: 'Boya', prefix: 'BOY' },
        { id: 'pleksi', label: 'Pleksi renk', shortLabel: 'Pleksi', prefix: 'PLX' }
    ]),

    normalizeColorType: (value) => {
        const text = ProductLibraryModule.normalizeAsciiUpper(value || '');
        if (!text) return '';
        if (text.includes('ELOKSAL') || text.includes('ALOKSAL')) return 'eloksal';
        if (text.includes('PVD')) return 'pvd';
        if (text.includes('BOYA') || text.includes('ELEKTROSTATIK')) return 'boya';
        if (text.includes('PLEKSI')) return 'pleksi';
        return '';
    },

    getColorTypeMeta: (type) => {
        const key = String(type || '').trim();
        return ProductLibraryModule.getColorTypeOptions().find(x => x.id === key) || null;
    },

    ensureColorLibraryDefaults: () => {
        if (!DB.data.data || typeof DB.data.data !== 'object') DB.data.data = {};
        if (!Array.isArray(DB.data.data.colorLibrary)) DB.data.data.colorLibrary = [];

        const typeOptions = ProductLibraryModule.getColorTypeOptions();
        const typeIdSet = new Set(typeOptions.map(x => x.id));
        let changed = false;
        DB.data.data.colorLibrary = (DB.data.data.colorLibrary || [])
            .filter(x => x && typeof x === 'object')
            .map((row) => {
                const normalizedType = ProductLibraryModule.normalizeColorType(row.type || row.processType || row.category || '');
                const type = typeIdSet.has(normalizedType) ? normalizedType : '';
                const normalized = {
                    id: String(row.id || '').trim() || crypto.randomUUID(),
                    type,
                    name: String(row.name || row.colorName || '').trim(),
                    note: typeof row.note === 'string' ? row.note : '',
                    code: String(row.code || '').trim().toUpperCase(),
                    created_at: row.created_at || new Date().toISOString(),
                    updated_at: row.updated_at || row.created_at || new Date().toISOString()
                };
                if (
                    normalized.id !== row.id ||
                    normalized.type !== row.type ||
                    normalized.name !== row.name ||
                    normalized.note !== row.note ||
                    normalized.code !== row.code
                ) {
                    changed = true;
                }
                return normalized;
            })
            .filter(row => row.type && row.name);

        if (changed && typeof DB.markDirty === 'function') DB.markDirty();
    },

    getColorLibraryItems: () => {
        ProductLibraryModule.ensureColorLibraryDefaults();
        return [...(DB.data.data.colorLibrary || [])].sort((a, b) => {
            return String(a?.name || '').localeCompare(String(b?.name || ''), 'tr');
        });
    },

    resolveLinkedColorInfo: ({ colorType = '', colorCode = '', colorName = '' } = {}) => {
        const typeNorm = ProductLibraryModule.normalizeColorType(colorType || '');
        const codeNorm = String(colorCode || '').trim().toUpperCase();
        const nameNorm = ProductLibraryModule.normalizeAsciiUpper(colorName || '');
        const items = ProductLibraryModule.getColorLibraryItems();

        let found = null;
        if (codeNorm) {
            found = items.find(item => {
                const codeOk = String(item?.code || '').trim().toUpperCase() === codeNorm;
                if (!codeOk) return false;
                if (!typeNorm) return true;
                return ProductLibraryModule.normalizeColorType(item?.type || '') === typeNorm;
            }) || null;
        }
        if (!found && typeNorm && nameNorm) {
            found = items.find(item =>
                ProductLibraryModule.normalizeColorType(item?.type || '') === typeNorm &&
                ProductLibraryModule.normalizeAsciiUpper(item?.name || '') === nameNorm
            ) || null;
        }
        if (!found && typeNorm && nameNorm) {
            const candidates = items.filter(item => {
                if (ProductLibraryModule.normalizeColorType(item?.type || '') !== typeNorm) return false;
                const itemNameNorm = ProductLibraryModule.normalizeAsciiUpper(item?.name || '');
                if (!itemNameNorm) return false;
                return itemNameNorm.startsWith(nameNorm) || nameNorm.startsWith(itemNameNorm);
            });
            if (candidates.length === 1) found = candidates[0];
        }

        if (!found) {
            return {
                id: '',
                type: typeNorm,
                code: codeNorm,
                name: String(colorName || '').trim()
            };
        }

        return {
            id: String(found.id || ''),
            type: ProductLibraryModule.normalizeColorType(found.type || '') || typeNorm,
            code: String(found.code || '').trim().toUpperCase() || codeNorm,
            name: String(found.name || '').trim() || String(colorName || '').trim()
        };
    },

    resolveStrictLibraryColorSelection: ({ colorType = '', colorCode = '', colorName = '' } = {}) => {
        const linked = ProductLibraryModule.resolveLinkedColorInfo({ colorType, colorCode, colorName });
        const inferredType = ProductLibraryModule.normalizeColorType(
            linked.type || colorType || ProductLibraryModule.inferColorTypeFromCode(linked.code || colorCode)
        );
        if (!inferredType) {
            return { id: '', type: '', name: '', code: '', found: false, options: [] };
        }

        const options = ProductLibraryModule.getColorLibraryItemsByType(inferredType);
        if (options.length === 0) {
            return { id: '', type: inferredType, name: '', code: '', found: false, options: [] };
        }

        const codeNorm = String(linked.code || colorCode || '').trim().toUpperCase();
        const nameNorm = ProductLibraryModule.normalizeAsciiUpper(linked.name || colorName || '');

        let match = null;
        if (codeNorm) {
            match = options.find(row => String(row?.code || '').trim().toUpperCase() === codeNorm) || null;
        }
        if (!match && nameNorm) {
            match = options.find(row => ProductLibraryModule.normalizeAsciiUpper(row?.name || '') === nameNorm) || null;
        }
        if (!match && nameNorm) {
            const candidates = options.filter(row => {
                const rowNorm = ProductLibraryModule.normalizeAsciiUpper(row?.name || '');
                if (!rowNorm) return false;
                return rowNorm.startsWith(nameNorm) || nameNorm.startsWith(rowNorm);
            });
            if (candidates.length === 1) match = candidates[0];
        }

        if (!match) {
            return { id: '', type: inferredType, name: '', code: '', found: false, options };
        }

        return {
            id: String(match.id || ''),
            type: inferredType,
            name: String(match.name || '').trim(),
            code: String(match.code || '').trim().toUpperCase(),
            found: true,
            options
        };
    },

    setColorType: (type) => {
        const meta = ProductLibraryModule.getColorTypeMeta(type);
        if (!meta) return;
        const hasEditing = !!String(ProductLibraryModule.state.colorEditingId || '').trim();
        ProductLibraryModule.state.colorActiveType = meta.id;
        // Keep edit mode active while switching category, so "guncelle" never degrades into "yeni kayit".
        if (!hasEditing) {
            ProductLibraryModule.state.colorEditingId = null;
            ProductLibraryModule.state.colorDraftName = '';
            ProductLibraryModule.state.colorDraftNote = '';
        }
        UI.renderCurrentPage();
    },

    setColorFilter: (field, value, focusId = '') => {
        if (!ProductLibraryModule.state.colorFilters || typeof ProductLibraryModule.state.colorFilters !== 'object') {
            ProductLibraryModule.state.colorFilters = { name: '', code: '' };
        }
        if (!['name', 'code'].includes(field)) return;
        ProductLibraryModule.state.colorFilters[field] = String(value || '');
        UI.renderCurrentPage();
        if (!focusId) return;
        setTimeout(() => {
            const el = document.getElementById(focusId);
            if (!el) return;
            el.focus();
            const len = el.value.length;
            try { el.setSelectionRange(len, len); } catch (_) { }
        }, 0);
    },

    setColorDraft: (field, value) => {
        if (field === 'name') ProductLibraryModule.state.colorDraftName = String(value || '');
        if (field === 'note') ProductLibraryModule.state.colorDraftNote = String(value || '');
    },

    resetColorDraft: (render = true) => {
        ProductLibraryModule.state.colorEditingId = null;
        ProductLibraryModule.state.colorDraftName = '';
        ProductLibraryModule.state.colorDraftNote = '';
        if (render) UI.renderCurrentPage();
    },

    selectColorLibraryItem: (id) => {
        ProductLibraryModule.state.colorSelectedId = String(id || '');
        UI.renderCurrentPage();
    },

    previewColorLibraryItem: (id) => {
        const row = ProductLibraryModule.getColorLibraryItems().find(x => String(x.id) === String(id || ''));
        if (!row) return;
        const typeMeta = ProductLibraryModule.getColorTypeMeta(row.type);
        Modal.open('Renk Detay', `
            <div style="display:grid; grid-template-columns:150px 1fr; gap:0.5rem; font-size:0.95rem;">
                <div style="color:#64748b;">Kategori</div><div style="font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(typeMeta?.label || '-')}</div>
                <div style="color:#64748b;">Renk</div><div style="font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(row.name || '-')}</div>
                <div style="color:#64748b;">ID kodu</div><div style="font-family:monospace; font-weight:700; color:#1d4ed8;">${ProductLibraryModule.escapeHtml(row.code || '-')}</div>
                <div style="color:#64748b;">Not</div><div style="white-space:pre-wrap; color:#334155;">${ProductLibraryModule.escapeHtml(row.note || '-')}</div>
            </div>
        `, { maxWidth: '640px' });
    },

    generateColorCode: (type, excludeId = '') => {
        const meta = ProductLibraryModule.getColorTypeMeta(type);
        if (!meta) return '';
        const all = ProductLibraryModule.getColorLibraryItems();
        let maxNum = 0;
        all.forEach(item => {
            if (item.type !== meta.id) return;
            const code = String(item.code || '').toUpperCase().trim();
            const match = code.match(new RegExp(`^CLR-${meta.prefix}-(\\d{1,12})$`));
            if (!match) return;
            const n = Number(match[1]);
            if (Number.isFinite(n) && n > maxNum) maxNum = n;
        });

        let nextNum = maxNum + 1;
        let candidate = `CLR-${meta.prefix}-${String(nextNum).padStart(4, '0')}`;
        while (
            ProductLibraryModule.isGlobalCodeTaken(candidate) ||
            all.some(item => {
                if (String(item.id || '') === String(excludeId || '')) return false;
                return String(item.code || '').toUpperCase() === candidate;
            })
        ) {
            nextNum += 1;
            candidate = `CLR-${meta.prefix}-${String(nextNum).padStart(4, '0')}`;
        }
        return candidate;
    },

    applyColorLibraryChangeToLinkedRecords: (oldRow, nextRow) => {
        const oldType = ProductLibraryModule.normalizeColorType(oldRow?.type || '');
        const oldName = ProductLibraryModule.normalizeAsciiUpper(oldRow?.name || '');
        const oldCode = String(oldRow?.code || '').trim().toUpperCase();
        const nextType = ProductLibraryModule.normalizeColorType(nextRow?.type || '');
        const nextName = String(nextRow?.name || '').trim();
        const nextCode = String(nextRow?.code || '').trim().toUpperCase();
        const now = new Date().toISOString();

        const colorMatches = (colorType, colorName, colorCode) => {
            const typeOk = ProductLibraryModule.normalizeColorType(colorType || '') === oldType;
            const nameOk = ProductLibraryModule.normalizeAsciiUpper(colorName || '') === oldName;
            const codeOk = String(colorCode || '').trim().toUpperCase() === oldCode;
            const legacyNameOnlyMatch = nameOk &&
                !String(colorCode || '').trim() &&
                !ProductLibraryModule.normalizeColorType(colorType || '');
            if (oldCode) return codeOk || (typeOk && nameOk) || legacyNameOnlyMatch;
            return (typeOk && nameOk) || legacyNameOnlyMatch;
        };

        const products = Array.isArray(DB.data?.data?.products) ? DB.data.data.products : [];
        products.forEach((row) => {
            if (!row || typeof row !== 'object') return;
            const specs = (row.specs && typeof row.specs === 'object') ? row.specs : {};
            const specMatch = colorMatches(specs.colorType, specs.color, specs.colorCode);
            const rootMatch = colorMatches(row.colorType, row.color, row.colorCode);
            if (!specMatch && !rootMatch) return;

            if (!row.specs || typeof row.specs !== 'object') row.specs = {};
            row.specs.colorType = nextType;
            row.specs.color = nextName;
            row.specs.colorCode = nextCode;
            row.colorType = nextType;
            row.color = nextName;
            row.colorCode = nextCode;
            if (ProductLibraryModule.normalizeAsciiUpper(row.anodizedColor || '') === oldName) {
                row.anodizedColor = nextName;
            }
            if (ProductLibraryModule.normalizeAsciiUpper(row.paintColor || '') === oldName) {
                row.paintColor = nextName;
            }
            row.updated_at = now;
        });

        const components = Array.isArray(DB.data?.data?.partComponentCards) ? DB.data.data.partComponentCards : [];
        components.forEach((row) => {
            if (!row || typeof row !== 'object') return;
            if (!colorMatches(row.colorType, row.subGroup, row.colorCode)) return;
            row.colorType = nextType;
            row.subGroup = nextName;
            row.colorCode = nextCode;
            row.updated_at = now;
        });
    },

    saveColorLibraryItem: async () => {
        ProductLibraryModule.ensureColorLibraryDefaults();
        const state = ProductLibraryModule.state;
        const activeType = ProductLibraryModule.normalizeColorType(state.colorActiveType);
        if (!activeType) {
            alert('Lutfen once renk kategorisi seciniz.');
            return;
        }

        const name = String(state.colorDraftName || '').trim();
        if (!name) {
            alert('Lutfen renk adini giriniz.');
            return;
        }
        const note = String(state.colorDraftNote || '').trim();

        const rows = Array.isArray(DB.data.data.colorLibrary) ? DB.data.data.colorLibrary : [];
        const duplicate = rows.some(item => {
            const sameType = ProductLibraryModule.normalizeColorType(item.type) === activeType;
            const sameName = ProductLibraryModule.normalizeAsciiUpper(item.name || '') === ProductLibraryModule.normalizeAsciiUpper(name);
            const otherRecord = String(item.id || '') !== String(state.colorEditingId || '');
            return sameType && sameName && otherRecord;
        });
        if (duplicate) {
            alert('Bu kategoride ayni renk adi zaten var.');
            return;
        }

        const now = new Date().toISOString();
        if (state.colorEditingId) {
            const list = Array.isArray(DB.data.data.colorLibrary) ? DB.data.data.colorLibrary : [];
            const idx = list.findIndex(x => String(x.id || '') === String(state.colorEditingId || ''));
            if (idx === -1) {
                ProductLibraryModule.resetColorDraft();
                return;
            }
            const old = list[idx];
            const updated = {
                ...old,
                type: activeType,
                name,
                note,
                code: String(old.code || '').trim().toUpperCase() || ProductLibraryModule.generateColorCode(activeType, old.id),
                updated_at: now
            };
            list[idx] = updated;
            ProductLibraryModule.applyColorLibraryChangeToLinkedRecords(old, updated);
            ProductLibraryModule.state.colorSelectedId = old.id;
        } else {
            const id = crypto.randomUUID();
            const code = ProductLibraryModule.generateColorCode(activeType);
            if (!Array.isArray(DB.data.data.colorLibrary)) DB.data.data.colorLibrary = [];
            DB.data.data.colorLibrary.push({
                id,
                type: activeType,
                name,
                note,
                code,
                created_at: now,
                updated_at: now
            });
            ProductLibraryModule.state.colorSelectedId = id;
        }

        await DB.save();
        ProductLibraryModule.resetColorDraft(false);
        UI.renderCurrentPage();
    },

    startEditColorLibraryItem: (id) => {
        const row = ProductLibraryModule.getColorLibraryItems().find(x => String(x.id) === String(id || ''));
        if (!row) return;
        ProductLibraryModule.state.colorActiveType = row.type;
        ProductLibraryModule.state.colorEditingId = row.id;
        ProductLibraryModule.state.colorSelectedId = row.id;
        ProductLibraryModule.state.colorDraftName = row.name || '';
        ProductLibraryModule.state.colorDraftNote = row.note || '';
        UI.renderCurrentPage();
    },

    deleteColorLibraryItem: async (id) => {
        ProductLibraryModule.ensureColorLibraryDefaults();
        const row = (DB.data.data.colorLibrary || []).find(x => String(x.id || '') === String(id || ''));
        if (!row) return;
        if (!confirm(`"${row.name || ''}" silinsin mi?`)) return;
        DB.data.data.colorLibrary = (DB.data.data.colorLibrary || []).filter(x => String(x.id || '') !== String(id || ''));
        if (String(ProductLibraryModule.state.colorSelectedId || '') === String(id || '')) ProductLibraryModule.state.colorSelectedId = null;
        if (String(ProductLibraryModule.state.colorEditingId || '') === String(id || '')) ProductLibraryModule.resetColorDraft(false);
        await DB.save();
        UI.renderCurrentPage();
    },

    renderColorLibraryPage: (container) => {
        ProductLibraryModule.ensureColorLibraryDefaults();
        const state = ProductLibraryModule.state;
        const typeOptions = ProductLibraryModule.getColorTypeOptions();
        const activeType = ProductLibraryModule.normalizeColorType(state.colorActiveType);
        const activeMeta = ProductLibraryModule.getColorTypeMeta(activeType);
        const allRows = ProductLibraryModule.getColorLibraryItems();
        const qName = ProductLibraryModule.normalizeAsciiUpper(state.colorFilters?.name || '');
        const qCode = ProductLibraryModule.normalizeAsciiUpper(state.colorFilters?.code || '');
        const rows = allRows.filter(item => {
            if (!activeType) return false;
            if (item.type !== activeType) return false;
            const nameOk = !qName || ProductLibraryModule.normalizeAsciiUpper(item.name || '').includes(qName);
            const codeOk = !qCode || ProductLibraryModule.normalizeAsciiUpper(item.code || '').includes(qCode);
            return nameOk && codeOk;
        });
        const editingRow = state.colorEditingId
            ? allRows.find(x => String(x.id || '') === String(state.colorEditingId || ''))
            : null;
        const draftCode = activeType
            ? (editingRow?.code || ProductLibraryModule.generateColorCode(activeType, editingRow?.id || ''))
            : '';
        const disabled = !activeType;

        container.innerHTML = `
            <div style="max-width:1360px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:1rem;">
                    <h2 class="page-title" style="margin:0;">Renk Kutuphanesi</h2>
                    <button class="btn-sm" onclick="ProductLibraryModule.goWorkspaceMenu()">geri</button>
                </div>

                <div class="card-table" style="padding:1rem; margin-bottom:1rem; border:2px solid #0f172a; border-radius:1rem;">
                    <div style="font-weight:700; color:#334155; margin-bottom:0.55rem;">Kaplama / boya kategorisi sec</div>
                    <div style="display:flex; flex-wrap:wrap; gap:0.7rem;">
                        ${typeOptions.map(opt => `
                            <button type="button" onclick="ProductLibraryModule.setColorType('${opt.id}')" style="height:42px; border-radius:0.7rem; border:1px solid ${activeType === opt.id ? '#1d4ed8' : '#cbd5e1'}; background:${activeType === opt.id ? '#bfdbfe' : 'white'}; color:${activeType === opt.id ? '#1e3a8a' : '#334155'}; font-weight:${activeType === opt.id ? '800' : '700'}; padding:0 1rem; cursor:pointer;">${ProductLibraryModule.escapeHtml(opt.label)}</button>
                        `).join('')}
                    </div>
                    ${activeType ? '' : '<div style="margin-top:0.65rem; color:#64748b; font-size:0.9rem;">Lutfen bir kategori secin. Secim yapinca liste ve renk kaydetme aktif olur.</div>'}
                </div>

                <div class="card-table" style="padding:1rem; margin-bottom:1rem; border:2px solid #0f172a; border-radius:1rem;">
                    <div style="display:grid; grid-template-columns:170px 1fr 220px 1fr auto; gap:0.7rem; align-items:end; margin-bottom:0.8rem;">
                        <div>
                            <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">kategori</label>
                            <input disabled value="${ProductLibraryModule.escapeHtml(activeMeta?.shortLabel || '')}" placeholder="kategori seciniz" style="width:100%; height:42px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.65rem; background:#f8fafc; font-weight:700;">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">renk adi *</label>
                            <input ${disabled ? 'disabled' : ''} value="${ProductLibraryModule.escapeHtml(state.colorDraftName || '')}" oninput="ProductLibraryModule.setColorDraft('name', this.value)" placeholder="renk giriniz" style="width:100%; height:42px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.65rem; background:${disabled ? '#f8fafc' : 'white'};">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">ID kodu</label>
                            <input disabled value="${ProductLibraryModule.escapeHtml(draftCode)}" placeholder="otomatik" style="width:100%; height:42px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace; font-weight:700;">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">not ekle</label>
                            <input ${disabled ? 'disabled' : ''} value="${ProductLibraryModule.escapeHtml(state.colorDraftNote || '')}" oninput="ProductLibraryModule.setColorDraft('note', this.value)" placeholder="not" style="width:100%; height:42px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.65rem; background:${disabled ? '#f8fafc' : 'white'};">
                        </div>
                        <div style="display:flex; gap:0.45rem;">
                            ${state.colorEditingId ? `<button class="btn-sm" onclick="ProductLibraryModule.resetColorDraft()" style="height:42px;">vazgec</button>` : ''}
                            <button class="btn-primary" onclick="ProductLibraryModule.saveColorLibraryItem()" ${disabled ? 'disabled' : ''} style="height:42px; border-radius:0.65rem; ${disabled ? 'opacity:0.55; cursor:not-allowed;' : ''}">${state.colorEditingId ? 'guncelle' : 'renk kaydet +'}</button>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.7rem;">
                        <input id="color_filter_name" ${disabled ? 'disabled' : ''} value="${ProductLibraryModule.escapeHtml(state.colorFilters?.name || '')}" oninput="ProductLibraryModule.setColorFilter('name', this.value, 'color_filter_name')" placeholder="renk adiyla ara" style="height:40px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.65rem; background:${disabled ? '#f8fafc' : 'white'};">
                        <input id="color_filter_code" ${disabled ? 'disabled' : ''} value="${ProductLibraryModule.escapeHtml(state.colorFilters?.code || '')}" oninput="ProductLibraryModule.setColorFilter('code', this.value, 'color_filter_code')" placeholder="ID kod ile ara" style="height:40px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.65rem; background:${disabled ? '#f8fafc' : 'white'};">
                    </div>
                </div>

                <div class="card-table" style="padding:1rem; border:2px solid #0f172a; border-radius:1rem;">
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                                <th style="padding:0.55rem; text-align:left;">No</th>
                                <th style="padding:0.55rem; text-align:left;">Kategori</th>
                                <th style="padding:0.55rem; text-align:left;">Renk</th>
                                <th style="padding:0.55rem; text-align:left;">Not</th>
                                <th style="padding:0.55rem; text-align:left;">ID kodu</th>
                                <th style="padding:0.55rem; text-align:center;">goruntule</th>
                                <th style="padding:0.55rem; text-align:center;">duzenle</th>
                                <th style="padding:0.55rem; text-align:center;">sec</th>
                                <th style="padding:0.55rem; text-align:center;">sil</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${!activeType
                ? '<tr><td colspan="9" style="padding:1rem; color:#94a3b8; text-align:center;">Listeyi gormek icin once kategori seciniz.</td></tr>'
                : rows.length === 0
                    ? '<tr><td colspan="9" style="padding:1rem; color:#94a3b8; text-align:center;">Secili kategoride renk kaydi yok.</td></tr>'
                    : rows.map((row, index) => `
                                        <tr style="border-bottom:1px solid #f1f5f9; background:${String(state.colorSelectedId || '') === String(row.id || '') ? '#f8fafc' : 'white'};">
                                            <td style="padding:0.55rem; color:#334155;">${index + 1}</td>
                                            <td style="padding:0.55rem; font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(ProductLibraryModule.getColorTypeMeta(row.type)?.shortLabel || '-')}</td>
                                            <td style="padding:0.55rem; color:#334155;">${ProductLibraryModule.escapeHtml(row.name || '-')}</td>
                                            <td style="padding:0.55rem; color:#64748b;">${ProductLibraryModule.escapeHtml(row.note || '-')}</td>
                                            <td style="padding:0.55rem; font-family:monospace; font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(row.code || '-')}</td>
                                            <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.previewColorLibraryItem('${row.id}')">goruntule</button></td>
                                            <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.startEditColorLibraryItem('${row.id}')">duzenle</button></td>
                                            <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.selectColorLibraryItem('${row.id}')" style="${String(state.colorSelectedId || '') === String(row.id || '') ? 'background:#0f172a; color:white; border-color:#0f172a;' : ''}">${String(state.colorSelectedId || '') === String(row.id || '') ? 'secili' : 'sec'}</button></td>
                                            <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.deleteColorLibraryItem('${row.id}')" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;">sil</button></td>
                                        </tr>
                                    `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    ensureComponentDefaults: () => {
        if (!DB.data.data || typeof DB.data.data !== 'object') DB.data.data = {};
        if (!Array.isArray(DB.data.data.partComponentCards)) DB.data.data.partComponentCards = [];
        if (!Array.isArray(DB.data.data.semiFinishedCards)) DB.data.data.semiFinishedCards = [];
        if (!Array.isArray(DB.data.data.partWorkOrders)) DB.data.data.partWorkOrders = [];
        if (!DB.data.meta || typeof DB.data.meta !== 'object') DB.data.meta = {};
        if (!DB.data.meta.options || typeof DB.data.meta.options !== 'object') DB.data.meta.options = {};
        if (!Array.isArray(DB.data.meta.options.partGroups) || DB.data.meta.options.partGroups.length === 0) {
            DB.data.meta.options.partGroups = ['Genel'];
        }
        if (!Array.isArray(DB.data.meta.options.partSubGroups) || DB.data.meta.options.partSubGroups.length === 0) {
            DB.data.meta.options.partSubGroups = ['Genel'];
        }

        const groups = ProductLibraryModule.getPartGroups();
        if (!groups.includes(ProductLibraryModule.state.componentDraftGroup)) {
            ProductLibraryModule.state.componentDraftGroup = groups[0] || '';
        }
        if (!ProductLibraryModule.state.componentCategoryExpanded || typeof ProductLibraryModule.state.componentCategoryExpanded !== 'object') {
            ProductLibraryModule.state.componentCategoryExpanded = {};
        }
        const libraryKind = String(ProductLibraryModule.state.componentLibraryKind || 'PART').trim().toUpperCase();
        ProductLibraryModule.state.componentLibraryKind = libraryKind === 'SEMI' ? 'SEMI' : 'PART';
        ProductLibraryModule.state.componentDraftColorType = ProductLibraryModule.normalizeColorType(ProductLibraryModule.state.componentDraftColorType || '');
        if (!ProductLibraryModule.state.componentDraftColorType) {
            ProductLibraryModule.state.componentDraftColorCode = '';
        }
    },

    normalizeComponentLibraryKind: (kind) => {
        const raw = String(kind || '').trim().toUpperCase();
        return raw === 'SEMI' ? 'SEMI' : 'PART';
    },

    getComponentCollectionKey: (kind) => {
        return ProductLibraryModule.normalizeComponentLibraryKind(kind) === 'SEMI'
            ? 'semiFinishedCards'
            : 'partComponentCards';
    },

    getComponentCodePrefix: (kind) => {
        return ProductLibraryModule.normalizeComponentLibraryKind(kind) === 'SEMI' ? 'YRM' : 'PRC';
    },

    getComponentCodeRegex: (kind) => {
        return ProductLibraryModule.normalizeComponentLibraryKind(kind) === 'SEMI'
            ? /^YRM-\d{6}$/
            : /^PRC-\d{6}$/;
    },

    getComponentLibraryTitle: (kind) => {
        return ProductLibraryModule.normalizeComponentLibraryKind(kind) === 'SEMI'
            ? 'Yari Mamul Kutuphanesi'
            : 'Parca ve Bilesen';
    },

    getActiveComponentLibraryKind: () => {
        return ProductLibraryModule.normalizeComponentLibraryKind(ProductLibraryModule.state.componentLibraryKind || 'PART');
    },

    getComponentWorkspaceByKind: (kind) => {
        return ProductLibraryModule.normalizeComponentLibraryKind(kind) === 'SEMI'
            ? 'semi-components'
            : 'components';
    },

    getPartGroups: () => {
        const all = Array.isArray(DB.data?.meta?.options?.partGroups) ? DB.data.meta.options.partGroups : ['Genel'];
        const clean = Array.from(new Set(all.map(x => String(x || '').trim()).filter(Boolean)));
        return clean.sort((a, b) => a.localeCompare(b, 'tr'));
    },

    getPartSubGroups: () => {
        const all = Array.isArray(DB.data?.meta?.options?.partSubGroups) ? DB.data.meta.options.partSubGroups : ['Genel'];
        const clean = Array.from(new Set(all.map(x => String(x || '').trim()).filter(Boolean)));
        return clean.sort((a, b) => a.localeCompare(b, 'tr'));
    },
    resolveComponentColorType: (row) => {
        const fromRow = ProductLibraryModule.normalizeColorType(row?.colorType || '');
        if (fromRow) return fromRow;
        const fromCode = ProductLibraryModule.inferColorTypeFromCode(row?.colorCode || '');
        if (fromCode) return fromCode;
        const colorName = String(row?.subGroup || '').trim().toLowerCase();
        if (!colorName) return '';
        const matches = ProductLibraryModule.getColorLibraryItems().filter(item =>
            String(item?.name || '').trim().toLowerCase() === colorName
        );
        const types = Array.from(new Set(matches.map(item => ProductLibraryModule.normalizeColorType(item?.type || '')).filter(Boolean)));
        if (types.length === 1) return types[0];
        return '';
    },
    setComponentColorType: (type) => {
        ProductLibraryModule.state.componentDraftColorType = ProductLibraryModule.normalizeColorType(type);
        ProductLibraryModule.state.componentDraftSubGroup = '';
        ProductLibraryModule.state.componentDraftColorCode = '';
        UI.renderCurrentPage();
    },
    setComponentColor: (name, code = '') => {
        ProductLibraryModule.state.componentDraftSubGroup = String(name || '').trim();
        ProductLibraryModule.state.componentDraftColorCode = String(code || '').trim().toUpperCase();
    },
    setComponentSearchColorType: (type) => {
        if (!ProductLibraryModule.state.componentFilters || typeof ProductLibraryModule.state.componentFilters !== 'object') {
            ProductLibraryModule.state.componentFilters = { name: '', group: '', colorType: '', subGroup: '', code: '' };
        }
        ProductLibraryModule.state.componentFilters.colorType = ProductLibraryModule.normalizeColorType(type);
        ProductLibraryModule.state.componentFilters.subGroup = '';
        UI.renderCurrentPage();
    },

    setComponentFilter: (field, value, focusId = '') => {
        if (!ProductLibraryModule.state.componentFilters || typeof ProductLibraryModule.state.componentFilters !== 'object') {
            ProductLibraryModule.state.componentFilters = { name: '', group: '', colorType: '', subGroup: '', code: '' };
        }
        if (!['name', 'group', 'colorType', 'subGroup', 'code'].includes(field)) return;
        if (field === 'colorType') {
            ProductLibraryModule.state.componentFilters.colorType = ProductLibraryModule.normalizeColorType(value || '');
            ProductLibraryModule.state.componentFilters.subGroup = '';
        } else {
            ProductLibraryModule.state.componentFilters[field] = String(value || '');
        }
        UI.renderCurrentPage();
        if (!focusId) return;
        setTimeout(() => {
            const el = document.getElementById(focusId);
            if (!el) return;
            el.focus();
            const len = el.value.length;
            try { el.setSelectionRange(len, len); } catch (_) { }
        }, 0);
    },

    toggleComponentCategorySection: (groupKey) => {
        const key = String(groupKey || '').trim();
        if (!key) return;
        const current = (ProductLibraryModule.state.componentCategoryExpanded && typeof ProductLibraryModule.state.componentCategoryExpanded === 'object')
            ? ProductLibraryModule.state.componentCategoryExpanded
            : {};
        ProductLibraryModule.state.componentCategoryExpanded = {
            ...current,
            [key]: !current[key]
        };
        UI.renderCurrentPage();
    },

    openComponentForm: () => {
        const libraryKind = ProductLibraryModule.getActiveComponentLibraryKind();
        ProductLibraryModule.state.componentViewingId = null;
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.componentFormOpen = true;
        ProductLibraryModule.state.componentEditingId = null;
        ProductLibraryModule.state.componentRoutePicker = null;
        ProductLibraryModule.state.componentDraftCode = ProductLibraryModule.generateComponentCode(null, libraryKind);
        ProductLibraryModule.state.componentDraftName = '';
        ProductLibraryModule.state.componentDraftMasterCode = '';
        ProductLibraryModule.state.componentDraftRoutes = [];
        ProductLibraryModule.state.componentDraftRouteStationId = '';
        ProductLibraryModule.state.componentDraftNote = '';
        ProductLibraryModule.state.componentDraftFiles = [];
        const groups = ProductLibraryModule.getPartGroups();
        ProductLibraryModule.state.componentDraftGroup = groups[0] || '';
        ProductLibraryModule.state.componentDraftColorType = '';
        ProductLibraryModule.state.componentDraftSubGroup = '';
        ProductLibraryModule.state.componentDraftColorCode = '';
        UI.renderCurrentPage();
    },

    resetComponentDraft: (close = true) => {
        ProductLibraryModule.state.componentEditingId = null;
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.componentRoutePicker = null;
        ProductLibraryModule.state.componentDraftCode = '';
        ProductLibraryModule.state.componentDraftName = '';
        ProductLibraryModule.state.componentDraftMasterCode = '';
        ProductLibraryModule.state.componentDraftRoutes = [];
        ProductLibraryModule.state.componentDraftRouteStationId = '';
        ProductLibraryModule.state.componentDraftNote = '';
        ProductLibraryModule.state.componentDraftFiles = [];
        if (close) ProductLibraryModule.state.componentFormOpen = false;
        const groups = ProductLibraryModule.getPartGroups();
        ProductLibraryModule.state.componentDraftGroup = groups[0] || '';
        ProductLibraryModule.state.componentDraftColorType = '';
        ProductLibraryModule.state.componentDraftSubGroup = '';
        ProductLibraryModule.state.componentDraftColorCode = '';
        UI.renderCurrentPage();
    },

    openMasterPickerForComponent: () => {
        ProductLibraryModule.state.masterPickerSource = 'component';
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.masterFormOpen = false;
        ProductLibraryModule.state.masterEditingId = null;
        ProductLibraryModule.state.workspaceView = 'master';
        UI.renderCurrentPage();
    },

    openMasterPickerForAssembly: () => {
        ProductLibraryModule.state.masterPickerSource = 'assembly-master';
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.masterFormOpen = false;
        ProductLibraryModule.state.masterEditingId = null;
        ProductLibraryModule.state.workspaceView = 'master';
        UI.renderCurrentPage();
    },

    openComponentPickerForAssembly: () => {
        ProductLibraryModule.state.masterPickerSource = '';
        ProductLibraryModule.state.componentPickerSource = 'assembly-component';
        ProductLibraryModule.state.componentLibraryKind = 'PART';
        ProductLibraryModule.state.componentViewingId = null;
        ProductLibraryModule.state.componentFormOpen = false;
        ProductLibraryModule.state.workspaceView = 'components';
        UI.renderCurrentPage();
    },

    selectComponentForAssembly: (id) => {
        const row = ProductLibraryModule.getComponentCardById(id);
        if (!row) return;
        const added = ProductLibraryModule.addAssemblyDraftItem('component', row.id);
        if (!added) return;
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.workspaceView = 'assembly';
        ProductLibraryModule.state.assemblyFormOpen = true;
        ProductLibraryModule.state.assemblyViewingId = null;
        UI.renderCurrentPage();
    },

    cancelComponentPicker: () => {
        const src = String(ProductLibraryModule.state.componentPickerSource || '');
        const pendingRowId = String(ProductLibraryModule.state.modelComponentPickerRowId || '').trim();
        ProductLibraryModule.state.masterPickerSource = '';
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.modelComponentPickerRowId = '';
        ProductLibraryModule.state.salesVariationComponentPickerRowId = '';
        if (src === 'model-component' || src === 'model-component-row') {
            if (src === 'model-component-row' && pendingRowId) {
                const items = Array.isArray(ProductLibraryModule.state.modelDraftItems) ? ProductLibraryModule.state.modelDraftItems : [];
                ProductLibraryModule.state.modelDraftItems = items.filter((item) =>
                    String(item?.id || '') !== pendingRowId || String(item?.code || '').trim()
                );
            }
            ProductLibraryModule.state.workspaceView = 'models';
            ProductLibraryModule.state.modelFormOpen = true;
            ProductLibraryModule.state.modelViewingId = null;
        } else if (src === 'sales-variation-component' || src === 'sales-variation-component-row') {
            ProductLibraryModule.state.workspaceView = 'sales-products';
        } else {
            ProductLibraryModule.state.workspaceView = 'assembly';
            ProductLibraryModule.state.assemblyFormOpen = true;
            ProductLibraryModule.state.assemblyViewingId = null;
        }
        UI.renderCurrentPage();
    },

    clearComponentMasterCode: () => {
        if (!ProductLibraryModule.confirmDestructiveAction()) return;
        ProductLibraryModule.state.componentDraftMasterCode = '';
        UI.renderCurrentPage();
    },

    getComponentDictionaryMeta: (kind) => {
        const isGroup = String(kind || '') === 'group';
        return {
            kind: isGroup ? 'group' : 'subGroup',
            key: isGroup ? 'partGroups' : 'partSubGroups',
            title: isGroup ? 'Urun Grubu + Yonet' : 'Urun Alt Grubu + Yonet'
        };
    },

    syncComponentDictionaryDrafts: () => {
        const groups = ProductLibraryModule.getPartGroups();
        if (!groups.includes(ProductLibraryModule.state.componentDraftGroup)) {
            ProductLibraryModule.state.componentDraftGroup = groups[0] || '';
        }
    },

    openComponentDictionary: (kind) => {
        const meta = ProductLibraryModule.getComponentDictionaryMeta(kind);
        if (!DB.data.meta.options || typeof DB.data.meta.options !== 'object') DB.data.meta.options = {};
        if (!Array.isArray(DB.data.meta.options[meta.key]) || DB.data.meta.options[meta.key].length === 0) {
            DB.data.meta.options[meta.key] = ['Genel'];
        }

        const items = meta.key === 'partGroups'
            ? ProductLibraryModule.getPartGroups()
            : ProductLibraryModule.getPartSubGroups();

        Modal.open(meta.title, `
            <div style="display:flex; flex-direction:column; gap:0.8rem;">
                <div style="display:grid; grid-template-columns:1fr auto; gap:0.5rem;">
                    <input id="component_dict_item" placeholder="yeni deger" style="height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                    <button class="btn-primary" onclick="ProductLibraryModule.addComponentDictionaryOption('${meta.kind}')" style="height:38px; border-radius:0.55rem;">ekle</button>
                </div>
                <div style="display:flex; flex-direction:column; gap:0.4rem; max-height:350px; overflow:auto;">
                    ${items.map((item) => `
                        <div style="display:grid; grid-template-columns:1fr auto auto; gap:0.45rem; align-items:center; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem 0.55rem;">
                            <div style="font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(item)}</div>
                            <button class="btn-sm" onclick='ProductLibraryModule.renameComponentDictionaryOption(${JSON.stringify(meta.kind)}, ${JSON.stringify(item)})'>duzenle</button>
                            <button class="btn-sm" onclick='ProductLibraryModule.removeComponentDictionaryOption(${JSON.stringify(meta.kind)}, ${JSON.stringify(item)})'>sil</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `, { maxWidth: '620px' });
    },

    addComponentDictionaryOption: async (kind) => {
        const meta = ProductLibraryModule.getComponentDictionaryMeta(kind);
        if (!DB.data.meta.options || typeof DB.data.meta.options !== 'object') DB.data.meta.options = {};
        if (!Array.isArray(DB.data.meta.options[meta.key])) DB.data.meta.options[meta.key] = ['Genel'];

        const val = String(document.getElementById('component_dict_item')?.value || '').trim();
        if (!val) return;

        const list = DB.data.meta.options[meta.key];
        const exists = list.some(x =>
            ProductLibraryModule.normalizeAsciiUpper(String(x || '')) === ProductLibraryModule.normalizeAsciiUpper(val)
        );
        if (exists) return alert('Bu deger zaten var.');

        list.push(val);
        DB.data.meta.options[meta.key] = Array.from(new Set(list.map(x => String(x || '').trim()).filter(Boolean)));
        ProductLibraryModule.syncComponentDictionaryDrafts();
        await DB.save();
        ProductLibraryModule.openComponentDictionary(meta.kind);
        UI.renderCurrentPage();
    },

    renameComponentDictionaryOption: async (kind, currentValue) => {
        const meta = ProductLibraryModule.getComponentDictionaryMeta(kind);
        if (!Array.isArray(DB.data.meta.options?.[meta.key])) return;
        const list = DB.data.meta.options[meta.key];
        const currentNorm = ProductLibraryModule.normalizeAsciiUpper(String(currentValue || ''));
        const idx = list.findIndex(x => ProductLibraryModule.normalizeAsciiUpper(String(x || '')) === currentNorm);
        if (idx < 0) return;

        const oldValue = String(list[idx] || '').trim();
        if (!oldValue) return;

        const nextRaw = prompt('Yeni deger:', oldValue);
        if (nextRaw === null) return;

        const nextValue = String(nextRaw || '').trim();
        if (!nextValue) return alert('Deger bos olamaz.');

        const oldNorm = ProductLibraryModule.normalizeAsciiUpper(oldValue);
        const nextNorm = ProductLibraryModule.normalizeAsciiUpper(nextValue);
        if (!nextNorm) return alert('Deger gecersiz.');
        if (oldNorm === nextNorm) {
            list[idx] = nextValue;
            DB.data.meta.options[meta.key] = Array.from(new Set(list.map(x => String(x || '').trim()).filter(Boolean)));
            ProductLibraryModule.syncComponentDictionaryDrafts();
            await DB.save();
            ProductLibraryModule.openComponentDictionary(meta.kind);
            UI.renderCurrentPage();
            return;
        }

        const exists = list.some((x, i) => {
            if (i === idx) return false;
            return ProductLibraryModule.normalizeAsciiUpper(String(x || '')) === nextNorm;
        });
        if (exists) return alert('Bu deger zaten var.');

        list[idx] = nextValue;
        DB.data.meta.options[meta.key] = Array.from(new Set(list.map(x => String(x || '').trim()).filter(Boolean)));

        if (meta.key === 'partGroups') {
            const partRows = Array.isArray(DB.data?.data?.partComponentCards) ? DB.data.data.partComponentCards : [];
            const semiRows = Array.isArray(DB.data?.data?.semiFinishedCards) ? DB.data.data.semiFinishedCards : [];
            [...partRows, ...semiRows].forEach((row) => {
                if (!row || typeof row !== 'object') return;
                const rowGroup = String(row.group || '').trim();
                if (ProductLibraryModule.normalizeAsciiUpper(rowGroup) === oldNorm) row.group = nextValue;
            });
            const draftGroup = String(ProductLibraryModule.state.componentDraftGroup || '').trim();
            if (ProductLibraryModule.normalizeAsciiUpper(draftGroup) === oldNorm) {
                ProductLibraryModule.state.componentDraftGroup = nextValue;
            }
        } else if (meta.key === 'partSubGroups') {
            const partRows = Array.isArray(DB.data?.data?.partComponentCards) ? DB.data.data.partComponentCards : [];
            const semiRows = Array.isArray(DB.data?.data?.semiFinishedCards) ? DB.data.data.semiFinishedCards : [];
            [...partRows, ...semiRows].forEach((row) => {
                if (!row || typeof row !== 'object') return;
                const rowSubGroup = String(row.subGroup || '').trim();
                if (ProductLibraryModule.normalizeAsciiUpper(rowSubGroup) === oldNorm) row.subGroup = nextValue;
            });
            const draftSub = String(ProductLibraryModule.state.componentDraftSubGroup || '').trim();
            if (ProductLibraryModule.normalizeAsciiUpper(draftSub) === oldNorm) {
                ProductLibraryModule.state.componentDraftSubGroup = nextValue;
            }
        }

        ProductLibraryModule.syncComponentDictionaryDrafts();
        await DB.save();
        ProductLibraryModule.openComponentDictionary(meta.kind);
        UI.renderCurrentPage();
    },

    removeComponentDictionaryOption: async (kind, currentValue) => {
        const meta = ProductLibraryModule.getComponentDictionaryMeta(kind);
        if (!Array.isArray(DB.data.meta.options?.[meta.key])) return;
        const list = DB.data.meta.options[meta.key];
        const currentNorm = ProductLibraryModule.normalizeAsciiUpper(String(currentValue || ''));
        const idx = list.findIndex(x => ProductLibraryModule.normalizeAsciiUpper(String(x || '')) === currentNorm);
        if (idx < 0) return;
        if (list.length <= 1) return alert('En az bir secenek kalmalidir.');

        if (!confirm(`"${String(list[idx] || '')}" silinsin mi?`)) return;
        list.splice(idx, 1);
        if (list.length === 0) list.push('Genel');

        DB.data.meta.options[meta.key] = Array.from(new Set(list.map(x => String(x || '').trim()).filter(Boolean)));
        ProductLibraryModule.syncComponentDictionaryDrafts();
        await DB.save();
        ProductLibraryModule.openComponentDictionary(meta.kind);
        UI.renderCurrentPage();
    },

    getComponentCardsByKind: (kind) => {
        const key = ProductLibraryModule.getComponentCollectionKey(kind);
        return (DB.data.data[key] || [])
            .filter(row => !row?.archived_at)
            .map((row) => {
                const resolved = ProductLibraryModule.resolveLinkedColorInfo({
                    colorType: row?.colorType || '',
                    colorCode: row?.colorCode || '',
                    colorName: row?.subGroup || ''
                });
                return {
                    ...row,
                    colorType: resolved.type || String(row?.colorType || '').trim(),
                    colorCode: resolved.code || String(row?.colorCode || '').trim().toUpperCase(),
                    subGroup: resolved.name || String(row?.subGroup || '').trim()
                };
            })
            .slice()
            .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
    },

    getComponentCards: () => {
        return ProductLibraryModule.getComponentCardsByKind('PART');
    },

    getSemiFinishedCards: () => {
        return ProductLibraryModule.getComponentCardsByKind('SEMI');
    },

    getActiveComponentCards: () => {
        return ProductLibraryModule.getComponentCardsByKind(ProductLibraryModule.getActiveComponentLibraryKind());
    },

    getComponentCardById: (id) => {
        return ProductLibraryModule.getComponentCardsByKind('PART').find(row => String(row.id) === String(id)) || null;
    },

    getSemiFinishedCardById: (id) => {
        return ProductLibraryModule.getComponentCardsByKind('SEMI').find(row => String(row.id) === String(id)) || null;
    },

    getActiveComponentCardById: (id) => {
        return ProductLibraryModule.getComponentCardsByKind(ProductLibraryModule.getActiveComponentLibraryKind()).find(row => String(row.id) === String(id)) || null;
    },
    normalizeSupplierRouteStationId: (supplierId) => `supplier:${String(supplierId || '').trim()}`,
    isSupplierRouteStationId: (stationId) => String(stationId || '').trim().toLowerCase().startsWith('supplier:'),
    isFasonSupplierTag: (tag) => {
        const value = ProductLibraryModule.normalizeAsciiUpper(String(tag || ''));
        return value === 'FASON' || value === 'SERBEST DIS TEDARIKCI' || value === 'DIS TEDARIKCI';
    },
    getFasonRouteSuppliers: () => {
        return (Array.isArray(DB.data?.data?.suppliers) ? DB.data.data.suppliers : [])
            .filter(row => Array.isArray(row?.tags) && row.tags.some(tag => ProductLibraryModule.isFasonSupplierTag(tag)))
            .slice()
            .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'tr'));
    },
    getRouteStationOptions: () => {
        const units = Array.isArray(DB.data?.data?.units) ? DB.data.data.units : [];
        const suppliers = ProductLibraryModule.getFasonRouteSuppliers();
        return [
            ...units.map(u => ({
                id: String(u?.id || '').trim(),
                name: String(u?.name || '').trim(),
                source: 'unit'
            })),
            ...suppliers.map(s => ({
                id: ProductLibraryModule.normalizeSupplierRouteStationId(s?.id || ''),
                name: String(s?.name || '').trim(),
                source: 'supplier',
                supplierId: String(s?.id || '').trim()
            }))
        ].filter(row => row.id && row.name);
    },
    getRouteStationMap: () => {
        const map = {};
        ProductLibraryModule.getRouteStationOptions().forEach(row => {
            map[String(row.id || '')] = String(row.name || row.id || '');
        });
        return map;
    },
    isValidRouteStationId: (stationId) => {
        const key = String(stationId || '').trim();
        if (!key) return false;
        return ProductLibraryModule.getRouteStationOptions().some(row => String(row.id || '') === key);
    },
    getRouteProcessDisplayValue: (routeRow) => {
        if (ProductLibraryModule.isSupplierRouteStationId(routeRow?.stationId || '')) {
            return 'FASON';
        }
        return String(routeRow?.processId || '').trim().toUpperCase();
    },

    getRouteProcessName: (routeRow) => {
        const stationId = String(routeRow?.stationId || '').trim();
        const code = String(ProductLibraryModule.getRouteProcessDisplayValue(routeRow) || '').trim().toUpperCase();
        if (!stationId || !code) return '';
        if (ProductLibraryModule.isSupplierRouteStationId(stationId)) return 'Fason';

        const units = Array.isArray(DB.data?.data?.units) ? DB.data.data.units : [];
        const unit = units.find(row => String(row?.id || '') === stationId) || null;
        const unitName = String(unit?.name || '').toUpperCase();
        const findByCode = (list, fields, labelFields, withUnit = true) => {
            if (!Array.isArray(list)) return null;
            const row = list.find(item => {
                if (withUnit && String(item?.unitId || '') !== stationId) return false;
                return fields.some(field => String(item?.[field] || '').trim().toUpperCase() === code);
            });
            if (!row) return '';
            for (const field of labelFields) {
                const value = String(row?.[field] || '').trim();
                if (value) return value;
            }
            return '';
        };

        if (stationId === 'u_dtm') {
            return findByCode(DB.data?.data?.depoTransferTasks, ['taskCode'], ['taskName'], false);
        }
        if (unitName.includes('CNC')) {
            return findByCode(DB.data?.data?.cncCards, ['cncId'], ['productName', 'name']);
        }
        if (stationId === 'u2' || unitName.includes('EKSTR')) {
            return findByCode(DB.data?.data?.extruderLibraryCards, ['cardCode'], ['productName', 'name']);
        }
        if (unitName.includes('TESTERE')) {
            return findByCode(DB.data?.data?.sawCutOrders, ['code'], ['processName', 'productName', 'name']);
        }
        if (stationId === 'u9' || unitName.includes('PVD') || unitName.includes('PWD')) {
            return findByCode(DB.data?.data?.pvdCards, ['cardCode'], ['productName', 'name']);
        }
        if (stationId === 'u11' || unitName.includes('ELOKSAL')) {
            return findByCode(DB.data?.data?.eloksalCards, ['cardCode'], ['productName', 'name']);
        }
        if (stationId === 'u10' || unitName.includes('IBRAHIM POLISAJ')) {
            return findByCode(DB.data?.data?.ibrahimPolishCards, ['cardCode'], ['productName', 'processName', 'name']);
        }
        if (stationId === 'u5' || unitName.includes('PLEKS') || unitName.includes('POLISAJ')) {
            return findByCode(DB.data?.data?.plexiPolishCards, ['cardCode'], ['processName', 'productName', 'name']);
        }
        if (stationId === 'u3' || unitName.includes('MONTAJ')) {
            return findByCode(DB.data?.data?.montageCards, ['cardCode', 'productCode'], ['productName', 'name']);
        }
        return '';
    },

    generateComponentCode: (exclude = null, kind = 'PART') => {
        const normalizedKind = ProductLibraryModule.normalizeComponentLibraryKind(kind);
        const key = ProductLibraryModule.getComponentCollectionKey(normalizedKind);
        const prefix = ProductLibraryModule.getComponentCodePrefix(normalizedKind);
        const all = DB.data.data[key] || [];
        let maxNum = 0;
        all.forEach(row => {
            if (exclude && String(exclude) === String(row?.id || '')) return;
            const code = String(row?.code || '').trim().toUpperCase();
            const m = code.match(new RegExp(`^${prefix}-(\\d{6})$`));
            if (!m) return;
            const n = Number(m[1]);
            if (Number.isFinite(n) && n > maxNum) maxNum = n;
        });
        let nextNum = maxNum + 1;
        let candidate = `${prefix}-${String(nextNum).padStart(6, '0')}`;
        while (ProductLibraryModule.isGlobalCodeTaken(candidate, exclude ? { collection: key, id: exclude, field: 'code' } : null)) {
            nextNum += 1;
            candidate = `${prefix}-${String(nextNum).padStart(6, '0')}`;
        }
        return candidate;
    },

    buildComponentRouteSignature: (routes = []) => {
        return (Array.isArray(routes) ? routes : [])
            .map(route => {
                const stationId = String(route?.stationId || '').trim().toUpperCase();
                const processId = String(ProductLibraryModule.getRouteProcessDisplayValue(route) || '').trim().toUpperCase();
                return stationId ? `${stationId}:${processId}` : '';
            })
            .filter(Boolean)
            .join('|');
    },

    buildComponentDuplicateSignature: (row = {}) => {
        return [
            ProductLibraryModule.normalizeAsciiUpper(row?.name || ''),
            ProductLibraryModule.normalizeAsciiUpper(row?.group || ''),
            ProductLibraryModule.normalizeColorType(row?.colorType || ''),
            ProductLibraryModule.normalizeAsciiUpper(row?.subGroup || ''),
            ProductLibraryModule.normalizeAsciiUpper(row?.colorCode || ''),
            ProductLibraryModule.normalizeAsciiUpper(row?.masterCode || ''),
            ProductLibraryModule.buildComponentRouteSignature(row?.routes || [])
        ].join('||');
    },

    findDuplicateComponentCard: (row = {}, excludeId = '', kind = 'PART') => {
        const targetSignature = ProductLibraryModule.buildComponentDuplicateSignature(row);
        if (!targetSignature) return null;
        const key = ProductLibraryModule.getComponentCollectionKey(kind);
        const all = Array.isArray(DB.data?.data?.[key]) ? DB.data.data[key] : [];
        return all.find(item => {
            if (excludeId && String(item?.id || '') === String(excludeId)) return false;
            return ProductLibraryModule.buildComponentDuplicateSignature(item) === targetSignature;
        }) || null;
    },

    loadComponentDraftFromRow: (row, options = {}) => {
        if (!row || typeof row !== 'object') return;
        const libraryKind = ProductLibraryModule.getActiveComponentLibraryKind();
        const hasEditingId = Object.prototype.hasOwnProperty.call(options, 'editingId');
        const nextEditingId = hasEditingId ? options.editingId : row.id;
        const nextCode = Object.prototype.hasOwnProperty.call(options, 'code')
            ? options.code
            : (row.code || ProductLibraryModule.generateComponentCode(nextEditingId || row.id, libraryKind));
        ProductLibraryModule.state.componentViewingId = null;
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.componentRoutePicker = null;
        ProductLibraryModule.state.componentFormOpen = options.formOpen === false ? false : true;
        ProductLibraryModule.state.componentEditingId = nextEditingId || null;
        ProductLibraryModule.state.componentDraftCode = nextCode;
        ProductLibraryModule.state.componentDraftName = row.name || '';
        ProductLibraryModule.state.componentDraftGroup = row.group || ProductLibraryModule.getPartGroups()[0] || '';
        ProductLibraryModule.state.componentDraftColorType = ProductLibraryModule.resolveComponentColorType(row);
        ProductLibraryModule.state.componentDraftSubGroup = row.subGroup || '';
        ProductLibraryModule.state.componentDraftColorCode = String(row.colorCode || '').trim().toUpperCase();
        ProductLibraryModule.state.componentDraftMasterCode = row.masterCode || '';
        ProductLibraryModule.state.componentDraftRoutes = Array.isArray(row.routes)
            ? row.routes.map(r => ({
                id: String(r?.id || crypto.randomUUID()),
                stationId: String(r?.stationId || ''),
                processId: String(r?.processId || '')
            }))
            : [];
        ProductLibraryModule.state.componentDraftRouteStationId = '';
        ProductLibraryModule.state.componentDraftNote = row.note || '';
        ProductLibraryModule.state.componentDraftFiles = Array.isArray(row.attachments)
            ? row.attachments
                .map(file => ({
                    name: String(file?.name || 'dosya'),
                    type: String(file?.type || ''),
                    size: Number(file?.size || 0),
                    data: String(file?.data || '')
                }))
                .filter(file => file.data)
            : [];
    },

    startEditComponentCard: (id) => {
        const row = ProductLibraryModule.getActiveComponentCardById(id);
        if (!row) return;
        ProductLibraryModule.loadComponentDraftFromRow(row);
        UI.renderCurrentPage();
    },

    openComponentCardView: (id, returnContext = null) => {
        ProductLibraryModule.state.componentViewingId = String(id || '');
        ProductLibraryModule.state.componentViewPreviewIndex = 0;
        ProductLibraryModule.state.componentViewReturnContext = returnContext && typeof returnContext === 'object'
            ? { ...returnContext }
            : null;
        ProductLibraryModule.state.componentFormOpen = false;
        UI.renderCurrentPage();
    },

    closeComponentCardView: () => {
        const returnContext = ProductLibraryModule.state.componentViewReturnContext;
        ProductLibraryModule.state.componentViewingId = null;
        ProductLibraryModule.state.componentViewPreviewIndex = 0;
        ProductLibraryModule.state.componentViewReturnContext = null;
        if (returnContext?.page === 'units' && returnContext?.view === 'workOrderPlanning') {
            if (typeof Router !== 'undefined') Router.navigate('units', { fromBack: true });
            if (typeof UnitModule !== 'undefined' && UnitModule && typeof UnitModule.openWorkOrderPlanning === 'function') {
                UnitModule.openWorkOrderPlanning(returnContext.unitId || UnitModule.state.activeUnitId || null);
                return;
            }
        }
        if (returnContext?.page === 'stock' && returnContext?.view === 'workOrderPlanning') {
            if (typeof Router !== 'undefined') Router.navigate('stock', { fromBack: true });
            if (typeof StockModule !== 'undefined' && StockModule && typeof StockModule.openWorkspace === 'function') {
                StockModule.openWorkspace('work-order-planning');
                return;
            }
        }
        if (returnContext?.page === 'stock' && returnContext?.view === 'inventory-registration') {
            if (typeof Router !== 'undefined') Router.navigate('stock', { fromBack: true });
            if (typeof StockModule !== 'undefined' && StockModule) {
                StockModule.state.workspaceView = 'inventory-registration';
                if (typeof StockModule.ensureInventoryRegistrationDraftState === 'function') {
                    StockModule.ensureInventoryRegistrationDraftState();
                }
                if (typeof returnContext?.formOpen === 'boolean') {
                    StockModule.state.inventoryRegistrationFormOpen = returnContext.formOpen;
                }
                if (typeof UI !== 'undefined' && UI && typeof UI.renderCurrentPage === 'function') {
                    UI.renderCurrentPage();
                    return;
                }
            }
        }
        if (returnContext?.workspaceView === 'assembly') {
            ProductLibraryModule.state.workspaceView = 'assembly';
            ProductLibraryModule.state.assemblyFormOpen = true;
            UI.renderCurrentPage();
            setTimeout(() => document.getElementById('assembly_form_anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
            return;
        }
        if (returnContext?.workspaceView === 'models') {
            ProductLibraryModule.state.workspaceView = 'models';
            ProductLibraryModule.state.modelFormOpen = true;
            ProductLibraryModule.state.modelViewingId = null;
            UI.renderCurrentPage();
            setTimeout(() => document.getElementById('model_form_anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
            return;
        }
        UI.renderCurrentPage();
    },

    selectComponentViewFile: (index) => {
        ProductLibraryModule.state.componentViewPreviewIndex = Math.max(0, Number(index) || 0);
        UI.renderCurrentPage();
    },

    confirmDestructiveAction: (message = 'Silmek istediginizden emin misiniz?') => {
        if (typeof window === 'undefined' || typeof window.confirm !== 'function') return true;
        return window.confirm(message);
    },

    setComponentRouteStation: (value) => {
        ProductLibraryModule.state.componentDraftRouteStationId = String(value || '').trim();
    },

    openComponentRouteProcessPicker: (routeId) => {
        const list = Array.isArray(ProductLibraryModule.state.componentDraftRoutes) ? ProductLibraryModule.state.componentDraftRoutes : [];
        const row = list.find(x => String(x.id) === String(routeId));
        if (!row) return alert('Rota satiri bulunamadi.');

        const stationId = String(row.stationId || '').trim();
        if (!stationId) return alert('Lutfen once istasyon seciniz.');
        if (ProductLibraryModule.isSupplierRouteStationId(stationId)) {
            row.processId = 'FASON';
            UI.renderCurrentPage();
            return;
        }

        ProductLibraryModule.state.componentRoutePicker = {
            routeId: String(routeId),
            stationId,
            routeSource: 'component'
        };

        if (typeof Router === 'undefined') {
            alert('Yonlendirme modulu bulunamadi.');
            return;
        }
        Router.navigate('units');
        if (typeof UnitModule !== 'undefined' && UnitModule && typeof UnitModule.openUnitLibrary === 'function') {
            UnitModule.openUnitLibrary(stationId);
        }
    },

    applyComponentRouteProcessFromPicker: (processId) => {
        const picker = ProductLibraryModule.state.componentRoutePicker;
        if (!picker || !picker.routeId) return false;

        const code = String(processId || '').trim().toUpperCase();
        if (!code) return false;

        const routeSource = String(picker.routeSource || 'component');
        const list = routeSource === 'assembly'
            ? (Array.isArray(ProductLibraryModule.state.assemblyDraftRoutes) ? ProductLibraryModule.state.assemblyDraftRoutes : [])
            : (Array.isArray(ProductLibraryModule.state.componentDraftRoutes) ? ProductLibraryModule.state.componentDraftRoutes : []);
        const row = list.find(x => String(x.id) === String(picker.routeId));
        if (!row) {
            ProductLibraryModule.state.componentRoutePicker = null;
            alert('Rota satiri bulunamadi.');
            return false;
        }

        row.processId = code;
        ProductLibraryModule.state.componentRoutePicker = null;
        if (routeSource === 'assembly') {
            ProductLibraryModule.state.workspaceView = 'assembly';
            ProductLibraryModule.state.assemblyFormOpen = true;
            ProductLibraryModule.state.assemblyViewingId = null;
        } else {
            ProductLibraryModule.state.workspaceView = ProductLibraryModule.getComponentWorkspaceByKind(ProductLibraryModule.getActiveComponentLibraryKind());
            ProductLibraryModule.state.componentFormOpen = true;
            ProductLibraryModule.state.componentViewingId = null;
        }

        if (typeof Router !== 'undefined') {
            Router.navigate('products', { fromBack: true, preserveProductsState: true });
        } else {
            UI.renderCurrentPage();
        }
        return true;
    },

    cancelComponentRouteProcessPicker: () => {
        const picker = ProductLibraryModule.state.componentRoutePicker;
        if (!picker) return;
        const routeSource = String(picker.routeSource || 'component');
        ProductLibraryModule.state.componentRoutePicker = null;
        if (routeSource === 'assembly') {
            ProductLibraryModule.state.workspaceView = 'assembly';
            ProductLibraryModule.state.assemblyFormOpen = true;
            ProductLibraryModule.state.assemblyViewingId = null;
        } else {
            ProductLibraryModule.state.workspaceView = ProductLibraryModule.getComponentWorkspaceByKind(ProductLibraryModule.getActiveComponentLibraryKind());
            ProductLibraryModule.state.componentFormOpen = true;
            ProductLibraryModule.state.componentViewingId = null;
        }

        if (typeof Router !== 'undefined') {
            Router.navigate('products', { fromBack: true, preserveProductsState: true });
        } else {
            UI.renderCurrentPage();
        }
    },

    addComponentRouteRow: () => {
        const stationId = String(ProductLibraryModule.state.componentDraftRouteStationId || '').trim();
        if (!stationId) {
            alert('Lutfen istasyon seciniz.');
            return;
        }
        if (!Array.isArray(ProductLibraryModule.state.componentDraftRoutes)) {
            ProductLibraryModule.state.componentDraftRoutes = [];
        }
        const routeId = crypto.randomUUID();
        ProductLibraryModule.state.componentDraftRoutes.push({
            id: routeId,
            stationId,
            processId: ProductLibraryModule.isSupplierRouteStationId(stationId) ? 'FASON' : ''
        });
        ProductLibraryModule.state.componentDraftRouteStationId = '';
        if (stationId === 'u_dtm') {
            ProductLibraryModule.openComponentRouteProcessPicker(routeId);
            return;
        }
        UI.renderCurrentPage();
    },

    setComponentRouteProcess: (routeId, value) => {
        const list = Array.isArray(ProductLibraryModule.state.componentDraftRoutes) ? ProductLibraryModule.state.componentDraftRoutes : [];
        const row = list.find(x => String(x.id) === String(routeId));
        if (!row) return;
        row.processId = String(value || '').trim().toUpperCase();
    },

    editComponentRouteRow: (routeId) => {
        ProductLibraryModule.openComponentRouteProcessPicker(routeId);
    },

    removeComponentRouteRow: (routeId) => {
        const list = Array.isArray(ProductLibraryModule.state.componentDraftRoutes) ? ProductLibraryModule.state.componentDraftRoutes : [];
        if (!list.some(x => String(x.id) === String(routeId))) return;
        if (!ProductLibraryModule.confirmDestructiveAction()) return;
        ProductLibraryModule.state.componentDraftRoutes = list.filter(x => String(x.id) !== String(routeId));
        UI.renderCurrentPage();
    },

    readFileAsDataUrl: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('Dosya okunamadi'));
            reader.readAsDataURL(file);
        });
    },

    handleComponentFiles: async (input) => {
        const fileList = Array.from(input?.files || []);
        if (fileList.length === 0) return;

        const maxFileSize = 20 * 1024 * 1024;
        const allowed = ['pdf', 'jpg', 'jpeg', 'png'];
        const normalized = [];

        for (const file of fileList) {
            const name = String(file?.name || '');
            const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
            if (!allowed.includes(ext)) {
                alert(`Desteklenmeyen dosya: ${name}`);
                continue;
            }
            if (Number(file?.size || 0) > maxFileSize) {
                alert(`${name} 20MB sinirini asiyor.`);
                continue;
            }
            try {
                const data = await ProductLibraryModule.readFileAsDataUrl(file);
                normalized.push({
                    name,
                    type: String(file.type || ''),
                    size: Number(file.size || 0),
                    data
                });
            } catch (_) { }
        }

        if (normalized.length === 0) return;

        const existing = Array.isArray(ProductLibraryModule.state.componentDraftFiles)
            ? ProductLibraryModule.state.componentDraftFiles
            : [];
        const merged = [...existing];
        const seen = new Set(
            existing.map(file => `${String(file?.name || '').trim().toLowerCase()}|${Number(file?.size || 0)}|${String(file?.data || '').slice(0, 120)}`)
        );

        normalized.forEach(file => {
            const key = `${String(file?.name || '').trim().toLowerCase()}|${Number(file?.size || 0)}|${String(file?.data || '').slice(0, 120)}`;
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(file);
        });

        ProductLibraryModule.state.componentDraftFiles = merged;
        if (input) input.value = '';
        UI.renderCurrentPage();
    },

    removeComponentDraftFile: (index) => {
        const files = Array.isArray(ProductLibraryModule.state.componentDraftFiles)
            ? [...ProductLibraryModule.state.componentDraftFiles]
            : [];
        if (index < 0 || index >= files.length) return;
        if (!ProductLibraryModule.confirmDestructiveAction()) return;
        files.splice(index, 1);
        ProductLibraryModule.state.componentDraftFiles = files;
        UI.renderCurrentPage();
    },

    clearComponentDraftFiles: () => {
        if (!ProductLibraryModule.confirmDestructiveAction()) return;
        ProductLibraryModule.state.componentDraftFiles = [];
        UI.renderCurrentPage();
    },

    previewComponentDraftFile: (index) => {
        const files = Array.isArray(ProductLibraryModule.state.componentDraftFiles) ? ProductLibraryModule.state.componentDraftFiles : [];
        const file = files[index];
        if (!file?.data) return;
        ProductLibraryModule.openPreviewModal(file);
    },

    previewComponentCardFile: (cardId, index) => {
        const row = ProductLibraryModule.getActiveComponentCardById(cardId);
        if (!row) return;
        const files = Array.isArray(row.attachments) ? row.attachments : [];
        const file = files[index];
        if (!file?.data) return;
        ProductLibraryModule.openPreviewModal(file);
    },

    saveComponentCard: async (saveAsNew = false) => {
        const s = ProductLibraryModule.state;
        const libraryKind = ProductLibraryModule.getActiveComponentLibraryKind();
        const collectionKey = ProductLibraryModule.getComponentCollectionKey(libraryKind);
        const all = DB.data?.data?.[collectionKey] || [];
        const shouldSaveAsNew = Boolean(saveAsNew);

        if (shouldSaveAsNew) {
            const confirmClone = confirm('Farkli kaydet yeni bir parca olusturur. Mevcut kart korunur, fakat form yeni karta gececek. Devam edilsin mi?');
            if (!confirmClone) return;
        }

        const name = String(s.componentDraftName || '').trim();
        if (!name) return alert('Urun adi zorunlu.');

        const groups = ProductLibraryModule.getPartGroups();
        const group = groups.includes(String(s.componentDraftGroup || '')) ? String(s.componentDraftGroup || '') : (groups[0] || 'Genel');
        let colorType = ProductLibraryModule.normalizeColorType(s.componentDraftColorType || '');
        let subGroup = String(s.componentDraftSubGroup || '').trim();
        let colorCode = String(s.componentDraftColorCode || '').trim().toUpperCase();
        if (colorType && !subGroup) return alert('Renk seciniz.');
        if (!colorType && subGroup) return alert('Kategori seciniz.');
        if (colorType || subGroup || colorCode) {
            const strictColor = ProductLibraryModule.resolveStrictLibraryColorSelection({
                colorType,
                colorCode,
                colorName: subGroup
            });
            if (!strictColor.found) return alert('Secilen renk kutuphanede bulunamadi. Lutfen listeden gecerli renk seciniz.');
            colorType = strictColor.type;
            subGroup = strictColor.name;
            colorCode = strictColor.code;
        }

        const targetEditingId = shouldSaveAsNew ? null : s.componentEditingId;
        const code = String(
            shouldSaveAsNew
                ? ProductLibraryModule.generateComponentCode(null, libraryKind)
                : (s.componentDraftCode || ProductLibraryModule.generateComponentCode(targetEditingId || null, libraryKind))
        ).trim().toUpperCase();
        const codePrefix = ProductLibraryModule.getComponentCodePrefix(libraryKind);
        if (!ProductLibraryModule.getComponentCodeRegex(libraryKind).test(code)) {
            return alert(`ID kod formati gecersiz. Beklenen: ${codePrefix}-000001`);
        }

        const exclude = targetEditingId
            ? { collection: collectionKey, id: targetEditingId, field: 'code' }
            : null;
        if (ProductLibraryModule.isGlobalCodeTaken(code, exclude)) {
            return alert('Bu ID kod baska bir kayitta kullaniliyor.');
        }

        const masterCode = String(s.componentDraftMasterCode || '').trim().toUpperCase();
        if (!masterCode) return alert('Master urun kutuphanesi hammadde ID kod zorunlu.');

        const routesRaw = Array.isArray(s.componentDraftRoutes) ? s.componentDraftRoutes : [];
        const routes = routesRaw
            .map(r => ({
                id: String(r?.id || crypto.randomUUID()),
                stationId: String(r?.stationId || '').trim(),
                processId: ProductLibraryModule.getRouteProcessDisplayValue(r)
            }))
            .filter(r => r.stationId);
        const invalidStation = routes.find(r => !ProductLibraryModule.isValidRouteStationId(r.stationId));
        if (invalidStation) return alert('Rota satirinda gecersiz istasyon secimi var.');

        const duplicateRow = ProductLibraryModule.findDuplicateComponentCard({
            name,
            group,
            subGroup,
            colorType,
            colorCode,
            masterCode,
            routes
        }, targetEditingId || '', libraryKind);
        if (duplicateRow) {
            return alert(`Bu urun zaten mevcut. ID kod: ${duplicateRow.code || '-'}`);
        }
        if (libraryKind === 'SEMI') {
            const partDuplicate = ProductLibraryModule.findDuplicateComponentCard({
                name,
                group,
                subGroup,
                colorType,
                colorCode,
                masterCode,
                routes
            }, '', 'PART');
            if (partDuplicate) {
                return alert(`Bu parca Parca & Bilesen bolumunde zaten var. ID kod: ${partDuplicate.code || '-'}`);
            }
        }

        const files = (Array.isArray(s.componentDraftFiles) ? s.componentDraftFiles : [])
            .map(file => ({
                name: String(file?.name || 'dosya').trim() || 'dosya',
                type: String(file?.type || '').trim(),
                size: Number(file?.size || 0),
                data: String(file?.data || '')
            }))
            .filter(file => file.data);

        const note = String(s.componentDraftNote || '').trim();
        const now = new Date().toISOString();
        let savedRow = null;

        if (targetEditingId) {
            const idx = all.findIndex(x => String(x?.id || '') === String(targetEditingId));
            if (idx === -1) {
                ProductLibraryModule.resetComponentDraft(true);
                UI.renderCurrentPage();
                return;
            }
            const old = all[idx];
            all[idx] = {
                ...old,
                code,
                name,
                group,
                subGroup,
                colorType,
                colorCode,
                masterCode,
                routes,
                attachments: files,
                note,
                updated_at: now
            };
            savedRow = all[idx];
        } else {
            savedRow = {
                id: crypto.randomUUID(),
                code,
                name,
                group,
                subGroup,
                colorType,
                colorCode,
                masterCode,
                routes,
                attachments: files,
                note,
                created_at: now,
                updated_at: now
            };
            all.push(savedRow);
        }

        DB.data.data[collectionKey] = all;
        await DB.save();
        if (shouldSaveAsNew && savedRow) {
            ProductLibraryModule.loadComponentDraftFromRow(savedRow);
            UI.renderCurrentPage();
            return;
        }
        ProductLibraryModule.resetComponentDraft(true);
    },

    deleteComponentCard: async (id) => {
        const libraryKind = ProductLibraryModule.getActiveComponentLibraryKind();
        const collectionKey = ProductLibraryModule.getComponentCollectionKey(libraryKind);
        const all = DB.data?.data?.[collectionKey] || [];
        const row = all.find(x => String(x?.id || '') === String(id || ''));
        if (!row) return;
        if (!confirm(libraryKind === 'SEMI' ? 'Bu yari mamul karti silinsin mi?' : 'Bu parca/bilesen karti silinsin mi?')) return;

        DB.data.data[collectionKey] = all.filter(x => String(x?.id || '') !== String(id || ''));
        if (String(ProductLibraryModule.state.componentEditingId || '') === String(id || '')) {
            ProductLibraryModule.state.componentEditingId = null;
            ProductLibraryModule.state.componentFormOpen = false;
        }
        if (String(ProductLibraryModule.state.componentViewingId || '') === String(id || '')) {
            ProductLibraryModule.state.componentViewingId = null;
            ProductLibraryModule.state.componentViewPreviewIndex = 0;
        }

        await DB.save();
        UI.renderCurrentPage();
    },

    renderComponentView: (container, row) => {
        const unitMap = ProductLibraryModule.getRouteStationMap();
        const routes = Array.isArray(row?.routes) ? row.routes : [];
        const files = Array.isArray(row?.attachments) ? row.attachments : [];
        const hasFiles = files.length > 0;
        const previewIndex = Math.min(
            Math.max(0, Number(ProductLibraryModule.state.componentViewPreviewIndex || 0)),
            Math.max(files.length - 1, 0)
        );
        const previewFile = files[previewIndex] || null;
        const previewType = String(previewFile?.type || '').toLowerCase();
        const previewData = String(previewFile?.data || '');
        const previewIsPdf = previewType.includes('pdf') || previewData.startsWith('data:application/pdf');
        const previewIsImage = previewType.startsWith('image/') || previewData.startsWith('data:image/');
        const previewHtml = !previewFile?.data
            ? '<div style="display:flex; align-items:center; justify-content:center; min-height:280px; color:#94a3b8; font-weight:700;">Onizlenecek dosya secilmedi.</div>'
            : previewIsPdf
                ? `<iframe src="${previewData}" style="width:100%; min-height:420px; border:none; border-radius:0.8rem; background:white;"></iframe>`
                : previewIsImage
                    ? `<div style="display:flex; align-items:center; justify-content:center; min-height:420px; background:white; border-radius:0.8rem; overflow:hidden;"><img src="${previewData}" alt="${ProductLibraryModule.escapeHtml(previewFile?.name || 'dosya')}" style="max-width:100%; max-height:420px; object-fit:contain;"></div>`
                    : '<div style="display:flex; align-items:center; justify-content:center; min-height:280px; color:#94a3b8; font-weight:700;">Bu dosya turu icin yerlesik onizleme yok.</div>';

        container.innerHTML = `
            <div style="max-width:1120px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:1rem;">
                    <h2 class="page-title" style="margin:0;">${ProductLibraryModule.escapeHtml(ProductLibraryModule.getActiveComponentLibraryKind() === 'SEMI' ? 'Yari Mamul Detay' : 'Parca ve Bilesen Detay')}</h2>
                    <button class="btn-sm" onclick="ProductLibraryModule.closeComponentCardView()">geri</button>
                </div>
                ${hasFiles ? `
                    <div class="card-table" style="padding:1rem; margin-bottom:1rem; border:2px solid #0f172a; border-radius:1rem;">
                        <div style="font-weight:700; margin-bottom:0.6rem;">Dosyalar</div>
                        <div style="display:flex; flex-direction:column; gap:0.8rem;">
                            ${files.map((file, idx) => `
                                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.6rem; border:1px solid ${idx === previewIndex ? '#93c5fd' : '#e2e8f0'}; background:${idx === previewIndex ? '#eff6ff' : 'white'}; border-radius:0.6rem; padding:0.5rem 0.65rem;">
                                    <div style="font-size:0.86rem; color:#334155; font-weight:${idx === previewIndex ? '700' : '600'};">${ProductLibraryModule.escapeHtml(file?.name || 'dosya')}</div>
                                    <div style="display:flex; gap:0.4rem;">
                                        <button class="btn-sm" onclick="ProductLibraryModule.selectComponentViewFile(${idx})" style="${idx === previewIndex ? 'background:#dbeafe; border-color:#93c5fd; color:#1d4ed8;' : ''}">onizle</button>
                                        <button class="btn-sm" onclick="ProductLibraryModule.previewComponentCardFile('${row.id}', ${idx})">goruntule</button>
                                    </div>
                                </div>
                            `).join('')}
                            <div style="border:1px solid #e2e8f0; border-radius:0.9rem; padding:0.75rem; background:#f8fafc;">
                                <div style="font-size:0.8rem; color:#64748b; margin-bottom:0.55rem;">${previewFile ? `Onizleme: ${ProductLibraryModule.escapeHtml(previewFile.name || 'dosya')}` : 'Onizleme'}</div>
                                ${previewHtml}
                            </div>
                        </div>
                    </div>
                ` : ''}
                <div class="card-table" style="padding:1rem; margin-bottom:1rem; border:2px solid #0f172a; border-radius:1rem;">
                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:0.7rem;">
                        <div><div style="font-size:0.72rem; color:#64748b;">urun adi</div><div style="font-weight:700;">${ProductLibraryModule.escapeHtml(row?.name || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">kategori</div><div style="font-weight:700;">${ProductLibraryModule.escapeHtml(row?.group || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">renk</div><div style="font-weight:700;">${ProductLibraryModule.escapeHtml(row?.subGroup || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">ID kod</div><div style="font-weight:700; font-family:monospace; color:#1d4ed8;">${ProductLibraryModule.escapeHtml(row?.code || '-')}</div></div>
                    </div>
                    <div style="margin-top:0.75rem;"><div style="font-size:0.72rem; color:#64748b;">master urun kutuphanesi hammadde ID kod</div><div style="font-weight:700; font-family:monospace;">${ProductLibraryModule.escapeHtml(row?.masterCode || '-')}</div></div>
                    <div style="margin-top:0.75rem;"><div style="font-size:0.72rem; color:#64748b;">not</div><div style="color:#334155;">${ProductLibraryModule.escapeHtml(row?.note || '-')}</div></div>
                </div>

                <div class="card-table" style="padding:1rem; margin-bottom:1rem; border:2px solid #0f172a; border-radius:1rem;">
                    <div style="font-weight:700; margin-bottom:0.6rem;">Rota</div>
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                                <th style="padding:0.5rem; text-align:left;">Sira</th>
                                <th style="padding:0.5rem; text-align:left;">Istasyon</th>
                                <th style="padding:0.5rem; text-align:left;">Islem ID</th>
                                <th style="padding:0.5rem; text-align:left;">Islem adi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${routes.length === 0 ? '<tr><td colspan="4" style="padding:0.8rem; color:#94a3b8;">Rota tanimli degil.</td></tr>' : routes.map((r, idx) => `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:0.5rem;">${idx + 1}</td>
                                    <td style="padding:0.5rem;">${ProductLibraryModule.escapeHtml(unitMap[r.stationId] || r.stationId || '-')}</td>
                                    <td style="padding:0.5rem; font-family:monospace; color:#334155;">${ProductLibraryModule.escapeHtml(ProductLibraryModule.getRouteProcessDisplayValue(r) || '-')}</td>
                                    <td style="padding:0.5rem; color:#334155; font-weight:700;">${ProductLibraryModule.escapeHtml(ProductLibraryModule.getRouteProcessName(r) || '-')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${hasFiles ? '' : `<div class="card-table" style="padding:1rem;"><div style="font-weight:700; margin-bottom:0.6rem;">Dosyalar</div><div style="color:#94a3b8;">Dosya yok.</div></div>`}
            </div>
        `;
    },

    renderComponentsPage: (container) => {
        const libraryKind = ProductLibraryModule.getActiveComponentLibraryKind();
        const isSemiLibrary = libraryKind === 'SEMI';
        const viewingId = String(ProductLibraryModule.state.componentViewingId || '').trim();
        if (viewingId) {
            const row = ProductLibraryModule.getActiveComponentCardById(viewingId);
            if (row) {
                ProductLibraryModule.renderComponentView(container, row);
                return;
            }
            ProductLibraryModule.state.componentViewingId = null;
        }

        const routeStations = ProductLibraryModule.getRouteStationOptions();
        const unitMap = ProductLibraryModule.getRouteStationMap();

        const state = ProductLibraryModule.state;
        const isAssemblyComponentPicker = state.componentPickerSource === 'assembly-component';
        const isModelComponentPicker = state.componentPickerSource === 'model-component' || state.componentPickerSource === 'model-component-row';
        const isSalesVariationComponentPicker = state.componentPickerSource === 'sales-variation-component'
            || state.componentPickerSource === 'sales-variation-component-row';
        const planningPickerSource = String(state.planningPickerSource || '');
        const isPlanningComponentPicker = planningPickerSource === 'component' || planningPickerSource === 'semi';
        const isStockInventoryPicker = isPlanningComponentPicker
            && typeof StockModule !== 'undefined'
            && !!StockModule?.state?.inventoryRegistrationPickerPending;
        const isComponentPicker = isAssemblyComponentPicker || isModelComponentPicker || isSalesVariationComponentPicker || isPlanningComponentPicker;
        const filters = state.componentFilters || { name: '', group: '', colorType: '', subGroup: '', code: '' };
        const allComponentRows = ProductLibraryModule.getActiveComponentCards();
        const categorySearchOptions = ProductLibraryModule.getPartGroups();
        const qColorType = ProductLibraryModule.normalizeColorType(filters.colorType || '');
        const colorSearchOptions = ProductLibraryModule.getColorLibraryItemsByType(qColorType);
        if (String(filters.group || '').trim() && !categorySearchOptions.includes(String(filters.group || '').trim())) {
            categorySearchOptions.unshift(String(filters.group || '').trim());
        }
        if (qColorType && String(filters.subGroup || '').trim()) {
            const exists = colorSearchOptions.some(row =>
                String(row.name || '').toLowerCase() === String(filters.subGroup || '').trim().toLowerCase()
            );
            if (!exists) ProductLibraryModule.state.componentFilters.subGroup = '';
        }
        const qName = String(filters.name || '').trim().toLowerCase();
        const qGroup = String(filters.group || '').trim().toLowerCase();
        const qSub = String(ProductLibraryModule.state.componentFilters?.subGroup || '').trim().toLowerCase();
        const qCode = String(filters.code || '').trim().toLowerCase();
        const rows = allComponentRows.filter(row => {
            const nameOk = !qName || String(row?.name || '').toLowerCase().includes(qName);
            const groupOk = !qGroup || String(row?.group || '').toLowerCase().includes(qGroup);
            const rowColorType = ProductLibraryModule.resolveComponentColorType(row);
            const typeOk = !qColorType || rowColorType === qColorType;
            const subOk = !qSub || String(row?.subGroup || '').toLowerCase() === qSub;
            const codeOk = !qCode || String(row?.code || '').toLowerCase().includes(qCode);
            return nameOk && groupOk && typeOk && subOk && codeOk;
        });

        const groups = ProductLibraryModule.getPartGroups();
        const colorTypeOptions = ProductLibraryModule.getColorTypeOptions();
        const componentColorSelection = ProductLibraryModule.resolveStrictLibraryColorSelection({
            colorType: state.componentDraftColorType || '',
            colorCode: state.componentDraftColorCode || '',
            colorName: state.componentDraftSubGroup || ''
        });
        const activeComponentColorType = ProductLibraryModule.normalizeColorType(
            state.componentDraftColorType || componentColorSelection.type || ''
        );
        ProductLibraryModule.state.componentDraftColorType = activeComponentColorType;
        const componentColorOptions = ProductLibraryModule.getColorLibraryItemsByType(activeComponentColorType);
        if (activeComponentColorType && componentColorSelection.found) {
            ProductLibraryModule.state.componentDraftSubGroup = componentColorSelection.name;
            ProductLibraryModule.state.componentDraftColorCode = componentColorSelection.code;
        } else if (state.componentDraftSubGroup || state.componentDraftColorCode) {
            ProductLibraryModule.state.componentDraftSubGroup = '';
            ProductLibraryModule.state.componentDraftColorCode = '';
        }
        const files = Array.isArray(state.componentDraftFiles) ? state.componentDraftFiles : [];
        const routes = Array.isArray(state.componentDraftRoutes) ? state.componentDraftRoutes : [];
        const draftCode = String(state.componentDraftCode || ProductLibraryModule.generateComponentCode(state.componentEditingId || null, libraryKind));
        const componentExpandedMap = (state.componentCategoryExpanded && typeof state.componentCategoryExpanded === 'object')
            ? state.componentCategoryExpanded
            : {};
        const assemblyRows = ProductLibraryModule.getAssemblyGroups();
        const renderAssemblyRow = (row) => `
            <tr style="border-bottom:1px solid #f1f5f9; ${state.assemblySelectedId === row.id ? 'background:#fff7ed;' : ''}">
                <td style="padding:0.55rem; font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(row?.name || '-')}</td>
                <td style="padding:0.55rem; text-align:center; font-weight:700;">${Array.isArray(row?.items) ? row.items.length : 0}</td>
                <td style="padding:0.55rem; font-family:monospace; color:#334155;">${ProductLibraryModule.escapeHtml(row?.code || '-')}</td>
                <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.openAssemblyGroupFromComponents('${row.id}')">goruntule</button></td>
                <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.startEditAssemblyGroupFromComponents('${row.id}')">duzenle</button></td>
                <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.selectAssemblyGroup('${row.id}')" style="${state.assemblySelectedId === row.id ? 'background:#0f172a; color:white; border-color:#0f172a;' : ''}">sec</button></td>
            </tr>
        `;
        const renderComponentRow = (row) => `
            <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:0.55rem; font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(row?.name || '-')}</td>
                <td style="padding:0.55rem;">${ProductLibraryModule.escapeHtml(row?.group || '-')}</td>
                <td style="padding:0.55rem;">${ProductLibraryModule.escapeHtml(row?.subGroup || '-')}</td>
                <td style="padding:0.55rem; font-family:monospace; color:#334155;">${ProductLibraryModule.escapeHtml(row?.code || '-')}</td>
                <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.openComponentCardView('${row.id}')">goruntule</button></td>
                <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.startEditComponentCard('${row.id}')">duzenle</button></td>
                <td style="padding:0.55rem; text-align:center;">
                    ${isComponentPicker
                        ? `<button class="btn-sm" onclick="${isPlanningComponentPicker ? (planningPickerSource === 'semi' ? `ProductLibraryModule.selectPlanningSemiFinished('${row.id}')` : `ProductLibraryModule.selectPlanningComponent('${row.id}')`) : (isModelComponentPicker ? `ProductLibraryModule.selectModelComponent('${row.id}')` : (isSalesVariationComponentPicker ? `ProductLibraryModule.selectSalesVariationComponent('${row.id}')` : `ProductLibraryModule.selectComponentForAssembly('${row.id}')`))}">ekle</button>`
                        : '<input type="checkbox" disabled>'}
                </td>
            </tr>
        `;
        const rowsHtml = rows.length === 0
            ? `<tr><td colspan="7" style="padding:0.95rem; color:#94a3b8; text-align:center;">${ProductLibraryModule.escapeHtml(isSemiLibrary ? 'Kayitli yari mamul yok.' : 'Kayitli parca/bilesen yok.')}</td></tr>`
            : (() => {
                const preferredGroups = Array.from(new Set([
                    ...ProductLibraryModule.getPartGroups(),
                    ...rows.map(row => String(row?.group || '').trim()).filter(Boolean)
                ]));
                const grouped = preferredGroups
                    .map((groupName) => {
                        const items = rows.filter(row => String(row?.group || '').trim() === groupName);
                        return { key: groupName || 'Diger', name: groupName || 'Diger', items };
                    })
                    .filter(group => group.items.length > 0);

                return grouped.map((group) => {
                    const isOpen = !!componentExpandedMap[group.key];
                    const arrowIcon = isOpen ? 'chevron-down' : 'chevron-right';
                    const bodyRows = isOpen ? group.items.map(renderComponentRow).join('') : '';
                    return `
                        <tr>
                            <td colspan="7" style="padding:0; border-top:2px solid #cbd5e1; background:${isOpen ? '#eef2ff' : '#f8fafc'};">
                                <button type="button" onclick='ProductLibraryModule.toggleComponentCategorySection(${JSON.stringify(group.key)})' style="width:calc(100% - 0.7rem); margin:0.3rem 0.35rem; border:1px solid #cbd5e1; border-radius:0.62rem; background:${isOpen ? '#eef2ff' : 'white'}; padding:0.65rem 0.8rem; display:flex; align-items:center; gap:0.6rem; cursor:pointer; text-align:left;">
                                    <span style="display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border:1.5px solid #0f172a; border-radius:999px; color:#0f172a; background:white;">
                                        <i data-lucide="${arrowIcon}" width="16" height="16"></i>
                                    </span>
                                    <span style="font-weight:800; color:#334155; font-size:1rem;">${ProductLibraryModule.escapeHtml(group.name)}</span>
                                    <span style="font-size:0.86rem; color:#64748b; font-weight:700;">(${group.items.length})</span>
                                </button>
                            </td>
                        </tr>
                        ${bodyRows}
                    `;
                }).join('');
            })();

        container.innerHTML = `
            <div style="max-width:1360px; margin:0 auto;">
                ${isComponentPicker ? `
                    <div style="background:#eff6ff; border:2px solid #1d4ed8; color:#1e3a8a; border-radius:0.9rem; padding:0.7rem 0.85rem; margin-bottom:0.8rem; display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap;">
                        <div style="font-weight:700;">${isPlanningComponentPicker ? (isStockInventoryPicker ? (planningPickerSource === 'semi' ? 'Envantere elle kayit icin yari mamul secimi modundasin. "ekle" ile secilen urun stok giris formuna baglanir.' : 'Envantere elle kayit icin parca/bilesen secimi modundasin. "ekle" ile secilen urun stok giris formuna baglanir.') : (planningPickerSource === 'semi' ? 'Planlama icin yari mamul secimi modundasin. "ekle" ile secilen kayit stok icin uretim ekranina baglanir.' : 'Planlama icin parca/bilesen secimi modundasin. "ekle" ile secilen kayit stok icin uretim ekranina baglanir.')) : (isModelComponentPicker ? 'Parca/Bilesen secimi modundasin. "ekle" ile secilen urunu urun modeli formuna baglarsin.' : (isSalesVariationComponentPicker ? 'Parca/Bilesen secimi modundasin. "ekle" ile secilen urunu satis varyasyon formuna baglarsin.' : 'Parca/Bilesen secimi modundasin. "ekle" ile secilen urunu parca grup formuna eklersin.'))}</div>
                        <button class="btn-sm" onclick="${isPlanningComponentPicker ? 'ProductLibraryModule.cancelPlanningPicker()' : 'ProductLibraryModule.cancelComponentPicker()'}">${isPlanningComponentPicker ? (isStockInventoryPicker ? 'envantere don' : 'planlamaya don') : (isModelComponentPicker ? 'urun modeli formuna don' : (isSalesVariationComponentPicker ? 'satis varyasyonuna don' : 'parca grup formuna don'))}</button>
                    </div>
                ` : ''}
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:1rem;">
                    <h2 class="page-title" style="margin:0;">${ProductLibraryModule.escapeHtml(ProductLibraryModule.getComponentLibraryTitle(libraryKind))}</h2>
                    <button class="btn-sm" onclick="ProductLibraryModule.goWorkspaceMenu()">geri</button>
                </div>

                <div class="card-table" style="padding:1rem; margin-bottom:1rem; border:2px solid #0f172a; border-radius:1rem;">
                    <div style="display:grid; grid-template-columns:minmax(220px,1.2fr) minmax(240px,1.25fr) minmax(280px,1.35fr) minmax(210px,1.05fr) auto auto; gap:0.7rem; align-items:end;">
                        <input id="cmp_filter_name" value="${ProductLibraryModule.escapeHtml(filters.name || '')}" oninput="ProductLibraryModule.setComponentFilter('name', this.value, 'cmp_filter_name')" placeholder="urun adiyla ara" style="height:42px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-weight:600;">
                        <select id="cmp_filter_group" onchange="ProductLibraryModule.setComponentFilter('group', this.value)" style="height:42px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-weight:600; background:white;">
                            <option value="">kategori ile ara</option>
                            ${categorySearchOptions.map(opt => `<option value="${ProductLibraryModule.escapeHtml(opt)}" ${String(filters.group || '') === String(opt) ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(opt)}</option>`).join('')}
                        </select>
                        <div style="min-width:280px;">
                            <div style="font-size:0.72rem; color:#64748b; margin:0 0 0.16rem 0.15rem;">kategori / renk</div>
                            <div style="height:42px; border:1px solid #cbd5e1; border-radius:0.7rem; overflow:hidden; display:grid; grid-template-columns:42% 58%;">
                                <div style="background:#d9e9f8; border-right:1px solid #cbd5e1;">
                                    <select id="cmp_filter_color_type" onchange="ProductLibraryModule.setComponentSearchColorType(this.value)" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.55rem; font-weight:700; color:#334155;">
                                        <option value="">kategori sec</option>
                                        ${ProductLibraryModule.getColorTypeOptions().map(opt => `<option value="${opt.id}" ${qColorType === opt.id ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(opt.shortLabel || opt.label)}</option>`).join('')}
                                    </select>
                                </div>
                        <div style="background:${qColorType ? 'white' : '#f8fafc'};">
                            <select id="cmp_filter_sub" ${qColorType ? '' : 'disabled'} onchange="ProductLibraryModule.setComponentFilter('subGroup', this.value)" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.55rem; font-weight:700; color:${qColorType ? '#111827' : '#94a3b8'};">
                                <option value="">renk sec</option>
                                ${colorSearchOptions.map(opt => `<option value="${ProductLibraryModule.escapeHtml(opt.name || '')}" ${String(filters.subGroup || '') === String(opt.name || '') ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(opt.name || '')}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                <input id="cmp_filter_code" value="${ProductLibraryModule.escapeHtml(filters.code || '')}" oninput="ProductLibraryModule.setComponentFilter('code', this.value, 'cmp_filter_code')" placeholder="ID kod ara" style="height:42px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-weight:600;">
                <button class="btn-primary" onclick="${isPlanningComponentPicker ? 'ProductLibraryModule.cancelPlanningPicker()' : (isComponentPicker ? 'ProductLibraryModule.cancelComponentPicker()' : 'ProductLibraryModule.openComponentForm()')}" style="height:42px; min-width:135px;">${isComponentPicker ? 'vazgec' : 'urun ekle +'}</button>
            </div>
        </div>

                <div class="card-table" style="padding:1rem; margin-bottom:1rem; border:2px solid #0f172a; border-radius:1rem;">
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.75rem; text-transform:uppercase;">
                                <th style="padding:0.55rem; text-align:left;">urun adi</th>
                                <th style="padding:0.55rem; text-align:left;">kategori</th>
                                <th style="padding:0.55rem; text-align:left;">renk</th>
                                <th style="padding:0.55rem; text-align:left;">ID kod</th>
                                <th style="padding:0.55rem; text-align:center;">goruntule</th>
                                <th style="padding:0.55rem; text-align:center;">duzenle</th>
                                <th style="padding:0.55rem; text-align:center;">sec</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>

                ${state.componentFormOpen && !isAssemblyComponentPicker ? `
                    <div class="card-table" style="padding:1rem; border:2px solid #0f172a; border-radius:1rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:0.85rem;">
                            <h3 style="margin:0; font-size:1.45rem; color:#334155;">${ProductLibraryModule.escapeHtml(isSemiLibrary ? 'Yari Mamul olustur' : 'Parca ve Bilesen olustur')}</h3>
                            <div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap;">
                                ${state.componentEditingId ? `<button class="btn-sm" onclick="ProductLibraryModule.deleteComponentCard('${state.componentEditingId}')" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;">Sil</button>` : ''}
                                ${state.componentEditingId ? '<div style="display:flex; align-items:center; gap:0.5rem; padding-left:0.75rem; margin-left:0.15rem; border-left:1px solid #cbd5e1;"><button class="btn-sm" onclick="ProductLibraryModule.saveComponentCard(true)" style="border-color:#93c5fd; background:#dbeafe; color:#1d4ed8; font-weight:800;">Farkli Kaydet</button><span style="font-size:0.72rem; color:#64748b;">yeni renk / varyant karti ac</span></div>' : ''}
                                <div style="display:flex; gap:0.5rem; align-items:center;">
                                    <button class="btn-sm" onclick="ProductLibraryModule.resetComponentDraft(true)">Vazgec</button>
                                    <button class="btn-primary" onclick="ProductLibraryModule.saveComponentCard()">Kaydet</button>
                                </div>
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:0.75rem; align-items:end; margin-bottom:0.85rem;">
                            <div>
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">urun adi *</label>
                                <input value="${ProductLibraryModule.escapeHtml(state.componentDraftName || '')}" oninput="ProductLibraryModule.state.componentDraftName=this.value" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                            </div>
                            <div>
                                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.4rem; margin-bottom:0.2rem; min-height:20px;">
                                    <label style="display:block; font-size:0.74rem; color:#64748b;">kategori</label>
                                    <button type="button" onclick="ProductLibraryModule.openComponentDictionary('group')" style="height:20px; border:1px solid #cbd5e1; background:white; color:#2563eb; border-radius:0.4rem; padding:0 0.4rem; font-size:0.64rem; font-weight:800; cursor:pointer; white-space:nowrap;">+yonet (ekle-sil)</button>
                                </div>
                                <select onchange="ProductLibraryModule.state.componentDraftGroup=this.value" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                                    ${groups.map(x => `<option value="${ProductLibraryModule.escapeHtml(x)}" ${String(state.componentDraftGroup || '') === String(x) ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(x)}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <div style="margin-bottom:0.2rem;">
                                    <label style="display:block; font-size:0.74rem; color:#64748b;">kategori / renk</label>
                                </div>
                                <div style="height:40px; border:1px solid #cbd5e1; border-radius:0.7rem; overflow:hidden; display:grid; grid-template-columns:42% 58%;">
                                    <div style="background:#d9e9f8; border-right:1px solid #cbd5e1;">
                                        <select onchange="ProductLibraryModule.setComponentColorType(this.value)" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.55rem; font-weight:700; color:#334155;">
                                            <option value="">kategori sec</option>
                                            ${colorTypeOptions.map(opt => `<option value="${opt.id}" ${state.componentDraftColorType === opt.id ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(opt.label)}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div style="background:${state.componentDraftColorType ? 'white' : '#f8fafc'};">
                                        <select ${state.componentDraftColorType ? '' : 'disabled'} onchange="ProductLibraryModule.setComponentColor(this.value, this.options[this.selectedIndex]?.dataset?.code || '')" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.55rem; font-weight:700; color:${state.componentDraftColorType ? '#111827' : '#94a3b8'};">
                                            <option value="">renk sec</option>
                                            ${componentColorOptions.map(opt => `<option value="${ProductLibraryModule.escapeHtml(opt.name || '')}" data-code="${ProductLibraryModule.escapeHtml(opt.code || '')}" ${String(state.componentDraftSubGroup || '') === String(opt.name || '') ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(opt.name || '')}</option>`).join('')}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">ID kod</label>
                                <input disabled value="${ProductLibraryModule.escapeHtml(draftCode)}" style="width:100%; height:40px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace; font-weight:700;">
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:1.65fr 0.95fr; gap:0.9rem;">
                            <div>
                                <div style="margin-bottom:0.65rem;">
                                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">master urun kutuphanesi hammadde ID kod *</label>
                                    <div style="display:grid; grid-template-columns:1fr auto auto; gap:0.45rem; align-items:center;">
                                        <input value="${ProductLibraryModule.escapeHtml(state.componentDraftMasterCode || '')}" oninput="ProductLibraryModule.state.componentDraftMasterCode=this.value.toUpperCase()" placeholder="ID kod yaz" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-family:monospace;">
                                        <button class="btn-sm" onclick="ProductLibraryModule.openMasterPickerForComponent()" style="height:40px; min-width:110px;">goruntule</button>
                                        <button class="btn-sm" onclick="ProductLibraryModule.clearComponentMasterCode()" style="height:40px; min-width:80px;">sil</button>
                                    </div>
                                </div>
                                <div style="display:flex; flex-direction:column; gap:0.45rem;">
                                    ${routes.length === 0 ? '<div style="font-size:0.82rem; color:#94a3b8;">Henuz rota istasyonu eklenmedi.</div>' : routes.map((r, idx) => `
                                        <div style="display:grid; grid-template-columns:1.2fr 1fr auto auto; gap:0.45rem; align-items:center;">
                                            <div style="font-weight:600; color:#334155;">${idx + 1}. istasyon ${ProductLibraryModule.escapeHtml(unitMap[r.stationId] || r.stationId || '-')}</div>
                                            <input readonly value="${ProductLibraryModule.escapeHtml(ProductLibraryModule.getRouteProcessDisplayValue(r) || '')}" placeholder="islem secilmedi" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.55rem; font-family:monospace; background:#f8fafc;">
                                            <button class="btn-sm" onclick="${ProductLibraryModule.isSupplierRouteStationId(r.stationId) ? 'return false;' : `ProductLibraryModule.editComponentRouteRow('${r.id}')`}" ${ProductLibraryModule.isSupplierRouteStationId(r.stationId) ? 'disabled style="opacity:0.55; cursor:not-allowed;"' : ''}>${ProductLibraryModule.isSupplierRouteStationId(r.stationId) ? 'fason' : (String(r.processId || '').trim() ? 'duzenle' : 'goruntule')}</button>
                                            <button class="btn-sm" onclick="ProductLibraryModule.removeComponentRouteRow('${r.id}')">sil</button>
                                        </div>
                                    `).join('')}
                                </div>
                                <div style="display:grid; grid-template-columns:1fr auto; gap:0.45rem; margin-top:0.7rem; max-width:430px;">
                                    <select onchange="ProductLibraryModule.setComponentRouteStation(this.value)" style="height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.6rem;">
                                        <option value="">istasyon sec</option>
                                        ${routeStations.map(u => `<option value="${u.id}" ${String(state.componentDraftRouteStationId || '') === String(u.id) ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(u.name)}</option>`).join('')}
                                    </select>
                                    <button class="btn-primary" onclick="ProductLibraryModule.addComponentRouteRow()">rota istasyonu ekle +</button>
                                </div>
                            </div>
                            <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.65rem;">
                                <div style="font-size:0.8rem; color:#64748b; margin-bottom:0.35rem;">resim/pdf dosya + ekle (opsiyonel)</div>
                                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onchange="ProductLibraryModule.handleComponentFiles(this)" style="width:100%;">
                                <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.25rem;">Yeni secilen dosyalar listeye eklenir.</div>
                                <div style="margin-top:0.55rem; display:flex; flex-direction:column; gap:0.35rem; max-height:220px; overflow:auto;">
                                    ${files.length === 0 ? '<div style="font-size:0.82rem; color:#94a3b8;">Dosya secilmedi.</div>' : files.map((file, idx) => `
                                        <div style="border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.35rem 0.45rem;">
                                            <div style="font-size:0.8rem; color:#334155; margin-bottom:0.3rem;">${ProductLibraryModule.escapeHtml(file?.name || 'dosya')}</div>
                                            <div style="display:flex; gap:0.35rem;">
                                                <button class="btn-sm" onclick="ProductLibraryModule.previewComponentDraftFile(${idx})">goruntule</button>
                                                <button class="btn-sm" onclick="ProductLibraryModule.removeComponentDraftFile(${idx})">kaldir</button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        <div style="margin-top:0.95rem;">
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">not aciklama ekle</label>
                            <textarea rows="5" oninput="ProductLibraryModule.state.componentDraftNote=this.value" style="width:100%; border:1px solid #cbd5e1; border-radius:0.65rem; padding:0.65rem; resize:vertical;">${ProductLibraryModule.escapeHtml(state.componentDraftNote || '')}</textarea>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    ensureAssemblyDefaults: () => {
        if (!DB.data.data || typeof DB.data.data !== 'object') DB.data.data = {};
        if (!Array.isArray(DB.data.data.assemblyGroups)) DB.data.data.assemblyGroups = [];
    },

    getAssemblyGroups: () => {
        return (DB.data.data.assemblyGroups || [])
            .filter(row => !row?.archived_at)
            .slice()
            .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
    },

    getAssemblyGroupById: (id) => {
        return ProductLibraryModule.getAssemblyGroups().find(row => String(row?.id || '') === String(id || '')) || null;
    },

    generateAssemblyCode: (exclude = null) => {
        const all = DB.data.data.assemblyGroups || [];
        let maxNum = 0;
        all.forEach(row => {
            if (exclude && String(exclude) === String(row?.id || '')) return;
            const code = String(row?.code || '').trim().toUpperCase();
            const m = code.match(/^GRP-(\d{6})$/);
            if (!m) return;
            const n = Number(m[1]);
            if (Number.isFinite(n) && n > maxNum) maxNum = n;
        });
        let nextNum = maxNum + 1;
        let candidate = `GRP-${String(nextNum).padStart(6, '0')}`;
        while (ProductLibraryModule.isGlobalCodeTaken(candidate, exclude ? { collection: 'assemblyGroups', id: exclude, field: 'code' } : null)) {
            nextNum += 1;
            candidate = `GRP-${String(nextNum).padStart(6, '0')}`;
        }
        return candidate;
    },

    setAssemblyFilter: (field, value, focusId = '') => {
        if (!ProductLibraryModule.state.assemblyFilters || typeof ProductLibraryModule.state.assemblyFilters !== 'object') {
            ProductLibraryModule.state.assemblyFilters = { name: '', code: '' };
        }
        if (!['name', 'code'].includes(field)) return;
        ProductLibraryModule.state.assemblyFilters[field] = String(value || '');
        UI.renderCurrentPage();
        if (!focusId) return;
        setTimeout(() => {
            const el = document.getElementById(focusId);
            if (!el) return;
            el.focus();
            const len = el.value.length;
            try { el.setSelectionRange(len, len); } catch (_) { }
        }, 0);
    },

    setAssemblySourceFilter: (field, value, focusId = '') => {
        if (!ProductLibraryModule.state.assemblySourceFilters || typeof ProductLibraryModule.state.assemblySourceFilters !== 'object') {
            ProductLibraryModule.state.assemblySourceFilters = { source: 'all', name: '', code: '' };
        }
        if (!['source', 'name', 'code'].includes(field)) return;
        ProductLibraryModule.state.assemblySourceFilters[field] = String(value || '');
        UI.renderCurrentPage();
        if (!focusId) return;
        setTimeout(() => {
            const el = document.getElementById(focusId);
            if (!el) return;
            el.focus();
            const len = el.value.length;
            try { el.setSelectionRange(len, len); } catch (_) { }
        }, 0);
    },

    getAssemblySourceRows: () => {
        const masterRows = ProductLibraryModule.getMasterProducts()
            .map(row => ({
                source: 'master',
                refId: String(row?.id || ''),
                code: String(row?.code || '').trim().toUpperCase(),
                name: String(row?.name || '').trim(),
                group: String(row?.categoryName || 'Master').trim()
            }))
            .filter(row => row.code && row.name);

        const componentRows = ProductLibraryModule.getComponentCards()
            .map(row => ({
                source: 'component',
                refId: String(row?.id || ''),
                code: String(row?.code || '').trim().toUpperCase(),
                name: String(row?.name || '').trim(),
                group: [String(row?.group || '').trim(), String(row?.subGroup || '').trim()].filter(Boolean).join(' / ') || 'Parca'
            }))
            .filter(row => row.code && row.name);

        const all = [...masterRows, ...componentRows];
        all.sort((a, b) => {
            const srcCmp = String(a.source).localeCompare(String(b.source));
            if (srcCmp !== 0) return srcCmp;
            return String(a.name || '').localeCompare(String(b.name || ''), 'tr');
        });
        return all;
    },

    openAssemblyForm: () => {
        ProductLibraryModule.state.assemblyViewingId = null;
        ProductLibraryModule.state.assemblyFormOpen = true;
        ProductLibraryModule.state.assemblyFormModalOpen = false;
        ProductLibraryModule.state.assemblyEditingId = null;
        ProductLibraryModule.state.componentRoutePicker = null;
        ProductLibraryModule.state.masterPickerSource = '';
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.assemblyDraftCode = ProductLibraryModule.generateAssemblyCode();
        ProductLibraryModule.state.assemblyDraftName = '';
        ProductLibraryModule.state.assemblyDraftNote = '';
        ProductLibraryModule.state.assemblyDraftItems = [];
        ProductLibraryModule.state.assemblyDraftRoutes = [];
        ProductLibraryModule.state.assemblyDraftRouteStationId = '';
        ProductLibraryModule.state.assemblyDraftFiles = [];
        ProductLibraryModule.state.assemblySourceFilters = { source: 'all', name: '', code: '' };
        UI.renderCurrentPage();
    },

    resetAssemblyDraft: (close = true) => {
        ProductLibraryModule.state.assemblyEditingId = null;
        ProductLibraryModule.state.componentRoutePicker = null;
        ProductLibraryModule.state.masterPickerSource = '';
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.assemblyDraftCode = ProductLibraryModule.generateAssemblyCode();
        ProductLibraryModule.state.assemblyDraftName = '';
        ProductLibraryModule.state.assemblyDraftNote = '';
        ProductLibraryModule.state.assemblyDraftItems = [];
        ProductLibraryModule.state.assemblyDraftRoutes = [];
        ProductLibraryModule.state.assemblyDraftRouteStationId = '';
        ProductLibraryModule.state.assemblyDraftFiles = [];
        ProductLibraryModule.state.assemblySourceFilters = { source: 'all', name: '', code: '' };
        if (close) ProductLibraryModule.state.assemblyFormOpen = false;
        if (ProductLibraryModule.state.assemblyFormModalOpen && typeof Modal !== 'undefined' && Modal && typeof Modal.close === 'function') {
            Modal.close();
        }
        ProductLibraryModule.state.assemblyFormModalOpen = false;
        UI.renderCurrentPage();
    },

    startEditAssemblyGroup: (id) => {
        const row = ProductLibraryModule.getAssemblyGroupById(id);
        if (!row) return;
        ProductLibraryModule.state.assemblyViewingId = null;
        ProductLibraryModule.state.assemblyFormOpen = true;
        ProductLibraryModule.state.assemblyFormModalOpen = false;
        ProductLibraryModule.state.assemblyEditingId = row.id;
        ProductLibraryModule.state.assemblySelectedId = row.id;
        ProductLibraryModule.state.componentRoutePicker = null;
        ProductLibraryModule.state.masterPickerSource = '';
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.assemblyDraftCode = String(row.code || ProductLibraryModule.generateAssemblyCode(row.id));
        ProductLibraryModule.state.assemblyDraftName = String(row.name || '');
        ProductLibraryModule.state.assemblyDraftNote = String(row.note || '');
        ProductLibraryModule.state.assemblyDraftItems = (Array.isArray(row.items) ? row.items : [])
            .map(item => ({
                id: String(item?.id || crypto.randomUUID()),
                source: String(item?.source || 'component'),
                refId: String(item?.refId || ''),
                code: String(item?.code || '').trim().toUpperCase(),
                name: String(item?.name || '').trim(),
                qty: Number(item?.qty || 1)
            }))
            .filter(item => item.code && item.name);
        ProductLibraryModule.state.assemblyDraftRoutes = Array.isArray(row.routes)
            ? row.routes.map(r => ({
                id: String(r?.id || crypto.randomUUID()),
                stationId: String(r?.stationId || ''),
                processId: String(r?.processId || '')
            }))
            : [];
        ProductLibraryModule.state.assemblyDraftRouteStationId = '';
        ProductLibraryModule.state.assemblyDraftFiles = Array.isArray(row.attachments)
            ? row.attachments
                .map(file => ({
                    name: String(file?.name || 'dosya'),
                    type: String(file?.type || ''),
                    size: Number(file?.size || 0),
                    data: String(file?.data || '')
                }))
                .filter(file => file.data)
            : [];
        UI.renderCurrentPage();
    },

    openAssemblyGroupView: (id) => {
        ProductLibraryModule.state.assemblyViewingId = String(id || '');
        ProductLibraryModule.state.assemblyFormOpen = false;
        ProductLibraryModule.state.assemblyViewReturnContext = null;
        UI.renderCurrentPage();
    },

    closeAssemblyGroupView: () => {
        ProductLibraryModule.state.assemblyViewingId = null;
        const returnCtx = ProductLibraryModule.state.assemblyViewReturnContext;
        ProductLibraryModule.state.assemblyViewReturnContext = null;
        if (returnCtx?.source === 'components') {
            ProductLibraryModule.state.componentLibraryKind = 'PART';
            ProductLibraryModule.state.workspaceView = 'components';
            UI.renderCurrentPage();
            return;
        }
        UI.renderCurrentPage();
    },

    selectAssemblyGroup: (id) => {
        const isModelComponentPick = String(ProductLibraryModule.state.componentPickerSource || '').startsWith('model-component');
        if (isModelComponentPick) {
            ProductLibraryModule.addAssemblyGroupToModelDraft(id);
            return;
        }
        ProductLibraryModule.state.assemblySelectedId = String(id || '');
        UI.renderCurrentPage();
    },

    addAssemblyGroupToModelDraft: (groupId) => {
        const group = ProductLibraryModule.getAssemblyGroupById(groupId);
        if (!group) return alert('Parca grup kaydi bulunamadi.');
        const items = Array.isArray(group.items) ? group.items : [];
        if (items.length === 0) return alert('Bu parca grupta kalem yok.');

        const modelItems = Array.isArray(ProductLibraryModule.state.modelDraftItems) ? [...ProductLibraryModule.state.modelDraftItems] : [];
        const targetRowId = String(ProductLibraryModule.state.modelComponentPickerRowId || '').trim();

        // Eger model formdan geldiysek bos placeholder satiri kaldir
        const cleaned = targetRowId
            ? modelItems.filter(item => String(item?.id || '') !== targetRowId)
            : modelItems;

        const pushComponent = (refRow, source, qty = 1) => {
            if (!refRow) return;
            const code = String(refRow.code || '').trim().toUpperCase();
            if (cleaned.some(i => String(i.code || '') === code)) return; // tekrar ekleme
            cleaned.push({
                id: crypto.randomUUID(),
                source,
                refId: String(refRow.id || ''),
                code,
                name: String(refRow.name || '').trim(),
                qty: Math.max(1, Number(qty || 1))
            });
        };

        items.forEach(item => {
            if (item.source === 'component') {
                const comp = ProductLibraryModule.getComponentCardById(item.refId);
                pushComponent(comp, 'component', item.qty);
            } else if (item.source === 'master') {
                const master = ProductLibraryModule.getMasterProductById(item.refId);
                pushComponent(master, 'master', item.qty);
            }
        });

        ProductLibraryModule.state.modelDraftItems = cleaned;
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.modelComponentPickerRowId = '';
        ProductLibraryModule.state.workspaceView = 'models';
        ProductLibraryModule.state.componentViewingId = null;
        UI.renderCurrentPage();
    },

    openAssemblyGroupFromComponents: (id) => {
        ProductLibraryModule.state.workspaceView = 'assembly';
        ProductLibraryModule.state.assemblyViewingId = String(id || '');
        ProductLibraryModule.state.assemblyFormOpen = false;
        ProductLibraryModule.state.assemblyViewReturnContext = { source: 'components' };
        UI.renderCurrentPage();
    },

    startEditAssemblyGroupFromComponents: (id) => {
        ProductLibraryModule.state.workspaceView = 'assembly';
        ProductLibraryModule.startEditAssemblyGroup(id);
        ProductLibraryModule.state.assemblyViewReturnContext = { source: 'components' };
    },

    setAssemblyDraftItemQty: (code, value) => {
        const list = Array.isArray(ProductLibraryModule.state.assemblyDraftItems) ? ProductLibraryModule.state.assemblyDraftItems : [];
        const row = list.find(item => String(item?.code || '') === String(code || ''));
        if (!row) return;
        const qty = Number(value || 0);
        row.qty = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0;
    },

    removeAssemblyDraftItem: (code) => {
        const list = Array.isArray(ProductLibraryModule.state.assemblyDraftItems) ? ProductLibraryModule.state.assemblyDraftItems : [];
        if (!list.some(item => String(item?.code || '') === String(code || ''))) return;
        if (!ProductLibraryModule.confirmDestructiveAction()) return;
        ProductLibraryModule.state.assemblyDraftItems = list.filter(item => String(item?.code || '') !== String(code || ''));
        UI.renderCurrentPage();
    },

    viewAssemblyDraftItem: (code) => {
        const list = Array.isArray(ProductLibraryModule.state.assemblyDraftItems) ? ProductLibraryModule.state.assemblyDraftItems : [];
        const row = list.find(item => String(item?.code || '') === String(code || ''));
        if (!row) return alert('Kalem bulunamadi.');

        if (row.source === 'component') {
            const comp = ProductLibraryModule.getComponentCardById(row.refId);
            if (!comp) return alert('Bagli parca/bilesen karti bulunamadi.');
            ProductLibraryModule.state.componentLibraryKind = 'PART';
            ProductLibraryModule.state.workspaceView = 'components';
            ProductLibraryModule.openComponentCardView(comp.id, { workspaceView: 'assembly' });
            return;
        }

        const master = ProductLibraryModule.getMasterProductById(row.refId);
        if (!master) return alert('Bagli master urun kaydi bulunamadi.');

        if (master?.attachment?.data || master?.previewPdf || master?.previewImage) {
            ProductLibraryModule.previewMasterAttachment(master.id);
            return;
        }

        const summaryHtml = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.55rem;">
                <div><div style="font-size:0.72rem; color:#64748b;">urun adi</div><div style="font-weight:700; color:#111827;">${ProductLibraryModule.escapeHtml(master.name || '-')}</div></div>
                <div><div style="font-size:0.72rem; color:#64748b;">kategori</div><div style="font-weight:700; color:#111827;">${ProductLibraryModule.escapeHtml(master.categoryName || '-')}</div></div>
                <div><div style="font-size:0.72rem; color:#64748b;">ID kod</div><div style="font-weight:700; font-family:monospace; color:#0f172a;">${ProductLibraryModule.escapeHtml(master.code || '-')}</div></div>
                <div><div style="font-size:0.72rem; color:#64748b;">olcu / birim</div><div style="font-weight:700; color:#111827;">${ProductLibraryModule.escapeHtml([master.unitAmount, master.unitAmountType].filter(Boolean).join(' ') || master.unit || '-')}</div></div>
                <div style="grid-column:1 / -1;"><div style="font-size:0.72rem; color:#64748b;">not</div><div style="color:#334155; white-space:pre-wrap;">${ProductLibraryModule.escapeHtml(master.note || 'Not bulunmuyor.')}</div></div>
            </div>`;
        if (typeof Modal !== 'undefined' && Modal && typeof Modal.open === 'function') {
            Modal.open('Master urun bilgisi', summaryHtml, { maxWidth: '520px' });
        } else {
            alert(`${master.name || 'Master urun'}\n${master.code || ''}`.trim());
        }
    },

    focusAssemblySource: (source = 'all') => {
        const nextSource = ['all', 'master', 'component'].includes(String(source || '')) ? String(source || '') : 'all';
        if (!ProductLibraryModule.state.assemblySourceFilters || typeof ProductLibraryModule.state.assemblySourceFilters !== 'object') {
            ProductLibraryModule.state.assemblySourceFilters = { source: 'all', name: '', code: '' };
        }
        ProductLibraryModule.state.assemblySourceFilters.source = nextSource;
        UI.renderCurrentPage();
        setTimeout(() => {
            const box = document.getElementById('asm_source_panel');
            if (box && typeof box.scrollIntoView === 'function') {
                box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 0);
    },

    clearAssemblyDraftItemsBySource: (source) => {
        const target = String(source || '');
        if (!['master', 'component'].includes(target)) return;
        const list = Array.isArray(ProductLibraryModule.state.assemblyDraftItems) ? ProductLibraryModule.state.assemblyDraftItems : [];
        if (!list.some(item => String(item?.source || '') === target)) return;
        if (!ProductLibraryModule.confirmDestructiveAction()) return;
        ProductLibraryModule.state.assemblyDraftItems = list.filter(item => String(item?.source || '') !== target);
        UI.renderCurrentPage();
    },

    addAssemblyDraftItem: (source, refId) => {
        const all = ProductLibraryModule.getAssemblySourceRows();
        const row = all.find(item => String(item.source) === String(source || '') && String(item.refId) === String(refId || ''));
        if (!row) return false;
        const list = Array.isArray(ProductLibraryModule.state.assemblyDraftItems) ? ProductLibraryModule.state.assemblyDraftItems : [];
        if (list.some(item => String(item?.code || '') === row.code)) {
            alert('Bu kod zaten parca grup listesinde var.');
            return false;
        }
        list.push({
            id: crypto.randomUUID(),
            source: row.source,
            refId: row.refId,
            code: row.code,
            name: row.name,
            qty: 1
        });
        ProductLibraryModule.state.assemblyDraftItems = list;
        UI.renderCurrentPage();
        return true;
    },

    setAssemblyRouteStation: (value) => {
        ProductLibraryModule.state.assemblyDraftRouteStationId = String(value || '').trim();
    },

    openAssemblyRouteProcessPicker: (routeId) => {
        const list = Array.isArray(ProductLibraryModule.state.assemblyDraftRoutes) ? ProductLibraryModule.state.assemblyDraftRoutes : [];
        const row = list.find(x => String(x.id) === String(routeId));
        if (!row) return alert('Rota satiri bulunamadi.');

        const stationId = String(row.stationId || '').trim();
        if (!stationId) return alert('Lutfen once istasyon seciniz.');
        if (ProductLibraryModule.isSupplierRouteStationId(stationId)) {
            row.processId = 'FASON';
            UI.renderCurrentPage();
            return;
        }

        ProductLibraryModule.state.componentRoutePicker = {
            routeId: String(routeId),
            stationId,
            routeSource: 'assembly'
        };

        if (typeof Router === 'undefined') {
            alert('Yonlendirme modulu bulunamadi.');
            return;
        }
        Router.navigate('units');
        if (typeof UnitModule !== 'undefined' && UnitModule && typeof UnitModule.openUnitLibrary === 'function') {
            UnitModule.openUnitLibrary(stationId);
        }
    },

    addAssemblyRouteRow: () => {
        const stationId = String(ProductLibraryModule.state.assemblyDraftRouteStationId || '').trim();
        if (!stationId) {
            alert('Lutfen istasyon seciniz.');
            return;
        }
        if (!Array.isArray(ProductLibraryModule.state.assemblyDraftRoutes)) {
            ProductLibraryModule.state.assemblyDraftRoutes = [];
        }
        const routeId = crypto.randomUUID();
        ProductLibraryModule.state.assemblyDraftRoutes.push({
            id: routeId,
            stationId,
            processId: ProductLibraryModule.isSupplierRouteStationId(stationId) ? 'FASON' : ''
        });
        ProductLibraryModule.state.assemblyDraftRouteStationId = '';
        if (stationId === 'u_dtm') {
            ProductLibraryModule.openAssemblyRouteProcessPicker(routeId);
            return;
        }
        UI.renderCurrentPage();
    },

    removeAssemblyRouteRow: (routeId) => {
        const list = Array.isArray(ProductLibraryModule.state.assemblyDraftRoutes) ? ProductLibraryModule.state.assemblyDraftRoutes : [];
        if (!list.some(x => String(x.id) === String(routeId))) return;
        if (!ProductLibraryModule.confirmDestructiveAction()) return;
        ProductLibraryModule.state.assemblyDraftRoutes = list.filter(x => String(x.id) !== String(routeId));
        UI.renderCurrentPage();
    },

    handleAssemblyFiles: async (input) => {
        const fileList = Array.from(input?.files || []);
        if (fileList.length === 0) return;

        const maxFileSize = 20 * 1024 * 1024;
        const allowed = ['pdf', 'jpg', 'jpeg', 'png'];
        const normalized = [];

        for (const file of fileList) {
            const name = String(file?.name || '');
            const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
            if (!allowed.includes(ext)) {
                alert(`Desteklenmeyen dosya: ${name}`);
                continue;
            }
            if (Number(file?.size || 0) > maxFileSize) {
                alert(`${name} 20MB sinirini asiyor.`);
                continue;
            }
            try {
                const data = await ProductLibraryModule.readFileAsDataUrl(file);
                normalized.push({
                    name,
                    type: String(file.type || ''),
                    size: Number(file.size || 0),
                    data
                });
            } catch (_) { }
        }

        if (normalized.length === 0) return;

        const existing = Array.isArray(ProductLibraryModule.state.assemblyDraftFiles)
            ? ProductLibraryModule.state.assemblyDraftFiles
            : [];
        const merged = [...existing];
        const seen = new Set(
            existing.map(file => `${String(file?.name || '').trim().toLowerCase()}|${Number(file?.size || 0)}|${String(file?.data || '').slice(0, 120)}`)
        );

        normalized.forEach(file => {
            const key = `${String(file?.name || '').trim().toLowerCase()}|${Number(file?.size || 0)}|${String(file?.data || '').slice(0, 120)}`;
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(file);
        });

        ProductLibraryModule.state.assemblyDraftFiles = merged;
        if (input) input.value = '';
        UI.renderCurrentPage();
    },

    removeAssemblyDraftFile: (index) => {
        const files = Array.isArray(ProductLibraryModule.state.assemblyDraftFiles)
            ? [...ProductLibraryModule.state.assemblyDraftFiles]
            : [];
        if (index < 0 || index >= files.length) return;
        if (!ProductLibraryModule.confirmDestructiveAction()) return;
        files.splice(index, 1);
        ProductLibraryModule.state.assemblyDraftFiles = files;
        UI.renderCurrentPage();
    },

    clearAssemblyDraftFiles: () => {
        if (!ProductLibraryModule.confirmDestructiveAction()) return;
        ProductLibraryModule.state.assemblyDraftFiles = [];
        UI.renderCurrentPage();
    },

    previewAssemblyDraftFile: (index) => {
        const files = Array.isArray(ProductLibraryModule.state.assemblyDraftFiles) ? ProductLibraryModule.state.assemblyDraftFiles : [];
        const file = files[index];
        if (!file?.data) return;
        ProductLibraryModule.openPreviewModal(file);
    },

    previewAssemblyGroupFile: (groupId, index) => {
        const row = ProductLibraryModule.getAssemblyGroupById(groupId);
        if (!row) return;
        const files = Array.isArray(row.attachments) ? row.attachments : [];
        const file = files[index];
        if (!file?.data) return;
        ProductLibraryModule.openPreviewModal(file);
    },

    saveAssemblyGroup: async () => {
        const s = ProductLibraryModule.state;
        const all = DB.data?.data?.assemblyGroups || [];

        const name = String(s.assemblyDraftName || '').trim();
        if (!name) return alert('Parca grup adi zorunlu.');

        const code = String(s.assemblyDraftCode || ProductLibraryModule.generateAssemblyCode(s.assemblyEditingId || null)).trim().toUpperCase();
        if (!/^(GRP|MNT)-\d{6}$/.test(code)) return alert('ID kod formati gecersiz. Beklenen: GRP-000001');

        const exclude = s.assemblyEditingId
            ? { collection: 'assemblyGroups', id: s.assemblyEditingId, field: 'code' }
            : null;
        if (ProductLibraryModule.isGlobalCodeTaken(code, exclude)) {
            return alert('Bu ID kod baska bir kayitta kullaniliyor.');
        }

        const items = (Array.isArray(s.assemblyDraftItems) ? s.assemblyDraftItems : [])
            .map(item => ({
                id: String(item?.id || crypto.randomUUID()),
                source: String(item?.source || 'component'),
                refId: String(item?.refId || ''),
                code: String(item?.code || '').trim().toUpperCase(),
                name: String(item?.name || '').trim(),
                qty: Math.floor(Number(item?.qty || 0))
            }))
            .filter(item => item.code && item.name);

        if (items.length === 0) return alert('En az bir kalem secmelisiniz.');
        if (items.some(item => !Number.isFinite(item.qty) || item.qty <= 0)) return alert('Her kalem icin adet 1 veya daha buyuk olmalidir.');

        const seenCodes = new Set();
        for (const item of items) {
            if (seenCodes.has(item.code)) return alert('Ayni kod birden fazla kez eklenemez.');
            seenCodes.add(item.code);
        }

        const routesRaw = Array.isArray(s.assemblyDraftRoutes) ? s.assemblyDraftRoutes : [];
        const routes = routesRaw
            .map(r => ({
                id: String(r?.id || crypto.randomUUID()),
                stationId: String(r?.stationId || '').trim(),
                processId: ProductLibraryModule.getRouteProcessDisplayValue(r)
            }))
            .filter(r => r.stationId);
        const invalidStation = routes.find(r => !ProductLibraryModule.isValidRouteStationId(r.stationId));
        if (invalidStation) return alert('Rota satirinda gecersiz istasyon secimi var.');
        if (routes.some(r => !ProductLibraryModule.isSupplierRouteStationId(r.stationId) && !r.processId)) return alert('Her rota istasyonu icin islem ID secmek zorunlu.');

        const files = (Array.isArray(s.assemblyDraftFiles) ? s.assemblyDraftFiles : [])
            .map(file => ({
                name: String(file?.name || 'dosya').trim() || 'dosya',
                type: String(file?.type || '').trim(),
                size: Number(file?.size || 0),
                data: String(file?.data || '')
            }))
            .filter(file => file.data);

        const note = String(s.assemblyDraftNote || '').trim();
        const now = new Date().toISOString();

        if (s.assemblyEditingId) {
            const idx = all.findIndex(x => String(x?.id || '') === String(s.assemblyEditingId));
            if (idx === -1) {
                ProductLibraryModule.resetAssemblyDraft(true);
                return;
            }
            const old = all[idx];
            all[idx] = {
                ...old,
                code,
                name,
                note,
                items,
                routes,
                attachments: files,
                updated_at: now
            };
            ProductLibraryModule.state.assemblySelectedId = old.id;
        } else {
            const id = crypto.randomUUID();
            all.push({
                id,
                code,
                name,
                note,
                items,
                routes,
                attachments: files,
                created_at: now,
                updated_at: now
            });
            ProductLibraryModule.state.assemblySelectedId = id;
        }

        await DB.save();
        ProductLibraryModule.resetAssemblyDraft(true);
    },

    deleteAssemblyGroup: async (id) => {
        const all = DB.data?.data?.assemblyGroups || [];
        const row = all.find(x => String(x?.id || '') === String(id || ''));
        if (!row) return;
        if (!confirm('Bu parca grup kaydi silinsin mi?')) return;

        DB.data.data.assemblyGroups = all.filter(x => String(x?.id || '') !== String(id || ''));
        await DB.save();
        if (String(ProductLibraryModule.state.assemblySelectedId || '') === String(id || '')) {
            ProductLibraryModule.state.assemblySelectedId = null;
        }
        if (String(ProductLibraryModule.state.assemblyEditingId || '') === String(id || '')) {
            ProductLibraryModule.resetAssemblyDraft(true);
            return;
        }
        UI.renderCurrentPage();
    },

    renderAssemblyView: (container, row) => {
        const items = Array.isArray(row?.items) ? row.items : [];
        const units = (DB.data.data.units || []).slice();
        const unitMap = ProductLibraryModule.getRouteStationMap();
        const routes = Array.isArray(row?.routes) ? row.routes : [];
        const files = Array.isArray(row?.attachments) ? row.attachments : [];
        container.innerHTML = `
            <div style="max-width:1320px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:1rem;">
                    <h2 class="page-title" style="margin:0;">Parca Grup Detay</h2>
                    <button class="btn-sm" onclick="ProductLibraryModule.closeAssemblyGroupView()">geri</button>
                </div>
                <div class="card-table" style="padding:1rem; margin-bottom:1rem; border:2px solid #0f172a; border-radius:1rem;">
                    <div style="display:grid; grid-template-columns:1.4fr 1fr 1fr; gap:0.7rem;">
                        <div><div style="font-size:0.72rem; color:#64748b;">parca grup adi</div><div style="font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(row?.name || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">ID kod</div><div style="font-family:monospace; font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(row?.code || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">kalem sayisi</div><div style="font-weight:700; color:#334155;">${items.length}</div></div>
                    </div>
                    <div style="margin-top:0.75rem;"><div style="font-size:0.72rem; color:#64748b;">not</div><div style="color:#334155; white-space:pre-wrap;">${ProductLibraryModule.escapeHtml(row?.note || '-')}</div></div>
                </div>
                <div class="card-table" style="padding:1rem; border:2px solid #0f172a; border-radius:1rem;">
                    <div style="font-weight:700; margin-bottom:0.6rem;">Grup Kalemleri</div>
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                                <th style="padding:0.55rem; text-align:left;">Kaynak</th>
                                <th style="padding:0.55rem; text-align:left;">Urun adi</th>
                                <th style="padding:0.55rem; text-align:left;">ID kod</th>
                                <th style="padding:0.55rem; text-align:center;">Adet</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.length === 0 ? '<tr><td colspan="4" style="padding:0.9rem; color:#94a3b8; text-align:center;">Kalem yok.</td></tr>' : items.map(item => `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:0.55rem;">${item.source === 'master' ? 'Master' : 'Parca/Bilesen'}</td>
                                    <td style="padding:0.55rem; font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(item.name || '-')}</td>
                                    <td style="padding:0.55rem; font-family:monospace; color:#334155;">${ProductLibraryModule.escapeHtml(item.code || '-')}</td>
                                    <td style="padding:0.55rem; text-align:center; font-weight:700;">${Number(item.qty || 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="card-table" style="padding:1rem; margin-top:1rem; border:2px solid #0f172a; border-radius:1rem;">
                    <div style="font-weight:700; margin-bottom:0.6rem;">Rota</div>
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                                <th style="padding:0.5rem; text-align:left;">Sira</th>
                                <th style="padding:0.5rem; text-align:left;">Istasyon</th>
                                <th style="padding:0.5rem; text-align:left;">Islem ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${routes.length === 0 ? '<tr><td colspan="3" style="padding:0.8rem; color:#94a3b8;">Rota tanimli degil.</td></tr>' : routes.map((r, idx) => `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:0.5rem;">${idx + 1}</td>
                                    <td style="padding:0.5rem;">${ProductLibraryModule.escapeHtml(unitMap[r.stationId] || r.stationId || '-')}</td>
                                    <td style="padding:0.5rem; font-family:monospace; color:#334155;">${ProductLibraryModule.escapeHtml(ProductLibraryModule.getRouteProcessDisplayValue(r) || '-')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="card-table" style="padding:1rem; margin-top:1rem;">
                    <div style="font-weight:700; margin-bottom:0.6rem;">Dosyalar</div>
                    ${files.length === 0 ? '<div style="color:#94a3b8;">Dosya yok.</div>' : `
                        <div style="display:flex; flex-direction:column; gap:0.45rem;">
                            ${files.map((file, idx) => `
                                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.6rem; border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.45rem 0.6rem;">
                                    <div style="font-size:0.86rem; color:#334155;">${ProductLibraryModule.escapeHtml(file?.name || 'dosya')}</div>
                                    <button class="btn-sm" onclick="ProductLibraryModule.previewAssemblyGroupFile('${row.id}', ${idx})">goruntule</button>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    renderAssemblyPage: (container) => {
        const viewingId = String(ProductLibraryModule.state.assemblyViewingId || '').trim();
        if (viewingId) {
            const row = ProductLibraryModule.getAssemblyGroupById(viewingId);
            if (row) {
                ProductLibraryModule.renderAssemblyView(container, row);
                return;
            }
            ProductLibraryModule.state.assemblyViewingId = null;
        }

        const state = ProductLibraryModule.state;
        const filters = state.assemblyFilters || { name: '', code: '' };
        const qName = String(filters.name || '').trim().toLowerCase();
        const qCode = String(filters.code || '').trim().toLowerCase();
        const rows = ProductLibraryModule.getAssemblyGroups().filter(row => {
            const nameOk = !qName || String(row?.name || '').toLowerCase().includes(qName);
            const codeOk = !qCode || String(row?.code || '').toLowerCase().includes(qCode);
            return nameOk && codeOk;
        });

        const showForm = !!state.assemblyFormOpen;
        const draftCode = String(state.assemblyDraftCode || ProductLibraryModule.generateAssemblyCode(state.assemblyEditingId || null));
        const draftItems = Array.isArray(state.assemblyDraftItems) ? state.assemblyDraftItems : [];
        const masterCodes = draftItems
            .filter(item => String(item?.source || '') === 'master')
            .map(item => String(item?.code || '').trim().toUpperCase())
            .filter(Boolean);
        const componentCodes = draftItems
            .filter(item => String(item?.source || '') === 'component')
            .map(item => String(item?.code || '').trim().toUpperCase())
            .filter(Boolean);
        const routeStations = ProductLibraryModule.getRouteStationOptions();
        const unitMap = ProductLibraryModule.getRouteStationMap();
        const routes = Array.isArray(state.assemblyDraftRoutes) ? state.assemblyDraftRoutes : [];
        const files = Array.isArray(state.assemblyDraftFiles) ? state.assemblyDraftFiles : [];

        container.innerHTML = `
            <div style="max-width:1420px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:1rem;">
                    <h2 class="page-title" style="margin:0;">Parca Grup Olusturma</h2>
                    <button class="btn-sm" onclick="ProductLibraryModule.goWorkspaceMenu()">geri</button>
                </div>

                <div class="card-table" style="padding:1rem; margin-bottom:1rem; border:2px solid #0f172a; border-radius:1rem;">
                    <div style="display:grid; grid-template-columns:1fr 1fr auto; gap:0.7rem; align-items:center;">
                        <input id="asm_filter_name" value="${ProductLibraryModule.escapeHtml(filters.name || '')}" oninput="ProductLibraryModule.setAssemblyFilter('name', this.value, 'asm_filter_name')" placeholder="parca grup adi ile ara" style="height:42px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; font-weight:600;">
                        <input id="asm_filter_code" value="${ProductLibraryModule.escapeHtml(filters.code || '')}" oninput="ProductLibraryModule.setAssemblyFilter('code', this.value, 'asm_filter_code')" placeholder="ID kod ile ara" style="height:42px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; font-weight:600;">
                    </div>
                </div>

                <div class="card-table" style="padding:1rem; margin-bottom:1rem; border:2px solid #0f172a; border-radius:1rem;">
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.75rem; text-transform:uppercase;">
                                <th style="padding:0.55rem; text-align:left;">Parca grup</th>
                                <th style="padding:0.55rem; text-align:center;">Kalem</th>
                                <th style="padding:0.55rem; text-align:left;">ID kod</th>
                                <th style="padding:0.55rem; text-align:center;">Goruntule</th>
                                <th style="padding:0.55rem; text-align:center;">Duzenle</th>
                                <th style="padding:0.55rem; text-align:center;">Sec</th>
                                <th style="padding:0.55rem; text-align:center;">Sil</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.length === 0 ? '<tr><td colspan="7" style="padding:0.95rem; color:#94a3b8; text-align:center;">Kayitli parca grup yok.</td></tr>' : rows.map(row => `
                                <tr style="border-bottom:1px solid #f1f5f9; ${state.assemblySelectedId === row.id ? 'background:#ffe4e6;' : ''}">
                                    <td style="padding:0.55rem; font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(row?.name || '-')}</td>
                                    <td style="padding:0.55rem; text-align:center; font-weight:700;">${Array.isArray(row?.items) ? row.items.length : 0}</td>
                                    <td style="padding:0.55rem; font-family:monospace; color:#334155;">${ProductLibraryModule.escapeHtml(row?.code || '-')}</td>
                                    <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.openAssemblyGroupView('${row.id}')">goruntule</button></td>
                                    <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.startEditAssemblyGroup('${row.id}')">duzenle</button></td>
                                    <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.selectAssemblyGroup('${row.id}')" style="${state.assemblySelectedId === row.id ? 'background:#0f172a; color:white; border-color:#0f172a;' : ''}">sec</button></td>
                                    <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.deleteAssemblyGroup('${row.id}')">sil</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                ${showForm ? `
                    <div id="assembly_form_anchor" class="card-table" style="padding:1rem; border:2px solid #0f172a; border-radius:1rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:0.8rem;">
                            <h3 style="margin:0; font-size:1.3rem; color:#334155;">Parca grup olustur</h3>
                            <div style="display:flex; gap:0.5rem;">
                                ${state.assemblyEditingId ? `<button class="btn-sm" onclick="ProductLibraryModule.deleteAssemblyGroup('${state.assemblyEditingId}')" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;">Sil</button>` : ''}
                                <button class="btn-sm" onclick="ProductLibraryModule.resetAssemblyDraft(true)">Vazgec</button>
                                <button class="btn-primary" onclick="ProductLibraryModule.saveAssemblyGroup()">Kaydet</button>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:1.5fr 1fr 2fr; gap:0.7rem; margin-bottom:0.8rem;">
                            <div>
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">parca grup adi *</label>
                                <input value="${ProductLibraryModule.escapeHtml(state.assemblyDraftName || '')}" oninput="ProductLibraryModule.state.assemblyDraftName=this.value" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-weight:700;">
                            </div>
                            <div>
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">ID kod</label>
                                <input disabled value="${ProductLibraryModule.escapeHtml(draftCode)}" style="width:100%; height:40px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace; font-weight:700;">
                            </div>
                            <div>
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">not</label>
                                <input value="${ProductLibraryModule.escapeHtml(state.assemblyDraftNote || '')}" oninput="ProductLibraryModule.state.assemblyDraftNote=this.value" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:1fr; gap:0.9rem;">
                            <div>
                                <div style="margin-bottom:0.65rem;">
                                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">master urun kutuphanesi hammadde ID kodlari</label>
                                    <div style="display:grid; grid-template-columns:1fr auto auto; gap:0.45rem; align-items:center;">
                                        <input readonly value="${ProductLibraryModule.escapeHtml(masterCodes.join(', '))}" placeholder="master secimi yok" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-family:monospace; background:#f8fafc;">
                                        <button class="btn-sm" onclick="ProductLibraryModule.openMasterPickerForAssembly()" style="height:40px; min-width:110px;">goruntule</button>
                                        <button class="btn-sm" onclick="ProductLibraryModule.clearAssemblyDraftItemsBySource('master')" style="height:40px; min-width:80px;">sil</button>
                                    </div>
                                </div>

                                <div style="margin-bottom:0.65rem;">
                                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">parca ve bilesen ID kodlari</label>
                                    <div style="display:grid; grid-template-columns:1fr auto auto; gap:0.45rem; align-items:center;">
                                        <input readonly value="${ProductLibraryModule.escapeHtml(componentCodes.join(', '))}" placeholder="parca/bilesen secimi yok" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-family:monospace; background:#f8fafc;">
                                        <button class="btn-sm" onclick="ProductLibraryModule.openComponentPickerForAssembly()" style="height:40px; min-width:110px;">goruntule</button>
                                        <button class="btn-sm" onclick="ProductLibraryModule.clearAssemblyDraftItemsBySource('component')" style="height:40px; min-width:80px;">sil</button>
                                    </div>
                                </div>

                                <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.7rem;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.45rem;">
                                        <strong style="font-size:0.92rem;">Secilen Kalemler</strong>
                                        <span style="font-size:0.8rem; color:#64748b;">Toplam: ${draftItems.length}</span>
                                    </div>
                                    <table style="width:100%; border-collapse:collapse;">
                                        <thead>
                                            <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.73rem; text-transform:uppercase;">
                                                <th style="padding:0.45rem; text-align:left;">Kaynak</th>
                                                <th style="padding:0.45rem; text-align:left;">Urun</th>
                                                <th style="padding:0.45rem; text-align:left;">ID kod</th>
                                                <th style="padding:0.45rem; text-align:center;">Adet</th>
                                                <th style="padding:0.45rem; text-align:center;">Goruntule</th>
                                                <th style="padding:0.45rem; text-align:right;">Islem</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${draftItems.length === 0 ? '<tr><td colspan="6" style="padding:0.9rem; color:#94a3b8; text-align:center;">Kalem secilmedi.</td></tr>' : draftItems.map(item => `
                                                <tr style="border-bottom:1px solid #f1f5f9;">
                                                    <td style="padding:0.45rem;">${item.source === 'master' ? 'Master' : 'Parca'}</td>
                                                    <td style="padding:0.45rem; font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(item.name || '-')}</td>
                                                    <td style="padding:0.45rem; font-family:monospace; color:#334155;">${ProductLibraryModule.escapeHtml(item.code || '-')}</td>
                                                    <td style="padding:0.45rem; text-align:center;">
                                                        <input type="number" min="1" step="1" value="${Number(item.qty || 1)}" onchange="ProductLibraryModule.setAssemblyDraftItemQty('${ProductLibraryModule.escapeHtml(item.code || '')}', this.value)" style="width:80px; height:34px; border:1px solid #cbd5e1; border-radius:0.45rem; padding:0 0.45rem; text-align:center;">
                                                    </td>
                                                    <td style="padding:0.45rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.viewAssemblyDraftItem('${ProductLibraryModule.escapeHtml(item.code || '')}')">goruntule</button></td>
                                                    <td style="padding:0.45rem; text-align:right;"><button class="btn-sm" onclick="ProductLibraryModule.removeAssemblyDraftItem('${ProductLibraryModule.escapeHtml(item.code || '')}')">sil</button></td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>

                                <div style="margin-top:0.75rem; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.7rem;">
                                    <div style="font-weight:700; margin-bottom:0.5rem;">Rota</div>
                                    <div style="display:flex; flex-direction:column; gap:0.45rem;">
                                        ${routes.length === 0 ? '<div style="font-size:0.82rem; color:#94a3b8;">Henuz rota istasyonu eklenmedi.</div>' : routes.map((r, idx) => `
                                            <div style="display:grid; grid-template-columns:1.2fr 1fr auto auto; gap:0.45rem; align-items:center;">
                                                <div style="font-weight:600; color:#334155;">${idx + 1}. istasyon ${ProductLibraryModule.escapeHtml(unitMap[r.stationId] || r.stationId || '-')}</div>
                                                <input readonly value="${ProductLibraryModule.escapeHtml(ProductLibraryModule.getRouteProcessDisplayValue(r) || '')}" placeholder="islem secilmedi" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.55rem; font-family:monospace; background:#f8fafc;">
                                                <button class="btn-sm" onclick="${ProductLibraryModule.isSupplierRouteStationId(r.stationId) ? 'return false;' : `ProductLibraryModule.openAssemblyRouteProcessPicker('${r.id}')`}" ${ProductLibraryModule.isSupplierRouteStationId(r.stationId) ? 'disabled style="opacity:0.55; cursor:not-allowed;"' : ''}>${ProductLibraryModule.isSupplierRouteStationId(r.stationId) ? 'fason' : (String(r.processId || '').trim() ? 'duzenle' : 'goruntule')}</button>
                                                <button class="btn-sm" onclick="ProductLibraryModule.removeAssemblyRouteRow('${r.id}')">sil</button>
                                            </div>
                                        `).join('')}
                                    </div>
                                    <div style="display:grid; grid-template-columns:1fr auto; gap:0.45rem; margin-top:0.7rem; max-width:430px;">
                                        <select onchange="ProductLibraryModule.setAssemblyRouteStation(this.value)" style="height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.6rem;">
                                            <option value="">istasyon sec</option>
                                            ${routeStations.map(u => `<option value="${u.id}" ${String(state.assemblyDraftRouteStationId || '') === String(u.id) ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(u.name)}</option>`).join('')}
                                        </select>
                                        <button class="btn-primary" onclick="ProductLibraryModule.addAssemblyRouteRow()">rota istasyonu ekle +</button>
                                    </div>
                                </div>

                                <div style="margin-top:0.75rem; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.65rem;">
                                    <div style="font-size:0.8rem; color:#64748b; margin-bottom:0.35rem;">resim/pdf dosya + ekle (opsiyonel)</div>
                                    <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onchange="ProductLibraryModule.handleAssemblyFiles(this)" style="width:100%;">
                                    <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.25rem;">Yeni secilen dosyalar listeye eklenir.</div>
                                    <div style="margin-top:0.55rem; display:flex; flex-direction:column; gap:0.35rem; max-height:220px; overflow:auto;">
                                        ${files.length === 0 ? '<div style="font-size:0.82rem; color:#94a3b8;">Dosya secilmedi.</div>' : files.map((file, idx) => `
                                            <div style="border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.35rem 0.45rem;">
                                                <div style="font-size:0.8rem; color:#334155; margin-bottom:0.3rem;">${ProductLibraryModule.escapeHtml(file?.name || 'dosya')}</div>
                                                <div style="display:flex; gap:0.35rem;">
                                                    <button class="btn-sm" onclick="ProductLibraryModule.previewAssemblyDraftFile(${idx})">goruntule</button>
                                                    <button class="btn-sm" onclick="ProductLibraryModule.removeAssemblyDraftFile(${idx})">kaldir</button>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    ensureModelDefaults: () => {
        if (!DB.data.data || typeof DB.data.data !== 'object') DB.data.data = {};
        if (!Array.isArray(DB.data.data.catalogProductVariants)) DB.data.data.catalogProductVariants = [];
        if (!DB.data.meta || typeof DB.data.meta !== 'object') DB.data.meta = {};
        if (!DB.data.meta.options || typeof DB.data.meta.options !== 'object') DB.data.meta.options = {};
        if (!Array.isArray(DB.data.meta.options.catalogProductGroups) || DB.data.meta.options.catalogProductGroups.length === 0) {
            DB.data.meta.options.catalogProductGroups = ['Aluminyum Dikmeler', 'Paslanmaz Dikmeler', 'Lux Seri Babalar'];
        }
        if (!ProductLibraryModule.state.modelFilters || typeof ProductLibraryModule.state.modelFilters !== 'object') {
            ProductLibraryModule.state.modelFilters = { group: '', name: '', code: '', plexiType: '', plexi: '', accessoryType: '', accessory: '', tubeType: '', tube: '' };
        }
        if (!ProductLibraryModule.state.modelGroupExpanded || typeof ProductLibraryModule.state.modelGroupExpanded !== 'object') {
            ProductLibraryModule.state.modelGroupExpanded = {};
        }
        if (!ProductLibraryModule.state.modelFamilyExpanded || typeof ProductLibraryModule.state.modelFamilyExpanded !== 'object') {
            ProductLibraryModule.state.modelFamilyExpanded = {};
        }
    },

    getModelGroupOptions: () => {
        ProductLibraryModule.ensureModelDefaults();
        return [...(DB.data.meta?.options?.catalogProductGroups || [])]
            .map(x => String(x || '').trim())
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, 'tr'));
    },

    getModelColorFieldConfig: (field) => {
        const map = {
            plexi: { typeKey: 'modelDraftPlexiColorType', nameKey: 'modelDraftPlexiColor', codeKey: 'modelDraftPlexiColorCode', label: 'pleksi rengi' },
            accessory: { typeKey: 'modelDraftAccessoryColorType', nameKey: 'modelDraftAccessoryColor', codeKey: 'modelDraftAccessoryColorCode', label: 'aksesuar rengi' },
            tube: { typeKey: 'modelDraftTubeColorType', nameKey: 'modelDraftTubeColor', codeKey: 'modelDraftTubeColorCode', label: 'boru rengi' }
        };
        return map[String(field || '')] || null;
    },

    getModelColorDraftValue: (field) => {
        const cfg = ProductLibraryModule.getModelColorFieldConfig(field);
        if (!cfg) return { type: '', name: '', code: '' };
        return {
            type: ProductLibraryModule.normalizeColorType(ProductLibraryModule.state[cfg.typeKey] || ''),
            name: String(ProductLibraryModule.state[cfg.nameKey] || '').trim(),
            code: String(ProductLibraryModule.state[cfg.codeKey] || '').trim().toUpperCase()
        };
    },

    setModelColorType: (field, value) => {
        const cfg = ProductLibraryModule.getModelColorFieldConfig(field);
        if (!cfg) return;
        ProductLibraryModule.state[cfg.typeKey] = ProductLibraryModule.normalizeColorType(value || '');
        ProductLibraryModule.state[cfg.nameKey] = '';
        ProductLibraryModule.state[cfg.codeKey] = '';
        UI.renderCurrentPage();
    },

    setModelColor: (field, value) => {
        const cfg = ProductLibraryModule.getModelColorFieldConfig(field);
        if (!cfg) return;
        const type = ProductLibraryModule.normalizeColorType(ProductLibraryModule.state[cfg.typeKey] || '');
        const options = ProductLibraryModule.getColorLibraryItemsByType(type);
        const row = options.find(x => String(x.name || '') === String(value || '')) || null;
        ProductLibraryModule.state[cfg.nameKey] = row ? String(row.name || '') : '';
        ProductLibraryModule.state[cfg.codeKey] = row ? String(row.code || '').trim().toUpperCase() : '';
        UI.renderCurrentPage();
    },

    renderModelColorField: (field) => {
        const cfg = ProductLibraryModule.getModelColorFieldConfig(field);
        if (!cfg) return '';
        const active = ProductLibraryModule.getModelColorDraftValue(field);
        const options = ProductLibraryModule.getColorLibraryItemsByType(active.type);
        return `
            <div>
                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.22rem;">${ProductLibraryModule.escapeHtml(cfg.label)}</label>
                <div style="height:40px; border:1px solid #cbd5e1; border-radius:0.7rem; overflow:hidden; display:grid; grid-template-columns:42% 58%;">
                    <div style="background:#d9e9f8; border-right:1px solid #cbd5e1;">
                    <select onchange="ProductLibraryModule.setModelColorType('${field}', this.value)" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.6rem; font-weight:700; color:#334155;">
                        <option value="">kategori sec</option>
                        ${ProductLibraryModule.getColorTypeOptions().map(opt => `<option value="${opt.id}" ${active.type === opt.id ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(opt.shortLabel || opt.label)}</option>`).join('')}
                    </select>
                    </div>
                    <div style="background:${active.type ? 'white' : '#f1f5f9'};">
                    <select ${active.type ? '' : 'disabled'} onchange="ProductLibraryModule.setModelColor('${field}', this.value)" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.6rem; font-weight:700; color:${active.type ? '#111827' : '#94a3b8'};">
                        <option value="">renk sec</option>
                        ${options.map(opt => `<option value="${ProductLibraryModule.escapeHtml(opt.name || '')}" ${active.name === String(opt.name || '') ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(opt.name || '')}</option>`).join('')}
                    </select>
                    </div>
                </div>
            </div>
        `;
    },

    renderModelListColorFilter: (field) => {
        const cfg = ProductLibraryModule.getModelColorFieldConfig(field);
        if (!cfg) return '';
        const filters = ProductLibraryModule.state.modelFilters || {};
        const typeKey = `${field}Type`;
        const activeType = ProductLibraryModule.normalizeColorType(filters[typeKey] || '');
        const activeName = String(filters[field] || '');
        const options = ProductLibraryModule.getColorLibraryItemsByType(activeType);
        return `
            <div>
                <div style="font-size:0.72rem; color:#64748b; margin:0 0 0.16rem 0.15rem;">${ProductLibraryModule.escapeHtml(cfg.label)}</div>
                <div style="height:42px; border:1px solid #cbd5e1; border-radius:0.7rem; overflow:hidden; display:grid; grid-template-columns:42% 58%; background:white;">
                    <div style="background:#d9e9f8; border-right:1px solid #cbd5e1;">
                        <select onchange="ProductLibraryModule.setModelFilter('${typeKey}', this.value)" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.6rem; font-weight:700; color:#334155;">
                            <option value="">kategori sec</option>
                            ${ProductLibraryModule.getColorTypeOptions().map(opt => `<option value="${opt.id}" ${activeType === opt.id ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(opt.shortLabel || opt.label)}</option>`).join('')}
                        </select>
                    </div>
                    <div style="background:${activeType ? 'white' : '#f1f5f9'};">
                        <select ${activeType ? '' : 'disabled'} onchange="ProductLibraryModule.setModelFilter('${field}', this.value)" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.6rem; font-weight:700; color:${activeType ? '#111827' : '#94a3b8'};">
                            <option value="">renk sec</option>
                            ${options.map(opt => `<option value="${ProductLibraryModule.escapeHtml(opt.name || '')}" ${activeName === String(opt.name || '') ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(opt.name || '')}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
        `;
    },

    getModelMontageCardOptions: () => {
        return (Array.isArray(DB.data?.data?.montageCards) ? DB.data.data.montageCards : [])
            .map(row => ({
                id: String(row?.id || ''),
                cardCode: String(row?.cardCode || '').trim().toUpperCase(),
                productCode: String(row?.productCode || '').trim().toUpperCase(),
                productName: String(row?.productName || '').trim()
            }))
            .filter(row => row.id && (row.cardCode || row.productName))
            .sort((a, b) => {
                const nameCmp = String(a.productName || '').localeCompare(String(b.productName || ''), 'tr');
                if (nameCmp !== 0) return nameCmp;
                return String(a.cardCode || '').localeCompare(String(b.cardCode || ''), 'tr');
            });
    },

    getCatalogProductVariants: () => {
        ProductLibraryModule.ensureModelDefaults();
        return (DB.data.data.catalogProductVariants || [])
            .filter(row => row && typeof row === 'object')
            .map((row, index) => {
                const familyCodeRaw = String(row.familyCode || '').trim().toUpperCase();
                const variantCodeRaw = String(row.variantCode || '').trim().toUpperCase();
                const familyCode = familyCodeRaw || (variantCodeRaw.includes('-V') ? variantCodeRaw.split('-V')[0] : '');
                const normalizeColorBlock = (block, fallbackType, fallbackName, fallbackCode) => {
                    const strict = ProductLibraryModule.resolveStrictLibraryColorSelection({
                        colorType: block?.type || fallbackType || '',
                        colorCode: block?.code || fallbackCode || '',
                        colorName: block?.name || fallbackName || ''
                    });
                    if (strict.found) return { type: strict.type, name: strict.name, code: strict.code };
                    return {
                        type: ProductLibraryModule.normalizeColorType(block?.type || fallbackType || ''),
                        name: String(block?.name || fallbackName || '').trim(),
                        code: String(block?.code || fallbackCode || '').trim().toUpperCase()
                    };
                };
                const masterRefs = ProductLibraryModule.normalizeModelMasterRefs(row);
                return {
                    id: String(row.id || ''),
                    orderIndex: index,
                    familyId: String(row.familyId || '').trim() || String(row.id || ''),
                    familyCode,
                    familyName: String(row.familyName || row.productName || '').trim(),
                    variantCode: variantCodeRaw,
                    productName: String(row.productName || row.name || '').trim(),
                    productGroup: String(row.productGroup || row.group || '').trim(),
                    masterRefs,
                    masterRef: masterRefs[0] || null,
                    items: (Array.isArray(row.items) ? row.items : [])
                        .map(item => ({
                            id: String(item?.id || crypto.randomUUID()),
                            source: String(item?.source || 'component'),
                            refId: String(item?.refId || ''),
                            code: String(item?.code || '').trim().toUpperCase(),
                            name: String(item?.name || '').trim(),
                            qty: Math.max(1, Number(item?.qty || 1))
                        }))
                        .filter(item => item.code),
                    montageCard: row.montageCard && typeof row.montageCard === 'object'
                        ? {
                            id: String(row.montageCard.id || '').trim(),
                            cardCode: String(row.montageCard.cardCode || '').trim().toUpperCase(),
                            productCode: String(row.montageCard.productCode || '').trim().toUpperCase(),
                            productName: String(row.montageCard.productName || '').trim()
                        }
                        : null,
                    colors: {
                        plexi: normalizeColorBlock(row.colors?.plexi, row.plexiColorType, row.plexiColor, row.plexiColorCode),
                        accessory: normalizeColorBlock(row.colors?.accessory, row.accessoryColorType, row.accessoryColor, row.accessoryColorCode),
                        tube: normalizeColorBlock(row.colors?.tube, row.tubeColorType, row.tubeColor, row.tubeColorCode)
                    },
                    productFiles: (Array.isArray(row.productFiles) ? row.productFiles : [])
                        .map(file => ({
                            name: String(file?.name || 'dosya').trim() || 'dosya',
                            type: String(file?.type || '').trim(),
                            size: Number(file?.size || 0),
                            data: String(file?.data || '')
                        }))
                        .filter(file => file.data),
                    explodedFiles: (Array.isArray(row.explodedFiles) ? row.explodedFiles : [])
                        .map(file => ({
                            name: String(file?.name || 'dosya').trim() || 'dosya',
                            type: String(file?.type || '').trim(),
                            size: Number(file?.size || 0),
                            data: String(file?.data || '')
                        }))
                        .filter(file => file.data),
                    note: String(row.note || '').trim(),
                    createdAt: String(row.created_at || ''),
                    updatedAt: String(row.updated_at || '')
                };
            })
            .filter(row => row.id && row.variantCode && row.productName);
    },

    getCatalogVariantById: (id) => {
        return ProductLibraryModule.getCatalogProductVariants().find(row => String(row.id || '') === String(id || '')) || null;
    },

    normalizeModelMasterRefs: (row = {}) => {
        const raw = Array.isArray(row.masterRefs)
            ? row.masterRefs
            : (row.masterRef && typeof row.masterRef === 'object' ? [row.masterRef] : []);
        return raw
            .map((item) => ({
                rowId: String(item?.rowId || item?.id || crypto.randomUUID()),
                id: String(item?.id || '').trim(),
                code: String(item?.code || '').trim().toUpperCase(),
                name: String(item?.name || '').trim(),
                categoryName: String(item?.categoryName || '').trim(),
                qty: Math.max(1, Number(item?.qty || 1))
            }))
            .filter((item) => item.code);
    },

    getModelMasterRefs: (row = {}) => {
        return ProductLibraryModule.normalizeModelMasterRefs(row);
    },

    syncModelDraftPrimaryMasterRef: () => {
        const rows = Array.isArray(ProductLibraryModule.state.modelDraftMasterRefs)
            ? ProductLibraryModule.state.modelDraftMasterRefs
            : [];
        const first = rows.find((item) => String(item?.code || '').trim()) || null;
        ProductLibraryModule.state.modelDraftMasterRef = first
            ? {
                id: String(first.id || '').trim(),
                code: String(first.code || '').trim().toUpperCase(),
                name: String(first.name || '').trim(),
                categoryName: String(first.categoryName || '').trim()
            }
            : null;
    },

    buildModelFileSignature: (files) => {
        return (Array.isArray(files) ? files : [])
            .map(file => `${String(file?.name || '').trim().toLowerCase()}|${Number(file?.size || 0)}|${String(file?.data || '').slice(0, 120)}`)
            .join('||');
    },

    buildModelVariantSignature: (row = {}) => {
        const colors = row.colors || {};
        const masterCodes = ProductLibraryModule.getModelMasterRefs(row)
            .map((item) => ProductLibraryModule.normalizeAsciiUpper(item.code || ''))
            .join('|');
        return [
            ProductLibraryModule.normalizeAsciiUpper(row.productName || ''),
            ProductLibraryModule.normalizeAsciiUpper(row.productGroup || ''),
            ProductLibraryModule.normalizeColorType(colors.plexi?.type || ''),
            ProductLibraryModule.normalizeAsciiUpper(colors.plexi?.name || ''),
            ProductLibraryModule.normalizeColorType(colors.accessory?.type || ''),
            ProductLibraryModule.normalizeAsciiUpper(colors.accessory?.name || ''),
            ProductLibraryModule.normalizeColorType(colors.tube?.type || ''),
            ProductLibraryModule.normalizeAsciiUpper(colors.tube?.name || ''),
            masterCodes,
            (Array.isArray(row.items) ? row.items : []).map(item => `${String(item?.source || '')}:${ProductLibraryModule.normalizeAsciiUpper(item?.code || '')}`).join('|'),
            ProductLibraryModule.normalizeAsciiUpper(row.montageCard?.cardCode || ''),
            ProductLibraryModule.normalizeAsciiUpper(row.note || ''),
            ProductLibraryModule.buildModelFileSignature(row.productFiles),
            ProductLibraryModule.buildModelFileSignature(row.explodedFiles)
        ].join('||');
    },

    findDuplicateModelVariant: (row = {}, excludeId = '') => {
        const targetSignature = ProductLibraryModule.buildModelVariantSignature(row);
        if (!targetSignature) return null;
        return ProductLibraryModule.getCatalogProductVariants().find(item => {
            if (excludeId && String(item.id || '') === String(excludeId || '')) return false;
            const sameFamily = row.familyId
                ? String(item.familyId || '') === String(row.familyId || '')
                : (
                    ProductLibraryModule.normalizeAsciiUpper(item.familyName || '') === ProductLibraryModule.normalizeAsciiUpper(row.familyName || '') &&
                    ProductLibraryModule.normalizeAsciiUpper(item.productGroup || '') === ProductLibraryModule.normalizeAsciiUpper(row.productGroup || '')
                );
            return sameFamily && ProductLibraryModule.buildModelVariantSignature(item) === targetSignature;
        }) || null;
    },

    generateModelFamilyCode: () => {
        const max = ProductLibraryModule.getCatalogProductVariants().reduce((acc, row) => {
            const match = String(row.familyCode || '').match(/^URM-(\d{6})$/);
            if (!match) return acc;
            return Math.max(acc, Number(match[1]));
        }, 0);
        let next = max + 1;
        let candidate = `URM-${String(next).padStart(6, '0')}`;
        while (ProductLibraryModule.isGlobalCodeTaken(candidate)) {
            next += 1;
            candidate = `URM-${String(next).padStart(6, '0')}`;
        }
        return candidate;
    },

    generateModelVariantCode: (familyCode, excludeId = '') => {
        const safeFamilyCode = String(familyCode || '').trim().toUpperCase();
        if (!safeFamilyCode) return '';
        const escaped = safeFamilyCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`^${escaped}-V(\\d{2})$`);
        const max = ProductLibraryModule.getCatalogProductVariants().reduce((acc, row) => {
            if (excludeId && String(row.id || '') === String(excludeId || '')) return acc;
            const match = String(row.variantCode || '').match(regex);
            if (!match) return acc;
            return Math.max(acc, Number(match[1]));
        }, 0);
        return `${safeFamilyCode}-V${String(max + 1).padStart(2, '0')}`;
    },

    openModelForm: () => {
        const familyCode = ProductLibraryModule.generateModelFamilyCode();
        ProductLibraryModule.state.modelViewingId = null;
        ProductLibraryModule.state.modelFormOpen = true;
        ProductLibraryModule.state.modelEditingId = null;
        ProductLibraryModule.state.modelDraftFamilyId = crypto.randomUUID();
        ProductLibraryModule.state.modelDraftFamilyCode = familyCode;
        ProductLibraryModule.state.modelDraftFamilyName = '';
        ProductLibraryModule.state.modelDraftVariantCode = `${familyCode}-V01`;
        ProductLibraryModule.state.modelDraftName = '';
        ProductLibraryModule.state.modelDraftGroup = ProductLibraryModule.getModelGroupOptions()[0] || '';
        ProductLibraryModule.state.modelDraftPlexiColorType = '';
        ProductLibraryModule.state.modelDraftPlexiColor = '';
        ProductLibraryModule.state.modelDraftPlexiColorCode = '';
        ProductLibraryModule.state.modelDraftAccessoryColorType = '';
        ProductLibraryModule.state.modelDraftAccessoryColor = '';
        ProductLibraryModule.state.modelDraftAccessoryColorCode = '';
        ProductLibraryModule.state.modelDraftTubeColorType = '';
        ProductLibraryModule.state.modelDraftTubeColor = '';
        ProductLibraryModule.state.modelDraftTubeColorCode = '';
        ProductLibraryModule.state.modelDraftMasterRefs = [];
        ProductLibraryModule.state.modelDraftMasterRef = null;
        ProductLibraryModule.state.modelDraftItems = [];
        ProductLibraryModule.state.modelDraftMontageCard = null;
        ProductLibraryModule.state.modelDraftProductFiles = [];
        ProductLibraryModule.state.modelDraftExplodedFiles = [];
        ProductLibraryModule.state.modelDraftNote = '';
        ProductLibraryModule.state.modelMasterPickerRowId = '';
        ProductLibraryModule.state.modelComponentPickerRowId = '';
        UI.renderCurrentPage();
        setTimeout(() => document.getElementById('model_form_anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    },

    resetModelDraft: (close = true) => {
        ProductLibraryModule.state.modelEditingId = null;
        ProductLibraryModule.state.modelViewingId = null;
        ProductLibraryModule.state.modelDraftFamilyId = '';
        ProductLibraryModule.state.modelDraftFamilyCode = '';
        ProductLibraryModule.state.modelDraftFamilyName = '';
        ProductLibraryModule.state.modelDraftVariantCode = '';
        ProductLibraryModule.state.modelDraftName = '';
        ProductLibraryModule.state.modelDraftGroup = '';
        ProductLibraryModule.state.modelDraftPlexiColorType = '';
        ProductLibraryModule.state.modelDraftPlexiColor = '';
        ProductLibraryModule.state.modelDraftPlexiColorCode = '';
        ProductLibraryModule.state.modelDraftAccessoryColorType = '';
        ProductLibraryModule.state.modelDraftAccessoryColor = '';
        ProductLibraryModule.state.modelDraftAccessoryColorCode = '';
        ProductLibraryModule.state.modelDraftTubeColorType = '';
        ProductLibraryModule.state.modelDraftTubeColor = '';
        ProductLibraryModule.state.modelDraftTubeColorCode = '';
        ProductLibraryModule.state.modelDraftMasterRefs = [];
        ProductLibraryModule.state.modelDraftMasterRef = null;
        ProductLibraryModule.state.modelDraftItems = [];
        ProductLibraryModule.state.modelDraftMontageCard = null;
        ProductLibraryModule.state.modelDraftProductFiles = [];
        ProductLibraryModule.state.modelDraftExplodedFiles = [];
        ProductLibraryModule.state.modelDraftNote = '';
        ProductLibraryModule.state.modelMasterPickerRowId = '';
        ProductLibraryModule.state.modelComponentPickerRowId = '';
        ProductLibraryModule.state.modelFormOpen = !close;
        UI.renderCurrentPage();
    },

    loadModelDraftFromRow: (row) => {
        if (!row) return;
        ProductLibraryModule.state.modelViewingId = null;
        ProductLibraryModule.state.modelFormOpen = true;
        ProductLibraryModule.state.modelEditingId = row.id;
        ProductLibraryModule.state.modelSelectedId = row.id;
        ProductLibraryModule.state.modelDraftFamilyId = String(row.familyId || '');
        ProductLibraryModule.state.modelDraftFamilyCode = String(row.familyCode || '');
        ProductLibraryModule.state.modelDraftFamilyName = String(row.familyName || row.productName || '');
        ProductLibraryModule.state.modelDraftVariantCode = String(row.variantCode || '');
        ProductLibraryModule.state.modelDraftName = String(row.productName || '');
        ProductLibraryModule.state.modelDraftGroup = String(row.productGroup || '');
        ProductLibraryModule.state.modelDraftPlexiColorType = String(row.colors?.plexi?.type || '');
        ProductLibraryModule.state.modelDraftPlexiColor = String(row.colors?.plexi?.name || '');
        ProductLibraryModule.state.modelDraftPlexiColorCode = String(row.colors?.plexi?.code || '');
        ProductLibraryModule.state.modelDraftAccessoryColorType = String(row.colors?.accessory?.type || '');
        ProductLibraryModule.state.modelDraftAccessoryColor = String(row.colors?.accessory?.name || '');
        ProductLibraryModule.state.modelDraftAccessoryColorCode = String(row.colors?.accessory?.code || '');
        ProductLibraryModule.state.modelDraftTubeColorType = String(row.colors?.tube?.type || '');
        ProductLibraryModule.state.modelDraftTubeColor = String(row.colors?.tube?.name || '');
        ProductLibraryModule.state.modelDraftTubeColorCode = String(row.colors?.tube?.code || '');
        ProductLibraryModule.state.modelDraftMasterRefs = ProductLibraryModule.getModelMasterRefs(row)
            .map((item) => ({ ...item, qty: Math.max(1, Number(item?.qty || 1)) }));
        ProductLibraryModule.syncModelDraftPrimaryMasterRef();
        ProductLibraryModule.state.modelDraftItems = Array.isArray(row.items)
            ? row.items.map(item => ({ ...item, qty: Math.max(1, Number(item?.qty || 1)) }))
            : [];
        ProductLibraryModule.state.modelDraftMontageCard = row.montageCard ? { ...row.montageCard } : null;
        ProductLibraryModule.state.modelDraftProductFiles = Array.isArray(row.productFiles) ? row.productFiles.map(file => ({ ...file })) : [];
        ProductLibraryModule.state.modelDraftExplodedFiles = Array.isArray(row.explodedFiles) ? row.explodedFiles.map(file => ({ ...file })) : [];
        ProductLibraryModule.state.modelDraftNote = String(row.note || '');
        ProductLibraryModule.state.modelMasterPickerRowId = '';
        ProductLibraryModule.state.modelComponentPickerRowId = '';
        UI.renderCurrentPage();
        setTimeout(() => document.getElementById('model_form_anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    },

    startEditModelVariant: (id) => {
        const row = ProductLibraryModule.getCatalogVariantById(id);
        if (!row) return;
        ProductLibraryModule.loadModelDraftFromRow(row);
    },

    openModelVariantView: (id) => {
        const row = ProductLibraryModule.getCatalogVariantById(id);
        if (!row) return alert('Urun varyanti bulunamadi.');
        const code = String(row?.variantCode || '').trim();
        if (!code) return alert('Varyant ID kodu bulunamadi.');
        ProductLibraryModule.state.modelViewingId = null;
        if (typeof ReadOnlyViewer !== 'undefined' && ReadOnlyViewer && typeof ReadOnlyViewer.openByCode === 'function') {
            const opened = ReadOnlyViewer.openByCode(code, { silentNotFound: true });
            if (opened) return;
        }
        alert(`Bu varyant icin goruntuleme kaydi bulunamadi: ${code}`);
    },

    closeModelVariantView: () => {
        ProductLibraryModule.state.modelViewingId = null;
        UI.renderCurrentPage();
    },

    setModelFilter: (field, value, focusId = '') => {
        if (!ProductLibraryModule.state.modelFilters || typeof ProductLibraryModule.state.modelFilters !== 'object') {
            ProductLibraryModule.state.modelFilters = { group: '', name: '', code: '', plexiType: '', plexi: '', accessoryType: '', accessory: '', tubeType: '', tube: '' };
        }
        if (!Object.prototype.hasOwnProperty.call(ProductLibraryModule.state.modelFilters, field)) return;
        ProductLibraryModule.state.modelFilters[field] = String(value || '');
        if (field === 'plexiType' || field === 'accessoryType' || field === 'tubeType') {
            ProductLibraryModule.state.modelFilters[field.replace('Type', '')] = '';
        }
        UI.renderCurrentPage();
        if (!focusId) return;
        setTimeout(() => {
            const el = document.getElementById(focusId);
            if (!el) return;
            el.focus();
            const len = el.value.length;
            try { el.setSelectionRange(len, len); } catch (_) { }
        }, 0);
    },

    toggleModelGroupSection: (key) => {
        ProductLibraryModule.state.modelGroupExpanded[key] = !ProductLibraryModule.state.modelGroupExpanded[key];
        UI.renderCurrentPage();
    },

    toggleModelFamilySection: (key) => {
        const familyKey = String(key || '');
        const currentlyOpen = !!ProductLibraryModule.state.modelFamilyExpanded[familyKey];
        ProductLibraryModule.state.modelFamilyExpanded = currentlyOpen ? {} : { [familyKey]: true };
        UI.renderCurrentPage();
    },

    openModelGroupDictionary: () => {
        const items = ProductLibraryModule.getModelGroupOptions();
        Modal.open('Urun Grubu + Yonet', `
            <div style="display:flex; flex-direction:column; gap:0.8rem;">
                <div style="display:grid; grid-template-columns:1fr auto; gap:0.5rem;">
                    <input id="catalog_group_name" placeholder="urun grubu" style="height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                    <button class="btn-primary" onclick="ProductLibraryModule.addModelGroupOption()" style="height:38px; border-radius:0.55rem;">ekle</button>
                </div>
                <div style="display:flex; flex-direction:column; gap:0.4rem; max-height:360px; overflow:auto;">
                    ${items.map((item) => `
                        <div style="display:grid; grid-template-columns:1fr auto auto; gap:0.45rem; align-items:center; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem 0.55rem;">
                            <div style="font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(item)}</div>
                            <button class="btn-sm" onclick='ProductLibraryModule.renameModelGroupOption(${JSON.stringify(item)})'>duzenle</button>
                            <button class="btn-sm" onclick='ProductLibraryModule.removeModelGroupOption(${JSON.stringify(item)})'>sil</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `, { maxWidth: '640px' });
    },

    addModelGroupOption: async () => {
        const val = String(document.getElementById('catalog_group_name')?.value || '').trim();
        if (!val) return;
        const list = ProductLibraryModule.getModelGroupOptions();
        if (list.some(x => ProductLibraryModule.normalizeAsciiUpper(x) === ProductLibraryModule.normalizeAsciiUpper(val))) {
            return alert('Bu urun grubu zaten var.');
        }
        DB.data.meta.options.catalogProductGroups = [...list, val];
        await DB.save();
        ProductLibraryModule.openModelGroupDictionary();
        UI.renderCurrentPage();
    },

    renameModelGroupOption: async (currentValue) => {
        const list = ProductLibraryModule.getModelGroupOptions();
        const currentNorm = ProductLibraryModule.normalizeAsciiUpper(String(currentValue || ''));
        const idx = list.findIndex(x => ProductLibraryModule.normalizeAsciiUpper(String(x || '')) === currentNorm);
        if (idx < 0) return;
        const next = prompt('Yeni urun grubu adi:', list[idx] || '');
        if (!next) return;
        list[idx] = String(next || '').trim() || list[idx];
        DB.data.meta.options.catalogProductGroups = list;
        await DB.save();
        ProductLibraryModule.openModelGroupDictionary();
        UI.renderCurrentPage();
    },

    removeModelGroupOption: async (currentValue) => {
        const list = ProductLibraryModule.getModelGroupOptions();
        const currentNorm = ProductLibraryModule.normalizeAsciiUpper(String(currentValue || ''));
        const idx = list.findIndex(x => ProductLibraryModule.normalizeAsciiUpper(String(x || '')) === currentNorm);
        if (idx < 0) return;
        const target = list[idx];
        const inUse = ProductLibraryModule.getCatalogProductVariants().some(row =>
            ProductLibraryModule.normalizeAsciiUpper(row.productGroup || '') === ProductLibraryModule.normalizeAsciiUpper(target || '')
        );
        if (inUse) return alert('Bu urun grubu kayitlarda kullaniliyor.');
        if (!confirm(`"${target}" silinsin mi?`)) return;
        list.splice(idx, 1);
        DB.data.meta.options.catalogProductGroups = list;
        await DB.save();
        ProductLibraryModule.openModelGroupDictionary();
        UI.renderCurrentPage();
    },

    addModelMasterDraftRow: (openPicker = false) => {
        const rowId = crypto.randomUUID();
        const rows = Array.isArray(ProductLibraryModule.state.modelDraftMasterRefs)
            ? [...ProductLibraryModule.state.modelDraftMasterRefs]
            : [];
        rows.push({
            rowId,
            id: '',
            code: '',
            name: '',
            categoryName: '',
            qty: 1
        });
        ProductLibraryModule.state.modelDraftMasterRefs = rows;
        ProductLibraryModule.syncModelDraftPrimaryMasterRef();
        if (openPicker) {
            ProductLibraryModule.openModelMasterPicker(rowId);
            return;
        }
        UI.renderCurrentPage();
    },

    removeModelMasterDraftRow: (rowId) => {
        const rows = Array.isArray(ProductLibraryModule.state.modelDraftMasterRefs)
            ? ProductLibraryModule.state.modelDraftMasterRefs
            : [];
        if (!rows.some((row) => String(row?.rowId || '') === String(rowId || ''))) return;
        if (!ProductLibraryModule.confirmDestructiveAction()) return;
        ProductLibraryModule.state.modelDraftMasterRefs = rows.filter((row) => String(row?.rowId || '') !== String(rowId || ''));
        ProductLibraryModule.syncModelDraftPrimaryMasterRef();
        UI.renderCurrentPage();
    },

    setModelMasterQty: (rowId, value) => {
        const rows = Array.isArray(ProductLibraryModule.state.modelDraftMasterRefs)
            ? ProductLibraryModule.state.modelDraftMasterRefs
            : [];
        const row = rows.find((r) => String(r?.rowId || '') === String(rowId || ''));
        if (!row) return;
        const qty = Math.max(1, Math.floor(Number(value || 1) || 1));
        row.qty = qty;
    },

    openModelMasterPicker: (rowId = '') => {
        ProductLibraryModule.state.masterPickerSource = 'model-master-row';
        ProductLibraryModule.state.modelMasterPickerRowId = String(rowId || '').trim();
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.masterFormOpen = false;
        ProductLibraryModule.state.masterEditingId = null;
        ProductLibraryModule.state.workspaceView = 'master';
        UI.renderCurrentPage();
    },

    selectModelMaster: (id, rowId = '') => {
        const row = ProductLibraryModule.getMasterProductById(id);
        if (!row) return;
        const rows = Array.isArray(ProductLibraryModule.state.modelDraftMasterRefs)
            ? [...ProductLibraryModule.state.modelDraftMasterRefs]
            : [];
        const nextRowId = String(rowId || ProductLibraryModule.state.modelMasterPickerRowId || '').trim() || crypto.randomUUID();
        const duplicate = rows.find((item) =>
            String(item?.code || '').trim().toUpperCase() === String(row.code || '').trim().toUpperCase() &&
            String(item?.rowId || '') !== nextRowId
        );
        if (duplicate) {
            alert('Bu master urun zaten listede var.');
            return;
        }
        const nextRow = {
            rowId: nextRowId,
            id: String(row.id || ''),
            code: String(row.code || '').trim().toUpperCase(),
            name: String(row.name || '').trim(),
            categoryName: String(row.categoryName || '').trim(),
            qty: 1
        };
        const idx = rows.findIndex((item) => String(item?.rowId || '') === nextRowId);
        if (idx >= 0) rows[idx] = nextRow;
        else rows.push(nextRow);
        ProductLibraryModule.state.modelDraftMasterRefs = rows;
        ProductLibraryModule.syncModelDraftPrimaryMasterRef();
        ProductLibraryModule.state.masterPickerSource = '';
        ProductLibraryModule.state.modelMasterPickerRowId = '';
        ProductLibraryModule.state.workspaceView = 'models';
        ProductLibraryModule.state.modelFormOpen = true;
        ProductLibraryModule.state.modelViewingId = null;
        UI.renderCurrentPage();
    },

    clearModelMaster: (rowId = '') => {
        if (rowId) {
            ProductLibraryModule.removeModelMasterDraftRow(rowId);
            return;
        }
        ProductLibraryModule.state.modelDraftMasterRefs = [];
        ProductLibraryModule.syncModelDraftPrimaryMasterRef();
        UI.renderCurrentPage();
    },

    addModelComponentDraftRow: (openPicker = false) => {
        const rowId = crypto.randomUUID();
        const items = Array.isArray(ProductLibraryModule.state.modelDraftItems) ? [...ProductLibraryModule.state.modelDraftItems] : [];
        items.push({
            id: rowId,
            source: 'component',
            refId: '',
            code: '',
            name: '',
            qty: 1
        });
        ProductLibraryModule.state.modelDraftItems = items;
        if (openPicker) {
            ProductLibraryModule.openModelComponentPicker(rowId);
            return;
        }
        UI.renderCurrentPage();
    },

    openModelComponentPicker: (rowId = '') => {
        ProductLibraryModule.state.masterPickerSource = '';
        ProductLibraryModule.state.componentPickerSource = 'model-component-row';
        ProductLibraryModule.state.componentLibraryKind = 'PART';
        ProductLibraryModule.state.modelComponentPickerRowId = String(rowId || '').trim();
        ProductLibraryModule.state.componentViewingId = null;
        ProductLibraryModule.state.componentFormOpen = false;
        ProductLibraryModule.state.workspaceView = 'components';
        UI.renderCurrentPage();
    },

    addModelDraftComponent: (id, render = true, rowId = '') => {
        const row = ProductLibraryModule.getComponentCardById(id);
        if (!row) return false;
        const items = Array.isArray(ProductLibraryModule.state.modelDraftItems) ? [...ProductLibraryModule.state.modelDraftItems] : [];
        const nextRowId = String(rowId || '').trim();
        if (items.some(item =>
            String(item?.code || '') === String(row.code || '').trim().toUpperCase() &&
            String(item?.id || '') !== nextRowId
        )) {
            alert('Bu parca zaten secili.');
            return false;
        }
        const existing = items.find(i => String(i.id || '') === nextRowId);
        const nextItem = {
            id: nextRowId || crypto.randomUUID(),
            source: 'component',
            refId: String(row.id || ''),
            code: String(row.code || '').trim().toUpperCase(),
            name: String(row.name || '').trim(),
            qty: Math.max(1, Number(existing?.qty || 1))
        };
        if (nextRowId) {
            const idx = items.findIndex((item) => String(item?.id || '') === nextRowId);
            if (idx >= 0) items[idx] = nextItem;
            else items.push(nextItem);
        } else {
            items.push(nextItem);
        }
        ProductLibraryModule.state.modelDraftItems = items;
        if (render) UI.renderCurrentPage();
        return true;
    },

    setModelComponentQty: (id, value) => {
        const items = Array.isArray(ProductLibraryModule.state.modelDraftItems) ? ProductLibraryModule.state.modelDraftItems : [];
        const row = items.find((item) => String(item?.id || '') === String(id || ''));
        if (!row) return;
        const qty = Math.max(1, Math.floor(Number(value || 1) || 1));
        row.qty = qty;
    },

    syncModelDraftQtyFromDom: () => {
        const masterRows = Array.isArray(ProductLibraryModule.state.modelDraftMasterRefs)
            ? ProductLibraryModule.state.modelDraftMasterRefs
            : [];
        const componentRows = Array.isArray(ProductLibraryModule.state.modelDraftItems)
            ? ProductLibraryModule.state.modelDraftItems
            : [];

        const masterIndex = new Map(masterRows.map((row) => [String(row?.rowId || ''), row]));
        const componentIndex = new Map(componentRows.map((row) => [String(row?.id || ''), row]));

        document.querySelectorAll('input[data-model-master-qty-rowid]').forEach((input) => {
            const rowId = String(input.getAttribute('data-model-master-qty-rowid') || '');
            const row = masterIndex.get(rowId);
            if (!row) return;
            row.qty = Math.max(1, Math.floor(Number(input.value || 1) || 1));
        });

        document.querySelectorAll('input[data-model-component-qty-id]').forEach((input) => {
            const id = String(input.getAttribute('data-model-component-qty-id') || '');
            const row = componentIndex.get(id);
            if (!row) return;
            row.qty = Math.max(1, Math.floor(Number(input.value || 1) || 1));
        });
    },

    removeModelDraftItem: (id) => {
        const items = Array.isArray(ProductLibraryModule.state.modelDraftItems) ? ProductLibraryModule.state.modelDraftItems : [];
        if (!items.some(item => String(item?.id || '') === String(id || ''))) return;
        if (!ProductLibraryModule.confirmDestructiveAction()) return;
        ProductLibraryModule.state.modelDraftItems = items.filter(item => String(item?.id || '') !== String(id || ''));
        UI.renderCurrentPage();
    },

    previewModelDraftLinkedRecord: (kind, refId) => {
        const type = String(kind || '').trim().toLowerCase();
        const id = String(refId || '').trim();
        if (!id) return alert('Bagli kayit bulunamadi.');

        if (type === 'component') {
            const row = ProductLibraryModule.getComponentCardById(id);
            if (!row) return alert('Bagli parca kaydi bulunamadi.');
            ProductLibraryModule.state.componentLibraryKind = 'PART';
            ProductLibraryModule.state.workspaceView = 'components';
            ProductLibraryModule.openComponentCardView(id, {
                workspaceView: 'models',
                modelFormOpen: true
            });
            return;
        }

        if (type === 'master') {
            const row = ProductLibraryModule.getMasterProductById(id);
            if (!row) return alert('Bagli master urun kaydi bulunamadi.');
            const hasPreview = !!(row.attachment?.data || row.previewImage || row.previewPdf);
            if (!hasPreview) return alert('Goruntulenecek dosya yok.');
            ProductLibraryModule.previewMasterAttachment(id);
        }
    },

    moveModelDraftItem: (index, direction) => {
        const items = Array.isArray(ProductLibraryModule.state.modelDraftItems) ? [...ProductLibraryModule.state.modelDraftItems] : [];
        const idx = Number(index);
        const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (!Number.isInteger(idx) || idx < 0 || idx >= items.length) return;
        if (nextIdx < 0 || nextIdx >= items.length) return;
        const [row] = items.splice(idx, 1);
        items.splice(nextIdx, 0, row);
        ProductLibraryModule.state.modelDraftItems = items;
        UI.renderCurrentPage();
    },

    openModelDraftLinkedRecord: (kind, refId, mode = 'view') => {
        const type = String(kind || '').trim().toLowerCase();
        const id = String(refId || '').trim();
        const action = String(mode || 'view').trim().toLowerCase();
        if (!id) return alert('Bagli kayit bulunamadi.');

        if (type === 'component') {
            const row = ProductLibraryModule.getComponentCardById(id);
            if (!row) return alert('Bagli parca kaydi bulunamadi.');
            ProductLibraryModule.state.componentLibraryKind = 'PART';
            ProductLibraryModule.state.workspaceView = 'components';
            if (action === 'edit') ProductLibraryModule.startEditComponentCard(id);
            else ProductLibraryModule.openComponentCardView(id);
            return;
        }

        if (type === 'master') {
            const row = ProductLibraryModule.getMasterProductById(id);
            if (!row) return alert('Bagli master urun kaydi bulunamadi.');
            ProductLibraryModule.state.workspaceView = 'master';
            if (action === 'edit') {
                ProductLibraryModule.editMasterProduct(id);
                return;
            }
            const hasPreview = !!(row.attachment?.data || row.previewImage || row.previewPdf);
            if (hasPreview) {
                ProductLibraryModule.previewMasterAttachment(id);
                return;
            }
            ProductLibraryModule.state.masterSelectedId = id;
            ProductLibraryModule.state.masterFormOpen = false;
            ProductLibraryModule.state.masterEditingId = null;
            UI.renderCurrentPage();
        }
    },

    selectModelComponent: (id) => {
        const source = String(ProductLibraryModule.state.componentPickerSource || '');
        const rowId = source === 'model-component-row'
            ? String(ProductLibraryModule.state.modelComponentPickerRowId || '').trim()
            : '';
        const added = ProductLibraryModule.addModelDraftComponent(id, false, rowId);
        if (!added) return;
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.modelComponentPickerRowId = '';
        ProductLibraryModule.state.workspaceView = 'models';
        ProductLibraryModule.state.modelFormOpen = true;
        ProductLibraryModule.state.modelViewingId = null;
        UI.renderCurrentPage();
    },
    selectPlanningModel: (id) => {
        const row = ProductLibraryModule.getPlanningModelById(id) || ProductLibraryModule.getCatalogVariantById(id);
        if (!row) return;
        const modelId = String(row?.id || id || '').trim();
        if (!modelId) return;
        if (typeof StockModule !== 'undefined' && StockModule && StockModule.state?.inventoryRegistrationPickerPending) {
            const applied = typeof StockModule.selectInventoryRegistrationProductFromLibrary === 'function'
                ? StockModule.selectInventoryRegistrationProductFromLibrary('model', modelId)
                : false;
            if (!applied) return;
            ProductLibraryModule.resetLibraryAccordionState();
            ProductLibraryModule.state.planningPickerSource = '';
            ProductLibraryModule.state.workspaceView = 'menu';
            if (typeof Router !== 'undefined' && Router && typeof Router.navigate === 'function') {
                Router.navigate('stock', { fromBack: true });
                return;
            }
            UI.renderCurrentPage();
            return;
        }
        if (typeof PlanningModule?.applyPickedModel !== 'function') return;
        ProductLibraryModule.resetLibraryAccordionState();
        ProductLibraryModule.state.planningPickerSource = '';
        ProductLibraryModule.state.workspaceView = 'menu';
        PlanningModule.applyPickedModel(modelId);
    },
    selectPlanningComponent: (id) => {
        const row = ProductLibraryModule.getComponentCardById(id);
        if (!row) return;
        if (typeof StockModule !== 'undefined' && StockModule && StockModule.state?.inventoryRegistrationPickerPending) {
            const applied = typeof StockModule.selectInventoryRegistrationProductFromLibrary === 'function'
                ? StockModule.selectInventoryRegistrationProductFromLibrary('component', id)
                : false;
            if (!applied) return;
            ProductLibraryModule.resetLibraryAccordionState();
            ProductLibraryModule.state.componentLibraryKind = 'PART';
            ProductLibraryModule.state.planningPickerSource = '';
            ProductLibraryModule.state.workspaceView = 'menu';
            if (typeof Router !== 'undefined' && Router && typeof Router.navigate === 'function') {
                Router.navigate('stock', { fromBack: true });
                return;
            }
            UI.renderCurrentPage();
            return;
        }
        if (typeof PlanningModule?.applyPickedComponent !== 'function') return;
        ProductLibraryModule.resetLibraryAccordionState();
        ProductLibraryModule.state.componentLibraryKind = 'PART';
        ProductLibraryModule.state.planningPickerSource = '';
        ProductLibraryModule.state.workspaceView = 'menu';
        PlanningModule.applyPickedComponent(id);
    },
    selectPlanningSemiFinished: (id) => {
        const row = ProductLibraryModule.getSemiFinishedCardById(id);
        if (!row) return;
        if (typeof StockModule !== 'undefined' && StockModule && StockModule.state?.inventoryRegistrationPickerPending) {
            const applied = typeof StockModule.selectInventoryRegistrationProductFromLibrary === 'function'
                ? StockModule.selectInventoryRegistrationProductFromLibrary('semi', id)
                : false;
            if (!applied) return;
            ProductLibraryModule.resetLibraryAccordionState();
            ProductLibraryModule.state.componentLibraryKind = 'SEMI';
            ProductLibraryModule.state.planningPickerSource = '';
            ProductLibraryModule.state.workspaceView = 'menu';
            if (typeof Router !== 'undefined' && Router && typeof Router.navigate === 'function') {
                Router.navigate('stock', { fromBack: true });
                return;
            }
            UI.renderCurrentPage();
            return;
        }
        if (typeof PlanningModule?.applyPickedSemiFinished !== 'function') return;
        ProductLibraryModule.resetLibraryAccordionState();
        ProductLibraryModule.state.componentLibraryKind = 'SEMI';
        ProductLibraryModule.state.planningPickerSource = '';
        ProductLibraryModule.state.workspaceView = 'menu';
        PlanningModule.applyPickedSemiFinished(id);
    },

    openModelMontagePicker: () => {
        const unitId = UnitModule?.state?.activeUnitId || 'u3';
        if (typeof MontageLibraryModule !== 'undefined') {
            MontageLibraryModule.state.pickerContext = { source: 'model' };
        }
        if (typeof UnitModule !== 'undefined' && UnitModule && typeof UnitModule.openMontageLibrary === 'function') {
            if (typeof Router !== 'undefined' && Router && typeof Router.navigate === 'function') {
                Router.navigate('units', { fromBack: true });
            }
            UnitModule.openMontageLibrary(unitId, true);
        } else {
            alert('Montaj kutuphanesi acilamadi.');
        }
    },

    selectModelMontageCard: (id) => {
        const row = ProductLibraryModule.getModelMontageCardOptions().find(x => String(x.id || '') === String(id || ''));
        if (!row) return;
        ProductLibraryModule.state.modelDraftMontageCard = {
            id: row.id,
            cardCode: row.cardCode,
            productCode: row.productCode,
            productName: row.productName
        };
        Modal.close();
        UI.renderCurrentPage();
    },

    clearModelMontageCard: () => {
        if (!ProductLibraryModule.confirmDestructiveAction()) return;
        ProductLibraryModule.state.modelDraftMontageCard = null;
        UI.renderCurrentPage();
    },

    getModelDraftFiles: (kind) => {
        return kind === 'exploded'
            ? (Array.isArray(ProductLibraryModule.state.modelDraftExplodedFiles) ? ProductLibraryModule.state.modelDraftExplodedFiles : [])
            : (Array.isArray(ProductLibraryModule.state.modelDraftProductFiles) ? ProductLibraryModule.state.modelDraftProductFiles : []);
    },

    setModelDraftFiles: (kind, files) => {
        if (kind === 'exploded') ProductLibraryModule.state.modelDraftExplodedFiles = files;
        else ProductLibraryModule.state.modelDraftProductFiles = files;
    },

    handleModelFiles: async (kind, input) => {
        const fileList = Array.from(input?.files || []);
        if (fileList.length === 0) return;
        const maxFileSize = 25 * 1024 * 1024;
        const allowed = ['pdf', 'jpg', 'jpeg', 'png'];
        const normalized = [];

        for (const file of fileList) {
            const name = String(file?.name || '');
            const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
            if (!allowed.includes(ext)) {
                alert(`Desteklenmeyen dosya: ${name}`);
                continue;
            }
            if (Number(file?.size || 0) > maxFileSize) {
                alert(`${name} 25MB sinirini asiyor.`);
                continue;
            }
            try {
                const data = await ProductLibraryModule.readFileAsDataUrl(file);
                normalized.push({ name, type: String(file.type || ''), size: Number(file.size || 0), data });
            } catch (_) { }
        }

        if (normalized.length === 0) return;
        const existing = ProductLibraryModule.getModelDraftFiles(kind);
        const merged = [...existing];
        const seen = new Set(existing.map(file => `${String(file?.name || '').trim().toLowerCase()}|${Number(file?.size || 0)}|${String(file?.data || '').slice(0, 120)}`));
        normalized.forEach(file => {
            const key = `${String(file?.name || '').trim().toLowerCase()}|${Number(file?.size || 0)}|${String(file?.data || '').slice(0, 120)}`;
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(file);
        });
        ProductLibraryModule.setModelDraftFiles(kind, merged);
        if (input) input.value = '';
        UI.renderCurrentPage();
    },

    removeModelDraftFile: (kind, index) => {
        const files = [...ProductLibraryModule.getModelDraftFiles(kind)];
        if (index < 0 || index >= files.length) return;
        if (!ProductLibraryModule.confirmDestructiveAction()) return;
        files.splice(index, 1);
        ProductLibraryModule.setModelDraftFiles(kind, files);
        UI.renderCurrentPage();
    },

    clearModelDraftFiles: (kind) => {
        if (!ProductLibraryModule.confirmDestructiveAction()) return;
        ProductLibraryModule.setModelDraftFiles(kind, []);
        UI.renderCurrentPage();
    },

    previewModelDraftFile: (kind, index) => {
        const files = ProductLibraryModule.getModelDraftFiles(kind);
        const file = files[index];
        if (!file?.data) return;
        ProductLibraryModule.openPreviewModal(file);
    },

    previewModelStoredFile: (id, kind, index) => {
        const row = ProductLibraryModule.getCatalogVariantById(id);
        if (!row) return;
        const files = kind === 'exploded' ? (row.explodedFiles || []) : (row.productFiles || []);
        const file = files[index];
        if (!file?.data) return;
        ProductLibraryModule.openPreviewModal(file);
    },

    getModelMasterColorLabel: (masterRef) => {
        if (!masterRef?.id) return '-';
        const row = ProductLibraryModule.getMasterProductById(masterRef.id);
        if (!row) return '-';
        const linked = ProductLibraryModule.resolveLinkedColorInfo({
            colorType: row?.specs?.colorType || row?.colorType || '',
            colorCode: row?.specs?.colorCode || row?.colorCode || '',
            colorName: row?.specs?.color || row?.color || ''
        });
        return linked.name || '-';
    },

    getModelComponentColorLabel: (item) => {
        if (!item?.refId) return '-';
        const row = ProductLibraryModule.getComponentCardById(item.refId);
        if (!row) return '-';
        const linked = ProductLibraryModule.resolveLinkedColorInfo({
            colorType: row?.colorType || '',
            colorCode: row?.colorCode || '',
            colorName: row?.subGroup || ''
        });
        return linked.name || String(row?.subGroup || '').trim() || '-';
    },

    renderModelStoredFileCards: (rowId, kind, files = []) => {
        if (!Array.isArray(files) || files.length === 0) {
            return '<div style="color:#94a3b8;">Dosya yok.</div>';
        }
        return files.map((file, idx) => {
            const type = String(file?.type || '').toLowerCase();
            const data = String(file?.data || '');
            const isImage = type.startsWith('image/') || data.startsWith('data:image/');
            const isPdf = type.includes('pdf') || data.startsWith('data:application/pdf');
            const previewBox = isImage
                ? `<div style="border:1px solid #e2e8f0; border-radius:0.75rem; background:#f8fafc; padding:0.45rem; display:flex; align-items:center; justify-content:center; min-height:180px; overflow:hidden;"><img src="${data}" alt="${ProductLibraryModule.escapeHtml(file?.name || 'dosya')}" style="max-width:100%; max-height:170px; object-fit:contain; border-radius:0.45rem;"></div>`
                : isPdf
                    ? `<div style="border:1px solid #e2e8f0; border-radius:0.75rem; background:#f8fafc; min-height:220px; overflow:hidden;"><iframe src="${data}" title="${ProductLibraryModule.escapeHtml(file?.name || 'pdf')}" style="width:100%; height:220px; border:0; background:white;"></iframe></div>`
                    : `<div style="border:1px solid #e2e8f0; border-radius:0.75rem; background:#f8fafc; padding:0.75rem; min-height:180px; display:flex; align-items:center; justify-content:center; color:#64748b; font-weight:800;">PDF / DOSYA ONIZLEME</div>`;
            return `
                <div style="border:1px solid #e2e8f0; border-radius:0.8rem; padding:0.55rem; background:white;">
                    ${previewBox}
                    <div style="font-size:0.82rem; margin:0.5rem 0 0.4rem; color:#334155; word-break:break-word;">${ProductLibraryModule.escapeHtml(file?.name || 'dosya')}</div>
                    <button class="btn-sm" onclick="ProductLibraryModule.previewModelStoredFile('${rowId}', '${kind}', ${idx})">goruntule</button>
                </div>
            `;
        }).join('');
    },

    collectModelDraftPayload: () => {
        const productName = String(ProductLibraryModule.state.modelDraftName || '').trim();
        const productGroup = String(ProductLibraryModule.state.modelDraftGroup || '').trim();
        const familyId = String(ProductLibraryModule.state.modelDraftFamilyId || '').trim();
        const familyCode = String(ProductLibraryModule.state.modelDraftFamilyCode || '').trim().toUpperCase();
        const familyName = String(ProductLibraryModule.state.modelDraftFamilyName || productName || '').trim();
        return {
            familyId,
            familyCode,
            familyName,
            productName,
            productGroup,
            colors: {
                plexi: ProductLibraryModule.getModelColorDraftValue('plexi'),
                accessory: ProductLibraryModule.getModelColorDraftValue('accessory'),
                tube: ProductLibraryModule.getModelColorDraftValue('tube')
            },
            masterRefs: (Array.isArray(ProductLibraryModule.state.modelDraftMasterRefs) ? ProductLibraryModule.state.modelDraftMasterRefs : [])
                .map((item) => ({
                    rowId: String(item?.rowId || crypto.randomUUID()),
                    id: String(item?.id || '').trim(),
                    code: String(item?.code || '').trim().toUpperCase(),
                    name: String(item?.name || '').trim(),
                    categoryName: String(item?.categoryName || '').trim(),
                    qty: Math.max(1, Number(item?.qty || 1))
                }))
                .filter((item) => item.code),
            items: (Array.isArray(ProductLibraryModule.state.modelDraftItems) ? ProductLibraryModule.state.modelDraftItems : [])
                .map(item => ({
                    id: String(item?.id || crypto.randomUUID()),
                    source: String(item?.source || 'component'),
                    refId: String(item?.refId || ''),
                    code: String(item?.code || '').trim().toUpperCase(),
                    name: String(item?.name || '').trim(),
                    qty: Math.max(1, Number(item?.qty || 1))
                }))
                .filter(item => item.code),
            montageCard: ProductLibraryModule.state.modelDraftMontageCard ? { ...ProductLibraryModule.state.modelDraftMontageCard } : null,
            productFiles: ProductLibraryModule.getModelDraftFiles('product').map(file => ({ ...file })),
            explodedFiles: ProductLibraryModule.getModelDraftFiles('exploded').map(file => ({ ...file })),
            note: String(ProductLibraryModule.state.modelDraftNote || '').trim()
        };
    },

    saveModelVariant: async (asVariant = false) => {
        ProductLibraryModule.ensureModelDefaults();
        ProductLibraryModule.syncModelDraftQtyFromDom();
        const all = DB.data.data.catalogProductVariants || [];
        const editingId = String(ProductLibraryModule.state.modelEditingId || '').trim();
        const editingRow = editingId ? ProductLibraryModule.getCatalogVariantById(editingId) : null;
        const draft = ProductLibraryModule.collectModelDraftPayload();

        if (!draft.productName) return alert('Urun adi zorunlu.');
        if (!draft.productGroup) return alert('Urun grubu seciniz.');

        const validateColor = (block, label) => {
            if (!block.type && !block.name && !block.code) return block;
            const strict = ProductLibraryModule.resolveStrictLibraryColorSelection({
                colorType: block.type,
                colorCode: block.code,
                colorName: block.name
            });
            if (!strict.found) throw new Error(`${label} kutuphanede bulunamadi. Lutfen listeden seciniz.`);
            return { type: strict.type, name: strict.name, code: strict.code };
        };

        try {
            draft.colors.plexi = validateColor(draft.colors.plexi, 'Pleksi rengi');
            draft.colors.accessory = validateColor(draft.colors.accessory, 'Aksesuar rengi');
            draft.colors.tube = validateColor(draft.colors.tube, 'Boru rengi');
        } catch (err) {
            return alert(err.message || 'Renk secimi gecersiz.');
        }

        if (asVariant && !editingRow) return alert('Farkli kaydet icin once mevcut bir varyanti duzenleyin.');

        let familyId = draft.familyId;
        let familyCode = draft.familyCode;
        let familyName = draft.familyName;
        let variantCode = String(ProductLibraryModule.state.modelDraftVariantCode || '').trim().toUpperCase();

        if (asVariant && editingRow) {
            familyId = editingRow.familyId;
            familyCode = editingRow.familyCode;
            familyName = editingRow.familyName || editingRow.productName;
            variantCode = ProductLibraryModule.generateModelVariantCode(familyCode);
            if (ProductLibraryModule.buildModelVariantSignature(editingRow) === ProductLibraryModule.buildModelVariantSignature({
                ...draft,
                familyId,
                familyCode,
                familyName
            })) {
                return alert('Degisiklik yok. Farkli kaydet icin kartta bir alan degismelidir.');
            }
        } else if (editingRow) {
            familyId = editingRow.familyId;
            familyCode = editingRow.familyCode;
            familyName = editingRow.familyName || editingRow.productName;
            variantCode = editingRow.variantCode;
        } else {
            familyId = familyId || crypto.randomUUID();
            familyCode = familyCode || ProductLibraryModule.generateModelFamilyCode();
            familyName = familyName || draft.productName;
            variantCode = variantCode || `${familyCode}-V01`;
        }

        const normalizedRow = {
            ...draft,
            familyId,
            familyCode,
            familyName,
            variantCode,
            masterRef: (Array.isArray(draft.masterRefs) ? draft.masterRefs[0] : null) || null
        };
        const duplicate = ProductLibraryModule.findDuplicateModelVariant(normalizedRow, asVariant ? '' : editingId);
        if (duplicate) return alert(`Bu varyant zaten mevcut. Varyant ID: ${duplicate.variantCode || '-'}`);

        const now = new Date().toISOString();
        if (editingRow && !asVariant) {
            const idx = all.findIndex(row => String(row?.id || '') === editingId);
            if (idx === -1) {
                ProductLibraryModule.resetModelDraft(true);
                return;
            }
            all[idx] = {
                ...all[idx],
                familyId,
                familyCode,
                familyName,
                variantCode,
                productName: normalizedRow.productName,
                productGroup: normalizedRow.productGroup,
                masterRefs: normalizedRow.masterRefs,
                masterRef: normalizedRow.masterRef,
                items: normalizedRow.items,
                montageCard: normalizedRow.montageCard,
                colors: normalizedRow.colors,
                productFiles: normalizedRow.productFiles,
                explodedFiles: normalizedRow.explodedFiles,
                note: normalizedRow.note,
                updated_at: now
            };
            ProductLibraryModule.state.modelSelectedId = editingId;
        } else {
            const id = crypto.randomUUID();
            all.push({
                id,
                familyId,
                familyCode,
                familyName,
                variantCode,
                productName: normalizedRow.productName,
                productGroup: normalizedRow.productGroup,
                masterRefs: normalizedRow.masterRefs,
                masterRef: normalizedRow.masterRef,
                items: normalizedRow.items,
                montageCard: normalizedRow.montageCard,
                colors: normalizedRow.colors,
                productFiles: normalizedRow.productFiles,
                explodedFiles: normalizedRow.explodedFiles,
                note: normalizedRow.note,
                created_at: now,
                updated_at: now
            });
            ProductLibraryModule.state.modelSelectedId = id;
        }

        DB.data.data.catalogProductVariants = all;
        await DB.save();
        ProductLibraryModule.resetModelDraft(true);
    },

    deleteModelVariant: async (id) => {
        const all = DB.data.data.catalogProductVariants || [];
        const row = all.find(x => String(x?.id || '') === String(id || ''));
        if (!row) return;
        if (!confirm('Bu urun varyanti silinsin mi?')) return;
        DB.data.data.catalogProductVariants = all.filter(x => String(x?.id || '') !== String(id || ''));
        if (String(ProductLibraryModule.state.modelSelectedId || '') === String(id || '')) ProductLibraryModule.state.modelSelectedId = null;
        if (String(ProductLibraryModule.state.modelEditingId || '') === String(id || '')) ProductLibraryModule.resetModelDraft(true);
        if (String(ProductLibraryModule.state.modelViewingId || '') === String(id || '')) ProductLibraryModule.state.modelViewingId = null;
        await DB.save();
        UI.renderCurrentPage();
    },

    renderModelVariantView: (container, row) => {
        const colors = row.colors || {};
        const masterRows = ProductLibraryModule.getModelMasterRefs(row);
        const componentRows = Array.isArray(row.items) ? row.items : [];
        const productFiles = Array.isArray(row.productFiles) ? row.productFiles : [];
        const explodedFiles = Array.isArray(row.explodedFiles) ? row.explodedFiles : [];
        const hasVisuals = productFiles.length > 0 || explodedFiles.length > 0;
        container.innerHTML = `
            <div style="max-width:1680px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.8rem; margin-bottom:0.85rem;">
                    <div>
                        <h2 class="page-title" style="margin:0;">${ProductLibraryModule.escapeHtml(row.productName || '-')}</h2>
                        <div style="color:#64748b; margin-top:0.22rem;">${ProductLibraryModule.escapeHtml(row.productGroup || '-')} / ${ProductLibraryModule.escapeHtml(row.variantCode || '-')}</div>
                    </div>
                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                        <button class="btn-sm" onclick="ProductLibraryModule.closeModelVariantView()">listeye don</button>
                        <button class="btn-sm" onclick="ProductLibraryModule.startEditModelVariant('${row.id}')">duzenle</button>
                    </div>
                </div>

                ${hasVisuals ? `
                    <div style="display:grid; gap:1rem; margin-bottom:1rem;">
                        ${productFiles.length > 0 ? `
                            <div class="card-table" style="padding:1rem;">
                                <div style="font-weight:700; margin-bottom:0.55rem;">Urun Fotografi / Teknik Resim</div>
                                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:0.65rem;">
                                    ${ProductLibraryModule.renderModelStoredFileCards(row.id, 'product', productFiles)}
                                </div>
                            </div>
                        ` : ''}
                        ${explodedFiles.length > 0 ? `
                            <div class="card-table" style="padding:1rem;">
                                <div style="font-weight:700; margin-bottom:0.55rem;">Patlatilmis Resim</div>
                                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:0.65rem;">
                                    ${ProductLibraryModule.renderModelStoredFileCards(row.id, 'exploded', explodedFiles)}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                <div class="card-table" style="padding:1rem; margin-bottom:1rem;">
                    <div style="display:grid; grid-template-columns:repeat(4, minmax(180px, 1fr)); gap:0.8rem;">
                        <div><div style="font-size:0.72rem; color:#64748b;">urun grubu</div><div style="font-weight:700;">${ProductLibraryModule.escapeHtml(row.productGroup || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">aile kodu</div><div style="font-weight:700; font-family:monospace; color:#1d4ed8;">${ProductLibraryModule.escapeHtml(row.familyCode || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">varyant kodu</div><div style="font-weight:700; font-family:monospace; color:#1d4ed8;">${ProductLibraryModule.escapeHtml(row.variantCode || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">montaj islem karti</div><div style="font-weight:700;">${ProductLibraryModule.escapeHtml(row.montageCard?.cardCode || '-')}</div></div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(3, minmax(180px, 1fr)); gap:0.8rem; margin-top:1rem;">
                        <div><div style="font-size:0.72rem; color:#64748b;">pleksi rengi</div><div style="font-weight:700;">${ProductLibraryModule.escapeHtml(colors.plexi?.name || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">aksesuar rengi</div><div style="font-weight:700;">${ProductLibraryModule.escapeHtml(colors.accessory?.name || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">boru rengi</div><div style="font-weight:700;">${ProductLibraryModule.escapeHtml(colors.tube?.name || '-')}</div></div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:minmax(0,1fr); gap:1rem; align-items:start;">
                    <div class="card-table" style="padding:1rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; margin-bottom:0.65rem;">
                            <strong>Secilen Kalemler</strong>
                            <span style="font-size:0.8rem; color:#64748b;">Toplam: ${componentRows.length + masterRows.length}</span>
                        </div>
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.73rem; text-transform:uppercase;">
                                    <th style="padding:0.45rem; text-align:left;">Sira</th>
                                    <th style="padding:0.45rem; text-align:left;">Kaynak</th>
                                    <th style="padding:0.45rem; text-align:left;">Urun</th>
                                    <th style="padding:0.45rem; text-align:left;">Renk</th>
                                    <th style="padding:0.45rem; text-align:left;">ID kod</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${masterRows.map((item, idx) => `
                                    <tr style="border-bottom:1px solid #f1f5f9;">
                                        <td style="padding:0.45rem;">${idx + 1}</td>
                                        <td style="padding:0.45rem;">Master</td>
                                        <td style="padding:0.45rem; font-weight:700;">${ProductLibraryModule.escapeHtml(item?.name || '-')}</td>
                                        <td style="padding:0.45rem;">${ProductLibraryModule.escapeHtml(ProductLibraryModule.getModelMasterColorLabel(item))}</td>
                                        <td style="padding:0.45rem; font-family:monospace;">${ProductLibraryModule.escapeHtml(item?.code || '-')}</td>
                                    </tr>
                                `).join('')}
                                ${componentRows.length === 0 && masterRows.length === 0 ? `
                                    <tr><td colspan="5" style="padding:0.9rem; color:#94a3b8; text-align:center;">Parca/bilesen secilmedi.</td></tr>
                                ` : componentRows.map((item, idx) => `
                                    <tr style="border-bottom:1px solid #f1f5f9;">
                                        <td style="padding:0.45rem;">${idx + masterRows.length + 1}</td>
                                        <td style="padding:0.45rem;">Parca</td>
                                        <td style="padding:0.45rem; font-weight:700;">${ProductLibraryModule.escapeHtml(item.name || '-')}</td>
                                        <td style="padding:0.45rem;">${ProductLibraryModule.escapeHtml(ProductLibraryModule.getModelComponentColorLabel(item))}</td>
                                        <td style="padding:0.45rem; font-family:monospace;">${ProductLibraryModule.escapeHtml(item.code || '-')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card-table" style="padding:1rem; margin-top:1rem;">
                    <div style="font-size:0.74rem; color:#64748b; margin-bottom:0.35rem;">not</div>
                    <div style="white-space:pre-wrap; color:#334155;">${ProductLibraryModule.escapeHtml(row.note || '-')}</div>
                </div>
            </div>
        `;
    },

    renderModelsPage: (container) => {
        const state = ProductLibraryModule.state;
        const isPlanningModelPicker = String(state.planningPickerSource || '') === 'model';
        const isStockInventoryPicker = isPlanningModelPicker
            && typeof StockModule !== 'undefined'
            && !!StockModule?.state?.inventoryRegistrationPickerPending;
        if (state.modelViewingId && !isPlanningModelPicker) state.modelViewingId = null;

        const filters = state.modelFilters || { group: '', name: '', code: '', plexiType: '', plexi: '', accessoryType: '', accessory: '', tubeType: '', tube: '' };
        const groupOptions = ProductLibraryModule.getModelGroupOptions();
        const rows = ProductLibraryModule.getCatalogProductVariants().filter((row) => {
            const qGroup = String(filters.group || '').trim();
            const qName = String(filters.name || '').trim().toLocaleLowerCase('tr-TR');
            const qCode = String(filters.code || '').trim().toLocaleLowerCase('tr-TR');
            const qPlexiType = ProductLibraryModule.normalizeColorType(filters.plexiType || '');
            const qPlexi = String(filters.plexi || '').trim().toLocaleLowerCase('tr-TR');
            const qAccessoryType = ProductLibraryModule.normalizeColorType(filters.accessoryType || '');
            const qAccessory = String(filters.accessory || '').trim().toLocaleLowerCase('tr-TR');
            const qTubeType = ProductLibraryModule.normalizeColorType(filters.tubeType || '');
            const qTube = String(filters.tube || '').trim().toLocaleLowerCase('tr-TR');
            if (qGroup && row.productGroup !== qGroup) return false;
            if (qName && !`${row.productName || ''} ${row.familyName || ''}`.toLocaleLowerCase('tr-TR').includes(qName)) return false;
            if (qCode && !`${row.familyCode || ''} ${row.variantCode || ''}`.toLocaleLowerCase('tr-TR').includes(qCode)) return false;
            if (qPlexiType && ProductLibraryModule.normalizeColorType(row.colors?.plexi?.type || '') !== qPlexiType) return false;
            if (qPlexi && !String(row.colors?.plexi?.name || '').toLocaleLowerCase('tr-TR').includes(qPlexi)) return false;
            if (qAccessoryType && ProductLibraryModule.normalizeColorType(row.colors?.accessory?.type || '') !== qAccessoryType) return false;
            if (qAccessory && !String(row.colors?.accessory?.name || '').toLocaleLowerCase('tr-TR').includes(qAccessory)) return false;
            if (qTubeType && ProductLibraryModule.normalizeColorType(row.colors?.tube?.type || '') !== qTubeType) return false;
            if (qTube && !String(row.colors?.tube?.name || '').toLocaleLowerCase('tr-TR').includes(qTube)) return false;
            return true;
        });

        const grouped = new Map();
        rows.forEach((row) => {
            const groupKey = String(row.productGroup || 'Diger');
            if (!grouped.has(groupKey)) grouped.set(groupKey, new Map());
            const families = grouped.get(groupKey);
            if (!families.has(row.familyId)) {
                families.set(row.familyId, { familyId: row.familyId, familyCode: row.familyCode, familyName: row.familyName || row.productName, rows: [] });
            }
            families.get(row.familyId).rows.push(row);
        });

        const hasFilter = Object.values(filters).some(Boolean);
        const listHtml = rows.length === 0
            ? '<div style="text-align:center; color:#94a3b8; padding:2rem;">Kayitli urun modeli yok.</div>'
            : Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0], 'tr')).map(([groupKey, families]) => {
                const groupOpen = hasFilter ? true : !!state.modelGroupExpanded[groupKey];
                return `
                    <div style="border:1px solid #e2e8f0; border-radius:0.9rem; overflow:hidden; margin-bottom:0.75rem;">
                        <button type="button" onclick='ProductLibraryModule.toggleModelGroupSection(${JSON.stringify(groupKey)})' style="width:100%; border:none; background:${groupOpen ? '#eef2ff' : '#f8fafc'}; padding:0.8rem 0.95rem; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                            <span style="display:flex; align-items:center; gap:0.55rem;">
                                <span style="display:inline-block; width:14px; text-align:center; color:#64748b; font-weight:900; transform:${groupOpen ? 'rotate(90deg)' : 'rotate(0deg)'}; transition:transform 160ms ease;">></span>
                                <span style="font-weight:800; color:#334155;">${ProductLibraryModule.escapeHtml(groupKey)}</span>
                            </span>
                            <span style="font-size:0.84rem; color:#64748b;">${families.size} model</span>
                        </button>
                        ${groupOpen ? `<div style="padding:0.75rem;">${Array.from(families.values()).sort((a, b) => String(a.familyName || '').localeCompare(String(b.familyName || ''), 'tr')).map((family) => {
                            const familyKey = `${groupKey}::${family.familyId}`;
                            const familyOpen = hasFilter ? true : !!state.modelFamilyExpanded[familyKey];
                            return `
                                <div style="border:1px solid #e2e8f0; border-radius:0.8rem; overflow:hidden; margin-bottom:0.65rem;">
                                    <button type="button" onclick='ProductLibraryModule.toggleModelFamilySection(${JSON.stringify(familyKey)})' style="width:100%; border:none; background:${familyOpen ? '#fff7ed' : 'white'}; padding:0.72rem 0.85rem; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                                        <div style="display:flex; align-items:center; gap:0.55rem; text-align:left;">
                                            <span style="display:inline-block; width:14px; text-align:center; color:#64748b; font-weight:900; transform:${familyOpen ? 'rotate(90deg)' : 'rotate(0deg)'}; transition:transform 160ms ease;">></span>
                                            <div>
                                                <div style="font-weight:800; color:#334155;">${ProductLibraryModule.escapeHtml(family.familyName || '-')}</div>
                                                <div style="font-size:0.8rem; color:#64748b; font-family:monospace;">${ProductLibraryModule.escapeHtml(family.familyCode || '-')}</div>
                                            </div>
                                        </div>
                                        <span style="font-size:0.84rem; color:#64748b;">${family.rows.length} varyant</span>
                                    </button>
                                    ${familyOpen ? `<div style="overflow:auto;"><table style="width:100%; border-collapse:collapse;"><thead><tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.73rem; text-transform:uppercase;"><th style="padding:0.5rem; text-align:left;">Urun</th><th style="padding:0.5rem; text-align:left;">Varyant ID</th><th style="padding:0.5rem; text-align:left;">Pleksi</th><th style="padding:0.5rem; text-align:left;">Aksesuar</th><th style="padding:0.5rem; text-align:left;">Boru</th><th style="padding:0.5rem; text-align:left;">Montaj</th><th style="padding:0.5rem; text-align:left;">Islem</th></tr></thead><tbody>${family.rows.sort((a, b) => String(a.variantCode || '').localeCompare(String(b.variantCode || ''), 'tr')).map(row => `
                                        <tr style="border-bottom:1px solid #f1f5f9; ${String(state.modelSelectedId || '') === String(row.id || '') ? 'background:#fff7ed;' : ''}">
                                            <td style="padding:0.5rem; font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(row.productName || '-')}</td>
                                            <td style="padding:0.5rem; font-family:monospace;">${ProductLibraryModule.escapeHtml(row.variantCode || '-')}</td>
                                            <td style="padding:0.5rem;">${ProductLibraryModule.escapeHtml(row.colors?.plexi?.name || '-')}</td>
                                            <td style="padding:0.5rem;">${ProductLibraryModule.escapeHtml(row.colors?.accessory?.name || '-')}</td>
                                            <td style="padding:0.5rem;">${ProductLibraryModule.escapeHtml(row.colors?.tube?.name || '-')}</td>
                                            <td style="padding:0.5rem; font-family:monospace;">${ProductLibraryModule.escapeHtml(row.montageCard?.cardCode || '-')}</td>
                                            <td style="padding:0.5rem;"><div style="display:flex; gap:0.35rem; flex-wrap:wrap;"><button class="btn-sm" onclick="ProductLibraryModule.openModelVariantView('${row.id}')">goruntule</button><button class="btn-sm" onclick="ProductLibraryModule.startEditModelVariant('${row.id}')">duzenle</button>${isPlanningModelPicker ? `<button class="btn-sm" onclick="ProductLibraryModule.selectPlanningModel('${row.id}')" style="border-color:#bfdbfe; color:#1d4ed8; background:#eff6ff;">ekle</button>` : ''}</div></td>
                                        </tr>`).join('')}</tbody></table></div>` : ''}
                                </div>
                            `;
                        }).join('')}</div>` : ''}
                    </div>
                `;
            }).join('');

        const masterRows = Array.isArray(state.modelDraftMasterRefs) ? state.modelDraftMasterRefs : [];
        const componentItems = Array.isArray(state.modelDraftItems) ? state.modelDraftItems : [];
        const productFiles = ProductLibraryModule.getModelDraftFiles('product');
        const explodedFiles = ProductLibraryModule.getModelDraftFiles('exploded');
        const montageCard = state.modelDraftMontageCard;
        const renderModelMasterDraftRows = () => {
            if (masterRows.length === 0) {
                return '<div style="padding:0.8rem; border:1px dashed #cbd5e1; border-radius:0.7rem; color:#94a3b8;">Henuz master urun baglanmadi.</div>';
            }
            return masterRows.map((row, idx) => `
                <div style="display:grid; grid-template-columns:52px minmax(0,1fr) 130px 90px 82px; gap:0.45rem; align-items:center;">
                    <div style="font-weight:800; color:#475569;">${idx + 1}</div>
                    <div style="min-width:0; border:1px solid #cbd5e1; border-radius:0.55rem; background:#f8fafc; padding:0.58rem 0.7rem;">
                        <div style="font-family:monospace; color:#0f172a; font-weight:800;">${ProductLibraryModule.escapeHtml(row?.code || 'master secilmedi')}</div>
                        <div style="font-size:0.8rem; color:#64748b; margin-top:0.12rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${ProductLibraryModule.escapeHtml(row?.name || 'Master urun secmek icin sec butonunu kullanin.')}</div>
                    </div>
                    <button class="btn-sm" onclick="${row?.id ? `ProductLibraryModule.previewModelDraftLinkedRecord('master', '${ProductLibraryModule.escapeHtml(row.id || '')}')` : `ProductLibraryModule.openModelMasterPicker('${ProductLibraryModule.escapeHtml(row.rowId || '')}')`}" style="height:40px;">${row?.id ? 'goruntule' : 'sec'}</button>
                    <input type="number" min="1" step="1" value="${Number(row?.qty || 1)}" data-model-master-qty-rowid="${ProductLibraryModule.escapeHtml(row.rowId || '')}" oninput="ProductLibraryModule.setModelMasterQty('${ProductLibraryModule.escapeHtml(row.rowId || '')}', this.value)" onchange="ProductLibraryModule.setModelMasterQty('${ProductLibraryModule.escapeHtml(row.rowId || '')}', this.value)" style="width:80px; height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.4rem; text-align:center;">
                    <button class="btn-sm" onclick="ProductLibraryModule.removeModelMasterDraftRow('${ProductLibraryModule.escapeHtml(row.rowId || '')}')" style="height:40px;">sil</button>
                </div>
            `).join('');
        };
        const renderModelComponentDraftRows = () => {
            if (componentItems.length === 0) {
                return '<div style="padding:0.8rem; border:1px dashed #cbd5e1; border-radius:0.7rem; color:#94a3b8;">Henuz parca / bilesen baglanmadi.</div>';
            }
            return componentItems.map((item, idx) => `
                <div style="display:grid; grid-template-columns:52px minmax(0,1fr) 130px 90px 82px; gap:0.45rem; align-items:center;">
                    <div style="font-weight:800; color:#475569;">${idx + 1}</div>
                    <div style="min-width:0; border:1px solid #cbd5e1; border-radius:0.55rem; background:#f8fafc; padding:0.58rem 0.7rem;">
                        <div style="font-family:monospace; color:#0f172a; font-weight:800;">${ProductLibraryModule.escapeHtml(item?.code || 'parca secilmedi')}</div>
                        <div style="font-size:0.8rem; color:#64748b; margin-top:0.12rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${ProductLibraryModule.escapeHtml(item?.name || 'Parca secmek icin sec butonunu kullanin.')}</div>
                    </div>
                    <button class="btn-sm" onclick="${item?.refId ? `ProductLibraryModule.previewModelDraftLinkedRecord('component', '${ProductLibraryModule.escapeHtml(item.refId || '')}')` : `ProductLibraryModule.openModelComponentPicker('${ProductLibraryModule.escapeHtml(item.id || '')}')`}" style="height:40px;">${item?.refId ? 'goruntule' : 'sec'}</button>
                    <input type="number" min="1" step="1" value="${Number(item?.qty || 1)}" data-model-component-qty-id="${ProductLibraryModule.escapeHtml(item.id || '')}" oninput="ProductLibraryModule.setModelComponentQty('${ProductLibraryModule.escapeHtml(item.id || '')}', this.value)" onchange="ProductLibraryModule.setModelComponentQty('${ProductLibraryModule.escapeHtml(item.id || '')}', this.value)" style="width:80px; height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.4rem; text-align:center;">
                    <button class="btn-sm" onclick="ProductLibraryModule.removeModelDraftItem('${ProductLibraryModule.escapeHtml(item.id || '')}')" style="height:40px;">sil</button>
                </div>
            `).join('');
        };

        container.innerHTML = `
            <div style="max-width:1920px; margin:0 auto; font-family:'Inter',sans-serif;">
                ${isPlanningModelPicker ? `
                    <div style="background:#eff6ff; border:2px solid #1d4ed8; color:#1e3a8a; border-radius:0.9rem; padding:0.7rem 0.85rem; margin-bottom:0.8rem; display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap;">
                        <div style="font-weight:700;">${isStockInventoryPicker ? 'Envantere elle kayit icin urun modeli secimi modundasin. "ekle" ile secilen varyant stok giris formuna baglanir.' : 'Planlama icin urun modeli secimi modundasin. "ekle" ile secilen varyant stok icin uretim ekranina baglanir.'}</div>
                        <button class="btn-sm" onclick="ProductLibraryModule.cancelPlanningPicker()">${isStockInventoryPicker ? 'envantere don' : 'planlamaya don'}</button>
                    </div>
                ` : ''}
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.8rem; flex-wrap:wrap; margin-bottom:1rem;">
                    <div>
                        <h2 class="page-title" style="margin:0;">Urun Modelleri</h2>
                        <div style="color:#64748b; margin-top:0.22rem;">Satisa sunulan katalog urunlerini ve varyantlarini buradan yonetin</div>
                    </div>
                    <div style="display:flex; gap:0.55rem; flex-wrap:wrap;">
                        <button class="btn-sm" onclick="ProductLibraryModule.goWorkspaceMenu()">geri</button>
                        <button class="btn-primary" onclick="${isPlanningModelPicker ? 'ProductLibraryModule.cancelPlanningPicker()' : 'ProductLibraryModule.openModelForm()'}">${isPlanningModelPicker ? 'vazgec' : 'urun ekle +'}</button>
                    </div>
                </div>

                <div class="card-table" style="padding:1rem; margin-bottom:1rem;">
                    <div style="display:grid; grid-template-columns:220px minmax(280px,1fr) 210px 220px 220px 220px; gap:0.65rem; align-items:end;">
                        <select onchange="ProductLibraryModule.setModelFilter('group', this.value)" style="height:42px; border:1px solid #cbd5e1; border-radius:0.65rem; padding:0 0.65rem; font-weight:700;"><option value="">urun grubu sec</option>${groupOptions.map(opt => `<option value="${ProductLibraryModule.escapeHtml(opt)}" ${String(filters.group || '') === String(opt) ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(opt)}</option>`).join('')}</select>
                        <input id="model_filter_name" value="${ProductLibraryModule.escapeHtml(filters.name || '')}" oninput="ProductLibraryModule.setModelFilter('name', this.value, 'model_filter_name')" placeholder="urun adiyla ara" style="height:42px; border:1px solid #cbd5e1; border-radius:0.65rem; padding:0 0.7rem; font-weight:600;">
                        <input id="model_filter_code" value="${ProductLibraryModule.escapeHtml(filters.code || '')}" oninput="ProductLibraryModule.setModelFilter('code', this.value, 'model_filter_code')" placeholder="aile/varyant ID ara" style="height:42px; border:1px solid #cbd5e1; border-radius:0.65rem; padding:0 0.7rem; font-weight:600;">
                        ${ProductLibraryModule.renderModelListColorFilter('plexi')}
                        ${ProductLibraryModule.renderModelListColorFilter('accessory')}
                        ${ProductLibraryModule.renderModelListColorFilter('tube')}
                    </div>
                </div>

                <div class="card-table" style="padding:0.9rem; margin-bottom:1rem;">${listHtml}</div>

                ${(state.modelFormOpen || !!state.modelEditingId) ? `
                    <div id="model_form_anchor" class="card-table" style="padding:1rem; border:2px solid #cbd5e1;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap; margin-bottom:0.9rem;">
                            <div><div style="font-weight:800; color:#334155; font-size:1.15rem;">${state.modelEditingId ? 'Urun varyanti duzenle' : 'Yeni urun karti olustur'}</div><div style="font-size:0.82rem; color:#64748b; margin-top:0.25rem;">Bu kart satisa sunulan katalog urununu ve varyant baglarini tanimlar.</div></div>
                            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">${state.modelEditingId ? `<button class="btn-sm" onclick="ProductLibraryModule.deleteModelVariant('${state.modelEditingId}')">Sil</button>` : ''}<button class="btn-primary" onclick="ProductLibraryModule.saveModelVariant(true)" ${state.modelEditingId ? '' : 'disabled'} style="${state.modelEditingId ? 'background:#eff6ff; color:#1d4ed8; border:1px solid #93c5fd;' : 'opacity:0.5; cursor:not-allowed;'}">Farkli Kaydet</button><button class="btn-sm" onclick="ProductLibraryModule.resetModelDraft(true)">Vazgec</button><button class="btn-primary" onclick="ProductLibraryModule.saveModelVariant(false)">Kaydet</button></div>
                        </div>
                        <div style="display:grid; grid-template-columns:minmax(0,1.55fr) minmax(360px,0.95fr); gap:1rem; align-items:start;">
                            <div style="display:grid; gap:0.9rem;">
                                <div style="display:grid; grid-template-columns:1.15fr 1.1fr 0.85fr; gap:0.7rem; align-items:end;">
                                    <div><div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; margin-bottom:0.2rem;"><label style="display:block; font-size:0.74rem; color:#64748b;">urun grubu</label><button type="button" onclick="ProductLibraryModule.openModelGroupDictionary()" style="border:none; background:none; color:#2563eb; font-size:0.78rem; font-weight:700; cursor:pointer;">+yonet (ekle-sil)</button></div><select onchange="ProductLibraryModule.state.modelDraftGroup=this.value" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.65rem; padding:0 0.65rem; font-weight:700;"><option value="">urun grubu sec</option>${groupOptions.map(opt => `<option value="${ProductLibraryModule.escapeHtml(opt)}" ${String(state.modelDraftGroup || '') === String(opt) ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(opt)}</option>`).join('')}</select></div>
                                    <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">urun adi (katalogda gorunen)</label><input value="${ProductLibraryModule.escapeHtml(state.modelDraftName || '')}" oninput="ProductLibraryModule.state.modelDraftName=this.value; if(!ProductLibraryModule.state.modelEditingId) ProductLibraryModule.state.modelDraftFamilyName=this.value;" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.65rem; padding:0 0.65rem; font-weight:700;"></div>
                                    <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">ID kod</label><input disabled value="${ProductLibraryModule.escapeHtml(state.modelDraftVariantCode || '-')}" style="width:100%; height:40px; border:1px solid #e2e8f0; border-radius:0.65rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace; font-weight:700;"></div>
                                </div>
                                <div style="display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:0.7rem;">${ProductLibraryModule.renderModelColorField('plexi')}${ProductLibraryModule.renderModelColorField('accessory')}${ProductLibraryModule.renderModelColorField('tube')}</div>
                                <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.75rem;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; margin-bottom:0.55rem;">
                                        <div>
                                            <strong style="font-size:0.92rem;">Master Urun Kutuphanesi</strong>
                                            <div style="font-size:0.78rem; color:#64748b; margin-top:0.18rem;">Bu varyanta baglanacak master urunleri satir bazinda secin.</div>
                                        </div>
                                        <button class="btn-primary" onclick="ProductLibraryModule.addModelMasterDraftRow(true)" style="height:40px;">master urun ekle +</button>
                                    </div>
                                    <div style="display:flex; flex-direction:column; gap:0.45rem;">
                                        ${renderModelMasterDraftRows()}
                                    </div>
                                </div>
                                <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.75rem;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; margin-bottom:0.55rem;">
                                        <div>
                                            <strong style="font-size:0.92rem;">Parca ve Bilesen Baglantilari</strong>
                                            <div style="font-size:0.78rem; color:#64748b; margin-top:0.18rem;">Patlatilmis resimdeki parca numara sirasina gore satir ekleyin.</div>
                                        </div>
                                        <button class="btn-primary" onclick="ProductLibraryModule.addModelComponentDraftRow(true)" style="height:40px;">parca bilesen ekle +</button>
                                    </div>
                                    <div style="display:flex; flex-direction:column; gap:0.45rem;">
                                        ${renderModelComponentDraftRows()}
                                    </div>
                                </div>
                            </div>
                            <div style="display:grid; gap:0.9rem;">
                                <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.75rem;"><div style="font-weight:700; margin-bottom:0.45rem;">Montaj Islem Karti</div><div style="display:grid; grid-template-columns:1fr auto auto; gap:0.45rem; align-items:center;"><input readonly value="${ProductLibraryModule.escapeHtml(montageCard?.cardCode || '')}" placeholder="montaj karti secilmedi" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-family:monospace; background:#f8fafc;"><button class="btn-sm" onclick="ProductLibraryModule.openModelMontagePicker()" style="height:40px; min-width:110px; ${montageCard ? 'background:#0f172a; color:white; border-color:#0f172a;' : ''}">goruntule</button><button class="btn-sm" onclick="ProductLibraryModule.clearModelMontageCard()" style="height:40px; min-width:80px;">sil</button></div>${montageCard ? `<div style="font-size:0.8rem; color:#64748b; margin-top:0.35rem;">${ProductLibraryModule.escapeHtml(montageCard.productCode || '-')} / ${ProductLibraryModule.escapeHtml(montageCard.productName || '-')}</div>` : ''}</div>
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.9rem;">
                                    <div style="border:1px solid #0f172a; border-radius:1rem; padding:0.75rem; min-height:320px;"><div style="font-weight:700; margin-bottom:0.45rem;">urun fotografi/ teknik resim</div><div style="font-size:0.78rem; color:#64748b; margin-bottom:0.35rem;">resim/pdf dosya + ekle</div><input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onchange="ProductLibraryModule.handleModelFiles('product', this)" style="width:100%;"><div style="margin-top:0.55rem; display:flex; flex-direction:column; gap:0.35rem; max-height:210px; overflow:auto;">${productFiles.length === 0 ? '<div style="font-size:0.82rem; color:#94a3b8;">Dosya secilmedi.</div>' : productFiles.map((file, idx) => `<div style="border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.35rem 0.45rem;"><div style="font-size:0.8rem; color:#334155; margin-bottom:0.3rem;">${ProductLibraryModule.escapeHtml(file?.name || 'dosya')}</div><div style="display:flex; gap:0.35rem;"><button class="btn-sm" onclick="ProductLibraryModule.previewModelDraftFile('product', ${idx})">goruntule</button><button class="btn-sm" onclick="ProductLibraryModule.removeModelDraftFile('product', ${idx})">kaldir</button></div></div>`).join('')}</div></div>
                                    <div style="border:1px solid #0f172a; border-radius:1rem; padding:0.75rem; min-height:320px;"><div style="font-weight:700; margin-bottom:0.45rem;">urun patlatilmis resim</div><div style="font-size:0.78rem; color:#64748b; margin-bottom:0.35rem;">resim/pdf dosya + ekle</div><input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onchange="ProductLibraryModule.handleModelFiles('exploded', this)" style="width:100%;"><div style="margin-top:0.55rem; display:flex; flex-direction:column; gap:0.35rem; max-height:210px; overflow:auto;">${explodedFiles.length === 0 ? '<div style="font-size:0.82rem; color:#94a3b8;">Dosya secilmedi.</div>' : explodedFiles.map((file, idx) => `<div style="border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.35rem 0.45rem;"><div style="font-size:0.8rem; color:#334155; margin-bottom:0.3rem;">${ProductLibraryModule.escapeHtml(file?.name || 'dosya')}</div><div style="display:flex; gap:0.35rem;"><button class="btn-sm" onclick="ProductLibraryModule.previewModelDraftFile('exploded', ${idx})">goruntule</button><button class="btn-sm" onclick="ProductLibraryModule.removeModelDraftFile('exploded', ${idx})">kaldir</button></div></div>`).join('')}</div></div>
                                </div>
                                <div><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.25rem;">not</label><textarea rows="6" oninput="ProductLibraryModule.state.modelDraftNote=this.value" style="width:100%; border:1px solid #0f172a; border-radius:1rem; padding:0.75rem; resize:vertical;">${ProductLibraryModule.escapeHtml(state.modelDraftNote || '')}</textarea></div>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    ensureMasterDefaults: () => {
        if (!DB.data.data.productCategories || DB.data.data.productCategories.length === 0) {
            DB.data.data.productCategories = [
                { id: 'cat1', name: 'AlÃƒÂ¼minyum profil', icon: 'ÄŸÅ¸Ââ€”Ã¯Â¸Â', prefix: 'ALM' },
                { id: 'cat3', name: 'HÃ„Â±rdavat & Vida', icon: 'ÄŸÅ¸â€Â©', prefix: 'VID' },
                { id: 'cat_ext', name: 'EkstrÃƒÂ¼der pleksi', icon: 'ÄŸÅ¸ÂÂ­', prefix: 'AKS' },
                { id: 'cat_box', name: 'Koli', icon: '[ ]', prefix: 'KLI' },
                { id: 'cat_sarf', name: 'Sarf & Genel Malzeme', icon: 'SG', prefix: 'SRF' },
                { id: 'cat_sales', name: 'Satis Urun Kutuphanesi', icon: 'SK', prefix: 'STS' }
            ];
        }

        const defaults = [
            { id: 'cat1', name: 'AlÃƒÂ¼minyum profil', icon: 'ÄŸÅ¸Ââ€”Ã¯Â¸Â', prefix: 'ALM' },
            { id: 'cat3', name: 'HÃ„Â±rdavat & Vida', icon: 'ÄŸÅ¸â€Â©', prefix: 'VID' },
            { id: 'cat_ext', name: 'EkstrÃƒÂ¼der pleksi', icon: 'ÄŸÅ¸ÂÂ­', prefix: 'AKS' },
            { id: 'cat_box', name: 'Koli', icon: '[ ]', prefix: 'KLI' },
            { id: 'cat_sarf', name: 'Sarf & Genel Malzeme', icon: 'SG', prefix: 'SRF' },
            { id: 'cat_sales', name: 'Satis Urun Kutuphanesi', icon: 'SK', prefix: 'STS' }
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
                    icon: c.icon || 'ÄŸÅ¸â€œÂ¦',
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
        ProductLibraryModule.state.masterDraftColorType = ProductLibraryModule.normalizeColorType(ProductLibraryModule.state.masterDraftColorType || '');
        if (!ProductLibraryModule.state.masterDraftColorType) {
            ProductLibraryModule.state.masterDraftColorCode = '';
        }
        ProductLibraryModule.syncSalesCatalogProductsToMaster({ markDirty: false });
    },

    getSalesMirrorCategoryMeta: () => ({
        id: 'cat_sales',
        name: 'Satis Urun Kutuphanesi'
    }),

    isSalesCatalogMirrorProduct: (raw) => {
        if (!raw || typeof raw !== 'object') return false;
        const source = String(raw?.syncSource || raw?.sourceModule || '').trim().toLowerCase();
        if (source === 'sales-catalog') return true;
        if (!String(raw?.sourceCatalogId || '').trim()) return false;
        const direction = String(raw?.syncDirection || '').trim().toLowerCase();
        return direction === 'sales_to_master';
    },

    resolveMasterMirrorColorFromSalesRow: (salesRow = {}) => {
        const colors = (salesRow?.colors && typeof salesRow.colors === 'object') ? salesRow.colors : {};
        const sourceCandidates = [colors.plexi, colors.accessory, colors.tube].filter(Boolean);
        for (const candidate of sourceCandidates) {
            const type = ProductLibraryModule.normalizeColorType(candidate?.category || '');
            const name = String(candidate?.color || '').trim();
            if (!type || !name) continue;
            const libraryMatch = ProductLibraryModule.getColorLibraryItemsByType(type)
                .find((row) => String(row?.name || '').trim().toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR'));
            return {
                type,
                name: String(libraryMatch?.name || name).trim(),
                code: String(libraryMatch?.code || '').trim().toUpperCase()
            };
        }
        return { type: '', name: '', code: '' };
    },

    buildMasterMirrorFromSalesCatalog: (salesRow = {}, existingRaw = null) => {
        const sourceId = String(salesRow?.id || '').trim();
        if (!sourceId) return null;

        const mirrorCategory = ProductLibraryModule.getSalesMirrorCategoryMeta();
        const previous = (existingRaw && typeof existingRaw === 'object') ? existingRaw : {};
        const exclude = previous?.id ? { collection: 'products', id: String(previous.id), field: 'code' } : null;
        let mirrorCode = String(previous?.code || '').trim().toUpperCase();
        if (!mirrorCode || ProductLibraryModule.isGlobalCodeTaken(mirrorCode, exclude)) {
            mirrorCode = ProductLibraryModule.generateMasterCode(mirrorCategory.id);
        }

        const color = ProductLibraryModule.resolveMasterMirrorColorFromSalesRow(salesRow);
        const sourcePath = (typeof SalesModule !== 'undefined' && SalesModule && typeof SalesModule.getCatalogCategoryPathText === 'function')
            ? String(SalesModule.getCatalogCategoryPathText(salesRow?.categoryId || '') || '').trim()
            : String(salesRow?.categoryId || '').trim();

        const selectedDiameter = String(salesRow?.selectedDiameter || '').trim();
        const thickness = String(salesRow?.pipe?.thickness || '').trim();
        const pipeLength = String(salesRow?.pipe?.lengthMm || '').trim();
        const lowerTubeLength = String(salesRow?.lowerTubeLength || '').trim();
        const bubble = String(salesRow?.bubble || '').trim();

        const featureChunks = [];
        if (selectedDiameter) featureChunks.push(`cap:${selectedDiameter}`);
        if (thickness) featureChunks.push(`kalinlik:${thickness}`);
        if (pipeLength) featureChunks.push(`boy:${pipeLength}`);
        if (lowerTubeLength) featureChunks.push(`alt_boru:${lowerTubeLength}`);
        if (bubble) featureChunks.push(`kabarcik:${bubble}`);

        const sourceIdCode = String(salesRow?.idCode || '').trim().toUpperCase();
        const sourceNoteChunks = [
            'Kaynak: Satis Urun Kutuphanesi',
            sourcePath ? `Kategori: ${sourcePath}` : '',
            sourceIdCode ? `Satis ID: ${sourceIdCode}` : '',
            featureChunks.length > 0 ? `Ozellik: ${featureChunks.join(', ')}` : ''
        ].filter(Boolean);

        const sourceNote = sourceNoteChunks.join(' | ');
        const userNote = String(salesRow?.note || '').trim();
        const mergedNote = [sourceNote, userNote].filter(Boolean).join(' | ');

        const technicalAsset = String(salesRow?.images?.technical || '').trim();
        const technicalIsPdf = technicalAsset.startsWith('data:application/pdf');
        const productAsset = String(salesRow?.images?.product || salesRow?.images?.application || '').trim();
        const fallbackImage = String(previous?.image || previous?.imageUrl || '').trim();
        const fallbackPdf = String(previous?.pdf || previous?.pdfUrl || previous?.pdfDataUrl || previous?.drawingPdf || '').trim();
        const imageData = productAsset || (!technicalIsPdf ? technicalAsset : '') || fallbackImage;
        const pdfData = technicalIsPdf ? technicalAsset : fallbackPdf;

        const sourceCreatedAt = String(salesRow?.created_at || '').trim();
        const sourceUpdatedAt = String(salesRow?.updated_at || sourceCreatedAt).trim();
        const createdAt = String(previous?.created_at || sourceCreatedAt || new Date().toISOString());
        const updatedAt = String(sourceUpdatedAt || previous?.updated_at || createdAt);

        return {
            ...previous,
            id: String(previous?.id || '').trim() || crypto.randomUUID(),
            categoryId: mirrorCategory.id,
            category: mirrorCategory.name,
            type: 'MASTER',
            name: String(salesRow?.name || previous?.name || '').trim() || 'Adsiz urun',
            code: mirrorCode,
            unitAmount: '1',
            unitAmountType: 'adet',
            suppliers: [],
            supplierLinks: [],
            supplierIds: [],
            supplierNames: [],
            supplierProductCode: '',
            colorType: color.type,
            colorCode: color.code,
            image: imageData || '',
            imageUrl: imageData || '',
            pdfDataUrl: pdfData || '',
            specs: {
                ...((previous?.specs && typeof previous.specs === 'object') ? previous.specs : {}),
                unit: 'adet',
                unitAmount: '1',
                unitAmountType: 'adet',
                brandModel: String(salesRow?.productCode || '').trim(),
                packageInfo: '',
                lengthMm: pipeLength || lowerTubeLength,
                colorType: color.type,
                color: color.name,
                colorCode: color.code,
                note: mergedNote,
                salesCatalogSourceId: sourceId,
                salesCatalogSourceCode: sourceIdCode,
                salesCatalogCategoryId: String(salesRow?.categoryId || '').trim(),
                selectedDiameter,
                bubble,
                lowerTubeLength
            },
            syncSource: 'sales-catalog',
            syncDirection: 'sales_to_master',
            sourceCatalogId: sourceId,
            sourceCatalogCode: sourceIdCode,
            sourceCatalogCategoryId: String(salesRow?.categoryId || '').trim(),
            sourceCatalogName: String(salesRow?.name || '').trim(),
            sourceCatalogProductCode: String(salesRow?.productCode || '').trim(),
            sourceCatalogReadonly: true,
            created_at: createdAt,
            updated_at: updatedAt
        };
    },

    syncSalesCatalogProductsToMaster: ({ markDirty = false } = {}) => {
        if (!DB.data || typeof DB.data !== 'object') return false;
        if (!DB.data.data || typeof DB.data.data !== 'object') DB.data.data = {};
        if (!Array.isArray(DB.data.data.productCategories)) DB.data.data.productCategories = [];
        if (!DB.data.data.productCategories.some((row) => String(row?.id || '') === 'cat_sales')) {
            DB.data.data.productCategories.push({
                id: 'cat_sales',
                name: 'Satis Urun Kutuphanesi',
                icon: 'SK',
                prefix: 'STS'
            });
        }
        if (!Array.isArray(DB.data.data.products)) DB.data.data.products = [];
        if (!Array.isArray(DB.data.data.salesCatalogProducts)) DB.data.data.salesCatalogProducts = [];

        const sourceRows = DB.data.data.salesCatalogProducts || [];
        const sourceIds = new Set(
            sourceRows
                .map((row) => String(row?.id || '').trim())
                .filter(Boolean)
        );

        let changed = false;
        const products = DB.data.data.products;
        const firstMirrorIndexBySource = new Map();

        products.forEach((row, index) => {
            if (!ProductLibraryModule.isSalesCatalogMirrorProduct(row)) return;
            const sourceId = String(row?.sourceCatalogId || '').trim();
            if (!sourceId) return;
            if (!firstMirrorIndexBySource.has(sourceId)) {
                firstMirrorIndexBySource.set(sourceId, index);
            }
        });

        sourceRows.forEach((sourceRow) => {
            const sourceId = String(sourceRow?.id || '').trim();
            if (!sourceId) return;
            const existingIndex = firstMirrorIndexBySource.has(sourceId)
                ? firstMirrorIndexBySource.get(sourceId)
                : -1;
            const existing = existingIndex >= 0 ? products[existingIndex] : null;
            const nextRecord = ProductLibraryModule.buildMasterMirrorFromSalesCatalog(sourceRow, existing);
            if (!nextRecord) return;

            if (existingIndex >= 0) {
                const prevSerialized = JSON.stringify(existing || {});
                const nextSerialized = JSON.stringify(nextRecord);
                if (prevSerialized !== nextSerialized) {
                    products[existingIndex] = nextRecord;
                    changed = true;
                }
            } else {
                products.push(nextRecord);
                firstMirrorIndexBySource.set(sourceId, products.length - 1);
                changed = true;
            }
        });

        const seenMirrorSource = new Set();
        const compacted = [];
        products.forEach((row) => {
            if (!ProductLibraryModule.isSalesCatalogMirrorProduct(row)) {
                compacted.push(row);
                return;
            }
            const sourceId = String(row?.sourceCatalogId || '').trim();
            if (!sourceId || !sourceIds.has(sourceId) || seenMirrorSource.has(sourceId)) {
                changed = true;
                return;
            }
            seenMirrorSource.add(sourceId);
            compacted.push(row);
        });

        if (compacted.length !== products.length) {
            DB.data.data.products = compacted;
        }

        if (changed && markDirty && typeof DB.markDirty === 'function') {
            DB.markDirty();
        }
        return changed;
    },

    normalizeAsciiUpper: (value) => {
        return String(value || '')
            .replace(/Ã„Â±/g, 'i')
            .replace(/Ã„Â°/g, 'I')
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
            else if (id === 'cat_sales') prefix = 'STS';
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
    inferColorTypeFromCode: (code) => {
        const raw = String(code || '').trim().toUpperCase();
        if (raw.startsWith('CLR-ELO-')) return 'eloksal';
        if (raw.startsWith('CLR-PVD-')) return 'pvd';
        if (raw.startsWith('CLR-BOY-')) return 'boya';
        if (raw.startsWith('CLR-PLX-')) return 'pleksi';
        return '';
    },
    getColorLibraryItemsByType: (type) => {
        const normalized = ProductLibraryModule.normalizeColorType(type);
        if (!normalized) return [];
        const rows = ProductLibraryModule.getColorLibraryItems()
            .filter(row => ProductLibraryModule.normalizeColorType(row?.type) === normalized)
            .map(row => ({
                id: String(row?.id || ''),
                type: normalized,
                name: String(row?.name || '').trim(),
                code: String(row?.code || '').trim().toUpperCase()
            }))
            .filter(row => row.name);
        const uniq = new Map();
        rows.forEach(row => {
            const key = row.name.toLowerCase();
            if (!uniq.has(key)) uniq.set(key, row);
        });
        return Array.from(uniq.values()).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    },
    getMasterColorItemsWithFallback: (type) => {
        const normalized = ProductLibraryModule.normalizeColorType(type);
        if (!normalized) return [];
        const primary = ProductLibraryModule.getColorLibraryItemsByType(normalized);
        if (primary.length > 0) return primary;
        return ProductLibraryModule.getMasterColorOptions()
            .map(name => ({
                id: '',
                type: normalized,
                name: String(name || '').trim(),
                code: ''
            }))
            .filter(row => row.name);
    },
    resolveMasterColorTypeForRecord: (record) => {
        const raw = record?.raw || {};
        const specs = (raw?.specs && typeof raw.specs === 'object') ? raw.specs : {};
        const fromRecord = ProductLibraryModule.normalizeColorType(
            specs?.colorType || raw?.colorType || record?.colorType || ''
        );
        if (fromRecord) return fromRecord;
        const fromCode = ProductLibraryModule.inferColorTypeFromCode(
            specs?.colorCode || raw?.colorCode || record?.colorCode || ''
        );
        if (fromCode) return fromCode;
        const colorName = String(record?.color || '').trim().toLowerCase();
        if (!colorName) return '';
        const matches = ProductLibraryModule.getColorLibraryItems().filter(item =>
            String(item?.name || '').trim().toLowerCase() === colorName
        );
        const types = Array.from(new Set(matches.map(item => ProductLibraryModule.normalizeColorType(item?.type || '')).filter(Boolean)));
        if (types.length === 1) return types[0];
        return '';
    },
    setMasterColorType: (type) => {
        ProductLibraryModule.state.masterDraftColorType = ProductLibraryModule.normalizeColorType(type);
        ProductLibraryModule.state.masterDraftColor = '';
        ProductLibraryModule.state.masterDraftColorCode = '';
        UI.renderCurrentPage();
    },
    setMasterColor: (name, code = '') => {
        ProductLibraryModule.state.masterDraftColor = String(name || '').trim();
        ProductLibraryModule.state.masterDraftColorCode = String(code || '').trim().toUpperCase();
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
        if (typeof IdentityPolicy !== 'undefined'
            && IdentityPolicy
            && typeof IdentityPolicy.collectGlobalCodes === 'function') {
            return IdentityPolicy.collectGlobalCodes(DB.data, exclude);
        }
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
        readMany('cncCards', DB.data?.data?.cncCards, ['cncId']);
        readMany('sawCutOrders', DB.data?.data?.sawCutOrders, ['code']);
        readMany('extruderLibraryCards', DB.data?.data?.extruderLibraryCards, ['cardCode']);
        readMany('plexiPolishCards', DB.data?.data?.plexiPolishCards, ['cardCode']);
        readMany('pvdCards', DB.data?.data?.pvdCards, ['cardCode']);
        readMany('ibrahimPolishCards', DB.data?.data?.ibrahimPolishCards, ['cardCode']);
        readMany('eloksalCards', DB.data?.data?.eloksalCards, ['cardCode']);
        readMany('aluminumProfiles', DB.data?.data?.aluminumProfiles, ['code']);
        readMany('colorLibrary', DB.data?.data?.colorLibrary, ['code']);
        readMany('partComponentCards', DB.data?.data?.partComponentCards, ['code']);
        readMany('semiFinishedCards', DB.data?.data?.semiFinishedCards, ['code']);
        readMany('assemblyGroups', DB.data?.data?.assemblyGroups, ['code']);
        readMany('catalogProductVariants', DB.data?.data?.catalogProductVariants, ['familyCode', 'variantCode']);
        return bag;
    },

    isGlobalCodeTaken: (code, exclude = null) => {
        if (typeof IdentityPolicy !== 'undefined'
            && IdentityPolicy
            && typeof IdentityPolicy.isGlobalCodeTaken === 'function') {
            return IdentityPolicy.isGlobalCodeTaken(DB.data, code, exclude);
        }
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
                icon: 'ÄŸÅ¸â€œÂ¦',
                prefix: ProductLibraryModule.buildCategoryPrefix(raw)
            };
        }
        return categories[0] || { id: '', name: 'Diger', icon: 'ÄŸÅ¸â€œÂ¦', prefix: 'URN' };
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
            const isSalesMirror = ProductLibraryModule.isSalesCatalogMirrorProduct(raw);
            const resolvedColor = ProductLibraryModule.resolveLinkedColorInfo({
                colorType: specs?.colorType || raw?.colorType || '',
                colorCode: specs?.colorCode || raw?.colorCode || '',
                colorName: specs?.color || raw?.color || raw?.anodizedColor || raw?.paintColor || ''
            });
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
                isSalesMirror,
                sourceCatalogId: String(raw?.sourceCatalogId || '').trim(),
                sourceCatalogCode: String(raw?.sourceCatalogCode || '').trim().toUpperCase(),
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
                colorType: String(resolvedColor.type || '').trim(),
                color: String(resolvedColor.name || '').trim(),
                colorCode: String(resolvedColor.code || '').trim().toUpperCase(),
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
        const suppliers = ProductLibraryModule.getMasterSuppliers();
        const records = ProductLibraryModule.getMasterProducts();

        const showForm = state.masterFormOpen || !!state.masterEditingId;
        const selectedId = state.masterSelectedId;
        const isComponentPicker = state.masterPickerSource === 'component';
        const isSalesVariationMasterPicker = state.masterPickerSource === 'sales-variation';
        const isAssemblyMasterPicker = state.masterPickerSource === 'assembly-master';
        const isModelMasterPicker = state.masterPickerSource === 'model-master' || state.masterPickerSource === 'model-master-row';
        const isStockGoodsReceiptPicker = state.masterPickerSource === 'stock-goods-receipt';
        const isStockInventoryRegistrationPicker = state.masterPickerSource === 'stock-inventory-registration';
        const isMasterPicker = isComponentPicker || isSalesVariationMasterPicker || isAssemblyMasterPicker || isModelMasterPicker || isStockGoodsReceiptPicker || isStockInventoryRegistrationPicker;
        const showSelectColumn = isMasterPicker;
        const masterTableColspan = showSelectColumn ? 14 : 13;
        const masterPickerHint = isAssemblyMasterPicker
            ? 'Master urun secimi modundasin. "ekle" ile secilen urunu parca grup formuna eklersin.'
            : (isModelMasterPicker
                ? 'Master urun secimi modundasin. "ekle" ile secilen urunu urun modeli formuna baglarsin.'
                : (isSalesVariationMasterPicker
                    ? 'Master urun secimi modundasin. "ekle" ile secilen urunu satis varyasyon formuna baglarsin.'
                : (isStockGoodsReceiptPicker
                    ? 'Master urun secimi modundasin. "ekle" ile secilen urunu mal kabul satirina baglarsin.'
                    : (isStockInventoryRegistrationPicker
                        ? 'Master urun secimi modundasin. "ekle" ile secilen urunu envantere elle kayit formuna baglarsin.'
                        : 'Master urun secimi modundasin. Kayitta "ekle" ile kodu parca/bilesen formuna aktarabilirsin.'))));
        const masterPickerBackLabel = isAssemblyMasterPicker
            ? 'parca grup formuna don'
            : (isModelMasterPicker
                ? 'urun modeli formuna don'
                : (isSalesVariationMasterPicker
                    ? 'satis varyasyonuna don'
                : (isStockGoodsReceiptPicker
                    ? 'mal kabule don'
                    : (isStockInventoryRegistrationPicker ? 'envantere don' : 'parca formuna don'))));
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
        const colorTypeOptions = ProductLibraryModule.getColorTypeOptions();
        const masterColorSelection = ProductLibraryModule.resolveStrictLibraryColorSelection({
            colorType: state.masterDraftColorType || '',
            colorCode: state.masterDraftColorCode || '',
            colorName: state.masterDraftColor || ''
        });
        const activeColorType = ProductLibraryModule.normalizeColorType(
            state.masterDraftColorType || masterColorSelection.type || ''
        );
        ProductLibraryModule.state.masterDraftColorType = activeColorType;
        const colorOptions = ProductLibraryModule.getColorLibraryItemsByType(activeColorType);

        if (activeColorType && masterColorSelection.found) {
            ProductLibraryModule.state.masterDraftColor = masterColorSelection.name;
            ProductLibraryModule.state.masterDraftColorCode = masterColorSelection.code;
        } else if (state.masterDraftColor || state.masterDraftColorCode) {
            ProductLibraryModule.state.masterDraftColor = '';
            ProductLibraryModule.state.masterDraftColorCode = '';
        }

        if (!state.masterFilters || typeof state.masterFilters !== 'object') {
            state.masterFilters = { categoryId: '', name: '', length: '', colorType: '', color: '', code: '' };
        }
        if (!Object.prototype.hasOwnProperty.call(state.masterFilters, 'colorType')) {
            state.masterFilters.colorType = '';
        }

        const qCategoryId = String(state.masterFilters.categoryId || '').trim();
        const qName = String(state.masterFilters.name || '').trim().toLocaleLowerCase('tr-TR');
        const qLen = String(state.masterFilters.length || '').trim().toLocaleLowerCase('tr-TR');
        const qColorType = ProductLibraryModule.normalizeColorType(state.masterFilters.colorType || '');
        const qColorName = String(state.masterFilters.color || '').trim();
        const qCode = String(state.masterFilters.code || '').trim().toLocaleLowerCase('tr-TR');
        const colorSearchOptions = ProductLibraryModule.getColorLibraryItemsByType(qColorType);

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
            if (qColorType && ProductLibraryModule.normalizeColorType(p.colorType || '') !== qColorType) return false;
            if (qColorType && qColorName) {
                const rowColor = String(p.color || '').trim().toLocaleLowerCase('tr-TR');
                if (rowColor !== qColorName.toLocaleLowerCase('tr-TR')) return false;
            }
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

        const expandedMap = (state.masterCategoryExpanded && typeof state.masterCategoryExpanded === 'object')
            ? state.masterCategoryExpanded
            : {};
        const renderMasterRow = (p) => {
            const isSalesMirror = !!p.isSalesMirror;
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
            const selectedStyle = selectedId === p.id ? 'background:#ffe4e6;' : '';
            const sourceBadge = isSalesMirror
                ? '<span style="display:inline-flex; align-items:center; margin-left:0.45rem; padding:0.08rem 0.42rem; border-radius:999px; background:#eef2ff; color:#1e3a8a; font-size:0.68rem; font-weight:800;">SATIS</span>'
                : '';
            return `
                <tr style="border-bottom:1px solid #eef2f7; ${selectedStyle}">
                    <td style="padding:0.55rem; font-weight:700; color:#334155;">${ProductLibraryModule.escapeHtml(p.name || '-')}${sourceBadge}</td>
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
                    <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.editMasterProduct('${p.id}')" ${isSalesMirror ? 'disabled' : ''}>${isSalesMirror ? 'kilitli' : 'duzenle'}</button></td>
                    ${showSelectColumn
                        ? `<td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.selectMasterProduct('${p.id}')" style="${selectedId === p.id ? 'background:#0f172a; color:white; border-color:#0f172a;' : ''}">${isMasterPicker ? 'ekle' : 'sec'}</button></td>`
                        : ''}
                    <td style="padding:0.55rem; text-align:center;"><button class="btn-sm" onclick="ProductLibraryModule.deleteMasterProduct('${p.id}')" ${isSalesMirror ? 'disabled' : ''}>sil</button></td>
                </tr>
            `;
        };

        const rowsHtml = sorted.length === 0
            ? `<tr><td colspan="${masterTableColspan}" style="text-align:center; padding:1.3rem; color:#94a3b8;">Kayit bulunamadi.</td></tr>`
            : qCategoryId
                ? sorted.map(renderMasterRow).join('')
                : (() => {
                    const groups = [];
                    const indexByKey = new Map();
                    sorted.forEach((row) => {
                        const rawName = String(row.categoryName || 'Diger').trim() || 'Diger';
                        const key = String(row.categoryId || ProductLibraryModule.normalizeAsciiUpper(rawName) || 'DIGER');
                        if (!indexByKey.has(key)) {
                            indexByKey.set(key, groups.length);
                            groups.push({ key, name: rawName, items: [row] });
                            return;
                        }
                        groups[indexByKey.get(key)].items.push(row);
                    });

                    return groups.map((group) => {
                        const isOpen = !!expandedMap[group.key];
                        const arrowIcon = isOpen ? 'chevron-down' : 'chevron-right';
                        const rows = isOpen ? group.items.map(renderMasterRow).join('') : '';
                        return `
                            <tr>
                                <td colspan="${masterTableColspan}" style="padding:0; border-top:2px solid #cbd5e1; background:${isOpen ? '#eef2ff' : '#f8fafc'};">
                                    <button type="button" onclick='ProductLibraryModule.toggleMasterCategorySection(${JSON.stringify(group.key)})' style="width:calc(100% - 0.7rem); margin:0.3rem 0.35rem; border:1px solid #cbd5e1; border-radius:0.62rem; background:${isOpen ? '#eef2ff' : 'white'}; padding:0.65rem 0.8rem; display:flex; align-items:center; gap:0.6rem; cursor:pointer; text-align:left;">
                                        <span style="display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border:1.5px solid #0f172a; border-radius:999px; color:#0f172a; background:white;">
                                            <i data-lucide="${arrowIcon}" width="16" height="16"></i>
                                        </span>
                                        <span style="font-weight:800; color:#334155; font-size:1rem;">${ProductLibraryModule.escapeHtml(group.name)}</span>
                                        <span style="font-size:0.86rem; color:#64748b; font-weight:700;">(${group.items.length})</span>
                                    </button>
                                </td>
                            </tr>
                            ${rows}
                        `;
                    }).join('');
                })();

        container.innerHTML = `
            <div style="max-width:1920px; margin:0 auto; font-family:'Inter',sans-serif;">
                ${isMasterPicker ? `
                    <div style="background:#eff6ff; border:2px solid #1d4ed8; color:#1e3a8a; border-radius:0.9rem; padding:0.7rem 0.85rem; margin-bottom:0.8rem; display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap;">
                        <div style="font-weight:700;">${masterPickerHint}</div>
                        <button class="btn-sm" onclick="ProductLibraryModule.cancelMasterPicker()">${masterPickerBackLabel}</button>
                    </div>
                ` : ''}
                <div style="background:rgba(255,255,255,0.86); border:1px solid #e2e8f0; border-radius:1.25rem; padding:1rem; margin-bottom:1.2rem;">
                    <div style="display:grid; grid-template-columns: 280px 1fr 190px 280px 190px 170px; gap:0.65rem; align-items:center;">
                        <select onchange="ProductLibraryModule.setMasterFilter('categoryId', this.value)" style="width:100%; height:50px; border:1px solid #cbd5e1; border-radius:0.65rem; padding:0 0.7rem; font-weight:700;">
                            <option value="">tum urunler (varsayilan)</option>
                            ${categories.map(c => `<option value="${c.id}" ${qCategoryId === c.id ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(c.name)}</option>`).join('')}
                        </select>
                        <input id="master_filter_name" value="${ProductLibraryModule.escapeHtml(state.masterFilters.name || '')}" oninput="ProductLibraryModule.setMasterFilter('name', this.value)" placeholder="urun adiyla ara" style="height:50px; border:1px solid #cbd5e1; border-radius:0.65rem; padding:0 0.75rem; font-weight:600;">
                        <input id="master_filter_length" value="${ProductLibraryModule.escapeHtml(state.masterFilters.length || '')}" oninput="ProductLibraryModule.setMasterFilter('length', this.value)" placeholder="boy ara" style="height:50px; border:1px solid #cbd5e1; border-radius:0.65rem; padding:0 0.75rem; font-weight:600;">
                        <div style="height:50px; border:1px solid #cbd5e1; border-radius:0.7rem; overflow:hidden; display:grid; grid-template-columns:42% 58%; background:white;">
                            <div style="background:#d9e9f8; border-right:1px solid #cbd5e1;">
                                <select id="master_filter_color_type" onchange="ProductLibraryModule.setMasterColorFilterType(this.value)" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.6rem; font-weight:700; color:#334155;">
                                    <option value="">kategori sec</option>
                                    ${ProductLibraryModule.getColorTypeOptions().map(opt => `<option value="${opt.id}" ${qColorType === opt.id ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(opt.shortLabel || opt.label)}</option>`).join('')}
                                </select>
                            </div>
                            <div style="background:${qColorType ? 'white' : '#f1f5f9'};">
                                <select id="master_filter_color" ${qColorType ? '' : 'disabled'} onchange="ProductLibraryModule.setMasterColorFilter(this.value)" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.6rem; font-weight:700; color:${qColorType ? '#111827' : '#94a3b8'};">
                                    <option value="">renk sec</option>
                                    ${colorSearchOptions.map(opt => `<option value="${ProductLibraryModule.escapeHtml(String(opt.name || ''))}" ${String(qColorName) === String(opt.name || '') ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(String(opt.name || ''))}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <input id="master_filter_code" value="${ProductLibraryModule.escapeHtml(state.masterFilters.code || '')}" oninput="ProductLibraryModule.setMasterFilter('code', this.value)" placeholder="ID kod ile ara" style="height:50px; border:1px solid #cbd5e1; border-radius:0.65rem; padding:0 0.75rem; font-weight:600;">
                        <button class="btn-primary" onclick="${isMasterPicker ? 'ProductLibraryModule.cancelMasterPicker()' : 'ProductLibraryModule.toggleMasterForm()'}" style="height:50px; border-radius:0.75rem; text-transform:lowercase;">${isMasterPicker ? 'vazgec' : (showForm ? 'vazgec' : 'urun ekle +')}</button>
                    </div>
                    ${showForm && !isMasterPicker ? `<div style="margin-top:0.95rem;">${ProductLibraryModule.renderMasterFormHtml({ categories, unitOptions, colorTypeOptions, colorOptions, suppliers, selectedSupplierRowsHtml, draftCode })}</div>` : ''}
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
                                    ${showSelectColumn ? '<th style="text-align:center;">SEC</th>' : ''}
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

    renderMasterFormHtml: ({ categories, unitOptions, colorTypeOptions, colorOptions, suppliers, selectedSupplierRowsHtml, draftCode }) => {
        const state = ProductLibraryModule.state;
        const supplierSearch = String(state.masterDraftSupplierSearch || '');
        const supplierSearchNorm = ProductLibraryModule.normalizeAsciiUpper(supplierSearch);
        const filteredSuppliers = !supplierSearchNorm
            ? suppliers
            : suppliers.filter(s => ProductLibraryModule.normalizeAsciiUpper(s.name || '').includes(supplierSearchNorm));
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

                <div style="display:grid; grid-template-columns: 220px 220px 340px 1fr; gap:0.75rem; align-items:end; margin-bottom:0.75rem;">
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
                    <div style="width:100%; max-width:440px;">
                        <div style="margin-bottom:0.2rem;">
                            <label style="display:block; font-size:0.72rem; color:#64748b;">kategori / renk</label>
                        </div>
                        <div style="height:45px; border:1px solid #cbd5e1; border-radius:0.75rem; overflow:hidden; display:grid; grid-template-columns:42% 58%;">
                            <div style="background:#d9e9f8; border-right:1px solid #cbd5e1;">
                                <select onchange="ProductLibraryModule.setMasterColorType(this.value)" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.65rem; font-weight:700; color:#334155;">
                                    <option value="">kategori sec</option>
                                    ${colorTypeOptions.map(opt => `<option value="${opt.id}" ${state.masterDraftColorType === opt.id ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(opt.label)}</option>`).join('')}
                                </select>
                            </div>
                            <div style="background:${state.masterDraftColorType ? 'white' : '#f8fafc'};">
                                <select ${state.masterDraftColorType ? '' : 'disabled'} onchange="ProductLibraryModule.setMasterColor(this.value, this.options[this.selectedIndex]?.dataset?.code || '')" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.65rem; font-weight:700; color:${state.masterDraftColorType ? '#111827' : '#94a3b8'};">
                                    <option value="">renk sec</option>
                                    ${colorOptions.map(x => `<option value="${ProductLibraryModule.escapeHtml(x.name || '')}" data-code="${ProductLibraryModule.escapeHtml(x.code || '')}" ${String(state.masterDraftColor || '') === String(x.name || '') ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(x.name || '')}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">kod</label>
                        <input disabled value="${ProductLibraryModule.escapeHtml(draftCode)}" style="width:100%; height:45px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace; font-weight:700;">
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 340px 210px 1fr 1fr; gap:0.75rem; align-items:start; margin-bottom:0.75rem;">
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">tedarikci ara</label>
                        <input id="master_supplier_search" value="${ProductLibraryModule.escapeHtml(supplierSearch)}" oninput="ProductLibraryModule.setMasterSupplierSearch(this.value)" placeholder="tedarikci ara" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; margin-bottom:0.4rem;">
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">tedarikciler sec</label>
                        <select id="master_supplier_select" multiple onchange="ProductLibraryModule.setMasterSupplierSelection(this)" style="width:100%; min-height:110px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.4rem;">
                            ${suppliers.length === 0
                                ? `<option value="">Kayitli tedarikci yok</option>`
                                : filteredSuppliers.length === 0
                                    ? `<option value="">Eslesen tedarikci yok</option>`
                                    : filteredSuppliers.map(s => `<option value="${s.id}" ${state.masterDraftSupplierIds.includes(s.id) ? 'selected' : ''}>${ProductLibraryModule.escapeHtml(s.name)}</option>`).join('')
                            }
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
                                <button class="btn-sm" onclick="ProductLibraryModule.previewMasterDraftAttachment()" ${state.masterDraftAttachment ? '' : 'disabled'}>goruntule</button>
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
                        ${state.masterEditingId ? `<button class="btn-sm" onclick="ProductLibraryModule.deleteMasterProduct('${state.masterEditingId}')" style="height:40px; padding:0 1rem; color:#b91c1c; border-color:#fecaca; background:#fef2f2;">sil</button>` : ''}
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

        if (!ProductLibraryModule.state.masterFilters || typeof ProductLibraryModule.state.masterFilters !== 'object') {
            ProductLibraryModule.state.masterFilters = { categoryId: '', name: '', length: '', colorType: '', color: '', code: '' };
        }
        if (key === 'colorType') {
            ProductLibraryModule.state.masterFilters.colorType = ProductLibraryModule.normalizeColorType(value || '');
            ProductLibraryModule.state.masterFilters.color = '';
        } else {
            ProductLibraryModule.state.masterFilters[key] = value || '';
        }
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
    setMasterColorFilterType: (value) => {
        ProductLibraryModule.setMasterFilter('colorType', value);
    },
    setMasterColorFilter: (value) => {
        ProductLibraryModule.setMasterFilter('color', String(value || '').trim());
    },

    toggleMasterCategorySection: (groupKey) => {
        const key = String(groupKey || '').trim();
        if (!key) return;
        const current = (ProductLibraryModule.state.masterCategoryExpanded && typeof ProductLibraryModule.state.masterCategoryExpanded === 'object')
            ? ProductLibraryModule.state.masterCategoryExpanded
            : {};
        ProductLibraryModule.state.masterCategoryExpanded = {
            ...current,
            [key]: !current[key]
        };
        UI.renderCurrentPage();
    },

    setMasterSupplierSearch: (value) => {
        const active = document.activeElement;
        const restore = active?.id === 'master_supplier_search';
        const start = typeof active?.selectionStart === 'number' ? active.selectionStart : null;
        const end = typeof active?.selectionEnd === 'number' ? active.selectionEnd : null;

        ProductLibraryModule.state.masterDraftSupplierSearch = value || '';
        UI.renderCurrentPage();

        if (restore) {
            const next = document.getElementById('master_supplier_search');
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
        if (key === 'color') {
            ProductLibraryModule.state.masterDraftColor = value || '';
            ProductLibraryModule.state.masterDraftColorCode = '';
        }
        if (key === 'colorType') ProductLibraryModule.state.masterDraftColorType = ProductLibraryModule.normalizeColorType(value || '');
        if (key === 'colorCode') ProductLibraryModule.state.masterDraftColorCode = String(value || '').trim().toUpperCase();
        if (key === 'supplierCode') ProductLibraryModule.state.masterDraftSupplierCode = value || '';
        if (key === 'note') ProductLibraryModule.state.masterDraftNote = value || '';
        if (key === 'categoryId' || key === 'unit' || key === 'colorType') UI.renderCurrentPage();
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
        ProductLibraryModule.state.masterDraftColorType = '';
        ProductLibraryModule.state.masterDraftColor = '';
        ProductLibraryModule.state.masterDraftColorCode = '';
        ProductLibraryModule.state.masterDraftSupplierIds = [];
        ProductLibraryModule.state.masterDraftSupplierLinks = [];
        ProductLibraryModule.state.masterDraftSupplierSearch = '';
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
        const visibleIds = Array.from(el?.options || [])
            .map(opt => String(opt?.value || '').trim())
            .filter(Boolean);
        const selectedVisibleIds = Array.from(el?.selectedOptions || [])
            .map(opt => String(opt.value || '').trim())
            .filter(Boolean);
        const previous = Array.isArray(ProductLibraryModule.state.masterDraftSupplierIds)
            ? ProductLibraryModule.state.masterDraftSupplierIds
            : [];
        const hiddenPreserved = previous.filter(id => !visibleIds.includes(id));
        ProductLibraryModule.state.masterDraftSupplierIds = Array.from(new Set([...hiddenPreserved, ...selectedVisibleIds]));
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

        const supplierOptions = ProductLibraryModule.getMasterSuppliers();
        const current = Array.isArray(ProductLibraryModule.state.masterDraftSupplierLinks)
            ? ProductLibraryModule.state.masterDraftSupplierLinks
            : [];
        const next = [...current];

        supplierIds.forEach(id => {
            const found = supplierOptions.find(s => s.id === id);
            if (!found) return;
            const idx = next.findIndex(x => (x?.supplierId || '') === id);
            const priorCode = idx >= 0 ? String(next[idx]?.supplierCode || '').trim() : '';
            const row = {
                supplierId: found.id,
                supplierName: found.name,
                supplierCode: code || priorCode
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
        if (!ProductLibraryModule.confirmDestructiveAction()) return;
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
        if (!ProductLibraryModule.confirmDestructiveAction()) return;
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
        const record = ProductLibraryModule.getMasterProductById(id);
        if (!record) return;
        ProductLibraryModule.state.masterSelectedId = id;
        if (ProductLibraryModule.state.masterPickerSource === 'component') {
            const code = String(record.code || '').trim();
            if (!code) {
                alert('Secilen kayitta ID kod bulunamadi.');
                return;
            }
            ProductLibraryModule.state.componentDraftMasterCode = code;
            ProductLibraryModule.state.workspaceView = ProductLibraryModule.getComponentWorkspaceByKind(ProductLibraryModule.getActiveComponentLibraryKind());
            ProductLibraryModule.state.componentFormOpen = true;
            ProductLibraryModule.state.masterPickerSource = '';
        } else if (ProductLibraryModule.state.masterPickerSource === 'sales-variation') {
            ProductLibraryModule.selectSalesVariationMaster(id);
            return;
        } else if (ProductLibraryModule.state.masterPickerSource === 'model-master' || ProductLibraryModule.state.masterPickerSource === 'model-master-row') {
            ProductLibraryModule.selectModelMaster(id, ProductLibraryModule.state.modelMasterPickerRowId);
            return;
        } else if (ProductLibraryModule.state.masterPickerSource === 'assembly-master') {
            const added = ProductLibraryModule.addAssemblyDraftItem('master', record.id);
            if (!added) return;
            ProductLibraryModule.state.masterPickerSource = '';
            ProductLibraryModule.state.componentPickerSource = '';
            ProductLibraryModule.state.workspaceView = 'assembly';
            ProductLibraryModule.state.assemblyFormOpen = true;
            ProductLibraryModule.state.assemblyViewingId = null;
        } else if (ProductLibraryModule.state.masterPickerSource === 'stock-goods-receipt') {
            const applied = (typeof StockModule !== 'undefined' && typeof StockModule.selectGoodsReceiptProductFromMasterLibrary === 'function')
                ? StockModule.selectGoodsReceiptProductFromMasterLibrary(record.id)
                : false;
            if (!applied) return;
            ProductLibraryModule.state.masterPickerSource = '';
            ProductLibraryModule.state.componentPickerSource = '';
            ProductLibraryModule.state.workspaceView = 'menu';
            if (typeof Router !== 'undefined' && Router && typeof Router.navigate === 'function') {
                Router.navigate('stock', { fromBack: true });
                return;
            }
        } else if (ProductLibraryModule.state.masterPickerSource === 'stock-inventory-registration') {
            const applied = (typeof StockModule !== 'undefined' && typeof StockModule.selectInventoryRegistrationProductFromMasterLibrary === 'function')
                ? StockModule.selectInventoryRegistrationProductFromMasterLibrary(record.id)
                : false;
            if (!applied) return;
            ProductLibraryModule.state.masterPickerSource = '';
            ProductLibraryModule.state.componentPickerSource = '';
            ProductLibraryModule.state.workspaceView = 'menu';
            if (typeof Router !== 'undefined' && Router && typeof Router.navigate === 'function') {
                Router.navigate('stock', { fromBack: true });
                return;
            }
        }
        UI.renderCurrentPage();
    },

    cancelMasterPicker: () => {
        const src = String(ProductLibraryModule.state.masterPickerSource || '');
        const pendingRowId = String(ProductLibraryModule.state.modelMasterPickerRowId || '').trim();
        ProductLibraryModule.state.masterPickerSource = '';
        ProductLibraryModule.state.componentPickerSource = '';
        ProductLibraryModule.state.modelMasterPickerRowId = '';
        if (src === 'assembly-master') {
            ProductLibraryModule.state.workspaceView = 'assembly';
            ProductLibraryModule.state.assemblyFormOpen = true;
            ProductLibraryModule.state.assemblyViewingId = null;
        } else if (src === 'stock-goods-receipt') {
            if (typeof StockModule !== 'undefined' && typeof StockModule.cancelGoodsReceiptProductMasterPicker === 'function') {
                StockModule.cancelGoodsReceiptProductMasterPicker();
            }
            ProductLibraryModule.state.workspaceView = 'menu';
            if (typeof Router !== 'undefined' && Router && typeof Router.navigate === 'function') {
                Router.navigate('stock', { fromBack: true });
                return;
            }
        } else if (src === 'stock-inventory-registration') {
            if (typeof StockModule !== 'undefined' && typeof StockModule.cancelInventoryRegistrationProductPicker === 'function') {
                StockModule.cancelInventoryRegistrationProductPicker();
            }
            ProductLibraryModule.state.workspaceView = 'menu';
            if (typeof Router !== 'undefined' && Router && typeof Router.navigate === 'function') {
                Router.navigate('stock', { fromBack: true });
                return;
            }
        } else if (src === 'model-master' || src === 'model-master-row') {
            if (src === 'model-master-row' && pendingRowId) {
                const rows = Array.isArray(ProductLibraryModule.state.modelDraftMasterRefs) ? ProductLibraryModule.state.modelDraftMasterRefs : [];
                ProductLibraryModule.state.modelDraftMasterRefs = rows.filter((row) =>
                    String(row?.rowId || '') !== pendingRowId || String(row?.code || '').trim()
                );
                ProductLibraryModule.syncModelDraftPrimaryMasterRef();
            }
            ProductLibraryModule.state.workspaceView = 'models';
            ProductLibraryModule.state.modelFormOpen = true;
            ProductLibraryModule.state.modelViewingId = null;
        } else if (src === 'sales-variation') {
            ProductLibraryModule.state.workspaceView = 'sales-products';
        } else {
            ProductLibraryModule.state.workspaceView = ProductLibraryModule.getComponentWorkspaceByKind(ProductLibraryModule.getActiveComponentLibraryKind());
            ProductLibraryModule.state.componentFormOpen = true;
        }
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
        ProductLibraryModule.state.masterDraftColorType = ProductLibraryModule.resolveMasterColorTypeForRecord(record);
        ProductLibraryModule.state.masterDraftColor = record.color || '';
        ProductLibraryModule.state.masterDraftColorCode = String(record.colorCode || '').trim().toUpperCase();
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
        ProductLibraryModule.state.masterDraftSupplierSearch = '';
        ProductLibraryModule.state.masterDraftSupplierCode = '';
        ProductLibraryModule.state.masterDraftNote = record.note || '';
        ProductLibraryModule.state.masterDraftAttachment = record.attachment?.data ? record.attachment : null;
    },

    editMasterProduct: (id) => {
        const record = ProductLibraryModule.getMasterProductById(id);
        if (!record) return;
        if (record.isSalesMirror || ProductLibraryModule.isSalesCatalogMirrorProduct(record.raw)) {
            alert('Bu kayit Satis Urun Kutuphanesi kaynaklidir. Duzenleme icin satis ekranini kullanin.');
            return;
        }
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

    buildMasterDuplicateSignature: (row = {}) => {
        return [
            ProductLibraryModule.normalizeAsciiUpper(row?.categoryId || ''),
            ProductLibraryModule.normalizeAsciiUpper(row?.name || ''),
            ProductLibraryModule.normalizeAsciiUpper(row?.unit || ''),
            ProductLibraryModule.normalizeAsciiUpper(row?.unitAmount || ''),
            ProductLibraryModule.normalizeAsciiUpper(row?.brand || ''),
            ProductLibraryModule.normalizeAsciiUpper(row?.pack || ''),
            ProductLibraryModule.normalizeAsciiUpper(row?.length || ''),
            ProductLibraryModule.normalizeColorType(row?.colorType || ''),
            ProductLibraryModule.normalizeAsciiUpper(row?.color || ''),
            ProductLibraryModule.normalizeAsciiUpper(row?.colorCode || '')
        ].join('||');
    },

    findDuplicateMasterProduct: (row = {}, excludeId = '') => {
        const targetSignature = ProductLibraryModule.buildMasterDuplicateSignature(row);
        if (!targetSignature) return null;
        const all = ProductLibraryModule.getMasterProducts();
        return all.find(item => {
            if (excludeId && String(item?.id || '') === String(excludeId)) return false;
            return ProductLibraryModule.buildMasterDuplicateSignature(item) === targetSignature;
        }) || null;
    },

    saveMasterProduct: async () => {
        const s = ProductLibraryModule.state;
        const name = String(s.masterDraftName || '').trim();
        if (!name) return alert('Urun adi zorunlu.');

        const categories = ProductLibraryModule.getMasterCategories();
        const unitOptions = ProductLibraryModule.getMasterUnitOptions();
        const suppliers = ProductLibraryModule.getMasterSuppliers();
        const allProducts = DB.data.data.products || [];
        if (s.masterEditingId) {
            const editingRow = allProducts.find(x => String(x?.id || '') === String(s.masterEditingId));
            if (ProductLibraryModule.isSalesCatalogMirrorProduct(editingRow)) {
                alert('Bu kayit Satis Urun Kutuphanesi kaynaklidir. Degistirmek icin satis ekranindan guncelleyin.');
                return;
            }
        }

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
        let colorType = ProductLibraryModule.normalizeColorType(s.masterDraftColorType || '');
        let color = String(s.masterDraftColor || '').trim();
        let colorCode = String(s.masterDraftColorCode || '').trim().toUpperCase();
        const note = String(s.masterDraftNote || '').trim();
        const now = new Date().toISOString();

        if (color && !colorType) return alert('Renk kategorisi seciniz.');
        if (colorType && !color) return alert('Renk seciniz.');
        if (colorType || color || colorCode) {
            const strictColor = ProductLibraryModule.resolveStrictLibraryColorSelection({
                colorType,
                colorCode,
                colorName: color
            });
            if (!strictColor.found) return alert('Secilen renk kutuphanede bulunamadi. Lutfen listeden gecerli renk seciniz.');
            colorType = strictColor.type;
            color = strictColor.name;
            colorCode = strictColor.code;
        }

        const supplierLinks = Array.isArray(s.masterDraftSupplierLinks)
            ? s.masterDraftSupplierLinks.map(link => ({
                supplierId: String(link?.supplierId || '').trim(),
                supplierName: String(link?.supplierName || '').trim(),
                supplierCode: String(link?.supplierCode || '').trim()
            })).filter(link => link.supplierId || link.supplierName)
            : [];

        const duplicateMaster = ProductLibraryModule.findDuplicateMasterProduct({
            categoryId: finalCategory.id,
            name,
            unit,
            unitAmount,
            brand,
            pack,
            length,
            colorType,
            color,
            colorCode
        }, s.masterEditingId || '');
        if (duplicateMaster) {
            return alert(`Bu urun zaten mevcut. ID kod: ${duplicateMaster.code || '-'}`);
        }

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
                colorType,
                colorCode,
                attachment: s.masterDraftAttachment?.data ? s.masterDraftAttachment : old.attachment || null,
                specs: {
                    ...oldSpecs,
                    unit,
                    unitAmount,
                    unitAmountType,
                    brandModel: brand,
                    packageInfo: pack,
                    lengthMm: length,
                    colorType,
                    color,
                    colorCode,
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
                colorType,
                colorCode,
                attachment: s.masterDraftAttachment?.data ? s.masterDraftAttachment : null,
                specs: {
                    unit,
                    unitAmount,
                    unitAmountType,
                    brandModel: brand,
                    packageInfo: pack,
                    lengthMm: length,
                    colorType,
                    color,
                    colorCode,
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
        if (ProductLibraryModule.isSalesCatalogMirrorProduct(row)) {
            alert('Bu kayit Satis Urun Kutuphanesi ile senkron. Silmek icin satis ekranindan silin.');
            return;
        }
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
            icon: 'ÄŸÅ¸â€œÂ¦',
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
        if (products.length === 0) return '<div style="text-align:center; padding:2rem; color:#cbd5e1">Bu kategoride henÃƒÂ¼z ÃƒÂ¼rÃƒÂ¼n yok.</div>';
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
        if (category.name.toLowerCase().includes('ekstrÃƒÂ¼der') || category.name.toLowerCase().includes('pleksi') || category.id === 'cat_ext') {
            ProductLibraryModule.renderExtruderPage(container);
            return;
        }

        // --- HARDWARE MODULE ROUTING ---
        if (category.name.toLowerCase().includes('hÃ„Â±rdavat') || category.name.toLowerCase().includes('vida') || category.id === 'cat3') {
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
                            <input type="text" placeholder="ÃƒÂ¼rÃƒÂ¼n ara..." style="width:200px">
                            <i data-lucide="search" width="16" style="color:#94a3b8"></i>
                         </div>
                    </div>

                    <!-- ADD BUTTON -->
                    <div style="flex-shrink:0">
                        ${(ProductLibraryModule.state.isFormVisible) ?
                `<button onclick="ProductLibraryModule.toggleExtruderForm()" class="btn-primary" style="background:#ef4444; padding:0.8rem 2rem; border-radius:1rem">Ã„Â°ptal</button>`
                :
                `<button onclick="ProductLibraryModule.toggleExtruderForm()" class="btn-primary" style="padding:0.8rem 2rem; border-radius:1rem; font-size:1rem; box-shadow:0 4px 10px rgba(0,0,0,0.05)">ÃƒÅ“rÃƒÂ¼n ekle +</button>`
            }
                    </div>
                </div>

                <!-- LIST (Empty State for now) -->
               <div style="display:flex; flex-direction:column; gap:0; border-top:2px solid #334155">
                     <div style="padding:4rem; text-align:center; color:#94a3b8">
                        HenÃƒÂ¼z ÃƒÂ¼rÃƒÂ¼n bulunamadÃ„Â±.
                     </div>
                </div>

                <!-- ADD FORM (CONDITIONAL) -->
                ${(ProductLibraryModule.state.isFormVisible) ? `
                    <div id="extFormSection" style="margin-top:4rem; background:white; border:2px solid #e2e8f0; border-radius:2rem; padding:3rem; position:relative; box-shadow:0 20px 40px -10px rgba(0,0,0,0.05); animation: slideDown 0.3s ease-out">
                         <h3 style="font-size:1.5rem; color:#334155; margin-bottom:2rem; font-weight:700">Yeni ÃƒÅ“rÃƒÂ¼n Ekle</h3>
                         <div style="text-align:center; color:#64748b">
                            Bu kategori iÃƒÂ§in form yapÃ„Â±sÃ„Â± henÃƒÂ¼z oluÃ…Å¸turulmadÃ„Â±.
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
        window.selectedEmoji = cat ? cat.icon : 'ÄŸÅ¸â€œÂ¦';

        Modal.open(editId ? 'Kategoriyi DÃƒÂ¼zenle' : 'Yeni Kategori Ekle', `
            <div style="display:flex; flex-direction:column; gap:1.5rem">
                <div>
                    <label style="display:block; font-weight:700; color:#334155; margin-bottom:0.5rem">Kategori AdÃ„Â±</label>
                    <input id="new_cat_name" value="${cat ? cat.name : ''}" placeholder="Ãƒâ€“rn: Profil, Civata, Kutu..." style="width:100%; padding:0.8rem; border:1px solid #cbd5e1; border-radius:0.5rem; font-size:1rem">
                </div>
                <div>
                    <label style="display:block; font-weight:700; color:#334155; margin-bottom:0.5rem">Emoji Simgesi</label>
                    <div style="display:grid; grid-template-columns:repeat(6, 1fr); gap:0.5rem">
                        ${['ÄŸÅ¸â€œÂ¦', 'ÄŸÅ¸Ââ€”Ã¯Â¸Â', 'ÄŸÅ¸â€Â©', 'ÄŸÅ¸â€Â®', 'Ã¢Å¡â„¢Ã¯Â¸Â', 'ÄŸÅ¸â€Å’', 'ÄŸÅ¸Â§Â°', 'ÄŸÅ¸Â§Âµ', 'ÄŸÅ¸ÂªÂµ', 'ÄŸÅ¸â€œÂ', 'ÄŸÅ¸Â§Âª', 'ÄŸÅ¸â€ºÂ¡Ã¯Â¸Â'].map(e => `
                            <button onclick="document.querySelectorAll('.emoji-btn').forEach(b => b.style.background='white'); this.style.background='#eff6ff'; window.selectedEmoji='${e}'" class="emoji-btn" style="font-size:1.5rem; padding:0.5rem; border:1px solid #e2e8f0; border-radius:0.5rem; background:${e === window.selectedEmoji ? '#eff6ff' : 'white'}; cursor:pointer; transition:all 0.1s">${e}</button>
                        `).join('')}
                    </div>
                </div>
                <button onclick="ProductLibraryModule.saveCategory('${editId || ''}')" class="btn-primary" style="padding:1rem">${editId ? 'GÃƒÂ¼ncelle' : 'OluÃ…Å¸tur'}</button>
            </div>
        `);
    },

    saveCategory: async (editId) => {
        const name = document.getElementById('new_cat_name').value;
        if (!name) return alert('Kategori adÃ„Â± giriniz.');

        if (editId && editId !== 'undefined' && editId !== 'null' && editId !== '') {
            const idx = DB.data.data.productCategories.findIndex(c => c.id === editId);
            if (idx !== -1) {
                DB.data.data.productCategories[idx] = { ...DB.data.data.productCategories[idx], name, icon: window.selectedEmoji };
            }
        } else {
            DB.data.data.productCategories.push({
                id: crypto.randomUUID(),
                name,
                icon: window.selectedEmoji || 'ÄŸÅ¸â€œÂ¦'
            });
        }

        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },

    deleteCategory: async (id) => {
        if (confirm('Bu kategoriyi silmek istediÃ„Å¸inize emin misiniz?')) {
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
            colors: ['FÃƒÂ¼me', 'Antrasit', 'Ã…Âeffaf', 'Beyaz'],
            diameters: [50, 60, 65, 70],
            thicknesses: [2, 3, 5],
            surfaces: ['KabarcÃ„Â±ksÃ„Â±z', 'KabarcÃ„Â±klÃ„Â±']
        };
        for (let k in defaults) {
            if (!DB.data.meta.options[k]) DB.data.meta.options[k] = defaults[k];
        }

        const opts = DB.data.meta.options;

        container.innerHTML = `
            <div style="max-width:1400px; margin:0 auto; font-family: 'Inter', sans-serif;">
                
                <!-- MAIN TITLE -->
                <div style="text-align:center; margin-bottom:3rem; position:relative">
                    <h1 style="font-size:2.5rem; color:#1e293b; letter-spacing:-0.03em; font-weight:300;">ekstrÃƒÂ¼der <span style="font-weight:700">envanter</span></h1>
                </div>

                <!-- TABS & ACTIONS ROW -->
                <div style="display:flex; flex-wrap:wrap; gap:1rem; align-items:center; margin-bottom:3rem; justify-content:space-between">
                     <!-- TABS -->
                    <div style="display:flex; gap:1rem;">
                        <button onclick="ProductLibraryModule.setExtruderTab('ROD')" 
                            class="${extruderTab === 'ROD' ? 'active-tab' : 'inactive-tab'}">
                            ÃƒÂ§ubuk
                        </button>
                        <button onclick="ProductLibraryModule.setExtruderTab('PIPE')" 
                            class="${extruderTab === 'PIPE' ? 'active-tab' : 'inactive-tab'}">
                            boru
                        </button>
                    </div>

                    <!-- SEARCH CAPSULES (Filters) -->
                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; flex:1; justify-content:center">
                         ${ProductLibraryModule.renderCapsule('ÃƒÂ§ap ile ara', 'dia', opts.diameters)}
                         ${ProductLibraryModule.renderCapsule(extruderTab === 'ROD' ? 'yÃƒÂ¼zey ile ara' : 'kalÃ„Â±nlÃ„Â±k ile ara', extruderTab === 'ROD' ? 'surface' : 'thick', extruderTab === 'ROD' ? opts.surfaces : opts.thicknesses)}
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
                `<button onclick="ProductLibraryModule.toggleExtruderForm()" class="btn-primary" style="background:#ef4444; padding:0.8rem 2rem; border-radius:1rem">Ã„Â°ptal</button>`
                :
                `<button onclick="ProductLibraryModule.toggleExtruderForm()" class="btn-primary" style="padding:0.8rem 2rem; border-radius:1rem; font-size:1rem; box-shadow:0 4px 10px rgba(0,0,0,0.05)">ÃƒÅ“rÃƒÂ¼n ekle +</button>`
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
                         <h3 style="font-size:1.5rem; color:#334155; margin-bottom:2rem; font-weight:700">Yeni EkstrÃƒÂ¼der ÃƒÅ“rÃƒÂ¼nÃƒÂ¼ Ekle</h3>
                         
                         <!-- Re-using existing check logic but presented better -->
                         <div style="display:flex; gap:2rem; flex-wrap:wrap; align-items:flex-end">
                            ${ProductLibraryModule.renderInputGroup('ÃƒÂ§ap / ebat', 'dia', opts.diameters, 'mm')}
                             <!-- Length Input for Form -->
                            <div style="display:flex; flex-direction:column; gap:0.5rem; min-width:140px;">
                                <div style="border:2px solid #94a3b8; border-radius:1.5rem; padding:0 1rem; height:56px; display:flex; align-items:center;">
                                    <input type="number" placeholder="boy" oninput="ProductLibraryModule.setFilter('len', this.value)" value="${filters.len || ''}" style="width:100%; border:none; background:transparent; font-size:1.1rem; color:#334155; font-weight:600; outline:none; text-align:center;">
                                    <span style="font-size:0.9rem; font-weight:600; color:#94a3b8; margin-left:0.25rem">mm</span>
                                </div>
                            </div>

                            ${extruderTab === 'ROD' ?
                    ProductLibraryModule.renderInputGroup('kabarcÃ„Â±k', 'surface', opts.surfaces || ['KabarcÃ„Â±ksÃ„Â±z', 'KabarcÃ„Â±klÃ„Â±'], '') :
                    ProductLibraryModule.renderInputGroup('kalÃ„Â±nlÃ„Â±k', 'thick', opts.thicknesses, 'mm')
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
                <button onclick="ProductLibraryModule.openOptionLibrary('${key}')" style="font-size:0.65rem; color:#3b82f6; text-align:center; background:none; border:none; cursor:pointer; font-weight:600">( + YÃƒâ€“NET ekle/sil )</button>
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
                    <span style="font-size:1.1rem; font-weight:600; color:${val ? '#1d4ed8' : '#334155'}">kabarcÃ„Â±k</span>
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
            p.category === 'EkstrÃƒÂ¼der' &&
            p.type === extruderTab &&
            p.specs.diameter == filters.dia &&
            p.specs.length == filters.len &&
            p.specs.color === filters.color &&
            (extruderTab === 'ROD' ? (p.specs.surface === filters.surface) : (p.specs.thickness == filters.thick))
        );

        const isFilled = filters.dia && filters.len && filters.color && (extruderTab === 'PIPE' ? filters.thick : filters.surface);
        const isDuplicate = !!exactMatchExp;
        const btnDisabled = !isFilled || isDuplicate;
        const btnText = isDuplicate ? 'Zaten Mevcut!' : 'ÃƒÅ“rÃƒÂ¼n Ekle +';
        const btnStyle = isDuplicate ? 'background:#f1f5f9; color:#94a3b8; border-color:#cbd5e1; cursor:not-allowed' : (isFilled ? 'background:#10b981; color:white; border-color:#059669; cursor:pointer' : 'background:white; color:#94a3b8; border-color:#cbd5e1; cursor:not-allowed');

        return `
            ${isDuplicate ? '<div style="font-size:0.8rem; color:#ef4444; font-weight:700">Ã¢Å¡Â Ã¯Â¸Â Bu kombinasyon zaten kayÃ„Â±tlÃ„Â±</div>' : ''}
            <button id="btnAddExtProduct" onclick="ProductLibraryModule.addExtruderProduct()" ${btnDisabled ? 'disabled' : ''} style="padding:1rem 3rem; border:2px solid; border-radius:1.5rem; font-size:1.1rem; font-weight:600; transition:all 0.2s; ${btnStyle}">
                ${btnText}
            </button>
        `;
    },

    renderProductList: () => {
        const { extruderTab, filters } = ProductLibraryModule.state;
        // Re-calculate filtered products locally
        const products = (DB.data.data.products || []).filter(p => p.category === 'EkstrÃƒÂ¼der' && p.type === extruderTab);

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
            ${filteredProducts.length === 0 ? '<div style="text-align:center; color:#cbd5e1; padding:3rem; font-size:1.2rem; font-weight:300">Bu kriterlerde ÃƒÂ¼rÃƒÂ¼n yok. Yeni ekleyebilirsiniz.</div>' : ''}
            
            ${filteredProducts.map(p => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:1.5rem 0; border-bottom:1px solid #64748b;">
                    <div style="font-size:1.2rem; color:#334155; font-weight:500">
                        ${ProductLibraryModule.formatProductTitle(p)}
                    </div>
                    <div style="display:flex; align-items:center; gap:3rem">
                        <div style="font-family:monospace; color:#64748b; font-size:1rem">ID; ${p.code || p.id.substring(0, 8)}</div>
                        <div style="display:flex; gap:0.5rem; align-items:center">
                            <button class="list-btn" onclick="ProductLibraryModule.editExtruderProduct('${p.id}')">dÃƒÂ¼zenle</button>
                            <span style="color:#cbd5e1">/</span>
                            <button class="list-btn" onclick="ProductLibraryModule.deleteExtruderProduct('${p.id}')">sil</button>
                        </div>
                        <input type="checkbox" style="width:1.5rem; height:1.5rem; border:2px solid #94a3b8; border-radius:0.4rem; cursor:pointer">
                        <span style="color:#64748b; font-size:0.9rem">seÃƒÂ§</span>
                    </div>
                </div>
            `).join('')}
         `;
    },

    toggleBubble: () => {
        // Deprecated //
    },

    formatProductTitle: (p) => {
        let text = `Ãƒâ€¡ap ${p.specs.diameter} mm / boy ${p.specs.length} mm`;
        if (p.specs.thickness) text += ` / ${p.specs.thickness} mm`;
        if (p.specs.surface) text += ` / ${p.specs.surface}`;
        // Backward comp for bubble boolean if needed
        else if (p.specs.bubble) text += ` / kabarcÃ„Â±klÃ„Â±`;

        text += ` / ${p.specs.color} renk`;
        return text;
    },

    manageOption: (key) => {
        // Renaming/Routing to new Modal System
        ProductLibraryModule.openOptionLibrary(key);
    },

    openOptionLibrary: (key) => {
        const mapping = {
            dia: { t: 'Ãƒâ€¡ap KÃƒÂ¼tÃƒÂ¼phanesi', i: 'circle-dashed', k: 'diameters' },
            thick: { t: 'KalÃ„Â±nlÃ„Â±k KÃƒÂ¼tÃƒÂ¼phanesi', i: 'layers', k: 'thicknesses' },
            color: { t: 'Renk KÃƒÂ¼tÃƒÂ¼phanesi', i: 'palette', k: 'colors' },
            surface: { t: 'YÃƒÂ¼zey Tipi KÃƒÂ¼tÃƒÂ¼phanesi', i: 'scan-line', k: 'surfaces' },
            consumableTypes: { t: 'Alt TÃƒÂ¼r KÃƒÂ¼tÃƒÂ¼phanesi', i: 'list', k: 'consumableTypes' },
            // Hardware Mappings
            hardwareShapes: { t: 'Ã…Âekil KÃƒÂ¼tÃƒÂ¼phanesi', i: 'shapes', k: 'hardwareShapes' },
            hardwareDias: { t: 'Ãƒâ€¡ap KÃƒÂ¼tÃƒÂ¼phanesi', i: 'circle-dashed', k: 'hardwareDias' },
            hardwareMaterials: { t: 'Malzeme KÃƒÂ¼tÃƒÂ¼phanesi', i: 'layers', k: 'hardwareMaterials' },
            hardwareLengths: { t: 'Boy KÃƒÂ¼tÃƒÂ¼phanesi', i: 'ruler', k: 'hardwareLengths' },
            // Aluminum Mappings
            aluAnodized: { t: 'Eloksal Renk KÃƒÂ¼tÃƒÂ¼phanesi', i: 'palette', k: 'aluAnodized' },
            aluPainted: { t: 'Boya Renk KÃƒÂ¼tÃƒÂ¼phanesi', i: 'palette', k: 'aluPainted' },
            aluLengths: { t: 'Profil Boyu KÃƒÂ¼tÃƒÂ¼phanesi', i: 'ruler', k: 'aluLengths' }
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
                        <input id="newLibItemInput" placeholder="Yeni deÃ„Å¸er..." onkeydown="if(event.key==='Enter') ProductLibraryModule.addLibraryItem('${key}')" style="flex:1; padding:0.75rem 1rem; border:2px solid #e2e8f0; border-radius:0.75rem; font-weight:600; color:#475569; outline:none; font-size:0.95rem; transition:border-color 0.2s" onfocus="this.style.borderColor='#a78bfa'" onblur="this.style.borderColor='#e2e8f0'">
                        <button onclick="ProductLibraryModule.addLibraryItem('${key}')" style="background:#8b5cf6; color:white; border:none; padding:0 1.5rem; border-radius:0.75rem; font-weight:700; cursor:pointer; box-shadow:0 4px 6px -1px rgba(139, 92, 246, 0.4); transition:transform 0.1s" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">Ekle</button>
                    </div>

                    <!-- List -->
                    <div style="max-height:350px; overflow-y:auto; display:flex; flex-direction:column; gap:0.6rem; padding-right:0.5rem">
                        ${items.length === 0 ? '<div style="text-align:center; color:#cbd5e1; padding:1.5rem; font-style:italic">Liste boÃ…Å¸.</div>' : ''}
                        
                        ${items.map(item => `
                            <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:0.8rem 1rem; border-radius:0.75rem; border:1px solid #f1f5f9; group">
                                <div style="display:flex; align-items:center; gap:0.75rem">
                                    ${key === 'color' ? `<div style="width:18px; height:18px; border-radius:50%; border:1px solid #cbd5e1; background:${ProductLibraryModule.getColorCode(item)}"></div>` : '<i data-lucide="hash" width="14" style="color:#cbd5e1"></i>'}
                                    <span style="font-weight:700; color:#475569; font-size:0.95rem;">${item}</span>
                                </div>
                                <div style="display:flex; gap:0.25rem">
                                    <button title="DÃƒÂ¼zenle" onclick="ProductLibraryModule.editLibraryItem('${key}', '${item}')" style="background:none; border:none; color:#cbd5e1; cursor:pointer; padding:0.3rem" onmouseover="this.style.color='#64748b'" onmouseout="this.style.color='#cbd5e1'"><i data-lucide="pencil" width="16"></i></button>
                                    <button title="Sil" onclick="ProductLibraryModule.deleteLibraryItem('${key}', '${item}')" style="background:none; border:none; color:#cbd5e1; cursor:pointer; padding:0.3rem" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#cbd5e1'"><i data-lucide="trash-2" width="16"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="margin-top:1.5rem; text-align:center; font-size:0.75rem; color:#cbd5e1; font-weight:500">
                        DeÃ„Å¸iÃ…Å¸iklikler anÃ„Â±nda kaydedilir.
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (window.lucide) window.lucide.createIcons();
        document.getElementById('newLibItemInput').focus();
    },

    getColorCode: (c) => {
        const map = { 'Siyah': '#000', 'Beyaz': '#fff', 'Ã…Âeffaf': 'transparent', 'Antrasit': '#374151', 'FÃƒÂ¼me': '#525252', 'Gri': '#9ca3af', 'KÃ„Â±rmÃ„Â±zÃ„Â±': '#ef4444', 'SarÃ„Â±': '#facc15', 'Mavi': '#3b82f6' };
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
            if (isNaN(Number(val))) return alert('LÃƒÂ¼tfen sayÃ„Â±sal bir deÃ„Å¸er giriniz.');
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
            alert('Bu deÃ„Å¸er zaten listede var.');
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
        if (!confirm('Silmek istediÃ„Å¸inize emin misiniz?')) return;

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

        const newVal = prompt("Yeni deÃ„Å¸eri giriniz:", oldVal);
        if (!newVal || newVal == oldVal) return;

        let processedVal = newVal.trim();

        if (key === 'thick' || key === 'hardwareDias' || key === 'hardwareLengths') {
            if (isNaN(Number(processedVal))) return alert('LÃƒÂ¼tfen sayÃ„Â±sal bir deÃ„Å¸er giriniz.');
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
            hardwareShapes: ['HavÃ…Å¸a BaÃ…Å¸', 'Anahtar BaÃ…Å¸', 'Ã„Â°nbus', 'HavÃ…Å¸a BaÃ…Å¸ Ã„Â°nbus', 'Gijon Saplama', 'Somun', 'Pul', 'Kelebek Somun', 'AkÃ„Â±llÃ„Â± Vida'],
            hardwareDias: ['M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12', 'M14', 'M16', 'M18', 'M20', '3.9', '4.2', '4.8'],
            hardwareMaterials: ['Siyah', 'Galvaniz', 'Paslanmaz', 'Ã„Â°nox', 'PirinÃƒÂ§']
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
                    <h1 style="font-size:2.5rem; color:#1e293b; letter-spacing:-0.03em; font-weight:300;">hÃ„Â±rdavat & <span style="font-weight:700">baÃ„Å¸lantÃ„Â± elemanlarÃ„Â±</span></h1>
                </div>

                <!-- ACTIONS ROW -->
                <div style="display:flex; flex-wrap:wrap; gap:1rem; align-items:center; margin-bottom:3rem; justify-content:space-between">
                     <!-- SEARCH CAPSULES -->
                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; flex:1; justify-content:center">
                         ${ProductLibraryModule.renderHardwareCapsule('Ã…Å¸ekil ile ara', 'shape', opts.hardwareShapes)}
                         ${ProductLibraryModule.renderHardwareCapsule('ÃƒÂ§ap ile ara', 'dia', opts.hardwareDias)}

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
                `<button onclick="ProductLibraryModule.toggleHardwareForm()" class="btn-primary" style="background:#ef4444; padding:0.8rem 2rem; border-radius:1rem">Ã„Â°ptal</button>`
                :
                `<button onclick="ProductLibraryModule.toggleHardwareForm()" class="btn-primary" style="padding:0.8rem 2rem; border-radius:1rem; font-size:1rem; box-shadow:0 4px 10px rgba(0,0,0,0.05)">ÃƒÅ“rÃƒÂ¼n ekle +</button>`
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
                         <h3 style="font-size:1.5rem; color:#334155; margin-bottom:2rem; font-weight:700">Yeni HÃ„Â±rdavat/CÃ„Â±vata Ekle</h3>

                         <div style="display:flex; gap:2rem; flex-wrap:wrap; align-items:flex-end">
                            ${ProductLibraryModule.renderHardwareInputGroup('civata Ã…Å¸ekli', 'shape', opts.hardwareShapes, '')}
                            ${ProductLibraryModule.renderHardwareInputGroup('ÃƒÂ§ap / ebat', 'dia', opts.hardwareDias, '')}

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
                                    ÃƒÅ“RÃƒÅ“NÃƒÅ“ EKLE +
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
                 <button onclick="ProductLibraryModule.openOptionLibrary('${key === 'shape' ? 'hardwareShapes' : (key === 'dia' ? 'hardwareDias' : 'hardwareMaterials')}')" style="font-size:0.65rem; color:#3b82f6; text-align:center; background:none; border:none; cursor:pointer; font-weight:600">( + YÃƒâ€“NET ekle/sil )</button>
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
        if (products.length === 0) return '<div style="text-align:center; color:#cbd5e1; padding:3rem; font-size:1.2rem; font-weight:300">Bu kriterlerde ÃƒÂ¼rÃƒÂ¼n yok. Yeni ekleyebilirsiniz.</div>';

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
                        <button class="list-btn" onclick="ProductLibraryModule.editHardwareProduct('${p.id}')">dÃƒÂ¼zenle</button>
                        <span style="color:#cbd5e1">/</span>
                        <button class="list-btn" onclick="ProductLibraryModule.deleteHardwareProduct('${p.id}')">sil</button>
                    </div>
                    <div style="display:flex; align-items:center; gap:0.5rem; border-left:1px solid #e2e8f0; padding-left:1rem; margin-left:1rem">
                        <input type="checkbox" style="width:1.5rem; height:1.5rem; border:2px solid #94a3b8; border-radius:0.4rem; cursor:pointer">
                        <span style="color:#64748b; font-size:0.9rem">seÃƒÂ§</span>
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
                    <button onclick="ProductLibraryModule.toggleConsumableForm()" class="btn-primary" style="padding:0.8rem 1.4rem; border-radius:0.9rem;">${showForm ? 'Vazgec' : 'Islem ekle +'}</button>
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
                                    <tr style="border-bottom:1px solid #f1f5f9; ${ProductLibraryModule.state.consumableSelectedId === p.id ? 'background:#ffe4e6;' : ''}">
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
                    <button onclick="ProductLibraryModule.toggleBoxForm()" class="btn-primary" style="padding:0.8rem 1.4rem; border-radius:0.9rem;">${showForm ? 'Vazgec' : 'Islem ekle +'}</button>
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
                                    <tr style="border-bottom:1px solid #f1f5f9; ${ProductLibraryModule.state.boxSelectedId === p.id ? 'background:#ffe4e6;' : ''}">
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
            alert("LÃƒÂ¼tfen Ã…Âekil, Ãƒâ€¡ap ve Malzeme seÃƒÂ§iniz.");
            return;
        }

        // Auto Generate ID Logic
        // Map Shape
        const shapeMap = {
            'HavÃ…Å¸a BaÃ…Å¸': 'HB', 'Anahtar BaÃ…Å¸': 'AB', 'Ã„Â°nbus': 'INB', 'HavÃ…Å¸a BaÃ…Å¸ Ã„Â°nbus': 'HBI',
            'Gijon Saplama': 'GSP', 'Somun': 'SOM', 'Pul': 'PUL', 'Kelebek Somun': 'KLB', 'AkÃ„Â±llÃ„Â± Vida': 'AKL'
        };
        const matMap = { 'Siyah': 'SYH', 'Galvaniz': 'GLV', 'Paslanmaz': 'PSL', 'Ã„Â°nox': 'INOX', 'PirinÃƒÂ§': 'PRC' };

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
            type: 'CÃ„Â±vata',
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
        if (confirm("Bu ÃƒÂ¼rÃƒÂ¼nÃƒÂ¼ silmek istediÃ„Å¸inize emin misiniz?")) {
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
            alert("ÃƒÅ“rÃƒÂ¼n bilgileri forma yÃƒÂ¼klendi. DÃƒÂ¼zenleyip 'ÃƒÅ“rÃƒÂ¼n Ekle' diyerek yeni bir kayÃ„Â±t oluÃ…Å¸turabilirsiniz.");
        }, 50);
    },

    addExtruderProduct: async () => {
        const { extruderTab, filters } = ProductLibraryModule.state;

        // Validate required fields based on Tab
        if (!filters.dia || !filters.len || !filters.color) {
            alert("LÃƒÂ¼tfen ÃƒÂ§ap, boy ve renk seÃƒÂ§iniz.");
            return;
        }
        if (extruderTab === 'PIPE' && !filters.thick) {
            alert("LÃƒÂ¼tfen kalÃ„Â±nlÃ„Â±k seÃƒÂ§iniz.");
            return;
        }
        if (extruderTab === 'ROD' && !filters.surface) {
            alert("LÃƒÂ¼tfen yÃƒÂ¼zey tipi seÃƒÂ§iniz.");
            return;
        }

        // Generate ID / Code
        const typeCode = extruderTab === 'ROD' ? 'CB' : 'BR'; // CB: Ãƒâ€¡ubuk, BR: Boru
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
            category: 'EkstrÃƒÂ¼der',
            type: extruderTab,
            name: `${filters.dia}mm ${extruderTab === 'ROD' ? 'Ãƒâ€¡ubuk' : 'Boru'}`,
            code: code,
            specs: {
                diameter: filters.dia,
                length: filters.len,
                color: filters.color,
                thickness: filters.thick || null,
                surface: filters.surface || null,
                // bubble: filters.surface === 'KabarcÃ„Â±klÃ„Â±' // Keep backward compat logic if needed - REMOVED
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
        if (confirm("Bu ÃƒÂ¼rÃƒÂ¼nÃƒÂ¼ silmek istediÃ„Å¸inize emin misiniz?")) {
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
            surface: p.specs.surface || (p.specs.bubble ? 'KabarcÃ„Â±klÃ„Â±' : 'KabarcÃ„Â±ksÃ„Â±z')
        };
        // We should probably delete the old one if they click "Update" but we only have "Add" button right now.
        // For Prototype, let's just populate the fields so they can add a NEW similar one or delete the old one.
        // Open Form
        ProductLibraryModule.state.isFormVisible = true;
        UI.renderCurrentPage();

        setTimeout(() => {
            const el = document.getElementById('extFormSection');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            alert("ÃƒÅ“rÃƒÂ¼n ÃƒÂ¶zellikleri forma aktarÃ„Â±ldÃ„Â±. DÃƒÂ¼zenleyip 'ÃƒÅ“rÃƒÂ¼n Ekle' diyerek yeni bir kayÃ„Â±t oluÃ…Å¸turabilirsiniz.");
        }, 100);
    }
};









