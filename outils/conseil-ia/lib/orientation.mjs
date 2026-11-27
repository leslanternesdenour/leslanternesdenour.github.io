// Orientation d'une mission : règles écrites dans la configuration, sans appel à un modèle (gratuit et vérifiable).
const plier = t => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/['’]/g, ' ');
const echapper = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const presents = (texte, mots) => mots.filter(m => new RegExp(`(^|[^a-z0-9])${echapper(m)}`).test(texte));

// Part des constats confirmés après vérification, lissée pour qu'un seul résultat ne décide pas de tout.
const taux = m => ((m?.confirmes || 0) + 1) / ((m?.confirmes || 0) + (m?.rejetes || 0) + 2);
const juges = m => (m?.confirmes || 0) + (m?.rejetes || 0);

export function planifier({ domaine, complexite }, { candidats, mesures, auteur = null }, config) {
  const regles = config.orientation, niveau = regles.niveaux[complexite], ordre = regles.ordreInitial[domaine] || regles.ordreInitial[regles.domaineParDefaut];
  const rang = a => { const i = ordre.indexOf(a); return i < 0 ? ordre.length : i; };
  const eligibles = candidats.filter(a => a !== auteur);
  const mesure = eligibles.length > 0 && eligibles.every(a => juges(mesures[a]) >= regles.mesuresMinimum);
  const classes = [...eligibles].sort((a, b) => (mesure ? taux(mesures[b]) - taux(mesures[a]) : (mesures[a]?.missions || 0) - (mesures[b]?.missions || 0)) || rang(a) - rang(b));
  const analystes = classes.slice(0, niveau.analystes), arbitre = analystes.length > 1 ? classes[2] ?? null : null;
  const raisons = [
    mesure ? `choix sur mesures (domaine ${domaine})` : `mesures insuffisantes (moins de ${regles.mesuresMinimum} constats vérifiés pour au moins un modèle) : rotation, puis ordre de départ configuré`,
    ...classes.map(a => `${a} : ${mesures[a]?.confirmes || 0} confirmés sur ${juges(mesures[a])} vérifiés, ${mesures[a]?.missions || 0} mission(s)`),
    ...(auteur ? [`${auteur} est l'auteur : écarté de l'analyse`] : []),
    ...(analystes.length < niveau.analystes ? [`second avis impossible : ${analystes.length} modèle(s) disponible(s)`] : []),
  ];
  return { analystes, arbitre, profil: niveau.profil, mode: mesure ? 'mesures' : 'exploration', raisons };
}

export function classer({ mission, fichiers, taille, images, domaine, complexite }, config) {
  const regles = config.orientation, texte = plier(`${mission} ${fichiers.join(' ')}`), signaux = [];
  // Le domaine qui réunit le plus de signaux l'emporte ; à égalité, le premier de la configuration.
  let choisi = regles.domaineParDefaut, meilleur = 0;
  for (const [nom, mots] of Object.entries(regles.domaines)) {
    const trouves = presents(texte, mots), score = trouves.length + (nom === 'visuel' && images ? 2 : 0);
    if (score > meilleur) { meilleur = score; choisi = nom; }
    if (trouves.length) signaux.push(`${nom} : ${trouves.join(', ')}`);
  }
  if (images) signaux.push(`${images} image(s) jointe(s)`);
  const critiques = presents(texte, regles.motsCritiques), complexes = presents(texte, regles.motsComplexes), petits = presents(texte, regles.motsPetits);
  const s = regles.seuils, volumineux = taille > s.caracteresComplexe || fichiers.length >= s.fichiersComplexe;
  const niveau = critiques.length ? 'critique' : complexes.length || volumineux ? 'complexe' : petits.length && taille <= s.caracteresPetit && fichiers.length <= 1 ? 'petite' : 'moyenne';
  if (critiques.length) signaux.push(`critique : ${critiques.join(', ')}`);
  if (complexes.length) signaux.push(`complexe : ${complexes.join(', ')}`);
  if (volumineux) signaux.push(`volume : ${taille} caractères, ${fichiers.length} fichier(s)`);
  return { domaine: domaine || choisi, complexite: complexite || niveau, signaux: [...signaux, ...(domaine ? ['domaine imposé'] : []), ...(complexite ? ['complexité imposée'] : [])] };
}
