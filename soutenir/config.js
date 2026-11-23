// CONFIGURATION CENTRALISÉE DE LA CAGNOTTE DE SOUTIEN (page /soutenir/).
//
// SUPPORT_POT_URL : l'adresse RÉELLE de la cagnotte Leetchi, une fois créée par le responsable du projet
// (https://www.leetchi.com/fr). Aucune adresse n'est inventée ici.
//
//   • Tant que la valeur est vide (''), la page affiche « La cagnotte sera bientôt disponible » et AUCUN bouton cliquable.
//   • Dès qu'une adresse https://…leetchi.com/… est renseignée, le bouton « PARTICIPER À LA CAGNOTTE » apparaît
//     et ouvre la cagnotte dans un nouvel onglet (rel="noopener noreferrer").
//   • Toute adresse qui n'est pas en https sur leetchi.com est ignorée (sécurité).
//
// Il n'y a ici aucun secret : le paiement se fait entièrement sur Leetchi. Cette cagnotte n'a aucun lien avec Stripe,
// les abonnements Premium / Famille ni les comptes des familles.
export const SUPPORT_POT_URL = '';

// Objectif initial et répartition PRÉVISIONNELLE (estimation, susceptible d'évoluer). Aucune somme collectée n'est affichée.
export const OBJECTIF_EUROS = 3000;
