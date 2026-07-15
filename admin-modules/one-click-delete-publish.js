
/* SIRILAND One-Click Delete + Export + Publish */
(function(){
  let deleteInProgress = false;

  function toast(message,type='ok'){
    if(typeof adminUxToast==='function') adminUxToast(message,type);
    else console.log(message);
  }

  function findDeleteId(target){
    const btn = target.closest(
      '[data-delete-property], [data-db-delete], .deletePropertyBtn, .delete-btn'
    );
    if(!btn) return null;

    return (
      btn.dataset.deleteProperty ||
      btn.dataset.dbDelete ||
      btn.dataset.id ||
      btn.closest('[data-id]')?.dataset.id ||
      null
    );
  }

  function removePropertyFromMemory(id){
    const before = Array.isArray(properties) ? properties.length : 0;
    properties = (properties || []).filter(p => String(p.id) !== String(id));
    return before - properties.length;
  }

  function refreshAdmin(){
    try{ renderList?.(); }catch(e){}
    try{ renderDashboard?.(); }catch(e){}
    try{ validate?.(); }catch(e){}
    try{ dbSelected?.delete?.(window.__deletedId); }catch(e){}
    try{ dbRefreshFilters?.(); }catch(e){}
    try{ dbRender?.(); }catch(e){}
  }

  async function acquireCmsHandleFromClick(){
    try{
      if(window.publishHandles?.cms){
        const q = await window.publishHandles.cms.queryPermission({mode:'readwrite'});
        if(q === 'granted') return window.publishHandles.cms;

        const r = await window.publishHandles.cms.requestPermission({mode:'readwrite'});
        if(r === 'granted') return window.publishHandles.cms;
      }
    }catch(e){}

    try{
      const existing = await saveEngineLoadHandle?.();
      if(existing){
        const q = await existing.queryPermission({mode:'readwrite'});
        if(q === 'granted') return existing;

        const r = await existing.requestPermission({mode:'readwrite'});
        if(r === 'granted') return existing;
      }
    }catch(e){}

    if(!('showDirectoryPicker' in window)){
      throw new Error('Chrome veya Edge ile yerel admini aç.');
    }

    const handle = await window.showDirectoryPicker({
      id:'siriland-delete-save',
      mode:'readwrite'
    });

    if(window.publishHandles) window.publishHandles.cms = handle;
    try{ await publishSaveHandle?.('cms',handle); }catch(e){}
    return handle;
  }

  async function writeExports(handle){
    const json = JSON.stringify(properties || [], null, 2);
    const jsText = `window.PROPERTIES = ${json};\n`;

    if(typeof saveEngineWriteFile === 'function'){
      await saveEngineWriteFile(handle,'properties.json',json,'application/json');
      await saveEngineWriteFile(handle,'properties.js',jsText,'text/javascript');
      try{
        await saveEngineWriteFile(handle,'data/properties.json',json,'application/json');
      }catch(e){}
      return;
    }

    if(typeof publishWriteFile === 'function'){
      await publishWriteFile(handle,'properties.json',new Blob([json],{type:'application/json'}));
      await publishWriteFile(handle,'properties.js',new Blob([jsText],{type:'text/javascript'}));
      try{
        await publishWriteFile(handle,'data/properties.json',new Blob([json],{type:'application/json'}));
      }catch(e){}
      return;
    }

    throw new Error('Export yazma motoru bulunamadı.');
  }

  async function verifyDeleted(handle,id){
    let jsText = null;
    let jsonText = null;

    try{
      if(typeof saveEngineReadText === 'function'){
        jsText = await saveEngineReadText(handle,'properties.js');
        jsonText = await saveEngineReadText(handle,'properties.json');
      }else if(typeof publishReadFile === 'function'){
        const jsFile = await publishReadFile(handle,'properties.js');
        const jsonFile = await publishReadFile(handle,'properties.json');
        jsText = jsFile ? await jsFile.text() : '';
        jsonText = jsonFile ? await jsonFile.text() : '';
      }
    }catch(e){}

    const stillInJs = Boolean(jsText && jsText.includes(`"${id}"`));
    let stillInJson = false;
    try{
      const list = JSON.parse(jsonText || '[]');
      stillInJson = Array.isArray(list) && list.some(p => String(p.id) === String(id));
    }catch(e){}

    return !stillInJs && !stillInJson;
  }

  async function autoPublishDeletion(id){
    try{
      if(typeof autoPublishRequest !== 'function') return {published:false,reason:'service unavailable'};

      const health = await autoPublishRequest('/health',{timeout:5000});
      if(!health?.ok) return {published:false,reason:'service closed'};

      const result = await autoPublishRequest('/publish',{
        method:'POST',
        body:{
          propertyId:id,
          commitMessage:`Delete ${id} from SIRILAND`
        },
        timeout:180000
      });

      return {published:true,result};
    }catch(error){
      return {published:false,reason:error.message};
    }
  }

  async function deleteAndPublish(id){
    if(deleteInProgress) return;
    deleteInProgress = true;
    window.__deletedId = id;

    try{
      const property = (properties || []).find(p => String(p.id) === String(id));
      const title = property?.title
        ? (typeof property.title === 'string'
            ? property.title
            : property.title.th || property.title.en || '')
        : '';

      const ok = confirm(
        `${id}${title ? ' — ' + title : ''}\n\n` +
        `Bu ilan adminden ve website exportundan silinsin mi?`
      );
      if(!ok) return;

      toast(`${id} siliniyor...`);

      const removed = removePropertyFromMemory(id);
      if(!removed) throw new Error(`${id} admin listesinde bulunamadı.`);

      localStorage.setItem('siriland_properties_backup',JSON.stringify(properties || []));
      localStorage.setItem('siriland_last_property_count',String((properties || []).length));
      refreshAdmin();

      const handle = await acquireCmsHandleFromClick();
      await writeExports(handle);

      const verified = await verifyDeleted(handle,id);
      if(!verified) throw new Error(`${id} properties.json/properties.js içinden silinemedi.`);

      toast(`${id} export dosyalarından silindi.`,'ok');

      const publish = await autoPublishDeletion(id);

      if(publish.published){
        toast(`${id} website'den otomatik kaldırıldı.`,'ok');
        alert(
          `${id} başarıyla silindi.\n\n` +
          `✓ Admin listesinden kaldırıldı\n` +
          `✓ properties.json güncellendi\n` +
          `✓ properties.js güncellendi\n` +
          `✓ GitHub'a otomatik push yapıldı`
        );
      }else{
        alert(
          `${id} yerel CMS'den başarıyla silindi.\n\n` +
          `✓ Admin listesinden kaldırıldı\n` +
          `✓ properties.json güncellendi\n` +
          `✓ properties.js güncellendi\n\n` +
          `Auto Publish servisi kapalı olduğu için website henüz güncellenmedi.\n` +
          `Publish sekmesinden Smart Publish yap veya Auto Publish servisini başlat.`
        );
      }
    }catch(error){
      console.error(error);
      toast(error.message,'error');
      alert('Silme işlemi tamamlanamadı:\n\n' + error.message);
    }finally{
      deleteInProgress = false;
      window.__deletedId = null;
    }
  }

  document.addEventListener('click',function(event){
    const id = findDeleteId(event.target);
    if(!id) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    deleteAndPublish(id);
  },true);
})();
