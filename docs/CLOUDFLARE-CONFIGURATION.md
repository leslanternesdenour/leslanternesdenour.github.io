# Configuration Cloudflare — état relevé le 27/11/2026

Relevé fait par l'API Cloudflare avec un jeton à droits limités. **Aucun secret n'est écrit ici** : seuls les noms des variables sont listés.
Compléter ce document à chaque changement de configuration (une ligne, une date).

## Projet Pages `lanternes-de-nour`
| Réglage | Valeur |
|---|---|
| Dépôt relié | `leslanternesdenour/leslanternesdenour.github.io` |
| Branche de production | `production` (domaines : `leslanternesdenour.fr`, `www.leslanternesdenour.fr`, `lanternes-de-nour.pages.dev`) |
| Déploiements de production | activés |
| **Aperçus (previews)** | **limités à la branche `preproduction`** (réglage « personnalisé »), changé le 27/11/2026. Avant : toutes les branches (`*`). |
| Commentaires de PR | activés |

### Pourquoi les aperçus sont limités à `preproduction`
Chaque aperçu reçoit les secrets de l'environnement Preview (clé Stripe de test, compte de service Firebase, secret de session). Avec « toutes les branches », une branche quelconque poussée sur le dépôt (public) déclenchait un build exécuté avec ces secrets. Le garde-fou de `outils/construire.mjs` refusait déjà les branches autres que `preproduction`, `production` et `main`, mais seulement après le démarrage du build. Les builds de branches de travail apparaissaient en échec (croix rouge « Cloudflare Pages » sur les demandes de fusion) : ce bruit disparaît.

### Retour en arrière
Tableau de bord Cloudflare > Workers et Pages > `lanternes-de-nour` > Paramètres > Builds et déploiements > Contrôles des branches > Aperçus : remettre « Toutes les branches non production ».
Une copie de l'ancienne configuration (sans secret) est dans `C:\Users\zakar\outils-claude\sauvegardes\` (hors dépôt).

## Variables (noms seulement ; les secrets sont de type « secret », valeurs illisibles)
- **Production** : `CREATOR_UID`*, `ENVIRONNEMENT`, `FIREBASE_COMPTE_SERVICE`*, `FIREBASE_PROJET`, `SESSION_SECRET`*.
- **Preview** : les mêmes, plus `EMAIL_CLE_API`*, `EMAIL_EXPEDITEUR_ADRESSE`, `EMAIL_EXPEDITEUR_NOM`, `EMAIL_FOURNISSEUR`, `STRIPE_CLE_PUBLIABLE`*, `STRIPE_CLE_SECRETE`*, `STRIPE_PRIX_FAMILLE_ANNUEL`, `STRIPE_PRIX_PREMIUM_ANNUEL`, `STRIPE_PRIX_PREMIUM_MENSUEL`, `STRIPE_SECRET_WEBHOOK`*.
- (* = secret)
- Facultatives, non définies : `EMAIL_REPONSE` (vide par défaut), `VERSION_TEXTES` (défaut `2026-11`), `STRIPE_MODE_REEL` (ne doit être posée qu'à la décision du mode réel).
- **À poser avant toute promotion de `production`** : `EMAIL_CLE_API` et les variables d'e-mail (sinon les comptes ne fonctionnent pas), puis les `STRIPE_*` seulement à l'ouverture des paiements.

## Stockage R2
- Bucket `ldn-premium` (Europe de l'Ouest), lié à l'environnement **Preview** sous le nom `R2_PREMIUM`. Aucune liaison en production.
- **Privé** : accès public `r2.dev` désactivé, aucun domaine personnalisé. Seules les fonctions du site y accèdent.
- Règle de cycle de vie : abandon des envois multipart de plus de 7 jours (défaut). Aucune règle CORS.

## Zone `leslanternesdenour.fr` (plan gratuit) — réglages constatés, non modifiés
| Réglage | Valeur | Remarque |
|---|---|---|
| Chiffrement SSL | `full` | `full (strict)` est préférable |
| Toujours HTTPS | désactivé | `http://` redirige pourtant en 301 vers HTTPS |
| Version TLS minimale | 1.0 | passer à 1.2 |
| HSTS | désactivé | à activer avec prudence (max-age croissant) |
| Règles WAF personnalisées, limitation de débit | aucune | |
| DNSSEC | non lisible avec le jeton actuel | |

## Messagerie (DNS public)
SPF racine `v=spf1 include:mx.ovh.com -all`, MX OVH. **Pas d'enregistrement DMARC** : à ajouter (voir `docs/EMAILS-PERSONNALISES.md`).

## Trafic (statistiques Cloudflare, 22 au 27/11/2026)
Entre 450 et 7 000 requêtes par jour, 90 à 300 visiteurs uniques par jour. Les erreurs 4xx/5xx des dernières 24 h sont surtout des sondages de robots (`/wp-login.php`…) et quelques `504` sur `/`, `/calendrier/` et `/api/moi` à surveiller. `/favicon.ico` répond 404 (l'icône est déclarée dans les pages mais les navigateurs demandent aussi ce chemin).
