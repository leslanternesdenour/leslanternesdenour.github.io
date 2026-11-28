// Le drapeau de « La Route vers La Mecque ».
// Depuis le 24/11/2026 (décision du créateur), la Route est ouverte sur le vrai site : leslanternesdenour.fr et www.
// Le bac à sable et le panneau de test restent RÉSERVÉS à la préproduction et à la machine locale (voir hoteDeTest).
// Le domaine Pages de la production (lanternes-de-nour.pages.dev) sert exactement le même site public : la Route y est ouverte aussi (28/11/2026). Le bac à sable, lui, reste réservé à la préproduction et au local.
const HOTES_PUBLICS = ['leslanternesdenour.fr', 'www.leslanternesdenour.fr', 'lanternes-de-nour.pages.dev'];

export function hoteDeTest(hote = (typeof location !== 'undefined' ? location.hostname : '')) {
  if (typeof hote !== 'string' || !hote) return false;
  if (hote === 'localhost' || hote === '127.0.0.1') return true;
  return /^preproduction\.[a-z0-9-]+\.pages\.dev$/.test(hote);
}

export function routeActive(hote = (typeof location !== 'undefined' ? location.hostname : '')) {
  if (typeof hote !== 'string' || !hote) return false;
  return HOTES_PUBLICS.includes(hote) || hoteDeTest(hote);
}
