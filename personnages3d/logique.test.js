// Logique pure des personnages N1 (sans three.js). Un test d'abord, le code ensuite.
const test = require('node:test');
const assert = require('node:assert/strict');
const L = () => import('./logique.js');

test("la forme de tissu suit la posture de prière (soujoûd, roukoû‘, assis…)", async () => {
  const { formeTissu } = await L();
  assert.equal(formeTissu('soujoud'), 'prosterne');
  assert.equal(formeTissu('roukou'), 'penche');
  assert.equal(formeTissu('penche'), 'penche');
  for (const p of ['assis', 'tachahhoud', 'salamDroite', 'salamGauche']) assert.equal(formeTissu(p), 'assis');
  assert.equal(formeTissu('debout'), null);
});
test("le clignement : échelle des yeux écrite par le moteur → formes clignement et clignement_mi", async () => {
  const { influenceClignement } = await L();
  assert.deepEqual(influenceClignement(1), { clignement: 0, clignement_mi: 0 });
  const ferme = influenceClignement(0.15); assert.equal(ferme.clignement, 1); assert.ok(ferme.clignement_mi >= 0 && ferme.clignement_mi <= 1);
  const mi = influenceClignement(0.6); assert.ok(mi.clignement > 0 && mi.clignement < 1, 'valeur intermédiaire continue');
  assert.ok(influenceClignement(0.3).clignement > influenceClignement(0.8).clignement, 'plus fermé = plus de clignement');
  for (const s of [-1, 0, 0.15, 0.5, 1, 2]) { const r = influenceClignement(s); for (const v of Object.values(r)) assert.ok(v >= 0 && v <= 1, `borné pour ${s}`); }
});
test("lissage exponentiel (≈ 0,25 s), jamais de dépassement", async () => {
  const { lisserInfluence } = await L();
  assert.equal(lisserInfluence(0, 1, 0), 0);
  let v = 0; for (let i = 0; i < 400; i++) { v = lisserInfluence(v, 1, 1 / 60); assert.ok(v >= 0 && v <= 1); } assert.ok(v > 0.999);
  const apres025 = (() => { let x = 0; for (let i = 0; i < 15; i++) x = lisserInfluence(x, 1, 1 / 60); return x; })(); assert.ok(apres025 > 0.55 && apres025 < 0.75, 'environ 63 % après 0,25 s : ' + apres025);
  assert.equal(lisserInfluence(1, 1, 0.5), 1); assert.ok(lisserInfluence(1, 0, 10) >= 0);
  assert.ok(lisserInfluence(0, 1, 100) <= 1, 'un grand pas de temps ne dépasse pas la cible');
});
test("adresse du modèle selon le genre", async () => {
  const { urlModele } = await L();
  assert.equal(urlModele('fille'), 'fille_N1.glb'); assert.equal(urlModele('garcon'), 'garcon_N1.glb');
  assert.equal(urlModele('inconnu'), 'fille_N1.glb'); assert.equal(urlModele(undefined), 'fille_N1.glb');
});
test("décision de secours : ?perso=ancien, interrupteur coupé ou WebGL absent → ancien personnage", async () => {
  const { decisionSecours } = await L();
  assert.equal(decisionSecours({ parametre: 'ancien' }), 'ancien'); assert.equal(decisionSecours({ interrupteur: false }), 'ancien'); assert.equal(decisionSecours({ webgl: false }), 'ancien');
  assert.equal(decisionSecours({ parametre: 'nouveau' }), 'nouveau'); assert.equal(decisionSecours({}), 'nouveau');
  assert.equal(decisionSecours({ parametre: 'nouveau', interrupteur: false }), 'ancien', "l'interrupteur général reste prioritaire (arrêt d'urgence)");
});
test("création avec secours : succès, échec, délai ; l'ancien n'est créé que si nécessaire", async () => {
  const { creerAvecSecours } = await L();
  let anciens = 0; const creerAncien = () => { anciens++; return { type: 'ancien-objet' }; };
  const ok = await creerAvecSecours({ charger: async () => ({ x: 1 }), creerAncien, delaiMs: 50 }); assert.equal(ok.type, 'nouveau'); assert.deepEqual(ok.personnage, { x: 1 }); assert.equal(anciens, 0);
  const ko = await creerAvecSecours({ charger: async () => { throw new Error('404'); }, creerAncien, delaiMs: 50 }); assert.equal(ko.type, 'ancien'); assert.match(ko.raison, /404/); assert.equal(anciens, 1);
  const lent = await creerAvecSecours({ charger: () => new Promise(r => setTimeout(() => r({ x: 2 }), 300)), creerAncien, delaiMs: 40 }); assert.equal(lent.type, 'ancien'); assert.match(lent.raison, /délai/); assert.equal(anciens, 2);
  const force = await creerAvecSecours({ charger: async () => ({ x: 3 }), creerAncien, delaiMs: 50, forcer: 'ancien' }); assert.equal(force.type, 'ancien'); assert.equal(anciens, 3);
});
test("teint de l'ami : identité pour le teint d'origine, autres teints bornés, vêtements intacts", async () => {
  const { facteurTeint } = await L();
  assert.deepEqual(facteurTeint(1), [1, 1, 1]);
  for (const i of [0, 2, 3]) { const f = facteurTeint(i); assert.equal(f.length, 3); for (const c of f) assert.ok(c > 0.3 && c < 2.01, `teint ${i} : ${c}`); assert.notDeepEqual(f, [1, 1, 1]); }
  assert.deepEqual(facteurTeint(99), [1, 1, 1], 'index inconnu : teint d\'origine');
});
