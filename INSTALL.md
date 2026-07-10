# SIRILAND Admin Build 2026.07.10.11 — Delete & Export Hotfix

1. ZIP'i çıkarın.
2. İçindeki `admin.html`, `admin.css`, `admin.js` ve `modules` klasörünü proje köküne kopyalayın.
3. Aynı isimli dosyaların üzerine yazın.
4. GitHub Desktop'ta Commit + Push yapın.
5. Tarayıcıda Ctrl + F5 yapın.

Bu hotfix:
- CM-0033 gibi bir ilan silindikten sonra ZIP export'unu eski bozuk Floor/Room alanları yüzünden durdurmaz.
- Eski ilanlardaki bozuk Floor/Room değerlerini export sırasında otomatik temizler.
- Duplicate ID ve boş ID gibi kritik hatalar yine export'u durdurur.
