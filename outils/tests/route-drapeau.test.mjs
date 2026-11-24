// La Route vers La Mecque : le drapeau de préproduction. Hors préproduction (et hors machine locale), la Route n'existe pas.
import test from 'node:test'; import assert from 'node:assert/strict';

test('drapeau : la Route n\'est active qu\'en préproduction ou en local, jamais sur le vrai site', async () => {
  const { routeActive } = await import('../../voyage/js/route/drapeau.js');
  assert.equal(routeActive('preproduction.lanternes-de-nour.pages.dev'), true);
  assert.equal(routeActive('localhost'), true);
  assert.equal(routeActive('127.0.0.1'), true);
  assert.equal(routeActive('leslanternesdenour.fr'), false);
  assert.equal(routeActive('www.leslanternesdenour.fr'), false);
  assert.equal(routeActive('lanternes-de-nour.pages.dev'), false, 'le domaine de production Pages n\'est pas la préproduction');
  assert.equal(routeActive('preproduction.leslanternesdenour.fr.evil.com'), false);
  assert.equal(routeActive(''), false);
  assert.equal(routeActive(undefined), false);
});
