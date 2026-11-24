// Accueil : le grand bouton JOUER reprend l'identité des Lanternes de Nour (violet profond, or, petite lanterne), sans manette de jeu vidéo.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('accueil : le bouton JOUER n\'affiche plus de manette ni d\'image de portail, a une petite lanterne, et garde son lien et son nom accessible', () => {
  const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const m = html.match(/<a class="jouer"[\s\S]*?<\/a>/);
  assert.ok(m, 'le bouton JOUER existe');
  const b = m[0];
  assert.ok(!/manette/i.test(b), 'plus de manette');
  assert.ok(!/<img/i.test(b), 'plus d\'image dans le bouton');
  assert.match(b, /href="monde\/"/, 'le lien ne change pas');
  assert.match(b, /aria-label="Jouer : entrer dans le Monde de Nour"/, 'le nom accessible ne change pas');
  assert.match(b, /<use href="#lanterne"/, 'la petite lanterne du site comme symbole');
  assert.match(b, /JOUER/); assert.match(b, /Entrer dans le Monde de Nour/);
});
