# ÉTAT TECHNIQUE ACTUEL — Les Lanternes de Nour

> Relevé du **23/11/2026** (fin de session). Tout ce qui est écrit ici a été **vérifié pendant la passation** par une commande ; ce qui ne l'a pas été est marqué « non vérifié ». Complète : `PASSATION-PREMIER-CLAUDE.md`, `DEBRIEF-COMPLET-PROJET.md`, `TODO-RESTANT-PROJET.md`.
> **À refaire AVANT de travailler** (l'état peut avoir changé) : voir « Vérifier l'état en 60 secondes » en bas.

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
