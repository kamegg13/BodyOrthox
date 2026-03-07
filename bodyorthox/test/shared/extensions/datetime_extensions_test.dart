// Tests unitaires — DateTimeExtensions.
// Story 1.1 : Règle architecturale — ISO 8601 string obligatoire.
// INTERDIT : Unix timestamp entier.
// [Source: docs/planning-artifacts/architecture.md#Architecture-des-données]

import 'package:flutter_test/flutter_test.dart';
import 'package:bodyorthox/shared/extensions/datetime_extensions.dart';

void main() {
  group('DateTimeExtensions.toIso8601StorageString()', () {
    test('retourne une string ISO 8601 valide', () {
      final dt = DateTime(2026, 3, 5, 14, 30, 0);
      final result = dt.toIso8601StorageString();

      expect(result, contains('2026'));
      expect(result, contains('T'));
      expect(result, contains('Z')); // UTC
    });

    test('convertit en UTC (Z suffix)', () {
      final dtLocal = DateTime(2026, 3, 5, 14, 30, 0);
      final result = dtLocal.toIso8601StorageString();
      expect(result, endsWith('Z'));
    });

    test('format parseable en DateTime', () {
      final original = DateTime.utc(2026, 3, 5, 14, 30, 0);
      final iso = original.toIso8601StorageString();
      final parsed = DateTime.parse(iso);
      expect(parsed.year, equals(2026));
      expect(parsed.month, equals(3));
      expect(parsed.day, equals(5));
    });

    test('ne retourne pas un Unix timestamp (pas de string purement numérique)', () {
      final dt = DateTime(2026, 3, 5);
      final result = dt.toIso8601StorageString();
      // Un Unix timestamp serait juste des chiffres
      expect(int.tryParse(result), isNull);
    });
  });

  group('DateTimeExtensions.toDisplayDate()', () {
    test('format JJ/MM/AAAA pour affichage', () {
      final dt = DateTime(2026, 3, 5);
      expect(dt.toDisplayDate(), equals('05/03/2026'));
    });

    test('zéros de remplissage pour jours < 10', () {
      final dt = DateTime(2026, 1, 9);
      expect(dt.toDisplayDate(), equals('09/01/2026'));
    });

    test('format correct pour fin de mois', () {
      final dt = DateTime(2026, 12, 31);
      expect(dt.toDisplayDate(), equals('31/12/2026'));
    });
  });
}
