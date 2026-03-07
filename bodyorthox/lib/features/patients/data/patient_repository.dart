import '../domain/patient.dart';

/// Interface abstraite — contrat Repository pour la feature patients.
///
/// L'implémentation Drift respecte ce contrat.
/// Rationale : migration PowerSync (cloud Phase 2) triviale sans refacto.
/// [Source: docs/planning-artifacts/architecture.md#Abstraction-Repository]
abstract class PatientRepository {
  /// Stream réactif — émet à chaque modification de la liste patients.
  Stream<List<Patient>> watchAll();

  /// Persiste un nouveau patient en base chiffrée.
  Future<void> save(Patient patient);

  /// Récupère un patient par son [id] — null si introuvable.
  ///
  /// Utilisé par [ResultsNotifier] pour charger le profil du patient.
  Future<Patient?> findById(String id);

  /// Supprime un patient et toutes ses données associées en transaction atomique.
  ///
  /// Supprime dans l'ordre : analyses liées → patient.
  /// Si la transaction échoue, aucune donnée partielle ne subsiste (NFR-R2).
  /// [Source: docs/implementation-artifacts/2-4-timeline-de-progression-clinique-et-suppression-patient.md#T1.2]
  Future<void> deleteWithAnalyses(String patientId);
}
