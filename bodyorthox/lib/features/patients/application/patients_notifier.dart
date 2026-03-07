import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

import '../data/patient_repository.dart';
import '../domain/morphological_profile.dart';
import '../domain/patient.dart';
import 'patients_provider.dart';

part 'patients_notifier.g.dart';

/// Notifier Riverpod — gère la liste patients de façon réactive.
///
/// build() retourne un Stream<List<Patient>> — la liste se met à jour
/// automatiquement à chaque insertion ou suppression en base Drift.
///
/// [Source: docs/implementation-artifacts/2-1-creer-un-profil-patient.md#T4.1]
@riverpod
class PatientsNotifier extends _$PatientsNotifier {
  List<Patient> _allPatients = [];

  PatientRepository get _repository => ref.read(patientRepositoryProvider);

  @override
  Stream<List<Patient>> build() {
    // .map() peuple _allPatients de façon synchrone à chaque événement
    // du stream, avant que Riverpod ne mette à jour le state —
    // garantit que filterByName() dispose toujours de la liste complète.
    return ref.watch(patientRepositoryProvider).watchAll().map((patients) {
      _allPatients = patients;
      return patients;
    });
  }

  /// Crée un nouveau patient et le persiste.
  ///
  /// Lance un [ArgumentError] si le nom est vide ou ne contient que des espaces.
  /// AC4 — validation inline, AC5 — persistance via Repository.
  Future<void> createPatient({
    required String name,
    required DateTime dateOfBirth,
    required MorphologicalProfile morphologicalProfile,
  }) async {
    if (name.trim().isEmpty) {
      throw ArgumentError('Le nom du patient est requis.');
    }

    final patient = Patient(
      id: const Uuid().v4(),
      name: name.trim(),
      dateOfBirth: dateOfBirth,
      morphologicalProfile: morphologicalProfile,
      createdAt: DateTime.now().toUtc(),
    );

    await _repository.save(patient);
    // Le stream watchAll() émet automatiquement — pas de ref.invalidateSelf() nécessaire
  }

  /// Filtre la liste patients par nom (case-insensitive, trim).
  /// Un query vide restaure la liste complète.
  void filterByName(String query) {
    final trimmed = query.trim();
    if (trimmed.isEmpty) {
      state = AsyncData(List.from(_allPatients));
      return;
    }
    final lower = trimmed.toLowerCase();
    state = AsyncData(
      _allPatients.where((p) => p.name.toLowerCase().contains(lower)).toList(),
    );
  }
}
