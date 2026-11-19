// GET /api/sante : vérifie que les fonctions serveur Cloudflare répondent (aucune donnée, aucun secret).
export function onRequestGet({ env }) {
  return new Response(JSON.stringify({ ok: true, service: 'lanternes-de-nour', environnement: env.ENVIRONNEMENT || 'inconnu', heure: new Date().toISOString() }),
    { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}
