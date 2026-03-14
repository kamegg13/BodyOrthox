// Tests unitaires — analysisRegistryProvider.
// [Source: docs/implementation-artifacts/arch-1-interface-analysis-module.md#Tâche 4]

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:bodyorthox/core/analysis/analysis_provider.dart';
import 'package:bodyorthox/core/analysis/analysis_registry.dart';

void main() {
  group('analysisRegistryProvider', () {
    late ProviderContainer container;

    setUp(() {
      container = ProviderContainer();
    });

    tearDown(() {
      container.dispose();
    });

    test('retourne une instance de AnalysisRegistry — AC7', () {
      final registry = container.read(analysisRegistryProvider);

      expect(registry, isA<AnalysisRegistry>());
    });

    test('registry retourné est vide par défaut — AC7', () {
      final registry = container.read(analysisRegistryProvider);

      expect(registry.all, isEmpty);
    });

    test(
        'ProviderScope.overrides permet d\'injecter un registry pré-peuplé — AC7',
        () {
      final customRegistry = AnalysisRegistry();

      final overriddenContainer = ProviderContainer(
        overrides: [
          analysisRegistryProvider.overrideWithValue(customRegistry),
        ],
      );
      addTearDown(overriddenContainer.dispose);

      final registry = overriddenContainer.read(analysisRegistryProvider);

      expect(registry, same(customRegistry));
    });
  });
}
