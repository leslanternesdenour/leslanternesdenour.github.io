# Sécurité des sessions et des dates de droits — correctif du 28/11/2026

Origine : audit en lecture seule de `serveur/droits.js` par l'agent ECC `security-reviewer` (28/11/2026). Deux constats relus et confirmés dans le code, corrigés ici. Rien d'autre n'a été modifié (paiements, Premium, contenus, `voyage/` intacts).

## A. Révocation des sessions (Créateur et tous les comptes)
**Problème.** Le cookie de session (HMAC, 5 jours) copie le rôle `creator` du jeton Firebase. Le champ `version` existait mais rien ne le comparait : un cookie volé, ou un rôle retiré dans Firebase, restait valable jusqu'à 5 jours.

**Correctif** (`serveur/api.js`) :
- Collection Firestore **`sessions_etat/{uid}`** : `{ version, revoqueLe }`. Inaccessible aux navigateurs (`firestore.rules` : tout refusé). Absence de document = version 0.
- À la connexion (`POST /api/session`), le cookie reçoit la version courante. À **chaque requête** de l'API, `sessionNonRevoquee` compare `version du cookie >= version attendue` ; sinon la requête est traitée comme non connectée (401). Les cookies déjà émis (sans version = 0) restent valables : aucune connexion légitime n'est coupée au déploiement.
- **Fail-closed** : si la version ne peut pas être lue, la session est refusée (jamais acceptée).
- Nouvelle route **`POST /api/admin/sessions/revoquer`** (Créateur, connexion de moins de 15 min), corps `{ "uid": "…" }` (par défaut : soi-même). Incrémente la version de la cible. Si la cible est le Créateur lui-même, le cookie en cours est ré-émis avec la nouvelle version (il reste connecté sur cet appareil, tous les autres appareils sont déconnectés). Le journal garde seulement « soi-même » / « autre-compte » (pas d'identifiant).
- **Lectures administratives sensibles** (liste et détail des comptes, invitations, accès offerts, journal) : connexion de moins de **12 h** (au lieu d'aucune limite), en plus de la version. Le résumé chiffré reste lisible. Les écritures gardent la limite de 15 min. Au-delà, l'interface `/admin/` affiche déjà l'écran de reconnexion (`reconnexion-requise`).
- La suppression RGPD d'un compte efface aussi son `sessions_etat`.

**En cas d'urgence (cookie du Créateur volé), sans aucune session :**
1. Console Firestore : document `sessions_etat/<UID du Créateur>` → champ `version` (nombre) = valeur actuelle + 1 (créer le document avec `version: 1` s'il n'existe pas). Effet immédiat sur tous les anciens cookies.
2. Ou changer le secret Cloudflare `CREATOR_UID` (double verrou : plus personne n'est Créateur).
3. Ou changer `SESSION_SECRET` (déconnecte TOUS les comptes).
Puis se reconnecter normalement.

**Limites connues.** Le garde des pages de jeu (`functions/_middleware.js`, `serveur/garde-pages.js`) lit toujours le cookie sans consulter Firestore : un cookie révoqué peut encore charger les pages HTML publiques de jeu, mais plus aucune donnée de compte, Premium ni administration (tout passe par l'API). Le rôle Créateur n'est pas revérifié auprès de Firebase (compte désactivé) : la révocation de version est le moyen prévu. Un nouveau document est lu à chaque requête de l'API (1 lecture Firestore de plus par appel). La sauvegarde inclut `sessions_etat` et la restauration ne peut plus faire redescendre une version (voir « Compléments du 2e lot » ci-dessous).

## B. Dates de fin illisibles (accès offerts et abonnements)
**Problème.** `enMs()` renvoyait `null` pour toute date illisible, et `accesOffertActif` lisait `fin === null` comme « accès permanent » : une faute de frappe dans la base (`fin: "demain"`) donnait un accès à vie.

**Correctif** (`serveur/droits.js`) : `dateStricte()` distingue quatre cas.
| Valeur de `fin` | Résultat |
|---|---|
| `null` écrit explicitement | permanent (conservé) |
| nombre / horodatage Firestore / texte ISO valide | accès jusqu'à cette date |
| champ absent | **refusé** (un permanent doit être écrit `null`) |
| illisible (texte quelconque, booléen, objet inconnu, `NaN`, infini, vide) | **refusé** |
`debut` illisible est aussi refusé (absent ou `null` : accepté). `abonnementActif` utilise la même lecture stricte. Côté écriture, `POST /api/admin/acces/:id/prolonger` refuse maintenant `NaN` et `Infinity` (`fin-invalide`). Les trois chemins qui écrivent un accès (invitation, attribution directe, prolongation) écrivaient déjà `fin` explicitement (nombre ou `null`) : aucun accès existant légitime n'est affecté.

## Tests ajoutés
- `outils/tests/api.test.mjs` (+8) : révocation de soi-même / d'un autre compte, droits et récence, cookies sans version, base illisible (fail-closed), lectures sensibles à 1 h et 13 h, dates de fin illisibles de bout en bout, suppression RGPD.
- `outils/tests/droits.test.mjs` (+4) : `dateStricte`, `accesOffertActif`, droits calculés, abonnement.
Commande : `node --test outils/tests/api.test.mjs outils/tests/droits.test.mjs`.

## Revue de sécurité du diff (agent ECC `security-reviewer`) et suites données
Verdict : aucun point bloquant dans la logique. Points traités avant publication :
- **Lectures d'administration** : liste blanche inversée. TOUT `GET /api/admin/*` exige une connexion de moins de 12 h, sauf `/api/admin/resume` (aucune donnée personnelle). Une route ajoutée plus tard est protégée par défaut.
- **Document `sessions_etat` présent mais illisible** (version texte, négative, décimale, `null`, démesurée) : session **refusée** (fail-closed, journalisé), au lieu d'une version 0 silencieuse qui aurait rendu une révocation d'urgence sans effet. Document absent = 0 (inchangé). Seul le compte concerné est touché. Dans la console Firestore, la version doit donc être un **nombre entier** (pas du texte).
- **Prolongation d'un accès** : `fin` doit être un nombre JSON (ni texte, ni `null` implicite), dans le futur, et au plus 10 ans ; sinon `fin-invalide`. « Sans fin » reste possible par `permanent: true`.
- Vérifié dans le code : l'adaptateur Firestore réel écrit `null` en `nullValue` et le relit en `null`, convertit `integerValue` (texte REST) en nombre, renvoie `null` pour un document absent (404) ; `firestore.rules` refuse tout pour tous les clients ; `lireSession` n'est appelé que par l'API et par le garde des pages.

**Risques restants connus (non corrigés, volontairement) :**
- ~~Écriture concurrente de la version~~ : corrigé (incrémentation atomique côté Firestore, voir ci-dessous).
- Supprimer le document `sessions_etat` (à la main, ou par la suppression RGPD du compte) remet la version à 0 : un ancien cookie non expiré redeviendrait valable jusqu'à 5 jours. Ne pas supprimer ce document « pour nettoyer » après une urgence.
- Une lecture Firestore de plus par requête connectée (coût et latence) ; si Firestore est indisponible, les connectés sont traités comme visiteurs (refus sûr, mais visible).
- La révocation ne couvre que le cookie du site : si les identifiants Firebase ou un jeton de rafraîchissement sont volés, il faut aussi désactiver le compte dans Firebase.
- Le garde des pages de jeu ne consulte pas la version (voir plus haut). Le journal de révocation ne garde pas l'identifiant du compte ciblé.
- Les tests de l'adaptateur Firestore réel avec `sessions_etat` n'ont pas pu tourner (émulateur Firebase indisponible : Java absent).

## Compléments du 2e lot (28/11/2026) : sauvegarde, concurrence, séparation test / réel
### 1. `sessions_etat` dans la sauvegarde et la restauration
- `sessions_etat` est dans `COLLECTIONS` (`outils/sauvegarde/restauration.mjs`) : exportée et sauvegardée avec le reste (elle ne contient que des identifiants de compte et des nombres).
- **Import normal** (base vide) : refusé si la base contient déjà une version, comme pour les autres collections.
- **Import forcé** (`forcer`) : pour chaque compte, la version la plus **haute** est gardée ; la sauvegarde ne fait jamais redescendre une version. Un compte absent de la sauvegarde n'est pas touché. Une version illisible dans la sauvegarde est copiée telle quelle (le compte reste verrouillé par le fail-closed, jamais libéré) et ne remplace jamais une version valable existante.
- **Ancien format** (sauvegarde d'avant le 28/11/2026, sans `sessions_etat`) : l'import ne supprime ni ne remet à zéro aucune version existante.
- **Après chaque import réussi en ligne de commande**, `invaliderSessions()` s'exécute (sauf `--garder-sessions`, pour un simple exercice) : chaque compte reçoit la version `max(version + 1, instant présent en ms)`. L'instant présent dépasse toutes les versions déjà émises (qui montent de 1 en 1), donc **toute session ouverte avant la restauration est invalide**, quelle que soit l'ancienneté de la sauvegarde. Chacun se reconnecte une fois ; les révocations suivantes continuent de +1.
- `verifier-sauvegarde.mjs` indique si la sauvegarde contient `sessions_etat`.

### 2. Concurrence des révocations
La révocation lisait la version puis écrivait +1 : deux révocations simultanées pouvaient donner la même version, et une écriture lente pouvait la faire redescendre. Elle appelle maintenant `base.incrementer()` : sur Firestore, une écriture `documents:commit` avec la transformation `increment` (atomique côté serveur, équivalente à une transaction sur ce seul document), sans lecture préalable. 25 appels simultanés donnent 25 versions différentes, la version ne redescend jamais (testé ; la méthode lecture-puis-écriture, rejouée sur le même simulateur, perd bien des révocations).

### 3. Séparation des environnements de paiement (`serveur/stripe.js`, `serveur/api.js`, `serveur/don.js`)
| Environnement (`ENVIRONNEMENT`) | Clé secrète test | Clé secrète réelle | Événement Stripe test | Événement réel |
|---|---|---|---|---|
| `production` | **refusée** | acceptée seulement avec `STRIPE_MODE_REEL=autorise` ET mentions légales complètes | **refusé** (`mode-test-refuse`) | accepté sous les mêmes conditions |
| tout autre (préproduction, local, inconnu) | acceptée | **refusée**, même avec l'accord | accepté | **refusé** (`mode-reel-refuse`) |
- Avant : une clé `sk_test_` collée dans la production aurait donné de **vrais accès Premium** contre une carte de test (le webhook de test est valide) ; une clé réelle collée en préproduction aurait encaissé de vrais paiements. Une clé restreinte `rk_live_…` n'était pas reconnue comme réelle (elle passait pour une clé de test) ; les formats inconnus sont maintenant refusés.
- Clé refusée = `configuration-invalide` (503) sur toute l'API, comme pour les autres clés refusées : un collage fautif se voit tout de suite et ne peut rien encaisser.
- La clé publiable renvoyée au navigateur (`/api/don/config`) doit être du même mode que l'environnement et que la clé secrète, sinon `null`.
- La production actuelle ne contient aucune variable `STRIPE_*` : aucun changement de comportement pour elle.

### 4. Ce qui a réellement été testé
- Module `base-firestore.js` réel contre un **simulateur** REST (`outils/tests/firestore-simule.mjs`) : `incrementer`, concurrence, API de révocation, sauvegarde et restauration. **Ce n'est pas l'émulateur officiel ni le vrai Firestore** (Java absent sur ce poste) : la requête `documents:commit` + `updateTransforms` n'a pas été exécutée contre Firestore. Les mêmes scénarios sont ajoutés à `base-firestore-emulateur.test.mjs` (comparaison avec la base mémoire), qui les rejouera avec `bash outils/tests/emulateurs-firebase.sh` quand Java sera installé.

### 5. Suites données à la revue de sécurité du 2e lot
- **Version illisible et API de révocation** : l'incrémentation ne remplace plus une version illisible (texte, négatif, décimal) par une valeur basse : l'API répond **409 `etat-sessions-illisible`** et ne touche pas au document. Corriger à la main dans la console Firestore (nombre entier), puis relancer.
- **Restauration** : un document actuel illisible n'est pas « libéré » par une version valable de la sauvegarde ; l'invalidation des sessions s'exécute après tout import en ligne de commande, même en cas de différences ; commande autonome `invalider-sessions` ; la ligne de commande ne démarrait pas sous Windows (comparaison `file://` + chemin fausse) : corrigé et testé. **Limite** : un compte créé après la sauvegarde n'a pas de ligne dans la base restaurée, donc pas de version : pour couvrir aussi ces comptes, changer `SESSION_SECRET` après la restauration (déconnecte tout le monde). Entre la fin de l'import et l'invalidation, le site reste en service quelques instants avec les anciennes versions : faire la restauration sur un site non public (projet de test) ou en maintenance.
- **Clé Stripe** : espaces et retours à la ligne collés avec la clé sont retirés. Une clé refusée (test en production, réelle hors production, format inconnu) reste un `configuration-invalide` 503 sur toute l'API : choix conservé (comme pour les clés réelles refusées avant ce lot) pour qu'un collage fautif soit vu tout de suite ; contrepartie : tout le site de comptes est indisponible jusqu'à correction du secret. Aujourd'hui sans effet : la production n'a aucune variable `STRIPE_*`.
- **Clé publiable** : n'est plus exposée si la clé secrète est présente mais illisible ou d'un autre mode.
- **À faire avant l'ouverture des paiements** : le test `paiement-mode` du mode « réel » passe maintenant `ENVIRONNEMENT: production` ; vérifier dans le tableau de bord Cloudflare que `ENVIRONNEMENT` est bien présent sur les déploiements d'aperçu de chaque branche (le build le garantit déjà pour `preproduction` et `production`).
