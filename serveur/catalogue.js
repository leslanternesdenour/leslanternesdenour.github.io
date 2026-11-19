// Niveau requis de chaque contenu. Valeurs : 'libre' (sans compte) | 'gratuit' (compte) | 'premium' | 'famille' | 'apercu' (Créateur seul).
// Décisions du créateur (19/11/2026) : ablutions, prière, calendrier 2027 gratuits ; village, souk, oasis et
// « Les objets perdus de Nour » gratuits ; zones avancées du Grand Voyage Premium ; maisons en préparation : aperçu Créateur.
// Le Créateur peut changer un état depuis /admin/ (surcharge enregistrée dans catalogue/etat) sans redéploiement.
export const CATALOGUE = {
  maisons: { ablutions: 'libre', priere: 'libre', ramadan: 'libre', desert: 'libre',
    sons: 'apercu', jardin: 'apercu', mots: 'apercu', cinq: 'apercu', etoiles: 'apercu' },
  voyage: { village: 'libre', marche: 'libre', oasis: 'libre',
    camp: 'premium', dunes: 'premium', col: 'premium', montagnes: 'premium', wadi: 'premium', rochers: 'premium' },
  missions: { objets: 'libre', lanternes: 'premium', tresor: 'premium', voyageur: 'premium', animaux: 'premium' }
};
export const ETATS = ['libre', 'gratuit', 'premium', 'famille', 'apercu'];

export function catalogueEffectif(surcharge) {
  const c = JSON.parse(JSON.stringify(CATALOGUE));
  for (const [groupe, items] of Object.entries(surcharge || {}))
    if (c[groupe]) for (const [id, n] of Object.entries(items || {})) if (id in c[groupe] && ETATS.includes(n)) c[groupe][id] = n;
  return c;
}

// Fichiers privés (R2) : « voyage/<zone>/… », « maisons/<maison>/… », « missions/<mission>/… ».
// Tout chemin inconnu ou suspect est réservé au Créateur (refus par défaut).
export function niveauDuFichier(chemin, cat = CATALOGUE) {
  if (typeof chemin !== 'string' || !/^[a-z0-9][a-z0-9/_.-]{0,200}$/.test(chemin) || chemin.includes('..') || chemin.includes('//')) return null;
  const [groupe, id] = chemin.split('/');
  return (cat[groupe] && cat[groupe][id]) || 'apercu';
}
