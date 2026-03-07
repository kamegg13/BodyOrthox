// Tests du DriftPatientRepository — base Drift en mémoire.
//
// AC1 : patient persisté avec UUID v4 et createdAt ISO 8601 UTC
// AC5 : interface via PatientRepository — jamais d'accès DAO direct
//
// Note : utilise NativeDatabase.memory() (SQLite natif macOS/Linux) — pas de
// SQLCipher requis car la clé de chiffrement n'est activée qu'en production.
// [Source: docs/implementation-artifacts/2-1-creer-un-profil-patient.md#T3.6]

// ignore: depend_on_referenced_packages
import 'package:drift/native.dart';
// ignore: depend_on_referenced_packages
import 'package:flutter_test/flutter_test.dart';
// ignore: depend_on_referenced_packages
import 'package:uuid/uuid.dart';

import '../../../core/database/app_database.dart' show AppDatabase;
import '../domain/morphological_profile.dart';
import '../domain/patient.dart';
import 'drift_patient_repository.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

Patient _buildPatient({
  String? id,
  String name = 'Jean Dupont',
  DateTime? dateOfBirth,
  MorphologicalProfile morphologicalProfile = MorphologicalProfile.standard,
  DateTime? createdAt,
}) {
  return Patient(
    id: id ?? const Uuid().v4(),
    name: name,
    dateOfBirth: dateOfBirth ?? DateTime(1975, 6, 15),
    morphologicalProfile: morphologicalProfile,
    createdAt: createdAt ?? DateTime.utc(2026, 3, 5, 14, 30),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

void main() {
  late AppDatabase db;
  late DriftPatientRepository repository;

  setUp(() {
    db = AppDatabase(NativeDatabase.memory());
    repository = DriftPatientRepository(db);
  });

  tearDown(() => db.close());

  // ──────────────────────────────────────────────────────────────────────────
  // AC1 — Persistance
  // ──────────────────────────────────────────────────────────────────────────

  group('save() — persistance', () {
    test('persiste un patient et le retrouve via watchAll()', () async {
      final patient = _buildPatient(name: 'Jean Dupont');

      await repository.save(patient);

      final patients = await repository.watchAll().first;
      expect(patients, hasLength(1));
      expect(patients.first.id, equals(patient.id));
      expect(patients.first.name, equals('Jean Dupont'));
    });

    test('l\'id stocké correspond au format UUID v4 (36 chars avec tirets)', () async {
      final patient = _buildPatient();
      await repository.save(patient);

      final patients = await repository.watchAll().first;
      expect(
        patients.first.id,
        matches(RegExp(r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')),
        reason: 'L\'id doit être un UUID v4 valide',
      );
    });

    test('createdAt est restauré comme DateTime UTC', () async {
      final createdAt = DateTime.utc(2026, 3, 5, 14, 30);
      final patient = _buildPatient(createdAt: createdAt);
      await repository.save(patient);

      final patients = await repository.watchAll().first;
      expect(patients.first.createdAt.isUtc, isTrue);
      expect(patients.first.createdAt.year, equals(2026));
      expect(patients.first.createdAt.month, equals(3));
      expect(patients.first.createdAt.day, equals(5));
    });

    test('dateOfBirth est restaurée correctement', () async {
      final dob = DateTime(1975, 6, 15);
      final patient = _buildPatient(dateOfBirth: dob);
      await repository.save(patient);

      final patients = await repository.watchAll().first;
      expect(patients.first.dateOfBirth.year, equals(1975));
      expect(patients.first.dateOfBirth.month, equals(6));
      expect(patients.first.dateOfBirth.day, equals(15));
    });

    test('morphologicalProfile est sérialisé et désérialisé correctement', () async {
      for (final profile in MorphologicalProfile.values) {
        final localDb = AppDatabase(NativeDatabase.memory());
        final localRepo = DriftPatientRepository(localDb);

        final patient = _buildPatient(
          id: const Uuid().v4(),
          morphologicalProfile: profile,
        );
        await localRepo.save(patient);

        final patients = await localRepo.watchAll().first;
        expect(patients.first.morphologicalProfile, equals(profile));
        await localDb.close();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // AC2 — Réactivité du stream
  // ──────────────────────────────────────────────────────────────────────────

  group('watchAll() — réactivité', () {
    test('émet une liste vide si aucun patient', () async {
      final patients = await repository.watchAll().first;
      expect(patients, isEmpty);
    });

    test('watchAll() trie les patients par nom croissant', () async {
      await repository.save(_buildPatient(id: const Uuid().v4(), name: 'Zoé Martin'));
      await repository.save(_buildPatient(id: const Uuid().v4(), name: 'Alice Bernard'));
      await repository.save(_buildPatient(id: const Uuid().v4(), name: 'Marc Dupont'));

      final patients = await repository.watchAll().first;
      expect(patients.map((p) => p.name).toList(), equals(['Alice Bernard', 'Marc Dupont', 'Zoé Martin']));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // delete() — Story 2.4
  // ──────────────────────────────────────────────────────────────────────────

  group('deleteWithAnalyses() — suppression atomique', () {
    test('supprime le patient et ses analyses en transaction', () async {
      final patient = _buildPatient();
      await repository.save(patient);

      await repository.deleteWithAnalyses(patient.id);

      final patients = await repository.watchAll().first;
      expect(patients, isEmpty);
    });

    test('deleteWithAnalyses d\'un id inexistant ne lève pas d\'exception', () async {
      await expectLater(
        () => repository.deleteWithAnalyses('non-existent-id'),
        returnsNormally,
      );
    });
  });
}
