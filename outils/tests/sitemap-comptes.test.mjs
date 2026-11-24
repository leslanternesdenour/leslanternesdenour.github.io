// Référencement : le plan du site ne liste que des pages réellement publiques (les pages de jeu exigent un compte parent et redirigent les visiteurs).
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';

test('sitemap : aucune page de jeu protégée, mais l\'accueil et la présentation restent listés', () => {
  const s = fs.readFileSync(new URL('../../sitemap.xml', import.meta.url), 'utf8');
  for (const p of ['/monde/', '/voyage/', '/ablutions/', '/priere/', '/calendrier/', '/ecole-arabe/chiffres/']) assert.ok(!s.includes('leslanternesdenour.fr' + p), p);
  assert.ok(s.includes('<loc>https://leslanternesdenour.fr/</loc>')); assert.ok(s.includes('/decouvrir/'));
});
