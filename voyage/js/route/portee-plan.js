// La portée d'affichage (pur) : un objet plus loin que la portée n'est pas dessiné (le brouillard le cacherait de toute façon). Un objet marqué userData.retire
// (ramassé, pierre dorée retirée) reste toujours caché. Renvoie le nombre d'objets dont l'état a changé (0 : aucun travail).
export function majPortee(liste, x, z, portee, garder = []) {
  let n = 0;
  for (const o of liste) {
    if (garder.includes(o)) continue;
    const v = !(o.userData && o.userData.retire) && Math.hypot(o.position.x - x, o.position.z - z) < portee;
    if (o.visible !== v) { o.visible = v; n++; }
  }
  return n;
}
