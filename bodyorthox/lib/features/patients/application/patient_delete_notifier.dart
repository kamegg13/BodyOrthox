import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../application/patients_provider.dart';

part 'patient_delete_notifier.g.dart';

/// Notifier Riverpod — suppression atomique d'un patient avec ses analyses.
///
/// Appelle [PatientRepository.deleteWithAnalyses] via le Repository.
/// AC3 : confirmation UI dans [PatientDetailScreen] (ce Notifier ne sait pas qu'il y a un dialogue).
/// AC4 : transaction atomique Drift déléguée au Repository (NFR-R2).
/// [Source: docs/implementation-artifacts/2-4-timeline-de-progression-clinique-et-suppression-patient.md#T2.3]
@riverpod
class PatientDeleteNotifier extends _$PatientDeleteNotifier {
  @override
  Future<void> build() async {}

  /// Supprime le patient [patientId] et toutes ses analyses associées.
  ///
  /// Lance une exception si la transaction Drift échoue — le caller doit la gérer.
  Future<void> deletePatient(String patientId) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(patientRepositoryProvider).deleteWithAnalyses(patientId),
    );
  }
}
