import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import { ALL_MIGRATIONS } from './schema';
import { IDatabase, QueryResult } from './database';

SQLite.enablePromise(true);

class NativeDatabase implements IDatabase {
  private db: SQLiteDatabase | null = null;

  constructor(private readonly dbName: string) {}

  async initialize(): Promise<void> {
    this.db = await SQLite.openDatabase({ name: this.dbName, location: 'default' });
    for (const migration of ALL_MIGRATIONS) {
      await this.db.executeSql(migration);
    }
  }

  async execute(sql: string, params: unknown[] = []): Promise<QueryResult> {
    if (!this.db) throw new Error('Database not initialized');

    const [result] = await this.db.executeSql(sql, params);
    const rows: Record<string, unknown>[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      rows.push(result.rows.item(i));
    }
    return {
      rows,
      rowsAffected: result.rowsAffected,
      insertId: result.insertId,
    };
  }

  async close(): Promise<void> {
    await this.db?.close();
    this.db = null;
  }
}

export function createDatabase(dbName: string): IDatabase {
  return new NativeDatabase(dbName);
}
