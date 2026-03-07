// GuidedCameraOverlay — overlay caméra avec machine d'états couleur.
// [Source: docs/implementation-artifacts/3-1-lancement-de-session-guidage-camera.md#T2]
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../../shared/design_system/app_colors.dart';

/// États visuels de l'overlay caméra guidé.
///
/// | État        | Couleur bordure  | Texte zone basse             | Bouton    |
/// |-------------|------------------|------------------------------|-----------|
/// | idle        | blanc 40%        | —                            | Masqué    |
/// | positioning | #FF9500 orange   | "Orientez de profil"         | Masqué    |
/// | lowLight    | #FF9500 orange   | "Améliorez l'éclairage"      | Masqué    |
/// | ready       | #34C759 vert     | "Prêt — appuyez pour filmer" | Visible   |
/// | recording   | #FF3B30 rouge    | "En cours..."                | → Stop    |
enum CameraOverlayState { idle, positioning, lowLight, ready, recording }

/// Overlay de guidage caméra — affiche un rectangle coloré selon l'état.
///
/// Reçoit [overlayState] et déclenche [onStart]/[onStop] via les boutons.
/// Haptic feedback à la transition vers [CameraOverlayState.ready].
/// Accessibilité VoiceOver via [Semantics].
///
/// [Source: docs/implementation-artifacts/3-1-lancement-de-session-guidage-camera.md#DevNotes]
class GuidedCameraOverlay extends StatefulWidget {
  const GuidedCameraOverlay({
    super.key,
    required this.overlayState,
    this.onStart,
    this.onStop,
  });

  final CameraOverlayState overlayState;
  final VoidCallback? onStart;
  final VoidCallback? onStop;

  @override
  State<GuidedCameraOverlay> createState() => _GuidedCameraOverlayState();
}

class _GuidedCameraOverlayState extends State<GuidedCameraOverlay> {
  @override
  void didUpdateWidget(GuidedCameraOverlay oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.overlayState != widget.overlayState &&
        widget.overlayState == CameraOverlayState.ready) {
      HapticFeedback.lightImpact();
    }
  }

  Color get _borderColor => switch (widget.overlayState) {
        CameraOverlayState.idle => Colors.white.withOpacity(0.4),
        CameraOverlayState.positioning => AppColors.warning,
        CameraOverlayState.lowLight => AppColors.warning,
        CameraOverlayState.ready => AppColors.success,
        CameraOverlayState.recording => AppColors.error,
      };

  String? get _statusText => switch (widget.overlayState) {
        CameraOverlayState.idle => null,
        CameraOverlayState.positioning => 'Orientez de profil',
        CameraOverlayState.lowLight => 'Améliorez l\'éclairage',
        CameraOverlayState.ready => 'Prêt — appuyez pour filmer',
        CameraOverlayState.recording => 'En cours...',
      };

  String get _semanticsLabel => switch (widget.overlayState) {
        CameraOverlayState.idle => 'Caméra inactive.',
        CameraOverlayState.positioning => 'Positionnement incorrect. Orientez de profil.',
        CameraOverlayState.lowLight => 'Lumière insuffisante. Améliorez l\'éclairage pour continuer.',
        CameraOverlayState.ready => 'Caméra prête. Appuyez sur Démarrer pour filmer.',
        CameraOverlayState.recording => 'Enregistrement en cours.',
      };

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: _semanticsLabel,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final overlayWidth = constraints.maxWidth * 0.8;
          final overlayHeight = constraints.maxHeight * 0.9;

          return Stack(
            children: [
              // Rectangle overlay centré
              Center(
                child: SizedBox(
                  width: overlayWidth,
                  height: overlayHeight,
                  child: _OverlayBorderPainter(
                    borderColor: _borderColor,
                    isRecording: widget.overlayState == CameraOverlayState.recording,
                  ),
                ),
              ),

              // Zone texte basse
              if (_statusText != null)
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: constraints.maxHeight * 0.05 + 72,
                  child: Center(
                    child: Text(
                      _statusText!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),

              // Bouton Démarrer (uniquement en état ready)
              if (widget.overlayState == CameraOverlayState.ready)
                Positioned(
                  left: 24,
                  right: 24,
                  bottom: 24,
                  child: SizedBox(
                    height: 56,
                    child: FilledButton(
                      key: const Key('start_button'),
                      onPressed: widget.onStart,
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        minimumSize: const Size(double.infinity, 56),
                      ),
                      child: const Text(
                        'Démarrer',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ),

              // Bouton Stop (uniquement en état recording)
              if (widget.overlayState == CameraOverlayState.recording)
                Positioned(
                  left: 24,
                  right: 24,
                  bottom: 24,
                  child: SizedBox(
                    height: 56,
                    child: OutlinedButton(
                      key: const Key('stop_button'),
                      onPressed: widget.onStop,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                        minimumSize: const Size(double.infinity, 56),
                      ),
                      child: const Text(
                        'Arrêter',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

/// CustomPainter pour le rectangle overlay avec bordure colorée.
///
/// Compatible Impeller — pas de saveLayer ni de maskFilter complexe (NFR-P2).
class _OverlayBorderPainter extends StatelessWidget {
  const _OverlayBorderPainter({
    required this.borderColor,
    required this.isRecording,
  });

  final Color borderColor;
  final bool isRecording;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        border: Border.all(
          color: borderColor,
          width: isRecording ? 3.0 : 2.0,
        ),
        borderRadius: BorderRadius.circular(8),
      ),
    );
  }
}
