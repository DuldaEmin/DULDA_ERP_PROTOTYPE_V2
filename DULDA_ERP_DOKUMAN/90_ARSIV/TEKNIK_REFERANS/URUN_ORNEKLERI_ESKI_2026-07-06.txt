# URUN ORNEKLERI
Tarih: 2026-02-23

Bu dosya urunleri ayni formatta toplamak icin kullanilir.

---

## ORNEK-001

### 1) Urun Temel Bilgi
- Urun adi: 40'lik dikme korkuluk (8 parcali patlatilmis ornek)
- Urun grubu: Korkuluk
- Musteri tipi: Standart + ozel renk varyantli

### 2) Patlatilmis Resim
- Resim dosya adi: Sohbette yuklenen patlatilmis gorsel (8 parca)
- Kisa aciklama: 1-8 numarali parcalarla olusan dikme seti (ustten alta ay baglanti, yarikli tapa, borular, yuzukler, pleksi govde, flans)

### 3) Parca Listesi
- Parca-1:
  - Ad: Ay baglanti
  - Kaynak: Akpa Aluminyum
  - Not: Testere + CNC + (opsiyonel) polisaj/kaplama
- Parca-2:
  - Ad: Yarikli tapa
  - Kaynak: Tedarikciden presli/yuzeyi bozuk gelir
  - Not: CNC torna + delik/havsa + polisaj + kaplama
- Parca-3:
  - Ad: 40'lik ust boru
  - Kaynak: Akpa Aluminyum / Celikler Aluminyum (6 metre boy)
  - Not: Eloksal/RAL kodlu veya ham boru
- Parca-4:
  - Ad: 40'lik dikme yuzugu
  - Kaynak: Parca-1 ile ayni
  - Not: Parca-1 ile ayni rota
- Parca-5:
  - Ad: Pleksi govde
  - Kaynak: Sumitomo / Sabic (granul)
  - Not: Ekstruder + punta + CNC + pleksi polisaj + firin
- Parca-6:
  - Ad: 40'lik dikme yuzugu
  - Kaynak: Parca-4 ile ayni
  - Not: Parca-1/4 ile ayni rota
- Parca-7:
  - Ad: 40'lik alt boru
  - Kaynak: Parca-3 ile ayni
  - Not: Parca-3 ile ayni rota, boy farkli
- Parca-8:
  - Ad: 40'lik dikme flansi
  - Kaynak: Parca-2 ile ayni
  - Not: Parca-2 ile ayni rota

### 4) Istasyon Rotasi
- Parca-1 (Ay baglanti) rota:
  - Tedarikci -> Depo/Testere rafi -> Testere (olcuye gore kesim) -> CNC -> Depo
  - Opsiyon: Depo -> Ibrahim Polisaj -> Eloksal (bazen Ibrahim direkt goturur, bazen Depo sevk eder) -> Depo -> Montaj
- Parca-2 (Yarikli tapa) rota:
  - Tedarikci -> Depo -> CNC Torna (1. operasyon) -> CNC Delik/Havsa (2. operasyon) -> Depo
  - Devam: Depo -> Ibrahim Polisaj -> Eloksal (direkt veya depo uzerinden) -> Depo rafi -> Montaj -> Sevk
- Parca-3 (40'lik ust boru) rota:
  - Standart: Tedarikci (6 m) -> Testere rafi -> Testere (ornek 80 mm kesim) -> Depo -> Montaj
  - Ozel kaplama: Testere -> Depo -> Polisaj -> PVD Titanyum/Krom vb. -> Depo -> Montaj
- Parca-4 rota:
  - Parca-1 ile ayni
- Parca-5 (Pleksi govde) rota:
  - Granul tedarik -> Depo (hammadde alani) -> Ekstruder (8 makine; cap 50 kalibi icin 1 ve 5 nolu makineler)
  - Opsiyonlar: Renk icin dozajlama, kabarcik icin ilgili makine
  - Sonrasi: Boy kesim -> Punta -> CNC 1. operasyon -> CNC 2. operasyon -> (gerekiyorsa CNC isleme merkezi)
  - Sonrasi: Pleksi Polisaj (oksijen salama) -> Firin (80 C, kucuk kutle 4 saat, buyuk kutle 8 saat) -> Depo -> Montaj
- Parca-6 rota:
  - Parca-4 ile ayni (dolayisiyla Parca-1 ile ayni)
- Parca-7 rota:
  - Parca-3 ile ayni (boy farkli)
- Parca-8 rota:
  - Parca-2 ile ayni (tedarikci dahil)

### 5) Kalite ve Kritik Noktalar
- Olcu toleransi: Testere kesim olculeri ve CNC sonrasi olculer kritik
- Yuzey beklentisi: Polisaj/kaplama oncesi yuzey durumu uygun olmali
- Kontrol noktasi:
  - CNC sonrasi yarimamul kontrol
  - Polisaj sonrasi yuzey kontrol
  - Kaplama sonrasi renk/yuzey uygunluk kontrol
  - Montaj oncesi parca uyumu kontrol
- Hata riski:
  - Kaplama oncesi yetersiz hazirlik
  - Pleksi polisaj sonrasi gerilim/catlama riski (firinlama zorunlu)
  - Ozel renk akislarda depo-sevk takibinin kopmasi

### 6) Uretim Hedefi
- Gunluk hedef adet: (netlesecek)
- Parti buyuklugu: (netlesecek)
- Tahmini cevrim suresi: (netlesecek)
- Stok politikasi notu:
  - Parca 1,2,4,6,8 CNC sonrasi yarimamul olarak depoda tutulabilir
  - Talebe gore polisaj + kaplama (eloksal / boya / pvd titanyum) yapilir
  - Hizli satan renkler (or: sari eloksal) icin kaplanmis hedef stok tutulur

### 7) Katalog Bilgisi
- PDF dosya adi: dulda-katalog-2024.pdf
- Ilgili sayfalar: Otomatik tarama ile kod bulunan sayfalar alindi (reklam/montaj agirlikli sayfalar dislandi)
- Not:
  - Kod/isim cikarim dosyasi: `KATALOG_KOD_LISTESI.md`
  - Otomatik OCR nedeniyle bazi isimlerde karakter eksigi olabilir; gerekirse birlikte duzeltilecek

---

## ORNEK-002
(Ayni sablonu kopyalayip doldur)
