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

Le schéma JavaScript dans `src/db/schema.js` décrit les tables et contraintes utilisées par Drizzle ORM. La connexion et son pool sont centralisés dans `src/db/index.js`; `src/server.js` orchestre la fermeture du pool à l'arrêt.

Les données sont stockées dans le volume Docker nommé `opsdesk_postgres_data`. `docker compose stop` ou `docker compose down` arrêtent/suppriment le conteneur sans supprimer le volume. Ne pas utiliser `docker compose down -v` si les données doivent être conservées.

## Cycle de vie et tests

`src/app.js` configure Express sans démarrer le serveur HTTP. `src/server.js` démarre le serveur et traite `SIGINT` et `SIGTERM`. Lors d'un arrêt gracieux, le serveur cesse d'accepter de nouvelles connexions, laisse finir les requêtes actives, puis ferme le pool avec `pool.end()`. L'arrêt est idempotent; un délai maximal de 30 secondes est prévu.

La suite locale de cycle de vie s'exécute avec `npm test`. Elle utilise un serveur HTTP et un pool PostgreSQL simulés : PostgreSQL n'a pas besoin d'être démarré. Voir la [stratégie de tests](docs/testing/test-strategy.md) pour le périmètre et les limites de ces vérifications.

## Création d'un ticket

`POST /api/tickets` crée un ticket sans authentification. Le corps JSON doit contenir uniquement `name`, `email`, `subject` et `description`. Ces quatre champs sont des chaînes obligatoires; les espaces aux extrémités sont retirés avant validation. Les longueurs acceptées sont respectivement 2–100, 3–254, 5–150 et 10–5000 caractères. L'adresse e-mail doit aussi respecter un format courant. Le client ne peut pas définir `id`, `status` ni `created_at`; PostgreSQL génère l'identifiant et fournit `open` et l'heure de création par défaut.

Une réussite retourne `201 Created` avec le ticket créé dans `data`, dont l'horodatage est nommé `created_at`. Un JSON mal formé retourne `400`; un corps JSON valide qui ne respecte pas le contrat retourne `422`; une défaillance interne retourne `500`; une indisponibilité temporaire reconnue de PostgreSQL retourne `503`. Les réponses d'erreur ne révèlent pas les détails internes.

Exemple :

```sh
curl -i http://localhost:3000/api/tickets \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "subject": "Accès au VPN",
    "description": "Je ne parviens pas à me connecter au VPN depuis ce matin."
  }'
```

Exemples d'erreurs à vérifier manuellement :

```sh
# JSON invalide : 400
curl -i http://localhost:3000/api/tickets \
  -H 'Content-Type: application/json' -d '{"name":'

# Champ manquant ou inconnu : 422
curl -i http://localhost:3000/api/tickets \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","subject":"VPN","description":"Description valide ici"}'
```
