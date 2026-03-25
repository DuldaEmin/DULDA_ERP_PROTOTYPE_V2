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
        stockDraftNote: '',
        planningPoolExpandedDemandId: '',
        planningPoolExpandedItemByDemand: {},
        planningPoolRowsByDemand: {}
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

    escapeJsString: (value) => String(value ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n'),

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

    getDemandItems: (demand) => {
        if (Array.isArray(demand?.items) && demand.items.length) {
            return demand.items
                .map((item) => ({
                    id: String(item?.id || crypto.randomUUID()),
                    itemType: PlanningModule.normalizeDraftItemKind(item?.itemType || 'MODEL'),
                    variantId: String(item?.variantId || ''),
                    componentId: String(item?.componentId || ''),
                    semiFinishedId: String(item?.semiFinishedId || ''),
                    productName: String(item?.productName || ''),
                    productCode: String(item?.productCode || ''),
                    variantCode: String(item?.variantCode || ''),
                    componentCode: String(item?.componentCode || ''),
                    semiFinishedCode: String(item?.semiFinishedCode || ''),
                    productGroup: String(item?.productGroup || ''),
                    qty: Number(item?.qty || 0) > 0 ? Number(item.qty) : 1
                }))
                .filter((item) => item.variantId || item.componentId || item.semiFinishedId || item.productCode || item.variantCode || item.componentCode || item.semiFinishedCode);
        }

        const fallbackType = PlanningModule.normalizeDraftItemKind(demand?.itemType || 'MODEL');
        return [{
            id: crypto.randomUUID(),
            itemType: fallbackType,
            variantId: String(demand?.variantId || ''),
            componentId: String(demand?.componentId || ''),
            semiFinishedId: String(demand?.semiFinishedId || ''),
            productName: String(demand?.productName || ''),
            productCode: String(demand?.productCode || ''),
            variantCode: String(demand?.variantCode || ''),
            componentCode: String(demand?.componentCode || ''),
            semiFinishedCode: String(demand?.semiFinishedCode || ''),
            productGroup: String(demand?.productGroup || ''),
            qty: Number(demand?.qty || 0) > 0 ? Number(demand.qty) : 1
        }];
    },

    parseQty: (value, fallback = 0) => {
        const num = Number(value);
        if (!Number.isFinite(num)) return Number(fallback || 0);
        return Math.max(0, Math.floor(num));
    },

    clampQty: (value, min = 0, max = Number.MAX_SAFE_INTEGER) => {
        const parsed = PlanningModule.parseQty(value, min);
        const lo = PlanningModule.parseQty(min, 0);
        const hiRaw = Number(max);
        const hi = Number.isFinite(hiRaw) ? Math.max(lo, Math.floor(hiRaw)) : Number.MAX_SAFE_INTEGER;
        if (parsed < lo) return lo;
        if (parsed > hi) return hi;
        return parsed;
    },

    getDemandDisplayName: (demand) => {
        const itemCount = Array.isArray(demand?.items) ? demand.items.length : 0;
        return itemCount > 1
            ? `${demand?.productName || 'Coklu stok talebi'} (${itemCount} kalem)`
            : String(demand?.productName || '-');
    },

    getDemandDisplayCode: (demand) => {
        const itemCount = Array.isArray(demand?.items) ? demand.items.length : 0;
        if (itemCount > 1) return `MIXED / ${itemCount} kalem`;
        return String(demand?.variantCode || demand?.componentCode || demand?.semiFinishedCode || '-');
    },

    getDepotQuantityByCode: (code) => {
        const target = String(code || '').trim().toUpperCase();
        if (!target) return 0;
        const stockRows = Array.isArray(DB.data?.data?.stockDepotItems) ? DB.data.data.stockDepotItems : [];
        const legacyRows = Array.isArray(DB.data?.data?.inventory) ? DB.data.data.inventory : [];
        const allRows = [...stockRows, ...legacyRows];
        return allRows.reduce((sum, row) => {
            const rowCode = String(row?.productCode || row?.code || row?.itemCode || '').trim().toUpperCase();
            if (!rowCode || rowCode !== target) return sum;
            const qty = Number(row?.quantity ?? row?.qty ?? row?.amount ?? row?.value ?? 0);
            if (!Number.isFinite(qty) || qty <= 0) return sum;
            return sum + qty;
        }, 0);
    },

    findComponentCardByCodeOrId: (code, refId = '') => {
        const cards = Array.isArray(DB.data?.data?.partComponentCards) ? DB.data.data.partComponentCards : [];
        const byId = String(refId || '').trim();
        if (byId) {
            const hit = cards.find((row) => String(row?.id || '') === byId);
            if (hit) return hit;
        }
        const byCode = String(code || '').trim().toUpperCase();
        if (!byCode) return null;
        return cards.find((row) => String(row?.code || '').trim().toUpperCase() === byCode) || null;
    },

    findSemiCardByCodeOrId: (code, refId = '') => {
        const cards = Array.isArray(DB.data?.data?.semiFinishedCards) ? DB.data.data.semiFinishedCards : [];
        const byId = String(refId || '').trim();
        if (byId) {
            const hit = cards.find((row) => String(row?.id || '') === byId);
            if (hit) return hit;
        }
        const byCode = String(code || '').trim().toUpperCase();
        if (!byCode) return null;
        return cards.find((row) => String(row?.code || '').trim().toUpperCase() === byCode) || null;
    },

    normalizePoolRow: (row) => {
        const requiredQty = PlanningModule.parseQty(row?.requiredQty, 0);
        const stockAvailableQty = PlanningModule.parseQty(row?.stockAvailableQty, 0);
        const semiAvailableQty = PlanningModule.parseQty(row?.semiAvailableQty, 0);
        const useEnabled = !!row?.useEnabled;
        const useStockQty = useEnabled ? PlanningModule.clampQty(row?.useStockQty, 0, stockAvailableQty) : 0;
        const semiMaxByRemain = Math.max(0, requiredQty - useStockQty);
        const useSemiQty = useEnabled
            ? PlanningModule.clampQty(row?.useSemiQty, 0, Math.min(semiAvailableQty, semiMaxByRemain))
            : 0;
        const minNetQty = useEnabled ? Math.max(0, requiredQty - useStockQty - useSemiQty) : requiredQty;
        let netQty = PlanningModule.parseQty(row?.netQty, minNetQty);
        if (netQty < minNetQty) netQty = minNetQty;
        return {
            ...row,
            requiredQty,
            stockAvailableQty,
            semiAvailableQty,
            useEnabled,
            useStockQty,
            useSemiQty,
            minNetQty,
            netQty
        };
    },

    buildPoolRow: ({ key, code, name, sourceType, componentLibrary, componentId, requiredQty, itemKey, itemName, itemCode, itemQty, itemType }) => {
        const safeCode = String(code || '').trim().toUpperCase();
        const qty = PlanningModule.parseQty(requiredQty, 0);
        const isSemi = String(componentLibrary || '').toUpperCase() === 'SEMI';
        const availableQty = PlanningModule.parseQty(PlanningModule.getDepotQuantityByCode(safeCode), 0);
        const stockAvailableQty = isSemi ? 0 : availableQty;
        const semiAvailableQty = isSemi ? availableQty : 0;
        const useEnabled = (stockAvailableQty + semiAvailableQty) > 0;
        const useStockQty = useEnabled ? Math.min(stockAvailableQty, qty) : 0;
        const useSemiQty = useEnabled ? Math.min(semiAvailableQty, Math.max(0, qty - useStockQty)) : 0;
        return PlanningModule.normalizePoolRow({
            key: String(key || crypto.randomUUID()),
            itemKey: String(itemKey || '').trim(),
            itemName: String(itemName || '').trim(),
            itemCode: String(itemCode || '').trim(),
            itemQty: PlanningModule.parseQty(itemQty, 0),
            itemType: PlanningModule.normalizeDraftItemKind(itemType || 'MODEL'),
            code: safeCode,
            name: String(name || safeCode || '-').trim(),
            sourceType: String(sourceType || 'COMPONENT'),
            componentLibrary: isSemi ? 'SEMI' : 'PART',
            componentId: String(componentId || '').trim(),
            requiredQty: qty,
            stockAvailableQty,
            semiAvailableQty,
            useEnabled,
            useStockQty,
            useSemiQty,
            netQty: useEnabled ? Math.max(0, qty - useStockQty - useSemiQty) : qty
        });
    },

    buildPlanningPoolRowsForDemand: (demand) => {
        const map = new Map();
        const addOrMerge = (row) => {
            if (!row) return;
            const key = String(row.key || '').trim();
            if (!key) return;
            if (!map.has(key)) {
                map.set(key, { ...row });
                return;
            }
            const prev = map.get(key);
            prev.requiredQty = PlanningModule.parseQty(prev.requiredQty, 0) + PlanningModule.parseQty(row.requiredQty, 0);
            map.set(key, prev);
        };

        const demandItems = PlanningModule.getDemandItems(demand);
        demandItems.forEach((item, index) => {
            const kind = PlanningModule.normalizeDraftItemKind(item?.itemType || 'MODEL');
            const qty = PlanningModule.parseQty(item?.qty, 0);
            if (qty <= 0) return;
            const itemKey = String(item?.id || `item-${index + 1}`).trim();
            const itemName = String(item?.productName || '-').trim();
            const itemCode = String(PlanningModule.getDemandItemCode(item) || item?.productCode || '').trim();
            const itemQty = qty;
            const createRow = (base) => {
                const mergedKey = `${itemKey}::${String(base?.key || '').trim()}`;
                return {
                    ...base,
                    key: mergedKey,
                    itemKey,
                    itemName,
                    itemCode,
                    itemQty,
                    itemType: kind
                };
            };

            if (kind === 'COMPONENT') {
                const component = PlanningModule.findComponentById(item?.componentId || '')
                    || PlanningModule.findComponentCardByCodeOrId(item?.componentCode || item?.productCode || '', item?.componentId || '');
                if (!component) return;
                addOrMerge(createRow({
                    key: `PART:${String(component.id || '')}`,
                    code: String(component.code || ''),
                    name: String(component.name || component.code || ''),
                    sourceType: 'COMPONENT',
                    componentLibrary: 'PART',
                    componentId: String(component.id || ''),
                    requiredQty: qty
                }));
                return;
            }

            if (kind === 'SEMI') {
                const semi = PlanningModule.findSemiFinishedById(item?.semiFinishedId || '')
                    || PlanningModule.findSemiCardByCodeOrId(item?.semiFinishedCode || item?.productCode || '', item?.semiFinishedId || '');
                if (!semi) return;
                addOrMerge(createRow({
                    key: `SEMI:${String(semi.id || '')}`,
                    code: String(semi.code || ''),
                    name: String(semi.name || semi.code || ''),
                    sourceType: 'SEMI',
                    componentLibrary: 'SEMI',
                    componentId: String(semi.id || ''),
                    requiredQty: qty
                }));
                return;
            }

            const variant = PlanningModule.findVariantById(item?.variantId || '');
            const variantItems = Array.isArray(variant?.items) ? variant.items : [];
            if (!variant || !variantItems.length) return;
            variantItems.forEach((variantItem) => {
                const refCode = String(variantItem?.code || '').trim().toUpperCase();
                const multiplier = Math.max(1, PlanningModule.parseQty(variantItem?.qty ?? 1, 1));
                const targetQty = qty * multiplier;
                const source = String(variantItem?.source || 'component').trim().toLowerCase();
                const refId = String(variantItem?.refId || '').trim();
                const likelySemi = source === 'semi' || source === 'yarimamul' || source === 'semi-finished' || refCode.startsWith('YRM-');
                if (likelySemi) {
                    const semi = PlanningModule.findSemiFinishedById(refId) || PlanningModule.findSemiCardByCodeOrId(refCode, refId);
                    if (!semi) return;
                    addOrMerge(createRow({
                        key: `SEMI:${String(semi.id || '')}`,
                        code: String(semi.code || ''),
                        name: String(semi.name || semi.code || ''),
                        sourceType: 'MODEL',
                        componentLibrary: 'SEMI',
                        componentId: String(semi.id || ''),
                        requiredQty: targetQty
                    }));
                    return;
                }
                const component = PlanningModule.findComponentById(refId) || PlanningModule.findComponentCardByCodeOrId(refCode, refId);
                if (!component) return;
                addOrMerge(createRow({
                    key: `PART:${String(component.id || '')}`,
                    code: String(component.code || ''),
                    name: String(component.name || component.code || ''),
                    sourceType: 'MODEL',
                    componentLibrary: 'PART',
                    componentId: String(component.id || ''),
                    requiredQty: targetQty
                }));
            });
        });

        return Array.from(map.values())
            .map((row) => PlanningModule.buildPoolRow(row))
            .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'tr'));
    },

    syncPlanningPoolRowsWithAvailability: (rows) => {
        return (Array.isArray(rows) ? rows : []).map((rawRow) => {
            const row = { ...rawRow };
            const code = String(row?.code || '').trim().toUpperCase();
            const availableQty = PlanningModule.parseQty(PlanningModule.getDepotQuantityByCode(code), 0);
            const isSemi = String(row?.componentLibrary || '').toUpperCase() === 'SEMI';
            row.stockAvailableQty = isSemi ? 0 : availableQty;
            row.semiAvailableQty = isSemi ? availableQty : 0;
            return PlanningModule.normalizePoolRow(row);
        });
    },

    ensurePlanningPoolRows: (demandId) => {
        const key = String(demandId || '').trim();
        if (!key) return [];
        const demand = PlanningModule.getDemands().find((row) => String(row?.id || '') === key);
        if (!demand) return [];
        if (!PlanningModule.state.planningPoolRowsByDemand || typeof PlanningModule.state.planningPoolRowsByDemand !== 'object') {
            PlanningModule.state.planningPoolRowsByDemand = {};
        }
        const cached = PlanningModule.state.planningPoolRowsByDemand[key];
        if (Array.isArray(cached) && cached.length > 0) {
            const legacyRows = cached.some((row) => !String(row?.itemKey || '').trim());
            if (legacyRows) {
                const rebuilt = PlanningModule.buildPlanningPoolRowsForDemand(demand);
                PlanningModule.state.planningPoolRowsByDemand[key] = rebuilt;
                return rebuilt;
            }
            const synced = PlanningModule.syncPlanningPoolRowsWithAvailability(cached);
            PlanningModule.state.planningPoolRowsByDemand[key] = synced;
            return synced;
        }
        const built = PlanningModule.buildPlanningPoolRowsForDemand(demand);
        PlanningModule.state.planningPoolRowsByDemand[key] = built;
        return built;
    },

    getPlanningPoolRows: (demandId) => {
        const key = String(demandId || '').trim();
        if (!key) return [];
        const rows = PlanningModule.ensurePlanningPoolRows(key);
        return Array.isArray(rows) ? rows : [];
    },

    getPlanningPoolItemGroups: (demand) => {
        const demandId = String(demand?.id || '').trim();
        if (!demandId) return [];
        const rows = PlanningModule.getPlanningPoolRows(demandId);
        const demandItems = PlanningModule.getDemandItems(demand);
        const orderMap = {};
        const groups = new Map();

        demandItems.forEach((item, index) => {
            const itemKey = String(item?.id || `item-${index + 1}`).trim();
            orderMap[itemKey] = index;
            groups.set(itemKey, {
                itemKey,
                itemIndex: index,
                itemName: String(item?.productName || '-'),
                itemCode: String(PlanningModule.getDemandItemCode(item) || item?.productCode || '-'),
                itemQty: PlanningModule.parseQty(item?.qty, 0),
                itemType: PlanningModule.normalizeDraftItemKind(item?.itemType || 'MODEL'),
                rows: []
            });
        });

        rows.forEach((row) => {
            const itemKey = String(row?.itemKey || '').trim();
            if (!itemKey) return;
            if (!groups.has(itemKey)) {
                groups.set(itemKey, {
                    itemKey,
                    itemIndex: Number.MAX_SAFE_INTEGER,
                    itemName: String(row?.itemName || '-'),
                    itemCode: String(row?.itemCode || '-'),
                    itemQty: PlanningModule.parseQty(row?.itemQty, 0),
                    itemType: PlanningModule.normalizeDraftItemKind(row?.itemType || 'MODEL'),
                    rows: []
                });
            }
            groups.get(itemKey).rows.push(row);
        });

        return Array.from(groups.values())
            .filter((group) => group.rows.length > 0 || group.itemQty > 0)
            .sort((a, b) => {
                const ai = Number.isFinite(orderMap[a.itemKey]) ? orderMap[a.itemKey] : a.itemIndex;
                const bi = Number.isFinite(orderMap[b.itemKey]) ? orderMap[b.itemKey] : b.itemIndex;
                return ai - bi;
            });
    },

    togglePlanningPoolExpand: (demandId) => {
        const key = String(demandId || '').trim();
        if (!PlanningModule.state.planningPoolExpandedItemByDemand || typeof PlanningModule.state.planningPoolExpandedItemByDemand !== 'object') {
            PlanningModule.state.planningPoolExpandedItemByDemand = {};
        }
        const isSame = String(PlanningModule.state.planningPoolExpandedDemandId || '') === key;
        PlanningModule.state.planningPoolExpandedDemandId = isSame ? '' : key;
        if (PlanningModule.state.planningPoolExpandedDemandId) {
            PlanningModule.ensurePlanningPoolRows(PlanningModule.state.planningPoolExpandedDemandId);
        } else {
            delete PlanningModule.state.planningPoolExpandedItemByDemand[key];
        }
        UI.renderCurrentPage();
    },

    togglePlanningPoolItemExpand: (demandId, itemKey) => {
        const demandKey = String(demandId || '').trim();
        const key = String(itemKey || '').trim();
        if (!demandKey || !key) return;
        if (!PlanningModule.state.planningPoolExpandedItemByDemand || typeof PlanningModule.state.planningPoolExpandedItemByDemand !== 'object') {
            PlanningModule.state.planningPoolExpandedItemByDemand = {};
        }
        const current = (PlanningModule.state.planningPoolExpandedItemByDemand[demandKey] && typeof PlanningModule.state.planningPoolExpandedItemByDemand[demandKey] === 'object')
            ? { ...PlanningModule.state.planningPoolExpandedItemByDemand[demandKey] }
            : {};
        current[key] = !current[key];
        PlanningModule.state.planningPoolExpandedItemByDemand[demandKey] = current;
        UI.renderCurrentPage();
    },

    setPlanningPoolRowUseEnabled: (demandId, rowKey, checked) => {
        const rows = PlanningModule.getPlanningPoolRows(demandId);
        const target = rows.find((row) => String(row?.key || '') === String(rowKey || ''));
        if (!target) return;
        target.useEnabled = !!checked;
        if (target.useEnabled) {
            target.useStockQty = Math.min(PlanningModule.parseQty(target.stockAvailableQty, 0), PlanningModule.parseQty(target.requiredQty, 0));
            const remain = Math.max(0, PlanningModule.parseQty(target.requiredQty, 0) - PlanningModule.parseQty(target.useStockQty, 0));
            target.useSemiQty = Math.min(PlanningModule.parseQty(target.semiAvailableQty, 0), remain);
        } else {
            target.useStockQty = 0;
            target.useSemiQty = 0;
        }
        const normalized = PlanningModule.normalizePoolRow(target);
        Object.assign(target, normalized);
        UI.renderCurrentPage();
    },

    setPlanningPoolRowQty: (demandId, rowKey, field, value) => {
        const rows = PlanningModule.getPlanningPoolRows(demandId);
        const target = rows.find((row) => String(row?.key || '') === String(rowKey || ''));
        if (!target) return;
        const key = String(field || '').trim();
        if (key === 'useStockQty') target.useStockQty = value;
        if (key === 'useSemiQty') target.useSemiQty = value;
        if (key === 'netQty') target.netQty = value;
        const normalized = PlanningModule.normalizePoolRow(target);
        Object.assign(target, normalized);
        UI.renderCurrentPage();
    },

    getPlanningPoolSummary: (rows) => {
        const safeRows = Array.isArray(rows) ? rows.map((row) => PlanningModule.normalizePoolRow(row)) : [];
        return safeRows.reduce((acc, row) => {
            acc.requiredQty += PlanningModule.parseQty(row?.requiredQty, 0);
            acc.consumedQty += (row?.useEnabled ? (PlanningModule.parseQty(row?.useStockQty, 0) + PlanningModule.parseQty(row?.useSemiQty, 0)) : 0);
            acc.netQty += PlanningModule.parseQty(row?.netQty, 0);
            return acc;
        }, { requiredQty: 0, consumedQty: 0, netQty: 0 });
    },

    getDemandItemCode: (item) => {
        const kind = PlanningModule.normalizeDraftItemKind(item?.itemType || 'MODEL');
        if (kind === 'COMPONENT') return String(item?.componentCode || item?.productCode || '').trim();
        if (kind === 'SEMI') return String(item?.semiFinishedCode || item?.productCode || '').trim();
        return String(item?.variantCode || item?.productCode || '').trim();
    },

    openReadOnlyCodeModal: (code) => {
        const raw = String(code || '').trim();
        if (!raw) return alert('ID kod bulunamadi.');
        if (typeof ReadOnlyViewer === 'undefined' || !ReadOnlyViewer || typeof ReadOnlyViewer.openByCode !== 'function') {
            return alert('Goruntuleme modulu hazir degil.');
        }
        ReadOnlyViewer.openByCode(raw);
    },

    openDemandView: (demandId) => {
        const row = PlanningModule.getDemands().find((item) => String(item?.id || '') === String(demandId || ''));
        if (!row) return alert('Talep kaydi bulunamadi.');
        const items = PlanningModule.getDemandItems(row);
        const totalQty = items.reduce((sum, item) => sum + Number(item?.qty || 0), 0);
        const demandCode = String(row?.demandCode || '-');
        const html = `
            <div style="display:grid; gap:0.75rem;">
                <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.75rem;">
                    <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.55rem;">
                        <div><div style="font-size:0.72rem; color:#64748b;">Talep ID</div><div style="font-weight:800; font-family:monospace; color:#1d4ed8;">${PlanningModule.escapeHtml(demandCode)}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">Durum</div><div style="font-weight:700;">${PlanningModule.escapeHtml(PlanningModule.getStatusLabel(row?.status || 'OPEN'))}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">Toplam adet</div><div style="font-weight:700;">${PlanningModule.escapeHtml(String(totalQty))}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">Termin</div><div style="font-weight:700;">${PlanningModule.escapeHtml(row?.dueDate || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">Oncelik</div><div style="font-weight:700;">${PlanningModule.escapeHtml(PlanningModule.getPriorityValue(row?.priority || 'NORMAL'))}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">Is emri</div><div style="font-weight:700; font-family:monospace;">${PlanningModule.escapeHtml(row?.workOrderCode || '-')}</div></div>
                    </div>
                    <div style="margin-top:0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Not</div><div style="color:#334155;">${PlanningModule.escapeHtml(row?.note || '-')}</div></div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.75rem;">
                    <div style="font-size:0.85rem; color:#64748b; margin-bottom:0.45rem;">Talep kalemleri (${items.length})</div>
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                                <th style="padding:0.45rem; text-align:left;">#</th>
                                <th style="padding:0.45rem; text-align:left;">Urun</th>
                                <th style="padding:0.45rem; text-align:left;">Tip</th>
                                <th style="padding:0.45rem; text-align:left;">ID kod</th>
                                <th style="padding:0.45rem; text-align:center;">Adet</th>
                                <th style="padding:0.45rem; text-align:right;">Islem</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map((item, idx) => {
                                const code = PlanningModule.getDemandItemCode(item);
                                return `
                                    <tr style="border-bottom:1px solid #f1f5f9;">
                                        <td style="padding:0.45rem;">${idx + 1}</td>
                                        <td style="padding:0.45rem;"><div style="font-weight:700; color:#334155;">${PlanningModule.escapeHtml(item?.productName || '-')}</div><div style="font-size:0.74rem; color:#64748b;">${PlanningModule.escapeHtml(item?.productGroup || '-')}</div></td>
                                        <td style="padding:0.45rem;">${PlanningModule.escapeHtml(PlanningModule.getItemTypeLabel(item?.itemType || 'MODEL'))}</td>
                                        <td style="padding:0.45rem; font-family:monospace; color:#1d4ed8;">${PlanningModule.escapeHtml(code || '-')}</td>
                                        <td style="padding:0.45rem; text-align:center; font-weight:700;">${PlanningModule.escapeHtml(String(item?.qty || 0))}</td>
                                        <td style="padding:0.45rem; text-align:right;">${code ? `<button class="btn-sm" onclick="PlanningModule.openReadOnlyCodeModal('${PlanningModule.escapeJsString(code)}')">goruntule</button>` : ''}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        Modal.open(`Talep Goruntule - ${PlanningModule.escapeHtml(demandCode)}`, html, { maxWidth: '1080px' });
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

    openDraftItemPreview: (draftItemId) => {
        const targetId = String(draftItemId || '').trim();
        if (!targetId) return alert('Kayit bulunamadi.');
        const row = PlanningModule.getResolvedStockDraftItems()
            .find((item) => String(item?.id || '') === targetId);
        if (!row || !row.valid) return alert('Bu satirdaki kayit gecersiz. Once gecerli bir urun seciniz.');
        const code = String(row?.code || '').trim();
        if (!code) return alert('Bu kayit icin ID kod bulunamadi.');
        PlanningModule.openReadOnlyCodeModal(code);
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
        if (PlanningModule.state.workspaceView !== 'planning-pool') {
            PlanningModule.state.planningPoolExpandedDemandId = '';
            PlanningModule.state.planningPoolExpandedItemByDemand = {};
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
        if (PlanningModule.state.planningPoolRowsByDemand && typeof PlanningModule.state.planningPoolRowsByDemand === 'object') {
            delete PlanningModule.state.planningPoolRowsByDemand[String(demand.id || '')];
        }
        if (PlanningModule.state.planningPoolExpandedItemByDemand && typeof PlanningModule.state.planningPoolExpandedItemByDemand === 'object') {
            delete PlanningModule.state.planningPoolExpandedItemByDemand[String(demand.id || '')];
        }

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

    releaseDemandInternal: (demand, options = {}) => {
        if (!demand) throw new Error('Talep bulunamadi.');
        if (String(demand?.status || 'OPEN').toUpperCase() === 'RELEASED' && demand?.workOrderId) {
            throw new Error('Bu talep zaten is emrine donusmus.');
        }
        const sourceId = String(demand.id || '');
        const sourceCode = String(demand.demandCode || '');
        const poolRowsRaw = Array.isArray(options?.poolRows) ? options.poolRows : [];
        const poolRows = poolRowsRaw
            .map((row) => PlanningModule.normalizePoolRow(row))
            .filter((row) => PlanningModule.parseQty(row?.netQty, 0) > 0);
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

        let orders = [];
        if (poolRows.length > 0) {
            orders = poolRows.map((row) => {
                const componentId = String(row?.componentId || '').trim();
                const componentLibrary = String(row?.componentLibrary || '').trim().toUpperCase() === 'SEMI' ? 'SEMI' : 'PART';
                const qty = PlanningModule.parseQty(row?.netQty, 0);
                if (!componentId || qty <= 0) throw new Error('Patlatma satirinda gecersiz kalem var. Is emri olusturulamadi.');
                return UnitModule.createWorkOrderFromComponentCard({
                    componentId,
                    componentLibrary,
                    lotQty: qty,
                    dueDate: String(demand.dueDate || ''),
                    priority: PlanningModule.getPriorityValue(demand.priority || 'NORMAL'),
                    note: String(demand.note || '').trim(),
                    sourceType: componentLibrary === 'SEMI' ? 'PLAN_POOL_SEMI' : 'PLAN_POOL_COMPONENT',
                    sourceId,
                    sourceCode
                });
            });
        } else {
            demandItems.forEach(validateDemandItem);
            orders = demandItems.map((item) => {
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
        }
        if (!orders.length) throw new Error('Is emrine donusecek kalem bulunamadi.');

        const primaryOrder = orders[0] || null;
        const now = new Date().toISOString();
        demand.status = 'RELEASED';
        demand.workOrderId = String(primaryOrder?.id || '');
        demand.workOrderIds = orders.map((order) => String(order?.id || '')).filter(Boolean);
        demand.workOrderCodes = orders.map((order) => String(order?.workOrderCode || '')).filter(Boolean);
        demand.workOrderCode = demand.workOrderCodes.length > 1
            ? `${demand.workOrderCodes[0]} +${demand.workOrderCodes.length - 1}`
            : String(demand.workOrderCodes[0] || '');
        demand.poolAnalysis = poolRows.length > 0
            ? {
                rows: poolRows.map((row) => ({
                    key: String(row?.key || ''),
                    code: String(row?.code || ''),
                    name: String(row?.name || ''),
                    componentLibrary: String(row?.componentLibrary || 'PART'),
                    componentId: String(row?.componentId || ''),
                    requiredQty: PlanningModule.parseQty(row?.requiredQty, 0),
                    useEnabled: !!row?.useEnabled,
                    useStockQty: PlanningModule.parseQty(row?.useStockQty, 0),
                    useSemiQty: PlanningModule.parseQty(row?.useSemiQty, 0),
                    netQty: PlanningModule.parseQty(row?.netQty, 0)
                })),
                converted_at: now
            }
            : null;
        demand.released_at = now;
        demand.updated_at = now;
        if (PlanningModule.state.planningPoolRowsByDemand && typeof PlanningModule.state.planningPoolRowsByDemand === 'object') {
            delete PlanningModule.state.planningPoolRowsByDemand[String(demand.id || '')];
        }
        if (String(PlanningModule.state.planningPoolExpandedDemandId || '') === String(demand.id || '')) {
            PlanningModule.state.planningPoolExpandedDemandId = '';
        }
        if (PlanningModule.state.planningPoolExpandedItemByDemand && typeof PlanningModule.state.planningPoolExpandedItemByDemand === 'object') {
            delete PlanningModule.state.planningPoolExpandedItemByDemand[String(demand.id || '')];
        }
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

    releaseDemandFromPool: async (demandId) => {
        const demand = PlanningModule.getDemands().find((row) => String(row?.id || '') === String(demandId || ''));
        if (!demand) return;
        if (String(demand?.status || 'OPEN').toUpperCase() !== 'OPEN') return;
        const rows = PlanningModule.getPlanningPoolRows(demandId).map((row) => PlanningModule.normalizePoolRow(row));
        if (!rows.length) {
            alert('Bu talepte patlatma satiri bulunamadi.');
            return;
        }
        const invalidLow = rows.find((row) => PlanningModule.parseQty(row?.netQty, 0) < PlanningModule.parseQty(row?.minNetQty, 0));
        if (invalidLow) {
            alert(`Eksik uretim girilemez: ${invalidLow.name || invalidLow.code}`);
            return;
        }
        const overRows = rows.filter((row) => PlanningModule.parseQty(row?.netQty, 0) > PlanningModule.parseQty(row?.requiredQty, 0));
        if (overRows.length > 0) {
            const preview = overRows.slice(0, 4).map((row) => `${row.code || '-'} (${row.netQty}/${row.requiredQty})`).join(', ');
            const msg = `Bazi satirlarda fazla uretim var: ${preview}${overRows.length > 4 ? ' ...' : ''}. Onayliyor musunuz?`;
            if (!confirm(msg)) return;
        }
        const nonZeroRows = rows.filter((row) => PlanningModule.parseQty(row?.netQty, 0) > 0);
        if (!nonZeroRows.length) {
            alert('Tum satirlar 0 oldugu icin is emri olusturulamadi.');
            return;
        }
        try {
            PlanningModule.releaseDemandInternal(demand, { poolRows: nonZeroRows });
            await DB.save();
        } catch (error) {
            alert(error?.message || 'Is emrine cevrilemedi.');
            return;
        }
        UI.renderCurrentPage();
    },

    deleteDemand: async (demandId) => {
        const all = PlanningModule.getDemands();
        const row = all.find((item) => String(item?.id || '') === String(demandId || ''));
        if (!row) return;
        if (String(row?.status || 'OPEN').toUpperCase() === 'RELEASED') return alert('Is emrine donusmus kayit silinemez.');
        if (!confirm('Silmek istediginizden emin misiniz?')) return;
        DB.data.data.planningDemands = all.filter((item) => String(item?.id || '') !== String(demandId || ''));
        if (PlanningModule.state.planningPoolRowsByDemand && typeof PlanningModule.state.planningPoolRowsByDemand === 'object') {
            delete PlanningModule.state.planningPoolRowsByDemand[String(demandId || '')];
        }
        if (String(PlanningModule.state.planningPoolExpandedDemandId || '') === String(demandId || '')) {
            PlanningModule.state.planningPoolExpandedDemandId = '';
        }
        if (PlanningModule.state.planningPoolExpandedItemByDemand && typeof PlanningModule.state.planningPoolExpandedItemByDemand === 'object') {
            delete PlanningModule.state.planningPoolExpandedItemByDemand[String(demandId || '')];
        }
        if (String(PlanningModule.state.stockDraftEditingId || '') === String(demandId || '')) PlanningModule.resetStockDraft();
        await DB.save();
        UI.renderCurrentPage();
    },

    getDemandLinkedWorkOrderIds: (demand) => {
        const linked = new Set();
        if (!demand) return linked;
        const demandId = String(demand?.id || '').trim();
        const demandCode = String(demand?.demandCode || '').trim();
        const directIds = Array.isArray(demand?.workOrderIds) ? demand.workOrderIds : [];
        directIds.forEach((id) => {
            const key = String(id || '').trim();
            if (key) linked.add(key);
        });
        const single = String(demand?.workOrderId || '').trim();
        if (single) linked.add(single);
        const orders = Array.isArray(DB.data?.data?.workOrders) ? DB.data.data.workOrders : [];
        orders.forEach((order) => {
            const orderId = String(order?.id || '').trim();
            if (!orderId) return;
            const sourceId = String(order?.sourceId || '').trim();
            const sourceCode = String(order?.sourceCode || '').trim();
            if ((demandId && sourceId === demandId) || (demandCode && sourceCode === demandCode)) {
                linked.add(orderId);
            }
        });
        return linked;
    },

    deleteReleasedDemand: async (demandId) => {
        const all = PlanningModule.getDemands();
        const demand = all.find((item) => String(item?.id || '') === String(demandId || ''));
        if (!demand) return;
        if (String(demand?.status || 'OPEN').toUpperCase() !== 'RELEASED') {
            return PlanningModule.deleteDemand(demandId);
        }
        const linkedIds = PlanningModule.getDemandLinkedWorkOrderIds(demand);
        const workOrderCount = linkedIds.size;
        const demandCode = String(demand?.demandCode || '-');
        const confirmText = `Bu kayit tamamen silinecek.\nTalep: ${demandCode}\nBagli is emri: ${workOrderCount}\nEmin misiniz?`;
        if (!confirm(confirmText)) return;

        DB.data.data.planningDemands = all.filter((item) => String(item?.id || '') !== String(demandId || ''));

        if (Array.isArray(DB.data?.data?.workOrders)) {
            DB.data.data.workOrders = DB.data.data.workOrders.filter((order) => !linkedIds.has(String(order?.id || '')));
        }
        if (Array.isArray(DB.data?.data?.workOrderTransactions)) {
            DB.data.data.workOrderTransactions = DB.data.data.workOrderTransactions.filter((txn) => !linkedIds.has(String(txn?.workOrderId || '')));
        }

        if (PlanningModule.state.planningPoolRowsByDemand && typeof PlanningModule.state.planningPoolRowsByDemand === 'object') {
            delete PlanningModule.state.planningPoolRowsByDemand[String(demandId || '')];
        }
        if (String(PlanningModule.state.planningPoolExpandedDemandId || '') === String(demandId || '')) {
            PlanningModule.state.planningPoolExpandedDemandId = '';
        }
        if (PlanningModule.state.planningPoolExpandedItemByDemand && typeof PlanningModule.state.planningPoolExpandedItemByDemand === 'object') {
            delete PlanningModule.state.planningPoolExpandedItemByDemand[String(demandId || '')];
        }

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
                    <td style="padding:0.6rem; text-align:right;"><div style="display:inline-flex; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end;"><button class="btn-sm" onclick="PlanningModule.openDemandView('${PlanningModule.escapeJsString(row?.id || '')}')">goruntule</button>${released ? '' : `<button class="btn-sm" onclick="PlanningModule.startDemandEdit('${PlanningModule.escapeJsString(row?.id || '')}')">duzenle</button><button class="btn-sm" onclick="PlanningModule.releaseDemand('${PlanningModule.escapeJsString(row?.id || '')}')" style="border-color:#bfdbfe; color:#1d4ed8; background:#eff6ff;">is emrine cevir</button><button class="btn-sm" onclick="PlanningModule.deleteDemand('${PlanningModule.escapeJsString(row?.id || '')}')">sil</button>`}</div></td>
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
                : String(row?.variantCode || row?.componentCode || row?.semiFinishedCode || row?.productCode || '-');
            const released = String(row?.status || 'OPEN').toUpperCase() === 'RELEASED';
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
                            <button class="btn-sm" onclick="PlanningModule.openDemandView('${PlanningModule.escapeJsString(row?.id || '')}')">goruntule</button>
                            <button class="btn-sm" onclick="PlanningModule.startDemandEdit('${PlanningModule.escapeJsString(row?.id || '')}')" ${released ? 'disabled' : ''} style="${released ? 'opacity:0.45; cursor:not-allowed;' : ''}">duzenle</button>
                            <button class="btn-sm" onclick="${released ? `PlanningModule.deleteReleasedDemand('${PlanningModule.escapeJsString(row?.id || '')}')` : `PlanningModule.deleteDemand('${PlanningModule.escapeJsString(row?.id || '')}')`}">sil</button>
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
            .slice()
            .sort((a, b) => String(b?.created_at || '').localeCompare(String(a?.created_at || '')));
        const openStockRows = stockRows.filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'OPEN');
        const releasedStockRows = stockRows.filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'RELEASED');

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
                        <div style="background:white; border:2px solid #fca5a5; border-radius:0.95rem; padding:0.9rem; margin-bottom:0.75rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; margin-bottom:0.75rem; flex-wrap:wrap;">
                                <strong style="color:#b91c1c;">Planlama havuzunda bekleyenler</strong>
                                <span style="font-size:0.78rem; color:#b91c1c; font-weight:700;">${PlanningModule.escapeHtml(String(openStockRows.length))} kayit</span>
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
                                    <tbody>${PlanningModule.renderStockDemandRows(openStockRows, 'Planlamada bekleyen stok talebi yok.')}</tbody>
                                </table>
                            </div>
                        </div>

                        <div style="background:white; border:2px solid #86efac; border-radius:0.95rem; padding:0.9rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; margin-bottom:0.75rem; flex-wrap:wrap;">
                                <strong style="color:#047857;">Is emrine donusenler</strong>
                                <span style="font-size:0.78rem; color:#047857; font-weight:700;">${PlanningModule.escapeHtml(String(releasedStockRows.length))} kayit</span>
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
                                    <tbody>${PlanningModule.renderStockDemandRows(releasedStockRows, 'Henuz is emrine donusen stok talebi yok.')}</tbody>
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
                                                const typeLabel = PlanningModule.getItemTypeLabel(item.itemType);
                                                const infoLine = `${String(item.code || '-')} / ${String(item.info || '-')}`;
                                                const canPreview = item.valid && String(item.code || '').trim().length > 0;
                                                return `
                                                    <tr style="border-bottom:1px solid #f1f5f9; ${item.valid ? '' : 'background:#fff7ed;'}">
                                                        <td style="padding:0.45rem; text-align:center; font-weight:700;">${idx + 1}</td>
                                                        <td style="padding:0.45rem;">
                                                            <div style="font-weight:700; color:${item.valid ? '#334155' : '#b45309'};">${PlanningModule.escapeHtml(item.title || 'Gecersiz kayit')}</div>
                                                            <div style="font-size:0.75rem; color:#64748b; font-family:monospace;">${PlanningModule.escapeHtml(infoLine)}</div>
                                                        </td>
                                                        <td style="padding:0.45rem; text-align:center;"><span style="display:inline-block; border:1px solid #cbd5e1; border-radius:999px; padding:0.12rem 0.55rem; font-size:0.72rem; font-weight:700; color:#334155;">${PlanningModule.escapeHtml(typeLabel)}</span></td>
                                                        <td style="padding:0.45rem; text-align:center;">${canPreview
                                                            ? `<button class="btn-sm" onclick="PlanningModule.openDraftItemPreview('${PlanningModule.escapeJsString(item.id)}')">goruntule</button>`
                                                            : `<span style="display:inline-block; min-width:68px; padding:0.25rem 0.45rem; border:1px solid #e2e8f0; border-radius:0.45rem; color:#94a3b8; font-size:0.76rem;">yok</span>`
                                                        }</td>
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
        const allRows = PlanningModule.getDemands().slice();
        const priorityOrder = ['URGENT', 'HIGH', 'NORMAL', 'LOW'];
        const openRows = allRows
            .filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'OPEN')
            .sort((a, b) => {
                const da = String(a?.dueDate || '9999-12-31');
                const db = String(b?.dueDate || '9999-12-31');
                if (da !== db) return da.localeCompare(db);
                return priorityOrder.indexOf(PlanningModule.getPriorityValue(a?.priority || 'NORMAL'))
                    - priorityOrder.indexOf(PlanningModule.getPriorityValue(b?.priority || 'NORMAL'));
            });
        const releasedRows = allRows
            .filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'RELEASED')
            .sort((a, b) => String(b?.released_at || '').localeCompare(String(a?.released_at || '')));
        const totalOpenQty = openRows.reduce((sum, row) => sum + PlanningModule.parseQty(row?.qty, 0), 0);
        const totalReleasedQty = releasedRows.reduce((sum, row) => sum + PlanningModule.parseQty(row?.qty, 0), 0);
        const expandedDemandId = String(PlanningModule.state.planningPoolExpandedDemandId || '');

        const renderOpenTableRows = () => {
            if (!openRows.length) {
                return `<tr><td colspan="6" style="padding:1rem; text-align:center; color:#94a3b8;">Is emrine donusmeyi bekleyen talep yok.</td></tr>`;
            }
            return openRows.map((row) => {
                const demandId = String(row?.id || '');
                const itemCount = Array.isArray(row?.items) ? row.items.length : 0;
                const displayName = PlanningModule.getDemandDisplayName(row);
                const displayCode = PlanningModule.getDemandDisplayCode(row);
                const poolRows = PlanningModule.getPlanningPoolRows(demandId);
                const summary = PlanningModule.getPlanningPoolSummary(poolRows);
                const isExpanded = expandedDemandId === demandId;
                const analysisReady = poolRows.length > 0;
                const hasOverProduction = poolRows.some((poolRow) => PlanningModule.parseQty(poolRow?.netQty, 0) > PlanningModule.parseQty(poolRow?.requiredQty, 0));
                const processBadgeStyle = analysisReady
                    ? (hasOverProduction
                        ? 'background:#fee2e2; border:1px solid #fecaca; color:#b91c1c;'
                        : 'background:#ffedd5; border:1px solid #fed7aa; color:#c2410c;')
                    : 'background:#f8fafc; border:1px solid #cbd5e1; color:#64748b;';
                const processBadgeLabel = analysisReady
                    ? (hasOverProduction ? 'Fazla kontrolu' : 'Analiz hazir')
                    : 'Analiz bekliyor';
                const priorityBadge = PlanningModule.renderPriorityBadge(row?.priority || 'NORMAL');
                const canConvert = analysisReady && summary.netQty > 0;
                const itemGroups = PlanningModule.getPlanningPoolItemGroups(row);
                const expandedItemMap = (PlanningModule.state.planningPoolExpandedItemByDemand && typeof PlanningModule.state.planningPoolExpandedItemByDemand === 'object')
                    ? PlanningModule.state.planningPoolExpandedItemByDemand
                    : {};
                const expandedItemSet = (expandedItemMap[demandId] && typeof expandedItemMap[demandId] === 'object')
                    ? expandedItemMap[demandId]
                    : {};

                const renderItemRows = (groupRows) => {
                    if (!Array.isArray(groupRows) || !groupRows.length) {
                        return `<tr><td colspan="8" style="padding:0.75rem; color:#94a3b8; text-align:center;">Bu kalem icin patlatma listesi bulunamadi.</td></tr>`;
                    }
                    return groupRows.map((poolRow) => {
                        const key = PlanningModule.escapeJsString(poolRow.key || '');
                        const overStyle = PlanningModule.parseQty(poolRow?.netQty, 0) > PlanningModule.parseQty(poolRow?.requiredQty, 0)
                            ? 'background:#fff1f2; border:1px solid #fecdd3; color:#b91c1c;'
                            : 'background:#fff7ed; border:1px solid #fed7aa; color:#9a3412;';
                        const disabledInput = poolRow.useEnabled ? '' : 'disabled';
                        return `
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:0.5rem;">
                                    <div style="font-weight:700; color:#334155;">${PlanningModule.escapeHtml(poolRow?.name || '-')}</div>
                                    <div style="font-size:0.74rem; color:#64748b; font-family:monospace;">${PlanningModule.escapeHtml(poolRow?.code || '-')}</div>
                                </td>
                                <td style="padding:0.5rem; text-align:center; font-weight:700;">${PlanningModule.escapeHtml(String(poolRow?.requiredQty || 0))}</td>
                                <td style="padding:0.5rem; text-align:center; font-weight:700; color:#0f766e;">${PlanningModule.escapeHtml(String(poolRow?.stockAvailableQty || 0))}</td>
                                <td style="padding:0.5rem; text-align:center; font-weight:700; color:#0f766e;">${PlanningModule.escapeHtml(String(poolRow?.semiAvailableQty || 0))}</td>
                                <td style="padding:0.5rem; text-align:center;">
                                    <input type="number" min="0" ${disabledInput} value="${PlanningModule.escapeHtml(String(poolRow?.useStockQty || 0))}" onchange="PlanningModule.setPlanningPoolRowQty('${PlanningModule.escapeJsString(demandId)}','${key}','useStockQty', this.value)" style="width:96px; height:32px; border:1px solid #67e8f9; border-radius:0.45rem; background:#ecfeff; text-align:center; font-weight:700; ${poolRow.useEnabled ? '' : 'opacity:0.5; cursor:not-allowed;'}">
                                </td>
                                <td style="padding:0.5rem; text-align:center;">
                                    <input type="number" min="0" ${disabledInput} value="${PlanningModule.escapeHtml(String(poolRow?.useSemiQty || 0))}" onchange="PlanningModule.setPlanningPoolRowQty('${PlanningModule.escapeJsString(demandId)}','${key}','useSemiQty', this.value)" style="width:112px; height:32px; border:1px solid #67e8f9; border-radius:0.45rem; background:#ecfeff; text-align:center; font-weight:700; ${poolRow.useEnabled ? '' : 'opacity:0.5; cursor:not-allowed;'}">
                                </td>
                                <td style="padding:0.5rem; text-align:center;">
                                    <input type="checkbox" ${poolRow.useEnabled ? 'checked' : ''} onchange="PlanningModule.setPlanningPoolRowUseEnabled('${PlanningModule.escapeJsString(demandId)}','${key}', this.checked)">
                                </td>
                                <td style="padding:0.5rem; text-align:center;">
                                    <input type="number" min="${PlanningModule.escapeHtml(String(poolRow?.minNetQty || 0))}" value="${PlanningModule.escapeHtml(String(poolRow?.netQty || 0))}" onchange="PlanningModule.setPlanningPoolRowQty('${PlanningModule.escapeJsString(demandId)}','${key}','netQty', this.value)" style="width:112px; height:32px; border-radius:0.45rem; text-align:center; font-weight:800; ${overStyle}">
                                </td>
                            </tr>
                        `;
                    }).join('');
                };

                const itemSectionsHtml = !itemGroups.length
                    ? `<div style="margin-top:0.65rem; border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.7rem; color:#94a3b8;">Bu talep icin kalem bulunamadi.</div>`
                    : itemGroups.map((group, index) => {
                        const groupKey = String(group?.itemKey || `item-${index + 1}`).trim();
                        const isItemExpanded = !!expandedItemSet[groupKey];
                        const groupSummary = PlanningModule.getPlanningPoolSummary(group.rows || []);
                        return `
                            <div style="margin-top:${index === 0 ? '0.65rem' : '0.7rem'}; border:2px solid ${isItemExpanded ? '#60a5fa' : '#93c5fd'}; border-radius:0.75rem; background:${isItemExpanded ? '#eff6ff' : '#f8fbff'};">
                                <div style="padding:0.55rem 0.65rem; display:flex; justify-content:space-between; align-items:center; gap:0.55rem; flex-wrap:wrap; border-bottom:${isItemExpanded ? '1px solid #bfdbfe' : '1px solid #dbeafe'};">
                                    <div>
                                        <div style="font-weight:800; color:#1e293b;">${PlanningModule.escapeHtml(group?.itemName || '-')} <span style="font-family:monospace; color:#1d4ed8;">- ${PlanningModule.escapeHtml(String(group?.itemQty || 0))} ADET</span></div>
                                        <div style="font-size:0.74rem; color:#64748b; font-family:monospace;">${PlanningModule.escapeHtml(group?.itemCode || '-')} / ${PlanningModule.escapeHtml(PlanningModule.getItemTypeLabel(group?.itemType || 'MODEL'))}</div>
                                    </div>
                                    <button class="btn-sm" onclick="PlanningModule.togglePlanningPoolItemExpand('${PlanningModule.escapeJsString(demandId)}','${PlanningModule.escapeJsString(groupKey)}')" style="${isItemExpanded ? 'border-color:#0f172a; background:#0f172a; color:#fff;' : 'border-color:#cbd5e1;'}">${isItemExpanded ? 'kapat' : 'planla'}</button>
                                </div>
                                ${!isItemExpanded ? '' : `
                                    <div style="padding:0 0.6rem 0.6rem 0.6rem;">
                                        <div class="card-table" style="margin-top:0.2rem;">
                                            <table style="width:100%; border-collapse:collapse;">
                                                <thead>
                                                    <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                                                        <th style="padding:0.5rem; text-align:left;">Kalem</th>
                                                        <th style="padding:0.5rem; text-align:center;">Gereken</th>
                                                        <th style="padding:0.5rem; text-align:center;">Stokta var</th>
                                                        <th style="padding:0.5rem; text-align:center;">Yari mamul var</th>
                                                        <th style="padding:0.5rem; text-align:center;">Stoktan kullan</th>
                                                        <th style="padding:0.5rem; text-align:center;">Yari mamul kullan</th>
                                                        <th style="padding:0.5rem; text-align:center;">Kullan</th>
                                                        <th style="padding:0.5rem; text-align:center;">Uretilecek net</th>
                                                    </tr>
                                                </thead>
                                                <tbody>${renderItemRows(group.rows || [])}</tbody>
                                            </table>
                                        </div>
                                        <div style="margin-top:0.5rem; border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.45rem 0.6rem; background:#ffffff;">
                                            <div style="font-size:0.78rem; color:#334155; font-weight:700;">Kalem ozeti: Gereken ${groupSummary.requiredQty} | Karsilanan ${groupSummary.consumedQty} | Net ${groupSummary.netQty}</div>
                                        </div>
                                    </div>
                                `}
                            </div>
                        `;
                    }).join('');

                const expandedHtml = !isExpanded ? '' : `
                    <tr style="background:#f8fbff;">
                        <td colspan="6" style="padding:0.8rem 0.9rem 1rem 0.9rem;">
                            <div style="border:1px solid #bfdbfe; border-radius:0.95rem; background:#ffffff; padding:0.85rem;">
                                <div style="font-weight:800; color:#1e3a8a;">Urun Agaci / Patlatma Detayi - ${PlanningModule.escapeHtml(row?.demandCode || '-')}</div>
                                <div style="font-size:0.76rem; color:#64748b; margin-top:0.2rem;">Kullan secili ise stok/yari mamul dusulur, kalan net uretime gider. Eksik uretim girilemez.</div>
                                ${itemSectionsHtml}
                                <div style="margin-top:0.65rem; border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem 0.7rem; background:#f8fafc;">
                                    <div style="font-size:0.8rem; color:#334155; font-weight:700;">Ozet: Toplam gereken ${summary.requiredQty} | Stok+Yari mamul karsilanan ${summary.consumedQty} | Uretilecek net ${summary.netQty}</div>
                                    <div style="font-size:0.74rem; color:#64748b; margin-top:0.2rem;">Uretilecek net gerekenin altina dusmez. Gerekenin ustu icin donusumde onay istenir.</div>
                                </div>
                                <div style="display:flex; justify-content:flex-end; gap:0.45rem; margin-top:0.65rem;">
                                    <button class="btn-sm" onclick="PlanningModule.togglePlanningPoolExpand('${PlanningModule.escapeJsString(demandId)}')">vazgec</button>
                                    <button class="btn-primary" onclick="PlanningModule.releaseDemandFromPool('${PlanningModule.escapeJsString(demandId)}')" ${canConvert ? '' : 'disabled'} style="${canConvert ? '' : 'opacity:0.45; cursor:not-allowed;'}">is emrine donustur</button>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
                return `
                    <tr style="border-bottom:1px solid #f1f5f9; background:#fffef8;">
                        <td style="padding:0.6rem;">
                            <div style="font-family:monospace; font-weight:700; color:#1d4ed8;">${PlanningModule.escapeHtml(row?.demandCode || '-')}</div>
                            <div style="font-size:0.75rem; color:#64748b;">${PlanningModule.escapeHtml(row?.sourceLabel || 'Stok Uretimi')}</div>
                        </td>
                        <td style="padding:0.6rem;">
                            <div style="font-weight:700; color:#334155;">${PlanningModule.escapeHtml(displayName)}</div>
                            <div style="font-size:0.75rem; color:#64748b;">${PlanningModule.escapeHtml(PlanningModule.getItemTypeLabel(row?.itemType || 'MODEL'))}</div>
                            <div style="font-size:0.75rem; color:#64748b; font-family:monospace;">${PlanningModule.escapeHtml(displayCode)}</div>
                        </td>
                        <td style="padding:0.6rem; text-align:center; font-weight:800;">${PlanningModule.escapeHtml(String(row?.qty || 0))}</td>
                        <td style="padding:0.6rem;"><div>${PlanningModule.escapeHtml(row?.dueDate || '-')}</div><div style="margin-top:0.2rem;">${priorityBadge}</div></td>
                        <td style="padding:0.6rem;"><span style="display:inline-block; border-radius:999px; padding:0.14rem 0.5rem; font-size:0.72rem; font-weight:700; ${processBadgeStyle}">${PlanningModule.escapeHtml(processBadgeLabel)}</span></td>
                        <td style="padding:0.6rem; text-align:right;">
                            <div style="display:inline-flex; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end;">
                                <button class="btn-sm" onclick="PlanningModule.openDemandView('${PlanningModule.escapeJsString(demandId)}')">goruntule</button>
                                <button class="btn-sm" onclick="PlanningModule.togglePlanningPoolExpand('${PlanningModule.escapeJsString(demandId)}')" style="${isExpanded ? 'border-color:#0f172a; background:#0f172a; color:#fff;' : 'border-color:#cbd5e1;'}">planla</button>
                            </div>
                        </td>
                    </tr>
                    ${expandedHtml}
                `;
            }).join('');
        };

        const renderReleasedRows = () => {
            if (!releasedRows.length) {
                return `<tr><td colspan="6" style="padding:1rem; text-align:center; color:#94a3b8;">Henuz is emrine donusen kayit yok.</td></tr>`;
            }
            return releasedRows.map((row) => {
                const displayName = PlanningModule.getDemandDisplayName(row);
                const workOrderCode = Array.isArray(row?.workOrderCodes) && row.workOrderCodes.length
                    ? (row.workOrderCodes.length > 1 ? `${row.workOrderCodes[0]} +${row.workOrderCodes.length - 1}` : row.workOrderCodes[0])
                    : String(row?.workOrderCode || '-');
                return `
                    <tr style="border-bottom:1px solid #f1f5f9;">
                        <td style="padding:0.55rem; font-family:monospace; font-weight:700; color:#1d4ed8;">${PlanningModule.escapeHtml(row?.demandCode || '-')}</td>
                        <td style="padding:0.55rem; font-weight:700; color:#334155;">${PlanningModule.escapeHtml(displayName)}</td>
                        <td style="padding:0.55rem; text-align:center; font-weight:700;">${PlanningModule.escapeHtml(String(row?.qty || 0))}</td>
                        <td style="padding:0.55rem; font-family:monospace; color:#1e40af; font-weight:700;">${PlanningModule.escapeHtml(workOrderCode)}</td>
                        <td style="padding:0.55rem;">${PlanningModule.escapeHtml(row?.released_at ? String(row.released_at).slice(0, 10) : '-')}</td>
                        <td style="padding:0.55rem; text-align:right;">
                            <div style="display:inline-flex; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end;">
                                <button class="btn-sm" onclick="PlanningModule.openDemandView('${PlanningModule.escapeJsString(row?.id || '')}')">goruntule</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        };

        return `
            <section style="max-width:1680px; margin:0 auto;">
                <div style="background:rgba(255,255,255,0.72); border:1px solid #cbd5e1; border-radius:1.8rem; padding:1.2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.85rem; margin-bottom:0.85rem; flex-wrap:wrap;">
                        <div>
                            <h2 class="page-title" style="margin:0;">planlama havuzu</h2>
                            <div style="font-size:0.85rem; color:#64748b; margin-top:0.2rem;">Bu sayfa stok/siparis taleplerini patlatip is emrine donusmeden once kontrol etmek icindir.</div>
                        </div>
                        <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                            <button class="btn-sm" disabled style="opacity:0.7; cursor:default;">filtreler</button>
                            <button class="btn-sm" onclick="PlanningModule.openWorkspace('menu')">geri</button>
                        </div>
                    </div>

                    <div style="display:flex; gap:0.55rem; margin-bottom:0.85rem; flex-wrap:wrap;">
                        <button class="btn-sm" style="background:#0f172a; color:#fff; border-color:#0f172a;">Bekleyen Talepler</button>
                        <button class="btn-sm" onclick="PlanningModule.openWorkspace('released-orders')">Is Emrine Donusenler</button>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.65rem; margin-bottom:0.9rem;">
                        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:0.8rem; padding:0.65rem 0.75rem;">
                            <div style="font-size:0.72rem; color:#64748b;">Bekleyen talep</div>
                            <div style="font-size:1.05rem; font-weight:800; color:#0f172a;">${openRows.length}</div>
                        </div>
                        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:0.8rem; padding:0.65rem 0.75rem;">
                            <div style="font-size:0.72rem; color:#64748b;">Bekleyen toplam adet</div>
                            <div style="font-size:1.05rem; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(totalOpenQty))}</div>
                        </div>
                        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:0.8rem; padding:0.65rem 0.75rem;">
                            <div style="font-size:0.72rem; color:#64748b;">Donusen kayit</div>
                            <div style="font-size:1.05rem; font-weight:800; color:#0f172a;">${releasedRows.length}</div>
                        </div>
                        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:0.8rem; padding:0.65rem 0.75rem;">
                            <div style="font-size:0.72rem; color:#64748b;">Donusen toplam adet</div>
                            <div style="font-size:1.05rem; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(totalReleasedQty))}</div>
                        </div>
                    </div>

                    <div style="background:#ffffff; border:2px solid #fca5a5; border-radius:1rem; padding:0.75rem; margin-bottom:0.95rem;">
                        <div style="font-size:0.82rem; font-weight:800; color:#b91c1c; margin-bottom:0.45rem;">IS EMRINE DONUSMEYI BEKLEYENLER (ONCELIKLI LISTE)</div>
                        <div class="card-table">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                                        <th style="padding:0.6rem; text-align:left;">Talep</th>
                                        <th style="padding:0.6rem; text-align:left;">Urun</th>
                                        <th style="padding:0.6rem; text-align:center;">Adet</th>
                                        <th style="padding:0.6rem; text-align:left;">Termin / Oncelik</th>
                                        <th style="padding:0.6rem; text-align:left;">Durum</th>
                                        <th style="padding:0.6rem; text-align:right;">Islem</th>
                                    </tr>
                                </thead>
                                <tbody>${renderOpenTableRows()}</tbody>
                            </table>
                        </div>
                    </div>

                    <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:1rem; padding:0.75rem;">
                        <div style="font-size:0.82rem; font-weight:800; color:#047857; margin-bottom:0.45rem;">IS EMRINE DONUSENLER (AYRI LISTE)</div>
                        <div class="card-table">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                                        <th style="padding:0.55rem; text-align:left;">Talep</th>
                                        <th style="padding:0.55rem; text-align:left;">Urun</th>
                                        <th style="padding:0.55rem; text-align:center;">Adet</th>
                                        <th style="padding:0.55rem; text-align:left;">Is emri</th>
                                        <th style="padding:0.55rem; text-align:left;">Donusum tarihi</th>
                                        <th style="padding:0.55rem; text-align:right;">Islem</th>
                                    </tr>
                                </thead>
                                <tbody>${renderReleasedRows()}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        `;
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
