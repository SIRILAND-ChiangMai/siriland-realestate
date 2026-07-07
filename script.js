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
let currentLang = localStorage.getItem("siriland_lang") || "en";

const I18N = {
  en: {
    navProperties:"Properties", navFinance:"Owner Finance", navContact:"Contact",
    heroEyebrow:"Luxury Real Estate Thailand", heroTitle:"Buy, Rent & Invest in Thailand Property", heroText:"Premium condos, houses and investment properties with photo galleries, maps and direct contact.",
    viewListings:"View Listings", lineOfficial:"LINE Official", statProperties:"Properties", statLocations:"Prime Locations", statDeals:"Selected deals", stat4Lang:"4 Languages", statLanguages:"TH / EN / TR / 中文",
    featured:"Featured Listings", propertiesTitle:"Properties for Sale & Rent", allCities:"All Cities", allTypes:"All Types", allDeals:"All Deals", searchPlaceholder:"Search ID, project, room, area...",
    financeEyebrow:"Owner Finance", financeTitle:"Flexible payment options for selected properties", financeText:"Ask us about owner finance, foreign quota, Airbnb allowed units and special buyer conditions.", askDetails:"Ask For Details",
    whyTitle:"Why SIRILAND?", why1:"Curated investment properties", why2:"Clear ID system for every listing", why3:"Map links and photo galleries", why4:"Thai, English, Turkish and Chinese support",
    contactEyebrow:"Contact", contactTitle:"Talk to SIRILAND", callWhatsapp:"Call / WhatsApp", call:"Call", map:"Map", copy:"Copy Link", noFound:"No properties found.", copied:"Copied", sale:"Sale", rent:"Rent", saleRent:"Sale & Rent"
  },
  th: {
    navProperties:"อสังหาริมทรัพย์", navFinance:"ผ่อนตรงเจ้าของ", navContact:"ติดต่อเรา",
    heroEyebrow:"อสังหาริมทรัพย์ระดับพรีเมียมในประเทศไทย", heroTitle:"ซื้อ เช่า และลงทุนอสังหาริมทรัพย์ในไทย", heroText:"คอนโด บ้าน และทรัพย์ลงทุน พร้อมแกลเลอรีรูปภาพ แผนที่ และช่องทางติดต่อโดยตรง",
    viewListings:"ดูรายการทรัพย์", lineOfficial:"LINE Official", statProperties:"รายการทรัพย์", statLocations:"ทำเลเด่น", statDeals:"ดีลพิเศษ", stat4Lang:"รองรับ 4 ภาษา", statLanguages:"ไทย / อังกฤษ / ตุรกี / จีน",
    featured:"รายการแนะนำ", propertiesTitle:"อสังหาริมทรัพย์สำหรับขายและเช่า", allCities:"ทุกเมือง", allTypes:"ทุกประเภท", allDeals:"ขายและเช่าทั้งหมด", searchPlaceholder:"ค้นหา ID, โครงการ, ห้อง, พื้นที่...",
    financeEyebrow:"ผ่อนตรงเจ้าของ", financeTitle:"ตัวเลือกการชำระเงินยืดหยุ่นสำหรับทรัพย์บางรายการ", financeText:"สอบถามเราเกี่ยวกับผ่อนตรงเจ้าของ โควต้าต่างชาติ ปล่อยเช่ารายวัน และเงื่อนไขพิเศษสำหรับผู้ซื้อ", askDetails:"สอบถามรายละเอียด",
    whyTitle:"ทำไมต้อง SIRILAND?", why1:"คัดสรรทรัพย์เพื่อการลงทุน", why2:"มีรหัส ID ชัดเจนทุกประกาศ", why3:"มีแผนที่และแกลเลอรีรูปภาพ", why4:"รองรับภาษาไทย อังกฤษ ตุรกี และจีน",
    contactEyebrow:"ติดต่อ", contactTitle:"ติดต่อ SIRILAND", callWhatsapp:"โทร / WhatsApp", call:"โทร", map:"แผนที่", copy:"คัดลอกลิงก์", noFound:"ไม่พบรายการทรัพย์", copied:"คัดลอกแล้ว", sale:"ขาย", rent:"เช่า", saleRent:"ขาย / เช่า"
  },
  tr: {
    navProperties:"İlanlar", navFinance:"Sahibinden Taksit", navContact:"İletişim",
    heroEyebrow:"Tayland Lüks Gayrimenkul", heroTitle:"Tayland’da Satın Al, Kirala ve Yatırım Yap", heroText:"Fotoğraf galerisi, harita ve doğrudan iletişimle premium condo, ev ve yatırım fırsatları.",
    viewListings:"İlanları Gör", lineOfficial:"LINE Official", statProperties:"İlan", statLocations:"Prime Lokasyonlar", statDeals:"Seçili Fırsatlar", stat4Lang:"4 Dil", statLanguages:"Tayca / İngilizce / Türkçe / Çince",
    featured:"Öne Çıkan İlanlar", propertiesTitle:"Satılık ve Kiralık İlanlar", allCities:"Tüm Şehirler", allTypes:"Tüm Tipler", allDeals:"Tüm İlanlar", searchPlaceholder:"ID, proje, oda, alan ara...",
    financeEyebrow:"Sahibinden Taksit", financeTitle:"Seçili ilanlarda esnek ödeme seçenekleri", financeText:"Sahibinden ödeme, foreign quota, Airbnb uygunluğu ve özel alıcı şartları için bize danışın.", askDetails:"Detay Sor",
    whyTitle:"Neden SIRILAND?", why1:"Seçilmiş yatırım mülkleri", why2:"Her ilan için net ID sistemi", why3:"Harita linkleri ve fotoğraf galerileri", why4:"Tayca, İngilizce, Türkçe ve Çince destek",
    contactEyebrow:"İletişim", contactTitle:"SIRILAND ile iletişime geç", callWhatsapp:"Ara / WhatsApp", call:"Ara", map:"Harita", copy:"Link Kopyala", noFound:"İlan bulunamadı.", copied:"Kopyalandı", sale:"Satılık", rent:"Kiralık", saleRent:"Satılık / Kiralık"
  },
  zh: {
    navProperties:"房产", navFinance:"业主分期", navContact:"联系我们",
    heroEyebrow:"泰国高端房地产", heroTitle:"在泰国购买、租赁和投资房产", heroText:"优质公寓、住宅和投资房源，配有图片、地图和直接联系方式。",
    viewListings:"查看房源", lineOfficial:"LINE 官方", statProperties:"房源", statLocations:"黄金地段", statDeals:"精选优惠", stat4Lang:"四种语言", statLanguages:"泰语 / 英语 / 土耳其语 / 中文",
    featured:"精选房源", propertiesTitle:"出售与出租房产", allCities:"所有城市", allTypes:"所有类型", allDeals:"全部交易", searchPlaceholder:"搜索编号、项目、房间、面积...",
    financeEyebrow:"业主分期付款", financeTitle:"精选房源提供灵活付款方式", financeText:"欢迎咨询业主分期、外国人配额、Airbnb许可和特别购房条件。", askDetails:"咨询详情",
    whyTitle:"为什么选择 SIRILAND?", why1:"精选投资房产", why2:"每个房源都有清晰编号", why3:"地图链接和图片图库", why4:"支持泰语、英语、土耳其语和中文",
    contactEyebrow:"联系", contactTitle:"联系 SIRILAND", callWhatsapp:"电话 / WhatsApp", call:"电话", map:"地图", copy:"复制链接", noFound:"未找到房源。", copied:"已复制", sale:"出售", rent:"出租", saleRent:"出售 / 出租"
  }
};

function t(key){ return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key; }
function trDeal(v){ if(v === "Sale") return t("sale"); if(v === "Rent") return t("rent"); if(v === "Sale & Rent") return t("saleRent"); return v || ""; }
function getText(p, key){
  if(!p) return "";
  const plural = key + "s";
  if(p[plural] && typeof p[plural] === "object" && p[plural][currentLang]) return p[plural][currentLang];
  if(p[key] && typeof p[key] === "object" && p[key][currentLang]) return p[key][currentLang];
  return p[key] || "";
}

function uniqueValues(key){ return [...new Set(properties.map(p => p[key]).filter(Boolean))]; }
function fillFilter(select, values){ values.forEach(v=>{ const o=document.createElement("option"); o.value=v; o.textContent=v; select.appendChild(o); }); }

fillFilter(cityFilter, uniqueValues("city"));
fillFilter(typeFilter, uniqueValues("type"));
["Sale", "Rent", "Sale & Rent"].forEach(v=>{ const o=document.createElement("option"); o.value=v; o.textContent=v; dealFilter.appendChild(o); });

const propertyCount = document.getElementById("propertyCount");
if(propertyCount) propertyCount.textContent = properties.length + "+";

function applyLanguage(){
  document.documentElement.lang = currentLang;
  document.querySelectorAll("[data-i18n]").forEach(el=>{ el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>{ el.placeholder = t(el.dataset.i18nPlaceholder); });
  const cityAll = cityFilter?.querySelector('option[value="all"]'); if(cityAll) cityAll.textContent = t("allCities");
  const typeAll = typeFilter?.querySelector('option[value="all"]'); if(typeAll) typeAll.textContent = t("allTypes");
  const dealAll = dealFilter?.querySelector('option[value="all"]'); if(dealAll) dealAll.textContent = t("allDeals");
  [...dealFilter.options].forEach(o=>{ if(o.value !== "all") o.textContent = trDeal(o.value); });
  document.querySelectorAll("#langSwitch button").forEach(b=>b.classList.toggle("active", b.dataset.lang === currentLang));
  render();
  if(currentProperty) openModal(currentProperty, false);
}

function cardTemplate(p, i){
  const img = p.images && p.images[0] ? `<img src="${p.images[0]}" alt="${getText(p,"title")}" onerror="this.src='images/hero.png'">` : `<img src="images/hero.png" alt="${getText(p,"title")}">`;
  const count = p.images ? p.images.length : 0;
  const title = getText(p,"title");
  const desc = getText(p,"description");
  return `<article class="card" data-index="${i}">
    <div class="photo">${img}<span class="badge">${trDeal(p.deal)} • ${p.type}</span>${p.status && p.status !== "Available" ? `<span class="status">${p.status}</span>` : ""}${count ? `<span class="count">📷 ${count}</span>` : ""}</div>
    <div class="content">
      <div class="meta">${p.id || ""} • ${p.city} • ${p.type}</div>
      <h3>${title}</h3>
      <div class="price">${p.price}</div>
      <p class="desc">${desc}</p>
      <div class="chips"><span>${p.bedrooms || "-"}</span><span>${p.bathrooms || "-"}</span><span>${p.area || "-"}</span></div>
      <div class="actions"><a class="smallbtn goldbtn" href="tel:0920056640">${t("call")}</a><a class="smallbtn" href="https://line.me/R/ti/p/@realcreamthailand" target="_blank">LINE</a>${p.map ? `<a class="smallbtn" href="${p.map}" target="_blank">${t("map")}</a>` : ""}</div>
    </div>
  </article>`;
}

function render(){
  if(!grid) return;
  const q = (searchInput.value || "").toLowerCase();
  const filtered = properties.filter(p =>
    (cityFilter.value === "all" || p.city === cityFilter.value) &&
    (typeFilter.value === "all" || p.type === typeFilter.value) &&
    (dealFilter.value === "all" || p.deal === dealFilter.value) &&
    (`${p.id || ""} ${getText(p,"title")} ${p.city} ${p.type} ${getText(p,"description")} ${p.room || ""} ${p.floor || ""} ${(p.highlights||[]).join(" ")}`.toLowerCase().includes(q))
  );
  grid.innerHTML = filtered.map(p => cardTemplate(p, properties.indexOf(p))).join("") || `<p>${t("noFound")}</p>`;
}

function updateModalImage(){
  const img = document.getElementById("modalImg");
  const counter = document.getElementById("modalCounter");
  if(!currentProperty || !currentProperty.images || !currentProperty.images.length){ img.src="images/hero.png"; counter.textContent="0 / 0"; return; }
  img.src = currentProperty.images[currentImageIndex];
  img.onerror = () => { img.src = "images/hero.png"; };
  counter.textContent = `${currentImageIndex + 1} / ${currentProperty.images.length}`;
  document.querySelectorAll("#modalThumbs img").forEach((tmb,i)=>tmb.classList.toggle("active", i === currentImageIndex));
}

function openModal(p, updateHash=true){
  currentProperty = p;
  if(updateHash) currentImageIndex = 0;
  document.getElementById("modalMeta").textContent = `${p.id || ""} • ${p.city} • ${p.type} • ${trDeal(p.deal)}`;
  document.getElementById("modalTitle").textContent = getText(p,"title");
  document.getElementById("modalPrice").textContent = p.price;
  document.getElementById("modalDesc").textContent = getText(p,"description");
  document.getElementById("modalChips").innerHTML = (p.highlights && p.highlights.length ? p.highlights : [p.bedrooms,p.bathrooms,p.area,p.floor,p.room]).filter(Boolean).map(x=>`<span>${x}</span>`).join("");
  const mapBtn = document.getElementById("modalMap");
  if(p.map){ mapBtn.href = p.map; mapBtn.style.display = "inline-block"; mapBtn.textContent = t("map"); } else { mapBtn.style.display = "none"; }
  document.querySelector(".modal-actions .goldbtn").textContent = t("call");
  document.getElementById("copyLink").textContent = t("copy");
  const thumbs = document.getElementById("modalThumbs");
  thumbs.innerHTML = (p.images || []).map((src,i)=>`<img src="${src}" data-i="${i}" onerror="this.style.display='none'">`).join("");
  thumbs.querySelectorAll("img").forEach(img=>img.addEventListener("click",()=>{ currentImageIndex=Number(img.dataset.i); updateModalImage(); }));
  updateModalImage();
  modal.classList.remove("hidden");
  if(updateHash) history.replaceState(null,"","#"+(p.id||""));
}

grid.addEventListener("click", e=>{ const card=e.target.closest(".card"); if(!card || e.target.closest("a")) return; openModal(properties[Number(card.dataset.index)]); });
modalClose.addEventListener("click",()=>modal.classList.add("hidden"));
modal.addEventListener("click", e=>{ if(e.target === modal) modal.classList.add("hidden"); });
document.getElementById("modalPrev").addEventListener("click",()=>{ if(!currentProperty?.images?.length) return; currentImageIndex=(currentImageIndex-1+currentProperty.images.length)%currentProperty.images.length; updateModalImage(); });
document.getElementById("modalNext").addEventListener("click",()=>{ if(!currentProperty?.images?.length) return; currentImageIndex=(currentImageIndex+1)%currentProperty.images.length; updateModalImage(); });
document.getElementById("copyLink").addEventListener("click", async()=>{ try{ await navigator.clipboard.writeText(location.href); document.getElementById("copyLink").textContent=t("copied"); } catch(e){ alert(location.href); } });
[cityFilter,typeFilter,dealFilter,searchInput].forEach(el=>el.addEventListener("input",render));
menuToggle.addEventListener("click",()=>mainNav.classList.toggle("show"));
document.addEventListener("keydown", e=>{ if(modal.classList.contains("hidden")) return; if(e.key==="Escape") modal.classList.add("hidden"); if(e.key==="ArrowLeft") document.getElementById("modalPrev").click(); if(e.key==="ArrowRight") document.getElementById("modalNext").click(); });

document.querySelectorAll("#langSwitch button").forEach(btn=>btn.addEventListener("click",()=>{ currentLang=btn.dataset.lang; localStorage.setItem("siriland_lang", currentLang); applyLanguage(); }));
document.querySelectorAll("[data-trust-city]").forEach(el=>el.addEventListener("click",()=>{ const city=el.getAttribute("data-trust-city"); if(cityFilter){ cityFilter.value=city; render(); } }));
document.querySelectorAll("[data-trust-action='properties']").forEach(el=>el.addEventListener("click",()=>{ cityFilter.value="all"; typeFilter.value="all"; dealFilter.value="all"; searchInput.value=""; render(); }));
document.querySelectorAll("[data-trust-action='languages']").forEach(el=>el.addEventListener("click",e=>{ e.preventDefault(); document.getElementById("langSwitch")?.scrollIntoView({behavior:"smooth",block:"center"}); }));

applyLanguage();
if(location.hash){ const id=location.hash.slice(1); const p=properties.find(x=>x.id===id); if(p) setTimeout(()=>openModal(p),200); }
