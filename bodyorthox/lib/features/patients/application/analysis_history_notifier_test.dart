// Tests de AnalysisHistoryNotifier — mocktail + ProviderContainer.
//
// AC1 : stream trié par created_at DESC (le plus récent en premier)
// AC4 : état vide retourné si aucune analyse
//
// Note : provider généré 'analysisHistoryProvider' est paramétrique (String patientId).
// [Source: docs/implementation-artifacts/2-3-historique-des-analyses-dun-patient.md#T5.3]

import 'package:flutter_riverpod/flutter_riverpod.dart';
// ignore: depend_on_referenced_packages
import 'package:flutter_test/flutter_test.dart';
// ignore: depend_on_referenced_packages
import 'package:mocktail/mocktail.dart';

import '../../capture/data/analysis_repository.dart';
import '../../capture/domain/analysis.dart';
import 'analysis_history_notifier.dart';
import 'analysis_history_provider.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

class MockAnalysisRepository extends Mock implements AnalysisRepository {}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

Analysis _makeAnalysis({
  required String id,
  required DateTime createdAt,
  double kneeAngle = 42.0,
  double hipAngle = 67.0,
  double ankleAngle = 41.0,
  double confidenceScore = 0.94,
}) =>
    Analysis(
      id: id,
      patientId: 'patient-1',
      createdAt: createdAt,
      kneeAngle: kneeAngle,
      hipAngle: hipAngle,
      ankleAngle: ankleAngle,
      confidenceScore: confidenceScore,
    );

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

void main() {
  late MockAnalysisRepository mockRepo;
  late ProviderContainer container;

  setUp(() {
    mockRepo = MockAnalysisRepository();

    container = ProviderContainer(
      overrides: [
        analysisRepositoryProvider.overrideWithValue(mockRepo),
      ],
    );
  });

  tearDown(() => container.dispose());

  // ──────────────────────────────────────────────────────────────────────────
  // État vide
  // ──────────────────────────────────────────────────────────────────────────

  group('build() — état vide', () {
    test('retourne AsyncData([]) si aucune analyse pour le patient', () async {
      when(() => mockRepo.watchAnalysesForPatient('patient-1'))
          .thenAnswer((_) => Stream.value([]));

      container.listen(
        analysisHistoryProvider('patient-1'),
        (_, __) {},
      );
      await Future.delayed(Duration.zero);

      final state = container.read(analysisHistoryProvider('patient-1'));
      expect(state, isA<AsyncData<List<Analysis>>>());
      final list = (state as AsyncData<List<Analysis>>).value;
      expect(list, isEmpty);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Liste avec analyses
  // ──────────────────────────────────────────────────────────────────────────

  group('build() — liste analyses', () {
    test('retourne les analyses émises par le repository', () async {
      final analyses = [
        _makeAnalysis(id: 'a1', createdAt: DateTime.utc(2026, 3, 5, 14, 30)),
        _makeAnalysis(id: 'a2', createdAt: DateTime.utc(2026, 3, 4, 10, 0)),
      ];

      when(() => mockRepo.watchAnalysesForPatient('patient-1'))
          .thenAnswer((_) => Stream.value(analyses));

      container.listen(
        analysisHistoryProvider('patient-1'),
        (_, __) {},
      );
      await Future.delayed(Duration.zero);

      final state = container.read(analysisHistoryProvider('patient-1'));
      final list = (state as AsyncData<List<Analysis>>).value;
      expect(list, hasLength(2));
    });

    test('la liste reflète l\'ordre fourni par le repository (DESC created_at)', () async {
      // Le tri est délégué au DAO/repository — le notifier ne retrie pas.
      // Ce test vérifie que l'ordre est préservé tel quel (premier = plus récent).
      final newer = _makeAnalysis(id: 'a1', createdAt: DateTime.utc(2026, 3, 5));
      final older = _makeAnalysis(id: 'a2', createdAt: DateTime.utc(2026, 3, 4));

      when(() => mockRepo.watchAnalysesForPatient('patient-1'))
          .thenAnswer((_) => Stream.value([newer, older]));

      container.listen(
        analysisHistoryProvider('patient-1'),
        (_, __) {},
      );
      await Future.delayed(Duration.zero);

      final state = container.read(analysisHistoryProvider('patient-1'));
      final list = (state as AsyncData<List<Analysis>>).value;
      expect(list.first.id, equals('a1'));
      expect(list.last.id, equals('a2'));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Isolation patient
  // ──────────────────────────────────────────────────────────────────────────

  group('build() — isolation par patientId', () {
    test('deux patients distincts retournent des listes indépendantes', () async {
      final analysisP1 = _makeAnalysis(id: 'a1', createdAt: DateTime.utc(2026, 3, 5));
      final analysisP2 = _makeAnalysis(id: 'a2', createdAt: DateTime.utc(2026, 3, 5))
          .copyWith(patientId: 'patient-2');

      when(() => mockRepo.watchAnalysesForPatient('patient-1'))
          .thenAnswer((_) => Stream.value([analysisP1]));
      when(() => mockRepo.watchAnalysesForPatient('patient-2'))
          .thenAnswer((_) => Stream.value([analysisP2]));

      container.listen(analysisHistoryProvider('patient-1'), (_, __) {});
      container.listen(analysisHistoryProvider('patient-2'), (_, __) {});
      await Future.delayed(Duration.zero);

      final stateP1 = container.read(analysisHistoryProvider('patient-1'));
      final stateP2 = container.read(analysisHistoryProvider('patient-2'));

      expect((stateP1 as AsyncData<List<Analysis>>).value.first.id, equals('a1'));
      expect((stateP2 as AsyncData<List<Analysis>>).value.first.id, equals('a2'));
    });
  });
}
