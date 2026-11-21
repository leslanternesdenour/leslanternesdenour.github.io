// Serveur local qui imite Cloudflare Pages : sert dist/, applique _headers, renvoie 404.html, exécute functions/api/*.js
// Utilisation : node outils/construire.mjs && node outils/serveur-preprod.mjs [port]
// Avec LDN_EMULATEUR=1 : SIMULATION LOCALE des comptes, de la base, de Stripe (test) et de R2 (voir outils/emulateur/).
import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), DIST = path.join(RACINE, 'dist');
const PORT = Number(process.argv[2] || 8788);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.zip': 'application/zip', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };
// lecture de _headers (format Cloudflare : un chemin, puis des lignes « Nom: valeur » indentées)
const regles = []; let cour = null;
for (const l of fs.readFileSync(path.join(DIST, '_headers'), 'utf8').split('\n')) {
  if (!l.trim() || l.trim().startsWith('#')) continue;
  if (!/^\s/.test(l)) { cour = { motif: new RegExp('^' + l.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'), h: [], retirer: [] }; regles.push(cour); }
  else if (l.trim().startsWith('! ')) cour.retirer.push(l.trim().slice(2).trim().toLowerCase());          // « ! En-tête » : retire l'en-tête posé par une règle précédente (comme Cloudflare)
  else { const i = l.indexOf(':'); cour.h.push([l.slice(0, i).trim(), l.slice(i + 1).trim()]); }
}
// Même logique que Cloudflare Pages : règles appliquées dans l'ordre ; pour chacune, retrait des en-têtes détachés puis ajout (valeurs jointes par « , »).
const entetes = p => { const h = {}; for (const r of regles.filter(r => r.motif.test(p))) { for (const n of r.retirer) for (const k of Object.keys(h)) if (k.toLowerCase() === n) delete h[k];
  for (const [k, v] of r.h) { const ex = Object.keys(h).find(x => x.toLowerCase() === k.toLowerCase()); if (ex) h[ex] += ', ' + v; else h[k] = v; } } return h; };
const EMUL = process.env.LDN_EMULATEUR === '1' ? await (await import('./emulateur/emulateur.mjs')).creerEmulateur() : null;
if (EMUL) console.log('⚠️  SIMULATION LOCALE active — compte Créateur : createur@local.test / ' + EMUL.mdpCreateur);
const lireCorps = req => new Promise(ok => { const t = []; req.on('data', c => t.push(c)); req.on('end', () => ok(Buffer.concat(t))); });
async function repondre(res, r) { const h = {}; r.headers.forEach((v, k) => { h[k] = k === 'set-cookie' ? r.headers.getSetCookie() : v; }); res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer())); }
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x'); let p = decodeURIComponent(url.pathname);
  // routes de TEST uniquement (LDN_TEST=1) : jamais présentes dans les fonctions déployées
  if (process.env.LDN_TEST === '1' && p.startsWith('/api/test-')) {
    const st = p === '/api/test-403' ? 403 : 200;
    res.writeHead(st, { 'Content-Type': 'application/json', 'Cache-Control': p === '/api/test-prive' ? 'private, no-store' : 'no-store' });
    return res.end(JSON.stringify({ test: p, statut: st }));
  }
  if (EMUL) {
    if (p === '/compte/config.js') { res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end("// SIMULATION LOCALE (outils/emulateur) — le fichier déployé garde EMULATEUR = false\nexport const FIREBASE = null;\nexport const EMULATEUR = true;\n"); }
    if (p.startsWith('/_emulateur/')) { const f = path.join(RACINE, 'outils', 'emulateur', 'pages', p.slice(12).replace(/\/$/, '') + '.html');
      if (fs.existsSync(f)) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); return fs.createReadStream(f).pipe(res); } }
    if (p.startsWith('/api/') && p !== '/api/sante') {
      const corps = ['GET', 'HEAD'].includes(req.method) ? undefined : await lireCorps(req);
      const h = new Headers(); for (const [k, v] of Object.entries(req.headers)) h.set(k, Array.isArray(v) ? v.join(', ') : v);
      return repondre(res, await EMUL.traiter(new Request('http://' + req.headers.host + req.url, { method: req.method, headers: h, body: corps })));
    }
  }
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
