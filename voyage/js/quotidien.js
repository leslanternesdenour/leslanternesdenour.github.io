// Le quotidien : trois petites missions par jour, les questions de l'ancien du village,
// et les pièces gagnées grâce aux jeux du village (ablutions, prière, calendrier du Ramadan).
// - Les missions changent chaque jour ; les pièces déjà gagnées restent pour toujours.
// - Aucune série à tenir, aucune pénalité si l'enfant ne vient pas.
// - Actualiser la page ne redonne rien (chaque récompense a un identifiant unique, voir economie.js).
// - Si l'horloge de l'appareil recule, on ne donne pas de nouvelles missions.

export const MISSIONS_JOUR = {
  lieux:    { titre: 'Visite 2 lieux différents', icone: '🧭', total: 2, pieces: 60 },
  pierre:   { titre: 'Lis une pierre à lanterne dorée', icone: '📜', total: 1, pieces: 40 },
  animal:   { titre: 'Observe un animal', icone: '🔍', total: 1, pieces: 40 },
  calin:    { titre: 'Fais un câlin à ta monture', icone: '🤲', total: 1, pieces: 30 },
  monture:  { titre: 'Voyage 300 pas sur une monture', icone: '🐪', total: 300, pieces: 60 },
  souk:     { titre: 'Va faire un tour au souk', icone: '🛍️', total: 1, pieces: 30 },
  sage:     { titre: 'Réponds juste à 2 questions de l\'ancien', icone: '🧓', total: 2, pieces: 80 },
  activite: { titre: 'Fais une activité du village (ablutions, prière ou Ramadan)', icone: '🕌', total: 1, pieces: 100 },
  oasis:    { titre: 'Va te rafraîchir à l\'oasis', icone: '🌴', total: 1, pieces: 40 },
  lanterne: { titre: 'Trouve une lanterne cachée', icone: '🏮', total: 1, pieces: 60 }
};
const BONUS = 100;

// Questions de l'ancien : uniquement des faits sûrs, ou ce que le jeu enseigne (avec sa source).
export const QUESTIONS = [
  { id: 'q1', q: 'Combien de bosses a le dromadaire ?', r: ['Une', 'Deux', 'Trois'], ok: 0, exp: 'Le dromadaire a une seule bosse. Le chameau de Bactriane, lui, en a deux.', petits: true },
  { id: 'q2', q: 'Que garde le dromadaire dans sa bosse ?', r: ['De la graisse', 'De l\'eau', 'Du sable'], ok: 0, exp: 'Sa bosse est une réserve de graisse, donc d\'énergie. Ce n\'est pas de l\'eau.' },
  { id: 'q3', q: 'Comment appelle-t-on un endroit du désert où il y a de l\'eau et des palmiers ?', r: ['Une oasis', 'Une dune', 'Un col'], ok: 0, exp: 'C\'est une oasis : grâce à l\'eau, les palmiers poussent.', petits: true },
  { id: 'q4', q: 'Quel fruit pousse sur les palmiers de l\'oasis ?', r: ['Les dattes', 'Les pommes', 'Les cerises'], ok: 0, exp: 'Les palmiers dattiers donnent des dattes.', petits: true },
  { id: 'q5', q: 'Quel animal a de très grandes oreilles pour se rafraîchir ?', r: ['Le fennec', 'La chèvre', 'La colombe'], ok: 0, exp: 'Le fennec, le plus petit des renards : ses grandes oreilles l\'aident à se rafraîchir.', petits: true },
  { id: 'q6', q: 'Dans quelle sourate Allah nous invite-t-il à regarder les chameaux ?', r: ['Al-Ghâchiya (88)', 'Al-Fâtiha (1)', 'Al-Kawthar (108)'], ok: 0, exp: 'Sourate Al-Ghâchiya, verset 17 : « Ne regardent-ils donc pas les chameaux, comment ils ont été créés ? »' },
  { id: 'q7', q: 'Combien de prières obligatoires le musulman fait-il chaque jour ?', r: ['Cinq', 'Deux', 'Dix'], ok: 0, exp: 'Il y a cinq prières obligatoires chaque jour.', petits: true },
  { id: 'q8', q: 'Que fait-on avant la prière ?', r: ['Les ablutions', 'Un repas', 'Une sieste'], ok: 0, exp: 'On fait les ablutions pour être propre avant de prier.', petits: true },
  { id: 'q9', q: 'Pendant quel mois les musulmans jeûnent-ils ?', r: ['Ramadan', 'Muharram', 'Rajab'], ok: 0, exp: 'Le jeûne obligatoire se fait pendant le mois de Ramadan.' },
  { id: 'q10', q: 'Que dit-on avant de manger ?', r: ['Bismillah', 'Bonne nuit', 'Au revoir'], ok: 0, exp: 'On dit « Bismillah » (au nom d\'Allah) avant de manger.', petits: true },
  { id: 'q11', q: 'Que dit-on après avoir mangé, pour remercier Allah ?', r: ['Al-hamdoulillah', 'Bismillah', 'Insha\'Allah'], ok: 0, exp: '« Al-hamdoulillah » veut dire « louange à Allah ».' },
  { id: 'q12', q: 'Comment salue-t-on en islam ?', r: ['As-salâmou ʿalaykoum', 'Bon appétit', 'À demain'], ok: 0, exp: '« As-salâmou ʿalaykoum » : que la paix soit sur vous.', petits: true },
  { id: 'q13', q: 'Dans quelle sourate la huppe est-elle citée ?', r: ['An-Naml (Les Fourmis)', 'Al-Ikhlâs', 'An-Nâs'], ok: 0, exp: 'La huppe est citée dans la sourate An-Naml (27).' },
  { id: 'q14', q: 'Vers où les musulmans se tournent-ils pour prier ?', r: ['Vers la Kaaba, à La Mecque', 'Vers la mer', 'Vers la montagne la plus proche'], ok: 0, exp: 'On se tourne vers la Kaaba, à La Mecque : c\'est la qibla.' },
  { id: 'q15', q: 'Pourquoi les voyageurs d\'autrefois regardaient-ils les étoiles la nuit ?', r: ['Pour trouver leur chemin', 'Pour les compter', 'Pour dormir'], ok: 0, exp: 'Les étoiles les aidaient à se repérer dans le désert.' },
  { id: 'q16', q: 'De quoi un chameau a-t-il besoin après un long voyage ?', r: ['D\'eau, d\'ombre et de repos', 'De courir encore', 'D\'être grondé'], ok: 0, exp: 'On prend soin de sa monture : eau, nourriture, ombre, repos et douceur.', petits: true },
  { id: 'q17', q: 'Quel animal donne du lait et grimpe très bien sur les rochers ?', r: ['La chèvre', 'Le fennec', 'La huppe'], ok: 0, exp: 'La chèvre grimpe très bien et donne du lait.', petits: true },
  { id: 'q18', q: 'Qu\'est-ce qu\'une caravane ?', r: ['Une file de chameaux qui voyagent ensemble', 'Une maison en pierre', 'Une sorte de datte'], ok: 0, exp: 'Une caravane, c\'est un groupe de voyageurs et de chameaux qui traversent le désert ensemble.' }
];

const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
export const jourCle = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function tirage(graine, liste, n) { const l = [...liste], out = []; let h = graine; while (out.length < n && l.length) { h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; out.push(l.splice(h % l.length, 1)[0]); } return out; }

// Signature des jeux du village, pour savoir si une activité a été faite aujourd'hui
function signatureActivites() { try { return ['priere', 'ablutions', 'lanternes2'].map(k => localStorage.getItem(k) || '').join('|').length + ':' + hash(['priere', 'ablutions', 'lanternes2'].map(k => localStorage.getItem(k) || '').join('|')); } catch (e) { return ''; } }

export function creerQuotidien({ etat, A, enregistrer, donner, ui, age }) {
  const Q = etat.quotidien = Object.assign({ jourMax: '', jours: {} }, etat.quotidien || {});
  if (Q.reussies == null) {   // compteurs pour les badges, repris des jours déjà gardés
    Q.reussies = 0; Q.sageJustes = 0;
    for (const d of Object.values(Q.jours)) { Q.reussies += (d.missions || []).filter(m => MISSIONS_JOUR[m] && (d.prog || {})[m] >= MISSIONS_JOUR[m].total).length; Q.sageJustes += (d.sage && d.sage.justes) || 0; }
  }
  let jour = jourCle();
  const recul = Q.jourMax && jour < Q.jourMax;          // l'horloge a reculé : pas de nouvelles missions
  if (recul) jour = Q.jourMax; else Q.jourMax = jour;
  if (!Q.jours[jour]) {
    const restantLanternes = 12 - (A.ramasses || []).filter(k => k.startsWith('lanterne')).length;
    const pool = Object.keys(MISSIONS_JOUR).filter(k => k !== 'lanterne' || restantLanternes > 0);
    Q.jours[jour] = { missions: tirage(hash(jour), pool, 3), prog: {}, lieux: [], sig: signatureActivites(), sage: { faites: [], justes: 0 } };
    // on ne garde que la dernière semaine
    for (const k of Object.keys(Q.jours).sort().slice(0, -7)) delete Q.jours[k];
  }
  const J = Q.jours[jour];
  enregistrer();

  function avancer(type, n = 1) {
    if (!J.missions.includes(type)) return;
    const M = MISSIONS_JOUR[type];
    const avant = J.prog[type] || 0; if (avant >= M.total) return;
    J.prog[type] = Math.min(M.total, avant + n);
    if (J.prog[type] >= M.total) {
      donner('jour:' + jour + ':' + type, M.pieces, 'Mission du jour : ' + M.titre);
      Q.reussies = (Q.reussies || 0) + 1;              // compteur pour les badges (jamais remis à zéro)
      if (J.missions.every(m => (J.prog[m] || 0) >= MISSIONS_JOUR[m].total)) setTimeout(() => donner('jour:' + jour + ':bonus', BONUS, 'Toutes les missions du jour !'), 1500);
    }
    enregistrer(); ui.majSuivi();
  }
  // les événements du jeu
  function evenement(type, info) {
    if (type === 'zone') { if (!J.lieux.includes(info)) { J.lieux.push(info); avancer('lieux'); } if (info === 'oasis') avancer('oasis'); if (info === 'marche') avancer('souk'); }
    else if (type === 'lu') avancer('pierre');
    else if (type === 'animal') avancer('animal');
    else if (type === 'calin') avancer('calin');
    else if (type === 'lanterne') avancer('lanterne');
    else if (type === 'sage') avancer('sage');
    else if (type === 'distance') { J.dist = (J.dist || 0) + info; const pas = Math.floor(J.dist); if (pas > (J.prog.monture || 0)) avancer('monture', pas - (J.prog.monture || 0)); }
  }
  // une activité du village a-t-elle été faite depuis ce matin ?
  function verifierActivites() { if (J.sig && signatureActivites() !== J.sig) avancer('activite'); }

  // ---------- pièces gagnées dans les jeux du village (une seule fois chacune) ----------
  function recompensesActivites() {
    const lire = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
    const liste = [];
    for (const [cle, nom, appris, prixAppris] of [['ablutions', 'Les ablutions', 'learned', 200], ['priere', 'La prière', 'learn', 300]]) {
      const p = lire(cle); if (!p) continue;
      if (p[appris]) liste.push([`${cle}:appris`, prixAppris, `${nom} : toutes les étapes apprises`]);
      for (const [k, v] of Object.entries(p)) if (typeof v === 'number' && v >= 1 && v <= 3 && k !== appris)
        for (let e = 1; e <= v; e++) liste.push([`${cle}:jeu:${k}:${e}`, 40, `${nom} : une étoile gagnée`]);
    }
    const cal = lire('lanternes2');
    if (cal && Array.isArray(cal.kids)) {
      const jours = new Set(), jeux = new Set();
      cal.kids.forEach(k => { Object.keys(k.lit || {}).forEach(d => jours.add(d)); Object.keys(k.jeux || {}).forEach(j => jeux.add(j)); });
      jours.forEach(d => liste.push([`ramadan:jour:${d}`, 30, 'Ramadan : une lanterne allumée']));
      jeux.forEach(j => liste.push([`ramadan:jeu:${j}`, 50, 'Ramadan : un jeu réussi']));
    }
    const nouvelles = liste.filter(([id]) => !A.credites[id]);
    if (!nouvelles.length) return 0;
    // une seule pluie de pièces pour tout ce qui a été gagné dans le village depuis la dernière visite
    nouvelles.forEach(([id]) => { A.credites[id] = Date.now(); });
    const total = nouvelles.reduce((s, [, n]) => s + n, 0);
    donner('village:' + Date.now(), total, 'Tes activités du village');
    return total;
  }

  // ---------- l'ancien du village et ses questions ----------
  function questionsDuJour() {
    const pool = QUESTIONS.filter(q => age !== 'petits' || q.petits);
    return tirage(hash('sage' + jour), pool, 3);
  }
  function parlerSage() {
    const qs = questionsDuJour(), suivante = qs.find(q => !J.sage.faites.includes(q.id));
    if (!suivante) { ui.dialogue({ titre: '🧓 Hakim, l\'ancien du village', texte: 'Tu as répondu à toutes mes questions du jour. Reviens un autre jour, j\'en aurai d\'autres ! Prends soin de toi.', sous: 'Personnage imaginaire du jeu.' }); return; }
    const ordre = tirage(hash(suivante.id + jour), [0, 1, 2], 3);
    ui.dialogue({ titre: `🧓 Question ${J.sage.faites.length + 1} sur 3`, texte: suivante.q, sous: 'Hakim, l\'ancien du village (personnage imaginaire)',
      boutons: ordre.map(i => ({ txt: suivante.r[i], fn: () => repondre(suivante, i) })), petitsBoutons: true });
  }
  function repondre(q, i) {
    J.sage.faites.push(q.id);
    const juste = i === q.ok;
    if (juste) { J.sage.justes++; Q.sageJustes = (Q.sageJustes || 0) + 1; donner('sage:' + jour + ':' + q.id, 20, 'Bonne réponse'); evenement('sage'); }
    enregistrer();
    setTimeout(() => ui.dialogue({ titre: juste ? '✨ Bravo !' : 'Presque !', texte: q.exp, sous: juste ? '+20 pièces à ramasser' : 'La bonne réponse : ' + q.r[q.ok],
      boutons: J.sage.faites.length < 3 ? [{ txt: 'Question suivante', fn: () => setTimeout(parlerSage, 50) }, { txt: 'Plus tard', fn: () => {} }] : null }), 60);
  }

  return {
    jour, recul, J, evenement, verifierActivites, recompensesActivites, parlerSage,
    missions: () => J.missions.map(k => ({ id: k, ...MISSIONS_JOUR[k], n: J.prog[k] || 0, fini: (J.prog[k] || 0) >= MISSIONS_JOUR[k].total })),
    bonus: BONUS
  };
}
