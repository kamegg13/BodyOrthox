# Ralph Loop — Epic 3 Complet (Create → Dev → Review × N stories)

## Contexte projet

Projet Flutter iOS : BodyOrthox, analyse biomécanique on-device (Google ML Kit), 100% offline.
Sprint status : `docs/implementation-artifacts/sprint-status.yaml`
Stories : `docs/implementation-artifacts/`
Proof : `docs/proof.md`

**Objectif de cette session Ralph Loop :** Compléter TOUTES les stories restantes de l'Epic 3 (`epic-3`).

---

## Ton rôle dans chaque itération

À chaque itération, tu lis l'état courant des fichiers et tu détermines automatiquement quelle phase exécuter. Tu travailles en mode **#yolo** : pas de questions inutiles, pas de pauses, décisions autonomes sur les ambiguïtés mineures.

---

## Algorithme de décision (exécute à chaque itération)

### Étape 0 — Lire l'état courant

1. Lire `docs/implementation-artifacts/sprint-status.yaml`
2. Lire `docs/proof.md` (s'il existe)
3. Identifier les **stories Epic 3** = toutes les stories dont la clé commence par `3-` dans `development_status`
4. Vérifier si TOUTES les stories Epic 3 sont en statut `done`
   - Si oui → passer aux **Conditions de complétion** ci-dessous
5. Identifier la **story cible** = première story Epic 3 dans l'ordre numérique avec statut `backlog` ou `ready-for-dev` ou `in-progress` ou `review`
   - Ordre : `3-4` avant `3-5`
   - Ignorer les stories `done`

### Étape 1 — CREATE STORY (si story cible = `backlog`)

- Invoquer le skill `/bmad-bmm-create-story` en mode #yolo
- La story doit être complète avec tous ses champs (ACs, Tasks, Dev Notes)
- Mettre à jour `sprint-status.yaml` : story → `ready-for-dev`
- Continuer à l'étape 2 dans la même itération si possible

### Étape 2 — DEV STORY (si story cible = `ready-for-dev` ou `in-progress`)

Invoquer le skill `/bmad-bmm-dev-story` en mode #yolo avec les contraintes suivantes :

**KISS absolu** :

- Code le plus simple possible qui satisfait les ACs — zero over-engineering
- Pas de couches d'abstraction inutiles, pas de features non demandées
- Si deux approches existent, choisir la plus simple

**TDD obligatoire** :

- Écrire les tests AVANT le code de production (red → green → refactor)
- Chaque AC doit avoir au moins un test qui le valide directement
- Utiliser `flutter test` pour confirmer que les tests passent

**Preuve obligatoire** — après chaque `flutter test`, écrire dans `docs/proof.md` :

```
## [STORY-KEY] — [DATE]
### Commande exécutée
flutter test [path ou suite]

### Output réel
[Coller l'output complet de flutter test — nombre de tests, statut, temps]

### Verdict
✅ [N] tests passent / ❌ [N] tests échouent
```

### Étape 3 — CODE REVIEW (si story cible = `review`)

- Invoquer le skill `/bmad-bmm-code-review` en mode #yolo
- Si des issues sont trouvées : les corriger immédiatement
- Relancer `flutter test` et mettre à jour `docs/proof.md` avec les nouveaux résultats
- Mettre à jour `sprint-status.yaml` : story → `done`

---

## Conditions de complétion

L'**Epic 3 est COMPLET** quand TOUTES ces conditions sont vraies :

1. Toutes les stories Epic 3 (clé `3-*`) sont en statut `done` dans `sprint-status.yaml`
2. `docs/proof.md` contient la preuve pour chaque story (output dart analyze ou flutter test)
3. La code review a été effectuée pour chaque story (ou aucune issue bloquante)

Quand toutes les conditions sont remplies, écrire dans le terminal :

```
<promise>EPIC 3 COMPLETE</promise>
```

**IMPORTANT :** Ne pas écrire la promise tant qu'une story Epic 3 est encore en `backlog`, `ready-for-dev`, `in-progress` ou `review`. Continuer à travailler sur la prochaine story.

---

## Règles strictes

- **Ne jamais inventer des outputs de tests** — exécuter réellement les tests
- **Ne jamais marquer une tâche complète si les tests échouent**
- **Ne jamais skip une validation pour avancer plus vite**
- Si une erreur bloque après 3 tentatives : noter le blocage dans `docs/proof.md` et continuer avec ce qui est possible
- Communiquer en **français**
- Rester dans le répertoire `bodyorthox/` pour les commandes flutter
- `flutter test` non exécutable dans le sandbox (socket EPERM) → utiliser `dart analyze` avec `DART=/opt/homebrew/Caskroom/flutter/3.41.4/flutter/bin/cache/dart-sdk/bin/dart` comme substitut documenté
