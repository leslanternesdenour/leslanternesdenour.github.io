// Grand Voyage : un bouton « Missions » en haut de l'écran ouvre les missions du jour et les lanternes cachées (rien de permanent à l'écran). node --test outils/tests/voyage-bouton-missions.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../../voyage/index.html', import.meta.url), 'utf8');

test('la barre du haut du Grand Voyage a un bouton Missions, à côté du carnet et des réglages', () => {
  const groupe = html.split('class="groupe-droite"')[1].split('</div>')[0];
  assert.match(groupe, /id="btn-missions"/);
  assert.ok(groupe.indexOf('id="btn-missions"') < groupe.indexOf('id="btn-carnet"'), 'le bouton Missions précède le carnet');
});

test("le bouton Missions ouvre le carnet sur l'onglet des missions", () => {
  const main = fs.readFileSync(new URL('../../voyage/js/main.js', import.meta.url), 'utf8');
  assert.match(main, /\$\('btn-missions'\)\.addEventListener\('click', \(\) => ouvrirCarnet\('missions'\)\)/);
});
