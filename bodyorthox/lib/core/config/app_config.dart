/// Configuration flavor-aware — dev vs prod.
/// [Source: docs/planning-artifacts/architecture.md#Infrastructure-Déploiement]
abstract interface class AppConfig {
  bool get isProduction;
  String get revenueCatApiKey;
  bool get enableMlLogging;

  /// En dev : SQLite non-chiffré pour faciliter le debug.
  /// En prod : SQLCipher AES-256 (activé en Story 1.3).
  bool get useEncryptedDatabase;

  const factory AppConfig.dev() = _DevConfig;
  const factory AppConfig.prod() = _ProdConfig;
}

class _DevConfig implements AppConfig {
  const _DevConfig();

  @override
  bool get isProduction => false;

  @override
  String get revenueCatApiKey => 'REVENUECAT_SANDBOX_KEY';

  @override
  bool get enableMlLogging => true;

  @override
  bool get useEncryptedDatabase => false;
}

class _ProdConfig implements AppConfig {
  const _ProdConfig();

  @override
  bool get isProduction => true;

  @override
  String get revenueCatApiKey => 'REVENUECAT_PROD_KEY';

  @override
  bool get enableMlLogging => false;

  @override
  bool get useEncryptedDatabase => true;
}
