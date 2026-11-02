/* Weekly Review: read-only roll-up across modules */
(function(){const {qs,hx,dayStr,addDays,weekStart,fmtDay,ICON}=OS;let ws=null;
function calc(s){const e=addDays(s,6),days=[...Array(7)].map((_,i)=>addDays(s,i)).filter(d=>d<=dayStr());
  const d4=OS.apps.d4.stats,b=OS.apps.bible.stats,logged=days.filter(d=>POS.get('daily_logs',d)),done=logged.reduce((t,d)=>t+d4.score(d).done,0);
  const A=POS.rows('action_items'),inW=t=>{if(!t)return false;const l=new Date(t).toLocaleDateString('en-CA');return l>=s&&l<=e};
  const W=(typeof D!=='undefined'&&D&&D.sessions)||[],read=new Set(b.ents().filter(x=>x.date>=s&&x.date<=e).map(x=>x.date));
  return{pct:logged.length?Math.round(done/(logged.length*4)*100):0,done,logged:logged.length,mins:b.minsBetween(s,e),readDays:read.size,streak:b.streak(),
    closed:A.filter(a=>a.status==='done'&&inW(a.completed_at)).length,opened:A.filter(a=>a.status!=='discarded'&&a.status!=='review'&&inW(a.created_at)).length,
    workouts:W.filter(x=>x.date>=s&&x.date<=e).length}}
function view(){const s=ws||weekStart(),c=calc(s),p=calc(addDays(s,-7)),isNow=s===weekStart();
  const dl=(a,b,u='')=>{const d=a-b;return d?`<span class="${d>0?'ok':'err'}">${d>0?'+':''}${d}${u} vs last week</span>`:'same as last week'};
  const tile=(t,v,sub)=>`<div class="card stile"><p class="m">${t}</p><p class="stat">${v}</p><p class="m">${sub}</p></div>`;
  qs('#app').innerHTML=`<div class="card daynav"><button class="s ic" aria-label="Previous week" onclick="OSWk.shift(-7)">${ICON.back}</button><div class="grow" style="text-align:center"><h3 style="margin:0">${isNow?'This week':'Week of '+hx(fmtDay(s))}</h3><p class="m">${hx(fmtDay(s))} – ${hx(fmtDay(addDays(s,6)))}</p></div><button class="s ic" aria-label="Next week" onclick="OSWk.shift(7)" ${isNow?'disabled':''}>${ICON.fwd}</button></div>
<div class="tiles">${tile('Daily 4',c.pct+'%',`${c.done} done over ${c.logged} day${c.logged==1?'':'s'} · ${dl(c.pct,p.pct,'%')}`)}
${tile('Reading',c.mins+' min',`${c.readDays}/7 days · streak ${c.streak} · ${dl(c.mins,p.mins,' min')}`)}
${tile('Actions',`${c.closed} <span class="unit">closed</span>`,`${c.opened} opened · ${dl(c.closed,p.closed)}`)}
${tile('Workouts',c.workouts,dl(c.workouts,p.workouts))}</div>`}
window.OSWk={shift(n){const s=addDays(ws||weekStart(),n);if(s>weekStart())return;ws=s;OS.render()}};
OS.reg('week',{title:'Weekly Review',brand:'Weekly Review',short:'Week',icon:ICON.week,tabs:[['week','This week',ICON.week]],titles:{week:'Weekly Review'},onOpen(){ws=null},render(){view()},
  tile(){const c=calc(weekStart());return{stat:c.pct+'% Daily 4',sub:`${c.closed} closed · ${c.workouts} workout${c.workouts==1?'':'s'}`}}});
})();
