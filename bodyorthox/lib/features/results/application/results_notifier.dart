// ResultsNotifier — chargement et calcul des données de l'écran résultats.
// Story 3.5 : ajout de saveManualCorrection() (AC9).
// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task2]
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../capture/data/analysis_repository.dart';
import '../../patients/data/patient_repository.dart';
import '../../patients/domain/patient.dart';
import '../domain/analysis_result_display.dart';
import '../domain/reference_norms.dart';
import 'results_provider.dart';

part 'results_notifier.g.dart';

/// Notifier de l'écran de résultats — charge l'analyse et le patient,
/// calcule les normes et statuts par articulation.
///
/// Pattern : AsyncNotifier family par [analysisId].
/// Switch exhaustif Dart 3 sur AsyncValue<AnalysisResultDisplay> dans la présentation.
/// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task2]
@riverpod
class ResultsNotifier extends _$ResultsNotifier {
  @override
  Future<AnalysisResultDisplay> build(String analysisId) async {
    final analysisRepo = ref.watch(resultsAnalysisRepositoryProvider);
    final patientRepo = ref.watch(resultsPatientRepositoryProvider);

    // Watch par stream — réactif aux mises à jour éventuelles
    final analysis = await analysisRepo.watchById(analysisId).first;

    if (analysis == null) {
      throw Exception('Analyse introuvable : $analysisId');
    }

    final Patient? patient = await patientRepo.findById(analysis.patientId);
    if (patient == null) {
      throw Exception('Patient introuvable : ${analysis.patientId}');
    }

    final ageYears = _computeAgeYears(patient);

    // Calcul des normes par articulation (AC2)
    final kneeNorm = ReferenceNorms.getNorm(
      ArticulationName.knee,
      ageYears,
      patient.morphologicalProfile,
    );
    final hipNorm = ReferenceNorms.getNorm(
      ArticulationName.hip,
      ageYears,
      patient.morphologicalProfile,
    );
    final ankleNorm = ReferenceNorms.getNorm(
      ArticulationName.ankle,
      ageYears,
      patient.morphologicalProfile,
    );

    final kneeStatus = kneeNorm.evaluate(analysis.kneeAngle);
    final hipStatus = hipNorm.evaluate(analysis.hipAngle);
    final ankleStatus = ankleNorm.evaluate(analysis.ankleAngle);

    final primaryArticulation = _computePrimaryArticulation(
      kneeAngle: analysis.kneeAngle,
      hipAngle: analysis.hipAngle,
      ankleAngle: analysis.ankleAngle,
      kneeNorm: kneeNorm,
      hipNorm: hipNorm,
      ankleNorm: ankleNorm,
    );

    return AnalysisResultDisplay(
      analysis: analysis,
      patient: patient,
      kneeNorm: kneeNorm,
      hipNorm: hipNorm,
      ankleNorm: ankleNorm,
      kneeStatus: kneeStatus,
      hipStatus: hipStatus,
      ankleStatus: ankleStatus,
      primaryArticulation: primaryArticulation,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────

  int _computeAgeYears(Patient patient) {
    final now = DateTime.now();
    int age = now.year - patient.dateOfBirth.year;
    if (now.month < patient.dateOfBirth.month ||
        (now.month == patient.dateOfBirth.month &&
            now.day < patient.dateOfBirth.day)) {
      age--;
    }
    return age;
  }

  ArticulationName _computePrimaryArticulation({
    required double kneeAngle,
    required double hipAngle,
    required double ankleAngle,
    required NormRange kneeNorm,
    required NormRange hipNorm,
    required NormRange ankleNorm,
  }) {
    final deviations = {
      ArticulationName.knee: _normDeviation(kneeAngle, kneeNorm),
      ArticulationName.hip: _normDeviation(hipAngle, hipNorm),
      ArticulationName.ankle: _normDeviation(ankleAngle, ankleNorm),
    };
    return deviations.entries.reduce((a, b) => a.value >= b.value ? a : b).key;
  }

  double _normDeviation(double angle, NormRange norm) {
    if (angle < norm.min) return norm.min - angle;
    if (angle > norm.max) return angle - norm.max;
    return 0.0;
  }

  // ─── Story 3.5 : Correction manuelle ──────────────────────────────────────

  /// Persiste une correction manuelle et met à jour le state en mémoire (AC9).
  ///
  /// Délègue au [AnalysisRepository.saveManualCorrection] en transaction atomique.
  /// Met ensuite à jour le state directement pour éviter une re-lecture DB.
  /// Switch exhaustif sur [AnalysisResult] non nécessaire ici car la correction
  /// est déjà validée par l'UI (le joint et l'angle sont fournis explicitement).
  Future<void> saveManualCorrection({
    required String joint,
    required double correctedAngle,
  }) async {
    final analysisRepo = ref.read(resultsAnalysisRepositoryProvider);

    await analysisRepo.saveManualCorrection(
      analysisId: analysisId, // getter généré par Riverpod 3.x (@riverpod family)
      joint: joint,
      correctedAngle: correctedAngle,
    );

    // Mise à jour optimiste du state sans rechargement DB
    final current = state.asData?.value;
    if (current == null) return;

    final updatedAnalysis = current.analysis.copyWith(
      manualCorrectionApplied: true,
      manualCorrectionJoint: joint,
      kneeAngle: joint == 'knee' ? correctedAngle : current.analysis.kneeAngle,
      hipAngle: joint == 'hip' ? correctedAngle : current.analysis.hipAngle,
      ankleAngle: joint == 'ankle' ? correctedAngle : current.analysis.ankleAngle,
    );

    state = AsyncData(
      AnalysisResultDisplay(
        analysis: updatedAnalysis,
        patient: current.patient,
        kneeNorm: current.kneeNorm,
        hipNorm: current.hipNorm,
        ankleNorm: current.ankleNorm,
        kneeStatus: current.kneeStatus,
        hipStatus: current.hipStatus,
        ankleStatus: current.ankleStatus,
        primaryArticulation: current.primaryArticulation,
      ),
    );
  }
}
