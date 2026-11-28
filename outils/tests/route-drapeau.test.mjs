// La Route vers La Mecque : le drapeau de préproduction. Hors préproduction (et hors machine locale), la Route n'existe pas.
import test from 'node:test'; import assert from 'node:assert/strict';

test('drapeau : la Route est active sur le site public, en préproduction et en local ; le bac à sable seulement en préproduction et en local', async () => {
  const { routeActive, hoteDeTest } = await import('../../voyage/js/route/drapeau.js');
  assert.equal(routeActive('preproduction.lanternes-de-nour.pages.dev'), true);
  assert.equal(routeActive('localhost'), true);
  assert.equal(routeActive('127.0.0.1'), true);
  assert.equal(routeActive('leslanternesdenour.fr'), true);
  assert.equal(routeActive('www.leslanternesdenour.fr'), true);
  assert.equal(routeActive('lanternes-de-nour.pages.dev'), true, 'le domaine Pages de la production sert le même site public');
  assert.equal(hoteDeTest('lanternes-de-nour.pages.dev'), false, 'mais le bac à sable et les outils de test restent réservés à la préproduction');
  assert.equal(routeActive('preproduction.leslanternesdenour.fr.evil.com'), false);
  assert.equal(routeActive(''), false);
  assert.equal(routeActive(undefined), false);
});
