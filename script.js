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
      <div class="actions"><button class="smallbtn goldbtn" data-open="${p.id}">${t('details')}</button>${p.map?`<a class="smallbtn" target="_blank" href="${p.map}">${t('map')}</a>`:''}<a class="smallbtn" target="_blank" href="https://line.me/R/ti/p/@realcreamthailand">${t('contact')}</a></div></div>
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

  function normalizePrice(value){
    const s = String(value || '').toLowerCase().replace(/,/g,'').trim();
    if(!s || s.includes('contact') || s.includes('ask')) return null;
    let m = s.match(/(\d+(?:\.\d+)?)\s*(mb|m|million|ล้าน)/i);
    if(m) return parseFloat(m[1]) * 1000000;
    m = s.match(/(\d+(?:\.\d+)?)/);
    if(!m) return null;
    const n = parseFloat(m[1]);
    if(s.includes('บาท') || s.includes('thb')) return n;
    return n >= 100000 ? n : n * 1000000;
  }
  function getSimilarProperties(p, limit=6){
    if(!p) return [];
    const basePrice = normalizePrice(p.price);
    return DATA.filter(x => x && x.id !== p.id).map(x => {
      let score = 0;
      if(x.city && p.city && x.city === p.city) score += 45;
      if(x.type && p.type && x.type === p.type) score += 30;
      if(x.deal && p.deal && x.deal === p.deal) score += 10;
      const xp = normalizePrice(x.price);
      if(basePrice && xp){
        const diff = Math.abs(xp - basePrice) / basePrice;
        if(diff <= .15) score += 25;
        else if(diff <= .30) score += 15;
        else if(diff <= .50) score += 7;
      }
      const title = pick(x.title).toLowerCase();
      const currentTitle = pick(p.title).toLowerCase();
      const projectWords = currentTitle.split(/\s+/).filter(w => w.length > 4).slice(0,4);
      if(projectWords.some(w => title.includes(w))) score += 12;
      if(x.featured) score += 3;
      return {x, score};
    }).filter(row => row.score > 0).sort((a,b) => b.score - a.score).slice(0, limit).map(row => row.x);
  }
  function relatedCard(p){
    const title = pick(p.title);
    const specs = [p.bedrooms, p.bathrooms, p.area].filter(Boolean).map(translateText).join(' • ');
    return `<article class="related-card" data-related-open="${p.id}">
      <div class="related-photo"><img src="${safeImg(p.images)}" alt="${title}" loading="lazy" onerror="this.src='images/logo.png'"></div>
      <div class="related-body">
        <div class="related-meta">${p.id} • ${trMap('city',p.city)} • ${trMap('type',p.type)}</div>
        <h4>${title}</h4>
        <div class="related-price">${translateText(p.price || '')}</div>
        ${specs ? `<div class="related-specs">${specs}</div>` : ''}
        <div class="related-actions"><button class="smallbtn goldbtn" data-open="${p.id}">${t('details')}</button>${p.map?`<a class="smallbtn" target="_blank" href="${p.map}">${t('map')}</a>`:''}</div>
      </div>
    </article>`;
  }
  function renderRelatedProperties(p){
    const target = $('relatedProperties');
    if(!target) return;
    const related = getSimilarProperties(p, 6);
    const labels = {
      en: {title:'Similar properties', sub:'Recommended listings with similar location, type or price range.'},
      th: {title:'อสังหาริมทรัพย์ที่คล้ายกัน', sub:'รายการแนะนำจากทำเล ประเภท และช่วงราคาใกล้เคียง'},
      tr: {title:'Benzer ilanlar', sub:'Konum, tip veya fiyat aralığına göre önerilen ilanlar.'},
      zh: {title:'相似房源', sub:'根据位置、类型或价格范围推荐的房源。'}
    };
    const l = labels[lang] || labels.en;
    if(!related.length){ target.innerHTML = ''; return; }
    target.innerHTML = `<div class="related-head"><div><span class="eyebrow dark">SIRILAND</span><h3>${l.title}</h3><p>${l.sub}</p></div></div><div class="related-grid">${related.map(relatedCard).join('')}</div>`;
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
    renderRelatedProperties(p);
  }
  function next(delta){ if(!modalProperty) return; const n=(modalProperty.images||[]).length||1; modalIndex=(modalIndex+delta+n)%n; updateModal(); }

  document.addEventListener('click', e=>{
    const langBtn=e.target.closest('#langSwitch button'); if(langBtn){lang=langBtn.dataset.lang; localStorage.setItem('siriland_lang',lang); applyI18n(); fillFilters(); render(); if(modalProperty) updateModal(); return;}
    const open=e.target.closest('[data-open], .photo, [data-related-open]'); if(open){openModal(open.dataset.open || open.dataset.id || open.dataset.relatedOpen); return;}
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
