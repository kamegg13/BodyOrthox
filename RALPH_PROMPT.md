# Ralph Loop — Cycle Story N+1 (Create → Dev → Review)

## Contexte projet

Projet Flutter iOS : BodyOrthox, analyse biomécanique on-device (Google ML Kit), 100% offline.
Sprint status : `docs/implementation-artifacts/sprint-status.yaml`
Stories : `docs/implementation-artifacts/`
Proof : `docs/proof.md`

---

## Ton rôle dans chaque itération

À chaque itération, tu lis l'état courant des fichiers et tu détermines automatiquement quelle phase exécuter. Tu travailles en mode **#yolo** : pas de questions inutiles, pas de pauses, décisions autonomes sur les ambiguïtés mineures.

---

## Algorithme de décision (exécute à chaque itération)

### Étape 0 — Lire l'état courant

1. Lire `docs/implementation-artifacts/sprint-status.yaml`
2. Lire `docs/proof.md` (s'il existe)
3. Identifier la **story cible** = première story dans l'ordre du sprint avec statut `backlog` ou `ready-for-dev`
   - Ordre du sprint : Epic 1 → Epic Arch → Epic 3 → Epic 4 → Epic 2 → Epic 5 → Epic 6
   - Ignorer les epics et rétrospectives
   - Ignorer les stories `done`, `in-progress`, `review`

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

La story N+1 est COMPLÈTE quand TOUTES ces conditions sont vraies :

1. La story est en statut `done` dans `sprint-status.yaml`
2. `flutter test` retourne 0 échec (output dans `docs/proof.md`)
3. `docs/proof.md` contient la preuve avec l'output réel de flutter test
4. La code review a été effectuée (ou aucune issue bloquante)

Quand toutes les conditions sont remplies, écrire dans le terminal :

```
<promise>STORY COMPLETE</promise>
```

---

## Règles strictes

- **Ne jamais inventer des outputs de tests** — exécuter réellement `flutter test`
- **Ne jamais marquer une tâche complète si les tests échouent**
- **Ne jamais skip une validation pour avancer plus vite**
- Si une erreur bloque après 3 tentatives : noter le blocage dans `docs/proof.md` et continuer avec ce qui est possible
- Communiquer en **français**
- Rester dans le répertoire `bodyorthox/` pour les commandes flutter
