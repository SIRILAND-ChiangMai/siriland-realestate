
;(() => {
'use strict';
const PM42_KEY='siriland_publish_manager_42';
const PM42_SNAPSHOT_KEY='siriland_publish_snapshot_42';
const PM42_HISTORY_KEY='siriland_export_history_42';
const PM42_VERSION='4.2.0';
let pm42LastReport=null;
let pm42Busy=false;

const q=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const nowIso=()=>new Date().toISOString();
const dateKey=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Bangkok'}).replaceAll('-','.');
const bytes=n=>{if(!Number.isFinite(n))return '—';const u=['B','KB','MB','GB'];let i=0;while(n>=1024&&i<u.length-1){n/=1024;i++}return `${n.toFixed(i?1:0)} ${u[i]}`};
const arr=v=>Array.isArray(v)?v:[];
const txt=v=>v&&typeof v==='object'&&!Array.isArray(v)?(v.en||v.th||v.tr||v.zh||''):String(v??'');
const missing=v=>v===null||v===undefined||String(v).trim()==='';
const getProps=()=>Array.isArray(properties)?properties:[];
const safeJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}};
const saveJson=(key,val)=>localStorage.setItem(key,JSON.stringify(val));

function snapshotOf(list){
 const out={}; list.forEach(p=>{if(!p?.id)return;const c=JSON.parse(JSON.stringify(p));delete c.updatedAt;out[p.id]=JSON.stringify(c)});return out;
}
function changesFor(list){
 const prev=safeJson(PM42_SNAPSHOT_KEY,{}), cur=snapshotOf(list), added=[],updated=[],deleted=[];
 Object.keys(cur).forEach(id=>{if(!(id in prev))added.push(id);else if(prev[id]!==cur[id])updated.push(id)});
 Object.keys(prev).forEach(id=>{if(!(id in cur))deleted.push(id)});
 return {added,updated,deleted,current:cur};
}
function qualityFor(p){
 const checks=[p.id,p.city,p.type,p.deal,p.status,!missing(p.price)||!missing(p.salePrice)||!missing(p.rentPrice),txt(p.title),p.area||p.landSize||p.landAreaSqm,arr(p.images).length];
 return Math.round(checks.filter(Boolean).length/checks.length*100);
}
function inspect(list){
 const hard=[],warnings=[],missingRows=[],ids=new Set();let imageCount=0,totalQuality=0;
 list.forEach((p,i)=>{
  const id=p?.id||`Row ${i+1}`;
  if(!p?.id)hard.push(`${id}: ID missing`);
  if(p?.id&&ids.has(p.id))hard.push(`${id}: Duplicate ID`); if(p?.id)ids.add(p.id);
  const add=(field,msg)=>{warnings.push(`${id}: ${msg}`);missingRows.push({id,field,message:msg})};
  if(missing(p?.city))add('city','City missing');
  if(missing(p?.type))add('type','Type missing');
  if(missing(p?.deal))add('deal','Deal missing');
  if(missing(p?.status))add('status','Status missing');
  if(missing(p?.price)&&missing(p?.salePrice)&&missing(p?.rentPrice))add('price','Price missing');
  if(!txt(p?.title))add('title','Title missing');
  if(missing(p?.area)&&missing(p?.landSize)&&missing(p?.landAreaSqm))add('area','Area missing');
  if(!arr(p?.images).length)add('images','Cover/image missing');
  imageCount+=arr(p?.images).length; totalQuality+=qualityFor(p||{});
 });
 return {hard,warnings,missingRows,imageCount,avgQuality:list.length?Math.round(totalQuality/list.length):0};
}
function versionNext(){
 const state=safeJson(PM42_KEY,{}),today=dateKey(); let seq=state.day===today?(Number(state.seq)||0)+1:1;
 saveJson(PM42_KEY,{day:today,seq});return `${today}-${String(seq).padStart(3,'0')}`;
}
function currentVersionPreview(){const s=safeJson(PM42_KEY,{}),today=dateKey();return `${today}-${String(s.day===today?(Number(s.seq)||0)+1:1).padStart(3,'0')}`}
function statsToday(history){const today=dateKey();return history.filter(x=>String(x.version||'').startsWith(today)).length}

function injectUI(){
 if(q('pm42Panel'))return;
 const host=q('dashboardPanel')||document.querySelector('.wrap .hint')?.nextElementSibling||document.querySelector('.wrap');
 const el=document.createElement('section');el.id='pm42Panel';el.className='pm42-panel';
 el.innerHTML=`<div class="pm42-head"><div><h2 class="pm42-title">🚀 Publish Manager PRO</h2><div class="pm42-sub">Sprint 4.2 · Export Summary · Checklist · Missing Data · Statistics</div></div><div id="pm42Status" class="pm42-status">NOT CHECKED</div></div>
 <div class="pm42-grid"><div class="pm42-card"><span>Total Listings</span><strong id="pm42Total">0</strong></div><div class="pm42-card"><span>Ready</span><strong id="pm42Ready">0</strong></div><div class="pm42-card"><span>Warnings</span><strong id="pm42Warnings">0</strong></div><div class="pm42-card"><span>Errors</span><strong id="pm42Errors">0</strong></div><div class="pm42-card"><span>Images</span><strong id="pm42Images">0</strong></div><div class="pm42-card"><span>Quality</span><strong id="pm42Quality">0%</strong></div></div>
 <div class="pm42-progress"><div id="pm42Progress"></div></div><div class="pm42-progress-text" id="pm42ProgressText">Ready to run publish check.</div>
 <div class="pm42-columns"><div class="pm42-box"><h3>Publish Checklist</h3><div id="pm42Checklist"></div></div><div class="pm42-box"><h3>Missing Data Report</h3><div id="pm42Missing" class="pm42-list"></div></div></div>
 <div class="pm42-columns"><div class="pm42-box"><h3>Changes Since Last Publish</h3><div id="pm42Changes" class="pm42-list"></div></div><div class="pm42-box"><h3>Export Statistics</h3><div id="pm42Stats" class="pm42-list"></div></div></div>
 <div class="pm42-actions"><button class="pm42-primary" id="pm42CheckBtn">Run Publish Check</button><button class="pm42-secondary" id="pm42ExportBtn">Build Publish ZIP</button><button class="pm42-ghost" id="pm42ReportBtn">View Last Summary</button><button class="pm42-ghost" id="pm42CopyBtn">Copy Summary</button></div><div class="pm42-history" id="pm42History"></div>`;
 host.parentNode.insertBefore(el,host);
 const modal=document.createElement('div');modal.id='pm42Modal';modal.className='pm42-modal';modal.innerHTML=`<div class="pm42-modal-card"><button class="pm42-close" id="pm42Close">Close</button><h2>Publish Summary</h2><div id="pm42ModalReport" class="pm42-report"></div></div>`;document.body.appendChild(modal);
 q('pm42CheckBtn').onclick=()=>refresh(true);q('pm42ExportBtn').onclick=()=>publishExport();q('pm42ReportBtn').onclick=openReport;q('pm42CopyBtn').onclick=copyReport;q('pm42Close').onclick=()=>q('pm42Modal').classList.remove('open');q('pm42Modal').onclick=e=>{if(e.target===q('pm42Modal'))q('pm42Modal').classList.remove('open')};
 refresh(false);
}
function checklistHtml(ok,inspection){
 const rows=[['Validation Passed',!inspection.hard.length],['No Duplicate IDs',!inspection.hard.some(x=>x.includes('Duplicate'))],['No Missing Price',!inspection.missingRows.some(x=>x.field==='price')],['No Invalid Room / Floor','info'],['Images Checked',!inspection.missingRows.some(x=>x.field==='images')],['properties.js Prepared',ok],['properties.json Prepared',ok],['CRM Data Prepared',typeof customers==='undefined'||Array.isArray(customers)],['Ready for GitHub',ok&&!inspection.hard.length]];
 return rows.map(([n,v])=>`<div class="pm42-check ${v===true?'pm42-ok':v==='info'?'pm42-warn':'pm42-bad'}"><b>${v===true?'✓':v==='info'?'●':'✕'}</b><span>${n}</span></div>`).join('');
}
function refresh(showMessage=false){
 const list=getProps(),inspection=inspect(list),changes=changesFor(list),history=safeJson(PM42_HISTORY_KEY,[]),readyCount=list.filter(p=>qualityFor(p)>=80).length;
 q('pm42Total').textContent=list.length;q('pm42Ready').textContent=readyCount;q('pm42Warnings').textContent=inspection.warnings.length;q('pm42Errors').textContent=inspection.hard.length;q('pm42Images').textContent=inspection.imageCount;q('pm42Quality').textContent=inspection.avgQuality+'%';
 const status=q('pm42Status');status.textContent=inspection.hard.length?'BLOCKED':inspection.warnings.length?'READY WITH WARNINGS':'READY FOR GITHUB';status.className='pm42-status '+(inspection.hard.length?'error':inspection.warnings.length?'warn':'ready');
 q('pm42Checklist').innerHTML=checklistHtml(!inspection.hard.length,inspection);
 q('pm42Missing').innerHTML=inspection.missingRows.length?inspection.missingRows.slice(0,100).map(x=>`<div class="pm42-row"><button type="button" style="border:0;background:none;color:#071a3d;font-weight:900;cursor:pointer" data-pm42-edit="${esc(x.id)}">${esc(x.id)}</button><span>${esc(x.message)}</span></div>`).join(''):'<div class="pm42-ok">✓ No missing data found</div>';
 q('pm42Missing').querySelectorAll('[data-pm42-edit]').forEach(b=>b.onclick=()=>{if(typeof editProp==='function')editProp(b.dataset.pm42Edit);window.scrollTo({top:document.querySelector('.grid')?.offsetTop||0,behavior:'smooth'})});
 const changeRows=[['New Listings',changes.added],['Updated Listings',changes.updated],['Deleted Listings',changes.deleted]];q('pm42Changes').innerHTML=changeRows.map(([n,a])=>`<div class="pm42-row"><b>${n}</b><span>${a.length} ${a.length?'· '+a.slice(0,10).join(', '):''}</span></div>`).join('');
 const avg=history.length?Math.round(history.reduce((s,x)=>s+(x.quality||0),0)/history.length):0;q('pm42Stats').innerHTML=`<div class="pm42-row"><b>Next Version</b><span>${currentVersionPreview()}</span></div><div class="pm42-row"><b>Exports Today</b><span>${statsToday(history)}</span></div><div class="pm42-row"><b>Total Exports</b><span>${history.length}</span></div><div class="pm42-row"><b>Average Quality</b><span>${avg}%</span></div>`;
 q('pm42History').textContent=history[0]?`Last export: ${history[0].version} · ${history[0].listings} listings · ${history[0].durationMs} ms`:'No publish history yet.';
 if(showMessage)q('pm42ProgressText').textContent=inspection.hard.length?`Publish blocked: ${inspection.hard.length} hard error(s).`:`Publish check completed: ${inspection.warnings.length} warning(s).`;
 return {inspection,changes};
}
function reportText(r){
 const lines=[`SIRILAND CMS PRO 2030 — PUBLISH SUMMARY`,`Version: ${r.version}`,`Date: ${r.date}`,`Status: ${r.status}`,`Duration: ${r.durationMs} ms`,`ZIP Size: ${bytes(r.zipSize)}`,'',`LISTINGS`,`Total: ${r.total}`,`New: ${r.changes.added.length}`,`Updated: ${r.changes.updated.length}`,`Deleted: ${r.changes.deleted.length}`,'',`QUALITY`,`Average: ${r.quality}%`,`Warnings: ${r.warnings.length}`,`Errors: ${r.errors.length}`,`Images: ${r.images}`,'',`GENERATED FILES`,...r.files.map(x=>'✓ '+x),'',`NEW LISTINGS`,...(r.changes.added.length?r.changes.added:['None']),'',`UPDATED LISTINGS`,...(r.changes.updated.length?r.changes.updated:['None']),'',`DELETED LISTINGS`,...(r.changes.deleted.length?r.changes.deleted:['None']),'',`MISSING DATA`,...(r.warnings.length?r.warnings:['None']),'',`READY FOR GITHUB: ${r.status==='READY'?'YES':'NO'}`];return lines.join('\n');
}
function openReport(){if(!pm42LastReport){alert('No export summary yet. Build Publish ZIP first.');return}q('pm42ModalReport').textContent=reportText(pm42LastReport);q('pm42Modal').classList.add('open')}
async function copyReport(){if(!pm42LastReport){alert('No export summary yet.');return}await navigator.clipboard.writeText(reportText(pm42LastReport));q('pm42ProgressText').textContent='Publish summary copied.'}
function setProgress(n,msg){q('pm42Progress').style.width=n+'%';q('pm42ProgressText').textContent=msg}
async function publishExport(){
 if(pm42Busy)return;pm42Busy=true;const start=performance.now();
 try{
  setProgress(5,'Saving current property…');
  if(typeof hasFormData==='function'&&hasFormData()&&typeof upsertCurrentForExport==='function')upsertCurrentForExport();else if(typeof hasFormData==='function'&&hasFormData()&&typeof upsertCurrent==='function')upsertCurrent(true);
  if(typeof cleanAllProperties==='function')cleanAllProperties();
  const {inspection,changes}=refresh(false);if(inspection.hard.length){setProgress(0,`Export blocked: ${inspection.hard.length} hard error(s).`);alert('EXPORT STOPPED\n\n'+inspection.hard.join('\n'));return}
  setProgress(22,'Preparing property data…');const list=getProps();const jsText=typeof makeJs==='function'?makeJs():'window.SIRILAND_PROPERTIES = '+JSON.stringify(list,null,2)+';\nconst properties = window.SIRILAND_PROPERTIES;\n';const jsonText=JSON.stringify(list,null,2);
  const version=versionNext();const zip=new JSZip();zip.file('properties.js',jsText);zip.file('properties.json',jsonText);zip.file('data/properties.json',jsonText);
  setProgress(38,'Preparing CRM and images…');if(typeof saveCustomers==='function')saveCustomers();if(typeof customers!=='undefined'&&Array.isArray(customers))zip.file('crm/customers.json',JSON.stringify(customers,null,2));
  if(typeof pendingFilesById!=='undefined')for(const [id,files] of Object.entries(pendingFilesById||{})){const p=list.find(x=>x.id===id);if(!p)continue;arr(files).forEach((f,i)=>{const path=arr(p.images)[i];if(path)zip.file(path,f)})}
  const files=['properties.js','properties.json','data/properties.json'];if(typeof customers!=='undefined'&&Array.isArray(customers))files.push('crm/customers.json');
  const draft={version,date:nowIso(),status:'READY',total:list.length,quality:inspection.avgQuality,warnings:inspection.warnings,errors:inspection.hard,images:inspection.imageCount,changes,files,durationMs:0,zipSize:0};
  zip.file('publish/export-summary.json',JSON.stringify(draft,null,2));zip.file('publish/missing-data-report.json',JSON.stringify(inspection.missingRows,null,2));zip.file('publish/changes.json',JSON.stringify({added:changes.added,updated:changes.updated,deleted:changes.deleted},null,2));
  zip.file('UPLOAD_INSTRUCTIONS.txt',`SIRILAND PUBLISH ${version}\n\n1) Extract this ZIP.\n2) Copy files into the GitHub project and replace existing files.\n3) Copy new image files into the existing images folder.\n4) Open GitHub Desktop.\n5) Review Files Changed.\n6) Commit and Push.\n\nStatus: READY FOR GITHUB\nWarnings: ${inspection.warnings.length}\nErrors: ${inspection.hard.length}`);
  setProgress(65,'Building ZIP archive…');const blob=await zip.generateAsync({type:'blob'},m=>setProgress(65+Math.round(m.percent*.3),`Building ZIP… ${Math.round(m.percent)}%`));
  draft.durationMs=Math.round(performance.now()-start);draft.zipSize=blob.size;pm42LastReport=draft;
  const history=safeJson(PM42_HISTORY_KEY,[]);history.unshift({version,at:draft.date,listings:draft.total,quality:draft.quality,warnings:draft.warnings.length,errors:draft.errors.length,durationMs:draft.durationMs,zipSize:draft.zipSize});saveJson(PM42_HISTORY_KEY,history.slice(0,100));saveJson(PM42_SNAPSHOT_KEY,changes.current);
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`siriland-publish-${version}.zip`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000);
  setProgress(100,`READY FOR GITHUB · ${version} · ${bytes(blob.size)} · ${draft.durationMs} ms`);refresh(false);openReport();
 }catch(err){console.error(err);setProgress(0,'Export failed: '+err.message);alert('EXPORT ERROR\n\n'+err.message)}finally{pm42Busy=false}
}
function hookOriginalButton(){const b=q('downloadZip');if(!b||b.dataset.pm42)return;b.dataset.pm42='1';b.textContent='Publish ZIP oluştur';b.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();publishExport()};}
function boot(){injectUI();hookOriginalButton();setInterval(()=>{if(q('pm42Panel'))refresh(false)},5000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.SIRILAND_PUBLISH_MANAGER={refresh,publishExport,version:PM42_VERSION};
})();
