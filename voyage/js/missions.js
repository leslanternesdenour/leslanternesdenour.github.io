// Les missions du Grand Voyage : DONNÉES et TEXTES, indépendants de tout personnage.
// - Une mission ne dépend jamais d'un habitant : elle se commence depuis le carnet, se poursuit en jouant, et se rend à un POINT DE RENDU (un lieu, pas un personnage).
// - Un « donneur » est seulement une étiquette (nom + visage affichés dans le dialogue). Tout habitant — Nour, Salim, un futur marchand… — peut proposer une mission
//   en appelant aventure.proposer(id) ; aucun n'est obligatoire.
// - Les TEXTES ci-dessous sont repris MOT POUR MOT : les voix enregistrées retrouvent leur phrase à partir du texte exact (voir voix.js).
//   Le test outils/tests/missions-caracterisation.test.mjs (golden des voix) échoue si une phrase est modifiée.

export const MISSIONS = {
  lanternes: { titre: 'Les lanternes cachées', icone: '🏮', total: 12, recompense: 200, lot: 'nour',
    resume: 'Douze petites lanternes dorées se sont cachées dans tout le pays de Nour. Retrouve-les toutes !' },
  objets: { titre: 'Les objets perdus de Nour', icone: '🧺', total: 3, recompense: 150, lot: 'nour',
    resume: 'Nour a perdu son seau, sa gourde et son arrosoir près de l\'oasis. Retrouve-les et rapporte-les-lui au village.' },
  tresor: { titre: 'Le trésor de l\'oasis', icone: '🗝️', total: 4, recompense: 250,
    resume: 'Suis les petits tas de pierres au ruban turquoise : chacun donne un indice. Le dernier mène au coffre.' },
  voyageur: { titre: 'Aider le voyageur', icone: '🤝', total: 4, recompense: 200,
    resume: 'Salim, le voyageur du camp, a besoin de 2 paniers de dattes et de 2 outres d\'eau. Va les chercher à l\'oasis et apporte-les-lui.' },
  animaux: { titre: 'Les animaux du désert', icone: '🦊', total: 7, recompense: 150,
    resume: 'Observe sept animaux différents et découvre comment ils vivent. Approche doucement, sans courir !' }
};

// Qui présente un lot de missions (étiquette d'affichage seulement). Ajouter un habitant = ajouter une ligne ici.
export const DONNEURS = {
  nour: { titre: 'Nour', mascotte: 'nour' }
};

// Les missions proposées ensemble (une seule présentation, un seul « Oui, je t'aide ! »)
export const LOTS = {
  nour: { donneur: 'nour', ids: ['lanternes', 'objets'] }
};

// Le point de rendu des objets perdus : le panier au village (même endroit que l'ancien lieu de livraison : la boussole et les sauvegardes restent valables)
export const PANIER = { x: -5.5, z: 5 };

// Phrases (identiques à celles déjà enregistrées en voix)
export const TEXTES = {
  proposition: "J'ai besoin de toi ! Douze petites lanternes se sont cachées dans tout le pays… et j'ai perdu mon seau, ma gourde et mon arrosoir près de l'oasis. Tu veux bien m'aider ?",
  rendu: (n, reste) => `Merci, tu as retrouvé ${n > 1 ? 'mes affaires' : 'une de mes affaires'} ! Il en manque encore ${reste}.`,
  renduFinal: 'Mon seau, ma gourde et mon arrosoir ! Merci mille fois. Grâce à toi, je peux arroser les fleurs du village.',
  conseils: titres => `Courage ! Regarde ton carnet pour suivre tes missions : ${titres.join(', ')}.`,
  toutesFinies: 'Tu as réussi toutes les missions ! Tu es un vrai explorateur du pays de Nour.'
};
