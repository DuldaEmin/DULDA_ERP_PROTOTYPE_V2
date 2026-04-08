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
