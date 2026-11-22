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
    choix: [{ txt: '🏘️ Que faire au village ?', vers: 'village' }, { txt: '↩️ Autre chose', vers: 'retour' }, FIN]
  }
};

// Le nœud à afficher (le texte peut dépendre de l'appareil)
export function noeud(id, contexte = {}) {
  const n = NOEUDS[id]; if (!n) return null;
  return { id, texte: typeof n.texte === 'function' ? n.texte(contexte) : n.texte, choix: n.choix };
}
// Où commence la conversation : la première fois, l'accueil ; ensuite, le retour
export const depart = memoire => (memoire && memoire.rencontre ? 'retour' : 'accueil');
