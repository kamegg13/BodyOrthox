// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'results_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Notifier de l'écran de résultats — charge l'analyse et le patient,
/// calcule les normes et statuts par articulation.
///
/// Pattern : AsyncNotifier family par [analysisId].
/// Switch exhaustif Dart 3 sur AsyncValue<AnalysisResultDisplay> dans la présentation.
/// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task2]

@ProviderFor(ResultsNotifier)
final resultsProvider = ResultsNotifierFamily._();

/// Notifier de l'écran de résultats — charge l'analyse et le patient,
/// calcule les normes et statuts par articulation.
///
/// Pattern : AsyncNotifier family par [analysisId].
/// Switch exhaustif Dart 3 sur AsyncValue<AnalysisResultDisplay> dans la présentation.
/// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task2]
final class ResultsNotifierProvider
    extends $AsyncNotifierProvider<ResultsNotifier, AnalysisResultDisplay> {
  /// Notifier de l'écran de résultats — charge l'analyse et le patient,
  /// calcule les normes et statuts par articulation.
  ///
  /// Pattern : AsyncNotifier family par [analysisId].
  /// Switch exhaustif Dart 3 sur AsyncValue<AnalysisResultDisplay> dans la présentation.
  /// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task2]
  ResultsNotifierProvider._(
      {required ResultsNotifierFamily super.from,
      required String super.argument})
      : super(
          retry: null,
          name: r'resultsProvider',
          isAutoDispose: true,
          dependencies: null,
          $allTransitiveDependencies: null,
        );

  @override
  String debugGetCreateSourceHash() => _$resultsNotifierHash();

  @override
  String toString() {
    return r'resultsProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  ResultsNotifier create() => ResultsNotifier();

  @override
  bool operator ==(Object other) {
    return other is ResultsNotifierProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$resultsNotifierHash() => r'b4fccdb13a6e1517851dffc2908c78eb373190df';

/// Notifier de l'écran de résultats — charge l'analyse et le patient,
/// calcule les normes et statuts par articulation.
///
/// Pattern : AsyncNotifier family par [analysisId].
/// Switch exhaustif Dart 3 sur AsyncValue<AnalysisResultDisplay> dans la présentation.
/// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task2]

final class ResultsNotifierFamily extends $Family
    with
        $ClassFamilyOverride<ResultsNotifier, AsyncValue<AnalysisResultDisplay>,
            AnalysisResultDisplay, FutureOr<AnalysisResultDisplay>, String> {
  ResultsNotifierFamily._()
      : super(
          retry: null,
          name: r'resultsProvider',
          dependencies: null,
          $allTransitiveDependencies: null,
          isAutoDispose: true,
        );

  /// Notifier de l'écran de résultats — charge l'analyse et le patient,
  /// calcule les normes et statuts par articulation.
  ///
  /// Pattern : AsyncNotifier family par [analysisId].
  /// Switch exhaustif Dart 3 sur AsyncValue<AnalysisResultDisplay> dans la présentation.
  /// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task2]

  ResultsNotifierProvider call(
    String analysisId,
  ) =>
      ResultsNotifierProvider._(argument: analysisId, from: this);

  @override
  String toString() => r'resultsProvider';
}

/// Notifier de l'écran de résultats — charge l'analyse et le patient,
/// calcule les normes et statuts par articulation.
///
/// Pattern : AsyncNotifier family par [analysisId].
/// Switch exhaustif Dart 3 sur AsyncValue<AnalysisResultDisplay> dans la présentation.
/// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task2]

abstract class _$ResultsNotifier extends $AsyncNotifier<AnalysisResultDisplay> {
  late final _$args = ref.$arg as String;
  String get analysisId => _$args;

  FutureOr<AnalysisResultDisplay> build(
    String analysisId,
  );
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref
        as $Ref<AsyncValue<AnalysisResultDisplay>, AnalysisResultDisplay>;
    final element = ref.element as $ClassProviderElement<
        AnyNotifier<AsyncValue<AnalysisResultDisplay>, AnalysisResultDisplay>,
        AsyncValue<AnalysisResultDisplay>,
        Object?,
        Object?>;
    element.handleCreate(
        ref,
        () => build(
              _$args,
            ));
  }
}
