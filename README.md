# opsdesk
IT support ticket management API — a hands-on DevOps and DevSecOps learning project.

## PostgreSQL local

Le backend Node.js reste exécuté sur la machine hôte. Docker Compose ne démarre que PostgreSQL, publié sur `127.0.0.1:5432`.

1. Copier `.env.example` vers `.env`, puis choisir un mot de passe local pour `POSTGRES_PASSWORD` et reporter le même mot de passe dans `DATABASE_URL`.
2. Démarrer PostgreSQL : `docker compose up -d`.
3. Vérifier l'état : `docker compose ps`, puis `docker compose exec db sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'`.
4. Générer les fichiers de migration après une modification de `src/db/schema.js` : `npm run db:generate`. Cette étape produit des fichiers SQL versionnés; elle ne modifie pas la base.
5. Appliquer les migrations en attente : `npm run db:migrate`. Cette étape exécute le SQL et enregistre la migration appliquée dans PostgreSQL.
6. Lancer l'API sur l'hôte avec `npm run dev` ou `npm start`.

Le schéma JavaScript dans `src/db/schema.js` décrit les tables et contraintes utilisées par Drizzle ORM. La connexion et son pool sont centralisés dans `src/db/index.js`, pour que les autres couches puissent partager la même configuration et que la fermeture de connexion reste explicite.

Les données sont stockées dans le volume Docker nommé `opsdesk_postgres_data`. `docker compose stop` ou `docker compose down` arrêtent/suppriment le conteneur sans supprimer le volume. Ne pas utiliser `docker compose down -v` si les données doivent être conservées.
