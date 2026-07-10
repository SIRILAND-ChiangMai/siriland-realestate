(function(){
  window.SIRILAND_MODULES=window.SIRILAND_MODULES||{};
  window.SIRILAND_MODULES.export={name:'Export',version:'1.0.0'};
  window.SIRILAND_EXPORT_DIAGNOSTIC=function(){
    return {properties:Array.isArray(window.properties)?window.properties.length:null,jszip:typeof JSZip!=='undefined',buildZip:typeof buildZip==='function'};
  };
})();
