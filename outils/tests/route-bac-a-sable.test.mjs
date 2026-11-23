// Les essais ne doivent JAMAIS toucher aux progressions des profils réels : mode « bac à sable » (?sandbox=1), local ou préproduction seulement.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';

test('bac à sable : actif seulement avec ?sandbox=1 et seulement en local ou en préproduction (jamais sur le vrai site)', async () => {
  const { sandboxActif } = await import('../../voyage/js/route/bac-a-sable.js');
  assert.equal(sandboxActif('localhost', '?sandbox=1'), true);
  assert.equal(sandboxActif('preproduction.lanternes-de-nour.pages.dev', '?x=2&sandbox=1'), true);
  assert.equal(sandboxActif('localhost', ''), false);
  assert.equal(sandboxActif('localhost', '?sandbox=0'), false);
  assert.equal(sandboxActif('leslanternesdenour.fr', '?sandbox=1'), false, 'sur le vrai site, jamais');
});

test('bac à sable : les clés du jeu sont rangées sous un préfixe, les vraies clés ne sont ni lues ni écrites', async () => {
  const { envelopperStockage } = await import('../../voyage/js/route/bac-a-sable.js');
  const reel = new Map([['monde_voyage', '{"vrai":true}'], ['monde', '{"profil":"reel"}']]);
  const brut = { getItem: k => reel.has(k) ? reel.get(k) : null, setItem: (k, v) => reel.set(k, String(v)), removeItem: k => reel.delete(k) };
  const s = envelopperStockage(brut);
  assert.equal(s.getItem('monde_voyage'), null, 'le profil réel est invisible dans le bac à sable');
  s.setItem('monde_voyage', '{"essai":1}');
  assert.equal(s.getItem('monde_voyage'), '{"essai":1}');
  assert.equal(reel.get('monde_voyage'), '{"vrai":true}', 'le profil réel n\'est pas modifié');
  assert.equal(reel.get('sandbox:monde_voyage'), '{"essai":1}');
  s.removeItem('monde'); assert.equal(reel.get('monde'), '{"profil":"reel"}', 'supprimer dans le bac à sable ne supprime rien de réel');
});

test('bac à sable : aucune écriture vers le serveur (comptes, synchronisation, /api) ; la lecture reste possible', async () => {
  const { creerFetchProtege } = await import('../../voyage/js/route/bac-a-sable.js');
  const appels = [];
  const f = creerFetchProtege((u, o) => { appels.push([String(u), (o && o.method) || 'GET']); return Promise.resolve('ok'); });
  assert.equal(await f('/api/premium'), 'ok', 'lire reste possible');
  await assert.rejects(() => f('/api/compte/synchro', { method: 'POST' }), /bac à sable/);
  await assert.rejects(() => f('https://leslanternesdenour.fr/api/x', { method: 'PUT' }), /bac à sable/);
  await assert.rejects(() => f(new Request('http://localhost/api/compte', { method: 'DELETE' })), /bac à sable/);
  assert.equal(await f('/images/a.png', { method: 'POST' }), 'ok', 'hors /api : inchangé');
  assert.deepEqual(appels.map(a => a[1]), ['GET', 'POST'], 'rien d\'interdit n\'est parti');
});

test('bac à sable : installé en tout premier dans main.js, avant que le jeu ou le compte ne lise le stockage', () => {
  const m = fs.readFileSync(new URL('../../voyage/js/main.js', import.meta.url), 'utf8');
  const imports = m.split(/\r?\n/).filter(l => l.startsWith('import '));
  assert.match(imports[0], /route\/bac-a-sable-demarrage\.js/, 'premier import du module principal : les imports s\'exécutent dans l\'ordre');
  const d = fs.readFileSync(new URL('../../voyage/js/route/bac-a-sable-demarrage.js', import.meta.url), 'utf8');
  assert.match(d, /installerBacASable\(\)/, 'le module de démarrage installe le bac à sable dès son évaluation');
});

test('bac à sable : en place AVANT la synchronisation du compte (compte/synchro.js) dans la page du Grand Voyage', () => {
  const h = fs.readFileSync(new URL('../../voyage/index.html', import.meta.url), 'utf8');
  const a = h.indexOf('js/route/bac-a-sable-demarrage.js'), b = h.indexOf('compte/synchro.js');
  assert.ok(a > 0 && b > 0 && a < b, 'le bac à sable doit précéder synchro.js');
});
