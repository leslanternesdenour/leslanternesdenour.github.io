// Transfert des sauvegardes chiffrées vers R2 : faux Wrangler en mémoire, aucun réseau, aucun compte.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'fs'; import os from 'os'; import path from 'path'; import crypto from 'crypto';
import { cleObjet, inventaire, planEnvoi, envoyer, lireManifeste, planRetention, appliquerRetention, verifierBucket } from '../sauvegarde/r2.mjs';

const sha = o => crypto.createHash('sha256').update(o).digest('hex');
function dossierEssai(noms = ['firestore-2026-11-27-22-24', 'auth-2026-11-27-22-32']) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-test-r2-'));
  for (const n of noms) { const o = Buffer.from('chiffre-' + n); fs.writeFileSync(path.join(d, n + '.json.gz.age'), o); fs.writeFileSync(path.join(d, n + '.json.gz.age.sha256'), sha(o) + '  ' + n + '\n'); }
  return d;
}
// Faux wrangler : "R2" = Map ; put lit --file, get écrit --file, delete retire. corrompre : la relecture renvoie autre chose.
function faux({ corrompre = false } = {}) {
  const r2 = new Map(), appels = [];
  const f = args => { appels.push(args.slice(0, 3).join(' ')); const [, , op, chemin] = args, file = args[args.indexOf('--file') + 1];
    if (!args.includes('--remote')) return { status: 1, sortie: 'local interdit' };
    if (op === 'put') { r2.set(chemin, fs.readFileSync(file)); return { status: 0 }; }
    if (op === 'get') { if (!r2.has(chemin)) return { status: 1 }; fs.writeFileSync(file, corrompre ? Buffer.from('autre') : r2.get(chemin)); return { status: 0 }; }
    if (op === 'delete') { r2.delete(chemin); return { status: 0 }; }
    return { status: 1 }; };
  f.r2 = r2; f.appels = appels; return f;
}

test('clés d\'objet datées et rangées par type, noms invalides refusés', () => {
  assert.equal(cleObjet('firestore-2026-11-27-22-24.json.gz.age'), 'sauvegardes/firestore/2026/11/firestore-2026-11-27-22-24.json.gz.age');
  assert.equal(cleObjet('auth-2026-01-02-03-04.json.gz.age'), 'sauvegardes/auth/2026/01/auth-2026-01-02-03-04.json.gz.age');
  for (const n of ['cle-privee-sauvegarde-LDN.txt', 'export.json', '../firestore-2026-11-27-22-24.json.gz.age', 'firestore-2026-11-27.json']) assert.throws(() => cleObjet(n));
});

test('bucket : nom valide, et jamais le bucket du contenu Premium', () => {
  assert.doesNotThrow(() => verifierBucket('ldn-sauvegardes')); assert.throws(() => verifierBucket('ldn-premium'), /Premium/); assert.throws(() => verifierBucket('A_B'), /invalide/);
});

test('inventaire : seules les archives chiffrées conformes sont retenues, le reste est ignoré', () => {
  const d = dossierEssai(); fs.writeFileSync(path.join(d, 'cle-privee.txt'), 'AGE-SECRET-KEY-1X'); fs.writeFileSync(path.join(d, 'export.json'), '{}');
  const inv = inventaire(d); assert.equal(inv.archives.length, 2); assert.ok(inv.archives.every(a => a.integre)); assert.deepEqual(inv.ignores.sort(), ['cle-privee.txt', 'export.json']);
  const p = planEnvoi(inv, lireManifeste(path.join(d, 'manifeste-r2.json'))); assert.equal(p.aEnvoyer.length, 2); assert.ok(!p.aEnvoyer.some(a => /cle|export/.test(a.nom)));
});

test('simulation : rien n\'est envoyé sans --executer', () => {
  const d = dossierEssai(), w = faux(), m = lireManifeste(path.join(d, 'manifeste-r2.json')), p = planEnvoi(inventaire(d), m);
  const r = envoyer(p, { bucket: 'ldn-sauvegardes', executer: false, executeur: w, manifeste: m, cheminManifeste: path.join(d, 'manifeste-r2.json') });
  assert.ok(r.every(x => x.etat === 'simulation')); assert.equal(w.appels.length, 0); assert.equal(w.r2.size, 0); assert.ok(!fs.existsSync(path.join(d, 'manifeste-r2.json')));
});

test('envoi réel : relecture + SHA-256 identique, manifeste tenu, second passage sans rien renvoyer', () => {
  const d = dossierEssai(), w = faux(), cm = path.join(d, 'manifeste-r2.json'), m = lireManifeste(cm);
  const r = envoyer(planEnvoi(inventaire(d), m), { bucket: 'ldn-sauvegardes', executer: true, executeur: w, manifeste: m, cheminManifeste: cm });
  assert.ok(r.every(x => x.etat === 'envoye-et-verifie')); assert.equal(w.r2.size, 2);
  const m2 = lireManifeste(cm); assert.equal(Object.keys(m2.objets).length, 2); assert.ok(Object.values(m2.objets).every(o => o.verifie && /^[0-9a-f]{64}$/.test(o.sha256)));
  const p2 = planEnvoi(inventaire(d), m2); assert.equal(p2.aEnvoyer.length, 0); assert.equal(p2.dejaEnvoyes, 2);
  assert.ok(!fs.readdirSync(os.tmpdir()).some(x => x.startsWith('ldn-r2-')), 'aucun fichier temporaire relu ne reste');
});

test('intégrité : un fichier relu différent est refusé et n\'est pas inscrit au manifeste', () => {
  const d = dossierEssai(['firestore-2026-11-27-22-24']), cm = path.join(d, 'manifeste-r2.json'), m = lireManifeste(cm);
  assert.throws(() => envoyer(planEnvoi(inventaire(d), m), { bucket: 'ldn-sauvegardes', executer: true, executeur: faux({ corrompre: true }), manifeste: m, cheminManifeste: cm }), /INTÉGRITÉ/);
  assert.equal(Object.keys(lireManifeste(cm).objets).length, 0);
});

test('un fichier local altéré (empreinte non conforme) n\'est jamais envoyé', () => {
  const d = dossierEssai(['firestore-2026-11-27-22-24']); fs.appendFileSync(path.join(d, 'firestore-2026-11-27-22-24.json.gz.age'), 'x');
  const p = planEnvoi(inventaire(d), lireManifeste(path.join(d, 'm.json'))); assert.equal(p.aEnvoyer.length, 0); assert.equal(p.nonIntegres.length, 1);
});

test('bucket du contenu Premium refusé à l\'envoi', () => {
  const d = dossierEssai(), m = lireManifeste(path.join(d, 'm.json'));
  assert.throws(() => envoyer(planEnvoi(inventaire(d), m), { bucket: 'ldn-premium', executer: true, executeur: faux(), manifeste: m, cheminManifeste: path.join(d, 'm.json') }), /Premium/);
});

function manifesteDe(jours, maintenant) {   // une archive firestore par jour, `jours` = âges en jours
  const m = { objets: {} };
  for (const j of jours) { const t = new Date(maintenant - j * 86400000), p = n => String(n).padStart(2, '0');
    const nom = `firestore-${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}-12-00.json.gz.age`;
    m.objets[cleObjet(nom)] = { nom, type: 'firestore', date: t.toISOString(), verifie: true, sha256: 'x' }; }
  return m;
}
test('rétention : tout garder 14 jours, puis 1 par semaine, puis 1 par mois, jamais moins de 3', () => {
  const now = Date.parse('2026-12-01T12:00:00Z');
  const recents = planRetention(manifesteDe([0, 1, 2, 5, 13], now), now); assert.equal(recents.supprimer.length, 0);
  const jours = Array.from({ length: 60 }, (_, i) => i), p = planRetention(manifesteDe(jours, now), now);
  assert.ok(p.supprimer.length > 0 && p.garder.length < 60 && p.garder.length >= 14);
  assert.ok(jours.filter(j => j <= 14).every(j => p.garder.some(c => c.includes(new Date(now - j * 86400000).toISOString().slice(0, 10)))), 'les 14 derniers jours sont tous gardés');
  const vieux = planRetention(manifesteDe([700, 701, 702, 703], now), now); assert.equal(vieux.garder.length, 3, 'au moins 3 conservés même très anciens'); assert.equal(vieux.supprimer.length, 1);
  assert.equal(planRetention({ objets: { 'sauvegardes/firestore/2020/01/x': { type: 'firestore', date: '2020-01-01T00:00:00Z', verifie: false } } }, now).supprimer.length, 0, 'un objet non vérifié n\'est jamais proposé');
});

test('suppression : rien sans --appliquer, 5 au plus par passage', () => {
  const now = Date.parse('2026-12-01T12:00:00Z'), d = dossierEssai(), cm = path.join(d, 'm.json'), m = manifesteDe(Array.from({ length: 40 }, (_, i) => 400 + i * 3), now), w = faux();
  const p = planRetention(m, now); assert.ok(p.supprimer.length > 5);
  assert.equal(appliquerRetention(p, { bucket: 'ldn-sauvegardes', appliquer: false, executeur: w, manifeste: m, cheminManifeste: cm }).length, 0); assert.equal(w.appels.length, 0);
  assert.equal(appliquerRetention(p, { bucket: 'ldn-sauvegardes', appliquer: true, executeur: w, manifeste: m, cheminManifeste: cm }).length, 5);
});