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
        depotEditingId: null
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
                note: 'Bu alan fiziksel raf / hucre tanimi almaz. Sadece izleme icin gorunur.',
                kind: 'unit',
                editable: false,
                allowLocations: false
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
                note: 'Dis birim veya fason nokta. Burada sadece izleme amacli gorunur.',
                kind: 'external',
                editable: false,
                allowLocations: false
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
            allowLocations: false
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
            locationCount: (DB.data.data.stockDepotLocations || []).filter((row) => managedIds.has(String(row?.depotId || ''))).length,
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
                    depotId: String(raw?.depotId || raw?.nodeId || '')
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
        if (!query) return scopedRows;
        return scopedRows
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
        UI.renderCurrentPage();
    },

    openOperationLibrary: () => {
        StockModule.state.workspaceView = 'operation-library';
        UI.renderCurrentPage();
    },

    setTopTab: (tabId) => {
        const nextTab = String(tabId || 'all');
        StockModule.state.topTab = nextTab;
        StockModule.state.selectedKey = nextTab === 'transfer' ? 'managed:depot_transfer' : 'all';
        UI.renderCurrentPage();
    },

    selectNode: (key) => {
        const nextKey = String(key || 'all');
        StockModule.state.selectedKey = nextKey;
        StockModule.state.topTab = nextKey === 'managed:depot_transfer' ? 'transfer' : 'all';
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
        const statusMeta = StockModule.getInventoryRowStatusMeta(selectedRow || {});
        const infoRow = selectedRow || { code, name: '-', locationCode: '-', quantity: '-', unit: '', depotName: '-', modelCode: '-', productType: '-' };
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
            </div>
        `, { maxWidth: '980px' });
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
                const safeCode = StockModule.escapeJsString(row?.code || '');
                const safeId = StockModule.escapeJsString(row?.id || '');
                return `
                    <div class="stock-item-row">
                        <button type="button" class="stock-item-code" onclick="StockModule.openInventoryItemCard('${safeCode}')">${StockModule.escapeHtml(row?.code || '-')}</button>
                        <div class="stock-item-divider"></div>
                        <div class="stock-item-name">${StockModule.escapeHtml(row?.name || '-')}</div>
                        <div class="stock-item-model">${StockModule.escapeHtml(modelText)}</div>
                        <div class="stock-item-qty">${StockModule.escapeHtml(qtyText || '-')}</div>
                        <div class="stock-item-location">${StockModule.escapeHtml(row?.locationCode || '-')}</div>
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
        if (node.kind !== 'managed') return '';
        const locations = StockModule.getDepotLocations(node.id);
        return `
            <div class="stock-location-card">
                <div class="stock-location-head">
                    <div class="stock-location-title">tanimli konumlar</div>
                </div>
                ${locations.length === 0 ? `<div class="stock-location-empty">Bu depoda henuz raf / hucre tanimi yok.</div>` : `
                    <div class="stock-location-list">
                        ${locations.map((row) => `
                            <div class="stock-location-chip">
                                <div class="stock-location-chip-code">${StockModule.escapeHtml(StockModule.getLocationCode(row))}</div>
                                <div class="stock-location-chip-note">${StockModule.escapeHtml(row.note || 'not yok')}</div>
                            </div>
                        `).join('')}
                    </div>
                `}
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

                        ${StockModule.renderInventoryGroups(node)}
                        ${StockModule.renderLocationsCard(node)}
                    </div>
                </div>
            </section>
        `;
    },

    renderLayout: () => {
        const workspaceView = String(StockModule.state.workspaceView || 'menu');
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
