# Liste de contrôle : intégration séparée et sécurisée (Prière et Ablutions uniquement)

**Rien de ce dossier n'est dans le site.** Il prépare une intégration future qui ne démarrera qu'avec l'autorisation explicite du client. Le Grand Voyage et le reste du site ne sont pas concernés ; les anciens personnages (`Voyageur`) restent en place comme solution de secours.

## Avant d'ouvrir la moindre modification du site
- [ ] Autorisation écrite du client de démarrer la phase 1 (voir `PLAN-INTEGRATION.md`, section 6).
- [ ] Résultats de performance sur un vrai téléphone reçus et jugés suffisants (non reçus à la clôture des personnages).
- [ ] Décision sur la personnalisation (teinte par matériau, bandes d'ourlet teintées aussi, ou tenue crème unique).
- [ ] Ordre retenu (Prière d'abord, recommandé).
- [ ] Branche de travail dédiée créée (le dépôt est sur `main`) : jamais de modification directe de `main`.

## Règles à respecter pendant l'intégration
- [ ] `voyage/js/voyageur.js`, tout le Grand Voyage, `monde/`, les PNJ, habitants et marchands : **jamais modifiés**.
- [ ] Nouveau code uniquement dans un nouveau dossier (`personnages3d/` proposé) + changements minimes dans `priere/jeu3d/` et `ablutions/jeu3d/` (création du personnage via la fabrique, `three/addons/` dans l'importmap).
- [ ] Tests écrits d'abord (le dépôt est protégé par un garde TDD) ; `tests/versions.test.js` mis à jour pour les nouveaux numéros `?v=`.
- [ ] Secours automatique vers `Voyageur` : échec de chargement, délai dépassé (8 s), erreur WebGL, interrupteur unique ; paramètres `?perso=ancien` / `?perso=nouveau` pour forcer l'un ou l'autre.
- [ ] Essais uniquement en local (serveur à liste blanche) tant que le client n'a pas validé ; aucune fusion sur `main` ni mise en ligne sans accord.

## Contrôles techniques à passer (par jeu)
- [ ] Les 2 GLB se chargent, matériaux clonés, `frustumCulled = false`, libération mémoire au changement de genre.
- [ ] Toutes les postures du jeu jouées avec le vrai moteur : valeurs finies, rien sous le sol (méthode : `28-finition/scripts/80-animation-final.txt`).
- [ ] Prière : enfant + ami (autre teint, autre tenue) ; 13 postures ; formes de tissu ; clignement par `clignement` / `clignement_mi`.
- [ ] Ablutions : **prérequis modèle** (postures sur tabouret et pied levé : nouvelles formes correctives, N0 puis N1, nouveaux contrôles), marche portée depuis `Voyageur.animer`, séquences complètes.
- [ ] Performance mesurée sur téléphone (N1, deux personnages en Prière) ; secours déclenché volontairement (coupure réseau) et vérifié.
- [ ] Comparaison visuelle ancien / nouveau, face, profil et postures, sur téléphone et ordinateur.

## Retour arrière
Une seule valeur (`fabrique.js`) remet l'ancien personnage ; rien de l'ancien code n'est supprimé.

## Contenu de ce dossier
`modeles-N1\` (les 2 GLB N1 prêts à copier, empreintes dans `MANIFEST-SHA256.txt`) · `CONTRAT-INTERFACE.md` · `PLAN-INTEGRATION.md` · `donnees-tests\` (poses réelles de la Prière extraites du moteur, pour les tests) · `prototype-lecture-seule\` (extrait de la page de test, à réécrire proprement).
