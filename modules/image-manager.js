(function(){
  window.SIRILAND_MODULES=window.SIRILAND_MODULES||{};
  window.SIRILAND_MODULES.imageManager={name:'Image Manager',version:'1.0.0'};
  window.addEventListener('beforeunload',()=>{ document.querySelectorAll('#imagePreview img').forEach(img=>{ if(img.src&&img.src.startsWith('blob:')) URL.revokeObjectURL(img.src); }); });
})();
