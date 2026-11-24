# Feuille de route DevOps & DevSecOps — OpsDesk

## 1. Vision du projet

OpsDesk est un projet pratique d'apprentissage des pratiques DevOps et DevSecOps. L'objectif est de construire progressivement une chaîne complète permettant de valider, tester, sécuriser, construire, publier et déployer une application.

Le projet ne consiste pas simplement à assembler des outils. Il vise à comprendre les mécanismes, les responsabilités, les garanties et les limites de chaque étape du cycle de livraison logicielle.

La trajectoire retenue va de l'intégration continue jusqu'au déploiement d'OpsDesk sur un cluster Kubernetes local constitué de machines virtuelles.

L'ensemble du parcours devra permettre de comprendre aussi bien la sécurité du code que celle des artefacts logiciels, des environnements d'exécution et des workloads.

## 2. Architecture cible de la chaîne de livraison

La chaîne de livraison envisagée suivra progressivement ce parcours :

1. Validation du code source.
2. Exécution des tests automatisés.
3. Construction de l'image Docker.
4. Vérification du comportement de l'application conteneurisée.
5. Analyse de sécurité des composants et de l'image.
6. Production et vérification des éléments de traçabilité de la supply chain.
7. Publication de l'image validée dans un registre.
8. Déploiement sur le cluster Kubernetes local.
9. Vérification du fonctionnement et de la sécurité du workload déployé.

Cette architecture évoluera au fur et à mesure de l'implémentation des différentes phases.

## 3. Feuille de route

### Phase 1 — Intégration continue initiale

**Objectif :** mettre en place les premiers contrôles automatisés sur les modifications du code source.

Travaux réalisés :

- Mise en place de GitHub Actions.
- Déclenchement du workflow sur les Pull Requests ciblant `main`.
- Installation reproductible des dépendances avec `npm ci`.
- Vérification syntaxique des fichiers JavaScript.
- Mise en place d'un status check obligatoire.

**Livrables :**
- Workflow `.github/workflows/opsdesk-ci.yml`.
- Documentation `docs/ci-cd/ci-pipeline.md`.
- Ruleset GitHub `Protect main`.

**État :** terminé pour la première version.

### Phase 2 — Tests automatisés

**Objectif :** vérifier le comportement de l'application et détecter les régressions avant l'intégration des modifications.

Travaux prévus :

- Étendre la stratégie de tests au comportement de l'API.
- Mise en place d'un environnement PostgreSQL isolé.
- Tests d'intégration des endpoints HTTP.
- Vérification des réponses, des règles de validation et de la persistance.
- Introduction de tests unitaires ciblés lorsque les règles métier le justifient.
- Intégration des tests dans GitHub Actions.

Organisation cible :

- `validate` : installation des dépendances et contrôles statiques.
- `test` : exécution des tests automatisés.

**Livrable :** une suite de tests reproductibles intégrée à la CI.

**État :** premiers tests locaux du cycle de vie du serveur implémentés; tests d'intégration avec PostgreSQL et intégration des tests dans GitHub Actions à réaliser.

### Phase 3 — Conteneurisation

**Objectif :** empaqueter OpsDesk dans une image Docker reproductible et vérifier son fonctionnement dans son environnement conteneurisé.

Travaux prévus :

- Conception du Dockerfile.
- Choix de l'image de base et de la stratégie de construction.
- Gestion des dépendances et de la configuration.
- Séparation entre configuration et image.
- Gestion des utilisateurs et des privilèges du conteneur.
- Intégration de la base de données dans l'environnement de test conteneurisé.
- Vérification du démarrage et du fonctionnement de l'application.

La CI évoluera vers les jobs suivants :

- `validate`
- `test`
- `build-image`
- `container-test`

Les tests applicatifs vérifieront les fonctionnalités de l'API. Les tests du conteneur vérifieront notamment le démarrage, la configuration, le réseau, la connectivité et le comportement de l'image construite.

**Livrables :**
- Dockerfile.
- Adaptation de `compose.yaml`.
- Documentation de la stratégie de conteneurisation.
- Vérifications automatisées du conteneur.

### Phase 4 — Sécurité du code et des dépendances

**Objectif :** intégrer des contrôles de sécurité au processus de développement.

Domaines à étudier :

**SAST — Static Application Security Testing**
- Analyse statique du code source.
- Détection de vulnérabilités potentielles.
- Étude des résultats et gestion des faux positifs.

Outil envisagé : CodeQL.

**SCA — Software Composition Analysis**
- Inventaire des dépendances directes et transitives.
- Détection des dépendances vulnérables.
- Analyse des versions et des mises à jour nécessaires.

Outils envisagés : npm audit et Dependabot.

**Secret scanning**
- Détection de secrets accidentellement présents dans le code ou l'historique Git.
- Prévention des expositions de credentials.
- Étude des procédures de révocation et de rotation.

Outil envisagé : Gitleaks.

**Livrable :** des contrôles de sécurité du code et de ses dépendances intégrés à la CI.

### Phase 5 — Sécurité des conteneurs

**Objectif :** réduire les risques associés aux images Docker et à leur exécution.

Travaux prévus :

- Analyse des vulnérabilités des images.
- Identification des composants obsolètes ou vulnérables.
- Durcissement des images de base.
- Réduction de la surface d'attaque.
- Exécution sans privilèges excessifs.
- Gestion des utilisateurs et des permissions.
- Étude des capacités Linux et des restrictions du conteneur.
- Vérification des configurations et des paramètres d'exécution.

Outil envisagé : Trivy pour l'analyse des images et de leurs composants.

**Livrable :** une image analysée et construite selon des exigences de sécurité documentées.

### Phase 6 — Sécurité de la supply chain logicielle

**Objectif :** renforcer la confiance dans les artefacts produits par la chaîne de livraison.

Cette phase portera sur l'origine, l'intégrité, la composition et la traçabilité des images publiées.

Travaux prévus :

**SBOM — Software Bill of Materials**
- Génération d'un inventaire des composants logiciels.
- Identification des dépendances intégrées dans l'image.
- Conservation de l'inventaire associé à chaque version.

**Signature des artefacts**
- Étude de la signature des images.
- Vérification cryptographique de leur intégrité.
- Gestion de l'identité utilisée pour signer.

**Provenance**
- Traçabilité du dépôt source et du commit.
- Identification du workflow ayant construit l'image.
- Association des informations de construction à l'artefact produit.

**Attestations**
- Production d'attestations liées aux images.
- Vérification de leur authenticité et de leur provenance.
- Étude des politiques permettant de refuser un artefact non conforme.

Technologies à étudier : SBOM au format SPDX ou CycloneDX, Sigstore/Cosign et GitHub Artifact Attestations.

**Livrable :** des images accompagnées de preuves de composition, d'intégrité et de provenance.

### Phase 7 — Publication des artefacts

**Objectif :** publier uniquement les images ayant passé les contrôles requis.

Travaux prévus :

- Mise en place de GitHub Container Registry (GHCR).
- Publication des images versionnées.
- Gestion des tags et des identifiants immuables.
- Conservation des artefacts et de leurs métadonnées.
- Vérification des images avant leur utilisation dans les environnements de déploiement.
- Gestion des permissions d'accès au registre.

Le pipeline devra publier l'image construite et validée, sans reconstruire une autre image lors du déploiement.

**Livrable :** un registre contenant les images validées et leurs éléments de traçabilité.

### Phase 8 — Préparation du cluster Kubernetes local

**Objectif :** construire un environnement Kubernetes local sur lequel déployer OpsDesk.

Le cluster sera hébergé sur plusieurs machines virtuelles, afin de comprendre les responsabilités des différents nœuds et les mécanismes d'orchestration.

Travaux prévus :

- Définition de l'architecture du cluster.
- Dimensionnement des machines virtuelles selon les ressources disponibles.
- Préparation des systèmes d'exploitation.
- Installation et configuration de Kubernetes.
- Mise en place du control plane et des workers.
- Configuration du réseau entre les nœuds.
- Installation d'un runtime de conteneurs adapté.
- Gestion des certificats et de l'accès au cluster.
- Vérification de l'état des nœuds et des composants Kubernetes.

Le choix des outils d'installation et la topologie exacte seront arrêtés pendant la conception de cette phase.

**Livrable :** un cluster Kubernetes local fonctionnel, documenté et reproductible.

### Phase 9 — Déploiement continu sur Kubernetes

**Objectif :** automatiser le déploiement d'OpsDesk sur le cluster local à partir des images validées et publiées.

Travaux prévus :

- Définition des ressources Kubernetes nécessaires.
- Déploiement de l'application à partir des images du registre.
- Configuration des variables et des secrets.
- Exposition de l'API.
- Gestion des probes de démarrage, de disponibilité et de vivacité.
- Gestion des ressources CPU et mémoire.
- Vérification du fonctionnement après déploiement.
- Gestion des mises à jour et des retours à une version précédente.

La chaîne de livraison devra distinguer la construction de l'image et son déploiement. Une image validée devra être promue vers l'environnement cible sans être reconstruite.

**Livrable :** un processus de déploiement reproductible sur Kubernetes local.

### Phase 10 — Sécurité des workloads Kubernetes

**Objectif :** comprendre et mettre en œuvre les mécanismes de sécurité applicables aux workloads orchestrés.

Domaines à étudier :

**Identité et autorisation**
- ServiceAccounts Kubernetes.
- RBAC.
- Permissions minimales des workloads.
- Séparation des identités humaines et des identités applicatives.

**Sécurité des conteneurs**
- Security Context.
- Exécution non privilégiée.
- Restrictions des capacités Linux.
- Gestion des volumes et des permissions.

**Sécurité réseau**
- NetworkPolicies.
- Contrôle des communications entre workloads.
- Segmentation des flux réseau.

**Gestion des secrets**
- Kubernetes Secrets et leurs limites.
- Protection du stockage des secrets.
- Étude d'alternatives de gestion centralisée des secrets.

**Contrôle des déploiements**
- Admission control.
- Politiques de sécurité des workloads.
- Vérification des images et des signatures avant déploiement.

**Observabilité et détection**
- Collecte des logs.
- Surveillance des workloads.
- Détection des comportements anormaux.
- Analyse des événements du cluster.

Cette phase permettra d'étudier la sécurité des workloads au-delà de la seule sécurité de leur code source.

**Livrable :** un environnement OpsDesk déployé sur Kubernetes avec des contrôles de sécurité documentés et vérifiés.

### Phase 11 — Sécurisation de la plateforme CI/CD

**Objectif :** protéger les mécanismes qui construisent, vérifient et livrent les artefacts.

Travaux prévus :

- Permissions minimales de `GITHUB_TOKEN`.
- Analyse des risques liés aux actions tierces.
- Gestion sécurisée des secrets GitHub.
- Séparation des responsabilités entre jobs.
- Protection des environnements et des étapes de publication.
- Étude des risques liés aux workflows déclenchés par des contributions externes.
- Sécurisation de l'identité utilisée par les pipelines.
- Étude de l'utilisation d'OIDC pour les futures intégrations avec des services externes.

Cette phase devra traiter la CI/CD comme un composant critique de l'infrastructure logicielle : une compromission de la chaîne de livraison pourrait permettre de modifier ou de distribuer des artefacts malveillants.

**Livrable :** une chaîne CI/CD disposant de permissions maîtrisées, de contrôles d'accès et de mécanismes de traçabilité.

## 4. Principes directeurs

L'ensemble du laboratoire devra respecter les principes suivants :

### Progressivité

Chaque phase doit être comprise et validée avant de passer à la suivante. Les outils ne seront introduits que lorsqu'un besoin technique ou de sécurité est clairement identifié.

### Séparation des responsabilités

Chaque étape de la chaîne doit avoir un objectif précis. La validation du code, les tests, la construction de l'image, l'analyse de sécurité et le déploiement ne doivent pas être confondus.

### Traçabilité

Les modifications, décisions, contrôles et résultats importants devront être documentés.

### Reproductibilité

Les environnements et les processus doivent pouvoir être reconstruits et réexécutés dans des conditions maîtrisées.

### Défense en profondeur

Aucun contrôle isolé ne doit être considéré comme une garantie suffisante. Les mécanismes de sécurité doivent se compléter.

### Automatisation contrôlée

L'automatisation doit être accompagnée de règles explicites : quels contrôles sont obligatoires, quels résultats bloquent la livraison et quelles exceptions sont acceptables.

## 5. Documentation et livrables

Chaque phase devra produire des éléments techniques permettant de démontrer le travail réalisé.

Selon le sujet, ces éléments pourront inclure :

- fichiers de configuration ;
- workflows GitHub Actions ;
- architectures et schémas ;
- procédures d'installation ;
- rapports d'analyse ;
- résultats de tests ;
- inventaires SBOM ;
- signatures et attestations ;
- preuves de déploiement ;
- décisions techniques et justification des compromis.

La documentation devra être actualisée à chaque évolution significative. Elle devra toujours distinguer les mécanismes prévus, ceux qui sont implémentés et ceux qui ont effectivement été validés.

## 6. Résultat attendu

À l'issue du laboratoire, OpsDesk devra disposer d'une chaîne de livraison permettant de :

- vérifier le code et le comportement de l'application ;
- construire et tester une image conteneurisée ;
- détecter les vulnérabilités dans le code, les dépendances et les images ;
- inventorier les composants logiciels ;
- établir la provenance et l'intégrité des artefacts ;
- publier des images validées ;
- déployer l'application sur un cluster Kubernetes local constitué de machines virtuelles ;
- sécuriser les workloads et leurs interactions ;
- observer et contrôler le fonctionnement de l'application déployée.

Ce laboratoire doit surtout permettre d'acquérir une compréhension transférable des mécanismes DevOps, DevSecOps, de la sécurité des conteneurs, de la supply chain logicielle et de la sécurité des workloads Kubernetes.