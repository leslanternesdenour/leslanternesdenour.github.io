// Appels HTTP : reprises limitées aux refus explicites du serveur (non facturés).
import { MASQUE, masquerSecrets } from './garde.mjs';

const PASSAGERES = new Set([429, 500, 502, 503, 504]);
const EXPLICATIONS = { 400: 'requête refusée', 401: 'clé refusée', 403: 'accès interdit (droits de la clé ou facturation)', 404: 'modèle ou adresse introuvable', 429: 'limite de débit ou quota atteint' };
const pause = ms => new Promise(r => setTimeout(r, ms));

export class ErreurApi extends Error {
  constructor(message, { statut = 0, facturationPossible = false } = {}) { super(message); this.statut = statut; this.facturationPossible = facturationPossible; }
}

export async function requeteJson(url, init, { fetch = globalThis.fetch, delaiMs = 180_000, tentatives = 3, attendre = pause, secrets = [] } = {}) {
  // Après envoi, un délai ou une coupure ne dit pas si le fournisseur a travaillé : on ne relance pas.
  const perdu = e => { throw new ErreurApi(e.name === 'TimeoutError' ? `délai de ${delaiMs / 1000} s dépassé` : 'connexion impossible ou interrompue', { facturationPossible: true }); };
  for (let essai = 1; ; essai++) {
    const r = await fetch(url, { ...init, signal: AbortSignal.timeout(delaiMs) }).catch(perdu);
    if (r.ok) return r.json().catch(perdu);
    const corps = await r.json().catch(() => ({}));
    const definitif = corps.error?.code === 'insufficient_quota';
    if (definitif || !PASSAGERES.has(r.status) || essai >= tentatives) {
      // Les fournisseurs citent parfois la clé refusée en partie (début et fin autour d'étoiles) : ces fragments partent aussi.
      const brut = String(corps.error?.message || '').replace(/(sk-|AIza|AQ\.)[A-Za-z0-9_*.-]*[A-Za-z0-9_*-]/g, MASQUE);
      const detail = masquerSecrets(brut.slice(0, 400), secrets).texte;
      throw new ErreurApi(`erreur HTTP ${r.status} : ${EXPLICATIONS[r.status] || 'service indisponible'}${detail ? ` — ${detail}` : ''}`, { statut: r.status });
    }
    const demande = Number(r.headers.get('retry-after'));
    await attendre(Math.min(demande > 0 ? demande * 1000 : 2000 * essai, 60_000));
  }
}
