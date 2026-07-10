(function(){
  window.SIRILAND_MODULES=window.SIRILAND_MODULES||{};
  window.SIRILAND_MODULES.crm={name:'CRM',version:'1.0.0'};
  window.addEventListener('load',()=>{ try{ if(typeof loadCustomers==='function') loadCustomers(); if(typeof renderCRM==='function') renderCRM(); }catch(e){console.error('CRM module:',e);} });
})();
