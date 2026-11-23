# PASSATION AU PREMIER CLAUDE — Les Lanternes de Nour

> **Lis ce document en premier, puis** `ETAT-TECHNIQUE-ACTUEL.md`, `TODO-RESTANT-PROJET.md`, `DEBRIEF-COMPLET-PROJET.md`. Les quatre documents sont cohérents entre eux (même relevé du 23/11/2026). **Vérifie toi-même l'état Git avant toute modification** (commandes en § 9).
> Aucune session précédente n'est accessible : tout ce dont tu as besoin est dans le dépôt.

## 1. Contexte en 10 lignes
- Site éducatif islamique pour enfants (3–10 ans), indépendant. Statique + fonctions serveur Cloudflare Pages + Firebase (comptes). Domaine public `leslanternesdenour.fr` **déjà servi par Cloudflare** (branche `production`, commit `da30277`).
- **Travail courant : uniquement sur la branche `preproduction`** (aperçu : `https://preproduction.lanternes-de-nour.pages.dev`, commit déployé `5f5e3d8` au 23/11).
- Le responsable valide les contenus religieux, les voix, les liens externes, les tarifs et toute mise en production. Il aime les rapports concis, l'autonomie, les commits propres et fréquents.
- Voix : ElevenLabs, **seulement les 10 voix existantes « Nour - … »** (jamais de nouvelle voix, jamais de récitation coranique synthétisée, pas de crédits gaspillés).

## 2. État actuel (synthèse — le détail est dans `ETAT-TECHNIQUE-ACTUEL.md`)
| Élément | Statut | Où |
|---|---|---|
| Site principal, accueil, portail d'entrée | Terminé et en ligne (préprod + prod) ; validations antérieures par d'autres sessions | `index.html`, `intro/`, `accueil/` |
| Monde de Nour / village 3D | Réalisé et testé (9 maisons → bonnes destinations, desktop + téléphone simulé) ; **choix de design à valider par le responsable** ; jamais testé sur vrai téléphone | `monde/` |
| Sauvegarde de l'ancien village | Terminée et vérifiée, intangible | branche `backup-village-avant-refonte` (`4179ccb`), `docs/SAUVEGARDE-VILLAGE.md` |
| École arabe de Maktoub (3 jeux) | Réalisée, testée par tests du dépôt ; **contenu arabe à faire valider par un humain compétent** ; page d'accueil de l'École : garde-fou « sans visage » en échec (P1-2) | `ecole-arabe/`, `audio/jeux/ecole-*` |
| Mascotte Maktoub | Réalisée (images WebP) ; utilisée aussi dans `/soutenir/` | `ecole-arabe/commun/maktoub/` |
| Ablutions 2D | Testé (43/43) | `ablutions/` |
| Ablutions 3D | **Audit non conclu** (P1-1) | `ablutions/jeu3d/` |
| Prière 2D | Testé (55/55) après 2 corrections ; texte/récitation des sourates dépendent de services externes (P1-4) | `priere/` |
| Prière 3D | **Test écrit, jamais exécuté** | `priere/jeu3d/` |
| Ramadan (calendrier) | Testé (87/88 ; le « échec » est une attente erronée de mon test) ; contenu cohérent ; références religieuses à valider | `calendrier/` |
| Chasse aux mots | Testée pc (58/58), téléphone non exécuté | `aventures/chasse-aux-mots/` |
| Mystères du désert | Testés pc (77/77), téléphone non exécuté | `aventures/mysteres-desert/` |
| Quiz et défis de Nour | Testés pc (254/254) + téléphone (34/34) ; 96 questions relues sans erreur trouvée | `aventures/quiz-nour/` |
| Grand Voyage de Nour | Non audité par ma session (tests du dépôt verts) | `voyage/` |
| Comptes, espace famille, profils enfants, sauvegardes | **Non touchés ni revérifiés** ; comptes non fonctionnels sur l'aperçu (Preview sans secrets, d'après la doc) | `compte/`, `functions/`, `serveur/` |
| Premium / Famille / Stripe | **Non touchés** ; Stripe en mode test, non configuré en production, aucun paiement réel | `tarifs/`, `serveur/` |
| Cagnotte `/soutenir/` | Réalisée et en ligne en préprod ; **don en ligne par formulaire Stripe intégré, fermé tant que les clés Stripe ne sont pas configurées** ; page `noindex` | `soutenir/`, `docs/SOUTIEN-CAGNOTTE.md` |
| Firebase / Cloudflare / GitHub / sécurité | Voir `ETAT-TECHNIQUE-ACTUEL.md` ; aucune protection modifiée ; aucun secret dans le dépôt | — |
| Mobile + ordinateur | Chargement des 6 jeux sans débordement sur 3 tailles ; parcours complets : voir TODO P1-3 | — |

## 3. Décisions déjà prises (ne pas les rouvrir sans demande)
- Un seul commit de travail à la fois sur `preproduction` ; push simple (jamais forcé).
- Village : version actuelle = décor refondu **+ anciennes icônes/ancienne interface** (le responsable a demandé de revenir à l'ancien modèle, de garder le nouveau décor, de retirer les deux boutons 🎮/🔤, et d'ajouter **3 nouvelles icônes 3D uniquement pour les 3 maisons de l'École**). Les versions intermédiaires sont dans l'historique (`aae34cd`, `3773e45`).
- Anciens personnages 3D conservés (les nouveaux modèles N1 restent derrière `?perso=nouveau`).
- Cagnotte : pas d'URL inventée ; `SUPPORT_POT_URL` centralisé dans `soutenir/config.js` ; pas de Stripe pour la cagnotte ; contribution facultative, aucun contenu gratuit bloqué, aucun compte à rebours ni progression financière fictive ; pas de promesse fiscale ; le projet n'est pas présenté comme une association.
- Audit des jeux : on **ne modifie pas** le contenu religieux ni les voix ; on corrige les défauts de logique/affichage/résilience.

## 4. Travail terminé (ne pas refaire)
Tout ce qui est « Terminé/Réalisé et testé » du § 2, et notamment : sauvegarde du village ; refonte et retour arrière des icônes ; 3 icônes 3D de l'École (`outils/icones-ecole/`) ; page `/soutenir/` ; audit technique des 313 clips audio du Monde ; audit des 6 manifestes d'Aventures/École (802 audios, `verifier-audios.mjs` : aucun problème) ; vérification que les 213 voix du quiz et les 165 identifiants de voix du calendrier existent ; comparaison automatique contenu ablutions 2D = 3D (0 écart) ; correctifs de la prière (`5f5e3d8`). **Ne relance pas d'audits généraux déjà faits.**

## 5. Travail restant → `TODO-RESTANT-PROJET.md` (priorisé P0/P1/P2, avec conditions de validation)

## 6. Bugs connus (liste courte)
1. **Ablutions 3D, mode Apprendre** : retour inattendu à l'écran de départ à l'étape 5 pendant un test automatisé — non élucidé (P1-1).
2. **`ecole-arabe/index.html` ne charge pas `sans-visage.js`** → 1 échec dans `tout.sh` (P1-2), préexistant.
3. **Prière 2D** : texte arabe/récitation des sourates via services externes ; message de repli ajouté, comportement en ligne non revérifié (P1-4).
4. Fichiers de débogage publiés à la racine (`dbg_*.png`, `ecoute.png`) (P2).
5. Déploiement Cloudflare : un échec transitoire « build failed to initialize in time » a eu lieu (relance manuelle = succès).

## 7. Règles permanentes (à respecter strictement)
- **Travailler exclusivement sur `preproduction`.** Ne jamais modifier `production` ni `main` sans autorisation. **Aucun déploiement en production sans accord explicite.**
- Ne jamais créer de PR sauf demande ; ne jamais forcer un push ; ne jamais supprimer un verrou Git sans en connaître l'origine ; ne pas créer de worktree ni de branche de « réservation ».
- Préserver : comptes utilisateurs, profils enfants, sauvegardes/progressions, récompenses. Ne pas dupliquer les systèmes existants (socle `monde/socle/`, `aventures/commun/`, `ecole-arabe/commun/`). Ne pas casser les jeux fonctionnels. **Préserver les versions précédentes et les sauvegardes** (`backup-village-avant-refonte`, `sauvegarde-*`).
- Ne pas toucher à Firebase (règles/comptes), aux prix, aux paiements, aux abonnements, au Premium sans nécessité et sans demande ; ne **modifier aucune permission de sécurité** et ne contourner aucun blocage.
- Ne **jamais** afficher ni écrire le jeton Cloudflare ni aucun secret ; ne rien acheter ni souscrire ; préserver MX/SPF/DKIM/DMARC.
- Voix : ne pas modifier les voix et leurs associations sans demande ; **ne pas gaspiller de crédits audio** ; seulement les 10 voix « Nour - … » (créer/supprimer/renommer aucune voix, jamais plus de 10) ; **ne jamais synthétiser de récitation coranique avec ElevenLabs** ; les prononciations arabes restent « à valider » tant qu'un humain compétent ne les a pas validées.
- Contenu religieux incertain : **le signaler, ne pas le modifier arbitrairement.** Ne pas inventer de liens, de données ni d'informations juridiques.
- Ne pas demander de validation pour chaque petite décision technique ; avancer de façon autonome, tester, faire des commits propres et fréquents ; signaler les vrais blocages et risques sérieux.
- Confidentialité : ne mettre aucune donnée personnelle du responsable dans des requêtes vers des services externes.
- Les trois jeux d'aventure existants (chasse aux mots, mystères, quiz) : ne pas les refaire inutilement ; corriger seulement.

## 8. Fichiers importants
- Entrée/construction : `outils/construire.mjs` (→ `dist/`, garde-fou de branche, exclut `docs/`, `outils/`, `*.md`) ; `wrangler.toml` (préproduction) ; `_headers` (CSP stricte : tout nouveau domaine externe doit y être autorisé) ; `version.json` généré (commit déployé).
- Village : `monde/scene.js` (3D, `texIcone`, `texNomAncien`), `monde/village.js` (HUD, panneau, jeux en iframe), `monde/batiments.js` (9 maisons, `image:` pour les 3 maisons de l'École), `monde/icones/*.png`.
- Tests : `outils/tests/tout.sh` (suite hors ligne), `outils/tests/verifier.mjs` (fichiers/liens/voix), `outils/tests/audit-audio-monde.mjs` (audio du Monde), `outils/audit-jeux/` (navigateur, voir son `LISEZMOI.md`).
- Voix : `audio/` + `*/voix/voix.json`, `outils/voix/` (inventaire/vérification), `docs/VOIX-ATTRIBUTION.md`.
- Historique/état : `docs/` (migration, audits, validations des voix), `_documentation/` (guides Cloudflare/Firebase, sauvegardes, sécurité).

## 9. Commandes utiles
```bash
# État Git (première chose à faire)
cd /home/user/leslanternesdenour.github.io && git branch --show-current && git status --short && git fetch origin && git rev-list --left-right --count origin/preproduction...HEAD && git log -3 --oneline
# Construire + vérifier
node outils/construire.mjs && node outils/tests/verifier.mjs | tail -1
# Suite complète hors ligne (≈ 6–10 min)
bash outils/tests/tout.sh
# Serveur local pour les tests navigateur
node outils/serveur-preprod.mjs 8791
# Déployer la préproduction = pousser (Cloudflare construit tout seul)
git push origin preproduction        # puis : curl -s https://preproduction.lanternes-de-nour.pages.dev/version.json
# Comparer / restaurer l'ancien village
git diff backup-village-avant-refonte preproduction -- monde/      # restauration : docs/SAUVEGARDE-VILLAGE.md
# Icônes 3D de l'École
node outils/icones-ecole/generer.mjs
```
**Pièges** : ne jamais utiliser `$$` dans Bash ici ; `sleep` long en avant-plan est bloqué (utiliser une boucle `until … ; do sleep N; done` avec `timeout`) ; le serveur local peut mourir (le relancer) ; un contrôle de sécurité de l'outil peut refuser une commande contenant le mot « remove » même sans suppression : utiliser l'outil d'édition de fichier plutôt que de contourner.

## 10. Précautions Git
`preproduction` doit rester la branche active. Commits petits et cohérents ; message qui explique le « pourquoi » ; pas de `reset --hard`, pas de `push --force`, pas de `git clean -fd`. Si une opération Git est « bloquée », **identifier l'origine avant d'agir** (`git status`, `ls .git`, `find .git -name '*.lock'`, `ps aux | grep git`). Fin de session : aucun fichier non suivi important, tout poussé (`git push origin preproduction`), `git status` propre.

## 11. Inventaire des fichiers de MA session (vérifiable par `git show --stat <commit>`)
**Créés** : `ecole-arabe/lecture/**` et `ecole-arabe/chiffres/**` (jeux 2 et 3, `3ef77da`, `0463b58`) ; `audio/jeux/ecole-lecture/**` (125 audios) et `audio/jeux/ecole-chiffres/**` (64) ; `docs/SAUVEGARDE-VILLAGE.md` ; `monde/icones/ecole-{lettres,lecture,chiffres}.png` ; `outils/icones-ecole/{rendu.html,generer.mjs,LISEZMOI.md}` ; `soutenir/{index.html,soutenir.css,soutenir.js,config.js}` ; `docs/SOUTIEN-CAGNOTTE.md` ; `outils/tests/audit-audio-monde.mjs` ; `outils/audit-jeux/**` ; `docs/audit-jeux-2026-11-23/*.png` ; les 4 documents de passation.
**Modifiés** : `monde/scene.js`, `monde/village.js`, `monde/batiments.js`, `monde/index.html`, `monde/monde.css` ; `ecole-arabe/index.html` (cartes débloquées) ; `monde/socle/recompenses.js` (récompenses des jeux de l'École) et `compte/client.js` (clé `ecole_chiffres` ajoutée à la liste des sauvegardes synchronisées ; détail : `git show 0463b58 -- compte`) ; `outils/voix/jeux/*` et `outils/tests/*` (inventaire/tests des jeux de l'École) ; `index.html` et `decouvrir/index.html` (lien « Soutenir le projet » dans le pied de page) ; `priere/app.js`, `priere/index.html` (correctifs `5f5e3d8`).
**Supprimé** : un seul fichier — `monde/icones3d.js` (retiré par `7e01cca` quand les anciennes icônes ont été rétablies ; **récupérable à `3773e45`**).
**Configurations** : aucune configuration Cloudflare/Firebase/GitHub modifiée par moi.

## 12. Prochaine tâche à réaliser
**Reprendre l'audit des six jeux là où il s'est arrêté** (`TODO-RESTANT-PROJET.md` P1-1 → P1-3) :
1. Élucider P1-1 (Ablutions 3D, mode Apprendre) : rejouer à la main puis relancer `outils/audit-jeux/ablu3d-jeu.js`.
2. Exécuter `outils/audit-jeux/pri3d-jeu.js` (Prière 3D) et corriger ce qui est réellement défectueux.
3. Parcours téléphone/tablette des autres jeux ; corriger P1-2 (une ligne dans `ecole-arabe/index.html`) ; relancer `tout.sh`.
4. Remettre au responsable le **rapport d'audit final** (tableau des six jeux, honnête sur ce qui n'a pas pu être testé) et lui poser **une seule fois** les questions 🧑 (clés Stripe et RIB, validations religieuses, choix du village, contraste/sections manquantes de la cagnotte).

## 13. Modèle et effort recommandés pour la reprise
**Claude Opus 5.5 (contexte étendu), effort « high »** pour cette reprise : dépôt volumineux, débogage 3D (swiftshader) et tests longs. Sonnet 5.5 convient pour des corrections ciblées ou la maintenance courante.

## 14. MESSAGE DE DÉMARRAGE À COLLER DANS LA PREMIÈRE SESSION CLAUDE CODE
```
Tu reprends le projet « Les Lanternes de Nour » (dépôt GitHub leslanternesdenour/leslanternesdenour.github.io, dossier /home/user/leslanternesdenour.github.io). Tu n'as accès à aucune conversation précédente : tout est dans le dépôt.

1) Lis INTÉGRALEMENT, à la racine du dépôt, dans cet ordre : PASSATION-PREMIER-CLAUDE.md, ETAT-TECHNIQUE-ACTUEL.md, TODO-RESTANT-PROJET.md, DEBRIEF-COMPLET-PROJET.md.
2) AVANT toute modification, vérifie toi-même l'état Git : branche active (doit être « preproduction »), « git status », dernier commit (« git log -3 »), écart avec origin/preproduction (git fetch puis git rev-list --left-right --count origin/preproduction...HEAD), absence de verrous/opérations en cours (ls .git ; find .git -name '*.lock' ; git worktree list). Confirme-moi que « preproduction » est accessible et non bloquée, et mentionne toute modification non enregistrée sans la jeter.
3) Comprends ce qui est déjà terminé (PASSATION § 2 et § 4) et NE LE REFAIS PAS (pas d'audit général déjà réalisé, pas de refonte des jeux).
4) Reprends directement la prochaine tâche prioritaire (PASSATION § 12 / TODO P1-1 à P1-3) : audit des six jeux là où il s'est arrêté (Ablutions 3D, Prière 3D, parcours téléphone/tablette), correction des défauts réels, puis rapport honnête au responsable.
5) Respecte TOUTES les règles permanentes (PASSATION § 7) : travail uniquement sur « preproduction » ; jamais de modification de « production » ni de « main » et aucun déploiement en production sans accord explicite ; aucun push forcé ; préserver comptes, profils enfants, progressions, récompenses, sauvegardes (dont la branche backup-village-avant-refonte, intangible) ; ne pas toucher à Firebase, aux prix ni aux paiements ; aucun secret affiché ; ElevenLabs : seulement les 10 voix « Nour - … », aucun crédit gaspillé, jamais de récitation coranique synthétisée ; contenu religieux incertain = le signaler, ne pas le modifier ; n'invente aucun lien ni information juridique (le don en ligne attend les clés Stripe du responsable).
Travaille de façon autonome, avec des commits propres et fréquents (« git push origin preproduction » simple), teste ce que tu modifies, et ne me demande pas de valider chaque petite décision technique. Signale seulement les vrais blocages. Modèle recommandé : Claude Opus 5.5, effort « high ».
```
