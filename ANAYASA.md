# DULDA ERP - VERI KIMLIGI ANAYASASI

Tarih: 2026-03-02
Durum: Aktif

## 1) Temel Ilke
Bu programda her unsur bir kimliktir.

Her kayit benzersiz bir `id` tasir:
- urun
- parca
- bilesen
- tedarikci
- musteri
- calisan
- kullanici
- siparis
- stok hareketi
- birim
- makine
- kategori
- islem karti

## 2) Baglanti Kurali
Kayitlar birbiriyle isimle degil `id` ile baglanir.

Not:
- isim degisebilir
- id degismez
- izleme, yetki ve raporlama id uzerinden yapilir

## 3) Benzersizlik Kurali
`id` alanlari bos birakilamaz.

`id` tekrari kabul edilmez:
- ayni koleksiyonda tekrar olamaz
- veri yuklenirken eksik/tekrarlanan id otomatik duzeltilir

## 4) Uygulama Kurali
Yeni gelistirmelerde zorunlu kural:
- yeni varlik = yeni benzersiz id
- referans alanlari = ilgili varligin id'si
- metin alanlari (ad, aciklama) sadece gorunum amaclidir

## 5) Is Kutuphanesi Kurali
Birimlerdeki urun kutuphanesi, urun listesi degil is tanimi kutuphanesidir.

Bu kutuphanelerdeki kartlar su amaca hizmet eder:
- Kart ID'si istasyonda yapilacak isi standartlar (ornek: `TST-000003` = 55 mm kesim gorevi)
- Rota satirinda bu ID secildiginde is parca turunden bagimsiz ayni kuralla uygulanir
- Kartin is tanimi degisebilir, ancak kart ID'si degismez
- Siparis adedi bu kutuphane kartinda degil, siparis/operasyon kaydinda tutulur

## 6) Veri Koruma Kurali
Bu programda veri kaybi kabul edilmez.

Temel kural:
- kullanici bir kaydi manuel olarak silmedikce veri sistemden kaybolamaz
- otomatik kayit, sekme kapanmasi, sayfa yenilenmesi, eski oturum, bos state veya senkronizasyon hatasi veri silme sonucu doguramaz

Zorunlu uygulama ilkeleri:
- silme islemleri varsayilan olarak `soft delete` mantigiyla calismalidir
- kayitlar kalici silinmeden once geri alinabilir durumda tutulmalidir
- veri dosyasi veya veri tabani her kayitta geri donulebilir yedek/surum mantigiyla korunmalidir
- eski veya eksik state yeni verinin uzerine yazamaz
- ayni anda birden fazla oturum yaziyorsa sonradan gelen bos/eksik veri mevcut kayitlari ezemez
- kritik veri alanlarinda toplu overwrite yerine korumali kayit mantigi kullanilmalidir

Sonuc:
- sistem hatasi ile veri kaybi yasaktir
- sadece acik, bilincli ve kullanici onayli silme islemi veri kaldirabilir

## 7) Global Kod (ID) Yasasi
Bu programda gorunen tum "ID kod" alanlari tek bir global havuzda benzersiz olmak zorundadir.

Degismez kurallar:
- kullanici ID kodu manuel girmez
- ID kodu sadece program tarafindan uretilir
- her kutuphane kendi on eki ile otomatik kod alir (ornek: `CNC-000001`, `PVD-000001`)
- ayni ID kodu iki farkli kayitta bulunamaz (master urun vs. islem kutuphanesi dahil)
- mevcut kayitlarda kod cakismasi yoksa kod korunur
- mevcut kayitlarda kod cakismasi varsa sadece cakisan kayitlara yeni kod atanir

Arama ve yonlendirme ilkesi:
- ana ekrandaki ID aramasi tek bir kaynaga gitmelidir
- bu nedenle global kod benzersizligi zorunludur

## 8) Master Urun Kutuphanesi Yasasi
Master Urun Kutuphanesi, fabrikaya giren tum fiziksel malzemelerin ilk kabul kimliginin tutuldugu ana referans katalogdur.

Kapsam:
- dogrudan kullanilan malzemeler (vida, hirdavat, koli, zimpara vb.)
- proseste sekil degistiren girdiler (PMMA granul vb.)
- yardimci tuketimler, ambalajlar ve satin alma ile gelen diger fiziksel urunler

Temel ilke:
- malzeme sisteme hangi formda giriyorsa, master kaydi o ilk formu temsil eder
- master kayit "ilk kimlik"tir; uretim sonrasi olusan ara form/mamul bu kaydin yerine gecmez

Zorunlu kullanim:
- satin alma talebi ve siparis acarken urun secimi master urun kutuphanesi kaydi uzerinden yapilir
- depo mal kabul, ilk stok girisi ve envantere alma islemlerinde secim master kayittan yapilir
- moduller arasi baglanti urun adi ile degil master kaydin ID kodu ile kurulur

Omurga kurali:
- master urun kutuphanesi, fabrikadaki tum malzeme varliginin tek ve merkezi referans omurgasidir
- ayni malzeme icin modul bazli tekrar kart acilmaz; tum akis ayni master kimlige baglanir

Sinir kurali:
- islem sonrasi varyantlar, yari mamuller, montaj kartlari ve satisa ozel urunler kendi kutuphanelerinde yonetilir
- bu kayitlar master kimligi silemez, degistiremez veya ikame edemez; sadece ona baglanir

## 9) Asistan Calisma ve Dur Kurallari
Bu proje akisinda asistanin (Codex) uygulama disiplini asagidaki kurallara baglidir.

Zorunlu kurallar:
- her degisiklikte once "anayasa/akis uyumu" kontrolu yapacagim
- su 3 durumda otomatik hayir/dur diyecegim:
- merkezi kod kuralini bozan oneri
- referans kirma riski olan silme/tasima
- dry-run ve yedek olmadan toplu import
- bir seyi anlamadiysam sormadan uygulamaya gecmeyecegim

## 10) Müşteri ID ve Planlama Gizliliği Yasası

- Her müşteri, kullanıcıya görünen benzersiz bir Müşteri ID taşır.
- Müşteri ID formatı `MREF-000001` şeklindedir.
- Müşteri ID program tarafından üretilir; kullanıcı manuel girmez ve değiştiremez.
- Müşteri ID müşteri adı, firma adı veya Cari Kodu’ndan türetilmez.
- Cari Kodu muhasebesel/ticari alan olarak kalır; Müşteri ID ile karıştırılmaz.
- Müşteri adı, firma adı veya Cari Kodu değişse bile Müşteri ID değişmez.
- Planlama ve üretim ekranlarında müşteri adı, firma adı, telefon, adres, fiyat, iskonto, ödeme bilgisi ve ticari satış notları görünmez.
- Siparişten planlamaya aktarılan kayıtlarda gerekirse yalnız Müşteri ID gösterilir.
- Bu kural satış, planlama ve üretim ayrımının gizlilik omurgasıdır.
