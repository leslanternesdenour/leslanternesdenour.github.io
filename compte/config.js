// Configuration des comptes familiaux (Firebase, offre gratuite « Spark », sans carte bancaire).
// Tant que FIREBASE vaut null, les comptes restent désactivés : aucun formulaire n'est affiché
// et la progression reste sur l'appareil, comme aujourd'hui.
//
// Pour activer : créer le projet Firebase (voir le guide donné par Claude), puis remplacer null
// par l'objet « firebaseConfig » que la console Firebase affiche, par exemple :
//
// export const FIREBASE = {
//   apiKey: "AIza…",
//   authDomain: "lanternes-de-nour.firebaseapp.com",
//   projectId: "lanternes-de-nour",
//   appId: "1:…:web:…"
// };
//
// Ces valeurs sont publiques par nature : la sécurité vient des règles Firestore.

// Configuration web Firebase (valeurs PUBLIQUES). Volontairement limitée aux quatre valeurs nécessaires à la connexion :
// pas de measurementId ni de Google Analytics (aucun traceur sur un site pour enfants), pas de stockage ni de messagerie.
export const FIREBASE = {
  apiKey: "AIzaSyBZhdUrfsm_Z7Z8tW6ReY8hRah_ApbUZiU",
  authDomain: "lanternes-de-nour.firebaseapp.com",
  projectId: "lanternes-de-nour",
  appId: "1:447068927790:web:1d322106da355d784cecbf"
};

// Émulateur LOCAL (outils/emulateur) : toujours false dans le dépôt. Le serveur local de test remplace ce fichier
// à la volée quand LDN_EMULATEUR=1 ; la version publiée ne peut donc jamais l'activer.
export const EMULATEUR = false;
