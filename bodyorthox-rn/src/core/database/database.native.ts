import * as SQLite from 'expo-sqlite';
import { ALL_MIGRATIONS } from './schema';
import { IDatabase, QueryResult } from './database';

class NativeDatabase implements IDatabase {
  private db: SQLite.SQLiteDatabase | null = null;

  constructor(private readonly dbName: string) {}

  async initialize(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync(this.dbName);
    await this.db.execAsync('PRAGMA journal_mode = WAL;');
    await this.db.execAsync('PRAGMA foreign_keys = ON;');
    for (const migration of ALL_MIGRATIONS) {
      await this.db.execAsync(migration);
    }
  }

  async execute(sql: string, params: unknown[] = []): Promise<QueryResult> {
    if (!this.db) throw new Error('Database not initialized');

    const trimmed = sql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT')) {
      const rows = await this.db.getAllAsync(sql, params);
      return { rows: rows as Record<string, unknown>[], rowsAffected: 0 };
    } else {
      const result = await this.db.runAsync(sql, params);
      return {
        rows: [],
        rowsAffected: result.changes,
        insertId: result.lastInsertRowId,
      };
    }
  }

  async close(): Promise<void> {
    await this.db?.closeAsync();
    this.db = null;
  }
}

export function createDatabase(dbName: string): IDatabase {
  return new NativeDatabase(dbName);
}
