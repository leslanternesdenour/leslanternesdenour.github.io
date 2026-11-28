// sessions_etat avec le VRAI module serveur/base-firestore.js (requêtes REST réelles construites par le module), contre le SIMULATEUR REST
// outils/tests/firestore-simule.mjs (pas l'émulateur officiel : Java absent sur ce poste ; les mêmes scénarios sont rejoués contre l'émulateur
// officiel par base-firestore-emulateur.test.mjs quand il est disponible). node --test outils/tests/sessions-etat-firestore.test.mjs
import test from 'node:test'; import assert from 'node:assert/strict';
import { baseFirestore } from '../../serveur/base-firestore.js';
import { baseMemoire } from '../../serveur/base-memoire.js';
import { traiter, versionSessionAttendue } from '../../serveur/api.js';
import { creerSession } from '../../serveur/session.js';
import { exporter, importer, comparer, invaliderSessions } from '../sauvegarde/restauration.mjs';
import { firestoreSimule } from './firestore-simule.mjs';

const O = 'https://preprod.exemple', CREATEUR = 'uid-createur', SECRET = 'secret-de-test-tres-long-0123456789abcdef';
const env = { CREATOR_UID: CREATEUR, SESSION_SECRET: SECRET, FIREBASE_PROJET: 'demo-simule' };
const nouvelle = (projet = 'demo-simule', opts) => { const sim = firestoreSimule({ projet, ...opts }); return { sim, base: baseFirestore({ projet, compte: {}, fetcher: sim.fetcher, jeton: async () => 'owner' }) }; };
const maintenant = Date.UTC(2026, 10, 28, 12);
const ctx = base => ({ env, base, maintenant, auth: {}, stockage: { get: async () => null }, stripe: null });
const cookie = async (uid, { version = 0, role } = {}) => 'ldn_session=' + await creerSession({ uid, email: uid + '@exemple.fr', emailVerifie: true, role, authTime: Math.floor(maintenant / 1000) - 60, version }, SECRET, maintenant);
async function appel(base, m, chemin, { c, corps } = {}) {
  const r = await traiter(new Request(O + chemin, { method: m, headers: { ...(m !== 'GET' ? { 'X-LDN': '1', Origin: O } : {}), ...(c ? { Cookie: c } : {}) }, body: corps === undefined ? undefined : JSON.stringify(corps) }), ctx(base));
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch (e) { j = t; } return { s: r.status, j, h: r.headers };
}
const moiConnecte = async (base, c) => (await appel(base, 'GET', '/api/moi', { c })).j.connecte;

test('incrementer : même résultat que la base mémoire de référence (document absent, existant, champ non numérique, champs conservés)', async () => {
  const { base: fs } = nouvelle(), mem = baseMemoire();
  async function scenario(b) {
    const out = [];
    out.push(await b.incrementer('sessions_etat', 'u1', 'version', { revoqueLe: 111 }));
    out.push(await b.incrementer('sessions_etat', 'u1', 'version', { revoqueLe: 222 }));
    out.push(await b.lire('sessions_etat', 'u1'));
    await b.ecrire('sessions_etat', 'u2', { version: 'abc', note: 'garde-moi' });          // champ non numérique : repart de 1, les autres champs sont conservés
    out.push(await b.incrementer('sessions_etat', 'u2', 'version', { revoqueLe: 5 }), await b.lire('sessions_etat', 'u2'));
    await b.ecrire('sessions_etat', 'u3', { version: 41 }); out.push(await b.incrementer('sessions_etat', 'u3', 'version', { revoqueLe: 7 }));
    out.push(await b.lire('sessions_etat', 'absent'), await b.compter('sessions_etat'));
    return out;
  }
  assert.deepEqual(await scenario(fs), await scenario(mem));
});

test('incrementer : une seule écriture atomique (transformation « increment »), masque limité aux champs extra, jamais de lecture préalable', async () => {
  const { base, sim } = nouvelle();
  assert.equal(await base.incrementer('sessions_etat', 'u1', 'version', { revoqueLe: 123 }), 1);
  assert.equal(sim.requetes.length, 1, 'un seul appel réseau (pas de lecture puis écriture)');
  const r = sim.requetes[0]; assert.equal(r.m, 'POST'); assert.equal(r.chemin, ':commit');
  const w = r.corps.writes[0];
  assert.deepEqual(w.updateTransforms, [{ fieldPath: '`version`', increment: { integerValue: '1' } }]);
  assert.deepEqual(w.updateMask.fieldPaths, ['`revoqueLe`'], 'le champ version n\'est pas écrasé par l\'écriture : il est seulement incrémenté');
  assert.ok(!('version' in w.update.fields)); assert.match(w.update.name, /documents\/sessions_etat\/u1$/);
  await assert.rejects(base.incrementer('sessions_etat', 'a/b', 'version'), /identifiant/);
  await assert.rejects(baseFirestore({ projet: 'p', compte: {}, jeton: async () => 't', fetcher: async () => new Response('{}') }).incrementer('sessions_etat', 'u', 'version'), /illisible/, 'réponse sans résultat : erreur, jamais une valeur inventée');
  await assert.rejects(baseFirestore({ projet: 'p', compte: {}, jeton: async () => 't', fetcher: async () => new Response('{"error":{}}', { status: 503 }) }).incrementer('sessions_etat', 'u', 'version'), /Firestore 503/);
});

test('concurrence : 25 révocations simultanées donnent 25 versions DIFFÉRENTES (1..25), la version finale est 25 ; la lecture-puis-écriture, elle, perd des révocations', async () => {
  const { base } = nouvelle();
  const versions = await Promise.all(Array.from({ length: 25 }, (_, i) => base.incrementer('sessions_etat', 'u1', 'version', { revoqueLe: i })));
  assert.deepEqual([...versions].sort((a, b) => a - b), Array.from({ length: 25 }, (_, i) => i + 1));
  assert.equal((await base.lire('sessions_etat', 'u1')).version, 25);
  // contrôle : l'ancienne méthode (lire, +1, écrire) sur la même base simulée perd des révocations → c'est ce que l'incrémentation atomique évite
  const naif = nouvelle().base;
  const v2 = await Promise.all(Array.from({ length: 25 }, async () => { const v = ((await naif.lire('sessions_etat', 'u1')) || { version: 0 }).version + 1; await naif.ecrire('sessions_etat', 'u1', { version: v }); return v; }));
  assert.ok(new Set(v2).size < 25, 'la méthode naïve produit des versions en double (' + new Set(v2).size + ' distinctes sur 25)');
});

test('API sur le vrai module Firestore : révocations simultanées d\'un compte, anciens cookies refusés, version jamais en arrière', async () => {
  const { base } = nouvelle();
  await base.ecrire('familles', 'uid-x', { email: 'x@exemple.fr', consentements: { parent: 1 } });
  const adm = await cookie(CREATEUR, { role: 'creator' });
  const reps = await Promise.all(Array.from({ length: 8 }, () => appel(base, 'POST', '/api/admin/sessions/revoquer', { c: adm, corps: { uid: 'uid-x' } })));
  assert.ok(reps.every(r => r.s === 200), JSON.stringify(reps.map(r => r.s)));
  assert.deepEqual(reps.map(r => r.j.version).sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8], 'chaque révocation a sa propre version');
  assert.equal(await versionSessionAttendue(ctx(base), 'uid-x'), 8);
  assert.equal(await moiConnecte(base, await cookie('uid-x', { version: 0 })), false);
  assert.equal(await moiConnecte(base, await cookie('uid-x', { version: 7 })), false);
  assert.equal(await moiConnecte(base, await cookie('uid-x', { version: 8 })), true, 'une session ouverte après la dernière révocation est valable');
  assert.equal(await moiConnecte(base, await cookie('uid-y', { version: 0 })), true, 'les autres comptes ne sont pas touchés');
  assert.equal((await appel(base, 'POST', '/api/admin/sessions/revoquer', { c: adm, corps: { uid: 'inconnu' } })).s, 404);
  // auto-révocation : le cookie ré-émis porte la nouvelle version et reste valable ; l'ancien ne l'est plus
  const soi = await appel(base, 'POST', '/api/admin/sessions/revoquer', { c: adm, corps: {} });
  assert.equal(soi.j.version, 1); const neuf = soi.h.get('Set-Cookie').split(';')[0];
  assert.equal((await appel(base, 'GET', '/api/admin/resume', { c: adm })).s, 401); assert.equal((await appel(base, 'GET', '/api/admin/resume', { c: neuf })).s, 200);
});

test('API sur le vrai module Firestore : document sessions_etat illisible = session refusée (fail-closed), absent = valable ; sauvegarde incluse', async () => {
  const { base } = nouvelle(); const bruit = console.error; console.error = () => {};
  try {
    await base.ecrire('sessions_etat', 'uid-a', { version: 'abc' }); await base.ecrire('sessions_etat', 'uid-b', { version: -1 }); await base.ecrire('sessions_etat', 'uid-c', { version: 2.5 });
    for (const u of ['uid-a', 'uid-b', 'uid-c']) assert.equal(await moiConnecte(base, await cookie(u)), false, u);
  } finally { console.error = bruit; }
  assert.equal(await moiConnecte(base, await cookie('uid-jamais-revoque')), true);
  const e = await exporter(base); assert.equal(e.compte.sessions_etat, 3, 'sessions_etat fait partie de la sauvegarde');
});

test('restauration sur le vrai module Firestore : export → import (base vide) identique ; jamais de version en arrière ; sessions invalidées après coup', async () => {
  const src = nouvelle('demo-simule-source').base;
  await src.ecrire('familles', 'uid-r', { email: 'r@exemple.fr' }); await src.ecrire('familles', 'uid-s', { email: 's@exemple.fr' });
  await src.incrementer('sessions_etat', 'uid-r', 'version', { revoqueLe: 1 }); await src.incrementer('sessions_etat', 'uid-r', 'version', { revoqueLe: 2 });   // version 2 au moment de la sauvegarde
  const sauvegarde = JSON.parse(JSON.stringify(await exporter(src)));
  assert.deepEqual(sauvegarde.collections.sessions_etat['uid-r'], { version: 2, revoqueLe: 2 });
  await src.incrementer('sessions_etat', 'uid-r', 'version', { revoqueLe: 3 }); await src.incrementer('sessions_etat', 'uid-s', 'version', { revoqueLe: 3 });   // révocations POSTÉRIEURES à la sauvegarde

  // 1. import forcé par-dessus la base vivante : la sauvegarde (version 2) NE FAIT PAS redescendre la version actuelle (3), uid-s (absent de la sauvegarde) n'est pas touché
  await importer(src, sauvegarde, { forcer: true });
  assert.equal((await src.lire('sessions_etat', 'uid-r')).version, 3, 'jamais de retour en arrière');
  assert.equal((await src.lire('sessions_etat', 'uid-s')).version, 1);
  // 2. import normal : refusé tant que la base contient des versions (sessions_etat compte comme « non vide »)
  await assert.rejects(importer(src, sauvegarde), /non vide \(.*\)/);
  // 3. import dans une base vide : identique document par document, y compris sessions_etat
  const cible = nouvelle('demo-simule-cible').base;
  await importer(cible, sauvegarde); assert.deepEqual(comparer(sauvegarde, await exporter(cible)), []);
  // 4. après la restauration, toutes les sessions antérieures sont invalidées, même celles émises APRÈS la sauvegarde (version 3 ici, perdue par la sauvegarde)
  const anciens = [await cookie('uid-r', { version: 3 }), await cookie('uid-r', { version: 2 }), await cookie('uid-s', { version: 1 }), await cookie('uid-s', { version: 0 })];
  assert.equal(await moiConnecte(cible, anciens[0]), true, 'avant l\'invalidation, le cookie de version 3 serait accepté par la base restaurée (version 2) : c\'est le danger');
  assert.equal(await invaliderSessions(cible, { maintenant }), 2);
  for (const c of anciens) assert.equal(await moiConnecte(cible, c), false, 'ancien cookie refusé après restauration');
  const v = await versionSessionAttendue(ctx(cible), 'uid-r'); assert.ok(v >= maintenant, 'plancher = instant de la restauration');
  assert.equal(await moiConnecte(cible, await cookie('uid-r', { version: v })), true, 'une nouvelle connexion fonctionne');
  const adm = await cookie(CREATEUR, { role: 'creator' });
  assert.equal((await appel(cible, 'POST', '/api/admin/sessions/revoquer', { c: adm, corps: { uid: 'uid-r' } })).j.version, v + 1, 'les révocations suivantes continuent de +1');
  // invaliderSessions n'abaisse jamais une version déjà plus haute que l'instant présent
  await cible.ecrire('sessions_etat', 'uid-s', { version: maintenant * 2 });
  await invaliderSessions(cible, { maintenant }); assert.equal((await cible.lire('sessions_etat', 'uid-s')).version, maintenant * 2 + 1);
});

test('révocation par l\'API : un document sessions_etat illisible n\'est JAMAIS remplacé par une valeur basse (409, document intact) ; une fois corrigé à la main, la révocation reprend', async () => {
  const { base } = nouvelle(); await base.ecrire('familles', 'uid-z', { email: 'z@exemple.fr' });
  const adm = await cookie(CREATEUR, { role: 'creator' }); const bruit = console.error; console.error = () => {};
  try {
    for (const mauvais of ['abc', -1, 2.5, null]) {
      await base.ecrire('sessions_etat', 'uid-z', { version: mauvais, note: 'x' });
      const r = await appel(base, 'POST', '/api/admin/sessions/revoquer', { c: adm, corps: { uid: 'uid-z' } });
      assert.equal(r.s, 409, JSON.stringify(mauvais)); assert.equal(r.j.erreur, 'etat-sessions-illisible');
      assert.equal((await base.lire('sessions_etat', 'uid-z')).version, mauvais, 'le document n\'a pas été touché');
    }
  } finally { console.error = bruit; }
  await base.ecrire('sessions_etat', 'uid-z', { version: 12 });                 // correction manuelle dans la console
  assert.equal((await appel(base, 'POST', '/api/admin/sessions/revoquer', { c: adm, corps: { uid: 'uid-z' } })).j.version, 13);
});
