// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'patients_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Notifier Riverpod — gère la liste patients de façon réactive.
///
/// build() retourne un Stream<List<Patient>> — la liste se met à jour
/// automatiquement à chaque insertion ou suppression en base Drift.
///
/// [Source: docs/implementation-artifacts/2-1-creer-un-profil-patient.md#T4.1]

@ProviderFor(PatientsNotifier)
final patientsProvider = PatientsNotifierProvider._();

/// Notifier Riverpod — gère la liste patients de façon réactive.
///
/// build() retourne un Stream<List<Patient>> — la liste se met à jour
/// automatiquement à chaque insertion ou suppression en base Drift.
///
/// [Source: docs/implementation-artifacts/2-1-creer-un-profil-patient.md#T4.1]
final class PatientsNotifierProvider
    extends $StreamNotifierProvider<PatientsNotifier, List<Patient>> {
  /// Notifier Riverpod — gère la liste patients de façon réactive.
  ///
  /// build() retourne un Stream<List<Patient>> — la liste se met à jour
  /// automatiquement à chaque insertion ou suppression en base Drift.
  ///
  /// [Source: docs/implementation-artifacts/2-1-creer-un-profil-patient.md#T4.1]
  PatientsNotifierProvider._()
      : super(
          from: null,
          argument: null,
          retry: null,
          name: r'patientsProvider',
          isAutoDispose: true,
          dependencies: null,
          $allTransitiveDependencies: null,
        );

  @override
  String debugGetCreateSourceHash() => _$patientsNotifierHash();

  @$internal
  @override
  PatientsNotifier create() => PatientsNotifier();
}

String _$patientsNotifierHash() => r'd004c0498c01de86bd8c8364036f86b3ae13fa64';

/// Notifier Riverpod — gère la liste patients de façon réactive.
///
/// build() retourne un Stream<List<Patient>> — la liste se met à jour
/// automatiquement à chaque insertion ou suppression en base Drift.
///
/// [Source: docs/implementation-artifacts/2-1-creer-un-profil-patient.md#T4.1]

abstract class _$PatientsNotifier extends $StreamNotifier<List<Patient>> {
  Stream<List<Patient>> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<AsyncValue<List<Patient>>, List<Patient>>;
    final element = ref.element as $ClassProviderElement<
        AnyNotifier<AsyncValue<List<Patient>>, List<Patient>>,
        AsyncValue<List<Patient>>,
        Object?,
        Object?>;
    element.handleCreate(ref, build);
  }
}
