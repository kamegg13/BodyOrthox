// Module d'analyse HKA — premier module concret du plugin pattern BodyOrthox.
//
// Implémente AnalysisModule : reçoit un XFile, exécute ML Kit Pose Detection,
// calcule l'angle Hip-Knee-Ankle gauche et droit, retourne AnalysisResult.
//
// Design : PoseDetectorInterface (abstraite) permet le mock en tests sans
// dépendance au hardware ML Kit (AC#9). En production, _RealPoseDetector
// wraps le vrai PoseDetector (factory par défaut).
//
// Cycle de vie : un nouveau détecteur est créé et fermé à chaque appel
// d'analyze() via try/finally — conforme à AC#7 (pas de memory leak iOS).
//
// [Source: docs/implementation-artifacts/arch-2-hka-module-premier-module-concret.md]
import 'package:cross_file/cross_file.dart';
import 'package:flutter/foundation.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';

import '../../../core/analysis/analysis_module.dart';
import '../../../core/analysis/analysis_result.dart';

import 'hka_angle_calculator.dart';

// ---------------------------------------------------------------------------
// Abstraction locale — permet le mock en tests (PoseDetector n'est pas abstract)
// [Source: arch-2 Dev Notes Option A — Wrapper abstrait]
// ---------------------------------------------------------------------------

/// Interface interne pour PoseDetector — permet le mock via mocktail en tests.
///
/// Exposée publiquement uniquement pour les tests unitaires (@visibleForTesting).
/// Le code production utilise uniquement [HKAModule].
@visibleForTesting
abstract class PoseDetectorInterface {
  Future<List<Pose>> processImage(InputImage image);
  Future<void> close();
}

class _RealPoseDetector implements PoseDetectorInterface {
  final PoseDetector _detector;

  _RealPoseDetector(this._detector);

  @override
  Future<List<Pose>> processImage(InputImage image) =>
      _detector.processImage(image);

  @override
  Future<void> close() => _detector.close();
}

// ---------------------------------------------------------------------------
// HKAModule
// ---------------------------------------------------------------------------

/// Module d'analyse Hip-Knee-Ankle — implémente [AnalysisModule].
///
/// Utilise Google ML Kit Pose Detection (mode single, photo statique).
/// Seuil de confiance : 0.7 — décision interne au module (AC#1).
///
/// Usage production : `HKAModule()` (factory PoseDetector par défaut).
/// Usage test : `HKAModule(detectorFactory: () => mockDetector)`.
class HKAModule implements AnalysisModule {
  static const double _confidenceThreshold = 0.7;

  final PoseDetectorInterface Function() _detectorFactory;

  static PoseDetectorInterface _defaultDetectorFactory() =>
      _RealPoseDetector(
        PoseDetector(
          options: PoseDetectorOptions(mode: PoseDetectionMode.single),
        ),
      );

  HKAModule({PoseDetectorInterface Function()? detectorFactory})
      : _detectorFactory = detectorFactory ?? _defaultDetectorFactory;

  @override
  String get moduleId => 'hka';

  @override
  String get displayName => 'Analyse HKA';

  /// Lance la détection de pose et calcule l'angle HKA gauche et droit.
  ///
  /// Crée un nouveau [PoseDetector] via la factory et le ferme dans le finally.
  /// Ne propage jamais d'exception vers le caller — toute erreur est encapsulée
  /// dans [AnalysisFailure].
  @override
  Future<AnalysisResult> analyze(XFile photo) async {
    final detector = _detectorFactory();
    try {
      final inputImage = InputImage.fromFilePath(photo.path);
      final poses = await detector.processImage(inputImage);

      // AC#5 — aucune pose détectée
      if (poses.isEmpty) {
        return const AnalysisFailure(MLDetectionFailed());
      }

      final pose = poses.first;

      // AC#2 — extraire les 6 landmarks HKA
      final leftHip = pose.landmarks[PoseLandmarkType.leftHip];
      final leftKnee = pose.landmarks[PoseLandmarkType.leftKnee];
      final leftAnkle = pose.landmarks[PoseLandmarkType.leftAnkle];
      final rightHip = pose.landmarks[PoseLandmarkType.rightHip];
      final rightKnee = pose.landmarks[PoseLandmarkType.rightKnee];
      final rightAnkle = pose.landmarks[PoseLandmarkType.rightAnkle];

      // Landmark manquant = détection incomplète
      if (leftHip == null ||
          leftKnee == null ||
          leftAnkle == null ||
          rightHip == null ||
          rightKnee == null ||
          rightAnkle == null) {
        return const AnalysisFailure(MLDetectionFailed());
      }

      final allLandmarks = [
        leftHip,
        leftKnee,
        leftAnkle,
        rightHip,
        rightKnee,
        rightAnkle,
      ];

      // AC#4 — vérifier la confiance minimale
      final minScore = HkaAngleCalculator.minLikelihood(allLandmarks);
      if (minScore < _confidenceThreshold) {
        return AnalysisFailure(MLLowConfidence(minScore));
      }

      // AC#3 — calculer angles et scores de confiance
      final hkaLeft = HkaAngleCalculator.calculateHkaAngle(
        leftHip,
        leftKnee,
        leftAnkle,
      );
      final hkaRight = HkaAngleCalculator.calculateHkaAngle(
        rightHip,
        rightKnee,
        rightAnkle,
      );
      final confidenceLeft = HkaAngleCalculator.averageLikelihood(
        [leftHip, leftKnee, leftAnkle],
      );
      final confidenceRight = HkaAngleCalculator.averageLikelihood(
        [rightHip, rightKnee, rightAnkle],
      );

      return AnalysisSuccess(
        Map.unmodifiable({
          'hka_left': hkaLeft,
          'hka_right': hkaRight,
          'confidence_left': confidenceLeft,
          'confidence_right': confidenceRight,
        }),
      );
    } catch (e) {
      // AC#6 — toute exception/erreur est encapsulée, jamais propagée (inclut Error et Exception)
      return AnalysisFailure(PhotoProcessingError(e.toString()));
    } finally {
      // AC#7 — libérer les ressources ML Kit dans tous les chemins
      await detector.close();
    }
  }
}
