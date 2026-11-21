// Audit des voix : couverture, fichiers, et cohérence des clips ElevenLabs (audio/fr/…) avec les voix vérifiées des jeux Ablutions et Prière.
// Principe : pour chaque phrase, la durée du nouveau clip doit rester proche de celle de l'ancienne voix vérifiée (même texte). Un clip dont la durée s'écarte
// fortement, ou un ordre qui ne se corrèle plus, trahit un clip décalé ou mélangé (voir l'historique : PR #11 « clips décalés », #20 annulée par #21 « mélangées »).
// ATTENTION : c'est un détecteur, pas une preuve : seule l'écoute valide un clip. Usage : node outils/tests/audit-voix.mjs
import fs from 'fs'; import path from 'path';
const lire = f => JSON.parse(fs.readFileSync(f, 'utf8')); const dur = x => x[2] - x[1];
const rang = a => { const o = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]), r = []; o.forEach(([, i], k) => { r[i] = k; }); return r; };
const spearman = (a, b) => { const ra = rang(a), rb = rang(b), n = a.length; const d2 = ra.reduce((s, x, i) => s + (x - rb[i]) ** 2, 0); return 1 - 6 * d2 / (n * (n * n - 1)); };
const mediane = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
let alertes = 0; const sortie = [];
// 1. couverture générale
const cat = lire('audio/voix.json'); const manquants = Object.entries(cat).filter(([, v]) => !fs.existsSync(path.join('audio', v[0]))).map(([k]) => k);
sortie.push(`Voix du catalogue général (audio/voix.json) : ${Object.keys(cat).length} identifiants, ${manquants.length} fichier(s) absent(s)`); if (manquants.length) alertes++;
for (const m of ['ablutions', 'priere', 'calendrier', 'monde']) { const f = `${m}/voix/voix.json`; if (!fs.existsSync(f)) continue; const j = lire(f); const abs = Object.entries(j).filter(([, v]) => !fs.existsSync(path.resolve(path.dirname(f), v[0]))).map(([k]) => k); sortie.push(`  ${m}/voix/voix.json : ${Object.keys(j).length} entrées, ${abs.length} fichier(s) absent(s)`); if (abs.length) alertes++; }
// 2. cohérence nouveaux clips / voix vérifiées
for (const m of ['ablutions', 'priere']) {
  const ancien = lire(`${m}/voix/voix.json`), nouveau = lire(`${m}/voix/voix-catalogue.json`);
  const cles = Object.keys(nouveau).filter(k => ancien[k] && !/^j3/.test(k) && nouveau[k][0].includes('audio/fr/'));
  const a = cles.map(k => dur(ancien[k])), b = cles.map(k => dur(nouveau[k])), rap = b.map((x, i) => x / a[i]), med = mediane(rap), rho = spearman(a, b);
  const hors = cles.map((k, i) => ({ k, a: a[i], b: b[i], r: rap[i] })).filter(x => x.r < med * 0.65 || x.r > med * 1.6).sort((x, y) => Math.abs(Math.log(y.r / med)) - Math.abs(Math.log(x.r / med)));
  sortie.push(`\n${m} : ${cles.length} phrases comparées (nouveaux clips ElevenLabs / voix vérifiées) ; rapport médian des durées ${med.toFixed(2)} ; corrélation d'ordre (Spearman) ${rho.toFixed(3)}`);
  sortie.push(rho < 0.9 ? `  ⚠ corrélation faible : des clips sont probablement décalés ou mélangés` : `  ✓ l'ordre des durées est cohérent (aucun décalage d'ensemble détecté)`); if (rho < 0.9) alertes++;
  if (hors.length) { alertes++; sortie.push(`  ⚠ ${hors.length} phrase(s) à écouter en priorité (durée très différente de l'ancienne voix) :`); for (const x of hors.slice(0, 12)) sortie.push(`     ${x.k.padEnd(14)} ancienne ${x.a.toFixed(1)} s → nouvelle ${x.b.toFixed(1)} s (×${x.r.toFixed(2)})`); }
  else sortie.push('  ✓ aucune phrase avec une durée aberrante');
  const utilises = Object.values(lire(`${m}/voix/voix.json`)).filter(v => v[0].includes('audio/fr/')).length; sortie.push(`  Branchement actuel du jeu : ${utilises} phrase(s) sur les clips ElevenLabs (attendu : 0 tant que non écoutés — garde dans voix-verifiees.test.mjs)`); if (utilises) alertes++;
}
// 3. voix arabes sans enregistrement (règle : jamais de synthèse pour l'arabe)
const t = fs.readFileSync('voyage/js/voix-textes.js', 'utf8'); const phr = [...t.matchAll(/\["(NOUR-VOIX-(?:ARB|INV)-\d+)", "((?:[^"\\]|\\.)*)"/g)]; const sans = phr.filter(([, id]) => !cat[id]);
sortie.push(`\nVoix arabes (mots et formules) : ${phr.length} textes, ${sans.length} sans enregistrement humain → ${sans.map(x => x[1].replace('NOUR-VOIX-', '')).join(', ') || 'aucun'}`); if (sans.length) alertes++;
// 4. calendrier : voix à produire
const cal = lire('calendrier/voix/voix.json'); const fichiers = new Set(Object.values(cal).map(v => v[0]));
sortie.push(`\nCalendrier : ${Object.keys(cal).length} extraits répartis dans ${fichiers.size} longs fichiers (anciennes voix) ; aucune nouvelle voix ElevenLabs pour le calendrier dans le dépôt.`);
console.log(sortie.join('\n')); console.log(`\n${alertes} point(s) d'attention.`); process.exit(0);
