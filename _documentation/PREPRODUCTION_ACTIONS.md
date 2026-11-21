# Préproduction : ce qui est prêt, ce qu'il vous reste à faire

Rien n'est déployé. `main`, les DNS et le site officiel ne sont pas touchés. Aucune dépense, aucune carte bancaire dans ce qui suit.

## Prêt dans le dépôt (branche `preproduction`)
Blocs 1, 2 et 3 présents. Build `node outils/construire.mjs` → `dist/` (aucun Premium, aucune fuite) ; Functions empaquetables (55 Ko, sans module Node) ;
sans secrets l'API répond 503 « comptes-non-configurés » et le site gratuit fonctionne comme avant ; sans R2 aucun contenu Premium n'est servi.

## A. Cloudflare Pages (gratuit) — voir aussi GUIDE_CLOUDFLARE_PREPRODUCTION.md
1. Compte Cloudflare + 2FA (application d'authentification), codes de récupération hors ligne. **Aucune offre payante.**
2. Workers et Pages → Créer → Pages → Se connecter à Git → dépôt `leslanternesdenour.github.io` uniquement.
3. Nom `lanternes-de-nour` · **branche de production = `preproduction`** · framework : aucun · build `node outils/construire.mjs` · sortie `dist` ·
   variables de build `NODE_VERSION=22`, `LDN_PREPROD=1`. Branches de prévisualisation : **Aucune**.
4. Envoyez-moi l'adresse `https://….pages.dev` : je vérifie `/api/sante`, les en-têtes, la 404, et je lance les tests complets (Three.js réel).

## B. Firebase (offre Spark, sans carte) — après A, ou en parallèle
1. https://console.firebase.google.com → nouveau projet (sans Google Analytics) ; notez l'**identifiant du projet**.
2. Authentication → Méthode de connexion → **E-mail/Mot de passe** (pas Identity Platform, pas de SMS). Paramètres → Domaines autorisés : ajouter `….pages.dev`.
3. Firestore Database → Créer → **mode production**, région `eur3` (Europe). Onglet Règles → coller le contenu de `firestore.rules` (tout refusé : seul le serveur écrit) → Publier.
4. Paramètres du projet → Comptes de service → Générer une clé privée (fichier JSON). **Ne me l'envoyez pas.** Gardez-la sur votre ordinateur.
5. Paramètres → Vos applications → Web (`</>`) → copiez l'objet `firebaseConfig` (valeurs publiques) et **envoyez-le-moi** : je l'inscris dans `compte/config.js`.

## C. Secrets Cloudflare (Pages → Paramètres → Variables et secrets, type **Secret**)
| Nom | Valeur |
|---|---|
| `SESSION_SECRET` | 40+ caractères aléatoires (gestionnaire de mots de passe) |
| `FIREBASE_COMPTE_SERVICE` | tout le contenu du fichier JSON de B4 |
| `CREATOR_UID` | UID affiché par l'étape D |
Les identifiants publics (`FIREBASE_PROJET`, plus tard les `price_…` Stripe) : donnez-les-moi, je les mets dans `wrangler.toml` (Cloudflare verrouille dans le tableau de bord ce qui est déclaré dans ce fichier).
Si le tableau de bord refuse d'ajouter un secret à cause de `wrangler.toml`, dites-le-moi : alternative `wrangler pages secret put`.

## D. Votre compte Créateur
1. Sur `https://….pages.dev/compte/` : créez votre compte (e-mail dédié, mot de passe unique long), cliquez le lien de vérification reçu par e-mail.
2. Sur votre ordinateur : `node outils/admin/poser-role-createur.mjs <fichier-cle.json> <votre-email>` (la clé ne quitte pas votre ordinateur).
   Copiez l'UID affiché dans le secret `CREATOR_UID`, redéployez, reconnectez-vous : `/admin/` et `/apercu/` s'ouvrent.

## E. Stripe (mode TEST, facultatif pour cette étape)
Compte Stripe en **mode test** : 3 prix récurrents test, un point d'accès webhook `https://….pages.dev/api/stripe/webhook` (événements `customer.subscription.*`, `checkout.session.completed`) →
secrets `STRIPE_CLE_SECRETE` (`sk_test_…`, une clé `sk_live_` est refusée par le code) et `STRIPE_SECRET_WEBHOOK` ; envoyez-moi les 3 `price_…`.

## F. Pack Premium privé / R2 — EN ATTENTE DE VOTRE DÉCISION
R2 est le seul stockage conforme prévu (privé, lié au Worker) et il demande en pratique un moyen de paiement même pour le palier gratuit (10 Go, 1 M écritures, 10 M lectures, sorties gratuites). **Je n'active rien.**
Le pack est prêt (5 zones : 5 `contenu.json` + 21 voix ; maison « Chasse aux mots » : 4 fichiers ; voir CONTENUS_PREMIUM.md) et hors dépôt.
Sans R2 la préproduction fonctionne pleinement pour le gratuit, les comptes et l'administration ; les zones Premium restent fermées et la Chasse aux mots indisponible.

## Limites connues
- Règles Firestore « tout refusé » : testées dans l'émulateur officiel Firebase (6 profils × lecture/liste/écriture/lot/transaction, sous-collections, collectionGroup ; mutation vérifiée). Lancer : `EMULATEURS_FIREBASE=1 bash outils/tests/tout.sh` (Java requis ; outils installés hors dépôt). Même suite : base REST réelle, restauration, script du rôle Créateur (émulateur Auth).
- Rendu 3D, vraie connexion Firebase, vrai Stripe test et R2 réel : à valider une fois A–E faits.
