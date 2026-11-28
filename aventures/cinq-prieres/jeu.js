// LE DÉFI DES CINQ PRIÈRES — niveau 1 : remettre les cinq prières dans l'ordre de la journée ; niveaux 2 et 3 : questions à choix.
import { $, lsGet, lsSet, h, profil, jouerQuestions, ecranFin, etoilesTexte } from '../commun/mini.js?v=1';
import { melanger, etoilesPour, construireQuestions, lireEtoiles, sommeEtoiles } from '../commun/mini-logique.js?v=1';
import { PRIERES, NIVEAUX, questionsMoment, questionsRakat } from './contenu.js?v=1';
const CLE = 'aventure_cinq', IDS = NIVEAUX.map(n => n.id);
let etat = { v: 1, etoiles: lireEtoiles(null, IDS) };
const charger = () => { etat = { v: 1, etoiles: lireEtoiles(lsGet(CLE), IDS) }; };
const sauver = () => lsSet(CLE, etat);
const zone = $('zone'), menu = $('menu');

function accueil() {
  zone.replaceChildren(); menu.classList.remove('cache');
  $('bilan').textContent = '⭐ ' + sommeEtoiles(etat.etoiles) + ' / 9' + (IDS.every(i => etat.etoiles[i] > 0) ? ' · 🎓 Gardien des cinq prières !' : '');
  menu.replaceChildren(...NIVEAUX.map(n => h('button', { type: 'button', classe: 'niveau', onclick: () => lancer(n.id) }, h('b', {}, n.icone + ' ' + n.titre), h('span', {}, n.aide), h('span', { classe: 'et', 'aria-label': etat.etoiles[n.id] + ' étoile(s) sur 3' }, etoilesTexte(etat.etoiles[n.id])))));
}
function terminer(id, etoiles) {
  etat.etoiles[id] = Math.max(etat.etoiles[id], etoiles); sauver();
  const dip = IDS.every(i => etat.etoiles[i] > 0);
  ecranFin(zone, { titre: dip ? '🎓 Bravo, gardien des cinq prières !' : 'Bravo !', etoiles, texte: dip ? 'Tu connais les cinq prières de la journée.' : 'Continue avec un autre défi quand tu veux.', boutons: [['Rejouer', () => lancer(id)], ['Les défis', accueil, true]] });
  $('bilan').textContent = '⭐ ' + sommeEtoiles(etat.etoiles) + ' / 9';
}
function lancer(id) {
  menu.classList.add('cache');
  if (id === 'ordre') return jouerOrdre();
  jouerQuestions(zone, construireQuestions(id === 'moment' ? questionsMoment() : questionsRakat()), r => terminer(id, r.etoiles));
}
// Niveau 1 : cinq cartes mélangées ; on touche la prochaine prière de la journée. Une erreur donne un indice (le moment attendu), jamais de sanction.
function jouerOrdre() {
  let k = 0, erreurs = 0;
  const frise = h('ol', { classe: 'frise', 'aria-label': 'Ta journée' }), msg = h('p', { classe: 'message', role: 'status', 'aria-live': 'polite' });
  const cartes = h('div', { classe: 'choix' });
  const boutons = melanger(PRIERES).map(p => h('button', { type: 'button', 'data-id': p.id, onclick: e => {
    const b = e.currentTarget;
    if (p.id === PRIERES[k].id) { b.disabled = true; b.classList.add('ok'); frise.append(h('li', {}, p.icone + ' ' + p.nom)); msg.classList.add('bien'); msg.textContent = '✅ ' + p.exp; k++;
      if (k === PRIERES.length) setTimeout(() => terminer('ordre', etoilesPour(Math.max(0, 5 - erreurs), 5)), 1200); }
    else { erreurs++; msg.classList.remove('bien'); msg.textContent = 'Pas encore celle-ci. Indice : la prochaine se fait ' + PRIERES[k].moment + '.'; }
  } }, p.icone + ' ' + p.nom));
  cartes.append(...boutons);
  zone.replaceChildren(h('div', { classe: 'carte' }, h('p', { classe: 'question' }, "Remets les cinq prières dans l'ordre de la journée, du matin au soir."), h('p', { classe: 'avert' }, "Touche d'abord la prière du tout début de la journée."), cartes, msg, frise));
}
charger(); profil(); accueil();