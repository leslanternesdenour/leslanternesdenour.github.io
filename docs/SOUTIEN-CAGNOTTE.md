# Soutien — page `/soutenir/` (don en ligne par Stripe)

Page dédiée, indépendante des abonnements Premium / Famille : sans compte, sans collecte de données par ce site.
Le paiement est un **formulaire Stripe intégré dans la page** (aucune redirection). Aucune donnée bancaire ne passe par nos serveurs.

Fichiers :
- page : `soutenir/index.html`, `soutenir/soutenir.css`, `soutenir/soutenir.js` (point d'entrée), `soutenir/don.js` (liaison navigateur), `soutenir/don-logique.js` (logique testée), `soutenir/config.js` ;
- serveur : `serveur/don.js` (validation, limitation, erreurs neutres), `serveur/stripe.js` (`creerDon`), `functions/api/don/config.js` et `functions/api/don/session.js` ;
- sécurité : bloc `/soutenir/*` de `_headers` (CSP et Permissions-Policy élargies des seules ressources Stripe) ;
- tests : `outils/tests/don.test.mjs`, `outils/tests/soutenir-don.test.mjs`, `outils/tests/garde-branche.test.mjs`.

## Comment ça marche
1. La page demande `GET /api/don/config`. Tant que la clé publiable n'est pas configurée, le serveur répond calmement `200 {"cle": null}` (état normal, pas d'erreur serveur) ; si le serveur ne répond pas du tout, c'est pareil : la page affiche « La cagnotte sera bientôt disponible » et **aucun formulaire**.
2. Sinon, la personne choisit 5 €, 10 €, 20 € ou un montant libre (euros entiers, 1 à 500). Le montant est **revalidé par le serveur**.
3. `POST /api/don/session` crée une session Stripe en paiement intégré (`ui_mode: embedded_page`, don unique en euros) et renvoie **uniquement** le secret du formulaire.
4. La page charge `https://js.stripe.com/endive/stripe.js` et monte le formulaire de paiement dans `#paiement`.

## Secrets (jamais dans le dépôt)
| Nom | Rôle | Où |
|---|---|---|
| `STRIPE_CLE_SECRETE` | clé secrète (`sk_test_…` en test) | tableau de bord Cloudflare (Pages → Réglages → Variables et secrets) ; en local : fichier `.dev.vars` (ignoré par Git) |
| `STRIPE_CLE_PUBLIABLE` | clé publiable (`pk_test_…`), qui est publique | idem |

- Une clé réelle (`sk_live_…`) est **refusée** par le code tant que `STRIPE_MODE_REEL` ne vaut pas `autorise` (décision du créateur, voir `serveur/stripe.js`).
- **Séparation test / réel (28/11/2026, appliquée par le code)** : une clé réelle (`sk_live_`, `rk_live_`) n'est acceptée que si `ENVIRONNEMENT = production` (en plus de `STRIPE_MODE_REEL=autorise` et des mentions légales complètes) ; une clé de test est refusée en production ; les événements de test sont refusés en production et les événements réels hors production. Voir `docs/SECURITE-SESSIONS-DROITS.md`.
- La préproduction est un déploiement d'aperçu (« Preview ») : y mettre uniquement des clés de **test**, dans les secrets de l'environnement Preview, jamais ceux de la production.
- Piège déjà rencontré : le tableau de bord ouvre l'environnement **Production** par défaut (reconnaissable à la ligne grisée `ENVIRONNEMENT = production`). Les clés de test doivent être dans l'environnement **Aperçu (Preview)** ; la production ne doit contenir aucune variable `STRIPE_*`.
- Les secrets ne sont appliqués qu'à un **nouveau déploiement**. Un commit vide ne déclenche aucun build chez Cloudflare : il faut un vrai changement de fichier, ou « Réessayer le déploiement » dans le tableau de bord. Vérification sans afficher de clé : `GET /api/don/config` doit renvoyer `{"cle":"pk_test_…"}` au lieu de `{"cle":null}`.
- Le serveur ne renvoie jamais une clé : `GET /api/don/config` n'accepte qu'une valeur commençant par `pk_`.

## Version de l'API Stripe
Le don fixe `Stripe-Version: 2026-11-18.endive` (constante `VERSION_API_DON` dans `serveur/stripe.js`) et la page charge le script `endive` : les deux doivent rester cohérents. Cette version n'est appliquée **qu'au don** : les appels des abonnements Premium ne sont pas modifiés.

## Pour ouvrir le don en ligne (quand le compte Stripe est prêt)
1. Tester d'abord en mode test avec des cartes fictives (https://docs.stripe.com/testing), y compris dans la console du navigateur : aucune erreur de politique de sécurité (CSP).
2. Renseigner le RIB et terminer la vérification du compte dans Stripe (nécessaire pour recevoir de l'argent réel, pas pour le mode test).
3. Pour Apple Pay : déclarer le domaine `leslanternesdenour.fr` dans Stripe (Réglages → Moyens de paiement → Domaines de moyens de paiement) ; cela ne fonctionne qu'avec un compte activé.
4. Passage en réel : décision explicite du créateur (clés réelles + `STRIPE_MODE_REEL=autorise`), après relecture des pages légales (Stripe comme sous-traitant de paiement).
5. Retirer `<meta name="robots" content="noindex">` de `soutenir/index.html` et ajouter `https://leslanternesdenour.fr/soutenir/` à `sitemap.xml` si la page doit être référencée.

## Règles respectées
Contribution facultative ; aucun contenu gratuit bloqué ; aucun montant collecté ni contributeur affiché (la répartition est une **estimation prévisionnelle**) ; pas de contribution récurrente ; pas de compte à rebours ; pas de promesse de réduction fiscale ; le projet n'est pas présenté comme une association.

Accès : pied de page de l'accueil (`index.html`) et de la page « Découvrir » (`decouvrir/index.html`). Aucune sollicitation dans les jeux.
