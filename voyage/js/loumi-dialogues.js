// Les dialogues de LOUMI, la petite lanterne du village. Ils n'appartiennent qu'à elle :
//  - aucun texte, aucune mémoire et aucun état partagés avec Nour, les missions ou le carnet (un test le vérifie) ;
//  - elle ne parle que si l'enfant s'approche et choisit de lui parler ; la conversation se ferme dès qu'il s'éloigne ;
//  - phrases courtes, mots simples, pensées pour des enfants de 3 à 10 ans ; aucun mot arabe ni religieux ;
//  - TEXTE SEULEMENT : aucune voix n'est générée ici (les voix se feront plus tard, sur validation).
// Un « nœud » = { texte, choix: [{ txt, vers }] } ; « vers » = le nœud suivant, sans « vers » = au revoir.

const FIN = { txt: 'Au revoir, Loumi !' };

export const NOEUDS = {
  accueil: {
    texte: "Bonjour ! Moi, c'est Loumi, la petite lanterne du village. Je reste ici et je fais briller la place. Tu veux que je t'explique quelque chose ?",
    choix: [{ txt: '🎮 Comment on joue ?', vers: 'jouer' }, { txt: '🏘️ Que faire au village ?', vers: 'village' }, { txt: '🐪 Et les montures ?', vers: 'montures' }, FIN]
  },
  retour: {
    texte: 'Te revoilà ! Ça me fait plaisir. Je peux t\'aider ?',
    choix: [{ txt: '🎮 Comment on joue ?', vers: 'jouer' }, { txt: '🏘️ Que faire au village ?', vers: 'village' }, { txt: '🐪 Et les montures ?', vers: 'montures' }, FIN]
  },
  jouer: {
    texte: (c) => c.tactile
      ? "Pour marcher, pousse le rond doré avec ton doigt. Pour courir, garde le bouton du vent appuyé. Quand un bouton apparaît près d'un endroit, appuie dessus : c'est pour toi !"
      : "Pour marcher, utilise les flèches du clavier. Pour courir, garde la touche de course appuyée. Quand un bouton apparaît près d'un endroit, appuie dessus : c'est pour toi !",
    choix: [{ txt: '🏘️ Que faire au village ?', vers: 'village' }, { txt: '↩️ Autre chose', vers: 'retour' }, FIN]
  },
  village: {
    texte: "Au village, il y a le souk pour acheter de jolies choses, l'écurie pour les montures, et la fontaine avec le panier de Nour. Promène-toi : tu vas découvrir plein de surprises !",
    choix: [{ txt: '🐪 Et les montures ?', vers: 'montures' }, { txt: '↩️ Autre chose', vers: 'retour' }, FIN]
  },
  montures: {
    texte: "Les montures vivent à l'écurie, avec Nabil, leur gardien. Elles aiment boire, manger, se reposer et recevoir des câlins. Prends bien soin de ta monture : elle sera ton amie !",
    choix: [{ txt: '💧 Prendre soin de ma monture', vers: 'soins' }, { txt: '🎒 Avant de partir en voyage', vers: 'avant' }, { txt: '🏘️ Que faire au village ?', vers: 'village' }, { txt: '↩️ Autre chose', vers: 'retour' }, FIN]
  },
  // ---- Les explications de Loumi : courtes, simples, vraies ; l'enfant choisit ce qu'il veut savoir ----
  soins: {
    texte: "Ta monture a besoin de quatre choses : de l'eau, de quoi manger, du repos et de la tendresse. Qu'est-ce que tu veux savoir ?",
    choix: [{ txt: '💧 Pourquoi boire ?', vers: 'eau' }, { txt: '🌾 Pourquoi manger ?', vers: 'foin' }, { txt: '🌙 Pourquoi se reposer ?', vers: 'repos' }, { txt: '💛 Et les câlins ?', vers: 'calin' }, { txt: '↩️ Autre chose', vers: 'retour' }]
  },
  eau: {
    texte: "L'eau donne de la force à tout le corps. Dans le désert, il fait chaud : une monture qui a soif fatigue vite. Un dromadaire peut boire énormément d'un seul coup, à l'abreuvoir !",
    choix: [{ txt: '🌾 Pourquoi manger ?', vers: 'foin' }, { txt: '🎒 Avant de partir en voyage', vers: 'avant' }, { txt: '↩️ Autre chose', vers: 'retour' }, FIN]
  },
  foin: {
    texte: "Les montures mangent de l'herbe, du foin et des feuilles. Ça leur donne de l'énergie pour marcher longtemps. La bosse d'un dromadaire est une réserve de graisse : elle l'aide quand il y a peu à manger.",
    choix: [{ txt: '🌙 Pourquoi se reposer ?', vers: 'repos' }, { txt: '🎒 Avant de partir en voyage', vers: 'avant' }, { txt: '↩️ Autre chose', vers: 'retour' }, FIN]
  },
  repos: {
    texte: "Comme toi, ta monture a besoin de dormir et de se reposer pour retrouver ses forces. Sur la paille, à l'abri, elle récupère. Une monture bien reposée marche d'un meilleur pas !",
    choix: [{ txt: '💛 Et les câlins ?', vers: 'calin' }, { txt: '🎒 Avant de partir en voyage', vers: 'avant' }, { txt: '↩️ Autre chose', vers: 'retour' }, FIN]
  },
  calin: {
    texte: "Les animaux sentent quand on les aime. Une caresse douce, des paroles gentilles : ça les rassure et ils te font confiance. Une monture heureuse est une monture qui te suit avec joie.",
    choix: [{ txt: '💧 Pourquoi boire ?', vers: 'eau' }, { txt: '🎒 Avant de partir en voyage', vers: 'avant' }, { txt: '↩️ Autre chose', vers: 'retour' }, FIN]
  },
  avant: {
    texte: "Avant une grande exploration, vérifie ta monture : elle a bu, mangé et bien dormi ? Regarde ses petites jauges quand tu es près d'elle. Alors, en route : le voyage sera plus beau !",
    choix: [{ txt: '💧 Prendre soin de ma monture', vers: 'soins' }, { txt: '↩️ Autre chose', vers: 'retour' }, FIN]
  }
};

// Le nœud à afficher (le texte peut dépendre de l'appareil)
export function noeud(id, contexte = {}) {
  const n = NOEUDS[id]; if (!n) return null;
  return { id, texte: typeof n.texte === 'function' ? n.texte(contexte) : n.texte, choix: n.choix };
}
// Où commence la conversation : la première fois, l'accueil ; ensuite, le retour
export const depart = memoire => (memoire && memoire.rencontre ? 'retour' : 'accueil');
