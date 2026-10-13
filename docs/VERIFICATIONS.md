# Vérifications V1.6 — 13 octobre 2026

Base : V1.5 livrée, mise à jour ciblée. Aucun déploiement distant effectué.

## Résultats de cette livraison

- 17 tests Node existants : tous réussis.
- Parcours V1.6 sous Chromium à 390 × 844 : filtres, recherche, reprise de la dernière visite, menus d’actions, annulation après mise à la corbeille.
- Refus de confirmation de suppression définitive : élément conservé.
- Suppression définitive individuelle : fiches actives identiques, médias inutilisés retirés, médias partagés et anciennes versions préservés, fragments audio correspondants retirés.
- Vidage de plusieurs éléments : éléments restaurés et anciennes versions conservés ; corbeille toujours vide après rechargement.
- Export ZIP réel après nettoyage : fichier téléchargé, intégrité ZIP et présence des données de restauration vérifiées. L’indicateur de sauvegarde reste à jour pendant une navigation sans saisie, et change après modification d’une fiche.
- Protection du stockage (réponses navigateur simulées) : activation en cours, refus persistant à l’écran et après changement de page, autorisation, déjà activée, fonction absente.
- Rechargement hors connexion : fiche conservée et utilisable. Aucun débordement horizontal à 390 pixels ; accueil inspecté à 390 et 1280 pixels.
- Scénario de régression V1.5 exécuté sur V1.6 : photos avant ouvrages, dimensions différentes, EXIF source, refus GPS, correction GPS, restauration ciblée, ZIP restauré avec médias/archives dans un profil vierge, saisie hors connexion.
- Mise à jour réelle du cache V1.5 → V1.6 sur la même origine et le même chemin : identifiants, codes, dimensions et enquêteur conservés.

## Limites

Les tests ne remplacent pas un essai avec caméra et GPS physiques sur les téléphones de mission. Safari iOS, les fichiers HEIC, Word mobile et le service réel de transcription n’ont pas été retestés. Une autorisation de stockage persistant dépend du navigateur ; elle ne garantit pas une sauvegarde externe.

Les fichiers de test et captures ne sont pas inclus comme données terrain. Les scripts de vérification sont fournis ; Playwright est nécessaire uniquement pour les lancer, jamais pour l’application déployée.

---

## Historique : vérifications V1.5 — 13 octobre 2026

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
