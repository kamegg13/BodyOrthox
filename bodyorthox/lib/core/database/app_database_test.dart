// ignore_for_file: avoid_print

import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:uuid/uuid.dart';

import 'app_database.dart';

/// Crée une base de données en mémoire pour les tests — pas de chiffrement.
///
/// Les tests ne doivent jamais utiliser de vraie clé Keychain ni de fichier
/// sur disque.
/// [Source: docs/implementation-artifacts/1-3-chiffrement-local-aes-256-isolation-reseau.md#Guardrails]
AppDatabase _createTestDatabase() => AppDatabase(NativeDatabase.memory());

void main() {
  late AppDatabase db;

  setUp(() {
    db = _createTestDatabase();
  });

  tearDown(() async {
    await db.close();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // AC1 — AppDatabase s'ouvre sans erreur
  // ──────────────────────────────────────────────────────────────────────────

  group('AppDatabase — ouverture', () {
    test('s\'ouvre en mémoire sans erreur', () async {
      // Si l'ouverture échoue, watchAll() lèvera une exception.
      final patients = await db.patientsDao.watchAll().first;
      expect(patients, isEmpty);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // AC3 — Timestamps ISO 8601 (FR30)
  // ──────────────────────────────────────────────────────────────────────────

  group('PatientsDao — ISO 8601', () {
    test('created_at est parseable en DateTime UTC', () async {
      final id = const Uuid().v4();
      final now = DateTime.now().toUtc().toIso8601String();

      await db.patientsDao.insertPatient(
        PatientsCompanion.insert(
          id: id,
          name: 'Dupont Jean',
          dateOfBirth: '1966-05-12',
          createdAt: now,
        ),
      );

      final all = await db.patientsDao.watchAll().first;
      expect(all.length, 1);

      // Ne doit pas lever d'exception — AC3
      final parsed = DateTime.parse(all.first.createdAt);
      expect(parsed.isUtc, isTrue,
          reason: 'created_at doit être en UTC (toIso8601String sur DateTime UTC)');
    });

    test('dateOfBirth respecte le format ISO 8601 date', () async {
      const dob = '1966-05-12';
      await db.patientsDao.insertPatient(
        PatientsCompanion.insert(
          id: const Uuid().v4(),
          name: 'Test Patient',
          dateOfBirth: dob,
          createdAt: DateTime.now().toUtc().toIso8601String(),
        ),
      );

      final all = await db.patientsDao.watchAll().first;
      expect(all.first.dateOfBirth, equals(dob));
      // Vérifier que c'est parseable
      expect(() => DateTime.parse(all.first.dateOfBirth), returnsNormally);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PatientsDao — CRUD
  // ──────────────────────────────────────────────────────────────────────────

  group('PatientsDao — CRUD', () {
    test('insertPatient persiste et watchAll retourne le patient', () async {
      final id = const Uuid().v4();
      final now = DateTime.now().toUtc().toIso8601String();

      await db.patientsDao.insertPatient(
        PatientsCompanion.insert(
          id: id,
          name: 'Dupont Jean',
          dateOfBirth: '1966-05-12',
          createdAt: now,
        ),
      );

      final all = await db.patientsDao.watchAll().first;
      expect(all.length, 1);
      expect(all.first.id, equals(id));
      expect(all.first.name, equals('Dupont Jean'));
    });

    test('deletePatient supprime le patient de la base', () async {
      final id = const Uuid().v4();

      await db.patientsDao.insertPatient(
        PatientsCompanion.insert(
          id: id,
          name: 'Martin Sophie',
          dateOfBirth: '1980-03-15',
          createdAt: DateTime.now().toUtc().toIso8601String(),
        ),
      );

      await db.patientsDao.deletePatient(id);

      final all = await db.patientsDao.watchAll().first;
      expect(all, isEmpty);
    });

    test('watchAll retourne les patients triés par nom croissant', () async {
      final names = ['Zebra', 'Adam', 'Martin'];
      for (final name in names) {
        await db.patientsDao.insertPatient(
          PatientsCompanion.insert(
            id: const Uuid().v4(),
            name: name,
            dateOfBirth: '1990-01-01',
            createdAt: DateTime.now().toUtc().toIso8601String(),
          ),
        );
      }

      final all = await db.patientsDao.watchAll().first;
      expect(all.map((p) => p.name).toList(), ['Adam', 'Martin', 'Zebra']);
    });

    test('watchByName filtre insensible à la casse', () async {
      await db.patientsDao.insertPatient(
        PatientsCompanion.insert(
          id: const Uuid().v4(),
          name: 'Dupont Jean',
          dateOfBirth: '1966-05-12',
          createdAt: DateTime.now().toUtc().toIso8601String(),
        ),
      );
      await db.patientsDao.insertPatient(
        PatientsCompanion.insert(
          id: const Uuid().v4(),
          name: 'Martin Sophie',
          dateOfBirth: '1980-03-15',
          createdAt: DateTime.now().toUtc().toIso8601String(),
        ),
      );

      final results = await db.patientsDao.watchByName('dupont').first;
      expect(results.length, 1);
      expect(results.first.name, equals('Dupont Jean'));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // AnalysesDao — CRUD et atomicité
  // ──────────────────────────────────────────────────────────────────────────

  group('AnalysesDao — CRUD', () {
    late String patientId;

    setUp(() async {
      patientId = const Uuid().v4();
      await db.patientsDao.insertPatient(
        PatientsCompanion.insert(
          id: patientId,
          name: 'Patient Test',
          dateOfBirth: '1980-01-01',
          createdAt: DateTime.now().toUtc().toIso8601String(),
        ),
      );
    });

    test('insertAnalysis persiste et watchByPatient retourne l\'analyse', () async {
      final id = const Uuid().v4();
      final now = DateTime.now().toUtc().toIso8601String();

      await db.analysesDao.insertAnalysis(
        AnalysesCompanion.insert(
          id: id,
          patientId: patientId,
          kneeAngle: 42.3,
          hipAngle: 178.5,
          ankleAngle: 91.2,
          confidenceScore: 0.95,
          createdAt: now,
        ),
      );

      final analyses = await db.analysesDao.watchByPatient(patientId).first;
      expect(analyses.length, 1);
      expect(analyses.first.id, equals(id));
      expect(analyses.first.kneeAngle, closeTo(42.3, 0.001));
      expect(analyses.first.confidenceScore, closeTo(0.95, 0.001));
    });

    test('created_at de l\'analyse est parseable en DateTime UTC', () async {
      await db.analysesDao.insertAnalysis(
        AnalysesCompanion.insert(
          id: const Uuid().v4(),
          patientId: patientId,
          kneeAngle: 30.0,
          hipAngle: 170.0,
          ankleAngle: 90.0,
          confidenceScore: 0.9,
          createdAt: DateTime.now().toUtc().toIso8601String(),
        ),
      );

      final analyses = await db.analysesDao.watchByPatient(patientId).first;
      final parsed = DateTime.parse(analyses.first.createdAt);
      expect(parsed.isUtc, isTrue);
    });

    test('deleteByPatient supprime toutes les analyses du patient', () async {
      for (var i = 0; i < 3; i++) {
        await db.analysesDao.insertAnalysis(
          AnalysesCompanion.insert(
            id: const Uuid().v4(),
            patientId: patientId,
            kneeAngle: 40.0 + i,
            hipAngle: 175.0,
            ankleAngle: 90.0,
            confidenceScore: 0.9,
            createdAt: DateTime.now().toUtc().toIso8601String(),
          ),
        );
      }

      await db.analysesDao.deleteByPatient(patientId);

      final analyses = await db.analysesDao.watchByPatient(patientId).first;
      expect(analyses, isEmpty);
    });

    test('watchByPatient retourne les analyses triées par date décroissante', () async {
      final dates = [
        '2026-01-01T10:00:00.000Z',
        '2026-03-05T14:30:00.000Z',
        '2026-02-15T09:00:00.000Z',
      ];

      for (final date in dates) {
        await db.analysesDao.insertAnalysis(
          AnalysesCompanion.insert(
            id: const Uuid().v4(),
            patientId: patientId,
            kneeAngle: 40.0,
            hipAngle: 175.0,
            ankleAngle: 90.0,
            confidenceScore: 0.9,
            createdAt: date,
          ),
        );
      }

      final analyses = await db.analysesDao.watchByPatient(patientId).first;
      expect(analyses.length, 3);
      // La plus récente en premier
      expect(analyses.first.createdAt, equals('2026-03-05T14:30:00.000Z'));
      expect(analyses.last.createdAt, equals('2026-01-01T10:00:00.000Z'));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // NFR-R2 — Atomicité des transactions
  // ──────────────────────────────────────────────────────────────────────────

  group('Transactions Drift — atomicité (NFR-R2)', () {
    test('une transaction avortée ne persiste aucune donnée', () async {
      final patientId = const Uuid().v4();
      await db.patientsDao.insertPatient(
        PatientsCompanion.insert(
          id: patientId,
          name: 'Patient Rollback',
          dateOfBirth: '1980-01-01',
          createdAt: DateTime.now().toUtc().toIso8601String(),
        ),
      );

      try {
        await db.transaction(() async {
          await db.analysesDao.insertAnalysis(
            AnalysesCompanion.insert(
              id: const Uuid().v4(),
              patientId: patientId,
              kneeAngle: 42.3,
              hipAngle: 178.5,
              ankleAngle: 91.2,
              confidenceScore: 0.95,
              createdAt: DateTime.now().toUtc().toIso8601String(),
            ),
          );
          // Force le rollback de la transaction
          throw Exception('Simulation d\'erreur mid-transaction');
        });
      } catch (e) {
        // Exception attendue — le rollback est garanti par Drift
        expect(e.toString(), contains('Simulation'));
      }

      final analyses = await db.analysesDao.watchByPatient(patientId).first;
      expect(analyses, isEmpty,
          reason: 'NFR-R2 : aucune donnée partielle ne doit être persistée');
    });

    test('une transaction complète persiste toutes les données', () async {
      final patientId = const Uuid().v4();
      await db.patientsDao.insertPatient(
        PatientsCompanion.insert(
          id: patientId,
          name: 'Patient Commit',
          dateOfBirth: '1975-06-20',
          createdAt: DateTime.now().toUtc().toIso8601String(),
        ),
      );

      final analysisId = const Uuid().v4();

      await db.transaction(() async {
        await db.analysesDao.insertAnalysis(
          AnalysesCompanion.insert(
            id: analysisId,
            patientId: patientId,
            kneeAngle: 35.0,
            hipAngle: 172.0,
            ankleAngle: 88.5,
            confidenceScore: 0.87,
            createdAt: DateTime.now().toUtc().toIso8601String(),
          ),
        );
      });

      final analyses = await db.analysesDao.watchByPatient(patientId).first;
      expect(analyses.length, 1);
      expect(analyses.first.id, equals(analysisId));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // AC4 — Index (vérification indirecte via les requêtes de recherche)
  // ──────────────────────────────────────────────────────────────────────────

  group('Index de performance', () {
    test('watchByName utilise idx_patients_name (requête ne lève pas d\'erreur)', () async {
      // Insérer 10 patients pour simuler un index utile
      for (var i = 0; i < 10; i++) {
        await db.patientsDao.insertPatient(
          PatientsCompanion.insert(
            id: const Uuid().v4(),
            name: 'Patient $i',
            dateOfBirth: '1980-01-0${(i % 9) + 1}',
            createdAt: DateTime.now().toUtc().toIso8601String(),
          ),
        );
      }

      final result = await db.patientsDao.watchByName('Patient 5').first;
      expect(result, isA<List<Patient>>());
    });

    test('watchByPatient utilise idx_analyses_patient (requête ne lève pas d\'erreur)', () async {
      final patientId = const Uuid().v4();
      await db.patientsDao.insertPatient(
        PatientsCompanion.insert(
          id: patientId,
          name: 'Index Test',
          dateOfBirth: '1985-07-10',
          createdAt: DateTime.now().toUtc().toIso8601String(),
        ),
      );

      final result = await db.analysesDao.watchByPatient(patientId).first;
      expect(result, isA<List<Analyse>>());
    });
  });
}
