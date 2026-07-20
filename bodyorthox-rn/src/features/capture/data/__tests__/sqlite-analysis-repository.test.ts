import { SqliteAnalysisRepository } from "../sqlite-analysis-repository";
import { IDatabase, QueryResult } from "../../../../core/database/database";

jest.mock("../../../../shared/utils/generate-id", () => ({
  generateId: () => "mock-analysis-id",
}));

function createMockDb(rows: Record<string, unknown>[] = []): IDatabase {
  return {
    initialize: jest.fn().mockResolvedValue(undefined),
    execute: jest
      .fn()
      .mockResolvedValue({ rows, rowsAffected: 0 } as QueryResult),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

const mockRow = {
  id: "mock-analysis-id",
  patient_id: "p1",
  knee_angle: 175.0,
  hip_angle: 178.0,
  ankle_angle: 90.5,
  confidence_score: 0.92,
  ml_corrected: 0,
  manual_correction_joint: null,
  created_at: "2024-01-01T00:00:00Z",
};

describe("SqliteAnalysisRepository", () => {
  describe("getForPatient", () => {
    it("returns analyses for a patient", async () => {
      const db = createMockDb([mockRow]);
      const repo = new SqliteAnalysisRepository(db);

      const analyses = await repo.getForPatient("p1");

      expect(analyses).toHaveLength(1);
      expect(analyses[0].patientId).toBe("p1");
      expect(analyses[0].angles.kneeAngle).toBe(175.0);
      expect(analyses[0].confidenceScore).toBe(0.92);
    });

    it("maps ml_corrected integer to boolean", async () => {
      const correctedRow = {
        ...mockRow,
        ml_corrected: 1,
        manual_correction_joint: "knee",
      };
      const db = createMockDb([correctedRow]);
      const repo = new SqliteAnalysisRepository(db);

      const analyses = await repo.getForPatient("p1");

      expect(analyses[0].manualCorrectionApplied).toBe(true);
      expect(analyses[0].manualCorrectionJoint).toBe("knee");
    });

    it("returns empty array when no analyses", async () => {
      const db = createMockDb([]);
      const repo = new SqliteAnalysisRepository(db);

      const analyses = await repo.getForPatient("p1");
      expect(analyses).toHaveLength(0);
    });

    it("orders analyses by created_at descending (newest first)", async () => {
      // Rows returned unsorted by the shim (it ignores ORDER BY).
      const older = {
        ...mockRow,
        id: "older",
        created_at: "2024-01-01T00:00:00Z",
      };
      const newer = {
        ...mockRow,
        id: "newer",
        created_at: "2024-06-01T00:00:00Z",
      };
      const db = createMockDb([older, newer]);
      const repo = new SqliteAnalysisRepository(db);

      const analyses = await repo.getForPatient("p1");
      expect(analyses.map((a) => a.id)).toEqual(["newer", "older"]);
    });
  });

  describe("getById", () => {
    it("returns null when not found", async () => {
      const db = createMockDb([]);
      const repo = new SqliteAnalysisRepository(db);

      const analysis = await repo.getById("unknown");
      expect(analysis).toBeNull();
    });

    it("returns analysis when found", async () => {
      const db = createMockDb([mockRow]);
      const repo = new SqliteAnalysisRepository(db);

      const analysis = await repo.getById("mock-analysis-id");
      expect(analysis?.id).toBe("mock-analysis-id");
    });
  });

  describe("create", () => {
    it("inserts analysis and returns entity", async () => {
      const db = createMockDb();
      (db.execute as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowsAffected: 1,
      });
      const repo = new SqliteAnalysisRepository(db);

      const analysis = await repo.create({
        patientId: "p1",
        angles: { kneeAngle: 175.0, hipAngle: 178.0, ankleAngle: 90.5 },
        confidenceScore: 0.9,
      });

      expect(analysis.id).toBe("mock-analysis-id");
      expect(analysis.patientId).toBe("p1");
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT"),
        expect.arrayContaining(["mock-analysis-id", "p1"]),
      );
    });

    it("throws for invalid confidence score", async () => {
      const db = createMockDb();
      const repo = new SqliteAnalysisRepository(db);

      await expect(
        repo.create({
          patientId: "p1",
          angles: { kneeAngle: 175, hipAngle: 178, ankleAngle: 90 },
          confidenceScore: 1.5,
        }),
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("executes DELETE query", async () => {
      const db = createMockDb();
      const repo = new SqliteAnalysisRepository(db);

      await repo.delete("analysis-1");

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining("DELETE"),
        ["analysis-1"],
      );
    });
  });

  describe("clinicalNotes", () => {
    it("maps clinical_notes column to clinicalNotes", async () => {
      const db = createMockDb([
        { ...mockRow, clinical_notes: "Suivi recommandé dans 3 mois." },
      ]);
      const repo = new SqliteAnalysisRepository(db);

      const analysis = await repo.getById("mock-analysis-id");
      expect(analysis?.clinicalNotes).toBe("Suivi recommandé dans 3 mois.");
    });

    it("leaves clinicalNotes undefined when the column is null", async () => {
      const db = createMockDb([{ ...mockRow, clinical_notes: null }]);
      const repo = new SqliteAnalysisRepository(db);

      const analysis = await repo.getById("mock-analysis-id");
      expect(analysis?.clinicalNotes).toBeUndefined();
    });

    it("includes clinical_notes in the INSERT statement", async () => {
      const db = createMockDb();
      (db.execute as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowsAffected: 1,
      });
      const repo = new SqliteAnalysisRepository(db);

      await repo.create({
        patientId: "p1",
        angles: { kneeAngle: 175.0, hipAngle: 178.0, ankleAngle: 90.5 },
        confidenceScore: 0.9,
        clinicalNotes: "Observation initiale.",
      });

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining("clinical_notes"),
        expect.arrayContaining(["Observation initiale."]),
      );
    });

    it("updates clinical_notes when provided", async () => {
      const db = createMockDb();
      const repo = new SqliteAnalysisRepository(db);

      await repo.update("analysis-1", { clinicalNotes: "Nouvelle note." });

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining("clinical_notes = ?"),
        ["Nouvelle note.", "analysis-1"],
      );
    });

    it("clears clinical_notes to null when set to a blank string", async () => {
      const db = createMockDb();
      const repo = new SqliteAnalysisRepository(db);

      await repo.update("analysis-1", { clinicalNotes: "   " });

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining("clinical_notes = ?"),
        [null, "analysis-1"],
      );
    });

    it("does not touch clinical_notes when not part of the partial update", async () => {
      const db = createMockDb();
      const repo = new SqliteAnalysisRepository(db);

      await repo.update("analysis-1", { manualCorrectionApplied: true });

      expect(db.execute).not.toHaveBeenCalledWith(
        expect.stringContaining("clinical_notes"),
        expect.anything(),
      );
    });
  });

  describe("count", () => {
    it("returns the row count from a SELECT COUNT(*) query", async () => {
      const db = createMockDb([{ count: 5 }]);
      const repo = new SqliteAnalysisRepository(db);

      const total = await repo.count();

      expect(total).toBe(5);
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining("SELECT COUNT(*)"),
      );
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining("FROM analyses"),
      );
    });

    it("returns 0 when the table is empty", async () => {
      const db = createMockDb([{ count: 0 }]);
      const repo = new SqliteAnalysisRepository(db);

      expect(await repo.count()).toBe(0);
    });
  });
});
