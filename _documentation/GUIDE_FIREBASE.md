# Firebase : mise en place pas à pas (gratuit, offre Spark, sans carte bancaire)

Principe : **une seule manipulation à la fois**. Après chacune, dites « fait » : je vérifie ce qui peut l'être (avec `node outils/admin/verifier-configuration.mjs https://lanternes-de-nour.pages.dev`) avant la suivante.
Les libellés de la console Google peuvent légèrement changer ; si un écran diffère, décrivez-le-moi.

**Ce que fait Firebase ici** : uniquement l'identité des parents (e-mail + mot de passe, vérification de l'adresse, mot de passe oublié) et la base des comptes. Le navigateur ne lit ni n'écrit jamais dans Firestore : tout passe par notre serveur (règles Firestore = « tout refusé »).

## Étape 1 — Créer le projet
1. https://console.firebase.google.com → **Créer un projet** (ou « Add project »).
2. Nom : `lanternes-de-nour`. Notez l'**identifiant du projet** affiché sous le nom (il peut avoir un suffixe) : envoyez-le-moi.
3. **Google Analytics : désactivé** (on ne collecte rien sur les enfants). Créer.
4. Ne cliquez jamais sur « Passer au forfait Blaze » / « Upgrade ». Le forfait doit rester **Spark**.

## Étape 2 — Activer E-mail / mot de passe
Build → **Authentication** → Commencer → onglet « Méthode de connexion » → **E-mail/Mot de passe** → Activer (le lien par e-mail « sans mot de passe » reste **désactivé**) → Enregistrer.
N'activez aucun autre fournisseur (ni Google, ni téléphone/SMS : le SMS est payant).

## Étape 3 — Réglages de sécurité de l'authentification
Authentication → **Paramètres** :
- **Domaines autorisés** : ajoutez `lanternes-de-nour.pages.dev` (plus tard, le vrai domaine, seulement quand vous déciderez de la mise en production).
- **Protection contre l'énumération d'adresses e-mail** : activée.
- **Stratégie de mot de passe** : longueur minimale **8**, application « Enforce ».
- Authentication → **Modèles** (Templates) : pour « Validation de l'adresse e-mail » et « Réinitialisation du mot de passe », ouvrez le crayon → **Langue : français**. Ne modifiez pas le lien d'action.

## Étape 4 — Créer la base Firestore (Europe, mode production)
1. Build → **Firestore Database** → Créer une base de données.
2. Édition **Standard**, emplacement **`eur3` (Europe)** : définitif, choisissez bien (données d'enfants : on reste en Europe).
3. Mode **Production** (pas « test »).
4. Onglet **Règles** → remplacez tout le contenu par ceci, puis **Publier** :
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

## Étape 5 — Application web (clé publique)
Paramètres du projet (roue dentée) → Général → « Vos applications » → **Web (`</>`)** → surnom `lanternes-de-nour-web` → **sans** Firebase Hosting → Enregistrer.
Copiez l'objet `firebaseConfig` affiché et **envoyez-le-moi** : ces valeurs sont publiques par nature, je les inscris dans `compte/config.js`.

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

## Étape 8 — Je teste tout (aucune action de votre part)
Je lance `node outils/tests/parcours-reel.mjs https://lanternes-de-nour.pages.dev` : inscription, session, profil enfant, limites du Gratuit, contenu Premium fermé, administration fermée, suppression du compte. Le compte de test est **toujours** supprimé à la fin.

## Étape 9 — Votre compte Créateur
Voir `PREPRODUCTION_ACTIONS.md` § D (création du compte, UID, un clic sur « Activer l'espace Créateur »).

## Étape 10 — Restreindre la clé publique (après les tests, recommandé)
Console Google Cloud (lien « Gérer… » depuis Firebase) → API et services → Identifiants → la « Browser key » créée par Firebase → **Restrictions d'application : sites web** → `https://lanternes-de-nour.pages.dev/*` ; **Restrictions d'API** : Identity Toolkit API et Token Service API. À mettre à jour quand le vrai domaine sera utilisé.

## Protection des données des enfants (ce que le système garantit)
- Aucune donnée d'enfant dans Firebase Authentication : seuls l'e-mail et le mot de passe du **parent** y sont.
- Profil enfant = surnom (lettres seulement), tranche d'âge, personnage, progression de jeu. Ni nom de famille, ni date de naissance, ni photo.
- Tout est contrôlé côté serveur (droits, limites, propriété des profils) ; le navigateur n'est jamais cru sur parole.
- Suppression du compte = effacement en cascade (profils, droits, accès offerts, abonnement, lien Stripe, compte Firebase), rejouable en cas de panne ; la preuve d'achat est conservée mais détachée du compte (obligation légale).
- Région Firestore : Europe (`eur3`).
