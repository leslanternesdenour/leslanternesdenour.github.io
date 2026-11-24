// Middleware Cloudflare Pages : garde des pages de jeu (voir serveur/garde-pages.js). Il ne s'exécute que pour les routes listées dans _routes.json
// (les pages d'entrée du jeu et /api/*) : les images, sons, modèles et scripts ne passent pas par une fonction.
// Fail-closed : toute erreur inattendue sur une page de jeu = page « momentanément fermée », jamais la page servie sans contrôle.
// Les secrets SESSION_SECRET, FIREBASE_COMPTE_SERVICE (et FIREBASE_PROJET dans wrangler.toml) sont lus à chaque requête : un secret ajouté n'est visible qu'après un NOUVEAU déploiement.
import { garde, estPageProtegee, reponseIndisponible, reponseRedirection } from '../serveur/garde-pages.js';

export async function onRequest({ request, env, next }) {
  const chemin = new URL(request.url).pathname;
  if (!estPageProtegee(chemin)) return next();
  let r;
  try { r = await garde(request, env); } catch (e) { return reponseIndisponible(); }
  if (r.action === 'indisponible') return reponseIndisponible();
  if (r.action === 'rediriger') return reponseRedirection(r.location);
  const rep = await next();
  const h = new Headers(rep.headers); h.set('Cache-Control', 'private, no-store');
  return new Response(rep.body, { status: rep.status, statusText: rep.statusText, headers: h });
}