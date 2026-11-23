// Les badges de La Route : ils s'ajoutent à ceux du Grand Voyage (succes.js) sans en remplacer aucun. Se méritent en explorant et en aidant.
// c = { etat, AV, ... } (le contexte de succes.js) ; tout est lu dans c.etat.route.
const R = c => (c.etat && c.etat.route) || { decouvertes: [], repos: [], missions: {}, vu: {} };
const fini = (c, id) => !!(R(c).missions[id] && R(c).missions[id].etat === 'finie');
export const BADGES_ROUTE = [
  { id: 'route-depart', icone: '🚏', nom: 'Sur la grande route', desc: 'Quitter le village et passer le seuil de la grande route.', ok: c => R(c).decouvertes.includes('seuil') },
  { id: 'route-balises', icone: '🧭', nom: 'Bon sens de l\'orientation', desc: 'Retrouver les trois balises de pierre.', ok: c => fini(c, 'chemin') },
  { id: 'route-traces', icone: '🐾', nom: 'Pisteur du désert', desc: 'Reconnaître les trois traces d\'animaux dans le sable.', ok: c => fini(c, 'traces') },
  { id: 'route-entraide', icone: '🤝', nom: 'Ami des voyageurs', desc: 'Aider la voyageuse du campement.', ok: c => fini(c, 'campement') && !!R(c).vu.campementRendu },
  { id: 'route-repos', icone: '🪨', nom: 'Voyageur reposé', desc: 'Faire halte aux trois points de repos.', ok: c => R(c).repos.length >= 3 },
  { id: 'route-histoires', icone: '📜', nom: 'Curieux des histoires', desc: 'Garder deux histoires dans ton carnet de voyage.', ok: c => Object.values(R(c).recits || {}).filter(r => r.carnet).length >= 2 },
  { id: 'route-oasis', icone: '🌴', nom: 'Première étape', desc: 'Arriver à l\'oasis de la Source Claire.', ok: c => R(c).decouvertes.includes('oasis') }
];
