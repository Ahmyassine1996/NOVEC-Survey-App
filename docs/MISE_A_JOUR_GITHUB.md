# Mise à jour NOVEC Survey V1.7 sur le dépôt existant

Suivre le `GUIDE_MISE_A_JOUR.txt` à la racine du ZIP. **Faire une sauvegarde ZIP complète sur chaque appareil avant publication**. Garder le même dépôt et la même URL GitHub Pages.

## Données préservées

La base IndexedDB conserve le même nom et le schéma 2. Les identifiants internes et codes enregistrés des visites existantes ne sont pas renumérotés par la mise à jour du référentiel. Les 175 identifiants de localités `L001`–`L175` et leurs codes restent inchangés ; les noms affichés dans le nouveau sélecteur sont harmonisés. Les anciens noms déjà enregistrés dans des visites ne sont pas modifiés silencieusement.

Ne pas supprimer l'application ni effacer les données du navigateur pour résoudre un problème de cache. Charger `mise-a-jour.html` en ligne après le déploiement. Ne rétrograder vers une ancienne version qu'avec une sauvegarde vérifiée et des essais contrôlés.

## Contrôle après déploiement

Tester sur deux localités pilotes et comparer anciens codes, photos et exports. Effectuer un essai GPS et appareil photo réel. Vérifier le mode hors connexion après avoir ouvert la V1.7 une première fois avec Internet.

Documentation GitHub : https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
