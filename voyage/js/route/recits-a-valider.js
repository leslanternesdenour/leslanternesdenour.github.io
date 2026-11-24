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
    questions: [{ id: 'q1', enonce: 'k2', ages: ['3-5', '6-10'], petit: 'Que faisait-on pour les voyageurs fatigués ?', grand: 'Selon la tradition, comment accueillait-on les voyageurs ?', choix: ['On les accueillait avec générosité', 'On les renvoyait'], bonne: 0 }] },

  // ===== 8. La redécouverte de Zamzam (Abd al-Muttalib) =====
  { id: 'redecouverte-zamzam', lieuNom: 'Le puits de Zamzam', titre: 'La redécouverte du puits de Zamzam', lieu: 'zamzam', periode: 'Bien après Hajar et Ismaïl, avant la mission prophétique de Muhammad ﷺ (aucune date précisée ici)', statut: STATUT,
    sources: [src('sira:ibn-ishaq', 'tradition', 'La Sira transmise par Ibn Ishaq et Ibn Hisham, récit d\'Abd al-Muttalib et du puits de Zamzam')],
    enonces: [
      e('z1', 'tradition', ['sira:ibn-ishaq'], 'Selon la tradition historique, le puits de Zamzam avait été comblé et oublié avec le temps.', 'Selon les récits de la tradition historique (la Sira), avec le temps le puits de Zamzam avait été comblé et son emplacement était oublié.'),
      e('z2', 'tradition', ['sira:ibn-ishaq'], 'Selon la tradition, Abd al-Muttalib a reçu en rêve l\'indication de creuser à nouveau.', 'Selon la tradition historique, Abd al-Muttalib, un chef de Quraysh, a vu en rêve qu\'il devait creuser à nouveau pour retrouver le puits de Zamzam.'),
      e('z3', 'tradition', ['sira:ibn-ishaq'], 'Selon la tradition, il a creusé jusqu\'à retrouver le puits.', 'Selon la tradition historique, il a creusé avec des outils jusqu\'à retrouver le puits de Zamzam.'),
      e('z4', 'discute', ['sira:ibn-ishaq'], 'On ne sait pas tous les détails : les récits ne sont pas tous d\'accord.', 'Les détails (l\'endroit exact, ce qui a été trouvé, le déroulement précis) sont discutés selon les récits et ne sont pas connus avec certitude.'),
      e('z5', 'illustration', [], 'Dans le jeu, on voit un puits, des outils et des paniers : c\'est un dessin du jeu.', 'Dans le jeu, on ne voit qu\'un puits, des outils et des paniers dessinés par le jeu : personne n\'est représenté, et les outils sont un choix artistique, pas un fait rapporté.')
    ],
    illustration: { scene: 'puits-outils', figure: false, description: 'Un puits de pierre entouré d\'outils anciens et de paniers, sans personne : image symbolique de la redécouverte du puits' }, animation: 'aucune', mots: [],
    activite: { type: 'ordre', consigne_petit: 'Remets les images dans l\'ordre de l\'histoire.', consigne_grand: 'Remets les étapes dans l\'ordre du récit traditionnel.', etapes: ['Le puits est comblé et oublié', 'Un rêve indique où creuser', 'On creuse avec des outils', 'Le puits est retrouvé', 'L\'eau de Zamzam coule de nouveau'] },
    questions: [{ id: 'q1', enonce: 'z2', ages: ['3-5', '6-10'], petit: 'Que fait Abd al-Muttalib pour retrouver le puits ?', grand: 'Selon la tradition, que doit faire Abd al-Muttalib pour retrouver le puits de Zamzam ?', choix: ['Il creuse à nouveau', 'Il construit une tour'], bonne: 0 }] },

  // ===== 9. Jabal an-Nour et la grotte de Hira =====
  { id: 'jabal-an-nour', lieuNom: 'Jabal an-Nour et la grotte de Hira', titre: 'Jabal an-Nour et la grotte de Hira', lieu: 'jabal-nour', periode: 'Avant et au début de la mission prophétique de Muhammad ﷺ (aucune date précisée ici)', statut: STATUT,
    sources: [src('hadith:bukhari:aicha', 'hadith', 'Sahih al-Bukhari : récit rapporté par Aïcha sur le début de la révélation'), src('coran:96:1-5', 'coran', 'Sourate Al-Alaq (96), versets 1 à 5 (début de la sourate)'), src('histoire:hira', 'tradition', 'Présentation de Jabal an-Nour et de la grotte de Hira (ouvrage de référence à choisir et à faire valider)')],
    enonces: [
      e('n1', 'hadith', ['hadith:bukhari:aicha'], 'Un hadith raconte que le Prophète ﷺ se retirait parfois dans la grotte de Hira pour réfléchir.', 'Un hadith (rapporté par Aïcha) raconte qu\'avant la révélation, le Prophète ﷺ aimait se retirer dans la grotte de Hira, sur Jabal an-Nour, pour réfléchir et adorer Allah.'),
      e('n2', 'hadith', ['hadith:bukhari:aicha'], 'Selon ce hadith, c\'est là que la révélation du Coran a commencé.', 'Selon ce hadith, c\'est dans cette grotte que la révélation du Coran a commencé pour le Prophète ﷺ. Le jeu ne montre aucune scène de ce moment.'),
      e('n3', 'tradition', ['histoire:hira', 'coran:96:1-5'], 'Selon la tradition, les premiers versets révélés sont ceux de la sourate Al-Alaq.', 'Selon la tradition islamique, les premiers versets révélés sont le début de la sourate Al-Alaq (sourate 96).'),
      e('n4', 'discute', ['histoire:hira'], 'Le Coran ne dit pas où : ce lieu vient des récits, on ne sait pas tout.', 'Le Coran ne nomme pas la grotte : ce lien avec Hira vient des récits de hadith et de la tradition. Les détails ne sont pas connus avec certitude.'),
      e('n5', 'illustration', [], 'Dans le jeu, on voit la montagne et l\'entrée de la grotte de loin : c\'est un dessin du jeu.', 'Dans le jeu, on observe seulement la montagne et l\'extérieur de la grotte. Aucune scène n\'est montrée, personne n\'est représenté et rien n\'est inventé : c\'est une illustration du jeu.')
    ],
    illustration: { scene: 'montagne-grotte', figure: false, description: 'Une grande montagne sous un ciel étoilé, avec l\'entrée sombre d\'une grotte vue de loin, sans personne : image symbolique' }, animation: 'aucune', activite: null, mots: [],
    questions: [{ id: 'q1', enonce: 'n5', ages: ['3-5', '6-10'], petit: 'Que voit-on dans le jeu ?', grand: 'Dans le jeu, que voit-on de la grotte ?', choix: ['La montagne et l\'extérieur de la grotte', 'Une scène avec des personnages'], bonne: 0 },
      { id: 'q2', enonce: 'n1', ages: ['6-10'], petit: '', grand: 'Sur quelle montagne se trouve la grotte de Hira, selon la tradition ?', choix: ['Jabal an-Nour', 'Jabal Thawr'], bonne: 0 }] },

  // ===== 10. Jabal Thawr et la Hijra =====
  { id: 'jabal-thawr', lieuNom: 'Jabal Thawr et la Hijra', titre: 'Jabal Thawr et la Hijra', lieu: 'jabal-thawr', periode: 'Au moment de la Hijra, le départ de La Mecque vers Médine (aucune date précisée ici)', statut: STATUT,
    sources: [src('coran:9:40', 'coran', 'Sourate At-Tawba (9), verset 40'), src('sira:ibn-ishaq', 'tradition', 'La Sira transmise par Ibn Ishaq et Ibn Hisham, récit de la Hijra')],
    enonces: [
      e('h1', 'coran', ['coran:9:40'], 'Dans le Coran, il est question de deux personnes qui se trouvent dans une grotte.', 'Dans le Coran (sourate At-Tawba, verset 40), il est question de deux personnes qui se trouvent dans une grotte.'),
      e('h2', 'tradition', ['sira:ibn-ishaq'], 'Selon la tradition, cela se rapporte à la Hijra, le départ vers Médine.', 'Selon la tradition islamique, ce passage se rapporte à la Hijra, le départ du Prophète ﷺ de La Mecque vers Médine, avec son compagnon Abu Bakr.'),
      e('h3', 'tradition', ['sira:ibn-ishaq'], 'Selon la tradition, ils se sont abrités dans une grotte du Jabal Thawr.', 'Selon la tradition historique (la Sira), ils se sont abrités quelque temps dans une grotte du Jabal Thawr avant de continuer leur route vers Médine.'),
      e('h4', 'discute', ['sira:ibn-ishaq'], 'On ne sait pas tous les détails du voyage : ils sont discutés.', 'Les détails du voyage (le trajet exact, la durée précise) sont discutés selon les récits et ne sont pas connus avec certitude.'),
      e('h5', 'illustration', [], 'Dans le jeu, on voit la montagne et la grotte de loin : c\'est un dessin du jeu.', 'Dans le jeu, on observe seulement la montagne et l\'extérieur de la grotte. Aucune scène n\'est montrée, personne n\'est représenté et aucune parole n\'est inventée : c\'est une illustration du jeu.')
    ],
    illustration: { scene: 'montagne-grotte', figure: false, description: 'Une grande montagne avec l\'entrée sombre d\'une grotte vue de loin, sans personne : image symbolique' }, animation: 'aucune', activite: null, mots: [],
    questions: [{ id: 'q1', enonce: 'h2', ages: ['3-5', '6-10'], petit: 'La Hijra, c\'est un départ vers...', grand: 'Que désigne la Hijra, selon la tradition ?', choix: ['Le départ de La Mecque vers Médine', 'Une fête au marché'], bonne: 0 },
      { id: 'q2', enonce: 'h5', ages: ['6-10'], petit: '', grand: 'Dans le jeu, que voit-on de la grotte ?', choix: ['Seulement l\'extérieur', 'L\'intérieur'], bonne: 0 }] },

  // ===== 11. Le métier de potier (découverte à l'atelier de la cité) =====
  { id: 'metier-potier', lieuNom: 'L\'atelier du potier', titre: 'Le métier de potier', lieu: 'atelier', periode: 'Depuis très longtemps (aucune date)', statut: STATUT,
    sources: [src('histoire:vie-desert', 'tradition', 'Ouvrage sur la vie et les métiers dans l\'Arabie ancienne (référence à choisir et à faire valider)')],
    enonces: [
      e('p1', 'tradition', ['histoire:vie-desert'], 'Selon les récits historiques, les potiers faisaient des jarres avec de l\'argile.', 'Selon les récits historiques sur les métiers de l\'Arabie ancienne, les potiers façonnaient des jarres et des bols avec de l\'argile, puis les faisaient cuire.'),
      e('p2', 'tradition', ['histoire:vie-desert'], 'Selon l\'histoire, ces jarres servaient à garder l\'eau et les dattes.', 'Selon l\'histoire, ces récipients servaient à garder l\'eau fraîche, les dattes, le grain et l\'huile.'),
      e('p3', 'illustration', [], 'Dans le jeu, l\'atelier est un dessin imaginaire pour comprendre le métier.', 'Dans le jeu, l\'atelier du potier est un lieu imaginaire : il illustre le métier, sans prétendre montrer un atelier réel.')
    ],
    illustration: { scene: 'atelier', figure: false, description: 'Un four de terre et des jarres en terre cuite alignées, sans personne : image du métier de potier' }, animation: 'aucune', mots: [],
    activite: { type: 'ordre', consigne_petit: 'Fabrique une jarre : mets les gestes dans l\'ordre.', consigne_grand: 'Remets les étapes de la fabrication d\'une jarre dans l\'ordre.', etapes: ['Prendre l\'argile', 'Façonner la jarre', 'La laisser sécher', 'La faire cuire', 'La remplir d\'eau'] },
    questions: [{ id: 'q1', enonce: 'p2', ages: ['3-5', '6-10'], petit: 'Que garde une jarre en terre cuite ?', grand: 'Selon l\'histoire, à quoi servaient ces jarres ?', choix: ['L\'eau fraîche et les dattes', 'Le feu'], bonne: 0 }] },

  // ===== 12. Le marché et les échanges (découverte au marché de la cité) =====
  { id: 'marche-echanges', lieuNom: 'Le marché', titre: 'Le marché et les échanges', lieu: 'marche', periode: 'Depuis très longtemps (aucune date)', statut: STATUT,
    sources: [src('histoire:vie-desert', 'tradition', 'Ouvrage sur la vie et le commerce dans l\'Arabie ancienne (référence à choisir et à faire valider)')],
    enonces: [
      e('m1', 'tradition', ['histoire:vie-desert'], 'Selon les récits historiques, on échangeait au marché des dattes, des tissus et des jarres.', 'Selon les récits historiques sur l\'Arabie ancienne, les marchés étaient des lieux d\'échange : on y trouvait des dattes, des tissus, des jarres, du grain et des produits venus de loin avec les caravanes.'),
      e('m2', 'tradition', ['histoire:vie-desert'], 'Selon la tradition, le marché était aussi un lieu de rencontre.', 'Selon la tradition de l\'hospitalité, le marché était aussi un lieu de rencontre : les voyageurs s\'y reposaient, se renseignaient et partageaient les nouvelles.'),
      e('m3', 'illustration', [], 'Dans le jeu, le marché est un dessin imaginaire pour comprendre.', 'Dans le jeu, le marché est un lieu imaginaire : il illustre la vie d\'une cité ancienne, sans prétendre être une reconstitution exacte.')
    ],
    illustration: { scene: 'marche', figure: false, description: 'Des étals sous des auvents de tissu, avec des jarres, des paniers et des dattes, sans personne : image d\'un marché' }, animation: 'aucune', mots: [],
    activite: { type: 'ordre', consigne_petit: 'Mets les moments du marché dans l\'ordre.', consigne_grand: 'Remets dans l\'ordre une journée de marché.', etapes: ['Les caravanes arrivent', 'On installe les étals', 'On échange des produits', 'On partage les nouvelles', 'On repart avec de nouveaux produits'] },
    questions: [{ id: 'q1', enonce: 'm1', ages: ['3-5', '6-10'], petit: 'Que trouve-t-on au marché ?', grand: 'Selon les récits, que trouvait-on au marché ?', choix: ['Des dattes, des tissus et des jarres', 'Des voitures'], bonne: 0 }] }
];

export const recit = id => RECITS.find(r => r.id === id) || null;
// L'ordre de réalisation demandé : d'abord les quatre premières découvertes ; les suivantes (Quraysh, redécouverte de Zamzam, Jabal an-Nour, Jabal Thawr) viendront ensuite
export const ORDRE_PREVU = ['hajar-ismail-zamzam', 'safa-marwa', 'communaute-mecque', 'fondations-kaaba', 'quraysh-reconstruction', 'redecouverte-zamzam', 'jabal-an-nour', 'jabal-thawr'];
