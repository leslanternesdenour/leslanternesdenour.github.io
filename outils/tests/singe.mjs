// Test de robustesse « singe » : clique au hasard sur les éléments cliquables de chaque page de jeu (ordinateur et mobile) et relève plantages JS, violations de CSP et pages cassées.
// Les liens qui quittent la page sont ignorés (on reste dans le jeu). Reproductible : graine fixe (LDN_GRAINE).
// Usage : node outils/construire.mjs && LDN_EMULATEUR=1 node outils/serveur-preprod.mjs 8811 &  puis  node outils/tests/singe.mjs http://localhost:8811 [nombre-de-clics]
import { createRequire } from 'module'; import fs from 'fs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT || 'playwright');
const BASE = process.argv[2] || 'http://localhost:8811', CLICS = +(process.argv[3] || 70), THREE = process.env.LDN_THREE || '/home/user/node_modules/three/';
let graine = +(process.env.LDN_GRAINE || 12345); const hasard = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
const EXTERNE = /fonts\.(googleapis|gstatic)|ytimg|youtube|gstatic|islamic\.network|alquran|googleusercontent|apis\.google|firebaseapp/;
const PAGES = process.env.LDN_PAGES ? process.env.LDN_PAGES.split(',') : ['/', '/ablutions/', '/ablutions/jeu3d/', '/priere/', '/priere/jeu3d/', '/priere/jeu3d/?perso=nouveau', '/ablutions/jeu3d/?perso=nouveau', '/calendrier/', '/monde/', '/voyage/', '/decouvrir/', '/tarifs/', '/univers/', '/transfert/'];
const nav = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const bilan = []; let total = 0;
for (const [vue, vp, mob] of [['ordinateur', { width: 1200, height: 800 }, false], ['mobile', { width: 390, height: 780 }, true]]) for (const url of PAGES) {
  const ctx = await nav.newContext({ viewport: vp, isMobile: mob, hasTouch: mob, locale: 'fr-FR' }); const erreurs = new Set();
  await ctx.addInitScript(() => { try { localStorage.setItem('lanternes_intro', JSON.stringify({ off: 1 })); localStorage.setItem('ldn_ouverture_vue', '1'); } catch (e) {} });
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/three@0\.170\.0\//, r => { const f = THREE + r.request().url().split('three@0.170.0/')[1]; fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }) : r.abort(); });
  await ctx.route(EXTERNE, r => r.abort());
  const p = await ctx.newPage(); p.on('dialog', d => d.dismiss().catch(() => {}));
  p.on('pageerror', e => { if (!/Transition was aborted|ResizeObserver|The play\(\) request|AbortError|NotAllowedError/.test(e.message)) erreurs.add('JS : ' + e.message.slice(0, 150) + (process.env.LDN_TRACE ? ' @ ' + String(e.stack || '').split('\n').slice(1, 3).map(x => x.trim().replace(/https?:\/\/[^/]+/, '')).join(' <- ') : '')); });
  p.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) erreurs.add('CSP : ' + m.text().slice(0, 120)); });
  let clics = 0, sorties = 0;
  try {
    await p.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 30000 }); await p.waitForTimeout(/jeu3d|voyage|monde/.test(url) ? 3000 : 1000);
    for (let i = 0; i < CLICS; i++) {
      if (!p.url().startsWith(BASE + url.split('?')[0])) { sorties++; await p.goto(BASE + url, { waitUntil: 'domcontentloaded' }).catch(() => {}); await p.waitForTimeout(800); }
      const cibles = await p.evaluate(() => [...document.querySelectorAll('button, [role=button], [role=tab], input[type=checkbox], input[type=range], select, summary, canvas, .carte, .choix-perso, .mode, [onclick]')].filter(e => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return b.width > 4 && b.height > 4 && s.visibility !== 'hidden' && s.display !== 'none' && b.bottom > 0 && b.top < innerHeight && b.right > 0 && b.left < innerWidth && !e.disabled && !(e.tagName === 'A'); }).map(e => { const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2, e.tagName]; })).catch(() => null);
      if (!cibles || !cibles.length) { await p.waitForTimeout(300); continue; }
      const [x, y, tag] = cibles[Math.floor(hasard() * cibles.length)];
      try { if (mob) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); clics++; } catch (e) {}
      if (hasard() < 0.15) { await p.keyboard.press(['Escape', 'Enter', 'Space', 'ArrowLeft', 'ArrowRight'][Math.floor(hasard() * 5)]).catch(() => {}); }
      await p.waitForTimeout(60 + Math.floor(hasard() * 120));
    }
    const vivant = await p.evaluate(() => document.body && document.body.children.length > 0).catch(() => false); if (!vivant) erreurs.add('page vide après les clics');
  } catch (e) { erreurs.add('page non chargée : ' + e.message.slice(0, 100)); }
  total += clics; bilan.push({ vue, url, clics, sorties, erreurs: [...erreurs] }); await ctx.close();
}
await nav.close();
for (const b of bilan) console.log(`${b.erreurs.length ? '✗' : '✓'} ${b.vue.padEnd(11)} ${b.url.padEnd(34)} ${String(b.clics).padStart(3)} clics${b.sorties ? ', ' + b.sorties + ' sortie(s)' : ''}${b.erreurs.length ? '\n     ' + b.erreurs.join('\n     ') : ''}`);
const ko = bilan.filter(b => b.erreurs.length).length; console.log(`\n${total} clics au total sur ${bilan.length} pages/vues ; ${ko} page(s) avec problème.`); process.exit(ko ? 1 : 0);
