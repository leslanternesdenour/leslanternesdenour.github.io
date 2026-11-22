// L'ÉCOLE DES LETTRES ARABES — contenu pédagogique : les 28 lettres, leurs noms, leurs sons, un mot d'exemple illustré, les familles de lettres jumelles, les 8 chapitres.
// SOURCE UNIQUE (l'inventaire audio est généré ici : node outils/voix/jeux/inventaire.mjs ecole-lettres). Les contours des lettres viennent de glyphes.json (police Amiri, SIL OFL) : jamais redessinés.
// ⚠ Les noms, sons (descriptions en français), mots vocalisés et translittérations sont à FAIRE VALIDER par une personne compétente en arabe avant d'être considérés comme validés
// (statut « aValider » dans l'inventaire audio). Rien n'est inventé : noms usuels des lettres et mots courants du vocabulaire de l'enfant.
// joint : la lettre se lie à la suivante (false pour ا د ذ ر ز و). points : nombre et position des points (0 = aucun). famille : lettres de même squelette (« jumelles »).
// syllabe : la lettre + fatha, utilisée pour entendre son SON (ex. « بَ » = ba), jamais le nom.
export const LETTRES = [
  { id: 'alif', ar: 'ا', nom: 'ألف', nomFr: 'Alif', joint: false, points: [0, ''], famille: 'alif', syllabe: 'أَ', son: 'a', sonFr: 'une voyelle « a » (la lettre alif porte souvent la voyelle)', mot: { ar: 'أَسَد', tr: 'asad', fr: 'le lion', emoji: '🦁' } },
  { id: 'ba', ar: 'ب', nom: 'باء', nomFr: 'Baa', joint: true, points: [1, 'dessous'], famille: 'ba', syllabe: 'بَ', son: 'b', sonFr: 'comme « b » dans « bateau »', mot: { ar: 'بَطَّة', tr: 'batta', fr: 'le canard', emoji: '🦆' } },
  { id: 'ta', ar: 'ت', nom: 'تاء', nomFr: 'Taa', joint: true, points: [2, 'dessus'], famille: 'ba', syllabe: 'تَ', son: 't', sonFr: 'comme « t » dans « tasse »', mot: { ar: 'تُفَّاحَة', tr: 'tuffaha', fr: 'la pomme', emoji: '🍎' } },
  { id: 'tha', ar: 'ث', nom: 'ثاء', nomFr: 'Thaa', joint: true, points: [3, 'dessus'], famille: 'ba', syllabe: 'ثَ', son: 'th', sonFr: 'comme le « th » anglais de « think »', mot: { ar: 'ثَعْلَب', tr: 'tha\'lab', fr: 'le renard', emoji: '🦊' } },
  { id: 'nun', ar: 'ن', nom: 'نون', nomFr: 'Noun', joint: true, points: [1, 'dessus'], famille: 'ba', syllabe: 'نَ', son: 'n', sonFr: 'comme « n » dans « nuage »', mot: { ar: 'نَجْمَة', tr: 'najma', fr: 'l\'étoile', emoji: '⭐' } },
  { id: 'ya', ar: 'ي', nom: 'ياء', nomFr: 'Yaa', joint: true, points: [2, 'dessous'], famille: 'ba', syllabe: 'يَ', son: 'y', sonFr: 'comme « y » dans « yaourt »', mot: { ar: 'يَد', tr: 'yad', fr: 'la main', emoji: '✋' } },
  { id: 'jim', ar: 'ج', nom: 'جيم', nomFr: 'Jim', joint: true, points: [1, 'dessous'], famille: 'jim', syllabe: 'جَ', son: 'j', sonFr: 'comme « j » dans « jour »', mot: { ar: 'جَمَل', tr: 'jamal', fr: 'le chameau', emoji: '🐫' } },
  { id: 'ha', ar: 'ح', nom: 'حاء', nomFr: 'Haa', joint: true, points: [0, ''], famille: 'jim', syllabe: 'حَ', son: 'ḥ', sonFr: 'un « h » soufflé fort, du fond de la gorge', mot: { ar: 'حِصَان', tr: 'hisan', fr: 'le cheval', emoji: '🐴' } },
  { id: 'kha', ar: 'خ', nom: 'خاء', nomFr: 'Khaa', joint: true, points: [1, 'dessus'], famille: 'jim', syllabe: 'خَ', son: 'kh', sonFr: 'comme la « jota » espagnole ou le « ch » allemand de « Bach »', mot: { ar: 'خَرُوف', tr: 'kharouf', fr: 'le mouton', emoji: '🐑' } },
  { id: 'dal', ar: 'د', nom: 'دال', nomFr: 'Daal', joint: false, points: [0, ''], famille: 'dal', syllabe: 'دَ', son: 'd', sonFr: 'comme « d » dans « dattier »', mot: { ar: 'دُبّ', tr: 'dubb', fr: 'l\'ours', emoji: '🐻' } },
  { id: 'dhal', ar: 'ذ', nom: 'ذال', nomFr: 'Dhaal', joint: false, points: [1, 'dessus'], famille: 'dal', syllabe: 'ذَ', son: 'dh', sonFr: 'comme le « th » anglais de « this »', mot: { ar: 'ذُرَة', tr: 'dhura', fr: 'le maïs', emoji: '🌽' } },
  { id: 'ra', ar: 'ر', nom: 'راء', nomFr: 'Raa', joint: false, points: [0, ''], famille: 'ra', syllabe: 'رَ', son: 'r', sonFr: 'un « r » roulé', mot: { ar: 'رَمْل', tr: 'raml', fr: 'le sable', emoji: '🏜️' } },
  { id: 'zay', ar: 'ز', nom: 'زاي', nomFr: 'Zaay', joint: false, points: [1, 'dessus'], famille: 'ra', syllabe: 'زَ', son: 'z', sonFr: 'comme « z » dans « zèbre »', mot: { ar: 'زَهْرَة', tr: 'zahra', fr: 'la fleur', emoji: '🌸' } },
  { id: 'sin', ar: 'س', nom: 'سين', nomFr: 'Siin', joint: true, points: [0, ''], famille: 'sin', syllabe: 'سَ', son: 's', sonFr: 'comme « s » dans « soleil »', mot: { ar: 'سَمَكَة', tr: 'samaka', fr: 'le poisson', emoji: '🐟' } },
  { id: 'shin', ar: 'ش', nom: 'شين', nomFr: 'Chiin', joint: true, points: [3, 'dessus'], famille: 'sin', syllabe: 'شَ', son: 'ch', sonFr: 'comme « ch » dans « chat »', mot: { ar: 'شَمْس', tr: 'chams', fr: 'le soleil', emoji: '☀️' } },
  { id: 'sad', ar: 'ص', nom: 'صاد', nomFr: 'Saad', joint: true, points: [0, ''], famille: 'sad', syllabe: 'صَ', son: 'ṣ', sonFr: 'un « s » appuyé, plus grave', mot: { ar: 'صَقْر', tr: 'saqr', fr: 'le faucon', emoji: '🦅' } },
  { id: 'dad', ar: 'ض', nom: 'ضاد', nomFr: 'Daad', joint: true, points: [1, 'dessus'], famille: 'sad', syllabe: 'ضَ', son: 'ḍ', sonFr: 'un « d » appuyé, plus grave', mot: { ar: 'ضِفْدَع', tr: 'difda\'', fr: 'la grenouille', emoji: '🐸' } },
  { id: 'ta2', ar: 'ط', nom: 'طاء', nomFr: 'Taa grave', joint: true, points: [0, ''], famille: 'ta2', syllabe: 'طَ', son: 'ṭ', sonFr: 'un « t » appuyé, plus grave', mot: { ar: 'طَبْل', tr: 'tabl', fr: 'le tambour', emoji: '🥁' } },
  { id: 'za2', ar: 'ظ', nom: 'ظاء', nomFr: 'Zhaa grave', joint: true, points: [1, 'dessus'], famille: 'ta2', syllabe: 'ظَ', son: 'ẓ', sonFr: 'un « dh » appuyé, plus grave', mot: { ar: 'ظَبْي', tr: 'zabi', fr: 'la gazelle', emoji: '🦌' } },
  { id: 'ayn', ar: 'ع', nom: 'عين', nomFr: 'Aïn', joint: true, points: [0, ''], famille: 'ayn', syllabe: 'عَ', son: 'ʿ', sonFr: 'un son profond de la gorge, propre à l\'arabe', mot: { ar: 'عِنَب', tr: 'inab', fr: 'le raisin', emoji: '🍇' } },
  { id: 'ghayn', ar: 'غ', nom: 'غين', nomFr: 'Ghaïn', joint: true, points: [1, 'dessus'], famille: 'ayn', syllabe: 'غَ', son: 'gh', sonFr: 'comme un « r » grasseyé', mot: { ar: 'غَيْمَة', tr: 'ghayma', fr: 'le nuage', emoji: '☁️' } },
  { id: 'fa', ar: 'ف', nom: 'فاء', nomFr: 'Faa', joint: true, points: [1, 'dessus'], famille: 'fa', syllabe: 'فَ', son: 'f', sonFr: 'comme « f » dans « fleur »', mot: { ar: 'فِيل', tr: 'fil', fr: 'l\'éléphant', emoji: '🐘' } },
  { id: 'qaf', ar: 'ق', nom: 'قاف', nomFr: 'Qaaf', joint: true, points: [2, 'dessus'], famille: 'fa', syllabe: 'قَ', son: 'q', sonFr: 'un « k » prononcé tout au fond de la gorge', mot: { ar: 'قَمَر', tr: 'qamar', fr: 'la lune', emoji: '🌙' } },
  { id: 'kaf', ar: 'ك', nom: 'كاف', nomFr: 'Kaaf', joint: true, points: [0, ''], famille: 'kaf', syllabe: 'كَ', son: 'k', sonFr: 'comme « k » dans « kilo »', mot: { ar: 'كِتَاب', tr: 'kitab', fr: 'le livre', emoji: '📖' } },
  { id: 'lam', ar: 'ل', nom: 'لام', nomFr: 'Laam', joint: true, points: [0, ''], famille: 'kaf', syllabe: 'لَ', son: 'l', sonFr: 'comme « l » dans « lune »', mot: { ar: 'لَيْمُون', tr: 'laymoun', fr: 'le citron', emoji: '🍋' } },
  { id: 'mim', ar: 'م', nom: 'ميم', nomFr: 'Miim', joint: true, points: [0, ''], famille: 'mim', syllabe: 'مَ', son: 'm', sonFr: 'comme « m » dans « maman »', mot: { ar: 'مَوْز', tr: 'mawz', fr: 'la banane', emoji: '🍌' } },
  { id: 'ha2', ar: 'ه', nom: 'هاء', nomFr: 'Haa léger', joint: true, points: [0, ''], famille: 'ha2', syllabe: 'هَ', son: 'h', sonFr: 'un « h » léger, soufflé', mot: { ar: 'هُدْهُد', tr: 'hudhud', fr: 'la huppe', emoji: '🐦' } },
  { id: 'waw', ar: 'و', nom: 'واو', nomFr: 'Waaw', joint: false, points: [0, ''], famille: 'waw', syllabe: 'وَ', son: 'w', sonFr: 'comme « ou » dans « oui »', mot: { ar: 'وَرْدَة', tr: 'warda', fr: 'la rose', emoji: '🌹' } }
];
export const PAR_ID = Object.fromEntries(LETTRES.map(l => [l.id, l]));
export const IDS = LETTRES.map(l => l.id);
// Formes de présentation d'une lettre dans glyphes.json : isolee, finale, initiale, mediane (les lettres qui ne se lient pas n'ont que isolee et finale)
export const formesDe = l => (l.joint ? ['isolee', 'initiale', 'mediane', 'finale'] : ['isolee', 'finale']);
export const NOMS_FORMES = { isolee: 'Isolée', initiale: 'Au début', mediane: 'Au milieu', finale: 'À la fin' };

// Les 8 chapitres du Parcours des découvertes : on avance par FAMILLES de lettres (les jumelles se découvrent ensemble : ب ت ث ن ي, ج ح خ…)
export const CHAPITRES = [
  { id: 'c1', nom: 'Les premières lumières', icone: '🏮', lettres: ['alif', 'ba', 'ta', 'tha'], intro: "Bienvenue à l'école de Nour ! Nous allons découvrir les premières lettres : l'alif, le baa, le taa et le thaa. Regarde bien leurs points !" },
  { id: 'c2', nom: 'Les lettres du puits', icone: '🪣', lettres: ['nun', 'ya'], intro: "Voici deux nouvelles lettres : le noun et le yaa. Elles ressemblent à leurs grandes sœurs du baa. Sauras-tu les reconnaître ?" },
  { id: 'c3', nom: 'Les lettres de la dune', icone: '🏜️', lettres: ['jim', 'ha', 'kha'], intro: "Dans le désert, trois lettres se ressemblent : le jim, le haa et le khaa. Elles ont presque la même forme, mais pas les mêmes points !" },
  { id: 'c4', nom: 'Les lettres du jardin', icone: '🌿', lettres: ['dal', 'dhal', 'ra', 'zay'], intro: "Dans le jardin, quatre lettres qui ne s'attachent pas à la suivante : le daal, le dhaal, le raa et le zaay." },
  { id: 'c5', nom: 'Les lettres du marché', icone: '🧺', lettres: ['sin', 'shin', 'sad', 'dad'], intro: "Au marché, on rencontre le siin, le chiin, le saad et le daad. Deux sons doux, deux sons plus graves !" },
  { id: 'c6', nom: 'Les lettres de la bibliothèque', icone: '📚', lettres: ['ta2', 'za2', 'ayn', 'ghayn'], intro: "À la bibliothèque, on découvre des sons de gorge : le taa grave, le zhaa grave, l'aïn et le ghaïn. Écoute bien !" },
  { id: 'c7', nom: 'Les lettres de l\'oasis', icone: '🌴', lettres: ['fa', 'qaf', 'kaf', 'lam'], intro: "À l'oasis, quatre lettres : le faa, le qaaf, le kaaf et le laam. Presque toutes les lettres sont à toi maintenant !" },
  { id: 'c8', nom: 'Les dernières étoiles', icone: '⭐', lettres: ['mim', 'ha2', 'waw'], intro: "Dernier chapitre ! Le miim, le haa léger et le waaw. Après eux, tu connaîtras les vingt-huit lettres arabes !" }
];
// Les 6 espaces de l'école (les activités se répartissent dans ces espaces)
export const ESPACES = {
  jardin: { nom: 'Le Jardin des lettres', icone: '🌷', texte: 'Découvre les lettres qui fleurissent et retrouve-les cachées.', activites: ['decouvrir', 'chasse'] },
  atelier: { nom: "L'Atelier des formes", icone: '🛠️', texte: 'Fais changer de forme les lettres, trace-les et reconstitue-les.', activites: ['formes', 'trace', 'puzzle'] },
  galerie: { nom: 'La Galerie des sons', icone: '🎧', texte: 'Écoute les sons et retrouve les lettres.', activites: ['son', 'parcours-sons'] },
  palais: { nom: 'Le Palais des lettres', icone: '🏛️', texte: 'Ta collection de lettres, qui brille de plus en plus.', activites: ['collection'] },
  parcours: { nom: 'Le Parcours des découvertes', icone: '🗺️', texte: 'Un chemin en huit chapitres, à ton rythme.', activites: ['chapitre'] },
  defis: { nom: 'La Salle des défis', icone: '🏆', texte: 'Lettres jumelles, intruse et défi de Nour.', activites: ['jumelles', 'intrus', 'defi'] }
};
export const ACTIVITES = {
  decouvrir: { nom: 'Découvrir une lettre', icone: '🌸' }, chasse: { nom: 'La chasse aux lettres', icone: '🔎' }, formes: { nom: 'Les formes de la lettre', icone: '🔄' }, trace: { nom: 'Le tracé magique', icone: '✨' },
  puzzle: { nom: 'Le puzzle des lettres', icone: '🧩' }, son: { nom: 'Le son mystérieux', icone: '🔔' }, 'parcours-sons': { nom: 'Le parcours des sons', icone: '🎶' }, jumelles: { nom: 'Les lettres jumelles', icone: '👯' },
  intrus: { nom: 'La lettre intruse', icone: '🕵️' }, defi: { nom: 'Le défi de Nour', icone: '🌟' }, collection: { nom: 'La collection', icone: '💎' }, chapitre: { nom: 'Le parcours', icone: '🗺️' }
};
// Les trois groupes d'âge (l'âge ne ferme aucune porte : voir competences.js)
export const GROUPES = { 'g34': { nom: '3 – 4 ans', ages: [3, 4] }, 'g56': { nom: '5 – 6 ans', ages: [5, 6] }, 'g710': { nom: '7 – 10 ans', ages: [7, 8, 9, 10] } };
export const groupeDepuisAge = age => { const n = Number(age); return n <= 4 ? 'g34' : n <= 6 ? 'g56' : 'g710'; };
