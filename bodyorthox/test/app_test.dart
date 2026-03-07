// Tests widget — BodyOrthoxApp (Story 1.2 : routeur biométrique).
// Story 1.2 remplace le scaffold placeholder par MaterialApp.router + biometric guard.
//
// NOTE : Les tests de navigation biométrique complète nécessitent un mock de local_auth
// (plugin natif non disponible dans flutter_test). Ces tests vérifient uniquement
// la structure de l'app et les providers.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:bodyorthox/app.dart';
import 'package:bodyorthox/core/auth/auth_provider.dart';
import 'package:bodyorthox/core/auth/biometric_service.dart';
import 'package:bodyorthox/core/config/app_config.dart';
import 'package:bodyorthox/core/config/app_config_provider.dart';

class _MockBiometricService extends Mock implements BiometricService {}

/// Helper : pumpWidget avec un mock BiometricService pour éviter d'appeler local_auth.
Future<void> pumpAppWithMock(
  WidgetTester tester, {
  AppConfig config = const AppConfig.dev(),
  required BiometricService service,
}) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        biometricServiceProvider.overrideWithValue(service),
      ],
      child: BodyOrthoxApp(config: config),
    ),
  );
}

void main() {
  late _MockBiometricService mockService;

  setUp(() {
    mockService = _MockBiometricService();
    // Par défaut : biométrie disponible mais auth non déclenchée automatiquement
    when(() => mockService.isBiometricAvailable()).thenAnswer((_) async => true);
    when(() => mockService.authenticate()).thenAnswer((_) async => false);
  });

  group('BodyOrthoxApp — lancement', () {
    testWidgets('se lance sans erreur avec AppConfig.dev()', (tester) async {
      await pumpAppWithMock(tester, config: const AppConfig.dev(), service: mockService);
      expect(tester.takeException(), isNull);
    });

    testWidgets('se lance sans erreur avec AppConfig.prod()', (tester) async {
      await pumpAppWithMock(tester, config: const AppConfig.prod(), service: mockService);
      expect(tester.takeException(), isNull);
    });

    testWidgets('contient un widget BodyOrthoxApp dans l\'arbre', (tester) async {
      await pumpAppWithMock(tester, service: mockService);
      expect(find.byType(BodyOrthoxApp), findsOneWidget);
    });
  });

  group('BodyOrthoxApp — Material 3 et thème', () {
    testWidgets('le widget tree se construit sans exception', (tester) async {
      await pumpAppWithMock(tester, service: mockService);
      // Laisser les timers se terminer
      await tester.pump(const Duration(milliseconds: 100));
      expect(tester.takeException(), isNull);
    });
  });

  group('BodyOrthoxApp — ProviderScope et appConfigProvider', () {
    testWidgets('appConfigProvider est accessible depuis le widget tree en dev', (tester) async {
      await pumpAppWithMock(tester, config: const AppConfig.dev(), service: mockService);

      // containerOf doit recevoir un élément ENFANT du ProviderScope interne (BodyOrthoxApp),
      // pas le ProviderScope lui-même — sinon Riverpod remonte au parent et lit le mauvais container.
      final container = ProviderScope.containerOf(
        tester.element(find.byType(MaterialApp)),
      );
      final config = container.read(appConfigProvider);
      expect(config.isProduction, isFalse);
    });

    testWidgets('appConfigProvider en prod retourne isProduction=true', (tester) async {
      await pumpAppWithMock(tester, config: const AppConfig.prod(), service: mockService);

      final container = ProviderScope.containerOf(
        tester.element(find.byType(MaterialApp)),
      );
      final config = container.read(appConfigProvider);
      expect(config.isProduction, isTrue);
    });
  });

  group('BodyOrthoxApp — propriété config', () {
    testWidgets('accepte AppConfig comme paramètre requis', (tester) async {
      const devConfig = AppConfig.dev();
      await pumpAppWithMock(tester, config: devConfig, service: mockService);
      expect(find.byType(BodyOrthoxApp), findsOneWidget);
    });
  });
}
