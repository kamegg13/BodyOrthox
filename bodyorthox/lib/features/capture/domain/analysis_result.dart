// Résultat du pipeline ML — sealed class Dart 3.
// [Source: docs/implementation-artifacts/3-3-pipeline-ml-on-device-extraction-des-angles.md#T1.1]
import 'articular_angles.dart';
import 'confidence_score.dart';
import 'analysis_error.dart';

/// Résultat du pipeline ML — sealed class Dart 3 obligatoire.
///
/// Switch exhaustif OBLIGATOIRE côté consommateur — interdit d'utiliser `is`.
/// [Source: docs/planning-artifacts/architecture.md#Communication-Gestion-des-erreurs]
sealed class AnalysisResult {
  const AnalysisResult();
}

/// Analyse réussie — contient les angles articulaires et scores de confiance.
final class AnalysisSuccess extends AnalysisResult {
  final ArticularAngles angles;
  final ConfidenceScore confidence;
  const AnalysisSuccess({required this.angles, required this.confidence});
}

/// Analyse échouée — contient l'erreur typée.
final class AnalysisFailure extends AnalysisResult {
  final AnalysisError error;
  const AnalysisFailure(this.error);
}
