// Tests du PatientsNotifier — mocktail + ProviderContainer.
//
// AC2 : stream réactif — la liste se met à jour après createPatient()
// AC4 : validation — nom vide lance ArgumentError
// AC5 : le Notifier passe exclusivement par PatientRepository
//
// Note : riverpod_test incompatible avec Riverpod 3.x — utilise ProviderContainer.
// Note : le provider généré par riverpod_generator 4.x est 'patientsProvider'
//        (PatientsNotifier → patientsProvider, le suffixe Notifier est supprimé).
// [Source: docs/implementation-artifacts/2-1-creer-un-profil-patient.md#T4.5]

import 'dart:async';

// ignore: depend_on_referenced_packages
import 'package:flutter_riverpod/flutter_riverpod.dart';
// ignore: depend_on_referenced_packages
import 'package:flutter_test/flutter_test.dart';
// ignore: depend_on_referenced_packages
import 'package:mocktail/mocktail.dart';

import '../data/patient_repository.dart';
import '../domain/morphological_profile.dart';
import '../domain/patient.dart';
// patientsProvider est généré dans patients_notifier.g.dart (part of patients_notifier.dart)
import 'patients_notifier.dart';
import 'patients_provider.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Mock
// ─────────────────────────────────────────────────────────────────────────────

class MockPatientRepository extends Mock implements PatientRepository {}

class _FakePatient extends Fake implements Patient {}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

void main() {
  setUpAll(() {
    // mocktail requiert un fallback pour les types custom utilisés avec any()
    registerFallbackValue(_FakePatient());
  });
  late MockPatientRepository mockRepo;
  late ProviderContainer container;

  setUp(() {
    mockRepo = MockPatientRepository();

    // Stream vide par défaut — build() émet une liste vide
    when(() => mockRepo.watchAll()).thenAnswer((_) => Stream.value([]));

    container = ProviderContainer(
      overrides: [
        patientRepositoryProvider.overrideWithValue(mockRepo),
      ],
    );
  });

  tearDown(() => container.dispose());

  // ──────────────────────────────────────────────────────────────────────────
  // AC4 — Validation du nom
  // ──────────────────────────────────────────────────────────────────────────

  group('createPatient() — validation', () {
    test('lève ArgumentError si le nom est vide', () async {
      // patientsProvider est le nom généré par riverpod_generator pour PatientsNotifier
      final notifier = container.read(patientsProvider.notifier);

      await expectLater(
        () => notifier.createPatient(
          name: '',
          dateOfBirth: DateTime(1975, 6, 15),
          morphologicalProfile: MorphologicalProfile.standard,
        ),
        throwsA(isA<ArgumentError>()),
      );
    });

    test('lève ArgumentError si le nom ne contient que des espaces', () async {
      final notifier = container.read(patientsProvider.notifier);

      await expectLater(
        () => notifier.createPatient(
          name: '   ',
          dateOfBirth: DateTime(1975, 6, 15),
          morphologicalProfile: MorphologicalProfile.standard,
        ),
        throwsA(isA<ArgumentError>()),
      );
    });

    test('ne persiste pas si le nom est vide (save() pas appelé)', () async {
      final notifier = container.read(patientsProvider.notifier);

      try {
        await notifier.createPatient(
          name: '',
          dateOfBirth: DateTime(1975, 6, 15),
          morphologicalProfile: MorphologicalProfile.standard,
        );
      } catch (_) {}

      verifyNever(() => mockRepo.save(any()));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // AC5 — Délégation au Repository
  // ──────────────────────────────────────────────────────────────────────────

  group('createPatient() — persistance', () {
    test('appelle repository.save() avec un Patient valide', () async {
      when(() => mockRepo.save(any())).thenAnswer((_) async {});

      final notifier = container.read(patientsProvider.notifier);
      await notifier.createPatient(
        name: 'Jean Dupont',
        dateOfBirth: DateTime(1975, 6, 15),
        morphologicalProfile: MorphologicalProfile.standard,
      );

      verify(() => mockRepo.save(any())).called(1);
    });

    test('le patient passé à save() a le nom trimé', () async {
      Patient? captured;
      when(() => mockRepo.save(any())).thenAnswer((invocation) async {
        captured = invocation.positionalArguments.first as Patient;
      });

      final notifier = container.read(patientsProvider.notifier);
      await notifier.createPatient(
        name: '  Jean Dupont  ',
        dateOfBirth: DateTime(1975, 6, 15),
        morphologicalProfile: MorphologicalProfile.obese,
      );

      expect(captured?.name, equals('Jean Dupont'));
      expect(captured?.morphologicalProfile, equals(MorphologicalProfile.obese));
    });

    test('le patient passé à save() a un id UUID v4 non vide', () async {
      Patient? captured;
      when(() => mockRepo.save(any())).thenAnswer((invocation) async {
        captured = invocation.positionalArguments.first as Patient;
      });

      final notifier = container.read(patientsProvider.notifier);
      await notifier.createPatient(
        name: 'Alice Bernard',
        dateOfBirth: DateTime(1990, 1, 1),
        morphologicalProfile: MorphologicalProfile.standard,
      );

      expect(captured?.id, isNotEmpty);
      expect(
        captured?.id,
        matches(RegExp(r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')),
        reason: 'L\'id doit être un UUID v4',
      );
    });

    test('createdAt du patient est en UTC', () async {
      Patient? captured;
      when(() => mockRepo.save(any())).thenAnswer((invocation) async {
        captured = invocation.positionalArguments.first as Patient;
      });

      final notifier = container.read(patientsProvider.notifier);
      await notifier.createPatient(
        name: 'Test Patient',
        dateOfBirth: DateTime(1980, 5, 20),
        morphologicalProfile: MorphologicalProfile.elderly,
      );

      expect(captured?.createdAt.isUtc, isTrue);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // filterByName() — filtrage
  // ──────────────────────────────────────────────────────────────────────────

  group('filterByName() — filtrage', () {
    final threePatients = [
      Patient(
        id: '1',
        name: 'Marc Martin',
        dateOfBirth: DateTime(1980),
        morphologicalProfile: MorphologicalProfile.standard,
        createdAt: DateTime.utc(2026),
      ),
      Patient(
        id: '2',
        name: 'Alice Bernard',
        dateOfBirth: DateTime(1985),
        morphologicalProfile: MorphologicalProfile.standard,
        createdAt: DateTime.utc(2026),
      ),
      Patient(
        id: '3',
        name: 'Jean Dupont',
        dateOfBirth: DateTime(1975),
        morphologicalProfile: MorphologicalProfile.standard,
        createdAt: DateTime.utc(2026),
      ),
    ];

    // Crée un container dédié avec watchAll() retournant threePatients dès le départ.
    // Nécessaire car le container de setUp est initialisé avec Stream.value([]).
    ProviderContainer buildFilterContainer() {
      final repo = MockPatientRepository();
      when(() => repo.watchAll()).thenAnswer((_) => Stream.value(threePatients));
      when(() => repo.save(any())).thenAnswer((_) async {});
      return ProviderContainer(
        overrides: [patientRepositoryProvider.overrideWithValue(repo)],
      );
    }

    test('filterByName vide restaure la liste complète', () async {
      final c = buildFilterContainer();
      addTearDown(c.dispose);

      // container.listen() maintient le provider auto-dispose vivant
      // pour traiter les événements du stream avant le premier read.
      c.listen(patientsProvider, (_, __) {});
      await Future.delayed(Duration.zero);

      c.read(patientsProvider.notifier).filterByName('');

      final result = c.read(patientsProvider);
      expect(result, isA<AsyncData<List<Patient>>>());
      final list = (result as AsyncData<List<Patient>>).value;
      expect(list, hasLength(3));
    });

    test('filterByName filtre par nom case-insensitive', () async {
      final c = buildFilterContainer();
      addTearDown(c.dispose);

      c.listen(patientsProvider, (_, __) {});
      await Future.delayed(Duration.zero);

      c.read(patientsProvider.notifier).filterByName('marc');

      final result = c.read(patientsProvider);
      expect(result, isA<AsyncData<List<Patient>>>());
      final list = (result as AsyncData<List<Patient>>).value;
      expect(list, hasLength(1));
      expect(list.first.name, equals('Marc Martin'));
    });

    test('filterByName avec query qui ne matche rien retourne liste vide', () async {
      final c = buildFilterContainer();
      addTearDown(c.dispose);

      c.listen(patientsProvider, (_, __) {});
      await Future.delayed(Duration.zero);

      c.read(patientsProvider.notifier).filterByName('xyz');

      final result = c.read(patientsProvider);
      expect(result, isA<AsyncData<List<Patient>>>());
      final list = (result as AsyncData<List<Patient>>).value;
      expect(list, isEmpty);
    });
  });
}
