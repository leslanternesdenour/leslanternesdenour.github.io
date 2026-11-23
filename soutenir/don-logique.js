// Logique pure du formulaire de don (aucun accès au navigateur ni au réseau : testable sous Node).
export const MONTANT_MIN = 1, MONTANT_MAX = 500;
const REFUS = { ok: false, raison: 'montant-invalide' };

// Enchaînement du formulaire de don. Tout ce qui touche au navigateur (affichage, réseau, Stripe) est injecté : testable sans navigateur.
export function creerControleurDon({ chargerConfig, creerSession, monterPaiement, vue }) {
  let config = null, paiement = null, enCours = false;
  return {
    async revenir() {
      if (paiement) { paiement.destroy(); paiement = null; }
      vue.montrerFormulaire();
    },
    async demarrer() {
      try { config = await chargerConfig(); } catch (e) { vue.montrerBientot(); return; }
      vue.montrerFormulaire();
    },
    async valider(choix, libre) {
      const m = lireMontant(choix, libre);
      if (!m.ok) { vue.montrerErreur('Merci de choisir un montant entier entre ' + MONTANT_MIN + ' € et ' + MONTANT_MAX + ' €.'); return; }
      if (enCours || paiement) return;        // double clic : une seule session de paiement à la fois
      enCours = true;
      try {
        const clientSecret = await creerSession(m.montant);
        paiement = await monterPaiement({ cle: config.cle, clientSecret, onComplete: () => { if (paiement) { paiement.destroy(); paiement = null; } vue.montrerMerci(); } });
      } catch (e) {
        // Jamais le détail technique (il peut citer une clé) : un message simple, et le formulaire reste utilisable.
        vue.montrerErreur(e && e.code === 'trop-de-tentatives' ? 'Trop d\'essais en peu de temps. Merci de réessayer dans quelques minutes.' : 'Le paiement est momentanément indisponible. Merci de réessayer plus tard.');
        return;
      } finally { enCours = false; }
      vue.montrerPaiement();
    }
  };
}
// Le serveur revalide TOUJOURS le montant (serveur/don.js) : ceci ne sert qu'à guider la personne avant l'envoi.
export function lireMontant(choix, libre) {
  if (['5', '10', '20'].includes(choix)) return { ok: true, montant: Number(choix) };
  if (choix !== 'libre') return REFUS;
  const texte = String(libre).trim();
  if (!/^[0-9]{1,3}$/.test(texte)) return REFUS;
  const montant = Number(texte);
  return montant >= MONTANT_MIN && montant <= MONTANT_MAX ? { ok: true, montant } : REFUS;
}
