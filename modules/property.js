(function(){
  window.SIRILAND_MODULES=window.SIRILAND_MODULES||{};
  window.SIRILAND_MODULES.property={name:'Property',version:'1.0.0'};
  document.addEventListener('change',e=>{ if(e.target&&e.target.id==='type'&&typeof updatePropertyTypeFields==='function') updatePropertyTypeFields(); });
})();
