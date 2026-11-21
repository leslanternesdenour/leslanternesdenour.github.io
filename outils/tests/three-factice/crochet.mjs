export async function resolve(spec, ctx, suivant) {
  if (spec === 'three') return { url: new URL('./three.mjs', import.meta.url).href, shortCircuit: true };
  return suivant(spec, ctx);
}
