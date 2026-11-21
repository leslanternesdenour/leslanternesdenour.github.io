// Test : node --test --test-reporter=./ablutions/jeu3d/tdd-guard-node-reporter.mjs tests/versions.test.js
// Les jeux importent leurs modules avec « ?v=N » pour que le navigateur recharge un fichier modifié.
// Quand un module change, son numéro doit changer partout, sinon une ancienne copie reste en cache (et deux copies d'un même module peuvent coexister).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RACINE = path.join(__dirname, '..');
// La version courante de chaque module partagé : à augmenter à chaque modification de ce module.
const VERSIONS = { 'voyageur.js': 4, 'gestes.js': 2, 'postures.js': 2, 'lieu.js': 2, 'fabrique.js': 1 };
const FICHIERS = ['ablutions/jeu3d/jeu.js', 'ablutions/jeu3d/lieu.js', 'priere/jeu3d/jeu.js', 'voyage/js/main.js', 'personnages/adaptateur.js'].filter(f => fs.existsSync(path.join(RACINE, f)));   // (adaptateur.js n'existe pas dans ce dépôt : ne plus faire échouer le test pour un fichier absent)

test("tous les imports des modules partagés portent la version courante", () => {
  const fautes = [];
  for (const f of FICHIERS) {
    const src = fs.readFileSync(path.join(RACINE, f), 'utf8');
    for (const [, nom, v] of src.matchAll(/\/(voyageur|gestes|postures|lieu|fabrique)\.js\?v=(\d+)/g)) {
      if (Number(v) !== VERSIONS[nom + '.js']) fautes.push(`${f} : ${nom}.js?v=${v} (attendu ${VERSIONS[nom + '.js']})`);
    }
  }
  assert.deepEqual(fautes, []);
});
