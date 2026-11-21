// Fabrique : nouveau personnage, ou ancien (secours) si échec, délai, WebGL absent, interrupteur coupé, ?perso=ancien.
const test = require('node:test'); const assert = require('node:assert/strict'); const fs = require('node:fs'); const path = require('node:path');
const MODELES = path.resolve(__dirname, 'modeles');
const lire = async (url) => { const f = fs.readFileSync(path.join(MODELES, path.basename(url))); return f.buffer.slice(f.byteOffset, f.byteOffset + f.byteLength); };
const F = () => import('./fabrique.js');
test("modèle chargé une seule fois par genre ; un échec n'est pas gardé en mémoire", async () => {
  const { chargerModele, viderCache } = await F(); viderCache(); let lectures = 0;
  const l = async u => { lectures++; return lire(u); };
  const [a, b] = await Promise.all([chargerModele('fille', { lire: l }), chargerModele('fille', { lire: l })]); assert.equal(a, b); assert.equal(lectures, 1);
  await chargerModele('garcon', { lire: l }); assert.equal(lectures, 2); viderCache();
  await assert.rejects(chargerModele('fille', { lire: async () => { throw new Error('réseau coupé'); } }), /réseau/);
  const ok = await chargerModele('fille', { lire }); assert.ok(ok.scene, 'le nouvel essai réussit');
});
test("fabrique : nouveau personnage ; secours vers l'ancien dans tous les cas prévus", async () => {
  const { creerPersonnage, viderCache } = await F(); let anciens = 0; const creerAncien = () => { anciens++; return { ancien: true }; }; viderCache();
  const n = await creerPersonnage({ genre: 'garcon', peau: 2, creerAncien, options: { lire } }); assert.equal(n.type, 'nouveau'); assert.equal(n.personnage.genre, 'garcon'); assert.equal(anciens, 0);
  for (const [nom, args] of [['?perso=ancien', { parametre: 'ancien' }], ['interrupteur coupé', { interrupteur: false }], ['WebGL absent', { webgl: false }]]) {
    const r = await creerPersonnage({ genre: 'fille', creerAncien, options: { lire }, ...args }); assert.equal(r.type, 'ancien', nom); }
  assert.equal(anciens, 3);
  viderCache(); const ko = await creerPersonnage({ genre: 'fille', creerAncien, options: { lire: async () => { throw new Error('404'); } } }); assert.equal(ko.type, 'ancien'); assert.match(ko.raison, /404/);
  viderCache(); const lent = await creerPersonnage({ genre: 'fille', creerAncien, delaiMs: 30, options: { lire: () => new Promise(r => setTimeout(async () => r(await lire('fille_N1.glb')), 400)) } }); assert.equal(lent.type, 'ancien'); assert.match(lent.raison, /délai/);
  viderCache(); const casse = await creerPersonnage({ genre: 'fille', creerAncien, options: { lire: async () => new ArrayBuffer(16) } }); assert.equal(casse.type, 'ancien', 'fichier corrompu : secours');
});
