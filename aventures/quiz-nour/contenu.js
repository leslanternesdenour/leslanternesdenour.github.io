// LES QUIZ ET DÉFIS DE NOUR — contenus : 8 catégories × 3 niveaux × 4 questions (= 96), réponses illustrées, explications douces, dialogues.
// SOURCE UNIQUE des textes (l'inventaire audio est généré ici : node outils/voix/jeux/inventaire.mjs quiz-nour).
// RIGUEUR : seuls des faits de base, consensuels et sans ambiguïté sont utilisés (aucune réponse approximative ni inventée) ; chaque question a UNE seule bonne réponse
// (la première de la liste : l'ordre est mélangé au moment du jeu). Les questions religieuses sont marquées religieux:true : leur formulation reste volontairement élémentaire
// (cinq prières, cinq piliers, Coran, Ramadan…) et reste à valider par le fondateur avant publication (statut dans docs/QUIZ-VERIFICATION.md).
// Aucune représentation de prophète ; les prophètes sont nommés avec « paix sur lui » ; aucune récitation coranique n'est utilisée.
export const GUIDES = {
  hakim: { nom: 'Hakim', metier: 'le sage du village', voix: 'perso-hakim', tunique: '#8a6a3a', pantalon: '#4a3a2a', cheche: '#efe6cc', peau: '#a8724c', barbe: '#d8d0c0' },
  warda: { nom: 'Warda', metier: 'la gardienne de la bibliothèque', voix: 'perso-warda', tunique: '#3d4f9a', pantalon: '#2a2f4a', cheche: '#f0e8d0', peau: '#b98458', voile: '#d9d2f2' },
  samir: { nom: 'Samir', metier: 'le puisatier', voix: 'perso-samir', tunique: '#2f9aa8', pantalon: '#3a4f5a', cheche: '#f4ead2', peau: '#9a6a46' },
  yacine: { nom: 'Yacine', metier: 'le jardinier', voix: 'perso-yacine', tunique: '#4f9a4a', pantalon: '#5a4a2a', cheche: '#e9e2b8', peau: '#a8724c' },
  salma: { nom: 'Salma', metier: 'la maîtresse de maison', voix: 'perso-salma', tunique: '#7a5ac0', pantalon: '#3a2f5a', cheche: '#f6ecd8', peau: '#c08a62', voile: '#e9dcf8' },
  idriss: { nom: 'Idriss', metier: "l'explorateur", voix: 'perso-idriss', tunique: '#c8664a', pantalon: '#4a3a2a', cheche: '#f4ead2', peau: '#a8724c' },
  karim: { nom: 'Karim', metier: 'le marchand', voix: 'perso-karim', tunique: '#b8553a', pantalon: '#4a3a2a', cheche: '#f1e3c0', peau: '#b07a52' }
};
export const NIVEAUX = ['facile', 'moyen', 'avance'];

// Une réponse = « emoji|libellé ». La PREMIÈRE est la bonne.
const Q = (q, choix, exp, extra = {}) => ({ q, choix, exp, ...extra });
export const CATEGORIES = {
  culture: { nom: 'Culture islamique', icone: '🕌', guide: 'hakim', decor: 'village', ciel: '#f4cfa0', sol: '#d8b078', brume: '#f2d9b2', religieux: true,
    intro: "Bonjour ! Je suis Hakim, le sage du village. Je vais te poser des questions sur la culture islamique. Prends ton temps : si tu te trompes, tu pourras réessayer.",
    questions: {
      facile: [
        Q("Comment s'appelle le lieu où les musulmans prient ensemble ?", ['🕌|La mosquée', '🏫|L\'école', '🛒|Le marché'], "La mosquée est le lieu où les musulmans se rassemblent pour prier."),
        Q("Combien de fois les musulmans prient-ils chaque jour ?", ['5️⃣|Cinq fois', '3️⃣|Trois fois', '7️⃣|Sept fois'], "Les musulmans font cinq prières par jour."),
        Q("Comment s'appelle le livre sacré des musulmans ?", ['📖|Le Coran', '🍳|Un livre de cuisine', '🗺️|Une carte'], "Le Coran est le livre sacré des musulmans."),
        Q("Quand on dit « As-salamu alaykum », on souhaite…", ['🕊️|Que la paix soit sur toi', '🌙|Bonne nuit', '🎁|Un cadeau'], "« As-salamu alaykum » veut dire « Que la paix soit sur vous ». C'est une belle façon de saluer.")],
      moyen: [
        Q("Pendant quel mois les musulmans jeûnent-ils chaque jour, du lever au coucher du soleil ?", ['🌙|Ramadan', '🌙|Muharram', '🌙|Rajab'], "Les musulmans jeûnent pendant le mois de Ramadan."),
        Q("Vers quelle direction les musulmans se tournent-ils pour prier ?", ['🕋|Vers la Kaaba, à La Mecque', '☀️|Vers le soleil', '🌙|Vers la lune'], "Les musulmans prient en direction de la Kaaba, à La Mecque."),
        Q("Comment s'appelle la prière faite à l'aube, la première de la journée ?", ['🌅|Le Fajr', '🌆|Le Maghrib', '🌃|L\'Isha'], "La prière du Fajr se fait à l'aube, avant le lever du soleil."),
        Q("Avant de prier, que fait-on pour se purifier avec de l'eau ?", ['💧|Les ablutions', '🧺|La lessive', '🍽️|La vaisselle'], "Avant la prière, on fait les ablutions : on se lave avec de l'eau, dans un ordre précis.")],
      avance: [
        Q("Combien y a-t-il de piliers dans l'islam ?", ['5️⃣|Cinq', '4️⃣|Quatre', '6️⃣|Six', '7️⃣|Sept'], "Il y a cinq piliers dans l'islam : la foi, la prière, l'aumône, le jeûne du Ramadan et le pèlerinage."),
        Q("Comment s'appelle la fête qui marque la fin du mois de Ramadan ?", ['🎉|L\'Aïd al-Fitr', '🐑|L\'Aïd al-Adha', '🎂|Un anniversaire'], "L'Aïd al-Fitr est la fête qui marque la fin du Ramadan."),
        Q("Combien de sourates compte le Coran ?", ['📖|114', '📖|99', '📖|30', '📖|60'], "Le Coran compte 114 sourates."),
        Q("Comment s'appelle la première sourate du Coran ?", ['📖|Al-Fatiha', '📖|Al-Ikhlas', '📖|An-Nas'], "La première sourate du Coran s'appelle Al-Fatiha, « l'Ouverture ».")] } },
  histoires: { nom: 'Histoires', icone: '📚', guide: 'warda', decor: 'bibliotheque', ciel: '#d9cdf0', sol: '#c9ab7a', brume: '#e4daf5', religieux: true,
    intro: "Chut… Bonjour, je suis Warda, la gardienne de la bibliothèque. Ici, on parle d'histoires et de contes. Quand on nomme un prophète, on dit « paix sur lui ». Es-tu prêt ?",
    questions: {
      facile: [
        Q("Dans la fable « Le Lièvre et la Tortue », qui gagne la course ?", ['🐢|La tortue', '🐇|Le lièvre', '🐘|L\'éléphant'], "La tortue gagne : elle avance doucement, sans jamais s'arrêter."),
        Q("Dans « Les Trois Petits Cochons », la maison qui résiste au loup est faite de…", ['🧱|Briques', '🌾|Paille', '🪵|Bâtons'], "La maison en briques est solide : le loup n'arrive pas à la détruire."),
        Q("Dans « Le Petit Chaperon rouge », de quelle couleur est le chaperon ?", ['🔴|Rouge', '🔵|Bleu', '🟢|Vert'], "Le petit chaperon est rouge, comme son nom l'indique."),
        Q("Dans « Cendrillon », que perd-elle en partant du bal ?", ['👠|Une chaussure', '🎩|Un chapeau', '👜|Un sac'], "Cendrillon perd une pantoufle, que le prince retrouvera.")],
      moyen: [
        Q("Quel prophète, paix sur lui, a construit une grande arche pour sauver les croyants et les animaux ?", ['🚢|Nuh (Noé)', '🐟|Yunus (Jonas)', '🌟|Yusuf (Joseph)'], "C'est le prophète Nuh, paix sur lui, qui a construit une grande arche.", { religieux: true }),
        Q("Quel prophète, paix sur lui, a été avalé par un grand poisson ?", ['🐟|Yunus (Jonas)', '🚢|Nuh (Noé)', '🌟|Yusuf (Joseph)'], "C'est le prophète Yunus, paix sur lui, qui fut avalé par un grand poisson.", { religieux: true }),
        Q("Quel prophète, paix sur lui, a vu en rêve onze étoiles, le soleil et la lune ?", ['🌟|Yusuf (Joseph)', '🚢|Nuh (Noé)', '🐟|Yunus (Jonas)'], "C'est le prophète Yusuf, paix sur lui, qui a fait ce rêve quand il était enfant.", { religieux: true }),
        Q("Quel livre a été révélé au prophète Muhammad, paix sur lui ?", ['📖|Le Coran', '📕|Un livre de contes', '🗺️|Un atlas'], "Le Coran a été révélé au prophète Muhammad, paix sur lui.", { religieux: true })],
      avance: [
        Q("Dans « Les Mille et Une Nuits », comment s'appelle la conteuse qui raconte une histoire chaque nuit ?", ['👸|Shéhérazade', '🧞|Aladin', '⛵|Sindbad'], "Shéhérazade raconte une histoire chaque nuit pour captiver le roi."),
        Q("Dans « Les Mille et Une Nuits », quel héros fait de grands voyages en mer ?", ['⛵|Sindbad le marin', '👸|Shéhérazade', '🕌|Le sage du village'], "Sindbad le marin raconte ses sept grands voyages sur les mers."),
        Q("Quel prophète, paix sur lui, a construit la Kaaba avec son fils Ismaïl ?", ['🕋|Ibrahim (Abraham)', '🚢|Nuh (Noé)', '🐟|Yunus (Jonas)'], "Le prophète Ibrahim, paix sur lui, a construit la Kaaba avec son fils Ismaïl.", { religieux: true }),
        Q("Quel prophète, paix sur lui, comprenait le langage des oiseaux et des fourmis ?", ['🐦|Sulayman (Salomon)', '🌟|Yusuf (Joseph)', '🐟|Yunus (Jonas)'], "Le prophète Sulayman, paix sur lui, comprenait le langage des oiseaux et des fourmis.", { religieux: true })] } },
  animaux: { nom: 'Les animaux', icone: '🐪', guide: 'samir', decor: 'oasis', ciel: '#a9e0f0', sol: '#e6cf8f', brume: '#cdeef5',
    intro: "Salut ! Moi, c'est Samir, le puisatier. À l'oasis, il y a plein d'animaux qui viennent boire. Tu les connais bien ? Voyons ça !",
    questions: {
      facile: [
        Q("Quel animal a une grosse bosse sur le dos ?", ['🐪|Le dromadaire', '🐘|L\'éléphant', '🐴|Le cheval'], "Le dromadaire a une bosse sur le dos."),
        Q("Quel animal fait « miaou » ?", ['🐱|Le chat', '🐶|Le chien', '🐮|La vache'], "C'est le chat qui fait « miaou »."),
        Q("Quel petit animal fabrique le miel ?", ['🐝|L\'abeille', '🐜|La fourmi', '🐞|La coccinelle'], "Les abeilles fabriquent le miel."),
        Q("Quel animal a une très longue trompe ?", ['🐘|L\'éléphant', '🦒|La girafe', '🐇|Le lapin'], "L'éléphant a une longue trompe, qui lui sert de nez et de main.")],
      moyen: [
        Q("Combien de pattes a une araignée ?", ['8️⃣|Huit', '6️⃣|Six', '🔟|Dix'], "Une araignée a huit pattes."),
        Q("Comment s'appelle le petit de la vache ?", ['🐄|Le veau', '🐑|L\'agneau', '🐴|Le poulain'], "Le petit de la vache est le veau."),
        Q("Quel animal du désert peut rester longtemps sans boire ?", ['🐪|Le dromadaire', '🐟|Le poisson', '🐧|Le manchot'], "Le dromadaire peut marcher plusieurs jours sans boire."),
        Q("Quel animal est un mammifère qui sait voler ?", ['🦇|La chauve-souris', '🦅|L\'aigle', '🐝|L\'abeille'], "La chauve-souris est un mammifère : c'est le seul à pouvoir voler.")],
      avance: [
        Q("Quel est le plus grand animal du monde ?", ['🐋|La baleine bleue', '🐘|L\'éléphant', '🦒|La girafe'], "La baleine bleue est le plus grand animal du monde."),
        Q("Dans sa bosse, le dromadaire garde surtout…", ['🐪|De la graisse', '💧|De l\'eau', '🏜️|Du sable'], "La bosse du dromadaire contient une réserve de graisse, pas d'eau."),
        Q("Avec quoi un poisson respire-t-il dans l'eau ?", ['🐟|Avec des branchies', '👃|Avec son nez', '🪶|Avec des plumes'], "Un poisson respire avec ses branchies."),
        Q("Quel animal est le plus rapide à la course sur terre ?", ['🐆|Le guépard', '🐘|L\'éléphant', '🐢|La tortue'], "Le guépard est l'animal terrestre le plus rapide.")] } },
  nature: { nom: 'La nature', icone: '🌿', guide: 'yacine', decor: 'jardin', ciel: '#bfe6d6', sol: '#8fc27a', brume: '#d3efdf',
    intro: "Bienvenue dans mon jardin ! Je suis Yacine, le jardinier. J'aime tout ce qui pousse. Voyons ce que tu sais sur la nature.",
    questions: {
      facile: [
        Q("De quoi une plante a-t-elle besoin pour grandir ?", ['💧|D\'eau et de lumière', '🍬|De bonbons', '🧸|De jouets'], "Une plante a besoin d'eau et de lumière pour grandir."),
        Q("Quelle étoile nous éclaire pendant la journée ?", ['☀️|Le Soleil', '🌙|La Lune', '⭐|Une étoile filante'], "Le Soleil est l'étoile qui nous éclaire pendant la journée."),
        Q("Quel arbre donne des dattes ?", ['🌴|Le palmier-dattier', '🍎|Le pommier', '🍊|L\'oranger'], "Les dattes poussent sur le palmier-dattier."),
        Q("Que voit-on dans le ciel quand la nuit tombe ?", ['🌙|La Lune et les étoiles', '🌈|Un arc-en-ciel', '☀️|Le Soleil'], "La nuit, on voit la Lune et les étoiles.")],
      moyen: [
        Q("Combien y a-t-il de saisons dans une année ?", ['4️⃣|Quatre', '2️⃣|Deux', '6️⃣|Six'], "Il y a quatre saisons : le printemps, l'été, l'automne et l'hiver."),
        Q("Qu'est-ce qui tourne autour de la Terre ?", ['🌙|La Lune', '☀️|Le Soleil', '☁️|Un nuage'], "La Lune tourne autour de la Terre."),
        Q("Que boivent les racines d'un arbre ?", ['💧|L\'eau du sol', '🥛|Du lait', '🧃|Du jus de fruit'], "Les racines puisent l'eau dans le sol."),
        Q("Quand il pleut et qu'il y a du soleil, on peut voir…", ['🌈|Un arc-en-ciel', '❄️|De la neige', '🌪️|Une tornade'], "Quand le soleil brille pendant la pluie, un arc-en-ciel peut apparaître.")],
      avance: [
        Q("À quelle température l'eau se transforme-t-elle en glace ?", ['🧊|0 degré', '🔥|100 degrés', '🌡️|10 degrés'], "L'eau gèle à 0 degré."),
        Q("Pourquoi y a-t-il le jour et la nuit ?", ['🌍|La Terre tourne sur elle-même', '☀️|Le Soleil se cache', '🌙|La Lune pousse le Soleil'], "La Terre tourne sur elle-même : quand elle nous tourne le dos au Soleil, c'est la nuit."),
        Q("Quel gaz, que nous respirons, les plantes produisent-elles ?", ['🌿|L\'oxygène', '💨|La fumée', '🏜️|Le sable'], "Les plantes produisent de l'oxygène, qui nous aide à respirer."),
        Q("Qu'est-ce qu'une oasis ?", ['🌴|Un endroit du désert avec de l\'eau', '🏔️|Une haute montagne', '🌊|Un océan'], "Une oasis est un endroit du désert où il y a de l'eau, donc des plantes et des animaux.")] } },
  vocabulaire: { nom: 'Les mots', icone: '🔤', guide: 'salma', decor: 'maison', ciel: '#f2e4c8', sol: '#d9bd8a', brume: '#efe0c0',
    intro: "Bonjour mon grand ! Je m'appelle Salma. Chez moi, on parle français et arabe. Voyons si tu connais ces mots !",
    questions: {
      facile: [
        Q("Comment dit-on « eau » en arabe ? Le mot se dit « maa ».", ['💧|ماء', '📖|كتاب', '🌙|قمر'], "Le mot « ماء », qui se dit « maa », veut dire eau."),
        Q("Que veut dire le mot arabe « kitab » (كتاب) ?", ['📖|Livre', '🌙|Lune', '🍎|Pomme'], "« Kitab » veut dire livre."),
        Q("Quel mot arabe veut dire « lune » ? Il se dit « qamar ».", ['🌙|قمر', '💧|ماء', '📖|كتاب'], "Le mot « قمر », qui se dit « qamar », veut dire lune."),
        Q("Que veut dire « shukran » (شكرا) ?", ['🙏|Merci', '👋|Au revoir', '😴|Dormir'], "« Shukran » veut dire merci.")],
      moyen: [
        Q("« Salam » (سلام) veut dire…", ['🕊️|Paix', '🍞|Pain', '🚪|Porte'], "« Salam » veut dire paix. On l'utilise aussi pour saluer."),
        Q("Quel mot arabe veut dire « pain » ? Il se dit « khobz ».", ['🍞|خبز', '🌴|تمر', '🍇|عنب'], "Le mot « خبز », qui se dit « khobz », veut dire pain."),
        Q("Le mot arabe « tamr » (تمر) désigne…", ['🌴|Des dattes', '🍎|Des pommes', '🍇|Du raisin'], "« Tamr » désigne les dattes."),
        Q("Le mot arabe « bayt » (بيت) veut dire…", ['🏠|Maison', '🌳|Arbre', '🐟|Poisson'], "« Bayt » veut dire maison.")],
      avance: [
        Q("Dans quel sens lit-on et écrit-on l'arabe ?", ['⬅️|De droite à gauche', '➡️|De gauche à droite', '⬇️|De haut en bas'], "L'arabe s'écrit et se lit de droite à gauche."),
        Q("Combien de lettres compte l'alphabet arabe ?", ['🔤|28', '🔤|26', '🔤|32', '🔤|22'], "L'alphabet arabe compte 28 lettres."),
        Q("Le mot français « algèbre » vient d'un mot…", ['📐|Arabe', '🇯🇵|Japonais', '🏛️|Grec ancien'], "Le mot « algèbre » vient du mot arabe « al-jabr »."),
        Q("Que veut dire « qalam » (قلم) ?", ['✒️|Plume, stylo', '🌙|Lune', '🧺|Panier'], "« Qalam » veut dire plume ou stylo.")] } },
  geographie: { nom: 'Géographie', icone: '🗺️', guide: 'idriss', decor: 'desert', ciel: '#f6d9a0', sol: '#e6c88a', brume: '#f3dfb5',
    intro: "Salut, explorateur ! Je suis Idriss. J'ai voyagé dans de nombreux pays. Voyons ce que tu sais sur le monde !",
    questions: {
      facile: [
        Q("Dans quel pays se trouve la ville de La Mecque ?", ['🇸🇦|En Arabie saoudite', '🇫🇷|En France', '🇯🇵|Au Japon'], "La Mecque se trouve en Arabie saoudite.", { religieux: true }),
        Q("Le Sahara est…", ['🏜️|Un très grand désert', '🌊|Un océan', '🌲|Une forêt'], "Le Sahara est un très grand désert, en Afrique."),
        Q("Où trouve-t-on beaucoup d'eau salée ?", ['🌊|Dans la mer', '🏞️|Dans un ruisseau', '🥛|Dans un verre de lait'], "L'eau de la mer est salée."),
        Q("Que voit-on souvent au sommet des très hautes montagnes ?", ['❄️|De la neige', '🌴|Des palmiers', '🏖️|Du sable chaud'], "Au sommet des très hautes montagnes, il fait froid et il y a de la neige.")],
      moyen: [
        Q("Quel grand fleuve traverse l'Égypte ?", ['🌊|Le Nil', '🌊|La Seine', '🌊|Le Rhône'], "Le Nil est le grand fleuve qui traverse l'Égypte."),
        Q("Quelle est la capitale de la France ?", ['🗼|Paris', '🏙️|Marseille', '🏙️|Lyon'], "Paris est la capitale de la France."),
        Q("Sur quel continent se trouve le Maroc ?", ['🌍|L\'Afrique', '🌎|L\'Amérique', '🌏|L\'Océanie'], "Le Maroc se trouve en Afrique."),
        Q("Comment s'appelle la plus haute montagne du monde ?", ['🏔️|L\'Everest', '⛰️|Le Mont Blanc', '🌋|Le Kilimandjaro'], "L'Everest est la plus haute montagne du monde.")],
      avance: [
        Q("Quel est le plus grand désert chaud du monde ?", ['🏜️|Le Sahara', '🏜️|Le Gobi', '🏜️|Le Kalahari'], "Le Sahara est le plus grand désert chaud du monde."),
        Q("Quelle est la capitale de l'Égypte ?", ['🏙️|Le Caire', '🏙️|Alexandrie', '🏙️|Louxor'], "Le Caire est la capitale de l'Égypte."),
        Q("Quelle mer se trouve entre l'Afrique et la péninsule arabique ?", ['🌊|La mer Rouge', '🌊|La mer Noire', '🌊|La mer Baltique'], "La mer Rouge sépare l'Afrique de la péninsule arabique."),
        Q("Quel océan borde l'ouest du Maroc ?", ['🌊|L\'océan Atlantique', '🌊|L\'océan Indien', '🌊|L\'océan Pacifique'], "L'océan Atlantique borde l'ouest du Maroc.")] } },
  connaissances: { nom: 'Pour les curieux', icone: '💡', guide: 'karim', decor: 'marche', ciel: '#f6d9a0', sol: '#e0b878', brume: '#f3dfb5',
    intro: "Hé, bonjour ! Karim, le marchand ! Au marché, on compte vite et on réfléchit bien. Prêt pour mes petites questions ?",
    questions: {
      facile: [
        Q("Combien de jours y a-t-il dans une semaine ?", ['7️⃣|Sept', '5️⃣|Cinq', '🔟|Dix'], "Il y a sept jours dans une semaine."),
        Q("Quelle forme a un ballon ?", ['⚽|Ronde, comme une boule', '🟦|Carrée', '🔺|En triangle'], "Un ballon a la forme d'une boule."),
        Q("Combien de côtés a un triangle ?", ['3️⃣|Trois', '4️⃣|Quatre', '5️⃣|Cinq'], "Un triangle a trois côtés."),
        Q("De quelle couleur est une banane mûre ?", ['🍌|Jaune', '🟦|Bleue', '🟪|Violette'], "Une banane mûre est jaune.")],
      moyen: [
        Q("Combien y a-t-il de mois dans une année ?", ['1️⃣2️⃣|Douze', '🔟|Dix', '8️⃣|Huit'], "Il y a douze mois dans une année."),
        Q("Combien de minutes y a-t-il dans une heure ?", ['🕐|Soixante', '🕐|Trente', '🕐|Cent'], "Une heure dure soixante minutes."),
        Q("Quel outil sert à mesurer une longueur ?", ['📏|Une règle', '🍴|Une fourchette', '⚽|Un ballon'], "On mesure une longueur avec une règle."),
        Q("Combien font cinq plus quatre ?", ['9️⃣|Neuf', '8️⃣|Huit', '🔟|Dix'], "Cinq plus quatre font neuf.")],
      avance: [
        Q("Combien de jours y a-t-il dans une année ordinaire ?", ['📅|365', '📅|360', '📅|355', '📅|400'], "Une année ordinaire compte trois cent soixante-cinq jours."),
        Q("Combien font six fois sept ?", ['✖️|42', '✖️|36', '✖️|48', '✖️|49'], "Six fois sept font quarante-deux."),
        Q("Quelle est la moitié de cinquante ?", ['➗|25', '➗|20', '➗|30'], "La moitié de cinquante est vingt-cinq."),
        Q("Combien de côtés a un hexagone ?", ['⬡|Six', '⬡|Cinq', '⬡|Huit'], "Un hexagone a six côtés.")] } },
  decouverte: { nom: 'Découverte du monde', icone: '🧭', guide: 'idriss', decor: 'montagne', ciel: '#c8dcf0', sol: '#b8a47e', brume: '#d8e6f4',
    intro: "Courage, explorateur ! Je suis Idriss. Découvrons ensemble les métiers, les outils et la vie des voyageurs d'autrefois.",
    questions: {
      facile: [
        Q("Qui fabrique le pain ?", ['🥖|Le boulanger', '🩺|Le médecin', '🧑‍🌾|Le jardinier'], "C'est le boulanger qui fabrique le pain."),
        Q("Qui soigne les malades ?", ['🩺|Le médecin', '🥖|Le boulanger', '🧑‍🎨|Le peintre'], "Le médecin soigne les malades."),
        Q("À quoi sert une lanterne ?", ['🏮|À éclairer', '🍽️|À manger', '🛏️|À dormir'], "Une lanterne sert à éclairer dans le noir."),
        Q("Que met-on aux pieds pour marcher dehors ?", ['👟|Des chaussures', '🧤|Des gants', '🎩|Un chapeau'], "On met des chaussures pour marcher dehors.")],
      moyen: [
        Q("Que fait un puisatier ?", ['⛏️|Il creuse des puits pour trouver de l\'eau', '🥖|Il fabrique du pain', '🧵|Il coud des habits'], "Un puisatier creuse des puits pour trouver de l'eau."),
        Q("À quoi sert une boussole ?", ['🧭|À trouver les directions', '🕐|À donner l\'heure', '⚖️|À peser'], "Une boussole montre le nord et aide à trouver sa direction."),
        Q("Que fabrique un potier ?", ['🏺|Des poteries en argile', '🧶|Des pulls', '🥖|Du pain'], "Un potier fabrique des poteries avec de l'argile."),
        Q("Au marché, on peut…", ['🛒|Acheter et vendre', '🏊|Nager', '🛌|Dormir'], "Au marché, on achète et on vend toutes sortes de choses.")],
      avance: [
        Q("Que fait un caravanier ?", ['🐪|Il conduit une caravane à travers le désert', '🧑‍🌾|Il cultive un jardin', '🍞|Il pétrit du pain'], "Un caravanier conduit une caravane de marchandises à travers le désert."),
        Q("Comment appelle-t-on la personne qui tisse des tapis ?", ['🧶|Un tisserand', '🥖|Un boulanger', '🔨|Un forgeron'], "Un tisserand tisse des tapis et des étoffes."),
        Q("Quel instrument aidait les voyageurs à se repérer grâce aux étoiles ?", ['🔭|L\'astrolabe', '⏳|Le sablier', '⚖️|La balance'], "L'astrolabe aidait à se repérer grâce aux astres."),
        Q("Pourquoi les voyageurs du désert se couvrent-ils la tête avec un tissu ?", ['🧣|Pour se protéger du soleil et du sable', '🎭|Pour faire une fête', '🌧️|Pour la pluie'], "Un tissu sur la tête protège du soleil et du sable.")] } }
};
export const ORDRE_CATEGORIES = Object.keys(CATEGORIES);
export const id = (c, n, i) => `${c}.${n[0]}${i + 1}`;     // ex. culture.f1 (f = facile, m = moyen, a = avance)

export const PHRASES = {
  bienvenue: { role: 'narratrice', texte: "Bienvenue aux Quiz et défis de Nour ! Choisis un thème et réponds aux questions. Tu peux toujours réessayer." },
  age: { role: 'narratrice', texte: 'Quel âge as-tu ? Choisis ton groupe, pour que les questions soient à ta taille.' },
  bravo: { role: 'narrateur', texte: 'Bravo, bonne réponse !' }, bravo2: { role: 'narrateur', texte: "C'est exact, bien joué !" }, bravo3: { role: 'narrateur', texte: 'Excellent, tu connais bien !' },
  erreur: { role: 'loumi', texte: "Pas tout à fait. Écoute l'explication, puis tu pourras réessayer." }, erreur2: { role: 'loumi', texte: "Ce n'est pas grave, on apprend en essayant ! Écoute bien." },
  aide: { role: 'loumi', texte: "Je t'aide : j'enlève une mauvaise réponse." },
  fin3: { role: 'narrateur', texte: 'Quel champion ! Tu as tout trouvé du premier coup. Une nouvelle étoile brille pour toi !' },
  fin2: { role: 'narrateur', texte: "Très bien ! Tu as appris plein de choses. Une belle étoile pour toi !" },
  fin1: { role: 'narrateur', texte: "Bravo d'avoir été jusqu'au bout ! Tu en sais un peu plus qu'avant. On recommence quand tu veux." },
  fin_savant: { role: 'narratrice', texte: "Félicitations ! Tu as exploré tous les thèmes. Tu as gagné le diplôme de savant des Lanternes !" },
  fin_maitre: { role: 'narratrice', texte: "Incroyable ! Tu as réussi tous les thèmes au plus haut niveau. Tu es un maître du quiz !" }
};
export const BRAVOS = ['bravo', 'bravo2', 'bravo3']; export const ERREURS = ['erreur', 'erreur2'];
export function inventaire() {
  const L = []; const add = (id, role, texte, extra = {}) => L.push({ id, role, langue: 'fr', texte, ...extra });
  for (const [k, p] of Object.entries(PHRASES)) add(k, p.role, p.texte);
  for (const [c, d] of Object.entries(CATEGORIES)) { add(`intro.${c}`, GUIDES[d.guide].voix, d.intro, { categorie: c });
    for (const n of NIVEAUX) d.questions[n].forEach((q, i) => { add(`q.${id(c, n, i)}`, 'narrateur', q.q, { categorie: c }); add(`exp.${id(c, n, i)}`, 'loumi', q.exp, { categorie: c }); }); }
  return L;
}
