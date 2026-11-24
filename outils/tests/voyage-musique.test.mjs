// Grand Voyage : sa propre musique vocale (« Golden Hour Hum »), qui remplace le nasheed du village dans le voyage seulement.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';

const lire = chemin => fs.readFileSync(new URL('../../' + chemin, import.meta.url), 'utf8');

test('le Grand Voyage joue sa propre musique, plus le nasheed du village ; le village garde le sien', () => {
  const sons = lire('voyage/js/sons.js');
  assert.match(sons, /fetch\('musique\/grand-voyage-golden-hour\.mp3\?v=1'\)/, 'chemin relatif à la page /voyage/ (pas au module)');
  assert.ok(!sons.includes('village-nasheed'), 'le voyage ne charge plus le nasheed du village');
  assert.ok(fs.existsSync(new URL('../../voyage/musique/grand-voyage-golden-hour.mp3', import.meta.url)), 'le fichier est dans le dépôt');
  assert.match(lire('monde/socle/musique.js'), /village-nasheed\.mp3/);
});
