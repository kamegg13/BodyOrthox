// Pipeline ML dans un Flutter isolate dédié — NFR-S5, NFR-P1, AC1.
// [Source: docs/implementation-artifacts/3-3-pipeline-ml-on-device-extraction-des-angles.md#T3]
import 'dart:isolate';
import 'dart:typed_data';

import 'package:flutter/services.dart';

import '../data/angle_calculator.dart';
import '../data/ml_kit_pose_service.dart';
import '../domain/analysis_error.dart';
import '../domain/analysis_result.dart';
import '../domain/confidence_score.dart';
import 'ml_runner.dart';

/// Runner du pipeline ML dans un Flutter isolate dédié.
///
/// CRITIQUE NFR-S5 : les frames vidéo vivent UNIQUEMENT dans cet isolate.
/// La vidéo brute n'est jamais écrite sur disque — libérée automatiquement
/// à la fin de l'isolate (fin de portée mémoire de l'isolate).
///
/// [Source: docs/planning-artifacts/architecture.md#Stratégie-vidéo-en-mémoire]
class MlIsolateRunner implements MlRunner {
  static const Duration _timeout = Duration(seconds: 30); // NFR-P1

  @override
  Future<AnalysisResult> run({
    required List<Uint8List> frameBytes,
    required String patientSide,
  }) async {
    if (frameBytes.isEmpty) {
      return const AnalysisFailure(MLDetectionFailed());
    }

    final receivePort = ReceivePort();
    // RootIsolateToken permet l'utilisation des plugins (ML Kit) depuis l'isolate
    final token = RootIsolateToken.instance!;

    final isolate = await Isolate.spawn(
      _mlIsolateEntry,
      _IsolateMessage(
        sendPort: receivePort.sendPort,
        // TransferableTypedData évite la copie mémoire inutile (AC1)
        frameBytes:
            frameBytes.map((f) => TransferableTypedData.fromList([f])).toList(),
        patientSide: patientSide,
        rootIsolateToken: token,
      ),
    );

    try {
      final result = await receivePort.first.timeout(
        _timeout,
        onTimeout: () {
          isolate.kill(priority: Isolate.immediate);
          return const AnalysisFailure(
            VideoProcessingError('Timeout après 30s — pipeline ML interrompu'),
          );
        },
      );
      return result as AnalysisResult;
    } finally {
      receivePort.close();
    }
    // L'isolate se termine ici — mémoire des frames libérée automatiquement
  }
}

/// Point d'entrée de l'isolate — DOIT être une fonction top-level (contrainte Dart).
///
/// [Source: docs/planning-artifacts/architecture.md#Pipeline-ML]
void _mlIsolateEntry(_IsolateMessage message) async {
  // Initialiser les platform channels pour ML Kit dans l'isolate (Flutter 3.7+)
  BackgroundIsolateBinaryMessenger.ensureInitialized(message.rootIsolateToken);

  try {
    // Reconstruire les frames depuis TransferableTypedData
    final frames = message.frameBytes
        .map((transferable) => transferable.materialize().asUint8List())
        .toList();

    // Extraction des poses via ML Kit
    final mlService = MlKitPoseService();
    final poses = await mlService.extractPoses(frames);
    await mlService.dispose();

    if (poses.isEmpty) {
      message.sendPort.send(const AnalysisFailure(MLDetectionFailed()));
      return;
    }

    // Calcul des angles articulaires (T4)
    final result = AngleCalculator.calculate(poses, message.patientSide);

    if (result == null) {
      message.sendPort.send(const AnalysisFailure(MLDetectionFailed()));
      return;
    }

    final (:angles, :confidence) = result;

    // Vérification seuil de confiance (AC3 — < 0.7 → MLLowConfidence)
    if (confidence.hasLowConfidence) {
      message.sendPort.send(
        AnalysisFailure(MLLowConfidence(confidence.globalScore)),
      );
      return;
    }

    message.sendPort.send(AnalysisSuccess(angles: angles, confidence: confidence));
  } catch (e) {
    message.sendPort.send(
      AnalysisFailure(VideoProcessingError(e.toString())),
    );
  }
}

/// Message envoyé à l'isolate — contient tous les paramètres nécessaires.
class _IsolateMessage {
  final SendPort sendPort;
  final List<TransferableTypedData> frameBytes;
  final String patientSide;
  final RootIsolateToken rootIsolateToken;

  const _IsolateMessage({
    required this.sendPort,
    required this.frameBytes,
    required this.patientSide,
    required this.rootIsolateToken,
  });
}
