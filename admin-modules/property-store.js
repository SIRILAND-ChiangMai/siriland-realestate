
(function(){
  const NS=window.SIRILAND_CORE;
  if(!NS)return;

  NS.getProperties=()=>Array.isArray(window.properties)?window.properties:[];

  NS.propertyPath=p=>`properties/${String(p.id||'UNKNOWN').trim()}.json`;

  NS.buildIndex=function(list=NS.getProperties()){
    return list.map(p=>({
      id:p.id||'',
      city:p.city||'',
      type:p.type||'',
      deal:p.deal||'',
      status:p.status||'',
      price:p.price||p.salePrice||p.rentPrice||'',
      cover:Array.isArray(p.images)&&p.images.length?p.images[0]:'',
      updatedAt:p.updatedAt||p.createdAt||''
    }));
  };

  NS.generateFiles=function(list=NS.getProperties()){
    const files=new Map();
    list.forEach(p=>{
      if(!p?.id)return;
      files.set(NS.propertyPath(p),JSON.stringify(p,null,2));
    });
    files.set('properties-index.json',JSON.stringify(NS.buildIndex(list),null,2));
    files.set('properties-manifest.json',JSON.stringify({
      generatedAt:new Date().toISOString(),
      count:list.length,
      version:NS.VERSION,
      files:list.filter(p=>p?.id).map(p=>NS.propertyPath(p))
    },null,2));
    return files;
  };

  NS.analyze=async function(){
    const generated=NS.generateFiles();
    const oldManifest=NS.getManifest();
    const nextManifest={files:{},lastBuild:oldManifest.lastBuild};
    const changed=[],unchanged=[],deleted=[];

    for(const [path,content] of generated){
      const hash=await NS.hashText(content);
      nextManifest.files[path]=hash;
      if(oldManifest.files?.[path]===hash)unchanged.push(path);
      else changed.push(path);
    }
    Object.keys(oldManifest.files||{}).forEach(path=>{
      if(!generated.has(path))deleted.push(path);
    });

    return {generated,nextManifest,changed,unchanged,deleted};
  };

  NS.onPropertySaved=async function(id){
    try{
      NS.log(`İlan kaydedildi: ${id||'ID yok'}`,'ok');
      const analysis=await NS.analyze();
      NS.lastAnalysis=analysis;
      window.dispatchEvent(new CustomEvent('siriland-core-analysis',{detail:analysis}));
    }catch(e){
      NS.log('Save hook hatası: '+e.message,'error');
    }
  };
})();
