// Accès au jeu : la garde affiche l'écran de connexion avec retour vers la page voulue.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';

test('garde d\'accès : après la connexion, le visiteur retrouve la page qu\'il voulait ouvrir (paramètre retour)', () => {
  const js = fs.readFileSync(new URL('../../compte/acces.js', import.meta.url), 'utf8');
  assert.match(js, /\?retour=' \+ encodeURIComponent\(retour\)/);
});

const lire = () => fs.readFileSync(new URL('../../compte/acces.js', import.meta.url), 'utf8');

test('garde d\'accès : le visiteur peut se connecter, créer un compte ou voir la présentation du village', () => {
  const js = lire(); assert.match(js, /#connexion/); assert.match(js, /#inscription/); assert.match(js, /decouvrir\//);
});

test('garde d\'accès : inactive dans un cadre du village, et jamais bloquante si les comptes ne sont pas ouverts', () => {
  const js = lire(); assert.match(js, /window\.top !== window/); assert.match(js, /typeof j\.connecte === 'boolean'/);
});

test('garde d\'accès : la décision vient de la logique testée, l\'écran est une vraie boîte de dialogue accessible', () => {
  const js = lire(); assert.match(js, /AccesLogique\.decision\(/); assert.match(js, /role', 'dialog'/); assert.match(js, /aria-modal/);
});

test('garde d\'accès : elle n\'écrit rien elle-même (le choix du profil passe par client.js, le serveur décide)', () => {
  const js = lire(); assert.ok(!/localStorage\.setItem/.test(js)); assert.match(js, /choisirEnfant\(/);
});
