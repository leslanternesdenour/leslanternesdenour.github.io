// Accueil : la carte « Découvrez le Monde de Nour » montre le vrai village 3D du jeu (capture fournie par le créateur), recadré sans déformation. L'ancienne image est conservée.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('accueil : la carte du Monde de Nour utilise la capture du vrai village 3D, avec ses dimensions réelles et un texte alternatif fidèle', () => {
  const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const m = html.match(/<div class="carte-image">[\s\S]*?<\/div>/); assert.ok(m, 'carte-image');
  assert.match(m[0], /src="accueil\/village-3d\.webp(\?v=\d+)?"/);
  assert.match(m[0], /width="810" height="605"/, 'dimensions réelles de la capture recadrée (pas de déformation)');
  assert.match(m[0], /alt="[^"]*fontaine[^"]*maisons[^"]*"/i, 'le texte alternatif décrit la fontaine et les maisons');
  assert.ok(!/chameau/i.test(m[0]), 'plus de description de l\'ancienne image');
  const f = fs.readFileSync(new URL('../../accueil/village-3d.webp', import.meta.url));
  assert.equal(f.subarray(0, 4).toString(), 'RIFF'); assert.equal(f.subarray(8, 12).toString(), 'WEBP'); assert.ok(f.length > 20000 && f.length < 400000, 'poids raisonnable');
  assert.ok(fs.existsSync(new URL('../../accueil/village.webp', import.meta.url)), 'ancienne image conservée');
});
