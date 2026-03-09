# Ana Depo ve Depolar Ozeti

Tarih: 2026-03-09
Kaynak: `notes/kullanici-notlari-2026-03-09.txt`

## Temel Hedef

- Fabrikadaki her urunun, hammaddenin, yari mamulun, bitmis unsurun, sevke hazir urunun ve fasondaki urunun tek merkezden gorulmesi isteniyor.
- Ana amaclar:
  - Hangi urunun nerede oldugunu bilmek
  - Siparis geldiginde saglikli termin verebilmek
  - Urun kayip ve kacaklarini azaltmak

## Ana Depo Mantigi

- Ana depo genelde bitmis unsur ve parca tutar.
- Ana depoda civata, silikon, naylon gibi kucuk urunler de tutulabilir.
- Ana depo icinde alt alanlar / alt depolar olusturulabilmeli.
- Her alt alan icin:
  - depo adi
  - lokasyon notu
  tutulabilmeli.
- Ornek alt alanlar:
  - Sevkiyata Gidecek Urunler
  - Musteri Sevk Alani
  - Aluminyum Boru Deposu
  - Granul Deposu
- Ana depoda hucre / raf adresleme olacak.
- Ornek adres mantigi:
  - `1A`, `1B`, `14R`
- Urun ana depoya konurken adresi de islenmeli.

## Genel Depo Ekrani Beklentisi

- `Depo & Stok` ekrani tum yapinin merkezi olacak.
- Bu ekranda su varliklar gorunmeli:
  - Ana depo
  - Birim / atolye depolari
  - Fason depolari
  - Sevke gidecek urunler
  - Hammaddeler
  - Yari mamuller
  - Bitmis urunler
- Kullanici bu sayfaya girdiginde fabrikada ne varsa gorebilmeli.

## Birim / Atolye Depolari

- Her birimin kendi deposu olacak.
- Urun rota uzerinde hangi birimdeyse once o birimin deposuna dusecek.
- Yari mamul ve tamamlanmamis urunler de birim depolarinda gorunecek.
- Birim depolarinda urun durumlari:
  - Bekleyen
  - Islemde
  - Hazir
  - Rezerve

## Birimler Arasi Akis

- Bir urun onceki istasyonda kismen veya tamamen tamamlandiginda sonraki istasyona haber gitmeli.
- Ornek:
  - 100 adetlik is var
  - onceki istasyon 30 adet yapti
  - sonraki istasyon bu 30 adedi gorebilmeli
- Gecis mantigi:
  - Onceki istasyon `verdim / hazir` durumuna getirir
  - Sonraki istasyon `aldim` dediginde
  - onceki istasyonun deposundan duser
  - sonraki istasyonun deposuna eklenir
- Ic birimler arasi klasik transfer fisi zorunlu degil.
- Sistem uyarisi ve `al` mantigi tercih ediliyor.

## Is Emri ve Uretim Mantigi

- Is emri lot bazli olacak.
- Ornek:
  - 100 adetlik is emri
  - testere 30 adet islediyse
  - 30 adet sonraki istasyonda gorunmeli
- Rota adim atlama kesinlikle yasak.
- Kismi tamamlama olacak.
- Hatali islem icin geri alma ilk surumde olmayacak.
- Gerekirse yeni is emri acilacak.

## Siparis ve Stok Iliskisi

- Is emri acarken hem `siparis icin uretim` hem `stok icin uretim` secenekleri olacak.
- Siparis icin uretilen urun:
  - normalde ilgili ise bagli olacak
  - ama planlamaci yetkili isterse baska sipariste de kullanabilecek
- Stok icin uretilen urun:
  - sonradan siparise baglanabilecek
- Siparis geldiginde sistem oncelikle su sirayla bakacak:
  1. Nihai bitmis urun stok alani
  2. Parca / bilesen stogu
  3. Atolye / birim depolari
- Eksik miktar icin yeni is emri acilacak.

## Yari Mamul Kurali

- Yari mamul de stok sayilacak.
- Envanterde gorunur olacak.
- Yari mamul sadece ic kullanim nesnesi gibi dusunulmeyecek; siparise baglanabilecek.
- Ornek:
  - Mafsal CNC'de yari mamul olarak var
  - yeni siparis gelirse
  - kalan rota oradan devam ettirilebilecek
- Yari mamul ana depoda da tutulabilecek, ama bu ana kullanim sekli degil.

## Fason / Dis Tedarikci

- Fason adimi rota icinde normal istasyon gibi sayilacak.
- Fasona giden urun depo hareketi gibi izlenecek.
- Fasonun deposuna bakildiginda elindeki urunler gorulebilmeli.
- Fason sureci ilk surumde basit tutulacak.
- Disari giden urun kuralı:
  - Ic birim urunu dogrudan disariya gonderemez
  - Disari / fason hareketi depo uzerinden gider ve gelir
- Fasondan gelen urun varsayilan olarak `Depo Transfer`e dusecek.
- Oradan:
  - baska fasongaidebilir
  - ana depoya alinabilir
  - sonraki rotaya yonlenebilir

## Depo Transfer Kurali

- `Depo Transfer` rota icinde her zaman zorunlu istasyon degil.
- Ama urun disariya / fasona gidiyorsa mutlaka depo transfer uzerinden gecmeli.
- Ic birimler sadece rotadaki sonraki istasyona devir yapar.

## Sevkiyat ve Rezervasyon

- Sevkiyat alanina alinan urun siparise bagliysa rezerve sayilacak.
- Genel mantik:
  - urun once depoya girer
  - siparis / montaj / sevkiyat akisina gore oradan kullanilir

## Stok Kurallari

- Eksi stok engellenmeyecek.
- Sistem sadece uyari verecek.
- Ilk surumde zorunlu alanlar minimum tutulacak.
- Kullanici yorulmasin diye sert zorunluluklar sonraya birakilabilir.

## Testere Ozel Kurali

- Testere biriminde stok giris ve cikis birimi `mm` olacak.
- Girerken de cikarken de `mm` mantigi kullanilacak.

## Minumum Stok Uyarisi

- Ozellikle su alanlarda gerekli:
  - Ekstruder
  - Ana Depo
- Hedef stok tanimlanabilecek.
- Hedefin altina dusen satir kirmiziya donecek.
- Ornek:
  - 120'lik 3 mm boru minumum 130 adet
  - 2008 Bagdat dikme minumum 100 adet
  - 100'luk baba flansi minumum 200 adet

## Ekran ve Yetki Beklentisi

- Satis tarafi da tum depolari gorebilmeli; gerekirse sonra daraltilabilir.
- Uretim sorumlusu tum birim depolarini gorebilmeli.
- Yetkiler sonradan detayli rol paneli ile verilecek.
- Depo / birim / operator bazli ayrintili rol sistemi isteniyor.

## Atolye Ekrani Beklentisi

- Her atolyede temel ekran mantigi:
  - Bekleyen Isler
  - Islemde
  - Tamamlanan / Hazir
- Bekleyen bolumunde:
  - onceki istasyonda hazir olan isler gorunmeli
  - `al` butonu olmali
- Bazi birimlerde:
  - planlama ekrani olmali
  - lota personel ve makine atanabilmeli
  - gunluk uretilen adet girilebilmeli
- Ilk surumde planlama basit kalabilir:
  - sira numarasi
  - hedef tarih
- Sonra genisletilecek.

## Planlama Beklentisi

- Planlama temel olarak tarihe gore siralansin.
- Gerekirse satir bazli oncelik verilebilsin.
- Bir birim kendi rotasina gelecek isleri de onceden gorebilmeli.
- Ileride ayni urunleri birlestirip ayar bozmadan uretme ozelligi isteniyor.

## Henuz Netlesmemis Noktalar

- Ana depo ekraninin ust KPI alaninda hangi 5 bilginin gorunecegi
- Ana depo / sevkiyat adiminin is emri kapanisindaki kesin yeri
- Dis fason icin zorunlu alanlarin ilk surumde ne olacagi
- Kritik onay kurallarinin tam tanimi
- Yanlis stok dusmesini engelleyecek onay seviyeleri
- Is emri no formatinin kesin hali
- Ornek senaryo bolumunun yazili final hali

## Cekirdek Kural Ozeti

- Fabrikadaki hicbir urun sistem disinda kalmamali.
- Her birimin kendi deposu olacak.
- Urun rota uzerinde hangi asamadaysa o asamanin deposunda gorunecek.
- Kismi tamamlama olacak.
- Sonraki istasyon `al` diyene kadar urun onceki asamada hazir olarak bekleyecek.
- Disari giden urun depo transfer uzerinden gidecek.
- Yari mamul de stok olarak izlenecek.
