# Transfert de `preproduction` vers le site public — analyse du 28/11/2026

**MISE À JOUR : publié le 28/11/2026 sur `production` (`e599477`), sur autorisation du créateur.** `main` (non déployée) n'a pas été touchée. Les Conditions publiques utilisent la « vue publique » (voir `docs/OUVERTURE-JOUR-J.md`). Contrôles en ligne : version `e599477`, jeux protégés (302 vers la connexion), paiements `ferme`, Premium 401 sans compte. Analyse initiale (avant publication) : Analyse en lecture seule + une construction de simulation (copie jetable, supprimée).

## 1. État des branches
| Branche | Commit | Rôle |
|---|---|---|
| `production` | `c6c5a50` | **Ce que Cloudflare publie sur leslanternesdenour.fr / www** (branche de production du projet Pages) |
| `main` | `da30277` | **Non déployée** (104 commits derrière `production`, 178 derrière `preproduction`). Ne pas y toucher est sans effet sur le site |
| `preproduction` | `b74a328` | Branche de travail, en ligne sur l'aperçu |

`production` est un **ancêtre direct** de `preproduction` (0 commit propre, 74 commits d'avance) : la promotion est une avance rapide, **sans conflit ni écrasement possible** d'un travail propre à la production. Elle touche 147 fichiers (79 ajoutés, 68 modifiés).

## 2. Contenu du transfert (par domaine)
- **Carte du Grand Voyage** : repère La Mecque, village lisible, « ? » sans grappes, carnet, badge d'arrivée, musiques (`voyage/`).
- **Calendrier du Ramadan** : préremplissage du profil enfant, service worker v9.
- **Ablutions / Prière (2D et 3D), École arabe, Aventures** : pages mises à jour (garde d'accès, sans visage), **3 nouveaux jeux** (Oasis, Trésor, Cinq prières).
- **Comptes et accès** : garde serveur « fail-closed » (`functions/_middleware.js`, `serveur/garde-pages.js`), e-mail vérifié obligatoire, 4 profils, Espace famille, e-mails (`serveur/email*.js`), progression synchronisée.
- **Premium et abonnements** : droits serveur, import du pack par le créateur, Stripe (code), stockage R2 (code).
- **Pages légales/tarifs** : `conditions/` (mentions légales avec emplacements), `tarifs/`.
- **Hors site (non publiés)** : `outils/`, `docs/`, `.github/` (la construction exclut les outils internes).

## 3. Simulation de la construction de production (copie jetable)
`preproduction` + `wrangler.toml` de production + `CF_PAGES_BRANCH=production` : **2 341 fichiers, 0 problème** (`verifier-dist`), **0 clé ou identifiant de test** (`price_…`, `sk_test`, `whsec_`) dans le résultat. `wrangler.production.toml` n'a **aucune** variable Stripe ni liaison R2 : aucune clé réelle n'est remplacée par une clé de test, la production garde sa configuration propre.

## 4. Vérifications des services (état constaté)
| Service | Constat | Effet à la promotion |
|---|---|---|
| Firebase | Même projet que la préproduction ; 4 comptes, **tous e-mail vérifié** ; règles « tout refusé » ; domaines autorisés incluent `leslanternesdenour.fr` et `www` ; clé web restreinte | Aucun compte existant ne sera bloqué par l'obligation de vérification |
| Secrets Cloudflare Production | `SESSION_SECRET`, `FIREBASE_COMPTE_SERVICE`, `CREATOR_UID` posés (relevé du 27/11) | La garde serveur peut s'appliquer |
| Stripe | **Absent en production** (volontaire) : la page Tarifs dit « paiement pas encore ouvert » | Aucun paiement possible, aucun abonnement touché |
| R2 Premium | **Lié en production le 28/11** (`R2_PREMIUM` → seau privé `ldn-premium`, `docs/migration/wrangler.production.toml`). **Pack du Grand Voyage récupéré depuis l'historique Git et importé le 28/11** (26 fichiers : 5 zones, 21 voix ; la maison « Chasse aux mots » est perdue). | Aucun contenu Premium servi tant que le Créateur n'a pas importé SON pack (`/admin/` → Pack Premium). Rien n'est inventé. Le compte Créateur voit les zones ouvertes (sans textes ni voix) avec un message ; Gratuit/visiteur restent bloqués |
| E-mail Resend | `EMAIL_CLE_API` seulement en Preview | En production, l'envoi Firebase actuel reste utilisé (comme aujourd'hui) |
| DNS | Pas de changement nécessaire. DMARC absent (non bloquant) | — |
| Données | Aucune lecture ni écriture de données d'utilisateurs faite | — |

## 5. BLOCAGES et points de décision
1. **Mentions légales (bloquant pour la promotion complète)** : `promouvoir.sh` refuse tout tant que `conditions/index.html` contient « EN ATTENTE » (13 champs). Constat important : **le site public affiche déjà** `[À COMPLÉTER]` et `[À FAIRE RELIRE]` dans ses Conditions. Deux voies :
   - **A. Attendre la micro-entreprise**, tout publier d'un coup (aucun risque supplémentaire, mais rien n'est en ligne d'ici là).
   - **B. Publier tout sauf la page Conditions** : la production garde sa page Conditions actuelle (aucune page « EN ATTENTE » nouvelle n'est publiée), le reste passe. Nécessite une petite adaptation de `promouvoir.sh` (option explicite), **sur votre accord**.
2. **Changement visible pour les visiteurs** : tout jeu exige désormais un compte parent (décision du 24/11). Un visiteur sans compte est redirigé vers la connexion ; les pages de présentation restent ouvertes.
3. **Secrets de production à confirmer par vous** (je ne peux pas les lire) : `SESSION_SECRET` et `FIREBASE_COMPTE_SERVICE`. S'ils manquaient, la garde fermerait tous les jeux (comportement voulu, fail-closed). Je vérifie `/api/sante` juste après la publication et je reviens en arrière si la configuration n'est pas `ok`.
4. **Données partagées préproduction/production** (même projet Firebase) : d'éventuels abonnements **de test** posés sur vos comptes de test sont dans la même base. Je peux, sur votre accord explicite, en lire l'état en lecture seule (sans e-mails) avant la publication.
5. **E-mail Resend en production** (recommandé, non bloquant) : ajouter `EMAIL_CLE_API` (secret) + `EMAIL_FOURNISSEUR=resend` etc. dans l'environnement Production.
6. **Non publiable aujourd'hui, donc volontairement non ouvert** : paiements réels et Premium (Stripe réel, R2, pack), mentions légales définitives (micro-entreprise).

## 6. Procédure prête (après votre accord)
1. Voie A ou B (point 1). 2. `bash outils/migration/promouvoir.sh` (construit `production` = `preproduction` + `wrangler.toml` de production ; **ne touche pas à `main`**), puis `--pousser`. 3. Attendre le déploiement, contrôler `/api/sante` (production, configuration `ok`), `/aventures/`, `/conditions/`, une connexion de test. 4. Sinon retour arrière.
**Retour arrière sans force push** : une nouvelle validation sur `production` restaurant l'arbre de `c6c5a50` (la règle GitHub interdit les force push sur `production`).