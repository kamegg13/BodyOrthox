// Vue simple — affiche les 3 articulations avec indicateurs visuels.
// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task5]
import 'package:flutter/material.dart';

import '../../../../shared/design_system/app_spacing.dart';
import '../../domain/analysis_result_display.dart';
import '../../domain/reference_norms.dart';
import 'articular_angle_card.dart';

/// Vue simple des résultats (AC3) — articulation dominante en tête + tableau compact.
///
/// [Source: docs/planning-artifacts/ux-design-specification.md#Experience-Mechanics]
class SimpleView extends StatelessWidget {
  const SimpleView({
    super.key,
    required this.display,
  });

  final AnalysisResultDisplay display;

  String _labelFor(ArticulationName name) => switch (name) {
        ArticulationName.knee => 'Flexion genou',
        ArticulationName.hip => 'Extension hanche',
        ArticulationName.ankle => 'Dorsiflexion cheville',
      };

  double _angleFor(ArticulationName name) => switch (name) {
        ArticulationName.knee => display.analysis.kneeAngle,
        ArticulationName.hip => display.analysis.hipAngle,
        ArticulationName.ankle => display.analysis.ankleAngle,
      };

  NormRange _normFor(ArticulationName name) => switch (name) {
        ArticulationName.knee => display.kneeNorm,
        ArticulationName.hip => display.hipNorm,
        ArticulationName.ankle => display.ankleNorm,
      };

  NormStatus _statusFor(ArticulationName name) => switch (name) {
        ArticulationName.knee => display.kneeStatus,
        ArticulationName.hip => display.hipStatus,
        ArticulationName.ankle => display.ankleStatus,
      };

  @override
  Widget build(BuildContext context) {
    final primary = display.primaryArticulation;
    final primaryNorm = _normFor(primary);

    // Articulations secondaires (les deux autres)
    final secondaries = ArticulationName.values
        .where((a) => a != primary)
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Articulation dominante — grande card
        ArticularAngleCard.primary(
          articulationLabel: _labelFor(primary),
          angle: _angleFor(primary),
          normMin: primaryNorm.min,
          normMax: primaryNorm.max,
          normStatus: _statusFor(primary),
          patientAge: display.patientAgeYears,
          confidenceScore: display.analysis.confidenceScore,
        ),
        const SizedBox(height: AppSpacing.base),
        // Tableau compact des deux autres articulations
        ...secondaries.map((name) {
          final norm = _normFor(name);
          return Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.base),
            child: ArticularAngleCard.compact(
              articulationLabel: _labelFor(name),
              angle: _angleFor(name),
              normMin: norm.min,
              normMax: norm.max,
              normStatus: _statusFor(name),
              patientAge: display.patientAgeYears,
              confidenceScore: display.analysis.confidenceScore,
            ),
          );
        }),
      ],
    );
  }
}
