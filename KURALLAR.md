# DULDA ERP - Proje Kurallari

## 1) Gelistirme Asamasi
- Su anki mod: demo/prototip gelistirme.
- Hedef: ozellikler tamamlanana kadar demoyu stabil ve sorunsuz calisir halde tutmak.

## 2) Yayin Gecis Kurali
- "Demo stabil ve sorunsuz" onayi verildiginde proje internetten erisilen canli moda gecirilir.
- Bu gecis bir sonraki resmi asama olarak kabul edilir.

## 3) Canli Yayin Teknik Kosulu
- Uygulama `/api/state` uzerinden veri kaydi yaptigi icin yayin ortaminda Node.js calisan bir sunucu/hosting kullanilir.
- Sadece statik hosting (yalnizca HTML/CSS/JS) tek basina yeterli degildir.

## 4) Operasyon Kurali
- Kod degisiklikleri GitHub uzerinden versiyonlu ilerler.
- Otomatik yedekleme gorevi 15 dakikada bir degisiklik varsa commit+push yapar.
