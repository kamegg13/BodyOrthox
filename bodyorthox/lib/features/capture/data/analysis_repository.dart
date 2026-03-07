import '../domain/analysis.dart';

/// Interface abstraite — contrat Repository pour la feature capture/analyses.
///
/// L'implémentation Drift respecte ce contrat.
/// Rationale : découplage DAO → Notifier, migration PowerSync (Phase 2) triviale.
/// [Source: docs/planning-artifacts/architecture.md#Abstraction-Repository]
abstract class AnalysisRepository {
  /// Stream réactif des analyses d'un patient, triées par date décroissante.
  ///
  /// Se met à jour automatiquement à chaque insertion ou suppression.
  /// Exploite idx_analyses_patient (NFR-C2).
  Stream<List<Analysis>> watchAnalysesForPatient(String patientId);

  /// Stream réactif d'une analyse par son [id] — émet null si introuvable.
  ///
  /// Utilisé par [ResultsNotifier] pour charger les données de l'écran résultats.
  Stream<Analysis?> watchById(String id);

  /// Persiste une analyse en base — transaction atomique obligatoire (NFR-R2).
  ///
  /// Zéro donnée partielle : si une exception survient, rollback automatique.
  /// [Source: docs/implementation-artifacts/3-3-pipeline-ml-on-device-extraction-des-angles.md#T5.6]
  Future<void> save(Analysis analysis);

  /// Persiste une correction manuelle d'un point articulaire (Story 3.5).
  ///
  /// Met à jour [manualCorrectionApplied]=true, [manualCorrectionJoint]=[joint]
  /// et l'angle corrigé de l'articulation. Transaction atomique Drift (NFR-R2).
  Future<void> saveManualCorrection({
    required String analysisId,
    required String joint, // 'knee', 'hip', 'ankle'
    required double correctedAngle,
  });
}
