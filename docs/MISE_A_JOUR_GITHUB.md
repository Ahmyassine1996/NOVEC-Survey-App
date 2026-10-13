# Mettre à jour la même application GitHub

## 1. Avant la mise à jour

Sur **chaque téléphone/ordinateur** contenant des enquêtes, ouvrir l’ancienne application, aller dans Export et télécharger le JSON complet. Les données locales d’un téléphone ne sont pas celles du PC et elles ne sont pas stockées dans GitHub.

Ne pas effacer les données du navigateur. Pour conserver une copie de l’ancienne version du code : sur GitHub, bouton **Code → Download ZIP**.

## 2. Déposer les fichiers dans le dépôt existant

Dépôt : https://github.com/Ahmyassine1996/NOVEC-Survey-App

1. Extraire `NOVEC_Survey_Mise_a_jour_v1.3.zip` sur le PC.
2. Ouvrir le dépôt ci-dessus, branche **main**.
3. Choisir **Add file → Upload files**.
4. Glisser le contenu extrait, en conservant ses sous-dossiers. `index.html`, `sw.js`, `manifest.json`, `styles.css` et `NOVEC.png` doivent arriver à la racine du dépôt ; `js/`, `data/` et `icons/` doivent être des sous-dossiers à cette racine.
5. Ne pas envoyer l’archive ZIP comme unique fichier. Ne pas envoyer les sauvegardes JSON des enquêtes ni des enregistrements terrain dans le dépôt public.
6. Dans le message du commit, saisir par exemple `NOVEC Survey v1.3 – formulaire terrain, codes uniques et audio`.
7. Choisir le commit directement dans `main` si GitHub le propose et si cette branche n’est pas protégée. Si elle l’est, GitHub proposera une branche puis une pull request à fusionner vers `main`.
8. Les fichiers portant le même chemin sont mis à jour ; il n’est pas nécessaire de supprimer le dépôt.

Le fichier `.nojekyll` est inclus. Si Windows le masque, les autres fichiers suffisent pour cette arborescence ; le glisser aussi si possible. Aucun secret n’est fourni dans le ZIP.

## 3. Vérifier GitHub Pages

Dans **Settings → Pages**, conserver la configuration déjà fonctionnelle. Si elle utilise « Deploy from a branch », la source attendue est **main / (root)**. Ne pas créer un second dépôt ou un second site.

Dans **Actions**, attendre la fin réussie du déploiement Pages. Le temps de publication dépend de GitHub ; recharger une page avant la fin peut encore afficher l’ancienne version.

Adresse conservée : https://ahmyassine1996.github.io/NOVEC-Survey-App/

## 4. Actualiser l’application installée

L’ancienne version utilise un cache. Après déploiement :

1. Fermer tous les onglets du site et la fenêtre de l’application installée.
2. Avec une connexion Internet, ouvrir https://ahmyassine1996.github.io/NOVEC-Survey-App/mise-a-jour.html et cliquer sur « Installer la version 1.3 ». Cette page actualise le cache sans effacer les enquêtes.
3. Sur les versions suivantes, un bandeau « Une mise à jour est prête » permettra d’enregistrer puis d’actualiser.
4. Vérifier dans **Réglages** la version **1.2.0**, le code mission, l’enquêteur et les localités.
5. Vérifier que les anciennes fiches sont visibles. Les fiches reprises sont des brouillons à relire ; leurs champs anciens sont conservés dans Vérification → Données conservées.

Sur PC, un rechargement forcé peut aider après la fermeture des anciens onglets. Éviter « effacer toutes les données du site », car cela efface aussi les enquêtes. Si un problème persiste, conserver les sauvegardes et diagnostiquer le cache sans supprimer IndexedDB.

## 5. Test court avant de partir

Créer une visite d’essai, choisir une localité, ajouter un cours d’eau et relever sa position. Prendre une photo et enregistrer une note de 10 secondes. Fermer puis rouvrir la fiche. Passer en mode avion après le premier chargement connecté et recommencer un enregistrement. Exporter la sauvegarde et la restaurer sur un autre navigateur. Vérifier aussi le Word, le ZIP CSV et la lisibilité de l’audio.

La transcription ne fonctionne qu’après activation du service décrit dans le guide audio. L’absence de service n’empêche pas la collecte.

## Retour à une version précédente

GitHub conserve l’historique des commits. Cependant, revenir au code v0.5 ne rétrograde pas la base locale v2 ; l’ancien code ne sait pas ouvrir la version de schéma supérieure. Exporter les sauvegardes et organiser une conversion avant toute rétrogradation. La version v1.3 sait relire les JSON v0.5, l’inverse n’est pas garanti.

## Références officielles

- GitHub, ajout ou remplacement de fichiers : https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- GitHub, configuration Pages : https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- GitHub, nature statique de Pages : https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
