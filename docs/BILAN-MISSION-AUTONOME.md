# Bilan de la mission autonome — 21/11/2026

État de départ : `preproduction` au commit `09a6e8b`. Arrivée : `preproduction` au commit `6a5de6e` (11 commits, 51 fichiers, +2043 / −41 lignes). `main` = `dc39d93`, **jamais touchée**. Rien en production, aucun DNS, aucun achat, aucun secret changé.

## 1. Terminé
- **Personnages 3D N1 dans le jeu de la Prière** (étape 2 du plan de reprise) : logique, adaptateur, fabrique avec secours, branchement. Désactivé par défaut (`?perso=nouveau` pour l'essayer).
- **Cycle de marche et gestes** de l'ancien personnage portés dans l'adaptateur (pour les Ablutions).
- **Audit automatique du site** (18 pages, ordinateur et mobile), **test de robustesse « singe »** (1 445 clics, 5 graines), **audit des voix**.

## 2. Corrigé
- **Ablutions, jeu 4** : toutes les suites commençaient aux mains ; « Tout est juste ! » validait des ablutions **sans intention** (votre remarque). Désormais intention, puis Bismillâh. Test dédié.
- **Mon erreur** : j'avais rebranché les nouveaux clips ElevenLabs des ablutions et de la prière à votre demande ; l'historique GitHub montrait qu'ils avaient déjà été annulés (« mélangés »). **Annulé** (`09a6e8b`), voix vérifiées remises en ligne, test qui interdit le rebranchement.
- **Calendrier** : plantage (3 erreurs JS) si on ferme l'accueil sans créer de profil puis touche un niveau, l'étoile ou « Modifier ». Corrigé, test de non-régression, service worker v7.
- **Accessibilité** : miniatures vidéo sans nom accessible quand l'image ne charge pas ; zones tactiles ≥ 40 px (pied de page, boutons isolés).
- **Fuite mémoire** des nouveaux personnages (textures d'os non libérées : 71 → 23 stables).
- **Tests réparés** : `tests/versions.test.js` (échouait avant ma mission), test du service worker (numéro de version lu dans `sw.js`).
- Les données de test et documents 3D ne sont plus publiés ; cache d'une heure pour les modèles `.glb`.

## 3. Jeux et fonctionnalités
- Aucun jeu entièrement nouveau créé. **Raison** : les 5 maisons « bientôt » (Laboratoire des sons, Jardin des bonnes actions, Chasse aux mots, Défi des cinq prières, Fabrique des étoiles) sont des contenus **Premium** : leur code et leurs contenus doivent rester **hors du dépôt public** (stockage privé), et leur contenu religieux doit être **validé par vous**. « Chasse aux mots » existe déjà dans le pack privé (sur votre machine).
- Audit des jeux existants : aucun plantage détecté sur les 14 pages de jeux testées (singe) hors le bug du calendrier, corrigé.

## 4. Personnages 3D
- **Prière : fait.** 13 postures × fille/garçon : aucun sommet sous le sol, articulations identiques à l'ancien personnage à **< 0,01 mm** ; formes du tissu qui suivent la posture ; clignement ; clones indépendants ; secours automatique (réseau, délai 8 s, fichier corrompu, WebGL, `?perso=ancien`) ; 12 changements de genre sans fuite ; ordinateur et mobile sans erreur JS. Visuellement nettement meilleur que l'ancien.
- **Ablutions : mécanique faite, modèle à finir.** Marche et 12 séquences jouées sans erreur ; **défauts visibles** sur le tabouret (robe écrasée, ourlet qui traverse) et au pied levé (captures dans `docs/personnages-3d/captures/`) : il faut des **formes de tissu correctives créées dans Blender** avec votre espace de travail 3D. Par défaut, ancien personnage.
- **Manque : test de performance sur téléphone réel** (jamais fait) avant de passer `PAR_DEFAUT` à `'nouveau'`.
- Tenues : modèle crème d'origine (décision du dossier) ; l'ami ne diffère que par le teint.

## 5. Voix
Détail : `docs/AUDIT-VOIX-2026-11-21.md`. Voix françaises complètes ; **13 textes arabes sans enregistrement humain** ; **calendrier : 169 extraits sans nouvelle voix** (anciennes voix conservées) ; pack Premium privé non vérifiable ici ; nouveaux clips ElevenLabs cohérents en durée (corrélation 0,94 à 0,95) sauf `q2_bras`, `g4ok`, `d_gh` ; **je ne peux pas écouter** : aucune voix n'a été validée à l'oreille. Pas d'accès à ElevenLabs depuis cet environnement : aucune voix générée, aucun crédit consommé.

## 6. Tests (tous exécutés)
Suite `bash outils/tests/tout.sh` (avec `NAVIGATEUR=1 EMULATEURS_FIREBASE=1`) : **verte**. Détail : API et droits ; 22 tests Firebase (règles, base REST, rôle) ; API + Premium sur le vrai Firestore (émulateur) ; **personnages 3D : 19 tests** ; Chrome : **78** (comptes) + **32** (Google) + **12** (calendrier) + **12** (service worker) ; parcours de compte 23/23 ; voix vérifiées ; ordre des ablutions ; versions ; aucune fuite Premium (510+ fichiers). Singe : 5 graines × 8 pages, 0 problème après correction. Audit du site : 0 erreur JS, 0 CSP, 0 lien cassé, 0 élément sans nom ; 5 petites cibles restantes = liens dans une phrase (exemptés WCAG 2.5.8).
**Limite honnête** : la suite complète est sensible à la charge (un échec ponctuel est apparu quand un autre test tournait en parallèle ; elle repasse seule).

## 7. Fichiers
Créés : `personnages3d/{logique,personnage-glb,fabrique}.js` + 3 fichiers de test + 2 scripts d'essai navigateur + `modeles/*.glb` ; `outils/tests/{audit-site,audit-voix,singe,parcours-calendrier}.mjs`, `pwa.sh`, `voix-verifiees.test.mjs`, `ablutions.test.mjs` ; `docs/` (8 documents 3D, captures, audit des voix, ce bilan).
Modifiés : `priere/jeu3d/{index.html,jeu.js}`, `ablutions/jeu3d/{index.html,jeu.js}`, `ablutions/index.html` (jeu 4), `calendrier/{app.js,index.html,sw.js}`, `accueil/{miniatures.js,accueil.css}`, `univers/univers.css`, `_headers`, `outils/construire.mjs`, `outils/tests/{tout.sh,parcours.sh,pwa.mjs,verifier.mjs}`, `tests/versions.test.js`.

## 8. Branches et commits
`main` dc39d93 (intacte) · `preproduction` 6a5de6e (déployée sur pages.dev) · `personnages-3d-n1` 9b88319 puis 8c6fbaf · `audit-site-2026-11-21` c391290 · `audit-voix-2026-11-21` b158f85 · `integration-personnages-n1-priere` de18230 (sauvegarde d'origine, **intacte**). Les autres branches existantes n'ont pas été touchées.

## 9. Problèmes restants
Défauts des Ablutions 3D (Blender) ; test téléphone ; 13 voix arabes ; voix du calendrier ; 5 maisons Premium ; écoute des 138 clips ; R2 non activé (Premium fermé) ; Stripe : produit Famille, identifiants de prix, webhook, secrets, test de paiement ; ancienne clé de compte de service **à confirmer supprimée** dans Google Cloud ; réglage Cloudflare **« Preview branch = None »** non confirmé ; texte « À COMPLÉTER » de l'éditeur dans les conditions.

## 10. À valider par vous
1. Écouter quelques voix, et décider du rebranchement des clips ElevenLabs.
2. Essayer sur téléphone : `…/priere/jeu3d/?perso=nouveau` et `…/ablutions/jeu3d/?perso=nouveau`, puis décider du passage par défaut.
3. Lancer le travail Blender des Ablutions (ou me donner l'accès à l'espace de travail 3D).
4. Valider le contenu et la création des maisons Premium.
5. Reprendre Stripe en mode test.
