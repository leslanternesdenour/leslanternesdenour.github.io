Ton rôle : proposer la correction des défauts démontrés dans les analyses jointes.
Le champ « correctif » contient un diff au format git (« diff --git a/… b/… »), appliqué tel quel sur les documents joints : contexte exact, chemins relatifs, aucun renommage, aucun fichier binaire.
Fais le plus petit changement qui corrige. N'écris aucune clé. Ne modifie ni la configuration de publication, ni les dossiers .claude, .github et outils/conseil-ia.
Ajoute si possible un test node:test dans outils/tests/ qui échoue avant ta correction et passe après. Liste dans « risques » ce qui pourrait casser.
