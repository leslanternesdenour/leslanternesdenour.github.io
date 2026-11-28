# TODO RESTANT — Les Lanternes de Nour (priorisé)

> Relevé du 23/11/2026. Complète `PASSATION-PREMIER-CLAUDE.md` (contexte, règles), `ETAT-TECHNIQUE-ACTUEL.md` (Git/Cloudflare/tests), `DEBRIEF-COMPLET-PROJET.md` (historique). **Rien n'est caché** : ce qui est incomplet est listé. Travailler **uniquement sur `preproduction`**.
> Légende : 🧑 = attend une décision/action du responsable du projet (le premier Claude ne doit pas la prendre à sa place).

## MISE À JOUR 28/11/2026 — état mesuré (prime sur ce qui suit en cas de contradiction)
**Clos ce jour (vérifié par exécution, serveur local, Chromium sans carte graphique, un script à la fois)**
- **P1-1 (Ablutions 3D, « retour inattendu »)** : *artefact du test, pas un bug du jeu*. Le script ne faisait jamais asseoir le personnage devant un robinet : le jeu attendait donc, à juste titre, « Touche un cercle doré… ». Corrigé dans `outils/audit-jeux/ablu3d-jeu.js` (appel à `__abl.asseoir(1)`). Résultat : Ablutions 3D ordinateur 51/52 (le seul écart était une attente périmée : 12 gestes en mode Libre, pas 11 ; corrigée), téléphone 52/52, aucune erreur JS.
- **P1-3 (audit des jeux)** : Prière 3D (jamais lancée avant) ordinateur 60/60 et téléphone 60/60 ; Quiz téléphone 34/34 et tablette 34/34 ; Chasse aux mots tablette 23/23, téléphone 22/23 (le seul échec : le test « toucher réel » vise parfois une cible tirée au hasard hors de l'écran ; un toucher réel sur la cible fonctionne, vérifié à part) ; Mystères du désert téléphone 77/77 et tablette 77/77 ; Calendrier/Ramadan ordinateur 89/89 (téléphone et tablette : 87/88 avant correction de l'attente « grille de 30 lanternes », qui n'existe qu'une fois le profil créé) ; Ablutions 2D et Prière 2D ordinateur et téléphone 43/43 et 55/55. Non relancé (déjà fait le 23/11) : Quiz ordinateur complet. Reste hors de portée de la machine : **vrais appareils**.
- **P2 « fichiers de débogage publiés »** : déjà résolu (plus aucun `dbg_*.png` ni `ecoute.png` à la racine ni dans `dist/`). Un fichier vide `ERROR` (artefact local) était publié : supprimé. Données de l'outil tdd-guard (suivies dans le dépôt public) : retirées de l'index Git et ignorées (`.gitignore`).
**Corrigé / ajouté ce jour**
- Carte de la grande route : repère « La Mecque » (drapeau + nom, rien de religieux) au bout de la piste ; étiquette « Village de Nour » plus coupée par le bord (ordinateur et téléphone) ; les « ❔ » ne se superposent plus en grappes ; message « Rien encore » du carnet Itinéraire sur toute la largeur.
- Calendrier du Ramadan : le premier profil reprend le prénom et le genre du profil enfant du compte (l'âge reste à choisir : il n'est pas connu). Service worker v9.
- Audits : chemins réglables (`PLAYWRIGHT_DIR`, `THREE_DIR`), mode d'emploi Windows dans `outils/audit-jeux/LISEZMOI.md`.
**Toujours bloquant pour une mise en ligne définitive (décisions ou informations du créateur — rien n'a été inventé)**
- `conditions/index.html` : éditeur, statut juridique, adresse, SIREN, TVA, médiateur, politique de remboursement `[À COMPLÉTER]` ; le garde-fou de `promouvoir.sh` refuse la promotion tant qu'il en reste.
- Contenu religieux « À VALIDER » (fiches de La Route, Kaaba, prononciations, devinettes) : à valider par une personne compétente.
- Pack Premium : toujours absent (stockage R2 `ldn-premium` relié, contenu à importer par le créateur).
- Production : secrets Cloudflare de production (`SESSION_SECRET`, `FIREBASE_COMPTE_SERVICE`, `CREATOR_UID`, `EMAIL_CLE_API`, clés Stripe) à poser avant de promouvoir les comptes ; DMARC à ajouter dans le DNS.
- Jeux « Bientôt » de la page Aventures (Bâtisseurs de l'oasis, Trésor des sourates, Défi des cinq prières) et maisons Premium : non créés volontairement (contenu Premium hors dépôt public, contenu religieux à valider, voix sans crédit à dépenser).


## P0 — Bloquant (empêche le fonctionnement ou la reprise)
**Aucun bloquant technique identifié.** `preproduction` est accessible, propre et synchronisée ; la préproduction en ligne sert le dernier commit de code ; le build et le vérificateur sont verts. (Seul point de surveillance : si Cloudflare échoue encore avec « build failed to initialize in time », relancer le déploiement — voir `ETAT-TECHNIQUE-ACTUEL.md` § 3.)

## P1 — Important (à corriger/clore avant de considérer les fonctionnalités comme terminées)

### P1-1 — Ablutions 3D : retour inattendu à l'écran « Touche un cercle doré pour t'asseoir » en mode Apprendre (NON ÉLUCIDÉ)
- **Description** : pendant un parcours automatisé du mode « Apprendre » (`ablutions/jeu3d/`), à l'étape 5 (« Le nez ») l'écran est revenu au point de départ : titre « Apprendre », consigne « Touche un cercle doré pour t'asseoir devant un robinet », `#panneau` masqué, `#bulle` et `#actions` vides (alors que le bouton « Étape suivante » venait d'être détecté).
- **Origine** : inconnue. Hypothèses : (a) bug réel (réinitialisation de l'état, `accueil()`/`seLever()` déclenché ; (b) artefact du test (clics dans le mauvais ordre, `nth-of-type`). **Aucune des deux n'est démontrée.**
- **Fichiers** : `ablutions/jeu3d/jeu.js` (`etapeApprendre`, `actionsApprendre`, `boutonsGestes`, `s_asseoir`, `seLever`), test `outils/audit-jeux/ablu3d-jeu.js`.
- **Déjà essayé** : un seul passage ; état capturé (JSON + capture d'écran), pas de reproduction manuelle.
- **Action** : rejouer à la main le mode Apprendre jusqu'à l'étape 5 (ordinateur puis téléphone) ; si reproductible, corriger ; sinon corriger le test (attendre l'état « assis » avant chaque étape) et le relancer jusqu'au bout (Apprendre, S'entraîner, Libre).
- **Validation** : les 3 modes se terminent (écran de fin) sans retour parasite ; test `ablu3d-jeu.js` entièrement vert.

### P1-2 — ✅ RÉSOLU le 24/11/2026 (`7058a56`, vérifié en ligne) — Garde-fou « mode sans visage »
- **Résolution** : `ecole-arabe/index.html` avait déjà été corrigé par une autre session ; la seule page restante, `compte/action/index.html` (liens des e-mails, ajoutée depuis), charge maintenant `sans-visage.js`. `sans-visage-garde.test.mjs` : 9/9. (Reste 2 liens du vérificateur en échec dans `outils/voix/lettres-validation/*.html` : outils internes non publiés, sans rapport.)
- *Historique de la description initiale* : `node --test outils/tests/sans-visage-garde.test.mjs` → 1 échec : « ecole-arabe/index.html ne charge pas sans-visage.js ». **Préexistant** (la page n'a jamais chargé le script depuis `6ab0a4c`) ; les 3 jeux de l'École le chargent.
- **Fichiers** : `ecole-arabe/index.html` (modèle : `ecole-arabe/lettres/index.html` ligne 10 : `<script src="../../monde/socle/sans-visage.js?v=1"></script>`, ici avec le chemin `../monde/socle/sans-visage.js?v=1`).
- **Action** : ajouter la balise tôt dans le `<head>`, vérifier que la bannière/le réglage « sans visage » s'applique à la mascotte Maktoub de cette page.
- **Validation** : `bash outils/tests/tout.sh` entièrement vert (hors le contrôle Premium sauté faute de pack privé).

### P1-3 — Audit des six jeux : parties restant à exécuter
- **Fait** : voir `DEBRIEF-COMPLET-PROJET.md` § 10 (Quiz pc+tel ; Chasse, Mystères, Ramadan, Ablutions 2D, Prière 2D sur pc).
- **Reste** :
  1. Parcours complets **téléphone (390×780 tactile) et tablette (820×1180)** pour : Chasse aux mots, Mystères du désert, Ramadan, Ablutions 2D, Prière 2D (`node outils/audit-jeux/<script> tel|tab`, voir en-tête de chaque script pour les arguments).
  2. **Prière 3D** : `outils/audit-jeux/pri3d-jeu.js` écrit, **jamais exécuté**.
  3. **Ablutions 3D** : voir P1-1.
  4. Rapport d'audit final avec captures des problèmes et des corrections importantes (les montages de départ sont dans `docs/audit-jeux-2026-11-23/`).
  5. Vérifier **en ligne** (préproduction) que le correctif de la prière (`5f5e3d8`) fonctionne (testé seulement en local : 55/55).
- **Validation** : tableau final (jeu, tests exécutés/réussis, erreurs, corrections, audios vérifiés, points à valider) fourni au responsable, sans test déclaré « fait » s'il n'a pas été exécuté.
- **Ne pas refaire** : les audits déjà exécutés (Quiz, contenu des 6 jeux, audio technique des 313 clips du Monde).

### P1-4 — Prière 2D : texte arabe et récitation des sourates dépendent de services externes
- **Description** : le texte arabe d'Al-Fâtiha/Al-Ikhlâs est chargé à l'exécution depuis `api.alquran.cloud`, la récitation depuis `cdn.islamic.network` (autorisés par la CSP de `_headers`). Hors connexion/service injoignable : l'enfant voyait « … » ; **un message de repli** a été ajouté (`5f5e3d8`) **sans écrire de texte coranique**.
- **Action** : (1) vérifier en ligne, sur un navigateur réellement connecté, que le texte s'affiche et que la récitation joue ; (2) 🧑 décider si le texte doit être **intégré au dépôt** (nécessite validation humaine du texte et des diacritiques — **ne pas le saisir de mémoire**).
- **Fichiers** : `priere/app.js` (`SUR`, `loadSur`, `wireSur`, `ayUrl`), `priere/jeu3d/jeu.js` (`carteSourate`, `reciter`).
- **Validation** : texte et récitation OK en ligne ; message de repli lisible hors ligne.

### P1-5 — 🧑 Validation humaine des contenus religieux et des prononciations (rien n'a été modifié)
À faire valider par un humain compétent, **sans changement arbitraire** :
- Références de hadiths et de versets **affichées** dans : ablutions (`ablutions/index.html`, `ablutions/jeu3d/etapes.js`), prière (`priere/app.js` `ST`, `DH`), calendrier (`calendrier/data.js` : colonnes « source » des 30 missions et des jeux), quiz (questions marquées `religieux:true` : `docs/QUIZ-VERIFICATION.md`).
- Prononciation de **tous les mots arabes** des Aventures et de l'École (registre : `node outils/voix/jeux/verifier-audios.mjs` → « mots arabes à valider : 240 »). Les 237 phrases de la narratrice (Ablutions/Prière/Calendrier) ont été validées par le client (`docs/VALIDATION-VOIX-2026-11-21.md`).
- Contenu de l'École arabe (lettres, voyelles, chiffres) : validation par une personne compétente en arabe.
- Devinettes de la Chasse aux mots potentiellement ambiguës (`aventures/chasse-aux-mots/mots.js`) : « lanterne » / « étoile » / « lune » (bibliothèque, oasis) et « pomme » / « datte » (jardin, marché). **Modifier une devinette impose de régénérer son audio (crédits ElevenLabs) : décision du responsable.**
- Calendrier : `dp5` (« La baleine » affichée, traduction « le grand poisson », mot arabe الْحُوت) — cohérence à confirmer.
- Prière 2D, jeu « Que dit-on ici ? » : après `5f5e3d8`, « Allâhou akbar » n'est plus un distracteur ; confirmer que les 7 associations position → parole conviennent à toutes les écoles (le jeu 3D précise déjà qu'il y a de petites différences entre écoles).

### P1-6 — 🧑 Don en ligne /soutenir/ : mise en service de Stripe
- **État réel (23/11/2026)** : le don en ligne est un **formulaire Stripe intégré à la page** (fichiers et fonctionnement : docs/SOUTIEN-CAGNOTTE.md). Tant que les clés Stripe ne sont pas configurées côté serveur, la page affiche « La cagnotte sera bientôt disponible » et **aucun formulaire**. Le paiement de test (carte fictive) n'a pas encore été fait.
- **Action du responsable** : créer le compte Stripe ; mettre les clés de **test** (STRIPE_CLE_SECRETE, STRIPE_CLE_PUBLIABLE) en local (.dev.vars, ignoré par Git) puis dans les secrets **Preview** de Cloudflare ; ajouter le RIB et terminer la vérification du compte (nécessaire seulement pour recevoir de l'argent réel) ; décider du passage en réel (STRIPE_MODE_REEL=autorise). Fournir aussi les éventuelles **informations légales** (statut, identité du porteur, contact), non inventées, absentes de la page.
- **Action de Claude, une fois les clés de test en place** : paiement de test, console du navigateur sans erreur de CSP, Apple Pay / Google Pay (domaine à déclarer dans Stripe), pages légales (Stripe comme sous-traitant de paiement) ; puis, si la page doit être référencée, retirer <meta name="robots" content="noindex"> et l'ajouter à sitemap.xml.
- **Validation** : formulaire visible seulement quand le serveur est configuré ; montants 5 / 10 / 20 € et libre (1 à 500 €) ; aucun lien dans les jeux ; aucun lien avec les abonnements Premium.
- **À clarifier** : la demande initiale de la cagnotte était **tronquée** après « 10. RESPONSIVE ET ACCESSIBILITÉ … Aux » : les sections 11+ n'ont jamais été reçues. Le prompt de passation évoque aussi des « améliorations de contraste demandées » **dont je n'ai trouvé aucune trace** (les contrastes mesurés sont tous > 7:1). 🧑 Demander au responsable ce qui manque.
### P1-7 — 🧑 Décisions du responsable sur le village
- Choisir **définitivement** entre l'ancienne version (`backup-village-avant-refonte`, `4179ccb`) et la version actuelle (décor refondu + anciennes icônes + 3 icônes 3D pour l'École). Comparer : `git diff backup-village-avant-refonte preproduction -- monde/`. **Ne jamais modifier la sauvegarde.**
- Valider le style des 3 icônes 3D de l'École (`monde/icones/*.png`, générateur `outils/icones-ecole/`).
- Limites connues non traitées : montagnes encore proches de dunes ; certaines plaques de noms partiellement masquées selon l'angle ; **aucun test sur vrai téléphone** (seulement tactile simulé).

### P1-8 — 🧑 Mise en production (aucune autorisation donnée)
`preproduction` a 45 commits de plus que `production` (voir `ETAT-TECHNIQUE-ACTUEL.md` § 1). Ne **rien** publier sans accord explicite. Procédure existante : `outils/migration/promouvoir.sh` (documentée dans `docs/MIGRATION-PRODUCTION.md`). Avant toute publication : résoudre P1-1 à P1-5, relancer `tout.sh` (+ `NAVIGATEUR=1`), vérifier le Premium (pack privé).

### P1-9 — Comptes / profils / Firebase : non revérifiés
Hors périmètre de ma session (jamais modifiés). Les comptes **ne fonctionnent pas sur l'aperçu de préproduction** (environnement Preview sans secrets, d'après `docs/MIGRATION-REPRISE.md` — à reconfirmer). Parcours à tester **à la main avec identifiants** (non automatisable) : inscription e-mail, Google, profil enfant, entrée dans le monde, déconnexion/reconnexion, Espace Créateur.

### P1-10 — Branche locale `audio-central-wip` (`f06b916`)
Travail d'une session antérieure **non examiné**. Action : lire `git log audio-central-wip -5`, comprendre, **ne pas supprimer** ; demander au responsable si c'est à reprendre.

## P2 — Améliorations (ensuite)
- **Fichiers de débogage publiés** : `dbg_my.png`, `dbg_my2.png`, `dbg_qz.png`, `ecoute.png` sont **à la racine du dépôt et publiés** sur le site (`construire.mjs` les copie). Les retirer du dépôt (🧑 confirmer qu'ils sont inutiles ; ne pas les supprimer à l'aveugle).
- `origin/main` a 2 commits de retard sur `main`/`production` locaux : décision du responsable (rôle futur de `main`, voir `docs/MIGRATION-PRODUCTION.md` « Après la stabilisation »).
- Calendrier : le message du 29ᵉ jour peut rester affiché sur la carte de fin à la 30ᵉ lanterne si on clique très vite ; le message « Machâ'Allah… toutes les paires » du memory recouvre en partie les pastilles en bas d'écran (mineur, transitoire).
- Cagnotte : lien optionnel dans l'espace parents (`compte/`), à ne faire que sur demande (touche aux comptes).
- Intégrer les scripts `outils/audit-jeux/` dans `tout.sh` (option `NAVIGATEUR=1`), en rendant leurs chemins configurables (aujourd'hui codés en dur pour cette machine).
- Test sur **vrais appareils** (téléphone, tablette) de tout le site.
- Cohérence stylistique des 3 icônes 3D de l'École avec les icônes des autres maisons si le responsable souhaite harmoniser.

## Récapitulatif des conditions de « terminé » pour la reprise immédiate
1. P1-1, P1-2, P1-3, P1-4 (partie technique) clos et vérifiés par exécution.
2. `bash outils/tests/tout.sh` vert ; `node outils/tests/verifier.mjs` vert.
3. Rapport d'audit des six jeux remis au responsable (honnête sur ce qui n'a pas pu être testé).
4. Toutes les questions 🧑 posées au responsable de façon groupée, une seule fois.
