// Outil de bascule Cloudflare (outils/migration/basculer-cloudflare.mjs) testé contre une FAUSSE API Cloudflare (aucun compte réel, aucun jeton).
// Vérifie : sauvegarde DNS écrite avant toute écriture, seuls les enregistrements GitHub sont supprimés (MX/TXT intacts), enregistrements inconnus = arrêt
// sans rien modifier, rétablissement automatique en cas d'échec, retour en arrière, contrôles du projet (branche, secrets, pas de paiement), aucun jeton lu.
import test from 'node:test'; import assert from 'node:assert/strict'; import http from 'node:http'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { spawn } from 'node:child_process';
const GH = [['A', '185.199.108.153'], ['A', '185.199.109.153'], ['A', '185.199.110.153'], ['A', '185.199.111.153'], ['AAAA', '2606:50c0:8000::153'], ['AAAA', '2606:50c0:8001::153']];
const D = 'leslanternesdenour.fr', W = 'www.' + D;
function etatInitial(sur = {}) {
  let n = 0; const rec = (type, name, content, extra = {}) => ({ id: 'r' + (++n), type, name, content, proxied: false, ttl: 3600, ...extra });
  return { journal: [], domaines: [], appelsDomaine: 0, echecCreationCname: false,
    projet: { name: 'lanternes-de-nour', production_branch: 'production', subdomain: 'lanternes-de-nour.pages.dev',
      latest_deployment: { latest_stage: { status: 'success' }, deployment_trigger: { metadata: { branch: 'production', commit_hash: 'b119be2aaaa' } } },
      deployment_configs: { production: { env_vars: { SESSION_SECRET: { type: 'secret_text' }, FIREBASE_COMPTE_SERVICE: { type: 'secret_text' }, CREATOR_UID: { type: 'secret_text' }, FIREBASE_PROJET: { type: 'plain_text', value: 'lanternes-de-nour' } }, r2_buckets: {} }, preview: { env_vars: {} } }, ...sur.projet },
    records: [...GH.map(([t, c]) => rec(t, D, c)), rec('CNAME', W, 'leslanternesdenour.github.io'), rec('MX', D, 'mx1.mail.example', { priority: 10 }), rec('MX', D, 'mx2.mail.example', { priority: 20 }),
      rec('TXT', D, 'v=spf1 include:_spf.mail.example ~all'), rec('TXT', '_dmarc.' + D, 'v=DMARC1; p=none'), rec('CNAME', 'mail.' + D, 'ghs.mail.example'), ...(sur.supplement || [])], n };
}
function serveur(etat) {
  let n = etat.n; const ok = r => ({ success: true, errors: [], result: r }), ko = m => ({ success: false, errors: [{ message: m }], result: null });
  return http.createServer((req, res) => {
    let corps = ''; req.on('data', c => corps += c); req.on('end', () => {
      const u = new URL(req.url, 'http://x'), p = u.pathname.replace('/client/v4', ''), m = req.method, b = corps ? JSON.parse(corps) : null, rep = (code, o) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
      const ecriture = m !== 'GET'; if (ecriture) etat.journal.push({ m, p, b, sauvegardeAvant: fs.existsSync(etat.chemin) });
      if (m === 'GET' && p === '/accounts/A/pages/projects/lanternes-de-nour') return rep(200, ok(etat.projet));
      if (p === '/accounts/A/pages/projects/lanternes-de-nour/domains' && m === 'GET') return rep(200, ok(etat.domaines.map(name => ({ name }))));
      if (p === '/accounts/A/pages/projects/lanternes-de-nour/domains' && m === 'POST') { etat.domaines.push(b.name); return rep(200, ok({ name: b.name, status: 'initializing' })); }
      let x = p.match(/^\/accounts\/A\/pages\/projects\/lanternes-de-nour\/domains\/(.+)$/); if (x && m === 'GET') { etat.appelsDomaine++; return rep(200, ok({ name: x[1], status: etat.appelsDomaine > 3 ? 'active' : 'pending', validation_data: { status: etat.appelsDomaine > 3 ? 'active' : 'pending' }, verification_data: { status: 'verified' } })); }
      if (p === '/zones/Z/dns_records' && m === 'GET') { const page = Number(u.searchParams.get('page') || 1), pp = Number(u.searchParams.get('per_page') || 100); return rep(200, ok(etat.records.slice((page - 1) * pp, page * pp))); }
      if (p === '/zones/Z/dns_records' && m === 'POST') { if (etat.echecCreationCname && b.type === 'CNAME' && /pages\.dev/.test(b.content)) return rep(400, ko('Record creation refused (test)')); const r = { id: 'r' + (++n), ...b }; etat.records.push(r); return rep(200, ok(r)); }
      x = p.match(/^\/zones\/Z\/dns_records\/(.+)$/); if (x && m === 'DELETE') { const i = etat.records.findIndex(r => r.id === x[1]); if (i < 0) return rep(404, ko('not found')); etat.records.splice(i, 1); return rep(200, ok({ id: x[1] })); }
      rep(404, ko('route inconnue ' + m + ' ' + p));
    });
  });
}
async function lancer(etat, args = [], env = {}) {
  etat.chemin = path.join(os.tmpdir(), 'ldn-sauv-' + Math.random().toString(36).slice(2) + '.json');
  const srv = serveur(etat); await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}/client/v4`;
  const sortie = await new Promise(r => { const c = spawn('node', ['outils/migration/basculer-cloudflare.mjs', '--compte', 'A', '--zone', 'Z', '--api', base, '--sauvegarde', etat.chemin, '--attente', '30', ...args], { env: { ...process.env, LDN_ATTENTE_PAS: '0', ...env } }); let s = ''; c.stdout.on('data', d => s += d); c.stderr.on('data', d => s += d); c.on('close', code => r({ code, s })); });
  srv.close(); return sortie;
}
const cle = r => `${r.type}|${r.name}|${r.content}`;

test('diagnostic (sans --appliquer) : contrôles, SAUVEGARDE complète, plan ; AUCUNE écriture distante', async () => {
  const e = etatInitial(), avant = e.records.map(cle).sort(), { code, s } = await lancer(e);
  assert.equal(code, 0, s); assert.equal(e.journal.length, 0, 'aucune écriture : ' + JSON.stringify(e.journal)); assert.deepEqual(e.records.map(cle).sort(), avant);
  const sauv = JSON.parse(fs.readFileSync(e.chemin, 'utf8')); assert.equal(sauv.enregistrements.length, e.records.length); assert.ok(sauv.enregistrements.some(r => r.type === 'MX') && sauv.enregistrements.some(r => r.type === 'TXT'));
  assert.match(s, /DIAGNOSTIC terminé/); assert.match(s, /supprimer A leslanternesdenour\.fr → 185\.199\.108\.153/);
});
test('bascule : sauvegarde AVANT la première écriture ; GitHub supprimé ; MX/TXT/autres INTACTS ; CNAME proxifiés ; domaines ajoutés ; attente HTTPS', async () => {
  const e = etatInitial(), conserves = e.records.filter(r => !/^(A|AAAA)$/.test(r.type) && r.name !== W).map(cle).sort(), { code, s } = await lancer(e, ['--appliquer', '--dnssec-desactive']);
  assert.equal(code, 0, s); assert.ok(e.journal.length > 0 && e.journal.every(j => j.sauvegardeAvant), 'chaque écriture est postérieure à la sauvegarde');
  assert.ok(!e.records.some(r => /^185\.199\./.test(r.content) || /^2606:50c0/.test(r.content) || /github\.io/.test(r.content)), 'plus aucun enregistrement GitHub');
  for (const c of conserves) assert.ok(e.records.map(cle).includes(c), 'conservé : ' + c);
  for (const n of [D, W]) { const r = e.records.find(x => x.name === n && x.type === 'CNAME'); assert.ok(r && r.content === 'lanternes-de-nour.pages.dev' && r.proxied === true, n); }
  assert.deepEqual([...e.domaines].sort(), [D, W].sort()); assert.match(s, /leslanternesdenour\.fr : domaine actif et certificat émis/);
  const ordre = e.journal.map(j => j.m + ' ' + (j.p.includes('/domains') ? 'domaine' : 'dns')); assert.ok(ordre.indexOf('POST domaine') < ordre.indexOf('DELETE dns'), 'domaines déclarés AVANT de toucher au DNS');
});
test('un enregistrement INCONNU sur l\'apex ou www : arrêt, rien n\'est modifié ni supprimé', async () => {
  const e = etatInitial({ supplement: [{ id: 'x1', type: 'A', name: D, content: '203.0.113.7', proxied: false, ttl: 300 }] }), avant = e.records.map(cle).sort(), { code, s } = await lancer(e, ['--appliquer', '--dnssec-desactive']);
  assert.equal(code, 1); assert.match(s, /enregistrements inattendus/); assert.equal(e.journal.length, 0); assert.deepEqual(e.records.map(cle).sort(), avant);
});
test('échec de création du CNAME après suppression : rétablissement AUTOMATIQUE, DNS identique à l\'origine', async () => {
  const e = etatInitial(); e.echecCreationCname = true; const avant = e.records.map(cle).sort(), { code, s } = await lancer(e, ['--appliquer', '--dnssec-desactive']);
  assert.equal(code, 1); assert.match(s, /rétablissement automatique/); assert.deepEqual(e.records.map(cle).sort(), avant, 'DNS rétabli tel qu\'avant');
});
test('retour en arrière (--restaurer) après une bascule réussie : retour au DNS d\'origine', async () => {
  const e = etatInitial(), avant = e.records.map(cle).sort(); let r = await lancer(e, ['--appliquer', '--dnssec-desactive']); assert.equal(r.code, 0, r.s);
  const sauv = e.chemin; e.chemin = sauv;   // même sauvegarde
  const srv = serveur(e); await new Promise(x => srv.listen(0, '127.0.0.1', x));
  const sortie = await new Promise(x => { const c = spawn('node', ['outils/migration/basculer-cloudflare.mjs', '--compte', 'A', '--zone', 'Z', '--api', `http://127.0.0.1:${srv.address().port}/client/v4`, '--sauvegarde', sauv, '--restaurer']); let s = ''; c.stdout.on('data', d => s += d); c.stderr.on('data', d => s += d); c.on('close', code => x({ code, s })); });
  srv.close(); assert.equal(sortie.code, 0, sortie.s); assert.deepEqual(e.records.map(cle).sort(), avant);
});
test('contrôles du projet : mauvaise branche de production, secret manquant ou paiement présent → arrêt AVANT toute écriture', async () => {
  for (const [nom, projet, motif] of [['branche', { production_branch: 'preproduction' }, /branche de production/i], ['secret', { deployment_configs: { production: { env_vars: { SESSION_SECRET: {} }, r2_buckets: {} } } }, /FIREBASE_COMPTE_SERVICE/], ['paiement', { deployment_configs: { production: { env_vars: { SESSION_SECRET: {}, FIREBASE_COMPTE_SERVICE: {}, CREATOR_UID: {}, STRIPE_CLE_SECRETE: {} }, r2_buckets: {} } } }, /STRIPE/]]) {
    const e = etatInitial({ projet }), { code, s } = await lancer(e, ['--appliquer', '--dnssec-desactive']); assert.equal(code, 1, nom); assert.match(s, motif, nom); assert.equal(e.journal.length, 0, nom);
  }
});
test('le jeton n\'est JAMAIS lu, écrit ni affiché par l\'outil (il est ajouté par le proxy de la session)', () => {
  const src = fs.readFileSync('outils/migration/basculer-cloudflare.mjs', 'utf8').replace(/^\/\/.*$/gm, '');
  assert.ok(!/Authorization|Bearer|process\.env\.(CLOUDFLARE|CF_API|TOKEN)|API_TOKEN|X-Auth/i.test(src), 'aucune lecture de jeton');
});

test('VERROU DNSSEC : --appliquer sans --dnssec-desactive est refusé AVANT tout appel (aucune sauvegarde, aucune écriture)', async () => {
  const e = etatInitial(), { code, s } = await lancer(e, ['--appliquer']);
  assert.equal(code, 1); assert.match(s, /exige --dnssec-desactive/); assert.equal(e.journal.length, 0); assert.ok(!fs.existsSync(e.chemin), 'aucune sauvegarde écrite : l\'outil s\'est arrêté avant tout appel');
});
test('messagerie : MX/TXT/SPF/DKIM annoncés comme intouchables ; absence de MX et hôtes de courrier proxifiés signalés sans rien modifier', async () => {
  const e = etatInitial({ supplement: [{ id: 'p1', type: 'A', name: 'mail.' + D, content: '203.0.113.9', proxied: true, ttl: 1 }, { id: 'p2', type: 'TXT', name: 'default._domainkey.' + D, content: 'v=DKIM1; k=rsa; p=ABC', proxied: false, ttl: 3600 }] });
  const avant = e.records.map(cle).sort(), { code, s } = await lancer(e);
  assert.equal(code, 0, s); assert.match(s, /2 MX, 3 TXT/); assert.match(s, /SPF présent/); assert.match(s, /DKIM présent/); assert.match(s, /mail\.leslanternesdenour\.fr \(A\) est PROXIFIÉ/); assert.equal(e.journal.length, 0); assert.deepEqual(e.records.map(cle).sort(), avant);
  const e2 = etatInitial(); e2.records = e2.records.filter(r => r.type !== 'MX'); const r2 = await lancer(e2); assert.match(r2.s, /AUCUN enregistrement MX/);
});
