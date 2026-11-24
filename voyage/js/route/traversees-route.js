// Le parcours entre les deux collines (pur) : on compte les traversées d'un bout à l'autre, tranquillement. Aucune durée n'est mesurée, aucun classement n'existe.
// s = { dernier : 'a' | 'b' | null, n : nombre de traversées } ; bout = le bout où se trouve l'enfant (null s'il est entre les deux). Renvoie true quand une nouvelle traversée vient d'être faite.
export function suivreTraversee(s, bout) {
  if (!bout || bout === s.dernier) return false;
  const traversee = s.dernier !== null;
  s.dernier = bout; if (traversee) s.n++;
  return traversee;
}
