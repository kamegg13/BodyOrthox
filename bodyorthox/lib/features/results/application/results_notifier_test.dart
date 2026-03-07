// Tests unitaires pour ResultsNotifier — Story 3.4 Task 2.
// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task7]
// ignore: depend_on_referenced_packages
import 'package:flutter_riverpod/flutter_riverpod.dart';
// ignore: depend_on_referenced_packages
import 'package:flutter_test/flutter_test.dart';
// ignore: depend_on_referenced_packages
import 'package:mocktail/mocktail.dart';

import '../../capture/data/analysis_repository.dart';
import '../../capture/domain/analysis.dart';
import '../../patients/data/patient_repository.dart';
import '../../patients/domain/morphological_profile.dart';
import '../../patients/domain/patient.dart';
import '../domain/analysis_result_display.dart';
import '../domain/reference_norms.dart';
import 'results_notifier.dart';
import 'results_provider.dart';

// ─── Mocks ───────────────────────────────────────────────────────────────────

class MockAnalysisRepository extends Mock implements AnalysisRepository {}

class MockPatientRepository extends Mock implements PatientRepository {}

// ─── Helpers ─────────────────────────────────────────────────────────────────

Analysis _fakeAnalysis({
  String id = 'analysis-1',
  String patientId = 'patient-1',
  double kneeAngle = 62.0,
  double hipAngle = 22.0,
  double ankleAngle = 10.0,
  double confidenceScore = 0.85,
}) =>
    Analysis(
      id: id,
      patientId: patientId,
      kneeAngle: kneeAngle,
      hipAngle: hipAngle,
      ankleAngle: ankleAngle,
      confidenceScore: confidenceScore,
      createdAt: DateTime(2026, 3, 6),
    );

Patient _fakePatient({
  String id = 'patient-1',
  int ageYears = 35,
  MorphologicalProfile profile = MorphologicalProfile.standard,
}) =>
    Patient(
      id: id,
      name: 'Dr. Test Patient',
      dateOfBirth: DateTime(2026 - ageYears, 1, 1),
      morphologicalProfile: profile,
      createdAt: DateTime(2026, 1, 1),
    );

// ─── Tests ───────────────────────────────────────────────────────────────────

void main() {
  late MockAnalysisRepository mockAnalysisRepo;
  late MockPatientRepository mockPatientRepo;
  late ProviderContainer container;

  setUp(() {
    mockAnalysisRepo = MockAnalysisRepository();
    mockPatientRepo = MockPatientRepository();
    container = ProviderContainer(
      overrides: [
        resultsAnalysisRepositoryProvider
            .overrideWithValue(mockAnalysisRepo),
        resultsPatientRepositoryProvider.overrideWithValue(mockPatientRepo),
      ],
    );
  });

  tearDown(() => container.dispose());

  group('ResultsNotifier — chargement', () {
    test('succès → AsyncData<AnalysisResultDisplay> avec normes calculées', () async {
      final analysis = _fakeAnalysis();
      final patient = _fakePatient();

      when(() => mockAnalysisRepo.watchById('analysis-1'))
          .thenAnswer((_) => Stream.value(analysis));
      when(() => mockPatientRepo.findById('patient-1'))
          .thenAnswer((_) async => patient);

      final result = await container.read(
        resultsProvider('analysis-1').future,
      );

      expect(result, isA<AnalysisResultDisplay>());
      expect(result.analysis.id, 'analysis-1');
      expect(result.patient.id, 'patient-1');
    });

    test('analyse introuvable → future throws', () async {
      when(() => mockAnalysisRepo.watchById('missing'))
          .thenAnswer((_) => Stream.value(null));

      await expectLater(
        container.read(resultsProvider('missing').future),
        throwsA(anything),
      );
    });

    test('patient introuvable → future throws', () async {
      final analysis = _fakeAnalysis();

      when(() => mockAnalysisRepo.watchById('analysis-1'))
          .thenAnswer((_) => Stream.value(analysis));
      when(() => mockPatientRepo.findById('patient-1'))
          .thenAnswer((_) async => null);

      await expectLater(
        container.read(resultsProvider('analysis-1').future),
        throwsA(anything),
      );
    });
  });

  group('ResultsNotifier — calcul des normes', () {
    test('angle genou dans la norme → NormNormal pour patient 35 ans standard', () async {
      // Norme genou < 40 ans = [55.0, 70.0] → 62.0° est normal
      final analysis = _fakeAnalysis(kneeAngle: 62.0);
      final patient = _fakePatient(ageYears: 35);

      when(() => mockAnalysisRepo.watchById('analysis-1'))
          .thenAnswer((_) => Stream.value(analysis));
      when(() => mockPatientRepo.findById('patient-1'))
          .thenAnswer((_) async => patient);

      final result = await container.read(
        resultsProvider('analysis-1').future,
      );

      expect(result.kneeStatus, isA<NormNormal>());
    });

    test('angle genou hors norme → NormAbnormal', () async {
      // Norme genou < 40 ans = [55.0, 70.0] → 40.0° est anormal
      final analysis = _fakeAnalysis(kneeAngle: 40.0);
      final patient = _fakePatient(ageYears: 35);

      when(() => mockAnalysisRepo.watchById('analysis-1'))
          .thenAnswer((_) => Stream.value(analysis));
      when(() => mockPatientRepo.findById('patient-1'))
          .thenAnswer((_) async => patient);

      final result = await container.read(
        resultsProvider('analysis-1').future,
      );

      expect(result.kneeStatus, isA<NormAbnormal>());
    });

    test('primaryArticulation = articulation avec le plus grand écart', () async {
      // Genou 40° (norme 55-70 → écart = 15), hanche 22° (norme 20-30 → 0), cheville 10° (norme 8-15 → 0)
      // → primaryArticulation = knee
      final analysis = _fakeAnalysis(
        kneeAngle: 40.0,
        hipAngle: 22.0,
        ankleAngle: 10.0,
      );
      final patient = _fakePatient(ageYears: 35);

      when(() => mockAnalysisRepo.watchById('analysis-1'))
          .thenAnswer((_) => Stream.value(analysis));
      when(() => mockPatientRepo.findById('patient-1'))
          .thenAnswer((_) async => patient);

      final result = await container.read(
        resultsProvider('analysis-1').future,
      );

      expect(result.primaryArticulation, ArticulationName.knee);
    });

    test('isLowConfidence = true quand confidenceScore < 0.60', () async {
      final analysis = _fakeAnalysis(confidenceScore: 0.55);
      final patient = _fakePatient();

      when(() => mockAnalysisRepo.watchById('analysis-1'))
          .thenAnswer((_) => Stream.value(analysis));
      when(() => mockPatientRepo.findById('patient-1'))
          .thenAnswer((_) async => patient);

      final result = await container.read(
        resultsProvider('analysis-1').future,
      );

      expect(result.isLowConfidence, isTrue);
    });

    test('isLowConfidence = false quand confidenceScore >= 0.60', () async {
      final analysis = _fakeAnalysis(confidenceScore: 0.85);
      final patient = _fakePatient();

      when(() => mockAnalysisRepo.watchById('analysis-1'))
          .thenAnswer((_) => Stream.value(analysis));
      when(() => mockPatientRepo.findById('patient-1'))
          .thenAnswer((_) async => patient);

      final result = await container.read(
        resultsProvider('analysis-1').future,
      );

      expect(result.isLowConfidence, isFalse);
    });
  });

  group('ResultsViewController — toggle vue', () {
    test('état initial = ResultsView.simple', () {
      final view = container.read(resultsViewControllerProvider);
      expect(view, ResultsView.simple);
    });

    test('toggle → ResultsView.expert', () {
      container.read(resultsViewControllerProvider.notifier).toggle();
      expect(container.read(resultsViewControllerProvider), ResultsView.expert);
    });

    test('double toggle → retour à ResultsView.simple', () {
      container.read(resultsViewControllerProvider.notifier).toggle();
      container.read(resultsViewControllerProvider.notifier).toggle();
      expect(container.read(resultsViewControllerProvider), ResultsView.simple);
    });
  });
}
