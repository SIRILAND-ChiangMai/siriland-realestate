
/* SIRILAND Image Physical Save FIX
   Ensures selected image File objects are physically written into 01_CMS/images
   before JSON/JS save or Auto Publish begins.
*/
(function(){
  let bypass = false;
  let cachedCmsHandle = null;

  function toast(message,type='ok'){
    if(typeof adminUxToast==='function') adminUxToast(message,type);
    else console.log(message);
  }

  function currentFiles(){
    try{
      return Array.isArray(imageFiles) ? imageFiles : [];
    }catch(e){
      return [];
    }
  }

  function currentProperty(){
    if(typeof getForm==='function') return getForm();
    if(typeof readForm==='function') return readForm();
    throw new Error('İlan formu okunamadı.');
  }

  async function permissionNow(handle){
    if(!handle) return false;
    try{
      const q = await handle.queryPermission({mode:'readwrite'});
      if(q === 'granted') return true;
    }catch(e){}
    try{
      return (await handle.requestPermission({mode:'readwrite'})) === 'granted';
    }catch(e){
      return false;
    }
  }

  async function acquireHandleFromClick(){
    // Reuse the Integrated Publish Manager CMS handle when possible.
    try{
      if(window.publishHandles?.cms && await permissionNow(window.publishHandles.cms)){
        cachedCmsHandle = window.publishHandles.cms;
        return cachedCmsHandle;
      }
    }catch(e){}

    if(cachedCmsHandle && await permissionNow(cachedCmsHandle)){
      return cachedCmsHandle;
    }

    // showDirectoryPicker is called directly from the user's click handler.
    if(!('showDirectoryPicker' in window)){
      throw new Error('Bu tarayıcı klasöre doğrudan yazmayı desteklemiyor. Chrome veya Edge kullan.');
    }

    const handle = await window.showDirectoryPicker({
      id:'siriland-cms-image-save',
      mode:'readwrite',
      startIn:'documents'
    });

    if(!(await permissionNow(handle))){
      throw new Error('01_CMS klasörüne yazma izni verilmedi.');
    }

    cachedCmsHandle = handle;

    try{
      if(window.publishHandles) window.publishHandles.cms = handle;
      if(typeof publishSaveHandle==='function') await publishSaveHandle('cms',handle);
    }catch(e){}

    return handle;
  }

  async function writeFile(root,path,file){
    const parts = String(path).replaceAll('\\','/').split('/').filter(Boolean);
    const filename = parts.pop();
    let dir = root;

    for(const part of parts){
      dir = await dir.getDirectoryHandle(part,{create:true});
    }

    const fileHandle = await dir.getFileHandle(filename,{create:true});
    const writable = await fileHandle.createWritable();
    await writable.write(file);
    await writable.close();
  }

  async function verifyFile(root,path,expectedSize){
    try{
      const parts = String(path).replaceAll('\\','/').split('/').filter(Boolean);
      const filename = parts.pop();
      let dir = root;
      for(const part of parts) dir = await dir.getDirectoryHandle(part);
      const handle = await dir.getFileHandle(filename);
      const saved = await handle.getFile();
      return saved.size === expectedSize;
    }catch(e){
      return false;
    }
  }

  async function saveSelectedImages(handle){
    const files = currentFiles();
    if(!files.length){
      return {count:0,paths:[]};
    }

    const property = currentProperty();
    const paths = Array.isArray(property.images) ? property.images.slice() : [];

    if(paths.length !== files.length){
      throw new Error(`Fotoğraf yolu sayısı uyuşmuyor: ${files.length} dosya / ${paths.length} yol.`);
    }

    toast(`${files.length} fotoğraf CMS images klasörüne yazılıyor...`);

    for(let i=0;i<files.length;i++){
      await writeFile(handle,paths[i],files[i]);
      const valid = await verifyFile(handle,paths[i],files[i].size);
      if(!valid) throw new Error(`Fotoğraf doğrulanamadı: ${paths[i]}`);
    }

    // Preserve the paths as existing images after the next render.
    try{
      existingImageList = paths.slice();
      pendingFilesById[property.id] = files.slice();
    }catch(e){}

    return {count:files.length,paths,property};
  }

  async function executeOriginal(buttonId){
    bypass = true;
    try{
      if(buttonId === 'autoPublishNowBtn' && typeof autoPublishSaveAndPush==='function'){
        await autoPublishSaveAndPush();
        return;
      }

      if((buttonId === 'saveEngineSaveBtn' || buttonId === 'stickySavePropertyBtn') &&
         typeof saveEngineSaveAll==='function'){
        await saveEngineSaveAll();
        return;
      }

      // Fallback to the original button click.
      document.getElementById(buttonId)?.click();
    }finally{
      setTimeout(()=>{ bypass=false; },100);
    }
  }

  async function intercept(event){
    if(bypass) return;

    const button = event.target.closest(
      '#saveEngineSaveBtn, #stickySavePropertyBtn, #autoPublishNowBtn'
    );
    if(!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Fotoğraflar kaydediliyor...';

    try{
      const files = currentFiles();

      if(files.length){
        const handle = await acquireHandleFromClick();
        const result = await saveSelectedImages(handle);
        toast(`${result.count} fotoğraf fiziksel olarak kaydedildi.`,'ok');
      }

      await executeOriginal(button.id);

      const id = document.getElementById('id')?.value || '';
      if(files.length){
        toast(`${id}: ${files.length} fotoğraf + ilan verisi kaydedildi.`,'ok');
      }
    }catch(error){
      console.error(error);
      toast(error.message,'error');
      alert(
        'Fotoğraflar CMS klasörüne kaydedilemedi:\n\n' +
        error.message +
        '\n\nKlasör seçme ekranında şunu seç:\n' +
        'E:\\SIRILAND_2030_Harddisk_Structure\\01_CMS'
      );
    }finally{
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  document.addEventListener('click',intercept,true);
})();
