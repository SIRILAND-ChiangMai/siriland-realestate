
console.info('SIRILAND Admin Build 2026.07.10.12 loaded');
let properties=[];
let customers=[];
let currentLang='en';
let imageFiles=[];
let existingImageList=[];
let pendingFilesById={};
let mediaAnalysis=[];
let mediaAnalysisToken=0;
let propertyListPage=1;
const PROPERTY_LIST_PAGE_SIZE=20;
const langs=['en','th','tr','zh'];
const fields=['id','city','type','deal','status','price','bedrooms','bathrooms','area','room','floor','map','landSize','landAreaSqm','buildingArea','parking','titleDeed','roadAccess','frontage','zoning','utilities','salePrice','rentPrice','ownerFinance','installment','freeTransfer','summary','nearby','features','furniture','appliances'];
const $=id=>document.getElementById(id);

function escapeHtml(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function slugify(s){return String(s||'property').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70)||'property'}
function pick(v,l='en'){return v&&typeof v==='object'&&!Array.isArray(v)?(v[l]||v.en||v.th||v.tr||v.zh||''):(v||'')}
function pickArr(v,l='en'){return v&&typeof v==='object'&&!Array.isArray(v)?(v[l]||v.en||v.th||v.tr||v.zh||[]):(Array.isArray(v)?v:[])}
function hasFormData(){return fields.some(f=>$(f).value.trim()) || langs.some(l=>$('title_'+l).value.trim()||$('description_'+l).value.trim()||$('highlights_'+l).value.trim()) || imageFiles.length}
const CITY_CODES={
  'Chiang Mai':'CM',
  'Bangkok':'BKK',
  'Phitsanulok':'PLK',
  'Phichit':'PCT',
  'Nakhon Sawan':'NKS'
};
const UI={
  en:{info:'1) Property Information',lang:'2) 4 Language Content',fb:'3) Facebook Text',images:'4) Images',id:'ID',city:'City',type:'Type',deal:'Deal',status:'Status',price:'Price',bedrooms:'Bedrooms',bathrooms:'Bathrooms',area:'Area',room:'Room',floor:'Floor',map:'Map URL'},
  th:{info:'1) ข้อมูลประกาศ',lang:'2) เนื้อหา 4 ภาษา',fb:'3) ข้อความ Facebook',images:'4) รูปภาพ',id:'รหัสประกาศ',city:'จังหวัด/เมือง',type:'ประเภท',deal:'ขาย/เช่า',status:'สถานะ',price:'ราคา',bedrooms:'ห้องนอน',bathrooms:'ห้องน้ำ',area:'พื้นที่',room:'เลขห้อง',floor:'ชั้น',map:'ลิงก์แผนที่'},
  tr:{info:'1) İlan Bilgileri',lang:'2) 4 Dil İçerik',fb:'3) Facebook Metni',images:'4) Görseller',id:'ID',city:'Şehir',type:'Tür',deal:'Satış / Kiralama',status:'Durum',price:'Fiyat',bedrooms:'Yatak Odası',bathrooms:'Banyo',area:'Alan',room:'Oda',floor:'Kat',map:'Harita URL'},
  zh:{info:'1) 房源信息',lang:'2) 4种语言内容',fb:'3) Facebook 文本',images:'4) 图片',id:'编号',city:'城市',type:'类型',deal:'出售/出租',status:'状态',price:'价格',bedrooms:'卧室',bathrooms:'浴室',area:'面积',room:'房号',floor:'楼层',map:'地图链接'}
};
function cityCode(city){return CITY_CODES[city]||String(city||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,3)||'PRP'}
function nextId(city){const code=cityCode(city||$('city')?.value||'Chiang Mai');let max=0;properties.forEach(p=>{let m=String(p.id||'').match(new RegExp('^'+code+'-(\\d+)$','i'));if(m)max=Math.max(max,+m[1])});return code+'-'+String(max+1).padStart(4,'0')}
function syncIdToCity(force=false){const city=$('city').value;const code=cityCode(city);const id=$('id').value.trim();const known=Object.values(CITY_CODES).join('|');if(force||!id||new RegExp('^('+known+')-\\d+$','i').test(id)) $('id').value=nextId(city)}
function updateUiLang(l=currentLang){const t=UI[l]||UI.en;$('h_info').textContent=t.info;$('h_lang').textContent=t.lang;$('h_fb').textContent=t.fb;$('h_images').textContent=t.images;document.querySelectorAll('[data-ui]').forEach(el=>{el.textContent=t[el.dataset.ui]||el.textContent})}
function imageBaseFor(p){return slugify(p.title?.en||p.title?.th||p.title?.tr||p.title?.zh||p.id)}

function extractProperties(text){
  text=String(text||'').trim();
  if(text.startsWith('[')) return JSON.parse(text);
  const marks=['window.SIRILAND_PROPERTIES','window.properties','const properties','let properties','var properties'];
  let eq=-1;
  for(const m of marks){const i=text.indexOf(m); if(i>=0){eq=text.indexOf('[',i); break;}}
  if(eq<0) eq=text.indexOf('[');
  if(eq<0) throw new Error('properties array bulunamadı');
  let depth=0,inStr=false,esc=false,end=-1;
  for(let i=eq;i<text.length;i++){
    const ch=text[i];
    if(inStr){ if(esc) esc=false; else if(ch==='\\') esc=true; else if(ch==='"') inStr=false; continue; }
    if(ch==='"'){inStr=true;continue}
    if(ch==='[') depth++;
    if(ch===']'){depth--; if(depth===0){end=i+1;break}}
  }
  if(end<0) throw new Error('properties array kapanışı bulunamadı');
  return JSON.parse(text.slice(eq,end));
}

function initLangForms(){
  $('langTabs').innerHTML=langs.map(l=>`<button class="tab ${l==='en'?'active':''}" data-lang="${l}">${l.toUpperCase()}</button>`).join('');
  $('langForms').innerHTML=langs.map(l=>`<div class="langform" id="form_${l}" style="display:${l==='en'?'block':'none'}"><div class="grid2"><div><label>Başlık ${l.toUpperCase()}</label><input id="title_${l}"></div><div><label>Öne çıkanlar ${l.toUpperCase()} (her satır ayrı)</label><textarea id="highlights_${l}"></textarea></div></div><label>Açıklama ${l.toUpperCase()}</label><textarea id="description_${l}"></textarea></div>`).join('');
}
function switchLang(l){currentLang=l;document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.lang===l));langs.forEach(x=>$('form_'+x).style.display=x===l?'block':'none');updateUiLang(l)}

function normalizedPropertyType(){
  return String($('type')?.value||'').trim().toLowerCase();
}
function updatePropertyTypeFields(){
  const type=normalizedPropertyType();
  const isLand=type.includes('land') || type.includes('ที่ดิน') || type.includes('arsa') || type.includes('土地');
  const isCondo=type.includes('condo') || type.includes('apartment') || type.includes('คอนโด') || type.includes('公寓');
  const isHouse=type.includes('house') || type.includes('villa') || type.includes('บ้าน') || type.includes('ev') || type.includes('住宅');
  const isCommercial=type.includes('shop') || type.includes('commercial') || type.includes('office') || type.includes('warehouse') || type.includes('hotel') || type.includes('resort') || type.includes('อาคาร') || type.includes('โกดัง');
  const visibility={
    bedrooms:!isLand, bathrooms:!isLand, room:isCondo||isCommercial, floor:isCondo||isCommercial,
    area:!isLand, landSize:isLand||isHouse||isCommercial, landAreaSqm:isLand,
    buildingArea:isHouse||isCommercial, parking:isHouse||isCondo||isCommercial,
    titleDeed:isLand, roadAccess:isLand, frontage:isLand, zoning:isLand, utilities:isLand
  };
  document.querySelectorAll('[data-property-field]').forEach(el=>{
    const key=el.dataset.propertyField;
    el.classList.toggle('type-field-hidden', visibility[key]===false);
  });
  const note=$('propertyTypeNote');
  if(note){
    note.textContent=isLand?'Land mode: bedrooms, bathrooms, room and floor are hidden. Add land size, title deed, road access and utilities.'
      :isCondo?'Condo mode: room, floor, internal area and parking are shown.'
      :isHouse?'House mode: bedrooms, bathrooms, land size, building area and parking are shown.'
      :isCommercial?'Commercial mode: floors, building/land area, parking and usable rooms are shown.'
      :'Select Condo, House, Land, Shophouse, Commercial, Warehouse, Hotel or Resort.';
  }
}
function getForm(){
  const p={}; fields.forEach(f=>p[f]=$(f).value.trim());
  if(!p.id) p.id=nextId(p.city);
  const expected=cityCode(p.city);
  if(p.id && !String(p.id).toUpperCase().startsWith(expected+'-')){
    if(confirm('ID şehir kodu ile uyumsuz. '+p.id+' yerine '+nextId(p.city)+' yapılsın mı?')){p.id=nextId(p.city);$('id').value=p.id}
  }
  p.title={}; p.description={}; p.highlights={};
  langs.forEach(l=>{p.title[l]=$('title_'+l).value.trim();p.description[l]=$('description_'+l).value.trim();p.highlights[l]=$('highlights_'+l).value.split('\n').map(x=>x.trim()).filter(Boolean)});
  const existing=properties.find(x=>x.id===p.id);
  ['nearby','features','furniture','appliances'].forEach(k=>{
    p[k] = String(p[k]||'').split('\n').map(x=>x.trim()).filter(Boolean);
  });
  if(imageFiles.length){
    const base=mediaRenameBase()||imageBaseFor(p);
    p.images=imageFiles.map((f,i)=>{
      const ext=((f.name.split('.').pop()||'jpg').toLowerCase()).replace('jpeg','jpg');
      return `images/${base}-${String(i+1).padStart(2,'0')}.${ext}`;
    });
    pendingFilesById[p.id]=imageFiles.slice();
  } else {
    p.images=existingImageList.length ? existingImageList.slice() : ((existing&&existing.images)||[]);
  }
  cleanProperty(p);
  p.createdAt=(existing&&existing.createdAt)||new Date().toISOString().slice(0,10);
  p.updatedAt=new Date().toISOString().slice(0,10);
  p.featured=existing?.featured!==undefined?existing.featured:true;
  p.contact={name:'Kwan',phone1:'092-005-6640',phone2:'090-650-7558',line:'@realcreamthailand'};
  return p;
}
function setForm(p){p=cleanProperty(p);fields.forEach(f=>{$(f).value=Array.isArray(p[f])?p[f].join('\n'):(p[f]||'')});langs.forEach(l=>{$('title_'+l).value=pick(p.title,l);$('description_'+l).value=pick(p.description,l);$('highlights_'+l).value=pickArr(p.highlights,l).join('\n')});imageFiles=[];existingImageList=(p.images||[]).slice();renderImages();updatePropertyTypeFields()}
function clearForm(){fields.forEach(f=>$(f).value='');$('city').value='Chiang Mai';$('id').value=nextId('Chiang Mai');$('status').value='Available';langs.forEach(l=>{$('title_'+l).value='';$('description_'+l).value='';$('highlights_'+l).value=''});imageFiles=[];existingImageList=[];renderImages();switchLang('en');updatePropertyTypeFields();updateQualityScore();renderDashboard()}
function isPlaceholderValue(v){
  const s=String(v||'').trim().toLowerCase();
  return !s || s==='ask for price' || s==='please update' || s==='details updating' || s==='recovered from image folder' || s==='details are being updated by siriland.' || s==='n/a' || s==='null' || s==='undefined';
}
function isMissingValue(v){
  return isPlaceholderValue(v);
}
function isInvalidStructuredValue(v, kind){
  const raw=String(v||'').trim();
  if(!raw || isPlaceholderValue(raw)) return false;
  const s=raw.toLowerCase();
  if(/please|update|undefined|null|pending|details|pdate|katate|upd/i.test(s)) return true;
  if(kind==='floor') return !(/(?:^|\s)(?:basement|ground|mezzanine|penthouse|ชั้น|kat|floor|\d+(?:st|nd|rd|th)?)(?:\s|$)/i.test(raw));
  if(kind==='room') return !(/(?:unit|room|ห้อง|oda|房|studio|\b[a-z]?\d+[a-z-]*\b)/i.test(raw));
  return false;
}
function structuredFieldErrors(p){
  const errors=[];
  if(p.floor && isInvalidStructuredValue(p.floor,'floor')) errors.push(`${p.id||'Aktif ilan'}: Floor geçersiz (${p.floor})`);
  if(p.room && isInvalidStructuredValue(p.room,'room')) errors.push(`${p.id||'Aktif ilan'}: Room geçersiz (${p.room})`);
  return errors;
}
function cleanLineArray(arr){
  return (Array.isArray(arr)?arr:[]).map(x=>String(x||'').trim()).filter(x=>x && !isPlaceholderValue(x));
}
function cleanProperty(p){
  p = p || {};
  ['price','bedrooms','bathrooms','area','room','floor','salePrice','rentPrice','ownerFinance','installment','freeTransfer','summary'].forEach(k=>{
    if(isPlaceholderValue(p[k])) p[k]='';
  });
  // Legacy bozuk Floor/Room değerleri export sırasında temizlenir.
  // Böylece eski ilanlardaki hatalar yeni ilan silme/güncelleme işlemini engellemez.
  if(p.floor && isInvalidStructuredValue(p.floor,'floor')) p.floor='';
  if(p.room && isInvalidStructuredValue(p.room,'room')) p.room='';
  if(p.type && String(p.type).toLowerCase().includes('srimala villa shophouse')) p.type='Shophouse';
  if(p.description && typeof p.description==='object'){
    langs.forEach(l=>{ if(isPlaceholderValue(p.description[l]) || String(p.description[l]||'').toLowerCase().includes('details are being updated by siriland')) p.description[l]=''; });
  }
  if(p.highlights && typeof p.highlights==='object'){
    langs.forEach(l=>{ p.highlights[l]=cleanLineArray(p.highlights[l]); });
  }
  ['nearby','features','furniture','appliances'].forEach(k=>{
    if(Array.isArray(p[k])) p[k]=cleanLineArray(p[k]);
    else if(typeof p[k]==='string') p[k]=cleanLineArray(p[k].split('\n'));
  });
  return p;
}
function cleanAllProperties(){
  properties = (properties||[]).map(cleanProperty);
}
function validateCurrentForm(){
  // V3 Warning Mode: Price, Bedrooms, Bathrooms, Area, Map, Summary are warnings only.
  // They must NOT stop Save, JSON, JS, or ZIP export.
  const p=getForm();
  const warnings=[];
  if(isMissingValue(p.price)) warnings.push('Price eksik — fiyat yoksa Contact for Price yaz');
  const type=String(p.type||'').toLowerCase();
  if(!type.includes('land')){
    if(isMissingValue(p.bedrooms)) warnings.push('Bedrooms eksik');
    if(isMissingValue(p.bathrooms)) warnings.push('Bathrooms eksik');
  }
  if(isMissingValue(p.area) && isMissingValue(p.landSize)) warnings.push(type.includes('land') ? 'Land Size eksik' : 'Area eksik');
  if(!p.map) warnings.push('Map URL eksik');
  if(!p.summary) warnings.push('Summary eksik');
  if(!p.images || !p.images.length) warnings.push('Images yok');
  structuredFieldErrors(p).forEach(x=>warnings.push('HATALI VERİ: '+x));
  return warnings;
}
function upsertCurrent(silent=false){
  if(!hasFormData()) return false;
  const p=cleanProperty(getForm());
  if(!p.id) p.id=nextId(p.city || $('city').value || 'Chiang Mai');
  const i=properties.findIndex(x=>x.id===p.id);
  if(i>=0) properties[i]=p; else properties.push(p);
  renderList();
  validate();
  const warnings=validateCurrentForm();
  if(!silent){
    if(warnings.length){
      $('report').innerHTML='<span class="ok">Kaydedildi:</span> '+p.id+'\n\n<span class="warn">UYARI:</span>\n- '+warnings.join('\n- ')+'\n\nZIP yine oluşturulabilir.';
      alert('Kaydedildi: '+p.id+'\n\nUyarılar var ama export durmaz.');
    } else {
      alert('Kaydedildi: '+p.id);
    }
  }
  return true;
}

function upsertCurrentForExport(){
  // Export sırasında başka ilanların eksikleri export'u durdurmasın.
  // Aktif formda veri varsa, eksik alan olsa bile mevcut değişikliği kaydeder ve sadece uyarı raporu verir.
  if(!hasFormData()) return true;
  const p=cleanProperty(getForm());
  if(!p.id) p.id=nextId(p.city || $('city').value || 'Chiang Mai');
  const i=properties.findIndex(x=>x.id===p.id);
  if(i>=0) properties[i]=p; else properties.push(p);
  renderList();
  return true;
}

function statusText(p){ return String(p.status||'').toLowerCase(); }
function dealText(p){ return String(p.deal||'').toLowerCase(); }
function propertyHasMissing(p){
  if(!p.id || !p.city || !p.type || !p.deal || !p.status || isMissingValue(p.price) || (isMissingValue(p.area) && isMissingValue(p.landSize)) || !pick(p.title,'en') && !pick(p.title,'th') || !p.images || !p.images.length) return true;
  const type=String(p.type||'').toLowerCase();
  if(!type.includes('land') && (isMissingValue(p.bedrooms) || isMissingValue(p.bathrooms))) return true;
  return false;
}
function formatMiniProperty(p){
  const title=pick(p.title,'en')||pick(p.title,'th')||p.id||'';
  return `<div class="miniItem"><b>${escapeHtml(p.id||'')}</b> — ${escapeHtml(title)}<br><span class="muted">${escapeHtml(p.city||'')} • ${escapeHtml(p.price||'')}</span></div>`;
}
function dashboardPriceNumber(value){
  const s=String(value||'').toLowerCase().replace(/,/g,'').trim();
  if(!s || /contact|ask|update|pending|n\/a/.test(s)) return 0;
  const m=s.match(/([0-9]+(?:\.[0-9]+)?)/);
  if(!m) return 0;
  let n=Number(m[1]);
  if(s.includes('mb') || s.includes('million') || s.includes('ล้าน')) n*=1000000;
  return Number.isFinite(n)?n:0;
}
function dashboardMoney(value){
  const n=Number(value)||0;
  if(n>=1000000000) return '฿'+(n/1000000000).toFixed(2).replace(/\.00$/,'')+'B';
  if(n>=1000000) return '฿'+(n/1000000).toFixed(2).replace(/\.00$/,'')+'M';
  if(n>=1000) return '฿'+Math.round(n/1000)+'K';
  return '฿'+Math.round(n).toLocaleString();
}
function dashboardDateValue(value){
  const d=new Date(value||0);
  return Number.isNaN(d.getTime())?0:d.getTime();
}
function dashboardIsRecent24(p){
  const ts=dashboardDateValue(p.createdAt);
  return ts>0 && Date.now()-ts<=24*60*60*1000 && Date.now()>=ts;
}
function dashboardPropertyQuality(p){
  const title=pick(p.title,'en')||pick(p.title,'th');
  const checks=[
    !!p.id, !!p.city, !!p.type, !!p.deal, !!p.status,
    !isMissingValue(p.price||p.salePrice||p.rentPrice),
    !!title, Array.isArray(p.images)&&p.images.length>0,
    !!pick(p.description,'en')||!!pick(p.description,'th'),
    !!p.map
  ];
  return Math.round(checks.filter(Boolean).length/checks.length*100);
}
function dashboardMissingFields(p){
  const missing=[];
  if(!p.id) missing.push('ID');
  if(!p.city) missing.push('City');
  if(!p.type) missing.push('Type');
  if(!p.deal) missing.push('Deal');
  if(isMissingValue(p.price||p.salePrice||p.rentPrice)) missing.push('Price');
  if(!pick(p.title,'en')&&!pick(p.title,'th')) missing.push('Title');
  if(!Array.isArray(p.images)||!p.images.length) missing.push('Images');
  if(!p.map) missing.push('Map');
  return missing;
}
function renderDashboardBars(targetId, rows, total){
  const target=$(targetId);
  if(!target) return;
  const max=Math.max(1,...rows.map(r=>r.value));
  target.innerHTML=rows.length?rows.map(r=>{
    const width=Math.max(4,Math.round(r.value/max*100));
    const percent=total?Math.round(r.value/total*100):0;
    return `<div class="barRow"><div class="barRowHead"><span>${escapeHtml(r.label)}</span><b>${r.value} <small>(${percent}%)</small></b></div><div class="barTrack"><div class="barFill" style="width:${width}%"></div></div></div>`;
  }).join(''):'<span class="muted">Veri yok</span>';
}
function renderDashboard(){
  const total=properties.length;
  const dealText=p=>String(p.deal||'').toLowerCase();
  const statusText=p=>String(p.status||'').toLowerCase();
  const sale=properties.filter(p=>dealText(p).includes('sale')).length;
  const rent=properties.filter(p=>dealText(p).includes('rent')).length;
  const available=properties.filter(p=>statusText(p).includes('available')).length;
  const sold=properties.filter(p=>statusText(p).includes('sold')).length;
  const rented=properties.filter(p=>statusText(p).includes('rent')||statusText(p).includes('lease')).length;
  const ownerFinance=properties.filter(p=>!isMissingValue(p.ownerFinance)||!isMissingValue(p.installment)).length;
  const pending=properties.filter(p=>!Array.isArray(p.images)||p.images.length===0).length;
  const missingRows=properties.map(p=>({p,missing:dashboardMissingFields(p)})).filter(x=>x.missing.length);
  const missing=missingRows.length;

  const prices=properties.map(p=>dashboardPriceNumber(p.price||p.salePrice)).filter(n=>n>0);
  const portfolioValue=prices.reduce((a,b)=>a+b,0);
  const averagePrice=prices.length?portfolioValue/prices.length:0;
  const qualities=properties.map(dashboardPropertyQuality);
  const averageQuality=qualities.length?Math.round(qualities.reduce((a,b)=>a+b,0)/qualities.length):0;

  const set=(id,val)=>{if($(id))$(id).textContent=val};
  set('statTotal',total); set('statSale',sale); set('statRent',rent); set('statAvailable',available);
  set('statSold',sold); set('statRented',rented); set('statMissing',missing); set('statPendingPhotos',pending);
  set('statOwnerFinance',ownerFinance); set('statAveragePrice',dashboardMoney(averagePrice));
  set('statPortfolioValue',dashboardMoney(portfolioValue)); set('statAverageQuality',averageQuality+'%');

  const countsBy=key=>{
    const map={};
    properties.forEach(p=>{const label=String(p[key]||'Unknown').trim()||'Unknown';map[label]=(map[label]||0)+1});
    return Object.entries(map).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label));
  };
  const cityRows=countsBy('city');
  const typeRows=countsBy('type');
  renderDashboardBars('cityChart',cityRows,total);
  renderDashboardBars('typeChart',typeRows,total);
  set('cityChartTotal',total+' ilan');
  set('typeChartTotal',typeRows.length+' tür');

  const priceBuckets=[
    {label:'0–2M',min:0,max:2000000,value:0},
    {label:'2–5M',min:2000000,max:5000000,value:0},
    {label:'5–10M',min:5000000,max:10000000,value:0},
    {label:'10–20M',min:10000000,max:20000000,value:0},
    {label:'20M+',min:20000000,max:Infinity,value:0}
  ];
  prices.forEach(n=>{const b=priceBuckets.find(x=>n>=x.min&&n<x.max);if(b)b.value++});
  renderDashboardBars('priceChart',priceBuckets,prices.length);

  const health=Math.max(0,Math.min(100,averageQuality));
  set('dataHealthLabel',health+'%');
  set('dataHealthValue',health+'%');
  if($('dataHealthDonut')) $('dataHealthDonut').style.setProperty('--health',health*3.6+'deg');
  if($('dataHealthBreakdown')) $('dataHealthBreakdown').innerHTML=[
    ['Tam ilan',properties.filter(p=>dashboardPropertyQuality(p)>=90).length],
    ['İyileştirilmeli',properties.filter(p=>dashboardPropertyQuality(p)>=70&&dashboardPropertyQuality(p)<90).length],
    ['Eksik',properties.filter(p=>dashboardPropertyQuality(p)<70).length]
  ].map(([a,b])=>`<div><span>${a}</span><strong>${b}</strong></div>`).join('');

  const byCreated=properties.slice().sort((a,b)=>dashboardDateValue(b.createdAt)-dashboardDateValue(a.createdAt)).slice(0,6);
  const byUpdated=properties.slice().sort((a,b)=>dashboardDateValue(b.updatedAt)-dashboardDateValue(a.updatedAt)).slice(0,6);
  const recent24=properties.filter(dashboardIsRecent24).sort((a,b)=>dashboardDateValue(b.createdAt)-dashboardDateValue(a.createdAt)).slice(0,10);
  if($('lastAddedList')) $('lastAddedList').innerHTML=byCreated.map(formatMiniProperty).join('')||'<span class="muted">Henüz ilan yok</span>';
  if($('lastUpdatedList')) $('lastUpdatedList').innerHTML=byUpdated.map(formatMiniProperty).join('')||'<span class="muted">Henüz ilan yok</span>';
  if($('recent24List')) $('recent24List').innerHTML=recent24.map(formatMiniProperty).join('')||'<span class="muted">Son 24 saatte yeni ilan yok</span>';
  if($('dashboardMissingList')) $('dashboardMissingList').innerHTML=missingRows.slice(0,10).map(x=>`<div class="miniItem dashboardMissingItem" data-edit-id="${escapeHtml(x.p.id||'')}"><b>${escapeHtml(x.p.id||'No ID')}</b><span>${escapeHtml(x.missing.join(', '))}</span></div>`).join('')||'<span class="ok">Eksik veri yok</span>';
}
function updateQualityScore(){
  let p;
  try{ p=getForm(); }catch(e){ console.warn('Quality score skipped:', e); return; }
  const type=String(p.type||'').toLowerCase();
  const checks=[
    p.id,p.city,p.type,p.deal,p.status,p.price,
    (type.includes('land') ? p.landSize : p.area),
    (pick(p.title,'en')||pick(p.title,'th')),
    (p.images&&p.images.length ? 1 : '')
  ];
  if(!type.includes('land')) checks.push(p.bedrooms,p.bathrooms);
  const valid=checks.filter(x=>!isMissingValue(x)).length;
  const score=checks.length ? Math.round(valid/checks.length*100) : 0;
  if($('qualityScore')) $('qualityScore').textContent=score+'%';
  if($('qualityFill')) $('qualityFill').style.width=score+'%';
}
function propertyListText(p){
  return [
    p.id,p.city,p.type,p.deal,p.status,p.price,p.salePrice,p.rentPrice,
    pick(p.title,'en'),pick(p.title,'th'),pick(p.title,'tr'),pick(p.title,'zh')
  ].join(' ').toLowerCase();
}
function fillPropertyListFilters(){
  const fill=(id,values,first)=>{
    const el=$(id);if(!el)return;
    const selected=el.value||'all';
    el.innerHTML=`<option value="all">${first}</option>`+values.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
    el.value=[...el.options].some(o=>o.value===selected)?selected:'all';
  };
  fill('propertyListCity',[...new Set(properties.map(p=>p.city).filter(Boolean))].sort(),'Tüm Şehirler');
  fill('propertyListType',[...new Set(properties.map(p=>p.type).filter(Boolean))].sort(),'Tüm Türler');
  fill('propertyListStatus',[...new Set(properties.map(p=>p.status).filter(Boolean))].sort(),'Tüm Durumlar');
}
function renderPropertyCitySummary(){
  const el=$('propertyCitySummary');if(!el)return;
  const counts={};
  properties.forEach(p=>{const city=p.city||'Unknown';counts[city]=(counts[city]||0)+1});
  el.innerHTML=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([city,count])=>
    `<button type="button" class="citySummaryChip" data-list-city="${escapeHtml(city)}"><b>${escapeHtml(city)}</b><span>${count}</span></button>`
  ).join('');
}
function renderPropertyListPagination(total){
  const el=$('propertyListPagination');if(!el)return;
  const pages=Math.max(1,Math.ceil(total/PROPERTY_LIST_PAGE_SIZE));
  if(propertyListPage>pages)propertyListPage=pages;
  if(pages<=1){el.innerHTML='';return}
  const buttons=[];
  buttons.push(`<button type="button" ${propertyListPage===1?'disabled':''} data-list-page="${propertyListPage-1}">‹</button>`);
  for(let i=1;i<=pages;i++){
    if(i===1||i===pages||Math.abs(i-propertyListPage)<=1)buttons.push(`<button type="button" class="${i===propertyListPage?'active':''}" data-list-page="${i}">${i}</button>`);
    else if(Math.abs(i-propertyListPage)===2)buttons.push('<span>…</span>');
  }
  buttons.push(`<button type="button" ${propertyListPage===pages?'disabled':''} data-list-page="${propertyListPage+1}">›</button>`);
  el.innerHTML=buttons.join('');
}
function renderList(){
  renderDashboard();
  updateQualityScore();
  fillPropertyListFilters();
  renderPropertyCitySummary();

  const q=String($('propertyListSearch')?.value||'').trim().toLowerCase();
  const city=$('propertyListCity')?.value||'all';
  const type=$('propertyListType')?.value||'all';
  const status=$('propertyListStatus')?.value||'all';

  const filtered=properties.filter(p=>
    (!q||propertyListText(p).includes(q)) &&
    (city==='all'||p.city===city) &&
    (type==='all'||p.type===type) &&
    (status==='all'||p.status===status)
  ).sort((a,b)=>String(a.id||'').localeCompare(String(b.id||''),undefined,{numeric:true}));

  const pages=Math.max(1,Math.ceil(filtered.length/PROPERTY_LIST_PAGE_SIZE));
  if(propertyListPage>pages)propertyListPage=pages;
  const start=(propertyListPage-1)*PROPERTY_LIST_PAGE_SIZE;
  const visible=filtered.slice(start,start+PROPERTY_LIST_PAGE_SIZE);

  if($('propertyListCount'))$('propertyListCount').textContent=`${filtered.length} / ${properties.length} ilan`;
  $('list').innerHTML=visible.length?visible.map(p=>`<div class="item propertyListItem">
    <div class="propertyListMain">
      <div><b>${escapeHtml(p.id)}</b> — ${escapeHtml(pick(p.title,'en')||pick(p.title,'th')||'Başlıksız')}</div>
      <div class="propertyListMeta">
        <span>${escapeHtml(p.city||'')}</span>
        <span>${escapeHtml(p.type||'')}</span>
        <span>${escapeHtml(p.deal||'')}</span>
        <span>${escapeHtml(p.status||'')}</span>
        <span>${escapeHtml(p.price||p.salePrice||p.rentPrice||'Fiyat yok')}</span>
        <span>${(p.images||[]).length} foto</span>
      </div>
    </div>
    <div class="propertyListActions">
      <button class="btn dark" onclick="editProp('${escapeHtml(p.id)}')">Düzenle</button>
      <button class="btn red" onclick="deleteProp('${escapeHtml(p.id)}')">Sil</button>
    </div>
  </div>`).join(''):'<div class="propertyListEmpty">Bu filtrelerde ilan bulunamadı.</div>';
  renderPropertyListPagination(filtered.length);
}
function filePreview(f){
  if(!f.__sirilandPreview) f.__sirilandPreview=URL.createObjectURL(f);
  return f.__sirilandPreview;
}
function mediaFormatBytes(bytes){
  const n=Number(bytes)||0;
  if(n>=1024*1024) return (n/(1024*1024)).toFixed(2)+' MB';
  if(n>=1024) return Math.round(n/1024)+' KB';
  return n+' B';
}
function mediaRenameBase(){
  const manual=String($('mediaRenamePrefix')?.value||'').trim();
  if(manual) return slugify(manual);
  const title=$('title_en')?.value||$('title_th')?.value||$('id')?.value||'property';
  return slugify(title);
}
function mediaExportName(index,file){
  const ext=((file?.name||'image.jpg').split('.').pop()||'jpg').toLowerCase().replace('jpeg','jpg');
  return mediaRenameBase()+'-'+String(index+1).padStart(2,'0')+'.'+ext;
}
async function mediaFileHash(file){
  try{
    const buffer=await file.arrayBuffer();
    const digest=await crypto.subtle.digest('SHA-256',buffer);
    return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }catch(e){
    return [file.name,file.size,file.lastModified].join('|');
  }
}
function mediaReadDimensions(file){
  return new Promise(resolve=>{
    const img=new Image();
    const src=filePreview(file);
    img.onload=()=>resolve({width:img.naturalWidth||0,height:img.naturalHeight||0});
    img.onerror=()=>resolve({width:0,height:0});
    img.src=src;
  });
}
async function analyzeMediaFiles(){
  const token=++mediaAnalysisToken;
  const files=imageFiles.slice();
  const minRes=Number($('mediaMinResolution')?.value||1600);
  const maxBytes=Number($('mediaMaxFileSize')?.value||4)*1024*1024;
  const results=[];
  for(let i=0;i<files.length;i++){
    const file=files[i];
    const [dim,hash]=await Promise.all([mediaReadDimensions(file),mediaFileHash(file)]);
    results.push({
      index:i,name:file.name,size:file.size,width:dim.width,height:dim.height,hash,
      lowRes:Math.max(dim.width,dim.height)<minRes,
      large:file.size>maxBytes,
      duplicate:false,
      exportName:mediaExportName(i,file)
    });
  }
  const counts={};
  results.forEach(x=>counts[x.hash]=(counts[x.hash]||0)+1);
  results.forEach(x=>x.duplicate=counts[x.hash]>1);
  if(token!==mediaAnalysisToken) return;
  mediaAnalysis=results;
  renderImages();
  renderMediaSummary();
}
function renderMediaSummary(){
  const total=imageFiles.length||existingImageList.length;
  const duplicate=mediaAnalysis.filter(x=>x.duplicate).length;
  const lowRes=mediaAnalysis.filter(x=>x.lowRes).length;
  const large=mediaAnalysis.filter(x=>x.large).length;
  const size=imageFiles.reduce((a,f)=>a+(f.size||0),0);
  const set=(id,value)=>{if($(id))$(id).textContent=value};
  set('mediaStatTotal',total);
  set('mediaStatCover',total?'1':'—');
  set('mediaStatDuplicates',duplicate);
  set('mediaStatLowRes',lowRes);
  set('mediaStatLarge',large);
  set('mediaStatSize',mediaFormatBytes(size));
  if($('imageStats')){
    $('imageStats').textContent=total
      ? `${total} fotoğraf • Kapak: 1. fotoğraf • Export adı: ${mediaRenameBase()}-01.jpg`
      : 'Henüz fotoğraf seçilmedi.';
  }
  if($('imageWarnings')){
    const warnings=[];
    if(duplicate) warnings.push(`⚠️ ${duplicate} duplicate fotoğraf bulundu.`);
    if(lowRes) warnings.push(`⚠️ ${lowRes} fotoğraf minimum çözünürlüğün altında.`);
    if(large) warnings.push(`⚠️ ${large} fotoğraf seçilen dosya boyutu limitini aşıyor.`);
    $('imageWarnings').innerHTML=warnings.length?warnings.map(x=>`<div>${escapeHtml(x)}</div>`).join(''):'<div class="mediaAllGood">✅ Fotoğraf kalite kontrolü temiz.</div>';
  }
}
function imageCard(src,name,i,existing=false){
  const cover=i===0?'<span class="coverTag">⭐ KAPAK</span>':'';
  const safe=escapeHtml(src);
  const title=existing?(name||('Mevcut görsel '+(i+1))):(name||('Yeni görsel '+(i+1)));
  const info=!existing?mediaAnalysis.find(x=>x.index===i):null;
  const badges=[];
  if(info){
    badges.push(`<span class="mediaInfoBadge">${info.width}×${info.height}</span>`);
    badges.push(`<span class="mediaInfoBadge">${mediaFormatBytes(info.size)}</span>`);
    if(info.duplicate) badges.push('<span class="mediaInfoBadge danger">Duplicate</span>');
    if(info.lowRes) badges.push('<span class="mediaInfoBadge warning">Low resolution</span>');
    if(info.large) badges.push('<span class="mediaInfoBadge warning">Large file</span>');
  }
  const exportName=!existing?(info?.exportName||mediaExportName(i,imageFiles[i])):String(name||'').split('/').pop();
  return `<div class="imageCard mediaImageCard" draggable="true" ondragstart="dragImgStart(${i},${existing})" ondragover="event.preventDefault()" ondrop="dropImg(${i},${existing})">
    <div class="thumbWrap" onclick="window.open('${safe}','_blank')"><img src="${safe}" onerror="this.src='images/logo.png'">${cover}</div>
    <div class="mediaImageInfo">
      <div class="imgTitle">${i+1}. ${cover?'Kapak Fotoğrafı':'Fotoğraf'}</div>
      <div class="imgPath">${escapeHtml(title)}</div>
      <div class="mediaExportName">Export: ${escapeHtml(exportName)}</div>
      <div class="mediaInfoBadges">${badges.join('')}</div>
      <div class="imgActions">
        <button class="btn" type="button" onclick="${existing?'coverExisting':'coverImg'}(${i})">⭐ Kapak Yap</button>
        <button class="btn dark" type="button" onclick="${existing?'moveExisting':'moveImg'}(${i},-1)">↑</button>
        <button class="btn dark" type="button" onclick="${existing?'moveExisting':'moveImg'}(${i},1)">↓</button>
        <button class="btn red" type="button" onclick="${existing?'removeExisting':'removeImg'}(${i})">Sil</button>
      </div>
    </div>
  </div>`;
}
function renderImages(){
  if(imageFiles.length){
    $('imagePreview').innerHTML=imageFiles.map((f,i)=>imageCard(filePreview(f),f.name,i,false)).join('');
  }else{
    $('imagePreview').innerHTML=existingImageList.map((x,i)=>imageCard(x,x,i,true)).join('');
  }
  renderMediaSummary();
}
let dragFromIndex=null;let dragExisting=false;
window.dragImgStart=(i,existing)=>{dragFromIndex=i;dragExisting=existing};
window.dropImg=(to,existing)=>{
  if(dragFromIndex===null||dragExisting!==existing)return;
  const arr=existing?existingImageList:imageFiles;
  const item=arr.splice(dragFromIndex,1)[0];arr.splice(to,0,item);
  dragFromIndex=null;
  if(!existing) analyzeMediaFiles(); else renderImages();
};
window.editProp=id=>{const p=properties.find(x=>x.id===id);if(p)setForm(p)};
window.deleteProp=id=>{
  if(!confirm(id+' silinsin mi? Bu ilan Recycle Bin içine taşınacak.'))return;
  const p=properties.find(x=>x.id===id);
  if(p){
    const trash=dbGetTrash();
    trash.unshift({...p,__deletedAt:new Date().toISOString()});
    dbSetTrash(trash);
  }
  properties=properties.filter(p=>p.id!==id);
  delete pendingFilesById[id];
  dbSaveCurrentSnapshot('Delete '+id);
  renderList();clearForm();validate();dbRender();
};
window.moveImg=(i,d)=>{const j=i+d;if(j<0||j>=imageFiles.length)return;[imageFiles[i],imageFiles[j]]=[imageFiles[j],imageFiles[i]];analyzeMediaFiles()};
window.coverImg=i=>{if(i<=0||i>=imageFiles.length)return;const f=imageFiles.splice(i,1)[0];imageFiles.unshift(f);analyzeMediaFiles()};
window.removeImg=i=>{if(i<0||i>=imageFiles.length)return;const f=imageFiles.splice(i,1)[0];if(f?.__sirilandPreview)URL.revokeObjectURL(f.__sirilandPreview);analyzeMediaFiles()};
window.moveExisting=(i,d)=>{const j=i+d;if(j<0||j>=existingImageList.length)return;[existingImageList[i],existingImageList[j]]=[existingImageList[j],existingImageList[i]];renderImages()};
window.coverExisting=i=>{if(i<=0||i>=existingImageList.length)return;const f=existingImageList.splice(i,1)[0];existingImageList.unshift(f);renderImages()};
window.removeExisting=i=>{if(confirm('Bu görsel listeden silinsin mi?')){existingImageList.splice(i,1);renderImages()}};

function validate(){
  const errors=[]; const warnings=[]; const ids=new Set();
  properties.forEach((p,n)=>{
    if(!p.id) errors.push(`Satır ${n+1}: ID yok`);
    if(ids.has(p.id)) errors.push(`Duplicate ID: ${p.id}`);
    ids.add(p.id);
    if(!pick(p.title)) warnings.push(`${p.id}: Başlık eksik`);
    if(isMissingValue(p.price)) warnings.push(`${p.id}: Price eksik`);
    const type=String(p.type||'').toLowerCase();
    if(!type.includes('land')) ['bedrooms','bathrooms'].forEach(f=>{ if(isMissingValue(p[f])) warnings.push(`${p.id}: ${f} eksik`) });
    if(isMissingValue(p.area)) warnings.push(`${p.id}: area eksik`);
    if(!p.images||!p.images.length) warnings.push(`${p.id}: Foto yok`);
    structuredFieldErrors(p).forEach(x=>errors.push(x));
  });
  const pending=Object.keys(pendingFilesById).map(id=>`${id}: ${pendingFilesById[id].length} yeni foto`).join('\n') || 'Yeni seçilen foto yok';
  let msg=errors.length?'<span class="bad">HATA:</span>\n'+errors.join('\n'):'<span class="ok">OK: properties.js üretilebilir.</span>';
  if(warnings.length) msg+='\n\n<span class="warn">UYARI:</span>\n'+warnings.slice(0,100).join('\n')+(warnings.length>100?'\n...':'');
  $('report').innerHTML=msg+'\n\nToplam ilan: '+properties.length+'\nBekleyen yeni görseller:\n'+pending;
  renderDashboard();
  updateQualityScore();
  return !errors.length;
}
function makeJs(){cleanAllProperties();return 'window.SIRILAND_PROPERTIES = '+JSON.stringify(properties,null,2)+';\nconst properties = window.SIRILAND_PROPERTIES;\n'}
function download(name,content,type='application/octet-stream'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click()}

function exportReady(){
  if(properties.length === 0){
    alert('EXPORT STOPPED\n\nproperties listesi boş görünüyor. Önce properties.js yükle veya sayfayı yenile. Boş JSON export edilmedi.');
    $('report').innerHTML='<span class="bad">EXPORT STOPPED:</span> properties listesi boş. properties.js yüklemeden export yapma.';
    return false;
  }

  // Only validate and save the property currently being edited.
  // Other old listings may still have missing fields; they should appear as warnings, not block the whole export.
  upsertCurrentForExport();

  cleanAllProperties();

  // Hard stop only for data that can break the website/export file.
  const hardErrors=[];
  const warnings=[];
  const ids=new Set();
  properties.forEach((p,idx)=>{
    const label=p.id || ('Row '+(idx+1));
    if(!p.id) hardErrors.push(label+': ID eksik');
    if(p.id && ids.has(p.id)) hardErrors.push(label+': Duplicate ID');
    ids.add(p.id);

    // Missing property details are warnings only.
    if(!p.city) warnings.push(label+': City eksik');
    if(!p.type) warnings.push(label+': Type eksik');
    if(!p.deal) warnings.push(label+': Deal eksik');
    if(!p.status) warnings.push(label+': Status eksik');
    if(isMissingValue(p.price)) warnings.push(label+': Price eksik — fiyat yoksa Contact for Price yaz');
    if(!pick(p.title,'en') && !pick(p.title,'th')) warnings.push(label+': Title eksik');
    if(isMissingValue(p.area) && isMissingValue(p.landSize)) warnings.push(label+': Area/Land Size eksik');
    structuredFieldErrors(p).forEach(x=>warnings.push('Temizlendi: '+x));
  });

  if(hardErrors.length){
    const msg='EXPORT STOPPED\n\n'+hardErrors.slice(0,80).join('\n')+(hardErrors.length>80?'\n...':'');
    alert(msg);
    $('report').innerHTML='<span class="bad">EXPORT STOPPED:</span>\n'+hardErrors.slice(0,120).join('\n')+(hardErrors.length>120?'\n...':'');
    return false;
  }

  if(warnings.length){
    $('report').innerHTML='<span class="ok">EXPORT READY:</span> Dosya oluşturulabilir.\n\n<span class="warn">UYARI:</span>\n'+warnings.slice(0,120).join('\n')+(warnings.length>120?'\n...':'');
  } else {
    $('report').innerHTML='<span class="ok">EXPORT READY:</span> 0 hata, 0 uyarı.';
  }
  return true;
}
function exportJsonText(){ cleanAllProperties(); return JSON.stringify(properties,null,2); }


async function mediaApplyWatermark(file){
  if(!file || !String(file.type||'').startsWith('image/')) return file;
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      try{
        const canvas=document.createElement('canvas');
        canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
        const ctx=canvas.getContext('2d');
        ctx.drawImage(img,0,0);
        const fontSize=Math.max(22,Math.round(canvas.width*0.026));
        const pad=Math.max(16,Math.round(canvas.width*0.018));
        ctx.font=`800 ${fontSize}px Arial`;
        ctx.textBaseline='bottom';
        const label='SIRILAND • Real Estate Thailand';
        const width=ctx.measureText(label).width;
        const boxH=fontSize+pad;
        ctx.fillStyle='rgba(7,26,61,.72)';
        ctx.fillRect(canvas.width-width-pad*2,canvas.height-boxH-pad/2,width+pad*2,boxH+pad/2);
        ctx.fillStyle='#d6ad4b';
        ctx.fillText(label,canvas.width-width-pad,canvas.height-pad);
        canvas.toBlob(blob=>resolve(blob||file),file.type==='image/png'?'image/png':'image/jpeg',0.9);
      }catch(e){resolve(file)}
    };
    img.onerror=()=>resolve(file);
    img.src=filePreview(file);
  });
}

async function buildZip(){
  if(!exportReady()) return;
  // Warning mode: eksik alanlar rapora yazılır ama ZIP oluşturmayı durdurmaz.
  const zip=new JSZip();
  const jsText = makeJs();
  const jsonText = exportJsonText();
  zip.file('properties.js', jsText);
  zip.file('properties.json', jsonText);
  zip.file('data/properties.json', jsonText);
  saveCustomers();
  zip.file('crm/customers.json',JSON.stringify(customers,null,2));
  zip.file('UPLOAD_INSTRUCTIONS.txt','1) Bu ZIP dosyasını açın.\n2) properties.js dosyasını GitHub proje klasöründe eski properties.js üstüne kopyalayın.\n3) properties.json dosyasını da eski properties.json üstüne kopyalayın.\n4) images klasöründeki yeni fotoğrafları mevcut images klasörüne kopyalayın.\n5) GitHub Desktop: Commit + Push.\n\nNot: Export artık boş properties.json üretmez. Eksik fiyat/oda/banyo/alan varsa raporda uyarı verir ama export durmaz. Duplicate ID varsa durur. CRM müşterileri crm/customers.json olarak eklenir.');
  for(const [id,files] of Object.entries(pendingFilesById)){
    const p=properties.find(x=>x.id===id);if(!p)continue;
    for(let i=0;i<files.length;i++){
      const f=files[i],path=p.images[i];
      if(!path)continue;
      const output=$('mediaWatermark')?.checked?await mediaApplyWatermark(f):f;
      zip.file(path,output);
    }
  }
  const blob=await zip.generateAsync({type:'blob'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='siriland-export-fixed.zip';a.click();
}

function parseFbText(){
  const s=$('fbText').value; if(!s.trim())return;
  const set=(id,val)=>{if(val&&!$(id).value)$(id).value=val.trim()};
  const price=s.match(/(?:ราคา|Price|ขาย|เช่า|rent|sale)[^\d]*(\d[\d,.]*\s*(?:MB|บาท|THB|ล้าน)?)/i);
  const area=s.match(/(\d+(?:\.\d+)?)\s*(?:ตร\.ม\.|sqm|sq\.m|ตารางเมตร)/i);
  const bed=s.match(/(\d+)\s*(?:ห้องนอน|bed|bedroom)/i);
  const bath=s.match(/(\d+)\s*(?:ห้องน้ำ|bath|bathroom)/i);
  set('price',price?.[1]||''); set('area',area?area[1]+' sqm':''); set('bedrooms',bed?bed[1]+' Bedrooms':''); set('bathrooms',bath?bath[1]+' Bathrooms':'');
  if(!$('title_en').value){const first=s.split('\n').map(x=>x.trim()).filter(Boolean)[0]||'';$('title_en').value=first;$('title_th').value=first;$('title_tr').value=first;$('title_zh').value=first;}
  langs.forEach(l=>{if(!$('description_'+l).value)$('description_'+l).value=s.trim()});
  alert('Metin okundu. Lütfen kontrol edip ZIP oluşturun.');
}


function cleanText(v){ return String(v||'').replace(/\s+/g,' ').trim(); }
function propertyWebsiteUrl(p){
  const base = 'https://siriland-chiangmai.github.io/siriland-realestate/';
  return base + '?property=' + encodeURIComponent(p.id || '');
}
function makeHashtags(p){
  const city = cleanText(p.city || 'Thailand').replace(/\s+/g,'');
  const type = cleanText(p.type || 'Property').replace(/\s+/g,'');
  const deal = cleanText(p.deal || 'RealEstate').replace(/[\/\s]+/g,'');
  return [
    '#SIRILAND',
    '#'+city+'Property',
    '#'+type+deal,
    '#ThailandRealEstate',
    '#อสังหาริมทรัพย์'
  ].join('\n');
}

function generateSummary(){
  const type = cleanText($('type').value).toLowerCase();
  const city = cleanText($('city').value || 'Thailand');
  const deal = cleanText($('deal').value).toLowerCase();
  const price = cleanText($('price').value || $('salePrice').value || $('rentPrice').value);
  const area = cleanText($('area').value);
  const beds = cleanText($('bedrooms').value);
  const ownerFinance = cleanText($('ownerFinance').value);
  const freeTransfer = cleanText($('freeTransfer').value);
  let summary = '';

  if(type.includes('condo')){
    summary = `Modern condominium in a prime ${city} location, suitable for living or investment. ${beds ? beds + ', ' : ''}${area ? area + ', ' : ''}${price ? 'priced at ' + price + '. ' : ''}Fully prepared for quality urban living.`;
  } else if(type.includes('house') || type.includes('home')){
    summary = `Beautiful home in a convenient ${city} location, offering comfortable living space for families or long-term investment. ${price ? 'Price: ' + price + '. ' : ''}`;
  } else if(type.includes('shop') || type.includes('commercial')){
    summary = `Prime commercial shophouse in ${city}, ideal for retail, office, café, clinic, or investment. ${deal.includes('rent') ? 'Available for sale or rent. ' : ''}${ownerFinance ? 'Owner financing available. ' : ''}${freeTransfer ? 'Free transfer benefits included. ' : ''}`;
  } else if(type.includes('land')){
    summary = `Excellent land opportunity in ${city}, suitable for residential, commercial, or investment purposes. ${area ? 'Land size: ' + area + '. ' : ''}${price ? 'Price: ' + price + '. ' : ''}`;
  } else {
    summary = `Prime property in ${city}, suitable for living, business, or investment. ${price ? 'Price: ' + price + '. ' : ''}Contact SIRILAND for more information or to schedule a viewing.`;
  }

  summary = summary.replace(/\s+/g,' ').trim();
  $('summary').value = summary;
}

function translatePostValueToThai(v){
  let s = cleanText(v);
  if(!s) return '';
  const repl = [
    [/THB/gi,'บาท'],[/MB/gi,'ล้านบาท'],[/Month/gi,'เดือน'],[/Unit/gi,'คูหา'],[/Units/gi,'คูหา'],[/Year/gi,'ปี'],[/Years/gi,'ปี'],[/Owner Finance/gi,'ผ่อนตรงกับเจ้าของ'],[/Free Transfer/gi,'ฟรีค่าโอน'],[/Contact for Price/gi,'สอบถามราคา'],[/Sale/gi,'ขาย'],[/Rent/gi,'เช่า'],[/Shophouse/gi,'อาคารพาณิชย์'],[/Condo/gi,'คอนโด'],[/House/gi,'บ้าน'],[/Land/gi,'ที่ดิน'],[/Bedrooms?/gi,'ห้องนอน'],[/Bathrooms?/gi,'ห้องน้ำ'],[/sqm|sq\.m/gi,'ตร.ม.'],[/Floor/gi,'ชั้น'],[/Room/gi,'ห้อง'],[/Front/gi,'ด้านหน้า'],[/Connected/gi,'เชื่อมต่อ'],[/Month/gi,'เดือน']
  ];
  repl.forEach(([a,b])=>s=s.replace(a,b));
  return s;
}
function trCityTh(v){return ({'Chiang Mai':'เชียงใหม่','Bangkok':'กรุงเทพฯ','Phitsanulok':'พิษณุโลก','Phichit':'พิจิตร','Nakhon Sawan':'นครสวรรค์'}[v]||v||'')}
function trTypeTh(v){return ({'Condo':'คอนโด','House':'บ้าน','Land':'ที่ดิน','Shophouse':'อาคารพาณิชย์','Commercial':'อาคารพาณิชย์'}[v]||translatePostValueToThai(v)||'')}
function trDealTh(v){return ({'Sale':'ขาย','Rent':'ให้เช่า','Sale/Rent':'ขาย/ให้เช่า','Sale / Rent':'ขาย/ให้เช่า','Sale-Rent':'ขาย/ให้เช่า'}[v]||translatePostValueToThai(v)||'')}
function makeHashtagsTh(p){
  const city = cleanText(trCityTh(p.city || 'ไทย')).replace(/\s+/g,'');
  const type = cleanText(trTypeTh(p.type || 'อสังหาริมทรัพย์')).replace(/\s+/g,'');
  return ['#SIRILAND','#'+city+'อสังหา','#'+type,'#ขายเช่าอสังหา','#อสังหาริมทรัพย์'].join('\n');
}
function makePostBlock(p, lang){
  const isTh = lang === 'th';
  const title = cleanText(pick(p.title, lang) || pick(p.title,'en') || pick(p.title,'th') || p.id || 'SIRILAND Property');
  const price = cleanText(p.price || (isTh ? 'สอบถามราคา' : 'Contact for Price'));
  const beds = cleanText(p.bedrooms || '');
  const baths = cleanText(p.bathrooms || '');
  const area = cleanText(p.area || '');
  const room = cleanText(p.room || '');
  const floor = cleanText(p.floor || '');
  const city = isTh ? trCityTh(p.city) : cleanText(p.city || '');
  const type = isTh ? trTypeTh(p.type) : cleanText(p.type || '');
  const deal = isTh ? trDealTh(p.deal) : cleanText(p.deal || '');
  const desc = cleanText(pick(p.description, lang) || pick(p.description,'en') || '');
  const salePrice = cleanText(p.salePrice || '');
  const rentPrice = cleanText(p.rentPrice || '');
  const ownerFinance = cleanText(p.ownerFinance || '');
  const installment = cleanText(p.installment || '');
  const freeTransfer = cleanText(p.freeTransfer || '');
  const summary = cleanText(p.summary || '');
  const highlightsArr = pickArr(p.highlights, lang).length ? pickArr(p.highlights, lang) : pickArr(p.highlights,'en');
  const highlights = highlightsArr.slice(0,6).map(x=>'✅ '+cleanText(isTh ? translatePostValueToThai(x) : x)).join('\n');
  const propUrl = propertyWebsiteUrl(p);
  const mainUrl = 'https://siriland-chiangmai.github.io/siriland-realestate/';
  const tags = isTh ? makeHashtagsTh(p) : makeHashtags(p);
  const mapLine = p.map ? (isTh ? '\n📍 Google Map:\n' + p.map + '\n' : '\n📍 Google Map:\n' + p.map + '\n') : '';

  const specs = isTh ? [
    price ? '💰 ราคา: ' + translatePostValueToThai(price) : '',
    salePrice ? '🏷️ ราคาขาย: ' + translatePostValueToThai(salePrice) : '',
    rentPrice ? '💰 ราคาเช่า: ' + translatePostValueToThai(rentPrice) : '',
    ownerFinance ? '💳 ผ่อนตรงกับเจ้าของ: ' + translatePostValueToThai(ownerFinance) : '',
    installment ? '📅 แผนผ่อน: ' + translatePostValueToThai(installment) : '',
    freeTransfer ? '🎁 ค่าโอน: ' + translatePostValueToThai(freeTransfer) : '',
    beds ? '🛏️ ' + translatePostValueToThai(beds) : '',
    baths ? '🛁 ' + translatePostValueToThai(baths) : '',
    area ? '📐 ' + translatePostValueToThai(area) : '',
    room ? '🚪 ' + translatePostValueToThai(room) : '',
    floor ? '🏢 ' + translatePostValueToThai(floor) : ''
  ].filter(Boolean).join('\n') : [
    price ? '💰 Price: ' + price : '',
    salePrice ? '🏷️ Sale Price: ' + salePrice : '',
    rentPrice ? '💰 Rent Price: ' + rentPrice : '',
    ownerFinance ? '💳 Owner Finance: ' + ownerFinance : '',
    installment ? '📅 Installment: ' + installment : '',
    freeTransfer ? '🎁 Free Transfer: ' + freeTransfer : '',
    beds ? '🛏️ ' + beds : '',
    baths ? '🛁 ' + baths : '',
    area ? '📐 ' + area : '',
    room ? '🚪 ' + room : '',
    floor ? '🏢 ' + floor : ''
  ].filter(Boolean).join('\n');

  if(isTh){
    return `🇹🇭 ภาษาไทย\n\n🏡 ${title}\n\n📍 ${city}${type ? ' • ' + type : ''}${deal ? ' • ' + deal : ''}\n\n${specs}\n\n${highlights ? highlights + '\n' : ''}${summary ? '\n' + translatePostValueToThai(summary) + '\n' : ''}${desc ? '\n' + desc + '\n' : ''}${mapLine}\n🌐 ดูรายละเอียดและรูปภาพทั้งหมด:\n${propUrl}\n\n🌍 เว็บไซต์:\n${mainUrl}\n\n📞 ติดต่อขวัญ\n☎️ 092-005-6640\n☎️ 090-650-7558\n💬 LINE: @realcreamthailand\n\n${tags}`.trim();
  }
  return `🇬🇧 English\n\n🏡 ${title}\n\n📍 ${city}${type ? ' • ' + type : ''}${deal ? ' • ' + deal : ''}\n\n${specs}\n\n${highlights ? highlights + '\n' : ''}${summary ? '\n' + summary + '\n' : ''}${desc ? '\n' + desc + '\n' : ''}${mapLine}\n🌐 View full details & all photos:\n${propUrl}\n\n🌍 Website:\n${mainUrl}\n\n📞 Kwan\n☎️ 092-005-6640\n☎️ 090-650-7558\n💬 LINE: @realcreamthailand\n\n${tags}`.trim();
}
function generatePostText(){
  const p = getForm();
  const mode = $('postLang') ? $('postLang').value : 'both';
  const fbParts = [];
  if(mode === 'en' || mode === 'both') fbParts.push(makePostBlock(p,'en'));
  if(mode === 'th' || mode === 'both') fbParts.push(makePostBlock(p,'th'));
  $('facebookPost').value = fbParts.join('\n\n━━━━━━━━━━━━━━━\n\n');

  const oldMode = mode;
  const igParts = [];
  if(oldMode === 'en' || oldMode === 'both') igParts.push(makePostBlock(p,'en'));
  if(oldMode === 'th' || oldMode === 'both') igParts.push(makePostBlock(p,'th'));
  $('instagramPost').value = igParts.join('\n\n━━━━━━━━━━━━━━━\n\n');
}
async function copyPost(id){
  const el = $(id);
  if(!el || !el.value.trim()){ alert('Önce Generate Post Text bas.'); return; }
  try{
    await navigator.clipboard.writeText(el.value);
    alert('Kopyalandı');
  }catch(e){
    el.select();
    document.execCommand('copy');
    alert('Kopyalandı');
  }
}


function loadCustomers(){
  try{ customers = JSON.parse(localStorage.getItem('siriland_customers') || '[]'); }
  catch(e){ customers=[]; }
}
function saveCustomers(){ localStorage.setItem('siriland_customers', JSON.stringify(customers)); }
function nextCustomerId(){
  let max=0; customers.forEach(c=>{const m=String(c.id||'').match(/^CUS-(\d+)$/i); if(m) max=Math.max(max,+m[1]);});
  return 'CUS-'+String(max+1).padStart(4,'0');
}
const customerFields=['customerId','customerName','customerCountry','customerPhone','customerLine','customerWhatsapp','customerEmail','customerBudgetMin','customerBudgetMax','customerCity','customerType','customerDeal','customerStatus','customerPropertyIds','customerLastContact','customerFollowup','customerViewing','customerNotes'];
function getCustomerForm(){
  const c={
    id:$('customerId').value.trim() || nextCustomerId(),
    name:$('customerName').value.trim(),
    country:$('customerCountry').value.trim(),
    phone:$('customerPhone').value.trim(),
    line:$('customerLine').value.trim(),
    whatsapp:$('customerWhatsapp').value.trim(),
    email:$('customerEmail').value.trim(),
    budgetMin:$('customerBudgetMin').value.trim(),
    budgetMax:$('customerBudgetMax').value.trim(),
    city:$('customerCity').value.trim(),
    type:$('customerType').value.trim(),
    deal:$('customerDeal').value.trim(),
    status:$('customerStatus').value,
    propertyIds:$('customerPropertyIds').value.split(',').map(x=>x.trim()).filter(Boolean),
    lastContact:$('customerLastContact').value,
    followup:$('customerFollowup').value,
    viewing:$('customerViewing').value,
    notes:$('customerNotes').value.trim()
  };
  const old=customers.find(x=>x.id===c.id);
  c.createdAt = old?.createdAt || new Date().toISOString().slice(0,10);
  c.updatedAt = new Date().toISOString().slice(0,10);
  return c;
}
function setCustomerForm(c){
  $('customerId').value=c.id||''; $('customerName').value=c.name||''; $('customerCountry').value=c.country||'';
  $('customerPhone').value=c.phone||''; $('customerLine').value=c.line||''; $('customerWhatsapp').value=c.whatsapp||''; $('customerEmail').value=c.email||'';
  $('customerBudgetMin').value=c.budgetMin||''; $('customerBudgetMax').value=c.budgetMax||''; $('customerCity').value=c.city||''; $('customerType').value=c.type||''; $('customerDeal').value=c.deal||'';
  $('customerStatus').value=c.status||'New'; $('customerPropertyIds').value=(c.propertyIds||[]).join(', ');
  $('customerLastContact').value=c.lastContact||''; $('customerFollowup').value=c.followup||''; $('customerViewing').value=c.viewing||''; $('customerNotes').value=c.notes||'';
}
function clearCustomerForm(){ customerFields.forEach(id=>{ const el=$(id); if(el) el.value=''; }); $('customerStatus').value='New'; $('customerId').value=nextCustomerId(); }
function upsertCustomer(){
  const c=getCustomerForm();
  if(!c.name && !c.phone && !c.line && !c.whatsapp){ alert('Müşteri için en az isim veya telefon/LINE/WhatsApp gir.'); return; }
  const i=customers.findIndex(x=>x.id===c.id); if(i>=0) customers[i]=c; else customers.push(c);
  saveCustomers(); renderCRM(); clearCustomerForm(); alert('Customer saved: '+c.id);
}
window.editCustomer=id=>{ const c=customers.find(x=>x.id===id); if(c) setCustomerForm(c); };
window.deleteCustomer=id=>{ if(confirm(id+' silinsin mi?')){ customers=customers.filter(x=>x.id!==id); saveCustomers(); renderCRM(); clearCustomerForm(); } };
function renderCRM(){
  const today=new Date().toISOString().slice(0,10);
  const byStatus=s=>customers.filter(c=>String(c.status||'New').toLowerCase()===s.toLowerCase()).length;
  if($('crmTotal')) $('crmTotal').textContent=customers.length;
  if($('crmNew')) $('crmNew').textContent=byStatus('New');
  if($('crmToday')) $('crmToday').textContent=customers.filter(c=>c.followup && c.followup<=today && !['Closed','Lost'].includes(c.status)).length;
  if($('crmClosed')) $('crmClosed').textContent=byStatus('Closed');
  const stages=['New','Contacted','Viewing','Negotiation','Reserved','Closed'];
  if($('crmPipeline')) $('crmPipeline').innerHTML=stages.map(st=>`<div class="crmStage"><h4>${st}</h4>${customers.filter(c=>(c.status||'New')===st).slice(0,4).map(c=>`<span class="crmChip">${escapeHtml(c.name||c.id)}</span>`).join('')||'<span class="muted">-</span>'}</div>`).join('');
  const q=($('crmSearchInput')?.value||'').toLowerCase().trim(); const filt=$('crmStatusFilter')?.value||'all';
  const list=customers.filter(c=>{
    const blob=[c.id,c.name,c.country,c.phone,c.line,c.whatsapp,c.email,c.city,c.type,c.deal,c.status,(c.propertyIds||[]).join(' '),c.notes].join(' ').toLowerCase();
    return (filt==='all'||c.status===filt) && (!q||blob.includes(q));
  }).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
  if($('customerList')) $('customerList').innerHTML=list.map(c=>`<div class="item"><div><b>${escapeHtml(c.id)}</b> — ${escapeHtml(c.name||'No name')} <span class="crmChip">${escapeHtml(c.status||'New')}</span><br><span class="muted">${escapeHtml(c.country||'')} • ${escapeHtml(c.phone||c.line||c.whatsapp||'')} • Budget: ${escapeHtml((c.budgetMin||'')+' - '+(c.budgetMax||''))}</span><br><span class="muted">Follow-up: ${escapeHtml(c.followup||'-')} • Properties: ${escapeHtml((c.propertyIds||[]).join(', ')||'-')}</span></div><div><button class="btn dark" onclick="editCustomer('${escapeHtml(c.id)}')">Düzenle</button><button class="btn red" onclick="deleteCustomer('${escapeHtml(c.id)}')">Sil</button></div></div>`).join('') || '<p class="muted">No customers yet.</p>';
}
function exportCustomersJson(){ saveCustomers(); download('customers.json', JSON.stringify(customers,null,2), 'application/json'); }
function importCustomersJson(file){
  const rd=new FileReader(); rd.onload=()=>{try{const arr=JSON.parse(rd.result); if(!Array.isArray(arr)) throw new Error('customers.json array olmalı'); customers=arr; saveCustomers(); renderCRM(); alert('CRM yüklendi: '+customers.length+' müşteri');}catch(e){alert('CRM import hatası: '+e.message)}}; rd.readAsText(file);
}

$('langTabs').addEventListener('click',e=>{const b=e.target.closest('[data-lang]');if(b)switchLang(b.dataset.lang)});
$('saveBtn').onclick=()=>upsertCurrent(false);
$('clearBtn').onclick=clearForm;
$('validateBtn').onclick=()=>{upsertCurrent(true);validate()};
$('downloadJson').onclick=()=>{ if(!exportReady()) return; download('properties.json',exportJsonText(),'application/json')};
$('downloadJs').onclick=()=>{ if(!exportReady()) return; download('properties.js',makeJs(),'text/javascript')};
$('downloadZip').onclick=buildZip;
$('parseBtn').onclick=parseFbText;

$('generatePostBtn').onclick=generatePostText;
$('generateSummaryBtn').onclick=generateSummary;
$('copyFbBtn').onclick=()=>copyPost('facebookPost');
$('copyIgBtn').onclick=()=>copyPost('instagramPost');
$('saveCustomerBtn').onclick=upsertCustomer;
$('clearCustomerBtn').onclick=clearCustomerForm;
$('exportCustomersBtn').onclick=exportCustomersJson;
$('importCustomersBtn').onclick=()=>$('importCustomersFile').click();
$('importCustomersFile').onchange=e=>{const f=e.target.files[0]; if(f) importCustomersJson(f);};
$('crmSearchBtn').onclick=renderCRM;
$('crmSearchInput').oninput=renderCRM;
$('crmStatusFilter').onchange=renderCRM;

$('city').onchange=()=>syncIdToCity(true);
$('type').addEventListener('input',updatePropertyTypeFields);
$('imageFiles').onchange=e=>{
  imageFiles=Array.from(e.target.files||[]);
  existingImageList=[];
  analyzeMediaFiles();
};
document.addEventListener('input',e=>{ if(e.target && ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) updateQualityScore(); });
$('importBtn').onclick=()=>$('importFile').click();
$('importFile').onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>{
    try{
      const loaded=extractProperties(rd.result).map(cleanProperty);
      if(properties.length && loaded.length<properties.length){
        const ok=confirm(`Seçilen dosyada ${loaded.length} ilan var; mevcut listede ${properties.length} ilan bulunuyor.\n\nEksik dosya olabilir. Yine de değiştirmek istiyor musun?`);
        if(!ok)return;
      }
      properties=loaded;
      localStorage.setItem('siriland_last_property_count',String(properties.length));
      localStorage.setItem('siriland_properties_backup',JSON.stringify(properties));
      propertyListPage=1;renderList();clearForm();validate();renderCRM();
      alert('Yüklendi: '+properties.length+' ilan');
    }catch(err){alert('Okuma hatası: '+err.message)}
  };
  rd.readAsText(f)
};

loadCustomers();
initLangForms();
updateUiLang('en');
updatePropertyTypeFields();
fetch('properties.js?v='+Date.now(),{cache:'no-store'}).then(r=>{
  if(!r.ok)throw new Error('properties.js yüklenemedi: '+r.status);
  return r.text();
}).then(s=>{
  const loaded=extractProperties(s).map(cleanProperty);
  const previousCount=Number(localStorage.getItem('siriland_last_property_count')||0);
  if(previousCount && loaded.length<previousCount){
    const ok=confirm(`UYARI: Bu properties.js dosyasında ${loaded.length} ilan var. Önceki kayıt sayısı ${previousCount}.\n\nEksik veri ihtimali var. Yine de yüklemek istiyor musun?`);
    if(!ok)throw new Error('Düşük ilan sayılı dosya kullanıcı tarafından reddedildi.');
  }
  properties=loaded;
  localStorage.setItem('siriland_last_property_count',String(properties.length));
  localStorage.setItem('siriland_properties_backup',JSON.stringify(properties));
  renderList();clearForm();validate();renderCRM();clearCustomerForm();
}).catch(err=>{
  console.warn(err);
  try{
    const backup=JSON.parse(localStorage.getItem('siriland_properties_backup')||'[]');
    if(Array.isArray(backup)&&backup.length){
      properties=backup.map(cleanProperty);
      alert('properties.js yüklenemedi. Tarayıcıdaki son güvenli yedek açıldı: '+properties.length+' ilan');
    }
  }catch(e){}
  clearForm();renderList();validate();renderCRM();clearCustomerForm();
});


// Sprint 4.3 — GitHub Assistant
const GH43_SETTINGS_KEY='siriland_gh43_settings';
const GH43_SNAPSHOT_KEY='siriland_gh43_snapshot';
const GH43_LAST_EXPORT_KEY='siriland_gh43_last_export';
function gh43Read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch(e){return fallback}}
function gh43Write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(e){console.warn('GH43 storage:',e)}}
function gh43Snapshot(list=properties){const out={};(list||[]).forEach(p=>{if(!p||!p.id)return;const c=JSON.parse(JSON.stringify(p));delete c.updatedAt;out[p.id]=JSON.stringify(c)});return out}
function gh43GetChanges(){const previous=gh43Read(GH43_SNAPSHOT_KEY,{}),current=gh43Snapshot();const added=[],updated=[],deleted=[];Object.keys(current).forEach(id=>{if(!(id in previous))added.push(id);else if(previous[id]!==current[id])updated.push(id)});Object.keys(previous).forEach(id=>{if(!(id in current))deleted.push(id)});return{added,updated,deleted}}
function gh43FilesChanged(){return['properties.js','properties.json','data/properties.json','crm/customers.json','publish/export-summary.json','publish/changes.json','UPLOAD_INSTRUCTIONS.txt']}
function gh43CommitText(c){const count=c.added.length+c.updated.length+c.deleted.length;const title=count?`Update ${count} property record${count===1?'':'s'}`:'Refresh property export';const lines=[title,'',`Added: ${c.added.length}`,`Updated: ${c.updated.length}`,`Deleted: ${c.deleted.length}`];if(c.added.length)lines.push('',`New listings: ${c.added.join(', ')}`);if(c.updated.length)lines.push(`Updated listings: ${c.updated.join(', ')}`);if(c.deleted.length)lines.push(`Deleted listings: ${c.deleted.join(', ')}`);return lines.join('\n')}
async function gh43Copy(text,message){try{await navigator.clipboard.writeText(text)}catch(e){const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}alert(message)}
function gh43Render(){if(!$('gh43Panel'))return;const c=gh43GetChanges(),files=gh43FilesChanged(),last=gh43Read(GH43_LAST_EXPORT_KEY,null),settings=gh43Read(GH43_SETTINGS_KEY,{repository:'SIRILAND-ChiangMai/siriland-realestate',branch:'main'});$('gh43Repository').value=settings.repository||'SIRILAND-ChiangMai/siriland-realestate';$('gh43Branch').value=settings.branch||'main';$('gh43CommitMessage').value=gh43CommitText(c);$('gh43Files').innerHTML=files.map(x=>`<div class="gh43-row"><b>${escapeHtml(x)}</b><span>CHANGED</span></div>`).join('');$('gh43Changes').innerHTML=[['New Listings',c.added],['Updated Listings',c.updated],['Deleted Listings',c.deleted]].map(([label,list])=>`<div class="gh43-row"><b>${label}</b><span>${list.length}${list.length?' · '+escapeHtml(list.join(', ')):''}</span></div>`).join('');const ready=!!last;const status=$('gh43Status');status.textContent=ready?'PUSH READY':'EXPORT REQUIRED';status.className='gh43-status '+(ready?'ready':'warn');$('gh43Summary').textContent=['SIRILAND GITHUB ASSISTANT','Repository: '+$('gh43Repository').value,'Branch: '+$('gh43Branch').value,'Status: '+(ready?'PUSH READY':'RUN ZIP EXPORT FIRST'),last?'Export version: '+last.version:'Export version: —',last?'Exported at: '+last.exportedAt:'Exported at: —','',$('gh43CommitMessage').value,'','Files Changed ('+files.length+')',...files.map(x=>'• '+x)].join('\n')}
function gh43Init(){if(!$('gh43Panel'))return;const settings=gh43Read(GH43_SETTINGS_KEY,{repository:'SIRILAND-ChiangMai/siriland-realestate',branch:'main'});$('gh43Repository').value=settings.repository;$('gh43Branch').value=settings.branch;$('gh43RefreshBtn').onclick=gh43Render;$('gh43CopyCommitBtn').onclick=()=>gh43Copy($('gh43CommitMessage').value,'Commit mesajı kopyalandı.');$('gh43CopySummaryBtn').onclick=()=>gh43Copy($('gh43Summary').textContent,'GitHub özeti kopyalandı.');['gh43Repository','gh43Branch'].forEach(id=>$(id).addEventListener('change',()=>{gh43Write(GH43_SETTINGS_KEY,{repository:$('gh43Repository').value.trim(),branch:$('gh43Branch').value.trim()});gh43Render()}));gh43Render()}
const _gh43BuildZip=buildZip;
buildZip=async function(){const before=gh43GetChanges();const result=await _gh43BuildZip();const now=new Date();const version=now.getFullYear()+'.'+String(now.getMonth()+1).padStart(2,'0')+'.'+String(now.getDate()).padStart(2,'0')+'-'+String(now.getHours()).padStart(2,'0')+String(now.getMinutes()).padStart(2,'0');gh43Write(GH43_LAST_EXPORT_KEY,{version,exportedAt:now.toLocaleString(),changes:before,files:gh43FilesChanged()});gh43Write(GH43_SNAPSHOT_KEY,gh43Snapshot());gh43Render();return result};
window.addEventListener('DOMContentLoaded',gh43Init);


document.addEventListener('click',e=>{
  if(e.target.closest('#refreshDashboardBtn')) renderDashboard();
  const missingItem=e.target.closest('.dashboardMissingItem[data-edit-id]');
  if(missingItem){
    const p=properties.find(x=>x.id===missingItem.dataset.editId);
    if(p){setForm(p);window.scrollTo({top:0,behavior:'smooth'});}
  }
});


function mediaAddFiles(files){
  const incoming=Array.from(files||[]).filter(f=>String(f.type||'').startsWith('image/'));
  if(!incoming.length)return;
  imageFiles=[...imageFiles,...incoming];
  existingImageList=[];
  analyzeMediaFiles();
}
function mediaInit(){
  const zone=$('imageDropZone');
  if($('chooseImagesBtn'))$('chooseImagesBtn').onclick=()=>$('imageFiles').click();
  if(zone){
    ['dragenter','dragover'].forEach(name=>zone.addEventListener(name,e=>{e.preventDefault();zone.classList.add('dragging')}));
    ['dragleave','drop'].forEach(name=>zone.addEventListener(name,e=>{e.preventDefault();zone.classList.remove('dragging')}));
    zone.addEventListener('drop',e=>mediaAddFiles(e.dataTransfer?.files));
    zone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('imageFiles').click()}});
  }
  if($('sortImagesBtn'))$('sortImagesBtn').onclick=()=>{imageFiles.sort((a,b)=>a.name.localeCompare(b.name));analyzeMediaFiles()};
  if($('refreshImageCheckBtn'))$('refreshImageCheckBtn').onclick=analyzeMediaFiles;
  if($('renamePreviewBtn'))$('renamePreviewBtn').onclick=()=>analyzeMediaFiles();
  if($('clearNewImagesBtn'))$('clearNewImagesBtn').onclick=()=>{
    imageFiles.forEach(f=>{if(f.__sirilandPreview)URL.revokeObjectURL(f.__sirilandPreview)});
    imageFiles=[];mediaAnalysis=[];renderImages();
  };
  ['mediaRenamePrefix','mediaMinResolution','mediaMaxFileSize'].forEach(id=>{
    $(id)?.addEventListener(id==='mediaRenamePrefix'?'input':'change',()=>analyzeMediaFiles());
  });
  renderMediaSummary();
}
window.addEventListener('DOMContentLoaded',mediaInit);

function initPropertyListPro(){
  ['propertyListSearch','propertyListCity','propertyListType','propertyListStatus'].forEach(id=>{
    $(id)?.addEventListener(id==='propertyListSearch'?'input':'change',()=>{propertyListPage=1;renderList()});
  });
  $('propertyListClear')?.addEventListener('click',()=>{
    if($('propertyListSearch'))$('propertyListSearch').value='';
    ['propertyListCity','propertyListType','propertyListStatus'].forEach(id=>{if($(id))$(id).value='all'});
    propertyListPage=1;renderList();
  });
  $('propertyListPagination')?.addEventListener('click',e=>{
    const btn=e.target.closest('[data-list-page]');if(!btn)return;
    propertyListPage=Number(btn.dataset.listPage)||1;renderList();
    $('list')?.scrollTo({top:0,behavior:'smooth'});
  });
  $('propertyCitySummary')?.addEventListener('click',e=>{
    const btn=e.target.closest('[data-list-city]');if(!btn)return;
    if($('propertyListCity'))$('propertyListCity').value=btn.dataset.listCity;
    propertyListPage=1;renderList();
  });
}
window.addEventListener('DOMContentLoaded',initPropertyListPro);


const DB_KEYS={
  versions:'siriland_db_versions_v1',
  trash:'siriland_db_trash_v1',
  baseline:'siriland_db_baseline_v1'
};
function dbNow(){return new Date().toISOString()}
function dbVersionId(){
  const d=new Date();
  const p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function dbClone(v){return JSON.parse(JSON.stringify(v))}
function dbGetVersions(){try{return JSON.parse(localStorage.getItem(DB_KEYS.versions)||'[]')}catch(e){return[]}}
function dbSetVersions(v){localStorage.setItem(DB_KEYS.versions,JSON.stringify(v.slice(0,20)))}
function dbGetTrash(){try{return JSON.parse(localStorage.getItem(DB_KEYS.trash)||'[]')}catch(e){return[]}}
function dbSetTrash(v){localStorage.setItem(DB_KEYS.trash,JSON.stringify(v))}
function dbGetBaseline(){try{return JSON.parse(localStorage.getItem(DB_KEYS.baseline)||'[]')}catch(e){return[]}}
function dbSetBaseline(v){localStorage.setItem(DB_KEYS.baseline,JSON.stringify(v))}
function dbSignature(p){
  const copy=dbClone(p||{});
  delete copy.updatedAt;
  return JSON.stringify(copy);
}
function dbAnalyze(list=properties){
  const ids=list.map(p=>String(p.id||'').trim());
  const duplicateIds=ids.filter((id,i)=>id&&ids.indexOf(id)!==i);
  const missingId=list.filter(p=>!String(p.id||'').trim());
  const missingImages=list.filter(p=>!Array.isArray(p.images)||!p.images.length);
  const missingPrices=list.filter(p=>isMissingValue(p.price||p.salePrice||p.rentPrice));
  const missingTranslations=list.filter(p=>{
    const title=p.title||{},desc=p.description||{};
    return langs.some(l=>!pick(title,l)||!pick(desc,l));
  });
  return {
    duplicateIds:[...new Set(duplicateIds)],
    missingId,
    missingImages,
    missingPrices,
    missingTranslations,
    cities:[...new Set(list.map(p=>p.city).filter(Boolean))]
  };
}
function dbCompare(current=properties,baseline=dbGetBaseline()){
  const oldMap=new Map((baseline||[]).map(p=>[p.id,p]));
  const newMap=new Map((current||[]).map(p=>[p.id,p]));
  const added=[],updated=[],deleted=[];
  for(const [id,p] of newMap){
    if(!oldMap.has(id))added.push(id);
    else if(dbSignature(p)!==dbSignature(oldMap.get(id)))updated.push(id);
  }
  for(const [id] of oldMap){if(!newMap.has(id))deleted.push(id)}
  return {added,updated,deleted};
}
function dbSaveCurrentSnapshot(label='Manual backup'){
  const version={
    id:dbVersionId(),
    createdAt:dbNow(),
    label,
    count:properties.length,
    properties:dbClone(properties)
  };
  const versions=dbGetVersions();
  versions.unshift(version);
  dbSetVersions(versions);
  dbSetBaseline(dbClone(properties));
  localStorage.setItem('siriland_last_property_count',String(properties.length));
  localStorage.setItem('siriland_properties_backup',JSON.stringify(properties));
  return version;
}
function dbDownload(filename,content,type='application/json'){
  const blob=content instanceof Blob?content:new Blob([content],{type});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
function dbRender(){
  const a=dbAnalyze();
  const versions=dbGetVersions();
  const trash=dbGetTrash();
  const changes=dbCompare();
  const set=(id,v)=>{if($(id))$(id).textContent=v};
  set('dbTotalProperties',properties.length);
  set('dbTotalCities',a.cities.length);
  set('dbDuplicateIds',a.duplicateIds.length);
  set('dbMissingIds',a.missingId.length);
  set('dbMissingImages',a.missingImages.length);
  set('dbMissingPrices',a.missingPrices.length);
  set('dbTrashCount',trash.length);
  set('dbVersion',versions[0]?.id||'—');

  const healthy=!a.duplicateIds.length&&!a.missingId.length;
  if($('dbStatusBadge')){
    $('dbStatusBadge').textContent=healthy?'READY':'CHECK';
    $('dbStatusBadge').classList.toggle('bad',!healthy);
  }

  if($('dbHealthReport')) $('dbHealthReport').innerHTML=[
    ['Duplicate ID',a.duplicateIds.length,a.duplicateIds.join(', ')||'Temiz'],
    ['Eksik ID',a.missingId.length,a.missingId.map((_,i)=>'#'+(i+1)).join(', ')||'Temiz'],
    ['Eksik Fotoğraf',a.missingImages.length,a.missingImages.slice(0,8).map(p=>p.id).join(', ')||'Temiz'],
    ['Eksik Fiyat',a.missingPrices.length,a.missingPrices.slice(0,8).map(p=>p.id).join(', ')||'Temiz'],
    ['Eksik Çeviri',a.missingTranslations.length,a.missingTranslations.slice(0,8).map(p=>p.id).join(', ')||'Temiz']
  ].map(([label,count,detail])=>`<div class="dbHealthRow"><span>${label}</span><b>${count}</b><small>${escapeHtml(detail)}</small></div>`).join('');

  if($('dbVersionHistory')) $('dbVersionHistory').innerHTML=versions.length?versions.map(v=>
    `<div class="dbVersionItem"><div><b>${escapeHtml(v.id)}</b><span>${escapeHtml(v.label||'Backup')} • ${v.count} ilan</span></div><button class="btn dark" type="button" data-db-restore="${escapeHtml(v.id)}">Restore</button></div>`
  ).join(''):'<span class="muted">Henüz yedek yok.</span>';

  if($('dbChangesReport')) $('dbChangesReport').innerHTML=[
    `<div><b>Added (${changes.added.length})</b><span>${escapeHtml(changes.added.join(', ')||'—')}</span></div>`,
    `<div><b>Updated (${changes.updated.length})</b><span>${escapeHtml(changes.updated.join(', ')||'—')}</span></div>`,
    `<div><b>Deleted (${changes.deleted.length})</b><span>${escapeHtml(changes.deleted.join(', ')||'—')}</span></div>`
  ].join('');

  if($('dbTrashList')) $('dbTrashList').innerHTML=trash.length?trash.map(p=>
    `<div class="dbTrashItem"><div><b>${escapeHtml(p.id||'No ID')}</b><span>${escapeHtml(pick(p.title,'en')||pick(p.title,'th')||'Başlıksız')}</span></div><button class="btn" type="button" data-db-trash-restore="${escapeHtml(p.id||'')}">Geri Yükle</button></div>`
  ).join(''):'<span class="muted">Recycle Bin boş.</span>';
}
function dbMergeById(incoming){
  const currentMap=new Map(properties.map(p=>[String(p.id||'').trim(),p]));
  const added=[],updated=[],skipped=[];
  incoming.forEach(raw=>{
    const p=cleanProperty(raw);
    const id=String(p.id||'').trim();
    if(!id){skipped.push('(missing id)');return}
    if(!currentMap.has(id)){currentMap.set(id,p);added.push(id);return}
    const existing=currentMap.get(id);
    const merged={...existing,...p};
    merged.title={...(existing.title||{}),...(p.title||{})};
    merged.description={...(existing.description||{}),...(p.description||{})};
    merged.highlights={...(existing.highlights||{}),...(p.highlights||{})};
    if(dbSignature(existing)!==dbSignature(merged))updated.push(id);
    currentMap.set(id,merged);
  });
  properties=[...currentMap.values()].sort((a,b)=>String(a.id||'').localeCompare(String(b.id||''),undefined,{numeric:true}));
  return {added,updated,skipped};
}
function dbInit(){
  if(!dbGetBaseline().length)dbSetBaseline(dbClone(properties));
  dbRender();

  $('dbCreateBackupBtn')?.addEventListener('click',()=>{
    const v=dbSaveCurrentSnapshot('Manual backup');
    dbRender();alert('Yedek oluşturuldu: '+v.id);
  });
  $('dbExportFullBtn')?.addEventListener('click',()=>{
    dbSaveCurrentSnapshot('Full export');
    const content='window.SIRILAND_PROPERTIES = '+JSON.stringify(properties,null,2)+';\\nconst properties = window.SIRILAND_PROPERTIES;\\n';
    dbDownload('properties-full-'+dbVersionId()+'.js',content,'text/javascript');
    dbRender();
  });
  $('dbExportChangesBtn')?.addEventListener('click',()=>{
    const changes=dbCompare();
    const payload={
      version:dbVersionId(),
      createdAt:dbNow(),
      added:properties.filter(p=>changes.added.includes(p.id)),
      updated:properties.filter(p=>changes.updated.includes(p.id)),
      deleted:changes.deleted
    };
    dbDownload('property-changes-'+payload.version+'.json',JSON.stringify(payload,null,2));
  });
  $('dbImportMergeBtn')?.addEventListener('click',()=>$('dbImportMergeFile')?.click());
  $('dbImportMergeFile')?.addEventListener('change',e=>{
    const f=e.target.files?.[0];if(!f)return;
    const rd=new FileReader();
    rd.onload=()=>{
      try{
        const incoming=extractProperties(rd.result);
        dbSaveCurrentSnapshot('Before merge');
        const result=dbMergeById(incoming);
        dbSaveCurrentSnapshot('After merge');
        renderList();dbRender();
        alert(`Merge tamamlandı. Added: ${result.added.length}, Updated: ${result.updated.length}, Skipped: ${result.skipped.length}`);
      }catch(err){alert('Merge hatası: '+err.message)}
    };
    rd.readAsText(f);
  });
  $('dbCompareBtn')?.addEventListener('click',()=>{dbRender();document.getElementById('dbChangesReport')?.scrollIntoView({behavior:'smooth',block:'center'})});
  $('dbOpenTrashBtn')?.addEventListener('click',()=>document.getElementById('dbTrashList')?.scrollIntoView({behavior:'smooth',block:'center'}));

  document.addEventListener('click',e=>{
    const restore=e.target.closest('[data-db-restore]');
    if(restore){
      const v=dbGetVersions().find(x=>x.id===restore.dataset.dbRestore);
      if(v&&confirm(`${v.id} sürümüne dönülsün mü? Mevcut liste önce yedeklenecek.`)){
        dbSaveCurrentSnapshot('Before restore');
        properties=dbClone(v.properties||[]);
        dbSetBaseline(dbClone(properties));
        renderList();clearForm();validate();dbRender();
      }
    }
    const trashRestore=e.target.closest('[data-db-trash-restore]');
    if(trashRestore){
      const id=trashRestore.dataset.dbTrashRestore;
      const trash=dbGetTrash();
      const p=trash.find(x=>x.id===id);
      if(p){
        const clean=dbClone(p);delete clean.__deletedAt;
        if(!properties.some(x=>x.id===id))properties.push(clean);
        dbSetTrash(trash.filter(x=>x.id!==id));
        dbSaveCurrentSnapshot('Restore '+id);
        renderList();dbRender();
      }
    }
  });
}
window.addEventListener('DOMContentLoaded',dbInit);

$('saveBtn')?.addEventListener('click',()=>setTimeout(()=>{dbSaveCurrentSnapshot('Property save');dbRender()},0));


/* Integrated Publish Manager PRO */
const PUBLISH_DB_NAME='siriland-publish-handles-v1';
const PUBLISH_STORE='handles';
let publishHandles={cms:null,github:null,backup:null};
let lastPublishCommit='';

function publishLog(message,type='info'){
  const el=$('integratedPublishLog');
  if(!el)return;
  const time=new Date().toLocaleTimeString();
  el.innerHTML+=`<div class="${type}"><b>${time}</b> ${escapeHtml(message)}</div>`;
  el.scrollTop=el.scrollHeight;
}
function publishSetProgress(percent,text){
  if($('publishProgressFill'))$('publishProgressFill').style.width=Math.max(0,Math.min(100,percent))+'%';
  if($('publishProgressText'))$('publishProgressText').textContent=text||'';
}
function publishSetCheck(id,ok){
  const el=$(id);if(!el)return;
  el.textContent=ok?'✓':'✕';
  el.className=ok?'publishCheckOk':'publishCheckBad';
}
function publishSupported(){
  return 'showDirectoryPicker' in window && window.isSecureContext;
}
function publishOpenDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(PUBLISH_DB_NAME,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(PUBLISH_STORE))req.result.createObjectStore(PUBLISH_STORE)};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function publishSaveHandle(key,handle){
  try{
    const db=await publishOpenDb();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(PUBLISH_STORE,'readwrite');
      tx.objectStore(PUBLISH_STORE).put(handle,key);
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    });
  }catch(e){console.warn('Handle save failed',e)}
}
async function publishLoadHandle(key){
  try{
    const db=await publishOpenDb();
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(PUBLISH_STORE,'readonly');
      const req=tx.objectStore(PUBLISH_STORE).get(key);
      req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
    });
  }catch(e){return null}
}
async function publishClearHandles(){
  try{
    const db=await publishOpenDb();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(PUBLISH_STORE,'readwrite');
      tx.objectStore(PUBLISH_STORE).clear();
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    });
  }catch(e){}
  publishHandles={cms:null,github:null,backup:null};
  publishRenderPaths();
}
async function publishRequestPermission(handle,mode='readwrite'){
  if(!handle)return false;
  const opts={mode};
  if((await handle.queryPermission(opts))==='granted')return true;
  return (await handle.requestPermission(opts))==='granted';
}
function publishRenderPaths(){
  if($('publishCmsPath'))$('publishCmsPath').textContent=publishHandles.cms?.name||'Seçilmedi';
  if($('publishGithubPath'))$('publishGithubPath').textContent=publishHandles.github?.name||'Seçilmedi';
  if($('publishBackupPath'))$('publishBackupPath').textContent=publishHandles.backup?.name||'Seçilmedi';
  publishSetCheck('publishCheckBrowser',publishSupported());
  publishSetCheck('publishCheckCms',!!publishHandles.cms);
  publishSetCheck('publishCheckGithub',!!publishHandles.github);
  publishSetCheck('publishCheckBackup',!!publishHandles.backup);
  if($('publishBrowserBadge')){
    $('publishBrowserBadge').textContent=publishSupported()?'SUPPORTED':'CHROME / EDGE REQUIRED';
    $('publishBrowserBadge').classList.toggle('bad',!publishSupported());
  }
}
async function publishSelectFolder(key){
  if(!publishSupported()){
    alert('Bu özellik yalnızca Chrome veya Microsoft Edge üzerinde çalışır. Admin sayfasını Chrome/Edge ile aç.');
    return;
  }
  try{
    const handle=await window.showDirectoryPicker({mode:'readwrite'});
    publishHandles[key]=handle;
    await publishSaveHandle(key,handle);
    publishRenderPaths();
    publishLog(`${key.toUpperCase()} klasörü seçildi: ${handle.name}`,'ok');
  }catch(e){
    if(e.name!=='AbortError')publishLog('Klasör seçme hatası: '+e.message,'error');
  }
}
async function publishGetEntry(dirHandle,pathParts){
  let current=dirHandle;
  for(let i=0;i<pathParts.length-1;i++){
    current=await current.getDirectoryHandle(pathParts[i],{create:false});
  }
  return current.getFileHandle(pathParts[pathParts.length-1],{create:false});
}
async function publishHasFile(dirHandle,name){
  try{await dirHandle.getFileHandle(name,{create:false});return true}catch(e){return false}
}
async function publishHasDirectory(dirHandle,name){
  try{await dirHandle.getDirectoryHandle(name,{create:false});return true}catch(e){return false}
}
async function publishTestPaths(){
  publishSetProgress(5,'Klasörler test ediliyor...');
  const result={browser:publishSupported(),cms:false,github:false,backup:false,properties:false,git:false};
  if(!result.browser){
    publishSetProgress(0,'Chrome / Edge gerekli');
    publishRenderPaths();
    return result;
  }
  if(publishHandles.cms){
    result.cms=await publishRequestPermission(publishHandles.cms);
    result.properties=result.cms&&await publishHasFile(publishHandles.cms,'properties.js');
  }
  if(publishHandles.github){
    result.github=await publishRequestPermission(publishHandles.github);
    result.git=result.github&&await publishHasDirectory(publishHandles.github,'.git');
  }
  if(publishHandles.backup)result.backup=await publishRequestPermission(publishHandles.backup);
  publishSetCheck('publishCheckCms',result.cms);
  publishSetCheck('publishCheckGithub',result.github);
  publishSetCheck('publishCheckBackup',result.backup);
  publishSetCheck('publishCheckProperties',result.properties);
  publishSetCheck('publishCheckGit',result.git);
  const ok=Object.values(result).every(Boolean);
  publishSetProgress(ok?100:35,ok?'Tüm yollar hazır':'Eksik klasör veya izin var');
  publishLog(ok?'Tüm yollar başarıyla test edildi.':'Path testi tamamlandı; kırmızı işaretleri kontrol et.',ok?'ok':'error');
  return result;
}
async function publishFileHash(file){
  const buffer=await file.arrayBuffer();
  const digest=await crypto.subtle.digest('SHA-256',buffer);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function publishEnsureDirectory(root,parts){
  let current=root;
  for(const part of parts)current=await current.getDirectoryHandle(part,{create:true});
  return current;
}
async function publishWriteFile(root,relativePath,fileOrBlob){
  const parts=relativePath.split('/').filter(Boolean);
  const dir=await publishEnsureDirectory(root,parts.slice(0,-1));
  const handle=await dir.getFileHandle(parts.at(-1),{create:true});
  const writable=await handle.createWritable();
  await writable.write(fileOrBlob);
  await writable.close();
}
async function publishReadFile(root,relativePath){
  try{
    const parts=relativePath.split('/').filter(Boolean);
    const handle=await publishGetEntry(root,parts);
    return await handle.getFile();
  }catch(e){return null}
}
async function publishWalkDirectory(dir,prefix='',list=[]){
  for await(const [name,handle] of dir.entries()){
    if(name==='.git'||name==='node_modules'||name==='Publish_Manager'||name==='Publish_Manager_v2.1')continue;
    const path=prefix?`${prefix}/${name}`:name;
    if(handle.kind==='directory')await publishWalkDirectory(handle,path,list);
    else if(!/\.(zip|tmp|bak)$/i.test(name))list.push({path,handle});
  }
  return list;
}
function publishStamp(){
  const d=new Date(),p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}
async function publishCreateBackup(){
  const stamp=publishStamp();
  const daily=await publishHandles.backup.getDirectoryHandle('Daily',{create:true});
  const day=stamp.slice(0,10);
  const dayDir=await daily.getDirectoryHandle(day,{create:true});
  const backupDir=await dayDir.getDirectoryHandle('Publish_'+stamp,{create:true});
  const files=await publishWalkDirectory(publishHandles.github);
  let done=0;
  for(const row of files){
    const file=await row.handle.getFile();
    await publishWriteFile(backupDir,row.path,file);
    done++;
    publishSetProgress(10+Math.round(done/Math.max(files.length,1)*30),`Backup: ${done}/${files.length}`);
  }
  return {name:'Publish_'+stamp,count:files.length};
}
async function publishCopyCmsToGithub(){
  const files=await publishWalkDirectory(publishHandles.cms);
  const result={newFiles:[],updatedFiles:[],unchanged:[]};
  let done=0;
  for(const row of files){
    const source=await row.handle.getFile();
    const target=await publishReadFile(publishHandles.github,row.path);
    if(!target){
      await publishWriteFile(publishHandles.github,row.path,source);
      result.newFiles.push(row.path);
    }else{
      const [a,b]=await Promise.all([publishFileHash(source),publishFileHash(target)]);
      if(a!==b){
        await publishWriteFile(publishHandles.github,row.path,source);
        result.updatedFiles.push(row.path);
      }else result.unchanged.push(row.path);
    }
    done++;
    publishSetProgress(45+Math.round(done/Math.max(files.length,1)*45),`Publish: ${done}/${files.length}`);
  }
  return result;
}
async function publishWriteReport(result,backup){
  const reports=await publishHandles.backup.getDirectoryHandle('PublishReports',{create:true});
  const name='Publish_'+publishStamp()+'.txt';
  const handle=await reports.getFileHandle(name,{create:true});
  const writable=await handle.createWritable();
  const commit=`Publish SIRILAND - ${properties.length} listings, ${result.newFiles.length} new, ${result.updatedFiles.length} updated`;
  const report=[
    'SIRILAND PUBLISH REPORT',
    '=======================',
    'Date: '+new Date().toLocaleString(),
    'Properties: '+properties.length,
    'Backup: '+backup.name,
    '',
    `NEW FILES (${result.newFiles.length})`,
    ...result.newFiles,
    '',
    `UPDATED FILES (${result.updatedFiles.length})`,
    ...result.updatedFiles,
    '',
    `UNCHANGED (${result.unchanged.length})`,
    ...result.unchanged,
    '',
    'COMMIT MESSAGE',
    commit,
    '',
    'STATUS',
    'READY FOR GITHUB DESKTOP'
  ].join('\r\n');
  await writable.write(report);await writable.close();
  return {commit,name};
}
async function integratedPublish(){
  const test=await publishTestPaths();
  if(!Object.values(test).every(Boolean)){
    alert('Önce tüm yolların yeşil olduğundan emin ol.');
    return;
  }
  if(!confirm('Önce GitHub repository yedeklenecek, sonra CMS dosyaları repository üzerine kopyalanacak. Devam edilsin mi?'))return;
  try{
    publishSetProgress(5,'Backup başlıyor...');
    publishLog('Publish işlemi başladı.','info');
    const backup=await publishCreateBackup();
    publishLog(`Backup tamamlandı: ${backup.name} (${backup.count} dosya)`,'ok');
    const result=await publishCopyCmsToGithub();
    publishLog(`Kopyalama tamamlandı: ${result.newFiles.length} yeni, ${result.updatedFiles.length} güncellendi.`,'ok');
    const report=await publishWriteReport(result,backup);
    lastPublishCommit=report.commit;
    if($('integratedCommitMessage'))$('integratedCommitMessage').value=report.commit;
    if($('publishNewCount'))$('publishNewCount').textContent=result.newFiles.length;
    if($('publishUpdatedCount'))$('publishUpdatedCount').textContent=result.updatedFiles.length;
    if($('publishUnchangedCount'))$('publishUnchangedCount').textContent=result.unchanged.length;
    if($('publishBackupStatus'))$('publishBackupStatus').textContent='OK';
    try{await navigator.clipboard.writeText(report.commit)}catch(e){}
    publishSetProgress(100,'PUBLISH HAZIR — GitHub Desktop’ta Commit + Push yap');
    publishLog(`Rapor oluşturuldu: ${report.name}`,'ok');
    publishLog(`Commit mesajı: ${report.commit}`,'ok');
    alert('PUBLISH HAZIR!\n\nCommit mesajı panoya kopyalandı.\nGitHub Desktop:\n1. Ctrl+V\n2. Commit to main\n3. Push origin');
  }catch(e){
    publishSetProgress(0,'Publish hatası');
    publishLog('PUBLISH ERROR: '+e.message,'error');
    alert('Publish hatası: '+e.message);
  }
}
async function integratedPublishInit(){
  publishHandles.cms=await publishLoadHandle('cms');
  publishHandles.github=await publishLoadHandle('github');
  publishHandles.backup=await publishLoadHandle('backup');
  publishRenderPaths();
  if($('integratedPublishLog'))$('integratedPublishLog').innerHTML='<div>Publish Manager hazır.</div>';
  $('selectCmsFolderBtn')?.addEventListener('click',()=>publishSelectFolder('cms'));
  $('selectGithubFolderBtn')?.addEventListener('click',()=>publishSelectFolder('github'));
  $('selectBackupFolderBtn')?.addEventListener('click',()=>publishSelectFolder('backup'));
  $('testPublishPathsBtn')?.addEventListener('click',publishTestPaths);
  $('integratedPublishBtn')?.addEventListener('click',integratedPublish);
  $('resetPublishFoldersBtn')?.addEventListener('click',async()=>{
    if(confirm('Kayıtlı klasör seçimleri sıfırlansın mı?')){await publishClearHandles();publishLog('Klasör seçimleri sıfırlandı.','info')}
  });
  $('copyPublishCommitBtn')?.addEventListener('click',async()=>{
    const text=$('integratedCommitMessage')?.value||lastPublishCommit;
    if(!text){alert('Henüz commit mesajı yok.');return}
    try{await navigator.clipboard.writeText(text);alert('Commit mesajı kopyalandı.')}catch(e){prompt('Commit message',text)}
  });
}
window.addEventListener('DOMContentLoaded',integratedPublishInit);
