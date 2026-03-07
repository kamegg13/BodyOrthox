// Calcul des angles articulaires à partir des landmarks ML Kit.
// [Source: docs/implementation-artifacts/3-3-pipeline-ml-on-device-extraction-des-angles.md#T4]
import 'dart:math' as math;

import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';

import '../domain/articular_angles.dart';
import '../domain/confidence_score.dart';

/// Calcule les angles articulaires à partir des landmarks ML Kit.
///
/// Angles en degrés (double), arrondis à 1 décimale.
/// Stratégie d'agrégation : médiane sur tous les frames (robuste aux outliers).
/// [Source: docs/planning-artifacts/epics.md#Story-3.3]
class AngleCalculator {
  /// Calcule l'angle en un point B entre les segments BA et BC.
  ///
  /// Utilise la loi des cosinus : angle = acos((BA · BC) / (|BA| × |BC|))
  /// Arrondi à 1 décimale — [Source: architecture.md#Patterns-de-format]
  static double angleBetween(
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

    return (degrees * 10).roundToDouble() / 10;
  }

  /// Angle du genou : hip → knee → ankle (T4.1)
  static double kneeAngle(Pose pose, String side) {
    final hip = _landmark(pose, side, 'hip');
    final knee = _landmark(pose, side, 'knee');
    final ankle = _landmark(pose, side, 'ankle');
    if (hip == null || knee == null || ankle == null) return 0.0;
    return angleBetween(hip, knee, ankle);
  }

  /// Angle de la hanche : shoulder → hip → knee (T4.2)
  static double hipAngle(Pose pose, String side) {
    final shoulder = _landmark(pose, side, 'shoulder');
    final hip = _landmark(pose, side, 'hip');
    final knee = _landmark(pose, side, 'knee');
    if (shoulder == null || hip == null || knee == null) return 0.0;
    return angleBetween(shoulder, hip, knee);
  }

  /// Angle de la cheville : knee → ankle → footIndex (T4.3)
  static double ankleAngle(Pose pose, String side) {
    final knee = _landmark(pose, side, 'knee');
    final ankle = _landmark(pose, side, 'ankle');
    final footIndex = _landmark(pose, side, 'footIndex');
    if (knee == null || ankle == null || footIndex == null) return 0.0;
    return angleBetween(knee, ankle, footIndex);
  }

  /// Score de confiance d'une articulation = moyenne du likelihood des landmarks.
  static double jointConfidence(List<PoseLandmark?> landmarks) {
    final valid = landmarks.whereType<PoseLandmark>().toList();
    if (valid.isEmpty) return 0.0;
    return valid.map((l) => l.likelihood).reduce((a, b) => a + b) / valid.length;
  }

  /// Agrège les angles sur plusieurs poses (frames) par médiane (T4.6).
  ///
  /// Médiane : robuste aux outliers ML Kit — [Source: architecture.md#Pipeline-ML]
  static double aggregateAngles(List<double> angles) {
    if (angles.isEmpty) return 0.0;
    final sorted = List<double>.from(angles)..sort();
    final mid = sorted.length ~/ 2;
    if (sorted.length.isOdd) return sorted[mid];
    return (sorted[mid - 1] + sorted[mid]) / 2.0;
  }

  /// Calcule les angles et scores de confiance agrégés sur toutes les poses.
  ///
  /// Retourne null si aucune pose valide disponible.
  static ({ArticularAngles angles, ConfidenceScore confidence})? calculate(
    List<Pose> poses,
    String side,
  ) {
    if (poses.isEmpty) return null;

    final kneeAngles = <double>[];
    final hipAngles = <double>[];
    final ankleAngles = <double>[];
    final kneeConfs = <double>[];
    final hipConfs = <double>[];
    final ankleConfs = <double>[];

    for (final pose in poses) {
      final kAngle = kneeAngle(pose, side);
      final hAngle = hipAngle(pose, side);
      final aAngle = ankleAngle(pose, side);

      if (kAngle > 0) kneeAngles.add(kAngle);
      if (hAngle > 0) hipAngles.add(hAngle);
      if (aAngle > 0) ankleAngles.add(aAngle);

      // Scores de confiance par articulation (T4.5)
      final kConf = jointConfidence([
        _landmark(pose, side, 'hip'),
        _landmark(pose, side, 'knee'),
        _landmark(pose, side, 'ankle'),
      ]);
      final hConf = jointConfidence([
        _landmark(pose, side, 'shoulder'),
        _landmark(pose, side, 'hip'),
        _landmark(pose, side, 'knee'),
      ]);
      final aConf = jointConfidence([
        _landmark(pose, side, 'knee'),
        _landmark(pose, side, 'ankle'),
        _landmark(pose, side, 'footIndex'),
      ]);

      if (kConf > 0) kneeConfs.add(kConf);
      if (hConf > 0) hipConfs.add(hConf);
      if (aConf > 0) ankleConfs.add(aConf);
    }

    if (kneeAngles.isEmpty && hipAngles.isEmpty && ankleAngles.isEmpty) {
      return null;
    }

    return (
      angles: ArticularAngles(
        kneeAngle: aggregateAngles(kneeAngles),
        hipAngle: aggregateAngles(hipAngles),
        ankleAngle: aggregateAngles(ankleAngles),
      ),
      confidence: ConfidenceScore(
        kneeScore: aggregateAngles(kneeConfs),
        hipScore: aggregateAngles(hipConfs),
        ankleScore: aggregateAngles(ankleConfs),
      ),
    );
  }

  static PoseLandmark? _landmark(Pose pose, String side, String joint) {
    final type = _landmarkType(side, joint);
    return type != null ? pose.landmarks[type] : null;
  }

  static PoseLandmarkType? _landmarkType(String side, String joint) {
    final isLeft = side == 'left';
    return switch (joint) {
      'hip' => isLeft ? PoseLandmarkType.leftHip : PoseLandmarkType.rightHip,
      'knee' => isLeft ? PoseLandmarkType.leftKnee : PoseLandmarkType.rightKnee,
      'ankle' => isLeft ? PoseLandmarkType.leftAnkle : PoseLandmarkType.rightAnkle,
      'shoulder' => isLeft ? PoseLandmarkType.leftShoulder : PoseLandmarkType.rightShoulder,
      'footIndex' => isLeft ? PoseLandmarkType.leftFootIndex : PoseLandmarkType.rightFootIndex,
      _ => null,
    };
  }
}
