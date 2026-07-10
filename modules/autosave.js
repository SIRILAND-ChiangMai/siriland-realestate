(function(){
  'use strict';
  const KEY='siriland_admin_property_draft_v1';
  const META='siriland_admin_property_draft_meta_v1';
  const SAVE_INTERVAL=10000;
  let lastSaved='';

  function collectDraft(){
    if(typeof window.getForm!=='function') return null;
    try{
      const data=window.getForm();
      const hasMeaningful=Boolean(
        data && (
          String(data.id||'').trim() ||
          String(data.price||'').trim() ||
          Object.values(data.title||{}).some(v=>String(v||'').trim())
        )
      );
      return hasMeaningful ? data : null;
    }catch(err){
      console.warn('Autosave collect skipped:',err);
      return null;
    }
  }

  function saveDraft(showNotice){
    const draft=collectDraft();
    if(!draft) return false;
    const json=JSON.stringify(draft);
    if(json===lastSaved && !showNotice) return true;
    localStorage.setItem(KEY,json);
    const stamp=new Date().toISOString();
    localStorage.setItem(META,stamp);
    lastSaved=json;
    const report=document.getElementById('report');
    if(showNotice && report){
      report.innerHTML='<span class="ok">Taslak kaydedildi.</span> '+new Date().toLocaleString();
    }
    return true;
  }

  function restoreDraft(){
    const raw=localStorage.getItem(KEY);
    if(!raw || typeof window.setForm!=='function') return false;
    try{
      const draft=JSON.parse(raw);
      window.setForm(draft);
      const report=document.getElementById('report');
      if(report) report.innerHTML='<span class="ok">Taslak geri yüklendi.</span>';
      return true;
    }catch(err){
      console.error('Autosave restore failed:',err);
      return false;
    }
  }

  function clearDraft(){
    localStorage.removeItem(KEY);
    localStorage.removeItem(META);
    lastSaved='';
  }

  function installToolbar(){
    const top=document.querySelector('.top > div:last-child');
    if(!top || document.getElementById('saveDraftBtn')) return;
    const save=document.createElement('button');
    save.className='btn';
    save.id='saveDraftBtn';
    save.type='button';
    save.textContent='Taslak Kaydet';
    save.addEventListener('click',()=>saveDraft(true));

    const restore=document.createElement('button');
    restore.className='btn dark';
    restore.id='restoreDraftBtn';
    restore.type='button';
    restore.textContent='Taslağı Geri Yükle';
    restore.addEventListener('click',()=>{
      if(!localStorage.getItem(KEY)) return alert('Kayıtlı taslak yok.');
      if(confirm('Kayıtlı taslak geri yüklensin mi?')) restoreDraft();
    });

    const clear=document.createElement('button');
    clear.className='btn red';
    clear.id='clearDraftBtn';
    clear.type='button';
    clear.textContent='Taslağı Sil';
    clear.addEventListener('click',()=>{
      if(confirm('Kayıtlı taslak silinsin mi?')){ clearDraft(); alert('Taslak silindi.'); }
    });

    top.append(save,restore,clear);
  }

  function maybeOfferRestore(){
    const raw=localStorage.getItem(KEY);
    if(!raw) return;
    const meta=localStorage.getItem(META);
    const when=meta?new Date(meta).toLocaleString():'bilinmeyen zaman';
    setTimeout(()=>{
      if(confirm('Kaydedilmemiş bir ilan taslağı bulundu ('+when+'). Geri yüklensin mi?')) restoreDraft();
    },500);
  }

  window.SIRILAND_MODULES=window.SIRILAND_MODULES||{};
  window.SIRILAND_MODULES.autosave={name:'Autosave & Recovery',version:'1.0.0',saveDraft,restoreDraft,clearDraft};

  window.addEventListener('DOMContentLoaded',()=>{
    installToolbar();
    maybeOfferRestore();
    setInterval(()=>saveDraft(false),SAVE_INTERVAL);
  });
  window.addEventListener('beforeunload',()=>saveDraft(false));
})();
