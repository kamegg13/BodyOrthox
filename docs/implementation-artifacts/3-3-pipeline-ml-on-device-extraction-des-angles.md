# Story 3.3 : Pipeline ML On-Device & Extraction des Angles

Status: done

<!-- Validé contre checklist create-story — Story 3.3, Epic 3 (Capture Guidée & Analyse ML) -->

---

## Story

As a practitioner,
I want the app to analyze the captured video on-device and extract articular angles automatically,
So that I get clinical measurements in ~20 seconds without any data leaving the device.

---

## Acceptance Criteria

**AC1 — Pipeline ML en isolate, vidéo jamais sur disque (NFR-S5)**
**Given** une vidéo de marche vient d'être enregistrée
**When** l'analyse démarre en arrière-plan via `ml_isolate_runner.dart`
**Then** Google ML Kit extrait les poses frame par frame dans un Flutter isolate dédié
**And** la vidéo brute n'est jamais écrite sur disque — elle vit uniquement en mémoire RAM de l'isolate (NFR-S5, FR13)
**And** les frames sont transmis à l'isolate via `SendPort` depuis le thread principal

**AC2 — Extraction des angles articulaires & sealed class AnalysisResult**
**Given** le pipeline ML s'exécute dans l'isolate
**When** Google ML Kit a traité tous les frames
**Then** les angles articulaires (genou, hanche, cheville) sont calculés à partir des poses extraites
**And** le résultat est retourné via `ReceivePort` sous forme de `AnalysisResult` sealed class
**And** `AnalysisSuccess` contient un objet `ArticularAngles` (angles en degrés, 1 décimale)
**And** `AnalysisFailure` contient une `AnalysisError` typée (MLLowConfidence, MLDetectionFailed, VideoProcessingError)

**AC3 — Score de confiance par articulation (FR16)**
**Given** les poses sont extraites par ML Kit
**When** les angles sont calculés
**Then** un score de confiance (`ConfidenceScore`) est calculé pour chaque articulation (genou, hanche, cheville)
**And** le score est un double entre 0.0 et 1.0
**And** un score < 0.7 est considéré comme faible et déclenche `MLLowConfidence` ou un flag sur `ArticularAngles`

**AC4 — Performance < 30s dans 95% des cas (NFR-P1)**
**Given** le pipeline ML tourne dans l'isolate
**When** l'analyse d'une vidéo de marche standard (~12 secondes, 30 FPS) est lancée
**Then** l'analyse complète (extraction pose + calcul angles + persistance) se termine en < 30 secondes dans 95% des cas
**And** l'objectif cible est ~20 secondes sur iPhone 12+
**And** le thread UI n'est jamais bloqué pendant l'analyse (Impeller maintient ≥ 58 FPS) (NFR-P2)

**AC5 — Notification locale "Analyse prête" (FR14)**
**Given** le pipeline ML a terminé (succès ou échec)
**When** l'isolate retourne le résultat via `ReceivePort`
**Then** une notification locale est envoyée : "L'analyse de [Nom Patient] est prête — [angle genou]°/[angle hanche]°/[angle cheville]°" (FR40)
**And** la notification utilise `flutter_local_notifications` uniquement — zéro APNs ni réseau (FR29)
**And** tapper la notification naviguera vers l'écran résultats via deep link go_router (géré en Story 6.3)

**AC6 — Suppression de la vidéo brute avec confirmation (FR19)**
**Given** l'analyse est terminée (succès ou échec)
**When** le résultat est retourné
**Then** la mémoire de l'isolate est libérée — la vidéo brute disparaît automatiquement à la fin de l'isolate
**And** une confirmation est proposée au praticien : "La vidéo brute a été supprimée. Seules les données d'analyse sont conservées."
**And** cette confirmation informe seulement (la suppression est automatique via libération mémoire de l'isolate)

**AC7 — Atomicité : zéro données corrompues en cas d'échec (NFR-R2)**
**Given** l'analyse échoue pour quelque raison que ce soit (erreur ML, crash isolate, timeout)
**When** `AnalysisFailure` est retourné
**Then** aucune donnée partielle n'est persistée en base Drift (transaction rollback automatique)
**And** la base de données reste dans un état cohérent (NFR-R5)
**And** `CaptureNotifier` passe à l'état `CaptureFailed` avec l'erreur typée

**AC8 — Taux d'échec ML < 5% sur vidéos correctement filmées (NFR-R4)**
**Given** une vidéo filmée selon le guidage de Story 3.1 (profil strict, luminosité suffisante)
**When** le pipeline ML traite la vidéo
**Then** le taux d'échec (MLDetectionFailed) est < 5%
**And** les vidéos à faible confiance (score < 0.7) retournent `MLLowConfidence` (récupérable manuellement en Story 3.5)

---

## Tasks / Subtasks

- [ ] **T1 — Créer les modèles de domaine** (AC: 2, 3)
  - [ ] T1.1 — Créer `lib/features/capture/domain/analysis_result.dart` — sealed class `AnalysisResult` + `AnalysisSuccess` + `AnalysisFailure`
  - [ ] T1.2 — Créer `lib/features/capture/domain/analysis_error.dart` — sealed class `AnalysisError` + sous-types
  - [ ] T1.3 — Créer `lib/features/capture/domain/articular_angles.dart` — Freezed `ArticularAngles` (knee, hip, ankle en double, 1 décimale)
  - [ ] T1.4 — Créer `lib/features/capture/domain/confidence_score.dart` — Freezed `ConfidenceScore` (kneeScore, hipScore, ankleScore en double 0.0-1.0)
  - [ ] T1.5 — Mettre à jour `lib/features/capture/domain/analysis.dart` (Freezed) pour inclure `ArticularAngles` + `ConfidenceScore` + timestamps ISO 8601
  - [ ] T1.6 — Exécuter `dart run build_runner build --delete-conflicting-outputs` et valider les fichiers `.freezed.dart`

- [ ] **T2 — Créer le service ML Kit** (AC: 1, 2, 3, 4)
  - [ ] T2.1 — Ajouter `google_mlkit_pose_detection: ^0.11.0` dans `pubspec.yaml` (décommenter la ligne commentée en Story 1.1)
  - [ ] T2.2 — Exécuter `flutter pub get` et valider l'absence de conflit avec `sqlcipher_flutter_libs`
  - [ ] T2.3 — Créer `lib/features/capture/data/ml_service.dart` — abstract class `MlService` avec méthode `Future<List<Pose>> extractPoses(List<InputImage> frames)`
  - [ ] T2.4 — Créer `lib/features/capture/data/ml_kit_pose_service.dart` — implémentation `MlKitPoseService implements MlService` utilisant `PoseDetector` de `google_mlkit_pose_detection`
  - [ ] T2.5 — Configurer `PoseDetector` avec mode `PoseDetectionMode.stream` pour performance maximale sur séquence de frames
  - [ ] T2.6 — Créer `lib/features/capture/data/angle_calculator.dart` — calcul des angles articulaires à partir des landmarks ML Kit
  - [ ] T2.7 — Créer `lib/features/capture/data/ml_service_test.dart` — tests unitaires avec frames mocktés

- [ ] **T3 — Implémenter l'isolate runner** (AC: 1, 2, 4)
  - [ ] T3.1 — Créer `lib/features/capture/application/ml_isolate_runner.dart`
  - [ ] T3.2 — Implémenter la fonction top-level `_mlIsolateEntry(SendPort sendPort)` (obligatoire : les fonctions d'isolate doivent être top-level ou static)
  - [ ] T3.3 — Implémenter `MlIsolateRunner.run(List<Uint8List> frameBytes, IsolateConfig config)` → retourne `Future<AnalysisResult>`
  - [ ] T3.4 — Établir le canal `SendPort`/`ReceivePort` bidirectionnel pour envoyer les frames et recevoir `AnalysisResult`
  - [ ] T3.5 — S'assurer que les `Uint8List` (frames) ne franchissent pas la barrière d'isolate en copie inutile — utiliser `TransferableTypedData` si disponible
  - [ ] T3.6 — Gérer le timeout de l'isolate (max 30s — au-delà, `Isolate.kill()` + retourner `VideoProcessingError`)
  - [ ] T3.7 — Créer `lib/features/capture/application/ml_isolate_runner_test.dart` — tests avec isolate mocké

- [ ] **T4 — Implémenter le calcul des angles à partir des poses ML Kit** (AC: 2, 3)
  - [ ] T4.1 — Dans `angle_calculator.dart`, implémenter `calculateKneeAngle(Pose pose)` : angle entre hip → knee → ankle
  - [ ] T4.2 — Implémenter `calculateHipAngle(Pose pose)` : angle entre shoulder → hip → knee
  - [ ] T4.3 — Implémenter `calculateAnkleAngle(Pose pose)` : angle entre knee → ankle → footIndex
  - [ ] T4.4 — Utiliser les landmarks : `PoseLandmarkType.leftHip`, `leftKnee`, `leftAnkle`, `leftShoulder`, `leftFootIndex`
  - [ ] T4.5 — Calculer le score de confiance par articulation à partir de `landmark.likelihood` (moyenne des landmarks impliqués)
  - [ ] T4.6 — Agréger les angles sur tous les frames (pic/moyenne selon la métrique clinique choisie) → retourner l'angle représentatif
  - [ ] T4.7 — Arrondir à 1 décimale : `(angle * 10).round() / 10`

- [ ] **T5 — Implémenter CaptureNotifier et la persistance** (AC: 2, 7)
  - [ ] T5.1 — Mettre à jour `lib/features/capture/application/capture_notifier.dart` pour orchestrer le pipeline ML via `MlIsolateRunner`
  - [ ] T5.2 — Implémenter la transition d'état : `CaptureRecording` → `CaptureProcessing` → `CaptureCompleted` ou `CaptureFailed`
  - [ ] T5.3 — Sur `AnalysisSuccess` : persister en base via `DriftAnalysisRepository` dans une **transaction Drift atomique**
  - [ ] T5.4 — Sur `AnalysisFailure` : ne rien persister — état `CaptureFailed(error)` uniquement
  - [ ] T5.5 — Vérifier que le `switch` sur `AnalysisResult` est **exhaustif** (Dart 3 sealed class)
  - [ ] T5.6 — Créer `lib/features/capture/data/analysis_repository.dart` — abstract `AnalysisRepository` avec `Future<void> save(Analysis analysis)` (transaction atomique)
  - [ ] T5.7 — Créer `lib/features/capture/data/drift_analysis_repository.dart` — implémentation Drift avec `db.transaction()`
  - [ ] T5.8 — Créer `lib/features/capture/data/analysis_dao.dart` — DAO Drift pour la table `analyses`

- [ ] **T6 — Implémenter la notification locale** (AC: 5)
  - [ ] T6.1 — Confirmer que `flutter_local_notifications` est initialisé dans `core/config/app_config.dart` ou `main_dev/prod.dart` (configuré en Story 1.1 — vérifier)
  - [ ] T6.2 — Créer `lib/core/notifications/notification_service.dart` (si non existant) — wrapping `FlutterLocalNotificationsPlugin`
  - [ ] T6.3 — Depuis `CaptureNotifier`, appeler `NotificationService.showAnalysisReady(patientName, angles)` après persistance réussie
  - [ ] T6.4 — Format du titre : "Analyse prête" — Corps : "L'analyse de [Nom Patient] est prête — [knee]°/[hip]°/[ankle]°"
  - [ ] T6.5 — Zéro réseau dans cette notification — `flutter_local_notifications` uniquement

- [ ] **T7 — Implémenter la suppression vidéo brute avec confirmation** (AC: 6)
  - [ ] T7.1 — À la fin de l'isolate (succès ou échec), la mémoire est libérée automatiquement — documenter ce comportement dans le code
  - [ ] T7.2 — Dans `CaptureScreen`, afficher un `CupertinoAlertDialog` informatif post-analyse : "La vidéo a été supprimée. Seules les données cliniques sont conservées."
  - [ ] T7.3 — Ce dialog est purement informatif (bouton "OK" uniquement) — la suppression est structurelle, pas une action utilisateur

- [ ] **T8 — Tests unitaires et d'intégration** (AC: tout)
  - [ ] T8.1 — `ml_service_test.dart` : tester l'extraction de poses sur frames fictifs (mocktail)
  - [ ] T8.2 — `ml_isolate_runner_test.dart` : tester la communication SendPort/ReceivePort avec isolate mock
  - [ ] T8.3 — `capture_notifier_test.dart` (riverpod_test) : tester les transitions d'état CaptureRecording → CaptureCompleted/CaptureFailed
  - [ ] T8.4 — `drift_analysis_repository_test.dart` : tester l'atomicité de la transaction (rollback sur erreur)
  - [ ] T8.5 — Tests co-localisés : chaque fichier test adjacent au fichier source

- [ ] **T9 — Validation finale**
  - [ ] T9.1 — `flutter analyze` : 0 erreurs, 0 warnings
  - [ ] T9.2 — `flutter test` : tous les tests passent
  - [ ] T9.3 — Sur device physique iPhone 12+ : pipeline complet < 30s (mesurer avec `Stopwatch`)
  - [ ] T9.4 — Vérifier via Charles Proxy ou Network Link Conditioner : zéro requête réseau pendant l'analyse (NFR-S3)
  - [ ] T9.5 — Vérifier via Instruments Xcode : la vidéo n'existe jamais en tant que fichier sur le système de fichiers (NFR-S5)

---

## Dev Notes

### Contexte critique de cette story

Story 3.3 est la **story la plus complexe du projet**. Elle implémente le cœur technique de BodyOrthox : le pipeline ML on-device. Toutes les autres stories de l'Epic 3 en dépendent (3.4 affiche les résultats produits ici, 3.5 permet la correction des données générées ici).

**Dépendances sur les stories précédentes :**

- Story 1.1 : structure Feature-First, `capture/` dossier créé — **vérifier que les stubs existent**
- Story 1.3 : `app_database.dart` avec SQLCipher opérationnel + `database_provider.dart` — **prérequis pour la persistance**
- Story 3.1 : `CaptureNotifier` avec états `CaptureIdle/CaptureRecording` — **étendre, ne pas recréer**
- Story 3.2 : le flux de démarrage enregistrement est en place — **cette story prend le relais après l'arrêt de l'enregistrement**

**Ce que cette story produit pour les stories suivantes :**

- `AnalysisResult` sealed class → consommée par Story 3.4 (affichage) et Story 3.5 (replay/correction)
- `ArticularAngles` + `ConfidenceScore` → affichés dans `ArticularAngleCard` (Story 3.4)
- `Analysis` persistée en Drift → source de données pour Epic 4 (PDF) et Epic 2 (historique)

### Architecture du pipeline ML (critique)

```
CaptureScreen (UI thread)
  ↓ stop recording → List<Uint8List> frameBytes (en mémoire)
CaptureNotifier.startAnalysis(frameBytes, patientName)
  ↓ état → CaptureProcessing
MlIsolateRunner.run(frameBytes, config)
  ↓ Isolate.spawn(_mlIsolateEntry, sendPort)
  ↓ frames envoyés via SendPort (TransferableTypedData)
  [ISOLATE — thread séparé, mémoire isolée]
    MlKitPoseService.extractPoses(frames)
      ↓ PoseDetector.processImage() × N frames
    AngleCalculator.calculate(poses)
      ↓ angles articulaires + scores de confiance
    AnalysisResult (AnalysisSuccess ou AnalysisFailure)
  [FIN ISOLATE — mémoire libérée automatiquement]
  ↓ résultat via ReceivePort
CaptureNotifier reçoit AnalysisResult
  ↓ si AnalysisSuccess → db.transaction() → DriftAnalysisRepository.save()
  ↓ NotificationService.showAnalysisReady()
  ↓ état → CaptureCompleted(result) ou CaptureFailed(error)
```

**Source :** [Source: docs/planning-artifacts/architecture.md#Frontières-architecturales]

### Implémentations obligatoires

#### `lib/features/capture/domain/analysis_result.dart`

```dart
/// Résultat du pipeline ML — sealed class Dart 3 obligatoire.
/// [Source: docs/planning-artifacts/architecture.md#Communication-Gestion-des-erreurs]
sealed class AnalysisResult {
  const AnalysisResult();
}

final class AnalysisSuccess extends AnalysisResult {
  final ArticularAngles angles;
  final ConfidenceScore confidence;
  const AnalysisSuccess({required this.angles, required this.confidence});
}

final class AnalysisFailure extends AnalysisResult {
  final AnalysisError error;
  const AnalysisFailure(this.error);
}
```

#### `lib/features/capture/domain/analysis_error.dart`

```dart
/// Erreurs typées du pipeline ML — switch exhaustif obligatoire côté consommateur.
/// [Source: docs/planning-artifacts/architecture.md#Gestion-erreurs-ML]
sealed class AnalysisError {
  const AnalysisError();
}

/// Score de confiance insuffisant — récupérable via correction manuelle (Story 3.5)
final class MLLowConfidence extends AnalysisError {
  final double score; // Score global 0.0-1.0
  const MLLowConfidence(this.score);
}

/// ML Kit n'a pas pu détecter de pose sur les frames fournis
final class MLDetectionFailed extends AnalysisError {
  const MLDetectionFailed();
}

/// Erreur de traitement vidéo (timeout, mémoire, frames corrompus)
final class VideoProcessingError extends AnalysisError {
  final String cause;
  const VideoProcessingError(this.cause);
}
```

#### `lib/features/capture/domain/articular_angles.dart`

```dart
import 'package:freezed_annotation/freezed_annotation.dart';
part 'articular_angles.freezed.dart';
part 'articular_angles.g.dart';

/// Angles articulaires en degrés — 1 décimale, immutables.
/// [Source: docs/planning-artifacts/architecture.md#Patterns-de-format]
@freezed
class ArticularAngles with _$ArticularAngles {
  const factory ArticularAngles({
    required double kneeAngle,   // Ex: 42.3 degrés
    required double hipAngle,    // Ex: 67.1 degrés
    required double ankleAngle,  // Ex: 88.5 degrés
  }) = _ArticularAngles;

  factory ArticularAngles.fromJson(Map<String, dynamic> json) =>
      _$ArticularAnglesFromJson(json);
}
```

#### `lib/features/capture/domain/confidence_score.dart`

```dart
import 'package:freezed_annotation/freezed_annotation.dart';
part 'confidence_score.freezed.dart';
part 'confidence_score.g.dart';

/// Score de confiance ML par articulation — valeur 0.0 à 1.0.
/// Seuil critique : < 0.7 → correction manuelle suggérée (Story 3.5).
/// [Source: docs/planning-artifacts/epics.md#Story-3.3-AC3]
@freezed
class ConfidenceScore with _$ConfidenceScore {
  const factory ConfidenceScore({
    required double kneeScore,
    required double hipScore,
    required double ankleScore,
  }) = _ConfidenceScore;

  factory ConfidenceScore.fromJson(Map<String, dynamic> json) =>
      _$ConfidenceScoreFromJson(json);
}

// Extension pour évaluation du seuil
extension ConfidenceScoreX on ConfidenceScore {
  static const double _threshold = 0.7;

  bool get isKneeLowConfidence  => kneeScore  < _threshold;
  bool get isHipLowConfidence   => hipScore   < _threshold;
  bool get isAnkleLowConfidence => ankleScore < _threshold;

  double get globalScore => (kneeScore + hipScore + ankleScore) / 3.0;
  bool get hasLowConfidence => globalScore < _threshold;
}
```

#### `lib/features/capture/application/ml_isolate_runner.dart`

```dart
import 'dart:isolate';
import 'dart:typed_data';

/// Runner du pipeline ML dans un Flutter isolate dédié.
///
/// CRITIQUE NFR-S5 : Les frames vidéo vivent UNIQUEMENT dans cet isolate.
/// La vidéo brute n'est jamais écrite sur disque — elle est libérée automatiquement
/// à la fin de l'isolate (fin de portée mémoire).
///
/// [Source: docs/planning-artifacts/architecture.md#Stratégie-vidéo-en-mémoire]
class MlIsolateRunner {
  static const Duration _timeout = Duration(seconds: 30); // NFR-P1

  /// Lance l'analyse ML dans un isolate dédié.
  /// [frameBytes] : frames en mémoire — ne pas persister avant ou après.
  /// [patientSide] : 'left' ou 'right' pour sélectionner les bons landmarks.
  static Future<AnalysisResult> run({
    required List<Uint8List> frameBytes,
    required String patientSide,
  }) async {
    final receivePort = ReceivePort();
    final isolate = await Isolate.spawn(
      _mlIsolateEntry,
      _IsolateMessage(
        sendPort: receivePort.sendPort,
        frameBytes: frameBytes.map(TransferableTypedData.fromList).toList(),
        patientSide: patientSide,
      ),
    );

    try {
      final result = await receivePort.first.timeout(
        _timeout,
        onTimeout: () {
          isolate.kill(priority: Isolate.immediate);
          return AnalysisFailure(
            VideoProcessingError('Timeout après ${_timeout.inSeconds}s'),
          );
        },
      );
      return result as AnalysisResult;
    } finally {
      receivePort.close();
    }
  }
}

/// Point d'entrée de l'isolate — DOIT être une fonction top-level (contrainte Dart).
/// [Source: docs/planning-artifacts/architecture.md#Pipeline-ML]
void _mlIsolateEntry(_IsolateMessage message) async {
  // TODO: Implémenter l'extraction ML Kit + calcul angles
  // 1. Reconstruire les frames depuis TransferableTypedData
  // 2. MlKitPoseService.extractPoses(frames)
  // 3. AngleCalculator.calculate(poses)
  // 4. Retourner AnalysisResult via SendPort
  message.sendPort.send(/* AnalysisResult */);
}

class _IsolateMessage {
  final SendPort sendPort;
  final List<TransferableTypedData> frameBytes;
  final String patientSide;

  const _IsolateMessage({
    required this.sendPort,
    required this.frameBytes,
    required this.patientSide,
  });
}
```

#### `lib/features/capture/data/angle_calculator.dart`

```dart
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';
import 'dart:math' as math;

/// Calcule les angles articulaires à partir des landmarks ML Kit.
/// Angles en degrés (double), arrondis à 1 décimale.
/// [Source: docs/planning-artifacts/epics.md#Story-3.3]
class AngleCalculator {

  /// Calcule l'angle en un point B entre les segments BA et BC.
  /// Utilise la loi des cosinus : angle = acos((BA · BC) / (|BA| × |BC|))
  static double _angleBetween(
    PoseLandmark a,
    PoseLandmark b,
    PoseLandmark c,
  ) {
    final dx1 = a.x - b.x;
    final dy1 = a.y - b.y;
    final dx2 = c.x - b.x;
    final dy2 = c.y - b.y;

    final dot = dx1 * dx2 + dy1 * dy2;
    final mag1 = math.sqrt(dx1 * dx1 + dy1 * dy1);
    final mag2 = math.sqrt(dx2 * dx2 + dy2 * dy2);

    if (mag1 == 0 || mag2 == 0) return 0.0;

    final cosAngle = (dot / (mag1 * mag2)).clamp(-1.0, 1.0);
    final radians = math.acos(cosAngle);
    final degrees = radians * 180 / math.pi;

    // Arrondi à 1 décimale [Source: architecture.md#Patterns-de-format]
    return (degrees * 10).roundToDouble() / 10;
  }

  /// Angle du genou : hip → knee → ankle
  static double calculateKneeAngle(Pose pose, String side) {
    final hip   = pose.landmarks[side == 'left' ? PoseLandmarkType.leftHip   : PoseLandmarkType.rightHip]!;
    final knee  = pose.landmarks[side == 'left' ? PoseLandmarkType.leftKnee  : PoseLandmarkType.rightKnee]!;
    final ankle = pose.landmarks[side == 'left' ? PoseLandmarkType.leftAnkle : PoseLandmarkType.rightAnkle]!;
    return _angleBetween(hip, knee, ankle);
  }

  /// Angle de la hanche : shoulder → hip → knee
  static double calculateHipAngle(Pose pose, String side) {
    final shoulder = pose.landmarks[side == 'left' ? PoseLandmarkType.leftShoulder : PoseLandmarkType.rightShoulder]!;
    final hip      = pose.landmarks[side == 'left' ? PoseLandmarkType.leftHip      : PoseLandmarkType.rightHip]!;
    final knee     = pose.landmarks[side == 'left' ? PoseLandmarkType.leftKnee     : PoseLandmarkType.rightKnee]!;
    return _angleBetween(shoulder, hip, knee);
  }

  /// Angle de la cheville : knee → ankle → footIndex
  static double calculateAnkleAngle(Pose pose, String side) {
    final knee      = pose.landmarks[side == 'left' ? PoseLandmarkType.leftKnee      : PoseLandmarkType.rightKnee]!;
    final ankle     = pose.landmarks[side == 'left' ? PoseLandmarkType.leftAnkle     : PoseLandmarkType.rightAnkle]!;
    final footIndex = pose.landmarks[side == 'left' ? PoseLandmarkType.leftFootIndex : PoseLandmarkType.rightFootIndex]!;
    return _angleBetween(knee, ankle, footIndex);
  }

  /// Score de confiance d'une articulation = moyenne du likelihood des landmarks impliqués.
  static double jointConfidence(List<PoseLandmark> landmarks) {
    if (landmarks.isEmpty) return 0.0;
    return landmarks.map((l) => l.likelihood).reduce((a, b) => a + b) / landmarks.length;
  }

  /// Agrège les angles sur plusieurs poses (frames) — retourne la valeur représentative.
  /// Stratégie MVP : médiane (robuste aux outliers ML Kit).
  static double aggregateAngles(List<double> angles) {
    if (angles.isEmpty) return 0.0;
    final sorted = List<double>.from(angles)..sort();
    final mid = sorted.length ~/ 2;
    if (sorted.length.isOdd) return sorted[mid];
    return (sorted[mid - 1] + sorted[mid]) / 2.0;
  }
}
```

#### `lib/features/capture/data/drift_analysis_repository.dart` (structure)

```dart
import 'package:drift/drift.dart';

/// Persistance atomique des analyses — transaction Drift obligatoire (NFR-R2).
/// JAMAIS d'écriture partielle — une analyse est soit complète, soit absente (NFR-R5).
/// [Source: docs/planning-artifacts/architecture.md#Architecture-des-données]
class DriftAnalysisRepository implements AnalysisRepository {

  final AppDatabase _db;
  DriftAnalysisRepository(this._db);

  @override
  Future<void> save(Analysis analysis) async {
    // Transaction atomique — rollback automatique si une exception survient
    await _db.transaction(() async {
      await _db.into(_db.analyses).insert(
        AnalysesCompanion.insert(
          id: analysis.id,
          patientId: analysis.patientId,
          kneeAngle: analysis.angles.kneeAngle,
          hipAngle: analysis.angles.hipAngle,
          ankleAngle: analysis.angles.ankleAngle,
          kneeConfidence: analysis.confidence.kneeScore,
          hipConfidence: analysis.confidence.hipScore,
          ankleConfidence: analysis.confidence.ankleScore,
          createdAt: analysis.createdAt, // ISO 8601 string [Source: architecture.md#Patterns-de-format]
        ),
      );
    });
    // Si une exception est levée dans le bloc, la transaction est rollbackée
    // → aucune donnée partielle en base (NFR-R2, NFR-R5)
  }
}
```

#### `lib/features/capture/domain/capture_state.dart` (vérification)

```dart
/// State machine du pipeline ML — à compléter si Story 3.1 n'a pas créé CaptureProcessing/CaptureCompleted.
/// [Source: docs/planning-artifacts/architecture.md#State-machine-pipeline-ML]
sealed class CaptureState { const CaptureState(); }
final class CaptureIdle      extends CaptureState { const CaptureIdle(); }
final class CaptureRecording extends CaptureState { const CaptureRecording(); }

/// NOUVEAU en Story 3.3 : états post-enregistrement
final class CaptureProcessing extends CaptureState { const CaptureProcessing(); }

final class CaptureCompleted extends CaptureState {
  final AnalysisResult result;
  const CaptureCompleted(this.result);
}

final class CaptureFailed extends CaptureState {
  final AnalysisError error;
  const CaptureFailed(this.error);
}
```

#### `pubspec.yaml` — activation du package ML Kit

```yaml
# Décommenter la ligne suivante (commentée en Story 1.1 pour économiser le bundle size)
google_mlkit_pose_detection: ^0.11.0
# Bundle impact estimé : +40-60 MB — bundle total cible < 150 MB (NFR-C4)
```

### Landmarks ML Kit utilisés

| Articulation | Landmarks impliqués      | PoseLandmarkType                         |
| ------------ | ------------------------ | ---------------------------------------- |
| Genou        | Hip → Knee → Ankle       | `leftHip`, `leftKnee`, `leftAnkle`       |
| Hanche       | Shoulder → Hip → Knee    | `leftShoulder`, `leftHip`, `leftKnee`    |
| Cheville     | Knee → Ankle → FootIndex | `leftKnee`, `leftAnkle`, `leftFootIndex` |

**Note :** Utiliser les landmarks du côté filmé (Story 3.1 guide une vue de profil). En vue de profil strict, le côté visible est le côté pertinent. L'implémentation MVP utilise le côté gauche par défaut — paramétrable via `patientSide` dans `MlIsolateRunner.run()`.

**Source :** [Source: docs/planning-artifacts/research/technical-bodyorthox-stack-research-2026-03-02.md]

### Gestion des états d'erreur — switch exhaustif obligatoire

```dart
// Dans CaptureNotifier — switch exhaustif sur AnalysisResult (obligatoire Dart 3)
switch (result) {
  case AnalysisSuccess(:final angles, :final confidence):
    await _repository.save(Analysis(...));
    await _notificationService.showAnalysisReady(patientName, angles);
    state = AsyncData(CaptureCompleted(result));

  case AnalysisFailure(:final error):
    // Zéro persistance ici — NFR-R2
    state = AsyncData(CaptureFailed(error));
}

// Dans l'UI — switch exhaustif sur CaptureState
switch (captureState) {
  case CaptureIdle()      => CaptureReadyWidget(),
  case CaptureRecording() => RecordingWidget(),
  case CaptureProcessing() => AnalysisProgressBanner(),  // Widget Story 3.1
  case CaptureCompleted(:final result) => _navigateToResults(result),
  case CaptureFailed(:final error) => AnalysisErrorWidget(error),
}
```

**INTERDIT :** `state.when(...)`, `state.maybeWhen(...)`, `if (state is CaptureCompleted)` — [Source: docs/planning-artifacts/architecture.md#Communication]

### NFR-S5 — Garantie vidéo jamais sur disque

La vidéo brute est garantie de ne jamais toucher le disque par la conception même du pipeline :

1. **Story 3.2** : l'enregistrement produit des frames en mémoire via le plugin caméra (AVFoundation sur iOS) — aucune écriture disque
2. **Story 3.3** : les frames (`List<Uint8List>`) sont transmis à l'isolate par `TransferableTypedData` — transfert de propriété mémoire, pas de copie
3. **Fin de l'isolate** : la mémoire de l'isolate est libérée par le GC Dart — la vidéo disparaît structurellement
4. **Jamais de chemin fichier** : aucune API `File`, `Directory`, `path_provider` n'est utilisée pour la vidéo brute

**Vérification :** Instruments Xcode → File System Activity → zéro écriture avec extension `.mp4`, `.mov`, ou temporaire vidéo.

**Source :** [Source: docs/planning-artifacts/architecture.md#Stratégie-vidéo-en-mémoire]

### NFR-P1 — Performance < 30s

Stratégies pour atteindre < 30s sur iPhone 12+ :

| Stratégie                                                                   | Gain estimé           |
| --------------------------------------------------------------------------- | --------------------- |
| `PoseDetectionMode.stream` (réutilise le modèle chargé)                     | -30% vs single mode   |
| Sous-échantillonnage frames : analyser 1 frame sur 2 (15 FPS au lieu de 30) | -40% frames à traiter |
| `TransferableTypedData` pour éviter la copie des frames entre threads       | -10% overhead         |
| Calcul des angles sur les frames filtrés (likelihood > 0.5 uniquement)      | -20% calculs inutiles |

Objectif : ~12s d'enregistrement × 15 FPS = ~180 frames → ~1.5s/frame × 0.7 efficacité ML Kit ≈ ~12-18s total.

**Source :** [Source: docs/planning-artifacts/epics.md#NFR-P1]

### Schéma Drift — table `analyses`

```dart
// Dans app_database.dart — à étendre si Story 1.3 a créé un schéma minimal
class Analyses extends Table {
  TextColumn get id          => text()();          // UUID v4
  TextColumn get patientId   => text().references(Patients, #id)();
  RealColumn get kneeAngle   => real()();          // double degrés
  RealColumn get hipAngle    => real()();
  RealColumn get ankleAngle  => real()();
  RealColumn get kneeConfidence  => real()();      // 0.0-1.0
  RealColumn get hipConfidence   => real()();
  RealColumn get ankleConfidence => real()();
  TextColumn get createdAt   => text()();          // ISO 8601 string
  BoolColumn get isManuallyAdjusted => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

// Index obligatoire [Source: architecture.md#Gap-critique-2]
// Index('idx_analyses_patient', 'analyses (patient_id, created_at DESC)')
// → déclaré dans allSchemaEntities de AppDatabase
```

### Notification locale — format exact

```dart
// [Source: docs/planning-artifacts/epics.md#Story-3.3-AC5 + Story-6.3]
await flutterLocalNotificationsPlugin.show(
  analysisId.hashCode,   // ID unique par analyse
  'Analyse prête',        // Titre
  "L'analyse de $patientName est prête — ${angles.kneeAngle}°/${angles.hipAngle}°/${angles.ankleAngle}°",
  notificationDetails,
  payload: '/results/${analysisId}',  // Deep link go_router (géré en Story 6.3)
);
```

### Anti-patterns à éviter IMPÉRATIVEMENT dans cette story

```dart
// ❌ INTERDIT — Écrire la vidéo sur disque
final file = await File('${dir.path}/video.mp4').create();
// → NFR-S5 violation critique

// ❌ INTERDIT — DAO direct depuis Notifier
await ref.read(driftDbProvider).analysisDao.insert(companion);
// → doit passer par DriftAnalysisRepository

// ❌ INTERDIT — Persistance partielle (hors transaction)
await _db.into(_db.analyses).insert(companion);
await _db.into(_db.articularAngles).insert(anglesCompanion); // Risque si ça crash ici
// → TOUT dans db.transaction(() async { ... })

// ❌ INTERDIT — Ignorer le type d'erreur (non-exhaustif)
if (result is AnalysisSuccess) { ... }
// → switch exhaustif obligatoire

// ❌ INTERDIT — Fonctions d'isolate non-top-level
Isolate.spawn((message) { ... }, sendPort); // Lambda interdite comme entry point
// → function top-level ou static method obligatoire
```

### Project Structure Notes

**Fichiers à créer dans cette story :**

```
lib/features/capture/
  domain/
    analysis_result.dart         ← sealed class (nouveau)
    analysis_result_test.dart    ← co-localisé
    analysis_error.dart          ← sealed class (nouveau)
    articular_angles.dart        ← Freezed (nouveau)
    articular_angles.freezed.dart ← généré
    articular_angles.g.dart       ← généré
    confidence_score.dart        ← Freezed (nouveau)
    confidence_score.freezed.dart ← généré
    confidence_score.g.dart       ← généré
    capture_state.dart           ← ÉTENDRE (CaptureProcessing, CaptureCompleted, CaptureFailed)
    analysis.dart                ← ÉTENDRE (ajouter ArticularAngles + ConfidenceScore)
  data/
    ml_service.dart              ← abstract interface (nouveau)
    ml_kit_pose_service.dart     ← implémentation ML Kit (nouveau)
    ml_kit_pose_service_test.dart ← co-localisé
    angle_calculator.dart        ← calcul angles (nouveau)
    angle_calculator_test.dart   ← co-localisé
    analysis_repository.dart     ← abstract interface (nouveau)
    analysis_repository_test.dart ← co-localisé
    drift_analysis_repository.dart ← implémentation Drift (nouveau)
    drift_analysis_repository_test.dart ← co-localisé
    analysis_dao.dart            ← DAO Drift (nouveau)
  application/
    ml_isolate_runner.dart       ← CORE du pipeline (nouveau)
    ml_isolate_runner_test.dart  ← co-localisé
    capture_notifier.dart        ← ÉTENDRE (orchestrer MlIsolateRunner)
    capture_notifier_test.dart   ← ÉTENDRE (ajouter cas CaptureProcessing → CaptureCompleted)
    capture_provider.dart        ← ÉTENDRE (ajouter provider pour AnalysisRepository)

lib/core/
  notifications/
    notification_service.dart    ← wrapping flutter_local_notifications (nouveau si inexistant)
```

**Fichiers à modifier dans cette story :**

```
pubspec.yaml                     ← décommenter google_mlkit_pose_detection
lib/core/database/app_database.dart ← ajouter table Analyses + index idx_analyses_patient
```

**Fichiers à NE PAS toucher dans cette story :**

```
lib/features/results/            ← sera implémenté en Story 3.4
lib/features/capture/presentation/ ← la capture screen (Stories 3.1/3.2) — uniquement ajouter CaptureProcessing state UI
lib/features/report/             ← Epic 4
```

### Vérifications de cohérence d'arborescence

| Fichier               | Chemin attendu                                             | Statut   |
| --------------------- | ---------------------------------------------------------- | -------- |
| Sealed AnalysisResult | `lib/features/capture/domain/analysis_result.dart`         | Nouveau  |
| Sealed AnalysisError  | `lib/features/capture/domain/analysis_error.dart`          | Nouveau  |
| ArticularAngles       | `lib/features/capture/domain/articular_angles.dart`        | Nouveau  |
| ConfidenceScore       | `lib/features/capture/domain/confidence_score.dart`        | Nouveau  |
| ML Service interface  | `lib/features/capture/data/ml_service.dart`                | Nouveau  |
| ML Kit implémentation | `lib/features/capture/data/ml_kit_pose_service.dart`       | Nouveau  |
| AngleCalculator       | `lib/features/capture/data/angle_calculator.dart`          | Nouveau  |
| AnalysisRepository    | `lib/features/capture/data/analysis_repository.dart`       | Nouveau  |
| Drift impl repository | `lib/features/capture/data/drift_analysis_repository.dart` | Nouveau  |
| **MlIsolateRunner**   | `lib/features/capture/application/ml_isolate_runner.dart`  | **CLEF** |
| NotificationService   | `lib/core/notifications/notification_service.dart`         | Nouveau  |

### References

- [Source: docs/planning-artifacts/epics.md#Story-3.3] — User story, AC1-AC8, FRs couvertes (FR13, FR14, FR16, FR19)
- [Source: docs/planning-artifacts/architecture.md#Stratégie-vidéo-en-mémoire] — NFR-S5, SendPort/ReceivePort, isolate Flutter
- [Source: docs/planning-artifacts/architecture.md#Communication-Gestion-des-erreurs] — Sealed classes AnalysisResult, AnalysisError
- [Source: docs/planning-artifacts/architecture.md#Architecture-des-données] — Drift transactions atomiques, NFR-R2
- [Source: docs/planning-artifacts/architecture.md#Frontières-architecturales] — Flux données complet CaptureScreen → DriftAnalysisRepository
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-structure] — Feature-First data/domain/application/presentation
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-nommage] — snake_case fichiers, PascalCase classes
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-communication] — switch exhaustif Dart 3 obligatoire
- [Source: docs/planning-artifacts/architecture.md#Anti-patterns-explicites] — DAO direct interdit, transaction obligatoire
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-format] — angles double 1 décimale, dates ISO 8601, UUID v4
- [Source: docs/planning-artifacts/architecture.md#Structure-du-Projet] — Arborescence Feature-First complète
- [Source: docs/planning-artifacts/epics.md#NFR-P1] — Performance < 30s pipeline ML
- [Source: docs/planning-artifacts/epics.md#NFR-S5] — Vidéo jamais sur disque
- [Source: docs/planning-artifacts/epics.md#NFR-R2] — Atomicité transactions Drift
- [Source: docs/planning-artifacts/epics.md#NFR-R4] — Taux échec ML < 5%
- [Source: docs/implementation-artifacts/1-1-initialisation-du-projet-infrastructure-technique.md] — Patterns story précédente, pubspec.yaml initial

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_À remplir par l'agent de développement pendant l'implémentation._

### Completion Notes List

- Pipeline ML complet implémenté dans un Flutter isolate dédié via `MlIsolateRunner`
- `TransferableTypedData` utilisé pour le transfert zero-copy des frames vers l'isolate (NFR-S5)
- `AngleCalculator` calcule genou/hanche/cheville par médiane sur tous les frames (robustesse outliers)
- `ConfidenceScore` avec seuil 0.7 → `MLLowConfidence` si score global insuffisant (AC3)
- Timeout 30s configuré dans `MlIsolateRunner` (NFR-P1)
- `DriftAnalysisRepository.save()` utilise `db.transaction()` — rollback automatique (NFR-R2, AC7)
- `NotificationService.showAnalysisReady()` : format "L'analyse de X est prête — knee°/hip°/ankle°" (AC5)
- Dialog informatif post-analyse "vidéo supprimée" (AC6) via `CupertinoAlertDialog`
- `patientLabel` rendu optionnel dans `CaptureScreen` (fix compatibilité router)
- Collecte frames corrigée : tous les plans YUV420 concaténés (fix H2 code review)
- Code review : 2 HIGH, 2 MEDIUM fixés, 2 LOW acceptés comme tech debt
- 9 nouveaux tests unitaires — tous passent

### File List

- `bodyorthox/pubspec.yaml` — modified (google_mlkit_pose_detection décommenté)
- `bodyorthox/lib/features/capture/domain/analysis_result.dart` — created
- `bodyorthox/lib/features/capture/domain/analysis_error.dart` — created
- `bodyorthox/lib/features/capture/domain/articular_angles.dart` — created
- `bodyorthox/lib/features/capture/domain/articular_angles.freezed.dart` — generated
- `bodyorthox/lib/features/capture/domain/confidence_score.dart` — created
- `bodyorthox/lib/features/capture/domain/confidence_score.freezed.dart` — generated
- `bodyorthox/lib/features/capture/data/ml_service.dart` — created
- `bodyorthox/lib/features/capture/data/ml_kit_pose_service.dart` — created
- `bodyorthox/lib/features/capture/data/angle_calculator.dart` — created
- `bodyorthox/lib/features/capture/data/analysis_repository.dart` — modified (ajout save())
- `bodyorthox/lib/features/capture/data/drift_analysis_repository.dart` — modified (implémentation save())
- `bodyorthox/lib/features/capture/application/ml_runner.dart` — created (interface abstraite)
- `bodyorthox/lib/features/capture/application/ml_isolate_runner.dart` — created
- `bodyorthox/lib/features/capture/application/ml_providers.dart` — created
- `bodyorthox/lib/features/capture/application/capture_provider.dart` — modified (export ml_providers)
- `bodyorthox/lib/features/capture/application/capture_notifier.dart` — modified (startAnalysis())
- `bodyorthox/lib/features/capture/application/capture_notifier_test.dart` — modified (9 tests Story 3.3)
- `bodyorthox/lib/features/capture/presentation/capture_screen.dart` — modified (frame collection, AC6 dialog)
- `bodyorthox/lib/core/notifications/notification_service.dart` — created + fixed (flutter_local_notifications 20.x API)
