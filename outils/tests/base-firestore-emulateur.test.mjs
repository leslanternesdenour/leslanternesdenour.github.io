// Le VRAI module serveur/base-firestore.js (API REST) contre l'émulateur Firestore officiel, comparé à la base mémoire de référence,
// puis la procédure de restauration (export → import dans un 2e projet vide → comparaison) et ses garde-fous.
import test from 'node:test'; import assert from 'node:assert/strict';
import { baseFirestore } from '../../serveur/base-firestore.js';
import { baseMemoire } from '../../serveur/base-memoire.js';
import { exporter, importer, comparer } from '../sauvegarde/restauration.mjs';
const H = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8089';
const fetcher = (u, o) => { assert.ok(u.startsWith('https://firestore.googleapis.com/')); return fetch(u.replace('https://firestore.googleapis.com', 'http://' + H), o); };
const nouvelle = (projet) => baseFirestore({ projet, compte: {}, fetcher, jeton: async () => 'owner' });
const vider = (projet) => fetch(`http://${H}/emulator/v1/projects/${projet}/databases/(default)/documents`, { method: 'DELETE' });

async function scenario(b) {
  const out = [];
  await b.ecrire('familles', 'u1', { email: 'a@b.fr', n: 3, x: 1.5, ok: true, nul: null, liste: [1, 'a', { z: 2 }], carte: { a: { b: 'c' } }, accent: 'é€ 🌙' });
  out.push(await b.lire('familles', 'u1')); out.push(await b.lire('familles', 'absent'));
  await b.maj('familles', 'u1', { n: 4, nouveau: 'oui' }); out.push(await b.lire('familles', 'u1'));
  await assert.rejects(b.maj('familles', 'absent', { a: 1 }));
  out.push(await b.creerSiAbsent('invitations', 'i1', { a: 1 })); out.push(await b.creerSiAbsent('invitations', 'i1', { a: 2 })); out.push(await b.lire('invitations', 'i1'));
  for (let i = 0; i < 7; i++) await b.ecrire('familles', 'u' + (i + 2), { email: i % 2 ? 'a@b.fr' : 'z@z.fr', rang: i });
  for (let i = 0; i < 3; i++) await b.ecrire('familles/u1/enfants', 'e' + i, { surnom: 'E' + i, progression: { ablutions: { g1: i } } });
  out.push(await b.compter('familles')); out.push(await b.compter('familles/u1/enfants')); out.push(await b.compter('vide'));
  const ids = []; let apres = null, pages = 0; do { const p = await b.lister('familles', { limite: 3, apres }); ids.push(...p.docs.map(d => d.id)); apres = p.suite; pages++; } while (apres); out.push(ids, pages);
  out.push((await b.chercher('familles', 'email', 'a@b.fr')).map(d => d.id).sort()); out.push((await b.lister('familles/u1/enfants', { limite: 10 })).docs.map(d => d.data.surnom));
  await b.supprimer('familles', 'u2'); await b.supprimer('familles', 'inexistant'); out.push(await b.lire('familles', 'u2'), await b.compter('familles'));
  return out;
}
test('baseFirestore (REST, émulateur officiel) se comporte exactement comme la base mémoire de référence', async () => {
  await vider('demo-ldn-ref'); assert.deepEqual(await scenario(nouvelle('demo-ldn-ref')), await scenario(baseMemoire()));
});
test('restauration : export → import dans un projet vide → comparaison identique ; garde-fous', async () => {
  const src = nouvelle('demo-ldn-ref'), cible = nouvelle('demo-ldn-restauration-test'); await vider('demo-ldn-restauration-test');
  await src.ecrire('droits', 'u1', { statut: 'abonne', niveau: 'premium', expire: 1790000000000 }); await src.ecrire('admin_logs', 'l1', { action: 'x', le: 1 });
  const e = await exporter(src); assert.ok(e.compte.familles >= 7 && e.compte['familles/u1/enfants'] === 3 && e.compte.droits === 1);
  const json = JSON.parse(JSON.stringify(e)); // passage par un fichier
  assert.equal(await importer(cible, json), Object.values(e.compte).reduce((a, b) => a + b, 0));
  assert.deepEqual(comparer(json, await exporter(cible)), [], 'base restaurée identique');
  await assert.rejects(importer(cible, json), /non vide/, 'import refusé sur une base non vide');
  await cible.supprimer('droits', 'u1'); assert.deepEqual(comparer(json, await exporter(cible)).map(d => d.type), ['manquant'], 'une perte est détectée');
  await assert.rejects(importer(cible, { format: 'autre' }), /format/);
});
