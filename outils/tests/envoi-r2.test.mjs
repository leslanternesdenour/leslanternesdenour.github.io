import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'fs'; import os from 'os'; import path from 'path'; import { spawnSync } from 'child_process';
import { planifier } from '../admin/envoyer-premium-r2.mjs';
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pack-')); const DEPOT = path.resolve('.');
test('plan : chemins conservés, types corrects, ordre stable', () => {
  const d = tmp(); fs.mkdirSync(d + '/voyage/camp', { recursive: true }); fs.writeFileSync(d + '/voyage/camp/contenu.json', '{}'); fs.writeFileSync(d + '/voyage/camp/v1.mp3', 'x');
  const p = planifier(d, 'ldn-premium', DEPOT); assert.deepEqual(p.map(f => f.rel), ['voyage/camp/contenu.json', 'voyage/camp/v1.mp3']);
  assert.equal(p[1].type, 'audio/mpeg'); assert.deepEqual(p[0].args.slice(0, 5), ['wrangler', 'r2', 'object', 'put', 'ldn-premium/voyage/camp/contenu.json']); assert.ok(p[0].args.includes('--remote'));
});
test('garde-fous : dossier dans le dépôt, fichier suspect, bucket invalide, dossier vide, lien symbolique', () => {
  assert.throws(() => planifier('outils', 'ldn-premium', DEPOT), /HORS du dépôt/);
  for (const nom of ['cle.pem', '.env', 'compte-service-account.json']) { const d = tmp(); fs.writeFileSync(path.join(d, nom), 'x'); assert.throws(() => planifier(d, 'ldn-premium', DEPOT), /suspect/, nom); }
  assert.throws(() => planifier(tmp(), 'Mauvais_Nom', DEPOT), /bucket invalide/); assert.throws(() => planifier(tmp(), 'ldn-premium', DEPOT), /vide/);
  const d = tmp(); fs.writeFileSync(d + '/a.json', '{}'); fs.symlinkSync('/etc/passwd', d + '/lien.txt'); assert.throws(() => planifier(d, 'ldn-premium', DEPOT), /symbolique/);
});
test('sans --executer : simulation, aucun appel à wrangler', () => {
  const d = tmp(); fs.writeFileSync(d + '/a.json', '{}'); const r = spawnSync('node', ['outils/admin/envoyer-premium-r2.mjs', d, 'ldn-premium'], { encoding: 'utf8' });
  assert.equal(r.status, 0); assert.match(r.stdout, /SIMULATION/); assert.match(r.stdout, /serait envoyé/);
});
