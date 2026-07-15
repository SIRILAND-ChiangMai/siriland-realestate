
/* SIRILAND Safe Data Engine v5
   Canonical source: properties.json
   Compatibility output: SIRILAND_PROPERTIES + PROPERTIES + properties
*/
(function(){
  const SAFE_COUNT_KEY='siriland_safe_property_count';
  const SAFE_BACKUP_KEY='siriland_safe_properties_backup_v5';

  function getList(){
    try{
      if(Array.isArray(window.properties)) return window.properties;
    }catch(e){}
    try{
      if(typeof properties!=='undefined' && Array.isArray(properties)) return properties;
    }catch(e){}
    return [];
  }

  function validate(list, options={}){
    if(!Array.isArray(list)) throw new Error('Property verisi array değil.');
    if(list.length===0) throw new Error('Güvenlik kilidi: 0 ilanlı export engellendi.');

    const ids=list.map(p=>String(p?.id||'').trim());
    if(ids.some(id=>!id)) throw new Error('Güvenlik kilidi: ID eksik ilan var.');
    if(new Set(ids).size!==ids.length) throw new Error('Güvenlik kilidi: duplicate ID bulundu.');

    const previous=Number(localStorage.getItem(SAFE_COUNT_KEY)||0);
    const allowedDrop=Number(options.allowedDrop??1);
    if(previous && list.length < previous-allowedDrop){
      throw new Error(`Güvenlik kilidi: ilan sayısı ${previous} → ${list.length}. Export durduruldu.`);
    }
    return true;
  }

  function jsonText(list){
    validate(list,{allowedDrop:1});
    return JSON.stringify(list,null,2);
  }

  function jsText(list){
    const json=jsonText(list);
    return [
      '/* SIRILAND canonical property dataset — generated from properties.json */',
      `window.SIRILAND_PROPERTIES = ${json};`,
      'window.PROPERTIES = window.SIRILAND_PROPERTIES;',
      'window.properties = window.SIRILAND_PROPERTIES;',
      'const properties = window.SIRILAND_PROPERTIES;',
      ''
    ].join('\n');
  }

  function saveSafeBackup(list){
    validate(list,{allowedDrop:1});
    localStorage.setItem(SAFE_BACKUP_KEY,JSON.stringify(list));
    localStorage.setItem(SAFE_COUNT_KEY,String(list.length));
  }

  window.SIRILAND_SAFE_DATA={
    validate,
    jsonText,
    jsText,
    saveSafeBackup,
    restore(){
      const raw=localStorage.getItem(SAFE_BACKUP_KEY);
      if(!raw) return null;
      const list=JSON.parse(raw);
      validate(list,{allowedDrop:9999});
      return list;
    }
  };

  // Replace Save Engine output format when those functions are globally available.
  function patchGlobals(){
    if(typeof window.saveEngineBuildJson==='function'){
      window.saveEngineBuildJson=function(){
        const list=getList();
        return jsonText(list);
      };
    }
    if(typeof window.saveEngineBuildJs==='function'){
      window.saveEngineBuildJs=function(){
        const list=getList();
        return jsText(list);
      };
    }

    const list=getList();
    if(list.length){
      try{saveSafeBackup(list)}catch(e){console.error(e)}
    }
  }

  // Block dangerous save/export clicks before old handlers can write bad data.
  document.addEventListener('click',function(event){
    const button=event.target.closest(
      '#saveEngineSaveBtn,#stickySavePropertyBtn,#autoPublishNowBtn,'+
      '#directSaveJsonBtn,#directSaveJsBtn,#directSaveBothBtn'
    );
    if(!button) return;

    try{
      validate(getList(),{allowedDrop:1});
    }catch(error){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      alert(error.message+'\n\nDosyaların üzerine yazılmadı.');
    }
  },true);

  window.addEventListener('DOMContentLoaded',()=>{
    setTimeout(patchGlobals,50);
    setTimeout(patchGlobals,800);
  });
})();
