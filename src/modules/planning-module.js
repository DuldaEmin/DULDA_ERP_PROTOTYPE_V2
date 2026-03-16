const PlanningModule = {
    state: {
        workspaceView: 'menu',
        stockDraftEditingId: '',
        stockDraftVariantId: '',
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
                { title: 'Ekranda olacak alanlar', items: ['Siparis no, musteri, urun, varyant, adet, termin ve oncelik.', 'Kaynak tipi, plan notu ve mevcut hazir stok bilgisi.', 'Satir aksiyonlari: gor, planla, is emrine cevir, beklet.'] },
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
        PlanningModule.state.stockDraftVariantId = '';
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

    findVariantById: (variantId) => PlanningModule.getVariants().find((row) => String(row?.id || '') === String(variantId || '')) || null,

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
