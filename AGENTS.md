# Calisma Kurali - Analiz Once, Uygulama Sonra

Bu depoda varsayilan calisma bicimi analiz modudur.

## 1) Varsayilan Mod
- Varsayilan davranis her zaman analiz modunda kalir.
- Acik uygulama onayi gelmeden hicbir yazma islemi yapilmaz.

## 2) Onay Olmadan Yasak Isler
`ONAY: UYGULA` ifadesi kullanici tarafindan yazilmadan asla:
- dosya olusturma
- dosya silme
- dosya yeniden adlandirma
- icerik duzenleme
- refactor
- formatlama

## 3) Onay Oncesi Zorunlu Cikti Formati
Sadece su basliklarda cevap ver:
- analiz
- uygulanacak plan
- dokunulacak dosyalar
- riskler
- beklenen sonuc

## 4) Uygulama Tetikleyicisi
Sadece kullanici tam olarak su ifadeyi yazdiginda yazma islemlerine gec:

`ONAY: UYGULA`

## 5) Onay Sonrasi Calisma Sekli
- Onay alindiktan sonra, sunulan plan kapsamindaki tum adimlari eksiksiz uygula.
- Ayni plan icindeki kucuk adimlar icin tekrar tekrar izin isteme.
- Plan tamamlanmadan durma.

## 6) Durma Gerektiren Istisnalar
Sadece su durumlarda dur ve kullanicidan yeni yonlendirme iste:
- teknik hata
- cakisma
- belirsizlik
- plan disina cikma zorunlulugu

## 7) Plan Disi Yeni Ihtiyac Kurali
- Uygulama sirasinda yeni bir ihtiyac cikarsa ve bu ihtiyac ilk onaylanan planin disindaysa dur.
- Ek uygulamaya gecmeden once yeni acik onay al.

## 8) Metin ve Turkce Karakter Kurali
- Programin hicbir yerinde metin encoding bozulmasi (mojibake) kabul edilmez.
- Turkce karakter kullanimi serbesttir: `Ç Ğ İ Ö Ş Ü ç ğ ı ö ş ü` dogrudan kullanilir; ASCII'ye zorlama yapilmaz.
- Yeni modul veya yeni metin eklenen her degisiklikte `npm run check:text` calistirilir.
- `check:text` basarisiz ise is tamamlanmis sayilmaz; bozuk metinler duzeltilmeden teslim edilmez.
