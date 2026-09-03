# DULDA ERP - VERI SOZLESMESI

Tarih: 2026-03-24
Durum: Aktif
Amac: Veri yapisinin teknik sinirlarini, zorunlu alanlarini ve kurallarini sabitlemek.

## 1) Koku Yapi

Sistem state yapisi:

```json
{
  "schema_version": 1,
  "meta": {
    "created_at": "ISO-8601",
    "updated_at": "ISO-8601",
    "revision": 0,
    "seedFlags": {}
  },
  "data": {
    "...koleksiyonlar..."
  }
}
```

## 2) Cekirdek Koleksiyonlar

Asagidaki koleksiyonlar aktif kodda kullaniliyor:

- `products`
- `productCategories`
- `colorLibrary`
- `partComponentCards`
- `assemblyGroups`
- `catalogProductVariants`
- `montageCards`
- `planningDemands`
- `workOrders`
- `workOrderTransactions`
- `depoTransferTasks`
- `depoTransferLogs`
- `depoRoutes`
- `stockDepots`
- `stockDepotLocations`
- `stockDepotItems`
- `units`
- `inventory`
- `suppliers`
- `personnel`
- `cncCards`
- `cncCategories`
- `extruderLibraryCards`
- `sawCutOrders`
- `plexiPolishCards`
- `pvdCards`
- `eloksalCards`
- `ibrahimPolishCards`

## 3) Zorunlu Is Kurallari

1. Kimlik:
- Her kayit benzersiz bir `id` tasir.
- Kayitlar isimle degil `id`/`code` ile baglanir.

2. Global kod benzersizligi:
- Kodlar tum kutuphanelerde global benzersiz olmalidir.
- Ayni kod ikinci kez kullanilamaz.

3. Kart ve hareket ayrimi:
- Kartlar standart tarifi tutar.
- Miktar/hareket bilgisi is emri ve hareket kaydinda tutulur.

4. Kayit guvenligi:
- `revision` tabanli kayit cakisma kontrolu vardir.
- Eski payload yeni verinin ustune yazamaz.

## 4) Kritik Varliklar ve Minimum Alanlari

## 4.1 Master urun (`products`)
- `id`
- `code`
- `name`
- `categoryId` veya `category`
- `specs` (unit, unitAmount, color vb.)

## 4.2 Parca/Bilesen (`partComponentCards`)
- `id`
- `code` (ornek `PRC-000001`)
- `name`
- `masterCode` (master urun referansi)
- `routes[]`:
  - `stationId`
  - `processId`

## 4.3 Montaj karti (`montageCards`)
- `id`
- `cardCode` (ornek `MON-000001`)
- `productCode`
- `productName`
- `componentIds[]` (parca kodlari)

## 4.4 Urun varyanti (`catalogProductVariants`)
- `id`
- `familyCode`
- `variantCode`
- `productName`
- `productGroup`
- `masterRefs[]`
- `items[]`
- `montageCard`

## 4.5 Planlama talebi (`planningDemands`)
- `id`
- `demandCode` (ornek `PLN-000001`)
- `itemType` (`MODEL` veya `COMPONENT`)
- `qty`
- `dueDate`
- `priority`
- `status` (`OPEN`, `RELEASED`, `CANCELLED`)

## 4.6 Is emri (`workOrders`)
- `id`
- `workOrderCode` (ornek `WO-000001`)
- `productCode`
- `productName`
- `lotQty`
- `lines[]`
- `status`

Line minimum:
- `id`
- `lineCode`
- `componentCode`
- `componentName`
- `targetQty`
- `routes[]`

Route minimum:
- `seq`
- `stationId`
- `processId`

## 4.7 Is emri hareketi (`workOrderTransactions`)
- `id`
- `workOrderId`
- `lineId`
- `stationId`
- `actionType`
- `qty`
- `created_at`

## 5) Kod Formatlari (Aktif Kullanim)

- Parca: `PRC-000001`
- Montaj karti: `MON-000001`
- Planlama talebi: `PLN-000001`
- Is emri: `WO-000001`

Not:
- Master urun kodu kategori prefix'i ile uretilir (ornek `ALM0001`).
- Prefix ve format degisikligi global benzersizlik kuralini bozamaz.

## 6) Baglanti Zinciri

Minimum mantiksal zincir:

1. `products` -> hammadde
2. `partComponentCards.masterCode` -> master referansi
3. `montageCards.componentIds` -> parca kodlari
4. `catalogProductVariants.montageCard` -> montaj referansi
5. `planningDemands` -> varyant/parca talebi
6. `workOrders` -> operasyonel uretim kaydi
7. `workOrderTransactions` -> fiili hareket kaydi

## 7) Geriye Donuk Uyum

Normalizasyon sirasinda:
- Eksik diziler bos dizi olarak olusturulur.
- Eksik `id` alanlari uretilir.
- Bozuk/eksik state yeni veri ustune otomatik yazdirilmaz.

## 8) Degisiklik Protokolu

Veri modelinde her degisiklikte:
1. Bu dosya guncellenir.
2. `GELISTIRME_GUNLUGU.md` kaydi acilir.
3. Gerekirse `schema_version` stratejisi not edilir.

