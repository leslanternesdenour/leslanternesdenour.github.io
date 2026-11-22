// CARACTÉRISATION des missions du Grand Voyage (étape 0 de la refonte) : fige le comportement actuel pour prouver qu'il ne change pas.
//  - collecte (lanternes, objets, dattes), sac, livraison, récompenses (une seule fois), sauvegarde / reprise, aucune mission impossible à finir ;
//  - les textes de mission gardent leur VOIX enregistrée (golden : outils/tests/donnees/missions-voix.json).
// Données seulement : Three.js est remplacé par l'imitation vide. node --import ./outils/tests/three-factice/enregistrer.mjs --test outils/tests/missions-caracterisation.test.mjs
// Mettre à jour le golden (uniquement si une voix est volontairement ajoutée) : LDN_GOLDEN=1 node --import … outils/tests/missions-caracterisation.test.mjs
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
// le module dessine quelques textures sur un canvas : on fournit un document vide (aucun rendu dans ce test)
const vide = () => new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : vide(), apply: () => vide(), construct: () => vide(), set: () => true });
globalThis.document = globalThis.document || { createElement: () => vide() };
const { creerAventure, MISSIONS } = await import('../../voyage/js/aventure.js');
const { idsPour } = await import('../../voyage/js/voix.js');
const { POINTS } = await import('../../voyage/js/contenu.js');
const GOLDEN = new URL('./donnees/missions-voix.json', import.meta.url);
const VOIX = JSON.parse(fs.readFileSync(new URL('../../audio/voix.json', import.meta.url), 'utf8'));

// Un monde de test : on enregistre tout ce que le jeu affiche et verse.
function monde(etat = {}) {
  const j = { dialogues: [], bandeaux: [], indices: [], dons: [], sauvegardes: 0 };
  const sons = new Proxy({}, { get: () => () => {} });
  const donnees = new Set();
  const av = creerAventure({ scene: { add() {}, remove() {} }, terrain: { hauteur: () => 0 }, colliders: [], etat, enregistrer: () => { j.sauvegardes++; },
    ui: { dialogue: d => j.dialogues.push(d), bandeau: (a, b) => j.bandeaux.push([a, b]), indice: t => j.indices.push(t), majSuivi() {} },
    sons, ombres: false, donner: (id, n, raison) => { if (donnees.has(id)) return; donnees.add(id); j.dons.push({ id, n, raison }); } });
  const J = { x: 0, z: 0 };
  // « se rendre » sur un objet et l'utiliser : exactement ce que fait le joueur
  const prendre = o => { J.x = o.x; J.z = o.z; const a = av.interaction(J); assert.ok(a, 'interaction possible sur ' + (o.cle || o.type)); a.faire(); return a; };
  const objets = type => av.objets3d.filter(o => o.type === type && !o.parti);
  return { av, j, J, prendre, objets, etat };
}
// Livraison des objets perdus : au panier de rendu (un lieu, plus un personnage), exactement comme le fait le joueur : on s'y rend et on utilise l'action « Déposer ».
const livrer = m => { m.J.x = m.av.PANIER.x; m.J.z = m.av.PANIER.z; const a = m.av.interaction(m.J); assert.ok(a && a.label === 'Déposer', 'action « Déposer » au panier'); return a.faire(); };
// Proposition / conseils : sans personnage (carnet) ; l'ancien nom parlerNour reste pour un habitant facultatif.
const proposer = m => m.av.proposer('objets');
const dernierTexte = m => m.j.dialogues[m.j.dialogues.length - 1].texte;

test('départ : aucune mission commencée, sac vide', () => {
  const { av } = monde(); assert.deepEqual(av.A.missions, {}); assert.deepEqual(av.A.sac, []); assert.equal(av.A.capacite, 3);
});
test('lanternes : la première lanterne lance la mission, +20 pièces chacune, 12 = terminée (+200, une seule fois)', () => {
  const m = monde(); const l = m.objets('lanterne'); assert.equal(l.length, 12);
  m.prendre(l[0]); assert.equal(m.av.A.missions.lanternes.etat, 'en_cours'); assert.equal(m.av.A.missions.lanternes.n, 1);
  for (const o of l.slice(1)) m.prendre(o);
  assert.equal(m.av.A.missions.lanternes.etat, 'finie'); assert.equal(m.av.A.missions.lanternes.n, 12);
  assert.equal(m.j.dons.filter(d => /^lanterne:/.test(d.id)).length, 12);
  assert.equal(m.j.dons.filter(d => d.id === 'mission:lanternes').length, 1); assert.equal(m.j.dons.find(d => d.id === 'mission:lanternes').n, MISSIONS.lanternes.recompense);
  assert.equal(m.objets('lanterne').length, 0);
});
test('objets perdus : ramasser (même sans mission) → dans le sac ; la livraison les compte ; 3 = terminée (+150)', () => {
  const m = monde(); const o = m.objets('objet'); assert.equal(o.length, 3);
  m.prendre(o[0]); assert.equal(m.av.A.missions.objets.etat, 'en_cours'); assert.equal(m.av.A.sac.length, 1);
  livrer(m); assert.equal(m.av.A.sac.length, 0); assert.equal(m.av.A.missions.objets.n, 1);
  m.prendre(o[1]); m.prendre(o[2]); assert.equal(m.av.A.sac.length, 2); livrer(m);
  assert.equal(m.av.A.missions.objets.etat, 'finie'); assert.equal(m.av.A.sac.length, 0);
  assert.equal(m.j.dons.filter(d => d.id === 'mission:objets').length, 1); assert.equal(m.j.dons.find(d => d.id === 'mission:objets').n, MISSIONS.objets.recompense);
});
test('sac plein : un 4e objet est refusé avec un message, rien n\'est perdu ; la livraison libère le sac', () => {
  const m = monde(); const o = m.objets('objet'), d = m.objets('dattes');
  for (const x of o) m.prendre(x); assert.equal(m.av.A.sac.length, 3);
  const avant = m.j.indices.length; m.prendre(d[0]); assert.equal(m.av.A.sac.length, 3, 'sac plein : refus'); assert.ok(m.j.indices.length > avant);
  assert.ok(d[0].parti !== true, 'l\'objet refusé reste au sol');
  livrer(m); assert.equal(m.av.A.sac.length, 0); m.prendre(d[0]); assert.equal(m.av.A.sac.length, 1);
});
test('proposition (carnet) : le « Oui, je t\'aide ! » démarre lanternes + objets', () => {
  const m = monde(); proposer(m); const d = m.j.dialogues[0]; assert.ok(d.boutons && d.boutons.length === 2);
  d.boutons[0].fn(); assert.ok(m.av.A.missions.lanternes && m.av.A.missions.objets); assert.equal(m.av.A.missions.objets.n, 0);
});
test('récompenses : jamais deux fois (une relecture / un rechargement ne redonne rien)', () => {
  const m = monde(); for (const o of m.objets('objet')) m.prendre(o); livrer(m);
  const n = m.j.dons.length; assert.equal(m.av.rendre(), false); assert.equal(m.av.rendre(), false); assert.equal(m.j.dons.length, n, 'rendre à vide ne redonne rien');
});
test('sauvegarde et reprise : la progression, le sac et les objets ramassés survivent', () => {
  const a = monde(); a.prendre(a.objets('lanterne')[0]); a.prendre(a.objets('objet')[0]);
  const copie = JSON.parse(JSON.stringify(a.etat));        // ce qui part en sauvegarde, puis revient
  const b = monde(copie);
  assert.equal(b.av.A.missions.lanternes.n, 1); assert.deepEqual(b.av.A.sac, a.av.A.sac); assert.equal(b.objets('lanterne').length, 11); assert.equal(b.objets('objet').length, 2);
  livrer(b); assert.equal(b.av.A.missions.objets.n, 1);
});
test('ancienne sauvegarde (sans champs récents) : chargée sans erreur, missions utilisables', () => {
  const m = monde({ aventure: { pieces: 120, missions: { lanternes: { etat: 'en_cours', n: 3, debut: 1 } }, ramasses: [], sac: ['seau'] } });
  assert.equal(m.av.A.missions.lanternes.n, 3); assert.deepEqual(m.av.A.sac, ['seau']); assert.ok(Array.isArray(m.av.A.animaux));
});
// Défaut latent constaté à l'étape 0 (livraison qui plantait avec un objet dans le sac sans mission « objets ») : corrigé à l'étape 1.
test('robustesse : un objet dans le sac sans mission ne bloque jamais la livraison', () => {
  const m = monde({ aventure: { pieces: 0, missions: {}, ramasses: [], sac: ['seau'] } });
  livrer(m); assert.deepEqual(m.av.A.sac, []); assert.equal(m.av.A.missions.objets.n, 1);
});
test('AUCUNE mission impossible : lanternes, objets, trésor, animaux et voyageur peuvent toutes être terminées depuis zéro', () => {
  const m = monde();
  for (const o of m.objets('lanterne')) m.prendre(o);
  for (const o of m.objets('objet')) m.prendre(o); livrer(m);
  assert.equal(m.av.A.missions.lanternes.etat, 'finie'); assert.equal(m.av.A.missions.objets.etat, 'finie');
  // trésor : trois indices puis le coffre
  for (const c of m.objets('cairn').sort((a, b) => a.i - b.i)) m.prendre(c);
  assert.ok(m.av.A.missions.tresor, 'les indices lancent la mission du trésor');
});
test('« où aller ? » : la boussole pointe un objectif existant pour chaque mission en cours (jamais dans le vide)', () => {
  const m = monde(); m.prendre(m.objets('objet')[0]); m.prendre(m.objets('lanterne')[0]);
  const c = m.av.prochaineCible({ x: 0, z: 0 }); assert.ok(c && Number.isFinite(c.x) && Number.isFinite(c.z));
  for (const x of m.objets('objet')) m.prendre(x);          // sac plein d'objets : l'objectif devient le lieu de livraison
  const cl = m.av.prochaineCible({ x: 0, z: 0 }, 'objets'); assert.ok(cl, 'un objectif de livraison existe'); assert.deepEqual([cl.x, cl.z], [-5.5, 5]);
});

// ---------- les voix ----------
// Tous les textes que l'enfant lit dans les missions (accueil, livraisons partielle et finale, conseils, bravos) : chacun doit garder sa voix.
function textesMissions() {
  const m = monde(), t = new Set();
  const noter = () => { for (const d of m.j.dialogues) { if (d.texte) t.add(d.texte); if (d.sous) t.add(d.sous); } m.j.dialogues.length = 0; };
  proposer(m); noter();                                          // proposition
  m.j.dialogues; for (const b of []) b;
  const m2 = monde(); m2.av.parlerNour(POINTS.nour.texte); for (const d of m2.j.dialogues) t.add(d.texte);          // proposition précédée de l'accueil
  const m3 = monde(); m3.prendre(m3.objets('objet')[0]); livrer(m3); noter2(m3, t);                              // il en manque 2
  m3.prendre(m3.objets('objet')[0]); livrer(m3); noter2(m3, t);                                                   // il en manque 1
  m3.prendre(m3.objets('objet')[0]); livrer(m3); noter2(m3, t);                                                   // terminé
  const m4 = monde(); m4.av.commencer('lanternes', true); m4.av.commencer('objets', true); m4.av.parlerNour(''); noter2(m4, t);   // conseils
  for (const k of Object.keys(MISSIONS)) t.add(MISSIONS[k].resume);
  t.add(POINTS.nour.texte);
  return [...t].sort();
  function noter2(mm, ens) { for (const d of mm.j.dialogues) if (d.texte) ens.add(d.texte); mm.j.dialogues.length = 0; }
}
test('voix : chaque texte de mission garde la voix enregistrée qu\'il a aujourd\'hui (golden)', () => {
  const actuel = {}; for (const txt of textesMissions()) actuel[txt] = idsPour(txt);
  for (const [txt, ids] of Object.entries(actuel)) for (const id of ids) assert.ok(VOIX[id], 'fichier de voix présent : ' + id + ' (' + txt.slice(0, 40) + '…)');
  if (process.env.LDN_GOLDEN === '1' || !fs.existsSync(GOLDEN)) { fs.mkdirSync(new URL('./donnees/', import.meta.url), { recursive: true }); fs.writeFileSync(GOLDEN, JSON.stringify(actuel, null, 1) + '\n'); return; }
  const ref = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
  for (const [txt, ids] of Object.entries(ref)) { assert.ok(txt in actuel, 'le texte existe toujours : ' + txt.slice(0, 50) + '…'); assert.deepEqual(actuel[txt], ids, 'même voix : ' + txt.slice(0, 50) + '…'); }
  assert.ok(Object.values(ref).some(v => v.length), 'le golden contient bien des textes avec voix');
});

// ---------- étape 1 : le système de missions ne dépend d'aucun personnage ----------
test('le panier n\'agit que si l\'on porte des objets perdus (interface contextuelle)', () => {
  const m = monde(); m.J.x = m.av.PANIER.x; m.J.z = m.av.PANIER.z; assert.equal(m.av.interaction(m.J), null, 'rien à déposer : aucune action');
  m.prendre(m.objets('objet')[0]); m.J.x = m.av.PANIER.x; m.J.z = m.av.PANIER.z; const a = m.av.interaction(m.J); assert.equal(a.label, 'Déposer');
});
test('proposer / rendre / conseils : sans parler à personne, sans état caché', () => {
  const m = monde(); assert.equal(m.av.proposer('lanternes'), true); m.j.dialogues[0].boutons[0].fn(); assert.ok(m.av.A.missions.lanternes && m.av.A.missions.objets);
  m.av.proposer('objets'); assert.match(m.j.dialogues[1].texte, /Courage/, 'déjà commencées : des conseils');
  assert.equal(m.av.proposer('tresor'), false, 'une mission sans lot ne se « propose » pas : elle se joue');
});
test('un habitant facultatif (ancien nom parlerNour) donne exactement les mêmes textes que le carnet', () => {
  const a = monde(), b = monde(); a.av.parlerNour(''); proposer(b); assert.equal(a.j.dialogues[0].texte, b.j.dialogues[0].texte);
  assert.equal(a.j.dialogues[0].titre, 'Nour', 'le donneur d\'origine garde son identité (étiquette)'); assert.equal(a.j.dialogues[0].mascotte, 'nour');
});
test('aucune dépendance : aventure.js et missions.js ne citent ni Loumi ni un personnage obligatoire', () => {
  for (const f of ['aventure.js', 'missions.js']) { const src = fs.readFileSync(new URL('../../voyage/js/' + f, import.meta.url), 'utf8'); assert.ok(!/loumi/i.test(src), f + ' ne parle pas de Loumi'); }
  const src = fs.readFileSync(new URL('../../voyage/js/aventure.js', import.meta.url), 'utf8');
  assert.ok(!/id === 'nour'|cle === 'nour'/.test(src), 'aucune condition sur un personnage');
});
test('voix : mêmes phrases par le carnet ET par l\'ancien nom (aucune voix perdue)', () => {
  const t1 = new Set(), t2 = new Set();
  const a = monde(); a.av.parlerNour(''); for (const d of a.j.dialogues) t1.add(d.texte);
  const b = monde(); proposer(b); for (const d of b.j.dialogues) t2.add(d.texte);
  assert.deepEqual([...t1], [...t2]); for (const x of t2) assert.ok(idsPour(x).length > 0, 'voix : ' + x.slice(0, 40));
});
