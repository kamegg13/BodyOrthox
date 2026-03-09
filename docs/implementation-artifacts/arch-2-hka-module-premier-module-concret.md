# Story arch-2: HKAModule — Premier Module Concret

Status: done

## Story

As a developer building the BodyOrthox analysis pipeline,
I want a concrete `HKAModule` that implements `AnalysisModule`, wraps Google ML Kit Pose Detection, and calculates the Hip-Knee-Ankle angle from a static photo,
so that the plugin architecture established in arch-1 is validated with a real implementation and the full registry-to-result pipeline is opérationnel.

## Acceptance Criteria

1. **Given** `features/capture/data/hka_module.dart` est créé **When** il est compilé **Then** `class HKAModule implements AnalysisModule` expose `moduleId = 'hka'`, `displayName = 'Analyse HKA'`, et `analyze(XFile photo)` — `PoseDetector` injecté en constructeur (pas instancié en dur, pour la testabilité).

2. **Given** `analyze(XFile photo)` est appelé **When** il s'exécute **Then** il crée un `InputImage.fromFilePath(photo.path)`, appelle `PoseDetector.processImage(inputImage)` en mode `PoseDetectionMode.single`, et extrait les landmarks `leftHip`, `leftKnee`, `leftAnkle`, `rightHip`, `rightKnee`, `rightAnkle`.

3. **Given** les 6 landmarks sont détectés avec likelihood ≥ 0.7 **When** `analyze()` retourne **Then** `AnalysisSuccess` contient les clés : `'hka_left'` (angle en degrés, 1 décimale), `'hka_right'`, `'confidence_left'` (moyenne likelihood H/K/A gauche), `'confidence_right'` — depuis `core/analysis/analysis_result.dart` (JAMAIS depuis `features/capture/domain/`).

4. **Given** la likelihood d'au moins un landmark HKA est < 0.7 **When** `analyze()` retourne **Then** `AnalysisFailure(MLLowConfidence(worstScore))` est retourné, où `worstScore` est le score de confiance le plus bas parmi les 6 landmarks.

5. **Given** `PoseDetector.processImage()` retourne une liste vide (aucune pose détectée) **When** `analyze()` retourne **Then** `AnalysisFailure(MLDetectionFailed())` est retourné.

6. **Given** `PoseDetector.processImage()` throw une exception (fichier corrompu, mémoire insuffisante, etc.) **When** `analyze()` retourne **Then** `AnalysisFailure(PhotoProcessingError(e.toString()))` est retourné — la méthode ne propage jamais d'exception vers le caller.

7. **Given** `HKAModule` est initialisé **When** `analyze()` a terminé (succès ou échec) **Then** `PoseDetector.close()` est appelé pour libérer les ressources ML Kit — implémenté via `try/finally`.

8. **Given** `app.dart` est modifié **When** l'app démarre **Then** le `ProviderScope.overrides` dans `BodyOrthoxApp.build()` enregistre `HKAModule` dans le registry via `analysisRegistryProvider.overrideWith(...)`.

9. **Given** un `MockPoseDetector` (mocktail) est configuré avec des landmarks connus **When** les tests unitaires de `HKAModule` s'exécutent **Then** tous les tests passent — aucun hardware ML Kit requis.

## Tasks / Subtasks

- [x] Tâche 1 — Créer `features/capture/data/hka_angle_calculator.dart` : calcul géométrique pur (AC: #3)
  - [x] `static double calculateHkaAngle(PoseLandmark hip, PoseLandmark knee, PoseLandmark ankle)` — réutilise `AngleCalculator.angleBetween()` existant
  - [x] `static double averageLikelihood(List<PoseLandmark> landmarks)` — moyenne likelihood pour score de confiance
  - [x] `static double minLikelihood(List<PoseLandmark> landmarks)` — score le plus bas (pour MLLowConfidence)
  - [x] Écrire `test/features/capture/data/hka_angle_calculator_test.dart` — tests purs sans ML Kit (coordonnées connues)

- [x] Tâche 2 — Créer `features/capture/data/hka_module.dart` : implémentation complète (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] `class HKAModule implements AnalysisModule`
  - [x] Constructeur : `HKAModule({PoseDetectorInterface Function()? detectorFactory})` — factory pour testabilité (Dev Notes Alt. recommandée)
  - [x] `analyze(XFile photo)` :
    - Créer `InputImage.fromFilePath(photo.path)`
    - `try { poses = await detector.processImage(inputImage) } finally { await detector.close() }`
    - Liste vide → `AnalysisFailure(MLDetectionFailed())`
    - Extraire landmarks gauche et droit
    - Vérifier likelihood des 6 landmarks → si min < 0.7 → `AnalysisFailure(MLLowConfidence(minScore))`
    - Calculer `hka_left`, `hka_right` via `HkaAngleCalculator.calculateHkaAngle()`
    - Retourner `AnalysisSuccess({'hka_left': ..., 'hka_right': ..., 'confidence_left': ..., 'confidence_right': ...})`
    - Catch `Exception` → `AnalysisFailure(PhotoProcessingError(e.toString()))`

- [x] Tâche 3 — Écrire `test/features/capture/data/hka_module_test.dart` (AC: #9)
  - [x] Créer `_MockPoseDetector` via mocktail (mock de `PoseDetectorInterface`)
  - [x] Test happy path : landmarks H/K/A avec likelihood ≥ 0.7 → `AnalysisSuccess` avec clés correctes
  - [x] Test MLLowConfidence : un landmark avec likelihood = 0.5 → `AnalysisFailure(MLLowConfidence(0.5))`
  - [x] Test MLDetectionFailed : `processImage()` retourne `[]` → `AnalysisFailure(MLDetectionFailed())`
  - [x] Test PhotoProcessingError : `processImage()` throw `Exception('io error')` → `AnalysisFailure(PhotoProcessingError('io error'))`
  - [x] Test `close()` toujours appelé : verify via mocktail que `_detector.close()` est invoqué dans tous les chemins

- [x] Tâche 4 — Enregistrer `HKAModule` dans `app.dart` (AC: #8)
  - [x] Modifier `BodyOrthoxApp.build()` : ajouter override `analysisRegistryProvider` dans `ProviderScope.overrides`
  - [x] `HKAModule()` — factory PoseDetector par défaut (PoseDetectionMode.single créé dans analyze())

- [x] Tâche 5 — Valider avec `flutter test` (AC: #9)
  - [x] `flutter test test/features/capture/data/` — 21/21 verts
  - [x] `flutter test` (suite complète) — 123/123, 0 régression

## Dev Notes

### Contexte Architecture Plugin

`HKAModule` est le premier module concret du plugin pattern. Il valide que l'interface `AnalysisModule` (arch-1) est implémentable avec un vrai algorithme ML. L'invariant critique : **`HKAModule` ne connaît pas les features de l'app** — il ne fait que recevoir un `XFile`, exécuter ML Kit, et retourner un `AnalysisResult`.

### Réutilisation de `AngleCalculator`

`features/capture/data/angle_calculator.dart` contient déjà `AngleCalculator.angleBetween(PoseLandmark a, b, c)` — implémentation correcte par loi des cosinus. `HkaAngleCalculator.calculateHkaAngle(hip, knee, ankle)` DOIT déléguer à cette méthode pour éviter la duplication :

```dart
// hka_angle_calculator.dart
import 'angle_calculator.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';

class HkaAngleCalculator {
  static double calculateHkaAngle(
    PoseLandmark hip,
    PoseLandmark knee,
    PoseLandmark ankle,
  ) => AngleCalculator.angleBetween(hip, knee, ankle);
  // Angle hip→knee→ankle = angle HKA (≈180° jambe droite)
}
```

**Pourquoi créer `HkaAngleCalculator` quand `AngleCalculator` existe déjà ?**

- `AngleCalculator` est conçu pour la vidéo multi-frames (agrégation médiane, `ArticularAngles` retourné) — couplé aux vieux types domain
- `HkaAngleCalculator` est un wrapper minimal qui expose une API HKA-spécifique sans dépendance aux vieux types
- Séparation des préoccupations : `AngleCalculator` → pipeline vidéo (legacy), `HkaAngleCalculator` → plugin HKA

### ML Kit Pose Detection — API critique

**Mode single (photo statique) :**

```dart
PoseDetector(
  options: PoseDetectorOptions(mode: PoseDetectionMode.single),
)
```

`PoseDetectionMode.single` est obligatoire pour photo statique. `PoseDetectionMode.stream` est pour vidéo en flux — il maintient un état interne entre frames qui biaise les résultats sur photo unique.

**InputImage depuis XFile :**

```dart
final inputImage = InputImage.fromFilePath(photo.path);
```

`InputImage.fromFilePath()` lit le fichier JPEG/PNG depuis le path. Pas de metadata manuelle requise (contrairement à `InputImage.fromBytes()` qui nécessite taille + rotation + format — voir `ml_kit_pose_service.dart:41-49`).

**Landmarks HKA :**

```dart
final leftHip   = pose.landmarks[PoseLandmarkType.leftHip];
final leftKnee  = pose.landmarks[PoseLandmarkType.leftKnee];
final leftAnkle = pose.landmarks[PoseLandmarkType.leftAnkle];
final rightHip   = pose.landmarks[PoseLandmarkType.rightHip];
final rightKnee  = pose.landmarks[PoseLandmarkType.rightKnee];
final rightAnkle = pose.landmarks[PoseLandmarkType.rightAnkle];
```

`pose.landmarks` est une `Map<PoseLandmarkType, PoseLandmark>`. Si un landmark n'est pas détecté, il peut être absent de la map → vérifier null avant accès.

**Likelihood :**

```dart
final double score = landmark.likelihood; // 0.0 - 1.0
```

Seuil de confiance : **0.7** (calibré pour la détection HKA sur photo face antérieure).

**Dispose obligatoire :**

```dart
// PoseDetector doit être fermé après usage — sinon memory leak iOS
await _detector.close(); // dans un finally
```

**Coordonnées landmarks :**
`PoseLandmark.x` et `PoseLandmark.y` sont des coordonnées **absolues en pixels** dans l'image (pas normalisées 0-1). La loi des cosinus de `AngleCalculator.angleBetween()` fonctionne avec des coordonnées absolues ou normalisées (l'angle est invariant à la mise à l'échelle uniforme).

### Interprétation angle HKA

| Angle HKA | Interprétation clinique        |
| --------- | ------------------------------ |
| < 177°    | Genu varum (jambes arquées)    |
| 177°–183° | Alignement neutre              |
| > 183°    | Genu valgum (genoux en dedans) |

Ces normes sont stockées dans Story 3.4 (`features/results/domain/reference_norms.dart`). `HKAModule` ne connaît pas ces normes — il retourne uniquement l'angle brut.

### Seuil de confiance — décision architecture

Le seuil 0.7 est défini **dans `HKAModule`** (pas dans l'interface). Chaque module peut définir son propre seuil selon les caractéristiques de son algorithme. Le `AnalysisModule` n'expose pas de seuil — c'est une décision interne du module.

```dart
// Dans hka_module.dart
static const double _confidenceThreshold = 0.7;
```

### Import CRITIQUE — utiliser uniquement `core/analysis/`

```dart
// ✅ CORRECT
import 'package:bodyorthox/core/analysis/analysis_result.dart';
import 'package:bodyorthox/core/analysis/analysis_module.dart';

// ❌ INTERDIT — ancien type pré-pivot
import 'package:bodyorthox/features/capture/domain/analysis_result.dart';
```

`features/capture/domain/analysis_result.dart` est l'ANCIENNE version (`ArticularAngles`, `ConfidenceScore`) — elle sera supprimée en Story 3.3. `HKAModule` doit EXCLUSIVEMENT utiliser les types de `core/analysis/`.

### Enregistrement dans `app.dart`

```dart
// Dans BodyOrthoxApp.build()
ProviderScope(
  overrides: [
    appConfigProvider.overrideWithValue(config),         // déjà présent
    analysisRegistryProvider.overrideWith((ref) {        // AJOUTER
      final registry = AnalysisRegistry();
      registry.register(
        HKAModule(
          detector: PoseDetector(
            options: PoseDetectorOptions(
              mode: PoseDetectionMode.single,
            ),
          ),
        ),
      );
      return registry;
    }),
  ],
  child: const _BodyOrthoxRouter(),
)
```

**⚠️ Cycle de vie du `PoseDetector` :** instancié une fois au démarrage, utilisé à chaque `analyze()` mais fermé dans le `finally` de chaque appel. Cela signifie qu'un nouveau `PoseDetector` doit être créé à chaque `analyze()` si `close()` est appelé dedans.

**Alternative recommandée :** créer le `PoseDetector` dans `analyze()` lui-même (stateless HKAModule) :

```dart
@override
Future<AnalysisResult> analyze(XFile photo) async {
  final detector = PoseDetector(
    options: PoseDetectorOptions(mode: PoseDetectionMode.single),
  );
  try {
    // ... analyse
  } finally {
    await detector.close();
  }
}
```

Dans ce cas, le constructeur `HKAModule` ne prend PAS de `PoseDetector` en param — mais **pour les tests**, injecter une factory est nécessaire. Utiliser une factory function injectable :

```dart
typedef PoseDetectorFactory = PoseDetector Function();

class HKAModule implements AnalysisModule {
  final PoseDetectorFactory _detectorFactory;

  HKAModule({PoseDetectorFactory? detectorFactory})
      : _detectorFactory = detectorFactory ??
            () => PoseDetector(
                  options: PoseDetectorOptions(
                    mode: PoseDetectionMode.single,
                  ),
                );
}
```

→ En production : `HKAModule()` (factory par défaut). En test : `HKAModule(detectorFactory: () => mockDetector)`.

### Tests — mocktail pour PoseDetector

`PoseDetector` n'est pas une abstract class — il ne peut pas être directement mocké avec mocktail. Deux options :

**Option A — Wrapper abstrait (recommandé pour testabilité) :**

```dart
// dans hka_module.dart — abstraction locale
abstract class _PoseDetectorInterface {
  Future<List<Pose>> processImage(InputImage image);
  Future<void> close();
}

class _RealPoseDetector implements _PoseDetectorInterface {
  final PoseDetector _detector;
  _RealPoseDetector(this._detector);
  @override Future<List<Pose>> processImage(InputImage image) => _detector.processImage(image);
  @override Future<void> close() => _detector.close();
}
```

Puis injecter `_PoseDetectorInterface` — mocktail peut le mock.

**Option B — Injection de processImage comme fonction :**

```dart
// Paramètre de test uniquement
@visibleForTesting
HKAModule.forTesting({required Future<List<Pose>> Function(InputImage) processImageFn, ...})
```

Le Dev Agent choisit l'option la plus simple qui permet les tests AC#9.

### Project Structure Notes

```
lib/
  features/
    capture/
      data/
        hka_module.dart             ← CRÉER (AC1-7)
        hka_angle_calculator.dart   ← CRÉER (Tâche 1)
        angle_calculator.dart       ← EXISTANT — réutiliser
        ml_kit_pose_service.dart    ← EXISTANT — référence API, ne pas modifier
  app.dart                          ← MODIFIER : ajouter ProviderScope override (AC8)

test/
  features/
    capture/
      data/
        hka_module_test.dart        ← CRÉER (Tâche 3)
        hka_angle_calculator_test.dart ← CRÉER (Tâche 1)
```

**Note sur `angle_calculator.dart` existant :**
Ce fichier importe les OLD domain types (`articular_angles.dart`, `confidence_score.dart`). `HkaAngleCalculator` ne doit importer que `angle_calculator.dart` et `google_mlkit_pose_detection` — pas les vieux types.

**Conflit potentiel :** deux `AnalysisResult` coexistent :

- `lib/core/analysis/analysis_result.dart` — ✅ CORRECT — `HKAModule` l'utilise
- `lib/features/capture/domain/analysis_result.dart` — ⚠️ ANCIEN — sera supprimé en Story 3.3

**Ne pas importer les deux dans le même fichier** — conflit de noms à la compilation.

### Imports requis

```dart
// hka_module.dart
import 'package:cross_file/cross_file.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';
import 'package:bodyorthox/core/analysis/analysis_module.dart';
import 'package:bodyorthox/core/analysis/analysis_result.dart';
import 'hka_angle_calculator.dart';

// hka_angle_calculator.dart
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';
import 'angle_calculator.dart';

// app.dart (ajout)
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';
import 'core/analysis/analysis_provider.dart';
import 'core/analysis/analysis_registry.dart';
import 'features/capture/data/hka_module.dart';

// hka_module_test.dart
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';
import 'package:mocktail/mocktail.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bodyorthox/features/capture/data/hka_module.dart';
import 'package:bodyorthox/core/analysis/analysis_result.dart';
```

### Dépendances de cette story

- **Prérequis :** arch-1 (AnalysisModule, AnalysisRegistry, analysisRegistryProvider) — **DONE** ✅
- **Bloque :** Story 3.0 (capture photo HKA — utilise `HKAModule` via registry), Story 3.3 (pipeline ML — remplace `MlKitPoseService` par `HKAModule`)

### References

- [Source: docs/planning-artifacts/sprint-change-proposal-2026-03-08.md#Section-4.1] — Story A.2 — HKAModule description
- [Source: docs/planning-artifacts/sprint-change-proposal-2026-03-08.md#Section-4.3] — Réécriture Story 3.3 : `PoseDetector.processImage()` → landmarks H/K/A → angle HKA
- [Source: docs/implementation-artifacts/arch-1-interface-analysis-module.md] — Interface `AnalysisModule`, `AnalysisRegistry`, `AnalysisResult` dans `core/analysis/`
- [Source: bodyorthox/lib/features/capture/data/angle_calculator.dart] — `AngleCalculator.angleBetween()` réutilisable
- [Source: bodyorthox/lib/features/capture/data/ml_kit_pose_service.dart] — API ML Kit : `processImage()`, `close()`, `InputImage.fromBytes()`
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-nommage] — snake_case / PascalCase / camelCase
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-structure] — `data/domain/application/presentation`
- [Source: docs/implementation-artifacts/sprint-status.yaml] — séquence arch-1 → arch-2 → Epic 3

## Mockup de référence

Aucun mockup UI — story purement technique (couche `data`, aucun composant UI).

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fix 1 — Lambda multiligne dans initializer list Dart : syntax error. Solution : méthode statique `_defaultDetectorFactory()` référencée par le `??` dans le constructeur.
- Fix 2 — `any()` mocktail sur `InputImage` (type non-nullable) requiert `registerFallbackValue(_FakeInputImage())` dans `setUpAll()`.

### Completion Notes List

- Implémentation `PoseDetectorInterface` (abstraction interne) + `_RealPoseDetector` (wrapper production) → testabilité sans hardware ML Kit.
- `HKAModule` stateless : `PoseDetector` créé ET fermé dans chaque appel `analyze()` via factory (`try/finally`). Zéro memory leak iOS.
- `HkaAngleCalculator` délègue à `AngleCalculator.angleBetween()` — pas de duplication du calcul trigonométrique.
- 21 nouveaux tests (10 calculator + 11 module), 123/123 suite complète, 0 régression.
- Choix Dev Notes "Alternative recommandée" (factory) vs AC#1 littéral (PoseDetector direct) : factory choisie car `PoseDetector.close()` dans `finally` impose recréation à chaque appel.

### File List

- `bodyorthox/lib/features/capture/data/hka_angle_calculator.dart` — créé (Tâche 1)
- `bodyorthox/lib/features/capture/data/hka_module.dart` — créé (Tâches 2+3)
- `bodyorthox/lib/app.dart` — modifié : ajout override `analysisRegistryProvider` (Tâche 4)
- `bodyorthox/test/features/capture/data/hka_angle_calculator_test.dart` — créé (Tâche 1)
- `bodyorthox/test/features/capture/data/hka_module_test.dart` — créé (Tâche 3)
- `docs/implementation-artifacts/arch-2-hka-module-premier-module-concret.md` — mis à jour (status, tasks, record)
- `docs/implementation-artifacts/sprint-status.yaml` — mis à jour (review)

## Change Log

- 2026-03-08 — Implémentation complète arch-2 : `HkaAngleCalculator`, `HKAModule`, enregistrement dans `app.dart`, 21 tests unitaires (123/123 suite) — claude-sonnet-4-6
