/**
 * Native (Android/iOS) implementation of IDatabase using in-memory Map storage.
 *
 * SQLite native module is disabled for Android 16 compatibility, so we use the
 * same in-memory approach as the web implementation. Persistence via AsyncStorage
 * could be added later if needed.
 */
import { IDatabase, QueryResult } from "./database";
import { matchesWhere } from "./sql-where";

// Active only in local development. Disabled in test and production so that
// patient data (query params, rows) is never written to logs (RGPD).
const DEBUG_DB =
  typeof process !== "undefined" && process.env.NODE_ENV === "development";

function dbLog(...args: unknown[]): void {
  if (DEBUG_DB) {
    // eslint-disable-next-line no-console
    console.log("[NativeDB]", ...args);
  }
}

class NativeDatabase implements IDatabase {
  private tables: Map<string, Record<string, unknown>[]> = new Map();

  async initialize(): Promise<void> {
    // Load persisted data from localStorage if available (web/dev only)
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
          this.tables.set(table, rows);
        }
      }
    } catch {
      // On native, localStorage is not available — silently fall back to in-memory only
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

  private persist(): void {
    try {
      if (typeof localStorage !== "undefined") {
        const data: Record<string, Record<string, unknown>[]> = {};
        for (const [k, v] of this.tables.entries()) {
          data[k] = v;
        }
        localStorage.setItem("bodyorthox_db", JSON.stringify(data));
      }
    } catch {
      // On native, localStorage is not available — silently ignore
    }
  }

  async close(): Promise<void> {
    this.persist();
  }
}

export function createDatabase(_dbName: string): IDatabase {
  return new NativeDatabase();
}
