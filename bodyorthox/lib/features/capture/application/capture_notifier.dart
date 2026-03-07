// CaptureNotifier — machine d'états Riverpod pour la session de capture.
// [Source: docs/implementation-artifacts/3-2-script-rgpd-demarrage-enregistrement.md#T2]
import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

import '../../../core/notifications/notification_service.dart';
import '../data/analysis_repository.dart';
import '../domain/analysis.dart';
import '../domain/analysis_result.dart';
import '../domain/capture_state.dart';
import '../domain/confidence_score.dart';
import 'ml_providers.dart';
import 'ml_runner.dart';

part 'capture_notifier.g.dart';

/// Notifier Riverpod — gère la machine d'états de la session de capture guidée.
///
/// Pattern : AsyncNotifier<CaptureState> — build() est async pour les opérations
/// asynchrones (permission caméra, enregistrement, analyse ML).
///
/// [Source: docs/implementation-artifacts/3-2-script-rgpd-demarrage-enregistrement.md#DevNotes]
@riverpod
class CaptureNotifier extends _$CaptureNotifier {
  @override
  Future<CaptureState> build() async => const CaptureIdle();

  /// Demande la permission caméra via permission_handler.
  ///
  /// Transitions :
  ///   - Pendant la demande : CapturePermissionPending
  ///   - Permission accordée : CaptureIdle
  ///   - Permission refusée  : CapturePermissionDenied
  ///
  /// [Source: docs/implementation-artifacts/3-2-script-rgpd-demarrage-enregistrement.md#T2]
  Future<void> requestCameraPermission() async {
    state = const AsyncValue.data(CapturePermissionPending());

    final status = await Permission.camera.status;
    if (status.isGranted) {
      state = const AsyncValue.data(CaptureIdle());
      return;
    }

    final result = await Permission.camera.request();
    if (result.isGranted) {
      state = const AsyncValue.data(CaptureIdle());
    } else {
      state = const AsyncValue.data(CapturePermissionDenied());
    }
  }

  /// Démarre l'enregistrement vidéo — guard contre double-tap.
  ///
  /// Pré-condition : état courant doit être CaptureIdle (AC2 Story 3.2).
  /// Si état != CaptureIdle → no-op (guard).
  ///
  /// [Source: docs/implementation-artifacts/3-2-script-rgpd-demarrage-enregistrement.md#T5]
  Future<void> startRecording() async {
    final current = state.asData?.value;
    if (current is! CaptureIdle) return;
    state = const AsyncValue.data(CaptureRecording());
  }

  /// Lance le pipeline ML sur les frames enregistrés et persiste le résultat.
  ///
  /// Transitions d'état :
  ///   CaptureRecording → CaptureProcessing → CaptureCompleted (succès)
  ///                                        → CaptureFailed (erreur ML)
  ///
  /// Guard : no-op si état courant != CaptureRecording.
  /// Sur succès : persistance atomique via [AnalysisRepository] + notification locale.
  /// Sur échec  : zéro persistance (NFR-R2) + état CaptureFailed.
  ///
  /// [Source: docs/implementation-artifacts/3-3-pipeline-ml-on-device-extraction-des-angles.md#T5]
  Future<void> startAnalysis({
    required List<Uint8List> frameBytes,
    required String patientId,
    required String patientSide,
    required String patientLabel,
  }) async {
    final current = state.asData?.value;
    if (current is! CaptureRecording) return;

    state = const AsyncValue.data(CaptureProcessing());

    final MlRunner mlRunner = ref.read(mlRunnerProvider);
    final AnalysisRepository repository = ref.read(analysisRepositoryProvider);

    final result = await mlRunner.run(
      frameBytes: frameBytes,
      patientSide: patientSide,
    );

    switch (result) {
      case AnalysisSuccess(:final angles, :final confidence):
        final analysis = Analysis(
          id: const Uuid().v4(),
          patientId: patientId,
          kneeAngle: angles.kneeAngle,
          hipAngle: angles.hipAngle,
          ankleAngle: angles.ankleAngle,
          confidenceScore: confidence.globalScore,
          createdAt: DateTime.now().toUtc(),
        );
        await repository.save(analysis);
        try {
          await NotificationService.instance.showAnalysisReady(
            patientLabel: patientLabel,
            angles: angles,
          );
        } catch (_) {
          // Notification non critique — erreur ignorée (ex: plugin non init en tests)
        }
        state = AsyncValue.data(CaptureCompleted(result));

      case AnalysisFailure(:final error):
        // Zéro persistance — NFR-R2
        state = AsyncValue.data(CaptureFailed(error));
    }
  }

  /// Arrête la capture et revient à CaptureIdle.
  ///
  /// Permet la relance immédiate sans quitter l'écran (AC5 Story 3.1).
  void stopCapture() {
    state = const AsyncValue.data(CaptureIdle());
  }
}
