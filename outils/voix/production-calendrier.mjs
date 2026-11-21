// Script de production des NOUVELLES voix du calendrier Ramadan : un texte par clip, sans prénom ni accord masculin/féminin
// (le prénom reste affiché à l'écran). Sortie : _documentation/VOIX_CALENDRIER_A_PRODUIRE.csv
import { readFileSync, writeFileSync } from 'node:fs';
const T = JSON.parse(readFileSync(new URL('./textes-ecoute.json', import.meta.url), 'utf8')).calendrier;
const REMPLACEMENTS = { // textes sans prénom / sans genre ; les 5 derniers sont PROPOSÉS (texte d'origine introuvable) : à approuver
  l10: "Déjà 10 lanternes allumées ! Machâ'Allah !",
  l20: '20 lanternes ! Plus que 10 !',
  l29: "Plus qu'une lanterne avant ton diplôme !",
  fin: "Félicitations ! Tu as allumé tes 30 lanternes pendant le Ramadan. Tu es une vraie lanterne de lumière !",
  debut: 'Ramadan moubârak ! Allume ta première lanterne ce soir.',
  inscription: 'Bienvenue ! Avant de commencer, présente-toi : ton prénom, ton âge, et si tu es un garçon ou une fille.',
  mem_s: 'Retourne les cartes et trouve les paires !',
  mem_b: 'Trouve chaque image avec son mot en arabe !',
  mem_win: "Machâ'Allah ! Tu as trouvé toutes les paires !",
  diplome: 'Voici ton diplôme de lumière ! Allah aime ceux qui font le bien.',
};
const PROPOSES = ['inscription', 'mem_s', 'mem_b', 'mem_win', 'diplome'];
const lignes = [['numero', 'identifiant', 'texte', 'caracteres', 'remarque']];
let n = 0, total = 0;
for (const k of [...Object.keys(T), ...PROPOSES.filter(x => !(x in T))]) {
  const brut = T[k] ?? '';
  let t = REMPLACEMENTS[k] ?? brut, r = '';
  if (k.startsWith('w_')) { t = brut.replace(/\s*\(.*\)$/, ''); r = "mot français seulement ; le mot arabe doit être enregistré par une voix humaine (règle du projet)"; }
  if (k === 'cheer0') r = "« Bravo ! » existe déjà en ElevenLabs (encouragements) : réutilisable";
  if (PROPOSES.includes(k)) r = 'texte PROPOSÉ (celui de l\'ancien clip est introuvable) : à approuver';
  if (k in REMPLACEMENTS && !PROPOSES.includes(k)) r = 'prénom retiré (il reste affiché à l\'écran)';
  const e = s => '"' + String(s).replace(/"/g, '""') + '"';
  n++; total += t.length; lignes.push([n, k, e(t), t.length, e(r)].join(','));
}
lignes[0] = lignes[0].join(',');
writeFileSync(new URL('../../_documentation/VOIX_CALENDRIER_A_PRODUIRE.csv', import.meta.url), '﻿' + lignes.join('\n') + '\n');
console.log(n, 'clips,', total, 'caractères');
