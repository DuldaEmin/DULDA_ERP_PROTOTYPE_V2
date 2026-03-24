# DULDA ERP - YENIDEN YAZIM SPESIFIKASYONU

Tarih: 2026-03-24
Durum: Aktif
Amac: Bu dosyalara bakarak sistemi sifirdan ayni mantikla tekrar yazabilmek.

## 1) Urun Hedefi

Uretim odakli ERP prototipi:
- Urun/parca recetesi tanimlama
- Rota ve islem kutuphanesi
- Planlama talebi -> is emri donusumu
- Istasyon bazli is emri operasyonu
- Depo ve transfer takibi
- Dosyaya kalici kayit + cakisma korumasi

## 2) Mimari

## 2.1 Calisma modeli
- Frontend: Vanilla JS moduler yapi
- Backend: Tek Node.js HTTP server
- Persistence: `demo_state.json` dosyasi
- Snapshot: `.state-history` klasorune before/after save

## 2.2 Frontend giris dosyalari
- `index.html`
- `src/core/app-core.js`
- `src/core/modal.js`
- `src/modules/*.js`

## 2.3 Backend davranisi
`serve.js` su endpointleri saglar:
- `GET /api/state` -> state oku
- `POST /api/state` -> state yaz

Yazma kurallari:
- `baseRevision` kontrolu
- Stale payload bloklama
- Atomik save (`.tmp` sonra rename)
- History snapshot alma

## 3) Cekirdek Prensipler

1. Kimlik odakli veri
- Her varlik id/code ile izlenir.

2. Global kod benzersizligi
- Kod cakismasi kabul edilmez.

3. Kart ve operasyon ayrimi
- Kartlar "standart tarif"tir.
- Is emri ve hareket kayitlari "fiili operasyon"dur.

4. Veri koruma
- Save cakismasinda veri ustune yazilmaz.
- Yedek snapshot mekanizmasi zorunludur.

## 4) Modul Sorumluluklari

## 4.1 ProductLibraryModule
Sorumluluk:
- Master urun kutuphanesi
- Parca/bilesen kartlari
- Parca grup / assembly
- Urun modeli varyantlari
- Renk kutuphanesi

Zorunlu yetenekler:
- Kod uretimi (PRC vb.)
- Master -> parca baglantisi
- Parca rota tanimi (station + process)
- Modelde master + component + montage baglama
- Dosya ekleme/onizleme

## 4.2 UnitModule
Sorumluluk:
- Birim dashboardlari
- Istasyon kutuphaneleri
- Is emri planlama/operasyon
- Is emri satir rota takipleri

Zorunlu yetenekler:
- Montaj kartindan is emri acma
- Tek parca kartindan is emri acma
- Rota adimina gore bekleyen/islemde/tamamlanan takip
- Istasyon bazli process preview

## 4.3 PlanningModule
Sorumluluk:
- Talep acma (stok icin uretim)
- Havuz yonetimi
- Is emrine donusturme

Zorunlu yetenekler:
- Kaynak tip secimi: model/component
- Talep kodu uretimi (`PLN-xxxxxx`)
- Durum yonetimi (`OPEN/RELEASED/CANCELLED`)
- RELEASED kaydin workOrder referansi tutmasi

## 4.4 StockModule
Sorumluluk:
- Depo omurga yapisi
- Ana depo ve alt depo/lokasyon yapisi
- Depo islem kutuphanesi

Zorunlu yetenekler:
- Depo seed ve lokasyon seed
- u_dtm (ana depo) omurga birim olarak korunmasi
- Birim/depo gorunum entegrasyonu

## 4.5 MontageLibraryModule
Sorumluluk:
- Montaj kartlari
- Parca kod listesi baglantisi

Zorunlu yetenekler:
- MON kod uretimi
- componentIds listesi
- Teknik/patlatilmis dosya ekleme

## 4.6 CncLibraryModule
Sorumluluk:
- CNC islem kartlari ve operasyon dosyalari

## 4.7 PersonnelModule
Sorumluluk:
- Personel kartlari
- Modul ve birim bazli izinler

## 4.8 PurchasingModule
Sorumluluk:
- Tedarikci merkezi
- Tedarikci-urun iliskisi gorunumu

## 5) Veri Modeli Kapsami

Bu sistemin yeniden yaziminda en az su koleksiyonlar olmalidir:

- `products`
- `productCategories`
- `partComponentCards`
- `montageCards`
- `catalogProductVariants`
- `planningDemands`
- `workOrders`
- `workOrderTransactions`
- `units`
- `stockDepots`
- `stockDepotLocations`
- `stockDepotItems`
- `depoTransferTasks`
- `depoTransferLogs`
- `depoRoutes`
- `suppliers`
- `personnel`

Detay alanlar icin tek kaynak:
- `VERI_SOZLESMESI.md`

## 6) Kritik Is Akislari

## 6.1 Recete olusturma akisi
1. Master urun karti acilir.
2. Parca/bilesen karti acilir.
3. Parca karta master kod baglanir.
4. Rota adimlari (station/process) eklenir.
5. Kaydedilir.

## 6.2 Planlama -> is emri
1. Planlama talebi acilir.
2. Talep havuzunda gozden gecirilir.
3. Is emrine donusturulur.
4. Talep status `RELEASED` olur.

## 6.3 Atolye operasyonu
1. Istasyon kendi kuyrugunu gorur.
2. Teslim alir / islemdeye alir.
3. Tamamlanan adedi girer.
4. Sonraki istasyona devreder.

## 7) Kabul Kriterleri (Definition of Done)

Bir yeniden yazim asamasi "tamam" sayilmasi icin:

1. Calisma:
- `RUN_DEMO.ps1` ile uygulama acilmali.
- `GET /api/state` ve `POST /api/state` calismali.

2. Veri:
- `revision` tabanli cakisma korumasi olmali.
- Save history snapshot uremeli.

3. Is akis:
- Master + parca + rota olusturulabilmeli.
- En az bir is emri planlamadan dogabilmeli.
- Is emri satiri rota bazli ilerleyebilmeli.

4. Dokuman:
- Davranis farki varsa `ISLEYIS.md` guncel olmali.
- Yapilan is `GELISTIRME_GUNLUGU.md`'ye yazilmis olmali.

## 8) Fazli Yeniden Yazim Plani (Oneri)

1. Faz-1 Cekirdek
- App core + save/load + revision + history

2. Faz-2 Recete
- Master + parca/bilesen + rota

3. Faz-3 Operasyon
- Planning demand + work order + unit execution

4. Faz-4 Depo
- Depot/location/item + transfer gorevleri

5. Faz-5 Yetki ve rapor
- Personnel izinleri + temel raporlar

## 9) Baska Tuzaga Dusmemek Icin Kirmizi Cizgiler

1. Kod benzersizligini bozma.
2. Kart ve operasyon verisini ayni yerde karistirma.
3. Revision/cakisma kontrolunu kaldirma.
4. "Adet" bilgisini recete kartina tasima.
5. Gecmis kayitlari sessizce ezme.


