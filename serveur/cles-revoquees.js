// Clés de compte de service Firebase RÉVOQUÉES (exposées par erreur). Le site refuse de les utiliser, même si elles sont collées de nouveau dans Cloudflare.
// On ne garde que le début de l'identifiant de clé (« private_key_id ») : il identifie la clé mais ne permet aucun accès.
export const PREFIXES_REVOQUES = ['bfff0d72'];
export const estRevoquee = (compte) => !!compte && typeof compte.private_key_id === 'string' && PREFIXES_REVOQUES.some(p => compte.private_key_id.startsWith(p));
