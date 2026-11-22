// Règles du portail : une fois par session de jeu, synchronisation sur la voix, profil enfant sans écrasement.
import test from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const L = createRequire(import.meta.url)('../../monde/socle/portail-logique.js');
const A = { id: 'abc123', surnom: 'Aïcha', tranche: '3-5', avatar: 'fille' }, B = { id: 'zzz999', surnom: 'Yanis', tranche: '6-10', avatar: 'garcon' };

test('première arrivée (rien en session) : le portail s\'affiche, pour un visiteur comme pour un enfant', () => {
  assert.equal(L.doitAfficher({ session: null, profil: null }), true);
  assert.equal(L.doitAfficher({ session: null, profil: A }), true);
});
test('même onglet, même enfant (changement de page, retour d\'un mini-jeu, rechargement) : pas de portail', () => {
  assert.equal(L.doitAfficher({ session: L.cleProfil(A), profil: A }), false);
  assert.equal(L.doitAfficher({ session: L.cleProfil(null), profil: null }), false);
});
test('un AUTRE enfant choisi par le parent : nouvelle session de jeu, le portail revient', () => {
  assert.equal(L.doitAfficher({ session: L.cleProfil(A), profil: B }), true);
});
test('on passe de visiteur à enfant connecté (nouvelle connexion) : le portail revient', () => {
  assert.equal(L.doitAfficher({ session: L.cleProfil(null), profil: A }), true);
});
test('« Entrer dans le monde » de l\'Espace famille (?ouverture=1) force le portail', () => {
  assert.equal(L.doitAfficher({ forcer: true, session: L.cleProfil(A), profil: A }), true);
});
test('la valeur « * » (tests automatiques) passe le portail pour tout le monde, sauf quand on le force', () => {
  assert.equal(L.doitAfficher({ session: '*', profil: A }), false);
  assert.equal(L.doitAfficher({ forcer: true, session: '*', profil: A }), true);
});

const CUES = { coupe: 1.12, finVoix: 3.26 };
test('avant la voix : portes fermées, aucun texte', () => {
  const e = L.etatSynchro(-1, CUES); assert.equal(e.portes, 0); assert.equal(e.ar, false); assert.equal(e.fr, false); assert.equal(e.fini, false);
});
test('« مَرْحَبًا » : le mot arabe est affiché, pas encore le français ; les portes bougent à peine', () => {
  const e = L.etatSynchro(0.5, CUES); assert.equal(e.ar, true); assert.equal(e.fr, false); assert.ok(e.portes > 0 && e.portes < 0.25, 'portes ' + e.portes);
});
test('« Bienvenue dans le Monde de Nour » : le français apparaît à la coupure de la voix', () => {
  assert.equal(L.etatSynchro(1.0, CUES).fr, false); assert.equal(L.etatSynchro(1.1, CUES).fr, true);
});
test('les portes s\'ouvrent progressivement et ne reculent jamais, la lumière monte avec elles', () => {
  let avant = -1, lumAvant = -1;
  for (let t = 0; t <= 3.5; t += 0.05) { const e = L.etatSynchro(t, CUES); assert.ok(e.portes >= avant - 1e-9, `recul à t=${t}`); assert.ok(e.lumiere >= lumAvant - 1e-9); avant = e.portes; lumAvant = e.lumiere; }
  assert.ok(Math.abs(L.etatSynchro(3.26, CUES).portes - 1) < 1e-9, 'portes entièrement ouvertes à la dernière syllabe');
  assert.equal(L.etatSynchro(3.26, CUES).fini, true); assert.equal(L.etatSynchro(3.0, CUES).fini, false);
  assert.ok(L.etatSynchro(1.63, CUES).portes > 0.3 && L.etatSynchro(1.63, CUES).portes < 0.7, 'à mi-parcours, portes à moitié ouvertes');
});

test('profil enfant 3-5 ans fille, rien d\'enregistré : âge « petits » et personnage « fille » proposés', () => {
  assert.deepEqual(L.reglagesDepuisProfil(A, { age: null }), { age: 'petits', genre: 'fille' });
  assert.deepEqual(L.reglagesDepuisProfil(B, { age: null }), { age: 'grands', genre: 'garcon' });
});
test('RIEN n\'est jamais écrasé : l\'âge et le personnage déjà enregistrés gardent la priorité', () => {
  assert.deepEqual(L.reglagesDepuisProfil(B, { age: 'petits', personnage: { genre: 'fille' } }), { age: null, genre: null });
  assert.deepEqual(L.reglagesDepuisProfil(B, { age: 'petits' }), { age: null, genre: 'garcon' });
});
test('sans profil enfant : aucun réglage proposé, pas d\'entrée directe', () => {
  assert.deepEqual(L.reglagesDepuisProfil(null, {}), { age: null, genre: null }); assert.equal(L.entreeDirecte(null, { age: 'petits' }), false);
});
test('entrée directe (sans « Qui joue ? ») seulement pour un profil enfant dont l\'âge est connu', () => {
  assert.equal(L.entreeDirecte(A, { age: null }), true); assert.equal(L.entreeDirecte(A, { age: 'grands' }), true);
  assert.equal(L.entreeDirecte({ id: 'x', tranche: 'bizarre' }, { age: null }), false);
});

// ----- la voix d'accueil et ses repères de synchronisation -----
import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
test('voix d\'accueil : le fichier existe et ses repères (durée, coupe, fin de voix) sont cohérents avec le vrai audio', () => {
  const j = JSON.parse(fs.readFileSync('monde/voix/accueil-portail.json', 'utf8'));
  assert.equal(j.texte, 'مَرْحَبًا ! Bienvenue dans le Monde de Nour !', 'le texte est exactement celui demandé');
  assert.ok(fs.statSync('monde/voix/accueil-portail.mp3').size > 5000, 'fichier audio présent');
  try { const d = parseFloat(execFileSync('ffprobe', ['-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', 'monde/voix/accueil-portail.mp3']).toString());
    assert.ok(Math.abs(d - j.duree) < 0.05, `durée réelle ${d} s ≠ ${j.duree} s`); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  assert.ok(j.coupe > 0.4 && j.coupe < j.finVoix && j.finVoix <= j.duree, 'coupe < fin de voix <= durée');
  assert.ok(j.finVoix - j.coupe > 1, '« Bienvenue dans le Monde de Nour » dure plus d\'une seconde');
});
test('voix d\'accueil : jamais de synthèse du navigateur pour l\'arabe (le portail ne lit rien tout seul)', () => {
  const src = fs.readFileSync('monde/socle/portail.js', 'utf8');
  assert.ok(!/speechSynthesis|SpeechSynthesisUtterance/.test(src), 'portail.js n\'utilise aucune voix de synthèse');
  assert.deepEqual([...new Set(src.match(/[\w\/.-]+\.(mp3|ogg|wav|m4a)/g) || [])], ['voix/accueil-portail.mp3'], 'aucun autre fichier sonore (ni musique) dans le portail');
  assert.equal((src.match(/new Audio\(/g) || []).length, 1, 'un seul lecteur audio');
});
