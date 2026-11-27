// Sauvegarde chiffrée : base fictive → export → gzip → age → relecture avec la clé privée. Aucune vraie donnée, aucune écriture hors mémoire.
// Sauté (et dit clairement) si la bibliothèque age-encryption n'est pas installée (LDN_MODULES ou npm i age-encryption).
import test from 'node:test'; import assert from 'node:assert/strict';
import { baseMemoire } from '../../serveur/base-memoire.js';
import { trouverBibliotheque, nouvelleCle, dechiffrer } from '../sauvegarde/age-js.mjs';
import { preparerSauvegarde, nomFichier } from '../sauvegarde/sauvegarder.mjs';
import { exporter, importer, comparer } from '../sauvegarde/restauration.mjs';

const dispo = !!trouverBibliotheque();
const options = dispo ? {} : { skip: 'age-encryption non installé (npm i age-encryption, ou LDN_MODULES)' };

async function baseFictive() {
  const b = baseMemoire();
  for (let i = 0; i < 40; i++) {
    await b.ecrire('familles', 'u' + i, { creeLe: 1763550000000 + i, consentements: { cgu: '2026-11-19', parent: true } });
    await b.ecrire(`familles/u${i}/enfants`, 'e0', { surnom: 'Enfant' + i, tranche: '3-5', progression: { priere: { learn: 1 } } });
    await b.ecrire('droits', 'u' + i, { statut: 'gratuit', niveau: 'gratuit' });
  }
  await b.ecrire('droits', 'uCreateur', { statut: 'creator', niveau: 'createur' });
  return b;
}

test('nom de fichier daté, sans caractère interdit sous Windows', () => {
  assert.equal(nomFichier(new Date('2026-11-27T20:05:09Z')), 'firestore-2026-11-27-20-05.json.gz.age');
});

test('sauvegarde chiffrée : illisible sans clé, restaurée à l\'identique avec la clé privée', options, async () => {
  const { identite, recipient } = await nouvelleCle();
  assert.match(recipient, /^age1[0-9a-z]+$/); assert.match(identite, /^AGE-SECRET-KEY-1/);
  const base = await baseFictive(), s = await preparerSauvegarde(base, recipient, { maintenant: Date.parse('2026-11-27T20:05:00Z') });
  assert.equal(s.compte.familles, 40); assert.equal(s.compte.droits, 41); assert.equal(s.compte['familles/u3/enfants'], 1);
  assert.match(s.sha256, /^[0-9a-f]{64}$/);
  assert.ok(!s.octets.toString('latin1').includes('uCreateur') && !s.octets.toString('latin1').includes('Enfant1'), 'le fichier ne doit rien laisser lire');
  const relu = JSON.parse((await dechiffrer(s.octets, identite)).toString());
  assert.equal(comparer(relu, await exporter(base, { maintenant: 0 })).length, 0, 'identique à la base');
  // restauration complète dans une base vide
  const vide = baseMemoire(); assert.equal(await importer(vide, relu), 40 * 3 + 1);
  assert.equal(comparer(relu, await exporter(vide)).length, 0);
});

test('mauvaise clé refusée, fichier altéré refusé', options, async () => {
  const { recipient } = await nouvelleCle(), autre = await nouvelleCle();
  const s = await preparerSauvegarde(await baseFictive(), recipient);
  await assert.rejects(() => dechiffrer(s.octets, autre.identite));
  const alt = Buffer.from(s.octets); alt[alt.length - 20] ^= 0xff;
  const encoreUne = await nouvelleCle();
  await assert.rejects(() => dechiffrer(alt, encoreUne.identite));
});

test('la sauvegarde ne modifie jamais la base source', options, async () => {
  const { recipient } = await nouvelleCle(), base = await baseFictive(), avant = JSON.stringify([...base._donnees.entries()]);
  await preparerSauvegarde(base, recipient); assert.equal(JSON.stringify([...base._donnees.entries()]), avant);
});