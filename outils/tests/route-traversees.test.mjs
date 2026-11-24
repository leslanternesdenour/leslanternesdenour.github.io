// Le parcours entre les deux collines : des traversées tranquilles, comptées en douceur (ni course, ni chronomètre, ni classement).
import test from 'node:test';
import assert from 'node:assert/strict';

test('traversées : une traversée compte quand on arrive à l\'AUTRE bout ; rester au même bout ou y revenir ne compte pas', async () => {
  const { suivreTraversee } = await import('../../voyage/js/route/traversees-route.js');
  const s = { dernier: null, n: 0 };
  assert.equal(suivreTraversee(s, null), false); assert.equal(suivreTraversee(s, 'a'), false); assert.equal(s.n, 0, 'le départ ne compte pas');
  assert.equal(suivreTraversee(s, 'a'), false, 'rester au même bout');
  assert.equal(suivreTraversee(s, 'b'), true); assert.equal(s.n, 1);
  assert.equal(suivreTraversee(s, 'b'), false); assert.equal(s.n, 1);
  assert.equal(suivreTraversee(s, 'a'), true); assert.equal(s.n, 2, 'le retour est une traversée aussi');
  assert.equal(suivreTraversee(s, null), false); assert.equal(s.dernier, 'a', 'entre les deux bouts, rien ne change');
});

test('traversées : deux messages doux et dits par la narratrice, jamais de pression ni de classement', async () => {
  const { MESSAGES } = await import('../../voyage/js/route/textes-route.js');
  const { inventaire, normaliserTexte } = await import('../voix/route/inventaire-route.mjs');
  const parTexte = new Map((await inventaire()).map(p => [normaliserTexte(p.texte), p]));
  for (const k of ['traversee', 'traversees3']) {
    const t = MESSAGES[k]; assert.ok(t && t.length > 15 && t.length <= 120, k);
    assert.ok(!/(vite|record|meilleur|classement|chrono|score|temps)/i.test(t), `${k} : aucune pression`);
    assert.ok(parTexte.get(normaliserTexte(t)), `${k} : sans voix`); assert.equal(parTexte.get(normaliserTexte(t)).role, 'narratrice');
  }
});

test('traversées : le parcours est branché sur les deux collines, sauvegardé, récompensé une seule fois, sans aucun chronomètre', async () => {
  const fs = await import('node:fs');
  const j = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  const i = j.indexOf('function parcoursCollines'); assert.ok(i > 0, 'fonction du parcours');
  const f = j.slice(i, j.indexOf('// les haltes du sentier', i));
  assert.match(j, /suivreTraversee/); assert.match(f, /suivreTraversee\(S, bout\)/); assert.match(f, /R\.vu\.trav/); assert.match(f, /!R\.vu\.travRecompense/); assert.match(f, /gagner\('traversees'/);
  assert.match(j, /cite-colline-a/); assert.match(j, /parcoursCollines\(\);/, 'appelé à chaque image sur la Route');
  assert.ok(!/(performance\.now|Date\.now|chrono)/.test(f), 'aucun chronomètre');
});
