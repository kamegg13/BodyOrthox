/**
 * Web implementation of IDatabase using localStorage-backed SQL via sql.js.
 * For browser testing: uses an in-memory SQLite compiled to WASM (sql.js).
 * Data is persisted to localStorage between sessions.
 */
import { IDatabase, QueryResult } from "./database";

const DEBUG_DB =
  typeof process !== "undefined" ? process.env.NODE_ENV !== "test" : true;

function dbLog(...args: unknown[]): void {
  if (DEBUG_DB) {
    // eslint-disable-next-line no-console
    console.log("[WebDB]", ...args);
  }
}

// Minimal in-memory store for web (no sql.js bundled for simplicity)
class WebDatabase implements IDatabase {
  private tables: Map<string, Record<string, unknown>[]> = new Map();

  async initialize(): Promise<void> {
    // Load persisted data from localStorage if available
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

    // Parse WHERE clause — supports multiple AND conditions
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
    if (whereMatch) {
      const condition = whereMatch[1].trim();
      // Split on AND to support compound conditions
      const clauses = condition.split(/\s+AND\s+/i);
      let filtered = [...rows];
      let paramIndex = 0;

      for (const clause of clauses) {
        const trimmedClause = clause.trim();

        // Match column_name = ? (use full word boundary to avoid partial matches)
        const eqMatch = trimmedClause.match(/^(\w+)\s*=\s*\?$/i);
        if (eqMatch) {
          const col = eqMatch[1];
          const val = params[paramIndex++];
          filtered = filtered.filter((r) => r[col] === val);
          continue;
        }

        // Match column_name LIKE ?
        const likeMatch = trimmedClause.match(/^(\w+)\s+LIKE\s+\?$/i);
        if (likeMatch) {
          const col = likeMatch[1];
          const pattern = String(params[paramIndex++]).replace(/%/g, "");
          filtered = filtered.filter((r) =>
            String(r[col]).toLowerCase().includes(pattern.toLowerCase()),
          );
          continue;
        }

        // Unrecognized clause — skip param placeholder if present
        if (trimmedClause.includes("?")) {
          paramIndex++;
        }
      }

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
    const idParam = params[0];
    const initial = rows.length;
    this.tables.set(
      tableName,
      rows.filter((r) => r["id"] !== idParam),
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
      // ignore quota errors
    }
  }

  async close(): Promise<void> {
    this.persist();
  }
}

export function createDatabase(_dbName: string): IDatabase {
  return new WebDatabase();
}
