// La carte du pays de Nour montre le chemin vers La Mecque : tracé, destination et verrou (affichage, découverte et accès restent séparés).
import test from 'node:test'; import assert from 'node:assert/strict';

test('carte du pays : le lieu « La Mecque » est au seuil de la grande route, avec le chemin existant depuis le village', async () => {
  const { lieuVersLaMecque } = await import('../../voyage/js/route/carte-pays-route.js');
  const { CHEMINS } = await import('../../voyage/js/terrain.js?v=3');
  const { SORTIE_VILLAGE, SEUIL_VILLAGE } = await import('../../voyage/js/route/donnees.js');
  const l = lieuVersLaMecque({ chemin: CHEMINS[0], ouverte: false, explication: 'Encore fermé.' });
  assert.match(l.nom, /La Mecque/);
  assert.deepEqual([l.x, l.z], [SEUIL_VILLAGE.x, SEUIL_VILLAGE.z]);
  // du village jusqu'à l'embranchement (chemin de l'oasis), puis la piste de sortie : aucun point nouveau
  assert.deepEqual(l.trace, [[0, 0], [40, 6], ...SORTIE_VILLAGE]);
});

test('carte du pays : le lieu est toujours montré (marqueur dessinable), le verrou ne dépend que de l\'ouverture de la Route', async () => {
  const { lieuVersLaMecque } = await import('../../voyage/js/route/carte-pays-route.js');
  const { CHEMINS } = await import('../../voyage/js/terrain.js?v=3');
  const ferme = lieuVersLaMecque({ chemin: CHEMINS[0], ouverte: false, explication: 'Encore fermé.' });
  const ouvert = lieuVersLaMecque({ chemin: CHEMINS[0], ouverte: true, explication: 'Encore fermé.' });
  for (const l of [ferme, ouvert]) {
    assert.equal(l.id, 'route'); assert.equal(l.cat, 'passage'); assert.equal(l.icone, '🕋');
    assert.equal(l.connu, true, 'jamais un « lieu inconnu »'); assert.equal(l.grand, true, 'nom toujours écrit'); assert.equal(l.rayon, 5);
  }
  assert.equal(ferme.verrou, 'Encore fermé.'); assert.equal(ouvert.verrou, null);
});

test('carte du pays : la fiche annonce La Mecque et la Kaaba au bout de la route, à la distance réelle de « cite-place »', async () => {
  const { lieuVersLaMecque } = await import('../../voyage/js/route/carte-pays-route.js');
  const { CHEMINS } = await import('../../voyage/js/terrain.js?v=3');
  const l = lieuVersLaMecque({ chemin: CHEMINS[0], ouverte: true });
  assert.match(l.texte, /La Mecque/); assert.match(l.texte, /Kaaba/);
  assert.match(l.texte, /5,6 km/, 'cite-place est à 5606 m sur la grande route');
});

test('carte du pays : le jeu ajoute « La Mecque » à la carte, avec l\'état réel d\'ouverture', async () => {
  const main = (await import('node:fs')).readFileSync(new URL('../../voyage/js/main.js', import.meta.url), 'utf8');
  assert.match(main, /if \(route\) L\.push\(lieuVersLaMecque\(\{ chemin: CHEMINS\[0\], ouverte: regions\.ouverte\('route'\), explication: regions\.explication\('route'\) \}\)\)/, 'le lieu n\'est pas ajouté à lieuxCarte()');
});

test('carte du pays : « Voir toute la route » ferme la carte du pays puis ouvre la grande route', async () => {
  const { voirTouteLaRoute } = await import('../../voyage/js/route/carte-pays-route.js');
  assert.equal(typeof voirTouteLaRoute, 'function', 'voirTouteLaRoute n\'existe pas');
  const suite = [];
  voirTouteLaRoute({ fermerCarte: () => suite.push('ferme'), route: { ouvrirCarte: () => suite.push('route') }, plusTard: f => f() });
  assert.deepEqual(suite, ['ferme', 'route']);
});

test('carte du pays : dans le jeu, la fiche sait ouvrir la grande route (api.voirRoute de la carte)', async () => {
  const main = (await import('node:fs')).readFileSync(new URL('../../voyage/js/main.js', import.meta.url), 'utf8');
  assert.match(main, /voirRoute: \(\) => voirTouteLaRoute\(\{ fermerCarte, route \}\)/, 'api.voirRoute n\'est pas branché dans main.js');
});

test('carte du pays : un bouton « Route vers La Mecque », visible quel que soit le zoom, montre le lieu', async () => {
  const main = (await import('node:fs')).readFileSync(new URL('../../voyage/js/main.js', import.meta.url), 'utf8');
  assert.match(main, /id = 'carte-vers-mecque'[^\n]*Route vers La Mecque[\s\S]{0,200}carte\.ouvrir\('route'\)[^\n]*\$\('carte-pays'\)\.insertBefore\(m, \$\('carte-fiche'\)\)/, 'pas de bouton « Route vers La Mecque » sur la carte du pays');
});

test('carte du pays : le bouton vers La Mecque est posé par-dessus la carte, en bas, assez grand, et laisse la place à la fiche', async () => {
  const fs = await import('node:fs'), lire = f => fs.readFileSync(new URL('../../voyage/' + f, import.meta.url), 'utf8');
  const css = lire('voyage.css');
  assert.match(css, /#carte-vers-mecque\{[^}]*position:absolute[^}]*bottom:[^}]*min-height:48px/, 'bouton non stylé : il serait caché sous le canvas');
  assert.match(css, /#carte-fiche:not\(\.cache\) ~ \.carte-aide[^{]*\{display:none\}/);
  assert.match(css, /#carte-pays:has\(#carte-fiche:not\(\.cache\)\) #carte-vers-mecque\{display:none\}/, 'le bouton recouvrirait la fiche');
});

test('carte du pays : sur téléphone debout, les outils passent en bas pour ne plus cacher le bord est (La Mecque)', async () => {
  const css = (await import('node:fs')).readFileSync(new URL('../../voyage/voyage.css', import.meta.url), 'utf8');
  const bloc = (css.match(/@media \(max-width:600px\) and \(orientation:portrait\)\{\s*\/\* carte du pays \*\/([\s\S]*?)\n\}/) || [])[1] || '';
  assert.match(bloc, /\.carte-outils\{[^}]*top:auto[^}]*bottom:[^}]*flex-direction:row/, 'les outils restent sur le bord est');
  assert.match(bloc, /#carte-vers-mecque\{bottom:/, 'le bouton doit monter au-dessus des outils');
  assert.match(bloc, /\.carte-aide\{[^}]*white-space:nowrap/, 'la phrase d\'aide sur deux lignes toucherait les outils');
});

// Un faux navigateur minimal : le canvas de la carte enregistre ce qu'on y dessine (aucun rendu réel).
function fauxNavigateur(w = 720, h = 720) {
  const journal = [], elements = {};
  const contexte = noter => { const etat = {}; let chemin = [];
    return new Proxy(etat, { set: (o, k, v) => { o[k] = v; return true; }, get: (o, k) => {
      if (k in o) return o[k];
      if (k === 'createImageData') return (l, h2) => ({ data: new Uint8ClampedArray(l * h2 * 4) });
      if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (k === 'measureText') return t => ({ width: String(t).length * 8 });
      return (...a) => { if (!noter) return;
        if (k === 'beginPath') chemin = [];
        if (k === 'moveTo' || k === 'lineTo') chemin.push([Math.round(a[0]), Math.round(a[1])]);
        if (k === 'stroke') journal.push({ op: 'stroke', chemin: [...chemin], couleur: o.strokeStyle, epaisseur: o.lineWidth });
        if (k === 'drawImage') journal.push({ op: 'parchemin' });
        if (k === 'fillText') journal.push({ op: 'texte', texte: a[0], x: a[1], y: a[2] });
      };
    } }); };
  const element = id => elements[id] ||= { id, innerHTML: '', classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, querySelector: () => null,
    width: w, height: h, getBoundingClientRect: () => ({ width: w, height: h, left: 0, top: 0 }), getContext: () => contexte(true) };
  let image = null;
  globalThis.document = { getElementById: element, createElement: () => ({ getContext: () => contexte(false) }) };
  globalThis.devicePixelRatio = 1;
  globalThis.requestAnimationFrame = f => { image = f; return 1; }; globalThis.cancelAnimationFrame = () => {};
  return { journal, elements, element, dessiner: () => image(0) };
}
const TERRAIN = { hauteur: () => 0, matiere: () => ({ herbe: 0, roche: 0 }) };
const apiCarte = (lieux, plus = {}) => ({ lieux: () => lieux, joueur: () => ({ x: 0, z: 0, a: 0 }), monture: () => null, route: () => null, dest: () => null, guider: () => true, arreter() {}, fermer() {}, ...plus });

test('carte du pays : le chemin vers La Mecque est dessiné en trait plein par-dessus le parchemin', async () => {
  const nav = fauxNavigateur();
  const { creerCarte } = await import('../../voyage/js/carte.js?v=4');
  const { lieuVersLaMecque } = await import('../../voyage/js/route/carte-pays-route.js');
  const { CHEMINS } = await import('../../voyage/js/terrain.js?v=3');
  const l = lieuVersLaMecque({ chemin: CHEMINS[0], ouverte: false, explication: 'Encore fermé.' });
  const carte = creerCarte(TERRAIN, apiCarte([l]));
  carte.ouvrir(); carte.vue.x = 0; carte.vue.z = 0; carte.vue.zoom = 1; nav.dessiner();   // 720 px pour 720 m : écran = monde + 360
  const attendu = l.trace.map(([x, z]) => [x + 360, z + 360]);
  const fond = nav.journal.findIndex(e => e.op === 'parchemin');
  const trait = nav.journal.findIndex(e => e.op === 'stroke' && JSON.stringify(e.chemin) === JSON.stringify(attendu));
  assert.ok(trait > fond && fond >= 0, 'le chemin n\'est pas tracé sur la carte');
  assert.ok(nav.journal[trait].epaisseur >= 5, 'trait nettement plus large que les pistes à l\'encre');
});

test('carte du pays : la fiche « La Mecque » ouvre toute la route, même fermée, sans proposer de guidage', async () => {
  const nav = fauxNavigateur(), boutons = {};
  const fiche = nav.element('carte-fiche');
  fiche.querySelector = sel => { const marque = sel.replace(/^[.[]|\]$/g, ''); return fiche.innerHTML.includes(marque) ? (boutons[marque] ||= {}) : null; };
  const { creerCarte } = await import('../../voyage/js/carte.js?v=4');
  const { lieuVersLaMecque } = await import('../../voyage/js/route/carte-pays-route.js');
  const { CHEMINS } = await import('../../voyage/js/terrain.js?v=3');
  let ouvertures = 0;
  const l = lieuVersLaMecque({ chemin: CHEMINS[0], ouverte: false, explication: 'Encore fermé.' });
  const carte = creerCarte(TERRAIN, apiCarte([l], { voirRoute: () => { ouvertures++; } }));
  carte.ouvrir('route');
  assert.match(fiche.innerHTML, /Voir toute la route/); assert.match(fiche.innerHTML, /Encore fermé\./);
  assert.doesNotMatch(fiche.innerHTML, /Me guider/);
  assert.equal(typeof boutons['data-voir-route']?.onclick, 'function', 'le bouton data-voir-route est affiché mais n\'a pas de onclick : il doit appeler api.voirRoute()');
  boutons['data-voir-route'].onclick(); assert.equal(ouvertures, 1, 'api.voirRoute() n\'a pas été appelé');
});

test('carte du pays : sur un écran étroit, le nom « La Mecque » reste entier au bord est', async () => {
  const nav = fauxNavigateur(390, 780);
  const { creerCarte } = await import('../../voyage/js/carte.js?v=4');
  const { lieuVersLaMecque } = await import('../../voyage/js/route/carte-pays-route.js');
  const { CHEMINS } = await import('../../voyage/js/terrain.js?v=3');
  const carte = creerCarte(TERRAIN, apiCarte([lieuVersLaMecque({ chemin: CHEMINS[0], ouverte: true })]));
  carte.ouvrir(); carte.vue.x = 0; carte.vue.z = 0; carte.vue.zoom = 1; nav.dessiner();
  const i = nav.journal.findIndex(e => e.op === 'texte' && e.texte === 'La Mecque');
  assert.ok(i >= 0, 'nom absent');
  const marqueur = 390 / 2 + 346 * 390 / 720, demi = 'La Mecque'.length * 4;   // mesure du faux canvas : 8 px par lettre
  assert.ok(marqueur + nav.journal[i].x + demi <= 390, 'le nom déborde de l\'écran à droite');
});

test('grande route : la destination « La Mecque » est écrite à la place de « cite-place », sans la compter comme découverte', async () => {
  const nav = fauxNavigateur(1200, 600);
  const parties = {};
  const boite = { style: {}, classList: { add() {}, remove() {} }, setAttribute() {}, querySelector: s => parties[s] ||= nav.element(s) };
  globalThis.document.createElement = () => boite; globalThis.document.body = { appendChild() {} };
  globalThis.addEventListener ||= () => {};
  const { creerCarteRoute, creerProjection } = await import('../../voyage/js/route/carte-route.js');
  const { LIEUX_ROUTE, positionDeLieu } = await import('../../voyage/js/route/donnees.js');
  const route = { decouvertes: [], repos: [], missions: {} };
  creerCarteRoute({ route, age: () => 8, joueur: () => ({ s: 0, t: 0, a: 0, dans: false }) }).ouvrir(); nav.dessiner();
  const but = nav.journal.find(e => e.op === 'texte' && e.texte === '🕋 La Mecque');
  assert.ok(but, 'la destination n\'est écrite nulle part');
  const p = positionDeLieu(LIEUX_ROUTE.find(l => l.id === 'cite-place')), q = creerProjection(1200, 600, false)(p.s, p.t);
  assert.ok(Math.abs(but.x - q.x) < 80 && Math.abs(but.y - q.y) < 60, 'la destination n\'est pas près de cite-place');
  assert.ok(but.x + String(but.texte).length * 4 <= 1200, 'le nom déborde de la carte');
  assert.deepEqual(route.decouvertes, []);
});
