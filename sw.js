const C='wj-v7',F=['./','./index.html','./sync.js','./os.js','./modules/meetings.js','./modules/actions.js','./modules/bible.js','./modules/daily4.js','./modules/weekly.js','./manifest.json','./icon.svg','./exercises.json'];
const LIB='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(cache=>Promise.all(F.map(async url=>{
    const res=await fetch(url+'?v='+C,{cache:'reload'});
    if(!res.ok) throw new Error(url+' '+res.status);
    const body=await res.blob();
    await cache.put(url,new Response(body,{status:res.status,statusText:res.statusText,headers:res.headers}));
  })).then(()=>cache.add(new Request(LIB,{mode:'cors'})).catch(()=>{}))));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET')return;
  // Never cache the cloud API or auth: always go to the network.
  if(url.origin!==self.location.origin&&url.href!==LIB)return;
  e.respondWith(caches.match(req,{ignoreSearch:url.origin===self.location.origin&&url.pathname.endsWith('/')}).then(r=>r||fetch(req).then(n=>{if(n.ok){const cl=n.clone();caches.open(C).then(c=>c.put(req,cl))}return n}).catch(()=>req.mode==='navigate'?caches.match('./index.html'):Response.error())));
});
