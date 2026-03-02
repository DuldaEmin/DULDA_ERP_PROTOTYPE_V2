# DULDA ERP - VERI KIMLIGI ANAYASASI

Tarih: 2026-03-02
Durum: Aktif

## 1) Temel Ilke
Bu programda her unsur bir kimliktir.

Her kayit benzersiz bir `id` tasir:
- urun
- parca
- bilesen
- tedarikci
- musteri
- calisan
- kullanici
- siparis
- stok hareketi
- birim
- makine
- kategori
- islem karti

## 2) Baglanti Kurali
Kayitlar birbiriyle isimle degil `id` ile baglanir.

Not:
- isim degisebilir
- id degismez
- izleme, yetki ve raporlama id uzerinden yapilir

## 3) Benzersizlik Kurali
`id` alanlari bos birakilamaz.

`id` tekrari kabul edilmez:
- ayni koleksiyonda tekrar olamaz
- veri yuklenirken eksik/tekrarlanan id otomatik duzeltilir

## 4) Uygulama Kurali
Yeni gelistirmelerde zorunlu kural:
- yeni varlik = yeni benzersiz id
- referans alanlari = ilgili varligin id'si
- metin alanlari (ad, aciklama) sadece gorunum amaclidir

## 5) Is Kutuphanesi Kurali
Birimlerdeki urun kutuphanesi, urun listesi degil is tanimi kutuphanesidir.

Bu kutuphanelerdeki kartlar su amaca hizmet eder:
- Kart ID'si istasyonda yapilacak isi standartlar (ornek: `TST-000003` = 55 mm kesim gorevi)
- Rota satirinda bu ID secildiginde is parca turunden bagimsiz ayni kuralla uygulanir
- Kartin is tanimi degisebilir, ancak kart ID'si degismez
- Siparis adedi bu kutuphane kartinda degil, siparis/operasyon kaydinda tutulur
