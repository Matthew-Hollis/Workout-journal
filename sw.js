const C='wj-v4',F=['./','./index.html','./manifest.json','./icon.svg','./exercises.json'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(cache=>Promise.all(F.map(async url=>{
    const res=await fetch(url+'?v='+C,{cache:'reload'});
    if(!res.ok) throw new Error(url+' '+res.status);
    const body=await res.blob();
    await cache.put(url,new Response(body,{status:res.status,statusText:res.statusText,headers:res.headers}));
  }))));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{const cl=n.clone();caches.open(C).then(c=>c.put(e.request,cl));return n}).catch(()=>caches.match('./index.html'))))});
