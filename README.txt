SIRILAND FINAL ID + DROPDOWN + LAND FORM FIX

Düzeltildi:
- ID artık properties.js tamamen yüklenmeden oluşturulmaz.
- Chiang Mai seçildiğinde mevcut en yüksek CM ID bulunur ve sıradaki numara gelir.
- CM-0001'e geri dönme sorunu giderildi.
- Şehir kodu uyumsuzluğu popup'ı kaldırıldı.
- ID readonly oldu; yanlışlıkla elle değiştirilemez.
- Kullanılmış en yüksek ID tarayıcıda ayrıca tutulur.

Dropdown yapılan alanlar:
- City
- Property Type
- Deal
- Status
- Bedrooms
- Bathrooms
- Floor
- Parking

Room / Unit:
- Öneri listeli alan olarak kaldı; özel oda numarası yazılabilir.

Land seçildiğinde tamamen gizlenen ve temizlenen alanlar:
- Bedrooms
- Bathrooms
- Room
- Floor
- Parking
- Building Area
- Internal Area

Land için kalan ana alanlar:
- Price
- Map
- Land Size
- Land Area
- Title Deed
- Road Access
- Frontage
- Zoning
- Utilities

Kurulum:
1. admin.html, admin.js ve admin.css dosyalarını 01_CMS içindeki eski dosyaların üzerine kopyala.
2. Aynı üç dosyayı GitHub repository içine de kopyala.
3. Chrome'da 01_CMS\admin.html aç.
4. Ctrl + Shift + R yap.
