// Export / import / comparaison de toute la base des comptes (Firestore), pour les sauvegardes et les EXERCICES DE RESTAURATION.
// Fonctionne avec n'importe quelle base ayant l'interface de serveur/base-memoire.js (mémoire ou Firestore).
//
// Utilisation réelle (préparée, à lancer par le propriétaire avec DEUX projets Firebase Spark de test) :
//   export  : FIREBASE_PROJET=ldn-source FIREBASE_COMPTE_SERVICE_FICHIER=~/cles/source.json node outils/sauvegarde/restauration.mjs exporter > export.json
//   import  : FIREBASE_PROJET=ldn-restauration-test FIREBASE_COMPTE_SERVICE_FICHIER=~/cles/cible.json node outils/sauvegarde/restauration.mjs importer export.json
//   compare : (variables de la cible) node outils/sauvegarde/restauration.mjs comparer export.json
// Garde-fous : l'import refuse une base non vide, et refuse un projet dont le nom ne contient ni « test » ni « restauration »
// sauf confirmation explicite (--cible-confirmee=<nom-du-projet>). Les clés de service restent sur l'ordinateur du propriétaire.
import fs from 'fs';

export const COLLECTIONS = ['familles', 'droits', 'acces_offerts', 'invitations', 'abonnements', 'stripe_clients', 'stripe_evenements', 'consentements_achat', 'admin_logs', 'catalogue'];
export const SOUS_COLLECTIONS = { familles: ['enfants'] };
const FORMAT = 'ldn-export-1';

async function tout(base, col) {
  const docs = {}; let apres = null;
  do { const p = await base.lister(col, { limite: 300, apres }); for (const d of p.docs) docs[d.id] = d.data; apres = p.suite; } while (apres);
  return docs;
}

export async function exporter(base, { maintenant = Date.now() } = {}) {
  const e = { format: FORMAT, date: new Date(maintenant).toISOString(), collections: {}, compte: {} };
  for (const col of COLLECTIONS) {
    e.collections[col] = await tout(base, col);
    for (const sous of SOUS_COLLECTIONS[col] || []) for (const id of Object.keys(e.collections[col])) {
      const docs = await tout(base, `${col}/${id}/${sous}`);
      if (Object.keys(docs).length) e.collections[`${col}/${id}/${sous}`] = docs;
    }
  }
  for (const [c, docs] of Object.entries(e.collections)) e.compte[c] = Object.keys(docs).length;
  return e;
}

export async function importer(base, e, { forcer = false } = {}) {
  if (!e || e.format !== FORMAT) throw new Error('format d\'export inconnu');
  if (!forcer) for (const col of COLLECTIONS) if ((await base.compter(col)) > 0) throw new Error(`base cible non vide (${col}) : import refusé`);
  let n = 0;
  for (const [col, docs] of Object.entries(e.collections)) for (const [id, data] of Object.entries(docs)) { await base.ecrire(col, id, data); n++; }
  return n;
}

const canon = v => v === null || typeof v !== 'object' ? JSON.stringify(v) : Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
// Différences entre deux exports (ou un export et la base relue) : documents manquants, en trop, ou différents.
export function comparer(a, b) {
  const diff = [], cols = new Set([...Object.keys(a.collections), ...Object.keys(b.collections)]);
  for (const c of cols) {
    const x = a.collections[c] || {}, y = b.collections[c] || {};
    for (const id of new Set([...Object.keys(x), ...Object.keys(y)])) {
      if (!(id in y)) diff.push({ c, id, type: 'manquant' });
      else if (!(id in x)) diff.push({ c, id, type: 'en-trop' });
      else if (canon(x[id]) !== canon(y[id])) diff.push({ c, id, type: 'different' });
    }
  }
  return diff;
}

// ----- ligne de commande (vraie base Firestore) -----
if (import.meta.url === 'file://' + process.argv[1]) {
  const [cmd, fichier] = process.argv.slice(2), opt = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
  const projet = process.env.FIREBASE_PROJET, cleF = process.env.FIREBASE_COMPTE_SERVICE_FICHIER;
  if (!['exporter', 'importer', 'comparer'].includes(cmd) || !projet || !cleF) {
    console.error('Usage : FIREBASE_PROJET=… FIREBASE_COMPTE_SERVICE_FICHIER=… node outils/sauvegarde/restauration.mjs exporter|importer|comparer [export.json]'); process.exit(2);
  }
  const { baseFirestore } = await import('../../serveur/base-firestore.js');
  const base = baseFirestore({ projet, compte: JSON.parse(fs.readFileSync(cleF.replace(/^~/, process.env.HOME), 'utf8')) });
  if (cmd === 'exporter') { const e = await exporter(base); process.stdout.write(JSON.stringify(e)); console.error('export :', JSON.stringify(e.compte)); }
  else {
    const e = JSON.parse(fs.readFileSync(fichier, 'utf8'));
    if (cmd === 'importer') {
      if (!/test|restauration/.test(projet) && opt['cible-confirmee'] !== projet) { console.error(`Refus : « ${projet} » ne ressemble pas à un projet de test. Relancer avec --cible-confirmee=${projet} si c'est voulu.`); process.exit(3); }
      console.error('documents importés :', await importer(base, e));
    }
    const d = comparer(e, await exporter(base));
    console.error(d.length ? `✗ ${d.length} différence(s) : ` + JSON.stringify(d.slice(0, 10)) : '✓ base identique à l\'export'); process.exit(d.length ? 1 : 0);
  }
}
