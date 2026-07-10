(function(){
  window.SIRILAND_MODULES=window.SIRILAND_MODULES||{};
  window.SIRILAND_MODULES.validator={name:'Validator',version:'1.1.0'};
  window.SIRILAND_VALIDATE_NOW=function(){ return typeof validate==='function' ? validate() : false; };
})();


// Build 2026.07.10.09: structured Floor / Room validation helpers.
window.SIRILAND_VALIDATE_STRUCTURED = function(property){
  const errors=[];
  const invalid=(v,kind)=>{
    const raw=String(v||'').trim();
    if(!raw) return false;
    const low=raw.toLowerCase();
    if(/please|update|undefined|null|pending|details|pdate|katate|upd/i.test(low)) return true;
    if(kind==='floor') return !(/(?:^|\s)(?:basement|ground|mezzanine|penthouse|ชั้น|kat|floor|\d+(?:st|nd|rd|th)?)(?:\s|$)/i.test(raw));
    if(kind==='room') return !(/(?:unit|room|ห้อง|oda|房|studio|\b[a-z]?\d+[a-z-]*\b)/i.test(raw));
    return false;
  };
  if(invalid(property?.floor,'floor')) errors.push('Invalid Floor: '+property.floor);
  if(invalid(property?.room,'room')) errors.push('Invalid Room: '+property.room);
  return errors;
};
