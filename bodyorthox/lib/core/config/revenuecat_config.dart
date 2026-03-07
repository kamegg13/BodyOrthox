import 'app_config.dart';

/// Configuration RevenueCat — clés API par flavor.
/// [Source: docs/planning-artifacts/architecture.md#Infrastructure-Déploiement]
abstract class RevenueCatConfig {
  /// Retourne la clé API RevenueCat appropriée selon le flavor.
  static String apiKey(AppConfig config) => config.revenueCatApiKey;

  /// Identifiant du produit abonnement mensuel (~49€/mois).
  static const String monthlySubscriptionId = 'bodyorthox_pro_monthly';

  /// Entitlement RevenueCat pour l'accès Pro.
  static const String proEntitlement = 'pro';
}
