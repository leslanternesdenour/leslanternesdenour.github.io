// LA CHASSE AUX MOTS — contenus : objets (français + arabe écrit en alphabet arabe), lieux, guides, dialogues.
// SOURCE UNIQUE des textes : l'inventaire audio (audio/jeux/chasse-aux-mots/manifeste.json) est GÉNÉRÉ à partir de ce fichier
// (node outils/voix/jeux/inventaire.mjs). Aucune voix n'est considérée comme disponible tant que son fichier n'existe pas.
// Les mots arabes sont ceux du vocabulaire courant de l'enfant ; leur prononciation reste à faire valider (champ « verifie » = false dans l'inventaire).

// det = article + nom ; ar = écriture arabe ; enigme = devinette (niveau 5) ; forme = fabrique 3D (objets3d.js)
export const OBJETS = {
  lanterne: { fr: 'lanterne', det: 'la lanterne', genre: 'f', ar: 'فانوس', enigme: "Je brille dans la nuit et je guide ton chemin. Qui suis-je ?" },
  livre: { fr: 'livre', det: 'le livre', genre: 'm', ar: 'كتاب', enigme: "J'ai des pages et je raconte des histoires. Qui suis-je ?" },
  datte: { fr: 'datte', det: 'la datte', genre: 'f', ar: 'تمرة', enigme: "Je suis un petit fruit sucré qui pousse sur le palmier. Qui suis-je ?" },
  cruche: { fr: 'cruche', det: 'la cruche', genre: 'f', ar: 'جرّة', enigme: "On me remplit d'eau pour boire. Qui suis-je ?" },
  tapis: { fr: 'tapis', det: 'le tapis', genre: 'm', ar: 'سجّادة', enigme: "On marche sur moi, je suis doux et coloré. Qui suis-je ?" },
  pomme: { fr: 'pomme', det: 'la pomme', genre: 'f', ar: 'تفّاحة', enigme: "Je suis un fruit rond qui pousse sur un arbre. Qui suis-je ?" },
  pain: { fr: 'pain', det: 'le pain', genre: 'm', ar: 'خبز', enigme: "On me mange à table, je sors du four tout chaud. Qui suis-je ?" },
  cle: { fr: 'clé', det: 'la clé', genre: 'f', ar: 'مفتاح', enigme: "J'ouvre et je ferme les portes. Qui suis-je ?" },
  panier: { fr: 'panier', det: 'le panier', genre: 'm', ar: 'سلّة', enigme: "On me porte pour transporter les fruits. Qui suis-je ?" },
  rose: { fr: 'rose', det: 'la rose', genre: 'f', ar: 'وردة', enigme: "Je suis une fleur qui sent très bon. Qui suis-je ?" },
  etoile: { fr: 'étoile', det: "l'étoile", genre: 'f', ar: 'نجمة', enigme: "Je brille dans le ciel, la nuit, tout là-haut. Qui suis-je ?" },
  lune: { fr: 'lune', det: 'la lune', genre: 'f', ar: 'قمر', enigme: "Je suis ronde ou en croissant et j'éclaire la nuit. Qui suis-je ?" },
  tasse: { fr: 'tasse', det: 'la tasse', genre: 'f', ar: 'كوب', enigme: "On me tient dans la main pour boire. Qui suis-je ?" },
  plume: { fr: 'plume', det: 'la plume', genre: 'f', ar: 'قلم', enigme: "On m'utilise pour écrire. Qui suis-je ?" },
  raisin: { fr: 'raisin', det: 'le raisin', genre: 'm', ar: 'عنب', enigme: "Je pousse en grappes et je suis sucré. Qui suis-je ?" },
  coussin: { fr: 'coussin', det: 'le coussin', genre: 'm', ar: 'وسادة', enigme: "Je suis tout doux : on s'appuie sur moi pour se reposer. Qui suis-je ?" },
  poisson: { fr: 'poisson', det: 'le poisson', genre: 'm', ar: 'سمكة', enigme: "Je nage dans l'eau. Qui suis-je ?" },
  oiseau: { fr: 'oiseau', det: "l'oiseau", genre: 'm', ar: 'عصفور', enigme: "J'ai des ailes et je chante dans les arbres. Qui suis-je ?" }
};

// 6 lieux : 8 objets chacun (adaptés au lieu), un guide, des couleurs, une introduction
export const LIEUX = {
  marche: { nom: 'Le marché', icone: '🧺', ciel: '#f6d9a0', sol: '#e0b878', brume: '#f3dfb5', guide: 'karim', objets: ['datte', 'pain', 'pomme', 'panier', 'cruche', 'raisin', 'tapis', 'lanterne'],
    intro: "Bonjour explorateur ! Au marché, plusieurs objets ont disparu. Peux-tu m'aider à les retrouver ?" },
  maison: { nom: 'La maison', icone: '🏠', ciel: '#f2e4c8', sol: '#d9bd8a', brume: '#efe0c0', guide: 'salma', objets: ['lanterne', 'tasse', 'cle', 'coussin', 'tapis', 'pain', 'cruche', 'livre'],
    intro: "Bonjour explorateur ! Dans ma maison, quelques objets se sont cachés. Tu veux bien les chercher avec moi ?" },
  jardin: { nom: 'Le jardin', icone: '🌷', ciel: '#bfe6d6', sol: '#8fc27a', brume: '#d3efdf', guide: 'yacine', objets: ['rose', 'pomme', 'raisin', 'oiseau', 'panier', 'cruche', 'datte', 'lanterne'],
    intro: "Bonjour explorateur ! Dans le jardin, des objets se sont cachés parmi les fleurs. Peux-tu les retrouver ?" },
  bibliotheque: { nom: 'La bibliothèque', icone: '📚', ciel: '#d9cdf0', sol: '#c9ab7a', brume: '#e4daf5', guide: 'warda', objets: ['livre', 'plume', 'lanterne', 'cle', 'coussin', 'tapis', 'etoile', 'lune'],
    intro: "Chut… Bonjour explorateur ! Dans la bibliothèque, des objets ont glissé des étagères. Aide-moi à les retrouver !" },
  oasis: { nom: "L'oasis", icone: '🌴', ciel: '#a9e0f0', sol: '#e6cf8f', brume: '#cdeef5', guide: 'samir', objets: ['datte', 'poisson', 'oiseau', 'cruche', 'lune', 'etoile', 'panier', 'tapis'],
    intro: "Bonjour explorateur ! À l'oasis, des objets sont tombés près de l'eau. Peux-tu m'aider à les retrouver ?" },
  village: { nom: 'Le village', icone: '🏘️', ciel: '#f4cfa0', sol: '#d8b078', brume: '#f2d9b2', guide: 'hakim', objets: ['lanterne', 'pain', 'cle', 'tasse', 'coussin', 'panier', 'oiseau', 'cruche'],
    intro: "Bonjour explorateur ! Plusieurs objets ont disparu dans le village. Peux-tu nous aider à les retrouver ?" }
};

// Les guides : une personnalité et une voix stable chacun (rôle vocal dans l'inventaire ; la voix réelle sera attribuée à la production)
export const GUIDES = {
  karim: { nom: 'Karim', metier: 'le marchand', voix: 'perso-karim', ton: 'chaleureux et blagueur', tunique: '#b8553a', pantalon: '#4a3a2a', cheche: '#f1e3c0', peau: '#b07a52' },
  salma: { nom: 'Salma', metier: 'la maîtresse de maison', voix: 'perso-salma', ton: 'douce et rassurante', tunique: '#7a5ac0', pantalon: '#3a2f5a', cheche: '#f6ecd8', peau: '#c08a62', voile: '#e9dcf8' },
  yacine: { nom: 'Yacine', metier: 'le jardinier', voix: 'perso-yacine', ton: 'calme et émerveillé', tunique: '#4f9a4a', pantalon: '#5a4a2a', cheche: '#e9e2b8', peau: '#a8724c' },
  warda: { nom: 'Warda', metier: 'la gardienne de la bibliothèque', voix: 'perso-warda', ton: 'posée, qui chuchote un peu', tunique: '#3d4f9a', pantalon: '#2a2f4a', cheche: '#f0e8d0', peau: '#b98458', voile: '#d9d2f2' },
  samir: { nom: 'Samir', metier: 'le puisatier', voix: 'perso-samir', ton: 'joyeux et énergique', tunique: '#2f9aa8', pantalon: '#3a4f5a', cheche: '#f4ead2', peau: '#9a6a46' },
  hakim: { nom: 'Hakim', metier: 'le sage du village', voix: 'perso-hakim', ton: 'grave et bienveillant', tunique: '#8a6a3a', pantalon: '#4a3a2a', cheche: '#efe6cc', peau: '#a8724c', barbe: '#d8d0c0' }
};

// Phrases communes (IDs stables : inventaire audio). {det} {nom} sont remplacés par l'objet.
export const PHRASES = {
  bienvenue: { role: 'narratrice', texte: "Bienvenue dans la Chasse aux mots ! Choisis un lieu, puis pars à l'aventure." },
  age: { role: 'narratrice', texte: "Quel âge as-tu ? Choisis ton groupe, pour que les jeux soient à ta taille." },
  trouve: { role: 'guide', texte: 'Trouve {det} !' },
  trouve_mot: { role: 'guide', texte: 'Trouve ce mot : {nom}.' },
  trouve_ecoute: { role: 'guide', texte: 'Écoute bien, puis trouve {det}.' },
  bravo: { role: 'guide', texte: 'Bravo ! Tu as trouvé {det} !' },
  bravo2: { role: 'guide', texte: "Super, c'est bien {det} !" },
  bravo3: { role: 'guide', texte: 'Magnifique, tu as de bons yeux !' },
  erreur: { role: 'loumi', texte: 'Regarde bien les indices. Tu peux réessayer.' },
  erreur2: { role: 'loumi', texte: "Ce n'est pas celui-là, mais tu y es presque. Cherche encore !" },
  aide: { role: 'loumi', texte: 'Regarde, je fais briller un indice pour toi !' },
  fin: { role: 'guide', texte: "Félicitations ! Tu as tout retrouvé. Une nouvelle découverte t'attend !" },
  fin_diplome: { role: 'narratrice', texte: "Félicitations ! Tu as gagné un diplôme d'explorateur !" },
  fin_grand: { role: 'narratrice', texte: "Incroyable ! Tu as exploré tous les lieux. Tu es un grand explorateur des lanternes !" },
  mot_nouveau: { role: 'loumi', texte: "Tu as appris un nouveau mot, en français et en arabe !" }
};

// Remplit une phrase pour un objet
export const dire = (modele, objet) => modele.replace('{det}', objet ? OBJETS[objet].det : '').replace('{nom}', objet ? OBJETS[objet].fr : '').replace(/\s+/g, ' ').trim();
// Alterner les félicitations pour éviter les répétitions mécaniques
export const BRAVOS = ['bravo', 'bravo2', 'bravo3'];
export const ERREURS = ['erreur', 'erreur2'];

// Inventaire complet des phrases (pour l'audio) : [{id, role, langue, texte}]
export function inventaire() {
  const L = [];
  // rôles vocaux : « guide » = narrateur masculin (les consignes), « narratrice », « loumi », « perso-… » (le guide du lieu, pour son introduction)
  const add = (id, role, langue, texte, extra = {}) => L.push({ id, role: role === 'guide' ? 'narrateur' : role, langue, texte, ...extra });
  for (const [id, p] of Object.entries(PHRASES)) {
    if (/\{(det|nom)\}/.test(p.texte)) for (const o of Object.keys(OBJETS)) add(`${id}.${o}`, p.role, 'fr', dire(p.texte, o), { objet: o });
    else add(id, p.role, 'fr', p.texte);
  }
  for (const [o, d] of Object.entries(OBJETS)) { add(`mot.${o}`, 'narratrice', 'fr', `${d.det}.`, { objet: o }); add(`ar.${o}`, 'narratrice', 'ar', d.ar, { objet: o }); add(`enigme.${o}`, 'guide', 'fr', d.enigme, { objet: o }); }
  for (const [l, d] of Object.entries(LIEUX)) add(`intro.${l}`, GUIDES[d.guide].voix, 'fr', d.intro, { lieu: l });
  return L;
}
