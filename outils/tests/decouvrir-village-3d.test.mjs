// Découvrir : l'illustration dessinée du village est remplacée par la capture du vrai village 3D du jeu (version large, sans déformation).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('découvrir : le bloc illustration montre la capture du vrai village 3D (pas le SVG dessiné), avec ses dimensions réelles et un texte alternatif fidèle', () => {
  const html = fs.readFileSync(new URL('../../decouvrir/index.html', import.meta.url), 'utf8');
  const m = html.match(/<div class="illus">[\s\S]*?<\/div>/); assert.ok(m, 'bloc illus');
  assert.match(m[0], /<img [^>]*src="\.\.\/accueil\/village-3d-large\.webp(\?v=\d+)?"/);
  assert.match(m[0], /width="1030" height="630"/, 'dimensions réelles du recadrage (pas de déformation)');
  assert.match(m[0], /alt="[^"]*fontaine[^"]*maisons[^"]*"/i);
  assert.ok(!/<svg/i.test(m[0]), 'plus d\'illustration dessinée');
  const f = fs.readFileSync(new URL('../../accueil/village-3d-large.webp', import.meta.url));
  assert.equal(f.subarray(0, 4).toString(), 'RIFF'); assert.equal(f.subarray(8, 12).toString(), 'WEBP'); assert.ok(f.length > 30000 && f.length < 400000, 'poids raisonnable');
});
