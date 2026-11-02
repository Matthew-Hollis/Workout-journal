/* Personal OS sync core: private per-user, per-module cloud storage in Supabase.
   Each module keeps its own localStorage copy (offline cache, source of truth on device)
   and registers an adapter here. Cloud table: public.module_data (user_id, module, data, updated_at), RLS = own rows only.
   Two kinds of modules plug in:
     register({name,load,store,merge,onRemote})  - a whole JSON blob per module in public.module_data (used by workouts / wj-data-v1)
     table({table,onRemote})                     - row tables with pk (user_id,id), soft delete and server updated_at (meeting_notes, action_items, ...)
   Only the publishable key lives here; never put a secret/service_role key in client code. */
(function(){
const CFG={url:'https://ptinyojagmcusrhuabah.supabase.co',key:'sb_publishable_3gMtycqoZ3kbL9M7KBV6bg_4WYDegt9',
  lib:'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js',table:'module_data'};
const MK='pos-sync-v1';                 // sync bookkeeping only; module data keys are untouched
const mods={},listeners=[];let sb=null,user=null,state='loading',detail='',busy=null,again=false,timer=null,retry=0,lastSync=null;
const meta=()=>{try{return JSON.parse(localStorage.getItem(MK)||'{}')}catch(e){return{}}};
const setMeta=m=>localStorage.setItem(MK,JSON.stringify(m));
function mm(n){const m=meta();return m[n]||{}}
function setMM(n,v){const m=meta();m[n]={...(m[n]||{}),...v};setMeta(m)}
function status(s,d){state=s;detail=d||'';listeners.forEach(f=>{try{f(state,detail,api)}catch(e){}})}
const canon=v=>Array.isArray(v)?'['+v.map(canon).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}':JSON.stringify(v===undefined?null:v);
const same=(a,b)=>canon(a)===canon(b);

async function syncModule(m){
  const g0=mm(m.name).gen||0,before=m.load(),bs=canon(before);
  const {data:row,error}=await sb.from(CFG.table).select('data,updated_at').eq('module',m.name).maybeSingle();
  if(error)throw error;
  let out=(!row||mm(m.name).replace)?before:m.merge(before,row.data);
  const now=m.load();if(canon(now)!==bs)out=m.merge(now,out);   // saved while we were waiting
  if(!same(now,out)){m.store(out);m.onRemote&&m.onRemote(out)}
  if(!row||!same(row.data,out)){
    const {error:e2}=await sb.from(CFG.table).upsert({user_id:user.id,module:m.name,data:out},{onConflict:'user_id,module'});
    if(e2)throw e2}
  const cur=mm(m.name);setMM(m.name,{dirty:(cur.gen||0)!==g0,replace:false,last:new Date().toISOString()});
  if((cur.gen||0)!==g0)again=true;
}
/* ---- row-table modules ---- */
const tabs={},TK=t=>'pos-t-'+t;
function tload(t){if(!tabs[t].c){try{tabs[t].c=JSON.parse(localStorage.getItem(TK(t))||'null')}catch(e){}tabs[t].c=tabs[t].c||{rows:{},dirty:{},wm:null}}return tabs[t].c}
function tsave(t){localStorage.setItem(TK(t),JSON.stringify(tabs[t].c))}
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c=='x'?r:(r&3|8)).toString(16)});
async function syncTable(t){const c=tload(t),ids=Object.keys(c.dirty);
  if(ids.length){const gens={...c.dirty};
    const rows=ids.map(id=>c.rows[id]).filter(Boolean).map(r=>{const o={...r,user_id:user.id};delete o.updated_at;return o});
    for(let i=0;i<rows.length;i+=200){const {data,error}=await sb.from(t).upsert(rows.slice(i,i+200),{onConflict:'user_id,id',defaultToNull:false}).select('id,updated_at,created_at');if(error)throw error;
      (data||[]).forEach(d=>{const r=c.rows[d.id];if(r){r.updated_at=d.updated_at;r.created_at=r.created_at||d.created_at}})}
    ids.forEach(id=>{if(c.dirty[id]===gens[id])delete c.dirty[id]});tsave(t)}
  let q=sb.from(t).select('*').order('updated_at',{ascending:true}).limit(1000);
  if(c.wm)q=q.gt('updated_at',new Date(Date.parse(c.wm)-120000).toISOString());
  const {data,error}=await q;if(error)throw error;let changed=false;
  (data||[]).forEach(r=>{delete r.user_id;if(!c.wm||r.updated_at>c.wm)c.wm=r.updated_at;if(c.dirty[r.id])return;if(!same(c.rows[r.id],r)){c.rows[r.id]=r;changed=true}});
  tsave(t);if(changed&&tabs[t].onRemote)tabs[t].onRemote();
  if((data||[]).length===1000)again=true}
async function syncAll(){
  if(!sb||!user)return;
  if(busy){again=true;return busy}
  if(navigator.onLine===false){status('offline');return}
  status('syncing');
  busy=(async()=>{try{for(const n in mods)await syncModule(mods[n]);for(const t in tabs)await syncTable(t);retry=0;lastSync=new Date();status('synced')}
    catch(e){const off=navigator.onLine===false||/fetch|network/i.test(String(e&&e.message));status(off?'offline':'error',e&&e.message);
      retry=Math.min(retry+1,6);clearTimeout(timer);timer=setTimeout(syncAll,Math.min(300,5*2**retry)*1000)}
    finally{busy=null;if(again){again=false;setTimeout(syncAll,300)}}})();
  return busy}
function schedule(name,opt){const c=mm(name);setMM(name,{dirty:true,gen:(c.gen||0)+1,...(opt&&opt.replace?{replace:true}:{})});
  if(!user)return;clearTimeout(timer);timer=setTimeout(syncAll,800)}

function loadLib(){return new Promise((res,rej)=>{if(window.supabase)return res();const s=document.createElement('script');s.src=CFG.lib;s.async=true;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
async function init(){
  try{await loadLib()}catch(e){status('unavailable','Cloud sync could not load. Your data is still saved on this device.');return}
  sb=window.supabase.createClient(CFG.url,CFG.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'implicit',storageKey:'pos-auth'}});
  sb.auth.onAuthStateChange((ev,session)=>{const was=user&&user.id;user=session?session.user:null;
    if(!user){status('signed-out');return}
    if(was!==user.id||ev==='SIGNED_IN')setTimeout(syncAll,0)});
  const {data}=await sb.auth.getSession();user=data.session?data.session.user:null;
  if(location.hash.includes('access_token'))history.replaceState(null,'',location.pathname+location.search);
  user?syncAll():status('signed-out');
}
addEventListener('online',()=>syncAll());
addEventListener('offline',()=>{if(user)status('offline')});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncAll()});
const anyDirty=()=>Object.keys(mods).some(n=>mm(n).dirty)||Object.keys(tabs).some(t=>Object.keys(tload(t).dirty).length);
setInterval(()=>{if(user&&anyDirty())syncAll()},60000);

const redirect=()=>location.origin+location.pathname;
const api={
  register(m){mods[m.name]=m;if(user)syncAll()},
  schedule,syncAll,
  onStatus(f){listeners.push(f);f(state,detail,api)},
  get state(){return state},get detail(){return detail},get user(){return user},get lastSync(){return lastSync},
  pending(){return anyDirty()},
  table(def){tabs[def.table]={...def};tload(def.table);if(user)syncAll()},
  rows(t){const c=tload(t);return Object.values(c.rows).filter(r=>!r.deleted)},
  get(t,id){const r=tload(t).rows[id];return r&&!r.deleted?r:null},
  put(t,row){const c=tload(t);row={...row};if(!row.id)row.id=uuid();if(!row.created_at)row.created_at=new Date().toISOString();
    c.rows[row.id]={...(c.rows[row.id]||{}),...row};c.dirty[row.id]=(c.dirty[row.id]||0)+1;tsave(t);
    if(user){clearTimeout(timer);timer=setTimeout(syncAll,800)}return c.rows[row.id]},
  del(t,id){if(tload(t).rows[id])api.put(t,{id,deleted:true})},
  uuid,
  async sendLink(email){if(!sb)throw new Error('Cloud sync is not available right now.');
    const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:redirect(),shouldCreateUser:true}});if(error)throw error},
  async verifyCode(email,token){const {error}=await sb.auth.verifyOtp({email,token,type:'email'});if(error)throw error},
  async signOut(){if(sb)await sb.auth.signOut({scope:'local'});user=null;status('signed-out')}  // local module data is kept
};
window.POS=api;init();
})();
