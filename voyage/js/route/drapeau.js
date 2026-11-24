// Le drapeau de « La Route vers La Mecque ».
// Depuis le 24/11/2026 (décision du créateur), la Route est ouverte sur le vrai site : leslanternesdenour.fr et www.
// Le bac à sable et le panneau de test restent RÉSERVÉS à la préproduction et à la machine locale (voir hoteDeTest).
const HOTES_PUBLICS = ['leslanternesdenour.fr', 'www.leslanternesdenour.fr'];

export function hoteDeTest(hote = (typeof location !== 'undefined' ? location.hostname : '')) {
  if (typeof hote !== 'string' || !hote) return false;
  if (hote === 'localhost' || hote === '127.0.0.1') return true;
  return /^preproduction\.[a-z0-9-]+\.pages\.dev$/.test(hote);
}

export function routeActive(hote = (typeof location !== 'undefined' ? location.hostname : '')) {
  if (typeof hote !== 'string' || !hote) return false;
  return HOTES_PUBLICS.includes(hote) || hoteDeTest(hote);
}
