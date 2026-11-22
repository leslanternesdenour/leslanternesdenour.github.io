// LA CHASSE AUX MOTS — moteur du jeu (3D légère : un décor fusionné par lieu, 8 objets, un guide).
// Réutilise : les formes du jeu (voyage/js/formes.js), les personnages (voyage/js/personnages.js), la table de mixage et la voix du socle (monde/socle/*),
// la sauvegarde du profil (clé « aventure_mots », synchronisée par l'Espace famille). Aucune voix de synthèse du téléphone, aucun chronomètre, aucune sanction.
import * as THREE from 'three';
import { creerObjet, creerDecor, emplacements, IDS_OBJETS } from './objets3d.js?v=1';
import { OBJETS, LIEUX, GUIDES, PHRASES, BRAVOS, ERREURS, dire as remplir } from './mots.js?v=1';
import * as G from './logique.js?v=1';
import { chargerVoix, ajouterVoix, existe, dire as direVoix, arreterVoix } from '../../monde/socle/voix.js?v=1';
import { reveiller, reglerVolume } from '../../monde/socle/audio.js?v=1';

const $ = id => document.getElementById(id);
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
let etat = G.lire(lsGet(G.CLE));
const sauver = () => lsSet(G.CLE, etat);
const profil = () => lsGet('ldn_profil_actif');
if (!etat.age) { const p = profil(); if (p && G.groupeAge(p.age || p.ageGroupe)) { etat.age = G.groupeAge(p.age || p.ageGroupe); sauver(); } }

// ---------- 3D ----------
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
const scene = new THREE.Scene(); scene.fog = new THREE.Fog('#f3dfb5', 16, 40);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);
scene.add(new THREE.HemisphereLight('#fff6e0', '#8a7a5a', 1.5)); const soleil = new THREE.DirectionalLight('#ffe9c0', 1.5); soleil.position.set(6, 12, 8); scene.add(soleil);
const sol = new THREE.Mesh(new THREE.CircleGeometry(14, 40), new THREE.MeshLambertMaterial({ color: '#e0b878' })); sol.rotation.x = -Math.PI / 2; scene.add(sol);
const monde = new THREE.Group(); scene.add(monde);        // tout ce qui change avec le lieu
const ray = new THREE.Raycaster(), pt = new THREE.Vector2();
let az = 0, azCible = 0, t = 0;
const CENTRE = new THREE.Vector3(0, 0.8, 1);
function dimensionner() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 0.8 ? 62 : 50; camera.updateProjectionMatrix(); }
addEventListener('resize', dimensionner); dimensionner();
function placerCamera() { const R = camera.aspect < 0.8 ? 12.5 : 11.5; camera.position.set(Math.sin(az) * R, 6.4, 1 + Math.cos(az) * R); camera.lookAt(CENTRE); }

// ---------- icônes d'objets (rendu 3D → image), pour les cartes ----------
const cacheIcones = new Map(); let rt = null, sceneI = null, camI = null;
function icone(id, taille = 128) {
  if (cacheIcones.has(id)) return cacheIcones.get(id);
  if (!rt) { rt = new THREE.WebGLRenderTarget(taille, taille); sceneI = new THREE.Scene(); sceneI.add(new THREE.HemisphereLight('#fff6e0', '#8a7a5a', 2.2)); const d = new THREE.DirectionalLight('#fff', 1.2); d.position.set(2, 4, 3); sceneI.add(d); camI = new THREE.PerspectiveCamera(30, 1, 0.1, 20); camI.position.set(0.9, 1.4, 2.6); camI.lookAt(0, 0.34, 0); }
  const o = creerObjet(id); sceneI.add(o); renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(sceneI, camI); renderer.setRenderTarget(null); sceneI.remove(o);
  const px = new Uint8Array(taille * taille * 4); renderer.readRenderTargetPixels(rt, 0, 0, taille, taille, px);
  const c = document.createElement('canvas'); c.width = c.height = taille; const g = c.getContext('2d'), im = g.createImageData(taille, taille);
  for (let y = 0; y < taille; y++) im.data.set(px.subarray((taille - 1 - y) * taille * 4, (taille - y) * taille * 4), y * taille * 4);
  g.putImageData(im, 0, 0); renderer.setClearColor(0x000000, 1); const u = c.toDataURL(); cacheIcones.set(id, u); return u;
}

// ---------- voix et sous-titres ----------
const dispo = new Set();
async function chargerAudio() {
  try { await chargerVoix('voix/'); const r = await fetch('../../audio/jeux/chasse-aux-mots/manifeste.json', { cache: 'no-cache' }); if (!r.ok) return; const m = await r.json();
    const e = {}; for (const p of m.phrases || []) if (p.fichier && p.duree > 0) { e[p.id] = ['/audio/jeux/chasse-aux-mots/' + p.fichier, 0, p.duree]; dispo.add(p.id); } ajouterVoix(e); } catch (er) {}
}
let stTimer = 0;
function sousTitre(texte, qui, ms = 4200) {
  const el = $('sous-titres'); clearTimeout(stTimer); if (!texte) { el.classList.add('cache'); return; }
  el.innerHTML = (qui ? `<b>${qui}</b> ` : '') + texte; el.classList.remove('cache'); stTimer = setTimeout(() => el.classList.add('cache'), ms);
}
// Dit une phrase : la voix si le fichier existe ; le sous-titre s'affiche si l'enfant l'a choisi OU s'il n'y a pas de voix (jamais de consigne muette ET invisible)
function parler(id, texte, qui) {
  const voix = existe(id); reveiller();
  if (voix) direVoix(id); if (etat.sousTitres || !voix) sousTitre(texte, qui);
  return voix;
}

// ---------- guide ----------
let guide = null, guideDef = null;
async function creerGuide(def) {
  try { const { Enfant } = await import('../../voyage/js/personnages.js?v=4'); const e = new Enfant(false, { tunique: def.tunique, pantalon: def.pantalon, cheche: def.cheche, peau: def.peau, sac: false, barbe: def.barbe || null, voile: def.voile || null });
    e.racine.scale.setScalar(1.45); e.racine.position.set(-1.6, 0, 1.4); monde.add(e.racine); return e; } catch (er) { return null; }
}

// ---------- manche ----------
let manche = null, objets = [], boite = null, dernierTap = 0, inactif = 0;
function vider() { while (monde.children.length) { const o = monde.children[0]; monde.remove(o); o.traverse?.(c => { if (c.geometry && !c.geometry.userData.garde) c.geometry.dispose?.(); }); } objets = []; guide = null; }
async function entrer(lieu, niveau) {
  arreterVoix(); vider(); const L = LIEUX[lieu]; scene.background = new THREE.Color(L.ciel); scene.fog.color.set(L.brume); sol.material.color.set(L.sol);
  const decor = creerDecor(lieu); monde.add(decor);
  const params = G.parametres(niveau, etat.age), cibles = G.choisirCibles(L.objets, params.cibles, Math.random, etat.trouves);
  const slots = emplacements(lieu), ordre = [...L.objets].sort(() => Math.random() - 0.5);
  ordre.forEach((id, i) => { const o = creerObjet(id), s = slots[i]; o.scale.setScalar(1.7); o.position.set(s.x, s.y, s.z); o.rotation.y = s.a * 1.7; monde.add(o);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.62 * 1.7 * params.rayon, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(s.x, 0.5, s.z); hit.userData.id = id; monde.add(hit);
    objets.push({ id, mesh: o, hit, base: { x: s.x, z: s.z }, trouve: false, anim: 0, secoue: 0 }); });
  guideDef = GUIDES[L.guide]; creerGuide(guideDef).then(g => { guide = g; });
  manche = { lieu, niveau, params, cibles, i: 0, aides: 0, erreurs: 0, fin: false };
  azCible = az = 0; $('titre-lieu').textContent = `${L.icone} ${L.nom} · niveau ${niveau}`;
  $('accueil').classList.add('cache'); $('fin').classList.add('cache'); $('hud').classList.remove('cache');
  etat.dernier = { lieu, niveau }; sauver();
  // introduction scénarisée (guide), puis la première consigne
  parler('intro.' + lieu, L.intro, guideDef.nom);
  $('cible').classList.add('cache'); const cetteManche = manche; setTimeout(() => { if (manche === cetteManche && !manche.fin) consigne(true); }, existe('intro.' + lieu) ? 4500 : 3600);
}
const cible = () => manche && manche.cibles[manche.i];
function consigne(premier) {
  if (!manche || manche.fin || !cible()) return; const id = cible(), o = OBJETS[id], p = manche.params, el = $('cible'); inactif = 0;
  const m = p.mode; let html = '', phrase, texte;
  if (m === 'image') { html = `<img alt="" src="${icone(id)}"><span class="mot-fr">${o.det}</span>`; phrase = 'trouve.' + id; texte = remplir(PHRASES.trouve.texte, id); }
  else if (m === 'silhouette') { html = `<img class="sil" alt="" src="${icone(id)}"><span class="mot-fr">Quel est cet objet ?</span>`; phrase = 'trouve.' + id; texte = remplir(PHRASES.trouve.texte, id); }
  else if (m === 'mot') { html = (p.image ? `<img alt="" src="${icone(id)}">` : '') + `<span class="mot-fr">${o.fr}</span><span class="mot-ar" lang="ar" dir="rtl">${o.ar}</span>`; phrase = 'trouve_mot.' + id; texte = remplir(PHRASES.trouve_mot.texte, id); }
  else if (m === 'audio') { html = (p.image ? `<img class="sil" alt="" src="${icone(id)}">` : '') + `<span class="ecoute">🔊 Écoute…</span>`; phrase = 'trouve_ecoute.' + id; texte = remplir(PHRASES.trouve_ecoute.texte, id); }
  else { html = (p.image ? `<img class="sil" alt="" src="${icone(id)}">` : '') + `<span class="enigme">${o.enigme}</span>`; phrase = 'enigme.' + id; texte = o.enigme; }
  el.innerHTML = html + `<span class="reste">${manche.i + 1}/${manche.cibles.length}</span>`; el.classList.remove('cache'); el.dataset.phrase = phrase; el.dataset.texte = texte;
  parler(phrase, texte, 'Guide');
}
function reecouter() { const el = $('cible'); if (!manche || manche.fin || !el.dataset.phrase) return; parler(el.dataset.phrase, el.dataset.texte, 'Guide'); }
let indice = null;
function aide(compte = true) {
  if (!manche || manche.fin) return; const ob = objets.find(o => o.id === cible()); if (!ob) return; if (compte) manche.aides++;
  indice = { ob, t: 0 }; parler('aide', PHRASES.aide.texte, 'Loumi'); inactif = 0;
  // l'indice fait pivoter doucement la vue vers l'objet (côté caméra, donc bien visible)
  const th = Math.atan2(ob.base.x, ob.base.z - 1); azCible = th + Math.PI * 2 * Math.round((az - th) / (Math.PI * 2));
}
function touche(clic) {
  if (!manche || manche.fin) return; const r = canvas.getBoundingClientRect(); pt.set(((clic.clientX - r.left) / r.width) * 2 - 1, -((clic.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(pt, camera);
  const hits = ray.intersectObjects(objets.filter(o => !o.trouve).map(o => o.hit)); inactif = 0;
  if (!hits.length) return; const o = objets.find(x => x.hit === hits[0].object);
  if (o.id === cible()) trouve(o); else erreur(o);
}
function trouve(o) {
  o.trouve = true; o.anim = 0.0001; const id = o.id; const k = BRAVOS[manche.i % BRAVOS.length]; manche.i++; indice = null;
  const phrase = k === 'bravo3' ? k : `${k}.${id}`; parler(phrase, remplir(PHRASES[k].texte, id), guideDef.nom); if (guide) guide.faire?.('salut');
  $('cible').classList.add('ok'); setTimeout(() => $('cible').classList.remove('ok'), 900);
  const m0 = manche; if (manche.i >= manche.cibles.length) setTimeout(() => { if (manche === m0) finir(); }, 1700); else setTimeout(() => { if (manche === m0) consigne(); }, 1900);
}
function erreur(o) {
  manche.erreurs++; o.secoue = 0.0001; const k = ERREURS[(manche.erreurs - 1) % ERREURS.length]; parler(k, PHRASES[k].texte, 'Loumi');
  const m1 = manche; if (manche.erreurs % 3 === 0) setTimeout(() => { if (manche === m1) aide(false); }, 1200);          // un petit indice gratuit après quelques essais : jamais de blocage
}
function finir() {
  manche.fin = true; $('cible').classList.add('cache'); const r = G.terminerManche(etat, { lieu: manche.lieu, niveau: manche.niveau, aides: manche.aides, cibles: manche.cibles }); sauver();
  const e = G.etoilesPour(manche.aides); const L = LIEUX[manche.lieu]; arreterVoix();
  const dip = r.diplomes.includes('grand') ? 'fin_grand' : r.diplomes.length ? 'fin_diplome' : 'fin'; parler(dip, PHRASES[dip].texte, guideDef.nom, 7000);
  $('fin-etoiles').textContent = '⭐'.repeat(e) + '☆'.repeat(3 - e); $('fin-titre').textContent = r.diplomes.length ? '🎓 Diplôme d\'explorateur !' : 'Bravo, explorateur !';
  $('fin-mots').innerHTML = manche.cibles.map(id => `<li><img alt="" src="${icone(id, 96)}"><b>${OBJETS[id].fr}</b> <span lang="ar" dir="rtl">${OBJETS[id].ar}</span>${r.mots.includes(id) ? ' <em>nouveau !</em>' : ''}</li>`).join('');
  $('fin-recompenses').innerHTML = [r.lanterne ? '🏮 Une lanterne gagnée' : '', r.etoiles ? `⭐ +${r.etoiles}` : '', ...r.diplomes.map(d => d === 'grand' ? '🏆 Grand explorateur des lanternes' : `🎓 Diplôme : ${LIEUX[d].nom}`)].filter(Boolean).map(x => `<span>${x}</span>`).join('');
  const sv = G.suite(etat, manche.lieu, manche.niveau); const b = $('fin-suite'); b.classList.toggle('cache', !sv); if (sv) { b.textContent = sv.lieu === manche.lieu ? `Niveau ${sv.niveau} ›` : `${LIEUX[sv.lieu].icone} ${LIEUX[sv.lieu].nom} ›`; b.onclick = () => entrer(sv.lieu, sv.niveau); }
  $('fin-rejouer').onclick = () => entrer(manche.lieu, manche.niveau); $('fin').classList.remove('cache'); $('hud').classList.add('cache');
}

// ---------- accueil : lieux et niveaux ----------
let choixLieu = null;
function afficherAccueil() {
  arreterVoix(); manche = null; vider(); scene.background = new THREE.Color('#2a1f6b'); $('hud').classList.add('cache'); $('fin').classList.add('cache'); $('accueil').classList.remove('cache');
  $('age-bloc').classList.toggle('cache', !!etat.age && !$('age-bloc').dataset.ouvert); $('lieux-bloc').classList.toggle('cache', !etat.age);
  $('bilan').textContent = `⭐ ${G.etoilesTotal(etat)} / ${G.MAX_ETOILES}   ·   🏮 ${G.lanternes(etat)}   ·   📖 ${etat.trouves.length} mots`;
  $('lieux').innerHTML = G.LIEUX_IDS.map(l => { const d = LIEUX[l], e = G.etoilesLieu(etat, l); return `<button class="lieu${choixLieu === l ? ' actif' : ''}" data-l="${l}"><span class="ic">${d.icone}</span><b>${d.nom}</b><span class="et">⭐ ${e}/15${etat.diplomes.includes(l) ? ' 🎓' : ''}</span></button>`; }).join('');
  $('lieux').querySelectorAll('button').forEach(b => b.onclick = () => { choixLieu = b.dataset.l; afficherAccueil(); });
  $('niveaux').classList.toggle('cache', !choixLieu);
  if (choixLieu) $('niveaux').innerHTML = `<p>${LIEUX[choixLieu].icone} <b>${LIEUX[choixLieu].nom}</b> — choisis un niveau</p>` + G.NIVEAUX.map(n => { const ouvert = G.niveauOuvert(etat, n), e = (etat.etoiles[choixLieu] || [])[n - 1] || 0; return `<button class="niv" data-n="${n}" ${ouvert ? '' : 'disabled'}><b>${ouvert ? n : '🔒'}</b><span>${G.NOMS_NIVEAUX[n]}</span><i>${'⭐'.repeat(e)}${'☆'.repeat(3 - e)}</i></button>`; }).join('');
  $('niveaux').querySelectorAll('button').forEach(b => b.onclick = () => entrer(choixLieu, Number(b.dataset.n)));
  if (choixLieu) setTimeout(() => $('niveaux').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);      // sur téléphone, la liste des niveaux apparaît sous les lieux : on la montre
  if (!afficherAccueil.dit) { afficherAccueil.dit = true; parler(etat.age ? 'bienvenue' : 'age', etat.age ? PHRASES.bienvenue.texte : PHRASES.age.texte, 'Narratrice'); }
}
document.querySelectorAll('[data-age]').forEach(b => b.onclick = () => { etat.age = b.dataset.age; sauver(); $('age-bloc').dataset.ouvert = ''; afficherAccueil(); });
$('changer-age').onclick = () => { $('age-bloc').dataset.ouvert = '1'; $('reglages').classList.add('cache'); afficherAccueil(); };

// ---------- collection ----------
function afficherCollection() {
  const tous = [...new Set(Object.values(LIEUX).flatMap(l => l.objets))];
  $('collection-liste').innerHTML = tous.map(id => { const vu = etat.trouves.includes(id); return `<li class="${vu ? '' : 'inconnu'}">${vu ? `<img alt="" src="${icone(id, 96)}"><b>${OBJETS[id].fr}</b><span lang="ar" dir="rtl">${OBJETS[id].ar}</span>` : '<i>?</i>'}</li>`; }).join('');
  $('collection-dip').innerHTML = etat.diplomes.length ? etat.diplomes.map(d => `<span>${d === 'grand' ? '🏆 Grand explorateur' : '🎓 ' + LIEUX[d].nom}</span>`).join('') : '<span class="vide">Termine le niveau 5 d\'un lieu pour gagner un diplôme.</span>';
  $('collection').classList.remove('cache');
}

// ---------- commandes ----------
let glisse = null;
canvas.addEventListener('pointerdown', e => { glisse = { x: e.clientX, y: e.clientY, az0: azCible, bouge: false }; canvas.setPointerCapture?.(e.pointerId); });
canvas.addEventListener('pointermove', e => { if (!glisse) return; const dx = e.clientX - glisse.x; if (Math.abs(dx) > 6) glisse.bouge = true; if (glisse.bouge) azCible = glisse.az0 - dx * 0.006; });
canvas.addEventListener('pointerup', e => { if (glisse && !glisse.bouge) touche(e); glisse = null; });
const tourner = d => { azCible += d; };
$('gauche').onclick = () => tourner(-0.6); $('droite').onclick = () => tourner(0.6);
addEventListener('keydown', e => { if (e.key === 'ArrowLeft') tourner(-0.5); else if (e.key === 'ArrowRight') tourner(0.5); else if (e.key === 'h' || e.key === 'H') aide(); });
$('reecouter').onclick = reecouter; $('aide').onclick = () => aide(true); $('cible').onclick = reecouter;
$('retour').onclick = afficherAccueil; $('fin-accueil').onclick = afficherAccueil;
$('btn-collection').onclick = afficherCollection; $('collection-fermer').onclick = () => $('collection').classList.add('cache');
$('btn-reglages').onclick = () => { $('st-case').checked = etat.sousTitres; $('reglages').classList.toggle('cache'); };
$('reglages-fermer').onclick = () => $('reglages').classList.add('cache');
$('st-case').onchange = e => { etat.sousTitres = e.target.checked; sauver(); };
$('volume').oninput = e => { const v = Number(e.target.value); try { reglerVolume('voix', v); const m = lsGet('monde') || {}; m.sons = Object.assign({ musique: 0.5, musiqueActive: true, voix: 1, effets: 0.7 }, m.sons, { voix: v }); lsSet('monde', m); } catch (er) {} };
{ const m = lsGet('monde'); if (m && m.sons && typeof m.sons.voix === 'number') { $('volume').value = m.sons.voix; try { reglerVolume('voix', m.sons.voix); } catch (e) {} } }

// ---------- boucle ----------
let dernier = performance.now();
function boucle(now) {
  const dt = Math.min(0.05, (now - dernier) / 1000); dernier = now; t += dt; requestAnimationFrame(boucle);
  let d = azCible - az; az += d * Math.min(1, dt * 5); placerCamera();
  if (manche && !manche.fin) {
    inactif += dt; if (manche.params.aideAutoMs && inactif * 1000 > manche.params.aideAutoMs) { inactif = 0; aide(false); }
    for (const o of objets) {
      const m = o.mesh;
      if (o.trouve) { o.anim += dt; const k = o.anim; m.position.y = Math.min(3.2, k * 5); m.rotation.y += dt * 8; m.scale.setScalar(Math.max(0.001, 1.7 * (1 - Math.max(0, k - 0.5) * 1.6))); m.visible = m.scale.x > 0.01; o.hit.visible = false; continue; }
      let s = 1.7, y = 0; if (o.secoue > 0) { o.secoue += dt; m.rotation.z = Math.sin(o.secoue * 30) * 0.25 * Math.max(0, 1 - o.secoue * 2); if (o.secoue > 0.6) { o.secoue = 0; m.rotation.z = 0; } }
      if (indice && indice.ob === o) { indice.t += dt; const p = Math.sin(indice.t * 6); s = 1.7 * (1.12 + p * 0.1); y = 0.15 + Math.abs(p) * 0.25; if (indice.t > 5) indice = null; }
      m.scale.setScalar(s); m.position.y = y;
    }
  }
  if (guide) { guide.animer(dt, 0, t); guide.racine.lookAt(camera.position.x, 0, camera.position.z); }
  renderer.render(scene, camera);
}
requestAnimationFrame(boucle);
chargerAudio();
afficherAccueil();
window.__chasse = { etat: () => etat, manche: () => manche, entrer, aide, tap: id => { const o = objets.find(x => x.id === id); if (o) { if (o.id === cible()) trouve(o); else erreur(o); } }, cibleId: cible, objets: () => objets.map(o => o.id), ecran: id => { const o = objets.find(x => x.id === id); if (!o) return null; const v = new THREE.Vector3(o.base.x, 0.6, o.base.z).project(camera); const r = canvas.getBoundingClientRect(); return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height, derriere: v.z > 1 }; }, tourner: a => { az = azCible = a; }, voix: () => [...dispo] };
