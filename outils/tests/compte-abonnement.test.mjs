// Espace famille : au retour du paiement, la page demande au serveur de vérifier la session chez Stripe et active l'abonnement tout de suite.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = () => fs.readFileSync(new URL('../../compte/index.html', import.meta.url), 'utf8');

test('au retour du paiement (?paiement=ok&session_id=…), la page fait vérifier la session par le serveur et affiche l\'activation', () => {
  const h = page();
  assert.match(h, /if \(params\.get\('paiement'\) === 'ok'\) await confirmerPaiement\(\);/);
  assert.match(h, /async function confirmerPaiement\(\)/);
  assert.match(h, /\/api\/abonnement\/synchroniser/);
  assert.match(h, /params\.get\('session_id'\)/);
  assert.match(h, /Votre abonnement est activé/);
});

test('« Ma formule » signale un paiement à régulariser (avec accès à la mise à jour de la carte) et une résiliation programmée', () => {
  const h = page();
  assert.match(h, /const aRegulariser = !!\(D\.abonnement && D\.abonnement\.aRegulariser\);/);
  assert.match(h, /Le dernier paiement a échoué/);
  assert.match(h, /\$\('off-portail'\)\.classList\.toggle\('cache', !\(D\.payant \|\| aRegulariser\)\);/);
  assert.match(h, /Résiliation programmée/);
});

test('à chaque ouverture de l\'Espace famille, un abonné voit son état à jour (renouvellement, résiliation ou carte modifiée chez Stripe), sans dépendre du webhook', () => {
  const h = page();
  assert.match(h, /else await rafraichirAbonnement\(\);/);
  assert.match(h, /async function rafraichirAbonnement\(\)/);
  assert.match(h, /if \(!D\.emailVerifie \|\| !D\.abonnement\) return;/);
  assert.match(h, /if \(r\.niveau !== D\.niveau \|\| r\.statut !== D\.statut\) D = await C\.moi\(\);/);
});

test('un parent dont le paiement n\'apparaît pas (autre appareil, page rechargée) a un bouton « J\'ai déjà payé » qui interroge le serveur, avec un message clair si rien n\'est trouvé', () => {
  const h = page();
  assert.match(h, /id="off-verifier"/);
  assert.match(h, /\$\('off-verifier'\)\.classList\.toggle\('cache', D\.statut !== 'gratuit' \|\| aRegulariser\);/);
  assert.match(h, /\$\('off-verifier'\)\.onclick = e => occupe\(e\.target, async \(\) => \{[^}]*\/api\/abonnement\/synchroniser/);
  const c = fs.readFileSync(new URL('../../compte/client.js', import.meta.url), 'utf8');
  assert.match(c, /'aucun-abonnement': 'Aucun paiement trouvé pour ce compte/);
});
