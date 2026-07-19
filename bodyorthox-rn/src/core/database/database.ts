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

/** Poignée passée au callback de `IDatabase.transaction` — mêmes requêtes que `IDatabase`, sans `initialize`/`close`. */
export interface ITransaction {
  execute(sql: string, params?: unknown[]): Promise<QueryResult>;
}

export interface IDatabase {
  initialize(): Promise<void>;
  execute(sql: string, params?: unknown[]): Promise<QueryResult>;
  /**
   * Exécute `fn` de façon atomique : si `fn` lève, TOUTES les requêtes émises
   * via `tx.execute()` sont annulées (rollback), sur natif comme sur web.
   * Utilisé pour les suppressions RGPD multi-tables (art. 17) où une
   * suppression partielle silencieuse est inacceptable.
   */
  transaction(fn: (tx: ITransaction) => Promise<void>): Promise<void>;
  close(): Promise<void>;
}

// Re-export pour TypeScript : à l'exécution, Metro résout `./database` vers
// database.native.ts et webpack vers database.web.ts (même pattern que
// pose-detector) — ce fichier n'est jamais chargé au runtime, le bundle web
// ne contient donc pas op-sqlite.
export { createDatabase } from './database.native';
