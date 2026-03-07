// Widget tests pour ArticularAngleCard — Story 3.4 Task 3 / Task 7.
// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task7]
// ignore: depend_on_referenced_packages
import 'package:flutter/material.dart';
// ignore: depend_on_referenced_packages
import 'package:flutter_test/flutter_test.dart';

import '../../domain/reference_norms.dart';
import 'articular_angle_card.dart';

void main() {
  Widget buildCard({
    required NormStatus normStatus,
    double? confidenceScore,
    bool isExpertView = false,
    bool primary = true,
  }) {
    final card = primary
        ? ArticularAngleCard.primary(
            articulationLabel: 'Flexion genou gauche',
            angle: 42.3,
            normMin: 60.0,
            normMax: 70.0,
            normStatus: normStatus,
            patientAge: 67,
            confidenceScore: confidenceScore,
            isExpertView: isExpertView,
          )
        : ArticularAngleCard.compact(
            articulationLabel: 'Flexion genou gauche',
            angle: 42.3,
            normMin: 60.0,
            normMax: 70.0,
            normStatus: normStatus,
            patientAge: 67,
            confidenceScore: confidenceScore,
            isExpertView: isExpertView,
          );

    return MaterialApp(
      home: Scaffold(
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: card,
        ),
      ),
    );
  }

  group('ArticularAngleCard — formatage de l\'angle (AC1)', () {
    testWidgets('affiche l\'angle avec 1 décimale (42.3°)', (tester) async {
      await tester.pumpWidget(buildCard(normStatus: const NormNormal()));
      expect(find.text('42.3°'), findsOneWidget);
    });
  });

  group('ArticularAngleCard — état normal (AC3)', () {
    testWidgets('affiche le label "Normal"', (tester) async {
      await tester.pumpWidget(buildCard(normStatus: const NormNormal()));
      expect(find.text('Normal'), findsOneWidget);
    });
  });

  group('ArticularAngleCard — état borderline (AC3)', () {
    testWidgets('affiche le label "Limite"', (tester) async {
      await tester.pumpWidget(buildCard(normStatus: const NormBorderline()));
      expect(find.text('Limite'), findsOneWidget);
    });
  });

  group('ArticularAngleCard — état abnormal (AC3)', () {
    testWidgets('affiche le label "Hors norme"', (tester) async {
      await tester.pumpWidget(buildCard(normStatus: const NormAbnormal()));
      expect(find.text('Hors norme'), findsOneWidget);
    });
  });

  group('ArticularAngleCard — état lowConfidence (AC6)', () {
    testWidgets('affiche le label "Correction manuelle" quand score < 0.6',
        (tester) async {
      await tester.pumpWidget(
        buildCard(normStatus: const NormAbnormal(), confidenceScore: 0.55),
      );
      expect(find.text('Correction manuelle'), findsOneWidget);
    });

    testWidgets('n\'affiche PAS "Correction manuelle" quand score >= 0.6',
        (tester) async {
      await tester.pumpWidget(
        buildCard(normStatus: const NormAbnormal(), confidenceScore: 0.75),
      );
      expect(find.text('Correction manuelle'), findsNothing);
    });
  });

  group('ArticularAngleCard — vue experte (AC4)', () {
    testWidgets('affiche le chip ML en vue experte', (tester) async {
      await tester.pumpWidget(
        buildCard(
          normStatus: const NormNormal(),
          confidenceScore: 0.85,
          isExpertView: true,
        ),
      );
      expect(find.textContaining('ML'), findsOneWidget);
    });

    testWidgets('n\'affiche PAS le chip ML en vue simple', (tester) async {
      await tester.pumpWidget(
        buildCard(
          normStatus: const NormNormal(),
          confidenceScore: 0.85,
          isExpertView: false,
        ),
      );
      expect(find.textContaining('ML'), findsNothing);
    });
  });

  group('ArticularAngleCard — norme de référence (AC2)', () {
    testWidgets('affiche la norme "Norme 60–70° / 67 ans"', (tester) async {
      await tester.pumpWidget(buildCard(normStatus: const NormNormal()));
      expect(find.textContaining('Norme 60–70°'), findsOneWidget);
      expect(find.textContaining('67 ans'), findsOneWidget);
    });
  });

  group('ArticularAngleCard — semantic label VoiceOver (AC8)', () {
    testWidgets('semantic label contient angle, norme et statut', (tester) async {
      await tester.pumpWidget(buildCard(normStatus: const NormAbnormal()));
      final semantics = tester.getSemantics(find.byType(ArticularAngleCard));
      expect(semantics.label, contains('42.3 degrés'));
      expect(semantics.label, contains('60 à 70 degrés'));
      expect(semantics.label, contains('67 ans'));
    });

    testWidgets('semantic label contient "Correction manuelle requise" pour lowConfidence',
        (tester) async {
      await tester.pumpWidget(
        buildCard(normStatus: const NormAbnormal(), confidenceScore: 0.50),
      );
      final semantics = tester.getSemantics(find.byType(ArticularAngleCard));
      expect(semantics.label, contains('Correction manuelle requise'));
    });
  });

  group('ArticularAngleCard — variante compact', () {
    testWidgets('variante compact affiche l\'angle', (tester) async {
      await tester.pumpWidget(
        buildCard(normStatus: const NormNormal(), primary: false),
      );
      expect(find.text('42.3°'), findsOneWidget);
    });
  });
}
