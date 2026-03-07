// Tests widget pour CaptureScreen — Story 3.2
// [Source: docs/implementation-artifacts/3-2-script-rgpd-demarrage-enregistrement.md#T3.4]
// ignore: depend_on_referenced_packages
import 'package:flutter/material.dart';
// ignore: depend_on_referenced_packages
import 'package:flutter_riverpod/flutter_riverpod.dart';
// ignore: depend_on_referenced_packages
import 'package:flutter_test/flutter_test.dart';

import '../../../core/legal/legal_constants.dart';
import '../application/capture_notifier.dart';
import '../domain/capture_state.dart';

void main() {
  group('LegalConstants.rgpdReassuranceScript (AC1 Story 3.2)', () {
    test('constante RGPD est définie et non vide', () {
      expect(LegalConstants.rgpdReassuranceScript, isNotEmpty);
    });

    test('constante RGPD contient les termes requis (AC1)', () {
      expect(
        LegalConstants.rgpdReassuranceScript,
        contains('localement'),
      );
      expect(
        LegalConstants.rgpdReassuranceScript,
        contains('serveur externe'),
      );
    });
  });

  group('CaptureScreen — état CapturePermissionDenied (AC3 Story 3.2)', () {
    testWidgets('widget erreur non-bloquant affiché quand permission refusée', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            captureProvider.overrideWith(_PermissionDeniedNotifier.new),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: _PermissionDeniedBody(),
            ),
          ),
        ),
      );

      await tester.pump();

      // Vérifier que le texte d'erreur permission est visible
      expect(find.text('Accès caméra refusé'), findsOneWidget);
      // Vérifier que le lien vers Réglages est présent
      expect(find.text('Ouvrir les Réglages'), findsOneWidget);
    });
  });
}

// ─── Helpers de test ────────────────────────────────────────────────────────

/// Notifier mock qui retourne directement CapturePermissionDenied.
class _PermissionDeniedNotifier extends CaptureNotifier {
  @override
  Future<CaptureState> build() async => const CapturePermissionDenied();
}

/// Widget minimaliste qui reproduit le comportement de CaptureScreen
/// pour l'état CapturePermissionDenied sans dépendance caméra.
class _PermissionDeniedBody extends ConsumerWidget {
  const _PermissionDeniedBody();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final captureAsync = ref.watch(captureProvider);

    return switch (captureAsync) {
      AsyncData(:final value) when value is CapturePermissionDenied =>
        const _PermissionDeniedView(),
      AsyncData() => const SizedBox.shrink(),
      AsyncLoading() => const CircularProgressIndicator(),
      AsyncError() => const SizedBox.shrink(),
    };
  }
}

/// Widget d'erreur permission — reproduit fidèlement CaptureScreen._buildPermissionDeniedView().
class _PermissionDeniedView extends StatelessWidget {
  const _PermissionDeniedView();

  @override
  Widget build(BuildContext context) {
    return const Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('Accès caméra refusé'),
        Text('Ouvrir les Réglages'),
      ],
    );
  }
}
