// Les positions de la prière pour le personnage 3D, et les passages de l'une à l'autre.
// Repère du personnage : il regarde +z (la qibla). Main droite = côté x négatif.
// Les mains et les pieds sont placés par le moteur de gestes (cinématique inverse) : genoux et coudes plient naturellement.

// piedsPlats : les pieds restent à plat sur le sol (la cheville compense l'inclinaison de la jambe) ; la cheville est à 6 cm du sol (hauteur de la semelle)
const base = { bassinY: 0.62, bassinZ: 0, busteX: 0.02, busteY: 0, teteX: 0.14, teteY: 0, teteZ: 0, robe: true, piedsPlats: true,
  pieds: { d: [-0.09, 0.06, 0], g: [0.09, 0.06, 0] },
  mains: { ref: 'corps', d: [-0.2, 0.42, 0.03], g: [0.2, 0.42, 0.03] } };
const P = o => ({ ...base, ...o });
// les genoux vers l'avant et vers le bas (à genoux, assis, prosterné)
const AGENOU = [0.1, -0.35, 1];
// assis entre les deux prosternations et au tachahhoud (position « iftirâch ») : on est assis sur le pied gauche posé à plat
// (le dessus du pied sur le sol, les orteils vers l'arrière), le pied droit dressé, les orteils au sol vers la qibla.
// Les genoux restent au sol, devant le bassin ; les mains sont sur les cuisses, près des genoux.
const GENOU_ASSIS = [0.1, -0.05, 1];
const PIEDS_ASSIS = { d: [-0.1, 0.14, -0.11], g: [0.09, 0.075, -0.1] };
const CHEVILLE_ASSIS = [0.5, 1.5];           // pied droit un peu étendu (dressé), pied gauche étendu à plat
const MAINS_CUISSES = { ref: 'corps', d: [-0.11, 0.27, 0.12], g: [0.11, 0.27, 0.12] };
const ASSIS = { piedsPlats: false, bassinY: 0.24, bassinZ: -0.06, busteX: 0.04, teteX: 0.16, robe: false, genou: GENOU_ASSIS, pieds: PIEDS_ASSIS, cheville: CHEVILLE_ASSIS, mains: MAINS_CUISSES };
// transitions et prosternation : le bout des pieds au sol, les talons relevés
const PIEDS_PROSTERNE = { d: [-0.09, 0.15, -0.15], g: [0.09, 0.15, -0.15] };
const CHEVILLE_PROSTERNE = [0.35, 0.35];

export const POSTURES = {
  // debout, les bras le long du corps, le regard vers l'endroit où ira le front
  debout: P({}),
  // le takbîr : les mains montent à hauteur des épaules ou des oreilles
  takbir: P({ teteX: 0.1, mains: { ref: 'tete', d: [-0.18, -0.04, 0.1], g: [0.18, -0.04, 0.1] } }),
  // debout, les mains posées (la main droite sur la gauche, sur la poitrine)
  mains: P({ mains: { ref: 'corps', d: [-0.035, 0.84, 0.19], g: [0.03, 0.82, 0.17] } }),
  // le roukoû‘ : le dos bien droit, les mains sur les genoux
  roukou: P({ bassinY: 0.6, bassinZ: -0.07, busteX: 1.42, teteX: -0.05, mains: { ref: 'corps', d: [-0.11, 0.33, 0.07], g: [0.11, 0.33, 0.07] },
    pieds: { d: [-0.09, 0.06, 0.0], g: [0.09, 0.06, 0.0] } }),
  // les passages (pas des positions de la prière : juste pour bouger joliment)
  plie: P({ bassinY: 0.48, bassinZ: -0.06, busteX: 0.55, teteX: 0.1, robe: false, mains: { ref: 'corps', d: [-0.12, 0.36, 0.22], g: [0.12, 0.36, 0.22] } }),
  genoux: P({ bassinY: 0.44, bassinZ: -0.02, busteX: 0.3, teteX: 0.15, robe: false, genou: AGENOU, pieds: { d: [-0.09, 0.25, -0.12], g: [0.09, 0.25, -0.12] }, mains: { ref: 'corps', d: [-0.12, 0.38, 0.22], g: [0.12, 0.38, 0.22] } }),
  penche: P({ piedsPlats: false, bassinY: 0.4, bassinZ: -0.05, busteX: 1.05, teteX: 0.25, robe: false, genou: AGENOU, pieds: PIEDS_PROSTERNE, cheville: CHEVILLE_PROSTERNE, mains: { ref: 'corps', d: [-0.17, 0.05, 0.42], g: [0.17, 0.05, 0.42] } }),
  // le soujoûd : le front et le nez, les deux mains, les deux genoux et le bout des pieds touchent le sol
  // (les hanches plus hautes que la tête, le dos incliné ; le bout de la ceinture se replie pour ne pas dépasser)
  soujoud: P({ piedsPlats: false, bassinY: 0.32, bassinZ: -0.05, busteX: 1.75, teteX: 0.28, robe: false, genou: [0.1, -1, 0.6], pieds: PIEDS_PROSTERNE, cheville: CHEVILLE_PROSTERNE,
    mains: { ref: 'corps', d: [-0.16, 0.035, 0.52], g: [0.16, 0.035, 0.52] } }),
  // assis entre les deux prosternations : assis sur le pied gauche, le pied droit dressé, les mains sur les cuisses
  assis: P(ASSIS),
  // le tachahhoud : la même assise ; la main gauche à plat sur la cuisse, la main droite sur la cuisse, poing fermé, l'index tendu vers la qibla
  tachahhoud: P({ ...ASSIS, teteX: 0.18, index: true, indexX: -1.0 }),
  // le salut final : la tête tourne à droite, puis à gauche
  salamDroite: P({ ...ASSIS, teteX: 0.05, teteY: -0.85 }),
  salamGauche: P({ ...ASSIS, teteX: 0.05, teteY: 0.85 }),
  // se relever depuis le sol (pour la rak‘a suivante)
  releve: P({ bassinY: 0.5, bassinZ: 0.0, busteX: 0.6, teteX: 0.15, robe: false, mains: { ref: 'corps', d: [-0.12, 0.38, 0.24], g: [0.12, 0.38, 0.24] } })
};

// À quel « étage » est chaque position : debout, au sol (prosterné) ou assis
const ETAGE = { debout: 'haut', takbir: 'haut', mains: 'haut', roukou: 'haut', soujoud: 'sol', assis: 'assis', tachahhoud: 'assis', salamDroite: 'assis', salamGauche: 'assis' };

// Le chemin pour aller d'une position à une autre : une liste [posture, durée]
export function chemin(de, vers) {
  const a = ETAGE[de] || 'haut', b = ETAGE[vers] || 'haut', L = [];
  if (a === b) L.push([vers, 0.9]);
  else if (a === 'haut' && b === 'sol') L.push(['plie', 0.55], ['genoux', 0.55], ['penche', 0.5], [vers, 0.7]);
  else if (a === 'haut' && b === 'assis') L.push(['plie', 0.55], ['genoux', 0.55], [vers, 0.7]);
  else if (a === 'sol' && b === 'assis') L.push(['penche', 0.5], [vers, 0.7]);
  else if (a === 'assis' && b === 'sol') L.push(['penche', 0.55], [vers, 0.7]);
  else if (a === 'sol' && b === 'haut') L.push(['penche', 0.5], ['genoux', 0.5], ['releve', 0.55], [vers, 0.7]);
  else if (a === 'assis' && b === 'haut') L.push(['genoux', 0.5], ['releve', 0.55], [vers, 0.7]);
  return L;
}
// le salut : à droite, puis à gauche, puis on revient de face
export const SALAM = [['salamDroite', 1.3], ['assis', 0.6], ['salamGauche', 1.3], ['assis', 0.7]];
