// Écran de résultats d'analyse — switch exhaustif Dart 3, toggle vue simple/experte.
// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task6]
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/legal/legal_constants.dart';
import '../../../shared/design_system/app_colors.dart';
import '../../../shared/design_system/app_spacing.dart';
import '../application/results_provider.dart';
import '../domain/analysis_result_display.dart';
import 'widgets/expert_view.dart';
import 'widgets/simple_view.dart';

/// Écran de résultats — affiche les angles articulaires avec normes de référence.
///
/// Switch exhaustif Dart 3 sur AsyncValue<AnalysisResultDisplay> (AC7) :
/// - [AsyncData] → résultats complets
/// - [AsyncLoading] → spinner
/// - [AsyncError] → message d'erreur
///
/// Toggle vue simple / experte (AC4) en 1 tap, in-place (AnimatedSwitcher).
/// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task6]
class ResultsScreen extends ConsumerWidget {
  const ResultsScreen({
    super.key,
    required this.analysisId,
  });

  final String analysisId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(resultsProvider(analysisId));
    final currentView = ref.watch(resultsViewControllerProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: () => context.pop(),
          child: const Icon(Icons.arrow_back_ios, color: AppColors.primary),
        ),
        title: const Text(
          'Résultats',
          style: TextStyle(
            fontSize: 34,
            fontWeight: FontWeight.w400,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      // Switch exhaustif Dart 3 sur AsyncValue — INTERDIT : .when() (AC7)
      body: switch (state) {
        AsyncData(:final value) => _buildContent(
            context,
            ref,
            value,
            currentView,
          ),
        AsyncLoading() => const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          ),
        AsyncError(:final error) => _buildError(context, error),
      },
    );
  }

  Widget _buildContent(
    BuildContext context,
    WidgetRef ref,
    AnalysisResultDisplay display,
    ResultsView currentView,
  ) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.margin),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Toggle vue simple / experte (AC4) — 1 tap, in-place
          _buildViewToggle(context, ref, currentView),
          const SizedBox(height: AppSpacing.large),

          // Contenu animé — bascule sans navigation push
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            switchInCurve: Curves.easeInOut,
            switchOutCurve: Curves.easeInOut,
            child: switch (currentView) {
              ResultsView.simple => SimpleView(
                  key: const ValueKey('simple'),
                  display: display,
                ),
              ResultsView.expert => ExpertView(
                  key: const ValueKey('expert'),
                  display: display,
                ),
            },
          ),
          const SizedBox(height: AppSpacing.large),

          // Bouton "Exporter PDF" — navigue vers report/ (Story 4.1)
          SizedBox(
            height: AppSpacing.touchTarget + 12,
            child: FilledButton(
              onPressed: () {
                // Story 4.1 implémentera la génération PDF
                // Navigation stub : pas de route report/ encore définie
              },
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.borderRadius),
                ),
              ),
              child: const Text(
                'Exporter PDF',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.base),

          // Disclaimer EU MDR — OBLIGATOIRE, jamais inline (AC legal)
          Text(
            LegalConstants.mdrDisclaimer,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.secondaryText,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.large),
        ],
      ),
    );
  }

  Widget _buildViewToggle(
    BuildContext context,
    WidgetRef ref,
    ResultsView currentView,
  ) {
    return SegmentedButton<ResultsView>(
      segments: const [
        ButtonSegment(
          value: ResultsView.simple,
          label: Text('Vue simple'),
        ),
        ButtonSegment(
          value: ResultsView.expert,
          label: Text('Vue experte'),
        ),
      ],
      selected: {currentView},
      onSelectionChanged: (_) =>
          ref.read(resultsViewControllerProvider.notifier).toggle(),
      style: SegmentedButton.styleFrom(
        selectedBackgroundColor: AppColors.primary,
        selectedForegroundColor: Colors.white,
      ),
    );
  }

  Widget _buildError(BuildContext context, Object error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.large),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: AppColors.error, size: 48),
            const SizedBox(height: AppSpacing.base),
            Text(
              'Impossible de charger les résultats.',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.textPrimary,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
