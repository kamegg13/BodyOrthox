// Tests du CaptureNotifier — ProviderContainer.
//
// Story 3.1 : transitions CaptureIdle ↔ CaptureRecording
// Story 3.2 : guard startRecording(), états permission, AsyncValue wrapping
// Story 3.3 : startAnalysis() — pipeline ML, CaptureProcessing → CaptureCompleted/CaptureFailed
//
// [Source: docs/implementation-artifacts/3-2-script-rgpd-demarrage-enregistrement.md#T5.5]
// ignore: depend_on_referenced_packages
import 'dart:typed_data';

// ignore: depend_on_referenced_packages
import 'package:flutter_riverpod/flutter_riverpod.dart';
// ignore: depend_on_referenced_packages
import 'package:flutter_test/flutter_test.dart';
// ignore: depend_on_referenced_packages
import 'package:mocktail/mocktail.dart';

import '../data/analysis_repository.dart';
import '../domain/analysis.dart';
import '../domain/analysis_error.dart';
import '../domain/analysis_result.dart';
import '../domain/articular_angles.dart';
import '../domain/capture_state.dart';
import '../domain/confidence_score.dart';
import 'capture_notifier.dart';
import 'ml_providers.dart';
import 'ml_runner.dart';

// ─── Mocks ───────────────────────────────────────────────────────────────────

class MockMlRunner extends Mock implements MlRunner {}

class MockAnalysisRepository extends Mock implements AnalysisRepository {}

// ─── Données de test ─────────────────────────────────────────────────────────

final _stubAngles = ArticularAngles(
  kneeAngle: 45.0,
  hipAngle: 90.0,
  ankleAngle: 85.0,
);

final _stubConfidence = ConfidenceScore(
  kneeScore: 0.85,
  hipScore: 0.80,
  ankleScore: 0.90,
);

final _stubSuccess = AnalysisSuccess(
  angles: _stubAngles,
  confidence: _stubConfidence,
);

final _stubFrames = [Uint8List(10)];
const _stubPatientId = 'patient-uuid-123';
const _stubPatientSide = 'left';
const _stubPatientLabel = 'Dr. Test';

void main() {
  late ProviderContainer container;
  late MockMlRunner mockMlRunner;
  late MockAnalysisRepository mockRepo;

  setUpAll(() {
    registerFallbackValue(const AnalysisFailure(MLDetectionFailed()));
    registerFallbackValue(Analysis(
      id: 'fake-id',
      patientId: 'fake-patient',
      kneeAngle: 0.0,
      hipAngle: 0.0,
      ankleAngle: 0.0,
      confidenceScore: 0.0,
      createdAt: DateTime(2024),
    ));
  });

  setUp(() async {
    mockMlRunner = MockMlRunner();
    mockRepo = MockAnalysisRepository();
    container = ProviderContainer(
      overrides: [
        mlRunnerProvider.overrideWithValue(mockMlRunner),
        analysisRepositoryProvider.overrideWithValue(mockRepo),
      ],
    );
    // Attendre la résolution de build() async avant chaque test
    await container.read(captureProvider.future);
  });

  tearDown(() {
    container.dispose();
  });

  group('CaptureNotifier — état initial (AsyncNotifier)', () {
    test('état initial est AsyncData(CaptureIdle)', () {
      final state = container.read(captureProvider);
      expect(state, isA<AsyncData<CaptureState>>());
      expect(state.value, isA<CaptureIdle>());
    });
  });

  group('CaptureNotifier — startRecording() avec guard (AC2 Story 3.2)', () {
    test('startRecording() depuis CaptureIdle → AsyncData(CaptureRecording)', () async {
      await container.read(captureProvider.notifier).startRecording();

      final state = container.read(captureProvider);
      expect(state.value, isA<CaptureRecording>());
    });

    test('startRecording() depuis CaptureRecording → état inchangé (guard anti double-tap)', () async {
      // Arrange : mettre en CaptureRecording
      await container.read(captureProvider.notifier).startRecording();
      expect(container.read(captureProvider).value, isA<CaptureRecording>());

      // Act : tenter un second startRecording
      await container.read(captureProvider.notifier).startRecording();

      // Assert : toujours CaptureRecording (pas de transition)
      expect(container.read(captureProvider).value, isA<CaptureRecording>());
    });
  });

  group('CaptureNotifier — startAnalysis() pipeline ML (Story 3.3)', () {
    test('depuis CaptureIdle → no-op (guard — doit être CaptureRecording)', () async {
      // Arrange : état initial CaptureIdle
      expect(container.read(captureProvider).value, isA<CaptureIdle>());

      // Act
      await container.read(captureProvider.notifier).startAnalysis(
            frameBytes: _stubFrames,
            patientId: _stubPatientId,
            patientSide: _stubPatientSide,
            patientLabel: _stubPatientLabel,
          );

      // Assert : état inchangé — mlRunner jamais appelé
      expect(container.read(captureProvider).value, isA<CaptureIdle>());
      verifyNever(() => mockMlRunner.run(
            frameBytes: any(named: 'frameBytes'),
            patientSide: any(named: 'patientSide'),
          ));
    });

    test('succès ML → CaptureCompleted (AC2) — save() appelé (AC7)', () async {
      // Arrange
      when(
        () => mockMlRunner.run(
          frameBytes: any(named: 'frameBytes'),
          patientSide: any(named: 'patientSide'),
        ),
      ).thenAnswer((_) async => _stubSuccess);
      when(() => mockRepo.save(any())).thenAnswer((_) async {});
      // (stream watchAnalysesForPatient non requis pour ce test)

      await container.read(captureProvider.notifier).startRecording();

      // Act
      await container.read(captureProvider.notifier).startAnalysis(
            frameBytes: _stubFrames,
            patientId: _stubPatientId,
            patientSide: _stubPatientSide,
            patientLabel: _stubPatientLabel,
          );

      // Assert
      final state = container.read(captureProvider).value;
      expect(state, isA<CaptureCompleted>());
      final completed = state as CaptureCompleted;
      expect(completed.result, isA<AnalysisSuccess>());
      verify(() => mockRepo.save(any())).called(1);
    });

    test('échec ML → CaptureFailed (AC7) — save() jamais appelé', () async {
      // Arrange
      when(
        () => mockMlRunner.run(
          frameBytes: any(named: 'frameBytes'),
          patientSide: any(named: 'patientSide'),
        ),
      ).thenAnswer((_) async => const AnalysisFailure(MLDetectionFailed()));

      await container.read(captureProvider.notifier).startRecording();

      // Act
      await container.read(captureProvider.notifier).startAnalysis(
            frameBytes: _stubFrames,
            patientId: _stubPatientId,
            patientSide: _stubPatientSide,
            patientLabel: _stubPatientLabel,
          );

      // Assert
      final state = container.read(captureProvider).value;
      expect(state, isA<CaptureFailed>());
      verifyNever(() => mockRepo.save(any()));
    });
  });

  group('CaptureNotifier — stopCapture() → CaptureIdle (AC5 Story 3.1)', () {
    test('stopCapture() depuis CaptureRecording → AsyncData(CaptureIdle)', () async {
      // Arrange
      await container.read(captureProvider.notifier).startRecording();
      expect(container.read(captureProvider).value, isA<CaptureRecording>());

      // Act
      container.read(captureProvider.notifier).stopCapture();

      // Assert
      expect(container.read(captureProvider).value, isA<CaptureIdle>());
    });

    test('relance immédiate : stopCapture() puis startRecording() → CaptureRecording (AC5)', () async {
      await container.read(captureProvider.notifier).startRecording();
      container.read(captureProvider.notifier).stopCapture();
      expect(container.read(captureProvider).value, isA<CaptureIdle>());

      await container.read(captureProvider.notifier).startRecording();
      expect(container.read(captureProvider).value, isA<CaptureRecording>());
    });

    test('stopCapture() depuis CaptureIdle reste CaptureIdle (idempotent)', () {
      container.read(captureProvider.notifier).stopCapture();
      expect(container.read(captureProvider).value, isA<CaptureIdle>());
    });
  });
}
