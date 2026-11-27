// Conseil IA : un correctif proposé par un modèle est filtré, essayé dans une copie isolée, jamais appliqué au projet.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { banc, empreinte } from './conseil-ia-banc.mjs';

const correctifs = () => import('../conseil-ia/lib/correctif.mjs');
export const diff = (fichier, avant, apres) => `diff --git a/${fichier} b/${fichier}\n--- a/${fichier}\n+++ b/${fichier}\n@@ -1 +1 @@\n-${avant}\n+${apres}\n`;
const nouveau = (fichier, ligne = 'x') => `diff --git a/${fichier} b/${fichier}\nnew file mode 100644\n--- /dev/null\n+++ b/${fichier}\n@@ -0,0 +1 @@\n+${ligne}\n`;

test('correctif : appliqué dans une copie sans les fichiers ignorés ; le projet ne change pas', async () => {
  const { essayer } = await correctifs(); const b = banc();
  fs.writeFileSync(path.join(b.racine, '.gitignore'), '.env\n'); fs.writeFileSync(path.join(b.racine, '.env'), 'SECRET=1');
  const avant = empreinte(b.racine);
  const r = essayer(b.racine, diff('page.js', 'let a = 1;', 'let a = 2;'));
  assert.deepEqual(r.fichiers, ['page.js']);
  assert.equal(fs.readFileSync(path.join(r.copie, 'page.js'), 'utf8'), 'let a = 2;\n');
  assert.equal(fs.existsSync(path.join(r.copie, '.env')), false);
  assert.equal(empreinte(b.racine), avant);
  assert.throws(() => essayer(b.racine, diff('page.js', 'autre chose', 'x')), /ne s'applique pas/);
});

test('correctif : refusé s\'il touche aux garde-fous ou à un fichier sensible, sort du projet, renomme, est binaire ou contient une clé', async () => {
  const { essayer } = await correctifs(); const b = banc();
  const cle = 'sk-' + 'proj-' + 'Q1w2E3r4'.repeat(5);
  const interdits = ['.claude/settings.json', '.github/workflows/x.yml', 'outils/conseil-ia/conseil.mjs', 'outils/tests/conseil-ia-garde.test.mjs', 'wrangler.toml', '.gitignore', '.env', 'cles/a.txt', 'CLAUDE.md'];
  for (const f of interdits) assert.throws(() => essayer(b.racine, nouveau(f)), /fichier protégé/, f);
  assert.throws(() => essayer(b.racine, nouveau('../dehors.js')), /ne s'applique pas|fichier protégé/);
  assert.throws(() => essayer(b.racine, nouveau('a.js', `const k = "${cle}";`)), /contient une clé/);
  assert.throws(() => essayer(b.racine, 'diff --git a/page.js b/autre.js\nsimilarity index 100%\nrename from page.js\nrename to autre.js\n'), /renommage, lien ou droits/);
  assert.throws(() => essayer(b.racine, nouveau('lien').replace('100644', '120000')), /renommage, lien ou droits/);
  assert.throws(() => essayer(b.racine, 'diff --git a/i.png b/i.png\nnew file mode 100644\nGIT binary patch\nliteral 1\nIcmZPo\n\n'), /binaire/);
  assert.throws(() => essayer(b.racine, ''), /vide/); assert.throws(() => essayer(b.racine, nouveau('g.js', 'x'.repeat(300_000))), /trop volumineux/);
});

test('bac à sable : les tests tournent dans la copie sans pouvoir écrire dehors, joindre le réseau, lancer un programme ni lire les variables secrètes', async () => {
  const { copier, testerEnBacASable } = await correctifs(); const b = banc(), copie = copier(b.racine);
  const dehors = path.join(b.dossier, 'intrus.txt').replaceAll('\\', '/'), prive = path.join(b.dossier, 'prive.txt').replaceAll('\\', '/'); fs.writeFileSync(prive, 'x');
  fs.writeFileSync(path.join(copie, 'sain.test.mjs'), "import test from 'node:test'; import assert from 'node:assert'; test('sain', () => assert.ok(1));\n");
  assert.equal(testerEnBacASable(copie, ['sain.test.mjs']).code, 0);
  fs.writeFileSync(path.join(copie, 'mechant.test.mjs'), `import test from 'node:test'; import assert from 'node:assert'; import fs from 'node:fs'; import { execSync } from 'node:child_process';
const interdit = e => e.code === 'ERR_ACCESS_DENIED' || e.cause?.code === 'ERR_ACCESS_DENIED';
test('ecrire', () => assert.throws(() => fs.writeFileSync(${JSON.stringify(dehors)}, 'x'), interdit));
test('lire', () => assert.throws(() => fs.readFileSync(${JSON.stringify(prive)}), interdit));
test('programme', () => assert.throws(() => execSync('node -v'), interdit));
test('reseau', () => assert.rejects(fetch('http://127.0.0.1:54321/'), interdit));
test('secrets', () => assert.equal(process.env.OPENAI_API_KEY, undefined));
`);
  process.env.OPENAI_API_KEY = 'ne-doit-pas-passer';
  try { const r = testerEnBacASable(copie, ['mechant.test.mjs']); assert.equal(r.code, 0, r.sortie); } finally { delete process.env.OPENAI_API_KEY; }
  assert.equal(fs.existsSync(dehors), false);
});

test('bac à sable : les bibliothèques installées au-dessus du projet se lisent et les tests ont leur propre dossier temporaire, sans ouvrir le reste', async () => {
  const { testerEnBacASable } = await correctifs();
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-reserve-')), copie = path.join(parent, 'copie'), outil = path.join(parent, 'node_modules', 'outil-essai');
  fs.mkdirSync(copie); fs.mkdirSync(outil, { recursive: true }); fs.writeFileSync(path.join(parent, 'voisin.txt'), 'privé');
  fs.writeFileSync(path.join(outil, 'package.json'), '{"name":"outil-essai","type":"module","main":"i.js"}'); fs.writeFileSync(path.join(outil, 'i.js'), 'export const n = 42;\n');
  fs.writeFileSync(path.join(copie, 'lib.test.mjs'), `import test from 'node:test'; import assert from 'node:assert'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { n } from 'outil-essai';
test('bibliotheque', () => assert.equal(n, 42));
test('temporaire', () => assert.ok(fs.mkdtempSync(path.join(os.tmpdir(), 'x-'))));
test('voisin', () => assert.throws(() => fs.readFileSync(${JSON.stringify(path.join(parent, 'voisin.txt'))}), { code: 'ERR_ACCESS_DENIED' }));
test('bibliotheque non modifiable', () => assert.throws(() => fs.writeFileSync(${JSON.stringify(path.join(outil, 'i.js'))}, ''), { code: 'ERR_ACCESS_DENIED' }));
`);
  const r = testerEnBacASable(copie, ['lib.test.mjs']); assert.equal(r.code, 0, r.sortie);
  fs.rmSync(parent, { recursive: true, force: true });
});
