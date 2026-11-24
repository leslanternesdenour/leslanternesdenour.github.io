// Davantage de voyageurs dans la cité : quatre habitants fictifs de plus, placés sur les places et la rue sans changer le plan des maisons.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

test('voyageurs : quatre de plus (ancien, boulangère, jeune berger, caravanier), sur les places et la rue, sans modifier le plan des 254 maisons', async () => {
  const { VOYAGEURS_VILLE } = await import('../../voyage/js/route/donnees.js');
  const { maisonsVille, PLACETTES } = await import('../../voyage/js/route/ville-plan.js');
  const { CITE } = await import('../../voyage/js/route/relief.js');
  const { positionSur, longueur } = await import('../../voyage/js/route/voyageurs-plan.js');
  const h = maisonsVille();
  assert.equal(h.length, 254); assert.equal(crypto.createHash('md5').update(JSON.stringify(h)).digest('hex'), 'fd99191d40cc2447b2e2a860dd3db901', 'le plan des maisons n\'a pas bougé');
  const ids = VOYAGEURS_VILLE.map(v => v.id); for (const id of ['ancien-marche', 'boulangere', 'jeune-berger', 'caravanier']) assert.ok(ids.includes(id), id);
  assert.equal(new Set(ids).size, ids.length, 'identifiants uniques'); assert.ok(VOYAGEURS_VILLE.length >= 10);
  const surPlacette = (s, t) => PLACETTES.some(p => Math.hypot(s - p.s, t - p.t) <= p.r * 0.7);
  const surPlace = (s, t) => Math.hypot(s - CITE.s, t - CITE.t) > 24 && Math.hypot(s - CITE.s, t - CITE.t) < CITE.plaza;   // la grande place, hors de la barrière du monument
  for (const id of ['ancien-marche', 'boulangere', 'jeune-berger', 'caravanier']) {
    const v = VOYAGEURS_VILLE.find(x => x.id === id), pts = v.trajet ? Array.from({ length: 21 }, (_, k) => positionSur(v.trajet, longueur(v.trajet) * k / 20)) : [{ s: v.s, t: v.t }];
    for (const p of pts) assert.ok(surPlacette(p.s, p.t) || surPlace(p.s, p.t), `${id} : sur une place dégagée (${p.s.toFixed(0)},${p.t.toFixed(0)})`);
  }
});

test('dialogues : chaque habitant de la cité répond à deux questions (3–5 ans et 6–10 ans), textes sobres et sans religion, une voix par habitant', async () => {
  const { SUJETS_VOYAGEURS } = await import('../../voyage/js/route/textes-route.js');
  const { VOYAGEURS_VILLE } = await import('../../voyage/js/route/donnees.js');
  const { inventaire, normaliserTexte } = await import('../voix/route/inventaire-route.mjs');
  const parTexte = new Map((await inventaire()).map(p => [normaliserTexte(p.texte), p]));
  assert.deepEqual(Object.keys(SUJETS_VOYAGEURS).sort(), VOYAGEURS_VILLE.map(v => v.id).sort(), 'tous les habitants');
  for (const [id, liste] of Object.entries(SUJETS_VOYAGEURS)) {
    assert.equal(liste.length, 2, id); const voix = parTexte.get(normaliserTexte(VOYAGEURS_VILLE.find(v => v.id === id).texte.petit)).role;
    for (const s of liste) {
      assert.ok(s.q.length > 10 && s.q.length <= 40, `${id} : question « ${s.q} »`); assert.ok(s.petit.length > 15 && s.petit.length <= 110 && s.grand.length > 50 && s.grand.length <= 260, `${id} : longueurs`);
      assert.ok(!/(allah|coran|kaaba|zamzam|proph|hadith|prière|mecque|dieu)/i.test(s.q + s.petit + s.grand), `${id} : rien de religieux`);
      for (const t of [s.petit, s.grand]) { const p = parTexte.get(normaliserTexte(t)); assert.ok(p, `${id} : sans voix : ${t.slice(0, 30)}`); assert.equal(p.role, voix, `${id} : la voix de l'habitant`); }
    }
  }
});

test('dialogues : le voyageur propose ses deux questions, la réponse est dite avec sa voix, les questions entendues sont sauvegardées, une petite récompense à huit questions', async () => {
  const fs = await import('node:fs');
  const j = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  const i = j.indexOf('function repondreSujet'); assert.ok(i > 0);
  const f = j.slice(i, i + 1500);
  assert.match(j, /SUJETS_VOYAGEURS\[n\.v\.id\]/); assert.match(j, /petitsBoutons: true/);
  assert.match(f, /R\.vu\.sujets/); assert.match(f, /Object\.keys\(S\)\.length >= 8/); assert.match(f, /!R\.vu\.sujetsRecompense/); assert.match(f, /gagner\('sujets'/); assert.match(f, /Une autre question/);
});

test('dialogues : sur téléphone, le point d\'interrogation d\'une question ne se retrouve jamais seul à la ligne (espace insécable)', async () => {
  const fs = await import('node:fs');
  const j = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  assert.match(j, /s\.q\.replace\(' \?', '\\u00a0\?'\)/);
});
