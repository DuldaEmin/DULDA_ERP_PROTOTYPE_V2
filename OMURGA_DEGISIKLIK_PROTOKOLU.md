# DULDA ERP - OMURGA DEGISIKLIK PROTOKOLU

Tarih: 2026-04-15  
Durum: Aktif

## 1) Amac
Bu protokol, calisan ana omurgayi bozmeden degisiklik yapmayi garanti altina almak icin kullanilir.

Kritik omurga:
- malzeme rota akis hesaplari
- aldim-verdim protokolleri (TAKE, COMPLETE, STORE, TRANSFER)

## 2) Degisiklikten Once (Zorunlu)
1. Degisiklik notu yaz:
   - neden gerekiyor
   - hangi ekran/fonksiyon etkileniyor
   - beklenen yeni davranis
2. Etki analizini yaz:
   - rota metriklerine etkisi
   - stok hareket kaydina etkisi
3. Rollback plani yaz:
   - hangi commit/branch referans alinacak
   - geri donus adimlari

## 3) Uygulama Sirasinda (Zorunlu)
1. Davranis testi guncelle:
   - `tests/backbone.guard.test.cjs`
2. Parse ve guard calistir:
   - `npm run guard:backbone`
3. Kritik kurallari koru:
   - stok negatife dusmez
   - kaynak/hedef ayni lokasyon transferi engellenir
   - transferde stok hareket kaydi zorunludur
   - rota adim metrikleri route index bazli ayrilir

## 4) PR Acarken (Zorunlu)
1. PR checklist eksiksiz doldur.
2. Omurga etkisini tek cumleyle net yaz:
   - "Omurga davranisi degismedi" veya
   - "Omurga davranisi su sekilde degisti: ..."
3. CI sonucu yesil olmadan merge yapma.

## 5) Uretime Alirken
1. Mumkunse kademeli yayin (canary/flag) uygula.
2. Ilk izleme penceresinde su metrikleri takip et:
   - TRANSFER hata orani
   - route metrik sapmalari
   - beklenmeyen stok negatif degerleri
3. Anomali varsa rollback planini gecikmeden uygula.

## 6) En Az Kabul Kriteri
Asagidaki 3 kosul saglanmadan omurga degisikligi tamam sayilmaz:
1. `npm run guard:backbone` gecti.
2. PR checklist tamamlandi.
3. Rollback plani yazili olarak mevcut.
