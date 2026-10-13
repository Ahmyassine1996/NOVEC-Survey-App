NOVEC SURVEY V1.7 — UN SEUL ZIP, MÊME APPLICATION, MÊME DÉPÔT

IMPORTANT : avant de mettre à jour, sur CHAQUE téléphone contenant des enquêtes, exporter un ZIP de sauvegarde complet depuis NOVEC Survey V1.6. Vérifier que le fichier est téléchargé et en conserver une copie sur un ordinateur / espace professionnel. Ne pas effacer les données du navigateur et ne pas désinstaller l'application pour effectuer cette mise à jour.

INSTALLATION SUR LE DÉPÔT EXISTANT
1. Décompresser NOVEC_Survey_V1.7.zip sur votre PC.
2. Ouvrir le dépôt GitHub existant : https://github.com/Ahmyassine1996/NOVEC-Survey-App (branche main).
3. Remplacer les fichiers existants par le CONTENU du dossier extrait : index.html, sw.js, styles.css, manifest.json, data/, js/, icons/, etc. Ils doivent se trouver directement à la racine du dépôt, pas dans un dossier NOVEC_Survey_V1.7.
   - GitHub.dev : déposer les fichiers, puis Source Control → Stage → Commit & Push.
   - GitHub Desktop : copier les fichiers dans la copie locale du dépôt, puis Commit to main → Push origin.
   - GitHub web : Add file → Upload files remplace les chemins identiques, mais les anciens fichiers n'existant plus dans ce ZIP ne sont pas supprimés automatiquement.
4. Attendre le déploiement GitHub Pages (Actions).
5. Avec Internet, ouvrir :
   https://ahmyassine1996.github.io/NOVEC-Survey-App/mise-a-jour.html
   puis cliquer « Installer la version 1.7 ».
6. Vérifier v1.7, les anciennes visites et leurs codes ; ne pas supprimer les données du site. Tester un cours d'eau, plusieurs ouvrages, photo GPS, mode avion, export Word/ZIP et reprise d'une visite.

Le ZIP de code doit être extrait AVANT d'être envoyé sur GitHub ; NE PAS uploader le seul fichier ZIP en espérant que GitHub Pages le décompresse.
Les ZIP d'enquêtes créés par l'application ne doivent JAMAIS être mis sur le dépôt GitHub public.

AVERTISSEMENT TESTS
Les tests automatisés Node.js de cette livraison (22) sont réussis. Le navigateur de test de l'environnement de développement bloque toute navigation, y compris vers localhost : le parcours complet sur Android, le GPS et la caméra physiques restent à valider sur vos appareils AVANT usage en production.

URL inchangée : https://ahmyassine1996.github.io/NOVEC-Survey-App/
