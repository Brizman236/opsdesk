# Pipeline CI — OpsDesk

## 1. Contexte et objectifs

Dans le cadre du développement d'OpsDesk, nous avons mis en place une première pipeline d'intégration continue (Continuous Integration ou CI) avec GitHub Actions.

L'objectif est de réduire les risques liés à l'intégration des modifications dans la branche principale `main`. Chaque changement doit faire l'objet d'une Pull Request et être soumis à des contrôles automatisés avant de pouvoir être fusionné.

Cette première version de la pipeline vise principalement à :

- vérifier que les dépendances du projet peuvent être installées à partir du fichier `package-lock.json` ;
- détecter les erreurs de syntaxe dans les fichiers JavaScript du répertoire `src/` ;
- fournir un résultat vérifiable avant la fusion d'une Pull Request.

La pipeline constitue ainsi un premier niveau de contrôle technique dans le processus de livraison du projet.

## 2. Architecture de la pipeline

La pipeline est définie dans le fichier :

```text
.github/workflows/opsdesk-ci.yml
```

Elle utilise GitHub Actions et repose actuellement sur un seul job nommé `validate`.

### 2.1 Déclenchement

Le workflow est déclenché par l'événement `pull_request`, avec un filtre sur la branche cible `main`. Il peut également être lancé manuellement avec `workflow_dispatch`.

Cela signifie que les contrôles sont exécutés lorsqu'une Pull Request est ouverte vers `main`, lorsqu'elle est rouverte ou lorsque sa branche source reçoit de nouveaux commits.

Le choix de ce déclencheur permet de contrôler les modifications avant leur intégration dans la branche principale, plutôt que de découvrir les problèmes après leur fusion.

### 2.2 Environnement d'exécution

Le job `validate` s'exécute sur un runner GitHub hébergé utilisant `ubuntu-latest`.

L'environnement Node.js est configuré avec la version majeure 24, conformément à la version utilisée pour le développement du projet.

Les actions suivantes sont utilisées :

- `actions/checkout@v6` : récupère le code du dépôt dans l'environnement d'exécution ;
- `actions/setup-node@v7` : configure l'environnement Node.js.

### 2.3 Étapes du job

Le job `validate` comprend actuellement quatre étapes :

| Étape | Mécanisme | Objectif |
|---|---|---|
| Checkout | `actions/checkout` | Récupérer le code à vérifier |
| Setup Node.js | `actions/setup-node` | Préparer l'environnement d'exécution |
| Installation | `npm ci --omit=dev` | Installer les dépendances de production à partir du lockfile |
| Vérification syntaxique | `node --check` | Détecter les erreurs de syntaxe JavaScript |

#### Installation des dépendances

La commande `npm ci --omit=dev` est utilisée pour installer les dépendances de production du projet.

Contrairement à une installation classique avec `npm install`, cette commande s'appuie sur le fichier `package-lock.json` et garantit que l'installation respecte les versions qui y sont enregistrées.

L'option `--omit=dev` exclut les dépendances de développement de l'installation. La commande échoue notamment lorsque le manifeste du projet et le lockfile ne sont pas cohérents. Elle ne doit pas servir à modifier le lockfile pendant l'exécution de la CI.

#### Vérification syntaxique

La dernière étape parcourt les fichiers JavaScript présents dans `src/` et exécute `node --check` sur chacun d'eux.

Cette vérification permet de détecter certaines erreurs de syntaxe avant l'intégration des modifications.

Elle ne vérifie cependant ni la logique métier, ni le comportement des routes API, ni les interactions avec PostgreSQL.

## 3. Déroulement d'une exécution

Lorsqu'une Pull Request ciblant `main` est ouverte ou mise à jour, GitHub Actions déclenche le workflow.

Le runner prépare alors l'environnement, récupère le code, configure Node.js, installe les dépendances et effectue la vérification syntaxique.

Si toutes les étapes réussissent, le job `validate` est marqué comme réussi.

Si une étape échoue, le job `validate` est marqué comme échoué. Toutefois, le status check requis par le ruleset est encore `build` : la correspondance entre le résultat de ce job et le contrôle de fusion n'est donc pas assurée tant que le ruleset n'a pas été mis à jour.

Avec l'événement `pull_request`, le checkout par défaut utilise la référence de fusion temporaire de la Pull Request. Les vérifications portent donc sur le résultat combiné de la branche source et de la branche cible, et pas uniquement sur les commits de la branche source.

## 4. Intégration avec la protection de la branche principale

La pipeline CI est associée au ruleset GitHub nommé `Protect main`, configuré avec un statut `Active`. Au 24 novembre 2026, son détail public indique toujours que le status check requis est `build`, alors que le job du workflow s'appelle désormais `validate`.

Ce ruleset impose notamment :

- le passage par une Pull Request avant toute fusion dans `main` ;
- la réussite du status check `build` (le ruleset n'a pas encore été actualisé pour le nom actuel `validate`) ;
- la mise à jour de la branche source avec la branche cible avant la fusion ;
- le blocage des force pushes ;
- l'interdiction de supprimer la branche `main`.

Le ruleset exige actuellement le contrôle `build`, mais le workflow présent ne produit plus ce job : il produit `validate`. Cette incohérence doit être résolue dans la configuration GitHub avant que le contrôle obligatoire corresponde au job actuel. La mise à jour du ruleset n'est pas considérée comme effectuée.

Cette configuration ne signifie pas qu'une approbation humaine est requise : le nombre d'approbations obligatoires est actuellement fixé à zéro.

La protection de branche et la CI remplissent deux rôles complémentaires : la première impose le processus de changement, tandis que la seconde vérifie automatiquement certains critères techniques.

## 5. Garanties et limites actuelles

Cette première version fournit un contrôle automatisé élémentaire de la qualité technique des modifications.

### Garanties apportées

- Les dépendances peuvent être installées à partir du lockfile dans l'environnement CI.
- Les erreurs de syntaxe détectables par `node --check` dans `src/` provoquent l'échec du job.
- Le ruleset impose un status check obligatoire, mais son nom `build` n'est pas synchronisé avec le job actuel `validate`.
- Les modifications sont évaluées dans le contexte de la fusion avec la branche cible.

### Limites identifiées

Des tests locaux du cycle de vie du serveur existent et s'exécutent avec `npm test`, mais ils ne sont pas intégrés à ce workflow. La pipeline ne réalise donc pas encore de tests applicatifs ni de tests d'intégration avec PostgreSQL.

La pipeline ne réalise pas encore :

- de tests unitaires ;
- de tests d'intégration avec PostgreSQL ;
- de tests fonctionnels ou end-to-end des endpoints API ;
- d'analyse statique de sécurité (SAST) ;
- d'analyse des dépendances à la recherche de vulnérabilités (SCA) ;
- de détection de secrets exposés ;
- de construction ou d'analyse d'une image Docker.

La réussite de cette pipeline ne garantit donc pas que l'application fonctionne correctement dans tous les scénarios. Elle indique uniquement que les contrôles actuellement configurés ont réussi.

## 6. Évolutions prévues

La pipeline est conçue pour évoluer progressivement avec le projet.

Les prochaines améliorations envisagées sont :

1. **Tests automatisés** : introduire des tests unitaires et des tests d'intégration pour vérifier le comportement de l'application et ses interactions avec la base de données.
2. **Contrôles de sécurité** : intégrer des outils de détection de vulnérabilités dans les dépendances, d'analyse statique et de détection de secrets.
3. **Conteneurisation** : ajouter la construction et la vérification de l'image Docker d'OpsDesk.
4. **Publication d'image** : automatiser la publication des images versionnées dans un registre tel que GitHub Container Registry (GHCR).
5. **Livraison et déploiement** : mettre progressivement en place un processus de livraison, puis de déploiement contrôlé.

Ces évolutions seront introduites au fur et à mesure de leur implémentation et de leur validation. La documentation devra être mise à jour pour refléter l'état réel de la pipeline, ses nouveaux contrôles et les garanties qu'ils apportent.