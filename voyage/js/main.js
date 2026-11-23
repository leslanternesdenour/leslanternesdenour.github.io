// Le Grand Voyage de Nour : un monde à explorer à pied et à dos de chameau.
// Ce fichier relie tout : terrain, décors, ciel, personnages, commandes, sons, découvertes et carnet.
import './route/bac-a-sable-demarrage.js';   // mode test isolé (?sandbox=1) : doit rester le PREMIER import
import * as THREE from 'three';
import { Terrain, LIEUX, LIMITE, lisse, activerSortieRoute } from './terrain.js?v=3';
import { creerDecor } from './decor.js?v=6';
import { Ciel } from './ciel.js?v=3';
import { Enfant, Chameau } from './personnages.js?v=4';
import { Controles, ACTIONS, nomTouche } from './controles.js?v=3';
import { creerOiseaux } from './oiseaux.js?v=3';
import { creerFaucon } from './faucon.js?v=4';
import * as S from './sons.js?v=3';
import { chargerVoixVoyage, direTextes, direIds, direMotArabe, arreterVoixVoyage, ajouterPhrases } from './voix.js?v=5';
import { chargerPremium, MESSAGE_FERME } from './premium.js?v=1';
import { ZONES, POINTS, BIENTOT, DESCRIPTIONS_LIEUX } from './contenu.js?v=4';
import { sauvegarde } from '../../monde/socle/sauvegarde.js?v=3';
import { qualiteAuto, surveillerFluidite } from '../../monde/socle/qualite.js?v=2';
import { textureSol, normalesEau, textureNuage } from './textures.js?v=3';
import { creerEffets } from './effets.js?v=3';
import { creerAventure, MISSIONS } from './aventure.js?v=4';
import { FICHES } from './animaux.js?v=4';
import { creerMarche, MARCHANDS, ARTICLES, article } from './marche.js?v=3';
import { RARETES, articlesDuJour, modeleObjet } from './catalogue.js?v=3';
import { Voyageur, TENUES, PEAUX, convient } from './voyageur.js?v=9';
import { creerCour } from './cour.js?v=3';
import { MONTURES, monture, creerMonture, creerEcurie, FICHES_ESPECES } from './montures.js?v=5';
import { ECURIE as ECURIE_PLAN, NID_LOUMI, dansEnclos, pres as presEcurie, etape as etapeEnclos, sortie as sortieEnclos } from './enclos-plan.js?v=3';
import { creerVeille } from './veille.js?v=1';
import { COLLECTIONS, BADGES, progressionCollection } from './succes.js?v=3';
import { creerGuide } from './guide.js?v=3';
import { creerQuetes, QUETES, CATEGORIES_QUETES, SPOTS } from './quetes.js?v=4';
import { creerRegions, REGIONS } from './regions.js?v=4';
import { illustration, ICONE_MOTS, ICONE_SON } from './illustrations.js?v=3';
import { creerEffetDecouverte } from './decouverte.js?v=3';
import { MOTS } from './quetes.js?v=4';
import { creerCarte, CATEGORIES } from './carte.js?v=3';
import { creerBourse } from './economie.js?v=3';
import { creerQuotidien } from './quotidien.js?v=3';
import { reglageGrain, materiau } from './formes.js?v=4';
import { mascotte } from '../../monde/mascottes.js?v=3';
import { creerLoumi } from './loumi.js?v=5';
import { creerHabitants } from './habitants.js?v=2';
import { creerHud } from './hud.js?v=1';
import { routeActive } from './route/drapeau.js';
import { noeud as noeudLoumi, depart as departLoumi } from './loumi-dialogues.js?v=2';
import { creerSoins, BESOINS, INFOS, LIEUX_SOINS, DUREES as DUREES_SOINS, poseSoin, PLANCHER, BAS } from './soins.js?v=2';

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

  // Zones Premium : le serveur dit ce qui est ouvert et envoie leur contenu. En cas d'échec, seules les zones gratuites s'ouvrent.
  const accesPromis = chargerPremium({ POINTS, DESCRIPTIONS_LIEUX, SPOTS, ajouterPhrases })
    .catch(() => ({ zoneOuverte: id => !['camp', 'dunes', 'col', 'montagnes', 'wadi', 'rochers'].includes(id), missionOuverte: id => !['lanternes', 'tresor', 'voyageur', 'animaux'].includes(id) }));
  $('chargement-detail').textContent = 'On dessine le désert et les montagnes';
  await attendre();
  // La Route vers La Mecque : préproduction et machine locale seulement (voir route/drapeau.js). Sur le vrai site, rien de tout cela n'existe.
  const ROUTE = routeActive();
  let donneesRoute = null;
  if (ROUTE) {
    donneesRoute = await import('./route/donnees.js');
    activerSortieRoute(donneesRoute.SORTIE_VILLAGE);
    LIEUX.route = { x: 352, z: 50, r: 30 };
    REGIONS.route = donneesRoute.REGION_ROUTE;
    BADGES.push(...(await import('./route/badges-route.js')).BADGES_ROUTE);
    if (!MONTURES.some(m => m.id === 'route')) MONTURES.push({ id: 'route', fem: true, nom: 'Rihla', espece: 'dromadaire', race: 'Dromadaire de la grande route', icone: '🐪', rarete: 'peu', prix: 0, offerte: true, hist: 'attesté',
      robe: ['#d9b27a', '#c99a60', '#7a5636'], desc: 'Offerte à la fin de la première grande étape de la route. Calme et endurante, elle adore les longues routes.', vitesse: [5.8, 11.5] });
  }
  const terrain = new Terrain(Q.terrain, TX.sol);
  scene.add(terrain.mesh);
  const H = (x, z) => terrain.hauteur(x, z);

  $('chargement-detail').textContent = 'On construit le village';
  await attendre();
  const acces = await accesPromis;
  const decor = creerDecor(scene, terrain, Q, TX);
  decor.construireZone('village');   // avant l'aventure : les objets cachés évitent les maisons
  const effets = creerEffets(scene, terrain, Q);
  const aventure = creerAventure({ scene, terrain, colliders: decor.colliders, etat, enregistrer, sons: S, ombres: !!Q.ombres, acces,
    donner: (id, n, raison) => bourse.recompense(id, n, raison, ouDonner()), evenement: (t, i) => quotidien && quotidien.evenement(t, i),
    ui: { dialogue: (p) => dialogue(p), decouverte: d => decouvrir(d), bandeau: (a, b) => bandeau(a, b), indice: (h, ms) => montrerIndice(h, ms), pieces: (t, n, r) => afficherGain(t, n, r), majSuivi: () => majSuivi() } });
  const AV = aventure.A;
  // les habits portés : un jeu pour la voyageuse, un pour le voyageur (les anciens habits du garçon sont gardés)
  if (!AV.tenues) {
    AV.tenues = { fille: {}, garcon: {} };
    if (AV.equipement.tunique) AV.tenues.garcon.corps = AV.equipement.tunique;
    if (AV.equipement.cheche) AV.tenues.garcon.coiffe = AV.equipement.cheche;
    delete AV.equipement.tunique; delete AV.equipement.cheche;
  }
  if (!AV.cour) AV.cour = {};
  if (!AV.montures) AV.montures = ['sablo'];
  if (!AV.montures.includes(AV.monture)) AV.monture = 'sablo';
  const nomMonture = () => monture(AV.monture).nom;
  // le personnage choisi est rangé dans le profil de l'enfant (clé « monde »), jamais changé tout seul
  const perso = () => sauvegarde.get().personnage || null;
  // les phrases s'accordent avec le personnage choisi (fille ou garçon)
  const ACCORDS = [[/(\b[Tt]u es arrivé)(?!e)/g, '$1e'], [/\bun vrai explorateur/g, 'une vraie exploratrice'], [/m'a accueilli(?!e)/g, "m'a accueillie"]];
  const accord = t => (t && (perso() || {}).genre === 'fille') ? ACCORDS.reduce((x, [re, r]) => x.replace(re, r), t) : t;
  chargerVoixVoyage();
  const genre = () => (perso() && perso().genre) || 'fille';
  const tenueActuelle = () => AV.tenues[genre()] || (AV.tenues[genre()] = {});
  // la bourse : les pièces tombent au sol devant l'enfant et se ramassent toutes seules
  const bourse = creerBourse({ scene, terrain, A: AV, enregistrer, sons: S, ui: {
    annonce: (n, raison) => montrerIndice(`<span class="piece"></span> ${raison} : ${n} pièces à ramasser !`, 3200),
    rappel: n => setTimeout(() => montrerIndice(`<span class="piece"></span> ${n} pièces t'attendent juste à côté de toi !`, 4000), 1500),
    versBourse: (x, y, img) => envolPiece(x, y, img),
    gain: (total, n) => afficherGain(total, n, '')
  } });
  const ouDonner = () => monte ? { x: C.x, z: C.z, a: C.a } : { x: J.x, z: J.z, a: J.a };
  // le quotidien : missions du jour, questions de l'ancien, pièces des jeux du village
  let quotidien = null;
  quotidien = creerQuotidien({ etat, A: AV, enregistrer, age: sauvegarde.get().age,
    donner: (id, n, raison) => bourse.recompense(id, n, raison, ouDonner()),
    ui: { dialogue: p => dialogue(p), majSuivi: () => majSuivi() } });
  // les quêtes : mots arabes, plantes, énigmes du souk, grande traversée
  const quetes = creerQuetes({ scene, terrain, colliders: decor.colliders, AV, etat, enregistrer, ombres: !!Q.ombres,
    donner: (id, n, raison) => bourse.recompense(id, n, raison, ouDonner()),
    ui: { dialogue: p => dialogue(p), decouverte: d => decouvrir(d), bandeau: (a, b) => { bandeau(a, b); S.sonDecouverte(); }, evenement: t => quotidien.evenement(t) } });
  // La Route : le relais du guide, le panneau et l'éboulis du seuil (la barrière s'ouvre comme celles du wadi et des rochers)
  const village = ROUTE ? (await import('./route/village-route.js')).creerVillageRoute({ scene, H, colliders: decor.colliders, ombres: !!Q.ombres }) : null;
  if (village) decor.barrieres.route = village.barriere;
  // les régions à débloquer (le wadi, les rochers gravés)
  const regions = creerRegions({ etat, AV, enregistrer, barrieres: decor.barrieres, acces,
    ui: { debloquee: (id, R) => { setTimeout(() => { bandeau('Nouvelle région débloquée !', `${R.icone} ${R.nom}`); S.sonPorte(); montrerIndice(`🗺️ ${R.nom} est ouvert : regarde ta carte !`, 4000); }, 600); } } });
  // Hakim, l'ancien du village (personnage imaginaire) : il pose des questions chaque jour
  const hakim = new Enfant(!!Q.ombres, { tunique: '#efe6d2', pantalon: '#cfc2a8', cheche: '#ffffff', peau: '#c08a62', sac: false, barbe: '#f4f1ea' });
  hakim.racine.scale.setScalar(1.22);
  { let x = -10, z = -10; for (let k = 0; k < 4; k++) for (const c of decor.colliders) { const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz); if (d < c.r + 0.6 && d > 0) { x = c.x + dx / d * (c.r + 0.6); z = c.z + dz / d * (c.r + 0.6); } }
    hakim.racine.position.set(x, H(x, z), z); hakim.racine.rotation.y = Math.atan2(-x, -z); scene.add(hakim.racine);
    decor.colliders.push({ x, z, r: 0.45 }); decor.points.push({ id: 'sage', x, z, r: 3.2 }); }
  const marche = creerMarche({ scene, terrain, colliders: decor.colliders, ombres: !!Q.ombres });
  for (const p of marche.points) decor.points.push({ id: 'boutique-' + p.id, x: p.x, z: p.z, r: p.r });
  // ma cour, devant ma maison du village
  const cour = creerCour({ scene, terrain, colliders: decor.colliders, ombres: !!Q.ombres });
  decor.points.push({ id: 'cour', x: cour.centre.x, z: cour.centre.z, r: 3.5 });
  // l'écurie, près de l'enclos de Sablo
  const ecurie = creerEcurie({ scene, terrain, colliders: decor.colliders, ombres: !!Q.ombres });
  decor.points.push({ id: 'ecurie', x: ecurie.point.x, z: ecurie.point.z, r: 3.2 });
  const ciel = new Ciel(scene, Q);
  ciel.regler(etat.heure ?? 0.3);
  const oiseaux = creerOiseaux(scene, H);

  // ---------- personnages ----------
  let enfant = new Voyageur(!!Q.ombres, perso() || {}, {}); let chameau = creerMonture(AV.monture, !!Q.ombres);
  scene.add(enfant.racine, chameau.racine);
  // des ombres douces au pied de l'enfant et de la monture : ils sont bien posés sur le sol (même sans ombres projetées)
  const ombreDouce = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 31);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const blobs = [0, 1].map(() => { const g = new THREE.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#2a1c10', alphaMap: ombreDouce, transparent: true, opacity: Q.ombres ? 0.28 : 0.42, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
    m.renderOrder = 2; scene.add(m); return m; });
  const J = { x: 2.2, z: 14, a: Math.PI, vx: 0, vz: 0, vit: 0 };            // l'enfant
  const C = { x: 33, z: -9, a: -2.2, vit: 0, venir: false };              // Sablo
  if (etat.joueur) Object.assign(J, etat.joueur);
  if (etat.chameau) Object.assign(C, etat.chameau);
  let monte = !!etat.monte;
  let sequence = null;   // animation pour monter / descendre

  let nuitActuelle = false, zoneVillage = true;
  const soins = creerSoins({ A: AV, enregistrer });
  const hud = creerHud();                  // interface contextuelle : tout ce qui n'est pas essentiel apparaît puis s'efface (voir hud.js)
  let suiviPret = false; setTimeout(() => { suiviPret = true; }, 5000);      // pas d'affichage de mission pendant le démarrage

  // ============ Les habitants du village : registre commun ============
  // Un habitant ne parle JAMAIS de lui-même : il apparaît comme action « Parler » quand l'enfant s'approche, et sa conversation se ferme quand l'enfant s'éloigne.
  const habitants = creerHabitants();
  // LOUMI, la petite lanterne : habitante FIXE du village, à l'entrée du souk. Elle ne suit pas l'enfant, ne monte pas sur la monture.
  // Mémoire et dialogues PROPRES (loumi-dialogues.js) : rien n'est partagé avec Nour, les missions ou le carnet.
  const LOUMI_POS = { x: NID_LOUMI.x, z: NID_LOUMI.z };      // son nid, dans l'enclos de l'écurie, à côté des montures (enclos-plan.js)
  const loumi = creerLoumi({ scene, terrain, ombres: !!Q.ombres, x: LOUMI_POS.x, z: LOUMI_POS.z, regard: NID_LOUMI.regard });
  decor.colliders.push({ x: LOUMI_POS.x, z: LOUMI_POS.z, r: 0.7 });
  // La Route vers La Mecque : un second monde chargé à la demande (aucun système du village n'est dupliqué : bourse, habitants, dialogues, régions, montures)
  function fondu() {
    let f = $('fondu-route'); if (!f) { f = document.createElement('div'); f.id = 'fondu-route'; f.style.cssText = 'position:fixed;inset:0;z-index:60;background:#ecd9ac;opacity:0;pointer-events:none'; document.body.appendChild(f); }
    f.style.transition = 'none'; f.style.opacity = '0.96'; void f.offsetWidth; f.style.transition = 'opacity 1s ease'; f.style.opacity = '0';
  }
  let regard = null;   // la caméra se tourne doucement vers un point (arrivée dans la cité) ; l'enfant garde la main
  const route = ROUTE ? (await import('./route/jeu-route.js')).creerRoute({ regarder: (x, z, s) => { regard = { x, z, t: s }; }, scene, terrain, Q, TX, ombres: !!Q.ombres, etat, AV, enregistrer, habitants, regions, village, J, C,
    monte: () => monte, age: () => sauvegarde.get().age,
    donner: (id, n, raison) => bourse.recompense(id, n, raison, ouDonner()),
    arreterGuide: () => { guide.arreter(); etat.guidage = null; enregistrer(); majGuidage(null); },
    surSaut: () => { cam.cible.set(J.x, H(J.x, J.z) + 1.4, J.z); cam.distVue = null; cam.yawCible = cam.yaw = J.a + Math.PI; },
    ui: { dialogue: p => dialogue(p), decouvrir: d => decouvrir(d), bandeau: (a, b) => { bandeau(a, b); S.sonDecouverte(); }, indice: (h, ms) => montrerIndice(h, ms),
      lieu: t => { $('lieu').textContent = t; hud.temporaire($('lieu'), 4500); }, fondu,
      carteOuverte: () => { fermerPanneaux(); interface_ouverte = true; ctl.bloque = true; }, carteFermee: () => { interface_ouverte = false; ctl.bloque = false; dernierEtatBoutons = ''; } } }) : null;
  etat.loumi = Object.assign({ rencontre: false, vus: [], rappels: {} }, etat.loumi || {});
  if (!etat.loumi.rappels || typeof etat.loumi.rappels !== 'object') etat.loumi.rappels = {};
  function parlerLoumi(id) {
    const n = noeudLoumi(id || departLoumi(etat.loumi), { tactile: !!ctl.tactile }); if (!n) return;
    etat.loumi.rencontre = true; if (!etat.loumi.vus.includes(n.id)) etat.loumi.vus.push(n.id); enregistrer();
    loumi.reagir(n.id === 'accueil' ? 'joie' : 'parle');
    dialogue({ titre: 'Loumi', mascotte: 'loumi', texte: n.texte, boutons: n.choix.map(c => ({ txt: c.txt, fn: () => { if (c.vers) setTimeout(() => parlerLoumi(c.vers), 60); else habitants.ferme(); } })) });
    habitants.marquer('loumi');
  }
  habitants.ajouter({ id: 'loumi', x: LOUMI_POS.x, z: LOUMI_POS.z, rayon: 3.4, label: 'Parler', icone: '💬', ouvrir: () => parlerLoumi() });
  // LA VEILLE DE LOUMI : elle regarde l'état RÉEL de la monture choisie (soins.js). Un rappel = une petite bulle 3D au-dessus d'elle, seulement quand l'enfant est
  // près de l'enclos ; jamais de conversation automatique, jamais de répétition tant que le besoin n'a pas empiré, et la bulle disparaît dès que le besoin est satisfait.
  const veille = creerVeille({ soins, memoire: etat.loumi.rappels, nom: id => monture(id).nom, fem: id => !!monture(id).fem });
  const RAYON_RAPPEL = 16;
  const bulleLoumi = (() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 160; const g = c.getContext('2d');
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, opacity: 0 })); sp.renderOrder = 20; sp.scale.set(4.8, 1.5, 1); sp.visible = false; scene.add(sp);
    const etatB = { besoin: null, t: 0, duree: 0, id: null };
    function ecrire(txt) {
      g.clearRect(0, 0, 512, 160); g.fillStyle = 'rgba(255,250,235,0.96)'; g.strokeStyle = '#b9822a'; g.lineWidth = 6;
      g.beginPath(); g.roundRect(6, 6, 500, 118, 28); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(236, 122); g.lineTo(256, 154); g.lineTo(276, 122); g.closePath(); g.fillStyle = 'rgba(255,250,235,0.96)'; g.fill();
      g.fillStyle = '#3a2a14'; g.font = 'bold 27px Arial'; g.textAlign = 'center';
      const mots = txt.split(' '); const lignes = []; let cur = '';
      for (const w of mots) { if (g.measureText(cur + ' ' + w).width > 450 && cur) { lignes.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }
      lignes.push(cur); const y0 = 65 - (lignes.length - 1) * 17;
      lignes.forEach((ln, i) => g.fillText(ln, 256, y0 + i * 34 + 8)); tex.needsUpdate = true;
    }
    return {
      etat: etatB, visible: () => etatB.besoin !== null,
      montrer(besoin, txt, id, duree = 8) { ecrire(txt); etatB.besoin = besoin; etatB.id = id; etatB.t = 0; etatB.duree = duree; sp.visible = true; },
      cacher() { etatB.besoin = null; sp.visible = false; sp.material.opacity = 0; },
      maj(dt, t) {
        if (etatB.besoin === null) return; etatB.t += dt;
        const k = Math.min(1, etatB.t / 0.5, Math.max(0, (etatB.duree - etatB.t) / 0.7));       // apparaît et s'efface en douceur
        sp.material.opacity = k; sp.position.set(LOUMI_POS.x, H(LOUMI_POS.x, LOUMI_POS.z) + 3.5 + Math.sin(t * 1.6) * 0.06, LOUMI_POS.z);
        if (etatB.t >= etatB.duree) this.cacher();
      }
    };
  })();
  let veilleT = 0, veilleDepart = 0, saluee = false, besoinEnCours = null;
  function majVeille(dt, t) {
    bulleLoumi.maj(dt, t);
    veilleDepart += dt; veilleT += dt; if (veilleDepart < 4 || veilleT < 0.5) return; veilleT = 0;
    const dEnclos = Math.hypot(J.x - LOUMI_POS.x, J.z - LOUMI_POS.z);
    // salutation : un petit saut de joie quand l'enfant arrive près d'elle (une seule fois par passage)
    if (dEnclos < 6 && !saluee && !interface_ouverte) { saluee = true; loumi.reagir('joie'); } else if (dEnclos > 12) saluee = false;
    besoinEnCours = dEnclos < RAYON_RAPPEL ? veille.prioritaire(AV.monture) : null;
    if (bulleLoumi.visible()) {
      const b = bulleLoumi.etat;
      if (b.id !== AV.monture || !veille.encoreVrai(b.id, b.besoin) || dEnclos > RAYON_RAPPEL + 6 || interface_ouverte || monte) bulleLoumi.cacher();      // besoin satisfait / enfant parti : la bulle disparaît
      return;
    }
    if (dEnclos > RAYON_RAPPEL || interface_ouverte || monte || sequence || soin) return;
    const r = veille.aSignaler(AV.monture); if (!r) return;
    veille.marquer(AV.monture, r.besoin, r.palier); enregistrer();       // une seule fois pour ce niveau de besoin
    bulleLoumi.montrer(r.besoin, r.texte, AV.monture, 8);
    loumi.reagir('surprise');
  }

  // NOUR (la goutte d'eau) : habitant FACULTATIF, désactivé par défaut (réglage `etat.options.nourHabitant`). Il garde son identité et ses anciens dialogues,
  // mais n'est plus nécessaire à rien : les missions se commencent au carnet et se rendent au panier.
  let nourSprite = null; const NOUR = { x: -8.4, z: 6.8 };
  etat.options = Object.assign({ nourHabitant: false }, etat.options || {});
  if (etat.options.nourHabitant === true) {
    spriteMascotte(mascotte('ablutions')).then(sp => { if (sp) { sp.scale.set(1.25, 1.55, 1); scene.add(sp); nourSprite = sp; } });
    habitants.ajouter({ id: 'nour', x: NOUR.x, z: NOUR.z, rayon: 3.6, label: 'Parler', icone: '💬', ouvrir: () => ouvrirLecture('nour') });
  }

  // ============ soins de la monture ============
  let soin = null;                   // { type, lieu, phase: 'va' | 'soin', t }
  let pose = { type: null, k: 0 };   // pose 3D en cours (0 = debout)
  const date0 = () => new Date().toISOString().slice(0, 10);
  const lieuDe = type => type === 'boire' ? 'eau' : type === 'manger' ? 'foin' : 'litiere';
  const actionsLieu = { eau: 'boire', foin: 'manger' };
  function interactionSoins() {
    if (monte || sequence || interface_ouverte) return null;
    let best = null;
    for (const [id, l] of Object.entries(LIEUX_SOINS)) {
      const d = Math.hypot(l.objet.x - J.x, l.objet.z - J.z); if (d > l.rayon || (best && best.d <= d)) continue;
      const type = id === 'litiere' ? (nuitActuelle ? 'dormir' : 'repos') : actionsLieu[id];
      const label = type === 'boire' ? 'Faire boire' : type === 'manger' ? 'Donner à manger' : type === 'dormir' ? 'Faire dormir' : 'Faire reposer';
      best = { label, icone: l.icone, d, faire: () => lancerSoin(type, id) };
    }
    return best;
  }
  // S'OCCUPER : près de sa monture dans l'enclos, un seul bouton — on choisit pour l'enfant le soin le plus utile (le besoin réel le plus bas), sinon un câlin.
  function sOccuper() {
    const b = veille.prioritaire(AV.monture);
    const type = b === 'soif' ? 'boire' : b === 'faim' ? 'manger' : (b === 'repos' || b === 'energie') ? (nuitActuelle ? 'dormir' : 'repos') : null;
    if (!type) { caresser(); return; }
    lancerSoin(type, lieuDe(type));
  }
  // EXAMINER : près d'une monture qui se repose à sa place, on ouvre sa fiche (nom, histoire, « Partir avec … »)
  function interactionMontures() {
    if (monte || sequence || interface_ouverte || soin) return null;
    const places = ecurie.placesRepos ? ecurie.placesRepos(AV.montures, AV.monture) : [];
    const dAct = surSaPlace() ? Math.hypot(J.x - C.x, J.z - C.z) : Infinity;
    let best = null;
    for (const r of places) { const d = Math.hypot(J.x - r.x, J.z - r.z); if (d < (r.grande ? 3.6 : 2.6) && d < dAct && (!best || d < best.d)) best = { d, id: r.id }; }
    return best ? { label: 'Examiner', icone: '🔍', d: best.d, faire: () => ficheMonture(best.id, () => {}) } : null;
  }
  function lancerSoin(type, lieu) {
    if (soin || monte || sequence) return;
    soin = { type, lieu, phase: 'va', t: 0 }; C.venir = false; C.rentre = false; enfant.faire('salut');
    montrerIndice(`${nomMonture()} arrive ! ${type === 'boire' ? 'Regarde-' + (monture(AV.monture).fem ? 'la' : 'le') + ' boire.' : type === 'manger' ? 'Bon appétit !' : type === 'dormir' ? 'Chut… on dort.' : 'Un peu de repos.'}`, 3000);
  }
  // Les montures qui ne servent pas restent à leur place dans l'enclos. Seule l'enfant les en fait sortir (en montant dessus ou en les choisissant).
  // La place se déduit de l'ordre de AV.montures : aucune donnée de sauvegarde nouvelle. Au désert (loin de l'écurie), une monture laissée là-bas n'est jamais rangée.
  const placeActive = () => ecurie.placeDe(AV.monture, AV.montures);
  const surSaPlace = () => { const p = placeActive(); return !!p && Math.hypot(C.x - p.x, C.z - p.z) < 0.9; };
  function ranger(immediat) {            // pose la monture sur sa place (au chargement d'une ancienne sauvegarde)
    const p = placeActive(); if (!p) return false; C.x = p.x; C.z = p.z; C.a = p.a; C.vit = 0; C.venir = false; C.rentre = false; return true;
  }
  function majRentree(dt) {
    const p = placeActive();
    const peut = p && !monte && !sequence && !soin && !C.venir && presEcurie(C.x, C.z) && Math.hypot(C.x - p.x, C.z - p.z) > 0.9
      && (dansEnclos(C.x, C.z) || Math.hypot(J.x - C.x, J.z - C.z) > 14);
    if (!peut && !C.rentre) return;
    if (!peut) { C.rentre = false; return; }
    if (!C.rentre) C.rentre = true;
    const cib = etapeEnclos(C, p), final = cib === p || (cib.x === p.x && cib.z === p.z);
    const ex = cib.x - C.x, ez = cib.z - C.z, dist = Math.hypot(ex, ez);
    if (dist > 0.3 || !final) {
      const ecart = angleVers(C.a, Math.atan2(ex, ez)); C.a += Math.sign(ecart) * Math.min(Math.abs(ecart), dt * 2.6);
      C.vit += ((dist > 15 ? 6 : 3.4) - C.vit) * Math.min(1, dt * 3);
      const pas = Math.min(dist, C.vit * dt); C.x += ex / dist * pas; C.z += ez / dist * pas;
    } else {
      C.vit *= Math.max(0, 1 - dt * 6);
      const ecart = angleVers(C.a, p.a); C.a += Math.sign(ecart) * Math.min(Math.abs(ecart), dt * 2.6);
      if (Math.abs(ecart) < 0.05 && C.vit < 0.2) { C.x = p.x; C.z = p.z; C.a = p.a; C.vit = 0; C.rentre = false; }
    }
  }
  function avancerSoin(dt) {
    if (!soin) return;
    if (monte || sequence) { soin = null; return; }
    const l = LIEUX_SOINS[soin.lieu];
    if (soin.phase === 'va') {
      const cib = etapeEnclos(C, l.stand), final = cib === l.stand;
      const ex = cib.x - C.x, ez = cib.z - C.z, dist = Math.hypot(ex, ez);
      if (dist > 0.3 || !final) {
        const ecart = angleVers(C.a, Math.atan2(ex, ez)); C.a += Math.sign(ecart) * Math.min(Math.abs(ecart), dt * 3.2);
        const v = dist > 25 ? 11 : 5; C.vit += (v - C.vit) * Math.min(1, dt * 3);
        const pas = Math.min(dist, C.vit * dt); C.x += ex / dist * pas; C.z += ez / dist * pas;
        soin.t += dt; if (soin.t > 25) { C.x = l.stand.x; C.z = l.stand.z; }       // jamais bloquée
      } else {
        C.vit *= Math.max(0, 1 - dt * 6);
        const ecart = angleVers(C.a, l.a); C.a += Math.sign(ecart) * Math.min(Math.abs(ecart), dt * 3.2);
        if (Math.abs(ecart) < 0.06 && C.vit < 0.2) { soin.phase = 'soin'; soin.t = 0; C.vit = 0; }
      }
      return;
    }
    C.vit = 0; soin.t += dt;
    if (soin.t >= DUREES_SOINS[soin.type]) { const type = soin.type; soin = null; recompenseSoin(type); }
  }
  // la pose 3D : monte pendant la première seconde, redescend pendant la dernière, puis la monture reprend sa vie normale
  function appliquerPoseSoin(dt) {
    let cible = 0;
    if (soin && soin.phase === 'soin') { const D = DUREES_SOINS[soin.type]; cible = Math.min(1, soin.t / 1.1, Math.max(0, (D - soin.t) / 1.1)); pose.type = soin.type; }
    pose.k += (cible - pose.k) * Math.min(1, dt * 6);
    if (cible === 0 && pose.k < 0.01) pose.k = 0;
    if (pose.k > 0) { chameau.agenouille = 0; poseSoin(chameau, pose.type, pose.k, tTotal); }
    zzz.visible = pose.type === 'dormir' && pose.k > 0.4;
    if (zzz.visible) { chameau.tete.getWorldPosition(zzz.position); zzz.position.y += 0.9 + Math.sin(tTotal * 1.5) * 0.1; zzz.material.opacity = 0.6 + Math.sin(tTotal * 2) * 0.3; }
  }
  const zzz = (() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.strokeStyle = '#3a4a78'; g.lineWidth = 5; g.font = 'bold 44px Arial'; g.strokeText('Z z', 18, 48); g.fillText('Z z', 18, 48);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); sp.scale.set(1.2, 0.6, 1); sp.visible = false; scene.add(sp); return sp;
  })();
  // récompense pédagogique : petites pièces (3 par jour et par soin au maximum) + un petit fait à apprendre
  function recompenseSoin(type) {
    const r = soins.appliquer(AV.monture, type, monture(AV.monture).espece); if (!r) return;
    if (Math.hypot(J.x - LOUMI_POS.x, J.z - LOUMI_POS.z) < 12 && (type !== 'calin' || r.pieces)) loumi.reagir(type === 'calin' ? 'joie' : 'bravo');
    if (r.pieces) aventure.gagner(r.pieces, `Soin : ${nomMonture()}`, `soin:${type}:${date0()}:${Date.now()}`);
    if (type !== 'calin' && r.fait) { montrerIndice(`💡 ${r.fait}`, 7500); }
    majSoinsHUD(0, true);
  }
  // ---------- l'interface des besoins : cinq icônes illustrées avec leur jauge ----------
  const hudSoins = $('soins'); let derMaj = 0, dejaIndique = {};
  hudSoins.innerHTML = BESOINS.map(b => `<button class="besoin" data-b="${b}" aria-label="${INFOS[b].nom}"><span class="ib">${INFOS[b].icone}</span><span class="jauge"><i></i></span></button>`).join('');
  hudSoins.querySelectorAll('.besoin').forEach(btn => btn.onclick = () => {
    const b = btn.dataset.b, n = soins.niveau(AV.monture, b), m = monture(AV.monture);
    montrerIndice(n < BAS ? `${m.nom} ${INFOS[b].texte}. ${b === 'soif' ? "L'abreuvoir est près du puits !" : b === 'faim' ? 'La mangeoire est près du puits !' : b === 'bienEtre' ? 'Fais-lui un câlin !' : 'La litière de paille est à côté du puits.'}` : `${INFOS[b].nom} : ${m.nom} va bien.`, 4500);
  });
  // Les besoins : une petite carte au-dessus de la monture, seulement quand l'enfant est près d'elle (ou pendant un soin). Jamais de colonne à l'écran.
  const vS = new THREE.Vector3();
  function majSoinsHUD(dt, force) {
    const jeuVisible = !$('hud').classList.contains('cache') && $('perso').classList.contains('cache') && !interface_ouverte;
    const pres = jeuVisible && !monte && !sequence && (soin || Math.hypot(J.x - C.x, J.z - C.z) < 6);
    if (!pres) { hudSoins.classList.add('cache'); return; }
    vS.set(C.x, H(C.x, C.z) + (chameau.espece === 'elephant' ? 4.2 : chameau.espece === 'cheval' ? 2.5 : 3.0), C.z).project(camera);
    if (vS.z > 1 || Math.abs(vS.x) > 1.1 || Math.abs(vS.y) > 1.1) { hudSoins.classList.add('cache'); return; }
    hudSoins.classList.remove('cache');
    hudSoins.style.left = Math.max(110, Math.min(innerWidth - 110, (vS.x * 0.5 + 0.5) * innerWidth)) + 'px'; hudSoins.style.top = Math.max(60, (-vS.y * 0.5 + 0.5) * innerHeight) + 'px';
    derMaj += dt; if (!force && derMaj < 0.4) return; derMaj = 0;
    const n = soins.niveaux(AV.monture);
    hudSoins.querySelectorAll('.besoin').forEach(btn => { const b = btn.dataset.b, v = n[b]; btn.querySelector('i').style.height = Math.round(v) + '%'; btn.classList.toggle('bas', v < BAS); });
  }

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
    if (route && route.enRoute() && o.z > 10000) return route.bouger(o, dx, dz, rayon);
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
      if (c.repos && o === C) continue;
      const ex = nx - c.x, ez = nz - c.z, r = c.r + rayon;
      if (Math.abs(ex) > r || Math.abs(ez) > r) continue;
      const d = Math.hypot(ex, ez);
      if (d < r && d > 1e-5) { nx = c.x + ex / d * r; nz = c.z + ez / d * r; }
    }
    nx = Math.max(-LIMITE, Math.min(LIMITE, nx)); nz = Math.max(-LIMITE, Math.min(LIMITE, nz));
    if (!decor.col.ouvert && nz < -172) { nz = -172; avertirCol(); }
    for (const f of regions.fermees()) { const dx = nx - f.x, dz = nz - f.z, d = Math.hypot(dx, dz); if (d < f.r && d > 1e-3) { nx = f.x + dx / d * f.r; nz = f.z + dz / d * f.r; avertirRegion(f.id); } }
    o.x = nx; o.z = nz;
  }
  let dernierAvertissement = 0, dernierRegion = 0;
  function avertirRegion(id) { const t = performance.now(); if (t - dernierRegion > 8000) { dernierRegion = t; montrerIndice('🔒 ' + regions.explication(id), 6500); } }
  function avertirCol() {
    const t = performance.now();
    if (t - dernierAvertissement > 6000) { dernierAvertissement = t; const ouvert = acces.zoneOuverte('col'); montrerIndice('🔒 ' + (ouvert ? 'Ce chemin est encore fermé : découvre l\'oasis et le camp des caravanes.' : MESSAGE_FERME), ouvert ? 4000 : 6500); }
  }
  const angleVers = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };

  // ---------- monter / descendre ----------
  const DUREES = { agenouille: 0.9, saut: 0.75, releve: 0.9 };
  function actionChameau() {
    if (interface_ouverte || sequence) return;
    S.demarrerSons();
    const d = Math.hypot(J.x - C.x, J.z - C.z);
    C.vit = 0; C.venir = false; C.rentre = false;
    if (monte) sequence = { type: 'descendre', t: 0 };
    else if (d < (monture(AV.monture).espece === 'elephant' ? 5 : 4)) { sequence = { type: 'monter', t: 0, depart: { x: J.x, z: J.z } }; sonMonture(); }
    else { C.venir = true; sonMonture(); montrerIndice(`${monture(AV.monture).icone} ${nomMonture()} arrive !`, 2500); }
  }
  function avancerSequence(dt) {
    const s = sequence; s.t += dt;
    const t1 = DUREES.agenouille, t2 = t1 + DUREES.saut, t3 = t2 + DUREES.releve;
    const ec = monture(AV.monture).espece === 'elephant' ? 2.5 : 1.6, cote = { x: C.x + Math.cos(C.a) * ec, z: C.z - Math.sin(C.a) * ec }; // à côté de la monture
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
    if (procheAv && (!proche || procheAv.d < Math.hypot(proche.x - J.x, proche.z - J.z))) { if (!monte) enfant.faire(/Parler/.test(procheAv.label) ? 'salut' : 'prendre'); procheAv.faire(); }
    else if (proche) ouvrirLecture(proche.id);
    else if (!monte && Math.hypot(J.x - C.x, J.z - C.z) < (monture(AV.monture).espece === 'elephant' ? 5 : 4)) { if (dansEnclos(C.x, C.z)) sOccuper(); else caresser(); }
  }

  // Un câlin à Sablo : il baisse la tête, ronronne à sa façon ; la première fois, on apprend à prendre soin de lui
  function caresser() {
    chameau.caresse = 2.5; sonMonture(); quotidien.evenement('calin'); enfant.faire('caresser'); recompenseSoin('calin');
    J.a += angleVers(J.a, Math.atan2(C.x - J.x, C.z - J.z));
    if (!etat.lus.includes('soins')) setTimeout(() => ouvrirLecture('soins'), 1600);
    else montrerIndice(`💛 ${nomMonture()} est ${monture(AV.monture).fem ? 'contente' : 'content'} !`, 2000);
  }

  function ouvrirLecture(id) {
    if (id.startsWith('boutique-')) { ouvrirBoutique(id.slice(9)); return; }
    if (id === 'sage') { quotidien.parlerSage(); return; }
    if (id === 'ecurie') { ouvrirEcurie(); return; }
    if (id === 'cour') {
      const n = ARTICLES.filter(a => a.cat === 'collection' && possede(a) && AV.cour[a.id] !== false).length;
      dialogue({ titre: '🏡 Ma cour', texte: n ? `Voici ta cour, devant ta maison. ${n > 1 ? `Tes ${n} objets sont exposés` : 'Ton objet est exposé'} ici.` : 'Voici ta cour, devant ta maison. Elle est encore vide : Samira, la potière du souk, vend des objets pour la décorer.',
        boutons: [{ txt: 'Ouvrir mon armoire', fn: () => setTimeout(() => ouvrirCarnet('armoire'), 40) }, { txt: 'Plus tard', fn: () => {} }] });
      return;
    }
    const cle = id === 'col' ? (decor.col.ouvert ? 'colOuvert' : 'colFerme') : id;
    const p = POINTS[cle]; if (!p) return;
    const nouveau = p.decouverte && !etat.lus.includes(cle);
    if (nouveau) { etat.lus.push(cle); enregistrer(); sauvegarde.gagner('voyage', 'etoiles', 1); }
    if (p.decouverte) quotidien.evenement('lu', cle);
    if (cle === 'nour') { aventure.parlerNour(nouveau ? p.texte : ''); return; }
    dialogue(p);
    if (nouveau) { S.sonMerveille(); const pt = decor.points.find(o => o.id === id); if (pt) effetDecouverte.jouer(pt.x, pt.z); aventure.gagner(30, 'Découverte : ' + p.titre, 'lu:' + cle); }
  }
  // Fenêtre de dialogue commune (panneaux, mascottes, personnages, animaux) avec des choix possibles
  // Quand il manque des pièces : un encadré gris (pas un bouton), le montant manquant et comment en gagner
  function encadreManque({ prix, verbe }) {
    const a = Math.max(0, AV.pieces), manque = Math.max(0, prix - a), pc = Math.min(100, Math.round(a / prix * 100));
    const el = document.createElement('div'); el.className = 'manque-pieces choix'; el.setAttribute('role', 'note');
    el.addEventListener('pointerdown', e => e.preventDefault());   // le bouton Retour garde le focus
    el.innerHTML = `<b>🔒 Il te manque ${manque} pièces</b><span class="jauge" aria-hidden="true"><i style="width:${pc}%"></i></span>
      <span class="manque-detail">Tu as ${a} pièces sur ${prix}. Pour ${verbe || 'l\'acheter'}, gagne des pièces en voyageant : ramasse les pièces dorées, découvre des lieux, réponds à Hakim, fais les missions du jour.</span>`;
    return el;
  }
  function dialogue(p) {
    interface_ouverte = true; ctl.bloque = true;
    $('lecture-titre').textContent = p.titre;
    $('lecture-mascotte').innerHTML = p.mascotte === 'nour' ? mascotte('ablutions') : p.mascotte === 'loumi' ? mascotte('loumi') : p.image ? `<img class="fiche-image" src="${p.image}" alt="">` : p.icone ? `<span class="fiche-icone">${p.icone}</span>` : '';
    $('lecture').style.setProperty('--r', p.couleur || 'transparent'); $('lecture').classList.toggle('fiche', !!p.couleur);
    $('lecture-arabe').textContent = p.arabe || ''; $('lecture-arabe').classList.toggle('cache', !p.arabe);
    p = { ...p, texte: accord(p.texte) };
    $('lecture-texte').textContent = p.texte;
    $('lecture-sous').textContent = p.sous || ''; $('lecture-sous').classList.toggle('cache', !p.sous);
    const src = $('lecture-source');
    src.innerHTML = p.sens ? `<b>${p.sens}</b>${p.source}` : ''; src.classList.toggle('cache', !p.sens);
    const zone = $('lecture-boutons');
    zone.querySelectorAll('.choix').forEach(b => b.remove());
    $('lecture-ok').classList.toggle('cache', !!p.boutons);
    let premier = true;
    (p.boutons || []).forEach(b => {
      if (b.manque) { zone.appendChild(encadreManque(b.manque)); return; }   // pas un bouton : l'achat est impossible pour l'instant
      const el = document.createElement('button'); el.className = (premier && !p.petitsBoutons ? 'gros-bouton' : 'petit-bouton') + ' choix' + (p.petitsBoutons ? ' reponse' : ''); el.textContent = b.txt;
      premier = false;
      el.onclick = () => { fermerLecture(); b.fn(); };
      zone.appendChild(el);
    });
    $('lecture').classList.remove('cache');
    (zone.querySelector('button.choix') || $('lecture-ok')).focus({ preventScroll: true });
    const voix = p.voix || (p.mascotte === 'nour' ? 'nour' : /Hakim/.test(p.titre) ? 'hakim' : /Salim/.test(p.titre) ? 'salim' : null);
    $('lecture-ecouter').onclick = p.ecouterArabe ? () => parlerArabe(p.ecouterArabe)
      : () => direTextes([{ t: p.texte }, { t: p.sous, opt: true }, { t: p.sens }]) || parler(p.texte + (p.sous ? ' ' + p.sous.replace(/^[^\wÀ-ÿ]+/, '') : '') + (p.sens ? ' ' + p.sens.replace('Sens du verset : ', 'Le sens de ce verset : ') : ''), voix);
  }
  // Pièces de Nour gagnées : petit « +n » qui monte, la bourse bondit
  let timerGain = null;
  function afficherGain(total, n, raison) {
    $('nb-pieces').textContent = total; hud.temporaire($('bourse'), 4500);
    const b = $('bourse'); b.classList.remove('bondit'); void b.offsetWidth; b.classList.add('bondit');
    const g = $('gain'); g.classList.add('cache'); void g.offsetWidth;
    g.innerHTML = `+${n} <span class="piece"></span><small>${raison || ''}</small>`; g.classList.remove('cache');
    clearTimeout(timerGain); timerGain = setTimeout(() => g.classList.add('cache'), 1450);
  }
  // Une pièce dessinée s'envole de l'endroit où elle a été ramassée jusqu'au compteur
  function envolPiece(x, y, img) {
    const b = $('bourse').getBoundingClientRect(), el = document.createElement('img');
    el.src = img; el.className = 'piece-volante'; el.style.left = x + 'px'; el.style.top = y + 'px';
    document.body.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.left = (b.left + 22) + 'px'; el.style.top = (b.top + b.height / 2) + 'px'; el.style.transform = 'translate(-50%,-50%) scale(.45) rotate(540deg)'; el.style.opacity = '0.4'; }));
    setTimeout(() => { el.remove(); const bb = $('bourse'); bb.classList.remove('bondit'); void bb.offsetWidth; bb.classList.add('bondit'); }, 650);
  }

  // Le petit cadre de la mission en cours (en haut à gauche)
  function majSuivi() {
    const enCours = Object.keys(MISSIONS).filter(k => AV.missions[k] && AV.missions[k].etat !== 'finie');
    const s = $('suivi');
    const mj = quotidien ? quotidien.missions() : [], faitesJour = mj.filter(m => m.fini).length;
    const ligneJour = mj.length ? `<span class="sac">☀️ Missions du jour : ${faitesJour}/${mj.length}</span>` : '';
    if (!enCours.length && !AV.sac.length && !ligneJour) { hud.cacher(s); return; }
    const k = enCours.includes(AV.suiviPrefere) ? AV.suiviPrefere : enCours[0];
    const nomsSac = AV.sac.map(x => x.startsWith('dattes') ? '🌴' : x.startsWith('eau') ? '💧' : x === 'seau' ? '🪣' : x === 'gourde' ? '🫙' : '🚿').join(' ');
    s.innerHTML = (k ? `${MISSIONS[k].icone} <b>${MISSIONS[k].titre}</b> · ${AV.missions[k].n}/${MISSIONS[k].total}` : '') +
      (AV.sac.length ? `<span class="sac">🎒 ${nomsSac} (${AV.sac.length}/${AV.capacite})</span>` : '') + ligneJour;
    if (suiviPret) hud.temporaire(s, 6500);        // seulement quand quelque chose change ; le carnet 📖 garde le détail
  }
  $('suivi').addEventListener('click', () => ouvrirCarnet('missions'));
  $('bourse').addEventListener('click', () => ouvrirCarnet('collection'));
  function fermerLecture() {
    habitants.ferme();
    $('lecture').classList.add('cache'); interface_ouverte = false; ctl.bloque = false;
    try { speechSynthesis.cancel(); } catch (e) {} arreterVoixVoyage();
  }
  $('lecture-ok').addEventListener('click', fermerLecture);
  $('lecture-fermer').addEventListener('click', fermerLecture);
  addEventListener('keydown', e => { if (e.code === 'Escape' && !ctl.capture) { fermerLecture(); fermerCarnet(); fermerPanneaux(); fermerCommandes(); fermerBoutique(); $('carte-fermer').click(); } });

  // Voix du navigateur, en français seulement (le texte arabe du Coran n'est jamais lu par une machine)
  // chaque personnage a sa façon de parler (en attendant les vraies voix enregistrées)
  const VOIX = { nour: { pitch: 1.45, rate: 0.98 }, hakim: { pitch: 0.7, rate: 0.82 }, salim: { pitch: 0.9, rate: 0.95 }, karim: { pitch: 1.0, rate: 1.0 },
    amina: { pitch: 1.25, rate: 0.95 }, layla: { pitch: 1.2, rate: 0.9 }, samira: { pitch: 1.1, rate: 0.92 }, hassan: { pitch: 0.8, rate: 0.9 }, nabil: { pitch: 0.85, rate: 0.95 } };
  // Règle du projet : un mot arabe n'est JAMAIS prononcé par une voix de synthèse.
  // S'il n'a pas encore sa voix enregistrée (NOUR-VOIX-ARB / INV), on invite à lire la prononciation écrite.
  function parlerArabe(mot) {
    if (direMotArabe(mot)) return;
    try { speechSynthesis.cancel(); } catch (e) {}
    montrerIndice('La voix de ce mot arrive bientôt : lis la prononciation écrite sous le mot.', 3500);
  }
  // Jamais de synthèse pour un texte religieux ou translittéré de l'arabe (même filtre que les leçons ablutions et prière)
  const RELIGIEUX = /[\u0600-\u06FF]|[âîûÂÎÛ‘ʿʾ]|\b(allah|bismi|ramadan|coran|sourate|f[aâ]tiha|sal[aâ]t|wudu|inch|assal|as-sal|soubh|alhamd|al-hamd|m[aâ]ch|prophète|qibla|kaaba)/i;
  function parler(texte, voix) {
    if (RELIGIEUX.test(String(texte))) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texte), vx = VOIX[voix] || {};
      u.lang = 'fr-FR'; u.rate = vx.rate || 0.92; u.pitch = vx.pitch || 1; u.volume = sauvegarde.get().sons.voix ?? 1;
      const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('fr'));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  // ---------- découvertes des zones ----------
  function zoneIci(x, z) {
    if (z < -200) return 'montagnes';
    if (Math.hypot(x - marche.centre.x, z - marche.centre.z) < 21) return 'marche';
    for (const id of ['village', 'oasis', 'camp', 'wadi', 'rochers']) { const l = LIEUX[id]; if ((id === 'wadi' || id === 'rochers') && !regions.ouverte(id)) continue; if (Math.hypot(x - l.x, z - l.z) < l.r + 6) return id; }
    if (Math.hypot(x - LIEUX.dunes.x, z - LIEUX.dunes.z) < LIEUX.dunes.r) return 'dunes';
    return null;
  }
  let zoneActuelle = undefined;
  function verifierZone() {
    if (route && route.enRoute()) { zoneActuelle = 'route'; return; }
    const z = zoneIci(J.x, J.z);
    if (z === zoneActuelle) return;
    zoneActuelle = z;
    if (z) quotidien.evenement('zone', z);
    const info = ZONES.find(o => o.id === z);
    $('lieu').textContent = info ? info.icone + ' ' + info.nom : (J.z < -140 ? '🪨 Le chemin du col' : '🐫 Le désert');
    hud.temporaire($('lieu'), 4500); zoneVillage = z === 'village'; majJumelles();
    if (z && !etat.zones.includes(z)) {
      etat.zones.push(z); enregistrer();
      if (z === 'village') { bandeau('Tu découvres', info.nom); S.sonDecouverte(); }
      else decouvrir({ type: 'lieu', cle: z, nom: info.nom, icone: info.icone, texte: DESCRIPTIONS_LIEUX[z] || '', nouveau: true,
        progression: { n: etat.zones.length, total: ZONES.length, label: etat.zones.length > 1 ? 'lieux découverts' : 'lieu découvert' } });
      sauvegarde.gagner('voyage', 'etoiles', 1);
      setTimeout(() => aventure.gagner(50, 'Nouveau lieu : ' + info.nom, 'zone:' + z), 900);
      verifierCol(true);
    }
  }
  function verifierCol(annoncer) {
    const ok = acces.zoneOuverte('col') && (etat.colOuvert || (etat.zones.includes('oasis') && etat.zones.includes('camp')) || (sauvegarde.get().etoiles || 0) >= 12);
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
    const b = $('bandeau'); b.classList.add('cache'); void b.offsetWidth; petit = accord(petit);
    direTextes([{ t: petit }, { t: nom, opt: true }]);   // seulement si la phrase est enregistrée
    $('bandeau-petit').textContent = petit; $('bandeau-nom').textContent = nom; b.classList.remove('cache');
    clearTimeout(timerBandeau); timerBandeau = setTimeout(() => b.classList.add('cache'), 4300);
  }
  let timerIndice = null, indiceForce = false;
  let dernierIndiceDit = { t: '', quand: 0 };
  function montrerIndice(html, ms) {
    html = accord(html);
    if (html !== dernierIndiceDit.t || performance.now() - dernierIndiceDit.quand > 8000) { dernierIndiceDit = { t: html, quand: performance.now() }; direTextes([{ t: html }]); }
    const i = $('indice'); i.innerHTML = html; i.classList.remove('cache'); indiceForce = true;
    clearTimeout(timerIndice); timerIndice = setTimeout(() => { indiceForce = false; i.classList.add('cache'); }, ms);
  }

  // ---------- carnet d'aventure ----------
  const META_MISSIONS = {
    lanternes: { cat: 'observation', diff: 2, objectif: 'Trouver 12 lanternes cachées' }, objets: { cat: 'entraide', diff: 1, objectif: 'Rapporter 3 objets à Nour' },
    tresor: { cat: 'reflexion', diff: 2, objectif: 'Suivre 4 indices jusqu\'au coffre' }, voyageur: { cat: 'entraide', diff: 2, objectif: 'Apporter 2 paniers de dattes et 2 outres d\'eau à Salim' },
    animaux: { cat: 'observation', diff: 2, objectif: 'Observer 7 animaux' } };
  let filtreQuetes = 'toutes';
  let ongletCarnet = 'missions';
  function ouvrirCarnet(onglet) {
    fermerPanneaux();
    if (typeof onglet === 'string') ongletCarnet = onglet;
    interface_ouverte = true; ctl.bloque = true;
    const lanternes = AV.ramasses.filter(k => k.startsWith('lanterne')).length;
    $('carnet-resume').innerHTML = `<span class="piece"></span> ${AV.pieces} Pièces de Nour · 🏮 ${lanternes}/12 · 🦊 ${AV.animaux.length}/7 · 🏜️ ${etat.zones.length}/${ZONES.length}`;
    document.querySelectorAll('.onglets button').forEach(b => b.setAttribute('aria-selected', b.dataset.onglet === ongletCarnet));
    $('carnet-contenu').innerHTML = pageCarnet(ongletCarnet);
    const cc = $('carnet-contenu');
    cc.querySelectorAll('[data-basculer]').forEach(b => b.onclick = () => { const a = article(b.dataset.basculer); equiper(a, !estEquipe(a)); ouvrirCarnet(ongletCarnet); });
    cc.querySelectorAll('[data-fiche]').forEach(b => b.onclick = () => ficheObjet(article(b.dataset.fiche), () => ouvrirCarnet(ongletCarnet)));
    cc.querySelectorAll('[data-perso]').forEach(b => b.onclick = () => { fermerCarnet(); ouvrirPerso(false); });
    cc.querySelectorAll('[data-commencer-mission]').forEach(b => b.onclick = () => { fermerCarnet(); setTimeout(() => aventure.proposer(b.dataset.commencerMission), 60); });
    cc.querySelectorAll('[data-guider-mission]').forEach(b => b.onclick = () => { fermerCarnet(); guiderMission(b.dataset.guiderMission); });
    cc.querySelectorAll('[data-guider-jour]').forEach(b => b.onclick = () => { fermerCarnet(); guiderJour(b.dataset.guiderJour); });
    cc.querySelectorAll('[data-guider-quete]').forEach(b => b.onclick = () => { fermerCarnet(); guiderQuete(b.dataset.guiderQuete); });
    cc.querySelectorAll('[data-filtre]').forEach(b => b.onclick = () => { filtreQuetes = b.dataset.filtre; ouvrirCarnet('missions'); });
    cc.querySelectorAll('[data-ecouter-mot]').forEach(b => b.onclick = () => { const m = MOTS.find(x => x.id === b.dataset.ecouterMot); if (m) parlerArabe(m.ar); });
    cc.querySelectorAll('[data-fiche-monture]').forEach(b => b.onclick = () => { $('carnet').classList.add('cache'); ficheMonture(b.dataset.ficheMonture, () => ouvrirCarnet('sablo')); });
    remplirApercus(cc);
    $('carnet').classList.remove('cache');
  }
  document.querySelectorAll('.onglets button').forEach(b => b.addEventListener('click', () => ouvrirCarnet(b.dataset.onglet)));
  if (route) {   // l'onglet « Itinéraire » de La Route, et le bouton de sa carte dans la carte du pays
    const b = document.createElement('button'); b.setAttribute('role', 'tab'); b.dataset.onglet = 'route'; b.textContent = '🐪 Itinéraire';
    document.querySelector('.onglets').appendChild(b); b.addEventListener('click', () => ouvrirCarnet('route'));
    const c = document.createElement('button'); c.textContent = '🐪'; c.setAttribute('aria-label', 'Carte de la grande route vers La Mecque'); c.title = 'La grande route';
    c.addEventListener('click', () => { fermerCarte(); setTimeout(() => route.ouvrirCarte(), 60); }); document.querySelector('.carte-outils').appendChild(c);
  }
  function pageCarnet(o) {
    if (o === 'route' && route) return route.pageCarnet();
    if (o === 'missions') {
      const etoiles = n => `<span class="diff" title="Difficulté">${'★'.repeat(n)}<i>${'★'.repeat(3 - n)}</i></span>`;
      const piece = '<span class="piece" style="width:16px;height:16px;vertical-align:-3px"></span>';
      // toutes les quêtes, rangées de la même façon
      const toutes = [
        ...Object.keys(MISSIONS).map(k => { const m = AV.missions[k], M = MISSIONS[k], meta = META_MISSIONS[k];
          return { id: k, sorte: 'mission', lot: !m && !!M.lot && acces.missionOuverte(k), titre: M.titre, icone: M.icone, cat: meta.cat, diff: meta.diff, objectif: meta.objectif, desc: m || (M.lot && acces.missionOuverte(k)) ? M.resume : 'Parle aux habitants et explore pour découvrir cette mission.',
            n: m ? m.n : 0, total: M.total, recompense: M.recompense, etat: !m ? (M.lot && acces.missionOuverte(k) ? 'disponible' : 'decouvrir') : m.etat === 'finie' ? 'finie' : 'encours', guidable: m && m.etat !== 'finie' && !!aventure.prochaineCible(J, k) }; }),
        ...Object.entries(QUETES).map(([k, q]) => { const n = Math.min(q.total, quetes.nombre(k)), ferme = q.region && !regions.ouverte(q.region);
          return { id: k, sorte: 'quete', titre: q.titre, icone: q.icone, cat: q.cat, diff: q.diff, objectif: q.objectif, desc: ferme ? '🔒 ' + regions.explication(q.region) : q.desc, n, total: q.total, recompense: q.recompense,
            etat: quetes.fini(k) ? 'finie' : ferme ? 'decouvrir' : n > 0 ? 'encours' : 'disponible', guidable: !ferme && !quetes.fini(k) && !!quetes.destination(k, J) }; }),
        ...COLLECTIONS.map(k => { const p = progressionCollection(k, AV);
          return { id: k.id, sorte: 'collection', titre: k.nom, icone: k.icone, cat: 'collection', diff: k.montures ? 3 : 2, objectif: `Réunir ${p.total} ${k.montures ? 'montures' : 'objets'}`,
            desc: k.montures ? 'Adopte ces montures à l\'écurie de Nabil.' : 'Trouve ces objets au souk du village.', n: p.n, total: p.total, recompense: k.pieces,
            etat: p.n === p.total ? 'finie' : p.n > 0 ? 'encours' : 'disponible', guidable: p.n < p.total }; })
      ];
      const filtre = filtreQuetes, liste = toutes.filter(q => filtre === 'toutes' || q.cat === filtre);
      const carte = q => `<div class="carte-mission ${q.etat === 'finie' ? 'finie' : ''}">${q.lot ? `<button class="me-guider" data-commencer-mission="${q.id}">▶ Commencer</button>` : ''}${q.guidable ? `<button class="me-guider" data-guider-quete="${q.sorte}:${q.id}">🧭 Me guider</button>` : ''}
          <h4>${q.icone} ${q.titre}${q.etat === 'finie' ? '<span class="etiquette">Réussie ✓</span>' : q.etat === 'decouvrir' ? '<span class="etiquette">À découvrir</span>' : ''}</h4>
          <p class="puces"><span class="puce">${CATEGORIES_QUETES[q.cat].icone} ${CATEGORIES_QUETES[q.cat].nom}</span>${etoiles(q.diff)}</p>
          <p>${q.desc}</p><p class="objectif">🎯 ${q.objectif}</p>
          <div class="barre"><i style="width:${q.n / q.total * 100}%"></i></div>
          <p style="margin:6px 0 0;font-size:14px">${q.n} / ${q.total} · récompense : ${q.recompense} ${piece}</p></div>`;
      const groupe = (titre, l) => l.length ? `<h3>${titre}</h3>${l.map(carte).join('')}` : '';
      const mj = quotidien.missions();
      const jourHtml = `<h3>☀️ Missions du jour</h3>${quotidien.recul ? '<p class="note">L\'heure de l\'appareil semble avoir reculé : les missions de ce jour restent les mêmes.</p>' : ''}
        ${mj.map(m => `<div class="carte-mission ${m.fini ? 'finie' : ''}">${!m.fini && JOUR_GUIDABLE.includes(m.id) ? `<button class="me-guider" data-guider-jour="${m.id}">🧭 Me guider</button>` : ''}<h4>${m.icone} ${m.titre}${m.fini ? '<span class="etiquette">Réussie ✓</span>' : ''}</h4>
          <p class="puces"><span class="puce">☀️ Du jour</span>${etoiles(1)}</p>
          <div class="barre"><i style="width:${Math.min(100, m.n / m.total * 100)}%"></i></div><p style="margin:6px 0 0;font-size:14px">${Math.min(m.n, m.total)} / ${m.total} · ${m.pieces} ${piece}</p></div>`).join('')}
        <p class="note">Bonus si les trois sont réussies : ${quotidien.bonus} pièces. Elles changent chaque jour, sans obligation : tes pièces restent à toi pour toujours.</p>`;
      const puces = `<div class="filtres-quetes">${[['toutes', '✨', 'Toutes'], ...Object.entries(CATEGORIES_QUETES).map(([k, c]) => [k, c.icone, c.nom])].map(([k, ic, nom]) => `<button data-filtre="${k}" aria-pressed="${k === filtre}">${ic} ${nom}</button>`).join('')}</div>`;
      return jourHtml + '<h3>🗺️ Quêtes et aventures</h3>' + puces +
        groupe('En cours', liste.filter(q => q.etat === 'encours')) + groupe('À commencer', liste.filter(q => q.etat === 'disponible')) +
        groupe('À découvrir', liste.filter(q => q.etat === 'decouvrir')) + groupe('Réussies', liste.filter(q => q.etat === 'finie')) +
        (liste.length ? '' : '<p class="note">Aucune quête de ce genre pour l\'instant.</p>');
    }
    if (o === 'collection') {
      const l = i => AV.ramasses.includes('lanterne' + i);
      const objets = [['seau', '🪣', 'Le seau'], ['gourde', '🫙', 'La gourde'], ['arrosoir', '🚿', 'L\'arrosoir'], ['medaillon', '⭐', 'Le médaillon de l\'oasis'], ['jarre', '🏺', 'La jarre de la grotte']];
      return `<h3>🏮 Les lanternes cachées</h3><div class="grille-collection">${Array.from({ length: 12 }, (_, i) => `<div class="${l(i) ? '' : 'manque'}"><span>🏮</span>${l(i) ? 'Trouvée' : '?'}</div>`).join('')}</div>
        <h3>🧺 Objets trouvés</h3><div class="grille-collection">${objets.map(([k, ic, nom]) => `<div class="${AV.ramasses.includes(k) ? '' : 'manque'}"><span>${ic}</span>${AV.ramasses.includes(k) ? nom : '?'}</div>`).join('')}</div>
        ` + pageSucces();
    }
    if (o === 'mots') {
      const appris = AV.quetes.mots || [];
      const ou = { bir: 'près du puits du village', jamal: 'près de l\'enclos de Sablo', souq: 'au souk', nakhla: 'à l\'oasis', tamr: 'à l\'oasis', maa: 'au bord de l\'eau de l\'oasis', khayma: 'au camp des caravanes', najma: 'au bout du chemin des dunes' };
      return `<p class="moi"><span class="moi-ico">${ICONE_MOTS}</span><span><b>Mes mots arabes : ${appris.length} sur ${MOTS.length}</b><br>Cherche les petits livres dorés qui flottent près des lieux du pays !</span></p>
        <div class="grille-mots">${MOTS.map(m => appris.includes(m.id)
          ? `<div class="carte-mot"><img src="${illustration(m.id)}" alt=""><span class="ar" lang="ar" dir="rtl">${m.ar}</span><b>${m.dit.charAt(0).toUpperCase() + m.dit.slice(1)}</b><span>${m.fr}</span><button data-ecouter-mot="${m.id}">${ICONE_SON}Écouter</button></div>`
          : `<div class="carte-mot cachee"><img src="${illustration(m.id)}" alt=""><span class="ar">؟</span><b>À découvrir</b><span>${ou[m.id] || ''}</span></div>`).join('')}</div>
        <p class="note">Les mots sont écrits en arabe, de droite à gauche, avec leur prononciation. Le bouton « Écouter » utilise la voix arabe de ton appareil, s'il en a une.</p>`;
    }
    if (o === 'animaux') {
      return Object.entries(FICHES).map(([id, f]) => AV.animaux.includes(id)
        ? `<div class="fiche-animal"><span>${f.icone}</span><div><b>${f.nom}</b><p>🏠 ${f.habitat}</p><p>${f.vie}</p></div></div>`
        : `<div class="fiche-animal" style="opacity:.5"><span>❔</span><div><b>Animal à découvrir</b><p>Cherche-le et observe-le doucement.</p></div></div>`).join('');
    }
    if (o === 'armoire') {
      const g = genre(), P = perso() || {}, T = tenueActuelle(), tn = TENUES[P.tenue] || TENUES.ecru;
      const carte = a => {
        const avoir = possede(a), eq = avoir && estEquipe(a);
        return `<div class="objet ${avoir ? '' : 'pas-a-toi'}" style="--r:${RARETES[a.rarete].couleur};--f:${RARETES[a.rarete].fond}">
          <button class="voir" data-fiche="${a.id}" aria-label="Voir ${a.nom}">${vignette(a)}<b>${a.nom}</b>${badge(a)}</button>
          ${avoir ? `<button class="${eq ? 'equipe' : ''}" data-basculer="${a.id}">${eq ? (a.cat === 'collection' ? '✓ Dans ma cour' : '✓ Porté') : (a.cat === 'collection' ? 'Exposer' : 'Porter')}</button>`
            : `<span class="ou">${MARCHANDS[a.marchand] ? MARCHANDS[a.marchand].nom.split(',')[0] : ''} · <span class="piece"></span> ${a.prix}</span>`}</div>`;
      };
      const GROUPES = [['coiffe', g === 'fille' ? '🧕 Voiles' : '🧢 Coiffes'], ['corps', g === 'fille' ? '👗 Robes' : '👕 Tuniques'], ['manteau', '🧥 Manteaux et capes'], ['ceinture', '🎗️ Ceintures'],
        ['pieds', '🩴 Sandales'], ['sac', '🎒 Sacs'], ['main', '🧺 Dans la main'], ['hanche', '🫗 À la ceinture'], ['poignets', '📿 Bracelets']];
      const habits = GROUPES.map(([e, titre]) => {
        const l = ARTICLES.filter(a => a.emplacement === e && convient(a, g));
        return l.length ? `<h3>${titre}</h3><div class="etal-grille">${l.map(carte).join('')}</div>` : '';
      }).join('');
      const nbHabits = ARTICLES.filter(a => a.emplacement && convient(a, g)).length, nbA = ARTICLES.filter(a => a.emplacement && convient(a, g) && possede(a)).length;
      const outils = ARTICLES.filter(a => a.cat === 'outil');
      const decos = ARTICLES.filter(a => a.cat === 'collection');
      return `<div class="moi"><span class="moi-ico">${g === 'fille' ? '👧' : '👦'}</span><div><b>${g === 'fille' ? 'Ta voyageuse' : 'Ton voyageur'}</b><br>Tenue de départ : ${tn.nom}</div><button class="petit-bouton" data-perso>Changer</button></div>
        <p class="note">Sans habit choisi, tu portes ta tenue de départ. Les habits sont inspirés de l'Arabie ancienne : ce sont des reconstitutions imaginées, pas des copies exactes. Habits et accessoires trouvés : ${nbA} sur ${nbHabits}.</p>
        ${habits}
        <h3>🧰 Équipement de voyage</h3><div class="etal-grille">${outils.map(a => `<div class="objet ${possede(a) ? '' : 'pas-a-toi'}" style="--r:${RARETES[a.rarete].couleur};--f:${RARETES[a.rarete].fond}"><button class="voir" data-fiche="${a.id}">${vignette(a)}<b>${a.nom}</b>${badge(a)}</button><span class="ou">${possede(a) ? '✓ À toi' : `Karim · <span class="piece"></span> ${a.prix}`}</span></div>`).join('')}</div>
        <h3>🏡 Ma cour</h3><p class="note">Ta maison est dans le village, près du puits. Les objets que tu exposes y apparaissent.</p><div class="etal-grille">${decos.map(carte).join('')}</div>`;
    }
    if (o === 'sablo') {
      const items = ARTICLES.filter(a => a.cat === 'monture');
      const mo = monture(AV.monture);
      return `<p>${mo.icone} <b>${mo.nom}</b> voyage avec toi. Prends soin de ${mo.fem ? 'elle' : 'lui'} : de l'eau, de l'ombre, du repos et de la douceur.</p>
        <h3>🐾 Mes montures</h3><div class="etal-grille">${MONTURES.filter(m => !m.offerte || AV.montures.includes(m.id)).map(m => { const R = RARETES[m.rarete], avoir = AV.montures.includes(m.id);
          return `<div class="objet ${avoir ? '' : 'pas-a-toi'}" style="--r:${R.couleur};--f:${R.fond}"><button class="voir" data-fiche-monture="${m.id}"><span class="vignette"><i>${m.icone}</i></span><b>${m.nom}</b><span style="font-size:12px">${m.race}</span><span class="badge-rarete" style="--r:${R.couleur}">${R.nom}</span></button>
            <span class="ou">${AV.monture === m.id ? '✓ En voyage' : avoir ? 'À l\'écurie' : `Écurie · <span class="piece"></span> ${m.prix}`}</span></div>`; }).join('')}</div>
        <p class="note">Pour changer de monture, va voir Nabil à l'écurie, près de l'enclos, à l'est du village.</p>
        <h3>🎀 Parures (pour toutes tes montures)</h3><div class="etal-grille">${items.map(a => { const avoir = possede(a), eq = avoir && estEquipe(a);
          return `<div class="objet ${avoir ? '' : 'pas-a-toi'}" style="--r:${RARETES[a.rarete].couleur};--f:${RARETES[a.rarete].fond}"><button class="voir" data-fiche="${a.id}">${vignette(a)}<b>${a.nom}</b>${badge(a)}</button>
            ${avoir ? `<button class="${eq ? 'equipe' : ''}" data-basculer="${a.id}">${eq ? '✓ Utilisé' : 'Utiliser'}</button>` : `<span class="ou">${MARCHANDS[a.marchand].nom.split(',')[0]} · <span class="piece"></span> ${a.prix}</span>`}</div>`; }).join('')}</div>
        <p class="note">Amina vend les tapis et les parures, Hassan les selles et les sacoches, au souk du village.</p>`;
    }
    const lus = etat.lus.filter(k => POINTS[k] && POINTS[k].decouverte);
    return `<h3>Les lieux</h3><ul class="carnet-lieux">${ZONES.map(z => etat.zones.includes(z.id) ? `<li><span class="ico">${z.icone}</span>${z.nom}</li>` : `<li class="pas-vu"><span class="ico">❔</span>À découvrir…</li>`).join('')}</ul>
      <h3>Mes découvertes</h3><ul class="carnet-decouvertes">${lus.length ? lus.map(k => `<li>✨ ${POINTS[k].decouverte}</li>`).join('') : '<li class="vide">Cherche les pierres avec une lanterne dorée et lis-les : tes découvertes s\'écriront ici.</li>'}</ul>
      <h3>Bientôt</h3><ul class="carnet-lieux bientot">${BIENTOT.map(b => `<li><span class="ico">${b.icone}</span>${b.nom}</li>`).join('')}</ul>`;
  }
  function fermerCarnet() { if ($('carnet').classList.contains('cache')) return; $('carnet').classList.add('cache'); interface_ouverte = false; ctl.bloque = false; }
  $('btn-carnet').addEventListener('click', ouvrirCarnet);
  $('btn-missions').addEventListener('click', () => ouvrirCarnet('missions'));      // bouton du haut : missions du jour + lanternes cachées, à la demande seulement
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
  $('ouvrir-sons').addEventListener('click', () => { const ouvrir = $('panneau-son').classList.contains('cache'); fermerPanneaux(); if (ouvrir) { majPanneauSon(); $('panneau-son').classList.remove('cache'); } });
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
    setTimeout(() => direIds(['NOUR-VOIX-NAV-014', matchMedia('(pointer: coarse)').matches ? 'NOUR-VOIX-NAV-013' : 'NOUR-VOIX-NAV-015']), 400);
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
    arreterVoixVoyage();
    $('aide').classList.add('cache'); interface_ouverte = false; ctl.bloque = false;
    etat.aideVue = true; enregistrer();
    S.demarrerSons(); S.reglerSons(sons());
  });

  // ---------- habits, équipement et achats ----------
  let lumiere = null, persoEssai = null;
  const possede = a => (AV.achats || []).some(x => x.id === a.id);
  const ORIGINE = { 'attesté': 'Objet connu à l\'époque', 'plausible': 'Reconstitution vraisemblable', 'imaginaire': 'Création du jeu' };
  function estEquipe(a) {
    const E = AV.equipement;
    if (a.emplacement) return tenueActuelle()[a.emplacement] === a.id;
    if (a.cat === 'outil') return !!E[a.id];
    if (a.cat === 'collection') return AV.cour[a.id] !== false;
    if (['tapis', 'selle', 'couverture'].includes(a.type)) return E[a.type] === a.id;
    return !!E[a.id === 'lanterne-sablo' ? a.id : a.type];
  }
  function equiper(a, oui) {
    const E = AV.equipement;
    if (a.cat === 'outil') E[a.id] = true;                      // un outil acheté sert toujours
    if (a.emplacement) { if (oui && !convient(a, genre())) return; tenueActuelle()[a.emplacement] = oui ? a.id : null; }
    else if (a.cat === 'collection') AV.cour[a.id] = !!oui;
    else if (['tapis', 'selle', 'couverture'].includes(a.type)) E[a.type] = oui ? a.id : null;
    else if (a.cat !== 'outil') E[a.id === 'lanterne-sablo' ? a.id : a.type] = oui;
    appliquerEquipement();
  }
  // le faucon n'a de sens qu'en exploration : il n'encombre pas l'écran du village
  function majJumelles() { $('btn-jumelles').classList.toggle('cache', !(AV.equipement && AV.equipement.jumelles) || zoneVillage); }
  function appliquerEquipement() {
    const E = AV.equipement, a = id => article(E[id]) || null;
    AV.capacite = E.sac ? 6 : 3;
    const tp = a('tapis'), se = a('selle'), co = a('couverture');
    chameau.habiller({ tapis: tp ? tp.couleurs : undefined, motif: tp ? tp.motifTapis : null, selle: se ? se.couleur : undefined, selleBois: !!(se && se.bois),
      sacoches: !!E.sacoches, pompons: !!E.pompons, lanterne: !!E['lanterne-sablo'], couverture: co ? co.couleurs : null });
    // le personnage, avec ce qu'il porte
    const pose = enfant.pose, ancien = enfant.racine;
    const nouveau = new Voyageur(!!Q.ombres, persoEssai || perso() || {}, tenueActuelle());
    nouveau.racine.position.copy(ancien.position); nouveau.racine.rotation.copy(ancien.rotation); nouveau.pose = pose;
    scene.remove(ancien); ancien.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    scene.add(nouveau.racine); enfant = nouveau;
    majJumelles();
    if (E.lanterne && !lumiere) { lumiere = new THREE.PointLight('#ffc870', 0, 14, 1.6); scene.add(lumiere); }
    cour.maj(AV);
    enregistrer(); majSuivi();
  }

  // ---------- aperçus des objets (petites images rendues une fois, puis gardées) ----------
  let rendApercu = null; const cacheApercu = new Map();
  function apercu(a) {
    if (!a || (a.cat === 'outil' && !a.emplacement)) return '';
    const P = persoEssai || perso() || {};
    const cle = a.id + (a.emplacement ? ':' + genre() + ':' + (P.tenue || '') + ':' + (P.peau ?? '') : '');
    if (cacheApercu.has(cle)) return cacheApercu.get(cle);
    let url = '';
    try {
      if (!rendApercu) {
        const cv = document.createElement('canvas'); cv.width = cv.height = 200;
        const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
        r.setPixelRatio(1); r.setSize(200, 200, false); r.outputColorSpace = THREE.SRGBColorSpace;
        rendApercu = { r, cv, cam: new THREE.PerspectiveCamera(30, 1, 0.05, 60) };
      }
      const { r, cv, cam: c } = rendApercu, sc = new THREE.Scene();
      sc.add(new THREE.HemisphereLight('#fff6e6', '#c9a77e', 1.7));
      const sol = new THREE.DirectionalLight('#fff3dc', 2.3); sol.position.set(2, 4, 4); sc.add(sol);
      let obj, cible = null, dist = null;
      if (a.emplacement) {
        const v = new Voyageur(false, { ...P, genre: genre() }, { [a.emplacement]: a.id });
        v.animer(0.02, 0, 1); obj = v.racine;
        const dos = a.forme === 'cape' || a.forme === 'sacdos';
        obj.rotation.y = dos ? Math.PI * 0.82 : a.emplacement === 'sac' ? 0.9 : a.emplacement === 'hanche' ? -0.9 : a.emplacement === 'main' ? -0.5 : 0.25;
        const cadre = { coiffe: [1.22, 1.25], pieds: [0.12, 1.05], poignets: [0.62, 1.6], main: [0.45, 2.0] }[a.emplacement] || [0.72, 3.5];
        cible = new THREE.Vector3(0, cadre[0], 0); dist = cadre[1];
      } else if (a.cat === 'collection') {
        obj = new THREE.Mesh(modeleObjet(a.forme), materiau({ finesse: 2 })); obj.rotation.y = 0.5;
      } else {
        const ch = new Chameau(false), tp = a.type === 'tapis' ? a : null, se = a.type === 'selle' ? a : null;
        ch.habiller({ tapis: tp ? tp.couleurs : undefined, motif: tp ? tp.motifTapis : null, selle: se ? se.couleur : undefined, selleBois: !!(se && se.bois),
          sacoches: a.type === 'sacoches', pompons: a.type === 'pompons', lanterne: a.id === 'lanterne-sablo', couverture: a.type === 'couverture' ? a.couleurs : null });
        ch.animer(0.02, 0, 1); obj = ch.racine; obj.rotation.y = a.type === 'pompons' ? 0.7 : a.type === 'couverture' ? 2.3 : 1.25;
        obj.updateMatrixWorld(true);
        const b = new THREE.Box3().setFromObject(obj); cible = b.getCenter(new THREE.Vector3()); cible.y = b.max.y * (a.type === 'pompons' ? 0.78 : 0.72); dist = 5.2;
      }
      sc.add(obj); obj.updateMatrixWorld(true);
      if (!cible) { const b = new THREE.Box3().setFromObject(obj), t = b.getSize(new THREE.Vector3()); cible = b.getCenter(new THREE.Vector3()); dist = Math.max(t.x, t.y, t.z) / (2 * Math.tan(15 * Math.PI / 180)) * 1.25; }
      c.position.set(cible.x + dist * 0.12, cible.y + dist * 0.16, cible.z + dist); c.lookAt(cible);
      r.render(sc, c); url = cv.toDataURL('image/png');
      sc.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    } catch (e) { console.warn('aperçu', e); }
    cacheApercu.set(cle, url);
    return url;
  }
  // remplit les images d'un panneau une par une (sans bloquer le jeu)
  function remplirApercus(zone) {
    const imgs = [...zone.querySelectorAll('img[data-apercu]:not([src])')];
    const suivante = () => { const img = imgs.shift(); if (!img) return; const u = apercu(article(img.dataset.apercu)); if (u) { img.src = u; img.parentNode.classList.add('avec-image'); } requestAnimationFrame(suivante); };
    requestAnimationFrame(suivante);
  }
  const vignette = a => `<span class="vignette"><img data-apercu="${a.id}" alt=""><i>${a.icone}</i></span>`;
  const badge = a => `<span class="badge-rarete" style="--r:${RARETES[a.rarete].couleur}">${RARETES[a.rarete].nom}</span>`;

  // ---------- le souk ----------
  let marchandOuvert = null;
  function ouvrirBoutique(id) {
    const Mm = MARCHANDS[id]; marchandOuvert = id;
    interface_ouverte = true; ctl.bloque = true;
    $('boutique-icone').textContent = Mm.icone; $('boutique-nom').textContent = Mm.nom; $('boutique-accueil').textContent = Mm.accueil; direTextes([{ t: Mm.accueil }]);
    $('boutique-pieces').textContent = AV.pieces;
    const dispo = articlesDuJour(quotidien.jour);
    const liste = ARTICLES.filter(a => a.marchand === id && (!a.emplacement || convient(a, genre())) && (dispo(a.id) || possede(a)));
    const tournant = ARTICLES.some(a => a.marchand === id && a.rotation);
    $('boutique-articles').innerHTML = `<div class="etal-grille">${liste.map(a => {
      const etiq = possede(a) ? (estEquipe(a) ? `<span class="etat-obj porte">✓ ${a.emplacement ? 'Porté' : 'Utilisé'}</span>` : `<span class="etat-obj">À toi</span>`)
        : `<span class="etat-obj prix-obj ${AV.pieces < a.prix ? 'cher' : ''}"><span class="piece"></span> ${a.prix}</span>`;
      return `<button class="objet" data-fiche="${a.id}" style="--r:${RARETES[a.rarete].couleur};--f:${RARETES[a.rarete].fond}">${vignette(a)}<b>${a.nom}</b>${badge(a)}${a.rotation && !possede(a) ? '<span class="du-jour">Aujourd\'hui</span>' : ''}${etiq}</button>`;
    }).join('')}</div>${tournant ? '<p class="note">Certains objets ne sont là que certains jours. Les objets utiles au voyage, eux, sont toujours en vente.</p>' : ''}`;
    const z = $('boutique-articles');
    if (QUETES.enigmes) z.insertAdjacentHTML('afterbegin', quetes.enigmeFaite(id) ? '<p class="enigme faite">🧩 Énigme résolue ✓</p>' : `<button class="enigme" data-enigme>🧩 ${Mm.nom.split(',')[0]} a une énigme pour toi !</button>`);
    const be = z.querySelector('[data-enigme]'); if (be) be.onclick = () => { $('boutique').classList.add('cache'); quetes.enigme(id, Mm.nom.split(',')[0], id, () => ouvrirBoutique(id)); };
    z.querySelectorAll('[data-fiche]').forEach(b => b.onclick = () => ficheObjet(article(b.dataset.fiche), () => ouvrirBoutique(id)));
    remplirApercus(z);
    $('boutique').classList.remove('cache');
  }
  function fermerBoutique() { if ($('boutique').classList.contains('cache')) return; $('boutique').classList.add('cache'); interface_ouverte = false; ctl.bloque = false; dernierEtatBoutons = ''; marchandOuvert = null; }
  $('boutique-fermer').addEventListener('click', fermerBoutique);

  // la fiche d'un objet : grande image, rareté, origine, prix, acheter ou utiliser
  function ficheObjet(a, retour) {
    if (!a) return;
    const R = RARETES[a.rarete], M2 = MARCHANDS[a.marchand], avoir = possede(a), eq = avoir && estEquipe(a);
    const pasPourToi = a.emplacement && !convient(a, genre());
    const boutons = [];
    if (!avoir) {
      if (AV.pieces >= a.prix) boutons.push({ txt: `Acheter · ${a.prix} pièces`, fn: () => setTimeout(() => confirmerAchat(a, retour), 40) });
      else boutons.push({ manque: { prix: a.prix } });
    } else if (a.cat === 'outil' && !a.emplacement) boutons.push({ txt: '✓ Il est à toi', fn: () => setTimeout(retour, 40) });
    else if (!pasPourToi) boutons.push({ txt: eq ? (a.cat === 'collection' ? 'Ranger' : 'Retirer') : (a.emplacement ? 'Porter' : a.cat === 'collection' ? 'Mettre dans ma cour' : 'Utiliser'), fn: () => { equiper(a, !eq); setTimeout(retour, 40); } });
    boutons.push({ txt: 'Retour', fn: () => setTimeout(retour, 40) });
    $('boutique').classList.add('cache');
    dialogue({ titre: a.nom, texte: a.desc,
      sous: [a.effet, `${R.nom} · ${ORIGINE[a.hist] || ''}`, avoir ? 'Tu as cet objet.' : `Vendu par ${M2 ? M2.nom : 'un marchand'} · ${a.prix} pièces`, pasPourToi ? 'Cet habit va à l\'autre personnage.' : ''].filter(Boolean).join(' — '),
      image: apercu(a), icone: a.icone, couleur: R.couleur, boutons });
  }
  function confirmerAchat(a, retour) {
    dialogue({ titre: `${a.icone} ${a.nom}`, texte: `Veux-tu acheter ${a.nom.charAt(0).toLowerCase() + a.nom.slice(1)} pour ${a.prix} Pièces de Nour ?`, sous: `Il te restera ${AV.pieces - a.prix} pièces.`,
      boutons: [{ txt: 'Oui, j\'achète !', fn: () => {
        const r = bourse.acheter(a.id, a.prix, a.nom);
        if (!r.ok) { montrerIndice(r.raison === 'deja' ? 'Tu as déjà cet objet !' : 'Il te manque des Pièces de Nour.', 2500); setTimeout(retour, 50); return; }
        AV.achats = (AV.achats || []).concat([{ id: a.id, nom: a.nom, icone: a.icone, quand: Date.now() }]);
        $('nb-pieces').textContent = AV.pieces; S.sonPiece(50);
        equiper(a, true);
        animationAchat(a, retour);
      } }, { txt: 'Non merci', fn: () => setTimeout(retour, 50) }] });
  }
  function animationAchat(a, retour) {
    const z = $('achat'), R = RARETES[a.rarete], url = apercu(a);
    z.style.setProperty('--r', R.couleur);
    $('achat-image').innerHTML = url ? `<img src="${url}" alt="">` : `<span>${a.icone}</span>`;
    $('achat-nom').textContent = a.nom; $('achat-rarete').textContent = R.nom;
    z.classList.remove('cache'); void z.offsetWidth; z.classList.add('joue');
    S.sonDecouverte(); if (!monte) enfant.faire('joie');
    const fin = () => { z.classList.add('cache'); z.classList.remove('joue'); z.onclick = null; clearTimeout(t); setTimeout(retour, 30); };
    const t = setTimeout(fin, 2600); z.onclick = fin;
  }

  // ---------- l'écurie : choisir, acheter et découvrir les montures ----------
  const cacheMonture = new Map();
  function apercuMonture(id) {
    if (cacheMonture.has(id)) return cacheMonture.get(id);
    let url = '';
    try {
      apercu(article('selle-cuir'));   // prépare le petit moteur d'aperçu
      const { r, cv, cam: c } = rendApercu, sc = new THREE.Scene();
      sc.add(new THREE.HemisphereLight('#fff6e6', '#c9a77e', 1.7)); const sol = new THREE.DirectionalLight('#fff3dc', 2.3); sol.position.set(2, 4, 4); sc.add(sol);
      const E = AV.equipement, a = k => article(E[k]) || null, tp = a('tapis'), se = a('selle'), co = a('couverture');
      const m = creerMonture(id, false);
      m.habiller({ tapis: tp ? tp.couleurs : undefined, motif: tp ? tp.motifTapis : null, selle: se ? se.couleur : undefined, selleBois: !!(se && se.bois), sacoches: !!E.sacoches, pompons: !!E.pompons, lanterne: !!E['lanterne-sablo'], couverture: co ? co.couleurs : null });
      m.animer(0.02, 0, 1); m.racine.rotation.y = 1.0; sc.add(m.racine); m.racine.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(m.racine), t = b.getSize(new THREE.Vector3()), ce = b.getCenter(new THREE.Vector3());
      const dist = Math.max(t.x, t.y, t.z) / (2 * Math.tan(15 * Math.PI / 180)) * 1.1;
      c.position.set(ce.x + dist * 0.15, ce.y + dist * 0.2, ce.z + dist); c.lookAt(ce);
      r.render(sc, c); url = cv.toDataURL('image/png');
      sc.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    } catch (e) { console.warn('aperçu monture', e); }
    cacheMonture.set(id, url); return url;
  }
  function ouvrirEcurie() {
    interface_ouverte = true; ctl.bloque = true; marchandOuvert = 'ecurie';
    $('boutique-icone').textContent = '🐎'; $('boutique-nom').textContent = 'Nabil, le gardien de l\'écurie';
    $('boutique-accueil').textContent = 'Bienvenue à l\'écurie ! Ici, tes montures se reposent, boivent et mangent. Choisis celle qui partira en voyage avec toi.'; direTextes([{ t: $('boutique-accueil').textContent }]);
    $('boutique-pieces').textContent = AV.pieces;
    $('boutique-articles').innerHTML = `<div class="etal-grille">${MONTURES.filter(m => !m.offerte || AV.montures.includes(m.id)).map(m => {
      const R = RARETES[m.rarete], avoir = AV.montures.includes(m.id), actif = AV.monture === m.id;
      const etiq = actif ? '<span class="etat-obj porte">✓ En voyage avec toi</span>' : avoir ? '<span class="etat-obj">À l\'écurie</span>' : `<span class="etat-obj prix-obj ${AV.pieces < m.prix ? 'cher' : ''}"><span class="piece"></span> ${m.prix}</span>`;
      return `<button class="objet" data-monture="${m.id}" style="--r:${R.couleur};--f:${R.fond}"><span class="vignette"><img data-apercu-monture="${m.id}" alt=""><i>${m.icone}</i></span><b>${m.nom}</b><span style="font-size:12px">${m.race}</span><span class="badge-rarete" style="--r:${R.couleur}">${R.nom}</span>${etiq}</button>`;
    }).join('')}</div><p class="note">Les montures marquées « Création du jeu » sont imaginaires. Les autres sont des animaux qui vivaient vraiment dans l'Arabie ancienne, ou qui y venaient avec les caravanes.</p>`;
    const z = $('boutique-articles');
    z.querySelectorAll('[data-monture]').forEach(b => b.onclick = () => ficheMonture(b.dataset.monture, ouvrirEcurie));
    const imgs = [...z.querySelectorAll('img[data-apercu-monture]')];
    const suivante = () => { const img = imgs.shift(); if (!img) return; const u = apercuMonture(img.dataset.apercuMonture); if (u) { img.src = u; img.parentNode.classList.add('avec-image'); } requestAnimationFrame(suivante); };
    requestAnimationFrame(suivante);
    $('boutique').classList.remove('cache');
  }
  function ficheMonture(id, retour) {
    const m = monture(id), R = RARETES[m.rarete], avoir = AV.montures.includes(id), actif = AV.monture === id;
    const boutons = [];
    if (!avoir) {
      if (AV.pieces >= m.prix) boutons.push({ txt: `Adopter · ${m.prix} pièces`, fn: () => setTimeout(() => dialogue({ titre: `${m.icone} ${m.nom}`, texte: `Veux-tu adopter ${m.nom} pour ${m.prix} Pièces de Nour ?`, sous: `Il te restera ${AV.pieces - m.prix} pièces. ${m.nom} vivra à l'écurie quand tu voyages avec une autre monture.`,
        boutons: [{ txt: 'Oui !', fn: () => {
          const r = bourse.acheter('monture-' + id, m.prix, m.nom);
          if (!r.ok) { montrerIndice(r.raison === 'deja' ? 'Cette monture est déjà à toi !' : 'Il te manque des Pièces de Nour.', 2500); setTimeout(retour, 50); return; }
          if (!AV.montures.includes(id)) AV.montures.push(id);
          ecurie.maj(AV.montures, AV.monture);
          AV.achats = (AV.achats || []).concat([{ id: 'monture-' + id, nom: m.nom, icone: m.icone, quand: Date.now() }]);
          $('nb-pieces').textContent = AV.pieces; S.sonPiece(50); enregistrer();
          const z = $('achat'); z.style.setProperty('--r', R.couleur);
          $('achat-image').innerHTML = apercuMonture(id) ? `<img src="${apercuMonture(id)}" alt="">` : `<span>${m.icone}</span>`;
          $('achat-nom').textContent = m.nom; $('achat-rarete').textContent = R.nom;
          z.classList.remove('cache'); void z.offsetWidth; z.classList.add('joue'); S.sonDecouverte(); sonMonture(m.espece);
          const fin = () => { z.classList.add('cache'); z.classList.remove('joue'); z.onclick = null; clearTimeout(tm); setTimeout(() => ficheMonture(id, retour), 30); };
          const tm = setTimeout(fin, 2600); z.onclick = fin;
        } }, { txt: 'Non merci', fn: () => setTimeout(retour, 40) }] }), 40) });
      else boutons.push({ manque: { prix: m.prix, verbe: 'l\'adopter' } });
    } else if (!actif) boutons.push({ txt: `Partir avec ${m.nom}`, fn: () => { choisirMonture(id); } });
    boutons.push({ txt: 'Retour', fn: () => setTimeout(retour, 40) });
    $('boutique').classList.add('cache');
    const ORI = { 'attesté': 'Animal connu dans l\'Arabie ancienne', 'plausible': 'Rare en Arabie, venu avec les caravanes', 'imaginaire': 'Création du jeu' };
    dialogue({ titre: `${m.nom} · ${m.race}`, texte: m.desc, sous: [FICHES_ESPECES[m.espece], `${R.nom} — ${ORI[m.hist]}`, actif ? `${m.nom} voyage avec toi.` : avoir ? `${m.nom} t'attend à l'écurie.` : ''].filter(Boolean).join(' — '),
      image: apercuMonture(id), icone: m.icone, couleur: R.couleur, boutons });
  }
  function choisirMonture(id) {
    if (monte || sequence) { montrerIndice('Descends d\'abord de ta monture.', 2500); return; }
    if (!AV.montures.includes(id) || AV.monture === id) return;
    AV.monture = id;
    scene.remove(chameau.racine); chameau.racine.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    chameau = creerMonture(id, !!Q.ombres); scene.add(chameau.racine);
    C.x = ecurie.sortie.x; C.z = ecurie.sortie.z; C.a = 0; C.vit = 0; C.venir = false;
    ecurie.maj(AV.montures, AV.monture);
    appliquerEquipement(); cacheMonture.clear();
    $('btn-chameau').querySelector('.ico').textContent = monture(id).icone;
    sonMonture(monture(id).espece); bandeau('Ta monture', monture(id).nom);
  }
  function sonMonture(espece = monture(AV.monture).espece) { if (espece === 'cheval') S.sonCheval(); else if (espece === 'elephant') S.sonElephant(); else S.sonChameau(); }

  // ---------- collections et badges ----------
  if (!AV.badges) AV.badges = {};
  const totalPierres = Object.values(POINTS).filter(p => p.decouverte).length;
  function contexteSucces() {
    const avoir = new Set((AV.achats || []).map(a => a.id));
    return { AV, etat, nbZones: etat.zones.length, totalZones: ZONES.length, totalPierres,
      nbPierres: etat.lus.filter(k => POINTS[k] && POINTS[k].decouverte).length,
      quotidienFaites: (etat.quotidien && etat.quotidien.reussies) || 0, sageJustes: (etat.quotidien && etat.quotidien.sageJustes) || 0,
      objetsCour: ARTICLES.filter(a => a.cat === 'collection' && avoir.has(a.id) && AV.cour[a.id] !== false).length,
      habits: ARTICLES.filter(a => a.emplacement && avoir.has(a.id)).length,
      legendaires: ARTICLES.filter(a => a.rarete === 'legendaire' && avoir.has(a.id)).length + MONTURES.filter(m => m.rarete === 'legendaire' && AV.montures.includes(m.id)).length,
      collectionFinie: k => { const p = progressionCollection(k, AV); return p.n === p.total; } };
  }
  function verifierSucces(silencieux) {
    const c = contexteSucces(), nouveaux = [];
    for (const k of COLLECTIONS) if (c.collectionFinie(k)) bourse.recompense('collection:' + k.id, k.pieces, 'Collection complète : ' + k.nom, ouDonner());
    for (const b of BADGES) if (!AV.badges[b.id] && b.ok(c)) { AV.badges[b.id] = Date.now(); nouveaux.push(b); }
    if (!nouveaux.length) return;
    enregistrer();
    if (silencieux) return;
    S.sonDecouverte();
    bandeau(nouveaux.length > 1 ? `${nouveaux.length} nouveaux badges` : 'Nouveau badge', nouveaux.length > 1 ? nouveaux.map(b => b.icone).join(' ') : `${nouveaux[0].icone} ${nouveaux[0].nom}`);
  }
  function pageSucces() {
    const c = contexteSucces();
    const coll = COLLECTIONS.map(k => {
      const p = progressionCollection(k, AV), fini = p.n === p.total;
      const nomObj = id => { const a = article(id); if (a) return `${a.icone} ${a.nom}`; const m = MONTURES.find(x => x.id === id); return m ? `${m.icone} ${m.nom}` : id; };
      return `<div class="carte-mission ${fini ? 'finie' : ''}"><h4>${k.icone} ${k.nom}${fini ? '<span class="etiquette">Complète ✓</span>' : ''}</h4>
        <p class="collection-liste">${p.liste.map(x => `<span class="${x.ok ? 'ok' : ''}">${x.ok ? '' : '❔ '}${nomObj(x.id)}</span>`).join('')}</p>
        <div class="barre"><i style="width:${p.n / p.total * 100}%"></i></div><p style="margin:6px 0 0;font-size:14px">${p.n} / ${p.total} · récompense : ${k.pieces} <span class="piece" style="width:16px;height:16px;vertical-align:-3px"></span></p></div>`;
    }).join('');
    const badges = BADGES.map(b => `<div class="${AV.badges[b.id] ? 'badge-gagne' : 'manque'}" title="${b.desc}"><span>${b.icone}</span><b>${b.nom}</b><small>${b.desc}</small></div>`).join('');
    const reg = (AV.registre || []).slice(-30).reverse();
    const date = t => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const histo = reg.length ? `<ul class="historique">${reg.map(e => `<li><span>${date(e.t)}</span><span>${e.raison}</span><b class="${e.n < 0 ? 'moins' : 'plus'}">${e.n > 0 ? '+' : ''}${e.n}</b></li>`).join('')}</ul>` : '<p class="note">Rien pour l\'instant.</p>';
    return `<h3>🎖️ Mes badges · ${Object.keys(AV.badges).length} / ${BADGES.length}</h3><div class="grille-collection badges">${badges}</div>
      <h3>🏆 Les collections</h3>${coll}
      <h3>📒 Ma bourse · <span class="piece"></span> ${AV.pieces}</h3>${histo}
      <p class="note">On gagne les Pièces de Nour en jouant, en explorant et en apprenant. On ne les achète jamais avec de l'argent.</p>`;
  }

  // ---------- les découvertes : un vrai petit événement ----------
  const effetDecouverte = creerEffetDecouverte(scene, H);
  let focus = null;                            // la caméra se tourne doucement vers ce qu'on découvre
  const fileDecouvertes = [];
  const TYPES = { mot: [ICONE_MOTS, 'Nouveau mot arabe !', 'Mot arabe'], plante: ['🌿', 'Nouvelle plante observée !', 'Plante'], animal: ['🔍', 'Nouvel animal observé !', 'Animal'],
    gravure: ['🪨', 'Gravure découverte !', 'Gravure'], nature: ['✨', 'Nouvelle découverte !', 'Découverte'], lieu: ['🗺️', 'Nouveau lieu découvert !', 'Lieu'] };
  // une image d'un modèle du jeu (pour les animaux)
  const cacheObjets = new Map();
  function rendreObjet(obj, cle) {
    if (cacheObjets.has(cle)) return cacheObjets.get(cle);
    let url = '';
    try {
      apercu(article('selle-cuir'));
      const { r, cv, cam: c } = rendApercu, sc = new THREE.Scene();
      sc.add(new THREE.HemisphereLight('#fff6e6', '#c9a77e', 1.8)); const so = new THREE.DirectionalLight('#fff3dc', 2.3); so.position.set(2, 4, 4); sc.add(so);
      const k = obj.clone(true); k.position.set(0, 0, 0); k.rotation.set(0, 0.7, 0); sc.add(k); k.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(k), t = b.getSize(new THREE.Vector3()), ce = b.getCenter(new THREE.Vector3());
      const dist = Math.max(t.x, t.y, t.z) / (2 * Math.tan(15 * Math.PI / 180)) * 1.15;
      c.position.set(ce.x + dist * 0.1, ce.y + dist * 0.18, ce.z + dist); c.lookAt(ce);
      r.render(sc, c); url = cv.toDataURL('image/png');
    } catch (e) { console.warn('image', e); }
    cacheObjets.set(cle, url); return url;
  }
  function decouvrir(d) {
    if (interface_ouverte && !d.forcer) { fileDecouvertes.push(d); return; }   // une autre fenêtre est ouverte : on attend
    interface_ouverte = true; ctl.bloque = true;
    if (d.nouveau) {
      S.sonMerveille();
      if (d.x != null) { effetDecouverte.jouer(d.x, d.z, d.y ?? null); focus = { x: d.x, z: d.z }; setTimeout(() => panneauDecouverte(d), 1150); return; }
    }
    panneauDecouverte(d);
  }
  function panneauDecouverte(d) {
    const T = TYPES[d.type] || TYPES.nature, z = $('decouverte'), mot = d.type === 'mot';
    $('dec-icone').innerHTML = T[0].startsWith('<svg') ? T[0] : `<span>${T[0]}</span>`;
    $('dec-type').textContent = d.nouveau ? T[1] : T[2];
    const img = d.objet ? rendreObjet(d.objet, d.type + ':' + d.cle) : illustration(d.cle);
    $('dec-image').src = img || ''; $('dec-emoji').textContent = img ? '' : (d.icone || '✨');
    $('dec-nom').textContent = mot ? d.nom.charAt(0).toUpperCase() + d.nom.slice(1) : d.nom;
    $('dec-arabe').textContent = d.arabe || ''; $('dec-arabe').classList.toggle('cache', !d.arabe);
    $('dec-translit').textContent = d.translit ? d.translit.charAt(0).toUpperCase() + d.translit.slice(1) : ''; $('dec-translit').classList.toggle('cache', !d.translit);
    $('dec-texte').textContent = d.texte || '';
    $('dec-sous').textContent = d.sous || ''; $('dec-sous').classList.toggle('cache', !d.sous);
    const p = d.progression;
    $('dec-progres-txt').textContent = p ? `${p.n} ${p.label} sur ${p.total}` : '';
    $('dec-barre').style.transition = 'none'; $('dec-barre').style.width = p ? `${((d.nouveau ? p.n - 1 : p.n) / p.total) * 100}%` : '0';
    z.querySelector('.dec-progres').classList.toggle('cache', !p);
    setTimeout(() => { $('dec-barre').style.transition = 'width 1s ease'; $('dec-barre').style.width = p ? `${p.n / p.total * 100}%` : '0'; }, 450);
    const b = $('dec-ecouter');
    b.innerHTML = `${ICONE_SON}<span>${mot || d.arabe ? 'Écouter en arabe' : 'Écouter'}</span>`;
    b.onclick = () => { b.classList.add('parle'); setTimeout(() => b.classList.remove('parle'), 1800); if (mot || d.arabe) parlerArabe(d.arabe); else if (!direTextes([{ t: d.nom, opt: true }, { t: d.texte }])) parler(`${d.nom}. ${d.texte || ''}`); };
    z.classList.remove('cache', 'joue'); void z.offsetWidth; z.classList.add('joue');
    if (d.nouveau) {
      if (!monte) enfant.faire('joie');
      if (!direTextes([{ t: T[1] }, { t: mot ? d.arabe : d.nom, opt: !mot }])) parler(mot ? `Nouveau mot arabe : ${d.nom}.` : `${T[1].replace(' !', '')} : ${d.nom}.`);
    }
    $('dec-ok').focus({ preventScroll: true });
  }
  function fermerDecouverte() {
    if ($('decouverte').classList.contains('cache')) return;
    $('decouverte').classList.add('cache'); $('decouverte').classList.remove('joue');
    focus = null; interface_ouverte = false; ctl.bloque = false; dernierEtatBoutons = '';
    try { speechSynthesis.cancel(); } catch (e) {} arreterVoixVoyage();
    const suite = fileDecouvertes.shift(); if (suite) setTimeout(() => decouvrir(suite), 400);
  }
  $('dec-ok').addEventListener('click', fermerDecouverte);
  $('decouverte').addEventListener('click', e => { if (e.target.id === 'decouverte') fermerDecouverte(); });
  // les fenêtres en attente s'ouvrent quand les autres se ferment
  setInterval(() => { if (!interface_ouverte && fileDecouvertes.length) decouvrir(fileDecouvertes.shift()); }, 600);

  // ---------- choisir son personnage (au premier voyage, puis dans les réglages) ----------
  function ouvrirPerso(premiere) {
    fermerPanneaux();
    const P0 = perso();
    persoEssai = { genre: P0 ? P0.genre : 'fille', tenue: P0 ? P0.tenue : 'ecru', peau: P0 ? P0.peau : 1 };
    interface_ouverte = true; ctl.bloque = true; portrait = { tour: 0 };
    $('tactile').classList.add('cache'); $('suivi').classList.add('cache');
    $('perso-titre').textContent = premiere ? 'Qui part en voyage ?' : 'Mon personnage';
    if (premiere) direIds(['NOUR-VOIX-NAV-012']);
    $('perso-ok').textContent = premiere ? 'C\'est parti !' : 'Terminé';
    $('perso-annuler').classList.toggle('cache', !!premiere);
    const dessiner = () => {
      document.querySelectorAll('#perso [data-genre]').forEach(b => b.setAttribute('aria-pressed', b.dataset.genre === persoEssai.genre));
      $('perso-tenues').innerHTML = Object.entries(TENUES).map(([k, t]) => `<button class="pastille-tenue" data-tenue="${k}" aria-pressed="${k === persoEssai.tenue}" title="${t.nom}"><i style="background:${t.robe}"></i><i style="background:${persoEssai.genre === 'fille' ? t.voile : t.ceinture}"></i><span>${t.nom}</span></button>`).join('');
      $('perso-peaux').innerHTML = PEAUX.map((c, i) => `<button class="pastille-peau" data-peau="${i}" aria-pressed="${i === persoEssai.peau}" style="background:${c}" aria-label="Couleur de peau ${i + 1}"></button>`).join('');
      document.querySelectorAll('#perso [data-tenue]').forEach(b => b.onclick = () => { persoEssai.tenue = b.dataset.tenue; dessiner(); appliquerEquipement(); });
      document.querySelectorAll('#perso [data-peau]').forEach(b => b.onclick = () => { persoEssai.peau = +b.dataset.peau; dessiner(); appliquerEquipement(); });
    };
    document.querySelectorAll('#perso [data-genre]').forEach(b => b.onclick = () => { persoEssai.genre = b.dataset.genre; dessiner(); appliquerEquipement(); enfant.faire('salut'); });
    $('perso-tourner').onclick = () => { portrait.tour += Math.PI / 2; };
    const fermer = garder => {
      if (garder) sauvegarde.regler('personnage', { ...persoEssai, choisi: Date.now() });
      persoEssai = null; portrait = null;
      $('perso').classList.add('cache'); $('tactile').classList.remove('cache'); $('hud').classList.remove('en-perso');
      interface_ouverte = false; ctl.bloque = false; dernierEtatBoutons = '';
      cacheApercu.clear(); appliquerEquipement();
      if (garder && premiere && !etat.aideVue) montrerAide();
    };
    $('perso-ok').onclick = () => fermer(true);
    $('perso-annuler').onclick = () => fermer(false);
    dessiner(); appliquerEquipement(); enfant.faire('salut');
    $('perso').classList.remove('cache'); $('hud').classList.add('en-perso');
  }
  $('ouvrir-perso').addEventListener('click', () => ouvrirPerso(false));

  // ---------- la carte du pays et le guidage ----------
  const guide = creerGuide({ scene, terrain, colliders: decor.colliders, col: decor.col, fermees: () => regions.fermees() });
  const rayonGuide = () => monte ? (monture(AV.monture).espece === 'elephant' ? 2.0 : 1.4) : 0.8;
  const posGuide = () => monte ? { x: C.x, z: C.z } : { x: J.x, z: J.z };
  function lieuxCarte() {
    const L = [], z = id => ZONES.find(o => o.id === id), connue = id => etat.zones.includes(id);
    const zone = (id, x, zz, cat, region, extra = {}) => { const o = z(id); L.push({ id: 'zone:' + id, zone: id, nom: o.nom, icone: o.icone, cat, x, z: zz, connu: connue(id), fait: connue(id), region, grand: true, ...extra }); };
    zone('village', 0, 0, 'village', 0, { rayon: 20 });
    zone('marche', marche.centre.x, marche.centre.z, 'marche', 0, { rayon: 10 });
    zone('oasis', LIEUX.oasis.x - LIEUX.oasis.lac - 6, LIEUX.oasis.z, 'oasis', 55, { rayon: 12 });
    const fermePremium = id => acces.zoneOuverte(id) ? null : MESSAGE_FERME;
    zone('camp', LIEUX.camp.x, LIEUX.camp.z, 'camp', 45, { rayon: 14, verrou: fermePremium('camp') });
    zone('dunes', LIEUX.dunes.x, LIEUX.dunes.z, 'desert', 110, { rayon: 30, verrou: fermePremium('dunes') });
    zone('montagnes', 0, -258, 'montagne', 75, { rayon: 18, verrou: fermePremium('montagnes') || decor.col.ouvert ? fermePremium('montagnes') : 'Le passage vers les montagnes est encore fermé. Découvre d\'abord l\'oasis et le camp des caravanes.' });
    zone('wadi', LIEUX.wadi.x, LIEUX.wadi.z, 'desert', 50, { rayon: 14, icone: '🌼', verrou: regions.ouverte('wadi') ? null : regions.explication('wadi') });
    zone('rochers', LIEUX.rochers.x, LIEUX.rochers.z, 'decouverte', 44, { rayon: 12, icone: '🪨', verrou: regions.ouverte('rochers') ? null : regions.explication('rochers') });
    L.push({ id: 'col', nom: 'Le col', cat: 'passage', x: 0, z: -150, connu: true, rayon: 8, verrou: fermePremium('col') || decor.col.ouvert ? fermePremium('col') : 'Ce passage s\'ouvrira quand tu auras découvert l\'oasis et le camp des caravanes.', texte: 'Le passage entre le village et les montagnes.' });
    L.push({ id: 'puits', nom: 'Le puits du village', cat: 'eau', x: 0, z: 3.4, connu: true, rayon: 4 });
    L.push({ id: 'abreuvoir', nom: 'L\'abreuvoir de l\'enclos', cat: 'eau', x: 36.5, z: -12.5, connu: true, rayon: 4 });
    L.push({ id: 'ecurie', nom: 'L\'écurie de Nabil', cat: 'ecurie', x: ecurie.point.x, z: ecurie.point.z, connu: true, rayon: 4, texte: 'Pour choisir ou adopter une monture.' });
    L.push({ id: 'cour', nom: 'Ma cour', cat: 'maison', x: cour.centre.x, z: cour.centre.z, connu: true, rayon: 4.5, texte: 'Ta maison, où tu exposes tes objets.' });
    const s = decor.points.find(p => p.id === 'sage'); if (s) L.push({ id: 'hakim', nom: 'Hakim, l\'ancien', cat: 'personne', icone: '🧓', x: s.x, z: s.z, connu: true, rayon: 3.5, texte: 'Il pose trois questions chaque jour.' });
    for (const p of decor.points) { const d = POINTS[p.id]; if (!d || !d.decouverte) continue;
      L.push({ id: 'pierre:' + p.id, nom: d.titre, cat: 'pierre', x: p.x, z: p.z, connu: true, fait: etat.lus.includes(p.id), rayon: 3.5 }); }
    const gr = aventure.grotte;
    if (gr && (connue('montagnes') || AV.equipement.carte)) L.push({ id: 'grotte', nom: 'La grotte des montagnes', cat: 'decouverte', icone: '🕳️', x: gr.x, z: gr.z, connu: true, fait: AV.ramasses.includes('jarre'), rayon: 4,
      texte: 'Il y fait tout noir : il faut une lampe à huile.', verrou: decor.col.ouvert ? null : 'Le passage vers les montagnes est encore fermé.' });
    if (AV.equipement.carte && !etat.lus.includes('etoiles') && !decor.points.some(p => p.id === 'etoiles')) L.push({ id: 'secret', nom: 'Un endroit secret', cat: 'decouverte', x: -70, z: 238, connu: true, rayon: 6, texte: 'Ta carte des secrets montre ici quelque chose à découvrir…' });
    return L;
  }
  function guiderVers(d) {
    const r = guide.activer(d, posGuide(), rayonGuide());
    if (!r.ok && d.silencieux) return false;
    if (!r.ok) {
      const msg = r.raison === 'col' ? 'Le passage vers les montagnes est encore fermé : découvre d\'abord l\'oasis et le camp des caravanes.'
        : r.raison === 'region' ? regions.explication(r.region)
        : 'Je ne trouve pas de chemin praticable jusque-là pour le moment. Essaie depuis un autre endroit, ou choisis un lieu tout près.';
      dialogue({ titre: '🧭 Pas de chemin', texte: msg }); return false;
    }
    etat.guidage = { id: d.id, x: d.x, z: d.z, nom: d.nom, icone: d.icone, rayon: d.rayon }; enregistrer();   // repris si on revient plus tard
    if (!d.silencieux) { S.sonPorte(); montrerIndice(`🧭 En route vers ${d.nom} ! Suis les petites lumières dorées.`, 3500); }
    majGuidage(null);
    return true;
  }
  const carte = creerCarte(terrain, {
    lieux: lieuxCarte, joueur: () => ({ x: J.x, z: J.z, a: monte ? C.a : J.a }),
    monture: () => ({ x: C.x, z: C.z, icone: monture(AV.monture).icone, avecToi: monte }),
    route: () => guide.route, dest: () => guide.dest,
    guider: l => guiderVers({ id: l.id, x: l.x, z: l.z, nom: l.connu ? l.nom : 'un lieu inconnu', icone: l.connu ? (l.icone || CATEGORIES[l.cat].icone) : '❔', rayon: l.rayon || 5 }),
    arreter: () => { guide.arreter(); etat.guidage = null; enregistrer(); majGuidage(null); }, fermer: () => fermerCarte()
  });
  function ouvrirCarte(lieuId) {
    if (route && route.enRoute()) { if (!interface_ouverte) route.ouvrirCarte(); return; }
    if (interface_ouverte && $('carte-pays').classList.contains('cache')) return;
    fermerPanneaux(); interface_ouverte = true; ctl.bloque = true;
    $('carte-pays').classList.remove('cache'); carte.ouvrir(lieuId);
  }
  function fermerCarte() { if ($('carte-pays').classList.contains('cache')) return; carte.fermer(); $('carte-pays').classList.add('cache'); interface_ouverte = false; ctl.bloque = false; dernierEtatBoutons = ''; }
  $('btn-carte').addEventListener('click', () => ouvrirCarte());
  $('carte-fermer').addEventListener('click', fermerCarte);
  addEventListener('keydown', e => { if (e.code === 'KeyM' && !e.repeat) { if (!$('carte-pays').classList.contains('cache')) fermerCarte(); else if (!interface_ouverte) ouvrirCarte(); } if (e.code === 'Escape') fermerCarte(); });
  // le petit bandeau du guidage, en haut de l'écran
  function majGuidage(info) {
    const g = $('guidage');
    if (!guide.dest) { g.classList.add('cache'); return; }
    g.classList.toggle('cache', interface_ouverte);
    if (!info) return;
    const d = info.distance;
    $('guidage-txt').textContent = `${guide.dest.icone || '🧭'} ${guide.dest.nom} · ${info.probleme ? 'chemin introuvable' : d > 950 ? (d / 1000).toFixed(1).replace('.', ',') + ' km' : Math.round(d / 5) * 5 + ' m'}`;
    $('guidage-fleche').style.transform = `rotate(${-angleVers(cam.yaw + Math.PI, info.cap)}rad)`;
    $('guidage-voir').classList.toggle('eteint', !guide.montrer);
  }
  $('guidage-voir').addEventListener('click', () => { guide.montrer = !guide.montrer; montrerIndice(guide.montrer ? '👣 Les lumières du chemin sont visibles.' : '👣 Lumières cachées : tu explores librement, la flèche reste là.', 2500); });
  $('guidage-stop').addEventListener('click', () => { guide.arreter(); etat.guidage = null; enregistrer(); majGuidage(null); montrerIndice('Guidage arrêté. Bonne exploration !', 2000); });
  $('guidage-txt').addEventListener('click', () => ouvrirCarte());
  // se faire guider vers la prochaine étape d'une mission
  function guiderMission(k) {
    const c = aventure.prochaineCible(J, k);
    if (!c) { montrerIndice('Rien à chercher pour cette mission pour l\'instant : parle aux habitants !', 3000); return; }
    const M = MISSIONS[k];
    guiderVers({ id: 'mission:' + k, x: c.x, z: c.z, nom: M.titre, icone: M.icone, rayon: 3.5 });
  }
  function guiderJour(type) {
    const J0 = posGuide(), proche = l => l.reduce((b, o) => !b || Math.hypot(o.x - J0.x, o.z - J0.z) < Math.hypot(b.x - J0.x, b.z - J0.z) ? o : b, null);
    let d = null;
    if (type === 'oasis') d = lieuxCarte().find(l => l.id === 'zone:oasis');
    else if (type === 'souk') d = lieuxCarte().find(l => l.id === 'zone:marche');
    else if (type === 'sage') d = lieuxCarte().find(l => l.id === 'hakim');
    else if (type === 'lieux') d = proche(lieuxCarte().filter(l => l.zone && !l.connu && !l.verrou && !(quotidien.J.lieux || []).includes(l.zone))) || proche(lieuxCarte().filter(l => l.zone && !l.verrou && !(quotidien.J.lieux || []).includes(l.zone)));
    else if (type === 'pierre') d = proche(lieuxCarte().filter(l => l.cat === 'pierre' && !l.fait)) || proche(lieuxCarte().filter(l => l.cat === 'pierre'));
    else if (type === 'lanterne') { const c = aventure.prochaineCible(J, 'lanternes'); if (c) d = { id: 'lanterne', x: c.x, z: c.z, nom: 'une lanterne cachée', icone: '🏮', rayon: 3.5 }; }
    else if (type === 'animal') { const c = aventure.prochaineCible(J, 'animaux'); if (c) d = { id: 'animal', x: c.x, z: c.z, nom: 'un animal', icone: '🦊', rayon: 8 }; }
    if (!d) { montrerIndice('Pas de destination précise pour celle-ci : à toi de jouer !', 3000); return; }
    guiderVers({ id: d.id, x: d.x, z: d.z, nom: d.nom, icone: d.icone || (CATEGORIES[d.cat] || {}).icone, rayon: d.rayon || 5 });
  }
  const JOUR_GUIDABLE = ['oasis', 'souk', 'sage', 'lieux', 'pierre', 'lanterne', 'animal'];
  function guiderQuete(cle) {
    const [sorte, id] = cle.split(':'), P0 = posGuide();
    if (sorte === 'mission') return guiderMission(id);
    let d = null;
    if (sorte === 'quete') {
      if (id === 'coins') { const l = lieuxCarte().filter(l => ['zone:oasis', 'zone:camp', 'zone:dunes', 'zone:montagnes'].includes(l.id) && !l.connu && !l.verrou);
        d = l.sort((a, b) => Math.hypot(a.x - P0.x, a.z - P0.z) - Math.hypot(b.x - P0.x, b.z - P0.z))[0]; if (d) d = { ...d, nom: 'une nouvelle région', icone: '❔' }; }
      else if (id === 'enigmes') { const m = ['karim', 'amina', 'hassan', 'layla', 'samira'].find(k => !quetes.enigmeFaite(k)); const pt = m && decor.points.find(p => p.id === 'boutique-' + m);
        if (pt) d = { x: pt.x, z: pt.z, nom: MARCHANDS[m].nom.split(',')[0], icone: '🧩', rayon: 3 }; }
      else d = quetes.destination(id, P0);
    } else if (sorte === 'collection') {
      const k = COLLECTIONS.find(c => c.id === id), p = k && progressionCollection(k, AV), manque = p && p.liste.find(x => !x.ok);
      if (manque) { if (k.montures) d = { x: ecurie.point.x, z: ecurie.point.z, nom: 'l\'écurie de Nabil', icone: '🐎', rayon: 3.5 };
        else { const a = article(manque.id), pt = a && decor.points.find(p => p.id === 'boutique-' + a.marchand); if (pt) d = { x: pt.x, z: pt.z, nom: MARCHANDS[a.marchand].nom.split(',')[0], icone: a.icone, rayon: 3 }; } }
    }
    if (!d) { montrerIndice('Pas de destination précise pour celle-ci : à toi de jouer !', 3000); return; }
    guiderVers({ id: cle, x: d.x, z: d.z, nom: d.nom, icone: d.icone, rayon: d.rayon || 5 });
  }

  // ---------- les jumelles ----------
  let jumelles = false, vol = 0, retourVol = 0;
  const faucon = creerFaucon(scene, H, !!Q.ombres);
  const camVol = new THREE.Vector3(), viseVol = new THREE.Vector3(), viseLisse = new THREE.Vector3();
  $('btn-jumelles').addEventListener('click', () => {
    jumelles = !jumelles; vol = 0;
    $('btn-jumelles').classList.toggle('actif', jumelles);
    camera.fov = jumelles ? 60 : 55; camera.updateProjectionMatrix();
    if (jumelles) {
      // le faucon part du bras levé de l'enfant, dans la direction où regarde la caméra
      const r = enfant.racine.position; if (!monte) enfant.faire('salut');
      faucon.envol(new THREE.Vector3(r.x, r.y + (monte ? 2.6 : 1.5), r.z), Math.atan2(-Math.sin(cam.yaw), -Math.cos(cam.yaw)));
      viseLisse.copy(camera.position).add(new THREE.Vector3(-Math.sin(cam.yaw) * 10, 0, -Math.cos(cam.yaw) * 10));
    } else { retourVol = 1; faucon.rappeler(); }
    aventure.reperes(jumelles);
    let v = $('vue-jumelles');
    if (jumelles && !v) { v = document.createElement('div'); v.id = 'vue-jumelles'; document.body.appendChild(v); }
    if (v) v.classList.toggle('cache', !jumelles);
    if (jumelles) { montrerIndice('🦅 Ton faucon s\'envole et regarde au loin. Tourne la caméra : les lanternes cachées brillent !', 3800); S.sonDecouverte(); }
  });

  // ---------- la boucle ----------
  const horloge = new THREE.Clock();
  let tTotal = 0, tSauvegarde = 0, tZone = 0;
  // si l'appareil peine, on allège tout de suite (et on propose le profil inférieur la prochaine fois)
  const fluidite = surveillerFluidite(() => {
    renderer.setPixelRatio(1);
    if (!etat.profil && profil !== 'faible') { etat.profilAuto = profil === 'eleve' ? 'equilibre' : 'faible'; enregistrer(); }
  });
  // Redimensionnement et rotation du téléphone (certains téléphones donnent la nouvelle taille un peu après la rotation)
  let tailleEcran = '', portraitEcran = innerHeight > innerWidth;
  function ajusterEcran() {
    const t = innerWidth + 'x' + innerHeight; if (t === tailleEcran || !innerWidth || !innerHeight) return; tailleEcran = t;
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false);
    const p = innerHeight > innerWidth;
    if (p !== portraitEcran) { portraitEcran = p; ctl.rotation(); } else ctl.appliquer();
  }
  const ajusterBientot = () => { ajusterEcran(); setTimeout(ajusterEcran, 250); setTimeout(ajusterEcran, 700); };
  addEventListener('resize', ajusterBientot);
  addEventListener('orientationchange', ajusterBientot);
  if (window.visualViewport) visualViewport.addEventListener('resize', ajusterBientot);
  ajusterEcran();
  const premierCadre = (() => { const v = new THREE.Vector3(); return v; })();
  let phasePasEnfant = 0, phasePasChameau = 0, portrait = null;

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
      const dm = monture(AV.monture), vmax = d.course ? dm.vitesse[1] : dm.vitesse[0];
      let cibleV = 0;
      if (force > 0.05) {
        const voulu = Math.atan2(wx, wz), ecart = angleVers(C.a, voulu);
        C.a += Math.sign(ecart) * Math.min(Math.abs(ecart), dt * (d.course ? 1.8 : 2.4));
        cibleV = vmax * force * Math.max(0.15, Math.cos(Math.min(Math.abs(ecart), 1.4)));
      }
      C.vit += (cibleV - C.vit) * Math.min(1, dt * (cibleV > C.vit ? 2.2 : 3.5));
      bouger(C, Math.sin(C.a) * C.vit * dt, Math.cos(C.a) * C.vit * dt, monture(AV.monture).espece === 'elephant' ? 1.8 : 1.1, dt);
      J.x = C.x; J.z = C.z; J.a = C.a; J.vit = 0;
    } else {
      const vmax = (d.course ? 6.2 : 3.3) * (d.analogique || 0) * (route && route.enRoute() ? route.facteurMarche : 1);   // sur la Route : marche un peu plus lente
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
          const but = sortieEnclos({ x: C.x, z: C.z }, { x: J.x, z: J.z });      // appelée depuis l'enclos : la monture passe par la porte, jamais à travers la clôture
          const ecart = angleVers(C.a, Math.atan2(but.x - C.x, but.z - C.z));
          C.a += Math.sign(ecart) * Math.min(Math.abs(ecart), dt * 2.5);
          C.vit += ((dist > 20 ? 9 : 5) - C.vit) * Math.min(1, dt * 2);
          bouger(C, Math.sin(C.a) * C.vit * dt, Math.cos(C.a) * C.vit * dt, 1.1, dt);
        }
      } else if (!C.rentre) C.vit *= Math.max(0, 1 - dt * 4);
    }

    // --- soins de la monture : besoins, marche d'approche, poses ---
    soins.tick(AV.monture, dt, { monte, vit: C.vit }); avancerSoin(dt); majRentree(dt);
    majVeille(dt, tTotal); loumi.maj(dt, tTotal, J, besoinEnCours ? C : null); habitants.maj(J, () => fermerLecture()); majSoinsHUD(dt);
    if (nourSprite) nourSprite.position.set(NOUR.x, H(NOUR.x, NOUR.z) + 1.6 + Math.sin(tTotal * 1.8) * 0.12, NOUR.z);
    // --- placer les modèles ---
    chameau.racine.position.set(C.x, H(C.x, C.z), C.z);
    chameau.racine.rotation.y = C.a;
    { const dEnf = Math.hypot(J.x - C.x, J.z - C.z);
      chameau.regard = !monte && !sequence && dEnf < 7 && dEnf > 0.5 ? angleVers(C.a, Math.atan2(J.x - C.x, J.z - C.z)) : null; }
    chameau.animer(dt, sequence ? 0 : C.vit, tTotal);
    appliquerPoseSoin(dt);
    { const e = chameau.espece === 'elephant' ? [3.2, 4.4] : chameau.espece === 'cheval' ? [1.0, 2.4] : [1.3, 2.9];
      blobs[1].position.set(C.x, H(C.x, C.z) + 0.05, C.z); blobs[1].rotation.y = C.a; blobs[1].scale.set(e[0], 1, e[1]);
      if (!monte) { const r = enfant.racine.position; blobs[0].visible = true; blobs[0].position.set(r.x, H(r.x, r.z) + 0.05, r.z); blobs[0].scale.set(0.75, 1, 0.75); } else blobs[0].visible = false; }
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
      phasePasChameau = p; const dc = Math.hypot(C.x - J.x, C.z - J.z); (chameau.espece === 'cheval' ? S.pasCheval : S.pasChameau)(Math.max(0.15, 1 - dc / 40) * (C.vit > 8 ? 1.2 : 0.8));
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
    if (regard && regard.t > 0 && !interface_ouverte) { regard.t -= dt; cam.yawCible = Math.atan2(J.x - regard.x, J.z - regard.z); cam.pitchCible = Math.max(cam.pitchCible, 0.17); }
    cam.yaw += angleVers(cam.yaw, cam.yawCible) * Math.min(1, dt * 12);
    cam.pitch += (cam.pitchCible - cam.pitch) * Math.min(1, dt * 12);
    let distBase = (monte || (sequence && sequence.type === 'monter')) ? (chameau.espece === 'elephant' ? 13 : 10.5) : 6.5;
    if (focus) {   // pendant une découverte : on regarde l'objet, de derrière l'enfant
      const ox = monte ? C.x : J.x, oz = monte ? C.z : J.z;
      cam.yawCible = Math.atan2(ox - focus.x, oz - focus.z); cam.pitchCible = 0.3; distBase = monte ? 9 : 5;
    }
    cam.dist += (distBase + cam.zoomPerso - cam.dist) * Math.min(1, dt * 3);
    const cibleY = monte ? vSelle.y + 1.0 : enfant.racine.position.y + 1.35;
    if (focus) cam.cible.lerp(premierCadre.set(((monte ? C.x : J.x) * 0.55 + focus.x * 0.45), cibleY - 0.2, ((monte ? C.z : J.z) * 0.55 + focus.z * 0.45)), Math.min(1, dt * 3));
    else cam.cible.lerp(premierCadre.set(monte ? C.x : J.x, cibleY, monte ? C.z : J.z), Math.min(1, dt * 10));
    const cp = Math.cos(cam.pitch);
    // un poteau, un palmier ou une maison entre la caméra et l'enfant : la caméra se rapproche en douceur pour ne pas le perdre de vue
    { const sx = Math.sin(cam.yaw), sz = Math.cos(cam.yaw), L = cam.dist * cp; let libre = cam.dist;
      for (const o of decor.colliders) {
        const ox = o.x - cam.cible.x, oz = o.z - cam.cible.z; if (Math.abs(ox) > L + o.r || Math.abs(oz) > L + o.r) continue;
        const t = ox * sx + oz * sz; if (t < 0.3 || t > L) continue;                 // l'obstacle est-il entre les deux ?
        const lat = Math.abs(ox * sz - oz * sx); if (lat > o.r + 0.15) continue;
        const hCam = Math.sin(cam.pitch) * cam.dist * (t / L); if (hCam > 3.2) continue;   // la caméra passe au-dessus
        libre = Math.min(libre, Math.max(1.8, (t - o.r - 0.3) / Math.max(0.2, cp)));
      }
      cam.distVue = cam.distVue == null ? cam.dist : cam.distVue + (libre - cam.distVue) * Math.min(1, dt * (libre < cam.distVue ? 8 : 2)); }
    const dv = Math.min(cam.dist, cam.distVue);
    let px = cam.cible.x + Math.sin(cam.yaw) * cp * dv, pz = cam.cible.z + Math.cos(cam.yaw) * cp * dv;
    let py = cam.cible.y + Math.sin(cam.pitch) * dv;
    py = Math.max(py, H(px, pz) + 0.7);
    cam.pos.set(px, py, pz);
    if (jumelles || retourVol > 0) {
      // le faucon du voyageur : la caméra le suit de derrière ; l'enfant le dirige en tournant la caméra
      if (jumelles) { vol = Math.min(1, vol + dt * 0.8); faucon.viser(Math.atan2(-Math.sin(cam.yaw), -Math.cos(cam.yaw))); }
      else retourVol = Math.max(0, retourVol - dt * 1.2);
      const k0 = jumelles ? vol : retourVol, k = k0 * k0 * (3 - 2 * k0);
      faucon.camera(camVol, viseVol);
      camera.position.lerpVectors(cam.pos, camVol, k);
      camera.position.y = Math.max(camera.position.y, H(camera.position.x, camera.position.z) + 1);
      viseLisse.lerp(viseVol, 1 - Math.exp(-dt * 6));
      const regard = new THREE.Vector3().lerpVectors(cam.cible, viseLisse, k);
      camera.lookAt(regard);
    } else if (portrait && !monte) {
      // vue de face, pour se voir pendant qu'on choisit ses habits
      const r = enfant.racine.position, ang = J.a + portrait.tour, ec = innerWidth / innerHeight < 0.8;
      // sur grand écran, on décale pour laisser la place au panneau ; sur téléphone, le personnage se place en haut de l'écran
      const lat = ec ? 0 : -0.55, d = ec ? 4.3 : 3.1;
      camera.position.set(r.x + Math.sin(ang) * d + Math.cos(ang) * lat, r.y + (ec ? 0.8 : 1.05), r.z + Math.cos(ang) * d - Math.sin(ang) * lat);
      camera.lookAt(r.x + Math.cos(ang) * lat, r.y + (ec ? -0.25 : 0.72), r.z - Math.sin(ang) * lat);
    } else {
      camera.position.copy(cam.pos);
      camera.lookAt(cam.cible);
    }

    // --- monde vivant ---
    const nuit = ciel.maj(dt, cam.cible, etat.cycle !== false); nuitActuelle = !!nuit;
    decor.maj({ x: J.x, z: J.z }, tTotal, nuit);
    if (route) route.maj(dt, tTotal, nuit);
    if (village) village.animer(dt, tTotal);
    oiseaux.maj(dt, tTotal, nuit);
    faucon.maj(dt, tTotal, { x: enfant.racine.position.x, y: enfant.racine.position.y, z: enfant.racine.position.z });
    { const sol = terrain.matiere(J.x, J.z), village = Math.hypot(J.x, J.z) < 60;
      effets.maj(dt, { x: J.x, z: J.z }, village ? 0 : (1 - sol.herbe) * (1 - nuit * 0.6) * (0.5 + 0.5 * Math.sin(tTotal * 0.15) ** 2), tTotal); }

    // --- ce qu'on peut faire ici ---
    proche = null;
    let meilleur = Infinity;
    for (const p of decor.points) { const dd = Math.hypot(p.x - J.x, p.z - J.z); if (dd < p.r && dd < meilleur) { meilleur = dd; proche = p; } }
    procheAv = sequence || soin ? null : (() => { const t = [aventure.interaction(J), quetes.interaction(J), interactionSoins(), interactionMontures(), habitants.interaction(J)].filter(Boolean); return t.length ? t.reduce((x, y) => (y.d < x.d ? y : x)) : null; })();
    aventure.maj(dt, tTotal, J, monte ? C.vit > 6 : J.vit > 4.2, nuit);
    quetes.maj(dt, tTotal, posGuide(), monte && !sequence);
    marche.maj(dt, tTotal, J); ecurie.animer(dt, tTotal, J); effetDecouverte.maj(dt);
    { const info = guide.maj(dt, tTotal, posGuide(), rayonGuide());
      if (info && info.arrive) { majGuidage(null); etat.guidage = null; enregistrer(); S.sonDecouverte(); bandeau('Tu es arrivé !', `${info.dest.icone || ''} ${info.dest.nom}`); if (!monte) enfant.faire('joie'); }
      else majGuidage(info); }
    bourse.maj(dt, tTotal, monte ? C : J, monte ? 3.8 : 2.7, camera);
    if (monte && C.vit > 0.5) quotidien.evenement('distance', C.vit * dt);
    hakim.animer(dt, 0, tTotal);
    if (lumiere) { lumiere.intensity = 2.2 * Math.max(nuit, 0.05); lumiere.position.set(enfant.racine.position.x, enfant.racine.position.y + 1.6, enfant.racine.position.z); }
    majBoussole();
    const pres = !monte && Math.hypot(J.x - C.x, J.z - C.z) < 4;
    const loin = !monte && !C.venir && !dansEnclos(C.x, C.z) && Math.hypot(J.x - C.x, J.z - C.z) > 18;
    majBoutons(pres, loin);

    // --- sons d'ambiance ---
    tZone += dt;
    if (tZone > 0.4) {
      tZone = 0; verifierZone();
      const dO = Math.hypot(J.x - LIEUX.oasis.x, J.z - LIEUX.oasis.z), dF = Math.hypot(J.x, J.z), dC = Math.hypot(J.x - LIEUX.camp.x, J.z - LIEUX.camp.z);
      S.majSons(0.4, {
        nuit, altitude: Math.max(0, H(J.x, J.z) - 2),
        procheEau: (route && route.procheEau() != null) ? route.procheEau() : Math.max(lisse(55, 20, dO), lisse(16, 3, dF) * 0.5),
        procheFeu: lisse(16, 3, dC),
        procheVert: Math.max(lisse(60, 20, dF), lisse(70, 25, dO)),
        desert: 1 - Math.max(lisse(60, 25, dF), lisse(70, 30, dO))
      });
    }

    // --- sauvegarde régulière ---
    tSauvegarde += dt;
    if (tSauvegarde > 3) {
      tSauvegarde = 0;
      if (route && route.enRoute()) route.sauver();   // sur la Route : position exacte dans etat.route ; la position du village reste celle d'avant
      else {
        etat.joueur = { x: +J.x.toFixed(2), z: +J.z.toFixed(2), a: +J.a.toFixed(3) };
        etat.chameau = { x: +C.x.toFixed(2), z: +C.z.toFixed(2), a: +C.a.toFixed(3) };
      }
      etat.monte = monte && !sequence; etat.heure = +ciel.p.toFixed(4);
      enregistrer(); verifierSucces(); regions.verifier();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(image);
  }

  // La boussole (achetée au marché) montre où aller pour la mission en cours
  function majBoussole() {
    const b = $('boussole');
    if (!AV.equipement.boussole) { b.classList.add('cache'); return; }
    const cible = guide.dest || aventure.prochaineCible(J);
    b.classList.toggle('cache', !cible || interface_ouverte);
    if (!cible) return;
    const rel = angleVers(cam.yaw + Math.PI, Math.atan2(cible.x - J.x, cible.z - J.z));
    $('boussole-aiguille').style.transform = `rotate(${-rel}rad)`;
  }
  let dernierEtatBoutons = '';
  function majBoutons(pres, loin) {
    const avPrio = procheAv && (!proche || procheAv.d < Math.hypot(proche.x - J.x, proche.z - J.z));
    const lire = avPrio ? procheAv.label : proche ? (proche.id === 'nour' || proche.id === 'sage' || proche.id === 'ecurie' ? 'Parler' : proche.id.startsWith('boutique-') ? 'Acheter' : proche.id === 'cour' ? 'Ma cour' : 'Lire') : (pres && !sequence ? (dansEnclos(C.x, C.z) ? 'S\'occuper' : 'Caresser') : null);
    const cham = sequence ? null : monte ? 'Descendre' : pres ? 'Monter' : loin ? 'Appeler' : null;
    const cle = lire + '|' + cham + '|' + interface_ouverte;
    if (cle === dernierEtatBoutons) return;
    dernierEtatBoutons = cle;
    $('btn-action').classList.toggle('cache', !lire || interface_ouverte);
    if (lire) { $('btn-action').querySelector('.txt').textContent = lire; const ic = (avPrio && procheAv.icone) || { Parler: '💬', Caresser: '🤲', 'S\'occuper': '🤲', Examiner: '🔍', Acheter: '🛍️', 'Ma cour': '🏡' }[lire] || '✋';
      if (ic === 'mots') $('btn-action').querySelector('.ico').innerHTML = ICONE_MOTS; else $('btn-action').querySelector('.ico').textContent = ic; }
    $('btn-chameau').classList.toggle('cache', !cham || interface_ouverte);
    if (cham) $('btn-chameau').querySelector('.txt').textContent = cham;
    if (!indiceForce && !ctl.tactile) {
      const morceaux = [];
      if (lire) morceaux.push(`<kbd>${touche('interagir')}</kbd> ${lire}`);
      if (cham) morceaux.push(`<kbd>${touche('chameau')}</kbd> ${cham === 'Appeler' ? 'Appeler ' + nomMonture() : cham === 'Monter' ? 'Monter sur ' + nomMonture() : 'Descendre de ' + nomMonture()}`);
      $('indice').innerHTML = morceaux.join(' &nbsp;·&nbsp; ');
      $('indice').classList.toggle('cache', !morceaux.length || interface_ouverte);
    }
  }

  // ---------- prêt ----------
  // Première image avant d'enlever l'écran de chargement (évite un écran noir)
  appliquerEquipement();
  ecurie.maj(AV.montures, AV.monture);
  if (!monte && presEcurie(C.x, C.z) && !dansEnclos(C.x, C.z)) ranger();
  verifierSucces(!Object.keys(AV.badges).length);
  regions.verifier();   // première fois : les badges déjà mérités sont donnés sans fanfare
  $('btn-chameau').querySelector('.ico').textContent = monture(AV.monture).icone;
  bourse.restaurer(ouDonner());
  quotidien.verifierActivites();
  const duVillage = quotidien.recompensesActivites();
  if (duVillage) setTimeout(() => bandeau('Tes activités du village', `${duVillage} pièces à ramasser !`), 1200);
  addEventListener('visibilitychange', () => { if (!document.hidden) { quotidien.verifierActivites(); quotidien.recompensesActivites(); } });
  if (monte) enfant.pose = 'monte';
  cam.cible.set(J.x, H(J.x, J.z) + 1.4, J.z);
  verifierZone();
  renderer.compile(scene, camera);
  requestAnimationFrame(image);
  await attendre();
  $('chargement').classList.add('cache');
  $('hud').classList.remove('cache');
  $('tactile').classList.remove('cache'); ctl.appliquer();   // les commandes ont maintenant leur taille : on les garde dans l'écran
  setTimeout(() => carte.preparer(), 5000);
  if (etat.guidage && !(route && route.enRoute())) { const g0 = etat.guidage; etat.guidage = null; if (!guiderVers({ ...g0, silencieux: true })) etat.guidage = null; }   // la carte se dessine en douce
  if (!perso()) ouvrirPerso(true);
  else if (!etat.aideVue) montrerAide();
  else { const go = () => { S.demarrerSons(); S.reglerSons(sons()); removeEventListener('pointerdown', go); removeEventListener('keydown', go); }; addEventListener('pointerdown', go); addEventListener('keydown', go); }

  // pour les tests
  window.__voyage = {
    route, ROUTE,
    loumi, soins, faireSoin: (type) => lancerSoin(type, lieuDe(type)), soin: () => soin, pose: () => pose, nuit: () => nuitActuelle, habitants, parlerLoumi, LOUMI_POS, veille, bulleLoumi, ecurie, sOccuper, interactionMontures, interactionSoins, reglerOption: (k, v) => { etat.options[k] = v; enregistrer(); },
    etat, J, C, decor, ciel, H, cam, aventure, bourse, action: () => action(),
    teleporter(x, z) { J.x = x; J.z = z; if (monte) { C.x = x; C.z = z; } },
    monte: () => monte, sequence: () => sequence, proche: () => proche, zone: () => zoneActuelle,
    enfant: () => enfant, perso, quetes, regions, decouvrir: d => decouvrir(d), guide, carte, ouvrirCarte: id => ouvrirCarte(id), guiderVers: d => guiderVers(d), guiderMission: k => guiderMission(k), lieuxCarte: () => lieuxCarte(), choisirMonture: id => choisirMonture(id), ouvrirEcurie: () => ouvrirEcurie(), monture: () => chameau, ecurie, ouvrirBoutique: id => ouvrirBoutique(id), ouvrirCarnet: o => ouvrirCarnet(o), ouvrirPerso: () => ouvrirPerso(false), apercu: a => apercu(article(a)),
    infos: () => renderer.info.render, faucon: () => faucon, dialogue: p => dialogue(p), indice: (h, ms) => montrerIndice(h, ms), bandeau: (a, b) => bandeau(a, b)
  };
}

// ---------- profils graphiques ----------
const dpr = () => window.devicePixelRatio || 1;
const PROFILS = {
  faible: () => ({ nom: 'faible', leger: true, terrain: 140, pixelRatio: 1, antialias: false, ombres: false, densiteDeco: 0.5, etoiles: 250,
    detail: 256, grain: 0, nuages: 9, particules: 0, empreintes: 50, brumeProche: 70, brumeLoin: 330 }),
  equilibre: () => ({ nom: 'equilibre', leger: false, terrain: 200, pixelRatio: Math.min(dpr(), 1.5), antialias: false, ombres: true, ombresTaille: 1024,
    densiteDeco: 0.8, etoiles: 500, detail: 512, grain: 1, nuages: 16, particules: 140, empreintes: 110, brumeProche: 100, brumeLoin: 440 }),
  eleve: () => ({ nom: 'eleve', leger: false, terrain: 260, pixelRatio: Math.min(dpr(), 2), antialias: true, ombres: true, ombresTaille: 2048,
    densiteDeco: 1, etoiles: 800, detail: 512, grain: 1, nuages: 22, particules: 280, empreintes: 160, brumeProche: 120, brumeLoin: 520 })
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
