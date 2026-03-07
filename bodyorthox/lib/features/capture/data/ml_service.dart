// Interface abstraite pour le service ML Kit.
// [Source: docs/implementation-artifacts/3-3-pipeline-ml-on-device-extraction-des-angles.md#T2.3]
import 'dart:typed_data';

import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';

/// Interface abstraite — contrat pour l'extraction des poses ML Kit.
///
/// Découplage : permet de mocker MlService dans les tests sans dépendance ML Kit.
/// [Source: docs/planning-artifacts/architecture.md#Abstraction-Repository]
abstract class MlService {
  /// Extrait les poses de chaque frame (format YUV420 bytes).
  ///
  /// [frames] : liste de frames en mémoire (jamais écrits sur disque — NFR-S5).
  /// [imageWidth], [imageHeight] : dimensions des frames pour InputImage.
  /// Retourne une liste de [Pose] (1 par frame traité avec succès).
  Future<List<Pose>> extractPoses(
    List<Uint8List> frames, {
    required int imageWidth,
    required int imageHeight,
  });

  /// Libère les ressources ML Kit (PoseDetector).
  Future<void> dispose();
}
