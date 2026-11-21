// Logique de l'outil contre une fausse API Firestore : règles « tout refusé » (conforme) et règles trop permissives (détectées, nettoyées).
import test from 'node:test'; import assert from 'node:assert/strict';
import { verifier } from '../admin/verifier-firestore.mjs';
function fausseApi({ permissif = false } = {}) {
  const docs = new Set(), appels = []; let utilisateurs = 0;
  const f = async (url, o = {}) => {
    const rep = (s, j = {}) => new Response(JSON.stringify(j), { status: s }); appels.push((o.method || 'GET') + ' ' + url.replace(/key=[^&]+/, 'key=…'));
    if (url.includes('accounts:signUp')) { utilisateurs++; return rep(200, { idToken: 'tok', localId: 'uid1' }); }
    if (url.includes('accounts:delete')) { utilisateurs--; return rep(200); }
    if (!permissif) return rep(403, { error: { status: 'PERMISSION_DENIED' } });
    const m = o.method || 'GET', id = url.split('/').pop().split('?')[0];
    if (m === 'POST' && url.includes('documentId=')) { docs.add(url.split('documentId=')[1]); return rep(200, {}); }
    if (m === 'DELETE') { docs.delete(id); return rep(200); } if (m === 'PATCH') { docs.add(id); return rep(200, {}); }
    return rep(200, { documents: [] });
  };
  return { f, docs, appels, get utilisateurs() { return utilisateurs; } };
}
test('règles « tout refusé » : tout confirmé, compte de test supprimé, aucune collection créée', async () => {
  const a = fausseApi(); const r = await verifier({ cle: 'k', projet: 'p', fetcher: a.f });
  assert.deepEqual(r.filter(x => x.etat !== true), []); assert.equal(a.utilisateurs, 0); assert.equal(a.docs.size, 0); assert.ok(r.length >= 20);
});
test('règles trop permissives : chaque accès autorisé est signalé et les documents de test sont supprimés', async () => {
  const a = fausseApi({ permissif: true }); const r = await verifier({ cle: 'k', projet: 'p', fetcher: a.f });
  const ko = r.filter(x => x.etat === false); assert.ok(ko.length >= 15, 'anomalies détectées : ' + ko.length);
  assert.ok(ko.some(x => /Anonyme : créer/.test(x.nom)) && ko.some(x => /Parent connecté : modifier/.test(x.nom)));
  assert.equal(a.docs.size, 0, 'rien ne reste dans la base'); assert.equal(a.utilisateurs, 0);
});
test('API injoignable : indéterminé, jamais « confirmé »', async () => {
  const r = await verifier({ cle: 'k', projet: 'p', fetcher: async () => { throw new Error('réseau'); } }); assert.equal(r.filter(x => x.etat === true).length, 0);
});
