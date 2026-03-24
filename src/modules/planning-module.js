const PlanningModule = {
    state: {
        workspaceView: 'menu',
        stockDraftFormOpen: false,
        stockDraftEditingId: '',
        stockDraftSourceKind: 'MODEL',
        stockDraftItems: [],
        stockDraftVariantId: '',
        stockDraftComponentId: '',
        stockDraftSemiFinishedId: '',
        stockDraftQty: '10',
        stockDraftDueDate: '',
        stockDraftPriority: 'NORMAL',
        stockDraftNote: ''
    },

    blueprints: {
        'sales-demand': {
            title: 'planlama / siparisten gelen talepler',
            intro: 'Satis tarafinda musteriden onay almis siparisler planlama havuzuna burada dusecek.',
            sections: [
                { title: 'Temel islev', items: ['Onayli siparisleri urun, varyant, adet ve termin bilgisi ile listele.', 'Siparis kaynakli talepleri stok taleplerinden ayir ve onceliklendir.', 'Planlamacinin hangi kaydi uretime cevirecegine karar verecegi ilk ekran olsun.'] },
                { title: 'Ekranda olacak alanlar', items: ['Siparis no, musteri, urun, varyant, adet, termin ve oncelik.', 'Kaynak tipi, plan notu ve mevcut hazir stok bilgisi.', 'Satir aksiyonlari: goruntule, planla, is emrine cevir, beklet.'] },
                { title: 'Kayit sonrasi beklenti', items: ['Is emrine cevirdiginde ilgili montaj karti ve urun varyanti ile uretim akisi baslar.', 'Bekletilen satir planlama havuzunda gorunmeye devam eder.', 'Hazir stok yeterliyse ileride sevkiyat tarafina yonlenebilecek altyapi korunur.'] }
            ]
        },
        'capacity-load': {
            title: 'planlama / kapasite ve yuk durumu',
            intro: 'Atolyelerin ve kritik istasyonlarin mevcut plan yukunu gormek icin kullanilacak karar destek ekranidir.',
            sections: [
                { title: 'Temel islev', items: ['Istasyon bazli plan yukunu gunluk veya haftalik izle.', 'Darbogaz olabilecek birimleri erken fark et.', 'Planlama kararlarini kapasiteye gore dengele.'] },
                { title: 'Ekranda olacak alanlar', items: ['Istasyon, planlanan is adedi, toplam miktar, hedef gun ve doluluk orani.', 'Bekleyen is emirleri, acil siparis sayisi ve notlar.', 'Gerektiginde filtreler: istasyon, tarih araligi, kaynak tipi ve oncelik.'] },
                { title: 'Kayit sonrasi beklenti', items: ['Planlamaci hangi talebin once isleme alinacagini daha saglikli belirler.', 'Kapasitesi dolu olan birimlerde tarih kaydirma veya oncelik degisikligi yapilabilir.', 'Ileride otomatik yuk dengeleme ve kapasite uyarilarinin temeli olur.'] }
            ]
        }
    },

    escapeHtml: (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;'),

    ensureData: () => {
        if (!Array.isArray(DB.data?.data?.planningDemands)) DB.data.data.planningDemands = [];
        if (!Array.isArray(DB.data?.data?.catalogProductVariants)) DB.data.data.catalogProductVariants = [];
        if (!Array.isArray(DB.data?.data?.partComponentCards)) DB.data.data.partComponentCards = [];
        if (!Array.isArray(DB.data?.data?.semiFinishedCards)) DB.data.data.semiFinishedCards = [];
        if (!Array.isArray(DB.data?.data?.montageCards)) DB.data.data.montageCards = [];
        if (!Array.isArray(DB.data?.data?.workOrders)) DB.data.data.workOrders = [];
    },

    getPriorityValue: (value) => {
        const raw = String(value || 'NORMAL').trim().toUpperCase();
        return ['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(raw) ? raw : 'NORMAL';
    },

    getStatusLabel: (value) => {
        const raw = String(value || 'OPEN').trim().toUpperCase();
        if (raw === 'RELEASED') return 'Is Emrine Donustu';
        if (raw === 'CANCELLED') return 'Iptal';
        return 'Bekliyor';
    },

    getStatusStyle: (value) => {
        const raw = String(value || 'OPEN').trim().toUpperCase();
        if (raw === 'RELEASED') return 'background:#ecfdf5; color:#047857; border:1px solid #a7f3d0;';
        if (raw === 'CANCELLED') return 'background:#f8fafc; color:#64748b; border:1px solid #cbd5e1;';
        return 'background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;';
    },

    resetStockDraft: () => {
        PlanningModule.state.stockDraftFormOpen = false;
        PlanningModule.state.stockDraftEditingId = '';
        PlanningModule.state.stockDraftSourceKind = 'MODEL';
        PlanningModule.state.stockDraftItems = [];
        PlanningModule.state.stockDraftVariantId = '';
        PlanningModule.state.stockDraftComponentId = '';
        PlanningModule.state.stockDraftSemiFinishedId = '';
        PlanningModule.state.stockDraftQty = '10';
        PlanningModule.state.stockDraftPriority = 'NORMAL';
        PlanningModule.state.stockDraftNote = '';
        const d = new Date();
        d.setDate(d.getDate() + 3);
        PlanningModule.state.stockDraftDueDate = d.toISOString().slice(0, 10);
    },

    getDemands: () => {
        PlanningModule.ensureData();
        return DB.data.data.planningDemands;
    },

    getVariants: () => {
        PlanningModule.ensureData();
        return (DB.data.data.catalogProductVariants || []).slice().sort((a, b) => {
            const ga = String(a?.productGroup || '');
            const gb = String(b?.productGroup || '');
            if (ga !== gb) return ga.localeCompare(gb, 'tr');
            const na = String(a?.productName || '');
            const nb = String(b?.productName || '');
            if (na !== nb) return na.localeCompare(nb, 'tr');
            return String(a?.variantCode || '').localeCompare(String(b?.variantCode || ''), 'tr');
        });
    },

    getComponents: () => {
        PlanningModule.ensureData();
        return (DB.data.data.partComponentCards || [])
            .filter((row) => Array.isArray(row?.routes) && row.routes.length > 0)
            .slice()
            .sort((a, b) => {
                const ga = String(a?.group || '');
                const gb = String(b?.group || '');
                if (ga !== gb) return ga.localeCompare(gb, 'tr');
                const na = String(a?.name || '');
                const nb = String(b?.name || '');
                if (na !== nb) return na.localeCompare(nb, 'tr');
                return String(a?.code || '').localeCompare(String(b?.code || ''), 'tr');
            });
    },

    getSemiFinished: () => {
        PlanningModule.ensureData();
        return (DB.data.data.semiFinishedCards || [])
            .filter((row) => Array.isArray(row?.routes) && row.routes.length > 0)
            .slice()
            .sort((a, b) => {
                const ga = String(a?.group || '');
                const gb = String(b?.group || '');
                if (ga !== gb) return ga.localeCompare(gb, 'tr');
                const na = String(a?.name || '');
                const nb = String(b?.name || '');
                if (na !== nb) return na.localeCompare(nb, 'tr');
                return String(a?.code || '').localeCompare(String(b?.code || ''), 'tr');
            });
    },

    findVariantById: (variantId) => PlanningModule.getVariants().find((row) => String(row?.id || '') === String(variantId || '')) || null,
    findComponentById: (componentId) => PlanningModule.getComponents().find((row) => String(row?.id || '') === String(componentId || '')) || null,
    findSemiFinishedById: (semiId) => PlanningModule.getSemiFinished().find((row) => String(row?.id || '') === String(semiId || '')) || null,

    normalizeDraftItemKind: (kind) => {
        const raw = String(kind || '').trim().toUpperCase();
        return ['MODEL', 'COMPONENT', 'SEMI'].includes(raw) ? raw : 'MODEL';
    },

    createDraftItem: (kind, refId, qty = 1) => {
        const safeKind = PlanningModule.normalizeDraftItemKind(kind);
        const id = String(refId || '').trim();
        const parsedQty = Number(qty || 0);
        return {
            id: crypto.randomUUID(),
            itemType: safeKind,
            variantId: safeKind === 'MODEL' ? id : '',
            componentId: safeKind === 'COMPONENT' ? id : '',
            semiFinishedId: safeKind === 'SEMI' ? id : '',
            qty: Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1
        };
    },

    getDraftItemRefId: (item) => {
        if (!item || typeof item !== 'object') return '';
        const kind = PlanningModule.normalizeDraftItemKind(item.itemType);
        if (kind === 'COMPONENT') return String(item.componentId || '');
        if (kind === 'SEMI') return String(item.semiFinishedId || '');
        return String(item.variantId || '');
    },

    upsertStockDraftItem: (kind, refId) => {
        const safeKind = PlanningModule.normalizeDraftItemKind(kind);
        const id = String(refId || '').trim();
        if (!id) return;
        if (!Array.isArray(PlanningModule.state.stockDraftItems)) PlanningModule.state.stockDraftItems = [];
        const existing = PlanningModule.state.stockDraftItems.find((row) =>
            PlanningModule.normalizeDraftItemKind(row?.itemType) === safeKind
            && PlanningModule.getDraftItemRefId(row) === id
        );
        if (existing) {
            existing.qty = Number(existing.qty || 0) + 1;
        } else {
            PlanningModule.state.stockDraftItems.push(PlanningModule.createDraftItem(safeKind, id, 1));
        }
    },

    removeStockDraftItem: (draftItemId) => {
        const targetId = String(draftItemId || '').trim();
        if (!targetId) return;
        PlanningModule.state.stockDraftItems = (Array.isArray(PlanningModule.state.stockDraftItems) ? PlanningModule.state.stockDraftItems : [])
            .filter((row) => String(row?.id || '') !== targetId);
        UI.renderCurrentPage();
    },

    setStockDraftItemQty: (draftItemId, value) => {
        const targetId = String(draftItemId || '').trim();
        if (!targetId) return;
        const row = (Array.isArray(PlanningModule.state.stockDraftItems) ? PlanningModule.state.stockDraftItems : [])
            .find((item) => String(item?.id || '') === targetId);
        if (!row) return;
        const num = Number(value || 0);
        row.qty = Number.isFinite(num) && num > 0 ? num : 1;
        UI.renderCurrentPage();
    },

    getResolvedStockDraftItems: () => {
        const rows = Array.isArray(PlanningModule.state.stockDraftItems) ? PlanningModule.state.stockDraftItems : [];
        return rows.map((item) => {
            const kind = PlanningModule.normalizeDraftItemKind(item?.itemType);
            const qty = Number(item?.qty || 0) > 0 ? Number(item.qty) : 1;
            if (kind === 'COMPONENT') {
                const row = PlanningModule.findComponentById(item?.componentId || '');
                return {
                    id: String(item?.id || ''),
                    itemType: 'COMPONENT',
                    qty,
                    valid: !!row,
                    title: String(row?.name || ''),
                    code: String(row?.code || ''),
                    info: String(row?.group || ''),
                    refId: String(item?.componentId || '')
                };
            }
            if (kind === 'SEMI') {
                const row = PlanningModule.findSemiFinishedById(item?.semiFinishedId || '');
                return {
                    id: String(item?.id || ''),
                    itemType: 'SEMI',
                    qty,
                    valid: !!row,
                    title: String(row?.name || ''),
                    code: String(row?.code || ''),
                    info: String(row?.group || ''),
                    refId: String(item?.semiFinishedId || '')
                };
            }
            const row = PlanningModule.findVariantById(item?.variantId || '');
            const montage = PlanningModule.findMontageCardForVariant(row);
            return {
                id: String(item?.id || ''),
                itemType: 'MODEL',
                qty,
                valid: !!row && !!montage?.id,
                title: String(row?.productName || ''),
                code: String(row?.variantCode || ''),
                info: String(montage?.productCode || montage?.cardCode || ''),
                refId: String(item?.variantId || '')
            };
        });
    },

    findMontageCardForVariant: (variant) => {
        if (!variant) return null;
        const montageCards = Array.isArray(DB.data?.data?.montageCards) ? DB.data.data.montageCards : [];
        const ref = variant?.montageCard && typeof variant.montageCard === 'object' ? variant.montageCard : null;
        const refId = String(ref?.id || '').trim();
        if (refId) {
            const byId = montageCards.find((row) => String(row?.id || '') === refId);
            if (byId) return byId;
        }
        const refCode = String(ref?.cardCode || '').trim().toUpperCase();
        if (!refCode) return null;
        return montageCards.find((row) => String(row?.cardCode || '').trim().toUpperCase() === refCode) || null;
    },

    getNextDemandCode: () => {
        const max = PlanningModule.getDemands().reduce((acc, row) => {
            const match = String(row?.demandCode || '').trim().toUpperCase().match(/^PLN-(\d{6})$/);
            if (!match) return acc;
            return Math.max(acc, Number(match[1]));
        }, 0);
        return `PLN-${String(max + 1).padStart(6, '0')}`;
    },

    openWorkspace: (viewId) => {
        PlanningModule.state.workspaceView = String(viewId || 'menu');
        if (PlanningModule.state.workspaceView !== 'stock-production') {
            PlanningModule.state.stockDraftFormOpen = false;
        }
        if (PlanningModule.state.workspaceView === 'stock-production' && !PlanningModule.state.stockDraftDueDate) {
            PlanningModule.resetStockDraft();
        }
        UI.renderCurrentPage();
    },

    openItemPicker: (kind) => {
        const raw = String(kind || '').trim().toLowerCase();
        const normalized = raw === 'component' ? 'component' : (raw === 'semi' ? 'semi' : 'model');
        PlanningModule.state.stockDraftFormOpen = true;
        PlanningModule.state.stockDraftSourceKind = normalized === 'component' ? 'COMPONENT' : (normalized === 'semi' ? 'SEMI' : 'MODEL');
        ProductLibraryModule.openPlanningPicker(normalized);
    },

    applyPickedModel: (id) => {
        PlanningModule.state.stockDraftFormOpen = true;
        PlanningModule.state.stockDraftSourceKind = 'MODEL';
        PlanningModule.upsertStockDraftItem('MODEL', id);
        PlanningModule.state.stockDraftVariantId = String(id || '');
        PlanningModule.state.stockDraftComponentId = '';
        PlanningModule.state.stockDraftSemiFinishedId = '';
        Router.navigate('planlama', { fromBack: true });
        PlanningModule.openWorkspace('stock-production');
    },

    applyPickedComponent: (id) => {
        PlanningModule.state.stockDraftFormOpen = true;
        PlanningModule.state.stockDraftSourceKind = 'COMPONENT';
        PlanningModule.upsertStockDraftItem('COMPONENT', id);
        PlanningModule.state.stockDraftComponentId = String(id || '');
        PlanningModule.state.stockDraftVariantId = '';
        PlanningModule.state.stockDraftSemiFinishedId = '';
        Router.navigate('planlama', { fromBack: true });
        PlanningModule.openWorkspace('stock-production');
    },

    applyPickedSemiFinished: (id) => {
        PlanningModule.state.stockDraftFormOpen = true;
        PlanningModule.state.stockDraftSourceKind = 'SEMI';
        PlanningModule.upsertStockDraftItem('SEMI', id);
        PlanningModule.state.stockDraftSemiFinishedId = String(id || '');
        PlanningModule.state.stockDraftVariantId = '';
        PlanningModule.state.stockDraftComponentId = '';
        Router.navigate('planlama', { fromBack: true });
        PlanningModule.openWorkspace('stock-production');
    },

    setStockDraftField: (field, value) => {
        if (field === 'stockDraftSourceKind') {
            const nextKind = String(value || 'MODEL').toUpperCase();
            PlanningModule.state.stockDraftSourceKind = ['MODEL', 'COMPONENT', 'SEMI'].includes(nextKind) ? nextKind : 'MODEL';
        }
        if (field === 'stockDraftVariantId') PlanningModule.state.stockDraftVariantId = String(value || '');
        if (field === 'stockDraftComponentId') PlanningModule.state.stockDraftComponentId = String(value || '');
        if (field === 'stockDraftSemiFinishedId') PlanningModule.state.stockDraftSemiFinishedId = String(value || '');
        if (field === 'stockDraftQty') PlanningModule.state.stockDraftQty = String(value || '');
        if (field === 'stockDraftDueDate') PlanningModule.state.stockDraftDueDate = String(value || '');
        if (field === 'stockDraftPriority') PlanningModule.state.stockDraftPriority = PlanningModule.getPriorityValue(value);
        if (field === 'stockDraftNote') PlanningModule.state.stockDraftNote = String(value ?? '');
        UI.renderCurrentPage();
    },

    startDemandEdit: (demandId) => {
        const row = PlanningModule.getDemands().find((item) => String(item?.id || '') === String(demandId || ''));
        if (!row) return;
        if (String(row?.status || 'OPEN').toUpperCase() !== 'OPEN') return alert('Sadece bekleyen talepler duzenlenebilir.');
        PlanningModule.state.stockDraftFormOpen = true;
        PlanningModule.state.stockDraftEditingId = String(row.id || '');
        const legacyType = PlanningModule.normalizeDraftItemKind(row.itemType || 'MODEL');
        const draftItems = Array.isArray(row?.items) && row.items.length
            ? row.items.map((item) => ({
                id: String(item?.id || crypto.randomUUID()),
                itemType: PlanningModule.normalizeDraftItemKind(item?.itemType || 'MODEL'),
                variantId: String(item?.variantId || ''),
                componentId: String(item?.componentId || ''),
                semiFinishedId: String(item?.semiFinishedId || ''),
                qty: Number(item?.qty || 0) > 0 ? Number(item.qty) : 1
            }))
            : [PlanningModule.createDraftItem(
                legacyType,
                legacyType === 'COMPONENT' ? String(row.componentId || '') : (legacyType === 'SEMI' ? String(row.semiFinishedId || '') : String(row.variantId || '')),
                Number(row.qty || 1)
            )];
        PlanningModule.state.stockDraftItems = draftItems.filter((item) => PlanningModule.getDraftItemRefId(item));
        const firstType = PlanningModule.state.stockDraftItems[0]?.itemType || legacyType;
        PlanningModule.state.stockDraftSourceKind = PlanningModule.normalizeDraftItemKind(firstType);
        PlanningModule.state.stockDraftVariantId = String(row.variantId || '');
        PlanningModule.state.stockDraftComponentId = String(row.componentId || '');
        PlanningModule.state.stockDraftSemiFinishedId = String(row.semiFinishedId || '');
        PlanningModule.state.stockDraftQty = String(PlanningModule.state.stockDraftItems[0]?.qty || row.qty || '10');
        PlanningModule.state.stockDraftDueDate = String(row.dueDate || '');
        PlanningModule.state.stockDraftPriority = PlanningModule.getPriorityValue(row.priority || 'NORMAL');
        PlanningModule.state.stockDraftNote = String(row.note || '');
        PlanningModule.openWorkspace('stock-production');
    },

    openStockDemandForm: (asNew = false) => {
        if (asNew) {
            PlanningModule.resetStockDraft();
        } else if (!PlanningModule.state.stockDraftDueDate) {
            PlanningModule.resetStockDraft();
        }
        PlanningModule.state.stockDraftFormOpen = true;
        UI.renderCurrentPage();
    },

    cancelStockDemandForm: () => {
        PlanningModule.resetStockDraft();
        PlanningModule.state.workspaceView = 'stock-production';
        UI.renderCurrentPage();
    },

    getStockDraftDemandCode: () => {
        const editingId = String(PlanningModule.state.stockDraftEditingId || '').trim();
        if (!editingId) return PlanningModule.getNextDemandCode();
        const row = PlanningModule.getDemands().find((item) => String(item?.id || '') === editingId);
        return String(row?.demandCode || PlanningModule.getNextDemandCode());
    },

    clearStockDraftSelection: () => {
        PlanningModule.state.stockDraftItems = [];
        PlanningModule.state.stockDraftVariantId = '';
        PlanningModule.state.stockDraftComponentId = '';
        PlanningModule.state.stockDraftSemiFinishedId = '';
        UI.renderCurrentPage();
    },

    getStockDraftSelectedSource: () => {
        const first = PlanningModule.getResolvedStockDraftItems()[0] || null;
        if (!first) return { kind: 'MODEL', row: null, title: '', code: '', info: '' };
        return {
            kind: first.itemType || 'MODEL',
            row: first.valid ? first : null,
            title: String(first.title || ''),
            code: String(first.code || ''),
            info: String(first.info || '')
        };
    },

    buildDemandItemFromDraftItem: (item) => {
        const kind = PlanningModule.normalizeDraftItemKind(item?.itemType);
        const qty = Number(item?.qty || 0);
        if (!Number.isFinite(qty) || qty <= 0) return null;
        if (kind === 'COMPONENT') {
            const component = PlanningModule.findComponentById(item?.componentId || '');
            if (!component) return null;
            return {
                id: String(item?.id || crypto.randomUUID()),
                itemType: 'COMPONENT',
                qty,
                variantId: '',
                componentId: String(component.id || ''),
                semiFinishedId: '',
                familyId: '',
                variantCode: '',
                componentCode: String(component.code || ''),
                semiFinishedCode: '',
                productGroup: String(component.group || ''),
                productName: String(component.name || ''),
                productCode: String(component.code || ''),
                montageCardId: '',
                montageCardCode: ''
            };
        }
        if (kind === 'SEMI') {
            const semi = PlanningModule.findSemiFinishedById(item?.semiFinishedId || '');
            if (!semi) return null;
            return {
                id: String(item?.id || crypto.randomUUID()),
                itemType: 'SEMI',
                qty,
                variantId: '',
                componentId: '',
                semiFinishedId: String(semi.id || ''),
                familyId: '',
                variantCode: '',
                componentCode: '',
                semiFinishedCode: String(semi.code || ''),
                productGroup: String(semi.group || ''),
                productName: String(semi.name || ''),
                productCode: String(semi.code || ''),
                montageCardId: '',
                montageCardCode: ''
            };
        }
        const variant = PlanningModule.findVariantById(item?.variantId || '');
        const montage = PlanningModule.findMontageCardForVariant(variant);
        if (!variant || !montage?.id) return null;
        return {
            id: String(item?.id || crypto.randomUUID()),
            itemType: 'MODEL',
            qty,
            variantId: String(variant.id || ''),
            componentId: '',
            semiFinishedId: '',
            familyId: String(variant.familyId || ''),
            variantCode: String(variant.variantCode || ''),
            componentCode: '',
            semiFinishedCode: '',
            productGroup: String(variant.productGroup || ''),
            productName: String(variant.productName || ''),
            productCode: String(montage.productCode || montage.cardCode || ''),
            montageCardId: String(montage.id || ''),
            montageCardCode: String(montage.cardCode || '')
        };
    },

    saveStockDemand: async (releaseNow = false) => {
        PlanningModule.ensureData();
        const draftItems = Array.isArray(PlanningModule.state.stockDraftItems) ? PlanningModule.state.stockDraftItems : [];
        if (!draftItems.length) return alert('Lutfen en az bir urun ekleyiniz.');
        const demandItems = draftItems
            .map((item) => PlanningModule.buildDemandItemFromDraftItem(item))
            .filter(Boolean);
        if (demandItems.length !== draftItems.length) {
            return alert('Eklenen urunlerden biri gecersiz veya silinmis. Lutfen listeyi kontrol ediniz.');
        }
        const totalQty = demandItems.reduce((sum, row) => sum + Number(row?.qty || 0), 0);
        if (!Number.isFinite(totalQty) || totalQty <= 0) return alert('Toplam uretim adedi 0 dan buyuk olmali.');

        const all = PlanningModule.getDemands();
        const now = new Date().toISOString();
        const editingId = String(PlanningModule.state.stockDraftEditingId || '').trim();
        let demand = editingId ? all.find((row) => String(row?.id || '') === editingId) : null;
        if (demand && String(demand?.status || 'OPEN').toUpperCase() !== 'OPEN') return alert('Sadece bekleyen talepler guncellenebilir.');

        if (!demand) {
            demand = {
                id: crypto.randomUUID(),
                demandCode: PlanningModule.getNextDemandCode(),
                sourceType: 'STOCK',
                sourceLabel: 'Stok Uretimi',
                created_at: now
            };
            all.push(demand);
        }

        const first = demandItems[0] || {};
        const uniqueKinds = Array.from(new Set(demandItems.map((item) => PlanningModule.normalizeDraftItemKind(item.itemType))));
        demand.items = demandItems.map((item) => ({ ...item }));
        demand.itemType = demandItems.length > 1
            ? (uniqueKinds.length === 1 ? uniqueKinds[0] : 'MIXED')
            : String(first.itemType || 'MODEL');
        demand.variantId = String(first.variantId || '');
        demand.componentId = String(first.componentId || '');
        demand.semiFinishedId = String(first.semiFinishedId || '');
        demand.familyId = String(first.familyId || '');
        demand.variantCode = String(first.variantCode || '');
        demand.componentCode = String(first.componentCode || '');
        demand.semiFinishedCode = String(first.semiFinishedCode || '');
        demand.productGroup = demandItems.length > 1 ? `${demandItems.length} kalem` : String(first.productGroup || '');
        demand.productName = demandItems.length > 1 ? `Coklu stok talebi (${demandItems.length} urun)` : String(first.productName || '');
        demand.productCode = demandItems.length > 1 ? 'MIXED' : String(first.productCode || '');
        demand.montageCardId = String(first.montageCardId || '');
        demand.montageCardCode = String(first.montageCardCode || '');
        demand.qty = Number(totalQty);
        demand.dueDate = String(PlanningModule.state.stockDraftDueDate || '').trim();
        demand.priority = PlanningModule.getPriorityValue(PlanningModule.state.stockDraftPriority || 'NORMAL');
        demand.note = String(PlanningModule.state.stockDraftNote || '').trim();
        demand.status = 'OPEN';
        demand.workOrderId = '';
        demand.workOrderCode = '';
        demand.workOrderIds = [];
        demand.workOrderCodes = [];
        demand.updated_at = now;

        if (!releaseNow) {
            await DB.save();
            PlanningModule.resetStockDraft();
            PlanningModule.state.workspaceView = 'stock-production';
            UI.renderCurrentPage();
            return;
        }

        try {
            PlanningModule.releaseDemandInternal(demand);
            await DB.save();
            PlanningModule.resetStockDraft();
            PlanningModule.openWorkspace('released-orders');
        } catch (error) {
            await DB.save();
            alert(`${error?.message || 'Is emrine cevrilemedi.'} Talep kaydedildi, havuzdan tekrar deneyebilirsiniz.`);
            PlanningModule.resetStockDraft();
            PlanningModule.openWorkspace('planning-pool');
        }
    },

    releaseDemandInternal: (demand) => {
        if (!demand) throw new Error('Talep bulunamadi.');
        if (String(demand?.status || 'OPEN').toUpperCase() === 'RELEASED' && demand?.workOrderId) {
            throw new Error('Bu talep zaten is emrine donusmus.');
        }
        const sourceId = String(demand.id || '');
        const sourceCode = String(demand.demandCode || '');
        const demandItems = Array.isArray(demand?.items) && demand.items.length
            ? demand.items
            : [{
                id: crypto.randomUUID(),
                itemType: PlanningModule.normalizeDraftItemKind(demand.itemType || 'MODEL'),
                variantId: String(demand.variantId || ''),
                componentId: String(demand.componentId || ''),
                semiFinishedId: String(demand.semiFinishedId || ''),
                qty: Number(demand.qty || 0),
                montageCardId: String(demand.montageCardId || '')
            }];

        const validateDemandItem = (item) => {
            const kind = PlanningModule.normalizeDraftItemKind(item?.itemType);
            const qty = Number(item?.qty || 0);
            if (!Number.isFinite(qty) || qty <= 0) throw new Error('Talep satirinda gecersiz adet var.');
            if (kind === 'COMPONENT') {
                if (!PlanningModule.findComponentById(item?.componentId || '')) throw new Error('Parca/bilesen karti bulunamadi.');
                return;
            }
            if (kind === 'SEMI') {
                if (!PlanningModule.findSemiFinishedById(item?.semiFinishedId || '')) throw new Error('Yari mamul karti bulunamadi.');
                return;
            }
            const montageId = String(item?.montageCardId || '');
            if (!montageId) throw new Error('Urun modeli satirinda montaj karti bulunamadi.');
            const montage = (Array.isArray(DB.data?.data?.montageCards) ? DB.data.data.montageCards : [])
                .find((row) => String(row?.id || '') === montageId);
            if (!montage) throw new Error('Urun modeli satirinda montaj karti bulunamadi.');
        };

        demandItems.forEach(validateDemandItem);

        const orders = demandItems.map((item) => {
            const kind = PlanningModule.normalizeDraftItemKind(item?.itemType);
            const qty = Number(item?.qty || 0);
            if (kind === 'COMPONENT' || kind === 'SEMI') {
                return UnitModule.createWorkOrderFromComponentCard({
                    componentId: kind === 'SEMI' ? String(item.semiFinishedId || '') : String(item.componentId || ''),
                    componentLibrary: kind === 'SEMI' ? 'SEMI' : 'PART',
                    lotQty: qty,
                    dueDate: String(demand.dueDate || ''),
                    priority: PlanningModule.getPriorityValue(demand.priority || 'NORMAL'),
                    note: String(demand.note || '').trim(),
                    sourceType: kind === 'SEMI' ? 'PLAN_STOCK_SEMI' : 'PLAN_STOCK_COMPONENT',
                    sourceId,
                    sourceCode
                });
            }
            return UnitModule.createWorkOrderFromMontageCard({
                montageId: String(item.montageCardId || demand.montageCardId || ''),
                lotQty: qty,
                dueDate: String(demand.dueDate || ''),
                priority: PlanningModule.getPriorityValue(demand.priority || 'NORMAL'),
                note: String(demand.note || '').trim(),
                sourceType: 'PLAN_STOCK_MODEL',
                sourceId,
                sourceCode
            });
        });

        const primaryOrder = orders[0] || null;
        const now = new Date().toISOString();
        demand.status = 'RELEASED';
        demand.workOrderId = String(primaryOrder?.id || '');
        demand.workOrderIds = orders.map((order) => String(order?.id || '')).filter(Boolean);
        demand.workOrderCodes = orders.map((order) => String(order?.workOrderCode || '')).filter(Boolean);
        demand.workOrderCode = demand.workOrderCodes.length > 1
            ? `${demand.workOrderCodes[0]} +${demand.workOrderCodes.length - 1}`
            : String(demand.workOrderCodes[0] || '');
        demand.released_at = now;
        demand.updated_at = now;
        return primaryOrder;
    },

    releaseDemand: async (demandId) => {
        const demand = PlanningModule.getDemands().find((row) => String(row?.id || '') === String(demandId || ''));
        if (!demand) return;
        try {
            PlanningModule.releaseDemandInternal(demand);
        } catch (error) {
            alert(error?.message || 'Is emrine cevrilemedi.');
            return;
        }
        await DB.save();
        UI.renderCurrentPage();
    },

    deleteDemand: async (demandId) => {
        const all = PlanningModule.getDemands();
        const row = all.find((item) => String(item?.id || '') === String(demandId || ''));
        if (!row) return;
        if (String(row?.status || 'OPEN').toUpperCase() === 'RELEASED') return alert('Is emrine donusmus kayit silinemez.');
        if (!confirm('Silmek istediginizden emin misiniz?')) return;
        DB.data.data.planningDemands = all.filter((item) => String(item?.id || '') !== String(demandId || ''));
        if (String(PlanningModule.state.stockDraftEditingId || '') === String(demandId || '')) PlanningModule.resetStockDraft();
        await DB.save();
        UI.renderCurrentPage();
    },

    renderPriorityBadge: (priority) => {
        const value = PlanningModule.getPriorityValue(priority);
        const style = value === 'URGENT'
            ? 'background:#fee2e2; color:#b91c1c; border:1px solid #fecaca;'
            : value === 'HIGH'
                ? 'background:#ffedd5; color:#c2410c; border:1px solid #fed7aa;'
                : value === 'LOW'
                    ? 'background:#ecfdf5; color:#047857; border:1px solid #a7f3d0;'
                    : 'background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;';
        return `<span style="display:inline-block; border-radius:999px; padding:0.14rem 0.5rem; font-size:0.72rem; font-weight:700; ${style}">${PlanningModule.escapeHtml(value)}</span>`;
    },

    getItemTypeLabel: (value) => {
        const kind = String(value || '').toUpperCase();
        if (kind === 'COMPONENT') return 'Parca & Bilesen';
        if (kind === 'SEMI') return 'Yari Mamul';
        if (kind === 'MIXED') return 'Coklu Karma';
        return 'Urun Modeli';
    },

    renderDemandRows: (rows, emptyMessage) => {
        if (!rows.length) {
            return `<tr><td colspan="8" style="padding:1rem; text-align:center; color:#94a3b8;">${PlanningModule.escapeHtml(emptyMessage || 'Kayit yok.')}</td></tr>`;
        }
        return rows.map((row) => {
            const released = String(row?.status || 'OPEN').toUpperCase() === 'RELEASED';
            const itemCount = Array.isArray(row?.items) ? row.items.length : 0;
            const displayName = itemCount > 1 ? `${row?.productName || 'Coklu stok talebi'} (${itemCount} kalem)` : String(row?.productName || '-');
            const displayCode = itemCount > 1
                ? `MIXED / ${itemCount} kalem`
                : String(row?.variantCode || row?.componentCode || row?.semiFinishedCode || '-');
            const displayWorkOrder = Array.isArray(row?.workOrderCodes) && row.workOrderCodes.length
                ? (row.workOrderCodes.length > 1 ? `${row.workOrderCodes[0]} +${row.workOrderCodes.length - 1}` : row.workOrderCodes[0])
                : String(row?.workOrderCode || '-');
            return `
                <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:0.6rem;"><div style="font-family:monospace; font-weight:700; color:#1d4ed8;">${PlanningModule.escapeHtml(row?.demandCode || '-')}</div><div style="font-size:0.75rem; color:#64748b;">${PlanningModule.escapeHtml(row?.sourceLabel || 'Stok Uretimi')}</div></td>
                    <td style="padding:0.6rem;"><div style="font-weight:700; color:#334155;">${PlanningModule.escapeHtml(displayName)}</div><div style="font-size:0.75rem; color:#64748b;">${PlanningModule.escapeHtml(PlanningModule.getItemTypeLabel(row?.itemType || 'MODEL'))}</div><div style="font-size:0.75rem; color:#64748b; font-family:monospace;">${PlanningModule.escapeHtml(displayCode)}</div></td>
                    <td style="padding:0.6rem; font-family:monospace;">${PlanningModule.escapeHtml(row?.productCode || '-')}</td>
                    <td style="padding:0.6rem; text-align:center; font-weight:800;">${PlanningModule.escapeHtml(String(row?.qty || 0))}</td>
                    <td style="padding:0.6rem;"><div>${PlanningModule.escapeHtml(row?.dueDate || '-')}</div><div style="margin-top:0.25rem;">${PlanningModule.renderPriorityBadge(row?.priority || 'NORMAL')}</div></td>
                    <td style="padding:0.6rem;"><span style="display:inline-block; border-radius:999px; padding:0.14rem 0.5rem; font-size:0.72rem; font-weight:700; ${PlanningModule.getStatusStyle(row?.status || 'OPEN')}">${PlanningModule.escapeHtml(PlanningModule.getStatusLabel(row?.status || 'OPEN'))}</span></td>
                    <td style="padding:0.6rem; font-family:monospace;">${PlanningModule.escapeHtml(displayWorkOrder)}</td>
                    <td style="padding:0.6rem; text-align:right;"><div style="display:inline-flex; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end;">${released ? '' : `<button class="btn-sm" onclick="PlanningModule.startDemandEdit('${PlanningModule.escapeHtml(row?.id || '')}')">duzenle</button>`}${released ? '' : `<button class="btn-sm" onclick="PlanningModule.releaseDemand('${PlanningModule.escapeHtml(row?.id || '')}')" style="border-color:#bfdbfe; color:#1d4ed8; background:#eff6ff;">is emrine cevir</button>`}${released ? '' : `<button class="btn-sm" onclick="PlanningModule.deleteDemand('${PlanningModule.escapeHtml(row?.id || '')}')">sil</button>`}</div></td>
                </tr>
            `;
        }).join('');
    },

    renderStockDemandRows: (rows, emptyMessage) => {
        if (!rows.length) {
            return `<tr><td colspan="8" style="padding:1rem; text-align:center; color:#94a3b8;">${PlanningModule.escapeHtml(emptyMessage || 'Kayit yok.')}</td></tr>`;
        }
        return rows.map((row) => {
            const itemCount = Array.isArray(row?.items) ? row.items.length : 0;
            const displayName = itemCount > 1 ? `${row?.productName || 'Coklu stok talebi'} (${itemCount} kalem)` : String(row?.productName || '-');
            const displayCode = itemCount > 1
                ? `MIXED / ${itemCount} kalem`
                : String(row?.productCode || row?.variantCode || row?.componentCode || row?.semiFinishedCode || '-');
            return `
                <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:0.6rem;"><div style="font-family:monospace; font-weight:700; color:#1d4ed8;">${PlanningModule.escapeHtml(row?.demandCode || '-')}</div></td>
                    <td style="padding:0.6rem;"><div style="font-weight:700; color:#334155;">${PlanningModule.escapeHtml(displayName)}</div><div style="font-size:0.75rem; color:#64748b;">${PlanningModule.escapeHtml(PlanningModule.getItemTypeLabel(row?.itemType || 'MODEL'))}</div></td>
                    <td style="padding:0.6rem; font-family:monospace;">${PlanningModule.escapeHtml(displayCode)}</td>
                    <td style="padding:0.6rem; text-align:center; font-weight:800;">${PlanningModule.escapeHtml(String(row?.qty || 0))}</td>
                    <td style="padding:0.6rem;"><div>${PlanningModule.escapeHtml(row?.dueDate || '-')}</div><div style="margin-top:0.25rem;">${PlanningModule.renderPriorityBadge(row?.priority || 'NORMAL')}</div></td>
                    <td style="padding:0.6rem;"><span style="display:inline-block; border-radius:999px; padding:0.14rem 0.5rem; font-size:0.72rem; font-weight:700; ${PlanningModule.getStatusStyle(row?.status || 'OPEN')}">${PlanningModule.escapeHtml(PlanningModule.getStatusLabel(row?.status || 'OPEN'))}</span></td>
                    <td style="padding:0.6rem; font-family:monospace;">${PlanningModule.escapeHtml(row?.workOrderCode || '-')}</td>
                    <td style="padding:0.6rem; text-align:right;">
                        <div style="display:inline-flex; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end;">
                            <button class="btn-sm" onclick="PlanningModule.startDemandEdit('${PlanningModule.escapeHtml(row?.id || '')}')">duzenle</button>
                            <button class="btn-sm" onclick="PlanningModule.deleteDemand('${PlanningModule.escapeHtml(row?.id || '')}')">sil</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderMenuLayout: () => {
        const all = PlanningModule.getDemands();
        const openCount = all.filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'OPEN').length;
        const releasedCount = all.filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'RELEASED').length;
        const cards = [
            { id: 'sales-demand', icon: 'shopping-bag', label: 'Siparisten Gelen Talepler', tone: 'g-orange', meta: 'Taslak not ekrani' },
            { id: 'stock-production', icon: 'boxes', label: 'Stok Icin Uretim', tone: 'g-emerald', meta: `${openCount} acik talep` },
            { id: 'planning-pool', icon: 'clipboard-list', label: 'Planlama Havuzu', tone: 'g-blue', meta: `${openCount} bekleyen` },
            { id: 'released-orders', icon: 'file-check-2', label: 'Is Emrine Donusenler', tone: 'g-pink', meta: `${releasedCount} donusen` },
            { id: 'capacity-load', icon: 'activity', label: 'Kapasite ve Yuk Durumu', tone: 'g-cyan', meta: 'Taslak not ekrani' }
        ];
        return `
            <section style="max-width:1880px; margin:0 auto;">
                <div style="background:rgba(255,255,255,0.72); border:1px solid #cbd5e1; border-radius:1.8rem; padding:1.4rem;">
                    <div style="margin-bottom:1.1rem;">
                        <h2 class="page-title" style="margin:0; font-size:1.95rem;">planlama</h2>
                        <div style="color:#64748b; margin-top:0.25rem;">Stok icin uretim talebi ac, havuza dusur ve is emrine cevir.</div>
                    </div>
                    <div class="apps-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1rem;">
                        ${cards.map((card) => `
                            <button type="button" onclick="PlanningModule.openWorkspace('${PlanningModule.escapeHtml(card.id)}')" class="app-card" style="min-height:180px; border:none; width:100%; text-align:center; cursor:pointer;">
                                <div class="icon-box ${PlanningModule.escapeHtml(card.tone)}"><i data-lucide="${PlanningModule.escapeHtml(card.icon)}" width="30" height="30"></i></div>
                                <div class="app-name">${PlanningModule.escapeHtml(card.label)}</div>
                                <div style="margin-top:0.45rem; color:#64748b; font-size:0.82rem; font-weight:600;">${PlanningModule.escapeHtml(card.meta)}</div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </section>
        `;
    },

    renderStockProductionWorkspace: () => {
        if (!PlanningModule.state.stockDraftDueDate) PlanningModule.resetStockDraft();
        const sourceKindRaw = String(PlanningModule.state.stockDraftSourceKind || 'MODEL').toUpperCase();
        const sourceKind = ['MODEL', 'COMPONENT', 'SEMI'].includes(sourceKindRaw) ? sourceKindRaw : 'MODEL';
        const pickerKind = sourceKind === 'COMPONENT' ? 'component' : (sourceKind === 'SEMI' ? 'semi' : 'model');
        const sourceLabel = sourceKind === 'COMPONENT' ? 'Parca/bilesen' : (sourceKind === 'SEMI' ? 'Yari mamul' : 'Urun model');
        const addLabel = sourceKind === 'COMPONENT' ? 'parca bilesen ekle +' : (sourceKind === 'SEMI' ? 'yari mamul ekle +' : 'urun modeli ekle +');
        const isFormOpen = !!PlanningModule.state.stockDraftFormOpen;
        const draftItems = PlanningModule.getResolvedStockDraftItems();
        const totalDraftQty = draftItems.reduce((sum, row) => sum + Number(row?.qty || 0), 0);
        const stockRows = PlanningModule.getDemands()
            .filter((row) => String(row?.sourceType || '').toUpperCase() === 'STOCK')
            .filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'OPEN')
            .slice()
            .sort((a, b) => String(b?.created_at || '').localeCompare(String(a?.created_at || '')));

        if (!isFormOpen) {
            return `
                <section style="max-width:1680px; margin:0 auto;">
                    <div style="background:rgba(255,255,255,0.72); border:1px solid #cbd5e1; border-radius:1.8rem; padding:1.35rem;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:0.9rem; flex-wrap:wrap;">
                            <div>
                                <h2 class="page-title" style="margin:0;">planlama / stok icin uretim</h2>
                                <div style="color:#64748b; margin-top:0.2rem;">Buradan depoya hazir tutulacak urun icin talep acabilir ve istersek aninda is emrine cevirebiliriz.</div>
                            </div>
                            <button class="btn-primary" onclick="PlanningModule.openStockDemandForm(true)" style="min-width:170px;">yeni talep +</button>
                        </div>
                        <div style="background:white; border:1px solid #e2e8f0; border-radius:0.95rem; padding:0.9rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; margin-bottom:0.75rem; flex-wrap:wrap;">
                                <strong>Son stok talepleri</strong>
                                <button class="btn-sm" onclick="PlanningModule.openWorkspace('released-orders')">donusenleri goruntule</button>
                            </div>
                            <div class="card-table">
                                <table style="width:100%; border-collapse:collapse;">
                                    <thead>
                                        <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                                            <th style="padding:0.6rem; text-align:left;">Talep</th>
                                            <th style="padding:0.6rem; text-align:left;">Urun</th>
                                            <th style="padding:0.6rem; text-align:left;">Kod</th>
                                            <th style="padding:0.6rem; text-align:center;">Adet</th>
                                            <th style="padding:0.6rem; text-align:left;">Termin / Oncelik</th>
                                            <th style="padding:0.6rem; text-align:left;">Durum</th>
                                            <th style="padding:0.6rem; text-align:left;">Is emri</th>
                                            <th style="padding:0.6rem; text-align:right;">Islem</th>
                                        </tr>
                                    </thead>
                                    <tbody>${PlanningModule.renderStockDemandRows(stockRows, 'Henuz stok icin uretim talebi acilmadi.')}</tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>
            `;
        }

        const demandCode = PlanningModule.getStockDraftDemandCode();
        const isEditing = !!String(PlanningModule.state.stockDraftEditingId || '').trim();

        return `
            <section style="max-width:1680px; margin:0 auto;">
                <div style="background:rgba(255,255,255,0.72); border:1px solid #cbd5e1; border-radius:1.8rem; padding:1.35rem;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:0.9rem; flex-wrap:wrap;">
                        <div>
                            <h2 class="page-title" style="margin:0;">planlama / stok icin uretim</h2>
                            <div style="color:#64748b; margin-top:0.2rem;">Yeni talep kartini doldur, kaydet ve planlama havuzuna gonder.</div>
                        </div>
                        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                            <button class="btn-sm" onclick="PlanningModule.cancelStockDemandForm()">Vazgec</button>
                            <button class="btn-primary" onclick="PlanningModule.saveStockDemand(false)">kaydet ve planlamaya gonder +</button>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); gap:0.75rem; margin-bottom:0.85rem;">
                        <div style="grid-column:span 4;">
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">(talep ID)</label>
                            <input value="${PlanningModule.escapeHtml(demandCode)}" readonly style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.6rem; background:#f8fafc; padding:0 0.65rem; font-family:monospace; font-weight:700;">
                        </div>
                        <div style="grid-column:span 4;">
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Oncelik</label>
                            <select onchange="PlanningModule.setStockDraftField('stockDraftPriority', this.value)" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.65rem;">
                                <option value="LOW" ${String(PlanningModule.state.stockDraftPriority || '') === 'LOW' ? 'selected' : ''}>DUSUK</option>
                                <option value="NORMAL" ${String(PlanningModule.state.stockDraftPriority || 'NORMAL') === 'NORMAL' ? 'selected' : ''}>NORMAL</option>
                                <option value="HIGH" ${String(PlanningModule.state.stockDraftPriority || '') === 'HIGH' ? 'selected' : ''}>YUKSEK</option>
                                <option value="URGENT" ${String(PlanningModule.state.stockDraftPriority || '') === 'URGENT' ? 'selected' : ''}>ACIL</option>
                            </select>
                        </div>
                        <div style="grid-column:span 4;">
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Hedef tarih</label>
                            <input type="date" value="${PlanningModule.escapeHtml(PlanningModule.state.stockDraftDueDate || '')}" oninput="PlanningModule.setStockDraftField('stockDraftDueDate', this.value)" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.65rem;">
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:minmax(0,1.85fr) minmax(0,1fr); gap:0.9rem;">
                        <div style="border:1px solid #cbd5e1; border-radius:0.95rem; background:white; padding:0.85rem;">
                            <div style="display:flex; justify-content:space-between; gap:0.6rem; align-items:center; flex-wrap:wrap; margin-bottom:0.65rem;">
                                <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
                                <button class="btn-sm" onclick="PlanningModule.setStockDraftField('stockDraftSourceKind','MODEL')" style="${sourceKind === 'MODEL' ? 'background:#0f172a; color:#fff; border-color:#0f172a;' : ''}">Urun model</button>
                                <button class="btn-sm" onclick="PlanningModule.setStockDraftField('stockDraftSourceKind','COMPONENT')" style="${sourceKind === 'COMPONENT' ? 'background:#0f172a; color:#fff; border-color:#0f172a;' : ''}">Parca/bilesen</button>
                                <button class="btn-sm" onclick="PlanningModule.setStockDraftField('stockDraftSourceKind','SEMI')" style="${sourceKind === 'SEMI' ? 'background:#0f172a; color:#fff; border-color:#0f172a;' : ''}">Yari mamul</button>
                            </div>
                            <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                                <button class="btn-sm" onclick="PlanningModule.clearStockDraftSelection()">tumunu temizle</button>
                                <button class="btn-primary" onclick="PlanningModule.openItemPicker('${pickerKind}')">${PlanningModule.escapeHtml(addLabel)}</button>
                            </div>
                        </div>
                        <div style="font-size:0.75rem; color:#64748b; margin-bottom:0.5rem;">${PlanningModule.escapeHtml(sourceLabel)} baglantilari</div>
                        <div class="card-table" style="padding:0.4rem 0.45rem;">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                        <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                                            <th style="padding:0.45rem; width:44px; text-align:center;">#</th>
                                            <th style="padding:0.45rem; text-align:left;">Bagli kayit</th>
                                            <th style="padding:0.45rem; width:120px; text-align:center;">tip</th>
                                            <th style="padding:0.45rem; width:110px; text-align:center;">islem</th>
                                            <th style="padding:0.45rem; width:110px; text-align:center;">adet</th>
                                            <th style="padding:0.45rem; width:70px; text-align:center;">sil</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${draftItems.length
                                            ? draftItems.map((item, idx) => {
                                                const rowPickerKind = item.itemType === 'COMPONENT' ? 'component' : (item.itemType === 'SEMI' ? 'semi' : 'model');
                                                const typeLabel = PlanningModule.getItemTypeLabel(item.itemType);
                                                const infoLine = `${String(item.code || '-')} / ${String(item.info || '-')}`;
                                                return `
                                                    <tr style="border-bottom:1px solid #f1f5f9; ${item.valid ? '' : 'background:#fff7ed;'}">
                                                        <td style="padding:0.45rem; text-align:center; font-weight:700;">${idx + 1}</td>
                                                        <td style="padding:0.45rem;">
                                                            <div style="font-weight:700; color:${item.valid ? '#334155' : '#b45309'};">${PlanningModule.escapeHtml(item.title || 'Gecersiz kayit')}</div>
                                                            <div style="font-size:0.75rem; color:#64748b; font-family:monospace;">${PlanningModule.escapeHtml(infoLine)}</div>
                                                        </td>
                                                        <td style="padding:0.45rem; text-align:center;"><span style="display:inline-block; border:1px solid #cbd5e1; border-radius:999px; padding:0.12rem 0.55rem; font-size:0.72rem; font-weight:700; color:#334155;">${PlanningModule.escapeHtml(typeLabel)}</span></td>
                                                        <td style="padding:0.45rem; text-align:center;"><button class="btn-sm" onclick="PlanningModule.openItemPicker('${rowPickerKind}')">goruntule</button></td>
                                                        <td style="padding:0.45rem; text-align:center;"><input type="number" min="1" value="${PlanningModule.escapeHtml(String(item.qty || 1))}" onchange="PlanningModule.setStockDraftItemQty('${PlanningModule.escapeHtml(item.id)}', this.value)" style="width:84px; height:34px; border:1px solid #cbd5e1; border-radius:0.5rem; padding:0 0.45rem; font-weight:700; text-align:center;"></td>
                                                        <td style="padding:0.45rem; text-align:center;"><button class="btn-sm" onclick="PlanningModule.removeStockDraftItem('${PlanningModule.escapeHtml(item.id)}')">sil</button></td>
                                                    </tr>
                                                `;
                                            }).join('')
                                            : `<tr><td colspan="6" style="padding:0.85rem; color:#94a3b8;">Henuz urun baglanmadi.</td></tr>`}
                                    </tbody>
                                </table>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; margin-top:0.45rem; flex-wrap:wrap;">
                                <div style="font-size:0.72rem; color:#94a3b8;">+ butonu ilgili kutuphane ekranina gider, secilen kayit bu alana eklenir.</div>
                                <div style="font-size:0.78rem; color:#334155; font-weight:700;">Toplam kalem: ${draftItems.length} | Toplam adet: ${PlanningModule.escapeHtml(String(totalDraftQty))}</div>
                            </div>
                        </div>

                        <div style="border:1px solid #cbd5e1; border-radius:0.95rem; background:white; padding:0.85rem;">
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.25rem;">not aciklama ekle</label>
                            <textarea rows="10" onchange="PlanningModule.setStockDraftField('stockDraftNote', this.value)" onblur="PlanningModule.setStockDraftField('stockDraftNote', this.value)" style="width:100%; border:1px solid #cbd5e1; border-radius:0.65rem; padding:0.65rem; resize:vertical;">${PlanningModule.escapeHtml(PlanningModule.state.stockDraftNote || '')}</textarea>
                            <div style="margin-top:0.6rem; font-size:0.75rem; color:#64748b;">${isEditing ? 'Duzenleme modundasin. Kaydet butonu mevcut talebi gunceller.' : 'Kayit acildiginda talep PLN kodu ile planlama havuzuna duser.'}</div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    },

    renderPlanningPoolWorkspace: () => {
        const openRows = PlanningModule.getDemands().filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'OPEN').slice().sort((a, b) => {
            const da = String(a?.dueDate || '9999-12-31');
            const db = String(b?.dueDate || '9999-12-31');
            if (da !== db) return da.localeCompare(db);
            const list = ['URGENT', 'HIGH', 'NORMAL', 'LOW'];
            return list.indexOf(PlanningModule.getPriorityValue(a?.priority || 'NORMAL')) - list.indexOf(PlanningModule.getPriorityValue(b?.priority || 'NORMAL'));
        });
        const totalQty = openRows.reduce((sum, row) => sum + Number(row?.qty || 0), 0);
        return `<section style="max-width:1680px; margin:0 auto;"><div style="background:rgba(255,255,255,0.72); border:1px solid #cbd5e1; border-radius:1.8rem; padding:1.4rem;"><div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:1rem; flex-wrap:wrap;"><div><h2 class="page-title" style="margin:0;">planlama / planlama havuzu</h2><div style="color:#64748b; margin-top:0.2rem;">Bekleyen talepler burada toplanir. Ister duzenlersiniz ister dogrudan is emrine cevirirsiniz.</div></div><div style="display:flex; gap:0.5rem; flex-wrap:wrap;"><button class="btn-primary" onclick="PlanningModule.openWorkspace('stock-production')">stok talebi ac</button><button class="btn-sm" onclick="PlanningModule.openWorkspace('released-orders')">donusenler</button><button class="btn-sm" onclick="PlanningModule.openWorkspace('menu')">geri</button></div></div><div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.8rem; margin-bottom:1rem;"><div style="background:white; border:1px solid #e2e8f0; border-radius:0.9rem; padding:0.8rem 0.95rem;"><div style="font-size:0.74rem; color:#64748b;">Bekleyen talep</div><div style="font-size:1.15rem; font-weight:800; color:#0f172a;">${openRows.length}</div></div><div style="background:white; border:1px solid #e2e8f0; border-radius:0.9rem; padding:0.8rem 0.95rem;"><div style="font-size:0.74rem; color:#64748b;">Toplam adet</div><div style="font-size:1.15rem; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(totalQty))}</div></div><div style="background:white; border:1px solid #e2e8f0; border-radius:0.9rem; padding:0.8rem 0.95rem;"><div style="font-size:0.74rem; color:#64748b;">Kaynak</div><div style="font-size:1rem; font-weight:800; color:#0f172a;">Stok Uretim</div></div></div><div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.95rem;"><div class="card-table"><table style="width:100%; border-collapse:collapse;"><thead><tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;"><th style="padding:0.6rem; text-align:left;">Talep</th><th style="padding:0.6rem; text-align:left;">Urun</th><th style="padding:0.6rem; text-align:left;">Kod</th><th style="padding:0.6rem; text-align:center;">Adet</th><th style="padding:0.6rem; text-align:left;">Termin / Oncelik</th><th style="padding:0.6rem; text-align:left;">Durum</th><th style="padding:0.6rem; text-align:left;">Is emri</th><th style="padding:0.6rem; text-align:right;">Islem</th></tr></thead><tbody>${PlanningModule.renderDemandRows(openRows, 'Havuzda bekleyen kayit yok.')}</tbody></table></div></div></div></section>`;
    },

    renderReleasedOrdersWorkspace: () => {
        const rows = PlanningModule.getDemands().filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'RELEASED').slice().sort((a, b) => String(b?.released_at || '').localeCompare(String(a?.released_at || '')));
        return `<section style="max-width:1680px; margin:0 auto;"><div style="background:rgba(255,255,255,0.72); border:1px solid #cbd5e1; border-radius:1.8rem; padding:1.4rem;"><div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:1rem; flex-wrap:wrap;"><div><h2 class="page-title" style="margin:0;">planlama / is emrine donusenler</h2><div style="color:#64748b; margin-top:0.2rem;">Planlamadan cikmis ve atolyelere akacak is emirlerinin kayit listesi.</div></div><div style="display:flex; gap:0.5rem; flex-wrap:wrap;"><button class="btn-sm" onclick="PlanningModule.openWorkspace('planning-pool')">planlama havuzu</button><button class="btn-sm" onclick="PlanningModule.openWorkspace('menu')">geri</button></div></div><div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.8rem; margin-bottom:1rem;"><div style="background:white; border:1px solid #e2e8f0; border-radius:0.9rem; padding:0.8rem 0.95rem;"><div style="font-size:0.74rem; color:#64748b;">Donusen kayit</div><div style="font-size:1.15rem; font-weight:800; color:#0f172a;">${rows.length}</div></div><div style="background:white; border:1px solid #e2e8f0; border-radius:0.9rem; padding:0.8rem 0.95rem;"><div style="font-size:0.74rem; color:#64748b;">Toplam adet</div><div style="font-size:1.15rem; font-weight:800; color:#0f172a;">${rows.reduce((sum, row) => sum + Number(row?.qty || 0), 0)}</div></div><div style="background:white; border:1px solid #e2e8f0; border-radius:0.9rem; padding:0.8rem 0.95rem;"><div style="font-size:0.74rem; color:#64748b;">Son donusum</div><div style="font-size:1rem; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(rows[0]?.released_at ? String(rows[0].released_at).slice(0, 10) : '-')}</div></div></div><div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.95rem;"><div class="card-table"><table style="width:100%; border-collapse:collapse;"><thead><tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;"><th style="padding:0.6rem; text-align:left;">Talep</th><th style="padding:0.6rem; text-align:left;">Urun</th><th style="padding:0.6rem; text-align:left;">Kod</th><th style="padding:0.6rem; text-align:center;">Adet</th><th style="padding:0.6rem; text-align:left;">Termin / Oncelik</th><th style="padding:0.6rem; text-align:left;">Durum</th><th style="padding:0.6rem; text-align:left;">Is emri</th><th style="padding:0.6rem; text-align:right;">Islem</th></tr></thead><tbody>${PlanningModule.renderDemandRows(rows, 'Henuz planlamadan is emrine donusen kayit yok.')}</tbody></table></div></div></div></section>`;
    },

    renderBlueprintWorkspace: (viewId) => {
        const blueprint = PlanningModule.blueprints[String(viewId || '')];
        if (!blueprint) {
            return `<section style="max-width:1880px; margin:0 auto;"><div style="background:rgba(255,255,255,0.72); border:1px solid #cbd5e1; border-radius:1.8rem; padding:1.4rem;"><div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:1rem;"><h2 class="page-title" style="margin:0;">planlama</h2><button class="btn-sm" onclick="PlanningModule.openWorkspace('menu')">geri</button></div><div class="card-table" style="padding:2rem; text-align:center; color:#94a3b8;">Bu modul icin henuz not tanimlanmadi.</div></div></section>`;
        }
        return `<section style="max-width:1880px; margin:0 auto;"><div style="background:rgba(255,255,255,0.72); border:1px solid #cbd5e1; border-radius:1.8rem; padding:1.4rem;"><div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:1rem; flex-wrap:wrap;"><h2 class="page-title" style="margin:0;">${PlanningModule.escapeHtml(blueprint.title || 'planlama')}</h2><button class="btn-sm" onclick="PlanningModule.openWorkspace('menu')">geri</button></div><div class="card-table" style="padding:1.4rem 1.5rem; margin-bottom:1rem;"><div style="font-size:1.02rem; font-weight:800; color:#0f172a;">Modul notu</div><div style="font-size:0.94rem; color:#64748b; margin-top:0.45rem; line-height:1.7;">${PlanningModule.escapeHtml(blueprint.intro || '')}</div></div><div style="display:grid; gap:1rem;">${(blueprint.sections || []).map((section) => `<div class="card-table" style="padding:1.2rem 1.35rem;"><div style="font-size:0.98rem; font-weight:800; color:#0f172a; margin-bottom:0.7rem;">${PlanningModule.escapeHtml(section.title || '-')}</div><div style="display:grid; gap:0.55rem;">${(section.items || []).map((item) => `<div style="display:flex; align-items:flex-start; gap:0.65rem; color:#334155; line-height:1.65;"><div style="width:8px; height:8px; border-radius:999px; background:#0f172a; margin-top:0.48rem; flex-shrink:0;"></div><div>${PlanningModule.escapeHtml(item || '')}</div></div>`).join('')}</div></div>`).join('')}</div></div></section>`;
    },

    render: (container) => {
        if (!container) return;
        PlanningModule.ensureData();
        const viewId = String(PlanningModule.state.workspaceView || 'menu');
        if (viewId === 'menu') container.innerHTML = PlanningModule.renderMenuLayout();
        else if (viewId === 'stock-production') container.innerHTML = PlanningModule.renderStockProductionWorkspace();
        else if (viewId === 'planning-pool') container.innerHTML = PlanningModule.renderPlanningPoolWorkspace();
        else if (viewId === 'released-orders') container.innerHTML = PlanningModule.renderReleasedOrdersWorkspace();
        else container.innerHTML = PlanningModule.renderBlueprintWorkspace(viewId);
        if (window.lucide) window.lucide.createIcons();
    }
};
