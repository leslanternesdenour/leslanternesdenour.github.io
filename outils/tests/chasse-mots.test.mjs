// Chasse aux mots — logique : niveaux, âges, cibles, étoiles sans punition, déblocages, sauvegarde robuste.
import test from 'node:test'; import assert from 'node:assert/strict';
const L = await import('../../aventures/chasse-aux-mots/logique.js');
const seed = a => () => (a = (a * 16807) % 2147483647) / 2147483647;

test('âges : 3-5 petits, 6-8 moyens, 9-10 grands ; valeur inconnue = null', () => {
  assert.equal(L.groupeAge(4), 'petits'); assert.equal(L.groupeAge(7), 'moyens'); assert.equal(L.groupeAge(10), 'grands'); assert.equal(L.groupeAge('x'), null); assert.equal(L.groupeAge('grands'), 'grands');
});
test('5 niveaux dans l\'ordre du cahier des charges, difficulté croissante, plus guidé pour les petits', () => {
  assert.deepEqual(Object.values(L.MODES), ['image', 'silhouette', 'mot', 'audio', 'enigme']);
  for (const g of ['petits', 'moyens', 'grands']) { let p = 0; for (const n of L.NIVEAUX) { const c = L.parametres(n, g).cibles; assert.ok(c >= p, g + n); p = c; } }
  assert.ok(L.parametres(1, 'petits').cibles < L.parametres(1, 'grands').cibles);
  assert.ok(L.parametres(1, 'petits').rayon > L.parametres(1, 'grands').rayon, 'grande zone de toucher pour les petits');
  assert.equal(L.parametres(3, 'petits').mot, false, 'très peu de lecture pour les 3-5 ans'); assert.equal(L.parametres(3, 'moyens').mot, true);
  assert.equal(L.parametres(1, 'grands').aideAutoMs, null); assert.ok(L.parametres(1, 'petits').aideAutoMs > 0);
});
test('étoiles : uniquement selon les aides demandées, jamais selon des échecs ; toujours au moins 1', () => {
  assert.equal(L.etoilesPour(0), 3); assert.equal(L.etoilesPour(2), 2); assert.equal(L.etoilesPour(9), 1);
});
test('cibles : distinctes, bon nombre, mots nouveaux d\'abord', () => {
  const o = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']; const c = L.choisirCibles(o, 4, seed(7), ['a', 'b', 'c', 'd']);
  assert.equal(new Set(c).size, 4); assert.ok(c.every(x => ['e', 'f', 'g', 'h'].includes(x)), 'les mots déjà vus passent après');
  assert.equal(L.choisirCibles(['a', 'b'], 5, seed(1)).length, 2);
});
test('fin de manche : meilleure note jamais à la baisse, mots appris, lanterne une seule fois, diplômes', () => {
  const s = L.etatInitial(); let r = L.terminerManche(s, { lieu: 'marche', niveau: 1, aides: 3, cibles: ['pain', 'datte'] });
  assert.equal(r.etoiles, 1); assert.ok(r.lanterne); assert.deepEqual(r.mots, ['pain', 'datte']);
  r = L.terminerManche(s, { lieu: 'marche', niveau: 1, aides: 0, cibles: ['pain'] }); assert.equal(r.etoiles, 2); assert.ok(!r.lanterne); assert.deepEqual(r.mots, []);
  r = L.terminerManche(s, { lieu: 'marche', niveau: 1, aides: 9, cibles: ['pain'] }); assert.equal(r.etoiles, 0); assert.equal(s.etoiles.marche[0], 3, 'rejouer avec des aides ne fait rien perdre');
  for (const l of L.LIEUX_IDS) for (const n of L.NIVEAUX) L.terminerManche(s, { lieu: l, niveau: n, aides: 0, cibles: [] });
  assert.ok(L.LIEUX_IDS.every(l => s.diplomes.includes(l)) && s.diplomes.includes('grand'));
  assert.equal(L.etoilesTotal(s), L.MAX_ETOILES); assert.equal(L.lanternes(s), 30);
});
test('déblocage : niveau 1 toujours ouvert, chaque niveau après la réussite du précédent (dans un lieu), jamais lié au temps ni à l\'argent', () => {
  const s = L.etatInitial(); assert.ok(L.niveauOuvert(s, 1)); assert.ok(!L.niveauOuvert(s, 2));
  L.terminerManche(s, { lieu: 'jardin', niveau: 1, aides: 5, cibles: [] }); assert.ok(L.niveauOuvert(s, 2)); assert.ok(!L.niveauOuvert(s, 3));
});
test('sauvegarde : lecture tolérante aux données abîmées, sans perte', () => {
  assert.deepEqual(L.lire(null), L.etatInitial()); assert.deepEqual(L.lire('x'), L.etatInitial());
  const s = L.lire({ age: 6, etoiles: { marche: [3, 9, -1, 'a'], inconnu: [3] }, trouves: ['pain', 'pain', 4], diplomes: ['marche'], dernier: { lieu: 'oasis', niveau: 9 } });
  assert.equal(s.age, 'moyens'); assert.deepEqual(s.etoiles.marche, [3, 3, 0, 0, 0]); assert.ok(!s.etoiles.inconnu); assert.deepEqual(s.trouves, ['pain']); assert.deepEqual(s.dernier, { lieu: 'oasis', niveau: 5 });
  assert.deepEqual(L.lire(JSON.parse(JSON.stringify(s))), s, 'aller-retour sans perte');
});
test('suite : niveau suivant, puis un autre lieu ; rien à proposer quand tout est fini', () => {
  const s = L.etatInitial(); assert.deepEqual(L.suite(s, 'marche', 2), { lieu: 'marche', niveau: 3 }); assert.deepEqual(L.suite(s, 'marche', 5), { lieu: 'maison', niveau: 1 });
  for (const l of L.LIEUX_IDS) L.terminerManche(s, { lieu: l, niveau: 5, aides: 0, cibles: [] }); assert.equal(L.suite(s, 'marche', 5), null);
});

// ---- contenus et audio ----
import fs from 'node:fs'; import path from 'node:path';
const M = await import('../../aventures/chasse-aux-mots/mots.js');
const RACINE = path.resolve(new URL('../..', import.meta.url).pathname);
test('contenus : chaque lieu a 8 objets existants, chaque objet a un mot arabe en alphabet arabe, une énigme et un article', () => {
  for (const [l, d] of Object.entries(M.LIEUX)) { assert.equal(d.objets.length, 8, l); assert.ok(M.GUIDES[d.guide], l + ' : guide'); for (const o of d.objets) assert.ok(M.OBJETS[o], l + '/' + o); }
  for (const [id, o] of Object.entries(M.OBJETS)) { assert.match(o.ar, /^[؀-ۿ\s]+$/, id + ' : alphabet arabe (pas de translittération latine)'); assert.match(o.enigme, /Qui suis-je \?$/, id); assert.ok(o.det.length > 2); }
  assert.equal(new Set(Object.values(M.GUIDES).map(g => g.voix)).size, 6, 'une voix par guide');
});
test('inventaire audio : ids uniques, un texte source par phrase, aucune voix de synthèse du téléphone', () => {
  const inv = M.inventaire(), ids = inv.map(p => p.id); assert.equal(new Set(ids).size, ids.length);
  for (const p of inv) { assert.ok(p.texte && p.role && ['fr', 'ar'].includes(p.langue), p.id); assert.ok(!/\{|\}/.test(p.texte), p.id + ' : modèle rempli'); }
  assert.ok(!/speechSynthesis/.test(fs.readFileSync(path.join(RACINE, 'aventures/chasse-aux-mots/jeu.js'), 'utf8')), 'jamais de synthèse vocale du navigateur');
});
test('manifeste audio : à jour avec les textes ; un fichier n\'est annoncé que s\'il existe ; durée plausible ; voix = voix attribuée au rôle', () => {
  const man = JSON.parse(fs.readFileSync(path.join(RACINE, 'audio/jeux/chasse-aux-mots/manifeste.json'), 'utf8')), roles = JSON.parse(fs.readFileSync(path.join(RACINE, 'outils/voix/jeux/voix-roles.json'), 'utf8')), inv = M.inventaire();
  assert.deepEqual(man.phrases.map(p => p.id), inv.map(p => p.id), 'manifeste généré depuis mots.js (node outils/voix/jeux/inventaire.mjs)');
  let n = 0;
  for (const p of man.phrases) {
    const src = inv.find(x => x.id === p.id); assert.equal(p.texte, src.texte, p.id + ' : texte identique à la source');
    if (p.fichier) { n++; const f = path.join(RACINE, 'audio/jeux/chasse-aux-mots', p.fichier); assert.ok(fs.existsSync(f) && fs.statSync(f).size > 2000, p.id + ' : fichier présent'); assert.ok(p.duree > 0.3 && p.duree < 30, p.id + ' durée'); assert.equal(p.voixId, roles[p.role], p.id + ' : voix du rôle'); }
    else assert.equal(p.duree, 0, p.id + ' : pas de durée sans fichier');
    if (p.langue === 'ar') assert.equal(p.prononciationVerifiee, false, 'arabe : prononciation à faire valider par le fondateur');
  }
  assert.equal(man.enregistrees, n);
});
test('voix : un rôle garde toujours la même voix ; aucune voix créée (limite de 10) ; la narratrice existante est inchangée', () => {
  const r = JSON.parse(fs.readFileSync(path.join(RACINE, 'outils/voix/jeux/voix-roles.json'), 'utf8'));
  assert.equal(r.narratrice, 'hddT377hAwvRoOKqMj0E', 'narratrice des contenus existants'); assert.notEqual(r.loumi, r['perso-hakim']);
  for (const g of Object.values(M.GUIDES)) assert.ok(r[g.voix], g.voix); for (const k of ['narrateur', 'loumi']) assert.ok(r[k], k);
});

test('aucun dialogue silencieux par erreur : chaque identifiant demandé par le jeu a son audio enregistré', () => {
  const man = JSON.parse(fs.readFileSync(path.join(RACINE, 'audio/jeux/chasse-aux-mots/manifeste.json'), 'utf8')), ok = new Set(man.phrases.filter(p => p.fichier).map(p => p.id));
  const src = fs.readFileSync(path.join(RACINE, 'aventures/chasse-aux-mots/jeu.js'), 'utf8');
  // identifiants construits par jeu.js (même logique) pour tous les objets, lieux et phrases communes
  const demandes = new Set(['bienvenue', 'age', 'aide', 'fin', 'fin_diplome', 'fin_grand', 'mot_nouveau', 'bravo3', ...M.ERREURS]);
  for (const o of Object.keys(M.OBJETS)) for (const pre of ['trouve', 'trouve_mot', 'trouve_ecoute', 'enigme', 'mot', 'ar']) demandes.add(pre + '.' + o);
  for (const o of Object.keys(M.OBJETS)) for (const b of M.BRAVOS.filter(x => x !== 'bravo3')) demandes.add(b + '.' + o);
  for (const l of Object.keys(M.LIEUX)) demandes.add('intro.' + l);
  for (const id of demandes) assert.ok(ok.has(id), 'audio manquant : ' + id);
  // et inversement : toute phrase enregistrée est utilisée (pas de fichier orphelin ni de phrase jamais dite)
  for (const id of ok) assert.ok(demandes.has(id), 'phrase enregistrée jamais utilisée : ' + id);
  for (const motif of ["'trouve.'", "'trouve_mot.'", "'trouve_ecoute.'", "'enigme.'", "'intro.'", "'mot_nouveau'", "'ar.'", "'mot.'"]) assert.ok(src.includes(motif), 'jeu.js demande ' + motif);
});
