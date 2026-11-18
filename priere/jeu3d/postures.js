// Les positions de la prière pour le personnage 3D, et les passages de l'une à l'autre.
// Repère du personnage : il regarde +z (la qibla). Main droite = côté x négatif.
// Les mains et les pieds sont placés par le moteur de gestes (cinématique inverse) : genoux et coudes plient naturellement.

const base = { bassinY: 0.62, bassinZ: 0, busteX: 0.02, busteY: 0, teteX: 0.14, teteY: 0, teteZ: 0, robe: true,
  pieds: { d: [-0.09, 0.033, 0], g: [0.09, 0.033, 0] },
  mains: { ref: 'corps', d: [-0.2, 0.42, 0.03], g: [0.2, 0.42, 0.03] } };
const P = o => ({ ...base, ...o });
// les genoux vers l'avant et vers le bas (à genoux, assis, prosterné)
const AGENOU = [0.1, -0.35, 1];
// à genoux / assis : les pieds derrière, sous le corps
const PIEDS_ASSIS = { d: [-0.1, 0.06, -0.2], g: [0.1, 0.06, -0.2] };
const PIEDS_PROSTERNE = { d: [-0.09, 0.09, -0.27], g: [0.09, 0.09, -0.27] };

export const POSTURES = {
  // debout, les bras le long du corps, le regard vers l'endroit où ira le front
  debout: P({}),
  // le takbîr : les mains montent à hauteur des épaules ou des oreilles
  takbir: P({ teteX: 0.1, mains: { ref: 'tete', d: [-0.18, -0.04, 0.1], g: [0.18, -0.04, 0.1] } }),
  // debout, les mains posées (la main droite sur la gauche, sur la poitrine)
  mains: P({ mains: { ref: 'corps', d: [-0.035, 0.84, 0.19], g: [0.03, 0.82, 0.17] } }),
  // le roukoû‘ : le dos bien droit, les mains sur les genoux
  roukou: P({ bassinY: 0.6, bassinZ: -0.07, busteX: 1.42, teteX: -0.05, mains: { ref: 'corps', d: [-0.11, 0.33, 0.07], g: [0.11, 0.33, 0.07] },
    pieds: { d: [-0.09, 0.033, 0.0], g: [0.09, 0.033, 0.0] } }),
  // les passages (pas des positions de la prière : juste pour bouger joliment)
  plie: P({ bassinY: 0.48, bassinZ: -0.06, busteX: 0.55, teteX: 0.1, robe: false, mains: { ref: 'corps', d: [-0.12, 0.36, 0.22], g: [0.12, 0.36, 0.22] } }),
  genoux: P({ bassinY: 0.44, bassinZ: -0.02, busteX: 0.3, teteX: 0.15, robe: false, genou: AGENOU, pieds: PIEDS_PROSTERNE, mains: { ref: 'corps', d: [-0.12, 0.38, 0.22], g: [0.12, 0.38, 0.22] } }),
  penche: P({ bassinY: 0.4, bassinZ: -0.05, busteX: 1.05, teteX: 0.25, robe: false, genou: AGENOU, pieds: PIEDS_PROSTERNE, mains: { ref: 'corps', d: [-0.17, 0.05, 0.42], g: [0.17, 0.05, 0.42] } }),
  // le soujoûd : le front et le nez, les deux mains, les deux genoux et le bout des pieds touchent le sol
  soujoud: P({ bassinY: 0.43, bassinZ: -0.02, busteX: 1.92, teteX: 0.28, robe: false, genou: AGENOU, pieds: PIEDS_PROSTERNE,
    mains: { ref: 'corps', d: [-0.16, 0.035, 0.5], g: [0.16, 0.035, 0.5] } }),
  // assis entre les deux prosternations (et pour le tachahhoud) : assis sur les talons, les mains sur les cuisses
  assis: P({ bassinY: 0.3, bassinZ: -0.06, busteX: 0.06, teteX: 0.18, robe: false, genou: AGENOU, pieds: PIEDS_ASSIS,
    mains: { ref: 'corps', d: [-0.11, 0.3, 0.2], g: [0.11, 0.3, 0.2] } }),
  // le tachahhoud : assis, la main droite un peu levée (l'index levé)
  tachahhoud: P({ bassinY: 0.3, bassinZ: -0.06, busteX: 0.06, teteX: 0.2, robe: false, genou: AGENOU, pieds: PIEDS_ASSIS,
    mains: { ref: 'corps', d: [-0.1, 0.36, 0.25], g: [0.11, 0.3, 0.2] } }),
  // le salut final : la tête tourne à droite, puis à gauche
  salamDroite: P({ bassinY: 0.3, bassinZ: -0.06, busteX: 0.06, teteX: 0.05, teteY: -0.85, robe: false, genou: AGENOU, pieds: PIEDS_ASSIS,
    mains: { ref: 'corps', d: [-0.11, 0.3, 0.2], g: [0.11, 0.3, 0.2] } }),
  salamGauche: P({ bassinY: 0.3, bassinZ: -0.06, busteX: 0.06, teteX: 0.05, teteY: 0.85, robe: false, genou: AGENOU, pieds: PIEDS_ASSIS,
    mains: { ref: 'corps', d: [-0.11, 0.3, 0.2], g: [0.11, 0.3, 0.2] } }),
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
