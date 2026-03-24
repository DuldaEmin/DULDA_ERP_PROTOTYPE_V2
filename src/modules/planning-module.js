const PlanningModule = {
    state: {
        workspaceView: 'menu',
        stockDraftEditingId: '',
        stockDraftSourceKind: 'MODEL',
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
        PlanningModule.state.stockDraftEditingId = '';
        PlanningModule.state.stockDraftSourceKind = 'MODEL';
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
        if (PlanningModule.state.workspaceView === 'stock-production' && !PlanningModule.state.stockDraftDueDate) {
            PlanningModule.resetStockDraft();
        }
        UI.renderCurrentPage();
    },

    openItemPicker: (kind) => {
        const raw = String(kind || '').trim().toLowerCase();
        const normalized = raw === 'component' ? 'component' : (raw === 'semi' ? 'semi' : 'model');
        PlanningModule.state.stockDraftSourceKind = normalized === 'component' ? 'COMPONENT' : (normalized === 'semi' ? 'SEMI' : 'MODEL');
        ProductLibraryModule.openPlanningPicker(normalized);
    },

    applyPickedModel: (id) => {
        PlanningModule.state.stockDraftSourceKind = 'MODEL';
        PlanningModule.state.stockDraftVariantId = String(id || '');
        PlanningModule.state.stockDraftComponentId = '';
        PlanningModule.state.stockDraftSemiFinishedId = '';
        Router.navigate('planlama', { fromBack: true });
        PlanningModule.openWorkspace('stock-production');
    },

    applyPickedComponent: (id) => {
        PlanningModule.state.stockDraftSourceKind = 'COMPONENT';
        PlanningModule.state.stockDraftComponentId = String(id || '');
        PlanningModule.state.stockDraftVariantId = '';
        PlanningModule.state.stockDraftSemiFinishedId = '';
        Router.navigate('planlama', { fromBack: true });
        PlanningModule.openWorkspace('stock-production');
    },

    applyPickedSemiFinished: (id) => {
        PlanningModule.state.stockDraftSourceKind = 'SEMI';
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
        PlanningModule.state.stockDraftEditingId = String(row.id || '');
        const itemType = String(row.itemType || 'MODEL').toUpperCase();
        PlanningModule.state.stockDraftSourceKind = ['MODEL', 'COMPONENT', 'SEMI'].includes(itemType) ? itemType : 'MODEL';
        PlanningModule.state.stockDraftVariantId = String(row.variantId || '');
        PlanningModule.state.stockDraftComponentId = String(row.componentId || '');
        PlanningModule.state.stockDraftSemiFinishedId = String(row.semiFinishedId || '');
        PlanningModule.state.stockDraftQty = String(row.qty || '10');
        PlanningModule.state.stockDraftDueDate = String(row.dueDate || '');
        PlanningModule.state.stockDraftPriority = PlanningModule.getPriorityValue(row.priority || 'NORMAL');
        PlanningModule.state.stockDraftNote = String(row.note || '');
        PlanningModule.openWorkspace('stock-production');
    },

    saveStockDemand: async (releaseNow = false) => {
        PlanningModule.ensureData();
        const sourceKindRaw = String(PlanningModule.state.stockDraftSourceKind || 'MODEL').toUpperCase();
        const sourceKind = ['MODEL', 'COMPONENT', 'SEMI'].includes(sourceKindRaw) ? sourceKindRaw : 'MODEL';
        const variant = sourceKind === 'MODEL' ? PlanningModule.findVariantById(PlanningModule.state.stockDraftVariantId) : null;
        const component = sourceKind === 'COMPONENT' ? PlanningModule.findComponentById(PlanningModule.state.stockDraftComponentId) : null;
        const semiFinished = sourceKind === 'SEMI' ? PlanningModule.findSemiFinishedById(PlanningModule.state.stockDraftSemiFinishedId) : null;
        const qty = Number(PlanningModule.state.stockDraftQty || 0);
        if (sourceKind === 'MODEL' && !variant) return alert('Lutfen urun varyanti seciniz.');
        if (sourceKind === 'COMPONENT' && !component) return alert('Lutfen parca/bilesen seciniz.');
        if (sourceKind === 'SEMI' && !semiFinished) return alert('Lutfen yari mamul seciniz.');
        if (!Number.isFinite(qty) || qty <= 0) return alert('Uretim adedi 0 dan buyuk olmali.');
        const montageCard = sourceKind === 'MODEL' ? PlanningModule.findMontageCardForVariant(variant) : null;
        if (sourceKind === 'MODEL' && !montageCard?.id) return alert('Bu varyanta bagli montaj karti bulunamadi.');

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

        demand.itemType = sourceKind;
        demand.variantId = sourceKind === 'MODEL' ? String(variant.id || '') : '';
        demand.componentId = sourceKind === 'COMPONENT' ? String(component.id || '') : '';
        demand.semiFinishedId = sourceKind === 'SEMI' ? String(semiFinished.id || '') : '';
        demand.familyId = sourceKind === 'MODEL' ? String(variant.familyId || '') : '';
        demand.variantCode = sourceKind === 'MODEL' ? String(variant.variantCode || '') : '';
        demand.componentCode = sourceKind === 'COMPONENT' ? String(component.code || '') : '';
        demand.semiFinishedCode = sourceKind === 'SEMI' ? String(semiFinished.code || '') : '';
        demand.productGroup = sourceKind === 'MODEL'
            ? String(variant.productGroup || '')
            : (sourceKind === 'COMPONENT' ? String(component.group || '') : String(semiFinished.group || ''));
        demand.productName = sourceKind === 'MODEL'
            ? String(variant.productName || '')
            : (sourceKind === 'COMPONENT' ? String(component.name || '') : String(semiFinished.name || ''));
        demand.productCode = sourceKind === 'MODEL'
            ? String(montageCard.productCode || montageCard.cardCode || '')
            : (sourceKind === 'COMPONENT' ? String(component.code || '') : String(semiFinished.code || ''));
        demand.montageCardId = sourceKind === 'MODEL' ? String(montageCard.id || '') : '';
        demand.montageCardCode = sourceKind === 'MODEL' ? String(montageCard.cardCode || '') : '';
        demand.qty = Number(qty);
        demand.dueDate = String(PlanningModule.state.stockDraftDueDate || '').trim();
        demand.priority = PlanningModule.getPriorityValue(PlanningModule.state.stockDraftPriority || 'NORMAL');
        demand.note = String(PlanningModule.state.stockDraftNote || '').trim();
        demand.status = 'OPEN';
        demand.updated_at = now;

        if (!releaseNow) {
            await DB.save();
            PlanningModule.resetStockDraft();
            PlanningModule.openWorkspace('planning-pool');
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
        const itemTypeRaw = String(demand?.itemType || 'MODEL').toUpperCase();
        const itemType = ['MODEL', 'COMPONENT', 'SEMI'].includes(itemTypeRaw) ? itemTypeRaw : 'MODEL';
        const order = (itemType === 'COMPONENT' || itemType === 'SEMI')
            ? UnitModule.createWorkOrderFromComponentCard({
                componentId: itemType === 'SEMI' ? String(demand.semiFinishedId || '') : String(demand.componentId || ''),
                componentLibrary: itemType === 'SEMI' ? 'SEMI' : 'PART',
                lotQty: Number(demand.qty || 0),
                dueDate: String(demand.dueDate || ''),
                priority: PlanningModule.getPriorityValue(demand.priority || 'NORMAL'),
                note: String(demand.note || '').trim(),
                sourceType: itemType === 'SEMI' ? 'PLAN_STOCK_SEMI' : 'PLAN_STOCK_COMPONENT',
                sourceId: String(demand.id || ''),
                sourceCode: String(demand.demandCode || '')
            })
            : UnitModule.createWorkOrderFromMontageCard({
                montageId: String(demand.montageCardId || ''),
                lotQty: Number(demand.qty || 0),
                dueDate: String(demand.dueDate || ''),
                priority: PlanningModule.getPriorityValue(demand.priority || 'NORMAL'),
                note: String(demand.note || '').trim(),
                sourceType: 'PLAN_STOCK_MODEL',
                sourceId: String(demand.id || ''),
                sourceCode: String(demand.demandCode || '')
            });
        const now = new Date().toISOString();
        demand.status = 'RELEASED';
        demand.workOrderId = String(order.id || '');
        demand.workOrderCode = String(order.workOrderCode || '');
        demand.released_at = now;
        demand.updated_at = now;
        return order;
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
        return 'Urun Modeli';
    },

    renderDemandRows: (rows, emptyMessage) => {
        if (!rows.length) {
            return `<tr><td colspan="8" style="padding:1rem; text-align:center; color:#94a3b8;">${PlanningModule.escapeHtml(emptyMessage || 'Kayit yok.')}</td></tr>`;
        }
        return rows.map((row) => {
            const released = String(row?.status || 'OPEN').toUpperCase() === 'RELEASED';
            return `
                <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:0.6rem;"><div style="font-family:monospace; font-weight:700; color:#1d4ed8;">${PlanningModule.escapeHtml(row?.demandCode || '-')}</div><div style="font-size:0.75rem; color:#64748b;">${PlanningModule.escapeHtml(row?.sourceLabel || 'Stok Uretimi')}</div></td>
                    <td style="padding:0.6rem;"><div style="font-weight:700; color:#334155;">${PlanningModule.escapeHtml(row?.productName || '-')}</div><div style="font-size:0.75rem; color:#64748b;">${PlanningModule.escapeHtml(PlanningModule.getItemTypeLabel(row?.itemType || 'MODEL'))}</div><div style="font-size:0.75rem; color:#64748b; font-family:monospace;">${PlanningModule.escapeHtml(row?.variantCode || row?.componentCode || row?.semiFinishedCode || '-')}</div></td>
                    <td style="padding:0.6rem; font-family:monospace;">${PlanningModule.escapeHtml(row?.productCode || '-')}</td>
                    <td style="padding:0.6rem; text-align:center; font-weight:800;">${PlanningModule.escapeHtml(String(row?.qty || 0))}</td>
                    <td style="padding:0.6rem;"><div>${PlanningModule.escapeHtml(row?.dueDate || '-')}</div><div style="margin-top:0.25rem;">${PlanningModule.renderPriorityBadge(row?.priority || 'NORMAL')}</div></td>
                    <td style="padding:0.6rem;"><span style="display:inline-block; border-radius:999px; padding:0.14rem 0.5rem; font-size:0.72rem; font-weight:700; ${PlanningModule.getStatusStyle(row?.status || 'OPEN')}">${PlanningModule.escapeHtml(PlanningModule.getStatusLabel(row?.status || 'OPEN'))}</span></td>
                    <td style="padding:0.6rem; font-family:monospace;">${PlanningModule.escapeHtml(row?.workOrderCode || '-')}</td>
                    <td style="padding:0.6rem; text-align:right;"><div style="display:inline-flex; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end;">${released ? '' : `<button class="btn-sm" onclick="PlanningModule.startDemandEdit('${PlanningModule.escapeHtml(row?.id || '')}')">duzenle</button>`}${released ? '' : `<button class="btn-sm" onclick="PlanningModule.releaseDemand('${PlanningModule.escapeHtml(row?.id || '')}')" style="border-color:#bfdbfe; color:#1d4ed8; background:#eff6ff;">is emrine cevir</button>`}${released ? '' : `<button class="btn-sm" onclick="PlanningModule.deleteDemand('${PlanningModule.escapeHtml(row?.id || '')}')">sil</button>`}</div></td>
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
        const variants = PlanningModule.getVariants().filter((row) => PlanningModule.findMontageCardForVariant(row));
        const components = PlanningModule.getComponents();
        const semiRows = PlanningModule.getSemiFinished();
        if (!PlanningModule.state.stockDraftDueDate) PlanningModule.resetStockDraft();
        const sourceKindRaw = String(PlanningModule.state.stockDraftSourceKind || 'MODEL').toUpperCase();
        const sourceKind = ['MODEL', 'COMPONENT', 'SEMI'].includes(sourceKindRaw) ? sourceKindRaw : 'MODEL';
        if (sourceKind === 'MODEL' && !PlanningModule.state.stockDraftVariantId && variants[0]?.id) PlanningModule.state.stockDraftVariantId = String(variants[0].id);
        if (sourceKind === 'COMPONENT' && !PlanningModule.state.stockDraftComponentId && components[0]?.id) PlanningModule.state.stockDraftComponentId = String(components[0].id);
        if (sourceKind === 'SEMI' && !PlanningModule.state.stockDraftSemiFinishedId && semiRows[0]?.id) PlanningModule.state.stockDraftSemiFinishedId = String(semiRows[0].id);
        const selectedVariant = sourceKind === 'MODEL' ? PlanningModule.findVariantById(PlanningModule.state.stockDraftVariantId) : null;
        const selectedComponent = sourceKind === 'COMPONENT' ? PlanningModule.findComponentById(PlanningModule.state.stockDraftComponentId) : null;
        const selectedSemi = sourceKind === 'SEMI' ? PlanningModule.findSemiFinishedById(PlanningModule.state.stockDraftSemiFinishedId) : null;
        const selectedMontage = PlanningModule.findMontageCardForVariant(selectedVariant);
        const recentRows = PlanningModule.getDemands()
            .filter((row) => String(row?.sourceType || '').toUpperCase() === 'STOCK')
            .slice()
            .sort((a, b) => String(b?.created_at || '').localeCompare(String(a?.created_at || '')))
            .slice(0, 8);
        const isEditing = !!String(PlanningModule.state.stockDraftEditingId || '').trim();
        const summaryTitle = sourceKind === 'COMPONENT'
            ? String(selectedComponent?.name || '-')
            : (sourceKind === 'SEMI' ? String(selectedSemi?.name || '-') : String(selectedVariant?.productName || '-'));
        const summaryLine = sourceKind === 'COMPONENT'
            ? `${String(selectedComponent?.code || '-')} / ${String(selectedComponent?.group || '-')}`
            : (sourceKind === 'SEMI'
                ? `${String(selectedSemi?.code || '-')} / ${String(selectedSemi?.group || '-')}`
                : `${String(selectedVariant?.variantCode || '-')} / ${String(selectedMontage?.cardCode || '-')}`);
        const summaryCode = sourceKind === 'COMPONENT'
            ? String(selectedComponent?.code || '-')
            : (sourceKind === 'SEMI' ? String(selectedSemi?.code || '-') : String(selectedMontage?.productCode || '-'));
        return `
            <section style="max-width:1680px; margin:0 auto;">
                <div style="background:rgba(255,255,255,0.72); border:1px solid #cbd5e1; border-radius:1.8rem; padding:1.4rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:1rem; flex-wrap:wrap;">
                        <div>
                            <h2 class="page-title" style="margin:0;">planlama / stok icin uretim</h2>
                            <div style="color:#64748b; margin-top:0.2rem;">Buradan depoya hazir tutulacak urun icin talep acabilir ve istersek aninda is emrine cevirebiliriz.</div>
                        </div>
                        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                            <button class="btn-sm" onclick="PlanningModule.resetStockDraft(); UI.renderCurrentPage();">temizle</button>
                            <button class="btn-sm" onclick="PlanningModule.openWorkspace('planning-pool')">planlama havuzu</button>
                            <button class="btn-sm" onclick="PlanningModule.openWorkspace('menu')">geri</button>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.8rem; margin-bottom:1rem;">
                        <div style="background:white; border:1px solid #e2e8f0; border-radius:0.9rem; padding:0.8rem 0.95rem;"><div style="font-size:0.74rem; color:#64748b;">Bekleyen talep</div><div style="font-size:1.15rem; font-weight:800; color:#0f172a;">${PlanningModule.getDemands().filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'OPEN').length}</div></div>
                        <div style="background:white; border:1px solid #e2e8f0; border-radius:0.9rem; padding:0.8rem 0.95rem;"><div style="font-size:0.74rem; color:#64748b;">Is emrine donusen</div><div style="font-size:1.15rem; font-weight:800; color:#0f172a;">${PlanningModule.getDemands().filter((row) => String(row?.status || 'OPEN').toUpperCase() === 'RELEASED').length}</div></div>
                        <div style="background:white; border:1px solid #e2e8f0; border-radius:0.9rem; padding:0.8rem 0.95rem;"><div style="font-size:0.74rem; color:#64748b;">Kaynak tipi</div><div style="font-size:1rem; font-weight:800; color:#0f172a;">${PlanningModule.escapeHtml(PlanningModule.getItemTypeLabel(sourceKind))}</div></div>
                        <div style="background:white; border:1px solid #e2e8f0; border-radius:0.9rem; padding:0.8rem 0.95rem;"><div style="font-size:0.74rem; color:#64748b;">Secili kod</div><div style="font-size:1rem; font-weight:800; color:#0f172a; font-family:monospace;">${PlanningModule.escapeHtml(summaryCode)}</div></div>
                    </div>
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:1rem; margin-bottom:1rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; margin-bottom:0.8rem; flex-wrap:wrap;">
                            <strong>${isEditing ? 'Stok talebi duzenle' : 'Yeni stok uretim talebi'}</strong>
                            <div style="font-size:0.82rem; color:#64748b;">Talep once havuza dusurulebilir veya dogrudan is emrine cevrilebilir.</div>
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); gap:0.7rem;">
                            <div style="grid-column:span 3;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Kaynak tipi *</label><select onchange="PlanningModule.setStockDraftField('stockDraftSourceKind', this.value)" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.65rem; font-weight:600;"><option value="MODEL" ${sourceKind === 'MODEL' ? 'selected' : ''}>Urun Modelleri</option><option value="COMPONENT" ${sourceKind === 'COMPONENT' ? 'selected' : ''}>Parca & Bilesen</option><option value="SEMI" ${sourceKind === 'SEMI' ? 'selected' : ''}>Yari Mamul Kutuphanesi</option></select></div>
                            <div style="grid-column:span 5;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">${sourceKind === 'COMPONENT' ? 'Parca / bilesen *' : (sourceKind === 'SEMI' ? 'Yari mamul *' : 'Urun varyanti *')}</label>
                                <div style="display:grid; grid-template-columns:minmax(0,1fr) auto; gap:0.45rem;">
                                    <div style="height:40px; border:1px solid #cbd5e1; border-radius:0.6rem; background:#f8fafc; padding:0 0.9rem; display:flex; align-items:center; font-weight:700; color:${(sourceKind === 'COMPONENT' ? selectedComponent : (sourceKind === 'SEMI' ? selectedSemi : selectedVariant)) ? '#0f172a' : '#94a3b8'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:0.95rem;">
                                        ${PlanningModule.escapeHtml(sourceKind === 'COMPONENT'
                                            ? (selectedComponent ? `${selectedComponent.group || '-'} / ${selectedComponent.name || '-'} / ${selectedComponent.code || '-'}` : 'Parca secmek icin ilgili sayfaya gidin')
                                            : (sourceKind === 'SEMI'
                                                ? (selectedSemi ? `${selectedSemi.group || '-'} / ${selectedSemi.name || '-'} / ${selectedSemi.code || '-'}` : 'Yari mamul secmek icin ilgili sayfaya gidin')
                                                : (selectedVariant ? `${selectedVariant.productGroup || '-'} / ${selectedVariant.productName || '-'} / ${selectedVariant.variantCode || '-'}` : 'Urun modeli secmek icin ilgili sayfaya gidin')))}
                                    </div>
                                    <button class="btn-sm" type="button" onclick="PlanningModule.openItemPicker('${sourceKind === 'COMPONENT' ? 'component' : (sourceKind === 'SEMI' ? 'semi' : 'model')}')" style="height:40px; min-width:110px;">sec + ekle</button>
                                </div>
                            </div>
                            <div style="grid-column:span 2;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Uretim adedi *</label><input type="number" min="1" value="${PlanningModule.escapeHtml(PlanningModule.state.stockDraftQty || '10')}" oninput="PlanningModule.state.stockDraftQty=this.value" onchange="PlanningModule.state.stockDraftQty=this.value" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.65rem; font-weight:700;"></div>
                            <div style="grid-column:span 2;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Hedef tarih</label><input type="date" value="${PlanningModule.escapeHtml(PlanningModule.state.stockDraftDueDate || '')}" oninput="PlanningModule.setStockDraftField('stockDraftDueDate', this.value)" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.65rem;"></div>
                            <div style="grid-column:span 2;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Oncelik</label><select onchange="PlanningModule.setStockDraftField('stockDraftPriority', this.value)" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.65rem;"><option value="LOW" ${String(PlanningModule.state.stockDraftPriority || '') === 'LOW' ? 'selected' : ''}>DUSUK</option><option value="NORMAL" ${String(PlanningModule.state.stockDraftPriority || 'NORMAL') === 'NORMAL' ? 'selected' : ''}>NORMAL</option><option value="HIGH" ${String(PlanningModule.state.stockDraftPriority || '') === 'HIGH' ? 'selected' : ''}>YUKSEK</option><option value="URGENT" ${String(PlanningModule.state.stockDraftPriority || '') === 'URGENT' ? 'selected' : ''}>ACIL</option></select></div>
                            <div style="grid-column:span 8;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Planlama notu / neden</label><textarea rows="3" onchange="PlanningModule.setStockDraftField('stockDraftNote', this.value)" onblur="PlanningModule.setStockDraftField('stockDraftNote', this.value)" style="width:100%; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.6rem; resize:vertical;">${PlanningModule.escapeHtml(PlanningModule.state.stockDraftNote || '')}</textarea></div>
                            <div style="grid-column:span 4; display:grid; gap:0.6rem; align-content:end;">
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:0.85rem; padding:0.8rem;"><div style="font-size:0.74rem; color:#64748b;">Kaynak ozeti</div><div style="font-weight:800; color:#0f172a; margin-top:0.25rem;">${PlanningModule.escapeHtml(summaryTitle)}</div><div style="font-size:0.8rem; color:#64748b; margin-top:0.2rem;">${PlanningModule.escapeHtml(summaryLine)}</div><div style="font-size:0.8rem; color:#64748b; margin-top:0.15rem; font-family:monospace;">${PlanningModule.escapeHtml(summaryCode)}</div></div>
                                <div style="display:flex; gap:0.5rem; flex-wrap:wrap; justify-content:flex-end;"><button class="btn-sm" onclick="PlanningModule.saveStockDemand(false)">${isEditing ? 'guncelle' : 'talep olustur'}</button><button class="btn-primary" onclick="PlanningModule.saveStockDemand(true)">${isEditing ? 'guncelle + is emri' : 'kaydet + is emri'}</button></div>
                            </div>
                        </div>
                    </div>
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.95rem;"><div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; margin-bottom:0.8rem; flex-wrap:wrap;"><strong>Son stok talepleri</strong><button class="btn-sm" onclick="PlanningModule.openWorkspace('released-orders')">donusenleri goruntule</button></div><div class="card-table"><table style="width:100%; border-collapse:collapse;"><thead><tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;"><th style="padding:0.6rem; text-align:left;">Talep</th><th style="padding:0.6rem; text-align:left;">Urun</th><th style="padding:0.6rem; text-align:left;">Kod</th><th style="padding:0.6rem; text-align:center;">Adet</th><th style="padding:0.6rem; text-align:left;">Termin / Oncelik</th><th style="padding:0.6rem; text-align:left;">Durum</th><th style="padding:0.6rem; text-align:left;">Is emri</th><th style="padding:0.6rem; text-align:right;">Islem</th></tr></thead><tbody>${PlanningModule.renderDemandRows(recentRows, 'Henuz stok icin uretim talebi acilmadi.')}</tbody></table></div></div>
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
