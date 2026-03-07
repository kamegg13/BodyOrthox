import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/config/app_config.dart';
import 'core/database/database_provider.dart';

void main() async {
  // Requis avant tout appel aux plugins Flutter.
  WidgetsFlutterBinding.ensureInitialized();

  // Ouverture de la base chiffrée AES-256 — SQLCipher via PRAGMA key.
  // La clé est lue (ou générée) depuis le Keychain iOS.
  // encrypted: true est forcé — pas de variable de config en prod.
  // [Source: docs/implementation-artifacts/1-3-chiffrement-local-aes-256-isolation-reseau.md#Dev-Notes]
  final db = await openEncryptedDatabase(encrypted: true);

  runApp(
    ProviderScope(
      overrides: [
        databaseProvider.overrideWithValue(db),
      ],
      child: const BodyOrthoxApp(config: AppConfig.prod()),
    ),
  );
}
