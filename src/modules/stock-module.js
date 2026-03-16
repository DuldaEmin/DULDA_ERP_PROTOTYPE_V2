const StockModule = {
    state: {
        workspaceView: 'menu',
        topTab: 'all',
        selectedKey: 'all',
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
        depotDraftName: '',
        depotDraftNote: '',
        locationDraftRaf: '',
        locationDraftCell: '',
        locationDraftNote: '',
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
        { id: 'depot_profil', name: 'PROFIL DEPO', note: 'Profil ve uzun malzemeler icin ayrilan fiziksel alan.' },
        { id: 'depot_mafsal', name: 'MAFSAL DEPO', note: 'Mafsal ve benzeri yarimamul / bitmis unsur alanlari.' }
    ],

    escapeHtml: (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;'),

    normalize: (value) => String(value || '').trim().toLocaleLowerCase('tr-TR'),

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
                { id: 'u_dtm', name: 'ANA DEPO', type: 'internal' },
                { id: 'u9', name: 'HILAL PWD', type: 'external' },
                { id: 'u10', name: 'IBRAHIM POLISAJ', type: 'external' },
                { id: 'u11', name: 'TEKIN ELOKSAL', type: 'external' }
            ];
            changed = true;
        }

        const mainDepotUnit = (DB.data.data.units || []).find((row) => String(row?.id || '') === 'u_dtm');
        if (!mainDepotUnit) {
            DB.data.data.units.push({ id: 'u_dtm', name: 'ANA DEPO', type: 'internal' });
            changed = true;
        } else if (String(mainDepotUnit.name || '').trim().toUpperCase() !== 'ANA DEPO') {
            mainDepotUnit.name = 'ANA DEPO';
            changed = true;
        }

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
        const order = ['depot_transfer', 'depot_granul', 'depot_profil', 'depot_mafsal'];
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
        const ordered = ['EKSTRUDER', 'TESTERE', 'PLEKSI', 'CNC', 'MONTAJ'];
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
            }))
            .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'tr'));
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

    getInventoryRows: () => {
        const products = Array.isArray(DB.data?.data?.products) ? DB.data.data.products : [];
        const locationMap = new Map((DB.data.data.stockDepotLocations || []).map((row) => [String(row?.id || ''), row]));
        return (DB.data.data.stockDepotItems || []).map((raw) => {
            const product = products.find((row) => String(row?.id || '') === String(raw?.productId || '')) || null;
            const node = StockModule.resolveInventoryNode(raw);
            const location = locationMap.get(String(raw?.locationId || '')) || null;
            const quantity = raw?.quantity ?? raw?.qty ?? raw?.amount ?? '';
            return {
                id: String(raw?.id || product?.id || ''),
                name: String(raw?.productName || raw?.name || product?.name || '').trim(),
                code: String(raw?.productCode || raw?.code || product?.code || '').trim(),
                quantity,
                unit: String(raw?.unit || product?.unit || product?.specs?.unit || '').trim(),
                status: String(raw?.status || '').trim(),
                note: String(raw?.note || '').trim(),
                locationCode: raw?.locationCode
                    ? String(raw.locationCode)
                    : location
                        ? StockModule.getLocationCode(location)
                        : [raw?.rafCode, raw?.cellCode].filter(Boolean).join('-'),
                depotNode: node,
                depotName: node?.name || String(raw?.depotName || '-')
            };
        });
    },

    getFilteredInventoryRows: (node) => {
        const qName = StockModule.normalize(StockModule.state.searchName);
        const qCode = StockModule.normalize(StockModule.state.searchCode);
        const targetKey = String(node?.key || 'all');
        return StockModule.getInventoryRows().filter((row) => {
            if (targetKey !== 'all' && String(row?.depotNode?.key || '') !== targetKey) return false;
            const hayName = [row?.name, row?.depotName, row?.note].map(StockModule.normalize).join(' ');
            const hayCode = [row?.code, row?.locationCode].map(StockModule.normalize).join(' ');
            return (!qName || hayName.includes(qName)) && (!qCode || hayCode.includes(qCode));
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
        const targetId = field === 'code' ? 'stock-search-code' : 'stock-search-name';
        requestAnimationFrame(() => {
            const input = document.getElementById(targetId);
            if (!input) return;
            input.focus();
            const end = String(input.value || '').length;
            if (typeof input.setSelectionRange === 'function') input.setSelectionRange(end, end);
        });
    },

    setSearch: (field, value) => {
        if (field === 'name') StockModule.state.searchName = String(value || '');
        if (field === 'code') StockModule.state.searchCode = String(value || '');
        UI.renderCurrentPage();
        StockModule.restoreSearchFocus(field);
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
    },

    resetDepotDraft: () => {
        StockModule.state.depotDraftName = '';
        StockModule.state.depotDraftNote = '';
        StockModule.state.locationDraftRaf = '';
        StockModule.state.locationDraftCell = '';
        StockModule.state.locationDraftNote = '';
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
        StockModule.renderDepotModal();
    },

    openDepotEditModal: (depotId) => {
        const targetId = String(depotId || '');
        const depot = targetId === 'main'
            ? StockModule.getMainDepot()
            : (DB.data.data.stockDepots || []).find((row) => String(row?.id || '') === targetId);
        if (!depot) return;
        StockModule.resetDepotDraft();
        StockModule.state.depotEditingId = String(depot.id || '');
        StockModule.state.depotDraftName = String(depot.name || '');
        StockModule.state.depotDraftNote = String(depot.note || '');
        StockModule.state.depotDraftLocations = StockModule.getDepotLocations(depot.id).map((row) => ({
            id: String(row?.id || ''),
            rafCode: String(row?.rafCode || '').trim().toUpperCase(),
            cellCode: String(row?.cellCode || '').trim().toUpperCase(),
            note: String(row?.note || '')
        }));
        StockModule.renderDepotModal();
    },

    addDraftLocation: () => {
        const rafCode = String(StockModule.state.locationDraftRaf || '').trim().toUpperCase();
        const cellCode = String(StockModule.state.locationDraftCell || '').trim().toUpperCase();
        const note = String(StockModule.state.locationDraftNote || '').trim();
        if (!rafCode || !cellCode) return alert('Raf ve hucre kodu giriniz.');
        const exists = (StockModule.state.depotDraftLocations || []).some((row) =>
            String(row?.rafCode || '').trim().toUpperCase() === rafCode
            && String(row?.cellCode || '').trim().toUpperCase() === cellCode
        );
        if (exists) return alert('Bu raf / hucre zaten listede var.');
        StockModule.state.depotDraftLocations.push({ id: '', rafCode, cellCode, note });
        StockModule.state.locationDraftRaf = '';
        StockModule.state.locationDraftCell = '';
        StockModule.state.locationDraftNote = '';
        StockModule.renderDepotModal();
    },

    removeDraftLocation: (index) => {
        StockModule.state.depotDraftLocations = (StockModule.state.depotDraftLocations || []).filter((_row, idx) => idx !== Number(index));
        StockModule.renderDepotModal();
    },

    renderDepotDraftRows: () => {
        const rows = StockModule.state.depotDraftLocations || [];
        if (rows.length === 0) {
            return `<tr><td colspan="5" class="stock-empty">Henuz hucre eklenmedi. Istersen bos depo olarak da kaydedebilirsin.</td></tr>`;
        }
        return rows.map((row, index) => `
            <tr>
                <td>${StockModule.escapeHtml(row.rafCode || '-')}</td>
                <td>${StockModule.escapeHtml(row.cellCode || '-')}</td>
                <td>${StockModule.escapeHtml(row.note || '-')}</td>
                <td style="font-family:monospace; color:#1d4ed8; font-weight:700;">${StockModule.escapeHtml(StockModule.getLocationCode(row))}</td>
                <td style="text-align:right;"><button class="btn-sm" onclick="StockModule.removeDraftLocation(${index})">sil</button></td>
            </tr>
        `).join('');
    },

    renderDepotModal: () => {
        const editing = !!String(StockModule.state.depotEditingId || '');
        const editingMain = String(StockModule.state.depotEditingId || '') === 'main';
        Modal.open(editing ? 'Depo Duzenle' : 'Depo Olustur', `
            <div class="stock-modal-form">
                <div class="stock-modal-title">${editing ? 'Secili depoyu duzenle' : 'Yeni depo tanimi'}</div>
                <div class="stock-modal-note">${editingMain ? 'Ana depoda ayni pencereden raf / hucre ekleyebilirsin.' : 'Depo adi ve notu gir. Istersen ayni pencerede raf / hucre de ekleyebilirsin.'}</div>

                <div class="stock-modal-grid">
                    <div>
                        <label class="stock-modal-label">Depo adi</label>
                        <input class="stock-input stock-input-tall" value="${StockModule.escapeHtml(StockModule.state.depotDraftName)}" oninput="StockModule.setDraftField('depotName', this.value)" placeholder="or: SEVKIYATA GIDECEK URUNLER" ${editingMain ? 'disabled' : ''}>
                    </div>
                    <div>
                        <label class="stock-modal-label">Not</label>
                        <textarea class="stock-textarea" oninput="StockModule.setDraftField('depotNote', this.value)" placeholder="or: Merdiven yani alan" ${editingMain ? 'disabled' : ''}>${StockModule.escapeHtml(StockModule.state.depotDraftNote)}</textarea>
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
                    <div class="stock-modal-action">
                        <button class="btn-primary" onclick="StockModule.addDraftLocation()">hucre ekle +</button>
                    </div>
                </div>

                <div class="stock-table-card" style="margin-top:0.9rem;">
                    <table>
                        <thead>
                            <tr>
                                <th style="text-align:left;">Raf</th>
                                <th style="text-align:left;">Hucre</th>
                                <th style="text-align:left;">Not</th>
                                <th style="text-align:left;">Kod</th>
                                <th style="text-align:right;">Islem</th>
                            </tr>
                        </thead>
                        <tbody>${StockModule.renderDepotDraftRows()}</tbody>
                    </table>
                </div>

                <div class="stock-modal-footer">
                    ${editing && !editingMain ? `<button class="btn-sm" onclick="StockModule.deleteDepot('${StockModule.escapeHtml(StockModule.state.depotEditingId || '')}')">Sil</button>` : '<div></div>'}
                    <div style="display:flex; gap:0.55rem;">
                        <button class="btn-sm" onclick="StockModule.resetDepotDraft(); Modal.close()">Vazgec</button>
                        <button class="btn-primary" onclick="StockModule.saveDepotModal()">${editing ? 'Kaydet' : 'Depoyu kaydet'}</button>
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
        if (!name) return alert('Depo adi zorunlu.');

        const duplicateName = (DB.data.data.stockDepots || []).some((row) =>
            String(row?.id || '') !== editingId
            && String(row?.name || '').trim().toUpperCase() === name
            && row?.isActive !== false
        );
        if (duplicateName) return alert('Bu isimde bir depo zaten var.');

        let depotId = editingId;
        const now = new Date().toISOString();
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

        const nextLocations = (StockModule.state.depotDraftLocations || []).map((row) => ({
            id: String(row?.id || '').trim() || crypto.randomUUID(),
            depotId,
            rafCode: String(row?.rafCode || '').trim().toUpperCase(),
            cellCode: String(row?.cellCode || '').trim().toUpperCase(),
            note: String(row?.note || '').trim(),
            created_at: now
        }));

        DB.data.data.stockDepotLocations = (DB.data.data.stockDepotLocations || [])
            .filter((row) => String(row?.depotId || '') !== depotId)
            .concat(nextLocations);

        StockModule.state.selectedKey = `managed:${depotId}`;
        StockModule.state.topTab = depotId === 'depot_transfer' ? 'transfer' : 'all';
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
        if (items.length === 0) return '';
        return `
            <div class="stock-side-group">
                <div class="stock-side-group-title">${title}</div>
                <div class="stock-side-list">
                    ${items.map((item) => {
            const selected = String(StockModule.state.selectedKey || '') === String(item.key || '');
            const rowCanEdit = canEdit && item?.editable === true;
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
        const groups = StockModule.getInventoryGroups(node);
        if (groups.length === 0 || groups.every((group) => group.rows.length === 0)) {
            return `<div class="stock-table-card"><div class="stock-empty">Bu alanda listelenecek urun henuz yok. Diger moduller malzeme yerlestirdikce burada gorunecek.</div></div>`;
        }
        return groups.map((group) => `
            <div class="stock-group-card">
                ${String(node?.key || '') === 'all' ? `<div class="stock-group-title">${StockModule.escapeHtml(group.title)}</div>` : ''}
                <div class="stock-table-card" style="margin-top:${String(node?.key || '') === 'all' ? '0.65rem' : '0'};">
                    <table>
                        <thead>
                            <tr>
                                <th style="text-align:left;">Urun adi</th>
                                <th style="text-align:left;">ID kodu</th>
                                <th style="text-align:left;">Detay</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${group.rows.map((row) => {
            const detail = [];
            if (row.locationCode) detail.push(`Konum: ${row.locationCode}`);
            if (row.quantity !== '' && row.quantity !== null && row.quantity !== undefined) detail.push(`Miktar: ${row.quantity}${row.unit ? ` ${row.unit}` : ''}`);
            if (row.status) detail.push(`Durum: ${row.status}`);
            return `
                                    <tr>
                                        <td style="font-weight:700; color:#0f172a;">${StockModule.escapeHtml(row.name || '-')}</td>
                                        <td style="font-family:monospace; color:#1d4ed8; font-weight:700;">${StockModule.escapeHtml(row.code || '-')}</td>
                                        <td style="color:#64748b;">${StockModule.escapeHtml(detail.join(' • ') || 'Detay daha sonra zenginlestirilecek.')}</td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `).join('');
    },

    renderLocationsCard: (node) => {
        if (node.kind !== 'managed') return '';
        const locations = StockModule.getDepotLocations(node.id);
        return `
            <div class="stock-location-card">
                <div class="stock-location-head">
                    <div class="stock-location-title">tanimli konumlar</div>
                    ${node.editable ? `<button class="btn-sm" onclick="StockModule.openDepotEditModal('${StockModule.escapeHtml(node.id || '')}')">hucreleri duzenle</button>` : ''}
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
                        <button class="stock-hub-card" onclick="StockModule.openWorkspace('production-receipt')">
                            <div class="stock-hub-icon stock-hub-icon-sky"><i data-lucide="boxes" width="24" height="24"></i></div>
                            <div class="stock-hub-label">Uretimden Gelen Kabul</div>
                        </button>
                        <button class="stock-hub-card" onclick="StockModule.openWorkspace('outsource-shipment')">
                            <div class="stock-hub-icon stock-hub-icon-purple"><i data-lucide="truck" width="24" height="24"></i></div>
                            <div class="stock-hub-label">Dis Fason Sevk</div>
                        </button>
                        <button class="stock-hub-card" onclick="StockModule.openWorkspace('shipment-prep')">
                            <div class="stock-hub-icon stock-hub-icon-orange"><i data-lucide="package-open" width="24" height="24"></i></div>
                            <div class="stock-hub-label">Sevkiyat Hazirlama</div>
                        </button>
                        <button class="stock-hub-card" onclick="StockModule.openWorkspace('dispatch-note')">
                            <div class="stock-hub-icon stock-hub-icon-pink"><i data-lucide="file-text" width="24" height="24"></i></div>
                            <div class="stock-hub-label">Irsaliye ve Teslim Takibi</div>
                        </button>
                        <button class="stock-hub-card" onclick="StockModule.openWorkspace('ready-flow')">
                            <div class="stock-hub-icon stock-hub-icon-yellow"><i data-lucide="bell-ring" width="24" height="24"></i></div>
                            <div class="stock-hub-label">Montaj ve Satis Uyarilari</div>
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
        const transferDepot = customDepots.find((row) => String(row?.id || '') === 'depot_transfer') || null;
        const userDepots = customDepots.filter((row) => String(row?.id || '') !== 'depot_transfer');
        const unitDepots = StockModule.getUnitRowsMeta();
        const workshopDepots = transferDepot ? [transferDepot, ...unitDepots] : unitDepots;
        const externalDepots = StockModule.getExternalRowsMeta();
        const overview = StockModule.getOverviewSummary();
        const managedSummary = node.kind === 'managed' ? StockModule.getManagedSummary(node.id) : null;

        const customDepotSection = `
            ${StockModule.renderSidebarSection('Kullanici depolari', userDepots, { canEdit: true })}
            <div class="stock-side-row"><button onclick="StockModule.openDepotCreateModal()" class="stock-side-add">depo ekle +</button></div>
        `;
        const sidebarHtml = `
            <div class="stock-side-row"><button onclick="StockModule.selectNode('all')" class="stock-side-btn${String(StockModule.state.selectedKey || '') === 'all' ? ' active' : ''}">TUM DEPOLAR</button></div>
            ${StockModule.renderSidebarSection('Ana depo', [mainDepot], { canEdit: true })}
            ${customDepotSection}
            ${StockModule.renderSidebarSection('Birim / atolye depolari', workshopDepots, { canEdit: true })}
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
                            <div style="display:flex; gap:0.55rem; flex-wrap:wrap;">
                                ${node.kind === 'managed' && node.editable ? `<button class="btn-sm" onclick="StockModule.openDepotEditModal('${StockModule.escapeHtml(node.id || '')}')">duzenle</button>` : ''}
                                <button class="btn-primary" onclick="StockModule.openDepotCreateModal()">depo ekle +</button>
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
                            <div class="stock-section-helper">${String(node?.key || '') === 'all' ? 'Depo secilmediginde arama tum depolarda calisir.' : 'Arama secili deponun icinde urun adi ve ID koduna gore calisir.'}</div>
                        </div>

                        <div class="stock-search-grid stock-search-grid-2">
                            <input id="stock-search-name" class="stock-input" value="${StockModule.escapeHtml(StockModule.state.searchName)}" oninput="StockModule.setSearch('name', this.value)" placeholder="urun adi ile ara">
                            <input id="stock-search-code" class="stock-input" value="${StockModule.escapeHtml(StockModule.state.searchCode)}" oninput="StockModule.setSearch('code', this.value)" placeholder="ID kod ile ara">
                        </div>

                        ${StockModule.renderInventoryGroups(node)}
                        ${StockModule.renderLocationsCard(node)}
                        ${StockModule.renderReferenceNotice(node)}
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
