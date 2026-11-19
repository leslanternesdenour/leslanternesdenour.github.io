# Sécuriser les comptes propriétaires (D4) — sans aucun coût

Le compte Créateur des Lanternes de Nour est protégé par le code (double verrou rôle + `CREATOR_UID`, reconnexion récente,
journal). Mais la **vraie clé de secours** est l'ensemble de vos comptes propriétaires : celui qui les contrôle contrôle tout.

| Compte | À faire | Où |
|---|---|---|
| **Google** (propriétaire du futur projet Firebase) | Validation en 2 étapes par **clé d'accès (passkey)** ou application d'authentification ; codes de secours imprimés ; e-mail et téléphone de récupération à jour ; vérifier les appareils connectés | myaccount.google.com → Sécurité |
| **GitHub** | 2FA par application ou clé d'accès ; codes de récupération hors ligne ; vérifier *Sessions* et *Applications autorisées* (garder seulement celles utiles) | github.com → Settings → Password and authentication |
| **Cloudflare** | 2FA par application ; codes de récupération hors ligne | dash.cloudflare.com → Mon profil → Authentification |
| **Stripe** (plus tard) | 2FA obligatoire avant toute activation | dashboard.stripe.com → Paramètres |
| **Messagerie du projet** | 2FA : c'est par elle que passent toutes les réinitialisations de mot de passe | fournisseur de messagerie |

Règles :
- Un **mot de passe unique et long** par compte, dans un gestionnaire de mots de passe.
- Les **codes de récupération** : sur papier, rangés chez vous, jamais en photo dans le téléphone.
- Ne jamais transmettre un code reçu par SMS ou e-mail à quelqu'un, même « du support ».
- Les clés techniques (Firebase, Stripe, sauvegardes) ne vont **jamais** dans le dépôt : uniquement dans les « secrets »
  de Cloudflare / GitHub. Le dépôt a un `.gitignore` qui les bloque et un contrôle automatique avant chaque envoi.

## Protections du compte Créateur prévues dans le code (sans option payante)
1. Rôle `creator` posé uniquement par un script local (jamais par le site) **et** identifiant inscrit dans le secret serveur `CREATOR_UID` : les deux sont exigés.
2. `/admin/` et toute action sensible exigent une **connexion de moins de 15 minutes**.
3. Limitation du nombre de tentatives sur les routes d'administration et d'invitation.
4. **Journal** de chaque action (création, prolongation, révocation d'accès), non modifiable.
5. Alerte par e-mail au Créateur à chaque connexion à `/admin/` (à préparer avec l'étape Firebase).

## Plus tard : 2FA sur le compte Firebase Créateur
Firebase ne propose la double authentification (TOTP ou SMS) qu'avec l'option payante « Identity Platform ».
Je vous présenterai le coût exact et les alternatives (par exemple une protection Cloudflare devant `/admin/`)
avant toute décision. Rien n'est activé.
