// Le chef d'orchestre de La Route vers La Mecque (première tranche) : passage du village à la Route, déplacements, lieux, missions, sac,
// ambiance, sauvegarde, carte et carnet. Tout ce qui est nouveau est rangé dans etat.route ; les systèmes du village sont RÉUTILISÉS
// (bourse, habitants, dialogues, découvertes, régions, montures) et jamais dupliqués.
import { creerMondeRoute } from './monde.js';
import { creerLieux3D } from './lieux-3d.js';
import { creerVille3D } from './ville-3d.js';
import { creerInterieur3D } from './interieur-3d.js';
import { creerMontee3D } from './montee-3d.js';
import { creerGuidage3D } from './guidage-3d.js';
import { suivreTraversee } from './traversees-route.js';
import { sandboxActif } from './bac-a-sable.js';
import { loinDeLaPiste, zoneJouable } from './piste-plan.js';
import { creerVerificationUI } from './verification-ui.js';
import { creerVoyageurs3D } from './voyageurs-3d.js';
import { maisonsVille, portesJouables, villeVisible } from './ville-plan.js';
import { ACTIVITES_METIERS, questionsMetier } from './activites-route.js';
import { TROCS, CADEAU, stockVide, echanger, peutEchanger, bloque, panierTexte, cueillir } from './troc-route.js';
import { LIEUX_SACRES } from './lieux-mecque-a-valider.js';
import { VALIDATION } from './validation-contenu.js';
import { preparerRoute, memoriserPosition, positionDeReprise } from './etat-route.js';
import { faireEtape, progression } from './missions-route.js';
import { DEC, versRoute, S_DEBUT, S_FIN_TRANCHE, LARGEUR, OASIS, CITE, pointChemin } from './relief.js';
import { FACTEUR_MARCHE_ROUTE, HABITANTS_MAISONS, regionA, LIEUX_ROUTE, MISSIONS_ROUTE, SAC_ROUTE, RELAIS_VILLAGE, auSeuilVillage, versLaRoute, auRetourRoute, versLeVillage } from './donnees.js';
import { texteLieu, GUIDE, VOYAGEUSE, MESSAGES, FAITS_MAISONS, FAITS_ATELIER, FAITS_INTERIEURS, HALTES_MONTAGNE, SUJETS_VOYAGEURS } from './textes-route.js';
import { CONTENU, etiquette, texteDe } from './contenu-a-valider.js';
import { pageCarnetRoute } from './carnet-route.js';
import { creerRecitUI } from './recit-ui.js';
import { recit } from './recits-a-valider.js';
import { creerCarteRoute } from './carte-route.js';
import { creerHalte3D } from './halte-3d.js';
import { GESTES_NOUR, etatHalte, dansHalte, centre as centreHalte } from './halte-plan.js';
import { TEXTES_HALTE, BOUTONS_HALTE } from './textes-halte.js';
import { devant as devantPortail, arrivee as arriveePortail, retourVillage, sabloRetour, retourMonte, TEXTES_PORTAIL, ANCIENNE_MARCHE_ACTIVE } from './portail-plan.js';

const SEUIL_Z = 10000;                                  // au-delà : on est dans le monde de la Route (le village ne dépasse jamais z = 400)
const NOMS_ANIMAUX = { lezard: ['Lézard à queue épineuse', '🦎'], gerboise: ['Gerboise', '🐭'], renard: ['Renard des sables', '🦊'] };
const lisse = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function creerRoute(ctx) {
  const { scene, terrain, etat, AV, enregistrer, habitants, donner, J, C, village } = ctx;
  // dans la Route, jamais de voix ni de synthèse vocale pour un texte non validé : les dialogues et découvertes sont silencieux
  const ui = { ...ctx.ui, dialogue: p => ctx.ui.dialogue({ sansVoix: true, auto: true, sousMuet: true, ...p }), decouvrir: d => ctx.ui.decouvrir({ sansVoix: true, auto: true, ...d }) };
  if (ctx.voixRoute) ctx.voixRoute();   // les voix Nour enregistrées de la Route (phrases + fichiers) : seulement des textes non religieux et validés pour l'écoute
  const R = preparerRoute(etat);
  const age = () => ctx.age() === 'petits' ? '3-5' : '6-10';
  const monde = creerMondeRoute({ scene, Q: ctx.Q, TX: ctx.TX, ombres: ctx.ombres });
  const fixes = [];                                      // les obstacles des lieux (tentes, rochers…) : ne changent jamais
  const L = creerLieux3D({ scene, hauteur: monde.hauteur, colliders: fixes, ombres: ctx.ombres, TX: ctx.TX });
  const V = creerVille3D({ scene, hauteur: monde.hauteur, ombres: ctx.ombres });          // la cité ancienne
  const H3 = creerHalte3D({ scene, hauteur: monde.hauteur, colliders: fixes, ombres: ctx.ombres });          // la halte de repos des caravaniers, au milieu de la Route
  const W = creerVoyageurs3D({ scene, hauteur: monde.hauteur, leger: !!ctx.Q.leger });   // ses voyageurs fictifs animés
  const I = creerInterieur3D({ scene, hauteur: monde.hauteur, ombres: ctx.ombres });   // la pièce d'une maison : invisible tant qu'on n'y entre pas
  const G3 = creerGuidage3D({ scene, hauteur: monde.hauteur });                                // les lumières dorées du guidage (destination choisie sur la carte)
  const M3 = creerMontee3D({ scene, hauteur: monde.hauteur, ombres: ctx.ombres });          // les sentiers de montée des deux grandes montagnes
  let tHors = 0, cooldownHors = 0;                                                        // « reviens vers la piste » : au plus une fois toutes les 40 s
  let villeAffichee = false;                                                              // la cité est-elle dessinée ? (seulement quand elle peut être vue)
  let dansMaison = null;                                                                  // { gabarit, retour : devant la porte }
  const Couleur = scene.fog.color.constructor, cible = new Couleur();
  const fog0 = { near: scene.fog.near, far: scene.fog.far };
  let dans = false, brumeVillage = false, regionActuelle = null;
  const gagner = (id, n, raison) => donner('route:' + id, n, raison);
  const regionOuverte = () => ctx.regions.ouverte('route');

  // le sol de la Route répond au même terrain.hauteur / terrain.matiere que le village : tous les systèmes (pas, ombres, monture…) fonctionnent sans changement
  const h0 = terrain.hauteur.bind(terrain), m0 = terrain.matiere.bind(terrain);
  // au village, la pierre du portail (marches, socle) s'ajoute au sol : on marche SUR les marches, à leur vraie hauteur
  terrain.hauteur = (x, z) => { if (z > SEUIL_Z) return monde.hauteur(x, z); const sol = h0(x, z), pierre = village.portail.hauteurPierre(x, z); return pierre > sol ? pierre : sol; };
  terrain.matiere = (x, z) => z > SEUIL_Z ? monde.matiere(x, z) : m0(x, z);
  const montrer = v => { monde.montrer(v); L.groupe.visible = v; V.montrer(v && villeVisible(J.x, J.z)); villeAffichee = v && villeVisible(J.x, J.z); M3.groupe.visible = v; G3.groupe.visible = v; H3.montrer(v); terrain.mesh.visible = !v; if (!v) for (const n of W.liste) n.e.racine.visible = false; };
  montrer(false);

  // ---------- les lieux déjà faits (reprise d'une sauvegarde) ----------
  for (const [id, m] of Object.entries(R.missions)) for (const lieu of (m.faits || [])) { L.retirerGemme(lieu); if (R.objets.includes(lieu)) L.retirerObjet(lieu); }
  for (const id of R.objets) L.retirerObjet(id);

  // ---------- missions ----------
  function etape(missionId, lieuId) {
    const M = MISSIONS_ROUTE[missionId], neuve = !R.missions[missionId];
    const r = faireEtape(R, missionId, lieuId);
    enregistrer();
    if (!r.nouveau) return r;
    L.retirerGemme(lieuId);
    if (neuve) { ui.bandeau(MESSAGES.nouvelleMission, M.icone + ' ' + M.titre, true); ui.dire([{ t: MESSAGES.nouvelleMission }, { t: M.titre }, { t: age() === '3-5' ? M.simple : M.resume, opt: true }]); }
    const p = progression(R, missionId);
    setTimeout(() => ui.indice(`${M.icone} ${M.titre} : ${p.n} sur ${p.total}`, 3500), neuve ? 1800 : 300);
    if (r.termine && missionId !== 'campement') { gagner('mission:' + missionId, M.recompense, 'Mission réussie : ' + M.titre); setTimeout(() => ui.bandeau('Mission réussie !', M.icone + ' ' + M.titre), 900); }
    if (r.termine && missionId === 'campement') { R.vu.campementPret = true; enregistrer(); setTimeout(() => ui.indice('🎒 ' + MESSAGES.affairesRetrouvees, 5000), 900); }
    return r;
  }
  const lieu = id => LIEUX_ROUTE.find(l => l.id === id);
  // nom, icône et texte d'un lieu : neutres, ou « À VALIDER » quand le lieu est lié à un récit religieux ou historique
  const infoLieu = id => { const l = lieu(id), sa = LIEUX_SACRES[id]; return { nom: sa ? sa.nom : l.nom, icone: sa ? sa.icone : l.icone, texte: sa ? (age() === '3-5' ? sa.petit : sa.grand) : texteLieu(id, age()), valider: !!sa && !VALIDATION.valide }; };
  const recitsDe = l => [...(l.recit ? [l.recit] : []), ...((LIEUX_SACRES[l.id] && LIEUX_SACRES[l.id].recits) || [])];
  const dialogueLieu = (id, plus = {}) => { const i = infoLieu(id); ui.dialogue({ titre: `${i.icone} ${i.nom}`, texte: i.texte, icone: i.icone, sous: i.valider ? '⚠️ À VALIDER par une personne compétente' : undefined, ...plus }); };
  function decouvrirLieu(id, type = 'nature') {
    const l = lieu(id), p = L.lieux[id] || L.pos(id);
    if (R.decouvertes.includes(id)) { dialogueLieu(id); return false; }
    R.decouvertes.push(id); enregistrer();
    const i = infoLieu(id);
    ui.decouvrir({ type, cle: 'route-' + id, nom: i.nom, icone: i.icone, texte: i.texte + (i.valider ? ' (⚠️ À VALIDER)' : ''), nouveau: true, x: p.x, z: p.z });
    setTimeout(() => gagner('lieu:' + id, 20, 'Nouveau lieu : ' + i.nom), 900);
    return true;
  }

  // ---------- les interactions (registre commun des habitants : rien ne s'ouvre tout seul) ----------
  const ajouter = (id, h) => habitants.ajouter({ id: 'route:' + id, rayon: 3.4, ...h });
  for (const l of LIEUX_ROUTE) {
    const p = L.lieux[l.id]; if (!p) continue;
    const base = { x: p.x, z: p.z };
    if (l.type === 'seuil') ajouter(l.id, { ...base, rayon: 6, label: 'Lire', icone: '🚏', ouvrir: () => decouvrirLieu(l.id, 'lieu') });
    else if (l.type === 'balise') ajouter(l.id, { ...base, label: 'Examiner', icone: '🔍', ouvrir: () => {
      const fait = R.missions.chemin && R.missions.chemin.faits.includes(l.id), r = fait ? null : etape('chemin', l.id);
      dialogueLieu(l.id, r && r.termine ? { sous: MESSAGES.chemin3 } : {});
    } });
    else if (l.type === 'trace') ajouter(l.id, { ...base, label: 'Observer', icone: '🔍', ouvrir: () => {
      const [nom, ic] = NOMS_ANIMAUX[l.animal], fait = R.missions.traces && R.missions.traces.faits.includes(l.id);
      if (!fait) etape('traces', l.id);
      ui.decouvrir({ type: 'animal', cle: 'route-' + l.animal, nom, icone: ic, texte: texteLieu(l.id, age()), nouveau: !fait, x: base.x, z: base.z });
    } });
    else if (l.type === 'repos') ajouter(l.id, { ...base, rayon: 4, label: 'Se reposer', icone: '😌', ouvrir: () => {
      const neuf = !R.repos.includes(l.id);
      if (neuf) { R.repos.push(l.id); setTimeout(() => gagner('repos:' + l.id, 20, 'Une halte : ' + l.nom), 600); }
      memoriserPosition(etat, J); enregistrer();
      ui.dialogue({ titre: `${l.icone} ${l.nom}`, texte: texteLieu(l.id, age()) + (R.sac.lanterne ? ' ' + MESSAGES.lanterneSac : ''), icone: l.icone, boutons: [{ txt: 'Continuer le voyage', fn: () => {} }] });
    } });
    else if (l.type === 'decouverte') ajouter(l.id, { ...base, rayon: l.id === 'rocher-aigle' ? 5 : 4, label: 'Regarder', icone: '👀', ouvrir: () => { decouvrirLieu(l.id); if (l.mission) etape(l.mission, l.id); } });
    else if (l.type === 'objet') ajouter(l.id, { ...base, rayon: 2.6, label: 'Ramasser', icone: '🤲', actif: () => !R.objets.includes(l.id), ouvrir: () => {
      R.objets.push(l.id); L.retirerObjet(l.id); const r = etape('campement', l.id);
      ui.indice(`🎒 Tu as retrouvé ${l.nom} !`, r.termine ? 1500 : 3000);
    } });
    else if (l.type === 'personnage') ajouter(l.id, { ...base, rayon: 3.4, label: 'Parler', icone: '💬', ouvrir: parlerVoyageuse });
    else if (l.type === 'oasis') ajouter(l.id, { ...base, rayon: 6, label: 'Remplir', icone: '💧', ouvrir: () => {
      const plein = !!R.sac.gourde; if (plein) { R.vu.gourdePleine = true; enregistrer(); }
      decouvrirLieu('oasis', 'lieu'); if (R.decouvertes.includes('oasis')) ui.indice(plein ? MESSAGES.gourdePleine : MESSAGES.gourdeAbsente, 4000);
    } });
    else if (l.type === 'cairn') ajouter(l.id, { ...base, rayon: 4, label: 'Lire', icone: '📜', ouvrir: () => dialogueLieu(l.id) });
  }

  // ---------- la halte de repos : Nour peut boire, manger et se reposer ; rien n'est obligatoire, rien n'est puni ----------
  const HH = etatHalte(R), txtH = k => TEXTES_HALTE[k][age() === '3-5' ? 'petit' : 'grand'];
  const geste = (type, d) => { if (ctx.geste) ctx.geste(type, d); };
  function gestePasse(g) {
    if (g.id === 'halte-eau') { geste('boire', 2.2); HH.boire++; const gourde = !!R.sac.gourde; if (gourde) R.vu.gourdePleine = true; enregistrer();
      setTimeout(() => ui.dialogue({ titre: '💧 ' + BOUTONS_HALTE.eau, texte: txtH('eau') + (gourde ? ' ' + txtH('gourde') : ''), icone: '💧' }), 1500); }
    else if (g.id === 'halte-vivres') { geste('prendre', 1); HH.manger++; enregistrer();
      setTimeout(() => ui.dialogue({ titre: '🥜 ' + BOUTONS_HALTE.vivres, texte: txtH('vivres'), icone: '🥜' }), 900); }
    else {
      geste('assis', 8); const premier = HH.repos === 0; HH.repos++; memoriserPosition(etat, J); enregistrer();
      if (premier) setTimeout(() => gagner('halte:repos', 20, 'Une halte : se reposer'), 800);
      setTimeout(() => ui.dialogue({ titre: '😌 ' + BOUTONS_HALTE.repos, texte: txtH('repos'), icone: '😌',
        boutons: [{ txt: BOUTONS_HALTE.reprendre, fn: () => { geste(null); ui.indice('🐪 ' + txtH('repriseRoute'), 3000); } }, { txt: BOUTONS_HALTE.rester, fn: () => {} }] }), 1100);
    }
  }
  for (const g of GESTES_NOUR) ajouter(g.id, { x: g.x, z: g.z, rayon: g.rayon, label: g.label, icone: g.icone, ouvrir: () => gestePasse(g) });

  // la voyageuse du campement (personnage fictif)
  function parlerVoyageuse() {
    const a = age() === '3-5' ? 'petit' : 'grand', M = R.missions.campement, V = VOYAGEUSE, fini = M && M.etat === 'finie';
    const partages = [];
    if (fini) {
      if (R.sac.gourde && !R.vu.partEau) partages.push({ txt: '💧 Partager ma gourde', fn: () => { R.vu.partEau = true; enregistrer(); gagner('partage:eau', 25, 'Tu as partagé ton eau'); ui.indice(V.eau, 4000); } });
      if (R.sac.provisions && !R.vu.partVivres) partages.push({ txt: '🥜 Partager mes provisions', fn: () => { R.vu.partVivres = true; enregistrer(); gagner('partage:vivres', 25, 'Tu as partagé tes provisions'); ui.indice(V.provisions, 4000); } });
    }
    if (fini && !R.vu.campementRendu) {
      R.vu.campementRendu = true; enregistrer();
      gagner('mission:campement', MISSIONS_ROUTE.campement.recompense, 'Mission réussie : ' + MISSIONS_ROUTE.campement.titre);
      ui.dialogue({ titre: V.titre, texte: V.merci[a], boutons: [...partages, { txt: 'Avec plaisir !', fn: () => ui.bandeau('Mission réussie !', MISSIONS_ROUTE.campement.icone + ' ' + MISSIONS_ROUTE.campement.titre) }] });
    } else if (fini) ui.dialogue({ titre: V.titre, texte: V.merci[a], boutons: [...partages, { txt: 'Au revoir !', fn: () => {} }] });
    else ui.dialogue({ titre: V.titre, texte: R.objets.length >= 3 ? V.tout[a] : (M ? V.attente[a] : V.debut[a]), boutons: [{ txt: M ? 'Je continue de chercher' : 'Oui, je t\'aide !', fn: () => { if (!M) { R.missions.campement = { etat: 'en_cours', n: 0, faits: [] }; enregistrer(); ui.bandeau('Nouvelle mission', MISSIONS_ROUTE.campement.icone + ' ' + MISSIONS_ROUTE.campement.titre); } } }] });
  }

  // ---------- les récits : une lanterne dans le lieu, un bouton « Découvrir cette histoire », un panneau, le carnet ----------
  const recitUI = creerRecitUI({ route: R, age, dire: seg => ui.dire(seg),
    surCarnet: id => { gagner('recit:' + id, 30, 'Une histoire découverte : ' + recit(id).titre); ui.bandeau(MESSAGES.histoireAjoutee, '📜 ' + recit(id).titre); },
    surFermer: () => { ui.carteFermee && ui.carteFermee(); enregistrer(); }, surChange: () => enregistrer() });
  const ouvrirHistoire = id => { ui.carteOuverte && ui.carteOuverte(); recitUI.ouvrir(id); };
  const annonce = new Set();
  for (const l of LIEUX_ROUTE.filter(o => recitsDe(o).length)) {
    const lan = L.lanternes[l.id]; if (!lan) continue;
    ajouter('recit:' + l.id, { x: lan.x, z: lan.z, rayon: 5, label: 'Découvrir cette histoire', icone: '📜', ouvrir: () => { const rs = recitsDe(l);
      if (rs.length === 1) ouvrirHistoire(rs[0]);
      else ui.dialogue({ titre: '📜 ' + infoLieu(l.id).nom, texte: 'Plusieurs histoires se découvrent ici. Laquelle veux-tu lire ?', petitsBoutons: true, boutons: [...rs.map(id => ({ txt: recit(id).titre, fn: () => setTimeout(() => ouvrirHistoire(id), 60) })), { txt: 'Plus tard', fn: () => {} }] }); } });
  }
  const lanternesProches = () => { for (const l of LIEUX_ROUTE.filter(o => recitsDe(o).length)) { const lan = L.lanternes[l.id]; if (!lan) continue; const d = Math.hypot(J.x - lan.x, J.z - lan.z); lan.allumer(d < 70);
    if (d < 20 && !annonce.has(l.id) && !recitUI.ouverte()) { annonce.add(l.id); ui.indice('📜 ' + MESSAGES.lanterne, 4500); } } };

  // ---------- la cité vivante : des voyageurs à qui parler (mission « rencontres »), des maisons à observer ----------
  // la cueillette de dattes à la palmeraie : deux dattes dans le panier du troc, trois fois, puis on laisse le reste aux oiseaux
  { const pp = L.pos('palmeraie');
    habitants.ajouter({ id: 'route:cueillette', x: pp.x + 3, z: pp.z + 3, rayon: 2.6, label: 'Cueillir des dattes', icone: '🌴', ouvrir: () => {
      const S = R.vu.troc || (R.vu.troc = { stock: stockVide(), depart: false }), ok = cueillir(S); enregistrer(); ui.indice('🌴 ' + (ok ? MESSAGES.cueillette : MESSAGES.cueilletteFin), 4500); } }); }
  // le parcours entre les deux collines : des traversées d'un bout à l'autre, comptées tranquillement (aucun chronomètre, aucun classement)
  const bouts = { a: L.pos('cite-colline-a'), b: L.pos('cite-colline-b') };
  function parcoursCollines() {
    const S = R.vu.trav || (R.vu.trav = { dernier: null, n: 0 });
    const bout = Math.hypot(J.x - bouts.a.x, J.z - bouts.a.z) < 8 ? 'a' : Math.hypot(J.x - bouts.b.x, J.z - bouts.b.z) < 8 ? 'b' : null;
    if (!suivreTraversee(S, bout)) return;
    enregistrer(); ui.indice('🚶 ' + (S.n === 3 ? MESSAGES.traversees3 : MESSAGES.traversee), 4500);
    if (S.n >= 3 && !R.vu.travRecompense) { R.vu.travRecompense = true; enregistrer(); gagner('traversees', 60, 'Trois traversées tranquilles entre les deux collines'); }
  }
  // les haltes du sentier de montée : de la nature à observer, puis la vue du belvédère (mission « Monter doucement », sans course ni chronomètre)
  for (const id of Object.keys(HALTES_MONTAGNE)) HALTES_MONTAGNE[id].forEach((h, k) => { const p = M3.haltes[id + ':' + k];
    habitants.ajouter({ id: 'route:montee:' + id + ':' + k, x: p.x + 1.5, z: p.z, rayon: 3.6, label: h.label, icone: h.icone, ouvrir: () => {
      ui.dialogue({ titre: h.icone + ' ' + h.nom, texte: age() === '3-5' ? h.petit : h.grand, icone: h.icone, boutons: [{ txt: 'Merci !', fn: () => {} }] }); etape('montees', id + ':' + k); } }); });
  // dans l'atelier du potier : on entre, on observe le tour et le four (une petite découverte la première fois)
  if (L.atelier) for (const o of L.atelier.objets) { const f = FAITS_ATELIER[o.id];
    habitants.ajouter({ id: 'route:atelier:' + o.id, x: o.poseX, z: o.poseZ, rayon: 1.9, label: f.label, icone: f.icone, ouvrir: () => {
      ui.dialogue({ titre: f.icone + ' ' + f.nom, texte: age() === '3-5' ? f.petit : f.grand, icone: f.icone, boutons: [{ txt: 'Merci !', fn: () => {} }] });
      if (!R.decouvertes.includes('atelier:' + o.id)) { R.decouvertes.push('atelier:' + o.id); enregistrer(); gagner('atelier:' + o.id, 10, 'Tu as observé : ' + f.nom); } } }); }
  // les métiers : le potier et le marchand t'apprennent leur métier en trois questions douces (ni chronomètre ni pénalité : on réessaie après l'explication)
  function lancerMetier(id) {
    const a = ACTIVITES_METIERS[id], g = age() === '3-5', qs = questionsMetier(id, age()), titre = a.icone + ' ' + a.titre;
    const poser = k => {
      if (k >= qs.length) { const neuf = !R.vu['metier_' + id]; R.vu['metier_' + id] = true; enregistrer(); if (neuf) setTimeout(() => gagner('metier:' + id, a.recompense, 'Tu as appris : ' + a.titre), 900);
        ui.dialogue({ titre, texte: g ? a.fin.petit : a.fin.grand, icone: a.icone, boutons: [{ txt: 'Merci !', fn: () => {} }] }); return; }
      const q = qs[k], n = q.choix.length, ordre = q.choix.map((_, i) => (i + k + 1) % n);   // la bonne réponse n'est pas toujours au même endroit
      ui.dialogue({ titre, texte: q.question, icone: a.icone, petitsBoutons: true, boutons: ordre.map(i => ({ txt: q.choix[i], fn: () => setTimeout(() => (i === q.bonne ? ok : ko)(k), 60) })) });
    };
    const ok = k => ui.dialogue({ titre, texte: qs[k].ok, icone: a.icone, boutons: [{ txt: k + 1 < qs.length ? 'Question suivante ▶' : 'Terminer', fn: () => setTimeout(() => poser(k + 1), 60) }] });
    const ko = k => ui.dialogue({ titre, texte: qs[k].ko, icone: a.icone, boutons: [{ txt: 'Réessayer', fn: () => setTimeout(() => poser(k), 60) }] });
    ui.dialogue({ titre, texte: g ? a.intro.petit : a.intro.grand, icone: a.icone, boutons: [{ txt: 'Je suis prêt !', fn: () => setTimeout(() => poser(0), 60) }, { txt: 'Plus tard', fn: () => {} }] });
  }
  // le troc du marché : on échange des marchandises (jamais de pièces) ; le panier est rangé dans etat.route.vu ; on n'est jamais bloqué (le marchand de dattes redonne de quoi commencer)
  function lancerTroc(v) {
    const id = v.id, T = TROCS[id], g = age() === '3-5' ? 'petit' : 'grand', S = R.vu.troc || (R.vu.troc = { stock: stockVide(), depart: false }), titre = '🤝 ' + v.role;
    const dire = (texte, boutons) => ui.dialogue({ titre, texte, sous: panierTexte(S.stock), icone: '🤝', boutons });
    const faire = () => { const r = echanger(S.stock, id); if (!r.ok) return; S.stock = r.stock; enregistrer(); dire(T.ok[g], [{ txt: 'Merci !', fn: () => {} }]); etape('troc', 'echange:' + id); };
    if (id === 'marchand-dattes' && bloque(S.stock)) { S.stock[CADEAU.item] = (S.stock[CADEAU.item] || 0) + CADEAU.n; S.depart = true; enregistrer(); dire(T.cadeau[g], [{ txt: 'Merci !', fn: () => {} }]); return; }
    if (!peutEchanger(S.stock, id)) { dire(T.manque[g], [{ txt: 'Je vais voir', fn: () => {} }]); return; }
    dire(T.offre[g], [{ txt: '✅ Échanger', fn: () => setTimeout(faire, 60) }, { txt: 'Non merci', fn: () => {} }]);
  }
  // les questions posées aux habitants : chaque réponse est dite avec la voix de l'habitant ; les réponses entendues sont gardées (une petite récompense à huit questions)
  function repondreSujet(n, i) {
    const s = SUJETS_VOYAGEURS[n.v.id][i], S = R.vu.sujets || (R.vu.sujets = {});
    ui.dialogue({ titre: '💬 ' + n.v.role, texte: age() === '3-5' ? s.petit : s.grand, boutons: [{ txt: 'Une autre question', fn: () => setTimeout(() => parlerVoyageur(n), 60) }, { txt: 'Merci !', fn: () => {} }] });
    if (!S[n.v.id + ':' + i]) { S[n.v.id + ':' + i] = true; enregistrer(); }
    if (Object.keys(S).length >= 8 && !R.vu.sujetsRecompense) { R.vu.sujetsRecompense = true; enregistrer(); gagner('sujets', 80, 'Tu as bien discuté avec les habitants'); }
  }
  const parlerVoyageur = n => { W.saluer(n.v.id); ui.dialogue({ titre: '💬 ' + n.v.role, texte: age() === '3-5' ? n.v.texte.petit : n.v.texte.grand, petitsBoutons: true, boutons: [...(SUJETS_VOYAGEURS[n.v.id] || []).map((s, i) => ({ txt: '💬 ' + s.q.replace(' ?', '\u00a0?'), fn: () => setTimeout(() => repondreSujet(n, i), 60) })), ...(TROCS[n.v.id] ? [{ txt: '🤝 Échanger', fn: () => setTimeout(() => lancerTroc(n.v), 60) }] : []), ...(ACTIVITES_METIERS[n.v.id] ? [{ txt: ACTIVITES_METIERS[n.v.id].icone + ' Apprendre son métier', fn: () => setTimeout(() => lancerMetier(n.v.id), 60) }] : []), { txt: 'Merci, bonne route !', fn: () => {} }] }); if (n.v.mission) etape(n.v.mission, n.v.id); };
  const regV = n => habitants.ajouter({ id: 'route:v:' + n.v.id, x: n.x, z: n.z, rayon: 3.4, label: 'Parler', icone: '💬', ouvrir: () => parlerVoyageur(n) });
  for (const n of W.liste) regV(n);
  const faitMaison = g => {
    const f = FAITS_MAISONS[g]; ui.dialogue({ titre: '🏠 Une maison de la cité', texte: age() === '3-5' ? f.petit : f.grand, sous: '(Illustration du jeu : la cité est une interprétation, pas une reconstitution exacte.)', boutons: [{ txt: 'Merci !', fn: () => {} }] });
    if (!R.decouvertes.includes('maison:' + g)) { R.decouvertes.push('maison:' + g); enregistrer(); gagner('maison:' + g, 10, 'Tu as observé une maison de la cité'); } };
  // dans les maisons : la pièce est posée sur le plateau plat, loin de la cité ; on y entre et on en sort par la porte (la sauvegarde ramène devant la porte)
  function entrerMaison(g, retour) {
    dansMaison = { gabarit: g, retour }; I.construire(g); I.montrer(true);
    J.x = I.plan.entree.x; J.z = I.plan.entree.z; if (ctx.monte()) { C.x = J.x + 1.2; C.z = J.z; }
    monde.preparer(J); ui.indice('🏠 ' + FAITS_INTERIEURS[g].titre, 3500); etape('interieurs', 'maison:' + g);
  }
  function sortirMaison() {
    if (!dansMaison) return;
    const r = dansMaison.retour; dansMaison = null; I.montrer(false); J.x = r.x; J.z = r.z; if (ctx.monte()) { C.x = J.x; C.z = J.z; } monde.preparer(J);
  }
  for (const g of Object.keys(FAITS_INTERIEURS).map(Number)) FAITS_INTERIEURS[g].objets.forEach((o, i) => { const ob = I.plan.objets[i];
    habitants.ajouter({ id: 'route:interieur:' + g + ':' + i, x: ob.poseX, z: ob.poseZ, rayon: 1.5, label: o.label, icone: o.icone, actif: () => !!dansMaison && dansMaison.gabarit === g, ouvrir: () => {
      ui.dialogue({ titre: o.icone + ' ' + o.nom, texte: age() === '3-5' ? o.petit : o.grand, icone: o.icone, boutons: [{ txt: 'Merci !', fn: () => {} }] });
      const cle = 'interieur:' + g + ':' + i; if (!R.decouvertes.includes(cle)) { R.decouvertes.push(cle); enregistrer(); gagner(cle, 10, 'Tu as observé : ' + o.nom); } } }); });
  habitants.ajouter({ id: 'route:interieur:sortie', x: I.plan.sortie.x, z: I.plan.sortie.z, rayon: 1.3, label: 'Sortir', icone: '🚪', actif: () => !!dansMaison, ouvrir: sortirMaison });
  // les maisons qui ont une porte : on frappe à la VRAIE porte (devant elle), un habitant fictif répond avec sa voix ; mission « portes »
  const portes = new Map(portesJouables().map(p => [p.gabarit, p]));
  for (const p of portes.values()) { const h = HABITANTS_MAISONS[p.gabarit];
    habitants.ajouter({ id: 'route:porte:' + p.gabarit, x: p.x, z: p.z, rayon: 2.8, label: 'Frapper à la porte', icone: '🚪', ouvrir: () => {
      ui.dialogue({ titre: '🚪 ' + h.role, texte: age() === '3-5' ? h.petit : h.grand, icone: '🚪', boutons: [{ txt: '🚪 Entrer', fn: () => setTimeout(() => entrerMaison(p.gabarit, { x: p.x, z: p.z, a: J.a }), 60) }, { txt: '🏠 Et ta maison ?', fn: () => setTimeout(() => faitMaison(p.gabarit), 60) }, { txt: 'Merci, au revoir !', fn: () => {} }] });
      etape('portes', 'porte:' + p.gabarit); } }); }
  // les autres formes (l'échoppe, l'enclos) : un fait à observer, sans porte
  { const vus = new Set(), tri = [...maisonsVille()].sort((a, b) => Math.abs(a.t - pointChemin(a.s).t) - Math.abs(b.t - pointChemin(b.s).t));
    for (const m of tri) { if (vus.has(m.gabarit) || portes.has(m.gabarit)) continue; vus.add(m.gabarit);
      const sens = Math.sign(pointChemin(m.s).t - m.t) || 1, x = m.t + sens * (Math.min(m.l, m.w) * 0.5 + 1.6), z = DEC + m.s;
      habitants.ajouter({ id: 'route:maison:' + m.gabarit, x, z, rayon: 3.2, label: 'Observer la maison', icone: '🏠', ouvrir: () => faitMaison(m.gabarit) }); } }
  let tVoy = 0;

  // ---------- au village : le guide, le panneau, le sac ----------
  const pg = village.positionGuide, pp = village.panneau;
  function conditionsTexte() {
    const k = ctx.regions.conditions('route');
    return `Pour ouvrir la grande route : ${k.requis.ok ? '✓ ' : ''}${k.requis.txt}, puis au choix : ${k.auChoix.map(x => (x.ok ? '✓ ' : '') + x.txt).join(' ; ou ')}.`;
  }
  function ouvrirSac() {
    ui.dialogue({ titre: '🎒 Préparer mon sac', texte: MESSAGES.sacTexte, petitsBoutons: true,
      sous: SAC_ROUTE.map(o => `${o.icone} ${o.utilite}`).join('   '),
      boutons: [...SAC_ROUTE.map(o => ({ txt: `${R.sac[o.id] ? '✅' : '⬜'} ${o.icone} ${o.nom}`, fn: () => { R.sac[o.id] = !R.sac[o.id]; enregistrer(); setTimeout(ouvrirSac, 40); } })),
        { txt: 'J\'ai fini mon sac', fn: () => { R.vu.sacFait = true; enregistrer(); } }] });
  }
  function parlerGuide() {
    const a = age() === '3-5' ? 'petit' : 'grand';
    if (!regionOuverte()) { ui.dialogue({ titre: GUIDE.titre, texte: GUIDE.fermeTexte, sous: conditionsTexte(), boutons: [{ txt: 'D\'accord !', fn: () => {} }] }); return; }
    const fiche = CONTENU['intro-grande-route'];
    if (!R.connaissances.includes('intro-grande-route')) { R.connaissances.push('intro-grande-route'); }
    R.vu.intro = true; enregistrer();
    ui.dialogue({ titre: GUIDE.titre, texte: GUIDE.intro[a], sous: `${texteDe(fiche, a === 'petit' ? '3-5' : '6-10')}  ${etiquette(fiche)}`,
      boutons: [{ txt: '🎒 Préparer mon sac', fn: () => setTimeout(ouvrirSac, 40) }, { txt: '🗺️ Voir la carte ancienne', fn: () => setTimeout(ouvrirCarte, 40) }, { txt: 'Plus tard', fn: () => {} }] });
  }
  habitants.ajouter({ id: 'route:guide', x: pg.x, z: pg.z, rayon: 3.6, label: 'Parler', icone: '💬', ouvrir: parlerGuide });
  habitants.ajouter({ id: 'route:panneau', x: pp.x, z: pp.z, rayon: 3, label: 'Lire', icone: '🚏', ouvrir: () => ui.dialogue({ titre: '🚏 ' + MESSAGES.mecque,
    texte: regionOuverte() ? TEXTES_PORTAIL.panneau :'Une très longue piste part d\'ici. ' + conditionsTexte() }) });
  habitants.ajouter({ id: 'route:table', x: RELAIS_VILLAGE.x - 0.2, z: RELAIS_VILLAGE.z - 2.3, rayon: 3, label: 'Mon sac', icone: '🎒', ouvrir: ouvrirSac });
  // le portail de pierre : on se place devant, on le franchit, on arrive au départ de la route (la Route doit être ouverte, comme avant)
  let traversee = false;
  function franchirPortail() {
    if (dans || traversee) return;
    if (!regionOuverte()) { ui.dialogue({ titre: GUIDE.titre, texte: GUIDE.fermeTexte, sous: conditionsTexte(), boutons: [{ txt: 'D\'accord !', fn: () => {} }] }); return; }
    traversee = true;
    const aller = () => { try { entrer(arriveePortail()); } finally { traversee = false; } };
    if (ui.passage) ui.passage(aller); else aller();
  }
  { const d = devantPortail(); habitants.ajouter({ id: 'route:portail', x: d.x, z: d.z, rayon: 3.6, label: TEXTES_PORTAIL.bouton, icone: '🚪', actif: () => !dans && !traversee, ouvrir: franchirPortail }); }

  // ---------- la carte de la Route ----------
  const carte = creerCarteRoute({
    route: R, age, joueur: () => { const { s, t } = versRoute(J.x, J.z); return { s, t, a: J.a, dans }; },
    surFermer: () => ui.carteFermee && ui.carteFermee(), surOuvrir: () => ui.carteOuverte && ui.carteOuverte()
  });
  function ouvrirCarte() { if (!R.sac.carte && dans) R.sac.carte = true; carte.ouvrir(); }

  // ---------- passage d'un monde à l'autre : la brume cache la couture, on garde la même direction ----------
  function entrer(arrivee) {
    const p = arrivee || versLaRoute({ x: J.x, z: J.z, a: J.a });
    if (!arrivee) ui.fondu(); dans = true; J.x = p.x; J.z = p.z;
    if (arrivee) { J.a = p.a; J.vx = J.vz = 0; J.vit = 0; C.a = p.a; }       // par le portail : sur l'axe de la piste, face à l'avant de la route
    if (ctx.monte()) { C.x = J.x; C.z = J.z; } else { C.x = J.x + 3; C.z = J.z - 2.5; C.vit = 0; C.venir = false; }
    monde.preparer(J); montrer(true); brumeVillage = false;
    R.monde = 'route'; memoriserPosition(etat, J); enregistrer();
    ctx.arreterGuide(); ctx.surSaut();
    if (!R.decouvertes.includes('seuil')) { R.decouvertes.push('seuil'); enregistrer(); ui.bandeau(MESSAGES.decouvres, '🚏 ' + MESSAGES.grandeRoute); setTimeout(() => gagner('lieu:seuil', 50, 'Tu quittes le village : la grande route'), 900); }
  }
  function sortir() {
    // on ressort SUR la marche haute du portail, face à lui : la caméra, derrière, voit l'enfant. Sablo est de profil sur la marche basse (monté : il y est, l'enfant sur son dos)
    const p = retourVillage();
    ui.fondu(); dans = false; J.x = p.x; J.z = p.z; J.a = p.a; J.vx = J.vz = 0;
    if (ctx.monte()) { const m = retourMonte(); J.x = C.x = m.x; J.z = C.z = m.z; J.a = C.a = m.a; C.vit = 0; }
    else { const s = sabloRetour(); C.x = s.x; C.z = s.z; C.a = s.a; C.vit = 0; C.venir = false; }
    montrer(false); R.monde = 'village'; enregistrer(); ctx.surSaut();
    scene.fog.near = fog0.near; scene.fog.far = fog0.far;
  }
  // la reprise exacte de la position (si l'enfant avait quitté le jeu sur la Route)
  { const rep = positionDeReprise(etat);
    if (rep && regionOuverte()) { J.x = rep.x; J.z = rep.z; J.a = rep.a; J.vx = J.vz = 0; dans = true; if (ctx.monte()) { C.x = J.x; C.z = J.z; } else { C.x = J.x + 3; C.z = J.z - 2.5; } monde.preparer(J); montrer(true); } }

  // ---------- la première grande étape : l'oasis, et le dromadaire offert ----------
  function premiereEtape() {
    if (R.vu.etape1) return; R.vu.etape1 = true; enregistrer();
    setTimeout(() => {
      gagner('etape1', 100, 'Première grande étape : l\'oasis de la Source Claire');
      const neuf = !AV.montures.includes('route'); if (neuf) { AV.montures.push('route'); enregistrer(); }
      ui.dialogue({ titre: '🌴 Première grande étape !', icone: '🐪', texte: MESSAGES.etape1 + (neuf ? ' ' + MESSAGES.etape1Cadeau : ''), boutons: [{ txt: 'Merci !', fn: () => {} }] });
    }, 2600);
  }

  // ---------- déplacements : mêmes règles que le village (pente, obstacles), limites propres ----------
  function bouger(o, dx, dz, rayon) {
    let nx = o.x + dx, nz = o.z + dz;
    const h0p = monde.hauteur(o.x, o.z), pas = Math.hypot(dx, dz);
    if (pas > 1e-4) {
      const trop = (x, z) => (monde.hauteur(x, z) - h0p) / pas > 1.05;
      if (trop(nx, nz)) { if (!trop(o.x + dx, o.z)) nz = o.z; else if (!trop(o.x, o.z + dz)) nx = o.x; else { nx = o.x; nz = o.z; } }
    }
    for (const liste of [fixes, monde.colliders, V.colliders, I.colliders]) for (const c of liste) {
      if (c.repos && o === C) continue;
      const ex = nx - c.x, ez = nz - c.z, r = c.r + rayon;
      if (Math.abs(ex) > r || Math.abs(ez) > r) continue;
      const d = Math.hypot(ex, ez);
      if (d < r && d > 1e-5) { nx = c.x + ex / d * r; nz = c.z + ez / d * r; }
    }
    nx = Math.max(-LARGEUR + 20, Math.min(LARGEUR - 20, nx));
    const sMax = DEC + S_FIN_TRANCHE + 25;
    if (nz > sMax && !dansMaison) { nz = sMax; avertirFin(); }
    // la zone jouable : un mur invisible, doux, arrête l'enfant avant le bout du monde (on ne bloque que depuis l'intérieur : jamais piégé dehors)
    if (!dansMaison && zoneJouable(o.z - DEC, o.x) && !zoneJouable(nz - DEC, nx)) { if (zoneJouable(nz - DEC, o.x)) nx = o.x; else if (zoneJouable(o.z - DEC, nx)) nz = o.z; else { nx = o.x; nz = o.z; } if (o === J) avertirLimite(); }
    nz = Math.max(DEC + S_DEBUT, nz);
    o.x = nx; o.z = nz;
  }
  let dernierLimite = 0;
  function avertirLimite() { const t = performance.now(); if (t - dernierLimite > 12000) { dernierLimite = t; ui.indice('🧭 ' + MESSAGES.limite, 5000); } }
  let dernierFin = 0;
  function avertirFin() { const t = performance.now(); if (t - dernierFin > 9000) { dernierFin = t; ui.indice('⛰️ ' + MESSAGES.fin, 5000); } }

  // ---------- chaque image ----------
  let tDecouverte = 0;
  function maj(dt, t, nuit) {
    if (!dans) {
      // approche du seuil : le village disparaît dans la brume
      const k = regionOuverte() ? lisse(285, 340, J.x) * (Math.abs(J.z - 50) < 90 ? 1 : 0) : 0;
      if (k > 0) { brumeVillage = true; scene.fog.far = fog0.far + (190 - fog0.far) * k; scene.fog.near = fog0.near * (1 - 0.6 * k); }
      else if (brumeVillage) { brumeVillage = false; scene.fog.near = fog0.near; scene.fog.far = fog0.far; }
      if (ANCIENNE_MARCHE_ACTIVE && regionOuverte() && auSeuilVillage(J.x, J.z)) entrer();     // l'ancienne entrée par la marche vers l'est est remplacée par le portail
      return;
    }
    if (auRetourRoute(J.z)) { sortir(); return; }
    monde.maj(J); monde.eclairer(nuit, t); H3.animer(dt, t, J, nuit); G3.maj(dt, t, J, carte.cap()); L.animer(dt, t, J); lanternesProches(); parcoursCollines();
    tHors += dt; if (tHors > 1) { tHors = 0;
      // filet de sécurité : s'il se retrouve hors de la zone (ancienne sauvegarde, bug), on le ramène sur la piste
      if (!dansMaison && !zoneJouable(J.z - DEC, J.x)) { const p = pointChemin(Math.max(S_DEBUT, Math.min(S_FIN_TRANCHE, J.z - DEC))); J.x = p.t; J.z = DEC + p.s; J.vx = J.vz = 0; if (ctx.monte()) { C.x = J.x; C.z = J.z; } monde.preparer(J); ui.indice('🧭 ' + MESSAGES.ramene, 6000); } if (cooldownHors > 0) cooldownHors -= 1; else if (!dansMaison && loinDeLaPiste(J.z - DEC, J.x)) { cooldownHors = 40; ui.indice('🧭 ' + MESSAGES.horsPiste, 6000); } }
    { const p = villeVisible(J.x, J.z); if (p !== villeAffichee) { villeAffichee = p; V.montrer(dans && villeVisible(J.x, J.z)); } } V.obstacles(J); W.maj(dt, t, J);
    tVoy += dt; if (tVoy > 0.35) { tVoy = 0; for (const n of W.liste) if (n.v.trajet && n.e.racine.visible) regV(n); }
    // l'arrivée : la dernière crête ouvre la vue sur la cité ; la caméra se tourne doucement vers elle (sans jamais bloquer l'enfant)
    if (!R.vu.arrivee) { const c = L.lieux['crete-vue']; if (c && Math.hypot(J.x - c.x, J.z - c.z) < 30) { R.vu.arrivee = true; enregistrer(); ui.bandeau(MESSAGES.citeApparait, '🌅 ' + infoLieu('crete-vue').nom); if (ctx.regarder) ctx.regarder(CITE.t, DEC + CITE.s, 9); } }
    const { s } = versRoute(J.x, J.z), reg = regionA(s);
    if (reg.id !== regionActuelle) {
      regionActuelle = reg.id; ui.lieu(`${reg.icone} ${reg.nom}`);
      if (!R.decouvertes.includes('region:' + reg.id)) { R.decouvertes.push('region:' + reg.id); enregistrer(); if (reg.id !== 'sortie') ui.bandeau(MESSAGES.entreDans, `${reg.icone} ${reg.nom}`); }
    }
    // ambiance : brume et lumière propres à chaque région
    const A = reg.ambiance, near = A.proche, far = A.loin * (ctx.Q.leger ? 1.3 : 1.7);
    cible.set(A.brume); scene.fog.color.lerp(cible, 0.3 * (1 - nuit));
    scene.fog.near += (near - scene.fog.near) * Math.min(1, dt * 0.8); scene.fog.far += (far - scene.fog.far) * Math.min(1, dt * 0.8);
    // lieux qui se découvrent en s'approchant
    tDecouverte += dt;
    if (tDecouverte > 0.5) {
      tDecouverte = 0;
      const dCamp = Math.hypot(J.x - L.camp.x, J.z - L.camp.z), dOasis = Math.hypot(J.x - OASIS.t, J.z - (DEC + OASIS.s));
      if (dCamp < 30 && !R.decouvertes.includes('campement')) { decouvrirLieu('campement', 'lieu'); }
      if (dOasis < OASIS.r && !R.decouvertes.includes('oasis')) { decouvrirLieu('oasis', 'lieu'); premiereEtape(); }
    }
    { const h = centreHalte(); if (!HH.vue && Math.hypot(J.x - h.x, J.z - h.z) < 38) { HH.vue = true; if (!R.decouvertes.includes('halte')) R.decouvertes.push('halte'); enregistrer(); ui.bandeau('Une halte de repos', '⛺ La halte des caravaniers', true); setTimeout(() => ui.indice(txtH('indice'), 5000), 2500); setTimeout(() => ui.indice(txtH('sablo'), 6000), 8500); } }
    carte.maj(dt);
  }

  // le parcours de test (mode bac à sable seulement) : un panneau qui téléporte à chaque étape clé et coche ce qui est fait, pour tout vérifier sur un téléphone sans marcher 5,6 km
  const versXZ = (x, z) => { if (dansMaison) sortirMaison(); J.x = x; J.z = z; if (ctx.monte()) { C.x = J.x; C.z = J.z; } if (!dans) { dans = true; monde.preparer(J); montrer(true); } else monde.preparer(J); };
  function allerVerif(e) {
    const a = e.aller; let x, z;
    if (a.type === 'lieu') { const p = L.lieux[a.id] || L.pos(a.id); x = p.x; z = p.z; }
    else if (a.type === 'porte') { const P = portesJouables(), k = Math.min((R.missions.portes ? R.missions.portes.faits.length : 0), P.length - 1); x = P[k].x; z = P[k].z; }
    else if (a.type === 'halte') { const p = M3.haltes[a.id + ':0']; x = p.x + 1.5; z = p.z; }
    else if (a.type === 'voyageur') { const n = W.liste.find(o => o.v.id === a.id); x = n.x + 1.2; z = n.z + 1.2; }
    else { x = bouts.a.x; z = bouts.a.z; }
    versXZ(x, z);
  }
  if (sandboxActif(location.hostname, location.search)) creerVerificationUI({ etatRoute: () => R, surRoute: () => dans, aller: allerVerif,
    ouvrirRoute: () => { for (const z of ['oasis', 'camp']) if (!etat.zones.includes(z)) etat.zones.push(z); for (const a of ['lezard', 'gerboise', 'renard']) if (!AV.animaux.includes(a)) AV.animaux.push(a);
      ctx.regions.verifier();   // contrôle immédiat : la Route s'ouvre tout de suite (sinon le panneau dit encore « fermée »)
      J.x = 326; J.z = 50; if (ctx.monte()) { C.x = J.x; C.z = J.z; } ui.indice('🐪 Avance vers l' + String.fromCharCode(39) + 'est pour entrer sur la Route', 5000); } });

  return {
    ville: V, voyageurs: W, enRoute: () => dans, regionId: () => regionActuelle, facteurMarche: FACTEUR_MARCHE_ROUTE, ouvrirHistoire, fermerHistoire: () => recitUI.fermer(), histoireOuverte: () => recitUI.ouverte(), maj, bouger, ouvrirCarte, ouvrirSac, parlerGuide,
    carte, monde, lieux3d: L, halte3d: H3, etat: R,
    // la halte : les lieux de soins de Sablo (l'abreuvoir, la mangeoire, l'abri), au même format que ceux de l'enclos de l'écurie ; null hors de la Route
    lieuxSoins: () => dans && !dansMaison ? H3.soins : null, surLaHalte: () => dans && dansHalte(J.x, J.z, 6), fermerCarte: () => carte.fermer(), carteOuverte: () => carte.ouverte(),
    pageCarnet: () => pageCarnetRoute({ route: R, badges: AV.badges || {}, age: age() }),
    sauver() { if (dans) memoriserPosition(etat, dansMaison ? dansMaison.retour : J); },
    procheEau: () => dans ? Math.max(0, 1 - (Math.hypot(J.x - OASIS.t, J.z - (DEC + OASIS.s)) - OASIS.lac) / 50) : null,
    vers(s, t) { J.x = t; J.z = DEC + s; if (ctx.monte()) { C.x = J.x; C.z = J.z; } if (!dans) { dans = true; monde.preparer(J); montrer(true); } else monde.preparer(J); }   // pour les tests : aller à un endroit de la Route (jamais utilisé par le jeu)
  };
}
