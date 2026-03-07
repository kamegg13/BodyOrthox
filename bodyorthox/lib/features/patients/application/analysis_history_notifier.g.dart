// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'analysis_history_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Notifier Riverpod — liste réactive des analyses d'un patient.
///
/// build(patientId) retourne un Stream<List<Analysis>> trié par date décroissante.
/// La liste se met à jour automatiquement à chaque insertion via Drift.
///
/// [Source: docs/implementation-artifacts/2-3-historique-des-analyses-dun-patient.md#T5]

@ProviderFor(AnalysisHistoryNotifier)
final analysisHistoryProvider = AnalysisHistoryNotifierFamily._();

/// Notifier Riverpod — liste réactive des analyses d'un patient.
///
/// build(patientId) retourne un Stream<List<Analysis>> trié par date décroissante.
/// La liste se met à jour automatiquement à chaque insertion via Drift.
///
/// [Source: docs/implementation-artifacts/2-3-historique-des-analyses-dun-patient.md#T5]
final class AnalysisHistoryNotifierProvider
    extends $StreamNotifierProvider<AnalysisHistoryNotifier, List<Analysis>> {
  /// Notifier Riverpod — liste réactive des analyses d'un patient.
  ///
  /// build(patientId) retourne un Stream<List<Analysis>> trié par date décroissante.
  /// La liste se met à jour automatiquement à chaque insertion via Drift.
  ///
  /// [Source: docs/implementation-artifacts/2-3-historique-des-analyses-dun-patient.md#T5]
  AnalysisHistoryNotifierProvider._(
      {required AnalysisHistoryNotifierFamily super.from,
      required String super.argument})
      : super(
          retry: null,
          name: r'analysisHistoryProvider',
          isAutoDispose: true,
          dependencies: null,
          $allTransitiveDependencies: null,
        );

  @override
  String debugGetCreateSourceHash() => _$analysisHistoryNotifierHash();

  @override
  String toString() {
    return r'analysisHistoryProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  AnalysisHistoryNotifier create() => AnalysisHistoryNotifier();

  @override
  bool operator ==(Object other) {
    return other is AnalysisHistoryNotifierProvider &&
        other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$analysisHistoryNotifierHash() =>
    r'dc31dcd733e1eeff4afa94a896a1e46ca5197339';

/// Notifier Riverpod — liste réactive des analyses d'un patient.
///
/// build(patientId) retourne un Stream<List<Analysis>> trié par date décroissante.
/// La liste se met à jour automatiquement à chaque insertion via Drift.
///
/// [Source: docs/implementation-artifacts/2-3-historique-des-analyses-dun-patient.md#T5]

final class AnalysisHistoryNotifierFamily extends $Family
    with
        $ClassFamilyOverride<
            AnalysisHistoryNotifier,
            AsyncValue<List<Analysis>>,
            List<Analysis>,
            Stream<List<Analysis>>,
            String> {
  AnalysisHistoryNotifierFamily._()
      : super(
          retry: null,
          name: r'analysisHistoryProvider',
          dependencies: null,
          $allTransitiveDependencies: null,
          isAutoDispose: true,
        );

  /// Notifier Riverpod — liste réactive des analyses d'un patient.
  ///
  /// build(patientId) retourne un Stream<List<Analysis>> trié par date décroissante.
  /// La liste se met à jour automatiquement à chaque insertion via Drift.
  ///
  /// [Source: docs/implementation-artifacts/2-3-historique-des-analyses-dun-patient.md#T5]

  AnalysisHistoryNotifierProvider call(
    String patientId,
  ) =>
      AnalysisHistoryNotifierProvider._(argument: patientId, from: this);

  @override
  String toString() => r'analysisHistoryProvider';
}

/// Notifier Riverpod — liste réactive des analyses d'un patient.
///
/// build(patientId) retourne un Stream<List<Analysis>> trié par date décroissante.
/// La liste se met à jour automatiquement à chaque insertion via Drift.
///
/// [Source: docs/implementation-artifacts/2-3-historique-des-analyses-dun-patient.md#T5]

abstract class _$AnalysisHistoryNotifier
    extends $StreamNotifier<List<Analysis>> {
  late final _$args = ref.$arg as String;
  String get patientId => _$args;

  Stream<List<Analysis>> build(
    String patientId,
  );
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<AsyncValue<List<Analysis>>, List<Analysis>>;
    final element = ref.element as $ClassProviderElement<
        AnyNotifier<AsyncValue<List<Analysis>>, List<Analysis>>,
        AsyncValue<List<Analysis>>,
        Object?,
        Object?>;
    element.handleCreate(
        ref,
        () => build(
              _$args,
            ));
  }
}
