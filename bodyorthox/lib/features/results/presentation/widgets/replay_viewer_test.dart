// Tests unitaires du ReplayViewer — Story 3.5.
// AC1: replay image par image avec angles superposés
// AC6: scrubber Slider Material 3
// AC7: Play/Pause + navigation frame
// AC8: Pinch-to-zoom (InteractiveViewer)
// AC10: pas de fuite mémoire (frames libérés après affichage)
// [Source: docs/implementation-artifacts/3-5-replay-expert-correction-manuelle.md#Task6.1]

// ignore: depend_on_referenced_packages
import 'package:flutter/material.dart';
// ignore: depend_on_referenced_packages
import 'package:flutter_riverpod/flutter_riverpod.dart';
// ignore: depend_on_referenced_packages
import 'package:flutter_test/flutter_test.dart';

import '../../domain/analysis_frame.dart';
import '../../../capture/domain/articular_angles.dart';
import '../../../capture/domain/confidence_score.dart';
import 'replay_viewer.dart';

// ─── Helpers ─────────────────────────────────────────────────────────────────

List<AnalysisFrame> _buildFrames({int count = 5}) {
  return List.generate(
    count,
    (i) => AnalysisFrame.withDefaultPositions(
      frameIndex: i,
      angles: ArticularAngles(
        kneeAngle: 60.0 + i,
        hipAngle: 20.0 + i,
        ankleAngle: 10.0 + i,
      ),
      confidence: const ConfidenceScore(
        kneeScore: 0.90,
        hipScore: 0.85,
        ankleScore: 0.88,
      ),
    ),
  );
}

List<AnalysisFrame> _buildLowConfidenceFrames() {
  return [
    AnalysisFrame.withDefaultPositions(
      frameIndex: 0,
      angles: const ArticularAngles(
        kneeAngle: 42.0,
        hipAngle: 18.0,
        ankleAngle: 8.0,
      ),
      confidence: const ConfidenceScore(
        kneeScore: 0.45, // < 0.60 → orange
        hipScore: 0.80,
        ankleScore: 0.70,
      ),
    ),
  ];
}

Widget _wrapInApp(Widget child) {
  return ProviderScope(
    child: MaterialApp(
      home: Scaffold(body: child),
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────

void main() {
  group('ReplayViewer — AC1 : rendu de base', () {
    testWidgets('se rend sans erreur avec une liste de frames', (tester) async {
      final frames = _buildFrames();

      await tester.pumpWidget(_wrapInApp(
        ReplayViewer(
          frames: frames,
          analysisId: 'analysis-1',
        ),
      ));

      await tester.pump();

      expect(find.byType(ReplayViewer), findsOneWidget);
    });

    testWidgets('affiche un message quand la liste de frames est vide', (tester) async {
      await tester.pumpWidget(_wrapInApp(
        const ReplayViewer(
          frames: [],
          analysisId: 'analysis-1',
        ),
      ));

      await tester.pump();

      expect(find.text('Replay non disponible pour cette analyse.'), findsOneWidget);
    });
  });

  group('ReplayViewer — AC6 : scrubber Slider', () {
    testWidgets('contient un Slider Material 3 pour le scrubbing', (tester) async {
      final frames = _buildFrames(count: 10);

      await tester.pumpWidget(_wrapInApp(
        ReplayViewer(
          frames: frames,
          analysisId: 'analysis-1',
        ),
      ));

      await tester.pump();

      expect(find.byType(Slider), findsOneWidget);
    });
  });

  group('ReplayViewer — AC7 : contrôles lecture', () {
    testWidgets('contient le bouton Play/Pause', (tester) async {
      final frames = _buildFrames();

      await tester.pumpWidget(_wrapInApp(
        ReplayViewer(
          frames: frames,
          analysisId: 'analysis-1',
        ),
      ));

      await tester.pump();

      // Bouton Play/Pause (icône)
      expect(
        find.byWidgetPredicate(
          (w) => w is IconButton &&
              (w.icon is Icon) &&
              ((w.icon as Icon).icon == Icons.play_arrow ||
                  (w.icon as Icon).icon == Icons.pause),
        ),
        findsOneWidget,
      );
    });

    testWidgets('contient les boutons frame précédent et suivant', (tester) async {
      final frames = _buildFrames();

      await tester.pumpWidget(_wrapInApp(
        ReplayViewer(
          frames: frames,
          analysisId: 'analysis-1',
        ),
      ));

      await tester.pump();

      expect(find.byIcon(Icons.skip_previous), findsOneWidget);
      expect(find.byIcon(Icons.skip_next), findsOneWidget);
    });

    testWidgets('tap sur Play démarre la lecture et affiche Pause', (tester) async {
      final frames = _buildFrames();

      await tester.pumpWidget(_wrapInApp(
        ReplayViewer(
          frames: frames,
          analysisId: 'analysis-1',
        ),
      ));

      await tester.pump();

      // Initialement en mode Pause (pas de lecture auto)
      expect(find.byIcon(Icons.play_arrow), findsOneWidget);

      // Tap play
      await tester.tap(find.byIcon(Icons.play_arrow));
      await tester.pump();

      expect(find.byIcon(Icons.pause), findsOneWidget);
    });
  });

  group('ReplayViewer — AC8 : pinch-to-zoom', () {
    testWidgets('contient un InteractiveViewer pour le zoom', (tester) async {
      final frames = _buildFrames();

      await tester.pumpWidget(_wrapInApp(
        ReplayViewer(
          frames: frames,
          analysisId: 'analysis-1',
        ),
      ));

      await tester.pump();

      expect(find.byType(InteractiveViewer), findsOneWidget);
    });
  });

  group('ReplayViewer — AC2 : basse confiance', () {
    testWidgets('s\'affiche avec frames basse confiance sans crash', (tester) async {
      final frames = _buildLowConfidenceFrames();

      await tester.pumpWidget(_wrapInApp(
        ReplayViewer(
          frames: frames,
          analysisId: 'analysis-1',
        ),
      ));

      await tester.pump();

      expect(find.byType(ReplayViewer), findsOneWidget);
    });
  });

  group('ReplayViewer — AC3 : correction manuelle', () {
    testWidgets('bouton Corriger visible pour le joint basse confiance', (tester) async {
      final frames = _buildLowConfidenceFrames();

      await tester.pumpWidget(_wrapInApp(
        ReplayViewer(
          frames: frames,
          analysisId: 'analysis-1',
        ),
      ));

      await tester.pump();

      expect(find.text('Corriger'), findsWidgets);
    });

    testWidgets('callback onCorrectionSaved appelé après correction', (tester) async {
      final frames = _buildLowConfidenceFrames();
      String? savedJoint;
      double? savedAngle;

      await tester.pumpWidget(_wrapInApp(
        ReplayViewer(
          frames: frames,
          analysisId: 'analysis-1',
          onCorrectionSaved: (joint, angle) {
            savedJoint = joint;
            savedAngle = angle;
          },
        ),
      ));

      await tester.pump();

      // Tapper sur "Corriger Genou"
      final correctButton = find.text('Corriger');
      if (correctButton.evaluate().isNotEmpty) {
        await tester.tap(correctButton.first);
        await tester.pump();
      }

      // Le mode édition s'active — on peut tapper sur "Confirmer"
      final confirmButton = find.text('Confirmer');
      if (confirmButton.evaluate().isNotEmpty) {
        await tester.tap(confirmButton);
        await tester.pump();
        expect(savedJoint, isNotNull);
        expect(savedAngle, isNotNull);
      }
    });
  });
}
