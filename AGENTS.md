# DULDA ERP — CODEX TEKNİK ÇALIŞMA KURALLARI

Ortak rol ve yetki sözleşmesi:

`DULDA_ERP_DOKUMAN/01_CALISMA_PROTOKOLU/DULDA_ERP_CALISMA_SOZLESMESI.txt`

Bu dosya sözleşmeyi tekrarlamaz; yalnız Codex'in teknik uygulama güvenliklerini belirler.

Codex hızlı çalışma bağlamı: `.agents/CODEX_HIZLI_BAGLAM.txt`

Bu özet bağlayıcı değildir; ilgili teknik işte aktif mimari ile güncel repo/state/test kanıtı ayrıca doğrulanır.

## 1. Varsayılan çalışma biçimi

- Varsayılan mod salt-okunur analizdir.
- Codex repo, worktree, state, runtime ve testleri salt-okunur inceleyebilir.
- Kullanıcı tam olarak `ONAY: UYGULA` yazmadan dosya, kod, veri, ERP kaydı veya runtime durumu değiştirilmez.
- Cevap biçimi işe göre belirlenir. Basit sorularda zorunlu rapor başlıkları kullanılmaz.

## 2. Uygulama onayı

Tek uygulama tetikleyicisi:

`ONAY: UYGULA`

- Onay yalnız o sırada açıkça tanımlanmış kapsam için geçerlidir.
- Eski bir onay yeni işe taşınmaz.
- Onay alınmadan dosya oluşturma, silme, taşıma, yeniden adlandırma, içerik değiştirme, formatlama, refactor, ERP mutation, server restart veya benzeri yazma işlemi yapılmaz.

## 3. Onay sonrası çalışma

- Codex onaylanan kapsamı mümkün olduğunca tek seferde tamamlar.
- Güvenli küçük adımlar ve kapsam içindeki rutin işlemler için tekrar onay istemez.
- Teknik çözümde en küçük güvenli değişikliği tercih eder.
- Kullanıcının mevcut modified/untracked çalışmaları korunur.
- İşletme hedefi değiştirilmez ve kullanıcı adına işletme kararı verilmez.

## 4. Testlerde kontrollü özerklik

- Tek bir test, araç, komut veya tarayıcı hatası işi durdurmak için yeterli değildir.
- Codex önce hatayı teşhis eder; onaylı kapsam içindeyse güvenli çözümü uygular ve testi tekrarlar.
- Yalnız test veya salt-okunur inceleme onaylandıysa kod ya da veri düzeltmesi yapılmaz.
- Hiçbir mutation oluşmadığı doğrulanırsa aynı kapsam içinde güvenli alternatif yöntem denenebilir.
- Önceki işlemin sonucu belirsizse işlem körlemesine tekrarlanmaz.
- Önceden var olan veya mevcut işle ilgisiz test hataları ayrı raporlanır; sonucu gerçekten etkilemiyorsa çalışmayı durdurmaz.

## 5. Durma koşulları

Codex yalnız şu durumlarda durur:

- Güvenli kapsam içi yöntemler tüketildiği hâlde çözülemeyen teknik engel.
- Kullanıcının işletme kararını gerektiren maddi belirsizlik.
- Onaylanan kapsamın dışına çıkma zorunluluğu.
- Mevcut kullanıcı çalışmasıyla çözülemeyen çakışma.
- Somut bulguyla desteklenen ciddi stok veya veri bütünlüğü riski.
- Revision conflict, exact overlap, negative/ghost stock, hedefi belirsiz mutation veya önceki yazma işleminin sonucunun doğrulanamaması.
- Geri dönüşü zor veya açıkça yetkilendirilmemiş yıkıcı işlem gereksinimi.

Basit test başarısızlığı, geçici komut hatası, uyarı veya ilgisiz eski hata tek başına durma sebebi değildir.

## 6. Kapsam ve çalışma ağacı güvenliği

- Plan dışında yeni ihtiyaç çıkarsa uygulanmaz; raporlanır ve yeni onay beklenir.
- Açık kullanıcı talebi olmadan `reset`, `clean`, `checkout`, `restore`, `stash`, `rebase` veya kullanıcı değişikliklerini kaybettirebilecek işlem yapılmaz.
- Mevcut kayıtlar, geçmiş ve audit kanıtları gereksiz yere değiştirilmez.

## 7. Metin ve doğrulama güvenliği

- Programın hiçbir yerinde encoding bozulması (mojibake) kabul edilmez.
- Türkçe karakterler `Ç Ğ İ Ö Ş Ü ç ğ ı ö ş ü` doğrudan UTF-8 olarak kullanılır; ASCII'ye zorlanmaz.
- Kaynak kodda veya kullanıcıya görünen program metninde yeni metin eklendiğinde ya da metin değiştirildiğinde `npm run check:text` çalıştırılır.
- Dokümantasyon, klasör oluşturma veya içeriksiz dosya işlemlerinde `check:text` zorunlu değildir.
- Bizim değişikliğimiz nedeniyle `check:text` başarısızsa bozuk metin düzeltilmeden iş `PASS` sayılmaz.
- Değişiklikler riskle orantılı test edilir.
- Sonuç dürüstçe `PASS`, `FAIL` veya `BLOCKED` olarak raporlanır.
