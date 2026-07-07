(() => {
  const DATA = window.SIRILAND_PROPERTIES || window.properties || [];
  const I18N = window.SIRILAND_I18N || {};
  let lang = localStorage.getItem('siriland_lang') || 'en';
  let currentList = DATA.slice();
  let modalProperty = null;
  let modalIndex = 0;

  const $ = (id) => document.getElementById(id);
  const t = (key) => (I18N[lang] && I18N[lang][key]) || (I18N.en && I18N.en[key]) || key;
  const pick = (value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value[lang] || value.en || value.th || value.tr || value.zh || '';
    return value || '';
  };
  const pickList = (value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value[lang] || value.en || value.th || value.tr || value.zh || [];
    return Array.isArray(value) ? value : [];
  };
  const safeImg = (arr) => (arr && arr.length ? arr[0] : 'images/logo.png');

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
    cityFilter.innerHTML=`<option value="all">${t('allCities')}</option>`+cities.map(v=>`<option>${v}</option>`).join('');
    typeFilter.innerHTML=`<option value="all">${t('allTypes')}</option>`+types.map(v=>`<option>${v}</option>`).join('');
    dealFilter.innerHTML=`<option value="all">${t('allDeals')}</option>`+deals.map(v=>`<option>${v}</option>`).join('');
  }

  function card(p){
    const title=pick(p.title), desc=pick(p.description), highlights=pickList(p.highlights).slice(0,4);
    return `<article class="card">
      <div class="photo" data-id="${p.id}"><img src="${safeImg(p.images)}" alt="${title}" loading="lazy" onerror="this.src='images/logo.png'"><span class="badge">${p.deal||''}</span><span class="status">${p.status||''}</span><span class="count">${(p.images||[]).length} ${t('photos')}</span></div>
      <div class="content"><div class="meta">${p.id} • ${p.city||''} • ${p.type||''}</div><h3>${title}</h3><div class="price">${p.price||''}</div><p class="desc">${desc}</p>
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
  function updateModal(){
    const p=modalProperty, imgs=p.images||[]; if(!p) return;
    $('modalImg').src=imgs[modalIndex] || 'images/logo.png';
    $('modalCounter').textContent = `${modalIndex+1} / ${Math.max(imgs.length,1)}`;
    $('modalTitle').textContent=pick(p.title);
    $('modalMeta').textContent=`${p.id} • ${p.city||''} • ${p.type||''} • ${p.deal||''}`;
    $('modalPrice').textContent=p.price||'';
    $('modalDescription').textContent=pick(p.description);
    $('modalHighlights').innerHTML=pickList(p.highlights).map(h=>`<li>${h}</li>`).join('');
    $('modalThumbs').innerHTML=imgs.map((src,i)=>`<img src="${src}" class="${i===modalIndex?'active':''}" data-thumb="${i}" onerror="this.style.display='none'">`).join('');
    $('modalMap').style.display=p.map?'inline-block':'none'; $('modalMap').href=p.map||'#';
  }
  function next(delta){ if(!modalProperty) return; const n=(modalProperty.images||[]).length||1; modalIndex=(modalIndex+delta+n)%n; updateModal(); }

  document.addEventListener('click', e=>{
    const langBtn=e.target.closest('#langSwitch button'); if(langBtn){lang=langBtn.dataset.lang; localStorage.setItem('siriland_lang',lang); applyI18n(); fillFilters(); render(); return;}
    const open=e.target.closest('[data-open], .photo'); if(open){openModal(open.dataset.open || open.dataset.id); return;}
    const th=e.target.closest('[data-thumb]'); if(th){modalIndex=+th.dataset.thumb; updateModal(); return;}
    if(e.target.id==='modalClose' || e.target.id==='propertyModal') $('propertyModal').classList.add('hidden');
    if(e.target.id==='modalPrev') next(-1); if(e.target.id==='modalNext') next(1);
  });
  ['cityFilter','typeFilter','dealFilter','searchInput'].forEach(id=>$(id)?.addEventListener('input', render));
  $('menuToggle')?.addEventListener('click',()=> $('mainNav').classList.toggle('show'));
  applyI18n(); fillFilters(); render();
})();
