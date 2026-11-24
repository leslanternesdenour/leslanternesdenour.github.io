// Plan de génération des candidats de synthèse (pur : aucun réseau, aucune clé).
import { urlCandidat } from './donnees.js';
// fiche : lignes de fiche(ALPHABET) ; voix : VOIX_NOUR ; modele : MODELE_SYNTHESE ; deja : Set des fichiers déjà présents (jamais écrasés).
export function planGeneration(fiche, voix, modele, deja = new Set()) {
  const plan = [];
  for (const [cle, v] of Object.entries(voix)) for (const l of fiche) {
    const fichier = urlCandidat(l.id, l.element, cle);
    if (deja.has(fichier)) continue;
    plan.push({ voix: cle, voixId: v.id, voixNom: v.nom, id: l.id, element: l.element, fichier, corps: { text: l.texte, model_id: modele.model_id, voice_settings: modele.reglages } });
  }
  return plan;
}
export const caracteres = plan => plan.reduce((s, j) => s + [...j.corps.text].length, 0);
