# NOVEC Survey — version 1.0

Mise à jour du dépôt **Ahmyassine1996/NOVEC-Survey-App**, préparée depuis le commit `f853b6a` du 21 septembre 2026. Cette version se publie à la racine du même dépôt et garde la même adresse GitHub Pages.

## Mise à jour rapide

1. Dans l’ancienne application, exporter le JSON complet sur chaque appareil ayant des fiches.
2. Extraire le ZIP fourni.
3. Dans le dépôt GitHub existant, branche `main`, choisir **Add file → Upload files**.
4. Déposer **le contenu du dossier extrait**, avec `index.html` directement à la racine du dépôt. Ne pas déposer le ZIP comme seul fichier et ne pas ajouter de dossier parent.
5. Valider le commit. Les fichiers de même chemin sont remplacés, les nouveaux sont ajoutés.
6. Attendre que le déploiement Pages soit terminé dans **Actions**.
7. Fermer tous les onglets et fenêtres de l’application, puis la rouvrir avec Internet. Vérifier « v1.0 » dans Réglages.

Guide détaillé : [docs/MISE_A_JOUR_GITHUB.md](docs/MISE_A_JOUR_GITHUB.md).

## Fonctionnalités

- Référentiel embarqué de 175 entrées : province → recherche de localité, commune et document d’urbanisme affichés automatiquement.
- Acronymes province/localité, identifiant de référence et code permanent de chaque cours d’eau et ouvrage.
- Visites, cours d’eau, ouvrages et événements distincts ; formulaire à quatre étapes.
- Observations visibles, réponses « non observable », témoignages sourcés, dimensions adaptées au type d’ouvrage.
- Sauvegarde automatique en IndexedDB ; reprise après fermeture ; contrôle des modifications concurrentes.
- Photos JPEG redimensionnées, GPS avec précision ; saisie manuelle possible si le GPS ne répond pas.
- Notes vocales de trois minutes maximum, écoute, import audio, sauvegarde de fragments et récupération après interruption quand des fragments ont été écrits.
- Transcription différée via un service HTTPS configurable, texte brut conservé et validation humaine du texte corrigé.
- Sauvegarde JSON avec médias et archives ; import contrôlé et export Word DOCX ; ZIP CSV, GeoJSON WGS84 et médias.
- Cache de l’application pour le fonctionnement hors connexion après un premier chargement connecté.

## Codes permanents

Exemple de format :

`N2266-FAH-HAS001-CE-<suffixe UUID de 26 caractères>`

- `N2266` : mission choisie dans Réglages ; valeur initiale `ABHL175` à adapter au dossier.
- `FAH` : Fahs-Anjra.
- `HAS001` : acronyme de Hassana + numéro 001 de l’entrée du référentiel.
- `CE` : cours d’eau (oued ou chaâba) ; `OH` pour un ouvrage.
- Le suffixe encode un UUID complet de 128 bits en base 32. Aucun compteur commun ni connexion n’est requis pour créer les codes sur plusieurs appareils. La probabilité de collision UUID est négligeable ; les collisions détectées à l’import sont bloquées.

Les codes ne sont pas recalculés lorsqu’un nom est corrigé. Après création d’un cours d’eau, la mission et la localité de la visite sont verrouillées ; une erreur administrative peut être signalée dans le champ dédié. Le code identifie l’élément relevé, pas tout le cours d’eau au sens géographique : deux équipes peuvent relever le même oued séparément, ce qui demande un rapprochement au bureau. Les codes seuls ne détectent pas ce doublon géographique.

Acronymes des provinces : FAH Fahs-Anjra ; AHO Al Hoceima ; CHE Chefchaouen ; TET Tétouan ; LAR Larache ; OUE Ouezzane ; MDF Mdiq-Fnidq ; TAZ Taza ; DRI Driouch ; KEN Kenitra. Ce sont des codes internes de mission, pas des codes administratifs officiels.

Référentiel source : `Liste_175_localites_ABHL(1).xlsx`, feuille `175_localites`, fourni pour ce projet. Les libellés, communes manquantes, phases et entrées homonymes ont été conservés ; ne pas renuméroter les entrées existantes lors d’une future actualisation.

## Données anciennes

La base conserve son nom `novec-survey-db` et son magasin `localities`. La version de schéma IndexedDB passe de 1 à 2. Les fiches anciennes sont archivées puis enrichies, sans supprimer leurs champs historiques ni leurs photos. Une section de vérification les rend consultables ; les valeurs anciennes restent aussi dans les sauvegardes et le Word.

Les appréciations comme « érodabilité forte » ne deviennent pas automatiquement des constats d’érosion. Les fiches reprises sont mises en brouillon pour vérifier les nouveaux champs. Les dimensions anciennes restent dans l’historique : les transférer après contrôle de leur sens et de leur méthode de mesure.

L’import sait lire les tableaux JSON de v0.5 et les sauvegardes v1.0. Les conflits de fiches proposent de garder les versions locales ou de les remplacer avec archivage. L’import d’une sauvegarde complète restaure aussi les archives. Les codes et identifiants sont conservés.

## Audio et transcription

**L’enregistrement est opérationnel sans service distant.** Il nécessite un navigateur compatible, HTTPS et l’autorisation du microphone. Fermer l’application ou verrouiller le téléphone peut interrompre le microphone ; l’application demande le maintien de l’écran allumé quand le navigateur le permet et arrête l’enregistrement lors du passage en arrière-plan.

**La transcription nécessite la configuration et l’hébergement du service fourni dans `transcription-service/`.** Elle est désactivée par défaut. Aucune clé API n’est intégrée dans les fichiers publics. Voir [le guide audio](docs/AUDIO_ET_TRANSCRIPTION.md). Le code d’accès du service n’est conservé qu’en mémoire pour la session ; les clés du fournisseur restent sur le serveur. Il n’y a pas de transcription locale embarquée ni de synchronisation centrale des enquêtes.

## Exécution locale et tests

L’application publiée ne demande ni installation npm ni compilation. Pour un test local :

```bash
python -m http.server 8000
```

Ouvrir `http://localhost:8000`. L’ouverture directe du fichier HTML par double-clic ne fournit pas le contexte nécessaire au cache, au microphone et au chargement du référentiel.

Tests de logique et de service (Node 22+) : `npm test`. Aucun appel API payant n’est effectué par les tests. Le scénario `tests/browser.cjs` utilise Playwright et Chromium ; il accepte `TEST_URL`, `TEST_OUTPUT` et `CHROME_BINARY`. Playwright est un outil de développement, pas une dépendance de l’application livrée.

Résultats et limites : [docs/VERIFICATIONS.md](docs/VERIFICATIONS.md).
