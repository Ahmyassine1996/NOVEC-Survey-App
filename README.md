# NOVEC Survey — version 1.3

Application de collecte terrain PWA, à déployer sur l’adresse **GitHub Pages existante**. Basée sur la v1.2 ; conserve les données, les 175 localités, les codes de cours d’eau, les ouvrages, les notes vocales, les sauvegardes, les exports Word/CSV/GeoJSON et la saisie hors connexion.

## Nouveautés 1.3

- Interface mobile plus lisible, présentation NOVEC modernisée (sans dépendance en ligne), étapes **Localité → Diagnostic → Terminer**.
- Photos mises en avant dans les fiches, notes vocales accessibles en rubrique facultative.
- Détails complémentaires des ouvrages repliables ; les dimensions dépendent toujours du type d’ouvrage.
- **GPS obligatoire pour chaque nouvelle photo**, acquis au moment de son ajout depuis le téléphone ; une précision supérieure à 25 m demande confirmation.
- **Coordonnées GPS et précision écrites dans l’EXIF du fichier JPEG** (GPSLatitude, GPSLongitude, GPSHPositioningError, heure/date GPS). Les JPEG exportés en ZIP ou téléchargés individuellement gardent cette information.
- Les photos anciennes de v1.2 restent consultables et leur GPS reste stocké dans la fiche ; elles ne sont pas automatiquement réécrites dans l’EXIF.
- Photos importées de la galerie : la position enregistrée est **celle du téléphone au moment de l’importation**, pas nécessairement celle de la prise de vue initiale ; un avertissement l’explique.
- Noms des JPEG fondés sur le code du cours d’eau/ouvrage + horodatage + identifiant court.

## Installation / mise à jour sur GitHub

1. **Avant la mise à jour, sur chaque appareil** : dans l’ancienne version, aller dans *Sauvegardes → Télécharger la sauvegarde*. Conserver le JSON sur un support privé.
2. Dans le dépôt GitHub existant, branche `main`, charger le contenu décompressé de ce ZIP en respectant les mêmes chemins (`index.html` directement à la racine et les dossiers `js/`, `data/`, `icons/`, `docs/`, `tests/`...).
3. Valider le commit. Attendre le déploiement GitHub Pages dans *Actions*.
4. Sur le téléphone, **ouvrir l’URL HTTPS habituelle** (ne pas ouvrir le HTML téléchargé en `content://`). Si l’ancienne app s’affiche, actualiser en ligne et accepter le bandeau de mise à jour. Fermer les autres onglets de NOVEC Survey, puis relancer.
5. Vérifier `v1.3` dans *Profil*, faire une fiche fictive, relever un GPS, prendre une photo, télécharger le JPEG, contrôler sa géolocalisation, enregistrer et exporter en Word.

> **Ne pas effacer les données de site du navigateur** pour résoudre un cache : cela supprimerait les fiches locales. Garder une sauvegarde JSON avant de modifier l’application.

## Utilisation en mission

**Une fiche = une localité**. Dans cette fiche : plusieurs cours d’eau, chacun pouvant contenir plusieurs ouvrages et photos. Le GPS et le réseau sont distincts : la localisation peut être obtenue sans Internet, dès lors que le téléphone fournit une position et que l’application a été chargée sous HTTPS.

La prise de photo ouvre la caméra du téléphone ; le retour dans NOVEC Survey déclenche une mesure GPS. Si l’utilisateur refuse l’autorisation ou si le GPS échoue, la nouvelle photo n’est pas enregistrée : réessayer en extérieur.

**Attention :** le GPS reflète la position du téléphone *à l’ajout de l’image*. Ce n’est pas une preuve métrologique de position précise, et les coordonnées ne peuvent pas être garanties à la fraction de seconde de l’obturation.

## Sécurité et stockage

- Toujours **PWA et IndexedDB sur le téléphone** : aucune synchronisation OneDrive / SharePoint ou base serveur n’est incluse.
- Le dépôt GitHub Pages est public : **ne jamais y publier de données réelles, identifiants, tokens ou photos de mission**. Les fiches privées sont conservées sur chaque appareil, pas dans le dépôt.
- Exporter régulièrement les sauvegardes JSON avec médias et conserver ces fichiers de manière privée et sécurisée. OneDrive NOVEC peut recevoir des exports manuels, mais n’est pas encore branché automatiquement.

## Tests

`npm test` sous Node.js 22+ pour les tests de logique et de format EXIF. Ce ZIP ne nécessite pas npm pour fonctionner une fois mis en ligne. Les tests unitaires et une lecture des tags EXIF par Pillow ont été réalisés ; **un test pratique caméra + autorisations GPS sur un Android réel reste nécessaire**.
