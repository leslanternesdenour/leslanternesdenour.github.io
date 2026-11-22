// LES MYSTÈRES DU DÉSERT — moteur : 7 chapitres (observer → trouver les indices → résoudre l'énigme → ouvrir le passage → découvrir un trésor).
// Réutilise le socle commun (aventures/commun/base.js : 3D, voix, sous-titres), les décors et objets de la Chasse aux mots, les personnages du Grand Voyage.
// Aucun chronomètre, aucune sanction : une erreur donne une explication douce ; les étoiles ne dépendent que des aides demandées.
import { creerBase, $, lsGet, lsSet, THREE, existe, arreterVoix, reglerVolume } from '../commun/base.js?v=1';
import { creerObjet, decor, creerPassage } from './decors.js?v=1';
import { emplacements } from '../chasse-aux-mots/objets3d.js?v=1';
import { CHAPITRES, ORDRE_CHAPITRES, GUIDES, NOMS_OBJETS, PHRASES, BRAVOS, ERREURS } from './contenu.js?v=1';
import * as G from './logique.js?v=1';

let etat = G.lire(lsGet(G.CLE)); const sauver = () => lsSet(G.CLE, etat);
if (!etat.age) { const p = lsGet('ldn_profil_actif'); if (p && G.groupeAge(p.age || p.ageGroupe)) { etat.age = G.groupeAge(p.age || p.ageGroupe); sauver(); } }
const niveau = () => etat.niveau || G.niveauParDefaut(etat.age);
const B = creerBase({ canvas: $('scene'), dossierAudio: 'audio/jeux/mysteres-desert', sousTitresActifs: () => etat.sousTitres });
const icone = id => B.icone(creerObjet, id);
const parler = (id, texte, qui, fini) => B.parler(id, texte, qui, fini);
// enchaîne des phrases : avec la voix, on attend sa fin ; sans voix (audio absent), on laisse le temps de lire le sous-titre
function dire(etapes, fin) { const [id, texte, qui] = etapes[0]; const reste = etapes.slice(1); const suivant = () => { if (reste.length) dire(reste, fin); else if (fin) fin(); };
  const v = parler(id, texte, qui, suivant); if (!v) setTimeout(suivant, Math.max(2200, texte.length * 55)); }

// ---------- chapitre ----------
let ch = null, clues = [], guide = null, passage = null, tresorObj = null, ouv = 0, ouvrant = false, indice = null, inactif = 0;
const idsEtapes = () => ch;
async function creerGuide(def) {
  try { const { Enfant } = await import('../../voyage/js/personnages.js?v=4'); const e = new Enfant(false, { tunique: def.tunique, pantalon: def.pantalon, cheche: def.cheche, peau: def.peau, sac: false, barbe: def.barbe || null, voile: def.voile || null });
    e.racine.scale.setScalar(1.45); e.racine.position.set(-1.7, 0, 1.6); B.monde.add(e.racine); return e; } catch (er) { return null; }
}
function entrer(id, niv) {
  arreterVoix(); B.vider(); guide = null; tresorObj = null; ouv = 0; ouvrant = false; indice = null; inactif = 0; fermerCartes();
  const D = CHAPITRES[id], params = G.parametres(niv, etat.age); B.ambiance(D.ciel, D.sol, D.brume);
  B.monde.add(decor(D.decor)); passage = creerPassage(); B.monde.add(passage);
  const slots = emplacements(D.decor), sel = D.indices.slice(0, params.indices);
  clues = sel.map((c, i) => { const o = creerObjet(c.objet), s = slots[(i * 2 + 1) % 8], k = niv === 'avance' ? 1.25 : 1.7; o.scale.setScalar(k); o.position.set(s.x, 0, s.z); o.rotation.y = s.a; B.monde.add(o);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.62 * 1.7 * params.rayon, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(s.x, 0.5, s.z); B.monde.add(hit);
    return { i, def: c, mesh: o, hit, base: s, k, trouve: false, anim: 0 }; });
  ch = { id, niv, params, phase: 'indices', trouves: 0, aides: 0, erreurs: 0, enigme: null, carnet: [] };
  creerGuide(GUIDES[D.guide]).then(g => { guide = g; });
  B.azCible = B.az = 0; $('titre-chapitre').textContent = `${D.icone} ${D.nom}`; majObjectif();
  $('accueil').classList.add('cache'); $('hud').classList.remove('cache'); etat.dernier = { chapitre: id, niveau: niv }; sauver();
  dire([[`intro.${id}`, D.intro, GUIDES[D.guide].nom]]);
}
function majObjectif() { $('objectif').textContent = ch.phase === 'indices' ? `🔎 Cherche les indices : ${ch.trouves}/${clues.length}` : ch.phase === 'enigme' ? '❓ Résous l\'énigme' : ''; $('objectif').classList.toggle('cache', ch.phase === 'fini'); }
B.onTap = e => { if (!ch || ch.phase !== 'indices') return; inactif = 0; const h = B.toucher(e, clues.filter(c => !c.trouve).map(c => c.hit)); if (h) trouveIndice(clues.find(c => c.hit === h)); };
function trouveIndice(c) {
  if (c.trouve) return; c.trouve = true; c.anim = 0.0001; ch.trouves++; indice = null;
  const D = CHAPITRES[ch.id]; ch.carnet.push(c.def); parler(`indice.${ch.id}.${c.i + 1}`, c.def.texte, GUIDES[D.guide].nom); majObjectif();
  if (guide && guide.faire) guide.faire('salut'); const cible = ch;
  if (ch.trouves >= clues.length) setTimeout(() => { if (ch === cible) lancerEnigme(); }, existe(`indice.${ch.id}.${c.i + 1}`) ? 4800 : 3600);
}
function aideIndices() { const c = clues.find(x => !x.trouve); if (!c) return; indice = { c, t: 0 }; B.versAngle(Math.atan2(c.base.x, c.base.z - 1)); parler('aide', PHRASES.aide.texte, 'Loumi'); inactif = 0; }
function aide(compte = true) { if (!ch) return; if (ch.phase === 'indices') { if (compte) ch.aides++; aideIndices(); } else if (ch.phase === 'enigme') { if (compte) ch.aides++; aideEnigme(); } }

// ---------- énigmes ----------
const D_ = () => CHAPITRES[ch.id], Q = () => D_().enigme;
const bouton = (id, cls = '') => `<button class="choix ${cls}" data-id="${id}" aria-label="${NOMS_OBJETS[id]}"><img alt="" src="${icone(id)}"></button>`;
function lancerEnigme() {
  ch.phase = 'enigme'; ch.enigme = G.construireEnigme(ch.id, ch.niv); majObjectif(); $('enigme-msg').textContent = ''; $('enigme').classList.remove('cache');
  $('enigme-question').textContent = Q().question; ch.rep = []; ch.pris = new Set(); const e = ch.enigme, z = $('enigme-zone'); $('enigme-valider').classList.add('cache');
  if (e.type === 'choisir') z.innerHTML = e.options.map(o => bouton(o)).join('');
  else if (e.type === 'ordre') z.innerHTML = e.affichage.map(o => bouton(o)).join('');
  else if (e.type === 'paires') z.innerHTML = `<div class="zone">${e.objets.map(o => bouton(o, 'obj')).join('')}</div><div class="zone">${e.ombres.map(o => bouton(o, 'sil')).join('')}</div>`;
  else if (e.type === 'memoire') z.innerHTML = e.symboles.map(o => bouton(o)).join('');
  else if (e.type === 'code') { ch.slots = e.ordre.map(() => -1); z.innerHTML = `<div class="slots">${e.ordre.map((_, i) => `<button class="slot" data-s="${i}" aria-label="Case ${i + 1}">?</button>`).join('')}</div>`; $('enigme-valider').classList.remove('cache'); }
  z.querySelectorAll('.choix').forEach(b => { b.onclick = () => repondre(b); }); z.querySelectorAll('.slot').forEach(b => { b.onclick = () => cycle(b); });
  dire([['indices_finis', PHRASES.indices_finis.texte, 'Guide'], [`enigme.${ch.id}`, Q().question, GUIDES[D_().guide].nom]], () => { if (ch && ch.phase === 'enigme' && e.type === 'memoire') jouerSuite(); });
}
function cycle(b) { const e = ch.enigme, i = Number(b.dataset.s); ch.slots[i] = (ch.slots[i] + 1) % e.options.length; const id = e.options[ch.slots[i]]; b.innerHTML = `<img alt="${NOMS_OBJETS[id]}" src="${icone(id)}">`; b.dataset.id = id; b.classList.remove('ok'); }
$('enigme-valider').onclick = () => { const e = ch.enigme; const rep = ch.slots.map(i => (i < 0 ? null : e.options[i])); const r = G.verifier(e, rep); if (r.ok) succes(); else erreur(`${r.bons} case${r.bons > 1 ? 's sont bonnes' : ' est bonne'}. Relis tes indices.`, () => { document.querySelectorAll('.slot').forEach((b, i) => b.classList.toggle('ok', rep[i] === e.ordre[i])); }); };
function repondre(b) {
  const e = ch.enigme, id = b.dataset.id; if (b.disabled || b.classList.contains('pris')) return;
  if (e.type === 'choisir') { if (G.verifier(e, id).ok) succes(); else { b.classList.add('pris'); b.disabled = true; erreur(); } }
  else if (e.type === 'ordre') { ch.rep.push(id); b.classList.add('sel'); b.disabled = true; b.insertAdjacentHTML('beforeend', `<span class="num">${ch.rep.length}</span>`);
    if (ch.rep.length === e.ordre.length) { const r = G.verifier(e, ch.rep); if (r.ok) succes(); else { erreur(`${r.bons} image${r.bons > 1 ? 's sont bien placées' : ' est bien placée'}. Recommence !`, () => { ch.rep = []; $('enigme-zone').querySelectorAll('.choix').forEach(x => { x.disabled = false; x.classList.remove('sel'); x.querySelector('.num')?.remove(); }); }); } } }
  else if (e.type === 'paires') {
    if (b.classList.contains('obj')) { $('enigme-zone').querySelectorAll('.obj').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); ch.sel = id; }
    else if (ch.sel) { if (G.paireJuste(e, ch.sel, id)) { ch.pris.add(id); $('enigme-zone').querySelectorAll(`[data-id="${id}"]`).forEach(x => { x.classList.add('pris'); x.classList.remove('sel'); }); ch.sel = null; if (ch.pris.size === e.paires.length) succes(); } else { ch.sel = null; $('enigme-zone').querySelectorAll('.obj').forEach(x => x.classList.remove('sel')); erreur(); } } }
  else if (e.type === 'memoire') { if (ch.attente) return; const k = ch.rep.length; if (e.suite[k] === id) { ch.rep.push(id); b.classList.add('allume'); setTimeout(() => b.classList.remove('allume'), 250); if (ch.rep.length === e.suite.length) succes(); } else { ch.rep = []; erreur('Regarde encore la suite, doucement.', () => setTimeout(jouerSuite, 900)); } }
}
function jouerSuite() { const e = ch.enigme, c = ch; if (!c || c.phase !== 'enigme') return; c.attente = true; c.rep = []; const bs = [...$('enigme-zone').querySelectorAll('.choix')]; $('enigme-msg').textContent = '👀 Regarde bien…';
  e.suite.forEach((id, i) => { setTimeout(() => { if (ch !== c) return; const b = bs.find(x => x.dataset.id === id); b.classList.add('allume'); setTimeout(() => b.classList.remove('allume'), 650); }, 700 + i * 1000); });
  setTimeout(() => { if (ch === c) { c.attente = false; $('enigme-msg').textContent = '👉 À toi !'; } }, 700 + e.suite.length * 1000); }
function aideEnigme() { const e = ch.enigme, z = $('enigme-zone'); parler('aide', PHRASES.aide.texte, 'Loumi');
  if (e.type === 'choisir') { const b = [...z.querySelectorAll('.choix:not(.pris)')].find(x => x.dataset.id !== e.bonne); if (b) { b.classList.add('pris'); b.disabled = true; } }
  else if (e.type === 'ordre') { const prochain = e.ordre[ch.rep.length]; z.querySelector(`.choix[data-id="${prochain}"]`)?.classList.add('indic'); }
  else if (e.type === 'paires') { const p = e.paires.find(x => !ch.pris.has(x)); z.querySelectorAll(`[data-id="${p}"]`).forEach(x => x.classList.add('indic')); }
  else if (e.type === 'memoire') jouerSuite();
  else if (e.type === 'code') { const i = ch.slots.findIndex((s, k) => e.options[s] !== e.ordre[k]); if (i >= 0) { ch.slots[i] = e.options.indexOf(e.ordre[i]) - 1; cycle(z.querySelectorAll('.slot')[i]); } } }
function erreur(msg, apres) {
  ch.erreurs++; const k = ERREURS[(ch.erreurs - 1) % ERREURS.length], D = D_();
  if (ch.erreurs >= 2 && ch.erreurs % 2 === 0) { $('enigme-msg').textContent = D.enigme.pourquoi; parler(`pourquoi.${ch.id}`, D.enigme.pourquoi, 'Loumi'); } else { $('enigme-msg').textContent = msg || PHRASES[k].texte; parler(k, PHRASES[k].texte, 'Loumi'); }
  if (apres) apres(); if (ch.erreurs % 3 === 0 && !msg) setTimeout(() => ch && ch.phase === 'enigme' && aideEnigme(), 1500);
}
$('enigme-aide').onclick = () => aide(true); $('aide').onclick = () => aide(true);
$('enigme-ecouter').onclick = () => parler(`enigme.${ch.id}`, Q().question, GUIDES[D_().guide].nom);

// ---------- succès : le passage s'ouvre, le trésor apparaît ----------
function succes() {
  ch.phase = 'fini'; majObjectif(); $('enigme').classList.add('cache'); ouvrant = true; const c = ch, D = D_();
  const r = G.terminerChapitre(etat, { chapitre: c.id, niveau: c.niv, aides: c.aides }); sauver();
  tresorObj = creerObjet(D.tresor.objet); tresorObj.scale.setScalar(1.6); tresorObj.position.set(passage.userData.piedestal.x, 0.55, passage.userData.piedestal.z); B.monde.add(tresorObj); B.versAngle(0);
  const k = BRAVOS[c.erreurs % BRAVOS.length];
  dire([[k, PHRASES[k].texte, GUIDES[D.guide].nom], ['passage', PHRASES.passage.texte, GUIDES[D.guide].nom]], () => { if (ch === c) montrerTresor(r); });
}
function montrerTresor(r) {
  const D = D_(), e = G.etoilesPour(ch.aides), prochain = G.prochainChapitre(etat);
  $('tresor-img').innerHTML = `<img alt="" src="${icone(D.tresor.objet)}">`; $('tresor-nom').textContent = D.tresor.nom; $('tresor-fait').textContent = D.tresor.fait;
  $('tresor-recompenses').innerHTML = ['⭐'.repeat(e) + '☆'.repeat(3 - e), r.lanterne ? '🏮 Une lanterne gagnée' : '', r.tresor ? '💎 Nouveau trésor' : '', ...r.diplomes.map(d => d === 'maitre' ? '🏆 Maître explorateur' : '🎓 Explorateur du désert')].filter(Boolean).map(x => `<span>${x}</span>`).join('');
  const b = $('tresor-suite'); const suiv = ORDRE_CHAPITRES[ORDRE_CHAPITRES.indexOf(ch.id) + 1]; b.classList.toggle('cache', !suiv); if (suiv) { b.textContent = `${CHAPITRES[suiv].icone} ${CHAPITRES[suiv].nom} ›`; b.onclick = () => entrer(suiv, ch.niv); }
  $('tresor').classList.remove('cache'); $('hud').classList.add('cache'); const c = ch;
  const dip = r.diplomes.includes('maitre') ? 'fin_maitre' : r.diplomes.length ? 'fin_diplome' : null;
  dire([[`tresor.${ch.id}`, `${D.tresor.nom}. ${D.tresor.fait}`, 'Narratrice'], ...(dip ? [[dip, PHRASES[dip].texte, 'Narratrice']] : [['fin_chapitre', PHRASES.fin_chapitre.texte, GUIDES[D.guide].nom]])], null);
}

// ---------- carte, trésors, carnet, réglages ----------
function fermerCartes() { for (const id of ['enigme', 'tresor', 'carnet', 'tresors', 'reglages']) $(id).classList.add('cache'); }
function afficherAccueil() {
  arreterVoix(); fermerCartes(); ch = null; B.vider(); B.ambiance('#2a1f6b', '#2a1f6b', '#2a1f6b'); $('hud').classList.add('cache'); $('accueil').classList.remove('cache');
  $('age-bloc').classList.toggle('cache', !!etat.age && !$('age-bloc').dataset.ouvert); $('carte-bloc').classList.toggle('cache', !etat.age);
  $('bilan').textContent = `⭐ ${G.etoilesTotal(etat)} / ${G.MAX_ETOILES}   ·   🏮 ${G.lanternes(etat)}   ·   💎 ${etat.tresors.length} / 7`;
  const proch = G.prochainChapitre(etat);
  $('chapitres').innerHTML = ORDRE_CHAPITRES.map((c, i) => { const d = CHAPITRES[c], ouvert = G.chapitreOuvert(etat, c), e = G.etoilesChapitre(etat, c); return `<button class="chap${c === proch ? ' prochain' : ''}" data-c="${c}" ${ouvert ? '' : 'disabled'}><span class="ic">${ouvert ? d.icone : '🔒'}</span><b>${i + 1}. ${d.nom}</b><span class="et">${G.fait(etat, c) ? '💡 ' + '⭐'.repeat(Math.max(1, Math.round(e / 3))) : ouvert ? 'À explorer' : 'Verrouillé par l\'histoire'}</span></button>`; }).join('');
  $('chapitres').querySelectorAll('button').forEach(b => b.onclick = () => entrer(b.dataset.c, niveau()));
  const cont = $('continuer'); cont.textContent = proch ? `▶ ${etat.dernier || G.fait(etat, 'desert') ? 'Continuer' : 'Commencer'} : ${CHAPITRES[proch].nom}` : '🏆 Rejouer un chapitre'; cont.onclick = () => entrer(proch || 'desert', niveau());
  $('niveau-nom').textContent = G.NOMS_NIVEAUX[niveau()];
  if (!afficherAccueil.dit) { afficherAccueil.dit = true; parler(etat.age ? 'bienvenue' : 'age', etat.age ? PHRASES.bienvenue.texte : PHRASES.age.texte, 'Narratrice'); }
}
document.querySelectorAll('[data-age]').forEach(b => b.onclick = () => { etat.age = b.dataset.age; etat.niveau = null; sauver(); $('age-bloc').dataset.ouvert = ''; afficherAccueil(); });
$('changer-niveau').onclick = () => { etat.niveau = G.NIVEAUX[(G.NIVEAUX.indexOf(niveau()) + 1) % 3]; sauver(); afficherAccueil(); };
$('changer-age').onclick = () => { $('age-bloc').dataset.ouvert = '1'; $('reglages').classList.add('cache'); afficherAccueil(); };
$('btn-tresors').onclick = () => { $('tresors-liste').innerHTML = ORDRE_CHAPITRES.map(c => { const t = CHAPITRES[c].tresor, vu = etat.tresors.includes(c); return `<li class="${vu ? '' : 'inconnu'}">${vu ? `<button class="mot-btn" data-t="${c}" aria-label="Écouter : ${t.nom}"><img alt="" src="${icone(t.objet)}"><b>${t.nom}</b></button>` : '<i>?</i>'}</li>`; }).join('');
  $('tresors-liste').querySelectorAll('[data-t]').forEach(b => b.onclick = () => { const t = CHAPITRES[b.dataset.t].tresor; parler(`tresor.${b.dataset.t}`, `${t.nom}. ${t.fait}`, 'Narratrice'); });
  $('tresors-dip').innerHTML = etat.diplomes.length ? etat.diplomes.map(d => `<span>${d === 'maitre' ? '🏆 Maître explorateur' : '🎓 Explorateur du désert'}</span>`).join('') : '<span class="vide">Rallume la grande lanterne pour gagner un diplôme.</span>'; $('tresors').classList.remove('cache'); };
$('tresors-fermer').onclick = () => $('tresors').classList.add('cache');
$('carnet-btn').onclick = () => { $('carnet-liste').innerHTML = ch && ch.carnet.length ? ch.carnet.map(c => `<li><img alt="" src="${icone(c.objet)}"><span>${c.texte}</span></li>`).join('') : '<li class="vide">Aucun indice pour le moment. Touche les objets de la scène !</li>'; $('carnet').classList.remove('cache'); };
$('carnet-fermer').onclick = () => $('carnet').classList.add('cache');
$('retour').onclick = afficherAccueil; $('tresor-carte').onclick = afficherAccueil;
$('gauche').onclick = () => B.tourner(-0.6); $('droite').onclick = () => B.tourner(0.6);
addEventListener('keydown', e => { if (e.key === 'ArrowLeft') B.tourner(-0.5); else if (e.key === 'ArrowRight') B.tourner(0.5); else if ((e.key === 'h' || e.key === 'H') && ch) aide(true); });
$('reecouter').onclick = () => { if (!ch) return; if (ch.phase === 'enigme') parler(`enigme.${ch.id}`, Q().question, GUIDES[D_().guide].nom); else { const D = D_(); parler(`intro.${ch.id}`, D.intro, GUIDES[D.guide].nom); } };
$('btn-reglages').onclick = () => { $('st-case').checked = etat.sousTitres; $('reglages').classList.toggle('cache'); }; $('reglages-fermer').onclick = () => $('reglages').classList.add('cache');
$('st-case').onchange = e => { etat.sousTitres = e.target.checked; sauver(); };
$('volume').oninput = e => { const v = Number(e.target.value); try { reglerVolume('voix', v); const m = lsGet('monde') || {}; m.sons = Object.assign({ musique: 0.5, musiqueActive: true, voix: 1, effets: 0.7 }, m.sons, { voix: v }); lsSet('monde', m); } catch (er) {} };
{ const m = lsGet('monde'); if (m && m.sons && typeof m.sons.voix === 'number') { $('volume').value = m.sons.voix; try { reglerVolume('voix', m.sons.voix); } catch (e) {} } }

// ---------- animation ----------
B.onFrame = (dt, t) => {
  if (ch && ch.phase === 'indices') { inactif += dt; if (ch.params.aideAutoMs && inactif * 1000 > ch.params.aideAutoMs) { inactif = 0; aideIndices(); } }
  for (const c of clues) { const m = c.mesh;
    if (c.trouve) { c.anim += dt; m.position.y = Math.min(3, c.anim * 4.5); m.rotation.y += dt * 8; m.scale.setScalar(Math.max(0.001, c.k * (1 - Math.max(0, c.anim - 0.5) * 1.6))); m.visible = m.scale.x > 0.01; c.hit.visible = false; continue; }
    let s = c.k, y = 0; if (ch && ch.niv === 'facile') { s = c.k * (1 + Math.sin(t * 3 + c.i) * 0.05); y = 0.05 + Math.abs(Math.sin(t * 2 + c.i)) * 0.12; }       // en mode Découverte, les indices respirent doucement
    if (indice && indice.c === c) { indice.t += dt; const p = Math.sin(indice.t * 6); s = c.k * (1.12 + p * 0.1); y = 0.15 + Math.abs(p) * 0.25; if (indice.t > 5) indice = null; }
    m.scale.setScalar(s); m.position.y = y; }
  if (ouvrant && passage) { ouv = Math.min(1, ouv + dt * 0.7); passage.userData.ouvrir(ouv); }
  if (tresorObj) { tresorObj.rotation.y += dt * 1.2; tresorObj.position.y = 0.9 + Math.sin(t * 2) * 0.08; }
  if (guide) { guide.animer(dt, 0, t); guide.racine.lookAt(B.camera.position.x, 0, B.camera.position.z); }
};
B.chargerAudio(); afficherAccueil();
window.__mystere = { etat: () => etat, ch: () => ch, entrer, aide, indices: () => clues.map(c => c.def.objet), tap: o => { const c = clues.find(x => x.def.objet === o && !x.trouve); if (c) trouveIndice(c); }, enigme: () => ch && ch.enigme, voix: () => [...B.dispo], ecran: o => { const c = clues.find(x => x.def.objet === o); return c ? B.ecran(c.base.x, 0.6, c.base.z) : null; }, tourner: a => { B.az = B.azCible = a; } };
