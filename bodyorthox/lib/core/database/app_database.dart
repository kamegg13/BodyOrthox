import 'package:drift/drift.dart';
import 'package:drift/native.dart';

part 'app_database.g.dart';
part 'patients_dao.dart';
part 'analyses_dao.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Tables
// ─────────────────────────────────────────────────────────────────────────────

/// Table patients — clé primaire UUID v4, timestamps ISO 8601 UTC.
/// [Source: docs/planning-artifacts/architecture.md#Architecture-des-données]
class Patients extends Table {
  /// UUID v4 généré côté Dart — jamais auto-increment.
  TextColumn get id => text()();

  /// Nom complet du patient.
  TextColumn get name => text()();

  /// Date de naissance au format ISO 8601 date (`YYYY-MM-DD`).
  TextColumn get dateOfBirth => text()();

  /// Profil morphologique sérialisé en JSON — nullable (renseigné lors de l'analyse).
  TextColumn get morphologicalProfile => text().nullable()();

  /// Horodatage de création UTC — format `DateTime.now().toUtc().toIso8601String()`.
  /// FR30 : obligatoire sur tous les enregistrements.
  TextColumn get createdAt => text()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Table analyses — liée à [Patients] via [patientId], timestamps ISO 8601 UTC.
class Analyses extends Table {
  /// UUID v4.
  TextColumn get id => text()();

  /// Clé étrangère vers [Patients.id].
  TextColumn get patientId => text().references(Patients, #id)();

  /// Angle du genou en degrés (1 décimale).
  RealColumn get kneeAngle => real()();

  /// Angle de la hanche en degrés.
  RealColumn get hipAngle => real()();

  /// Angle de la cheville en degrés.
  RealColumn get ankleAngle => real()();

  /// Score de confiance ML global [0.0 – 1.0].
  RealColumn get confidenceScore => real()();

  /// Vrai si l'expert a corrigé manuellement le résultat ML (Story 3.5).
  BoolColumn get mlCorrected => boolean().withDefault(const Constant(false))();

  /// Articulation corrigée manuellement : 'knee', 'hip' ou 'ankle' (Story 3.5).
  TextColumn get manualCorrectionJoint => text().nullable()();

  /// Horodatage UTC — FR30.
  TextColumn get createdAt => text()();

  @override
  Set<Column> get primaryKey => {id};
}

// ─────────────────────────────────────────────────────────────────────────────
// AppDatabase
// ─────────────────────────────────────────────────────────────────────────────

/// Base de données principale de BodyOrthox.
///
/// Ouverte via [openEncryptedDatabase] dans main_dev.dart / main_prod.dart.
/// Chiffrée AES-256 via SQLCipher + PRAGMA key en production (flavor prod).
/// Toutes les features accèdent aux données via leur Repository, jamais via
/// ce provider directement.
/// [Source: docs/planning-artifacts/architecture.md#Anti-patterns-explicites]
@DriftDatabase(tables: [Patients, Analyses], daos: [PatientsDao, AnalysesDao])
class AppDatabase extends _$AppDatabase {
  AppDatabase(QueryExecutor e) : super(e);

  @override
  int get schemaVersion => 2;

  /// Stratégie de migration MVP : recréation complète des tables lors d'un
  /// changement de schéma.
  ///
  /// WARNING : cette stratégie efface toutes les données existantes lors d'une
  /// mise à jour du schéma. Acceptable en phase de développement (MVP).
  /// Phase 2 : remplacer par des migrations versionnées manuelles.
  /// [Source: docs/planning-artifacts/architecture.md#Gap-important-3-résolu]
  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        onUpgrade: (m, from, to) async {
          // MVP : suppression et recréation complète (tables + index).
          // Les données de développement sont perdues — comportement attendu.
          // Phase 2 : remplacer par des migrations versionnées manuelles.
          //
          // Note : deleteTable suffit — SQLite supprime les index liés automatiquement.
          // createAll() recrée tables ET index (allSchemaEntities).
          for (final table in allTables) {
            await m.deleteTable(table.actualTableName);
          }
          await m.createAll();
        },
      );

  /// Index de performance — OBLIGATOIRES selon NFR-P6 et NFR-C1.
  ///
  /// Déclarés dans [allSchemaEntities] pour qu'ils soient créés à l'[onCreate].
  /// [Source: docs/planning-artifacts/architecture.md#Gap-critique-2-résolu]
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
        patients,
        analyses,
        // Index sur le nom pour la recherche rapide (watchByName)
        Index(
          'idx_patients_name',
          'CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name)',
        ),
        // Index composite pour les requêtes par patient triées par date décroissante
        Index(
          'idx_analyses_patient',
          'CREATE INDEX IF NOT EXISTS idx_analyses_patient ON analyses(patient_id, created_at DESC)',
        ),
      ];
}
