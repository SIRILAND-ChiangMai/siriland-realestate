
(function(){
  const NS=window.SIRILAND_CORE;
  if(!NS)return;
  const $=id=>document.getElementById(id);

  function render(analysis){
    const list=NS.getProperties();
    $('corePropertyCount').textContent=list.length;
    $('coreJsonCount').textContent=analysis.generated.size;
    $('coreChangedCount').textContent=analysis.changed.length;
    $('coreDeletedCount').textContent=analysis.deleted.length;
    $('coreLastBuild').textContent=NS.getManifest().lastBuild
      ? new Date(NS.getManifest().lastBuild).toLocaleString()
      : '—';

    $('coreChangedList').innerHTML=[
      ...analysis.changed.map(path=>`<div><b>${NS.escape(path)}</b><small>Changed / New</small></div>`),
      ...analysis.deleted.map(path=>`<div><b>${NS.escape(path)}</b><small>Deleted</small></div>`)
    ].join('')||'<span class="muted">Değişiklik yok</span>';

    $('coreGeneratedList').innerHTML=[...analysis.generated.keys()].slice(0,100).map(path=>
      `<div><b>${NS.escape(path)}</b><small>Ready</small></div>`
    ).join('');

    $('coreArchitectureStatus').innerHTML=[
      ['Legacy website data','properties.js aktif'],
      ['New property files',`${list.length} ayrı JSON hazır`],
      ['Index','properties-index.json hazır'],
      ['Manifest','properties-manifest.json hazır'],
      ['Publish mode','Incremental / changed only'],
      ['Migration risk','Düşük — paralel yapı']
    ].map(([a,b])=>`<div><b>${NS.escape(a)}</b><small>${NS.escape(b)}</small></div>`).join('');
  }

  async function analyze(){
    NS.log('Property dosyaları analiz ediliyor...','info');
    const analysis=await NS.analyze();
    NS.lastAnalysis=analysis;
    render(analysis);
    NS.log(`Analiz tamamlandı: ${analysis.changed.length} değişen, ${analysis.deleted.length} silinen.`,'ok');
    return analysis;
  }

  function downloadArchitecture(){
    const data={
      sprint:'5.0 Core Refactor Phase 1',
      generatedAt:new Date().toISOString(),
      propertyCount:NS.getProperties().length,
      architecture:{
        legacy:'properties.js',
        parallelFiles:'properties/<ID>.json',
        index:'properties-index.json',
        manifest:'properties-manifest.json',
        publish:'incremental changed-only'
      },
      nextPhases:[
        'Website loader reads properties-index.json',
        'Lazy-load property detail JSON',
        'Images move to images/<ID>/',
        'Remove legacy properties.js after verification'
      ]
    };
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='SIRILAND-Core-Refactor-Architecture.json';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),500);
  }

  async function init(){
    $('coreAnalyzeBtn')?.addEventListener('click',analyze);
    $('coreBuildFilesBtn')?.addEventListener('click',async()=>{
      const a=await analyze();
      NS.log(`${a.generated.size} property/index dosyası bellekte oluşturuldu.`,'ok');
      alert('Property JSON dosyaları hazırlandı. “Sadece Değişenleri Publish Et” ile GitHub klasörüne yazabilirsin.');
    });
    $('coreIncrementalPublishBtn')?.addEventListener('click',async()=>{
      try{
        await analyze();
        const result=await NS.publishChanged();
        alert(`Hızlı publish tamamlandı.\n\nYazılan dosya: ${result.changed}\nSilme kaydı: ${result.deleted}\n\nŞimdi GitHub Desktop’ta Commit + Push yap.`);
      }catch(e){
        NS.log(e.message,'error');
        alert('Incremental publish hatası: '+e.message);
      }
    });
    $('coreExportArchitectureBtn')?.addEventListener('click',downloadArchitecture);
    $('coreResetManifestBtn')?.addEventListener('click',()=>{
      if(confirm('Incremental publish manifesti sıfırlansın mı? Sonraki analizde tüm property JSON dosyaları değişmiş görünecek.')){
        localStorage.removeItem(NS.MANIFEST_KEY);
        analyze();
      }
    });
    window.addEventListener('siriland-core-analysis',e=>render(e.detail));
    setTimeout(analyze,1000);
  }

  window.addEventListener('DOMContentLoaded',init);
})();
