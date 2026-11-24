// LES LIEUX DE LA CITÉ ET DES MONTAGNES — noms et textes « À VALIDER ». Les données neutres (positions, décor) sont dans donnees.js ; ici, seulement ce qui doit être relu
// par une personne compétente : noms réels des lieux, textes pédagogiques, histoires placées dans chaque lieu. Aucun dialogue, aucune parole attribuée, aucune date.
// Les lieux de la cité sont une INTERPRÉTATION artistique (jamais une reconstitution exacte).
const STATUT = 'À VALIDER';
const l = (nom, icone, petit, grand, recits = [], extra = {}) => ({ nom, icone, petit, grand, recits, statut: STATUT, ...extra });

export const LIEUX_SACRES = {
  'crete-vue': l('La vallée de La Mecque', '🌅', 'Au fond de la vallée, une cité apparaît : La Mecque.', 'Du haut de la crête, on découvre la vallée où se trouve La Mecque. Selon la tradition, elle a grandi petit à petit autour d\'un lieu important.', ['communaute-mecque']),
  'cite-place': l('La Kaaba et sa place', '🕋', 'Au centre de la cité se trouve la Kaaba, au milieu d\'une grande place vide.', 'Au centre de la cité se trouve la Kaaba, au milieu d\'une grande place dégagée. Selon la tradition islamique, c\'est vers elle que les musulmans se tournent pour prier. Dans le jeu, on observe de loin : l\'entrée est interdite et l\'intérieur n\'est jamais montré.', ['fondations-kaaba', 'quraysh-reconstruction'], { acces: 'interdit' }),
  'cite-puits': l('Le puits de Zamzam', '🏺', 'Voici le puits de Zamzam : un puits très important pour les musulmans.', 'Voici le puits de Zamzam. Selon la tradition, son eau est apparue dans la vallée, comme le raconte l\'histoire de Hajar et d\'Ismaïl. Le puits du jeu est un décor ancien et sobre : ce n\'est pas une reconstitution exacte.', ['hajar-ismail-zamzam', 'redecouverte-zamzam']),
  'cite-colline-a': l('Safa', '⛰️', 'Voici Safa, une petite colline de pierre.', 'Voici Safa, une petite colline rocheuse. Dans le Coran, Safa et Marwa sont cités parmi les signes d\'Allah. Observe-la et lis son histoire : il n\'y a ni course ni chronomètre.', ['safa-marwa']),
  'cite-colline-b': l('Marwa', '⛰️', 'Voici Marwa, l\'autre petite colline de pierre.', 'Voici Marwa, l\'autre petite colline rocheuse. Elle est reliée à Safa par un chemin plat. Dans le jeu, on le parcourt tranquillement, comme on se promène.', ['safa-marwa']),
  'montagne-nord-pied': l('Jabal an-Nour', '⛰️', 'Voici Jabal an-Nour, une montagne près de La Mecque.', 'Voici Jabal an-Nour, une montagne près de La Mecque. Selon la tradition, la grotte de Hira se trouve vers son sommet. Dans le jeu, on observe seulement la montagne et l\'extérieur de la grotte : aucune scène n\'est montrée et personne n\'est représenté.', ['jabal-an-nour'], { grotte: 'Hira' }),
  'montagne-sud-pied': l('Jabal Thawr', '⛰️', 'Voici Jabal Thawr, une montagne au sud de La Mecque.', 'Voici Jabal Thawr, une montagne au sud de La Mecque. Selon la tradition, une grotte de cette montagne est liée à l\'histoire de la Hijra. Dans le jeu, on observe seulement la montagne et l\'extérieur de la grotte : aucune scène n\'est montrée et personne n\'est représenté.', ['jabal-thawr'], { grotte: 'Thawr' })
};
export const infoSacree = id => LIEUX_SACRES[id] || null;
