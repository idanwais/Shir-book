const CACHE='shir-pages-v12';
const CORE=['./','./index.html'];
const PAGES=["./pages/page-001.jpg","./pages/page-002.jpg","./pages/page-003.jpg","./pages/page-004.jpg","./pages/page-005.jpg","./pages/page-006.jpg","./pages/page-007.jpg","./pages/page-008.jpg","./pages/page-009.jpg","./pages/page-010.jpg","./pages/page-011.jpg","./pages/page-012.jpg","./pages/page-013.jpg","./pages/page-014.jpg","./pages/page-015.jpg","./pages/page-016.jpg","./pages/page-017.jpg","./pages/page-018.jpg","./pages/page-019.jpg","./pages/page-020.jpg","./pages/page-021.jpg","./pages/page-022.jpg","./pages/page-023.jpg","./pages/page-024.jpg","./pages/page-025.jpg","./pages/page-026.jpg","./pages/page-027.jpg","./pages/page-028.jpg","./pages/page-029.jpg","./pages/page-030.jpg","./pages/page-031.jpg","./pages/page-032.jpg","./pages/page-033.jpg","./pages/page-034.jpg","./pages/page-035.jpg","./pages/page-036.jpg","./pages/page-037.jpg","./pages/page-038.jpg","./pages/page-039.jpg","./pages/page-040.jpg","./pages/page-041.jpg","./pages/page-042.jpg","./pages/page-043.jpg","./pages/page-044.jpg","./pages/page-045.jpg","./pages/page-046.jpg","./pages/page-047.jpg","./pages/page-048.jpg","./pages/page-049.jpg","./pages/page-050.jpg","./pages/page-051.jpg","./pages/page-052.jpg","./pages/page-053.jpg","./pages/page-054.jpg","./pages/page-055.jpg","./pages/page-056.jpg","./pages/page-057.jpg","./pages/page-058.jpg","./pages/page-059.jpg","./pages/page-060.jpg","./pages/page-061.jpg","./pages/page-062.jpg","./pages/page-063.jpg","./pages/page-064.jpg","./pages/page-065.jpg","./pages/page-066.jpg","./pages/page-067.jpg","./pages/page-068.jpg","./pages/page-069.jpg","./pages/page-070.jpg","./pages/page-071.jpg","./pages/page-072.jpg"];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

async function cacheAllPages(){
  const cache=await caches.open(CACHE);
  for(const url of PAGES){
    const hit=await cache.match(url);
    if(hit) continue;
    try{
      const response=await fetch(url,{cache:'no-cache'});
      if(response && response.ok) await cache.put(url,response.clone());
    }catch(_){}
    // Yield between pages so background offline caching doesn't compete with page turning.
    await new Promise(r=>setTimeout(r,35));
  }
}

self.addEventListener('message',event=>{
  if(event.data && event.data.type==='CACHE_ALL_PAGES'){
    event.waitUntil(cacheAllPages());
  }
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  const isPage=url.pathname.includes('/pages/page-') && url.pathname.endsWith('.jpg');
  if(isPage){
    event.respondWith((async()=>{
      const cached=await caches.match(event.request);
      if(cached) return cached;
      try{
        const response=await fetch(event.request);
        if(response && response.ok){
          const cache=await caches.open(CACHE);
          cache.put(event.request,response.clone());
        }
        return response;
      }catch(err){
        return new Response('',{status:504,statusText:'Offline'});
      }
    })());
    return;
  }
  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request);
        if(response && response.ok){
          const cache=await caches.open(CACHE);
          cache.put('./index.html',response.clone());
        }
        return response;
      }catch(_){
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
    })());
    return;
  }
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));
});
