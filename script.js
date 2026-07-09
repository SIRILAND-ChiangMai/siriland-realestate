(() => {
  const DATA = window.SIRILAND_PROPERTIES || window.properties || [];
  const I18N = window.SIRILAND_I18N || {};
  let lang = localStorage.getItem('siriland_lang') || 'en';
  let currentList = DATA.slice();
  let modalProperty = null;
  let modalIndex = 0;
  let touchX = 0;

  const $ = (id) => document.getElementById(id);
  const t = (key) => (I18N[lang] && I18N[lang][key]) || (I18N.en && I18N.en[key]) || key;
  const pick = (value) => {
    const raw = (value && typeof value === 'object' && !Array.isArray(value)) ? (value[lang] || value.en || value.th || value.tr || value.zh || '') : (value || '');
    return translateText(raw);
  };
  const pickList = (value) => {
    const arr = value && typeof value === 'object' && !Array.isArray(value) ? (value[lang] || value.en || value.th || value.tr || value.zh || []) : (Array.isArray(value) ? value : []);
    return arr.map(translateText);
  };
  const safeImg = (arr) => (arr && arr.length ? arr[0] : 'images/logo.png');


  // ===== SIRILAND CMS PRO Sprint 3.1 helpers =====
  const CONTACT = { phoneDisplay:'092-005-6640', phoneTel:'0920056640', phoneIntl:'66920056640', line:'@realcreamthailand' };
  function propertyUrl(prop){
    const id = prop?.id || '';
    const host = window.location.hostname || '';
    const origin = window.location.origin || '';
    let basePath = window.location.pathname || '/';
    if(host.includes('github.io')){
      basePath = '/siriland-realestate/';
    } else {
      basePath = basePath.replace(/\/[^/]*$/, '/');
      if(!basePath || basePath === '/') basePath = '/';
    }
    return `${origin}${basePath}?property=${enc(id)}`;
  }
  function enc(v){ return encodeURIComponent(String(v || '')); }
  function getFavorites(){ try{return JSON.parse(localStorage.getItem('siriland_favorites')||'[]')}catch(e){return []} }
  function setFavorites(arr){ localStorage.setItem('siriland_favorites', JSON.stringify([...new Set(arr)])); }
  function isFavorite(id){ return getFavorites().includes(id); }
  function toggleFavorite(id){
    const fav=getFavorites();
    const next=fav.includes(id) ? fav.filter(x=>x!==id) : fav.concat(id);
    setFavorites(next);
    if(modalProperty && modalProperty.id===id) updateModal();
    render();
  }
  function shareText(prop){
    return `${pick(prop.title)}\n${prop.id} • ${trMap('city',prop.city)} • ${trMap('type',prop.type)}\n${translateText(prop.price||'')}\n${propertyUrl(prop)}`;
  }
  function qrUrl(prop){ return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${enc(propertyUrl(prop))}`; }
  function lineShareUrl(prop){ return `https://line.me/R/msg/text/?${enc(shareText(prop))}`; }
  function whatsappShareUrl(prop){ return `https://wa.me/?text=${enc(shareText(prop))}`; }
  function facebookShareUrl(prop){ return `https://www.facebook.com/sharer/sharer.php?u=${enc(propertyUrl(prop))}`; }
  function streetViewUrl(prop){ return prop?.map ? `https://www.google.com/maps/search/?api=1&query=${enc(prop.map)}` : '#'; }
  function inquiryMessage(prop, source='Website Inquiry'){
    const name = document.getElementById('leadName')?.value || '';
    const phone = document.getElementById('leadPhone')?.value || '';
    const line = document.getElementById('leadLine')?.value || '';
    const budget = document.getElementById('leadBudget')?.value || '';
    const msg = document.getElementById('leadMessage')?.value || '';
    return `Hello Kwan, I am interested in this property.\n\nProperty ID: ${prop.id}\nTitle: ${pick(prop.title)}\nPrice: ${prop.price || ''}\nLink: ${propertyUrl(prop)}\nMap: ${prop.map || ''}\n\nName: ${name}\nPhone: ${phone}\nLINE ID: ${line}\nBudget: ${budget}\nMessage: ${msg || 'Please send me more details.'}\n\nSource: ${source}`;
  }
  function leadRecord(prop){
    return {
      id:'LEAD-'+Date.now(), createdAt:new Date().toISOString(), status:'New Lead',
      propertyId:prop.id, propertyTitle:pick(prop.title), propertyUrl:propertyUrl(prop), map:prop.map||'',
      name:document.getElementById('leadName')?.value||'', phone:document.getElementById('leadPhone')?.value||'',
      line:document.getElementById('leadLine')?.value||'', budget:document.getElementById('leadBudget')?.value||'',
      message:document.getElementById('leadMessage')?.value||''
    };
  }
  function saveLead(prop){
    const rec=leadRecord(prop);
    const all=JSON.parse(localStorage.getItem('siriland_leads')||'[]');
    all.unshift(rec); localStorage.setItem('siriland_leads', JSON.stringify(all.slice(0,500)));
    alert(lang==='th' ? 'บันทึกข้อมูลเรียบร้อยแล้ว กรุณากด LINE หรือ WhatsApp เพื่อส่งข้อความถึงขวัญ' : 'Inquiry saved. Please send via LINE or WhatsApp to contact Kwan.');
  }
  function ensureSprint31Panel(prop){
    const body=document.querySelector('#propertyModal .modal-body');
    if(!body || !prop) return;
    let box=document.getElementById('sprint31Panel');
    const favLabel=isFavorite(prop.id) ? '❤️ Favorited' : '🤍 Favorite';
    const th = lang==='th';
    const askTitle = th ? 'สอบถามอสังหาริมทรัพย์นี้' : 'Ask About This Property';
    const namePh = th ? 'ชื่อ' : 'Name';
    const phonePh = th ? 'เบอร์โทร' : 'Phone';
    const linePh = th ? 'LINE ID' : 'LINE ID';
    const budgetPh = th ? 'งบประมาณ' : 'Budget';
    const msgPh = th ? 'ข้อความ' : 'Message';
    const defaultMsg = th ? 'สนใจอสังหาริมทรัพย์นี้ กรุณาส่งรายละเอียดเพิ่มเติมค่ะ' : "Hello, I'm interested in this property. Please send me more details.";
    const html=`
      <div class="sprint31-box">
        <h4>Share / Contact</h4>
        <div class="sprint31-actions">
          <button class="smallbtn goldbtn" data-s31="copy">🔗 Copy Link</button>
          <a class="smallbtn" target="_blank" href="${facebookShareUrl(prop)}">Facebook</a>
          <a class="smallbtn" target="_blank" href="${lineShareUrl(prop)}">LINE Share</a>
          <a class="smallbtn" target="_blank" href="${whatsappShareUrl(prop)}">WhatsApp</a>
          <button class="smallbtn" data-s31="print">🖨 Print</button>
          <button class="smallbtn" data-s31="favorite">${favLabel}</button>
          ${prop.map?`<a class="smallbtn" target="_blank" href="${prop.map}">📍 Google Maps</a>`:''}
          ${prop.map?`<a class="smallbtn" target="_blank" href="${streetViewUrl(prop)}">Street View</a>`:''}
        </div>
        <div class="sprint31-qr"><img src="${qrUrl(prop)}" alt="QR Code"><span>${th?'สแกนเพื่อเปิดประกาศนี้':'Scan to open this listing'}</span></div>
      </div>
      <div class="sprint31-box lead-box">
        <h4>${askTitle}</h4>
        <div class="lead-grid">
          <input id="leadName" placeholder="${namePh}">
          <input id="leadPhone" placeholder="${phonePh}">
          <input id="leadLine" placeholder="${linePh}">
          <input id="leadBudget" placeholder="${budgetPh}">
        </div>
        <textarea id="leadMessage" placeholder="${msgPh}">${defaultMsg}</textarea>
        <div class="sprint31-actions">
          <button class="smallbtn goldbtn" data-s31="leadLine">Send via LINE</button>
          <button class="smallbtn" data-s31="leadWhatsapp">Send via WhatsApp</button>
          <button class="smallbtn" data-s31="saveLead">Save Lead</button>
          <a class="smallbtn" href="tel:${CONTACT.phoneTel}">📞 Call Kwan</a>
        </div>
      </div>`;
    if(!box){
      box=document.createElement('div'); box.id='sprint31Panel'; body.appendChild(box);
    }
    box.innerHTML=html;
  }
  // ===== End Sprint 3.1 helpers =====

  const dict = {
    city:{'Chiang Mai':{th:'เชียงใหม่',tr:'Chiang Mai',zh:'清迈'},'Bangkok':{th:'กรุงเทพฯ',tr:'Bangkok',zh:'曼谷'},'Phitsanulok':{th:'พิษณุโลก',tr:'Phitsanulok',zh:'彭世洛'},'Phichit':{th:'พิจิตร',tr:'Phichit',zh:'披集'},'Nakhon Sawan':{th:'นครสวรรค์',tr:'Nakhon Sawan',zh:'那空沙旺'}},
    type:{'Condo':{th:'คอนโด',tr:'Daire',zh:'公寓'},'House':{th:'บ้าน',tr:'Ev',zh:'住宅'},'Land':{th:'ที่ดิน',tr:'Arsa',zh:'土地'},'Shophouse':{th:'อาคารพาณิชย์',tr:'Dükkan/Ev',zh:'商业楼'},'Commercial':{th:'อาคารพาณิชย์',tr:'Ticari',zh:'商业'}},
    deal:{'Sale':{th:'ขาย',tr:'Satılık',zh:'出售'},'Rent':{th:'ให้เช่า',tr:'Kiralık',zh:'出租'},'Sale/Rent':{th:'ขาย/ให้เช่า',tr:'Satılık/Kiralık',zh:'出售/出租'}},
    status:{'Available':{th:'พร้อมขาย/เช่า',tr:'Uygun',zh:'可售/可租'},'Sold Out':{th:'ขายแล้ว',tr:'Satıldı',zh:'已售'},'Rented Out':{th:'เช่าแล้ว',tr:'Kiralandı',zh:'已租'},'Leased Out':{th:'เช่าแล้ว',tr:'Kiralandı',zh:'已租'},'Reserved':{th:'จองแล้ว',tr:'Rezerve',zh:'已预订'}}
  };
  function trMap(group, val){ return (dict[group] && dict[group][val] && (dict[group][val][lang] || val)) || val || ''; }
  function translateText(s){
    s = String(s || '');
    if(!s) return s;
    let r = s;

    const phrase = {
      th: [
        ['Srimala Villa Shophouse','อาคารพาณิชย์ศรีมาลาวิลล่า'],
        ['Commercial Shophouse','อาคารพาณิชย์'],
        ['Shophouse','อาคารพาณิชย์'],
        ['Prime Location','ทำเลดี'],
        ['Prime location','ทำเลดี'],
        ['City Center','ตัวเมือง'],
        ['Owner Financing','ผ่อนตรงกับเจ้าของ'],
        ['Owner Finance','ผ่อนตรงกับเจ้าของ'],
        ['Free Transfer Fees','ฟรีค่าโอน'],
        ['Free Transfer','ฟรีค่าโอน'],
        ['Price Negotiable','ต่อรองราคาได้'],
        ['Negotiable Price','ต่อรองราคาได้'],
        ['Investment Opportunity','เหมาะสำหรับลงทุน'],
        ['Ready-to-use Shop Sign Structure','โครงป้ายหน้าร้านพร้อมใช้งาน'],
        ['Front 2 Units Connected','2 คูหาด้านหน้าเชื่อมต่อกัน'],
        ['Rear Units Can Be Rented Separately','คูหาด้านหลังเช่าแยกได้'],
        ['4 Commercial Units','อาคารพาณิชย์ 4 คูหา'],
        ['3 Storeys','3 ชั้น'],
        ['3 Floors','3 ชั้น'],
        ['Built-in Kitchen','ครัวบิวท์อิน'],
        ['Partial Furniture','เฟอร์นิเจอร์บางส่วน'],
        ['CCTV System','ระบบกล้องวงจรปิด'],
        ['TV Included','มีทีวี'],
        ['Retail Shop','ร้านค้า'],
        ['Restaurant','ร้านอาหาร'],
        ['Clinic','คลินิก'],
        ['Office','ออฟฟิศ'],
        ['Showroom','โชว์รูม'],
        ['Warehouse','โกดังสินค้า'],
        ['Service Business','ธุรกิจบริการ'],
        ['Investment','การลงทุน'],
        ['Contact for Price','ติดต่อสอบถามราคา'],
        ['Ask for price','ติดต่อสอบถามราคา'],
        ['Details are being updated by SIRILAND.','กรุณาติดต่อ SIRILAND เพื่อสอบถามรายละเอียดเพิ่มเติม'],
        ['Details updating','ติดต่อสอบถามรายละเอียด'],
        ['Recovered from image folder','มีรูปภาพพร้อมใช้งาน'],
        ['Ready to move','พร้อมเข้าอยู่'],
        ['Fully furnished','เฟอร์นิเจอร์ครบ'],
        ['Mountain View','วิวภูเขา'],
        ['Open View','วิวเปิดโล่ง'],
        ['Corner Unit','ห้องมุม']
      ],
      tr: [], zh: []
    };

    (phrase[lang] || []).forEach(([a,b])=>{ r = r.replace(new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), b); });

    const repl = {
      th: [
        ['Bedrooms','ห้องนอน'],['Bedroom','ห้องนอน'],['Bed Room','ห้องนอน'],['Bathrooms','ห้องน้ำ'],['Bathroom','ห้องน้ำ'],['Bath Room','ห้องน้ำ'],
        ['sqm','ตร.ม.'],['sq.m.','ตร.ม.'],['sq.m','ตร.ม.'],['m2','ตร.ม.'],['Floor','ชั้น'],['Room','ห้อง'],['Unit','คูหา'],['Units','คูหา'],
        ['Storeys','ชั้น'],['Storey','ชั้น'],['Floors','ชั้น'],['Available','พร้อมขาย/เช่า'],['Sale','ขาย'],['Rent','ให้เช่า'],['For Sale','ขาย'],['For Rent','ให้เช่า'],
        ['Condo','คอนโด'],['House','บ้าน'],['Land','ที่ดิน'],['Commercial','อาคารพาณิชย์'],['Shophouse','อาคารพาณิชย์'],['Price','ราคา'],['THB','บาท'],['MB','ล้านบาท'],
        ['Month','เดือน'],['Year','ปี'],['Years','ปี'],['and','และ'],['with','พร้อม'],['Near','ใกล้'],['Nearby','สถานที่ใกล้เคียง']
      ],
      tr: [['Bedrooms','Yatak Odası'],['Bedroom','Yatak Odası'],['Bathrooms','Banyo'],['Bathroom','Banyo'],['sqm','m²'],['sq.m','m²'],['Floor','Kat'],['Room','Oda'],['Corner Unit','Köşe Daire'],['Available','Uygun'],['Sale','Satılık'],['Rent','Kiralık'],['Condo','Daire'],['House','Ev'],['Land','Arsa']],
      zh: [['Bedrooms','卧室'],['Bedroom','卧室'],['Bathrooms','浴室'],['Bathroom','浴室'],['sqm','平方米'],['sq.m','平方米'],['Floor','楼层'],['Room','房号'],['Corner Unit','角落单位'],['Available','可售/可租'],['Sale','出售'],['Rent','出租'],['Condo','公寓'],['House','住宅'],['Land','土地']]
    };
    (repl[lang] || []).forEach(([a,b])=>{ r = r.replace(new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), b); });
    Object.keys(dict.city).forEach(k=>{ r = r.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), trMap('city', k)); });

    if(lang === 'th'){
      r = r.replace(/(\d[\d,]*(?:\.\d+)?)\s*บาท\s*\/\s*คูหา/gi, '$1 บาท / คูหา');
      r = r.replace(/(\d[\d,]*(?:\.\d+)?)\s*บาท\s*\/\s*เดือน/gi, '$1 บาท / เดือน');
      r = r.replace(/\s+/g,' ').trim();
    }
    return r;
  }
  const overlayText = (status) => {
    const s = String(status || '').toLowerCase();
    if(s.includes('sold')) return 'SOLD OUT';
    if(s.includes('leased')) return 'LEASED OUT';
    if(s.includes('rented')) return 'RENTED OUT';
    if(s.includes('reserved')) return 'RESERVED';
    return '';
  };

  function applyI18n(){
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => el.placeholder = t(el.dataset.i18nPlaceholder));
    document.querySelectorAll('#langSwitch button').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
  }

  function fillFilters(){
    const cityFilter=$('cityFilter'), typeFilter=$('typeFilter'), dealFilter=$('dealFilter');
    const cities=[...new Set(DATA.map(p=>p.city).filter(Boolean))].sort();
    const types=[...new Set(DATA.map(p=>p.type).filter(Boolean))].sort();
    const deals=[...new Set(DATA.map(p=>p.deal).filter(Boolean))].sort();
    cityFilter.innerHTML=`<option value="all">${t('allCities')}</option>`+cities.map(v=>`<option value="${v}">${trMap('city',v)}</option>`).join('');
    typeFilter.innerHTML=`<option value="all">${t('allTypes')}</option>`+types.map(v=>`<option value="${v}">${trMap('type',v)}</option>`).join('');
    dealFilter.innerHTML=`<option value="all">${t('allDeals')}</option>`+deals.map(v=>`<option value="${v}">${trMap('deal',v)}</option>`).join('');
  }

  function card(p){
    const title=pick(p.title), desc=pick(p.description), highlights=pickList(p.highlights).slice(0,4), ov=overlayText(p.status);
    return `<article class="card">
      <div class="photo" data-id="${p.id}"><img src="${safeImg(p.images)}" alt="${title}" loading="lazy" onerror="this.src='images/logo.png'"><span class="badge">${trMap('deal',p.deal)}</span><span class="status">${trMap('status',p.status)}</span><span class="count">${(p.images||[]).length} ${t('photos')}</span>${ov?`<span class="sold-ribbon">${ov}</span>`:''}</div>
      <div class="content"><div class="meta">${p.id} • ${trMap('city',p.city)} • ${trMap('type',p.type)}</div><h3>${title}</h3><div class="price">${translateText(p.price||'')}</div><p class="desc">${desc}</p>
      <div class="chips">${highlights.map(h=>`<span>${h}</span>`).join('')}</div>
      <div class="actions"><button class="smallbtn goldbtn" data-open="${p.id}">${t('details')}</button><button class="smallbtn" data-fav="${p.id}">${isFavorite(p.id)?'❤️':'🤍'}</button>${p.map?`<a class="smallbtn" target="_blank" href="${p.map}">${t('map')}</a>`:''}<a class="smallbtn" target="_blank" href="https://line.me/R/ti/p/@realcreamthailand">${t('contact')}</a></div></div>
    </article>`;
  }

  function render(){
    const city=$('cityFilter')?.value || 'all', type=$('typeFilter')?.value || 'all', deal=$('dealFilter')?.value || 'all';
    const q=($('searchInput')?.value || '').toLowerCase().trim();
    currentList=DATA.filter(p=>{
      const blob=[p.id,p.city,p.type,p.deal,p.price,p.room,p.floor,p.area,p.bedrooms,p.bathrooms,p.status,p.map,pick(p.title),pick(p.description),...pickList(p.highlights)].join(' ').toLowerCase();
      return (city==='all'||p.city===city) && (type==='all'||p.type===type) && (deal==='all'||p.deal===deal) && (!q||blob.includes(q));
    });
    $('propertyCount').textContent = DATA.length + '+';
    $('propertyGrid').innerHTML = currentList.length ? currentList.map(card).join('') : `<p>${t('noResults')}</p>`;
  }

  function openModal(id, idx=0){
    modalProperty=DATA.find(p=>p.id===id); if(!modalProperty) return;
    modalIndex=idx; updateModal(); $('propertyModal').classList.remove('hidden');
  }
  function updateModal(){
    const p=modalProperty; if(!p) return; const imgs=p.images||[];
    $('modalImg').src=imgs[modalIndex] || 'images/logo.png';
    $('modalCounter').textContent = `${Math.min(modalIndex+1, Math.max(imgs.length,1))} / ${Math.max(imgs.length,1)}`;
    $('modalTitle').textContent=pick(p.title);
    $('modalMeta').textContent=`${p.id} • ${trMap('city',p.city)} • ${trMap('type',p.type)} • ${trMap('deal',p.deal)} • ${trMap('status',p.status)}`;
    $('modalPrice').textContent=translateText(p.price||'');
    const descEl = $('modalDescription') || $('modalDesc');
    const hiEl = $('modalHighlights') || $('modalChips');
    if(descEl) descEl.textContent=pick(p.description);
    if(hiEl) hiEl.innerHTML=pickList(p.highlights).map(h=>hiEl.tagName==='UL'?`<li>${h}</li>`:`<span>${h}</span>`).join('');
    $('modalThumbs').innerHTML=imgs.map((src,i)=>`<img src="${src}" class="${i===modalIndex?'active':''}" data-thumb="${i}" onerror="this.style.display='none'">`).join('');
    $('modalMap').style.display=p.map?'inline-block':'none'; $('modalMap').href=p.map||'#';
    const copyBtn = $('copyLink'); if(copyBtn) copyBtn.dataset.s31 = 'copy';
    ensureSprint31Panel(p);
    window.history.replaceState({}, '', propertyUrl(p));
  }
  function next(delta){ if(!modalProperty) return; const n=(modalProperty.images||[]).length||1; modalIndex=(modalIndex+delta+n)%n; updateModal(); }

  document.addEventListener('click', e=>{
    const langBtn=e.target.closest('#langSwitch button'); if(langBtn){lang=langBtn.dataset.lang; localStorage.setItem('siriland_lang',lang); applyI18n(); fillFilters(); render(); if(modalProperty) updateModal(); return;}
    const fav=e.target.closest('[data-fav]'); if(fav){ e.preventDefault(); toggleFavorite(fav.dataset.fav); return; }
    const s31=e.target.closest('[data-s31]'); if(s31 && modalProperty){
      const action=s31.dataset.s31;
      if(action==='copy'){ navigator.clipboard?.writeText(propertyUrl(modalProperty)); alert(lang==='th'?'คัดลอกลิงก์แล้ว':'Link copied'); return; }
      if(action==='print'){ window.print(); return; }
      if(action==='favorite'){ toggleFavorite(modalProperty.id); return; }
      if(action==='leadLine'){ saveLead(modalProperty); window.open(`https://line.me/R/oaMessage/${CONTACT.line}/?${enc(inquiryMessage(modalProperty,'LINE Inquiry'))}`,'_blank'); return; }
      if(action==='leadWhatsapp'){ saveLead(modalProperty); window.open(`https://wa.me/${CONTACT.phoneIntl}?text=${enc(inquiryMessage(modalProperty,'WhatsApp Inquiry'))}`,'_blank'); return; }
      if(action==='saveLead'){ saveLead(modalProperty); return; }
    }
    const open=e.target.closest('[data-open], .photo'); if(open){openModal(open.dataset.open || open.dataset.id); return;}
    const th=e.target.closest('[data-thumb]'); if(th){modalIndex=+th.dataset.thumb; updateModal(); return;}
    if(e.target.id==='modalClose' || e.target.id==='propertyModal') $('propertyModal').classList.add('hidden');
    if(e.target.id==='modalPrev') next(-1); if(e.target.id==='modalNext') next(1);
  });
  document.addEventListener('keydown', e=>{ if(!$('propertyModal')?.classList.contains('hidden')){ if(e.key==='ArrowLeft') next(-1); if(e.key==='ArrowRight') next(1); if(e.key==='Escape') $('propertyModal').classList.add('hidden'); }});
  $('modalImg')?.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX},{passive:true});
  $('modalImg')?.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchX; if(Math.abs(dx)>45) next(dx>0?-1:1)},{passive:true});
  ['cityFilter','typeFilter','dealFilter','searchInput'].forEach(id=>$(id)?.addEventListener('input', render));
  $('menuToggle')?.addEventListener('click',()=> $('mainNav').classList.toggle('show'));

  function openPropertyFromUrl(){
    const params = new URLSearchParams(window.location.search);
    const propertyId = params.get('property') || params.get('id');
    if(!propertyId) return;
    const found = DATA.find(p => String(p.id || '').toLowerCase() === String(propertyId).toLowerCase());
    if(!found) return;

    const cityFilter = $('cityFilter');
    const typeFilter = $('typeFilter');
    const dealFilter = $('dealFilter');
    const searchInput = $('searchInput');
    if(cityFilter) cityFilter.value = 'all';
    if(typeFilter) typeFilter.value = 'all';
    if(dealFilter) dealFilter.value = 'all';
    if(searchInput) searchInput.value = found.id;
    render();

    setTimeout(() => openModal(found.id), 250);
  }

  applyI18n(); fillFilters(); render(); openPropertyFromUrl();
})();
