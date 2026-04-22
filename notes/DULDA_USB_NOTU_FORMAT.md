# DULDA USB Not Formati (v1)

USB bellekten is akisini otomatik anlamak icin tek standart dosya adi kullanilir:

- `DULDA_USB_NOTU.json`

## Zorunlu alanlar

- `schema`: sabit deger `dulda-usb-note/v1`
- `project`: hedef proje adi
- `rules.anayasa_check_before_change`: `true` olmali
- `rules.auto_stop`: otomatik dur/hayir durum listesi
- `rules.ask_if_unclear`: anlamadiginda sorma zorunlulugu

## Onerilen alanlar

- `cnc_import_defaults.mode`: `dry-run-first`
- `cnc_import_defaults.dedupe`: `content-fingerprint`
- `cnc_import_defaults.unique_code_source`: `main-program`
- `cnc_import_defaults.backup_required`: `true`

## Ornek kullanim

1. USB takilir.
2. `DULDA_USB_NOTU.json` okunur.
3. Kurallar ve varsayilanlar yuklenir.
4. Islem dry-run ile baslar, yedek ve raporla tamamlanir.

## Guvenlik

- Dosya yoksa isleme otomatik devam edilmez.
- Dosya bozuksa islem durur.
- `auto_stop` kurallari ihlal edilirse otomatik hayir/dur uygulanir.

