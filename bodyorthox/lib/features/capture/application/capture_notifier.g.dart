// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'capture_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Notifier Riverpod — gère la machine d'états de la session de capture guidée.
///
/// Pattern : AsyncNotifier<CaptureState> — build() est async pour les opérations
/// asynchrones (permission caméra, enregistrement, analyse ML).
///
/// [Source: docs/implementation-artifacts/3-2-script-rgpd-demarrage-enregistrement.md#DevNotes]

@ProviderFor(CaptureNotifier)
final captureProvider = CaptureNotifierProvider._();

/// Notifier Riverpod — gère la machine d'états de la session de capture guidée.
///
/// Pattern : AsyncNotifier<CaptureState> — build() est async pour les opérations
/// asynchrones (permission caméra, enregistrement, analyse ML).
///
/// [Source: docs/implementation-artifacts/3-2-script-rgpd-demarrage-enregistrement.md#DevNotes]
final class CaptureNotifierProvider
    extends $AsyncNotifierProvider<CaptureNotifier, CaptureState> {
  /// Notifier Riverpod — gère la machine d'états de la session de capture guidée.
  ///
  /// Pattern : AsyncNotifier<CaptureState> — build() est async pour les opérations
  /// asynchrones (permission caméra, enregistrement, analyse ML).
  ///
  /// [Source: docs/implementation-artifacts/3-2-script-rgpd-demarrage-enregistrement.md#DevNotes]
  CaptureNotifierProvider._()
      : super(
          from: null,
          argument: null,
          retry: null,
          name: r'captureProvider',
          isAutoDispose: true,
          dependencies: null,
          $allTransitiveDependencies: null,
        );

  @override
  String debugGetCreateSourceHash() => _$captureNotifierHash();

  @$internal
  @override
  CaptureNotifier create() => CaptureNotifier();
}

String _$captureNotifierHash() => r'b23b90bb5230a3e904996b1fe9fb8cb8c9cf18c8';

/// Notifier Riverpod — gère la machine d'états de la session de capture guidée.
///
/// Pattern : AsyncNotifier<CaptureState> — build() est async pour les opérations
/// asynchrones (permission caméra, enregistrement, analyse ML).
///
/// [Source: docs/implementation-artifacts/3-2-script-rgpd-demarrage-enregistrement.md#DevNotes]

abstract class _$CaptureNotifier extends $AsyncNotifier<CaptureState> {
  FutureOr<CaptureState> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<AsyncValue<CaptureState>, CaptureState>;
    final element = ref.element as $ClassProviderElement<
        AnyNotifier<AsyncValue<CaptureState>, CaptureState>,
        AsyncValue<CaptureState>,
        Object?,
        Object?>;
    element.handleCreate(ref, build);
  }
}
