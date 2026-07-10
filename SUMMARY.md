# Build 2026.07.10.09

- Owner Finance bölümü yalnızca `ownerFinance` veya `installment` alanında gerçek veri bulunan ilanları gösterir.
- Free Transfer, açıklama, başlık veya başka bir metin artık ilanı yanlışlıkla taksit bölümüne taşımaz.
- Bozuk Floor ve Room değerleri website detayında gösterilmez.
- Room yalnızca `property.room` alanından alınır.
- Admin validator `Please update`, `pdate`, `katate`, `undefined` gibi bozuk Floor/Room verilerini tespit eder.
- Bozuk Floor/Room bulunan ilanlarda ZIP export durdurulur ve hatalı ilan ID'si raporda gösterilir.
- Ana sayfa ve ilan kartlarındaki oda, banyo, alan ve kat bilgileri ikonlu gösterilir.
