# Audit avant migration — 22/11/2026

## 1. Les deux sites
| | Site public `leslanternesdenour.fr` | Préproduction `lanternes-de-nour.pages.dev` |
|---|---|---|
| Hébergeur | **GitHub Pages** (`server: GitHub.com`), fichiers du dépôt tels quels | **Cloudflare Pages** (dossier `dist/` construit + fonctions serveur) |
| Branche | `main` (dernier commit `dc39d93`, 19/11, déployé 19/11 à 22h58) | `preproduction` |
| En-têtes de sécurité (`_headers`), fonctions `/api/*` | **Impossibles** (GitHub Pages les ignore) | Actifs |

**Conséquence** : le site public ne peut pas recevoir les comptes familiaux, les abonnements, l'administration ni l'Espace Créateur en se contentant de fusionner dans `main` : ces fonctions sont des *fonctions serveur Cloudflare*. La migration vers Cloudflare Pages est obligatoire.

## 2. GitHub
- `main` est un **ancêtre direct** de `preproduction` : 0 commit de `main` absent, **104 commits d'avance** (98 le matin du 22/11, +6 depuis : voix de la narratrice, portail, visages), **765 fichiers** différents.
- Ces 765 fichiers : 379 outils/tests (non publiés), 237 audios (voix de la narratrice), 19 docs + 12 documents (non publiés), 16 fichiers `personnages3d`, 9 `serveur`, 2 `functions`, 8 nouveaux fichiers + 6 modifiés dans `monde`, ainsi que les pages `tarifs`, `admin`, `apercu`, `conditions` et les mises à jour de `compte`, `ablutions`, `priere`, `calendrier`, `voyage`, `accueil`, `univers`, `transfert`.
- **21 fichiers audio supprimés** par rapport à `main` : les voix des zones **Premium** (`NOUR-VOIX-DEC-005 à 011, 013, 014, 028 à 039`), retirées *volontairement* du dépôt public (un contenu Premium ne doit pas être téléchargeable par tous). Aucun code public ne les référence ; elles restent dans l'historique et dans la branche `sauvegarde-production-2026-11-22`.
- Branches dont le contenu n'est PAS sur `preproduction` (hors migration, à décider plus tard) : `abonnements` (ancien prototype remplacé par `/tarifs/`), `integration-personnages-n1-priere` (documents), `voix-test` (essai remplacé), **`voix-reparation`** (régénération de 19 phrases du Grand Voyage : jamais déployée, à écouter avant décision).
- Sauvegarde faite : branche **`sauvegarde-production-2026-11-22`** = `main` au commit `dc39d93` (les étiquettes Git sont refusées par le proxy de la session).

## 3. Pages (toutes présentes et répondant 200 sur la préproduction)
`/`, `/compte/` (Espace famille, parents, profils enfants, invitations), `/tarifs/`, `/conditions/`, `/admin/` (Créateur), `/apercu/` (Aperçu Créateur), `/calendrier/`, `/ablutions/` (+ 3D), `/priere/` (+ 3D), `/voyage/`, `/monde/` (portail), `/decouvrir/`, `/univers/`, `/transfert/`. Absentes du site public actuel : `/tarifs/`, `/admin/`, `/apercu/`, `/conditions/` (404 ou 503 GitHub) ; `/compte/` y est une ancienne version (12 Ko contre 28 Ko).

## 4. API et fonctions serveur
- Fonctions Cloudflare : `functions/api/[[route]].js` (toutes les routes) et `functions/api/sante.js`. Code métier : `serveur/` (API, droits, jetons, sessions, Firestore REST, Stripe).
- 24 routes : `/api/session` (+ `/fin`), `/api/moi`, `/api/enfants` (+ progression, actif), `/api/compte` (suppression RGPD), `/api/invitations/activer`, `/api/createur/activer`, `/api/abonnement/{portail,resilier}`, `/api/paiement/session`, `/api/stripe/webhook`, `/api/catalogue`, `/api/admin/{acces,bandeau,catalogue,comptes,invitations,journal,premium,resume}`, `/api/premium/*`, `/api/sante`.
- Le serveur ne contient **aucune adresse codée en dur** : l'origine autorisée, le drapeau `Secure` du cookie et les adresses de retour de paiement se calculent à partir de la requête. Le même code fonctionne donc sur `leslanternesdenour.fr`.

## 5. Variables et secrets (noms seulement ; aucune valeur n'est dans le dépôt)
Lues par le code : `SESSION_SECRET`, `FIREBASE_COMPTE_SERVICE`, `CREATOR_UID` (secrets) ; `FIREBASE_PROJET`, `ENVIRONNEMENT` (publiques, déclarées dans `wrangler.toml`) ; `STRIPE_CLE_SECRETE`, `STRIPE_SECRET_WEBHOOK`, `STRIPE_MODE_REEL`, `STRIPE_PRIX_*`, `VERSION_TEXTES`, liaison `R2_PREMIUM`.
**En production : ne définir aucune variable `STRIPE_*` ni `R2_PREMIUM`** tant que l'ouverture des paiements et du stockage Premium n'est pas décidée (le site affiche alors « Le paiement n'est pas encore ouvert » : aucun paiement réel possible).
Côté navigateur (`compte/config.js`, valeurs PUBLIQUES) : projet Firebase `lanternes-de-nour`, `authDomain` `lanternes-de-nour.firebaseapp.com`. **Même projet Firebase pour la préproduction et la production : mêmes comptes, mêmes familles** (rien n'est copié ni recréé).

## 6. Ressources
Voix : Ablutions 76/76, Prière 68/68, Calendrier 169/169 (voix de la narratrice) + clip du portail ; 313 fichiers audio référencés, tous servis. Modèles 3D `personnages3d/modeles/{garcon,fille}_N1.glb`. Images/animations du site : dossier `accueil/`, `intro/`. La bibliothèque 3D `three.js` est chargée depuis `cdn.jsdelivr.net` (autorisé par la CSP).

## 7. Chemins, redirections, dépendances
- Aucun fichier `_redirects` ; `404.html` présent ; adresses canoniques déjà en `https://leslanternesdenour.fr` ; `robots.txt` et `sitemap.xml` de production dans le dépôt (la préproduction les remplace par « tout interdire »).
- Le fichier `CNAME` (`leslanternesdenour.fr`) concerne GitHub Pages ; il n'est jamais publié par Cloudflare.
- Dépendances externes : Firebase (gstatic.com, apis.google.com, firebaseapp.com), jsdelivr (three.js), Google Fonts.
