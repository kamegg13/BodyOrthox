// Providers Riverpod pour la feature results.
// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task2]
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/database/database_provider.dart';
import '../../capture/data/analysis_repository.dart';
import '../../capture/data/drift_analysis_repository.dart';
import '../../patients/data/drift_patient_repository.dart';
import '../../patients/data/patient_repository.dart';

// Re-export du notifier généré pour que les consommateurs n'aient qu'un import.
export 'results_notifier.dart';

part 'results_provider.g.dart';

/// Enum vue simple / experte — persisté via [resultsViewProvider].
enum ResultsView { simple, expert }

/// Repository d'analyses injecté dans [ResultsNotifier].
///
/// Séparé de [analysisRepositoryProvider] (capture) pour éviter la dépendance
/// circulaire entre features.
final resultsAnalysisRepositoryProvider = Provider<AnalysisRepository>((ref) {
  return DriftAnalysisRepository(ref.watch(databaseProvider));
});

/// Repository patients injecté dans [ResultsNotifier].
final resultsPatientRepositoryProvider = Provider<PatientRepository>((ref) {
  return DriftPatientRepository(ref.watch(databaseProvider));
});

/// Contrôleur de vue simple / experte.
///
/// Synchrone — pas d'async (NotifierProvider, pas AsyncNotifierProvider).
/// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#DevNotes]
@riverpod
class ResultsViewController extends _$ResultsViewController {
  @override
  ResultsView build() => ResultsView.simple;

  void toggle() => state =
      state == ResultsView.simple ? ResultsView.expert : ResultsView.simple;
}
