// Conseil IA : chaque mission est classée (domaine, complexité) puis confiée au bon nombre de modèles, selon des critères écrits.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';

const orientation = () => import('../conseil-ia/lib/orientation.mjs');
export const config = () => JSON.parse(fs.readFileSync(new URL('./conseil-ia-config-trois.json', import.meta.url), 'utf8'));

test('classement : le domaine et la complexité viennent de signaux écrits et expliqués', async () => {
  const { classer } = await orientation(); const c = config();
  const cas = (mission, extra = {}) => { const r = classer({ mission, fichiers: [], taille: 500, images: 0, ...extra }, c); return [r.domaine, r.complexite]; };
  assert.deepEqual(cas('Corriger une faute de frappe dans un titre'), ['redaction', 'petite']);
  assert.deepEqual(cas('Le bouton déborde sur la capture mobile', { images: 1 }), ['visuel', 'moyenne']);
  assert.deepEqual(cas('Vérifier les faits historiques sur La Mecque et le Hajj'), ['histoire', 'moyenne']);
  assert.deepEqual(cas('Sécurité : le paiement Stripe peut-il être contourné ?'), ['securite', 'critique']);
  assert.deepEqual(cas('Régression : le son ne démarre plus', { taille: 50_000 }), ['code', 'complexe']);
  assert.deepEqual(cas('Quelque chose', { fichiers: ['functions/api/compte.js'] }), ['securite', 'critique']);
  assert.deepEqual(cas('Sécurité du paiement', { domaine: 'tests', complexite: 'petite' }), ['tests', 'petite']);
  assert.ok(classer({ mission: 'paiement', fichiers: [], taille: 1, images: 0 }, c).signaux.some(s => /paiement/.test(s)));
});

test('choix : sans mesures les modèles tournent, avec mesures le meilleur taux vérifié l\'emporte ; un seul modèle pour une petite tâche, deux et un arbitre si c\'est critique', async () => {
  const { planifier } = await orientation(); const c = config(), tous = ['claude', 'gpt', 'gemini'];
  const plan = (complexite, extra = {}) => planifier({ domaine: 'code', complexite }, { candidats: tous, mesures: {}, ...extra }, c);
  assert.deepEqual([plan('moyenne').analystes, plan('moyenne').arbitre, plan('petite').profil, plan('moyenne').mode], [['gpt'], null, 'economique', 'exploration']);
  const rotation = plan('moyenne', { mesures: { gpt: { missions: 2, confirmes: 0, rejetes: 0 }, claude: { missions: 1, confirmes: 0, rejetes: 0 } } });
  assert.deepEqual(rotation.analystes, ['gemini'], 'le moins sollicité passe d\'abord');
  assert.deepEqual([plan('critique').analystes, plan('critique').arbitre, plan('critique').profil], [['gpt', 'claude'], 'gemini', 'approfondi']);
  const mesures = { gpt: { missions: 9, confirmes: 3, rejetes: 6 }, claude: { missions: 9, confirmes: 5, rejetes: 4 }, gemini: { missions: 9, confirmes: 8, rejetes: 1 } };
  assert.deepEqual([plan('complexe', { mesures }).analystes, plan('complexe', { mesures }).mode], [['gemini', 'claude'], 'mesures']);
  assert.match(plan('moyenne', { mesures }).raisons.join(' '), /gemini : 8 confirmés sur 9/);
  assert.deepEqual(plan('critique', { auteur: 'claude' }).analystes, ['gpt', 'gemini'], 'un modèle ne relit pas son propre travail');
  const seul = planifier({ domaine: 'code', complexite: 'critique' }, { candidats: ['claude'], mesures: {} }, c);
  assert.deepEqual([seul.analystes, seul.arbitre], [['claude'], null]); assert.match(seul.raisons.join(' '), /second avis impossible/);
  assert.deepEqual(planifier({ domaine: 'code', complexite: 'moyenne' }, { candidats: [], mesures: {} }, c).analystes, []);
});
