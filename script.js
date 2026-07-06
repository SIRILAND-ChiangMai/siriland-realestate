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

const I18N = {
  en: {
    navProperties:"Properties", navFinance:"Owner Finance", navContact:"Contact",
    heroEyebrow:"Luxury Real Estate Thailand", heroTitle:"Buy, Rent & Invest in Thailand Property", heroText:"Premium condos, houses and investment properties with photo galleries, maps and direct contact.",
    viewListings:"View Listings", statProperties:"Properties", statPrime:"Prime Locations", ownerFinance:"Owner Finance", statDeals:"Selected deals", statLanguages:"4 Languages",
    featuredListings:"Featured Listings", propertiesTitle:"Properties for Sale & Rent", allCities:"All Cities", allTypes:"All Types", allDeals:"All Deals", searchPlaceholder:"Search ID, project, room, area...",
    financeTitle:"Flexible payment options for selected properties", financeText:"Ask us about owner finance, foreign quota, Airbnb allowed units and special buyer conditions.", askDetails:"Ask For Details", whySiriland:"Why SIRILAND?", why1:"Curated investment properties", why2:"Clear ID system for every listing", why3:"Map links and photo galleries", why4:"Thai, English, Turkish and Chinese support", contact:"Contact", contactTitle:"Talk to SIRILAND",
    call:"Call", map:"Map", copy:"Copy Link", copied:"Copied", noFound:"No properties found.", sale:"Sale", rent:"Rent", saleRent:"Sale & Rent", condo:"Condo", house:"House", land:"Land", commercial:"Commercial", available:"Available", reserved:"Reserved", rented:"Rented", sold:"Sold Out"
  },
  th: {
    navProperties:"รายการอสังหา", navFinance:"ผ่อนตรงเจ้าของ", navContact:"ติดต่อ",
    heroEyebrow:"อสังหาริมทรัพย์ระดับพรีเมียมในไทย", heroTitle:"ซื้อ เช่า และลงทุนอสังหาริมทรัพย์ในไทย", heroText:"คอนโด บ้าน และทรัพย์เพื่อการลงทุน พร้อมรูปภาพ แผนที่ และช่องทางติดต่อโดยตรง",
    viewListings:"ดูรายการทรัพย์", statProperties:"รายการทรัพย์", statPrime:"ทำเลเด่น", ownerFinance:"ผ่อนตรงเจ้าของ", statDeals:"ดีลคัดพิเศษ", statLanguages:"4 ภาษา",
    featuredListings:"รายการแนะนำ", propertiesTitle:"อสังหาริมทรัพย์สำหรับขายและเช่า", allCities:"ทุกจังหวัด", allTypes:"ทุกประเภท", allDeals:"ขายและเช่าทั้งหมด", searchPlaceholder:"ค้นหา ID, โครงการ, ห้อง, พื้นที่...",
    financeTitle:"ตัวเลือกการชำระเงินยืดหยุ่นสำหรับบางรายการ", financeText:"สอบถามเรื่องผ่อนตรง โควต้าต่างชาติ ทำ Airbnb ได้ และเงื่อนไขพิเศษสำหรับผู้ซื้อ", askDetails:"สอบถามรายละเอียด", whySiriland:"ทำไมต้อง SIRILAND?", why1:"คัดทรัพย์ลงทุนคุณภาพ", why2:"มีรหัสชัดเจนทุกประกาศ", why3:"มีแผนที่และแกลเลอรีรูป", why4:"รองรับไทย อังกฤษ ตุรกี และจีน", contact:"ติดต่อ", contactTitle:"ติดต่อ SIRILAND",
    call:"โทร", map:"แผนที่", copy:"คัดลอกลิงก์", copied:"คัดลอกแล้ว", noFound:"ไม่พบรายการทรัพย์", sale:"ขาย", rent:"เช่า", saleRent:"ขาย / เช่า", condo:"คอนโด", house:"บ้าน", land:"ที่ดิน", commercial:"อาคารพาณิชย์", available:"พร้อมขาย/เช่า", reserved:"จองแล้ว", rented:"ปล่อยเช่าแล้ว", sold:"ขายแล้ว"
  },
  tr: {
    navProperties:"İlanlar", navFinance:"Sahibinden Taksit", navContact:"İletişim",
    heroEyebrow:"Tayland Lüks Gayrimenkul", heroTitle:"Tayland'da Satın Al, Kirala ve Yatırım Yap", heroText:"Fotoğraf galerisi, harita ve doğrudan iletişim ile premium condo, ev ve yatırım fırsatları.",
    viewListings:"İlanları Gör", statProperties:"İlan", statPrime:"Öne Çıkan Lokasyonlar", ownerFinance:"Sahibinden Taksit", statDeals:"Seçili fırsatlar", statLanguages:"4 Dil",
    featuredListings:"Öne Çıkan İlanlar", propertiesTitle:"Satılık ve Kiralık İlanlar", allCities:"Tüm Şehirler", allTypes:"Tüm Tipler", allDeals:"Tüm İşlemler", searchPlaceholder:"ID, proje, oda, alan ara...",
    financeTitle:"Seçili ilanlarda esnek ödeme seçenekleri", financeText:"Sahibinden taksit, yabancı kotası, Airbnb uygunluğu ve özel alıcı şartları için bize sorun.", askDetails:"Detay Sor", whySiriland:"Neden SIRILAND?", why1:"Seçilmiş yatırım mülkleri", why2:"Her ilan için net ID sistemi", why3:"Harita linkleri ve fotoğraf galerileri", why4:"Tayca, İngilizce, Türkçe ve Çince destek", contact:"İletişim", contactTitle:"SIRILAND ile görüş",
    call:"Ara", map:"Harita", copy:"Link Kopyala", copied:"Kopyalandı", noFound:"İlan bulunamadı.", sale:"Satılık", rent:"Kiralık", saleRent:"Satılık / Kiralık", condo:"Condo", house:"Ev", land:"Arsa", commercial:"Ticari", available:"Aktif", reserved:"Rezerve", rented:"Kiralandı", sold:"Satıldı"
  },
  zh: {
    navProperties:"房产", navFinance:"业主分期", navContact:"联系",
    heroEyebrow:"泰国高端房地产", heroTitle:"在泰国购买、租赁和投资房产", heroText:"优质公寓、住宅和投资物业，配有图片、地图和直接联系方式。",
    viewListings:"查看房源", statProperties:"房源", statPrime:"优质位置", ownerFinance:"业主分期", statDeals:"精选交易", statLanguages:"4种语言",
    featuredListings:"精选房源", propertiesTitle:"出售与出租房产", allCities:"所有城市", allTypes:"所有类型", allDeals:"全部交易", searchPlaceholder:"搜索ID、项目、房间、面积...",
    financeTitle:"精选房源可提供灵活付款方案", financeText:"可咨询业主分期、外国人配额、Airbnb许可及特别购买条件。", askDetails:"咨询详情", whySiriland:"为什么选择 SIRILAND？", why1:"精选投资房产", why2:"每个房源都有清晰编号", why3:"地图链接和图片图库", why4:"支持泰语、英语、土耳其语和中文", contact:"联系", contactTitle:"联系 SIRILAND",
    call:"电话", map:"地图", copy:"复制链接", copied:"已复制", noFound:"未找到房源。", sale:"出售", rent:"出租", saleRent:"出售 / 出租", condo:"公寓", house:"住宅", land:"土地", commercial:"商业楼", available:"可用", reserved:"已预订", rented:"已出租", sold:"已售"
  }
};

function t(key){return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;}
function norm(v){return String(v || "").trim();}
function dealKey(v){v=norm(v).toLowerCase(); if(v==="sale")return "sale"; if(v==="rent")return "rent"; return "saleRent";}
function typeKey(v){v=norm(v).toLowerCase(); if(v.includes("house"))return "house"; if(v.includes("land"))return "land"; if(v.includes("commercial"))return "commercial"; return "condo";}
function statusKey(v){v=norm(v).toLowerCase(); if(v.includes("reserved"))return "reserved"; if(v.includes("rented"))return "rented"; if(v.includes("sold"))return "sold"; return "available";}
function displayDeal(v){return t(dealKey(v));}
function displayType(v){return t(typeKey(v));}
function displayStatus(v){return t(statusKey(v));}

function localizedText(p, field){
  if (p && p[field] && typeof p[field] === "object") return p[field][currentLang] || p[field].en || p[field].th || p[field].tr || p[field].zh || "";
  if (field === "description" && p && p.descriptions) return p.descriptions[currentLang] || p.descriptions.en || p.description || "";
  return (p && p[field]) || "";
}
function localTitle(p){return localizedText(p,"titles") || p.title || "";}
function localDesc(p){
  const d = localizedText(p,"description");
  if(d) return d;
  if(currentLang==="th") return `${p.title}. ${displayType(p.type)} ${displayDeal(p.deal)} ราคา ${p.price}. ${p.bedrooms||""} ${p.bathrooms||""} พื้นที่ ${p.area||""}.`;
  if(currentLang==="tr") return `${p.title}. ${displayDeal(p.deal)} ${displayType(p.type)}. Fiyat ${p.price}. ${p.bedrooms||""}, ${p.bathrooms||""}, alan ${p.area||""}.`;
  if(currentLang==="zh") return `${p.title}。${displayDeal(p.deal)} ${displayType(p.type)}，价格 ${p.price}。${p.bedrooms||""}，${p.bathrooms||""}，面积 ${p.area||""}。`;
  return p.description || `${p.title}. ${p.bedrooms||""} ${p.bathrooms||""}. Area ${p.area||""}.`;
}

function setLanguage(lang){
  currentLang = lang;
  localStorage.setItem("sirilandLang", lang);
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-lang]").forEach(btn => btn.classList.toggle("active", btn.dataset.lang === lang));
  resetFilterLabels();
  render();
  if(currentProperty) openModal(currentProperty, false);
}

function uniqueValues(key) {return [...new Set(properties.map(p => p[key]).filter(Boolean))];}
function resetSelect(select, firstLabelKey, values, labelFn=(x)=>x){
  const old = select.value || "all";
  select.innerHTML = `<option value="all">${t(firstLabelKey)}</option>`;
  values.forEach(v => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = labelFn(v);
    select.appendChild(o);
  });
  select.value = [...select.options].some(o=>o.value===old) ? old : "all";
}
function resetFilterLabels(){
  resetSelect(cityFilter, "allCities", uniqueValues("city"));
  resetSelect(typeFilter, "allTypes", uniqueValues("type"), displayType);
  resetSelect(dealFilter, "allDeals", ["Sale","Rent","Sale & Rent"], displayDeal);
}

function imageTag(p){
  const src = p.images && p.images[0] ? p.images[0] : "images/hero.png";
  return `<img src="${src}" alt="${localTitle(p)}" onerror="this.src='images/hero.png'">`;
}
function chipsForCard(p){
  return [p.bedrooms, p.bathrooms, p.area].filter(Boolean).map(x=>`<span>${x}</span>`).join("");
}
function actionButtons(p){
  return `<a class="smallbtn goldbtn" href="tel:0920056640">${t("call")}</a><a class="smallbtn" href="https://line.me/R/ti/p/@realcreamthailand" target="_blank">LINE</a>${p.map ? `<a class="smallbtn" href="${p.map}" target="_blank">${t("map")}</a>` : ""}`;
}
function cardTemplate(p, i) {
  const count = p.images ? p.images.length : 0;
  return `
    <article class="card" data-index="${i}">
      <div class="photo">
        ${imageTag(p)}
        <span class="badge">${displayDeal(p.deal)} • ${displayType(p.type)}</span>
        ${p.status && p.status !== "Available" ? `<span class="status">${displayStatus(p.status)}</span>` : ""}
        ${count ? `<span class="count">📷 ${count}</span>` : ""}
      </div>
      <div class="content">
        <div class="meta">${p.id || ""} • ${p.city} • ${displayType(p.type)}</div>
        <h3>${localTitle(p)}</h3>
        <div class="price">${p.price}</div>
        <p class="desc">${localDesc(p)}</p>
        <div class="chips">${chipsForCard(p)}</div>
        <div class="actions">${actionButtons(p)}</div>
      </div>
    </article>`;
}

function render() {
  const q = searchInput.value.toLowerCase();
  const filtered = properties.filter(p =>
    (cityFilter.value === "all" || p.city === cityFilter.value) &&
    (typeFilter.value === "all" || p.type === typeFilter.value) &&
    (dealFilter.value === "all" || p.deal === dealFilter.value) &&
    (`${p.id || ""} ${p.title || ""} ${localTitle(p)} ${p.city} ${p.type} ${p.deal} ${localDesc(p)} ${p.description || ""} ${p.room || ""} ${p.floor || ""}`.toLowerCase().includes(q))
  );
  grid.innerHTML = filtered.map(p => cardTemplate(p, properties.indexOf(p))).join("") || `<p>${t("noFound")}</p>`;
}

function updateModalImage() {
  const img = document.getElementById("modalImg");
  const counter = document.getElementById("modalCounter");
  if (!currentProperty || !currentProperty.images || !currentProperty.images.length) {
    img.src = "images/hero.png"; counter.textContent = "0 / 0"; return;
  }
  img.src = currentProperty.images[currentImageIndex];
  img.onerror = () => {img.src = "images/hero.png";};
  counter.textContent = `${currentImageIndex + 1} / ${currentProperty.images.length}`;
  document.querySelectorAll("#modalThumbs img").forEach((tt, i) => tt.classList.toggle("active", i === currentImageIndex));
}
function openModal(p, updateHash=true) {
  currentProperty = p; currentImageIndex = currentImageIndex || 0;
  document.getElementById("modalMeta").textContent = `${p.id || ""} • ${p.city} • ${displayType(p.type)} • ${displayDeal(p.deal)}`;
  document.getElementById("modalTitle").textContent = localTitle(p);
  document.getElementById("modalPrice").textContent = p.price;
  document.getElementById("modalDesc").textContent = localDesc(p);
  document.getElementById("modalChips").innerHTML = (p.highlights && p.highlights.length ? p.highlights : [p.bedrooms, p.bathrooms, p.area, p.floor, p.room]).filter(Boolean).map(x => `<span>${x}</span>`).join("");
  const mapBtn = document.getElementById("modalMap");
  if (p.map) {mapBtn.href = p.map; mapBtn.style.display = "inline-block"; mapBtn.textContent = t("map");} else {mapBtn.style.display = "none";}
  document.querySelector(".modal-actions .goldbtn").textContent = t("call");
  document.getElementById("copyLink").textContent = t("copy");
  const thumbs = document.getElementById("modalThumbs");
  thumbs.innerHTML = (p.images || []).map((src, i) => `<img src="${src}" data-i="${i}" onerror="this.style.display='none'">`).join("");
  thumbs.querySelectorAll("img").forEach(img => img.addEventListener("click", () => {currentImageIndex = Number(img.dataset.i); updateModalImage();}));
  updateModalImage(); modal.classList.remove("hidden"); if(updateHash) history.replaceState(null, "", "#" + (p.id || ""));
}

grid.addEventListener("click", e => {const card = e.target.closest(".card"); if (!card || e.target.closest("a")) return; currentImageIndex=0; openModal(properties[Number(card.dataset.index)]);});
modalClose.addEventListener("click", () => modal.classList.add("hidden"));
modal.addEventListener("click", e => {if (e.target === modal) modal.classList.add("hidden");});
document.getElementById("modalPrev").addEventListener("click", () => {if (!currentProperty?.images?.length) return; currentImageIndex = (currentImageIndex - 1 + currentProperty.images.length) % currentProperty.images.length; updateModalImage();});
document.getElementById("modalNext").addEventListener("click", () => {if (!currentProperty?.images?.length) return; currentImageIndex = (currentImageIndex + 1) % currentProperty.images.length; updateModalImage();});
document.getElementById("copyLink").addEventListener("click", async () => {try {await navigator.clipboard.writeText(location.href); document.getElementById("copyLink").textContent = t("copied");} catch (e) {alert(location.href);}});
[cityFilter, typeFilter, dealFilter, searchInput].forEach(el => el.addEventListener("input", render));
menuToggle.addEventListener("click", () => mainNav.classList.toggle("show"));
document.addEventListener("keydown", e => {if (modal.classList.contains("hidden")) return; if (e.key === "Escape") modal.classList.add("hidden"); if (e.key === "ArrowLeft") document.getElementById("modalPrev").click(); if (e.key === "ArrowRight") document.getElementById("modalNext").click();});

document.querySelectorAll("[data-lang]").forEach(btn => btn.addEventListener("click", () => setLanguage(btn.dataset.lang)));
document.querySelectorAll(".trust-item").forEach(btn => btn.addEventListener("click", () => {
  const action = btn.dataset.action;
  if(action === "showAll"){cityFilter.value="all"; typeFilter.value="all"; dealFilter.value="all"; document.getElementById("properties").scrollIntoView({behavior:"smooth"}); render();}
  if(action === "chiangMai"){cityFilter.value="Chiang Mai"; document.getElementById("properties").scrollIntoView({behavior:"smooth"}); render();}
  if(action === "ownerFinance"){document.getElementById("finance").scrollIntoView({behavior:"smooth"});}
  if(action === "languages"){document.querySelector(".lang-switch")?.scrollIntoView({behavior:"smooth", block:"center"});}
}));

const pc = document.getElementById("propertyCount"); if(pc) pc.textContent = properties.length + "+";
resetFilterLabels(); setLanguage(currentLang);
if (location.hash) {const id = location.hash.slice(1); const p = properties.find(x => x.id === id); if (p) setTimeout(() => {currentImageIndex=0; openModal(p);}, 200);}
