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

## 7) Operasyon Omurgasi ve Dis Birim Kagit Sevk Kurali
Ana uretim omurgasi degistirilemez:
- `kabul ettim -> aldim -> isledim -> verdim`
- rota izleme, plan satiri durumu ve parca takibi bu omurga uzerinden devam eder

Dis birim sevk/teslim (kagit + imza + PDF) ekrani, uretim omurgasinin yerine gecmez:
- bu ekran sadece depo ile fason/dis birim arasindaki lojistik kaydi tutar
- ana akis "A noktasindan B noktasina" aynen korunur, sadece tasima yontemi farkli katmandan izlenir
- planlama mantigi bu ekranla degistirilmez

Kismi sevk zorunlu desteklenir:
- ornek: satirda 30 adet varsa 20 adet lot olarak sevk edilebilir, kalan 10 adet depoda kalir
- lot bazli adetler toplami asla satir miktarini gecemez

Gecici "karsi taraf aldi" protokolu:
- dis birim program kullanmiyorsa `Teslim Edildi` adiminda sistem, hedef birimde otomatik `Aldim (TAKE)` kaydi acabilir
- boylece parca takibi kopmaz, malzeme kaybolmaz, ana sayfa izlenebilirligi korunur

Cifte isleme yasagi:
- ayni lot icin `Aldim` islemi tek kaynaktan islenir
- ya otomatik protokol ya karsi taraf ekranindan manuel alim kullanilir; ikisi ayni lotta birlikte calistirilmaz

Gelecek gecis kurali:
- dis birimler programa gectiginde otomatik protokol kapatilabilir
- bu degisiklik omurgayi bozmaz; sadece lojistik katmanin calisma modu degisir

