// Smoke tests pour ResultsScreen — Story 3.4 Task 7.
// Couvre AsyncData / AsyncLoading / AsyncError (AC7).
// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task7]
// ignore: depend_on_referenced_packages
import 'package:flutter/material.dart';
// ignore: depend_on_referenced_packages
import 'package:flutter_riverpod/flutter_riverpod.dart';
// ignore: depend_on_referenced_packages
import 'package:flutter_test/flutter_test.dart';
// ignore: depend_on_referenced_packages
import 'dart:async';
// ignore: depend_on_referenced_packages
import 'package:mocktail/mocktail.dart';

import '../application/results_provider.dart';
import '../../capture/data/analysis_repository.dart';
import '../../capture/domain/analysis.dart';
import '../../patients/data/patient_repository.dart';
import '../../patients/domain/morphological_profile.dart';
import '../../patients/domain/patient.dart';
import 'results_screen.dart';

// ─── Mocks ───────────────────────────────────────────────────────────────────

class MockAnalysisRepository extends Mock implements AnalysisRepository {}

class MockPatientRepository extends Mock implements PatientRepository {}

// ─── Helpers ─────────────────────────────────────────────────────────────────

Analysis _fakeAnalysis() => Analysis(
      id: 'analysis-1',
      patientId: 'patient-1',
      kneeAngle: 62.0,
      hipAngle: 22.0,
      ankleAngle: 10.0,
      confidenceScore: 0.85,
      createdAt: DateTime(2026, 3, 6),
    );

Patient _fakePatient() => Patient(
      id: 'patient-1',
      name: 'Test Patient',
      dateOfBirth: DateTime(1991, 1, 1),
      morphologicalProfile: MorphologicalProfile.standard,
      createdAt: DateTime(2026, 1, 1),
    );

Widget _buildScreen({
  required MockAnalysisRepository analysisRepo,
  required MockPatientRepository patientRepo,
}) {
  return ProviderScope(
    overrides: [
      resultsAnalysisRepositoryProvider.overrideWithValue(analysisRepo),
      resultsPatientRepositoryProvider.overrideWithValue(patientRepo),
    ],
    child: const MaterialApp(
      home: ResultsScreen(analysisId: 'analysis-1'),
    ),
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

void main() {
  late MockAnalysisRepository mockAnalysisRepo;
  late MockPatientRepository mockPatientRepo;

  setUp(() {
    mockAnalysisRepo = MockAnalysisRepository();
    mockPatientRepo = MockPatientRepository();
  });

  group('ResultsScreen — smoke tests (AC7)', () {
    testWidgets('AsyncData → affiche les résultats et le titre', (tester) async {
      when(() => mockAnalysisRepo.watchById('analysis-1'))
          .thenAnswer((_) => Stream.value(_fakeAnalysis()));
      when(() => mockPatientRepo.findById('patient-1'))
          .thenAnswer((_) async => _fakePatient());

      await tester.pumpWidget(
        _buildScreen(
          analysisRepo: mockAnalysisRepo,
          patientRepo: mockPatientRepo,
        ),
      );
      await tester.pump();

      expect(find.text('Résultats'), findsOneWidget);
    });

    testWidgets('AsyncLoading → affiche un spinner', (tester) async {
      // StreamController qui ne ferme jamais → build() attend indéfiniment → AsyncLoading
      final neverController = StreamController<Analysis?>();
      addTearDown(neverController.close);

      when(() => mockAnalysisRepo.watchById('analysis-1'))
          .thenAnswer((_) => neverController.stream);
      when(() => mockPatientRepo.findById('patient-1'))
          .thenAnswer((_) async => _fakePatient());

      await tester.pumpWidget(
        _buildScreen(
          analysisRepo: mockAnalysisRepo,
          patientRepo: mockPatientRepo,
        ),
      );
      // Un seul frame : provider en AsyncLoading (build() attend le stream)
      await tester.pump(Duration.zero);

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('AsyncError → affiche un message d\'erreur', (tester) async {
      when(() => mockAnalysisRepo.watchById('analysis-1'))
          .thenAnswer((_) => Stream.value(null)); // null → Exception dans le notifier
      when(() => mockPatientRepo.findById(any())).thenAnswer((_) async => null);

      await tester.pumpWidget(
        _buildScreen(
          analysisRepo: mockAnalysisRepo,
          patientRepo: mockPatientRepo,
        ),
      );
      // Attendre la résolution asynchrone vers AsyncError
      await tester.pumpAndSettle();

      expect(find.text('Impossible de charger les résultats.'), findsOneWidget);
    });

    testWidgets('toggle vue simple / experte affiché', (tester) async {
      when(() => mockAnalysisRepo.watchById('analysis-1'))
          .thenAnswer((_) => Stream.value(_fakeAnalysis()));
      when(() => mockPatientRepo.findById('patient-1'))
          .thenAnswer((_) async => _fakePatient());

      await tester.pumpWidget(
        _buildScreen(
          analysisRepo: mockAnalysisRepo,
          patientRepo: mockPatientRepo,
        ),
      );
      await tester.pump();

      expect(find.text('Vue simple'), findsOneWidget);
      expect(find.text('Vue experte'), findsOneWidget);
    });

    testWidgets('disclaimer MDR affiché sous les résultats', (tester) async {
      when(() => mockAnalysisRepo.watchById('analysis-1'))
          .thenAnswer((_) => Stream.value(_fakeAnalysis()));
      when(() => mockPatientRepo.findById('patient-1'))
          .thenAnswer((_) async => _fakePatient());

      await tester.pumpWidget(
        _buildScreen(
          analysisRepo: mockAnalysisRepo,
          patientRepo: mockPatientRepo,
        ),
      );
      await tester.pump();

      expect(
        find.textContaining('outil de documentation clinique'),
        findsOneWidget,
      );
    });
  });
}
