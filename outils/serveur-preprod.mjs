// Serveur local qui imite Cloudflare Pages : sert dist/, applique _headers, renvoie 404.html, exécute functions/api/*.js
// Utilisation : node outils/construire.mjs && node outils/serveur-preprod.mjs [port]
import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), DIST = path.join(RACINE, 'dist');
const PORT = Number(process.argv[2] || 8788);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.zip': 'application/zip', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };
// lecture de _headers (format Cloudflare : un chemin, puis des lignes « Nom: valeur » indentées)
const regles = []; let cour = null;
for (const l of fs.readFileSync(path.join(DIST, '_headers'), 'utf8').split('\n')) {
  if (!l.trim() || l.trim().startsWith('#')) continue;
  if (!/^\s/.test(l)) { cour = { motif: new RegExp('^' + l.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'), h: {} }; regles.push(cour); }
  else { const i = l.indexOf(':'); cour.h[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
}
const entetes = p => Object.assign({}, ...regles.filter(r => r.motif.test(p)).map(r => r.h));
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x'); let p = decodeURIComponent(url.pathname);
  if (p.startsWith('/api/')) {
    const f = path.join(RACINE, 'functions', p.replace(/\/$/, '') + '.js');
    if (fs.existsSync(f)) { const m = await import(pathToFileURL(f).href); const h = m['onRequest' + req.method[0] + req.method.slice(1).toLowerCase()] || m.onRequest;
      if (h) { const r = await h({ request: new Request('http://x' + req.url, { method: req.method }), env: { ENVIRONNEMENT: 'local' } }); res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return; } }
  }
  let f = path.join(DIST, p); if (!f.startsWith(DIST)) { res.writeHead(400); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) { if (!p.endsWith('/')) { res.writeHead(308, { Location: p + '/' + url.search }); return res.end(); } f = path.join(f, 'index.html'); }
  let statut = 200; if (!fs.existsSync(f)) { statut = 404; f = path.join(DIST, '404.html'); p = '/404.html'; }
  res.writeHead(statut, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', ...entetes(p) });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log('préproduction locale : http://localhost:' + PORT));
