# La Route vers La Mecque (رحلة إلى مكة) — architecture

Statut : **plan de la phase 1, aucun code de jeu écrit.** Branche `preproduction` uniquement. Tous les contenus religieux sont **« à valider »** par le créateur (voir §11).

## 1. Ce que le Grand Voyage fait aujourd'hui (inspection ciblée, 23/11/2026)

| Sujet | Constat | Conséquence pour la Route |
|---|---|---|
| Rendu | Three.js, un seul `Terrain` de 800 m (`terrain.js`, grille 200×200 selon le profil, couleurs/matières calculées par sommet avec `fbm`), `LIMITE = 360`, remparts de dunes aux bords. Zones de décor construites à la demande dans `decor.js` (`construireZone`, visibilité par distance). Profils `faible / equilibre / eleve` (`PROFILS` dans `main.js`) : ombres, `pixelRatio`, densité de décor, brume. | Un 2e `Terrain` de 5 à 6 km ne tient pas dans ce maillage. Il faut un terrain **par tuiles**, qui réutilise `fbm`, `lisse`, les matières et les profils. |
| Déplacements | `bouger(o, dx, dz, rayon)` (`main.js`) : pente max, colliders circulaires `{x,z,r}`, `LIMITE`, zones fermées. Marche 3,3 m/s, course 6,2, monture 5,5 à 11 m/s. | Même fonction, avec des colliders et une fonction de hauteur du monde actif. |
| Hauteur | `const H = (x,z) => terrain.hauteur(x,z)` capturé partout (aventure, quêtes, guide, effets, décor). | Passer par un « monde actif » : `H` lit `mondeActif.hauteur`. Les systèmes du village restent attachés au terrain du village. |
| Carte | `carte.js` : parchemin dessiné une fois depuis le terrain, échelle fixée sur `LIMITE`, lieux fournis par `lieuxCarte()`, guidage A* sur une grille 240×240 (`guide.js`). | La carte doit pouvoir afficher un **second parchemin** (la Route). Le guide A* ne sert pas pour 5 km : on guide par cap et points de passage. |
| Progression | `etat` dans le localStorage `monde_voyage` (inclus dans `CLES_JEU`, synchronisé par `compte/client.js`, sauf `joueur/chameau/monte/heure` qui restent locaux). `etat.aventure` (= `AV`) porte pièces, missions, objets, animaux, montures. Sauvegarde toutes les 3 s de la position. | Tout ce qui est nouveau va dans **`etat.route`**, un sous-objet. Aucune nouvelle clé : pas de changement à `CLES_JEU`, ni aux règles Firestore, ni au compte. Les anciennes sauvegardes restent valides (`Object.assign` avec valeurs par défaut). |
| Régions à débloquer | `regions.js` : « lieu voisin découvert + UNE activité au choix », une région ouverte le reste. `etat.colOuvert` (oasis + camp découverts, ou 12 étoiles). | La Route réutilise exactement ce modèle (`REGIONS.route`), pas de règle parallèle. |
| Récompenses | `bourse.recompense(id, n, raison, pos)` (idempotent par id), `succes.js` (`BADGES`, `COLLECTIONS`), `aventure.gagner`. Montures dans `montures.js` (`MONTURES`, adoption à l'écurie). | Aucune nouvelle monnaie. Nouveaux badges ajoutés à `BADGES`. Chameau débloquable = une entrée de `MONTURES` obtenue par mérite (voir §10, à confirmer). |
| Missions | `missions.js` (données/textes) + `aventure.js` (moteur) + `quetes.js` (mots, plantes, énigmes). Textes figés mot pour mot pour les voix (test golden). | Missions de la Route dans un module à part (`route/missions-route.js`), même forme de données, sans toucher au golden existant. |
| Carnet | `ouvrirCarnet(onglet)` : onglets Missions, Collections, Mots, Animaux, Lieux, Armoire, Montures. | Ajout d'un onglet **Itinéraire** (sections de la demande regroupées, voir §8). Aucun onglet retiré. |
| Voix | `voix-roles.json` : 10 voix « Nour » ; narratrice, narrateur (Salim), Loumi (Amina), Karim, Hakim, etc. Les phrases sont des fichiers audio pré-enregistrés repérés par leur texte. | Aucune voix nouvelle. Les phrases de la Route seront écrites, puis enregistrées avec les voix existantes **après** validation du créateur. En attendant : texte seul (pas de lien audio cassé). |
| Préproduction | `wrangler.toml` : `ENVIRONNEMENT = "preproduction"` côté serveur. Côté navigateur : pas de drapeau. Comptes en erreur 503 sur l'Aperçu Cloudflare. | Drapeau client `routeActive()` (voir §7). |

## 2. Principe : un second monde, un seul moteur

Un **monde actif** (`village` ou `route`) remplace les références directes au terrain/colliders dans la boucle :

```
mondeActif = { id, terrain: {hauteur, matiere}, colliders, limites, ciel/brume, maj(dt, pos) }
```

- Le village garde son code tel quel (monde `village`, inchangé).
- La Route est un module autonome `voyage/js/route/` chargé **à la demande** (`import()` dynamique au moment où l'enfant part ; zéro octet de plus pour qui ne l'ouvre pas).
- Dans le monde `route`, on suspend ce qui est propre au village (animaux, quêtes, habitants, enclos, marché, bourse locale reste active, Loumi suit). Un test vérifie que les 2 mondes ne se parlent que par `mondeActif`.
- **Le passage village → Route n'est pas une téléportation** : une vraie piste part du village, traverse le bord du pays de Nour, monte vers un col bas où le décor du village disparaît dans la poussière et la brume (déjà dans le jeu : `ciel.js`), puis le monde `route` prend le relais **à la même position et dans la même direction**, sans que l'enfant perde le contrôle. Un panneau et un cairn marquent ce seuil. Retour par la même piste (le village est alors reconstruit à l'entrée de la piste). Pas de raccourci qui saute des kilomètres : les raccourcis débloqués (§4) sont des **pistes plus directes à parcourir**, jamais des sauts.
- Ce seuil est la seule « couture » ; elle est cachée par la brume et la pente. À valider visuellement dans le navigateur à chaque phase.

## 3. Coordonnées, échelle et régions

Repère de la Route : axe **x = distance parcourue depuis le seuil du village** (0 → ~5 600 m), **z = écart latéral** (−900 → +900 m). 1 unité = 1 m, comme partout dans le jeu.

Temps de parcours indicatif du seuil à La Mecque : à pied 3,3 m/s ≈ 28 min, en courant ≈ 15 min, à dos de monture 8 à 17 min. Long grâce aux lieux à voir, pas à la marche répétitive : un point d'intérêt (repos, découverte, mission, point de vue) au moins tous les 150 à 250 m.

| # | Région | x (m) | Identité (paysage / lumière / ambiance) | Phase |
|---|---|---|---|---|
| R0 | Seuil et piste de sortie du village | −250 → 450 | Terre battue, rochers, panneaux anciens ; le village s'efface derrière | 3 |
| R1 | Grandes plaines désertiques | 450 → 1500 | Plaines de graviers ocre, buissons secs, montagnes au loin, ciel immense, lumière rasante | 3–4 |
| R2 | Dunes et vallées | 1500 → 2300 | Dunes dorées, vallées abritées, plateaux, traces dans le sable | 4 |
| R3 | Oasis (« oasis de la Source Claire », nom fictif) | ≈ 2 300 → 2 700 | Palmiers, point d'eau, constructions anciennes en terre, voyageurs fictifs, ambiance fraîche | 4 |
| R4 | Campements de voyageurs (3 haltes : x ≈ 1 100, 3 000, 3 900) | ponctuel | Tentes, tapis, récipients, animaux de bât, petites histoires éducatives, lanternes | 4 |
| R5 | Montagnes rocheuses et passages | 3 200 → 4 400 | Falaises rouges et grises, vallées encaissées, passages, points de vue, ombre profonde | 5 |
| R6 | Chemins menant à la cité | 4 400 → 5 000 | Piste plus fréquentée, murets, puits, premiers jardins ; la cité apparaît au loin | 5 |
| R7 | Région de La Mecque ancienne (vallée) | 5 000 → 5 600 | Vallée entre collines, brume de chaleur, scène d'arrivée progressive (la ville se révèle à mesure qu'on avance, caméra qui la présente) | 6 |
| R8 | La cité ancienne (VIIe siècle) | 5 600 → 6 000, z ±350 | Maisons de pierre, ruelles, cours, échoppes, places ; Kaaba au centre sur une place dégagée | 6 |
| R9 | Jabal an-Nour (nord-est) et Jabal Thawr (sud) | autour de R8, 700 à 1 200 m du centre | Reliefs inspirés des vrais, explications adaptées aux enfants | 7 |
| R10 | Zamzam, Safa et Marwa | dans/près de R8 | Voir §11 et phase 7 | 7 |

Le profil de relief de chaque région est une **fonction pure** (`route/relief.js`) combinée par `lisse()` aux frontières : transitions naturelles, aucun mur invisible. Le chemin principal (spline continue `ROUTE_CHEMIN`) aplanit le terrain comme les `CHEMINS` actuels.

## 4. Chargement progressif et performance

- **Tuiles de 64 m**, grille 16×16 segments (4 m, comme le village), construites à la demande : rayon d'affichage 6 tuiles (≈ 380 m) en `eleve`, 5 en `equilibre`, 3 en `faible`. Hors rayon : dispose (géométries libérées). Budget : **une tuile par image** (≈ 1 à 3 ms), jamais de gel.
- La **hauteur** pour `bouger` est évaluée par la même fonction pure (pas besoin que la tuile soit visible) : pas de chute possible.
- Décor par **semis déterministe par tuile** (graine = indices de tuile), `InstancedMesh` partagés (rochers, buissons, palmiers, tentes), une seule géométrie par type. Colliders ajoutés/retirés avec la tuile (liste filtrée par voisinage).
- Lieux « riches » (oasis, campements, ville) : construits par groupe quand on est à moins de 250 m, comme `construireZone` aujourd'hui.
- Ville : chunks par îlots de maisons, géométries fusionnées, distance de coupe ≈ 200 m, **pas d'ombres dynamiques** hors du joueur proche en `faible`.
- Ciel, brume, textures de sol : on réutilise `ciel.js`, `textures.js`, les profils existants. Aucune texture nouvelle > 512 px.
- Critères : ≥ 30 images/s sur téléphone milieu de gamme en `equilibre`, mémoire stable après 10 min de marche (test automatisé : nombre de géométries vivantes borné).

Raccourcis débloqués après exploration : pistes qui coupent entre deux lieux déjà découverts (par ex. oasis ↔ 2e campement), visibles sur la carte, **parcourues à pied**.

## 5. Intégration à la carte

`carte.js` devient paramétrable par monde : `creerCarte(mondeCarte, api)` avec `{ limite, dessinerFond, lieux, chemins }`. Le village continue d'utiliser le sien. Pour la Route : un second **parchemin allongé** (ratio ≈ 3:1, 5,6 km × 1,8 km) dessiné par étapes comme le premier, chemin pointillé, symboles par région. Un bouton « Pays de Nour / Route vers La Mecque » bascule entre les deux cartes ; la position du joueur, les régions découvertes (couleur pleine) et à explorer (grisées, « ? ») proviennent de `etat.route.decouvertes`. Guidage : flèche de cap + petites lumières sur les 150 m devant (pas de A* global).

## 6. Missions, personnages, interactions

- Données et textes dans `route/missions-route.js` (même forme que `missions.js` : titre, icône, `total`, `recompense`, `resume`, `categorie`), moteur : réutilise `aventure.commencer / avancer / finir` pour que pièces, badges et succès restent uniques. Catégories de la demande : exploration, entraide, observation, connaissance.
- Âge : lecture de `sauvegarde.get().age`. 3–5 ans : consignes courtes, une seule étape, aucune minuterie, exploration libre. 6–10 ans : énigmes, questions, mêmes lieux avec davantage d'étapes.
- Personnages fictifs seulement (marchand de la caravane, tisserande, enfant du campement…), réutilisant les modèles de `personnages.js`/`voyageur.js`. **Aucun personnage historique ou religieux identifiable, aucun prophète, aucun compagnon, jamais.**
- Interactions : portes (animation simple), puits, lanternes, tissus au vent (matériau `matVent` existant), animaux de la faune adaptée (dromadaire, ânes, lézards, oiseaux via `oiseaux.js`).

## 7. Sauvegarde et drapeau de préproduction

- **Drapeau** : `routeActive()` est vrai seulement si l'hôte est `localhost` / `127.0.0.1` ou commence par `preproduction.` **et** finit par `.pages.dev`. Sur `leslanternesdenour.fr` : le panneau, le bouton, le module et les données sont invisibles et jamais chargés. La branche `production` ne reçoit rien tant que le créateur n'a pas donné un accord ciblé.
- **Données** : tout dans `etat.route` (dans `monde_voyage`, déjà synchronisé par compte et par profil enfant) :
  ```
  etat.route = { v:1, ouvert:false, sac:{...}, pos:{x,z,a,region}, monde:'village'|'route',
                 decouvertes:[], repos:[], raccourcis:[], missions:{}, connaissances:[], objets:[], vu:{} }
  ```
  La position de la Route est stockée **séparément** de `etat.joueur` (qui reste la position du village) : quitter pendant la Route puis rouvrir ramène exactement au même endroit, et un retour sur une version sans la Route ne perd rien (clé ignorée). Sauvegarde toutes les 3 s comme aujourd'hui + à chaque lieu de repos + à `visibilitychange`.
- Rien n'est supprimé ni migré : `etat.route` est ajouté s'il n'existe pas. Comptes, profils enfants, Stripe : non touchés.
- À vérifier avant de brancher les comptes : que `firestore.rules`/`functions` acceptent des champs supplémentaires dans `monde_voyage` (test local avec émulateur, `outils/tests/firestore.test.mjs`).

## 8. Récompenses et carnet

- Pièces : `bourse.recompense('route:<id>', n, raison, pos)`, ids uniques, jamais présentées comme spirituelles (formulations : « bien observé », « tu as aidé », pas de « bénédiction »).
- Badges ajoutés à `BADGES` (`succes.js`) : « Sur la grande route », « Ami des voyageurs », « Regard de lynx », etc. Collection « Cartes de découverte de la route » dans `COLLECTIONS`.
- Carnet : un onglet **Itinéraire** avec 6 sections : Mon itinéraire, Mes découvertes, Mes missions, Mes objets, Mes connaissances, Mes badges. Lié au profil de l'enfant (c'est le même `monde_voyage`). Les « connaissances » sont des fiches texte issues du fichier à valider (§11) : elles restent **verrouillées en « à valider » tant que le créateur n'a pas dit oui**.
- Sac de voyage : gourde, sac, tissu de protection, petite lanterne, provisions, carte ancienne. Rôle : objets de collection et de mission (la gourde se remplit aux points d'eau et sert à aider un voyageur, le tissu protège la lanterne du vent, la carte ancienne affiche la Route). **Aucune jauge de survie, aucune pénalité, aucune pression de temps.**

## 9. Contrôles, caméra, audio

Contrôles et caméra inchangés (`controles.js`). Audio : aucune musique, aucun instrument. Sons naturels seulement via `sons.js` existant (vent, pas, eau de l'oasis), selon les règles du projet. Voix : voir §1, rôles existants uniquement ; chaque phrase est enregistrée seulement après validation du texte ET de la prononciation arabe par le créateur, via la page `revue-audio`.

## 10. Décisions proposées (à confirmer par le créateur)

1. **Condition d'ouverture** : `etat.colOuvert` (règle existante : oasis + camp découverts) **et** une grande mission terminée. Région « verrouillée » avec le message de `regions.explication`.
2. **Chameau débloquable** : nouvelle monture « Dromadaire de la grande route » (`MONTURES`, rareté « peu », `hist: 'attesté'`), offerte en finissant la 1re étape du voyage au lieu d'être achetée. Aucun nouveau système.
3. Nom fictif de l'oasis et des campements (« Source Claire », « Halte des Trois Palmiers »…) : pas de lieu réel inventé.
4. Distance totale ≈ 5,6 km (30 min à pied) : plus court ou plus long ?

## 11. Contenus religieux et historiques « à valider »

Regroupés dans **un seul fichier de données** `voyage/js/route/contenu-a-valider.js` : une entrée = `{ id, sujet, texte_enfant_3_5, texte_enfant_6_10, sources, statut: 'a-valider', note_createur }`. Le jeu n'affiche ces textes qu'avec la mention « à valider » en préproduction ; `statut: 'valide'` ne se met qu'après accord écrit du créateur (test qui échoue si un texte est `valide` sans date de validation).

| Sujet | Règles de rédaction |
|---|---|
| Qu'est-ce que la Kaaba, son importance, la Qibla et le lien avec la prière | Texte sobre ; pas de description de l'intérieur ; entrée interdite (barrière douce) |
| Zamzam (Hajar et Ismaïl) | Récit rapporté avec prudence, sans reconstitution présentée comme exacte |
| Safa et Marwa | Explication simple ; aucune course ni compétition |
| Jabal an-Nour / grotte de Hira | Espace pédagogique sans scène de révélation |
| Jabal Thawr | Explication géographique prudente |
| Hajj et Omra | Définitions pour enfants, aucun rite en jeu compétitif |
| La Mecque au VIIe siècle (maisons, rues, activités) | Distinguer **documenté** / **choix artistique** (étiquette visible dans la fiche) ; aucune certitude inventée |

Garde-fous généraux : aucune représentation de prophète, compagnon ou personne historique ou religieuse identifiable ; aucune architecture moderne ; ne jamais présenter un choix artistique comme un fait.

## 12. Plan par tranches

**Tranche 1 — jouable de bout en bout (phases 2–3 + début de la 4), objet du prochain feu vert :**
1. `routeActive()` + module `route/` chargé à la demande ; `mondeActif` dans `main.js` (changement minimal, village inchangé, tests de non-régression existants verts).
2. Au village : panneau « La grande route vers La Mecque » + personnage fictif qui présente (voix du narrateur existant, texte « à valider », sinon texte seul) + écran « Préparer mon sac » (6 objets).
3. Piste de sortie, seuil, R0 → R1 → R2 jusqu'à l'**oasis fictive** (x ≈ 2 700 m), 1 campement, repos, 3 missions d'exploration/entraide, point de reprise.
4. Terrain par tuiles, décor instancié, ciel/brume par région, ambiance par région.
5. Carte de la Route (parchemin 3:1, position du joueur, régions découvertes/à explorer), basculement entre les 2 cartes.
6. `etat.route` + sauvegarde/reprise de position exacte ; onglet carnet « Itinéraire » (versions minimales des 6 sections) ; badges de la tranche.
7. Au-delà de l'oasis : un cairn « Le chemin continue… à bientôt » (bloquant doux, jamais un mur invisible).

Tests : unitaires (relief pur, tuiles, sauvegarde/reprise, drapeau d'hôte, colliders, conditions d'ouverture) en TDD, puis parcours dans le navigateur (départ → oasis → fermer/rouvrir → reprise) et profil `faible` simulé.

**Tranches suivantes (après validation de la 1re)** : montagnes et chemins (phase 5), cité et Kaaba (6), Zamzam/Safa/Marwa/Jabal an-Nour/Thawr (7), missions et personnages complets (8), carnet/récompenses complets (9), tests de performance mobile (10).

## 13. Risques

- Couture village → Route : à soigner visuellement (brume, pente, fondu des décors).
- Poids de la ville (phase 6) : fusion de géométries et distance de coupe obligatoires.
- `main.js` fait 1 738 lignes : l'intégration `mondeActif` doit rester une couche mince, avec un test de non-régression avant/après.
- Voix et prononciations arabes : tout reste en texte tant que le créateur n'a pas écouté et validé.

---

## 14. Mise en œuvre de la première tranche (préproduction, 23/11/2026)

**Écarts par rapport au plan ci-dessus (à connaître) :**
- **Repère réel** : x = t (écart latéral), z = `DEC` + s avec `DEC = 20000` (voir `voyage/js/route/relief.js`). La Route est dans la même scène que le village, mais si loin qu'aucun objet du village ne peut se déclencher. Le sol de la Route répond au même `terrain.hauteur` / `terrain.matiere` que le village (surcharge sur l'instance), donc pas, ombres, monture et pièces fonctionnent sans changement.
- **Sortie du village à l'EST, pas au sud** : la zone « dunes » du village est Premium (fermée hors abonnement, et toujours fermée sur la préproduction, comptes en erreur 503). Une sortie au sud était bloquée. La piste de sortie part de la route de l'oasis (zone gratuite), passe au sud du lac et traverse le rempart de dunes à l'est (brèche dans `terrain.js`, activée seulement si la Route l'est). Un test vérifie que la piste ne traverse aucune zone Premium.
- **Aucune nouvelle clé de sauvegarde, aucun changement de `CLES_JEU`** : tout est dans `etat.route` (clé `monde_voyage`). Sur la Route, `etat.joueur` / `etat.chameau` (village) ne sont pas écrasés.
- **Durée** (vitesses réelles du jeu, testées) : première tranche (2 900 m) ≈ 14,6 min à pied, ≈ 7,8 min en courant ; grand voyage complet (5 600 m) ≈ 28 min à pied.
- **Dromadaire offert** : « Rihla » (fictif), ajouté à `MONTURES` seulement en préproduction, donné à l'arrivée à l'oasis (`AV.montures`), masqué à l'écurie tant qu'il n'est pas gagné (`offerte: true`).
- **Voix** : aucune. Les textes s'affichent sans audio ; aucune phrase n'est enregistrée avant validation.

**Fichiers** (`voyage/js/route/`) : `drapeau` (hôtes autorisés) · `etat-route` (sauvegarde) · `bruit`, `relief` (relief pur) · `donnees` (régions, lieux, sac, missions, ouverture, seuil) · `textes-route` (textes non religieux) · `contenu-a-valider` (religieux/historique, « À VALIDER ») · `missions-route`, `badges-route`, `carnet-route` · `tuiles-plan`, `decor-plan` (découpage et semis purs) · `monde` (terrain par tuiles, fond lointain, décor en instances) · `lieux-3d` · `village-route` (relais, panneau, éboulis) · `carte-route` · `jeu-route` (chef d'orchestre). Branchement : quelques lignes dans `main.js`, toutes derrière `routeActive()` et en `import()` dynamique.

**Reste à faire pour les tranches suivantes** : montagnes et passages, cité et Kaaba, Zamzam/Safa/Marwa/Jabal an-Nour/Jabal Thawr, personnages et missions complets, voix après validation, sons d'ambiance propres à la Route, tests de charge sur vrais mobiles. Les noms définitifs des lieux et tous les textes religieux restent à valider.
