(function(){
  var ua=navigator.userAgent,mobile=/Android|iPhone|iPad|iPod/i.test(ua);
  var dlg=document.getElementById('lineDlg');
  document.querySelectorAll('[data-line]').forEach(function(a){
    a.addEventListener('click',function(e){if(!mobile&&dlg&&dlg.showModal){e.preventDefault();dlg.showModal()}});
  });
  if(dlg)dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close()});
  document.addEventListener('focusin',function(e){if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))document.body.classList.add('typing')});
  document.addEventListener('focusout',function(){document.body.classList.remove('typing')});

  // 示範模式：讀取後台存在這台瀏覽器的內容（正式版改由 Google 試算表提供）
  var C={};try{C=JSON.parse(localStorage.getItem('yz_content')||'{}')}catch(e){}
  var tel=function(v){return 'tel:'+String(v).replace(/[^\d+]/g,'')};
  document.querySelectorAll('[data-k]').forEach(function(el){
    var key=el.getAttribute('data-k'),v=C[key];
    if(key==='phoneBtn'||key==='floatPhone'){if(C.phone){el.href=tel(C.phone);if(key==='phoneBtn')el.textContent='電話 '+C.phone}return}
    if(v==null||v==='')return;
    if(el.hasAttribute('data-list')){el.innerHTML='';String(v).split('\n').filter(Boolean).forEach(function(t){var li=document.createElement('li');li.textContent=t;el.appendChild(li)});return}
    if(el.hasAttribute('data-faq')){el.innerHTML='';v.forEach(function(f){var d=document.createElement('details'),s=document.createElement('summary'),p=document.createElement('p');s.textContent=f[0];p.textContent=f[1];d.append(s,p);el.appendChild(d)});return}
    el.textContent=v;if(key==='phone')el.href=tel(v);
  });
  document.querySelectorAll('[data-photo]').forEach(function(el){
    var u=C['photo.'+el.getAttribute('data-photo')];if(u){el.style.backgroundImage='url('+u+')';el.textContent=''}});
  if(C['seo.title']&&location.pathname==='/')document.title=C['seo.title'];
  if(C['seo.desc']&&location.pathname==='/'){var m=document.querySelector('meta[name=description]');if(m)m.content=C['seo.desc']}

  var f=document.getElementById('leadForm');
  if(f)f.addEventListener('submit',function(e){e.preventDefault();
    var d=Object.fromEntries(new FormData(f));d.at=new Date().toISOString();d.status='新諮詢';
    var L=[];try{L=JSON.parse(localStorage.getItem('yz_leads')||'[]')}catch(x){}
    L.unshift(d);try{localStorage.setItem('yz_leads',JSON.stringify(L))}catch(x){}
    f.reset();f.querySelector('.ok').hidden=false});
  var chips=document.querySelectorAll('.chip');
  chips.forEach(function(c){c.addEventListener('click',function(){
    chips.forEach(function(x){x.classList.toggle('on',x===c)});
    var cat=c.getAttribute('data-cat');
    document.querySelectorAll('#artList .card').forEach(function(a){a.hidden=!!cat&&a.getAttribute('data-cat')!==cat})})});
})();
