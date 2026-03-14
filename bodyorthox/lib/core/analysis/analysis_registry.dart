// Registry des modules d'analyse — pattern plugin.
//
// L'app core enregistre les modules au lancement (dans app.dart via
// ProviderScope.overrides). Ajouter un nouveau module = register() ici.
//
// [Source: docs/implementation-artifacts/arch-1-interface-analysis-module.md#Tâche 3]
// [Source: docs/planning-artifacts/sprint-change-proposal-2026-03-08.md#Section 4.3]

import 'analysis_module.dart';

/// Registry des modules d'analyse disponibles dans l'app.
///
/// Utilisation :
/// ```dart
/// final registry = AnalysisRegistry();
/// registry.register(HKAModule());         // enregistrer
/// final module = registry.get('hka');     // récupérer
/// final allModules = registry.all;        // lister
/// ```
///
/// Le registry est exposé via [analysisRegistryProvider] (Riverpod).
/// Les modules concrets sont injectés dans app.dart au lancement.
class AnalysisRegistry {
  final Map<String, AnalysisModule> _modules = {};

  /// Enregistre un module d'analyse.
  ///
  /// Si un module avec le même [AnalysisModule.moduleId] existe déjà,
  /// il est remplacé (last-write-wins).
  void register(AnalysisModule module) {
    _modules[module.moduleId] = module;
  }

  /// Retourne le module correspondant à [moduleId], ou `null` si absent.
  AnalysisModule? get(String moduleId) => _modules[moduleId];

  /// Retourne la liste de tous les modules enregistrés.
  ///
  /// Utile pour afficher les analyses disponibles dans l'UI.
  List<AnalysisModule> get all => _modules.values.toList();
}
