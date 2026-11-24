// Grand Voyage : sa propre musique vocale (« Golden Hour Hum »), qui remplace le nasheed du village dans le voyage seulement.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';

const lire = chemin => fs.readFileSync(new URL('../../' + chemin, import.meta.url), 'utf8');

test('le Grand Voyage joue sa propre musique, plus le nasheed du village ; le village garde le sien', () => {
  const sons = lire('voyage/js/sons.js');
  assert.match(sons, /voyage: 'musique\/grand-voyage-golden-hour\.mp3\?v=1'/, 'chemin relatif à la page /voyage/ (pas au module)');
  assert.ok(!sons.includes('village-nasheed'), 'le voyage ne charge plus le nasheed du village');
  assert.ok(fs.existsSync(new URL('../../voyage/musique/grand-voyage-golden-hour.mp3', import.meta.url)), 'le fichier est dans le dépôt');
  assert.match(lire('monde/socle/musique.js'), /village-nasheed\.mp3/);
});

test('la Route dit dans quelle région se trouve le joueur, pour choisir la musique', () => {
  assert.match(lire('voyage/js/route/jeu-route.js'), /regionId: \(\) => regionActuelle/);
});

test('sons.js sait changer de musique avec un fondu : piste du voyage et piste de La Mecque, chacune avec sa boucle', () => {
  const sons = lire('voyage/js/sons.js');
  assert.match(sons, /export async function choisirMusique\(/);
  assert.match(sons, /mecque: 'musique\/mecque-sacred-city-at-dusk\.mp3\?v=1'/);
  assert.match(sons, /voyage: 'musique\/grand-voyage-golden-hour\.mp3\?v=1'/);
  assert.ok(fs.existsSync(new URL('../../voyage/musique/mecque-sacred-city-at-dusk.mp3', import.meta.url)), 'le fichier de La Mecque est dans le dépôt');
});

test('le changement de musique est un vrai fondu enchaîné linéaire : l\'ancienne baisse pendant que la nouvelle monte, sans creux de silence', () => {
  const sons = lire('voyage/js/sons.js');
  assert.match(sons, /function arreterMusique\(croise = false\)/);
  assert.match(sons, /linearRampToValueAtTime\(0, t \+ DUREE_FONDU\)/);
  assert.match(sons, /linearRampToValueAtTime\(1, t \+ DUREE_FONDU\)/);
});

test('le jeu choisit la musique selon la zone, à chaque vérification de zone', () => {
  const main = lire('voyage/js/main.js');
  assert.match(main, /function verifierZone\(\) \{\s*S\.choisirMusique\(pisteMusique\(!!\(route && route\.enRoute\(\)\), route && route\.regionId\(\)\)\);/);
});
