// GET /api/don/config : clé PUBLIABLE de Stripe pour afficher le formulaire de don (page /soutenir/).
// Fichier plus spécifique que functions/api/[[route]].js : il prend le pas pour cette route et ne dépend PAS de Firebase ni des comptes.
import { traiterDon } from '../../../serveur/don.js';
export const onRequest = ({ request, env }) => traiterDon(request, env);
