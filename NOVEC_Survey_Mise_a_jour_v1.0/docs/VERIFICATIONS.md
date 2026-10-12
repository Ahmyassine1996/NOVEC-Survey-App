# Vérifications de la livraison 1.0

Date : 12 octobre 2026. Base : dépôt public existant, commit `f853b6a`.

## Vérifications effectuées

| Contrôle | Résultat / portée |
|---|---|
| Référentiel | 175 entrées, codes de référence distincts, homonymes conservés. |
| Codes | Préfixe mission/province/localité, suffixe UUID complet, stabilité à la réouverture ; 5 000 générations distinctes dans le test. Cela ne constitue pas une preuve mathématique d’absence de toute collision UUID. |
| Migration v0.5 | Ancienne fiche et ouvrage repris ; ancien diagnostic préservé ; archive conservée ; code déterministe pour le même JSON ancien. |
| Mise à jour du cache v0.5 | Page de mise à jour testée sur la même origine et le même chemin ; nouvelle interface chargée et fiche existante conservée. |
| Formulaire mobile | Parcours sur Chromium à 390 × 844 px ; province/localité, cours d’eau, ouvrage, crue, clôture. Pas de débordement horizontal. |
| Ordinateur | Relecture de l’accueil à 1365 × 960 px. |
| GPS | Coordonnées et précision fournies par le navigateur de test correctement associées à la fiche. Le GPS physique n’a pas été testé. |
| Dimensions | Buse / pont : champs conditionnels, conservation des valeurs, contrôle des nombres et de la méthode. |
| Photo | Import, compression JPEG, rattachement, position à l’ajout, inclusion dans la sauvegarde et l’export. |
| Audio | Enregistrement avec périphérique audio de test Chromium, sauvegarde et présence du fichier dans le JSON et le ZIP. |
| Interruption audio | Fragments persistés reconstitués à la réouverture, statut « interrompu » ; l’essai simule l’état laissé par une interruption. |
| Hors connexion | Rechargement complet et modification d’une fiche en réseau coupé dans Chromium ; modification conservée après rechargement. |
| Sauvegarde / import | JSON avec fiches et médias restauré dans un second contexte navigateur ; identifiants et codes conservés. Archives reprises. |
| Conflits | Conservation ou remplacement de la fiche locale, avec archive ; import invalide / identifiant hostile rejeté. |
| Stockage plein | Erreur de quota simulée : bandeau d’échec, export des données encore en mémoire, reprise de l’enregistrement après rétablissement. |
| Concurrence | Deuxième onglet d’édition bloqué avec message explicite dans les navigateurs supportant Web Locks ; contrôle de révision au niveau IndexedDB. |
| Word | DOCX généré avec textes, codes, tableaux et photo ; archive et XML valides ; ouvert par la bibliothèque python-docx. Pas de vérification dans Microsoft Word sur téléphone. |
| CSV / SIG | CSV cohérents, protection des cellules interprétables comme formules, GeoJSON longitude/latitude WGS84 ; chemins des fichiers médias vérifiés. |
| Transcription | Circuit applicatif testé avec réponse simulée ; correction et validation humaine. Service testé localement : contrôle du code d’accès, origine CORS, multipart, réponse. Aucun appel API réel. |

Les scénarios reproductibles sont dans `tests/`. Les données et médias d’essai ne sont pas inclus dans la version à publier.

## À vérifier sur les téléphones de mission

- Première installation, réouverture sans réseau et permissions de Safari iOS / Chrome Android.
- Qualité GPS, orientation et qualité des photos de caméra.
- Son en conditions de vent/bruit ; interruption par appel, écran verrouillé, batterie faible ou fermeture forcée.
- Sauvegarde / restauration d’un volume représentatif d’une journée terrain.
- Transcription française, arabe/darija et noms locaux après configuration du service réel.

La livraison fournit une application de collecte et un service de transcription configurable. Elle n’active ni synchronisation centrale, ni comptes enquêteurs, ni hébergement serveur, ni abonnement API. Le service peut être ajouté sans créer un autre dépôt GitHub.
