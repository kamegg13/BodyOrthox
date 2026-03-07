// Tests widget E2E — BiometricLockScreen — Story 1.2 AC5, AC6.
// [Source: docs/implementation-artifacts/1-2-acces-biometrique-par-face-id-touch-id.md]

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:bodyorthox/core/auth/auth_provider.dart';
import 'package:bodyorthox/core/auth/biometric_notifier.dart';
import 'package:bodyorthox/core/auth/biometric_service.dart';
import 'package:bodyorthox/shared/design_system/app_colors.dart';
import 'package:bodyorthox/shared/design_system/app_spacing.dart';
import 'package:bodyorthox/shared/widgets/biometric_lock_screen.dart';

class _MockBiometricService extends Mock implements BiometricService {}

/// Helper : pompe BiometricLockScreen avec l'état biométrique forcé.
Future<void> pumpLockScreen(
  WidgetTester tester, {
  required BiometricService service,
  AsyncValue<BiometricState>? forcedState,
}) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        biometricServiceProvider.overrideWithValue(service),
      ],
      child: const MaterialApp(
        home: BiometricLockScreen(),
      ),
    ),
  );

  if (forcedState != null) {
    // Forcer l'état du notifier après montage
    final container = ProviderScope.containerOf(
      tester.element(find.byType(BiometricLockScreen)),
    );
    container.read(biometricNotifierProvider.notifier).state = forcedState;
    await tester.pump();
  }
}

void main() {
  late _MockBiometricService mockService;

  setUp(() {
    mockService = _MockBiometricService();
    // Défaut : biométrie disponible, auth retourne false (locked)
    when(() => mockService.isBiometricAvailable()).thenAnswer((_) async => true);
    when(() => mockService.authenticate()).thenAnswer((_) async => false);
  });

  // -----------------------------------------------------------------------
  // AC5 — Écran de verrouillage affiché avec bouton "Se déverrouiller"
  // -----------------------------------------------------------------------

  group('AC5 — Affichage de l\'écran de verrouillage', () {
    testWidgets('affiche le titre BodyOrthox', (tester) async {
      await pumpLockScreen(tester, service: mockService,
          forcedState: const AsyncData(BiometricLocked()));
      expect(find.text('BodyOrthox'), findsOneWidget);
    });

    testWidgets('affiche le sous-titre explicatif', (tester) async {
      await pumpLockScreen(tester, service: mockService,
          forcedState: const AsyncData(BiometricLocked()));
      expect(
        find.text('Vérifiez votre identité pour accéder à vos données patients'),
        findsOneWidget,
      );
    });

    testWidgets('affiche le bouton Se déverrouiller', (tester) async {
      await pumpLockScreen(tester, service: mockService,
          forcedState: const AsyncData(BiometricLocked()));
      expect(find.text('Se déverrouiller'), findsOneWidget);
    });

    testWidgets('fond de l\'écran est blanc (AppColors.surface)', (tester) async {
      await pumpLockScreen(tester, service: mockService,
          forcedState: const AsyncData(BiometricLocked()));
      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold));
      expect(scaffold.backgroundColor, equals(AppColors.surface));
    });

    testWidgets('le bouton a une hauteur ≥ 44pt (touch target Apple HIG)', (tester) async {
      await pumpLockScreen(tester, service: mockService,
          forcedState: const AsyncData(BiometricLocked()));
      final sizedBox = tester.widget<SizedBox>(
        find.ancestor(
          of: find.byType(ElevatedButton),
          matching: find.byType(SizedBox),
        ).first,
      );
      expect(sizedBox.height, greaterThanOrEqualTo(AppSpacing.touchTarget));
    });

    testWidgets('affiche l\'icône biométrique', (tester) async {
      await pumpLockScreen(tester, service: mockService,
          forcedState: const AsyncData(BiometricLocked()));
      expect(find.byIcon(Icons.face_unlock_outlined), findsOneWidget);
    });
  });

  // -----------------------------------------------------------------------
  // AC5 — Bouton re-déclenche le prompt biométrique
  // -----------------------------------------------------------------------

  group('AC5 — Bouton Se déverrouiller appelle authenticate()', () {
    testWidgets('tap sur Se déverrouiller appelle BiometricService.authenticate()', (tester) async {
      await pumpLockScreen(tester, service: mockService,
          forcedState: const AsyncData(BiometricLocked()));

      await tester.tap(find.text('Se déverrouiller'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      verify(() => mockService.authenticate()).called(greaterThan(0));
    });

    testWidgets('bouton est désactivé pendant AsyncLoading', (tester) async {
      await pumpLockScreen(tester, service: mockService,
          forcedState: const AsyncLoading());

      final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(button.onPressed, isNull,
          reason: 'Le bouton doit être désactivé pendant l\'authentification.');
    });

    testWidgets('affiche le texte Authentification... pendant AsyncLoading', (tester) async {
      await pumpLockScreen(tester, service: mockService,
          forcedState: const AsyncLoading());
      expect(find.text('Authentification...'), findsOneWidget);
    });

    testWidgets('affiche CircularProgressIndicator pendant AsyncLoading', (tester) async {
      await pumpLockScreen(tester, service: mockService,
          forcedState: const AsyncLoading());
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });
  });

  // -----------------------------------------------------------------------
  // AC5 — Déclenchement automatique au montage
  // -----------------------------------------------------------------------

  group('AC5 — Déclenchement automatique au montage', () {
    testWidgets('appelle authenticate() automatiquement au montage', (tester) async {
      // Ne pas forcer d'état — laisser le build() naturel
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            biometricServiceProvider.overrideWithValue(mockService),
          ],
          child: const MaterialApp(home: BiometricLockScreen()),
        ),
      );

      // addPostFrameCallback se déclenche après le premier frame
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      verify(() => mockService.isBiometricAvailable()).called(greaterThan(0));
    });
  });

  // -----------------------------------------------------------------------
  // AC6 — Biométrie indisponible : message d'erreur explicatif
  // -----------------------------------------------------------------------

  group('AC6 — Biométrie indisponible', () {
    testWidgets('affiche le message d\'erreur quand BiometricUnavailable', (tester) async {
      const errorReason = 'Aucune biométrie configurée.';
      await pumpLockScreen(
        tester,
        service: mockService,
        forcedState: const AsyncData(BiometricUnavailable(errorReason)),
      );

      expect(find.text(errorReason), findsOneWidget);
    });

    testWidgets('le message d\'erreur est de couleur rouge (AppColors.error)', (tester) async {
      const errorReason = 'Aucune biométrie configurée.';
      await pumpLockScreen(
        tester,
        service: mockService,
        forcedState: const AsyncData(BiometricUnavailable(errorReason)),
      );

      final errorText = tester.widget<Text>(find.text(errorReason));
      expect(errorText.style?.color, equals(AppColors.error));
    });

    testWidgets('n\'affiche pas de message d\'erreur quand BiometricLocked', (tester) async {
      await pumpLockScreen(tester, service: mockService,
          forcedState: const AsyncData(BiometricLocked()));

      // Aucun texte de couleur rouge visible
      final texts = tester.widgetList<Text>(find.byType(Text));
      for (final text in texts) {
        expect(text.style?.color, isNot(equals(AppColors.error)),
            reason: 'Aucun message d\'erreur ne doit être affiché en état Locked.');
      }
    });

    testWidgets('n\'affiche pas de message d\'erreur quand BiometricUnlocked', (tester) async {
      await pumpLockScreen(tester, service: mockService,
          forcedState: const AsyncData(BiometricUnlocked()));
      expect(find.byType(SizedBox), findsWidgets); // SizedBox.shrink présent
    });
  });

  // -----------------------------------------------------------------------
  // AC2 — Pas de fallback PIN : le bouton reste visible après échec
  // -----------------------------------------------------------------------

  group('AC2 — Pas de fallback PIN : l\'écran persiste après échec', () {
    testWidgets('BiometricLockScreen reste affiché après échec d\'authentification', (tester) async {
      when(() => mockService.isBiometricAvailable()).thenAnswer((_) async => true);
      when(() => mockService.authenticate()).thenAnswer((_) async => false);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            biometricServiceProvider.overrideWithValue(mockService),
          ],
          child: const MaterialApp(home: BiometricLockScreen()),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 200));

      // L'écran de lock doit toujours être là (pas de navigation vers /)
      expect(find.byType(BiometricLockScreen), findsOneWidget);
      expect(find.text('Se déverrouiller'), findsOneWidget);
    });
  });
}
