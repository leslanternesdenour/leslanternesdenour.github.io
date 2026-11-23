// Les textes (non religieux) de la première tranche de La Route : lieux, animaux, personnages fictifs.
// « petit » : phrase courte pour les 3–5 ans. « grand » : un peu plus de détails pour les 6–10 ans. Les lieux sont imaginaires.
// Les contenus historiques et religieux sont ailleurs (contenu-a-valider.js).
export const TEXTES_LIEUX = {
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
  'cairn-fin': { petit: 'Le chemin continue… bientôt !', grand: 'Le grand cairn marque la fin de cette première étape. La route continue vers les montagnes : elle s\'ouvrira bientôt. Bravo, tu as traversé les plaines et les dunes !' }
};
export const texteLieu = (id, age) => { const t = TEXTES_LIEUX[id]; return t ? (age === '3-5' ? t.petit : t.grand) : ''; };

// Les personnages FICTIFS (aucun personnage historique ou religieux)
export const GUIDE = { nom: 'Rachid', titre: '🧭 Rachid, le guide des caravanes',
  intro: { petit: 'Bonjour ! Je suis Rachid. Je connais la grande route. Prépare ton sac, puis suis-moi !', grand: 'Bonjour, voyageur ! Je m\'appelle Rachid et je guide les caravanes. La grande route est très longue : elle traverse des plaines, des dunes, des oasis et des montagnes. Prépare ton sac, et en route !' },
  ferme: 'La grande route n\'est pas encore ouverte pour toi. Continue d\'explorer le village : ' };
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
  gourdePleine: 'Tu remplis ta gourde à l\'eau claire de l\'oasis. 💧',
  gourdeAbsente: 'L\'eau de l\'oasis est claire et fraîche. (Pense à emporter ta gourde la prochaine fois !)',
  chemin3: 'Les trois balises sont trouvées : tu as retrouvé le chemin de la grande route !'
};
