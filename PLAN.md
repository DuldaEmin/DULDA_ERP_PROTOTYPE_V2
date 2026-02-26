# ATOLYE IS AKISI SAYFASI - PLAN

Tarih: 2026-02-26
Durum: Taslak v2 (Kararlar Islenmis)

## 1) Hedef
Her atolye icin tek ekranda su sorularin anlik gorulmesi:
- Gelen malzeme ne kadar?
- Kac adet yapildi?
- Kac adet bekliyor?
- Dis fasona ne verildi?
- Dis fasonun elinde su an ne var?

Ayni zamanda personel cep telefonundan sadece kendi isi icin adet girisi yapabilsin.

## 2) Kapsam
Bu plan 2 ekrani kapsar:
- Atolye Is Akisi (yonetici/ustabasi ekrani)
- Mobil Personel Is Giris Ekrani (rol bazli, sade ekran)

Kapsam disi (simdilik):
- Muhasebe/fiyatlandirma
- Tam otomatik kapasite optimizasyonu
- Harici ERP entegrasyonu

## 3) Ana Is Akisi Durumlari
Her is kaydi asagidaki durumlar arasinda ilerler:
- Yeni (is emri olustu)
- Alindi (atolye malzemeyi teslim aldi)
- Uretimde (parca hazirlaniyor)
- Kismi Tamam (ornek: 100 adedin 30'u bitti)
- Dis Fasonda (taserona gitti)
- Fasondan Geldi
- Tamamlandi
- Sevk Edildi
- Iptal

Not:
- "Bekliyor" degeri bir durum degil, hesaplanan KPI olur.
- Bekliyor = hedef_adet - tamamlanan_adet - iptal_adet

### 3.1 Zorunlu Aldim/Verdim Protokolu (Tum Atolyeler + Dis Fason)
- Her istasyon hareketi `Aldim` ve `Verdim` adimlari ile loglanir.
- Istasyon A `Verdim` islemi yapmadan istasyon B `Aldim` yapamaz.
- Is emri toplam adedi degismez, adet sadece istasyonlar arasinda hareket eder.
- Ayni protokol dis fason icin de gecerlidir:
- `Fasona Verdim` ile cikis olur, `Fasondan Aldim` ile geri giris olur.

## 4) Ekran Tasarimi (Atolye Is Akisi)
Tek sayfada 4 ana blok:
- Ust KPI kutulari
- Is listesi tablosu
- Hareket gecmisi (kim, ne zaman, ne girdi)
- Dis fason paneli

### 4.4 Depo Transfer Merkezi (Yeni Buton / Ekran)
- Bu ekranin sahibi ve ana kullanicisi depocular olacak.
- Buton adi: `Depo Transfer Merkezi` (kisa etiket: `Depo Akisi`).
- Ic ve dis hareketlerde `Aldim/Verdim` islemleri bu ekrandan yonetilecek.
- Is emri rotasi tanimlanirken sadece bu ekranda listelenen istasyonlar secilebilecek.
- Rota disinda istasyon secilemez; bu kural zorunlu olacak.
- Istasyonlar arasi otomatik dusum/artim bu ekranin transfer kayitlarina gore calisacak.

### 4.1 KPI Kutulari
- Gelen: Atolyenin teslim aldigi toplam adet
- Yapilan: Tamamlanan toplam adet
- Bekleyen: Kalan adet
- Dis Fasonda: Taseronda olan adet
- Geciken Is Emri: Termin tarihi gecen kayit sayisi

### 4.2 Is Listesi Kolonlari
- Is Emri No
- Musteri / Urun
- Hedef Adet
- Yapilan Adet
- Bekleyen Adet
- Durum
- Termin
- Son Guncelleyen
- Son Islem Saati
- Hizli Islem (Aldim, Verdim, Fasona Gonder, Fasondan Al)

### 4.3 Dis Fason Paneli
Panelde su metrikler olur:
- Fasona Cikan Toplam
- Fasondan Donen Toplam
- Fasonda Bekleyen Toplam
- Fason Firma Bazli Dagilim

Tablo alanlari:
- Fason Firma
- Is Emri No
- Gonderilen Adet
- Donen Adet
- Fasonda Kalan
- Gonderim Tarihi
- Planlanan Donus Tarihi (opsiyonel)
- Gecikme Uyarisi (teslim tarihi gecerse)
- Durum

## 5) Mobil Personel Ekrani
Rol: testereci/operator benzeri personel

Mobilde sadece 3 adim:
- Kendi is listesini gor
- Is sec
- "Bugun yaptigim adet" gir

Form alanlari:
- Is Emri
- Yapilan Adet
- Fire Adet (opsiyonel)
- Not (opsiyonel)
- Islem Tipi: Aldim / Verdim / Uretim Girisi / Fasona Verdim / Fasondan Aldim

Kurallar:
- Girilen adet 0'dan buyuk olmali
- Toplam yapilan adet hedef adeti gecemez
- Yetkisiz kullanici baska atolye kaydi giremez
- Her islem loglanir (kullanici, tarih, cihaz)
- Internet yoksa girisler gecici kuyruga alinmali, baglanti gelince otomatik gonderilmeli

## 6) Veri Modeli (Mevcut Yapiya Uyumlu)
Mevcut `DB.data.data` altina yeni diziler:
- `workOrders`
- `workOrderTransactions`
- `outsourceTransfers`

### 6.1 workOrders (ana kayit)
Alanlar:
- id
- orderId (varsa mevcut siparis kaydina bag)
- unitId
- productCode
- productName
- targetQty
- completedQty
- scrapQty
- status
- dueDate
- created_at
- updated_at

### 6.2 workOrderTransactions (hareket logu)
Alanlar:
- id
- workOrderId
- unitId
- actionType (ALDIM, VERDIM, URETIM_GIRISI, FASONA_VERDIM, FASONDAN_ALDIM)
- qty
- scrapQty
- note
- actorId
- actorName
- source (MOBILE, DESKTOP)
- created_at

### 6.3 outsourceTransfers (dis fason takip)
Alanlar:
- id
- workOrderId
- vendorName
- sentQty
- returnedQty
- pendingQty
- sentAt
- plannedReturnAt
- returnedAt
- status
- overdueWarningAt
- isOverdue
- note

## 7) Hesaplama Kurallari
- Bekleyen = max(targetQty - completedQty - scrapQty, 0)
- DisFasonBekleyen = max(sentQty - returnedQty, 0)
- Durum gecisleri sadece izinli adimlarla olur
- Transaction kaydi olmadan adet degisikligi yapilamaz
- Verdigi kadar dusum: bir istasyonun `Verdim` miktari kendi bekleyenini dusurur
- Aldigi kadar artim: sonraki istasyon `Aldim` yaptiginda kendi kuyruguna islenir
- Dis fason gecikme: `plannedReturnAt` varsa ve su an > plannedReturnAt ve pendingQty > 0 ise `isOverdue=true`

## 8) Yetki ve Gorunurluk
- Admin: tum atolye ve tum kayitlar
- Ustabasi: kendi atolyesi + onay islemleri
- Personel: sadece atanan isler + adet giris

Gorunurluk kural seti:
- Kullanici sadece `unitId` bazli izinli kayitlari gorur
- Mobilde menu sade olur, sadece "Islerim" ve "Giris"

## 9) Uygulama Fazlari
### Faz 1 - Veri ve Mantik (2-3 gun)
- Veri modelini ekle
- Hesaplama fonksiyonlarini yaz
- Ornek veri/migrasyon ekle

### Faz 2 - Atolye Is Akisi Sayfasi (2-4 gun)
- KPI kutulari
- Is listesi + hizli islem butonlari
- Hareket gecmisi paneli
- Dis fason paneli

### Faz 3 - Mobil Personel Paneli (2-3 gun)
- Rol bazli sade ekran
- Adet giris formu
- Hata/validasyon mesajlari

### Faz 4 - Raporlama ve Kalite (1-2 gun)
- Gunluk uretim ozeti
- Fason performans raporu
- Test senaryolari ve hata duzeltme

Toplam tahmin: 7-12 is gunu

## 10) Basari Kriterleri
- Ustabasi 10 sn icinde "kac adet yapildi/bekliyor" gorebilmeli
- Personel mobilde 15 sn icinde adet girisi yapabilmeli
- Dis fason bekleyen adet anlik ve dogru hesaplanmali
- Tum hareketler logdan geriye donuk izlenebilmeli

## 11) Karar Ozeti (2026-02-26)
- "Aldim/Verdim" tum atolyelerde zorunlu
- Ayni protokol dis fason icin de zorunlu
- Fason tarafinda firma bazli limit zorunlu degil
- Fasonda teslim tarihi opsiyonel, gecerse uyari zorunlu
- Mobilde internet kesilirse gecici offline kuyruk olsun, baglanti gelince otomatik gonderilsin
- Depocular icin `Depo Transfer Merkezi` ekrani olacak
- Urun rotasi sadece `Depo Transfer Merkezi` ekranindaki istasyonlardan kurulacak
- Anayasa kurali: Tum modul/kutuphanelerde olusan tum urun/islem kart kodlari global benzersiz olacak
- Ayni ID/kod ikinci kez kullanilamaz (depo, atolye, dis fason, master urun kutuphanesi dahil)
- Operasyon kurali: Bilgisayara kaydedilen her degisiklik GitHub'a da yedeklenecek
- Operasyon kurali: GitHub yedegi en gec 15 dakikada bir otomatik commit/push ile alinacak

## 12) Acik Sorular
- Kismi tamamlanan isler icin otomatik durum "Kismi Tamam" olsun mu?
- Ilk surumde barkod/QR okutma gerekli mi?

## 13) Ilk Surum Onerisi (MVP)
MVP'de su 5 ozellik yeterli:
- Atolye Is Akisi sayfasi
- Is emri satiri bazli adet ilerleme
- Aldim/Verdim/Fason hareketleri
- Mobilde personel adet girisi
- Hareket gecmisi logu

MVP+ (hemen sonraki adim):
- Depo Transfer Merkezi butonu ve transfer ekrani
- Rota olusturmada sadece bu ekrandaki istasyonlarin secilebilmesi


