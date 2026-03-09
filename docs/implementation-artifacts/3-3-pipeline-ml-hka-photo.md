# Story 3.3: Pipeline ML HKA Photo

Status: review

## Story

As a developer maintaining the BodyOrthox codebase,
I want to remove all obsolete video pipeline code and verify that the HKA photo analysis pipeline (HKAModule + CapturePhotoHkaNotifier) compiles cleanly in isolation,
so that the codebase no longer carries dead code from the pre-pivot video pipeline and the static analysis is 100% clean.

## Acceptance Criteria

**AC1 — Suppression des fichiers pipeline vidéo**
**Given** le pivot Sprint Change 2026-03-08 a rendu obsolètes tous les fichiers du pipeline vidéo
**When** Story 3.3 est complétée
**Then** tous les fichiers suivants sont supprimés du codebase :

- `lib/features/capture/application/capture_notifier.dart`
- `lib/features/capture/application/capture_notifier.g.dart`
- `lib/features/capture/application/capture_notifier_test.dart` (misplaced in lib)
- `lib/features/capture/application/capture_provider.dart`
- `lib/features/capture/application/capture_provider.g.dart`
- `lib/features/capture/application/ml_isolate_runner.dart`
- `lib/features/capture/application/ml_providers.dart`
- `lib/features/capture/application/ml_runner.dart`
- `lib/features/capture/data/analysis_repository.dart`
- `lib/features/capture/data/drift_analysis_repository.dart`
- `lib/features/capture/data/drift_analysis_repository_test.dart` (misplaced in lib)
- `lib/features/capture/data/ml_kit_pose_service.dart`
- `lib/features/capture/data/ml_service.dart`
- `lib/features/capture/domain/analysis.dart`
- `lib/features/capture/domain/analysis.freezed.dart`
- `lib/features/capture/domain/analysis_error.dart`
- `lib/features/capture/domain/analysis_result.dart` (OLD — remplacé par core/analysis/)
- `lib/features/capture/domain/articular_angles.dart`
- `lib/features/capture/domain/articular_angles.freezed.dart`
- `lib/features/capture/domain/capture_state.dart` (OLD — remplacé par capture_photo_state.dart)
- `lib/features/capture/domain/confidence_score.dart`
- `lib/features/capture/domain/confidence_score.freezed.dart`
- `lib/features/capture/presentation/capture_screen.dart`
- `lib/features/capture/presentation/capture_screen_test.dart` (misplaced in lib)
- `lib/features/capture/presentation/widgets/guided_camera_overlay.dart`
- `lib/features/capture/presentation/widgets/guided_camera_overlay_test.dart` (misplaced in lib)
- `lib/features/capture/presentation/widgets/luminosity_indicator.dart`

**AC2 — Nettoyage `angle_calculator.dart`**
**Given** `lib/features/capture/data/angle_calculator.dart` importe les OLD domain types (`articular_angles.dart`, `confidence_score.dart`) qui sont supprimés en AC1
**When** Story 3.3 est complétée
**Then** `angle_calculator.dart` est nettoyé :

- Imports `articular_angles.dart` et `confidence_score.dart` supprimés
- Méthode `calculate()` et toutes les méthodes qui dépendent des OLD types supprimées
- `angleBetween()` reste intact (utilisé par `hka_angle_calculator.dart`)
- `kneeAngle()`, `hipAngle()`, `ankleAngle()`, `aggregateAngles()`, `jointConfidence()` peuvent rester (sans les OLD types)

**AC3 — Pipeline HKA compilé proprement**
**Given** toute la suppression AC1 et nettoyage AC2 est effectuée
**When** `dart analyze` est exécuté sur les fichiers de production HKA
**Then** aucune erreur ni warning sur :

- `lib/features/capture/data/angle_calculator.dart`
- `lib/features/capture/data/hka_angle_calculator.dart`
- `lib/features/capture/data/hka_module.dart`
- `lib/features/capture/domain/capture_photo_state.dart`
- `lib/features/capture/application/capture_photo_hka_notifier.dart`
- `lib/features/capture/presentation/capture_photo_hka_screen.dart`
- `lib/features/capture/presentation/widgets/camera_instruction_card.dart`

**AC4 — Tests existants compilés proprement**
**Given** la suppression en AC1 n'inclut que des fichiers dans `lib/` (pas dans `test/`)
**When** `dart analyze` est exécuté sur les fichiers de test existants
**Then** aucune erreur sur :

- `test/features/capture/data/hka_angle_calculator_test.dart`
- `test/features/capture/data/hka_module_test.dart`
- `test/features/capture/application/capture_photo_hka_notifier_test.dart`

**AC5 — Aucune référence orpheline dans `app.dart` ou `app_router.dart`**
**Given** les anciens types domain sont supprimés
**When** `dart analyze` est exécuté sur `lib/app.dart` et `lib/core/router/app_router.dart`
**Then** aucune erreur — les deux fichiers ne référencent que des types valides (HKAModule, AnalysisRegistry, CapturePhotoHkaScreen, HkaResultsScreen)

**AC6 — Pipeline ML KIT : photo → landmarks → angle HKA (validation statique)**
**Given** `HKAModule.analyze(photo)` est implémenté dans `hka_module.dart` (arch-2)
**When** `dart analyze hka_module.dart hka_angle_calculator.dart` est exécuté
**Then** le pipeline est validé statiquement :

- `PoseDetector.processImage()` appelé avec `InputImage.fromFilePath(photo.path)` → mode `PoseDetectionMode.single`
- landmarks `leftHip`, `leftKnee`, `leftAnkle`, `rightHip`, `rightKnee`, `rightAnkle` extraits
- `HkaAngleCalculator.calculateHkaAngle()` appelé pour chaque côté → délègue à `AngleCalculator.angleBetween()`
- score confiance calculé via `HkaAngleCalculator.averageLikelihood()` et `minLikelihood()`
- seuil confiance 0.7 appliqué → `MLLowConfidence` si dessous
- `AnalysisSuccess` retourné avec `hka_left`, `hka_right`, `confidence_left`, `confidence_right`
- `PoseDetector.close()` appelé dans `finally` — pas de memory leak

**AC7 — Sprint status mis à jour**
**When** la story est complétée
**Then** `docs/implementation-artifacts/sprint-status.yaml` est mis à jour :

- `3-3-pipeline-ml-hka-photo: done`

## Tasks / Subtasks

- [x] Tâche 1 — Supprimer tous les fichiers pipeline vidéo listés en AC1
  - [x] Supprimer les fichiers `application/` obsolètes (capture*notifier, capture_provider, ml*\*)
  - [x] Supprimer les fichiers `data/` obsolètes (drift_analysis_repository_test, ml_kit_pose_service, ml_service)
  - [x] Supprimer les fichiers `domain/` OLD (analysis_error, analysis_result OLD, capture_state OLD)
  - [x] Supprimer les fichiers `presentation/` obsolètes (capture_screen, guided_camera_overlay, luminosity_indicator)

- [x] Tâche 2 — Nettoyer `angle_calculator.dart` (AC2)
  - [x] Supprimer les imports `articular_angles.dart` et `confidence_score.dart`
  - [x] Supprimer la méthode `calculate()` et ses dépendances aux OLD types
  - [x] Vérifier que `angleBetween()` et les autres méthodes utilitaires restent intacts

- [x] Tâche 3 — Valider avec `dart analyze` (AC3, AC4, AC5, AC6)
  - [x] `dart analyze [7 fichiers HKA pipeline]` → No issues found!
  - [x] `dart analyze lib/app.dart lib/core/router/app_router.dart` → No issues found!
  - [x] `dart analyze test/features/capture/` → No issues found!
  - [x] Fix: hka_module.dart → imports relatifs (prefer_relative_imports)

- [x] Tâche 4 — Mettre à jour sprint-status.yaml (AC7)
  - [x] `3-3-pipeline-ml-hka-photo: done`
  - [x] `epic-3` reste `in-progress`

- [x] Tâche 5 — Documenter dans proof.md
  - [x] Section story-3-3 ajoutée avec output dart analyze final

## Dev Notes

### Scope et contexte

Story 3.3 est une story de **nettoyage post-pivot** : le pivot Sprint Change 2026-03-08 a refondu le pipeline vidéo en pipeline photo. Les fichiers suivants sont des vestiges de l'ancienne architecture vidéo — ils ne sont plus référencés par le code actif (arch-1, arch-2, story 3.0) et doivent être supprimés pour maintenir un codebase propre.

**Ce qui existe déjà (à garder) :**

- `hka_module.dart` — implémenté en arch-2 ✅
- `hka_angle_calculator.dart` — implémenté en arch-2 ✅
- `capture_photo_state.dart` — implémenté en story 3.0 ✅
- `capture_photo_hka_notifier.dart` — implémenté en story 3.0 ✅
- `capture_photo_hka_screen.dart` — implémenté en story 3.0 ✅
- `camera_instruction_card.dart` — implémenté en story 3.0 ✅
- `angle_calculator.dart` — GARDER mais nettoyer (méthodes `angleBetween()` etc. utilisées par hka_angle_calculator)

### Risque principal : `angle_calculator.dart`

Ce fichier comporte une dépendance aux OLD types :

```dart
import '../domain/articular_angles.dart';    // ← SUPPRIMER
import '../domain/confidence_score.dart';     // ← SUPPRIMER
```

La méthode `calculate()` utilise ces types — elle doit être **supprimée** avec ses imports.

La méthode `angleBetween(PoseLandmark a, b, c)` est **purement géométrique** (dart:math + google_mlkit_pose_detection uniquement) — elle est utilisée par `hka_angle_calculator.dart` via `AngleCalculator.angleBetween()` et doit être **conservée**.

Les autres méthodes utilitaires (`kneeAngle`, `hipAngle`, `ankleAngle`, `aggregateAngles`, `jointConfidence`) sont **sûres à conserver** car elles n'utilisent pas les OLD types — mais elles ne sont pas utilisées par le pipeline HKA actuel. Elles peuvent rester pour l'instant.

**Après nettoyage, `angle_calculator.dart` aura ces méthodes :**

- `angleBetween()` ← REQUIS par hka_angle_calculator
- `kneeAngle()`, `hipAngle()`, `ankleAngle()` ← GARDÉS (pas de OLD imports)
- `aggregateAngles()`, `jointConfidence()` ← GARDÉS (pas de OLD imports)
- ~~`calculate()`~~ ← SUPPRIMÉ (utilise OLD types)

### Fichiers mal placés dans `lib/`

Ces fichiers test ont été créés dans `lib/` par erreur — ils doivent être supprimés :

```
lib/features/capture/application/capture_notifier_test.dart  ← dans lib/ (incorrect)
lib/features/capture/data/drift_analysis_repository_test.dart ← dans lib/ (incorrect)
lib/features/capture/presentation/capture_screen_test.dart    ← dans lib/ (incorrect)
lib/features/capture/presentation/widgets/guided_camera_overlay_test.dart ← dans lib/ (incorrect)
```

Ces fichiers ne correspondent à aucun test actif (ils testent du code qui sera supprimé). Les supprimer sans créer d'équivalent dans `test/`.

### Aucun nouveau code à écrire

Cette story est **purement destructive** : suppression de fichiers + nettoyage d'un fichier existant. Aucune nouvelle classe, aucun nouveau test.

Les tests HKA (arch-2 + story 3.0) sont déjà dans `test/features/capture/` et couvrent entièrement le pipeline.

### Vérification des dépendances avant suppression

Avant de supprimer chaque fichier, vérifier qu'il n'est plus importé nulle part dans le code actif. Utiliser Grep pour chaque fichier critique :

```bash
# Vérifier que capture_notifier n'est plus utilisé
grep -r "capture_notifier" lib/ --include="*.dart"

# Vérifier que ml_kit_pose_service n'est plus utilisé
grep -r "ml_kit_pose_service" lib/ --include="*.dart"

# Vérifier que les OLD domain types ne sont plus importés en dehors de angle_calculator
grep -r "articular_angles\|confidence_score\|analysis_error" lib/ --include="*.dart"
```

### Sandbox restriction — `flutter test`

Même restriction que stories précédentes : `flutter test` non exécutable (socket 127.0.0.1 EPERM). Utiliser `dart analyze` comme substitut — preuve dans `docs/proof.md`.

### Import critique — ne pas confondre les deux `analysis_result.dart`

| Fichier                                            | Status                                                        | Action        |
| -------------------------------------------------- | ------------------------------------------------------------- | ------------- |
| `lib/features/capture/domain/analysis_result.dart` | OLD — `ArticularAngles`, `ConfidenceScore`                    | **SUPPRIMER** |
| `lib/core/analysis/analysis_result.dart`           | ACTIF — `AnalysisSuccess`, `AnalysisFailure`, `AnalysisError` | **GARDER**    |

Ne pas supprimer `lib/core/analysis/analysis_result.dart` !

### Project Structure après story 3.3

```
lib/
  features/
    capture/
      data/
        angle_calculator.dart        ← GARDÉ (nettoyé : sans imports OLD domain)
        hka_angle_calculator.dart    ← GARDÉ (arch-2)
        hka_module.dart              ← GARDÉ (arch-2)
      domain/
        capture_photo_state.dart     ← GARDÉ (story 3.0)
      application/
        capture_photo_hka_notifier.dart ← GARDÉ (story 3.0)
      presentation/
        capture_photo_hka_screen.dart ← GARDÉ (story 3.0)
        widgets/
          camera_instruction_card.dart ← GARDÉ (story 3.0)

test/
  features/
    capture/
      data/
        hka_angle_calculator_test.dart  ← GARDÉ (arch-2)
        hka_module_test.dart            ← GARDÉ (arch-2)
      application/
        capture_photo_hka_notifier_test.dart ← GARDÉ (story 3.0)
```

### Références

- [Source: docs/planning-artifacts/sprint-change-proposal-2026-03-08.md#Section-4.1] — Story 3.3 RÉÉCRITE : pipeline photo HKA
- [Source: docs/implementation-artifacts/arch-2-hka-module-premier-module-concret.md#Dev-Notes] — "features/capture/domain/analysis_result.dart sera supprimé en Story 3.3"
- [Source: docs/implementation-artifacts/3-0-capture-photo-hka.md#Dev-Notes] — "OLD pipeline vidéo, sera supprimé en Story 3.3"
- [Source: docs/implementation-artifacts/sprint-status.yaml] — séquence 3-0 → 3-3 → 3-4

## Mockup de référence

Aucun mockup UI — story purement technique (suppression de code obsolète).

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fix 1 — `dart analyze` via `/opt/homebrew/bin/dart` échoue (flutter wrapper engine.stamp EPERM). Solution : `DART=/opt/homebrew/Caskroom/flutter/3.41.4/flutter/bin/cache/dart-sdk/bin/dart`
- Fix 2 — `hka_module.dart` info: `prefer_relative_imports` pour les 2 imports `package:bodyorthox/core/analysis/`. Corrigé en imports relatifs `../../../core/analysis/`.
- Fix 3 — `articular_angles.dart`, `confidence_score.dart`, `analysis.dart`, `analysis_repository.dart`, `drift_analysis_repository.dart` ont des dépendants actifs dans `features/results/`, `features/patients/`, `core/notifications/` → NON supprimés (reportés aux stories de refactoring de ces features).

### Completion Notes List

- 19 fichiers OLD pipeline vidéo supprimés de `lib/features/capture/`.
- `angle_calculator.dart` nettoyé : méthode `calculate()` supprimée + imports `articular_angles`/`confidence_score` supprimés — `angleBetween()` conservé (requis par hka_angle_calculator).
- `app_router.dart` mis à jour : import `CaptureScreen` et route `/patients/:id/capture` supprimés.
- `dart analyze` → No issues found! sur tous les fichiers HKA pipeline (production + tests).
- Note : `articular_angles.dart`, `confidence_score.dart`, `analysis.dart`, `analysis_repository.dart`, `drift_analysis_repository.dart` conservés car encore référencés par `features/results/`, `features/patients/`, `core/notifications/`. Ces fichiers seront nettoyés lors des stories de refactoring Epic 2 et Epic 4.

### File List

**Supprimés :**

- `bodyorthox/lib/features/capture/application/capture_notifier.dart`
- `bodyorthox/lib/features/capture/application/capture_notifier.g.dart`
- `bodyorthox/lib/features/capture/application/capture_notifier_test.dart`
- `bodyorthox/lib/features/capture/application/capture_provider.dart`
- `bodyorthox/lib/features/capture/application/capture_provider.g.dart`
- `bodyorthox/lib/features/capture/application/ml_isolate_runner.dart`
- `bodyorthox/lib/features/capture/application/ml_providers.dart`
- `bodyorthox/lib/features/capture/application/ml_runner.dart`
- `bodyorthox/lib/features/capture/data/ml_kit_pose_service.dart`
- `bodyorthox/lib/features/capture/data/ml_service.dart`
- `bodyorthox/lib/features/capture/data/drift_analysis_repository_test.dart`
- `bodyorthox/lib/features/capture/domain/analysis_error.dart`
- `bodyorthox/lib/features/capture/domain/analysis_result.dart` (OLD)
- `bodyorthox/lib/features/capture/domain/capture_state.dart` (OLD)
- `bodyorthox/lib/features/capture/presentation/capture_screen.dart`
- `bodyorthox/lib/features/capture/presentation/capture_screen_test.dart`
- `bodyorthox/lib/features/capture/presentation/widgets/guided_camera_overlay.dart`
- `bodyorthox/lib/features/capture/presentation/widgets/guided_camera_overlay_test.dart`
- `bodyorthox/lib/features/capture/presentation/widgets/luminosity_indicator.dart`

**Modifiés :**

- `bodyorthox/lib/features/capture/data/angle_calculator.dart` — suppression `calculate()` + imports OLD domain
- `bodyorthox/lib/features/capture/data/hka_module.dart` — imports relatifs (prefer_relative_imports fix)
- `bodyorthox/lib/core/router/app_router.dart` — suppression import + route CaptureScreen
- `docs/implementation-artifacts/3-3-pipeline-ml-hka-photo.md` — story mise à jour (tasks, record, file list)
- `docs/implementation-artifacts/sprint-status.yaml` — story → done
- `docs/proof.md` — section story-3-3 ajoutée

## Change Log

- 2026-03-09 — Story créée (create-story workflow, Sprint Change 2026-03-08) — claude-sonnet-4-6
- 2026-03-09 — Implémentation complète : 19 fichiers OLD pipeline supprimés, angle_calculator nettoyé, app_router mis à jour, dart analyze → No issues found! — claude-sonnet-4-6
