// Page /soutenir/ : affiche le formulaire de don UNIQUEMENT si le serveur est configuré pour recevoir des dons (voir don.js).
// Sinon, ou si quoi que ce soit échoue : message « bientôt disponible » et aucun formulaire — comme avant l'ouverture du don en ligne.
import('./don.js?v=1').then(m => m.demarrerDon()).catch(() => { document.getElementById('msg-bientot').hidden = false; });
