// Les textes du Grand Voyage.
// Règles : versets en écriture arabe exacte + sens en français + référence (sourate, verset).
// Le « sens du verset » est une explication pour les enfants, pas une traduction mot à mot.
// Aucune parole n'est attribuée au Prophète ﷺ. Relecture par un imam recommandée avant mise en ligne.
// La synthèse vocale du navigateur ne lit JAMAIS le texte arabe du Coran (prononciation non garantie).

export const ZONES = [
  { id: 'village',   nom: 'Le village de Nour',      icone: '🏘️' },
  { id: 'marche',    nom: 'Le marché',               icone: '🛍️' },
  { id: 'oasis',     nom: "L'oasis",                 icone: '🌴' },
  { id: 'camp',      nom: 'Le camp des caravanes',   icone: '⛺' },
  { id: 'dunes',     nom: 'Le grand désert',         icone: '🏜️' },
  { id: 'montagnes', nom: 'Les montagnes',           icone: '⛰️' }
];

export const BIENTOT = [
  { icone: '🕋', nom: 'La Mecque et la Kaaba' },
  { icone: '🕌', nom: 'Médine' },
  { icone: '⛰️', nom: 'Le mont Hira' },
  { icone: '⛰️', nom: 'Le mont Thawr' }
];

export const POINTS = {
  nour: {
    titre: 'Nour te souhaite la bienvenue',
    mascotte: 'nour',
    texte: "As-salâmou ʿalaykoum ! Bienvenue dans mon village. Le chameau Sablo t'attend à la sortie du village, du côté du soleil levant. Monte sur son dos, et partez découvrir l'oasis, le camp des caravanes et le grand désert !",
    decouverte: 'Nour m\'a accueilli au village'
  },
  sablo: {
    titre: 'Sablo, le chameau',
    texte: "Le chameau peut marcher très longtemps dans le désert, sous le soleil, en buvant très peu. Dans le Coran, Allah nous invite à regarder les chameaux et à réfléchir à la façon dont ils ont été créés.",
    arabe: 'أَفَلَا يَنظُرُونَ إِلَى الْإِبِلِ كَيْفَ خُلِقَتْ',
    sens: 'Sens du verset : « Ne regardent-ils donc pas les chameaux, comment ils ont été créés ? »',
    source: 'Coran, sourate Al-Ghâchiya (88), verset 17',
    decouverte: 'Les chameaux (sourate 88, verset 17)'
  },
  oasis: {
    titre: "L'oasis",
    texte: "Une oasis, c'est un endroit du désert où il y a de l'eau. Grâce à l'eau, les palmiers poussent, les oiseaux viennent boire et les voyageurs peuvent se reposer. Toute vie a besoin d'eau.",
    arabe: 'وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ',
    sens: 'Sens du verset : « Et Nous avons fait, à partir de l\'eau, toute chose vivante. »',
    source: 'Coran, sourate Al-Anbiyâ (21), verset 30',
    decouverte: "L'eau donne la vie (sourate 21, verset 30)"
  },
  camp: {
    titre: 'Le camp des caravanes',
    texte: "Autrefois, pour traverser le désert, on voyageait en caravane : une longue file de chameaux qui portaient l'eau, la nourriture et les marchandises. Le soir, on montait les tentes et on se reposait près du feu.",
    decouverte: 'Les caravanes du désert'
  },
  dunes: {
    titre: 'Le grand désert',
    texte: "Les dunes sont des collines de sable. Le vent les pousse et les dessine, petit à petit. Regarde comme la terre est grande et belle !",
    arabe: 'وَإِلَى الْأَرْضِ كَيْفَ سُطِحَتْ',
    sens: 'Sens du verset : « Et la terre, comment elle a été étendue ? »',
    source: 'Coran, sourate Al-Ghâchiya (88), verset 20',
    decouverte: 'La terre (sourate 88, verset 20)'
  },
  etoiles: {
    titre: 'Le rocher des étoiles',
    texte: "Tu as trouvé un endroit secret ! La nuit, dans le désert, on voit des milliers d'étoiles. Autrefois, les voyageurs les regardaient pour retrouver leur chemin.",
    arabe: 'وَإِلَى السَّمَاءِ كَيْفَ رُفِعَتْ',
    sens: 'Sens du verset : « Et le ciel, comment il a été élevé ? »',
    source: 'Coran, sourate Al-Ghâchiya (88), verset 18',
    decouverte: 'Le ciel (sourate 88, verset 18)'
  },
  montagnes: {
    titre: 'Le belvédère des montagnes',
    texte: "Bravo, tu es arrivé tout en haut ! D'ici, on voit tout le pays de Nour : le village, l'oasis et le désert. Les montagnes sont immenses et solides.",
    arabe: 'وَإِلَى الْجِبَالِ كَيْفَ نُصِبَتْ',
    sens: 'Sens du verset : « Et les montagnes, comment elles ont été dressées ? »',
    source: 'Coran, sourate Al-Ghâchiya (88), verset 19',
    decouverte: 'Les montagnes (sourate 88, verset 19)'
  },
  soins: {
    titre: 'Prendre soin de Sablo',
    texte: "Sablo aime la douceur ! Un chameau a besoin d'eau propre, de nourriture, d'ombre et de repos après un long voyage. On ne le frappe jamais, on ne le charge pas trop, et on lui parle gentiment. Être bon avec les animaux, c'est une belle action.",
    sens: "Le Prophète ﷺ a raconté l'histoire d'un homme qui a donné à boire à un chien qui avait très soif : Allah l'a remercié et lui a pardonné.",
    source: 'Hadith rapporté par al-Bukhârî et Muslim (sens du hadith)',
    decouverte: 'Prendre soin des animaux'
  },
  bientot: {
    titre: 'De nouveaux voyages',
    texte: "Plus loin, d'autres lieux t'attendent. Ils se préparent avec soin : reviens bientôt pour continuer le voyage !",
    decouverte: null
  },
  colFerme: {
    titre: 'Le chemin des montagnes',
    texte: "Ce chemin s'ouvrira quand tu auras découvert l'oasis et le camp des caravanes. Monte sur Sablo, c'est plus rapide !",
    decouverte: null
  },
  colOuvert: {
    titre: 'Le chemin est ouvert !',
    texte: "Tu as découvert l'oasis et le camp des caravanes. Le chemin des montagnes est ouvert : monte jusqu'au belvédère !",
    decouverte: null
  }
};
