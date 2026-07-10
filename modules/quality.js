(function(){
  window.SIRILAND_MODULES=window.SIRILAND_MODULES||{};
  window.SIRILAND_MODULES.quality={name:'Quality Score',version:'1.0.1',fix:'type-before-initialization'};
  window.addEventListener('error',e=>{ if(String(e.message||'').includes("Cannot access 'type' before initialization")) console.error('Old quality.js bug detected. Clear browser cache and reload admin.html.'); });
})();
