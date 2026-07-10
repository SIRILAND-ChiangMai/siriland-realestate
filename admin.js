let properties=[];
let customers=[];
let currentLang='en';
let imageFiles=[];
let existingImageList=[];
let pendingFilesById={};
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
    const base=imageBaseFor(p);
    p.images=imageFiles.map((f,i)=>`images/${base}-${i+1}.${(f.name.split('.').pop()||'jpg').toLowerCase()}`);
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
function renderDashboard(){
  const total=properties.length;
  const sale=properties.filter(p=>dealText(p).includes('sale') || dealText(p).includes('ขาย')).length;
  const rent=properties.filter(p=>dealText(p).includes('rent') || dealText(p).includes('เช่า')).length;
  const available=properties.filter(p=>statusText(p).includes('available') || statusText(p).includes('พร้อม')).length;
  const sold=properties.filter(p=>statusText(p).includes('sold') || statusText(p).includes('ขายแล้ว')).length;
  const rented=properties.filter(p=>statusText(p).includes('rented') || statusText(p).includes('leased') || statusText(p).includes('เช่าแล้ว')).length;
  const missing=properties.filter(propertyHasMissing).length;
  const pending=Object.values(pendingFilesById).reduce((s,a)=>s+(a?a.length:0),0);
  const set=(id,v)=>{const el=$(id); if(el) el.textContent=v};
  set('statTotal',total); set('statSale',sale); set('statRent',rent); set('statAvailable',available); set('statSold',sold); set('statRented',rented); set('statMissing',missing); set('statPendingPhotos',pending);
  const byCreated=[...properties].sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,5);
  const byUpdated=[...properties].sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))).slice(0,5);
  if($('lastAddedList')) $('lastAddedList').innerHTML=byCreated.map(formatMiniProperty).join('')||'<span class="muted">Henüz ilan yok</span>';
  if($('lastUpdatedList')) $('lastUpdatedList').innerHTML=byUpdated.map(formatMiniProperty).join('')||'<span class="muted">Henüz ilan yok</span>';
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
function renderList(){
  renderDashboard();
  updateQualityScore();
  $('list').innerHTML=properties.map(p=>`<div class="item"><div><b>${escapeHtml(p.id)}</b> — ${escapeHtml(pick(p.title,'en')||pick(p.title,'th'))}<br><span class="muted">${escapeHtml(p.city||'')} • ${escapeHtml(p.price||'')} • ${(p.images||[]).length} foto</span></div><div><button class="btn dark" onclick="editProp('${escapeHtml(p.id)}')">Düzenle</button><button class="btn red" onclick="deleteProp('${escapeHtml(p.id)}')">Sil</button></div></div>`).join('');
}
function filePreview(f){ return URL.createObjectURL(f); }
function imageCard(src, name, i, existing=false){
  const cover=i===0?'<span class="coverTag">⭐ KAPAK</span>':'';
  const safe=escapeHtml(src);
  const title=existing ? (name||('Mevcut görsel '+(i+1))) : (name||('Yeni görsel '+(i+1)));
  return `<div class="imageCard" draggable="true" ondragstart="dragImgStart(${i}, ${existing})" ondragover="event.preventDefault()" ondrop="dropImg(${i}, ${existing})">
    <div class="thumbWrap" onclick="window.open('${safe}','_blank')"><img src="${safe}" onerror="this.src='images/logo.png'">${cover}</div>
    <div><div class="imgTitle">${i+1}. ${cover?'Kapak Fotoğrafı':'Fotoğraf'}</div><div class="imgPath">${escapeHtml(title)}</div>
    <div class="imgActions"><button class="btn" onclick="${existing?'coverExisting':'coverImg'}(${i})">⭐ Kapak Yap</button><button class="btn dark" onclick="${existing?'moveExisting':'moveImg'}(${i},-1)">↑ Yukarı</button><button class="btn dark" onclick="${existing?'moveExisting':'moveImg'}(${i},1)">↓ Aşağı</button>${existing?`<button class="btn red" onclick="removeExisting(${i})">Sil</button>`:''}</div></div>
  </div>`;
}
function renderImages(){
  if(imageFiles.length){
    $('imagePreview').innerHTML=imageFiles.map((f,i)=>imageCard(filePreview(f), f.name, i, false)).join('');
  } else {
    $('imagePreview').innerHTML=existingImageList.map((x,i)=>imageCard(x, x, i, true)).join('');
  }
}
let dragFromIndex=null; let dragExisting=false;
window.dragImgStart=(i,existing)=>{dragFromIndex=i;dragExisting=existing};
window.dropImg=(to,existing)=>{
  if(dragFromIndex===null || dragExisting!==existing) return;
  const arr=existing?existingImageList:imageFiles;
  const item=arr.splice(dragFromIndex,1)[0]; arr.splice(to,0,item);
  dragFromIndex=null; renderImages();
};
window.editProp=id=>{const p=properties.find(x=>x.id===id);if(p)setForm(p)};
window.deleteProp=id=>{if(confirm(id+' silinsin mi?')){properties=properties.filter(p=>p.id!==id);delete pendingFilesById[id];renderList();clearForm();validate()}};
window.moveImg=(i,d)=>{const j=i+d;if(j<0||j>=imageFiles.length)return;[imageFiles[i],imageFiles[j]]=[imageFiles[j],imageFiles[i]];renderImages()};
window.coverImg=i=>{if(i<=0||i>=imageFiles.length)return;const f=imageFiles.splice(i,1)[0];imageFiles.unshift(f);renderImages()};
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
    structuredFieldErrors(p).forEach(x=>hardErrors.push(x));
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
    const p=properties.find(x=>x.id===id); if(!p) continue;
    files.forEach((f,i)=>{const path=p.images[i]; if(path) zip.file(path,f);});
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
$('imageFiles').onchange=e=>{imageFiles=Array.from(e.target.files||[]);existingImageList=[];renderImages()};
document.addEventListener('input',e=>{ if(e.target && ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) updateQualityScore(); });
$('importBtn').onclick=()=>$('importFile').click();
$('importFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{properties=extractProperties(rd.result).map(cleanProperty);renderList();clearForm();validate();renderCRM();alert('Yüklendi: '+properties.length+' ilan')}catch(err){alert('Okuma hatası: '+err.message)}};rd.readAsText(f)};

loadCustomers();
initLangForms();
updateUiLang('en');
updatePropertyTypeFields();
fetch('properties.js?v='+Date.now(),{cache:'no-store'}).then(r=>r.text()).then(s=>{properties=extractProperties(s).map(cleanProperty);renderList();clearForm();validate()}).catch(err=>{console.warn(err);clearForm();renderList();validate();renderCRM();clearCustomerForm()});
