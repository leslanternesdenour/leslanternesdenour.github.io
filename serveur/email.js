// Envoi d'e-mails par un prestataire transactionnel : Resend ou Brevo, par simple appel HTTPS (fetch) : compatible avec les Cloudflare Pages Functions, sans SDK.
// Configuration (variables Cloudflare ; la clé est un SECRET, jamais dans le dépôt ni dans le navigateur) :
//   EMAIL_FOURNISSEUR = « resend » ou « brevo » ; EMAIL_CLE_API (secret) ; EMAIL_EXPEDITEUR_ADRESSE (défaut bonjour@leslanternesdenour.fr) ;
//   EMAIL_EXPEDITEUR_NOM (défaut « Les Lanternes de Nour ») ; EMAIL_REPONSE (facultatif).
// Renvoie null si la configuration est absente ou invalide : l'envoi personnalisé est alors désactivé et l'ancien envoi Firebase reste utilisé.
const ADRESSE = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]{2,}$/;

export function creerCourriel(env, { fetcher = fetch, delaiMs = 8000 } = {}) {
  const f = String(env && env.EMAIL_FOURNISSEUR || '').trim().toLowerCase(), cle = String(env && env.EMAIL_CLE_API || '').trim();
  if (!['resend', 'brevo'].includes(f) || cle.length < 20 || /\s/.test(cle)) return null;
  const adresse = String(env.EMAIL_EXPEDITEUR_ADRESSE || 'bonjour@leslanternesdenour.fr').trim();
  const nom = String(env.EMAIL_EXPEDITEUR_NOM || 'Les Lanternes de Nour').replace(/[\r\n<>"]/g, '').trim();
  const reponse = String(env.EMAIL_REPONSE || '').trim();
  if (!ADRESSE.test(adresse) || !nom || (reponse && !ADRESSE.test(reponse))) return null;

  return {
    fournisseur: f,
    async envoyer({ a, objet, texte, html }) {
      // Protection avant tout appel : un seul destinataire valide, objet sur une ligne, texte et HTML présents (aucune injection d'en-têtes).
      if (typeof a !== 'string' || !ADRESSE.test(a) || typeof objet !== 'string' || !objet || /[\r\n]/.test(objet) || !texte || !html) throw new Error('courriel-invalide');
      const demande = f === 'resend'
        ? { url: 'https://api.resend.com/emails', entetes: { Authorization: 'Bearer ' + cle }, corps: { from: `${nom} <${adresse}>`, to: [a], subject: objet, html, text: texte, ...(reponse ? { reply_to: reponse } : {}) } }
        : { url: 'https://api.brevo.com/v3/smtp/email', entetes: { 'api-key': cle, accept: 'application/json' }, corps: { sender: { name: nom, email: adresse }, to: [{ email: a }], subject: objet, htmlContent: html, textContent: texte, ...(reponse ? { replyTo: { email: reponse } } : {}) } };
      const ctrl = new AbortController(), minuteur = setTimeout(() => ctrl.abort(), delaiMs);
      let r;
      try { r = await fetcher(demande.url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...demande.entetes }, body: JSON.stringify(demande.corps), signal: ctrl.signal }); }
      catch (e) { throw new Error('courriel-injoignable'); }   // aucun détail : le message d'origine pourrait contenir la clé
      finally { clearTimeout(minuteur); }
      if (!r.ok) throw new Error('courriel-refuse:' + r.status);   // jamais le corps de la réponse
      return { ok: true };
    }
  };
}