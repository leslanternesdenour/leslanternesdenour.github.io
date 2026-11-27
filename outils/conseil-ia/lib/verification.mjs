// Vérifications mécaniques : ce qu'un modèle affirme est confronté à un test exécuté.
import { spawnSync } from 'node:child_process';

export function lancerTests(cwd, fichiers, options = [], env = process.env) {
  // NODE_TEST_CONTEXT, hérité d'un test en cours, fausserait le code de sortie de l'exécution lancée ici.
  const { NODE_TEST_CONTEXT, ...propre } = env;
  const r = spawnSync(process.execPath, [...options, '--test', ...(options.length ? ['--test-isolation=none'] : []), ...fichiers], { cwd, env: propre, encoding: 'utf8', timeout: 180_000 });
  return { code: r.status ?? 1, sortie: `${r.stdout || ''}${r.stderr || ''}`.slice(-6000) };
}
