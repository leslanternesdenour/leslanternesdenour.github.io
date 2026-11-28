// Base de données en mémoire, avec EXACTEMENT la même interface que la base Firestore (base-firestore.js).
// Sert aux tests et à la préproduction locale. Chemins : collection = 'familles' ou 'familles/<uid>/enfants'.
export function baseMemoire(initial = {}) {
  const d = new Map(Object.entries(initial));
  const cle = (col, id) => col + '/' + id;
  const copie = v => v == null ? null : JSON.parse(JSON.stringify(v));
  const directs = col => [...d.keys()].filter(k => k.startsWith(col + '/') && !k.slice(col.length + 1).includes('/'));
  return {
    type: 'memoire', _donnees: d, utilisateursSupprimes: [],
    async supprimerUtilisateur(uid) { this.utilisateursSupprimes.push(uid); },
    rolesCreateurPoses: [], async poserRoleCreateur(uid) { this.rolesCreateurPoses.push(uid); },
    async lire(col, id) { return copie(d.get(cle(col, id))); },
    async ecrire(col, id, data) { d.set(cle(col, id), copie(data)); },
    async maj(col, id, partiel) { const k = cle(col, id); if (!d.has(k)) throw new Error('document absent : ' + k); d.set(k, { ...d.get(k), ...copie(partiel) }); },
    async creerSiAbsent(col, id, data) { const k = cle(col, id); if (d.has(k)) return false; d.set(k, copie(data)); return true; },
    // Incrémentation ATOMIQUE d'un compteur entier (+1) ; les champs « extra » sont écrits dans la même opération. Renvoie la nouvelle valeur.
    // Document ou champ absent (ou non numérique) : le champ vaut 1. Même contrat que Firestore (transformation « increment »).
    async incrementer(col, id, champ, extra = {}) {
      const k = cle(col, id), actuel = d.get(k) || {};
      const v = typeof actuel[champ] === 'number' ? actuel[champ] + 1 : 1;
      if (!Number.isSafeInteger(v)) throw new Error('incrementation illisible');
      d.set(k, { ...actuel, ...copie(extra), [champ]: v }); return v;
    },
    async supprimer(col, id) { d.delete(cle(col, id)); },
    // tri par identifiant ; « apres » = dernier identifiant de la page précédente
    async lister(col, { limite = 20, apres = null } = {}) {
      const ids = directs(col).map(k => k.slice(col.length + 1)).sort();
      const debut = apres ? ids.findIndex(i => i > apres) : 0;
      const page = debut < 0 ? [] : ids.slice(debut, debut + limite);
      return { docs: page.map(id => ({ id, data: copie(d.get(cle(col, id))) })), suite: page.length === limite && debut + limite < ids.length ? page[page.length - 1] : null };
    },
    async compter(col) { return directs(col).length; },
    async chercher(col, champ, valeur, limite = 100) {
      return directs(col).map(k => ({ id: k.slice(col.length + 1), data: d.get(k) })).filter(x => x.data && x.data[champ] === valeur).slice(0, limite).map(x => ({ id: x.id, data: copie(x.data) }));
    }
  };
}
