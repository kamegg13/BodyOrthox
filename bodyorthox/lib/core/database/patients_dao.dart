part of 'app_database.dart';

/// DAO Patients — accès aux données patients via Drift.
///
/// Toutes les méthodes doivent être appelées depuis [PatientRepository] (Epic 2).
/// Accès DAO direct depuis un Notifier ou un Widget : interdit.
/// [Source: docs/planning-artifacts/architecture.md#Anti-patterns-explicites]
@DriftAccessor(tables: [Patients])
class PatientsDao extends DatabaseAccessor<AppDatabase> with _$PatientsDaoMixin {
  PatientsDao(super.db);

  /// Stream réactif — liste complète triée par nom croissant.
  ///
  /// L'UI se met à jour automatiquement après chaque [insertPatient] ou [deletePatient].
  Stream<List<Patient>> watchAll() =>
      (select(patients)..orderBy([(t) => OrderingTerm.asc(t.name)])).watch();

  /// Insère un patient en base.
  ///
  /// [entry] doit contenir un [id] UUID v4 et un [createdAt] ISO 8601 UTC.
  /// Lève [SqliteException] si l'[id] existe déjà.
  Future<void> insertPatient(PatientsCompanion entry) =>
      into(patients).insert(entry);

  /// Supprime le patient identifié par [id].
  ///
  /// NOTE : ne supprime PAS les analyses associées en cascade — appeler
  /// [AnalysesDao.deleteByPatient] avant, ou dans une transaction Drift.
  Future<void> deletePatient(String id) =>
      (delete(patients)..where((t) => t.id.equals(id))).go();

  /// Récupère un patient par son [id] — null si introuvable.
  ///
  /// Utilisé par [ResultsNotifier] pour charger le profil du patient.
  /// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task2]
  Future<Patient?> findById(String id) =>
      (select(patients)..where((t) => t.id.equals(id))).getSingleOrNull();

  /// Recherche par nom (insensible à la casse) — utilise idx_patients_name.
  ///
  /// Retourne un Stream réactif filtré par [query].
  Stream<List<Patient>> watchByName(String query) =>
      (select(patients)
            ..where((t) => t.name.lower().like('%${query.toLowerCase()}%'))
            ..orderBy([(t) => OrderingTerm.asc(t.name)]))
          .watch();
}
