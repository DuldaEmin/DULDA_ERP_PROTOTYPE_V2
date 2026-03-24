# DULDA ERP - ISLEYIS DOSYASI

Tarih: 2026-03-24
Durum: Aktif
Amac: Programci olmayan kullanici icin sistemin ne ise yaradigini tek dosyada anlatmak.

## 1) Bu Dosya Ne Icin Var

Bu dosya su sorulara hizli cevap verir:
- Hangi ekran ne ise yarar?
- Veri nerede olusur?
- Bir kayit sonraki ekrana nasil tasinir?

## 2) Ana Moduller ve Islevleri

1. Urun ve Parca Olusturma
- Uretim kimlik kartlari burada olusur.
- Master urun (hammadde), parca/bilesen, urun modeli ve renk kutuphanesi burada yonetilir.

2. Birimler / Atolyeler
- Is emirleri burada islenir.
- Her istasyon kendi onune gelen isi gorur, teslim alir, adet girer, sonraki istasyona devreder.

3. Depo ve Stok
- Urunun hangi depoda / hangi asamada oldugu burada izlenir.
- Ana depo, birim depolari, transfer ve hareket kayitlari takip edilir.

4. Montaj Kutuphanesi
- Montaj kartlari burada tanimlanir.
- Birden fazla parca/bilesen bir urun kartina baglanir.

## 3) Urun ve Parca Olusturma (Detay)

Bu bolum bir urunun "dijital recetesini" sisteme kaydetme alanidir.

### 3.1 Master Urun Kutuphanesi
- Hammadde tanimi tutulur.
- Kategori, birim, boy, renk, tedarikci, tedarikci kodu ve not gibi alanlar vardir.
- Bu kayit "ne ile uretecegiz?" sorusunu cevaplar.

### 3.2 Parca ve Bilesen
- Uretilecek parcanin kimligi olusur (ornek: `PRC-000007`).
- Parca kartina master hammadde baglanir.
- Rota adimlari eklenir:
  - Hangi istasyona gidecek
  - O istasyonda hangi islem ID uygulanacak
- Bu kayit "nasil uretecegiz?" sorusunu cevaplar.

### 3.3 Is Emirleri Ile Iliski
- Parca karti sureci tarif eder.
- Adet bilgisi parca kartinda tutulmaz.
- Adet ve termin is emri / siparis kaydinda girilir.

### 3.4 Ornek Akis

`Master hammadde -> Ekstruder -> CNC -> Polisaj/Firin -> Depo`

Bu rota parca kartinda saklandigi icin, ayni parca tekrar secildiginde sistem sureci otomatik bilir.

## 4) Temel Prensipler

1. Kimlik bazli calisma
- Kayitlar isimle degil kod/id ile baglanir.

2. Benzersiz kod
- Ayni kod ikinci kez kullanilmaz.

3. Kart ve hareket ayrimi
- Kart: standart tanim
- Is emri/hareket: gunluk operasyon

## 5) Kullanim Notu

Bu dosya sistemin "ne yaptigini" anlatir.
Detayli dokuman haritasi icin `DOKUMAN_HARITASI.md` dosyasina bakilir.

Ek kaynaklar:
- Yeni kullanici rehberi: `KULLANICI_EL_KITABI.md`
- Yeniden yazim teknik plani: `YENIDEN_YAZIM_SPESIFIKASYONU.md`
- Veri alani ve baglanti kurallari: `VERI_SOZLESMESI.md`
- Degisiklik karar hafizasi: `GELISTIRME_GUNLUGU.md`
