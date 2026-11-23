// Exécution du plan de génération (les appels réseau et fichiers sont injectés : testable sans ElevenLabs).
export async function executerPlan(plan, { appeler, ecrire, existe = () => false, pause = ms => new Promise(ok => setTimeout(ok, ms)) }) {
  const clips = {}; let faits = 0, utilises = 0;
  for (const j of plan) {
    if (existe(j.fichier)) continue;          // jamais d'écrasement, et aucun appel (aucun crédit) pour un clip déjà là
    let r = await appeler(j);
    for (let essai = 1; r.status === 429 && essai < 4; essai++) { await pause(1500 * essai); r = await appeler(j); }   // limite de débit : on patiente puis on réessaie (4 tentatives au plus)
    if (!r.ok) return { faits, utilises, clips, erreur: { status: r.status, voix: j.voix, lettre: j.id, element: j.element, message: r.message || '' } };   // arrêt immédiat : plus aucun crédit utilisé
    await ecrire(j.fichier, r.octets);
    clips[j.fichier] = { voix: j.voix, voixId: j.voixId, voixNom: j.voixNom, lettre: j.id, element: j.element, texte: j.corps.text, modele: j.corps.model_id };
    faits++; utilises += [...j.corps.text].length;
  }
  return { faits, utilises, clips, erreur: null };
}
