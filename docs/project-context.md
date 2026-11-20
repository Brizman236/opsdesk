# OpsDesk — Contexte du projet

**Version :** 1.0  
**Statut :** Contexte initial du projet

## 1. Présentation du projet

OpsDesk est une application de gestion de tickets de support informatique, initialement développée pour permettre à une entreprise de services informatiques de centraliser et de gérer ses demandes d'assistance.

L'application est déjà partiellement développée. Elle constitue une base sur laquelle nous souhaitons améliorer les pratiques de développement, de livraison et d'exploitation.

L'objectif de ce projet n'est pas seulement de terminer l'application, mais également de mettre progressivement en place des pratiques fiables, reproductibles et sécurisées de livraison logicielle.

## 2. Situation initiale

L'application repose sur les technologies suivantes :

- Node.js ;
- Express ;
- PostgreSQL.

Bien que le développement ait déjà commencé, le projet ne dispose pas encore d'un processus suffisamment structuré pour gérer son évolution et sa livraison.

Le scénario initial fait apparaître plusieurs difficultés :

- Les modifications du code ne font pas systématiquement l'objet d'une revue avant leur intégration.
- Les tests reposent principalement sur des vérifications manuelles.
- Les déploiements sont manuels et difficiles à reproduire.
- Les dépendances ne font pas l'objet d'une analyse systématique des vulnérabilités.
- La sécurité de l'application n'est pas intégrée de manière structurée au processus de développement.
- La traçabilité entre les modifications du code, les artefacts construits et les versions déployées est limitée.

Ces difficultés exposent le projet à des risques concernant la fiabilité de l'application, la cohérence des livraisons et la sécurité.

## 3. Objectifs du projet

Le projet vise à répondre progressivement à ces difficultés grâce aux pratiques DevOps et DevSecOps.

### 3.1. Objectifs DevOps

- Mettre en place un processus structuré de gestion du code avec Git et GitHub.
- Introduire les Pull Requests et les revues de code.
- Automatiser les tests de l'application.
- Conteneuriser l'application avec Docker.
- Gérer les environnements locaux avec Docker Compose.
- Mettre en place des pipelines CI/CD.
- Gérer et publier des images de conteneurs versionnées.
- Améliorer la reproductibilité des déploiements et la visibilité opérationnelle.

### 3.2. Objectifs DevSecOps

- Intégrer des contrôles de sécurité au cycle de développement.
- Identifier les dépendances vulnérables.
- Détecter les secrets exposés et les pratiques de codage risquées.
- Analyser les images de conteneurs à la recherche de vulnérabilités.
- Générer et maintenir des nomenclatures des composants logiciels (SBOM).
- Introduire des contrôles de sécurité dans les pipelines CI/CD.
- Améliorer la traçabilité et le traitement des vulnérabilités détectées.

### 3.3. Objectifs de sécurité Cloud

Après avoir établi les fondations du développement et de la livraison en environnement local, le projet évoluera vers AWS.

Cette phase portera notamment sur :

- La conception sécurisée d'infrastructures Cloud.
- La gestion des identités et des permissions des workloads.
- La segmentation réseau et le contrôle des accès.
- La gestion sécurisée des secrets.
- La sécurité des workloads lors de leur déploiement et de leur exécution.
- La journalisation, la surveillance et la détection des événements de sécurité.

## 4. Approche de mise en œuvre

Le projet évoluera progressivement.

Plutôt que d'introduire tous les outils et toutes les pratiques simultanément, chaque capacité sera ajoutée lorsque son utilité et son fonctionnement auront été compris.

Les principes suivants guideront notre démarche :

1. Comprendre avant d'automatiser.
2. Introduire les contrôles progressivement.
3. Privilégier les processus reproductibles aux procédures manuelles.
4. Considérer la sécurité comme une composante du cycle de livraison logicielle.
5. Valider chaque modification importante par des tests et des revues.
6. Documenter les décisions techniques, les limites et les enseignements tirés.

## 5. Résultat attendu

À terme, OpsDesk devra constituer une démonstration pratique du cycle de vie d'une application développée, testée, sécurisée, livrée et exploitée selon des pratiques DevOps et DevSecOps structurées.

Le projet servira également de fondation à l'étude de la sécurité Cloud sur AWS, notamment autour de l'identité des workloads, de la sécurité des infrastructures et de la protection à l'exécution.

---

*Ce document décrit le scénario initial du projet et son orientation générale. Les détails de mise en œuvre, les décisions techniques et les preuves seront documentés au fur et à mesure de l'avancement.*