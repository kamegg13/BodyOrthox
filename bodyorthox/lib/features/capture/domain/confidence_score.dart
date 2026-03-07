// Score de confiance ML par articulation.
// [Source: docs/implementation-artifacts/3-3-pipeline-ml-on-device-extraction-des-angles.md#T1.4]
import 'package:freezed_annotation/freezed_annotation.dart';

part 'confidence_score.freezed.dart';

/// Score de confiance ML par articulation — valeur 0.0 à 1.0.
///
/// Seuil critique : < 0.7 → correction manuelle suggérée (Story 3.5).
/// Calculé à partir du `likelihood` des landmarks ML Kit impliqués.
/// [Source: docs/planning-artifacts/epics.md#Story-3.3-AC3]
@freezed
abstract class ConfidenceScore with _$ConfidenceScore {
  const factory ConfidenceScore({
    required double kneeScore,
    required double hipScore,
    required double ankleScore,
  }) = _ConfidenceScore;
}

/// Extension utilitaire — évaluation du seuil de confiance (AC3).
extension ConfidenceScoreX on ConfidenceScore {
  static const double _threshold = 0.7;

  bool get isKneeLowConfidence => kneeScore < _threshold;
  bool get isHipLowConfidence => hipScore < _threshold;
  bool get isAnkleLowConfidence => ankleScore < _threshold;

  double get globalScore => (kneeScore + hipScore + ankleScore) / 3.0;
  bool get hasLowConfidence => globalScore < _threshold;
}
