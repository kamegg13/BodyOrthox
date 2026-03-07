// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'capture_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Luminosité normalisée [0.0, 1.0] — mise à jour depuis le stream de frames.
///
/// Valeur initiale 1.0 (luminosité suffisante) pour éviter un faux lowLight.

@ProviderFor(LuminosityNotifier)
final luminosityProvider = LuminosityNotifierProvider._();

/// Luminosité normalisée [0.0, 1.0] — mise à jour depuis le stream de frames.
///
/// Valeur initiale 1.0 (luminosité suffisante) pour éviter un faux lowLight.
final class LuminosityNotifierProvider
    extends $NotifierProvider<LuminosityNotifier, double> {
  /// Luminosité normalisée [0.0, 1.0] — mise à jour depuis le stream de frames.
  ///
  /// Valeur initiale 1.0 (luminosité suffisante) pour éviter un faux lowLight.
  LuminosityNotifierProvider._()
      : super(
          from: null,
          argument: null,
          retry: null,
          name: r'luminosityProvider',
          isAutoDispose: true,
          dependencies: null,
          $allTransitiveDependencies: null,
        );

  @override
  String debugGetCreateSourceHash() => _$luminosityNotifierHash();

  @$internal
  @override
  LuminosityNotifier create() => LuminosityNotifier();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(double value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<double>(value),
    );
  }
}

String _$luminosityNotifierHash() =>
    r'48ce699e41678a052e518eba235486788b193295';

/// Luminosité normalisée [0.0, 1.0] — mise à jour depuis le stream de frames.
///
/// Valeur initiale 1.0 (luminosité suffisante) pour éviter un faux lowLight.

abstract class _$LuminosityNotifier extends $Notifier<double> {
  double build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<double, double>;
    final element = ref.element as $ClassProviderElement<
        AnyNotifier<double, double>, double, Object?, Object?>;
    element.handleCreate(ref, build);
  }
}

/// Indicateur de positionnement correct (vue de profil).
///
/// Valeur initiale false — overlay commence en 'positioning' jusqu'à validation.

@ProviderFor(CorrectPositionNotifier)
final correctPositionProvider = CorrectPositionNotifierProvider._();

/// Indicateur de positionnement correct (vue de profil).
///
/// Valeur initiale false — overlay commence en 'positioning' jusqu'à validation.
final class CorrectPositionNotifierProvider
    extends $NotifierProvider<CorrectPositionNotifier, bool> {
  /// Indicateur de positionnement correct (vue de profil).
  ///
  /// Valeur initiale false — overlay commence en 'positioning' jusqu'à validation.
  CorrectPositionNotifierProvider._()
      : super(
          from: null,
          argument: null,
          retry: null,
          name: r'correctPositionProvider',
          isAutoDispose: true,
          dependencies: null,
          $allTransitiveDependencies: null,
        );

  @override
  String debugGetCreateSourceHash() => _$correctPositionNotifierHash();

  @$internal
  @override
  CorrectPositionNotifier create() => CorrectPositionNotifier();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(bool value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<bool>(value),
    );
  }
}

String _$correctPositionNotifierHash() =>
    r'a6784473be96b34f4185436b5e0e75a6b5433631';

/// Indicateur de positionnement correct (vue de profil).
///
/// Valeur initiale false — overlay commence en 'positioning' jusqu'à validation.

abstract class _$CorrectPositionNotifier extends $Notifier<bool> {
  bool build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<bool, bool>;
    final element = ref.element as $ClassProviderElement<
        AnyNotifier<bool, bool>, bool, Object?, Object?>;
    element.handleCreate(ref, build);
  }
}
