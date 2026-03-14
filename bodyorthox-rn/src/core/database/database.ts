/**
 * Abstract database interface.
 * Implementations: native (expo-sqlite), web (localStorage/IndexedDB).
 */
export interface QueryResult {
  rows: Record<string, unknown>[];
  rowsAffected: number;
  insertId?: number;
}

export interface IDatabase {
  initialize(): Promise<void>;
  execute(sql: string, params?: unknown[]): Promise<QueryResult>;
  close(): Promise<void>;
}

// Re-export the platform-specific implementation
export { createDatabase } from './database.native';
