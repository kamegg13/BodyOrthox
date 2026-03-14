// Provider Riverpod du AnalysisRegistry — singleton accessible dans l'app.
//
// Les modules concrets (HKAModule, etc.) sont enregistrés dans app.dart via
// ProviderScope.overrides — ce provider expose un registry vide par défaut.
//
// [Source: docs/implementation-artifacts/arch-1-interface-analysis-module.md#Tâche 4]

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'analysis_registry.dart';

/// Provider singleton du [AnalysisRegistry].
///
/// Accès dans les Notifiers : `ref.read(analysisRegistryProvider)`.
///
/// Pour injecter les modules concrets au lancement, utiliser
/// [ProviderScope.overrides] dans app.dart :
/// ```dart
/// ProviderScope(
///   overrides: [
///     analysisRegistryProvider.overrideWith((ref) {
///       final registry = AnalysisRegistry();
///       registry.register(HKAModule(poseDetector: ...));
///       return registry;
///     }),
///   ],
///   child: const BodyOrthoxApp(),
/// )
/// ```
final analysisRegistryProvider = Provider<AnalysisRegistry>(
  (ref) => AnalysisRegistry(),
  name: 'analysisRegistryProvider',
);
