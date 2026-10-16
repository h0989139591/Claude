(function(){
'use strict';
var pad=function(n){return n<10?'0'+n:''+n};
var YZ=window.YZ={pad:pad};
YZ.get=function(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
YZ.set=function(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}};
YZ.ym=function(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)};
// 示範用假場次：本月與下月，輪流排入各班別
YZ.seed=function(courses){
  var out=[],now=new Date(),times=['10:00','14:00','19:00'],n=0;
  for(var m=0;m<2;m++){
    var base=new Date(now.getFullYear(),now.getMonth()+m,1),days=new Date(base.getFullYear(),base.getMonth()+1,0).getDate();
    for(var d=2;d<=days;d+=3){
      var c=courses[n%courses.length];n++;
      out.push({id:'s'+m+'-'+d,date:YZ.ym(base)+'-'+pad(d),time:times[n%3],course:c.name,seats:12,enrolled:3+(d%7)});
    }
  }
  return out;
};
YZ.admin=function(courses){
  var st=YZ.get('yz_admin',null);
  if(!st){st={pw:'demo1234',sessions:YZ.seed(courses)};YZ.set('yz_admin',st)}
  return st;
};
})();
