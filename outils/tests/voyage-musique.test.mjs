// Grand Voyage : sa propre musique vocale (« Golden Hour Hum »), qui remplace le nasheed du village dans le voyage seulement.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';

const lire = chemin => fs.readFileSync(new URL('../../' + chemin, import.meta.url), 'utf8');

test('le jeu habituel joue « Glowing Village » : le nasheed du village, chemin relatif à la page /voyage/', () => {
  assert.match(lire('voyage/js/sons.js'), /jeu: '\.\.\/monde\/musique\/village-nasheed\.mp3\?v=1'/);
});

test('la Route dit dans quelle région se trouve le joueur, pour choisir la musique', () => {
  assert.match(lire('voyage/js/route/jeu-route.js'), /regionId: \(\) => regionActuelle/);
});

test('le changement de musique est un vrai fondu enchaîné linéaire : l\'ancienne baisse pendant que la nouvelle monte, sans creux de silence', () => {
  const sons = lire('voyage/js/sons.js');
  assert.match(sons, /function arreterMusique\(croise = false\)/);
  assert.match(sons, /linearRampToValueAtTime\(0, t \+ DUREE_FONDU\)/);
  assert.match(sons, /linearRampToValueAtTime\(1, t \+ DUREE_FONDU\)/);
});

test('chaque musique que la règle de zone peut demander existe dans sons.js, et son fichier est dans le dépôt', async () => {
  const { pisteMusique } = await import('../../voyage/js/musique-zone.js');
  const demandees = new Set([pisteMusique(false, null), pisteMusique(true, 'sortie'), pisteMusique(true, 'arrivee'), pisteMusique(true, 'cite')]);
  assert.deepEqual([...demandees].sort(), ['jeu', 'mecque', 'route']);
  const sons = lire('voyage/js/sons.js');
  const chemins = { jeu: 'monde/musique/village-nasheed.mp3', route: 'voyage/musique/grand-voyage-golden-hour.mp3', mecque: 'voyage/musique/mecque-sacred-city-at-dusk.mp3' };
  for (const nom of demandees) { assert.ok(sons.includes(`  ${nom}: '`), nom + ' est dans PISTES'); assert.ok(fs.existsSync(new URL('../../' + chemins[nom], import.meta.url)), chemins[nom] + ' existe'); }
});

test('le jeu choisit la musique selon la zone, à chaque vérification de zone', () => {
  const main = lire('voyage/js/main.js');
  assert.match(main, /function verifierZone\(\) \{\s*S\.choisirMusique\(pisteMusique\(!!\(route && route\.enRoute\(\)\), route && route\.regionId\(\)\)\);/);
});
