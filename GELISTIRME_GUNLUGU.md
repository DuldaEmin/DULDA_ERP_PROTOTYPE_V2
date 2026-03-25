# DULDA ERP - GELISTIRME GUNLUGU

Tarih: 2026-03-24
Durum: Aktif
Amac: Yapilan her gelistirmenin "neden" yapildigini kayit altina almak.

## 1) Nasil Kullanilacak

Her anlamli gelistirmede bu dosyaya yeni bir kayit eklenir.
Kayitlar en yeni ustte olacak sekilde tutulur.

Zorunlu:
- Kod davranisini etkileyen her degisiklikte bu dosya guncellenecek.
- Sadece "ne degisti" degil, "neden degisti" mutlaka yazilacak.
- Is akis veya veri degistiyse ilgili ana dokumana da referans verilecek.

Iletisim protokolu:
- Belirsiz veya tam anlasilmayan bir ozellikte degisiklik yapmadan once kullaniciya sorulur.
- Yeni bir degisiklikte "neden yapiyoruz?" sorusu netlestirilir.
- Netlesen "neden" bilgisi ilgili kayitta bu dosyaya yazilir.

## 2) Kayit Formati (Sablon)

### [Tarih] - [Baslik]
- Ne degisti:
- Neden degisti:
- Etkilenen ekran/modul:
- Beklenen sonuc:
- Risk/Not:

## 3) Kayitlar

### 2026-03-25 - Montaja Hazir Kurali Dokumante Edildi
- Ne degisti:
  - `ISLEYIS.md` icine "Montaja Hazir Kurali (Net)" bolumu eklendi.
  - "Son rota + DEPO TRANSFER + Aldim" tetik kurali ve kismi adet davranisi yazildi.
  - Yari mamulun montaja otomatik dusmeyecegi netlestirildi.
- Neden degisti:
  - Planlama ve atelye akisinda ekiplerin ayni kurali kullanmasi.
  - "Ne zaman montaja hazir sayilir?" sorusunda karisiklik olusmamasi.
- Etkilenen ekran/modul:
  - Is akis kurali (dokumantasyon katmani; kod degisikligi bu kayitta yok).
- Beklenen sonuc:
  - Atelye, depo transfer ve planlama ekipleri tek kuralla ilerler.
  - Kismi adet uretimde montaja gecis miktari net izlenir.
- Risk/Not:
  - Kural kodda uygulanirken ayni tetigin korunmasi gerekir; alternatif kisa yollar eklenmemeli.

### 2026-03-24 - Kullanici Onayi ve Neden Kaydi Protokolu Eklendi
- Ne degisti:
  - Gelistirme gunlugune zorunlu iletisim protokolu eklendi.
- Neden degisti:
  - Belirsiz gereksinimde yanlis implementasyon riskini azaltmak.
  - Her yeni ozellikte karar gerekcesini kalici hale getirmek.
- Etkilenen ekran/modul:
  - Dokumantasyon akisi.
- Beklenen sonuc:
  - Once soru sonra implementasyon disiplini.
  - Her degisiklikte neden kaydi standartlasmasi.
- Risk/Not:
  - Hizli degisikliklerde bu adim atlanmamali.

### 2026-03-24 - Kalici Dokuman Sistemi Kuruldu (Onboarding + Rebuild)
- Ne degisti:
  - `DOKUMAN_HARITASI.md` eklendi.
  - `KULLANICI_EL_KITABI.md` eklendi.
  - `YENIDEN_YAZIM_SPESIFIKASYONU.md` eklendi.
  - `VERI_SOZLESMESI.md` eklendi.
  - `ISLEYIS.md` yeni dokumanlara yonlendirildi.
- Neden degisti:
  - Programci olmayan kullanici, sistemi tek basina calistirip anlayabilsin.
  - Ekip sifirdan yeniden yazmak zorunda kalirsa davranis kaybi olmadan tekrar kurabilsin.
  - Bilgi daginikligi ve karar unutulmasi riski azaltilsin.
- Etkilenen ekran/modul:
  - Dokumantasyon katmani (uygulama davranisi degismedi).
- Beklenen sonuc:
  - "Program nasil calisir?" ve "Nasil tekrar yazariz?" sorularina tek kaynaktan cevap.
  - Yeni kullanicilarin onboarding suresi kisalir.
- Risk/Not:
  - Dokumanlar guncel tutulmazsa zamanla guven kaybeder.
  - Her teslimde guncelleme disiplini zorunludur.

### 2026-03-24 - Isleyis ve Gelistirme Dokumani Baslatildi
- Ne degisti:
  - `ISLEYIS.md` olusturuldu.
  - `GELISTIRME_GUNLUGU.md` olusturuldu.
- Neden degisti:
  - Programci olmayan kullanicinin sistemi tek yerden takip etmesi.
  - Gelistirme kararlarinin zamanla unutulmasini engellemek.
- Etkilenen ekran/modul:
  - Dokumantasyon (kod davranisi degismedi).
- Beklenen sonuc:
  - "Bu ekran ne ise yarar?" ve "Neden bu degisiklik yapildi?" sorulari netlesecek.
- Risk/Not:
  - Bu dosya duzenli guncellenmezse faydasi azalir.
