// Tests E2E du guard biométrique — Story 1.2 AC3.
// Vérifie que biometricGuard() redirige correctement selon l'état biométrique.
// [Source: docs/implementation-artifacts/1-2-acces-biometrique-par-face-id-touch-id.md#AC3]

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mocktail/mocktail.dart';

import 'package:bodyorthox/core/auth/auth_provider.dart';
import 'package:bodyorthox/core/auth/biometric_guard.dart';
import 'package:bodyorthox/core/auth/biometric_notifier.dart';
import 'package:bodyorthox/core/auth/biometric_service.dart';

class _MockBiometricService extends Mock implements BiometricService {}

class _FakeGoRouterState extends Fake implements GoRouterState {
  final String _location;
  _FakeGoRouterState(this._location);

  @override
  String get matchedLocation => _location;
}

/// Helper : container avec état biométrique forcé.
///
/// Retourne le container et un provider intermédiaire qui expose un [Ref]
/// pour appeler [biometricGuard] depuis les tests.
///
/// Pattern Riverpod 3.x : ProviderContainer n'implémente pas Ref —
/// on passe par un Provider interne pour obtenir le Ref correctement typé.
({ProviderContainer container, String? Function(GoRouterState) guard})
    _setupGuard(AsyncValue<BiometricState> forcedState) {
  final mockService = _MockBiometricService();
  when(() => mockService.isBiometricAvailable()).thenAnswer((_) async => true);
  when(() => mockService.authenticate()).thenAnswer((_) async => false);

  final container = ProviderContainer(
    overrides: [
      biometricServiceProvider.overrideWithValue(mockService),
    ],
  );

  // Forcer l'état directement après initialisation
  container.read(biometricNotifierProvider.notifier).state = forcedState;

  // Provider intermédiaire pour extraire un Ref valide.
  // Le provider est évalué dans le scope du container, ce qui nous donne
  // un Ref correctement typé pour passer à biometricGuard.
  final guardProvider = Provider<String? Function(GoRouterState)>((ref) {
    return (routerState) => biometricGuard(routerState, ref);
  });

  final guard = container.read(guardProvider);
  return (container: container, guard: guard);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('biometricGuard() — AC3 : protection de toutes les routes', () {

    group('depuis / (route principale)', () {
      test('retourne /lock quand état est BiometricLocked', () {
        final (:container, :guard) = _setupGuard(
          const AsyncData(BiometricLocked()),
        );
        addTearDown(container.dispose);

        final result = guard(_FakeGoRouterState('/'));

        expect(result, equals('/lock'));
      });

      test('retourne null quand état est BiometricUnlocked — accès autorisé', () {
        final (:container, :guard) = _setupGuard(
          const AsyncData(BiometricUnlocked()),
        );
        addTearDown(container.dispose);

        final result = guard(_FakeGoRouterState('/'));

        expect(result, isNull);
      });

      test('retourne /lock quand état est BiometricUnavailable — AC6', () {
        final (:container, :guard) = _setupGuard(
          const AsyncData(BiometricUnavailable('Aucune biométrie')),
        );
        addTearDown(container.dispose);

        final result = guard(_FakeGoRouterState('/'));

        expect(result, equals('/lock'));
      });

      test('retourne /lock quand état est AsyncLoading', () {
        final (:container, :guard) = _setupGuard(const AsyncLoading());
        addTearDown(container.dispose);

        final result = guard(_FakeGoRouterState('/'));

        expect(result, equals('/lock'));
      });

      test('retourne /lock quand état est AsyncError', () {
        final (:container, :guard) = _setupGuard(
          AsyncError(Exception('auth error'), StackTrace.empty),
        );
        addTearDown(container.dispose);

        final result = guard(_FakeGoRouterState('/'));

        expect(result, equals('/lock'));
      });
    });

    group('depuis /lock — anti-boucle infinie', () {
      test('retourne null depuis /lock peu importe l\'état (évite boucle infinie)', () {
        // Même si l'état est Locked, ne pas rediriger depuis /lock
        final (:container, :guard) = _setupGuard(
          const AsyncData(BiometricLocked()),
        );
        addTearDown(container.dispose);

        final result = guard(_FakeGoRouterState('/lock'));

        expect(result, isNull,
            reason: 'La route /lock ne doit jamais être redirigée '
                'vers elle-même pour éviter une boucle infinie.');
      });

      test('retourne null depuis /lock même quand état est BiometricUnavailable', () {
        final (:container, :guard) = _setupGuard(
          const AsyncData(BiometricUnavailable('Pas de biométrie')),
        );
        addTearDown(container.dispose);

        final result = guard(_FakeGoRouterState('/lock'));

        expect(result, isNull);
      });
    });

    group('depuis une autre route applicative', () {
      test('retourne /lock depuis /patients quand verrouillé', () {
        final (:container, :guard) = _setupGuard(
          const AsyncData(BiometricLocked()),
        );
        addTearDown(container.dispose);

        final result = guard(_FakeGoRouterState('/patients'));

        expect(result, equals('/lock'));
      });

      test('retourne null depuis /patients quand déverrouillé', () {
        final (:container, :guard) = _setupGuard(
          const AsyncData(BiometricUnlocked()),
        );
        addTearDown(container.dispose);

        final result = guard(_FakeGoRouterState('/patients'));

        expect(result, isNull);
      });
    });

    group('sécurité par défaut', () {
      test('le guard bloque par défaut (fail-closed) — AC4', () {
        // Vérifier que l'état initial (BiometricLocked) force /lock.
        // Aucun accès sans authentification explicite.
        final (:container, :guard) = _setupGuard(
          const AsyncData(BiometricLocked()),
        );
        addTearDown(container.dispose);

        final routes = ['/', '/patients', '/analyses', '/settings'];
        for (final route in routes) {
          final result = guard(_FakeGoRouterState(route));
          expect(result, equals('/lock'),
              reason: 'Route $route doit être bloquée à l\'état initial.');
        }
      });
    });
  });
}
