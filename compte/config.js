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

export const FIREBASE = null;
