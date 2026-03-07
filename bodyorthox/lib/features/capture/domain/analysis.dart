import 'package:freezed_annotation/freezed_annotation.dart';

part 'analysis.freezed.dart';

/// Modèle de domaine : une analyse biomécanique on-device.
///
/// Immuable via Freezed — identité portée par [id] (UUID v4).
/// Angles en degrés (1 décimale à l'affichage), [confidenceScore] ∈ [0.0, 1.0].
/// [Source: docs/implementation-artifacts/2-3-historique-des-analyses-dun-patient.md#T2]
@freezed
abstract class Analysis with _$Analysis {
  const factory Analysis({
    required String id,
    required String patientId,
    required DateTime createdAt,
    required double kneeAngle,
    required double hipAngle,
    required double ankleAngle,
    required double confidenceScore,
    /// Vrai si le praticien a corrigé manuellement un point articulaire (Story 3.5).
    @Default(false) bool manualCorrectionApplied,
    /// Articulation corrigée manuellement : 'knee', 'hip' ou 'ankle'.
    String? manualCorrectionJoint,
  }) = _Analysis;
}
