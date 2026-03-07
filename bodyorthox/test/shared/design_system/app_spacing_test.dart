// Tests unitaires — AppSpacing (système d'espacement base 8pt).
// Story 1.1 : Règle architecturale — base 8pt, touch target 44pt minimum.
// [Source: docs/planning-artifacts/ux-design-specification.md]

import 'package:flutter_test/flutter_test.dart';
import 'package:bodyorthox/shared/design_system/app_spacing.dart';

void main() {
  group('AppSpacing — valeurs exactes', () {
    test('base est 8.0pt', () {
      expect(AppSpacing.base, equals(8.0));
    });

    test('margin est 16.0pt (2 × base)', () {
      expect(AppSpacing.margin, equals(16.0));
    });

    test('large est 24.0pt (3 × base)', () {
      expect(AppSpacing.large, equals(24.0));
    });

    test('xlarge est 32.0pt (4 × base)', () {
      expect(AppSpacing.xlarge, equals(32.0));
    });

    test('touchTarget est 44.0pt (minimum WCAG / Apple HIG)', () {
      expect(AppSpacing.touchTarget, equals(44.0));
    });
  });

  group('AppSpacing — cohérence des multiples', () {
    test('margin = 2 × base', () {
      expect(AppSpacing.margin, equals(AppSpacing.base * 2));
    });

    test('large = 3 × base', () {
      expect(AppSpacing.large, equals(AppSpacing.base * 3));
    });

    test('xlarge = 4 × base', () {
      expect(AppSpacing.xlarge, equals(AppSpacing.base * 4));
    });

    test('touchTarget >= 44pt (WCAG minimum)', () {
      expect(AppSpacing.touchTarget, greaterThanOrEqualTo(44.0));
    });
  });
}
