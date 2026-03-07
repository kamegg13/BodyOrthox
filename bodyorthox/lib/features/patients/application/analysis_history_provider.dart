import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/database/database_provider.dart';
import '../../capture/data/analysis_repository.dart';
import '../../capture/data/drift_analysis_repository.dart';

/// Provider du Repository analyses.
///
/// RÈGLE : tous les providers dans {feature}_provider.dart UNIQUEMENT.
/// [Source: docs/planning-artifacts/architecture.md#Riverpod-règles-de-scoping]
final analysisRepositoryProvider = Provider<AnalysisRepository>((ref) {
  final db = ref.watch(databaseProvider);
  return DriftAnalysisRepository(db);
});
