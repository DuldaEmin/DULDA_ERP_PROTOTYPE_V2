# URETIM - STOK - SIPARIS MANTIGI

Tarih: 2026-03-09
Durum: Kabul edilen sistem mantigi taslagi
Amac: Projede neden bu yapinin kuruldugunu unutmamak ve daha sonra ayni mantigi hizli hatirlatmak

## 1) Ana Fikir

Bu sistemde tum birimler ayni zamanda birer depo gibi davranir:
- Ana Depo
- Ekstruder Atolyesi
- CNC Atolyesi
- Pleksi Polisaj Atolyesi
- Depo Transfer Merkezi
- Gerekirse diger birimler

Bir urun sadece ana depoda degil, uretimin herhangi bir asamasinda da stoklanabilir.

Yani:
- Bitmis urun stoklanabilir
- Yari mamul stoklanabilir
- Transfer bekleyen urun stoklanabilir
- Atolyede islenmis ama sonraki adima gecmemis urun stoklanabilir

Bu nedenle "stok" sadece bitmis urun anlamina gelmez.

## 2) Temel Ayrim

Sistemde 4 sey birbirinden ayrilmalidir:

1. Urun/Parca Karti
- Ornek: `PRC-000001`
- Bu urunun tanim kartidir
- Renk, kategori, master kod, rota gibi bilgileri tasir

2. Rota
- Urunun hangi istasyonlardan gececegini tanimlar
- Ornek:
  - 1. Ekstruder
  - 2. CNC
  - 3. Pleksi Polisaj
  - 4. Depo Transfer

3. Fiziksel Stok / Lot / Yari Mamul Kaydi
- Gercek elde duran urundur
- Aynı urunden farkli birimlerde farkli lotlar olabilir
- Sistem siparis geldiginde bunlari tarar

4. Is Emri / Siparis / Rezervasyon
- Urunun neden uretildigini ve kime ait oldugunu belirler

## 3) En Onemli Karar

Is emri acilirken bu secim zorunlu olacak:

- `SIPARIS ICIN URETIM`
- `STOK ICIN URETIM`

### 3.1 Siparis icin uretim
- Uretilen urun ilgili siparise bagli olur
- Rezerve sayilir
- Baska siparis bunu kullanamaz

### 3.2 Stok icin uretim
- Uretilen urun serbest stok olur
- Daha sonra gelen siparis buna baglanabilir
- Urun hangi merhalede olursa olsun sistem tarafindan aday stok olarak gorulebilir

## 4) Ana Kural

Bir urunun hangi merhalede oldugu sistem tarafindan bilinmelidir.

Ama bu bilgi urunu kullanmaya engel degildir.

Yani:
- Urun CNC'de olabilir
- Urun Depo Transfer'te olabilir
- Urun Ana Depo'da olabilir

Siparis geldiginde sistem sunu demelidir:
- "Ayni urunden elde mevcut kayit var"
- "Bu kayitlar farkli merhalelerde bekliyor"
- "Hangisini bu siparise baglamak istiyorsun?"

## 5) Sistem Ne Yapmali

Yeni siparis geldiginde sistem su sirayla kontrol yapmali:

1. Ana depoda bitmis urun var mi
2. Depo transferde bekleyen uygun urun var mi
3. Atolyelerde yari mamul var mi
4. Ayni urunun daha ileri rota adiminda bulunan kaydi var mi
5. Hicbiri yoksa yeni uretim ac

## 6) Kullaniciya Gosterilecek Secenekler

Siparis acildiginda veya siparis satirina urun baglanacaginda sistem su secenekleri gosterebilir:

- `Ana depodan kullan`
- `CNC atolyedeki yari mamulden devam et`
- `Depo transferde bekleyen kaydi kullan`
- `Yeni uretim baslat`

Bu secim kullanici kontrollu olmali.

Sebep:
- Bazen ana depodaki urun sevke uygun olur
- Bazen yarı mamul daha mantikli olur
- Bazen mevcut yari mamul baska ise ayrilmis olabilir

## 7) Stok Mantigi

Her fiziksel urun kaydinda su bilgiler tutulmalidir:

- hangi urun kartina bagli oldugu
- miktar
- hangi birimde bulundugu
- rottanin hangi adiminda oldugu
- son tamamlanan operasyon
- stok mu siparis mi oldugu
- serbest mi rezerve mi oldugu

Bu sayede su sorular cevaplanabilir:
- Bu urun su an nerede?
- Bu urun bitmis mi yari mamul mu?
- Bu urun kime ait?
- Bu urun baska siparise verilebilir mi?
- Bu urun hangi istasyondan devam edecek?

## 8) Rezervasyon Kurali

`SIPARIS` tipi uretilen urun:
- sadece kendi siparisine aittir
- baska siparise otomatik baglanamaz

`STOK` tipi uretilen urun:
- serbest stoktur
- yeni gelen siparise baglanabilir
- baglandigi anda rezerve duruma gecebilir

## 9) "Hangi Merhalede Olursa Olsun Stoklanabilir" Kurali

Bu projede kabul edilen mantik:

- urun sadece en son adimda stok olmaz
- rota icindeki her adimda stok kaydi olabilir
- bu kayitlar sistem tarafindan arastirilabilir
- siparisler uygun olan kayda baglanabilir

Ornekler:
- Ekstruderden cikti, CNC'ye girmedi: stok olabilir
- CNC'de islenmis, polisaja gitmedi: stok olabilir
- Depo transferde sevk bekliyor: stok olabilir
- Ana depoda hazir urun: stok olabilir

## 10) Kod Mantigi Hakkinda Karar

Asagidaki kodlar operasyon kimligi olarak degerlidir:
- `HAM0001`
- `EKS-000001`
- `CNC-000001`
- `PLSJ-000001`
- `DTR-000002`

Ancak sistemin ana veri modeli sadece bu kod zincirine bagli kurulmamalidir.

Dogru mantik:
- urun karti ayri
- rota ayri
- fiziksel lot ayri
- hareket gecmisi ayri

Kod zinciri ekranda gosterilebilir ama veri tabani mantigi bunun uzerine kurulmamalidir.

## 11) Hedeflenen Sonuc

Bu sistem kuruldugunda sunlar mumkun olacak:

- Ayni urunun farkli asamalarda bekleyen stoklari gorulecek
- Yeni siparis geldiginde mevcut yari mamuller degerlendirilecek
- Gereksiz yeniden uretim azalacak
- Siparis icin uretilen urun ile genel stok icin uretilen urun ayrisacak
- Tum birimler depo gibi calisabilecek
- Kullanici "nereden devam edelim" secimini yapabilecek

## 12) Kisa Ozet

Bu projede kabul edilen ana mantik sudur:

- Tum birimler birer depo gibi dusunulecek
- Urun her merhalede stoklanabilecek
- Is emri acilirken bunun `siparis` mi `stok` mu oldugu secilecek
- `siparis` ise rezerve olacak
- `stok` ise daha sonra gelen siparise baglanabilecek
- Siparis geldiginde sistem urunun sadece ana depodaki haline degil, tum ara asamalardaki uygun kayitlarina da bakacak
- Kullanici isterse ana depodan, ister yari mamulden, ister transfer bekleyen kayittan devam edecek

## 13) Bu Dosya Neden Var

Bu dosya su amacla tutuluyor:

- Kurulan is mantigini unutmamak
- Gelecekte gelistirme yaparken ana hedefi kaybetmemek
- "Bu sistemi neden boyle kurmustuk?" sorusuna hizli cevap verebilmek

Gelecekte bana su tip sorular soruldugunda bu dosya referans alinacak:

- "Bizim stok mantigimiz neydi?"
- "Yari mamul kullanimi nasil olacakti?"
- "Siparis ve stok uretimini nasil ayiriyorduk?"
- "Tum birimler depo gibi mi davranacakti?"

