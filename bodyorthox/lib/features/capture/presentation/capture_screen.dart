// Écran de capture guidée — orchestre CameraController, luminosité et overlay.
// [Source: docs/implementation-artifacts/3-2-script-rgpd-demarrage-enregistrement.md#T3]
import 'package:camera/camera.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

import '../application/capture_notifier.dart';
import '../application/capture_provider.dart';
import '../domain/capture_state.dart';
import 'widgets/guided_camera_overlay.dart';
import '../../../core/legal/legal_constants.dart';
import '../../../shared/design_system/app_colors.dart';

/// Écran de capture guidée — portrait strict, gestion caméra + luminosité.
///
/// - Dialog contextuel AVANT la demande système (AC3 Story 3.2)
/// - Délègue la gestion permission à [CaptureNotifier.requestCameraPermission()]
/// - Script RGPD inline depuis [LegalConstants.rgpdReassuranceScript] (AC1 Story 3.2)
/// - Switch exhaustif sur [AsyncValue<CaptureState>] et [CaptureState]
/// - Collecte des frames pendant l'enregistrement pour le pipeline ML (AC1 Story 3.3)
/// - Dialog informatif post-analyse "vidéo supprimée" (AC6 Story 3.3)
///
/// [Source: docs/implementation-artifacts/3-3-pipeline-ml-on-device-extraction-des-angles.md#T7]
class CaptureScreen extends ConsumerStatefulWidget {
  const CaptureScreen({
    super.key,
    required this.patientId,
    this.patientLabel = '', // Optionnel — défaut '' pour compatibilité router
    this.patientSide = 'left', // MVP : côté gauche par défaut (Story 3.3 DevNotes)
  });

  final String patientId;

  /// Label affiché dans la notification post-analyse.
  /// Peut être omis : la notification affichera "Analyse prête" sans nom patient.
  final String patientLabel;

  /// 'left' ou 'right' — sélectionne les landmarks ML Kit du côté filmé.
  final String patientSide;

  @override
  ConsumerState<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends ConsumerState<CaptureScreen>
    with WidgetsBindingObserver {
  CameraController? _cameraController;
  bool _isCameraInitialized = false;

  /// Frames collectés pendant l'enregistrement — envoyés au pipeline ML à l'arrêt.
  /// NFR-S5 : ces bytes ne sont jamais écrits sur disque.
  final List<Uint8List> _framesDuringRecording = [];
  bool _isCollectingFrames = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Portrait strict pendant la capture (UX spec)
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    // Démarrer le flux permission → caméra après le premier frame
    WidgetsBinding.instance.addPostFrameCallback((_) => _startPermissionFlow());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    // Relâcher l'orientation au dispose
    SystemChrome.setPreferredOrientations(DeviceOrientation.values);
    _cameraController?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_cameraController == null || !_isCameraInitialized) return;
    if (state == AppLifecycleState.inactive) {
      setState(() => _isCameraInitialized = false);
      _cameraController!.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initCamera(_cameraController!.description);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Flux permission → caméra (AC3 Story 3.2)
  // ─────────────────────────────────────────────────────────────────────────

  Future<void> _startPermissionFlow() async {
    final status = await Permission.camera.status;

    // Chemin rapide : permission déjà accordée → init caméra directement
    if (status.isGranted) {
      await _initCameraWithFirstCamera();
      return;
    }

    // Afficher le dialog explicatif AVANT le prompt système iOS (AC3)
    if (status.isDenied || status.isRestricted) {
      if (!mounted) return;
      final confirmed = await _showCameraPermissionDialog();
      if (!confirmed) return; // Utilisateur a annulé le pre-dialog
    }

    // Déléguer la demande OS au notifier (AC5 : permission via CaptureNotifier)
    if (!mounted) return;
    await ref.read(captureProvider.notifier).requestCameraPermission();

    if (!mounted) return;
    // Init caméra uniquement si permission accordée
    final captureState = ref.read(captureProvider).asData?.value;
    if (captureState is CaptureIdle) {
      await _initCameraWithFirstCamera();
    }
  }

  Future<bool> _showCameraPermissionDialog() async {
    if (!mounted) return false;
    // Texte AC3 : contextuel, avant la demande système iOS
    final confirmed = await showCupertinoDialog<bool>(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: const Text('Accès à la caméra'),
        content: const Text(
          'BodyOrthox utilise votre caméra uniquement pendant l\'analyse. '
          'La vidéo reste sur votre appareil.',
        ),
        actions: [
          CupertinoDialogAction(
            isDestructiveAction: true,
            child: const Text('Pas maintenant'),
            onPressed: () => Navigator.of(ctx).pop(false),
          ),
          CupertinoDialogAction(
            isDefaultAction: true,
            child: const Text('Autoriser'),
            onPressed: () => Navigator.of(ctx).pop(true),
          ),
        ],
      ),
    );
    return confirmed ?? false;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Caméra (AC6 — 58 FPS, NFR-P2 Impeller)
  // ─────────────────────────────────────────────────────────────────────────

  Future<void> _initCameraWithFirstCamera() async {
    final cameras = await availableCameras();
    if (cameras.isEmpty) return;
    // Caméra arrière uniquement pour l'analyse biomécanique
    final backCamera = cameras.firstWhere(
      (c) => c.lensDirection == CameraLensDirection.back,
      orElse: () => cameras.first,
    );
    await _initCamera(backCamera);
  }

  Future<void> _initCamera(CameraDescription description) async {
    final controller = CameraController(
      description,
      ResolutionPreset.high,
      enableAudio: false,
      imageFormatGroup: ImageFormatGroup.yuv420,
    );
    _cameraController = controller;

    try {
      await controller.initialize();
      if (!mounted) return;

      // Stream de frames pour la détection luminosité (Task 3.2-3.5)
      await controller.startImageStream(_processFrame);

      setState(() => _isCameraInitialized = true);
    } on CameraException {
      // Caméra indisponible — ne pas bloquer l'UI
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Luminosité & collecte de frames (NFR-P5, AC1 Story 3.3)
  // ─────────────────────────────────────────────────────────────────────────

  int _frameCount = 0;

  void _processFrame(CameraImage image) {
    // Traiter 1 frame sur 3 pour limiter la charge CPU tout en restant < 100ms
    _frameCount++;
    if (_frameCount % 3 != 0) return;

    final luminosity = _computeLuminosity(image);
    ref.read(luminosityProvider.notifier).update(luminosity);

    // MVP : position OK si le device est en portrait strict
    final isCorrectPosition = _isPortraitPosition();
    ref.read(correctPositionProvider.notifier).update(isCorrectPosition);

    // Collecte des frames pour le pipeline ML (AC1 Story 3.3 — NFR-S5)
    // Échantillonnage 1/2 des frames traités (≈ 15 FPS) pour perf < 30s (NFR-P1)
    if (_isCollectingFrames && _frameCount % 2 == 0) {
      // Concaténer tous les plans YUV420 (iOS : Y-plane + UV-plane interleaved)
      // ML Kit exige les données complètes — plan Y seul insuffisant pour la détection de pose
      final allBytes = image.planes.fold<List<int>>(
        [],
        (list, plane) => list..addAll(plane.bytes),
      );
      _framesDuringRecording.add(Uint8List.fromList(allBytes));
    }
  }

  double _computeLuminosity(CameraImage image) {
    // Plan Y du format YUV420 — luminance moyenne [0.0, 1.0]
    // Sampling 1 pixel sur 16 pour rester bien < 100ms sur tous devices (NFR-P5).
    final yPlane = image.planes[0];
    final bytes = yPlane.bytes;
    const step = 16;
    int sum = 0;
    int count = 0;
    for (int i = 0; i < bytes.length; i += step) {
      sum += bytes[i] & 0xFF;
      count++;
    }
    if (count == 0) return 1.0;
    return sum / (count * 255.0);
  }

  bool _isPortraitPosition() {
    // MVP : heuristique portrait = correct — raffiné en Story 3.3 avec pose detection
    return true;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Arrêt enregistrement + pipeline ML (Story 3.3)
  // ─────────────────────────────────────────────────────────────────────────

  /// Arrête la collecte et lance l'analyse ML — appelé par le bouton Stop.
  ///
  /// Les frames collectés sont transmis à [CaptureNotifier.startAnalysis()].
  /// La vidéo brute disparaît structurellement à la fin de l'isolate (NFR-S5, AC1).
  void _handleStopAndAnalyze() {
    _isCollectingFrames = false;
    final frames = List<Uint8List>.from(_framesDuringRecording);
    _framesDuringRecording.clear();

    ref.read(captureProvider.notifier).startAnalysis(
          frameBytes: frames,
          patientId: widget.patientId,
          patientSide: widget.patientSide,
          patientLabel: widget.patientLabel,
        );
  }

  /// Dialog AC6 — informatif uniquement : la suppression est automatique (NFR-S5).
  ///
  /// [Source: docs/implementation-artifacts/3-3-pipeline-ml-on-device-extraction-des-angles.md#T7.2]
  Future<void> _showVideoDeletedDialog() async {
    if (!mounted) return;
    await showCupertinoDialog<void>(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: const Text('Vidéo supprimée'),
        content: const Text(
          'La vidéo brute a été supprimée. '
          'Seules les données cliniques sont conservées.',
        ),
        actions: [
          CupertinoDialogAction(
            isDefaultAction: true,
            child: const Text('OK'),
            onPressed: () => Navigator.of(ctx).pop(),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UI — switch exhaustif Dart 3 obligatoire (architecture)
  // ─────────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final captureAsync = ref.watch(captureProvider);
    final overlayState = ref.watch(overlayStateProvider);

    // Démarrer la collecte quand l'enregistrement commence
    ref.listen<AsyncValue<CaptureState>>(captureProvider, (prev, next) {
      final nextState = next.asData?.value;
      if (nextState is CaptureRecording) {
        _isCollectingFrames = true;
      }
      // Dialog AC6 : confirmer la suppression de la vidéo après analyse (AC6)
      if (nextState is CaptureCompleted || nextState is CaptureFailed) {
        _showVideoDeletedDialog();
      }
    });

    return Scaffold(
      backgroundColor: Colors.black,
      body: _buildBody(captureAsync, overlayState),
    );
  }

  Widget _buildBody(
    AsyncValue<CaptureState> captureAsync,
    CameraOverlayState overlayState,
  ) {
    // Switch exhaustif Dart 3 sur AsyncValue (INTERDIT : .when(), .maybeWhen())
    return switch (captureAsync) {
      AsyncData(:final value) => _buildBodyFromState(value, overlayState),
      AsyncLoading() => const Center(
          child: CircularProgressIndicator(color: Colors.white),
        ),
      AsyncError() => _buildGenericErrorView(),
    };
  }

  Widget _buildBodyFromState(
    CaptureState captureState,
    CameraOverlayState overlayState,
  ) {
    // Switch exhaustif Dart 3 sur CaptureState sealed class
    return switch (captureState) {
      CapturePermissionDenied() => _buildPermissionDeniedView(),
      CapturePermissionPending() => const Center(
          child: CircularProgressIndicator(color: Colors.white),
        ),
      CaptureProcessing() => _buildProcessingView(),
      CaptureIdle() ||
      CaptureRecording() ||
      CaptureCompleted() ||
      CaptureFailed() =>
        _isCameraInitialized && _cameraController != null
            ? _buildCaptureView(overlayState)
            : const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
    };
  }

  Widget _buildCaptureView(CameraOverlayState overlayState) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Preview caméra
        CameraPreview(_cameraController!),

        // Overlay guidé — reçoit l'état dérivé
        GuidedCameraOverlay(
          overlayState: overlayState,
          onStart: () => ref.read(captureProvider.notifier).startRecording(),
          onStop: _handleStopAndAnalyze,
        ),

        // Script RGPD inline — au-dessus du bouton "Démarrer" (AC1 Story 3.2)
        // Position : bottom 88 = bouton(24) + hauteur bouton(56) + gap(8)
        // INTERDIT : texte inline — OBLIGATOIRE : LegalConstants.rgpdReassuranceScript
        Positioned(
          left: 24,
          right: 24,
          bottom: 88,
          child: Text(
            LegalConstants.rgpdReassuranceScript,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: const Color(0xFF8E8E93), // Gris iOS système
                ),
            textAlign: TextAlign.center,
          ),
        ),

        // Bouton retour en haut à gauche
        Positioned(
          top: MediaQuery.of(context).padding.top + 8,
          left: 16,
          child: CupertinoButton(
            padding: EdgeInsets.zero,
            onPressed: () => Navigator.of(context).maybePop(),
            child: const Icon(Icons.arrow_back_ios, color: Colors.white),
          ),
        ),
      ],
    );
  }

  Widget _buildProcessingView() {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(color: Colors.white),
          SizedBox(height: 16),
          Text(
            'Analyse en cours...',
            style: TextStyle(color: Colors.white, fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildPermissionDeniedView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.camera_alt, color: Colors.white54, size: 64),
            const SizedBox(height: 16),
            const Text(
              'Accès caméra refusé',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'Activez-le dans les Réglages iOS pour utiliser BodyOrthox.',
              style: TextStyle(color: Colors.white70, fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: FilledButton(
                onPressed: () => openAppSettings(),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                ),
                child: const Text('Ouvrir les Réglages'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGenericErrorView() {
    return const Center(
      child: Text(
        'Une erreur est survenue.',
        style: TextStyle(color: Colors.white),
      ),
    );
  }
}
