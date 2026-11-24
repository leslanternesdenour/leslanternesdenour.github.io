// Espace famille : l'adresse e-mail du parent doit être vérifiée avant les profils enfants et le jeu ; la page vérifie toute seule et gère le renvoi du lien.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = () => fs.readFileSync(new URL('../../compte/index.html', import.meta.url), 'utf8');

test('espace famille : tant que l\'adresse n\'est pas vérifiée, seuls l\'état de vérification et la sécurité du compte sont affichés (pas de profils enfants)', () => {
  assert.match(page(), /if \(!D\.emailVerifie\) \{ voir\('v-espace', 'v-securite'\); surveillerVerification\(\); return; \}/);
});

test('espace famille : la page vérifie toute seule (toutes les 8 s et au retour sur l\'onglet) et débloque sans rien demander au parent', () => {
  const h = page();
  assert.match(h, /setInterval\(/); assert.match(h, /visibilitychange/); assert.match(h, /email_verified/);
  assert.match(h, /Adresse validée/); assert.match(h, /arreterSurveillance\(\)/);
});

test('espace famille : le renvoi du lien a un compte à rebours de 60 s et gère la limite de Firebase avec un message clair', () => {
  const h = page();
  assert.match(h, /ldn_verif_envoi/); assert.match(h, /Renvoyer le lien \(/); assert.match(h, /auth\/too-many-requests/); assert.match(h, /Patientez/);
});

test('inscription : le premier envoi du lien lance le compte à rebours du renvoi (pas de « Trop d\'essais » immédiat)', () => {
  const c = fs.readFileSync(new URL('../../compte/client.js', import.meta.url), 'utf8');
  assert.match(c, /sendEmailVerification\(c\.user\);[^\n]*ldn_verif_envoi/);
});

test('espace famille : le texte explique que le jeu reste fermé tant que l\'adresse n\'est pas vérifiée et que la page se met à jour toute seule', () => {
  const h = page();
  assert.match(h, /le jeu reste fermé/i); assert.match(h, /se met à jour toute seule/);
});
