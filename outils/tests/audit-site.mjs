// Audit automatique de TOUTES les pages publiées (dist/) dans un vrai Chrome, ordinateur et mobile : erreurs JS, violations de CSP, requêtes en échec,
// liens internes cassés, débordement horizontal, images sans alt, boutons/liens sans nom accessible, zones tactiles trop petites (mobile), titre/langue/viewport.
// Usage : node outils/construire.mjs && LDN_EMULATEUR=1 node outils/serveur-preprod.mjs 8810 &  puis  node outils/tests/audit-site.mjs http://localhost:8810
// Three.js : si WebGL/CDN indisponible, les pages 3D sont auditées avec les modules servis depuis $LDN_THREE (dossier three@0.170.0) quand il est fourni.
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT || 'playwright');
const BASE = process.argv[2] || 'http://localhost:8810', DIST = path.resolve('dist'), THREE = process.env.LDN_THREE || '/home/user/node_modules/three/';
const EXTERNE = /fonts\.(googleapis|gstatic)|ytimg|youtube|jsdelivr|gstatic|islamic\.network|alquran|googleusercontent|apis\.google|firebaseapp/;
const pages = []; (function w(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) w(p); else if (e.name.endsWith('.html')) pages.push('/' + path.relative(DIST, p).replace(/index\.html$/, '')); } })(DIST);
pages.sort(); const trouvailles = [], liensVus = new Set(), liensKO = new Map();
const nav = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [vue, vp, mob] of [['ordinateur', { width: 1280, height: 800 }, false], ['mobile', { width: 390, height: 780 }, true]]) for (const url of pages) {
  const ctx = await nav.newContext({ viewport: vp, isMobile: mob, hasTouch: mob, locale: 'fr-FR' });
  await ctx.addInitScript(() => { try { localStorage.setItem('lanternes_intro', JSON.stringify({ off: 1 })); localStorage.setItem('ldn_ouverture_vue', '1'); sessionStorage.setItem('ldn_portail', '*'); } catch (e) {} });
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/three@0\.170\.0\//, r => { const f = THREE + r.request().url().split('three@0.170.0/')[1]; fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }) : r.abort(); });
  await ctx.route(EXTERNE, r => r.abort());
  const p = await ctx.newPage(), T = (type, detail) => trouvailles.push({ vue, url, type, detail });
  p.on('pageerror', e => { if (!/Transition was aborted/.test(e.message)) T('erreur JS', e.message.slice(0, 140)); });
  p.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) T('CSP', m.text().slice(0, 140)); });
  p.on('response', r => { const u = r.url(); if (u.startsWith(BASE) && r.status() >= 400 && !/\/api\//.test(u)) T('ressource ' + r.status(), u.replace(BASE, '')); });
  try {
    await p.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 30000 }); await p.waitForTimeout(/jeu3d|voyage|monde/.test(url) ? 3500 : 1300);
    const r = await p.evaluate(() => {
      const out = { titre: document.title.trim(), lang: document.documentElement.lang, viewport: !!document.querySelector('meta[name=viewport]'), debord: document.documentElement.scrollWidth - innerWidth, h1: document.querySelectorAll('h1').length, sansAlt: [], sansNom: [], petits: [], liens: [] };
      const visible = e => { const b = e.getBoundingClientRect(), s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && e.offsetParent !== null; };
      for (const i of document.querySelectorAll('img')) if (!i.hasAttribute('alt') && visible(i)) out.sansAlt.push((i.getAttribute('src') || '').slice(-40));
      for (const e of document.querySelectorAll('button, a[href], [role=button], input:not([type=hidden]), select, textarea')) { if (!visible(e)) continue;
        const nom = (e.getAttribute('aria-label') || e.getAttribute('title') || e.innerText || e.value || e.getAttribute('alt') || (e.labels && e.labels[0] && e.labels[0].innerText) || e.getAttribute('placeholder') || (e.querySelector('img[alt]') || {}).alt || '').trim();
        if (!nom) out.sansNom.push((e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : '')).slice(0, 40));
        const b = e.getBoundingClientRect(); if ((e.tagName === 'BUTTON' || e.tagName === 'A' || e.getAttribute('role') === 'button') && (b.width < 40 || b.height < 40) && b.width * b.height > 0) out.petits.push((nom || e.id || e.tagName).slice(0, 24) + ' ' + Math.round(b.width) + '×' + Math.round(b.height)); }
      for (const a of document.querySelectorAll('a[href]')) { const h = a.getAttribute('href'); if (h && !/^(https?:|mailto:|tel:|javascript:|#|blob:|data:)/.test(h)) out.liens.push(new URL(h, location.href).pathname); }
      return out; });
    if (!r.titre) T('page sans titre', ''); if (!/^fr/i.test(r.lang)) T('langue absente ou fausse', r.lang || '(vide)'); if (!r.viewport) T('pas de balise viewport', ''); if (r.debord > 1) T('défilement horizontal', r.debord + ' px');
    if (r.sansAlt.length) T('images sans alt', r.sansAlt.slice(0, 4).join(', ') + (r.sansAlt.length > 4 ? ' …(' + r.sansAlt.length + ')' : '')); if (r.sansNom.length) T('éléments sans nom accessible', [...new Set(r.sansNom)].slice(0, 6).join(', '));
    if (mob && r.petits.length) T('zones tactiles < 40 px', [...new Set(r.petits)].slice(0, 5).join(' ; ') + (r.petits.length > 5 ? ' …(' + r.petits.length + ')' : ''));
    for (const l of r.liens) { liensVus.add(l); if (!liensKO.has(l)) liensKO.set(l, []); liensKO.get(l).push(url); }
  } catch (e) { T('page non chargée', e.message.slice(0, 100)); }
  await ctx.close();
}
await nav.close();
// liens internes : chaque cible doit répondre 200 (page ou fichier)
const casses = [];
for (const l of liensVus) { if (l.startsWith('/api/')) continue; const r = await fetch(BASE + l).catch(() => null); if (!r || r.status >= 400) casses.push(`${l} (depuis ${[...new Set(liensKO.get(l))].slice(0, 3).join(', ')})`); }
const g = {}; for (const t of trouvailles) { const k = t.type + ' | ' + t.url + (t.type === 'défilement horizontal' || t.type.startsWith('zones') ? '' : ''); (g[k] = g[k] || new Set()).add(t.vue + ': ' + t.detail); }
console.log(`${pages.length} pages × 2 vues auditées ; ${liensVus.size} liens internes distincts vérifiés.\n`);
if (casses.length) console.log('LIENS CASSÉS :\n - ' + casses.join('\n - ') + '\n'); else console.log('Liens internes : tous valides.\n');
const types = {}; for (const t of trouvailles) (types[t.type] = types[t.type] || []).push(t);
for (const [type, l] of Object.entries(types).sort()) { console.log(`■ ${type} (${l.length})`); const parPage = {}; for (const t of l) (parPage[t.url] = parPage[t.url] || new Set()).add(`${t.vue.slice(0, 3)}: ${t.detail}`); for (const [u, d] of Object.entries(parPage).slice(0, 14)) console.log(`   ${u}  ${[...d].slice(0, 2).join(' | ').slice(0, 160)}`); }
fs.writeFileSync(process.env.LDN_AUDIT_JSON || '/tmp/audit-site.json', JSON.stringify({ pages, trouvailles, casses }, null, 1));
process.exit(0);
