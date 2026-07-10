
(function(){
  const NS=window.SIRILAND_CORE=window.SIRILAND_CORE||{};
  NS.VERSION='5.0-phase-1';
  NS.MANIFEST_KEY='siriland_core_manifest_v1';

  NS.clone=value=>JSON.parse(JSON.stringify(value));
  NS.escape=value=>String(value??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[ch]));

  NS.stableStringify=function(value){
    const sort=v=>{
      if(Array.isArray(v))return v.map(sort);
      if(v&&typeof v==='object'){
        return Object.keys(v).sort().reduce((o,k)=>{o[k]=sort(v[k]);return o},{});
      }
      return v;
    };
    return JSON.stringify(sort(value));
  };

  NS.hashText=async function(text){
    const data=new TextEncoder().encode(String(text));
    const digest=await crypto.subtle.digest('SHA-256',data);
    return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  };

  NS.getManifest=function(){
    try{return JSON.parse(localStorage.getItem(NS.MANIFEST_KEY)||'{"files":{},"lastBuild":null}')}
    catch(e){return {files:{},lastBuild:null}}
  };
  NS.setManifest=function(manifest){
    localStorage.setItem(NS.MANIFEST_KEY,JSON.stringify(manifest));
  };
  NS.log=function(message,type='info'){
    const el=document.getElementById('corePublishLog');
    if(!el)return;
    const line=document.createElement('div');
    line.className=type;
    line.textContent=`${new Date().toLocaleTimeString()} ${message}`;
    el.appendChild(line);
    el.scrollTop=el.scrollHeight;
  };
})();
