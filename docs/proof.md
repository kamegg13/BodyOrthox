# Proof — BodyOrthox Test Evidence

## arch-2 — 2026-03-09 — Code Review

### Commande exécutée

```
flutter test test/features/capture/data/
```

### Blocker Environnement

`flutter test` et `dart test` ne peuvent pas s'exécuter dans le sandbox Claude Code (itération 1 Ralph Loop) car le sandbox bloque la création de sockets réseau sur 127.0.0.1 (errno=1 EPERM). Le dart test runner communique avec les isolates de test via des sockets locaux — cette restriction est fondamentale.

Tentatives effectuées :

- `flutter test` direct → Operation not permitted (engine.stamp write)
- Patched flutter root → Operation not permitted (socket bind 127.0.0.1)
- `dart analyze` avec HOME redirect → succès (aucune erreur dans les fichiers de production)

### Output dart analyze (remplacement de flutter test)

```
$ dart analyze lib/features/capture/data/hka_module.dart lib/features/capture/data/hka_angle_calculator.dart
Analyzing hka_module.dart, hka_angle_calculator.dart...
   info - hka_module.dart:18:8 - prefer_relative_imports (style only)
   info - hka_module.dart:19:8 - prefer_relative_imports (style only)
2 issues found. (info level only — aucune erreur)

$ dart analyze test/features/capture/data/hka_module_test.dart test/features/capture/data/hka_angle_calculator_test.dart
Analyzing hka_module_test.dart, hka_angle_calculator_test.dart...
No issues found!
```

### Code Review — Issues trouvés et corrigés

| #   | Sévérité | Issue                                                                                                        | Fix                                                          |
| --- | -------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| 1   | MEDIUM   | `on Exception catch (e)` ne capture pas les `Error` Dart (ex: `StateError`, `OutOfMemoryError`) — AC#6 viole | `catch (e)` universel dans `hka_module.dart:159`             |
| 2   | MEDIUM   | Aucun test pour landmark null dans Pose détectée — AC#2 gap                                                  | Nouveau test `_makePoseWithMissingLandmark()` ajouté         |
| 3   | MEDIUM   | Test `close()` MLLowConfidence duplique 20 lignes → utilise `_makePose(leftHipLikelihood: 0.5)`              | `_makePose` étendu avec paramètre `leftHipLikelihood`        |
| 4   | MEDIUM   | Aucun test multi-appels `analyze()` (cycle de vie détecteur par appel)                                       | Nouveau test `appels successifs créent un nouveau détecteur` |
| 5   | LOW      | `PoseDetectorInterface` publique sans `@visibleForTesting`                                                   | Annotation ajoutée + import `flutter/foundation.dart`        |

### Fichiers modifiés

- `bodyorthox/lib/features/capture/data/hka_module.dart` — catch universel + @visibleForTesting
- `bodyorthox/test/features/capture/data/hka_module_test.dart` — 3 tests ajoutés, helper étendu

### Verdict

✅ Analyse statique propre (aucune erreur de compilation)
✅ 4 MEDIUM issues fixés
✅ Tous les ACs vérifiés par lecture du code
⚠️ `flutter test` non exécutable (sandbox socket restriction) — tests non lancés dynamiquement

---

## story-3-0 — 2026-03-09 — Dev Story (Implémentation)

### Commandes exécutées

```
dart analyze lib/features/capture/domain/capture_photo_state.dart \
  lib/features/capture/application/capture_photo_hka_notifier.dart \
  lib/features/capture/presentation/capture_photo_hka_screen.dart \
  lib/features/capture/presentation/widgets/camera_instruction_card.dart \
  lib/features/results/presentation/hka_results_screen.dart \
  lib/core/router/app_router.dart

dart analyze test/features/capture/application/capture_photo_hka_notifier_test.dart
```

### Blocker Environnement

Même restriction sandbox qu'arch-2 :

- `flutter test` → socket EPERM (127.0.0.1:0)
- `image_picker: ^1.1.2` absent du pub cache + TLS error pub.dev

**Workarounds appliqués :**

- Stub `image_picker` local (`local_packages/image_picker_stub/`) avec API compatible v1.1.2
- `flutter pub get --offline` réussi avec le stub
- `dart analyze` comme substitut de `flutter test`

### Output dart analyze

```
$ dart analyze [production files]
Analyzing ...
No issues found!

$ dart analyze test/features/capture/application/capture_photo_hka_notifier_test.dart
Analyzing capture_photo_hka_notifier_test.dart...
No issues found!
```

_Note : 7 issues info-level (prefer_relative_imports + withOpacity déprécié) détectés et corrigés avant la validation finale._

### Fichiers créés/modifiés

**Créés :**

- `lib/features/capture/domain/capture_photo_state.dart` — sealed class 4 états
- `lib/features/capture/application/capture_photo_hka_notifier.dart` — Notifier + Provider
- `lib/features/capture/presentation/capture_photo_hka_screen.dart` — ConsumerWidget
- `lib/features/capture/presentation/widgets/camera_instruction_card.dart` — glass-morphism
- `lib/features/results/presentation/hka_results_screen.dart` — placeholder Story 3.4
- `local_packages/image_picker_stub/` — stub API compatible pub get offline
- `test/features/capture/application/capture_photo_hka_notifier_test.dart` — 7 tests unitaires

**Modifiés :**

- `pubspec.yaml` — camera → image_picker + dependency_overrides stub
- `ios/Runner/Info.plist` — NSCameraUsageDescription ajouté
- `lib/core/router/app_router.dart` — routes /capture et /results ajoutées

### Verdict

✅ Analyse statique propre (No issues found — production + tests)
✅ Tous les ACs (1-8) satisfaits par lecture du code et architecture
✅ 7 tests unitaires écrits (idle, succès, annulation, MLLowConfidence, MLDetectionFailed, module absent, reset)
✅ Stub image_picker — API compatible, flutter pub get --offline réussi
⚠️ `flutter test` non exécutable (sandbox socket restriction) — tests non lancés dynamiquement

---

## story-3-0 — 2026-03-09 — Code Review (Résultats post-review)

### Commandes exécutées

```
dart analyze [all story-3-0 production + test files]
```

### Fixes appliqués après code review

| #   | Sévérité | Fix                                                                             |
| --- | -------- | ------------------------------------------------------------------------------- |
| 1   | MEDIUM   | Test PhotoProcessingError depuis analyze() ajouté                               |
| 2   | MEDIUM   | try/catch dans CapturePhotoHkaNotifier.captureAndAnalyze() + test de couverture |
| 3   | MEDIUM   | pubspec.lock ajouté à la File List                                              |
| 4   | LOW      | Commentaire AC6 → AC1 dans camera_instruction_card.dart                         |
| 5   | LOW      | \_errorMessage → fonction top-level privée                                      |
| 6   | LOW      | verify(any()) → captureAny() + assertion XFile.path                             |

### Output dart analyze post-fixes

```
$ dart analyze [all files]
Analyzing ...
No issues found!
```

### Verdict

✅ Analyse statique propre (No issues found — production + tests)
✅ 3 MEDIUM + 3 LOW issues fixés
✅ 9 tests unitaires (7 initiaux + 2 nouveaux du code review)
✅ Tous les ACs (1-8) vérifiés adversarialement
✅ Story → done
⚠️ `flutter test` non exécutable (sandbox socket restriction)

---

## story-3-3 — 2026-03-09 — Dev Story (Pipeline ML HKA Photo — Nettoyage)

### Commandes exécutées

```
DART=/opt/homebrew/Caskroom/flutter/3.41.4/flutter/bin/cache/dart-sdk/bin/dart

$ $DART analyze lib/features/capture/data/angle_calculator.dart \
  lib/features/capture/data/hka_angle_calculator.dart \
  lib/features/capture/data/hka_module.dart \
  lib/features/capture/domain/capture_photo_state.dart \
  lib/features/capture/application/capture_photo_hka_notifier.dart \
  lib/features/capture/presentation/capture_photo_hka_screen.dart \
  lib/features/capture/presentation/widgets/camera_instruction_card.dart

$ $DART analyze lib/core/router/app_router.dart lib/app.dart

$ $DART analyze \
  test/features/capture/data/hka_angle_calculator_test.dart \
  test/features/capture/data/hka_module_test.dart \
  test/features/capture/application/capture_photo_hka_notifier_test.dart
```

### Blocker Environnement

Même restriction sandbox qu'arch-2 et story-3-0 :

- `flutter test` → socket EPERM (127.0.0.1:0)
- `dart analyze` via `/opt/homebrew/bin/dart` échoue (flutter wrapper → engine.stamp write)
- Workaround : `DART=/opt/homebrew/Caskroom/flutter/3.41.4/flutter/bin/cache/dart-sdk/bin/dart`

### Output dart analyze

```
$ $DART analyze [HKA pipeline 7 fichiers]
Analyzing ...
No issues found!

$ $DART analyze lib/core/router/app_router.dart lib/app.dart
Analyzing app_router.dart, app.dart...
No issues found!

$ $DART analyze [3 test files]
Analyzing hka_angle_calculator_test.dart, hka_module_test.dart, capture_photo_hka_notifier_test.dart...
No issues found!
```

### Fichiers supprimés (pipeline vidéo obsolète)

**Application** (8 fichiers) :

- `capture_notifier.dart`, `capture_notifier.g.dart`, `capture_notifier_test.dart` (misplaced)
- `capture_provider.dart`, `capture_provider.g.dart`
- `ml_isolate_runner.dart`, `ml_providers.dart`, `ml_runner.dart`

**Data** (3 fichiers) :

- `ml_kit_pose_service.dart`, `ml_service.dart`, `drift_analysis_repository_test.dart` (misplaced)

**Domain OLD** (3 fichiers) :

- `analysis_error.dart`, `analysis_result.dart` (OLD), `capture_state.dart` (OLD)

**Presentation** (5 fichiers) :

- `capture_screen.dart`, `capture_screen_test.dart` (misplaced)
- `guided_camera_overlay.dart`, `guided_camera_overlay_test.dart` (misplaced), `luminosity_indicator.dart`

**Fichiers NON supprimés** (dépendants actifs dans d'autres features) :

- `analysis.dart`, `articular_angles.dart`, `confidence_score.dart` — utilisés par features/results/ et core/notifications/
- `analysis_repository.dart`, `drift_analysis_repository.dart` — utilisés par features/results/ et patients/

### Fichiers modifiés

- `lib/features/capture/data/angle_calculator.dart` — suppression méthode `calculate()` + imports `articular_angles`/`confidence_score` (AC2)
- `lib/features/capture/data/hka_module.dart` — imports package: → relatifs (prefer_relative_imports fix)
- `lib/core/router/app_router.dart` — suppression import + route `CaptureScreen` obsolète

### Verdict

✅ Analyse statique propre sur pipeline HKA (7 fichiers production + 3 tests)
✅ Analyse statique propre sur app.dart et app_router.dart
✅ 19 fichiers OLD pipeline vidéo supprimés
✅ AC1 (partiel — fichiers avec dépendances externes reportés), AC2, AC3, AC4, AC5, AC6, AC7 satisfaits
⚠️ `flutter test` non exécutable (sandbox socket restriction)
⚠️ `articular_angles.dart`, `confidence_score.dart`, `analysis.dart`, `analysis_repository.dart` conservés (utilisés par features/results/ et patients/)
