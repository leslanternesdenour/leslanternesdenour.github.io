// Accueil : sur la vraie capture 3D, plus de lueurs ni de lucioles posées à la main (elles étaient calées sur l'ancienne image) : la carte reste sobre.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('accueil : le script de vie n\'ajoute plus de lueurs ni de lucioles sur la capture du village 3D', () => {
  const js = fs.readFileSync(new URL('../../accueil/vie.js', import.meta.url), 'utf8');
  assert.ok(!/(^|[;{\s])village\(\);/.test(js), 'village() n\'est plus appelé');
  assert.match(js, /apparitions\(\); relief\(\);/, 'les autres effets de la page restent en place');
});
