// Restauration et sessions_etat : une restauration ne doit JAMAIS faire redescendre ni libérer une version de révocation.
// (base mémoire : aucun chiffrement ni outil externe ; le même scénario sur le module Firestore est dans sessions-etat-firestore.test.mjs)
import test from 'node:test'; import assert from 'node:assert/strict';
import { baseMemoire } from '../../serveur/base-memoire.js';
import { COLLECTIONS, exporter, importer, comparer, invaliderSessions } from '../sauvegarde/restauration.mjs';

const T = Date.UTC(2026, 10, 28, 12);

test('sessions_etat fait partie des collections sauvegardées, et l\'export le contient', async () => {
  assert.ok(COLLECTIONS.includes('sessions_etat'));
  const b = baseMemoire(); await b.ecrire('familles', 'u1', { email: 'a@b.fr' }); await b.ecrire('sessions_etat', 'u1', { version: 4, revoqueLe: 9 });
  const e = await exporter(b); assert.deepEqual(e.collections.sessions_etat, { u1: { version: 4, revoqueLe: 9 } }); assert.equal(e.compte.sessions_etat, 1);
});

test('import normal : refusé si la base contient déjà une version (même sans autre donnée) ; accepté sur base vide ; identique après coup', async () => {
  const src = baseMemoire(); await src.ecrire('familles', 'u1', { email: 'a@b.fr' }); await src.ecrire('sessions_etat', 'u1', { version: 4, revoqueLe: 9 });
  const e = JSON.parse(JSON.stringify(await exporter(src)));
  const avecVersion = baseMemoire(); await avecVersion.ecrire('sessions_etat', 'u9', { version: 7 });
  await assert.rejects(importer(avecVersion, e), /non vide \(sessions_etat\)/);
  assert.deepEqual(await avecVersion.lire('sessions_etat', 'u9'), { version: 7 }, 'rien n\'a été écrit');
  const vide = baseMemoire(); await importer(vide, e); assert.deepEqual(comparer(e, await exporter(vide)), []);
});

test('import forcé : garde toujours la version la plus HAUTE, ne touche pas aux comptes absents de la sauvegarde, copie telle quelle une version illisible (compte verrouillé, jamais libéré)', async () => {
  const b = baseMemoire();
  await b.ecrire('sessions_etat', 'haut', { version: 10 }); await b.ecrire('sessions_etat', 'bas', { version: 1 }); await b.ecrire('sessions_etat', 'seul', { version: 5 });
  const sauvegarde = { format: 'ldn-export-1', date: 'x', compte: {}, collections: { sessions_etat: { haut: { version: 3 }, bas: { version: 6, revoqueLe: 1 }, nouveau: { version: 2 }, casse: { version: 'abc' } } } };
  await importer(b, sauvegarde, { forcer: true });
  assert.equal((await b.lire('sessions_etat', 'haut')).version, 10, 'la sauvegarde plus ancienne ne fait pas redescendre');
  assert.equal((await b.lire('sessions_etat', 'bas')).version, 6, 'la sauvegarde plus récente monte');
  assert.equal((await b.lire('sessions_etat', 'seul')).version, 5, 'compte absent de la sauvegarde : intact');
  assert.equal((await b.lire('sessions_etat', 'nouveau')).version, 2);
  assert.equal((await b.lire('sessions_etat', 'casse')).version, 'abc', 'version illisible copiée telle quelle : la session reste refusée par l\'API (fail-closed)');
  // une version illisible dans la sauvegarde ne remplace pas une version valable existante
  await b.ecrire('sessions_etat', 'valide', { version: 4 });
  await importer(b, { ...sauvegarde, collections: { sessions_etat: { valide: { version: 'abc' } } } }, { forcer: true });
  assert.equal((await b.lire('sessions_etat', 'valide')).version, 4);
});

test('sauvegarde d\'avant sessions_etat (ancien format) : l\'import ne supprime ni ne réinitialise aucune version existante', async () => {
  const b = baseMemoire(); await b.ecrire('sessions_etat', 'u1', { version: 8 });
  await importer(b, { format: 'ldn-export-1', date: 'x', compte: { familles: 1 }, collections: { familles: { u1: { email: 'a@b.fr' } } } }, { forcer: true });
  assert.deepEqual(await b.lire('sessions_etat', 'u1'), { version: 8 });
  assert.equal(await b.compter('sessions_etat'), 1);
});

test('invaliderSessions : tous les comptes (familles + versions existantes) passent au-dessus de l\'instant présent ; rien ne redescend ; rejouable', async () => {
  const b = baseMemoire();
  await b.ecrire('familles', 'u1', { email: 'a@b.fr' }); await b.ecrire('familles', 'u2', { email: 'b@b.fr' });
  await b.ecrire('sessions_etat', 'u1', { version: 3 }); await b.ecrire('sessions_etat', 'orphelin', { version: 1 }); await b.ecrire('sessions_etat', 'deja-haut', { version: T * 2 });
  assert.equal(await invaliderSessions(b, { maintenant: T }), 4);
  for (const u of ['u1', 'u2', 'orphelin']) assert.equal((await b.lire('sessions_etat', u)).version, T, u);
  assert.equal((await b.lire('sessions_etat', 'deja-haut')).version, T * 2 + 1);
  assert.equal((await b.lire('sessions_etat', 'u1')).cause, 'restauration');
  await invaliderSessions(b, { maintenant: T });           // rejoué à la même seconde : +1, jamais en arrière
  assert.equal((await b.lire('sessions_etat', 'u1')).version, T + 1);
});

test('import forcé : un document actuel illisible (compte verrouillé) n\'est pas libéré par une version valable de la sauvegarde', async () => {
  const b = baseMemoire(); await b.ecrire('sessions_etat', 'verrouille', { version: 'abc' });
  await importer(b, { format: 'ldn-export-1', date: 'x', compte: {}, collections: { sessions_etat: { verrouille: { version: 1 } } } }, { forcer: true });
  assert.equal((await b.lire('sessions_etat', 'verrouille')).version, 'abc');
});

test('ligne de commande : l\'outil démarre vraiment (garde « fichier exécuté directement » correcte sous Windows) et affiche l\'usage', async () => {
  const { spawnSync } = await import('child_process'); const chemin = new URL('../sauvegarde/restauration.mjs', import.meta.url);
  const r = spawnSync(process.execPath, [chemin.pathname.replace(/^\/([A-Za-z]:)/, '$1')], { encoding: 'utf8', env: { ...process.env, FIREBASE_PROJET: '', FIREBASE_COMPTE_SERVICE_FICHIER: '' } });
  assert.equal(r.status, 2, r.stderr); assert.match(r.stderr, /invalider-sessions/);
});
