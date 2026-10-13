# Mise à jour V1.5 sur le dépôt existant

Suivre `GUIDE_MISE_A_JOUR.txt` à la racine. Sauvegarder chaque appareil avant la mise à jour. L’adresse et le dépôt existants sont conservés.

## Conservation

La base IndexedDB conserve son nom et sa version de schéma 2. Les fiches V1.4 sont relues directement. Les anciennes archives sont conservées ; les suppressions V1.5 utilisent une restauration ciblée. Les codes courts ne sont pas recalculés pour les fiches valides V1.4.

Après dépôt du code, attendre le déploiement puis utiliser `mise-a-jour.html`. La page installe le cache V1.5 sans effacer les données du site. Ne jamais utiliser « effacer toutes les données du site » pour résoudre un ancien cache sans disposer d’une sauvegarde vérifiée.

## Retour arrière

Conserver la sauvegarde JSON V1.4. Une version ancienne ne sait pas afficher les dimensions par ouverture et les fonctions V1.5 ; revenir à un ancien code après avoir collecté avec V1.5 demande une conversion contrôlée. Ne pas utiliser la rétrogradation comme procédure ordinaire de dépannage.

## Références officielles

- Ajout/remplacement des fichiers : https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- Configuration Pages : https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
