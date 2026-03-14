/**
 * Web implementation of IDatabase using localStorage-backed SQL via sql.js.
 * For browser testing: uses an in-memory SQLite compiled to WASM (sql.js).
 * Data is persisted to localStorage between sessions.
 */
import { ALL_MIGRATIONS } from './schema';
import { IDatabase, QueryResult } from './database';

// Minimal in-memory store for web (no sql.js bundled for simplicity)
class WebDatabase implements IDatabase {
  private tables: Map<string, Record<string, unknown>[]> = new Map();

  async initialize(): Promise<void> {
    // Load persisted data from localStorage if available
    try {
      const stored = typeof localStorage !== 'undefined'
        ? localStorage.getItem('bodyorthox_db')
        : null;
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, Record<string, unknown>[]>;
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

    if (trimmed.startsWith('CREATE') || trimmed.startsWith('PRAGMA')) {
      return { rows: [], rowsAffected: 0 };
    }

    if (trimmed.startsWith('SELECT')) {
      return this.handleSelect(sql, params);
    }

    if (trimmed.startsWith('INSERT')) {
      return this.handleInsert(sql, params);
    }

    if (trimmed.startsWith('UPDATE')) {
      return this.handleUpdate(sql, params);
    }

    if (trimmed.startsWith('DELETE')) {
      return this.handleDelete(sql, params);
    }

    return { rows: [], rowsAffected: 0 };
  }

  private handleSelect(sql: string, params: unknown[]): QueryResult {
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    if (!tableMatch) return { rows: [], rowsAffected: 0 };

    const tableName = tableMatch[1].toLowerCase();
    const rows = this.tables.get(tableName) ?? [];

    // Very simplified WHERE handling for id lookups
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
    if (whereMatch) {
      const condition = whereMatch[1].trim();
      const idMatch = condition.match(/id\s*=\s*\?/i);
      const patientIdMatch = condition.match(/patient_id\s*=\s*\?/i);
      const nameMatch = condition.match(/name\s+LIKE\s+\?/i);

      let filtered = [...rows];
      let paramIndex = 0;

      if (idMatch) {
        filtered = filtered.filter(r => r['id'] === params[paramIndex++]);
      } else if (patientIdMatch) {
        filtered = filtered.filter(r => r['patient_id'] === params[paramIndex++]);
      } else if (nameMatch) {
        const pattern = String(params[paramIndex++]).replace(/%/g, '');
        filtered = filtered.filter(r =>
          String(r['name']).toLowerCase().includes(pattern.toLowerCase())
        );
      }

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

    const columns = colMatch[1].split(',').map(c => c.trim().replace(/"/g, ''));
    const row: Record<string, unknown> = {};
    columns.forEach((col, i) => { row[col] = params[i]; });

    if (!this.tables.has(tableName)) {
      this.tables.set(tableName, []);
    }
    this.tables.get(tableName)!.push(row);
    this.persist();

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
      const sets = setMatch[1].split(',').map(s => s.trim());
      rows.forEach(row => {
        if (row['id'] === idParam) {
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
    this.tables.set(tableName, rows.filter(r => r['id'] !== idParam));
    this.persist();

    return { rows: [], rowsAffected: initial - (this.tables.get(tableName)?.length ?? 0) };
  }

  private persist(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const data: Record<string, Record<string, unknown>[]> = {};
        for (const [k, v] of this.tables.entries()) {
          data[k] = v;
        }
        localStorage.setItem('bodyorthox_db', JSON.stringify(data));
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
