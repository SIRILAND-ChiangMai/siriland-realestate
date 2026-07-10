# SIRILAND Modular Admin — Installation

1. ZIP dosyasını çıkarın.
2. Proje köküne `admin.html`, `admin.css`, `admin.js` dosyalarını kopyalayın.
3. `modules` klasörünü olduğu gibi proje köküne kopyalayın.
4. Eski `admin.html` dosyasının yedeğini alın ve yenisiyle değiştirin.
5. GitHub Desktop: Commit + Push.
6. Tarayıcıda **Ctrl+F5** ile sert yenileme yapın.

## Düzeltilen kritik hata
`updateQualityScore()` içinde `type` değişkeni tanımlanmadan kullanılıyordu. Bu nedenle Kaydet, Kontrol Et ve ZIP Oluştur işlemleri duruyordu. Değişken artık kontrol listesinden önce tanımlanır.

## Dosya yapısı
- admin.html
- admin.css
- admin.js
- modules/dashboard.js
- modules/crm.js
- modules/export.js
- modules/property.js
- modules/language.js
- modules/image-manager.js
- modules/validator.js
- modules/quality.js
