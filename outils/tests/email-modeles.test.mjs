// Modèles d'e-mails des Lanternes de Nour : français, présentation professionnelle, lien unique, version texte, contenu échappé.
import test from 'node:test'; import assert from 'node:assert/strict';
import { modeles, echapper } from '../../serveur/email-modeles.js';

const LIEN = 'https://leslanternesdenour.fr/compte/action/?mode=verifyEmail&oobCode=abc&lang=fr';

test('modèle de vérification : objet en français, lien présent dans le HTML et dans la version texte', () => {
  const m = modeles.verification({ lien: LIEN });
  assert.match(m.objet, /Vérifiez votre adresse e-mail/);
  assert.ok(m.texte.includes(LIEN));
  assert.ok(m.html.includes('mode=verifyEmail&amp;oobCode=abc&amp;lang=fr'), 'le lien est échappé dans le HTML');
});

test('chaque modèle a un objet, un texte et un HTML complets, en français, sans valeur manquante ni code visible', () => {
  const tous = [modeles.verification({ lien: LIEN }), modeles.confirmationVerification({ lienJeu: 'https://leslanternesdenour.fr/compte/' }), modeles.reinitialisation({ lien: LIEN }),
    modeles.changementAdresse({ nouvelleAdresse: 'nouveau@exemple.fr' }), modeles.motDePasseModifie(), modeles.compteSupprime()];
  assert.equal(tous.length, 6);
  for (const m of tous) {
    assert.ok(m.objet && m.texte && m.html);
    assert.ok(!/[\r\n]/.test(m.objet), 'objet sur une seule ligne');
    for (const s of [m.objet, m.texte, m.html]) assert.ok(!/(undefined|null|\[object|\{\{|%[A-Z_]+%|NaN)/.test(s), 'aucune valeur manquante : ' + s.slice(0, 60));
    assert.match(m.html, /<html lang="fr"/); assert.ok(m.html.includes('Les Lanternes de Nour')); assert.ok(m.texte.includes('Les Lanternes de Nour'));
    assert.match(m.texte + m.html, /[éèàêç]/, 'accents français');
    assert.ok(m.html.length < 20000, 'taille raisonnable (pas tronquée par Gmail)');
  }
});

test('les messages à lien (vérification, réinitialisation) ont un bouton, expliquent la durée de validité et que le message peut être ignoré', () => {
  for (const m of [modeles.verification({ lien: LIEN }), modeles.reinitialisation({ lien: LIEN })]) {
    assert.match(m.html, /<a [^>]*href="[^"]+"[^>]*>[^<]+<\/a>/); assert.match(m.texte, /ignor/i); assert.match(m.texte + m.html, /valable|expire|heure/i);
    assert.equal((m.html.match(/mode=verifyEmail/g) || []).length === 0 ? 1 : (m.html.match(/oobCode=abc/g) || []).length >= 1, true);
  }
});

test('le contenu est échappé : un lien ou une adresse piégés ne peuvent pas injecter de HTML', () => {
  assert.equal(echapper('<b>"&\'</b>'), '&lt;b&gt;&quot;&amp;&#39;&lt;/b&gt;');
  const m = modeles.verification({ lien: 'https://exemple.fr/?a="><script>alert(1)</script>' });
  assert.ok(!m.html.includes('<script>'));
  const c = modeles.changementAdresse({ nouvelleAdresse: '"><img src=x onerror=alert(1)>@exemple.fr' });
  assert.ok(!c.html.includes('<img'));
});

test('présentation cohérente avec l\'identité : violet profond et or, aucune image distante, mise en page par tableaux compatible messageries', () => {
  const h = modeles.verification({ lien: LIEN }).html;
  assert.match(h, /#2a2166|#191345/i); assert.match(h, /#f5b942|#ffd24a/i);
  assert.ok(!/<img /i.test(h), 'aucun pixel ni image distante (meilleure délivrabilité)');
  assert.match(h, /<table /); assert.ok(!/<script|<link |<style[^>]*src/i.test(h));
});

test('les messages de sécurité n\'ont aucun lien d\'action et invitent à écrire à l\'adresse de contact en cas de doute', () => {
  for (const m of [modeles.motDePasseModifie(), modeles.changementAdresse({ nouvelleAdresse: 'nouveau@exemple.fr' }), modeles.compteSupprime()]) {
    assert.ok(!/oobCode/.test(m.html + m.texte)); assert.ok(m.texte.includes('bonjour@leslanternesdenour.fr'));
  }
});