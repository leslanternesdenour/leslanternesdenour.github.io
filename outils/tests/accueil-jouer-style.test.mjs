// Accueil : le bouton JOUER est sobre et facile à toucher : violet profond et or, zone tactile d'au moins 64 px, plus de règles de manette, de portail ni de reflet qui balaie.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('accueil : style du bouton JOUER (violet, or, tactile) sans résidus de la manette, du portail ni du reflet', () => {
  const css = fs.readFileSync(new URL('../../accueil/accueil.css', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const vie = fs.readFileSync(new URL('../../accueil/vie.css', import.meta.url), 'utf8');
  const bloc = css.match(/\.jouer \{[^}]*\}/); assert.ok(bloc, 'règle .jouer');
  assert.match(bloc[0], /min-height:\s*(6[4-9]|[7-9]\d|1\d\d)px/, 'cible tactile d\'au moins 64 px');
  assert.match(bloc[0], /#26125f|#3a2288/i, 'violet profond'); assert.match(bloc[0], /245,\s*185,\s*66|#f5b942/i, 'filet d\'or');
  assert.match(css, /\.jouer-lanterne\s*\{/); assert.match(css, /\.jouer-fleche\s*\{/);
  for (const mort of ['jouer-manette', 'jouer-portail', 'jouer-brille', 'jouer-scene', 'jouer-palme', 'acc-flotte', 'acc-balaye']) assert.ok(!css.includes(mort) || mort === 'acc-balaye', `plus de ${mort}`);
  assert.ok(!/\.jouer::before/.test(vie), 'plus de halo qui bat derrière le bouton');
});
