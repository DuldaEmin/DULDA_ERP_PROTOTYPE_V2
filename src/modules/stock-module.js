const StockModule = {
    state: {
        workspaceView: 'menu',
        topTab: 'all',
        selectedKey: 'all',
        searchQuery: '',
        inventoryStockFilters: {
            available: true,
            inProcess: true,
            reserve: true
        },
        inventoryLocationFilter: null,
        inventoryOpenCategoryKeys: {},
        searchName: '',
        searchCode: '',
        operationSearchName: '',
        operationSearchCode: '',
        operationFormOpen: false,
        operationEditingId: null,
        operationSelectedId: null,
        operationDraftCode: '',
        operationDraftName: '',
        operationDraftNote: '',
        depotModalCellsOnly: false,
        depotDraftName: '',
        depotDraftNote: '',
        locationDraftRaf: '',
        locationDraftCell: '',
        locationDraftNote: '',
        locationDraftIdCode: '',
        locationDraftEditIndex: -1,
        depotDraftLocations: [],
        depotEditingId: null,
        goodsReceiptDraft: null,
        goodsReceiptEditingId: null,
        goodsReceiptFilters: {
            docNo: '',
            supplierId: '',
            depotId: '',
            status: '',
            dateFrom: '',
            dateTo: ''
        }
    },

    moduleBlueprints: {
        'goods-receipt': {
            title: 'depo & stok / mal kabul',
            intro: 'Disaridan satin alinan urunlerin depoya fiziksel girisi bu modulden yapilacak.',
            sections: [
                { title: 'Temel islev', items: ['Tedarikciden gelen urunleri teslim al ve ana depoya kaydet.', 'Belge no, tedarikci, tarih ve teslim alan personel bilgisini birlikte tut.', 'Kalem bazli miktar, birim, hedef depo ve raf secimi yap.'] },
                { title: 'Ekranda olacak alanlar', items: ['Tedarikci secimi, belge / irsaliye no, teslim tarihi, not.', 'Urun satirlari: urun adi, ID kod, miktar, birim, hedef depo, raf / hucre.', 'Istege bagli kalite kontrol ve eksik / hasar notu.'] },
                { title: 'Kayit sonrasi beklenti', items: ['Stock hareketi olusur ve urun secilen depoda gorunur.', 'Satin alma kaydi ile eslestirilecek altyapi hazir tutulur.', 'Daha sonra kabul edilen kalemler otomatik maliyet ve tedarik gecmisine baglanabilir.'] }
            ]
        },
        'inventory-registration': {
            title: 'depo & stok / envantere elle kayit',
            intro: 'Sistemde daha once acilmamis veya sayimla bulunan mevcut urunleri baslangic stogu gibi kaydetmek icin kullanilacak.',
            sections: [
                { title: 'Temel islev', items: ['Bitmis urun, yari mamul ve hammaddeyi elle envantere ekle.', 'Mevcut stok acilisi ve sayim farki girisi burada yapilsin.', 'Kayitlar stok hareketinde ayri bir kaynak tipi ile izlensin.'] },
                { title: 'Ekranda olacak alanlar', items: ['Urun tipi, urun secimi / kodu, miktar, birim, depo, raf / hucre.', 'Durum: hammadde, yari mamul, bitmis urun.', 'Yari mamul icin son tamamlanan istasyon ve aciklama alani.'] },
                { title: 'Kayit sonrasi beklenti', items: ['Siparis planlama bu stogu kullanabilsin.', 'Yari mamul kayitlari daha sonra kalan rota kontrolune girebilsin.', 'Elle girilen satirlar raporda ayri filtrelenebilsin.'] }
            ]
        },
        'production-receipt': {
            title: 'depo & stok / uretimden gelen kabul',
            intro: 'Atolyelerden veya dis fasondan gelen yari mamul ve bitmis urunlerin depoya alinacagi modul olacak.',
            sections: [
                { title: 'Temel islev', items: ['CNC, testere, pleksi, eloksal, pvd, polisaj, montaj gibi kaynaklardan gelen urunleri teslim al.', 'Urunu yari mamul veya bitmis olarak isaretle.', 'Biten rota asamasini kaydet ki sistem tekrar baslatmasin.'] },
                { title: 'Ekranda olacak alanlar', items: ['Kaynak birim, is emri / referans no, urun kodu, miktar, depo secimi.', 'Durum secimi: yari mamul veya bitmis.', 'Son tamamlanan istasyon, teslim alan kisi ve not.'] },
                { title: 'Kayit sonrasi beklenti', items: ['Ana depo once bitmis urunu, sonra yari mamulu kontrol eden siparis mantigina veri saglar.', 'Tum kalemler hazir olursa montaja uyari dusulecek altyapiyi besler.', 'Montaj bitince sevkiyat depoya aktarilacak zincirin ilk adimi olur.'] }
            ]
        },
        'outsource-shipment': {
            title: 'depo & stok / dis fason sevk',
            intro: 'Dis fasona gidecek urunlerin cikisi, teslim kaydi ve geri donus takibi bu moduldedir.',
            sections: [
                { title: 'Temel islev', items: ['Eloksal, pvd, polisaj gibi dis isleme gidecek urunleri depodan cikar.', 'Hangi fasona ne gitti, ne zaman gitti ve hangi belge ile gitti bilgisi tutulur.', 'Geri donuste ayni kayit uzerinden teslim alma yapilabilir.'] },
                { title: 'Ekranda olacak alanlar', items: ['Fason secimi, sevk tarihi, arac / teslim eden, belge no.', 'Kalem listesi: urun kodu, ad, miktar, birim, cikis depolari.', 'Beklenen donus tarihi ve aciklama.'] },
                { title: 'Kayit sonrasi beklenti', items: ['Stock hareketi cikis olarak islenir.', 'Fason surecindeki urunler ayri bir bekleyen listede izlenir.', 'Geri gelen urunler uretimden gelen kabul ekraninda teslim alinabilir.'] }
            ]
        },
        'shipment-prep': {
            title: 'depo & stok / sevkiyat hazirlama',
            intro: 'Satis tarafindan onay bekleyen veya onaylanan siparislerin sevkiyata hazirlanmasi bu modulden yonetilecek.',
            sections: [
                { title: 'Temel islev', items: ['Hazir urunleri siparis bazli toplat ve sevkiyat deposuna cek.', 'Montajdan gelen bitmis urunleri sevke hazir olarak isaretle.', 'Sevk edilecek kalemlerin miktar, paket ve teslim durumunu takip et.'] },
                { title: 'Ekranda olacak alanlar', items: ['Siparis no, musteri, teslim tarihi, sevk durumu.', 'Siparis satirlari: urun, miktar, hazir miktar, eksik miktar.', 'Paketleme notu, sevkiyat depo lokasyonu ve sorumlu personel.'] },
                { title: 'Kayit sonrasi beklenti', items: ['Satisciya urun hazir bildirimi gidecek altyapi burada beslenecek.', 'Onaylanan satirlar irsaliyeye aktarima hazir olacak.', 'Sevkiyat tamamlaninca ana stoktan dusus yapilacak.'] }
            ]
        },
        'dispatch-note': {
            title: 'depo & stok / irsaliye ve teslim takibi',
            intro: 'Ilk etapta kullanicisiz basit irsaliye akisi ile sevk ve teslim takipleri bu modulde toplanacak.',
            sections: [
                { title: 'Temel islev', items: ['Sevk edilen urunler icin irsaliye olustur.', 'Musteriye giden ve fasondan donen hareketler icin belge numarasi sakla.', 'Teslim edildi, yolda, iade edildi gibi durumlar izlenebilsin.'] },
                { title: 'Ekranda olacak alanlar', items: ['Irsaliye no, tarih, musteri / fason, tasiyan, not.', 'Kalem listesi: urun kodu, urun adi, miktar, birim.', 'Belge yazdir / goruntule ve teslim durumu alani.'] },
                { title: 'Kayit sonrasi beklenti', items: ['Satis siparisi sevk edildi durumuna gecirilebilir.', 'Belge gecmisi daha sonra kullanici ve onay akisina baglanabilir.', 'Sevkiyat raporlari icin temel hareket verisi burada birikir.'] }
            ]
        },
        'ready-flow': {
            title: 'depo & stok / montaj ve satis bildirim akisi',
            intro: 'Depoda tum kalemler tamamlandiginda montaja, montaj bitince de satisa gidecek uyari zinciri bu baslik altinda netlestirildi.',
            sections: [
                { title: 'Akis mantigi', items: ['Bir siparis icin gereken tum kalemler ana depoda hazirsa montaj birimine gorev acilir.', 'Gorev, urun modeline bagli montaj islem kartini referans alir.', 'Montaj tamamlaninca bitmis urun sevkiyat depoya veya hazir urun alanina alinir.'] },
                { title: 'Planlanan uyari metinleri', items: ['Montaja: Malzeme hazir, belirli adet urunu montaj kartina gore topla.', 'Satisciya: Siparis kalemleri hazir, sevk onayi bekleniyor.', 'Depoya: Onay gelen siparis icin irsaliye ve sevk islemi baslat.'] },
                { title: 'Bu modulu neden yaziyoruz', items: ['Satis, depo ve montaj ayni durumu farkli ekranlardan gorebilsin.', 'Hazir urun ile yari mamul mantigi siparis kararinda dogru kullanilsin.', 'Daha sonra otomatik gorev ve bildirim sistemine temel olsun.'] }
            ]
        }
    },

    managedDepotSeed: [
        { id: 'depot_transfer', name: 'TRANSFER DEPO', note: 'Atolyeler arasinda bekleyen ve yonlendirilecek urunler burada gorunur.' },
        { id: 'depot_granul', name: 'GRANUL DEPO', note: 'Hammadde ve granul icin ayrilan fiziksel alan.' },
        { id: 'depot_profil', name: 'SEVKIYAT DEPO', note: 'Sevke hazir urunlerin toplandigi fiziksel alan.' },
        { id: 'depot_mafsal', name: 'HURDA DEPO', note: 'Hurda, fire ve ayrilan malzemeler icin izleme alani.' }
    ],

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

    normalize: (value) => String(value || '').trim().toLocaleLowerCase('tr-TR'),

    formatDateTimeLabel: (value) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value || '-');
        return date.toLocaleString('tr-TR');
    },

    getInventorySearchMatch: (row, rawQuery) => {
        const q = StockModule.normalize(rawQuery).replace(/\s+/g, ' ').trim();
        if (!q) return { matched: true, score: 0, label: '' };
        const tokens = q.split(' ').filter(Boolean);

        const labels = {
            code: 'ID kodu',
            name: 'Urun adi',
            locationCode: 'Raf kodu',
            planCodeId: 'Plan kod ID',
            modelCode: 'Model kodu',
            masterCode: 'Master kodu',
            productType: 'Urun tipi',
            note: 'Not',
            depotName: 'Depo'
        };

        const idEntries = [];
        const textEntries = [];
        const pushEntry = (bucket, value, key, fallbackLabel = '') => {
            const raw = String(value || '').trim();
            if (!raw) return;
            bucket.push({
                norm: StockModule.normalize(raw),
                label: labels[key] || fallbackLabel || key || 'Alan'
            });
        };

        pushEntry(idEntries, row?.code, 'code');
        pushEntry(idEntries, row?.id, 'code');
        pushEntry(idEntries, row?.locationCode, 'locationCode');
        pushEntry(idEntries, row?.planCodeId, 'planCodeId');
        pushEntry(idEntries, row?.modelCode, 'modelCode');
        pushEntry(idEntries, row?.masterCode, 'masterCode');
        pushEntry(idEntries, row?.depotNode?.id, 'depotName', 'Depo ID');
        pushEntry(idEntries, row?.depotNode?.key, 'depotName', 'Depo anahtar');
        pushEntry(idEntries, row?.searchMeta?.productId, 'code', 'Urun ID');
        pushEntry(idEntries, row?.searchMeta?.productCode, 'code');
        pushEntry(idEntries, row?.searchMeta?.partCardCode, 'code');
        pushEntry(idEntries, row?.searchMeta?.semiCardCode, 'code');
        pushEntry(idEntries, row?.searchMeta?.locationId, 'locationCode', 'Lokasyon ID');
        pushEntry(idEntries, row?.searchMeta?.depotId, 'depotName', 'Depo ID');

        pushEntry(textEntries, row?.name, 'name');
        pushEntry(textEntries, row?.depotName, 'depotName');
        pushEntry(textEntries, row?.status, 'productType', 'Durum');
        pushEntry(textEntries, row?.stockClass, 'productType', 'Stok sinifi');
        pushEntry(textEntries, row?.note, 'note');
        pushEntry(textEntries, row?.productType, 'productType');
        pushEntry(textEntries, row?.searchMeta?.productName, 'name');
        pushEntry(textEntries, row?.searchMeta?.productCategory, 'productType', 'Kategori');
        pushEntry(textEntries, row?.searchMeta?.productBrandModel, 'modelCode');
        pushEntry(textEntries, row?.searchMeta?.partCardName, 'name');
        pushEntry(textEntries, row?.searchMeta?.partCardGroup, 'productType', 'Parca grubu');
        pushEntry(textEntries, row?.searchMeta?.partCardSubGroup, 'productType', 'Parca alt grubu');
        pushEntry(textEntries, row?.searchMeta?.semiCardName, 'name');
        pushEntry(textEntries, row?.searchMeta?.semiCardGroup, 'productType', 'Yari mamul grubu');
        pushEntry(textEntries, row?.searchMeta?.semiCardSubGroup, 'productType', 'Yari mamul alt grubu');

        const exactId = idEntries.find((entry) => entry.norm === q);
        if (exactId) return { matched: true, score: 400, label: exactId.label };

        const prefixId = idEntries.find((entry) => entry.norm.startsWith(q));
        if (prefixId) return { matched: true, score: 300, label: prefixId.label };

        const prefixName = textEntries.find((entry) => entry.norm.startsWith(q));
        if (prefixName) return { matched: true, score: 200, label: prefixName.label };

        const containsAny = [...idEntries, ...textEntries].find((entry) => entry.norm.includes(q));
        if (containsAny) return { matched: true, score: 160, label: containsAny.label };

        if (tokens.length > 1) {
            const allEntries = [...idEntries, ...textEntries];
            const combined = allEntries.map((entry) => entry.norm).join(' ');
            const tokenMatcher = (value) => tokens.every((token) => String(value || '').includes(token));
            const tokenFieldMatch = allEntries.find((entry) => tokenMatcher(entry.norm));
            if (tokenFieldMatch) return { matched: true, score: 130, label: tokenFieldMatch.label };
            if (tokenMatcher(combined)) return { matched: true, score: 120, label: 'Genel eslesme' };
            return { matched: false, score: 0, label: '' };
        }

        return { matched: false, score: 0, label: '' };
    },

    getStockPersonnelRows: () => {
        if (typeof PersonnelModule !== 'undefined' && typeof PersonnelModule.ensureData === 'function') {
            PersonnelModule.ensureData();
        }
        return (DB.data?.data?.personnel || [])
            .filter((row) => row?.isActive !== false)
            .filter((row) => row?.isStockPersonnel === true)
            .sort((a, b) => String(a?.fullName || '').localeCompare(String(b?.fullName || ''), 'tr'));
    },

    render: (container) => {
        if (!container) return;
        StockModule.ensureData();
        if (String(StockModule.state.workspaceView || 'menu') === 'personnel') {
            container.innerHTML = StockModule.renderPersonnelWorkspaceShell();
            if (window.lucide) window.lucide.createIcons();
            if (typeof UnitModule !== 'undefined' && UnitModule && typeof UnitModule.renderComponentRoutePickerPanel === 'function') {
                UnitModule.renderComponentRoutePickerPanel(container);
            }
            return;
        }
        if (String(StockModule.state.workspaceView || 'menu') === 'work-order-planning') {
            if (typeof UnitModule !== 'undefined' && UnitModule && typeof UnitModule.renderWorkOrderPlanningPlaceholder === 'function') {
                UnitModule.renderWorkOrderPlanningPlaceholder(container, 'u_dtm');
                if (window.lucide) window.lucide.createIcons();
                if (typeof UnitModule.renderComponentRoutePickerPanel === 'function') {
                    UnitModule.renderComponentRoutePickerPanel(container);
                }
                return;
            }
        }
        container.innerHTML = StockModule.renderLayout();
        if (window.lucide) window.lucide.createIcons();
        if (typeof UnitModule !== 'undefined' && UnitModule && typeof UnitModule.renderComponentRoutePickerPanel === 'function') {
            UnitModule.renderComponentRoutePickerPanel(container);
        }
    },

    ensureData: () => {
        if (!DB.data || typeof DB.data !== 'object') DB.data = {};
        if (!DB.data.data || typeof DB.data.data !== 'object') DB.data.data = {};
        if (!DB.data.meta || typeof DB.data.meta !== 'object') DB.data.meta = {};
        if (!DB.data.meta.seedFlags || typeof DB.data.meta.seedFlags !== 'object') DB.data.meta.seedFlags = {};
        if (!Array.isArray(DB.data.data.units)) DB.data.data.units = [];
        if (!Array.isArray(DB.data.data.stockDepots)) DB.data.data.stockDepots = [];
        if (!Array.isArray(DB.data.data.stockDepotLocations)) DB.data.data.stockDepotLocations = [];
        if (!Array.isArray(DB.data.data.stockDepotItems)) DB.data.data.stockDepotItems = [];
        if (!Array.isArray(DB.data.data.stockGoodsReceipts)) DB.data.data.stockGoodsReceipts = [];
        if (!Array.isArray(DB.data.data.depoTransferTasks)) DB.data.data.depoTransferTasks = [];

        let changed = false;
        const now = new Date().toISOString();

        if (DB.data.data.units.length === 0) {
            DB.data.data.units = [
                { id: 'u1', name: 'CNC ATOLYESI', type: 'internal' },
                { id: 'u2', name: 'EKSTRUDER ATOLYESI', type: 'internal' },
                { id: 'u3', name: 'MONTAJ', type: 'internal' },
                { id: 'u5', name: 'PLEKSI POLISAJ ATOLYESI', type: 'internal' },
                { id: 'u7', name: 'TESTERE ATOLYESI', type: 'internal' },
                { id: 'u_dtm', name: 'DEPO TRANSFER', type: 'internal' },
                { id: 'u9', name: 'HILAL PWD', type: 'external' },
                { id: 'u10', name: 'IBRAHIM POLISAJ', type: 'external' },
                { id: 'u11', name: 'TEKIN ELOKSAL', type: 'external' }
            ];
            changed = true;
        }

        const mainDepotUnit = (DB.data.data.units || []).find((row) => String(row?.id || '') === 'u_dtm');
        if (!mainDepotUnit) {
            DB.data.data.units.push({ id: 'u_dtm', name: 'DEPO TRANSFER', type: 'internal' });
            changed = true;
        } else if (String(mainDepotUnit.name || '').trim().toUpperCase() !== 'DEPO TRANSFER') {
            mainDepotUnit.name = 'DEPO TRANSFER';
            changed = true;
        }
        (Array.isArray(DB.data.data.depoTransferTasks) ? DB.data.data.depoTransferTasks : []).forEach((task) => {
            const rawName = String(task?.taskName || '');
            if (!rawName) return;
            let nextName = rawName;
            if (/ana depoya/gi.test(nextName)) nextName = nextName.replace(/ana depoya/gi, 'depo transfere');
            if (/ana depo/gi.test(nextName)) nextName = nextName.replace(/ana depo/gi, 'depo transfer');
            if (nextName !== rawName) {
                task.taskName = nextName;
                changed = true;
            }
        });
        (Array.isArray(DB.data.data.workOrders) ? DB.data.data.workOrders : []).forEach((order) => {
            (Array.isArray(order?.lines) ? order.lines : []).forEach((line) => {
                (Array.isArray(line?.routes) ? line.routes : []).forEach((route) => {
                    if (String(route?.stationId || '') !== 'u_dtm') return;
                    const stationName = String(route?.stationName || '');
                    if (!stationName || !/ana depo/gi.test(stationName)) return;
                    route.stationName = 'DEPO TRANSFER';
                    changed = true;
                });
            });
        });

        const packageIds = (DB.data.data.units || [])
            .filter((row) => String(row?.id || '') === 'u4' || String(row?.name || '').toUpperCase().includes('PAKETLEME'))
            .map((row) => row.id);
        if (packageIds.length > 0) {
            DB.data.data.units = (DB.data.data.units || []).filter((row) => !packageIds.includes(row.id));
            changed = true;
        }

        const akpaUnitIds = (DB.data.data.units || [])
            .filter((row) => String(row?.id || '') === 'u8' || String(row?.name || '').toUpperCase().includes('AKPA'))
            .map((row) => row.id);
        if (akpaUnitIds.length > 0) {
            DB.data.data.units = (DB.data.data.units || []).filter((row) => !akpaUnitIds.includes(row.id));
            changed = true;
        }

        StockModule.managedDepotSeed.forEach((seed) => {
            const row = (DB.data.data.stockDepots || []).find((item) => String(item?.id || '') === String(seed.id));
            if (!row) {
                DB.data.data.stockDepots.push({
                    id: seed.id,
                    name: seed.name,
                    note: seed.note,
                    isActive: true,
                    created_at: now
                });
                changed = true;
                return;
            }
            if (!row.name) {
                row.name = seed.name;
                changed = true;
            }
            const legacyName = String(row.name || '').trim().toUpperCase();
            if (String(seed.id) === 'depot_profil' && legacyName === 'PROFIL DEPO') {
                row.name = seed.name;
                changed = true;
            }
            if (String(seed.id) === 'depot_mafsal' && legacyName === 'MAFSAL DEPO') {
                row.name = seed.name;
                changed = true;
            }
            if (!row.note) {
                row.note = seed.note;
                changed = true;
            }
            if (typeof row.isActive === 'undefined') {
                row.isActive = true;
                changed = true;
            }
            if (!row.created_at) {
                row.created_at = now;
                changed = true;
            }
        });

        if (!DB.data.meta.seedFlags.stockDepotsSeededV4) {
            [
                { depotId: 'main', rafCode: 'R01', cellCode: 'A1', note: 'Ana depo giris rafi' },
                { depotId: 'main', rafCode: 'R01', cellCode: 'A2', note: '' },
                { depotId: 'main', rafCode: 'R02', cellCode: 'A1', note: '' },
                { depotId: 'depot_granul', rafCode: 'R01', cellCode: 'A1', note: '' },
                { depotId: 'depot_profil', rafCode: 'R01', cellCode: 'A1', note: '' }
            ].forEach((seed) => {
                const exists = (DB.data.data.stockDepotLocations || []).some((row) =>
                    String(row?.depotId || '') === seed.depotId
                    && String(row?.rafCode || '').trim().toUpperCase() === seed.rafCode
                    && String(row?.cellCode || '').trim().toUpperCase() === seed.cellCode
                );
                if (exists) return;
                DB.data.data.stockDepotLocations.push({
                    id: crypto.randomUUID(),
                    depotId: seed.depotId,
                    rafCode: seed.rafCode,
                    cellCode: seed.cellCode,
                    note: seed.note,
                    created_at: now
                });
                changed = true;
            });
            DB.data.meta.seedFlags.stockDepotsSeededV4 = true;
            changed = true;
        }

        (DB.data.data.stockDepots || []).forEach((row) => {
            if (!row.created_at) {
                row.created_at = now;
                changed = true;
            }
        });
        (DB.data.data.stockDepotLocations || []).forEach((row) => {
            if (!row.created_at) {
                row.created_at = now;
                changed = true;
            }
        });
        const usedLocationCodes = new Set();
        (DB.data.data.stockDepotLocations || []).forEach((row) => {
            const normalized = StockModule.normalizeLocationIdCode(row?.idCode || '');
            if (normalized && !usedLocationCodes.has(normalized)) {
                if (String(row?.idCode || '') !== normalized) {
                    row.idCode = normalized;
                    changed = true;
                }
                usedLocationCodes.add(normalized);
                return;
            }
            const autoCode = StockModule.getNextLocationIdCode(usedLocationCodes);
            row.idCode = autoCode;
            usedLocationCodes.add(autoCode);
            changed = true;
        });
        const locationById = new Map();
        const locationByDepotAndCode = new Map();
        (DB.data.data.stockDepotLocations || []).forEach((locationRow) => {
            const locationId = String(locationRow?.id || '').trim();
            const depotId = String(locationRow?.depotId || '').trim();
            if (locationId) locationById.set(locationId, locationRow);
            if (!depotId) return;
            const locationCode = String(StockModule.getLocationCode(locationRow) || '').trim().toUpperCase();
            if (!locationCode) return;
            const key = `${depotId}|${locationCode}`;
            if (!locationByDepotAndCode.has(key)) locationByDepotAndCode.set(key, locationRow);
        });
        (DB.data.data.stockDepotItems || []).forEach((row) => {
            if (!row || typeof row !== 'object') return;
            if (!String(row?.id || '').trim()) {
                row.id = crypto.randomUUID();
                changed = true;
            }
            if (!row.created_at) {
                row.created_at = now;
                changed = true;
            }
            if (!row.updated_at) {
                row.updated_at = now;
                changed = true;
            }
            const nodeKey = String(row?.nodeKey || row?.depotKey || row?.key || '').trim();
            if (!String(row?.depotId || '').trim() && nodeKey.startsWith('managed:')) {
                row.depotId = nodeKey.slice('managed:'.length);
                changed = true;
            }
            let locationId = String(row?.locationId || '').trim();
            let matchedLocation = locationId ? (locationById.get(locationId) || null) : null;
            if (matchedLocation && !String(row?.depotId || '').trim()) {
                row.depotId = String(matchedLocation?.depotId || '').trim();
                changed = true;
            }
            const depotId = String(row?.depotId || '').trim();
            const rafCode = String(row?.rafCode || '').trim().toUpperCase();
            const cellCode = String(row?.cellCode || '').trim().toUpperCase();
            const fallbackLocationCode = String(row?.locationCode || '').trim().toUpperCase()
                || (rafCode && cellCode ? `${rafCode}-${cellCode}` : (rafCode || cellCode || ''));
            if (!matchedLocation && depotId && fallbackLocationCode) {
                const byCode = locationByDepotAndCode.get(`${depotId}|${fallbackLocationCode}`) || null;
                if (byCode) {
                    matchedLocation = byCode;
                    const nextLocationId = String(byCode?.id || '').trim();
                    if (nextLocationId && nextLocationId !== locationId) {
                        row.locationId = nextLocationId;
                        locationId = nextLocationId;
                        changed = true;
                    }
                }
            }
            if (!matchedLocation && depotId && (rafCode || cellCode)) {
                const byPair = (DB.data.data.stockDepotLocations || []).find((locationRow) =>
                    String(locationRow?.depotId || '').trim() === depotId
                    && String(locationRow?.rafCode || '').trim().toUpperCase() === rafCode
                    && String(locationRow?.cellCode || '').trim().toUpperCase() === cellCode
                ) || null;
                if (byPair) {
                    matchedLocation = byPair;
                    const nextLocationId = String(byPair?.id || '').trim();
                    if (nextLocationId && nextLocationId !== locationId) {
                        row.locationId = nextLocationId;
                        changed = true;
                    }
                }
            }
            if (matchedLocation) {
                const canonicalCode = String(StockModule.getLocationCode(matchedLocation) || '').trim().toUpperCase();
                if (canonicalCode && String(row?.locationCode || '').trim().toUpperCase() !== canonicalCode) {
                    row.locationCode = canonicalCode;
                    changed = true;
                }
                if (!String(row?.depotId || '').trim()) {
                    row.depotId = String(matchedLocation?.depotId || '').trim();
                    changed = true;
                }
            } else if (fallbackLocationCode && String(row?.locationCode || '').trim().toUpperCase() !== fallbackLocationCode) {
                row.locationCode = fallbackLocationCode;
                changed = true;
            }
        });
        (DB.data.data.stockGoodsReceipts || []).forEach((row) => {
            if (!row || typeof row !== 'object') return;
            const safeStatus = StockModule.normalizeGoodsReceiptStatus(row?.status || 'TASLAK');
            if (String(row?.status || '') !== safeStatus) {
                row.status = safeStatus;
                changed = true;
            }
            if (!String(row?.docNo || '').trim()) {
                row.docNo = `MK-${new Date().getFullYear()}-000001`;
                changed = true;
            }
            if (!Array.isArray(row.lines)) {
                row.lines = [];
                changed = true;
            }
            if (!row.created_at) {
                row.created_at = now;
                changed = true;
            }
            if (!row.updated_at) {
                row.updated_at = now;
                changed = true;
            }
        });

        if (changed) DB.markDirty();
    },

    getMainDepot: () => ({
        id: 'main',
        key: 'managed:main',
        name: 'ANA DEPO',
        note: 'Kapali ana depo. Fiziksel raf ve hucre tanimlari burada tutulur.',
        kind: 'managed',
        editable: true,
        allowLocations: true
    }),

    getLocationCode: (location) => {
        const rafCode = String(location?.rafCode || '').trim().toUpperCase();
        const cellCode = String(location?.cellCode || '').trim().toUpperCase();
        if (rafCode && cellCode) return `${rafCode}-${cellCode}`;
        if (rafCode) return rafCode;
        return cellCode || '-';
    },

    normalizeLocationIdCode: (value) => String(value || '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '-')
        .replace(/[^A-Z0-9_-]/g, ''),

    getUsedLocationIdCodes: (options = {}) => {
        const excludeLocationId = String(options.excludeLocationId || '');
        const codes = new Set();
        (DB.data?.data?.stockDepotLocations || []).forEach((row) => {
            if (excludeLocationId && String(row?.id || '') === excludeLocationId) return;
            const code = StockModule.normalizeLocationIdCode(row?.idCode || '');
            if (code) codes.add(code);
        });
        (Array.isArray(StockModule.state?.depotDraftLocations) ? StockModule.state.depotDraftLocations : []).forEach((row) => {
            if (excludeLocationId && String(row?.id || '') === excludeLocationId) return;
            const code = StockModule.normalizeLocationIdCode(row?.idCode || '');
            if (code) codes.add(code);
        });
        return codes;
    },

    getNextLocationIdCode: (usedCodes = null) => {
        const used = usedCodes instanceof Set ? usedCodes : StockModule.getUsedLocationIdCodes();
        let seq = 1;
        let candidate = `LOC-${String(seq).padStart(6, '0')}`;
        while (used.has(candidate)) {
            seq += 1;
            candidate = `LOC-${String(seq).padStart(6, '0')}`;
        }
        return candidate;
    },

    resolveLocationIdCode: (rawCode, options = {}) => {
        const excludeLocationId = String(options.excludeLocationId || '');
        const used = StockModule.getUsedLocationIdCodes({ excludeLocationId });
        const normalized = StockModule.normalizeLocationIdCode(rawCode || '');
        if (normalized && !used.has(normalized)) return normalized;
        return StockModule.getNextLocationIdCode(used);
    },

    getDepotLocations: (depotId) => {
        return (DB.data.data.stockDepotLocations || [])
            .filter((row) => String(row?.depotId || '') === String(depotId || ''))
            .slice()
            .sort((a, b) => {
                const rafCmp = String(a?.rafCode || '').localeCompare(String(b?.rafCode || ''), 'tr');
                if (rafCmp !== 0) return rafCmp;
                return String(a?.cellCode || '').localeCompare(String(b?.cellCode || ''), 'tr');
            });
    },

    getCustomDepots: () => {
        const order = ['depot_granul', 'depot_profil', 'depot_mafsal', 'depot_transfer'];
        const rows = (DB.data.data.stockDepots || [])
            .filter((row) => row?.isActive !== false)
            .map((row) => ({
                ...row,
                key: `managed:${String(row?.id || '')}`,
                kind: 'managed',
                editable: true,
                allowLocations: true
            }));
        return rows.sort((a, b) => {
            const aIndex = order.indexOf(String(a?.id || ''));
            const bIndex = order.indexOf(String(b?.id || ''));
            if (aIndex !== -1 || bIndex !== -1) {
                return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
            }
            return String(a?.name || '').localeCompare(String(b?.name || ''), 'tr');
        });
    },

    getUnitRowsMeta: () => {
        const formatName = (name) => {
            const upper = String(name || '').trim().toUpperCase();
            if (upper.includes('EKSTRUDER')) return 'EKSTRUDER DEPO';
            if (upper.includes('TESTERE')) return 'TESTERE DEPO';
            if (upper.includes('PLEKSI')) return 'PLEKSI POLISAJ DEPO';
            if (upper.includes('CNC')) return 'CNC DEPO';
            if (upper.includes('MONTAJ')) return 'MONTAJ DEPO';
            return upper;
        };
        const rows = (DB.data?.data?.units || [])
            .filter((row) => String(row?.type || '') === 'internal')
            .filter((row) => String(row?.id || '') !== 'u_dtm')
            .map((row) => ({
                ...row,
                key: `unit:${String(row?.id || '')}`,
                name: formatName(row?.name || ''),
                note: 'Bu alan izleme ekranidir. Gerekirse raf / hucre tanimi yapilip stok gorunumu filtrelenebilir.',
                kind: 'unit',
                editable: false,
                allowLocations: true
            }));
        const ordered = ['EKSTRUDER', 'TESTERE', 'CNC', 'PLEKSI', 'MONTAJ'];
        return rows.sort((a, b) => {
            const aKey = ordered.findIndex((item) => String(a?.name || '').includes(item));
            const bKey = ordered.findIndex((item) => String(b?.name || '').includes(item));
            return (aKey === -1 ? 999 : aKey) - (bKey === -1 ? 999 : bKey);
        });
    },

    getExternalRowsMeta: () => {
        const rows = (DB.data?.data?.units || [])
            .filter((row) => String(row?.type || '') === 'external')
            .map((row) => ({
                ...row,
                key: `external:${String(row?.id || '')}`,
                name: String(row?.name || '').trim().toUpperCase(),
                note: 'Dis birim veya fason nokta. Izleme amacli gorunur; istenirse raf / hucre tanimi yapilabilir.',
                kind: 'external',
                editable: false,
                allowLocations: true
            }));
        const ordered = ['IBRAHIM POLISAJ', 'TEKIN ELOKSAL', 'HILAL PWD'];
        rows.sort((a, b) => {
            const aName = String(a?.name || '').trim().toUpperCase();
            const bName = String(b?.name || '').trim().toUpperCase();
            const aIdx = ordered.indexOf(aName);
            const bIdx = ordered.indexOf(bName);
            if (aIdx !== -1 || bIdx !== -1) {
                return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
            }
            return aName.localeCompare(bName, 'tr');
        });
        rows.push({
            id: 'free_external',
            key: 'external:free',
            name: 'SERBEST DIS FASON',
            note: 'Kayitli olmayan dis birim referansi.',
            kind: 'external',
            editable: false,
            allowLocations: true
        });
        return rows;
    },

    getSelectedNode: () => {
        const key = String(StockModule.state.selectedKey || 'all');
        if (key === 'all') {
            return { id: 'all', key: 'all', name: 'TUM DEPOLAR', note: 'Depo secilmediginde arama tum depolarda calisir.', kind: 'all', editable: false, allowLocations: false };
        }
        const nodes = [
            StockModule.getMainDepot(),
            ...StockModule.getCustomDepots(),
            ...StockModule.getUnitRowsMeta(),
            ...StockModule.getExternalRowsMeta()
        ];
        return nodes.find((row) => String(row?.key || '') === key) || StockModule.getMainDepot();
    },

    getOverviewSummary: () => {
        const managedIds = new Set(['main', ...StockModule.getCustomDepots().map((row) => String(row?.id || ''))]);
        return {
            managedCount: managedIds.size,
            locationCount: (DB.data.data.stockDepotLocations || []).length,
            unitCount: StockModule.getUnitRowsMeta().length,
            externalCount: StockModule.getExternalRowsMeta().length
        };
    },

    getManagedSummary: (depotId) => {
        const locations = StockModule.getDepotLocations(depotId);
        return {
            rafCount: new Set(locations.map((row) => String(row?.rafCode || '').trim().toUpperCase()).filter(Boolean)).size,
            locationCount: locations.length
        };
    },

    resolveInventoryNode: (raw) => {
        const nodeId = String(raw?.depotId || raw?.nodeId || raw?.unitId || raw?.stationId || '');
        const nodeKey = String(raw?.nodeKey || raw?.depotKey || raw?.key || '');
        const nodes = [
            StockModule.getMainDepot(),
            ...StockModule.getCustomDepots(),
            ...StockModule.getUnitRowsMeta(),
            ...StockModule.getExternalRowsMeta()
        ];
        return nodes.find((row) => String(row?.key || '') === nodeKey || String(row?.id || '') === nodeId) || null;
    },

    resolveScopeIdFromStockRow: (row) => {
        const direct = String(row?.depotId || row?.nodeId || '').trim();
        if (direct) return direct;
        const nodeKey = String(row?.nodeKey || row?.depotKey || row?.key || '').trim();
        if (nodeKey.startsWith('managed:')) return nodeKey.slice('managed:'.length);
        if (nodeKey.startsWith('unit:') || nodeKey.startsWith('external:')) return nodeKey;
        const unitId = String(row?.unitId || row?.stationId || '').trim();
        if (unitId) return `unit:${unitId}`;
        return '';
    },

    resolveNodeKeyFromScopeId: (scopeId) => {
        const key = String(scopeId || '').trim();
        if (!key) return '';
        if (key.startsWith('unit:') || key.startsWith('external:')) return key;
        return `managed:${key}`;
    },

    getScopeNameById: (scopeId) => {
        const key = String(scopeId || '').trim();
        if (!key) return '-';
        const nodes = [
            StockModule.getMainDepot(),
            ...StockModule.getCustomDepots(),
            ...StockModule.getUnitRowsMeta(),
            ...StockModule.getExternalRowsMeta()
        ];
        const hit = nodes.find((row) => String(row?.id || '') === key || String(row?.key || '') === key) || null;
        return String(hit?.name || key).trim() || key;
    },

    getStockRowQty: (row) => {
        const num = Number(row?.quantity ?? row?.qty ?? row?.amount ?? 0);
        if (!Number.isFinite(num)) return 0;
        return Math.max(0, Number(num.toFixed(3)));
    },

    setStockRowQty: (row, qty) => {
        const safeQty = Math.max(0, Number(Number(qty || 0).toFixed(3)));
        row.quantity = safeQty;
        row.qty = safeQty;
        row.amount = safeQty;
        row.updated_at = new Date().toISOString();
    },

    getLocationLabel: (locationRow) => {
        if (!locationRow) return '-';
        const code = String(StockModule.getLocationCode(locationRow) || '').trim().toUpperCase() || '-';
        const idCode = String(StockModule.normalizeLocationIdCode(locationRow?.idCode || '') || '-');
        return `${code} | ID:${idCode}`;
    },

    getTransferScopeOptions: () => {
        const scopes = new Set(
            (Array.isArray(DB.data?.data?.stockDepotLocations) ? DB.data.data.stockDepotLocations : [])
                .map((row) => String(row?.depotId || '').trim())
                .filter(Boolean)
        );
        return Array.from(scopes)
            .map((scopeId) => ({
                scopeId,
                name: StockModule.getScopeNameById(scopeId)
            }))
            .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'tr'));
    },

    findLocationByIdCodeOrCode: (rawValue) => {
        const value = String(rawValue || '').trim();
        if (!value) return null;
        const normalizedIdCode = StockModule.normalizeLocationIdCode(value);
        const normalizedCode = String(value || '').trim().toUpperCase();
        const rows = Array.isArray(DB.data?.data?.stockDepotLocations) ? DB.data.data.stockDepotLocations : [];
        return rows.find((row) => {
            const rowIdCode = StockModule.normalizeLocationIdCode(row?.idCode || '');
            if (normalizedIdCode && rowIdCode === normalizedIdCode) return true;
            const rowCode = String(StockModule.getLocationCode(row) || '').trim().toUpperCase();
            return !!normalizedCode && rowCode === normalizedCode;
        }) || null;
    },

    refreshInventoryTransferLocationOptions: () => {
        const depotSelect = document.getElementById('stock-transfer-target-scope');
        const locationSelect = document.getElementById('stock-transfer-target-location');
        if (!depotSelect || !locationSelect) return;
        const selectedScopeId = String(depotSelect.value || '').trim();
        const selectedBefore = String(locationSelect.value || '').trim();
        const locations = StockModule.getDepotLocations(selectedScopeId);
        const optionsHtml = locations.length === 0
            ? '<option value="">Bu depoda hucre yok</option>'
            : ['<option value="">Hucre sec</option>']
                .concat(locations.map((row) => {
                    const id = String(row?.id || '').trim();
                    return `<option value="${StockModule.escapeHtml(id)}">${StockModule.escapeHtml(StockModule.getLocationLabel(row))}</option>`;
                }))
                .join('');
        locationSelect.innerHTML = optionsHtml;
        if (selectedBefore && locations.some((row) => String(row?.id || '').trim() === selectedBefore)) {
            locationSelect.value = selectedBefore;
        }
    },

    updateInventoryTransferModeUi: () => {
        const modeSelect = document.getElementById('stock-transfer-mode');
        const bySelectWrap = document.getElementById('stock-transfer-by-select');
        const byIdCodeWrap = document.getElementById('stock-transfer-by-idcode');
        if (!modeSelect || !bySelectWrap || !byIdCodeWrap) return;
        const mode = String(modeSelect.value || 'select').trim();
        const useIdCode = mode === 'idcode';
        bySelectWrap.style.display = useIdCode ? 'none' : '';
        byIdCodeWrap.style.display = useIdCode ? '' : 'none';
    },

    onInventoryTransferModeChange: () => {
        StockModule.updateInventoryTransferModeUi();
    },

    onInventoryTransferDepotChange: () => {
        StockModule.refreshInventoryTransferLocationOptions();
    },

    submitInventoryTransferFromModal: async (sourceRowId, sourceCode) => {
        const sourceId = String(sourceRowId || '').trim();
        const sourceCodeText = String(sourceCode || '').trim();
        if (!sourceId || !sourceCodeText) return alert('Transfer kaynagi bulunamadi.');
        const stockRows = Array.isArray(DB.data?.data?.stockDepotItems) ? DB.data.data.stockDepotItems : [];
        const sourceRow = stockRows.find((row) => String(row?.id || '') === sourceId) || null;
        if (!sourceRow) return alert('Kaynak stok satiri bulunamadi.');

        const sourceQty = StockModule.getStockRowQty(sourceRow);
        if (sourceQty <= 0) return alert('Kaynak satirda transfer edilecek stok yok.');
        const sourceStatusMeta = StockModule.getInventoryRowStatusMeta(sourceRow || {});
        if (sourceStatusMeta.key !== 'available') {
            return alert('Bu adimda sadece kullanilabilir stok transferine izin verilir.');
        }

        const qtyRaw = Number(document.getElementById('stock-transfer-qty')?.value || 0);
        const transferQty = Math.max(0, Math.floor(qtyRaw));
        if (!Number.isFinite(transferQty) || transferQty <= 0) return alert('Transfer adedi 0 dan buyuk olmali.');
        if (transferQty > sourceQty) return alert(`Kaynak stok yetersiz. Maksimum: ${sourceQty}`);

        const mode = String(document.getElementById('stock-transfer-mode')?.value || 'select').trim();
        let targetLocation = null;
        if (mode === 'idcode') {
            const locationInput = String(document.getElementById('stock-transfer-target-idcode')?.value || '').trim();
            targetLocation = StockModule.findLocationByIdCodeOrCode(locationInput);
            if (!targetLocation) return alert('Hedef hucre ID kodu / konumu bulunamadi.');
        } else {
            const targetScopeId = String(document.getElementById('stock-transfer-target-scope')?.value || '').trim();
            const targetLocationId = String(document.getElementById('stock-transfer-target-location')?.value || '').trim();
            if (!targetScopeId) return alert('Hedef depo seciniz.');
            if (!targetLocationId) return alert('Hedef hucre seciniz.');
            targetLocation = (Array.isArray(DB.data?.data?.stockDepotLocations) ? DB.data.data.stockDepotLocations : [])
                .find((row) => String(row?.id || '').trim() === targetLocationId && String(row?.depotId || '').trim() === targetScopeId) || null;
            if (!targetLocation) return alert('Hedef hucre bulunamadi.');
        }

        const sourceScopeId = StockModule.resolveScopeIdFromStockRow(sourceRow);
        const sourceLocationId = String(sourceRow?.locationId || '').trim();
        const sourceLocationCode = String(sourceRow?.locationCode || '').trim().toUpperCase();
        const targetScopeId = String(targetLocation?.depotId || '').trim();
        const targetLocationId = String(targetLocation?.id || '').trim();
        const targetLocationCode = String(StockModule.getLocationCode(targetLocation) || '').trim().toUpperCase();

        if (!targetScopeId || !targetLocationId) return alert('Hedef lokasyon gecersiz.');
        const sameScope = sourceScopeId === targetScopeId;
        const sameLocation = sourceLocationId
            ? sourceLocationId === targetLocationId
            : (!!sourceLocationCode && sourceLocationCode === targetLocationCode);
        if (sameScope && sameLocation) return alert('Kaynak ve hedef ayni lokasyon olamaz.');

        const normalizedCode = StockModule.normalize(sourceRow?.productCode || sourceRow?.code || sourceCodeText);
        const sourceStockClass = StockModule.normalizeStockClass(sourceRow?.stockClass || sourceRow?.status || 'KULLANILABILIR');
        const sourceStatus = String(sourceRow?.status || 'KULLANILABILIR').trim() || 'KULLANILABILIR';
        const targetNodeKey = StockModule.resolveNodeKeyFromScopeId(targetScopeId);
        const targetUnitRawId = targetScopeId.startsWith('unit:') ? targetScopeId.slice('unit:'.length) : '';

        const targetRow = stockRows.find((row) => {
            if (StockModule.normalize(row?.productCode || row?.code || '') !== normalizedCode) return false;
            if (StockModule.normalizeStockClass(row?.stockClass || row?.status || 'KULLANILABILIR') !== sourceStockClass) return false;
            const rowScopeId = StockModule.resolveScopeIdFromStockRow(row);
            if (rowScopeId !== targetScopeId) return false;
            return String(row?.locationId || '').trim() === targetLocationId;
        }) || null;

        StockModule.setStockRowQty(sourceRow, sourceQty - transferQty);
        const now = new Date().toISOString();
        const unitText = String(sourceRow?.unit || 'ADET').trim() || 'ADET';
        if (targetRow) {
            StockModule.setStockRowQty(targetRow, StockModule.getStockRowQty(targetRow) + transferQty);
        } else {
            stockRows.push({
                id: crypto.randomUUID(),
                productId: String(sourceRow?.productId || ''),
                productCode: String(sourceRow?.productCode || sourceRow?.code || sourceCodeText).trim().toUpperCase(),
                code: String(sourceRow?.code || sourceRow?.productCode || sourceCodeText).trim().toUpperCase(),
                productName: String(sourceRow?.productName || sourceRow?.name || '').trim(),
                name: String(sourceRow?.name || sourceRow?.productName || '').trim(),
                quantity: transferQty,
                qty: transferQty,
                amount: transferQty,
                unit: unitText,
                stockClass: sourceStockClass,
                status: sourceStatus,
                productType: String(sourceRow?.productType || sourceRow?.type || '').trim(),
                modelCode: String(sourceRow?.modelCode || '').trim(),
                planCodeId: String(sourceRow?.planCodeId || '').trim(),
                masterCode: String(sourceRow?.masterCode || '').trim(),
                note: String(sourceRow?.note || '').trim(),
                depotId: targetScopeId,
                nodeKey: targetNodeKey,
                locationId: targetLocationId,
                locationCode: targetLocationCode,
                unitId: targetUnitRawId || undefined,
                stationId: targetUnitRawId || undefined,
                created_at: now,
                updated_at: now
            });
        }

        if (!Array.isArray(DB.data?.data?.stock_movements)) DB.data.data.stock_movements = [];
        DB.data.data.stock_movements.push({
            id: crypto.randomUUID(),
            movementType: 'TRANSFER',
            type: 'TRANSFER',
            productCode: String(sourceRow?.productCode || sourceRow?.code || sourceCodeText).trim().toUpperCase(),
            code: String(sourceRow?.code || sourceRow?.productCode || sourceCodeText).trim().toUpperCase(),
            productName: String(sourceRow?.productName || sourceRow?.name || '').trim(),
            quantity: transferQty,
            qty: transferQty,
            unit: unitText,
            sourceDepotId: sourceScopeId,
            sourceDepotName: StockModule.getScopeNameById(sourceScopeId),
            sourceLocationId: sourceLocationId,
            sourceLocationCode: sourceLocationCode || '-',
            targetDepotId: targetScopeId,
            targetDepotName: StockModule.getScopeNameById(targetScopeId),
            targetLocationId: targetLocationId,
            targetLocationCode: targetLocationCode || '-',
            depotId: targetScopeId,
            depotName: StockModule.getScopeNameById(targetScopeId),
            note: `Depo/raf transferi: ${sourceLocationCode || '-'} -> ${targetLocationCode || '-'}`,
            created_at: now,
            updated_at: now
        });

        await DB.save();
        UI.renderCurrentPage();
        StockModule.openInventoryRowHistory(sourceCodeText, sourceId);
        alert('Transfer tamamlandi.');
    },
    normalizeStockClass: (value) => {
        const raw = String(value || '').trim().toUpperCase();
        if (raw === 'WIP' || raw === 'ISLEMDE') return 'WIP';
        return 'KULLANILABILIR';
    },
    getWorkflowWipRows: () => {
        if (typeof UnitModule === 'undefined' || !UnitModule || typeof UnitModule.computeWorkLineRouteMetrics !== 'function') return [];
        const orders = Array.isArray(DB.data?.data?.workOrders) ? DB.data.data.workOrders : [];
        const txns = Array.isArray(DB.data?.data?.workOrderTransactions) ? DB.data.data.workOrderTransactions : [];
        const rows = [];
        orders.forEach((order) => {
            const lines = Array.isArray(order?.lines) ? order.lines : [];
            lines.forEach((line) => {
                const routes = Array.isArray(line?.routes) ? line.routes : [];
                routes.forEach((_route, idx) => {
                    const metrics = UnitModule.computeWorkLineRouteMetrics(order, line, idx, txns);
                    if (!metrics) return;
                    const inProcessQty = Math.max(0, Math.floor(Number(metrics?.inProcessQty || 0)));
                    if (inProcessQty <= 0) return;
                    const stationId = String(metrics?.stationId || '').trim();
                    if (!stationId) return;
                    const node = StockModule.resolveInventoryNode({ stationId }) || null;
                    rows.push({
                        id: `wip_${String(order?.id || '')}_${String(line?.id || '')}_${String(metrics?.routeSeq || idx + 1)}`,
                        name: String(line?.componentName || order?.productName || '-').trim(),
                        code: String(line?.componentCode || order?.productCode || '-').trim(),
                        quantity: inProcessQty,
                        unit: 'adet',
                        status: 'ISLEMDE OLANLAR',
                        stockClass: 'WIP',
                        productType: 'WIP',
                        modelCode: '',
                        planCodeId: '',
                        masterCode: '',
                        note: `Is emri: ${String(order?.workOrderCode || '-')} | Rota: ${Number(metrics?.routeSeq || idx + 1)}`,
                        locationCode: `ROTA-${Number(metrics?.routeSeq || idx + 1)}`,
                        depotNode: node,
                        depotName: node?.name || String(metrics?.stationName || stationId || '-'),
                        searchMeta: {
                            productId: '',
                            productCode: String(line?.componentCode || order?.productCode || '').trim(),
                            productName: String(line?.componentName || order?.productName || '').trim(),
                            productCategory: '',
                            productBrandModel: '',
                            partCardCode: '',
                            partCardName: '',
                            partCardGroup: '',
                            partCardSubGroup: '',
                            semiCardCode: '',
                            semiCardName: '',
                            semiCardGroup: '',
                            semiCardSubGroup: '',
                            locationId: '',
                            depotId: String(node?.id || '')
                        }
                    });
                });
            });
        });
        const grouped = new Map();
        rows.forEach((row) => {
            const key = [
                String(row?.depotNode?.key || ''),
                String(row?.code || ''),
                String(row?.stockClass || ''),
                String(row?.status || ''),
                String(row?.locationCode || '')
            ].join('|');
            if (!grouped.has(key)) {
                grouped.set(key, { ...row });
                return;
            }
            const prev = grouped.get(key);
            prev.quantity = Math.max(0, Math.floor(Number(prev?.quantity || 0)) + Math.floor(Number(row?.quantity || 0)));
            grouped.set(key, prev);
        });
        return Array.from(grouped.values());
    },

    getInventoryRows: () => {
        const products = Array.isArray(DB.data?.data?.products) ? DB.data.data.products : [];
        const productById = new Map(products.map((row) => [String(row?.id || ''), row]));
        const productByCode = new Map(
            products
                .map((row) => [StockModule.normalize(row?.code), row])
                .filter(([key]) => !!key)
        );
        const partCards = Array.isArray(DB.data?.data?.partComponentCards) ? DB.data.data.partComponentCards : [];
        const semiCards = Array.isArray(DB.data?.data?.semiFinishedCards) ? DB.data.data.semiFinishedCards : [];
        const partByCode = new Map(
            partCards
                .map((row) => [StockModule.normalize(row?.code), row])
                .filter(([key]) => !!key)
        );
        const semiByCode = new Map(
            semiCards
                .map((row) => [StockModule.normalize(row?.code), row])
                .filter(([key]) => !!key)
        );
        const locationMap = new Map((DB.data.data.stockDepotLocations || []).map((row) => [String(row?.id || ''), row]));
        const stockRows = (DB.data.data.stockDepotItems || []).map((raw) => {
            const rawProductId = String(raw?.productId || '');
            const rawCode = String(raw?.productCode || raw?.code || '').trim();
            const normalizedCode = StockModule.normalize(rawCode);
            const product = (rawProductId ? productById.get(rawProductId) : null) || productByCode.get(normalizedCode) || null;
            const partCard = partByCode.get(normalizedCode) || null;
            const semiCard = semiByCode.get(normalizedCode) || null;
            const node = StockModule.resolveInventoryNode(raw);
            const location = locationMap.get(String(raw?.locationId || '')) || null;
            const quantity = raw?.quantity ?? raw?.qty ?? raw?.amount ?? '';
            const stockClass = StockModule.normalizeStockClass(raw?.stockClass || raw?.status || 'KULLANILABILIR');
            const status = String(raw?.status || '').trim() || (stockClass === 'WIP' ? 'ISLEMDE OLANLAR' : 'KULLANILABILIR');
            const locationCode = raw?.locationCode
                ? String(raw.locationCode)
                : location
                    ? StockModule.getLocationCode(location)
                    : [raw?.rafCode, raw?.cellCode].filter(Boolean).join('-');
            const modelCode = String(raw?.modelCode || raw?.modelId || product?.specs?.brandModel || '').trim();
            const planCodeId = String(raw?.planCodeId || raw?.planCode || raw?.planId || product?.planCodeId || product?.specs?.planCodeId || '').trim();
            const masterCode = String(raw?.masterCode || partCard?.masterCode || semiCard?.masterCode || product?.supplierProductCode || '').trim();
            const productType = String(
                raw?.productType
                || raw?.type
                || (semiCard ? 'YARI MAMUL' : '')
                || (partCard ? 'PARCA/BILESEN' : '')
                || product?.type
                || ''
            ).trim();
            return {
                id: String(raw?.id || product?.id || ''),
                name: String(raw?.productName || raw?.name || product?.name || '').trim(),
                code: String(rawCode || product?.code || '').trim(),
                quantity,
                unit: String(raw?.unit || product?.unit || product?.specs?.unit || '').trim(),
                status,
                stockClass,
                productType,
                modelCode,
                planCodeId,
                masterCode,
                note: String(raw?.note || '').trim(),
                locationCode,
                depotNode: node,
                depotName: node?.name || String(raw?.depotName || '-'),
                searchMeta: {
                    productId: String(product?.id || rawProductId || ''),
                    productCode: String(product?.code || rawCode || ''),
                    productName: String(product?.name || ''),
                    productCategory: String(product?.category || ''),
                    productBrandModel: String(product?.specs?.brandModel || ''),
                    partCardCode: String(partCard?.code || ''),
                    partCardName: String(partCard?.name || ''),
                    partCardGroup: String(partCard?.group || ''),
                    partCardSubGroup: String(partCard?.subGroup || ''),
                    semiCardCode: String(semiCard?.code || ''),
                    semiCardName: String(semiCard?.name || ''),
                    semiCardGroup: String(semiCard?.group || ''),
                    semiCardSubGroup: String(semiCard?.subGroup || ''),
                    locationId: String(raw?.locationId || ''),
                    depotId: String(raw?.depotId || raw?.nodeId || ''),
                    unitId: String(raw?.unitId || raw?.stationId || ((node?.kind === 'unit' || node?.kind === 'external') ? node?.id : '') || '')
                }
            };
        });
        return [...stockRows, ...StockModule.getWorkflowWipRows()];
    },

    getFilteredInventoryRows: (node) => {
        const query = StockModule.normalize(StockModule.state.searchQuery || StockModule.state.searchName || StockModule.state.searchCode);
        const targetKey = String(node?.key || 'all');
        const scopedRows = StockModule.getInventoryRows().filter((row) => {
            if (targetKey !== 'all' && String(row?.depotNode?.key || '') !== targetKey) return false;
            return true;
        });
        const activeLocationFilter = StockModule.getInventoryLocationFilterForNode(node);
        const locationFilteredRows = !activeLocationFilter
            ? scopedRows
            : scopedRows.filter((row) => {
                const rowLocationId = String(row?.searchMeta?.locationId || '').trim();
                const rowLocationCode = String(row?.locationCode || '').trim().toUpperCase();
                if (activeLocationFilter.locationId) {
                    if (rowLocationId && rowLocationId === activeLocationFilter.locationId) return true;
                    if (!rowLocationId && activeLocationFilter.locationCode) {
                        return rowLocationCode === activeLocationFilter.locationCode;
                    }
                    return false;
                }
                if (activeLocationFilter.locationCode) return rowLocationCode === activeLocationFilter.locationCode;
                return true;
            });
        if (!query) return locationFilteredRows;
        return locationFilteredRows
            .map((row) => {
                const match = StockModule.getInventorySearchMatch(row, query);
                return { ...row, searchScore: match.score, searchMatchLabel: match.label, searchMatched: !!match.matched };
            })
            .filter((row) => row.searchMatched)
            .sort((a, b) => {
                if (Number(b?.searchScore || 0) !== Number(a?.searchScore || 0)) {
                    return Number(b?.searchScore || 0) - Number(a?.searchScore || 0);
                }
                const nameCmp = String(a?.name || '').localeCompare(String(b?.name || ''), 'tr');
                if (nameCmp !== 0) return nameCmp;
                return String(a?.code || '').localeCompare(String(b?.code || ''), 'tr');
            });
    },

    getInventoryGroups: (node) => {
        const rows = StockModule.getFilteredInventoryRows(node);
        if (String(node?.key || '') !== 'all') {
            return [{ key: String(node?.key || 'single'), title: String(node?.name || '-'), rows }];
        }
        const map = new Map();
        rows.forEach((row) => {
            const key = String(row?.depotNode?.key || 'unknown');
            const title = String(row?.depotNode?.name || row?.depotName || 'Bilinmeyen depo');
            if (!map.has(key)) map.set(key, { key, title, rows: [] });
            map.get(key).rows.push(row);
        });
        return Array.from(map.values()).sort((a, b) => String(a?.title || '').localeCompare(String(b?.title || ''), 'tr'));
    },

    openWorkspace: (viewId) => {
        StockModule.state.workspaceView = String(viewId || 'menu');
        if (String(viewId || '') === 'goods-receipt') StockModule.ensureGoodsReceiptDraftState();
        UI.renderCurrentPage();
    },

    normalizeGoodsReceiptStatus: (value) => {
        const raw = String(value || '').trim().toUpperCase();
        if (raw === 'ONAYLI') return 'ONAYLANDI';
        if (raw === 'ONAYLANDI') return 'ONAYLANDI';
        if (raw === 'IPTAL') return 'IPTAL';
        return 'TASLAK';
    },

    getGoodsReceiptStatusMeta: (status) => {
        const key = StockModule.normalizeGoodsReceiptStatus(status);
        if (key === 'ONAYLANDI') return { key, text: 'Onaylandi', color: '#065f46', bg: '#d1fae5', border: '#6ee7b7' };
        if (key === 'IPTAL') return { key, text: 'Iptal', color: '#991b1b', bg: '#fee2e2', border: '#fecaca' };
        return { key: 'TASLAK', text: 'Taslak', color: '#1e3a8a', bg: '#dbeafe', border: '#bfdbfe' };
    },

    getGoodsReceiptSupplierOptions: () => {
        return (Array.isArray(DB.data?.data?.suppliers) ? DB.data.data.suppliers : [])
            .map((row) => ({
                id: String(row?.id || '').trim(),
                name: String(row?.name || '').trim()
            }))
            .filter((row) => row.id && row.name)
            .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'tr'));
    },

    getGoodsReceiptDepotOptions: () => {
        return [StockModule.getMainDepot(), ...StockModule.getCustomDepots()]
            .map((row) => ({
                id: String(row?.id || '').trim(),
                name: String(row?.name || '').trim()
            }))
            .filter((row) => row.id && row.name);
    },

    getGoodsReceiptProductOptions: () => {
        const products = Array.isArray(DB.data?.data?.products) ? DB.data.data.products : [];
        return products
            .map((row) => {
                const id = String(row?.id || '').trim();
                const code = String(row?.code || '').trim().toUpperCase();
                const name = String(row?.name || '').trim();
                const unitRaw = String(row?.specs?.unit || row?.unit || row?.unitAmountType || 'adet').trim();
                const unit = unitRaw ? unitRaw.toUpperCase() : 'ADET';
                return { id, code, name, unit };
            })
            .filter((row) => row.id && row.code && row.name)
            .sort((a, b) => {
                const codeCmp = String(a?.code || '').localeCompare(String(b?.code || ''), 'tr');
                if (codeCmp !== 0) return codeCmp;
                return String(a?.name || '').localeCompare(String(b?.name || ''), 'tr');
            });
    },

    getGoodsReceiptLocationOptions: (depotId) => {
        return StockModule.getDepotLocations(depotId).map((row) => ({
            id: String(row?.id || '').trim(),
            code: String(StockModule.getLocationCode(row) || '').trim().toUpperCase(),
            label: StockModule.getLocationLabel(row)
        }));
    },

    normalizeGoodsReceiptQty: (value, unit = '') => {
        const num = Number(String(value ?? '').replace(',', '.'));
        if (!Number.isFinite(num) || num <= 0) return 0;
        const unitText = String(unit || '').trim().toUpperCase();
        if (unitText === 'ADET' || unitText === 'PCS') return Math.floor(num);
        return Math.max(0, Number(num.toFixed(3)));
    },

    getGoodsReceiptQtyStep: (unit = '') => {
        const unitText = String(unit || '').trim().toUpperCase();
        if (unitText === 'ADET' || unitText === 'PCS') return '1';
        return '0.001';
    },

    buildEmptyGoodsReceiptLine: (seed = {}) => ({
        id: String(seed?.id || crypto.randomUUID()),
        productId: String(seed?.productId || '').trim(),
        productCode: String(seed?.productCode || '').trim().toUpperCase(),
        productName: String(seed?.productName || '').trim(),
        unit: String(seed?.unit || 'ADET').trim().toUpperCase(),
        acceptedQty: StockModule.normalizeGoodsReceiptQty(seed?.acceptedQty || 0, seed?.unit || 'ADET'),
        damagedQty: StockModule.normalizeGoodsReceiptQty(seed?.damagedQty || 0, seed?.unit || 'ADET'),
        missingQty: StockModule.normalizeGoodsReceiptQty(seed?.missingQty || 0, seed?.unit || 'ADET'),
        locationId: String(seed?.locationId || '').trim(),
        locationCode: String(seed?.locationCode || '').trim().toUpperCase(),
        damageNote: String(seed?.damageNote || '').trim()
    }),

    generateGoodsReceiptDocNo: (dateLike = new Date()) => {
        const date = dateLike instanceof Date ? dateLike : new Date(dateLike || Date.now());
        const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
        const rows = Array.isArray(DB.data?.data?.stockGoodsReceipts) ? DB.data.data.stockGoodsReceipts : [];
        let maxSeq = 0;
        rows.forEach((row) => {
            const docNo = String(row?.docNo || '').trim().toUpperCase();
            const match = docNo.match(/^MK-(\d{4})-(\d{6})$/);
            if (!match) return;
            const docYear = Number(match[1] || 0);
            const seq = Number(match[2] || 0);
            if (docYear !== year) return;
            if (seq > maxSeq) maxSeq = seq;
        });
        return `MK-${year}-${String(maxSeq + 1).padStart(6, '0')}`;
    },

    buildEmptyGoodsReceiptDraft: (seed = {}) => {
        const now = new Date();
        const isoNow = now.toISOString();
        const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        const defaultDepot = StockModule.getGoodsReceiptDepotOptions()[0] || { id: 'main', name: 'ANA DEPO' };
        const docNo = String(seed?.docNo || '').trim() || StockModule.generateGoodsReceiptDocNo(now);
        const status = StockModule.normalizeGoodsReceiptStatus(seed?.status || 'TASLAK');
        const linesSeed = Array.isArray(seed?.lines) ? seed.lines : [StockModule.buildEmptyGoodsReceiptLine()];
        const lines = linesSeed.map((line) => StockModule.buildEmptyGoodsReceiptLine(line));
        const supplierId = String(seed?.supplierId || '').trim();
        const supplierName = String(seed?.supplierName || '').trim();
        const depotId = String(seed?.depotId || defaultDepot.id || 'main').trim() || 'main';
        const depotName = String(seed?.depotName || '').trim() || StockModule.getScopeNameById(depotId);
        return {
            id: String(seed?.id || '').trim(),
            docNo,
            status,
            poId: String(seed?.poId || '').trim(),
            poNo: String(seed?.poNo || '').trim(),
            dispatchNo: String(seed?.dispatchNo || '').trim(),
            receiptDate: String(seed?.receiptDate || localDate).trim() || localDate,
            supplierId,
            supplierName,
            depotId,
            depotName,
            receiverName: String(seed?.receiverName || '').trim(),
            note: String(seed?.note || '').trim(),
            lines,
            created_at: String(seed?.created_at || isoNow),
            updated_at: String(seed?.updated_at || isoNow),
            approved_at: seed?.approved_at || null,
            cancelled_at: seed?.cancelled_at || null,
            created_by: String(seed?.created_by || 'Demo User')
        };
    },

    ensureGoodsReceiptDraftState: () => {
        if (StockModule.state.goodsReceiptDraft && typeof StockModule.state.goodsReceiptDraft === 'object') return;
        StockModule.state.goodsReceiptDraft = StockModule.buildEmptyGoodsReceiptDraft();
        StockModule.state.goodsReceiptEditingId = String(StockModule.state.goodsReceiptDraft?.id || '') || null;
    },

    getGoodsReceiptTotals: (lines) => {
        const rows = Array.isArray(lines) ? lines : [];
        return rows.reduce((acc, line) => {
            const accepted = StockModule.normalizeGoodsReceiptQty(line?.acceptedQty || 0, line?.unit || 'ADET');
            const damaged = StockModule.normalizeGoodsReceiptQty(line?.damagedQty || 0, line?.unit || 'ADET');
            const missing = StockModule.normalizeGoodsReceiptQty(line?.missingQty || 0, line?.unit || 'ADET');
            acc.accepted += accepted;
            acc.damaged += damaged;
            acc.missing += missing;
            return acc;
        }, { accepted: 0, damaged: 0, missing: 0 });
    },

    setGoodsReceiptFilter: (field, value) => {
        const current = (StockModule.state.goodsReceiptFilters && typeof StockModule.state.goodsReceiptFilters === 'object')
            ? StockModule.state.goodsReceiptFilters
            : {};
        current[String(field || '')] = String(value || '');
        StockModule.state.goodsReceiptFilters = current;
        UI.renderCurrentPage();
    },

    setGoodsReceiptDraftField: (field, value) => {
        StockModule.ensureGoodsReceiptDraftState();
        const draft = StockModule.state.goodsReceiptDraft;
        const key = String(field || '').trim();
        const text = String(value ?? '');
        if (!draft || !key) return;
        if (key === 'supplierId') {
            draft.supplierId = text.trim();
            const supplier = StockModule.getGoodsReceiptSupplierOptions().find((row) => row.id === draft.supplierId) || null;
            draft.supplierName = String(supplier?.name || '').trim();
        } else if (key === 'depotId') {
            const prevDepot = String(draft.depotId || '').trim();
            draft.depotId = text.trim() || 'main';
            draft.depotName = StockModule.getScopeNameById(draft.depotId);
            if (prevDepot && prevDepot !== draft.depotId) {
                draft.lines = (Array.isArray(draft.lines) ? draft.lines : []).map((line) => ({
                    ...line,
                    locationId: '',
                    locationCode: ''
                }));
            }
        } else {
            draft[key] = text;
        }
        UI.renderCurrentPage();
    },

    addGoodsReceiptLine: () => {
        StockModule.ensureGoodsReceiptDraftState();
        const draft = StockModule.state.goodsReceiptDraft;
        if (!Array.isArray(draft.lines)) draft.lines = [];
        draft.lines.push(StockModule.buildEmptyGoodsReceiptLine());
        UI.renderCurrentPage();
    },

    removeGoodsReceiptLine: (lineId) => {
        StockModule.ensureGoodsReceiptDraftState();
        const draft = StockModule.state.goodsReceiptDraft;
        const id = String(lineId || '').trim();
        const lines = Array.isArray(draft.lines) ? draft.lines : [];
        if (lines.length <= 1) {
            alert('En az bir satir kalmali.');
            return;
        }
        draft.lines = lines.filter((line) => String(line?.id || '') !== id);
        UI.renderCurrentPage();
    },

    setGoodsReceiptLineField: (lineId, field, value) => {
        StockModule.ensureGoodsReceiptDraftState();
        const draft = StockModule.state.goodsReceiptDraft;
        const line = (Array.isArray(draft.lines) ? draft.lines : []).find((row) => String(row?.id || '') === String(lineId || ''));
        if (!line) return;
        const key = String(field || '').trim();
        if (!key) return;

        if (key === 'productId') {
            const productId = String(value || '').trim();
            line.productId = productId;
            const product = StockModule.getGoodsReceiptProductOptions().find((row) => row.id === productId) || null;
            line.productCode = String(product?.code || '').trim().toUpperCase();
            line.productName = String(product?.name || '').trim();
            line.unit = String(product?.unit || line.unit || 'ADET').trim().toUpperCase();
            line.acceptedQty = StockModule.normalizeGoodsReceiptQty(line.acceptedQty || 0, line.unit);
            line.damagedQty = StockModule.normalizeGoodsReceiptQty(line.damagedQty || 0, line.unit);
            line.missingQty = StockModule.normalizeGoodsReceiptQty(line.missingQty || 0, line.unit);
        } else if (key === 'locationId') {
            const locationId = String(value || '').trim();
            line.locationId = locationId;
            const depotId = String(draft.depotId || '').trim() || 'main';
            const location = StockModule.getGoodsReceiptLocationOptions(depotId).find((row) => row.id === locationId) || null;
            line.locationCode = String(location?.code || '').trim().toUpperCase();
        } else if (key === 'acceptedQty' || key === 'damagedQty' || key === 'missingQty') {
            line[key] = StockModule.normalizeGoodsReceiptQty(value, line?.unit || 'ADET');
        } else if (key === 'damageNote') {
            line.damageNote = String(value || '').trim();
        } else {
            line[key] = String(value || '');
        }
        UI.renderCurrentPage();
    },

    resetGoodsReceiptDraft: () => {
        StockModule.state.goodsReceiptEditingId = null;
        StockModule.state.goodsReceiptDraft = StockModule.buildEmptyGoodsReceiptDraft();
        UI.renderCurrentPage();
    },

    openGoodsReceiptRecord: (recordId) => {
        const id = String(recordId || '').trim();
        const rows = Array.isArray(DB.data?.data?.stockGoodsReceipts) ? DB.data.data.stockGoodsReceipts : [];
        const record = rows.find((row) => String(row?.id || '') === id) || null;
        if (!record) return alert('Mal kabul fisi bulunamadi.');
        StockModule.state.goodsReceiptEditingId = id;
        StockModule.state.goodsReceiptDraft = StockModule.buildEmptyGoodsReceiptDraft(record);
        UI.renderCurrentPage();
    },

    getGoodsReceiptRecordById: (recordId) => {
        const id = String(recordId || '').trim();
        const rows = Array.isArray(DB.data?.data?.stockGoodsReceipts) ? DB.data.data.stockGoodsReceipts : [];
        return rows.find((row) => String(row?.id || '') === id) || null;
    },

    getGoodsReceiptRecords: () => {
        const rows = Array.isArray(DB.data?.data?.stockGoodsReceipts) ? DB.data.data.stockGoodsReceipts : [];
        return rows.slice().sort((a, b) => {
            const aTime = new Date(a?.receiptDate || a?.created_at || 0).getTime();
            const bTime = new Date(b?.receiptDate || b?.created_at || 0).getTime();
            return bTime - aTime;
        });
    },

    getFilteredGoodsReceiptRecords: () => {
        const filters = (StockModule.state.goodsReceiptFilters && typeof StockModule.state.goodsReceiptFilters === 'object')
            ? StockModule.state.goodsReceiptFilters
            : {};
        const docNoFilter = StockModule.normalize(filters.docNo || '');
        const supplierFilter = String(filters.supplierId || '').trim();
        const depotFilter = String(filters.depotId || '').trim();
        const statusFilter = StockModule.normalizeGoodsReceiptStatus(filters.status || '');
        const dateFrom = String(filters.dateFrom || '').trim();
        const dateTo = String(filters.dateTo || '').trim();
        return StockModule.getGoodsReceiptRecords().filter((row) => {
            if (docNoFilter && !StockModule.normalize(row?.docNo || '').includes(docNoFilter)) return false;
            if (supplierFilter && String(row?.supplierId || '') !== supplierFilter) return false;
            if (depotFilter && String(row?.depotId || '') !== depotFilter) return false;
            if (filters.status && StockModule.normalizeGoodsReceiptStatus(row?.status || '') !== statusFilter) return false;
            const receiptDate = String(row?.receiptDate || '').slice(0, 10);
            if (dateFrom && receiptDate && receiptDate < dateFrom) return false;
            if (dateTo && receiptDate && receiptDate > dateTo) return false;
            return true;
        });
    },

    validateGoodsReceiptDraft: (draft, options = {}) => {
        const forApproval = options?.forApproval === true;
        if (!draft || typeof draft !== 'object') return { ok: false, message: 'Fis taslagi bulunamadi.' };
        if (!String(draft?.supplierId || '').trim()) return { ok: false, message: 'Tedarikci seciniz.' };
        if (!String(draft?.depotId || '').trim()) return { ok: false, message: 'Depo seciniz.' };
        if (!String(draft?.receiptDate || '').trim()) return { ok: false, message: 'Teslim tarihini giriniz.' };
        if (!String(draft?.receiverName || '').trim()) return { ok: false, message: 'Teslim alan personel bilgisini giriniz.' };
        const lines = Array.isArray(draft?.lines) ? draft.lines : [];
        if (lines.length === 0) return { ok: false, message: 'En az bir urun satiri ekleyiniz.' };

        let hasQty = false;
        for (let idx = 0; idx < lines.length; idx += 1) {
            const line = lines[idx];
            const lineNo = idx + 1;
            if (!String(line?.productId || '').trim()) return { ok: false, message: `${lineNo}. satir icin urun seciniz.` };
            const unit = String(line?.unit || 'ADET').trim().toUpperCase();
            const accepted = StockModule.normalizeGoodsReceiptQty(line?.acceptedQty || 0, unit);
            const damaged = StockModule.normalizeGoodsReceiptQty(line?.damagedQty || 0, unit);
            const missing = StockModule.normalizeGoodsReceiptQty(line?.missingQty || 0, unit);
            if (accepted > 0 || damaged > 0 || missing > 0) hasQty = true;
            if (accepted > 0 && !String(line?.locationId || '').trim()) {
                return { ok: false, message: `${lineNo}. satirda kabul miktari var. Lokasyon seciniz.` };
            }
            if (damaged > 0 && !String(line?.damageNote || '').trim()) {
                return { ok: false, message: `${lineNo}. satirda hasar miktari var. Hasar notu giriniz.` };
            }
        }
        if (!hasQty) return { ok: false, message: 'En az bir satirda miktar giriniz.' };
        if (forApproval) {
            const totals = StockModule.getGoodsReceiptTotals(lines);
            if (totals.accepted <= 0 && totals.damaged <= 0 && totals.missing <= 0) {
                return { ok: false, message: 'Onay icin satir miktarlari bos olamaz.' };
            }
        }
        return { ok: true };
    },

    buildGoodsReceiptRecordFromDraft: (draft, statusOverride = null) => {
        const suppliers = StockModule.getGoodsReceiptSupplierOptions();
        const depots = StockModule.getGoodsReceiptDepotOptions();
        const products = StockModule.getGoodsReceiptProductOptions();
        const supplier = suppliers.find((row) => row.id === String(draft?.supplierId || '').trim()) || null;
        const depotId = String(draft?.depotId || '').trim() || 'main';
        const depot = depots.find((row) => row.id === depotId) || null;
        const locationRows = StockModule.getGoodsReceiptLocationOptions(depotId);
        const nowIso = new Date().toISOString();
        const lines = (Array.isArray(draft?.lines) ? draft.lines : []).map((raw) => {
            const product = products.find((row) => row.id === String(raw?.productId || '').trim()) || null;
            const unit = String(raw?.unit || product?.unit || 'ADET').trim().toUpperCase();
            const locationId = String(raw?.locationId || '').trim();
            const location = locationRows.find((row) => row.id === locationId) || null;
            return StockModule.buildEmptyGoodsReceiptLine({
                id: String(raw?.id || crypto.randomUUID()),
                productId: String(raw?.productId || '').trim(),
                productCode: String(raw?.productCode || product?.code || '').trim().toUpperCase(),
                productName: String(raw?.productName || product?.name || '').trim(),
                unit,
                acceptedQty: StockModule.normalizeGoodsReceiptQty(raw?.acceptedQty || 0, unit),
                damagedQty: StockModule.normalizeGoodsReceiptQty(raw?.damagedQty || 0, unit),
                missingQty: StockModule.normalizeGoodsReceiptQty(raw?.missingQty || 0, unit),
                locationId,
                locationCode: String(raw?.locationCode || location?.code || '').trim().toUpperCase(),
                damageNote: String(raw?.damageNote || '').trim()
            });
        });
        return {
            id: String(draft?.id || crypto.randomUUID()).trim(),
            docNo: String(draft?.docNo || '').trim() || StockModule.generateGoodsReceiptDocNo(draft?.receiptDate || Date.now()),
            status: StockModule.normalizeGoodsReceiptStatus(statusOverride || draft?.status || 'TASLAK'),
            poId: String(draft?.poId || '').trim(),
            poNo: String(draft?.poNo || '').trim(),
            dispatchNo: String(draft?.dispatchNo || '').trim(),
            receiptDate: String(draft?.receiptDate || '').trim(),
            supplierId: String(draft?.supplierId || '').trim(),
            supplierName: String(draft?.supplierName || supplier?.name || '').trim(),
            depotId,
            depotName: String(draft?.depotName || depot?.name || StockModule.getScopeNameById(depotId)).trim(),
            receiverName: String(draft?.receiverName || '').trim(),
            note: String(draft?.note || '').trim(),
            lines,
            created_at: String(draft?.created_at || nowIso),
            updated_at: nowIso,
            approved_at: draft?.approved_at || null,
            cancelled_at: draft?.cancelled_at || null,
            created_by: String(draft?.created_by || 'Demo User')
        };
    },

    saveGoodsReceiptDraft: async () => {
        StockModule.ensureGoodsReceiptDraftState();
        const draft = StockModule.state.goodsReceiptDraft;
        const validation = StockModule.validateGoodsReceiptDraft(draft, { forApproval: false });
        if (!validation.ok) return alert(validation.message || 'Fis kaydedilemedi.');

        const rows = Array.isArray(DB.data?.data?.stockGoodsReceipts) ? DB.data.data.stockGoodsReceipts : [];
        if (!Array.isArray(DB.data?.data?.stockGoodsReceipts)) DB.data.data.stockGoodsReceipts = rows;
        const existingIndex = rows.findIndex((row) => String(row?.id || '') === String(draft?.id || StockModule.state.goodsReceiptEditingId || ''));
        const existing = existingIndex >= 0 ? rows[existingIndex] : null;
        if (existing && StockModule.normalizeGoodsReceiptStatus(existing.status) === 'ONAYLANDI') {
            return alert('Onayli fis duzenlenemez. Iptal/iade adimini kullaniniz.');
        }

        const base = existing || draft;
        const nextRecord = StockModule.buildGoodsReceiptRecordFromDraft({
            ...base,
            ...draft,
            status: 'TASLAK'
        }, 'TASLAK');
        if (!nextRecord.docNo) nextRecord.docNo = StockModule.generateGoodsReceiptDocNo(nextRecord.receiptDate || Date.now());
        if (existingIndex >= 0) rows[existingIndex] = nextRecord;
        else rows.push(nextRecord);

        await DB.save();
        StockModule.state.goodsReceiptEditingId = String(nextRecord.id || '');
        StockModule.state.goodsReceiptDraft = StockModule.buildEmptyGoodsReceiptDraft(nextRecord);
        UI.renderCurrentPage();
        alert(`${nextRecord.docNo} taslak olarak kaydedildi.`);
    },

    applyGoodsReceiptInventoryIn: (record) => {
        if (!record || typeof record !== 'object') return;
        if (!Array.isArray(DB.data?.data?.stockDepotItems)) DB.data.data.stockDepotItems = [];
        if (!Array.isArray(DB.data?.data?.stock_movements)) DB.data.data.stock_movements = [];
        const stockRows = DB.data.data.stockDepotItems;
        const movements = DB.data.data.stock_movements;
        const now = new Date().toISOString();
        const targetScopeId = String(record?.depotId || '').trim() || 'main';
        const targetNodeKey = StockModule.resolveNodeKeyFromScopeId(targetScopeId);
        const targetDepotName = StockModule.getScopeNameById(targetScopeId);

        (Array.isArray(record?.lines) ? record.lines : []).forEach((line) => {
            const unit = String(line?.unit || 'ADET').trim().toUpperCase();
            const acceptedQty = StockModule.normalizeGoodsReceiptQty(line?.acceptedQty || 0, unit);
            if (acceptedQty <= 0) return;
            const productCode = String(line?.productCode || '').trim().toUpperCase();
            const productName = String(line?.productName || '').trim();
            const locationId = String(line?.locationId || '').trim();
            const locationCode = String(line?.locationCode || '').trim().toUpperCase();

            const hit = stockRows.find((row) => {
                if (StockModule.normalize(row?.productCode || row?.code || '') !== StockModule.normalize(productCode)) return false;
                if (StockModule.resolveScopeIdFromStockRow(row) !== targetScopeId) return false;
                if (String(row?.locationId || '').trim() !== locationId) return false;
                return StockModule.normalizeStockClass(row?.stockClass || row?.status || 'KULLANILABILIR') === 'KULLANILABILIR';
            }) || null;

            if (hit) {
                const prevQty = Number(hit?.quantity ?? hit?.qty ?? hit?.amount ?? 0);
                const nextQty = Number((Math.max(0, prevQty) + acceptedQty).toFixed(3));
                hit.quantity = nextQty;
                hit.qty = nextQty;
                hit.amount = nextQty;
                hit.updated_at = now;
                hit.status = 'KULLANILABILIR';
                hit.stockClass = 'KULLANILABILIR';
            } else {
                stockRows.push({
                    id: crypto.randomUUID(),
                    productId: String(line?.productId || '').trim(),
                    productCode,
                    code: productCode,
                    productName,
                    name: productName,
                    quantity: acceptedQty,
                    qty: acceptedQty,
                    amount: acceptedQty,
                    unit,
                    stockClass: 'KULLANILABILIR',
                    status: 'KULLANILABILIR',
                    productType: 'MASTER',
                    modelCode: '',
                    planCodeId: '',
                    masterCode: '',
                    note: `Mal kabul / ${String(record?.docNo || '-')}`,
                    depotId: targetScopeId,
                    nodeKey: targetNodeKey,
                    locationId,
                    locationCode,
                    created_at: now,
                    updated_at: now
                });
            }

            movements.push({
                id: crypto.randomUUID(),
                movementType: 'GOODS_RECEIPT',
                type: 'GOODS_RECEIPT',
                productCode,
                code: productCode,
                productName,
                quantity: acceptedQty,
                qty: acceptedQty,
                unit,
                depotId: targetScopeId,
                depotName: targetDepotName,
                locationId,
                locationCode,
                supplierId: String(record?.supplierId || '').trim(),
                supplierName: String(record?.supplierName || '').trim(),
                docNo: String(record?.docNo || '').trim(),
                note: `Mal kabul / ${String(record?.docNo || '-')}`,
                created_at: now,
                updated_at: now
            });
        });
    },

    getGoodsReceiptRollbackErrors: (record) => {
        const errors = [];
        const rows = Array.isArray(DB.data?.data?.stockDepotItems) ? DB.data.data.stockDepotItems : [];
        const scopeId = String(record?.depotId || '').trim() || 'main';
        (Array.isArray(record?.lines) ? record.lines : []).forEach((line, idx) => {
            const unit = String(line?.unit || 'ADET').trim().toUpperCase();
            const accepted = StockModule.normalizeGoodsReceiptQty(line?.acceptedQty || 0, unit);
            if (accepted <= 0) return;
            const hit = rows.find((row) =>
                StockModule.normalize(row?.productCode || row?.code || '') === StockModule.normalize(line?.productCode || '')
                && StockModule.resolveScopeIdFromStockRow(row) === scopeId
                && String(row?.locationId || '').trim() === String(line?.locationId || '').trim()
            ) || null;
            const currentQty = Number(hit?.quantity ?? hit?.qty ?? hit?.amount ?? 0);
            if (!hit || currentQty < accepted) {
                errors.push(`${idx + 1}. satir (${String(line?.productCode || '-')}) icin iptal stogu yetersiz.`);
            }
        });
        return errors;
    },

    rollbackGoodsReceiptInventory: (record) => {
        if (!Array.isArray(DB.data?.data?.stockDepotItems)) DB.data.data.stockDepotItems = [];
        if (!Array.isArray(DB.data?.data?.stock_movements)) DB.data.data.stock_movements = [];
        const stockRows = DB.data.data.stockDepotItems;
        const movements = DB.data.data.stock_movements;
        const now = new Date().toISOString();
        const scopeId = String(record?.depotId || '').trim() || 'main';
        const depotName = StockModule.getScopeNameById(scopeId);
        (Array.isArray(record?.lines) ? record.lines : []).forEach((line) => {
            const unit = String(line?.unit || 'ADET').trim().toUpperCase();
            const accepted = StockModule.normalizeGoodsReceiptQty(line?.acceptedQty || 0, unit);
            if (accepted <= 0) return;
            const hit = stockRows.find((row) =>
                StockModule.normalize(row?.productCode || row?.code || '') === StockModule.normalize(line?.productCode || '')
                && StockModule.resolveScopeIdFromStockRow(row) === scopeId
                && String(row?.locationId || '').trim() === String(line?.locationId || '').trim()
            ) || null;
            if (!hit) return;
            const prevQty = Number(hit?.quantity ?? hit?.qty ?? hit?.amount ?? 0);
            const nextQty = Number(Math.max(0, prevQty - accepted).toFixed(3));
            hit.quantity = nextQty;
            hit.qty = nextQty;
            hit.amount = nextQty;
            hit.updated_at = now;
            movements.push({
                id: crypto.randomUUID(),
                movementType: 'GOODS_RECEIPT_CANCEL',
                type: 'GOODS_RECEIPT_CANCEL',
                productCode: String(line?.productCode || '').trim().toUpperCase(),
                code: String(line?.productCode || '').trim().toUpperCase(),
                productName: String(line?.productName || '').trim(),
                quantity: -accepted,
                qty: -accepted,
                unit,
                depotId: scopeId,
                depotName,
                locationId: String(line?.locationId || '').trim(),
                locationCode: String(line?.locationCode || '').trim().toUpperCase(),
                docNo: String(record?.docNo || '').trim(),
                note: `Mal kabul iptal / ${String(record?.docNo || '-')}`,
                created_at: now,
                updated_at: now
            });
        });
    },

    approveGoodsReceipt: async () => {
        StockModule.ensureGoodsReceiptDraftState();
        const draft = StockModule.state.goodsReceiptDraft;
        const validation = StockModule.validateGoodsReceiptDraft(draft, { forApproval: true });
        if (!validation.ok) return alert(validation.message || 'Onay verilemedi.');

        const rows = Array.isArray(DB.data?.data?.stockGoodsReceipts) ? DB.data.data.stockGoodsReceipts : [];
        if (!Array.isArray(DB.data?.data?.stockGoodsReceipts)) DB.data.data.stockGoodsReceipts = rows;
        const existingIndex = rows.findIndex((row) => String(row?.id || '') === String(draft?.id || StockModule.state.goodsReceiptEditingId || ''));
        const existing = existingIndex >= 0 ? rows[existingIndex] : null;
        if (existing && StockModule.normalizeGoodsReceiptStatus(existing.status) === 'ONAYLANDI') {
            return alert('Fis zaten onayli.');
        }

        const nextRecord = StockModule.buildGoodsReceiptRecordFromDraft({
            ...(existing || {}),
            ...draft,
            status: 'ONAYLANDI',
            approved_at: new Date().toISOString(),
            cancelled_at: null
        }, 'ONAYLANDI');
        nextRecord.approved_at = String(nextRecord.approved_at || new Date().toISOString());
        nextRecord.cancelled_at = null;

        StockModule.applyGoodsReceiptInventoryIn(nextRecord);
        if (existingIndex >= 0) rows[existingIndex] = nextRecord;
        else rows.push(nextRecord);

        await DB.save();
        StockModule.state.goodsReceiptEditingId = String(nextRecord.id || '');
        StockModule.state.goodsReceiptDraft = StockModule.buildEmptyGoodsReceiptDraft(nextRecord);
        UI.renderCurrentPage();
        alert(`${nextRecord.docNo} onaylandi ve stok hareketine islendi.`);
    },

    cancelGoodsReceipt: async () => {
        StockModule.ensureGoodsReceiptDraftState();
        const draft = StockModule.state.goodsReceiptDraft;
        const targetId = String(draft?.id || StockModule.state.goodsReceiptEditingId || '').trim();
        if (!targetId) return alert('Iptal icin once fisi kaydediniz.');
        const rows = Array.isArray(DB.data?.data?.stockGoodsReceipts) ? DB.data.data.stockGoodsReceipts : [];
        const idx = rows.findIndex((row) => String(row?.id || '') === targetId);
        if (idx === -1) return alert('Fis kaydi bulunamadi.');
        const record = rows[idx];
        const currentStatus = StockModule.normalizeGoodsReceiptStatus(record?.status || 'TASLAK');
        if (currentStatus === 'IPTAL') return alert('Fis zaten iptal.');
        if (!window.confirm(`${String(record?.docNo || 'Fis')} iptal edilsin mi?`)) return;

        if (currentStatus === 'ONAYLANDI') {
            const rollbackErrors = StockModule.getGoodsReceiptRollbackErrors(record);
            if (rollbackErrors.length > 0) {
                return alert(`Iptal islemi durduruldu:\n${rollbackErrors.join('\n')}`);
            }
            StockModule.rollbackGoodsReceiptInventory(record);
        }

        const cancelled = {
            ...record,
            status: 'IPTAL',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        rows[idx] = cancelled;
        await DB.save();
        StockModule.state.goodsReceiptEditingId = String(cancelled.id || '');
        StockModule.state.goodsReceiptDraft = StockModule.buildEmptyGoodsReceiptDraft(cancelled);
        UI.renderCurrentPage();
        alert(`${cancelled.docNo} iptal edildi.`);
    },

    getGoodsReceiptPrintableHtml: (html) => String(html || '').replace(/<div class="screen-tools">[\s\S]*?<\/div>/i, ''),

    buildGoodsReceiptPdfHtml: (record) => {
        const rows = Array.isArray(record?.lines) ? record.lines : [];
        const statusMeta = StockModule.getGoodsReceiptStatusMeta(record?.status || 'TASLAK');
        const totals = StockModule.getGoodsReceiptTotals(rows);
        const createdLabel = StockModule.formatDateTimeLabel(record?.receiptDate || record?.created_at || '');
        const printedLabel = StockModule.formatDateTimeLabel(new Date().toISOString());
        const isDraft = statusMeta.key === 'TASLAK';
        return `
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Teslim Fisi ${StockModule.escapeHtml(String(record?.docNo || '-'))}</title>
  <style>
    body { margin:0; font-family:Segoe UI,Tahoma,Arial,sans-serif; color:#0f172a; background:#f1f5f9; }
    .screen-tools { max-width:900px; margin:12px auto 0; display:flex; justify-content:flex-end; gap:8px; }
    .tool-btn { border:1px solid #334155; background:#0f172a; color:#fff; border-radius:8px; height:34px; padding:0 12px; font-size:12px; font-weight:700; cursor:pointer; }
    .tool-btn.secondary { background:#fff; color:#0f172a; border-color:#94a3b8; }
    .sheet { width:210mm; min-height:297mm; margin:10px auto 22px; background:#fff; border:1px solid #dbe3ef; box-shadow:0 18px 45px rgba(15,23,42,0.16); padding:12mm; position:relative; }
    .watermark { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; font-size:96px; color:rgba(15,23,42,0.08); font-weight:900; letter-spacing:0.08em; transform:rotate(-25deg); }
    .head { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; border:2px solid #1e293b; border-radius:12px; padding:10px 12px; margin-bottom:10px; }
    .docno { border:1px solid #93c5fd; background:#dbeafe; color:#1d4ed8; border-radius:999px; padding:4px 10px; font-size:12px; font-weight:800; font-family:Consolas, monospace; white-space:nowrap; }
    .meta { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; margin-bottom:10px; }
    .meta-card { border:1px solid #cbd5e1; border-radius:10px; padding:7px 9px; min-height:66px; }
    .meta-k { color:#64748b; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; }
    .meta-v { color:#0f172a; font-size:13px; font-weight:800; line-height:1.35; word-break:break-word; }
    .status-chip { display:inline-flex; border:1px solid ${StockModule.escapeHtml(statusMeta.border)}; border-radius:999px; padding:2px 8px; font-size:11px; font-weight:800; background:${StockModule.escapeHtml(statusMeta.bg)}; color:${StockModule.escapeHtml(statusMeta.color)}; }
    table { width:100%; border-collapse:collapse; margin-top:8px; }
    thead th { border:1px solid #cbd5e1; background:#f8fafc; color:#334155; font-size:10px; letter-spacing:0.04em; text-transform:uppercase; padding:8px 7px; text-align:left; }
    tbody td { border:1px solid #cbd5e1; font-size:12px; padding:7px; vertical-align:top; }
    .mono { font-family:Consolas, monospace; font-weight:800; color:#1d4ed8; }
    .right { text-align:right; }
    .center { text-align:center; }
    .sum-row td { background:#f8fafc; font-weight:900; }
    .footer-sign { margin-top:16px; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
    .sign-box { border:1px solid #cbd5e1; border-radius:10px; min-height:78px; padding:8px; display:flex; flex-direction:column; justify-content:flex-end; }
    .sign-line { border-top:1px solid #94a3b8; padding-top:5px; text-align:center; font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; }
    .note { margin-top:10px; font-size:10px; color:#64748b; display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; }
    @page { size:A4; margin:10mm; }
    @media print {
      body { background:#fff; }
      .screen-tools { display:none !important; }
      .sheet { margin:0; border:none; box-shadow:none; width:auto; min-height:auto; padding:0; }
    }
  </style>
</head>
<body>
  <div class="screen-tools">
    <button class="tool-btn" onclick="window.print()">PDF indir / Yazdir</button>
    <button class="tool-btn secondary" onclick="window.close()">Kapat</button>
  </div>
  <section class="sheet">
    ${isDraft ? '<div class="watermark">TASLAK</div>' : ''}
    <div class="head">
      <div>
        <div style="font-size:20px; font-weight:900; color:#0b3a8f;">MAL KABUL TESLIM FISI</div>
        <div style="font-size:12px; color:#64748b; margin-top:3px;">Depo giris ve teslim dokumani</div>
      </div>
      <div class="docno">${StockModule.escapeHtml(String(record?.docNo || '-'))}</div>
    </div>

    <div class="meta">
      <div class="meta-card"><div class="meta-k">Tedarikci</div><div class="meta-v">${StockModule.escapeHtml(String(record?.supplierName || '-'))}</div></div>
      <div class="meta-card"><div class="meta-k">Depo</div><div class="meta-v">${StockModule.escapeHtml(String(record?.depotName || '-'))}</div></div>
      <div class="meta-card"><div class="meta-k">Belge Tarihi</div><div class="meta-v">${StockModule.escapeHtml(createdLabel)}</div></div>
      <div class="meta-card"><div class="meta-k">Durum</div><div class="meta-v"><span class="status-chip">${StockModule.escapeHtml(statusMeta.text)}</span></div></div>
    </div>

    <div class="meta">
      <div class="meta-card"><div class="meta-k">Irsaliye No</div><div class="meta-v">${StockModule.escapeHtml(String(record?.dispatchNo || '-'))}</div></div>
      <div class="meta-card"><div class="meta-k">Siparis No</div><div class="meta-v">${StockModule.escapeHtml(String(record?.poNo || '-'))}</div></div>
      <div class="meta-card"><div class="meta-k">Teslim Alan</div><div class="meta-v">${StockModule.escapeHtml(String(record?.receiverName || '-'))}</div></div>
      <div class="meta-card"><div class="meta-k">Not</div><div class="meta-v">${StockModule.escapeHtml(String(record?.note || '-'))}</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:40px;" class="center">Sira</th>
          <th style="width:140px;">Urun Kodu</th>
          <th>Urun Adi</th>
          <th style="width:95px;">Lokasyon</th>
          <th style="width:70px;" class="right">Birim</th>
          <th style="width:90px;" class="right">Kabul</th>
          <th style="width:90px;" class="right">Hasar</th>
          <th style="width:90px;" class="right">Eksik</th>
        </tr>
      </thead>
      <tbody>
        ${rows.length === 0 ? '<tr><td colspan="8" style="text-align:center; color:#94a3b8;">Satir yok.</td></tr>' : rows.map((line, idx) => `
          <tr>
            <td class="center">${idx + 1}</td>
            <td class="mono">${StockModule.escapeHtml(String(line?.productCode || '-'))}</td>
            <td><div style="font-weight:700;">${StockModule.escapeHtml(String(line?.productName || '-'))}</div>${String(line?.damageNote || '').trim() ? `<div style="font-size:11px; color:#b45309; margin-top:3px;">Hasar notu: ${StockModule.escapeHtml(String(line?.damageNote || '').trim())}</div>` : ''}</td>
            <td>${StockModule.escapeHtml(String(line?.locationCode || '-'))}</td>
            <td class="right">${StockModule.escapeHtml(String(line?.unit || '-'))}</td>
            <td class="right"><strong>${StockModule.escapeHtml(String(line?.acceptedQty || 0))}</strong></td>
            <td class="right">${StockModule.escapeHtml(String(line?.damagedQty || 0))}</td>
            <td class="right">${StockModule.escapeHtml(String(line?.missingQty || 0))}</td>
          </tr>
        `).join('')}
        <tr class="sum-row">
          <td colspan="5" class="right">TOPLAM</td>
          <td class="right">${StockModule.escapeHtml(String(totals.accepted || 0))}</td>
          <td class="right">${StockModule.escapeHtml(String(totals.damaged || 0))}</td>
          <td class="right">${StockModule.escapeHtml(String(totals.missing || 0))}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer-sign">
      <div class="sign-box"><div class="sign-line">Teslim Eden Imza</div></div>
      <div class="sign-box"><div class="sign-line">Teslim Alan Imza</div></div>
      <div class="sign-box"><div class="sign-line">Kontrol Eden Imza</div></div>
    </div>
    <div class="note">
      <span>Kayit sorumlusu: ${StockModule.escapeHtml(String(record?.created_by || 'Demo User'))}</span>
      <span>PDF olusturma: ${StockModule.escapeHtml(printedLabel)}</span>
    </div>
  </section>
</body>
</html>
        `;
    },

    openGoodsReceiptSavedDocument: (recordId, autoPrint = false) => {
        const record = StockModule.getGoodsReceiptRecordById(recordId);
        if (!record) return alert('Fis kaydi bulunamadi.');
        const win = window.open('', '_blank');
        if (!win) return alert('Pop-up engellendi. Lutfen tarayici izinlerini kontrol edin.');
        win.document.open();
        win.document.write(StockModule.buildGoodsReceiptPdfHtml(record));
        win.document.close();
        try { win.document.title = `Teslim Fisi ${String(record?.docNo || '-')}`; } catch (_) { }
        if (autoPrint) {
            setTimeout(() => {
                try {
                    win.focus();
                    win.print();
                } catch (_) { }
            }, 260);
        }
        return win;
    },

    printGoodsReceiptSavedDocument: (recordId) => {
        StockModule.openGoodsReceiptSavedDocument(recordId, true);
    },

    downloadGoodsReceiptPdfHtml: async (html, fileNameBase = 'teslim-fisi') => {
        try {
            const printableHtml = StockModule.getGoodsReceiptPrintableHtml(html);
            const payload = {
                html: String(printableHtml || ''),
                fileName: String(fileNameBase || 'teslim-fisi')
            };
            const res = await fetch('/api/dispatch-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const raw = await res.text().catch(() => '');
                let detail = raw;
                try {
                    const parsed = raw ? JSON.parse(raw) : null;
                    detail = String(parsed?.message || parsed?.error || raw || '');
                } catch (_) { }
                throw new Error(detail || `HTTP ${res.status}`);
            }
            const blob = await res.blob();
            const safeName = String(fileNameBase || 'teslim-fisi').replace(/[^a-zA-Z0-9_-]+/g, '_');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${safeName || 'teslim-fisi'}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1500);
            return true;
        } catch (error) {
            console.error('Mal kabul PDF indirme hatasi:', error);
            return false;
        }
    },

    downloadGoodsReceiptSavedDocument: async (recordId) => {
        const record = StockModule.getGoodsReceiptRecordById(recordId);
        if (!record) return alert('Fis kaydi bulunamadi.');
        const docNo = String(record?.docNo || 'teslim-fisi');
        const ok = await StockModule.downloadGoodsReceiptPdfHtml(
            StockModule.buildGoodsReceiptPdfHtml(record),
            `teslim-fisi-${docNo}`
        );
        if (!ok) alert('PDF otomatik indirilemedi. Yazdir ile "PDF olarak kaydet" secenegini kullanabilirsiniz.');
    },

    openOperationLibrary: () => {
        StockModule.state.workspaceView = 'operation-library';
        UI.renderCurrentPage();
    },

    setTopTab: (tabId) => {
        const nextTab = String(tabId || 'all');
        StockModule.state.topTab = nextTab;
        StockModule.state.selectedKey = nextTab === 'transfer' ? 'managed:depot_transfer' : 'all';
        StockModule.clearInventoryLocationFilter({ rerender: false });
        UI.renderCurrentPage();
    },

    selectNode: (key) => {
        const nextKey = String(key || 'all');
        StockModule.state.selectedKey = nextKey;
        StockModule.state.topTab = nextKey === 'managed:depot_transfer' ? 'transfer' : 'all';
        StockModule.clearInventoryLocationFilter({ rerender: false });
        UI.renderCurrentPage();
    },

    getInventoryLocationFilter: () => {
        const raw = StockModule.state.inventoryLocationFilter;
        if (!raw || typeof raw !== 'object') return null;
        const scopeKey = String(raw?.scopeKey || '').trim();
        const locationId = String(raw?.locationId || '').trim();
        const locationCode = String(raw?.locationCode || '').trim().toUpperCase();
        const locationLabel = String(raw?.locationLabel || '').trim();
        const depotScopeId = String(raw?.depotScopeId || '').trim();
        if (!scopeKey) return null;
        if (!locationId && !locationCode) return null;
        return { scopeKey, locationId, locationCode, locationLabel, depotScopeId };
    },

    getInventoryLocationFilterForNode: (node) => {
        const filter = StockModule.getInventoryLocationFilter();
        if (!filter) return null;
        const nodeKey = String(node?.key || '').trim();
        if (!nodeKey || filter.scopeKey !== nodeKey) return null;
        return filter;
    },

    clearInventoryLocationFilter: (options = {}) => {
        StockModule.state.inventoryLocationFilter = null;
        if (options?.rerender === false) return;
        UI.renderCurrentPage();
    },

    toggleInventoryLocationFilter: (scopeKey, locationId = '', locationCode = '', locationLabel = '', depotScopeId = '') => {
        const nextScopeKey = String(scopeKey || '').trim();
        const nextLocationId = String(locationId || '').trim();
        const nextLocationCode = String(locationCode || '').trim().toUpperCase();
        const nextLocationLabel = String(locationLabel || '').trim();
        const nextDepotScopeId = String(depotScopeId || '').trim();
        if (!nextScopeKey || (!nextLocationId && !nextLocationCode)) return;
        const current = StockModule.getInventoryLocationFilter();
        const sameTarget = !!current
            && current.scopeKey === nextScopeKey
            && String(current.locationId || '') === nextLocationId
            && String(current.locationCode || '') === nextLocationCode;
        if (sameTarget) {
            StockModule.clearInventoryLocationFilter();
            return;
        }
        StockModule.state.inventoryLocationFilter = {
            scopeKey: nextScopeKey,
            locationId: nextLocationId,
            locationCode: nextLocationCode,
            locationLabel: nextLocationLabel || nextLocationCode || '-',
            depotScopeId: nextDepotScopeId
        };
        UI.renderCurrentPage();
    },

    restoreSearchFocus: (field) => {
        const normalizedField = String(field || '').trim();
        const targetId = normalizedField === 'code'
            ? 'stock-search-code'
            : (normalizedField === 'name' ? 'stock-search-name' : 'stock-search-query');
        requestAnimationFrame(() => {
            const input = document.getElementById(targetId);
            if (!input) return;
            input.focus();
            const end = String(input.value || '').length;
            if (typeof input.setSelectionRange === 'function') input.setSelectionRange(end, end);
        });
    },

    setSearch: (field, value) => {
        const next = String(value || '');
        if (field === 'name') {
            StockModule.state.searchName = next;
            StockModule.state.searchQuery = next;
        } else if (field === 'code') {
            StockModule.state.searchCode = next;
            StockModule.state.searchQuery = next;
        } else {
            StockModule.state.searchQuery = next;
            StockModule.state.searchName = next;
            StockModule.state.searchCode = next;
        }
        UI.renderCurrentPage();
        StockModule.restoreSearchFocus(field || 'inventory');
    },

    getInventoryStockFilterDefaults: () => ({
        available: true,
        inProcess: true,
        reserve: true
    }),

    getInventoryStockFilters: () => {
        const defaults = StockModule.getInventoryStockFilterDefaults();
        const current = StockModule.state.inventoryStockFilters && typeof StockModule.state.inventoryStockFilters === 'object'
            ? StockModule.state.inventoryStockFilters
            : {};
        return {
            available: current.available !== false ? true : false,
            inProcess: current.inProcess !== false ? true : false,
            reserve: current.reserve !== false ? true : false,
            ...defaults,
            ...current
        };
    },

    toggleInventoryStockFilter: (key) => {
        const valid = ['available', 'inProcess', 'reserve'];
        const normalizedKey = String(key || '');
        if (!valid.includes(normalizedKey)) return;
        const current = StockModule.getInventoryStockFilters();
        current[normalizedKey] = !current[normalizedKey];
        StockModule.state.inventoryStockFilters = current;
        UI.renderCurrentPage();
    },

    getInventoryCategoryDefs: () => ([
        { id: 'component', title: 'Parca & bilesen' },
        { id: 'model', title: 'Urun modelleri' },
        { id: 'master', title: 'Master urun' },
        { id: 'semi', title: 'Yari mamul' }
    ]),

    resolveInventoryCategoryId: (row) => {
        const typeNorm = StockModule.normalize(row?.productType);
        const code = String(row?.code || '').trim().toUpperCase();
        const partCode = String(row?.searchMeta?.partCardCode || '').trim();
        const semiCode = String(row?.searchMeta?.semiCardCode || '').trim();
        const modelText = [
            row?.modelCode,
            row?.searchMeta?.productBrandModel,
            row?.searchMeta?.productCategory
        ].map((val) => StockModule.normalize(val)).join(' ');

        if (semiCode || code.startsWith('YRM-') || typeNorm.includes('yari')) return 'semi';
        if (partCode || code.startsWith('PRC-') || typeNorm.includes('parca') || typeNorm.includes('bilesen')) return 'component';
        if (typeNorm.includes('model') || modelText.includes('model') || code.startsWith('MDL-') || code.startsWith('MOD-') || code.startsWith('VRN-')) return 'model';
        return 'master';
    },

    groupInventoryRowsByCategory: (rows, options = {}) => {
        const includeEmpty = !!options.includeEmpty;
        const defs = StockModule.getInventoryCategoryDefs();
        const bucketMap = new Map(defs.map((def) => [def.id, []]));
        (Array.isArray(rows) ? rows : []).forEach((row) => {
            const categoryId = StockModule.resolveInventoryCategoryId(row);
            if (!bucketMap.has(categoryId)) bucketMap.set(categoryId, []);
            bucketMap.get(categoryId).push(row);
        });
        const grouped = defs.map((def) => ({ ...def, rows: bucketMap.get(def.id) || [] }));
        return includeEmpty ? grouped : grouped.filter((entry) => entry.rows.length > 0);
    },

    getInventoryCategoryToggleKey: (scopeKey, categoryId) => `${String(scopeKey || 'scope')}|${String(categoryId || 'category')}`,

    isInventoryCategoryOpen: (scopeKey, categoryId) => {
        const key = StockModule.getInventoryCategoryToggleKey(scopeKey, categoryId);
        return !!StockModule.state.inventoryOpenCategoryKeys?.[key];
    },

    toggleInventoryCategory: (scopeKey, categoryId) => {
        const key = StockModule.getInventoryCategoryToggleKey(scopeKey, categoryId);
        const current = StockModule.state.inventoryOpenCategoryKeys && typeof StockModule.state.inventoryOpenCategoryKeys === 'object'
            ? { ...StockModule.state.inventoryOpenCategoryKeys }
            : {};
        current[key] = !current[key];
        StockModule.state.inventoryOpenCategoryKeys = current;
        UI.renderCurrentPage();
    },

    getInventoryRowModelText: (row) => {
        const candidates = [
            row?.modelCode,
            row?.searchMeta?.productBrandModel,
            row?.searchMeta?.partCardSubGroup,
            row?.searchMeta?.semiCardSubGroup,
            row?.searchMeta?.productCategory,
            row?.productType
        ].map((value) => String(value || '').trim()).filter(Boolean);
        return candidates.length > 0 ? candidates[0] : '-';
    },

    getInventoryRowStatusMeta: (row) => {
        const raw = StockModule.normalize([row?.status, row?.stockClass].filter(Boolean).join(' '));
        if (raw.includes('rezerve') || raw.includes('rezerv')) return { key: 'reserve', text: 'rezerve' };
        if (raw.includes('wip') || raw.includes('islemde')) return { key: 'wip', text: 'islemde olanlar' };
        return { key: 'available', text: 'kullanilabilir' };
    },

    openInventoryItemCard: (rawCode) => {
        const code = String(rawCode || '').trim();
        if (!code) return;
        if (typeof ReadOnlyViewer !== 'undefined' && ReadOnlyViewer && typeof ReadOnlyViewer.openByCode === 'function') {
            const opened = ReadOnlyViewer.openByCode(code, { silentNotFound: true });
            if (opened) return;
        }
        alert('Bu kod icin urun karti bulunamadi.');
    },

    openInventoryRowHistory: (rawCode, rawId = '') => {
        const code = String(rawCode || '').trim();
        const id = String(rawId || '').trim();
        const normalizedCode = StockModule.normalize(code);
        const rows = StockModule.getInventoryRows();
        const selectedRow = (id
            ? rows.find((row) => String(row?.id || '') === id && StockModule.normalize(row?.code) === normalizedCode)
            : null)
            || rows.find((row) => StockModule.normalize(row?.code) === normalizedCode)
            || null;
        const sameCodeRows = rows
            .filter((row) => StockModule.normalize(row?.code) === normalizedCode)
            .sort((a, b) => String(a?.depotName || '').localeCompare(String(b?.depotName || ''), 'tr'));
        const stockMovements = Array.isArray(DB.data?.data?.stock_movements) ? DB.data.data.stock_movements : [];
        const movementRows = stockMovements
            .filter((mv) => {
                const mvCode = StockModule.normalize(mv?.productCode || mv?.code || mv?.itemCode || '');
                return !!mvCode && mvCode === normalizedCode;
            })
            .sort((a, b) => new Date(b?.created_at || b?.updated_at || 0) - new Date(a?.created_at || a?.updated_at || 0));
        const selectedNode = StockModule.getSelectedNode();
        const allowTransferInCurrentScope = String(selectedNode?.key || '') !== 'all';
        const stockDepotRows = Array.isArray(DB.data?.data?.stockDepotItems) ? DB.data.data.stockDepotItems : [];
        const sourceStockRow = stockDepotRows.find((row) => String(row?.id || '') === id) || null;
        const statusMeta = StockModule.getInventoryRowStatusMeta(sourceStockRow || selectedRow || {});
        const infoRow = selectedRow || { code, name: '-', locationCode: '-', quantity: '-', unit: '', depotName: '-', modelCode: '-', productType: '-' };
        const sourceQty = sourceStockRow ? StockModule.getStockRowQty(sourceStockRow) : 0;
        const sourceScopeId = sourceStockRow ? StockModule.resolveScopeIdFromStockRow(sourceStockRow) : '';
        const sourceScopeName = StockModule.getScopeNameById(sourceScopeId);
        const sourceLocationId = String(sourceStockRow?.locationId || '').trim();
        const sourceLocation = sourceLocationId
            ? (Array.isArray(DB.data?.data?.stockDepotLocations) ? DB.data.data.stockDepotLocations : [])
                .find((row) => String(row?.id || '') === sourceLocationId)
            : null;
        const sourceLocationCode = String(sourceStockRow?.locationCode || (sourceLocation ? StockModule.getLocationCode(sourceLocation) : '') || '-').trim();
        const canTransfer = !!sourceStockRow && statusMeta.key === 'available' && sourceQty > 0;
        const transferScopeOptions = StockModule.getTransferScopeOptions();
        const defaultTargetScopeId = transferScopeOptions.some((row) => String(row?.scopeId || '') === sourceScopeId)
            ? sourceScopeId
            : String(transferScopeOptions[0]?.scopeId || '');
        const defaultTargetLocations = StockModule.getDepotLocations(defaultTargetScopeId);
        const transferScopeOptionsHtml = transferScopeOptions.length === 0
            ? '<option value="">Hedef depo bulunamadi</option>'
            : transferScopeOptions.map((option) => `
                <option value="${StockModule.escapeHtml(option.scopeId || '')}" ${String(option.scopeId || '') === defaultTargetScopeId ? 'selected' : ''}>${StockModule.escapeHtml(option.name || option.scopeId || '-')}</option>
            `).join('');
        const transferLocationOptionsHtml = defaultTargetLocations.length === 0
            ? '<option value="">Bu depoda hucre yok</option>'
            : ['<option value="">Hucre sec</option>'].concat(defaultTargetLocations.map((row) => `
                <option value="${StockModule.escapeHtml(String(row?.id || ''))}">${StockModule.escapeHtml(StockModule.getLocationLabel(row))}</option>
            `)).join('');
        const transferPanel = !allowTransferInCurrentScope
            ? ''
            : (!sourceStockRow
            ? `<div style="padding:0.7rem; border:1px dashed #cbd5e1; border-radius:0.6rem; color:#64748b;">Bu satir gercek stok kaydi degil. Transfer icin fiziksel stok satiri secin.</div>`
            : (statusMeta.key !== 'available'
                ? `<div style="padding:0.7rem; border:1px dashed #cbd5e1; border-radius:0.6rem; color:#64748b;">Bu adimda sadece kullanilabilir stok transferine izin verilir.</div>`
                : (sourceQty <= 0
                    ? `<div style="padding:0.7rem; border:1px dashed #cbd5e1; border-radius:0.6rem; color:#64748b;">Kaynak lokasyonda transfer edilecek stok yok.</div>`
                    : `
                        <div style="display:grid; gap:0.65rem;">
                            <div style="font-size:0.82rem; color:#475569;">
                                Kaynak: <strong>${StockModule.escapeHtml(sourceScopeName || '-')}</strong> | Konum: <strong>${StockModule.escapeHtml(sourceLocationCode || '-')}</strong> | Mevcut: <strong>${StockModule.escapeHtml(String(sourceQty))} ${StockModule.escapeHtml(String(sourceStockRow?.unit || 'ADET'))}</strong>
                            </div>
                            <div style="display:grid; grid-template-columns:180px 180px 1fr auto; gap:0.55rem; align-items:end;">
                                <div>
                                    <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">Transfer adedi</label>
                                    <input id="stock-transfer-qty" type="number" min="1" max="${StockModule.escapeHtml(String(sourceQty))}" value="1" class="stock-input stock-input-tall">
                                </div>
                                <div>
                                    <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">Hedef secim tipi</label>
                                    <select id="stock-transfer-mode" class="stock-input stock-input-tall" onchange="StockModule.onInventoryTransferModeChange()">
                                        <option value="select" selected>Depo + hucre sec</option>
                                        <option value="idcode">Hucre ID kodu gir</option>
                                    </select>
                                </div>
                                <div id="stock-transfer-by-select" style="display:grid; grid-template-columns:1fr 1fr; gap:0.55rem;">
                                    <div>
                                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">Hedef birim / atolye / depo</label>
                                        <select id="stock-transfer-target-scope" class="stock-input stock-input-tall" onchange="StockModule.onInventoryTransferDepotChange()">
                                            ${transferScopeOptionsHtml}
                                        </select>
                                    </div>
                                    <div>
                                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">Hedef hucre</label>
                                        <select id="stock-transfer-target-location" class="stock-input stock-input-tall">
                                            ${transferLocationOptionsHtml}
                                        </select>
                                    </div>
                                </div>
                                <div id="stock-transfer-by-idcode" style="display:none;">
                                    <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem;">Hucre ID kodu / konum</label>
                                    <input id="stock-transfer-target-idcode" class="stock-input stock-input-tall" placeholder="or: LOC-000123 veya R02-A1">
                                </div>
                                <button class="btn-primary" onclick="StockModule.submitInventoryTransferFromModal('${StockModule.escapeJsString(String(sourceStockRow?.id || ''))}','${StockModule.escapeJsString(String(infoRow?.code || code || ''))}')">Transfer Et</button>
                                </div>
                        </div>
                    `)));
        const movementTable = movementRows.length === 0
            ? `<div style="padding:0.7rem; border:1px dashed #cbd5e1; border-radius:0.6rem; color:#64748b;">Bu urun icin henuz stok hareket kaydi yok.</div>`
            : `
                <div style="border:1px solid #e2e8f0; border-radius:0.7rem; overflow:hidden;">
                    <table>
                        <thead>
                            <tr>
                                <th style="text-align:left;">Tarih</th>
                                <th style="text-align:left;">Tip</th>
                                <th style="text-align:left;">Miktar</th>
                                <th style="text-align:left;">Depo</th>
                                <th style="text-align:left;">Not</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${movementRows.slice(0, 20).map((mv) => `
                                <tr>
                                    <td>${StockModule.escapeHtml(StockModule.formatDateTimeLabel(mv?.created_at || mv?.updated_at || ''))}</td>
                                    <td>${StockModule.escapeHtml(mv?.movementType || mv?.type || '-')}</td>
                                    <td>${StockModule.escapeHtml(`${mv?.quantity ?? mv?.qty ?? '-'} ${mv?.unit || ''}`.trim())}</td>
                                    <td>${StockModule.escapeHtml(mv?.depotName || mv?.depotId || '-')}</td>
                                    <td>${StockModule.escapeHtml(mv?.note || '-')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        const allDepotSummary = sameCodeRows.length === 0
            ? `<div style="color:#64748b;">Bu kod icin depot ozeti bulunamadi.</div>`
            : `
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:0.55rem;">
                    ${sameCodeRows.map((row) => `
                        <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.55rem 0.6rem; background:#fff;">
                            <div style="font-size:0.75rem; color:#64748b;">Depo</div>
                            <div style="font-weight:700; color:#0f172a;">${StockModule.escapeHtml(row?.depotName || '-')}</div>
                            <div style="font-size:0.78rem; color:#475569; margin-top:0.2rem;">Konum: ${StockModule.escapeHtml(row?.locationCode || '-')}</div>
                            <div style="font-size:0.78rem; color:#475569;">Miktar: ${StockModule.escapeHtml(`${row?.quantity ?? '-'} ${row?.unit || ''}`.trim())}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        Modal.open(`Stok detay - ${StockModule.escapeHtml(infoRow?.code || '-')}`, `
            <div style="display:grid; gap:0.8rem;">
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:0.55rem;">
                    <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.55rem;">
                        <div style="font-size:0.72rem; color:#64748b;">ID kodu</div>
                        <div style="font-family:monospace; font-weight:700; color:#1d4ed8;">${StockModule.escapeHtml(infoRow?.code || '-')}</div>
                    </div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.55rem;">
                        <div style="font-size:0.72rem; color:#64748b;">Urun adi</div>
                        <div style="font-weight:700; color:#0f172a;">${StockModule.escapeHtml(infoRow?.name || '-')}</div>
                    </div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.55rem;">
                        <div style="font-size:0.72rem; color:#64748b;">Durum</div>
                        <div style="font-weight:700; color:#0f172a;">${StockModule.escapeHtml(statusMeta.text)}</div>
                    </div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.55rem;">
                        <div style="font-size:0.72rem; color:#64748b;">Miktar</div>
                        <div style="font-weight:700; color:#0f172a;">${StockModule.escapeHtml(`${infoRow?.quantity ?? '-'} ${infoRow?.unit || ''}`.trim())}</div>
                    </div>
                </div>

                <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.75rem; background:#f8fafc;">
                    <div style="display:flex; justify-content:space-between; gap:0.55rem; align-items:center; flex-wrap:wrap;">
                        <div style="font-weight:800; color:#0f172a;">Depolardaki gorunum</div>
                        <button class="btn-sm" onclick="StockModule.openInventoryItemCard('${StockModule.escapeJsString(infoRow?.code || '')}')">ID kartini ac</button>
                    </div>
                    <div style="margin-top:0.6rem;">${allDepotSummary}</div>
                </div>

                <div style="display:grid; gap:0.45rem;">
                    <div style="font-weight:800; color:#0f172a;">Hareket gecmisi</div>
                    ${movementTable}
                </div>
                ${allowTransferInCurrentScope ? `
                    <div style="display:grid; gap:0.45rem;">
                        <div style="font-weight:800; color:#0f172a;">Baska depoya / rafa transfer et</div>
                        ${transferPanel}
                    </div>
                ` : ''}
            </div>
        `, { maxWidth: '980px' });
        if (allowTransferInCurrentScope && canTransfer) {
            requestAnimationFrame(() => {
                StockModule.refreshInventoryTransferLocationOptions();
                StockModule.updateInventoryTransferModeUi();
            });
        }
    },

    setOperationFilter: (field, value, focusId = '') => {
        if (field === 'name') StockModule.state.operationSearchName = String(value || '');
        if (field === 'code') StockModule.state.operationSearchCode = String(value || '');
        UI.renderCurrentPage();
        if (!focusId) return;
        requestAnimationFrame(() => {
            const el = document.getElementById(focusId);
            if (!el) return;
            el.focus();
            const end = String(el.value || '').length;
            if (typeof el.setSelectionRange === 'function') el.setSelectionRange(end, end);
        });
    },

    getOperationLibraryRows: () => {
        const qName = StockModule.normalize(StockModule.state.operationSearchName);
        const qCode = StockModule.normalize(StockModule.state.operationSearchCode);
        return (DB.data.data.depoTransferTasks || [])
            .slice()
            .filter((row) => {
                const nameOk = !qName || StockModule.normalize(row?.taskName).includes(qName);
                const codeOk = !qCode || StockModule.normalize(row?.taskCode).includes(qCode);
                return nameOk && codeOk;
            })
            .sort((a, b) => new Date(b?.updated_at || b?.created_at || 0) - new Date(a?.updated_at || a?.created_at || 0));
    },

    getNextOperationCode: () => {
        const max = (DB.data.data.depoTransferTasks || []).reduce((acc, row) => {
            const code = String(row?.taskCode || '').trim().toUpperCase();
            const match = code.match(/^DTR-(\d{6})$/);
            if (!match) return acc;
            return Math.max(acc, Number(match[1]));
        }, 0);
        let next = max + 1;
        let candidate = `DTR-${String(next).padStart(6, '0')}`;
        while (typeof UnitModule !== 'undefined' && UnitModule && typeof UnitModule.isGlobalCodeTaken === 'function' && UnitModule.isGlobalCodeTaken(candidate)) {
            next += 1;
            candidate = `DTR-${String(next).padStart(6, '0')}`;
        }
        return candidate;
    },

    openOperationForm: () => {
        StockModule.state.operationFormOpen = true;
        StockModule.state.operationEditingId = null;
        StockModule.state.operationDraftCode = StockModule.getNextOperationCode();
        StockModule.state.operationDraftName = '';
        StockModule.state.operationDraftNote = '';
        UI.renderCurrentPage();
    },

    startEditOperation: (taskId) => {
        const row = (DB.data.data.depoTransferTasks || []).find((item) => String(item?.id || '') === String(taskId || ''));
        if (!row) return;
        StockModule.state.operationSelectedId = row.id;
        StockModule.state.operationFormOpen = true;
        StockModule.state.operationEditingId = row.id;
        StockModule.state.operationDraftCode = row.taskCode || StockModule.getNextOperationCode();
        StockModule.state.operationDraftName = row.taskName || '';
        StockModule.state.operationDraftNote = row.note || '';
        UI.renderCurrentPage();
    },

    resetOperationDraft: () => {
        StockModule.state.operationFormOpen = false;
        StockModule.state.operationEditingId = null;
        StockModule.state.operationDraftCode = '';
        StockModule.state.operationDraftName = '';
        StockModule.state.operationDraftNote = '';
        UI.renderCurrentPage();
    },

    selectOperation: (taskId) => {
        StockModule.state.operationSelectedId = String(taskId || '');
        UI.renderCurrentPage();
    },

    previewOperation: (taskId) => {
        const row = (DB.data.data.depoTransferTasks || []).find((item) => String(item?.id || '') === String(taskId || ''));
        if (!row) return;
        Modal.open(`Islem Detay - ${StockModule.escapeHtml(row.taskName || '-')}`, `
            <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.55rem;">
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;">
                    <div style="font-size:0.72rem; color:#64748b;">Islem adi</div>
                    <div style="font-weight:700; color:#334155;">${StockModule.escapeHtml(row.taskName || '-')}</div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;">
                    <div style="font-size:0.72rem; color:#64748b;">ID kod</div>
                    <div style="font-weight:700; color:#1d4ed8; font-family:monospace;">${StockModule.escapeHtml(row.taskCode || '-')}</div>
                </div>
                <div style="grid-column:1/-1; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;">
                    <div style="font-size:0.72rem; color:#64748b;">Islem notu</div>
                    <div style="color:#334155; white-space:pre-wrap;">${StockModule.escapeHtml(row.note || '-')}</div>
                </div>
            </div>
        `, { maxWidth: '720px' });
    },

    saveOperation: async () => {
        const taskName = String(StockModule.state.operationDraftName || '').trim();
        const note = String(StockModule.state.operationDraftNote || '').trim();
        const taskCode = String(StockModule.state.operationDraftCode || StockModule.getNextOperationCode()).trim().toUpperCase();
        if (!taskName) return alert('Islem adi zorunlu.');
        const editId = String(StockModule.state.operationEditingId || '');
        const exclude = editId ? { collection: 'depoTransferTasks', id: editId, field: 'taskCode' } : null;
        if (typeof UnitModule !== 'undefined' && UnitModule && typeof UnitModule.isGlobalCodeTaken === 'function' && UnitModule.isGlobalCodeTaken(taskCode, exclude)) {
            return alert('Bu islem ID zaten kullaniliyor.');
        }
        const now = new Date().toISOString();
        const all = DB.data.data.depoTransferTasks || [];
        if (editId) {
            const row = all.find((item) => String(item?.id || '') === editId);
            if (!row) return;
            row.taskName = taskName;
            row.taskCode = taskCode;
            row.note = note;
            row.updated_at = now;
            StockModule.state.operationSelectedId = row.id;
        } else {
            const id = crypto.randomUUID();
            all.push({
                id,
                taskName,
                taskCode,
                note,
                created_at: now,
                updated_at: now
            });
            StockModule.state.operationSelectedId = id;
        }
        DB.data.data.depoTransferTasks = all;
        await DB.save();
        StockModule.resetOperationDraft();
    },

    deleteOperation: async (taskId) => {
        if (typeof UnitModule !== 'undefined' && UnitModule && typeof UnitModule.isSuperAdmin === 'function' && !UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        const row = (DB.data.data.depoTransferTasks || []).find((item) => String(item?.id || '') === String(taskId || ''));
        if (!row) return;
        if (!confirm(`"${row.taskName}" silinsin mi?`)) return;
        DB.data.data.depoTransferTasks = (DB.data.data.depoTransferTasks || []).filter((item) => String(item?.id || '') !== String(taskId || ''));
        if (String(StockModule.state.operationEditingId || '') === String(taskId || '')) StockModule.resetOperationDraft();
        if (String(StockModule.state.operationSelectedId || '') === String(taskId || '')) StockModule.state.operationSelectedId = null;
        await DB.save();
        UI.renderCurrentPage();
    },

    renderOperationLibraryLayout: () => {
        const rows = StockModule.getOperationLibraryRows();
        const activeTaskCode = StockModule.state.operationDraftCode || StockModule.getNextOperationCode();
        const isFormOpen = !!StockModule.state.operationFormOpen;
        const picker = typeof UnitModule !== 'undefined' && UnitModule && typeof UnitModule.getActiveComponentRoutePicker === 'function'
            ? UnitModule.getActiveComponentRoutePicker()
            : null;
        const isPickerMode = !!picker && String(picker.stationId || '') === 'u_dtm';
        const canDelete = typeof UnitModule !== 'undefined' && UnitModule && typeof UnitModule.isSuperAdmin === 'function'
            ? UnitModule.isSuperAdmin()
            : true;
        return `
            <section class="stock-shell">
                <div class="stock-subpage-shell">
                    <div class="stock-subpage-head">
                        <h2 class="stock-title">depo & stok / islem kutuphanesi</h2>
                        <button class="btn-sm" onclick="StockModule.openWorkspace('menu')">geri</button>
                    </div>

                    <div class="card-table" style="padding:1.25rem 1.5rem;">
                        <div style="display:grid; grid-template-columns:1fr 1fr auto; gap:0.65rem; align-items:center;">
                            <input id="stock_op_search_name" value="${StockModule.escapeHtml(StockModule.state.operationSearchName || '')}" oninput="StockModule.setOperationFilter('name', this.value, 'stock_op_search_name')" placeholder="islem adi ile ara" class="stock-input">
                            <input id="stock_op_search_code" value="${StockModule.escapeHtml(StockModule.state.operationSearchCode || '')}" oninput="StockModule.setOperationFilter('code', this.value, 'stock_op_search_code')" placeholder="islem ID ile ara" class="stock-input">
                            <button class="btn-primary" onclick="StockModule.openOperationForm()" style="min-width:170px;">Islem ekle +</button>
                        </div>
                    </div>

                    <div class="card-table">
                        <table style="width:100%; text-align:left; border-collapse:collapse">
                            <thead>
                                <tr style="border-bottom:1px solid #f1f5f9; color:#94a3b8; font-size:0.75rem; text-transform:uppercase">
                                    <th style="padding:1.15rem">Islem adi</th>
                                    <th style="padding:1.15rem">ID kod</th>
                                    <th style="padding:1.15rem">Islem notu</th>
                                    <th style="padding:1.15rem; text-align:right;">Goruntule</th>
                                    <th style="padding:1.15rem; text-align:right;">Duzenle</th>
                                    <th style="padding:1.15rem; text-align:right;">Sec</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.length === 0 ? '<tr><td colspan="6" style="padding:2rem; text-align:center; color:#94a3b8">Kayitli islem yok.</td></tr>' : rows.map((row) => `
                                    <tr style="border-bottom:1px solid #f1f5f9; ${isPickerMode ? UnitModule.getRoutePickerSelectedRowStyle(String(StockModule.state.operationSelectedId || '') === String(row.id || '')) : ''}">
                                        <td style="padding:1.15rem; font-weight:700; color:#0f172a;">${StockModule.escapeHtml(row.taskName || '-')}</td>
                                        <td style="padding:1.15rem; font-family:monospace; color:#1d4ed8; font-weight:700;">${StockModule.escapeHtml(row.taskCode || '-')}</td>
                                        <td style="padding:1.15rem; color:#64748b;">${StockModule.escapeHtml(row.note || '-')}</td>
                                        <td style="padding:1.15rem; text-align:right;"><button class="btn-sm" onclick="StockModule.previewOperation('${row.id}')">Goruntule</button></td>
                                        <td style="padding:1.15rem; text-align:right;"><button class="btn-sm" onclick="StockModule.startEditOperation('${row.id}')">Duzenle</button></td>
                                        <td style="padding:1.15rem; text-align:right;"><button class="btn-sm" onclick="StockModule.selectOperation('${row.id}')" style="${UnitModule.getRoutePickerSelectButtonStyle(String(StockModule.state.operationSelectedId || '') === String(row.id || ''))}">Sec</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    ${isFormOpen ? `
                        <div class="card-table" style="padding:1.25rem 1.5rem; margin-top:1rem;">
                            <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-bottom:0.8rem;">
                                ${StockModule.state.operationEditingId ? `<button class="btn-sm" onclick="StockModule.deleteOperation('${StockModule.state.operationEditingId}')" ${canDelete ? '' : 'disabled'} style="${canDelete ? 'color:#b91c1c; border-color:#fecaca; background:#fef2f2;' : 'opacity:0.45; cursor:not-allowed;'}">sil</button>` : ''}
                                <button class="btn-sm" onclick="StockModule.resetOperationDraft()">vazgec</button>
                                <button class="btn-primary" onclick="StockModule.saveOperation()">kaydet</button>
                            </div>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.7rem; margin-bottom:0.7rem;">
                                <input value="${StockModule.escapeHtml(StockModule.state.operationDraftName || '')}" oninput="StockModule.state.operationDraftName=this.value" placeholder="islem adi" class="stock-input">
                                <input value="${StockModule.escapeHtml(activeTaskCode)}" readonly placeholder="ID kod" class="stock-input" style="background:#f8fafc; font-family:monospace; font-weight:700;">
                            </div>
                            <textarea oninput="StockModule.state.operationDraftNote=this.value" placeholder="islem notu" class="stock-textarea" style="min-height:92px;">${StockModule.escapeHtml(StockModule.state.operationDraftNote || '')}</textarea>
                        </div>
                    ` : ''}
                </div>
            </section>
        `;
    },

    setDraftField: (field, value) => {
        if (field === 'depotName') StockModule.state.depotDraftName = String(value || '');
        if (field === 'depotNote') StockModule.state.depotDraftNote = String(value || '');
        if (field === 'locRaf') StockModule.state.locationDraftRaf = String(value || '').toUpperCase();
        if (field === 'locCell') StockModule.state.locationDraftCell = String(value || '').toUpperCase();
        if (field === 'locNote') StockModule.state.locationDraftNote = String(value || '');
        if (field === 'locIdCode') StockModule.state.locationDraftIdCode = StockModule.normalizeLocationIdCode(value || '');
    },

    resetDepotDraft: () => {
        StockModule.state.depotModalCellsOnly = false;
        StockModule.state.depotDraftName = '';
        StockModule.state.depotDraftNote = '';
        StockModule.state.locationDraftRaf = '';
        StockModule.state.locationDraftCell = '';
        StockModule.state.locationDraftNote = '';
        StockModule.state.locationDraftIdCode = '';
        StockModule.state.locationDraftEditIndex = -1;
        StockModule.state.depotDraftLocations = [];
        StockModule.state.depotEditingId = null;
    },

    makeDepotId: (name) => {
        const slug = String(name || '')
            .trim()
            .toLocaleLowerCase('tr-TR')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            || 'depo';
        let candidate = `depot_${slug}`;
        let index = 2;
        const used = new Set((DB.data.data.stockDepots || []).map((row) => String(row?.id || '')));
        while (used.has(candidate)) {
            candidate = `depot_${slug}_${index}`;
            index += 1;
        }
        return candidate;
    },

    openDepotCreateModal: () => {
        StockModule.resetDepotDraft();
        StockModule.state.depotModalCellsOnly = false;
        StockModule.renderDepotModal();
    },

    openDepotEditModal: (depotId) => {
        const targetId = String(depotId || '');
        const depot = targetId === 'main'
            ? StockModule.getMainDepot()
            : (DB.data.data.stockDepots || []).find((row) => String(row?.id || '') === targetId);
        if (!depot) return;
        StockModule.resetDepotDraft();
        StockModule.state.depotModalCellsOnly = false;
        StockModule.state.depotEditingId = String(depot.id || '');
        StockModule.state.depotDraftName = String(depot.name || '');
        StockModule.state.depotDraftNote = String(depot.note || '');
        StockModule.state.depotDraftLocations = StockModule.getDepotLocations(depot.id).map((row) => ({
            id: String(row?.id || ''),
            rafCode: String(row?.rafCode || '').trim().toUpperCase(),
            cellCode: String(row?.cellCode || '').trim().toUpperCase(),
            note: String(row?.note || ''),
            idCode: StockModule.normalizeLocationIdCode(row?.idCode || '')
        }));
        StockModule.renderDepotModal();
    },
    getNodeLocationScopeId: (node) => {
        const kind = String(node?.kind || '').trim().toLowerCase();
        if (kind === 'managed') return String(node?.id || '').trim();
        if (kind === 'unit') return `unit:${String(node?.id || '').trim()}`;
        if (kind === 'external') return `external:${String(node?.id || '').trim()}`;
        return '';
    },
    openLocationManagerForSelectedNode: () => {
        const node = StockModule.getSelectedNode();
        if (!node || String(node?.key || '') === 'all') {
            alert('Lutfen once bir depo seciniz.');
            return;
        }
        const scopeId = StockModule.getNodeLocationScopeId(node);
        if (!scopeId) {
            alert('Secili depo icin hucre yonetimi acilamadi.');
            return;
        }
        StockModule.resetDepotDraft();
        StockModule.state.depotModalCellsOnly = true;
        StockModule.state.depotEditingId = scopeId;
        StockModule.state.depotDraftName = String(node?.name || '').trim();
        StockModule.state.depotDraftNote = String(node?.note || '').trim();
        StockModule.state.depotDraftLocations = StockModule.getDepotLocations(scopeId).map((row) => ({
            id: String(row?.id || ''),
            rafCode: String(row?.rafCode || '').trim().toUpperCase(),
            cellCode: String(row?.cellCode || '').trim().toUpperCase(),
            note: String(row?.note || ''),
            idCode: StockModule.normalizeLocationIdCode(row?.idCode || '')
        }));
        StockModule.renderDepotModal();
    },

    addDraftLocation: () => {
        const rafCode = String(StockModule.state.locationDraftRaf || '').trim().toUpperCase();
        const cellCode = String(StockModule.state.locationDraftCell || '').trim().toUpperCase();
        const note = String(StockModule.state.locationDraftNote || '').trim();
        const draftIdCode = StockModule.normalizeLocationIdCode(StockModule.state.locationDraftIdCode || '');
        const editIndex = Number(StockModule.state.locationDraftEditIndex);
        if (!rafCode || !cellCode) return alert('Raf ve hucre kodu giriniz.');
        const draftRows = StockModule.state.depotDraftLocations || [];
        const exists = (StockModule.state.depotDraftLocations || []).some((row, rowIndex) => {
            if (Number(editIndex) !== -1 && rowIndex === Number(editIndex)) return false;
            return String(row?.rafCode || '').trim().toUpperCase() === rafCode
                && String(row?.cellCode || '').trim().toUpperCase() === cellCode;
        });
        if (exists) return alert('Bu raf / hucre zaten listede var.');
        const usedCodes = new Set();
        draftRows.forEach((row, rowIndex) => {
            if (Number.isInteger(editIndex) && editIndex >= 0 && rowIndex === editIndex) return;
            const code = StockModule.normalizeLocationIdCode(row?.idCode || '');
            if (code) usedCodes.add(code);
        });
        const editedRow = Number.isInteger(editIndex) && editIndex >= 0 ? (draftRows[editIndex] || {}) : {};
        const editedRowId = String(editedRow?.id || '');
        (DB.data?.data?.stockDepotLocations || []).forEach((row) => {
            if (editedRowId && String(row?.id || '') === editedRowId) return;
            const code = StockModule.normalizeLocationIdCode(row?.idCode || '');
            if (code) usedCodes.add(code);
        });
        if (draftIdCode && usedCodes.has(draftIdCode)) return alert('Bu ID kodu zaten kullanimda.');
        const finalIdCode = draftIdCode || StockModule.getNextLocationIdCode(usedCodes);
        if (Number.isInteger(editIndex) && editIndex >= 0 && editIndex < (StockModule.state.depotDraftLocations || []).length) {
            const current = StockModule.state.depotDraftLocations[editIndex] || {};
            StockModule.state.depotDraftLocations[editIndex] = {
                id: String(current?.id || ''),
                rafCode,
                cellCode,
                note,
                idCode: finalIdCode
            };
        } else {
            StockModule.state.depotDraftLocations.push({ id: '', rafCode, cellCode, note, idCode: finalIdCode });
        }
        StockModule.state.locationDraftRaf = '';
        StockModule.state.locationDraftCell = '';
        StockModule.state.locationDraftNote = '';
        StockModule.state.locationDraftIdCode = '';
        StockModule.state.locationDraftEditIndex = -1;
        StockModule.renderDepotModal();
    },
    startEditDraftLocation: (index) => {
        const rows = StockModule.state.depotDraftLocations || [];
        const idx = Number(index);
        if (!Number.isInteger(idx) || idx < 0 || idx >= rows.length) return;
        const row = rows[idx] || {};
        StockModule.state.locationDraftRaf = String(row?.rafCode || '').trim().toUpperCase();
        StockModule.state.locationDraftCell = String(row?.cellCode || '').trim().toUpperCase();
        StockModule.state.locationDraftNote = String(row?.note || '');
        StockModule.state.locationDraftIdCode = StockModule.normalizeLocationIdCode(row?.idCode || '');
        StockModule.state.locationDraftEditIndex = idx;
        StockModule.renderDepotModal();
    },
    cancelDraftLocationEdit: () => {
        StockModule.state.locationDraftRaf = '';
        StockModule.state.locationDraftCell = '';
        StockModule.state.locationDraftNote = '';
        StockModule.state.locationDraftIdCode = '';
        StockModule.state.locationDraftEditIndex = -1;
        StockModule.renderDepotModal();
    },

    removeDraftLocation: (index) => {
        const idx = Number(index);
        if (!Number.isInteger(idx) || idx < 0) return;
        if (!confirm('Bu hucre satiri silinsin mi?')) return;
        StockModule.state.depotDraftLocations = (StockModule.state.depotDraftLocations || []).filter((_row, rowIndex) => rowIndex !== idx);
        const editIndex = Number(StockModule.state.locationDraftEditIndex);
        if (editIndex === idx) {
            StockModule.state.locationDraftEditIndex = -1;
            StockModule.state.locationDraftRaf = '';
            StockModule.state.locationDraftCell = '';
            StockModule.state.locationDraftNote = '';
            StockModule.state.locationDraftIdCode = '';
        } else if (editIndex > idx) {
            StockModule.state.locationDraftEditIndex = editIndex - 1;
        }
        StockModule.renderDepotModal();
    },

    renderDepotDraftRows: () => {
        const rows = StockModule.state.depotDraftLocations || [];
        if (rows.length === 0) {
            return `<tr><td colspan="6" class="stock-empty">Henuz hucre eklenmedi. Istersen bos depo olarak da kaydedebilirsin.</td></tr>`;
        }
        return rows.map((row, index) => `
            <tr>
                <td>${StockModule.escapeHtml(row.rafCode || '-')}</td>
                <td>${StockModule.escapeHtml(row.cellCode || '-')}</td>
                <td>${StockModule.escapeHtml(row.note || '-')}</td>
                <td style="font-family:monospace; color:#0f172a; font-weight:700;">${StockModule.escapeHtml(StockModule.normalizeLocationIdCode(row?.idCode || '-') || '-')}</td>
                <td style="font-family:monospace; color:#1d4ed8; font-weight:700;">${StockModule.escapeHtml(StockModule.getLocationCode(row))}</td>
                <td style="text-align:right;">
                    <div style="display:inline-flex; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end;">
                        <button class="btn-sm stock-btn-compact" onclick="StockModule.startEditDraftLocation(${index})">duzenle</button>
                        <button class="btn-sm stock-btn-compact" onclick="StockModule.removeDraftLocation(${index})">sil</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    renderDepotModal: () => {
        const editing = !!String(StockModule.state.depotEditingId || '');
        const editingMain = String(StockModule.state.depotEditingId || '') === 'main';
        const cellsOnly = !!StockModule.state.depotModalCellsOnly;
        const lockDepotMeta = cellsOnly || editingMain;
        const editingLocation = Number.isInteger(Number(StockModule.state.locationDraftEditIndex)) && Number(StockModule.state.locationDraftEditIndex) >= 0;
        const modalTitle = cellsOnly
            ? `Duzenle / Hucre Ekle - ${StockModule.escapeHtml(StockModule.state.depotDraftName || 'Depo')}`
            : (editing ? 'Depo Duzenle' : 'Depo Olustur');
        Modal.open(modalTitle, `
            <div class="stock-modal-form">
                <div class="stock-modal-title">${cellsOnly ? 'Bu pencerede sadece hucre tanimlarini yonetirsiniz.' : (editing ? 'Secili depoyu duzenle' : 'Yeni depo tanimi')}</div>
                <div class="stock-modal-note">${cellsOnly ? 'Depo secimi korunur. Raf / hucre ekleyebilir, duzenleyebilir ve kaydedebilirsiniz.' : (editingMain ? 'Ana depoda ayni pencereden raf / hucre ekleyebilirsin.' : 'Depo adi ve notu gir. Istersen ayni pencerede raf / hucre de ekleyebilirsin.')}</div>

                <div class="stock-modal-grid">
                    <div>
                        <label class="stock-modal-label">Depo adi</label>
                        <input class="stock-input stock-input-tall" value="${StockModule.escapeHtml(StockModule.state.depotDraftName)}" oninput="StockModule.setDraftField('depotName', this.value)" placeholder="or: SEVKIYATA GIDECEK URUNLER" ${lockDepotMeta ? 'disabled' : ''}>
                    </div>
                    <div>
                        <label class="stock-modal-label">Not</label>
                        <textarea class="stock-textarea" oninput="StockModule.setDraftField('depotNote', this.value)" placeholder="or: Merdiven yani alan" ${lockDepotMeta ? 'disabled' : ''}>${StockModule.escapeHtml(StockModule.state.depotDraftNote)}</textarea>
                    </div>
                </div>

                <div class="stock-modal-divider"></div>
                <div class="stock-modal-subtitle">Hucre ekle</div>

                <div class="stock-modal-row">
                    <div>
                        <label class="stock-modal-label">Raf</label>
                        <input class="stock-input stock-input-tall" value="${StockModule.escapeHtml(StockModule.state.locationDraftRaf)}" oninput="StockModule.setDraftField('locRaf', this.value)" placeholder="or: R01">
                    </div>
                    <div>
                        <label class="stock-modal-label">Hucre</label>
                        <input class="stock-input stock-input-tall" value="${StockModule.escapeHtml(StockModule.state.locationDraftCell)}" oninput="StockModule.setDraftField('locCell', this.value)" placeholder="or: A1">
                    </div>
                    <div>
                        <label class="stock-modal-label">Hucre notu</label>
                        <input class="stock-input stock-input-tall" value="${StockModule.escapeHtml(StockModule.state.locationDraftNote)}" oninput="StockModule.setDraftField('locNote', this.value)" placeholder="opsiyonel">
                    </div>
                    <div>
                        <label class="stock-modal-label">ID kodu</label>
                        <input class="stock-input stock-input-tall" value="${StockModule.escapeHtml(StockModule.state.locationDraftIdCode)}" oninput="StockModule.setDraftField('locIdCode', this.value)" placeholder="or: LOC-000123">
                    </div>
                    <div class="stock-modal-action">
                        <button class="btn-primary stock-btn-compact stock-btn-primary-compact" onclick="StockModule.addDraftLocation()">${editingLocation ? 'hucreyi guncelle' : 'hucre ekle +'}</button>
                    </div>
                </div>
                ${editingLocation ? `
                    <div style="display:flex; justify-content:flex-end; margin-top:0.5rem;">
                        <button class="btn-sm" onclick="StockModule.cancelDraftLocationEdit()">duzenlemeyi iptal et</button>
                    </div>
                ` : ''}

                <div class="stock-table-card" style="margin-top:0.9rem;">
                    <table>
                        <thead>
                            <tr>
                                <th style="text-align:left;">Raf</th>
                                <th style="text-align:left;">Hucre</th>
                                <th style="text-align:left;">Not</th>
                                <th style="text-align:left;">ID kodu</th>
                                <th style="text-align:left;">Kod</th>
                                <th style="text-align:right;">Islem</th>
                            </tr>
                        </thead>
                        <tbody>${StockModule.renderDepotDraftRows()}</tbody>
                    </table>
                </div>

                <div class="stock-modal-footer">
                    ${editing && !editingMain && !cellsOnly ? `<button class="btn-sm" onclick="StockModule.deleteDepot('${StockModule.escapeHtml(StockModule.state.depotEditingId || '')}')">Sil</button>` : '<div></div>'}
                    <div style="display:flex; gap:0.55rem;">
                        <button class="btn-sm" onclick="StockModule.resetDepotDraft(); Modal.close()">Vazgec</button>
                        <button class="btn-primary" onclick="StockModule.saveDepotModal()">${cellsOnly ? 'Degisiklikleri Kaydet' : (editing ? 'Kaydet' : 'Depoyu kaydet')}</button>
                    </div>
                </div>
            </div>
        `, { maxWidth: '960px' });
    },

    saveDepotModal: async () => {
        const name = String(StockModule.state.depotDraftName || '').trim().toUpperCase();
        const note = String(StockModule.state.depotDraftNote || '').trim();
        const editingId = String(StockModule.state.depotEditingId || '');
        const editingMain = editingId === 'main';
        const cellsOnly = !!StockModule.state.depotModalCellsOnly;
        if (!cellsOnly && !name) return alert('Depo adi zorunlu.');

        if (!cellsOnly) {
            const duplicateName = (DB.data.data.stockDepots || []).some((row) =>
                String(row?.id || '') !== editingId
                && String(row?.name || '').trim().toUpperCase() === name
                && row?.isActive !== false
            );
            if (duplicateName) return alert('Bu isimde bir depo zaten var.');
        }

        let depotId = editingId;
        const now = new Date().toISOString();
        if (!cellsOnly) {
            if (editingId) {
                if (!editingMain) {
                    const depot = (DB.data.data.stockDepots || []).find((row) => String(row?.id || '') === editingId);
                    if (!depot) return;
                    depot.name = name;
                    depot.note = note;
                    depot.isActive = true;
                }
            } else {
                depotId = StockModule.makeDepotId(name);
                DB.data.data.stockDepots.push({ id: depotId, name, note, isActive: true, created_at: now });
            }
        } else if (!depotId) {
            return alert('Hucre eklenecek depo secilemedi.');
        }

        const usedLocationCodes = new Set(
            (DB.data.data.stockDepotLocations || [])
                .filter((row) => String(row?.depotId || '') !== String(depotId || ''))
                .map((row) => StockModule.normalizeLocationIdCode(row?.idCode || ''))
                .filter(Boolean)
        );
        const nextLocations = (StockModule.state.depotDraftLocations || []).map((row) => {
            const requestedIdCode = StockModule.normalizeLocationIdCode(row?.idCode || '');
            const finalIdCode = requestedIdCode && !usedLocationCodes.has(requestedIdCode)
                ? requestedIdCode
                : StockModule.getNextLocationIdCode(usedLocationCodes);
            usedLocationCodes.add(finalIdCode);
            return {
                id: String(row?.id || '').trim() || crypto.randomUUID(),
                depotId,
                rafCode: String(row?.rafCode || '').trim().toUpperCase(),
                cellCode: String(row?.cellCode || '').trim().toUpperCase(),
                note: String(row?.note || '').trim(),
                idCode: finalIdCode,
                created_at: now
            };
        });

        DB.data.data.stockDepotLocations = (DB.data.data.stockDepotLocations || [])
            .filter((row) => String(row?.depotId || '') !== depotId)
            .concat(nextLocations);

        if (!cellsOnly) {
            StockModule.state.selectedKey = `managed:${depotId}`;
            StockModule.state.topTab = depotId === 'depot_transfer' ? 'transfer' : 'all';
        }
        await DB.save();
        StockModule.resetDepotDraft();
        Modal.close();
        UI.renderCurrentPage();
    },

    deleteDepot: async (depotId) => {
        const depot = (DB.data.data.stockDepots || []).find((row) => String(row?.id || '') === String(depotId || ''));
        if (!depot) return;
        if (!confirm('Bu depoyu listeden kaldirmak istiyor musunuz?')) return;
        depot.isActive = false;
        DB.data.data.stockDepotLocations = (DB.data.data.stockDepotLocations || []).filter((row) => String(row?.depotId || '') !== String(depotId || ''));
        if (String(StockModule.state.selectedKey || '') === `managed:${String(depotId || '')}`) {
            StockModule.state.selectedKey = 'all';
            StockModule.state.topTab = 'all';
        }
        await DB.save();
        StockModule.resetDepotDraft();
        Modal.close();
        UI.renderCurrentPage();
    },

    renderSidebarSection: (title, items, options = {}) => {
        const canEdit = !!options.canEdit;
        const showInlineEdit = false;
        if (items.length === 0) return '';
        return `
            <div class="stock-side-group">
                <div class="stock-side-group-title">${title}</div>
                <div class="stock-side-list">
                    ${items.map((item) => {
            const selected = String(StockModule.state.selectedKey || '') === String(item.key || '');
            const rowCanEdit = showInlineEdit && canEdit && item?.editable === true;
            return `
                            <div class="stock-side-row${rowCanEdit ? ' with-edit' : ''}">
                                <button onclick="StockModule.selectNode('${StockModule.escapeHtml(item.key || '')}')" class="stock-side-btn${selected ? ' active' : ''}">${StockModule.escapeHtml(item.name || '-')}</button>
                                ${rowCanEdit ? `<button class="stock-side-edit" onclick="event.stopPropagation(); StockModule.openDepotEditModal('${StockModule.escapeHtml(item.id || '')}')">duzenle</button>` : ''}
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    },
    renderInventoryGroups: (node) => {
        const baseGroups = StockModule.getInventoryGroups(node);
        const groups = String(node?.key || '') === 'all'
            ? [{
                key: 'all_merged',
                title: 'Tum depolar',
                rows: baseGroups.flatMap((group) => (Array.isArray(group?.rows) ? group.rows : []))
            }]
            : baseGroups;
        if (groups.length === 0 || groups.every((group) => !Array.isArray(group?.rows) || group.rows.length === 0)) {
            return `<div class="stock-table-card"><div class="stock-empty">Bu alanda listelenecek urun henuz yok. Diger moduller malzeme yerlestirdikce burada gorunecek.</div></div>`;
        }
        const stockFilters = StockModule.getInventoryStockFilters();
        const activeFilterCount = Object.values(stockFilters).filter(Boolean).length;
        if (activeFilterCount === 0) {
            return `<div class="stock-table-card"><div class="stock-empty" style="text-align:left;">En az bir stok durumu seciniz.</div></div>`;
        }
        const renderRows = (rows) => {
            return (Array.isArray(rows) ? rows : []).map((row) => {
                const statusMeta = StockModule.getInventoryRowStatusMeta(row);
                const statusClass = statusMeta.key === 'reserve'
                    ? 'stock-item-state-reserve'
                    : (statusMeta.key === 'wip' ? 'stock-item-state-wip' : 'stock-item-state-available');
                const modelText = StockModule.getInventoryRowModelText(row);
                const qtyText = `${row?.quantity ?? '-'}${row?.unit ? ` ${row.unit}` : ''}`.trim();
                const depotText = String(row?.depotName || '-').trim() || '-';
                const locationText = String(row?.locationCode || '-').trim() || '-';
                const locationSummary = `Depo: ${depotText}${locationText && locationText !== '-' ? ` / ${locationText}` : ''}`;
                const safeCode = StockModule.escapeJsString(row?.code || '');
                const safeId = StockModule.escapeJsString(row?.id || '');
                return `
                    <div class="stock-item-row">
                        <button type="button" class="stock-item-code" onclick="StockModule.openInventoryItemCard('${safeCode}')">${StockModule.escapeHtml(row?.code || '-')}</button>
                        <div class="stock-item-divider"></div>
                        <div class="stock-item-name">${StockModule.escapeHtml(row?.name || '-')}</div>
                        <div class="stock-item-model">${StockModule.escapeHtml(modelText)}</div>
                        <div class="stock-item-qty">${StockModule.escapeHtml(qtyText || '-')}</div>
                        <div class="stock-item-location stock-item-location-inline">${StockModule.escapeHtml(locationSummary)}</div>
                        <span class="stock-item-state ${statusClass}">${StockModule.escapeHtml(statusMeta.text)}</span>
                        <button type="button" class="stock-item-action" onclick="StockModule.openInventoryRowHistory('${safeCode}','${safeId}')">Goruntule / Duzenle</button>
                    </div>
                `;
            }).join('');
        };
        const renderCategoryBlocks = (scopeKey, rows, emptyMessage, options = {}) => {
            const includeEmpty = !!options.includeEmpty;
            const categories = StockModule.groupInventoryRowsByCategory(rows, { includeEmpty });
            if (!Array.isArray(categories) || categories.length === 0) {
                return `<div class="stock-empty" style="padding:0.85rem; color:#94a3b8;">${StockModule.escapeHtml(emptyMessage || 'Kayit yok.')}</div>`;
            }
            return `
                <div class="stock-category-list">
                    ${categories.map((category) => {
            const isOpen = StockModule.isInventoryCategoryOpen(scopeKey, category.id);
            return `
                            <div class="stock-category-item">
                                <button type="button" class="stock-category-header${isOpen ? ' open' : ''}" onclick="StockModule.toggleInventoryCategory('${StockModule.escapeHtml(scopeKey)}','${StockModule.escapeHtml(category.id)}')">
                                    <span class="stock-category-chevron">${isOpen ? '&#9662;' : '&#9656;'}</span>
                                    <span class="stock-category-label">${StockModule.escapeHtml(category.title || '-')}</span>
                                    <span class="stock-category-count">(${Number(category.rows.length || 0)})</span>
                                </button>
                                ${isOpen ? `
                                    <div class="stock-category-body">
                                        ${category.rows.length === 0
                ? `<div class="stock-empty" style="padding:0.7rem; color:#94a3b8; text-align:left;">Bu depoda bu kategoride urun kaydi yok.</div>`
                : `<div class="stock-item-list">${renderRows(category.rows)}</div>`}
                                    </div>
                                ` : ''}
                            </div>
                        `;
        }).join('')}
                </div>
            `;
        };
        return groups.map((group) => {
            const rows = Array.isArray(group?.rows) ? group.rows : [];
            const filteredRows = rows.filter((row) => {
                const qty = StockModule.getStockRowQty(row);
                if (qty <= 0) return false;
                const statusKey = StockModule.getInventoryRowStatusMeta(row).key;
                if (statusKey === 'available') return !!stockFilters.available;
                if (statusKey === 'wip') return !!stockFilters.inProcess;
                if (statusKey === 'reserve') return !!stockFilters.reserve;
                return false;
            });
            const mergedScopeKey = `${String(group?.key || 'group')}|filtered`;
            return `
                <div class="stock-group-card">
                    ${String(node?.key || '') === 'all' ? `<div class="stock-group-title">TUM DEPOLAR / BIRLESIK LISTE</div>` : ''}
                    <div class="stock-table-card" style="margin-top:${String(node?.key || '') === 'all' ? '0.65rem' : '0'}; padding:0.75rem;">
                        <div style="font-size:0.78rem; font-weight:800; color:#0f766e; margin-bottom:0.35rem;">STOK LISTESI</div>
                        ${renderCategoryBlocks(mergedScopeKey, filteredRows, 'Secilen filtrede kayit yok.', { includeEmpty: true })}
                    </div>
                </div>
            `;
        }).join('');
    },

    renderLocationsCard: (node) => {
        const scopeId = StockModule.getNodeLocationScopeId(node);
        if (!scopeId) return '';
        const locations = StockModule.getDepotLocations(scopeId);
        if (locations.length === 0) return '';
        const activeFilter = StockModule.getInventoryLocationFilterForNode(node);
        const scopeKey = String(node?.key || '');
        return `
            <div class="stock-location-card">
                <div class="stock-location-head">
                    <div class="stock-location-title">tanimli konumlar</div>
                    ${activeFilter ? `<button type="button" class="btn-sm stock-location-clear-btn" onclick="StockModule.clearInventoryLocationFilter()">Hepsini goster</button>` : ''}
                </div>
                <div class="stock-location-list">
                    ${locations.map((row) => {
            const locationId = String(row?.id || '').trim();
            const locationCode = String(StockModule.getLocationCode(row) || '').trim().toUpperCase();
            const label = locationCode || '-';
            const idCode = String(StockModule.normalizeLocationIdCode(row?.idCode || '') || '-').trim();
            const isActive = !!activeFilter
                && (
                    (locationId && activeFilter.locationId === locationId)
                    || (!locationId && !!activeFilter.locationCode && activeFilter.locationCode === locationCode)
                );
            const safeScopeKey = StockModule.escapeJsString(scopeKey);
            const safeLocationId = StockModule.escapeJsString(locationId);
            const safeLocationCode = StockModule.escapeJsString(locationCode);
            const safeLabel = StockModule.escapeJsString(label);
            const safeScopeId = StockModule.escapeJsString(scopeId);
            return `
                            <button type="button" class="stock-location-chip${isActive ? ' active' : ''}" onclick="StockModule.toggleInventoryLocationFilter('${safeScopeKey}','${safeLocationId}','${safeLocationCode}','${safeLabel}','${safeScopeId}')">
                                <div class="stock-location-chip-code">${StockModule.escapeHtml(label)}</div>
                                <div class="stock-location-chip-id">ID: ${StockModule.escapeHtml(idCode)}</div>
                                <div class="stock-location-chip-note">${StockModule.escapeHtml(row.note || 'not yok')}</div>
                            </button>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    },

    renderReferenceNotice: (node) => {
        if (node.kind !== 'unit' && node.kind !== 'external' && node.kind !== 'all') return '';
        return `
            <div class="stock-ref-card">
                <div class="stock-ref-label">${node.kind === 'all' ? 'Tum depo gorunumu' : node.kind === 'unit' ? 'Atolye gozlemi' : 'Dis birim gozlemi'}</div>
                <div class="stock-ref-title">${StockModule.escapeHtml(node.name || '-')}</div>
                <div class="stock-ref-text">Bu ekran bu alanlarda stok hareketi yapmaz. Sadece urunlerin nerede oldugunu ve hangi depoda gorundugunu izlemek icin kullanilir.</div>
            </div>
        `;
    },

    renderGoodsReceiptLayout: () => {
        StockModule.ensureGoodsReceiptDraftState();
        const draft = StockModule.state.goodsReceiptDraft || StockModule.buildEmptyGoodsReceiptDraft();
        const statusMeta = StockModule.getGoodsReceiptStatusMeta(draft?.status || 'TASLAK');
        const isEditable = statusMeta.key === 'TASLAK';
        const disabledAttr = isEditable ? '' : 'disabled';
        const suppliers = StockModule.getGoodsReceiptSupplierOptions();
        const depots = StockModule.getGoodsReceiptDepotOptions();
        const products = StockModule.getGoodsReceiptProductOptions();
        const locations = StockModule.getGoodsReceiptLocationOptions(String(draft?.depotId || 'main'));
        const totals = StockModule.getGoodsReceiptTotals(draft?.lines || []);
        const lines = Array.isArray(draft?.lines) && draft.lines.length > 0 ? draft.lines : [StockModule.buildEmptyGoodsReceiptLine()];
        const filters = (StockModule.state.goodsReceiptFilters && typeof StockModule.state.goodsReceiptFilters === 'object')
            ? StockModule.state.goodsReceiptFilters
            : { docNo: '', supplierId: '', depotId: '', status: '', dateFrom: '', dateTo: '' };
        const records = StockModule.getFilteredGoodsReceiptRecords();
        const currentRecordId = String(draft?.id || StockModule.state.goodsReceiptEditingId || '').trim();

        return `
            <section class="stock-shell">
                <div class="stock-subpage-shell">
                    <div class="stock-subpage-head">
                        <h2 class="stock-title">depo & stok / mal kabul</h2>
                        <button class="btn-sm" onclick="StockModule.openWorkspace('menu')">geri</button>
                    </div>

                    <div class="card-table" style="padding:1.05rem 1.2rem; margin-bottom:0.9rem;">
                        <div style="display:flex; justify-content:space-between; gap:0.8rem; align-items:flex-start; flex-wrap:wrap;">
                            <div>
                                <div style="font-size:1.02rem; font-weight:800; color:#0f172a;">Mal kabul fis kaydi</div>
                                <div style="font-size:0.86rem; color:#64748b; margin-top:0.3rem;">PO baglantisi opsiyonel, teslim fisi PDF indir/yazdir destekli.</div>
                            </div>
                            <div style="display:flex; align-items:center; gap:0.45rem; flex-wrap:wrap;">
                                <span style="display:inline-flex; align-items:center; padding:0.24rem 0.72rem; border:1px solid ${StockModule.escapeHtml(statusMeta.border)}; border-radius:999px; font-size:0.78rem; font-weight:800; background:${StockModule.escapeHtml(statusMeta.bg)}; color:${StockModule.escapeHtml(statusMeta.color)};">${StockModule.escapeHtml(statusMeta.text)}</span>
                                <span style="font-family:Consolas, monospace; font-size:0.82rem; font-weight:800; color:#1d4ed8;">${StockModule.escapeHtml(String(draft?.docNo || '-'))}</span>
                            </div>
                        </div>
                    </div>

                    <div class="card-table" style="padding:1rem 1.1rem; margin-bottom:1rem;">
                        <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.6rem;">
                            <div>
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Fis no</label>
                                <input class="stock-input stock-input-tall" value="${StockModule.escapeHtml(String(draft?.docNo || '-'))}" readonly style="font-family:Consolas, monospace; font-weight:800; background:#f8fafc;">
                            </div>
                            <div>
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Teslim tarihi</label>
                                <input class="stock-input stock-input-tall" type="datetime-local" value="${StockModule.escapeHtml(String(draft?.receiptDate || ''))}" onchange="StockModule.setGoodsReceiptDraftField('receiptDate', this.value)" ${disabledAttr}>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Tedarikci</label>
                                <select class="stock-input stock-input-tall" onchange="StockModule.setGoodsReceiptDraftField('supplierId', this.value)" ${disabledAttr}>
                                    <option value="">Tedarikci sec</option>
                                    ${suppliers.map((row) => `<option value="${StockModule.escapeHtml(row.id)}" ${String(draft?.supplierId || '') === String(row.id) ? 'selected' : ''}>${StockModule.escapeHtml(row.name)}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Depo</label>
                                <select class="stock-input stock-input-tall" onchange="StockModule.setGoodsReceiptDraftField('depotId', this.value)" ${disabledAttr}>
                                    ${depots.map((row) => `<option value="${StockModule.escapeHtml(row.id)}" ${String(draft?.depotId || '') === String(row.id) ? 'selected' : ''}>${StockModule.escapeHtml(row.name)}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Irsaliye no</label>
                                <input class="stock-input stock-input-tall" value="${StockModule.escapeHtml(String(draft?.dispatchNo || ''))}" oninput="StockModule.setGoodsReceiptDraftField('dispatchNo', this.value)" placeholder="or: IRS-2026-001" ${disabledAttr}>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Siparis no (ops.)</label>
                                <input class="stock-input stock-input-tall" value="${StockModule.escapeHtml(String(draft?.poNo || ''))}" oninput="StockModule.setGoodsReceiptDraftField('poNo', this.value)" placeholder="or: PO-2026-001" ${disabledAttr}>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Teslim alan personel</label>
                                <input class="stock-input stock-input-tall" value="${StockModule.escapeHtml(String(draft?.receiverName || ''))}" oninput="StockModule.setGoodsReceiptDraftField('receiverName', this.value)" placeholder="personel adi" ${disabledAttr}>
                            </div>
                            <div style="grid-column:span 4;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Not</label>
                                <textarea class="stock-textarea" style="min-height:72px;" oninput="StockModule.setGoodsReceiptDraftField('note', this.value)" placeholder="opsiyonel aciklama" ${disabledAttr}>${StockModule.escapeHtml(String(draft?.note || ''))}</textarea>
                            </div>
                        </div>
                    </div>

                    <div class="card-table" style="padding:1rem 1.1rem; margin-bottom:1rem;">
                        <div style="display:flex; justify-content:space-between; gap:0.7rem; align-items:center; flex-wrap:wrap; margin-bottom:0.65rem;">
                            <div style="font-size:0.95rem; font-weight:800; color:#0f172a;">Urun satirlari</div>
                            <button class="btn-sm" onclick="StockModule.addGoodsReceiptLine()" ${isEditable ? '' : 'disabled'}>satir ekle +</button>
                        </div>
                        <div style="overflow:auto;">
                            <table style="width:100%; min-width:1220px; border-collapse:collapse;">
                                <thead>
                                    <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.73rem; text-transform:uppercase;">
                                        <th style="padding:0.55rem; text-align:left;">Urun</th>
                                        <th style="padding:0.55rem; text-align:left;">Kod</th>
                                        <th style="padding:0.55rem; text-align:center;">Birim</th>
                                        <th style="padding:0.55rem; text-align:right;">Kabul</th>
                                        <th style="padding:0.55rem; text-align:right;">Hasar</th>
                                        <th style="padding:0.55rem; text-align:right;">Eksik</th>
                                        <th style="padding:0.55rem; text-align:left;">Lokasyon</th>
                                        <th style="padding:0.55rem; text-align:left;">Hasar notu</th>
                                        <th style="padding:0.55rem; text-align:center;">Islem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${lines.map((line, idx) => {
            const lineId = StockModule.escapeHtml(String(line?.id || ''));
            const qtyStep = StockModule.getGoodsReceiptQtyStep(line?.unit || 'ADET');
            const acceptedValue = Number(line?.acceptedQty || 0) > 0 ? String(line.acceptedQty) : '';
            const damagedValue = Number(line?.damagedQty || 0) > 0 ? String(line.damagedQty) : '';
            const missingValue = Number(line?.missingQty || 0) > 0 ? String(line.missingQty) : '';
            return `
                                        <tr style="border-bottom:1px solid #f1f5f9;">
                                            <td style="padding:0.5rem;">
                                                <select class="stock-input stock-input-tall" style="min-width:260px;" onchange="StockModule.setGoodsReceiptLineField('${lineId}','productId',this.value)" ${disabledAttr}>
                                                    <option value="">Urun sec</option>
                                                    ${products.map((product) => `<option value="${StockModule.escapeHtml(product.id)}" ${String(line?.productId || '') === String(product.id) ? 'selected' : ''}>${StockModule.escapeHtml(`${product.code} - ${product.name}`)}</option>`).join('')}
                                                </select>
                                            </td>
                                            <td style="padding:0.5rem; font-family:Consolas, monospace; font-weight:700; color:#1d4ed8;">${StockModule.escapeHtml(String(line?.productCode || '-'))}</td>
                                            <td style="padding:0.5rem; text-align:center; font-weight:700; color:#334155;">${StockModule.escapeHtml(String(line?.unit || '-'))}</td>
                                            <td style="padding:0.5rem;">
                                                <input class="stock-input stock-input-tall" type="number" min="0" step="${StockModule.escapeHtml(qtyStep)}" value="${StockModule.escapeHtml(acceptedValue)}" onchange="StockModule.setGoodsReceiptLineField('${lineId}','acceptedQty',this.value)" ${disabledAttr}>
                                            </td>
                                            <td style="padding:0.5rem;">
                                                <input class="stock-input stock-input-tall" type="number" min="0" step="${StockModule.escapeHtml(qtyStep)}" value="${StockModule.escapeHtml(damagedValue)}" onchange="StockModule.setGoodsReceiptLineField('${lineId}','damagedQty',this.value)" ${disabledAttr}>
                                            </td>
                                            <td style="padding:0.5rem;">
                                                <input class="stock-input stock-input-tall" type="number" min="0" step="${StockModule.escapeHtml(qtyStep)}" value="${StockModule.escapeHtml(missingValue)}" onchange="StockModule.setGoodsReceiptLineField('${lineId}','missingQty',this.value)" ${disabledAttr}>
                                            </td>
                                            <td style="padding:0.5rem;">
                                                <select class="stock-input stock-input-tall" style="min-width:170px;" onchange="StockModule.setGoodsReceiptLineField('${lineId}','locationId',this.value)" ${disabledAttr}>
                                                    <option value="">Lokasyon sec</option>
                                                    ${locations.map((location) => `<option value="${StockModule.escapeHtml(location.id)}" ${String(line?.locationId || '') === String(location.id) ? 'selected' : ''}>${StockModule.escapeHtml(location.label)}</option>`).join('')}
                                                </select>
                                            </td>
                                            <td style="padding:0.5rem;">
                                                <input class="stock-input stock-input-tall" value="${StockModule.escapeHtml(String(line?.damageNote || ''))}" oninput="StockModule.setGoodsReceiptLineField('${lineId}','damageNote',this.value)" placeholder="hasar aciklamasi" ${disabledAttr}>
                                            </td>
                                            <td style="padding:0.5rem; text-align:center;">
                                                <button class="btn-sm" onclick="StockModule.removeGoodsReceiptLine('${lineId}')" ${isEditable ? '' : 'disabled'}>sil</button>
                                            </td>
                                        </tr>
                                    `;
        }).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:1.2rem; margin-top:0.8rem; font-size:0.83rem; color:#334155; font-weight:700; flex-wrap:wrap;">
                            <div>Kabul: <span style="color:#0f172a;">${StockModule.escapeHtml(String(totals.accepted || 0))}</span></div>
                            <div>Hasar: <span style="color:#b45309;">${StockModule.escapeHtml(String(totals.damaged || 0))}</span></div>
                            <div>Eksik: <span style="color:#991b1b;">${StockModule.escapeHtml(String(totals.missing || 0))}</span></div>
                        </div>
                    </div>

                    <div style="display:flex; justify-content:space-between; gap:0.6rem; align-items:center; flex-wrap:wrap; margin-bottom:1rem;">
                        <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                            <button class="btn-sm" onclick="StockModule.resetGoodsReceiptDraft()">yeni fis</button>
                            <button class="btn-primary" onclick="StockModule.saveGoodsReceiptDraft()" ${isEditable ? '' : 'disabled'}>taslak kaydet</button>
                            <button class="btn-primary" style="background:#166534; border-color:#166534;" onclick="StockModule.approveGoodsReceipt()" ${isEditable ? '' : 'disabled'}>onayla ve stoga isle</button>
                            <button class="btn-sm" style="border-color:#ef4444; color:#b91c1c; background:#fff5f5;" onclick="StockModule.cancelGoodsReceipt()">fisi iptal et</button>
                        </div>
                        <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                            <button class="btn-sm" onclick="StockModule.downloadGoodsReceiptSavedDocument('${StockModule.escapeHtml(currentRecordId)}')" ${currentRecordId ? '' : 'disabled'}>PDF indir</button>
                            <button class="btn-sm" onclick="StockModule.printGoodsReceiptSavedDocument('${StockModule.escapeHtml(currentRecordId)}')" ${currentRecordId ? '' : 'disabled'}>yazdir</button>
                        </div>
                    </div>

                    <div class="card-table" style="padding:1rem 1.1rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap; margin-bottom:0.65rem;">
                            <div style="font-size:0.96rem; font-weight:800; color:#0f172a;">Kayitli mal kabul fisleri</div>
                            <div style="font-size:0.8rem; color:#64748b;">${records.length} kayit</div>
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:0.55rem; margin-bottom:0.7rem;">
                            <input class="stock-input stock-input-tall" value="${StockModule.escapeHtml(String(filters.docNo || ''))}" oninput="StockModule.setGoodsReceiptFilter('docNo', this.value)" placeholder="fis no ara">
                            <select class="stock-input stock-input-tall" onchange="StockModule.setGoodsReceiptFilter('supplierId', this.value)">
                                <option value="">tum tedarikciler</option>
                                ${suppliers.map((row) => `<option value="${StockModule.escapeHtml(row.id)}" ${String(filters.supplierId || '') === String(row.id) ? 'selected' : ''}>${StockModule.escapeHtml(row.name)}</option>`).join('')}
                            </select>
                            <select class="stock-input stock-input-tall" onchange="StockModule.setGoodsReceiptFilter('depotId', this.value)">
                                <option value="">tum depolar</option>
                                ${depots.map((row) => `<option value="${StockModule.escapeHtml(row.id)}" ${String(filters.depotId || '') === String(row.id) ? 'selected' : ''}>${StockModule.escapeHtml(row.name)}</option>`).join('')}
                            </select>
                            <select class="stock-input stock-input-tall" onchange="StockModule.setGoodsReceiptFilter('status', this.value)">
                                <option value="">tum durumlar</option>
                                <option value="TASLAK" ${String(filters.status || '') === 'TASLAK' ? 'selected' : ''}>Taslak</option>
                                <option value="ONAYLANDI" ${String(filters.status || '') === 'ONAYLANDI' ? 'selected' : ''}>Onaylandi</option>
                                <option value="IPTAL" ${String(filters.status || '') === 'IPTAL' ? 'selected' : ''}>Iptal</option>
                            </select>
                            <input class="stock-input stock-input-tall" type="date" value="${StockModule.escapeHtml(String(filters.dateFrom || ''))}" onchange="StockModule.setGoodsReceiptFilter('dateFrom', this.value)">
                            <input class="stock-input stock-input-tall" type="date" value="${StockModule.escapeHtml(String(filters.dateTo || ''))}" onchange="StockModule.setGoodsReceiptFilter('dateTo', this.value)">
                        </div>

                        <div style="overflow:auto;">
                            <table style="width:100%; min-width:980px; border-collapse:collapse;">
                                <thead>
                                    <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.73rem; text-transform:uppercase;">
                                        <th style="padding:0.55rem; text-align:left;">Fis no</th>
                                        <th style="padding:0.55rem; text-align:left;">Tarih</th>
                                        <th style="padding:0.55rem; text-align:left;">Tedarikci</th>
                                        <th style="padding:0.55rem; text-align:left;">Depo</th>
                                        <th style="padding:0.55rem; text-align:left;">Durum</th>
                                        <th style="padding:0.55rem; text-align:right;">Toplam kabul</th>
                                        <th style="padding:0.55rem; text-align:center;">Islem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${records.length === 0 ? '<tr><td colspan="7" style="padding:1.1rem; color:#94a3b8; text-align:center;">Kayit yok.</td></tr>' : records.map((row) => {
            const rowTotals = StockModule.getGoodsReceiptTotals(row?.lines || []);
            const rowStatus = StockModule.getGoodsReceiptStatusMeta(row?.status || 'TASLAK');
            const rowId = StockModule.escapeHtml(String(row?.id || ''));
            return `
                                        <tr style="border-bottom:1px solid #f1f5f9;">
                                            <td style="padding:0.55rem; font-family:Consolas, monospace; font-weight:800; color:#1d4ed8;">${StockModule.escapeHtml(String(row?.docNo || '-'))}</td>
                                            <td style="padding:0.55rem;">${StockModule.escapeHtml(StockModule.formatDateTimeLabel(row?.receiptDate || row?.created_at || ''))}</td>
                                            <td style="padding:0.55rem;">${StockModule.escapeHtml(String(row?.supplierName || '-'))}</td>
                                            <td style="padding:0.55rem;">${StockModule.escapeHtml(String(row?.depotName || '-'))}</td>
                                            <td style="padding:0.55rem;"><span style="display:inline-flex; align-items:center; padding:0.22rem 0.64rem; border:1px solid ${StockModule.escapeHtml(rowStatus.border)}; border-radius:999px; font-size:0.75rem; font-weight:700; background:${StockModule.escapeHtml(rowStatus.bg)}; color:${StockModule.escapeHtml(rowStatus.color)};">${StockModule.escapeHtml(rowStatus.text)}</span></td>
                                            <td style="padding:0.55rem; text-align:right; font-weight:800;">${StockModule.escapeHtml(String(rowTotals.accepted || 0))}</td>
                                            <td style="padding:0.55rem; text-align:center;">
                                                <div style="display:inline-flex; gap:0.35rem; flex-wrap:wrap; justify-content:center;">
                                                    <button class="btn-sm" onclick="StockModule.openGoodsReceiptRecord('${rowId}')">ac</button>
                                                    <button class="btn-sm" onclick="StockModule.downloadGoodsReceiptSavedDocument('${rowId}')">pdf</button>
                                                    <button class="btn-sm" onclick="StockModule.printGoodsReceiptSavedDocument('${rowId}')">yazdir</button>
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

    renderMenuLayout: () => {
        return `
            <section class="stock-shell">
                <div class="stock-hub">
                    <div class="stock-hub-head">
                        <h2 class="stock-title">depo & stok</h2>
                    </div>

                    <div class="stock-hub-grid">
                        <button class="stock-hub-card" onclick="StockModule.openWorkspace('goods-receipt')">
                            <div class="stock-hub-icon stock-hub-icon-emerald"><i data-lucide="package-check" width="24" height="24"></i></div>
                            <div class="stock-hub-label">Mal Kabul</div>
                        </button>
                        <button class="stock-hub-card" onclick="StockModule.openWorkspace('work-order-planning')">
                            <div class="stock-hub-icon stock-hub-icon-blue"><i data-lucide="clipboard-list" width="24" height="24"></i></div>
                            <div class="stock-hub-label">Is Emri Planlama</div>
                        </button>
                        <button class="stock-hub-card" onclick="StockModule.openWorkspace('inventory-registration')">
                            <div class="stock-hub-icon stock-hub-icon-blue"><i data-lucide="clipboard-plus" width="24" height="24"></i></div>
                            <div class="stock-hub-label">Envantere Elle Kayit</div>
                        </button>
                        <button class="stock-hub-card" onclick="StockModule.openWorkspace('depots')">
                            <div class="stock-hub-icon"><i data-lucide="warehouse" width="24" height="24"></i></div>
                            <div class="stock-hub-label">Tum depolar</div>
                        </button>
                        <button class="stock-hub-card" onclick="StockModule.openWorkspace('personnel')">
                            <div class="stock-hub-icon stock-hub-icon-blue"><i data-lucide="users" width="24" height="24"></i></div>
                            <div class="stock-hub-label">Personel</div>
                        </button>
                        <button class="stock-hub-card" onclick="StockModule.openWorkspace('operation-library')">
                            <div class="stock-hub-icon stock-hub-icon-sky"><i data-lucide="library-big" width="24" height="24"></i></div>
                            <div class="stock-hub-label">Islem Kutuphanesi</div>
                        </button>
                    </div>
                </div>
            </section>
        `;
    },

    renderPersonnelWorkspaceShell: () => {
        const rows = StockModule.getStockPersonnelRows();
        return `
            <section class="stock-shell">
                <div class="stock-subpage-shell">
                    <div class="stock-subpage-head">
                        <h2 class="stock-title">depo & stok / personel</h2>
                        <button class="btn-sm" onclick="StockModule.openWorkspace('menu')">geri</button>
                    </div>
                    <div class="card-table">
                        <div style="padding:1.25rem 1.5rem 0.35rem;">
                            <div style="font-size:1.05rem; font-weight:800; color:#0f172a;">Depo ile ilgili personel listesi</div>
                            <div style="font-size:0.9rem; color:#64748b; margin-top:0.3rem;">Genel personel kartinda "depo & stok" secili olan aktif personeller burada gorunur.</div>
                        </div>
                        <table style="width:100%; text-align:left; border-collapse:collapse">
                            <thead>
                                <tr style="border-bottom:1px solid #f1f5f9; color:#94a3b8; font-size:0.75rem; text-transform:uppercase">
                                    <th style="padding:1.5rem">Ad Soyad</th>
                                    <th style="padding:1.5rem">ID Kodu</th>
                                    <th style="padding:1.5rem">Birim / Atolye</th>
                                    <th style="padding:1.5rem">Kullanici Adi</th>
                                    <th style="padding:1.5rem">Rol</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.length === 0 ? '<tr><td colspan="5" style="padding:2rem; text-align:center; color:#94a3b8">Kayitli depo & stok personeli yok.</td></tr>' : rows.map((person) => `
                                    <tr style="border-bottom:1px solid #f1f5f9" class="hover:bg-slate-50">
                                        <td style="padding:1.5rem">
                                            <div style="display:flex; align-items:center; gap:0.75rem">
                                                <div style="width:2.75rem; height:2.75rem; background:linear-gradient(135deg, #38bdf8 0%, #2563eb 100%); border-radius:99px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; flex-shrink:0;">${StockModule.escapeHtml(String(person?.fullName || '?').trim().charAt(0) || '?')}</div>
                                                <div>
                                                    <div style="font-weight:700; color:#1e293b;">${StockModule.escapeHtml(person?.fullName || '-')}</div>
                                                    <div style="font-size:0.88rem; color:#64748b;">${StockModule.escapeHtml(person?.title || '-')}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style="padding:1.5rem; font-weight:600; color:#475569;">${StockModule.escapeHtml(person?.personCode || '-')}</td>
                                        <td style="padding:1.5rem; color:#475569;">${StockModule.escapeHtml((typeof PersonnelModule !== 'undefined' && typeof PersonnelModule.getAssignedUnitNames === 'function') ? PersonnelModule.getAssignedUnitNames(person).join(', ') : '-')}</td>
                                        <td style="padding:1.5rem; color:#475569;">${StockModule.escapeHtml(person?.username || '-')}</td>
                                        <td style="padding:1.5rem;">
                                            <span style="display:inline-flex; align-items:center; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.8rem; font-weight:700; ${String(person?.rolePreset || '') === 'tam_yetkili' ? 'background:#ede9fe; color:#7c3aed;' : 'background:#e0f2fe; color:#0369a1;'}">
                                                ${StockModule.escapeHtml(String(person?.rolePreset || '') === 'tam_yetkili' ? 'Tam Yetkili' : 'Operator')}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        `;
    },

    renderWorkspacePlaceholder: (title, subtitle) => {
        return `
            <section class="stock-shell">
                <div class="stock-subpage-shell">
                    <div class="stock-subpage-head">
                        <h2 class="stock-title">${StockModule.escapeHtml(title || 'depo & stok')}</h2>
                        <button class="btn-sm" onclick="StockModule.openWorkspace('menu')">geri</button>
                    </div>
                    <div class="card-table" style="padding:2.2rem; text-align:center; color:#94a3b8;">
                        <div style="font-weight:800; color:#334155; margin-bottom:0.45rem;">Hazirlaniyor</div>
                        <div style="font-size:0.92rem;">${StockModule.escapeHtml(subtitle || 'Sayfa hazirlaniyor.')}</div>
                    </div>
                </div>
            </section>
        `;
    },

    renderBlueprintWorkspace: (viewId) => {
        const blueprint = StockModule.moduleBlueprints[String(viewId || '')];
        if (!blueprint) return StockModule.renderWorkspacePlaceholder('depo & stok', 'Bu modul icin henuz not tanimlanmadi.');
        return `
            <section class="stock-shell">
                <div class="stock-subpage-shell">
                    <div class="stock-subpage-head">
                        <h2 class="stock-title">${StockModule.escapeHtml(blueprint.title || 'depo & stok')}</h2>
                        <button class="btn-sm" onclick="StockModule.openWorkspace('menu')">geri</button>
                    </div>
                    <div class="card-table" style="padding:1.4rem 1.5rem; margin-bottom:1rem;">
                        <div style="font-size:1.02rem; font-weight:800; color:#0f172a;">Modul notu</div>
                        <div style="font-size:0.94rem; color:#64748b; margin-top:0.45rem; line-height:1.7;">${StockModule.escapeHtml(blueprint.intro || '')}</div>
                    </div>
                    <div style="display:grid; gap:1rem;">
                        ${(blueprint.sections || []).map((section) => `
                            <div class="card-table" style="padding:1.2rem 1.35rem;">
                                <div style="font-size:0.98rem; font-weight:800; color:#0f172a; margin-bottom:0.7rem;">${StockModule.escapeHtml(section.title || '-')}</div>
                                <div style="display:grid; gap:0.55rem;">
                                    ${(section.items || []).map((item) => `
                                        <div style="display:flex; align-items:flex-start; gap:0.65rem; color:#334155; line-height:1.65;">
                                            <div style="width:8px; height:8px; border-radius:999px; background:#0f172a; margin-top:0.48rem; flex-shrink:0;"></div>
                                            <div>${StockModule.escapeHtml(item || '')}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>
        `;
    },

    renderDepotsLayout: () => {
        const node = StockModule.getSelectedNode();
        const mainDepot = StockModule.getMainDepot();
        const customDepots = StockModule.getCustomDepots();
        const unitDepots = StockModule.getUnitRowsMeta();
        const externalDepots = StockModule.getExternalRowsMeta();
        const overview = StockModule.getOverviewSummary();
        const managedSummary = node.kind === 'managed' ? StockModule.getManagedSummary(node.id) : null;
        const topManagedRows = [mainDepot, ...customDepots];
        const canOpenLocationEditor = String(node?.key || '') !== 'all';
        const stockFilterState = StockModule.getInventoryStockFilters();
        const activeLocationFilter = StockModule.getInventoryLocationFilterForNode(node);

        const sidebarHtml = `
            <div class="stock-side-row"><button onclick="StockModule.selectNode('all')" class="stock-side-btn${String(StockModule.state.selectedKey || '') === 'all' ? ' active' : ''}">TUM DEPOLAR</button></div>
            <div style="height:0.45rem;"></div>
            <div class="stock-side-list">
                ${topManagedRows.map((item) => {
            const selected = String(StockModule.state.selectedKey || '') === String(item.key || '');
            return `<div class="stock-side-row"><button onclick="StockModule.selectNode('${StockModule.escapeHtml(item.key || '')}')" class="stock-side-btn${selected ? ' active' : ''}">${StockModule.escapeHtml(item.name || '-')}</button></div>`;
        }).join('')}
            </div>
            <div class="stock-side-row" style="margin-top:0.45rem;"><button onclick="StockModule.openDepotCreateModal()" class="stock-side-add" style="text-align:center;">Depo Olustur +</button></div>
            <div style="height:1px; background:#cbd5e1; margin:0.85rem 0;"></div>
            ${StockModule.renderSidebarSection('Birim / atolye depolari', unitDepots, { canEdit: false })}
            ${StockModule.renderSidebarSection('Fason / dis birimler', externalDepots)}
        `;

        return `
            <section class="stock-shell">
                <div class="stock-hero">
                    <div class="stock-hero-header">
                        <div>
                            <h2 class="stock-title">depo & stok</h2>
                            <div class="stock-desc">Bu ekran depo adreslerini insa etmek ve fabrikadaki urunlerin hangi depoda gorundugunu izlemek icin kullanilir. Mal kabul, sevk, teslim alma ve transfer modulleri hedef lokasyonu buradan secer.</div>
                        </div>
                    </div>

                    <div class="stock-metrics">
                        <div class="stock-metric"><div class="stock-metric-label">Tanimli depo</div><div class="stock-metric-value">${overview.managedCount}</div></div>
                        <div class="stock-metric"><div class="stock-metric-label">Toplam konum</div><div class="stock-metric-value">${overview.locationCount}</div></div>
                        <div class="stock-metric"><div class="stock-metric-label">Atolye depolari</div><div class="stock-metric-value">${overview.unitCount}</div></div>
                        <div class="stock-metric"><div class="stock-metric-label">Dis birim</div><div class="stock-metric-value">${overview.externalCount}</div></div>
                    </div>

                    <div class="stock-note-banner">
                        <div style="display:flex; justify-content:space-between; gap:0.8rem; align-items:flex-start; flex-wrap:wrap;">
                            <div>
                                <div class="stock-banner-title">${StockModule.escapeHtml(node.name || '-')}</div>
                                <div class="stock-banner-note">${StockModule.escapeHtml(node.note || '')}</div>
                            </div>
                        </div>
                        ${node.kind === 'managed' && managedSummary ? `
                            <div class="stock-banner-meta">
                                <div class="stock-banner-meta-item"><div class="stock-banner-meta-label">Secili depo</div><div class="stock-banner-meta-value">${StockModule.escapeHtml(node.name || '-')}</div></div>
                                <div class="stock-banner-meta-item"><div class="stock-banner-meta-label">Raf sayisi</div><div class="stock-banner-meta-value">${managedSummary.rafCount}</div></div>
                                <div class="stock-banner-meta-item"><div class="stock-banner-meta-label">Hucre sayisi</div><div class="stock-banner-meta-value">${managedSummary.locationCount}</div></div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="stock-workspace">
                    <aside class="stock-sidebar">${sidebarHtml}</aside>

                    <div class="stock-content">
                        <div class="stock-section-head">
                            <div class="stock-section-title">${String(node?.key || '') === 'all' ? 'tum depo icerigi' : `${StockModule.escapeHtml(node.name || '-')} / urun gorunumu`}</div>
                            <div class="stock-section-helper">${String(node?.key || '') === 'all' ? 'Depo secilmediginde arama tum depolarda calisir. Tek kutu urun adi, ID kodu, parca/model, plan kodu ve raf kodunda arar. Coklu kelimede tum kelimeler eslesmelidir. Durum butonlari ile listeyi daraltabilirsin.' : 'Arama secili depoda urun adi ve tum ID alanlarinda (kod, model, plan, raf) calisir. Coklu kelimede tum kelimeler eslesmelidir. Durum butonlari ile listeyi daraltabilirsin.'}</div>
                            <div style="margin-left:auto;">
                                <button class="btn-sm" onclick="StockModule.openLocationManagerForSelectedNode()" ${canOpenLocationEditor ? '' : 'disabled'} style="${canOpenLocationEditor ? 'border-color:#0f172a; background:#0f172a; color:#fff; font-weight:700;' : 'opacity:0.45; cursor:not-allowed;'}">DUZENLE / HUCRE EKLE</button>
                            </div>
                        </div>

                        <div class="stock-search-toolbar">
                            <div class="stock-search-grid stock-search-grid-1 stock-search-grid-compact">
                                <input id="stock-search-query" class="stock-input stock-input-strong" value="${StockModule.escapeHtml(StockModule.state.searchQuery || StockModule.state.searchName || StockModule.state.searchCode)}" oninput="StockModule.setSearch('inventory', this.value)" placeholder="urun adi, ID, parca, model, plan kodu veya raf kodu ile ara">
                            </div>
                            <div class="stock-status-filter-group">
                                <button type="button" class="stock-status-filter-btn${stockFilterState.available ? ' active' : ''}" onclick="StockModule.toggleInventoryStockFilter('available')">Kullanilabilir</button>
                                <button type="button" class="stock-status-filter-btn${stockFilterState.inProcess ? ' active' : ''}" onclick="StockModule.toggleInventoryStockFilter('inProcess')">Islemde Olanlar</button>
                                <button type="button" class="stock-status-filter-btn${stockFilterState.reserve ? ' active' : ''}" onclick="StockModule.toggleInventoryStockFilter('reserve')">Rezerve</button>
                            </div>
                        </div>
                        ${activeLocationFilter ? `
                            <div class="stock-location-filter-inline">
                                <span>Hucre filtresi: <strong>${StockModule.escapeHtml(activeLocationFilter.locationLabel || activeLocationFilter.locationCode || '-')}</strong></span>
                                <button type="button" class="btn-sm stock-location-clear-btn" onclick="StockModule.clearInventoryLocationFilter()">Temizle</button>
                            </div>
                        ` : ''}

                        ${StockModule.renderInventoryGroups(node)}
                        ${StockModule.renderLocationsCard(node)}
                    </div>
                </div>
            </section>
        `;
    },

    renderLayout: () => {
        const workspaceView = String(StockModule.state.workspaceView || 'menu');
        if (workspaceView === 'goods-receipt') {
            return StockModule.renderGoodsReceiptLayout();
        }
        if (StockModule.moduleBlueprints[workspaceView]) {
            return StockModule.renderBlueprintWorkspace(workspaceView);
        }
        if (workspaceView === 'depots') {
            return StockModule.renderDepotsLayout();
        }
        if (workspaceView === 'operation-library') {
            return StockModule.renderOperationLibraryLayout();
        }
        return StockModule.renderMenuLayout();
    }
};
