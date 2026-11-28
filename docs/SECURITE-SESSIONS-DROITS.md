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

**Limites connues.** Le garde des pages de jeu (`functions/_middleware.js`, `serveur/garde-pages.js`) lit toujours le cookie sans consulter Firestore : un cookie révoqué peut encore charger les pages HTML publiques de jeu, mais plus aucune donnée de compte, Premium ni administration (tout passe par l'API). Le rôle Créateur n'est pas revérifié auprès de Firebase (compte désactivé) : la révocation de version est le moyen prévu. Un nouveau document est lu à chaque requête de l'API (1 lecture Firestore de plus par appel). La sauvegarde (`outils/sauvegarde/restauration.mjs`) n'inclut pas encore `sessions_etat` : restaurer une ancienne sauvegarde annulerait les révocations de moins de 5 jours.

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
- Écriture concurrente de la version (lecture puis +1, sans transaction) : deux révocations simultanées peuvent n'en produire qu'une. Réservé au Créateur, fenêtre très étroite ; relancer la révocation.
- Supprimer le document `sessions_etat` (à la main, ou par la suppression RGPD du compte) remet la version à 0 : un ancien cookie non expiré redeviendrait valable jusqu'à 5 jours. Ne pas supprimer ce document « pour nettoyer » après une urgence.
- Une lecture Firestore de plus par requête connectée (coût et latence) ; si Firestore est indisponible, les connectés sont traités comme visiteurs (refus sûr, mais visible).
- La révocation ne couvre que le cookie du site : si les identifiants Firebase ou un jeton de rafraîchissement sont volés, il faut aussi désactiver le compte dans Firebase.
- Le garde des pages de jeu ne consulte pas la version (voir plus haut). Le journal de révocation ne garde pas l'identifiant du compte ciblé.
- Les tests de l'adaptateur Firestore réel avec `sessions_etat` n'ont pas pu tourner (émulateur Firebase indisponible : Java absent).
