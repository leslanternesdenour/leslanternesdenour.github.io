// Voix des jeux : SEULES les 10 voix « Nour - … » du compte ElevenLabs sont autorisées. Aucune voix extérieure (ex. voix professionnelles), aucune création.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path';
const RACINE = path.resolve(new URL('../..', import.meta.url).pathname), lire = f => JSON.parse(fs.readFileSync(path.join(RACINE, f), 'utf8'));
const NOUR = lire('outils/voix/jeux/voix-nour.json'), ROLES = lire('outils/voix/jeux/voix-roles.json'), IDS = new Set(NOUR.voix.map(v => v.id));
const JEUX = ['chasse-aux-mots', 'mysteres-desert', 'quiz-nour', 'ecole-lettres', 'ecole-lecture'].filter(j => fs.existsSync(path.join(RACINE, `audio/jeux/${j}/manifeste.json`)));

test('exactement 10 voix « Nour » autorisées, toutes nommées « Nour - … », identifiants uniques', () => {
  assert.equal(NOUR.voix.length, 10); assert.equal(IDS.size, 10); for (const v of NOUR.voix) assert.match(v.nom, /^Nour - /);
  assert.equal(NOUR.voix.find(v => v.id === 'hddT377hAwvRoOKqMj0E').nom, 'Nour - Narratrice (maitresse)', 'la narratrice existante est inchangée');
});
test('chaque rôle des jeux utilise une des 10 voix ; la voix de la mascotte Nour n\'est attribuée à aucun rôle des jeux', () => {
  const roles = Object.entries(ROLES).filter(([k, v]) => typeof v === 'string' && !k.startsWith('_'));
  assert.ok(roles.length >= 10); for (const [k, v] of roles) assert.ok(IDS.has(v), `rôle ${k} : voix hors des 10 voix Nour`);
  assert.ok(!roles.some(([k, v]) => v === NOUR.reservee_a_nour && k !== 'nour'), 'la voix de Nour (mascotte) reste réservée à Nour : seul le rôle « nour » peut l\'utiliser');
  assert.notEqual(ROLES.loumi, NOUR.reservee_a_nour, 'Loumi est indépendante de Nour');
});
test('les audios des trois jeux : chacun a été généré avec la voix de son rôle, parmi les 10 voix Nour (aucune voix extérieure)', () => {
  for (const j of JEUX) for (const p of lire(`audio/jeux/${j}/manifeste.json`).phrases) { if (!p.fichier) continue; assert.ok(IDS.has(p.voixId), `${j}/${p.id} : voix extérieure ${p.voixId}`); assert.equal(p.voixId, ROLES[p.role], `${j}/${p.id}`); }
});
test('aucune trace d\'une voix extérieure dans la configuration', () => {
  const tout = ['outils/voix/jeux/voix-roles.json', 'outils/voix/jeux/produire.mjs'].map(f => fs.readFileSync(path.join(RACINE, f), 'utf8')).join('\n'); assert.ok(!/kSNoLVC4Ox0vkBz1IKux/.test(tout.replace(/«[^»]*»/g, '')) || /remplace/.test(tout), 'Damien Doré ne doit plus être attribué');
  assert.ok(!Object.values(ROLES).includes('kSNoLVC4Ox0vkBz1IKux'));
});
test('le script de production refuse toute voix hors des 10 voix et vérifie leur présence dans le compte avant de générer', () => {
  const s = fs.readFileSync(path.join(RACINE, 'outils/voix/jeux/produire.mjs'), 'utf8'); assert.match(s, /REFUSÉ/); assert.match(s, /AUTORISEES/); assert.match(s, /introuvable ou renommée/); assert.ok(!/\/v1\/voices\/add|\/v1\/voices\/[^'"]*\/delete/.test(s), 'ne crée ni ne supprime aucune voix');
});
