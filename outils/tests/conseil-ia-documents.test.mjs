// Conseil IA : ce qu'on joint à une mission (fichiers, modifications git, images) passe tout entier par le garde-fou.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { execFileSync } from 'node:child_process';

const documents = () => import('../conseil-ia/lib/documents.mjs');
export const limites = { caracteresMax: 4000, imagesMax: 2, imageOctetsMax: 100 };
export function depot() {
  const racine = fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-depot-'));
  const git = (...a) => execFileSync('git', ['-c', 'user.name=essai', '-c', 'user.email=essai@exemple.test', '-c', 'core.autocrlf=false', ...a], { cwd: racine, encoding: 'utf8' });
  const ecrire = (f, t) => { fs.mkdirSync(path.dirname(path.join(racine, f)), { recursive: true }); fs.writeFileSync(path.join(racine, f), t); };
  git('init', '-q', '-b', 'preproduction'); ecrire('.gitignore', '.env*\nprive/\n'); ecrire('page.js', 'let a = 1;\n'); ecrire('cert.pem', 'ancien\n');
  git('add', '-A'); git('commit', '-qm', 'depart');
  return { racine, git, ecrire };
}
const secret = 'sk-' + 'proj-' + 'Z9y8X7w6'.repeat(5);

test('documents : les modifications git sont jointes, secrets masqués et fichiers sensibles écartés', async () => {
  const { assembler } = await documents(); const d = depot();
  d.ecrire('page.js', `let a = "${secret}";\n`); d.ecrire('cert.pem', 'nouveau-contenu-prive\n');
  const r = assembler({ racine: d.racine, mission: `Relire. Clé vue : ${secret}`, diff: 'HEAD', limites });
  assert.ok(!r.texte.includes(secret)); assert.ok(!r.texte.includes('nouveau-contenu-prive'));
  assert.match(r.texte, /<modifications base="HEAD">[\s\S]*\+let a = "\[SECRET MASQUÉ\]";/);
  assert.equal(r.masques, 2); assert.deepEqual(r.ecartes, ['cert.pem : fichier de clé ou de certificat']);
  assert.throws(() => assembler({ racine: d.racine, mission: 'm', diff: '--output=x', limites }), /référence git refusée/);
});

test('documents : seules de vraies images du projet ou du dossier temporaire sont jointes, dans les limites de taille et de nombre', async () => {
  const { assembler } = await documents(); const d = depot();
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
  d.ecrire('capture.png', png); d.ecrire('faux.png', 'texte secret'); d.ecrire('lourde.png', Buffer.concat([png, Buffer.alloc(200)])); d.ecrire('prive/photo.png', png);
  const avec = images => assembler({ racine: d.racine, mission: 'm', images, limites });
  assert.deepEqual(avec(['capture.png']).images, [{ mime: 'image/png', base64: png.toString('base64'), chemin: 'capture.png' }]);
  const temporaire = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-capture-')), 'ecran.jpg'); fs.writeFileSync(temporaire, Buffer.from([0xff, 0xd8, 0xff, 0xe0]));
  assert.equal(avec([temporaire]).images[0].mime, 'image/jpeg');
  assert.throws(() => avec(['faux.png']), /pas une image/); assert.throws(() => avec(['lourde.png']), /trop lourde/); assert.throws(() => avec(['prive/photo.png']), /ignoré par git/);
  assert.throws(() => avec([path.join(os.homedir(), 'Pictures', 'x.png')]), /hors du projet/);
  assert.throws(() => avec(['capture.png', 'capture.png', 'capture.png']), /2 images maximum/);
});

test('documents : un fichier modifié joint par --diff sert aussi à vérifier les preuves, secrets masqués', async () => {
  const { assembler } = await documents(); const d = depot(); d.ecrire('page.js', `let a = "${secret}";\n`);
  assert.deepEqual(assembler({ racine: d.racine, mission: 'm', diff: 'HEAD', limites }).documents.map(x => [x.chemin, x.contenu]), [['page.js', 'let a = "[SECRET MASQUÉ]";\n']]);
});

test('documents : le fichier de mission lui-même ne peut pas être un fichier de secrets', async () => {
  const { lireMission } = await documents(); const d = depot(); d.ecrire('m.md', 'Relire la page'); d.ecrire('.env', 'X=1');
  assert.equal(lireMission(d.racine, 'm.md'), 'Relire la page');
  for (const f of ['.env', path.join(os.homedir(), '.lanternes-ia', 'cles', 'OPENAI_API_KEY.dpapi')]) assert.throws(() => lireMission(d.racine, f), /mission refusé/, f);
});

test('documents : une mission trop volumineuse est refusée avant tout envoi', async () => {
  const { assembler } = await documents(); const d = depot(); d.ecrire('gros.js', 'x'.repeat(5000));
  assert.throws(() => assembler({ racine: d.racine, mission: 'm', fichiers: ['gros.js'], limites }), /trop volumineuse/);
});
