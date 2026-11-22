// Comparaison de l'ancienne zone OVH et de la zone importée dans Cloudflare : un enregistrement de messagerie oublié doit être DÉTECTÉ.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import { spawnSync } from 'node:child_process';
import { lireZone, comparer } from '../migration/comparer-zones.mjs';
const D = 'leslanternesdenour.fr', ovh = fs.readFileSync('outils/tests/donnees-zones/ovh.txt', 'utf8'), cf = fs.readFileSync('outils/tests/donnees-zones/cloudflare-incomplet.txt', 'utf8');
test('lecture OVH : noms hérités, @ et relatifs, MX avec priorité, TXT multi-morceaux recollés, SOA sur plusieurs lignes', () => {
  const z = lireZone(ovh, D), q = (t, n) => z.filter(r => r.type === t && r.nom === n);
  assert.equal(q('A', D).length, 2); assert.equal(q('MX', D).length, 2); assert.deepEqual(q('MX', D).map(r => r.priorite).sort(), [1, 5]);
  assert.equal(q('CNAME', 'www.' + D)[0].contenu, 'leslanternesdenour.github.io'); assert.equal(q('CNAME', 'autoconfig.' + D)[0].contenu, 'mailconfig.ovh.net');
  assert.equal(q('TXT', 'ovhmo123-selector._domainkey.' + D)[0].contenu, 'v=DKIM1; k=rsa; p=AAAABBBB', 'morceaux de TXT recollés'); assert.ok(z.some(r => r.type === 'SOA'));
});
test('lecture Cloudflare (export BIND avec commentaires, TTL, noms absolus)', () => {
  const z = lireZone(cf, D); assert.equal(z.filter(r => r.type === 'MX').length, 1); assert.equal(z.find(r => r.type === 'CNAME').nom, 'www.' + D); assert.equal(z.filter(r => r.type === 'NS').length, 2);
});
test('comparaison : les enregistrements MANQUANTS dont la MESSAGERIE sont détectés ; SOA/NS ignorés ; un enregistrement en plus n\'est qu\'une information', () => {
  const r = comparer(lireZone(ovh, D), lireZone(cf, D), D), cles = r.manquants.map(x => `${x.type} ${x.nom}`).sort();
  assert.deepEqual(cles, ['CNAME autoconfig.' + D, 'MX ' + D, 'TXT ovhmo123-selector._domainkey.' + D], JSON.stringify(cles));
  assert.equal(r.manquantsMessagerie.length, 3, 'MX manquant + DKIM + autoconfig = messagerie');
  assert.ok(!r.manquants.some(x => x.type === 'SOA' || x.type === 'NS'));
});
test('zones identiques (sauf SOA/NS) : rien ne manque, code de sortie 0 ; zone incomplète : code 1 avec avertissement messagerie', () => {
  fs.writeFileSync('/tmp/cf-complet.txt', cf + 'leslanternesdenour.fr.\t1\tIN\tMX\t5 mx1.mail.ovh.net.\novhmo123-selector._domainkey.leslanternesdenour.fr.\t1\tIN\tTXT\t"v=DKIM1; k=rsa; p=AAAA" "BBBB"\nautoconfig.leslanternesdenour.fr.\t1\tIN\tCNAME\tmailconfig.ovh.net.\n');
  const ok = spawnSync('node', ['outils/migration/comparer-zones.mjs', 'outils/tests/donnees-zones/ovh.txt', '/tmp/cf-complet.txt'], { encoding: 'utf8' }); assert.equal(ok.status, 0, ok.stdout); assert.match(ok.stdout, /Aucun enregistrement de l'ancienne zone ne manque/);
  const ko = spawnSync('node', ['outils/migration/comparer-zones.mjs', 'outils/tests/donnees-zones/ovh.txt', 'outils/tests/donnees-zones/cloudflare-incomplet.txt'], { encoding: 'utf8' }); assert.equal(ko.status, 1); assert.match(ko.stdout, /3 enregistrement\(s\) de l'ancienne zone ABSENT/); assert.match(ko.stdout, /DONT 3 de MESSAGERIE/); assert.match(ko.stdout, /MX/);
});
