# NOVEC Survey V1.8 — Évolution de la V1.7

Application PWA autonome, installable à partir du dépôt GitHub Pages existant. Aucune réécriture de la base IndexedDB ni nouvelle dépendance de collecte.

## Modifications V1.8

- **Codification métier** : `PROVINCE-LOCALITE-NOM-COURS-OH1` (ex. `TET-TETOUAN-MARTIL-OH1`), ou `TET-TETOUAN-CE1-OH1` quand le nom de l'oued est inconnu. Le nom est normalisé et les cours d'eau homonymes reçoivent un suffixe de désambiguïsation. Les anciennes valeurs sont gardées dans `previousCodes`, sans altérer les liens internes.
- **Identifiants internes** : nouveaux identifiants aléatoires compacts (96 bits). Les identifiants UUID déjà enregistrés sont conservés, car les renommer risquerait d'endommager les archives et médias.
- **Interface** : identifiants techniques masqués dans le parcours de saisie, mention « facultatif » retirée. La clôture renvoie vers le champ manquant et propose une action « Enregistrer et poursuivre / terminer » directement sous ce champ.
- **Corbeille** : groupes distincts pour fiches entières et éléments internes (cours d'eau, ouvrage, photo, audio) ; restauration ciblée existante conservée.
- **Word** : localité → cours d'eau → ouvrages, tableaux compacts, photographies directement sous leur sujet (deux côte à côte si plusieurs sur le même élément), légendes sans UUID, pied de page et pagination.
- **Exports** : CSV inclut `CODE_FICHE` ; codes métier harmonisés dans Word/CSV/GeoJSON ; sauvegardes JSON/ZIP intégrales compatibles.

## Points importants

L'ancien référentiel de **175 localités** est conservé avec les identifiants `L001`–`L175` et les codes internes du référentiel (ex. `TET091`). Ce dernier n'est plus affiché dans les codes métier. Les libellés de certaines localités sont toujours à valider administrativement.

La première ouverture de la V1.8 **met à jour les codes métier** des fiches enregistrées et conserve une copie des versions précédentes dans « Anciennes versions ». Les identifiants internes restent identiques. Faites une sauvegarde ZIP **sur chaque téléphone avant la mise à jour**, et vérifiez l'export après migration.

Le code métier seul peut être identique lors de deux visites différentes de la même localité : l'identifiant interne de visite permet de distinguer les relevés. La synchronisation multi-téléphones n'est pas incluse.

## Vérifications

**28 tests Node.js réussis** sur les modules (codification, registre, restitution, validation, EXIF, export). Le Word a également été généré à partir de la visite test fournie et rendu en 2 pages, contre 3 pages pour l'export d'origine. Le test automatisé d'interface navigateur/Android est resté inaccessible dans l'environnement. Il reste indispensable de tester sur Android la clôture, la corbeille, les photos GPS, l'export et le mode hors ligne.

## Installation

Lire `GUIDE_MISE_A_JOUR.txt`. Un seul ZIP, fichiers à placer à la racine du dépôt GitHub Pages. Ne jamais publier les ZIP de données terrain dans le dépôt public.
