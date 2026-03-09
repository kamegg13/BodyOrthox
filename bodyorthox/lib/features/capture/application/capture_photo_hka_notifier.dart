// Notifier pour la capture photo HKA — Story 3.0.
//
// Gère le cycle complet : ouverture caméra native → analyse ML Kit → état.
// Utilise [analysisRegistryProvider] pour accéder au [HKAModule] sans couplage direct.
//
// Pattern testabilité : [pickImageOverride] permet de mocker [ImagePicker] en tests
// sans hardware. Conforme au pattern PoseDetectorInterface (arch-2).
//
// [Source: docs/implementation-artifacts/3-0-capture-photo-hka.md#Notifier]
// [Source: docs/implementation-artifacts/arch-2-hka-module-premier-module-concret.md]

import 'package:cross_file/cross_file.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/analysis/analysis_provider.dart';
import '../../../core/analysis/analysis_result.dart';

import '../domain/capture_photo_state.dart';

/// Notifier de capture photo HKA — gère le flux idle → processing → completed/failed.
///
/// Usage production : `CapturePhotoHkaNotifier()` (ImagePicker natif iOS).
/// Usage test : `CapturePhotoHkaNotifier(pickImageOverride: () async => XFile(path))`.
class CapturePhotoHkaNotifier extends Notifier<CapturePhotoState> {
  /// Override de la factory ImagePicker pour les tests unitaires.
  ///
  /// Si non null, remplace `ImagePicker().pickImage()` — permet de tester sans hardware.
  final Future<XFile?> Function()? _pickImageOverride;

  CapturePhotoHkaNotifier({Future<XFile?> Function()? pickImageOverride})
      : _pickImageOverride = pickImageOverride;

  @override
  CapturePhotoState build() => const CapturePhotoIdle();

  /// Lance la capture photo et l'analyse HKA.
  ///
  /// Séquence :
  /// 1. Ouvre la caméra iOS native via [ImagePicker.pickImage]
  /// 2. AC7 — si annulé (null), reste idle silencieusement
  /// 3. AC4 — passe en [CapturePhotoProcessing] pendant l'analyse
  /// 4. AC3 — appelle [HKAModule.analyze] via [analysisRegistryProvider]
  /// 5. AC5 — succès → [CapturePhotoCompleted]
  /// 6. AC6 — échec → [CapturePhotoFailed]
  Future<void> captureAndAnalyze() async {
    // AC2 — ouvrir la caméra iOS native (ou override pour les tests)
    final XFile? photo = _pickImageOverride != null
        ? await _pickImageOverride!()
        : await ImagePicker().pickImage(source: ImageSource.camera);

    // AC7 — annulation silencieuse : rester idle sans message d'erreur
    if (photo == null) return;

    // AC4 — indiquer que le traitement est en cours
    state = const CapturePhotoProcessing();

    // AC3 — accéder au module HKA via le registry
    final registry = ref.read(analysisRegistryProvider);
    final hkaModule = registry.get('hka');

    if (hkaModule == null) {
      state = const CapturePhotoFailed(
        PhotoProcessingError('HKA module not registered'),
      );
      return;
    }

    // AC6 — guard contre toute exception non gérée du module (évite état bloqué en Processing)
    try {
      final result = await hkaModule.analyze(photo);

      // AC5 / AC6 — switch exhaustif sur sealed class AnalysisResult
      switch (result) {
        case AnalysisSuccess():
          state = CapturePhotoCompleted(result);
        case AnalysisFailure(:final error):
          state = CapturePhotoFailed(error);
      }
    } catch (e) {
      // Module a lancé une exception inattendue (defensive — HKAModule swallows, mais modules futurs peuvent)
      state = CapturePhotoFailed(PhotoProcessingError(e.toString()));
    }
  }

  /// Réinitialise l'état à idle — utilisé après un échec pour permettre un retry (AC6).
  void reset() => state = const CapturePhotoIdle();
}

/// Provider global du [CapturePhotoHkaNotifier].
///
/// Accessible depuis [CapturePhotoHkaScreen] via `ref.watch(capturePhotoHkaProvider)`.
final capturePhotoHkaProvider =
    NotifierProvider<CapturePhotoHkaNotifier, CapturePhotoState>(
  () => CapturePhotoHkaNotifier(),
);
