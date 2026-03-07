// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'patient_delete_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Notifier Riverpod — suppression atomique d'un patient avec ses analyses.
///
/// Appelle [PatientRepository.deleteWithAnalyses] via le Repository.
/// AC3 : confirmation UI dans [PatientDetailScreen] (ce Notifier ne sait pas qu'il y a un dialogue).
/// AC4 : transaction atomique Drift déléguée au Repository (NFR-R2).
/// [Source: docs/implementation-artifacts/2-4-timeline-de-progression-clinique-et-suppression-patient.md#T2.3]

@ProviderFor(PatientDeleteNotifier)
final patientDeleteProvider = PatientDeleteNotifierProvider._();

/// Notifier Riverpod — suppression atomique d'un patient avec ses analyses.
///
/// Appelle [PatientRepository.deleteWithAnalyses] via le Repository.
/// AC3 : confirmation UI dans [PatientDetailScreen] (ce Notifier ne sait pas qu'il y a un dialogue).
/// AC4 : transaction atomique Drift déléguée au Repository (NFR-R2).
/// [Source: docs/implementation-artifacts/2-4-timeline-de-progression-clinique-et-suppression-patient.md#T2.3]
final class PatientDeleteNotifierProvider
    extends $AsyncNotifierProvider<PatientDeleteNotifier, void> {
  /// Notifier Riverpod — suppression atomique d'un patient avec ses analyses.
  ///
  /// Appelle [PatientRepository.deleteWithAnalyses] via le Repository.
  /// AC3 : confirmation UI dans [PatientDetailScreen] (ce Notifier ne sait pas qu'il y a un dialogue).
  /// AC4 : transaction atomique Drift déléguée au Repository (NFR-R2).
  /// [Source: docs/implementation-artifacts/2-4-timeline-de-progression-clinique-et-suppression-patient.md#T2.3]
  PatientDeleteNotifierProvider._()
      : super(
          from: null,
          argument: null,
          retry: null,
          name: r'patientDeleteProvider',
          isAutoDispose: true,
          dependencies: null,
          $allTransitiveDependencies: null,
        );

  @override
  String debugGetCreateSourceHash() => _$patientDeleteNotifierHash();

  @$internal
  @override
  PatientDeleteNotifier create() => PatientDeleteNotifier();
}

String _$patientDeleteNotifierHash() =>
    r'6ffa02b6fa410915e20fc1d76d3cfeab384fc196';

/// Notifier Riverpod — suppression atomique d'un patient avec ses analyses.
///
/// Appelle [PatientRepository.deleteWithAnalyses] via le Repository.
/// AC3 : confirmation UI dans [PatientDetailScreen] (ce Notifier ne sait pas qu'il y a un dialogue).
/// AC4 : transaction atomique Drift déléguée au Repository (NFR-R2).
/// [Source: docs/implementation-artifacts/2-4-timeline-de-progression-clinique-et-suppression-patient.md#T2.3]

abstract class _$PatientDeleteNotifier extends $AsyncNotifier<void> {
  FutureOr<void> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<AsyncValue<void>, void>;
    final element = ref.element as $ClassProviderElement<
        AnyNotifier<AsyncValue<void>, void>,
        AsyncValue<void>,
        Object?,
        Object?>;
    element.handleCreate(ref, build);
  }
}
