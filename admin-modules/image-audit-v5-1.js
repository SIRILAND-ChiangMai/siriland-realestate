
/* SIRILAND CMS v5.1 — Image Audit */
(function(){
  const css=`
  .imageAuditV51Panel{border:2px solid #d6ad4b;background:linear-gradient(145deg,#fff,#fffaf0);margin:12px 0 14px;padding:14px;border-radius:16px}
  .imageAuditHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
  .imageAuditHead h2{margin:0 0 4px;color:#071a3d}.imageAuditHead p{margin:0;color:#64748b}
  .imageAuditStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}
  .imageAuditStats>div{border:1px solid #ead9a8;background:#fff;border-radius:12px;padding:10px;text-align:center}
  .imageAuditStats span{display:block;color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase}
  .imageAuditStats strong{display:block;margin-top:4px;color:#071a3d;font-size:16px}
  .imageAuditStats strong[data-state="ok"]{color:#0f7b3f}.imageAuditStats strong[data-state="error"]{color:#b91c1c}
  .imageAuditResults{display:grid;gap:7px}.auditRow{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:center;border:1px solid #e2e8f0;background:#fff;border-radius:11px;padding:9px 10px}
  .auditRow div{min-width:0}.auditRow b{display:block;color:#071a3d}.auditRow span{display:block;color:#475569;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .auditRow em{color:#b91c1c;font-style:normal;font-weight:900;font-size:11px}.auditRow button{border:0;background:#071a3d;color:#fff;border-radius:9px;padding:7px 10px;font-weight:900;cursor:pointer}
  .auditOk{padding:12px;background:#dcfce7;color:#166534;border-radius:10px;font-weight:900}
  @media(max-width:700px){.imageAuditStats{grid-template-columns:1fr 1fr}.auditRow{grid-template-columns:1fr auto}.auditRow em{grid-column:1}}
  `;
  const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);

  function getList(){
    try{ if(Array.isArray(window.properties)) return window.properties; }catch(e){}
    try{ if(typeof properties!=='undefined' && Array.isArray(properties)) return properties; }catch(e){}
    return window.SIRILAND_PROPERTIES || window.PROPERTIES || [];
  }

  function audit(){
    const list=getList();
    const missing=list.filter(p=>!Array.isArray(p.images)||p.images.length===0);
    const duplicateIds=[]; const seen=new Set();
    list.forEach(p=>{const id=String(p?.id||'').trim();if(seen.has(id))duplicateIds.push(id);seen.add(id)});
    return {total:list.length,missing,duplicateIds,valid:list.length>0&&duplicateIds.length===0};
  }

  function ensurePanel(){
    if(document.getElementById('imageAuditV51Panel'))return;
    const host=document.querySelector('.wrap')||document.body;
    const panel=document.createElement('section');
    panel.id='imageAuditV51Panel';panel.className='imageAuditV51Panel';
    panel.innerHTML=`
      <div class="imageAuditHead"><div><h2>🖼️ Image Audit v5.1</h2><p>Fotoğrafı olmayan ilanları ve veri güvenliğini kontrol eder.</p></div>
      <button type="button" class="btn dark" id="runImageAuditV51">Tekrar Kontrol Et</button></div>
      <div class="imageAuditStats">
        <div><span>Toplam İlan</span><strong id="auditTotal">0</strong></div>
        <div><span>Fotoğrafsız</span><strong id="auditMissing">0</strong></div>
        <div><span>Duplicate ID</span><strong id="auditDuplicate">0</strong></div>
        <div><span>Durum</span><strong id="auditStatus">Bekliyor</strong></div>
      </div><div id="imageAuditResults" class="imageAuditResults"></div>`;
    host.insertBefore(panel,host.firstChild);
  }

  function render(){
    ensurePanel();const r=audit();
    document.getElementById('auditTotal').textContent=r.total;
    document.getElementById('auditMissing').textContent=r.missing.length;
    document.getElementById('auditDuplicate').textContent=r.duplicateIds.length;
    const status=document.getElementById('auditStatus');status.textContent=r.valid?'GÜVENLİ':'HATA';status.dataset.state=r.valid?'ok':'error';
    const box=document.getElementById('imageAuditResults');
    box.innerHTML=r.missing.map(p=>`<div class="auditRow"><div><b>${p.id}</b><span>${typeof p.title==='string'?p.title:(p.title?.tr||p.title?.en||p.title?.th||'Başlık yok')}</span></div><em>0 fotoğraf</em><button type="button" data-audit-edit="${p.id}">Düzenle</button></div>`).join('')||'<div class="auditOk">Tüm ilanlarda en az bir fotoğraf var.</div>';
  }

  document.addEventListener('click',e=>{
    if(e.target.id==='runImageAuditV51')render();
    const btn=e.target.closest('[data-audit-edit]');
    if(btn){const p=getList().find(x=>String(x.id)===btn.dataset.auditEdit);if(p&&typeof setForm==='function'){setForm(p);compactShowWorkspace?.('property');compactJumpPanel?.('mediaManagerPanel')}}
  });
  window.addEventListener('DOMContentLoaded',()=>setTimeout(render,700));
  window.SIRILAND_IMAGE_AUDIT_V51={run:audit,render};
})();
