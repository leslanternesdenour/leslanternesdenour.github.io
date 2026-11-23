// Importé en TOUT PREMIER par main.js : les imports s'exécutent dans l'ordre, donc le bac à sable est en place avant que le jeu,
// la sauvegarde ou le compte ne lisent le stockage. Sans ?sandbox=1 (ou hors local/préproduction), il ne fait rien.
import { installerBacASable } from './bac-a-sable.js';
installerBacASable();
