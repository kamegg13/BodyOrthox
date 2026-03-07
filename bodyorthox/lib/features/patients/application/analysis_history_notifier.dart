import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../capture/domain/analysis.dart';
import 'analysis_history_provider.dart';

part 'analysis_history_notifier.g.dart';

/// Notifier Riverpod — liste réactive des analyses d'un patient.
///
/// build(patientId) retourne un Stream<List<Analysis>> trié par date décroissante.
/// La liste se met à jour automatiquement à chaque insertion via Drift.
///
/// [Source: docs/implementation-artifacts/2-3-historique-des-analyses-dun-patient.md#T5]
@riverpod
class AnalysisHistoryNotifier extends _$AnalysisHistoryNotifier {
  @override
  Stream<List<Analysis>> build(String patientId) {
    // Via repository UNIQUEMENT — jamais de DAO direct (anti-pattern interdit).
    return ref.read(analysisRepositoryProvider).watchAnalysesForPatient(patientId);
  }
}
