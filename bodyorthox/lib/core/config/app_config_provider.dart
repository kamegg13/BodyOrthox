import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app_config.dart';

/// Provider global pour AppConfig — accessible depuis n'importe quelle feature via ref.
/// Initialisé au lancement via ProviderScope overrides dans main_dev.dart / main_prod.dart.
///
/// Usage dans les features :
/// ```dart
/// final config = ref.read(appConfigProvider);
/// if (config.useEncryptedDatabase) { ... }
/// ```
///
/// [Source: docs/planning-artifacts/architecture.md#Riverpod-règles-de-scoping]
/// Providers globaux : uniquement dans core/.
final appConfigProvider = Provider<AppConfig>(
  (ref) => throw UnimplementedError(
    'appConfigProvider must be overridden in ProviderScope. '
    'Use ProviderScope(overrides: [appConfigProvider.overrideWithValue(config)])',
  ),
);
