// LE DÉFI DES CINQ PRIÈRES — contenus. Faits de base, consensuels : les cinq prières obligatoires, leur ordre dans la journée et leur nombre de rak‘at (unités).
// ⚠ À FAIRE VALIDER par le fondateur (contenu religieux, voir docs/CONTENUS-A-VALIDER.md). Aucun verset, aucune récitation, aucune représentation de personne : texte et symboles seulement.
import { avecLeurres } from '../commun/mini-logique.js?v=1';
export const PRIERES = [
  { id: 'fajr', nom: 'Fajr', icone: '🌅', moment: "à l'aube, avant le lever du soleil", exp: "Le Fajr est la première prière de la journée : on la fait à l'aube, avant le lever du soleil.", rakat: 2 },
  { id: 'dhohr', nom: 'Dhohr', icone: '☀️', moment: 'quand le soleil est haut dans le ciel, après midi', exp: 'Le Dhohr se fait quand le soleil a dépassé le milieu du ciel, après midi.', rakat: 4 },
  { id: 'asr', nom: 'Asr', icone: '🌤️', moment: "l'après-midi, quand l'ombre s'allonge", exp: "L'Asr se fait dans l'après-midi, quand les ombres sont longues.", rakat: 4 },
  { id: 'maghrib', nom: 'Maghrib', icone: '🌇', moment: 'juste après le coucher du soleil', exp: 'Le Maghrib se fait juste après le coucher du soleil.', rakat: 3 },
  { id: 'icha', nom: 'Icha', icone: '🌙', moment: 'quand la nuit est tombée', exp: "L'Icha est la dernière prière de la journée : on la fait quand la nuit est tombée.", rakat: 4 }
];
export const NIVEAUX = [
  { id: 'ordre', titre: "Dans l'ordre de la journée", aide: "Touche les cinq prières dans l'ordre : de l'aube jusqu'à la nuit.", icone: '🧭' },
  { id: 'moment', titre: 'Quel moment de la journée ?', aide: 'Retrouve la prière qui correspond au moment.', icone: '🕰️' },
  { id: 'rakat', titre: 'Combien de rak‘at ?', aide: 'Retrouve le nombre de rak‘at de chaque prière obligatoire.', icone: '🔢' }
];
export const NOMS = PRIERES.map(p => p.nom);
export function questionsMoment(rng = Math.random) {
  return PRIERES.map(p => ({ q: `Quelle prière se fait ${p.moment} ?`, choix: avecLeurres(p.nom, NOMS, 2, rng), exp: p.exp, religieux: true }));
}
export function questionsRakat(rng = Math.random) {
  return PRIERES.map(p => ({ q: `Combien de rak‘at compte la prière obligatoire du ${p.nom} ?`, choix: avecLeurres(String(p.rakat), ['2', '3', '4'], 2, rng), exp: `Le ${p.nom} compte ${p.rakat} rak‘at.`, religieux: true }));
}