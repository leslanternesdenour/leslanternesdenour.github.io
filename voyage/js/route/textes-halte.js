// Les textes de la halte de repos (deux niveaux : petit = 3-5 ans, grand = 6-10 ans).
// Ton calme : la halte est un cadeau du chemin, jamais une obligation. Aucun texte religieux, aucun personnage historique, aucun fait inventé :
// seulement ce que l'on peut voir (tente en poils de chèvre, tapis de laine, jarres, outres, dattes, pain d'orge, palmiers) et du bon sens de voyageur.
// À faire relire avec les autres nouveaux textes (docs/CONTENUS-A-VALIDER.md).
export const TEXTES_HALTE = {
  arrivee: {
    petit: 'Une halte de caravaniers ! Une tente, de l\'ombre, de l\'eau et des dattes. Rien ne presse.',
    grand: 'Au milieu de la route, des caravaniers ont dressé une halte : une grande tente en poils de chèvre, des tapis de laine, des palmiers, de l\'eau et de quoi manger. On s\'y arrête quand on veut, sans se presser.'
  },
  indice: {
    petit: '⛺ Une halte de caravaniers : de l\'ombre et de l\'eau pour toi et ta monture.',
    grand: '⛺ Une halte de caravaniers : de l\'ombre, de l\'eau et des vivres pour toi et ta monture. Tu t\'y arrêtes quand tu veux.'
  },
  eau: {
    petit: 'Tu bois l\'eau fraîche de la jarre. Quelle bonne eau ! Tu reprends des forces.',
    grand: 'L\'eau de la jarre, gardée au frais à l\'ombre, te fait du bien. Dans le désert, on boit à petites gorgées, souvent, avant même d\'avoir très soif.'
  },
  gourde: {
    petit: 'Tu remplis aussi ta gourde : tu en auras besoin plus loin.',
    grand: 'Tu remplis aussi ta gourde à la jarre : l\'eau est précieuse dans le désert, mieux vaut en emporter pour la suite.'
  },
  vivres: {
    petit: 'Des dattes et du pain d\'orge ! Tu manges un peu, doucement.',
    grand: 'Des dattes bien douces et du pain d\'orge : de quoi reprendre des forces. Les caravaniers emportaient des dattes parce qu\'elles se gardent très longtemps.'
  },
  repos: {
    petit: 'Tu t\'assois sur un tapis, à l\'ombre de la tente. Tu respires doucement. Quand tu es prêt, tu reprends la route.',
    grand: 'À l\'ombre de la tente en poils de chèvre, assis sur un tapis de laine, tu te reposes un moment. Le vent est doux. Quand tu es prêt, la route t\'attend, à ton rythme.'
  },
  repriseRoute: {
    petit: 'Tu es bien reposé ! La route continue.',
    grand: 'Tu es reposé et prêt à repartir. La route continue, à ton rythme.'
  },
  sablo: {
    petit: 'Ta monture peut boire, manger et se reposer ici, quand tu veux.',
    grand: 'Ici, ta monture peut boire à l\'abreuvoir, manger et se reposer à l\'ombre de l\'abri de palmes. Tu t\'en occupes quand tu veux, sans te presser.'
  }
};
// Les étiquettes des boutons (courtes, lisibles par un enfant)
export const BOUTONS_HALTE = { eau: 'Boire', vivres: 'Manger', repos: 'Se reposer', gourde: 'Remplir ma gourde', reprendre: 'Reprendre la route', rester: 'Rester un peu' };
