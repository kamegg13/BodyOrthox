import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/analysis_history_notifier.dart';
import 'widgets/clinical_progression_chart.dart';

/// Écran de progression clinique — visualisation chronologique des angles articulaires.
///
/// AC : nécessite au moins 2 analyses pour afficher le graphique.
/// AC : état loading → CupertinoActivityIndicator.
/// AC : état erreur → message textuel.
/// [Source: docs/implementation-artifacts/story-2-4-progression-clinique.md#T4]
class PatientTimelineScreen extends ConsumerWidget {
  const PatientTimelineScreen({super.key, required this.patientId});

  final String patientId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analysisState = ref.watch(analysisHistoryProvider(patientId));

    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('Progression clinique'),
      ),
      child: SafeArea(
        child: switch (analysisState) {
          AsyncData(:final value) when value.length < 2 => const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  'Ajoutez au moins 2 analyses pour visualiser la progression',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: CupertinoColors.secondaryLabel,
                  ),
                ),
              ),
            ),
          AsyncData(:final value) => Padding(
              padding: const EdgeInsets.all(16),
              child: ClinicalProgressionChart(analyses: value),
            ),
          AsyncLoading() => const Center(
              child: CupertinoActivityIndicator(),
            ),
          AsyncError(:final error) => Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  'Erreur : $error',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 16,
                    color: CupertinoColors.systemRed,
                  ),
                ),
              ),
            ),
        },
      ),
    );
  }
}
