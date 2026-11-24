// Garde serveur des pages de jeu : sans compte parent connecté, ou si le système de comptes est indisponible, les pages de jeu ne sont jamais servies. L'accueil et les pages publiques ne sont jamais bloqués.
import test from 'node:test'; import assert from 'node:assert/strict';
import { estPageProtegee, garde, PAGES_PROTEGEES } from '../../serveur/garde-pages.js';
import { creerSession } from '../../serveur/session.js';

const SECRET = 'secret-de-test-tres-long-0123456789abcdef', T = Date.UTC(2026, 10, 24, 12);
const env = { SESSION_SECRET: SECRET, FIREBASE_PROJET: 'ldn-test', FIREBASE_COMPTE_SERVICE: '{"x":1}' };
const requete = (chemin, cookie) => new Request('https://preprod.exemple' + chemin, { headers: cookie ? { Cookie: cookie } : {} });
const cookieValide = async (maintenant = T) => 'ldn_session=' + encodeURIComponent(await creerSession({ uid: 'u1', email: 'p@exemple.fr', emailVerifie: true, authTime: Math.floor(maintenant / 1000) }, SECRET, maintenant));

test('garde : la page du village est protégée', () => {
  assert.equal(estPageProtegee('/monde/'), true);
});

test('garde : toutes les pages de jeu (village, Voyage, ablutions et prière 2D/3D, calendrier, Aventures, École arabe) sont protégées, avec ou sans barre finale ou index.html', () => {
  for (const p of ['/monde', '/monde/index.html', '/voyage/', '/ablutions/', '/ablutions/jeu3d/', '/ablutions/jeu3d/index.html', '/priere/', '/priere/jeu3d', '/calendrier/', '/aventures/', '/aventures/chasse-aux-mots/', '/aventures/mysteres-desert/', '/aventures/quiz-nour', '/ecole-arabe/', '/ecole-arabe/lettres/', '/ecole-arabe/lecture/index.html', '/ecole-arabe/chiffres/', '/ecole-arabe/chiffres/index.html']) assert.equal(estPageProtegee(p), true, p);
  assert.equal(PAGES_PROTEGEES.length, 15);
});

test('garde : l\'accueil, les pages publiques, l\'API et les ressources ne sont jamais protégés', () => {
  for (const p of ['/', '/index.html', '/decouvrir/', '/soutenir/', '/conditions/', '/compte/', '/tarifs/', '/api/moi', '/monde/village.js', '/voyage/js/main.js', '/ablutions/jeu3d/jeu.js', '/ecole-arabe/lettres/jeu.js', '/aventures/commun/base.js', '/mondes/']) assert.equal(estPageProtegee(p), false, p);
});

test('garde : une page publique passe toujours, même si les comptes sont indisponibles', async () => {
  assert.equal((await garde(requete('/decouvrir/'), {}, T)).action, 'passer');
  assert.equal((await garde(requete('/'), {}, T)).action, 'passer');
});

test('garde : comptes non configurés (secret, projet ou compte de service absent) : la page de jeu est refusée, jamais servie', async () => {
  for (const manque of ['SESSION_SECRET', 'FIREBASE_PROJET', 'FIREBASE_COMPTE_SERVICE']) {
    const e = { ...env }; delete e[manque];
    assert.equal((await garde(requete('/monde/', await cookieValide()), e, T)).action, 'indisponible', 'sans ' + manque);
  }
  assert.equal((await garde(requete('/voyage/'), {}, T)).action, 'indisponible');
});

test('garde : sans session, redirection vers la connexion avec retour vers la page demandée', async () => {
  const r = await garde(requete('/ablutions/?x=1'), env, T);
  assert.equal(r.action, 'rediriger'); assert.equal(r.location, '/compte/?retour=' + encodeURIComponent('/ablutions/?x=1') + '#connexion');
});

test('garde : une session valide laisse passer', async () => {
  assert.equal((await garde(requete('/monde/', await cookieValide()), env, T)).action, 'passer');
});

test('garde : session expirée, falsifiée ou illisible : redirection vers la connexion', async () => {
  const vieux = await cookieValide(T - 6 * 24 * 3600 * 1000);
  assert.equal((await garde(requete('/monde/', vieux), env, T)).action, 'rediriger', 'expirée');
  const bon = await cookieValide(); const faux = bon.slice(0, -4) + 'AAAA';
  assert.equal((await garde(requete('/monde/', faux), env, T)).action, 'rediriger', 'falsifiée');
  assert.equal((await garde(requete('/monde/', 'ldn_session=n-importe-quoi'), env, T)).action, 'rediriger', 'illisible');
});

test('garde : session valide mais adresse e-mail non vérifiée : la page de jeu est refusée et le parent est renvoyé vers l\'Espace famille (état de vérification)', async () => {
  const nv = 'ldn_session=' + encodeURIComponent(await creerSession({ uid: 'u2', email: 'p2@exemple.fr', emailVerifie: false, authTime: Math.floor(T / 1000) }, SECRET, T));
  const r = await garde(requete('/voyage/', nv), env, T);
  assert.equal(r.action, 'rediriger');
  assert.equal(r.location, '/compte/?retour=' + encodeURIComponent('/voyage/') + '&verification=1#verification');
  assert.equal((await garde(requete('/monde/', await cookieValide()), env, T)).action, 'passer', 'e-mail vérifié : la page passe');
  assert.equal((await garde(requete('/decouvrir/', nv), env, T)).action, 'passer', 'les pages publiques ne sont jamais bloquées');
});
