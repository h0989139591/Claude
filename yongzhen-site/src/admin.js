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

var PD=null; // 既有可編輯頁面（建置時輸出的 pages.json）
function PG(){var d=get('yz_pages',null);return d&&d.pages&&d.custom?d:{pages:{},custom:[]}}
function PGset(d){set('yz_pages',d)}
function PUB(){return get('yz_pub',{pages:{},custom:[]})}
function changeCount(){var a=PG(),b=PUB(),n=0;Object.keys(a.pages).forEach(function(x){if(JSON.stringify(a.pages[x])!==JSON.stringify(b.pages[x]))n++});Object.keys(b.pages).forEach(function(x){if(!a.pages[x])n++});
 var bm={};b.custom.forEach(function(c){bm[c.id]=c});a.custom.forEach(function(c){if(JSON.stringify(c)!==JSON.stringify(bm[c.id]))n++;delete bm[c.id]});return n+Object.keys(bm).length}
var BLOCKS=[['h2','大標題'],['h3','小標題'],['p','段落'],['ul','清單'],['img','圖片'],['note','重點框'],['faq','問答'],['cta','聯絡按鈕']];
var BL={h2:'大標題',h3:'小標題',p:'段落',ul:'清單',img:'圖片',note:'重點框',faq:'常見問答',cta:'聯絡按鈕'};
var RESERVED=['admin','img','news','courses','articles','schedule','faq','about','booking','contact','privacy','terms','teachers','stories','partners','media','videos','knowledge','classroom','uploads','api','style','app'];
var ED=null;
function blankBlock(t){return t==='ul'?{type:'ul',items:['']}:t==='img'?{type:'img',src:'',alt:'',caption:''}:t==='note'?{type:'note',title:'重要說明',text:''}:t==='faq'?{type:'faq',items:[{q:'',a:''}]}:t==='cta'?{type:'cta',text:'想進一步了解？'}:{type:t,text:''}}
function ctaPrev(t){return '<div class="band"><div><b>'+esc(t||'想進一步了解？')+'</b></div><a class="btn primary" href="#">電話諮詢</a><a class="btn ghost" href="#">官方帳號</a></div>'}
function previewDoc(title,blocks){var r=YZB.render(blocks,{cta:ctaPrev});return '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><base target="_blank"><link rel="stylesheet" href="/style.css"></head><body style="padding:18px;margin:0"><header class="phead"><h1>'+esc(title||'（尚未輸入標題）')+'</h1></header><div class="prose">'+r.html+'</div></body></html>'}
function blockEd(b,i,n){
  var h='<div class="blk" data-i="'+i+'"><div class="bh"><b>'+(b.day?'日程標題':BL[b.type]||b.type)+'</b><span class="bc"><button class="btn sm ghost" data-mv="-1" '+(i===0?'disabled':'')+'>↑</button><button class="btn sm ghost" data-mv="1" '+(i===n-1?'disabled':'')+'>↓</button><button class="btn sm danger" data-rm>刪除</button></span></div>';
  if(b.type==='h2'||b.type==='h3')h+='<input data-f="text" value="'+esc(b.text)+'" placeholder="標題文字">';
  else if(b.type==='p')h+='<textarea data-f="text" rows="4" placeholder="段落文字">'+esc(b.text)+'</textarea><small class="hint">**粗體**、[文字](網址)；換行會保留。</small>';
  else if(b.type==='ul')h+='<textarea data-f="items" rows="4" placeholder="一行一項">'+esc((b.items||[]).join('\n'))+'</textarea><small class="hint">一行一項。</small>';
  else if(b.type==='img')h+='<div class="photo"><div class="thumb" style="'+(b.src?'background-image:url('+esc(b.src)+')':'')+'">'+(b.src?'':'尚未選擇')+'</div><div style="flex:1;min-width:0"><input type="file" accept="image/*" data-up> <input data-f="src" value="'+(b.src&&b.src.indexOf('data:')===0?'':esc(b.src))+'" placeholder="或貼上圖片網址（/img/… 或 https://…）" style="margin-top:8px"></div></div><div class="grid2"><label>圖片說明（替代文字）<input data-f="alt" value="'+esc(b.alt)+'"></label><label>圖說（選填）<input data-f="caption" value="'+esc(b.caption)+'"></label></div>';
  else if(b.type==='note')h+='<input data-f="title" value="'+esc(b.title)+'" placeholder="標題"><textarea data-f="text" rows="4" placeholder="內容" style="margin-top:8px">'+esc(b.text)+'</textarea>';
  else if(b.type==='cta')h+='<input data-f="text" value="'+esc(b.text)+'" placeholder="按鈕上方的提示文字"><small class="hint">會顯示「電話諮詢、官方帳號、預約說明會」三個按鈕。</small>';
  else if(b.type==='faq'){h+=(b.items||[]).map(function(q,j){return '<div class="item"><label>問題<input data-q="'+j+'" data-f="q" value="'+esc(q.q)+'"></label><label>回答<textarea data-q="'+j+'" data-f="a" rows="2">'+esc(q.a)+'</textarea></label><button class="btn sm danger" data-rmq="'+j+'">刪除這題</button></div>'}).join('')+'<button class="btn sm ghost" data-addq>＋ 新增一題</button>'}
  return h+'</div>';
}
function blocksPanel(){return ED.d.blocks.map(function(b,i){return blockEd(b,i,ED.d.blocks.length)}).join('')||'<p class="empty">還沒有內容，從下方加入第一個積木。</p>'}
var prevT=null;
function updPrev(){clearTimeout(prevT);prevT=setTimeout(function(){var f=$('#prev');if(f)f.srcdoc=previewDoc(ED.d.h1||ED.d.title,ED.d.blocks)},200)}
function markDirty(){dirty=true;var st=$('#sbst');if(st){st.className='st dirty';st.textContent='有尚未儲存的修改'}}
function editorBind(el){
  var host=$('#bl',el);
  function redraw(){host.innerHTML=blocksPanel();updPrev()}
  host.addEventListener('input',function(e){var t=e.target,blk=t.closest('.blk');if(!blk||!t.dataset.f)return;var b=ED.d.blocks[+blk.dataset.i],f=t.dataset.f;
    if(t.dataset.q!=null){b.items[+t.dataset.q][f]=t.value}else if(f==='items'){b.items=t.value.split('\n')}else{b[f]=t.value;if(f==='src'&&t.value){var th=blk.querySelector('.thumb');if(th){th.style.backgroundImage='url('+t.value+')';th.textContent=''}}}updPrev()});
  host.addEventListener('change',function(e){var t=e.target;if(!t.hasAttribute('data-up'))return;var f=t.files[0];if(!f)return;if(f.size>1200000){toast('圖片請小於 1.2MB');return}var blk=t.closest('.blk'),r=new FileReader();r.onload=function(){ED.d.blocks[+blk.dataset.i].src=r.result;markDirty();redraw()};r.readAsDataURL(f)});
  host.addEventListener('click',function(e){var t=e.target.closest('button');if(!t)return;var blk=t.closest('.blk');if(!blk)return;var i=+blk.dataset.i,bs=ED.d.blocks;
    if(t.hasAttribute('data-mv')){var j=i+(+t.dataset.mv);if(j<0||j>=bs.length)return;var x=bs[i];bs[i]=bs[j];bs[j]=x;markDirty();redraw()}
    else if(t.hasAttribute('data-rm')){if(confirm('刪除這個積木？')){bs.splice(i,1);markDirty();redraw()}}
    else if(t.hasAttribute('data-addq')){bs[i].items.push({q:'',a:''});markDirty();redraw()}
    else if(t.hasAttribute('data-rmq')){bs[i].items.splice(+t.dataset.rmq,1);markDirty();redraw()}});
  $$('[data-add]',el).forEach(function(b){b.onclick=function(){ED.d.blocks.push(blankBlock(b.dataset.add));markDirty();redraw();var all=$$('.blk',el);if(all.length)all[all.length-1].scrollIntoView({behavior:'smooth',block:'center'})}});
  function cnt(){var a=$('#cts'),b=$('#ctd');if(a){var n=(ED.d.seoTitle||'').length;a.textContent=n+' 字';a.className='count'+(n>60?' bad':'')}if(b){var m=(ED.d.seoDesc||'').length;b.textContent=m+' 字';b.className='count'+(m>160?' bad':'')}}
  $$('#meta input,#meta select,#meta textarea',el).forEach(function(i){var f=i.dataset.m;if(!f)return;var fn=function(){ED.d[f]=i.type==='checkbox'?i.checked:i.value;if(f==='h1'||f==='title')updPrev();if(f==='seoTitle'||f==='seoDesc')cnt()};i.addEventListener('input',fn);i.addEventListener('change',fn)});
  cnt();updPrev();
  var cov=$('#cover',el);if(cov)cov.onchange=function(){var f=cov.files[0];if(!f)return;if(f.size>1200000){toast('圖片請小於 1.2MB');return}var r=new FileReader();r.onload=function(){ED.d.image=r.result;markDirty();var th=$('#covth');th.style.backgroundImage='url('+r.result+')';th.textContent=''};r.readAsDataURL(f)};
}
function addBar(){return '<div class="addbar"><b>加入內容：</b>'+BLOCKS.map(function(x){return '<button class="btn sm ghost" data-add="'+x[0]+'">＋ '+x[1]+'</button>'}).join('')+'</div>'}
function pathOf(c){return c.type==='article'?'/news/'+(c.slug||'…')+'/':'/'+(c.slug||'…')+'/'}

var NAV=[
 ['工作',[['overview','總覽'],['leads','諮詢單'],['bookings','說明會報名'],['calendar','課程月曆']]],
 ['頁面與文章',[['pages','所有頁面'],['new','新增頁面／文章'],['publish','發布']]],
 ['官網內容',[['c-home','首頁文字'],['c-courses','證照班資訊'],['c-schedule','開課資訊'],['c-news','最新公告'],['c-faq','常見問題'],['c-photos','網站照片'],['c-seo','搜尋與分享']]],
 ['設定',[['s-contact','聯絡資料'],['s-account','帳號與密碼']]]
];
function newLeads(){return get('yz_leads',[]).filter(function(l){return l.status==='新諮詢'}).length}

function login(){
  app.innerHTML='<form class="login" id="lf"><h1>後台登入</h1><label>密碼<input type="password" id="pw" autocomplete="current-password" autofocus></label><button class="btn">登入</button><small id="err" style="color:var(--bad)"></small></form>';
  $('#lf').onsubmit=function(e){e.preventDefault();if($('#pw').value===ST.pw){sessionStorage.setItem('yz_in','1');render()}else $('#err').textContent='密碼不正確'};
}
function route(){return (location.hash||'#overview').slice(1)}
function routeName(){return route().split('/')[0]}
function go(r){if(dirty&&!confirm('有尚未儲存的修改，確定要離開嗎？'))return;dirty=false;location.hash='#'+r}
window.addEventListener('hashchange',function(){if(sessionStorage.getItem('yz_in')==='1'){dirty=false;render()}});

function render(){
  if(sessionStorage.getItem('yz_in')!=='1'){login();return}
  var r=routeName(),arg=route().slice(r.length+1),pg=(PAGES[r]||PAGES.overview)(arg);
  var nav=NAV.map(function(g){return '<div class="grp">'+g[0]+'</div>'+g[1].map(function(n){var badge=n[0]==='leads'&&newLeads()?'<span class="cnt">'+newLeads()+'</span>':(n[0]==='publish'&&changeCount()?'<span class="cnt">'+changeCount()+'</span>':'');return '<a class="nv'+((n[0]===r||(r==='edit'&&n[0]==='pages'))?' on':'')+'" href="#'+n[0]+'">'+n[1]+badge+'</a>'}).join('')}).join('');
  app.innerHTML='<div class="shell"><aside class="side"><p class="who">'+esc(S.brand)+'</p><p class="sub">後台管理</p><nav>'+nav+'</nav><div class="foot"><a class="btn ghost sm" href="/" target="_blank" rel="noopener">看官網</a><button class="btn ghost sm" id="out">登出</button></div></aside><main><div class="pg"><h1>'+pg.title+'</h1><p class="lead">'+(pg.lead||'')+'</p>'+pg.body+'</div></main>'+(pg.save?'<div class="savebar"><span class="st" id="sbst">沒有修改</span><button class="btn ghost" id="rv">還原</button><button class="btn" id="sv">'+(pg.saveLabel||'儲存')+'</button></div>':'')+'</div>';
  $('#out').onclick=function(){sessionStorage.removeItem('yz_in');render()};
  dirty=false;
  if(pg.bind)pg.bind($('main'));
  if(pg.save){
    var st=$('#sbst');
    $('main').addEventListener('input',function(){dirty=true;st.className='st dirty';st.textContent='有尚未儲存的修改'});
    $('main').addEventListener('change',function(){dirty=true;st.className='st dirty';st.textContent='有尚未儲存的修改'});
    $('#rv').onclick=function(){dirty=false;render()};
    $('#sv').onclick=function(){try{pg.save($('main'))}catch(e){return}dirty=false;st.className='st ok';st.textContent='已儲存 '+new Date().toTimeString().slice(0,5);toast('已儲存')};
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
PAGES.pages=function(){
  var g=PG(),rows=[];
  (PD||[]).forEach(function(p){var o=g.pages[p.key];rows.push({key:p.key,title:(o&&o.h1)||p.h1,path:p.path,kind:p.kind,state:o?'已修改':'',custom:false})});
  g.custom.forEach(function(c){rows.push({key:'c:'+c.id,title:c.title||'（未命名）',path:pathOf(c),kind:c.type==='article'?'新增文章':'新增頁面',state:c.status==='published'?'已發布':'草稿',custom:true})});
  var body='<div class="card"><div class="row" style="margin-bottom:12px"><input id="q" placeholder="搜尋標題或網址" style="max-width:340px"><a class="btn" href="#new">＋ 新增頁面／文章</a></div>'+
   '<div class="chips" id="flt">'+[['all','全部'],['mod','已修改'],['new','新增']].map(function(x,i){return '<button class="chip'+(i===0?' on':'')+'" data-f="'+x[0]+'">'+x[1]+'</button>'}).join('')+'</div>'+
   '<table class="tbl" id="ptb"><tr><th>標題</th><th>網址</th><th>類型</th><th>狀態</th><th></th></tr>'+rows.map(function(r){return '<tr data-s="'+esc((r.title+' '+r.path).toLowerCase())+'" data-m="'+(r.state==='已修改'?1:0)+'" data-n="'+(r.custom?1:0)+'"><td>'+esc(r.title)+'</td><td class="nw"><small>'+esc(r.path)+'</small></td><td class="nw">'+esc(r.kind)+'</td><td class="nw">'+(r.state?'<span class="tag'+(r.state==='草稿'?'':' done')+'">'+r.state+'</span>':'')+'</td><td class="nw"><a class="btn sm ghost" href="#edit/'+esc(r.key)+'">編輯</a></td></tr>'}).join('')+'</table></div>';
  return {title:'所有頁面',lead:'修改既有頁面的內文，或新增頁面與文章。改完要到「發布」才會上線。',body:body,bind:function(el){var q=$('#q',el),f='all';function ap(){var t=q.value.toLowerCase();$$('#ptb tr[data-s]',el).forEach(function(tr){var ok=tr.dataset.s.indexOf(t)>=0&&(f==='all'||(f==='mod'&&tr.dataset.m==='1')||(f==='new'&&tr.dataset.n==='1'));tr.hidden=!ok})}q.oninput=ap;$$('#flt .chip',el).forEach(function(b){b.onclick=function(){f=b.dataset.f;$$('#flt .chip',el).forEach(function(x){x.classList.toggle('on',x===b)});ap()}})}};
};
PAGES.new=function(){
  return {title:'新增頁面／文章',lead:'選一種模板開始。內容用積木組成，版面由系統統一，不會被改亂。',body:'<div class="stats"><a class="stat" href="#" data-t="page"><b style="font-size:22px">一般頁面</b><span>例如企業內訓、活動介紹。可選擇加入左側選單。</span></a><a class="stat" href="#" data-t="article"><b style="font-size:22px">文章</b><span>會出現在「最新消息」列表，有發佈日期與文章結構化資料。</span></a></div>',bind:function(el){$$('[data-t]',el).forEach(function(a){a.onclick=function(e){e.preventDefault();ED={key:'new',custom:true,d:{id:'',type:a.dataset.t,slug:'',title:'',seoTitle:'',seoDesc:'',date:new Date().toISOString().slice(0,10),image:'',menu:false,navLabel:'',status:'draft',blocks:[{type:'h2',text:''},{type:'p',text:''}]}};location.hash='#edit/new'}})}};
};
PAGES.edit=function(key){
  var g=PG();
  if(key==='new'){if(!ED||ED.key!=='new')return {title:'新增',lead:'',body:'<p class="empty">請從「新增頁面／文章」選擇模板。</p>'}}
  else if(!ED||ED.key!==key){
    if(key.indexOf('c:')===0){var c=g.custom.filter(function(x){return 'c:'+x.id===key})[0];if(!c)return {title:'找不到頁面',lead:'',body:'<p class="empty">這個頁面不存在。</p>'};ED={key:key,custom:true,d:JSON.parse(JSON.stringify(c))}}
    else{var base=(PD||[]).filter(function(p){return p.key===key})[0];if(!base)return {title:'找不到頁面',lead:'',body:'<p class="empty">這個頁面不存在。</p>'};var o=g.pages[key];ED={key:key,custom:false,base:base,d:{h1:(o&&o.h1)||base.h1,seoTitle:(o&&o.seoTitle)||'',seoDesc:(o&&o.seoDesc)||'',blocks:JSON.parse(JSON.stringify((o&&o.blocks)||base.blocks))}}}
  }
  var d=ED.d,cu=ED.custom;
  var meta=cu?'<div class="grid2"><label>類型<select data-m="type"><option value="page"'+(d.type==='page'?' selected':'')+'>一般頁面</option><option value="article"'+(d.type==='article'?' selected':'')+'>文章</option></select></label><label>網址代稱<input data-m="slug" value="'+esc(d.slug)+'" placeholder="例如 corporate-training"><small>只能用小寫英文、數字與連字號。網址：<span id="purl">'+esc(pathOf(d))+'</span></small></label></div><label>頁面標題<input data-m="title" value="'+esc(d.title)+'"></label><div class="grid2"><label>發佈日期（文章用）<input type="date" data-m="date" value="'+esc(d.date||'')+'"></label><label>狀態<select data-m="status"><option value="draft"'+(d.status!=='published'?' selected':'')+'>草稿（不發布）</option><option value="published"'+(d.status==='published'?' selected':'')+'>發布</option></select></label></div><div class="grid2"><label style="display:flex;flex-direction:row;align-items:center;gap:8px"><input type="checkbox" data-m="menu" '+(d.menu?'checked':'')+' style="width:auto;min-height:0"> 加入左側選單（一般頁面）</label><label>選單名稱<input data-m="navLabel" value="'+esc(d.navLabel||'')+'" placeholder="12 字內"></label></div><div class="photo"><div class="thumb" id="covth" style="'+(d.image?'background-image:url('+esc(d.image)+')':'')+'">'+(d.image?'':'封面圖（選填）')+'</div><div><input type="file" accept="image/*" id="cover"><small class="hint">會顯示在頁面標題下方。</small></div></div>'
   :'<label>頁面標題<input data-m="h1" value="'+esc(d.h1)+'"></label>';
  var seo='<label>搜尋標題 <small>留白使用預設</small><input data-m="seoTitle" value="'+esc(d.seoTitle||'')+'"><small><span class="count" id="cts"></span>　建議 30 字內</small></label><label>搜尋描述 <small>留白使用內文開頭</small><textarea data-m="seoDesc" rows="2">'+esc(d.seoDesc||'')+'</textarea><small><span class="count" id="ctd"></span>　建議 80～120 字</small></label>';
  var body='<div class="editor"><div><div class="card" id="meta"><h2>'+(cu?'頁面設定':'標題與搜尋')+'</h2>'+meta+seo+'</div><div class="card"><h2>內容</h2><p class="hint">用積木編輯內文，可以上下移動、刪除或新增。</p><div id="bl">'+blocksPanel()+'</div>'+addBar()+'</div>'+(!cu&&g.pages[key]?'<div class="card"><button class="btn danger" id="revert">還原為原站內容</button></div>':'')+'</div><div class="prevwrap"><div class="card"><h2>預覽</h2><p class="hint">與正式網站相同的樣式。</p><iframe id="prev" title="預覽"></iframe></div></div></div>';
  return {title:cu?(d.title||'新增頁面'):d.h1,lead:cu?'新增的頁面要把狀態改成「發布」，再到「發布」頁送出後才會上線。':'修改後按「儲存草稿」，再到「發布」送出。',body:body,saveLabel:'儲存草稿',
   bind:function(el){editorBind(el);var rv=$('#revert',el);if(rv)rv.onclick=function(){if(!confirm('還原成原站內容？你的修改會被丟棄。'))return;var g2=PG();delete g2.pages[key];PGset(g2);ED=null;dirty=false;location.hash='#pages'};
    function pu(){var u=$('#purl');if(u)u.textContent=pathOf(ED.d)}var sl=$('[data-m=slug]',el);if(sl)sl.addEventListener('input',pu);var ty=$('[data-m=type]',el);if(ty)ty.addEventListener('change',pu)},
   save:function(){var g2=PG(),dd=ED.d;
    if(ED.custom){
      var slug=(dd.slug||'').trim();
      if(!YZB.SLUG.test(slug)){toast('網址代稱只能用小寫英文、數字與連字號');throw new Error('slug')}
      if(dd.type==='page'&&RESERVED.indexOf(slug)>=0){toast('這個網址代稱是系統保留字，請換一個');throw new Error('slug')}
      if(g2.custom.some(function(c){return c.id!==dd.id&&c.slug===slug&&c.type===dd.type})){toast('已經有相同網址的頁面');throw new Error('slug')}
      if(!(dd.title||'').trim()){toast('請輸入頁面標題');throw new Error('title')}
      dd.slug=slug;if(!dd.id)dd.id='p'+Date.now().toString(36);
      var ix=g2.custom.map(function(c){return c.id}).indexOf(dd.id);var cp=JSON.parse(JSON.stringify(dd));if(ix>=0)g2.custom[ix]=cp;else g2.custom.push(cp);
      PGset(g2);if(ED.key==='new'){var nk='c:'+dd.id;ED.key=nk;setTimeout(function(){dirty=false;location.hash='#edit/'+nk},0)}
    }else{
      var same=JSON.stringify(dd.blocks)===JSON.stringify(ED.base.blocks)&&dd.h1===ED.base.h1&&!(dd.seoTitle||'').trim()&&!(dd.seoDesc||'').trim();
      if(same)delete g2.pages[ED.key];else g2.pages[ED.key]={h1:dd.h1,seoTitle:dd.seoTitle||'',seoDesc:dd.seoDesc||'',blocks:dd.blocks};
      PGset(g2);
    }}};
};
PAGES.publish=function(){
  var g=PG(),b=PUB(),n=changeCount();
  var mod=Object.keys(g.pages).map(function(k){var p=(PD||[]).filter(function(x){return x.key===k})[0];return {t:p?p.h1:k,u:p?p.path:'/'+k+'/',s:JSON.stringify(g.pages[k])!==JSON.stringify(b.pages[k])?'待發布':'已發布'}});
  var cus=g.custom.map(function(c){var bc=b.custom.filter(function(x){return x.id===c.id})[0];return {t:c.title||'（未命名）',u:pathOf(c),s:c.status!=='published'?'草稿（不會上線）':(JSON.stringify(c)!==JSON.stringify(bc)?'待發布':'已發布')}});
  var rows=mod.concat(cus);
  var body='<div class="card"><h2>待發布的內容</h2><p class="hint">共 <b>'+n+'</b> 項變更尚未發布。</p>'+(rows.length?'<table class="tbl"><tr><th>頁面</th><th>網址</th><th>狀態</th></tr>'+rows.map(function(r){return '<tr><td>'+esc(r.t)+'</td><td><small>'+esc(r.u)+'</small></td><td class="nw"><span class="tag'+(r.s==='已發布'?' done':'')+'">'+esc(r.s)+'</span></td></tr>'}).join('')+'</table>':'<p class="empty">目前沒有修改。到「所有頁面」編輯或新增。</p>')+'</div>'+
   '<div class="card"><h2>發布</h2><p class="hint"><b>正式版</b>：按下「發布」後，系統自動重新建置網站，約 1～2 分鐘後上線，內容會直接寫進網頁，搜尋引擎與 AI 爬蟲看得到。<br><b>示範版</b>：會下載一份 <code>overrides.json</code> 發布檔；把它放到專案的 <code>src/content/</code> 後執行 <code>node build.mjs</code> 即可產生實際網頁。</p><div class="row"><button class="btn" id="pub"'+(n?'':' disabled')+'>發布</button><button class="btn danger" id="dis"'+(n?'':' disabled')+'>放棄所有未發布修改</button></div></div>';
  return {title:'發布',lead:'送出修改，讓客戶改的內容上線。',body:body,bind:function(el){
   $('#pub',el).onclick=function(){var out={pages:g.pages,custom:g.custom};var blob=new Blob([JSON.stringify(out)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='overrides.json';document.body.appendChild(a);a.click();a.remove();set('yz_pub',JSON.parse(JSON.stringify(out)));toast('已產生發布檔');render()};
   $('#dis',el).onclick=function(){if(!confirm('放棄所有尚未發布的修改？'))return;var p=PUB();PGset({pages:JSON.parse(JSON.stringify(p.pages)),custom:JSON.parse(JSON.stringify(p.custom))});ED=null;toast('已還原到上次發布');render()}}};
};
fetch('/admin/pages.json').then(function(r){return r.json()}).then(function(d){PD=d}).catch(function(){PD=[]}).then(render);
})();
