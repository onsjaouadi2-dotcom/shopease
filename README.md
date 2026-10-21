# ShopEase - Module Authentification

Mini-projet Node.js support des ateliers du module Test et validation de logiciel (5TWIN4).

- v1.0 : version initiale avec défauts volontaires (analyse SonarQube : 14 problèmes, 3 Security Hotspots).
- v1.1 : corrections issues de l'analyse statique.
- v1.2 : ajout de tests unitaires Jest (17 tests) ; les tests [SHOP-30] à [SHOP-37] automatisent les cas de test Xray.

## Lancer les tests (avec Docker, sans installer Node)

    docker run --rm -v "${PWD}:/app" -w /app node:22 sh -c "npm install && npm test"

Rapports produits : `coverage/lcov.info` (couverture, lu par SonarQube) et `reports/junit.xml` (résultats).
