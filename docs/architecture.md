# OpsDesk — Architecture technique

**Version :** 1.0  
**Statut :** Architecture initiale proposée

## 1. Vue d'ensemble

OpsDesk repose sur une architecture client-serveur organisée autour de trois composants principaux :

- Un client HTTP permettant d'interagir avec l'application.
- Une API REST développée avec Node.js et Express.
- Une base de données PostgreSQL assurant la persistance des données.

L'application adopte initialement une architecture monolithique modulaire. Les fonctionnalités métier sont regroupées dans une seule application backend, sans introduire de services distribués inutiles.

## 2. Architecture logique

```text
                 CLIENT HTTP
                  (Postman)
                      |
                      | Requête HTTP
                      v
              +-------------------+
              |    API Express    |
              |                   |
              | Routes            |
              | Middlewares       |
              | Contrôleurs       |
              | Services          |
              | Repositories      |
              +-------------------+
                      |
                      | Requêtes SQL
                      v
              +-------------------+
              |    PostgreSQL     |
              |                   |
              | Tickets           |
              +-------------------+
```

Le client communique avec l'API via HTTP. L'API traite les requêtes et communique avec PostgreSQL pour lire ou modifier les données.

## 3. Composants du backend

Le backend est organisé en plusieurs responsabilités afin de faciliter sa compréhension, sa maintenance et son évolution.

### 3.1. Routes

Les routes définissent les endpoints disponibles et associent chaque requête HTTP au traitement correspondant.

Exemple :

- `POST /tickets` : créer un ticket.
- `GET /tickets` : consulter la liste des tickets.
- `GET /tickets/:id` : consulter un ticket.
- `PATCH /tickets/:id/status` : modifier le statut d'un ticket.

### 3.2. Middlewares

Les middlewares interviennent dans le traitement des requêtes avant ou après leur passage dans les contrôleurs.

Ils peuvent notamment assurer :

- La validation du format des données entrantes.
- La gestion centralisée des erreurs.
- La journalisation des requêtes et événements pertinents.

### 3.3. Contrôleurs

Les contrôleurs assurent la coordination entre les requêtes HTTP et la logique métier.

Leurs responsabilités comprennent :

- La réception des données validées.
- L'appel aux services appropriés.
- La construction des réponses HTTP.

Ils ne doivent pas contenir directement les requêtes SQL ni concentrer les règles métier.

### 3.4. Services

Les services contiennent la logique métier de l'application.

Ils sont responsables de l'application des règles définies pour OpsDesk, notamment :

- Attribuer automatiquement le statut `OPEN` à un nouveau ticket.
- Appliquer les règles de modification des statuts.
- Vérifier les conditions métier nécessaires aux opérations.

Les services ne doivent pas dépendre directement du protocole HTTP.

### 3.5. Repositories

Les repositories encapsulent les interactions avec PostgreSQL.

Ils assurent notamment :

- La création des tickets.
- La récupération d'un ticket par identifiant.
- La consultation de la liste des tickets.
- La modification des données persistées.

Ils ne prennent pas les décisions métier.

## 4. Flux de création d'un ticket

La création d'un ticket suit le processus suivant :

1. Le client envoie une requête `POST /tickets`.
2. La route dirige la requête vers le middleware de validation.
3. Le middleware vérifie la structure et le format des données.
4. Le contrôleur transmet les données validées au service.
5. Le service applique les règles métier, notamment l'attribution du statut initial `OPEN`.
6. Le service demande au repository d'enregistrer le ticket.
7. Le repository exécute l'opération dans PostgreSQL.
8. Le résultat remonte au contrôleur, qui retourne une réponse HTTP appropriée.

## 5. Validation et intégrité des données

La validation et l'intégrité des données sont assurées à plusieurs niveaux complémentaires.

### Validation applicative

Les middlewares vérifient la structure et le format des données reçues.

Les services appliquent les règles métier.

### Contraintes de la base de données

PostgreSQL impose les contraintes d'intégrité nécessaires, notamment :

- L'obligation de renseigner les champs requis.
- La limitation des valeurs autorisées pour les priorités et les statuts.
- L'unicité des identifiants.

Une donnée invalide doit être rejetée. Aucun mécanisme de substitution silencieuse n'est prévu.

## 6. Gestion des erreurs

Les erreurs sont classées selon leur nature afin de permettre un traitement approprié.

| Catégorie | Exemple | Réponse HTTP indicative |
|---|---|---|
| Validation | Priorité invalide | 400 Bad Request |
| Métier | Ticket inexistant | 404 Not Found |
| Métier | Transition de statut interdite | 409 Conflict |
| Technique | PostgreSQL indisponible | 503 Service Unavailable |
| Inattendue | Erreur non anticipée | 500 Internal Server Error |

Un gestionnaire centralisé d'erreurs traduit les erreurs applicatives en réponses HTTP adaptées.

Les réponses destinées aux utilisateurs ne doivent jamais exposer les secrets, les identifiants de connexion, les chemins internes ou les traces techniques sensibles.

## 7. Journalisation

L'application doit journaliser les événements nécessaires à son exploitation et à l'investigation des incidents.

Les journaux pourront notamment contenir :

- Un horodatage.
- Un niveau de gravité.
- Le type d'événement.
- Un identifiant de corrélation de requête.
- Un code d'erreur technique lorsque cela est pertinent.

Les secrets, mots de passe, tokens et données personnelles inutiles ne doivent pas être enregistrés.

## 8. Disponibilité et comportement en cas d'incident

Si PostgreSQL devient indisponible, le backend ne doit pas accepter une opération de création ou de modification qu'il ne peut pas persister.

Il doit :

1. Interrompre le traitement concerné.
2. Journaliser l'erreur.
3. Retourner une réponse HTTP appropriée.
4. Informer l'utilisateur que le service est temporairement indisponible.

La première version ne prévoit ni file d'attente de requêtes ni mécanisme de reprise automatique.

## 9. Évolution de l'architecture

L'architecture sera initialement exécutée en environnement local.

Elle évoluera progressivement pour intégrer :

- La conteneurisation avec Docker.
- L'orchestration locale avec Docker Compose.
- L'automatisation des tests et de la livraison avec CI/CD.
- Les contrôles de sécurité DevSecOps.
- Le déploiement et la sécurisation de l'environnement AWS.

Ces évolutions devront préserver autant que possible la séparation des responsabilités et la simplicité de l'architecture initiale.

---

*Cette architecture constitue une base de conception. Les choix d'implémentation seront validés au fur et à mesure du développement et documentés lorsqu'ils représentent des décisions techniques significatives.*