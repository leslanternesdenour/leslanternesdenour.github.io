// Le drapeau de préproduction de « La Route vers La Mecque ».
// La Route n'existe que sur la préproduction (preproduction.lanternes-de-nour.pages.dev) et sur la machine locale.
// Sur le vrai site (leslanternesdenour.fr), rien n'est affiché, rien n'est chargé : ni panneau, ni module, ni données.
export function routeActive(hote = (typeof location !== 'undefined' ? location.hostname : '')) {
  if (typeof hote !== 'string' || !hote) return false;
  if (hote === 'localhost' || hote === '127.0.0.1') return true;
  return /^preproduction\.[a-z0-9-]+\.pages\.dev$/.test(hote);
}
