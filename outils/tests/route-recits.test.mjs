// Les récits (آثار الأنبياء) : structure des fiches pédagogiques. Tout est « À VALIDER » ; chaque phrase est rattachée à son origine ; aucune représentation de prophète.
import test from 'node:test'; import assert from 'node:assert/strict';

test('fiches : structure complète, statut À VALIDER, chaque énoncé classé par origine avec ses références', async () => {
  const { RECITS, ORIGINES, STATUT } = await import('../../voyage/js/route/recits-a-valider.js');
  assert.equal(STATUT, 'À VALIDER');
  assert.deepEqual(Object.keys(ORIGINES), ['coran', 'hadith', 'tradition', 'discute', 'illustration']);
  assert.ok(RECITS.length >= 6);
  for (const r of RECITS) {
    for (const k of ['id', 'titre', 'lieu', 'periode']) assert.ok(r[k], `${r.id} : ${k} manquant`);
    assert.equal(r.statut, STATUT, `${r.id} ne peut pas être validée sans vérification humaine`);
    assert.equal(r.validePar, undefined);
    assert.ok(r.enonces.length >= 3, `${r.id} : trop peu d'énoncés`);
    assert.ok(r.sources.length >= 1 && r.sources.every(s => s.id && s.type && s.verifie === false && (s.ref || /Référence à vérifier/.test(s.indication || ''))), `${r.id} : chaque source a une référence OU la mention « Référence à vérifier » (jamais une référence inventée), verifie:false`);
    const ids = new Set(r.sources.map(s => s.id));
    for (const e of r.enonces) {
      assert.ok(e.id && e.petit && e.grand, `${r.id}/${e.id} : textes manquants`);
      assert.ok(ORIGINES[e.origine], `${r.id}/${e.id} : origine inconnue ${e.origine}`);
      if (e.origine === 'illustration') assert.deepEqual(e.refs, [], 'une illustration du jeu n\'a pas de référence');
      else { assert.ok(e.refs.length >= 1, `${r.id}/${e.id} : référence manquante`); for (const ref of e.refs) assert.ok(ids.has(ref), `${r.id}/${e.id} : la référence ${ref} n'est pas dans les sources`); }
    }
  }
});

test('rigueur : aucun dialogue inventé, aucune parole attribuée, aucune date certaine, aucun arabe non validé, aucune représentation, l\'origine est nommée dans chaque phrase', async () => {
  const { RECITS } = await import('../../voyage/js/route/recits-a-valider.js');
  const marqueur = { coran: /Coran/, hadith: /hadith/i, tradition: /(tradition|récits? historiques?|histoire)/i, discute: /(discuté|incertain|pas connu|n'est pas détaillé|ne sait pas)/i, illustration: /(jeu|image|dessin)/i };
  for (const r of RECITS) {
    const tout = JSON.stringify(r);
    for (const x of r.enonces) for (const t of [x.petit, x.grand]) assert.ok(!/[«»"“”]/.test(t), `${r.id}/${x.id} : pas de guillemets (aucune parole rapportée ni citation reproduite de mémoire)`);
    assert.ok(!/[\u0600-\u06FF]/.test(tout), `${r.id} : pas d'arabe tant qu'il n'est pas validé`);
    assert.ok(!/(il|elle) (dit|répond|demande|crie|s'écrie|murmure|prie)\b/i.test(JSON.stringify(r.enonces)), `${r.id} : aucune parole attribuée à un personnage`);
    assert.ok(r.illustration.figure === false, `${r.id} : aucune figure humaine dans l'illustration`);
    for (const x of r.enonces) {
      for (const t of [x.petit, x.grand]) {
        assert.match(t, marqueur[x.origine], `${r.id}/${x.id} (${x.origine}) : l'origine doit être nommée dans la phrase : « ${t.slice(0, 50)}… »`);
        if (x.origine !== 'discute') assert.ok(!/\b(en|vers|depuis|dès|l'an|année)\s+\d{3,4}\b|\b\d{3,4}\s*(av|ap)\.?\s*J\.?-?C|\bJ\.-C\b/i.test(t), `${r.id}/${x.id} : pas de date présentée comme certaine`);
      }
      assert.ok(x.petit.length <= 130, `${r.id}/${x.id} : version 3–5 ans trop longue`);
      assert.ok(x.grand.length <= 330, `${r.id}/${x.id} : version 6–10 ans trop longue`);
    }
  }
});

test('progression : une histoire s\'ouvre, avance par étapes, se retrouve plus tard ; l\'ajout au carnet ne se fait qu\'une fois (pas de récompense en double)', async () => {
  const { ouvrirRecit, avancer, ajouterAuCarnet, etatRecit, recitsDuCarnet } = await import('../../voyage/js/route/recits-route.js');
  const route = { recits: {} };
  assert.equal(etatRecit(route, 'safa-marwa'), null, 'jamais ouverte : pas d\'état');
  const e = ouvrirRecit(route, 'safa-marwa'); assert.equal(e.etape, 0); assert.equal(e.carnet, false);
  avancer(route, 'safa-marwa', 2); assert.equal(etatRecit(route, 'safa-marwa').etape, 2, 'on la retrouve où on l\'avait laissée');
  avancer(route, 'safa-marwa', 1); assert.equal(etatRecit(route, 'safa-marwa').etape, 2, 'on ne recule pas');
  assert.deepEqual(recitsDuCarnet(route), [], 'pas encore dans le carnet');
  assert.equal(ajouterAuCarnet(route, 'safa-marwa'), true); assert.equal(ajouterAuCarnet(route, 'safa-marwa'), false, 'la récompense ne se donne qu\'une fois');
  assert.deepEqual(recitsDuCarnet(route), ['safa-marwa']);
  assert.equal(ouvrirRecit(route, 'safa-marwa').carnet, true, 'rouvrir ne perd rien');
  assert.throws(() => ouvrirRecit(route, 'histoire-inconnue'), /inconnue/);
});

test('questions : adaptées à l\'âge, une mauvaise réponse n\'est jamais une punition (on peut réessayer), la bonne réponse est conservée', async () => {
  const { questionsPour, repondre, etatRecit, ouvrirRecit } = await import('../../voyage/js/route/recits-route.js');
  const petits = questionsPour('hajar-ismail-zamzam', '3-5'), grands = questionsPour('hajar-ismail-zamzam', '6-10');
  assert.equal(petits.length, 1, 'les 3–5 ans : une question facile'); assert.equal(grands.length, 2, 'les 6–10 ans : plus de questions');
  assert.ok(petits[0].texte.length > 5 && petits[0].choix.length >= 2);
  const route = { recits: {} }; ouvrirRecit(route, 'hajar-ismail-zamzam');
  const faux = repondre(route, 'hajar-ismail-zamzam', 'q1', 1); assert.equal(faux.juste, false); assert.equal(faux.bonne, 0, 'on indique la bonne réponse avec douceur');
  assert.equal(etatRecit(route, 'hajar-ismail-zamzam').reponses.q1, undefined, 'une réponse fausse n\'est pas retenue : on peut réessayer');
  assert.equal(repondre(route, 'hajar-ismail-zamzam', 'q1', 0).juste, true);
  assert.equal(etatRecit(route, 'hajar-ismail-zamzam').reponses.q1, 0);
});

test('illustrations : une image symbolique pour chaque histoire (paysages, eau, pierres, tissu, tentes), jamais de personnage', async () => {
  const { RECITS } = await import('../../voyage/js/route/recits-a-valider.js');
  const { illustrationSvg, SCENES } = await import('../../voyage/js/route/recits-illustrations.js');
  const fs = await import('node:fs');
  for (const r of RECITS) { const svg = illustrationSvg(r.illustration.scene); assert.match(svg, /^<svg[^>]+aria-label="[^"]{10,}"/, `${r.id} : image sans description`); assert.ok(SCENES.includes(r.illustration.scene)); }
  assert.throws(() => illustrationSvg('une-personne'), /inconnue/);
  const code = fs.readFileSync(new URL('../../voyage/js/route/recits-illustrations.js', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/(visage|silhouette|personnage|bonhomme|tête|head|face|person|human)/i.test(code), 'aucune forme de personne dans les illustrations');
});

test('panneau : on peut toujours fermer et reprendre plus tard, chaque étape affiche l\'origine et la mention À VALIDER, aucun audio n\'est généré, aucun chronomètre', async () => {
  const fs = await import('node:fs');
  const u = fs.readFileSync(new URL('../../voyage/js/route/recit-ui.js', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  assert.match(u, /export function creerRecitUI\(/);
  assert.match(u, /aria-label="Fermer"/, 'une croix de fermeture toujours présente');
  assert.match(u, /À VALIDER/); assert.match(u, /ORIGINES/); assert.match(u, /certitude/);
  assert.match(u, /Référence à vérifier/);
  assert.ok(!/(new Audio|speechSynthesis|fetch\(|setInterval|Date\.now\(\) -)/.test(u), 'ni audio, ni réseau, ni chronomètre');
  assert.match(u, /Disponible après validation/, 'le bouton Écouter attend la validation humaine du texte');
});

test('monde : les histoires se découvrent dans les lieux (lanterne + bouton « Découvrir cette histoire »), pas dans un menu', async () => {
  const { LIEUX_ROUTE } = await import('../../voyage/js/route/donnees.js');
  const { recit } = await import('../../voyage/js/route/recits-a-valider.js');
  const fs = await import('node:fs');
  const avec = LIEUX_ROUTE.filter(l => l.recit);
  assert.deepEqual(avec.map(l => l.id).sort(), ['campement', 'cite-atelier', 'cite-marche', 'oasis'], 'les découvertes générales (eau, caravanes, potier, marché) sont placées dans les lieux qui existent');
  for (const l of avec) assert.ok(recit(l.recit), `${l.id} : histoire inconnue ${l.recit}`);
  const jeu = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8'), l3 = fs.readFileSync(new URL('../../voyage/js/route/lieux-3d.js', import.meta.url), 'utf8');
  assert.match(jeu, /Découvrir cette histoire/); assert.match(jeu, /creerRecitUI/); assert.match(jeu, /'recit:'/);
  assert.match(l3, /lanterne/i, 'une lanterne marque le lieu');
});

test('lieux de la cité : les quatre premières histoires sont placées dans leurs lieux, avec les noms et textes « À VALIDER » séparés des données neutres', async () => {
  const { LIEUX_SACRES } = await import('../../voyage/js/route/lieux-mecque-a-valider.js');
  const { LIEUX_ROUTE } = await import('../../voyage/js/route/donnees.js');
  const { recit } = await import('../../voyage/js/route/recits-a-valider.js');
  const ids = new Set(LIEUX_ROUTE.map(l => l.id)), places = new Set();
  for (const [id, s] of Object.entries(LIEUX_SACRES)) {
    assert.ok(ids.has(id), `${id} : lieu inexistant`); assert.equal(s.statut, 'À VALIDER'); assert.ok(s.nom && s.petit && s.grand, `${id} : nom ou textes manquants`);
    assert.ok(s.petit.length <= 130 && s.grand.length <= 360, `${id} : texte trop long`);
    assert.ok(!/[«»"“”]/.test(s.petit + s.grand), `${id} : aucune parole rapportée`);
    for (const r of s.recits || []) { assert.ok(recit(r), `${id} : histoire inconnue ${r}`); places.add(r); }
  }
  for (const r of ['hajar-ismail-zamzam', 'safa-marwa', 'communaute-mecque', 'fondations-kaaba', 'quraysh-reconstruction', 'redecouverte-zamzam', 'jabal-an-nour', 'jabal-thawr']) assert.ok(places.has(r), `${r} n'est placée dans aucun lieu du monde`);
  assert.ok(LIEUX_SACRES['montagne-nord-pied'].nom && LIEUX_SACRES['montagne-sud-pied'].nom, 'les deux montagnes ont leur nom');
});

test('aucune voix : dans la Route, aucun bouton « Écouter » ni synthèse vocale pour un texte non validé (dialogues et découvertes)', async () => {
  const fs = await import('node:fs');
  const main = fs.readFileSync(new URL('../../voyage/js/main.js', import.meta.url), 'utf8'), jeu = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  assert.match(main, /lecture-ecouter'\)\.classList\.toggle\('cache', !!p\.sansVoix && !aUneVoix/, 'le dialogue masque Écouter quand il n\'y a pas de voix Nour enregistrée');
  assert.match(main, /dec-ecouter'\); b\.classList\.toggle\('cache', !!d\.sansVoix && !aUneVoix/, 'la découverte masque Écouter quand il n\'y a pas de voix Nour enregistrée');
  assert.match(main, /if \(d\.sansVoix\) \{ if \(!direTextes/, 'une découverte sansVoix n\'utilise que les voix enregistrées, jamais la synthèse du navigateur');
  assert.match(jeu, /dialogue: p => ctx\.ui\.dialogue\(\{ sansVoix: true, auto: true, sousMuet: true, \.\.\.p \}\)/); assert.match(jeu, /decouvrir: d => ctx\.ui\.decouvrir\(\{ sansVoix: true, auto: true, \.\.\.d \}\)/);
});

test('voix de la Route : lecture automatique au bon moment avec les voix Nour enregistrées, réécoute possible, jamais de voix du navigateur, retours des activités parlés', async () => {
  const fs = await import('node:fs');
  const lire = f => fs.readFileSync(new URL('../../voyage/js/' + f, import.meta.url), 'utf8');
  const main = lire('main.js'), jeu = lire('route/jeu-route.js'), ui = lire('route/recit-ui.js'), voix = lire('voix.js');
  assert.match(voix, /export function aUneVoix\(/);
  assert.match(main, /lecture-ecouter'\)\.classList\.toggle\('cache', !!p\.sansVoix && !aUneVoix\(p\.texte\)\)/, 'le bouton Écouter (réécoute) n\'apparaît que s\'il y a une voix enregistrée');
  assert.match(main, /if \(p\.auto\) direTextes\(/, 'lecture automatique à l\'ouverture d\'un dialogue');
  assert.match(main, /if \(d\.sansVoix\) \{ if \(!direTextes\(/, 'découverte : voix enregistrée seulement, jamais de synthèse du navigateur');
  assert.match(main, /function bandeau\(petit, nom, silence\)/);
  assert.match(jeu, /sansVoix: true, auto: true/); assert.match(jeu, /ui\.dire\(/); assert.match(jeu, /voixRoute/);
  assert.match(ui, /FEEDBACK/); assert.match(ui, /dire\(\[\{ t: FEEDBACK\./);
});
