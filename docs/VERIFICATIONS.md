# Vérifications V1.5 — 13 octobre 2026

Base : ZIP V1.4 fourni par l’utilisateur. Aucun déploiement distant effectué.

## Résultats

- 17 tests Node : codes, référentiel, reprise du nom, migration ancienne, contrôles des dimensions, import, CSV/GeoJSON, service transcription simulé, écriture/lecture EXIF, ZIP et intégrité CRC, restauration ciblée.
- Parcours Chromium à 390 × 844 : photos du cours d’eau avant ouvrages, ouvrage dédié, dimensions différentes, retour et résumé, titre actualisé.
- JPEG EXIF importé : coordonnées d’origine conservées, sans attribution automatique à l’ouvrage ou au cours d’eau.
- Refus GPS simulé : photo conservée sans position ; attribution explicite ultérieure testée, nouvelle version du média.
- Suppression/restauration d’ouvrage : identifiant et dimensions conservés, nouvelle observation du cours d’eau préservée.
- Dossier complet téléchargé puis restauré dans un profil navigateur vierge : fiches, deux médias et archives repris.
- Rechargement/modification hors connexion : saisie conservée ; absence de débordement horizontal.
- ZIP vérifié par Python zipfile ; fichiers médias présents ; XML des documents Word valide ; dimensions par ouverture incluses.
- Mise à jour réelle du service worker V1.4 → V1.5 sur la même origine et le même chemin : identifiants, codes, dimensions et enquêteur conservés.

- Accès direct au champ depuis un message de validation ; ajout de témoignage visible.
- Fiche entière supprimée, ZIP de corbeille seule puis restauration sur un navigateur vierge.

## Limites et test terrain

Le GPS, la capture et les refus d’autorisation ont été simulés. La caméra physique, les photos HEIC, la lecture sur Microsoft Word mobile et Safari iOS n’ont pas été testés. La transcription utilise le service existant, sans appel API réel dans ces vérifications.

Avant utilisation en mission : ouvrir en ligne sur chaque téléphone, prendre des photos réelles, relever le GPS, enregistrer un audio, essayer le mode avion, puis exporter et restaurer une localité d’essai. Pour de gros volumes, exporter localité par localité (dossier limité à 250 Mo).

Les anciens scripts browser.cjs, edge-browser.cjs, simplified-browser.cjs et structures-browser.cjs documentent des interfaces antérieures. Les scénarios V1.5 sont explicitement nommés v15-* et update-v14.cjs. Les données et captures d’essai ne sont pas incluses dans la livraison.
