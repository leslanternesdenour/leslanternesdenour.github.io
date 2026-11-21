// Non-régression : au calendrier du Ramadan, un enfant qui ferme l'accueil SANS créer de profil puis touche un niveau, l'étoile ou « Modifier »
// ne doit pas provoquer d'erreur : le formulaire de création s'ouvre à la place. (Bug trouvé par outils/tests/singe.mjs.)
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT || 'playwright');
const BASE = process.argv[2] || 'http://localhost:8790'; let ok = 0, ko = 0; const t = (n, c, d = '') => { c ? ok++ : ko++; console.log(`${c ? '✓' : '✗'} ${n}${d && !c ? ' — ' + d : ''}`); };
const nav = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const [vue, vp, mob] of [['ordinateur', { width: 1200, height: 800 }, false], ['mobile', { width: 390, height: 780 }, true]]) {
  const ctx = await nav.newContext({ viewport: vp, isMobile: mob, hasTouch: mob }); await ctx.route(/fonts\.|gstatic|youtube|ytimg/, r => r.abort()); const p = await ctx.newPage(); const err = []; p.on('pageerror', e => err.push(e.message));
  await p.goto(BASE + '/calendrier/'); await p.waitForTimeout(900);
  await p.evaluate(() => document.getElementById('ov').click());            // touche à côté de la fenêtre d'accueil : elle se ferme, aucun profil n'existe
  await p.waitForTimeout(300); t(`${vue} : accueil fermé sans profil`, !(await p.evaluate(() => document.getElementById('ov').classList.contains('on'))));
  for (const [nom, id] of [['niveau petits', 'lv1'], ['niveau grands', 'lv2'], ['étoile', 'star'], ['modifier', 'set']]) {
    await p.evaluate(() => { const o = document.getElementById('ov'); o.classList.remove('on'); o.innerHTML = ''; }); await p.evaluate(i => document.getElementById(i).click(), id); await p.waitForTimeout(200);
    t(`${vue} : « ${nom} » sans profil ouvre la création, sans erreur`, err.length === 0 && await p.evaluate(() => !!document.getElementById('fn')), err.join(' | ')); }
  // avec un profil, tout fonctionne comme avant
  await p.fill('#fn', 'Test'); await p.selectOption('#fa', '7'); await p.click('.seg button[data-g="f"]'); await p.click('#go'); await p.waitForTimeout(400);
  t(`${vue} : profil créé, niveaux et étoile utilisables`, err.length === 0 && await p.evaluate(() => { document.getElementById('lv1').click(); return document.getElementById('lv1').classList.contains('on'); }), err.join(' | '));
  await ctx.close();
}
await nav.close(); console.log(`\n${ok} réussis, ${ko} échoués`); process.exit(ko ? 1 : 0);
