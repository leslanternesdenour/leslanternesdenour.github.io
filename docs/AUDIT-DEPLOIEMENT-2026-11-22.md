# Audit du déploiement — 22/11/2026

## Cause principale
Le domaine public **leslanternesdenour.fr est servi par GitHub Pages** (en-tête `server: GitHub.com`), branche **`main`**, dernier déploiement le **19/11/2026 à 22h58** (commit `dc39d93`). Tous les déploiements GitHub listés sont de type `github-pages`, branche `main`.
Le travail récent est sur la branche **`preproduction`**, publiée par **Cloudflare Pages** sur **https://lanternes-de-nour.pages.dev**. Les deux sites sont indépendants : tant que `main` n'est pas mise à jour (et que le domaine pointe encore vers GitHub Pages), leslanternesdenour.fr ne montre rien de nouveau.

## GitHub
- `main` = ancêtre direct de `preproduction` (aucun commit de `main` absent de `preproduction`). `preproduction` a **98 commits d'avance** et **505 fichiers modifiés** par rapport à `main`.
- Pages **présentes uniquement sur preproduction** : `/tarifs/`, `/admin/`, `/apercu/`, `/conditions/` ; `/compte/` existe sur main mais en version ancienne (12 Ko, 3 mentions enfants/profils) contre 28 Ko et 61 mentions sur preproduction.
- Dossiers absents de main : `serveur/` (API comptes, droits, sessions, Stripe test), `functions/api`, `personnages3d/`, `outils/construire.mjs` (build préproduction), `_headers`.
- Branches de travail dont le contenu n'est PAS sur preproduction : `abonnements` (ancien prototype /abonnements/ + module `acces/`, remplacé par /tarifs/ et `serveur/droits.js`), `integration-personnages-n1-priere` (documents de reprise), `voix-reparation` (régénération de 19 phrases du Grand Voyage et réparation de clips : **jamais déployée, à écouter avant décision**), `voix-test` (essai VoxCPM2, remplacé). Le clone de la session était limité à `preproduction` (clone superficiel) : corrigé.

## Cloudflare Pages
- `https://lanternes-de-nour.pages.dev/version.json` indique le commit déployé et la branche. Avant fusion : `f1efb59` / `preproduction` (= dernière version). Après fusion des voix : `b4c6829` / `preproduction`.
- Seule la branche `preproduction` peut être construite (garde-fou dans `outils/construire.mjs`) : le travail laissé sur une autre branche n'est jamais visible. C'était le cas de `voix-narratrice` (fusionnée ce jour).
- L'historique du tableau de bord Cloudflare n'est pas lisible depuis cette session (pas de jeton) : les builds réussis sont déduits de `version.json` ; un build échoué éventuel n'est pas visible ici.

## Corrections faites
1. Fusion (avance rapide) de `voix-narratrice` dans `preproduction` : voix de la narratrice branchées (237 phrases validées), service worker du calendrier passé en v8 (vide l'ancien cache des voix).
2. Clone complet récupéré (26 branches) pour auditer sans angle mort.
3. Aucun changement sur `main`, aucun changement DNS, aucun secret modifié, aucune fonctionnalité supprimée.

## Vérifié sur le site publié (Chrome réel, 22/11)
Les 12 pages se chargent sans erreur JavaScript ni 404 : /, /compte/, /tarifs/, /conditions/, /admin/, /apercu/, /calendrier/, /ablutions/, /priere/, /voyage/, /ablutions/jeu3d/, /priere/jeu3d/ (les jeux 3D se chargent quand le CDN three.js est joignable ; il est bloqué dans l'environnement de test de la session, ce qui affichait « Oh non ! » uniquement là).
`/api/sante` : sessions OK, projet Firebase OK, compte de service OK, Créateur désigné OK ; **Stripe : non configuré, webhook : non, stockage Premium : non**.
Voix en ligne : Ablutions 76/76, Prière 68/68, Calendrier 169/169 fichiers servis, lecture réelle constatée.

## Vérifié par les tests automatiques (émulateurs Firebase, serveur local ; dernier passage complet : 0 échec)
Droits (Créateur, invités, abonnés, gratuit), jetons Firebase, API (comptes, invitations, RGPD), Premium (révocation, expiration), parcours de compte complets dans Chrome, restauration chiffrée, absence de fuite Premium. **Non vérifié en conditions réelles** : connexion Google réelle et création d'un vrai compte familial (demandent une connexion du client ; aucun compte réel n'a été créé par l'audit).

## Réellement absent / non fonctionnel
Paiement Stripe (non configuré), stockage Premium privé (R2), 5 maisons Premium, 13 voix arabes humaines, connexion Apple (reportée).

## Pour afficher ces modifications sur leslanternesdenour.fr (non fait, décision du client)
Il faut fusionner `preproduction` dans `main` ET que le domaine soit servi par ce contenu (GitHub Pages ne sait pas construire notre dossier `dist` : la production devra passer par Cloudflare Pages avec le domaine personnalisé, ce qui implique un changement DNS). Non réalisé : interdit par les règles du projet.
