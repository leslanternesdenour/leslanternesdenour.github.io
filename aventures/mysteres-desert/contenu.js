// LES MYSTÈRES DU DÉSERT — contenus : 7 chapitres, indices, énigmes, trésors, dialogues. SOURCE UNIQUE des textes
// (l'inventaire audio est généré à partir d'ici : node outils/voix/jeux/inventaire.mjs mysteres-desert).
// Les énigmes reposent sur l'OBSERVATION et la LOGIQUE (indices trouvés dans la scène) ; les « découvertes » sont des faits simples et sûrs (nature, vie quotidienne).
// Aucun contenu religieux, aucune représentation de personne sacrée, aucun objet moderne.
export const GUIDES = {
  idriss: { nom: 'Idriss', metier: "l'explorateur", voix: 'perso-idriss', tunique: '#c8664a', pantalon: '#4a3a2a', cheche: '#f4ead2', peau: '#a8724c' },
  samir: { nom: 'Samir', metier: 'le puisatier', voix: 'perso-samir', tunique: '#2f9aa8', pantalon: '#3a4f5a', cheche: '#f4ead2', peau: '#9a6a46' },
  hakim: { nom: 'Hakim', metier: 'le sage du village', voix: 'perso-hakim', tunique: '#8a6a3a', pantalon: '#4a3a2a', cheche: '#efe6cc', peau: '#a8724c', barbe: '#d8d0c0' },
  warda: { nom: 'Warda', metier: 'la gardienne de la bibliothèque', voix: 'perso-warda', tunique: '#3d4f9a', pantalon: '#2a2f4a', cheche: '#f0e8d0', peau: '#b98458', voile: '#d9d2f2' },
  yacine: { nom: 'Yacine', metier: 'le jardinier', voix: 'perso-yacine', tunique: '#4f9a4a', pantalon: '#5a4a2a', cheche: '#e9e2b8', peau: '#a8724c' }
};
export const NOMS_OBJETS = { lanterne: 'la lanterne', livre: 'le livre', datte: 'la datte', cruche: 'la cruche', tapis: 'le tapis', pomme: 'la pomme', pain: 'le pain', cle: 'la clé', panier: 'le panier', rose: 'la rose', etoile: "l'étoile", lune: 'la lune', tasse: 'la tasse', plume: 'la plume', raisin: 'le raisin', coussin: 'le coussin', poisson: 'le poisson', oiseau: "l'oiseau" };

// Chapitres dans l'ordre de l'histoire. decor = décor 3D ; indices = 4 objets à observer dans la scène ; enigme = { type, ... } ; tresor = découverte
export const CHAPITRES = {
  desert: { nom: 'Le grand désert', icone: '🏜️', guide: 'idriss', decor: 'desert', ciel: '#f6d9a0', sol: '#e6c88a', brume: '#f3dfb5',
    intro: "Bonjour explorateur ! La grande lanterne du désert s'est éteinte. Pour la rallumer, il faut retrouver sept lumières cachées. Commençons ici, dans le désert. Observe bien le paysage !",
    indices: [
      { objet: 'etoile', texte: "Une étoile ! Elle brille quand la nuit tombe." }, { objet: 'lune', texte: "La lune éclaire le sable pendant la nuit." },
      { objet: 'lanterne', texte: "Une lanterne : elle guide les voyageurs dans le noir." }, { objet: 'cruche', texte: "Une cruche d'eau. Dans le désert, l'eau est précieuse." }],
    enigme: { type: 'choisir', question: "Dans le désert, les voyageurs marchent souvent la nuit, quand il fait moins chaud. Qu'est-ce qui les aide à trouver leur chemin dans le ciel ?", bonne: 'etoile', autres: ['pain', 'poisson', 'rose', 'tapis'],
      pourquoi: "Regarde bien tes indices : l'étoile brille très haut dans le ciel, la nuit. C'est elle qui aide les voyageurs." },
    tresor: { objet: 'datte', nom: 'La datte du désert', fait: "Les dattes sont des fruits très nourrissants : les voyageurs en emportaient pour leurs longs trajets." } },
  oasis: { nom: "L'oasis", icone: '🌴', guide: 'samir', decor: 'oasis', ciel: '#a9e0f0', sol: '#e6cf8f', brume: '#cdeef5',
    intro: "Bravo ! Voici la première lumière. Maintenant, direction l'oasis ! Ici, il y a de l'eau au milieu du désert. Cherche les indices près des palmiers.",
    indices: [
      { objet: 'cruche', texte: "On puise l'eau avec une cruche." }, { objet: 'tasse', texte: "On verse l'eau dans une tasse pour boire." },
      { objet: 'datte', texte: "Les dattes poussent sur les palmiers de l'oasis." }, { objet: 'poisson', texte: "Un poisson ! L'eau est claire et propre ici." }],
    enigme: { type: 'ordre', question: "Remets les images dans l'ordre : d'abord on puise l'eau, ensuite on la verse pour boire, puis on mange un fruit, et enfin on se repose.", ordre: ['cruche', 'tasse', 'datte', 'coussin'],
      pourquoi: "On commence par puiser l'eau avec la cruche, puis on la verse dans la tasse. On mange ensuite une datte, et on se repose sur le coussin." },
    tresor: { objet: 'cruche', nom: "La cruche de l'oasis", fait: "Une oasis est un endroit du désert où il y a de l'eau. C'est pour cela que des palmiers et des animaux peuvent y vivre." } },
  village: { nom: 'Le village ancien', icone: '🏘️', guide: 'hakim', decor: 'village', ciel: '#f4cfa0', sol: '#d8b078', brume: '#f2d9b2',
    intro: "Bienvenue au village, jeune explorateur. Ici, chaque objet a sa place, et chaque objet a une ombre. Retrouve les indices, puis nous résoudrons le mystère ensemble.",
    indices: [
      { objet: 'cle', texte: "Une clé : elle ouvre une porte." }, { objet: 'pain', texte: "Du pain encore chaud : quelqu'un habite ici." },
      { objet: 'tasse', texte: "Une tasse encore tiède sur le rebord." }, { objet: 'coussin', texte: "Un coussin pour s'asseoir et discuter." }],
    enigme: { type: 'paires', question: "Associe chaque objet à son ombre. Touche un objet, puis touche son ombre.", paires: ['cle', 'pain', 'tasse', 'coussin'],
      pourquoi: "Regarde bien la forme de chaque ombre : elle ressemble toujours à l'objet. Compare les contours." },
    tresor: { objet: 'cle', nom: 'La clé du village', fait: "Dans un village, chacun a sa maison et on s'entraide entre voisins." } },
  bibliotheque: { nom: 'La bibliothèque', icone: '📚', guide: 'warda', decor: 'bibliotheque', ciel: '#d9cdf0', sol: '#c9ab7a', brume: '#e4daf5',
    intro: "Chut… Bonjour explorateur. Ici, on parle doucement : les livres dorment. Cherche les indices entre les étagères, puis je te poserai une devinette.",
    indices: [
      { objet: 'livre', texte: "Un livre : il contient des histoires." }, { objet: 'plume', texte: "Une plume pour écrire." },
      { objet: 'lanterne', texte: "Une lanterne pour lire le soir." }, { objet: 'etoile', texte: "Une étoile dessinée sur une page." }],
    enigme: { type: 'choisir', question: "Écoute la devinette. Je ne suis pas vivant, mais j'ai des pages. On m'ouvre pour apprendre et pour rêver. Qui suis-je ?", bonne: 'livre', autres: ['pomme', 'coussin', 'poisson', 'panier'],
      pourquoi: "Pense à ce que tu as trouvé sur les étagères : un objet avec des pages, qui raconte des histoires. C'est le livre." },
    tresor: { objet: 'livre', nom: 'Le livre de la bibliothèque', fait: "Autrefois, les livres étaient écrits à la main, avec une plume, une page après l'autre." } },
  ruines: { nom: 'Les ruines oubliées', icone: '🏛️', guide: 'idriss', decor: 'ruines', ciel: '#e9c8a0', sol: '#d3b98a', brume: '#ecd5b4',
    intro: "Voici les ruines oubliées : une cité imaginaire, d'un autre temps. Ses vieilles pierres gardent un secret. Observe les lumières qui s'allument, puis refais-les dans le même ordre.",
    indices: [
      { objet: 'tapis', texte: "Un vieux tapis, presque effacé par le sable." }, { objet: 'cle', texte: "Une clé rouillée, tombée près d'une colonne." },
      { objet: 'lune', texte: "Une lune gravée sur une pierre." }, { objet: 'lanterne', texte: "Une lanterne éteinte, posée sur une marche." }],
    enigme: { type: 'memoire', question: "Regarde bien les lumières qui s'allument. Puis refais la même suite, dans le même ordre.", symboles: ['lune', 'etoile', 'lanterne', 'cle', 'rose'], longueurs: [3, 4, 5],
      pourquoi: "Ce n'est pas grave. Regarde encore la suite, doucement, et touche les lumières dans le même ordre." },
    tresor: { objet: 'lune', nom: 'La lune des ruines', fait: "La lune change de forme au fil des nuits : parfois ronde, parfois en croissant." } },
  montagne: { nom: 'Le chemin de la montagne', icone: '⛰️', guide: 'idriss', decor: 'montagne', ciel: '#c8dcf0', sol: '#b8a47e', brume: '#d8e6f4',
    intro: "Courage, explorateur : le chemin de la montagne est long. Avant de monter, il faut bien se préparer. Cherche les indices laissés par les autres voyageurs.",
    indices: [
      { objet: 'oiseau', texte: "Un oiseau vole très haut au-dessus de la montagne." }, { objet: 'panier', texte: "Un panier : un voyageur est passé par ici." },
      { objet: 'pain', texte: "Des miettes de pain sur le chemin." }, { objet: 'cruche', texte: "Une cruche vide, abandonnée au bord du sentier." }],
    enigme: { type: 'ordre', question: "Prépare ton voyage dans l'ordre : on remplit d'abord la cruche d'eau, on met du pain dans le panier, on allume la lanterne, et enfin on se met en route.", ordre: ['cruche', 'pain', 'panier', 'lanterne'],
      pourquoi: "On prépare d'abord l'eau, puis la nourriture dans le panier, ensuite la lanterne pour y voir clair, et seulement après on part." },
    tresor: { objet: 'oiseau', nom: "L'oiseau de la montagne", fait: "Beaucoup d'oiseaux vivent dans les montagnes et volent très haut." } },
  jardins: { nom: 'Les jardins', icone: '🌷', guide: 'yacine', decor: 'jardin', ciel: '#bfe6d6', sol: '#8fc27a', brume: '#d3efdf',
    intro: "Bienvenue dans les jardins, dernier chapitre ! La grande lanterne a un verrou à trois cases. Les indices sont cachés parmi les fleurs. Cherche-les, puis nous ouvrirons le verrou.",
    indices: [
      { objet: 'rose', texte: "Une rose : elle est la première de la rangée." }, { objet: 'raisin', texte: "Une grappe de raisin : elle est juste après la rose." },
      { objet: 'pomme', texte: "Une pomme : elle est la dernière." }, { objet: 'oiseau', texte: "Un oiseau chante dans le jardin." }],
    enigme: { type: 'code', question: "Voici le verrou de la grande lanterne. Utilise tes indices : la rose est la première, le raisin vient juste après la rose, et la pomme est la dernière. Remets les trois images dans le bon ordre.", ordre: ['rose', 'raisin', 'pomme'], options: ['rose', 'raisin', 'pomme', 'oiseau'],
      pourquoi: "Relis tes indices : la rose d'abord, le raisin juste après, et la pomme en dernier." },
    tresor: { objet: 'lanterne', nom: 'La grande lanterne', fait: "Dans un jardin, les fleurs et les fruits ont besoin d'eau et de soins pour grandir. Bravo : la grande lanterne brille de nouveau !" } }
};
export const ORDRE_CHAPITRES = Object.keys(CHAPITRES);

export const PHRASES = {
  bienvenue: { role: 'narratrice', texte: "Bienvenue dans les Mystères du désert ! Pars à l'aventure, observe, cherche des indices et résous les énigmes." },
  age: { role: 'narratrice', texte: 'Quel âge as-tu ? Choisis ton groupe, pour que les mystères soient à ta taille.' },
  indice_ok: { role: 'narrateur', texte: 'Tu as trouvé un indice !' },
  indices_finis: { role: 'narrateur', texte: "Tu as tous les indices ! Voici l'énigme." },
  bravo: { role: 'narrateur', texte: 'Bravo, tu as bien réfléchi !' },
  bravo2: { role: 'narrateur', texte: "Magnifique, c'est la bonne réponse !" },
  passage: { role: 'narrateur', texte: 'Le passage secret est ouvert ! Une nouvelle découverte t\'attend.' },
  erreur: { role: 'loumi', texte: 'Ce n\'est pas tout à fait ça. Regarde bien les indices, tu peux réessayer.' },
  erreur2: { role: 'loumi', texte: "Pas encore, mais tu es sur la bonne piste. Prends ton temps !" },
  aide: { role: 'loumi', texte: 'Regarde, je te montre un petit indice !' },
  memoire_regarde: { role: 'narrateur', texte: "Regarde bien les lumières." },
  memoire_a_toi: { role: 'narrateur', texte: "À toi ! Refais la même suite." },
  fin_chapitre: { role: 'narrateur', texte: "Une nouvelle lumière brille ! Le prochain chapitre t'attend." },
  fin_diplome: { role: 'narratrice', texte: "Félicitations ! Tu as rallumé la grande lanterne. Tu as gagné le diplôme d'explorateur du désert !" },
  fin_maitre: { role: 'narratrice', texte: "Incroyable ! Tu as résolu tous les mystères au plus haut niveau. Tu es un maître explorateur !" }
};
export const BRAVOS = ['bravo', 'bravo2']; export const ERREURS = ['erreur', 'erreur2'];

// Inventaire audio : [{ id, role, langue, texte }] (rôles vocaux : narrateur / narratrice / loumi / perso-<guide>)
export function inventaire() {
  const L = []; const add = (id, role, texte, extra = {}) => L.push({ id, role, langue: 'fr', texte, ...extra });
  for (const [id, p] of Object.entries(PHRASES)) add(id, p.role, p.texte);
  for (const [c, d] of Object.entries(CHAPITRES)) {
    add(`intro.${c}`, GUIDES[d.guide].voix, d.intro, { chapitre: c });
    d.indices.forEach((x, i) => add(`indice.${c}.${i + 1}`, 'narrateur', x.texte, { chapitre: c }));
    add(`enigme.${c}`, 'narrateur', d.enigme.question, { chapitre: c }); add(`pourquoi.${c}`, 'loumi', d.enigme.pourquoi, { chapitre: c });
    add(`tresor.${c}`, 'narratrice', `${d.tresor.nom}. ${d.tresor.fait}`, { chapitre: c });
  }
  return L;
}
