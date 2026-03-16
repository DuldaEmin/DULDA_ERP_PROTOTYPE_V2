const PlanningModule = {
    state: {
        workspaceView: 'menu'
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
        'stock-production': {
            title: 'planlama / stok icin uretim',
            intro: 'Siparise bagli olmayan, depoda hazir tutulacak urunlerin uretim talepleri bu modulden acilacak.',
            sections: [
                { title: 'Temel islev', items: ['Urun modeli ve varyant secerek stok icin uretim talebi olustur.', 'Adet, hedef tarih, oncelik ve neden bilgisini gir.', 'Olusan kaydi planlama havuzuna siparis talepleri ile ayni mantikta dusur.'] },
                { title: 'Ekranda olacak alanlar', items: ['Urun grubu, urun modeli, varyant, adet ve hedef tarih.', 'Talep nedeni, min stok / hedef stok notu ve oncelik secimi.', 'Kayit sonrasi satir islemleri: gor, duzenle, planla, is emrine cevir.'] },
                { title: 'Kayit sonrasi beklenti', items: ['Stok icin acilan talepler planlama havuzunda kaynak tipi STOK olarak gorunur.', 'Planlamaci kapasiteye gore bu kayitlari siparis talepleriyle beraber siralayabilir.', 'Is emrine donusen satirlar atolyelere normal uretim gibi akar.'] }
            ]
        },
        'planning-pool': {
            title: 'planlama / planlama havuzu',
            intro: 'Siparisten ve stoktan gelen tum uretim taleplerinin tek merkezde toplandigi ana planlama ekranidir.',
            sections: [
                { title: 'Temel islev', items: ['Tum talepleri tek listede topla ve kaynak tipine gore ayir.', 'Termin, oncelik, kapasite ve mevcut stok durumuna gore sira belirle.', 'Planlanmayan, bekleyen ve is emrine donusen kayitlari farkli durumlarla izle.'] },
                { title: 'Ekranda olacak alanlar', items: ['Kaynak tipi, talep no, musteri / stok etiketi, urun, varyant, adet.', 'Termin, oncelik, durum, plan notu ve sorumlu planlamaci.', 'Satir islemleri: gor, planla, oncelik ver, is emrine cevir, beklet, iptal.'] },
                { title: 'Kayit sonrasi beklenti', items: ['Bu ekran satis ile uretimin kesisim noktasi olarak calisir.', 'Buradan verilen kararlar is emri, sevkiyat veya stok yenileme akisina veri saglar.', 'Yogunluk arttiginda filtre ve durum bazli yonetim bu ekranin merkezinde olur.'] }
            ]
        },
        'released-orders': {
            title: 'planlama / is emrine donusenler',
            intro: 'Planlamasi tamamlanmis ve uretime aktarilmis taleplerin izleme ekranidir.',
            sections: [
                { title: 'Temel islev', items: ['Is emrine cevirdigin tum kayitlari toplu izle.', 'Hangi talebin hangi is emrine donustugunu takip et.', 'Iptal, revizyon veya tekrar planlama ihtiyacinda geriye donuk kontrol sagla.'] },
                { title: 'Ekranda olacak alanlar', items: ['Is emri no, kaynak talep no, urun, adet, acilis tarihi ve durum.', 'Planlanan termin, atanan oncelik ve ilgili montaj karti.', 'Satir islemleri: gor, is emri ac, yeniden planla notu ekle.'] },
                { title: 'Kayit sonrasi beklenti', items: ['Atolyedeki is emri planlama ekranlari bu kayitlardan beslenir.', 'Satis ve planlama ekipleri hangi talebin uretime dustugunu ayni dilden gorur.', 'Raporlama icin talep kaynagi ile is emri baglantisi korunur.'] }
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

    openWorkspace: (viewId) => {
        PlanningModule.state.workspaceView = String(viewId || 'menu');
        UI.renderCurrentPage();
    },

    render: (container) => {
        if (!container) return;
        const viewId = String(PlanningModule.state.workspaceView || 'menu');
        container.innerHTML = viewId === 'menu'
            ? PlanningModule.renderMenuLayout()
            : PlanningModule.renderBlueprintWorkspace(viewId);
        if (window.lucide) window.lucide.createIcons();
    },

    renderMenuLayout: () => {
        const cards = [
            { id: 'sales-demand', icon: 'shopping-bag', label: 'Siparisten Gelen Talepler', tone: 'g-orange' },
            { id: 'stock-production', icon: 'boxes', label: 'Stok Icin Uretim', tone: 'g-emerald' },
            { id: 'planning-pool', icon: 'clipboard-list', label: 'Planlama Havuzu', tone: 'g-blue' },
            { id: 'released-orders', icon: 'file-check-2', label: 'Is Emrine Donusenler', tone: 'g-pink' },
            { id: 'capacity-load', icon: 'activity', label: 'Kapasite ve Yuk Durumu', tone: 'g-cyan' }
        ];
        return `
            <section style="max-width:1880px; margin:0 auto;">
                <div style="background:rgba(255,255,255,0.72); border:1px solid #cbd5e1; border-radius:1.8rem; padding:1.4rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap; margin-bottom:1.1rem;">
                        <div>
                            <h2 class="page-title" style="margin:0; font-size:1.95rem;">planlama</h2>
                            <div style="color:#64748b; margin-top:0.25rem;">Satis ile uretimin kesisim ekranini burada tasarliyoruz.</div>
                        </div>
                    </div>
                    <div class="apps-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1rem;">
                        ${cards.map((card) => `
                            <button type="button" onclick="PlanningModule.openWorkspace('${PlanningModule.escapeHtml(card.id)}')" class="app-card" style="min-height:180px; border:none; width:100%; text-align:center; cursor:pointer;">
                                <div class="icon-box ${PlanningModule.escapeHtml(card.tone)}"><i data-lucide="${PlanningModule.escapeHtml(card.icon)}" width="30" height="30"></i></div>
                                <div class="app-name">${PlanningModule.escapeHtml(card.label)}</div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </section>
        `;
    },

    renderBlueprintWorkspace: (viewId) => {
        const blueprint = PlanningModule.blueprints[String(viewId || '')];
        if (!blueprint) {
            return `
                <section style="max-width:1880px; margin:0 auto;">
                    <div style="background:rgba(255,255,255,0.72); border:1px solid #cbd5e1; border-radius:1.8rem; padding:1.4rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:1rem;">
                            <h2 class="page-title" style="margin:0;">planlama</h2>
                            <button class="btn-sm" onclick="PlanningModule.openWorkspace('menu')">geri</button>
                        </div>
                        <div class="card-table" style="padding:2rem; text-align:center; color:#94a3b8;">Bu modul icin henuz not tanimlanmadi.</div>
                    </div>
                </section>
            `;
        }

        return `
            <section style="max-width:1880px; margin:0 auto;">
                <div style="background:rgba(255,255,255,0.72); border:1px solid #cbd5e1; border-radius:1.8rem; padding:1.4rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:1rem; flex-wrap:wrap;">
                        <h2 class="page-title" style="margin:0;">${PlanningModule.escapeHtml(blueprint.title || 'planlama')}</h2>
                        <button class="btn-sm" onclick="PlanningModule.openWorkspace('menu')">geri</button>
                    </div>
                    <div class="card-table" style="padding:1.4rem 1.5rem; margin-bottom:1rem;">
                        <div style="font-size:1.02rem; font-weight:800; color:#0f172a;">Modul notu</div>
                        <div style="font-size:0.94rem; color:#64748b; margin-top:0.45rem; line-height:1.7;">${PlanningModule.escapeHtml(blueprint.intro || '')}</div>
                    </div>
                    <div style="display:grid; gap:1rem;">
                        ${(blueprint.sections || []).map((section) => `
                            <div class="card-table" style="padding:1.2rem 1.35rem;">
                                <div style="font-size:0.98rem; font-weight:800; color:#0f172a; margin-bottom:0.7rem;">${PlanningModule.escapeHtml(section.title || '-')}</div>
                                <div style="display:grid; gap:0.55rem;">
                                    ${(section.items || []).map((item) => `
                                        <div style="display:flex; align-items:flex-start; gap:0.65rem; color:#334155; line-height:1.65;">
                                            <div style="width:8px; height:8px; border-radius:999px; background:#0f172a; margin-top:0.48rem; flex-shrink:0;"></div>
                                            <div>${PlanningModule.escapeHtml(item || '')}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>
        `;
    }
};
