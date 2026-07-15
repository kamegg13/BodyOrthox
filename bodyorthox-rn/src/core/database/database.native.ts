/**
 * Implémentation native (Android/iOS) de IDatabase sur op-sqlite — vrai
 * SQLite persistant, chiffrable via SQLCipher (voir `package.json#op-sqlite`).
 *
 * Remplace l'ancien shim Map en mémoire (conservé côté web uniquement,
 * `database.web.ts`) qui n'offrait AUCUNE persistance sur natif : c'était le
 * bloqueur du mode on-device pur (décision du 2026-07-15 : données de santé
 * stockées uniquement sur l'appareil, pas d'hébergement HDS).
 *
 * Migrations : un vrai SQLite rejette les `ALTER TABLE ADD COLUMN` rejoués
 * (« duplicate column ») — contrairement au shim qui ignorait le DDL. On
 * versionne donc via `PRAGMA user_version` = nombre de migrations appliquées.
 * Corollaire : `ALL_MIGRATIONS` est APPEND-ONLY (voir schema.ts).
 */
import { open, DB, Scalar } from "@op-engineering/op-sqlite";
import { IDatabase, QueryResult } from "./database";
import { ALL_MIGRATIONS } from "./schema";
import { getOrCreateEncryptionKey } from "./encryption-key";

export interface CreateDatabaseOptions {
  /** Chiffre la base au repos (SQLCipher, clé en Keychain/Keystore). */
  readonly encrypted?: boolean;
}

async function runPendingMigrations(db: DB): Promise<void> {
  const versionResult = await db.execute("PRAGMA user_version");
  const applied = Number(
    (versionResult.rows?.[0] as { user_version?: number })?.user_version ?? 0,
  );

  if (applied >= ALL_MIGRATIONS.length) return;

  for (const migration of ALL_MIGRATIONS.slice(applied)) {
    await db.execute(migration);
  }
  await db.execute(`PRAGMA user_version = ${ALL_MIGRATIONS.length}`);
}

class NativeDatabase implements IDatabase {
  private db: DB | null = null;

  constructor(
    private readonly name: string,
    private readonly encrypted: boolean,
  ) {}

  async initialize(): Promise<void> {
    if (this.db) return;

    const db = this.encrypted
      ? open({
          name: this.name,
          encryptionKey: await getOrCreateEncryptionKey(),
        })
      : open({ name: this.name });

    // Par connexion (pas une migration) : requis pour honorer les
    // `ON DELETE CASCADE` du schéma.
    await db.execute("PRAGMA foreign_keys = ON");
    await runPendingMigrations(db);

    this.db = db;
  }

  async execute(sql: string, params: unknown[] = []): Promise<QueryResult> {
    if (!this.db) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    const result = await this.db.execute(sql, params as Scalar[]);
    return {
      rows: (result.rows ?? []) as Record<string, unknown>[],
      rowsAffected: result.rowsAffected ?? 0,
      ...(result.insertId != null ? { insertId: result.insertId } : {}),
    };
  }

  async close(): Promise<void> {
    this.db?.close();
    this.db = null;
  }
}

export function createDatabase(
  dbName: string,
  options?: CreateDatabaseOptions,
): IDatabase {
  return new NativeDatabase(dbName, options?.encrypted ?? false);
}
