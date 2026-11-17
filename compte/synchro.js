// Synchronisation discrète dans le village : ne fait rien si les comptes ne sont pas activés
// ou si aucun parent n'est connecté sur cet appareil.
import { actif, charger, utilisateur, synchroniser } from './comptes.js?v=1';

if (actif) (async () => {
  try {
    const c = await charger();
    const u = await utilisateur(c);
    if (!u) return;
    const r = await synchroniser(c, u.uid);
    if (r.conflits && r.conflits.length) return signaler();
    if (r.change && !sessionStorage.getItem('ldn_recharge')) {
      sessionStorage.setItem('ldn_recharge', '1');   // une seule fois, pour charger les progrès du compte
      return location.reload();
    }
    sessionStorage.removeItem('ldn_recharge');
    const envoyer = () => synchroniser(c, u.uid, { mode: 'envoi' }).catch(() => {});
    setInterval(envoyer, 60000);
    addEventListener('visibilitychange', () => { if (document.hidden) envoyer(); });
    addEventListener('pagehide', envoyer);
  } catch (e) { /* hors ligne : la progression reste sur l'appareil */ }
})();

function signaler() {
  const a = document.createElement('a');
  a.href = '../compte/';
  a.textContent = '⚠️ Progression à vérifier';
  a.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:50;background:#fff6d8;color:#191345;' +
    'font:700 14px Nunito,system-ui,sans-serif;padding:8px 14px;border-radius:999px;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.25)';
  document.body.appendChild(a);
}
