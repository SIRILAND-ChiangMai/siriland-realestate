const grid = document.getElementById("propertyGrid");
const cityFilter = document.getElementById("cityFilter");
const typeFilter = document.getElementById("typeFilter");
const dealFilter = document.getElementById("dealFilter");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("propertyModal");
const modalClose = document.getElementById("modalClose");
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

let currentProperty = null;
let currentImageIndex = 0;

function uniqueValues(key) {
  return [...new Set(properties.map(p => p[key]).filter(Boolean))];
}

function fillFilter(select, values) {
  values.forEach(v => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    select.appendChild(o);
  });
}

fillFilter(cityFilter, uniqueValues("city"));
fillFilter(typeFilter, uniqueValues("type"));

["Sale", "Rent", "Sale & Rent"].forEach(v => {
  const o = document.createElement("option");
  o.value = v;
  o.textContent = v;
  dealFilter.appendChild(o);
});

const propertyCountEl = document.getElementById("propertyCount");
if (propertyCountEl) propertyCountEl.textContent = properties.length + "+";

function cardTemplate(p, i) {
  const img = p.images && p.images[0]
    ? `<img src="${p.images[0]}" alt="${p.title}" onerror="this.src='images/hero.png'">`
    : `<img src="images/hero.png" alt="${p.title}">`;

  const count = p.images ? p.images.length : 0;

  return `
    <article class="card" data-index="${i}">
      <div class="photo">
        ${img}
        <span class="badge">${p.deal} • ${p.type}</span>
        ${p.status && p.status !== "Available" ? `<span class="status">${p.status}</span>` : ""}
        ${count ? `<span class="count">📷 ${count}</span>` : ""}
      </div>
      <div class="content">
        <div class="meta">${p.id || ""} • ${p.city} • ${p.type}</div>
        <h3>${p.title}</h3>
        <div class="price">${p.price}</div>
        <p class="desc">${p.description || ""}</p>
        <div class="chips">
          <span>${p.bedrooms || "-"}</span>
          <span>${p.bathrooms || "-"}</span>
          <span>${p.area || "-"}</span>
        </div>
        <div class="actions">
          <a class="smallbtn goldbtn" href="tel:0920056640" data-i18n-dynamic="call">Call</a>
          <a class="smallbtn" href="https://line.me/R/ti/p/@realcreamthailand" target="_blank">LINE</a>
          ${p.map ? `<a class="smallbtn" href="${p.map}" target="_blank" data-i18n-dynamic="map">Map</a>` : ""}
        </div>
      </div>
    </article>
  `;
}

function render() {
  const q = searchInput.value.toLowerCase();

  const filtered = properties.filter(p =>
    (cityFilter.value === "all" || p.city === cityFilter.value) &&
    (typeFilter.value === "all" || p.type === typeFilter.value) &&
    (dealFilter.value === "all" || p.deal === dealFilter.value) &&
    (`${p.id || ""} ${p.title} ${p.city} ${p.type} ${p.description || ""} ${p.room || ""} ${p.floor || ""}`
      .toLowerCase()
      .includes(q))
  );

  grid.innerHTML = filtered.map(p => cardTemplate(p, properties.indexOf(p))).join("") || "<p>No properties found.</p>";
}

function updateModalImage() {
  const img = document.getElementById("modalImg");
  const counter = document.getElementById("modalCounter");

  if (!currentProperty || !currentProperty.images || !currentProperty.images.length) {
    img.src = "images/hero.png";
    counter.textContent = "0 / 0";
    return;
  }

  img.src = currentProperty.images[currentImageIndex];
  img.onerror = () => {
    img.src = "images/hero.png";
  };

  counter.textContent = `${currentImageIndex + 1} / ${currentProperty.images.length}`;

  document.querySelectorAll("#modalThumbs img").forEach((t, i) => {
    t.classList.toggle("active", i === currentImageIndex);
  });
}

function openModal(p) {
  currentProperty = p;
  currentImageIndex = 0;

  document.getElementById("modalMeta").textContent = `${p.id || ""} • ${p.city} • ${p.type} • ${p.deal}`;
  document.getElementById("modalTitle").textContent = p.title;
  document.getElementById("modalPrice").textContent = p.price;
  document.getElementById("modalDesc").textContent = p.description || "";

  document.getElementById("modalChips").innerHTML =
    (p.highlights && p.highlights.length ? p.highlights : [p.bedrooms, p.bathrooms, p.area, p.floor, p.room])
      .filter(Boolean)
      .map(x => `<span>${x}</span>`)
      .join("");

  const mapBtn = document.getElementById("modalMap");
  if (p.map) {
    mapBtn.href = p.map;
    mapBtn.style.display = "inline-block";
  } else {
    mapBtn.style.display = "none";
  }

  const thumbs = document.getElementById("modalThumbs");
  thumbs.innerHTML = (p.images || [])
    .map((src, i) => `<img src="${src}" data-i="${i}" onerror="this.style.display='none'">`)
    .join("");

  thumbs.querySelectorAll("img").forEach(img => {
    img.addEventListener("click", () => {
      currentImageIndex = Number(img.dataset.i);
      updateModalImage();
    });
  });

  updateModalImage();
  modal.classList.remove("hidden");
  history.replaceState(null, "", "#" + (p.id || ""));
}

grid.addEventListener("click", e => {
  const card = e.target.closest(".card");
  if (!card || e.target.closest("a")) return;
  openModal(properties[Number(card.dataset.index)]);
});

modalClose.addEventListener("click", () => modal.classList.add("hidden"));

modal.addEventListener("click", e => {
  if (e.target === modal) modal.classList.add("hidden");
});

document.getElementById("modalPrev").addEventListener("click", () => {
  if (!currentProperty?.images?.length) return;
  currentImageIndex = (currentImageIndex - 1 + currentProperty.images.length) % currentProperty.images.length;
  updateModalImage();
});

document.getElementById("modalNext").addEventListener("click", () => {
  if (!currentProperty?.images?.length) return;
  currentImageIndex = (currentImageIndex + 1) % currentProperty.images.length;
  updateModalImage();
});

document.getElementById("copyLink").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    document.getElementById("copyLink").textContent = "Copied";
  } catch (e) {
    alert(location.href);
  }
});

[cityFilter, typeFilter, dealFilter, searchInput].forEach(el => {
  el.addEventListener("input", render);
});

menuToggle.addEventListener("click", () => mainNav.classList.toggle("show"));

document.addEventListener("keydown", e => {
  if (modal.classList.contains("hidden")) return;
  if (e.key === "Escape") modal.classList.add("hidden");
  if (e.key === "ArrowLeft") document.getElementById("modalPrev").click();
  if (e.key === "ArrowRight") document.getElementById("modalNext").click();
});

render();

if (location.hash) {
  const id = location.hash.slice(1);
  const p = properties.find(x => x.id === id);
  if (p) setTimeout(() => openModal(p), 200);
}


/* Language + stat-card controls */
const I18N = {
  en: {
    navProperties:"Properties", navFinance:"Owner Finance", navContact:"Contact", navLine:"LINE",
    heroEyebrow:"Luxury Real Estate Thailand", heroTitle:"Buy, Rent & Invest in Chiang Mai Property", heroText:"Premium condos, houses and investment properties with photo galleries, maps and direct contact.",
    viewListings:"View Listings", lineOfficial:"LINE Official", statProperties:"Properties", statLocations:"Prime Locations", statFinanceTitle:"Owner Finance", statFinance:"Selected deals", statLangTitle:"4 Languages",
    featured:"Featured Listings", propertiesTitle:"Properties for Sale & Rent", allCities:"All Cities", allTypes:"All Types", allDeals:"All Deals", searchPlaceholder:"Search ID, project, room, area...",
    financeEyebrow:"Owner Finance", financeTitle:"Flexible payment options for selected properties", financeText:"Ask us about owner finance, foreign quota, Airbnb allowed units and special buyer conditions.", askDetails:"Ask For Details", whyTitle:"Why SIRILAND?",
    contactEyebrow:"Contact", contactTitle:"Talk to SIRILAND", footer:"© SIRILAND Real Estate Thailand", call:"Call", map:"Map", copy:"Copy Link"
  },
  th: {
    navProperties:"รายการอสังหา", navFinance:"ผ่อนตรงเจ้าของ", navContact:"ติดต่อ", navLine:"LINE",
    heroEyebrow:"อสังหาริมทรัพย์พรีเมียมในไทย", heroTitle:"ซื้อ เช่า ลงทุน อสังหาฯ เชียงใหม่", heroText:"คอนโด บ้าน และทรัพย์ลงทุน พร้อมแกลเลอรีรูป แผนที่ และติดต่อโดยตรง",
    viewListings:"ดูรายการทรัพย์", lineOfficial:"LINE Official", statProperties:"รายการทรัพย์", statLocations:"ทำเลเด่น", statFinanceTitle:"ผ่อนตรง", statFinance:"ดีลพิเศษ", statLangTitle:"4 ภาษา",
    featured:"รายการแนะนำ", propertiesTitle:"รายการขายและเช่า", allCities:"ทุกเมือง", allTypes:"ทุกประเภท", allDeals:"ทั้งหมด", searchPlaceholder:"ค้นหา ID โครงการ ห้อง พื้นที่...",
    financeEyebrow:"ผ่อนตรงเจ้าของ", financeTitle:"ตัวเลือกชำระเงินยืดหยุ่นสำหรับบางรายการ", financeText:"สอบถามเรื่องผ่อนตรง โควต้าต่างชาติ Airbnb และเงื่อนไขพิเศษได้", askDetails:"สอบถามรายละเอียด", whyTitle:"ทำไมต้อง SIRILAND?",
    contactEyebrow:"ติดต่อ", contactTitle:"ติดต่อ SIRILAND", footer:"© SIRILAND Real Estate Thailand", call:"โทร", map:"แผนที่", copy:"คัดลอกลิงก์"
  },
  tr: {
    navProperties:"İlanlar", navFinance:"Sahibinden Taksit", navContact:"İletişim", navLine:"LINE",
    heroEyebrow:"Tayland Premium Emlak", heroTitle:"Chiang Mai'de Satın Al, Kirala ve Yatırım Yap", heroText:"Fotoğraf galerisi, harita ve direkt iletişimli condo, ev ve yatırım ilanları.",
    viewListings:"İlanları Gör", lineOfficial:"LINE Official", statProperties:"İlan", statLocations:"Özel Lokasyonlar", statFinanceTitle:"Taksitli Satış", statFinance:"Seçili fırsatlar", statLangTitle:"4 Dil",
    featured:"Öne Çıkan İlanlar", propertiesTitle:"Satılık ve Kiralık İlanlar", allCities:"Tüm Şehirler", allTypes:"Tüm Tipler", allDeals:"Tüm İlanlar", searchPlaceholder:"ID, proje, oda, alan ara...",
    financeEyebrow:"Sahibinden Taksit", financeTitle:"Seçili ilanlarda esnek ödeme seçenekleri", financeText:"Owner finance, foreign quota, Airbnb izinli ilanlar ve özel koşullar için bize yazın.", askDetails:"Detay Sor", whyTitle:"Neden SIRILAND?",
    contactEyebrow:"İletişim", contactTitle:"SIRILAND ile İletişim", footer:"© SIRILAND Real Estate Thailand", call:"Ara", map:"Harita", copy:"Linki Kopyala"
  },
  zh: {
    navProperties:"房产", navFinance:"业主分期", navContact:"联系", navLine:"LINE",
    heroEyebrow:"泰国高端房产", heroTitle:"清迈买房、租房与投资", heroText:"公寓、别墅和投资房源，含图片、地图和直接联系。",
    viewListings:"查看房源", lineOfficial:"LINE Official", statProperties:"房源", statLocations:"优质地段", statFinanceTitle:"业主分期", statFinance:"精选优惠", statLangTitle:"4种语言",
    featured:"精选房源", propertiesTitle:"出售与出租房源", allCities:"全部城市", allTypes:"全部类型", allDeals:"全部交易", searchPlaceholder:"搜索ID、项目、房号、面积...",
    financeEyebrow:"业主分期", financeTitle:"精选房源可提供灵活付款", financeText:"欢迎咨询业主分期、外国人配额、Airbnb许可及特别条件。", askDetails:"咨询详情", whyTitle:"为什么选择 SIRILAND?",
    contactEyebrow:"联系", contactTitle:"联系 SIRILAND", footer:"© SIRILAND Real Estate Thailand", call:"电话", map:"地图", copy:"复制链接"
  }
};
function setLanguage(lang){
  const dict = I18N[lang] || I18N.en;
  document.documentElement.lang = lang;
  localStorage.setItem('siriland_lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el=>{ const k=el.dataset.i18n; if(dict[k]) el.textContent=dict[k]; });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{ const k=el.dataset.i18nPlaceholder; if(dict[k]) el.placeholder=dict[k]; });
  document.querySelectorAll('.lang-switch button').forEach(b=>b.classList.toggle('active', b.dataset.lang===lang));
  const copyBtn=document.getElementById('copyLink'); if(copyBtn) copyBtn.textContent=dict.copy;
  document.querySelectorAll('[data-i18n-dynamic="call"]').forEach(el=>el.textContent=dict.call);
  document.querySelectorAll('[data-i18n-dynamic="map"]').forEach(el=>el.textContent=dict.map);
}
document.querySelectorAll('.lang-switch button').forEach(btn=>btn.addEventListener('click',()=>setLanguage(btn.dataset.lang)));
document.querySelectorAll('.stat-card').forEach(card=>card.addEventListener('click',()=>{
  const action=card.dataset.action;
  if(action==='show-properties'){ document.getElementById('properties')?.scrollIntoView({behavior:'smooth'}); }
  if(action==='filter-chiangmai'){ cityFilter.value='Chiang Mai'; render(); document.getElementById('properties')?.scrollIntoView({behavior:'smooth'}); }
  if(action==='show-finance'){ document.getElementById('finance')?.scrollIntoView({behavior:'smooth'}); }
  if(action==='show-languages'){ document.querySelector('.lang-switch')?.scrollIntoView({behavior:'smooth',block:'center'}); }
}));
setLanguage(localStorage.getItem('siriland_lang') || 'en');
