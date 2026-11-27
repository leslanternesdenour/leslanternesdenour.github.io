// Conseil IA : traduction d'une mission vers OpenAI et Gemini, et lecture de leurs réponses (aucun appel réel ici).
import test from 'node:test'; import assert from 'node:assert/strict';

const agents = () => import('../conseil-ia/lib/agents.mjs');
export const mission = { consigne: 'Tu audites.', texte: 'Vérifie la page.', images: [{ mime: 'image/png', base64: 'AAAA' }] };
export const rapport = { verdict: 'reserves', resume: 'Un défaut.', constats: [{ gravite: 'haute', categorie: 'securite', fichier: 'a.js', ligne: 3, constat: 'c', preuve: 'p', recommandation: 'r', confiance: 'haute' }], non_verifie: [] };

test('GPT : la requête part sur l\'API Responses, sans outil ni stockage, avec un format de réponse imposé', async () => {
  const { FOURNISSEURS } = await agents();
  const { url, init } = FOURNISSEURS.gpt.requete({ modele: 'gpt-x', jetonsSortieMax: 999, effort: 'medium' }, 'CLE', mission);
  assert.equal(url, 'https://api.openai.com/v1/responses'); assert.equal(init.method, 'POST'); assert.equal(init.headers.authorization, 'Bearer CLE');
  const c = JSON.parse(init.body);
  assert.deepEqual([c.model, c.max_output_tokens, c.reasoning, c.store, c.tools], ['gpt-x', 999, { effort: 'medium' }, false, undefined]);
  assert.deepEqual(c.input, [{ role: 'system', content: 'Tu audites.' }, { role: 'user', content: [{ type: 'input_text', text: 'Vérifie la page.' }, { type: 'input_image', image_url: 'data:image/png;base64,AAAA', detail: 'auto' }] }]);
  assert.equal(c.text.format.type, 'json_schema'); assert.equal(c.text.format.strict, true);
  assert.deepEqual(c.text.format.schema.required, ['verdict', 'resume', 'constats', 'non_verifie']);
});

test('GPT : la réponse est lue (rapport et jetons) ; une réponse tronquée, refusée ou illisible est signalée', async () => {
  const { FOURNISSEURS } = await agents(); const lire = FOURNISSEURS.gpt.lire;
  const usage = { input_tokens: 100, output_tokens: 40, output_tokens_details: { reasoning_tokens: 10 } };
  const message = partie => ({ status: 'completed', usage, output: [{ type: 'reasoning' }, { type: 'message', content: [partie] }] });
  assert.deepEqual(lire(message({ type: 'output_text', text: JSON.stringify(rapport) })), { statut: 'ok', rapport, texte: JSON.stringify(rapport), detail: '', jetons: { entree: 100, sortie: 40 } });
  const tronque = lire({ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, usage, output: [] });
  assert.equal(tronque.statut, 'incomplet'); assert.match(tronque.detail, /max_output_tokens/);
  const refus = lire(message({ type: 'refusal', refusal: 'Non.' })); assert.equal(refus.statut, 'refus'); assert.equal(refus.detail, 'Non.');
  for (const t of ['pas du JSON', '{"verdict":"ok"}']) { const r = lire(message({ type: 'output_text', text: t })); assert.equal(r.statut, 'illisible', t); assert.equal(r.texte, t); assert.equal(r.rapport, null); }
});

test('Gemini : la requête part sur generateContent, sans outil, avec images et format de réponse imposé', async () => {
  const { FOURNISSEURS, SCHEMA } = await agents();
  const { url, init } = FOURNISSEURS.gemini.requete({ modele: 'gemini-x', jetonsSortieMax: 999, effort: 'medium' }, 'CLE', mission);
  assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-x:generateContent');
  assert.equal(init.headers['x-goog-api-key'], 'CLE'); assert.ok(!url.includes('CLE'));
  assert.deepEqual(JSON.parse(init.body), {
    systemInstruction: { parts: [{ text: 'Tu audites.' }] },
    contents: [{ role: 'user', parts: [{ text: 'Vérifie la page.' }, { inlineData: { mimeType: 'image/png', data: 'AAAA' } }] }],
    generationConfig: { maxOutputTokens: 999, responseMimeType: 'application/json', responseJsonSchema: SCHEMA, thinkingConfig: { thinkingLevel: 'MEDIUM' } },
  });
});

test('Gemini : la réponse est lue (réflexion comptée en sortie) ; une réponse tronquée ou bloquée est signalée', async () => {
  const { FOURNISSEURS } = await agents(); const lire = FOURNISSEURS.gemini.lire;
  const usageMetadata = { promptTokenCount: 100, candidatesTokenCount: 30, thoughtsTokenCount: 10 };
  const candidat = (finishReason, parts) => ({ usageMetadata, candidates: [{ finishReason, content: { parts } }] });
  const t = JSON.stringify(rapport);
  assert.deepEqual(lire(candidat('STOP', [{ text: 'réflexion', thought: true }, { text: t }])), { statut: 'ok', rapport, texte: t, detail: '', jetons: { entree: 100, sortie: 40 } });
  const tronque = lire(candidat('MAX_TOKENS', [])); assert.equal(tronque.statut, 'incomplet'); assert.match(tronque.detail, /MAX_TOKENS/);
  const filtre = lire(candidat('SAFETY', [])); assert.equal(filtre.statut, 'refus'); assert.match(filtre.detail, /SAFETY/);
  const bloque = lire({ promptFeedback: { blockReason: 'PROHIBITED_CONTENT' } }); assert.equal(bloque.statut, 'refus'); assert.match(bloque.detail, /PROHIBITED_CONTENT/);
});
