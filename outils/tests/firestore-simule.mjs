// SIMULATEUR de l'API REST de Firestore (documents, masques de champs, préconditions, écriture avec transformation « increment », requêtes),
// utilisé comme « fetcher » du VRAI module serveur/base-firestore.js. Ce n'est PAS l'émulateur officiel (qui demande Java) : il suit le comportement
// documenté de l'API REST v1 (Write.update / updateMask / updateTransforms / currentDocument, documents:commit, runQuery, runAggregationQuery).
// Chaque requête est traitée d'un seul bloc synchrone après une latence aléatoire : comme sur le serveur, deux écritures simultanées ne se mélangent jamais,
// mais leur ORDRE est imprévisible (c'est ce qui révèle les courses lecture-puis-écriture).
// L'émulateur officiel reste la référence : outils/tests/base-firestore-emulateur.test.mjs rejoue les mêmes scénarios quand Java est disponible.
export function firestoreSimule({ projet = 'demo-simule', latenceMaxMs = 6 } = {}) {
  const docs = new Map();            // chemin complet « col/id » → champs typés Firestore
  const requetes = [];               // { m, chemin, corps } de chaque appel reçu
  const racine = `https://firestore.googleapis.com/v1/projects/${projet}/databases/(default)/documents`;
  const rep = (corps, statut = 200) => new Response(JSON.stringify(corps), { status: statut, headers: { 'Content-Type': 'application/json' } });
  const nom = chemin => `projects/${projet}/databases/(default)/documents/${chemin}`;
  const doc = chemin => ({ name: nom(chemin), fields: JSON.parse(JSON.stringify(docs.get(chemin))), createTime: '2026-11-28T00:00:00Z', updateTime: '2026-11-28T00:00:01Z' });
  const sansAccents = p => p.replace(/^`|`$/g, '');
  function ecrire(chemin, champs, masque) {
    if (!masque) { docs.set(chemin, JSON.parse(JSON.stringify(champs || {}))); return; }
    const cur = docs.get(chemin) || {};
    for (const p of masque.map(sansAccents)) { if (champs && p in champs) cur[p] = JSON.parse(JSON.stringify(champs[p])); else delete cur[p]; }
    docs.set(chemin, cur);
  }
  function transformer(chemin, t) {
    const cur = docs.get(chemin) || {}, p = sansAccents(t.fieldPath);
    if (!t.increment) throw new Error('transformation non simulée : ' + JSON.stringify(t));
    const n = Number(t.increment.integerValue), v = cur[p];
    let res;
    if (v && 'integerValue' in v) res = { integerValue: String(Number(v.integerValue) + n) };
    else if (v && 'doubleValue' in v) res = { doubleValue: v.doubleValue + n };
    else res = { integerValue: String(n) };            // champ absent ou non numérique : la valeur ajoutée devient la valeur
    cur[p] = res; docs.set(chemin, cur); return res;
  }
  const enfants = col => [...docs.keys()].filter(k => k.startsWith(col + '/') && !k.slice(col.length + 1).includes('/')).sort();
  async function traiter(url, opts = {}) {
    await new Promise(r => setTimeout(r, Math.random() * latenceMaxMs));
    const m = (opts.method || 'GET').toUpperCase(), corps = opts.body ? JSON.parse(opts.body) : null;
    if (!url.startsWith(racine)) return rep({ error: { message: 'hors projet' } }, 400);
    const [brut, requete = ''] = url.slice(racine.length).replace(/^\//, '').split('?');
    const q = new URLSearchParams(requete), chemin = decodeURIComponent(brut);
    requetes.push({ m, chemin, corps });
    if (chemin === ':commit' && m === 'POST') {
      const resultats = [];
      for (const w of corps.writes) {
        if (!w.update) return rep({ error: { message: 'écriture non simulée' } }, 400);
        const c = w.update.name.slice(nom('').length);
        if (w.currentDocument && w.currentDocument.exists === true && !docs.has(c)) return rep({ error: { status: 'NOT_FOUND' } }, 404);
        ecrire(c, w.update.fields, w.updateMask && w.updateMask.fieldPaths);
        resultats.push({ updateTime: '2026-11-28T00:00:02Z', transformResults: (w.updateTransforms || []).map(t => transformer(c, t)) });
      }
      return rep({ writeResults: resultats, commitTime: '2026-11-28T00:00:02Z' });
    }
    if (chemin.endsWith(':runQuery') || chemin.endsWith(':runAggregationQuery')) {
      const agr = chemin.endsWith(':runAggregationQuery'), parent = chemin.replace(/:run(Aggregation)?Query$/, '');
      const sq = agr ? corps.structuredAggregationQuery.structuredQuery : corps.structuredQuery;
      const col = (parent ? parent + '/' : '') + sq.from[0].collectionId;
      let ids = enfants(col);
      const f = sq.where && sq.where.fieldFilter;
      if (f) ids = ids.filter(k => JSON.stringify(docs.get(k)[f.field.fieldPath]) === JSON.stringify(f.value));
      if (agr) return rep([{ result: { aggregateFields: { n: { integerValue: String(ids.length) } } } }]);
      if (sq.startAt) { const apres = sq.startAt.values[0].referenceValue.split('/').pop(); ids = ids.filter(k => k.split('/').pop() > apres); }
      ids = ids.slice(0, sq.limit || 100);
      return rep(ids.length ? ids.map(k => ({ document: doc(k) })) : [{ readTime: '2026-11-28T00:00:03Z' }]);
    }
    if (m === 'GET') return docs.has(chemin) ? rep(doc(chemin)) : rep({ error: { status: 'NOT_FOUND' } }, 404);
    if (m === 'DELETE') { docs.delete(chemin); return rep({}); }
    if (m === 'PATCH') {
      if (q.get('currentDocument.exists') === 'true' && !docs.has(chemin)) return rep({ error: { status: 'NOT_FOUND' } }, 404);
      if (q.get('currentDocument.exists') === 'false' && docs.has(chemin)) return rep({ error: { status: 'ALREADY_EXISTS' } }, 409);
      const masque = q.getAll('updateMask.fieldPaths');
      ecrire(chemin, corps.fields, masque.length ? masque : null); return rep(doc(chemin));
    }
    return rep({ error: { message: 'non simulé : ' + m + ' ' + chemin } }, 400);
  }
  return { fetcher: traiter, docs, requetes, projet };
}
