# DULDA ERP - KULLANICI EL KITABI

Tarih: 2026-03-24
Durum: Aktif
Hedef kitle: Programci olmayan yeni kullanici, operator, planlamaci, depo sorumlusu.

## 1) Programi Calistirma

On kosul:
- Windows
- Node.js kurulu olmali

Calistirma:
1. Proje klasorunde `RUN_DEMO.ps1` calistir.
2. Tarayici otomatik acilir: `http://localhost:5500/index.html` (veya bos port).
3. Program kapatilana kadar server acik kalir.

Not:
- Veri `demo_state.json` dosyasina kaydedilir.
- Her kayitta `.state-history` altina snapshot alinir.

## 2) Ana Ekranlar

1. `Planlama`
- Stok icin uretim talebi acilir.
- Talep havuzunda bekleyen kayitlar yonetilir.
- Talep is emrine donusturulur.

2. `Depo & Stok`
- Ana depo ve alt depolar gorulur.
- Depo lokasyonlari (raf/hucre) takip edilir.
- Islem kutuphanesi ve depo operasyon ekranlari kullanilir.

3. `Birimler & Atolyeler`
- Is emri planlama, teslim alma, adet girisi, tamamlanan miktar takibi yapilir.
- Istasyon bazli kutuphanelerden islem kartlari secilir.

4. `Urun ve Parca Olusturma`
- Master urun (hammadde), parca/bilesen, urun modeli, montaj baglantilari tanimlanir.
- Sistemin "dijital recete" yapisi burada kurulur.

5. `Satin Alma`
- Tedarikci listesi ve bagli urun referanslari gorulur.
- Siparis/talep alanlari temel seviyede mevcuttur.

6. `Personel`
- Personel kartlari ve yetkiler yonetilir.
- Moduller ve birimler bazinda izin setleri duzenlenir.

## 3) Urun ve Parca Tanimlama (Pratik Akis)

Bu akisi uyguladiginda bir urunun sureci sisteme tanitilmis olur.

1. Master urun kutuphanesinde hammaddeyi ac.
- Ornek: granul, profil, hirdavat.

2. Parca & bilesen kartini ac.
- Sistem benzersiz kod verir (ornek `PRC-000007`).
- Bu karta master hammadde kodunu bagla.

3. Rota ekle.
- Istasyonlari sirayla sec.
- Her istasyona islem ID bagla.

4. Kaydet.
- Artik bu parca secildiginde sistem hangi adimlardan gececegini bilir.

Kural:
- Kart "nasil yapilir" bilgisidir.
- Adet, siparis/is emrinde girilir.

## 4) Is Emri Mantigi (Kisa)

1. Planlama talep olusturur veya dogrudan is emri acilir.
2. Is emri satirlari parca rotasina gore istasyonlara duser.
3. Istasyon teslim alir, isler, tamamlanan adedi girer.
4. Son adim tamamlandiginda urun depo/sonraki surece devredilir.

## 5) Veri ve Guvenlik Mantigi

- Kayitlar id/kod ile baglanir, isimle baglanmaz.
- Kod tekrarina izin verilmez.
- Otomatik kayit vardir.
- Save cakismasi tespit edilirse veri ustune yazilmaz.
- Yedek snapshot yapisi sayesinde geri donus imkani vardir.

## 6) Siklikla Sorulan Sorular

Program acilmadi:
- Node.js kurulu mu kontrol et.
- `RUN_DEMO.ps1` komutunu tekrar calistir.

Verim kayboldu mu:
- `demo_state.json` ve `.state-history` klasorunu kontrol et.
- Son snapshot dosyasindan geri yukleme yapilabilir.

Hangi ekrandan ne yapacagimi bilmiyorum:
- `DOKUMAN_HARITASI.md` dosyasindan ilgili dokumana git.

