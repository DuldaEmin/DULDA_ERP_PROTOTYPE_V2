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
        planningPoolReleasedExpandedGroupKey: '',
        planningPoolRowsByDemand: {},
        planningPoolBuildTokenByDemand: {},
        planningPoolArchiveMode: false,
        stockArchiveMode: false,
        releasedExpandedDemandId: '',
        releasedExpandedItemByDemand: {},
        releasedArchiveMode: false,
        releasedSourceFilter: 'ALL',
        releasedSearchQuery: '',
        releasedCompletionView: 'ACTIVE',
        releasedExpandedGroupKey: '',
        salesDemandRowsByKey: {},
        salesDemandExpandedGroupKey: '',
        planningPoolExpandedGroupKey: '',
        planningDetailScope: '',
        planningDetailGroupKey: '',
        planningDetailBackView: '',
        releasedDetailInlineTrackingDemandId: '',
        planningDemandCleanupSavePending: false,
        salesReadonlyDemandId: '',
        salesReadonlyRowsByDemand: {},
        salesReadonlyMetaByDemand: {}
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

    buildSalesReadonlyDemandId: (orderId, lineId) => {
        const safeOrderId = String(orderId || '').trim() || '-';
        const safeLineId = String(lineId || '').trim() || '-';
        return `sales-preview:${safeOrderId}:${safeLineId}`;
    },

    clearSalesReadonlyContext: () => {
        PlanningModule.state.salesReadonlyDemandId = '';
        PlanningModule.state.salesReadonlyRowsByDemand = {};
        PlanningModule.state.salesReadonlyMetaByDemand = {};
    },

    getSalesReadonlyRows: (demandId) => {
        const key = String(demandId || '').trim();
        if (!key) return null;
        const map = PlanningModule.state.salesReadonlyRowsByDemand && typeof PlanningModule.state.salesReadonlyRowsByDemand === 'object'
            ? PlanningModule.state.salesReadonlyRowsByDemand
            : {};
        const rows = map[key];
        return Array.isArray(rows) ? rows : null;
    },

    openSalesReadonlyAnalysis: (payload = {}, options = {}) => {
        const orderId = String(payload?.orderId || '').trim();
        const lineId = String(payload?.lineId || '').trim();
        const demandId = PlanningModule.buildSalesReadonlyDemandId(orderId, lineId);
        const qty = PlanningModule.parseQty(payload?.qty, 0);
        const planningModelIdRaw = String(payload?.planningModelId || '').trim();
        const normalizedVariantId = planningModelIdRaw
            ? PlanningModule.normalizePlanningModelVariantId(planningModelIdRaw)
            : PlanningModule.normalizePlanningModelVariantId(String(payload?.salesVariationId || '').trim());
        if (!orderId || !lineId || !normalizedVariantId || qty <= 0) return false;

        const draftDemand = {
            id: demandId,
            demandCode: demandId,
            sourceType: 'SALES_ORDER',
            sourceLabel: 'Satis Siparisi (Readonly)',
            sourceOrderId: orderId,
            sourceOrderNo: String(payload?.orderNo || '-').trim() || '-',
            sourceLineId: lineId,
            itemType: 'MODEL',
            variantId: normalizedVariantId,
            productName: String(payload?.productName || '-').trim() || '-',
            variantCode: String(payload?.variantCode || '-').trim() || '-',
            productCode: String(payload?.variantCode || '-').trim() || '-',
            qty,
            dueDate: String(payload?.orderDate || '-').trim() || '-',
            priority: 'NORMAL',
            status: 'OPEN',
            note: '',
            items: [{
                id: `${demandId}:item:1`,
                itemType: 'MODEL',
                qty,
                variantId: normalizedVariantId,
                componentId: '',
                semiFinishedId: '',
                productName: String(payload?.productName || '-').trim() || '-',
                productCode: String(payload?.variantCode || '-').trim() || '-',
                variantCode: String(payload?.variantCode || '-').trim() || '-',
                componentCode: '',
                semiFinishedCode: '',
                productGroup: ''
            }]
        };

        const rows = PlanningModule.buildPlanningPoolRowsForDemand(draftDemand);
        if (!PlanningModule.state.salesReadonlyRowsByDemand || typeof PlanningModule.state.salesReadonlyRowsByDemand !== 'object') {
            PlanningModule.state.salesReadonlyRowsByDemand = {};
        }
        if (!PlanningModule.state.salesReadonlyMetaByDemand || typeof PlanningModule.state.salesReadonlyMetaByDemand !== 'object') {
            PlanningModule.state.salesReadonlyMetaByDemand = {};
        }
        PlanningModule.state.salesReadonlyRowsByDemand[demandId] = Array.isArray(rows) ? rows : [];
        PlanningModule.state.salesReadonlyMetaByDemand[demandId] = {
            demandId,
            orderId,
            lineId,
            orderNo: String(payload?.orderNo || '-').trim() || '-',
            productName: String(payload?.productName || '-').trim() || '-',
            variantCode: String(payload?.variantCode || '-').trim() || '-',
            qty,
            variantId: normalizedVariantId
        };
        PlanningModule.state.salesReadonlyDemandId = demandId;

        const navigate = options?.navigate !== false;
        const activateWorkspace = options?.activateWorkspace !== false;
        const render = options?.render !== false;
        if (navigate && typeof Router !== 'undefined' && Router && typeof Router.navigate === 'function') {
            Router.navigate('planlama', { fromBack: true });
        }
        if (activateWorkspace) {
            PlanningModule.state.workspaceView = 'planning-pool';
        }
        if (render && typeof UI !== 'undefined' && UI && typeof UI.renderCurrentPage === 'function') {
            UI.renderCurrentPage();
        }
        return true;
    },

    renderSalesReadonlyAnalysisHtml: (demandId) => {
        const key = String(demandId || '').trim();
        if (!key) {
            return '<div style="border:1px solid #fecaca; border-radius:0.8rem; background:#fff1f2; padding:0.85rem; color:#b91c1c;">Analiz kimligi bulunamadi.</div>';
        }
        const rowsRaw = PlanningModule.getSalesReadonlyRows(key);
        const rows = Array.isArray(rowsRaw) ? PlanningModule.syncPlanningPoolRowsWithAvailability(rowsRaw) : [];
        if (!rows.length) {
            return '<div style="border:1px solid #fcd34d; border-radius:0.8rem; background:#fffbeb; padding:0.85rem; color:#92400e;">Bu satir icin patlatma analizi bulunamadi.</div>';
        }
        const metaMap = PlanningModule.state.salesReadonlyMetaByDemand && typeof PlanningModule.state.salesReadonlyMetaByDemand === 'object'
            ? PlanningModule.state.salesReadonlyMetaByDemand
            : {};
        const meta = metaMap[key] || {};
        const summary = PlanningModule.getPlanningPoolSummary(rows);
        const stockAvailableQty = rows.reduce((sum, row) =>
            sum + PlanningModule.parseQty(row?.stockAvailableQty, 0) + PlanningModule.parseQty(row?.semiAvailableQty, 0), 0);
        const missingQty = Math.max(0, summary.requiredQty - summary.consumedQty);

        const tableRows = rows.map((row) => {
            const coveredQty = PlanningModule.parseQty(row?.useStockQty, 0) + PlanningModule.parseQty(row?.useSemiQty, 0);
            return `
                <tr style="border-bottom:1px solid #f1f5f9; ${row?.missingRef ? 'background:#fff7f7;' : ''}">
                    <td style="padding:0.45rem;">
                        <div style="font-weight:700; color:#334155;">${PlanningModule.escapeHtml(String(row?.name || '-'))}</div>
                        <div style="font-size:0.72rem; color:#1d4ed8; font-family:monospace;">${PlanningModule.escapeHtml(String(row?.code || '-'))}</div>
                    </td>
                    <td style="padding:0.45rem; text-align:center; font-weight:700;">${PlanningModule.escapeHtml(String(PlanningModule.parseQty(row?.requiredQty, 0)))}</td>
                    <td style="padding:0.45rem; text-align:center; font-weight:700; color:#0f766e;">${PlanningModule.escapeHtml(String(PlanningModule.parseQty(row?.stockAvailableQty, 0) + PlanningModule.parseQty(row?.semiAvailableQty, 0)))}</td>
                    <td style="padding:0.45rem; text-align:center; font-weight:700; color:#0369a1;">${PlanningModule.escapeHtml(String(coveredQty))}</td>
                    <td style="padding:0.45rem; text-align:center; font-weight:700; color:${PlanningModule.parseQty(row?.netQty, 0) > 0 ? '#b91c1c' : '#0f172a'};">${PlanningModule.escapeHtml(String(PlanningModule.parseQty(row?.netQty, 0)))}</td>
                </tr>
            `;
        }).join('');

        return `
            <div style="display:grid; gap:0.6rem;">
                <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.55rem;">
                    <div style="border:1px solid #dbeafe; border-radius:0.7rem; background:#eff6ff; padding:0.6rem;">
                        <div style="font-size:0.72rem; color:#475569;">Urun</div>
                        <div style="font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(meta?.productName || '-'))}</div>
                        <div style="font-size:0.72rem; color:#1d4ed8; font-family:monospace; margin-top:0.1rem;">${PlanningModule.escapeHtml(String(meta?.variantCode || '-'))}</div>
                    </div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.7rem; background:#ffffff; padding:0.6rem;">
                        <div style="font-size:0.72rem; color:#64748b;">Siparis adedi</div>
                        <div style="font-size:1rem; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(meta?.qty || 0))}</div>
                    </div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.7rem; background:#ffffff; padding:0.6rem;">
                        <div style="font-size:0.72rem; color:#64748b;">Stokta var / karsilanabilecek</div>
                        <div style="font-size:1rem; font-weight:800; color:#0f766e;">${PlanningModule.escapeHtml(String(stockAvailableQty))} / ${PlanningModule.escapeHtml(String(summary.consumedQty))}</div>
                    </div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.7rem; background:#ffffff; padding:0.6rem;">
                        <div style="font-size:0.72rem; color:#64748b;">Eksik / Uretilecek net</div>
                        <div style="font-size:1rem; font-weight:800; color:#b91c1c;">${PlanningModule.escapeHtml(String(missingQty))} / ${PlanningModule.escapeHtml(String(summary.netQty))}</div>
                    </div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:0.8rem; background:#ffffff; padding:0.6rem;">
                    <div style="font-size:0.78rem; color:#64748b; margin-bottom:0.35rem;">Parca / patlatma ozeti</div>
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                                <th style="padding:0.45rem; text-align:left;">Kalem</th>
                                <th style="padding:0.45rem; text-align:center;">Gereken</th>
                                <th style="padding:0.45rem; text-align:center;">Stokta var</th>
                                <th style="padding:0.45rem; text-align:center;">Stoktan karsilanacak</th>
                                <th style="padding:0.45rem; text-align:center;">Uretilecek net</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
            </div>
        `;
    },

    hasDemandWorkOrderLinks: (demand) => {
        const workOrderId = String(demand?.workOrderId || '').trim();
        const workOrderCode = String(demand?.workOrderCode || '').trim();
        const workOrderIds = Array.isArray(demand?.workOrderIds) ? demand.workOrderIds : [];
        const workOrderCodes = Array.isArray(demand?.workOrderCodes) ? demand.workOrderCodes : [];
        if (workOrderId || workOrderCode) return true;
        if (workOrderIds.some((id) => String(id || '').trim())) return true;
        if (workOrderCodes.some((code) => String(code || '').trim())) return true;
        return false;
    },

    isOpenSalesOrderDemandSafeToCleanup: (demand) => {
        const sourceType = String(demand?.sourceType || '').trim().toUpperCase();
        if (sourceType !== 'SALES_ORDER') return false;
        const status = String(demand?.status || 'OPEN').trim().toUpperCase();
        if (status !== 'OPEN') return false;
        if (PlanningModule.hasDemandWorkOrderLinks(demand)) return false;
        return true;
    },

    cleanupOpenSalesOrderPlanningDemands: (orderId) => {
        const targetOrderId = String(orderId || '').trim();
        if (!targetOrderId) return 0;
        const rows = PlanningModule.getDemands();
        if (!rows.length) return 0;
        const kept = [];
        let removedCount = 0;
        rows.forEach((demand) => {
            const demandOrderId = String(demand?.sourceOrderId || '').trim();
            if (demandOrderId === targetOrderId && PlanningModule.isOpenSalesOrderDemandSafeToCleanup(demand)) {
                removedCount += 1;
                return;
            }
            kept.push(demand);
        });
        if (removedCount > 0) DB.data.data.planningDemands = kept;
        return removedCount;
    },

    cleanupOpenOrphanSalesOrderPlanningDemands: () => {
        const rows = PlanningModule.getDemands();
        if (!rows.length) return 0;
        const orders = Array.isArray(DB.data?.data?.orders) ? DB.data.data.orders : [];
        const orderMap = new Map();
        orders.forEach((order) => {
            const orderId = String(order?.id || '').trim();
            if (!orderId) return;
            const lines = Array.isArray(order?.lines) ? order.lines : [];
            const lineIdSet = new Set(
                lines
                    .map((line) => PlanningModule.getSalesOrderLineId(line))
                    .map((lineId) => String(lineId || '').trim())
                    .filter(Boolean)
            );
            orderMap.set(orderId, lineIdSet);
        });

        const kept = [];
        let removedCount = 0;
        rows.forEach((demand) => {
            if (!PlanningModule.isOpenSalesOrderDemandSafeToCleanup(demand)) {
                kept.push(demand);
                return;
            }
            const demandOrderId = String(demand?.sourceOrderId || '').trim();
            const demandLineId = String(demand?.sourceLineId || '').trim();
            const existingLineIds = orderMap.get(demandOrderId);
            if (!existingLineIds) {
                removedCount += 1;
                return;
            }
            if (demandLineId && !existingLineIds.has(demandLineId)) {
                removedCount += 1;
                return;
            }
            kept.push(demand);
        });
        if (removedCount > 0) DB.data.data.planningDemands = kept;
        return removedCount;
    },

    cleanupSalesOrderCascadeForDemo: (orderId, options = {}) => {
        const explicitDemandIds = new Set(
            (Array.isArray(options?.demands) ? options.demands : [])
                .map((demand) => String(demand?.id || '').trim())
                .filter(Boolean)
        );
        const targetOrderId = String(orderId || '').trim();
        if (!targetOrderId && explicitDemandIds.size === 0) {
            return {
                removedDemandCount: 0,
                removedWorkOrderCount: 0,
                removedWorkOrderTxnCount: 0,
                removedDispatchNoteRowCount: 0,
                removedMontageDispatchCount: 0
            };
        }

        const targetOrderNoKey = String(options?.orderNo || '').trim().toUpperCase();
        const lineIdSet = new Set(
            (Array.isArray(options?.lineIds) ? options.lineIds : [])
                .map((lineId) => String(lineId || '').trim())
                .filter(Boolean)
        );

        const allDemands = PlanningModule.getDemands();
        if (!allDemands.length) {
            return {
                removedDemandCount: 0,
                removedWorkOrderCount: 0,
                removedWorkOrderTxnCount: 0,
                removedDispatchNoteRowCount: 0,
                removedMontageDispatchCount: 0
            };
        }

        const matchedDemands = [];
        const keptDemands = [];
        if (explicitDemandIds.size > 0) {
            allDemands.forEach((demand) => {
                const demandId = String(demand?.id || '').trim();
                if (demandId && explicitDemandIds.has(demandId)) {
                    matchedDemands.push(demand);
                    return;
                }
                keptDemands.push(demand);
            });
        } else {
            allDemands.forEach((demand) => {
                const sourceType = String(demand?.sourceType || '').trim().toUpperCase();
                if (sourceType !== 'SALES_ORDER') {
                    keptDemands.push(demand);
                    return;
                }
                const sourceOrderId = String(demand?.sourceOrderId || '').trim();
                const sourceOrderNoKey = String(demand?.sourceOrderNo || '').trim().toUpperCase();
                const sourceLineId = String(demand?.sourceLineId || '').trim();
                const byOrderId = sourceOrderId === targetOrderId;
                const legacyLineSafe = lineIdSet.size === 0 || !sourceLineId || lineIdSet.has(sourceLineId);
                const byLegacyOrderNo = !sourceOrderId
                    && !!targetOrderNoKey
                    && sourceOrderNoKey === targetOrderNoKey
                    && legacyLineSafe;
                if (byOrderId || byLegacyOrderNo) {
                    matchedDemands.push(demand);
                    return;
                }
                keptDemands.push(demand);
            });
        }

        if (!matchedDemands.length) {
            return {
                removedDemandCount: 0,
                removedWorkOrderCount: 0,
                removedWorkOrderTxnCount: 0,
                removedDispatchNoteRowCount: 0,
                removedMontageDispatchCount: 0
            };
        }

        const demandIdSet = new Set();
        const demandCodeSet = new Set();
        const linkedWorkOrderIds = new Set();
        matchedDemands.forEach((demand) => {
            const demandId = String(demand?.id || '').trim();
            const demandCodeKey = String(demand?.demandCode || '').trim().toUpperCase();
            if (demandId) demandIdSet.add(demandId);
            if (demandCodeKey) demandCodeSet.add(demandCodeKey);
            const linkedIds = PlanningModule.getDemandLinkedWorkOrderIds(demand);
            linkedIds.forEach((id) => linkedWorkOrderIds.add(String(id || '').trim()));
        });

        const workOrders = Array.isArray(DB.data?.data?.workOrders) ? DB.data.data.workOrders : [];
        const linkedWorkOrderCodeSet = new Set();
        workOrders.forEach((order) => {
            const orderIdKey = String(order?.id || '').trim();
            if (!orderIdKey || !linkedWorkOrderIds.has(orderIdKey)) return;
            const codeKey = String(order?.workOrderCode || '').trim().toUpperCase();
            if (codeKey) linkedWorkOrderCodeSet.add(codeKey);
        });

        if (linkedWorkOrderIds.size > 0) {
            // DEMO/PROTOTYPE HARD DELETE:
            // Satis siparisi silindiginde bagli test verisi zincirsel temizlenir.
            // Canli ERP'de bu akis hard delete degil, iptal/arsiv kurali olarak ele alinmalidir.
            PlanningModule.purgeDepotOutputsByWorkOrderIds(linkedWorkOrderIds);
        }

        let dispatchRowsBefore = 0;
        if (Array.isArray(DB.data?.data?.workOrderDispatchNotes)) {
            dispatchRowsBefore = (DB.data.data.workOrderDispatchNotes || []).reduce((sum, note) => {
                const rows = Array.isArray(note?.rows) ? note.rows : [];
                return sum + rows.length;
            }, 0);
        }
        PlanningModule.purgeDispatchNotesByWorkOrderIds(linkedWorkOrderIds);
        let dispatchRowsAfter = 0;
        if (Array.isArray(DB.data?.data?.workOrderDispatchNotes)) {
            dispatchRowsAfter = (DB.data.data.workOrderDispatchNotes || []).reduce((sum, note) => {
                const rows = Array.isArray(note?.rows) ? note.rows : [];
                return sum + rows.length;
            }, 0);
        }
        const removedDispatchNoteRowCount = Math.max(0, dispatchRowsBefore - dispatchRowsAfter);

        const txns = Array.isArray(DB.data?.data?.workOrderTransactions) ? DB.data.data.workOrderTransactions : [];
        const nextTxns = txns.filter((txn) => !linkedWorkOrderIds.has(String(txn?.workOrderId || '').trim()));
        const removedWorkOrderTxnCount = Math.max(0, txns.length - nextTxns.length);
        DB.data.data.workOrderTransactions = nextTxns;

        const nextWorkOrders = workOrders.filter((order) => !linkedWorkOrderIds.has(String(order?.id || '').trim()));
        const removedWorkOrderCount = Math.max(0, workOrders.length - nextWorkOrders.length);
        DB.data.data.workOrders = nextWorkOrders;

        let removedMontageDispatchCount = 0;
        if (Array.isArray(DB.data?.data?.montageJobDispatches)) {
            const montageRows = DB.data.data.montageJobDispatches;
            const nextMontageRows = montageRows.filter((row) => {
                const rowDemandId = String(row?.demandId || '').trim();
                const rowDemandCode = String(row?.demandCode || '').trim().toUpperCase();
                const rowDispatchKey = String(row?.dispatchKey || '').trim();
                const dispatchDemandId = rowDispatchKey ? String(rowDispatchKey.split('::')[0] || '').trim() : '';
                const rowSourceTypeKey = String(row?.sourceTypeKey || '').trim().toUpperCase();
                const rowWorkOrderTextKey = String(row?.workOrderText || '').trim().toUpperCase();
                const matchedByDemand = (rowDemandId && demandIdSet.has(rowDemandId))
                    || (dispatchDemandId && demandIdSet.has(dispatchDemandId))
                    || (rowDemandCode && demandCodeSet.has(rowDemandCode));
                if (matchedByDemand) return false;
                if (rowSourceTypeKey !== 'SALES_ORDER' || linkedWorkOrderCodeSet.size === 0 || !rowWorkOrderTextKey) return true;
                for (const workOrderCode of linkedWorkOrderCodeSet) {
                    if (rowWorkOrderTextKey.includes(workOrderCode)) return false;
                }
                return true;
            });
            removedMontageDispatchCount = Math.max(0, montageRows.length - nextMontageRows.length);
            DB.data.data.montageJobDispatches = nextMontageRows;
        }

        DB.data.data.planningDemands = keptDemands;

        if (PlanningModule.state.planningPoolRowsByDemand && typeof PlanningModule.state.planningPoolRowsByDemand === 'object') {
            matchedDemands.forEach((demand) => {
                delete PlanningModule.state.planningPoolRowsByDemand[String(demand?.id || '')];
            });
        }
        if (PlanningModule.state.planningPoolBuildTokenByDemand && typeof PlanningModule.state.planningPoolBuildTokenByDemand === 'object') {
            matchedDemands.forEach((demand) => {
                delete PlanningModule.state.planningPoolBuildTokenByDemand[String(demand?.id || '')];
            });
        }
        if (PlanningModule.state.planningPoolExpandedItemByDemand && typeof PlanningModule.state.planningPoolExpandedItemByDemand === 'object') {
            matchedDemands.forEach((demand) => {
                delete PlanningModule.state.planningPoolExpandedItemByDemand[String(demand?.id || '')];
            });
        }
        if (PlanningModule.state.releasedExpandedItemByDemand && typeof PlanningModule.state.releasedExpandedItemByDemand === 'object') {
            matchedDemands.forEach((demand) => {
                delete PlanningModule.state.releasedExpandedItemByDemand[String(demand?.id || '')];
            });
        }

        return {
            removedDemandCount: matchedDemands.length,
            removedWorkOrderCount,
            removedWorkOrderTxnCount,
            removedDispatchNoteRowCount,
            removedMontageDispatchCount
        };
    },

    cleanupOrphanSalesOrderRecordsForDemo: () => {
        const orders = Array.isArray(DB.data?.data?.orders) ? DB.data.data.orders : [];
        const existingOrderIdSet = new Set(
            orders
                .map((order) => String(order?.id || '').trim())
                .filter(Boolean)
        );
        const existingOrderNoSet = new Set(
            orders
                .map((order) => String(order?.orderNo || order?.orderCode || '').trim().toUpperCase())
                .filter(Boolean)
        );
        const allDemands = PlanningModule.getDemands();
        if (!allDemands.length) {
            return {
                removedDemandCount: 0,
                removedWorkOrderCount: 0,
                removedWorkOrderTxnCount: 0,
                removedDispatchNoteRowCount: 0,
                removedMontageDispatchCount: 0
            };
        }
        const orphanDemands = allDemands.filter((demand) => {
            const sourceType = String(demand?.sourceType || '').trim().toUpperCase();
            if (sourceType !== 'SALES_ORDER') return false;
            const sourceOrderId = String(demand?.sourceOrderId || '').trim();
            if (sourceOrderId) return !existingOrderIdSet.has(sourceOrderId);
            const sourceOrderNoKey = String(demand?.sourceOrderNo || '').trim().toUpperCase();
            if (sourceOrderNoKey) return !existingOrderNoSet.has(sourceOrderNoKey);
            return true;
        });
        if (!orphanDemands.length) {
            return {
                removedDemandCount: 0,
                removedWorkOrderCount: 0,
                removedWorkOrderTxnCount: 0,
                removedDispatchNoteRowCount: 0,
                removedMontageDispatchCount: 0
            };
        }
        // DEMO/PROTOTYPE HARD DELETE:
        // Orders koleksiyonunda karsiligi kalmayan satis siparisi kaynakli zincir veriler temizlenir.
        // Canli ERP'de bu davranis hard delete degil, iptal/arsiv akisina cevrilmelidir.
        return PlanningModule.cleanupSalesOrderCascadeForDemo('__ORPHAN_SALES_ORDER__', {
            demands: orphanDemands
        });
    },

    schedulePlanningDemandCleanupSave: () => {
        if (PlanningModule.state.planningDemandCleanupSavePending) return;
        PlanningModule.state.planningDemandCleanupSavePending = true;
        Promise.resolve()
            .then(() => DB.save())
            .catch(() => {})
            .finally(() => {
                PlanningModule.state.planningDemandCleanupSavePending = false;
            });
    },

    normalizeStatusText: (value) => String(value || '')
        .toLowerCase()
        .replace(/[ç]/g, 'c')
        .replace(/[ğ]/g, 'g')
        .replace(/[ı]/g, 'i')
        .replace(/[ö]/g, 'o')
        .replace(/[ş]/g, 's')
        .replace(/[ü]/g, 'u')
        .trim(),

    normalizeSalesOrderStatusGroup: (status) => {
        if (typeof SalesModule !== 'undefined'
            && SalesModule
            && typeof SalesModule.normalizeSalesOrderStatusGroup === 'function') {
            return String(SalesModule.normalizeSalesOrderStatusGroup(status) || 'WAITING').toUpperCase();
        }
        const text = PlanningModule.normalizeStatusText(status);
        if (!text) return 'WAITING';
        if (text.includes('arsiv')) return 'ARCHIVED';
        if (text.includes('iptal') || text.includes('cancel')) return 'CANCELLED';
        if (text.includes('bekliyor') || text.includes('teklif') || text.includes('taslak')) return 'WAITING';
        if (text.includes('tamam') || text.includes('teslim') || text.includes('sevk') || text.includes('donus')) return 'APPROVED';
        if (text.includes('onay')) return 'APPROVED';
        return 'WAITING';
    },

    getSalesOrderLineId: (line) => {
        const id = String(line?.id || '').trim();
        if (id) return id;
        const lineId = String(line?.lineId || '').trim();
        return lineId;
    },

    normalizePlanningModelVariantId: (rawVariantId) => {
        const raw = String(rawVariantId || '').trim();
        if (!raw) return '';
        if (raw.toLowerCase().startsWith('salesvar_')) return raw;
        return `salesvar_${raw}`;
    },

    getSalesDemandDueDate: (order, line) => String(
        line?.deliveryDate
        || line?.dueDate
        || order?.deliveryDate
        || order?.dueDate
        || order?.orderDate
        || '-'
    ).trim() || '-',

    isSalesOrderLineAlreadyInPlanningDemands: (orderId, lineId) => {
        const targetOrderId = String(orderId || '').trim();
        const targetLineId = String(lineId || '').trim();
        if (!targetOrderId || !targetLineId) return false;
        return PlanningModule.getDemands().some((row) =>
            String(row?.sourceType || '').trim().toUpperCase() === 'SALES_ORDER'
            && String(row?.sourceOrderId || '').trim() === targetOrderId
            && String(row?.sourceLineId || '').trim() === targetLineId
        );
    },

    resolveSalesDemandSourceByRow: (row) => {
        const orderId = String(row?.orderId || '').trim();
        if (!orderId) return { ok: false, reason: 'ORDER_NOT_FOUND' };
        const orders = Array.isArray(DB.data?.data?.orders) ? DB.data.data.orders : [];
        const order = orders.find((item) => String(item?.id || '').trim() === orderId);
        if (!order) return { ok: false, reason: 'ORDER_NOT_FOUND' };
        const statusGroup = PlanningModule.normalizeSalesOrderStatusGroup(order?.status);
        if (statusGroup !== 'APPROVED') return { ok: false, reason: 'ORDER_NOT_APPROVED', order };

        const targetLineId = String(row?.lineId || '').trim();
        if (!targetLineId) return { ok: false, reason: 'LINE_ID_MISSING', order };
        const lines = Array.isArray(order?.lines) ? order.lines : [];
        const line = lines.find((item) => PlanningModule.getSalesOrderLineId(item) === targetLineId);
        if (!line) return { ok: false, reason: 'LINE_NOT_FOUND', order };
        const stableLineId = PlanningModule.getSalesOrderLineId(line);
        if (!stableLineId) return { ok: false, reason: 'LINE_ID_MISSING', order, line };

        return { ok: true, order, line, lineId: stableLineId };
    },

    getSalesDemandRows: () => {
        const orders = Array.isArray(DB.data?.data?.orders) ? DB.data.data.orders : [];
        const sentSet = new Set(
            PlanningModule.getDemands()
                .filter((row) => String(row?.sourceType || '').trim().toUpperCase() === 'SALES_ORDER')
                .map((row) => `${String(row?.sourceOrderId || '').trim()}::${String(row?.sourceLineId || '').trim()}`)
                .filter((key) => key !== '::')
        );

        const rows = [];
        let fallbackRefCounter = 1;
        const isUuidLike = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());
        orders.forEach((order) => {
            const statusGroup = PlanningModule.normalizeSalesOrderStatusGroup(order?.status);
            if (statusGroup !== 'APPROVED') return;

            const orderId = String(order?.id || '').trim();
            const orderNo = String(order?.orderNo || order?.orderCode || order?.code || '-').trim() || '-';
            const orderLines = Array.isArray(order?.lines) ? order.lines : [];

            orderLines.forEach((line) => {
                const lineId = PlanningModule.getSalesOrderLineId(line);
                const hasLineId = !!lineId;
                const productName = String(line?.productName || line?.name || '-').trim() || '-';
                const code = String(line?.variantCode || line?.variationCode || line?.productCode || line?.code || '-').trim() || '-';
                const qty = PlanningModule.parseQty(line?.qty ?? line?.quantity ?? line?.amount ?? 0, 0);
                const dueDate = PlanningModule.getSalesDemandDueDate(order, line);
                const createdAt = String(order?.updated_at || order?.created_at || order?.orderDate || '').trim();
                const createdMs = Date.parse(createdAt);
                const sentKey = `${orderId}::${lineId}`;
                const alreadySent = hasLineId && sentSet.has(sentKey);
                const displayLineId = hasLineId ? lineId : '-';
                const safeOrderNo = (!isUuidLike(orderNo) && String(orderNo || '').trim())
                    ? String(orderNo || '').trim()
                    : '';
                const safeRef = safeOrderNo || `TLP-${String(fallbackRefCounter).padStart(4, '0')}`;
                fallbackRefCounter += 1;

                rows.push({
                    key: `${orderId || orderNo}::${displayLineId}`,
                    orderId,
                    lineId: displayLineId,
                    safeRef,
                    productName,
                    code,
                    qty,
                    dueDate,
                    statusLabel: alreadySent ? 'Planlama Havuzuna Gonderildi' : 'Onaylandi / Planlamaya Bekliyor',
                    createdMs: Number.isFinite(createdMs) ? createdMs : 0,
                    canSend: hasLineId && !alreadySent,
                    alreadySent,
                    lineIdMissing: !hasLineId
                });
            });
        });

        return rows.sort((a, b) => Number(b?.createdMs || 0) - Number(a?.createdMs || 0));
    },

    isUuidLike: (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim()),

    getDateRangeLabel: (values) => {
        const list = (Array.isArray(values) ? values : [])
            .map((value) => String(value || '').trim())
            .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
            .sort((a, b) => a.localeCompare(b));
        if (!list.length) return '-';
        if (list[0] === list[list.length - 1]) return list[0];
        return `${list[0]} - ${list[list.length - 1]}`;
    },

    getSalesDemandGroupRows: (rows) => {
        const safeRows = Array.isArray(rows) ? rows : [];
        const orders = Array.isArray(DB.data?.data?.orders) ? DB.data.data.orders : [];
        const map = new Map();

        safeRows.forEach((row, idx) => {
            const orderId = String(row?.orderId || '').trim();
            const groupKey = orderId || `sales-group:${idx + 1}`;
            if (!map.has(groupKey)) {
                const order = orders.find((item) => String(item?.id || '').trim() === orderId) || null;
                const rawOrderNo = String(order?.orderNo || order?.orderCode || order?.code || '').trim();
                const safeOrderNo = rawOrderNo && !PlanningModule.isUuidLike(rawOrderNo) ? rawOrderNo : '';
                map.set(groupKey, {
                    key: groupKey,
                    sourceOrderId: orderId,
                    sourceOrderNo: safeOrderNo,
                    safeRef: safeOrderNo || String(row?.safeRef || '-').trim() || '-',
                    sourceTypeLabel: 'Satis Siparisi',
                    rows: [],
                    createdMs: Number(row?.createdMs || 0)
                });
            }
            const group = map.get(groupKey);
            group.rows.push(row);
            group.createdMs = Math.max(group.createdMs, Number(row?.createdMs || 0));
        });

        return Array.from(map.values())
            .map((group) => {
                const lines = Array.isArray(group?.rows) ? group.rows : [];
                const totalQty = lines.reduce((sum, line) => sum + PlanningModule.parseQty(line?.qty, 0), 0);
                const sentCount = lines.filter((line) => !!line?.alreadySent).length;
                const pendingCount = Math.max(0, lines.length - sentCount);
                const statusLabel = sentCount === lines.length && lines.length > 0
                    ? 'Tum kalemler havuzda'
                    : (sentCount > 0 ? 'Kismi gonderildi' : 'Planlamaya bekliyor');
                return {
                    ...group,
                    itemCount: lines.length,
                    totalQty,
                    sentCount,
                    pendingCount,
                    dueRange: PlanningModule.getDateRangeLabel(lines.map((line) => line?.dueDate)),
                    statusLabel
                };
            })
            .sort((a, b) => Number(b?.createdMs || 0) - Number(a?.createdMs || 0));
    },

    getPlanningPoolDemandGroups: (rows) => {
        const safeRows = Array.isArray(rows) ? rows : [];
        const map = new Map();

        safeRows.forEach((row, idx) => {
            const sourceType = String(row?.sourceType || '').trim().toUpperCase();
            const isSales = sourceType === 'SALES_ORDER';
            const sourceOrderId = String(row?.sourceOrderId || '').trim();
            const demandId = String(row?.id || '').trim();
            const groupKey = isSales
                ? (sourceOrderId || `sales:${demandId || idx + 1}`)
                : (demandId || `stock:${idx + 1}`);
            const label = isSales ? 'Satis Siparisi' : 'Stok Icin Uretim';
            const reference = isSales
                ? (String(row?.sourceOrderNo || '').trim() || String(row?.demandCode || '-').trim() || '-')
                : (String(row?.demandCode || '-').trim() || '-');

            if (!map.has(groupKey)) {
                map.set(groupKey, {
                    key: groupKey,
                    sourceType: isSales ? 'SALES_ORDER' : 'STOCK',
                    sourceTypeLabel: label,
                    reference,
                    rows: []
                });
            }
            map.get(groupKey).rows.push(row);
        });

        return Array.from(map.values())
            .map((group) => {
                const demands = Array.isArray(group?.rows) ? group.rows : [];
                const totalQty = demands.reduce((sum, demand) => sum + PlanningModule.parseQty(demand?.qty, 0), 0);
                const releasedCount = demands.filter((demand) => String(demand?.status || 'OPEN').toUpperCase() === 'RELEASED').length;
                const pendingCount = Math.max(0, demands.length - releasedCount);
                const dueRange = PlanningModule.getDateRangeLabel(demands.map((demand) => demand?.dueDate));
                return {
                    ...group,
                    itemCount: demands.length,
                    totalQty,
                    releasedCount,
                    pendingCount,
                    dueRange
                };
            })
            .sort((a, b) => {
                const ad = String((Array.isArray(a?.rows) && a.rows[0]?.dueDate) || '9999-12-31');
                const bd = String((Array.isArray(b?.rows) && b.rows[0]?.dueDate) || '9999-12-31');
                if (ad !== bd) return ad.localeCompare(bd);
                return String(a?.reference || '').localeCompare(String(b?.reference || ''), 'tr');
            });
    },

    toggleSalesDemandGroupExpand: (groupKey) => {
        const key = String(groupKey || '').trim();
        const same = String(PlanningModule.state.salesDemandExpandedGroupKey || '') === key;
        PlanningModule.state.salesDemandExpandedGroupKey = same ? '' : key;
        UI.renderCurrentPage();
    },

    togglePlanningPoolGroupExpand: (groupKey) => {
        const key = String(groupKey || '').trim();
        const same = String(PlanningModule.state.planningPoolExpandedGroupKey || '') === key;
        PlanningModule.state.planningPoolExpandedGroupKey = same ? '' : key;
        UI.renderCurrentPage();
    },

    togglePlanningPoolReleasedGroupExpand: (groupKey) => {
        const key = String(groupKey || '').trim();
        const same = String(PlanningModule.state.planningPoolReleasedExpandedGroupKey || '') === key;
        PlanningModule.state.planningPoolReleasedExpandedGroupKey = same ? '' : key;
        UI.renderCurrentPage();
    },

    openGroupDetailWorkspace: (scope, groupKey, backView = '') => {
        PlanningModule.state.planningDetailScope = String(scope || '').trim();
        PlanningModule.state.planningDetailGroupKey = String(groupKey || '').trim();
        PlanningModule.state.planningDetailBackView = String(backView || PlanningModule.state.workspaceView || '').trim();
        PlanningModule.state.releasedDetailInlineTrackingDemandId = '';
        PlanningModule.state.workspaceView = 'group-detail';
        UI.renderCurrentPage();
    },

    backFromGroupDetailWorkspace: () => {
        const backView = String(PlanningModule.state.planningDetailBackView || 'menu').trim() || 'menu';
        PlanningModule.state.planningDetailScope = '';
        PlanningModule.state.planningDetailGroupKey = '';
        PlanningModule.state.planningDetailBackView = '';
        PlanningModule.state.releasedDetailInlineTrackingDemandId = '';
        PlanningModule.openWorkspace(backView);
    },

    getPlanningPoolOpenRows: () => {
        const allRows = PlanningModule.getDemands().slice();
        const priorityOrder = ['URGENT', 'HIGH', 'NORMAL', 'LOW'];
        return allRows
            .filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'OPEN')
            .sort((a, b) => {
                const da = String(a?.dueDate || '9999-12-31');
                const db = String(b?.dueDate || '9999-12-31');
                if (da !== db) return da.localeCompare(db);
                return priorityOrder.indexOf(PlanningModule.getPriorityValue(a?.priority || 'NORMAL'))
                    - priorityOrder.indexOf(PlanningModule.getPriorityValue(b?.priority || 'NORMAL'));
            });
    },

    getPlanningPoolReleasedVisibleRows: () => {
        const allRows = PlanningModule.getDemands().slice();
        const releasedRows = allRows
            .filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'RELEASED')
            .sort((a, b) => String(b?.released_at || '').localeCompare(String(a?.released_at || '')));
        const releasedEntries = releasedRows.map((row) => ({
            row,
            statusMeta: PlanningModule.getReleasedDemandStatusMeta(PlanningModule.getReleasedDemandItemGroups(row), row)
        }));
        const activeReleasedRows = releasedEntries.filter((entry) => !entry?.statusMeta?.archived).map((entry) => entry.row);
        const archiveReleasedRows = releasedEntries.filter((entry) => !!entry?.statusMeta?.archived).map((entry) => entry.row);
        const showPoolArchive = !!PlanningModule.state.planningPoolArchiveMode;
        return showPoolArchive ? archiveReleasedRows : activeReleasedRows;
    },

    sendSalesOrderLineToPlanningPool: async (rowKey) => {
        const key = String(rowKey || '').trim();
        const map = PlanningModule.state.salesDemandRowsByKey && typeof PlanningModule.state.salesDemandRowsByKey === 'object'
            ? PlanningModule.state.salesDemandRowsByKey
            : {};
        const row = map[key];
        if (!row) return alert('Siparis satiri bulunamadi.');

        const resolved = PlanningModule.resolveSalesDemandSourceByRow(row);
        if (!resolved.ok) {
            if (resolved.reason === 'ORDER_NOT_APPROVED') return alert('Siparis artik onayli degil. Planlama havuzuna gonderilemedi.');
            if (resolved.reason === 'LINE_ID_MISSING') return alert('Siparis satirinda lineId/id bulunamadi. Planlama havuzuna gonderilemedi.');
            if (resolved.reason === 'LINE_NOT_FOUND') return alert('Siparis satiri bulunamadi veya degismis. Sayfayi yenileyip tekrar deneyin.');
            return alert('Siparis kaydi bulunamadi. Sayfayi yenileyip tekrar deneyin.');
        }

        const order = resolved.order;
        const line = resolved.line;
        const stableLineId = String(resolved.lineId || '').trim();
        const sourceOrderId = String(order?.id || '').trim();
        if (PlanningModule.isSalesOrderLineAlreadyInPlanningDemands(sourceOrderId, stableLineId)) {
            return alert('Bu siparis satiri zaten planlama havuzuna gonderilmis.');
        }

        const customerId = String(order?.customerId || order?.customer?.id || '').trim();
        const customers = Array.isArray(DB.data?.data?.customers) ? DB.data.data.customers : [];
        const customer = customers.find((item) => String(item?.id || '').trim() === customerId) || null;
        const sourceCustomerRefId = String(customer?.customerRefId || '').trim() || '-';
        const code = String(line?.variantCode || line?.variationCode || line?.productCode || line?.code || '-').trim() || '-';
        const normalizedVariantId = PlanningModule.normalizePlanningModelVariantId(String(line?.variationId || '').trim());
        const qty = PlanningModule.parseQty(line?.qty ?? line?.quantity ?? line?.amount ?? 0, 0);
        if (qty <= 0) return alert('Siparis satir adedi gecersiz. Planlama havuzuna gonderilemedi.');
        const now = new Date().toISOString();

        const demand = {
            id: crypto.randomUUID(),
            demandCode: PlanningModule.getNextDemandCode(),
            sourceType: 'SALES_ORDER',
            sourceLabel: 'Satis Siparisi',
            sourceOrderId,
            sourceOrderNo: String(order?.orderNo || order?.orderCode || order?.code || '-').trim() || '-',
            sourceLineId: stableLineId,
            sourceCustomerRefId,
            itemType: 'MODEL',
            productId: String(line?.productId || '').trim(),
            variantId: normalizedVariantId,
            productName: String(line?.productName || line?.name || '-').trim() || '-',
            variantCode: code,
            productCode: code,
            qty,
            dueDate: PlanningModule.getSalesDemandDueDate(order, line),
            priority: 'NORMAL',
            status: 'OPEN',
            note: '',
            items: [{
                id: crypto.randomUUID(),
                itemType: 'MODEL',
                qty,
                variantId: normalizedVariantId,
                componentId: '',
                semiFinishedId: '',
                familyId: '',
                variantCode: code,
                componentCode: '',
                semiFinishedCode: '',
                productGroup: '',
                productName: String(line?.productName || line?.name || '-').trim() || '-',
                productCode: code,
                montageCardId: '',
                montageCardCode: ''
            }],
            workOrderId: '',
            workOrderCode: '',
            workOrderIds: [],
            workOrderCodes: [],
            created_at: now,
            updated_at: now
        };

        PlanningModule.getDemands().push(demand);
        await DB.save();
        alert(`Planlama havuzuna gonderildi: ${demand.demandCode}`);
        Modal.close();
        UI.renderCurrentPage();
    },

    openSalesDemandDetailModal: (rowKey) => {
        const key = String(rowKey || '').trim();
        const map = PlanningModule.state.salesDemandRowsByKey && typeof PlanningModule.state.salesDemandRowsByKey === 'object'
            ? PlanningModule.state.salesDemandRowsByKey
            : {};
        const row = map[key];
        if (!row) {
            alert('Siparis satiri bulunamadi.');
            return;
        }

        const html = `
            <div style="display:grid; gap:0.7rem;">
                <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.55rem;">
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Talep Referansi</div><div style="font-family:monospace; font-weight:800; color:#1d4ed8;">${PlanningModule.escapeHtml(row.safeRef || '-')}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Urun</div><div style="font-weight:700; color:#0f172a;">${PlanningModule.escapeHtml(row.productName || '-')}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Varyasyon / Kod</div><div style="font-family:monospace; font-weight:700; color:#0f172a;">${PlanningModule.escapeHtml(row.code || '-')}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Adet</div><div style="font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(row.qty || 0))}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Termin</div><div style="font-weight:700; color:#0f172a;">${PlanningModule.escapeHtml(row.dueDate || '-')}</div></div>
                </div>
                <div style="border:1px solid #bfdbfe; background:#eff6ff; color:#1e3a8a; border-radius:0.65rem; padding:0.6rem;">
                    <div style="font-size:0.78rem; font-weight:800;">Durum</div>
                    <div style="font-size:0.86rem; margin-top:0.15rem;">${PlanningModule.escapeHtml(row.statusLabel || 'Onaylandi / Planlamaya Bekliyor')}</div>
                    <div style="font-size:0.76rem; margin-top:0.35rem;">${row.alreadySent ? 'Bu satir planlama havuzuna gonderildi.' : 'Onayli satir planlama havuzuna gonderilebilir.'}</div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.45rem;">
                    <button class="btn-primary" onclick="PlanningModule.sendSalesOrderLineToPlanningPool('${PlanningModule.escapeJsString(row.key || '')}')" ${row.canSend ? '' : 'disabled'} style="${row.canSend ? '' : 'opacity:0.45; cursor:not-allowed;'}">${row.alreadySent ? 'planlama havuzuna gonderildi' : 'planlama havuzuna gonder'}</button>
                    <button class="btn-sm" onclick="Modal.close()">kapat</button>
                </div>
            </div>
        `;
        Modal.open(`Siparis Satiri Goruntule - ${PlanningModule.escapeHtml(String(row.safeRef || '-'))}`, html, { maxWidth: '980px' });
    },

    findDemandBySalesRow: (row) => {
        const orderId = String(row?.orderId || '').trim();
        const lineId = String(row?.lineId || '').trim();
        if (!orderId || !lineId || lineId === '-') return null;
        return PlanningModule.getDemands().find((demand) =>
            String(demand?.sourceType || '').trim().toUpperCase() === 'SALES_ORDER'
            && String(demand?.sourceOrderId || '').trim() === orderId
            && String(demand?.sourceLineId || '').trim() === lineId
        ) || null;
    },

    getDemandItemTrackingSnapshot: (demand, itemKey = '', fallbackCode = '') => {
        if (!demand) {
            return {
                workOrderText: '-',
                routeText: '-',
                waitingQty: 0,
                inProgressQty: 0,
                completedQty: 0,
                remainingQty: 0,
                nextStation: '-',
                storageText: 'Planlama asamasinda',
                found: false
            };
        }

        const demandItems = PlanningModule.getDemandItems(demand);
        const groups = PlanningModule.getReleasedDemandItemGroups(demand);
        const normalizedKey = String(itemKey || '').trim();
        const normalizedCode = String(fallbackCode || '').trim().toUpperCase();
        const targetItem = demandItems.find((item) => String(item?.id || '').trim() === normalizedKey)
            || demandItems.find((item) => String(PlanningModule.getDemandItemCode(item) || '').trim().toUpperCase() === normalizedCode)
            || demandItems[0]
            || null;
        const targetItemKey = String(targetItem?.id || '').trim();
        const targetCode = String(PlanningModule.getDemandItemCode(targetItem || {}) || '').trim().toUpperCase();
        const targetGroup = groups.find((group) => String(group?.itemKey || '').trim() === normalizedKey)
            || groups.find((group) => String(group?.itemKey || '').trim() === targetItemKey)
            || groups.find((group) => String(group?.itemCode || '').trim().toUpperCase() === targetCode)
            || null;
        const targetQty = PlanningModule.parseQty(targetItem?.qty, PlanningModule.parseQty(demand?.qty, 0));

        if (!targetGroup) {
            const poolRows = PlanningModule.getPlanningPoolRows(String(demand?.id || '').trim());
            const relatedRows = poolRows.filter((row) => {
                const rowKey = String(row?.itemKey || '').trim();
                const rowCode = String(row?.itemCode || row?.code || '').trim().toUpperCase();
                if (normalizedKey && rowKey && rowKey === normalizedKey) return true;
                if (targetItemKey && rowKey && rowKey === targetItemKey) return true;
                if (targetCode && rowCode && rowCode === targetCode) return true;
                return false;
            });
            const summaryRows = relatedRows.length ? relatedRows : [];
            const summary = PlanningModule.getPlanningPoolSummary(summaryRows);
            const requiredQty = summaryRows.reduce((sum, row) => sum + PlanningModule.parseQty(row?.requiredQty, 0), 0);
            const netQty = PlanningModule.parseQty(summary?.netQty, targetQty);
            const scaledWaitingQty = requiredQty > 0 && targetQty > 0
                ? Math.ceil((netQty * targetQty) / requiredQty)
                : netQty;
            const waitingQty = PlanningModule.clampQty(scaledWaitingQty, 0, targetQty);
            return {
                workOrderText: '-',
                routeText: 'Planlama Havuzu',
                waitingQty,
                inProgressQty: 0,
                completedQty: 0,
                remainingQty: waitingQty,
                nextStation: 'Planlama Havuzu',
                storageText: 'Is emrine donusum bekliyor',
                found: false
            };
        }

        const lines = Array.isArray(targetGroup?.lines) ? targetGroup.lines : [];
        const workOrderCodes = Array.from(new Set(lines.map((line) => String(line?.workOrderCode || '').trim()).filter(Boolean)));
        const stationLoads = Array.isArray(targetGroup?.activeStationLoads) ? targetGroup.activeStationLoads : [];
        const routeText = stationLoads.length
            ? stationLoads.map((load) => `${String(load?.stationName || '-')}: ${PlanningModule.parseQty(load?.qty, 0)}`).join(' | ')
            : '-';
        const componentTargetQty = PlanningModule.parseQty(targetGroup?.totalTargetQty, 0);
        const componentDoneQty = PlanningModule.parseQty(targetGroup?.totalDoneQty, 0);
        const componentInProgressQty = stationLoads.reduce((sum, load) => sum + PlanningModule.parseQty(load?.qty, 0), 0);
        let completedQty = 0;
        let inProgressQty = 0;
        if (componentTargetQty > 0 && targetQty > 0) {
            completedQty = PlanningModule.clampQty(
                Math.floor((componentDoneQty * targetQty) / componentTargetQty),
                0,
                targetQty
            );
            inProgressQty = componentInProgressQty > 0
                ? PlanningModule.clampQty(
                    Math.ceil((componentInProgressQty * targetQty) / componentTargetQty),
                    0,
                    Math.max(0, targetQty - completedQty)
                )
                : 0;
        } else {
            completedQty = PlanningModule.clampQty(componentDoneQty, 0, targetQty);
            inProgressQty = PlanningModule.clampQty(componentInProgressQty, 0, Math.max(0, targetQty - completedQty));
        }
        const remainingQty = Math.max(0, targetQty - completedQty);
        const waitingQty = Math.max(0, remainingQty - inProgressQty);
        const nextStation = lines.find((line) => String(line?.currentStationName || '').trim() && String(line?.currentStationName || '').trim() !== '-')?.currentStationName
            || (remainingQty > 0 ? 'Uretim sirasi' : 'Montaj / Depo');

        return {
            workOrderText: workOrderCodes.length ? (workOrderCodes.length > 1 ? `${workOrderCodes[0]} +${workOrderCodes.length - 1}` : workOrderCodes[0]) : '-',
            routeText,
            waitingQty,
            inProgressQty,
            completedQty,
            remainingQty,
            nextStation: String(nextStation || '-'),
            storageText: remainingQty <= 0 ? 'Tamamlandi / depoya bekliyor' : 'Uretim devam ediyor',
            found: true
        };
    },

    openSalesDemandLineTracking: (rowKey) => {
        const key = String(rowKey || '').trim();
        const map = PlanningModule.state.salesDemandRowsByKey && typeof PlanningModule.state.salesDemandRowsByKey === 'object'
            ? PlanningModule.state.salesDemandRowsByKey
            : {};
        const row = map[key];
        if (!row) return alert('Siparis kalemi bulunamadi.');

        const demand = PlanningModule.findDemandBySalesRow(row);
        const snapshot = PlanningModule.getDemandItemTrackingSnapshot(demand, '', String(row?.code || '').trim());
        const html = `
            <div style="display:grid; gap:0.6rem;">
                <div style="font-size:0.82rem; color:#334155;">Kalem: <b>${PlanningModule.escapeHtml(row?.productName || '-')}</b> / <span style="font-family:monospace;">${PlanningModule.escapeHtml(row?.code || '-')}</span></div>
                <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.5rem;">
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;"><div style="font-size:0.72rem; color:#64748b;">Is emri no</div><div style="font-family:monospace; font-weight:700; color:#1d4ed8;">${PlanningModule.escapeHtml(snapshot.workOrderText)}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;"><div style="font-size:0.72rem; color:#64748b;">Mevcut rota / istasyon</div><div style="font-weight:700; color:#334155;">${PlanningModule.escapeHtml(snapshot.routeText)}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;"><div style="font-size:0.72rem; color:#64748b;">Bekleyen miktar</div><div style="font-weight:800;">${PlanningModule.escapeHtml(String(snapshot.waitingQty))}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;"><div style="font-size:0.72rem; color:#64748b;">Islemde miktar</div><div style="font-weight:800;">${PlanningModule.escapeHtml(String(snapshot.inProgressQty))}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;"><div style="font-size:0.72rem; color:#64748b;">Tamamlanan miktar</div><div style="font-weight:800;">${PlanningModule.escapeHtml(String(snapshot.completedQty))}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;"><div style="font-size:0.72rem; color:#64748b;">Kalan miktar</div><div style="font-weight:800;">${PlanningModule.escapeHtml(String(snapshot.remainingQty))}</div></div>
                </div>
                <div style="border:1px solid #cbd5e1; border-radius:0.65rem; padding:0.55rem; background:#f8fafc;">
                    <div style="font-size:0.72rem; color:#64748b;">Sonraki istasyon</div>
                    <div style="font-weight:700; color:#1e293b;">${PlanningModule.escapeHtml(snapshot.nextStation)}</div>
                    <div style="font-size:0.75rem; color:#64748b; margin-top:0.2rem;">Depo / montaj: ${PlanningModule.escapeHtml(snapshot.storageText)}</div>
                </div>
            </div>
        `;
        Modal.open(`Kalem Izleme - ${PlanningModule.escapeHtml(String(row?.safeRef || '-'))}`, html, { maxWidth: '900px' });
    },

    openDemandItemTrackingModal: (demandId, itemKey, fallbackCode = '') => {
        const demand = PlanningModule.getDemands().find((row) => String(row?.id || '') === String(demandId || ''));
        if (!demand) return alert('Talep kaydi bulunamadi.');
        const snapshot = PlanningModule.getDemandItemTrackingSnapshot(demand, itemKey, fallbackCode);
        const demandCode = String(demand?.demandCode || '-');
        const html = `
            <div style="display:grid; gap:0.6rem;">
                <div style="font-size:0.82rem; color:#334155;">Talep: <span style="font-family:monospace; font-weight:700; color:#1d4ed8;">${PlanningModule.escapeHtml(demandCode)}</span></div>
                <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.5rem;">
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;"><div style="font-size:0.72rem; color:#64748b;">Is emri no</div><div style="font-family:monospace; font-weight:700; color:#1d4ed8;">${PlanningModule.escapeHtml(snapshot.workOrderText)}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;"><div style="font-size:0.72rem; color:#64748b;">Mevcut rota / istasyon</div><div style="font-weight:700; color:#334155;">${PlanningModule.escapeHtml(snapshot.routeText)}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;"><div style="font-size:0.72rem; color:#64748b;">Bekleyen miktar</div><div style="font-weight:800;">${PlanningModule.escapeHtml(String(snapshot.waitingQty))}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;"><div style="font-size:0.72rem; color:#64748b;">Islemde miktar</div><div style="font-weight:800;">${PlanningModule.escapeHtml(String(snapshot.inProgressQty))}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;"><div style="font-size:0.72rem; color:#64748b;">Tamamlanan miktar</div><div style="font-weight:800;">${PlanningModule.escapeHtml(String(snapshot.completedQty))}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;"><div style="font-size:0.72rem; color:#64748b;">Kalan miktar</div><div style="font-weight:800;">${PlanningModule.escapeHtml(String(snapshot.remainingQty))}</div></div>
                </div>
                <div style="border:1px solid #cbd5e1; border-radius:0.65rem; padding:0.55rem; background:#f8fafc;">
                    <div style="font-size:0.72rem; color:#64748b;">Sonraki istasyon</div>
                    <div style="font-weight:700; color:#1e293b;">${PlanningModule.escapeHtml(snapshot.nextStation)}</div>
                    <div style="font-size:0.75rem; color:#64748b; margin-top:0.2rem;">Depo / montaj: ${PlanningModule.escapeHtml(snapshot.storageText)}</div>
                </div>
            </div>
        `;
        Modal.open(`Kalem Izleme - ${PlanningModule.escapeHtml(demandCode)}`, html, { maxWidth: '900px' });
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
            const variantId = PlanningModule.resolveDemandModelVariantId(item, demand);
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

    resolveDemandModelVariantId: (item, demand) => {
        const rawVariantId = String(item?.variantId || '').trim();
        if (!rawVariantId) return '';
        const direct = PlanningModule.findVariantById(rawVariantId);
        if (direct) return rawVariantId;
        const sourceType = String(demand?.sourceType || '').trim().toUpperCase();
        const kind = PlanningModule.normalizeDraftItemKind(item?.itemType || 'MODEL');
        if (sourceType !== 'SALES_ORDER' || kind !== 'MODEL') return rawVariantId;
        if (rawVariantId.toLowerCase().startsWith('salesvar_')) return rawVariantId;
        const normalizedVariantId = PlanningModule.normalizePlanningModelVariantId(rawVariantId);
        const normalized = PlanningModule.findVariantById(normalizedVariantId);
        return normalized ? normalizedVariantId : rawVariantId;
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

    getDepotQuantityByCode: (code, options = {}) => {
        const target = String(code || '').trim().toUpperCase();
        if (!target) return 0;
        const stockRows = Array.isArray(DB.data?.data?.stockDepotItems) ? DB.data.data.stockDepotItems : [];
        const legacyRows = Array.isArray(DB.data?.data?.inventory) ? DB.data.data.inventory : [];
        const allRows = [...stockRows, ...legacyRows];
        return allRows.reduce((sum, row) => {
            const rowCode = PlanningModule.getDepotRowCode(row);
            if (!rowCode || rowCode !== target) return sum;
            if (!PlanningModule.matchesDepotRowScope(row, options)) return sum;
            const qty = Number(row?.quantity ?? row?.qty ?? row?.amount ?? row?.value ?? 0);
            if (!Number.isFinite(qty) || qty <= 0) return sum;
            return sum + qty;
        }, 0);
    },

    getDepotRowCode: (row) => String(row?.productCode || row?.code || row?.itemCode || '').trim().toUpperCase(),

    getDepotRowDepotId: (row) => {
        const direct = String(row?.depotId || row?.nodeId || '').trim();
        if (direct) return direct;
        const nodeKey = String(row?.nodeKey || row?.depotKey || row?.key || '').trim();
        if (nodeKey.startsWith('managed:')) return nodeKey.slice('managed:'.length);
        const unitId = String(row?.unitId || row?.stationId || '').trim();
        if (unitId) return `unit:${unitId}`;
        return '';
    },

    getDepotRowLocationId: (row) => String(row?.locationId || '').trim(),

    getDepotRowLocationCode: (row) => {
        const direct = String(row?.locationCode || '').trim().toUpperCase();
        if (direct) return direct;
        const rafCode = String(row?.rafCode || '').trim().toUpperCase();
        const cellCode = String(row?.cellCode || '').trim().toUpperCase();
        if (rafCode && cellCode) return `${rafCode}-${cellCode}`;
        if (rafCode) return rafCode;
        return cellCode;
    },

    getDefaultLocationIdForDepot: (depotId) => {
        const key = String(depotId || '').trim();
        if (!key) return '';
        const locations = Array.isArray(DB.data?.data?.stockDepotLocations) ? DB.data.data.stockDepotLocations : [];
        const hit = locations.find((row) => String(row?.depotId || '').trim() === key) || null;
        return String(hit?.id || '').trim();
    },

    matchesDepotRowScope: (row, options = {}) => {
        const depotIdScope = String(options?.depotId || '').trim();
        const locationIdScope = String(options?.locationId || '').trim();
        const locationCodeScope = String(options?.locationCode || '').trim().toUpperCase();
        if (depotIdScope) {
            const rowDepotId = PlanningModule.getDepotRowDepotId(row);
            if (rowDepotId !== depotIdScope) return false;
        }
        if (locationIdScope) {
            const rowLocationId = PlanningModule.getDepotRowLocationId(row);
            if (rowLocationId !== locationIdScope) return false;
        }
        if (locationCodeScope) {
            const rowLocationCode = PlanningModule.getDepotRowLocationCode(row);
            if (String(rowLocationCode || '').trim().toUpperCase() !== locationCodeScope) return false;
        }
        return true;
    },

    getDepotRowStockKey: (row, fallback = {}) => {
        const code = PlanningModule.getDepotRowCode(row) || String(fallback?.code || '').trim().toUpperCase();
        const depotId = PlanningModule.getDepotRowDepotId(row) || String(fallback?.depotId || '').trim();
        const locationId = PlanningModule.getDepotRowLocationId(row) || String(fallback?.locationId || '').trim();
        return `${code}|${depotId}|${locationId}`;
    },

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

    consumeDepotQuantityByCode: (code, qty, options = {}) => {
        const target = String(code || '').trim().toUpperCase();
        let remaining = PlanningModule.parseQty(qty, 0);
        if (!target || remaining <= 0) return 0;
        const stockRows = Array.isArray(DB.data?.data?.stockDepotItems) ? DB.data.data.stockDepotItems : [];
        const legacyRows = Array.isArray(DB.data?.data?.inventory) ? DB.data.data.inventory : [];
        const consumeFromRows = (rows) => {
            const candidates = rows
                .filter((row) => PlanningModule.getDepotRowCode(row) === target)
                .filter((row) => PlanningModule.matchesDepotRowScope(row, options))
                .sort((a, b) => {
                    const timeCmp = String(a?.created_at || '').localeCompare(String(b?.created_at || ''));
                    if (timeCmp !== 0) return timeCmp;
                    const depotCmp = PlanningModule.getDepotRowDepotId(a).localeCompare(PlanningModule.getDepotRowDepotId(b), 'tr');
                    if (depotCmp !== 0) return depotCmp;
                    return PlanningModule.getDepotRowLocationId(a).localeCompare(PlanningModule.getDepotRowLocationId(b), 'tr');
                });
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
        const hasScopedFilter = !!String(options?.depotId || '').trim()
            || !!String(options?.locationId || '').trim()
            || !!String(options?.locationCode || '').trim();
        if (remaining > 0 && !hasScopedFilter) consumeFromRows(legacyRows);
        return PlanningModule.parseQty(qty, 0) - remaining;
    },

    increaseDepotQuantityByCode: (code, name, qty, options = {}) => {
        const target = String(code || '').trim().toUpperCase();
        const addQty = PlanningModule.parseQty(qty, 0);
        if (!target || addQty <= 0) return;
        if (!Array.isArray(DB.data?.data?.stockDepotItems)) DB.data.data.stockDepotItems = [];
        const stockRows = DB.data.data.stockDepotItems;
        const targetDepotId = String(options?.depotId || 'main').trim() || 'main';
        let targetLocationId = String(options?.locationId || '').trim();
        if (!targetLocationId && targetDepotId && !targetDepotId.startsWith('unit:')) {
            targetLocationId = PlanningModule.getDefaultLocationIdForDepot(targetDepotId);
        }
        const targetKey = PlanningModule.getDepotRowStockKey(null, {
            code: target,
            depotId: targetDepotId,
            locationId: targetLocationId
        });
        const existing = stockRows.find((row) => PlanningModule.getDepotRowStockKey(row) === targetKey);
        if (existing) {
            PlanningModule.setDepotRowQty(existing, PlanningModule.getDepotRowQty(existing) + addQty);
            if (!String(existing?.productName || '').trim()) existing.productName = String(name || target || '-');
            if (!String(existing?.name || '').trim()) existing.name = String(name || target || '-');
            if (!String(existing?.depotId || '').trim()) existing.depotId = targetDepotId;
            if (!String(existing?.locationId || '').trim() && targetLocationId) existing.locationId = targetLocationId;
            if (!String(existing?.stockClass || '').trim()) existing.stockClass = String(options?.stockClass || 'KULLANILABILIR');
            if (!String(existing?.status || '').trim()) existing.status = String(options?.status || options?.stockClass || 'KULLANILABILIR');
            return;
        }
        const locations = Array.isArray(DB.data?.data?.stockDepotLocations) ? DB.data.data.stockDepotLocations : [];
        const location = targetLocationId
            ? (locations.find((row) => String(row?.id || '').trim() === targetLocationId) || null)
            : null;
        const explicitLocationCode = String(options?.locationCode || '').trim().toUpperCase();
        let derivedLocationCode = '';
        if (location) {
            const raf = String(location?.rafCode || '').trim().toUpperCase();
            const cell = String(location?.cellCode || '').trim().toUpperCase();
            if (raf && cell) derivedLocationCode = `${raf}-${cell}`;
            else if (raf) derivedLocationCode = raf;
            else if (cell) derivedLocationCode = cell;
        }
        const locationCode = explicitLocationCode || derivedLocationCode;
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
            unit: String(options?.unit || 'ADET').trim() || 'ADET',
            stockClass: String(options?.stockClass || 'KULLANILABILIR'),
            status: String(options?.status || options?.stockClass || 'KULLANILABILIR'),
            depotId: targetDepotId,
            locationId: targetLocationId,
            locationCode: locationCode || undefined,
            note: String(options?.note || ''),
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

    isSemiFinishedComponentVariant: (code, refId = '') => {
        const card = PlanningModule.findComponentCardByCodeOrId(code, refId);
        if (!card) return false;
        const variantType = String(card?.variantType || '').trim().toUpperCase();
        const rootComponentId = String(card?.rootComponentId || '').trim();
        const rootComponentCode = String(card?.rootComponentCode || '').trim();
        return variantType === 'SEMI_FINISHED' && !!(rootComponentId || rootComponentCode);
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
    getPoolRowConsumedQty: (row) => {
        if (!row?.useEnabled) return 0;
        return PlanningModule.parseQty(row?.useStockQty, 0) + PlanningModule.parseQty(row?.useSemiQty, 0);
    },
    getPoolRowRemainingRequiredQty: (row) => {
        const requiredQty = PlanningModule.parseQty(row?.requiredQty, 0);
        const consumedQty = PlanningModule.getPoolRowConsumedQty(row);
        return Math.max(0, requiredQty - consumedQty);
    },
    getPoolRowEffectiveNetQty: (row) => {
        const remainingRequiredQty = PlanningModule.getPoolRowRemainingRequiredQty(row);
        const enteredNetQty = PlanningModule.parseQty(row?.netQty, remainingRequiredQty);
        return Math.max(remainingRequiredQty, enteredNetQty);
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

            const variantId = PlanningModule.resolveDemandModelVariantId(item, demand);
            const variant = PlanningModule.findVariantById(variantId);
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
        const readonlyRows = PlanningModule.getSalesReadonlyRows(key);
        if (Array.isArray(readonlyRows)) {
            const syncedReadonlyRows = PlanningModule.syncPlanningPoolRowsWithAvailability(readonlyRows);
            if (!PlanningModule.state.salesReadonlyRowsByDemand || typeof PlanningModule.state.salesReadonlyRowsByDemand !== 'object') {
                PlanningModule.state.salesReadonlyRowsByDemand = {};
            }
            PlanningModule.state.salesReadonlyRowsByDemand[key] = syncedReadonlyRows;
            return syncedReadonlyRows;
        }
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
        const savedDraftRows = PlanningModule.getDemandPlannedPoolDraftRows(demand);
        if (savedDraftRows.length) {
            const syncedDraftRows = PlanningModule.syncPlanningPoolRowsWithAvailability(savedDraftRows);
            PlanningModule.state.planningPoolRowsByDemand[key] = syncedDraftRows;
            PlanningModule.state.planningPoolBuildTokenByDemand[key] = nextBuildToken;
            return syncedDraftRows;
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

    getDemandPlannedPoolDraftRows: (demand) => {
        if (!demand) return [];
        if (String(demand?.status || 'OPEN').toUpperCase() !== 'OPEN') return [];
        const poolAnalysis = demand?.poolAnalysis && typeof demand.poolAnalysis === 'object'
            ? demand.poolAnalysis
            : null;
        if (!poolAnalysis || poolAnalysis.draft !== true) return [];
        const plannedAt = String(poolAnalysis?.planned_at || '').trim();
        if (!plannedAt) return [];
        const rows = Array.isArray(poolAnalysis?.rows) ? poolAnalysis.rows : [];
        if (!rows.length) return [];
        return rows
            .map((row) => PlanningModule.normalizePoolRow(row))
            .filter((row) => String(row?.key || '').trim());
    },

    isDemandPlanDraftSaved: (demand) => {
        return PlanningModule.getDemandPlannedPoolDraftRows(demand).length > 0;
    },

    getPlanningPoolOpenGroupRowsByKey: (groupKey) => {
        const key = String(groupKey || '').trim();
        if (!key) return [];
        const groups = PlanningModule.getPlanningPoolDemandGroups(PlanningModule.getPlanningPoolOpenRows());
        const group = groups.find((row) => String(row?.key || '').trim() === key);
        return Array.isArray(group?.rows) ? group.rows : [];
    },

    getPlanningPoolOpenGroupReleaseState: (groupRows) => {
        const rows = Array.isArray(groupRows) ? groupRows : [];
        const openRows = rows.filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'OPEN');
        const allDraftSaved = openRows.length > 0 && openRows.every((row) => {
            if (!PlanningModule.isDemandPlanDraftSaved(row)) return false;
            const draftRows = PlanningModule.getDemandPlannedPoolDraftRows(row);
            return draftRows.length > 0;
        });
        return { openRows, allDraftSaved };
    },

    validatePlanningPoolOpenGroupBeforeRelease: (groupRows) => {
        const state = PlanningModule.getPlanningPoolOpenGroupReleaseState(groupRows);
        if (!state.openRows.length) {
            return { ok: false, message: 'Is emrine donecek acik talep bulunamadi.' };
        }
        for (const demand of state.openRows) {
            const demandCode = String(demand?.demandCode || '-').trim() || '-';
            const status = String(demand?.status || 'OPEN').toUpperCase();
            if (status !== 'OPEN') {
                return { ok: false, message: `${demandCode} acik durumda degil.` };
            }
            const draftRows = PlanningModule.getDemandPlannedPoolDraftRows(demand);
            if (!draftRows.length) {
                return { ok: false, message: `${demandCode} icin plan kaydi bulunamadi.` };
            }
        }
        return { ok: true, state };
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

    renderPlanningPoolDemandPlannerInline: (demand) => {
        const demandId = String(demand?.id || '').trim();
        if (!demandId) return '';
        const demandSourceType = String(demand?.sourceType || '').trim().toUpperCase();
        const isSalesOrderDemand = demandSourceType === 'SALES_ORDER';
        const poolRows = PlanningModule.getPlanningPoolRows(demandId);
        const summary = PlanningModule.getPlanningPoolSummary(poolRows);
        const canSavePlan = poolRows.length > 0;
        const rowsHtml = (Array.isArray(poolRows) ? poolRows : []).map((poolRow) => {
            const key = PlanningModule.escapeJsString(poolRow?.key || '');
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
                        <div style="font-size:0.74rem; color:#1d4ed8; font-family:monospace;">${PlanningModule.renderLiveCodeButton(code)}</div>
                        ${missingHint}
                    </td>
                    <td style="padding:0.5rem; text-align:center; font-weight:700;">${PlanningModule.escapeHtml(String(poolRow?.requiredQty || 0))}</td>
                    <td style="padding:0.5rem; text-align:center; font-weight:700; color:#0f766e;">${PlanningModule.escapeHtml(String(poolRow?.stockAvailableQty || 0))}</td>
                    <td style="padding:0.5rem; text-align:center; font-weight:700; color:#0f766e;">${PlanningModule.escapeHtml(String(poolRow?.semiAvailableQty || 0))}</td>
                    <td style="padding:0.5rem; text-align:center;"><input type="number" min="0" ${disabledInput} value="${PlanningModule.escapeHtml(String(poolRow?.useStockQty || 0))}" onchange="PlanningModule.setPlanningPoolRowQty('${PlanningModule.escapeJsString(demandId)}','${key}','useStockQty', this.value)" style="width:96px; height:32px; border:1px solid #67e8f9; border-radius:0.45rem; background:#ecfeff; text-align:center; font-weight:700; ${poolRow.useEnabled ? '' : 'opacity:0.5; cursor:not-allowed;'}"></td>
                    <td style="padding:0.5rem; text-align:center;"><input type="number" min="0" ${disabledInput} value="${PlanningModule.escapeHtml(String(poolRow?.useSemiQty || 0))}" onchange="PlanningModule.setPlanningPoolRowQty('${PlanningModule.escapeJsString(demandId)}','${key}','useSemiQty', this.value)" style="width:112px; height:32px; border:1px solid #67e8f9; border-radius:0.45rem; background:#ecfeff; text-align:center; font-weight:700; ${poolRow.useEnabled ? '' : 'opacity:0.5; cursor:not-allowed;'}"></td>
                    <td style="padding:0.5rem; text-align:center;"><input type="checkbox" ${poolRow.useEnabled && !isMissing ? 'checked' : ''} ${isMissing ? 'disabled' : ''} onchange="PlanningModule.setPlanningPoolRowUseEnabled('${PlanningModule.escapeJsString(demandId)}','${key}', this.checked)"></td>
                    <td style="padding:0.5rem; text-align:center;"><input type="number" min="${PlanningModule.escapeHtml(String(poolRow?.minNetQty || 0))}" value="${PlanningModule.escapeHtml(String(poolRow?.netQty || 0))}" ${isMissing ? 'disabled' : ''} onchange="PlanningModule.setPlanningPoolRowQty('${PlanningModule.escapeJsString(demandId)}','${key}','netQty', this.value)" style="width:112px; height:32px; border-radius:0.45rem; text-align:center; font-weight:800; ${netStyle} ${isMissing ? 'opacity:0.65; cursor:not-allowed;' : ''}"></td>
                    <td style="padding:0.5rem; text-align:center;"><input type="checkbox" ${poolRow.approved ? 'checked' : ''} ${isMissing ? 'disabled' : ''} onchange="PlanningModule.setPlanningPoolRowApproved('${PlanningModule.escapeJsString(demandId)}','${key}', this.checked)"></td>
                </tr>
            `;
        }).join('');
        return `
            <div style="margin-top:0.6rem; border:1px solid #bfdbfe; border-radius:0.95rem; background:#ffffff; padding:0.85rem;">
                <div style="font-weight:800; color:#1e3a8a;">Urun Agaci / Patlatma Detayi - ${PlanningModule.escapeHtml(demand?.demandCode || '-')}</div>
                <div style="font-size:0.76rem; color:#64748b; margin-top:0.2rem;">Kullan secili ise stok/yari mamul dusulur, kalan net uretime gider. Eksik uretim girilemez.</div>
                <div class="card-table" style="margin-top:0.55rem;">
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
                        <tbody>${rowsHtml || '<tr><td colspan="9" style="padding:0.75rem; color:#94a3b8; text-align:center;">Bu talep icin patlatma listesi bulunamadi.</td></tr>'}</tbody>
                    </table>
                </div>
                <div style="margin-top:0.55rem; border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem 0.7rem; background:#f8fafc;">
                    <div style="font-size:0.8rem; color:#334155; font-weight:700;">Ozet: Toplam gereken ${summary.requiredQty} | Stok+Yari mamul karsilanan ${summary.consumedQty} | Uretilecek net ${summary.netQty}</div>
                    <div style="font-size:0.74rem; color:#64748b; margin-top:0.2rem;">Uretilecek net gerekenin altina dusmez. Gerekenin ustu icin donusumde onay istenir.</div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.45rem; margin-top:0.65rem;">
                    ${!isSalesOrderDemand ? '' : `<button class="btn-sm" onclick="PlanningModule.setPlanningPoolDemandAllProduceNoStock('${PlanningModule.escapeJsString(demandId)}')">tumunu uret / stok kullanma</button>`}
                    <button class="btn-sm" onclick="PlanningModule.togglePlanningPoolExpand('${PlanningModule.escapeJsString(demandId)}')">vazgec</button>
                    <button class="btn-primary" onclick="PlanningModule.savePlanningPoolDraft('${PlanningModule.escapeJsString(demandId)}')" ${canSavePlan ? '' : 'disabled'} style="${canSavePlan ? '' : 'opacity:0.45; cursor:not-allowed;'}">planlamayi kaydet</button>
                </div>
            </div>
        `;
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

    setPlanningPoolDemandAllProduceNoStock: (demandId) => {
        const key = String(demandId || '').trim();
        if (!key) return;
        const demand = PlanningModule.getDemands().find((row) => String(row?.id || '') === key);
        if (!demand) return;
        const demandSourceType = String(demand?.sourceType || '').trim().toUpperCase();
        if (demandSourceType !== 'SALES_ORDER') return;
        const rows = PlanningModule.getPlanningPoolRows(key);
        if (!Array.isArray(rows) || rows.length === 0) {
            UI.renderCurrentPage();
            return;
        }
        rows.forEach((row) => {
            row.useEnabled = false;
            row.useStockQty = 0;
            row.useSemiQty = 0;
            row.netQty = PlanningModule.parseQty(row?.requiredQty, 0);
            const normalized = PlanningModule.normalizePoolRow(row);
            Object.assign(row, normalized);
        });
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

    savePlanningPoolDraft: async (demandId) => {
        const key = String(demandId || '').trim();
        if (!key) return;
        const demand = PlanningModule.getDemands().find((row) => String(row?.id || '') === key);
        if (!demand) {
            alert('Talep kaydi bulunamadi.');
            return;
        }
        if (String(demand?.status || 'OPEN').toUpperCase() !== 'OPEN') {
            alert('Sadece acik planlama havuzu talepleri kaydedilebilir.');
            return;
        }
        const rows = PlanningModule.getPlanningPoolRows(key).map((row) => PlanningModule.normalizePoolRow(row));
        if (!rows.length) {
            alert('Kaydedilecek plan satiri bulunamadi.');
            return;
        }
        const now = new Date().toISOString();
        demand.poolAnalysis = {
            rows: rows.map((row) => ({
                key: String(row?.key || ''),
                itemKey: String(row?.itemKey || ''),
                itemName: String(row?.itemName || ''),
                itemCode: String(row?.itemCode || ''),
                itemQty: PlanningModule.parseQty(row?.itemQty, 0),
                itemType: PlanningModule.normalizeDraftItemKind(row?.itemType || 'MODEL'),
                code: String(row?.code || ''),
                name: String(row?.name || ''),
                sourceType: String(row?.sourceType || ''),
                componentLibrary: String(row?.componentLibrary || 'PART'),
                componentId: String(row?.componentId || ''),
                missingRef: !!row?.missingRef,
                missingReason: String(row?.missingReason || ''),
                missingRefCode: String(row?.missingRefCode || ''),
                missingRefId: String(row?.missingRefId || ''),
                requiredQty: PlanningModule.parseQty(row?.requiredQty, 0),
                stockAvailableQty: PlanningModule.parseQty(row?.stockAvailableQty, 0),
                semiAvailableQty: PlanningModule.parseQty(row?.semiAvailableQty, 0),
                useEnabled: !!row?.useEnabled,
                approved: !!row?.approved,
                useStockQty: PlanningModule.parseQty(row?.useStockQty, 0),
                useSemiQty: PlanningModule.parseQty(row?.useSemiQty, 0),
                netQty: PlanningModule.getPoolRowEffectiveNetQty(row)
            })),
            planned_at: now,
            draft: true
        };
        demand.updated_at = now;
        if (!PlanningModule.state.planningPoolRowsByDemand || typeof PlanningModule.state.planningPoolRowsByDemand !== 'object') {
            PlanningModule.state.planningPoolRowsByDemand = {};
        }
        PlanningModule.state.planningPoolRowsByDemand[key] = rows.map((row) => ({ ...row }));
        if (!PlanningModule.state.planningPoolBuildTokenByDemand || typeof PlanningModule.state.planningPoolBuildTokenByDemand !== 'object') {
            PlanningModule.state.planningPoolBuildTokenByDemand = {};
        }
        PlanningModule.state.planningPoolBuildTokenByDemand[key] = PlanningModule.getPlanningPoolBuildToken(demand);
        await DB.save();
        UI.renderCurrentPage();
        alert('Planlama kaydedildi.');
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
    isDemandModelOnly: (demand) => {
        const items = PlanningModule.getDemandItems(demand);
        if (!items.length) return false;
        return items.every((item) => PlanningModule.normalizeDraftItemKind(item?.itemType || 'MODEL') === 'MODEL');
    },
    isMontageOnlyNet0Demand: (demand) => {
        return String(demand?.releaseMode || '').trim().toUpperCase() === 'MONTAGE_ONLY_NET0' || !!demand?.montageOnly;
    },
    getApprovedPoolRowsMetrics: (rows) => {
        const list = Array.isArray(rows) ? rows.map((row) => PlanningModule.normalizePoolRow(row)) : [];
        const approvedRows = list.filter((row) => !!row?.approved);
        const approvedNetQty = approvedRows.reduce((sum, row) => sum + PlanningModule.getPoolRowEffectiveNetQty(row), 0);
        const approvedConsumedQty = approvedRows.reduce((sum, row) => sum + PlanningModule.getPoolRowConsumedQty(row), 0);
        return { approvedRows, approvedNetQty, approvedConsumedQty };
    },
    getPoolRowMatchKeys: (row) => {
        const normalized = PlanningModule.normalizePoolRow(row || {});
        const itemKey = String(normalized?.itemKey || '').trim();
        if (!itemKey) return [];
        const libRaw = String(normalized?.componentLibrary || normalized?.sourceType || 'PART').trim().toUpperCase();
        const componentLibrary = libRaw === 'SEMI' ? 'SEMI' : 'PART';
        const base = `${itemKey}::${componentLibrary}:`;
        const componentId = String(normalized?.componentId || '').trim();
        const code = String(normalized?.code || normalized?.componentCode || '').trim().toUpperCase();
        const keys = [];
        if (componentId) keys.push(`${base}${componentId}`);
        if (code) keys.push(`${base}${code}`);
        return Array.from(new Set(keys));
    },
    getOrderLineMatchKeys: (order, line = null) => {
        const sourceItemKey = String(order?.sourceItemKey || '').trim();
        if (!sourceItemKey) return [];
        const sourceType = String(order?.sourceType || '').trim().toUpperCase();
        const componentLibrary = sourceType.includes('SEMI') ? 'SEMI' : 'PART';
        const code = String(line?.componentCode || order?.productCode || '').trim().toUpperCase();
        if (!code) return [];
        const base = `${sourceItemKey}::${componentLibrary}:`;
        const keys = [`${base}${code}`];
        const card = componentLibrary === 'SEMI'
            ? PlanningModule.findSemiCardByCodeOrId(code, '')
            : PlanningModule.findComponentCardByCodeOrId(code, '');
        const cardId = String(card?.id || '').trim();
        if (cardId) keys.push(`${base}${cardId}`);
        return Array.from(new Set(keys));
    },
    getConvertedPoolRowKeySetForDemand: (demand) => {
        const keySet = new Set();
        const poolRows = Array.isArray(demand?.poolAnalysis?.rows) ? demand.poolAnalysis.rows : [];
        poolRows.forEach((row) => {
            PlanningModule.getPoolRowMatchKeys(row).forEach((key) => keySet.add(key));
        });
        const linkedOrders = PlanningModule.getLinkedWorkOrdersForDemand(demand);
        linkedOrders.forEach((order) => {
            const lines = Array.isArray(order?.lines) && order.lines.length ? order.lines : [null];
            lines.forEach((line) => {
                PlanningModule.getOrderLineMatchKeys(order, line).forEach((key) => keySet.add(key));
            });
        });
        return keySet;
    },
    getRemainingPoolRowsForDemand: (demand) => {
        const rebuiltRows = PlanningModule.buildPlanningPoolRowsForDemand(demand).map((row) => PlanningModule.normalizePoolRow(row));
        if (!rebuiltRows.length) return [];
        const convertedSet = PlanningModule.getConvertedPoolRowKeySetForDemand(demand);
        if (!convertedSet.size) return rebuiltRows;
        return rebuiltRows.filter((row) => {
            const keys = PlanningModule.getPoolRowMatchKeys(row);
            if (!keys.length) return true;
            return !keys.some((key) => convertedSet.has(key));
        });
    },
    canReplanRemainingRows: (demand) => {
        if (!demand) return false;
        if (String(demand?.status || 'OPEN').toUpperCase() !== 'RELEASED') return false;
        if (PlanningModule.isMontageOnlyNet0Demand(demand)) return false;
        const linkedOrders = PlanningModule.getLinkedWorkOrdersForDemand(demand);
        if (!linkedOrders.length) return false;
        return PlanningModule.getRemainingPoolRowsForDemand(demand).length > 0;
    },
    reopenDemandRemainingRows: async (demandId) => {
        const demand = PlanningModule.getDemands().find((row) => String(row?.id || '') === String(demandId || ''));
        if (!demand) return;
        if (String(demand?.status || 'OPEN').toUpperCase() !== 'RELEASED') {
            alert('Bu talep zaten planlama havuzunda acik.');
            return;
        }
        if (PlanningModule.isMontageOnlyNet0Demand(demand)) {
            alert('Montaj akisina alinmis net 0 talepler icin bu islem kullanilamaz.');
            return;
        }
        const remainingRows = PlanningModule.getRemainingPoolRowsForDemand(demand)
            .map((row) => ({ ...row, approved: false }));
        if (!remainingRows.length) {
            alert('Planlanacak kalan satir bulunamadi.');
            return;
        }
        demand.status = 'OPEN';
        demand.reopenMode = 'PARTIAL_REPLAN';
        demand.reopened_at = new Date().toISOString();
        demand.updated_at = demand.reopened_at;
        await DB.save();
        PlanningModule.openWorkspace('planning-pool');
        if (!PlanningModule.state.planningPoolRowsByDemand || typeof PlanningModule.state.planningPoolRowsByDemand !== 'object') {
            PlanningModule.state.planningPoolRowsByDemand = {};
        }
        if (!PlanningModule.state.planningPoolBuildTokenByDemand || typeof PlanningModule.state.planningPoolBuildTokenByDemand !== 'object') {
            PlanningModule.state.planningPoolBuildTokenByDemand = {};
        }
        if (!PlanningModule.state.planningPoolExpandedItemByDemand || typeof PlanningModule.state.planningPoolExpandedItemByDemand !== 'object') {
            PlanningModule.state.planningPoolExpandedItemByDemand = {};
        }
        const demandKey = String(demand.id || '');
        PlanningModule.state.planningPoolRowsByDemand[demandKey] = remainingRows;
        delete PlanningModule.state.planningPoolBuildTokenByDemand[demandKey];
        PlanningModule.state.planningPoolExpandedDemandId = demandKey;
        PlanningModule.state.planningPoolExpandedItemByDemand[demandKey] = {};
        UI.renderCurrentPage();
    },
    isDemandEligibleForMontageOnlyFromPool: (demand, rows) => {
        const demandSourceType = String(demand?.sourceType || '').trim().toUpperCase();
        if (demandSourceType !== 'STOCK') return false;
        if (!PlanningModule.isDemandModelOnly(demand)) return false;
        const metrics = PlanningModule.getApprovedPoolRowsMetrics(rows);
        if (!metrics.approvedRows.length) return false;
        return metrics.approvedNetQty === 0 && metrics.approvedConsumedQty > 0;
    },
    markDemandReleasedForMontageOnly: (demand, approvedRows) => {
        const now = new Date().toISOString();
        const rows = Array.isArray(approvedRows) ? approvedRows.map((row) => PlanningModule.normalizePoolRow(row)) : [];
        demand.status = 'RELEASED';
        demand.releaseMode = 'MONTAGE_ONLY_NET0';
        demand.montageOnly = true;
        demand.releasedQty = PlanningModule.parseQty(demand?.qty, 0);
        demand.workOrderId = '';
        demand.workOrderIds = [];
        demand.workOrderCodes = [];
        demand.workOrderCode = '';
        demand.poolAnalysis = {
            rows: rows.map((row) => ({
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
                netQty: PlanningModule.getPoolRowEffectiveNetQty(row)
            })),
            converted_at: now
        };
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
        const partCard = PlanningModule.findComponentCardByCodeOrId(raw, raw);
        if (partCard?.id
            && typeof ProductLibraryModule !== 'undefined'
            && ProductLibraryModule
            && typeof ProductLibraryModule.openComponentCardView === 'function') {
            const returnView = String(PlanningModule.state?.workspaceView || 'menu').trim() || 'menu';
            ProductLibraryModule.state.componentLibraryKind = 'PART';
            ProductLibraryModule.state.workspaceView = 'components';
            if (typeof Router !== 'undefined' && Router && typeof Router.navigate === 'function') {
                Router.navigate('products', { preserveProductsState: true });
            }
            ProductLibraryModule.openComponentCardView(String(partCard.id), {
                page: 'planlama',
                view: returnView
            });
            return;
        }
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
        if (typeof ProductLibraryModule !== 'undefined'
            && ProductLibraryModule
            && typeof ProductLibraryModule.getPlanningModelVariants === 'function') {
            return ProductLibraryModule.getPlanningModelVariants();
        }
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
                    invalidReason: row ? '' : 'COMPONENT_NOT_FOUND',
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
                    invalidReason: row ? '' : 'SEMI_NOT_FOUND',
                    title: String(row?.name || ''),
                    code: String(row?.code || ''),
                    info: String(row?.group || ''),
                    refId: String(item?.semiFinishedId || '')
                };
            }
            const row = PlanningModule.findVariantById(item?.variantId || '');
            const montage = PlanningModule.findMontageCardForVariant(row);
            const modelInvalidReason = !row
                ? 'MODEL_NOT_FOUND'
                : (!montage?.id ? 'MODEL_MONTAGE_MISSING' : '');
            return {
                id: String(item?.id || ''),
                itemType: 'MODEL',
                qty,
                valid: !!row && !!montage?.id,
                invalidReason: modelInvalidReason,
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
        if (PlanningModule.state.workspaceView !== 'group-detail') {
            PlanningModule.state.planningDetailScope = '';
            PlanningModule.state.planningDetailGroupKey = '';
            PlanningModule.state.planningDetailBackView = '';
            PlanningModule.state.releasedDetailInlineTrackingDemandId = '';
        }
        if (PlanningModule.state.workspaceView !== 'sales-demand') {
            PlanningModule.state.salesDemandExpandedGroupKey = '';
        }
        if (PlanningModule.state.workspaceView !== 'stock-production') {
            PlanningModule.state.stockDraftFormOpen = false;
        }
        if (PlanningModule.state.workspaceView !== 'planning-pool') {
            PlanningModule.state.planningPoolExpandedDemandId = '';
            PlanningModule.state.planningPoolExpandedItemByDemand = {};
            PlanningModule.state.planningPoolExpandedGroupKey = '';
            PlanningModule.state.planningPoolReleasedExpandedGroupKey = '';
            PlanningModule.state.planningPoolArchiveMode = false;
        }
        if (PlanningModule.state.workspaceView === 'planning-pool') {
            PlanningModule.state.planningPoolRowsByDemand = {};
            PlanningModule.state.planningPoolBuildTokenByDemand = {};
        }
        if (PlanningModule.state.workspaceView !== 'stock-production') {
            PlanningModule.state.stockArchiveMode = false;
        }
        if (PlanningModule.state.workspaceView !== 'released-orders') {
            PlanningModule.state.releasedExpandedDemandId = '';
            PlanningModule.state.releasedExpandedItemByDemand = {};
            PlanningModule.state.releasedArchiveMode = false;
            PlanningModule.state.releasedExpandedGroupKey = '';
        }
        if (PlanningModule.state.workspaceView === 'stock-production' && !PlanningModule.state.stockDraftDueDate) {
            PlanningModule.resetStockDraft();
        }
        UI.renderCurrentPage();
    },
    setReleasedArchiveMode: (enabled) => {
        PlanningModule.state.releasedArchiveMode = !!enabled;
        PlanningModule.state.releasedCompletionView = enabled ? 'ARCHIVE' : 'ACTIVE';
        PlanningModule.state.releasedExpandedDemandId = '';
        PlanningModule.state.releasedExpandedItemByDemand = {};
        PlanningModule.state.releasedExpandedGroupKey = '';
        UI.renderCurrentPage();
    },
    normalizeReleasedSourceFilter: (value) => {
        const raw = String(value || 'ALL').trim().toUpperCase();
        return ['ALL', 'SALES_ORDER', 'STOCK'].includes(raw) ? raw : 'ALL';
    },
    normalizeReleasedCompletionView: (value) => {
        const raw = String(value || 'ACTIVE').trim().toUpperCase();
        return raw === 'ARCHIVE' ? 'ARCHIVE' : 'ACTIVE';
    },
    setReleasedSourceFilter: (value) => {
        PlanningModule.state.releasedSourceFilter = PlanningModule.normalizeReleasedSourceFilter(value);
        UI.renderCurrentPage();
    },
    setReleasedSearchQuery: (value) => {
        PlanningModule.state.releasedSearchQuery = String(value ?? '');
        UI.renderCurrentPage();
    },
    setReleasedCompletionView: (value) => {
        const next = PlanningModule.normalizeReleasedCompletionView(value);
        PlanningModule.state.releasedCompletionView = next;
        PlanningModule.state.releasedArchiveMode = next === 'ARCHIVE';
        PlanningModule.state.releasedExpandedDemandId = '';
        PlanningModule.state.releasedExpandedItemByDemand = {};
        PlanningModule.state.releasedExpandedGroupKey = '';
        UI.renderCurrentPage();
    },
    getReleasedDemandSourceMeta: (demand) => {
        const sourceType = String(demand?.sourceType || '').trim().toUpperCase();
        if (sourceType === 'SALES_ORDER') {
            return {
                type: 'SALES_ORDER',
                label: 'Satış Siparişi',
                style: 'background:#fff7ed; color:#9a3412; border:1px solid #fdba74;'
            };
        }
        if (sourceType === 'STOCK') {
            return {
                type: 'STOCK',
                label: 'Stok Icin Uretim',
                style: 'background:#ecfdf5; color:#047857; border:1px solid #86efac;'
            };
        }
        const fallbackLabel = String(demand?.sourceLabel || sourceType || 'Diğer').trim();
        return {
            type: sourceType || 'OTHER',
            label: fallbackLabel || 'Diğer',
            style: 'background:#eff6ff; color:#1d4ed8; border:1px solid #93c5fd;'
        };
    },
    getReleasedDemandWorkOrderText: (demand) => {
        if (PlanningModule.isMontageOnlyNet0Demand(demand)) {
            return 'MONTAJ_AKISI_NET0';
        }
        if (Array.isArray(demand?.workOrderCodes) && demand.workOrderCodes.length) {
            return demand.workOrderCodes.length > 1
                ? `${demand.workOrderCodes[0]} +${demand.workOrderCodes.length - 1}`
                : demand.workOrderCodes[0];
        }
        return String(demand?.workOrderCode || '-');
    },
    getReleasedDemandSearchBlob: (demand) => {
        const sourceMeta = PlanningModule.getReleasedDemandSourceMeta(demand);
        const items = PlanningModule.getDemandItems(demand);
        const itemCodes = items
            .map((item) => PlanningModule.getDemandItemCode(item))
            .filter(Boolean)
            .join(' ');
        const itemNames = items
            .map((item) => String(item?.productName || '').trim())
            .filter(Boolean)
            .join(' ');
        const workOrderCodes = Array.isArray(demand?.workOrderCodes) ? demand.workOrderCodes.join(' ') : '';
        const text = [
            String(demand?.demandCode || ''),
            PlanningModule.getReleasedDemandWorkOrderText(demand),
            workOrderCodes,
            PlanningModule.getDemandDisplayName(demand),
            PlanningModule.getDemandDisplayCode(demand),
            String(demand?.productCode || ''),
            itemCodes,
            itemNames,
            String(demand?.sourceLabel || ''),
            String(demand?.sourceType || ''),
            sourceMeta.label,
            sourceMeta.type
        ].join(' ');
        return text.toLocaleLowerCase('tr-TR');
    },
    matchesReleasedDemandSearch: (demand, query) => {
        const normalizedQuery = String(query || '').trim().toLocaleLowerCase('tr-TR');
        if (!normalizedQuery) return true;
        return PlanningModule.getReleasedDemandSearchBlob(demand).includes(normalizedQuery);
    },
    setPlanningPoolArchiveMode: (enabled) => {
        PlanningModule.state.planningPoolArchiveMode = !!enabled;
        PlanningModule.state.planningPoolExpandedDemandId = '';
        PlanningModule.state.planningPoolExpandedItemByDemand = {};
        PlanningModule.state.planningPoolExpandedGroupKey = '';
        PlanningModule.state.planningPoolReleasedExpandedGroupKey = '';
        UI.renderCurrentPage();
    },
    setStockArchiveMode: (enabled) => {
        PlanningModule.state.stockArchiveMode = !!enabled;
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
        const resolvedDraftItems = PlanningModule.getResolvedStockDraftItems();
        const demandItems = draftItems
            .map((item) => PlanningModule.buildDemandItemFromDraftItem(item))
            .filter(Boolean);
        if (demandItems.length !== draftItems.length) {
            const invalidRows = resolvedDraftItems.filter((row) => !row?.valid);
            const firstInvalid = invalidRows[0] || null;
            const label = String(firstInvalid?.title || firstInvalid?.code || '').trim();
            const prettyLabel = label ? ` (${label})` : '';
            const reason = String(firstInvalid?.invalidReason || '');
            if (reason === 'MODEL_MONTAGE_MISSING') {
                return alert(`Secilen urun varyasyonunda montaj karti bagli degil${prettyLabel}. Satilan Urun Kutuphanesi varyasyonunda montaj karti secip kaydediniz.`);
            }
            if (reason === 'MODEL_NOT_FOUND') {
                return alert(`Secilen urun varyasyonu bulunamadi veya silinmis${prettyLabel}. Lutfen listeyi yenileyip urunu tekrar seciniz.`);
            }
            if (reason === 'COMPONENT_NOT_FOUND') {
                return alert(`Secilen parca/bilesen bulunamadi veya silinmis${prettyLabel}. Lutfen listeyi yenileyip urunu tekrar seciniz.`);
            }
            if (reason === 'SEMI_NOT_FOUND') {
                return alert(`Secilen yari mamul bulunamadi veya silinmis${prettyLabel}. Lutfen listeyi yenileyip urunu tekrar seciniz.`);
            }
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
        const demandSourceType = String(demand?.sourceType || '').trim().toUpperCase();
        const sourceId = String(demand.id || '');
        const sourceCode = String(demand.demandCode || '');
        const poolRowsRaw = Array.isArray(options?.poolRows) ? options.poolRows : [];
        const poolRows = poolRowsRaw.map((row) => PlanningModule.normalizePoolRow(row));
        const isFromPoolFlow = !!options?.fromPool;
        if (demandSourceType === 'SALES_ORDER') {
            // DEMO/PROTOTYPE NOTE:
            // SALES_ORDER -> is emri donusumu sadece Planlama Havuzu validasyonlari ile acilir.
            // Canli sistemde rezerv/sarf/stok hareket mutabakati tamamlanmadan kalici kural kabul edilmemelidir.
            if (!isFromPoolFlow || poolRows.length === 0) {
                throw new Error('Satis siparisi kaynakli talep sadece Planlama Havuzu uzerinden is emrine donusturulebilir.');
            }
        }
        const poolRowsForOrders = poolRows.filter((row) => PlanningModule.getPoolRowEffectiveNetQty(row) > 0);
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
                const qty = PlanningModule.getPoolRowEffectiveNetQty(row);
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
                const approvedNetQty = poolRowsForOrders.reduce((sum, row) => sum + PlanningModule.getPoolRowEffectiveNetQty(row), 0);
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
                    netQty: PlanningModule.getPoolRowEffectiveNetQty(row)
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
        const demandSourceType = String(demand?.sourceType || '').trim().toUpperCase();
        if (demandSourceType === 'SALES_ORDER') {
            alert('Satis siparisi kaynakli talepler demo fazinda sadece Planlama Havuzu uzerinden is emrine donusturulebilir.');
            return;
        }
        try {
            PlanningModule.releaseDemandInternal(demand);
        } catch (error) {
            alert(error?.message || 'Is emrine cevrilemedi.');
            return;
        }
        await DB.save();
        UI.renderCurrentPage();
    },

    releaseDemandFromPool: async (demandId, options = {}) => {
        const opts = options && typeof options === 'object' ? options : {};
        const silent = !!opts.silent;
        const skipRender = !!opts.skipRender;
        const fail = (message) => {
            if (!silent) alert(message);
            return { ok: false, message: String(message || 'Is emrine cevrilemedi.') };
        };

        const demand = PlanningModule.getDemands().find((row) => String(row?.id || '') === String(demandId || ''));
        if (!demand) return fail('Talep kaydi bulunamadi.');
        if (String(demand?.status || 'OPEN').toUpperCase() !== 'OPEN') {
            return fail('Talep acik durumda degil.');
        }
        const rows = PlanningModule.getPlanningPoolRows(demandId).map((row) => PlanningModule.normalizePoolRow(row));
        if (!rows.length) {
            return fail('Bu talepte patlatma satiri bulunamadi.');
        }
        const { approvedRows } = PlanningModule.getApprovedPoolRowsMetrics(rows);
        if (!approvedRows.length) {
            return fail('Lutfen is emrine donecek satirlari onay kutusundan seciniz.');
        }
        if (approvedRows.length < rows.length) {
            const totalCount = rows.length;
            const approvedCount = approvedRows.length;
            const message = `Bu talepte ${totalCount} kalem var, sadece ${approvedCount} kalem onayli. Sadece onayli kalemler is emrine donecek. Devam etmek istiyor musunuz?`;
            if (!confirm(message)) return fail('Kullanici islemi iptal etti.');
        }
        const missingRows = approvedRows.filter((row) => !!row?.missingRef || !String(row?.componentId || '').trim());
        if (missingRows.length > 0) {
            const preview = missingRows.slice(0, 4).map((row) => String(row?.missingRefCode || row?.code || '-')).join(', ');
            const suffix = missingRows.length > 4 ? ' ...' : '';
            return fail(`Karti bulunamayan kalemler var: ${preview}${suffix}. Once urun kutuphanesinden duzeltiniz.`);
        }
        const invalidLow = approvedRows.find((row) => PlanningModule.parseQty(row?.netQty, 0) < PlanningModule.parseQty(row?.minNetQty, 0));
        if (invalidLow) {
            return fail(`Eksik uretim girilemez: ${invalidLow.name || invalidLow.code}`);
        }
        const overRows = approvedRows.filter((row) => PlanningModule.parseQty(row?.netQty, 0) > PlanningModule.parseQty(row?.requiredQty, 0));
        if (overRows.length > 0) {
            const preview = overRows.slice(0, 4).map((row) => `${row.code || '-'} (${row.netQty}/${row.requiredQty})`).join(', ');
            const msg = `Bazi satirlarda fazla uretim var: ${preview}${overRows.length > 4 ? ' ...' : ''}. Onayliyor musunuz?`;
            if (!confirm(msg)) return fail('Kullanici islemi iptal etti.');
        }
        const nonZeroRows = approvedRows.filter((row) => PlanningModule.getPoolRowEffectiveNetQty(row) > 0);
        if (!nonZeroRows.length) {
            return fail('Secili satirlarda uretilecek net 0 oldugu icin is emri olusturulamadi.');
        }
        try {
            PlanningModule.releaseDemandInternal(demand, { poolRows: approvedRows, fromPool: true });
            await DB.save();
        } catch (error) {
            return fail(error?.message || 'Is emrine cevrilemedi.');
        }
        if (!skipRender) UI.renderCurrentPage();
        return {
            ok: true,
            demandId: String(demand?.id || '').trim(),
            demandCode: String(demand?.demandCode || '-').trim() || '-'
        };
    },

    releasePlanningPoolOpenGroupFromDetail: async () => {
        const scope = String(PlanningModule.state.planningDetailScope || '').trim();
        const groupKey = String(PlanningModule.state.planningDetailGroupKey || '').trim();
        if (scope !== 'planning-pool-open' || !groupKey) {
            alert('Toplu donusum sadece Planlama Havuzu detay ekraninda kullanilir.');
            return;
        }
        const groupRows = PlanningModule.getPlanningPoolOpenGroupRowsByKey(groupKey);
        const precheck = PlanningModule.validatePlanningPoolOpenGroupBeforeRelease(groupRows);
        if (!precheck.ok) {
            alert(precheck.message || 'Toplu donusum on kontrolleri gecemedi.');
            return;
        }
        const openRows = Array.isArray(precheck?.state?.openRows) ? precheck.state.openRows : [];
        if (!openRows.length) {
            alert('Is emrine donecek acik satir bulunamadi.');
            return;
        }
        // DEMO/PROTOTYPE BLOK DONUSUMU:
        // Satirlar sirayla is emrine cevrilir. Canli ERP'de transaction/rollback veya
        // iptal-arsiv yaklasimi olmadan hard fail senaryolari icin ek guvence gereklidir.
        for (const demand of openRows) {
            const demandId = String(demand?.id || '').trim();
            const demandCode = String(demand?.demandCode || '-').trim() || '-';
            if (!demandId) {
                alert(`${demandCode} satirinda talep kimligi bulunamadi. Islem durduruldu.`);
                UI.renderCurrentPage();
                return;
            }
            const result = await PlanningModule.releaseDemandFromPool(demandId, {
                silent: true,
                skipRender: true
            });
            if (!result?.ok) {
                const reason = String(result?.message || 'Bilinmeyen hata');
                alert(`${demandCode} satirinda islem durdu: ${reason}`);
                UI.renderCurrentPage();
                return;
            }
        }
        UI.renderCurrentPage();
    },
    releaseDemandToMontageFromPool: async (demandId) => {
        const demand = PlanningModule.getDemands().find((row) => String(row?.id || '') === String(demandId || ''));
        if (!demand) return;
        if (String(demand?.status || 'OPEN').toUpperCase() !== 'OPEN') return;
        const demandSourceType = String(demand?.sourceType || '').trim().toUpperCase();
        if (demandSourceType === 'SALES_ORDER') {
            alert('Satis siparisi kaynakli talepler icin is emrine donusum gecici olarak kilitlidir. Stok hareketi ve uretim sarf kurali tamamlanmadan acilmayacaktir.');
            return;
        }
        if (demandSourceType !== 'STOCK') {
            alert('Montaj akisina alma sadece stok kaynakli taleplerde kullanilir.');
            return;
        }
        if (!PlanningModule.isDemandModelOnly(demand)) {
            alert('Montaj akisina alma sadece satilan urun varyasyonu (MODEL) taleplerinde kullanilir.');
            return;
        }
        const rows = PlanningModule.getPlanningPoolRows(demandId).map((row) => PlanningModule.normalizePoolRow(row));
        if (!rows.length) {
            alert('Bu talepte patlatma satiri bulunamadi.');
            return;
        }
        const { approvedRows, approvedNetQty, approvedConsumedQty } = PlanningModule.getApprovedPoolRowsMetrics(rows);
        if (!approvedRows.length) {
            alert('Lutfen montaj akisina alinacak satirlari onay kutusundan seciniz.');
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
        if (!(approvedNetQty === 0 && approvedConsumedQty > 0)) {
            alert('Bu islem icin kosullar saglanmadi. Net 0 ve karsilanan miktar 0 dan buyuk olmali.');
            return;
        }
        try {
            PlanningModule.markDemandReleasedForMontageOnly(demand, approvedRows);
            await DB.save();
        } catch (error) {
            alert(error?.message || 'Talep montaj akisina alinamadi.');
            return;
        }
        UI.renderCurrentPage();
    },

    deleteDemand: async (demandId) => {
        const all = PlanningModule.getDemands();
        const row = all.find((item) => String(item?.id || '') === String(demandId || ''));
        if (!row) return;
        // DEMO/PROTOTYPE TEMIZLIGI:
        // Bu silme akisi test verisini hizli temiz tutmak icindir. Canli ERP'de
        // gecmis uretim/stok izleri icin hard delete yerine iptal/pasif kapanis tercih edilmelidir.
        const linkedIds = PlanningModule.getDemandLinkedWorkOrderIds(row);
        const isReleased = String(row?.status || 'OPEN').toUpperCase() === 'RELEASED';
        const isMontageOnlyReleased = PlanningModule.isMontageOnlyNet0Demand(row);
        const confirmText = linkedIds.size > 0 || isReleased
            ? 'Bu talep tam silinecek. Bagli is emirleri, islem hareketleri ve depoya alinan stok kayitlari da silinecek. Devam edilsin mi?'
            : 'Silmek istediginizden emin misiniz?';
        if (!confirm(confirmText)) return;
        if (isReleased && !isMontageOnlyReleased) PlanningModule.rollbackDemandPoolConsumption(row);
        if (linkedIds.size > 0) PlanningModule.purgeDepotOutputsByWorkOrderIds(linkedIds);
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
        const demandCodeKey = demandCode.toUpperCase();
        const directIds = Array.isArray(demand?.workOrderIds) ? demand.workOrderIds : [];
        directIds.forEach((id) => {
            const key = String(id || '').trim();
            if (key) linked.add(key);
        });
        const single = String(demand?.workOrderId || '').trim();
        if (single) linked.add(single);
        const directCodes = new Set();
        const directCodeList = Array.isArray(demand?.workOrderCodes) ? demand.workOrderCodes : [];
        directCodeList.forEach((code) => {
            const key = String(code || '').trim().toUpperCase();
            if (key) directCodes.add(key);
        });
        const singleCode = String(demand?.workOrderCode || '').trim().toUpperCase();
        if (singleCode) directCodes.add(singleCode);
        const orders = Array.isArray(DB.data?.data?.workOrders) ? DB.data.data.workOrders : [];
        orders.forEach((order) => {
            const orderId = String(order?.id || '').trim();
            if (!orderId) return;
            const sourceId = String(order?.sourceId || '').trim();
            const sourceCode = String(order?.sourceCode || '').trim().toUpperCase();
            const orderCode = String(order?.workOrderCode || '').trim().toUpperCase();
            if ((demandId && sourceId === demandId)
                || (demandCodeKey && sourceCode === demandCodeKey)
                || (orderCode && directCodes.has(orderCode))) {
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
    purgeDepotOutputsByWorkOrderIds: (linkedIds) => {
        if (!(linkedIds instanceof Set) || linkedIds.size === 0) return;
        const txns = Array.isArray(DB.data?.data?.workOrderTransactions) ? DB.data.data.workOrderTransactions : [];
        const stockRows = Array.isArray(DB.data?.data?.stockDepotItems) ? DB.data.data.stockDepotItems : [];
        const orders = Array.isArray(DB.data?.data?.workOrders) ? DB.data.data.workOrders : [];
        if (!txns.length || !stockRows.length || !orders.length) return;

        const orderById = new Map();
        orders.forEach((order) => {
            const key = String(order?.id || '').trim();
            if (key) orderById.set(key, order);
        });

        const removalMap = new Map();
        txns.forEach((txn) => {
            if (String(txn?.type || '').trim().toUpperCase() !== 'STORE') return;
            const workOrderId = String(txn?.workOrderId || '').trim();
            if (!workOrderId || !linkedIds.has(workOrderId)) return;
            const order = orderById.get(workOrderId);
            if (!order) return;
            const lineId = String(txn?.lineId || '').trim();
            const line = (Array.isArray(order?.lines) ? order.lines : []).find((row) => String(row?.id || '').trim() === lineId) || null;
            const code = String(line?.componentCode || order?.productCode || '').trim().toUpperCase();
            const stationId = String(txn?.stationId || '').trim();
            const qty = PlanningModule.parseQty(txn?.qty, 0);
            if (!code || !stationId || qty <= 0) return;
            const key = `${stationId}|${code}`;
            removalMap.set(key, (removalMap.get(key) || 0) + qty);
        });
        if (!removalMap.size) return;

        const touchedRowIds = new Set();
        removalMap.forEach((removeQty, key) => {
            let remaining = PlanningModule.parseQty(removeQty, 0);
            if (remaining <= 0) return;
            const [stationIdRaw, codeRaw] = String(key || '').split('|');
            const stationId = String(stationIdRaw || '').trim();
            const code = String(codeRaw || '').trim().toUpperCase();
            const candidates = stockRows
                .filter((row) => {
                    const rowCode = PlanningModule.getDepotRowCode(row);
                    if (rowCode !== code) return false;
                    const rowStation = String(row?.unitId || row?.stationId || '').trim();
                    const rowNodeKey = String(row?.nodeKey || row?.depotKey || row?.key || '').trim();
                    const stationMatch = rowStation === stationId || rowNodeKey === `unit:${stationId}`;
                    if (!stationMatch) return false;
                    return PlanningModule.getDepotRowQty(row) > 0;
                })
                .sort((a, b) => String(a?.created_at || '').localeCompare(String(b?.created_at || '')));
            candidates.forEach((row) => {
                if (remaining <= 0) return;
                const available = PlanningModule.getDepotRowQty(row);
                if (available <= 0) return;
                const used = Math.min(available, remaining);
                PlanningModule.setDepotRowQty(row, available - used);
                touchedRowIds.add(String(row?.id || ''));
                remaining -= used;
            });
        });

        if (touchedRowIds.size > 0) {
            DB.data.data.stockDepotItems = stockRows.filter((row) => {
                const rowId = String(row?.id || '');
                if (!touchedRowIds.has(rowId)) return true;
                return PlanningModule.getDepotRowQty(row) > 0;
            });
        }
    },

    deleteReleasedDemand: async (demandId) => {
        return PlanningModule.deleteDemand(demandId);
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
            return `<div style="border:1px dashed #cbd5e1; border-radius:0.75rem; padding:1rem; text-align:center; color:#94a3b8; background:#f8fafc;">${PlanningModule.escapeHtml(emptyMessage || 'Kayit yok.')}</div>`;
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
                <div style="border:1px solid #dbe4ee; border-radius:0.85rem; background:#f8fafc; box-shadow:0 1px 2px rgba(15,23,42,0.06); padding:0.75rem; margin-bottom:0.65rem;">
                    <div style="display:grid; grid-template-columns:repeat(8,minmax(0,1fr)); gap:0.6rem; align-items:center;">
                        <div style="min-width:0;">
                            <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Talep</div>
                            <div style="margin-top:0.2rem; font-family:monospace; font-weight:700; color:#1d4ed8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${PlanningModule.escapeHtml(row?.demandCode || '-')}</div>
                        </div>
                        <div style="min-width:0;">
                            <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Urun</div>
                            <div style="margin-top:0.2rem; font-weight:700; color:#334155;">${PlanningModule.escapeHtml(displayName)}</div>
                            <div style="font-size:0.75rem; color:#64748b;">${PlanningModule.escapeHtml(PlanningModule.getItemTypeLabel(row?.itemType || 'MODEL'))}</div>
                        </div>
                        <div style="min-width:0;">
                            <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Kod</div>
                            <div style="margin-top:0.2rem; font-family:monospace; color:#334155;">${PlanningModule.escapeHtml(displayCode)}</div>
                        </div>
                        <div style="min-width:0;">
                            <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Adet</div>
                            <div style="margin-top:0.2rem; text-align:center; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(displayQty))}</div>
                        </div>
                        <div style="min-width:0;">
                            <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Termin / Oncelik</div>
                            <div style="margin-top:0.2rem; color:#334155;">${PlanningModule.escapeHtml(row?.dueDate || '-')}</div>
                            <div style="margin-top:0.25rem;">${PlanningModule.renderPriorityBadge(row?.priority || 'NORMAL')}</div>
                        </div>
                        <div style="min-width:0;">
                            <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Durum</div>
                            <div style="margin-top:0.2rem;"><span style="display:inline-block; border-radius:999px; padding:0.14rem 0.5rem; font-size:0.72rem; font-weight:700; ${PlanningModule.getStatusStyle(row?.status || 'OPEN')}">${PlanningModule.escapeHtml(PlanningModule.getStatusLabel(row?.status || 'OPEN'))}</span></div>
                        </div>
                        <div style="min-width:0;">
                            <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Is emri</div>
                            <div style="margin-top:0.2rem; font-family:monospace; color:#334155;">${PlanningModule.escapeHtml(row?.workOrderCode || '-')}</div>
                        </div>
                        <div style="min-width:0; display:flex; justify-content:flex-end; align-items:flex-end;">
                            <div style="display:inline-flex; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end;">
                                <button class="btn-sm" onclick="PlanningModule.openDemandView('${PlanningModule.escapeJsString(row?.id || '')}')">goruntule</button>
                                <button class="btn-sm" onclick="PlanningModule.startDemandEdit('${PlanningModule.escapeJsString(row?.id || '')}')" ${released ? 'disabled' : ''} style="${released ? 'opacity:0.45; cursor:not-allowed;' : ''}">duzenle</button>
                                <button class="btn-sm" onclick="${released ? `PlanningModule.deleteReleasedDemand('${PlanningModule.escapeJsString(row?.id || '')}')` : `PlanningModule.deleteDemand('${PlanningModule.escapeJsString(row?.id || '')}')`}">sil</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderMenuLayout: () => {
        const all = PlanningModule.getDemands();
        const openCount = all.filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'OPEN').length;
        const releasedCount = all.filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'RELEASED').length;
        const cards = [
            { id: 'sales-demand', icon: 'shopping-bag', label: 'Siparisten Gelen Talepler', tone: 'g-orange', meta: 'Onayli siparis satirlari' },
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
        const sourceKind = sourceKindRaw === 'SEMI'
            ? 'COMPONENT'
            : (['MODEL', 'COMPONENT'].includes(sourceKindRaw) ? sourceKindRaw : 'MODEL');
        const pickerKind = sourceKind === 'COMPONENT' ? 'component' : 'model';
        const sourceLabel = sourceKind === 'COMPONENT' ? 'Parca/bilesen' : 'Satilan urun kutuphanesi';
        const addLabel = sourceKind === 'COMPONENT' ? 'parca bilesen ekle +' : 'satilan urun kutuphanesi ekle +';
        const isFormOpen = !!PlanningModule.state.stockDraftFormOpen;
        const draftItems = PlanningModule.getResolvedStockDraftItems();
        const totalDraftQty = draftItems.reduce((sum, row) => sum + Number(row?.qty || 0), 0);
        const stockRows = PlanningModule.getDemands()
            .filter((row) => String(row?.sourceType || '').toUpperCase() === 'STOCK')
            .slice()
            .sort((a, b) => String(b?.created_at || '').localeCompare(String(a?.created_at || '')));
        const openStockRows = stockRows.filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'OPEN');
        const releasedStockRows = stockRows.filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'RELEASED');
        const releasedStockEntries = releasedStockRows.map((row) => ({
            row,
            statusMeta: PlanningModule.getReleasedDemandStatusMeta(PlanningModule.getReleasedDemandItemGroups(row), row)
        }));
        const activeReleasedStockRows = releasedStockEntries.filter((entry) => !entry?.statusMeta?.archived).map((entry) => entry.row);
        const archiveReleasedStockRows = releasedStockEntries.filter((entry) => !!entry?.statusMeta?.archived).map((entry) => entry.row);
        const showStockArchive = !!PlanningModule.state.stockArchiveMode;
        const visibleReleasedStockRows = showStockArchive ? archiveReleasedStockRows : activeReleasedStockRows;
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
                                <button class="btn-sm" onclick="PlanningModule.setStockArchiveMode(false)" style="${showStockArchive ? '' : 'border-color:#0f172a; background:#0f172a; color:#fff; font-weight:700;'}">aktif donusenler (${activeReleasedStockRows.length})</button>
                                <button class="btn-sm" onclick="PlanningModule.setStockArchiveMode(true)" style="${showStockArchive ? 'border-color:#047857; color:#047857; background:#ecfdf5; font-weight:700;' : ''}">birim arsivi (${archiveReleasedStockRows.length})</button>
                                <button class="btn-primary" onclick="PlanningModule.openStockDemandForm(true)" style="min-width:170px;">yeni talep +</button>
                            </div>
                        </div>
                        <div style="background:white; border:2px solid #fca5a5; border-radius:0.95rem; padding:0.9rem; margin-bottom:0.75rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; margin-bottom:0.75rem; flex-wrap:wrap;">
                                <strong style="color:#b91c1c;">Planlama havuzunda bekleyenler</strong>
                                <span style="font-size:0.78rem; color:#b91c1c; font-weight:700;">${PlanningModule.escapeHtml(String(openStockRows.length))} kayit</span>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:0.4rem;">
                                ${PlanningModule.renderStockDemandRows(openStockRows, 'Planlamada bekleyen stok talebi yok.')}
                            </div>
                        </div>

                        <div style="background:white; border:2px solid #86efac; border-radius:0.95rem; padding:0.9rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; margin-bottom:0.75rem; flex-wrap:wrap;">
                                <strong style="color:#047857;">${showStockArchive ? 'Birim arsivi' : 'Is emrine donusenler'}</strong>
                                <span style="font-size:0.78rem; color:#047857; font-weight:700;">${PlanningModule.escapeHtml(String(visibleReleasedStockRows.length))} kayit</span>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:0.4rem;">
                                ${PlanningModule.renderStockDemandRows(visibleReleasedStockRows, showStockArchive ? 'Birim arsivinde kayit yok.' : 'Henuz is emrine donusen aktif stok talebi yok.')}
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
                            <input type="date" value="${PlanningModule.escapeHtml(PlanningModule.state.stockDraftDueDate || '')}" onchange="PlanningModule.setStockDraftField('stockDraftDueDate', this.value)" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.65rem;">
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:minmax(0,1.85fr) minmax(0,1fr); gap:0.9rem;">
                        <div style="border:1px solid #cbd5e1; border-radius:0.95rem; background:white; padding:0.85rem;">
                            <div style="display:flex; justify-content:space-between; gap:0.6rem; align-items:center; flex-wrap:wrap; margin-bottom:0.65rem;">
                                <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
                                <button class="btn-sm" onclick="PlanningModule.setStockDraftField('stockDraftSourceKind','MODEL')" style="${sourceKind === 'MODEL' ? 'background:#0f172a; color:#fff; border-color:#0f172a;' : ''}">Satilan Urun Kutuphanesi</button>
                                <button class="btn-sm" onclick="PlanningModule.setStockDraftField('stockDraftSourceKind','COMPONENT')" style="${sourceKind === 'COMPONENT' ? 'background:#0f172a; color:#fff; border-color:#0f172a;' : ''}">Parca/bilesen</button>
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

    renderSalesDemandWorkspace: () => {
        const rows = PlanningModule.getSalesDemandRows();
        PlanningModule.state.salesDemandRowsByKey = {};
        rows.forEach((row) => {
            const key = String(row?.key || '').trim();
            if (!key) return;
            PlanningModule.state.salesDemandRowsByKey[key] = row;
        });
        const groups = PlanningModule.getSalesDemandGroupRows(rows);
        const totalQty = groups.reduce((sum, group) => sum + PlanningModule.parseQty(group?.totalQty, 0), 0);
        const totalLineCount = groups.reduce((sum, group) => sum + PlanningModule.parseQty(group?.itemCount, 0), 0);

        const renderCards = () => {
            if (!groups.length) {
                return `<div style="border:1px dashed #cbd5e1; border-radius:0.75rem; padding:1rem; text-align:center; color:#94a3b8; background:#f8fafc;">Onayli siparis satiri bulunamadi.</div>`;
            }
            return groups.map((group) => {
                const groupKey = String(group?.key || '').trim();
                const workOrderSummary = '-';
                const statusStyle = group.pendingCount <= 0
                    ? 'background:#ecfdf5; border:1px solid #86efac; color:#166534;'
                    : (group.sentCount > 0
                        ? 'background:#fff7ed; border:1px solid #fdba74; color:#9a3412;'
                        : 'background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8;');
                return `
                    <div style="border:1px solid #dbe4ee; border-radius:0.85rem; background:#f8fafc; box-shadow:0 1px 2px rgba(15,23,42,0.06); padding:0.75rem; margin-bottom:0.65rem;">
                        <div style="display:grid; grid-template-columns:repeat(8,minmax(0,1fr)); gap:0.6rem; align-items:center;">
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Talep / Siparis</div>
                                <div style="margin-top:0.2rem; font-family:monospace; font-weight:800; color:#1d4ed8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${PlanningModule.escapeHtml(group?.safeRef || '-')}</div>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Kaynak</div>
                                <div style="margin-top:0.2rem;"><span style="display:inline-block; border-radius:999px; padding:0.12rem 0.45rem; font-size:0.72rem; font-weight:700; background:#fff7ed; border:1px solid #fdba74; color:#9a3412;">Satis Siparisi</span></div>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Kalem</div>
                                <div style="margin-top:0.2rem; text-align:center; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(group?.itemCount || 0))}</div>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Toplam adet</div>
                                <div style="margin-top:0.2rem; text-align:center; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(group?.totalQty || 0))}</div>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Termin</div>
                                <div style="margin-top:0.2rem; font-weight:700; color:#334155;">${PlanningModule.escapeHtml(group?.dueRange || '-')}</div>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Durum</div>
                                <div style="margin-top:0.2rem;"><span style="display:inline-block; border-radius:999px; padding:0.12rem 0.45rem; font-size:0.72rem; font-weight:700; ${statusStyle}">${PlanningModule.escapeHtml(group?.statusLabel || '-')}</span></div>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Is emri</div>
                                <div style="margin-top:0.2rem; font-family:monospace; color:#1e40af; font-weight:700;">${PlanningModule.escapeHtml(workOrderSummary)}</div>
                            </div>
                            <div style="min-width:0; display:flex; justify-content:flex-end; align-items:flex-end;">
                                <button class="btn-sm" onclick="PlanningModule.openGroupDetailWorkspace('sales-demand','${PlanningModule.escapeJsString(groupKey)}','sales-demand')">detay ac</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        };

        return `
            <section style="max-width:1680px; margin:0 auto;">
                <div style="background:rgba(255,255,255,0.72); border:1px solid #cbd5e1; border-radius:1.8rem; padding:1.25rem;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.9rem; margin-bottom:0.9rem; flex-wrap:wrap;">
                        <div>
                            <h2 class="page-title" style="margin:0;">planlama / siparisten gelen talepler</h2>
                            <div style="font-size:0.84rem; color:#64748b; margin-top:0.2rem;">Sadece onayli siparis satirlari listelenir. Detay ekranindan planlama havuzuna gonderim yapilabilir.</div>
                        </div>
                        <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                            <button class="btn-sm" onclick="PlanningModule.openWorkspace('menu')">geri</button>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.65rem; margin-bottom:0.85rem;">
                        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:0.8rem; padding:0.65rem 0.75rem;"><div style="font-size:0.72rem; color:#64748b;">Siparis satiri (tek grup)</div><div style="font-size:1.05rem; font-weight:800; color:#0f172a;">${groups.length}</div></div>
                        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:0.8rem; padding:0.65rem 0.75rem;"><div style="font-size:0.72rem; color:#64748b;">Toplam kalem</div><div style="font-size:1.05rem; font-weight:800; color:#0f172a;">${totalLineCount}</div></div>
                        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:0.8rem; padding:0.65rem 0.75rem;"><div style="font-size:0.72rem; color:#64748b;">Toplam adet</div><div style="font-size:1.05rem; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(totalQty))}</div></div>
                        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:0.8rem; padding:0.65rem 0.75rem;"><div style="font-size:0.72rem; color:#1e3a8a;">Planlama Havuzuna Gonder</div><div style="font-size:0.9rem; font-weight:700; color:#1d4ed8;">Detay ekrani uzerinden aktif</div></div>
                    </div>
                    <div class="card-table" style="background:#fff; border:1px solid #e2e8f0; border-radius:0.9rem; padding:0.55rem;">
                        ${renderCards()}
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
        const releasedEntries = releasedRows.map((row) => ({
            row,
            statusMeta: PlanningModule.getReleasedDemandStatusMeta(PlanningModule.getReleasedDemandItemGroups(row), row)
        }));
        const activeReleasedRows = releasedEntries.filter((entry) => !entry?.statusMeta?.archived).map((entry) => entry.row);
        const archiveReleasedRows = releasedEntries.filter((entry) => !!entry?.statusMeta?.archived).map((entry) => entry.row);
        const showPoolArchive = !!PlanningModule.state.planningPoolArchiveMode;
        const visibleReleasedRows = showPoolArchive ? archiveReleasedRows : activeReleasedRows;
        const totalOpenQty = openRows.reduce((sum, row) => sum + PlanningModule.parseQty(row?.qty, 0), 0);
        const totalReleasedQty = visibleReleasedRows.reduce((sum, row) => sum + PlanningModule.getDemandQtyForDisplay(row), 0);
        const expandedDemandId = String(PlanningModule.state.planningPoolExpandedDemandId || '');
        const openDemandGroups = PlanningModule.getPlanningPoolDemandGroups(openRows);
        const expandedGroupKey = String(PlanningModule.state.planningPoolExpandedGroupKey || '');
        const resolveGroupKeyForDemand = (demand) => {
            const sourceType = String(demand?.sourceType || '').trim().toUpperCase();
            if (sourceType === 'SALES_ORDER') {
                const sourceOrderId = String(demand?.sourceOrderId || '').trim();
                if (sourceOrderId) return sourceOrderId;
            }
            return String(demand?.id || '').trim();
        };
        const getReleasedCountForGroup = (group) => {
            const refKey = String(group?.key || '').trim();
            return allRows.filter((row) => {
                if (String(row?.status || 'OPEN').toUpperCase() !== 'RELEASED') return false;
                return resolveGroupKeyForDemand(row) === refKey;
            }).length;
        };

        const renderOpenTableRows = () => {
            if (!openRows.length) {
                return `<div style="border:1px dashed #fca5a5; border-radius:0.9rem; padding:1rem; text-align:center; color:#94a3b8;">Is emrine donusmeyi bekleyen talep yok.</div>`;
            }

            const renderDemandCard = (row) => {
                const demandId = String(row?.id || '');
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
                const { approvedRows, approvedNetQty, approvedConsumedQty } = PlanningModule.getApprovedPoolRowsMetrics(poolRows);
                const demandSourceType = String(row?.sourceType || '').trim().toUpperCase();
                const isSalesOrderDemand = demandSourceType === 'SALES_ORDER';
                const canConvert = analysisReady && approvedRows.length > 0 && approvedNetQty > 0;
                const canMontageOnlyRelease = !isSalesOrderDemand
                    && analysisReady
                    && PlanningModule.isDemandEligibleForMontageOnlyFromPool(row, poolRows)
                    && approvedNetQty === 0
                    && approvedConsumedQty > 0;
                const itemGroups = PlanningModule.getPlanningPoolItemGroups(row);
                const expandedItemMap = (PlanningModule.state.planningPoolExpandedItemByDemand && typeof PlanningModule.state.planningPoolExpandedItemByDemand === 'object')
                    ? PlanningModule.state.planningPoolExpandedItemByDemand
                    : {};
                const expandedItemSet = (expandedItemMap[demandId] && typeof expandedItemMap[demandId] === 'object')
                    ? expandedItemMap[demandId]
                    : {};
                const demandItems = PlanningModule.getDemandItems(row);
                const releasedGroups = PlanningModule.getReleasedDemandItemGroups(row);
                const releasedByItem = new Map();
                releasedGroups.forEach((group) => {
                    releasedByItem.set(String(group?.itemKey || ''), group);
                    const groupCode = String(group?.itemCode || '').trim().toUpperCase();
                    if (groupCode) releasedByItem.set(`code:${groupCode}`, group);
                });

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
                                    <div style="font-size:0.74rem; color:#1d4ed8; font-family:monospace;">${PlanningModule.renderLiveCodeButton(code)}</div>
                                    ${missingHint}
                                </td>
                                <td style="padding:0.5rem; text-align:center; font-weight:700;">${PlanningModule.escapeHtml(String(poolRow?.requiredQty || 0))}</td>
                                <td style="padding:0.5rem; text-align:center; font-weight:700; color:#0f766e;">${PlanningModule.escapeHtml(String(poolRow?.stockAvailableQty || 0))}</td>
                                <td style="padding:0.5rem; text-align:center; font-weight:700; color:#0f766e;">${PlanningModule.escapeHtml(String(poolRow?.semiAvailableQty || 0))}</td>
                                <td style="padding:0.5rem; text-align:center;"><input type="number" min="0" ${disabledInput} value="${PlanningModule.escapeHtml(String(poolRow?.useStockQty || 0))}" onchange="PlanningModule.setPlanningPoolRowQty('${PlanningModule.escapeJsString(demandId)}','${key}','useStockQty', this.value)" style="width:96px; height:32px; border:1px solid #67e8f9; border-radius:0.45rem; background:#ecfeff; text-align:center; font-weight:700; ${poolRow.useEnabled ? '' : 'opacity:0.5; cursor:not-allowed;'}"></td>
                                <td style="padding:0.5rem; text-align:center;"><input type="number" min="0" ${disabledInput} value="${PlanningModule.escapeHtml(String(poolRow?.useSemiQty || 0))}" onchange="PlanningModule.setPlanningPoolRowQty('${PlanningModule.escapeJsString(demandId)}','${key}','useSemiQty', this.value)" style="width:112px; height:32px; border:1px solid #67e8f9; border-radius:0.45rem; background:#ecfeff; text-align:center; font-weight:700; ${poolRow.useEnabled ? '' : 'opacity:0.5; cursor:not-allowed;'}"></td>
                                <td style="padding:0.5rem; text-align:center;"><input type="checkbox" ${poolRow.useEnabled && !isMissing ? 'checked' : ''} ${isMissing ? 'disabled' : ''} onchange="PlanningModule.setPlanningPoolRowUseEnabled('${PlanningModule.escapeJsString(demandId)}','${key}', this.checked)"></td>
                                <td style="padding:0.5rem; text-align:center;"><input type="number" min="${PlanningModule.escapeHtml(String(poolRow?.minNetQty || 0))}" value="${PlanningModule.escapeHtml(String(poolRow?.netQty || 0))}" ${isMissing ? 'disabled' : ''} onchange="PlanningModule.setPlanningPoolRowQty('${PlanningModule.escapeJsString(demandId)}','${key}','netQty', this.value)" style="width:112px; height:32px; border-radius:0.45rem; text-align:center; font-weight:800; ${netStyle} ${isMissing ? 'opacity:0.65; cursor:not-allowed;' : ''}"></td>
                                <td style="padding:0.5rem; text-align:center;"><input type="checkbox" ${poolRow.approved ? 'checked' : ''} ${isMissing ? 'disabled' : ''} onchange="PlanningModule.setPlanningPoolRowApproved('${PlanningModule.escapeJsString(demandId)}','${key}', this.checked)"></td>
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
                                        <div style="font-size:0.74rem; color:#1d4ed8; font-family:monospace;">${PlanningModule.renderLiveCodeButton(String(group?.itemCode || '').trim())} / ${PlanningModule.escapeHtml(PlanningModule.getItemTypeLabel(group?.itemType || 'MODEL'))}</div>
                                    </div>
                                    <div style="display:flex; gap:0.3rem; flex-wrap:wrap;">
                                        <button class="btn-sm" onclick="PlanningModule.openDemandItemTrackingModal('${PlanningModule.escapeJsString(demandId)}','${PlanningModule.escapeJsString(groupKey)}','${PlanningModule.escapeJsString(String(group?.itemCode || '').trim())}')">izle</button>
                                        <button class="btn-sm" onclick="PlanningModule.togglePlanningPoolItemExpand('${PlanningModule.escapeJsString(demandId)}','${PlanningModule.escapeJsString(groupKey)}')" style="${isItemExpanded ? 'border-color:#0f172a; background:#0f172a; color:#fff;' : 'border-color:#cbd5e1;'}">${isItemExpanded ? 'kapat' : 'planla'}</button>
                                    </div>
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
                    <div style="margin-top:0.6rem; border:1px solid #bfdbfe; border-radius:0.95rem; background:#ffffff; padding:0.85rem;">
                        <div style="font-weight:800; color:#1e3a8a;">Urun Agaci / Patlatma Detayi - ${PlanningModule.escapeHtml(row?.demandCode || '-')}</div>
                        <div style="font-size:0.76rem; color:#64748b; margin-top:0.2rem;">Kullan secili ise stok/yari mamul dusulur, kalan net uretime gider. Eksik uretim girilemez.</div>
                        ${itemSectionsHtml}
                        <div style="margin-top:0.65rem; border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem 0.7rem; background:#f8fafc;">
                            <div style="font-size:0.8rem; color:#334155; font-weight:700;">Ozet: Toplam gereken ${summary.requiredQty} | Stok+Yari mamul karsilanan ${summary.consumedQty} | Uretilecek net ${summary.netQty}</div>
                            <div style="font-size:0.74rem; color:#64748b; margin-top:0.2rem;">Uretilecek net gerekenin altina dusmez. Gerekenin ustu icin donusumde onay istenir.</div>
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:0.45rem; margin-top:0.65rem;">
                            ${!isSalesOrderDemand ? '' : `<button class="btn-sm" onclick="PlanningModule.setPlanningPoolDemandAllProduceNoStock('${PlanningModule.escapeJsString(demandId)}')">tumunu uret / stok kullanma</button>`}
                            <button class="btn-sm" onclick="PlanningModule.togglePlanningPoolExpand('${PlanningModule.escapeJsString(demandId)}')">vazgec</button>
                        </div>
                        ${!isSalesOrderDemand ? '' : `<div style="margin-top:0.55rem; border:1px solid #bfdbfe; background:#eff6ff; color:#1e3a8a; border-radius:0.55rem; padding:0.45rem 0.6rem; font-size:0.76rem; font-weight:600;">Demo acilisi: Satis siparisi kaynakli talepler yalniz Planlama Havuzu validasyonlari ile is emrine donusturulur. Canli kural icin rezerv/sarf/stok mutabakati ayrica tamamlanmalidir.</div>`}
                    </div>
                `;

                const detailItemsHtml = !demandItems.length
                    ? `<div style="font-size:0.78rem; color:#94a3b8;">Kalem bilgisi bulunamadi.</div>`
                    : `
                        <div class="card-table" style="margin-top:0.5rem;">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                                        <th style="padding:0.46rem; text-align:left;">Urun</th>
                                        <th style="padding:0.46rem; text-align:left;">Kod</th>
                                        <th style="padding:0.46rem; text-align:center;">Adet</th>
                                        <th style="padding:0.46rem; text-align:left;">Durum</th>
                                        <th style="padding:0.46rem; text-align:center;">Havuz</th>
                                        <th style="padding:0.46rem; text-align:center;">Is emri</th>
                                        <th style="padding:0.46rem; text-align:left;">Rota / atolyeler</th>
                                        <th style="padding:0.46rem; text-align:right;">Islem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${demandItems.map((item) => {
                                        const itemId = String(item?.id || '').trim();
                                        const itemCode = String(PlanningModule.getDemandItemCode(item) || '').trim();
                                        const releasedGroup = releasedByItem.get(itemId) || releasedByItem.get(`code:${itemCode.toUpperCase()}`) || null;
                                        const workOrderText = releasedGroup && Array.isArray(releasedGroup?.lines) && releasedGroup.lines.length
                                            ? Array.from(new Set(releasedGroup.lines.map((line) => String(line?.workOrderCode || '').trim()).filter(Boolean))).join(' | ') || '-'
                                            : '-';
                                        const routeText = releasedGroup && Array.isArray(releasedGroup?.activeStations) && releasedGroup.activeStations.length
                                            ? releasedGroup.activeStations.join(' | ')
                                            : (String(row?.status || 'OPEN').toUpperCase() === 'OPEN' ? 'Planlama bekliyor' : '-');
                                        return `
                                            <tr style="border-bottom:1px solid #f1f5f9;">
                                                <td style="padding:0.46rem; font-weight:700; color:#334155;">${PlanningModule.escapeHtml(item?.productName || '-')}</td>
                                                <td style="padding:0.46rem; font-family:monospace;">${PlanningModule.escapeHtml(itemCode || '-')}</td>
                                                <td style="padding:0.46rem; text-align:center; font-weight:800;">${PlanningModule.escapeHtml(String(item?.qty || 0))}</td>
                                                <td style="padding:0.46rem;"><span style="display:inline-block; border-radius:999px; padding:0.12rem 0.45rem; font-size:0.7rem; font-weight:700; ${processBadgeStyle}">${PlanningModule.escapeHtml(processBadgeLabel)}</span></td>
                                                <td style="padding:0.46rem; text-align:center; font-weight:700; color:#166534;">Evet</td>
                                                <td style="padding:0.46rem; text-align:center; font-family:monospace; color:#1e40af;">${PlanningModule.escapeHtml(workOrderText || '-')}</td>
                                                <td style="padding:0.46rem; color:#475569;">${PlanningModule.escapeHtml(routeText)}</td>
                                                <td style="padding:0.46rem; text-align:right;"><button class="btn-sm" onclick="PlanningModule.openDemandItemTrackingModal('${PlanningModule.escapeJsString(demandId)}','${PlanningModule.escapeJsString(itemId)}','${PlanningModule.escapeJsString(itemCode)}')">izle</button></td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;

                return `
                    <div style="border:1px solid #e2e8f0; border-radius:0.85rem; padding:0.7rem; background:#fffef8; margin-top:0.6rem;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.55rem; flex-wrap:wrap;">
                            <div>
                                <div style="font-family:monospace; font-weight:700; color:#1d4ed8;">${PlanningModule.escapeHtml(row?.demandCode || '-')}</div>
                                <div style="font-size:0.75rem; color:#64748b;">${PlanningModule.escapeHtml(row?.sourceLabel || 'Stok Uretimi')}</div>
                            </div>
                            <span style="display:inline-block; border-radius:999px; padding:0.14rem 0.5rem; font-size:0.72rem; font-weight:700; ${processBadgeStyle}">${PlanningModule.escapeHtml(processBadgeLabel)}</span>
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.45rem; margin-top:0.5rem;">
                            <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.42rem;"><div style="font-size:0.72rem; color:#64748b;">Urun</div><div style="font-weight:700; color:#334155;">${PlanningModule.escapeHtml(displayName)}</div><div style="font-size:0.74rem; color:#64748b; font-family:monospace;">${PlanningModule.escapeHtml(displayCode)}</div></div>
                            <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.42rem;"><div style="font-size:0.72rem; color:#64748b;">Adet</div><div style="font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(row?.qty || 0))}</div></div>
                            <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.42rem;"><div style="font-size:0.72rem; color:#64748b;">Termin</div><div style="font-weight:700; color:#0f172a;">${PlanningModule.escapeHtml(row?.dueDate || '-')}</div><div style="margin-top:0.2rem;">${priorityBadge}</div></div>
                            <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.42rem;"><div style="font-size:0.72rem; color:#64748b;">Onayli net</div><div style="font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(approvedNetQty || 0))}</div></div>
                        </div>
                        ${detailItemsHtml}
                        <div style="display:flex; justify-content:flex-end; gap:0.35rem; margin-top:0.55rem; flex-wrap:wrap;">
                            <button class="btn-sm" onclick="PlanningModule.openDemandView('${PlanningModule.escapeJsString(demandId)}')">goruntule</button>
                            <button class="btn-sm" onclick="PlanningModule.togglePlanningPoolExpand('${PlanningModule.escapeJsString(demandId)}')" style="${isExpanded ? 'border-color:#0f172a; background:#0f172a; color:#fff;' : 'border-color:#cbd5e1;'}">planla</button>
                        </div>
                        ${expandedHtml}
                    </div>
                `;
            };

            return openDemandGroups.map((group) => {
                const key = String(group?.key || '').trim();
                const isExpanded = expandedGroupKey === key;
                const rowsInGroup = Array.isArray(group?.rows) ? group.rows : [];
                const releasedCount = getReleasedCountForGroup(group);
                const pendingCount = rowsInGroup.length;
                const statusStyle = pendingCount <= 0
                    ? 'background:#ecfdf5; border:1px solid #86efac; color:#166534;'
                    : 'background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8;';
                return `
                    <div style="border:1px solid #fca5a5; border-radius:1rem; background:#ffffff; padding:0.8rem; margin-top:0.7rem;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.6rem; flex-wrap:wrap;">
                            <div>
                                <div style="font-size:0.74rem; color:#64748b;">Talep / Siparis referansi</div>
                                <div style="font-family:monospace; font-weight:800; color:#1d4ed8;">${PlanningModule.escapeHtml(group?.reference || '-')}</div>
                            </div>
                            <span style="display:inline-block; border-radius:999px; padding:0.14rem 0.55rem; font-size:0.72rem; font-weight:700; ${String(group?.sourceType || '').toUpperCase() === 'SALES_ORDER' ? 'background:#fff7ed; border:1px solid #fdba74; color:#9a3412;' : 'background:#ecfdf5; border:1px solid #86efac; color:#166534;'}">${PlanningModule.escapeHtml(group?.sourceTypeLabel || '-')}</span>
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.45rem; margin-top:0.55rem;">
                            <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Kalem sayisi</div><div style="font-size:0.95rem; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(group?.itemCount || 0))}</div></div>
                            <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Toplam adet</div><div style="font-size:0.95rem; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(group?.totalQty || 0))}</div></div>
                            <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Termin araligi</div><div style="font-size:0.9rem; font-weight:700; color:#0f172a;">${PlanningModule.escapeHtml(group?.dueRange || '-')}</div></div>
                            <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Is emrine donusen / bekleyen</div><div style="font-size:0.9rem; font-weight:700; color:#0f172a;">${releasedCount} / ${pendingCount}</div></div>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.55rem; margin-top:0.55rem; flex-wrap:wrap;">
                            <span style="display:inline-block; border-radius:999px; padding:0.14rem 0.55rem; font-size:0.72rem; font-weight:700; ${statusStyle}">${pendingCount > 0 ? 'Planlama Havuzunda bekliyor' : 'Islem yok'}</span>
                            <button class="btn-sm" onclick="PlanningModule.togglePlanningPoolGroupExpand('${PlanningModule.escapeJsString(key)}')" style="${isExpanded ? 'border-color:#0f172a; background:#0f172a; color:#fff;' : 'border-color:#cbd5e1;'}">${isExpanded ? 'detayi kapat' : 'detay ac'}</button>
                        </div>
                        ${!isExpanded ? '' : `<div style="margin-top:0.6rem; border-top:1px solid #e2e8f0; padding-top:0.6rem;">${rowsInGroup.map((row) => renderDemandCard(row)).join('')}</div>`}
                    </div>
                `;
            }).join('');
        };

        const renderOpenCompactCards = () => {
            if (!openDemandGroups.length) {
                return `<div style="border:1px dashed #cbd5e1; border-radius:0.75rem; padding:1rem; text-align:center; color:#94a3b8; background:#f8fafc;">Is emrine donusmeyi bekleyen talep yok.</div>`;
            }
            return openDemandGroups.map((group) => {
                const key = String(group?.key || '').trim();
                const rowsInGroup = Array.isArray(group?.rows) ? group.rows : [];
                const releasedCount = getReleasedCountForGroup(group);
                const pendingCount = rowsInGroup.length;
                const statusLabel = pendingCount > 0 ? 'Planlama Havuzunda' : 'Islem yok';
                return `
                    <div style="margin-bottom:0.65rem; border:1px solid #dbe4ee; border-radius:0.85rem; background:#f8fafc; box-shadow:0 1px 2px rgba(15,23,42,0.06); padding:0.75rem;">
                        <div style="display:grid; grid-template-columns:repeat(8,minmax(0,1fr)); gap:0.6rem; align-items:center;">
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Talep / Siparis</div>
                                <div style="margin-top:0.2rem; font-family:monospace; font-weight:800; color:#1d4ed8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${PlanningModule.escapeHtml(group?.reference || '-')}</div>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Kaynak</div>
                                <div style="margin-top:0.2rem;"><span style="display:inline-block; border-radius:999px; padding:0.12rem 0.45rem; font-size:0.72rem; font-weight:700; ${String(group?.sourceType || '').toUpperCase() === 'SALES_ORDER' ? 'background:#fff7ed; border:1px solid #fdba74; color:#9a3412;' : 'background:#ecfdf5; border:1px solid #86efac; color:#166534;'}">${PlanningModule.escapeHtml(group?.sourceTypeLabel || '-')}</span></div>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Kalem</div>
                                <div style="margin-top:0.2rem; text-align:center; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(group?.itemCount || 0))}</div>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Toplam adet</div>
                                <div style="margin-top:0.2rem; text-align:center; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(group?.totalQty || 0))}</div>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Termin</div>
                                <div style="margin-top:0.2rem; font-weight:700; color:#334155;">${PlanningModule.escapeHtml(group?.dueRange || '-')}</div>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Durum</div>
                                <div style="margin-top:0.2rem;"><span style="display:inline-block; border-radius:999px; padding:0.12rem 0.45rem; font-size:0.72rem; font-weight:700; background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8;">${PlanningModule.escapeHtml(statusLabel)}</span></div>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Is emri ozeti</div>
                                <div style="margin-top:0.2rem; font-family:monospace; color:#1e40af; font-weight:700;">${releasedCount} / ${pendingCount}</div>
                            </div>
                            <div style="min-width:0; display:flex; justify-content:flex-end; align-items:flex-end;">
                                <button class="btn-sm" onclick="PlanningModule.openGroupDetailWorkspace('planning-pool-open','${PlanningModule.escapeJsString(key)}','planning-pool')">detay ac</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        };

        const renderReleasedCards = () => {
            const grouped = PlanningModule.getPlanningPoolDemandGroups(visibleReleasedRows);
            if (!grouped.length) {
                return `<div style="border:1px dashed #cbd5e1; border-radius:0.75rem; padding:1rem; text-align:center; color:#94a3b8; background:#f8fafc;">${showPoolArchive ? 'Birim arsivinde kayit yok.' : 'Henuz is emrine donusen aktif kayit yok.'}</div>`;
            }
            return grouped.map((group) => {
                const key = String(group?.key || '').trim();
                const rowsInGroup = Array.isArray(group?.rows) ? group.rows : [];
                const workOrderSet = new Set();
                let doneCount = 0;
                rowsInGroup.forEach((row) => {
                    const statusMeta = PlanningModule.getReleasedDemandStatusMeta(PlanningModule.getReleasedDemandItemGroups(row), row);
                    if (statusMeta?.archived || statusMeta?.done) doneCount += 1;
                    PlanningModule.getLinkedWorkOrdersForDemand(row).forEach((order) => {
                        const code = String(order?.workOrderCode || '').trim();
                        if (code) workOrderSet.add(code);
                    });
                });
                const inProgressCount = Math.max(0, rowsInGroup.length - doneCount);
                const statusStyle = inProgressCount > 0
                    ? 'background:#fee2e2; border:1px solid #fca5a5; color:#b91c1c;'
                    : 'background:#ecfdf5; border:1px solid #86efac; color:#047857;';
                const statusLabel = inProgressCount > 0 ? `${inProgressCount} devam ediyor` : 'Tamamlandi';
                const sourceBadgeStyle = String(group?.sourceType || '').toUpperCase() === 'SALES_ORDER'
                    ? 'background:#fff7ed; border:1px solid #fdba74; color:#9a3412;'
                    : 'background:#ecfdf5; border:1px solid #86efac; color:#166534;';
                return `
                    <div style="margin-bottom:0.65rem; border:1px solid #dbe4ee; border-radius:0.85rem; background:#f8fafc; box-shadow:0 1px 2px rgba(15,23,42,0.06); padding:0.75rem;">
                        <div style="display:grid; grid-template-columns:repeat(8,minmax(0,1fr)); gap:0.6rem; align-items:center;">
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Talep / Siparis</div>
                                <div style="margin-top:0.2rem; font-family:monospace; font-weight:800; color:#1d4ed8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${PlanningModule.escapeHtml(group?.reference || '-')}</div>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Kaynak</div>
                                <div style="margin-top:0.2rem;"><span style="display:inline-block; border-radius:999px; padding:0.12rem 0.45rem; font-size:0.72rem; font-weight:700; ${sourceBadgeStyle}">${PlanningModule.escapeHtml(group?.sourceTypeLabel || '-')}</span></div>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Kalem</div>
                                <div style="margin-top:0.2rem; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(group?.itemCount || 0))}</div>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Toplam adet</div>
                                <div style="margin-top:0.2rem; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(group?.totalQty || 0))}</div>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Termin</div>
                                <div style="margin-top:0.2rem; font-weight:700; color:#334155;">${PlanningModule.escapeHtml(group?.dueRange || '-')}</div>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Durum</div>
                                <div style="margin-top:0.2rem;"><span style="display:inline-block; border-radius:999px; padding:0.12rem 0.45rem; font-size:0.72rem; font-weight:700; ${statusStyle}">${statusLabel}</span></div>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Is emri ozeti</div>
                                <div style="margin-top:0.2rem; font-family:monospace; color:#1e40af; font-weight:700;">WO ${workOrderSet.size}</div>
                            </div>
                            <div style="min-width:0; display:flex; justify-content:flex-end; align-items:flex-end;">
                                <button class="btn-sm" onclick="PlanningModule.openGroupDetailWorkspace('planning-pool-released','${PlanningModule.escapeJsString(key)}','planning-pool')">detay ac</button>
                            </div>
                        </div>
                    </div>
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
                            <button class="btn-sm" onclick="PlanningModule.setPlanningPoolArchiveMode(false)" style="${showPoolArchive ? '' : 'border-color:#0f172a; background:#0f172a; color:#fff; font-weight:700;'}">aktif donusenler (${activeReleasedRows.length})</button>
                            <button class="btn-sm" onclick="PlanningModule.setPlanningPoolArchiveMode(true)" style="${showPoolArchive ? 'border-color:#047857; color:#047857; background:#ecfdf5; font-weight:700;' : ''}">birim arsivi (${archiveReleasedRows.length})</button>
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
                            <div style="font-size:0.72rem; color:#64748b;">${showPoolArchive ? 'Arsiv kayit' : 'Donusen kayit'}</div>
                            <div style="font-size:1.05rem; font-weight:800; color:#0f172a;">${visibleReleasedRows.length}</div>
                        </div>
                        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:0.8rem; padding:0.65rem 0.75rem;">
                            <div style="font-size:0.72rem; color:#64748b;">${showPoolArchive ? 'Arsiv toplam adet' : 'Donusen toplam adet'}</div>
                            <div style="font-size:1.05rem; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(totalReleasedQty))}</div>
                        </div>
                    </div>

                    <div style="background:#ffffff; border:2px solid #fca5a5; border-radius:1rem; padding:0.75rem; margin-bottom:0.95rem;">
                        <div style="font-size:0.82rem; font-weight:800; color:#b91c1c; margin-bottom:0.45rem;">IS EMRINE DONUSMEYI BEKLEYENLER (ONCELIKLI LISTE)</div>
                        <div style="display:flex; flex-direction:column; gap:0.4rem;">
                            ${renderOpenCompactCards()}
                        </div>
                    </div>

                    <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:1rem; padding:0.75rem;">
                        <div style="font-size:0.82rem; font-weight:800; color:#047857; margin-bottom:0.45rem;">${showPoolArchive ? 'BIRIM ARSIVI (AYRI LISTE)' : 'IS EMRINE DONUSENLER (AYRI LISTE)'}</div>
                        <div style="display:flex; flex-direction:column; gap:0.4rem;">
                            ${renderReleasedCards()}
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

    toggleReleasedGroupExpand: (groupKey) => {
        const key = String(groupKey || '').trim();
        const same = String(PlanningModule.state.releasedExpandedGroupKey || '') === key;
        PlanningModule.state.releasedExpandedGroupKey = same ? '' : key;
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
                const componentCode = String(line?.componentCode || order?.productCode || '-');
                const componentId = String(line?.componentId || '');
                group.lines.push({
                    rowKey: `${String(order?.id || '')}:${String(line?.id || lineIndex)}`,
                    orderId: String(order?.id || ''),
                    workOrderCode: String(order?.workOrderCode || '-'),
                    componentId,
                    componentCode,
                    componentName: String(line?.componentName || order?.productName || '-'),
                    isSemiFinishedVariant: PlanningModule.isSemiFinishedComponentVariant(componentCode, componentId),
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

    getReleasedDemandStatusMeta: (groups, demand = null) => {
        const isMontageOnly = PlanningModule.isMontageOnlyNet0Demand(demand);
        if (isMontageOnly) {
            return {
                done: false,
                finished: false,
                stored: false,
                archived: false,
                label: 'Montaj akisina alindi',
                style: 'background:#eff6ff; color:#1d4ed8; border:1px solid #93c5fd;'
            };
        }
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

    buildReleasedDemandTrackingContentHtml: (demand, options = {}) => {
        const includeCloseAction = options?.includeCloseAction === true;
        const variant = String(options?.variant || 'modal').trim().toLowerCase();
        const source = demand && typeof demand === 'object' ? demand : null;
        if (!source) return '<div style="color:#b91c1c;">Talep kaydi bulunamadi.</div>';
        const demandCodeText = String(source?.demandCode || '-');
        const groups = PlanningModule.getReleasedDemandItemGroups(demand);
        const statusMeta = PlanningModule.getReleasedDemandStatusMeta(groups, source);
        const sourceMeta = PlanningModule.getReleasedDemandSourceMeta(source);
        const workOrderText = PlanningModule.getReleasedDemandWorkOrderText(source);
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
        const workOrderMap = new Map();
        groups.forEach((group) => {
            const lines = Array.isArray(group?.lines) ? group.lines : [];
            lines.forEach((line) => {
                const workOrderCode = String(line?.workOrderCode || '').trim();
                if (!workOrderCode) return;
                const key = workOrderCode;
                const existing = workOrderMap.get(key) || {
                    workOrderCode,
                    itemNames: new Set(),
                    componentNames: new Set(),
                    hasSemiFinishedVariant: false,
                    targetQty: 0,
                    doneQty: 0,
                    remainingQty: 0,
                    storageRemainingQty: 0,
                    stationNames: new Set()
                };
                const itemName = String(group?.itemName || '').trim();
                const componentName = String(line?.componentName || '').trim();
                if (itemName) existing.itemNames.add(itemName);
                if (componentName) existing.componentNames.add(componentName);
                if (line?.isSemiFinishedVariant) existing.hasSemiFinishedVariant = true;
                existing.targetQty += PlanningModule.parseQty(line?.targetQty, 0);
                existing.doneQty += PlanningModule.parseQty(line?.doneQty, 0);
                existing.remainingQty += PlanningModule.parseQty(line?.remainingQty, 0);
                existing.storageRemainingQty += PlanningModule.parseQty(line?.storageRemainingQty, 0);
                const stationName = String(line?.currentStationName || '').trim();
                if (stationName && stationName !== '-') existing.stationNames.add(stationName);
                workOrderMap.set(key, existing);
            });
        });
        const workOrderRows = Array.from(workOrderMap.values())
            .map((row) => ({
                ...row,
                itemNameText: Array.from(row.itemNames).join(', ') || '-',
                componentNameText: Array.from(row.componentNames).join(', ') || '-',
                stationText: Array.from(row.stationNames).join(' | ') || '-'
            }))
            .sort((a, b) => String(a?.workOrderCode || '').localeCompare(String(b?.workOrderCode || ''), 'tr'));
        const workOrdersHtml = workOrderRows.length
            ? `
                <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.7rem; background:#ffffff;">
                    <div style="font-size:0.84rem; font-weight:800; color:#0f172a; margin-bottom:0.45rem;">Bagli Is Emirleri (${workOrderRows.length})</div>
                    <div class="card-table">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                                    <th style="padding:0.48rem; text-align:left;">WO</th>
                                    <th style="padding:0.48rem; text-align:left;">Ilgili kalem / parca</th>
                                    <th style="padding:0.48rem; text-align:center;">Adet</th>
                                    <th style="padding:0.48rem; text-align:left;">Durum</th>
                                    <th style="padding:0.48rem; text-align:left;">Istasyon / rota</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${workOrderRows.map((row) => {
                const rowStatus = row.storageRemainingQty <= 0
                    ? { label: 'Depoya alındı', style: 'background:#ecfdf5; color:#047857; border:1px solid #86efac;' }
                    : (row.remainingQty <= 0
                        ? { label: `Bitti / depoya al bekliyor (${row.storageRemainingQty})`, style: 'background:#fff7ed; color:#b45309; border:1px solid #fdba74;' }
                        : { label: `Uretimde (kalan ${row.remainingQty})`, style: 'background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5;' });
                return `
                                        <tr style="border-bottom:1px solid #f1f5f9;">
                                            <td style="padding:0.48rem; font-family:monospace; font-weight:700; color:#1d4ed8;">${PlanningModule.escapeHtml(row.workOrderCode)}</td>
                                            <td style="padding:0.48rem;">
                                                <div style="font-weight:700; color:#334155;">${PlanningModule.escapeHtml(row.itemNameText)}</div>
                                                <div style="font-size:0.74rem; color:#64748b; display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap;">
                                                    <span>${PlanningModule.escapeHtml(row.componentNameText)}</span>
                                                    ${row.hasSemiFinishedVariant ? '<span style="display:inline-flex; align-items:center; justify-content:center; font-size:0.68rem; font-weight:800; color:#7c2d12; border:1px solid #fdba74; background:#fff7ed; border-radius:999px; padding:0.06rem 0.42rem;">Yarı Mamul</span>' : ''}
                                                </div>
                                            </td>
                                            <td style="padding:0.48rem; text-align:center; font-weight:700;">${PlanningModule.escapeHtml(String(row.doneQty))} / ${PlanningModule.escapeHtml(String(row.targetQty))}</td>
                                            <td style="padding:0.48rem;"><span style="display:inline-block; border-radius:999px; padding:0.14rem 0.5rem; font-size:0.72rem; font-weight:700; ${rowStatus.style}">${PlanningModule.escapeHtml(rowStatus.label)}</span></td>
                                            <td style="padding:0.48rem; color:#475569;">${PlanningModule.escapeHtml(row.stationText)}</td>
                                        </tr>
                                    `;
            }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `
            : `<div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.7rem; color:#94a3b8;">Bağlı iş emri satırı bulunamadı.</div>`;

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
        const renderInlineRouteChips = (steps, currentStationName = '') => {
            if (!Array.isArray(steps) || !steps.length) {
                return `<span style="display:inline-flex; border-radius:999px; border:1px solid #cbd5e1; background:#f8fafc; color:#64748b; padding:0.13rem 0.48rem; font-size:0.7rem; font-weight:700;">Rota yok</span>`;
            }
            const currentNorm = String(currentStationName || '').trim().toLocaleLowerCase('tr-TR');
            return steps.map((step) => {
                const stationName = String(step?.stationName || '-');
                const seq = String(step?.seq || '?');
                const activeQty = PlanningModule.parseQty(step?.activeQty, 0);
                const status = String(step?.stepStatus || 'NEXT').toUpperCase();
                const isCurrent = currentNorm && stationName.trim().toLocaleLowerCase('tr-TR') === currentNorm;
                const isDone = status === 'DONE';
                const baseStyle = isCurrent
                    ? 'background:#dbeafe; color:#1d4ed8; border:1px solid #93c5fd; font-weight:800;'
                    : (isDone
                        ? 'background:#f1f5f9; color:#64748b; border:1px solid #cbd5e1;'
                        : 'background:#ffffff; color:#64748b; border:1px solid #dbe2ec;');
                const qtyText = activeQty > 0 ? ` / ${activeQty}` : '';
                return `<span style="display:inline-flex; align-items:center; gap:0.24rem; border-radius:999px; padding:0.13rem 0.5rem; font-size:0.7rem; ${baseStyle}">${PlanningModule.escapeHtml(`${seq}. ${stationName}${qtyText}`)}</span>`;
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
                            <div style="font-weight:700; color:#334155; display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap;">
                                <span>${PlanningModule.escapeHtml(String(line?.componentName || '-'))}</span>
                                ${line?.isSemiFinishedVariant ? '<span style="display:inline-flex; align-items:center; justify-content:center; font-size:0.68rem; font-weight:800; color:#7c2d12; border:1px solid #fdba74; background:#fff7ed; border-radius:999px; padding:0.06rem 0.42rem;">Yarı Mamul</span>' : ''}
                            </div>
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

        if (variant === 'inline') {
            const workOrdersHtmlInline = workOrderRows.length
                ? `
                    <section style="border:1px solid #dbe2ec; border-radius:0.82rem; background:#ffffff; padding:0.65rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.45rem; margin-bottom:0.45rem; flex-wrap:wrap;">
                            <div style="font-size:0.85rem; font-weight:800; color:#0f172a;">Bagli Is Emirleri</div>
                            <span style="display:inline-flex; border:1px solid #dbe2ec; background:#f8fafc; color:#64748b; border-radius:999px; padding:0.12rem 0.48rem; font-size:0.68rem; font-weight:700;">${PlanningModule.escapeHtml(String(workOrderRows.length))} kayit</span>
                        </div>
                        <div class="card-table">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.7rem; text-transform:uppercase;">
                                        <th style="padding:0.44rem; text-align:left;">WO</th>
                                        <th style="padding:0.44rem; text-align:left;">Ilgili Urun</th>
                                        <th style="padding:0.44rem; text-align:center;">Adet</th>
                                        <th style="padding:0.44rem; text-align:left;">Durum</th>
                                        <th style="padding:0.44rem; text-align:left;">Istasyon</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${workOrderRows.map((row) => {
                                        const rowStatus = row.storageRemainingQty <= 0
                                            ? { label: 'Depoya alindi', style: 'background:#ecfdf5; color:#047857; border:1px solid #a7f3d0;' }
                                            : (row.remainingQty <= 0
                                                ? { label: `Bitti / depoya al (${row.storageRemainingQty})`, style: 'background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;' }
                                                : { label: `Uretimde (kalan ${row.remainingQty})`, style: 'background:#fff7ed; color:#b45309; border:1px solid #fdba74;' });
                                        return `
                                            <tr style="border-bottom:1px solid #f1f5f9;">
                                                <td style="padding:0.44rem; font-family:monospace; font-weight:800; color:#1d4ed8;">${PlanningModule.escapeHtml(row.workOrderCode)}</td>
                                                <td style="padding:0.44rem;">
                                                    <div style="font-weight:700; color:#334155;">${PlanningModule.escapeHtml(row.itemNameText)}</div>
                                                    <div style="font-size:0.72rem; color:#64748b; margin-top:0.08rem;">${PlanningModule.escapeHtml(row.componentNameText)}</div>
                                                </td>
                                                <td style="padding:0.44rem; text-align:center; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(row.doneQty))} / ${PlanningModule.escapeHtml(String(row.targetQty))}</td>
                                                <td style="padding:0.44rem;"><span style="display:inline-block; border-radius:999px; padding:0.11rem 0.46rem; font-size:0.68rem; font-weight:700; ${rowStatus.style}">${PlanningModule.escapeHtml(rowStatus.label)}</span></td>
                                                <td style="padding:0.44rem; color:#475569;">${PlanningModule.escapeHtml(row.stationText)}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </section>
                `
                : `<section style="border:1px solid #dbe2ec; border-radius:0.82rem; background:#ffffff; padding:0.7rem; color:#94a3b8;">Bagli is emri satiri bulunamadi.</section>`;

            const groupsHtmlInline = groups.length
                ? groups.map((group, index) => {
                    const lines = Array.isArray(group?.lines) ? group.lines : [];
                    const groupRemain = PlanningModule.parseQty(group?.totalRemainingQty, 0);
                    const groupStorageRemain = PlanningModule.parseQty(group?.totalStorageRemainingQty, 0);
                    const groupDone = Math.max(0, PlanningModule.parseQty(group?.itemQty, 0) - groupRemain);
                    return `
                        <section style="margin-top:${index === 0 ? '0' : '0.56rem'}; border:1px solid #dbe2ec; border-radius:0.82rem; background:#ffffff; padding:0.62rem;">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.45rem; flex-wrap:wrap;">
                                <div>
                                    <div style="font-size:0.82rem; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(group?.itemName || '-'))} <span style="font-family:monospace; color:#1d4ed8;">- ${PlanningModule.escapeHtml(String(group?.itemQty || 0))} ADET</span></div>
                                    <div style="font-size:0.7rem; color:#64748b; margin-top:0.08rem;">${PlanningModule.renderLiveCodeButton(String(group?.itemCode || ''))} / ${PlanningModule.escapeHtml(PlanningModule.getItemTypeLabel(group?.itemType || 'MODEL'))}</div>
                                </div>
                                <div style="display:flex; gap:0.3rem; flex-wrap:wrap; justify-content:flex-end;">
                                    <span style="display:inline-flex; border:1px solid #bbf7d0; background:#f0fdf4; color:#047857; border-radius:999px; padding:0.11rem 0.46rem; font-size:0.68rem; font-weight:700;">Biten: ${PlanningModule.escapeHtml(String(groupDone))}</span>
                                    <span style="display:inline-flex; border:1px solid #fed7aa; background:#fff7ed; color:#b45309; border-radius:999px; padding:0.11rem 0.46rem; font-size:0.68rem; font-weight:700;">Kalan: ${PlanningModule.escapeHtml(String(groupRemain))}</span>
                                    <span style="display:inline-flex; border:1px solid #bfdbfe; background:#eff6ff; color:#1d4ed8; border-radius:999px; padding:0.11rem 0.46rem; font-size:0.68rem; font-weight:700;">Depoya alinacak: ${PlanningModule.escapeHtml(String(groupStorageRemain))}</span>
                                </div>
                            </div>
                            <div style="display:grid; gap:0.5rem; margin-top:0.52rem;">
                                ${lines.length ? lines.map((line) => {
                                    const currentStationName = String(line?.currentStationName || '').trim();
                                    const statusBadgeStyle = line?.isStored
                                        ? 'background:#ecfdf5; color:#047857; border:1px solid #a7f3d0;'
                                        : (line?.isFinished
                                            ? 'background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;'
                                            : 'background:#fff7ed; color:#b45309; border:1px solid #fdba74;');
                                    const statusBadgeLabel = line?.isStored
                                        ? 'Depoya alindi'
                                        : (line?.isFinished ? 'Bitti / depoya al bekliyor' : 'Uretimde');
                                    return `
                                        <article style="border:1px solid #e2e8f0; border-radius:0.72rem; background:#f8fafc; padding:0.55rem;">
                                            <div style="display:grid; grid-template-columns:minmax(0,1.3fr) minmax(160px,0.9fr); gap:0.52rem; align-items:start;">
                                                <div style="min-width:0;">
                                                    <div style="font-size:0.68rem; color:#64748b; text-transform:uppercase; font-weight:700;">Is emri</div>
                                                    <div style="font-family:monospace; font-weight:800; color:#1d4ed8; margin-top:0.07rem;">${PlanningModule.escapeHtml(String(line?.workOrderCode || '-'))}</div>
                                                    <div style="margin-top:0.22rem; font-weight:700; color:#1e293b; line-height:1.3;">${PlanningModule.escapeHtml(String(line?.componentName || '-'))}</div>
                                                    <div style="margin-top:0.1rem; font-size:0.72rem; color:#64748b;">${PlanningModule.renderLiveCodeButton(String(line?.componentCode || ''))}</div>
                                                </div>
                                                <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.3rem;">
                                                    <div style="border:1px solid #dbe2ec; border-radius:0.6rem; background:#fff; padding:0.32rem; text-align:center;">
                                                        <div style="font-size:0.63rem; color:#64748b; text-transform:uppercase;">Gereken</div>
                                                        <div style="margin-top:0.08rem; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(line?.targetQty || 0))}</div>
                                                    </div>
                                                    <div style="border:1px solid #bbf7d0; border-radius:0.6rem; background:#f0fdf4; padding:0.32rem; text-align:center;">
                                                        <div style="font-size:0.63rem; color:#047857; text-transform:uppercase;">Biten</div>
                                                        <div style="margin-top:0.08rem; font-weight:800; color:#047857;">${PlanningModule.escapeHtml(String(line?.doneQty || 0))}</div>
                                                    </div>
                                                    <div style="border:1px solid #fed7aa; border-radius:0.6rem; background:#fff7ed; padding:0.32rem; text-align:center;">
                                                        <div style="font-size:0.63rem; color:#b45309; text-transform:uppercase;">Kalan</div>
                                                        <div style="margin-top:0.08rem; font-weight:800; color:#b45309;">${PlanningModule.escapeHtml(String(line?.remainingQty || 0))}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style="display:flex; align-items:center; justify-content:space-between; gap:0.45rem; flex-wrap:wrap; margin-top:0.42rem; padding-top:0.38rem; border-top:1px dashed #dbe2ec;">
                                                <div style="display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap;">
                                                    <span style="font-size:0.68rem; color:#64748b; font-weight:700;">Rota yolculugu</span>
                                                    <span style="display:inline-flex; border:1px solid #bfdbfe; background:#eff6ff; color:#1d4ed8; border-radius:999px; padding:0.1rem 0.42rem; font-size:0.67rem; font-weight:700;">Mevcut: ${PlanningModule.escapeHtml(currentStationName || '-')}</span>
                                                </div>
                                                <span style="display:inline-block; border-radius:999px; padding:0.11rem 0.46rem; font-size:0.67rem; font-weight:700; ${statusBadgeStyle}">${PlanningModule.escapeHtml(statusBadgeLabel)}</span>
                                            </div>
                                            <div style="display:flex; gap:0.3rem; flex-wrap:wrap; margin-top:0.36rem;">${renderInlineRouteChips(line?.steps || [], currentStationName)}</div>
                                        </article>
                                    `;
                                }).join('') : '<div style="border:1px dashed #dbe2ec; border-radius:0.7rem; background:#f8fafc; padding:0.6rem; color:#94a3b8;">Bu parcaya ait takip satiri yok.</div>'}
                            </div>
                        </section>
                    `;
                }).join('')
                : `<section style="border:1px solid #dbe2ec; border-radius:0.82rem; background:#ffffff; padding:0.7rem; color:#94a3b8;">Parca bazli uretim akis kaydi bulunamadi.</section>`;

            return `
                <div style="display:grid; gap:0.66rem;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.45rem; flex-wrap:wrap;">
                        <div>
                            <div style="font-size:1rem; font-weight:900; color:#0f172a;">Uretim Durumu</div>
                            <div style="font-size:0.73rem; color:#64748b; margin-top:0.08rem;">${PlanningModule.escapeHtml(String(source?.demandCode || '-'))} · ${PlanningModule.escapeHtml(PlanningModule.getDemandDisplayName(source))} · ${PlanningModule.escapeHtml(String(PlanningModule.getDemandQtyForDisplay(source)))} adet</div>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:0.48rem;">
                        <div style="border:1px solid #dbe2ec; border-radius:0.72rem; background:#f8fafc; padding:0.52rem;"><div style="font-size:0.67rem; color:#64748b; text-transform:uppercase; font-weight:700;">Talep</div><div style="font-family:monospace; font-weight:800; color:#1d4ed8; margin-top:0.1rem;">${PlanningModule.escapeHtml(demandCodeText)}</div><div style="margin-top:0.22rem;"><span style="display:inline-block; border-radius:999px; padding:0.1rem 0.44rem; font-size:0.66rem; font-weight:700; ${sourceMeta.style}">${PlanningModule.escapeHtml(sourceMeta.label)}</span></div></div>
                        <div style="border:1px solid #dbe2ec; border-radius:0.72rem; background:#f8fafc; padding:0.52rem;"><div style="font-size:0.67rem; color:#64748b; text-transform:uppercase; font-weight:700;">Toplam adet</div><div style="font-weight:900; color:#0f172a; font-size:1.02rem; margin-top:0.08rem;">${PlanningModule.escapeHtml(String(PlanningModule.getDemandQtyForDisplay(source)))}</div><div style="margin-top:0.15rem; font-size:0.68rem; color:#64748b;">Planlanan uretim miktari</div></div>
                        <div style="border:1px solid #dbe2ec; border-radius:0.72rem; background:#f8fafc; padding:0.52rem;"><div style="font-size:0.67rem; color:#64748b; text-transform:uppercase; font-weight:700;">Genel durum</div><div style="margin-top:0.15rem;"><span style="display:inline-block; border-radius:999px; padding:0.1rem 0.44rem; font-size:0.66rem; font-weight:700; ${statusMeta.style}">${PlanningModule.escapeHtml(statusMeta.label)}</span></div><div style="margin-top:0.16rem; font-size:0.68rem; color:#475569;">${PlanningModule.escapeHtml(demandDistributionText)}</div></div>
                        <div style="border:1px solid #dbe2ec; border-radius:0.72rem; background:#f8fafc; padding:0.52rem;"><div style="font-size:0.67rem; color:#64748b; text-transform:uppercase; font-weight:700;">Is emri ozeti</div><div style="font-weight:900; color:#1e40af; font-family:monospace; margin-top:0.08rem;">${PlanningModule.escapeHtml(workOrderText)}</div><div style="margin-top:0.15rem; font-size:0.68rem; color:#64748b;">Bagli is emri dagilimi</div></div>
                    </div>
                    ${workOrdersHtmlInline}
                    <section style="border:1px solid #dbe2ec; border-radius:0.82rem; background:#ffffff; padding:0.62rem;">
                        <div style="font-size:0.84rem; font-weight:800; color:#0f172a; margin-bottom:0.45rem;">Parca Bazli Uretim Akisi</div>
                        <div style="font-size:0.7rem; color:#64748b; margin-bottom:0.5rem;">Her parca icin mevcut istasyon ve rota yolculugu.</div>
                        <div style="display:grid; gap:0.56rem;">${groupsHtmlInline}</div>
                    </section>
                </div>
            `;
        }

        return `
            <div style="display:grid; gap:0.8rem;">
                <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.55rem;">
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Talep</div><div style="font-family:monospace; font-weight:800; color:#1d4ed8;">${PlanningModule.escapeHtml(demandCodeText)}</div><div style="margin-top:0.25rem;"><span style="display:inline-block; border-radius:999px; padding:0.14rem 0.5rem; font-size:0.72rem; font-weight:700; ${sourceMeta.style}">${PlanningModule.escapeHtml(sourceMeta.label)}</span></div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Toplam adet</div><div style="font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(PlanningModule.getDemandQtyForDisplay(source)))}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Durum</div><span style="display:inline-block; margin-top:0.2rem; border-radius:999px; padding:0.14rem 0.5rem; font-size:0.72rem; font-weight:700; ${statusMeta.style}">${PlanningModule.escapeHtml(statusMeta.label)}</span><div style="margin-top:0.28rem; font-size:0.72rem; color:#475569;">Dagilim: <strong>${PlanningModule.escapeHtml(demandDistributionText)}</strong></div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Is emri</div><div style="font-family:monospace; font-weight:800; color:#1e40af;">${PlanningModule.escapeHtml(workOrderText)}</div></div>
                </div>
                ${workOrdersHtml}
                ${groupsHtml}
                ${includeCloseAction ? `<div style="display:flex; justify-content:flex-end;"><button class="btn-sm" onclick="Modal.close()" style="min-width:96px;">kapat</button></div>` : ''}
            </div>
        `;
    },

    openReleasedDemandTrackingModal: (demandId) => {
        const demand = PlanningModule.getDemands().find((row) => String(row?.id || '') === String(demandId || ''));
        if (!demand) return alert('Talep kaydi bulunamadi.');
        const html = PlanningModule.buildReleasedDemandTrackingContentHtml(demand, { includeCloseAction: true });
        Modal.open(`Durum Goruntule - ${PlanningModule.escapeHtml(String(demand?.demandCode || '-'))}`, html, { maxWidth: '1580px' });
    },

    toggleReleasedOrderInlineTrackingPanel: (demandId) => {
        const targetId = String(demandId || '').trim();
        if (!targetId) return;
        const currentId = String(PlanningModule.state.releasedDetailInlineTrackingDemandId || '').trim();
        PlanningModule.state.releasedDetailInlineTrackingDemandId = currentId === targetId ? '' : targetId;
        UI.renderCurrentPage();
    },

    getReleasedWorkspaceData: () => {
        const rows = PlanningModule.getDemands()
            .filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'RELEASED')
            .slice()
            .sort((a, b) => String(b?.released_at || '').localeCompare(String(a?.released_at || '')));
        const sourceFilter = PlanningModule.normalizeReleasedSourceFilter(PlanningModule.state.releasedSourceFilter || 'ALL');
        const completionView = PlanningModule.normalizeReleasedCompletionView(
            PlanningModule.state.releasedCompletionView || (PlanningModule.state.releasedArchiveMode ? 'ARCHIVE' : 'ACTIVE')
        );
        PlanningModule.state.releasedSourceFilter = sourceFilter;
        PlanningModule.state.releasedCompletionView = completionView;
        PlanningModule.state.releasedArchiveMode = completionView === 'ARCHIVE';
        const searchQuery = String(PlanningModule.state.releasedSearchQuery || '');
        const trackingRows = rows.map((demand) => {
            const groups = PlanningModule.getReleasedDemandItemGroups(demand);
            const statusMeta = PlanningModule.getReleasedDemandStatusMeta(groups, demand);
            const sourceMeta = PlanningModule.getReleasedDemandSourceMeta(demand);
            return { demand, groups, statusMeta, sourceMeta };
        });
        const filteredByCompletion = trackingRows.filter((entry) =>
            completionView === 'ARCHIVE' ? !!entry?.statusMeta?.archived : !entry?.statusMeta?.archived
        );
        const filteredBySource = filteredByCompletion.filter((entry) =>
            sourceFilter === 'ALL' ? true : String(entry?.sourceMeta?.type || '').toUpperCase() === sourceFilter
        );
        const visibleRows = filteredBySource.filter((entry) =>
            PlanningModule.matchesReleasedDemandSearch(entry?.demand, searchQuery)
        );
        const archiveRows = trackingRows.filter((entry) => !!entry?.statusMeta?.archived);
        const activeRows = trackingRows.filter((entry) => !entry?.statusMeta?.archived);
        return { sourceFilter, completionView, searchQuery, trackingRows, visibleRows, archiveRows, activeRows };
    },

    getReleasedGroupedRows: (entries) => {
        const safeEntries = Array.isArray(entries) ? entries : [];
        const map = new Map();
        safeEntries.forEach((entry, idx) => {
            const demand = entry?.demand || {};
            const sourceType = String(entry?.sourceMeta?.type || demand?.sourceType || '').trim().toUpperCase();
            const isSales = sourceType === 'SALES_ORDER';
            const sourceOrderId = String(demand?.sourceOrderId || '').trim();
            const sourceOrderNo = String(demand?.sourceOrderNo || '').trim();
            const fallbackRef = String(demand?.demandCode || '-').trim() || '-';
            const safeRef = sourceOrderNo && !PlanningModule.isUuidLike(sourceOrderNo) ? sourceOrderNo : fallbackRef;
            const groupKey = isSales
                ? `sales:${sourceOrderId || safeRef || idx + 1}`
                : `stock:${String(demand?.id || idx + 1)}`;
            if (!map.has(groupKey)) {
                map.set(groupKey, {
                    key: groupKey,
                    sourceType: isSales ? 'SALES_ORDER' : 'STOCK',
                    sourceLabel: isSales ? 'Satis Siparisi' : 'Stok Icin Uretim',
                    reference: safeRef,
                    entries: []
                });
            }
            map.get(groupKey).entries.push(entry);
        });
        return Array.from(map.values()).map((group) => {
            const groupEntries = Array.isArray(group?.entries) ? group.entries : [];
            const workOrderSet = new Set();
            let latestReleasedAt = '';
            let doneCount = 0;
            groupEntries.forEach((entry) => {
                const demand = entry?.demand || {};
                const releasedAt = String(demand?.released_at || '').trim();
                if (releasedAt && releasedAt > latestReleasedAt) latestReleasedAt = releasedAt;
                if (entry?.statusMeta?.done || entry?.statusMeta?.archived) doneCount += 1;
                PlanningModule.getLinkedWorkOrdersForDemand(demand).forEach((order) => {
                    const code = String(order?.workOrderCode || '').trim();
                    if (code) workOrderSet.add(code);
                });
            });
            return {
                ...group,
                entries: groupEntries,
                plnCount: groupEntries.length,
                itemCount: groupEntries.reduce((sum, entry) => sum + PlanningModule.getDemandItems(entry?.demand).length, 0),
                totalQty: groupEntries.reduce((sum, entry) => sum + PlanningModule.getDemandQtyForDisplay(entry?.demand), 0),
                workOrderCount: workOrderSet.size,
                doneCount,
                inProgressCount: Math.max(0, groupEntries.length - doneCount),
                dueRange: PlanningModule.getDateRangeLabel(groupEntries.map((entry) => entry?.demand?.dueDate)),
                latestReleasedAt
            };
        }).sort((a, b) => String(b?.latestReleasedAt || '').localeCompare(String(a?.latestReleasedAt || '')));
    },

    renderReleasedOrdersWorkspace: () => {
        const data = PlanningModule.getReleasedWorkspaceData();
        const groupedRows = PlanningModule.getReleasedGroupedRows(data.visibleRows);
        const totalQty = groupedRows.reduce((sum, row) => sum + PlanningModule.parseQty(row?.totalQty, 0), 0);
        const doneCount = groupedRows.reduce((sum, row) => sum + PlanningModule.parseQty(row?.doneCount, 0), 0);
        const inProgressCount = groupedRows.reduce((sum, row) => sum + PlanningModule.parseQty(row?.inProgressCount, 0), 0);

        const renderCards = () => {
            if (!groupedRows.length) {
                return `<div style="border:1px dashed #cbd5e1; border-radius:0.75rem; padding:1rem; text-align:center; color:#94a3b8; background:#f8fafc;">${data.completionView === 'ARCHIVE' ? 'Arsiv / tamamlanan gorunumunde kayit yok.' : 'Aktif / devam eden gorunumde kayit yok.'}</div>`;
            }
            return groupedRows.map((group) => `
                <div style="border:1px solid #dbe4ee; border-radius:0.85rem; background:#f8fafc; box-shadow:0 1px 2px rgba(15,23,42,0.06); padding:0.75rem; margin-bottom:0.65rem;">
                    <div style="display:grid; grid-template-columns:repeat(8,minmax(0,1fr)); gap:0.6rem; align-items:center;">
                        <div style="min-width:0;">
                            <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Talep / Siparis</div>
                            <div style="margin-top:0.2rem; font-family:monospace; font-weight:800; color:#1d4ed8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${PlanningModule.escapeHtml(group?.reference || '-')}</div>
                        </div>
                        <div style="min-width:0;">
                            <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Kaynak</div>
                            <div style="margin-top:0.2rem;"><span style="display:inline-block; border-radius:999px; padding:0.12rem 0.45rem; font-size:0.72rem; font-weight:700; ${String(group?.sourceType || '').toUpperCase() === 'SALES_ORDER' ? 'background:#fff7ed; border:1px solid #fdba74; color:#9a3412;' : 'background:#ecfdf5; border:1px solid #86efac; color:#166534;'}">${PlanningModule.escapeHtml(group?.sourceLabel || '-')}</span></div>
                        </div>
                        <div style="min-width:0;">
                            <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Kalem</div>
                            <div style="margin-top:0.2rem; text-align:center; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(group?.itemCount || 0))}</div>
                        </div>
                        <div style="min-width:0;">
                            <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Toplam adet</div>
                            <div style="margin-top:0.2rem; text-align:center; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(group?.totalQty || 0))}</div>
                        </div>
                        <div style="min-width:0;">
                            <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Termin</div>
                            <div style="margin-top:0.2rem; font-weight:700; color:#334155;">${PlanningModule.escapeHtml(group?.dueRange || '-')}</div>
                        </div>
                        <div style="min-width:0;">
                            <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Durum</div>
                            <div style="margin-top:0.2rem;"><span style="display:inline-block; border-radius:999px; padding:0.12rem 0.45rem; font-size:0.72rem; font-weight:700; ${group.inProgressCount > 0 ? 'background:#fee2e2; border:1px solid #fca5a5; color:#b91c1c;' : 'background:#ecfdf5; border:1px solid #86efac; color:#047857;'}">${group.inProgressCount > 0 ? `${group.inProgressCount} devam ediyor` : 'Tamamlandi'}</span></div>
                        </div>
                        <div style="min-width:0;">
                            <div style="font-size:0.68rem; text-transform:uppercase; color:#64748b; font-weight:700;">Is emri ozeti</div>
                            <div style="margin-top:0.2rem; font-family:monospace; color:#1e40af; font-weight:700;">WO ${PlanningModule.escapeHtml(String(group?.workOrderCount || 0))}</div>
                        </div>
                        <div style="min-width:0; display:flex; justify-content:flex-end; align-items:flex-end;">
                            <button class="btn-sm" onclick="PlanningModule.openGroupDetailWorkspace('released-orders','${PlanningModule.escapeJsString(String(group?.key || ''))}','released-orders')">detay ac</button>
                        </div>
                    </div>
                </div>
            `).join('');
        };

        return `
            <section style="max-width:1680px; margin:0 auto;">
                <div style="background:rgba(255,255,255,0.72); border:2px solid #94a3b8; border-radius:1.8rem; padding:1.2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.85rem; margin-bottom:0.85rem; flex-wrap:wrap;">
                        <div>
                            <h2 class="page-title" style="margin:0;">${data.completionView === 'ARCHIVE' ? 'planlama / arsiv - tamamlananlar' : 'planlama / is emrine donusenler'}</h2>
                            <div style="font-size:0.85rem; color:#64748b; margin-top:0.2rem;">${data.completionView === 'ARCHIVE' ? 'Tamamlanip depoya alinan talepler arsiv gorunumunde listelenir.' : 'Aktif / devam eden is emirlerine bagli plan talepleri.'}</div>
                        </div>
                        <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                            <button class="btn-sm" onclick="PlanningModule.setReleasedCompletionView('ACTIVE')" style="${data.completionView === 'ACTIVE' ? 'border-color:#0f172a; background:#0f172a; color:#fff; font-weight:700;' : ''}">aktif / devam edenler (${data.activeRows.length})</button>
                            <button class="btn-sm" onclick="PlanningModule.setReleasedCompletionView('ARCHIVE')" style="${data.completionView === 'ARCHIVE' ? 'border-color:#047857; color:#047857; background:#ecfdf5; font-weight:700;' : ''}">arsiv / tamamlananlar (${data.archiveRows.length})</button>
                            <button class="btn-sm" onclick="PlanningModule.openWorkspace('planning-pool')">planlama havuzu</button>
                            <button class="btn-sm" onclick="PlanningModule.openWorkspace('menu')">geri</button>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.65rem; margin-bottom:0.75rem; flex-wrap:wrap;">
                        <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                            <button class="btn-sm" onclick="PlanningModule.setReleasedSourceFilter('ALL')" style="${data.sourceFilter === 'ALL' ? 'border-color:#0f172a; background:#0f172a; color:#fff; font-weight:700;' : ''}">Hepsi</button>
                            <button class="btn-sm" onclick="PlanningModule.setReleasedSourceFilter('SALES_ORDER')" style="${data.sourceFilter === 'SALES_ORDER' ? 'border-color:#c2410c; background:#fff7ed; color:#9a3412; font-weight:700;' : ''}">Satis Siparisi</button>
                            <button class="btn-sm" onclick="PlanningModule.setReleasedSourceFilter('STOCK')" style="${data.sourceFilter === 'STOCK' ? 'border-color:#047857; background:#ecfdf5; color:#047857; font-weight:700;' : ''}">Stok Icin Uretim</button>
                        </div>
                        <div style="display:flex; align-items:center; gap:0.45rem; min-width:320px; flex:1 1 420px; justify-content:flex-end;">
                            <label for="released-demand-search" style="font-size:0.75rem; color:#64748b; font-weight:700;">Arama</label>
                            <input id="released-demand-search" value="${PlanningModule.escapeHtml(data.searchQuery)}" oninput="PlanningModule.setReleasedSearchQuery(this.value)" placeholder="PLN, WO, urun, kod, kaynak tipi ara" style="width:min(520px,100%); height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-weight:600;">
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.65rem; margin-bottom:0.9rem;">
                        <div style="background:#ffffff; border:2px solid #cbd5e1; border-radius:0.8rem; padding:0.65rem 0.75rem;"><div style="font-size:0.72rem; color:#64748b;">Ana satir</div><div style="font-size:1.05rem; font-weight:800; color:#0f172a;">${groupedRows.length}</div></div>
                        <div style="background:#ffffff; border:2px solid #cbd5e1; border-radius:0.8rem; padding:0.65rem 0.75rem;"><div style="font-size:0.72rem; color:#64748b;">Toplam adet</div><div style="font-size:1.05rem; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(totalQty))}</div></div>
                        <div style="background:#ffffff; border:2px solid #cbd5e1; border-radius:0.8rem; padding:0.65rem 0.75rem;"><div style="font-size:0.72rem; color:#64748b;">Tamamlanan grup</div><div style="font-size:1.05rem; font-weight:800; color:#047857;">${doneCount}</div></div>
                        <div style="background:#ffffff; border:2px solid #cbd5e1; border-radius:0.8rem; padding:0.65rem 0.75rem;"><div style="font-size:0.72rem; color:#64748b;">Devam eden grup</div><div style="font-size:1.05rem; font-weight:800; color:#b91c1c;">${inProgressCount}</div></div>
                    </div>
                    <div class="card-table" style="background:#fff; border:1px solid #e2e8f0; border-radius:0.9rem; padding:0.55rem;">
                        ${renderCards()}
                    </div>
                </div>
            </section>
        `;
    },

    renderGroupDetailWorkspace: () => {
        const scope = String(PlanningModule.state.planningDetailScope || '').trim();
        const groupKey = String(PlanningModule.state.planningDetailGroupKey || '').trim();
        const backView = String(PlanningModule.state.planningDetailBackView || 'menu').trim() || 'menu';
        const renderEmpty = (msg) => `
            <section style="max-width:1680px; margin:0 auto;">
                <div style="background:rgba(255,255,255,0.72); border:1px solid #cbd5e1; border-radius:1.4rem; padding:1rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; margin-bottom:0.75rem;">
                        <h2 class="page-title" style="margin:0;">planlama / detay</h2>
                        <button class="btn-sm" onclick="PlanningModule.backFromGroupDetailWorkspace()">geri</button>
                    </div>
                    <div style="border:1px dashed #cbd5e1; border-radius:0.8rem; padding:1rem; color:#64748b;">${PlanningModule.escapeHtml(msg)}</div>
                </div>
            </section>
        `;

        const buildHeader = (summary) => `
            <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.5rem;">
                <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;">
                    <div style="font-size:0.72rem; color:#64748b;">Siparis / Talep referansi</div>
                    <div style="font-family:monospace; font-weight:800; color:#1d4ed8;">${PlanningModule.escapeHtml(summary.reference || '-')}</div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;">
                    <div style="font-size:0.72rem; color:#64748b;">Kaynak tipi</div>
                    <div style="font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(summary.sourceLabel || '-')}</div>
                    <div style="font-size:0.72rem; color:#64748b; margin-top:0.2rem;">Musteri ref: ${PlanningModule.escapeHtml(summary.customerRef || '-')}</div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;">
                    <div style="font-size:0.72rem; color:#64748b;">Kalem / adet</div>
                    <div style="font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(summary.itemCount || 0))} / ${PlanningModule.escapeHtml(String(summary.totalQty || 0))}</div>
                    <div style="font-size:0.72rem; color:#64748b; margin-top:0.2rem;">Termin: ${PlanningModule.escapeHtml(summary.dueRange || '-')}</div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;">
                    <div style="font-size:0.72rem; color:#64748b;">Planlama / Is emri ozeti</div>
                    <div style="font-weight:800; color:#0f172a;">WO: ${PlanningModule.escapeHtml(String(summary.workOrderCount || 0))}</div>
                    <div style="font-size:0.72rem; color:#64748b; margin-top:0.2rem;">Durum: ${PlanningModule.escapeHtml(summary.statusText || '-')}</div>
                </div>
            </div>
        `;

        const shellStart = (title, summary) => `
            <section style="max-width:1880px; margin:0 auto;">
                <div style="background:rgba(255,255,255,0.72); border:1px solid #cbd5e1; border-radius:1.4rem; padding:1rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; margin-bottom:0.75rem;">
                        <h2 class="page-title" style="margin:0;">${PlanningModule.escapeHtml(title)}</h2>
                        <button class="btn-sm" onclick="PlanningModule.backFromGroupDetailWorkspace()">geri</button>
                    </div>
                    ${buildHeader(summary)}
                    <div style="margin-top:0.75rem;">
        `;
        const shellEnd = `
                    </div>
                </div>
            </section>
        `;

        if (scope === 'sales-demand') {
            const rows = PlanningModule.getSalesDemandRows();
            PlanningModule.state.salesDemandRowsByKey = {};
            rows.forEach((row) => {
                const key = String(row?.key || '').trim();
                if (key) PlanningModule.state.salesDemandRowsByKey[key] = row;
            });
            const groups = PlanningModule.getSalesDemandGroupRows(rows);
            const group = groups.find((g) => String(g?.key || '') === groupKey);
            if (!group) return renderEmpty('Detay kaydi bulunamadi.');
            const summary = {
                reference: group.safeRef,
                sourceLabel: 'Satis Siparisi',
                customerRef: '-',
                itemCount: group.itemCount,
                totalQty: group.totalQty,
                dueRange: group.dueRange,
                workOrderCount: 0,
                statusText: group.statusLabel
            };
            const body = `
                <div class="card-table">
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                                <th style="padding:0.48rem; text-align:left;">Urun</th>
                                <th style="padding:0.48rem; text-align:left;">Kod</th>
                                <th style="padding:0.48rem; text-align:center;">Adet</th>
                                <th style="padding:0.48rem; text-align:left;">Termin</th>
                                <th style="padding:0.48rem; text-align:left;">Planlama havuzu</th>
                                <th style="padding:0.48rem; text-align:left;">Is emri</th>
                                <th style="padding:0.48rem; text-align:right;">Islem</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(group.rows || []).map((line) => `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:0.48rem; font-weight:700; color:#334155;">${PlanningModule.escapeHtml(line?.productName || '-')}</td>
                                    <td style="padding:0.48rem; font-family:monospace;">${PlanningModule.escapeHtml(line?.code || '-')}</td>
                                    <td style="padding:0.48rem; text-align:center; font-weight:800;">${PlanningModule.escapeHtml(String(line?.qty || 0))}</td>
                                    <td style="padding:0.48rem;">${PlanningModule.escapeHtml(line?.dueDate || '-')}</td>
                                    <td style="padding:0.48rem; color:${line?.alreadySent ? '#166534' : '#1d4ed8'}; font-weight:700;">${line?.alreadySent ? 'Gonderildi' : 'Bekliyor'}</td>
                                    <td style="padding:0.48rem; font-family:monospace; color:#64748b;">-</td>
                                    <td style="padding:0.48rem; text-align:right;">
                                        <div style="display:inline-flex; gap:0.3rem; flex-wrap:wrap; justify-content:flex-end;">
                                            <button class="btn-sm" onclick="PlanningModule.openSalesDemandDetailModal('${PlanningModule.escapeJsString(line?.key || '')}')">goruntule</button>
                                            <button class="btn-sm" onclick="PlanningModule.sendSalesOrderLineToPlanningPool('${PlanningModule.escapeJsString(line?.key || '')}')" ${line?.canSend ? '' : 'disabled'} style="${line?.canSend ? '' : 'opacity:0.45; cursor:not-allowed;'}">planlamaya gonder</button>
                                            <button class="btn-sm" onclick="PlanningModule.openSalesDemandLineTracking('${PlanningModule.escapeJsString(line?.key || '')}')">nerede / izle</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            return shellStart('planlama / siparisten gelen talepler - detay', summary) + body + shellEnd;
        }

        if (scope === 'planning-pool-open') {
            const groups = PlanningModule.getPlanningPoolDemandGroups(PlanningModule.getPlanningPoolOpenRows());
            const group = groups.find((g) => String(g?.key || '') === groupKey);
            if (!group) return renderEmpty('Detay kaydi bulunamadi.');
            const rows = Array.isArray(group?.rows) ? group.rows : [];
            const groupReleaseState = PlanningModule.getPlanningPoolOpenGroupReleaseState(rows);
            const canReleaseGroup = !!groupReleaseState.allDraftSaved;
            const workOrderSet = new Set();
            rows.forEach((row) => PlanningModule.getLinkedWorkOrdersForDemand(row).forEach((order) => {
                const code = String(order?.workOrderCode || '').trim();
                if (code) workOrderSet.add(code);
            }));
            const summary = {
                reference: group.reference,
                sourceLabel: group.sourceTypeLabel,
                customerRef: String(rows[0]?.sourceCustomerRefId || '-'),
                itemCount: group.itemCount,
                totalQty: group.totalQty,
                dueRange: group.dueRange,
                workOrderCount: workOrderSet.size,
                statusText: 'Planlama Havuzunda'
            };
            const body = `
                <div class="card-table">
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                                <th style="padding:0.48rem; text-align:left;">PLN</th>
                                <th style="padding:0.48rem; text-align:left;">Urun / Kod</th>
                                <th style="padding:0.48rem; text-align:center;">Adet</th>
                                <th style="padding:0.48rem; text-align:left;">Termin</th>
                                <th style="padding:0.48rem; text-align:left;">Is emri durumu</th>
                                <th style="padding:0.48rem; text-align:left;">Rota / atolye</th>
                                <th style="padding:0.48rem; text-align:right;">Islem</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map((row) => {
                                const demandId = String(row?.id || '').trim();
                                const groupsReleased = PlanningModule.getReleasedDemandItemGroups(row);
                                const routeText = groupsReleased.flatMap((g) => Array.isArray(g?.activeStations) ? g.activeStations : []).filter(Boolean).join(' | ') || 'Planlama';
                                const isExpanded = String(PlanningModule.state.planningPoolExpandedDemandId || '') === demandId;
                                const isPlanSaved = PlanningModule.isDemandPlanDraftSaved(row);
                                const workOrderText = PlanningModule.getReleasedDemandWorkOrderText(row);
                                const statusText = isPlanSaved && (!workOrderText || workOrderText === '-')
                                    ? 'Plan kayitli'
                                    : workOrderText;
                                return `
                                    <tr style="border-bottom:1px solid #f1f5f9;">
                                        <td style="padding:0.48rem; font-family:monospace; font-weight:800; color:#1d4ed8;">${PlanningModule.escapeHtml(String(row?.demandCode || '-'))}</td>
                                        <td style="padding:0.48rem;"><div style="font-weight:700; color:#334155;">${PlanningModule.escapeHtml(PlanningModule.getDemandDisplayName(row))}</div><div style="font-size:0.74rem; color:#64748b; font-family:monospace;">${PlanningModule.escapeHtml(PlanningModule.getDemandDisplayCode(row))}</div></td>
                                        <td style="padding:0.48rem; text-align:center; font-weight:800;">${PlanningModule.escapeHtml(String(row?.qty || 0))}</td>
                                        <td style="padding:0.48rem;">${PlanningModule.escapeHtml(String(row?.dueDate || '-'))}</td>
                                        <td style="padding:0.48rem; font-family:monospace;">${PlanningModule.escapeHtml(statusText || '-')}</td>
                                        <td style="padding:0.48rem;">${PlanningModule.escapeHtml(routeText)}</td>
                                        <td style="padding:0.48rem; text-align:right;">
                                            <div style="display:inline-flex; gap:0.3rem; flex-wrap:wrap; justify-content:flex-end;">
                                                <button class="btn-sm" onclick="PlanningModule.openDemandView('${PlanningModule.escapeJsString(demandId)}')">goruntule</button>
                                                <button class="btn-sm" onclick="PlanningModule.togglePlanningPoolExpand('${PlanningModule.escapeJsString(demandId)}')" style="${isExpanded ? 'border-color:#0f172a; background:#0f172a; color:#fff;' : 'border-color:#cbd5e1;'}">${isExpanded ? 'planlamayi kapat' : 'planla'}</button>
                                                <button class="btn-sm" onclick="PlanningModule.openDemandItemTrackingModal('${PlanningModule.escapeJsString(demandId)}','','')">nerede / izle</button>
                                            </div>
                                        </td>
                                    </tr>
                                    ${isExpanded ? `<tr><td colspan="7" style="padding:0.55rem 0.48rem 0.75rem 0.48rem; background:#f8fbff;">${PlanningModule.renderPlanningPoolDemandPlannerInline(row)}</td></tr>` : ''}
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                <div style="display:flex; justify-content:flex-end; margin-top:0.75rem;">
                    <button class="btn-primary" onclick="PlanningModule.releasePlanningPoolOpenGroupFromDetail()" ${canReleaseGroup ? '' : 'disabled'} style="${canReleaseGroup ? '' : 'opacity:0.45; cursor:not-allowed;'}">is emrine donustur</button>
                </div>
                ${canReleaseGroup ? '' : '<div style="margin-top:0.45rem; border:1px solid #bfdbfe; background:#eff6ff; color:#1e3a8a; border-radius:0.55rem; padding:0.45rem 0.6rem; font-size:0.76rem; font-weight:600;">Tum satirlar planlanmadan is emrine donusturulemez.</div>'}
            `;
            return shellStart('planlama havuzu - detay', summary) + body + shellEnd;
        }

        if (scope === 'planning-pool-released' || scope === 'released-orders') {
            const entries = scope === 'released-orders'
                ? PlanningModule.getReleasedWorkspaceData().visibleRows
                : PlanningModule.getPlanningPoolReleasedVisibleRows().map((row) => {
                    const groups = PlanningModule.getReleasedDemandItemGroups(row);
                    const statusMeta = PlanningModule.getReleasedDemandStatusMeta(groups, row);
                    const sourceMeta = PlanningModule.getReleasedDemandSourceMeta(row);
                    return { demand: row, groups, statusMeta, sourceMeta };
                });
            const groups = PlanningModule.getReleasedGroupedRows(entries);
            const group = groups.find((g) => String(g?.key || '') === groupKey);
            if (!group) return renderEmpty('Detay kaydi bulunamadi.');
            const summary = {
                reference: group.reference,
                sourceLabel: group.sourceLabel,
                customerRef: String(group?.entries?.[0]?.demand?.sourceCustomerRefId || '-'),
                itemCount: group.itemCount,
                totalQty: group.totalQty,
                dueRange: group.dueRange,
                workOrderCount: group.workOrderCount,
                statusText: group.inProgressCount > 0 ? `${group.inProgressCount} devam ediyor` : 'Tamamlandi'
            };
            const inlineTrackingDemandId = String(PlanningModule.state.releasedDetailInlineTrackingDemandId || '').trim();
            const body = scope === 'released-orders'
                ? `
                    <div style="display:grid; gap:0.62rem;">
                        ${(group.entries || []).map((entry) => {
                            const demand = entry?.demand || {};
                            const demandId = String(demand?.id || '').trim();
                            const statusMeta = entry?.statusMeta || {};
                            const routeText = (entry?.groups || []).flatMap((g) => Array.isArray(g?.activeStations) ? g.activeStations : []).filter(Boolean).join(' | ') || '-';
                            const canReplan = PlanningModule.canReplanRemainingRows(demand);
                            const isInlineOpen = inlineTrackingDemandId === demandId;
                            return `
                                <article style="border:1px solid #dbe2ec; border-radius:0.82rem; background:#ffffff; padding:0.62rem 0.68rem; box-shadow:0 1px 3px rgba(15,23,42,0.05);">
                                    <div style="display:flex; justify-content:space-between; gap:0.55rem; flex-wrap:wrap; align-items:flex-start;">
                                        <div style="font-size:0.7rem; color:#64748b; text-transform:uppercase; font-weight:700; letter-spacing:0.02em;">PLN</div>
                                        <div style="font-family:monospace; font-weight:900; color:#1d4ed8; font-size:0.8rem;">${PlanningModule.escapeHtml(String(demand?.demandCode || '-'))}</div>
                                    </div>
                                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(155px,1fr)); gap:0.5rem; margin-top:0.45rem;">
                                        <div style="min-width:0;">
                                            <div style="font-size:0.69rem; color:#64748b; text-transform:uppercase; font-weight:700;">Urun / Kod</div>
                                            <div style="margin-top:0.14rem; font-weight:700; color:#334155; line-height:1.3;">${PlanningModule.escapeHtml(PlanningModule.getDemandDisplayName(demand))}</div>
                                            <div style="font-size:0.74rem; color:#64748b; font-family:monospace; margin-top:0.1rem; word-break:break-word;">${PlanningModule.escapeHtml(PlanningModule.getDemandDisplayCode(demand))}</div>
                                        </div>
                                        <div>
                                            <div style="font-size:0.69rem; color:#64748b; text-transform:uppercase; font-weight:700;">Adet</div>
                                            <div style="margin-top:0.14rem; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(String(PlanningModule.getDemandQtyForDisplay(demand)))}</div>
                                        </div>
                                        <div style="min-width:0;">
                                            <div style="font-size:0.69rem; color:#64748b; text-transform:uppercase; font-weight:700;">Is emri</div>
                                            <div style="margin-top:0.14rem; font-family:monospace; color:#1e40af; font-weight:700; word-break:break-word;">${PlanningModule.escapeHtml(PlanningModule.getReleasedDemandWorkOrderText(demand))}</div>
                                        </div>
                                        <div>
                                            <div style="font-size:0.69rem; color:#64748b; text-transform:uppercase; font-weight:700;">Durum</div>
                                            <div style="margin-top:0.14rem;"><span style="display:inline-block; border-radius:999px; padding:0.12rem 0.45rem; font-size:0.7rem; font-weight:700; ${statusMeta.style || ''}">${PlanningModule.escapeHtml(statusMeta.label || '-')}</span></div>
                                        </div>
                                        <div style="min-width:0;">
                                            <div style="font-size:0.69rem; color:#64748b; text-transform:uppercase; font-weight:700;">Rota / atolye</div>
                                            <div style="margin-top:0.14rem; color:#334155; font-weight:700; line-height:1.3; word-break:break-word;">${PlanningModule.escapeHtml(routeText)}</div>
                                        </div>
                                    </div>
                                    <div style="display:flex; justify-content:flex-end; gap:0.3rem; flex-wrap:wrap; margin-top:0.52rem; padding-top:0.45rem; border-top:1px dashed #e2e8f0;">
                                        <button class="btn-sm" style="min-height:38px; padding:0.42rem 0.82rem; font-size:0.84rem; font-weight:800; line-height:1.2; white-space:normal; text-align:center; max-width:220px; ${isInlineOpen ? 'border-color:#1d4ed8; background:#eff6ff; color:#1d4ed8;' : ''}" onclick="PlanningModule.toggleReleasedOrderInlineTrackingPanel('${PlanningModule.escapeJsString(demandId)}')">Uretim Durumu Goruntule</button>
                                        ${canReplan ? `<button class="btn-sm" style="border-color:#1d4ed8; background:#eff6ff; color:#1d4ed8; font-weight:700;" onclick="PlanningModule.reopenDemandRemainingRows('${PlanningModule.escapeJsString(demandId)}')">kalanlari planla</button>` : ''}
                                    </div>
                                    ${isInlineOpen ? `<div style="margin-top:0.6rem; border:1px solid #dbe2ec; background:#f8fafc; border-radius:0.85rem; padding:0.68rem; overflow:auto;">${PlanningModule.buildReleasedDemandTrackingContentHtml(demand, { includeCloseAction: false, variant: 'inline' })}</div>` : ''}
                                </article>
                            `;
                        }).join('')}
                    </div>
                `
                : `
                    <div class="card-table">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                                    <th style="padding:0.48rem; text-align:left;">PLN</th>
                                    <th style="padding:0.48rem; text-align:left;">Urun / Kod</th>
                                    <th style="padding:0.48rem; text-align:center;">Adet</th>
                                    <th style="padding:0.48rem; text-align:left;">Is emri</th>
                                    <th style="padding:0.48rem; text-align:left;">Durum</th>
                                    <th style="padding:0.48rem; text-align:left;">Rota / atolye</th>
                                    <th style="padding:0.48rem; text-align:right;">Islem</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(group.entries || []).map((entry) => {
                                    const demand = entry?.demand || {};
                                    const demandId = String(demand?.id || '').trim();
                                    const statusMeta = entry?.statusMeta || {};
                                    const routeText = (entry?.groups || []).flatMap((g) => Array.isArray(g?.activeStations) ? g.activeStations : []).filter(Boolean).join(' | ') || '-';
                                    const canReplan = PlanningModule.canReplanRemainingRows(demand);
                                    return `
                                        <tr style="border-bottom:1px solid #f1f5f9;">
                                            <td style="padding:0.48rem; font-family:monospace; font-weight:800; color:#1d4ed8;">${PlanningModule.escapeHtml(String(demand?.demandCode || '-'))}</td>
                                            <td style="padding:0.48rem;"><div style="font-weight:700; color:#334155;">${PlanningModule.escapeHtml(PlanningModule.getDemandDisplayName(demand))}</div><div style="font-size:0.74rem; color:#64748b; font-family:monospace;">${PlanningModule.escapeHtml(PlanningModule.getDemandDisplayCode(demand))}</div></td>
                                            <td style="padding:0.48rem; text-align:center; font-weight:800;">${PlanningModule.escapeHtml(String(PlanningModule.getDemandQtyForDisplay(demand)))}</td>
                                            <td style="padding:0.48rem; font-family:monospace; color:#1e40af; font-weight:700;">${PlanningModule.escapeHtml(PlanningModule.getReleasedDemandWorkOrderText(demand))}</td>
                                            <td style="padding:0.48rem;"><span style="display:inline-block; border-radius:999px; padding:0.12rem 0.45rem; font-size:0.7rem; font-weight:700; ${statusMeta.style || ''}">${PlanningModule.escapeHtml(statusMeta.label || '-')}</span></td>
                                            <td style="padding:0.48rem;">${PlanningModule.escapeHtml(routeText)}</td>
                                            <td style="padding:0.48rem; text-align:right;">
                                                <div style="display:inline-flex; gap:0.3rem; flex-wrap:wrap; justify-content:flex-end;">
                                                    <button class="btn-sm" onclick="PlanningModule.openReleasedDemandTrackingModal('${PlanningModule.escapeJsString(demandId)}')">goruntule</button>
                                                    ${canReplan ? `<button class="btn-sm" style="border-color:#1d4ed8; background:#eff6ff; color:#1d4ed8; font-weight:700;" onclick="PlanningModule.reopenDemandRemainingRows('${PlanningModule.escapeJsString(demandId)}')">kalanlari planla</button>` : ''}
                                                    <button class="btn-sm" onclick="PlanningModule.openDemandItemTrackingModal('${PlanningModule.escapeJsString(demandId)}','','')">nerede / izle</button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            const title = scope === 'released-orders'
                ? 'planlama / is emrine donusenler - detay'
                : 'planlama havuzu / donusenler - detay';
            return shellStart(title, summary) + body + shellEnd;
        }

        return renderEmpty(`Detay kapsamı tanimli degil: ${scope || '-'}. Geri donup tekrar deneyin.`);
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
        if (viewId === 'planning-pool' || viewId === 'released-orders') {
            const cleanupSummary = PlanningModule.cleanupOrphanSalesOrderRecordsForDemo();
            if (Number(cleanupSummary?.removedDemandCount || 0) > 0) {
                PlanningModule.schedulePlanningDemandCleanupSave();
            }
        }
        if (viewId === 'menu') container.innerHTML = PlanningModule.renderMenuLayout();
        else if (viewId === 'sales-demand') container.innerHTML = PlanningModule.renderSalesDemandWorkspace();
        else if (viewId === 'stock-production') container.innerHTML = PlanningModule.renderStockProductionWorkspace();
        else if (viewId === 'planning-pool') container.innerHTML = PlanningModule.renderPlanningPoolWorkspace();
        else if (viewId === 'released-orders') container.innerHTML = PlanningModule.renderReleasedOrdersWorkspace();
        else if (viewId === 'group-detail') container.innerHTML = PlanningModule.renderGroupDetailWorkspace();
        else container.innerHTML = PlanningModule.renderBlueprintWorkspace(viewId);
        if (window.lucide) window.lucide.createIcons();
    }
};






