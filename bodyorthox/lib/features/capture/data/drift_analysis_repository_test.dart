// Tests du DriftAnalysisRepository — base Drift en mémoire.
//
// AC9 : corrections manuelles persistées atomiquement en base Drift chiffrée (NFR-R2).
// [Source: docs/implementation-artifacts/3-5-replay-expert-correction-manuelle.md#Task4]

// ignore: depend_on_referenced_packages
import 'package:drift/native.dart';
// ignore: depend_on_referenced_packages
import 'package:flutter_test/flutter_test.dart';
// ignore: depend_on_referenced_packages
import 'package:uuid/uuid.dart';

import '../../../core/database/app_database.dart' as db;
import '../domain/analysis.dart';
import 'drift_analysis_repository.dart';

// ─── Helpers ─────────────────────────────────────────────────────────────────

Analysis _buildAnalysis({
  String? id,
  String patientId = 'patient-1',
  double kneeAngle = 62.0,
  double hipAngle = 22.0,
  double ankleAngle = 10.0,
  double confidenceScore = 0.85,
}) =>
    Analysis(
      id: id ?? const Uuid().v4(),
      patientId: patientId,
      createdAt: DateTime.utc(2026, 3, 7, 10, 0),
      kneeAngle: kneeAngle,
      hipAngle: hipAngle,
      ankleAngle: ankleAngle,
      confidenceScore: confidenceScore,
    );

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

void main() {
  late db.AppDatabase database;
  late DriftAnalysisRepository repository;

  setUp(() {
    database = db.AppDatabase(NativeDatabase.memory());
    repository = DriftAnalysisRepository(database);
  });

  tearDown(() => database.close());

  group('save() — persistance', () {
    test('persiste une analyse et la retrouve via watchById()', () async {
      final analysis = _buildAnalysis(id: 'analysis-save-1');

      await repository.save(analysis);

      final result = await repository.watchById('analysis-save-1').first;
      expect(result, isNotNull);
      expect(result!.id, equals('analysis-save-1'));
      expect(result.kneeAngle, equals(62.0));
      expect(result.manualCorrectionApplied, isFalse);
      expect(result.manualCorrectionJoint, isNull);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // AC9 — Persistance correction manuelle
  // ──────────────────────────────────────────────────────────────────────────

  group('saveManualCorrection() — correction genou', () {
    test('manualCorrectionApplied passe à true après correction', () async {
      const id = 'analysis-correction-1';
      await repository.save(_buildAnalysis(id: id));

      await repository.saveManualCorrection(
        analysisId: id,
        joint: 'knee',
        correctedAngle: 55.0,
      );

      final result = await repository.watchById(id).first;
      expect(result!.manualCorrectionApplied, isTrue);
    });

    test('manualCorrectionJoint est défini sur "knee"', () async {
      const id = 'analysis-correction-2';
      await repository.save(_buildAnalysis(id: id));

      await repository.saveManualCorrection(
        analysisId: id,
        joint: 'knee',
        correctedAngle: 55.0,
      );

      final result = await repository.watchById(id).first;
      expect(result!.manualCorrectionJoint, equals('knee'));
    });

    test('kneeAngle est mis à jour après correction du genou', () async {
      const id = 'analysis-correction-3';
      await repository.save(_buildAnalysis(id: id, kneeAngle: 62.0));

      await repository.saveManualCorrection(
        analysisId: id,
        joint: 'knee',
        correctedAngle: 55.0,
      );

      final result = await repository.watchById(id).first;
      expect(result!.kneeAngle, equals(55.0));
      // Les autres angles ne doivent pas changer
      expect(result.hipAngle, equals(22.0));
      expect(result.ankleAngle, equals(10.0));
    });
  });

  group('saveManualCorrection() — correction hanche', () {
    test('hipAngle est mis à jour et manualCorrectionJoint = "hip"', () async {
      const id = 'analysis-hip-1';
      await repository.save(_buildAnalysis(id: id, hipAngle: 22.0));

      await repository.saveManualCorrection(
        analysisId: id,
        joint: 'hip',
        correctedAngle: 30.0,
      );

      final result = await repository.watchById(id).first;
      expect(result!.manualCorrectionJoint, equals('hip'));
      expect(result.hipAngle, equals(30.0));
      expect(result.kneeAngle, equals(62.0));
    });
  });

  group('saveManualCorrection() — correction cheville', () {
    test('ankleAngle est mis à jour et manualCorrectionJoint = "ankle"', () async {
      const id = 'analysis-ankle-1';
      await repository.save(_buildAnalysis(id: id, ankleAngle: 10.0));

      await repository.saveManualCorrection(
        analysisId: id,
        joint: 'ankle',
        correctedAngle: 15.0,
      );

      final result = await repository.watchById(id).first;
      expect(result!.manualCorrectionJoint, equals('ankle'));
      expect(result.ankleAngle, equals(15.0));
      expect(result.kneeAngle, equals(62.0));
      expect(result.hipAngle, equals(22.0));
    });
  });
}
