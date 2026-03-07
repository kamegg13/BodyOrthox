// Interface abstraite MlRunner — permet le mock dans les tests.
// [Source: docs/implementation-artifacts/3-3-pipeline-ml-on-device-extraction-des-angles.md#T3]
import 'dart:typed_data';

import '../domain/analysis_result.dart';

/// Interface abstraite — contrat pour le pipeline ML on-device.
///
/// Découplage : permet d'injecter un mock via Riverpod dans les tests unitaires.
/// [Source: docs/planning-artifacts/architecture.md#Abstraction-Repository]
abstract class MlRunner {
  /// Lance l'analyse ML sur les frames fournis.
  ///
  /// [frameBytes] : frames YUV420 en mémoire (jamais sur disque — NFR-S5).
  /// [patientSide] : 'left' ou 'right' pour sélectionner les landmarks côté dominant.
  Future<AnalysisResult> run({
    required List<Uint8List> frameBytes,
    required String patientSide,
  });
}
