import { SqlitePatientRepository } from "../sqlite-patient-repository";
import { IDatabase, QueryResult } from "../../../../core/database/database";

jest.mock("../../../../shared/utils/generate-id", () => ({
  generateId: () => "test-patient-id",
}));

function createMockDb(rows: Record<string, unknown>[] = []): IDatabase {
  return {
    initialize: jest.fn().mockResolvedValue(undefined),
    execute: jest
      .fn()
      .mockResolvedValue({ rows, rowsAffected: rows.length } as QueryResult),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

const mockPatientRow = {
  id: "test-patient-id",
  name: "Jean Dupont",
  date_of_birth: "1990-05-15",
  morphological_profile: null,
  created_at: "2024-01-01T00:00:00.000Z",
};

describe("SqlitePatientRepository", () => {
  describe("getAll", () => {
    it("returns all patients mapped from rows", async () => {
      const db = createMockDb([mockPatientRow]);
      const repo = new SqlitePatientRepository(db);

      const patients = await repo.getAll();

      expect(patients).toHaveLength(1);
      expect(patients[0].id).toBe("test-patient-id");
      expect(patients[0].name).toBe("Jean Dupont");
      expect(patients[0].dateOfBirth).toBe("1990-05-15");
      expect(patients[0].morphologicalProfile).toBeNull();
    });

    it("filters by name when nameFilter is provided", async () => {
      const db = createMockDb([mockPatientRow]);
      const repo = new SqlitePatientRepository(db);

      await repo.getAll("Jean");

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining("LIKE"),
        ["%Jean%", "%Jean%"],
      );
    });

    it("returns empty list when no patients", async () => {
      const db = createMockDb([]);
      const repo = new SqlitePatientRepository(db);
      const patients = await repo.getAll();
      expect(patients).toHaveLength(0);
    });

    it("parses morphological profile from JSON", async () => {
      const profileRow = {
        ...mockPatientRow,
        morphological_profile: '{"heightCm":175,"weightKg":70}',
      };
      const db = createMockDb([profileRow]);
      const repo = new SqlitePatientRepository(db);

      const patients = await repo.getAll();

      expect(patients[0].morphologicalProfile).toEqual({
        heightCm: 175,
        weightKg: 70,
      });
    });

    it("renders a patient with null profile when the JSON is corrupted (no crash)", async () => {
      const corruptedRow = {
        ...mockPatientRow,
        morphological_profile: "{not-valid-json",
      };
      const db = createMockDb([corruptedRow]);
      const repo = new SqlitePatientRepository(db);

      const patients = await repo.getAll();

      expect(patients).toHaveLength(1);
      expect(patients[0].id).toBe("test-patient-id");
      expect(patients[0].morphologicalProfile).toBeNull();
    });
  });

  describe("getById", () => {
    it("returns null when patient not found", async () => {
      const db = createMockDb([]);
      const repo = new SqlitePatientRepository(db);
      const patient = await repo.getById("unknown-id");
      expect(patient).toBeNull();
    });

    it("returns patient when found", async () => {
      const db = createMockDb([mockPatientRow]);
      const repo = new SqlitePatientRepository(db);
      const patient = await repo.getById("test-patient-id");
      expect(patient?.name).toBe("Jean Dupont");
    });
  });

  describe("create", () => {
    it("inserts patient and returns created entity", async () => {
      const db = createMockDb();
      (db.execute as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowsAffected: 1,
      });
      const repo = new SqlitePatientRepository(db);

      const patient = await repo.create({
        name: "Jean Dupont",
        dateOfBirth: "1990-05-15",
      });

      expect(patient.id).toBe("test-patient-id");
      expect(patient.name).toBe("Jean Dupont");
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT"),
        expect.arrayContaining([
          "test-patient-id",
          "Jean Dupont",
          "1990-05-15",
        ]),
      );
    });

    it("creates a minimised patient with only a displayLabel (no name)", async () => {
      const db = createMockDb();
      (db.execute as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowsAffected: 1,
      });
      const repo = new SqlitePatientRepository(db);

      const patient = await repo.create({ displayLabel: "PAT-0427" });

      expect(patient.displayLabel).toBe("PAT-0427");
      expect(patient.name).toBeUndefined();
      // name column receives '' (NOT NULL legacy column), not null.
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT"),
        expect.arrayContaining(["test-patient-id", "", "PAT-0427"]),
      );
    });

    it("throws if dateOfBirth is invalid (when provided)", async () => {
      const db = createMockDb();
      const repo = new SqlitePatientRepository(db);
      await expect(
        repo.create({ name: "Jean", dateOfBirth: "not-a-date" }),
      ).rejects.toThrow();
    });

    it("persists granular consent fields and referringPhysician", async () => {
      const db = createMockDb();
      (db.execute as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowsAffected: 1,
      });
      const repo = new SqlitePatientRepository(db);

      const patient = await repo.create({
        name: "Jean Dupont",
        referringPhysician: "Dr. Martin",
        consentStorage: true,
        consentPhotoCapture: true,
        consentPdfExport: false,
        consentDate: "2026-01-01T00:00:00.000Z",
      });

      expect(patient.referringPhysician).toBe("Dr. Martin");
      expect(patient.consentStorage).toBe(true);
      expect(patient.consentPdfExport).toBe(false);
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining("referring_physician"),
        expect.arrayContaining(["Dr. Martin", 1, 1, 0, "2026-01-01T00:00:00.000Z"]),
      );
    });

    it("stores null for consent/referringPhysician columns when absent", async () => {
      const db = createMockDb();
      (db.execute as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowsAffected: 1,
      });
      const repo = new SqlitePatientRepository(db);

      await repo.create({ name: "Jean Dupont" });

      const [, params] = (db.execute as jest.Mock).mock.calls[0];
      // 4 dernières colonnes : consent_storage, consent_photo_capture, consent_pdf_export, referring_physician
      expect(params.slice(-4)).toEqual([null, null, null, null]);
    });
  });

  describe("update", () => {
    it("throws when patient not found", async () => {
      const db = createMockDb([]);
      const repo = new SqlitePatientRepository(db);
      await expect(
        repo.update("unknown", { name: "New Name" }),
      ).rejects.toThrow();
    });

    it("updates patient fields", async () => {
      const db = createMockDb([mockPatientRow]);
      (db.execute as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockPatientRow], rowsAffected: 0 }) // getById
        .mockResolvedValueOnce({ rows: [], rowsAffected: 1 }); // update

      const repo = new SqlitePatientRepository(db);
      const updated = await repo.update("test-patient-id", {
        name: "Jane Dupont",
      });

      expect(updated.name).toBe("Jane Dupont");
    });

    it("persists granular consent fields and referringPhysician on update", async () => {
      const db = createMockDb([mockPatientRow]);
      (db.execute as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockPatientRow], rowsAffected: 0 }) // getById
        .mockResolvedValueOnce({ rows: [], rowsAffected: 1 }); // update

      const repo = new SqlitePatientRepository(db);
      const updated = await repo.update("test-patient-id", {
        referringPhysician: "Dr. Petit",
        consentStorage: true,
        consentPhotoCapture: false,
        consentPdfExport: true,
      });

      expect(updated.referringPhysician).toBe("Dr. Petit");
      expect(updated.consentPhotoCapture).toBe(false);
      expect(db.execute).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("referring_physician"),
        expect.arrayContaining(["Dr. Petit", 1, 0, 1]),
      );
    });
  });

  describe("delete", () => {
    it("executes DELETE query with correct id (hard delete)", async () => {
      const db = createMockDb();
      const repo = new SqlitePatientRepository(db);

      await repo.delete("test-id");

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM patients"),
        ["test-id"],
      );
    });

    it("also deletes associated analyses on-device (right to erasure)", async () => {
      const db = createMockDb();
      const repo = new SqlitePatientRepository(db);

      await repo.delete("test-id");

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM analyses WHERE patient_id"),
        ["test-id"],
      );
    });
  });
});
