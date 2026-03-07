import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/database/database_provider.dart';
import '../data/drift_patient_repository.dart';
import '../data/patient_repository.dart';

/// Provider du Repository patients — retourne l'implémentation Drift.
///
/// RÈGLE : tous les providers dans {feature}_provider.dart UNIQUEMENT.
/// [Source: docs/planning-artifacts/architecture.md#Riverpod-règles-de-scoping]
final patientRepositoryProvider = Provider<PatientRepository>((ref) {
  final db = ref.watch(databaseProvider);
  return DriftPatientRepository(db);
});
