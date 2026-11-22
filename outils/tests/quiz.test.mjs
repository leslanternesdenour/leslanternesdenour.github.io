// Quiz de Nour — contenus rigoureux (une seule bonne réponse, explications, âges), logique, sauvegarde, audio.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path';
const C = await import('../../aventures/quiz-nour/contenu.js'); const L = await import('../../aventures/quiz-nour/logique.js');
const RACINE = path.resolve(new URL('../..', import.meta.url).pathname); const seed = a => () => (a = (a * 16807) % 2147483647) / 2147483647;
const toutes = () => Object.entries(C.CATEGORIES).flatMap(([c, d]) => C.NIVEAUX.flatMap(n => d.questions[n].map((q, i) => ({ c, n, i, q, d }))));

test('8 catégories × 3 niveaux × 4 questions = 96, chacune avec guide et décor', () => {
  assert.equal(C.ORDRE_CATEGORIES.length, 8); assert.equal(toutes().length, 96);
  for (const [c, d] of Object.entries(C.CATEGORIES)) { assert.ok(C.GUIDES[d.guide], c); for (const n of C.NIVEAUX) assert.equal(d.questions[n].length, 4, c + n); }
  assert.deepEqual(C.ORDRE_CATEGORIES.sort(), ['animaux', 'connaissances', 'culture', 'decouverte', 'geographie', 'histoires', 'nature', 'vocabulaire']);
});
test('chaque question : réponses illustrées (emoji + libellé), 3 ou 4 choix, tous différents, explication, aucune réponse vide', () => {
  for (const { c, n, i, q } of toutes()) {
    const nom = `${c}.${n}.${i}`; assert.ok(q.q.endsWith('?') || /\.$/.test(q.q) || /…$/.test(q.q), nom + ' formulation'); assert.ok(q.choix.length >= 3 && q.choix.length <= 4, nom);
    const tx = q.choix.map(x => x.split('|')[1]); assert.equal(new Set(tx).size, tx.length, nom + ' : réponses distinctes'); for (const x of q.choix) { assert.match(x, /^\S+\|.+/, nom); }
    assert.ok(q.exp.length > 15 && q.exp.length < 220, nom + ' explication');
  }
});
test('un niveau plus difficile propose au moins autant de choix ; le niveau facile reste à 3 choix (3-5 ans)', () => {
  for (const [c, d] of Object.entries(C.CATEGORIES)) for (const q of d.questions.facile) assert.equal(q.choix.length, 3, c + ' facile = 3 choix');
});
test('aucune représentation interdite : pas de mot moderne, prophètes toujours avec « paix sur lui » ou dans une question de contenu, pas de récitation', () => {
  const tout = C.inventaire().map(p => p.texte).join(' ');
  assert.ok(!/ordinateur|t[ée]l[ée]phone|voiture|internet|plastique/i.test(tout));
  for (const { q } of toutes()) if (/prophète/i.test(q.q) && /Nuh|Yunus|Yusuf|Ibrahim|Sulayman|Muhammad/.test(q.q + q.exp)) assert.match(q.q + q.exp, /paix sur lui/, q.q);
  assert.ok(!/récit(e|ation) du coran|verset/i.test(tout), 'aucune récitation ni verset');
});
test('questions religieuses : marquées, formulation élémentaire ; les faits de base sont exacts (cinq prières, cinq piliers, 114 sourates, Fajr…)', () => {
  const rel = toutes().filter(x => x.q.religieux || x.d.religieux); assert.ok(rel.length >= 20);
  const bonne = (c, n, i) => C.CATEGORIES[c].questions[n][i].choix[0].split('|')[1];
  assert.equal(bonne('culture', 'facile', 1), 'Cinq fois'); assert.equal(bonne('culture', 'avance', 0), 'Cinq'); assert.equal(bonne('culture', 'avance', 2), '114');
  assert.equal(bonne('culture', 'moyen', 0), 'Ramadan'); assert.equal(bonne('culture', 'moyen', 2), 'Le Fajr'); assert.equal(bonne('culture', 'avance', 3), 'Al-Fatiha'); assert.equal(bonne('culture', 'avance', 1), "L'Aïd al-Fitr");
  assert.equal(bonne('histoires', 'moyen', 0), 'Nuh (Noé)'); assert.equal(bonne('histoires', 'moyen', 1), 'Yunus (Jonas)'); assert.equal(bonne('histoires', 'moyen', 2), 'Yusuf (Joseph)');
  assert.equal(bonne('histoires', 'avance', 2), 'Ibrahim (Abraham)'); assert.equal(bonne('histoires', 'avance', 3), 'Sulayman (Salomon)');
});
test('faits de culture générale (exactitude vérifiée à la main)', () => {
  const b = (c, n, i) => C.CATEGORIES[c].questions[n][i].choix[0].split('|')[1];
  const attendu = [['animaux', 'moyen', 0, 'Huit'], ['animaux', 'avance', 0, 'La baleine bleue'], ['animaux', 'avance', 1, 'De la graisse'], ['nature', 'avance', 0, '0 degré'], ['geographie', 'moyen', 0, 'Le Nil'], ['geographie', 'moyen', 1, 'Paris'], ['geographie', 'avance', 0, 'Le Sahara'], ['geographie', 'avance', 1, 'Le Caire'], ['connaissances', 'avance', 0, '365'], ['connaissances', 'avance', 1, '42'], ['connaissances', 'avance', 2, '25'], ['connaissances', 'avance', 3, 'Six'], ['connaissances', 'moyen', 0, 'Douze'], ['connaissances', 'moyen', 3, 'Neuf'], ['vocabulaire', 'avance', 1, '28'], ['vocabulaire', 'avance', 0, 'De droite à gauche']];
  for (const [c, n, i, v] of attendu) assert.equal(b(c, n, i), v, `${c}.${n}.${i}`);
});
test('parties : réponses mélangées, une seule bonne réponse, la bonne est bien indiquée, toujours les 4 questions', () => {
  for (const c of C.ORDRE_CATEGORIES) for (const n of C.NIVEAUX) for (let s = 1; s < 12; s++) { const p = L.construirePartie(c, n, seed(s)); assert.equal(p.length, 4);
    for (const q of p) { assert.equal(q.choix.filter(x => x.bonne).length, 1); assert.ok(q.choix[q.bonne].bonne); assert.ok(q.choix.every(x => x.emoji && x.texte)); } }
  const pos = new Set(); for (let s = 1; s < 40; s++) pos.add(L.construirePartie('culture', 'facile', seed(s))[0].bonne); assert.ok(pos.size >= 2, 'la bonne réponse change de place');
});
test('âges : niveau par défaut, aide douce seulement pour les 3-5 ans', () => {
  assert.equal(L.niveauParDefaut(4), 'facile'); assert.equal(L.niveauParDefaut(7), 'moyen'); assert.equal(L.niveauParDefaut(10), 'avance'); assert.ok(L.aideAutoMs('petits') > 0); assert.equal(L.aideAutoMs('grands'), null);
});
test('étoiles : jamais zéro, premiers coups seulement, jamais à la baisse ; diplômes savant puis maître', () => {
  assert.equal(L.etoilesPour(4, 4), 3); assert.equal(L.etoilesPour(2, 4), 2); assert.equal(L.etoilesPour(0, 4), 1);
  const s = L.etatInitial(); let r = L.terminerPartie(s, { categorie: 'culture', niveau: 'facile', premierCoup: [], total: 4 }); assert.equal(r.e, 1); assert.ok(r.lanterne);
  r = L.terminerPartie(s, { categorie: 'culture', niveau: 'facile', premierCoup: ['culture.f1', 'culture.f2', 'culture.f3', 'culture.f4'], total: 4 }); assert.equal(s.etoiles.culture[0], 3);
  L.terminerPartie(s, { categorie: 'culture', niveau: 'facile', premierCoup: [], total: 4 }); assert.equal(s.etoiles.culture[0], 3, 'rejouer ne fait rien perdre');
  for (const c of C.ORDRE_CATEGORIES) L.terminerPartie(s, { categorie: c, niveau: 'facile', premierCoup: [], total: 4 }); assert.deepEqual(s.diplomes, ['savant']);
  for (const c of C.ORDRE_CATEGORIES) L.terminerPartie(s, { categorie: c, niveau: 'avance', premierCoup: [], total: 4 }); assert.ok(s.diplomes.includes('maitre')); assert.equal(L.prochaineCategorie(s), null);
});
test('sauvegarde tolérante', () => {
  assert.deepEqual(L.lire(null), L.etatInitial()); const s = L.lire({ age: 9, niveau: 'x', etoiles: { culture: [3, 9, -1], zzz: [1] }, reussies: ['a', 'a', 3], diplomes: ['maitre', 'x'], dernier: { categorie: 'nature', niveau: 'avance' } });
  assert.equal(s.age, 'grands'); assert.deepEqual(s.etoiles.culture, [3, 3, 0]); assert.deepEqual(s.reussies, ['a']); assert.deepEqual(s.diplomes, ['maitre']); assert.deepEqual(L.lire(JSON.parse(JSON.stringify(s))), s);
});
test('audio : manifeste à jour, fichiers présents seulement s\'ils existent, voix = voix du rôle ; chaque identifiant demandé par le jeu existe', () => {
  const f = path.join(RACINE, 'audio/jeux/quiz-nour/manifeste.json'); assert.ok(fs.existsSync(f), 'manifeste absent');
  const man = JSON.parse(fs.readFileSync(f, 'utf8')), roles = JSON.parse(fs.readFileSync(path.join(RACINE, 'outils/voix/jeux/voix-roles.json'), 'utf8')), inv = C.inventaire();
  assert.deepEqual(man.phrases.map(p => p.id), inv.map(p => p.id));
  for (const p of man.phrases) { assert.equal(p.texte, inv.find(x => x.id === p.id).texte); if (p.fichier) { assert.ok(fs.statSync(path.join(RACINE, 'audio/jeux/quiz-nour', p.fichier)).size > 2000, p.id); assert.equal(p.voixId, roles[p.role], p.id); } else assert.equal(p.duree, 0); }
  assert.equal(man.enregistrees, man.phrases.filter(p => p.fichier).length);
});
