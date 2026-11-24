# Stratégie de tests — OpsDesk

## 1. État actuel

Les tests automatisés utilisent le module natif `node:test` de Node.js et se lancent avec :

```sh
npm test
```

Les tests du cycle de vie du serveur se trouvent dans `test/server-lifecycle.test.js`. Ils couvrent :

- `SIGTERM` : une requête HTTP active se termine avant la fermeture du pool; des signaux répétés ne déclenchent qu'une seule fermeture.
- `SIGINT` : une erreur de `pool.end()` est signalée et entraîne un code de sortie non nul.
- Dépassement du délai : le test vérifie l'interruption du client, la fermeture du pool simulé et la terminaison du processus après le déclenchement du délai de grâce.

Le délai de 30 secondes est raccourci dans le test pour éviter d'attendre aussi longtemps. Le serveur HTTP et le pool PostgreSQL sont simulés; ces tests ne requièrent pas de base de données et ne valident ni les routes réelles ni les échanges avec PostgreSQL.

## 2. Cycle de vie du serveur

`src/app.js` configure et exporte l'application Express sans démarrer de serveur. `src/server.js` démarre le serveur HTTP et orchestre l'arrêt sur `SIGINT` et `SIGTERM`. Lors d'un arrêt gracieux, il cesse d'accepter de nouvelles connexions, attend la fin des requêtes en cours, puis ferme le pool centralisé avec `pool.end()`. L'arrêt est idempotent.

Après 30 secondes, le code prévoit de fermer les connexions HTTP restantes et de fermer le pool. La couverture actuelle vérifie l'interruption de la requête simulée et la fin du processus, mais ne prouve pas directement que `server.closeAllConnections()` a été appelé. Le garde-fou de cette fermeture dépend de `server.listening`, qui devient faux après l'appel à `server.close()`; ce chemin doit donc être confirmé avant de considérer la fermeture forcée comme garantie.

## 3. Limites et prochaines étapes

La suite actuelle vérifie l'orchestration du cycle de vie avec des ressources simulées. Elle ne constitue pas un test unitaire complet de la logique applicative, ni un test fonctionnel ou d'intégration de l'API.

Les futurs tests d'intégration devront utiliser une base PostgreSQL isolée, appliquer les migrations prévues pour les tests, démarrer l'application réelle et vérifier notamment `POST /api/tickets` : réponses HTTP, validation des données et persistance. Ils devront nettoyer leurs données sans pouvoir cibler la base de développement.

Les tests locaux du cycle de vie ne sont pas encore exécutés par le workflow GitHub Actions. L'intégration des tests et de l'environnement PostgreSQL à la CI reste à réaliser.
