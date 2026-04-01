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
        planningPoolRowsByDemand: {},
        planningPoolBuildTokenByDemand: {},
        releasedExpandedDemandId: '',
        releasedExpandedItemByDemand: {},
        releasedArchiveMode: false
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

    getPlanningPoolBuildToken: (demand) => {
        const demandId = String(demand?.id || '').trim();
        if (!demandId) return '';
        const demandUpdated = String(demand?.updated_at || demand?.released_at || '');
        const rawItems = Array.isArray(demand?.items) && demand.items.length
            ? demand.items
            : [{
                id: String(demand?.id || ''),
                itemType: PlanningModule.normalizeDraftItemKind(demand?.itemType || 'MODEL'),
                variantId: String(demand?.variantId || ''),
                componentId: String(demand?.componentId || ''),
                semiFinishedId: String(demand?.semiFinishedId || ''),
                qty: Number(demand?.qty || 0)
            }];
        const itemToken = rawItems.map((item, index) => {
            const kind = PlanningModule.normalizeDraftItemKind(item?.itemType || 'MODEL');
            const qty = PlanningModule.parseQty(item?.qty, 0);
            const variantId = String(item?.variantId || '').trim();
            const componentId = String(item?.componentId || '').trim();
            const semiFinishedId = String(item?.semiFinishedId || '').trim();
            if (kind !== 'MODEL') {
                return `${index}|${kind}|${componentId}|${semiFinishedId}|${qty}`;
            }
            const variant = PlanningModule.findVariantById(variantId);
            const variantUpdated = String(variant?.updated_at || variant?.updatedAt || '');
            const variantItemsToken = (Array.isArray(variant?.items) ? variant.items : [])
                .map((variantItem) => {
                    const source = String(variantItem?.source || 'component').trim().toLowerCase();
                    const refId = String(variantItem?.refId || '').trim();
                    const code = String(variantItem?.code || '').trim().toUpperCase();
                    const itemQty = Math.max(1, PlanningModule.parseQty(variantItem?.qty ?? variantItem?.quantity ?? 1, 1));
                    return `${source}:${refId}:${code}:${itemQty}`;
                })
                .sort()
                .join(',');
            return `${index}|MODEL|${variantId}|${qty}|${variantUpdated}|${variantItemsToken}`;
        }).join('||');
        return `${demandId}|${demandUpdated}|${itemToken}`;
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
    getDemandQtyForDisplay: (demand) => {
        const baseQty = PlanningModule.parseQty(demand?.qty, 0);
        if (String(demand?.status || 'OPEN').toUpperCase() !== 'RELEASED') return baseQty;

        const releasedQty = PlanningModule.parseQty(demand?.releasedQty, 0);
        if (releasedQty > 0) return releasedQty;
        const hasModelItem = PlanningModule.getDemandItems(demand)
            .some((item) => PlanningModule.normalizeDraftItemKind(item?.itemType || 'MODEL') === 'MODEL');
        if (hasModelItem) return baseQty;

        const linkedIds = new Set();
        (Array.isArray(demand?.workOrderIds) ? demand.workOrderIds : []).forEach((id) => {
            const key = String(id || '').trim();
            if (key) linkedIds.add(key);
        });
        const singleId = String(demand?.workOrderId || '').trim();
        if (singleId) linkedIds.add(singleId);
        if (linkedIds.size === 0) return baseQty;

        const orders = Array.isArray(DB.data?.data?.workOrders) ? DB.data.data.workOrders : [];
        const sumFromOrders = orders.reduce((sum, order) => {
            const orderId = String(order?.id || '').trim();
            if (!orderId || !linkedIds.has(orderId)) return sum;
            return sum + PlanningModule.parseQty(order?.lotQty, 0);
        }, 0);
        return sumFromOrders > 0 ? sumFromOrders : baseQty;
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

    getDepotRowCode: (row) => String(row?.productCode || row?.code || row?.itemCode || '').trim().toUpperCase(),

    getDepotRowQty: (row) => {
        const qty = Number(row?.quantity ?? row?.qty ?? row?.amount ?? row?.value ?? 0);
        if (!Number.isFinite(qty) || qty <= 0) return 0;
        return qty;
    },

    setDepotRowQty: (row, qty) => {
        const safeQty = PlanningModule.parseQty(qty, 0);
        if (Object.prototype.hasOwnProperty.call(row, 'quantity') || !Object.prototype.hasOwnProperty.call(row, 'qty')) {
            row.quantity = safeQty;
        }
        if (Object.prototype.hasOwnProperty.call(row, 'qty') || !Object.prototype.hasOwnProperty.call(row, 'quantity')) {
            row.qty = safeQty;
        }
        if (Object.prototype.hasOwnProperty.call(row, 'amount')) row.amount = safeQty;
        if (Object.prototype.hasOwnProperty.call(row, 'value')) row.value = safeQty;
        row.updated_at = new Date().toISOString();
    },

    consumeDepotQuantityByCode: (code, qty) => {
        const target = String(code || '').trim().toUpperCase();
        let remaining = PlanningModule.parseQty(qty, 0);
        if (!target || remaining <= 0) return 0;
        const stockRows = Array.isArray(DB.data?.data?.stockDepotItems) ? DB.data.data.stockDepotItems : [];
        const legacyRows = Array.isArray(DB.data?.data?.inventory) ? DB.data.data.inventory : [];
        const consumeFromRows = (rows) => {
            const candidates = rows
                .filter((row) => PlanningModule.getDepotRowCode(row) === target)
                .sort((a, b) => String(a?.created_at || '').localeCompare(String(b?.created_at || '')));
            candidates.forEach((row) => {
                if (remaining <= 0) return;
                const available = PlanningModule.getDepotRowQty(row);
                if (available <= 0) return;
                const used = Math.min(available, remaining);
                PlanningModule.setDepotRowQty(row, available - used);
                remaining -= used;
            });
        };
        consumeFromRows(stockRows);
        if (remaining > 0) consumeFromRows(legacyRows);
        return PlanningModule.parseQty(qty, 0) - remaining;
    },

    increaseDepotQuantityByCode: (code, name, qty) => {
        const target = String(code || '').trim().toUpperCase();
        const addQty = PlanningModule.parseQty(qty, 0);
        if (!target || addQty <= 0) return;
        if (!Array.isArray(DB.data?.data?.stockDepotItems)) DB.data.data.stockDepotItems = [];
        const stockRows = DB.data.data.stockDepotItems;
        const existing = stockRows.find((row) => PlanningModule.getDepotRowCode(row) === target);
        if (existing) {
            PlanningModule.setDepotRowQty(existing, PlanningModule.getDepotRowQty(existing) + addQty);
            return;
        }
        const locations = Array.isArray(DB.data?.data?.stockDepotLocations) ? DB.data.data.stockDepotLocations : [];
        const mainLocation = locations.find((row) => String(row?.depotId || '') === 'main') || null;
        const now = new Date().toISOString();
        stockRows.push({
            id: crypto.randomUUID(),
            productCode: target,
            code: target,
            productName: String(name || target || '-'),
            name: String(name || target || '-'),
            quantity: addQty,
            qty: addQty,
            amount: addQty,
            unit: 'ADET',
            status: 'bitmis',
            depotId: 'main',
            locationId: String(mainLocation?.id || ''),
            created_at: now,
            updated_at: now
        });
    },

    getPoolConsumptionMap: (poolRows) => {
        const map = new Map();
        (Array.isArray(poolRows) ? poolRows : []).forEach((row) => {
            if (!row || !row.useEnabled) return;
            const code = String(row?.code || '').trim().toUpperCase();
            const qty = PlanningModule.parseQty(row?.useStockQty, 0) + PlanningModule.parseQty(row?.useSemiQty, 0);
            if (!code || qty <= 0) return;
            map.set(code, (map.get(code) || 0) + qty);
        });
        return map;
    },

    validatePoolRowsDepotConsumption: (poolRows) => {
        const consumptionMap = PlanningModule.getPoolConsumptionMap(poolRows);
        for (const [code, qty] of consumptionMap.entries()) {
            const available = PlanningModule.parseQty(PlanningModule.getDepotQuantityByCode(code), 0);
            if (qty > available) {
                throw new Error(`${code} stok miktari guncellenmis. Yeniden planlayip tekrar deneyin.`);
            }
        }
        return consumptionMap;
    },

    consumePoolRowsFromDepot: (poolRows, consumptionMapInput = null) => {
        const consumptionMap = consumptionMapInput instanceof Map
            ? consumptionMapInput
            : PlanningModule.getPoolConsumptionMap(poolRows);
        for (const [code, qty] of consumptionMap.entries()) {
            const consumed = PlanningModule.consumeDepotQuantityByCode(code, qty);
            if (consumed < qty) {
                throw new Error(`${code} stoktan dusulemedi. Yeniden deneyin.`);
            }
        }
    },

    rollbackDemandPoolConsumption: (demand) => {
        const rows = Array.isArray(demand?.poolAnalysis?.rows) ? demand.poolAnalysis.rows : [];
        rows.forEach((row) => {
            if (!row || !row.useEnabled) return;
            const code = String(row?.code || '').trim().toUpperCase();
            const name = String(row?.name || code || '-').trim();
            const qty = PlanningModule.parseQty(row?.useStockQty, 0) + PlanningModule.parseQty(row?.useSemiQty, 0);
            if (!code || qty <= 0) return;
            PlanningModule.increaseDepotQuantityByCode(code, name, qty);
        });
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
        const approved = !!row?.approved;
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
            approved,
            useStockQty,
            useSemiQty,
            minNetQty,
            netQty
        };
    },

    buildPoolRow: ({ key, code, name, sourceType, componentLibrary, componentId, requiredQty, itemKey, itemName, itemCode, itemQty, itemType, missingRef, missingReason, missingRefCode, missingRefId }) => {
        const safeCode = String(code || '').trim().toUpperCase();
        const qty = PlanningModule.parseQty(requiredQty, 0);
        const isSemi = String(componentLibrary || '').toUpperCase() === 'SEMI';
        const isMissingRef = !!missingRef;
        const availableQty = isMissingRef ? 0 : PlanningModule.parseQty(PlanningModule.getDepotQuantityByCode(safeCode), 0);
        const stockAvailableQty = isSemi ? 0 : availableQty;
        const semiAvailableQty = isSemi ? availableQty : 0;
        const useEnabled = !isMissingRef && (stockAvailableQty + semiAvailableQty) > 0;
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
            missingRef: isMissingRef,
            missingReason: String(missingReason || '').trim(),
            missingRefCode: String(missingRefCode || safeCode).trim().toUpperCase(),
            missingRefId: String(missingRefId || '').trim(),
            requiredQty: qty,
            stockAvailableQty,
            semiAvailableQty,
            useEnabled,
            approved: false,
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
                const multiplier = Math.max(1, PlanningModule.parseQty(variantItem?.qty ?? variantItem?.quantity ?? 1, 1));
                const targetQty = qty * multiplier;
                const source = String(variantItem?.source || 'component').trim().toLowerCase();
                const refId = String(variantItem?.refId || '').trim();
                const likelySemi = source === 'semi' || source === 'yarimamul' || source === 'semi-finished' || refCode.startsWith('YRM-');
                if (likelySemi) {
                    const semi = PlanningModule.findSemiFinishedById(refId) || PlanningModule.findSemiCardByCodeOrId(refCode, refId);
                    if (!semi) {
                        const fallbackCode = refCode || String(variantItem?.code || '').trim().toUpperCase() || 'SEMI-KOD-YOK';
                        addOrMerge(createRow({
                            key: `MISSING:SEMI:${refId || fallbackCode}`,
                            code: fallbackCode,
                            name: `${String(variantItem?.name || fallbackCode || 'Yari mamul').trim()} (kart bulunamadi)`,
                            sourceType: 'MODEL',
                            componentLibrary: 'SEMI',
                            componentId: '',
                            requiredQty: targetQty,
                            missingRef: true,
                            missingReason: 'Yari mamul karti bulunamadi.',
                            missingRefCode: fallbackCode,
                            missingRefId: refId
                        }));
                        return;
                    }
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
                if (!component) {
                    const fallbackCode = refCode || String(variantItem?.code || '').trim().toUpperCase() || 'PRC-KOD-YOK';
                    addOrMerge(createRow({
                        key: `MISSING:PART:${refId || fallbackCode}`,
                        code: fallbackCode,
                        name: `${String(variantItem?.name || fallbackCode || 'Parca').trim()} (kart bulunamadi)`,
                        sourceType: 'MODEL',
                        componentLibrary: 'PART',
                        componentId: '',
                        requiredQty: targetQty,
                        missingRef: true,
                        missingReason: 'Parca karti bulunamadi.',
                        missingRefCode: fallbackCode,
                        missingRefId: refId
                    }));
                    return;
                }
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
        if (!PlanningModule.state.planningPoolBuildTokenByDemand || typeof PlanningModule.state.planningPoolBuildTokenByDemand !== 'object') {
            PlanningModule.state.planningPoolBuildTokenByDemand = {};
        }
        const nextBuildToken = PlanningModule.getPlanningPoolBuildToken(demand);
        const cached = PlanningModule.state.planningPoolRowsByDemand[key];
        if (Array.isArray(cached) && cached.length > 0) {
            const legacyRows = cached.some((row) => !String(row?.itemKey || '').trim());
            const cachedToken = String(PlanningModule.state.planningPoolBuildTokenByDemand[key] || '');
            const tokenMismatch = cachedToken !== String(nextBuildToken || '');
            if (legacyRows || tokenMismatch) {
                const rebuilt = PlanningModule.buildPlanningPoolRowsForDemand(demand);
                PlanningModule.state.planningPoolRowsByDemand[key] = rebuilt;
                PlanningModule.state.planningPoolBuildTokenByDemand[key] = nextBuildToken;
                return rebuilt;
            }
            const synced = PlanningModule.syncPlanningPoolRowsWithAvailability(cached);
            PlanningModule.state.planningPoolRowsByDemand[key] = synced;
            return synced;
        }
        const built = PlanningModule.buildPlanningPoolRowsForDemand(demand);
        PlanningModule.state.planningPoolRowsByDemand[key] = built;
        PlanningModule.state.planningPoolBuildTokenByDemand[key] = nextBuildToken;
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
        const isMissing = !!target?.missingRef || !String(target?.componentId || '').trim();
        if (isMissing) {
            target.useEnabled = false;
            target.useStockQty = 0;
            target.useSemiQty = 0;
            const normalized = PlanningModule.normalizePoolRow(target);
            Object.assign(target, normalized);
            UI.renderCurrentPage();
            return;
        }
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

    setPlanningPoolRowApproved: (demandId, rowKey, checked) => {
        const rows = PlanningModule.getPlanningPoolRows(demandId);
        const target = rows.find((row) => String(row?.key || '') === String(rowKey || ''));
        if (!target) return;
        const isMissing = !!target?.missingRef || !String(target?.componentId || '').trim();
        if (checked && isMissing) {
            alert(`Bu satirda kart bulunamadi: ${target?.missingRefCode || target?.code || '-'}. Once urun kutuphanesini duzeltiniz.`);
            return;
        }
        target.approved = !!checked;
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
        ReadOnlyViewer.openByCode(raw, { modalOptions: { closeExisting: false } });
    },

    renderLiveCodeButton: (code) => {
        const raw = String(code || '').trim();
        if (!raw) return '-';
        return `<button class="btn-sm" style="padding:0.1rem 0.45rem; min-height:24px; border:1px solid #93c5fd; background:#eff6ff; color:#1d4ed8; font-family:monospace; font-weight:800;" onclick="PlanningModule.openReadOnlyCodeModal('${PlanningModule.escapeJsString(raw)}')">${PlanningModule.escapeHtml(raw)}</button>`;
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
        if (PlanningModule.state.workspaceView === 'planning-pool') {
            PlanningModule.state.planningPoolRowsByDemand = {};
            PlanningModule.state.planningPoolBuildTokenByDemand = {};
        }
        if (PlanningModule.state.workspaceView !== 'released-orders') {
            PlanningModule.state.releasedExpandedDemandId = '';
            PlanningModule.state.releasedExpandedItemByDemand = {};
            PlanningModule.state.releasedArchiveMode = false;
        }
        if (PlanningModule.state.workspaceView === 'stock-production' && !PlanningModule.state.stockDraftDueDate) {
            PlanningModule.resetStockDraft();
        }
        UI.renderCurrentPage();
    },
    setReleasedArchiveMode: (enabled) => {
        PlanningModule.state.releasedArchiveMode = !!enabled;
        PlanningModule.state.releasedExpandedDemandId = '';
        PlanningModule.state.releasedExpandedItemByDemand = {};
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
        if (PlanningModule.state.planningPoolBuildTokenByDemand && typeof PlanningModule.state.planningPoolBuildTokenByDemand === 'object') {
            delete PlanningModule.state.planningPoolBuildTokenByDemand[String(demand.id || '')];
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
        const poolRows = poolRowsRaw.map((row) => PlanningModule.normalizePoolRow(row));
        const poolRowsForOrders = poolRows.filter((row) => PlanningModule.parseQty(row?.netQty, 0) > 0);
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
        let poolConsumptionMap = new Map();
        if (poolRows.length > 0) {
            poolConsumptionMap = PlanningModule.validatePoolRowsDepotConsumption(poolRows);
            orders = poolRowsForOrders.map((row) => {
                const componentId = String(row?.componentId || '').trim();
                const componentLibrary = String(row?.componentLibrary || '').trim().toUpperCase() === 'SEMI' ? 'SEMI' : 'PART';
                const qty = PlanningModule.parseQty(row?.netQty, 0);
                const demandItem = demandItems.find((item) => String(item?.id || '') === String(row?.itemKey || '')) || null;
                if (!componentId || qty <= 0) {
                    const refCode = String(row?.missingRefCode || row?.code || '-').trim();
                    throw new Error(`Patlatma satirinda kart eksik: ${refCode}. Is emri olusturulamadi.`);
                }
                return UnitModule.createWorkOrderFromComponentCard({
                    componentId,
                    componentLibrary,
                    lotQty: qty,
                    dueDate: String(demand.dueDate || ''),
                    priority: PlanningModule.getPriorityValue(demand.priority || 'NORMAL'),
                    note: String(demand.note || '').trim(),
                    sourceType: componentLibrary === 'SEMI' ? 'PLAN_POOL_SEMI' : 'PLAN_POOL_COMPONENT',
                    sourceId,
                    sourceCode,
                    sourceItemKey: String(row?.itemKey || demandItem?.id || ''),
                    sourceItemName: String(row?.itemName || demandItem?.productName || demand?.productName || ''),
                    sourceItemCode: String(row?.itemCode || PlanningModule.getDemandItemCode(demandItem || {}) || ''),
                    sourceItemQty: PlanningModule.parseQty(row?.itemQty, PlanningModule.parseQty(demandItem?.qty, qty))
                });
            });
        } else {
            demandItems.forEach(validateDemandItem);
            orders = demandItems.map((item) => {
                const kind = PlanningModule.normalizeDraftItemKind(item?.itemType);
                const qty = Number(item?.qty || 0);
                const sourceItemCode = PlanningModule.getDemandItemCode(item);
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
                        sourceCode,
                        sourceItemKey: String(item?.id || ''),
                        sourceItemName: String(item?.productName || demand?.productName || ''),
                        sourceItemCode,
                        sourceItemQty: PlanningModule.parseQty(item?.qty, qty)
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
                    sourceCode,
                    sourceItemKey: String(item?.id || ''),
                    sourceItemName: String(item?.productName || demand?.productName || ''),
                    sourceItemCode,
                    sourceItemQty: PlanningModule.parseQty(item?.qty, qty)
                });
            });
        }
        if (!orders.length) throw new Error('Is emrine donusecek kalem bulunamadi.');
        if (poolRows.length > 0 && poolConsumptionMap.size > 0) {
            PlanningModule.consumePoolRowsFromDepot(poolRows, poolConsumptionMap);
        }

        let releasedQty = PlanningModule.parseQty(demand?.qty, 0);
        if (poolRows.length > 0) {
            const hasModelItem = demandItems.some((item) => PlanningModule.normalizeDraftItemKind(item?.itemType || 'MODEL') === 'MODEL');
            if (!hasModelItem) {
                const approvedNetQty = poolRowsForOrders.reduce((sum, row) => sum + PlanningModule.parseQty(row?.netQty, 0), 0);
                if (approvedNetQty > 0) releasedQty = approvedNetQty;
            }
        } else {
            const totalOrderQty = orders.reduce((sum, order) => sum + PlanningModule.parseQty(order?.lotQty, 0), 0);
            if (totalOrderQty > 0) releasedQty = totalOrderQty;
        }

        const primaryOrder = orders[0] || null;
        const now = new Date().toISOString();
        demand.status = 'RELEASED';
        demand.releasedQty = releasedQty;
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
                    itemKey: String(row?.itemKey || ''),
                    itemName: String(row?.itemName || ''),
                    itemCode: String(row?.itemCode || ''),
                    itemQty: PlanningModule.parseQty(row?.itemQty, 0),
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
        if (PlanningModule.state.planningPoolBuildTokenByDemand && typeof PlanningModule.state.planningPoolBuildTokenByDemand === 'object') {
            delete PlanningModule.state.planningPoolBuildTokenByDemand[String(demand.id || '')];
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
        const approvedRows = rows.filter((row) => !!row?.approved);
        if (!approvedRows.length) {
            alert('Lutfen is emrine donecek satirlari onay kutusundan seciniz.');
            return;
        }
        const missingRows = approvedRows.filter((row) => !!row?.missingRef || !String(row?.componentId || '').trim());
        if (missingRows.length > 0) {
            const preview = missingRows.slice(0, 4).map((row) => String(row?.missingRefCode || row?.code || '-')).join(', ');
            const suffix = missingRows.length > 4 ? ' ...' : '';
            alert(`Karti bulunamayan kalemler var: ${preview}${suffix}. Once urun kutuphanesinden duzeltiniz.`);
            return;
        }
        const invalidLow = approvedRows.find((row) => PlanningModule.parseQty(row?.netQty, 0) < PlanningModule.parseQty(row?.minNetQty, 0));
        if (invalidLow) {
            alert(`Eksik uretim girilemez: ${invalidLow.name || invalidLow.code}`);
            return;
        }
        const overRows = approvedRows.filter((row) => PlanningModule.parseQty(row?.netQty, 0) > PlanningModule.parseQty(row?.requiredQty, 0));
        if (overRows.length > 0) {
            const preview = overRows.slice(0, 4).map((row) => `${row.code || '-'} (${row.netQty}/${row.requiredQty})`).join(', ');
            const msg = `Bazi satirlarda fazla uretim var: ${preview}${overRows.length > 4 ? ' ...' : ''}. Onayliyor musunuz?`;
            if (!confirm(msg)) return;
        }
        const nonZeroRows = approvedRows.filter((row) => PlanningModule.parseQty(row?.netQty, 0) > 0);
        if (!nonZeroRows.length) {
            alert('Secili satirlarda uretilecek net 0 oldugu icin is emri olusturulamadi.');
            return;
        }
        try {
            PlanningModule.releaseDemandInternal(demand, { poolRows: approvedRows });
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
        const linkedIds = PlanningModule.getDemandLinkedWorkOrderIds(row);
        DB.data.data.planningDemands = all.filter((item) => String(item?.id || '') !== String(demandId || ''));
        if (linkedIds.size > 0 && Array.isArray(DB.data?.data?.workOrders)) {
            DB.data.data.workOrders = DB.data.data.workOrders.filter((order) => !linkedIds.has(String(order?.id || '')));
        }
        if (linkedIds.size > 0 && Array.isArray(DB.data?.data?.workOrderTransactions)) {
            DB.data.data.workOrderTransactions = DB.data.data.workOrderTransactions.filter((txn) => !linkedIds.has(String(txn?.workOrderId || '')));
        }
        PlanningModule.purgeDispatchNotesByWorkOrderIds(linkedIds);
        if (PlanningModule.state.planningPoolRowsByDemand && typeof PlanningModule.state.planningPoolRowsByDemand === 'object') {
            delete PlanningModule.state.planningPoolRowsByDemand[String(demandId || '')];
        }
        if (PlanningModule.state.planningPoolBuildTokenByDemand && typeof PlanningModule.state.planningPoolBuildTokenByDemand === 'object') {
            delete PlanningModule.state.planningPoolBuildTokenByDemand[String(demandId || '')];
        }
        if (String(PlanningModule.state.planningPoolExpandedDemandId || '') === String(demandId || '')) {
            PlanningModule.state.planningPoolExpandedDemandId = '';
        }
        if (PlanningModule.state.planningPoolExpandedItemByDemand && typeof PlanningModule.state.planningPoolExpandedItemByDemand === 'object') {
            delete PlanningModule.state.planningPoolExpandedItemByDemand[String(demandId || '')];
        }
        if (String(PlanningModule.state.stockDraftEditingId || '') === String(demandId || '')) PlanningModule.resetStockDraft();
        if (String(PlanningModule.state.releasedExpandedDemandId || '') === String(demandId || '')) {
            PlanningModule.state.releasedExpandedDemandId = '';
        }
        if (PlanningModule.state.releasedExpandedItemByDemand && typeof PlanningModule.state.releasedExpandedItemByDemand === 'object') {
            delete PlanningModule.state.releasedExpandedItemByDemand[String(demandId || '')];
        }
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
    purgeDispatchNotesByWorkOrderIds: (linkedIds) => {
        if (!(linkedIds instanceof Set) || linkedIds.size === 0) return;
        if (!Array.isArray(DB.data?.data?.workOrderDispatchNotes)) return;
        const now = new Date().toISOString();
        let changed = false;
        const nextNotes = [];
        (DB.data.data.workOrderDispatchNotes || []).forEach((note) => {
            const rows = Array.isArray(note?.rows) ? note.rows : [];
            if (!rows.length) {
                nextNotes.push(note);
                return;
            }
            const keptRows = rows.filter((row) => !linkedIds.has(String(row?.workOrderId || '')));
            if (keptRows.length === rows.length) {
                nextNotes.push(note);
                return;
            }
            changed = true;
            if (keptRows.length === 0) return;
            const updated = {
                ...note,
                rows: keptRows,
                updated_at: now,
                updated_by: 'Demo User'
            };
            if (typeof UnitModule !== 'undefined'
                && UnitModule
                && typeof UnitModule.buildWorkOrderDispatchPdfHtml === 'function') {
                updated.documentHtml = UnitModule.buildWorkOrderDispatchPdfHtml(updated);
            }
            nextNotes.push(updated);
        });
        if (changed) DB.data.data.workOrderDispatchNotes = nextNotes;
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

        PlanningModule.rollbackDemandPoolConsumption(demand);
        DB.data.data.planningDemands = all.filter((item) => String(item?.id || '') !== String(demandId || ''));

        if (Array.isArray(DB.data?.data?.workOrders)) {
            DB.data.data.workOrders = DB.data.data.workOrders.filter((order) => !linkedIds.has(String(order?.id || '')));
        }
        if (Array.isArray(DB.data?.data?.workOrderTransactions)) {
            DB.data.data.workOrderTransactions = DB.data.data.workOrderTransactions.filter((txn) => !linkedIds.has(String(txn?.workOrderId || '')));
        }
        PlanningModule.purgeDispatchNotesByWorkOrderIds(linkedIds);

        if (PlanningModule.state.planningPoolRowsByDemand && typeof PlanningModule.state.planningPoolRowsByDemand === 'object') {
            delete PlanningModule.state.planningPoolRowsByDemand[String(demandId || '')];
        }
        if (PlanningModule.state.planningPoolBuildTokenByDemand && typeof PlanningModule.state.planningPoolBuildTokenByDemand === 'object') {
            delete PlanningModule.state.planningPoolBuildTokenByDemand[String(demandId || '')];
        }
        if (String(PlanningModule.state.planningPoolExpandedDemandId || '') === String(demandId || '')) {
            PlanningModule.state.planningPoolExpandedDemandId = '';
        }
        if (PlanningModule.state.planningPoolExpandedItemByDemand && typeof PlanningModule.state.planningPoolExpandedItemByDemand === 'object') {
            delete PlanningModule.state.planningPoolExpandedItemByDemand[String(demandId || '')];
        }
        if (String(PlanningModule.state.releasedExpandedDemandId || '') === String(demandId || '')) {
            PlanningModule.state.releasedExpandedDemandId = '';
        }
        if (PlanningModule.state.releasedExpandedItemByDemand && typeof PlanningModule.state.releasedExpandedItemByDemand === 'object') {
            delete PlanningModule.state.releasedExpandedItemByDemand[String(demandId || '')];
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
            const displayQty = released ? PlanningModule.getDemandQtyForDisplay(row) : PlanningModule.parseQty(row?.qty, 0);
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
                    <td style="padding:0.6rem; text-align:center; font-weight:800;">${PlanningModule.escapeHtml(String(displayQty))}</td>
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
            const displayQty = released ? PlanningModule.getDemandQtyForDisplay(row) : PlanningModule.parseQty(row?.qty, 0);
            return `
                <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:0.6rem;"><div style="font-family:monospace; font-weight:700; color:#1d4ed8;">${PlanningModule.escapeHtml(row?.demandCode || '-')}</div></td>
                    <td style="padding:0.6rem;"><div style="font-weight:700; color:#334155;">${PlanningModule.escapeHtml(displayName)}</div><div style="font-size:0.75rem; color:#64748b;">${PlanningModule.escapeHtml(PlanningModule.getItemTypeLabel(row?.itemType || 'MODEL'))}</div></td>
                    <td style="padding:0.6rem; font-family:monospace;">${PlanningModule.escapeHtml(displayCode)}</td>
                    <td style="padding:0.6rem; text-align:center; font-weight:800;">${PlanningModule.escapeHtml(String(displayQty))}</td>
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
            { id: 'released-orders', icon: 'file-check-2', label: 'Is Emrine Donusenler', tone: 'g-pink', meta: `${releasedCount} donusen` }
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
        const planningPoolOpenCount = PlanningModule.getDemands()
            .filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'OPEN')
            .length;

        if (!isFormOpen) {
            return `
                <section style="max-width:1680px; margin:0 auto;">
                    <div style="background:rgba(255,255,255,0.72); border:1px solid #cbd5e1; border-radius:1.8rem; padding:1.35rem;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:0.9rem; flex-wrap:wrap;">
                            <div>
                                <h2 class="page-title" style="margin:0;">planlama / stok icin uretim</h2>
                                <div style="color:#64748b; margin-top:0.2rem;">Buradan depoya hazir tutulacak urun icin talep acabilir ve istersek aninda is emrine cevirebiliriz.</div>
                            </div>
                            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                                <button class="btn-sm" onclick="PlanningModule.openWorkspace('planning-pool')" style="border-color:#bfdbfe; color:#1d4ed8; background:#eff6ff; font-weight:700;">planlama havuzu (${planningPoolOpenCount})</button>
                                <button class="btn-primary" onclick="PlanningModule.openStockDemandForm(true)" style="min-width:170px;">yeni talep +</button>
                            </div>
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
        const totalReleasedQty = releasedRows.reduce((sum, row) => sum + PlanningModule.getDemandQtyForDisplay(row), 0);
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
                const approvedRows = poolRows.filter((poolRow) => !!poolRow?.approved);
                const approvedNetQty = approvedRows.reduce((sum, poolRow) => sum + PlanningModule.parseQty(poolRow?.netQty, 0), 0);
                const canConvert = analysisReady && approvedRows.length > 0 && approvedNetQty > 0;
                const itemGroups = PlanningModule.getPlanningPoolItemGroups(row);
                const expandedItemMap = (PlanningModule.state.planningPoolExpandedItemByDemand && typeof PlanningModule.state.planningPoolExpandedItemByDemand === 'object')
                    ? PlanningModule.state.planningPoolExpandedItemByDemand
                    : {};
                const expandedItemSet = (expandedItemMap[demandId] && typeof expandedItemMap[demandId] === 'object')
                    ? expandedItemMap[demandId]
                    : {};

                const renderItemRows = (groupRows) => {
                    if (!Array.isArray(groupRows) || !groupRows.length) {
                        return `<tr><td colspan="9" style="padding:0.75rem; color:#94a3b8; text-align:center;">Bu kalem icin patlatma listesi bulunamadi.</td></tr>`;
                    }
                    return groupRows.map((poolRow) => {
                        const key = PlanningModule.escapeJsString(poolRow.key || '');
                        const code = String(poolRow?.code || '').trim();
                        const isMissing = !!poolRow?.missingRef || !String(poolRow?.componentId || '').trim();
                        const overStyle = PlanningModule.parseQty(poolRow?.netQty, 0) > PlanningModule.parseQty(poolRow?.requiredQty, 0)
                            ? 'background:#fff1f2; border:1px solid #fecdd3; color:#b91c1c;'
                            : 'background:#fff7ed; border:1px solid #fed7aa; color:#9a3412;';
                        const netStyle = isMissing
                            ? 'background:#fef2f2; border:1px solid #fecaca; color:#b91c1c;'
                            : overStyle;
                        const disabledInput = poolRow.useEnabled && !isMissing ? '' : 'disabled';
                        const missingHint = isMissing
                            ? `<div style="font-size:0.7rem; color:#b91c1c; margin-top:0.15rem;">Kart bulunamadi. Urun kutuphanesinden kalemi duzeltin.</div>`
                            : '';
                        return `
                            <tr style="border-bottom:1px solid #f1f5f9; ${isMissing ? 'background:#fff7f7;' : ''}">
                                <td style="padding:0.5rem;">
                                    <div style="font-weight:700; color:#334155;">${PlanningModule.escapeHtml(poolRow?.name || '-')}</div>
                                    <div style="font-size:0.74rem; color:#1d4ed8; font-family:monospace;">
                                        ${PlanningModule.renderLiveCodeButton(code)}
                                    </div>
                                    ${missingHint}
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
                                    <input type="checkbox" ${poolRow.useEnabled && !isMissing ? 'checked' : ''} ${isMissing ? 'disabled' : ''} onchange="PlanningModule.setPlanningPoolRowUseEnabled('${PlanningModule.escapeJsString(demandId)}','${key}', this.checked)">
                                </td>
                                <td style="padding:0.5rem; text-align:center;">
                                    <input type="number" min="${PlanningModule.escapeHtml(String(poolRow?.minNetQty || 0))}" value="${PlanningModule.escapeHtml(String(poolRow?.netQty || 0))}" ${isMissing ? 'disabled' : ''} onchange="PlanningModule.setPlanningPoolRowQty('${PlanningModule.escapeJsString(demandId)}','${key}','netQty', this.value)" style="width:112px; height:32px; border-radius:0.45rem; text-align:center; font-weight:800; ${netStyle} ${isMissing ? 'opacity:0.65; cursor:not-allowed;' : ''}">
                                </td>
                                <td style="padding:0.5rem; text-align:center;">
                                    <input type="checkbox" ${poolRow.approved ? 'checked' : ''} ${isMissing ? 'disabled' : ''} onchange="PlanningModule.setPlanningPoolRowApproved('${PlanningModule.escapeJsString(demandId)}','${key}', this.checked)">
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
                                        <div style="font-size:0.74rem; color:#1d4ed8; font-family:monospace;">
                                            ${PlanningModule.renderLiveCodeButton(String(group?.itemCode || '').trim())}
                                            / ${PlanningModule.escapeHtml(PlanningModule.getItemTypeLabel(group?.itemType || 'MODEL'))}
                                        </div>
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
                                                        <th style="padding:0.5rem; text-align:center;">Onay</th>
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
                        <td style="padding:0.55rem; text-align:center; font-weight:700;">${PlanningModule.escapeHtml(String(PlanningModule.getDemandQtyForDisplay(row)))}</td>
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

    toggleReleasedDemandExpand: (demandId) => {
        const key = String(demandId || '').trim();
        const same = String(PlanningModule.state.releasedExpandedDemandId || '') === key;
        PlanningModule.state.releasedExpandedDemandId = same ? '' : key;
        if (same) {
            delete PlanningModule.state.releasedExpandedItemByDemand[key];
        } else if (!PlanningModule.state.releasedExpandedItemByDemand[key]) {
            PlanningModule.state.releasedExpandedItemByDemand[key] = {};
        }
        UI.renderCurrentPage();
    },

    toggleReleasedItemExpand: (demandId, itemKey) => {
        const demandKey = String(demandId || '').trim();
        const key = String(itemKey || '').trim();
        if (!demandKey || !key) return;
        if (!PlanningModule.state.releasedExpandedItemByDemand[demandKey] || typeof PlanningModule.state.releasedExpandedItemByDemand[demandKey] !== 'object') {
            PlanningModule.state.releasedExpandedItemByDemand[demandKey] = {};
        }
        const next = { ...PlanningModule.state.releasedExpandedItemByDemand[demandKey] };
        next[key] = !next[key];
        PlanningModule.state.releasedExpandedItemByDemand[demandKey] = next;
        UI.renderCurrentPage();
    },

    getLinkedWorkOrdersForDemand: (demand) => {
        const linkedIds = PlanningModule.getDemandLinkedWorkOrderIds(demand);
        const demandId = String(demand?.id || '').trim();
        const demandCode = String(demand?.demandCode || '').trim();
        const orders = Array.isArray(DB.data?.data?.workOrders) ? DB.data.data.workOrders : [];
        return orders
            .filter((order) => {
                const orderId = String(order?.id || '').trim();
                if (linkedIds.has(orderId)) return true;
                const sourceId = String(order?.sourceId || '').trim();
                const sourceCode = String(order?.sourceCode || '').trim();
                if (demandId && sourceId === demandId) return true;
                if (demandCode && sourceCode === demandCode) return true;
                return false;
            })
            .sort((a, b) => String(a?.workOrderCode || '').localeCompare(String(b?.workOrderCode || ''), 'tr'));
    },

    getWorkTxnQtyByKey: (txns, workOrderId, lineId, stationId, type) => {
        if (!Array.isArray(txns)) return 0;
        const orderKey = String(workOrderId || '');
        const lineKey = String(lineId || '');
        const stationKey = String(stationId || '');
        const typeKey = String(type || '').toUpperCase();
        return txns.reduce((sum, txn) => {
            if (String(txn?.workOrderId || '') !== orderKey) return sum;
            if (String(txn?.lineId || '') !== lineKey) return sum;
            if (String(txn?.stationId || '') !== stationKey) return sum;
            if (String(txn?.type || '').toUpperCase() !== typeKey) return sum;
            return sum + PlanningModule.parseQty(txn?.qty, 0);
        }, 0);
    },

    getRouteStationLabel: (route) => {
        const direct = String(route?.stationName || '').trim();
        if (direct) return direct;
        const stationId = String(route?.stationId || '').trim();
        if (!stationId) return '-';
        if (typeof UnitModule !== 'undefined' && UnitModule && typeof UnitModule.getRouteStationName === 'function') {
            return String(UnitModule.getRouteStationName(stationId) || stationId);
        }
        return stationId;
    },

    isDepotTransferStation: (stationId) => String(stationId || '').trim().toLowerCase() === 'u_dtm',

    getReleasedLineProgress: (order, line, txns) => {
        const targetQty = PlanningModule.parseQty(line?.targetQty, 0);
        const routes = Array.isArray(line?.routes) ? line.routes : [];
        if (!routes.length) {
            return {
                targetQty,
                finalDoneQty: targetQty,
                finalStoredQty: targetQty,
                remainingQty: 0,
                storageRemainingQty: 0,
                isFinished: true,
                isStored: true,
                currentStationName: 'Montaji bekliyor',
                completedStationCount: 0,
                routeCount: 0,
                steps: [],
                stationLoads: []
            };
        }

        const baseSteps = [];
        routes.forEach((route, index) => {
            const prevDoneQty = index === 0 ? targetQty : PlanningModule.parseQty(baseSteps[index - 1]?.doneQty, 0);
            const inputQty = PlanningModule.parseQty(prevDoneQty, 0);
            const stationId = String(route?.stationId || '').trim();
            const isFinalStep = index === routes.length - 1;
            const doneRaw = PlanningModule.getWorkTxnQtyByKey(txns, order?.id, line?.id, stationId, 'COMPLETE');
            const takenRaw = PlanningModule.getWorkTxnQtyByKey(txns, order?.id, line?.id, stationId, 'TAKE');
            const storedRaw = isFinalStep ? PlanningModule.getWorkTxnQtyByKey(txns, order?.id, line?.id, stationId, 'STORE') : 0;
            const takenQty = PlanningModule.parseQty(takenRaw, 0);
            const storedQty = isFinalStep ? Math.min(inputQty, PlanningModule.parseQty(storedRaw, 0)) : 0;
            const completeQty = Math.min(inputQty, PlanningModule.parseQty(doneRaw, 0));
            const doneQty = (isFinalStep && PlanningModule.isDepotTransferStation(stationId))
                ? Math.min(inputQty, Math.max(completeQty, takenQty))
                : completeQty;
            baseSteps.push({
                seq: index + 1,
                stationId,
                stationName: PlanningModule.getRouteStationLabel(route),
                processId: String(route?.processId || '').trim().toUpperCase(),
                inputQty,
                doneQty,
                takenQty,
                storedQty
            });
        });

        const firstIncompleteIdx = baseSteps.findIndex((step) => step.doneQty < step.inputQty);
        const isFinished = firstIncompleteIdx < 0;
        const currentIdx = isFinished ? -1 : firstIncompleteIdx;
        const steps = baseSteps.map((step, index) => {
            const nextStep = index < baseSteps.length - 1 ? baseSteps[index + 1] : null;
            const takenHere = Math.min(step.inputQty, PlanningModule.parseQty(step?.takenQty, 0));
            const doneHere = Math.min(step.inputQty, PlanningModule.parseQty(step?.doneQty, 0));
            const inProcessQty = Math.max(0, takenHere - doneHere);
            const nextTakenQty = nextStep ? Math.min(nextStep.inputQty, PlanningModule.parseQty(nextStep?.takenQty, 0)) : 0;
            const transferPendingQty = nextStep ? Math.max(0, doneHere - nextTakenQty) : 0;
            const activeQty = Math.max(0, inProcessQty + transferPendingQty);
            return {
                ...step,
                activeQty,
                stepStatus: isFinished ? 'DONE' : (index < currentIdx ? 'DONE' : (index === currentIdx ? 'CURRENT' : 'NEXT'))
            };
        });
        const stationLoadMap = new Map();
        steps.forEach((step, index) => {
            const stationQty = Math.max(0, PlanningModule.parseQty(step?.activeQty, 0));
            if (stationQty <= 0) return;
            const stationKey = String(step?.stationId || step?.stationName || `step-${index + 1}`);
            const prevLoad = stationLoadMap.get(stationKey) || {
                stationId: String(step?.stationId || ''),
                stationName: String(step?.stationName || '-'),
                qty: 0
            };
            prevLoad.qty += stationQty;
            stationLoadMap.set(stationKey, prevLoad);
        });
        const stationLoads = Array.from(stationLoadMap.values())
            .filter((row) => PlanningModule.parseQty(row?.qty, 0) > 0)
            .sort((a, b) => {
                const qtyDiff = PlanningModule.parseQty(b?.qty, 0) - PlanningModule.parseQty(a?.qty, 0);
                if (qtyDiff !== 0) return qtyDiff;
                return String(a?.stationName || '').localeCompare(String(b?.stationName || ''), 'tr');
            });
        const stationLoadLabel = stationLoads.map((row) => `${String(row?.stationName || '-')}: ${PlanningModule.parseQty(row?.qty, 0)}`).join(' | ');
        const finalDoneQty = PlanningModule.parseQty(baseSteps[baseSteps.length - 1]?.doneQty, 0);
        const finalStoredQty = PlanningModule.parseQty(baseSteps[baseSteps.length - 1]?.storedQty, 0);
        const remainingQty = Math.max(0, targetQty - finalDoneQty);
        const storageRemainingQty = Math.max(0, targetQty - finalStoredQty);
        const isStored = finalStoredQty >= targetQty;
        return {
            targetQty,
            finalDoneQty: Math.min(targetQty, finalDoneQty),
            finalStoredQty: Math.min(targetQty, finalStoredQty),
            remainingQty,
            storageRemainingQty,
            isFinished: isFinished || remainingQty <= 0,
            isStored,
            currentStationName: isFinished
                ? (isStored ? 'Montaji bekliyor' : 'Depoya alinmayi bekliyor')
                : (stationLoadLabel || String(baseSteps[currentIdx]?.stationName || '-')),
            completedStationCount: isFinished ? steps.length : currentIdx,
            routeCount: steps.length,
            steps,
            stationLoads
        };
    },

    getReleasedDemandItemGroups: (demand) => {
        const demandItems = PlanningModule.getDemandItems(demand);
        const linkedOrders = PlanningModule.getLinkedWorkOrdersForDemand(demand);
        const txns = Array.isArray(DB.data?.data?.workOrderTransactions) ? DB.data.data.workOrderTransactions : [];
        const groups = new Map();
        const orderMap = {};

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
                lines: []
            });
        });

        const resolveGroupKey = (order) => {
            const directKey = String(order?.sourceItemKey || '').trim();
            if (directKey && groups.has(directKey)) return directKey;
            const sourceItemCode = String(order?.sourceItemCode || '').trim().toUpperCase();
            if (sourceItemCode) {
                const hitByCode = Array.from(groups.values()).find((group) => String(group?.itemCode || '').trim().toUpperCase() === sourceItemCode);
                if (hitByCode) return hitByCode.itemKey;
            }
            const sourceItemName = String(order?.sourceItemName || '').trim().toLowerCase();
            if (sourceItemName) {
                const hitByName = Array.from(groups.values()).find((group) => String(group?.itemName || '').trim().toLowerCase() === sourceItemName);
                if (hitByName) return hitByName.itemKey;
            }
            if (demandItems.length === 1 && groups.size === 1) return Array.from(groups.keys())[0];
            const fallbackKey = `order-${String(order?.id || crypto.randomUUID())}`;
            if (!groups.has(fallbackKey)) {
                groups.set(fallbackKey, {
                    itemKey: fallbackKey,
                    itemIndex: Number.MAX_SAFE_INTEGER,
                    itemName: String(order?.sourceItemName || order?.productName || '-'),
                    itemCode: String(order?.sourceItemCode || order?.productCode || '-'),
                    itemQty: PlanningModule.parseQty(order?.sourceItemQty, PlanningModule.parseQty(order?.lotQty, 0)),
                    itemType: 'MIXED',
                    lines: []
                });
            }
            return fallbackKey;
        };

        linkedOrders.forEach((order) => {
            const groupKey = resolveGroupKey(order);
            if (!groups.has(groupKey)) return;
            const group = groups.get(groupKey);
            const lines = Array.isArray(order?.lines) ? order.lines : [];
            lines.forEach((line, lineIndex) => {
                const progress = PlanningModule.getReleasedLineProgress(order, line, txns);
                group.lines.push({
                    rowKey: `${String(order?.id || '')}:${String(line?.id || lineIndex)}`,
                    orderId: String(order?.id || ''),
                    workOrderCode: String(order?.workOrderCode || '-'),
                    componentCode: String(line?.componentCode || order?.productCode || '-'),
                    componentName: String(line?.componentName || order?.productName || '-'),
                    targetQty: PlanningModule.parseQty(line?.targetQty, 0),
                    doneQty: PlanningModule.parseQty(progress?.finalDoneQty, 0),
                    storedQty: PlanningModule.parseQty(progress?.finalStoredQty, 0),
                    remainingQty: PlanningModule.parseQty(progress?.remainingQty, 0),
                    storageRemainingQty: PlanningModule.parseQty(progress?.storageRemainingQty, 0),
                    isFinished: !!progress?.isFinished,
                    isStored: !!progress?.isStored,
                    currentStationName: String(progress?.currentStationName || '-'),
                    completedStationCount: PlanningModule.parseQty(progress?.completedStationCount, 0),
                    routeCount: PlanningModule.parseQty(progress?.routeCount, 0),
                    steps: Array.isArray(progress?.steps) ? progress.steps : [],
                    stationLoads: Array.isArray(progress?.stationLoads) ? progress.stationLoads : []
                });
            });
        });

        return Array.from(groups.values())
            .filter((group) => group.lines.length > 0)
            .map((group) => {
                const totalTargetQty = group.lines.reduce((sum, line) => sum + PlanningModule.parseQty(line?.targetQty, 0), 0);
                const totalDoneQty = group.lines.reduce((sum, line) => sum + PlanningModule.parseQty(line?.doneQty, 0), 0);
                const totalStoredQty = group.lines.reduce((sum, line) => sum + PlanningModule.parseQty(line?.storedQty, 0), 0);
                const totalRemainingQty = group.lines.reduce((sum, line) => sum + PlanningModule.parseQty(line?.remainingQty, 0), 0);
                const totalStorageRemainingQty = group.lines.reduce((sum, line) => sum + PlanningModule.parseQty(line?.storageRemainingQty, 0), 0);
                const isFinished = group.lines.every((line) => !!line?.isFinished);
                const isStored = group.lines.every((line) => !!line?.isStored);
                const stationLoadMap = new Map();
                group.lines.forEach((line) => {
                    const loads = Array.isArray(line?.stationLoads) ? line.stationLoads : [];
                    loads.forEach((load) => {
                        const qty = PlanningModule.parseQty(load?.qty, 0);
                        if (qty <= 0) return;
                        const stationKey = String(load?.stationId || load?.stationName || '').trim();
                        if (!stationKey) return;
                        const prev = stationLoadMap.get(stationKey) || {
                            stationId: String(load?.stationId || ''),
                            stationName: String(load?.stationName || stationKey),
                            qty: 0
                        };
                        prev.qty += qty;
                        stationLoadMap.set(stationKey, prev);
                    });
                });
                const activeStationLoads = Array.from(stationLoadMap.values())
                    .filter((row) => PlanningModule.parseQty(row?.qty, 0) > 0)
                    .sort((a, b) => {
                        const qtyDiff = PlanningModule.parseQty(b?.qty, 0) - PlanningModule.parseQty(a?.qty, 0);
                        if (qtyDiff !== 0) return qtyDiff;
                        return String(a?.stationName || '').localeCompare(String(b?.stationName || ''), 'tr');
                    });
                const activeStations = activeStationLoads.map((row) => `${String(row?.stationName || '-')}: ${PlanningModule.parseQty(row?.qty, 0)}`);
                return {
                    ...group,
                    totalTargetQty,
                    totalDoneQty,
                    totalStoredQty,
                    totalRemainingQty,
                    totalStorageRemainingQty,
                    isFinished,
                    isStored,
                    activeStations,
                    activeStationLoads
                };
            })
            .sort((a, b) => {
                const ai = Number.isFinite(orderMap[a.itemKey]) ? orderMap[a.itemKey] : Number(a.itemIndex || Number.MAX_SAFE_INTEGER);
                const bi = Number.isFinite(orderMap[b.itemKey]) ? orderMap[b.itemKey] : Number(b.itemIndex || Number.MAX_SAFE_INTEGER);
                if (ai !== bi) return ai - bi;
                return String(a?.itemName || '').localeCompare(String(b?.itemName || ''), 'tr');
            });
    },

    getReleasedDemandStatusMeta: (groups) => {
        if (!Array.isArray(groups) || !groups.length) {
            return {
                done: false,
                finished: false,
                stored: false,
                archived: false,
                label: 'Rota bilgisi yok',
                style: 'background:#fee2e2; color:#b91c1c; border:1px solid #fecaca;'
            };
        }
        const finished = groups.every((group) => !!group?.isFinished);
        const stored = groups.every((group) => !!group?.isStored);
        if (finished && stored) {
            return {
                done: true,
                finished: true,
                stored: true,
                archived: true,
                label: 'Arsivde / depoya alindi',
                style: 'background:#ecfdf5; color:#047857; border:1px solid #86efac;'
            };
        }
        if (finished && !stored) {
            return {
                done: false,
                finished: true,
                stored: false,
                archived: false,
                label: 'Bitti / depoya al bekliyor',
                style: 'background:#fff7ed; color:#b45309; border:1px solid #fed7aa;'
            };
        }
        return {
            done: false,
            finished: false,
            stored: false,
            archived: false,
            label: 'Uretim devam ediyor',
            style: 'background:#fee2e2; color:#b91c1c; border:1px solid #fecaca;'
        };
    },

    openReleasedDemandTrackingModal: (demandId) => {
        const demand = PlanningModule.getDemands().find((row) => String(row?.id || '') === String(demandId || ''));
        if (!demand) return alert('Talep kaydi bulunamadi.');
        const groups = PlanningModule.getReleasedDemandItemGroups(demand);
        const statusMeta = PlanningModule.getReleasedDemandStatusMeta(groups);
        const workOrderText = Array.isArray(demand?.workOrderCodes) && demand.workOrderCodes.length
            ? (demand.workOrderCodes.length > 1 ? `${demand.workOrderCodes[0]} +${demand.workOrderCodes.length - 1}` : demand.workOrderCodes[0])
            : String(demand?.workOrderCode || '-');
        const demandStationMap = new Map();
        groups.forEach((group) => {
            const loads = Array.isArray(group?.activeStationLoads) ? group.activeStationLoads : [];
            loads.forEach((load) => {
                const qty = PlanningModule.parseQty(load?.qty, 0);
                if (qty <= 0) return;
                const key = String(load?.stationId || load?.stationName || '').trim();
                if (!key) return;
                const prev = demandStationMap.get(key) || {
                    stationId: String(load?.stationId || ''),
                    stationName: String(load?.stationName || key),
                    qty: 0
                };
                prev.qty += qty;
                demandStationMap.set(key, prev);
            });
        });
        const demandStationLoads = Array.from(demandStationMap.values())
            .filter((row) => PlanningModule.parseQty(row?.qty, 0) > 0)
            .sort((a, b) => {
                const qtyDiff = PlanningModule.parseQty(b?.qty, 0) - PlanningModule.parseQty(a?.qty, 0);
                if (qtyDiff !== 0) return qtyDiff;
                return String(a?.stationName || '').localeCompare(String(b?.stationName || ''), 'tr');
            });
        const demandDistributionText = demandStationLoads.length
            ? demandStationLoads.map((row) => `${String(row?.stationName || '-')}: ${PlanningModule.parseQty(row?.qty, 0)}`).join(' | ')
            : 'Dagilim yok';

        const renderRouteChips = (steps) => {
            if (!Array.isArray(steps) || !steps.length) {
                return `<span style="display:inline-flex; border-radius:999px; border:1px solid #a7f3d0; background:#ecfdf5; color:#047857; padding:0.14rem 0.5rem; font-size:0.72rem; font-weight:700;">Rota yok / bitti</span>`;
            }
            return steps.map((step) => {
                const status = String(step?.stepStatus || 'NEXT').toUpperCase();
                const activeQty = PlanningModule.parseQty(step?.activeQty, 0);
                const hasActiveQty = activeQty > 0;
                const style = hasActiveQty
                    ? 'background:#fee2e2; color:#b91c1c; border:1px solid #f87171;'
                    : (status === 'DONE'
                        ? 'background:#f1f5f9; color:#64748b; border:1px solid #cbd5e1;'
                        : 'background:#ffffff; color:#94a3b8; border:1px solid #e2e8f0;');
                const label = hasActiveQty
                    ? `${step?.seq || '?'}- ${step?.stationName || '-'} / ${activeQty} adet`
                    : `${step?.seq || '?'}-${step?.stationName || '-'}`;
                return `<span style="display:inline-flex; align-items:center; gap:0.28rem; border-radius:999px; padding:0.14rem 0.5rem; font-size:0.72rem; font-weight:700; ${style}">${PlanningModule.escapeHtml(label)}</span>`;
            }).join('');
        };
        const renderItemLines = (group) => {
            const lines = Array.isArray(group?.lines) ? group.lines : [];
            if (!lines.length) return `<tr><td colspan="7" style="padding:0.8rem; text-align:center; color:#94a3b8;">Bu kalem icin takip satiri bulunamadi.</td></tr>`;
            return lines.map((line) => {
                const statusBadgeStyle = line?.isStored
                    ? 'background:#ecfdf5; color:#047857; border:1px solid #a7f3d0;'
                    : (line?.isFinished
                        ? 'background:#fff7ed; color:#b45309; border:1px solid #fed7aa;'
                        : 'background:#fee2e2; color:#b91c1c; border:1px solid #fecaca;');
                const statusBadgeLabel = line?.isStored
                    ? 'Depoya alindi'
                    : (line?.isFinished ? 'Bitti / depoya al bekliyor' : 'Uretimde');
                return `
                    <tr style="border-bottom:1px solid #f1f5f9; ${line?.isStored ? 'background:#f8fffb;' : (line?.isFinished ? 'background:#fffaf3;' : 'background:#fffef8;')}">
                        <td style="padding:0.5rem; font-family:monospace; color:#334155;">${PlanningModule.escapeHtml(String(line?.workOrderCode || '-'))}</td>
                        <td style="padding:0.5rem;">
                            <div style="font-weight:700; color:#334155;">${PlanningModule.escapeHtml(String(line?.componentName || '-'))}</div>
                            <div style="margin-top:0.15rem; font-size:0.74rem; color:#1d4ed8; font-family:monospace;">${PlanningModule.renderLiveCodeButton(String(line?.componentCode || ''))}</div>
                        </td>
                        <td style="padding:0.5rem; text-align:center; font-weight:700;">${PlanningModule.escapeHtml(String(line?.targetQty || 0))}</td>
                        <td style="padding:0.5rem; text-align:center; font-weight:700; color:#047857;">${PlanningModule.escapeHtml(String(line?.doneQty || 0))}</td>
                        <td style="padding:0.5rem; text-align:center; font-weight:700; color:${line?.remainingQty > 0 ? '#b91c1c' : '#0f172a'};">${PlanningModule.escapeHtml(String(line?.remainingQty || 0))}</td>
                        <td style="padding:0.5rem;"><span style="display:inline-block; border-radius:999px; padding:0.14rem 0.5rem; font-size:0.72rem; font-weight:700; ${statusBadgeStyle}">${PlanningModule.escapeHtml(statusBadgeLabel)}</span></td>
                        <td style="padding:0.5rem;"><div style="display:flex; gap:0.35rem; flex-wrap:wrap;">${renderRouteChips(line?.steps || [])}</div></td>
                    </tr>
                `;
            }).join('');
        };

        const groupsHtml = groups.length
            ? groups.map((group, index) => {
                const groupStatusStyle = group?.isStored
                    ? 'background:#ecfdf5; color:#047857; border:1px solid #a7f3d0;'
                    : (group?.isFinished
                        ? 'background:#fff7ed; color:#b45309; border:1px solid #fed7aa;'
                        : 'background:#fee2e2; color:#b91c1c; border:1px solid #fecaca;');
                const stationText = group?.isStored
                    ? 'Birim arsivinde'
                    : (group?.isFinished
                        ? `Depoya alinmayi bekliyor (${PlanningModule.parseQty(group?.totalStorageRemainingQty, 0)} adet)`
                        : (Array.isArray(group?.activeStations) && group.activeStations.length ? group.activeStations.join(' | ') : 'Istasyon bekliyor'));
                return `
                    <div style="margin-top:${index === 0 ? '0.65rem' : '0.75rem'}; border:2px solid ${group?.isStored ? '#86efac' : (group?.isFinished ? '#fdba74' : '#fca5a5')}; border-radius:0.8rem; background:${group?.isStored ? '#f0fdf4' : (group?.isFinished ? '#fffbeb' : '#fff7f7')};">
                        <div style="padding:0.55rem 0.7rem; display:flex; justify-content:space-between; align-items:center; gap:0.55rem; flex-wrap:wrap; border-bottom:1px solid #e2e8f0;">
                            <div>
                                <div style="font-weight:800; color:#1e293b;">${PlanningModule.escapeHtml(String(group?.itemName || '-'))} <span style="font-family:monospace; color:#1d4ed8;">- ${PlanningModule.escapeHtml(String(group?.itemQty || 0))} ADET</span></div>
                                <div style="margin-top:0.12rem; font-size:0.74rem; color:#1d4ed8; font-family:monospace;">${PlanningModule.renderLiveCodeButton(String(group?.itemCode || ''))} / ${PlanningModule.escapeHtml(PlanningModule.getItemTypeLabel(group?.itemType || 'MODEL'))}</div>
                            </div>
                            <span style="display:inline-block; border-radius:999px; padding:0.14rem 0.5rem; font-size:0.72rem; font-weight:700; ${groupStatusStyle}">${group?.isStored ? 'Arsivde' : (group?.isFinished ? 'Depoya al bekliyor' : 'Bitmedi')}</span>
                        </div>
                        <div style="padding:0.45rem 0.7rem; font-size:0.78rem; color:#475569;">Adet dagilimi: <strong style="color:${group?.isStored ? '#047857' : (group?.isFinished ? '#b45309' : '#b91c1c')};">${PlanningModule.escapeHtml(stationText)}</strong> | Kalan toplam: <strong>${PlanningModule.escapeHtml(String(group?.totalRemainingQty || 0))}</strong> | Depoya alinacak: <strong>${PlanningModule.escapeHtml(String(group?.totalStorageRemainingQty || 0))}</strong></div>
                        <div style="padding:0 0.7rem 0.75rem 0.7rem;">
                            <div class="card-table" style="margin-top:0.25rem;">
                                <table style="width:100%; border-collapse:collapse;">
                                    <thead>
                                        <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                                            <th style="padding:0.5rem; text-align:left;">Is emri</th>
                                            <th style="padding:0.5rem; text-align:left;">Parca / unsur</th>
                                            <th style="padding:0.5rem; text-align:center;">Gereken</th>
                                            <th style="padding:0.5rem; text-align:center;">Biten</th>
                                            <th style="padding:0.5rem; text-align:center;">Kalan</th>
                                            <th style="padding:0.5rem; text-align:left;">Durum</th>
                                            <th style="padding:0.5rem; text-align:left;">Rota yolculugu</th>
                                        </tr>
                                    </thead>
                                    <tbody>${renderItemLines(group)}</tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')
            : `<div style="margin-top:0.65rem; border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.75rem; color:#94a3b8;">Bu talep icin takip satiri bulunamadi.</div>`;

        const html = `
            <div style="display:grid; gap:0.8rem;">
                <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.55rem;">
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Talep</div><div style="font-family:monospace; font-weight:800; color:#1d4ed8;">${PlanningModule.escapeHtml(String(demand?.demandCode || '-'))}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Toplam adet</div><div style="font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(PlanningModule.getDemandQtyForDisplay(demand)))}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Durum</div><span style="display:inline-block; margin-top:0.2rem; border-radius:999px; padding:0.14rem 0.5rem; font-size:0.72rem; font-weight:700; ${statusMeta.style}">${PlanningModule.escapeHtml(statusMeta.label)}</span><div style="margin-top:0.28rem; font-size:0.72rem; color:#475569;">Dagilim: <strong>${PlanningModule.escapeHtml(demandDistributionText)}</strong></div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Is emri</div><div style="font-family:monospace; font-weight:800; color:#1e40af;">${PlanningModule.escapeHtml(workOrderText)}</div></div>
                </div>
                ${groupsHtml}
                <div style="display:flex; justify-content:flex-end;">
                    <button class="btn-sm" onclick="Modal.close()" style="min-width:96px;">kapat</button>
                </div>
            </div>
        `;
        Modal.open(`Durum Goruntule - ${PlanningModule.escapeHtml(String(demand?.demandCode || '-'))}`, html, { maxWidth: '1580px' });
    },

    renderReleasedOrdersWorkspace: () => {
        const rows = PlanningModule.getDemands()
            .filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'RELEASED')
            .slice()
            .sort((a, b) => String(b?.released_at || '').localeCompare(String(a?.released_at || '')));
        const trackingRows = rows.map((demand) => {
            const groups = PlanningModule.getReleasedDemandItemGroups(demand);
            const statusMeta = PlanningModule.getReleasedDemandStatusMeta(groups);
            return { demand, groups, statusMeta };
        });
        const archiveRows = trackingRows.filter((entry) => !!entry?.statusMeta?.archived);
        const activeRows = trackingRows.filter((entry) => !entry?.statusMeta?.archived);
        const showArchive = !!PlanningModule.state.releasedArchiveMode;
        const visibleRows = showArchive ? archiveRows : activeRows;
        const doneCount = visibleRows.filter((entry) => entry.statusMeta.done).length;
        const inProgressCount = Math.max(0, visibleRows.length - doneCount);
        const totalQty = visibleRows.reduce((sum, entry) => sum + PlanningModule.getDemandQtyForDisplay(entry?.demand), 0);

        const renderTrackingRows = () => {
            if (!visibleRows.length) {
                return `<tr><td colspan="7" style="padding:1rem; text-align:center; color:#94a3b8;">${showArchive ? 'Birim arsivinde kayit yok.' : 'Henuz planlamadan is emrine donusen aktif kayit yok.'}</td></tr>`;
            }
            return visibleRows.map((entry) => {
                const demand = entry.demand;
                const demandId = String(demand?.id || '');
                const groups = entry.groups;
                const statusMeta = entry.statusMeta;
                const workOrderText = Array.isArray(demand?.workOrderCodes) && demand.workOrderCodes.length
                    ? (demand.workOrderCodes.length > 1 ? `${demand.workOrderCodes[0]} +${demand.workOrderCodes.length - 1}` : demand.workOrderCodes[0])
                    : String(demand?.workOrderCode || '-');
                const lineCount = groups.reduce((sum, group) => sum + (Array.isArray(group?.lines) ? group.lines.length : 0), 0);

                return `
                    <tr style="border-bottom:2px solid #cbd5e1; background:${showArchive ? '#f0fdf4' : (statusMeta.done ? '#f8fffb' : '#fffef8')};">
                        <td style="padding:0.6rem;">
                            <div><button class="btn-sm" style="padding:0.12rem 0.5rem; min-height:24px; border:1px solid #93c5fd; background:#eff6ff; color:#1d4ed8; font-family:monospace; font-weight:800;" onclick="PlanningModule.openReleasedDemandTrackingModal('${PlanningModule.escapeJsString(demandId)}')">${PlanningModule.escapeHtml(String(demand?.demandCode || '-'))}</button></div>
                            <div style="font-size:0.75rem; color:#64748b;">${PlanningModule.escapeHtml(String(demand?.sourceLabel || 'Stok Uretimi'))}</div>
                        </td>
                        <td style="padding:0.6rem;">
                            <div style="font-weight:700; color:#334155;">${PlanningModule.escapeHtml(PlanningModule.getDemandDisplayName(demand))}</div>
                            <div style="font-size:0.75rem; color:#64748b; font-family:monospace;">${PlanningModule.escapeHtml(PlanningModule.getDemandDisplayCode(demand))}</div>
                        </td>
                        <td style="padding:0.6rem; text-align:center; font-weight:800;">${PlanningModule.escapeHtml(String(PlanningModule.getDemandQtyForDisplay(demand)))}</td>
                        <td style="padding:0.6rem;"><div>${PlanningModule.escapeHtml(String(demand?.dueDate || '-'))}</div><div style="margin-top:0.2rem;">${PlanningModule.renderPriorityBadge(demand?.priority || 'NORMAL')}</div></td>
                        <td style="padding:0.6rem;"><span style="display:inline-block; border-radius:999px; padding:0.14rem 0.5rem; font-size:0.72rem; font-weight:700; ${statusMeta.style}">${PlanningModule.escapeHtml(statusMeta.label)}</span></td>
                        <td style="padding:0.6rem; font-family:monospace; color:#1e40af; font-weight:700;">${PlanningModule.escapeHtml(workOrderText)}</td>
                        <td style="padding:0.6rem; text-align:right;">
                            <div style="display:inline-flex; flex-direction:column; align-items:flex-end; gap:0.25rem;">
                                <button class="btn-sm" onclick="PlanningModule.openReleasedDemandTrackingModal('${PlanningModule.escapeJsString(demandId)}')">durumu goruntule</button>
                                <span style="font-size:0.72rem; color:#64748b;">${PlanningModule.escapeHtml(String(lineCount))} satir</span>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        };

        return `
            <section style="max-width:1680px; margin:0 auto;">
                <div style="background:rgba(255,255,255,0.72); border:2px solid #94a3b8; border-radius:1.8rem; padding:1.2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.85rem; margin-bottom:0.85rem; flex-wrap:wrap;">
                        <div>
                            <h2 class="page-title" style="margin:0;">${showArchive ? 'planlama / birim arsivi' : 'planlama / is emrine donusenler'}</h2>
                            <div style="font-size:0.85rem; color:#64748b; margin-top:0.2rem;">${showArchive ? 'Tum islemleri tamamlanip depoya alinan talepler bu listede arsivlenir.' : 'Bu ekran siparis ve stok taleplerinin uretim izleme panelidir. Talep satirina tiklayip kalem kalem rota durumunu gorebilirsin.'}</div>
                        </div>
                        <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                            ${showArchive
                ? `<button class="btn-sm" onclick="PlanningModule.setReleasedArchiveMode(false)" style="border-color:#bfdbfe; color:#1d4ed8; background:#eff6ff;">aktif liste (${activeRows.length})</button>`
                : `<button class="btn-sm" onclick="PlanningModule.setReleasedArchiveMode(true)" style="border-color:#86efac; color:#047857; background:#ecfdf5; font-weight:700;">birim arsivi (${archiveRows.length})</button>`
            }
                            <button class="btn-sm" onclick="PlanningModule.openWorkspace('planning-pool')">planlama havuzu</button>
                            <button class="btn-sm" onclick="PlanningModule.openWorkspace('menu')">geri</button>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.65rem; margin-bottom:0.9rem;">
                        <div style="background:#ffffff; border:2px solid #cbd5e1; border-radius:0.8rem; padding:0.65rem 0.75rem;"><div style="font-size:0.72rem; color:#64748b;">Talep kaydi</div><div style="font-size:1.05rem; font-weight:800; color:#0f172a;">${visibleRows.length}</div></div>
                        <div style="background:#ffffff; border:2px solid #cbd5e1; border-radius:0.8rem; padding:0.65rem 0.75rem;"><div style="font-size:0.72rem; color:#64748b;">Toplam adet</div><div style="font-size:1.05rem; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(totalQty))}</div></div>
                        <div style="background:#ffffff; border:2px solid #cbd5e1; border-radius:0.8rem; padding:0.65rem 0.75rem;"><div style="font-size:0.72rem; color:#64748b;">Biten talep</div><div style="font-size:1.05rem; font-weight:800; color:#047857;">${doneCount}</div></div>
                        <div style="background:#ffffff; border:2px solid #cbd5e1; border-radius:0.8rem; padding:0.65rem 0.75rem;"><div style="font-size:0.72rem; color:#64748b;">Devam eden talep</div><div style="font-size:1.05rem; font-weight:800; color:#b91c1c;">${inProgressCount}</div></div>
                    </div>
                    <div style="background:#ffffff; border:2px solid #334155; border-radius:1rem; padding:0.75rem;">
                        <div class="card-table">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="border-bottom:2px solid #cbd5e1; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                                        <th style="padding:0.6rem; text-align:left;">Talep</th>
                                        <th style="padding:0.6rem; text-align:left;">Urun</th>
                                        <th style="padding:0.6rem; text-align:center;">Adet</th>
                                        <th style="padding:0.6rem; text-align:left;">Termin / Oncelik</th>
                                        <th style="padding:0.6rem; text-align:left;">Durum</th>
                                        <th style="padding:0.6rem; text-align:left;">Is emri</th>
                                        <th style="padding:0.6rem; text-align:right;">Islem</th>
                                    </tr>
                                </thead>
                                <tbody>${renderTrackingRows()}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        `;
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
