// Providers Riverpod pour la feature capture.
// [Source: docs/implementation-artifacts/3-2-script-rgpd-demarrage-enregistrement.md#T6]
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../presentation/widgets/guided_camera_overlay.dart';
import '../domain/capture_state.dart';
import 'capture_notifier.dart';

// Re-export ml_providers pour que les consommateurs n'aient qu'un seul import.
export 'ml_providers.dart';

part 'capture_provider.g.dart';

// Seuil de luminosité : 40/255 ≈ 0.157 — en dessous = lowLight.
const double luminosityThreshold = 40.0 / 255.0;

/// Luminosité normalisée [0.0, 1.0] — mise à jour depuis le stream de frames.
///
/// Valeur initiale 1.0 (luminosité suffisante) pour éviter un faux lowLight.
@riverpod
class LuminosityNotifier extends _$LuminosityNotifier {
  @override
  double build() => 1.0;

  void update(double value) => state = value;
}

/// Indicateur de positionnement correct (vue de profil).
///
/// Valeur initiale false — overlay commence en 'positioning' jusqu'à validation.
@riverpod
class CorrectPositionNotifier extends _$CorrectPositionNotifier {
  @override
  bool build() => false;

  void update(bool value) => state = value;
}

/// État de l'overlay dérivé de [captureProvider], [luminosityProvider]
/// et [correctPositionProvider].
///
/// Recalculé automatiquement quand l'un des trois change.
/// [Source: docs/implementation-artifacts/3-2-script-rgpd-demarrage-enregistrement.md#T6]
final overlayStateProvider = Provider<CameraOverlayState>((ref) {
  final captureAsync = ref.watch(captureProvider);
  final luminosity = ref.watch(luminosityProvider);
  final isCorrectPosition = ref.watch(correctPositionProvider);

  // Extraire la valeur ou fallback CaptureIdle si AsyncLoading/AsyncError
  final captureState = captureAsync.asData?.value ?? const CaptureIdle();

  return switch (captureState) {
    CaptureRecording() => CameraOverlayState.recording,
    CaptureProcessing() => CameraOverlayState.idle,
    CaptureCompleted() => CameraOverlayState.idle,
    CaptureFailed() => CameraOverlayState.idle,
    CapturePermissionPending() => CameraOverlayState.idle,
    CapturePermissionDenied() => CameraOverlayState.idle,
    CaptureIdle() => _overlayFromSensors(luminosity, isCorrectPosition),
  };
});

CameraOverlayState _overlayFromSensors(double luminosity, bool isCorrectPosition) {
  if (luminosity < luminosityThreshold) return CameraOverlayState.lowLight;
  if (!isCorrectPosition) return CameraOverlayState.positioning;
  return CameraOverlayState.ready;
}
