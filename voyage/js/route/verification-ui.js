// Le panneau « Parcours de test » (mode bac à sable seulement) : une liste cochée automatiquement, avec un bouton « Y aller » par étape, pour tout vérifier sur un téléphone.
// Aucune donnée n'est lue ni écrite ici (pas de réseau, pas de stockage) : tout passe par les fonctions que lui donne le jeu.
import { ETAPES_VERIF, progressionVerif } from './verification-plan.js';

const CSS = `#verif-bouton{position:fixed;left:14px;top:76px;z-index:60;min-width:48px;min-height:48px;border:0;border-radius:24px;background:#3a2a5a;color:#fff;font:700 15px system-ui,sans-serif;padding:0 12px;box-shadow:0 3px 10px rgba(0,0,0,.35);cursor:pointer}
#verif-panneau{position:fixed;inset:0;z-index:90;background:rgba(30,20,50,.78);display:none;align-items:flex-start;justify-content:center;padding:10px;overflow:auto;font-family:system-ui,sans-serif}
#verif-panneau .carte{background:#fff8e6;color:#3a2a1a;border-radius:16px;max-width:560px;width:100%;padding:12px 14px;box-shadow:0 10px 40px rgba(0,0,0,.4)}
#verif-panneau h2{margin:0 0 4px;font-size:19px} #verif-panneau .info{font-size:13px;color:#6a5a44;margin:0 0 8px}
#verif-panneau .rang{display:flex;gap:8px;align-items:center;border-top:1px solid #e6d9b8;padding:8px 0} #verif-panneau .rang .t{flex:1;font-size:14px;line-height:1.25}
#verif-panneau .rang .t small{display:block;color:#7a6a52;font-size:12px;margin-top:2px}
#verif-panneau button{min-height:44px;border:0;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;padding:0 12px}
#verif-panneau .aller{background:#3fbf7f;color:#fff} #verif-panneau .fermer{background:#e9dcc0;color:#3a2a1a;width:100%;margin-top:8px} #verif-panneau .ouvrir{background:#f5b942;color:#4a2f00;width:100%;margin:6px 0}`;

export function creerVerificationUI({ etatRoute, surRoute, aller, ouvrirRoute }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const bouton = document.createElement('button'); bouton.id = 'verif-bouton'; bouton.type = 'button'; bouton.textContent = '🧭 Test'; bouton.setAttribute('aria-label', 'Parcours de test');
  const panneau = document.createElement('div'); panneau.id = 'verif-panneau'; panneau.setAttribute('role', 'dialog');
  document.body.appendChild(bouton); document.body.appendChild(panneau);
  let minuteur = null;
  const coche = (e, R) => { try { return e.fait(R) ? '✅' : '⬜'; } catch (x) { return '⬜'; } };
  let signature = '';
  function dessiner(force) {
    const R = etatRoute(), p = progressionVerif(R), enRoute = surRoute(), sig = ETAPES_VERIF.map(e => coche(e, R)).join('') + enRoute;
    if (!force && sig === signature) return;   // rien n'a changé : on ne redessine pas (le défilement et les touchers ne sont jamais interrompus)
    signature = sig; const haut = panneau.scrollTop;
    panneau.innerHTML = `<div class="carte"><h2>🧭 Parcours de test <small>(${p.faites} / ${p.total})</small></h2>
      <p class="info">Mode test isolé : rien n'est enregistré dans les vrais profils. ${enRoute ? 'Chaque étape se coche toute seule quand elle est faite.' : 'Pour commencer, ouvre la Route.'}</p>
      ${enRoute ? '' : '<button class="ouvrir" id="verif-ouvrir">🐪 Ouvrir la Route et aller à la sortie du village</button>'}
      ${ETAPES_VERIF.map((e, i) => `<div class="rang"><span>${coche(e, R)}</span><span class="t"><b>${i + 1}. ${e.icone} ${e.titre}</b><small>${e.quoi}</small></span>${enRoute ? `<button class="aller" data-i="${i}">Y aller</button>` : ''}</div>`).join('')}
      <button class="fermer" id="verif-fermer">Fermer</button></div>`;
    panneau.querySelectorAll('.aller').forEach(b => b.onclick = () => { fermer(); aller(ETAPES_VERIF[+b.dataset.i]); });
    const o = panneau.querySelector('#verif-ouvrir'); if (o) o.onclick = () => { fermer(); ouvrirRoute(); };
    panneau.querySelector('#verif-fermer').onclick = fermer; panneau.scrollTop = haut;
  }
  function ouvrir() { dessiner(true); panneau.style.display = 'flex'; clearInterval(minuteur); minuteur = setInterval(dessiner, 2000); }
  function fermer() { panneau.style.display = 'none'; clearInterval(minuteur); }
  bouton.onclick = () => (panneau.style.display === 'flex' ? fermer() : ouvrir());
  panneau.addEventListener('keydown', e => { if (e.key === 'Escape') fermer(); });
  return { ouvrir, fermer };
}
