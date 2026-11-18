// Le Grand Voyage de Nour : un monde à explorer à pied et à dos de chameau.
// Ce fichier relie tout : terrain, décors, ciel, personnages, commandes, sons, découvertes et carnet.
import * as THREE from 'three';
import { Terrain, LIEUX, LIMITE, lisse } from './terrain.js?v=2';
import { creerDecor } from './decor.js?v=2';
import { Ciel } from './ciel.js?v=2';
import { Enfant, Chameau } from './personnages.js?v=2';
import { Controles, ACTIONS, nomTouche } from './controles.js?v=2';
import { creerOiseaux } from './oiseaux.js?v=2';
import * as S from './sons.js?v=2';
import { ZONES, POINTS, BIENTOT } from './contenu.js?v=2';
import { sauvegarde } from '../../monde/socle/sauvegarde.js?v=2';
import { qualiteAuto, surveillerFluidite } from '../../monde/socle/qualite.js?v=2';
import { textureSol, normalesEau, textureNuage } from './textures.js?v=2';
import { creerEffets } from './effets.js?v=2';
import { creerAventure, MISSIONS } from './aventure.js?v=2';
import { FICHES } from './animaux.js?v=2';
import { creerMarche, MARCHANDS, ARTICLES, article } from './marche.js?v=2';
import { reglageGrain } from './formes.js?v=2';
import { mascotte } from '../../monde/mascottes.js?v=1';

const $ = id => document.getElementById(id);
const attendre = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));

// ---------- progression du voyage (clé « monde_voyage » : incluse dans le transfert et les comptes) ----------
const CLE = 'monde_voyage';
const ETAT0 = { v: 1, zones: [], lus: [], joueur: null, chameau: null, monte: false, cycle: true, heure: 0.3, aideVue: false, colOuvert: false };
let etat;
try { etat = Object.assign({}, ETAT0, JSON.parse(localStorage.getItem(CLE) || '{}')); } catch (e) { etat = { ...ETAT0 }; }
const enregistrer = () => { try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) {} };

// ---------- démarrage ----------
async function demarrer() {
  const canvas = $('scene');
  const profil = choisirProfil();
  const Q = PROFILS[profil]();
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: Q.antialias, powerPreference: 'high-performance' });
  } catch (e) { $('chargement').classList.add('cache'); $('erreur').classList.remove('cache'); return; }
  renderer.setPixelRatio(Q.pixelRatio);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.shadowMap.enabled = !!Q.ombres;
  renderer.shadowMap.type = profil === 'eleve' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  reglageGrain.value = Q.grain;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.3, 1400);
  const TX = { sol: Q.detail ? textureSol(Q.detail) : null, eau: normalesEau(Q.detail >= 512 ? 256 : 128) };
  Q.texNuage = i => textureNuage(i + 1);

  $('chargement-detail').textContent = 'On dessine le désert et les montagnes';
  await attendre();
  const terrain = new Terrain(Q.terrain, TX.sol);
  scene.add(terrain.mesh);
  const H = (x, z) => terrain.hauteur(x, z);

  $('chargement-detail').textContent = 'On construit le village';
  await attendre();
  const decor = creerDecor(scene, terrain, Q, TX);
  decor.construireZone('village');   // avant l'aventure : les objets cachés évitent les maisons
  const effets = creerEffets(scene, terrain, Q);
  const aventure = creerAventure({ scene, terrain, colliders: decor.colliders, etat, enregistrer, sons: S, ombres: !!Q.ombres,
    ui: { dialogue: (p) => dialogue(p), bandeau: (a, b) => bandeau(a, b), indice: (h, ms) => montrerIndice(h, ms), pieces: (t, n, r) => afficherGain(t, n, r), majSuivi: () => majSuivi() } });
  const AV = aventure.A;
  const marche = creerMarche({ scene, terrain, colliders: decor.colliders, ombres: !!Q.ombres });
  for (const p of marche.points) decor.points.push({ id: 'boutique-' + p.id, x: p.x, z: p.z, r: p.r });
  const ciel = new Ciel(scene, Q);
  ciel.regler(etat.heure ?? 0.3);
  const oiseaux = creerOiseaux(scene, H);

  // ---------- personnages ----------
  let enfant = new Enfant(!!Q.ombres); const chameau = new Chameau(!!Q.ombres);
  scene.add(enfant.racine, chameau.racine);
  const J = { x: 2.2, z: 14, a: Math.PI, vx: 0, vz: 0, vit: 0 };            // l'enfant
  const C = { x: 33, z: -9, a: -2.2, vit: 0, venir: false };              // Sablo
  if (etat.joueur) Object.assign(J, etat.joueur);
  if (etat.chameau) Object.assign(C, etat.chameau);
  let monte = !!etat.monte;
  let sequence = null;   // animation pour monter / descendre

  // Nour flotte près de la fontaine pour accueillir l'enfant
  const nour = await spriteMascotte(mascotte('ablutions'));
  const NOUR = { x: -5.5, z: 5 };
  if (nour) { nour.scale.set(1.25, 1.55, 1); scene.add(nour); }
  decor.points.push({ id: 'nour', x: NOUR.x, z: NOUR.z, r: 3.6 });

  // ---------- commandes ----------
  let interface_ouverte = false;
  const ctl = new Controles(canvas, { surAction: action, surChameau: actionChameau, surToucher: () => S.demarrerSons() });
  const touche = id => nomTouche(ctl.r.touches[id], ctl.r);
  $('btn-action').addEventListener('click', action);
  $('btn-chameau').addEventListener('click', actionChameau);

  // ---------- caméra ----------
  const cam = { yaw: J.a + Math.PI, yawCible: J.a + Math.PI, pitch: 0.3, pitchCible: 0.3, dist: 7, zoomPerso: 0, pos: new THREE.Vector3(), cible: new THREE.Vector3() };
  const vSelle = new THREE.Vector3();

  // ---------- déplacements ----------
  const colliders = decor.colliders;
  function bouger(o, dx, dz, rayon, dt) {
    let nx = o.x + dx, nz = o.z + dz;
    // pente trop raide : on glisse le long
    const h0 = H(o.x, o.z), pas = Math.hypot(dx, dz);
    if (pas > 1e-4) {
      const monteTrop = (x, z) => (H(x, z) - h0) / pas > 1.05;
      if (monteTrop(nx, nz)) {
        if (!monteTrop(o.x + dx, o.z)) nz = o.z; else if (!monteTrop(o.x, o.z + dz)) nx = o.x; else { nx = o.x; nz = o.z; }
      }
    }
    for (const c of colliders) {
      const ex = nx - c.x, ez = nz - c.z, r = c.r + rayon;
      if (Math.abs(ex) > r || Math.abs(ez) > r) continue;
      const d = Math.hypot(ex, ez);
      if (d < r && d > 1e-5) { nx = c.x + ex / d * r; nz = c.z + ez / d * r; }
    }
    nx = Math.max(-LIMITE, Math.min(LIMITE, nx)); nz = Math.max(-LIMITE, Math.min(LIMITE, nz));
    if (!decor.col.ouvert && nz < -172) { nz = -172; avertirCol(); }
    o.x = nx; o.z = nz;
  }
  let dernierAvertissement = 0;
  function avertirCol() {
    const t = performance.now();
    if (t - dernierAvertissement > 6000) { dernierAvertissement = t; montrerIndice('🔒 Ce chemin est encore fermé : découvre l\'oasis et le camp des caravanes.', 4000); }
  }
  const angleVers = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };

  // ---------- monter / descendre ----------
  const DUREES = { agenouille: 0.9, saut: 0.75, releve: 0.9 };
  function actionChameau() {
    if (interface_ouverte || sequence) return;
    S.demarrerSons();
    const d = Math.hypot(J.x - C.x, J.z - C.z);
    C.vit = 0; C.venir = false;
    if (monte) sequence = { type: 'descendre', t: 0 };
    else if (d < 4) { sequence = { type: 'monter', t: 0, depart: { x: J.x, z: J.z } }; S.sonChameau(); }
    else { C.venir = true; S.sonChameau(); montrerIndice('🐪 Sablo arrive !', 2500); }
  }
  function avancerSequence(dt) {
    const s = sequence; s.t += dt;
    const t1 = DUREES.agenouille, t2 = t1 + DUREES.saut, t3 = t2 + DUREES.releve;
    const cote = { x: C.x + Math.cos(C.a) * 1.6, z: C.z - Math.sin(C.a) * 1.6 }; // à côté du chameau
    if (s.type === 'monter') {
      if (s.t < t1) {
        chameau.agenouille = lisse(0, t1, s.t);
        const k = s.t / t1; J.x = s.depart.x + (cote.x - s.depart.x) * k; J.z = s.depart.z + (cote.z - s.depart.z) * k;
        J.a += angleVers(J.a, C.a - Math.PI / 2) * Math.min(1, dt * 6); J.vit = 2;
      } else if (s.t < t2) {
        chameau.agenouille = 1; J.vit = 0;
        const k = (s.t - t1) / DUREES.saut; enfant.pose = 'monte';
        chameau.positionSelle(vSelle);
        J.x = cote.x + (vSelle.x - cote.x) * k; J.z = cote.z + (vSelle.z - cote.z) * k;
        J.saut = { k, y: H(cote.x, cote.z) + (vSelle.y - H(cote.x, cote.z)) * k + Math.sin(k * Math.PI) * 0.9 };
        J.a += angleVers(J.a, C.a) * Math.min(1, dt * 8);
      } else if (s.t < t3) {
        J.saut = null; monte = true; enfant.pose = 'monte'; chameau.agenouille = 1 - lisse(t2, t3, s.t);
      } else { chameau.agenouille = 0; sequence = null; finMontee(); }
    } else {
      if (s.t < t1) { chameau.agenouille = lisse(0, t1, s.t); }
      else if (s.t < t2) {
        chameau.agenouille = 1; monte = false;
        const k = (s.t - t1) / DUREES.saut;
        if (!s.depuis) { chameau.positionSelle(vSelle); s.depuis = vSelle.clone(); }
        J.x = s.depuis.x + (cote.x - s.depuis.x) * k; J.z = s.depuis.z + (cote.z - s.depuis.z) * k;
        J.saut = { k, y: s.depuis.y + (H(cote.x, cote.z) - s.depuis.y) * k + Math.sin(k * Math.PI) * 0.6 };
        enfant.pose = k > 0.6 ? 'debout' : 'monte';
      } else if (s.t < t3) { J.saut = null; enfant.pose = 'debout'; chameau.agenouille = 1 - lisse(t2, t3, s.t); }
      else { chameau.agenouille = 0; sequence = null; J.a = C.a; etat.monte = false; enregistrer(); }
    }
  }
  function finMontee() { etat.monte = true; enregistrer(); if (!etat.premiereMontee) { etat.premiereMontee = true; montrerIndice(ctl.tactile ? 'En route ! Maintiens 💨 pour galoper.' : `En route ! Maintiens <kbd>${touche('courir')}</kbd> pour galoper.`, 4500); } }

  // ---------- lieux à lire ----------
  let proche = null, procheAv = null;
  function action() {
    if (interface_ouverte || sequence) return;
    S.demarrerSons();
    if (procheAv && (!proche || procheAv.d < Math.hypot(proche.x - J.x, proche.z - J.z))) procheAv.faire();
    else if (proche) ouvrirLecture(proche.id);
    else if (!monte && Math.hypot(J.x - C.x, J.z - C.z) < 4) caresser();
  }

  // Un câlin à Sablo : il baisse la tête, ronronne à sa façon ; la première fois, on apprend à prendre soin de lui
  function caresser() {
    chameau.caresse = 2.5; S.sonChameau();
    J.a += angleVers(J.a, Math.atan2(C.x - J.x, C.z - J.z));
    if (!etat.lus.includes('soins')) setTimeout(() => ouvrirLecture('soins'), 1600);
    else montrerIndice('💛 Sablo est content !', 2000);
  }

  function ouvrirLecture(id) {
    if (id.startsWith('boutique-')) { ouvrirBoutique(id.slice(9)); return; }
    const cle = id === 'col' ? (decor.col.ouvert ? 'colOuvert' : 'colFerme') : id;
    const p = POINTS[cle]; if (!p) return;
    const nouveau = p.decouverte && !etat.lus.includes(cle);
    if (nouveau) { etat.lus.push(cle); enregistrer(); sauvegarde.gagner('voyage', 'etoiles', 1); }
    if (cle === 'nour') { aventure.parlerNour(nouveau ? p.texte : ''); return; }
    dialogue(p);
    if (nouveau) { S.sonDecouverte(); aventure.gagner(3, 'Nouvelle découverte'); }
  }
  // Fenêtre de dialogue commune (panneaux, mascottes, personnages, animaux) avec des choix possibles
  function dialogue(p) {
    interface_ouverte = true; ctl.bloque = true;
    $('lecture-titre').textContent = p.titre;
    $('lecture-mascotte').innerHTML = p.mascotte === 'nour' ? mascotte('ablutions') : '';
    $('lecture-arabe').textContent = p.arabe || ''; $('lecture-arabe').classList.toggle('cache', !p.arabe);
    $('lecture-texte').textContent = p.texte;
    $('lecture-sous').textContent = p.sous || ''; $('lecture-sous').classList.toggle('cache', !p.sous);
    const src = $('lecture-source');
    src.innerHTML = p.sens ? `<b>${p.sens}</b>${p.source}` : ''; src.classList.toggle('cache', !p.sens);
    const zone = $('lecture-boutons');
    zone.querySelectorAll('.choix').forEach(b => b.remove());
    $('lecture-ok').classList.toggle('cache', !!p.boutons);
    (p.boutons || []).forEach((b, i) => {
      const el = document.createElement('button'); el.className = (i === 0 ? 'gros-bouton' : 'petit-bouton') + ' choix'; el.textContent = b.txt;
      el.onclick = () => { fermerLecture(); b.fn(); };
      zone.appendChild(el);
    });
    $('lecture').classList.remove('cache');
    (zone.querySelector('.choix') || $('lecture-ok')).focus({ preventScroll: true });
    $('lecture-ecouter').onclick = () => parler(p.texte + (p.sous ? ' ' + p.sous.replace(/^[^\wÀ-ÿ]+/, '') : '') + (p.sens ? ' ' + p.sens.replace('Sens du verset : ', 'Le sens de ce verset : ') : ''));
  }
  // Pièces de Nour gagnées : petit « +n » qui monte, la bourse bondit
  let timerGain = null;
  function afficherGain(total, n, raison) {
    $('nb-pieces').textContent = total;
    const b = $('bourse'); b.classList.remove('bondit'); void b.offsetWidth; b.classList.add('bondit');
    const g = $('gain'); g.classList.add('cache'); void g.offsetWidth;
    g.innerHTML = `+${n} <span class="piece"></span><small>${raison || ''}</small>`; g.classList.remove('cache');
    clearTimeout(timerGain); timerGain = setTimeout(() => g.classList.add('cache'), 1450);
  }
  // Le petit cadre de la mission en cours (en haut à gauche)
  function majSuivi() {
    const enCours = Object.keys(MISSIONS).filter(k => AV.missions[k] && AV.missions[k].etat !== 'finie');
    const s = $('suivi');
    if (!enCours.length && !AV.sac.length) { s.classList.add('cache'); return; }
    const k = enCours.includes(AV.suiviPrefere) ? AV.suiviPrefere : enCours[0];
    const nomsSac = AV.sac.map(x => x.startsWith('dattes') ? '🌴' : x.startsWith('eau') ? '💧' : x === 'seau' ? '🪣' : x === 'gourde' ? '🫙' : '🚿').join(' ');
    s.innerHTML = (k ? `${MISSIONS[k].icone} <b>${MISSIONS[k].titre}</b> · ${AV.missions[k].n}/${MISSIONS[k].total}` : '') +
      (AV.sac.length ? `<span class="sac">🎒 ${nomsSac} (${AV.sac.length}/${AV.capacite})</span>` : '');
    s.classList.remove('cache');
  }
  $('suivi').addEventListener('click', () => ouvrirCarnet('missions'));
  $('bourse').addEventListener('click', () => ouvrirCarnet('collection'));
  function fermerLecture() {
    $('lecture').classList.add('cache'); interface_ouverte = false; ctl.bloque = false;
    try { speechSynthesis.cancel(); } catch (e) {}
  }
  $('lecture-ok').addEventListener('click', fermerLecture);
  $('lecture-fermer').addEventListener('click', fermerLecture);
  addEventListener('keydown', e => { if (e.code === 'Escape' && !ctl.capture) { fermerLecture(); fermerCarnet(); fermerPanneaux(); fermerCommandes(); fermerBoutique(); $('carte-fermer').click(); } });

  // Voix du navigateur, en français seulement (le texte arabe du Coran n'est jamais lu par une machine)
  function parler(texte) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texte);
      u.lang = 'fr-FR'; u.rate = 0.92; u.volume = sauvegarde.get().sons.voix ?? 1;
      const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('fr'));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  // ---------- découvertes des zones ----------
  function zoneIci(x, z) {
    if (z < -200) return 'montagnes';
    if (Math.hypot(x - marche.centre.x, z - marche.centre.z) < 17) return 'marche';
    for (const id of ['village', 'oasis', 'camp']) { const l = LIEUX[id]; if (Math.hypot(x - l.x, z - l.z) < l.r + 6) return id; }
    if (Math.hypot(x - LIEUX.dunes.x, z - LIEUX.dunes.z) < LIEUX.dunes.r) return 'dunes';
    return null;
  }
  let zoneActuelle = undefined;
  function verifierZone() {
    const z = zoneIci(J.x, J.z);
    if (z === zoneActuelle) return;
    zoneActuelle = z;
    const info = ZONES.find(o => o.id === z);
    $('lieu').textContent = info ? info.icone + ' ' + info.nom : (J.z < -140 ? '🪨 Le chemin du col' : '🐫 Le désert');
    if (z && !etat.zones.includes(z)) {
      etat.zones.push(z); enregistrer();
      bandeau('Tu découvres', info.nom);
      S.sonDecouverte();
      sauvegarde.gagner('voyage', 'etoiles', 1);
      setTimeout(() => aventure.gagner(5, 'Nouveau lieu'), 900);
      verifierCol(true);
    }
  }
  function verifierCol(annoncer) {
    const ok = etat.colOuvert || (etat.zones.includes('oasis') && etat.zones.includes('camp')) || (sauvegarde.get().etoiles || 0) >= 12;
    if (ok && !decor.col.ouvert) {
      decor.col.ouvert = true;
      if (!etat.colOuvert) {
        etat.colOuvert = true; enregistrer();
        if (annoncer) setTimeout(() => { bandeau('Nouveau chemin', 'Les montagnes'); S.sonPorte(); }, 4500);
      }
    }
  }
  verifierCol(false);
  $('nb-pieces').textContent = AV.pieces;
  let timerBandeau = null;
  function bandeau(petit, nom) {
    const b = $('bandeau'); b.classList.add('cache'); void b.offsetWidth;
    $('bandeau-petit').textContent = petit; $('bandeau-nom').textContent = nom; b.classList.remove('cache');
    clearTimeout(timerBandeau); timerBandeau = setTimeout(() => b.classList.add('cache'), 4300);
  }
  let timerIndice = null, indiceForce = false;
  function montrerIndice(html, ms) {
    const i = $('indice'); i.innerHTML = html; i.classList.remove('cache'); indiceForce = true;
    clearTimeout(timerIndice); timerIndice = setTimeout(() => { indiceForce = false; i.classList.add('cache'); }, ms);
  }

  // ---------- carnet d'aventure ----------
  let ongletCarnet = 'missions';
  function ouvrirCarnet(onglet) {
    fermerPanneaux();
    if (typeof onglet === 'string') ongletCarnet = onglet;
    interface_ouverte = true; ctl.bloque = true;
    const lanternes = AV.ramasses.filter(k => k.startsWith('lanterne')).length;
    $('carnet-resume').innerHTML = `<span class="piece"></span> ${AV.pieces} Pièces de Nour · 🏮 ${lanternes}/12 · 🦊 ${AV.animaux.length}/7 · 🏜️ ${etat.zones.length}/${ZONES.length}`;
    document.querySelectorAll('.onglets button').forEach(b => b.setAttribute('aria-selected', b.dataset.onglet === ongletCarnet));
    $('carnet-contenu').innerHTML = pageCarnet(ongletCarnet);
    $('carnet-contenu').querySelectorAll('[data-basculer]').forEach(b => b.onclick = () => {
      const a = article(b.dataset.basculer), on = ['tapis', 'selle', 'cheche', 'tunique'].includes(a.type) ? AV.equipement[a.type] === a.id : !!AV.equipement[a.id === 'lanterne-sablo' ? a.id : a.type];
      equiper(a, !on); ouvrirCarnet('sablo');
    });
    $('carnet').classList.remove('cache');
  }
  document.querySelectorAll('.onglets button').forEach(b => b.addEventListener('click', () => ouvrirCarnet(b.dataset.onglet)));
  function pageCarnet(o) {
    if (o === 'missions') {
      const ids = Object.keys(MISSIONS);
      const carte = k => { const m = AV.missions[k], M = MISSIONS[k], n = m ? m.n : 0;
        return `<div class="carte-mission ${m && m.etat === 'finie' ? 'finie' : ''}"><h4>${M.icone} ${M.titre}${m && m.etat === 'finie' ? '<span class="etiquette">Réussie ✓</span>' : !m ? '<span class="etiquette">À découvrir</span>' : ''}</h4>
          <p>${m ? M.resume : 'Parle aux habitants et explore pour découvrir cette mission.'}</p><div class="barre"><i style="width:${n / M.total * 100}%"></i></div>
          <p style="margin:6px 0 0;font-size:14px">${n} / ${M.total} · récompense : ${M.recompense} <span class="piece" style="width:16px;height:16px;vertical-align:-3px"></span></p></div>`; };
      const enCours = ids.filter(k => AV.missions[k] && AV.missions[k].etat !== 'finie'), finies = ids.filter(k => AV.missions[k] && AV.missions[k].etat === 'finie'), autres = ids.filter(k => !AV.missions[k]);
      return (enCours.length ? '<h3>En cours</h3>' + enCours.map(carte).join('') : '') + (finies.length ? '<h3>Terminées</h3>' + finies.map(carte).join('') : '') + (autres.length ? '<h3>À découvrir</h3>' + autres.map(carte).join('') : '');
    }
    if (o === 'collection') {
      const l = i => AV.ramasses.includes('lanterne' + i);
      const objets = [['seau', '🪣', 'Le seau'], ['gourde', '🫙', 'La gourde'], ['arrosoir', '🚿', 'L\'arrosoir'], ['medaillon', '⭐', 'Le médaillon de l\'oasis'], ['jarre', '🏺', 'La jarre de la grotte']];
      const achats = (AV.achats || []);
      return `<h3>🏮 Les lanternes cachées</h3><div class="grille-collection">${Array.from({ length: 12 }, (_, i) => `<div class="${l(i) ? '' : 'manque'}"><span>🏮</span>${l(i) ? 'Trouvée' : '?'}</div>`).join('')}</div>
        <h3>🧺 Objets trouvés</h3><div class="grille-collection">${objets.map(([k, ic, nom]) => `<div class="${AV.ramasses.includes(k) ? '' : 'manque'}"><span>${ic}</span>${AV.ramasses.includes(k) ? nom : '?'}</div>`).join('')}</div>
        <h3>🛍️ Mes achats au marché</h3>${achats.length ? `<div class="grille-collection">${achats.map(a => `<div><span>${a.icone}</span>${a.nom}</div>`).join('')}</div>` : '<p class="note">Rien pour l\'instant. Le marché du village t\'attend !</p>'}
        <h3><span class="piece"></span> Mes Pièces de Nour : ${AV.pieces}</h3><p class="note">On les gagne en jouant (missions, découvertes, lanternes, animaux). On ne les achète jamais avec de l'argent.</p>`;
    }
    if (o === 'animaux') {
      return Object.entries(FICHES).map(([id, f]) => AV.animaux.includes(id)
        ? `<div class="fiche-animal"><span>${f.icone}</span><div><b>${f.nom}</b><p>🏠 ${f.habitat}</p><p>${f.vie}</p></div></div>`
        : `<div class="fiche-animal" style="opacity:.5"><span>❔</span><div><b>Animal à découvrir</b><p>Cherche-le et observe-le doucement.</p></div></div>`).join('');
    }
    if (o === 'sablo') {
      const mes = ARTICLES.filter(a => (AV.achats || []).some(x => x.id === a.id) && a.type !== 'outil');
      return `<p>Sablo est ton compagnon de voyage. Prends soin de lui : de l'eau, de l'ombre, du repos et de la douceur.</p>
        <h3>Parures de Sablo et habits</h3>${mes.length ? mes.map(a => { const on = ['tapis', 'selle', 'cheche', 'tunique'].includes(a.type) ? AV.equipement[a.type] === a.id : !!AV.equipement[a.id === 'lanterne-sablo' ? a.id : a.type];
          return `<div class="article"><span class="ico">${a.icone}</span><div><h4>${a.nom}</h4><p class="effet">${a.effet}</p></div><button class="${on ? 'equipe' : ''}" data-basculer="${a.id}">${on ? '✓ Utilisé' : 'Utiliser'}</button></div>`; }).join('')
          : '<p class="note">Hassan et Amina vendent des selles, des tapis, des sacoches et des habits au marché du village.</p>'}
        <h3>🧰 Mon équipement</h3><div class="grille-collection">${ARTICLES.filter(a => a.type === 'outil').map(a => `<div class="${AV.equipement[a.id] ? '' : 'manque'}"><span>${a.icone}</span>${AV.equipement[a.id] ? a.nom : '?'}</div>`).join('')}</div>`;
    }
    const lus = etat.lus.filter(k => POINTS[k] && POINTS[k].decouverte);
    return `<h3>Les lieux</h3><ul class="carnet-lieux">${ZONES.map(z => etat.zones.includes(z.id) ? `<li><span class="ico">${z.icone}</span>${z.nom}</li>` : `<li class="pas-vu"><span class="ico">❔</span>À découvrir…</li>`).join('')}</ul>
      <h3>Mes découvertes</h3><ul class="carnet-decouvertes">${lus.length ? lus.map(k => `<li>✨ ${POINTS[k].decouverte}</li>`).join('') : '<li class="vide">Cherche les pierres avec une lanterne dorée et lis-les : tes découvertes s\'écriront ici.</li>'}</ul>
      <h3>Bientôt</h3><ul class="carnet-lieux bientot">${BIENTOT.map(b => `<li><span class="ico">${b.icone}</span>${b.nom}</li>`).join('')}</ul>`;
  }
  function fermerCarnet() { if ($('carnet').classList.contains('cache')) return; $('carnet').classList.add('cache'); interface_ouverte = false; ctl.bloque = false; }
  $('btn-carnet').addEventListener('click', ouvrirCarnet);
  $('carnet-fermer').addEventListener('click', fermerCarnet);
  $('carnet').addEventListener('click', e => { if (e.target.id === 'carnet') fermerCarnet(); });

  // ---------- sons et réglages ----------
  const sons = () => sauvegarde.get().sons;
  function majPanneauSon() {
    const s = sons();
    $('musique-active').checked = !!s.musiqueActive;
    $('vol-musique').value = Math.round((s.musique ?? 0.5) * 100);
    $('vol-effets').value = Math.round((s.effets ?? 0.7) * 100);
    $('vol-voix').value = Math.round((s.voix ?? 1) * 100);
  }
  const changerSons = () => {
    const s = Object.assign({}, sons(), { musiqueActive: $('musique-active').checked, musique: $('vol-musique').value / 100, effets: $('vol-effets').value / 100, voix: $('vol-voix').value / 100 });
    sauvegarde.regler('sons', s); S.demarrerSons(); S.reglerSons(s);
  };
  ['musique-active', 'vol-musique', 'vol-effets', 'vol-voix'].forEach(id => $(id).addEventListener('input', changerSons));
  function fermerPanneaux() { $('panneau-son').classList.add('cache'); $('panneau-reglages').classList.add('cache'); }
  $('btn-son').addEventListener('click', () => { const ouvrir = $('panneau-son').classList.contains('cache'); fermerPanneaux(); if (ouvrir) { majPanneauSon(); $('panneau-son').classList.remove('cache'); } });
  $('son-fermer').addEventListener('click', fermerPanneaux);
  $('btn-reglages').addEventListener('click', () => {
    const ouvrir = $('panneau-reglages').classList.contains('cache'); fermerPanneaux();
    if (!ouvrir) return;
    $('cycle-jour').checked = etat.cycle !== false;
    document.querySelectorAll('input[name=qualite]').forEach(r => { r.checked = r.value === profil; });
    $('panneau-reglages').classList.remove('cache');
  });
  $('reglages-fermer').addEventListener('click', fermerPanneaux);
  $('cycle-jour').addEventListener('change', e => { etat.cycle = e.target.checked; enregistrer(); });
  document.querySelectorAll('input[name=qualite]').forEach(r => r.addEventListener('change', () => { etat.profil = r.value; enregistrer(); location.reload(); }));
  $('revoir-aide').addEventListener('click', () => { fermerPanneaux(); montrerAide(); });

  function montrerAide() {
    const k = id => `<kbd>${touche(id)}</kbd>`;
    document.querySelector('.aide-clavier').innerHTML = `<p>${k('avancer')}${k('gauche')}${k('reculer')}${k('droite')} ou les flèches : marcher</p>
      <p>${k('courir')} : courir</p><p>Souris (clic maintenu) : tourner la caméra · molette : zoomer</p>
      <p>${k('interagir')} : lire, parler, ramasser</p><p>${k('chameau')} : monter sur le chameau ou descendre</p>`;
    interface_ouverte = true; ctl.bloque = true; $('aide').classList.remove('cache');
  }

  // ---------- personnalisation des commandes ----------
  function remplirCommandes() {
    const r = ctl.r;
    $('cmd-taille').value = Math.round(r.taille * 100); $('cmd-opacite').value = Math.round(r.opacite * 100);
    $('cmd-sensibilite').value = Math.round(r.sensibilite * 100); $('cmd-tactile').checked = !!r.tactileForce;
    document.querySelectorAll('input[name=disposition]').forEach(x => { x.checked = x.value === r.disposition; });
    $('cmd-touches').innerHTML = ACTIONS.map(a => `<li><span>${a.nom}</span><button data-action="${a.id}">${touche(a.id)}</button></li>`).join('');
    $('cmd-touches').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      b.textContent = 'Appuie…'; b.classList.add('attente');
      ctl.ecouterTouche(b.dataset.action, () => remplirCommandes());
    }));
  }
  $('ouvrir-commandes').addEventListener('click', () => { fermerPanneaux(); remplirCommandes(); $('panneau-commandes').classList.remove('cache'); interface_ouverte = true; ctl.bloque = true; });
  const fermerCommandes = () => { if ($('panneau-commandes').classList.contains('cache')) return; $('panneau-commandes').classList.add('cache'); ctl.capture = null; interface_ouverte = false; ctl.bloque = false; dernierEtatBoutons = ''; };
  $('commandes-fermer').addEventListener('click', fermerCommandes);
  $('cmd-taille').addEventListener('input', e => { ctl.r.taille = e.target.value / 100; ctl.sauver(); });
  $('cmd-opacite').addEventListener('input', e => { ctl.r.opacite = e.target.value / 100; ctl.sauver(); });
  $('cmd-sensibilite').addEventListener('input', e => { ctl.r.sensibilite = e.target.value / 100; ctl.sauver(); });
  $('cmd-tactile').addEventListener('change', e => { ctl.r.tactileForce = e.target.checked; ctl.tactile = e.target.checked || matchMedia('(pointer: coarse)').matches; ctl.sauver(); dernierEtatBoutons = ''; });
  document.querySelectorAll('input[name=disposition]').forEach(x => x.addEventListener('change', () => { ctl.r.disposition = x.value; ctl.r.positions = {}; ctl.sauver(); }));
  $('cmd-defaut').addEventListener('click', () => { ctl.reinitialiser(); remplirCommandes(); });
  $('cmd-deplacer').addEventListener('click', () => {
    fermerCommandes(); interface_ouverte = true; ctl.bloque = true;
    if (!ctl.tactile) { ctl.tactile = true; ctl.appliquer(); }
    $('barre-edition').classList.remove('cache'); ctl.editer(true);
  });
  $('edition-fini').addEventListener('click', () => { $('barre-edition').classList.add('cache'); ctl.editer(false); ctl.tactile = ctl.r.tactileForce || matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0); ctl.appliquer(); interface_ouverte = false; ctl.bloque = false; dernierEtatBoutons = ''; });
  $('edition-defaut').addEventListener('click', () => { ctl.r.positions = {}; ctl.sauver(); ctl.editer(true); });
  $('aide-partir').addEventListener('click', () => {
    $('aide').classList.add('cache'); interface_ouverte = false; ctl.bloque = false;
    etat.aideVue = true; enregistrer();
    S.demarrerSons(); S.reglerSons(sons());
  });

  // ---------- équipement acheté au marché ----------
  let lumiere = null;
  function appliquerEquipement() {
    const E = AV.equipement, a = id => article(E[id]) || null;
    AV.capacite = E.sac ? 6 : 3;
    chameau.habiller({ tapis: a('tapis') ? a('tapis').couleurs : undefined, selle: a('selle') ? a('selle').couleur : undefined, sacoches: !!E.sacoches, pompons: !!E.pompons, lanterne: !!E['lanterne-sablo'] });
    // les habits de l'enfant
    const pose = enfant.pose, ancien = enfant.racine;
    const nouveau = new Enfant(!!Q.ombres, { tunique: a('tunique') ? a('tunique').couleur : undefined, cheche: a('cheche') ? a('cheche').couleur : undefined });
    nouveau.racine.position.copy(ancien.position); nouveau.racine.rotation.copy(ancien.rotation); nouveau.pose = pose;
    scene.remove(ancien); scene.add(nouveau.racine); enfant = nouveau;
    $('btn-carte').classList.toggle('cache', !E.carte);
    $('btn-jumelles').classList.toggle('cache', !E.jumelles);
    if (E.lanterne && !lumiere) { lumiere = new THREE.PointLight('#ffc870', 0, 14, 1.6); scene.add(lumiere); }
    enregistrer(); majSuivi();
  }

  function ouvrirBoutique(id) {
    const M = MARCHANDS[id];
    interface_ouverte = true; ctl.bloque = true;
    $('boutique-icone').textContent = M.icone; $('boutique-nom').textContent = M.nom; $('boutique-accueil').textContent = M.accueil;
    $('boutique-pieces').textContent = AV.pieces;
    const achete = a => (AV.achats || []).some(x => x.id === a.id);
    const equipe = a => a.type === 'outil' ? !!AV.equipement[a.id] : ['tapis', 'selle', 'cheche', 'tunique'].includes(a.type) ? AV.equipement[a.type] === a.id : !!AV.equipement[a.id === 'lanterne-sablo' ? 'lanterne-sablo' : a.type];
    $('boutique-articles').innerHTML = ARTICLES.filter(a => a.marchand === id).map(a => {
      let bouton;
      if (!achete(a)) bouton = AV.pieces >= a.prix ? `<button class="prix" data-acheter="${a.id}">${a.prix} 🪙 Acheter</button>` : `<button class="trop-cher" data-manque="${a.id}">${a.prix} 🪙 · il manque ${a.prix - AV.pieces}</button>`;
      else if (a.type === 'outil') bouton = `<button class="a-toi">✓ À toi</button>`;
      else bouton = equipe(a) ? `<button class="equipe" data-retirer="${a.id}">✓ Utilisé · retirer</button>` : `<button data-utiliser="${a.id}">Utiliser</button>`;
      return `<div class="article"><span class="ico">${a.icone}</span><div><h4>${a.nom}</h4><p>${a.desc}</p><p class="effet">${a.effet}</p></div>${bouton}</div>`;
    }).join('');
    const z = $('boutique-articles');
    z.querySelectorAll('[data-acheter]').forEach(b => b.onclick = () => confirmerAchat(article(b.dataset.acheter), id));
    z.querySelectorAll('[data-manque]').forEach(b => b.onclick = () => montrerIndice('Continue tes missions pour gagner des Pièces de Nour !', 2500));
    z.querySelectorAll('[data-utiliser]').forEach(b => b.onclick = () => { equiper(article(b.dataset.utiliser), true); ouvrirBoutique(id); });
    z.querySelectorAll('[data-retirer]').forEach(b => b.onclick = () => { equiper(article(b.dataset.retirer), false); ouvrirBoutique(id); });
    $('boutique').classList.remove('cache');
  }
  function fermerBoutique() { if ($('boutique').classList.contains('cache')) return; $('boutique').classList.add('cache'); interface_ouverte = false; ctl.bloque = false; dernierEtatBoutons = ''; }
  $('boutique-fermer').addEventListener('click', fermerBoutique);
  function confirmerAchat(a, marchand) {
    $('boutique').classList.add('cache');
    dialogue({ titre: `${a.icone} ${a.nom}`, texte: `Veux-tu acheter ${a.nom.toLowerCase()} pour ${a.prix} Pièces de Nour ?`, sous: a.effet,
      boutons: [{ txt: 'Oui, j\'achète !', fn: () => {
        if (AV.pieces < a.prix) return;
        AV.pieces -= a.prix; AV.achats = (AV.achats || []).concat([{ id: a.id, nom: a.nom, icone: a.icone, quand: Date.now() }]);
        $('nb-pieces').textContent = AV.pieces; S.sonPiece();
        equiper(a, true);
        bandeau('Nouvel achat', a.nom);
        setTimeout(() => ouvrirBoutique(marchand), 50);
      } }, { txt: 'Non merci', fn: () => setTimeout(() => ouvrirBoutique(marchand), 50) }] });
  }
  function equiper(a, oui) {
    const E = AV.equipement;
    if (['tapis', 'selle', 'cheche', 'tunique'].includes(a.type)) E[a.type] = oui ? a.id : null;
    else E[a.type === 'outil' || a.id === 'lanterne-sablo' ? a.id : a.type] = oui;
    appliquerEquipement();
  }

  // ---------- la carte du pays ----------
  function dessinerCarte() {
    const cv = $('carte-canvas'), x = cv.getContext('2d'), N = cv.width, k = N / 760, X = v => (v + 380) * k;
    if (!dessinerCarte.fond) {
      const img = x.createImageData(N, N), col = terrain.mesh.geometry.attributes.color, n1 = terrain.n + 1;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const wx = i / k - 380, wz = j / k - 380, gi = Math.round((wx + 400) / terrain.pas), gj = Math.round((wz + 400) / terrain.pas), v = gj * n1 + gi;
        const o = (j * N + i) * 4, f = 255 * 1.08;
        img.data[o] = Math.min(255, Math.pow(col.getX(v), 1 / 2.2) * f); img.data[o + 1] = Math.min(255, Math.pow(col.getY(v), 1 / 2.2) * f); img.data[o + 2] = Math.min(255, Math.pow(col.getZ(v), 1 / 2.2) * f); img.data[o + 3] = 255;
      }
      dessinerCarte.fond = img;
    }
    x.putImageData(dessinerCarte.fond, 0, 0);
    x.fillStyle = '#4fc3d8'; x.beginPath(); x.arc(X(LIEUX.oasis.x), X(LIEUX.oasis.z), LIEUX.oasis.lac * k, 0, 7); x.fill();
    x.font = 'bold 15px Nunito, sans-serif'; x.textAlign = 'center';
    const lieux = [['village', 0, 0, -1], ['marche', marche.centre.x, marche.centre.z, 1], ['oasis', LIEUX.oasis.x, LIEUX.oasis.z, 1], ['camp', LIEUX.camp.x, LIEUX.camp.z, 1], ['dunes', LIEUX.dunes.x, LIEUX.dunes.z, 1], ['montagnes', 0, -265, 1]];
    for (const [id, lx, lz, sens] of lieux) {
      const z = ZONES.find(o => o.id === id), vu = etat.zones.includes(id);
      x.font = '26px sans-serif'; x.fillText(vu ? z.icone : '❔', X(lx), X(lz) + 8);
      x.font = 'bold 14px Nunito, sans-serif'; x.lineWidth = 4; x.strokeStyle = 'rgba(255,248,231,.85)';
      const ty = X(lz) + (sens > 0 ? 28 : -18);
      if (vu) { x.strokeText(z.nom, X(lx), ty); x.fillStyle = '#3a2a1a'; x.fillText(z.nom, X(lx), ty); }
      x.fillStyle = '#4fc3d8';
    }
    if (!etat.lus.includes('etoiles')) { x.font = '22px sans-serif'; x.fillText('✨', X(-70), X(238)); }
    x.font = '24px sans-serif'; x.fillText('🐪', X(C.x), X(C.z) + 8);
    x.save(); x.translate(X(J.x), X(J.z)); x.rotate(-J.a + Math.PI); x.fillStyle = '#c94f3c'; x.strokeStyle = '#fff'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(0, -12); x.lineTo(9, 10); x.lineTo(0, 5); x.lineTo(-9, 10); x.closePath(); x.stroke(); x.fill(); x.restore();
  }
  $('btn-carte').addEventListener('click', () => { interface_ouverte = true; ctl.bloque = true; dessinerCarte(); $('carte-pays').classList.remove('cache'); });
  $('carte-fermer').addEventListener('click', () => { $('carte-pays').classList.add('cache'); interface_ouverte = false; ctl.bloque = false; });

  // ---------- les jumelles ----------
  let jumelles = false;
  $('btn-jumelles').addEventListener('click', () => {
    jumelles = !jumelles;
    $('btn-jumelles').classList.toggle('actif', jumelles);
    camera.fov = jumelles ? 16 : 55; camera.updateProjectionMatrix();
    aventure.reperes(jumelles);
    let v = $('vue-jumelles');
    if (jumelles && !v) { v = document.createElement('div'); v.id = 'vue-jumelles'; document.body.appendChild(v); }
    if (v) v.classList.toggle('cache', !jumelles);
    if (jumelles) montrerIndice('🔭 Tourne la caméra pour observer au loin. Les lanternes cachées brillent !', 3500);
  });

  // ---------- la boucle ----------
  const horloge = new THREE.Clock();
  let tTotal = 0, tSauvegarde = 0, tZone = 0;
  // si l'appareil peine, on allège tout de suite (et on propose le profil inférieur la prochaine fois)
  const fluidite = surveillerFluidite(() => {
    renderer.setPixelRatio(1);
    if (!etat.profil && profil !== 'faible') { etat.profilAuto = profil === 'eleve' ? 'equilibre' : 'faible'; enregistrer(); }
  });
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false); });
  const premierCadre = (() => { const v = new THREE.Vector3(); return v; })();
  let phasePasEnfant = 0, phasePasChameau = 0;

  function image() {
    const dt = Math.min(0.05, horloge.getDelta());
    tTotal += dt;
    fluidite();

    // --- l'enfant ou le chameau avance ---
    const d = ctl.direction();
    const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
    let wx = rx * d.x + fx * d.y, wz = rz * d.x + fz * d.y;
    const force = Math.min(1, Math.hypot(wx, wz));
    if (sequence) avancerSequence(dt);
    else if (monte) {
      // le chameau tourne doucement vers la direction voulue, puis avance
      const vmax = d.course ? 11 : 5.5;
      let cibleV = 0;
      if (force > 0.05) {
        const voulu = Math.atan2(wx, wz), ecart = angleVers(C.a, voulu);
        C.a += Math.sign(ecart) * Math.min(Math.abs(ecart), dt * (d.course ? 1.8 : 2.4));
        cibleV = vmax * force * Math.max(0.15, Math.cos(Math.min(Math.abs(ecart), 1.4)));
      }
      C.vit += (cibleV - C.vit) * Math.min(1, dt * (cibleV > C.vit ? 2.2 : 3.5));
      bouger(C, Math.sin(C.a) * C.vit * dt, Math.cos(C.a) * C.vit * dt, 1.1, dt);
      J.x = C.x; J.z = C.z; J.a = C.a; J.vit = 0;
    } else {
      const vmax = (d.course ? 6.2 : 3.3) * (d.analogique || 0);
      const tx = force > 0.05 ? wx / force * vmax : 0, tz = force > 0.05 ? wz / force * vmax : 0;
      const k = Math.min(1, dt * 10);
      J.vx += (tx - J.vx) * k; J.vz += (tz - J.vz) * k;
      const avant = { x: J.x, z: J.z };
      bouger(J, J.vx * dt, J.vz * dt, 0.35, dt);
      J.vit = Math.hypot(J.x - avant.x, J.z - avant.z) / Math.max(dt, 1e-4);
      if (Math.hypot(J.vx, J.vz) > 0.3) J.a += angleVers(J.a, Math.atan2(J.vx, J.vz)) * Math.min(1, dt * 12);
      // Sablo vient quand on l'appelle
      if (C.venir) {
        const ex = J.x - C.x, ez = J.z - C.z, dist = Math.hypot(ex, ez);
        if (dist < 3.4) { C.venir = false; C.vit = 0; }
        else {
          const ecart = angleVers(C.a, Math.atan2(ex, ez));
          C.a += Math.sign(ecart) * Math.min(Math.abs(ecart), dt * 2.5);
          C.vit += ((dist > 20 ? 9 : 5) - C.vit) * Math.min(1, dt * 2);
          bouger(C, Math.sin(C.a) * C.vit * dt, Math.cos(C.a) * C.vit * dt, 1.1, dt);
        }
      } else C.vit *= Math.max(0, 1 - dt * 4);
    }

    // --- placer les modèles ---
    chameau.racine.position.set(C.x, H(C.x, C.z), C.z);
    chameau.racine.rotation.y = C.a;
    { const dEnf = Math.hypot(J.x - C.x, J.z - C.z);
      chameau.regard = !monte && !sequence && dEnf < 7 && dEnf > 0.5 ? angleVers(C.a, Math.atan2(J.x - C.x, J.z - C.z)) : null; }
    chameau.animer(dt, sequence ? 0 : C.vit, tTotal);
    chameau.racine.updateMatrixWorld(true);
    if (monte || (sequence && enfant.pose === 'monte' && !J.saut)) {
      chameau.positionSelle(vSelle);
      enfant.racine.position.set(vSelle.x, vSelle.y - 0.62, vSelle.z);
      enfant.racine.rotation.set(chameau.corps.rotation.x, C.a, chameau.corps.rotation.z);
    } else if (J.saut) {
      enfant.racine.position.set(J.x, J.saut.y - (enfant.pose === 'monte' ? 0.62 : 0), J.z);
      enfant.racine.rotation.set(0, J.a, 0);
    } else {
      enfant.racine.position.set(J.x, H(J.x, J.z), J.z);
      enfant.racine.rotation.set(0, J.a, 0);
    }
    enfant.animer(dt, J.vit, tTotal);

    // --- bruits de pas ---
    if (!monte && J.vit > 0.3) { const p = Math.floor(enfant.phase / Math.PI); if (p !== phasePasEnfant) {
      phasePasEnfant = p; const sol = terrain.matiere(J.x, J.z);
      S.pasEnfant(sol.herbe > 0.35 ? 'herbe' : 'sable');
      effets.poser('enfant', J.x + Math.sin(J.a) * 0.1, J.z + Math.cos(J.a) * 0.1, J.a, p % 2 ? 0.11 : -0.11);
    } }
    if (C.vit > 0.4 && chameau.agenouille === 0) { const p = Math.floor(chameau.phase / Math.PI); if (p !== phasePasChameau) {
      phasePasChameau = p; const dc = Math.hypot(C.x - J.x, C.z - J.z); S.pasChameau(Math.max(0.15, 1 - dc / 40) * (C.vit > 8 ? 1.2 : 0.8));
      // à l'amble, les deux pieds d'un même côté se posent ensemble
      const cote = p % 2 ? 0.34 : -0.34, fx = Math.sin(C.a), fz = Math.cos(C.a);
      for (const av of [0.75, -0.75]) effets.poser('chameau', C.x + fx * av, C.z + fz * av, C.a, cote);
    } }

    // --- caméra ---
    const camIn = ctl.prendreCamera();
    cam.yawCible -= camIn.x; cam.pitchCible = Math.max(-0.05, Math.min(1.15, cam.pitchCible + camIn.y));
    cam.zoomPerso = Math.max(-3.5, Math.min(9, cam.zoomPerso + camIn.zoom));
    const enMouvement = monte ? C.vit > 0.8 : J.vit > 0.8;
    if (enMouvement && performance.now() / 1000 - ctl.derniereCamera > 2.2 && !interface_ouverte) {
      const derriere = (monte ? C.a : J.a) + Math.PI;
      cam.yawCible += angleVers(cam.yawCible, derriere) * Math.min(1, dt * (monte ? 1.1 : 0.8));
    }
    // la caméra suit en douceur (pas de saccade, même avec un doigt nerveux)
    cam.yaw += angleVers(cam.yaw, cam.yawCible) * Math.min(1, dt * 12);
    cam.pitch += (cam.pitchCible - cam.pitch) * Math.min(1, dt * 12);
    const distBase = (monte || (sequence && sequence.type === 'monter')) ? 10.5 : 6.5;
    cam.dist += (distBase + cam.zoomPerso - cam.dist) * Math.min(1, dt * 3);
    const cibleY = monte ? vSelle.y + 1.0 : enfant.racine.position.y + 1.35;
    cam.cible.lerp(premierCadre.set(monte ? C.x : J.x, cibleY, monte ? C.z : J.z), Math.min(1, dt * 10));
    const cp = Math.cos(cam.pitch);
    let px = cam.cible.x + Math.sin(cam.yaw) * cp * cam.dist, pz = cam.cible.z + Math.cos(cam.yaw) * cp * cam.dist;
    let py = cam.cible.y + Math.sin(cam.pitch) * cam.dist;
    py = Math.max(py, H(px, pz) + 0.7);
    cam.pos.set(px, py, pz);
    if (jumelles) {
      // aux jumelles : on regarde depuis les yeux de l'enfant, dans la direction de la caméra
      const tete = premierCadre.set(enfant.racine.position.x, enfant.racine.position.y + 1.3, enfant.racine.position.z);
      const dir = cam.cible.clone().sub(cam.pos).normalize();
      camera.position.copy(tete); camera.lookAt(tete.x + dir.x * 10, tete.y + dir.y * 10 + 0.8, tete.z + dir.z * 10);
    } else {
      camera.position.copy(cam.pos);
      camera.lookAt(cam.cible);
    }

    // --- monde vivant ---
    const nuit = ciel.maj(dt, cam.cible, etat.cycle !== false);
    decor.maj({ x: J.x, z: J.z }, tTotal, nuit);
    oiseaux.maj(dt, tTotal, nuit);
    { const sol = terrain.matiere(J.x, J.z), village = Math.hypot(J.x, J.z) < 60;
      effets.maj(dt, { x: J.x, z: J.z }, village ? 0 : (1 - sol.herbe) * (1 - nuit * 0.6) * (0.5 + 0.5 * Math.sin(tTotal * 0.15) ** 2), tTotal); }
    if (nour) nour.position.set(NOUR.x, H(NOUR.x, NOUR.z) + 1.6 + Math.sin(tTotal * 1.8) * 0.12, NOUR.z);

    // --- ce qu'on peut faire ici ---
    proche = null;
    let meilleur = Infinity;
    for (const p of decor.points) { const dd = Math.hypot(p.x - J.x, p.z - J.z); if (dd < p.r && dd < meilleur) { meilleur = dd; proche = p; } }
    procheAv = sequence ? null : aventure.interaction(J);
    aventure.maj(dt, tTotal, J, monte ? C.vit > 6 : J.vit > 4.2, nuit);
    marche.maj(dt, tTotal, J);
    if (lumiere) { lumiere.intensity = 2.2 * Math.max(nuit, 0.05); lumiere.position.set(enfant.racine.position.x, enfant.racine.position.y + 1.6, enfant.racine.position.z); }
    majBoussole();
    const pres = !monte && Math.hypot(J.x - C.x, J.z - C.z) < 4;
    const loin = !monte && !C.venir && Math.hypot(J.x - C.x, J.z - C.z) > 18;
    majBoutons(pres, loin);

    // --- sons d'ambiance ---
    tZone += dt;
    if (tZone > 0.4) {
      tZone = 0; verifierZone();
      const dO = Math.hypot(J.x - LIEUX.oasis.x, J.z - LIEUX.oasis.z), dF = Math.hypot(J.x, J.z), dC = Math.hypot(J.x - LIEUX.camp.x, J.z - LIEUX.camp.z);
      S.majSons(0.4, {
        nuit, altitude: Math.max(0, H(J.x, J.z) - 2),
        procheEau: Math.max(lisse(55, 20, dO), lisse(16, 3, dF) * 0.5),
        procheFeu: lisse(16, 3, dC),
        procheVert: Math.max(lisse(60, 20, dF), lisse(70, 25, dO)),
        desert: 1 - Math.max(lisse(60, 25, dF), lisse(70, 30, dO))
      });
    }

    // --- sauvegarde régulière ---
    tSauvegarde += dt;
    if (tSauvegarde > 3) {
      tSauvegarde = 0;
      etat.joueur = { x: +J.x.toFixed(2), z: +J.z.toFixed(2), a: +J.a.toFixed(3) };
      etat.chameau = { x: +C.x.toFixed(2), z: +C.z.toFixed(2), a: +C.a.toFixed(3) };
      etat.monte = monte && !sequence; etat.heure = +ciel.p.toFixed(4);
      enregistrer();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(image);
  }

  // La boussole (achetée au marché) montre où aller pour la mission en cours
  function majBoussole() {
    const b = $('boussole');
    if (!AV.equipement.boussole) { b.classList.add('cache'); return; }
    const cible = aventure.prochaineCible(J);
    b.classList.toggle('cache', !cible || interface_ouverte);
    if (!cible) return;
    const rel = angleVers(cam.yaw + Math.PI, Math.atan2(cible.x - J.x, cible.z - J.z));
    $('boussole-aiguille').style.transform = `rotate(${-rel}rad)`;
  }
  let dernierEtatBoutons = '';
  function majBoutons(pres, loin) {
    const avPrio = procheAv && (!proche || procheAv.d < Math.hypot(proche.x - J.x, proche.z - J.z));
    const lire = avPrio ? procheAv.label : proche ? (proche.id === 'nour' ? 'Parler' : proche.id.startsWith('boutique-') ? 'Acheter' : 'Lire') : (pres && !sequence ? 'Caresser' : null);
    const cham = sequence ? null : monte ? 'Descendre' : pres ? 'Monter' : loin ? 'Appeler' : null;
    const cle = lire + '|' + cham + '|' + interface_ouverte;
    if (cle === dernierEtatBoutons) return;
    dernierEtatBoutons = cle;
    $('btn-action').classList.toggle('cache', !lire || interface_ouverte);
    if (lire) { $('btn-action').querySelector('.txt').textContent = lire; $('btn-action').querySelector('.ico').textContent = (avPrio && procheAv.icone) || { Parler: '💬', Caresser: '🤲', Acheter: '🛍️' }[lire] || '✋'; }
    $('btn-chameau').classList.toggle('cache', !cham || interface_ouverte);
    if (cham) $('btn-chameau').querySelector('.txt').textContent = cham;
    if (!indiceForce && !ctl.tactile) {
      const morceaux = [];
      if (lire) morceaux.push(`<kbd>${touche('interagir')}</kbd> ${lire}`);
      if (cham) morceaux.push(`<kbd>${touche('chameau')}</kbd> ${cham === 'Appeler' ? 'Appeler Sablo' : cham === 'Monter' ? 'Monter sur Sablo' : 'Descendre de Sablo'}`);
      $('indice').innerHTML = morceaux.join(' &nbsp;·&nbsp; ');
      $('indice').classList.toggle('cache', !morceaux.length || interface_ouverte);
    }
  }

  // ---------- prêt ----------
  // Première image avant d'enlever l'écran de chargement (évite un écran noir)
  appliquerEquipement();
  if (monte) enfant.pose = 'monte';
  cam.cible.set(J.x, H(J.x, J.z) + 1.4, J.z);
  verifierZone();
  renderer.compile(scene, camera);
  requestAnimationFrame(image);
  await attendre();
  $('chargement').classList.add('cache');
  $('hud').classList.remove('cache');
  $('tactile').classList.remove('cache');
  if (!etat.aideVue) montrerAide();
  else { const go = () => { S.demarrerSons(); S.reglerSons(sons()); removeEventListener('pointerdown', go); removeEventListener('keydown', go); }; addEventListener('pointerdown', go); addEventListener('keydown', go); }

  // pour les tests
  window.__voyage = {
    etat, J, C, decor, ciel, H, cam, aventure, action: () => action(),
    teleporter(x, z) { J.x = x; J.z = z; if (monte) { C.x = x; C.z = z; } },
    monte: () => monte, sequence: () => sequence, proche: () => proche, zone: () => zoneActuelle,
    infos: () => renderer.info.render
  };
}

// ---------- profils graphiques ----------
const dpr = () => window.devicePixelRatio || 1;
const PROFILS = {
  faible: () => ({ nom: 'faible', leger: true, terrain: 140, pixelRatio: 1, antialias: false, ombres: false, densiteDeco: 0.5, etoiles: 250,
    detail: 256, grain: 0, nuages: 7, particules: 0, empreintes: 50, brumeProche: 70, brumeLoin: 330 }),
  equilibre: () => ({ nom: 'equilibre', leger: false, terrain: 200, pixelRatio: Math.min(dpr(), 1.5), antialias: false, ombres: true, ombresTaille: 1024,
    densiteDeco: 0.8, etoiles: 500, detail: 512, grain: 1, nuages: 11, particules: 140, empreintes: 110, brumeProche: 100, brumeLoin: 440 }),
  eleve: () => ({ nom: 'eleve', leger: false, terrain: 260, pixelRatio: Math.min(dpr(), 2), antialias: true, ombres: true, ombresTaille: 2048,
    densiteDeco: 1, etoiles: 800, detail: 512, grain: 1, nuages: 15, particules: 280, empreintes: 160, brumeProche: 120, brumeLoin: 520 })
};
// Choix automatique selon l'appareil (modifiable dans les réglages)
function choisirProfil() {
  if (PROFILS[etat.profil]) return etat.profil;
  if (PROFILS[etat.profilAuto]) return etat.profilAuto;
  if (sauvegarde.get().qualite === 'leger' || qualiteAuto() === 'leger') return 'faible';
  const tactile = matchMedia('(pointer: coarse)').matches;
  const mem = navigator.deviceMemory || 4, coeurs = navigator.hardwareConcurrency || 4;
  if (tactile || mem < 6 || coeurs < 6) return 'equilibre';
  return 'eleve';
}

// Transforme le dessin SVG d'une mascotte en image flottante dans le monde
function spriteMascotte(svg) {
  return new Promise(ok => {
    if (!svg) return ok(null);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="300" ')], { type: 'image/svg+xml' }));
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = 240; c.height = 300;
      c.getContext('2d').drawImage(img, 0, 0, 240, 300);
      URL.revokeObjectURL(url);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      ok(new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true })));
    };
    img.onerror = () => ok(null);
    img.src = url;
  });
}

demarrer().catch(e => {
  console.error(e);
  $('chargement').classList.add('cache');
  $('erreur').classList.remove('cache');
});
