// Tests du PdfGenerator — disclaimer de correction manuelle (Story 3.5, AC5).
// [Source: docs/implementation-artifacts/3-5-replay-expert-correction-manuelle.md#Task5]

// ignore: depend_on_referenced_packages
import 'package:flutter_test/flutter_test.dart';

import '../../capture/domain/analysis.dart';
import 'pdf_generator.dart';

// ─── Helpers ─────────────────────────────────────────────────────────────────

Analysis _buildAnalysis({
  bool manualCorrectionApplied = false,
  String? manualCorrectionJoint,
  double confidenceScore = 0.85,
}) =>
    Analysis(
      id: 'test-pdf-1',
      patientId: 'patient-1',
      createdAt: DateTime.utc(2026, 3, 7),
      kneeAngle: 62.0,
      hipAngle: 22.0,
      ankleAngle: 10.0,
      confidenceScore: confidenceScore,
      manualCorrectionApplied: manualCorrectionApplied,
      manualCorrectionJoint: manualCorrectionJoint,
    );

// ─────────────────────────────────────────────────────────────────────────────

void main() {
  group('PdfGenerator.manualCorrectionDisclaimerText()', () {
    test('retourne null si manualCorrectionApplied = false', () {
      final analysis = _buildAnalysis(manualCorrectionApplied: false);

      final text = PdfGenerator.manualCorrectionDisclaimerText(analysis);

      expect(text, isNull);
    });

    test('retourne null si manualCorrectionApplied = true mais joint = null', () {
      final analysis = _buildAnalysis(
        manualCorrectionApplied: true,
        manualCorrectionJoint: null,
      );

      final text = PdfGenerator.manualCorrectionDisclaimerText(analysis);

      expect(text, isNull);
    });

    test('retourne le disclaimer pour genou corrigé', () {
      final analysis = _buildAnalysis(
        manualCorrectionApplied: true,
        manualCorrectionJoint: 'knee',
      );

      final text = PdfGenerator.manualCorrectionDisclaimerText(analysis);

      expect(text, isNotNull);
      expect(text, contains('Genou'));
      expect(text, contains('estimées'));
      expect(text, contains('vérification manuelle effectuée'));
    });

    test('retourne le disclaimer pour hanche corrigée', () {
      final analysis = _buildAnalysis(
        manualCorrectionApplied: true,
        manualCorrectionJoint: 'hip',
      );

      final text = PdfGenerator.manualCorrectionDisclaimerText(analysis);

      expect(text, contains('Hanche'));
    });

    test('retourne le disclaimer pour cheville corrigée', () {
      final analysis = _buildAnalysis(
        manualCorrectionApplied: true,
        manualCorrectionJoint: 'ankle',
      );

      final text = PdfGenerator.manualCorrectionDisclaimerText(analysis);

      expect(text, contains('Cheville'));
    });

    test('ne contient pas de texte inline — utilise LegalConstants', () {
      final analysis = _buildAnalysis(
        manualCorrectionApplied: true,
        manualCorrectionJoint: 'knee',
      );

      final text = PdfGenerator.manualCorrectionDisclaimerText(analysis);

      // Le texte doit correspondre exactement à LegalConstants.manualCorrectionDisclaimer
      expect(text, equals('Données Genou : estimées — vérification manuelle effectuée.'));
    });
  });
}
