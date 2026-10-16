(function(){
'use strict';
var YZ=window.YZ,box=document.getElementById('slots'),form=document.getElementById('bookForm');
if(!YZ||!box)return;
var esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var st=YZ.admin(window.SITE_COURSES||[]),picked=null;
var d=new Date(),today=d.getFullYear()+'-'+YZ.pad(d.getMonth()+1)+'-'+YZ.pad(d.getDate());
function list(){
  var up=st.sessions.filter(function(s){return s.date>=today}).sort(function(a,b){return (a.date+a.time)<(b.date+b.time)?-1:1}).slice(0,20);
  if(!up.length){box.innerHTML='<p>目前沒有開放的場次，請<a href="tel:">來電</a>或加入官方帳號詢問。</p>';return}
  box.innerHTML=up.map(function(s){
    var left=s.seats-s.enrolled,full=left<=0;
    return '<div class="slot"><div><b>'+esc(s.date)+' '+esc(s.time)+'</b><br><span>'+esc(s.course)+'</span></div><div class="left'+(left<=3?' low':'')+'">'+(full?'已額滿':'剩 '+left+' 位')+'</div><button class="btn '+(full?'ghost':'primary')+'" data-id="'+esc(s.id)+'"'+(full?' disabled':'')+'>預約</button></div>';
  }).join('');
  box.querySelectorAll('button[data-id]').forEach(function(b){b.onclick=function(){
    picked=st.sessions.filter(function(s){return s.id===b.dataset.id})[0];
    document.getElementById('picked').textContent='已選：'+picked.date+' '+picked.time+'　'+picked.course;
    document.getElementById('bookOk').hidden=true;document.getElementById('bookErr').hidden=true;
    form.hidden=false;form.scrollIntoView({behavior:'smooth',block:'center'});
  }});
}
form.addEventListener('submit',function(e){
  e.preventDefault();
  st=YZ.get('yz_admin',st);
  var s=st.sessions.filter(function(x){return picked&&x.id===picked.id})[0],err=document.getElementById('bookErr');
  if(!s){err.textContent='找不到這個場次，請重新選擇';err.hidden=false;return}
  if(s.enrolled>=s.seats){err.textContent='這個場次剛好額滿，請選擇其他場次';err.hidden=false;list();return}
  var f=Object.fromEntries(new FormData(form)),B=YZ.get('yz_bookings',[]);
  B.unshift({id:'b'+Date.now(),sid:s.id,session:s.date+' '+s.time+' '+s.course,name:f.name,phone:f.phone,note:f.note||'',at:new Date().toISOString()});
  s.enrolled+=1;YZ.set('yz_bookings',B);YZ.set('yz_admin',st);
  form.reset();document.getElementById('bookOk').hidden=false;err.hidden=true;list();
});
list();
})();
