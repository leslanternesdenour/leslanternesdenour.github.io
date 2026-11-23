// Dans le village et le Grand Voyage : enregistrement de la progression SUR ÉVÉNEMENT uniquement
// (retour au village, page masquée ou fermée). Aucun minuteur. Ne fait rien sans compte, sans profil actif,
// ou si la formule ne comprend pas la synchronisation (Famille et Créateur seulement).
// Affiche aussi, discrètement, le prénom de l'enfant qui joue (lien « Qui joue ? » vers l'Espace famille).
import { comptesActifs, profilActif, brancherSynchroEvenementielle } from './client.js?v=1';

if (comptesActifs()) {
  const p = profilActif();
  if (p) {
    brancherSynchroEvenementielle();
    // Le Grand Voyage a l'écran épuré : le prénom de l'enfant y figure dans Paramètres → Compte, pas en permanence à l'écran (<meta name="ldn-pastille" content="non">).
    if (document.querySelector('meta[name="ldn-pastille"][content="non"]')) { /* synchronisation active, aucune pastille */ } else {
    const a = document.createElement('a');
    a.href = '../compte/?qui=1'; a.id = 'qui-joue';
    a.textContent = (p.avatar === 'fille' ? '👧 ' : '👦 ') + p.surnom + (p.gele ? ' ❄️' : '');
    a.title = 'Qui joue ? (espace des parents)';
    a.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:50;background:rgba(25,19,69,.72);color:#fff6d8;' +
      'font:700 14px Nunito,system-ui,sans-serif;padding:6px 12px;border-radius:999px;text-decoration:none';
    (document.body ? Promise.resolve() : new Promise(r => addEventListener('DOMContentLoaded', r))).then(() => document.body.appendChild(a));
    }
  }
}
