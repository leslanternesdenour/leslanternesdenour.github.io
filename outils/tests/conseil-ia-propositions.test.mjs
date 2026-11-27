// Conseil IA : proposition → contrôle isolé → relecture par un autre modèle → verdict. L'outil n'intègre jamais.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { banc, avecTexte, rapport, empreinte, analyseClaude } from './conseil-ia-banc.mjs';

const commande = () => import('../conseil-ia/conseil.mjs');
const idDossier = texte => texte.match(/Dossier : (\S+)/)[1];
const correctif = 'diff --git a/page.js b/page.js\n--- a/page.js\n+++ b/page.js\n@@ -1 +1 @@\n-let a = 1;\n+let a = 2;\n';
const proposition = { resume: 'a vaut 2', correctif, tests_proposes: [], risques: [] };
const constate = { verdict: 'reserves', resume: 'r', constats: [{ gravite: 'moyenne', categorie: 'c', fichier: 'page.js', ligne: 1, constat: 'a est faux', preuve: '`let a = 1;`', recommandation: 'mettre 2', confiance: 'haute' }], non_verifie: [] };
const essai = "import test from 'node:test'; import assert from 'node:assert'; import fs from 'node:fs'; test('a vaut 2', () => assert.match(fs.readFileSync('page.js', 'utf8'), /a = 2/));\n";

async function preparer(reseau = (url, init) => avecTexte(init.body.includes('PROPOSE UN CORRECTIF') ? proposition : init.body.includes('CORRECTIF À RELIRE') ? rapport : constate)(url)) {
  const { executer } = await commande(); const b = banc({ reseau });
  fs.writeFileSync(path.join(b.racine, 'a-vaut-2.test.mjs'), essai);
  await executer(['mission', '--mission', 'Trouver le bogue', '--fichier', 'page.js'], b.deps);
  return { executer, b, id: idDossier(b.texte()) };
}

test('propositions : un test apporté par le correctif ne prouve rien, et les copies d\'essai sont supprimées', async () => {
  const avecSonTest = { ...proposition, correctif: `${correctif}diff --git a/complaisant.test.mjs b/complaisant.test.mjs\nnew file mode 100644\n--- /dev/null\n+++ b/complaisant.test.mjs\n@@ -0,0 +1 @@\n+import test from 'node:test'; test('toujours vrai', () => {});\n` };
  const { executer, b, id } = await preparer((url, init) => avecTexte(init.body.includes('PROPOSE UN CORRECTIF') ? avecSonTest : constate)(url));
  // Dossier temporaire réservé à cet essai : les autres tests, lancés en parallèle, n'y écrivent pas.
  const reserve = fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-reserve-')), anciens = { TEMP: process.env.TEMP, TMP: process.env.TMP };
  Object.assign(process.env, { TEMP: reserve, TMP: reserve });
  try {
    await executer(['proposer', '--dossier', id], b.deps);
    assert.equal(await executer(['controler', '--dossier', id, '--test', 'complaisant.test.mjs', '--relu'], b.deps), 2, b.texte());
    assert.deepEqual(fs.readdirSync(reserve).filter(n => n.startsWith('ldn-essai-')), []);
  } finally { Object.assign(process.env, anciens); }
  assert.match(b.texte(), /viennent du correctif lui-même/);
  assert.equal(await executer(['tableau'], b.deps), 0); assert.match(b.texte(), /GPT \| 1 mission\(s\) \| 0 confirmé\(s\) \| 0 écarté\(s\)/);
});

test('propositions : un désaccord se tranche par arbitrage ou, sans troisième modèle, par une vérification enregistrée', async () => {
  const { executer } = await commande(); const b = banc({ reseau: avecTexte({ ...rapport, verdict: 'ok' }) });
  await executer(['desactiver', 'gemini'], b.deps);
  await executer(['mission', '--mission', 'Régression à analyser', '--fichier', 'page.js'], b.deps); const id = idDossier(b.texte());
  assert.equal(await executer(['deposer', '--dossier', id, '--fichier', analyseClaude(b)], b.deps), 0, b.texte());
  assert.equal(await executer(['proposer', '--dossier', id], b.deps), 3); assert.match(b.texte(), /désaccord important non tranché/);
  assert.equal(await executer(['arbitrer', '--dossier', id], b.deps), 3); assert.match(b.texte(), /aucun troisième modèle/);
  await executer(['juger', '--dossier', id, '--constat', 'claude:1', '--verdict', 'confirme', '--humain', 'Vérifié par le créateur'], b.deps);
  assert.equal(await executer(['proposer', '--dossier', id, '--auteur', 'gpt'], b.deps), 1, 'la proposition part (le faux réseau répond hors format)'); assert.equal(b.appels.length, 2);
});

test('propositions : le correctif d\'un modèle n\'est prêt qu\'après un test indépendant qui passe et la relecture d\'un autre modèle ; le projet reste intact', async () => {
  const { executer, b, id } = await preparer(), avant = empreinte(b.racine), lancer = (...a) => executer([...a, '--dossier', id], b.deps);
  assert.equal(await lancer('proposer'), 0, b.texte()); assert.match(b.appels[1].url, /openai/); assert.match(b.texte(), /a vaut 2/);
  assert.equal(await lancer('controler', '--test', 'a-vaut-2.test.mjs'), 2); assert.match(b.texte(), /\+let a = 2;[\s\S]*--relu/); assert.match(b.texte(), /PAS PRÊT/);
  assert.equal(await lancer('controler', '--test', 'a-vaut-2.test.mjs', '--relu'), 2, b.texte()); assert.match(b.texte(), /tests : réussis/); assert.match(b.texte(), /relecture par un autre modèle manquante/);
  assert.equal(await lancer('relire', '--agents', 'gpt'), 3); assert.match(b.texte(), /ne relit pas son propre correctif/);
  assert.equal(await lancer('relire', '--agents', 'gemini'), 0, b.texte()); assert.match(b.appels.at(-1).url, /googleapis/);
  assert.match(b.texte(), /\nPRÊT À INTÉGRER/); assert.match(b.texte(), /outils d'édition/);
  assert.equal(empreinte(b.racine), avant);
  assert.equal(await executer(['tableau'], b.deps), 0); assert.match(b.texte(), /code \| GPT \| 1 mission\(s\) \| 1 confirmé\(s\)/);
});
