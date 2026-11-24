// Envoi des e-mails par un prestataire transactionnel (Resend ou Brevo) : appels HTTPS simples (compatibles avec Cloudflare Pages Functions), aucune clé dans le code.
import test from 'node:test'; import assert from 'node:assert/strict';
import { creerCourriel } from '../../serveur/email.js';

const CLE = 'cle-de-test-0123456789abcdefghij';
const resend = { EMAIL_FOURNISSEUR: 'resend', EMAIL_CLE_API: CLE };
const brevo = { EMAIL_FOURNISSEUR: 'brevo', EMAIL_CLE_API: CLE };
const faux = (statut = 200, corps = { id: 'x' }) => { const appels = []; return { appels, fetcher: async (u, o) => { appels.push({ u, o }); return new Response(JSON.stringify(corps), { status: statut }); } }; };
const MSG = { a: 'parent@exemple.fr', objet: 'Vérifiez votre adresse e-mail', texte: 'Bonjour', html: '<p>Bonjour</p>' };

test('sans configuration complète, l\'envoi personnalisé est désactivé (null) : l\'ancien envoi Firebase reste utilisé', () => {
  assert.equal(creerCourriel({}), null);
  assert.equal(creerCourriel({ EMAIL_FOURNISSEUR: 'resend' }), null, 'sans clé');
  assert.equal(creerCourriel({ EMAIL_CLE_API: CLE }), null, 'sans fournisseur');
  assert.equal(creerCourriel({ EMAIL_FOURNISSEUR: 'inconnu', EMAIL_CLE_API: CLE }), null, 'fournisseur inconnu');
  assert.equal(creerCourriel({ EMAIL_FOURNISSEUR: 'resend', EMAIL_CLE_API: 'court' }), null, 'clé trop courte');
  assert.equal(creerCourriel({ ...resend, EMAIL_EXPEDITEUR_ADRESSE: 'pas-une-adresse' }), null, 'adresse d\'expéditeur invalide');
  assert.ok(creerCourriel(resend)); assert.ok(creerCourriel(brevo));
});

test('Resend : POST https://api.resend.com/emails, clé en Bearer, expéditeur « Les Lanternes de Nour <bonjour@leslanternesdenour.fr> », objet, texte et HTML', async () => {
  const f = faux(200, { id: 'abc' }); const c = creerCourriel(resend, { fetcher: f.fetcher });
  const r = await c.envoyer(MSG); assert.equal(r.ok, true);
  const { u, o } = f.appels[0]; assert.equal(u, 'https://api.resend.com/emails'); assert.equal(o.method, 'POST');
  assert.equal(o.headers.Authorization, 'Bearer ' + CLE); assert.equal(o.headers['Content-Type'], 'application/json');
  const b = JSON.parse(o.body);
  assert.equal(b.from, 'Les Lanternes de Nour <bonjour@leslanternesdenour.fr>'); assert.deepEqual(b.to, ['parent@exemple.fr']);
  assert.equal(b.subject, MSG.objet); assert.equal(b.text, MSG.texte); assert.equal(b.html, MSG.html);
});

test('Brevo : POST https://api.brevo.com/v3/smtp/email, clé dans l\'en-tête api-key, champs sender / to / subject / htmlContent / textContent', async () => {
  const f = faux(201, { messageId: 'm' }); const c = creerCourriel(brevo, { fetcher: f.fetcher });
  assert.equal((await c.envoyer(MSG)).ok, true);
  const { u, o } = f.appels[0]; assert.equal(u, 'https://api.brevo.com/v3/smtp/email'); assert.equal(o.headers['api-key'], CLE);
  const b = JSON.parse(o.body);
  assert.deepEqual(b.sender, { name: 'Les Lanternes de Nour', email: 'bonjour@leslanternesdenour.fr' }); assert.deepEqual(b.to, [{ email: 'parent@exemple.fr' }]);
  assert.equal(b.subject, MSG.objet); assert.equal(b.htmlContent, MSG.html); assert.equal(b.textContent, MSG.texte);
});

test('l\'adresse de réponse et l\'expéditeur sont configurables ; l\'adresse d\'envoi par défaut est bonjour@leslanternesdenour.fr', async () => {
  const f = faux(); const c = creerCourriel({ ...resend, EMAIL_EXPEDITEUR_NOM: 'Nour', EMAIL_EXPEDITEUR_ADRESSE: 'contact@leslanternesdenour.fr', EMAIL_REPONSE: 'aide@leslanternesdenour.fr' }, { fetcher: f.fetcher });
  await c.envoyer(MSG); const b = JSON.parse(f.appels[0].o.body);
  assert.equal(b.from, 'Nour <contact@leslanternesdenour.fr>'); assert.equal(b.reply_to, 'aide@leslanternesdenour.fr');
});

test('un échec du prestataire lève une erreur neutre : ni la clé ni le corps de la réponse ne fuient dans le message', async () => {
  const f = faux(422, { message: 'secret-interne ' + CLE }); const c = creerCourriel(resend, { fetcher: f.fetcher });
  await assert.rejects(() => c.envoyer(MSG), e => { assert.match(e.message, /^courriel-refuse:422$/); assert.ok(!e.message.includes(CLE)); return true; });
  const r = creerCourriel(resend, { fetcher: async () => { throw new Error('reseau ' + CLE); } });
  await assert.rejects(() => r.envoyer(MSG), e => { assert.match(e.message, /^courriel-injoignable$/); return true; });
});

test('protection : destinataire invalide, objet multiligne (injection d\'en-têtes) ou message vide sont refusés avant tout appel réseau', async () => {
  const f = faux(); const c = creerCourriel(resend, { fetcher: f.fetcher });
  for (const mauvais of [{ ...MSG, a: 'pas-une-adresse' }, { ...MSG, a: 'a@exemple.fr, b@exemple.fr' }, { ...MSG, a: 'a@exemple.fr\nBcc: x@exemple.fr' }, { ...MSG, objet: 'Salut\r\nBcc: x@exemple.fr' }, { ...MSG, texte: '' }, { ...MSG, html: '' }])
    await assert.rejects(() => c.envoyer(mauvais), /^Error: courriel-invalide$/);
  assert.equal(f.appels.length, 0);
});

test('délai maximal : un prestataire qui ne répond pas ne bloque pas la fonction (annulation après quelques secondes)', async () => {
  let signal = null; const c = creerCourriel(resend, { delaiMs: 30, fetcher: (u, o) => new Promise((_, rej) => { signal = o.signal; o.signal.addEventListener('abort', () => rej(new Error('abort'))); }) });
  await assert.rejects(() => c.envoyer(MSG), /courriel-injoignable/); assert.equal(signal.aborted, true);
});