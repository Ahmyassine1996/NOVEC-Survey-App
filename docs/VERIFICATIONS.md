# Contrôles techniques — NOVEC Survey V1.8 (14 octobre 2026)

- 28 tests de logique Node.js : 28 réussis (`npm test`).
- Vérification syntaxique des modules JavaScript et intégrité ZIP : réussies.
- Référentiel localités : 175 entrées conservées ; 46 réserves de validation et 15 communes absentes inchangées.
- Contrôles V1.8 : codification cours d'eau nommé et sans nom, numérotation OH, homonymes, conservation des identifiants, restauration d'éléments, dimensions facultatives côté validation, nouveaux champs CSV/Word.
- Word de la visite pilote Tétouan : rendu contrôlé visuellement sur 2 pages à partir du ZIP test fourni. Titres hiérarchiques, photos et pied de page ; le Word V1.7 de départ comportait 3 pages.
- Limites : test de navigation Chromium non disponible dans cet environnement (lancement headless bloqué). Aucun essai réel de caméra, GPS, cache mobile ou mise à jour PWA sur Android n'a été réalisé. À valider impérativement avant déploiement général.
- La migration des anciennes fiches conserve une version archivée et ne modifie pas les identifiants internes. La sauvegarde préalable reste indispensable.
