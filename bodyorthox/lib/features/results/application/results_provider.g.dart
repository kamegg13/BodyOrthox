// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'results_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Contrôleur de vue simple / experte.
///
/// Synchrone — pas d'async (NotifierProvider, pas AsyncNotifierProvider).
/// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#DevNotes]

@ProviderFor(ResultsViewController)
final resultsViewControllerProvider = ResultsViewControllerProvider._();

/// Contrôleur de vue simple / experte.
///
/// Synchrone — pas d'async (NotifierProvider, pas AsyncNotifierProvider).
/// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#DevNotes]
final class ResultsViewControllerProvider
    extends $NotifierProvider<ResultsViewController, ResultsView> {
  /// Contrôleur de vue simple / experte.
  ///
  /// Synchrone — pas d'async (NotifierProvider, pas AsyncNotifierProvider).
  /// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#DevNotes]
  ResultsViewControllerProvider._()
      : super(
          from: null,
          argument: null,
          retry: null,
          name: r'resultsViewControllerProvider',
          isAutoDispose: true,
          dependencies: null,
          $allTransitiveDependencies: null,
        );

  @override
  String debugGetCreateSourceHash() => _$resultsViewControllerHash();

  @$internal
  @override
  ResultsViewController create() => ResultsViewController();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ResultsView value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ResultsView>(value),
    );
  }
}

String _$resultsViewControllerHash() =>
    r'ec04c6bf0e1c81632f760932e65c9c6005c2b443';

/// Contrôleur de vue simple / experte.
///
/// Synchrone — pas d'async (NotifierProvider, pas AsyncNotifierProvider).
/// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#DevNotes]

abstract class _$ResultsViewController extends $Notifier<ResultsView> {
  ResultsView build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<ResultsView, ResultsView>;
    final element = ref.element as $ClassProviderElement<
        AnyNotifier<ResultsView, ResultsView>, ResultsView, Object?, Object?>;
    element.handleCreate(ref, build);
  }
}
