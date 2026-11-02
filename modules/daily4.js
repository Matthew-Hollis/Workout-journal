/* Daily 4 module: table public.daily_logs, one row per day (id = YYYY-MM-DD) with up to 4 priorities; slots = how many (1-4, default 3) */
(function(){const {qs,hx,dayStr,addDays,fmtDay,ICON,bars}=OS,T='daily_logs';let day=null;
POS.table({table:T,onRemote:()=>{if(['home','d4','week'].includes(OS.app))OS.refresh()}});
const blank=()=>({text:'',done:false,tag:'personal'});
const DEF=3,cl=n=>Math.min(4,Math.max(1,n|0));
const norm=r=>{const it=[...(r&&Array.isArray(r.items)?r.items:[])].slice(0,4);while(it.length<4)it.push(blank());const items=it.map(x=>({...blank(),...x}));
  let n=r&&r.slots?cl(r.slots):Math.max(DEF,items.reduce((m,x,i)=>x.text?i+1:m,0));return{id:r?r.id:null,date:r?r.date:null,slots:n,items,review:(r&&r.review)||''}};
const getDay=d=>norm(POS.get(T,d));
const write=(d,ch)=>{const c=getDay(d);POS.put(T,{id:d,date:d,slots:c.slots,items:c.items,review:c.review,...ch})};
const score=d=>{const c=getDay(d),v=c.items.slice(0,c.slots);return{done:v.filter(x=>x.done&&x.text).length,filled:v.filter(x=>x.text).length,n:c.slots}};
function todayV(){const d=day||dayStr(),c=getDay(d),isT=d===dayStr(),sc=score(d);
  qs('#app').innerHTML=`<div class="card daynav"><button class="s ic" aria-label="Previous day" onclick="OSD4.shift(-1)">${ICON.back}</button><div class="grow" style="text-align:center"><h3 style="margin:0">${isT?'Today':hx(fmtDay(d))}</h3><p class="m">${sc.done} of ${sc.n} done</p></div><button class="s ic" aria-label="Next day" onclick="OSD4.shift(1)" ${isT?'disabled':''}>${ICON.fwd}</button></div>
<div class="card"><label>Priorities today</label><div class="seg" role="group" aria-label="How many priorities">${[1,2,3,4].map(n=>`<button class="${n===c.slots?'':'s'}" onclick="OSD4.setN(${n})">${n}</button>`).join('')}</div></div>
${c.items.slice(0,c.slots).map((x,i)=>`<div class="card d4 ${x.done?'isdone':''}"><div class="d4row"><button class="ck ${x.done?'on':''}" aria-label="Done" onclick="OSD4.tick(${i})">${ICON.check}</button>
<input id="d4t${i}" value="${hx(x.text)}" placeholder="Priority ${i+1}" onchange="OSD4.text(${i},this.value)"></div>
<div class="seg small" role="group" aria-label="Tag">${['personal','professional'].map(t=>`<button class="${x.tag===t?'':'s'}" onclick="OSD4.tag(${i},'${t}')">${t==='personal'?'Personal':'Professional'}</button>`).join('')}</div>${x.carried?'<p class="m" style="margin-top:6px">Carried forward to a later day</p>':''}</div>`).join('')}
${isT?`<button class="s" onclick="OSD4.carry()">Carry forward unfinished</button>`:''}
<div class="card" style="margin-top:8px"><label for="d4r">End-of-day review</label><input id="d4r" value="${hx(c.review)}" placeholder="One line: how did today go?" onchange="OSD4.review(this.value)"></div>`}
function hist(){const L=POS.rows(T).sort((a,b)=>b.id.localeCompare(a.id));const days=[...Array(14)].map((_,i)=>addDays(dayStr(),i-13));
  qs('#app').innerHTML=`<div class="card"><h3>Completion, last 14 days</h3>${bars(days.map(d=>d.slice(8)),days.map(d=>score(d).done),{max:4,top:'done'})}</div>`+
  (L.length?L.slice(0,60).map(r=>{const c=norm(r),s=score(r.id);return`<button class="card tap" onclick="OSD4.open('${r.id}')"><div class="exhead"><h3>${hx(fmtDay(r.id))}</h3><span class="pill">${s.done}/${s.n}</span></div>
<div class="chips" style="margin-top:8px">${c.items.slice(0,c.slots).filter(x=>x.text).map(x=>`<span class="chip ${x.done?'cdone':''}">${x.done?'✓ ':''}${hx(x.text)}</span>`).join('')}</div>${c.review?`<p class="m" style="margin-top:8px">${hx(c.review)}</p>`:''}</button>`}).join(''):OS.empty('No days logged yet','Set your priorities for today.'))}
window.OSD4={shift(n){const d=addDays(day||dayStr(),n);if(d>dayStr())return;day=d;OS.render()},open(d){OS.show('d4','today');day=d;OS.render()},
  tick(i){const d=day||dayStr(),c=getDay(d);if(!c.items[i].text){alert('Type the item first.');return}c.items[i].done=!c.items[i].done;write(d,{items:c.items});OS.render()},
  text(i,v){const d=day||dayStr(),c=getDay(d);c.items[i].text=v.trim();write(d,{items:c.items})},
  tag(i,t){const d=day||dayStr(),c=getDay(d);c.items[i].tag=t;write(d,{items:c.items});OS.render()},
  setN(n){const d=day||dayStr(),c=getDay(d);n=cl(n);if(n===c.slots)return;const gone=c.items.slice(n).filter(x=>x.text);
    if(gone.length&&!confirm(`This removes ${gone.length} priorit${gone.length==1?'y':'ies'} you already typed. Continue?`))return;
    for(let i=n;i<4;i++)c.items[i]=blank();write(d,{slots:n,items:c.items});OS.render()},
  review(v){const d=day||dayStr();write(d,{review:v.trim()})},
  carry(){const t=dayStr(),c=getDay(t),free=c.items.slice(0,c.slots).map((x,i)=>x.text?-1:i).filter(i=>i>=0);
    const prev=POS.rows(T).filter(r=>r.id<t).sort((a,b)=>b.id.localeCompare(a.id)).find(r=>norm(r).items.some(x=>x.text&&!x.done&&!x.carried));
    if(!prev){alert('Nothing unfinished to carry forward.');return}const pc=norm(prev),todo=pc.items.map((x,i)=>[x,i]).filter(([x])=>x.text&&!x.done&&!x.carried);
    if(!free.length){alert(`Today's ${c.slots} priorit${c.slots==1?'y is':'ies are'} full. Add a slot or clear one to make room.`);return}
    const moved=todo.slice(0,free.length);moved.forEach(([x,pi],k)=>{c.items[free[k]]={text:x.text,done:false,tag:x.tag};pc.items[pi].carried=true});
    write(t,{items:c.items});POS.put(T,{id:prev.id,date:prev.id,slots:pc.slots,items:pc.items,review:pc.review});
    if(todo.length>moved.length)alert(`Moved ${moved.length}. ${todo.length-moved.length} more did not fit.`);day=t;OS.render()}};
OS.reg('d4',{title:'Daily 4',brand:'Daily 4',short:'Daily 4',quick:true,icon:ICON.four,tabs:[['today','Today',ICON.four],['hist','History',ICON.list]],titles:{today:'Daily 4'},
  onOpen(){day=null},render(v){v==='hist'?hist():todayV()},
  tile(){const s=score(dayStr());return{stat:s.done+'/'+s.n+' today',sub:s.filled<s.n?(s.n-s.filled)+' still to set':'All set'}},stats:{score,getDay}});
})();
