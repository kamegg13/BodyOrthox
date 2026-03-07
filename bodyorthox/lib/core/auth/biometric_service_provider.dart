import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'biometric_service.dart';
import 'local_auth_biometric_service.dart';

/// Provider du service biométrique.
///
/// Séparé de [auth_provider.dart] pour éviter la dépendance circulaire :
/// biometric_notifier → biometric_service_provider → (pas de notifier)
/// auth_provider → biometric_notifier + biometric_service_provider
///
/// Retourne [LocalAuthBiometricService] en production.
/// Overridable dans les tests via ProviderContainer overrides.
///
/// RÈGLE : Ce provider est déclaré UNIQUEMENT dans core/ — jamais dans les features.
/// [Source: docs/planning-artifacts/architecture.md#Riverpod-règles-de-scoping]
final biometricServiceProvider = Provider<BiometricService>((ref) {
  return LocalAuthBiometricService();
});
