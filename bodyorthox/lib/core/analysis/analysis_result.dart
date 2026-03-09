// Résultat générique du pipeline d'analyse — sealed class Dart 3.
// Commun à tous les modules d'analyse (HKA, Cobb, axe fémoral...).
//
// [Source: docs/implementation-artifacts/arch-1-interface-analysis-module.md#Tâche 1]
// [Source: docs/planning-artifacts/sprint-change-proposal-2026-03-08.md#Section 4.3]

/// Résultat d'un module d'analyse — sealed class Dart 3.
///
/// Switch exhaustif OBLIGATOIRE côté consommateur — interdit d'utiliser `is`.
/// [Source: docs/planning-artifacts/architecture.md#Communication-Gestion-des-erreurs]
sealed class AnalysisResult {
  const AnalysisResult();
}

/// Analyse réussie — contient les mesures produites par le module.
///
/// Les clés dépendent du module : ex. HKA → `{'hka_angle': 174.2, 'confidence': 0.91}`.
/// Cobb → `{'cobb_angle': 32.4, 'confidence': 0.88}`.
final class AnalysisSuccess extends AnalysisResult {
  /// Mesures produites — clés spécifiques au [AnalysisModule.moduleId].
  ///
  /// ⚠️ Limitation connue : le `const` constructor empêche `Map.unmodifiable()`
  /// à ce niveau. Les implémentations de [AnalysisModule.analyze] doivent
  /// passer `Map.unmodifiable({...})` pour garantir l'immutabilité à la source.
  final Map<String, double> measurements;

  const AnalysisSuccess(this.measurements);
}

/// Analyse échouée — contient l'erreur typée.
final class AnalysisFailure extends AnalysisResult {
  final AnalysisError error;

  const AnalysisFailure(this.error);
}

// ---------------------------------------------------------------------------
// Erreurs d'analyse — sealed class Dart 3
// ---------------------------------------------------------------------------

/// Erreurs typées du pipeline d'analyse — switch exhaustif obligatoire.
///
/// [Source: docs/planning-artifacts/architecture.md#Gestion-erreurs-ML]
sealed class AnalysisError {
  const AnalysisError();
}

/// Score de confiance insuffisant (< seuil du module) — récupérable via
/// correction manuelle (Story 3.5).
final class MLLowConfidence extends AnalysisError {
  /// Score global 0.0-1.0 au moment de l'échec.
  final double score;

  const MLLowConfidence(this.score);
}

/// ML Kit n'a pas pu détecter de pose sur la photo fournie.
final class MLDetectionFailed extends AnalysisError {
  const MLDetectionFailed();
}

/// Erreur de traitement de la photo (fichier corrompu, mémoire insuffisante...).
final class PhotoProcessingError extends AnalysisError {
  final String cause;

  const PhotoProcessingError(this.cause);
}
