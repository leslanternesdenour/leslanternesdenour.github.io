// Commandes tactiles : sur téléphone, les boutons d'action ne recouvrent jamais le joystick, même avec un libellé long (« Découvrir cette histoire »).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('tactile : la colonne des boutons d\'action est limitée en largeur pour ne jamais passer sur le joystick (droitiers et gauchers)', () => {
  const css = fs.readFileSync(new URL('../../voyage/voyage.css', import.meta.url), 'utf8');
  assert.match(css, /\.boutons-action\{[^}]*max-width:calc\(100vw - \(26px \+ 150px \* var\(--taille-cmd\)\) - 30px\)/, 'largeur limitée selon la taille du joystick');
  assert.match(css, /\.action \.txt\{[^}]*white-space:normal/, 'le libellé passe à la ligne au lieu de s\'étirer');
});
