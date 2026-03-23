import {
  CREATE_PATIENTS_TABLE,
  CREATE_ANALYSES_TABLE,
  CREATE_IDX_PATIENTS_NAME,
  CREATE_IDX_ANALYSES_PATIENT,
  ADD_LANDMARKS_JSON_COLUMN,
  ADD_CAPTURED_IMAGE_URL_COLUMN,
  ALL_MIGRATIONS,
} from "../schema";

describe("Database Schema", () => {
  describe("CREATE_PATIENTS_TABLE", () => {
    it("contains IF NOT EXISTS guard", () => {
      expect(CREATE_PATIENTS_TABLE).toContain("IF NOT EXISTS");
    });

    it("defines required columns", () => {
      expect(CREATE_PATIENTS_TABLE).toContain("id TEXT PRIMARY KEY");
      expect(CREATE_PATIENTS_TABLE).toContain("name TEXT");
      expect(CREATE_PATIENTS_TABLE).toContain("date_of_birth TEXT");
      expect(CREATE_PATIENTS_TABLE).toContain("created_at TEXT");
    });

    it("has morphological_profile as nullable", () => {
      // No NOT NULL constraint on morphological_profile
      const lines = CREATE_PATIENTS_TABLE.split("\n");
      const profileLine = lines.find((l) =>
        l.includes("morphological_profile"),
      );
      expect(profileLine).toBeDefined();
      expect(profileLine).not.toContain("NOT NULL");
    });
  });

  describe("CREATE_ANALYSES_TABLE", () => {
    it("has foreign key to patients", () => {
      expect(CREATE_ANALYSES_TABLE).toContain("REFERENCES patients(id)");
    });

    it("defines angle columns as REAL", () => {
      expect(CREATE_ANALYSES_TABLE).toContain("knee_angle REAL");
      expect(CREATE_ANALYSES_TABLE).toContain("hip_angle REAL");
      expect(CREATE_ANALYSES_TABLE).toContain("ankle_angle REAL");
    });

    it("defines confidence_score as REAL", () => {
      expect(CREATE_ANALYSES_TABLE).toContain("confidence_score REAL");
    });

    it("has CASCADE delete", () => {
      expect(CREATE_ANALYSES_TABLE).toContain("ON DELETE CASCADE");
    });
  });

  describe("Indexes", () => {
    it("patients name index exists", () => {
      expect(CREATE_IDX_PATIENTS_NAME).toContain("idx_patients_name");
      expect(CREATE_IDX_PATIENTS_NAME).toContain("patients(name)");
    });

    it("analyses patient index exists", () => {
      expect(CREATE_IDX_ANALYSES_PATIENT).toContain("idx_analyses_patient");
      expect(CREATE_IDX_ANALYSES_PATIENT).toContain("patient_id");
    });
  });

  describe("ALL_MIGRATIONS", () => {
    it("contains all migration statements", () => {
      expect(ALL_MIGRATIONS).toHaveLength(6);
      expect(ALL_MIGRATIONS).toContain(CREATE_PATIENTS_TABLE);
      expect(ALL_MIGRATIONS).toContain(CREATE_ANALYSES_TABLE);
      expect(ALL_MIGRATIONS).toContain(CREATE_IDX_PATIENTS_NAME);
      expect(ALL_MIGRATIONS).toContain(CREATE_IDX_ANALYSES_PATIENT);
      expect(ALL_MIGRATIONS).toContain(ADD_LANDMARKS_JSON_COLUMN);
      expect(ALL_MIGRATIONS).toContain(ADD_CAPTURED_IMAGE_URL_COLUMN);
    });

    it("patients table comes before analyses table", () => {
      const patientsIdx = ALL_MIGRATIONS.indexOf(CREATE_PATIENTS_TABLE);
      const analysesIdx = ALL_MIGRATIONS.indexOf(CREATE_ANALYSES_TABLE);
      expect(patientsIdx).toBeLessThan(analysesIdx);
    });
  });
});
