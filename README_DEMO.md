# DULDA ERP - Demo Maket (Offline)

Bu surum demo amaclidir ve internete veri gondermez.
Yerel acilis icin Node.js gerekir.
Kayitlar kalici olarak proje klasorunde `demo_state.json` dosyasina yazilir.

## 1) Calistirma
PowerShell ile klasore girip:

```powershell
.\RUN_DEMO.ps1
```

Tarayicida su adres acilir:

`http://localhost:5500/index.html`

Not:
- 5500 portu doluysa script otomatik olarak bos bir porta gecer (5501, 5502 ...).
- Ekranda hangi adresin acildigi yazilir.
- Port degisse bile veri kaybi olmaz (dosyadan yuklenir).

Alternatif elle calistirma:

```powershell
node .\serve.js 5500
```

## 2) Yeni Kod Yapisi (Gorunum Ayni)
- `index.html`: Ana ekran
- `style.css`: Stil dosyasi
- `src/core/app-core.js`: cekirdek (App, DB, Router, UI)
- `src/modules/unit-module.js`: Birimler/Atolyeler
- `src/modules/product-library-module.js`: Urun kutuphanesi
- `src/modules/purchasing-module.js`: Satin alma
- `src/modules/stock-module.js`: Depo/Stok
- `aluminum_module_v2.js`: Aluminyum modul
- `src/core/modal.js`: Modal + uygulama baslatma

## 3) Not
- Menu, buton, ekran gorunumu mevcut prototiple ayni tutulmustur.
- Ilk hedef: demo maketi stabil tutup bunun uzerinden gelistirmek.

## 4) Proje Kurallari
- Su anki mod demo/prototip gelistirme modudur.
- Demo stabil ve sorunsuz onayi verildiginde internetten erisilen canli moda gecilir.
- Uygulama `/api/state` ile veri kaydettigi icin canli ortamda Node.js calisan hosting gerekir.
- Sadece statik hosting (yalnizca HTML/CSS/JS) tek basina yeterli degildir.
- GitHub otomatik yedekleme gorevi 15 dakikada bir degisiklik varsa commit+push yapar.
