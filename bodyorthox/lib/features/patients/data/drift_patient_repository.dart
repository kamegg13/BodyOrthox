import 'package:drift/drift.dart' show Value;

import '../../../core/database/app_database.dart' as db;
import '../domain/morphological_profile.dart';
import '../domain/patient.dart';
import 'patient_repository.dart';

/// Implémentation Drift du [PatientRepository].
///
/// Mappe les lignes Drift (db.Patient) vers les entités domaine (Patient).
/// Accès via [DriftPatientRepository(AppDatabase)] — injecté depuis [patients_provider.dart].
/// [Source: docs/implementation-artifacts/2-1-creer-un-profil-patient.md#T3.3]
class DriftPatientRepository implements PatientRepository {
  final db.AppDatabase _db;

  DriftPatientRepository(this._db);

  @override
  Stream<List<Patient>> watchAll() {
    return _db.patientsDao.watchAll().map(
      (rows) => rows.map(_rowToPatient).toList(),
    );
  }

  @override
  Future<void> save(Patient patient) {
    return _db.patientsDao.insertPatient(
      db.PatientsCompanion.insert(
        id: patient.id,
        name: patient.name,
        // Sérialiser en 'YYYY-MM-DD' (date uniquement)
        dateOfBirth: patient.dateOfBirth.toIso8601String().split('T').first,
        // nullable column — Value<String?>
        morphologicalProfile: Value(patient.morphologicalProfile.name),
        // UTC ISO 8601 complet — FR30
        createdAt: patient.createdAt.toUtc().toIso8601String(),
      ),
    );
  }

  @override
  Future<Patient?> findById(String id) async {
    final row = await _db.patientsDao.findById(id);
    return row == null ? null : _rowToPatient(row);
  }

  @override
  Future<void> deleteWithAnalyses(String patientId) {
    // Transaction atomique — NFR-R2 : si une étape échoue, Drift rollback l'ensemble.
    // Note : la table articular_angles (Epic 3) n'existe pas encore —
    //        seules les analyses et le patient sont supprimés à ce stade.
    return _db.transaction(() async {
      await _db.analysesDao.deleteByPatient(patientId);
      await _db.patientsDao.deletePatient(patientId);
    });
  }

  // ── Mapping privé ──────────────────────────────────────────────────────────

  Patient _rowToPatient(db.Patient row) {
    return Patient(
      id: row.id,
      name: row.name,
      dateOfBirth: DateTime.parse(row.dateOfBirth),
      // morphologicalProfile est nullable en DB — fallback 'standard' pour les
      // anciennes lignes sans profil (compatibilité Migration MVP).
      morphologicalProfile: MorphologicalProfile.values.byName(
        row.morphologicalProfile ?? 'standard',
      ),
      createdAt: DateTime.parse(row.createdAt),
    );
  }
}
