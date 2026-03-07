part of 'app_database.dart';

/// DAO Analyses — accès aux données d'analyse biomécanique via Drift.
///
/// Toutes les méthodes doivent être appelées depuis le Repository approprié (Epic 3).
/// [Source: docs/planning-artifacts/architecture.md#Anti-patterns-explicites]
@DriftAccessor(tables: [Analyses])
class AnalysesDao extends DatabaseAccessor<AppDatabase>
    with _$AnalysesDaoMixin {
  AnalysesDao(super.db);

  /// Stream réactif des analyses d'un patient, triées par date décroissante.
  ///
  /// Utilise idx_analyses_patient — NFR-P6.
  Stream<List<Analyse>> watchByPatient(String patientId) =>
      (select(analyses)
            ..where((t) => t.patientId.equals(patientId))
            ..orderBy([(t) => OrderingTerm.desc(t.createdAt)]))
          .watch();

  /// Insère une analyse en base.
  ///
  /// [entry] doit contenir un [id] UUID v4 et un [createdAt] ISO 8601 UTC.
  /// Pour respecter NFR-R2 (atomicité), utiliser dans une transaction Drift :
  /// ```dart
  /// await db.transaction(() async {
  ///   await db.analysesDao.insertAnalysis(entry);
  ///   // autres opérations...
  /// });
  /// ```
  Future<void> insertAnalysis(AnalysesCompanion entry) =>
      into(analyses).insert(entry);

  /// Stream réactif d'une analyse par son [id] — émet null si introuvable.
  ///
  /// Utilisé par [ResultsNotifier] pour charger les données de l'écran résultats.
  /// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task2]
  Stream<Analyse?> watchById(String id) =>
      (select(analyses)..where((t) => t.id.equals(id))).watchSingleOrNull();

  /// Supprime toutes les analyses d'un patient — appelé en cascade lors de
  /// la suppression d'un patient (Story 2.4).
  ///
  /// Doit être appelé dans une transaction Drift avec [PatientsDao.deletePatient].
  Future<void> deleteByPatient(String patientId) =>
      (delete(analyses)..where((t) => t.patientId.equals(patientId))).go();

  /// Met à jour la correction manuelle d'une analyse (Story 3.5).
  ///
  /// Passe [mlCorrected] à true, enregistre le [joint] corrigé et met à jour
  /// l'angle de l'articulation concernée. Appelé dans une transaction Drift
  /// atomique par [DriftAnalysisRepository.saveManualCorrection].
  Future<void> updateManualCorrection({
    required String id,
    required String joint,
    double? kneeAngle,
    double? hipAngle,
    double? ankleAngle,
  }) async {
    await (update(analyses)..where((t) => t.id.equals(id))).write(
      AnalysesCompanion(
        mlCorrected: const Value(true),
        manualCorrectionJoint: Value(joint),
        kneeAngle: kneeAngle != null ? Value(kneeAngle) : const Value.absent(),
        hipAngle: hipAngle != null ? Value(hipAngle) : const Value.absent(),
        ankleAngle:
            ankleAngle != null ? Value(ankleAngle) : const Value.absent(),
      ),
    );
  }
}
