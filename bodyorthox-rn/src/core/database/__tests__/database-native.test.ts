/**
 * Adaptateur SQLite natif réel (op-sqlite) — remplace l'ancien shim Map en
 * mémoire. Les chemins SQL du shim restent couverts par database-web.test.ts
 * (le web conserve le shim localStorage).
 *
 * Couvre : ouverture (avec/sans clé SQLCipher), migrations versionnées via
 * PRAGMA user_version (idempotence — les ALTER TABLE ne doivent jamais être
 * rejoués sur un vrai SQLite), mapping des résultats, cycle de vie.
 */
import { open } from "@op-engineering/op-sqlite";
import { createDatabase } from "../database.native";
import { ALL_MIGRATIONS } from "../schema";
import { getOrCreateEncryptionKey } from "../encryption-key";

jest.mock("@op-engineering/op-sqlite", () => ({ open: jest.fn() }));
jest.mock("../encryption-key", () => ({
  getOrCreateEncryptionKey: jest.fn().mockResolvedValue("f".repeat(64)),
}));

const mockedOpen = jest.mocked(open);
const mockedGetKey = jest.mocked(getOrCreateEncryptionKey);

interface MockDb {
  execute: jest.Mock;
  close: jest.Mock;
}

/** Simule une base op-sqlite dont PRAGMA user_version vaut `userVersion`. */
function mockOpSqliteDb(userVersion = 0): MockDb {
  const execute = jest.fn(async (sql: string) => {
    const trimmed = sql.trim();
    if (/^PRAGMA user_version$/i.test(trimmed)) {
      return { rows: [{ user_version: userVersion }], rowsAffected: 0 };
    }
    return { rows: [], rowsAffected: 0 };
  });
  return { execute, close: jest.fn() };
}

function migrationCalls(db: MockDb): string[] {
  return db.execute.mock.calls
    .map(([sql]: [string]) => sql)
    .filter((sql) => ALL_MIGRATIONS.includes(sql));
}

describe("NativeDatabase (op-sqlite)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ouvre la base avec le nom fourni, sans clé quand non chiffrée", async () => {
    const db = mockOpSqliteDb();
    mockedOpen.mockReturnValueOnce(db as never);

    await createDatabase("bodyorthox_dev.db").initialize();

    expect(mockedOpen).toHaveBeenCalledWith({ name: "bodyorthox_dev.db" });
    expect(mockedGetKey).not.toHaveBeenCalled();
  });

  it("ouvre la base avec la clé Keychain quand le chiffrement est activé", async () => {
    const db = mockOpSqliteDb();
    mockedOpen.mockReturnValueOnce(db as never);

    await createDatabase("bodyorthox.db", { encrypted: true }).initialize();

    expect(mockedGetKey).toHaveBeenCalled();
    expect(mockedOpen).toHaveBeenCalledWith({
      name: "bodyorthox.db",
      encryptionKey: "f".repeat(64),
    });
  });

  it("exécute toutes les migrations sur une base vierge puis fixe user_version", async () => {
    const db = mockOpSqliteDb(0);
    mockedOpen.mockReturnValueOnce(db as never);

    await createDatabase("test.db").initialize();

    expect(migrationCalls(db)).toEqual(ALL_MIGRATIONS);
    expect(db.execute).toHaveBeenCalledWith(
      `PRAGMA user_version = ${ALL_MIGRATIONS.length}`,
    );
  });

  it("ne rejoue aucune migration quand user_version est à jour", async () => {
    const db = mockOpSqliteDb(ALL_MIGRATIONS.length);
    mockedOpen.mockReturnValueOnce(db as never);

    await createDatabase("test.db").initialize();

    expect(migrationCalls(db)).toEqual([]);
    // user_version ne doit pas être réécrit inutilement.
    expect(db.execute).not.toHaveBeenCalledWith(
      `PRAGMA user_version = ${ALL_MIGRATIONS.length}`,
    );
  });

  it("rejoue uniquement les migrations manquantes (idempotence des ALTER TABLE)", async () => {
    const db = mockOpSqliteDb(ALL_MIGRATIONS.length - 2);
    mockedOpen.mockReturnValueOnce(db as never);

    await createDatabase("test.db").initialize();

    expect(migrationCalls(db)).toEqual(ALL_MIGRATIONS.slice(-2));
  });

  it("active les clés étrangères sur la connexion", async () => {
    const db = mockOpSqliteDb();
    mockedOpen.mockReturnValueOnce(db as never);

    await createDatabase("test.db").initialize();

    expect(db.execute).toHaveBeenCalledWith("PRAGMA foreign_keys = ON");
  });

  it("mappe rows / rowsAffected / insertId vers QueryResult", async () => {
    const db = mockOpSqliteDb();
    mockedOpen.mockReturnValueOnce(db as never);
    const database = createDatabase("test.db");
    await database.initialize();
    // Après initialize() : le mockResolvedValueOnce ne doit pas être consommé
    // par les PRAGMA/migrations de l'ouverture.
    db.execute.mockResolvedValueOnce({
      rows: [{ id: "p1" }],
      rowsAffected: 1,
      insertId: 7,
    });

    const result = await database.execute("SELECT * FROM patients WHERE id = ?", [
      "p1",
    ]);

    expect(result.rows).toEqual([{ id: "p1" }]);
    expect(result.rowsAffected).toBe(1);
    expect(result.insertId).toBe(7);
    expect(db.execute).toHaveBeenCalledWith(
      "SELECT * FROM patients WHERE id = ?",
      ["p1"],
    );
  });

  it("refuse execute() avant initialize()", async () => {
    await expect(
      createDatabase("test.db").execute("SELECT 1"),
    ).rejects.toThrow(/not initialized/i);
  });

  it("initialize() est idempotent (une seule ouverture)", async () => {
    const db = mockOpSqliteDb();
    mockedOpen.mockReturnValue(db as never);
    const database = createDatabase("test.db");

    await database.initialize();
    await database.initialize();

    expect(mockedOpen).toHaveBeenCalledTimes(1);
  });

  it("close() ferme la connexion op-sqlite", async () => {
    const db = mockOpSqliteDb();
    mockedOpen.mockReturnValueOnce(db as never);
    const database = createDatabase("test.db");
    await database.initialize();

    await database.close();

    expect(db.close).toHaveBeenCalled();
  });
});
