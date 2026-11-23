// Jeu 3 « Les chiffres et les nombres arabes » : chiffres ٠–٩ exacts, noms vocalisés des nombres, composition des nombres (21–99), progression réelle, audios rattachés à leur texte.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), imp = p => import(pathToFileURL(path.join(R, p)).href);
const D = await imp('ecole-arabe/chiffres/donnees/chiffres.js'), M = await imp('ecole-arabe/chiffres/moteur.js'), A = await imp('ecole-arabe/chiffres/donnees/audio.js');
const man = JSON.parse(fs.readFileSync(path.join(R, 'audio/jeux/ecole-chiffres/manifeste.json'), 'utf8')), roles = JSON.parse(fs.readFileSync(path.join(R, 'outils/voix/jeux/voix-roles.json'), 'utf8'));
test('chiffres arabes-indiens : ٠١٢٣٤٥٦٧٨٩ (U+0660–0669), écriture des nombres dans le même ordre que nos chiffres', () => {
  assert.equal(D.CHIFFRES.join(''), '٠١٢٣٤٥٦٧٨٩'); D.CHIFFRES.forEach((c, i) => assert.equal(c.codePointAt(0), 0x660 + i));
  assert.equal(D.ecrire(23), '٢٣'); assert.equal(D.ecrire(100), '١٠٠'); assert.equal(D.ecrire(1000), '١٠٠٠'); assert.equal(D.ecrire(0), '٠'); assert.equal(D.ecrire(10), '١٠');
});
test('noms des nombres : 0–20, dizaines, cent, mille ; vocalisés ; français associé', () => {
  for (const n of [...Array(21).keys(), 30, 40, 50, 60, 70, 80, 90, 100, 1000]) { assert.ok(D.NOMS[n] && /[َُِْ]/.test(D.NOMS[n]), 'vocalisé ' + n); assert.ok(D.FR[n], 'français ' + n); }
  assert.equal(D.NOMS[1], 'وَاحِد'); assert.equal(D.NOMS[3], 'ثَلَاثَة'); assert.equal(D.NOMS[10], 'عَشَرَة'); assert.equal(D.NOMS[20], 'عِشْرُون'); assert.equal(D.NOMS[100], 'مِائَة'); assert.equal(D.NOMS[0], 'صِفْر');
  assert.equal(D.FR[5], 'cinq'); assert.equal(D.FR[100], 'cent');
});
test('nombres composés 21–99 : l\'unité puis « et + dizaine » (ثَلَاثَة وَعِشْرُون = 23), jamais inventés', () => {
  assert.deepEqual(D.suiteAudio(23), ['nb.3', 'et.20']); assert.deepEqual(D.suiteAudio(99), ['nb.9', 'et.90']); assert.deepEqual(D.suiteAudio(15), ['nb.15']); assert.deepEqual(D.suiteAudio(70), ['nb.70']); assert.equal(D.suiteAudio(250), null);
  assert.equal(D.nomArabe(23), 'ثَلَاثَة وَعِشْرُون'); assert.equal(D.nomArabe(21), 'وَاحِد وَعِشْرُون'); assert.equal(D.nomArabe(55), 'خَمْسَة وَخَمْسُون');
  for (const n of [21, 34, 58, 99]) for (const id of D.suiteAudio(n)) assert.ok(man.phrases.some(p => p.id === id), 'audio ' + id);
});
test('8 étapes, chacune avec sa nouveauté ; progression : maîtrise = 3 réussites dans 2 contextes ; jamais de perte', () => {
  assert.equal(D.ETAPES.length, 8); assert.deepEqual(D.ETAPES.map(e => e.type), ['chiffres', 'chiffres', 'chiffres', 'dix', 'vingt', 'dizaines', 'grands', 'calculs']);
  const s = M.etatInitial(); M.vu(s, 'nb.3'); assert.equal(M.stade(s, 'nb.3'), 1); M.enregistrer(s, { item: 'nb.3', contexte: 'compter', ok: true }); assert.equal(M.stade(s, 'nb.3'), 2);
  for (let i = 0; i < 4; i++) M.enregistrer(s, { item: 'nb.3', contexte: 'compter', ok: true }); assert.equal(M.stade(s, 'nb.3'), 2); M.enregistrer(s, { item: 'nb.3', contexte: 'ecouter', ok: true }); assert.equal(M.stade(s, 'nb.3'), 3);
  M.enregistrer(s, { item: 'nb.7', contexte: 'lire', ok: false }); assert.equal(M.stade(s, 'nb.7'), 1); const t = M.lire(JSON.parse(JSON.stringify(s))); assert.deepEqual(t.items, s.items); assert.equal(M.lire(null).groupe, null);
  M.terminerEtape(s, 'n1', { aides: 0, erreurs: 0 }); assert.equal(M.prochaineEtape(s).id, 'n2');
});
test('audios : chaque nom de nombre a son fichier, voix autorisée, « à valider » tant qu\'un humain ne l\'a pas écouté ; lien explicite au nombre', () => {
  const par = Object.fromEntries(man.phrases.map(p => [p.id, p])), inv = A.inventaire(); assert.equal(man.phrases.length, inv.length);
  for (const p of inv) { const q = par[p.id]; assert.ok(q, p.id); assert.equal(q.texte, p.texte); assert.ok(q.fichier && fs.existsSync(path.join(R, 'audio/jeux/ecole-chiffres', q.fichier)), p.id); assert.equal(q.voixId, roles[p.role]); assert.equal(q.prononciationVerifiee, false); }
  for (const n of D.AUDIOS_NOMBRES) assert.equal(par['nb.' + n].texte, D.NOMS[n]); for (const id of A.BRAVOS.concat(A.ENCORES, ['aide'])) assert.ok(par[id], id);
});
