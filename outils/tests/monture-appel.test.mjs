// L'appel de la monture (Sablo) à distance : un seul bouton, toujours accessible ; il vient, même de très loin, sans traverser les obstacles ni apparaître devant l'écran.
import test from 'node:test';
import assert from 'node:assert/strict';

const base = { monte: false, sequence: false, venir: false, soin: false, rentre: false, dist: 50, seuilMonter: 4 };

test('appel : quand la monture n\'est pas tout près, le bouton propose « Appeler », à toute distance (même d\'un autre monde, village ↔ Route), sans trou', async () => {
  const { etatAppel } = await import('../../voyage/js/monture-appel.js');
  for (const dist of [4.5, 9, 18, 50, 300, 20000]) assert.deepEqual([etatAppel({ ...base, dist }).mode, etatAppel({ ...base, dist }).label], ['appeler', 'Appeler'], `à ${dist} m`);
});

test('appel : pendant qu\'elle vient, le bouton affiche « Arrive… » (état visuel) et ne lance pas un nouvel appel', async () => {
  const { etatAppel } = await import('../../voyage/js/monture-appel.js');
  const e = etatAppel({ ...base, venir: true }); assert.deepEqual([e.mode, e.label], ['arrive', 'Arrive…']);
  assert.equal(etatAppel({ ...base, venir: true, dist: 2 }).mode, 'arrive', 'tant qu\'elle n\'est pas arrivée, même tout près');
});

test('appel : si la monture est occupée (soins en cours), le jeu l\'explique clairement au lieu de ne rien faire ; tout près, on peut quand même monter', async () => {
  const { etatAppel } = await import('../../voyage/js/monture-appel.js');
  for (const occ of [{ soin: true }]) { const e = etatAppel({ ...base, ...occ }); assert.equal(e.mode, 'indisponible'); assert.ok(e.raison.length > 25 && /Sablo|ta monture|monture/i.test(e.raison), 'explication claire'); assert.equal(e.label, 'Appeler', 'le bouton reste visible'); }
  assert.equal(etatAppel({ ...base, dist: 2, soin: true }).mode, 'monter');
});

test('appel : de très loin, la monture est ramenée à environ 60 m, DERRIÈRE le joueur (hors de l\'écran), sur un terrain praticable ; sinon on essaie d\'autres directions', async () => {
  const { pointDeRenfort } = await import('../../voyage/js/monture-appel.js');
  const J = { x: 1000, z: 26000 }, yaw = 1.2;   // le joueur regarde vers (-sin yaw, -cos yaw) : derrière lui = (sin yaw, cos yaw)
  const p = pointDeRenfort(J, { yaw, distance: 60, acceptable: () => true });
  assert.ok(Math.abs(Math.hypot(p.x - J.x, p.z - J.z) - 60) < 0.01, 'à 60 m');
  const avant = { x: -Math.sin(yaw), z: -Math.cos(yaw) }, v = { x: (p.x - J.x) / 60, z: (p.z - J.z) / 60 };
  assert.ok(v.x * avant.x + v.z * avant.z < -0.9, 'derrière lui : hors du champ de la caméra');
  const q = pointDeRenfort(J, { yaw, distance: 60, acceptable: (x, z) => Math.hypot(x - p.x, z - p.z) > 10 });   // le premier choix est inacceptable (eau, falaise…)
  assert.ok(Math.hypot(q.x - p.x, q.z - p.z) > 10 && Math.abs(Math.hypot(q.x - J.x, q.z - J.z) - 60) < 0.01, 'une autre direction acceptable');
  const r = pointDeRenfort(J, { yaw, distance: 60, acceptable: () => false }); assert.ok(Number.isFinite(r.x) && Number.isFinite(r.z), 'jamais de plantage : un point est toujours rendu');
});

test('appel : branché sur le système de monture EXISTANT (même bouton, même déplacement C.venir), pas de second système', async () => {
  const fs = await import('node:fs');
  const m = fs.readFileSync(new URL('../../voyage/js/main.js', import.meta.url), 'utf8');
  assert.match(m, /import \{ etatAppel, pointDeRenfort \} from '\.\/monture-appel\.js/);
  const i = m.indexOf('function actionChameau'), f = m.slice(i, i + 2300);
  assert.match(f, /etatAppel\(\{ monte, sequence: !!sequence, venir: !!C\.venir, soin: !!soin, rentre: !!C\.rentre/);
  assert.match(f, /e\.mode === 'indisponible'\) \{ montrerIndice\(/); assert.match(f, /e\.mode === 'arrive'\) \{ montrerIndice\(/);
  assert.match(f, /if \(d > 120\)/); assert.match(f, /pointDeRenfort\(J, \{ yaw: cam\.yaw/); assert.match(f, /bouger\(C, 0, 0, 1\.1/); assert.match(f, /C\.venir = true/);
  assert.match(m, /const eA = etatAppel\(/); assert.match(m, /classList\.toggle\('arrive', eA\.mode === 'arrive'\)/); assert.match(m, /dist > 40 \? 11/);
  assert.equal((m.match(/new Chameau/g) || []).length <= 2, true, 'aucun nouveau modèle de monture créé');
});

test('appel : si la monture rentre toute seule à l\'écurie, on peut la rappeler (l\'appel annule son retour) ; seuls les soins en cours la rendent indisponible', async () => {
  const { etatAppel } = await import('../../voyage/js/monture-appel.js');
  assert.equal(etatAppel({ ...base, rentre: true }).mode, 'appeler');
  assert.equal(etatAppel({ ...base, soin: true }).mode, 'indisponible');
});
