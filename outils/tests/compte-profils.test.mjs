// Espace famille : le parent peut modifier un profil (prénom, tranche d'âge, personnage) et consulter la progression de chaque enfant.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = () => fs.readFileSync(new URL('../../compte/index.html', import.meta.url), 'utf8');

test('espace famille : chaque profil a un bouton Modifier qui enregistre prénom, tranche d\'âge et personnage', () => {
  const h = page();
  assert.match(h, /textContent = 'Modifier'/);
  assert.match(h, /methode: 'PATCH', corps: \{ surnom:/);
  assert.match(h, /'\/api\/enfants\/' \+ x\.id/);
});

test('espace famille : chaque profil a un bouton Progression qui affiche un résumé lisible (étoiles, lanternes, jeux, voyage)', () => {
  const h = page();
  assert.match(h, /progression-resume\.js/);
  assert.match(h, /textContent = 'Progression'/);
  assert.match(h, /ProgressionResume\.resume\(/);
});

test('espace famille : le texte sur la sauvegarde est le même pour toutes les formules (plus de « réservée à Famille »)', () => {
  const h = page();
  assert.ok(!/fait partie de la formule Famille/.test(h));
  assert.match(h, /enregistrée automatiquement dans le compte/);
});

test('espace famille : si l\'appareil garde une ancienne progression, le parent est prévenu qu\'elle sera ajoutée au premier profil choisi (aucune perte, aucun doublon)', () => {
  const h = page();
  assert.match(h, /ajoutée au premier profil choisi/);
  assert.match(h, /CLES_JEU\.some\(/);
});
