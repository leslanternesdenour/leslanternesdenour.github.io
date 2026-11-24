# ÉTAT TECHNIQUE ACTUEL — Les Lanternes de Nour

> Relevé du **23/11/2026** (fin de session). Tout ce qui est écrit ici a été **vérifié pendant la passation** par une commande ; ce qui ne l'a pas été est marqué « non vérifié ». Complète : `PASSATION-PREMIER-CLAUDE.md`, `DEBRIEF-COMPLET-PROJET.md`, `TODO-RESTANT-PROJET.md`.
> **À refaire AVANT de travailler** (l'état peut avoir changé) : voir « Vérifier l'état en 60 secondes » en bas.

## 0. MISE À JOUR 24/11/2026 — comptes, e-mails, DMARC (prime sur ce qui suit en cas de contradiction)
- **Dernier commit `preproduction` : voir `git log -1`** (= `origin/preproduction`). **Production : `c6c5a50`** (24/11/2026) = l'ancienne production `4fd913a` + **seulement** les trois musiques (autorisé par le créateur). **La production n'a PAS le système de comptes** (porte parent, vérification e-mail, e-mails Resend, accueil JOUER) : 16 commits de `preproduction` n'y sont pas. **Ne jamais promouvoir toute la branche sans accord explicite** : la porte des comptes est fail-closed (pages de jeu en 503 si les secrets de production `SESSION_SECRET`, `FIREBASE_COMPTE_SERVICE`, `CREATOR_UID`, `EMAIL_CLE_API` manquent) ; pour un report partiel, travailler dans un worktree séparé issu de `origin/production` et n'y copier que les fichiers voulus (méthode utilisée pour la musique, voir `git show c6c5a50 --stat`). Dossier local : `C:Userszakarleslanternesdenour-preproduction`.
- **Préproduction avec comptes opérationnels** : l'environnement Preview a ses secrets (`SESSION_SECRET`, `FIREBASE_COMPTE_SERVICE`, `CREATOR_UID`, `EMAIL_CLE_API`). `/api/sante` → `courriel: "resend"`. Les secrets ne sont posés que dans Cloudflare ; un secret n'est pris en compte qu'après un **nouveau déploiement** (un commit vide ne reconstruit pas).
- **Comptes** : Firebase Auth (projet `lanternes-de-nour`, partagé préprod/prod) + session serveur `ldn_session`. Vérification de l'adresse **obligatoire côté serveur** (`serveur/api.js` : `/api/enfants*` et `/api/premium/*` répondent 403 `email-non-verifie` ; `functions/_middleware.js` + `serveur/garde-pages.js` gardent les 6 pages de jeu). 4 profils enfants max par compte famille.
- **E-mails** : `serveur/email.js` (Resend ou Brevo selon `EMAIL_FOURNISSEUR`), modèles `serveur/email-modeles.js`, liens d'action `base.lienAction` → page `/compte/action/` (vérification, mot de passe). 90 s entre deux envois, 6/jour/compte. Détail : `docs/EMAILS-PERSONNALISES.md`. Variables : `EMAIL_FOURNISSEUR`, `EMAIL_EXPEDITEUR_ADRESSE`, `EMAIL_EXPEDITEUR_NOM` (dans `wrangler.toml`) + secret `EMAIL_CLE_API` (Cloudflare seulement).
- **Tests réels réussis le 24/11 (ne pas refaire)** : inscription → e-mail de vérification → lien → déblocage automatique → e-mail de confirmation ; mot de passe oublié → lien → nouveau mot de passe → connexion → ancien lien refusé ; suppression du compte → e-mail de confirmation. DKIM et SPF « pass » dans Gmail. Compte de test supprimé.
- **DMARC — seul point ouvert** : aucun enregistrement `_dmarc` (revérifié le 24/11 sur `chris.ns.cloudflare.com`, `stella.ns.cloudflare.com`, 1.1.1.1, 8.8.8.8). SPF `v=spf1 include:mx.ovh.com -all` et MX OVH intacts (ne pas toucher). Claude n'a aucun accès Cloudflare (navigateur non connecté, pas de jeton, pas de wrangler). À ajouter par le responsable dans Cloudflare > DNS : TXT `_dmarc` = `v=DMARC1; p=none; rua=mailto:leslanternesdenour@gmail.com; adkim=r; aspf=r`. L'envoi fonctionne sans.
- **Route de La Mecque** : ouverte en production (`4fd913a`). « La grande route » exige oasis ET camp découverts et le camp est Premium : fermée aux comptes non Premium (décision en attente : exiger l'oasis seule).
- **Musiques (Suno, voix seules), trois moments** : (1) jeu habituel, village et désert : « Glowing Village » = `monde/musique/village-nasheed.mp3` (même enregistrement, corrélation 0,994) ; (2) dès qu'on arrive sur la Route vers La Mecque : « Golden Hour Hum » = `voyage/musique/grand-voyage-golden-hour.mp3` ; (3) arrivée à La Mecque : « Sacred City at Dusk » = `voyage/musique/mecque-sacred-city-at-dusk.mp3`. Les fichiers (2) et (3) : 2 min 21 et 2 min 17, −15 LUFS (niveau proche du nasheed, −13), boucle recollée en fondu de 4 s, coupure sous 70 Hz. Table `PISTES` dans `voyage/js/sons.js` (chemins relatifs à la page `/voyage/`, boucle `loopStart/loopEnd`). Tests : `outils/tests/voyage-musique.test.mjs`, `voyage-musique-zone.test.mjs`. Prompts et versions Suno : `C:\Users\zakar\.claude\backups\voyage-ambiance-suno\SUNO-GRAND-VOYAGE.md` (hors dépôt). **Qui joue où** : règle pure dans `voyage/js/musique-zone.js` (`pisteMusique(enRoute, regionId)` : hors Route → `jeu` ; Route → `route` ; régions `arrivee` et `cite` → `mecque`), appelée par `verifierZone()` dans `voyage/js/main.js` via `S.choisirMusique` (région fournie par `route.regionId()`). Fondu enchaîné linéaire de 5 s (`DUREE_FONDU`), la nouvelle piste est chargée avant de baisser l'ancienne, pause de 6 s entre deux changements. Si on remplace un fichier audio : changer le `?v=` dans `PISTES`. Aucun audio Talbiya n'existe.
- **Abonnements Premium (Stripe, mode test)** : parcours complet en préproduction. Formule choisie sur `/tarifs/` → `POST /api/paiement/session` (Checkout Stripe, prix `STRIPE_PRIX_*` dans `wrangler.toml`) → retour `/compte/?paiement=ok&session_id=…` → `POST /api/abonnement/synchroniser` : **le serveur relit la session chez Stripe** (clé secrète), vérifie qu'elle appartient au compte et active tout de suite, sans attendre le webhook ; sans identifiant, il relit l'abonnement connu ou le cherche par compte (métadonnée `uid`). Les droits sont ceux du **compte**, profils enfants compris (4 max) : `serveur/droits.js`. Échec de paiement : accès suspendu, `/api/moi` renvoie `abonnement.aRegulariser` et la page propose le portail Stripe. Résiliation : `/api/abonnement/resilier`, accès conservé jusqu'à la fin de la période. Tests : `abonnement-synchro.test.mjs` (simulé), `compte-abonnement.test.mjs` (page), et contre le **vrai Stripe en mode test** (clés de `.dev.vars`, jamais affichées) : `LDN_STRIPE_TEST=1 node --test outils/tests/stripe-integration.test.mjs outils/tests/stripe-synchro-reel.test.mjs`.
- **Abonnements : ce qui reste à régler à la main** : (1) **webhook Stripe**, utile pour les renouvellements, échecs et résiliations faits hors du site : dans Stripe (mode test) → Développeurs → Webhooks → ajouter le point de terminaison `https://preproduction.lanternes-de-nour.pages.dev/api/stripe/webhook` avec les événements `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `checkout.session.completed`, `invoice.payment_failed` ; copier le secret de signature (`whsec_…`) dans Cloudflare (Preview) sous `STRIPE_SECRET_WEBHOOK`, puis relancer le déploiement (changement de fichier réel). Sans lui, l'activation au paiement fonctionne quand même et l'état se met à jour à chaque ouverture de l'Espace famille. (2) **Contenu Premium des zones** : le code d'ouverture est complet, mais le pack privé `/home/user/premium-lanternes` n'est pas sur cette machine et le stockage R2 (`R2_PREMIUM`, service payant) n'est pas lié (`/api/sante` : `stockagePremium: non`) ; une zone ne s'ouvre que si son contenu est reçu. (3) **Production** : aucune clé `STRIPE_*`, paiements fermés (`/api/paiement/mode` = ferme) ; le mode réel reste une décision explicite du créateur.
- Les sections 1 à 3 ci-dessous datent du 23/11 : les commits et l'état des secrets Preview y sont périmés (voir ci-dessus).

## 1. Git (dépôt local `/home/user/leslanternesdenour.github.io`)
- **Branche active : `preproduction`** (à laisser active).
- **Dernier commit de code/contenu** : `5f5e3d805f2ecc0e30bb63fd4c8ad816bd6608fa` — « Prière : « Allâhou akbar » n'est plus proposé en mauvaise réponse… ». **Un commit de passation (documents + `outils/audit-jeux/` + `docs/audit-jeux-2026-11-23/`) vient APRÈS** : le retrouver avec `git log -3 --oneline`.
- **Synchronisation GitHub** : `preproduction` locale = `origin/preproduction` (0 commit d'écart) au moment du relevé, **avant** le commit de passation ; le résultat exact final de `git status` et de la synchronisation est donné dans le rapport de fin de session et dans « Vérifier l'état en 60 secondes ».
- **Opérations en cours** : aucune (pas de `MERGE_HEAD`, `REBASE_*`, `CHERRY_PICK_HEAD`, `REVERT_HEAD`, `BISECT_*`). Seul `.git/ORIG_HEAD` existe : fichier résiduel **normal** laissé par une opération antérieure (reset/merge/pull) ; **ce n'est pas un verrou**, ne pas le supprimer.
- **Verrous** : `find .git -name '*.lock'` → aucun. **Worktrees** : un seul (`git worktree list`). **Stash** : vide.
- **Processus** : aucun navigateur ni test de ma session ne reste ouvert (arrêtés explicitement). Un serveur statique local `node outils/serveur-preprod.mjs 8791` (aide de test, sans effet sur Git) peut tourner : l'arrêter avec `pkill -f serveur-preprod` si besoin ; **il ne verrouille rien**.
- **Fichiers non suivis / modifications locales** : aucun au moment du relevé (hors fichiers du commit de passation).

### Branches (locales et GitHub) — NE PAS MODIFIER, sauf `preproduction`
| Branche | Commit | Rôle |
|---|---|---|
| **`preproduction`** | `5f5e3d8` (+ passation) | **Branche de travail unique.** Cloudflare Pages en construit l'aperçu. |
| `production` (= `origin/production`) | `da30277` | Branche de **production Cloudflare** (`wrangler.toml` de production, voir `docs/migration/`). **Ne jamais pousser dessus sans autorisation explicite.** |
| `main` local | `da30277` | Identique à `production`. |
| `origin/main` | `011ee7b` | **2 commits de retard** sur `main` local (préexistant ; je n'y ai pas touché). Ne pas « corriger » sans décision du responsable. |
| `backup-village-avant-refonte` | `4179ccb3dfe9c254b07eb4c0a0d1b9f607122778` | **Sauvegarde intangible** de l'ancien village (comparaison/restauration : `docs/SAUVEGARDE-VILLAGE.md`). **Ne jamais la modifier ni la supprimer.** |
| `sauvegarde-production-2026-11-22` (origin) | `dc39d93` | Sauvegarde de l'ancien `main` (GitHub Pages) avant migration. Intangible. |
| autres `origin/*` (`abonnements`, `developpement`, `visuel`, `voix*`, `intro-*`, `personnages-*`, `portail-monde-nour`, `audit-*`, `sauvegarde-*`) | divers | Anciennes branches de travail/PR/sauvegardes : **historique à conserver**, rien à faire. |
| `audio-central-wip` (local) | `f06b916` | Travail audio en cours d'une session précédente — **non examiné par moi** ; ne pas supprimer sans comprendre. |

Écart `preproduction` ↔ `production` : `preproduction` a **45 commits que `production` n'a pas** (à partir de `47bec94`, dont Loumi/habitants, Aventures, École arabe, village, cagnotte, etc.) ; `production` a **15 commits absents de `preproduction`** (fusions « Merge branch 'preproduction' into production » et `wrangler.toml` de production). C'est le fonctionnement prévu (`bash outils/migration/promouvoir.sh` fabrique `production` depuis `preproduction`). **Aucune mise en production n'est autorisée sans accord explicite.**

## 2. GitHub
- Dépôt : `leslanternesdenour/leslanternesdenour.github.io`. Push simple `git push origin preproduction` fonctionne (les pushes de tags n'aboutissent pas : ne pas en dépendre). **Aucune protection de branche n'a été modifiée.** Aucune PR ouverte par moi.
- GitHub Pages servait l'ancien site (`main`) **avant** la migration ; depuis le 22/11 le domaine est servi par Cloudflare (voir 3).

## 3. Cloudflare (relevé réel du 23/11/2026 via `version.json`)
| Cible | URL | Commit réellement servi | Branche |
|---|---|---|---|
| **Préproduction** | `https://preproduction.lanternes-de-nour.pages.dev` | **`5f5e3d805f2ecc0e30bb63fd4c8ad816bd6608fa`** (vérifié par `GET /version.json` : le déploiement du dernier push est passé) | `preproduction` |
| **Production (pages.dev)** | `https://lanternes-de-nour.pages.dev` | `da30277c10eef567d9308cb76874fbbdbe2f91ec` | `production` |
| **Production (domaine)** | `https://leslanternesdenour.fr` | `da30277c10eef567d9308cb76874fbbdbe2f91ec` | `production` |
- Projet Pages : **`lanternes-de-nour`** ; *Production branch* = `production` ; la préproduction est un **déploiement d'aperçu** de `preproduction` (dans `docs/MIGRATION-REPRISE.md` : l'environnement *Preview* est **sans secrets**, donc **les comptes n'y fonctionnent pas** — non revérifié par moi ; l'écoute des voix, le portail, le village et les jeux y fonctionnent).
- **Incident connu (ma session)** : le déploiement de `aae34cd` a échoué **à l'étape `initialize`** avec « build failed to initialize in time » (aucun code exécuté : incident de plateforme). Le responsable a cliqué « Nouvelle tentative de déploiement » → succès. Hypothèse **non prouvée** : incident Cloudflare transitoire. Si cela se reproduit : relancer le déploiement ; après deux échecs identiques, contacter le support Cloudflare avec l'identifiant du déploiement.
- Les déploiements de ma session, **tous vérifiés en ligne par `version.json` + comparaison de hachage de fichiers** : `aae34cd`, `3773e45`, `7e01cca`, `7b82a0c`, `3c1c6a1`, `065a8cf` (+ page `/soutenir/` testée en ligne : 200, aucune erreur JS ni CSP), puis `5f5e3d8` (version.json seulement).
- **Distinguer** : *commit local* ≠ *commit poussé* ≠ *déploiement Cloudflare réussi* ≠ *fonctionnalité testée en ligne*. Pour `5f5e3d8` : poussé ✔, déployé ✔ (`version.json`), **correctif de la prière non retesté en ligne** (testé en local : 55/55).
- **Aucun déploiement en production n'a été fait ni tenté.** Je n'ai aucun accès au tableau de bord Cloudflare ni jeton (rien n'est stocké dans le dépôt).

## 4. Firebase / comptes / Premium / Stripe (non modifiés par ma session)
D'après `docs/MIGRATION-PRODUCTION.md`, `docs/MIGRATION-REPRISE.md`, `_documentation/` (**non revérifié par moi**) : projet Firebase `lanternes-de-nour` (Auth e-mail+mot de passe et Google ; Firestore en mode Production avec règles actives) partagé par préproduction et production ; secrets (`SESSION_SECRET`, `FIREBASE_COMPTE_SERVICE`, `CREATOR_UID`) dans Cloudflare, **jamais dans le dépôt** ; **Stripe non configuré en production** (code en mode test uniquement, aucun paiement réel possible) ; R2/Premium privé non activé (simulé). **Ne rien changer ici sans demande.**

## 5. Tests — résultat réel de la session
Exécutés le 23/11/2026 (`bash outils/tests/tout.sh`, hors ligne, sans navigateur) : **41 étapes, toutes vertes sauf une** :
- ❌ **« Mode sans visage : garde-fous » : 8 réussis, 1 échec** — `ecole-arabe/index.html ne charge pas sans-visage.js`. **Préexistant** : la page d'accueil de l'École arabe n'a jamais chargé ce script depuis sa création (`6ab0a4c`) ; les trois jeux (`lettres`, `lecture`, `chiffres`) le chargent. **Non corrigé** (passation) → `TODO-RESTANT-PROJET.md` P1-2.
- ⚠️ « Aucune fuite Premium » : **sauté** (le pack privé `/home/user/premium-lanternes` est absent de cette machine) ; à lancer là où il existe.
- Étapes navigateur (`NAVIGATEUR=1`) : **non lancées**.
- Vérificateur de fichiers/liens/voix : `node outils/tests/verifier.mjs` → **3137 vérifications, 0 échec**.
- Tests des jeux d'Aventures : ablutions 3/3, chasse aux mots 13/13, quiz 11/11, mystères 9/9, voyage-régions 3/3.
- Audit navigateur de ma session (`outils/audit-jeux/`) : résultats dans `DEBRIEF-COMPLET-PROJET.md` § 10.

## 6. Environnement de cette machine (utile pour rejouer les tests ; propre à la session cloud)
- Node 22 ; Playwright : `/opt/node-tools/node_modules/playwright` (Chromium préinstallé ; ne pas réinstaller) ; three.js : `/home/user/node_modules/three` ; `NODE_PATH=/opt/node-tools/node_modules` pour les scripts hors dépôt.
- Les scripts `outils/audit-jeux/*.js` contiennent des chemins **codés en dur** (`/tmp/claude-0/aud/…` pour les captures, `/opt/node-tools/…`, `/home/user/node_modules/three`) : créer `mkdir -p /tmp/claude-0/aud` ou adapter. Le serveur local : `node outils/serveur-preprod.mjs 8791` (il s'arrête parfois : le relancer). Le CDN three.js est redirigé vers le dossier local par `base.js`.
- ElevenLabs : accès par proxy (aucune clé à fournir). **Aucun crédit n'a été dépensé** par ma session.

## 7. Vérifier l'état en 60 secondes (à exécuter en premier)
```bash
cd /home/user/leslanternesdenour.github.io
git branch --show-current            # doit afficher : preproduction
git status --short                   # doit être vide (sinon : comprendre, ne rien jeter)
git fetch origin && git rev-list --left-right --count origin/preproduction...HEAD   # 0 0
git log -3 --oneline
ls .git | grep -E "MERGE_HEAD|REBASE|CHERRY|REVERT|index.lock"; find .git -name "*.lock"   # rien
git worktree list                    # un seul worktree
curl -s https://preproduction.lanternes-de-nour.pages.dev/version.json
node outils/construire.mjs && node outils/tests/verifier.mjs | tail -1
```
