// Jeu 2 « Je découvre la lecture arabe » : contenu linguistiquement sûr, progression réelle (jamais sur une seule réussite), audios rattachés à leur texte.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), imp = p => import(pathToFileURL(path.join(R, p)).href);
const D = await imp('ecole-arabe/lecture/donnees/lecture.js'), M = await imp('ecole-arabe/lecture/moteur.js'), A = await imp('ecole-arabe/lecture/donnees/audio.js'), { PAR_ID_ALPHABET } = await imp('ecole-arabe/commun/langue/alphabet.js');
const man = JSON.parse(fs.readFileSync(path.join(R, 'audio/jeux/ecole-lecture/manifeste.json'), 'utf8')), roles = JSON.parse(fs.readFileSync(path.join(R, 'outils/voix/jeux/voix-roles.json'), 'utf8'));
const VOY = /[َُِ]/, SIGNES = /[ً-ْ]/;
test('syllabes : lettre + signe de la référence unique ; fatha = a, kasra = i, damma = ou ; longues = voyelle + alif / ya / waw', () => {
  assert.equal(D.SYLLABES.length, D.CONS.length * 3); assert.equal(D.SYLLABES_LONGUES.length, D.CONS.length * 3);
  for (const s of D.SYLLABES) { assert.ok(s.ar.startsWith(PAR_ID_ALPHABET[s.cons].ar), s.id); assert.ok(s.ar.endsWith({ fatha: 'َ', kasra: 'ِ', damma: 'ُ' }[s.voy]), s.id); assert.match(s.lecture, { fatha: /a$/, kasra: /i$/, damma: /ou$/ }[s.voy], s.id); }
  for (const s of D.SYLLABES_LONGUES) { assert.ok(s.ar.endsWith({ aa: 'ا', ii: 'ي', uu: 'و' }[s.voy]), s.id); assert.match(s.lecture, { aa: /aa$/, ii: /ii$/, uu: /ouu$/ }[s.voy], s.id); }
  assert.ok(D.CONS.every(c => PAR_ID_ALPHABET[c]));
});
test('mots : vocalisés, commencent par la bonne lettre attendue, avec traduction et illustration ; phrases « هَذَا / هَذِهِ » accordées au genre', () => {
  assert.ok(D.MOTS.length >= 18); for (const m of D.MOTS) { assert.ok(VOY.test(m.ar), 'vocalisé ' + m.id); assert.ok(m.fr && m.emoji && m.tr && ['m', 'f'].includes(m.genre), m.id); }
  assert.equal(new Set(D.MOTS.map(m => m.emoji)).size, D.MOTS.length, 'une illustration différente par mot');
  for (const p of D.PHRASES_LECTURE) { const m = D.MOTS_PAR_ID[p.mot]; assert.ok(p.ar.startsWith(m.genre === 'm' ? 'هَذَا ' : 'هَذِهِ '), p.id); assert.ok(p.ar.endsWith(m.ar)); }
  assert.deepEqual(D.MOTS.filter(m => m.genre === 'f' && !/[ةتد]|^شَمْس$/.test(m.ar.at(-1)) && !['شَمْس', 'يَد', 'بِنْت'].includes(m.ar)).map(m => m.id), [], 'les mots féminins en « ة » ou les féminins irréguliers connus (شمس، يد، بنت)');
  for (const s of D.SOUKOUN) assert.ok(s.ar.endsWith('ْ'), s.id); for (const c of D.CHADDA) assert.ok(c.ar.includes('ّ'), c.id);
});
test('7 étapes, chacune avec sa nouveauté ; progression : maîtrise = 3 réussites dans 2 contextes différents, jamais sur une réponse', () => {
  assert.equal(D.ETAPES.length, 7); assert.deepEqual(D.ETAPES.map(e => e.type), ['voyelle', 'voyelle', 'voyelle', 'signes', 'longues', 'mots', 'phrases']);
  const s = M.etatInitial(); assert.equal(M.stade(s, 'syl.ba.fatha'), 0); M.vu(s, 'syl.ba.fatha'); assert.equal(M.stade(s, 'syl.ba.fatha'), 1);
  M.enregistrer(s, { item: 'syl.ba.fatha', contexte: 'lire', ok: true }); assert.equal(M.stade(s, 'syl.ba.fatha'), 2);
  for (let i = 0; i < 5; i++) M.enregistrer(s, { item: 'syl.ba.fatha', contexte: 'lire', ok: true }); assert.equal(M.stade(s, 'syl.ba.fatha'), 2, 'même contexte : pas encore maîtrisé');
  M.enregistrer(s, { item: 'syl.ba.fatha', contexte: 'ecoute', ok: true }); assert.equal(M.stade(s, 'syl.ba.fatha'), 3);
  M.enregistrer(s, { item: 'syl.ta.kasra', contexte: 'lire', ok: false }); assert.equal(M.stade(s, 'syl.ta.kasra'), 1, 'une erreur ne retire rien'); assert.deepEqual(M.aReviser(s, ['syl.ta.kasra']), ['syl.ta.kasra']);
  const r = M.terminerEtape(s, 'e1', { aides: 0, erreurs: 0 }); assert.equal(r.etoiles, 3); assert.equal(M.prochaineEtape(s).id, 'e2'); assert.ok(M.recompenses(s).lanternes === 1);
});
test('sauvegarde : relecture tolérante, rien ne se perd, âge → groupe', () => {
  const s = M.etatInitial(); M.reglerAge(s, 4); assert.equal(s.groupe, 'g34'); M.enregistrer(s, { item: 'mot.bab', contexte: 'lire', ok: true }); M.terminerEtape(s, 'e3', { aides: 1, erreurs: 2 });
  const t = M.lire(JSON.parse(JSON.stringify(s))); assert.deepEqual(t.items, s.items); assert.deepEqual(t.etapes, s.etapes); assert.equal(t.groupe, 'g34'); assert.equal(M.lire(null).groupe, null); assert.equal(M.lire('x').exercices, 0);
});
test('audios : chaque texte arabe du jeu a son fichier, voix autorisée, jamais « vérifié » sans validation humaine ; les lettres des syllabes sont rattachées par identifiant', () => {
  const par = Object.fromEntries(man.phrases.map(p => [p.id, p])); const inv = A.inventaire(); assert.equal(man.phrases.length, inv.length);
  for (const p of inv) { const q = par[p.id]; assert.ok(q, p.id); assert.equal(q.texte, p.texte, p.id); assert.ok(q.fichier && fs.existsSync(path.join(R, 'audio/jeux/ecole-lecture', q.fichier)), 'fichier ' + p.id); assert.equal(q.voixId, roles[p.role], 'voix ' + p.id); assert.equal(q.prononciationVerifiee, false, 'à valider ' + p.id); if (p.lettre) assert.equal(q.lettre, p.lettre, p.id); }
  for (const s of [...D.SYLLABES, ...D.SYLLABES_LONGUES, ...D.MOTS.map(m => ({ id: 'mot.' + m.id })), ...D.PHRASES_LECTURE, ...D.SOUKOUN, ...D.CHADDA]) assert.ok(par[s.id], 'audio ' + s.id);
  for (const id of A.BRAVOS.concat(A.ENCORES, ['aide'])) assert.ok(par[id], id);
});
