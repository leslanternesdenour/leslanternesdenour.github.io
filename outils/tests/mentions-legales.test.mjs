import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { champsEnAttente, renseigner, CHAMPS } from '../legal/renseigner.mjs';

const page = readFileSync(new URL('../../conditions/index.html', import.meta.url), 'utf8');

test('mentions legales : tous les emplacements prevus existent, aucun n\'est invente', () => {
  const presents = new Set(champsEnAttente(page));
  for (const c of CHAMPS) assert.ok(presents.has(c), 'emplacement manquant : ' + c);
  for (const c of ['siren', 'adresse', 'statut', 'tva', 'nom', 'contact', 'directeur']) assert.ok(presents.has(c), c);
  assert.ok(!/\b\d{9}\b|\b\d{14}\b/.test(page.replace(/<[^>]+>/g, ' ')), 'un SIREN/SIRET semble ecrit en dur');
});

test('mentions legales : renseigner remplit seulement les champs fournis et echappe le HTML', () => {
  const r = renseigner(page, { siren: '<b>123 456 789</b>', nom: '  ' });
  assert.deepEqual(r.remplis, ['siren']);
  assert.ok(r.html.includes('&lt;b&gt;123 456 789&lt;/b&gt;'));
  assert.ok(r.restants.includes('nom') && !r.restants.includes('siren'));
});

test('mentions legales : tant qu\'un champ est en attente, la promotion en production est bloquee', () => {
  const garde = readFileSync(new URL('../migration/promouvoir.sh', import.meta.url), 'utf8');
  assert.ok(garde.includes('tarifs/index.html') && !garde.includes('conditions/index.html'), 'la garde porte sur tarifs ; Conditions est protégée par la vue publique');
  assert.ok(/\[EN ATTENTE/.test(page));
});
test('ouverture commerciale : l\'interrupteur MENTIONS_COMPLETES est cohérent avec la page, et bloque les clés Stripe réelles', async () => {
  const { MENTIONS_COMPLETES } = await import('../../serveur/ouverture.js');
  assert.equal(MENTIONS_COMPLETES, champsEnAttente(page).length === 0, 'interrupteur incohérent avec conditions/index.html');
  const { clientStripe } = await import('../../serveur/stripe.js');
  if (!MENTIONS_COMPLETES) assert.throws(() => clientStripe({ STRIPE_CLE_SECRETE: 'sk_live_x', STRIPE_MODE_REEL: 'autorise' }), /mentions légales/);
  assert.throws(() => clientStripe({ STRIPE_CLE_SECRETE: 'sk_live_x' }), /RÉELLE refusée/);
  assert.doesNotThrow(() => clientStripe({ STRIPE_CLE_SECRETE: 'sk_test_x' }));
});

test('vue publique (production) : aucun « EN ATTENTE » visible, texte neutre, page complète inchangée', async () => {
  const { vuePublique, MARQUEURS_PROVISOIRES, MENTION_A_VENIR } = await import('../legal/vue-publique.mjs');
  const v = vuePublique(page);
  assert.ok(!MARQUEURS_PROVISOIRES.test(v), 'marqueur provisoire restant'); assert.ok(!/EN ATTENTE/.test(v)); assert.ok(v.includes(MENTION_A_VENIR));
  assert.match(v, /paiements ne sont pas encore ouverts/); assert.match(v, /jusqu'à 4 profils/, 'le contenu des conditions est conservé');
  const rempli = renseigner(page, Object.fromEntries(CHAMPS.map(c => [c, 'x']))).html;
  assert.equal(vuePublique(rempli), rempli);
});