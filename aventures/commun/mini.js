// INTERFACE COMMUNE DES MINI-JEUX DES AVENTURES : pas de 3D, pas de voix (aucune synthèse du navigateur, aucun nouvel audio), texte lisible, boutons de 60 px au moins.
import { etoilesPour } from './mini-logique.js?v=1';
export const $ = id => document.getElementById(id);
export const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
export const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
export const etoilesTexte = n => '⭐'.repeat(n) + '☆'.repeat(3 - n);
// Crée un élément ; les textes passent par textContent (jamais innerHTML).
export function h(tag, props = {}, ...enfants) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) { if (k === 'onclick') e.addEventListener('click', v); else if (k === 'classe') e.className = v; else e.setAttribute(k, v); }
  for (const c of enfants.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}
export function profil() { const p = lsGet('ldn_profil_actif'); const el = $('profil'); if (p && p.surnom && el) el.textContent = (p.avatar === 'fille' ? '👧 ' : '👦 ') + p.surnom; }

// Une partie de questions à choix : une erreur n'est jamais punie (explication douce, on réessaie) ; bonnes réponses du premier coup = étoiles.
export function jouerQuestions(zone, questions, fin) {
  let i = 0, premier = 0;
  const afficher = () => {
    const q = questions[i]; let rate = false; zone.replaceChildren();
    const msg = h('p', { classe: 'message', role: 'status', 'aria-live': 'polite' });
    const suite = h('button', { classe: 'principal cache', onclick: () => { i++; if (i < questions.length) afficher(); else fin({ premierCoup: premier, total: questions.length, etoiles: etoilesPour(premier, questions.length) }); } }, i + 1 < questions.length ? 'Suivant ›' : 'Terminer ✓');
    const boutons = q.choix.map((c, k) => h('button', { type: 'button', onclick: () => {
      if (k === q.bonne) { if (!rate) premier++; boutons.forEach(b => { b.disabled = true; }); boutons[k].classList.add('ok'); msg.classList.add('bien'); msg.textContent = '✅ Bravo ! ' + (q.exp || ''); suite.classList.remove('cache'); suite.focus(); }
      else { rate = true; boutons[k].disabled = true; msg.classList.remove('bien'); msg.textContent = 'Pas tout à fait : regarde bien et réessaie.'; }
    } }, c.t));
    zone.append(h('div', { classe: 'carte' }, h('p', { classe: 'avert' }, 'Question ' + (i + 1) + ' sur ' + questions.length), h('p', { classe: 'question' }, q.q), q.ar ? h('p', { classe: 'ar', lang: 'ar', dir: 'rtl' }, q.ar) : null, h('div', { classe: 'choix' }, boutons), msg, h('div', { classe: 'actions' }, suite)));
  };
  afficher();
}

// Écran de fin d'une manche : étoiles, texte, boutons. Jamais de zéro.
export function ecranFin(zone, { titre, etoiles, texte, boutons }) {
  zone.replaceChildren(h('div', { classe: 'carte', role: 'dialog', 'aria-label': titre }, h('h2', {}, titre), h('p', { classe: 'grandes-etoiles', 'aria-label': etoiles + ' étoile(s) sur 3' }, etoilesTexte(etoiles)), texte ? h('p', {}, texte) : null,
    h('div', { classe: 'actions' }, boutons.map(([t, f, principal]) => h('button', { type: 'button', classe: principal ? 'principal' : 'secondaire', onclick: f }, t)))));
}
