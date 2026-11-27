// Conseil IA : les clés viennent d'une variable d'environnement ou d'un coffre chiffré par Windows, jamais du dépôt.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { execFileSync } from 'node:child_process';

const cles = () => import('../conseil-ia/lib/cles.mjs');
const dossier = () => fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-cles-'));

test('clés : la variable d\'environnement l\'emporte, sinon le coffre chiffré, sinon rien', async () => {
  const { lireCle } = await cles();
  const d = dossier(), dechiffrer = fichier => `du-coffre:${path.basename(fichier)}\r\n`;
  assert.equal(lireCle('gpt', { env: {}, dossier: d, dechiffrer }), null);
  fs.mkdirSync(path.join(d, 'cles')); fs.writeFileSync(path.join(d, 'cles', 'GEMINI_API_KEY.dpapi'), 'chiffré');
  assert.deepEqual(lireCle('gemini', { env: {}, dossier: d, dechiffrer }), { valeur: 'du-coffre:GEMINI_API_KEY.dpapi', source: 'coffre chiffré' });
  assert.deepEqual(lireCle('gemini', { env: { GEMINI_API_KEY: ' env-1 ' }, dossier: d, dechiffrer }), { valeur: 'env-1', source: 'variable GEMINI_API_KEY' });
});

test('clés : une clé chiffrée par Windows (DPAPI) est relue, et n\'apparaît pas en clair sur le disque', { skip: process.platform !== 'win32' }, async () => {
  const { dechiffrerWindows } = await cles();
  const fichier = path.join(dossier(), 'essai.dpapi'), secret = 'valeur-d-essai-é-4821';
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'ConvertTo-SecureString $env:LDN_ESSAI -AsPlainText -Force | ConvertFrom-SecureString | Set-Content -LiteralPath $env:LDN_FICHIER -Encoding ascii'],
    { env: { ...process.env, LDN_ESSAI: 'valeur-d-essai-4821', LDN_FICHIER: fichier } });
  assert.ok(!fs.readFileSync(fichier, 'utf8').includes('essai'));
  assert.equal(dechiffrerWindows(fichier).trim(), 'valeur-d-essai-4821');
});
