/* Daybook shell: home tiles, routing, shared UI helpers and the account/sync card.
   A module registers with OS.reg(key,{title,brand,icon,tabs:[[view,label,icon]],render(view,param),tile()}).
   Names here avoid the workout script's globals ($, esc, today, chart). */
(function(){
const qs=s=>document.querySelector(s);
const hx=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayStr=(d=new Date())=>d.toLocaleDateString('en-CA');
const addDays=(s,n)=>{const d=new Date(s+'T12:00');d.setDate(d.getDate()+n);return dayStr(d)};
const weekStart=s=>{const d=new Date((s||dayStr())+'T12:00');d.setDate(d.getDate()-((d.getDay()+6)%7));return dayStr(d)};
const fmtDay=s=>{if(!s)return'';const d=new Date(s+'T12:00');return d.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'})};
const ic=p=>`<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${p}</g></svg>`;
const ICON={home:ic('<path d="M4 11.5 12 5l8 6.5M6.5 10v8.5h11V10"/>'),
  plus:ic('<path d="M12 5v14M5 12h14"/>'),list:ic('<path d="M8 7h11M8 12h11M8 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01"/>'),
  chart:ic('<path d="M5 18V11M10 18V7M15 18v-5M20 18V5"/>'),check:ic('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  user:ic('<circle cx="12" cy="8.5" r="3.5"/><path d="M5 19c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5"/>'),team:ic('<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.4"/><path d="M3.5 18.5c1-2.8 3-4.3 5.5-4.3s4.5 1.5 5.5 4.3M15 14.6c2.2-.3 4 .9 5 3.4"/>'),
  review:ic('<rect x="4" y="5" width="16" height="14" rx="3"/><path d="M8 10h8M8 14h5"/>'),
  dumbbell:ic('<path d="M7 9.5v5M17 9.5v5M4 11v2.2M20 11v2.2M7 12h10"/>'),notes:ic('<rect x="5" y="4" width="14" height="16" rx="3"/><path d="M9 9h6M9 13h6M9 17h3"/>'),
  todo:ic('<rect x="4" y="5" width="5" height="5" rx="1.5"/><path d="m5.3 7.6 1.2 1.2 2-2.3M12 7.5h8M12 16.5h8"/><rect x="4" y="14" width="5" height="5" rx="1.5"/>'),
  book:ic('<path d="M5 5.5c2.5-1 5-1 7 .8v13c-2-1.8-4.5-1.8-7-.8zM19 5.5c-2.5-1-5-1-7 .8v13c2-1.8 4.5-1.8 7-.8z"/>'),
  four:ic('<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><path d="m14.5 16.5 1.6 1.6 3-3.4"/>'),
  week:ic('<rect x="4" y="5.5" width="16" height="14" rx="3"/><path d="M4 10h16M9 3.5v4M15 3.5v4M8 14h2M12 14h2M16 14h.01"/>'),
  back:ic('<path d="M14.5 6 8.5 12l6 6"/>'),fwd:ic('<path d="m9.5 6 6 6-6 6"/>')};
// Simple inline SVG bar chart: values 0..max, labels optional
function bars(labels,vals,o={}){const W=340,H=150,n=vals.length||1,mx=o.max||Math.max(1,...vals),bw=(W-8)/n;
  const b=vals.map((v,i)=>{const h=Math.max(v>0?3:0,(v/mx)*(H-38));const x=4+i*bw+bw*.14,w=bw*.72;
    return`<rect x="${x.toFixed(1)}" y="${(H-22-h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(5,w/2).toFixed(1)}" style="fill:${o.color||'var(--accent)'}"><title>${hx(labels[i])}: ${v}${o.unit||''}</title></rect>`+
    ((n<=14||i%Math.ceil(n/8)==0)?`<text x="${(x+w/2).toFixed(1)}" y="${H-6}" text-anchor="middle">${hx(labels[i])}</text>`:'')}).join('');
  return`<svg class="bars" viewBox="0 0 ${W} ${H}" role="img" aria-label="${hx(o.label||'chart')}"><text x="4" y="12" class="mx">${o.top||('max '+Math.round(mx)+(o.unit||''))}</text>${b}</svg>`}
const empty=(t,m)=>`<div class="card"><h3>${hx(t)}</h3><p class="m">${hx(m)}</p></div>`;

const OS={apps:{},order:[],app:'home',view:null,param:null,qs,hx,dayStr,addDays,weekStart,fmtDay,ICON,bars,empty,
  reg(key,def){this.apps[key]=def;if(!this.order.includes(key))this.order.push(key)},
  show(app,view,param){const a=this.apps[app];if(!a)return;if(this.app!==app&&a.onOpen)a.onOpen();this.app=app;this.view=view||(a.tabs&&a.tabs[0]?a.tabs[0][0]:null);this.param=param??null;this.render();scrollTo(0,0)},
  render(){const a=this.apps[this.app];qs('#brand').textContent=a.brand||'Daybook';
    const t=(a.tabs||[]).find(x=>x[0]==this.view);qs('#ttl').textContent=(a.titles&&a.titles[this.view])||(t?t[1]:a.title);
    this.nav();a.render(this.view,this.param)},
  refresh(){const ae=document.activeElement;if(ae&&ae.matches&&ae.matches('input,textarea,select')&&qs('#app').contains(ae))return;this.render()},
  nav(){const a=this.apps[this.app];const items=this.app==='home'?this.order.filter(k=>k!=='home'&&this.apps[k].quick).map(k=>['@'+k,this.apps[k].short||this.apps[k].title,this.apps[k].icon]):(a.tabs||[]);
    const on=a.navOn?a.navOn(this.view):this.view;
    qs('#nav').innerHTML=`<button class="${this.app==='home'?'on':''}" onclick="OS.show('home')">${ICON.home}<span>Home</span></button>`+
      items.map(([k,l,i])=>`<button class="${k==on&&this.app!=='home'?'on':''}" onclick="${k[0]=='@'?`OS.show('${k.slice(1)}')`:`OS.show('${this.app}','${k}')`}">${i}<span>${hx(l)}</span></button>`).join('')},
  start(){this.show('home')}
};
window.OS=OS;

/* Home */
OS.reg('home',{title:'Home',brand:'Daybook',render(){
  const tiles=OS.order.filter(k=>k!=='home').map(k=>{const a=OS.apps[k];let t={};try{t=a.tile?a.tile():{}}catch(e){}
    return`<button class="tile" onclick="OS.show('${k}')"><span class="tic">${a.icon}</span><span class="tt">${hx(a.title)}</span><span class="ts">${hx(t.stat??'')}</span><span class="tsub">${hx(t.sub??'')}</span></button>`}).join('');
  qs('#app').innerHTML=`<p class="m hello">${hx(new Date().toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'}))}</p><div class="tiles">${tiles}</div><div id="acct">${acct()}</div>`}});

/* Account & sync card (shared) */
const SL={loading:'Local',synced:'Synced',syncing:'Syncing',offline:'Offline','signed-out':'Sign in',error:'Sync issue',unavailable:'Local'};
let acctMsg='',acctEmail=localStorage.getItem('pos-email')||'',codeSent=false;
function syncLine(){const P=window.POS;if(P.state==='syncing')return'Syncing…';if(P.state==='offline')return'Offline. Changes are saved on this phone and will sync when you reconnect.';if(P.state==='error')return'Could not sync yet ('+(P.detail||'unknown error')+'). Retrying automatically.';return P.lastSync?'Last synced '+P.lastSync.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):'Up to date.'}
function acct(){const P=window.POS;if(!P)return'';const u=P.user;
  if(u)return`<div class="card"><h3>Account & sync</h3><p class="m">Signed in as <b>${hx(u.email)}</b>.</p><p class="m" style="margin-top:4px">${hx(syncLine())}</p><div class="row" style="margin-top:14px"><button class="s" onclick="POS.syncAll()">Sync now</button><button class="x" onclick="if(confirm('Sign out? Your data stays on this phone.'))POS.signOut().then(()=>OS.render())">Sign out</button></div></div>`;
  return`<div class="card"><h3>Sign in to sync</h3><p class="m">Keep everything private in your own cloud account and on every device. What's on this phone uploads the first time you sign in.</p>
<label for="em">Email</label><input id="em" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" value="${hx(acctEmail)}" oninput="acctEmail=this.value.trim()" onchange="acctEmail=this.value.trim()">
<button style="margin-top:14px" onclick="sendLink()">Email me a sign-in link</button>
${codeSent?`<label for="otp">Or enter the code from the email</label><input id="otp" inputmode="numeric" autocomplete="one-time-code" placeholder="Code" maxlength="10"><button class="s" style="margin-top:8px" onclick="verifyCode()">Sign in with code</button>`:''}
${acctMsg?`<p class="m" style="margin-top:10px">${acctMsg}</p>`:''}${P.state==='unavailable'?`<p class="m err" style="margin-top:10px">${hx(P.detail)}</p>`:''}</div>`}
async function sendLink(){const el=qs('#em');if(el)acctEmail=(el.value||'').replace(/[\s\u200B-\u200D\uFEFF]/g,'').toLowerCase();if(!/^[^@]+@[^@]+\.[^@]+$/.test(acctEmail)){acctMsg='<span class="err">Enter a valid email.</span>';OS.render();return}
  localStorage.setItem('pos-email',acctEmail);acctMsg='Sending…';OS.render();try{await POS.sendLink(acctEmail);codeSent=true;acctMsg='<span class="ok">Check your email.</span> Tap the link, or type the code here if you installed the app on your home screen.'}catch(e){acctMsg='<span class="err">'+hx(e.message||'Could not send')+'</span>'}OS.render()}
async function verifyCode(){const c=(qs('#otp')||{}).value||'';if(!c.trim())return;acctMsg='Checking…';try{await POS.verifyCode(acctEmail,c.trim());acctMsg='';codeSent=false}catch(e){acctMsg='<span class="err">'+hx(e.message||'Code did not work')+'</span>'}OS.render()}
function exportAll(){const out={exported_at:new Date().toISOString(),workout:typeof D!=='undefined'?D:null,tables:{}};['meeting_notes','action_items','bible_entries','reading_plans','daily_logs'].forEach(t=>{out.tables[t]=POS.rows(t)});
  const b=new Blob([JSON.stringify(out,null,1)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`daybook-${dayStr()}.json`;a.click()}
function goAcct(){OS.show('home');setTimeout(()=>{const a=qs('#acct');a&&a.scrollIntoView({block:'start'})},30)}
Object.assign(window,{exportAll,acct,sendLink,verifyCode,goAcct,syncLine});
if(window.POS)POS.onStatus(st=>{const b=qs('#sync');if(b){b.className=st;b.querySelector('span').textContent=SL[st]||'Local'}
  if(OS.app==='home'||(OS.app==='workout'&&OS.view==='more')){const a=document.activeElement;if(!(a&&a.matches&&a.matches('#em,#otp')))OS.render()}});
})();
