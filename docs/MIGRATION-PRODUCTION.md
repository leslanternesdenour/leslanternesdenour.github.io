# ✅ ÉTAT FINAL (22/11/2026) — migration TERMINÉE

- `leslanternesdenour.fr` et `www.leslanternesdenour.fr` sont servis par **Cloudflare Pages** (projet `lanternes-de-nour`, branche `production`, commit déployé `3bd2b68`), HTTPS actif (certificats émis). DNSSEC : désactivé (vérifié par l'API avant la bascule).
- DNS modifié : supprimés 4 A + 4 AAAA GitHub Pages (apex) et le CNAME `www` → GitHub ; créés CNAME apex et `www` → `lanternes-de-nour.pages.dev` (proxifiés). **MX, TXT (SPF…) et autres enregistrements intacts.** Sauvegarde : `docs/migration/dns-avant-bascule.json`.
- Sauvegarde Git : branche `sauvegarde-avant-publication-2026-11-22` (= `production` avant publication, qui contient `main` `dc39d93`) et `sauvegarde-production-2026-11-22`.
- `main` = `production` (fusion avance rapide). Non publié par construction : `outils/personnages/*`. Stripe/R2 non configurés (la page Tarifs affiche « Le paiement n'est pas encore ouvert. »).
- Retour arrière DNS : `basculer-cloudflare.mjs --restaurer` (voir docs/MIGRATION-REPRISE.md §3).

# Mise en production sur `leslanternesdenour.fr` — mode d'emploi de la bascule

État au 22/11/2026. **Tout ce qui peut se faire depuis le dépôt est fait et testé. Les trois opérations ci-dessous exigent l'accès au compte Cloudflare (tableau de bord ou jeton d'API) et au DNS du domaine : la session de développement n'y a pas accès.** Durée estimée : 20 à 30 minutes. Le retour en arrière est possible à chaque étape.

## Ce qui est prêt
- **Branche `production`** (créée par `bash outils/migration/promouvoir.sh`) = `preproduction` + `wrangler.toml` de production (`ENVIRONNEMENT = "production"`). `main` n'est **pas** touchée (GitHub Pages continue de servir le site actuel : filet de sécurité intact).
- **Garde-fou de build** (`outils/construire.mjs`, 13 tests) : « production » (et « main ») ne se construisent que si leur `wrangler.toml` déclare la production ; « preproduction » ne se construit qu'avec un `wrangler.toml` de préproduction ; toute autre branche est refusée. Le dossier de production est celui de la préproduction **moins** les outils internes et le `noindex` global (`/compte/`, `/admin/`, `/apercu/`, `/api/` restent en noindex), **plus** le `sitemap.xml`.
- **Répétition générale** (`bash outils/migration/repetition-production.sh`) : dossier de production construit et servi en local, parcours complets rejoués : portail 83/83, comptes familiaux et profils 78/78.
- **Outil de vérification du site publié** : `node outils/migration/verifier-production.mjs https://leslanternesdenour.fr --mode production --navigateur`.
- **Sauvegarde** : branche `sauvegarde-production-2026-11-22` = `main` au commit `dc39d93`.

## Étapes (une seule bascule, dans cet ordre)

### Avant : Firebase et Google (sinon la connexion Google échouera sur le nouveau domaine)
1. Console Firebase → *Authentication* → *Paramètres* → **Domaines autorisés** : ajouter `leslanternesdenour.fr` et `www.leslanternesdenour.fr`.
2. Google Cloud → *API et services* → *Identifiants* : si la clé API web du projet a des **restrictions de référent HTTP**, y ajouter `https://leslanternesdenour.fr/*` et `https://www.leslanternesdenour.fr/*`.

### Cloudflare — publier la production
3. Projet Pages **lanternes-de-nour** → *Settings* → *Builds & deployments* → **Production branch : `production`** (au lieu de `preproduction`). Cloudflare construit aussitôt la production. Les secrets déjà saisis (*SESSION_SECRET*, *FIREBASE_COMPTE_SERVICE*, *CREATOR_UID*) sont ceux de l'environnement **Production** : **rien à ressaisir**. Ne définir **aucune** variable `STRIPE_*` ni `R2_PREMIUM`.
   - Contrôle immédiat sur `https://lanternes-de-nour.pages.dev` : `version.json` doit indiquer la branche `production`, `/api/sante` l'environnement `production` (sans détail de configuration).
   - La préproduction passe en déploiements d'aperçu (*Preview*) : pour continuer à la tester avec les comptes, copier les trois secrets dans l'environnement **Preview** (ou l'ignorer).
4. *Custom domains* du projet → **Set up a custom domain** : `leslanternesdenour.fr`, puis `www.leslanternesdenour.fr`.

### DNS (selon l'hébergeur de la zone)
5. **Si la zone `leslanternesdenour.fr` est sur Cloudflare** : l'étape 4 crée seule les enregistrements ; supprimer les anciens enregistrements `A` vers GitHub Pages (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) et le `CNAME` `www` vers `leslanternesdenour.github.io`.
   **Si la zone est chez le bureau d'enregistrement** : l'apex (`leslanternesdenour.fr`) ne peut pas être un `CNAME` ; la solution propre est de **transférer la gestion DNS à Cloudflare** (ajouter le site à Cloudflare, puis changer les serveurs de noms chez le bureau d'enregistrement). Sinon : `CNAME www → lanternes-de-nour.pages.dev` et redirection de l'apex vers `www` chez le bureau d'enregistrement.
6. Attendre le certificat HTTPS (quelques minutes, automatique), puis lancer l'outil de vérification (ci-dessous). **Ne rien fusionner dans `main` pendant 24 à 48 h** : GitHub Pages reste le filet de sécurité.

### Après la stabilisation (24 à 48 h)
7. Fusionner `production` dans `main` (`git checkout main && git merge --ff-only production && git push`) : `main` redevient la vérité du dépôt. Optionnel : repasser la *Production branch* sur `main` (le `wrangler.toml` de `main` est alors celui de production, le garde-fou l'accepte) ; désactiver GitHub Pages (*Settings → Pages*) pour que l'ancien site ne puisse plus être servi par erreur.

## Vérification après bascule
```bash
node outils/migration/verifier-production.mjs https://leslanternesdenour.fr --mode production --navigateur
```
Contrôle : HTTPS et redirection HTTP→HTTPS, `www`, hébergeur = Cloudflare (plus GitHub), branche déployée, les 16 pages, indexabilité (accueil indexable ; `/compte/`, `/admin/`, `/apercu/` en noindex), robots/sitemap, en-têtes de sécurité, aucun fichier interne publié, API (`/api/sante`, 401 sans connexion, requêtes d'un autre site refusées), catalogue sans contenu Premium, les 313 fichiers audio, les modèles 3D, et, avec `--navigateur`, le portail + la voix + le village + les trois jeux sur ordinateur **et** téléphone.
**À tester à la main (identifiants requis, non automatisable)** : inscription e-mail, connexion Google, création d'un profil enfant, entrée dans le monde, déconnexion/reconnexion, Espace Créateur.

## Retour en arrière (à tout moment)
- **Avant l'étape 4 ou après l'étape 3 seule** : remettre *Production branch* sur `preproduction` ; rien d'autre n'a changé.
- **Après le DNS** : remettre les enregistrements GitHub Pages (4 `A` ci-dessus + `CNAME www`) ; `main` n'ayant pas bougé, l'ancien site revient tel quel (délai = TTL DNS). 
- **Après la fusion dans `main`** : `git push origin sauvegarde-production-2026-11-22:main --force-with-lease` restaure exactement l'ancien `main` (à ne faire qu'en connaissance de cause).

## Données et sécurité préservées
Comptes, familles, profils enfants et progressions sont dans **Firebase** (projet `lanternes-de-nour`), **le même pour la préproduction et la production** : rien n'est copié, recréé ni réinitialisé. Les progressions locales (navigateur) restent sur l'appareil de chaque enfant. Aucun secret n'est dans le dépôt ; aucun paiement réel n'est possible (Stripe non configuré en production) ; aucune protection (CSP, en-têtes, sessions, noindex des pages privées) n'est désactivée.
