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
    ] },
  tisserande: { icone: '🧵', titre: 'Le métier de tisserande', voix: 'perso-warda', recompense: 40,
    intro: { petit: `Je suis tisserande. Veux-tu apprendre à tisser ?`, grand: `Je suis tisserande : je transforme la laine en tissu. Veux-tu apprendre mon métier ? Réponds à mes trois questions, sans te presser.` },
    fin: { petit: `Bravo, tu sais comment on tisse !`, grand: `Bravo, tu connais maintenant le métier de tisserande. Avec de la patience, des fils deviennent un beau tissu.` },
    questions: [
      { petit: { question: `D'où vient la laine ?`, choix: [`Du mouton`, `D'une pierre`], bonne: 0, ok: `Oui ! La laine vient du mouton.`, ko: `Pas tout à fait : la laine vient du mouton.` },
        grand: { question: `D'où vient la laine ?`, choix: [`Du mouton`, `D'un nuage`, `D'une pierre`], bonne: 0, ok: `Oui ! On coupe la laine du mouton, puis on la lave et on la file.`, ko: `Pas tout à fait : un nuage ou une pierre n'ont pas de laine. La laine vient du mouton.` } },
      { petit: { question: `Avant de tisser, on fait des quoi ?`, choix: [`Des fils`, `Des gâteaux`], bonne: 0, ok: `Oui ! On file la laine pour faire des fils.`, ko: `Pas tout à fait : on fait d'abord des fils.` },
        grand: { question: `Que fait-on avant de tisser ?`, choix: [`On file la laine pour faire des fils`, `On mange la laine`, `On met la laine au four`], bonne: 0, ok: `Oui ! En filant la laine, on tord les poils en un fil solide.`, ko: `Pas tout à fait : on ne mange pas la laine ! On la file d'abord pour faire des fils.` } },
      { petit: { question: `La nuit, que fait la laine ?`, choix: [`Elle garde chaud`, `Elle brille`], bonne: 0, ok: `Oui ! La laine garde chaud la nuit.`, ko: `Pas tout à fait : la laine garde chaud.` },
        grand: { question: `Pourquoi un manteau de laine est-il utile dans le désert ?`, choix: [`Il protège du froid de la nuit`, `Il brille dans le noir`, `Il fait du bruit`], bonne: 0, ok: `Oui ! La nuit, le désert est froid : la laine garde la chaleur.`, ko: `Pas tout à fait : la laine ne brille pas. Elle protège du froid de la nuit.` } }
    ] },
  'porteur-eau': { icone: '💧', titre: `Le métier de porteur d'eau`, voix: 'perso-samir', recompense: 40,
    intro: { petit: `Je porte l'eau dans la cité. Veux-tu apprendre mon métier ?`, grand: `Je suis porteur d'eau : je rapporte l'eau du puits à toutes les maisons. Veux-tu apprendre mon métier ? Réponds à mes trois questions.` },
    fin: { petit: `Bravo, tu sais bien porter l'eau !`, grand: `Bravo, tu connais le métier de porteur d'eau. L'eau est précieuse : on la porte, on la partage et on ne la gaspille pas.` },
    questions: [
      { petit: { question: `Pourquoi couvre-t-on l'eau ?`, choix: [`Pour la garder propre`, `Pour la cacher`], bonne: 0, ok: `Oui ! On la garde propre et fraîche.`, ko: `Pas tout à fait : on la garde propre.` },
        grand: { question: `Pourquoi couvre-t-on les jarres d'eau ?`, choix: [`Pour garder l'eau propre et fraîche`, `Pour la cacher`, `Pour qu'elle chante`], bonne: 0, ok: `Oui ! Un couvercle garde la poussière dehors et l'eau plus fraîche.`, ko: `Pas tout à fait : on la couvre pour la garder propre et fraîche.` } },
      { petit: { question: `L'eau, dans le désert, c'est…`, choix: [`Précieux`, `Inutile`], bonne: 0, ok: `Oui ! L'eau est précieuse.`, ko: `Pas tout à fait : l'eau est précieuse.` },
        grand: { question: `Que fait-on de l'eau qu'on ne boit pas tout de suite ?`, choix: [`On la garde dans une jarre`, `On la jette au sable`, `On la verse par terre`], bonne: 0, ok: `Oui ! L'eau est précieuse : on la garde pour plus tard.`, ko: `Pas tout à fait : on ne gaspille jamais l'eau. On la garde dans une jarre.` } },
      { petit: { question: `Pour porter l'eau, on équilibre avec…`, choix: [`Deux outres`, `Une pierre`], bonne: 0, ok: `Oui ! Deux outres, une de chaque côté.`, ko: `Pas tout à fait : deux outres, une de chaque côté.` },
        grand: { question: `Comment porte-t-on beaucoup d'eau sans se fatiguer ?`, choix: [`Avec deux outres, une de chaque côté`, `Avec une seule grosse jarre sur la tête`, `En courant très vite`], bonne: 0, ok: `Oui ! Deux charges égales de chaque côté gardent l'équilibre.`, ko: `Pas tout à fait : il faut deux charges égales, une de chaque côté, pour garder l'équilibre.` } }
    ] },
  puisatier: { icone: '💧', titre: 'Le métier de puisatier', voix: 'perso-yacine', recompense: 40,
    intro: { petit: `Je creuse des puits. Veux-tu apprendre mon métier ?`, grand: `Je suis puisatier : je creuse des puits pour trouver l'eau. Veux-tu apprendre mon métier ? Réponds à mes trois questions, sans te presser.` },
    fin: { petit: `Bravo, tu sais comment on trouve l'eau !`, grand: `Bravo, tu connais maintenant le métier de puisatier. Un bon puits, bien entretenu, donne de l'eau à tout un hameau.` },
    questions: [
      { petit: { question: `On creuse un puits pour…`, choix: [`Trouver de l'eau`, `Cacher un trésor`], bonne: 0, ok: `Oui ! Un puits donne de l'eau.`, ko: `Pas tout à fait : on creuse un puits pour trouver de l'eau.` },
        grand: { question: `Pourquoi creuse-t-on un puits profond ?`, choix: [`Pour trouver de l'eau fraîche et propre`, `Pour cacher des trésors`, `Pour jouer`], bonne: 0, ok: `Oui ! Plus on creuse, plus l'eau est fraîche et propre, à l'abri du soleil.`, ko: `Pas tout à fait : un puits sert à trouver de l'eau fraîche et propre, tout en bas.` } },
      { petit: { question: `Pour remonter l'eau, on utilise…`, choix: [`Une corde`, `Un parapluie`], bonne: 0, ok: `Oui ! Une corde, avec un seau.`, ko: `Pas tout à fait : on utilise une corde et un seau.` },
        grand: { question: `Comment remonte-t-on le seau d'eau ?`, choix: [`Avec une corde et un treuil`, `En sautant dedans`, `Avec un parapluie`], bonne: 0, ok: `Oui ! Le treuil tourne et la corde remonte le seau, sans trop se fatiguer.`, ko: `Pas tout à fait : on tire le seau avec une corde, aidée d'un treuil.` } },
      { petit: { question: `Un puits propre, c'est…`, choix: [`Bon pour tous`, `Seulement joli`], bonne: 0, ok: `Oui ! Un puits propre est bon pour tous.`, ko: `Pas tout à fait : un puits propre est bon pour tous.` },
        grand: { question: `Pourquoi garde-t-on un puits propre ?`, choix: [`Pour que tout le monde puisse boire en bonne santé`, `Pour qu'il brille`, `Pour qu'il parle`], bonne: 0, ok: `Oui ! Une eau propre protège la santé de tout le hameau.`, ko: `Pas tout à fait : on garde le puits propre pour que tout le monde boive une eau saine.` } }
    ] }
};

// les questions d'un métier, pour l'âge de l'enfant ('3-5' ou '6-10')
export const questionsMetier = (id, age) => ACTIVITES_METIERS[id].questions.map(q => age === '3-5' ? q.petit : q.grand);
