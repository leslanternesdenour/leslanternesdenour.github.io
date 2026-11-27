// Reporter node:test pour tdd-guard : écrit les résultats dans test.json (le seul endroit où le hook lit les tests).
// Usage : node --test --test-reporter=./ablutions/jeu3d/tdd-guard-node-reporter.mjs ablutions/jeu3d/doigt.test.js
// Le dossier de données est celui de la session Claude Code (CLAUDE_PROJECT_DIR) ; TDD_GUARD_DATA_DIR peut le remplacer.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR = process.env.TDD_GUARD_DATA_DIR || 'C:\\Users\\zakar\\.claude\\backups\\.claude\\tdd-guard\\data';

export default async function* reporter(source) {
  const modules = new Map();   // fichier -> tests
  let echec = false;
  for await (const { type, data } of source) {
    if (type !== 'test:pass' && type !== 'test:fail') continue;
    if (data.details && data.details.type === 'suite') continue;
    const file = data.file ? (data.file.startsWith('file:') ? fileURLToPath(data.file) : data.file) : 'inconnu';
    if (!modules.has(file)) modules.set(file, []);
    const etat = data.skip || data.todo ? 'skipped' : type === 'test:pass' ? 'passed' : 'failed';
    const test = { name: data.name, fullName: data.name, state: etat };
    if (etat === 'failed') {
      echec = true;
      const err = data.details && data.details.error;
      const cause = err && err.cause ? err.cause : err;
      test.errors = [{ message: String((cause && cause.message) || (err && err.message) || 'test failed'), ...(cause && cause.stack ? { stack: String(cause.stack) } : {}) }];
    }
    modules.get(file).push(test);
    yield `${etat === 'passed' ? '✔' : etat === 'failed' ? '✖' : '-'} ${data.name}\n`;
  }
  const resultat = { testModules: [...modules].map(([moduleId, tests]) => ({ moduleId, tests })), reason: echec ? 'failed' : 'passed' };
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(join(DATA_DIR, 'test.json'), JSON.stringify(resultat));
}
