# Intégration des personnages N1 dans le jeu de la Prière : spécification TDD et branchement

**État au 20/11/2026 : bloqué par le garde TDD du dépôt** (quota épuisé : il accepte les tests, refuse tout fichier d'implémentation, jusqu'au **22/11/2026 à 7 h, heure de Paris**). Je ne le contourne pas (règle du client). Ce document permet de reprendre immédiatement, cycle par cycle (un test à la fois : test rouge, stub, code minimal, test vert).

Branche de travail : `integration-personnages-n1-priere` (depuis `main`, commit `dc39d93`). Sauvegarde complète avant tout : `<dossier-local>\Lanternes-de-Nour-SAUVEGARDE-SITE-2026-11-20-avant-integration\` (copie du site avec `.git` + `depot-complet-2026-11-20.bundle`). Rien n'est commité ni publié. Déjà dans la branche (non commités) : `personnages3d/logique.test.js` (premier test, rouge : module absent), `personnages3d/modeles/fille_N1.glb` et `garcon_N1.glb`.

Lancer un test : `node --test --test-reporter=file:///<dossier-local>/leslanternesdenour.github.io/ablutions/jeu3d/tdd-guard-node-reporter.mjs <fichier>` (le reporter reste non versionné).

## A. Logique pure, sans three.js : `personnages3d/logique.js` (tests dans `logique.test.js`)
1. `formeTissu(posture)` : soujoud → `prosterne` ; roukou, penche → `penche` ; assis, tachahhoud, salamDroite, salamGauche → `assis` ; sinon `null`. *(test 1 déjà écrit)*
2. `influenceClignement(echelleY)` : 1 → `{ clignement: 0, clignement_mi: 0 }` ; 0,15 (valeur écrite par le moteur pendant un clignement) → `clignement` 1 ; valeur intermédiaire → combinaison continue.
3. `lisserInfluence(courante, cible, dt)` : rapprochement exponentiel, constante ≈ 0,25 s, jamais de dépassement.
4. `urlModele(genre)` : `fille` → `fille_N1.glb`, `garcon` → `garcon_N1.glb`, genre inconnu → fille ; chemin relatif au dossier `personnages3d/modeles/`.
5. `decisionSecours({ parametre, interrupteur, webgl })` : `?perso=ancien` ou `interrupteur === false` ou `webgl === false` → `'ancien'` ; `?perso=nouveau` ou défaut → `'nouveau'`.
6. `creerAvecSecours({ charger, creerAncien, delaiMs })` (asynchrone, charge injectée) : chargeur réussi → `{ type: 'nouveau' }` ; chargeur qui échoue → `{ type: 'ancien', raison }` ; chargeur trop lent (délai 8 s) → `'ancien'` ; l'ancien n'est créé **que** si nécessaire.
7. `facteurTeint(indexPeau)` : multiplicateur de couleur du teint par rapport au teint d'origine du modèle (identité pour l'index par défaut 1) ; sert à l'ami de la Prière (autre teint). Les tenues restent celles validées (pas de recoloration des vêtements).

## B. Adaptateur avec three.js : `personnages3d/personnage-glb.js` (tests avec le vrai GLB N1 chargé par `GLTFLoader` dans Node, comme dans `28-finition/scripts/70-test-final.txt`)
8. L'adaptateur expose l'interface attendue par `Gestes` : `racine, corps, bassin, buste, tete, yeux, jupe, jambes[2], bras[2], clign`, pour les deux GLB (`racine` = groupe enveloppe positionné par le jeu).
9. Avec le vrai moteur (`Gestes` + `POSTURES` de `priere/jeu3d/postures.js`) toutes les postures de prière (`debout, takbir, mains, roukou, plie, genoux, penche, soujoud, assis, tachahhoud, salamDroite, salamGauche, releve`) donnent des positions finies, sans point sous le sol.
10. `suivre(dt)` : lit `g.cible` (identité d'objet dans `POSTURES`) puis `formeTissu`, et amène la bonne forme (`assis`, `penche`, `prosterne`) à 1 et les autres à 0 ; la jupe reste visible quand le moteur la masque.
11. `suivre(dt)` : `yeux.scale.y` écrit par le moteur pilote `clignement` et `clignement_mi`.
12. Clonage : deux personnages du même genre (enfant et ami) ne partagent ni matériaux ni squelette (`SkeletonUtils.clone`), le teint de l'ami peut différer sans changer celui de l'enfant.
13. `frustumCulled = false` sur les maillages à squelette ; `castShadow` selon l'option ombres.

## C. Branchement du jeu (après les tests verts ; modifications minimes)
- `priere/jeu3d/index.html` : ajouter à l'`importmap` `"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"` (seule page modifiée avec `jeu.js`).
- `priere/jeu3d/jeu.js` : `creerPersonnage` et `creerPersonnages` deviennent asynchrones et passent par `creerAvecSecours` (secours = l'ancien `Voyageur` déjà importé) ; création initiale attendue avant de retirer l'écran de chargement ; changement de genre : le nouveau personnage remplace l'ancien seulement quand il est prêt (jamais d'`enfant` nul dans la boucle) ; dans `image()`, appeler `p.v.suivre?.(dt)` après `p.g.maj(...)` ; `window.__pri` inchangé.
- Numéros `?v=` : nouveau module importé avec `?v=1` ; `tests/versions.test.js` : y inscrire le nouveau module (le test existant échoue déjà sur `personnages/adaptateur.js`, absent de `main`, point préexistant que je ne corrige pas sans accord).
- **Jamais modifiés** : `voyage/js/voyageur.js`, tout le Grand Voyage, `ablutions/jeu3d/gestes.js`, `priere/jeu3d/postures.js`, `monde/`, les autres pages. Ancien personnage = secours automatique (échec de chargement, délai, WebGL, `?perso=ancien`).

## D. Contrôles après branchement
Les 13 postures sur les deux personnages (enfant et ami), transitions (`chemin`, `SALAM`), changement de genre répété, secours forcé (réseau coupé, `?perso=ancien`), performances à l'écran (série de mesures du banc `28-finition/test-telephone`), rendus comparés ancien / nouveau dans le navigateur intégré (ordinateur) ; **téléphone : à faire par le client** (le test précédent n'a rien enregistré).
