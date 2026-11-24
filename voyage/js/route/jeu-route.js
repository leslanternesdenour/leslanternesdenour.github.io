// Le chef d'orchestre de La Route vers La Mecque (première tranche) : passage du village à la Route, déplacements, lieux, missions, sac,
// ambiance, sauvegarde, carte et carnet. Tout ce qui est nouveau est rangé dans etat.route ; les systèmes du village sont RÉUTILISÉS
// (bourse, habitants, dialogues, découvertes, régions, montures) et jamais dupliqués.
import { creerMondeRoute } from './monde.js';
import { creerLieux3D } from './lieux-3d.js';
import { creerVille3D } from './ville-3d.js';
import { creerVoyageurs3D } from './voyageurs-3d.js';
import { maisonsVille } from './ville-plan.js';
import { LIEUX_SACRES } from './lieux-mecque-a-valider.js';
import { preparerRoute, memoriserPosition, positionDeReprise } from './etat-route.js';
import { faireEtape, progression } from './missions-route.js';
import { DEC, versRoute, S_DEBUT, S_FIN_TRANCHE, LARGEUR, OASIS, CITE, pointChemin } from './relief.js';
import { FACTEUR_MARCHE_ROUTE, regionA, LIEUX_ROUTE, MISSIONS_ROUTE, SAC_ROUTE, RELAIS_VILLAGE, auSeuilVillage, versLaRoute, auRetourRoute, versLeVillage } from './donnees.js';
import { texteLieu, GUIDE, VOYAGEUSE, MESSAGES, FAITS_MAISONS } from './textes-route.js';
import { CONTENU, etiquette, texteDe } from './contenu-a-valider.js';
import { pageCarnetRoute } from './carnet-route.js';
import { creerRecitUI } from './recit-ui.js';
import { recit } from './recits-a-valider.js';
import { creerCarteRoute } from './carte-route.js';

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
  const W = creerVoyageurs3D({ scene, hauteur: monde.hauteur, leger: !!ctx.Q.leger });   // ses voyageurs fictifs animés
  const Couleur = scene.fog.color.constructor, cible = new Couleur();
  const fog0 = { near: scene.fog.near, far: scene.fog.far };
  let dans = false, brumeVillage = false, regionActuelle = null;
  const gagner = (id, n, raison) => donner('route:' + id, n, raison);
  const regionOuverte = () => ctx.regions.ouverte('route');

  // le sol de la Route répond au même terrain.hauteur / terrain.matiere que le village : tous les systèmes (pas, ombres, monture…) fonctionnent sans changement
  const h0 = terrain.hauteur.bind(terrain), m0 = terrain.matiere.bind(terrain);
  terrain.hauteur = (x, z) => z > SEUIL_Z ? monde.hauteur(x, z) : h0(x, z);
  terrain.matiere = (x, z) => z > SEUIL_Z ? monde.matiere(x, z) : m0(x, z);
  const montrer = v => { monde.montrer(v); L.groupe.visible = v; V.montrer(v); terrain.mesh.visible = !v; if (!v) for (const n of W.liste) n.e.racine.visible = false; };
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
  const infoLieu = id => { const l = lieu(id), sa = LIEUX_SACRES[id]; return { nom: sa ? sa.nom : l.nom, icone: sa ? sa.icone : l.icone, texte: sa ? (age() === '3-5' ? sa.petit : sa.grand) : texteLieu(id, age()), valider: !!sa }; };
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
  const parlerVoyageur = n => { W.saluer(n.v.id); ui.dialogue({ titre: '💬 ' + n.v.role, texte: age() === '3-5' ? n.v.texte.petit : n.v.texte.grand, boutons: [{ txt: 'Merci, bonne route !', fn: () => {} }] }); if (n.v.mission) etape(n.v.mission, n.v.id); };
  const regV = n => habitants.ajouter({ id: 'route:v:' + n.v.id, x: n.x, z: n.z, rayon: 3.4, label: 'Parler', icone: '💬', ouvrir: () => parlerVoyageur(n) });
  for (const n of W.liste) regV(n);
  { const vus = new Set(), tri = [...maisonsVille()].sort((a, b) => Math.abs(a.t - pointChemin(a.s).t) - Math.abs(b.t - pointChemin(b.s).t));
    for (const m of tri) { if (vus.has(m.gabarit)) continue; vus.add(m.gabarit);
      const sens = Math.sign(pointChemin(m.s).t - m.t) || 1, x = m.t + sens * (Math.min(m.l, m.w) * 0.5 + 1.6), z = DEC + m.s;
      habitants.ajouter({ id: 'route:maison:' + m.gabarit, x, z, rayon: 3.2, label: 'Observer la maison', icone: '🏠', ouvrir: () => {
        const f = FAITS_MAISONS[m.gabarit]; ui.dialogue({ titre: '🏠 Une maison de la cité', texte: age() === '3-5' ? f.petit : f.grand, sous: '(Illustration du jeu : la cité est une interprétation, pas une reconstitution exacte.)', boutons: [{ txt: 'Merci !', fn: () => {} }] });
        if (!R.decouvertes.includes('maison:' + m.gabarit)) { R.decouvertes.push('maison:' + m.gabarit); enregistrer(); gagner('maison:' + m.gabarit, 10, 'Tu as observé une maison de la cité'); } } }); } }
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
    texte: regionOuverte() ? 'Une très longue piste part d\'ici, vers le sud. Parle à Rachid pour préparer ton sac, puis suis la piste.' : 'Une très longue piste part d\'ici. ' + conditionsTexte() }) });
  habitants.ajouter({ id: 'route:table', x: RELAIS_VILLAGE.x - 0.2, z: RELAIS_VILLAGE.z - 2.3, rayon: 3, label: 'Mon sac', icone: '🎒', ouvrir: ouvrirSac });

  // ---------- la carte de la Route ----------
  const carte = creerCarteRoute({
    route: R, age, joueur: () => { const { s, t } = versRoute(J.x, J.z); return { s, t, a: J.a, dans }; },
    surFermer: () => ui.carteFermee && ui.carteFermee(), surOuvrir: () => ui.carteOuverte && ui.carteOuverte()
  });
  function ouvrirCarte() { if (!R.sac.carte && dans) R.sac.carte = true; carte.ouvrir(); }

  // ---------- passage d'un monde à l'autre : la brume cache la couture, on garde la même direction ----------
  function entrer() {
    const p = versLaRoute({ x: J.x, z: J.z, a: J.a });
    ui.fondu(); dans = true; J.x = p.x; J.z = p.z;
    if (ctx.monte()) { C.x = J.x; C.z = J.z; } else { C.x = J.x + 3; C.z = J.z - 2.5; C.vit = 0; C.venir = false; }
    monde.preparer(J); montrer(true); brumeVillage = false;
    R.monde = 'route'; memoriserPosition(etat, J); enregistrer();
    ctx.arreterGuide(); ctx.surSaut();
    if (!R.decouvertes.includes('seuil')) { R.decouvertes.push('seuil'); enregistrer(); ui.bandeau(MESSAGES.decouvres, '🚏 ' + MESSAGES.grandeRoute); setTimeout(() => gagner('lieu:seuil', 50, 'Tu quittes le village : la grande route'), 900); }
  }
  function sortir() {
    const p = versLeVillage({ x: J.x, z: J.z, a: J.a });
    ui.fondu(); dans = false; J.x = p.x; J.z = p.z;
    if (ctx.monte()) { C.x = J.x; C.z = J.z; } else { C.x = J.x + 3; C.z = J.z - 2.5; C.vit = 0; C.venir = false; }
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
    for (const liste of [fixes, monde.colliders, V.colliders]) for (const c of liste) {
      if (c.repos && o === C) continue;
      const ex = nx - c.x, ez = nz - c.z, r = c.r + rayon;
      if (Math.abs(ex) > r || Math.abs(ez) > r) continue;
      const d = Math.hypot(ex, ez);
      if (d < r && d > 1e-5) { nx = c.x + ex / d * r; nz = c.z + ez / d * r; }
    }
    nx = Math.max(-LARGEUR + 20, Math.min(LARGEUR - 20, nx));
    const sMax = DEC + S_FIN_TRANCHE + 25;
    if (nz > sMax) { nz = sMax; avertirFin(); }
    nz = Math.max(DEC + S_DEBUT, nz);
    o.x = nx; o.z = nz;
  }
  let dernierFin = 0;
  function avertirFin() { const t = performance.now(); if (t - dernierFin > 9000) { dernierFin = t; ui.indice('🪨 ' + MESSAGES.fin, 5000); } }

  // ---------- chaque image ----------
  let tDecouverte = 0;
  function maj(dt, t, nuit) {
    if (!dans) {
      // approche du seuil : le village disparaît dans la brume
      const k = regionOuverte() ? lisse(285, 340, J.x) * (Math.abs(J.z - 50) < 90 ? 1 : 0) : 0;
      if (k > 0) { brumeVillage = true; scene.fog.far = fog0.far + (190 - fog0.far) * k; scene.fog.near = fog0.near * (1 - 0.6 * k); }
      else if (brumeVillage) { brumeVillage = false; scene.fog.near = fog0.near; scene.fog.far = fog0.far; }
      if (regionOuverte() && auSeuilVillage(J.x, J.z)) entrer();
      return;
    }
    if (auRetourRoute(J.z)) { sortir(); return; }
    monde.maj(J); L.animer(dt, t, J); lanternesProches(); V.obstacles(J); W.maj(dt, t, J);
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
    carte.maj(dt);
  }

  return {
    ville: V, voyageurs: W, enRoute: () => dans, facteurMarche: FACTEUR_MARCHE_ROUTE, ouvrirHistoire, fermerHistoire: () => recitUI.fermer(), histoireOuverte: () => recitUI.ouverte(), maj, bouger, ouvrirCarte, ouvrirSac, parlerGuide,
    carte, monde, lieux3d: L, etat: R, fermerCarte: () => carte.fermer(), carteOuverte: () => carte.ouverte(),
    pageCarnet: () => pageCarnetRoute({ route: R, badges: AV.badges || {}, age: age() }),
    sauver() { if (dans) memoriserPosition(etat, J); },
    procheEau: () => dans ? Math.max(0, 1 - (Math.hypot(J.x - OASIS.t, J.z - (DEC + OASIS.s)) - OASIS.lac) / 50) : null,
    vers(s, t) { J.x = t; J.z = DEC + s; if (ctx.monte()) { C.x = J.x; C.z = J.z; } if (!dans) { dans = true; monde.preparer(J); montrer(true); } else monde.preparer(J); }   // pour les tests : aller à un endroit de la Route (jamais utilisé par le jeu)
  };
}
