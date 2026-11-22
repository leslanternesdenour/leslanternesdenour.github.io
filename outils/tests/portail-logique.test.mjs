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
test('voix d\'accueil : texte exact ; AUCUN clip en service tant que le client n\'a pas validé la prononciation ; si un clip est en service, il est validé, présent et cohérent', () => {
  const j = JSON.parse(fs.readFileSync('monde/voix/accueil-portail.json', 'utf8'));
  assert.equal(j.texte, 'مَرْحَبًا ! Bienvenue dans le Monde de Nour !', 'le texte est exactement celui demandé');
  if (j.fichier === null) { assert.equal(j.valide, false, 'sans clip, rien n\'est validé'); assert.ok(!fs.existsSync('monde/voix/accueil-portail.mp3'), 'le clip rejeté ne doit plus être servi'); return; }
  assert.equal(j.valide, true, 'un clip en service doit avoir été validé à l\'oreille par le client');
  assert.match(j.source || '', /lot 22, candidat [BD]\b/, 'seuls les candidats B et D du lot 22 ont été validés par le client (22/11/2026)');
  assert.ok(fs.statSync('monde/voix/' + j.fichier).size > 5000, 'fichier audio présent');
  try { const d = parseFloat(execFileSync('ffprobe', ['-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', 'monde/voix/' + j.fichier]).toString()); assert.ok(Math.abs(d - j.duree) < 0.05, `durée réelle ${d} s ≠ ${j.duree} s`); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  assert.ok(j.coupe > 0.3 && j.coupe < j.finVoix && j.finVoix <= j.duree + 0.01, 'coupe < fin de voix <= durée');
});
test('le clip rejeté (prise 1) est conservé comme source dans les lots, jamais supprimé', () => {
  assert.ok(fs.existsSync('outils/voix/lots/lot21/monde-accueil-portail-prise1.mp3'));
});
test('portail : jamais de synthèse vocale qui parle, aucun fichier musical, pas plus d\'un lecteur de voix (+ la sonde silencieuse)', () => {
  const src = fs.readFileSync('monde/socle/portail.js', 'utf8');
  assert.ok(!/SpeechSynthesisUtterance|\.speak\(/.test(src), 'portail.js ne fait parler aucune voix de synthèse');
  assert.deepEqual(src.match(/['"][^'"]*\.(mp3|ogg|m4a)['"]/g) || [], [], 'aucun fichier sonore codé en dur : la voix vient de accueil-portail.json');
  assert.equal((src.match(/new Audio\(/g) || []).length, 2, 'la voix + la sonde silencieuse de lecture automatique');
});

// ----- RESTAURATION de l'ancien portail (demande du client, 22/11/2026) : l'animation d'origine ne doit pas dériver -----
test('portail restauré : style, porte et lanternes IDENTIQUES à l\'ancienne ouverture (monde/socle/ouverture.js)', () => {
  const ancien = fs.readFileSync('monde/socle/ouverture.js', 'utf8'), nouveau = fs.readFileSync('monde/socle/portail.js', 'utf8');
  const bloc = (t, a, b) => { const i = t.indexOf(a); return t.slice(i, t.indexOf(b, i) + b.length); };
  assert.ok(ancien.includes('var css = ['));
  assert.ok(nouveau.includes(bloc(ancien, '  var css = [', "  ].join('');")), 'CSS d\'origine modifié');
  assert.ok(nouveau.includes(bloc(ancien, '  function lanterneSVG() {', '\n  }\n')), 'dessin de la lanterne modifié');
  assert.ok(nouveau.includes(bloc(ancien, '  // Un battant : bois turquoise', '\n  }\n')), 'dessin de la porte modifié');
});
test('portail restauré : lanternes allumées UNE À UNE du centre vers les côtés (300 ms + 260 ms chacune), porte à 2,2 s, salut à 2,7 s — comme avant', () => {
  const ancien = fs.readFileSync('monde/socle/ouverture.js', 'utf8'), nouveau = fs.readFileSync('monde/socle/portail.js', 'utf8');
  for (const motif of ['var ordre = [3, 2, 4, 1, 5, 0, 6];', '300 + k * 260', 'plus_tard(2200,', "var positions = [4, 18, 32, 50, 68, 82, 96];", "var hauts = [34, 16, 6, 0, 6, 16, 34];"]) { assert.ok(ancien.includes(motif), 'absent de l\'original : ' + motif); assert.ok(nouveau.includes(motif), 'modifié : ' + motif); }
  assert.ok(nouveau.includes('plus_tard(2700,'));
});
test('prototypes conservés : ouverture.js (original) et la porte en bois écartée ne sont jamais supprimés', () => {
  assert.ok(fs.existsSync('monde/socle/ouverture.js')); assert.ok(fs.existsSync('monde/socle/prototypes/portail-porte-animee.js'));
  const idx = fs.readFileSync('monde/index.html', 'utf8'); assert.ok(!/<script[^>]*(prototypes\/|ouverture\.js)/.test(idx), 'les prototypes ne sont pas chargés par la page');
});
