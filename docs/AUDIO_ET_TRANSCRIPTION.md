# Notes vocales et transcription

## Ce qui fonctionne dès publication

- Enregistrer une note de 3 minutes maximum, reliée à la visite, au cours d’eau, à un ouvrage ou à une crue.
- Écouter, télécharger ou joindre un audio enregistré avec le téléphone.
- Conserver le son dans IndexedDB et l’inclure dans la sauvegarde JSON / l’export des médias.
- Recueillir la position au moment du début de l’enregistrement si le GPS est disponible.
- Sauvegarder régulièrement les fragments audio pour tenter une récupération après interruption. Le navigateur peut suspendre le microphone ou l’écriture en arrière-plan : tester sur les téléphones réels, et réécouter tout audio marqué interrompu.

## Service de transcription facultatif

GitHub Pages sert du HTML/CSS/JavaScript ; il n’exécute pas le service Node fourni. Ce service peut être hébergé sur l’infrastructure HTTPS de NOVEC ou sur un hébergement Node/Docker, en gardant son code dans **le même dépôt GitHub**. Aucun second dépôt GitHub n’est nécessaire.

Dossier : `transcription-service/`. Node 22 ou supérieur, sans dépendance npm.

Variables serveur :

| Variable | Valeur |
|---|---|
| `OPENAI_API_KEY` | Clé du compte API de l’organisation, uniquement sur le serveur. |
| `TRANSCRIPTION_ACCESS_TOKEN` | Secret aléatoire de 32 caractères minimum, remis aux utilisateurs autorisés. |
| `ALLOWED_ORIGIN` | `https://ahmyassine1996.github.io` sans chemin ni barre finale. |
| `TRANSCRIPTION_MODEL` | `gpt-4o-mini-transcribe` par défaut, configurable. |
| `MAX_REQUESTS_PER_HOUR` | 120 par processus par défaut. |
| `PORT` | Port du serveur, 8080 par défaut. |

Démarrage, après définition des variables dans l’environnement du serveur :

```bash
node transcription-service/server.mjs
```

Ou construire le Dockerfile du dossier. L’hébergement doit fournir HTTPS, autoriser une requête d’environ 25 Mo et un délai de 130 secondes. Ne jamais mettre les valeurs secrètes dans `env.example`, dans un commit, dans le JavaScript de l’app ni dans le ZIP.

Le service accepte `POST /transcribe`, multipart `file` et `language` facultatif (`fr` ou `ar`). Sans langue, le fournisseur détecte la langue. Il retourne `{ "text": "..." }`. Le service ne stocke pas les audios et ne journalise pas leurs contenus ; le fournisseur distant reçoit l’audio. Les conditions de conservation du fournisseur et les accès de l’organisation sont à fixer avant usage opérationnel.

Dans **Réglages** de NOVEC Survey :

1. Renseigner `https://votre-service/transcribe`.
2. Renseigner le **code d’accès du service**, pas la clé API OpenAI. Le code n’est gardé que pendant la session ; le ressaisir après fermeture/rechargement.
3. Enregistrer les réglages.
4. Ouvrir une note vocale puis cliquer **Transcrire**, ou activer l’option automatique pour les audios en attente lorsque l’application est ouverte et connectée.
5. Réécouter, corriger les noms, unités et chiffres, puis **Valider le texte**. Le texte original reste consultable. Aucune case technique n’est remplie automatiquement.

Les appels API dépendent d’un compte API actif et de sa facturation, distincts de l’hébergement GitHub Pages et de l’abonnement ChatGPT. Aucun appel API réel ni hébergement de service n’a été activé par cette livraison.

## Limites à connaître

- Aucune promesse de reconnaissance parfaite de la darija, des mélanges de langues, des toponymes et des chiffres.
- Pour un mélange darija/français, essayer « Détection automatique / mélange » et comparer avec les deux langues explicites sur des exemples de terrain.
- Le service fourni accepte MP3, MP4/M4A, MPEG/MPGA, WAV et WebM, jusqu’à 24 Mo. Un OGG joint reste écoutable/exportable, mais doit être converti dans un format accepté avant transcription par ce service.
- Il ne s’agit pas d’une transcription embarquée hors ligne. Sans réseau, l’audio reste en attente.
- La file automatique fonctionne quand l’application est ouverte ; aucune exécution garantie après fermeture ou verrouillage.
- Pas de reconnaissance du locuteur, pas de transcription de toute la journée et pas d’enregistrement caché.
- Le code d’accès est un mécanisme d’équipe simple, sans comptes individuels ni audit nominatif. Le serveur limite les requêtes et la concurrence par processus ; un déploiement organisationnel peut ajouter une authentification et une limite partagée entre instances.

## Sources

- MDN, MediaRecorder : https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- MDN, interruptions / délais des fragments : https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/dataavailable_event
- OpenAI, transcription de fichiers : https://developers.openai.com/api/docs/guides/speech-to-text
- GitHub Pages : https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
