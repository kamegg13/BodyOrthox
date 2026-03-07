// Tests widget GuidedCameraOverlay — AC1, AC2, AC3, AC4, AC8.
//
// Tests co-localisés (convention architecturale).
// [Source: docs/implementation-artifacts/3-1-lancement-de-session-guidage-camera.md#T7.2-7.4]
// ignore: depend_on_referenced_packages
import 'package:flutter/material.dart';
// ignore: depend_on_referenced_packages
import 'package:flutter_test/flutter_test.dart';

import 'guided_camera_overlay.dart';

Widget _wrap(Widget child) => MaterialApp(
      home: Scaffold(body: SizedBox(width: 400, height: 800, child: child)),
    );

void main() {
  group('GuidedCameraOverlay — états et couleurs', () {
    testWidgets('état ready → bouton Démarrer visible et actif (AC4)', (tester) async {
      bool tapped = false;
      await tester.pumpWidget(_wrap(
        GuidedCameraOverlay(
          overlayState: CameraOverlayState.ready,
          onStart: () => tapped = true,
        ),
      ));

      // Bouton Démarrer visible
      expect(find.byKey(const Key('start_button')), findsOneWidget);

      // Bouton Stop masqué
      expect(find.byKey(const Key('stop_button')), findsNothing);

      // Bouton tapable
      await tester.tap(find.byKey(const Key('start_button')));
      expect(tapped, isTrue);
    });

    testWidgets('état lowLight → bouton Démarrer masqué (AC2, AC4)', (tester) async {
      await tester.pumpWidget(_wrap(
        const GuidedCameraOverlay(overlayState: CameraOverlayState.lowLight),
      ));

      expect(find.byKey(const Key('start_button')), findsNothing);
      expect(find.text('Améliorez l\'éclairage'), findsOneWidget);
    });

    testWidgets('état positioning → bouton Démarrer masqué, texte correct (AC3, AC4)', (tester) async {
      await tester.pumpWidget(_wrap(
        const GuidedCameraOverlay(overlayState: CameraOverlayState.positioning),
      ));

      expect(find.byKey(const Key('start_button')), findsNothing);
      expect(find.text('Orientez de profil'), findsOneWidget);
    });

    testWidgets('état recording → bouton Stop visible, bouton Démarrer masqué (AC4)', (tester) async {
      bool stopped = false;
      await tester.pumpWidget(_wrap(
        GuidedCameraOverlay(
          overlayState: CameraOverlayState.recording,
          onStop: () => stopped = true,
        ),
      ));

      expect(find.byKey(const Key('stop_button')), findsOneWidget);
      expect(find.byKey(const Key('start_button')), findsNothing);

      await tester.tap(find.byKey(const Key('stop_button')));
      expect(stopped, isTrue);
    });

    testWidgets('état idle → aucun bouton visible', (tester) async {
      await tester.pumpWidget(_wrap(
        const GuidedCameraOverlay(overlayState: CameraOverlayState.idle),
      ));

      expect(find.byKey(const Key('start_button')), findsNothing);
      expect(find.byKey(const Key('stop_button')), findsNothing);
    });

    testWidgets('état ready → texte "Prêt" visible', (tester) async {
      await tester.pumpWidget(_wrap(
        const GuidedCameraOverlay(overlayState: CameraOverlayState.ready),
      ));

      expect(find.textContaining('Prêt'), findsOneWidget);
    });

    testWidgets('état recording → texte "En cours" visible', (tester) async {
      await tester.pumpWidget(_wrap(
        const GuidedCameraOverlay(overlayState: CameraOverlayState.recording),
      ));

      expect(find.text('En cours...'), findsOneWidget);
    });

    testWidgets('Semantics label correct pour état ready (AC8 accessibilité)', (tester) async {
      await tester.pumpWidget(_wrap(
        const GuidedCameraOverlay(overlayState: CameraOverlayState.ready),
      ));

      expect(
        find.bySemanticsLabel(RegExp('Caméra prête')),
        findsWidgets,
      );
    });

    testWidgets('Semantics label correct pour état lowLight (AC8 accessibilité)', (tester) async {
      await tester.pumpWidget(_wrap(
        const GuidedCameraOverlay(overlayState: CameraOverlayState.lowLight),
      ));

      expect(
        find.bySemanticsLabel(RegExp('Lumière insuffisante')),
        findsWidgets,
      );
    });
  });

  group('GuidedCameraOverlay — couleurs bordure (AC1)', () {
    testWidgets('état ready → bordure verte (#34C759)', (tester) async {
      await tester.pumpWidget(_wrap(
        const GuidedCameraOverlay(overlayState: CameraOverlayState.ready),
      ));

      final decoratedBox = tester.widget<DecoratedBox>(
        find.byType(DecoratedBox).first,
      );
      final decoration = decoratedBox.decoration as BoxDecoration;
      expect(decoration.border?.top.color, const Color(0xFF34C759));
    });

    testWidgets('état lowLight → bordure orange (#FF9500)', (tester) async {
      await tester.pumpWidget(_wrap(
        const GuidedCameraOverlay(overlayState: CameraOverlayState.lowLight),
      ));

      final decoratedBox = tester.widget<DecoratedBox>(
        find.byType(DecoratedBox).first,
      );
      final decoration = decoratedBox.decoration as BoxDecoration;
      expect(decoration.border?.top.color, const Color(0xFFFF9500));
    });

    testWidgets('état recording → bordure rouge (#FF3B30)', (tester) async {
      await tester.pumpWidget(_wrap(
        const GuidedCameraOverlay(overlayState: CameraOverlayState.recording),
      ));

      final decoratedBox = tester.widget<DecoratedBox>(
        find.byType(DecoratedBox).first,
      );
      final decoration = decoratedBox.decoration as BoxDecoration;
      expect(decoration.border?.top.color, const Color(0xFFFF3B30));
    });

    testWidgets('état positioning → bordure orange (#FF9500)', (tester) async {
      await tester.pumpWidget(_wrap(
        const GuidedCameraOverlay(overlayState: CameraOverlayState.positioning),
      ));

      final decoratedBox = tester.widget<DecoratedBox>(
        find.byType(DecoratedBox).first,
      );
      final decoration = decoratedBox.decoration as BoxDecoration;
      expect(decoration.border?.top.color, const Color(0xFFFF9500));
    });
  });
}
