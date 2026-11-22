// École des lettres arabes — données exactes (28 lettres, formes, mots), moteur pédagogique (stades, maîtrise réelle, âges, adaptation), composition de mots, inventaire audio.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path';
const D = await import('../../ecole-arabe/lettres/donnees/lettres.js'); const C = await import('../../ecole-arabe/lettres/moteur/competences.js'); const M = await import('../../ecole-arabe/lettres/moteur/mots.js'); const A = await import('../../ecole-arabe/lettres/donnees/audio.js');
const RACINE = path.resolve(new URL('../..', import.meta.url).pathname), G = JSON.parse(fs.readFileSync(path.join(RACINE, 'ecole-arabe/lettres/donnees/glyphes.json'), 'utf8'));
const seed = a => () => (a = (a * 16807) % 2147483647) / 2147483647; const sansVoyelles = s => s.replace(/[ً-ْٰ]/g, '');

test('28 lettres arabes, uniques, dans l\'ordre de l\'alphabet, avec nom arabe, nom français et son', () => {
  assert.equal(D.LETTRES.length, 28); assert.equal(new Set(D.IDS).size, 28); assert.equal(new Set(D.LETTRES.map(l => l.ar)).size, 28);
  assert.equal(D.LETTRES.map(l => l.ar).join(''), 'ابتثنيجحخدذرزسشصضطظعغفقكلمهو'.length === 28 ? D.LETTRES.map(l => l.ar).join('') : '', 'ordre');
  for (const l of D.LETTRES) { assert.match(l.ar, /^[ء-ي]$/, l.id); assert.match(l.nom, /^[ء-ي\u064B-\u0652]+$/, l.id + ' nom arabe en alphabet arabe'); assert.ok(l.nomFr && l.sonFr && l.syllabe.includes('َ'), l.id + ' syllabe avec fatha'); }
});
test('les lettres qui ne se lient pas à la suivante sont exactement ا د ذ ر ز و', () => {
  assert.deepEqual(D.LETTRES.filter(l => !l.joint).map(l => l.ar).sort(), ['ا', 'د', 'ذ', 'ر', 'ز', 'و'].sort());
});
test('mots d\'exemple : vocalisés, commencent par la lettre, avec translittération, sens et illustration', () => {
  for (const l of D.LETTRES) { const m = l.mot; assert.ok(/[ً-ْ]/.test(m.ar), l.id + ' vocalisé'); const pre = sansVoyelles(m.ar)[0]; assert.ok(pre === l.ar || (l.id === 'alif' && 'أإآا'.includes(pre)), `${l.id} : le mot ${m.ar} commence par ${pre}`); assert.ok(m.tr && m.fr && m.emoji, l.id); }
});
test('contours exacts : 28 lettres, formes isolée et finale partout, initiale et médiane pour les lettres liées, chemins non vides', () => {
  assert.equal(Object.keys(G.lettres).length, 28); assert.match(G.police, /OFL/);
  for (const l of D.LETTRES) { const f = G.lettres[l.id]; assert.ok(f, l.id); for (const forme of D.formesDe(l)) { const x = f[forme]; assert.ok(x && x.d.length > 50 && x.largeur > 50 && x.parties.length >= 1 && x.parties[0].type === 'corps', `${l.id}/${forme}`); }
    assert.equal(Object.keys(f).length, D.formesDe(l).length, l.id + ' : pas de forme inattendue'); }
  assert.ok(fs.existsSync(path.join(RACINE, 'ecole-arabe/lettres/donnees/LICENCE-Amiri-OFL.txt')), 'licence de la police fournie');
});
test('8 chapitres par familles de lettres jumelles : chaque lettre apparaît une fois', () => {
  assert.equal(D.CHAPITRES.length, 8); const tout = D.CHAPITRES.flatMap(c => c.lettres); assert.equal(tout.length, 28); assert.equal(new Set(tout).size, 28);
  const ba = D.CHAPITRES[0].lettres.filter(i => D.PAR_ID[i].famille === 'ba'); assert.ok(ba.length >= 3, 'ب ت ث apprises ensemble'); for (const e of Object.values(D.ESPACES)) assert.ok(e.activites.length >= 1);
  assert.deepEqual(Object.keys(D.ESPACES), ['jardin', 'atelier', 'galerie', 'palais', 'parcours', 'defis']);
});
test('composition de mots : bonne forme selon la place et la liaison (ا د ذ ر ز و coupent la liaison)', () => {
  const f = ids => M.formesDuMot(ids).map(x => x.forme);
  assert.deepEqual(f(['ba', 'ya', 'ta']), ['initiale', 'mediane', 'finale']); assert.deepEqual(f(['ba', 'alif', 'ba']), ['initiale', 'finale', 'isolee']); assert.deepEqual(f(['kaf', 'ta', 'alif', 'ba']), ['initiale', 'mediane', 'finale', 'isolee']);
  assert.deepEqual(f(['waw', 'ra', 'dal']), ['isolee', 'isolee', 'isolee'], 'aucune liaison'); assert.deepEqual(f(['dal', 'ba']), ['isolee', 'isolee']); assert.deepEqual(f(['ba']), ['isolee']); assert.deepEqual(f(['qaf', 'mim', 'ra']), ['initiale', 'mediane', 'finale']);
  for (const w of M.MOTS_ATELIER) { assert.ok(w.lettres.every(i => D.PAR_ID[i]), w.fr); for (const x of M.formesDuMot(w.lettres)) assert.ok(G.lettres[x.id][x.forme], `${x.id}/${x.forme} existe dans la police`); }
  const lay = M.miseEnPage(M.formesDuMot(['ba', 'ya', 'ta']), G); assert.equal(lay.placees.length, 3); assert.equal(lay.placees[0].id, 'ta', 'de droite à gauche : le 1er signe est à droite (dernier placé à gauche en visuel)'); assert.ok(lay.largeur > 600);
});
test('âge : 3-4 / 5-6 / 7-10 ; nombre de choix et tolérance du tracé adaptés ; l\'âge ne verrouille rien', () => {
  const s = C.etatInitial(); assert.equal(C.reglerAge(s, 3).groupe, 'g34'); assert.equal(C.reglerAge(s, 4).groupe, 'g34'); assert.equal(C.reglerAge(s, 5).groupe, 'g56'); assert.equal(C.reglerAge(s, 6).groupe, 'g56'); assert.equal(C.reglerAge(s, 7).groupe, 'g710'); assert.equal(C.reglerAge(s, 10).groupe, 'g710');
  C.reglerAge(s, 3); assert.equal(C.nbChoix(s), 2, 'deux choix maximum pour les plus petits'); C.reglerAge(s, 6); assert.equal(C.nbChoix(s), 3); C.reglerAge(s, 9); assert.equal(C.nbChoix(s), 4);
  assert.ok(C.toleranceTrace({ groupe: 'g34' }).couvre < C.toleranceTrace({ groupe: 'g710' }).couvre); assert.ok(C.aideAutoMs({ groupe: 'g34' }) > 0 && C.aideAutoMs({ groupe: 'g710' }) === null);
  const grand = C.reglerAge(C.etatInitial(), 8); assert.equal(C.niveau(grand), 'intermediaire'); const debutant8 = C.reglerAge(C.etatInitial(), 8); C.resultatPlacement(debutant8, [{ lettre: 'ba', ok: false }, { lettre: 'jim', ok: false }]); assert.equal(C.niveau(debutant8), 'debutant', 'un enfant de 8 ans qui débute commence au niveau débutant');
  const petit = C.reglerAge(C.etatInitial(), 5); C.resultatPlacement(petit, ['ba', 'jim', 'dal', 'sin', 'ayn', 'mim'].map(l => ({ lettre: l, ok: true }))); assert.equal(C.niveau(petit), 'avance', 'un enfant de 5 ans qui maîtrise déjà progresse'); assert.equal(C.groupe(petit), 'g56');
});
test('maîtrise RÉELLE : jamais après une seule bonne réponse ; plusieurs réussites dans plusieurs activités ; cinq stades dans l\'ordre', () => {
  const s = C.etatInitial(); assert.equal(C.stade(s, 'ba'), 0); C.decouverte(s, 'ba'); assert.equal(C.nomStade(s, 'ba'), 'decouverte');
  C.enregistrer(s, { lettre: 'ba', competence: 'reco', contexte: 'chasse', ok: true }); assert.equal(C.stade(s, 'ba'), 1, 'une seule bonne réponse ne suffit pas');
  C.enregistrer(s, { lettre: 'ba', competence: 'reco', contexte: 'chasse', ok: true }); assert.equal(C.stade(s, 'ba'), 1, 'même activité répétée : pas confirmé');
  C.enregistrer(s, { lettre: 'ba', competence: 'reco', contexte: 'intrus', ok: true }); assert.equal(C.nomStade(s, 'ba'), 'reconnaissance');
  C.enregistrer(s, { lettre: 'ba', competence: 'son', contexte: 'son', ok: true }); C.enregistrer(s, { lettre: 'ba', competence: 'son', contexte: 'parcours-sons', ok: true }); assert.equal(C.nomStade(s, 'ba'), 'son');
  C.enregistrer(s, { lettre: 'ba', competence: 'formes', contexte: 'formes', ok: true }); assert.equal(C.stade(s, 'ba'), 3, 'une seule réussite sur les formes : pas encore');
  C.enregistrer(s, { lettre: 'ba', competence: 'formes', contexte: 'formes', ok: true }); assert.equal(C.nomStade(s, 'ba'), 'maitrise', 'réussites confirmées (reconnaissance, son, formes) dans au moins 3 activités, bon taux récent');
  C.enregistrer(s, { lettre: 'ba', competence: 'reco', contexte: 'chasse', ok: false }); C.enregistrer(s, { lettre: 'ba', competence: 'son', contexte: 'son', ok: false }); C.enregistrer(s, { lettre: 'ba', competence: 'formes', contexte: 'formes', ok: false });
  assert.equal(C.stade(s, 'ba'), 4, 'le taux récent retombe : la lettre repasse à réviser, sans rien perdre des acquis');
});
test('révision intelligente : une confusion déclenche une révision ciblée ; les maîtrisées sont moins répétées', () => {
  const s = C.etatInitial(); for (const id of ['ba', 'ta', 'jim']) C.decouverte(s, id); C.enregistrer(s, { lettre: 'ta', competence: 'reco', contexte: 'chasse', ok: false, confusion: 'ba' }); C.enregistrer(s, { lettre: 'ta', competence: 'reco', contexte: 'chasse', ok: false, confusion: 'ba' });
  assert.deepEqual(C.confusions(s, 1)[0], { a: 'ta', b: 'ba', n: 2 }); assert.equal(C.aReviser(s, 3)[0], 'ta', 'la lettre confondue passe en premier');
  const cible = C.choisirCible(s, () => 0.1, C.disponibles(s)); assert.ok(['ta', 'ba', 'jim'].includes(cible));
});
test('exercices : jamais de lettre jamais vue ; distracteurs bien différents pour les petits, jumelles pour les plus grands', () => {
  const s = C.etatInitial(); assert.deepEqual(C.disponibles(s), []); assert.equal(C.disponibles(s, 0).length, 4, 'le chapitre en cours suffit'); for (const id of ['ba', 'ta', 'tha', 'jim', 'dal']) C.decouverte(s, id);
  C.reglerAge(s, 3); const petit = C.distracteurs(s, 'ba', 2, seed(3)); assert.ok(petit.every(id => D.PAR_ID[id].famille !== 'ba'), 'petits : lettres bien différentes d\'abord');
  C.reglerAge(s, 9); for (const id of ['ba']) { const l = C.lettre(s, id); l.reco.ok = 2; l.reco.contextes = ['a', 'b']; } const grand = C.distracteurs(s, 'ba', 2, seed(3)); assert.ok(grand.every(id => D.PAR_ID[id].famille === 'ba'), 'grands : jumelles ba/ta/tha d\'abord');
  assert.ok(!grand.includes('ba'));
});
test('récompenses recalculées depuis les acquisitions (jamais additionnées) ; diplômes seulement pour de vraies acquisitions', () => {
  const s = C.etatInitial(); let r = C.recompenses(s); assert.equal(r.etoiles, 0); assert.deepEqual(r.diplomes, []);
  const a = C.terminerChapitre(s, 'c1', { aides: 0, erreurs: 0 }); assert.equal(a.etoiles, 3); assert.equal(C.recompenses(s).lanternes, 1); assert.deepEqual(C.recompenses(s), C.recompenses(s), 'recharger ne donne rien en double'); const b = C.terminerChapitre(s, 'c1', { aides: 5, erreurs: 9 }); assert.equal(s.chapitres.c1.etoiles, 3, 'jamais à la baisse'); assert.ok(!b.premiere);
  for (const id of D.IDS) { const l = C.lettre(s, id); l.vue = true; for (const c of ['reco', 'son', 'formes']) { l[c].ok = 3; l[c].contextes = ['a', 'b', 'c']; l[c].recent = [1, 1, 1, 1]; } }
  r = C.recompenses(s); assert.ok(r.diplomes.includes('explorateur') && r.diplomes.includes('maitre')); assert.ok(r.badges.includes('famille-c3')); assert.equal(C.progressionGlobale(s), 100);
});
test('sauvegarde tolérante, sans perte, sans punition après absence', () => {
  assert.deepEqual(C.lire(null), C.etatInitial()); const s = C.lire({ age: 99, groupe: 'g56', niveau: 'x', lettres: { ba: { vue: true, reco: { ok: 3, ko: 1, contextes: ['a', 'a', 'b'], recent: [1, 0, 1, 1, 1, 1, 1, 0] }, conf: { ta: 2, zzz: 5 } }, faux: {} }, chapitres: { c1: { etoiles: 9, fini: 1 }, c99: {} } });
  assert.equal(s.age, 10); assert.equal(s.niveau, null); assert.ok(s.lettres.ba.vue && s.lettres.ba.reco.contextes.length === 2 && s.lettres.ba.reco.recent.length === 6); assert.deepEqual(s.lettres.ba.conf, { ta: 2 }); assert.equal(s.chapitres.c1.etoiles, 3); assert.ok(!s.lettres.faux);
  assert.deepEqual(C.lire(JSON.parse(JSON.stringify(s))), s, 'aller-retour sans perte'); assert.ok(!/Date|temps|jours/i.test(JSON.stringify(Object.keys(s))), 'aucune horloge : jamais de perte pour absence');
});
test('inventaire audio : ids uniques, voix par rôle (nour, loumi, narratrice), arabe à valider, aucun mot de synthèse du navigateur', () => {
  const inv = A.inventaire(), ids = inv.map(p => p.id); assert.equal(new Set(ids).size, ids.length); assert.equal(inv.filter(p => p.langue === 'ar').length, 28 * 3);
  for (const p of inv) assert.ok(['nour', 'loumi', 'narratrice'].includes(p.role), p.id); for (const l of D.LETTRES) for (const k of ['nom', 'son', 'mot', 'motfr']) assert.ok(ids.includes(`${k}.${l.id}`));
  const roles = JSON.parse(fs.readFileSync(path.join(RACINE, 'outils/voix/jeux/voix-roles.json'), 'utf8')); assert.equal(roles.nour, '7FhMHxpv3kwYS7eBOJoC'); assert.notEqual(roles.nour, roles.loumi);
});
