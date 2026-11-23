// CONFIGURATION DE LA PAGE DE SOUTIEN (page /soutenir/).
//
// Le don en ligne n'a plus d'adresse à renseigner ici : le paiement se fait dans la page (formulaire Stripe) et c'est le SERVEUR
// qui décide s'il est ouvert. Tant que les clés Stripe ne sont pas configurées côté serveur (secrets STRIPE_CLE_SECRETE et
// STRIPE_CLE_PUBLIABLE, tableau de bord Cloudflare — jamais dans le dépôt), la page affiche « La cagnotte sera bientôt disponible »
// et aucun formulaire. Voir docs/SOUTIEN-CAGNOTTE.md.
//
// Il n'y a ici aucun secret.

// Objectif initial (estimation, susceptible d'évoluer). Aucune somme collectée n'est affichée.
export const OBJECTIF_EUROS = 3000;
