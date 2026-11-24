// La validation des récits et des lieux religieux par le créateur : un seul interrupteur, tracé (qui, quand), qui pilote les statuts, les étiquettes et les voix.
import test from 'node:test';
import assert from 'node:assert/strict';

test('validation : le créateur a validé les récits et les lieux (qui, quand) ; tout statut suit l\'interrupteur unique ; aucune référence n\'est inventée', async () => {
  const { VALIDATION, STATUT_VALIDE } = await import('../../voyage/js/route/validation-contenu.js');
  const { RECITS, STATUT } = await import('../../voyage/js/route/recits-a-valider.js');
  const { LIEUX_SACRES } = await import('../../voyage/js/route/lieux-mecque-a-valider.js');
  assert.deepEqual([VALIDATION.valide, VALIDATION.par], [true, 'le créateur']); assert.match(VALIDATION.date, /^2026-11-24$/); assert.equal(STATUT_VALIDE, 'VALIDÉ');
  assert.equal(STATUT, STATUT_VALIDE);
  for (const r of RECITS) assert.equal(r.statut, STATUT_VALIDE, r.id);
  for (const [id, l] of Object.entries(LIEUX_SACRES)) assert.equal(l.statut, STATUT_VALIDE, id);
  for (const r of RECITS) for (const s of r.sources) assert.ok(s.verifie === false || s.verifie === undefined || s.ref, `${r.id} : aucune référence inventée (une référence reste « à vérifier » tant qu'elle n'est pas confirmée)`);
});

test('récit : l\'histoire se lit à voix haute (automatiquement à l\'ouverture du récit et de l\'activité, bouton pour réécouter), avec la narratrice ; plus de bouton grisé « disponible après validation »', async () => {
  const fs = await import('node:fs');
  const u = fs.readFileSync(new URL('../../voyage/js/route/recit-ui.js', import.meta.url), 'utf8');
  assert.ok(!/Disponible après validation/.test(u), 'le bouton n\'est plus grisé');
  assert.match(u, /const lireRecit = \(\) => dire\(r\.enonces\.map\(x => \(\{ t: grand \? x\.grand : x\.petit \}\)\)\)/);
  assert.match(u, /id="rr-ecouter"/); assert.match(u, /id="rr-reecouter"/);
  assert.match(u, /if \(nom === 'recit'\) lireRecit\(\)/); assert.match(u, /if \(nom === 'activite'\) dire\(\[\{ t: grand \? r\.activite\.consigne_grand : r\.activite\.consigne_petit \}\]\)/);
});
