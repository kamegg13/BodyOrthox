import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' show Divider;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/design_system/app_colors.dart';
import '../../capture/domain/analysis.dart';
import '../application/analysis_history_notifier.dart';
import '../application/patient_delete_notifier.dart';
import '../application/patients_notifier.dart';
import 'widgets/patient_history_tile.dart';

/// Fiche patient — historique chronologique décroissant de ses analyses.
///
/// AC1 Story 2.3 : liste triée par created_at DESC.
/// AC3-AC5 Story 2.4 : suppression avec confirmation, navigation timeline.
/// [Source: docs/implementation-artifacts/2-3-historique-des-analyses-dun-patient.md#T7]
/// [Source: docs/implementation-artifacts/2-4-timeline-de-progression-clinique-et-suppression-patient.md#T5]
class PatientDetailScreen extends ConsumerWidget {
  const PatientDetailScreen({super.key, required this.patientId});

  final String patientId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Récupère le nom du patient depuis la liste en mémoire (patientsProvider).
    final patientsState = ref.watch(patientsProvider);
    final patientName = patientsState.whenData(
      (list) => list.where((p) => p.id == patientId).firstOrNull?.name,
    ).value;

    final analysisState = ref.watch(analysisHistoryProvider(patientId));
    final deleteState = ref.watch(patientDeleteProvider);

    return CupertinoPageScaffold(
      backgroundColor: AppColors.surface,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.surface,
        middle: Text(patientName ?? 'Fiche patient'),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Bouton timeline — AC1 Story 2.4
            CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: () => context.push('/patients/$patientId/timeline'),
              child: const Icon(
                CupertinoIcons.graph_square,
                color: AppColors.primary,
              ),
            ),
            // Bouton suppression — AC3 Story 2.4
            CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: deleteState is AsyncLoading
                  ? null
                  : () => _showDeleteConfirmation(context, ref, patientName),
              child: deleteState is AsyncLoading
                  ? const CupertinoActivityIndicator()
                  : const Icon(
                      CupertinoIcons.trash,
                      color: AppColors.error,
                    ),
            ),
          ],
        ),
      ),
      child: SafeArea(
        child: switch (analysisState) {
          // Switch exhaustif Dart 3 — interdit : .when()
          AsyncData(:final value) when value.isEmpty => const _EmptyHistoryView(),
          AsyncData(:final value) => _AnalysisListView(analyses: value),
          AsyncLoading() => const Center(child: CupertinoActivityIndicator()),
          AsyncError(:final error) => Center(
              child: Text(
                'Erreur : $error',
                style: const TextStyle(color: AppColors.error),
              ),
            ),
        },
      ),
    );
  }

  void _showDeleteConfirmation(
    BuildContext context,
    WidgetRef ref,
    String? patientName,
  ) {
    showCupertinoDialog<void>(
      context: context,
      builder: (_) => CupertinoAlertDialog(
        title: const Text('Supprimer ce patient ?'),
        content: Text(
          'Cette action est irréversible. '
          '${patientName ?? 'Ce patient'} et toutes ses analyses associées '
          'seront définitivement supprimés.',
        ),
        actions: [
          CupertinoDialogAction(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Annuler'),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            onPressed: () {
              Navigator.of(context).pop();
              ref
                  .read(patientDeleteProvider.notifier)
                  .deletePatient(patientId)
                  .then((_) {
                if (context.mounted) {
                  context.go('/patients');
                }
              });
            },
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
  }
}

class _EmptyHistoryView extends StatelessWidget {
  const _EmptyHistoryView();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            CupertinoIcons.waveform_path_ecg,
            size: 64,
            color: CupertinoColors.systemGrey3,
          ),
          SizedBox(height: 16),
          Text(
            'Aucune analyse pour ce patient',
            style: TextStyle(
              fontSize: 17,
              color: CupertinoColors.secondaryLabel,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Lancez la première analyse depuis l\'écran principal',
            style: TextStyle(
              fontSize: 13,
              color: CupertinoColors.tertiaryLabel,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _AnalysisListView extends StatelessWidget {
  const _AnalysisListView({required this.analyses});

  final List<Analysis> analyses;

  @override
  Widget build(BuildContext context) {
    // ListView.separated — lazy rendering, NFR-C2 (5 000+ analyses sans dégradation).
    return ListView.separated(
      itemCount: analyses.length,
      separatorBuilder: (_, __) => const Divider(height: 1, indent: 16),
      itemBuilder: (context, index) => PatientHistoryTile(analysis: analyses[index]),
    );
  }
}
