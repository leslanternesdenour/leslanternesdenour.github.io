import { SORTIE_VILLAGE, SEUIL_VILLAGE, LIEUX_ROUTE } from './donnees.js';

// La grande route s'ouvre par-dessus le jeu : la carte du pays se ferme d'abord
export function voirTouteLaRoute({ fermerCarte, route, plusTard = f => setTimeout(f, 60) }) {
  fermerCarte(); plusTard(() => route.ouvrirCarte());
}

export function lieuVersLaMecque({ chemin, ouverte, explication }) {
  const km = (LIEUX_ROUTE.find(l => l.id === 'cite-place').s / 1000).toFixed(1).replace('.', ',');
  return { id: 'route', nom: 'La Mecque', cat: 'passage', icone: '🕋', x: SEUIL_VILLAGE.x, z: SEUIL_VILLAGE.z, trace: [...chemin.slice(0, 2), ...SORTIE_VILLAGE],
    texte: `La grande route commence ici. Elle mène à La Mecque et à la Kaaba, à environ ${km} km.`,
    connu: true, grand: true, rayon: 5, verrou: ouverte ? null : explication };
}
