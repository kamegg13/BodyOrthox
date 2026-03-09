// Interface commune à tous les modules d'analyse — pattern plugin.
//
// Ajouter un nouveau type d'analyse = créer une classe qui implémente
// AnalysisModule. Zéro touche au core.
//
// [Source: docs/implementation-artifacts/arch-1-interface-analysis-module.md#Tâche 2]
// [Source: docs/planning-artifacts/sprint-change-proposal-2026-03-08.md#Section 4.3]

import 'package:cross_file/cross_file.dart';

import 'analysis_result.dart';

/// Interface commune à tous les modules d'analyse BodyOrthox.
///
/// Chaque type d'analyse (HKA, Cobb, axe fémoral...) implémente cette
/// interface. Le core de l'app ne connaît que [AnalysisModule] et
/// [AnalysisRegistry] — jamais les modules concrets.
///
/// Exemple d'implémentation :
/// ```dart
/// class HKAModule implements AnalysisModule {
///   @override
///   String get moduleId => 'hka';
///   @override
///   String get displayName => 'Analyse HKA';
///   @override
///   Future<AnalysisResult> analyze(XFile photo) async { ... }
/// }
/// ```
abstract class AnalysisModule {
  /// Identifiant unique du module — snake_case, stable dans le temps.
  ///
  /// Ex : `'hka'`, `'cobb'`, `'femoral_axis'`.
  /// Utilisé comme clé dans [AnalysisRegistry] et dans les quotas freemium.
  String get moduleId;

  /// Nom affiché dans l'UI — localisé, court.
  ///
  /// Ex : `'Analyse HKA'`, `'Angle de Cobb'`.
  String get displayName;

  /// Lance l'analyse sur la photo fournie et retourne le résultat.
  ///
  /// [photo] — photo capturée par l'appareil photo iOS natif (image_picker).
  ///
  /// Retourne [AnalysisSuccess] avec les mesures, ou [AnalysisFailure] si
  /// la détection échoue ou si la confiance ML est insuffisante.
  Future<AnalysisResult> analyze(XFile photo);
}
