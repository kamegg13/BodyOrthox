// Tests unitaires — AnalysisRegistry.
// [Source: docs/implementation-artifacts/arch-1-interface-analysis-module.md#Tâche 5]

import 'package:cross_file/cross_file.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:bodyorthox/core/analysis/analysis_module.dart';
import 'package:bodyorthox/core/analysis/analysis_registry.dart';
import 'package:bodyorthox/core/analysis/analysis_result.dart';

// ---------------------------------------------------------------------------
// MockAnalysisModule — in-line, aucune dépendance mocktail requise
// [Source: AC6 — MockAnalysisModule dans les tests]
// ---------------------------------------------------------------------------

class _MockAnalysisModule implements AnalysisModule {
  @override
  final String moduleId;

  @override
  final String displayName;

  const _MockAnalysisModule({
    required this.moduleId,
    required this.displayName,
  });

  @override
  Future<AnalysisResult> analyze(XFile photo) async =>
      const AnalysisSuccess({'mock': 0.0});
}

void main() {
  group('AnalysisRegistry', () {
    late AnalysisRegistry registry;

    setUp(() {
      registry = AnalysisRegistry();
    });

    // -----------------------------------------------------------------------
    // register() + get() — AC2, AC3
    // -----------------------------------------------------------------------

    group('register() et get()', () {
      test('register puis get retourne le module enregistré — AC2, AC3', () {
        final module =
            const _MockAnalysisModule(moduleId: 'hka', displayName: 'HKA');

        registry.register(module);

        expect(registry.get('hka'), same(module));
      });

      test('get avec un ID inconnu retourne null — AC4', () {
        expect(registry.get('inconnu'), isNull);
      });

      test('get sur registry vide retourne null — AC4', () {
        expect(registry.get('hka'), isNull);
      });
    });

    // -----------------------------------------------------------------------
    // Last-write-wins — AC5
    // -----------------------------------------------------------------------

    group('last-write-wins', () {
      test(
          'enregistrer deux modules avec le même moduleId — le second écrase le premier — AC5',
          () {
        final module1 = const _MockAnalysisModule(
          moduleId: 'hka',
          displayName: 'HKA v1',
        );
        final module2 = const _MockAnalysisModule(
          moduleId: 'hka',
          displayName: 'HKA v2',
        );

        registry.register(module1);
        registry.register(module2);

        expect(registry.get('hka'), same(module2));
        expect(registry.get('hka')?.displayName, equals('HKA v2'));
      });
    });

    // -----------------------------------------------------------------------
    // all — getter liste complète
    // -----------------------------------------------------------------------

    group('all', () {
      test('retourne liste vide si aucun module enregistré', () {
        expect(registry.all, isEmpty);
      });

      test('retourne tous les modules enregistrés', () {
        final hka =
            const _MockAnalysisModule(moduleId: 'hka', displayName: 'HKA');
        final cobb =
            const _MockAnalysisModule(moduleId: 'cobb', displayName: 'Cobb');

        registry.register(hka);
        registry.register(cobb);

        expect(registry.all, hasLength(2));
        expect(registry.all, containsAll([hka, cobb]));
      });

      test('all reflète un overwrite (last-write-wins)', () {
        final module1 = const _MockAnalysisModule(
          moduleId: 'hka',
          displayName: 'HKA v1',
        );
        final module2 = const _MockAnalysisModule(
          moduleId: 'hka',
          displayName: 'HKA v2',
        );

        registry.register(module1);
        registry.register(module2);

        // Un seul module 'hka' dans la map
        expect(registry.all, hasLength(1));
        expect(registry.all.first, same(module2));
      });
    });

    // -----------------------------------------------------------------------
    // MockAnalysisModule implémente AnalysisModule — AC6
    // -----------------------------------------------------------------------

    group('MockAnalysisModule implémente AnalysisModule — AC6', () {
      test('MockAnalysisModule compile et retourne AnalysisSuccess', () async {
        const module =
            _MockAnalysisModule(moduleId: 'test', displayName: 'Test');
        final result = await module.analyze(XFile('fake.jpg'));

        expect(result, isA<AnalysisSuccess>());
        expect(
          (result as AnalysisSuccess).measurements,
          containsPair('mock', 0.0),
        );
      });
    });
  });
}
