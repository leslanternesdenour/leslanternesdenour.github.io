// Amélioration ciblée des personnages 3D (version de TEST séparée) : vérifications dans un vrai navigateur.
//  - les expressions et animations ajoutées fonctionnent (sans erreur) ;
//  - elles sont COMPATIBLES avec le mode sans visage : en mode activé, aucune expression n'est visible (images identiques), les gestes du corps restent visibles ;
//  - les proportions n'ont pas changé, les originaux sont intacts, rien n'est branché sur le site ni sur les jeux.
// Démarrer : bash outils/tests/amelioration-personnages.sh
import { createRequire } from 'module'; import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT || 'playwright');
const BASE = process.argv[2] || 'http://localhost:8797', R = new URL('../../', import.meta.url).pathname;
const THREE = ['/home/user/node_modules/three', path.join(R, 'node_modules/three')].find(d => fs.existsSync(d));
let ok = 0, ko = 0; const res = [], erreurs = [];
const t = (nom, c, d = '') => { c ? ok++ : ko++; res.push(`${c ? '✓' : '✗'} ${nom}${d && !c ? ' — ' + d : ''}`); };
const lancement = { args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }; if (fs.existsSync('/usr/bin/google-chrome')) lancement.executablePath = '/usr/bin/google-chrome';
const nav = await chromium.launch(lancement);
const ctx = await nav.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.route(/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.*)/, r => { const f = THREE + '/' + r.request().url().match(/three@[^/]+\/(.*)/)[1]; fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }) : r.abort(); });
await ctx.route(/fonts\./, r => r.abort());
const page = await ctx.newPage(); page.on('pageerror', e => erreurs.push(e.message));
await page.goto(BASE + '/outils/personnages/amelioration.html'); await page.waitForFunction(() => window.__pret, null, { timeout: 40000 });
const cadre = o => page.evaluate(o => window.__cadre(o), o), diff = (a, b) => page.evaluate(([a, b]) => window.__diffUrls(a, b), [a, b]);
const EXPR = ['neutre', 'joie', 'surprise', 'curiosite', 'tristesse', 'malice'], GESTES = { garcon: ['accueil', 'reussite', 'recompense', 'surprise', 'curiosite', 'tristesse', 'maladroit'], fille: ['accueil', 'reussite', 'recompense', 'surprise', 'curiosite', 'tristesse', 'encourager'] };
for (const g of ['garcon', 'fille']) {
  const N = g === 'garcon' ? 'garçon' : 'fille';
  // --- structure : toutes les pièces mobiles du visage sont étiquetées
  const st = await page.evaluate(g => window.__structure(g), g);
  t(`${N} : sourcils, yeux, bouche et joues mobiles sont tous des pièces de visage (masquables)`, Object.values(st).every(x => x.sommets > 0 && x.visage === x.sommets), JSON.stringify(st));
  // --- proportions inchangées
  const bx = await page.evaluate(g => window.__boites(g), g);
  t(`${N} : mêmes proportions qu'avant (hauteur ${bx[1].h} → ${bx[2].h} m, largeur ${bx[1].l} → ${bx[2].l} m)`, Math.abs(bx[1].h - bx[2].h) < 0.02 && Math.abs(bx[1].l - bx[2].l) < 0.02, JSON.stringify(bx));
  // --- expressions visibles en mode normal (chacune se distingue du neutre)
  const vues = {}; for (const e of EXPR) vues[e] = await cadre({ genre: g, cam: 'tete', expr: e === 'neutre' ? null : e, sv: 0, incl: 1, larg: 300, haut: 300 });
  for (const e of EXPR.slice(1)) { const n = await diff(vues.neutre, vues[e]); t(`${N} : l'expression « ${e} » se distingue du visage neutre (${n} pixels)`, n > 150, 'n=' + n); }
  const avant = await cadre({ genre: g, v2: false, cam: 'tete', sv: 0, larg: 300, haut: 300 }), neutreV2 = vues.neutre;
  const dn = await diff(avant, neutreV2);
  t(`${N} : le visage neutre reste proche de l'original (${dn} pixels de différence : yeux un peu plus grands, sourcils arqués ; sourire, joues, tête et vêtements conservés)`, dn > 0 && dn < 6000, 'dn=' + dn);
  // --- mode sans visage : aucune expression visible (images identiques, sans inclinaison de la tête)
  const sv = {}; for (const e of EXPR) sv[e] = await cadre({ genre: g, cam: 'tete', expr: e === 'neutre' ? null : e, sv: 1, incl: 0, larg: 300, haut: 300 });
  let max = 0; for (const e of EXPR.slice(1)) max = Math.max(max, await diff(sv.neutre, sv[e]));
  t(`${N} : mode sans visage : les 5 expressions sont INVISIBLES (images identiques, écart maximal ${max} pixels)`, max <= 3, 'max=' + max);
  const nv = await diff(vues.neutre, sv.neutre); t(`${N} : mode sans visage : le visage disparaît bien (${nv} pixels de différence avec le mode normal)`, nv > 300, 'nv=' + nv);
  const wink = await cadre({ genre: g, cam: 'tete', clin: 1, sv: 0, larg: 300, haut: 300 }), winkSv = await cadre({ genre: g, cam: 'tete', clin: 1, sv: 1, incl: 0, larg: 300, haut: 300 });
  t(`${N} : le clin d'œil se voit en mode normal (${await diff(vues.neutre, wink)} pixels) et disparaît en mode sans visage (${await diff(sv.neutre, winkSv)} pixels)`, (await diff(vues.neutre, wink)) > 30 && (await diff(sv.neutre, winkSv)) <= 3);
  // --- gestes : le corps bouge, avec ou sans visage ; aucune erreur
  const repos = await cadre({ genre: g, cam: 'corps', sv: 1, yaw: 0.45, t: 0.8, larg: 240, haut: 320 });
  for (const ge of GESTES[g]) {
    const a = await cadre({ genre: g, cam: 'corps', geste: ge, sv: 1, yaw: 0.45, t: 0.8, larg: 240, haut: 320 }), n = await diff(repos, a);
    t(`${N} : geste « ${ge} » : le corps s'anime et reste visible en mode sans visage (${n} pixels)`, n > 150, 'n=' + n);
  }
  // --- dialogue : la tête s'incline (même sans visage)
  const d0 = await cadre({ genre: g, cam: 'corps', sv: 1, parle: false, t: 0.5, larg: 240, haut: 320 }), d1 = await cadre({ genre: g, cam: 'corps', sv: 1, parle: true, t: 1.6, larg: 240, haut: 320 });
  t(`${N} : pendant un dialogue, la tête s'incline et hoche (${await diff(d0, d1)} pixels), visible aussi sans visage`, (await diff(d0, d1)) > 20);
}
// --- détails d'identité : conservés en mode sans visage (ce ne sont pas des traits du visage)
const sacV2 = await cadre({ genre: 'garcon', cam: 'sac', sv: 1, larg: 300, haut: 300 }), sacV1 = await cadre({ genre: 'garcon', v2: false, cam: 'sac', sv: 1, larg: 300, haut: 300 });
t(`garçon : le petit détail de la sacoche (lanterne dorée) est visible, aussi en mode sans visage (${await diff(sacV1, sacV2)} pixels de plus qu'avant)`, (await diff(sacV1, sacV2)) > 100);
const hV2 = await cadre({ genre: 'fille', cam: 'tete', sv: 1, incl: 0, larg: 300, haut: 300 }), hV1 = await cadre({ genre: 'fille', v2: false, cam: 'tete', sv: 1, larg: 300, haut: 300 });
t(`fille : la finition du voile (perles dorées) est visible, aussi en mode sans visage (${await diff(hV1, hV2)} pixels de plus qu'avant)`, (await diff(hV1, hV2)) > 100);
await nav.close();
// --- originaux intacts, rien d'intégré
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
t('Original conservé : voyage/js/voyageur.js existe toujours et exporte la classe Voyageur', fs.existsSync(path.join(R, 'voyage/js/voyageur.js')) && /export class Voyageur \{/.test(lire('voyage/js/voyageur.js')));
t('Version de test : outils/personnages/voyageur-v2.js (copie séparée)', /export class VoyageurV2/.test(lire('outils/personnages/voyageur-v2.js')));
const integre = []; (function parcourir(d) { for (const e of fs.readdirSync(path.join(R, d), { withFileTypes: true })) { const rel = path.posix.join(d, e.name); if (e.isDirectory()) { if (!/^(\.git|node_modules|dist|docs|_documentation)$/.test(e.name) && rel !== 'outils/personnages' && rel !== 'outils/tests') parcourir(rel); } else if (/\.(js|mjs|html)$/.test(e.name) && /voyageur-v2/.test(lire(rel))) integre.push(rel); } })('.');
t('Rien n\'est branché sur le site ni sur les jeux (aucune page ni aucun jeu n\'importe voyageur-v2)', integre.length === 0, integre.join(', '));
for (const f of ['personnages3d/modeles/fille_N1.glb', 'personnages3d/modeles/garcon_N1.glb', 'monde/socle/ouverture.js', 'monde/socle/prototypes/portail-porte-animee.js']) t('Fichier original conservé : ' + f, fs.existsSync(path.join(R, f)));
t('Aucune erreur JavaScript pendant tout le parcours', erreurs.length === 0, erreurs.slice(0, 3).join(' || '));
console.log(res.join('\n') + `\n\n${ok} vérifications réussies, ${ko} en échec.`); process.exit(ko ? 1 : 0);
