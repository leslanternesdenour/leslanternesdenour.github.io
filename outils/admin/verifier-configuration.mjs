// Contrôle l'état de configuration d'un site déployé (préproduction) à partir de /api/sante : OUI/NON seulement, aucune valeur secrète.
// Usage : node outils/admin/verifier-configuration.mjs https://lanternes-de-nour.pages.dev
import fs from 'fs'; import path from 'path'; import { pathToFileURL, fileURLToPath } from 'url';
const A_FAIRE = {
  sessions: ['Secret SESSION_SECRET (40 caractères aléatoires ou plus)', 'Cloudflare → projet → Settings → Variables and Secrets → Add → type Secret'],
  firebaseProjet: ['Variable FIREBASE_PROJET (identifiant du projet Firebase)', 'à me communiquer : je l\'inscris dans wrangler.toml'],
  firebaseCompteDeService: ['Secret FIREBASE_COMPTE_SERVICE (contenu complet du fichier JSON de clé)', 'Cloudflare → Variables and Secrets → type Secret ; JSON complet, valide, type « service_account »'],
  createurDesigne: ['Secret CREATOR_UID (identifiant de votre compte Créateur)', 'Firebase → Authentication → Utilisateurs → colonne « UID »'],
  stripeWebhook: ['Secret STRIPE_SECRET_WEBHOOK (whsec_…, mode test)', 'à faire à l\'étape Stripe, pas avant']
};
export function analyser(s, { firebaseDansLeSite = null } = {}) {
  const c = s && s.configuration, lignes = [], manque = [];
  if (!c) return { lignes: ['Ce site ne publie pas son état de configuration (production, ou site injoignable).'], manque: ['état inconnu'], pret: false };
  for (const [k, [nom, ou]] of Object.entries(A_FAIRE)) { const oui = c[k] === true; lignes.push((oui ? '✓ ' : '✗ ') + nom); if (!oui) manque.push(nom + ' — ' + ou); }
  lignes.push(c.stripe === 'test' ? '✓ Stripe en mode test' : c.stripe === 'cle-invalide' ? '✗ STRIPE_CLE_SECRETE n\'est PAS une clé de test (sk_test_…) : refusée par le site' : '• Stripe : pas encore configuré (prévu après Firebase)');
  lignes.push(c.stockagePremium === 'lie' ? '• Stockage Premium (R2) : lié' : '• Stockage Premium (R2) : non lié (volontaire : en attente de votre décision)');
  if (firebaseDansLeSite !== null) { lignes.push((firebaseDansLeSite ? '✓ ' : '✗ ') + 'Configuration publique Firebase dans compte/config.js'); if (!firebaseDansLeSite) manque.push('Configuration web Firebase (firebaseConfig) dans compte/config.js — à me communiquer'); }
  return { lignes, manque, pret: manque.length === 0 || manque.every(m => /webhook/i.test(m)) };
}
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const site = process.argv[2]; if (!site) { console.error('Usage : node outils/admin/verifier-configuration.mjs <adresse-du-site>'); process.exit(2); }
  try {
    const r = await fetch(site.replace(/\/$/, '') + '/api/sante'); if (!r.ok) throw new Error('HTTP ' + r.status);
    const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
    const cfg = (await import(pathToFileURL(path.join(racine, 'compte/config.js')).href)).FIREBASE;
    const a = analyser(await r.json(), { firebaseDansLeSite: !!(cfg && cfg.apiKey && cfg.projectId) });
    console.log(a.lignes.join('\n')); if (a.manque.length) console.log('\nIl manque :\n - ' + a.manque.join('\n - ')); else console.log('\nConfiguration complète pour les comptes et l\'espace Créateur.');
    process.exit(a.pret ? 0 : 1);
  } catch (e) { console.error('Échec : ' + e.message); process.exit(2); }
}
