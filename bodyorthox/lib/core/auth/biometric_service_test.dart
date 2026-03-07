// Tests co-localisés dans lib/ — convention projet BodyOrthox.
// [Source: docs/implementation-artifacts/1-2-acces-biometrique-par-face-id-touch-id.md#T8]

import 'package:flutter_test/flutter_test.dart';
import 'package:local_auth/local_auth.dart';
import 'package:mocktail/mocktail.dart';

import 'local_auth_biometric_service.dart';

class _MockLocalAuthentication extends Mock implements LocalAuthentication {}

void main() {
  group('LocalAuthBiometricService', () {
    late _MockLocalAuthentication mockAuth;
    late LocalAuthBiometricService service;

    setUp(() {
      mockAuth = _MockLocalAuthentication();
      service = LocalAuthBiometricService.withAuth(mockAuth);
    });

    // -----------------------------------------------------------------------
    // isBiometricAvailable()
    // -----------------------------------------------------------------------

    group('isBiometricAvailable()', () {
      test('retourne true quand Face ID est disponible et enrôlé', () async {
        when(() => mockAuth.isDeviceSupported()).thenAnswer((_) async => true);
        when(() => mockAuth.getAvailableBiometrics())
            .thenAnswer((_) async => [BiometricType.face]);

        final result = await service.isBiometricAvailable();

        expect(result, isTrue);
      });

      test('retourne true quand Touch ID est disponible et enrôlé', () async {
        when(() => mockAuth.isDeviceSupported()).thenAnswer((_) async => true);
        when(() => mockAuth.getAvailableBiometrics())
            .thenAnswer((_) async => [BiometricType.fingerprint]);

        final result = await service.isBiometricAvailable();

        expect(result, isTrue);
      });

      test(
          'retourne false quand aucune biométrie enrôlée (liste vide) — AC6',
          () async {
        when(() => mockAuth.isDeviceSupported()).thenAnswer((_) async => true);
        when(() => mockAuth.getAvailableBiometrics())
            .thenAnswer((_) async => []);

        final result = await service.isBiometricAvailable();

        expect(result, isFalse);
      });

      test(
          'retourne false quand isDeviceSupported() retourne false — AC6',
          () async {
        when(() => mockAuth.isDeviceSupported()).thenAnswer((_) async => false);

        final result = await service.isBiometricAvailable();

        expect(result, isFalse);
        // getAvailableBiometrics ne doit pas être appelé si device non supporté
        verifyNever(() => mockAuth.getAvailableBiometrics());
      });

      test('retourne false si une exception est levée', () async {
        when(() => mockAuth.isDeviceSupported())
            .thenThrow(Exception('Platform error'));

        final result = await service.isBiometricAvailable();

        expect(result, isFalse);
      });
    });

    // -----------------------------------------------------------------------
    // authenticate()
    // -----------------------------------------------------------------------

    group('authenticate()', () {
      test('retourne true quand Face ID réussit — AC1', () async {
        when(() => mockAuth.isDeviceSupported()).thenAnswer((_) async => true);
        when(() => mockAuth.getAvailableBiometrics())
            .thenAnswer((_) async => [BiometricType.face]);
        when(() => mockAuth.authenticate(
              localizedReason: any(named: 'localizedReason'),
              biometricOnly: any(named: 'biometricOnly'),
              persistAcrossBackgrounding:
                  any(named: 'persistAcrossBackgrounding'),
            )).thenAnswer((_) async => true);

        final result = await service.authenticate();

        expect(result, isTrue);
      });

      test(
          'retourne false quand Face ID est annulé par l\'utilisateur — AC2',
          () async {
        when(() => mockAuth.isDeviceSupported()).thenAnswer((_) async => true);
        when(() => mockAuth.getAvailableBiometrics())
            .thenAnswer((_) async => [BiometricType.face]);
        when(() => mockAuth.authenticate(
              localizedReason: any(named: 'localizedReason'),
              biometricOnly: any(named: 'biometricOnly'),
              persistAcrossBackgrounding:
                  any(named: 'persistAcrossBackgrounding'),
            )).thenAnswer((_) async => false);

        final result = await service.authenticate();

        expect(result, isFalse);
      });

      test(
          'retourne false quand Face ID non reconnu (échec biométrique) — AC2',
          () async {
        when(() => mockAuth.isDeviceSupported()).thenAnswer((_) async => true);
        when(() => mockAuth.getAvailableBiometrics())
            .thenAnswer((_) async => [BiometricType.face]);
        when(() => mockAuth.authenticate(
              localizedReason: any(named: 'localizedReason'),
              biometricOnly: any(named: 'biometricOnly'),
              persistAcrossBackgrounding:
                  any(named: 'persistAcrossBackgrounding'),
            )).thenAnswer((_) async => false);

        final result = await service.authenticate();

        expect(result, isFalse);
      });

      test(
          'retourne false sans appeler authenticate() si biométrie indisponible — AC6',
          () async {
        when(() => mockAuth.isDeviceSupported()).thenAnswer((_) async => true);
        when(() => mockAuth.getAvailableBiometrics())
            .thenAnswer((_) async => []);

        final result = await service.authenticate();

        expect(result, isFalse);
        verifyNever(() => mockAuth.authenticate(
              localizedReason: any(named: 'localizedReason'),
              biometricOnly: any(named: 'biometricOnly'),
              persistAcrossBackgrounding:
                  any(named: 'persistAcrossBackgrounding'),
            ));
      });

      test('utilise biometricOnly: true — AC2 (pas de fallback PIN)', () async {
        when(() => mockAuth.isDeviceSupported()).thenAnswer((_) async => true);
        when(() => mockAuth.getAvailableBiometrics())
            .thenAnswer((_) async => [BiometricType.face]);
        when(() => mockAuth.authenticate(
              localizedReason: any(named: 'localizedReason'),
              biometricOnly: true,
              persistAcrossBackgrounding: any(named: 'persistAcrossBackgrounding'),
            )).thenAnswer((_) async => true);

        await service.authenticate();

        // Vérifier que biometricOnly: true est explicitement passé
        verify(() => mockAuth.authenticate(
              localizedReason: any(named: 'localizedReason'),
              biometricOnly: true,
              persistAcrossBackgrounding: any(named: 'persistAcrossBackgrounding'),
            )).called(1);
      });

      test('retourne false si une exception est levée', () async {
        when(() => mockAuth.isDeviceSupported()).thenAnswer((_) async => true);
        when(() => mockAuth.getAvailableBiometrics())
            .thenAnswer((_) async => [BiometricType.face]);
        when(() => mockAuth.authenticate(
              localizedReason: any(named: 'localizedReason'),
              biometricOnly: any(named: 'biometricOnly'),
              persistAcrossBackgrounding:
                  any(named: 'persistAcrossBackgrounding'),
            )).thenThrow(Exception('LocalAuth error'));

        final result = await service.authenticate();

        expect(result, isFalse);
      });
    });
  });
}
