SIRILAND SPRINT 5.0 — CORE REFACTOR PHASE 1

Bu sürüm güvenli temel geçişidir. Canlı website bozulmaz.

Eklenen mimari:
- admin-modules/core-utils.js
- admin-modules/property-store.js
- admin-modules/incremental-publish.js
- admin-modules/core-refactor-ui.js
- properties/<ID>.json üretimi
- properties-index.json üretimi
- properties-manifest.json üretimi
- Sadece değişen dosyaları GitHub'a yazan incremental publish
- Sadece değişen dosyaları yedekleyen hızlı Incremental backup
- Deletion manifest
- Mimari durum ve değişiklik paneli

Önemli:
- Website şimdilik properties.js kullanmaya devam eder.
- Bu yüzden canlı siteye risk yoktur.
- Yeni JSON mimarisi paralel olarak hazırlanır.
- İlk incremental publish tüm ilan JSON dosyalarını yeni dosya olarak yazacaktır.
- Sonraki publish işlemlerinde yalnızca değişen ilanlar yazılır.

Kurulum:
1. ZIP içindeki admin.html, admin.js, admin.css ve admin-modules klasörünü:
   E:\SIRILAND_2030_Harddisk_Structure\01_CMS
   içine kopyala.
2. Chrome'da 01_CMS\admin.html aç.
3. Ctrl + Shift + R yap.
4. Core Refactor Phase 1 panelinde:
   - Değişiklikleri Analiz Et
   - Property JSON Dosyalarını Oluştur
   - Sadece Değişenleri Publish Et
5. İlk test doğruysa GitHub Desktop'ta Commit + Push yap.

GitHub Summary:
Sprint 5.0 Core Refactor Phase 1
