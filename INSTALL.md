# SIRILAND Admin Build 2026.07.10.12 — Cache Bust Hotfix

Bu paketin amacı GitHub Pages'in eski admin.html/admin.js dosyasını göstermesini engellemektir.

## Kurulum
1. ZIP'i çıkarın.
2. `admin.html`, `admin.css`, `admin.js` ve `modules` klasörünü proje köküne kopyalayın.
3. Aynı isimli dosyaların üzerine yazın.
4. GitHub Desktop'ta tüm değişiklikleri Commit + Push yapın.
5. GitHub Pages güncellemesi için 1-3 dakika bekleyin.
6. Admin sayfasını şu şekilde açın:
   `admin.html?v=2026071012`
7. Ctrl + Shift + R yapın.

## Doğru sürümü kontrol etme
Sayfanın başlığında:
`SIRILAND CMS PRO 2030 — Build 2026.07.10.12`
yazmalı.

Console'da:
`SIRILAND Admin Build 2026.07.10.12 loaded`
yazmalı.

Eski hatalarda dosya adı `admin.html:...` görünüyordu.
Yeni modüler sürümde hata olursa `admin.js:...` görünür.
