// Page /soutenir/ : affiche le bouton « PARTICIPER À LA CAGNOTTE » UNIQUEMENT si SUPPORT_POT_URL est une adresse https Leetchi valide.
// Sinon : message « bientôt disponible » et aucun lien cliquable. Aucun paiement, aucun appel réseau, aucune donnée collectée ici.
import { SUPPORT_POT_URL } from './config.js?v=1';

export function urlCagnotteValide(brut) {
  if (typeof brut !== 'string' || !brut.trim()) return null;
  try {
    const u = new URL(brut.trim());
    const hote = u.hostname.toLowerCase();
    if (u.protocol !== 'https:') return null;
    if (hote !== 'leetchi.com' && !hote.endsWith('.leetchi.com')) return null;
    return u.href;
  } catch (e) { return null; }
}

const $ = id => document.getElementById(id);
const url = urlCagnotteValide(SUPPORT_POT_URL);
if (SUPPORT_POT_URL && !url) console.warn('SUPPORT_POT_URL ignoré : il doit s\'agir d\'une adresse https://…leetchi.com/…');
if (url) {
  const a = $('btn-participer'); a.href = url; a.hidden = false; $('note-leetchi').hidden = false;
} else {
  $('msg-bientot').hidden = false;
}
