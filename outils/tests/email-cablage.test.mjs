// Câblage Cloudflare : le prestataire d'envoi est créé à partir des variables d'environnement, sans jamais exposer la clé ; /api/sante indique seulement s'il est actif.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';

test('la fonction des comptes crée le prestataire d\'envoi à partir de l\'environnement et le place dans le contexte de l\'API', () => {
  const f = fs.readFileSync(new URL('../../functions/api/[[route]].js', import.meta.url), 'utf8');
  assert.match(f, /import \{ creerCourriel \} from '\.\.\/\.\.\/serveur\/email\.js'/);
  assert.match(f, /courriel: creerCourriel\(env\)/);
});

test('/api/sante indique l\'état de l\'envoi personnalisé (non, resend, brevo, invalide) sans jamais révéler la clé', async () => {
  const { etatConfiguration } = await import('../../functions/api/sante.js');
  const CLE = 'cle-de-test-0123456789abcdefghij';
  assert.equal(etatConfiguration({}).courriel, 'non');
  assert.equal(etatConfiguration({ EMAIL_FOURNISSEUR: 'resend', EMAIL_CLE_API: CLE }).courriel, 'resend');
  assert.equal(etatConfiguration({ EMAIL_FOURNISSEUR: 'brevo', EMAIL_CLE_API: CLE }).courriel, 'brevo');
  assert.equal(etatConfiguration({ EMAIL_FOURNISSEUR: 'resend', EMAIL_CLE_API: 'trop-court' }).courriel, 'invalide');
  assert.equal(etatConfiguration({ EMAIL_FOURNISSEUR: 'resend' }).courriel, 'cle-absente', 'fournisseur déclaré mais clé pas encore saisie');
  assert.ok(!JSON.stringify(etatConfiguration({ EMAIL_FOURNISSEUR: 'resend', EMAIL_CLE_API: CLE })).includes(CLE));
});
