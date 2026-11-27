// Conseil IA : un modèle ne gagne en compétence mesurée que par des constats vérifiés (test exécuté ou contrôle humain).
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path';
import { banc, avecTexte, analyseClaude } from './conseil-ia-banc.mjs';

const commande = () => import('../conseil-ia/conseil.mjs');
const idDossier = texte => texte.match(/Dossier : (\S+)/)[1];
const constat = (n) => ({ gravite: 'moyenne', categorie: 'c', fichier: 'page.js', ligne: 1, constat: `C${n}`, preuve: 'p', recommandation: 'r', confiance: 'haute' });

test('mesures : confirmer demande un test qui échoue, écarter un test qui passe ; sinon une vérification humaine décrite', async () => {
  const { executer } = await commande();
  const b = banc({ reseau: avecTexte({ verdict: 'reserves', resume: 'r', constats: [constat(1), constat(2), constat(3)], non_verifie: [] }) });
  fs.writeFileSync(path.join(b.racine, 'echoue.test.mjs'), "import test from 'node:test'; test('d', () => { throw new Error('défaut reproduit'); });\n");
  fs.writeFileSync(path.join(b.racine, 'passe.test.mjs'), "import test from 'node:test'; test('ok', () => {});\n");
  await executer(['mission', '--mission', 'Trouver le bogue', '--fichier', 'page.js'], b.deps); const id = idDossier(b.texte());
  const juger = (...a) => executer(['juger', '--dossier', id, ...a], b.deps);
  assert.equal(await juger('--constat', 'gpt:1', '--verdict', 'confirme'), 3, 'un avis ne suffit pas');
  assert.equal(await juger('--constat', 'gpt:1', '--verdict', 'confirme', '--test', 'passe.test.mjs'), 3);
  assert.equal(await juger('--constat', 'gpt:1', '--verdict', 'confirme', '--test', 'echoue.test.mjs'), 0, b.texte());
  assert.equal(await juger('--constat', 'gpt:2', '--verdict', 'rejete', '--test', 'passe.test.mjs'), 0, b.texte());
  assert.equal(await juger('--constat', 'gpt:3', '--verdict', 'confirme', '--humain', 'Vérifié à l\'écran par le créateur'), 0);
  assert.equal(await juger('--constat', 'gpt:9', '--verdict', 'confirme', '--humain', 'x'), 3);
  assert.equal(await juger('--constat', 'gpt:3', '--verdict', 'rejete', '--humain', 'Corrigé : fausse alerte'), 0, 'un jugement se corrige sans se cumuler');
  assert.equal(await executer(['tableau'], b.deps), 0); assert.match(b.texte(), /code \| GPT \| 1 mission\(s\) \| 1 confirmé\(s\) \| 2 écarté\(s\) \| taux 33 %/);
});
