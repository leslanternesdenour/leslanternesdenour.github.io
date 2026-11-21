// Liste des phrases Ablutions / Prière à REFAIRE d'après l'écoute du client (docs/VALIDATION-VOIX-2026-11-21.md).
// Sortie : _documentation/VOIX_JEUX_A_REFAIRE.csv
import { readFileSync, writeFileSync } from 'node:fs';
const T = JSON.parse(readFileSync(new URL('./textes-ecoute.json', import.meta.url), 'utf8'));
const REFUSEES = {
  ablutions: 'done g1i g1ok g2ko3 g2koe g2kot g2ok3 g2oke g2okt games h8 q2_mains q2_bouche q2_nez q2_visage q2_bras q2_tete q2_oreilles q2_pieds q3_start r1 r2 r3 s0 s1 s2 s3 s4 s5 s6 t0 t1'.split(' '),
  priere: 'd_ak d_ts dip done e_fatiha e_itidal e_jalsa e_niyya e_qiyam e_rakaa e_roukou e_soujoud1 e_soujoud2 e_sourate e_takbir e_tachahhoud f_ak f_sm f_th g3ko_jouloûs g3ok_jouloûs g4ko g4ok g4q h1_5 h1_6 home learn_ok sens'.split(' '),
};
const DOUTES = {
  ablutions: { home: 'phrase mélangée', t2: 'Bismillâh mal prononcé', why: 'Allah mal prononcé' },
  priere: { d_rb: 'mal prononcé', d_sj: 'mal prononcé', d_th: 'mal prononcé', e_taslim: 'manque le mot « prière »' },
};
const NOTES = { f_th: 'FAUTE GRAVE de sens dans l\'ancien clip (« j\'atteste qu\'Allah est son serviteur ») : texte à vérifier mot à mot avec une source', g4ok: 'le clip actuel dit « Presque » : doit dire « Bravo ! »', s0: 'le clip actuel dit « la bouche »' };
const e = s => '"' + String(s).replace(/"/g, '""') + '"';
const L = ['jeu,identifiant,statut,texte,remarque'];
let n = 0;
for (const jeu of ['ablutions', 'priere']) {
  for (const k of REFUSEES[jeu]) { L.push([jeu, k, 'à refaire', e(T[jeu][k] ?? ''), e(NOTES[k] ?? '')].join(',')); n++; }
  for (const [k, r] of Object.entries(DOUTES[jeu])) { L.push([jeu, k, 'doute', e(T[jeu][k] ?? ''), e(r)].join(',')); n++; }
}
writeFileSync(new URL('../../_documentation/VOIX_JEUX_A_REFAIRE.csv', import.meta.url), '﻿' + L.join('\n') + '\n');
const sans = L.filter(l => l.includes(',"",')).length;
console.log(n, 'lignes ; sans texte :', sans);
