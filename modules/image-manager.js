(function(){
  'use strict';
  window.SIRILAND_MODULES=window.SIRILAND_MODULES||{};
  window.SIRILAND_MODULES.imageManager={name:'Media Manager PRO',version:'2.0.0'};

  const $m=id=>document.getElementById(id);
  const allowed=new Set(['image/jpeg','image/png','image/webp']);
  const MAX_BYTES=8*1024*1024;
  const WARN_BYTES=4*1024*1024;
  const MIN_WIDTH=900;
  const MIN_HEIGHT=600;
  let scanToken=0;

  function fmtBytes(n){
    if(!Number.isFinite(n))return '-';
    if(n<1024)return n+' B';
    if(n<1024*1024)return (n/1024).toFixed(1)+' KB';
    return (n/1024/1024).toFixed(1)+' MB';
  }
  function currentFiles(){
    try{return Array.isArray(imageFiles)?imageFiles:[]}catch(e){return []}
  }
  function existingFiles(){
    try{return Array.isArray(existingImageList)?existingImageList:[]}catch(e){return []}
  }
  function setFiles(files,append=true){
    const incoming=Array.from(files||[]).filter(f=>allowed.has(f.type));
    const rejected=Array.from(files||[]).filter(f=>!allowed.has(f.type));
    const list=append?currentFiles().slice():[];
    const seen=new Set(list.map(f=>`${f.name}|${f.size}|${f.lastModified}`));
    incoming.forEach(f=>{const k=`${f.name}|${f.size}|${f.lastModified}`;if(!seen.has(k)){list.push(f);seen.add(k)}});
    imageFiles=list;
    if(list.length) existingImageList=[];
    if(typeof renderImages==='function')renderImages();
    scan();
    if(rejected.length) alert('Desteklenmeyen dosyalar atlandı: '+rejected.map(f=>f.name).join(', '));
  }
  function readDimensions(file){
    return new Promise(resolve=>{
      const url=URL.createObjectURL(file); const img=new Image();
      img.onload=()=>{resolve({width:img.naturalWidth,height:img.naturalHeight});URL.revokeObjectURL(url)};
      img.onerror=()=>{resolve({width:0,height:0});URL.revokeObjectURL(url)};
      img.src=url;
    });
  }
  async function scan(){
    const token=++scanToken;
    const files=currentFiles(); const existing=existingFiles();
    const stats=$m('imageStats'), warnings=$m('imageWarnings');
    if(!stats||!warnings)return;
    if(!files.length){
      stats.textContent=existing.length?`${existing.length} mevcut fotoğraf • İlk fotoğraf kapak`:'Henüz fotoğraf seçilmedi.';
      warnings.innerHTML=existing.length?'<div class="imageOk">Mevcut fotoğraf yolları hazır. Yeni kalite taraması yalnızca bilgisayardan seçilen dosyalarda yapılır.</div>':'';
      return;
    }
    const total=files.reduce((s,f)=>s+f.size,0);
    stats.textContent=`${files.length} yeni fotoğraf • Toplam ${fmtBytes(total)} • Kapak: ${files[0].name}`;
    warnings.innerHTML='<div class="imageOk">Fotoğraf kalitesi kontrol ediliyor…</div>';
    const result=[];
    for(let i=0;i<files.length;i++){
      const f=files[i], dim=await readDimensions(f);
      if(token!==scanToken)return;
      const issues=[];
      if(f.size>MAX_BYTES)issues.push('8 MB sınırını aşıyor'); else if(f.size>WARN_BYTES)issues.push('dosya büyük');
      if(!dim.width||!dim.height)issues.push('görüntü okunamadı');
      else if(dim.width<MIN_WIDTH||dim.height<MIN_HEIGHT)issues.push(`çözünürlük düşük (${dim.width}×${dim.height})`);
      result.push({f,dim,issues});
    }
    if(token!==scanToken)return;
    const bad=result.filter(x=>x.issues.length);
    warnings.innerHTML=(bad.length?bad.map(x=>`<div class="imageWarning"><b>${escapeHtml(x.f.name)}</b> — ${x.issues.join(', ')} <span class="imageMeta">${fmtBytes(x.f.size)} • ${x.dim.width||'?'}×${x.dim.height||'?'}</span></div>`).join(''):'<div class="imageOk">✓ Tüm yeni fotoğraflar kalite kontrolünden geçti.</div>');
  }
  function init(){
    const input=$m('imageFiles'), zone=$m('imageDropZone'), choose=$m('chooseImagesBtn');
    if(!input||!zone)return;
    choose&&choose.addEventListener('click',e=>{e.stopPropagation();input.click()});
    zone.addEventListener('click',e=>{if(e.target.closest('button'))return;input.click()});
    zone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click()}});
    ['dragenter','dragover'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.add('dragover')}));
    ['dragleave','drop'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.remove('dragover')}));
    zone.addEventListener('drop',e=>setFiles(e.dataTransfer.files,true));
    input.onchange=e=>{setFiles(e.target.files,true);input.value=''};
    $m('sortImagesBtn')?.addEventListener('click',()=>{imageFiles=currentFiles().slice().sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));renderImages();scan()});
    $m('refreshImageCheckBtn')?.addEventListener('click',scan);
    $m('clearNewImagesBtn')?.addEventListener('click',()=>{if(!currentFiles().length)return;if(confirm('Yeni seçilen fotoğraflar temizlensin mi?')){imageFiles=[];renderImages();scan()}});
    const original=window.renderImages;
    if(typeof original==='function'){
      window.renderImages=function(){original.apply(this,arguments);queueMicrotask(scan)};
    }
    window.SIRILAND_MEDIA_REFRESH=scan;
    scan();
  }
  window.addEventListener('DOMContentLoaded',init);
  window.addEventListener('beforeunload',()=>{document.querySelectorAll('#imagePreview img').forEach(img=>{if(img.src&&img.src.startsWith('blob:'))URL.revokeObjectURL(img.src)})});
})();
