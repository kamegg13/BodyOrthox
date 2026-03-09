// État machine de la capture photo HKA — sealed class Dart 3.
//
// Représente les 4 états possibles du flux : idle → processing → completed/failed.
// Switch exhaustif OBLIGATOIRE côté consommateur (CapturePhotoHkaScreen).
//
// [Source: docs/implementation-artifacts/3-0-capture-photo-hka.md#Dev Notes]
// [Source: docs/planning-artifacts/architecture.md#Communication-Gestion-des-erreurs]

import '../../../core/analysis/analysis_result.dart';

/// État de la capture photo HKA — sealed class Dart 3.
///
/// États possibles :
/// - [CapturePhotoIdle]       : en attente d'action utilisateur
/// - [CapturePhotoProcessing] : analyse ML Kit en cours
/// - [CapturePhotoCompleted]  : analyse réussie, mesures disponibles
/// - [CapturePhotoFailed]     : échec ML Kit ou processing
sealed class CapturePhotoState {
  const CapturePhotoState();
}

/// En attente — bouton "Prendre une photo" affiché (AC1).
final class CapturePhotoIdle extends CapturePhotoState {
  const CapturePhotoIdle();
}

/// Analyse en cours — [AnalysisProgressBanner] affiché, bouton caché (AC4).
final class CapturePhotoProcessing extends CapturePhotoState {
  const CapturePhotoProcessing();
}

/// Analyse réussie — navigation vers ResultsScreen (AC5).
///
/// Porte [AnalysisSuccess] avec mesures : hka_left, hka_right,
/// confidence_left, confidence_right.
final class CapturePhotoCompleted extends CapturePhotoState {
  final AnalysisSuccess success;
  const CapturePhotoCompleted(this.success);
}

/// Analyse échouée — SnackBar affiché, retour à idle pour retry (AC6).
///
/// Porte [AnalysisError] : MLLowConfidence, MLDetectionFailed,
/// ou PhotoProcessingError.
final class CapturePhotoFailed extends CapturePhotoState {
  final AnalysisError error;
  const CapturePhotoFailed(this.error);
}
