// Prépare le « texte pour la voix » : les termes arabes/religieux VALIDÉS à l'oreille (14/14 le 21/11/2026) sont envoyés à la voix
// écrits en arabe avec voyelles. Les autres termes religieux détectés sont listés « à tester » : ils ne sont PAS remplacés automatiquement.
import { readFileSync, writeFileSync } from 'node:fs';
const RACINE = new URL('../../', import.meta.url);
const lire = f => readFileSync(new URL(f, RACINE), 'utf8').replace(/^﻿/, '');
const parseCSV = s => { const L = [], R = []; let c = '', q = false, row = [];
  for (let i = 0; i < s.length; i++) { const ch = s[i];
    if (q) { if (ch === '"' && s[i + 1] === '"') { c += '"'; i++; } else if (ch === '"') q = false; else c += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { row.push(c); c = ''; } else if (ch === '\n') { row.push(c); R.push(row); row = []; c = ''; } else if (ch !== '\r') c += ch; }
  return R.filter(r => r.length > 1); };
// ---- termes VALIDÉS (ordre : les plus longs d'abord) ----
const VALIDES = [
  [/Mach?â?['’‘ ]?\s?Allah|Mâchâ['’]Allah/gi, 'مَا شَاءَ اللَّهُ'],
  [/In\s?ch[âa]['’ ]?\s?Allah|Inchâ['’]Allah/gi, 'إِنْ شَاءَ اللَّهُ'],
  [/Soubh[âa]n(a)?\s?['’]?Allah/gi, 'سُبْحَانَ اللَّهِ'],
  [/Bismi?\s?ll[âa]h/gi, 'بِسْمِ اللَّهِ'],
  [/Al-?hamdou?\s?li?ll[âa]h/gi, 'الْحَمْدُ لِلَّهِ'],
  [/A?s-?sal[âa]mou?\s?[‘’']?alaykoum/gi, 'السَّلَامُ عَلَيْكُمْ'],
  [/\bAll[âa]h\b/g, 'اللَّه'],
  [/\b(Muhammad|Mouhammad|Mohammed)\b/g, 'مُحَمَّد'],
  [/\bIbr[aâ]h[iî]m\b/g, 'إِبْرَاهِيم'], [/\b(Moussa|Musa|Mous[âa])\b/g, 'مُوسَى'],
  [/\b(Issa|Isa|Îsâ|Aïssa)\b/g, 'عِيسَى'], [/\b(Youssouf|Yusuf|Yûsuf)\b/g, 'يُوسُف'], [/\b(Younous|Yunus|Yûnus)\b/g, 'يُونُس'],
];
// ---- termes détectés mais NON testés (à écouter avant tout usage) ----
const A_TESTER = { 'Coran / Qur\'an (mot français)': /\bCoran\b/g, 'Boukhârî': /Boukh[âa]r[îi]/g, 'Mouslim': /Mouslim/g, 'Abû Dâwoud': /Ab[ûu]\s?D[âa]wou?d/g, 'Tirmidhî': /Tirmidh[îi]/g, 'Nasâ’î': /Nas[âa][’']?[îi]/g, 'Ibn Mâjah': /Ibn\s?M[âa]jah/g,
  'Ramadan': /\bRamadan\b/g, 'Kaaba': /\bKaaba\b/g, 'qibla': /\bqibla\b/gi, 'takbîr / Allâhou akbar': /takb[îi]r|All[âa]hou\s?akbar/gi, 'sourate / Al-Fâtiha / Al-Ghâchiya': /Al-?F[âa]tiha|Al-?Gh[âa]chiya|\bsourate\b/gi,
  'Roukoû‘ / Soujoûd / Jouloûs / Qiyâm / rak‘a': /Rouko[ûu]|Soujo[ûu]d|Joulo[ûu]s|Qiy[âa]m|rak[‘’']a/gi, 'tachahhoud / taslîm / niyya': /tachahhoud|tasl[îi]m|niyya/gi,
  'wudû / sunna / Sajjadou': /wud[ûu]|\bsunna\b|Sajjadou/gi, 'moubârak / Barak Allâhou fîk': /moub[âa]rak|B[âa]rak\s?All[âa]hou/gi, 'prophètes (Adam, Nouh, Younous…)': /\b(Adam|Nouh|Noé|Moïse|Jésus)\b/g };
const sources = [['_documentation/VOIX_JEUX_A_REFAIRE.csv', 'jeux'], ['_documentation/VOIX_CALENDRIER_A_PRODUIRE.csv', 'calendrier']];
const compte = {}, aTesterCount = {}, aTesterEx = {}; let total = 0, avecArabe = 0, caracteres = 0; const sortie = {};
for (const [f, nom] of sources) {
  const R = parseCSV(lire(f)); const entete = R[0]; const iTexte = entete.indexOf('texte');
  const lignes = [[...entete, 'texte_pour_la_voix', 'termes_a_tester'].join(',')];
  for (const r of R.slice(1)) {
    let t = r[iTexte], v = t, termes = [];
    for (const [re, ar] of VALIDES) v = v.replace(re, m => { compte[m.toLowerCase()] = (compte[m.toLowerCase()] || 0) + 1; return ar; });
    for (const [k, re] of Object.entries(A_TESTER)) if (new RegExp(re.source, re.flags).test(t)) { termes.push(k); aTesterCount[k] = (aTesterCount[k] || 0) + 1; (aTesterEx[k] ||= []).push(r[1] || r[0]); }
    total++; if (v !== t) avecArabe++; caracteres += v.length;
    const e = s => '"' + String(s).replace(/"/g, '""') + '"';
    lignes.push([...r.map(e), e(v), e(termes.join(' ; '))].join(','));
  }
  sortie[nom] = lignes;
  writeFileSync(new URL(f.replace('.csv', '-avec-texte-voix.csv'), RACINE), '﻿' + lignes.join('\n') + '\n');
}
console.log(total, 'phrases ;', avecArabe, 'contiennent un terme validé (écrit en arabe) ;', caracteres, 'caractères pour la voix');
console.log('termes validés remplacés :', compte);
console.log('À TESTER :'); for (const [k, n] of Object.entries(aTesterCount).sort((a, b) => b[1] - a[1])) console.log(' ', n, '×', k);
