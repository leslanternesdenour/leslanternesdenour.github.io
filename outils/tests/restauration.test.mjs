// Exercice de restauration de la base des comptes, de bout en bout, sur des données créées par le VRAI code (émulateur local) :
// export → gzip + chiffrement age (clé publique) → déchiffrement (clé privée) → import dans une base VIDE → comparaison
// → l'API relit la base restaurée et donne exactement les mêmes droits et les mêmes profils.   node --test outils/tests/restauration.test.mjs
import test from 'node:test'; import assert from 'node:assert/strict';
import { execFileSync } from 'child_process'; import fs from 'fs'; import os from 'os'; import path from 'path'; import zlib from 'zlib';
import { creerEmulateur } from '../emulateur/emulateur.mjs';
import { exporter, importer, comparer } from '../sauvegarde/restauration.mjs';
import { traiter } from '../../serveur/api.js';
import { baseMemoire } from '../../serveur/base-memoire.js';
import { creerSession } from '../../serveur/session.js';

const O = 'http://local';
const emu = await creerEmulateur({ mdpCreateur: 'createur-test-123' });
const cookies = {};
async function appel(qui, m, chemin, corps) {
  const r = await emu.traiter(new Request(O + chemin, { method: m, headers: { 'X-LDN': '1', 'Content-Type': 'application/json', ...(cookies[qui] ? { Cookie: cookies[qui] } : {}) }, body: corps ? JSON.stringify(corps) : undefined }));
  const sc = r.headers.get('Set-Cookie'); if (sc) cookies[qui] = sc.split(';')[0];
  return { s: r.status, j: await r.json() };
}
async function compte(qui, email, { creer = true, mdp = 'motdepasse-1' } = {}) {
  const t = (await appel(qui, 'POST', '/api/_emulateur/' + (creer ? 'inscription' : 'connexion'), { email, mdp })).j.idToken;
  assert.equal((await appel(qui, 'POST', '/api/session', { idToken: t, consentements: { parent: true, cgu: true, confidentialite: true } })).s, 200);
  await appel(qui, 'POST', '/api/_emulateur/verifier', {});
  const t2 = (await appel(qui, 'POST', '/api/_emulateur/jeton', {})).j.idToken; await appel(qui, 'POST', '/api/session', { idToken: t2 });
}

test('restauration complète et chiffrée, relue par l\'API', async () => {
  // ---- données réalistes produites par le vrai code ----
  await compte('c', 'createur@local.test', { creer: false, mdp: 'createur-test-123' });
  for (let i = 0; i < 7; i++) await appel('c', 'POST', '/api/enfants', { surnom: 'Enfant ' + 'ABCDEFG'[i], tranche: '6-10', avatar: 'fille' });
  await compte('a', 'a@local.test');
  const pay = (await appel('a', 'POST', '/api/paiement/session', { formule: 'famille_annuel', consentements: { cgv: true, executionImmediate: true } })).j;
  await appel('a', 'POST', '/api/_emulateur/paiement', { session: new URL(pay.url, O).searchParams.get('session'), action: 'payer' });
  for (const s of ['Lina', 'Yanis', 'Sara']) { const r = await appel('a', 'POST', '/api/enfants', { surnom: s, tranche: '3-5', avatar: 'garcon' }); assert.equal(r.s, 201); }
  const lina = (await appel('a', 'GET', '/api/enfants')).j.enfants[0].id;
  assert.equal((await appel('a', 'PUT', `/api/enfants/${lina}/progression`, { progression: { ablutions: { g1: 3, g2: 2 }, priere: { etape: 4 } } })).s, 200);
  const inv = (await appel('c', 'POST', '/api/admin/invitations', { email: 'b@local.test', niveau: 'premium', dureeJours: 30 })).j;
  await compte('b', 'b@local.test');
  assert.equal((await appel('b', 'POST', '/api/invitations/activer', { code: new URL(inv.lien).searchParams.get('invite') })).s, 200);
  await appel('c', 'POST', '/api/admin/invitations', { email: 'jamais@local.test', niveau: 'famille', dureeJours: null });
  await appel('c', 'POST', '/api/admin/catalogue', { groupe: 'maisons', id: 'sons', niveau: 'premium' });
  await appel('c', 'POST', '/api/admin/bandeau', { texte: 'Ramadan moubarak' });

  // ---- export → gzip → age (clé publique) ----
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-rest-'));
  try {
    const original = await exporter(emu.base);
    assert.equal(original.compte.familles, 3); assert.equal(original.compte[`familles/${'uid-createur-local'}/enfants`], 7);
    assert.ok(original.compte.abonnements === 1 && original.compte.acces_offerts === 1 && original.compte.invitations === 2 && original.compte.admin_logs > 3);
    execFileSync('age-keygen', ['-o', path.join(dossier, 'cle.txt')], { stdio: 'ignore' });
    const pub = execFileSync('age-keygen', ['-y', path.join(dossier, 'cle.txt')]).toString().trim();
    const chiffre = execFileSync('age', ['-r', pub], { input: zlib.gzipSync(JSON.stringify(original)) });
    assert.ok(!chiffre.includes(Buffer.from('a@local.test')), 'la sauvegarde est illisible sans la clé');
    // ---- déchiffrement (clé privée) → import dans une base VIDE ----
    const relu = JSON.parse(zlib.gunzipSync(execFileSync('age', ['-d', '-i', path.join(dossier, 'cle.txt')], { input: chiffre })));
    const restauree = baseMemoire();
    const n = await importer(restauree, relu);
    assert.equal(n, Object.values(original.compte).reduce((a, b) => a + b, 0));
    assert.deepEqual(comparer(original, await exporter(restauree)), [], 'base restaurée identique document par document');
    await assert.rejects(importer(restauree, relu), /non vide/, 'jamais d\'import par-dessus une base existante');

    // ---- l'API relit la base restaurée : mêmes droits, mêmes profils, même progression ----
    const ctx = base => ({ env: emu.env, base, maintenant: Date.now(), auth: {}, stockage: { get: async () => null }, stripe: null });
    for (const [uid, f] of Object.entries(original.collections.familles)) {
      const cookie = 'ldn_session=' + await creerSession({ uid, email: f.email, emailVerifie: true, role: uid === emu.env.CREATOR_UID ? 'creator' : undefined, authTime: Math.floor(Date.now() / 1000) }, emu.env.SESSION_SECRET);
      const lire = async (base, chemin) => (await traiter(new Request(O + chemin, { headers: { Cookie: cookie } }), ctx(base))).json();
      assert.deepEqual(await lire(restauree, '/api/moi'), await lire(emu.base, '/api/moi'), 'droits identiques pour ' + f.email);
      assert.deepEqual(await lire(restauree, '/api/enfants'), await lire(emu.base, '/api/enfants'), 'profils identiques pour ' + f.email);
    }
    const uidA = Object.entries(original.collections.familles).find(([, f]) => f.email === 'a@local.test')[0];
    const cA = 'ldn_session=' + await creerSession({ uid: uidA, email: 'a@local.test', emailVerifie: true, authTime: Math.floor(Date.now() / 1000) }, emu.env.SESSION_SECRET);
    const p = await (await traiter(new Request(O + '/api/enfants/' + lina, { headers: { Cookie: cA } }), ctx(restauree))).json();
    assert.deepEqual(p.progression, { ablutions: { g1: 3, g2: 2 }, priere: { etape: 4 } }, 'progression de Lina restaurée');
    const moiB = await (await traiter(new Request(O + '/api/catalogue'), ctx(restauree))).json();
    assert.equal(moiB.bandeau, 'Ramadan moubarak'); assert.equal(moiB.catalogue.maisons.sons.niveau, 'premium');

    // ---- la comparaison détecte bien les écarts ----
    await restauree.maj('familles', uidA, { email: 'pirate@x.fr' }); await restauree.supprimer('droits', uidA);
    const d = comparer(original, await exporter(restauree));
    assert.deepEqual(d.map(x => x.type).sort(), ['different', 'manquant']);
  } finally { fs.rmSync(dossier, { recursive: true, force: true }); }
});
