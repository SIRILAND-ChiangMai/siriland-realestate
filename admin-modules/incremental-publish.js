
(function(){
  const NS=window.SIRILAND_CORE;
  if(!NS)return;

  async function ensureHandles(){
    if(!window.publishHandles)throw new Error('Integrated Publish Manager yüklenmedi.');
    if(!publishHandles.github)publishHandles.github=await publishLoadHandle('github');
    if(!publishHandles.backup)publishHandles.backup=await publishLoadHandle('backup');
    if(!publishHandles.github)throw new Error('Önce GitHub Repository klasörünü seç.');
    const ok=await publishRequestPermission(publishHandles.github,'readwrite');
    if(!ok)throw new Error('GitHub klasörü yazma izni verilmedi.');
  }

  async function quickBackupChanged(analysis){
    if(!publishHandles.backup)return null;
    const allowed=await publishRequestPermission(publishHandles.backup,'readwrite');
    if(!allowed)return null;
    const root=await publishHandles.backup.getDirectoryHandle('Incremental',{create:true});
    const stamp=publishStamp();
    const dir=await root.getDirectoryHandle('Changes_'+stamp,{create:true});
    let count=0;
    for(const path of analysis.changed){
      const existing=await publishReadFile(publishHandles.github,path);
      if(existing){
        await publishWriteFile(dir,path,existing);
        count++;
      }
    }
    return {name:'Changes_'+stamp,count};
  }

  NS.publishChanged=async function(){
    await ensureHandles();
    const analysis=NS.lastAnalysis||await NS.analyze();
    if(!analysis.changed.length&&!analysis.deleted.length){
      NS.log('Değişen dosya yok. Publish gerekmiyor.','warn');
      return {changed:0,deleted:0};
    }

    NS.log(`${analysis.changed.length} dosya incremental publish için hazırlanıyor.`,'info');
    const backup=await quickBackupChanged(analysis);
    if(backup)NS.log(`Hızlı yedek: ${backup.name} (${backup.count} dosya)`,'ok');

    let written=0;
    for(const path of analysis.changed){
      const content=analysis.generated.get(path);
      await publishWriteFile(
        publishHandles.github,
        path,
        new Blob([content],{type:'application/json'})
      );
      written++;
      NS.log(`Yazıldı: ${path}`,'ok');
    }

    // Browser API cannot reliably remove unknown nested files without explicit handle work.
    // Deleted paths are written to a deletion manifest for safe/manual cleanup.
    if(analysis.deleted.length){
      const deletionReport={
        generatedAt:new Date().toISOString(),
        deletedFiles:analysis.deleted
      };
      await publishWriteFile(
        publishHandles.github,
        'deleted-properties-manifest.json',
        new Blob([JSON.stringify(deletionReport,null,2)],{type:'application/json'})
      );
      NS.log(`${analysis.deleted.length} silinen dosya deletion manifestine yazıldı.`,'warn');
    }

    analysis.nextManifest.lastBuild=new Date().toISOString();
    NS.setManifest(analysis.nextManifest);
    NS.lastAnalysis=await NS.analyze();
    NS.log(`Incremental publish tamamlandı: ${written} dosya.`,'ok');
    window.dispatchEvent(new CustomEvent('siriland-core-analysis',{detail:NS.lastAnalysis}));
    return {changed:written,deleted:analysis.deleted.length};
  };
})();
