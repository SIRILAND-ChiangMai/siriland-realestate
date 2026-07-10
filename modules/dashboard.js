(function(){
  window.SIRILAND_MODULES=window.SIRILAND_MODULES||{};
  window.SIRILAND_MODULES.dashboard={name:'Dashboard',version:'1.0.0'};
  window.addEventListener('load',()=>{ try{ if(typeof renderDashboard==='function') renderDashboard(); }catch(e){console.error('Dashboard module:',e);} });
})();
