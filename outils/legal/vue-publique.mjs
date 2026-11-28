// Vue PUBLIQUE de la page Conditions pour la PRODUCTION : les emplacements « EN ATTENTE » (réservés au créateur) ne sont jamais montrés tels quels au public.
// Ils deviennent une mention neutre et honnête (« communiqué à l'ouverture commerciale ») et le bandeau explique que les paiements ne sont pas ouverts.
// Le fichier source conditions/index.html n'est PAS modifié : seule la copie publiée (dist/) l'est. Quand tous les champs sont renseignés, la page passe telle quelle.
const RE_CHAMP = /<mark class="attente" data-champ="[a-z-]+">[^<]*<\/mark>/g;
const RE_BANDEAU = /<p class="bandeau-sim" id="bandeau-attente">[^<]*<\/p>/;
export const MENTION_A_VENIR = '<em>communiqué à l\'ouverture commerciale</em>';
export const BANDEAU_PUBLIC = '<p class="bandeau-sim" id="bandeau-attente">Service en préparation : les paiements ne sont pas encore ouverts. Les informations de l\'éditeur seront publiées ici avant toute ouverture commerciale.</p>';
export function vuePublique(html) {
  if (!RE_CHAMP.test(html)) { RE_CHAMP.lastIndex = 0; return html; }
  RE_CHAMP.lastIndex = 0;
  return html.replace(RE_CHAMP, MENTION_A_VENIR).replace(RE_BANDEAU, BANDEAU_PUBLIC);
}
// Marqueurs interdits dans une page publiée en production.
export const MARQUEURS_PROVISOIRES = /\[À (COMPLÉTER|FAIRE RELIRE|VÉRIFIER)|\[EN ATTENTE|BROUILLON EN PRÉPRODUCTION/;