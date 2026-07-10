(() => {
  const DATA = window.SIRILAND_PROPERTIES || window.properties || [];
  const I18N = window.SIRILAND_I18N || {};
  let lang = localStorage.getItem('siriland_lang') || 'en';
  let currentList = DATA.slice();
  let currentPage = 1;
  const pageSize = window.innerWidth <= 900 ? 6 : 8;
  let activeHeroDeal = "all";
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
        ['Corner Unit','ห้องมุม'],
        ['Spacious','กว้างขวาง'],['Garden','สวน'],['Large Living Hall','ห้องโถงใหญ่'],['Living Hall','ห้องโถง'],['Kitchen','ห้องครัว'],['Multi-Purpose Living Area','พื้นที่อเนกประสงค์'],['Land Size','ขนาดที่ดิน'],['Width','กว้าง'],['Depth','ลึก'],['Total Area','พื้นที่รวม'],['The property consists of','ทรัพย์ประกอบด้วย'],['Title Deed','โฉนด'],['Freehold','กรรมสิทธิ์'],['Chanote','โฉนด'],['Upper','ชั้นบน'],['Ground','ชั้นล่าง'],['Approximate','ประมาณ'],['Approximately','ประมาณ'],['Features','จุดเด่น'],['Details','รายละเอียด'],['Property','ทรัพย์'],['Parking','ที่จอดรถ'],['Car Park','ที่จอดรถ'],['Balcony','ระเบียง'],['Pool View','วิวสระว่ายน้ำ'],['Foreign Quota','โควต้าต่างชาติ'],['Airbnb Allowed','ปล่อยเช่ารายวันได้'],['Renovated','รีโนเวทใหม่'],['Free Transfer','ฟรีค่าโอน'],['Sale Price','ราคาขาย'],['Rent Price','ราคาเช่า'],['Owner finance','ผ่อนตรงกับเจ้าของ']
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


  function parsePriceNumber(v){
    const s = String(v || '').toLowerCase().replace(/,/g,'').trim();
    if(!s) return 0;
    const m = s.match(/([0-9]+(?:\.[0-9]+)?)/);
    if(!m) return 0;
    let n = parseFloat(m[1]);
    if(s.includes('mb') || s.includes('million') || s.includes('ล้าน')) n *= 1000000;
    return Math.round(n);
  }
  function parseFirstNumber(v){
    const m = String(v || '').match(/\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : 0;
  }
  function propertyBlob(p){
    return [p.id,p.city,p.type,p.deal,p.price,p.room,p.floor,p.area,p.bedrooms,p.bathrooms,p.status,p.map,p.salePrice,p.rentPrice,p.ownerFinance,p.installment,p.summary,pick(p.title),pick(p.description),...pickList(p.highlights),...(Array.isArray(p.features)?p.features:[]),...(Array.isArray(p.nearby)?p.nearby:[])].join(' ').toLowerCase();
  }

  const specLabels = {
    en:{bed:'Bedrooms',bath:'Bathrooms',area:'Area',floor:'Floor',room:'Room',price:'Price'},
    th:{bed:'ห้องนอน',bath:'ห้องน้ำ',area:'พื้นที่',floor:'ชั้น',room:'ห้อง',price:'ราคา'},
    tr:{bed:'Yatak Odası',bath:'Banyo',area:'Alan',floor:'Kat',room:'Oda',price:'Fiyat'},
    zh:{bed:'卧室',bath:'浴室',area:'面积',floor:'楼层',room:'房号',price:'价格'}
  };
  function cleanTranslatedValue(v){
    return translateText(String(v || '').replace(/Features/gi,'').replace(/Approximate/gi,'ประมาณ').replace(/\s+/g,' ').trim());
  }
  function propertySpecs(p){
    const L = specLabels[lang] || specLabels.en;
    const rows = [];
    if(p.bedrooms && !String(p.bedrooms).match(/^[-–]$/)) rows.push({key:'bed',label:L.bed,value:cleanTranslatedValue(p.bedrooms)});
    if(p.bathrooms && !String(p.bathrooms).match(/^[-–]$/)) rows.push({key:'bath',label:L.bath,value:cleanTranslatedValue(p.bathrooms)});
    if(p.area && !String(p.area).match(/^[-–]$/)) rows.push({key:'area',label:L.area,value:cleanTranslatedValue(p.area)});
    if(p.floor && !String(p.floor).match(/^[-–]$/)) rows.push({key:'floor',label:L.floor,value:cleanTranslatedValue(p.floor)});
    if(p.room && !String(p.room).match(/^[-–]$/)) rows.push({key:'room',label:L.room,value:cleanTranslatedValue(p.room)});
    return rows;
  }
  function specsInline(p){
    const icon = {bed:'🛏', bath:'🚿', area:'📐', floor:'🏢', room:'🚪'};
    return propertySpecs(p).slice(0,4).map(x => `<span>${icon[x.key]||''} ${x.value}</span>`).join('');
  }
  function specsGrid(p){ return propertySpecs(p).map(x => `<div class="detail-spec-card"><small>${x.label}</small><strong>${x.value}</strong></div>`).join(''); }
  function propertyShortText(p){
    const summary = p.summary && typeof p.summary === 'object' ? (p.summary[lang] || p.summary.en || p.summary.th || '') : (p.summary || '');
    if(summary) return translateText(summary);
    const specs = propertySpecs(p).slice(0,3).map(x => `${x.label}: ${x.value}`).join(' • ');
    return specs || pick(p.description).slice(0,140);
  }

  function miniCard(p){
    const title = pick(p.title);
    return `<article class="mini-property-card" data-mini-id="${p.id}">
      <div class="mini-photo"><img src="${safeImg(p.images)}" alt="${title}" onerror="this.src='images/logo.png'"><span>${(p.images||[]).length} photos</span></div>
      <div class="mini-info"><div class="mini-meta">${p.id} • ${trMap('city',p.city)} • ${trMap('type',p.type)}</div><h4>${title}</h4><strong>${translateText(p.price||'')}</strong><p>${[p.bedrooms,p.bathrooms,p.area].filter(Boolean).map(translateText).join(' • ')}</p></div>
    </article>`;
  }
  function miniCompactCard(p){
    const title = pick(p.title);
    return `<article class="mini-compact-card" data-mini-id="${p.id}">
      <img src="${safeImg(p.images)}" alt="${title}" onerror="this.src='images/logo.png'">
      <div><div class="mini-meta">${p.id} • ${trMap('city',p.city)}</div><h4>${title}</h4><strong>${translateText(p.price||'')}</strong><p>${[p.bedrooms,p.bathrooms,p.area].filter(Boolean).map(translateText).join(' • ')}</p></div>
    </article>`;
  }
  function sxHomeCard(p){
    const title = pick(p.title);
    const specs = [p.bedrooms,p.bathrooms,p.area].filter(Boolean).map(translateText).join(' • ');
    return `<article class="sx-property-card" data-mini-id="${p.id}">
      <div class="sx-card-photo"><img src="${safeImg(p.images)}" alt="${title}" onerror="this.src='images/logo.png'"><span>${(p.images||[]).length} ${t('photos')||'photos'}</span></div>
      <div class="sx-card-body">
        <div class="sx-card-meta">${p.id} • ${trMap('city',p.city)} • ${trMap('type',p.type)}</div>
        <h4>${title}</h4>
        <strong>${translateText(p.price||p.salePrice||'')}</strong>
        <p>${specs}</p>
      </div>
    </article>`;
  }
  function sxSmallCard(p){
    const title = pick(p.title);
    const specs = [p.bedrooms,p.bathrooms,p.area].filter(Boolean).map(translateText).join(' • ');
    return `<article class="sx-small-card" data-mini-id="${p.id}">
      <img src="${safeImg(p.images)}" alt="${title}" onerror="this.src='images/logo.png'">
      <div>
        <div class="sx-card-meta">${p.id} • ${trMap('city',p.city)}</div>
        <h4>${title}</h4>
        <strong>${translateText(p.price||p.salePrice||'')}</strong>
        <p>${specs}</p>
      </div>
    </article>`;
  }
  function renderHomeShowcase(){
    const cityCounts = [...new Set(DATA.map(p=>p.city).filter(Boolean))].slice(0,10).map(city => {
      const count = DATA.filter(p=>p.city===city).length;
      return `<button class="sx-city-card" data-collection-city="${city}"><strong>${trMap('city',city)}</strong><span>${count} listings</span></button>`;
    }).join('');
    if($('sxCityList')) $('sxCityList').innerHTML = cityCounts;
    const qc = $('quickCollections'); if(qc) qc.innerHTML = cityCounts;
    if($('citySideList')) $('citySideList').innerHTML = cityCounts;

    const featured = DATA.filter(p=>p.featured !== false).slice(0,4);
    const newest = DATA.slice().sort((a,b)=>String(b.updatedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.createdAt||''))).slice(0,4);
    const bestPrice = DATA.filter(p=>parsePriceNumber(p.price || p.salePrice)>0).sort((a,b)=>parsePriceNumber(a.price||a.salePrice)-parsePriceNumber(b.price||b.salePrice)).slice(0,4);
    const condos = DATA.filter(p=>String(p.type||'').toLowerCase().includes('condo')).slice(0,4);
    const houses = DATA.filter(p=>String(p.type||'').toLowerCase().includes('house')).slice(0,4);
    const finance = DATA.filter(p => propertyBlob(p).includes('owner finance') || propertyBlob(p).includes('ผ่อน') || propertyBlob(p).includes('free transfer') || propertyBlob(p).includes('0%')).slice(0,4);

    if($('sxPopularListings')) $('sxPopularListings').innerHTML = (featured.length?featured:newest).slice(0,4).map(sxHomeCard).join('');
    if($('sxBestPrice')) $('sxBestPrice').innerHTML = (bestPrice.length?bestPrice:featured).slice(0,4).map(sxSmallCard).join('');
    if($('sxPopularCondo')) $('sxPopularCondo').innerHTML = (condos.length?condos:featured).slice(0,4).map(sxSmallCard).join('');
    if($('sxOwnerFinance')) $('sxOwnerFinance').innerHTML = (finance.length?finance:(houses.length?houses:featured)).slice(0,4).map(sxHomeCard).join('');

    // Backward compatibility for older home rows
    if($('featuredRow')) $('featuredRow').innerHTML = featured.map(miniCard).join('');
    if($('newRow')) $('newRow').innerHTML = newest.map(miniCard).join('');
    if($('popularSmallRow')) $('popularSmallRow').innerHTML = featured.map(miniCompactCard).join('');
    if($('bestPriceSmallRow')) $('bestPriceSmallRow').innerHTML = (bestPrice.length?bestPrice:featured.slice(0,3)).map(miniCompactCard).join('');
    if($('condoSmallRow')) $('condoSmallRow').innerHTML = (condos.length?condos:featured.slice(0,3)).map(miniCompactCard).join('');
    if($('financeRow')) $('financeRow').innerHTML = (finance.length?finance:(houses.length?houses:featured)).map(miniCompactCard).join('');
  }
  function fillHeroControls(){
    const heroType = $('heroType'); if(!heroType) return;
    const types=[...new Set(DATA.map(p=>p.type).filter(Boolean))].sort();
    heroType.innerHTML = '<option value="all">All Residential</option>' + types.map(v=>`<option value="${v}">${trMap('type',v)}</option>`).join('');
  }
  function runHeroSearch(){
    const q = ($('heroSearchInput')?.value || '').trim();
    const typ = $('heroType')?.value || 'all';
    const price = $('heroPrice')?.value || 'all';
    const beds = $('heroBedroom')?.value || 'all';
    if($('searchInput')) $('searchInput').value = q;
    if($('typeFilter')) $('typeFilter').value = typ;
    if($('dealFilter')) $('dealFilter').value = activeHeroDeal;
    window.__sirilandPriceRange = price;
    window.__sirilandMinBeds = beds;
    currentPage = 1;
    location.hash = '#properties';
    render();
  }
  function renderPagination(total){
    const el = $('pagination'); if(!el) return;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if(pages <= 1){ el.innerHTML = ''; return; }
    const buttons = [];
    buttons.push(`<button ${currentPage===1?'disabled':''} data-page="${currentPage-1}">‹ Prev</button>`);
    for(let i=1;i<=pages;i++){
      if(i===1 || i===pages || Math.abs(i-currentPage)<=1) buttons.push(`<button class="${i===currentPage?'active':''}" data-page="${i}">${i}</button>`);
      else if(Math.abs(i-currentPage)===2) buttons.push('<span>...</span>');
    }
    buttons.push(`<button ${currentPage===pages?'disabled':''} data-page="${currentPage+1}">Next ›</button>`);
    el.innerHTML = buttons.join('');
  }

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
    fillHeroControls();
  }

  function card(p){
    const title=pick(p.title), ov=overlayText(p.status);
    const specs = specsInline(p);
    return `<article class="card slim-card">
      <div class="photo" data-id="${p.id}"><img src="${safeImg(p.images)}" alt="${title}" loading="lazy" onerror="this.src='images/logo.png'"><span class="badge">${trMap('deal',p.deal)}</span><span class="status">${trMap('status',p.status)}</span><span class="count">${(p.images||[]).length} ${t('photos')}</span>${ov?`<span class="sold-ribbon">${ov}</span>`:''}</div>
      <div class="content">
        <div class="meta">${p.id} • ${trMap('city',p.city)} • ${trMap('type',p.type)}</div>
        <h3>${title}</h3>
        <div class="price">${translateText(p.price||p.salePrice||'')}</div>
        ${specs?`<div class="property-spec-line compact-specs">${specs}</div>`:''}
        <div class="actions"><button class="smallbtn goldbtn" data-open="${p.id}">${t('details')}</button>${p.map?`<a class="smallbtn" target="_blank" href="${p.map}">${t('map')}</a>`:''}<a class="smallbtn" target="_blank" href="https://line.me/R/ti/p/@realcreamthailand">${t('contact')}</a></div>
      </div>
    </article>`;
  }

  let selectedMapProperty = null;
  const CITY_COORDS = {
    'Chiang Mai':'18.7883,98.9853',
    'Bangkok':'13.7563,100.5018',
    'Phichit':'16.4429,100.3482',
    'Phitsanulok':'16.8211,100.2659',
    'Nakhon Sawan':'15.7047,100.1372'
  };
  function propertyMapQuery(p){
    if(p && (p.lat || p.latitude) && (p.lng || p.longitude)) return `${p.lat||p.latitude},${p.lng||p.longitude}`;
    if(p && p.map) return String(p.map).trim();
    return [pick(p.title), p.city, p.type, 'Thailand'].filter(Boolean).join(' ');
  }
  function cityMapQuery(city){ return CITY_COORDS[city] || [city,'Thailand'].filter(Boolean).join(' '); }
  function mapEmbedUrl(p){
    const q = propertyMapQuery(p);
    return 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&z=16&output=embed';
  }
  function setMapProperty(p){
    if(!p) return;
    selectedMapProperty = p;
    const frame = $('propertyMapFrame');
    if(frame) frame.src = mapEmbedUrl(p);
    const btn = $('openSelectedMap');
    if(btn) btn.onclick = () => window.open(p.map || ('https://maps.google.com/?q=' + encodeURIComponent(propertyMapQuery(p))), '_blank');
    document.querySelectorAll('.map-item').forEach(el => el.classList.toggle('active', el.dataset.mapId === p.id));
    const active = document.querySelector(`.map-item[data-map-id="${CSS.escape(p.id)}"]`);
    if(active) active.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function setMapCity(city){
    const frame = $('propertyMapFrame');
    if(frame) frame.src = 'https://www.google.com/maps?q=' + encodeURIComponent(cityMapQuery(city)) + '&z=12&output=embed';
    const btn = $('openSelectedMap');
    if(btn) btn.onclick = () => window.open('https://maps.google.com/?q=' + encodeURIComponent(cityMapQuery(city)), '_blank');
    document.querySelectorAll('.map-cluster').forEach(el => el.classList.toggle('active', el.dataset.city === city));
  }
  function mapItem(p){
    const title = pick(p.title);
    const specs = propertySpecs(p).slice(0,3).map(x=>`${x.label}: ${x.value}`).join(' • ');
    return `<article class="map-item" data-map-id="${p.id}">
      <img src="${safeImg(p.images)}" alt="${title}" onerror="this.src='images/logo.png'">
      <div><div class="map-meta">${p.id} • ${trMap('city',p.city)} • ${trMap('type',p.type)}</div>
      <h4>${title}</h4><strong>${translateText(p.price||'')}</strong>${specs?`<p>${specs}</p>`:''}
      <div class="map-actions"><button class="smallbtn goldbtn" data-open="${p.id}">${t('details')}</button>${p.map?`<a class="smallbtn" target="_blank" href="${p.map}">${t('map')}</a>`:''}</div></div>
    </article>`;
  }
  function renderMapView(){
    const mapList = $('mapPropertyList');
    const count = $('mapResultCount');
    if(count) count.textContent = currentList.length + (lang==='th'?' รายการ':lang==='tr'?' ilan':' listings');
    if(!mapList) return;
    const cityGroups = [...new Set(currentList.map(p=>p.city).filter(Boolean))]
      .map(city => `<button class="map-cluster" data-city="${city}"><strong>${trMap('city',city)}</strong><span>${currentList.filter(p=>p.city===city).length}</span></button>`).join('');
    const clusterHtml = cityGroups ? `<div class="map-clusters"><div class="map-cluster-title">📍 ${lang==='th'?'พื้นที่':'Areas'}</div>${cityGroups}</div>` : '';
    mapList.innerHTML = currentList.length ? clusterHtml + currentList.slice(0,100).map(mapItem).join('') : '<p>No map results</p>';
    const first = currentList[0];
    if(first) setMapProperty(selectedMapProperty && currentList.some(p=>p.id===selectedMapProperty.id) ? selectedMapProperty : first);
  }
  function setViewMode(mode){
    const isMap = mode === 'map';
    $('propertyGrid')?.classList.toggle('hidden', isMap);
    $('mapView')?.classList.toggle('hidden', !isMap);
    document.querySelectorAll('#viewSwitch button').forEach(btn=>btn.classList.toggle('active', btn.dataset.view === mode));
    localStorage.setItem('siriland_view_mode', mode);
    if(isMap) renderMapView();
  }

  function render(){
    const city=$('cityFilter')?.value || 'all', type=$('typeFilter')?.value || 'all', deal=$('dealFilter')?.value || 'all';
    const q=($('searchInput')?.value || '').toLowerCase().trim();
    const priceRange = window.__sirilandPriceRange || 'all';
    const minBeds = window.__sirilandMinBeds || 'all';
    currentList=DATA.filter(p=>{
      const blob=propertyBlob(p);
      const priceOk = priceRange === 'all' || (()=>{ const [min,max]=priceRange.split('-').map(Number); const n=parsePriceNumber(p.price || p.salePrice); return n && n>=min && n<=max; })();
      const bedOk = minBeds === 'all' || parseFirstNumber(p.bedrooms) >= Number(minBeds);
      return (city==='all'||p.city===city) && (type==='all'||p.type===type) && (deal==='all'||p.deal===deal) && (!q||blob.includes(q)) && priceOk && bedOk;
    });
    const totalPages = Math.max(1, Math.ceil(currentList.length / pageSize));
    if(currentPage > totalPages) currentPage = totalPages;
    if(currentPage < 1) currentPage = 1;
    const start = (currentPage - 1) * pageSize;
    const pageItems = currentList.slice(start, start + pageSize);
    $('propertyCount').textContent = DATA.length + '+';
    $('propertyGrid').innerHTML = pageItems.length ? pageItems.map(card).join('') : `<p>${t('noResults')}</p>`;
    renderPagination(currentList.length);
    if(!$('mapView')?.classList.contains('hidden')) renderMapView();
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
    const specs = propertySpecs(p).slice(0,3).map(x=>`${x.label}: ${x.value}`).join(' • ');
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

  function propertyUrl(p){
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    return base + '?property=' + encodeURIComponent(p.id || '');
  }
  function contactMessage(p){
    return [
      'Hello Kwan, I am interested in this property.',
      '',
      'Property ID: ' + (p.id || ''),
      'Property: ' + pick(p.title),
      'Price: ' + (p.price || p.salePrice || ''),
      'Location: ' + [p.city, p.type].filter(Boolean).join(' / '),
      'Website: ' + propertyUrl(p)
    ].join('\n');
  }
  function lineContactUrl(p){
    return 'https://line.me/R/oaMessage/@realcreamthailand/?' + encodeURIComponent(contactMessage(p));
  }
  function whatsappContactUrl(p){
    return 'https://wa.me/66920056640?text=' + encodeURIComponent(contactMessage(p));
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
    let specBox = $('modalSpecBox');
    if(!specBox && descEl){
      specBox = document.createElement('div');
      specBox.id = 'modalSpecBox';
      specBox.className = 'detail-spec-grid';
      descEl.parentNode.insertBefore(specBox, descEl);
    }
    if(specBox) specBox.innerHTML = specsGrid(p);
    if(descEl) descEl.textContent=propertyShortText(p);
    if(hiEl) hiEl.innerHTML=pickList(p.highlights).map(h=>hiEl.tagName==='UL'?`<li>${h}</li>`:`<span>${h}</span>`).join('');
    $('modalThumbs').innerHTML=imgs.map((src,i)=>`<img src="${src}" class="${i===modalIndex?'active':''}" data-thumb="${i}" onerror="this.style.display='none'">`).join('');
    $('modalMap').style.display=p.map?'inline-block':'none'; $('modalMap').href=p.map||'#';
    const lineBtn = document.querySelector('.modal-actions a[href*="line.me"]');
    if(lineBtn) lineBtn.href = lineContactUrl(p);
    let waBtn = document.getElementById('modalWhatsApp');
    if(!waBtn){
      const actions = document.querySelector('.modal-actions');
      if(actions){ waBtn = document.createElement('a'); waBtn.id='modalWhatsApp'; waBtn.className='smallbtn'; waBtn.target='_blank'; waBtn.textContent='WhatsApp'; actions.insertBefore(waBtn, $('modalMap')); }
    }
    if(waBtn) waBtn.href = whatsappContactUrl(p);
    const copyBtn = $('copyLink');
    if(copyBtn) copyBtn.onclick = async () => { try{ await navigator.clipboard.writeText(propertyUrl(p)); copyBtn.textContent='Copied'; setTimeout(()=>copyBtn.textContent='Copy Link',1200); }catch(e){ prompt('Copy link', propertyUrl(p)); } };
    renderRelatedProperties(p);
  }
  function next(delta){ if(!modalProperty) return; const n=(modalProperty.images||[]).length||1; modalIndex=(modalIndex+delta+n)%n; updateModal(); }


  document.addEventListener('click', e => {
    const pageBtn = e.target.closest('#pagination button[data-page]');
    if(pageBtn){ currentPage = Number(pageBtn.dataset.page)||1; render(); document.getElementById('properties')?.scrollIntoView({behavior:'smooth'}); return; }
    const heroDeal = e.target.closest('[data-hero-deal]');
    if(heroDeal){ activeHeroDeal = heroDeal.dataset.heroDeal; document.querySelectorAll('[data-hero-deal]').forEach(b=>b.classList.toggle('active', b===heroDeal)); return; }
    const collection = e.target.closest('[data-collection-city]');
    if(collection){ if($('cityFilter')) $('cityFilter').value = collection.dataset.collectionCity; currentPage=1; location.hash='#properties'; render(); return; }
    const mini = e.target.closest('[data-mini-id]');
    if(mini){ const p=DATA.find(x=>x.id===mini.dataset.miniId); if(p) openModal(p.id); return; }
    const homeFilter = e.target.closest('[data-home-filter]');
    if(homeFilter){ currentPage=1; location.hash='#properties'; render(); return; }
  });
  $('heroSearchBtn')?.addEventListener('click', runHeroSearch);
  $('heroSearchInput')?.addEventListener('keydown', e=>{ if(e.key==='Enter') runHeroSearch(); });

  document.addEventListener('click', e=>{
    const langBtn=e.target.closest('#langSwitch button'); if(langBtn){lang=langBtn.dataset.lang; localStorage.setItem('siriland_lang',lang); applyI18n(); fillFilters(); render(); if(modalProperty) updateModal(); return;}
    const viewBtn=e.target.closest('#viewSwitch button'); if(viewBtn){setViewMode(viewBtn.dataset.view); return;}
    const mapCluster=e.target.closest('.map-cluster'); if(mapCluster){setMapCity(mapCluster.dataset.city); return;}
    const mapPick=e.target.closest('.map-item'); if(mapPick && !e.target.closest('button,a')){const p=DATA.find(x=>x.id===mapPick.dataset.mapId); if(p) setMapProperty(p); return;}
    const open=e.target.closest('[data-open], .photo, [data-related-open]'); if(open){openModal(open.dataset.open || open.dataset.id || open.dataset.relatedOpen); return;}
    const th=e.target.closest('[data-thumb]'); if(th){modalIndex=+th.dataset.thumb; updateModal(); return;}
    if(e.target.id==='modalClose' || e.target.id==='propertyModal') $('propertyModal').classList.add('hidden');
    if(e.target.id==='modalPrev') next(-1); if(e.target.id==='modalNext') next(1);
  });
  document.addEventListener('keydown', e=>{ if(!$('propertyModal')?.classList.contains('hidden')){ if(e.key==='ArrowLeft') next(-1); if(e.key==='ArrowRight') next(1); if(e.key==='Escape') $('propertyModal').classList.add('hidden'); }});
  $('modalImg')?.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX},{passive:true});
  $('modalImg')?.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchX; if(Math.abs(dx)>45) next(dx>0?-1:1)},{passive:true});
  ['cityFilter','typeFilter','dealFilter','searchInput'].forEach(id=>$(id)?.addEventListener('input', ()=>{currentPage=1; window.__sirilandPriceRange='all'; window.__sirilandMinBeds='all'; render();}));
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

  applyI18n(); fillFilters(); renderHomeShowcase(); render(); setViewMode(localStorage.getItem('siriland_view_mode') || 'list'); openPropertyFromUrl();
})();
