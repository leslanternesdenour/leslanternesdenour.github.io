// Accès aux zones et missions Premium du Grand Voyage (sans Three.js : testable seul).
// Le serveur décide (/api/catalogue) ; le contenu d'une zone Premium (textes, versets, voix) n'existe PAS dans le code public :
// il est demandé au serveur (/api/premium/voyage/<zone>/contenu.json), qui ne le donne qu'à un compte qui y a droit.
// Une zone ne s'ouvre que si son contenu a vraiment été reçu. Sans compte, hors ligne ou si les comptes ne sont pas
// encore ouverts : les zones gratuites (village, souk, oasis) fonctionnent exactement comme avant, les autres restent fermées.

export const ZONES_PREMIUM = ['camp', 'dunes', 'col', 'montagnes', 'wadi', 'rochers'];   // zones dont le contenu est dans le stockage privé
const AVEC_CONTENU = ['camp', 'dunes', 'montagnes', 'wadi', 'rochers'];              // le col n'est qu'un passage : pas de fichier de contenu
export const MISSIONS_PREMIUM = ['lanternes', 'tresor', 'voyageur', 'animaux'];

// Applique un contenu reçu aux tables du jeu, sans changer leur forme (le moteur 3D n'est pas touché).
export function appliquerPack(pack, { POINTS, DESCRIPTIONS_LIEUX, SPOTS, ajouterPhrases }) {
  if (!pack || pack.format !== 'ldn-pack-voyage-1' || !AVEC_CONTENU.includes(pack.zone)) return false;
  const champs = ['texte', 'arabe', 'sens', 'source', 'decouverte'];
  for (const [k, p] of Object.entries(pack.points || {})) if (POINTS[k] && POINTS[k].premium === pack.zone)
    for (const c of champs) if (typeof p[c] === 'string') POINTS[k][c] = p[c];
  if (typeof pack.lieu === 'string' && pack.zone in DESCRIPTIONS_LIEUX) DESCRIPTIONS_LIEUX[pack.zone] = pack.lieu;
  for (const [id, s] of Object.entries(pack.spots || {})) { const o = SPOTS.find(x => x.id === id); if (o && typeof s.texte === 'string') o.texte = s.texte; }
  if (ajouterPhrases) ajouterPhrases(pack.phrases || [], Object.fromEntries(Object.entries(pack.voix || {}).map(([id, v]) => [id, v.slice(0, 3)])));
  return true;
}

// Demande au serveur ce qui est ouvert, puis le contenu de chaque zone ouverte.
export async function chargerPremium(tables, { fetcher = (u, o) => fetch(u, o) } = {}) {
  const acces = { zones: new Set(), missions: new Set(), vue: null, raison: null };
  let cat;
  try {
    const r = await fetcher('/api/catalogue', { credentials: 'same-origin', cache: 'no-store' });
    if (!r.ok) { acces.raison = r.status === 503 ? 'comptes-non-ouverts' : 'serveur-' + r.status; return finir(acces); }
    cat = await r.json();
  } catch (e) { acces.raison = 'hors-ligne'; return finir(acces); }
  acces.vue = cat.vue || null;
  const voyage = (cat.catalogue && cat.catalogue.voyage) || {}, missions = (cat.catalogue && cat.catalogue.missions) || {};
  for (const id of MISSIONS_PREMIUM) if (missions[id] && missions[id].ouvert) acces.missions.add(id);
  await Promise.all(ZONES_PREMIUM.map(async id => {
    if (!voyage[id] || !voyage[id].ouvert) return;
    if (!AVEC_CONTENU.includes(id)) { acces.zones.add(id); return; }
    try {
      const r = await fetcher(`/api/premium/voyage/${id}/contenu.json`, { credentials: 'same-origin', cache: 'no-store' });
      if (r.ok && appliquerPack(await r.json(), tables)) acces.zones.add(id);
    } catch (e) { /* zone laissée fermée */ }
  }));
  // le col mène aux montagnes : il n'est ouvert que si les montagnes le sont aussi
  if (!acces.zones.has('montagnes')) acces.zones.delete('col');
  return finir(acces);
}

function finir(acces) {
  acces.zoneOuverte = id => !ZONES_PREMIUM.includes(id) || acces.zones.has(id);
  acces.missionOuverte = id => !MISSIONS_PREMIUM.includes(id) || acces.missions.has(id);
  return acces;
}

// Message montré à l'enfant devant une zone fermée : neutre, sans prix ni bouton d'achat.
export const MESSAGE_FERME = 'Ce chemin n\'est pas encore ouvert pour toi. Continue d\'explorer le village, le souk et l\'oasis ! (Pour les parents : cette partie du voyage fait partie de l\'accès Premium, voir l\'Espace famille.)';
