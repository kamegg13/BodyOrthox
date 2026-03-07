// ReplayScreen — écran conteneur du replay expert (Story 3.5).
// Initialise les frames depuis le ResultsNotifier et délègue à ReplayViewer.
// [Source: docs/implementation-artifacts/3-5-replay-expert-correction-manuelle.md#Routing]
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/design_system/app_colors.dart';
import '../../../shared/widgets/loading_spinner.dart';
import '../../capture/domain/articular_angles.dart';
import '../../capture/domain/confidence_score.dart';
import '../application/results_provider.dart';
import '../domain/analysis_frame.dart';
import 'widgets/replay_viewer.dart';

/// Écran du replay expert — conteneur entre le router et [ReplayViewer].
///
/// Charge l'analyse via [resultsProvider] et construit les [AnalysisFrame]
/// à partir des données disponibles. En phase MVP, les frames sont générés
/// synthétiquement depuis les données d'analyse persistées.
class ReplayScreen extends ConsumerWidget {
  const ReplayScreen({super.key, required this.analysisId});

  final String analysisId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncDisplay = ref.watch(resultsProvider(analysisId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Replay Expert'),
        backgroundColor: AppColors.primaryLight,
        foregroundColor: AppColors.primary,
        leading: CupertinoNavigationBarBackButton(
          onPressed: () => Navigator.of(context).pop(),
          color: AppColors.primary,
        ),
      ),
      body: switch (asyncDisplay) {
        AsyncLoading() => const LoadingSpinner(),
        AsyncError(:final error) => Center(
            child: Text(
              'Impossible de charger le replay : $error',
              textAlign: TextAlign.center,
            ),
          ),
        AsyncData(:final value) => ReplayViewer(
            frames: _buildFrames(value.analysis.kneeAngle, value.analysis.hipAngle,
                value.analysis.ankleAngle, value.analysis.confidenceScore),
            analysisId: analysisId,
            onCorrectionSaved: (joint, angle) async {
              await ref
                  .read(resultsProvider(analysisId).notifier)
                  .saveManualCorrection(joint: joint, correctedAngle: angle);

              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Correction ${_jointLabel(joint)} enregistrée.',
                    ),
                    backgroundColor: AppColors.primary,
                  ),
                );
              }
            },
          ),
        _ => const SizedBox.shrink(),
      },
    );
  }

  /// Génère des frames synthétiques à partir des données d'analyse persistées.
  ///
  /// MVP : 10 frames avec légère variation autour des valeurs enregistrées.
  /// Phase 2 : remplacer par les vraies keyframes ML Kit.
  List<AnalysisFrame> _buildFrames(
    double kneeAngle,
    double hipAngle,
    double ankleAngle,
    double confidenceScore,
  ) {
    return List.generate(10, (i) {
      // Légère variation (± 2°) pour simuler les frames
      final variation = (i - 5) * 0.4;
      return AnalysisFrame.withDefaultPositions(
        frameIndex: i,
        angles: ArticularAngles(
          kneeAngle: kneeAngle + variation,
          hipAngle: hipAngle + variation * 0.5,
          ankleAngle: ankleAngle + variation * 0.3,
        ),
        confidence: ConfidenceScore(
          kneeScore: confidenceScore,
          hipScore: confidenceScore,
          ankleScore: confidenceScore,
        ),
      );
    });
  }

  String _jointLabel(String joint) => switch (joint) {
        'knee' => 'Genou',
        'hip' => 'Hanche',
        _ => 'Cheville',
      };
}
