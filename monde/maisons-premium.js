// Les maisons dont le contenu est dans le stockage privé (Premium ou en préparation). Sans Three.js : testable seul.
// Le serveur décide (/api/catalogue). Une maison n'a PAS d'adresse publique : elle est servie par /api/premium/maisons/<id>/,
// seulement à un compte qui y a droit (ou au Créateur, pour l'aperçu d'une maison pas encore publiée).
// Seules les maisons qui existent vraiment sont listées ici ; les autres restent « Bientôt ».
export const MAISONS_PRIVEES = ['mots'];

// catalogue : réponse de /api/catalogue (ou null) → nouvel état de chaque bâtiment concerné
export function etatsMaisons(catalogue) {
  const out = {};
  const maisons = catalogue && catalogue.catalogue && catalogue.catalogue.maisons || {};
  for (const id of MAISONS_PRIVEES) {
    const c = maisons[id];
    if (!c) { out[id] = { etat: 'bientot' }; continue; }
    if (c.ouvert) out[id] = { etat: 'ouvert', lien: `/api/premium/maisons/${id}/`, apercu: !c.publie };
    else out[id] = { etat: c.publie ? 'reserve' : 'bientot' };      // publiée mais pas ouverte pour ce compte : réservée (sans prix)
  }
  return out;
}

export function appliquerMaisons(batiments, etats) {
  for (const b of batiments) if (etats[b.id]) { const e = etats[b.id]; b.etat = e.etat; b.lien = e.lien || undefined; b.apercu = !!e.apercu; }
  return batiments;
}

export async function chargerMaisons(batiments, { fetcher = (u, o) => fetch(u, o) } = {}) {
  let cat = null;
  try { const r = await fetcher('/api/catalogue', { credentials: 'same-origin', cache: 'no-store' }); if (r.ok) cat = await r.json(); } catch (e) {}
  appliquerMaisons(batiments, etatsMaisons(cat));
  return cat;
}

// Texte montré dans le panneau d'une maison réservée : neutre, sans prix ni bouton d'achat (les enfants le voient).
export const TEXTE_RESERVE = 'Cette maison s\'ouvre avec l\'accès Premium. (Pour les parents : voir l\'Espace famille.)';
