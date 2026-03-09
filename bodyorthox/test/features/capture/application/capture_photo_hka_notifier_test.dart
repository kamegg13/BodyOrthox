// Tests unitaires de CapturePhotoHkaNotifier — Story 3.0.
//
// Strategy :
// - ImagePicker mockée via pickImageOverride (injection factory, AC2 testable sans hardware)
// - AnalysisRegistry mockée via ProviderContainer.overrides (AC3 testable sans ML Kit)
// - mocktail pour MockAnalysisRegistry / MockAnalysisModule
//
// [Source: docs/implementation-artifacts/3-0-capture-photo-hka.md#Stratégie-de-test]
// [Source: docs/implementation-artifacts/arch-1-interface-analysis-module.md]

import 'package:cross_file/cross_file.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:bodyorthox/core/analysis/analysis_module.dart';
import 'package:bodyorthox/core/analysis/analysis_provider.dart';
import 'package:bodyorthox/core/analysis/analysis_registry.dart';
import 'package:bodyorthox/core/analysis/analysis_result.dart';
import 'package:bodyorthox/features/capture/application/capture_photo_hka_notifier.dart';
import 'package:bodyorthox/features/capture/domain/capture_photo_state.dart';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

class MockAnalysisRegistry extends Mock implements AnalysisRegistry {}

class MockAnalysisModule extends Mock implements AnalysisModule {}

// ---------------------------------------------------------------------------
// Helper : conteneur de test avec registry mockée
// ---------------------------------------------------------------------------

ProviderContainer _makeContainer({
  required AnalysisRegistry registry,
  Future<XFile?> Function()? pickImageOverride,
}) {
  return ProviderContainer(
    overrides: [
      analysisRegistryProvider.overrideWithValue(registry),
      capturePhotoHkaProvider.overrideWith(
        () => CapturePhotoHkaNotifier(pickImageOverride: pickImageOverride),
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const _fakePhoto = '/test/patient_photo.jpg';

AnalysisSuccess _makeSuccess({
  double hkaLeft = 178.0,
  double hkaRight = 179.5,
  double confidenceLeft = 0.92,
  double confidenceRight = 0.91,
}) =>
    AnalysisSuccess(Map.unmodifiable({
      'hka_left': hkaLeft,
      'hka_right': hkaRight,
      'confidence_left': confidenceLeft,
      'confidence_right': confidenceRight,
    }));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  late MockAnalysisRegistry mockRegistry;
  late MockAnalysisModule mockHkaModule;

  setUp(() {
    mockRegistry = MockAnalysisRegistry();
    mockHkaModule = MockAnalysisModule();

    registerFallbackValue(XFile(_fakePhoto));
  });

  tearDown(() {
    reset(mockRegistry);
    reset(mockHkaModule);
  });

  group('CapturePhotoHkaNotifier —', () {
    // ── État initial ────────────────────────────────────────────────────────

    test('état initial est CapturePhotoIdle', () {
      final container = _makeContainer(registry: mockRegistry);
      addTearDown(container.dispose);

      expect(
        container.read(capturePhotoHkaProvider),
        isA<CapturePhotoIdle>(),
      );
    });

    // ── Succès complet (AC2, AC3, AC4, AC5) ────────────────────────────────

    test(
        'captureAndAnalyze() : idle → processing → completed sur AnalysisSuccess (AC2, AC3, AC5)',
        () async {
      final success = _makeSuccess();
      when(() => mockRegistry.get('hka')).thenReturn(mockHkaModule);
      when(() => mockHkaModule.analyze(any()))
          .thenAnswer((_) async => success);

      final states = <CapturePhotoState>[];
      final container = _makeContainer(
        registry: mockRegistry,
        pickImageOverride: () async => XFile(_fakePhoto),
      );
      addTearDown(container.dispose);

      container.listen(capturePhotoHkaProvider, (_, next) => states.add(next));

      // État initial
      states.add(container.read(capturePhotoHkaProvider));

      await container
          .read(capturePhotoHkaProvider.notifier)
          .captureAndAnalyze();

      expect(states[0], isA<CapturePhotoIdle>());
      expect(states[1], isA<CapturePhotoProcessing>());
      expect(states[2], isA<CapturePhotoCompleted>());

      final completed = states[2] as CapturePhotoCompleted;
      expect(completed.success.measurements['hka_left'], 178.0);
      expect(completed.success.measurements['hka_right'], 179.5);

      // LOW#3 fix — vérifier que analyze() a été appelé avec le bon XFile (AC2)
      final captured = verify(() => mockHkaModule.analyze(captureAny())).captured;
      expect(captured.length, 1);
      expect((captured.first as XFile).path, _fakePhoto);
    });

    // ── Annulation caméra (AC7) ─────────────────────────────────────────────

    test('captureAndAnalyze() : annulation ImagePicker → reste idle (AC7)',
        () async {
      final container = _makeContainer(
        registry: mockRegistry,
        pickImageOverride: () async => null, // utilisateur a annulé
      );
      addTearDown(container.dispose);

      await container
          .read(capturePhotoHkaProvider.notifier)
          .captureAndAnalyze();

      // État doit rester idle
      expect(
        container.read(capturePhotoHkaProvider),
        isA<CapturePhotoIdle>(),
      );

      // analyze() ne doit PAS avoir été appelé
      verifyNever(() => mockHkaModule.analyze(any()));
    });

    // ── Échec MLLowConfidence (AC6) ─────────────────────────────────────────

    test(
        'captureAndAnalyze() : MLLowConfidence → CapturePhotoFailed(MLLowConfidence) (AC6)',
        () async {
      when(() => mockRegistry.get('hka')).thenReturn(mockHkaModule);
      when(() => mockHkaModule.analyze(any()))
          .thenAnswer((_) async => const AnalysisFailure(MLLowConfidence(0.5)));

      final container = _makeContainer(
        registry: mockRegistry,
        pickImageOverride: () async => XFile(_fakePhoto),
      );
      addTearDown(container.dispose);

      await container
          .read(capturePhotoHkaProvider.notifier)
          .captureAndAnalyze();

      final state = container.read(capturePhotoHkaProvider);
      expect(state, isA<CapturePhotoFailed>());

      final failed = state as CapturePhotoFailed;
      expect(failed.error, isA<MLLowConfidence>());
      expect((failed.error as MLLowConfidence).score, 0.5);
    });

    // ── Échec MLDetectionFailed (AC6) ───────────────────────────────────────

    test(
        'captureAndAnalyze() : MLDetectionFailed → CapturePhotoFailed(MLDetectionFailed) (AC6)',
        () async {
      when(() => mockRegistry.get('hka')).thenReturn(mockHkaModule);
      when(() => mockHkaModule.analyze(any()))
          .thenAnswer((_) async => const AnalysisFailure(MLDetectionFailed()));

      final container = _makeContainer(
        registry: mockRegistry,
        pickImageOverride: () async => XFile(_fakePhoto),
      );
      addTearDown(container.dispose);

      await container
          .read(capturePhotoHkaProvider.notifier)
          .captureAndAnalyze();

      final state = container.read(capturePhotoHkaProvider);
      expect(state, isA<CapturePhotoFailed>());
      expect((state as CapturePhotoFailed).error, isA<MLDetectionFailed>());
    });

    // ── Module HKA absent du registry ───────────────────────────────────────

    test(
        'captureAndAnalyze() : HKA module non enregistré → CapturePhotoFailed(PhotoProcessingError)',
        () async {
      when(() => mockRegistry.get('hka')).thenReturn(null); // module absent

      final container = _makeContainer(
        registry: mockRegistry,
        pickImageOverride: () async => XFile(_fakePhoto),
      );
      addTearDown(container.dispose);

      await container
          .read(capturePhotoHkaProvider.notifier)
          .captureAndAnalyze();

      final state = container.read(capturePhotoHkaProvider);
      expect(state, isA<CapturePhotoFailed>());
      expect((state as CapturePhotoFailed).error, isA<PhotoProcessingError>());
    });

    // ── reset() (AC6 retry) ──────────────────────────────────────────────────

    test('reset() : CapturePhotoFailed → CapturePhotoIdle', () async {
      when(() => mockRegistry.get('hka')).thenReturn(mockHkaModule);
      when(() => mockHkaModule.analyze(any()))
          .thenAnswer((_) async => const AnalysisFailure(MLDetectionFailed()));

      final container = _makeContainer(
        registry: mockRegistry,
        pickImageOverride: () async => XFile(_fakePhoto),
      );
      addTearDown(container.dispose);

      // Forcer l'état Failed
      await container
          .read(capturePhotoHkaProvider.notifier)
          .captureAndAnalyze();
      expect(container.read(capturePhotoHkaProvider), isA<CapturePhotoFailed>());

      // reset() doit retourner à idle
      container.read(capturePhotoHkaProvider.notifier).reset();
      expect(container.read(capturePhotoHkaProvider), isA<CapturePhotoIdle>());
    });

    // ── Échec PhotoProcessingError depuis analyze() (AC6) ───────────────────
    // MEDIUM#1 fix — AC6 couvre MLLowConfidence, MLDetectionFailed ET PhotoProcessingError

    test(
        'captureAndAnalyze() : PhotoProcessingError depuis analyze() → CapturePhotoFailed(PhotoProcessingError) (AC6)',
        () async {
      when(() => mockRegistry.get('hka')).thenReturn(mockHkaModule);
      when(() => mockHkaModule.analyze(any())).thenAnswer(
        (_) async => const AnalysisFailure(PhotoProcessingError('fichier corrompu')),
      );

      final container = _makeContainer(
        registry: mockRegistry,
        pickImageOverride: () async => XFile(_fakePhoto),
      );
      addTearDown(container.dispose);

      await container
          .read(capturePhotoHkaProvider.notifier)
          .captureAndAnalyze();

      final state = container.read(capturePhotoHkaProvider);
      expect(state, isA<CapturePhotoFailed>());
      final failed = state as CapturePhotoFailed;
      expect(failed.error, isA<PhotoProcessingError>());
    });

    // ── Exception inattendue du module (MEDIUM#2 — defensive try/catch) ─────

    test(
        'captureAndAnalyze() : exception inattendue de analyze() → CapturePhotoFailed(PhotoProcessingError)',
        () async {
      when(() => mockRegistry.get('hka')).thenReturn(mockHkaModule);
      when(() => mockHkaModule.analyze(any()))
          .thenThrow(StateError('unexpected module crash'));

      final container = _makeContainer(
        registry: mockRegistry,
        pickImageOverride: () async => XFile(_fakePhoto),
      );
      addTearDown(container.dispose);

      // Ne doit pas propager l'exception, ni rester bloqué en Processing
      await container
          .read(capturePhotoHkaProvider.notifier)
          .captureAndAnalyze();

      final state = container.read(capturePhotoHkaProvider);
      expect(state, isA<CapturePhotoFailed>());
      expect((state as CapturePhotoFailed).error, isA<PhotoProcessingError>());
    });

    // ── Vérification AC4 : processing avant analyze ──────────────────────────

    test('captureAndAnalyze() : state = processing avant que analyze() complète (AC4)',
        () async {
      final processingStates = <bool>[];
      final completer = Future<AnalysisResult>.delayed(
        const Duration(milliseconds: 50),
        () => _makeSuccess(),
      );

      when(() => mockRegistry.get('hka')).thenReturn(mockHkaModule);
      when(() => mockHkaModule.analyze(any())).thenAnswer((_) => completer);

      final container = _makeContainer(
        registry: mockRegistry,
        pickImageOverride: () async => XFile(_fakePhoto),
      );
      addTearDown(container.dispose);

      container.listen(capturePhotoHkaProvider, (prev, next) {
        if (next is CapturePhotoProcessing) processingStates.add(true);
      });

      final future = container
          .read(capturePhotoHkaProvider.notifier)
          .captureAndAnalyze();

      // Vérifier qu'on passe bien par processing AVANT la completion
      await Future.delayed(const Duration(milliseconds: 10));
      expect(container.read(capturePhotoHkaProvider), isA<CapturePhotoProcessing>());

      await future;
      expect(processingStates, contains(true));
    });
  });
}
