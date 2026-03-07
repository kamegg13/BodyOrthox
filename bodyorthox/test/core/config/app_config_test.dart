// Tests unitaires — AppConfig (flavor-aware).
// Story 1.1 : AC4 — entry points flavor-aware avec AppConfig.dev() / AppConfig.prod()

import 'package:flutter_test/flutter_test.dart';
import 'package:bodyorthox/core/config/app_config.dart';

void main() {
  group('AppConfig.dev()', () {
    const config = AppConfig.dev();

    test('isProduction est false en dev', () {
      expect(config.isProduction, isFalse);
    });

    test('enableMlLogging est true en dev (diagnostic ML activé)', () {
      expect(config.enableMlLogging, isTrue);
    });

    test('useEncryptedDatabase est false en dev (SQLite non-chiffré pour debug)', () {
      expect(config.useEncryptedDatabase, isFalse);
    });

    test('revenueCatApiKey est défini et non-vide en dev', () {
      expect(config.revenueCatApiKey, isNotEmpty);
    });

    test('revenueCatApiKey contient "SANDBOX" pour distinguer dev de prod', () {
      expect(config.revenueCatApiKey.toUpperCase(), contains('SANDBOX'));
    });
  });

  group('AppConfig.prod()', () {
    const config = AppConfig.prod();

    test('isProduction est true en prod', () {
      expect(config.isProduction, isTrue);
    });

    test('enableMlLogging est false en prod (pas de logs ML en production)', () {
      expect(config.enableMlLogging, isFalse);
    });

    test('useEncryptedDatabase est true en prod (SQLCipher AES-256 activé)', () {
      expect(config.useEncryptedDatabase, isTrue);
    });

    test('revenueCatApiKey est défini et non-vide en prod', () {
      expect(config.revenueCatApiKey, isNotEmpty);
    });
  });

  group('AppConfig — isolation des configs', () {
    test('dev et prod ont des isProduction différents', () {
      const dev = AppConfig.dev();
      const prod = AppConfig.prod();
      expect(dev.isProduction, isNot(equals(prod.isProduction)));
    });

    test('dev et prod ont des revenueCatApiKey différentes', () {
      const dev = AppConfig.dev();
      const prod = AppConfig.prod();
      expect(dev.revenueCatApiKey, isNot(equals(prod.revenueCatApiKey)));
    });

    test('dev et prod ont useEncryptedDatabase opposés', () {
      const dev = AppConfig.dev();
      const prod = AppConfig.prod();
      expect(dev.useEncryptedDatabase, isNot(equals(prod.useEncryptedDatabase)));
    });

    test('AppConfig.dev() est const-constructible (performance)', () {
      const config1 = AppConfig.dev();
      const config2 = AppConfig.dev();
      // Les instances const partagent la même identité
      expect(identical(config1, config2), isTrue);
    });
  });
}
