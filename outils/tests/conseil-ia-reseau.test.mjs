// Conseil IA : appels HTTP avec délai d'attente, reprises limitées et messages d'erreur sans clé.
import test from 'node:test'; import assert from 'node:assert/strict';

const reseau = () => import('../conseil-ia/lib/reseau.mjs');
export const reponse = (statut, corps, entetes = {}) => new Response(JSON.stringify(corps), { status: statut, headers: entetes });

test('réseau : un serveur saturé (429, 503) est relancé après le délai demandé, puis la réponse est rendue', async () => {
  const { requeteJson } = await reseau();
  const file = [reponse(429, {}, { 'retry-after': '7' }), reponse(503, {}), reponse(200, { ok: 1 })], pauses = [];
  const r = await requeteJson('https://exemple.test', {}, { fetch: async () => file.shift(), tentatives: 3, delaiMs: 1000, attendre: async ms => pauses.push(ms) });
  assert.deepEqual(r, { ok: 1 }); assert.deepEqual(pauses, [7000, 4000]);
});

test('réseau : une clé refusée ou un crédit épuisé n\'est pas relancé, et le message explique sans montrer la clé', async () => {
  const { requeteJson, ErreurApi } = await reseau();
  const cle = 'cle-tres-privee-987';
  for (const [statut, corps, attendu] of [
    [401, { error: { message: `Incorrect API key: ${cle}`, code: 'invalid_api_key' } }, /401.*clé refusée.*Incorrect API key/],
    [429, { error: { message: 'You exceeded your quota', code: 'insufficient_quota' } }, /429.*quota/],
  ]) {
    let appels = 0;
    await assert.rejects(requeteJson('https://exemple.test', {}, { fetch: async () => { appels++; return reponse(statut, corps); }, attendre: async () => {}, secrets: [cle] }),
      e => e instanceof ErreurApi && e.statut === statut && e.facturationPossible === false && attendu.test(e.message) && !e.message.includes(cle));
    assert.equal(appels, 1, String(statut));
  }
});

test('réseau : un fragment de clé renvoyé par le fournisseur (début et fin autour d\'étoiles) est masqué aussi', async () => {
  const { requeteJson } = await reseau();
  for (const fragment of ['sk-' + 'proj-Ab12********************wXy9', 'AI' + 'zaSy12...9fQz', 'AQ.' + 'Ab8R****k2Lm']) {
    await assert.rejects(requeteJson('https://exemple.test', {}, { fetch: async () => reponse(401, { error: { message: `Incorrect API key provided: ${fragment}. Check it.` } }), attendre: async () => {} }),
      e => /Incorrect API key provided: \[SECRET MASQUÉ\]\. Check it/.test(e.message) && !/wXy9|9fQz|k2Lm|Ab12/.test(e.message), fragment);
  }
});

test('réseau : un délai dépassé ou une coupure n\'est pas relancé et signale une facturation possible', async () => {
  const { requeteJson, ErreurApi } = await reseau();
  const lent = (url, { signal }) => new Promise((_, rejeter) => { const garde = setTimeout(rejeter, 2000, new Error('pas de délai')); signal?.addEventListener('abort', () => { clearTimeout(garde); rejeter(signal.reason); }); });
  const coupe = async () => { throw new TypeError('fetch failed'); };
  for (const [fetch, attendu] of [[lent, /délai de 0\.05 s dépassé/], [coupe, /connexion impossible ou interrompue/]]) {
    let appels = 0;
    await assert.rejects(requeteJson('https://exemple.test', {}, { fetch: (...a) => { appels++; return fetch(...a); }, delaiMs: 50, attendre: async () => {} }),
      e => e instanceof ErreurApi && e.facturationPossible === true && attendu.test(e.message));
    assert.equal(appels, 1);
  }
});
