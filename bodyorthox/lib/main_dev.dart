import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/config/app_config.dart';
import 'core/database/database_provider.dart';

void main() async {
  // Requis avant tout appel aux plugins Flutter (path_provider,
  // flutter_secure_storage, etc.)
  WidgetsFlutterBinding.ensureInitialized();

  // Ouverture de la base — non-chiffrée en dev pour faciliter le debug
  // avec DB Browser for SQLite.
  // [Source: docs/implementation-artifacts/1-3-chiffrement-local-aes-256-isolation-reseau.md#Dev-Notes]
  const config = AppConfig.dev();
  final db = await openEncryptedDatabase(
    encrypted: config.useEncryptedDatabase, // false en dev
  );

  runApp(
    ProviderScope(
      overrides: [
        // Injection de la base ouverte — pattern obligatoire.
        // Ne jamais laisser databaseProvider se résoudre lui-même.
        databaseProvider.overrideWithValue(db),
      ],
      child: const BodyOrthoxApp(config: config),
    ),
  );
}
