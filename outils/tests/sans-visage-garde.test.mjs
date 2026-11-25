// Garde-fous du MODE SANS VISAGE (sans navigateur) : tout visage ajouté plus tard doit être déclaré, sinon ce test échoue.
//   node --test outils/tests/sans-visage-garde.test.mjs
// Règles pour un futur personnage : pièces 3D de visage avec l'option « v: 1 » (formes.js), groupes SVG de visage avec la classe « sv-visage »,
// modèles GLB : méthode sansVisage(actif) ; chaque page HTML charge monde/socle/sans-visage.js.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const compte = (f, re) => (lire(f).match(re) || []).length;

test('3D : les pièces de visage de chaque personnage et animal sont étiquetées (v: 1)', () => {
  const MIN = { 'voyage/js/voyageur.js': 6, 'voyage/js/personnages.js': 9, 'voyage/js/montures.js': 5, 'voyage/js/animaux.js': 3, 'voyage/js/faucon.js': 1 };
  for (const [f, n] of Object.entries(MIN)) assert.ok(compte(f, /\bv: 1\b/g) >= n, `${f} : au moins ${n} lignes de pièces de visage étiquetées (v: 1)`);
});
test('3D : aucune petite sphère sombre (œil, nez) non étiquetée dans le dossier voyage/js', () => {
  const oublis = [];
  for (const f of fs.readdirSync(path.join(R, 'voyage/js')).filter(f => f.endsWith('.js') && !f.endsWith('.test.js'))) {
    lire('voyage/js/' + f).split('\n').forEach((l, i) => {
      // sphère de rayon < 0,07 en couleur très sombre (tous les canaux sous 0x50) : c'est un œil ou un nez
      for (const m of l.matchAll(/piece\((?:SPH|S)\(0\.0[0-6]\d*[^)]*\),\s*(?:'#([0-9a-f]{6})'|(NOIR))\s*,\s*\{([^}]*)\}/g)) {
        const sombre = m[2] || [0, 2, 4].every(k => parseInt(m[1].slice(k, k + 2), 16) < 0x50);
        const arriere = /p:\s*\[[^\],]*,[^\],]*,\s*-/.test(m[3]);      // placée à l'arrière (bout de queue) : pas un visage
        if (sombre && !arriere && !/\bv: 1\b/.test(m[3])) oublis.push(`${f}:${i + 1}`);
      }
    });
  }
  assert.deepEqual(oublis, [], 'pièces sombres sans « v: 1 » (œil ou nez ? étiquetez-les, ou changez la couleur) : ' + oublis.join(', '));
});
test('formes.js : l\'attribut « visage » existe et le matériau écarte ces pièces', () => {
  const s = lire('voyage/js/formes.js');
  assert.match(s, /setAttribute\('visage'/); assert.match(s, /uSansVisage/); assert.match(s, /discard/);
  assert.match(s, /export const sansVisage/);
});
test('SVG : les mascottes et visages dessinés déclarent leurs traits (classe sv-visage)', () => {
  for (const [f, n] of [['monde/mascottes.js', 2], ['ablutions/index.html', 2], ['priere/app.js', 1], ['monde/socle/peaux.js', 1]]) assert.ok(compte(f, /sv-visage/g) >= n, `${f} : ${n} groupe(s) de visage attendu(s)`);
  for (const f of ['monde/mascottes.js', 'ablutions/index.html']) { const s = lire(f); assert.ok(s.indexOf('class="sv-visage"') < s.indexOf('fill="#173a5e"'), `${f} : les yeux de Nour sont dans le groupe sv-visage`); }
});
test('GLB : l\'adaptateur sait masquer yeux, formes et traits peints', () => {
  const s = lire('personnages3d/personnage-glb.js'); assert.match(s, /sansVisage\(actif\)/); assert.match(s, /abonnerObjet/); assert.match(s, /sourcils_etonne/);
});
test('Chaque page publique charge le mode sans visage, tôt dans le <head>', () => {
  const pages = []; (function parcourir(d) { for (const e of fs.readdirSync(path.join(R, d), { withFileTypes: true })) {
    const rel = path.posix.join(d, e.name); if (e.isDirectory()) { if (!/^(\.git|node_modules|dist|outils|docs|admin|serveur|functions|audio|_documentation|tests)$/.test(e.name)) parcourir(rel); } else if (e.name.endsWith('.html') && rel !== '404.html') pages.push(rel); } })('.');
  assert.ok(pages.length >= 14, 'pages trouvées : ' + pages.length);
  for (const p of pages) { const s = lire(p); assert.match(s, /monde\/socle\/sans-visage\.js\?v=1/, p + ' ne charge pas sans-visage.js'); assert.ok(s.indexOf('sans-visage.js') < s.indexOf('</head>'), p + ' : le script doit être dans le <head>'); }
});
test('Réglage : le texte des parents est exact et le stockage est global (famille, pas profil)', () => {
  const src = lire('monde/socle/sans-visage.js'), lit = /var TEXTE_PARENTS = ('(?:[^'\\]|\\.)*');/.exec(src);
  assert.ok(lit, 'TEXTE_PARENTS introuvable');
  const TEXTE = 'Au sein de la communauté musulmane, il existe différentes opinions et interprétations concernant la représentation des êtres vivants et des visages. Les Lanternes de Nour souhaite respecter ces différents avis et permettre à chaque famille de profiter de son univers éducatif selon l\'avis religieux qu\'elle suit. C\'est pourquoi nous proposons un mode sans visage facultatif.';
  assert.equal(new Function('return ' + lit[1])(), TEXTE, 'texte des parents différent de celui demandé');
  assert.match(lire('serveur/api.js'), /\/api\/famille\/preferences/);
  assert.doesNotMatch(lire('serveur/api.js').split('/api/famille/preferences')[1].split('// -----')[0], /enfants/, 'la préférence est celle de la famille, jamais d\'un profil enfant');
});
test('Accueil : la bannière d\'origine est conservée, le village sans personnage est l\'alternative', () => {
  const s = lire('index.html'); assert.match(s, /<picture class="sv-avec">[\s\S]*banniere-1280\.webp[\s\S]*<\/picture>/); assert.match(s, /<picture class="sv-sans">[\s\S]*village\.webp/);
  for (const f of ['accueil/banniere-1280.webp', 'accueil/banniere-2172.webp', 'accueil/banniere-mobile-780.webp', 'accueil/banniere-mobile-1122.webp', 'accueil/village.webp']) assert.ok(fs.existsSync(path.join(R, f)), f + ' conservé');
});
test('Aucun original supprimé : modèles GLB, prototypes et anciennes versions toujours présents', () => {
  for (const f of ['personnages3d/modeles/fille_N1.glb', 'personnages3d/modeles/garcon_N1.glb', 'monde/socle/ouverture.js', 'monde/socle/prototypes/portail-porte-animee.js', 'voyage/js/voyageur.js', 'personnages3d/personnage-glb.js']) assert.ok(fs.existsSync(path.join(R, f)), f);
});
