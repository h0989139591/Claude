(function(){
'use strict';
var S=window.SITE,YZ=window.YZ,app=document.getElementById('app');
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
var get=YZ.get;
function set(k,v){if(!YZ.set(k,v))toast('瀏覽器空間不足或被封鎖')}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function toast(t){var d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},1800)}
var ST=YZ.admin(S.courses),pad=YZ.pad,dirty=false,selDay=null,calBase=new Date(),selCourse=0;
var C=function(){return get('yz_content',{})};
var sched=function(){return get('yz_sched',null)||S.schedule.groups};

var NAV=[
 ['工作',[['overview','總覽'],['leads','諮詢單'],['bookings','說明會報名'],['calendar','課程月曆']]],
 ['官網內容',[['c-home','首頁文字'],['c-courses','證照班資訊'],['c-schedule','開課資訊'],['c-news','最新公告'],['c-faq','常見問題'],['c-photos','網站照片'],['c-seo','搜尋與分享']]],
 ['設定',[['s-contact','聯絡資料'],['s-account','帳號與密碼']]]
];
function newLeads(){return get('yz_leads',[]).filter(function(l){return l.status==='新諮詢'}).length}

function login(){
  app.innerHTML='<form class="login" id="lf"><h1>後台登入</h1><label>密碼<input type="password" id="pw" autocomplete="current-password" autofocus></label><button class="btn">登入</button><small id="err" style="color:var(--bad)"></small></form>';
  $('#lf').onsubmit=function(e){e.preventDefault();if($('#pw').value===ST.pw){sessionStorage.setItem('yz_in','1');render()}else $('#err').textContent='密碼不正確'};
}
function route(){return (location.hash||'#overview').slice(1)}
function go(r){if(dirty&&!confirm('有尚未儲存的修改，確定要離開嗎？'))return;dirty=false;location.hash='#'+r}
window.addEventListener('hashchange',function(){if(sessionStorage.getItem('yz_in')==='1'){dirty=false;render()}});

function render(){
  if(sessionStorage.getItem('yz_in')!=='1'){login();return}
  var r=route(),pg=(PAGES[r]||PAGES.overview)();
  var nav=NAV.map(function(g){return '<div class="grp">'+g[0]+'</div>'+g[1].map(function(n){var badge=n[0]==='leads'&&newLeads()?'<span class="cnt">'+newLeads()+'</span>':'';return '<a class="nv'+(n[0]===r?' on':'')+'" href="#'+n[0]+'">'+n[1]+badge+'</a>'}).join('')}).join('');
  app.innerHTML='<div class="shell"><aside class="side"><p class="who">'+esc(S.brand)+'</p><p class="sub">後台管理</p><nav>'+nav+'</nav><div class="foot"><a class="btn ghost sm" href="/" target="_blank" rel="noopener">看官網</a><button class="btn ghost sm" id="out">登出</button></div></aside><main><div class="pg"><h1>'+pg.title+'</h1><p class="lead">'+(pg.lead||'')+'</p>'+pg.body+'</div></main>'+(pg.save?'<div class="savebar"><span class="st" id="sbst">沒有修改</span><button class="btn ghost" id="rv">還原</button><button class="btn" id="sv">儲存</button></div>':'')+'</div>';
  $('#out').onclick=function(){sessionStorage.removeItem('yz_in');render()};
  dirty=false;
  if(pg.bind)pg.bind($('main'));
  if(pg.save){
    var st=$('#sbst');
    $('main').addEventListener('input',function(){dirty=true;st.className='st dirty';st.textContent='有尚未儲存的修改'});
    $('main').addEventListener('change',function(){dirty=true;st.className='st dirty';st.textContent='有尚未儲存的修改'});
    $('#rv').onclick=function(){dirty=false;render()};
    $('#sv').onclick=function(){pg.save($('main'));dirty=false;st.className='st ok';st.textContent='已儲存 '+new Date().toTimeString().slice(0,5);toast('已儲存')};
  }
}
function field(id,label,val,opt){opt=opt||{};var v=esc(val);return '<label>'+label+(opt.rows?'<textarea id="'+id+'" rows="'+opt.rows+'">'+v+'</textarea>':'<input id="'+id+'" value="'+v+'"'+(opt.type?' type="'+opt.type+'"':'')+'>')+(opt.hint?'<small>'+opt.hint+'</small>':'')+'</label>'}
function val(id){var e=document.getElementById(id);return e?e.value.trim():''}
function putContent(map){var c=C();Object.keys(map).forEach(function(k){if(map[k])c[k]=map[k];else delete c[k]});set('yz_content',c)}

var PAGES={
 overview:function(){
  var L=get('yz_leads',[]),B=get('yz_bookings',[]),cm=YZ.ym(new Date());
  var nl=L.filter(function(l){return l.status==='新諮詢'});
  var flat=[];sched().forEach(function(g){g.items.forEach(function(it){if(it.status!=='已結束')flat.push(it)})});
  var today=new Date().toISOString().slice(0,10);flat=flat.filter(function(x){return x.iso>=today}).sort(function(a,b){return a.iso<b.iso?-1:1});
  var monthSessions=ST.sessions.filter(function(s){return s.date.indexOf(cm)===0}).length;
  var body='<div class="stats"><a class="stat warn" href="#leads"><b>'+nl.length+'</b><span>待回覆諮詢</span></a><a class="stat" href="#bookings"><b>'+B.length+'</b><span>說明會報名</span></a><a class="stat" href="#calendar"><b>'+monthSessions+'</b><span>本月場次</span></a><a class="stat" href="#c-schedule"><b>'+(flat[0]?flat[0].date.split('（')[0]:'—')+'</b><span>下一場開課'+(flat[0]?'：'+esc(flat[0].kind):'')+'</span></a></div>'
   +'<div class="card"><h2>待處理的諮詢</h2><p class="hint">來自官網表單，處理完請標記為已回覆。</p>'+(nl.length?'<table class="tbl"><tr><th>時間</th><th>姓名</th><th>電話</th><th>想了解</th><th></th></tr>'+nl.slice(0,5).map(function(l){return '<tr><td class="nw">'+esc(l.at.slice(5,16).replace("T"," "))+'</td><td>'+esc(l.name)+'</td><td class="nw"><a href="tel:'+esc(l.phone)+'">'+esc(l.phone)+'</a></td><td>'+esc(l.course)+'</td><td class="nw"><button class="btn sm" data-done="'+esc(l.at)+'">標記已回覆</button></td></tr>'}).join('')+'</table>':'<p class="empty">目前沒有待處理的諮詢。</p>')+'</div>'
   +'<div class="card"><h2>最新的說明會報名</h2>'+(B.length?'<table class="tbl"><tr><th>場次</th><th>姓名</th><th>電話</th></tr>'+B.slice(0,5).map(function(b){return '<tr><td>'+esc(b.session)+'</td><td>'+esc(b.name)+'</td><td class="nw">'+esc(b.phone)+'</td></tr>'}).join('')+'</table>':'<p class="empty">還沒有人報名。</p>')+'</div>'
   +'<div class="card"><h2>即將開課</h2><p class="hint">要修改日期或狀態，到「官網內容 → 開課資訊」。</p>'+(flat.length?'<table class="tbl"><tr><th>日期</th><th>班別</th><th>狀態</th></tr>'+flat.slice(0,5).map(function(x){return '<tr><td class="nw">'+esc(x.date)+'</td><td>'+esc(x.kind)+'</td><td><span class="tag">'+esc(x.status)+'</span></td></tr>'}).join('')+'</table>':'<p class="empty">沒有即將開課的場次。</p>')+'</div>';
  return {title:'總覽',lead:'今天需要處理的事。',body:body,bind:function(el){$$('[data-done]',el).forEach(function(b){b.onclick=function(){var l=get('yz_leads',[]);l.forEach(function(x){if(x.at===b.dataset.done)x.status='已回覆'});set('yz_leads',l);render()}})}};
 },
 leads:function(){
  var L=get('yz_leads',[]);
  var body='<div class="card">'+(L.length?'<table class="tbl"><tr><th>時間</th><th>姓名</th><th>電話</th><th>想了解</th><th>留言</th><th>狀態</th><th></th></tr>'+L.map(function(l,i){return '<tr><td class="nw">'+esc(l.at.slice(0,16).replace('T',' '))+'</td><td>'+esc(l.name)+'</td><td class="nw"><a href="tel:'+esc(l.phone)+'">'+esc(l.phone)+'</a></td><td>'+esc(l.course)+'</td><td>'+esc(l.msg||l.note||'')+'</td><td class="nw"><button class="btn sm ghost" data-t="'+i+'">'+(l.status==='新諮詢'?'<span class="tag new">新諮詢</span>':'<span class="tag done">已回覆</span>')+'</button></td><td><button class="btn sm danger" data-d="'+i+'">刪除</button></td></tr>'}).join('')+'</table>':'<p class="empty">還沒有諮詢。到官網首頁或聯絡我們頁填一張表單試試。</p>')+'</div>';
  return {title:'諮詢單',lead:'官網「預約諮詢」與「聯絡我們」表單送出的資料。點狀態可切換。',body:body,bind:function(el){
   $$('[data-t]',el).forEach(function(b){b.onclick=function(){var l=get('yz_leads',[]),x=l[b.dataset.t];x.status=x.status==='新諮詢'?'已回覆':'新諮詢';set('yz_leads',l);render()}});
   $$('[data-d]',el).forEach(function(b){b.onclick=function(){if(!confirm('刪除這筆諮詢？'))return;var l=get('yz_leads',[]);l.splice(+b.dataset.d,1);set('yz_leads',l);render()}})}};
 },
 bookings:function(){
  var B=get('yz_bookings',[]);
  var body='<div class="card">'+(B.length?'<table class="tbl"><tr><th>場次</th><th>姓名</th><th>電話</th><th>備註</th><th>預約時間</th><th></th></tr>'+B.map(function(b,i){return '<tr><td>'+esc(b.session)+'</td><td>'+esc(b.name)+'</td><td class="nw">'+esc(b.phone)+'</td><td>'+esc(b.note)+'</td><td class="nw">'+esc(b.at.slice(0,16).replace('T',' '))+'</td><td><button class="btn sm danger" data-c="'+i+'">取消預約</button></td></tr>'}).join('')+'</table>':'<p class="empty">還沒有人預約說明會。</p>')+'</div>';
  return {title:'說明會報名',lead:'官網「預約說明會」的報名名單。取消會把名額還回去。',body:body,bind:function(el){$$('[data-c]',el).forEach(function(b){b.onclick=function(){if(!confirm('取消這筆預約？'))return;var B=get('yz_bookings',[]),x=B.splice(+b.dataset.c,1)[0];set('yz_bookings',B);var st=get('yz_admin',ST);st.sessions.forEach(function(s){if(s.id===x.sid&&s.enrolled>0)s.enrolled--});ST=st;set('yz_admin',ST);toast('已取消預約');render()}})}};
 },
 calendar:function(){
  var y=calBase.getFullYear(),m=calBase.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),h='';
  WEEK.forEach(function(d){h+='<div class="h">'+d+'</div>'});
  for(var i=0;i<first;i++)h+='<div class="day empty"></div>';
  for(var d=1;d<=days;d++){var key=y+'-'+pad(m+1)+'-'+pad(d),ss=ST.sessions.filter(function(s){return s.date===key});h+='<button class="day'+(selDay===key?' on':'')+'" data-d="'+key+'"><b>'+d+'</b>'+ss.map(function(s){return '<i>'+s.time+' '+esc(s.course)+'</i>'}).join('')+'</button>'}
  var day=selDay?ST.sessions.filter(function(s){return s.date===selDay}):[];
  var body='<div class="card"><div class="row" style="margin-bottom:12px"><button class="btn ghost sm" id="pv">‹ 上個月</button><b style="font-size:18px">'+y+' 年 '+(m+1)+' 月</b><button class="btn ghost sm" id="nx">下個月 ›</button></div><div class="cal">'+h+'</div></div>'
   +'<div class="card"><h2>'+(selDay||'點選上方日期')+'</h2><p class="hint">查看、刪除或新增這一天的場次（說明會／試聽）。</p>'+day.map(function(s){return '<div class="row item"><b>'+s.time+'</b><span>'+esc(s.course)+'</span><span class="tag">'+s.enrolled+' / '+s.seats+' 人</span><button class="btn sm danger" data-del="'+s.id+'" style="margin-left:auto">刪除</button></div>'}).join('')
   +(selDay?'<form id="af" class="item"><div class="grid4"><label>班別<select name="course">'+S.courses.map(function(c){return '<option>'+esc(c.name)+'</option>'}).join('')+'</select></label><label>時間<input name="time" type="time" value="10:00"></label><label>名額<input name="seats" type="number" min="1" value="12"></label><label>&nbsp;<button class="btn">新增場次</button></label></div></form>':'')+'</div>';
  return {title:'課程月曆',lead:'說明會與試聽場次。官網「預約說明會」會顯示這裡的場次與剩餘名額。',body:body,bind:function(el){
   $('#pv').onclick=function(){calBase=new Date(y,m-1,1);render()};$('#nx').onclick=function(){calBase=new Date(y,m+1,1);render()};
   $$('.day[data-d]',el).forEach(function(b){b.onclick=function(){selDay=b.dataset.d;render()}});
   $$('[data-del]',el).forEach(function(b){b.onclick=function(){ST.sessions=ST.sessions.filter(function(s){return s.id!==b.dataset.del});set('yz_admin',ST);render()}});
   var af=$('#af');if(af)af.onsubmit=function(e){e.preventDefault();var f=new FormData(af);ST.sessions.push({id:'n'+Date.now(),date:selDay,time:f.get('time'),course:f.get('course'),seats:+f.get('seats')||12,enrolled:0});set('yz_admin',ST);toast('已新增');render()}}};
 },
 'c-home':function(){
  var c=C();
  return {title:'首頁文字',lead:'首頁輪播第一張的主標與副標。改完按下方「儲存」，到官網重新整理就會看到。',body:'<div class="card">'+field('f1','主標題',c.heroTitle||S.heroTitle,{hint:'建議 20 字內'})+field('f2','副標題',c.heroSub||S.heroSub,{rows:3,hint:'一到兩句話'})+'</div>',save:function(){putContent({heroTitle:val('f1'),heroSub:val('f2')})}};
 },
 'c-courses':function(){
  var c=C(),co=S.courses[selCourse];
  var chips='<div class="chips">'+S.courses.map(function(x,i){return '<button class="chip'+(i===selCourse?' on':'')+'" data-c="'+i+'">'+esc(x.name)+'</button>'}).join('')+'</div>';
  var body=chips+'<div class="card"><h2>簡介</h2><p class="hint">顯示在首頁與課程總覽的卡片。</p>'+field('cs','簡介文字',c['course.'+co.slug+'.summary']||co.summary,{rows:3})+'</div>'
   +'<div class="card"><h2>課程資訊</h2><p class="hint">顯示在課程頁上方的資訊卡（時數、學費、報名資格等）。學費請填實際金額。</p><div class="grid2">'+co.facts.map(function(f,i){return field('cf'+i,f[0],c['course.'+co.slug+'.fact.'+i]||f[1],{rows:(f[1].length>40?3:0)})}).join('')+'</div></div>';
  return {title:'證照班資訊',lead:'一次改一個班別。切換班別前請先儲存。',body:body,bind:function(el){$$('.chip',el).forEach(function(b){b.onclick=function(){if(dirty&&!confirm('有尚未儲存的修改，確定切換？'))return;dirty=false;selCourse=+b.dataset.c;render()}})},save:function(){var m={};m['course.'+co.slug+'.summary']=val('cs');co.facts.forEach(function(f,i){m['course.'+co.slug+'.fact.'+i]=val('cf'+i)});putContent(m)}};
 },
 'c-schedule':function(){
  var gs=sched();
  var body=gs.map(function(g,gi){return '<details class="acc"'+(gi===0?' open':'')+'><summary>'+esc(g.name)+'<span class="tag">'+g.items.length+' 場</span></summary><div>'+g.items.map(function(it,ii){return '<div class="item" data-g="'+gi+'" data-i="'+ii+'"><div class="grid4">'+field('k'+gi+'_'+ii,'班別',it.kind)+field('d'+gi+'_'+ii,'日期顯示',it.date,{hint:'例：11/07（週六）'})+field('i'+gi+'_'+ii,'日期',it.iso,{type:'date',hint:'用來排序'})+'<label>狀態<select id="s'+gi+'_'+ii+'">'+['招生中','將開課','額滿','已結束'].map(function(x){return '<option'+(x===it.status?' selected':'')+'>'+x+'</option>'}).join('')+'</select></label></div></div>'}).join('')+'</div></details>'}).join('');
  return {title:'開課資訊',lead:'官網「最新開課資訊」、首頁與右側欄都讀這裡。已結束的場次不會顯示。',body:body,save:function(){var out=JSON.parse(JSON.stringify(sched()));out.forEach(function(g,gi){g.items.forEach(function(it,ii){var k=val('k'+gi+'_'+ii),d=val('d'+gi+'_'+ii),i=val('i'+gi+'_'+ii);if(k)it.kind=k;if(d)it.date=d;if(i)it.iso=i;it.status=document.getElementById('s'+gi+'_'+ii).value})});set('yz_sched',out)}};
 },
 'c-news':function(){
  var A=get('yz_news',[]);
  function row(n,i){return '<div class="item newsr"><div class="grid2">'+field('nd'+i,'日期',n.date,{type:'date'})+field('nt'+i,'標題',n.title)+'</div>'+field('nb'+i,'內容',n.body,{rows:3})+'<button class="btn sm danger rmn" data-i="'+i+'">刪除這則</button></div>'}
  var body='<div class="card"><h2>公告</h2><p class="hint">這裡新增的公告會出現在官網「最新消息」最上方與右側欄。原站匯入的 '+'43 篇文章不在這裡編輯。</p><div id="nr">'+A.map(row).join('')+'</div><button class="btn ghost" id="addn">＋ 新增公告</button></div>';
  return {title:'最新公告',lead:'短公告，例如開課通知、休假公告。',body:body,bind:function(el){$('#addn').onclick=function(){var a=collect();a.unshift({date:new Date().toISOString().slice(0,10),title:'',body:''});set('yz_news',a);render()};$$('.rmn',el).forEach(function(b){b.onclick=function(){var a=collect();a.splice(+b.dataset.i,1);set('yz_news',a);render()}});function collect(){return $$('.newsr',el).map(function(r,i){return {id:'a'+i+Date.now(),date:val('nd'+i),title:val('nt'+i),body:val('nb'+i)}})}},save:function(el){var a=$$('.newsr').map(function(r,i){return {id:'a'+i,date:val('nd'+i),title:val('nt'+i),body:val('nb'+i)}}).filter(function(n){return n.title});a.sort(function(x,y){return x.date<y.date?1:-1});set('yz_news',a)}};
 },
 'c-faq':function(){
  var c=C(),F=c.faq||S.faq;
  var body='<div class="card"><h2>首頁常見問題</h2><p class="hint">顯示在首頁，也會成為搜尋引擎看到的問答。回答請簡短、直接。</p><div id="fq">'+F.map(function(f,i){return '<div class="item fqr">'+field('fq'+i,'問題',f[0])+field('fa'+i,'回答',f[1],{rows:3})+'<button class="btn sm danger rmf" data-i="'+i+'">刪除這題</button></div>'}).join('')+'</div><button class="btn ghost" id="addf">＋ 新增一題</button></div>';
  return {title:'常見問題',lead:'各證照班頁面的問答在「證照班資訊」之外，由客戶提供後再開放編輯。',body:body,bind:function(el){function collect(){return $$('.fqr',el).map(function(r,i){return [val('fq'+i),val('fa'+i)]})}$('#addf').onclick=function(){var a=collect();a.push(['','']);var cc=C();cc.faq=a;set('yz_content',cc);render()};$$('.rmf',el).forEach(function(b){b.onclick=function(){var a=collect();a.splice(+b.dataset.i,1);var cc=C();cc.faq=a;set('yz_content',cc);render()}})},save:function(){var a=$$('.fqr').map(function(r,i){return [val('fq'+i),val('fa'+i)]}).filter(function(x){return x[0]&&x[1]});var cc=C();cc.faq=a;set('yz_content',cc)}};
 },
 'c-photos':function(){
  var c=C(),slots=[['slide.1','首頁輪播第 1 張'],['slide.2','首頁輪播第 2 張'],['slide.3','首頁輪播第 3 張']].concat(S.courses.map(function(x){return ['course.'+x.slug,x.name+'（卡片與課程頁大圖）']}));
  var body='<div class="card"><h2>照片</h2><p class="hint">選擇檔案後立即套用，不需要另外儲存。建議 1.5MB 以下；有人臉的照片請先取得本人同意。</p>'+slots.map(function(sl){var u=c['photo.'+sl[0]];return '<div class="photo"><div class="thumb" style="'+(u?'background-image:url('+u+')':'')+'">'+(u?'':'使用預設圖')+'</div><div><b>'+esc(sl[1])+'</b><br><input type="file" accept="image/*" data-p="photo.'+sl[0]+'"> '+(u?'<button class="btn sm danger" data-rm="photo.'+sl[0]+'" style="margin-top:8px">還原預設圖</button>':'')+'</div></div>'}).join('')+'</div>';
  return {title:'網站照片',lead:'更換首頁輪播與證照班封面。',body:body,bind:function(el){
   $$('input[type=file]',el).forEach(function(inp){inp.onchange=function(){var f=inp.files[0];if(!f)return;if(f.size>1500000){toast('照片請小於 1.5MB');return}var r=new FileReader();r.onload=function(){var cc=C();cc[inp.dataset.p]=r.result;set('yz_content',cc);toast('已更新');render()};r.readAsDataURL(f)}});
   $$('[data-rm]',el).forEach(function(b){b.onclick=function(){var cc=C();delete cc[b.dataset.rm];set('yz_content',cc);render()}})}};
 },
 'c-seo':function(){
  var c=C(),t=c['seo.title']||'',d=c['seo.desc']||'';
  var body='<div class="card"><h2>首頁在搜尋結果的樣子</h2><div class="serp"><div class="u">'+esc(S.brand)+' › 首頁</div><div class="t" id="pt"></div><div class="d" id="pd"></div></div>'+field('st','頁面標題',t,{hint:'<span class="count" id="ct"></span>'})+field('sd','頁面描述',d,{rows:3,hint:'<span class="count" id="cd"></span>'})+'<p class="hint">留白就使用系統預設的標題與描述。標題建議 30 字內、含主要關鍵字；描述建議 80～120 字。</p></div>';
  return {title:'搜尋與分享',lead:'影響 Google 搜尋與社群分享時顯示的標題與說明。',body:body,bind:function(el){function upd(){var a=val('st'),b=val('sd');$('#pt').textContent=a||S.brand+'｜三大國際證照班';$('#pd').textContent=b||'（使用預設描述）';var x=$('#ct'),y=$('#cd');x.textContent=a.length+' 字';x.className='count'+(a.length>60?' bad':'');y.textContent=b.length+' 字';y.className='count'+(b.length>160?' bad':'')}el.addEventListener('input',upd);upd()},save:function(){putContent({'seo.title':val('st'),'seo.desc':val('sd')})}};
 },
 's-contact':function(){
  var c=C();
  return {title:'聯絡資料',lead:'顯示在官網右側欄、頁尾與聯絡我們頁。',body:'<div class="card"><div class="grid2">'+field('p1','電話',c.phone||S.phone)+field('p2','E-mail',c.email||S.email)+field('p3','LINE 官方帳號 ID',c.lineId||S.lineId)+field('p4','上課時間',c.hours||S.hours)+'</div>'+field('p5','中心地址',c.address||S.address)+'</div>',save:function(){putContent({phone:val('p1'),email:val('p2'),lineId:val('p3'),hours:val('p4'),address:val('p5')})}};
 },
 's-account':function(){
  return {title:'帳號與密碼',lead:'',body:'<div class="card"><h2>修改密碼</h2><p class="hint">至少 8 碼。</p>'+field('np','新密碼','',{type:'password'})+'<button class="btn" id="sp">更新密碼</button></div><div class="card"><h2>示範資料</h2><p class="hint">清除示範用的場次、諮詢單與官網內容，回到初始狀態。</p><button class="btn danger" id="rs">重設所有示範資料</button></div>',bind:function(){$('#sp').onclick=function(){var v=$('#np').value;if(v.length<8){toast('密碼至少 8 碼');return}ST.pw=v;set('yz_admin',ST);$('#np').value='';toast('密碼已更新')};$('#rs').onclick=function(){if(confirm('會清除示範用的場次、諮詢單與官網內容，確定？')){['yz_admin','yz_content','yz_leads','yz_news','yz_bookings','yz_sched'].forEach(function(k){localStorage.removeItem(k)});ST=YZ.admin(S.courses);toast('已重設');render()}}}};
 }
};
render();
})();
