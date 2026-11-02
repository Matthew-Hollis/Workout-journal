/* Meeting Notes module: table public.meeting_notes (manual entries + Plaud imports from the daily server job) */
(function(){const {qs,hx,dayStr,fmtDay,ICON}=OS,T='meeting_notes';let q='';
POS.table({table:T,onRemote:()=>{if(['home','meet','act','week'].includes(OS.app))OS.refresh()}});
const all=()=>POS.rows(T).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.created_at||'').localeCompare(a.created_at||''));
const att=m=>Array.isArray(m.attendees)?m.attendees:String(m.attendees||'').split(',').map(x=>x.trim()).filter(Boolean);
function list(){const k=q.trim().toLowerCase(),L=all().filter(m=>!k||[m.title,m.summary,m.decisions,m.notes,att(m).join(' ')].join(' ').toLowerCase().includes(k));
  qs('#app').innerHTML=`<div class="card"><label for="mq">Search</label><input id="mq" placeholder="Title, person, or text" value="${hx(q)}" oninput="OSMeet.q(this.value)"></div><div id="ml">${L.length?L.map(m=>`<button class="card tap" onclick="OS.show('meet','detail','${hx(m.id)}')">
<div class="exhead"><div class="grow"><h3>${hx(m.title||'Untitled meeting')}</h3><p class="m">${hx(fmtDay(m.date))}${att(m).length?' · '+hx(att(m).join(', ')):''}</p></div><span class="pill">${m.source==='plaud'?'Plaud':'Manual'}</span></div>
${m.summary?`<p class="m clamp" style="margin-top:8px">${hx(m.summary)}</p>`:''}</button>`).join(''):OS.empty(k?'No matches':'No meeting notes yet',k?'Try a different search.':'Add one, or they will arrive from Plaud each day.')}</div>`}
function detail(id){const m=POS.get(T,id);if(!m)return list();const acts=POS.rows('action_items').filter(a=>a.source_meeting_id===id&&a.status!=='discarded');
  const sec=(t,v)=>v?`<div class="card"><h3>${t}</h3><p class="pre">${hx(v)}</p></div>`:'';
  qs('#app').innerHTML=`<div class="card"><div class="exhead"><div class="grow"><h3>${hx(m.title||'Untitled meeting')}</h3><p class="m">${hx(fmtDay(m.date))}</p></div><span class="pill">${m.source==='plaud'?'Plaud':'Manual'}</span></div>
${att(m).length?`<div class="chips" style="margin-top:10px">${att(m).map(a=>`<span class="chip">${hx(a)}</span>`).join('')}</div>`:''}</div>
${sec('Summary',m.summary)}${sec('Decisions',m.decisions)}${sec('Notes',m.notes)}
<div class="card"><h3>Action items</h3>${acts.length?`<div class="list">${acts.map(a=>`<div class="librow"><span class="grow ${a.status==='done'?'donet':''}">${hx(a.text)}</span><span class="m">${hx(a.is_mine?'Me':a.owner||'Team')}</span></div>`).join('')}</div>`:'<p class="m">None linked yet.</p>'}
<button class="s" style="margin-top:12px" onclick="OS.show('act','form',{meeting:'${hx(id)}'})">Add action item</button></div>
<div class="row"><button class="s" onclick="OS.show('meet','form','${hx(id)}')">Edit</button><button class="x" onclick="OSMeet.del('${hx(id)}')">Delete</button></div>`}
function form(id){const m=(id&&POS.get(T,id))||{date:dayStr(),title:'',attendees:[],summary:'',decisions:'',notes:'',source:'manual'};
  qs('#app').innerHTML=`<div class="card"><div class="row"><div><label for="md">Date</label><input id="md" type="date" value="${hx(m.date)}"></div></div>
<label for="mt">Title</label><input id="mt" value="${hx(m.title)}" placeholder="Meeting title">
<label for="ma">Attendees</label><input id="ma" value="${hx(att(m).join(', '))}" placeholder="Names, separated by commas">
<label for="ms">Summary</label><textarea id="ms" rows="3">${hx(m.summary)}</textarea>
<label for="mdc">Decisions</label><textarea id="mdc" rows="3">${hx(m.decisions)}</textarea>
<label for="mn">Notes</label><textarea id="mn" rows="5">${hx(m.notes)}</textarea>
${m.source==='plaud'?`<p class="m" style="margin-top:8px">Imported from Plaud (file ${hx(m.plaud_file_id||'')}).</p>`:''}</div>
<button onclick="OSMeet.save(${id?`'${hx(id)}'`:'null'})">${id?'Save changes':'Save meeting'}</button>${id?`<button class="s" style="margin-top:8px" onclick="OS.show('meet','detail','${hx(id)}')">Cancel</button>`:''}`}
window.OSMeet={q(v){q=v;const p=qs('#mq').selectionStart;list();const i=qs('#mq');i.focus();i.setSelectionRange(p,p)},
  save(id){const v=s=>qs(s).value.trim();if(!v('#mt')&&!v('#ms')&&!v('#mn')){alert('Add a title or some notes first.');return}
    const r=POS.put(T,{...(id?{id}:{source:'manual'}),date:qs('#md').value||dayStr(),title:v('#mt'),attendees:v('#ma').split(',').map(x=>x.trim()).filter(Boolean),summary:v('#ms'),decisions:v('#mdc'),notes:v('#mn')});OS.show('meet','detail',r.id)},
  del(id){if(confirm('Delete this meeting note?')){POS.del(T,id);OS.show('meet','list')}}};
OS.reg('meet',{title:'Meeting Notes',brand:'Meeting Notes',short:'Notes',quick:true,icon:ICON.notes,tabs:[['list','Notes',ICON.list],['form','Add',ICON.plus]],titles:{detail:'Meeting',form:'Meeting note'},
  navOn:v=>v==='detail'?'list':v,render(v,p){v==='detail'?detail(p):v==='form'?form(p):list()},
  tile(){const L=all();return{stat:L.length+' note'+(L.length==1?'':'s'),sub:L[0]?(L[0].title||'Untitled')+' · '+fmtDay(L[0].date):'None yet'}}});
})();
