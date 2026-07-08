SIRILAND CMS 2026 - Module 1: Smart City ID

Bu modül sadece admin.html dosyasını günceller.
Canlı site dosyaları (index.html, script.js, properties.js, style.css) değişmez.

Eklenenler:
- City artık seçim alanı oldu.
- Chiang Mai -> CM-0001, CM-0002...
- Bangkok -> BKK-0001, BKK-0002...
- Phitsanulok -> PLK-0001, PLK-0002...
- Phichit -> PCT-0001, PCT-0002...
- Nakhon Sawan -> NKS-0001, NKS-0002...
- Aynı ID iki kez kaydedilemez.
- Bangkok için yanlış BK- kodu otomatik BKK- olur.

Kurulum:
1) ZIP'i aç.
2) İçindeki admin.html dosyasını GitHub proje klasörüne kopyala ve eski admin.html üzerine yaz.
3) GitHub Desktop Summary: CMS2026 module 1 smart city ID
4) Commit / Push.

Test:
- Admin'i aç.
- Yeni İlan'a bas.
- City olarak Bangkok seç.
- ID otomatik BKK-0003 gibi gelmeli.
- Phitsanulok seçince PLK-0001 gelmeli.
