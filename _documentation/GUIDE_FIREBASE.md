# Firebase : mise en place pas à pas (gratuit, offre Spark, sans carte bancaire)

Principe : **une seule manipulation à la fois**. Après chacune, dites « fait » : je vérifie ce qui peut l'être (avec `node outils/admin/verifier-configuration.mjs https://lanternes-de-nour.pages.dev`) avant la suivante.
Les libellés de la console Google peuvent légèrement changer ; si un écran diffère, décrivez-le-moi.

**Ce que fait Firebase ici** : uniquement l'identité des parents (e-mail + mot de passe, vérification de l'adresse, mot de passe oublié) et la base des comptes. Le navigateur ne lit ni n'écrit jamais dans Firestore : tout passe par notre serveur (règles Firestore = « tout refusé »).

## Étape 1 — Créer le projet
1. https://console.firebase.google.com → **Créer un projet** (ou « Add project »).
2. Nom : `lanternes-de-nour`. Notez l'**identifiant du projet** affiché sous le nom (il peut avoir un suffixe) : envoyez-le-moi.
3. **Google Analytics : désactivé** (on ne collecte rien sur les enfants). Créer.
4. Ne cliquez jamais sur « Passer au forfait Blaze » / « Upgrade ». Le forfait doit rester **Spark**.

## Étape 2 — Deux méthodes de connexion : e-mail/mot de passe et Google
Build → **Authentication** → Commencer → onglet « Méthode de connexion » :
1. **E-mail/Mot de passe** → Activer (le lien par e-mail « sans mot de passe » reste **désactivé**) → Enregistrer.
2. **Google** → Activer. « Nom public du projet » : `Les Lanternes de Nour`. « E-mail d'assistance du projet » : `leslanternesdenour@gmail.com` → Enregistrer.
3. **Apple, Anonyme, Téléphone/SMS (payant), GitHub, Facebook… : tous désactivés** (Apple est reporté).
Le serveur n'accepte que ces deux méthodes (`fournisseur-non-autorise` pour tout le reste, testé) : même un fournisseur activé par erreur ne donnerait aucun accès.

## Étape 3 — Réglages de sécurité de l'authentification
Authentication → **Paramètres** :
- **Domaines autorisés** : ajoutez `lanternes-de-nour.pages.dev` (plus tard, le vrai domaine, seulement quand vous déciderez de la mise en production).
- **Liaison des comptes** (« Account linking » / « Un compte par adresse e-mail ») : laisser **« Associer les comptes qui utilisent la même adresse e-mail »**. Ainsi un parent inscrit avec un mot de passe qui revient avec Google (même adresse) retrouve **la même famille** et ses profils. Ne choisissez jamais « Créer plusieurs comptes pour chaque fournisseur ».
- **Protection contre l'énumération d'adresses e-mail** : activée.
- **Stratégie de mot de passe** : longueur minimale **8**, application « Enforce ».
- Authentication → **Modèles** (Templates) : pour « Validation de l'adresse e-mail » et « Réinitialisation du mot de passe », ouvrez le crayon → **Langue : français**. Ne modifiez pas le lien d'action.

## Étape 3 bis — Écran de consentement Google (une fois)
Firebase crée seul le « client OAuth » de Google, avec la bonne adresse de retour (`https://lanternes-de-nour.firebaseapp.com/__/auth/handler`) : **rien à ajouter** tant que le site utilise l'adresse `…firebaseapp.com` par défaut.
Console Google Cloud (Firebase → roue dentée → « Utilisateurs et autorisations » → lien vers Google Cloud, ou https://console.cloud.google.com avec le projet `lanternes-de-nour`) → **Google Auth Platform** (ou « API et services → Écran de consentement OAuth ») :
- Type d'utilisateurs : **Externe**. Nom de l'application : `Les Lanternes de Nour`. E-mail d'assistance et de contact : `leslanternesdenour@gmail.com`. **Aucun logo** (le logo déclenche une validation de marque).
- Portées : seulement les portées de base **e-mail, profil, openid** (elles n'exigent aucune validation Google). N'en ajoutez aucune autre.
- État de publication : **« En production »** (si l'application reste en « Test », seuls les comptes de test pourraient se connecter).
Rien de tout cela n'est payant.

## Étape 4 — Créer la base Firestore (Europe, mode production)
1. Build → **Firestore Database** → Créer une base de données.
2. Édition **Standard**, emplacement **`eur3` (Europe)** : définitif, choisissez bien (données d'enfants : on reste en Europe).
3. Mode **Production** (pas « test »).
4. Onglet **Règles** : en mode Production, Firebase active déjà des règles « tout refusé » (vérifié sur la vraie base le 21/11/2026 : 20 vérifications sur 20). Aucun bouton « Publier » n'apparaît tant que le texte n'est pas modifié : **il n'y a rien à publier**. Le texte attendu est :
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
(Ce sont exactement les règles du fichier `firestore.rules`, testées dans l'émulateur officiel : tout est refusé à tout navigateur, seul le serveur écrit.)
**Vérification réelle** : `node outils/admin/verifier-firestore.mjs` teste la base déployée avec un visiteur anonyme puis un parent connecté (liste, lecture, requête, création, modification, suppression) : tout doit être refusé (403). Il crée un compte de test toujours supprimé et ne crée aucune collection. Résultat du 21/11/2026 : 20 vérifications sur 20 conformes (base `(default)`, `eur3`, mode production).

## Étape 5 — Application web (clé publique)
Paramètres du projet (roue dentée) → Général → « Vos applications » → **Web (`</>`)** → surnom `lanternes-de-nour-web` → **sans** Firebase Hosting → Enregistrer.
Copiez l'objet `firebaseConfig` affiché et **envoyez-le-moi** : ces valeurs sont publiques par nature, je les inscris dans `compte/config.js`.
Dès que je l'ai, **je vérifie moi-même** la console avec `node outils/admin/verifier-firebase.mjs` : domaines autorisés, e-mail/mot de passe, Google activé, Apple et Anonyme désactivés, règle de mot de passe, puis un vrai cycle inscription → connexion → suppression par e-mail (compte de test toujours supprimé).

## Étape 6 — Clé du serveur (la seule chose secrète)
Paramètres du projet → **Comptes de service** → **Générer une nouvelle clé privée**. Un fichier `.json` se télécharge.
- **Ne me l'envoyez pas, ne le collez dans aucun message, aucun e-mail, aucun dépôt.**
- Ouvrez-le avec le Bloc-notes, **Ctrl+A, Ctrl+C**, puis dans Cloudflare : projet `lanternes-de-nour` → Settings → **Variables and Secrets** → Add → nom `FIREBASE_COMPTE_SERVICE`, type **Secret**, collez, enregistrez.
- Rangez le fichier dans votre gestionnaire de mots de passe, puis supprimez-le de « Téléchargements ».

## Étape 7 — Les deux autres secrets Cloudflare
Même écran, type **Secret** : 
- `SESSION_SECRET` : une suite aléatoire d'au moins 40 caractères (fonction « générer un mot de passe » de votre gestionnaire).
- (Plus tard, étape Créateur) `CREATOR_UID`.
Je m'occupe de la variable publique `FIREBASE_PROJET` (dans `wrangler.toml`) dès que vous m'avez donné l'identifiant (étape 1).
Puis Deployments → **Retry deployment** (ou je pousse un changement) pour que les secrets soient pris en compte.

## Étape 8 — Tests réels
**Par moi (aucune action de votre part)** : `node outils/tests/parcours-reel.mjs https://lanternes-de-nour.pages.dev` : inscription par e-mail, session, profil enfant, limites du Gratuit, Premium et administration fermés, suppression du compte. Le compte de test est **toujours** supprimé à la fin.
**Par vous (la fenêtre Google ne peut pas être automatisée)** : sur `https://lanternes-de-nour.pages.dev/compte/`, onglet « Créer un compte » → cochez les trois cases → **Créer mon compte avec Google** → choisissez votre compte → vous arrivez dans l'espace. Puis « Se déconnecter » → « Continuer avec Google » (retour direct). Puis, tout en bas, « Supprimer mon compte » → Google demande de confirmer → le compte disparaît. Dites-moi ce que vous voyez à chaque étape.

## Étape 9 — Votre compte Créateur
Voir `PREPRODUCTION_ACTIONS.md` § D (création du compte, UID, un clic sur « Activer l'espace Créateur »).

## Étape 10 — Restreindre la clé publique (après les tests, recommandé)
Console Google Cloud (lien « Gérer… » depuis Firebase) → API et services → Identifiants → la « Browser key » créée par Firebase → **Restrictions d'application : sites web** → `https://lanternes-de-nour.pages.dev/*` ; **Restrictions d'API** : Identity Toolkit API et Token Service API. À mettre à jour quand le vrai domaine sera utilisé.

## Protection des données des enfants (ce que le système garantit)
- Aucune donnée d'enfant dans Firebase Authentication : seuls l'e-mail et le mot de passe du **parent** y sont. Avec Google, Firebase garde aussi le nom et la photo de profil Google du parent (le site ne les utilise ni ne les enregistre : seule l'adresse e-mail est conservée dans notre base) ; la suppression du compte efface tout, y compris côté Firebase.
- Un compte Google nouveau n'est jamais créé sans les trois consentements parentaux (cochés avant d'ouvrir Google) ; si le parent abandonne à l'écran des consentements, le compte est supprimé.
- Profil enfant = surnom (lettres seulement), tranche d'âge, personnage, progression de jeu. Ni nom de famille, ni date de naissance, ni photo.
- Tout est contrôlé côté serveur (droits, limites, propriété des profils) ; le navigateur n'est jamais cru sur parole.
- Suppression du compte = effacement en cascade (profils, droits, accès offerts, abonnement, lien Stripe, compte Firebase), rejouable en cas de panne ; la preuve d'achat est conservée mais détachée du compte (obligation légale).
- Région Firestore : Europe (`eur3`).

## Limites connues de la connexion Google (à connaître, pas des défauts du site)
- **Navigateurs intégrés aux applications** (Instagram, Facebook, TikTok…) : Google refuse d'y ouvrir sa fenêtre. Le site l'explique et propose Safari/Chrome ou l'e-mail.
- **Fenêtres pop-up bloquées** : message clair, avec la marche à suivre.
- Si le vrai nom de domaine est utilisé plus tard : l'ajouter aux domaines autorisés de Firebase et ajuster la CSP (`apis.google.com`, cadre `…firebaseapp.com`) dans `_headers` ; la restriction de la clé d'API (étape 10) aussi.

> Contrôle du secret de session : `/api/sante` (préproduction) affiche `sessionsEtat` = `absent`, `trop-court` (moins de 32 caractères) ou `ok`. Les secrets ne sont pris en compte qu'après un nouveau déploiement.

> Clé du serveur : coller le contenu COMPLET du fichier JSON, de la première accolade `{` à la dernière `}`. Sans les accolades, le site répond `configuration-invalide`. Ne jamais coller la clé dans une conversation, un e-mail ou une note ordinaire ; si cela arrive, supprimer la clé dans Google Cloud (compte de service → Clés) et en générer une nouvelle.
