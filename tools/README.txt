SIRILAND INTEGRATED PUBLISH MANAGER PRO

Kurulum:
1. admin.html, admin.js ve admin.css dosyalarını 01_CMS ve GitHub repository içindeki eski dosyaların üzerine kopyalayın.
2. Admin sayfasını Google Chrome veya Microsoft Edge ile açın.
3. Integrated Publish Manager panelinde:
   - CMS Source: 01_CMS
   - GitHub Repository: 09_GitHub/siriland-realestate
   - Backup Folder: 02_Backup
4. Test Paths
5. Backup + Publish
6. GitHub Desktop:
   - Ctrl+V
   - Commit to main
   - Push origin

Neden Chrome / Edge?
Tarayıcının klasöre doğrudan yazma özelliği File System Access API kullanır.
Firefox bu özelliği desteklemez.

Güvenlik:
- GitHub repository önce tamamen Backup klasörüne kopyalanır.
- Yalnızca değişen/yeni CMS dosyaları GitHub klasörüne yazılır.
- .git, node_modules ve Publish_Manager klasörleri kopyalanmaz.
- Publish raporu Backup/PublishReports içine kaydedilir.
