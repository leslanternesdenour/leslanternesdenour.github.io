// Commandes tactiles : sur téléphone, les boutons d'action ne recouvrent jamais le joystick, même avec un libellé long (« Découvrir cette histoire »).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('tactile : la colonne des boutons d\'action est limitée en largeur pour ne jamais passer sur le joystick (droitiers et gauchers)', () => {
  const css = fs.readFileSync(new URL('../../voyage/voyage.css', import.meta.url), 'utf8');
  assert.match(css, /\.boutons-action\{[^}]*max-width:calc\(100vw - \(26px \+ 150px \* var\(--taille-cmd\)\) - 30px\)/, 'largeur limitée selon la taille du joystick');
  assert.match(css, /\.action \.txt\{[^}]*white-space:normal/, 'le libellé passe à la ligne au lieu de s\'étirer');
});

test('tactile : sur un écran court (téléphone en paysage), les boutons d\'action se rangent en ligne en bas à droite : plus de chevauchement avec « Courir » ; l\'ordinateur ne change pas', () => {
  const css = fs.readFileSync(new URL('../../voyage/voyage.css', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const m = css.match(/@media \(max-height:560px\)\{([\s\S]*?)\n\}/); assert.ok(m, 'bloc pour écrans courts');
  const b = m[1];
  assert.match(b, /body\.tactile \.boutons-action\{[^}]*flex-direction:row-reverse/);  assert.match(b, /body\.tactile \.rond-action\{[^}]*width:calc\(76px/, 'zone tactile confortable pour « Courir »'); assert.ok(!/^\s*[#.a-z][^{}\n]*\{/m.test(b.replace(/body\.tactile [^{]*\{[^}]*\}/g, '')), 'toutes les règles sont limitées au tactile');
  assert.match(css, /\.action\.arrive\{[^}]*animation:rr-arrive/); assert.match(css, /\.action\.indispo\{[^}]*opacity/); assert.match(css, /prefers-reduced-motion:reduce\)\{\.action\.arrive/);
});

test('tactile : le bouton de la carte est dans la rangée du haut, juste à gauche de la cible 🎯 (missions) et du carnet, sur tous les téléphones', () => {
  const css = fs.readFileSync(new URL('../../voyage/voyage.css', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  assert.match(css, /body\.tactile #outils\{[^}]*top:calc\(10px \+ var\(--haut\)\)[^}]*right:calc\(210px \+ env\(safe-area-inset-right,0px\)\)[^}]*flex-direction:row-reverse/, 'même ligne que les boutons du haut, à leur gauche');
  assert.match(css, /@media \(max-width:420px\)\{[^}]*body\.tactile #outils\{[^}]*right:calc\(177px/, 'boutons du haut plus petits sur petit écran');
});
