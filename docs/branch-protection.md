# Protection de la branche principale — OpsDesk

## 1. Contexte et objectifs

La branche `main` constitue la branche principale du projet OpsDesk. Elle contient la version de référence du code et représente la base à partir de laquelle les futures livraisons seront préparées.

Compte tenu de son importance dans le cycle de développement, il est nécessaire de contrôler les modifications qui y sont intégrées afin de limiter les risques d'introduction de régressions et de préserver l'intégrité de son historique.

Pour répondre à cet objectif, nous avons configuré un ruleset GitHub nommé `Protect main`, dont le statut est `Active`.

Ce ruleset impose plusieurs règles destinées à encadrer les changements apportés à la branche principale.

## 2. Politiques de protection retenues

### 2.1 Pull Request obligatoire

Toute modification destinée à être intégrée dans `main` doit passer par une Pull Request.

Cette règle évite l'intégration directe de changements dans la branche principale et permet de soumettre chaque modification aux contrôles définis dans le processus de développement.

Le nombre d'approbations obligatoires est actuellement fixé à zéro, car le projet est développé individuellement. La Pull Request sert donc principalement de mécanisme de contrôle des changements et de déclenchement de la CI, et non de validation par un second développeur.

### 2.2 Vérifications CI obligatoires

La fusion d'une Pull Request est conditionnée par la réussite du status check `build`, d'après la configuration actuellement publiée du ruleset `Protect main`.

Le workflow GitHub Actions actuel nomme toutefois son job `validate`. Le ruleset n'a donc pas encore été actualisé pour correspondre au nouveau nom du job ; le contrôle obligatoire ne doit pas être décrit comme `validate` tant que cette modification n'est pas confirmée.

Dans sa version actuelle, il vérifie :

- l'installation des dépendances de production avec `npm ci --omit=dev` ;
- la syntaxe des fichiers JavaScript présents dans `src/`, à l'aide de `node --check`.

Si le status check requis échoue ou n'est pas fourni, la Pull Request ne satisfait pas cette condition de fusion. Dans l'état actuel, le décalage entre le contrôle requis `build` et le job `validate` doit être résolu dans le ruleset GitHub.

Cette règle permet d'éviter que des modifications échouant aux contrôles automatisés actuellement définis soient intégrées dans `main`.

Il faut toutefois noter que la CI ne réalise pas encore de tests fonctionnels ou de tests d'intégration. Une exécution réussie ne constitue donc pas une garantie du bon fonctionnement global de l'application.

### 2.3 Branche source à jour avec la branche cible

La règle exige que la branche source de la Pull Request soit à jour avec `main` avant la fusion.

L'objectif est de s'assurer que les modifications sont vérifiées dans un contexte suffisamment récent de la branche principale.

Si de nouveaux commits sont intégrés dans `main` pendant qu'une Pull Request est ouverte, sa branche source doit être mise à jour. Les contrôles CI doivent alors être exécutés à nouveau sur le nouvel état de la Pull Request.

Cette règle réduit le risque de fusionner des modifications qui n'ont pas été vérifiées avec les changements les plus récents de la branche cible.

### 2.4 Force pushes bloqués

Les force pushes sont interdits sur `main`.

Cette règle empêche la réécriture forcée de l'historique de la branche principale, ce qui contribue à préserver la traçabilité des modifications et à éviter la disparition involontaire de commits déjà intégrés.

Elle ne bloque pas tous les types de mises à jour de la branche : elle interdit spécifiquement les mises à jour forcées.

### 2.5 Suppression de la branche interdite

La suppression de `main` est interdite.

Cette règle protège la disponibilité de la branche principale et évite sa suppression accidentelle ou non autorisée.

## 3. Synthèse de la configuration

| Règle | Configuration | Objectif |
|---|---|---|
| Pull Request obligatoire | Activée | Encadrer les changements |
| Approbations obligatoires | 0 | Adapté au développement individuel actuel |
| Status check requis actuellement | `build` | Imposer la réussite de la CI ; nom non synchronisé avec le job actuel `validate` |
| Branche à jour | Activée | Vérifier les changements avec la branche cible récente |
| Force pushes | Bloqués | Préserver l'historique |
| Suppression de branche | Interdite | Protéger la disponibilité de `main` |

**Nom du ruleset :** `Protect main`  
**Cible :** `main`  
**Statut :** `Active`

## 4. Garanties et limites

La protection de branche et la pipeline CI sont complémentaires.

La protection de branche définit les conditions nécessaires à l'intégration des changements dans `main`, tandis que la CI exécute les contrôles techniques associés à chaque Pull Request.

La configuration actuelle apporte notamment les garanties suivantes :

- les changements doivent passer par une Pull Request ;
- le status check configuré `build` doit réussir, mais le workflow actuel émet le job `validate` ;
- la branche source doit être à jour avec la branche cible ;
- les force pushes et la suppression de `main` sont bloqués.

Ces mécanismes ne garantissent cependant pas l'absence de vulnérabilités ou de défauts fonctionnels.

En particulier, l'absence d'approbation obligatoire signifie qu'aucune seconde personne n'est tenue de valider les changements. De plus, les contrôles CI actuels se limitent à l'installation des dépendances et à la vérification syntaxique du code JavaScript.

La protection de branche constitue donc un premier niveau de contrôle du processus de développement, qui devra être renforcé à mesure que les capacités de test et de sécurité du projet évolueront.

## 5. Évolutions possibles

La politique de protection pourra évoluer avec la maturité du projet.

Parmi les améliorations envisageables :

- rendre obligatoires les nouveaux contrôles CI au fur et à mesure de leur introduction ;
- ajouter des exigences de sécurité sur les changements sensibles ;
- envisager la signature des commits ;
- renforcer les mécanismes de revue lorsque le projet sera développé par plusieurs contributeurs.

Toute modification de la configuration devra être documentée afin de maintenir une cohérence entre les règles GitHub effectivement actives et la présente documentation.