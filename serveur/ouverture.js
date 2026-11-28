// INTERRUPTEUR D'OUVERTURE COMMERCIALE — protection contre une ouverture prématurée des paiements réels.
// Tant que les mentions légales de l'éditeur ne sont pas toutes renseignées, aucune clé Stripe RÉELLE n'est acceptée, même si STRIPE_MODE_REEL = « autorise ».
// Passe à true automatiquement quand `node outils/legal/renseigner.mjs infos.json --ecrire` a rempli tous les emplacements de conditions/index.html.
// Un test (outils/tests/mentions-legales.test.mjs) vérifie que cette valeur est cohérente avec la page : on ne peut pas la passer à true à la main sans page complète.
export const MENTIONS_COMPLETES = false;