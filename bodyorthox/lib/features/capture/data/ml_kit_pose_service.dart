// Implémentation ML Kit du service d'extraction de poses.
// [Source: docs/implementation-artifacts/3-3-pipeline-ml-on-device-extraction-des-angles.md#T2.4]
import 'dart:typed_data';
import 'dart:ui';

import 'package:google_mlkit_commons/google_mlkit_commons.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';

import 'ml_service.dart';

/// Implémentation ML Kit de [MlService] — utilise [PoseDetector] en mode stream.
///
/// Mode stream : optimal pour une séquence de frames (NFR-P1 < 30s).
/// [Source: docs/implementation-artifacts/3-3-pipeline-ml-on-device-extraction-des-angles.md#T2.5]
class MlKitPoseService implements MlService {
  MlKitPoseService()
      : _detector = PoseDetector(
          options: PoseDetectorOptions(
            mode: PoseDetectionMode.stream,
          ),
        );

  final PoseDetector _detector;

  /// Taille de frame par défaut (standard 1280×720 haute résolution).
  /// Les frames capturés en Story 3.1 utilisent [ResolutionPreset.high].
  static const int _defaultWidth = 1280;
  static const int _defaultHeight = 720;

  @override
  Future<List<Pose>> extractPoses(
    List<Uint8List> frames, {
    int imageWidth = _defaultWidth,
    int imageHeight = _defaultHeight,
  }) async {
    final poses = <Pose>[];

    for (final frameBytes in frames) {
      try {
        final inputImage = InputImage.fromBytes(
          bytes: frameBytes,
          metadata: InputImageMetadata(
            size: Size(imageWidth.toDouble(), imageHeight.toDouble()),
            rotation: InputImageRotation.rotation0deg,
            format: InputImageFormat.yuv420,
            bytesPerRow: imageWidth,
          ),
        );

        final framePoses = await _detector.processImage(inputImage);
        poses.addAll(framePoses);
      } catch (_) {
        // Frame individuel illisible — ignorer et continuer (best-effort)
        continue;
      }
    }

    return poses;
  }

  @override
  Future<void> dispose() => _detector.close();
}
