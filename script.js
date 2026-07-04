const translations = {
  en: {
    navProperties:"Properties", navFinance:"Owner Finance", navContact:"Contact",
    heroBadge:"Thailand Property Collection",
    heroTitle:"Luxury Real Estate, Investment & Owner Financing",
    heroText:"Buy, sell and rent houses, condos, land and commercial properties across Thailand.",
    viewListings:"View Listings",
    statLang:"Languages", statCities:"Service Areas", statFinance:"Selected Finance Plans", statContact:"Online Contact",
    featured:"Featured Listings", propertiesTitle:"Properties for Sale & Rent",
    financeBadge:"Owner Financing", financeTitle:"Easier Way to Own Property",
    financeText:"Selected assets support direct installment plans with the owner. Terms depend on each property.",
    financeBoxTitle:"Common Conditions",
    contactBadge:"Contact", contactTitle:"Talk to Kwan",
    contactText:"For buying, selling, renting, investing or property consultation."
  },
  tr: {
    navProperties:"İlanlar", navFinance:"Sahibinden Taksit", navContact:"İletişim",
    heroBadge:"Tayland Emlak Koleksiyonu",
    heroTitle:"Lüks Emlak, Yatırım ve Sahibinden Taksit",
    heroText:"Tayland genelinde ev, condo, arsa ve ticari mülk alım-satım-kiralama.",
    viewListings:"İlanları Gör",
    statLang:"Dil", statCities:"Hizmet Bölgesi", statFinance:"Seçili Taksit Planları", statContact:"Online İletişim",
    featured:"Öne Çıkan İlanlar", propertiesTitle:"Satılık ve Kiralık Mülkler",
    financeBadge:"Sahibinden Taksit", financeTitle:"Mülk Sahibi Olmak Daha Kolay",
    financeText:"Seçili mülklerde mülk sahibiyle doğrudan taksit imkânı. Şartlar mülke göre değişir.",
    financeBoxTitle:"Genel Şartlar",
    contactBadge:"İletişim", contactTitle:"Kwan ile Görüş",
    contactText:"Satın alma, satış, kiralama, yatırım ve danışmanlık için."
  },
  th: {
    navProperties:"ทรัพย์", navFinance:"ผ่อนตรง", navContact:"ติดต่อ",
    heroBadge:"อสังหาริมทรัพย์ประเทศไทย",
    heroTitle:"อสังหาฯ หรู การลงทุน และผ่อนตรงกับเจ้าของ",
    heroText:"ซื้อ ขาย เช่า บ้าน คอนโด ที่ดิน และอาคารพาณิชย์ทั่วประเทศไทย",
    viewListings:"ดูรายการทรัพย์",
    statLang:"ภาษา", statCities:"พื้นที่บริการ", statFinance:"แผนผ่อนพิเศษ", statContact:"ติดต่อออนไลน์",
    featured:"รายการแนะนำ", propertiesTitle:"ทรัพย์ขายและให้เช่า",
    financeBadge:"ผ่อนตรงกับเจ้าของ", financeTitle:"เป็นเจ้าของทรัพย์ได้ง่ายขึ้น",
    financeText:"ทรัพย์บางรายการสามารถผ่อนตรงกับเจ้าของได้ เงื่อนไขขึ้นอยู่กับแต่ละทรัพย์",
    financeBoxTitle:"เงื่อนไขทั่วไป",
    contactBadge:"ติดต่อ", contactTitle:"ติดต่อคุณขวัญ",
    contactText:"สำหรับซื้อ ขาย เช่า ลงทุน หรือปรึกษาเรื่องอสังหาริมทรัพย์"
  },
  zh: {
    navProperties:"房源", navFinance:"业主分期", navContact:"联系",
    heroBadge:"泰国房地产精选",
    heroTitle:"豪华房地产、投资与业主分期",
    heroText:"泰国房屋、公寓、土地和商业地产买卖出租服务。",
    viewListings:"查看房源",
    statLang:"语言", statCities:"服务区域", statFinance:"精选分期方案", statContact:"在线联系",
    featured:"精选房源", propertiesTitle:"出售与出租房源",
    financeBadge:"业主分期", financeTitle:"更轻松拥有房产",
    financeText:"部分房源支持与业主直接分期付款，具体条件以每个房源为准。",
    financeBoxTitle:"常见条件",
    contactBadge:"联系", contactTitle:"联系 Kwan",
    contactText:"买卖、出租、投资或房地产咨询。"
  }
};

let currentLang = "en";

function setLang(lang){
  currentLang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if(translations[lang][key]) el.textContent = translations[lang][key];
  });
}

function renderProperties(){
  const city = document.getElementById("cityFilter").value;
  const type = document.getElementById("typeFilter").value;
  const deal = document.getElementById("dealFilter").value;
  const search = document.getElementById("searchInput").value.toLowerCase();

  const filtered = properties.filter(p => {
    return (city === "all" || p.city === city) &&
           (type === "all" || p.type === type) &&
           (deal === "all" || p.deal === deal) &&
           (p.title.toLowerCase().includes(search) || p.description.toLowerCase().includes(search));
  });

  const grid = document.getElementById("propertyGrid");
  grid.innerHTML = filtered.map(p => `
    <article class="card">
      <div class="card-img">${p.label}</div>
      <div class="card-content">
        <div class="meta">${p.city} • ${p.type} • ${p.deal}</div>
        <h3>${p.title}</h3>
        <div class="price">${p.price}</div>
        <p>${p.description}</p>
        <div class="chips">
          <span>${p.size}</span>
          <span>${p.bedrooms}</span>
        </div>
        <div class="card-actions">
          <a class="mini-btn goldmini" href="${p.map}" target="_blank">Google Maps</a>
          <a class="mini-btn" href="https://line.me/R/ti/p/@realcreamthailand" target="_blank">LINE</a>
        </div>
      </div>
    </article>
  `).join("");
}

["cityFilter","typeFilter","dealFilter","searchInput"].forEach(id => {
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById(id).addEventListener("input", renderProperties);
  });
});

document.addEventListener("DOMContentLoaded", renderProperties);
