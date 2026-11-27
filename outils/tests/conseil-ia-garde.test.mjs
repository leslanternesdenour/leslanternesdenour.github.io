// Conseil IA : rien de secret ne part chez OpenAI ou Google (fichiers interdits, secrets masqués).
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

const garde = () => import('../conseil-ia/lib/garde.mjs');
// Les faux secrets sont assemblés à l'exécution : aucun motif de clé n'est écrit tel quel dans le dépôt.
const faux = {
  openai: 'sk-' + 'proj-' + 'A1b2C3d4'.repeat(5),
  google: 'AI' + 'za' + 'B2c3D4e5'.repeat(4) + 'xyz',
  googleAuth: 'AQ.' + 'Ab8RN6J'.repeat(6),
  stripe: 'sk_' + 'test_' + '51AbCdEf'.repeat(4),
  elevenlabs: 'sk_' + '0a1b2c3d'.repeat(6),
};

test('garde : les clés reconnues sont masquées, le reste du texte est intact', async () => {
  const { masquerSecrets } = await garde();
  for (const [nom, cle] of Object.entries(faux)) {
    const r = masquerSecrets(`avant ${cle} après`);
    assert.equal(r.texte, 'avant [SECRET MASQUÉ] après', nom); assert.equal(r.nombre, 1, nom);
  }
  assert.deepEqual(masquerSecrets('const sk = "bonjour"; // task-123'), { texte: 'const sk = "bonjour"; // task-123', nombre: 0 });
});

test('garde : un bloc de clé privée est masqué en entier', async () => {
  const { masquerSecrets } = await garde();
  const bloc = '-----BEGIN ' + 'PRIVATE KEY-----\nMIIEvQ\n-----END ' + 'PRIVATE KEY-----';
  assert.deepEqual(masquerSecrets(`a\n${bloc}\nb`), { texte: 'a\n[SECRET MASQUÉ]\nb', nombre: 1 });
});

test('garde : une clé privée tronquée (sans fin de bloc) est masquée jusqu\'au bout', async () => {
  const { masquerSecrets } = await garde();
  assert.equal(masquerSecrets('x -----BEGIN ' + 'RSA PRIVATE KEY-----\nMIIE tronqué').texte, 'x [SECRET MASQUÉ]');
});

test('garde : la valeur exacte d\'une clé configurée est masquée même sans motif connu', async () => {
  const { masquerSecrets } = await garde();
  assert.deepEqual(masquerSecrets('jeton=valeur-tres-privee-123', ['valeur-tres-privee-123', '']), { texte: 'jeton=[SECRET MASQUÉ]', nombre: 1 });
});

test('garde : les fichiers sensibles sont refusés par leur nom', async () => {
  const { raisonFichierInterdit } = await garde();
  for (const c of ['.env', '.env.local', 'a/.env.production', '.dev.vars', 'cles/x.txt', 'x-service-account-1.json', '.git/config', 'a\\cert.pem', 'a.key', 'cle.dpapi', '.claude/tdd-guard/data/modifications.json'])
    assert.ok(raisonFichierInterdit(c), c);
  for (const c of ['index.html', 'voyage/js/main.js', 'functions/api/environnement.js', 'compte/cles-de-voute.css', '.claude/skills/conseil-ia/SKILL.md'])
    assert.equal(raisonFichierInterdit(c), null, c);
});

test('garde : un fichier du projet est lu avec ses secrets masqués', async () => {
  const { lireFichierPartageable } = await garde();
  const racine = fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-garde-'));
  fs.mkdirSync(path.join(racine, 'js'));
  fs.writeFileSync(path.join(racine, 'js', 'page.js'), `const k = '${faux.openai}';\n`);
  assert.deepEqual(lireFichierPartageable(racine, 'js/page.js', { estIgnore: () => false }), { chemin: 'js/page.js', contenu: "const k = '[SECRET MASQUÉ]';\n", masques: 1 });
});

test('garde : un fichier situé hors du projet est refusé', async () => {
  const { lireFichierPartageable, Refus } = await garde();
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-garde-')), racine = path.join(parent, 'projet');
  fs.mkdirSync(racine); const dehors = path.join(parent, 'dehors.txt'); fs.writeFileSync(dehors, 'x');
  for (const c of [dehors, '../dehors.txt'])
    assert.throws(() => lireFichierPartageable(racine, c, { estIgnore: () => false }), e => e instanceof Refus && /hors du projet/.test(e.message), c);
});

test('garde : un fichier non partageable (sensible, ignoré par git, binaire ou absent) est refusé', async () => {
  const { lireFichierPartageable, Refus } = await garde();
  const racine = fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-garde-'));
  fs.writeFileSync(path.join(racine, '.env'), 'X=1');
  fs.writeFileSync(path.join(racine, 'brouillon.txt'), 'privé');
  fs.writeFileSync(path.join(racine, 'image.bin'), Buffer.from([1, 0, 2]));
  const estIgnore = c => c === 'brouillon.txt';
  for (const [c, raison] of [['.env', /environnement/], ['brouillon.txt', /ignoré par git/], ['image.bin', /binaire/], ['absent.js', /introuvable/]])
    assert.throws(() => lireFichierPartageable(racine, c, { estIgnore }), e => e instanceof Refus && raison.test(e.message), c);
});
