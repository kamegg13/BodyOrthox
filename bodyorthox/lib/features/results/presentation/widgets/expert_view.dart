// Vue experte — données brutes + score ML + skeleton overlay + bouton replay.
// Story 3.5 : ajout du bouton "Replay Expert" (AC3, AC7).
// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task5]
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../shared/design_system/app_colors.dart';
import '../../../../shared/design_system/app_spacing.dart';
import '../../domain/analysis_result_display.dart';
import '../../domain/reference_norms.dart';
import 'articular_angle_card.dart';
import 'body_skeleton_overlay.dart';

/// Vue experte des résultats (AC4) — toutes les articulations + skeleton + scores ML.
///
/// [Source: docs/planning-artifacts/ux-design-specification.md#Experience-Mechanics]
/// Vue experte des résultats (AC4) — toutes les articulations + skeleton + scores ML.
///
/// Inclut le bouton "Replay Expert" (Story 3.5) pour accéder au replay image
/// par image avec correction manuelle des joints basse confiance.
/// [Source: docs/planning-artifacts/ux-design-specification.md#Experience-Mechanics]
class ExpertView extends StatelessWidget {
  const ExpertView({
    super.key,
    required this.display,
  });

  final AnalysisResultDisplay display;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Skeleton overlay statique (AC5)
        BodySkeletonOverlay(display: display),
        const SizedBox(height: AppSpacing.large),

        // Bouton Replay Expert — Story 3.5 (AC3, AC7)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.margin),
          child: FilledButton.icon(
            onPressed: () => context.go(
              '/patients/${display.analysis.patientId}'
              '/analyses/${display.analysis.id}/replay',
            ),
            icon: const Icon(Icons.slow_motion_video),
            label: const Text('Replay Expert'),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              minimumSize: const Size(double.infinity, 44),
            ),
          ),
        ),

        // Badge basse confiance si applicable
        if (display.isLowConfidence) ...[
          const SizedBox(height: AppSpacing.base),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.margin),
            child: Container(
              padding: const EdgeInsets.all(AppSpacing.base),
              decoration: BoxDecoration(
                color: AppColors.warning.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppSpacing.borderRadius),
                border: Border.all(color: AppColors.warning),
              ),
              child: const Row(
                children: [
                  Icon(Icons.warning_amber, color: AppColors.warning, size: 16),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Confiance ML < 60% — Correction disponible dans le Replay Expert.',
                      style: TextStyle(
                        color: AppColors.warning,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],

        const SizedBox(height: AppSpacing.large),

        // Toutes les articulations en vue experte
        ...ArticulationName.values.map((name) {
          final (angle, norm, status) = _dataFor(name);
          return Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.base),
            child: ArticularAngleCard.compact(
              articulationLabel: _labelFor(name),
              angle: angle,
              normMin: norm.min,
              normMax: norm.max,
              normStatus: status,
              patientAge: display.patientAgeYears,
              confidenceScore: display.analysis.confidenceScore,
              isExpertView: true,
            ),
          );
        }),
      ],
    );
  }

  String _labelFor(ArticulationName name) => switch (name) {
        ArticulationName.knee => 'Flexion genou',
        ArticulationName.hip => 'Extension hanche',
        ArticulationName.ankle => 'Dorsiflexion cheville',
      };

  (double, NormRange, NormStatus) _dataFor(ArticulationName name) =>
      switch (name) {
        ArticulationName.knee => (
            display.analysis.kneeAngle,
            display.kneeNorm,
            display.kneeStatus
          ),
        ArticulationName.hip => (
            display.analysis.hipAngle,
            display.hipNorm,
            display.hipStatus
          ),
        ArticulationName.ankle => (
            display.analysis.ankleAngle,
            display.ankleNorm,
            display.ankleStatus
          ),
      };
}
