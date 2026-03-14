// Écran de capture photo HKA — Story 3.0.
//
// Affiche CameraInstructionCard en état idle (AC1).
// Affiche AnalysisProgressBanner pendant le traitement (AC4).
// Utilise ref.listen pour navigation (AC5) et SnackBar (AC6) sans re-build excessif.
//
// ⚠️ Ne PAS utiliser GuidedCameraOverlay (Sprint Change 2026-03-08, AC8).
// ⚠️ Ne PAS importer les anciens types features/capture/domain/ — uniquement core/analysis/.
//
// [Source: docs/implementation-artifacts/3-0-capture-photo-hka.md#Écran-UI]

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/analysis/analysis_result.dart';
import '../application/capture_photo_hka_notifier.dart';
import '../domain/capture_photo_state.dart';
import 'widgets/camera_instruction_card.dart';

/// Écran de capture photo HKA — point d'entrée du pipeline biomécanique.
///
/// Flux :
/// 1. Affiche instruction + bouton "Prendre une photo" (AC1)
/// 2. Tap → ouverture caméra iOS native (AC2)
/// 3. Photo capturée → analyse automatique (AC3) + banner (AC4)
/// 4. Succès → navigation vers `/results` (AC5)
/// 5. Échec → SnackBar adapté + retry (AC6)
/// 6. Annulation → reste idle silencieusement (AC7)
class CapturePhotoHkaScreen extends ConsumerWidget {
  const CapturePhotoHkaScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // ref.listen UNIQUEMENT pour les effets de bord : navigation et SnackBar (AC5, AC6)
    ref.listen<CapturePhotoState>(capturePhotoHkaProvider, (_, next) {
      switch (next) {
        case CapturePhotoCompleted(:final success):
          // AC5 — naviguer vers ResultsScreen en passant AnalysisSuccess
          context.go('/results', extra: success);

        case CapturePhotoFailed(:final error):
          // AC6 — afficher message d'erreur adapté au type d'erreur
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(_errorMessage(error)),
              duration: const Duration(seconds: 4),
            ),
          );
          // Permettre retry — retour à idle
          ref.read(capturePhotoHkaProvider.notifier).reset();

        case CapturePhotoIdle():
        case CapturePhotoProcessing():
          break;
      }
    });

    final state = ref.watch(capturePhotoHkaProvider);
    final isProcessing = state is CapturePhotoProcessing;

    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7), // iOS system groupedBackground
      appBar: AppBar(
        title: const Text('Analyse HKA'),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: CameraInstructionCard(
              onCaptureTap: isProcessing
                  ? () {} // AC4 — désactivé pendant le traitement
                  : () => ref
                      .read(capturePhotoHkaProvider.notifier)
                      .captureAndAnalyze(),
              isProcessing: isProcessing,
            ),
          ),
        ),
      ),
    );
  }

}

/// Message d'erreur adapté au type d'[AnalysisError] — AC6.
///
/// Fonction top-level privée (pas de dépendance à l'instance du Widget).
String _errorMessage(AnalysisError error) => switch (error) {
      MLLowConfidence(:final score) =>
        'Qualité insuffisante (${(score * 100).toInt()}%). '
            'Repositionnez le patient et réessayez.',
      MLDetectionFailed() =>
        'Patient non détecté. '
            'Assurez-vous que le corps entier est visible.',
      PhotoProcessingError() => 'Erreur de traitement. Réessayez.',
    };
