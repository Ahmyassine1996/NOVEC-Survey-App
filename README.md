# NOVEC Survey V1.4 — saisie terrain simplifiée

Une application PWA d’enquêtes hydrauliques, mobile et hors connexion après première ouverture HTTPS.

## Principaux changements

- Une fiche par localité, un nombre illimité de cours d’eau et d’ouvrages. Le premier GPS d’une photo peut préremplir celui de l’élément correspondant s’il est encore vide.
- Saisie en 3 étapes ; province conservée d’une visite à l’autre ; localité recherchée dans 175 références ; date/enquêteur/code mission préremplis.
- Ajout rapide d’un cours d’eau (Oued/Chaâba/Autre) et d’un ouvrage (Pont/Dalot/Buse/Radier/Autre) ; champs de dimensions conditionnels ; parties techniques facultatives repliées.
- Enquêtes : boutons Modifier, Word, Supprimer avec confirmation. Archivage récupérable par défaut.
- Exports : **Word pour une localité** ou **ZIP complet pour une/des localités**. Un dossier par localité contient Word, CSV, GeoJSON, JPG et éventuels audios.
- Paramètres : préférences d’archivage, restauration des archives et sauvegardes JSON.
- Conservation du mode hors connexion, des médias et du GPS EXIF.

## Mise à jour

Consulter `GUIDE_MISE_A_JOUR.txt`. **Toujours télécharger une sauvegarde JSON complète avant la mise à jour.**

## Limites

Données toujours conservées **sur l'appareil**. La synchronisation OneDrive n'est pas encore disponible. Les archives ne constituent pas une sauvegarde externe. Un ZIP volumineux avec beaucoup de photos peut être long à préparer sur téléphone ; exporter chaque localité séparément si besoin.

## Vérification

`npm test` : tests automatiques Node (utilisés pour le développement). Les essais réels de caméra et GPS nécessitent Chrome Android en HTTPS.
