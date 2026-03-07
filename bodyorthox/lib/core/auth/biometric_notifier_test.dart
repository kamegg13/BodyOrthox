// Tests co-localisés dans lib/ — convention projet BodyOrthox.
// [Source: docs/implementation-artifacts/1-2-acces-biometrique-par-face-id-touch-id.md#T8]

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'auth_provider.dart';
import 'biometric_notifier.dart';
import 'biometric_service.dart';

class _MockBiometricService extends Mock implements BiometricService {}

/// Helper : crée un [ProviderContainer] avec le mock biometricServiceProvider.
ProviderContainer _makeContainer({required BiometricService service}) {
  return ProviderContainer(
    overrides: [
      biometricServiceProvider.overrideWithValue(service),
    ],
  );
}

void main() {
  // Nécessaire pour WidgetsBindingObserver dans BiometricNotifier.build()
  TestWidgetsFlutterBinding.ensureInitialized();

  late _MockBiometricService mockService;

  setUp(() {
    mockService = _MockBiometricService();
  });

  // -----------------------------------------------------------------------
  // État initial
  // -----------------------------------------------------------------------

  group('état initial', () {
    test('est BiometricLocked au démarrage — AC1 (auth requise)', () async {
      final container = _makeContainer(service: mockService);
      addTearDown(container.dispose);

      // L'état initial est AsyncData(BiometricLocked) sans déclencher l'auth
      final state = await container.read(biometricNotifierProvider.future);

      expect(state, isA<BiometricLocked>());
    });
  });

  // -----------------------------------------------------------------------
  // Transitions de state via authenticate()
  // -----------------------------------------------------------------------

  group('authenticate()', () {
    test(
        'passe à BiometricUnlocked quand authenticate() retourne true — AC1',
        () async {
      when(() => mockService.isBiometricAvailable())
          .thenAnswer((_) async => true);
      when(() => mockService.authenticate()).thenAnswer((_) async => true);

      final container = _makeContainer(service: mockService);
      addTearDown(container.dispose);

      await container.read(biometricNotifierProvider.future);
      await container
          .read(biometricNotifierProvider.notifier)
          .authenticate();

      final state = container.read(biometricNotifierProvider).value;
      expect(state, isA<BiometricUnlocked>());
    });

    test(
        'reste à BiometricLocked quand authenticate() retourne false — AC2',
        () async {
      when(() => mockService.isBiometricAvailable())
          .thenAnswer((_) async => true);
      when(() => mockService.authenticate()).thenAnswer((_) async => false);

      final container = _makeContainer(service: mockService);
      addTearDown(container.dispose);

      await container.read(biometricNotifierProvider.future);
      await container
          .read(biometricNotifierProvider.notifier)
          .authenticate();

      final state = container.read(biometricNotifierProvider).value;
      expect(state, isA<BiometricLocked>());
    });

    test(
        'passe à BiometricUnavailable quand isBiometricAvailable() retourne false — AC6',
        () async {
      when(() => mockService.isBiometricAvailable())
          .thenAnswer((_) async => false);

      final container = _makeContainer(service: mockService);
      addTearDown(container.dispose);

      await container.read(biometricNotifierProvider.future);
      await container
          .read(biometricNotifierProvider.notifier)
          .authenticate();

      final state = container.read(biometricNotifierProvider).value;
      expect(state, isA<BiometricUnavailable>());
    });

    test(
        'BiometricUnavailable contient un message explicatif — AC6',
        () async {
      when(() => mockService.isBiometricAvailable())
          .thenAnswer((_) async => false);

      final container = _makeContainer(service: mockService);
      addTearDown(container.dispose);

      await container.read(biometricNotifierProvider.future);
      await container
          .read(biometricNotifierProvider.notifier)
          .authenticate();

      final state = container.read(biometricNotifierProvider).value;
      expect(state, isA<BiometricUnavailable>());
      expect((state as BiometricUnavailable).reason, isNotEmpty);
    });

    test('passe par AsyncLoading pendant l\'authentification', () async {
      when(() => mockService.isBiometricAvailable())
          .thenAnswer((_) async => true);
      // Completer pour contrôler la durée de l'auth
      when(() => mockService.authenticate()).thenAnswer(
        (_) => Future.delayed(const Duration(milliseconds: 50), () => true),
      );

      final container = _makeContainer(service: mockService);
      addTearDown(container.dispose);

      await container.read(biometricNotifierProvider.future);

      // Déclencher sans await pour capturer l'état loading
      final authFuture =
          container.read(biometricNotifierProvider.notifier).authenticate();

      // Vérifier l'état loading immédiatement après déclenchement
      expect(container.read(biometricNotifierProvider), isA<AsyncLoading>());

      await authFuture;
    });
  });

  // -----------------------------------------------------------------------
  // Transitions Locked → Unlocked → Locked
  // -----------------------------------------------------------------------

  group('cycle Locked → Unlocked → Locked', () {
    test('transition complète en 3 étapes', () async {
      when(() => mockService.isBiometricAvailable())
          .thenAnswer((_) async => true);
      when(() => mockService.authenticate()).thenAnswer((_) async => true);

      final container = _makeContainer(service: mockService);
      addTearDown(container.dispose);

      // Step 1 : état initial = Locked
      final initialState = await container.read(biometricNotifierProvider.future);
      expect(initialState, isA<BiometricLocked>());

      // Step 2 : authenticate → Unlocked
      await container.read(biometricNotifierProvider.notifier).authenticate();
      expect(
        container.read(biometricNotifierProvider).value,
        isA<BiometricUnlocked>(),
      );

      // Step 3 : simuler AppLifecycleState.paused → re-verrouillage
      container
          .read(biometricNotifierProvider.notifier)
          .didChangeAppLifecycleState(AppLifecycleState.paused);
      expect(
        container.read(biometricNotifierProvider).value,
        isA<BiometricLocked>(),
      );
    });
  });

  // -----------------------------------------------------------------------
  // AppLifecycle — re-verrouillage automatique
  // -----------------------------------------------------------------------

  group('AppLifecycle observer', () {
    test(
        'verrouille quand AppLifecycleState.paused — AC1 (re-lock en background)',
        () async {
      final container = _makeContainer(service: mockService);
      addTearDown(container.dispose);

      // Simuler un état unlocked initial
      container.read(biometricNotifierProvider.notifier).state =
          const AsyncData(BiometricUnlocked());

      // Simuler la mise en background
      container
          .read(biometricNotifierProvider.notifier)
          .didChangeAppLifecycleState(AppLifecycleState.paused);

      final state = container.read(biometricNotifierProvider).value;
      expect(state, isA<BiometricLocked>());
    });

    test(
        'verrouille quand AppLifecycleState.inactive — AC1 (appel entrant)',
        () async {
      final container = _makeContainer(service: mockService);
      addTearDown(container.dispose);

      container.read(biometricNotifierProvider.notifier).state =
          const AsyncData(BiometricUnlocked());

      container
          .read(biometricNotifierProvider.notifier)
          .didChangeAppLifecycleState(AppLifecycleState.inactive);

      final state = container.read(biometricNotifierProvider).value;
      expect(state, isA<BiometricLocked>());
    });

    test(
        'déclenche authenticate() quand AppLifecycleState.resumed — AC1',
        () async {
      when(() => mockService.isBiometricAvailable())
          .thenAnswer((_) async => true);
      when(() => mockService.authenticate()).thenAnswer((_) async => true);

      final container = _makeContainer(service: mockService);
      addTearDown(container.dispose);

      await container.read(biometricNotifierProvider.future);

      container
          .read(biometricNotifierProvider.notifier)
          .didChangeAppLifecycleState(AppLifecycleState.resumed);

      // Laisser authenticate() se terminer
      await Future.microtask(() {});
      await Future.delayed(Duration.zero);

      verify(() => mockService.isBiometricAvailable()).called(greaterThan(0));
    });
  });

  // -----------------------------------------------------------------------
  // Pas de persistance de session — AC4
  // -----------------------------------------------------------------------

  group('zéro persistance de session — AC4', () {
    test(
        'nouvel état initial est toujours BiometricLocked après recréation du container',
        () async {
      when(() => mockService.isBiometricAvailable())
          .thenAnswer((_) async => true);
      when(() => mockService.authenticate()).thenAnswer((_) async => true);

      // Premier container — authentification réussie
      final container1 = _makeContainer(service: mockService);
      await container1.read(biometricNotifierProvider.future);
      await container1.read(biometricNotifierProvider.notifier).authenticate();
      expect(
        container1.read(biometricNotifierProvider).value,
        isA<BiometricUnlocked>(),
      );
      container1.dispose();

      // Nouveau container (= nouvelle session app) — doit repartir de Locked
      final container2 = _makeContainer(service: mockService);
      addTearDown(container2.dispose);

      final newInitialState =
          await container2.read(biometricNotifierProvider.future);
      expect(newInitialState, isA<BiometricLocked>());
    });
  });
}
