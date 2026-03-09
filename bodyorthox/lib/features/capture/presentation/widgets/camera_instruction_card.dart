// Widget CameraInstructionCard — glass-morphism, Story 3.0.
//
// Affiche les instructions de positionnement du patient et le bouton de capture.
// Design system : Clinical White (#1B6FBF, SF Pro, 8pt spacing).
// Glass-morphism : BackdropFilter + BoxDecoration translucide.
//
// AC1 : icône accessibility_new + titre + sous-titre + bouton 52pt (photo_camera)
// AC4 : bouton remplacé par AnalysisProgressBanner quand isProcessing = true
// AC8 : aucun GuidedCameraOverlay — photo statique uniquement
//
// [Source: docs/implementation-artifacts/3-0-capture-photo-hka.md#Widget-CameraInstructionCard]
// [Source: docs/planning-artifacts/ux-design-specification.md#Step-1-Capture]

import 'dart:ui';

import 'package:flutter/material.dart';

/// Carte d'instruction glass-morphism pour la capture photo HKA.
///
/// Paramètres :
/// - [onCaptureTap] : callback déclenché par le bouton "Prendre une photo"
/// - [isProcessing] : si true, affiche un indicateur de progression (AC4)
class CameraInstructionCard extends StatelessWidget {
  final VoidCallback onCaptureTap;
  final bool isProcessing;

  const CameraInstructionCard({
    super.key,
    required this.onCaptureTap,
    this.isProcessing = false,
  });

  static const Color _primary = Color(0xFF1B6FBF);
  static const Color _secondaryText = Color(0xFF8E8E93);

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(28),
      child: BackdropFilter(
        // AC1 glass-morphism — blur uniforme 10px
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.7),
            border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
            borderRadius: BorderRadius.circular(28),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // AC1 — icône accessibility_new
              const Icon(
                Icons.accessibility_new,
                size: 56,
                color: _primary,
              ),
              const SizedBox(height: 16),

              // AC1 — titre principal
              const Text(
                'Placez le patient debout, face à vous',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1C1C1E),
                ),
              ),
              const SizedBox(height: 8),

              // AC1 — sous-titre
              const Text(
                'Corps entier visible dans le cadre',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: _secondaryText,
                ),
              ),
              const SizedBox(height: 32),

              // AC4 — bouton ou banner selon l'état
              if (isProcessing)
                _AnalysisProgressBanner()
              else
                _buildCaptureButton(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCaptureButton() {
    return SizedBox(
      height: 52, // AC1 — 52pt de hauteur
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: onCaptureTap,
        icon: const Icon(Icons.photo_camera, size: 24), // AC1 — photo_camera
        label: const Text(
          'Prendre une photo',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w600,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: _primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24),
        ),
      ),
    );
  }
}

/// Banner de progression d'analyse — AC4.
///
/// Affiché à la place du bouton pendant le traitement ML Kit.
/// L'utilisateur ne peut pas ré-déclencher pendant cet état.
class _AnalysisProgressBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(
            strokeWidth: 2.5,
            color: Color(0xFF1B6FBF),
          ),
        ),
        SizedBox(width: 12),
        Text(
          'Analyse en cours…',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: Color(0xFF1B6FBF),
          ),
        ),
      ],
    );
  }
}
