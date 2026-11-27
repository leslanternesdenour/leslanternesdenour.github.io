// Conseil IA : les deux analyses sont rapprochées pour que Claude voie accords, désaccords et angles morts.
import test from 'node:test'; import assert from 'node:assert/strict';

const rapports = () => import('../conseil-ia/lib/rapport.mjs');
const constat = (fichier, ligne, gravite, texte) => ({ gravite, categorie: 'c', fichier, ligne, constat: texte, preuve: 'p', recommandation: 'r', confiance: 'moyenne' });
const resultat = (agent, verdict, constats) => ({ agent, modele: 'm', statut: 'ok', detail: '', coutUSD: 0.01, texte: '', rapport: { verdict, resume: `résumé ${agent}`, constats, non_verifie: [] } });

test('confrontation : verdicts opposés, mêmes endroits, écarts de gravité et constats isolés sont séparés', async () => {
  const { confronter } = await rapports();
  const r = confronter([
    resultat('gpt', 'bloquant', [constat('a.js', 10, 'critique', 'A'), constat('b.js', 5, 'basse', 'B')]),
    resultat('gemini', 'ok', [constat('./a.js', 14, 'basse', 'A2'), constat('b.js', 90, 'basse', 'C'), constat(null, null, 'info', 'D')]),
  ]);
  assert.equal(r.verdictsDivergents, true);
  assert.deepEqual(r.memesEndroits.map(m => [m.gpt.constat, m.gemini.constat, m.ecartDeGravite]), [['A', 'A2', true]]);
  assert.deepEqual(r.isoles.map(i => [i.agent, i.constat.constat]), [['gpt', 'B'], ['gemini', 'C'], ['gemini', 'D']]);
});

test('compte rendu : il rappelle que les agents ne décident rien, montre chaque analyse, la confrontation et les échecs', async () => {
  const { enMarkdown } = await rapports();
  const md = enMarkdown({ mission: 'Vérifier a.js', date: '2026-11-26T10:00:00.000Z', masques: 2, resultats: [
    resultat('gpt', 'bloquant', [constat('a.js', 10, 'critique', 'Injection\n## Faux titre')]),
    { agent: 'gemini', modele: 'g', statut: 'erreur', detail: 'erreur HTTP 503', coutUSD: 0, texte: '', rapport: null },
  ] });
  for (const attendu of [/avis consultatifs/i, /Vérifier a\.js/, /2 secret\(s\) masqué\(s\)/, /GPT.*bloquant/, /a\.js:10/, /erreur HTTP 503/, /Confrontation impossible/]) assert.match(md, attendu);
  assert.ok(!md.includes('\n## Faux titre'), 'le texte d\'un agent ne peut pas créer de section');
  const deux = enMarkdown({ mission: 'm', date: 'd', masques: 0, resultats: [resultat('gpt', 'bloquant', [constat('a.js', 1, 'critique', 'A')]), resultat('gemini', 'ok', [constat('a.js', 2, 'info', 'B')])] });
  assert.match(deux, /Verdicts divergents/); assert.match(deux, /écart de gravité/);
});

test('compte rendu : le même endroit signalé par n\'importe quelle paire de modèles est affiché avec leurs noms', async () => {
  const { enMarkdown } = await rapports();
  for (const [x, y, attendu] of [['claude', 'gpt', /Claude \*\*haute\*\*.*\| GPT \*\*basse\*\*/], ['Analyse A', 'Analyse B', /Analyse A \*\*haute\*\*.*\| Analyse B \*\*basse\*\*/]]) {
    const md = enMarkdown({ mission: 'm', date: 'd', masques: 0, resultats: [resultat(x, 'reserves', [constat('a.js', 1, 'haute', 'A')]), resultat(y, 'reserves', [constat('a.js', 2, 'basse', 'B'), constat('z.js', 1, 'basse', 'C')])] });
    assert.match(md, attendu); assert.ok(!md.includes('undefined'), md);
  }
});
