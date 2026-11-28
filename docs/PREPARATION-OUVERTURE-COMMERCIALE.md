# Préparation de l'ouverture commerciale — 28/11/2026

Tout ce qui suit est **préparé, rien n'est appliqué** : aucun changement DNS, aucun réglage Cloudflare, aucune publication en production, aucune dépense. Les constats viennent de lectures publiques (DNS, `/api/sante`, tests) faites ce jour.

## 1. Constaté aujourd'hui (lecture seule)
| Point | Résultat |
|---|---|
| Préproduction `/api/sante` | `ok`, sessions `ok`, Firebase et compte de service configurés, clé non révoquée, créateur désigné, Stripe en **test** + webhook, stockage Premium **lié**, courriel Resend |
| Production `/api/sante` | `ok`, environnement `production` (ancienne version : elle ne contient pas encore les trois nouveaux jeux ni la page Conditions mise à jour, c'est voulu) |
| Accès Premium, préproduction | `/api/premium/*` sans compte : **401** (fermé). Aucun fichier Premium dans le dépôt public (test `fuite-premium` : pack privé absent sur cette machine, contrôle à relancer là où il se trouve) |
| Tests (une exécution, 89 tests) | droits, jetons, accès, garde des pages, abonnements, paiements, profils : **87 réussis** ; 1 non exécutable ici (`regles-firestore`, dépendance `@firebase/rules-unit-testing` + émulateur Java absents de cette machine) |
| DNS `leslanternesdenour.fr` | SPF `v=spf1 include:mx.ovh.com -all` ; DKIM Resend présent ; MX d'envoi Resend (`send.`) présent ; **DMARC absent** (`_dmarc` : domaine inexistant) |

## 2. Réglages Cloudflare à appliquer à l'ouverture (zone `leslanternesdenour.fr`, plan gratuit)
À faire dans le tableau de bord (SSL/TLS, Règles) ou avec un jeton ayant le droit « Paramètres de zone : modifier », **sur votre accord** :
1. SSL/TLS : mode **Full (strict)** (aujourd'hui `full`).
2. Version TLS minimale **1.2** (aujourd'hui 1.0).
3. **Toujours HTTPS** : activé.
4. **HSTS** : activer par paliers (max-age 1 jour, puis 1 semaine, puis 6 mois) ; sans « includeSubDomains » ni « preload » au début.
5. **DNSSEC** : activer chez Cloudflare, puis copier l'enregistrement DS chez le bureau d'enregistrement.
6. **Limitation de débit** (règle gratuite) sur `/api/*` : par exemple 60 requêtes par minute et par adresse, action « bloquer 10 minutes ».
7. Règle de blocage des sondages de robots : chemins `/wp-login.php`, `/xmlrpc.php`, `/.env`, `/.git/` (trafic inutile constaté).
8. `/favicon.ico` : ajouter le fichier à la racine (404 constaté).
Retour arrière : chaque réglage se remet à son ancienne valeur dans le même écran.

## 3. DNS à ajouter (à copier chez le gestionnaire de la zone ; non appliqué)
| Type | Nom | Valeur | But |
|---|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@leslanternesdenour.fr; adkim=r; aspf=r` | DMARC en observation (créer d'abord la boîte `dmarc@` ou choisir une autre adresse) |
Après 2 à 4 semaines de rapports propres : passer à `p=quarantine`, puis `p=reject`. Les enregistrements Resend existants ne bougent pas. Aucun changement de CNAME/A du site n'est nécessaire (la production est déjà servie par Cloudflare Pages).

## 4. Séquence d'ouverture (quand les informations légales seront prêtes)
1. Créer la micro-entreprise ; renseigner `conditions/index.html` : `node outils/legal/renseigner.mjs infos.json --ecrire` (voir `outils/legal/renseigner.mjs`), relecture juridique de la clause de rétractation, choix du médiateur, prix définitifs, remboursement.
2. Valider les contenus de `docs/CONTENUS-A-VALIDER.md`.
3. Stripe : activer le compte en mode réel (informations de la micro-entreprise), créer les produits aux prix définitifs, remplacer les clés `STRIPE_*` de **production** (secrets Cloudflare, jamais dans GitHub), enregistrer le webhook de production.
4. Firebase : restreindre/dédier la clé de service de production ; DMARC ; réglages Cloudflare ci-dessus.
5. `bash outils/migration/promouvoir.sh` : **refuse** tant qu'un champ « [EN ATTENTE… » ou « [À COMPLÉTER… » reste dans Conditions/Tarifs. Puis `--pousser`, vérification de `/api/sante` de production, retour arrière possible (`docs/MIGRATION-PRODUCTION.md`).

## 5. Comptes enfants, abonnements, protections (contrôlés par les tests et en préproduction)
- Compte parent obligatoire pour jouer (garde serveur fail-closed + garde client) ; e-mail vérifié exigé ; 4 profils enfants au plus ; l'enfant n'a ni compte ni donnée personnelle (prénom ou surnom, âge, personnage).
- Abonnements : droits calculés côté serveur depuis Stripe (synchro testée), accès offerts par invitation sans paiement, résiliation depuis l'Espace famille ; retour en Gratuit sans perte de progrès.
- Protections : règles Firestore « tout refusé » (accès uniquement par le serveur), clé API web restreinte, sessions signées, clés révoquées gérées, secrets hors dépôt (test `secrets`), sauvegardes chiffrées quotidiennes vers un R2 privé.
- Non vérifiable ici : paiement réel (interdit), pack Premium privé (absent de cette machine), règles Firestore sous émulateur.