'use strict';
const VERSION='d12d5a10e540',PREFIX='solvex-agenda-static-',CACHE=PREFIX+VERSION;
const FILES=["offline.html","manual.html","privacidade-agenda.html","termos-agenda.html","icons.svg","montserrat.woff2","app-76e375757fe2.webmanifest","solvex-logo-3a4d4172ddec.svg","favicon-53f6f0ac0384.svg","app-icon-192-7b17eecfaef3.png","app-icon-512-c83f8c634256.png","app-icon-maskable-512-6bf9a08c9836.png","apple-touch-icon-279f93a4d582.png","assets/style-9cea440f1fc6.css","assets/icons-968d5dba30fa.js","assets/auth-ab4852074d04.js","assets/api-547841a2abc8.js","assets/categories-31a34558bee9.js","assets/weekly-4aabe3dd1ca1.js","assets/admin-420d1e878e5c.js","assets/portal-fc0ca8c63b61.js","assets/public-a325281c4873.js","assets/google-flow-968bbc43f188.js","assets/google-callback-feb278486438.js","assets/pwa-33f8adda4149.js","assets/offline-3975979f1afb.js"];
const base=new URL('./',self.location.href),urls=new Set(FILES.map(file=>new URL(file,base).href));
const documents=new Set(['manual.html','privacidade-agenda.html','termos-agenda.html','offline.html'].map(file=>new URL(file,base).pathname));
async function saved(request){return (await (await caches.open(CACHE)).match(request))||caches.match(request);}
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([...urls]))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const names=(await caches.keys()).filter(name=>name.startsWith(PREFIX));
 const keep=new Set([CACHE,...names.filter(name=>name!==CACHE).slice(-1)]);
 await Promise.all(names.filter(name=>!keep.has(name)).map(name=>caches.delete(name)));
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data?.type==='SOLVEX_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 // Only public static files from this agenda. Never intercept API calls or writes.
 if(request.method!=='GET'||url.origin!==base.origin||!url.pathname.startsWith(base.pathname))return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request,{cache:'no-cache'}).catch(async()=>{
   if(documents.has(url.pathname)&&!url.search){const response=await saved(url.href);if(response)return response;}
   return (await saved(new URL('offline.html',base).href))||new Response('Sem conexão. Reconecte-se e atualize a página.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }));return;
 }
 const relative=url.pathname.slice(base.pathname.length);
 const versioned=/^assets\/[a-z-]+-[a-f0-9]{12}\.(js|css)$/.test(relative);
 if(url.search||(!urls.has(url.href)&&!versioned))return;
 event.respondWith((async()=>{
  const responseFromCache=await saved(request);if(responseFromCache)return responseFromCache;
  const response=await fetch(request);
  if(response.ok&&response.type!=='opaque'){const cache=await caches.open(CACHE);await cache.put(request,response.clone());}
  return response;
 })());
});
