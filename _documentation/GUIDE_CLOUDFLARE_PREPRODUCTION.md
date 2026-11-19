# Mettre en ligne la préproduction sur Cloudflare Pages (gratuit)

Ce que cela fait : le site de la branche `preproduction` sera visible à une adresse provisoire du type
`https://lanternes-de-nour.pages.dev`, **non indexée par Google**. Le site officiel (leslanternesdenour.fr, servi par
GitHub Pages depuis `main`) **ne change pas** : aucun DNS n'est touché.

Coût : 0 €. Aucune carte bancaire n'est nécessaire pour l'offre gratuite.

## 1. Créer le compte (5 minutes)
1. Allez sur https://dash.cloudflare.com/sign-up et créez le compte avec l'adresse e-mail du projet.
2. **Sécurité, tout de suite** : Mon profil → Authentification → activez l'**authentification à deux facteurs** avec une
   application (Google Authenticator, Aegis, 1Password…). Enregistrez les **codes de récupération** hors ligne
   (gestionnaire de mots de passe + papier). Ne choisissez aucune offre payante.

## 2. Relier le dépôt GitHub
1. Tableau de bord → **Workers et Pages** → **Créer** → onglet **Pages** → **Se connecter à Git**.
2. Autorisez l'application Cloudflare sur GitHub **uniquement** pour le dépôt `leslanternesdenour.github.io`
   (« Only select repositories »).
3. Choisissez le dépôt, puis réglez **exactement** :

| Réglage | Valeur |
|---|---|
| Nom du projet | `lanternes-de-nour` |
| Branche de production | **`preproduction`** (surtout pas `main`) |
| Préréglage de framework | Aucun |
| Commande de build | `node outils/construire.mjs` |
| Dossier de sortie du build | `dist` |
| Variables d'environnement | `LDN_PREPROD` = `1` · `NODE_VERSION` = `22` |

4. **Déployer**. Au bout de 1 à 2 minutes, Cloudflare affiche l'adresse `https://….pages.dev` : envoyez-la-moi.
5. Paramètres du projet → **Builds** → *Branches de prévisualisation* : choisissez **Aucune** (aucune autre branche,
   et surtout pas `main`, n'est publiée automatiquement).

## 3. Ce que je vérifie ensuite
- `https://…pages.dev/api/sante` répond `{"ok":true,…}` (fonctions serveur actives).
- En-têtes de sécurité et `X-Robots-Tag: noindex` présents.
- Tests automatiques complets (11 pages × 3 écrans), **jeux 3D cette fois avec Three.js réel**.
- Une page inexistante affiche la page 404 des Lanternes.

## 4. Test sur votre smartphone modeste
Ouvrez, sur le téléphone, en 4G de préférence :
- `https://…pages.dev/monde/?mesure=1`
- `https://…pages.dev/voyage/?mesure=1`
- `https://…pages.dev/ablutions/jeu3d/?mesure=1` et `…/priere/jeu3d/?mesure=1`

Un petit cadre en bas à droite affiche les images par seconde (FPS), le temps de chargement et la mémoire.
Jouez 2 minutes, puis faites une capture d'écran du cadre et notez le modèle du téléphone.
Objectifs : village utilisable en moins de 6 s en 4G, **30 FPS ou plus** en graphismes « Faible », aucun plantage.

## Ce qui reste interdit sans votre accord
Transfert DNS, domaine personnalisé sur Cloudflare, offre payante, modification de `main` ou du site officiel.
