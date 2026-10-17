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
    if(el.hasAttribute('data-faq')){el.innerHTML='';v.forEach(function(f){var d=document.createElement('details'),s=document.createElement('summary'),p=document.createElement('p');s.textContent=f[0];p.textContent=f[1];d.append(s,p);el.appendChild(d)});return}
    el.textContent=v;if(key==='phone')el.href=tel(v);
  });
  document.querySelectorAll('[data-photo]').forEach(function(el){
    var u=C['photo.'+el.getAttribute('data-photo')];if(!u)return;
    if(el.tagName==='IMG'){el.src=u;el.removeAttribute('srcset')}else{el.style.backgroundImage='url('+u+')'}});
  if(C['seo.title']&&location.pathname==='/')document.title=C['seo.title'];
  if(C['seo.desc']&&location.pathname==='/'){var m=document.querySelector('meta[name=description]');if(m)m.content=C['seo.desc']}

  // 最新公告（後台新增 → yz_news）：加在最新消息最上方
  var N=null;try{N=JSON.parse(localStorage.getItem('yz_news')||'null')}catch(e){}
  if(N&&N.length){
    document.querySelectorAll('[data-news]').forEach(function(el){
      var mode=el.getAttribute('data-news'),items=mode==='all'?N:N.slice(0,+mode||3);
      items.slice().reverse().forEach(function(n){
        if(mode==='all'){var a=document.createElement('article');a.className='news-item';
          var t=document.createElement('time');t.textContent=n.date;var h=document.createElement('h2');h.textContent=n.title;a.append(t,h);
          if(n.body){var p=document.createElement('p');p.textContent=n.body;a.appendChild(p)}el.insertBefore(a,el.firstChild)}
        else{var li=document.createElement('li'),sp=document.createElement('span');sp.textContent=n.title;var sm=document.createElement('small');sm.textContent=' '+n.date;li.append(sp,sm);el.insertBefore(li,el.firstChild);while(el.children.length>(+mode||3))el.removeChild(el.lastChild)}
      });
    });
  }

  // 開課資訊（後台編輯 → yz_sched）：重畫開課頁、首頁與右側欄
  var G=null;try{G=JSON.parse(localStorage.getItem('yz_sched')||'null')}catch(e){}
  if(G){
    var esc=function(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
    var badge=function(iso){var p=iso.split('-');return '<span class="dbadge"><b>'+(+p[2])+'</b><small>'+(+p[1])+' 月</small></span>'};
    var flat=[];G.forEach(function(g){g.items.forEach(function(it){var o=JSON.parse(JSON.stringify(it));o.group=g.name;flat.push(o)})});
    flat=flat.filter(function(x){return x.status!=='已結束'}).sort(function(a,b){return a.iso<b.iso?-1:1});
    var pill=function(st){return '<span class="pill'+(st==='招生中'?' on':'')+'">'+esc(st)+'</span>'};
    var sg=document.getElementById('schedGroups');
    if(sg)sg.innerHTML=G.map(function(g){return '<section class="sgroup"><header><h2>'+esc(g.name)+'</h2>'+(g.note?'<p>'+esc(g.note)+'</p>':'')+'</header><ul class="sessions">'+g.items.filter(function(it){return it.status!=='已結束'}).map(function(s){return '<li data-iso="'+esc(s.iso)+'">'+badge(s.iso)+'<div><b>'+esc(s.kind)+'</b><small>'+esc(s.no)+'・'+esc(s.date)+'</small><div class="meta">'+pill(s.status)+'<span>'+esc(s.mode)+'</span>'+(s.size?'<span>'+esc(s.size)+'</span>':'')+'</div></div>'+(s.href?'<a class="btn ghost sm" href="'+esc(s.href)+'">詳情</a>':'<a class="btn ghost sm" href="'+esc(window.LINE_URL||'#')+'" data-line>洽詢</a>')+'</li>'}).join('')+'</ul></section>'}).join('');
    var hs=document.getElementById('homeSessions');
    if(hs)hs.innerHTML=flat.slice(0,4).map(function(s){return '<li data-iso="'+esc(s.iso)+'">'+badge(s.iso)+'<div><b>'+esc(s.kind)+'</b><small>'+esc(s.group)+'</small><div class="meta">'+pill(s.status)+'<span>'+esc(s.mode)+'</span>'+(s.size?'<span>'+esc(s.size)+'</span>':'')+'</div></div><a class="btn ghost sm" href="'+esc(s.href||'/schedule/')+'">詳情</a></li>'}).join('');
    document.querySelectorAll('[data-soon]').forEach(function(ul){ul.innerHTML=flat.slice(0,+ul.getAttribute('data-soon')).map(function(s){return '<li data-iso="'+esc(s.iso)+'">'+badge(s.iso)+'<span class="stx"><a href="'+esc(s.href||'/schedule/')+'">'+esc(s.kind)+'</a><small>'+esc(s.date)+'・'+esc(s.status)+'</small></span></li>'}).join('')});
  }

  // 開課清單：隱藏已過期場次（右側欄只留最近 4 場）
  var now=new Date().toISOString().slice(0,10);
  document.querySelectorAll('[data-iso]').forEach(function(li){if(li.getAttribute('data-iso')<now)li.hidden=true});
  document.querySelectorAll('[data-soon]').forEach(function(ul){[].slice.call(ul.querySelectorAll('li:not([hidden])')).slice(+ul.getAttribute('data-soon')).forEach(function(li){li.hidden=true})});

  // 首頁輪播
  var car=document.querySelector('.carousel');
  if(car){
    var slides=[].slice.call(car.querySelectorAll('.slide')),dots=car.querySelector('.dots'),i=0,timer=null;
    slides.forEach(function(_,k){var b=document.createElement('button');b.setAttribute('aria-label','第 '+(k+1)+' 張');b.onclick=function(){go(k,true)};dots.appendChild(b)});
    function go(n,user){
      i=(n+slides.length)%slides.length;
      slides.forEach(function(s,k){var on=k===i;s.classList.toggle('on',on);s.setAttribute('aria-hidden',on?'false':'true');
        s.querySelectorAll('a').forEach(function(a){if(on)a.removeAttribute('tabindex');else a.setAttribute('tabindex','-1')})});
      [].forEach.call(dots.children,function(d,k){d.classList.toggle('on',k===i)});
      if(user)restart();
    }
    function restart(){clearInterval(timer);if(!matchMedia('(prefers-reduced-motion:reduce)').matches)timer=setInterval(function(){go(i+1)},6000)}
    car.querySelector('.cp').onclick=function(){go(i-1,true)};car.querySelector('.cn').onclick=function(){go(i+1,true)};
    car.addEventListener('mouseenter',function(){clearInterval(timer)});car.addEventListener('mouseleave',restart);
    car.addEventListener('focusin',function(){clearInterval(timer)});
    go(0);restart();
  }

  // 圖片放大檢視（有照片的 .ph 才可點）
  var lb=document.getElementById('lb'),zs=[].slice.call(document.querySelectorAll('img.zoomable')),zi=0;
  function show(n){zi=(n+zs.length)%zs.length;var im=lb.querySelector('img');im.src=zs[zi].currentSrc||zs[zi].src;im.alt=zs[zi].alt||''}
  if(lb&&zs.length){
    zs.forEach(function(e,k){e.tabIndex=0;e.setAttribute('role','button');e.setAttribute('aria-label','放大檢視');
      var open=function(){show(k);lb.showModal()};e.addEventListener('click',open);e.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();open()}})});
    lb.querySelector('.lbx').onclick=function(){lb.close()};lb.querySelector('.lbp').onclick=function(){show(zi-1)};lb.querySelector('.lbn').onclick=function(){show(zi+1)};
    lb.addEventListener('click',function(e){if(e.target===lb)lb.close()});
    lb.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')show(zi-1);if(e.key==='ArrowRight')show(zi+1)});
  }

  var f=document.getElementById('leadForm');
  if(f)f.addEventListener('submit',function(e){e.preventDefault();
    var d=Object.fromEntries(new FormData(f));d.at=new Date().toISOString();d.status='新諮詢';
    var L=[];try{L=JSON.parse(localStorage.getItem('yz_leads')||'[]')}catch(x){}
    L.unshift(d);try{localStorage.setItem('yz_leads',JSON.stringify(L))}catch(x){}
    f.reset();f.querySelector('.ok').hidden=false});
  var cf=document.getElementById('contactForm');
  if(cf)cf.addEventListener('submit',function(e){e.preventDefault();
    var d=Object.fromEntries(new FormData(cf));d.course='聯絡我們表單';d.at=new Date().toISOString();d.status='新諮詢';
    var L=[];try{L=JSON.parse(localStorage.getItem('yz_leads')||'[]')}catch(x){}
    L.unshift(d);try{localStorage.setItem('yz_leads',JSON.stringify(L))}catch(x){}
    cf.reset();cf.querySelector('.ok').hidden=false});
  var chips=document.querySelectorAll('.chip');
  chips.forEach(function(c){c.addEventListener('click',function(){
    chips.forEach(function(x){x.classList.toggle('on',x===c)});
    var cat=c.getAttribute('data-cat');
    document.querySelectorAll('#artList .card').forEach(function(a){a.hidden=!!cat&&a.getAttribute('data-cat')!==cat})})});
})();
