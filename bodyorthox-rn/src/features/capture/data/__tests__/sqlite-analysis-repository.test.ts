import { SqliteAnalysisRepository } from '../sqlite-analysis-repository';
import { IDatabase, QueryResult } from '../../../../core/database/database';

jest.mock('uuid', () => ({ v4: () => 'mock-analysis-id' }));

function createMockDb(rows: Record<string, unknown>[] = []): IDatabase {
  return {
    initialize: jest.fn().mockResolvedValue(undefined),
    execute: jest.fn().mockResolvedValue({ rows, rowsAffected: 0 } as QueryResult),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

const mockRow = {
  id: 'mock-analysis-id',
  patient_id: 'p1',
  knee_angle: 175.0,
  hip_angle: 178.0,
  ankle_angle: 90.5,
  confidence_score: 0.92,
  ml_corrected: 0,
  manual_correction_joint: null,
  created_at: '2024-01-01T00:00:00Z',
};

describe('SqliteAnalysisRepository', () => {
  describe('getForPatient', () => {
    it('returns analyses for a patient', async () => {
      const db = createMockDb([mockRow]);
      const repo = new SqliteAnalysisRepository(db);

      const analyses = await repo.getForPatient('p1');

      expect(analyses).toHaveLength(1);
      expect(analyses[0].patientId).toBe('p1');
      expect(analyses[0].angles.kneeAngle).toBe(175.0);
      expect(analyses[0].confidenceScore).toBe(0.92);
    });

    it('maps ml_corrected integer to boolean', async () => {
      const correctedRow = { ...mockRow, ml_corrected: 1, manual_correction_joint: 'knee' };
      const db = createMockDb([correctedRow]);
      const repo = new SqliteAnalysisRepository(db);

      const analyses = await repo.getForPatient('p1');

      expect(analyses[0].manualCorrectionApplied).toBe(true);
      expect(analyses[0].manualCorrectionJoint).toBe('knee');
    });

    it('returns empty array when no analyses', async () => {
      const db = createMockDb([]);
      const repo = new SqliteAnalysisRepository(db);

      const analyses = await repo.getForPatient('p1');
      expect(analyses).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('returns null when not found', async () => {
      const db = createMockDb([]);
      const repo = new SqliteAnalysisRepository(db);

      const analysis = await repo.getById('unknown');
      expect(analysis).toBeNull();
    });

    it('returns analysis when found', async () => {
      const db = createMockDb([mockRow]);
      const repo = new SqliteAnalysisRepository(db);

      const analysis = await repo.getById('mock-analysis-id');
      expect(analysis?.id).toBe('mock-analysis-id');
    });
  });

  describe('create', () => {
    it('inserts analysis and returns entity', async () => {
      const db = createMockDb();
      (db.execute as jest.Mock).mockResolvedValueOnce({ rows: [], rowsAffected: 1 });
      const repo = new SqliteAnalysisRepository(db);

      const analysis = await repo.create({
        patientId: 'p1',
        angles: { kneeAngle: 175.0, hipAngle: 178.0, ankleAngle: 90.5 },
        confidenceScore: 0.9,
      });

      expect(analysis.id).toBe('mock-analysis-id');
      expect(analysis.patientId).toBe('p1');
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining(['mock-analysis-id', 'p1'])
      );
    });

    it('throws for invalid confidence score', async () => {
      const db = createMockDb();
      const repo = new SqliteAnalysisRepository(db);

      await expect(repo.create({
        patientId: 'p1',
        angles: { kneeAngle: 175, hipAngle: 178, ankleAngle: 90 },
        confidenceScore: 1.5,
      })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('executes DELETE query', async () => {
      const db = createMockDb();
      const repo = new SqliteAnalysisRepository(db);

      await repo.delete('analysis-1');

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        ['analysis-1']
      );
    });
  });
});
