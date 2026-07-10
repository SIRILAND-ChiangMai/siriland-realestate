SIRILAND DIRECT SAVE TO CMS PRO

Yeni çalışma düzeni:
1. Admin'de ilan bilgilerini ve fotoğrafları gir.
2. "İlanı Kaydet + CMS Güncelle" butonuna bas.
3. Sistem doğrudan 01_CMS içine şunları yazar:
   - properties.js
   - properties.json
   - data/properties.json
   - crm/customers.json
   - yeni ilan fotoğrafları
4. Sonra üstteki "Backup + Publish" butonuna bas.
5. GitHub Desktop:
   - Commit to main
   - Push origin

Ek güvenlik:
- Her doğrudan kayıt öncesi mevcut properties.js dosyası:
  02_Backup/Autosave
  klasörüne yedeklenir.
- Admin içinde kayıt başarılı, CMS yazma başarısız olursa açık hata mesajı gösterilir.
- Chrome veya Edge gereklidir.

Kurulum:
admin.html, admin.js ve admin.css dosyalarını:
E:\SIRILAND_2030_Harddisk_Structure\01_CMS
içindeki eski dosyaların üzerine kopyala.

Aynı üç dosyayı GitHub repository içine de kopyala:
E:\SIRILAND_2030_Harddisk_Structure\09_GitHub\siriland-realestate

Sonra Chrome'da 01_CMS\admin.html aç ve Ctrl + Shift + R yap.
