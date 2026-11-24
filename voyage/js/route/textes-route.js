// Les textes (non religieux) de la première tranche de La Route : lieux, animaux, personnages fictifs.
// « petit » : phrase courte pour les 3–5 ans. « grand » : un peu plus de détails pour les 6–10 ans. Les lieux sont imaginaires.
// Les contenus historiques et religieux sont ailleurs (contenu-a-valider.js).
export const TEXTES_LIEUX = {
  'hameau-borne': { petit: `Une borne de pierre montre le sentier vers le hameau.`, grand: `Une borne de pierre marque le départ d'un petit sentier. Il mène à un hameau caché entre les dunes, où l'on garde une source précieuse.` },
  'hameau-puits': { petit: `Un puits profond : l'eau est tout en bas.`, grand: `Un puits profond, creusé à la main. Un seau attaché à une corde descend chercher l'eau, et un treuil de bois aide à le remonter.` },
  'hameau-jardin': { petit: `Ce petit jardin pousse grâce à l'eau du puits.`, grand: `Un petit jardin de légumes, entouré d'une clôture de branches qui protège les plantes du vent. Chaque matin, on l'arrose avec l'eau du puits.` },
  'hameau-four': { petit: `Ce four en terre cuit le pain de tout le hameau.`, grand: `Un four en terre : on y chauffe des braises, puis on pose les pains sur les pierres chaudes. Tout le hameau partage ce four.` },
  fourmiliere: { petit: `Des fourmis portent des graines jusqu'à leur nid.`, grand: `Des fourmis du désert transportent des graines jusqu'à leur nid sous le sable. Chacune a sa tâche : elles s'entraident, comme une petite caravane.` },
  'fleurs-pluie': { petit: `Quand il pleut, le désert se couvre de fleurs !`, grand: `Après une rare pluie, les graines endormies se réveillent et le désert se couvre de fleurs en quelques jours. Elles vivent peu de temps, puis laissent des graines pour la prochaine pluie.` },
  'nid-tisserins': { petit: `Les tisserins font des nids ronds avec de l'herbe.`, grand: `Les oiseaux tisserins tissent des nids ronds avec de l'herbe, accrochés aux branches d'un acacia. Ils les construisent ensemble, comme un petit village.` },
  'dune-vent': { petit: `Le vent dessine des vagues sur le sable.`, grand: `Le vent déplace le sable grain par grain et dessine des vagues sur la crête. Une dune avance doucement, de quelques mètres chaque année.` },
  'lit-sec': { petit: `Ici, l'eau est passée : la terre est toute craquelée.`, grand: `Ici, de l'eau a coulé après de rares pluies. En séchant, la boue s'est fendue en grandes plaques : on appelle cela une terre craquelée.` },
  'rocher-vent': { petit: `Le vent et le sable ont creusé ce rocher.`, grand: `Pendant des milliers d'années, le vent chargé de sable a poli ce rocher et creusé des formes étranges. C'est le plus lent des sculpteurs.` },
  roseaux: { petit: `Les roseaux aiment avoir les pieds dans l'eau.`, grand: `Au bord de l'eau poussent des roseaux. On en fait des paniers, des nattes et des toits. Leurs racines tiennent la rive.` },
  'canal-jardin': { petit: `Un petit canal amène l'eau jusqu'aux jardins.`, grand: `Un petit canal creusé dans la terre conduit l'eau de la source jusqu'aux jardins et aux palmiers. Chacun ouvre et ferme la vanne à son tour, pour partager.` },
  seuil: { petit: 'Voici le début de la grande route. Bon voyage !', grand: 'Ici commence la grande route. Elle est très longue : prends ton temps, regarde autour de toi et repose-toi quand tu veux.' },
  balise1: { petit: 'Une vieille balise de pierre ! Une de trouvée.', grand: 'Une vieille balise de pierre. Les voyageurs les posaient pour ne pas se perdre quand le vent effaçait la piste.' },
  balise2: { petit: 'Une deuxième balise ! Bravo.', grand: 'Une deuxième balise. Elle est alignée avec la première : la piste passe juste entre les deux.' },
  balise3: { petit: 'La troisième balise ! Tu as retrouvé le chemin.', grand: 'La troisième balise. Les trois sont alignées : tu as bien retrouvé le chemin de la grande route.' },
  'rocher-aigle': { petit: 'Un grand rocher. Les grands oiseaux aiment s\'y poser.', grand: 'Un grand rocher qui domine la plaine. Les grands oiseaux aiment s\'y poser pour regarder au loin. De là-haut, on voit très loin !' },
  repos1: { petit: 'Un coin pour se reposer. Ton voyage est gardé.', grand: 'Un bon endroit pour se reposer à l\'ombre. Ton voyage est sauvegardé : tu pourras reprendre ici.' },
  repos2: { petit: 'Encore un coin tranquille pour souffler.', grand: 'Un replat abrité du vent, juste avant les dunes. Ton voyage est sauvegardé.' },
  repos3: { petit: 'Dernier repos avant l\'oasis.', grand: 'Le dernier replat avant l\'oasis. On devine déjà les palmiers au loin. Ton voyage est sauvegardé.' },
  trace1: { petit: 'Un petit lézard est passé ici !', grand: 'Ces traces fines, avec un sillon au milieu, viennent d\'un lézard à queue épineuse. Il se réchauffe au soleil et se cache dans un terrier quand il fait trop chaud.' },
  trace2: { petit: 'Un animal qui saute : une gerboise !', grand: 'Ces petites traces espacées, ce sont celles d\'une gerboise. Elle saute sur ses longues pattes arrière et sort surtout la nuit.' },
  trace3: { petit: 'Un renard a marché par ici.', grand: 'Ces empreintes alignées viennent d\'un renard des sables. Il a de grandes oreilles et des poils sous les pattes pour marcher sur le sable chaud.' },
  acacias: { petit: 'Des acacias ! Leur ombre est fraîche.', grand: 'Des acacias. Leurs racines vont très profond pour trouver l\'eau, et leurs épines protègent les feuilles. Leur ombre est précieuse dans la plaine.' },
  campement: { petit: 'Un campement de voyageurs !', grand: 'Le campement des Trois Tentes (un lieu imaginaire). Les voyageurs s\'y arrêtent pour se reposer, se nourrir et faire boire leurs animaux.' },
  belvedere: { petit: 'Regarde les belles dunes !', grand: 'De là-haut, on voit les dunes. C\'est le vent qui déplace le sable, grain après grain, et qui dessine ces grandes vagues dorées.' },
  citerne: { petit: 'Une vieille citerne en pierre.', grand: 'Une vieille citerne de pierre (un lieu imaginaire). Elle gardait l\'eau de la pluie : dans le désert, chaque goutte compte.' },
  oasis: { petit: 'L\'oasis ! De l\'eau, de l\'ombre et des palmiers.', grand: 'L\'oasis de la Source Claire (un lieu imaginaire). Dans une oasis, l\'eau est proche de la surface : les palmiers et les plantes peuvent pousser au milieu du désert.' },
  palmeraie: { petit: 'Les palmiers donnent des dattes.', grand: 'Le palmier dattier donne des dattes, un fruit très nourrissant. Ses racines aiment l\'eau, et son ombre abrite d\'autres plantes.' },
  'puits-voyageurs': { petit: 'Un vieux puits de pierre pour les voyageurs.', grand: 'Un puits de pierre (un lieu imaginaire). Les voyageurs y faisaient boire leurs animaux avant de quitter la plaine pour les montagnes.' },
  'plateau-plat': { petit: 'Des pierres plates et lisses, comme un grand sol.', grand: 'Un plateau de pierres plates. Le soleil, le vent et le sable les ont polies pendant très longtemps. Après lui, le chemin monte doucement vers les montagnes.' },
  'seuil-montagnes': { petit: 'Les montagnes ! Le chemin entre dans la vallée.', grand: 'Ici commencent les contreforts, les premières montagnes. Le sable se mêle de cailloux, la roche devient rouge et grise, et la vallée se resserre autour de toi.' },
  'col-porte': { petit: 'Une porte de pierre entre deux grands rochers.', grand: 'Deux grands rochers forment une porte naturelle (un lieu imaginaire). Un col est un passage entre deux montagnes : c\'est souvent le chemin le plus facile pour les traverser.' },
  repos4: { petit: 'Un abri sous la falaise, au frais.', grand: 'Un abri sous la falaise, à l\'ombre et au frais. Ton voyage est sauvegardé.' },
  'wadi-galets': { petit: 'Un lit de cailloux ronds : une rivière dormait ici.', grand: 'Un wadi est un lit de rivière à sec. La pluie est rare, mais quand elle tombe en montagne, l\'eau peut couler d\'un coup. Les galets sont ronds parce que l\'eau les a roulés.' },
  'belvedere-col': { petit: 'Regarde derrière toi : tout le chemin parcouru !', grand: 'Du haut du premier col, on voit toute la route : les dunes, l\'oasis et la plaine. C\'est un bon endroit pour se souvenir du chemin parcouru.' },
  repos5: { petit: 'Encore un coin calme dans la vallée.', grand: 'Un replat tranquille dans le fond de la vallée, près des galets. Ton voyage est sauvegardé.' },
  'cairn-fin': { petit: 'Le haut du premier col : la cité n\'est plus très loin.', grand: 'Le grand cairn marque le haut du premier col. Après lui, la route redescend vers d\'autres vallées, puis vers les chemins qui mènent à la cité.' },
  'col-vue': { petit: 'Un deuxième col, encore un passage entre les montagnes.', grand: 'Un deuxième col. La route monte, puis redescend de l\'autre côté. Regarde les couches de roche sur les parois : elles se sont empilées pendant très longtemps.' },
  repos6: { petit: 'Un coin pour souffler. Ton voyage est gardé.', grand: 'Un replat où les voyageurs se reposaient avant de repartir. Ton voyage est sauvegardé.' },
  'muret-pierre': { petit: 'Un petit mur de pierres, sans ciment.', grand: 'Un muret de pierres sèches : les pierres tiennent toutes seules, bien emboîtées, sans ciment. On en faisait pour border les chemins et les jardins.' },
  'puits-chemin': { petit: 'Un puits au bord du chemin.', grand: 'Un puits au bord du chemin (un lieu imaginaire) : les voyageurs et leurs animaux pouvaient s\'y arrêter pour boire.' },
  repos7: { petit: 'Dernier coin calme avant la cité.', grand: 'Le dernier replat avant la cité. Ton voyage est sauvegardé.' },
  carrefour: { petit: 'Un sentier part vers une grande montagne.', grand: 'Un carrefour : un sentier part vers le nord, vers une grande montagne. Tu peux le suivre pour aller voir, puis revenir sur la route.' },
  'montagne-nord-pied': { petit: 'Une très grande montagne se dresse devant toi.', grand: 'Au pied d\'une très grande montagne isolée. Remarque sa forme, ses pentes raides et ses rochers sombres : on ne peut pas la gravir ici.' },
  jardins: { petit: 'De petits jardins entourés de murets.', grand: 'Les premiers jardins : de petits champs et des arbres protégés par des murets de pierre. Ils annoncent qu\'une cité n\'est plus très loin.' },
  'crete-vue': { petit: 'La cité apparaît au loin !', grand: 'Du haut de la dernière crête, on voit la vallée : au fond, les toits plats d\'une grande cité. Prends un moment pour regarder.' },
  'cite-porte': { petit: 'La porte de la cité.', grand: 'La porte de la cité : deux gros piliers de pierre. Elle ouvre sur des ruelles, des cours et des places.' },
  'cite-atelier': { petit: 'Un atelier de potier : des jarres en terre cuite.', grand: 'L\'atelier du potier : on façonne des jarres et des bols en terre, que l\'on fait cuire. Ils servent à garder l\'eau, les dattes et le grain.' },
  'cite-colline-b': { petit: 'Une petite colline de pierre.', grand: 'Une petite colline rocheuse à l\'intérieur de la cité. De là-haut, on voit les toits plats et les ruelles.' },
  'collines-chemin-1': { petit: 'Regarde la colline devant toi.', grand: 'Premier point d\'observation : regarde la colline devant toi. Les deux collines sont assez proches pour que l\'on puisse voir l\'une depuis l\'autre.' },
  'collines-chemin-2': { petit: 'Écoute le vent dans la vallée.', grand: 'Deuxième point : écoute le vent qui passe dans la vallée. Entre deux collines, l\'air circule et rafraîchit un peu.' },
  'collines-chemin-3': { petit: 'Regarde le sol : du sable et des pierres.', grand: 'Troisième point : observe le sol, fait de sable, de petites pierres et de terre sèche. Il n\'y a ni course ni chronomètre : on se promène à son rythme.' },
  'cite-place': { petit: 'La grande place, au centre de la cité.', grand: 'La grande place, au centre de la cité : un grand espace dégagé, sans étal ni obstacle, entouré de maisons de pierre.' },
  'cite-puits': { petit: 'Un puits de pierre sur la place.', grand: 'Un puits de pierre avec une margelle basse et une jarre. L\'eau est précieuse dans toute la cité.' },
  'cite-colline-a': { petit: 'Une autre petite colline de pierre.', grand: 'Une autre petite colline rocheuse, de l\'autre côté de la cité. On peut aller de l\'une à l\'autre en marchant tranquillement.' },
  'cite-marche': { petit: 'Le marché : des étals, des jarres, des tissus.', grand: 'Le marché : des étals sous des auvents de tissu, des jarres, des paniers, des dattes. On y échange et on y bavarde.' },
  'montagne-sud-pied': { petit: 'Une autre grande montagne, plus au sud.', grand: 'Au pied d\'une autre grande montagne, plus massive et à plusieurs sommets. De loin, ses crêtes se découpent sur le ciel.' },
  'cite-fin': { petit: 'Ici s\'arrête le monde construit, pour l\'instant.', grand: 'Ici s\'arrête la partie du monde déjà construite. Bravo : tu as traversé les plaines, les montagnes et la cité !' }
};
// Les maisons de la cité : un fait court par forme de maison (illustration du jeu : la cité est une interprétation, pas une reconstitution exacte)
export const FAITS_MAISONS = [
  { petit: 'Une maison de pierre : ses murs épais gardent la fraîcheur.', grand: 'Une maison de pierre : ses murs épais gardent la fraîcheur le jour et la chaleur la nuit. Ses petites fenêtres laissent peu entrer le soleil brûlant.' },
  { petit: 'Cette maison a un étage plus étroit, avec un toit plat.', grand: 'Cette maison a un étage plus étroit. Sur le toit plat, on pouvait faire sécher des dattes, ou dormir quand il faisait trop chaud.' },
  { petit: 'Une maison en L : deux ailes autour d\'un coin à l\'ombre.', grand: 'Une maison en forme de L : les deux ailes protègent un petit coin à l\'ombre, où l\'on pouvait s\'asseoir à la fraîche.' },
  { petit: 'Un escalier à l\'extérieur mène au toit.', grand: 'Un escalier extérieur mène au toit : on monte sans traverser la maison, et l\'on garde la pièce du bas fraîche et tranquille.' },
  { petit: 'Une maison avec une cour au milieu.', grand: 'Une maison à cour : au milieu, un espace ouvert où l\'on travaille à l\'abri du vent et de la poussière, avec les murs tout autour.' },
  { petit: 'Une échoppe : un auvent de tissu donne de l\'ombre.', grand: 'Une échoppe : l\'auvent de tissu protège du soleil, et les marchandises sont posées devant la porte, bien visibles.' },
  { petit: 'Une petite tour pour ranger les provisions.', grand: 'Une petite tour basse : on y rangeait les provisions, dans la fraîcheur des murs épais.' },
  { petit: 'Un enclos avec une petite cabane.', grand: 'Un enclos avec une cabane : un abri pour les animaux de la famille, à l\'ombre d\'un mur.' }
];
// Dans l'atelier du potier : deux choses à observer, au tour et au four
export const FAITS_ATELIER = {
  tour: { nom: 'Le tour du potier', icone: '🌀', label: 'Observer le tour', petit: `Le potier fait tourner le plateau et modèle l'argile avec ses mains.`, grand: `Le tour du potier : le plateau tourne, et le potier modèle l'argile avec ses mains mouillées. Peu à peu, la motte devient une jarre bien ronde.` },
  four: { nom: 'Le four à argile', icone: '🔥', label: 'Observer le four', petit: `Dans le four, la chaleur rend la jarre dure comme une pierre.`, grand: `Le four à argile : la grande chaleur durcit les jarres. Une fois cuites, elles ne se déforment plus et peuvent garder l'eau.` }
};
// Dans les maisons : deux objets à observer par pièce (un par habitant fictif). forme : le modèle 3D de l'objet (voir interieur-3d.js).
export const FAITS_INTERIEURS = {
  0: { titre: 'Chez la grand-mère', icone: '🏠', objets: [
    { nom: 'La grande jarre', icone: '🏺', label: 'Observer la jarre', forme: 'jarre', petit: `Une grande jarre d'eau : l'eau y reste fraîche.`, grand: `Une grande jarre d'eau, couverte d'un linge humide : l'eau y reste fraîche même quand il fait très chaud dehors.` },
    { nom: 'Le tapis de laine', icone: '🧶', label: 'Observer le tapis', forme: 'tapis', petit: `Un tapis de laine pour s'asseoir tous ensemble.`, grand: `Un tapis de laine épais : on s'y assoit en famille pour partager le repas et se reposer.` }] },
  1: { titre: 'Chez le vendeur de dattes', icone: '🌴', objets: [
    { nom: 'Les sacs de dattes', icone: '🛍️', label: 'Observer les sacs', forme: 'sacs', petit: `Des sacs pleins de dattes bien rangés.`, grand: `Des sacs de dattes, bien fermés et rangés au frais : ainsi, elles se gardent longtemps.` },
    { nom: 'La balance', icone: '⚖️', label: 'Observer la balance', forme: 'balance', petit: `Une balance pour peser les dattes.`, grand: `Une balance en bois : le marchand pèse les dattes pour que chacun reçoive exactement la bonne quantité, sans tricher.` }] },
  2: { titre: 'Chez la couturière', icone: '🧵', objets: [
    { nom: 'Le métier à tisser', icone: '🧵', label: 'Observer le métier', forme: 'metier', petit: `Un métier à tisser : les fils se croisent pour faire un tissu.`, grand: `Un métier à tisser : en croisant les fils de laine, un à un, on fabrique un tissu solide et chaud.` },
    { nom: 'Les tissus', icone: '🎨', label: 'Observer les tissus', forme: 'tissus', petit: `Des tissus de toutes les couleurs.`, grand: `Des tissus de toutes les couleurs, teints avec des plantes et de la terre : bleu, rouge, jaune.` }] },
  3: { titre: 'Chez le berger', icone: '🐑', objets: [
    { nom: 'La laine', icone: '🐑', label: 'Observer la laine', forme: 'laine', petit: `De la laine de mouton, toute douce.`, grand: `De la laine de mouton : on la lave, on la peigne, puis on la file pour en faire des vêtements et des tapis.` },
    { nom: "L'outre en peau", icone: '💧', label: "Observer l'outre", forme: 'outre', petit: `Une outre en peau pour porter l'eau.`, grand: `Une outre en peau de chèvre : elle porte l'eau pendant les voyages et la garde fraîche.` }] },
  4: { titre: "Chez l'artisan", icone: '🔨', objets: [
    { nom: 'Les outils', icone: '🔨', label: 'Observer les outils', forme: 'outils', petit: `Des outils pour réparer : un marteau et une lime.`, grand: `Des outils bien rangés : avec un marteau et une lime, l'artisan répare ce qui est cassé, au lieu de le jeter.` },
    { nom: 'Les cordes', icone: '🧵', label: 'Observer les cordes', forme: 'cordes', petit: `Des cordes tressées, très solides.`, grand: `Des cordes tressées à la main avec des fibres de palmier : elles servent à puiser l'eau et à attacher les charges.` }] },
  6: { titre: 'Chez le gardien des provisions', icone: '🌾', objets: [
    { nom: 'Le blé', icone: '🌾', label: 'Observer le blé', forme: 'sacs', petit: `Des sacs de blé pour toute l'année.`, grand: `Des sacs de blé et d'orge : ces provisions permettent de nourrir tout le monde, même quand la récolte est mauvaise.` },
    { nom: "L'étagère", icone: '🍯', label: "Observer l'étagère", forme: 'etagere', petit: `Une étagère avec des jarres de miel et d'huile.`, grand: `Une étagère de jarres de miel, d'huile et de dattes pressées, bien fermées pour ne pas se gâter.` }] }
};
// Les haltes du sentier de montée des deux grandes montagnes (nature et géographie seulement ; la 3e halte est le belvédère). Les histoires liées au pied des montagnes restent « À VALIDER » ailleurs.
export const HALTES_MONTAGNE = {
  nord: [
    { nom: 'Le premier replat', icone: '⛰️', label: 'Reprendre son souffle', petit: `Un petit replat pour reprendre son souffle.`, grand: `Un petit replat pour reprendre son souffle. On monte mieux à petits pas réguliers, en buvant un peu d'eau.` },
    { nom: 'Les plantes du rocher', icone: '🌿', label: 'Observer les plantes', petit: `Des petites plantes poussent entre les pierres.`, grand: `Entre les pierres, de petites plantes épineuses poussent : leurs longues racines vont chercher l'eau très profond.` },
    { nom: 'Le belvédère du nord', icone: '🌅', label: 'Regarder la vue', petit: `D'ici, on voit toute la cité et la plaine !`, grand: `D'ici, on voit toute la cité, ses maisons serrées, et la grande plaine tout autour. Plus on monte, plus on voit loin.` }],
  sud: [
    { nom: 'Le vent de la montagne', icone: '💨', label: 'Écouter le vent', petit: `Ici, le vent souffle plus fort.`, grand: `Plus on monte, plus le vent est frais et fort. Depuis très longtemps, il polit les rochers.` },
    { nom: 'Les roches de couleur', icone: '🎨', label: 'Observer les roches', petit: `Les roches ont des couleurs : rouge, jaune, gris.`, grand: `Regarde les couleurs de la roche : le rouge vient du fer, le jaune du sable, le gris de la pierre dure.` },
    { nom: 'Le belvédère du sud', icone: '🌅', label: 'Regarder la vue', petit: `D'ici, on voit les chemins et les jardins.`, grand: `D'ici, on voit les chemins des caravanes, les jardins et la cité au loin. Les montagnes servent de repères aux voyageurs.` }]
};
// Les questions que l'on peut poser aux habitants de la cité (deux par habitant) : leurs métiers, la vie de tous les jours. Aucun sujet religieux ; chaque réponse est dite par la voix de l'habitant.
export const SUJETS_VOYAGEURS = {
  puisatier: [
    { q: `Comment trouve-t-on l'eau ?`, petit: `On cherche où la terre est fraîche.`, grand: `On cherche les endroits où la terre reste fraîche et où poussent des plantes vertes. Là, l'eau n'est pas loin sous le sable.` },
    { q: `Pourquoi un puits si profond ?`, petit: `L'eau fraîche est tout en bas.`, grand: `Plus on creuse, plus l'eau est fraîche et propre, à l'abri du soleil et de la poussière. Mais il faut une bonne corde !` }],
  'marchand-dattes': [
    { q: `Comment choisir une datte ?`, petit: `Une bonne datte est souple et brillante.`, grand: `Une bonne datte est souple, brillante et sucrée. Si elle est très dure ou très sèche, elle est trop vieille.` },
    { q: `D'où viennent tes dattes ?`, petit: `Des palmiers de l'oasis, tout là-bas.`, grand: `Elles poussent sur les palmiers des oasis, où l'eau est proche. Une caravane les apporte jusqu'ici en plusieurs jours.` }],
  tisserande: [
    { q: `Comment fais-tu les couleurs ?`, petit: `Avec des plantes et de la terre.`, grand: `Je fais bouillir des plantes, des racines et de la terre colorée. Le tissu prend la couleur, comme une peinture douce.` },
    { q: `Combien de temps pour un tapis ?`, petit: `Plusieurs semaines, avec patience.`, grand: `Un grand tapis demande plusieurs semaines, un fil après l'autre. Il faut de la patience, et c'est ce qui le rend si beau.` }],
  potier: [
    { q: `Pourquoi as-tu un four ?`, petit: `Le feu rend la jarre dure comme une pierre.`, grand: `Le feu durcit l'argile. Sans cuisson, la jarre redeviendrait de la boue au premier contact avec l'eau.` },
    { q: `Où trouves-tu l'argile ?`, petit: `Près des endroits où l'eau passe.`, grand: `On trouve l'argile près des anciens lits d'eau, là où la terre est lisse et collante quand elle est mouillée.` }],
  'voyageuse-oasis': [
    { q: `Comment as-tu voyagé ?`, petit: `En caravane, avec des chameaux.`, grand: `J'ai voyagé en caravane, avec des chameaux qui portaient l'eau et les provisions. On marche surtout le matin et le soir, quand il fait plus frais.` },
    { q: `Que fais-tu quand il fait chaud ?`, petit: `On se repose à l'ombre.`, grand: `Quand le soleil est trop fort, on se repose à l'ombre d'une tente, on boit de petites gorgées et on repart plus tard.` }],
  'porteur-eau': [
    { q: `Combien de jarres par jour ?`, petit: `Beaucoup ! Mon dos le sait.`, grand: `Une dizaine de jarres par jour, du puits jusqu'au marché. Avec deux outres bien équilibrées, c'est plus facile.` },
    { q: `Comment garder l'eau fraîche ?`, petit: `On la couvre avec un linge mouillé.`, grand: `On couvre les jarres d'un linge mouillé et on les met à l'ombre : en séchant, le linge rafraîchit l'eau.` }],
  'marcheur-rue': [
    { q: `Qu'as-tu vu en chemin ?`, petit: `Des dunes, des oasis et des montagnes.`, grand: `J'ai vu des dunes dorées, des oasis pleines de palmiers et de hautes montagnes rouges. Chaque endroit était différent.` },
    { q: `Un conseil pour le voyage ?`, petit: `Marche doucement et bois de l'eau.`, grand: `Marche à ton rythme, bois un peu d'eau souvent et regarde autour de toi : on ne voyage pas pour arriver vite, mais pour bien voir.` }],
  'ancien-marche': [
    { q: `Comment sais-tu le temps qu'il fera ?`, petit: `Je regarde le ciel et le vent.`, grand: `Je regarde le ciel et le vent. Un ciel rouge au coucher du soleil annonce souvent une belle journée, et un vent chaud apporte du sable.` },
    { q: `Que faisais-tu quand tu étais jeune ?`, petit: `J'ai guidé des caravanes.`, grand: `J'ai guidé des caravanes pendant des années. J'ai appris à lire les étoiles pour ne jamais perdre mon chemin la nuit.` }],
  boulangere: [
    { q: `Comment fais-tu le pain ?`, petit: `Avec de la farine, de l'eau et du feu.`, grand: `Je mélange de la farine, de l'eau et un peu de sel, je laisse reposer la pâte, puis je la cuis sur les pierres chaudes du four.` },
    { q: `Pourquoi laisser reposer la pâte ?`, petit: `Pour qu'elle gonfle doucement.`, grand: `En reposant, la pâte gonfle doucement et devient légère. Il faut de la patience : on ne peut pas aller plus vite que la pâte !` }],
  'jeune-berger': [
    { q: `Comment appelles-tu tes chèvres ?`, petit: `Avec un sifflement doux.`, grand: `Je siffle un petit air, toujours le même : mes chèvres le reconnaissent et viennent vers moi, même de loin.` },
    { q: `Que boivent tes chèvres ?`, petit: `Un peu d'eau, matin et soir.`, grand: `Elles boivent un peu d'eau matin et soir. Dans le désert, elles supportent la soif mieux que nous, mais je leur en garde toujours.` }],
  caravanier: [
    { q: `Que portent les chameaux ?`, petit: `Des sacs, de l'eau et des tissus.`, grand: `Ils portent des sacs de dattes, des jarres d'eau et des balles de tissu. Un chameau peut porter une lourde charge pendant des jours.` },
    { q: `Comment ne pas se perdre ?`, petit: `On suit les étoiles et les repères.`, grand: `On suit les étoiles la nuit et, le jour, des repères comme les montagnes ou les balises de pierre.` }]
};

export const texteLieu = (id, age) => { const t = TEXTES_LIEUX[id]; return t ? (age === '3-5' ? t.petit : t.grand) : ''; };

// Les personnages FICTIFS (aucun personnage historique ou religieux)
export const GUIDE = { nom: 'Rachid', titre: '🧭 Rachid, le guide des caravanes',
  intro: { petit: 'Bonjour ! Je suis Rachid. Je connais la grande route. Prépare ton sac, puis suis-moi !', grand: 'Bonjour, voyageur ! Je m\'appelle Rachid et je guide les caravanes. La grande route est très longue : elle traverse des plaines, des dunes, des oasis et des montagnes. Prépare ton sac, et en route !' },
  ferme: 'La grande route n\'est pas encore ouverte pour toi. Continue d\'explorer le village : ',
  fermeTexte: 'La grande route n\'est pas encore ouverte pour toi. Continue d\'explorer le village : découvre l\'oasis et le camp des caravanes, puis fais une activité de ton choix.' };
export const VOYAGEUSE = { nom: 'Dalila', titre: '🧕 Dalila, une voyageuse',
  debut: { petit: 'Oh ! J\'ai perdu mes affaires. Tu peux m\'aider ?', grand: 'Bonjour ! Le vent a emporté mon tapis, ma jarre et mon petit sac quelque part autour du campement. Tu peux m\'aider à les retrouver ?' },
  attente: { petit: 'Cherche autour des tentes. Merci !', grand: 'Cherche autour du campement : des petites pierres dorées brillent là où mes affaires se cachent. Merci pour ton aide !' },
  tout: { petit: 'Tu as tout trouvé ! Rapporte-moi mes affaires.', grand: 'Tu as retrouvé mes trois affaires ! Rapporte-les-moi, je t\'attends au campement.' },
  merci: { petit: 'Merci beaucoup ! Tu es très gentil.', grand: 'Merci mille fois ! Sans toi, je serais repartie sans mon tapis ni ma jarre. Tu es un vrai ami des voyageurs !' },
  eau: 'Tu partages l\'eau de ta gourde avec elle. « Merci, c\'est très gentil ! »',
  provisions: 'Tu partages tes provisions avec elle. « Quelle bonne idée, merci ! »' };
export const MESSAGES = {
  mecque: 'La grande route vers La Mecque',
  sacDit: 'Chaque objet du sac sert à quelque chose, mais aucun n\'est obligatoire : tu peux partir comme tu veux.',
  gourdePleine: 'Tu remplis ta gourde à l\'eau claire de l\'oasis.',
  gourdeAbsente: 'L\'eau de l\'oasis est claire et fraîche. Pense à emporter ta gourde la prochaine fois !',
  limite: "Plus loin, le désert est trop sauvage : reste près de la piste et des lumières.",
  ramene: "Tu t'étais trop éloigné : on te ramène sur la grande piste.",
  horsPiste: "Tu t'éloignes de la grande piste. Reviens vers les poteaux rouges, ou ouvre ta carte.",
  cueillette: 'Tu cueilles deux dattes mûres : elles vont dans ton panier.',
  cueilletteFin: 'Il ne reste plus de dattes mûres : laisse le reste aux oiseaux !',
  traversee: 'Une traversée de plus, tranquillement !',
  traversees3: 'Trois traversées : bravo ! Tu peux continuer, sans te presser.',
  chemin3: 'Les trois balises sont trouvées : tu as retrouvé le chemin de la grande route !',
  sacTexte: 'Chaque objet du sac sert à quelque chose, mais aucun n\'est obligatoire : tu peux partir comme tu veux. Touche un objet pour le mettre dans ton sac, ou l\'en retirer.',
  panneauOuvert: 'Une très longue piste part d\'ici, vers l\'est. Parle à Rachid pour préparer ton sac, puis suis la piste.',
  panneauFerme: 'Une très longue piste part d\'ici, mais elle est encore fermée.',
  lanterne: 'Une lanterne est allumée : une histoire à découvrir ici.',
  affairesRetrouvees: 'Tu as tout retrouvé ! Rapporte les affaires à la voyageuse.',
  fin: 'Ici s\'arrête le monde construit, pour l\'instant. Bravo pour ce long voyage !',
  etape1: 'Bravo, tu as traversé les plaines et les dunes jusqu\'à l\'oasis !',
  etape1Cadeau: 'Pour te remercier, un dromadaire de la grande route t\'attend dans ton écurie, au village.',
  lanterneSac: 'Ta petite lanterne brille doucement.',
  maisonNote: '(Illustration du jeu : la cité est une interprétation, pas une reconstitution exacte.)',
  nouvelleMission: 'Nouvelle mission', histoireAjoutee: 'Histoire ajoutée à ton carnet', entreDans: 'Tu entres dans', citeApparait: 'La cité apparaît !', decouvres: 'Tu découvres', grandeRoute: 'La grande route',
  heureux: 'Au revoir, et bonne route !'
};
// Les retours des activités et des questions : douceur, jamais de punition (voix possible : ce ne sont pas des contenus religieux)
export const FEEDBACK = { ordreOk: 'Bravo, tout est dans l\'ordre !', ordreKo: 'Pas tout à fait, essaie encore doucement.', repOk: 'Bonne réponse !', repKo: 'Pas tout à fait, essaie encore.' };
