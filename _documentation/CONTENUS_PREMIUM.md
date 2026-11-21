# Contenus Premium et aperçu Créateur (Bloc 3)

## Principe
- Les textes, versets, voix et maisons Premium ne sont **pas dans le dépôt public** (donc pas dans `dist/`).
- Ils vivent dans un stockage privé (Cloudflare **R2**, binding `R2_PREMIUM`) et ne sont servis que par `/api/premium/<chemin>`,
  après vérification des droits côté serveur, avec `Cache-Control: private, no-store`.
- Le service worker ne met jamais `/api/`, `/admin/`, `/apercu/`, `/compte/`, `/premium/` en cache.

## État du stockage (important)
- **R2 n'est PAS activé** (il demande un moyen de paiement) : décision du créateur requise. Workers KV a été écarté (limite de 25 Mo par valeur, pas conçu pour ce stockage).
- Tout est testé avec une **SIMULATION LOCALE** de R2 : l'émulateur lit un dossier (`LDN_PREMIUM_DIR`). Le code de production (`functions/api/[[route]].js`, `stockagePremium`) n'utilise que l'interface `get`/`lister`, identique pour R2.
- Sans R2 lié, la production répond « aucun contenu » : les zones Premium restent fermées, le gratuit fonctionne.

## Organisation du pack privé (hors dépôt)
```
voyage/<zone>/contenu.json     zone ∈ camp, dunes, montagnes, wadi, rochers   (format "ldn-pack-voyage-1")
voyage/<zone>/voix/*.mp3       voix enregistrées de la zone
maisons/mots/{index.html,jeu.css,jeu.js,mots.json}   Chasse aux mots
```
Niveau d'accès : défini par le catalogue (`serveur/catalogue.js`, modifiable depuis /aperçu ou /admin) ; un chemin inconnu est réservé au Créateur.

## Envoyer le pack dans R2 plus tard (quand le créateur aura décidé d'activer R2)
1. Créer le bucket (ex. `ldn-premium`), le lier au projet Pages sous le nom `R2_PREMIUM` (préproduction d'abord).
2. Envoyer les fichiers en gardant les mêmes chemins (tableau de bord Cloudflare ou `wrangler r2 object put`).
3. Ouvrir `/apercu/` en Créateur : la colonne « Stockage privé » doit compter les fichiers de chaque contenu.
4. **Test réel R2 préparé, non lancé** : refaire dans Chrome `bash outils/tests/parcours-bloc3.sh` contre l'URL `.pages.dev` (adapter `BASE`), et vérifier les en-têtes `private, no-store`.

## Aperçu Créateur (`/apercu/`)
Réservé au compte Créateur. Boutons Créateur / Visiteur / Gratuit / Premium / Famille : le serveur applique les droits du mode choisi aux contenus
(cookie `ldn_vue`, ignoré pour tout autre compte, 2 h). **Aucun vrai compte n'est modifié.** On y voit l'état publié / non publié de chaque contenu,
on peut le changer, essayer une maison dans un cadre « téléphone » et relire les textes d'une zone avant publication.

## Chasse aux mots (première maison)
Deux jeux (« Les paires », « Le bon mot ») et un carnet, à partir des seuls mots arabes déjà vérifiés (`mots.json`). Aucune synthèse vocale arabe.
État : **non publiée** (aperçu Créateur). La publier = la passer en « Premium » depuis `/apercu/`. Les quatre autres maisons ne sont pas créées.

## Tests
`bash outils/tests/tout.sh` (+ `NAVIGATEUR=1`), `outils/tests/premium.test.mjs`, `outils/tests/fuite-premium.mjs`, `outils/tests/parcours-bloc3.sh`.
Non testé ici : le rendu 3D (Three.js bloqué dans l'environnement de développement) → à valider sur la préproduction `.pages.dev`.
