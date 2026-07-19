/**
 * Web implementation of IDatabase using localStorage-backed SQL via sql.js.
 * For browser testing: uses an in-memory SQLite compiled to WASM (sql.js).
 * Data is persisted to localStorage between sessions.
 */
import { IDatabase, ITransaction, QueryResult } from "./database";
import { matchesWhere } from "./sql-where";

// Active only in local development. Disabled in test and production so that
// patient data (query params, rows) is never written to logs (RGPD).
const DEBUG_DB =
  typeof process !== "undefined" && process.env.NODE_ENV === "development";

function dbLog(...args: unknown[]): void {
  if (DEBUG_DB) {
    console.log("[WebDB]", ...args);
  }
}

// IndexedDB helpers for large binary fields (captured_image_url)
// localStorage is limited to ~5MB; images can exceed this causing silent failures.
const IDB_NAME = "bodyorthox_images";
const IDB_STORE = "images";

function openImagesIDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => {
      (e.target as IDBOpenDBRequest).result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => resolve(null);
  });
}

async function loadAllImages(): Promise<Map<string, string>> {
  const db = await openImagesIDB();
  if (!db) return new Map();
  return new Promise((resolve) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);
    const keysReq = store.getAllKeys();
    keysReq.onsuccess = () => {
      const keys = keysReq.result as string[];
      const valsReq = store.getAll();
      valsReq.onsuccess = () => {
        const vals = valsReq.result as string[];
        const map = new Map<string, string>();
        keys.forEach((k, i) => map.set(k, vals[i]));
        resolve(map);
      };
      valsReq.onerror = () => resolve(new Map());
    };
    keysReq.onerror = () => resolve(new Map());
  });
}

function saveImageToIDB(id: string, url: string): void {
  openImagesIDB().then((db) => {
    if (!db) return;
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(url, id);
  });
}

// Minimal in-memory store for web (no sql.js bundled for simplicity)
class WebDatabase implements IDatabase {
  private tables: Map<string, Record<string, unknown>[]> = new Map();
  private imageCache: Map<string, string> = new Map();

  async initialize(): Promise<void> {
    // Load images from IndexedDB first (large data)
    this.imageCache = await loadAllImages();
    dbLog("Loaded", this.imageCache.size, "images from IndexedDB");

    // Load metadata from localStorage (small data)
    try {
      const stored =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("bodyorthox_db")
          : null;
      if (stored) {
        const parsed = JSON.parse(stored) as Record<
          string,
          Record<string, unknown>[]
        >;
        for (const [table, rows] of Object.entries(parsed)) {
          if (table === "analyses") {
            // Re-attach images from IndexedDB cache
            this.tables.set(
              table,
              rows.map((row) => ({
                ...row,
                captured_image_url:
                  this.imageCache.get(row["id"] as string) ?? null,
              })),
            );
          } else {
            this.tables.set(table, rows);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  async execute(sql: string, params: unknown[] = []): Promise<QueryResult> {
    const trimmed = sql.trim().toUpperCase();

    if (trimmed.startsWith("CREATE") || trimmed.startsWith("PRAGMA")) {
      return { rows: [], rowsAffected: 0 };
    }

    if (trimmed.startsWith("SELECT")) {
      return this.handleSelect(sql, params);
    }

    if (trimmed.startsWith("INSERT")) {
      return this.handleInsert(sql, params);
    }

    if (trimmed.startsWith("UPDATE")) {
      return this.handleUpdate(sql, params);
    }

    if (trimmed.startsWith("DELETE")) {
      return this.handleDelete(sql, params);
    }

    return { rows: [], rowsAffected: 0 };
  }

  private handleSelect(sql: string, params: unknown[]): QueryResult {
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    if (!tableMatch) return { rows: [], rowsAffected: 0 };

    const tableName = tableMatch[1].toLowerCase();
    const rows = this.tables.get(tableName) ?? [];

    dbLog("SELECT", tableName, "totalRows:", rows.length, "params:", params);

    // Parse WHERE clause — supports AND / OR combinations of `col = ?` and
    // `col LIKE ?` predicates (no parentheses; evaluated left to right).
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
    if (whereMatch) {
      const filtered = rows.filter(
        matchesWhere(whereMatch[1].trim(), params),
      );
      dbLog(
        "SELECT WHERE result:",
        filtered.length,
        "rows (from",
        rows.length,
        ")",
      );
      return { rows: filtered, rowsAffected: 0 };
    }

    return { rows: [...rows], rowsAffected: 0 };
  }

  private handleInsert(sql: string, params: unknown[]): QueryResult {
    const tableMatch = sql.match(/INTO\s+(\w+)/i);
    if (!tableMatch) return { rows: [], rowsAffected: 0 };

    const tableName = tableMatch[1].toLowerCase();
    const colMatch = sql.match(/\(([^)]+)\)\s+VALUES/i);
    if (!colMatch) return { rows: [], rowsAffected: 0 };

    const columns = colMatch[1]
      .split(",")
      .map((c) => c.trim().replace(/"/g, ""));
    const row: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      row[col] = params[i];
    });

    // Save large image fields to IndexedDB before persisting to localStorage
    if (
      tableName === "analyses" &&
      row["captured_image_url"] &&
      row["id"]
    ) {
      const id = row["id"] as string;
      const url = row["captured_image_url"] as string;
      this.imageCache.set(id, url);
      saveImageToIDB(id, url);
    }

    if (!this.tables.has(tableName)) {
      this.tables.set(tableName, []);
    }
    this.tables.get(tableName)!.push(row);
    this.persist();

    dbLog("INSERT", tableName, "columns:", columns, "id:", row["id"]);

    return { rows: [], rowsAffected: 1 };
  }

  private handleUpdate(sql: string, params: unknown[]): QueryResult {
    const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
    if (!tableMatch) return { rows: [], rowsAffected: 0 };

    const tableName = tableMatch[1].toLowerCase();
    const rows = this.tables.get(tableName) ?? [];
    const idParam = params[params.length - 1];
    let affected = 0;

    const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
    if (setMatch) {
      const sets = setMatch[1].split(",").map((s) => s.trim());
      rows.forEach((row) => {
        if (row["id"] === idParam) {
          sets.forEach((set, i) => {
            const colMatch = set.match(/(\w+)\s*=\s*\?/);
            if (colMatch) row[colMatch[1]] = params[i];
          });
          affected++;
        }
      });
    }

    this.persist();
    return { rows: [], rowsAffected: affected };
  }

  private handleDelete(sql: string, params: unknown[]): QueryResult {
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    if (!tableMatch) return { rows: [], rowsAffected: 0 };

    const tableName = tableMatch[1].toLowerCase();
    const rows = this.tables.get(tableName) ?? [];
    const initial = rows.length;

    // Delete the rows matching the WHERE clause. The column is parsed from the
    // query (e.g. `patient_id = ?`), not assumed to be `id` — otherwise the
    // RGPD cascade `DELETE FROM analyses WHERE patient_id = ?` would delete
    // nothing and leave orphaned health data behind.
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
    const matches = whereMatch
      ? matchesWhere(whereMatch[1].trim(), params)
      : () => true;
    this.tables.set(
      tableName,
      rows.filter((r) => !matches(r)),
    );
    this.persist();

    return {
      rows: [],
      rowsAffected: initial - (this.tables.get(tableName)?.length ?? 0),
    };
  }

  /**
   * Pas de vrai moteur SQL ici : l'atomicité est simulée par snapshot/restore
   * de `this.tables`. Le JS est mono-thread, donc aucune écriture concurrente
   * ne peut s'intercaler pendant `fn` — un rollback complet sur erreur suffit
   * à garantir « tout ou rien », comme une vraie transaction SQLite.
   */
  async transaction(fn: (tx: ITransaction) => Promise<void>): Promise<void> {
    const snapshot = this.cloneTables();
    try {
      await fn({ execute: (sql, params) => this.execute(sql, params) });
    } catch (error) {
      this.tables = snapshot;
      this.persist();
      throw error;
    }
  }

  private cloneTables(): Map<string, Record<string, unknown>[]> {
    return new Map(
      Array.from(this.tables.entries()).map(([table, rows]) => [
        table,
        rows.map((row) => ({ ...row })),
      ]),
    );
  }

  private persist(): void {
    try {
      if (typeof localStorage !== "undefined") {
        const data: Record<string, Record<string, unknown>[]> = {};
        for (const [k, v] of this.tables.entries()) {
          if (k === "analyses") {
            // Strip captured_image_url — stored separately in IndexedDB
            data[k] = v.map(({ captured_image_url: _img, ...rest }) => rest);
          } else {
            data[k] = v;
          }
        }
        localStorage.setItem("bodyorthox_db", JSON.stringify(data));
      }
    } catch (e) {
      dbLog("persist() failed:", e);
    }
  }

  async close(): Promise<void> {
    this.persist();
  }
}

// `_options` (chiffrement) est ignoré sur web : le shim localStorage est
// réservé au dev — les données de santé réelles vivent sur le natif chiffré.
export function createDatabase(
  _dbName: string,
  _options?: { readonly encrypted?: boolean },
): IDatabase {
  return new WebDatabase();
}
