import { CATEGORIES, NIVEAUX } from '/home/user/leslanternesdenour.github.io/aventures/quiz-nour/contenu.js';
let n = 0, pb = [];
for (const [id, c] of Object.entries(CATEGORIES)) for (const niv of NIVEAUX) for (const q of c.questions[niv]) {
  n++; const ch = q.choix.map(x => x.split('|')[1]);
  console.log(`[${id}/${niv}${q.religieux ? '/REL' : ''}] ${q.q}  ✔ ${ch[0]}  ✘ ${ch.slice(1).join(' ; ')}`);
  if (new Set(ch).size !== ch.length) pb.push('choix en double: ' + q.q);
  if (ch.length < 2) pb.push('moins de 2 choix: ' + q.q);
}
console.log('TOTAL', n, 'PROBLEMES', pb);
