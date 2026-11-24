// Les activités des métiers de la cité (pur, sans Three.js) : le potier et le marchand de dattes t'apprennent leur métier en trois questions douces.
// Aucun chronomètre, aucun score, aucune punition : une réponse qui n'est pas la bonne reçoit une explication, puis on réessaie.
// Contenu entièrement fictif et neutre (aucun récit religieux ni historique) ; chaque texte a sa voix Nour (voir outils/voix/route/inventaire-route.mjs).
export const ACTIVITES_METIERS = {
  potier: { icone: '🏺', titre: 'Le métier de potier', voix: 'perso-yacine', recompense: 40,
    intro: { petit: `Je suis potier. Veux-tu apprendre à faire une jarre ?`, grand: `Je suis potier : je fabrique des jarres avec de l'argile. Veux-tu apprendre mon métier ? Réponds à mes trois questions, sans te presser.` },
    fin: { petit: `Bravo, tu sais faire une jarre !`, grand: `Bravo, tu connais maintenant le métier de potier. Une bonne jarre garde l'eau fraîche pendant tout le voyage.` },
    questions: [
      { petit: { question: `Pour faire une jarre, on commence par quoi ?`, choix: [`L'argile mouillée`, `Le feu`], bonne: 0, ok: `Oui ! L'argile mouillée se modèle très bien.`, ko: `Pas encore : le feu vient à la fin. D'abord, on mouille l'argile.` },
        grand: { question: `Pour faire une jarre, par quoi commence-t-on ?`, choix: [`On mélange l'argile avec de l'eau`, `On fait cuire la jarre`, `On remplit la jarre d'eau`], bonne: 0, ok: `Exactement ! L'argile mouillée devient une pâte douce, que l'on peut modeler avec les mains.`, ko: `Pas encore : on ne peut pas cuire une jarre qui n'existe pas. D'abord, on prépare l'argile avec de l'eau.` } },
      { petit: { question: `Quand la jarre est modelée, où la laisse-t-on sécher ?`, choix: [`À l'ombre`, `Dans l'eau`], bonne: 0, ok: `Oui ! À l'ombre, elle sèche doucement.`, ko: `Pas tout à fait : dans l'eau, elle redeviendrait molle. On la laisse sécher à l'ombre.` },
        grand: { question: `Quand la jarre est modelée, que faut-il faire avant de la cuire ?`, choix: [`La laisser sécher doucement à l'ombre`, `La plonger dans l'eau`, `La poser en plein soleil de midi`], bonne: 0, ok: `Oui ! Si elle sèche trop vite, elle se fendille. L'ombre la fait sécher doucement.`, ko: `Pas tout à fait : trop d'eau ou trop de soleil la fendillerait. Il faut la laisser sécher doucement à l'ombre.` } },
      { petit: { question: `Pourquoi les voyageurs aiment-ils les jarres ?`, choix: [`Elles gardent l'eau fraîche`, `Elles brillent beaucoup`], bonne: 0, ok: `Oui ! Dans une jarre, l'eau reste fraîche.`, ko: `Pas tout à fait : ce qui compte, c'est que l'eau reste fraîche dans la jarre.` },
        grand: { question: `Pourquoi les voyageurs aiment-ils tant les jarres en argile ?`, choix: [`Elles gardent l'eau fraîche`, `Elles sont très légères et brillantes`, `Elles ne se cassent jamais`], bonne: 0, ok: `Oui ! L'argile laisse passer un peu d'eau, qui s'évapore : cela rafraîchit l'eau qui reste dans la jarre.`, ko: `Pas tout à fait : une jarre est lourde et elle peut se casser. Mais l'argile garde l'eau fraîche, et c'est le plus précieux.` } }
    ] },
  'marchand-dattes': { icone: '🌴', titre: 'Le métier de marchand', voix: 'perso-karim', recompense: 40,
    intro: { petit: `Je vends des dattes. Veux-tu apprendre mon métier ?`, grand: `Je suis marchand de dattes. Au marché, on apprend à échanger et à voyager ensemble. Veux-tu apprendre mon métier ? Réponds à mes trois questions.` },
    fin: { petit: `Bravo, tu connais le métier de marchand !`, grand: `Bravo, tu connais maintenant le métier de marchand : bien choisir, échanger honnêtement et voyager ensemble.` },
    questions: [
      { petit: { question: `Un voyageur part dans le désert. Que lui conseilles-tu d'emporter ?`, choix: [`Des dattes et de l'eau`, `Un gros coffre`], bonne: 0, ok: `Oui ! Les dattes et l'eau sont parfaites pour la route.`, ko: `Pas tout à fait : un gros coffre est lourd. Les dattes et l'eau sont plus utiles.` },
        grand: { question: `Un voyageur part pour une longue route dans le désert. Que lui conseilles-tu d'emporter ?`, choix: [`Des dattes et une gourde d'eau`, `Un gros coffre en bois`, `Un lourd tapis`], bonne: 0, ok: `Bien vu ! Les dattes se gardent longtemps et donnent de l'énergie, et l'eau est la chose la plus précieuse du désert.`, ko: `Pas tout à fait : le coffre et le tapis sont lourds à porter. Des dattes et une gourde d'eau sont bien plus utiles.` } },
      { petit: { question: `Au marché, on peut échanger des dattes contre quoi ?`, choix: [`Un beau tissu`, `Un nuage`], bonne: 0, ok: `Oui ! Le tissu et les dattes s'échangent bien.`, ko: `Pas tout à fait : un nuage ne s'échange pas ! Un beau tissu, oui.` },
        grand: { question: `Au marché, on échange parfois sans pièces : on troque. Que peut-on échanger contre un sac de dattes ?`, choix: [`Un beau tissu`, `Un nuage`, `Une ombre`], bonne: 0, ok: `Oui ! Chacun a ce qui manque à l'autre : en échangeant, tout le monde est content.`, ko: `Pas tout à fait : on ne peut pas échanger un nuage ni une ombre. Un beau tissu, par contre, oui.` } },
      { petit: { question: `Pourquoi les marchands voyagent-ils ensemble ?`, choix: [`Pour s'entraider`, `Pour faire du bruit`], bonne: 0, ok: `Oui ! Ensemble, on s'entraide.`, ko: `Pas tout à fait : on voyage ensemble pour s'entraider.` },
        grand: { question: `Pourquoi les marchands voyagent-ils en caravane, tous ensemble ?`, choix: [`Pour s'entraider et partager l'eau`, `Pour aller plus vite`, `Pour faire du bruit`], bonne: 0, ok: `Oui ! Ensemble, on se protège, on partage l'eau et les provisions, et le chemin paraît moins long.`, ko: `Pas tout à fait : une caravane ne va pas plus vite, mais on s'y entraide et on y partage l'eau et les provisions.` } }
    ] }
};

// les questions d'un métier, pour l'âge de l'enfant ('3-5' ou '6-10')
export const questionsMetier = (id, age) => ACTIVITES_METIERS[id].questions.map(q => age === '3-5' ? q.petit : q.grand);
