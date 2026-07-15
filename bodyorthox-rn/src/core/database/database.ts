/**
 * Abstract database interface.
 * Implementations: native (op-sqlite, persistant + SQLCipher optionnel),
 * web (shim localStorage — dev uniquement).
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

// Re-export pour TypeScript : à l'exécution, Metro résout `./database` vers
// database.native.ts et webpack vers database.web.ts (même pattern que
// pose-detector) — ce fichier n'est jamais chargé au runtime, le bundle web
// ne contient donc pas op-sqlite.
export { createDatabase } from './database.native';
