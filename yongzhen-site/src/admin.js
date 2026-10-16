(function(){
'use strict';
var S=window.SITE,$=function(s,r){return (r||document).querySelector(s)};
var app=$('#app');
function get(k,d){return YZ.get(k,d)}
function set(k,v){if(!YZ.set(k,v))toast('瀏覽器空間不足或被封鎖')}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function toast(t){var d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},1800)}

function state(){return YZ.admin(S.courses)}
var pad=YZ.pad,ym=YZ.ym;
var ST=state(),tab=sessionStorage.getItem('yz_tab')||'總覽',selDay=null,calBase=new Date();
var TABS=['總覽','課程月曆','官網內容','設定'];

function render(){
  if(sessionStorage.getItem('yz_in')!=='1'){
    app.innerHTML='<form class="login" id="lf"><h1>後台登入</h1><label>密碼<input type="password" id="pw" autocomplete="current-password" autofocus></label><button class="btn">登入</button><small id="err" style="color:var(--bad)"></small></form>';
    $('#lf').onsubmit=function(e){e.preventDefault();
      if($('#pw').value===ST.pw){sessionStorage.setItem('yz_in','1');render()}else $('#err').textContent='密碼不正確'};
    return;
  }
  app.innerHTML='<header class="top"><b>'+esc(S.brand)+' 後台</b><nav class="tabs">'+TABS.map(function(t){return '<button class="tab'+(t===tab?' on':'')+'" data-t="'+t+'">'+t+'</button>'}).join('')+'</nav><a class="btn ghost sm" href="/" target="_blank" rel="noopener">看官網</a><button class="btn ghost sm" id="out">登出</button></header><main id="main"></main>';
  app.querySelectorAll('.tab').forEach(function(b){b.onclick=function(){tab=b.dataset.t;sessionStorage.setItem('yz_tab',tab);render()}});
  $('#out').onclick=function(){sessionStorage.removeItem('yz_in');render()};
  var v={'總覽':overview,'課程月曆':calendar,'官網內容':content,'設定':settings}[tab];v($('#main'));
}

function bookTable(){
  var B=get('yz_bookings',[]);
  if(!B.length)return '<p>還沒有人預約。到官網的「預約說明會」預約一場試試。</p>';
  return '<table><tr><th>預約時間</th><th>場次</th><th>姓名</th><th>電話</th><th>備註</th><th></th></tr>'+B.map(function(b,i){
    return '<tr><td>'+esc(b.at.slice(0,16).replace('T',' '))+'</td><td>'+esc(b.session)+'</td><td>'+esc(b.name)+'</td><td>'+esc(b.phone)+'</td><td>'+esc(b.note)+'</td><td><button class="btn ghost sm" data-cancel="'+i+'">取消</button></td></tr>'}).join('')+'</table>';
}
function overview(el){
  var cm=ym(new Date()),nx=ym(new Date(new Date().getFullYear(),new Date().getMonth()+1,1));
  var L=get('yz_leads',[]),sm=ST.sessions.filter(function(s){return s.date.indexOf(cm)===0}),sn=ST.sessions.filter(function(s){return s.date.indexOf(nx)===0});
  var en=sm.reduce(function(a,s){return a+s.enrolled},0);
  function list(a){return a.length?'<table><tr><th>日期</th><th>時間</th><th>班別</th><th>報名</th></tr>'+a.map(function(s){return '<tr><td>'+s.date+'</td><td>'+s.time+'</td><td>'+esc(s.course)+'</td><td>'+s.enrolled+'/'+s.seats+'</td></tr>'}).join('')+'</table>':'<p>沒有課程</p>'}
  el.innerHTML='<div class="stats"><div class="stat"><b>'+sm.length+'</b><span>本月課程</span></div><div class="stat"><b>'+en+'</b><span>本月報名人次</span></div><div class="stat"><b>'+L.filter(function(l){return l.status==='新諮詢'}).length+'</b><span>待回覆諮詢</span></div></div>'
   +'<h2>官網諮詢單</h2>'+(L.length?'<table><tr><th>時間</th><th>姓名</th><th>電話</th><th>班別</th><th>留言</th><th>狀態</th></tr>'+L.map(function(l,i){return '<tr><td>'+esc(l.at.slice(0,16).replace('T',' '))+'</td><td>'+esc(l.name)+'</td><td>'+esc(l.phone)+'</td><td>'+esc(l.course)+'</td><td>'+esc(l.msg)+'</td><td><button class="btn ghost sm" data-i="'+i+'">'+esc(l.status)+'</button></td></tr>'}).join('')+'</table>':'<p>還沒有諮詢。到官網首頁填一張預約諮詢單試試。</p>')
   +'<h2>說明會／試聽報名名單</h2>'+bookTable()
   +'<h2>本月課程</h2>'+list(sm)+'<h2>下月課程</h2>'+list(sn);
  el.querySelectorAll('button[data-cancel]').forEach(function(b){b.onclick=function(){
    var B=get('yz_bookings',[]),x=B.splice(+b.dataset.cancel,1)[0];set('yz_bookings',B);
    var st=get('yz_admin',ST);st.sessions.forEach(function(s){if(s.id===x.sid&&s.enrolled>0)s.enrolled--});ST=st;set('yz_admin',ST);toast('已取消預約');render()}});
  el.querySelectorAll('button[data-i]').forEach(function(b){b.onclick=function(){var l=get('yz_leads',[]),x=l[b.dataset.i];x.status=x.status==='新諮詢'?'已回覆':'新諮詢';set('yz_leads',l);render()}});
}

function calendar(el){
  var y=calBase.getFullYear(),m=calBase.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),h='';
  ['日','一','二','三','四','五','六'].forEach(function(d){h+='<div class="h">'+d+'</div>'});
  for(var i=0;i<first;i++)h+='<div class="day empty"></div>';
  for(var d=1;d<=days;d++){
    var key=y+'-'+pad(m+1)+'-'+pad(d),ss=ST.sessions.filter(function(s){return s.date===key});
    h+='<button class="day'+(selDay===key?' on':'')+'" data-d="'+key+'"><b>'+d+'</b>'+ss.map(function(s){return '<i>'+s.time+' '+esc(s.course)+'</i>'}).join('')+'</button>';
  }
  var day=selDay?ST.sessions.filter(function(s){return s.date===selDay}):[];
  el.innerHTML='<div class="row"><button class="btn ghost sm" id="pv">‹</button><b>'+y+' 年 '+(m+1)+' 月</b><button class="btn ghost sm" id="nx">›</button></div><div class="cal" style="margin-top:8px">'+h+'</div>'
   +'<h2>'+(selDay||'點選日期查看或新增課程')+'</h2>'
   +day.map(function(s){return '<div class="card row"><b>'+s.time+'</b><span>'+esc(s.course)+'</span><span>報名 '+s.enrolled+'/'+s.seats+'</span><button class="btn ghost sm" data-del="'+s.id+'" style="margin-left:auto">刪除</button></div>'}).join('')
   +(selDay?'<form id="af" class="card"><div class="row"><select name="course">'+S.courses.map(function(c){return '<option>'+esc(c.name)+'</option>'}).join('')+'</select><input name="time" type="time" value="10:00" style="width:auto"><input name="seats" type="number" min="1" value="12" style="width:90px"><button class="btn">新增課程</button></div></form>':'');
  $('#pv').onclick=function(){calBase=new Date(y,m-1,1);render()};$('#nx').onclick=function(){calBase=new Date(y,m+1,1);render()};
  el.querySelectorAll('.day[data-d]').forEach(function(b){b.onclick=function(){selDay=b.dataset.d;render()}});
  el.querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){ST.sessions=ST.sessions.filter(function(s){return s.id!==b.dataset.del});set('yz_admin',ST);render()}});
  var af=$('#af');if(af)af.onsubmit=function(e){e.preventDefault();var f=new FormData(af);
    ST.sessions.push({id:'n'+Date.now(),date:selDay,time:f.get('time'),course:f.get('course'),seats:+f.get('seats')||12,enrolled:0});set('yz_admin',ST);toast('已新增');render()};
}

function content(el){
  var C=get('yz_content',{});
  function val(k,d){return C[k]!=null?C[k]:d}
  var faq=C.faq||S.courses.flatMap(function(c){return c.faq}).slice(0,4);
  var h='<p>改完按「儲存」，再到官網重新整理就會看到（示範模式）。</p>';
  h+='<h2>首頁</h2><label>主標題<input id="f_heroTitle" value="'+esc(val('heroTitle',S.heroTitle))+'"></label><label>副標題<textarea id="f_heroSub" rows="2">'+esc(val('heroSub',S.heroSub))+'</textarea></label>';
  h+='<h2>三個證照班簡介</h2>'+S.courses.map(function(c){return '<label>'+esc(c.name)+'<textarea id="f_course.'+c.slug+'.summary" rows="2">'+esc(val('course.'+c.slug+'.summary',c.summary))+'</textarea></label>'}).join('');
  var news=get('yz_news',null)||S.news;
  h+='<h2>課程資訊（時數、學費、報名資格）</h2>'+S.courses.map(function(c){return '<div class="card"><b>'+esc(c.name)+'</b>'+c.facts.map(function(f,i){var k='course.'+c.slug+'.fact.'+i;return '<label>'+esc(f[0])+'<input id="f_'+k+'" value="'+esc(val(k,f[1]))+'"></label>'}).join('')+'</div>'}).join('');
  h+='<h2>最新消息</h2><div id="newsRows">'+news.map(newsRow).join('')+'</div><button class="btn ghost sm" id="addn">＋新增一則</button>';
  h+='<h2>常見問題</h2><div id="faqs">'+faq.map(function(f,i){return faqRow(f,i)}).join('')+'</div><button class="btn ghost sm" id="addf">＋新增一題</button>';
  var slots=[['slide.1','首頁輪播第 1 張'],['slide.2','首頁輪播第 2 張'],['slide.3','首頁輪播第 3 張']].concat(S.courses.map(function(c){return ['course.'+c.slug,c.name+'（卡片與課程頁大圖）']}));
  h+='<h2>網站照片 <small>（示範：存在瀏覽器，正式版存雲端）</small></h2>'+slots.map(function(sl){var u=C['photo.'+sl[0]];return '<div class="card row"><div class="thumb" style="'+(u?'background-image:url('+u+')':'')+'">'+(u?'':'未上傳')+'</div><div><b>'+esc(sl[1])+'</b><br><input type="file" accept="image/*" data-p="photo.'+sl[0]+'" style="width:auto"></div></div>'}).join('');
  h+='<h2>網頁標題（搜尋／分享）</h2><label>首頁標題 <small>建議 30 字內，含主要關鍵字</small><input id="f_seo.title" value="'+esc(val('seo.title',''))+'" placeholder="'+esc(S.brand+'｜三大國際證照班')+'"></label><label>首頁描述 <small>建議 80～120 字</small><textarea id="f_seo.desc" rows="3">'+esc(val('seo.desc',''))+'</textarea></label>';
  h+='<p><button class="btn" id="save">儲存</button></p>';
  el.innerHTML=h;
  function newsRow(n){return '<div class="card newsr"><label>日期<input class="nd" type="date" value="'+esc(n.date)+'"></label><label>標題<input class="nt" value="'+esc(n.title)+'"></label><label>內容<textarea class="nb" rows="2">'+esc(n.body)+'</textarea></label><button class="btn ghost sm rmn">刪除</button></div>'}
  $('#addn').onclick=function(){var d=document.createElement('div');d.innerHTML=newsRow({date:new Date().toISOString().slice(0,10),title:'',body:''});$('#newsRows').insertBefore(d.firstChild,$('#newsRows').firstChild);bindRmn()};
  function bindRmn(){el.querySelectorAll('.rmn').forEach(function(b){b.onclick=function(){b.parentNode.remove()}})}bindRmn();
  function faqRow(f,i){return '<div class="card"><label>問題<input class="fq" value="'+esc(f[0])+'"></label><label>回答<textarea class="fa" rows="2">'+esc(f[1])+'</textarea></label><button class="btn ghost sm rm">刪除</button></div>'}
  $('#addf').onclick=function(){var d=document.createElement('div');d.innerHTML=faqRow(['',''],0);$('#faqs').appendChild(d.firstChild);bindRm()};
  function bindRm(){el.querySelectorAll('.rm').forEach(function(b){b.onclick=function(){b.parentNode.remove()}})}bindRm();
  el.querySelectorAll('input[type=file]').forEach(function(inp){inp.onchange=function(){
    var f=inp.files[0];if(!f)return;if(f.size>1500000){toast('照片請小於 1.5MB（示範模式限制）');return}
    var r=new FileReader();r.onload=function(){var c=get('yz_content',{});c[inp.dataset.p]=r.result;set('yz_content',c);toast('已上傳');var t=inp.closest('.card').querySelector('.thumb');t.style.backgroundImage='url('+r.result+')';t.textContent=''};r.readAsDataURL(f)}});
  $('#save').onclick=function(){
    var c=get('yz_content',{});
    el.querySelectorAll('[id^=f_]').forEach(function(i){var k=i.id.slice(2);if(i.value.trim())c[k]=i.value.trim();else delete c[k]});
    var qs=[].slice.call(el.querySelectorAll('.fq')),as=[].slice.call(el.querySelectorAll('.fa'));
    c.faq=qs.map(function(q,i){return [q.value.trim(),as[i].value.trim()]}).filter(function(x){return x[0]&&x[1]});
    var rows=[].slice.call(el.querySelectorAll('.newsr')).map(function(r,i){return {id:'n'+Date.now()+i,date:r.querySelector('.nd').value,title:r.querySelector('.nt').value.trim(),body:r.querySelector('.nb').value.trim()}}).filter(function(n){return n.title});
    rows.sort(function(a,b){return a.date<b.date?1:-1});set('yz_news',rows);
    set('yz_content',c);toast('已儲存');
  };
}

function settings(el){
  var C=get('yz_content',{});
  el.innerHTML='<h2>官網聯絡資料</h2><label>電話<input id="s_phone" value="'+esc(C.phone||S.phone)+'"></label><label>地址<input id="s_address" value="'+esc(C.address||S.address)+'"></label><label>營業／上課時間<input id="s_hours" value="'+esc(C.hours||S.hours)+'"></label><label>LINE 官方帳號 ID<input id="s_lineId" value="'+esc(C.lineId||S.lineId)+'"></label><p><button class="btn" id="sc">儲存聯絡資料</button></p>'
   +'<h2>修改我的密碼</h2><label>新密碼（至少 8 碼）<input type="password" id="np" autocomplete="new-password"></label><p><button class="btn" id="sp">更新密碼</button></p>'
   +'<h2>示範資料</h2><p><button class="btn ghost" id="rs">重設所有示範資料</button></p>';
  $('#sc').onclick=function(){var c=get('yz_content',{});['phone','address','hours','lineId'].forEach(function(k){var v=$('#s_'+k).value.trim();if(v)c[k]=v});set('yz_content',c);toast('已儲存')};
  $('#sp').onclick=function(){var v=$('#np').value;if(v.length<8){toast('密碼至少 8 碼');return}ST.pw=v;set('yz_admin',ST);$('#np').value='';toast('密碼已更新')};
  $('#rs').onclick=function(){if(confirm('會清除示範用的課程、諮詢單與官網內容，確定？')){['yz_admin','yz_content','yz_leads','yz_news','yz_bookings'].forEach(function(k){localStorage.removeItem(k)});ST=state();toast('已重設');render()}};
}
render();
})();
