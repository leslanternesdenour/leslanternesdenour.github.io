// Étape 2 : registre des habitants (proximité, fermeture automatique) et INDÉPENDANCE de Loumi (dialogues, mémoire, code) vis-à-vis de Nour et des missions.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const { creerHabitants } = await import('../../voyage/js/habitants.js');
const { NOEUDS, noeud, depart } = await import('../../voyage/js/loumi-dialogues.js');
const { MISSIONS, TEXTES } = await import('../../voyage/js/missions.js');
const lire = f => fs.readFileSync(new URL('../../voyage/js/' + f, import.meta.url), 'utf8');
// le code sans ses commentaires (les commentaires expliquent l'indépendance : ils peuvent nommer Nour ou la monture)
const code = f => lire(f).replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');

test('registre : l\'action n\'existe que près d\'un habitant, jamais ailleurs', () => {
  const h = creerHabitants(); h.ajouter({ id: 'a', x: 10, z: 0, rayon: 3, ouvrir() {} });
  assert.equal(h.interaction({ x: 0, z: 0 }), null); assert.equal(h.interaction({ x: 7.5, z: 0 }).id, 'a'); assert.equal(h.interaction({ x: 6.9, z: 0 }), null);
});
test('registre : l\'habitant le plus proche l\'emporte ; un habitant inactif n\'apparaît pas', () => {
  const h = creerHabitants(); let actif = true; h.ajouter({ id: 'a', x: 0, z: 0, ouvrir() {} }); h.ajouter({ id: 'b', x: 1, z: 0, rayon: 5, ouvrir() {}, actif: () => actif });
  assert.equal(h.interaction({ x: 0.9, z: 0 }).id, 'b'); actif = false; assert.equal(h.interaction({ x: 0.9, z: 0 }).id, 'a');
});
test('registre : la conversation s\'ouvre sur action volontaire et se FERME à l\'éloignement', () => {
  const h = creerHabitants({ marge: 1.5 }); const ev = []; h.ajouter({ id: 'l', x: 0, z: 0, rayon: 3, ouvrir: () => ev.push('ouvre'), fermer: () => ev.push('ferme') });
  assert.equal(h.ouvert(), null); h.maj({ x: 1, z: 0 }, () => ev.push('fenetre')); assert.deepEqual(ev, [], 'rien ne s\'ouvre tout seul');
  h.interaction({ x: 1, z: 0 }).faire(); assert.equal(h.ouvert(), 'l');
  h.maj({ x: 4, z: 0 }, () => ev.push('fenetre')); assert.equal(h.ouvert(), 'l', 'dans la marge : reste ouverte');
  h.maj({ x: 4.6, z: 0 }, () => ev.push('fenetre')); assert.equal(h.ouvert(), null); assert.deepEqual(ev, ['ouvre', 'ferme', 'fenetre']);
});
test('registre : une conversation qui enchaîne des réponses reste suivie et se ferme à l\'éloignement', () => {
  const h = creerHabitants(); h.ajouter({ id: 'l', x: 0, z: 0, rayon: 3, ouvrir() {} }); h.interaction({ x: 1, z: 0 }).faire();
  h.ferme(); h.marquer('l');                 // la fenêtre se referme puis la réponse suivante s'affiche
  assert.equal(h.ouvert(), 'l'); let f = 0; h.maj({ x: 9, z: 0 }, () => f++); assert.equal(f, 1); assert.equal(h.ouvert(), null);
});
test('registre : fermeture manuelle, retrait, entrées invalides refusées', () => {
  const h = creerHabitants(); h.ajouter({ id: 'a', x: 0, z: 0, ouvrir() {} }); h.interaction({ x: 0, z: 0 }).faire(); h.ferme(); assert.equal(h.ouvert(), null);
  h.retirer('a'); assert.equal(h.a('a'), false); assert.throws(() => h.ajouter({ id: 'x' })); assert.throws(() => h.ajouter({ id: 'y', x: NaN, z: 0, ouvrir() {} }));
});

test('Loumi : le graphe de conversation est complet (aucune impasse, tout nœud atteignable)', () => {
  const vus = new Set(['accueil', 'retour']); let n = 0;
  for (let i = 0; i < 5; i++) for (const [id, nd] of Object.entries(NOEUDS)) if (vus.has(id)) for (const c of nd.choix) { if (c.vers) { assert.ok(NOEUDS[c.vers], id + ' → ' + c.vers); vus.add(c.vers); } else n++; }
  assert.deepEqual([...vus].sort(), Object.keys(NOEUDS).sort()); assert.ok(n >= 1, 'toujours une sortie « au revoir »');
  assert.equal(depart({ rencontre: false }), 'accueil'); assert.equal(depart({ rencontre: true }), 'retour'); assert.equal(depart(undefined), 'accueil');
});
test('Loumi : textes courts, simples, sans arabe ni religieux, adaptés aux enfants', () => {
  for (const id of Object.keys(NOEUDS)) for (const ctx of [{ tactile: true }, { tactile: false }]) {
    const t = noeud(id, ctx).texte; assert.ok(t.length > 20 && t.length < 260, id + ' longueur ' + t.length);
    assert.ok(!/[؀-ۿ]|allah|coran|sourate|pri[eè]re/i.test(t), id + ' : aucun mot religieux');
    for (const c of NOEUDS[id].choix) assert.ok(c.txt.length < 40, 'choix court : ' + c.txt);
  }
});
test('Loumi : AUCUN texte partagé avec Nour ni avec les missions', () => {
  const miens = Object.keys(NOEUDS).flatMap(id => [noeud(id, { tactile: true }).texte, noeud(id, { tactile: false }).texte]);
  const leurs = [...Object.values(MISSIONS).map(m => m.resume), TEXTES.proposition, TEXTES.renduFinal, TEXTES.toutesFinies, TEXTES.rendu(1, 2), TEXTES.conseils(['x'])];
  for (const t of miens) for (const l of leurs) assert.notEqual(t, l);
  const contenu = lire('contenu.js'); for (const t of miens) assert.ok(!contenu.includes(t), 'le texte de Loumi n\'est pas dans les contenus du jeu');
});
test('Loumi : code indépendant — ne cite ni Nour, ni les missions, ni la mémoire du carnet', () => {
  for (const f of ['loumi.js', 'loumi-dialogues.js', 'habitants.js']) {
    const src = code(f);
    assert.ok(!/import[^;]*(aventure|contenu|missions|quetes|quotidien)/.test(src), f + ' : aucune importation des missions / contenus');
    assert.ok(!/parlerNour|POINTS|etat\.lus|aventure\.|MISSIONS|TEXTES/.test(src), f + ' : aucune référence aux dialogues, missions ou mémoire de Nour');
  }
  assert.ok(!/nour/i.test(code('loumi-dialogues.js').replace(/panier de Nour/g, '')), 'les dialogues de Loumi ne parlent pas en tant que Nour');
});
test('Loumi : habitante FIXE — le code ne la déplace ni ne la lie à la caméra, à l\'enfant ou à la monture', () => {
  const src = code('loumi.js');
  assert.ok(!/camera|chameau|monture|racine\.position\.(set|copy|lerp)|lieu\.position\.(set|copy|lerp)/i.test(src.replace(/lieu\.position\.set\(x, sol, z\)/, '')), 'aucun suivi de caméra / de monture / de position');
  const main = lire('main.js');
  assert.ok(!/loumi\.(dessiner|suivre)|camera.*loumi|loumi.*camera/.test(main), 'main.js ne lie pas Loumi à la caméra');
  assert.ok(/habitants\.ajouter\(\{ id: 'loumi'/.test(main) && /rayon: 3\.4/.test(main), 'Loumi est un habitant du registre : « Parler » seulement à proximité');
  assert.ok(!/loumiDit|loumiReagir/.test(main), 'plus de bulle ni de réaction automatiques');
  const m = code('main.js'); assert.equal((m.match(/parlerLoumi\(/g) || []).length, 3, 'parlerLoumi : définition + action « Parler » + choix suivant de la conversation — jamais appelée seule');
});
test('Nour (goutte) : habitant facultatif, DÉSACTIVÉ par défaut, sans lien avec les missions', () => {
  const main = lire('main.js');
  assert.ok(/nourHabitant: false/.test(main), 'désactivé par défaut'); assert.ok(/if \(etat\.options\.nourHabitant === true\)/.test(main), 'activé seulement par réglage explicite');
  const av = lire('aventure.js'); assert.ok(!/habitants|nourHabitant/.test(av), 'les missions ne connaissent pas les habitants');
});
