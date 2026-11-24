// Les voix de la Route : l'inventaire des textes à prononcer (voix Nour existantes seulement). Jamais de récit « À VALIDER », jamais de contenu religieux.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';

test('inventaire : chaque texte non religieux affiché a sa phrase et sa voix Nour existante ; rien de « À VALIDER » ni de religieux ; budget de caractères borné', async () => {
  const { inventaire, normaliserTexte } = await import('../voix/route/inventaire-route.mjs');
  const { TEXTES_LIEUX, FAITS_MAISONS } = await import('../../voyage/js/route/textes-route.js');
  const { VOYAGEURS_VILLE, MISSIONS_ROUTE, LIEUX_ROUTE } = await import('../../voyage/js/route/donnees.js');
  const { LIEUX_SACRES } = await import('../../voyage/js/route/lieux-mecque-a-valider.js');
  const { RECITS } = await import('../../voyage/js/route/recits-a-valider.js');
  const roles = JSON.parse(fs.readFileSync(new URL('../voix/jeux/voix-roles.json', import.meta.url), 'utf8')), nour = JSON.parse(fs.readFileSync(new URL('../voix/jeux/voix-nour.json', import.meta.url), 'utf8')).voix;
  const liste = await inventaire(), textes = new Map(liste.map(p => [normaliserTexte(p.texte), p]));
  assert.equal(new Set(liste.map(p => p.id)).size, liste.length, 'identifiants uniques');
  for (const p of liste) { assert.match(p.id, /^NOUR-VOIX-RTE-[0-9a-f]{8}$/); assert.ok(roles[p.role] && nour.some(v => v.id === roles[p.role]), `${p.id} : voix ${p.role} hors des 10 voix Nour`); }
  const a = t => assert.ok(textes.has(normaliserTexte(t)), `texte sans voix : ${t.slice(0, 60)}`);
  for (const l of LIEUX_ROUTE.filter(x => !['objet', 'personnage'].includes(x.type) && !LIEUX_SACRES[x.id])) { a(TEXTES_LIEUX[l.id].petit); a(TEXTES_LIEUX[l.id].grand); }
  for (const f of FAITS_MAISONS) { a(f.petit); a(f.grand); }
  for (const v of VOYAGEURS_VILLE) { a(v.texte.petit); a(v.texte.grand); }
  for (const m of Object.values(MISSIONS_ROUTE)) { a(m.titre); a(m.simple); a(m.resume); }
  // jamais de voix pour ce qui attend une validation humaine
  const interdits = new Set([...RECITS.flatMap(r => [...r.enonces.flatMap(e => [e.petit, e.grand]), ...r.questions.flatMap(q => [q.petit, q.grand, ...q.choix])]), ...Object.values(LIEUX_SACRES).flatMap(s => [s.petit, s.grand])].filter(Boolean).map(normaliserTexte));
  for (const [n, p] of textes) { assert.ok(!interdits.has(n), `texte « À VALIDER » enregistré : ${p.texte.slice(0, 50)}`); assert.ok(!/(allah|coran|kaaba|zamzam|safa|marwa|prophète|hadith|hajj|omra|qibla|hira|thawr|jabal|ismaïl|hajar|ibrahim|mecque)/i.test(p.texte), `terme religieux : ${p.texte.slice(0, 50)}`); assert.ok(!/À VALIDER/.test(p.texte)); }
  const car = liste.reduce((s, p) => s + p.texte.length, 0);
  assert.ok(car > 8000 && car < 45000, `budget de caractères : ${car}`);
});

test('production des voix : refuse toute voix hors des 10 voix Nour, ne régénère jamais l\'existant, ne montre jamais la clé, n\'utilise jamais la voix du navigateur', () => {
  const s = fs.readFileSync(new URL('../voix/route/produire-route.mjs', import.meta.url), 'utf8');
  assert.match(s, /voix-nour\.json/); assert.match(s, /REFUSÉ/); assert.match(s, /--dry/);
  assert.match(s, /existsSync\(sortie\)/, 'saute ce qui existe déjà');
  assert.ok(!/console\.(log|error)\([^)]*(cle|CLE|key|KEY|apiKey)/.test(s), 'la clé n\'est jamais affichée');
  assert.ok(!/speechSynthesis/.test(s));
  assert.match(s, /eleven_|model_id/); assert.match(s, /audio\/route-voix\.json/);
});

test('inventaire : chaque habitant de maison parle avec sa propre voix Nour (3–5 ans et 6–10 ans)', async () => {
  const { inventaire, normaliserTexte } = await import('../voix/route/inventaire-route.mjs');
  const { HABITANTS_MAISONS } = await import('../../voyage/js/route/donnees.js');
  const parTexte = new Map((await inventaire()).map(p => [normaliserTexte(p.texte), p]));
  for (const h of Object.values(HABITANTS_MAISONS)) for (const t of [h.petit, h.grand]) { const p = parTexte.get(normaliserTexte(t)); assert.ok(p, 'sans voix : ' + t.slice(0, 40)); assert.equal(p.role, h.voix, `${h.role} : mauvaise voix`); }
});

test('inventaire : chaque texte d\'une activité de métier (présentation, questions, explications, fin) a la voix de son métier', async () => {
  const { inventaire, normaliserTexte } = await import('../voix/route/inventaire-route.mjs');
  const { ACTIVITES_METIERS, questionsMetier } = await import('../../voyage/js/route/activites-route.js');
  const parTexte = new Map((await inventaire()).map(p => [normaliserTexte(p.texte), p]));
  for (const [id, a] of Object.entries(ACTIVITES_METIERS)) {
    const textes = [a.intro.petit, a.intro.grand, a.fin.petit, a.fin.grand, ...['3-5', '6-10'].flatMap(age => questionsMetier(id, age).flatMap(q => [q.question, q.ok, q.ko]))];
    for (const t of textes) { const p = parTexte.get(normaliserTexte(t)); assert.ok(p, `${id} : sans voix : ${t.slice(0, 40)}`); assert.equal(p.role, a.voix, `${id} : mauvaise voix`); }
  }
});

test('inventaire : le tour et le four de l\'atelier sont dits par la narratrice (3–5 ans et 6–10 ans)', async () => {
  const { inventaire, normaliserTexte } = await import('../voix/route/inventaire-route.mjs');
  const { FAITS_ATELIER } = await import('../../voyage/js/route/textes-route.js');
  const parTexte = new Map((await inventaire()).map(p => [normaliserTexte(p.texte), p]));
  for (const f of Object.values(FAITS_ATELIER)) for (const t of [f.petit, f.grand]) { const p = parTexte.get(normaliserTexte(t)); assert.ok(p, 'sans voix : ' + t.slice(0, 40)); assert.equal(p.role, 'narratrice'); }
});

test('inventaire : les objets des intérieurs de maisons sont dits par la voix de l\'habitant de la maison (3–5 ans et 6–10 ans)', async () => {
  const { inventaire, normaliserTexte } = await import('../voix/route/inventaire-route.mjs');
  const { FAITS_INTERIEURS } = await import('../../voyage/js/route/textes-route.js');
  const { HABITANTS_MAISONS } = await import('../../voyage/js/route/donnees.js');
  const parTexte = new Map((await inventaire()).map(p => [normaliserTexte(p.texte), p]));
  for (const [g, f] of Object.entries(FAITS_INTERIEURS)) for (const o of f.objets) for (const t of [o.petit, o.grand]) { const p = parTexte.get(normaliserTexte(t)); assert.ok(p, 'sans voix : ' + t.slice(0, 40)); assert.equal(p.role, HABITANTS_MAISONS[g].voix, `${g} : la voix de l'habitant`); }
});
