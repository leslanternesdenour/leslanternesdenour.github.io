// E-mails d'authentification (vérification de l'adresse, mot de passe oublié) : toujours en français, avec un lien de retour vers le site.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';

const client = () => fs.readFileSync(new URL('../../compte/client.js', import.meta.url), 'utf8');

test('e-mails : Firebase est réglé sur le français dès l\'initialisation, donc avant tout envoi (vérification, mot de passe oublié, renvoi)', () => {
  const c = client(); const i = c.indexOf('async function firebase()'); assert.ok(i > 0);
  const f = c.slice(i, c.indexOf('\n}', i));
  assert.match(f, /a\.languageCode = 'fr'/);
  assert.ok(f.indexOf("a.languageCode = 'fr'") > f.indexOf('getAuth('), 'après la création de l\'authentification');
});

test('e-mails : chaque envoi (inscription, renvoi, mot de passe oublié) porte un lien de retour vers le site, avec repli sans lien si le domaine n\'est pas autorisé', () => {
  const c = client();
  assert.match(c, /function reglagesLien\(/); assert.match(c, /async function envoyerAvecRepli\(/);
  assert.match(c, /auth\/unauthorized-continue-uri/);
  assert.match(c, /envoyerAvecRepli\([^)]*sendEmailVerification\(c\.user[^\n]*'\/compte\/\?verifie=1'/);
  assert.match(c, /envoyerAvecRepli\([^)]*sendEmailVerification\(a\.currentUser[^\n]*'\/compte\/\?verifie=1'/);
  assert.match(c, /envoyerAvecRepli\([^)]*sendPasswordResetEmail\(a, email[^\n]*'\/compte\/#connexion'/);
});

test('e-mails : le premier envoi lance toujours le compte à rebours du renvoi', () => {
  assert.match(client(), /'\/compte\/\?verifie=1'\);[^\n]*ldn_verif_envoi/);
});

test('espace famille : au retour du lien (?verifie=1), la page vérifie tout de suite et accueille le parent en français, connecté ou non', () => {
  const h = fs.readFileSync(new URL('../../compte/index.html', import.meta.url), 'utf8');
  assert.match(h, /params\.get\('verifie'\) === '1'/); assert.match(h, /Votre adresse e-mail est validée/);
});
