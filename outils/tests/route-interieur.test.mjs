// L'intérieur d'une maison : une pièce où l'on entre par la porte, avec deux objets à observer et une sortie.
import test from 'node:test';
import assert from 'node:assert/strict';

const RAYON_ENFANT = 0.45;
const libre = (x, z, cols) => cols.every(c => Math.hypot(x - c.x, z - c.z) > c.r + RAYON_ENFANT);
const chemin = (a, b, cols) => { for (let k = 0; k <= 30; k++) if (!libre(a.x + (b.x - a.x) * k / 30, a.z + (b.z - a.z) * k / 30, cols)) return false; return true; };

test('intérieur : de la porte on atteint les deux objets et la sortie sans traverser un mur ; les murs bloquent ; on sort par la porte', async () => {
  const { planInterieur } = await import('../../voyage/js/route/interieur-plan.js');
  const p = planInterieur(100, 200), cols = p.colliders;
  assert.ok(libre(p.entree.x, p.entree.z, cols), 'l\'entrée est libre');
  assert.equal(p.objets.length, 2);
  for (const o of p.objets) { assert.ok(libre(o.poseX, o.poseZ, cols), 'on peut se tenir devant l\'objet'); assert.ok(chemin(p.entree, { x: o.poseX, z: o.poseZ }, cols), 'chemin libre vers l\'objet'); }
  assert.ok(chemin(p.entree, p.sortie, cols), 'chemin libre vers la sortie');
  assert.ok(chemin(p.sortie, p.dehors, cols), 'la porte est franchissable : on passe de la sortie au dehors');
  for (const m of [p.mur.fond, p.mur.gauche, p.mur.droit, p.mur.facade]) assert.ok(!libre(m.x, m.z, cols), 'un mur bloque');
  assert.ok(p.dedans(p.entree.x, p.entree.z) && !p.dedans(p.dehors.x, p.dehors.z) && !p.dedans(p.mur.gauche.x - 3, p.mur.gauche.z), 'dedans / dehors');
});

test('intérieurs : chaque maison à porte a deux objets à observer, un texte court (3–5 ans) et un texte plus riche (6–10 ans), sobres et sans religion', async () => {
  const { FAITS_INTERIEURS } = await import('../../voyage/js/route/textes-route.js');
  const { GABARITS_AVEC_PORTE } = await import('../../voyage/js/route/ville-plan.js');
  assert.deepEqual(Object.keys(FAITS_INTERIEURS).map(Number), GABARITS_AVEC_PORTE);
  for (const [g, f] of Object.entries(FAITS_INTERIEURS)) {
    assert.ok(f.titre && f.icone, `${g} : titre et icône`); assert.equal(f.objets.length, 2);
    for (const o of f.objets) {
      assert.ok(o.nom && o.icone && o.label && o.forme, `${g} : nom, icône, libellé et forme 3D`);
      assert.ok(o.petit.length > 20 && o.petit.length <= 110 && o.grand.length > 60 && o.grand.length <= 330, `${g} ${o.nom} : longueurs`);
      assert.ok(!/(allah|coran|kaaba|zamzam|proph|hadith|prière|mecque|dieu)/i.test(o.petit + o.grand), `${g} ${o.nom} : rien de religieux`);
    }
  }
});

test('intérieurs 3D : la pièce est dessinée avec le même plan, posée sur le plateau, et chaque objet des textes a sa forme 3D', async () => {
  const fs = await import('node:fs');
  const { FAITS_INTERIEURS } = await import('../../voyage/js/route/textes-route.js');
  const s = fs.readFileSync(new URL('../../voyage/js/route/interieur-3d.js', import.meta.url), 'utf8');
  assert.match(s, /export function creerInterieur3D/); assert.match(s, /planInterieur\(/); assert.match(s, /PLATEAU_INTERIEURS/); assert.match(s, /export const FORMES/);
  const formes = new Set(Object.values(FAITS_INTERIEURS).flatMap(f => f.objets.map(o => o.forme)));
  for (const f of formes) assert.match(s, new RegExp(`  ${f}: \\(\\) =>`), `forme 3D manquante : ${f}`);
  assert.match(s, /visible = false/, 'la pièce est invisible tant qu\'on n\'y est pas');
});

test('intérieurs : on entre par la porte, on observe les deux objets (voix de l\'habitant), on sort par la porte ; la sauvegarde ramène devant la porte ; mission « Dans les maisons »', async () => {
  const fs = await import('node:fs');
  const { MISSIONS_ROUTE } = await import('../../voyage/js/route/donnees.js');
  const j = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  assert.match(j, /creerInterieur3D\(/); assert.match(j, /FAITS_INTERIEURS\[/);
  assert.match(j, /txt: '🚪 Entrer'/); assert.match(j, /I\.construire\(g\)/); assert.match(j, /I\.montrer\(true\)/); assert.match(j, /I\.montrer\(false\)/);
  assert.match(j, /label: 'Sortir'/); assert.match(j, /route:interieur:sortie/);
  assert.match(j, /actif: \(\) => !!dansMaison && dansMaison\.gabarit === g/, 'les objets ne répondent que dans la bonne maison');
  assert.match(j, /etape\('interieurs', 'maison:' \+ g\)/);
  assert.match(j, /memoriserPosition\(etat, dansMaison \? dansMaison\.retour : J\)/, 'enregistré devant la porte, jamais dans la pièce');
  assert.match(j, /\[fixes, monde\.colliders, V\.colliders, I\.colliders\]/, 'les murs et les meubles bloquent');
  assert.ok(MISSIONS_ROUTE.interieurs && MISSIONS_ROUTE.interieurs.total === 3 && MISSIONS_ROUTE.interieurs.icone === '🏡');
});

test('intérieurs : la limite de fin de la première tranche ne rabat pas l\'enfant hors de la pièce', async () => {
  const fs = await import('node:fs');
  const j = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  assert.match(j, /if \(nz > sMax && !dansMaison\)/);
});

test('intérieurs : sortir deux fois de suite ou hors d\'une maison ne plante jamais', async () => {
  const fs = await import('node:fs');
  const j = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  assert.match(j, /function sortirMaison\(\) \{\s*if \(!dansMaison\) return;/);
});

test('intérieur : à l\'entrée, l\'enfant n\'est jamais sur l\'invite « Sortir » ni sur celle d\'un objet (pas de sortie accidentelle)', async () => {
  const { planInterieur } = await import('../../voyage/js/route/interieur-plan.js');
  const fs = await import('node:fs');
  const j = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  const rayonSortie = +j.match(/id: 'route:interieur:sortie'[^}]*rayon: ([0-9.]+)/)[1], rayonObjet = +j.match(/id: 'route:interieur:' \+ g \+ ':' \+ i[^}]*rayon: ([0-9.]+)/)[1];
  const p = planInterieur(0, 0);
  assert.ok(Math.hypot(p.entree.x - p.sortie.x, p.entree.z - p.sortie.z) > rayonSortie + 0.4, 'loin de la sortie');
  for (const o of p.objets) assert.ok(Math.hypot(p.entree.x - o.poseX, p.entree.z - o.poseZ) > rayonObjet + 0.4, 'loin des objets');
});

test('intérieurs : la position de retour devant la porte garde l\'angle de l\'enfant (la sauvegarde dans une maison ne plante pas)', async () => {
  const fs = await import('node:fs');
  const j = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  assert.match(j, /entrerMaison\(p\.gabarit, \{ x: p\.x, z: p\.z, a: J\.a \}\)/);
  const { memoriserPosition } = await import('../../voyage/js/route/etat-route.js');
  const etat = { route: { v: 1 } }; assert.doesNotThrow(() => memoriserPosition(etat, { x: 1, z: 2, a: 0.5 }));
});
