// Erreurs typées du pipeline ML — sealed class Dart 3.
// [Source: docs/implementation-artifacts/3-3-pipeline-ml-on-device-extraction-des-angles.md#T1.2]

/// Erreurs typées du pipeline ML — switch exhaustif obligatoire côté consommateur.
///
/// [Source: docs/planning-artifacts/architecture.md#Gestion-erreurs-ML]
sealed class AnalysisError {
  const AnalysisError();
}

/// Score de confiance insuffisant (< 0.7) — récupérable via correction manuelle (Story 3.5).
final class MLLowConfidence extends AnalysisError {
  /// Score global 0.0-1.0 au moment de l'échec.
  final double score;
  const MLLowConfidence(this.score);
}

/// ML Kit n'a pas pu détecter de pose sur les frames fournis.
final class MLDetectionFailed extends AnalysisError {
  const MLDetectionFailed();
}

/// Erreur de traitement vidéo (timeout, mémoire insuffisante, frames corrompus).
final class VideoProcessingError extends AnalysisError {
  final String cause;
  const VideoProcessingError(this.cause);
}
