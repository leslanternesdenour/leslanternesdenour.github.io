// Tests dans un vrai navigateur (Chrome + Playwright) : node outils/tests/navigateur.mjs [url_de_base]
// Démarrer d'abord un serveur : python3 -m http.server 8000 (à la racine du site)
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT || 'playwright');
const BASE = process.argv[2] || 'http://localhost:8000';
const EXTERNE = /fonts\.(googleapis|gstatic)|ytimg|youtube|jsdelivr|gstatic|islamic\.network|alquran|googleusercontent/;
let ok = 0, ko = 0; const res = [];
const t = (nom, c, d = '') => { c ? ok++ : ko++; res.push(`${c ? '✓' : '✗'} ${nom}${d ? ' — ' + d : ''}`); };
const nav = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const ECRANS = { mobile: { width: 390, height: 844, isMobile: true, hasTouch: true }, tablette: { width: 820, height: 1180, isMobile: true, hasTouch: true }, ordinateur: { width: 1366, height: 820 } };
const PAGES = ['/', '/decouvrir/', '/ablutions/', '/priere/', '/calendrier/', '/compte/', '/transfert/', '/monde/', '/voyage/', '/ablutions/jeu3d/', '/priere/jeu3d/'];
for (const [nomE, e] of Object.entries(ECRANS)) {
  const ctx = await nav.newContext({ viewport: { width: e.width, height: e.height }, isMobile: !!e.isMobile, hasTouch: !!e.hasTouch, locale: 'fr-FR' });
  await ctx.addInitScript(() => { try { localStorage.setItem('lanternes_intro', JSON.stringify({ off: 1 })); localStorage.setItem('ldn_ouverture_vue', '1'); } catch (e) {} });
  for (const p of PAGES) {
    const page = await ctx.newPage(); const errs = [], manquants = [], csp = [];
    page.on('pageerror', x => errs.push(x.message));
    page.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) csp.push(m.text().slice(0, 160)); });
    page.on('response', r => { if (r.status() >= 400 && !EXTERNE.test(r.url()) && !/\/api\//.test(r.url()))   // /api/ : routes du serveur, absentes du serveur de test statique (le village et le voyage s'en passent)
       manquants.push(r.status() + ' ' + r.url().replace(BASE, '')); });
    try { await page.goto(BASE + p, { waitUntil: 'load', timeout: 20000 }); await page.waitForTimeout(3000); } catch (x) { errs.push('chargement: ' + x.message); }
    const largeur = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth).catch(() => 0);
    const visibles = await page.evaluate(() => [...document.querySelectorAll('.ecran:not(.cache) .titre-ecran')].map(x => x.textContent.trim()).join(' | ')).catch(() => '');
    t(`[${nomE}] ${p} : aucune erreur JavaScript`, errs.length === 0, errs.slice(0, 2).join(' / '));
    t(`[${nomE}] ${p} : aucune violation de la politique de sécurité (CSP)`, csp.length === 0, csp.slice(0, 2).join(' / '));
    t(`[${nomE}] ${p} : aucun fichier local manquant`, manquants.length === 0, manquants.slice(0, 3).join(', '));
    t(`[${nomE}] ${p} : pas de défilement horizontal`, largeur <= 1, largeur > 1 ? `déborde de ${largeur}px` : '');
    if (/monde|voyage|jeu3d/.test(p)) { const bloque = await page.evaluate(() => { const c = document.getElementById('chargement'); return !!c && !c.classList.contains('cache'); }).catch(() => false);
      t(`[${nomE}] ${p} : pas de chargement sans fin (jeu lancé ou écran de secours)`, !bloque); }
    if (visibles) res.push(`   ℹ écran affiché : ${visibles}`);
    if (p === '/') await page.screenshot({ path: `/tmp/accueil-${nomE}.png`, fullPage: false });
    await page.close();
  }
  await ctx.close();
}
// Récompenses : données écrites au format exact des jeux, puis lecture par le chemin de code du village
{
  const ctx = await nav.newContext(); const page = await ctx.newPage();
  await page.goto((process.env.HARNAIS_BASE || BASE) + '/outils/tests/harnais-recompenses.html');
  await page.evaluate(() => { localStorage.clear();
    localStorage.setItem('ablutions', JSON.stringify({ g1: 3, g2: 3, g3: 2, g4: 1, learned: 1 }));
    localStorage.setItem('priere', JSON.stringify({ g1: 3, g3: 3, g4: 3, learn: 1 }));
    localStorage.setItem('lanternes2', JSON.stringify({ cur: 0, kids: [{ name: 'Test', age: 6, g: 'f', lv: 'b', lit: { 1: 1, 2: 1 }, jeux: { db0: true } }] }));
    localStorage.setItem('monde_voyage', JSON.stringify({ aventure: { ramasses: ['lanterne-1', 'lanterne-5'] } })); });
  await page.reload(); await page.waitForFunction(() => window.__pret);
  const v = await page.evaluate(() => [document.getElementById('nb-etoiles').textContent, document.getElementById('nb-lanternes').textContent, JSON.parse(localStorage.getItem('monde'))]);
  t('Village : 19 étoiles affichées (9 + 9 + 1)', v[0] === '19', v[0]); t('Village : 4 lanternes affichées (2 + 2)', v[1] === '4', v[1]);
  t('Village : récompenses sauvegardées dans « monde »', v[2].etoiles === 19 && v[2].jeux.priere.etoiles === 9);
  await page.reload(); await page.waitForFunction(() => window.__pret);
  const v2 = await page.evaluate(() => document.getElementById('nb-etoiles').textContent);
  t('Village : recharger ne double pas les étoiles', v2 === '19', v2);
  const autres = await page.evaluate(() => [localStorage.getItem('ablutions'), localStorage.getItem('priere')]);
  t('Les sauvegardes des jeux ne sont pas modifiées', autres[0].includes('"g4":1') && autres[1].includes('"learn":1'));
  await ctx.close();
}
await nav.close();
console.log(res.join('\n')); console.log(`\n${ok} tests réussis, ${ko} en échec.`); process.exit(ko ? 1 : 0);
