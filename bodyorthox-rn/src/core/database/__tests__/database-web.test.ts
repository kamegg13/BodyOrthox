/**
 * Tests for the web database implementation.
 * Uses the in-memory localStorage-backed store.
 */

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

import { createDatabase } from '../database.web';
import { ALL_MIGRATIONS } from '../schema';

describe('WebDatabase', () => {
  let db: ReturnType<typeof createDatabase>;

  beforeEach(async () => {
    localStorageMock.clear();
    db = createDatabase('test.db');
    await db.initialize();
  });

  afterEach(async () => {
    await db.close();
  });

  describe('initialize', () => {
    it('initializes without error', async () => {
      const freshDb = createDatabase('fresh.db');
      await expect(freshDb.initialize()).resolves.not.toThrow();
    });
  });

  describe('execute', () => {
    it('handles CREATE TABLE statements', async () => {
      const result = await db.execute('CREATE TABLE IF NOT EXISTS test (id TEXT)');
      expect(result.rows).toHaveLength(0);
    });

    it('handles PRAGMA statements', async () => {
      const result = await db.execute('PRAGMA journal_mode = WAL');
      expect(result).toBeDefined();
    });

    it('inserts rows', async () => {
      await db.execute(
        'INSERT INTO patients (id, name, date_of_birth, morphological_profile, created_at) VALUES (?, ?, ?, ?, ?)',
        ['p1', 'Jean', '1990-01-01', null, '2024-01-01T00:00:00Z']
      );

      const result = await db.execute('SELECT * FROM patients');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]['id']).toBe('p1');
      expect(result.rows[0]['name']).toBe('Jean');
    });

    it('selects rows with id filter', async () => {
      await db.execute(
        'INSERT INTO patients (id, name, date_of_birth, morphological_profile, created_at) VALUES (?, ?, ?, ?, ?)',
        ['p1', 'Jean', '1990-01-01', null, '2024-01-01T00:00:00Z']
      );
      await db.execute(
        'INSERT INTO patients (id, name, date_of_birth, morphological_profile, created_at) VALUES (?, ?, ?, ?, ?)',
        ['p2', 'Marie', '1985-06-15', null, '2024-01-01T00:00:00Z']
      );

      const result = await db.execute('SELECT * FROM patients WHERE id = ?', ['p1']);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]['name']).toBe('Jean');
    });

    it('selects rows with LIKE name filter', async () => {
      await db.execute(
        'INSERT INTO patients (id, name, date_of_birth, morphological_profile, created_at) VALUES (?, ?, ?, ?, ?)',
        ['p1', 'Jean Dupont', '1990-01-01', null, '2024-01-01T00:00:00Z']
      );
      await db.execute(
        'INSERT INTO patients (id, name, date_of_birth, morphological_profile, created_at) VALUES (?, ?, ?, ?, ?)',
        ['p2', 'Marie Martin', '1985-06-15', null, '2024-01-01T00:00:00Z']
      );

      const result = await db.execute(
        'SELECT * FROM patients WHERE name LIKE ?',
        ['%jean%']
      );
      expect(result.rows).toHaveLength(1);
    });

    it('updates rows', async () => {
      await db.execute(
        'INSERT INTO patients (id, name, date_of_birth, morphological_profile, created_at) VALUES (?, ?, ?, ?, ?)',
        ['p1', 'Jean', '1990-01-01', null, '2024-01-01T00:00:00Z']
      );

      await db.execute(
        'UPDATE patients SET name = ? WHERE id = ?',
        ['Jean Updated', 'p1']
      );

      const result = await db.execute('SELECT * FROM patients WHERE id = ?', ['p1']);
      expect(result.rows[0]['name']).toBe('Jean Updated');
    });

    it('deletes rows', async () => {
      await db.execute(
        'INSERT INTO patients (id, name, date_of_birth, morphological_profile, created_at) VALUES (?, ?, ?, ?, ?)',
        ['p1', 'Jean', '1990-01-01', null, '2024-01-01T00:00:00Z']
      );

      await db.execute('DELETE FROM patients WHERE id = ?', ['p1']);

      const result = await db.execute('SELECT * FROM patients');
      expect(result.rows).toHaveLength(0);
    });

    it('persists data to localStorage on close', async () => {
      await db.execute(
        'INSERT INTO patients (id, name, date_of_birth, morphological_profile, created_at) VALUES (?, ?, ?, ?, ?)',
        ['p1', 'Jean', '1990-01-01', null, '2024-01-01T00:00:00Z']
      );
      await db.close();

      expect(localStorageMock.getItem('bodyorthox_db')).not.toBeNull();
    });
  });
});
