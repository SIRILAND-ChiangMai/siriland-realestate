SIRILAND REAL ID ENGINE + LAND OVERRIDE FIX

Kök nedenler:
1. Admin file:// ile açıldığı için fetch('properties.js') gerçek dosyayı okuyamıyordu.
2. modules/property.js eski ID popup ve alan kurallarını tekrar yüklüyordu.

Düzeltildi:
- Eski modules/property.js kaldırıldı.
- Admin, Integrated Publish Manager içinde kayıtlı 01_CMS klasöründen gerçek properties.js dosyasını doğrudan okur.
- Mevcut tüm ilanların en yüksek ID numarası hesaplanır.
- Örnek: en yüksek Chiang Mai ID CM-0048 ise yeni ID CM-0049 olur.
- CM-0001 / CM-0002'ye geri dönmez.
- Şehir uyumsuzluğu popup'ı tamamen kaldırıldı.
- ID readonly ve otomatik.
- Land seçildiğinde oda/banyo/area/room/floor/building/parking alanları kesin olarak gizlenir ve temizlenir.
- Condo, House ve Commercial alanları kendi kurallarına göre açılır.

Kurulum:
1. admin.html, admin.js ve admin.css dosyalarını 01_CMS içindeki eski dosyaların üzerine kopyala.
2. Henüz GitHub'a kopyalama.
3. Chrome'da 01_CMS/admin.html aç ve Ctrl+Shift+R yap.
4. Integrated Publish Manager panelinde CMS Source hâlâ 01_CMS olarak seçili olmalı.
5. Sayfayı bir kez yenile.
6. Chiang Mai seç ve ID'yi kontrol et.
7. Land seç ve oda/banyo alanlarının kaybolduğunu kontrol et.
8. Test doğruysa Backup + Publish ile GitHub'a aktar.
