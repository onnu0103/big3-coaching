/* 4ヶ月プログラム：電波が悪くても開けるように（このページだけを保存。開くたびに新しいものを取りにいく） */
const CACHE = "big3-program-v1";
const CORE = ["./program.html", "./program-manifest.json", "./app/icon-180.png", "./app/icon-192.png", "./app/icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.indexOf("big3-program-") === 0 && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  /* プログラムのページ：ネットを先に。つながらないときは保存したもの */
  if (url.origin === location.origin && url.pathname.endsWith("/program.html")) {
    e.respondWith(fetch(req).then(res => {
      if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put("./program.html", cp)); }
      return res;
    }).catch(() => caches.match("./program.html")));
    return;
  }
  /* アイコン・マニフェスト・文字（Google Fonts）：保存したものを先に、うしろで新しくする */
  const mine = url.origin === location.origin && (url.pathname.indexOf("/app/") >= 0 || url.pathname.endsWith("/program-manifest.json"));
  const font = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!mine && !font) return;
  e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => {
    const net = fetch(req).then(res => { if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
