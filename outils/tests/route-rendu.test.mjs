// La Route : le rendu 3D (non exécutable sans navigateur) respecte le budget et l'isolation prévus.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const lire = f => fs.readFileSync(new URL('../../voyage/js/route/' + f, import.meta.url), 'utf8');

test('monde : terrain par tuiles, une tuile par image au plus, géométries libérées, décor en instances partagées', () => {
  const m = lire('monde.js');
  assert.match(m, /export function creerMondeRoute\(/);
  assert.match(m, /TUILES_PAR_IMAGE = 1\b/, 'budget : une tuile par image');
  assert.match(m, /\.dispose\(\)/, 'les tuiles hors de portée sont libérées');
  assert.match(m, /InstancedMesh/, 'décor en instances');
  assert.match(m, /materiauSol/, 'même sol que le village');
  assert.ok(!/from '\.\.\/decor\.js/.test(m) && !/from '\.\.\/aventure\.js/.test(m), 'la Route ne dépend pas des systèmes du village');
});

test('lieux 3D : chaque lieu des données a son modèle, les objets de mission ont leur repère doré, aucune dépendance au village', async () => {
  const { LIEUX_ROUTE } = await import('../../voyage/js/route/donnees.js');
  const l = lire('lieux-3d.js');
  assert.match(l, /export function creerLieux3D\(/);
  for (const lieu of LIEUX_ROUTE) assert.ok(l.includes(`'${lieu.id}'`) || l.includes(`lieux.${lieu.id} =`) || (lieu.type === 'trace' && l.includes("o.type === 'trace'")) || (lieu.id.startsWith('objet') && l.includes("['objet1'")) , `pas de modèle 3D pour ${lieu.id}`);
  assert.match(l, /gemme\(/, 'repère doré pour ce qui reste à trouver');
  assert.ok(!/from '\.\.\/(decor|aventure|quetes)\.js/.test(l));
  assert.ok(!/(kaaba|qibla|zamzam)/i.test(l));
});

test('jeu : la Route n\'écrit que dans etat.route, réutilise la bourse existante, ne touche ni au réseau ni au stockage', () => {
  const j = lire('jeu-route.js').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
  assert.match(j, /export function creerRoute\(/);
  assert.ok(!/\betat\.(?!route\b|guidage\b)\w+\s*=[^=]/.test(j), 'écriture dans une autre clé de etat');
  assert.ok(!/\bAV\.(?!montures\b)\w+\s*=[^=]/.test(j), 'écriture dans la progression existante (sauf l\'ajout du dromadaire offert)');
  assert.ok(!/localStorage|sessionStorage|fetch\(|indexedDB/.test(j), 'pas de stockage ni de réseau propres');
  for (const m of j.matchAll(/recompense\(\s*'([^']+)/g)) assert.ok(m[1].startsWith('route:'), `identifiant de récompense non préfixé : ${m[1]}`);
  assert.match(j, /donner\(/);
});

test('village : le relais du guide, le panneau et l\'éboulis du seuil (barrière qui s\'ouvre comme celles du wadi et des rochers)', async () => {
  const v = lire('village-route.js');
  assert.match(v, /export function creerVillageRoute\(/);
  assert.match(v, /ouvrir\(\)/, 'la barrière a la même forme que decor.barrieres');
  assert.match(v, /RELAIS/);
  const { RELAIS_VILLAGE, SEUIL_VILLAGE } = await import('../../voyage/js/route/donnees.js');
  assert.ok(Math.hypot(RELAIS_VILLAGE.x, RELAIS_VILLAGE.z) > 50, 'le relais est hors du village, rien n\'est construit derrière les maisons');
  assert.ok(SEUIL_VILLAGE.x > RELAIS_VILLAGE.x + 250, 'le seuil est loin du relais : il faut marcher');
});

test('performance : la densité du décor suit le profil graphique (mobile = moins d\'objets), le rayon aussi', () => {
  const m = lire('monde.js');
  assert.match(m, /Q\.densiteDeco/, 'le décor dépend du profil (faible 0,5 · équilibré 0,8 · élevé 1)');
  assert.match(m, /Q\.leger \? 3/, 'rayon de chargement réduit sur appareil léger');
});
