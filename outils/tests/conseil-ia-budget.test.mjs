// Conseil IA : les dépenses sont estimées, plafonnées et enregistrées hors du dépôt.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

const budget = () => import('../conseil-ia/lib/budget.mjs');

test('budget : le coût d\'un appel suit le tarif au million de jetons', async () => {
  const { coutUSD } = await budget();
  assert.equal(coutUSD({ entree: 2, sortie: 10 }, 100_000, 16_000), 0.36);
});

export const limites = { parAppelUSD: 0.5, parJourUSD: 1, parMoisUSD: 3, appelsParJourParAgent: 3 };
export const dossier = () => fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-budget-'));
export const horloge = iso => () => new Date(iso);

test('budget : un appel est réservé au coût maximal puis soldé au coût réel, et le registre survit au redémarrage', async () => {
  const { creerRegistre } = await budget();
  const d = dossier(), maintenant = horloge('2026-11-26T10:00:00Z');
  const registre = creerRegistre(d, limites, maintenant);
  const id = registre.reserver({ agent: 'gpt', modele: 'm', coutMax: 0.4 });
  assert.deepEqual(registre.resume(), { jour: { coutUSD: 0.4, appels: { gpt: 1 } }, mois: { coutUSD: 0.4 } });
  registre.solder(id, { coutUSD: 0.05, statut: 'ok' });
  assert.deepEqual(creerRegistre(d, limites, maintenant).resume(), { jour: { coutUSD: 0.05, appels: { gpt: 1 } }, mois: { coutUSD: 0.05 } });
});

test('budget : un appel dont le coût maximal dépasse le plafond par appel est refusé sans rien enregistrer', async () => {
  const { creerRegistre } = await budget(); const { Refus } = await import('../conseil-ia/lib/garde.mjs');
  const registre = creerRegistre(dossier(), limites, horloge('2026-11-26T10:00:00Z'));
  assert.throws(() => registre.reserver({ agent: 'gpt', modele: 'm', coutMax: 0.51 }), e => e instanceof Refus && /par appel/.test(e.message));
  assert.equal(registre.resume().jour.coutUSD, 0);
});

test('budget : les plafonds cumulés (jour, mois, nombre d\'appels par agent) bloquent l\'appel suivant', async () => {
  const { creerRegistre } = await budget();
  const d = dossier(), a = jour => creerRegistre(d, limites, horloge(`2026-11-${jour}T10:00:00Z`));
  const prendre = (jour, agent, coutMax) => a(jour).reserver({ agent, modele: 'm', coutMax });
  prendre('24', 'gpt', 0.5); prendre('24', 'gemini', 0.5);
  assert.throws(() => prendre('24', 'gpt', 0.1), /plafond du jour/);
  prendre('25', 'gpt', 0.5); prendre('25', 'gpt', 0.5); prendre('26', 'gpt', 0.5); prendre('26', 'gpt', 0.5);
  assert.throws(() => prendre('27', 'gpt', 0.1), /plafond du mois/);
  for (let i = 0; i < 3; i++) creerRegistre(d, limites, horloge('2026-12-01T10:00:00Z')).reserver({ agent: 'gpt', modele: 'm', coutMax: 0.01 });
  const decembre = creerRegistre(d, limites, horloge('2026-12-01T11:00:00Z'));
  assert.throws(() => decembre.reserver({ agent: 'gpt', modele: 'm', coutMax: 0.01 }), /3 appels par jour/);
  assert.ok(decembre.reserver({ agent: 'gemini', modele: 'm', coutMax: 0.01 }));
});

test('budget : un registre illisible bloque les appels au lieu de repartir de zéro', async () => {
  const { creerRegistre } = await budget(); const { Refus } = await import('../conseil-ia/lib/garde.mjs');
  const d = dossier(); fs.writeFileSync(path.join(d, 'registre.json'), '{abîmé');
  assert.throws(() => creerRegistre(d, limites).reserver({ agent: 'gpt', modele: 'm', coutMax: 0.1 }), e => e instanceof Refus && /registre illisible/.test(e.message));
  assert.equal(fs.readFileSync(path.join(d, 'registre.json'), 'utf8'), '{abîmé');
});

test('budget : un verrou tenu par un autre processus bloque l\'écriture ; un verrou abandonné est repris', async () => {
  const { creerRegistre } = await budget();
  const d = dossier(), verrou = path.join(d, 'registre.verrou'); fs.writeFileSync(verrou, '');
  const registre = creerRegistre(d, limites, undefined, { attenteMs: 100, abandonMs: 30_000 });
  assert.throws(() => registre.reserver({ agent: 'gpt', modele: 'm', coutMax: 0.1 }), /registre occupé/);
  const ancien = new Date(Date.now() - 60_000); fs.utimesSync(verrou, ancien, ancien);
  assert.ok(registre.reserver({ agent: 'gpt', modele: 'm', coutMax: 0.1 }));
  assert.equal(fs.existsSync(verrou), false);
});
