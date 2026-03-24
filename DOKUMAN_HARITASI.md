# DULDA ERP - DOKUMAN HARITASI

Tarih: 2026-03-24
Durum: Aktif
Amac: Tek bakista hangi sorunun cevabi hangi dosyada oldugunu gostermek.

## 1) Nereden Baslamali

1. Yeni kullaniciysan:
- `KULLANICI_EL_KITABI.md`

2. Sistemi sifirdan tekrar gelistireceksen:
- `YENIDEN_YAZIM_SPESIFIKASYONU.md`
- `VERI_SOZLESMESI.md`

3. Programin genel mantigini kisa ozetle okumak istersen:
- `ISLEYIS.md`

4. Neyi neden degistirdigimizi takip etmek istersen:
- `GELISTIRME_GUNLUGU.md`

5. Temel degismez kurallari gormek istersen:
- `ANAYASA.md`

## 2) Dokuman Rolleri

- `KULLANICI_EL_KITABI.md`:
  - Isletme ve operator kullanim rehberi
  - Program nasil acilir, hangi ekran ne ise yarar

- `YENIDEN_YAZIM_SPESIFIKASYONU.md`:
  - Sistemi sifirdan yazmak icin fonksiyonel gereksinimler
  - Mimari, moduller, akislari ve kabul kriterleri

- `VERI_SOZLESMESI.md`:
  - Veri yapisinin teknik sozu
  - Koleksiyonlar, zorunlu alanlar, kod ve baglanti kurallari

- `ISLEYIS.md`:
  - Hizli isleyis ozeti
  - Kart mantigi, rota mantigi, is emri iliskisi

- `GELISTIRME_GUNLUGU.md`:
  - "Ne degisti" + "neden degisti" kayitlari
  - Karar hafizasi

## 3) Dokuman Guncelleme Kurali

Her anlamli degisiklikte en az bu iki adim zorunludur:

1. `GELISTIRME_GUNLUGU.md` kaydi ac
- Ne degisti
- Neden degisti
- Etki/Risk

2. Davranis degistiyse ilgili ana dokumani guncelle
- Is akis degisti -> `ISLEYIS.md` veya `KULLANICI_EL_KITABI.md`
- Veri alani degisti -> `VERI_SOZLESMESI.md`
- Yeni modul/ekran geldi -> `YENIDEN_YAZIM_SPESIFIKASYONU.md`

3. Belirsiz gereksinim kurali
- Anlasilmayan ozellikte once kullaniciya soru sorulur, sonra gelistirme yapilir.
- Yeni gelistirmede "neden" bilgisi kullanicidan netlestirilir ve gunluge yazilir.

Bu kural uygulanmazsa dokuman guvenilirligini kaybeder.
