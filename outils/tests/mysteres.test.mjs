// Mystères du désert — logique, contenus, énigmes (toujours solvables), sauvegarde, audio.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const C = await import('../../aventures/mysteres-desert/contenu.js'); const L = await import('../../aventures/mysteres-desert/logique.js');
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const seed = a => () => (a = (a * 16807) % 2147483647) / 2147483647;

test('7 chapitres dans l\'ordre de l\'histoire, chacun avec guide, 4 indices, une énigme et un trésor', () => {
  assert.deepEqual(C.ORDRE_CHAPITRES, ['desert', 'oasis', 'village', 'bibliotheque', 'ruines', 'montagne', 'jardins']);
  for (const [id, c] of Object.entries(C.CHAPITRES)) { assert.ok(C.GUIDES[c.guide], id); assert.equal(c.indices.length, 4, id); for (const i of c.indices) { assert.ok(C.NOMS_OBJETS[i.objet] && i.texte.length > 10, id); } assert.ok(c.enigme.pourquoi.length > 20 && c.tresor.fait.length > 20, id); }
  const types = new Set(Object.values(C.CHAPITRES).map(c => c.enigme.type)); assert.deepEqual([...types].sort(), ['choisir', 'code', 'memoire', 'ordre', 'paires'], '5 mécaniques d\'énigme différentes');
});
test('énigmes : toujours solvables, bonne réponse présente, jamais déjà résolues au départ, pour tous les niveaux et toutes les graines', () => {
  for (const ch of C.ORDRE_CHAPITRES) for (const niv of L.NIVEAUX) for (let s = 1; s < 30; s++) {
    const e = L.construireEnigme(ch, niv, seed(s)), t = e.type;
    if (t === 'choisir') { assert.ok(e.options.includes(e.bonne)); assert.equal(new Set(e.options).size, e.options.length); assert.ok(L.verifier(e, e.bonne).ok); assert.ok(!L.verifier(e, e.options.find(o => o !== e.bonne)).ok); }
    if (t === 'ordre' || t === 'code') { assert.ok(L.verifier(e, e.ordre).ok); assert.ok(!L.verifier(e, [...e.ordre].reverse()).ok || e.ordre.length < 2); if (t === 'ordre') assert.notDeepEqual(e.affichage, e.ordre, 'pas déjà dans l\'ordre'); assert.equal(new Set(e.ordre).size, e.ordre.length); }
    if (t === 'memoire') { assert.ok(L.verifier(e, e.suite).ok); assert.equal(e.suite.length, L.parametres(niv).memoire); assert.ok(e.suite.every(x => e.symboles.includes(x))); }
    if (t === 'paires') { assert.equal(e.paires.length, L.parametres(niv).paires); for (const p of e.paires) assert.ok(L.paireJuste(e, p, p)); assert.ok(!L.paireJuste(e, e.paires[0], e.paires[1])); }
  }
});
test('code du dernier chapitre : les indices racontent bien l\'ordre rose, raisin, pomme', () => {
  const j = C.CHAPITRES.jardins; assert.deepEqual(j.enigme.ordre, ['rose', 'raisin', 'pomme']); assert.match(j.indices[0].texte, /première/); assert.match(j.indices[2].texte, /dernière/);
});
test('niveaux : plus d\'indices et de choix en montant ; aide douce automatique pour les plus petits seulement', () => {
  const [a, b, c] = L.NIVEAUX.map(n => L.parametres(n, 'moyens')); assert.ok(a.indices < c.indices && a.memoire < c.memoire); assert.ok(L.parametres('moyen', 'petits').aideAutoMs > 0 && L.parametres('moyen', 'grands').aideAutoMs === null);
  assert.equal(L.niveauParDefaut(4), 'facile'); assert.equal(L.niveauParDefaut(10), 'avance'); assert.equal(L.etoilesPour(0), 3); assert.equal(L.etoilesPour(5), 1);
});
test('progression : l\'histoire avance dans l\'ordre, jamais à la baisse, trésors, diplômes explorateur puis maître', () => {
  const s = L.etatInitial(); assert.ok(L.chapitreOuvert(s, 'desert')); assert.ok(!L.chapitreOuvert(s, 'oasis')); assert.equal(L.prochainChapitre(s), 'desert');
  let r = L.terminerChapitre(s, { chapitre: 'desert', niveau: 'facile', aides: 4 }); assert.ok(r.tresor && r.lanterne && r.etoiles === 1); assert.ok(L.chapitreOuvert(s, 'oasis'));
  r = L.terminerChapitre(s, { chapitre: 'desert', niveau: 'facile', aides: 0 }); assert.equal(r.etoiles, 2); assert.ok(!r.tresor && !r.lanterne);
  L.terminerChapitre(s, { chapitre: 'desert', niveau: 'facile', aides: 9 }); assert.equal(s.etoiles.desert[0], 3, 'rejouer avec des aides ne fait rien perdre');
  for (const c of C.ORDRE_CHAPITRES) L.terminerChapitre(s, { chapitre: c, niveau: 'facile', aides: 0 }); assert.deepEqual(s.diplomes, ['explorateur']);
  for (const c of C.ORDRE_CHAPITRES) r = L.terminerChapitre(s, { chapitre: c, niveau: 'avance', aides: 0 }); assert.ok(s.diplomes.includes('maitre')); assert.equal(L.prochainChapitre(s), null);
});
test('sauvegarde tolérante, sans perte', () => {
  assert.deepEqual(L.lire(null), L.etatInitial()); const s = L.lire({ age: 7, niveau: 'zzz', etoiles: { desert: [3, 9, -2] , x: [1] }, tresors: ['desert', 'x', 'desert'], diplomes: ['maitre', 'autre'], dernier: { chapitre: 'oasis', niveau: 'avance' } });
  assert.equal(s.age, 'moyens'); assert.equal(s.niveau, null); assert.deepEqual(s.etoiles.desert, [3, 3, 0]); assert.deepEqual(s.tresors, ['desert']); assert.deepEqual(s.diplomes, ['maitre']); assert.deepEqual(L.lire(JSON.parse(JSON.stringify(s))), s);
});
test('contenus : textes sans mot religieux ni objet moderne ; chaque guide a une voix', () => {
  const tout = C.inventaire().map(p => p.texte).join(' '); assert.ok(!/allah|coran|proph|pri[eè]re|t[ée]l[ée]|voiture|ordinateur|plastique/i.test(tout));
  const ids = C.inventaire().map(p => p.id); assert.equal(new Set(ids).size, ids.length);
});
test('audio : le manifeste est à jour avec les textes, un fichier n\'est annoncé que s\'il existe, et la voix correspond au rôle', () => {
  const f = path.join(RACINE, 'audio/jeux/mysteres-desert/manifeste.json'); if (!fs.existsSync(f)) return assert.fail('manifeste absent (node outils/voix/jeux/inventaire.mjs mysteres-desert)');
  const man = JSON.parse(fs.readFileSync(f, 'utf8')), roles = JSON.parse(fs.readFileSync(path.join(RACINE, 'outils/voix/jeux/voix-roles.json'), 'utf8')), inv = C.inventaire();
  assert.deepEqual(man.phrases.map(p => p.id), inv.map(p => p.id));
  for (const p of man.phrases) { assert.equal(p.texte, inv.find(x => x.id === p.id).texte); if (p.fichier) { assert.ok(fs.statSync(path.join(RACINE, 'audio/jeux/mysteres-desert', p.fichier)).size > 2000, p.id); assert.equal(p.voixId, roles[p.role], p.id); } else assert.equal(p.duree, 0); }
});

test('aucun dialogue silencieux par erreur : tout identifiant demandé par le jeu a son audio, et tout audio est utilisé', () => {
  const man = JSON.parse(fs.readFileSync(path.join(RACINE, 'audio/jeux/mysteres-desert/manifeste.json'), 'utf8')), ok = new Set(man.phrases.filter(p => p.fichier).map(p => p.id));
  const src = fs.readFileSync(path.join(RACINE, 'aventures/mysteres-desert/jeu.js'), 'utf8'), demandes = new Set();
  for (const m of src.matchAll(/PHRASES\.([a-z_0-9]+)/g)) demandes.add(m[1]);
  for (const k of ['bienvenue', 'age', 'aide', 'indices_finis', 'passage', 'fin_chapitre', 'fin_diplome', 'fin_maitre', 'memoire_regarde', 'memoire_a_toi', ...C.BRAVOS, ...C.ERREURS]) demandes.add(k);
  for (const [c, d] of Object.entries(C.CHAPITRES)) { demandes.add('intro.' + c); demandes.add('enigme.' + c); demandes.add('pourquoi.' + c); demandes.add('tresor.' + c); d.indices.forEach((_, i) => demandes.add(`indice.${c}.${i + 1}`)); }
  for (const id of demandes) assert.ok(ok.has(id), 'audio manquant : ' + id);
  for (const id of ok) assert.ok(demandes.has(id), 'audio jamais utilisé : ' + id);
});
