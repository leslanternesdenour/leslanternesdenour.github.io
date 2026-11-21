# Plan d'intégration des personnages N1 : Jeu de la Prière et Jeu des Ablutions (20/11/2026)

**Statut : PLAN SEUL, rien n'est modifié.** Le site, les jeux, le Grand Voyage et le moteur n'ont pas été touchés : l'examen du site a été fait en lecture seule (le dépôt est sur `main`, un seul fichier non suivi préexistant). **Aucune modification du site ne démarrera sans votre autorisation explicite.**

Périmètre : uniquement `priere/jeu3d/` et `ablutions/jeu3d/`. Le Grand Voyage et le reste du site ne sont pas concernés. Les anciens personnages restent en place comme solution de secours.

## 1. Ce que j'ai constaté (lecture seule)

1. **Les deux jeux fabriquent leur personnage avec la classe `Voyageur`** (`voyage/js/voyageur.js`, personnage dessiné en code, sans fichier de modèle) et le pilotent avec le moteur de gestes (`ablutions/jeu3d/gestes.js`, partagé par les deux jeux). **`voyageur.js` est aussi utilisé par le Grand Voyage : il ne doit jamais être modifié.** Toute l'intégration passe par un nouveau module qui imite `Voyageur`, sans toucher à lui.
2. **Ce que le moteur attend d'un personnage** : `racine`, `corps`, `bassin`, `buste`, `tete`, `yeux` (le moteur écrase `yeux.scale.y` pour cligner), `jupe` (le moteur la masque ou l'écrase pour certaines postures), `jambes[2]` et `bras[2]` (groupes hanche/genou/cheville, épaule/coude/main/index), `clign`. Mon banc de test a déjà prouvé qu'on peut construire cette interface à partir des os des GLB N1 et jouer **les 16 postures de prière avec le vrai moteur**.
3. **Prière** : deux personnages à l'écran (l'enfant et son ami, autre tenue et autre teint), créés par `creerPersonnage`, postures `debout, takbir, mains, roukou, plie, genoux, penche, soujoud, assis, tachahhoud, salam, relevé`. Ces postures sont **déjà vérifiées** sur les GLB (planches C4, C5).
4. **Ablutions** : un seul personnage qui marche jusqu'au tabouret (`perso.animer(dt, vitesse, t)` : cycle de marche écrit dans `Voyageur`), s'assoit **sur un tabouret, jambes devant lui**, puis enchaîne une trentaine de postures (puiser, bouche, nez, visage, bras, tête, oreilles, **pied levé sous le robinet**, etc.). **Ces postures ne font pas partie de celles déjà vérifiées** : c'est le vrai gros travail (section 4).
5. **Personnalisation** : le jeu choisit le genre, une tenue parmi 6 et un teint parmi 4 (`PEAUX`) ; dans la Prière l'ami a une autre tenue et un autre teint. Les GLB ont leurs couleurs peintes sur les sommets (une seule tenue, un seul teint) : il faut une recoloration à l'exécution (section 3, point 5).
6. **Technique** : Three.js 0.170.0 chargé depuis un CDN par `importmap` (comme dans mes tests) ; `GLTFLoader` n'est pas déclaré dans l'`importmap` ; les personnages sont créés de façon synchrone, un GLB se charge de façon asynchrone ; aucun fichier `.glb` n'existe encore dans le site ; le dépôt a des tests Node (`*.test.js`, `tests/versions.test.js` pour les numéros de version `?v=`).

## 2. Principe : un nouveau personnage « enfichable », l'ancien en secours automatique

- Nouveau dossier **dédié aux deux jeux** (rien d'existant n'est déplacé) : `personnages3d/` avec `modeles/` (les 2 GLB N1, ≈ 0,85 Mo chacun), `personnage-glb.js` (l'adaptateur, même interface que `Voyageur`), `fabrique.js` (`creerPersonnage(...)`, qui renvoie le nouveau personnage, **ou l'ancien `Voyageur` en cas de problème**), et ses tests.
- Dans chaque jeu, le changement se limite à : remplacer `new Voyageur(...)` par l'appel à la fabrique (création rendue asynchrone avec l'écran de chargement existant), et ajouter `three/addons/` à l'`importmap` du `index.html`. Les deux jeux gardent leur import de `Voyageur` (secours).
- **Secours automatique** vers l'ancien personnage si : le GLB ne se charge pas (réseau, 404), délai dépassé (8 s), erreur WebGL, ou drapeau d'arrêt d'urgence. **Interrupteur général** : une constante unique dans `fabrique.js` (et le paramètre d'adresse `?perso=ancien` / `?perso=nouveau` pour forcer l'un ou l'autre pendant les essais). Retour arrière = changer une valeur, sans rien supprimer.

## 3. Adaptateur `personnage-glb.js` (travail à faire, par TDD)

1. **Correspondance des os** vers les groupes du moteur (déjà éprouvée) : `racine, corps, bassin, buste, tete, epaule_d/g, coude_d/g, main_d/g, index_d/g, hanche_d/g, genou_d/g, cheville_d/g`.
2. **`yeux`** : groupe factice dont `scale.y` est lu à chaque image et traduit en formes `clignement` / `clignement_mi` du GLB (le moteur n'est pas modifié).
3. **`jupe`** : le moteur la masque en position agenouillée ; dans le GLB la jupe est collée au corps par des formes correctives, elle doit **rester visible**. L'adaptateur ignore ces ordres et pilote à la place les formes `assis / penche / prosterne` selon la posture (correspondance déjà validée : soujoûd → prosterne, roukoû‘ et penché → penche, assis, tachahhoud et salâm → assis), avec lissage.
4. **Marche (Ablutions)** : le GLB n'a pas d'animation de marche ; le cycle de `Voyageur.animer` (balancement des jambes et des bras, rebond, regard, clignement) est **recopié** dans l'adaptateur et appliqué aux os, puis contrôlé à l'œil (jupe, hijab, pantalon pendant la marche).
5. **Teint et tenue** : le teint se règle par la couleur du matériau de la peau (4 teints) ; la tenue par la teinte du matériau des vêtements (6 tenues). Limite : la teinte colore aussi les bandes de l'ourlet (elles ne gardent pas leurs couleurs d'origine). **Décision à prendre** : accepter ce compromis, ou fixer une seule tenue crème en N1. Matériaux **clonés par personnage** (l'ami de la Prière doit pouvoir différer de l'enfant).
6. **Détails** : `frustumCulled = false` sur les maillages à squelette, ombres (`Q.ombres`) , libération de la mémoire au changement de genre (comme aujourd'hui), mise en cache du second genre.
7. Pas d'accessoires (le jeu appelle `Voyageur` avec `porte = {}`) : rien à gérer côté boutique.

## 4. Travail préalable sur les personnages (hors site) : les postures des Ablutions

C'est le point le plus lourd, à faire **avant** toute intégration dans les Ablutions :
1. Extraire en lecture seule les ≈ 30 postures et séquences réelles d'`gestes.js` (comme je l'ai fait pour la Prière) vers un fichier de poses.
2. **Vérifier la portée des mains et des pieds** (les cibles du robinet et du pied levé doivent être atteintes par le squelette des GLB).
3. Rendus de toutes les postures sur le tabouret pour les 2 personnages ; **simuler et cuire de nouvelles formes correctives** pour la position « assis sur tabouret, jambes devant » et « pied levé » (jupe, hijab, pantalon du garçon, cordon), comme pour la Prière ; N0 puis N1 ; nouveau budget de triangles.
4. Contrôles Three.js et animation complète avec le vrai moteur (comme pour la Prière).
**Prière : aucun nouveau travail de modèle.** Recommandation : **faire la Prière en premier**, les Ablutions ensuite.

## 5. Phases, critères de passage et sécurité

| Phase | Contenu | Critère pour passer à la suivante |
|---|---|---|
| **0. Prérequis** (avant autorisation) | Test sur téléphone réel des GLB N1 (déjà préparé) ; votre validation des personnages | Fluidité acceptable sur téléphone (cible : ≥ 30 images/s, idéalement 60, avec 2 personnages en Prière) |
| **1. Mise en place** | Branche de travail dédiée (le dépôt est sur `main`, je ne changerai pas de branche sans votre accord) ; module, fabrique, tests unitaires (TDD) ; essais **en local** avec un serveur à liste blanche, **aucune mise en ligne** | Tests verts ; l'ancien personnage s'affiche toujours avec le drapeau « ancien » |
| **2. Prière** | Adaptateur branché derrière `?perso=nouveau`, les deux personnages (enfant + ami), toutes les postures, genre fille/garçon, secours | Rendus comparés ancien / nouveau, essai sur téléphone, pas de régression des tests existants |
| **3. Ablutions** (après la section 4) | Marche, assise, toutes les séquences | Idem |
| **4. Essais** | Téléphones et navigateurs variés, connexion lente (secours déclenché), changement de genre répété (fuites mémoire) | Aucun blocage, secours vérifié |
| **5. Mise en service** | Bascule du drapeau (d'abord optionnelle, puis par défaut) après votre autorisation | Retour arrière testé |

**Garde-fous** : le Grand Voyage et `voyageur.js` ne sont jamais modifiés ; mise en ligne = fusion sur `main` (le site se publie depuis `main`) : **rien ne sera fusionné sans votre accord**, un essai local suffit avant ; chaque modification du site est précédée de ses tests ; aucune suppression de l'ancien personnage.

## 6. Décisions que j'attends de vous
1. Autorisation de démarrer la phase 1 (branche de travail, nouveau dossier `personnages3d/`) : **oui / non / plus tard**.
2. Ordre : Prière d'abord (recommandé) ou les deux ensemble.
3. Personnalisation : recoloration par teinte (bandes d'ourlet teintées aussi) ou tenue crème unique.
4. Le test sur téléphone réel : à faire par vous (mode d'emploi prêt) avant la phase 1.
5. Les Ablutions demandent un vrai travail de modèle (section 4) : à confirmer comme étape distincte.
