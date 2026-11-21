// node --import ./outils/tests/three-factice/enregistrer.mjs … : « three » → l'imitation vide (tests de données seulement)
import { register } from 'node:module';
register(new URL('./crochet.mjs', import.meta.url));
