import 'dart:io';
import 'dart:math';
import 'dart:convert';

import 'package:drift/native.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:meta/meta.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import 'app_database.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes privées
// ─────────────────────────────────────────────────────────────────────────────

const _kDbKeyName = 'db_encryption_key';
const _kDbFileName = 'bodyorthox.db';

// ─────────────────────────────────────────────────────────────────────────────
// Provider Riverpod
// ─────────────────────────────────────────────────────────────────────────────

/// Provider global de la base de données.
///
/// Ce provider DOIT être surchargé via [ProviderScope.overrides] dans
/// main_dev.dart et main_prod.dart. Il ne peut pas être résolu directement.
///
/// Pattern d'initialisation :
/// ```dart
/// final db = await openEncryptedDatabase(encrypted: true);
/// runApp(ProviderScope(
///   overrides: [databaseProvider.overrideWithValue(db)],
///   child: const BodyOrthoxApp(...),
/// ));
/// ```
///
/// INTERDIT : accéder aux DAOs directement depuis un Notifier ou Widget.
/// Utiliser le Repository approprié (Epic 2+).
/// [Source: docs/planning-artifacts/architecture.md#Anti-patterns-explicites]
final databaseProvider = Provider<AppDatabase>((ref) {
  throw UnimplementedError(
    'databaseProvider must be overridden with ProviderScope overrides. '
    'Call openEncryptedDatabase() during app startup and pass the result '
    'via databaseProvider.overrideWithValue(db).',
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Initialisation de la base de données
// ─────────────────────────────────────────────────────────────────────────────

/// Ouvre (ou crée) la base de données BodyOrthox.
///
/// À appeler UNE SEULE FOIS dans [main_dev.dart] ou [main_prod.dart] avant
/// le [ProviderScope].
///
/// Paramètre [encrypted] :
/// - `true` (prod) : SQLCipher AES-256 via PRAGMA key — clé depuis le Keychain.
/// - `false` (dev) : SQLite standard non-chiffré — pour debug avec DB Browser.
///
/// Invariants de sécurité :
/// 1. La clé n'est jamais persistée en dehors du Keychain iOS.
/// 2. La variable locale `key` est déréférencée dès que cette fonction retourne.
/// 3. [NativeDatabase.createInBackground] — jamais [NativeDatabase] sync.
///
/// [Source: docs/planning-artifacts/architecture.md#Gap-critique-1-résolu]
/// Récupère la clé de chiffrement depuis le Keychain, ou en génère une nouvelle.
///
/// Extrait de [openEncryptedDatabase] pour être testable unitairement.
/// [Source: docs/implementation-artifacts/1-3-chiffrement-local-aes-256-isolation-reseau.md#T2]
@visibleForTesting
Future<String> resolveEncryptionKey(
  FlutterSecureStorage storage, {
  String keyName = _kDbKeyName,
}) async {
  String? key = await storage.read(key: keyName);
  if (key == null) {
    final random = Random.secure();
    key = base64Url.encode(List.generate(32, (_) => random.nextInt(256)));
    await storage.write(key: keyName, value: key);
  }
  return key;
}

Future<AppDatabase> openEncryptedDatabase({bool encrypted = true}) async {
  final dbFolder = await getApplicationDocumentsDirectory();
  final file = File(p.join(dbFolder.path, _kDbFileName));

  if (!encrypted) {
    // Flavor dev — base non-chiffrée pour faciliter le debug.
    // Jamais utilisé en production.
    return AppDatabase(
      NativeDatabase.createInBackground(file),
    );
  }

  // ── Récupération ou génération de la clé depuis le Keychain iOS ──────────
  //
  // FlutterSecureStorage utilise le Keychain iOS nativement — 100% offline.
  // accessibility: firstUnlock → la clé est accessible après le premier
  // déverrouillage de l'appareil, même si l'app tourne en background.
  const storage = FlutterSecureStorage(
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock,
    ),
  );

  // resolveEncryptionKey : logique extraite et testée unitairement.
  String key = await resolveEncryptionKey(storage);

  // ── Ouverture en background avec PRAGMA key ───────────────────────────────
  //
  // NativeDatabase.createInBackground : la DB s'ouvre sur un isolate dédié,
  // sans bloquer le UI thread (NFR : temps de démarrage < 2s).
  //
  // SÉCURITÉ : `key` est une variable locale dans cette coroutine.
  // Elle ne doit jamais être stockée dans un champ, un Provider Riverpod,
  // ou un état global.
  // Note : la closure capture `key` pour l'isolate background — elle persiste
  // dans cet isolate pour la durée de vie de NativeDatabase (durée de l'app).
  // Ce comportement est inhérent à l'API createInBackground.
  return AppDatabase(
    NativeDatabase.createInBackground(
      file,
      setup: (rawDb) {
        // PRAGMA key doit être le premier appel après l'ouverture.
        rawDb.execute("PRAGMA key = '$key';");
      },
    ),
  );
}
