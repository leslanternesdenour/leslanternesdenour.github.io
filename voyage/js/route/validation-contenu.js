// La validation des récits et des lieux religieux ou historiques de La Route : UN SEUL interrupteur, avec sa trace (qui, quand).
// Le 24/11/2026, le créateur a validé les récits et les lieux tels qu'ils sont écrits. Les références (versets, sources) restent « à vérifier » : aucune n'a été inventée.
// Remettre `valide` à false suffit à tout remettre « À VALIDER » : badges, avertissements et voix (aucune voix pour un contenu non validé) suivent cet interrupteur.
export const VALIDATION = { valide: true, par: 'le créateur', date: '2026-11-24' };
export const STATUT_VALIDE = 'VALIDÉ';
export const STATUT_A_VALIDER = 'À VALIDER';
export const STATUT_ACTUEL = VALIDATION.valide ? STATUT_VALIDE : STATUT_A_VALIDER;
export const dateLisible = () => VALIDATION.date.split('-').reverse().join('/');
