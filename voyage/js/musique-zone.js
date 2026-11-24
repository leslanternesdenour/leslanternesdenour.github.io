// Quelle musique joue où (sans navigateur : testable seul).
// Le Grand Voyage a sa musique ; celle de La Mecque ne démarre qu'à l'arrivée sur la Route (vallée de l'arrivée, puis cité).
export const REGIONS_MUSIQUE_MECQUE = ['arrivee', 'cite'];
export function pisteMusique(enRoute, regionId) {
  return enRoute && REGIONS_MUSIQUE_MECQUE.includes(regionId) ? 'mecque' : 'voyage';
}