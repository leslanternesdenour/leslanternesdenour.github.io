// Modèles d'e-mails des Lanternes de Nour (français). Fonctions pures : aucun accès réseau, aucune clé.
// Présentation : tableaux et styles en ligne (compatibles avec toutes les messageries), violet profond et or comme le site,
// aucune image ni pixel distant (meilleure délivrabilité), version texte toujours fournie. Tout contenu variable est échappé.
export const MARQUE = { nom: 'Les Lanternes de Nour', site: 'https://leslanternesdenour.fr', contact: 'bonjour@leslanternesdenour.fr' };

export function echapper(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function gabarit({ preambule, titre, paragraphes, bouton, note }) {
  const p = t => `<p style="margin:0 0 16px;font:16px/1.6 Arial,Helvetica,sans-serif;color:#e4dcff">${echapper(t)}</p>`;
  const b = bouton ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px auto"><tr><td style="background:#f5b942;border-radius:14px"><a href="${echapper(bouton.url)}" style="display:inline-block;padding:15px 28px;font:bold 17px Arial,Helvetica,sans-serif;color:#2a1d00;text-decoration:none">${echapper(bouton.texte)}</a></td></tr></table>` : '';
  const lienBrut = bouton ? `<p style="margin:0 0 16px;font:13px/1.5 Arial,Helvetica,sans-serif;color:#c9bfe8;word-break:break-all">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href="${echapper(bouton.url)}" style="color:#ffd24a">${echapper(bouton.url)}</a></p>` : '';
  const n = note ? `<p style="margin:16px 0 0;font:14px/1.6 Arial,Helvetica,sans-serif;color:#c9bfe8">${echapper(note)}</p>` : '';
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${echapper(titre)}</title></head>` +
    `<body style="margin:0;padding:0;background:#191345"><span style="display:none;max-height:0;overflow:hidden;opacity:0;color:#191345">${echapper(preambule)}</span>` +
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#191345"><tr><td align="center" style="padding:28px 14px">` +
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#2a2166;border:2px solid #f5b942;border-radius:22px"><tr><td style="padding:30px 28px">` +
    `<p style="margin:0 0 6px;text-align:center;font:bold 14px Arial,Helvetica,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#ffd24a">${echapper(MARQUE.nom)}</p>` +
    `<h1 style="margin:0 0 20px;text-align:center;font:bold 26px/1.25 Arial,Helvetica,sans-serif;color:#ffffff">${echapper(titre)}</h1>` +
    paragraphes.map(p).join('') + b + lienBrut + n +
    `</td></tr></table>` +
    `<p style="max-width:520px;margin:18px auto 0;text-align:center;font:12px/1.6 Arial,Helvetica,sans-serif;color:#9d92c9">${echapper(MARQUE.nom)} · <a href="${MARQUE.site}" style="color:#c9bfe8">leslanternesdenour.fr</a><br>Une question ? Écrivez-nous : <a href="mailto:${MARQUE.contact}" style="color:#c9bfe8">${MARQUE.contact}</a></p>` +
    `</td></tr></table></body></html>`;
}

function texteBrut({ titre, paragraphes, bouton, note }) {
  return [titre, '', ...paragraphes.flatMap(p => [p, '']), ...(bouton ? [bouton.texte + ' :', bouton.url, ''] : []), ...(note ? [note, ''] : []),
    '— ' + MARQUE.nom, MARQUE.site, 'Une question ? ' + MARQUE.contact].join('\n');
}

const fabriquer = (objet, d) => ({ objet, texte: texteBrut(d), html: gabarit(d) });
const VALIDITE = 'Ce lien est personnel, à usage unique et valable pour une durée limitée. S\'il a expiré, demandez-en un nouveau depuis l\'Espace famille.';

export const modeles = {
  verification({ lien }) {
    return fabriquer('Vérifiez votre adresse e-mail pour Les Lanternes de Nour', {
      preambule: 'Un dernier geste pour ouvrir le village de Nour à vos enfants.', titre: 'Vérifiez votre adresse e-mail',
      paragraphes: ['Bonjour,', 'Merci d\'avoir créé un compte parent sur Les Lanternes de Nour. Pour protéger les enfants, le jeu s\'ouvre dès que votre adresse e-mail est vérifiée.', 'Touchez le bouton ci-dessous, puis revenez sur la page « Espace famille » : elle se met à jour toute seule et ouvre le jeu.', VALIDITE],
      bouton: { texte: 'Vérifier mon adresse e-mail', url: lien }, note: 'Si vous n\'êtes pas à l\'origine de cette demande, ignorez simplement ce message : rien ne sera activé.' });
  },
  confirmationVerification({ lienJeu }) {
    return fabriquer('Votre adresse e-mail est vérifiée : le village de Nour vous attend', {
      preambule: 'Votre compte parent est prêt.', titre: 'Adresse vérifiée, merci !',
      paragraphes: ['Bonjour,', 'Votre adresse e-mail est maintenant vérifiée. Vous pouvez créer les profils de vos enfants (jusqu\'à quatre) et ouvrir le village de Nour.'],
      bouton: { texte: 'Ouvrir l\'Espace famille', url: lienJeu }, note: 'Si vous n\'êtes pas à l\'origine de cette vérification, écrivez-nous à ' + MARQUE.contact + '.' });
  },
  reinitialisation({ lien }) {
    return fabriquer('Réinitialisez votre mot de passe — Les Lanternes de Nour', {
      preambule: 'Choisissez un nouveau mot de passe pour votre compte parent.', titre: 'Choisissez un nouveau mot de passe',
      paragraphes: ['Bonjour,', 'Vous avez demandé à réinitialiser le mot de passe de votre compte parent Les Lanternes de Nour. Touchez le bouton ci-dessous pour en choisir un nouveau.', VALIDITE],
      bouton: { texte: 'Choisir un nouveau mot de passe', url: lien }, note: 'Si vous n\'êtes pas à l\'origine de cette demande, ignorez simplement ce message : votre mot de passe ne changera pas.' });
  },
  changementAdresse({ nouvelleAdresse }) {
    return fabriquer('Votre adresse e-mail a été modifiée — Les Lanternes de Nour', {
      preambule: 'Information de sécurité sur votre compte parent.', titre: 'Votre adresse e-mail a changé',
      paragraphes: ['Bonjour,', 'L\'adresse e-mail de votre compte parent a été remplacée par : ' + nouvelleAdresse + '.', 'Si vous êtes à l\'origine de ce changement, vous n\'avez rien à faire.'],
      note: 'Si vous n\'êtes pas à l\'origine de ce changement, écrivez-nous sans attendre à ' + MARQUE.contact + '.' });
  },
  motDePasseModifie() {
    return fabriquer('Votre mot de passe a été modifié — Les Lanternes de Nour', {
      preambule: 'Information de sécurité sur votre compte parent.', titre: 'Votre mot de passe a été modifié',
      paragraphes: ['Bonjour,', 'Le mot de passe de votre compte parent vient d\'être modifié. Si vous êtes à l\'origine de ce changement, vous n\'avez rien à faire.'],
      note: 'Si vous n\'êtes pas à l\'origine de ce changement, écrivez-nous sans attendre à ' + MARQUE.contact + '.' });
  },
  compteSupprime() {
    return fabriquer('Votre compte a été supprimé — Les Lanternes de Nour', {
      preambule: 'Confirmation de la suppression de votre compte parent.', titre: 'Votre compte a été supprimé',
      paragraphes: ['Bonjour,', 'Votre compte parent, les profils de vos enfants et leur progression ont été supprimés définitivement, comme vous l\'avez demandé.', 'Merci d\'avoir fait un bout de chemin avec nous.'],
      note: 'Si vous n\'êtes pas à l\'origine de cette suppression, écrivez-nous à ' + MARQUE.contact + '.' });
  }
};