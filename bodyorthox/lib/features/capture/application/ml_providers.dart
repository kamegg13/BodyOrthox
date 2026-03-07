// Providers ML et Repository — séparés de capture_provider.dart pour éviter
// la dépendance circulaire : capture_notifier ↔ capture_provider.
// [Source: docs/implementation-artifacts/3-3-pipeline-ml-on-device-extraction-des-angles.md#T5]
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/database/database_provider.dart';
import '../data/analysis_repository.dart';
import '../data/drift_analysis_repository.dart';
import 'ml_isolate_runner.dart';
import 'ml_runner.dart';

/// Provider du runner ML — injectable pour les tests via override.
///
/// Par défaut : [MlIsolateRunner] (pipeline complet dans un isolate dédié).
/// [Source: docs/implementation-artifacts/3-3-pipeline-ml-on-device-extraction-des-angles.md#T3]
final mlRunnerProvider = Provider<MlRunner>((ref) => MlIsolateRunner());

/// Provider du repository d'analyses — injectable pour les tests.
///
/// Par défaut : [DriftAnalysisRepository] (persistance Drift + transaction atomique).
/// [Source: docs/implementation-artifacts/3-3-pipeline-ml-on-device-extraction-des-angles.md#T5.7]
final analysisRepositoryProvider = Provider<AnalysisRepository>(
  (ref) => DriftAnalysisRepository(ref.watch(databaseProvider)),
);
