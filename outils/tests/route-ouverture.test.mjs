// Ouverture de la Route au public (décision du créateur, 24/11/2026) : le vrai site charge la Route, mais le bac à sable et le panneau de test restent réservés à la préproduction et au local.
import test from 'node:test';
import assert from 'node:assert/strict';

test('ouverture : la Route est active sur le vrai site (avec et sans www), jamais sur un domaine imité', async () => {
  const { routeActive } = await import('../../voyage/js/route/drapeau.js');
  assert.equal(routeActive('leslanternesdenour.fr'), true);
  assert.equal(routeActive('www.leslanternesdenour.fr'), true);
  assert.equal(routeActive('leslanternesdenour.fr.evil.com'), false);
  assert.equal(routeActive('evil-leslanternesdenour.fr'), false);
  assert.equal(routeActive('lanternes-de-nour.pages.dev'), false, 'le domaine Pages de production n\'est pas le vrai site');
});

test('ouverture : hoteDeTest reste réservé à la préproduction et au local (bac à sable, panneau de test)', async () => {
  const { hoteDeTest } = await import('../../voyage/js/route/drapeau.js');
  assert.equal(hoteDeTest('localhost'), true);
  assert.equal(hoteDeTest('preproduction.lanternes-de-nour.pages.dev'), true);
  assert.equal(hoteDeTest('leslanternesdenour.fr'), false);
  assert.equal(hoteDeTest('www.leslanternesdenour.fr'), false);
});
