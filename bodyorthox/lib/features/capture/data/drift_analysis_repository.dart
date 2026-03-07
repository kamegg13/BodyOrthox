import '../../../core/database/app_database.dart' as db;
import '../domain/analysis.dart';
import 'analysis_repository.dart';

/// Implémentation Drift du [AnalysisRepository].
///
/// Délègue à [AnalysesDao] — jamais d'accès direct à [AppDatabase].
/// [Source: docs/planning-artifacts/architecture.md#Frontières-architecturales]
class DriftAnalysisRepository implements AnalysisRepository {
  DriftAnalysisRepository(this._db);

  final db.AppDatabase _db;

  @override
  Stream<List<Analysis>> watchAnalysesForPatient(String patientId) {
    return _db.analysesDao.watchByPatient(patientId).map(
          (rows) => rows.map(_rowToAnalysis).toList(),
        );
  }

  @override
  Stream<Analysis?> watchById(String id) {
    return _db.analysesDao.watchById(id).map(
          (row) => row == null ? null : _rowToAnalysis(row),
        );
  }

  @override
  Future<void> save(Analysis analysis) async {
    await _db.transaction(() async {
      await _db.analysesDao.insertAnalysis(
        db.AnalysesCompanion.insert(
          id: analysis.id,
          patientId: analysis.patientId,
          kneeAngle: analysis.kneeAngle,
          hipAngle: analysis.hipAngle,
          ankleAngle: analysis.ankleAngle,
          confidenceScore: analysis.confidenceScore,
          createdAt: analysis.createdAt.toUtc().toIso8601String(),
        ),
      );
    });
  }

  @override
  Future<void> saveManualCorrection({
    required String analysisId,
    required String joint,
    required double correctedAngle,
  }) async {
    await _db.transaction(() async {
      await _db.analysesDao.updateManualCorrection(
        id: analysisId,
        joint: joint,
        kneeAngle: joint == 'knee' ? correctedAngle : null,
        hipAngle: joint == 'hip' ? correctedAngle : null,
        ankleAngle: joint == 'ankle' ? correctedAngle : null,
      );
    });
  }

  Analysis _rowToAnalysis(db.Analyse row) => Analysis(
        id: row.id,
        patientId: row.patientId,
        createdAt: DateTime.parse(row.createdAt),
        kneeAngle: row.kneeAngle,
        hipAngle: row.hipAngle,
        ankleAngle: row.ankleAngle,
        confidenceScore: row.confidenceScore,
        manualCorrectionApplied: row.mlCorrected,
        manualCorrectionJoint: row.manualCorrectionJoint,
      );
}
