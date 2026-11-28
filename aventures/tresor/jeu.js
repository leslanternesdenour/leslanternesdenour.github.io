// LE TRÉSOR DES SOURATES ET DES MOTS — trois coffres : lettres, mots, noms de sourates. Questions à choix, jamais de sanction ; la collection garde les lettres et les mots trouvés du premier coup.
import { $, lsGet, lsSet, h, profil, jouerQuestions, ecranFin, etoilesTexte } from '../commun/mini.js?v=1';
import { construireQuestions, lireEtoiles, sommeEtoiles, listeDeTextes } from '../commun/mini-logique.js?v=1';
import { COFFRES, MOTS, questionsLettres, questionsMots, questionsSourates } from './contenu.js?v=1';
import { ALPHABET } from '../../ecole-arabe/commun/langue/alphabet.js?v=3';
const CLE = 'aventure_tresor', IDS = COFFRES.map(c => c.id);
const lettresOk = ALPHABET.map(l => l.id), motsOk = MOTS.map(m => m.id);
let etat = { v: 1, etoiles: lireEtoiles(null, IDS), lettres: [], mots: [] };
const charger = () => { const b = lsGet(CLE); etat = { v: 1, etoiles: lireEtoiles(b, IDS), lettres: listeDeTextes(b && b.lettres, lettresOk), mots: listeDeTextes(b && b.mots, motsOk) }; };
const sauver = () => lsSet(CLE, etat);
const zone = $('zone'), menu = $('menu');
const bilan = () => { $('bilan').textContent = '⭐ ' + sommeEtoiles(etat.etoiles) + ' / 9 · 🔤 ' + etat.lettres.length + ' / ' + lettresOk.length + ' lettres · 📖 ' + etat.mots.length + ' / ' + motsOk.length + ' mots' + (IDS.every(i => etat.etoiles[i] > 0) ? ' · 🎓 Chercheur de trésors !' : ''); };
function accueil() {
  zone.replaceChildren(); menu.classList.remove('cache'); bilan();
  menu.replaceChildren(...COFFRES.map(c => h('button', { type: 'button', classe: 'niveau', onclick: () => lancer(c.id) }, h('b', {}, c.icone + ' ' + c.titre), h('span', {}, c.aide), h('span', { classe: 'et', 'aria-label': etat.etoiles[c.id] + ' étoile(s) sur 3' }, etoilesTexte(etat.etoiles[c.id])))));
}
function lancer(id) {
  menu.classList.add('cache');
  const brutes = id === 'lettres' ? questionsLettres() : id === 'mots' ? questionsMots() : questionsSourates();
  const parties = construireQuestions(brutes), ids = new Map(brutes.map(q => [q.q + (q.ar || ''), q.id]));
  jouerQuestions(zone, parties, r => {
    // Les lettres et les mots de la partie entrent dans la collection (ils ont tous été trouvés, même après un essai).
    for (const q of parties) { const i = ids.get(q.q + (q.ar || '')); if (id === 'lettres' && i && !etat.lettres.includes(i)) etat.lettres.push(i); if (id === 'mots' && i && !etat.mots.includes(i)) etat.mots.push(i); }
    etat.etoiles[id] = Math.max(etat.etoiles[id], r.etoiles); sauver(); bilan();
    ecranFin(zone, { titre: 'Un trésor de plus !', etoiles: r.etoiles, texte: id === 'sourates' ? 'Les sourates se récitent et s\'apprennent avec un adulte : ici, on a seulement découvert leurs noms.' : 'Ta collection grandit à chaque partie.', boutons: [['Rejouer', () => lancer(id)], ['Les coffres', accueil, true]] });
  });
}
charger(); profil(); accueil();