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
let currentLang = localStorage.getItem("sirilandLang") || "en";

const i18n = {
  en: {
    brandSub:"Real Estate Thailand", navProperties:"Properties", navFinance:"Owner Finance", navContact:"Contact",
    heroEyebrow:"Luxury Real Estate Thailand", heroTitle:"Buy, Rent & Invest in Thailand Property", heroText:"Premium condos, houses, land and commercial properties with photo galleries, maps and direct contact.",
    viewListings:"View Listings", statProperties:"Properties", statPrime:"Prime Locations", statFinanceTitle:"Owner Finance", statFinance:"Selected deals",
    featured:"Featured Listings", propertiesTitle:"Properties for Sale & Rent", allCities:"All Cities", allTypes:"All Types", allDeals:"All Deals",
    financeEyebrow:"Owner Finance", financeTitle:"Flexible payment options for selected properties", financeText:"Ask us about owner finance, foreign quota, Airbnb allowed units and special buyer conditions.", askDetails:"Ask For Details",
    whyTitle:"Why SIRILAND?", why1:"Curated investment properties", why2:"Clear ID system for every listing", why3:"Map links and photo galleries", why4:"Thai, English, Turkish and Chinese support",
    contactEyebrow:"Contact", contactTitle:"Talk to SIRILAND", callWhatsApp:"Call / WhatsApp", call:"Call", map:"Map", copyLink:"Copy Link", noProperties:"No properties found.", search:"Search ID, project, room, area..."
  },
  th: {
    brandSub:"อสังหาริมทรัพย์ประเทศไทย", navProperties:"รายการทรัพย์", navFinance:"ผ่อนตรงเจ้าของ", navContact:"ติดต่อ",
    heroEyebrow:"อสังหาริมทรัพย์ระดับพรีเมียม", heroTitle:"ซื้อ เช่า และลงทุนอสังหาฯ ในไทย", heroText:"คอนโด บ้าน ที่ดิน และอาคารพาณิชย์ พร้อมรูป แผนที่ และติดต่อโดยตรง",
    viewListings:"ดูรายการทรัพย์", statProperties:"รายการทรัพย์", statPrime:"ทำเลศักยภาพ", statFinanceTitle:"ผ่อนตรง", statFinance:"ดีลพิเศษ",
    featured:"รายการแนะนำ", propertiesTitle:"อสังหาริมทรัพย์ขายและเช่า", allCities:"ทุกเมือง", allTypes:"ทุกประเภท", allDeals:"ทั้งหมด",
    financeEyebrow:"ผ่อนตรงเจ้าของ", financeTitle:"ตัวเลือกการชำระเงินยืดหยุ่น", financeText:"สอบถามเรื่องผ่อนตรง โควต้าต่างชาติ Airbnb และเงื่อนไขพิเศษ",
    askDetails:"สอบถามรายละเอียด", whyTitle:"ทำไมต้อง SIRILAND?", why1:"คัดเลือกทรัพย์ลงทุน", why2:"มีรหัสอ้างอิงทุกประกาศ", why3:"มีแผนที่และแกลเลอรี", why4:"บริการไทย อังกฤษ ตุรกี จีน",
    contactEyebrow:"ติดต่อ", contactTitle:"ติดต่อ SIRILAND", callWhatsApp:"โทร / WhatsApp", call:"โทร", map:"แผนที่", copyLink:"คัดลอกลิงก์", noProperties:"ไม่พบรายการ", search:"ค้นหา ID, โครงการ, ห้อง, พื้นที่..."
  },
  tr: {
    brandSub:"Tayland Emlak", navProperties:"İlanlar", navFinance:"Sahibinden Taksit", navContact:"İletişim",
    heroEyebrow:"Tayland Lüks Emlak", heroTitle:"Tayland’da Al, Kirala ve Yatırım Yap", heroText:"Fotoğraf galerileri, haritalar ve doğrudan iletişim ile condo, ev, arsa ve ticari gayrimenkuller.",
    viewListings:"İlanları Gör", statProperties:"İlan", statPrime:"Özel Lokasyonlar", statFinanceTitle:"Sahibinden Taksit", statFinance:"Seçili fırsatlar",
    featured:"Öne Çıkan İlanlar", propertiesTitle:"Satılık ve Kiralık İlanlar", allCities:"Tüm Şehirler", allTypes:"Tüm Tipler", allDeals:"Tüm İlanlar",
    financeEyebrow:"Sahibinden Taksit", financeTitle:"Seçili ilanlarda esnek ödeme seçenekleri", financeText:"Owner finance, foreign quota, Airbnb ve özel alıcı koşulları için bize yazın.",
    askDetails:"Detay Sor", whyTitle:"Neden SIRILAND?", why1:"Seçilmiş yatırım mülkleri", why2:"Her ilan için net ID sistemi", why3:"Harita linki ve foto galeri", why4:"Türkçe, Tayca, İngilizce ve Çince destek",
    contactEyebrow:"İletişim", contactTitle:"SIRILAND ile konuş", callWhatsApp:"Ara / WhatsApp", call:"Ara", map:"Harita", copyLink:"Link Kopyala", noProperties:"İlan bulunamadı.", search:"ID, proje, oda, alan ara..."
  },
  zh: {
    brandSub:"泰国房地产", navProperties:"房源", navFinance:"业主分期", navContact:"联系",
    heroEyebrow:"泰国高端房地产", heroTitle:"在泰国购买、租赁和投资房产", heroText:"公寓、住宅、土地和商业物业，带图库、地图和直接联系。",
    viewListings:"查看房源", statProperties:"房源", statPrime:"黄金地段", statFinanceTitle:"业主分期", statFinance:"精选优惠",
    featured:"精选房源", propertiesTitle:"出售与出租房源", allCities:"所有城市", allTypes:"所有类型", allDeals:"所有交易",
    financeEyebrow:"业主分期", financeTitle:"精选房源提供灵活付款", financeText:"欢迎咨询业主分期、外国人配额、Airbnb 和特别买家条件。",
    askDetails:"咨询详情", whyTitle:"为什么选择 SIRILAND?", why1:"精选投资物业", why2:"每个房源都有清晰编号", why3:"地图链接和照片图库", why4:"泰语、英语、土耳其语和中文服务",
    contactEyebrow:"联系", contactTitle:"联系 SIRILAND", callWhatsApp:"电话 / WhatsApp", call:"电话", map:"地图", copyLink:"复制链接", noProperties:"未找到房源。", search:"搜索编号、项目、房间、面积..."
  }
};

function t(key){ return (i18n[currentLang] && i18n[currentLang][key]) || i18n.en[key] || key; }
function uniqueValues(key){ return [...new Set(properties.map(p => p[key]).filter(Boolean))]; }
function fillFilter(select, values){ values.forEach(v => { const o=document.createElement("option"); o.value=v; o.textContent=v; select.appendChild(o); }); }

fillFilter(cityFilter, uniqueValues("city"));
fillFilter(typeFilter, uniqueValues("type"));
["Sale", "Rent", "Sale & Rent"].forEach(v => { const o=document.createElement("option"); o.value=v; o.textContent=v; dealFilter.appendChild(o); });

function applyLanguage(lang){
  currentLang = lang;
  localStorage.setItem("sirilandLang", lang);
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-lang]").forEach(btn => btn.classList.toggle("active", btn.dataset.lang === lang));
  cityFilter.options[0].textContent = t("allCities");
  typeFilter.options[0].textContent = t("allTypes");
  dealFilter.options[0].textContent = t("allDeals");
  searchInput.placeholder = t("search");
  render();
}

document.querySelectorAll("[data-lang]").forEach(btn => btn.addEventListener("click", () => applyLanguage(btn.dataset.lang)));

const propertyCount = document.getElementById("propertyCount");
if(propertyCount) propertyCount.textContent = properties.length + "+";

function descFor(p){
  if(p.descriptions && p.descriptions[currentLang]) return p.descriptions[currentLang];
  return p.description || "";
}

function cardTemplate(p, i){
  const img = p.images && p.images[0] ? `<img src="${p.images[0]}" alt="${p.title}" onerror="this.src='images/hero.png'">` : `<img src="images/hero.png" alt="${p.title}">`;
  const count = p.images ? p.images.length : 0;
  return `<article class="card" data-index="${i}">
    <div class="photo">${img}<span class="badge">${p.deal} • ${p.type}</span>${p.status && p.status !== "Available" ? `<span class="status">${p.status}</span>` : ""}${count ? `<span class="count">📷 ${count}</span>` : ""}</div>
    <div class="content">
      <div class="meta">${p.id || ""} • ${p.city} • ${p.type}</div>
      <h3>${p.title}</h3>
      <div class="price">${p.price}</div>
      <p class="desc">${descFor(p)}</p>
      <div class="chips"><span>${p.bedrooms || "-"}</span><span>${p.bathrooms || "-"}</span><span>${p.area || "-"}</span></div>
      <div class="actions"><a class="smallbtn goldbtn" href="tel:0920056640">${t("call")}</a><a class="smallbtn" href="https://line.me/R/ti/p/@realcreamthailand" target="_blank">LINE</a><a class="smallbtn whatsappbtn" href="https://wa.me/66920056640" target="_blank">WhatsApp</a>${p.map ? `<a class="smallbtn" href="${p.map}" target="_blank">${t("map")}</a>` : ""}</div>
    </div>
  </article>`;
}

function render(){
  const q = searchInput.value.toLowerCase();
  const filtered = properties.filter(p =>
    (cityFilter.value === "all" || p.city === cityFilter.value) &&
    (typeFilter.value === "all" || p.type === typeFilter.value) &&
    (dealFilter.value === "all" || p.deal === dealFilter.value) &&
    (`${p.id || ""} ${p.title} ${p.city} ${p.type} ${p.description || ""} ${p.room || ""} ${p.floor || ""} ${(p.highlights || []).join(" ")}`.toLowerCase().includes(q))
  );
  grid.innerHTML = filtered.map(p => cardTemplate(p, properties.indexOf(p))).join("") || `<p>${t("noProperties")}</p>`;
}

function updateModalImage(){
  const img = document.getElementById("modalImg");
  const counter = document.getElementById("modalCounter");
  if(!currentProperty || !currentProperty.images || !currentProperty.images.length){ img.src="images/hero.png"; counter.textContent="0 / 0"; return; }
  img.src = currentProperty.images[currentImageIndex];
  img.onerror = () => { img.src = "images/hero.png"; };
  counter.textContent = `${currentImageIndex + 1} / ${currentProperty.images.length}`;
  document.querySelectorAll("#modalThumbs img").forEach((thumb, i) => thumb.classList.toggle("active", i === currentImageIndex));
}

function openModal(p){
  currentProperty = p;
  currentImageIndex = 0;
  document.getElementById("modalMeta").textContent = `${p.id || ""} • ${p.city} • ${p.type} • ${p.deal}`;
  document.getElementById("modalTitle").textContent = p.title;
  document.getElementById("modalPrice").textContent = p.price;
  document.getElementById("modalDesc").textContent = descFor(p);
  document.getElementById("modalChips").innerHTML = (p.highlights && p.highlights.length ? p.highlights : [p.bedrooms, p.bathrooms, p.area, p.floor, p.room]).filter(Boolean).map(x => `<span>${x}</span>`).join("");
  const mapBtn = document.getElementById("modalMap");
  if(p.map){ mapBtn.href = p.map; mapBtn.style.display = "inline-block"; } else { mapBtn.style.display = "none"; }
  const thumbs = document.getElementById("modalThumbs");
  thumbs.innerHTML = (p.images || []).map((src, i) => `<img src="${src}" data-i="${i}" onerror="this.style.display='none'">`).join("");
  thumbs.querySelectorAll("img").forEach(img => img.addEventListener("click", () => { currentImageIndex = Number(img.dataset.i); updateModalImage(); }));
  updateModalImage();
  modal.classList.remove("hidden");
  history.replaceState(null, "", "#" + (p.id || ""));
}

grid.addEventListener("click", e => { const card = e.target.closest(".card"); if(!card || e.target.closest("a")) return; openModal(properties[Number(card.dataset.index)]); });
modalClose.addEventListener("click", () => modal.classList.add("hidden"));
modal.addEventListener("click", e => { if(e.target === modal) modal.classList.add("hidden"); });
document.getElementById("modalPrev").addEventListener("click", () => { if(!currentProperty?.images?.length) return; currentImageIndex = (currentImageIndex - 1 + currentProperty.images.length) % currentProperty.images.length; updateModalImage(); });
document.getElementById("modalNext").addEventListener("click", () => { if(!currentProperty?.images?.length) return; currentImageIndex = (currentImageIndex + 1) % currentProperty.images.length; updateModalImage(); });
document.getElementById("copyLink").addEventListener("click", async () => { try{ await navigator.clipboard.writeText(location.href); document.getElementById("copyLink").textContent = "Copied"; } catch(e){ alert(location.href); } });
[cityFilter, typeFilter, dealFilter, searchInput].forEach(el => el.addEventListener("input", render));
menuToggle.addEventListener("click", () => mainNav.classList.toggle("show"));
document.addEventListener("keydown", e => { if(modal.classList.contains("hidden")) return; if(e.key === "Escape") modal.classList.add("hidden"); if(e.key === "ArrowLeft") document.getElementById("modalPrev").click(); if(e.key === "ArrowRight") document.getElementById("modalNext").click(); });

document.querySelectorAll("[data-action]").forEach(btn => btn.addEventListener("click", () => {
  const action = btn.dataset.action;
  if(action === "show-properties") document.getElementById("properties").scrollIntoView({behavior:"smooth"});
  if(action === "filter-city") { cityFilter.value = btn.dataset.city || "all"; render(); document.getElementById("properties").scrollIntoView({behavior:"smooth"}); }
  if(action === "owner-finance") document.getElementById("finance").scrollIntoView({behavior:"smooth"});
  if(action === "open-languages") { document.querySelector(".lang-switch")?.classList.add("pulse"); document.querySelector(".lang-switch")?.scrollIntoView({behavior:"smooth", block:"center"}); setTimeout(()=>document.querySelector(".lang-switch")?.classList.remove("pulse"), 1200); }
}));

applyLanguage(currentLang);
if(location.hash){ const id = location.hash.slice(1); const p = properties.find(x => x.id === id); if(p) setTimeout(() => openModal(p), 200); }
