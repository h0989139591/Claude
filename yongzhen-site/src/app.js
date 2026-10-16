(function(){
  var ua=navigator.userAgent,mobile=/Android|iPhone|iPad|iPod/i.test(ua);
  var dlg=document.getElementById('lineDlg');
  document.querySelectorAll('[data-line]').forEach(function(a){
    a.addEventListener('click',function(e){
      if(!mobile&&dlg&&dlg.showModal){e.preventDefault();dlg.showModal()}
    });
  });
  if(dlg)dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close()});
  document.addEventListener('focusin',function(e){
    if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))document.body.classList.add('typing')});
  document.addEventListener('focusout',function(){document.body.classList.remove('typing')});
})();
