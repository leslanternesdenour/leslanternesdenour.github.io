// Garde serveur des pages de jeu (organisation du 24/11/2026) : pour jouer, il faut une session de compte parent valide.
// Fail-closed : si le système de comptes n'est pas configuré ou échoue, la page de jeu n'est PAS servie.
// Les pages publiques (accueil, présentation, conditions, soutien, compte) ne passent jamais par ce refus.
// Logique pure : testée sous Node (outils/tests/garde-pages.test.mjs), branchée par functions/_middleware.js.
import { lireSession, lireCookie, NOM_COOKIE } from './session.js';

// Toutes les pages d'entrée où l'enfant joue (village, Grand Voyage, ablutions et prière en 2D et en 3D, calendrier, Aventures, École arabe) : aucune ne s'ouvre sans compte parent.
export const PAGES_PROTEGEES = [
  '/monde/',
  '/voyage/',
  '/ablutions/',
  '/ablutions/jeu3d/',
  '/priere/',
  '/priere/jeu3d/',
  '/calendrier/',
  '/aventures/',
  '/aventures/chasse-aux-mots/',
  '/aventures/mysteres-desert/',
  '/aventures/quiz-nour/',
  '/ecole-arabe/',
  '/ecole-arabe/lettres/',
  '/ecole-arabe/lecture/',
  '/ecole-arabe/chiffres/'
];

// Normalise « /monde », « /monde/index.html » en « /monde/ » puis compare : seules les pages d'entrée sont concernées (pas leurs ressources).
export function estPageProtegee(chemin) {
  let p = String(chemin || '').split('?')[0].split('#')[0];
  p = p.replace(/\/index\.html$/, '/');
  if (!p.endsWith('/')) p += '/';
  return PAGES_PROTEGEES.includes(p);
}

export const comptesConfigures = env => !!(env && env.SESSION_SECRET && env.FIREBASE_PROJET && env.FIREBASE_COMPTE_SERVICE);

// Résultat : { action: 'passer' } | { action: 'rediriger', location } | { action: 'indisponible' }
export async function garde(requete, env, maintenant = Date.now()) {
  const url = new URL(requete.url);
  if (!estPageProtegee(url.pathname)) return { action: 'passer' };
  if (!comptesConfigures(env)) return { action: 'indisponible' };
  let session = null;
  try { session = await lireSession(lireCookie(requete.headers.get('Cookie'), NOM_COOKIE), env.SESSION_SECRET, maintenant); } catch (e) { return { action: 'indisponible' }; }
  if (!session) return { action: 'rediriger', location: '/compte/?retour=' + encodeURIComponent(url.pathname + url.search) + '#connexion' };
  // Adresse e-mail du parent non vérifiée : jamais de jeu (décision du 24/11/2026) ; l'Espace famille affiche l'état de vérification.
  if (!session.emailVerifie) return { action: 'rediriger', location: '/compte/?retour=' + encodeURIComponent(url.pathname + url.search) + '&verification=1#verification' };
  return { action: 'passer', protegee: true };
}

const PAGE_INDISPONIBLE = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Service momentanément indisponible · Les Lanternes de Nour</title>' +
  '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#191345;color:#f4efff;font:18px/1.55 Nunito,system-ui,sans-serif;padding:20px;box-sizing:border-box}main{max-width:460px;background:#2a2166;border:2px solid rgba(245,185,66,.8);border-radius:24px;padding:28px 24px;text-align:center}h1{font-size:26px;color:#ffd24a;margin:8px 0 12px}a{display:inline-block;margin:6px;padding:12px 18px;border-radius:14px;border:2px solid #ffd666;color:#ffd666;text-decoration:none;font-weight:800}a.p{background:#ffd666;color:#2a1d00}</style></head>' +
  '<body><main><div style="font-size:42px">🏮</div><h1>Le village est momentanément fermé</h1><p>Le service des comptes parents ne répond pas pour l\'instant. Par sécurité, le jeu reste fermé. Réessayez dans quelques minutes.</p><p><a class="p" href="">Réessayer</a><a href="/decouvrir/">Voir la présentation</a><a href="/">Accueil</a></p></main></body></html>';

export function reponseIndisponible() {
  return new Response(PAGE_INDISPONIBLE, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '120', 'X-Robots-Tag': 'noindex' } });
}
export function reponseRedirection(location) {
  return new Response(null, { status: 302, headers: { Location: location, 'Cache-Control': 'no-store' } });
}