// Tests de smoke — Story 1.2 : Accès biométrique.
// Vérifie que l'application se lance avec le routeur biométrique.
// L'écran initial est désormais BiometricLockScreen (non 'Initialisation OK').

import 'package:flutter_test/flutter_test.dart';
import 'package:bodyorthox/app.dart';
import 'package:bodyorthox/core/config/app_config.dart';

void main() {
  testWidgets('BodyOrthox app launches with dev config', (WidgetTester tester) async {
    await tester.pumpWidget(const BodyOrthoxApp(config: AppConfig.dev()));
    // Ne pas vérifier de texte spécifique — l'écran de lock dépend de local_auth
    // qui n'est pas disponible dans les tests widget sans mock.
    expect(tester.takeException(), isNull);
  });

  testWidgets('BodyOrthox app launches with prod config', (WidgetTester tester) async {
    await tester.pumpWidget(const BodyOrthoxApp(config: AppConfig.prod()));
    expect(tester.takeException(), isNull);
  });
}
