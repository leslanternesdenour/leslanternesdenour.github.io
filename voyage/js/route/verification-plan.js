// Le parcours de test de La Route (pur, sans Three.js) : la liste des étapes à vérifier, chacune avec sa destination et sa condition de réussite.
// Il n'existe QUE dans le bac à sable (?sandbox=1) : il sert à vérifier tout le voyage sur un téléphone sans marcher 5,6 km. Il ne modifie jamais les vrais profils.
const finie = (R, id) => !!(R.missions && R.missions[id] && R.missions[id].etat === 'finie');
const decouvert = (R, id) => (R.decouvertes || []).includes(id);
// aller : { type: 'lieu', id } | { type: 'porte' } | { type: 'halte', id: 'nord'|'sud' } | { type: 'voyageur', id } | { type: 'collines' }
export const ETAPES_VERIF = [
  { id: 'oasis', icone: '🌴', titre: 'L\'oasis (première grande étape)', aller: { type: 'lieu', id: 'oasis' }, quoi: 'Appuie sur le bouton d\'action : la voix explique l\'oasis, un message de bravo suit.', fait: R => decouvert(R, 'oasis') },
  { id: 'nature', icone: '🔎', titre: 'Le carnet de la nature (8 sites)', aller: { type: 'lieu', id: 'fourmiliere' }, quoi: 'Visite les 8 petits sites de nature (fourmilière, fleurs, nid, dune, terre craquelée, rocher, roseaux, canal) : chacun parle.', fait: R => finie(R, 'nature') },
  { id: 'campement', icone: '⛺', titre: 'Le campement des Trois Tentes', aller: { type: 'lieu', id: 'campement' }, quoi: 'Parle à la voyageuse et retrouve les trois objets : la mission se termine.', fait: R => finie(R, 'campement') },
  { id: 'porte-cite', icone: '🚪', titre: 'La porte de la cité', aller: { type: 'lieu', id: 'cite-porte' }, quoi: 'Entre dans la cité : le texte est dit à voix haute.', fait: R => decouvert(R, 'cite-porte') },
  { id: 'recit', icone: '📜', titre: 'Une histoire validée (avec voix)', aller: { type: 'lieu', id: 'cite-puits' }, quoi: "Ouvre une histoire avec le bouton de la lanterne : badge ✅ Validé, lecture à voix haute par la narratrice, bouton « Réécouter ». Ajoute-la au carnet.", fait: R => Object.values(R.recits || {}).some(r => r && r.carnet) },
  { id: 'atelier', icone: '🏺', titre: 'L\'atelier du potier (on y entre)', aller: { type: 'lieu', id: 'cite-atelier' }, quoi: 'Entre dans l\'atelier, observe le tour et le four : le toit s\'efface, la voix décrit.', fait: R => decouvert(R, 'atelier:tour') || decouvert(R, 'atelier:four') },
  { id: 'metier', icone: '🎓', titre: 'Apprendre un métier', aller: { type: 'voyageur', id: 'potier' }, quoi: 'Parle au potier, « Apprendre son métier » : trois questions, une mauvaise réponse permet de réessayer.', fait: R => Object.keys(R.vu || {}).some(k => k.startsWith('metier_')) },
  { id: 'portes', icone: '🚪', titre: 'Frapper aux portes (4)', aller: { type: 'porte' }, quoi: 'Frappe à 4 portes différentes : chaque habitant répond avec sa voix.', fait: R => finie(R, 'portes') },
  { id: 'interieurs', icone: '🏡', titre: 'Dans les maisons (3)', aller: { type: 'porte' }, quoi: 'Entre dans 3 maisons, observe un objet, ressors par la porte (« Sortir »).', fait: R => finie(R, 'interieurs') },
  { id: 'troc', icone: '🤝', titre: 'Le troc du marché', aller: { type: 'voyageur', id: 'marchand-dattes' }, quoi: 'Le marchand de dattes te donne des dattes, puis échange avec la tisserande, le potier et le marchand.', fait: R => finie(R, 'troc') },
  { id: 'sujets', icone: '💬', titre: 'Bavarder avec les habitants (8 questions)', aller: { type: 'voyageur', id: 'boulangere' }, quoi: 'Pose 8 questions à des habitants différents : chaque réponse est dite avec leur voix.', fait: R => !!(R.vu && R.vu.sujetsRecompense) },
  { id: 'collines', icone: '🚶', titre: 'Marcher entre les deux collines (3 traversées)', aller: { type: 'collines' }, quoi: 'Marche d\'une colline à l\'autre trois fois : un message doux à chaque traversée, jamais de chronomètre.', fait: R => !!(R.vu && R.vu.travRecompense) },
  { id: 'montees', icone: '⛰️', titre: 'Monter doucement (6 haltes)', aller: { type: 'halte', id: 'nord' }, quoi: 'Monte les deux sentiers jusqu\'aux belvédères et observe les haltes : la voix décrit la nature.', fait: R => finie(R, 'montees') },
  { id: 'hameau', icone: '🏘️', titre: 'Le hameau des puits (sentier caché)', aller: { type: 'lieu', id: 'hameau-borne' }, quoi: "Suis le sentier depuis la borne jusqu'au hameau : puits, jardin, four (chacun parle). Parle au puisatier et apprends son métier.", fait: R => finie(R, 'hameau') },
  { id: 'cite', icone: '🏙️', titre: 'Découvrir la cité', aller: { type: 'lieu', id: 'cite-place' }, quoi: 'Visite la porte, l\'atelier, la grande place et le marché : la mission se termine.', fait: R => finie(R, 'cite') },
  { id: 'arrivee', icone: '🏁', titre: 'Arriver devant le monument central (fin du voyage)', aller: { type: 'lieu', id: 'cite-place' }, quoi: 'Depuis la grande place, observe le monument central au centre : on ne peut pas s\'en approcher ni y entrer. Le badge « Arrivée à La Mecque » est obtenu et la musique de La Mecque joue.', fait: R => decouvert(R, 'cite-place') }
];
export function progressionVerif(R) {
  const faites = ETAPES_VERIF.filter(e => { try { return !!e.fait(R); } catch (x) { return false; } }).length;
  return { faites, total: ETAPES_VERIF.length };
}
