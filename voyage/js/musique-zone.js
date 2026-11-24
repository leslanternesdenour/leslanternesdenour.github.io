// Quelle musique joue où (sans navigateur : testable seul).
// - le jeu habituel (village, désert) : « Glowing Village » ('jeu')
// - dès qu'on arrive sur la Route vers La Mecque : « Golden Hour Hum » ('route')
// - à l'arrivée à La Mecque (vallée de l'arrivée, puis cité) : « Sacred City at Dusk » ('mecque')
export const REGIONS_MUSIQUE_MECQUE = ['arrivee', 'cite'];
export function pisteMusique(enRoute, regionId) {
  if (!enRoute) return 'jeu';
  return REGIONS_MUSIQUE_MECQUE.includes(regionId) ? 'mecque' : 'route';
}