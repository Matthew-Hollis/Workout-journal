/* Bible & Meditation module: tables public.bible_entries and public.reading_plans */
(function(){const {qs,hx,dayStr,addDays,weekStart,fmtDay,ICON,bars}=OS,T='bible_entries',P='reading_plans';
const rr=()=>{if(['home','bible','week'].includes(OS.app))OS.refresh()};POS.table({table:P,onRemote:rr});POS.table({table:T,onRemote:rr});
const ents=()=>POS.rows(T).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.created_at||'').localeCompare(a.created_at||''));
const plan=()=>POS.rows(P).filter(p=>p.active).sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''))[0];
const nextIdx=p=>{const d=new Set(p.done||[]);return(p.items||[]).findIndex((_,i)=>!d.has(i))};
function streak(){const days=new Set(ents().map(e=>e.date));let d=dayStr();if(!days.has(d))d=addDays(d,-1);let n=0;while(days.has(d)){n++;d=addDays(d,-1)}return n}
const minsBetween=(a,b)=>ents().filter(e=>e.date>=a&&e.date<=b).reduce((s,e)=>s+(+e.meditation_minutes||0),0);
function today(){const p=plan(),ni=p?nextIdx(p):-1,recent=ents().slice(0,10);
  qs('#app').innerHTML=`<div class="card"><div class="row"><div><p class="stat">${streak()}</p><p class="m">day streak</p></div><div><p class="stat">${minsBetween(weekStart(),dayStr())}</p><p class="m">minutes this week</p></div></div></div>
<div class="card"><h3>Today's reading</h3>
${p&&ni>=0?`<button class="s" onclick="OSBib.usePlan()">Next in ${hx(p.name)}: ${hx(p.items[ni])}</button>`:''}
<label for="br">Passage</label><input id="br" placeholder="e.g. Psalm 23 or John 1:1-14" value="">
<label for="bn">Notes</label><textarea id="bn" rows="4" placeholder="What stood out"></textarea>
<div class="row"><div><label for="bm">Meditation minutes</label><input id="bm" inputmode="numeric" placeholder="0"></div><div><label for="bd">Date</label><input id="bd" type="date" value="${dayStr()}"></div></div>
<input type="hidden" id="bpi" value=""><button style="margin-top:14px" onclick="OSBib.save()">Save entry</button></div>
${recent.length?`<div class="card list">${recent.map(e=>`<div class="librow"><div class="grow"><div class="exname">${hx(e.reference||'Meditation')}</div><div class="m">${hx(fmtDay(e.date))}${e.meditation_minutes?' · '+e.meditation_minutes+' min':''}</div>${e.notes?`<div class="m clamp" style="margin-top:4px">${hx(e.notes)}</div>`:''}</div><button class="x" onclick="OSBib.del('${hx(e.id)}')">Remove</button></div>`).join('')}</div>`:''}`}
function trends(){const ws=weekStart();const wk=[...Array(8)].map((_,i)=>addDays(ws,-7*(7-i)));
  const wv=wk.map(s=>minsBetween(s,addDays(s,6)));const now=new Date(),mo=[...Array(6)].map((_,i)=>new Date(now.getFullYear(),now.getMonth()-5+i,1));
  const mv=mo.map(d=>{const a=dayStr(d),b=dayStr(new Date(d.getFullYear(),d.getMonth()+1,0));return minsBetween(a,b)});
  const days=[...Array(28)].map((_,i)=>addDays(dayStr(),i-27)),have=new Set(ents().map(e=>e.date));
  qs('#app').innerHTML=`<div class="card"><div class="row"><div><p class="stat">${streak()}</p><p class="m">day streak</p></div><div><p class="stat">${days.filter(d=>have.has(d)).length}<span class="unit">/28</span></p><p class="m">days read, last 4 weeks</p></div></div>
<div class="dots">${days.map(d=>`<span class="${have.has(d)?'on':''}" title="${d}"></span>`).join('')}</div></div>
<div class="card"><h3>Minutes per week</h3>${bars(wk.map(s=>s.slice(5).replace('-','/')),wv,{unit:' min'})}</div>
<div class="card"><h3>Minutes per month</h3>${bars(mo.map(d=>d.toLocaleDateString([],{month:'short'})),mv,{unit:' min',color:'var(--accent-2)'})}</div>`}
function plans(){const p=plan();const done=p?new Set(p.done||[]):null;
  qs('#app').innerHTML=(p?`<div class="card"><h3>${hx(p.name)}</h3><div class="prog"><i style="width:${p.items.length?Math.round(done.size/p.items.length*100):0}%"></i></div><p class="m" style="margin-top:6px">${done.size} of ${p.items.length} readings · started ${hx(fmtDay(p.start_date))}</p>
<div class="list" style="margin-top:8px">${p.items.map((it,i)=>`<label class="tog plan"><span class="${done.has(i)?'donet':''}">${hx(it)}</span><input type="checkbox" ${done.has(i)?'checked':''} onchange="OSBib.mark(${i},this.checked)"></label>`).join('')}</div>
<button class="x" style="margin-top:8px" onclick="OSBib.endPlan()">End this plan</button></div>`:'')+
`<div class="card"><h3>${p?'Start a different plan':'Start a reading plan'}</h3><p class="m">Optional. One reading per line, in order.</p>
<label for="pn">Plan name</label><input id="pn" placeholder="e.g. Gospel of John">
<label for="pi">Readings</label><textarea id="pi" rows="6" placeholder="John 1&#10;John 2&#10;John 3"></textarea>
<button class="s" style="margin-top:8px" onclick="OSBib.fill()">Fill with a book and chapter count</button>
<button style="margin-top:8px" onclick="OSBib.newPlan()">Start plan</button></div>`}
window.OSBib={usePlan(){const p=plan(),i=nextIdx(p);qs('#br').value=p.items[i];qs('#bpi').value=i},
  save(){const ref=qs('#br').value.trim(),n=qs('#bn').value.trim(),m=parseInt(qs('#bm').value)||0;if(!ref&&!n&&!m){alert('Add a passage, a note, or minutes.');return}
    const pi=qs('#bpi').value,p=plan();const row={date:qs('#bd').value||dayStr(),reference:ref,notes:n,meditation_minutes:Math.max(0,m)};
    if(p&&pi!==''){row.plan_id=p.id;row.plan_index=+pi;if(p.items[+pi]===ref)POS.put(P,{id:p.id,done:[...new Set([...(p.done||[]),+pi])]})}
    POS.put(T,row);OS.render()},
  del(id){if(confirm('Remove this entry?')){POS.del(T,id);OS.render()}},
  mark(i,on){const p=plan();const d=new Set(p.done||[]);on?d.add(i):d.delete(i);POS.put(P,{id:p.id,done:[...d].sort((a,b)=>a-b)});OS.render()},
  endPlan(){const p=plan();if(confirm('End this plan? Your entries stay.')){POS.put(P,{id:p.id,active:false});OS.render()}},
  fill(){const b=prompt('Book name (e.g. John)');if(!b)return;const n=parseInt(prompt('How many chapters?'));if(!n||n<1)return;qs('#pi').value=[...Array(n)].map((_,i)=>b.trim()+' '+(i+1)).join('\n');if(!qs('#pn').value)qs('#pn').value=b.trim()},
  newPlan(){const name=qs('#pn').value.trim(),items=qs('#pi').value.split('\n').map(x=>x.trim()).filter(Boolean);if(!name||!items.length){alert('Add a name and at least one reading.');return}
    POS.rows(P).filter(p=>p.active).forEach(p=>POS.put(P,{id:p.id,active:false}));POS.put(P,{name,items,done:[],start_date:dayStr(),active:true});OS.render()}};
OS.reg('bible',{title:'Bible & Meditation',brand:'Bible & Meditation',short:'Bible',quick:true,icon:ICON.book,
  tabs:[['today','Today',ICON.plus],['trends','Trends',ICON.chart],['plan','Plan',ICON.list]],titles:{today:'Today'},
  render(v){v==='trends'?trends():v==='plan'?plans():today()},
  tile(){const s=streak(),p=plan();return{stat:s+' day streak',sub:minsBetween(weekStart(),dayStr())+' min this week'+(p?' · '+(p.done||[]).length+'/'+p.items.length:'')}},
  stats:{streak,minsBetween,ents}});
})();
