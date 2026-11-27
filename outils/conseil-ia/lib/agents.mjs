// Les deux agents consultés. Ils reçoivent du texte et des images, rendent du texte : aucun outil ne leur est donné.
const texte = { type: 'string' };
const choix = (...valeurs) => ({ type: 'string', enum: valeurs });
const objet = proprietes => ({ type: 'object', properties: proprietes, required: Object.keys(proprietes), additionalProperties: false });

export const SCHEMA = objet({
  verdict: choix('ok', 'reserves', 'bloquant'),
  resume: texte,
  constats: { type: 'array', items: objet({
    gravite: choix('critique', 'haute', 'moyenne', 'basse', 'info'), categorie: texte, fichier: { type: ['string', 'null'] }, ligne: { type: ['integer', 'null'] },
    constat: texte, preuve: texte, recommandation: texte, confiance: choix('haute', 'moyenne', 'basse'),
  }) },
  non_verifie: { type: 'array', items: texte },
});

export const SCHEMA_ARBITRAGE = objet({
  points: { type: 'array', items: objet({ sujet: texte, decision: choix('A', 'B', 'les_deux', 'aucune', 'indecidable'), justification: texte, fichier: { type: ['string', 'null'] }, ligne: { type: ['integer', 'null'] }, preuve: texte }) },
  conclusion: texte,
});
export const SCHEMA_PROPOSITION = objet({ resume: texte, correctif: texte, tests_proposes: { type: 'array', items: texte }, risques: { type: 'array', items: texte } });

// Toutes les clés demandées sont présentes, et les listes sont bien des listes.
export const conforme = (valeur, schema) => !!valeur && typeof valeur === 'object' && schema.required.every(c => c in valeur && (schema.properties[c].type !== 'array' || Array.isArray(valeur[c])));

const json = (url, entetes, corps) => ({ url, init: { method: 'POST', headers: { 'content-type': 'application/json', ...entetes }, body: JSON.stringify(corps) } });

// Réponse commune aux deux fournisseurs. « ok » seulement si le rapport complet est exploitable.
function conclure({ texte, jetons, tronque, refus }, schema = SCHEMA) {
  let rapport = null;
  try { const r = JSON.parse(texte); if (conforme(r, schema)) rapport = r; } catch { /* signalé par le statut */ }
  const statut = refus ? 'refus' : tronque ? 'incomplet' : rapport ? 'ok' : 'illisible';
  return { statut, rapport, texte, detail: refus || tronque || '', jetons };
}

// Le modèle qui a réellement répondu, quand le fournisseur le dit.
const avecModele = (modeleReel, resultat) => modeleReel ? { ...resultat, modeleReel } : resultat;

export const FOURNISSEURS = {
  gemini: {
    requete: (reglage, cle, mission) => json(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(reglage.modele)}:generateContent`, { 'x-goog-api-key': cle }, {
      systemInstruction: { parts: [{ text: mission.consigne }] },
      contents: [{ role: 'user', parts: [{ text: mission.texte }, ...mission.images.map(i => ({ inlineData: { mimeType: i.mime, data: i.base64 } }))] }],
      generationConfig: { maxOutputTokens: reglage.jetonsSortieMax, responseMimeType: 'application/json', responseJsonSchema: mission.schema || SCHEMA, thinkingConfig: { thinkingLevel: reglage.effort.toUpperCase() } },
    }),
    lire(r, schema) {
      const c = r.candidates?.[0], fin = c?.finishReason, usage = r.usageMetadata;
      const bloque = r.promptFeedback?.blockReason || (!c && 'aucune réponse') || (fin && !['STOP', 'MAX_TOKENS'].includes(fin) && fin);
      return avecModele(r.modelVersion, conclure({
        texte: (c?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join(''),
        refus: bloque ? `réponse bloquée (${bloque})` : '',
        tronque: fin === 'MAX_TOKENS' ? 'réponse incomplète (MAX_TOKENS)' : '',
        jetons: { entree: usage?.promptTokenCount ?? null, sortie: usage ? (usage.candidatesTokenCount || 0) + (usage.thoughtsTokenCount || 0) : null },
      }, schema));
    },
  },
  gpt: {
    requete: (reglage, cle, mission) => json('https://api.openai.com/v1/responses', { authorization: `Bearer ${cle}` }, {
      model: reglage.modele,
      input: [
        { role: 'system', content: mission.consigne },
        { role: 'user', content: [{ type: 'input_text', text: mission.texte }, ...mission.images.map(i => ({ type: 'input_image', image_url: `data:${i.mime};base64,${i.base64}`, detail: 'auto' }))] },
      ],
      text: { format: { type: 'json_schema', name: 'rapport_audit', strict: true, schema: mission.schema || SCHEMA } },
      max_output_tokens: reglage.jetonsSortieMax,
      reasoning: { effort: reglage.effort },
      store: false,
    }),
    lire(r, schema) {
      const parties = (r.output || []).filter(o => o.type === 'message').flatMap(o => o.content || []);
      return avecModele(r.model, conclure({
        texte: parties.filter(p => p.type === 'output_text').map(p => p.text).join(''),
        refus: parties.find(p => p.type === 'refusal')?.refusal,
        tronque: r.status === 'completed' ? '' : `réponse incomplète (${r.incomplete_details?.reason || r.error?.message || r.status})`,
        jetons: { entree: r.usage?.input_tokens ?? null, sortie: r.usage?.output_tokens ?? null },
      }, schema));
    },
  },
};
