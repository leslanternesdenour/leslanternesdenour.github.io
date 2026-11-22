// Couleurs de peau des personnages : EXACTEMENT celles du Grand Voyage (voyage/js/voyageur.js) et des personnages 3D (personnages3d/logique.js).
// Un test (outils/tests/peaux.test.mjs) vérifie que les trois listes restent identiques. L'indice est gardé dans « personnage.peau » (défaut : 1).
export const PEAUX = ['#f0c9a4', '#d9a27a', '#b97f58', '#8d5a3b'];
export const NOMS_PEAUX = ['Peau très claire', 'Peau claire', 'Peau mate', 'Peau foncée'];
export const PEAU_PAR_DEFAUT = 1;
export const indicePeau = p => Number.isInteger(p) && p >= 0 && p < PEAUX.length ? p : PEAU_PAR_DEFAUT;

// Visage d'enfant dessiné (jamais d'émoji jaune) : la peau prend la couleur choisie (variable CSS --peau).
// Fille : voile écru qui encadre le visage. Garçon : cheveux courts et petite calotte écrue.
export function visageSVG(genre) {
  const yeux = '<ellipse cx="26.500" cy="35" rx="1.900" ry="2.300" fill="#2b180c"/><ellipse cx="37.500" cy="35" rx="1.900" ry="2.300" fill="#2b180c"/>' +
    '<circle cx="27.200" cy="34.200" r=".6" fill="#fff"/><circle cx="38.200" cy="34.200" r=".6" fill="#fff"/>' +
    '<path d="M27.500 42.500q4.500 4 9 0" fill="none" stroke="#7a3b22" stroke-width="1.700" stroke-linecap="round"/>' +
    '<ellipse cx="22.500" cy="40" rx="2.800" ry="1.800" fill="#e0707a" opacity=".32"/><ellipse cx="41.500" cy="40" rx="2.800" ry="1.800" fill="#e0707a" opacity=".32"/>';
  if (genre === 'garcon') {
    return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<path d="M16 62c0-9 7-13 16-13s16 4 16 13z" fill="#cfae7a" stroke="#a88a55" stroke-width="1.500"/>' +
      '<rect x="27.500" y="44" width="9" height="8" rx="3" style="fill:var(--peau)"/>' +
      '<circle cx="32" cy="34" r="15.500" style="fill:var(--peau)" stroke="rgba(60,30,10,.28)" stroke-width="1.200"/>' +
      '<path d="M16.500 31c-1-12 7-18 15.500-18s16.500 6 15.500 18c-3-6-8-9-15.500-9S19.500 25 16.500 31z" fill="#3a2214"/>' +
      '<path d="M19 22c1-7 7-11 13-11s12 4 13 11c-4-2.500-8-3.500-13-3.500S23 19.500 19 22z" fill="#f3ecd9" stroke="#bda978" stroke-width="1.300"/>' + yeux + '</svg>';
  }
  return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<path d="M9 40C8 17 21 6 32 6s24 11 23 34c0 10-6 20-23 22C15 60 9 50 9 40z" fill="#f2e9d6" stroke="#b89a6a" stroke-width="1.600"/>' +
    '<ellipse cx="32" cy="35.500" rx="15" ry="16.500" style="fill:var(--peau)" stroke="rgba(60,30,10,.28)" stroke-width="1.200"/>' +
    '<path d="M16.500 30c2-10 8-14.500 15.500-14.500S45.500 20 47.500 30c-4-5-9-7.500-15.500-7.500S20.500 25 16.500 30z" fill="#f2e9d6"/>' + yeux + '</svg>';
}
