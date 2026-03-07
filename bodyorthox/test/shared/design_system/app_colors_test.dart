// Tests unitaires — AppColors (palette officielle BodyOrthox).
// Story 1.1 : Design system — direction Clinical White.
// [Source: docs/planning-artifacts/ux-design-specification.md]

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bodyorthox/shared/design_system/app_colors.dart';

void main() {
  group('AppColors — valeurs hexadécimales exactes', () {
    test('primary est #1B6FBF (Clinical White primary)', () {
      expect(AppColors.primary, equals(const Color(0xFF1B6FBF)));
    });

    test('success est #34C759 (iOS system green)', () {
      expect(AppColors.success, equals(const Color(0xFF34C759)));
    });

    test('warning est #FF9500 (iOS system orange)', () {
      expect(AppColors.warning, equals(const Color(0xFFFF9500)));
    });

    test('error est #FF3B30 (iOS system red)', () {
      expect(AppColors.error, equals(const Color(0xFFFF3B30)));
    });

    test('surface est blanc pur #FFFFFF', () {
      expect(AppColors.surface, equals(const Color(0xFFFFFFFF)));
    });

    test('textPrimary est #1C1C1E (quasi-noir iOS)', () {
      expect(AppColors.textPrimary, equals(const Color(0xFF1C1C1E)));
    });
  });

  group('AppColors — opacité complète (alpha = 0xFF)', () {
    test('primary a alpha = 255', () {
      expect(AppColors.primary.a, equals(1.0));
    });

    test('error a alpha = 255', () {
      expect(AppColors.error.a, equals(1.0));
    });

    test('surface a alpha = 255', () {
      expect(AppColors.surface.a, equals(1.0));
    });
  });
}
