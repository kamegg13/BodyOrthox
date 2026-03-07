// Tests de PatientDeleteNotifier — mocktail + ProviderContainer.
//
// AC4 : suppression atomique — délégation au Repository (pas de DAO direct)
// AC5 : après suppression réussie, le state est AsyncData(null)
// [Source: docs/implementation-artifacts/2-4-timeline-de-progression-clinique-et-suppression-patient.md#T2.6]

import 'package:flutter_riverpod/flutter_riverpod.dart';
// ignore: depend_on_referenced_packages
import 'package:flutter_test/flutter_test.dart';
// ignore: depend_on_referenced_packages
import 'package:mocktail/mocktail.dart';

import '../data/patient_repository.dart';
import 'patient_delete_notifier.dart';
import 'patients_provider.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Mock
// ─────────────────────────────────────────────────────────────────────────────

class MockPatientRepository extends Mock implements PatientRepository {}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

void main() {
  late MockPatientRepository mockRepo;
  late ProviderContainer container;

  setUp(() {
    mockRepo = MockPatientRepository();
    container = ProviderContainer(
      overrides: [
        patientRepositoryProvider.overrideWithValue(mockRepo),
      ],
    );
  });

  tearDown(() => container.dispose());

  group('deletePatient()', () {
    test('appelle repository.deleteWithAnalyses() avec le bon patientId', () async {
      when(() => mockRepo.deleteWithAnalyses(any())).thenAnswer((_) async {});
      when(() => mockRepo.watchAll()).thenAnswer((_) => Stream.value([]));

      await container
          .read(patientDeleteProvider.notifier)
          .deletePatient('patient-123');

      verify(() => mockRepo.deleteWithAnalyses('patient-123')).called(1);
    });

    test('state est AsyncData après suppression réussie', () async {
      when(() => mockRepo.deleteWithAnalyses(any())).thenAnswer((_) async {});
      when(() => mockRepo.watchAll()).thenAnswer((_) => Stream.value([]));

      await container
          .read(patientDeleteProvider.notifier)
          .deletePatient('patient-1');

      final state = container.read(patientDeleteProvider);
      expect(state, isA<AsyncData<void>>());
    });

    test('state est AsyncError si repository lève une exception', () async {
      when(() => mockRepo.deleteWithAnalyses(any()))
          .thenThrow(Exception('DB error'));
      when(() => mockRepo.watchAll()).thenAnswer((_) => Stream.value([]));

      await container
          .read(patientDeleteProvider.notifier)
          .deletePatient('patient-1');

      final state = container.read(patientDeleteProvider);
      expect(state, isA<AsyncError<void>>());
    });

    test('ne fait pas de DAO direct — uniquement via patientRepositoryProvider', () async {
      when(() => mockRepo.deleteWithAnalyses(any())).thenAnswer((_) async {});
      when(() => mockRepo.watchAll()).thenAnswer((_) => Stream.value([]));

      await container
          .read(patientDeleteProvider.notifier)
          .deletePatient('patient-1');

      // Vérifie que seul deleteWithAnalyses() a été appelé sur le repository
      verify(() => mockRepo.deleteWithAnalyses(any())).called(1);
      verifyNoMoreInteractions(mockRepo);
    });
  });
}
