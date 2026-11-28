# Jour J : de la micro-entreprise à l'ouverture commerciale

État au 28/11/2026 : **le site est publié** (production `e599477`) avec tout ce qui est terminé. Les paiements réels et le Premium restent fermés par **trois protections** :
1. `serveur/ouverture.js` : `MENTIONS_COMPLETES = false` → aucune clé Stripe réelle ni webhook réel n'est accepté.
2. Production sans variables ni secrets Stripe (`/api/paiement/mode` répond `ferme`), sans liaison R2 Premium.
3. La page Conditions publique affiche « communiqué à l'ouverture commerciale » à la place de chaque champ manquant (jamais de marqueur provisoire : le build de production le refuse).

**Il ne reste que vos informations, vos validations et les actes qui exigent vos comptes** (Cloudflare, Stripe). Rien d'autre n'est à développer.

## Étape 1 — Vos informations administratives (10 minutes)
1. Copier `outils/legal/infos-modele.json` en `infos.json` (hors dépôt) et remplir **uniquement ce que vous avez** : nom, statut, adresse professionnelle, SIREN/SIRET, TVA (ex. mention de franchise en base, selon votre régime), e-mail de contact, directeur de la publication, adresse de l'hébergeur (Cloudflare, à reporter depuis leur site), remboursement des contributions, médiateur de la consommation, prix confirmés.
2. `node outils/legal/renseigner.mjs infos.json` : aperçu (rien n'est écrit). Puis `--ecrire`.
3. Tant qu'un champ manque, `MENTIONS_COMPLETES` reste `false` et les paiements réels restent bloqués. Quand tout est rempli, il passe à `true` tout seul.
4. Faire relire la clause de rétractation (champ `relecture-retractation`).

## Étape 2 — Validations de contenu
`docs/CONTENUS-A-VALIDER.md` : relire, puis valider (La Route est déjà validée le 24/11).

## Étape 3 — Stripe (votre compte, mode réel)
1. Activer le compte Stripe avec les informations de la micro-entreprise ; créer les 3 produits aux prix définitifs (Premium mensuel, Premium annuel, Famille annuel).
2. Cloudflare > projet `lanternes-de-nour` > Paramètres > Variables, environnement **Production** :
   - texte : `STRIPE_PRIX_PREMIUM_MENSUEL`, `STRIPE_PRIX_PREMIUM_ANNUEL`, `STRIPE_PRIX_FAMILLE_ANNUEL` (identifiants `price_…` du mode réel) ;
   - secrets : `STRIPE_CLE_SECRETE` (`sk_live_…`), `STRIPE_CLE_PUBLIABLE`, `STRIPE_SECRET_WEBHOOK` ;
   - **en dernier** : `STRIPE_MODE_REEL = autorise`.
3. Stripe > Webhooks : `https://www.leslanternesdenour.fr/api/stripe/webhook` (événements : `checkout.session.completed`, `customer.subscription.*`, `invoice.*`, comme en test).
4. Ne jamais reprendre les identifiants de test (`price_1Uev…`).

## Étape 4 — E-mails et Premium
- E-mails : Cloudflare Production : secret `EMAIL_CLE_API` + `EMAIL_FOURNISSEUR=resend`, `EMAIL_EXPEDITEUR_ADRESSE=bonjour@leslanternesdenour.fr`, `EMAIL_EXPEDITEUR_NOM=Les Lanternes de Nour`. DNS : ajouter le DMARC (`docs/PREPARATION-OUVERTURE-COMMERCIALE.md` §3).
- Premium : le bucket R2 `ldn-premium` est **déjà lié** à la production (liaison `R2_PREMIUM`, depuis le 28/11) ; le pack du Grand Voyage (5 zones, 21 voix) y est **importé** (récupéré de l'historique Git, `outils/recuperation/reconstituer-pack-voyage.mjs`) ; seule la maison « Chasse aux mots » est à ré-importer si le créateur en retrouve les fichiers. Voir `outils/tests/fuite-premium.mjs` pour le contrôle de fuite.
- Cloudflare zone : TLS 1.2, HTTPS permanent, HSTS par paliers, limitation de débit (§2 du même document).

## Étape 5 — Publier et contrôler
1. Commit des mentions (`conditions/index.html`, `serveur/ouverture.js`) sur `preproduction`, test sur l'aperçu avec Stripe test.
2. `git branch production origin/production` si besoin, puis `bash outils/migration/promouvoir.sh --pousser`. Contrôler `/api/sante`, `/api/paiement/mode` (doit répondre `reel`), la page Conditions (plus aucun « communiqué à l'ouverture commerciale »).
3. Un premier paiement réel de faible montant par vous-même, remboursé ensuite depuis Stripe.
4. Retour arrière sans force push : nouveau commit restaurant l'arbre précédent de `production`.