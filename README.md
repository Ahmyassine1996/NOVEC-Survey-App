# NOVEC Survey V1.6 — application terrain

## Nouveautés V1.6 — mise à jour de la V1.5

- Interface plus sobre : accueil ivoire, reprise de la dernière visite, filtres Toutes / En cours / Terminées, fiches directement ouvrables et menu d’actions « ⋯ ».
- Corbeille : supprimer définitivement un élément ou vider les éléments non restaurés, après confirmation. Les fiches actives, anciennes versions et éléments restaurés sont conservés. Les médias des archives supprimées ne sont retirés que s’ils ne servent plus ailleurs ; les fragments audio correspondants sont nettoyés dans la même transaction.
- Après une mise à la corbeille, « Annuler » reste disponible 12 secondes. La restauration reste ensuite accessible dans la corbeille.
- Réglages → Stockage sur ce téléphone : protection en cours d’activation, activée, refusée, indisponible ou en erreur. L’état est relu auprès du navigateur ; son refus n’empêche pas l’enregistrement local. Cette protection ne remplace pas un ZIP et n’empêche pas un effacement manuel.
- Le rappel de sauvegarde compare les révisions des fiches et de la corbeille au dernier export complet ZIP / JSON préparé. La simple navigation ne modifie plus les dates/révisions. Les exports partiels et Word ne valident pas la sauvegarde complète. Vérifier le téléchargement reste nécessaire : l’application ne peut pas certifier que le fichier a été conservé hors du téléphone.

La base locale, le référentiel, les codes, les exports et le parcours diagnostic de la V1.5 sont conservés. Aucun service payant ou nouvelle bibliothèque n’est ajouté. Les ZIP déjà téléchargés ne sont pas modifiés par le nettoyage de la corbeille ; une ancienne sauvegarde ou version peut toujours contenir une copie d’un élément supprimé.


Mise à jour de la même application GitHub Pages. Aucun serveur ni compilation nécessaire pour la collecte. Les données restent sur chaque appareil ; la transcription nécessite le service facultatif déjà fourni.

## Parcours

1. Choisir la province et la localité dans la liste, avec recherche facultative. L’enquêteur vient des Paramètres ; une fiche existante peut être reprise.
2. Ajouter un cours d’eau : type, nom si connu, situation, puis photos du cours d’eau.
3. Ajouter un ouvrage. Sa vue dédiée affiche les dimensions adaptées et ses propres photos. « Retour aux ouvrages » retrouve la liste et sa position.
4. Compléter les informations facultatives puis terminer. Les messages de vérification permettent d’ouvrir le champ concerné.

Les fiches sont enregistrées automatiquement sur l’appareil. Les photos sont conservées même si la localisation est refusée ou indisponible. Une suppression passe toujours par la corbeille et reste restaurable.

## Photos et positions

- Capture : l’image est enregistrée avant la recherche GPS. Si le GPS échoue, la photo reste disponible avec « GPS à compléter ».
- Galerie : le GPS EXIF des JPEG est lu et conservé. Sans GPS lisible, aucune position actuelle n’est attribuée automatiquement. Le navigateur doit pouvoir décoder le format de l’image ; les métadonnées de formats autres que JPEG ne sont pas lues par cette version.
- « Attribuer ma position actuelle » exige une confirmation. Utiliser cette action au lieu de prise de la photo.
- La position du photographe reste distincte de celle du cours d’eau ou de l’ouvrage. On peut confirmer explicitement l’utilisation du point de la photo pour l’élément, ou relever/saisir un autre point.
- Une correction GPS crée une nouvelle version du média : les anciennes sauvegardes et archives ne sont pas altérées.
- Les images sont compressées en JPEG (grand côté : 1 800 pixels). Les coordonnées connues sont inscrites en EXIF. Il ne s’agit pas d’une conservation intégrale de toutes les métadonnées du fichier d’origine.

## Dimensions différentes

Buses, dalots et ponts : indiquer le nombre d’ouvertures, puis cocher « Les ouvertures ont des dimensions différentes » si nécessaire. La saisie détaillée accepte jusqu’à 100 ouvertures. Les valeurs inconnues restent vides. Les dimensions par ouverture figurent dans Word et `08_OUVERTURES.csv`. Les valeurs communes masquées restent dans la sauvegarde, mais ne sont pas présentées comme mesures actives.

## Corbeille

Dans Exports ou Paramètres, « Corbeille et anciennes versions » permet de restaurer une fiche, un cours d’eau, un ouvrage, un témoignage ou un média. La restauration d’un élément conserve les autres saisies de la fiche. Si son parent est supprimé, restaurer d’abord ce parent. Un élément déjà présent ne sera pas dupliqué.

Les archives V1.4 sont conservées comme anciennes versions complètes. Leur restauration remplace la fiche entière, après archivage de la version courante. Les corbeilles et archives restent locales et ne protègent pas contre la perte du téléphone.

## Dossier complet et restauration

Dans Exports, choisir une localité ou « Toutes les localités », puis Télécharger ZIP. Le dossier inclut :

- Word, photos et audios ;
- tableaux CSV et points GeoJSON WGS84 ;
- `RESTAURATION/NOVEC.json` et les médias nécessaires, y compris ceux des archives correspondantes.

Le ZIP toutes localités inclut aussi les fiches supprimées présentes dans la corbeille. Un ZIP limité à une localité inclut les archives de cette fiche seulement. Les médias du dossier servent aussi à la restauration, sans seconde copie en base64.

Pour restaurer : Exports → Choisir un ZIP NOVEC ou un JSON. Garder le ZIP intact, sans le recompresser. Les JSON des versions précédentes restent acceptés. Les anciens ZIP V1.4 contiennent seulement des livrables et ne peuvent pas être restaurés.

Un dossier préparé n’est pas une preuve que le navigateur l’a effectivement téléchargé : vérifier le fichier, puis le copier sur un ordinateur ou dans votre espace de travail. La limite du dossier est 250 Mo ; pour une mission importante, exporter les localités séparément. Les exports ne restaurent pas les réglages personnels ni le code d’accès de transcription : les renseigner sur un nouvel appareil.

## Codes

Format conservé : `FAH-HAS001-001` et `FAH-HAS001-001-OH01`. Les codes existants V1.4 restent stables. Les identifiants internes préservent les liens entre éléments et médias.

Sur des appareils indépendants hors connexion, plusieurs équipes dans la même localité doivent recevoir des plages de numéros distinctes dans Paramètres (1, 1001, 2001…), sans dépasser leur plage. Les doublons de codes à l’import sont bloqués. Le code ne détermine pas si deux observations correspondent au même oued géographique.

## Installation, essais et transcription

- Installation : `GUIDE_MISE_A_JOUR.txt` et `docs/MISE_A_JOUR_GITHUB.md`.
- Vérifications et limites : `docs/VERIFICATIONS.md`.
- Transcription facultative : `docs/AUDIO_ET_TRANSCRIPTION.md`.
- Tests de logique : `npm test` avec Node.js 22 ou ultérieur.
- Nouveaux tests ciblés : `tests/v16-browser.cjs` et `tests/update-v15.cjs` (nécessite la V1.5 dans le dossier voisin `v15`, ou `BASELINE_DIR`).
- Tests navigateur hérités V1.5 : `tests/v15-browser.cjs`, `tests/v15-recovery.cjs`, `tests/update-v14.cjs`. Playwright et un navigateur Chromium sont nécessaires ; ils ne sont pas des dépendances de l’application publiée.

Ne jamais publier les sauvegardes terrain ou une clé API dans le dépôt public.
