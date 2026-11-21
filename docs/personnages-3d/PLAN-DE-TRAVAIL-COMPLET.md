# Plan de travail complet : intégration des personnages N1 (Prière, puis Ablutions)

Établi le 20/11/2026 à partir de la lecture de tous les documents de ce dossier, des deux modèles N1 (vérifiés : GLB valides, 55 et 49 os, 15 531 et 15 957 triangles, aucune animation embarquée, empreintes identiques dans les trois emplacements) et du code des deux jeux. Règles : voir `LISEZ-MOI-REPRISE.md` section 1.

## Principes
- **Un seul changement à la fois, un test avant chaque code** (garde TDD respecté), commit après chaque étape verte, jamais de fusion dans `main`, jamais de publication sans autorisation.
- **Garde-fou de périmètre** à chaque commit : `git diff --name-only main...HEAD` limité à `docs/personnages-3d/`, `personnages3d/`, `priere/jeu3d/index.html`, `priere/jeu3d/jeu.js`, `ablutions/jeu3d/index.html`, `ablutions/jeu3d/jeu.js`, `tests/versions.test.js`. Jamais : `voyage/`, `monde/`, `gestes.js`, `postures.js`, `lieu.js`, `salle.js`, autres pages.
- **Secours** : ancien `Voyageur` créé automatiquement si le chargement échoue, dépasse 8 s, si WebGL manque, ou avec `?perso=ancien`.

## Étape 0 : centraliser et sécuriser (faite le 20/11/2026)
Sauvegarde complète du site (copie + `.bundle`, sur l'ordinateur du client) ; branche `integration-personnages-n1-priere` poussée sur GitHub avec ce dossier, les 2 GLB N1 et les données de test ; rien dans `main`.

## Étape 1 : débloquer le garde TDD (décision du client)
Bloqué jusqu'au 22/11/2026 à 7 h (Paris) : quota du compte Claude (voir `LISEZ-MOI-REPRISE.md` section 5). Options : attendre ; crédits d'usage avec plafond ; clé API dédiée. Aucune ne touche au garde lui-même. **Critère de passage** : un appel de test du garde répond (au lieu de « out of extra usage »).

## Étape 2 : jeu de la Prière, par TDD (taille : M)
Détail et noms de tests : `SPECIFICATION-TESTS-PRIERE.md`.
1. Logique pure `personnages3d/logique.js` : `formeTissu` (test 1 déjà écrit, rouge), `influenceClignement`, `lisserInfluence`, `urlModele`, `decisionSecours`, `creerAvecSecours` (chargeur injecté : succès, échec, délai), `facteurTeint`.
2. Adaptateur `personnages3d/personnage-glb.js` avec le vrai GLB dans Node : interface attendue par `Gestes` (racine, corps, bassin, buste, tete, yeux, jupe, jambes[2], bras[2], clign), 13 postures jouées avec le vrai moteur sans valeur aberrante ni point sous le sol, `suivre(dt)` (formes de tissu et clignement), clonage indépendant enfant / ami, `frustumCulled` et ombres.
3. Branchement : `priere/jeu3d/index.html` (importmap `three/addons/`), `priere/jeu3d/jeu.js` (création asynchrone, remplacement seulement quand le nouveau est prêt, `suivre` dans la boucle), `tests/versions.test.js` (nouveau module). Le test existant qui échoue déjà sur `personnages/adaptateur.js` (absent de `main`) est un point préexistant, signalé et non corrigé sans accord.
4. **Critère de passage** : tous les tests verts ; les 13 postures et les transitions (`chemin`, `SALAM`) jouées sur enfant et ami, fille et garçon ; secours forcé (réseau coupé, `?perso=ancien`) ; comparaison visuelle ancien / nouveau dans le navigateur intégré ; mesures d'images/s ; garde-fou de périmètre vert.

## Étape 3 : modèles pour les Ablutions (hors site, ne dépend pas du garde, taille : L)
À faire avec l'espace de travail 3D et Blender (voir `LISEZ-MOI-REPRISE.md` section 7).
1. Poses réelles déjà extraites (26 postures) : `personnages3d/donnees-tests/poses-ablutions-*.json`. Séquences : `diagnostic-portee-*.json`.
2. Décider avec le client le traitement des **fesses enfoncées d'environ 5 cm dans le tabouret** (correction dans le modèle / l'adaptateur, sans toucher au jeu).
3. Simulation de tissu avec collision du tabouret et des jambes pour jupe, hijab, pantalon, cordon : forme **`tabouret`** (assise), variantes **pied levé droit / gauche** et éventuellement `tabouret_penche` ; cuisson en formes correctives ; mêmes contraintes que la Prière (squelette inchangé, visages inchangés).
4. Régénération N1, export, **tests Three.js et animation avec le vrai moteur sur les 26 postures et les 12 séquences**, budget de triangles, rendus de contrôle, **validation du client**.
5. Critère de passage : défauts résiduels listés, client satisfait ; nouveaux GLB N1 déposés dans `personnages3d/modeles/` avec empreintes.

## Étape 4 : jeu des Ablutions, par TDD (après les étapes 2 et 3, taille : M)
Port du cycle de marche de `Voyageur.animer` dans l'adaptateur (jambes, bras, rebond, regard, clignement) ; correspondance posture → formes de tissu des Ablutions ; la jupe reste visible quand `activer(true)` la masque ; branchement de `ablutions/jeu3d/index.html` et `jeu.js` ; tests verts, séquences complètes jouées, secours, garde-fou de périmètre. **Critère** : les 12 séquences du jeu jouées de bout en bout sur les deux personnages.

## Étape 5 : recette (taille : S à M)
Deux jeux sur ordinateur (navigateur intégré) ; **téléphone par le client** (page de test de performance fournie dans l'espace de travail 3D, aucun résultat reçu à ce jour) ; vérification que le Grand Voyage est inchangé (`git diff main...HEAD -- voyage monde` vide, tests existants identiques) ; liste des défauts résiduels.

## Étape 6 : livraison
Rapport final ; demande d'autorisation du client ; **fusion dans `main` et publication uniquement sur son ordre explicite** ; plan de retour arrière (une valeur dans la fabrique remet l'ancien personnage ; branche et sauvegarde conservées).

## Risques et décisions attendues du client
1. Débloquer le garde avant le 22/11 (options de l'étape 1) ou attendre.
2. **Test de performance sur téléphone** (non reçu) : indispensable avant publication, surtout pour deux personnages en Prière.
3. Recoloration : teint par matériau pour l'ami de la Prière (proposé) ; tenues crème d'origine conservées (sinon les bandes d'ourlet seraient teintées aussi).
4. Ablutions : lot de modèle à valider comme étape distincte.
5. Dépôt public : la branche et les modèles N1 y sont visibles tant qu'ils n'ont pas été fusionnés ; rien n'est publié sur le site.
