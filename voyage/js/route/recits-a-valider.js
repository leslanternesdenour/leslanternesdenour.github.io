// LES RÉCITS DES PROPHÈTES — آثار الأنبياء : fiches pédagogiques. TOUT EST « À VALIDER » par une personne compétente en sciences islamiques.
// Ces textes sont des BROUILLONS de travail : ils ne sont pas du contenu terminé et ne doivent pas être publiés avant vérification humaine.
//
// Règles (testées dans outils/tests/route-recits.test.mjs) :
//  - AUCUNE représentation d'un prophète (ni visage, ni corps, ni silhouette, ni ombre, ni voix) : les illustrations ne montrent que des paysages, des objets, des constructions ;
//  - AUCUN dialogue inventé, aucune parole attribuée : pas de guillemets, pas de citation de verset ou de hadith reproduite ici (seulement des références à vérifier) ;
//  - chaque phrase (« énoncé ») porte son ORIGINE (Coran / hadith / tradition historique / discuté / illustration du jeu) et nomme cette origine dans le texte ;
//  - aucune date présentée comme certaine ; aucun mot arabe ni verset en arabe tant qu'ils ne sont pas validés ;
//  - sources : toutes `verifie: false` tant qu'une personne compétente n'a pas confirmé la référence exacte (numéros, formulations).
export const STATUT = 'À VALIDER';

export const ORIGINES = {
  coran: { icone: '📖', nom: 'Dans le Coran', certitude: 'Texte coranique (référence à faire vérifier)' },
  hadith: { icone: '📜', nom: 'Récit rapporté dans un hadith', certitude: 'Récit rapporté (authenticité et formulation à faire vérifier)' },
  tradition: { icone: '🏛️', nom: 'Tradition historique', certitude: 'Tradition historique (à faire vérifier)' },
  discute: { icone: '❓', nom: 'Discuté ou incertain', certitude: 'Incertain : ne pas présenter comme un fait' },
  illustration: { icone: '🎨', nom: 'Illustration du jeu', certitude: 'Image du jeu : pas un fait historique' }
};

// Référence coranique : sourate et verset. Toute autre source : la référence reste VIDE tant qu'elle n'est pas vérifiée, avec la mention « Référence à vérifier ».
const src = (id, type, ref) => type === 'coran' ? { id, type, ref, verifie: false } : { id, type, ref: '', indication: ref + ' — Référence à vérifier', verifie: false };
const e = (id, origine, refs, petit, grand) => ({ id, origine, refs, petit, grand });

export const RECITS = [
  // ===== 1. Hajar, Ismaïl et Zamzam =====
  { id: 'hajar-ismail-zamzam', lieuNom: 'Le puits de Zamzam', titre: 'Hajar, Ismaïl et l\'eau de Zamzam', lieu: 'zamzam', periode: 'Au temps d\'Ibrahim (aucune date n\'est donnée par les sources)', statut: STATUT,
    sources: [src('coran:14:37', 'coran', 'Sourate Ibrahim (14), verset 37'), src('coran:2:158', 'coran', 'Sourate Al-Baqara (2), verset 158'),
      src('hadith:bukhari:ibn-abbas', 'hadith', 'Sahih al-Bukhari : long récit rapporté par Ibn Abbas sur Ibrahim, Hajar et Ismaïl (numéro et formulation exacts à vérifier)')],
    enonces: [
      e('a1', 'coran', ['coran:14:37'], 'Dans le Coran, Ibrahim parle d\'une vallée sans champs, près de la Maison sacrée.', 'Dans le Coran (sourate Ibrahim, verset 37), Ibrahim évoque une vallée sans culture, près de la Maison sacrée, où il a installé une partie de sa descendance.'),
      e('a2', 'hadith', ['hadith:bukhari:ibn-abbas'], 'Un hadith raconte qu\'Ibrahim a installé Hajar et son petit garçon Ismaïl dans cette vallée sèche.', 'Un hadith (le long récit rapporté par Ibn Abbas) raconte qu\'Ibrahim a installé Hajar et son jeune fils Ismaïl dans cette vallée sèche, avec quelques provisions et un peu d\'eau.'),
      e('a3', 'hadith', ['hadith:bukhari:ibn-abbas'], 'Selon ce hadith, quand l\'eau a manqué, Hajar a cherché de l\'eau pour son enfant, entre Safa et Marwa.', 'Selon ce hadith, quand l\'eau et les provisions ont manqué, Hajar est allée plusieurs fois de la colline de Safa à la colline de Marwa pour chercher de l\'eau pour son enfant.'),
      e('a4', 'hadith', ['hadith:bukhari:ibn-abbas'], 'Selon ce hadith, l\'eau de Zamzam est alors apparue, par la volonté d\'Allah.', 'Selon ce hadith, l\'eau de Zamzam est alors apparue, par la volonté d\'Allah, et Hajar et son enfant ont pu boire.'),
      e('a5', 'coran', ['coran:2:158'], 'Dans le Coran, Safa et Marwa sont parmi les signes d\'Allah.', 'Dans le Coran (sourate Al-Baqara, verset 158), Safa et Marwa sont cités parmi les signes d\'Allah.'),
      e('a6', 'illustration', [], 'Dans le jeu, l\'eau est une fontaine de lumière : c\'est une image du jeu.', 'Dans le jeu, l\'eau de Zamzam est dessinée comme une fontaine de lumière. C\'est une illustration du jeu, pas une reconstitution : Hajar et Ismaïl ne sont jamais représentés.')
    ],
    illustration: { scene: 'vallee-eau', figure: false, description: 'Une vallée sèche entre deux collines, avec une fontaine de lumière qui jaillit du sol : image symbolique de l\'eau de Zamzam' }, animation: 'eau-jaillit', activite: null, mots: [],
    questions: [
      { id: 'q1', enonce: 'a4', ages: ['3-5', '6-10'], petit: 'Qu\'est-ce qui est apparu dans la vallée sèche ?', grand: 'Selon le hadith, qu\'est-ce qui est apparu dans la vallée sèche ?', choix: ['L\'eau de Zamzam', 'Une grande forêt', 'Un lac de sable'], bonne: 0 },
      { id: 'q2', enonce: 'a3', ages: ['6-10'], petit: '', grand: 'Entre quelles deux collines Hajar a-t-elle cherché de l\'eau ?', choix: ['Safa et Marwa', 'Hira et Thawr', 'Arafat et Mina'], bonne: 0 }
    ] },

  // ===== 2. Safa et Marwa =====
  { id: 'safa-marwa', lieuNom: 'Safa et Marwa', titre: 'Safa et Marwa', lieu: 'safa-marwa', periode: 'Depuis le temps de Hajar jusqu\'à aujourd\'hui (selon la tradition)', statut: STATUT,
    sources: [src('coran:2:158', 'coran', 'Sourate Al-Baqara (2), verset 158'), src('hadith:bukhari:ibn-abbas', 'hadith', 'Sahih al-Bukhari : récit rapporté par Ibn Abbas (numéro à vérifier)'),
      src('histoire:rites-hajj-omra', 'tradition', 'Présentation des rites du Hajj et de la Omra (ouvrage de référence à choisir et à faire valider)')],
    enonces: [
      e('b1', 'coran', ['coran:2:158'], 'Dans le Coran, Safa et Marwa sont parmi les signes d\'Allah.', 'Dans le Coran (sourate Al-Baqara, verset 158), Safa et Marwa sont cités parmi les signes d\'Allah.'),
      e('b2', 'hadith', ['hadith:bukhari:ibn-abbas'], 'Selon un hadith, Hajar est allée entre ces deux petites collines pour chercher de l\'eau.', 'Selon un hadith, Hajar est allée plusieurs fois entre ces deux petites collines pour chercher de l\'eau pour son enfant.'),
      e('b3', 'tradition', ['histoire:rites-hajj-omra'], 'Selon la tradition, pendant le Hajj et la Omra, on marche calmement entre les deux collines.', 'Selon la tradition islamique, pendant le Hajj et la Omra, les musulmans marchent entre Safa et Marwa en pensant à cette histoire. C\'est un acte de culte : dans le jeu, il n\'y a ni course ni chronomètre.'),
      e('b4', 'illustration', [], 'Dans le jeu, le chemin entre les deux collines se fait tranquillement : c\'est une image pour comprendre.', 'Dans le jeu, le chemin entre les deux collines se parcourt tranquillement : c\'est une image pour comprendre, pas un rite à jouer.')
    ],
    illustration: { scene: 'deux-collines', figure: false, description: 'Deux petites collines reliées par un chemin tranquille : Safa et Marwa' }, animation: 'chemin-collines', activite: null, mots: [],
    questions: [{ id: 'q1', enonce: 'b4', ages: ['3-5', '6-10'], petit: 'Dans le jeu, comment on va d\'une colline à l\'autre ?', grand: 'Dans le jeu, peut-on faire la course entre Safa et Marwa ?', choix: ['On marche tranquillement', 'On fait la course avec un chronomètre'], bonne: 0 }] },

  // ===== 3. Comment La Mecque s'est développée =====
  { id: 'communaute-mecque', lieuNom: 'La vallée de La Mecque', titre: 'Comment une communauté est née à La Mecque', lieu: 'mecque-vallee', periode: 'Sur plusieurs générations (aucune date certaine)', statut: STATUT,
    sources: [src('hadith:bukhari:ibn-abbas', 'hadith', 'Sahih al-Bukhari : récit rapporté par Ibn Abbas (numéro à vérifier)'), src('sira:histoire-mecque', 'tradition', 'Ouvrage d\'histoire de La Mecque ancienne (référence à choisir et à faire valider)')],
    enonces: [
      e('c1', 'hadith', ['hadith:bukhari:ibn-abbas'], 'Selon un hadith, des gens de la tribu de Jurhum ont vu l\'eau et se sont installés près de Hajar et Ismaïl.', 'Selon le hadith, après l\'apparition de Zamzam, des gens de la tribu de Jurhum sont passés par la vallée, ont vu l\'eau et se sont installés près de Hajar et d\'Ismaïl.'),
      e('c2', 'tradition', ['sira:histoire-mecque'], 'Selon la tradition historique, une communauté s\'est formée près du puits, puis les maisons se sont multipliées.', 'Selon la tradition historique, une communauté s\'est formée peu à peu près du puits, puis les habitations se sont multipliées petit à petit.'),
      e('c3', 'tradition', ['sira:histoire-mecque'], 'Selon la tradition, une ville est née plus tard autour de ce lieu. La Mecque n\'a pas été construite d\'un seul coup.', 'Selon la tradition historique, une ville s\'est établie plus tard autour de ce lieu important. La Mecque n\'a donc pas été construite en une seule fois par une seule personne.'),
      e('c4', 'discute', ['sira:histoire-mecque'], 'On ne connaît pas avec certitude les dates : cela reste incertain.', 'Les dates et le déroulement exact de cette croissance sont discutés et ne sont pas connus avec certitude : c\'est pourquoi aucune date n\'est donnée ici.'),
      e('c5', 'illustration', [], 'Les images du jeu sont un dessin pour comprendre : ce n\'est pas exactement comme avant.', 'Les images du jeu (vallée, point d\'eau, campement, maisons, cité) sont une illustration pédagogique de la tradition, pas une reconstitution archéologique exacte.')
    ],
    illustration: { scene: 'evolution', figure: false, description: 'Six étapes dessinées de gauche à droite : une vallée, un point d\'eau, un campement, des maisons, une communauté, une cité ancienne' }, animation: 'evolution', mots: [],
    activite: { type: 'ordre', consigne_petit: 'Mets les images dans l\'ordre, de la plus ancienne à la plus récente.', consigne_grand: 'Remets les étapes dans l\'ordre, de la vallée à la cité ancienne.', etapes: ['Une vallée', 'Un point d\'eau', 'Un premier campement', 'Des habitations', 'Une communauté', 'Une cité ancienne'] },
    questions: [{ id: 'q1', enonce: 'c3', ages: ['3-5', '6-10'], petit: 'La Mecque a-t-elle été construite d\'un seul coup ?', grand: 'Qui a construit La Mecque ?', choix: ['Une communauté, petit à petit', 'Une seule personne, en une fois'], bonne: 0 }] },

  // ===== 4. Ibrahim et Ismaïl : les fondations de la Kaaba =====
  { id: 'fondations-kaaba', lieuNom: 'La Kaaba', titre: 'Les fondations de la Maison sacrée', lieu: 'kaaba', periode: 'Au temps d\'Ibrahim (aucune date n\'est donnée par les sources)', statut: STATUT,
    sources: [src('coran:2:127', 'coran', 'Sourate Al-Baqara (2), verset 127'), src('histoire:kaaba', 'tradition', 'Présentation de la Kaaba et de son histoire (ouvrage de référence à choisir et à faire valider)')],
    enonces: [
      e('d1', 'coran', ['coran:2:127'], 'Dans le Coran, Ibrahim et Ismaïl élèvent les fondations de la Maison.', 'Dans le Coran (sourate Al-Baqara, verset 127), il est dit qu\'Ibrahim et Ismaïl élevaient les fondations de la Maison sacrée.'),
      e('d2', 'tradition', ['histoire:kaaba'], 'Selon la tradition, cette Maison est la Kaaba, à La Mecque.', 'Selon la tradition islamique, cette Maison est la Kaaba, à La Mecque : c\'est vers elle que les musulmans se tournent pour prier.'),
      e('d3', 'discute', ['histoire:kaaba'], 'On ne sait pas comment s\'est passé le chantier : les sources ne le détaillent pas.', 'Le chantier (les pierres, les gestes, les étapes) n\'est pas détaillé dans le Coran : son déroulement exact n\'est pas connu, et rien ne doit être inventé.'),
      e('d4', 'illustration', [], 'Dans le jeu, la construction est un dessin pour comprendre : ce n\'est pas le vrai chantier.', 'La construction du jeu (terrain, fondations, pierres, murs, structure) est symbolique : ce n\'est pas le chantier historique, et personne n\'y est représenté.')
    ],
    illustration: { scene: 'fondations', figure: false, description: 'Une construction qui monte étape par étape : terrain, fondations, pierres, murs, structure terminée' }, animation: 'fondations', mots: [],
    activite: { type: 'ordre', consigne_petit: 'Construis la Maison avec des pierres, dans le bon ordre.', consigne_grand: 'Pour comprendre une construction ancienne, remets les étapes dans l\'ordre.', etapes: ['Le terrain', 'Les fondations', 'Les pierres', 'Les murs', 'La structure terminée'] },
    questions: [{ id: 'q1', enonce: 'd4', ages: ['3-5', '6-10'], petit: 'La construction du jeu, c\'est...', grand: 'La construction du jeu est...', choix: ['Un dessin symbolique', 'Une photo du vrai chantier'], bonne: 0 }] },


  // ===== 5. La reconstruction de la Kaaba par Quraysh =====
  { id: 'quraysh-reconstruction', lieuNom: 'La Kaaba', titre: 'La reconstruction de la Kaaba par Quraysh', lieu: 'kaaba', periode: 'Avant la mission prophétique de Muhammad ﷺ (aucune date précisée ici)', statut: STATUT,
    sources: [src('sira:ibn-ishaq', 'tradition', 'La Sira (biographie du Prophète ﷺ) transmise par Ibn Ishaq et Ibn Hisham, récit de la reconstruction de la Kaaba')],
    enonces: [
      e('q1', 'tradition', ['sira:ibn-ishaq'], 'Selon la tradition historique, la Kaaba avait été abîmée et Quraysh a décidé de la reconstruire.', 'Selon la tradition historique (les récits de la Sira), la Kaaba avait été abîmée avec le temps et Quraysh, la tribu qui s\'occupait de La Mecque, a décidé de la reconstruire.'),
      e('q2', 'tradition', ['sira:ibn-ishaq'], 'Selon la tradition, chaque groupe a apporté des pierres pour la construction.', 'Selon la tradition historique, les différentes familles de Quraysh se sont partagé le travail et ont rassemblé les pierres nécessaires.'),
      e('q3', 'tradition', ['sira:ibn-ishaq'], 'Selon la tradition, les chefs n\'étaient pas d\'accord pour savoir qui poserait la Pierre noire.', 'Selon les récits traditionnels, un désaccord est apparu entre les chefs des familles : chacun voulait avoir l\'honneur de poser la Pierre noire.'),
      e('q4', 'tradition', ['sira:ibn-ishaq'], 'Selon la tradition, la solution a été de poser la pierre sur un tissu porté ensemble.', 'Selon la tradition historique, la solution rapportée est de poser la Pierre noire sur un tissu, que les chefs des familles ont soulevé ensemble avant qu\'elle soit mise en place.'),
      e('q5', 'illustration', [], 'Dans le jeu, on voit seulement des pierres, un tissu et des murs : c\'est un dessin pour comprendre.', 'Dans le jeu, on ne voit que des pierres, un tissu et des murs : personne n\'est représenté, et aucune parole n\'est inventée. C\'est une illustration du jeu.')
    ],
    illustration: { scene: 'quraysh', figure: false, description: 'Une pierre posée sur un grand tissu clair, avec des murs de pierre derrière : image symbolique de la reconstruction' }, animation: 'tissu-pierre', mots: [],
    activite: { type: 'ordre', consigne_petit: 'Remets les étapes dans l\'ordre.', consigne_grand: 'Pour découvrir une construction ancienne, remets les étapes dans l\'ordre.', etapes: ['Les murs sont abîmés', 'On décide de reconstruire', 'On rassemble les pierres', 'On cherche un accord pour la Pierre noire', 'La Maison est reconstruite'] },
    questions: [{ id: 'q1', enonce: 'q4', ages: ['3-5', '6-10'], petit: 'Sur quoi a-t-on posé la pierre pour la porter ensemble ?', grand: 'Selon la tradition, comment a-t-on résolu le désaccord sur la Pierre noire ?', choix: ['Sur un tissu porté ensemble', 'Sur une charrette'], bonne: 0 }] },

  // ===== 6. L'eau dans le désert (découverte générale, à l'oasis) =====
  { id: 'eau-desert', lieuNom: 'L\'oasis de la Source Claire', titre: 'L\'eau, un trésor du désert', lieu: 'oasis', periode: 'Depuis très longtemps (aucune date)', statut: STATUT,
    sources: [src('histoire:vie-desert', 'tradition', 'Ouvrage sur la vie et les déplacements dans l\'Arabie ancienne (référence à choisir et à faire valider)')],
    enonces: [
      e('w1', 'tradition', ['histoire:vie-desert'], 'Selon les récits historiques, dans le désert on cherche toujours l\'eau : puits, sources, oasis.', 'Selon les récits historiques sur l\'Arabie ancienne, l\'eau était la première richesse du désert : les gens se déplaçaient de puits en puits et d\'oasis en oasis.'),
      e('w2', 'tradition', ['histoire:vie-desert'], 'Selon la tradition, on partageait l\'eau avec les voyageurs.', 'Selon la tradition de l\'hospitalité dans l\'Arabie ancienne, on offrait de l\'eau et un abri aux voyageurs qui passaient.'),
      e('w3', 'illustration', [], 'Dans le jeu, l\'oasis et son lac sont un décor imaginaire.', 'Dans le jeu, l\'oasis de la Source Claire est un lieu imaginaire, dessiné pour comprendre l\'importance de l\'eau.')
    ],
    illustration: { scene: 'oasis', figure: false, description: 'Une oasis : un petit lac entouré de palmiers au milieu du désert' }, animation: 'eau-jaillit', activite: null, mots: [],
    questions: [{ id: 'q1', enonce: 'w1', ages: ['3-5', '6-10'], petit: 'Dans le désert, qu\'est-ce qui est très précieux ?', grand: 'Selon les récits, quelle était la première richesse du désert ?', choix: ['L\'eau', 'Les nuages'], bonne: 0 }] },

  // ===== 7. Les caravanes et l'hospitalité (découverte générale, au campement) =====
  { id: 'caravanes-hospitalite', lieuNom: 'Le campement des Trois Tentes', titre: 'Les caravanes et l\'hospitalité', lieu: 'campement', periode: 'Depuis très longtemps (aucune date)', statut: STATUT,
    sources: [src('histoire:vie-desert', 'tradition', 'Ouvrage sur la vie et les déplacements dans l\'Arabie ancienne (référence à choisir et à faire valider)')],
    enonces: [
      e('k1', 'tradition', ['histoire:vie-desert'], 'Selon l\'histoire, les caravanes voyageaient avec des dromadaires et s\'arrêtaient aux puits.', 'Selon les récits historiques, les caravanes traversaient le désert avec des dromadaires, en s\'arrêtant près des puits et des oasis pour se reposer.'),
      e('k2', 'tradition', ['histoire:vie-desert'], 'Selon la tradition, on accueillait les voyageurs avec générosité.', 'Selon la tradition de l\'hospitalité, on accueillait les voyageurs avec générosité : un abri, de l\'eau, un repas. L\'entraide était une valeur importante.'),
      e('k3', 'illustration', [], 'Dans le jeu, le campement des Trois Tentes est un lieu imaginaire.', 'Dans le jeu, le campement des Trois Tentes est un lieu imaginaire : il sert à illustrer la vie des caravanes, pas un endroit réel.')
    ],
    illustration: { scene: 'campement', figure: false, description: 'Un campement de tentes au bord d\'une piste de caravane' }, animation: 'aucune', activite: null, mots: [],
    questions: [{ id: 'q1', enonce: 'k2', ages: ['3-5', '6-10'], petit: 'Que faisait-on pour les voyageurs fatigués ?', grand: 'Selon la tradition, comment accueillait-on les voyageurs ?', choix: ['On les accueillait avec générosité', 'On les renvoyait'], bonne: 0 }] }
];

export const recit = id => RECITS.find(r => r.id === id) || null;
// L'ordre de réalisation demandé : d'abord les quatre premières découvertes ; les suivantes (Quraysh, redécouverte de Zamzam, Jabal an-Nour, Jabal Thawr) viendront ensuite
export const ORDRE_PREVU = ['hajar-ismail-zamzam', 'safa-marwa', 'communaute-mecque', 'fondations-kaaba', 'quraysh-reconstruction', 'redecouverte-zamzam', 'jabal-an-nour', 'jabal-thawr'];
