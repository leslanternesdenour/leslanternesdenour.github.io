// Le bac à sable des essais : avec ?sandbox=1 (local ou préproduction seulement), TOUT ce que le jeu écrit dans le stockage du navigateur est rangé
// sous un préfixe « sandbox: » et toute écriture vers le serveur (/api, comptes, synchronisation) est refusée. Les profils réels ne peuvent donc pas être modifiés.
import { hoteDeTest } from './drapeau.js';

export const sandboxActif = (hote, recherche) => hoteDeTest(hote) && /[?&]sandbox=1(&|$)/.test(recherche || '');

const PREFIXE = 'sandbox:';
// Un stockage qui range tout sous le préfixe : les vraies clés ne sont jamais lues, écrites ni supprimées
export function envelopperStockage(brut) {
  return { getItem: k => brut.getItem(PREFIXE + k), setItem: (k, v) => brut.setItem(PREFIXE + k, v), removeItem: k => brut.removeItem(PREFIXE + k) };
}

// Un fetch qui refuse toute écriture (autre que GET/HEAD) vers /api : comptes, synchronisation, paiements… rien ne part du bac à sable
export function creerFetchProtege(fetchReel) {
  return (entree, options) => {
    const url = typeof entree === 'string' ? entree : (entree && entree.url) || String(entree);
    const methode = String((options && options.method) || (entree && entree.method) || 'GET').toUpperCase();
    if (/\/api\//.test(url) && methode !== 'GET' && methode !== 'HEAD') return Promise.reject(new Error('mode bac à sable : écriture vers le serveur refusée (' + methode + ' ' + url + ')'));
    return fetchReel(entree, options);
  };
}

// Installation (appelée en TOUT PREMIER par main.js, avant que le jeu ou le compte ne lise le stockage)
export function installerBacASable(win = window) {
  if (!sandboxActif(win.location.hostname, win.location.search)) return false;
  const proto = win.Storage.prototype, pris = { get: proto.getItem, set: proto.setItem, del: proto.removeItem, local: win.localStorage };
  proto.getItem = function (k) { return this === pris.local ? pris.get.call(this, PREFIXE + k) : pris.get.call(this, k); };
  proto.setItem = function (k, v) { return this === pris.local ? pris.set.call(this, PREFIXE + k, v) : pris.set.call(this, k, v); };
  proto.removeItem = function (k) { return this === pris.local ? pris.del.call(this, PREFIXE + k) : pris.del.call(this, k); };
  win.fetch = creerFetchProtege(win.fetch.bind(win));
  if (win.navigator && win.navigator.sendBeacon) win.navigator.sendBeacon = () => false;
  win.addEventListener('DOMContentLoaded', () => {
    const b = win.document.createElement('div'); b.textContent = '🧪 MODE TEST : données isolées, rien n\'est enregistré dans les vrais profils';
    b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99;background:#7a3b4d;color:#fff;font:600 12px sans-serif;text-align:center;padding:3px;pointer-events:none';
    win.document.body.appendChild(b);
  });
  return true;
}
