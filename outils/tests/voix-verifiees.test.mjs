// GARDE-FOU DES VOIX (décision du client du 21-22/11/2026 : « tout est validé »).
// Historique : des clips ElevenLabs avaient été branchés sans écoute (#11 décalés, #20 mélangés, annulés). Désormais :
//  - chaque entrée de voix.json (ablutions, priere, calendrier) doit figurer dans docs/voix-narratrice-manifeste.json avec valide:true ;
//  - le fichier cible doit exister et sa durée (ffprobe, si disponible) doit correspondre à l'entrée [fichier, début, fin] ;
//  - aucune entrée de l'ancienne voix (source « ancienne ») ne doit rester.
// Pour brancher un nouveau clip : l'écouter avec /outils/voix/lot, le faire valider, puis relancer outils/voix/brancher.py.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const M = JSON.parse(fs.readFileSync('docs/voix-narratrice-manifeste.json', 'utf8'));
let ffprobe = true; try { execFileSync('ffprobe', ['-version'], { stdio: 'ignore' }); } catch { ffprobe = false; }
const duree = f => parseFloat(execFileSync('ffprobe', ['-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
for (const m of ['ablutions', 'priere', 'calendrier']) test(`${m} : toutes les voix sont validées, présentes et de la bonne durée`, () => {
  const dossier = `${m}/voix`, v = JSON.parse(fs.readFileSync(`${dossier}/voix.json`, 'utf8'));
  assert.ok(Object.keys(v).length > 0);
  for (const [k, x] of Object.entries(v)) {
    const e = M[`${m}/${k}`]; assert.ok(e, `${m}/${k} : absent du manifeste des voix validées`);
    assert.equal(e.valide, true, `${m}/${k} : voix non validée par le client (${e.source})`);
    assert.notEqual(e.source, 'ancienne', `${m}/${k} : ancienne voix`);
    const f = path.resolve(dossier, x[0]); assert.ok(fs.existsSync(f), `${m}/${k} : fichier absent (${x[0]})`);
    assert.ok(fs.statSync(f).size > 2000, `${m}/${k} : fichier vide ou erreur (${x[0]})`);
    if (ffprobe) { const d = duree(f); assert.ok(x[2] <= d + 0.15 && x[2] > x[1], `${m}/${k} : fin ${x[2]} s hors de la durée réelle ${d.toFixed(2)} s`); }
  }
});
test('aucune clé du manifeste ne pointe vers un fichier manquant', () => { for (const [k, e] of Object.entries(M)) if (e.valide) assert.ok(fs.existsSync(e.fichier), `${k} : ${e.fichier} absent`); });
