// JEU 3 — « LES CHIFFRES ET LES NOMBRES ARABES » : chiffres ٠–٩, nombres jusqu'à 10 / 20, dizaines, nombres à deux chiffres, 100 et plus, comptage et calculs simples.
// Les chiffres arabes-indiens (٠١٢٣٤٥٦٧٨٩) s'écrivent et se lisent dans le même ordre que nos chiffres (٢٣ = 23, de gauche à droite).
// Noms des nombres : formes simples du masculin, entièrement vocalisées. ⚠ Aucune prononciation n'est validée : tous les audios arabes restent « à valider » par une personne qui maîtrise l'arabe.
export const CHIFFRES = '٠١٢٣٤٥٦٧٨٩'.split('');
export const ecrire = n => String(n).split('').map(d => CHIFFRES[+d]).join('');
// noms (vocalisés) : unités, adolescents (11–19), dizaines, centaine, millier
export const NOMS = {
  0: 'صِفْر', 1: 'وَاحِد', 2: 'اثْنَان', 3: 'ثَلَاثَة', 4: 'أَرْبَعَة', 5: 'خَمْسَة', 6: 'سِتَّة', 7: 'سَبْعَة', 8: 'ثَمَانِيَة', 9: 'تِسْعَة', 10: 'عَشَرَة',
  11: 'أَحَدَ عَشَر', 12: 'اثْنَا عَشَر', 13: 'ثَلَاثَةَ عَشَر', 14: 'أَرْبَعَةَ عَشَر', 15: 'خَمْسَةَ عَشَر', 16: 'سِتَّةَ عَشَر', 17: 'سَبْعَةَ عَشَر', 18: 'ثَمَانِيَةَ عَشَر', 19: 'تِسْعَةَ عَشَر', 20: 'عِشْرُون',
  30: 'ثَلَاثُون', 40: 'أَرْبَعُون', 50: 'خَمْسُون', 60: 'سِتُّون', 70: 'سَبْعُون', 80: 'ثَمَانُون', 90: 'تِسْعُون', 100: 'مِائَة', 1000: 'أَلْف'
};
// dizaines avec « و » (« et ») : 21 = « وَاحِد وَعِشْرُون » (l'unité d'abord, puis « et vingt »)
export const ET_DIZAINE = { 20: 'وَعِشْرُون', 30: 'وَثَلَاثُون', 40: 'وَأَرْبَعُون', 50: 'وَخَمْسُون', 60: 'وَسِتُّون', 70: 'وَسَبْعُون', 80: 'وَثَمَانُون', 90: 'وَتِسْعُون' };
export const FR = { 0: 'zéro', 1: 'un', 2: 'deux', 3: 'trois', 4: 'quatre', 5: 'cinq', 6: 'six', 7: 'sept', 8: 'huit', 9: 'neuf', 10: 'dix', 11: 'onze', 12: 'douze', 13: 'treize', 14: 'quatorze', 15: 'quinze', 16: 'seize', 17: 'dix-sept', 18: 'dix-huit', 19: 'dix-neuf', 20: 'vingt', 30: 'trente', 40: 'quarante', 50: 'cinquante', 60: 'soixante', 70: 'soixante-dix', 80: 'quatre-vingts', 90: 'quatre-vingt-dix', 100: 'cent', 1000: 'mille' };
// identifiants audio : « nb.N » pour N ∈ 0–20, 30…100, 1000 ; « et.D » pour « et + dizaine »
export const AUDIOS_NOMBRES = [...Array(21).keys(), 30, 40, 50, 60, 70, 80, 90, 100, 1000];
// la suite d'audios (identifiants) qui dit un nombre de 0 à 99, de 100, de 1000
export function suiteAudio(n) {
  if (n <= 20 || NOMS[n] && n % 10 === 0 || n === 100 || n === 1000) return [`nb.${n}`];
  if (n < 100) { const d = Math.floor(n / 10) * 10, u = n % 10; return [`nb.${u}`, `et.${d}`]; }
  return null;
}
export const nomArabe = n => (n <= 20 || (n < 100 && n % 10 === 0) || n === 100 || n === 1000 ? NOMS[n] : n < 100 ? NOMS[n % 10] + ' ' + ET_DIZAINE[Math.floor(n / 10) * 10] : null);
// objets à compter : univers de Nour (lanternes, étoiles, palmiers, chameaux, gouttes d'eau, dattes, livres…)
export const OBJETS = [{ e: '🏮', fr: 'lanternes' }, { e: '⭐', fr: 'étoiles' }, { e: '🌴', fr: 'palmiers' }, { e: '🐫', fr: 'chameaux' }, { e: '💧', fr: "gouttes d'eau" }, { e: '📖', fr: 'livres' }, { e: '🌙', fr: 'lunes' }, { e: '🌹', fr: 'roses' }];
// ÉTAPES du parcours : chaque étape ajoute une nouveauté
export const ETAPES = [
  { id: 'n1', nom: 'Les premiers chiffres', icone: '🔢', type: 'chiffres', nombres: [0, 1, 2, 3], intro: 'etape_n1', salle: 'lettres' },
  { id: 'n2', nom: 'Quatre et cinq', icone: '🖐️', type: 'chiffres', nombres: [4, 5], intro: 'etape_n2', salle: 'formes' },
  { id: 'n3', nom: 'Six, sept, huit, neuf', icone: '🌟', type: 'chiffres', nombres: [6, 7, 8, 9], intro: 'etape_n3', salle: 'sons' },
  { id: 'n4', nom: 'Jusqu\'à dix', icone: '🔟', type: 'dix', nombres: [10], intro: 'etape_n4', salle: 'defis' },
  { id: 'n5', nom: 'De onze à vingt', icone: '🌴', type: 'vingt', nombres: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], intro: 'etape_n5', salle: 'biblio' },
  { id: 'n6', nom: 'Les dizaines', icone: '🪙', type: 'dizaines', nombres: [30, 40, 50, 60, 70, 80, 90, 100], intro: 'etape_n6', salle: 'sons' },
  { id: 'n7', nom: 'Les grands nombres', icone: '💯', type: 'grands', nombres: [], intro: 'etape_n7', salle: 'formes' },
  { id: 'n8', nom: 'Les petits calculs', icone: '➕', type: 'calculs', nombres: [], intro: 'etape_n8', salle: 'defis' }
];
