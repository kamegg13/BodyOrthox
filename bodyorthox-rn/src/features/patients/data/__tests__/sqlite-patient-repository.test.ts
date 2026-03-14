import { SqlitePatientRepository } from '../sqlite-patient-repository';
import { IDatabase, QueryResult } from '../../../../core/database/database';

jest.mock('uuid', () => ({ v4: () => 'test-patient-id' }));

function createMockDb(rows: Record<string, unknown>[] = []): IDatabase {
  return {
    initialize: jest.fn().mockResolvedValue(undefined),
    execute: jest.fn().mockResolvedValue({ rows, rowsAffected: rows.length } as QueryResult),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

const mockPatientRow = {
  id: 'test-patient-id',
  name: 'Jean Dupont',
  date_of_birth: '1990-05-15',
  morphological_profile: null,
  created_at: '2024-01-01T00:00:00.000Z',
};

describe('SqlitePatientRepository', () => {
  describe('getAll', () => {
    it('returns all patients mapped from rows', async () => {
      const db = createMockDb([mockPatientRow]);
      const repo = new SqlitePatientRepository(db);

      const patients = await repo.getAll();

      expect(patients).toHaveLength(1);
      expect(patients[0].id).toBe('test-patient-id');
      expect(patients[0].name).toBe('Jean Dupont');
      expect(patients[0].dateOfBirth).toBe('1990-05-15');
      expect(patients[0].morphologicalProfile).toBeNull();
    });

    it('filters by name when nameFilter is provided', async () => {
      const db = createMockDb([mockPatientRow]);
      const repo = new SqlitePatientRepository(db);

      await repo.getAll('Jean');

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('LIKE'),
        ['%Jean%']
      );
    });

    it('returns empty list when no patients', async () => {
      const db = createMockDb([]);
      const repo = new SqlitePatientRepository(db);
      const patients = await repo.getAll();
      expect(patients).toHaveLength(0);
    });

    it('parses morphological profile from JSON', async () => {
      const profileRow = {
        ...mockPatientRow,
        morphological_profile: '{"heightCm":175,"weightKg":70}',
      };
      const db = createMockDb([profileRow]);
      const repo = new SqlitePatientRepository(db);

      const patients = await repo.getAll();

      expect(patients[0].morphologicalProfile).toEqual({ heightCm: 175, weightKg: 70 });
    });
  });

  describe('getById', () => {
    it('returns null when patient not found', async () => {
      const db = createMockDb([]);
      const repo = new SqlitePatientRepository(db);
      const patient = await repo.getById('unknown-id');
      expect(patient).toBeNull();
    });

    it('returns patient when found', async () => {
      const db = createMockDb([mockPatientRow]);
      const repo = new SqlitePatientRepository(db);
      const patient = await repo.getById('test-patient-id');
      expect(patient?.name).toBe('Jean Dupont');
    });
  });

  describe('create', () => {
    it('inserts patient and returns created entity', async () => {
      const db = createMockDb();
      (db.execute as jest.Mock)
        .mockResolvedValueOnce({ rows: [], rowsAffected: 1 });
      const repo = new SqlitePatientRepository(db);

      const patient = await repo.create({ name: 'Jean Dupont', dateOfBirth: '1990-05-15' });

      expect(patient.id).toBe('test-patient-id');
      expect(patient.name).toBe('Jean Dupont');
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining(['test-patient-id', 'Jean Dupont', '1990-05-15'])
      );
    });

    it('throws for invalid patient data', async () => {
      const db = createMockDb();
      const repo = new SqlitePatientRepository(db);
      await expect(repo.create({ name: '', dateOfBirth: '1990-05-15' })).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('throws when patient not found', async () => {
      const db = createMockDb([]);
      const repo = new SqlitePatientRepository(db);
      await expect(repo.update('unknown', { name: 'New Name' })).rejects.toThrow();
    });

    it('updates patient fields', async () => {
      const db = createMockDb([mockPatientRow]);
      (db.execute as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockPatientRow], rowsAffected: 0 }) // getById
        .mockResolvedValueOnce({ rows: [], rowsAffected: 1 }); // update

      const repo = new SqlitePatientRepository(db);
      const updated = await repo.update('test-patient-id', { name: 'Jane Dupont' });

      expect(updated.name).toBe('Jane Dupont');
    });
  });

  describe('delete', () => {
    it('executes DELETE query with correct id', async () => {
      const db = createMockDb();
      const repo = new SqlitePatientRepository(db);

      await repo.delete('test-id');

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        ['test-id']
      );
    });
  });
});
