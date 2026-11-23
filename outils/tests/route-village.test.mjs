// La Route : les changements faits côté village sont minimes, désactivés par défaut, et ne cassent rien.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const lire = f => fs.readFileSync(new URL('../../voyage/js/' + f, import.meta.url), 'utf8');

test('terrain : la brèche dans le rempart et la piste de sortie n\'existent que si la Route est activée', () => {
  const t = lire('terrain.js');
  assert.match(t, /export function activerSortieRoute\(chemin\)/);
  assert.match(t, /export function materiauSol\(/, 'le matériau du sol est réutilisé par la Route');
  assert.match(t, /OPTIONS\.sortieRoute/, 'le relief ne change que si l\'option est active');
  assert.match(t, /export const OPTIONS = \{ sortieRoute: false, chemin: null \}/, 'désactivée par défaut');
});

test('main : la Route n\'est branchée que derrière le drapeau, chargée à la demande, et le village garde son fonctionnement', () => {
  const m = lire('main.js');
  assert.match(m, /import \{ routeActive \} from '\.\/route\/drapeau\.js'/);
  assert.ok(!/^import .*route\/(jeu-route|monde|lieux-3d|village-route)/m.test(m), 'les modules lourds ne sont jamais importés statiquement');
  assert.match(m, /const ROUTE = routeActive\(\)/);
  assert.match(m, /await import\('\.\/route\/jeu-route\.js'\)/);
  assert.match(m, /if \(route && route\.enRoute\(\) && o\.z > 10000\) return route\.bouger/, 'déplacements de la Route');
  assert.match(m, /if \(route\) route\.maj\(/);
  assert.match(m, /if \(route && route\.enRoute\(\)\) route\.sauver\(\)/, 'en route, la position du village (etat.joueur) n\'est pas écrasée');
  assert.match(m, /offerte \|\| AV\.montures\.includes/, 'le dromadaire offert n\'est pas achetable à l\'écurie');
});
