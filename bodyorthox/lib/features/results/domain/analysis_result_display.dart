// Modèle de domaine pour l'écran de résultats — données préparées pour l'UI.
// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task2]
import '../../capture/domain/analysis.dart';
import '../../patients/domain/patient.dart';
import 'reference_norms.dart';

/// Données combinées analysis + patient + normes calculées — prêtes pour l'affichage.
///
/// Immuable — calculé une fois par [ResultsNotifier] au chargement.
class AnalysisResultDisplay {
  const AnalysisResultDisplay({
    required this.analysis,
    required this.patient,
    required this.kneeNorm,
    required this.hipNorm,
    required this.ankleNorm,
    required this.kneeStatus,
    required this.hipStatus,
    required this.ankleStatus,
    required this.primaryArticulation,
  });

  final Analysis analysis;
  final Patient patient;

  /// Plages normatives calculées à partir de l'âge et du profil du patient.
  final NormRange kneeNorm;
  final NormRange hipNorm;
  final NormRange ankleNorm;

  /// Statuts normatifs dérivés de [NormRange.evaluate].
  final NormStatus kneeStatus;
  final NormStatus hipStatus;
  final NormStatus ankleStatus;

  /// Articulation avec l'écart le plus élevé par rapport à la borne normative.
  final ArticulationName primaryArticulation;

  /// Score de confiance ML < 60% → lowConfidence (AC6 Story 3.4).
  bool get isLowConfidence => analysis.confidenceScore < 0.60;

  /// Âge du patient en années entières.
  int get patientAgeYears {
    final now = DateTime.now();
    int age = now.year - patient.dateOfBirth.year;
    if (now.month < patient.dateOfBirth.month ||
        (now.month == patient.dateOfBirth.month &&
            now.day < patient.dateOfBirth.day)) {
      age--;
    }
    return age;
  }
}
