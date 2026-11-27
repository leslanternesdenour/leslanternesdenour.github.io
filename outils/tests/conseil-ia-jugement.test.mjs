// Conseil IA : la réponse retenue est la mieux démontrée (preuves retrouvées dans les fichiers), quel que soit le modèle.
import test from 'node:test'; import assert from 'node:assert/strict';

const jugement = () => import('../conseil-ia/lib/jugement.mjs');
export const documents = [{ chemin: 'a.js', contenu: 'let total = 0;\nfor (const p of prix) total = p;\nreturn total;\n' }];
export const constat = (extra = {}) => ({ gravite: 'haute', categorie: 'c', fichier: 'a.js', ligne: 2, constat: 'Le total est écrasé', preuve: 'La ligne `total = p;` remplace au lieu d\'ajouter', recommandation: 'utiliser +=', confiance: 'haute', ...extra });
export const analyse = (verdict, constats) => ({ verdict, resume: 'r', constats, non_verifie: [] });

test('preuves : un constat n\'est ancré que si le fichier, la ligne et un extrait cité se retrouvent vraiment', async () => {
  const { noter } = await jugement();
  const n = noter(analyse('bloquant', [
    constat(),
    constat({ preuve: 'total = p', ligne: 2 }),
    constat({ preuve: 'La ligne `total.reset()` remet à zéro' }),
    constat({ ligne: 400 }),
    constat({ fichier: 'inconnu.js' }),
  ]), documents);
  assert.deepEqual(n.constats.map(c => c.ancre), [true, true, false, false, false]);
  assert.equal(n.score, 0.4);
  assert.equal(noter(analyse('ok', []), documents).score, null, 'rien à démontrer : pas de note');
});

test('comparaison : le désaccord important déclenche l\'arbitrage, et la mieux démontrée est retenue sans regarder le nom', async () => {
  const { comparer } = await jugement();
  const comparer2 = (a, b, noms = ['claude', 'gpt']) => comparer([{ agent: noms[0], rapport: a }, { agent: noms[1], rapport: b }], documents);
  const juste = analyse('bloquant', [constat()]), vague = analyse('reserves', [constat({ ligne: 300, gravite: 'basse' })]);
  assert.equal(comparer2(juste, vague).retenue, 'claude'); assert.equal(comparer2(vague, juste).retenue, 'gpt');
  assert.equal(comparer2(juste, juste).retenue, null, 'à égalité, personne n\'est préféré');
  assert.equal(comparer2(juste, juste).desaccordImportant, false);
  const oppose = comparer2(juste, analyse('ok', []));
  assert.equal(oppose.desaccordImportant, true); assert.match(oppose.motifs.join(' '), /verdicts opposés/); assert.equal(oppose.retenue, null, 'une analyse sans constat n\'a pas de note');
  const isole = comparer2(analyse('reserves', [constat()]), analyse('reserves', []));
  assert.equal(isole.desaccordImportant, true); assert.match(isole.motifs.join(' '), /signalé par claude seul/);
  const ecart = comparer2(analyse('reserves', [constat({ gravite: 'critique' })]), analyse('reserves', [constat({ gravite: 'basse' })]));
  assert.match(ecart.motifs.join(' '), /écart de gravité/);
  assert.equal(comparer2(analyse('ok', []), analyse('reserves', [constat({ gravite: 'info' })])).desaccordImportant, false);
});
