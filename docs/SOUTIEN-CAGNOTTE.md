# Cagnotte de soutien — page `/soutenir/`

Page dédiée (indépendante des abonnements Premium / Famille, sans Stripe, sans compte, sans collecte de données).
Fichiers : `soutenir/index.html`, `soutenir/soutenir.css`, `soutenir/soutenir.js`, `soutenir/config.js`.

## Pour ouvrir la cagnotte (une seule modification)
1. Créer la cagnotte sur Leetchi (https://www.leetchi.com/fr) et copier son **vrai** lien.
2. Le coller dans `soutenir/config.js` : `export const SUPPORT_POT_URL = 'https://www.leetchi.com/…';`
3. Retirer `<meta name="robots" content="noindex">` de `soutenir/index.html` et ajouter `https://leslanternesdenour.fr/soutenir/` à `sitemap.xml` si la page doit être référencée.
4. Commiter, déployer, vérifier que le bouton « PARTICIPER À LA CAGNOTTE » s'ouvre dans un nouvel onglet.

Tant que `SUPPORT_POT_URL` est vide : message « La cagnotte sera bientôt disponible », aucun bouton cliquable.
Une adresse qui n'est pas en https sur `leetchi.com` est ignorée (sécurité).

## Règles respectées
Contribution facultative ; aucun contenu gratuit bloqué ; aucun montant collecté ni contributeur affiché (la répartition est une **estimation prévisionnelle**) ; pas de contribution récurrente ; pas de compte à rebours ; pas de promesse de réduction fiscale ; le projet n'est pas présenté comme une association.

## À fournir par le responsable du projet (non inventé)
Éventuelles informations légales (statut, identité du porteur de la cagnotte, adresse de contact), si Leetchi ou la loi l'exigent ; elles ne figurent pas sur la page.
Accès : pied de page de l'accueil (`index.html`) et de la page « Découvrir » (`decouvrir/index.html`). Aucune sollicitation dans les jeux.
