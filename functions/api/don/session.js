// POST /api/don/session : crée la session de paiement intégré d'un don (montant libre de 1 à 500 €).
// Fichier plus spécifique que functions/api/[[route]].js : il prend le pas pour cette route et ne dépend PAS de Firebase ni des comptes.
// Secrets (tableau de bord Cloudflare, jamais dans le dépôt) : STRIPE_CLE_SECRETE, STRIPE_CLE_PUBLIABLE.
import { traiterDon } from '../../../serveur/don.js';
export const onRequest = ({ request, env }) => traiterDon(request, env);
