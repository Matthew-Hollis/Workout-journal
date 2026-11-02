/* Action Items module: table public.action_items. status: open | done | review (possible duplicate) | discarded */
(function(){const {qs,hx,dayStr,fmtDay,ICON}=OS,T='action_items';let showDone=false;
POS.table({table:T,onRemote:()=>{if(['home','act','meet','week'].includes(OS.app))OS.refresh()}});
const rows=()=>POS.rows(T);const today=()=>dayStr();
const overdue=a=>a.status==='open'&&a.due_date&&a.due_date<today();
const sortA=(a,b)=>(overdue(b)-overdue(a))||((a.due_date||'9999').localeCompare(b.due_date||'9999'))||((b.created_at||'').localeCompare(a.created_at||''));
const meet=id=>id&&POS.get('meeting_notes',id);
function item(a){const m=meet(a.source_meeting_id),od=overdue(a);
  return`<div class="aitem ${a.status==='done'?'isdone':''}"><button class="ck ${a.status==='done'?'on':''}" aria-label="${a.status==='done'?'Mark open':'Mark done'}" onclick="OSAct.toggle('${hx(a.id)}')">${ICON.check}</button>
<button class="abody" onclick="OS.show('act','form','${hx(a.id)}')"><span class="atext">${hx(a.text)}</span><span class="ameta">${!a.is_mine&&a.owner?`<span class="chip">${hx(a.owner)}</span>`:''}${a.due_date?`<span class="chip ${od?'od':''}">${od?'Overdue · ':'Due '}${hx(fmtDay(a.due_date))}</span>`:''}${m?`<span class="chip">${hx(m.title||'Meeting')}</span>`:''}${a.source==='plaud'?'<span class="chip">Plaud</span>':''}</span></button></div>`}
function view(mine){const L=rows().filter(a=>!!a.is_mine===mine);const open=L.filter(a=>a.status==='open').sort(sortA);
  const done=L.filter(a=>a.status==='done').sort((a,b)=>(b.completed_at||'').localeCompare(a.completed_at||'')).slice(0,30);const od=open.filter(overdue).length;
  qs('#app').innerHTML=`<div class="card"><div class="exhead"><div><p class="stat">${open.length}</p><p class="m">open${od?` · <span class="err">${od} overdue</span>`:''}</p></div><button class="s" style="width:auto" onclick="OS.show('act','form',{mine:${mine}})">Add</button></div></div>
<div class="card">${open.length?open.map(item).join(''):`<p class="m">Nothing open. Nice.</p>`}</div>
${done.length?`<div class="card"><button class="s" onclick="OSAct.done()">${showDone?'Hide':'Show'} completed (${done.length})</button>${showDone?`<div style="margin-top:8px">${done.map(item).join('')}</div>`:''}</div>`:''}`}
function review(){const L=rows().filter(a=>a.status==='review').sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));
  qs('#app').innerHTML=L.length?`<p class="m hello">These look like duplicates of items you already have. Keep or discard each one.</p>`+L.map(a=>{const d=a.duplicate_of&&POS.get(T,a.duplicate_of),m=meet(a.source_meeting_id);
  return`<div class="card"><p class="exname">${hx(a.text)}</p><p class="m" style="margin-top:4px">${hx(a.is_mine?'Mine':a.owner||'Team')}${a.due_date?' · due '+hx(fmtDay(a.due_date)):''}${m?' · '+hx(m.title||'Meeting'):''}</p>
${d?`<div class="dup"><span class="m">Looks like</span><span>${hx(d.text)}</span><span class="m">${d.status==='done'?'Done':'Open'}${d.due_date?' · due '+hx(fmtDay(d.due_date)):''}</span></div>`:''}
<div class="row" style="margin-top:12px"><button class="s" onclick="OSAct.keep('${hx(a.id)}')">Keep</button><button class="x" onclick="OSAct.discard('${hx(a.id)}')">Discard</button></div></div>`}).join(''):OS.empty('Review queue is clear','Possible duplicates from Plaud imports show up here.')}
function form(p){const id=typeof p==='string'?p:null,o=typeof p==='object'&&p?p:{};const a=(id&&POS.get(T,id))||{text:'',owner:'',is_mine:o.mine!==false,due_date:'',status:'open',source_meeting_id:o.meeting||'',source:'manual'};
  const ms=POS.rows('meeting_notes').sort((x,y)=>(y.date||'').localeCompare(x.date||'')).slice(0,40);
  qs('#app').innerHTML=`<div class="card"><label for="at">Action</label><textarea id="at" rows="2" placeholder="What needs to happen">${hx(a.text)}</textarea>
<label class="tog" for="am">This is mine<input id="am" type="checkbox" ${a.is_mine?'checked':''} onchange="qs_own()"></label>
<div id="aow" ${a.is_mine?'hidden':''}><label for="ao">Owner</label><input id="ao" value="${hx(a.owner)}" placeholder="Name"></div>
<label for="ad">Due date</label><input id="ad" type="date" value="${hx(a.due_date||'')}">
<label for="amt">From meeting</label><select id="amt"><option value="">None</option>${ms.map(m=>`<option value="${hx(m.id)}" ${m.id===a.source_meeting_id?'selected':''}>${hx(fmtDay(m.date))} · ${hx(m.title||'Untitled')}</option>`).join('')}</select></div>
<button onclick="OSAct.save(${id?`'${hx(id)}'`:'null'})">${id?'Save changes':'Add action item'}</button>
${id?`<div class="row" style="margin-top:8px"><button class="s" onclick="OSAct.toggle('${hx(id)}',1)">${a.status==='done'?'Reopen':'Mark done'}</button><button class="x" onclick="OSAct.del('${hx(id)}')">Delete</button></div>`:''}`}
window.qs_own=()=>{qs('#aow').hidden=qs('#am').checked};
const back=a=>OS.show('act',a&&!a.is_mine?'team':'mine');
window.OSAct={done(){showDone=!showDone;OS.render()},
  toggle(id,b){const a=POS.get(T,id);if(!a)return;const d=a.status!=='done';POS.put(T,{id,status:d?'done':'open',completed_at:d?new Date().toISOString():null});b?back(a):OS.render()},
  keep(id){POS.put(T,{id,status:'open'});OS.render()},discard(id){POS.put(T,{id,status:'discarded'});OS.render()},
  save(id){const t=qs('#at').value.trim();if(!t){alert('Describe the action first.');return}const mine=qs('#am').checked;
    const r=POS.put(T,{...(id?{id}:{status:'open',source:'manual'}),text:t,is_mine:mine,owner:mine?'':qs('#ao').value.trim(),due_date:qs('#ad').value||null,source_meeting_id:qs('#amt').value||null});back(r)},
  del(id){const a=POS.get(T,id);if(confirm('Delete this action item?')){POS.del(T,id);back(a)}}};
OS.reg('act',{title:'Action Items',brand:'Action Items',short:'Actions',quick:true,icon:ICON.todo,
  tabs:[['mine','Mine',ICON.user],['team','Team',ICON.team],['review','Review',ICON.review]],titles:{form:'Action item'},
  navOn:v=>v==='form'?'mine':v,render(v,p){v==='team'?view(false):v==='review'?review():v==='form'?form(p):view(true)},
  tile(){const L=rows().filter(a=>a.is_mine&&a.status==='open'),od=L.filter(overdue).length,rv=rows().filter(a=>a.status==='review').length;
    return{stat:L.length+' open',sub:[od?od+' overdue':'',rv?rv+' to review':''].filter(Boolean).join(' · ')||'Nothing overdue'}}});
})();
