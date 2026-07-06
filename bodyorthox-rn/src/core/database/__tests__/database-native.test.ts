/**
 * Tests for the native (Android/iOS) in-memory database shim.
 * Mirrors the web shim; localStorage is absent on native so persistence is
 * best-effort only — these tests cover the SQL parsing paths that matter for
 * RGPD erasure and patient search.
 */

import { createDatabase } from "../database.native";

describe("NativeDatabase", () => {
  let db: ReturnType<typeof createDatabase>;

  beforeEach(async () => {
    db = createDatabase("test.db");
    await db.initialize();
  });

  afterEach(async () => {
    await db.close();
  });

  it("deletes analyses by patient_id (right to erasure cascade)", async () => {
    await db.execute(
      `INSERT INTO analyses
         (id, patient_id, knee_angle, hip_angle, ankle_angle,
          confidence_score, ml_corrected, manual_correction_joint, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["a1", "patient-1", 170, 175, 90, 0.85, 0, null, "2024-01-01T00:00:00Z"],
    );
    await db.execute(
      `INSERT INTO analyses
         (id, patient_id, knee_angle, hip_angle, ankle_angle,
          confidence_score, ml_corrected, manual_correction_joint, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["a2", "patient-2", 168, 174, 89, 0.9, 0, null, "2024-01-02T00:00:00Z"],
    );

    await db.execute("DELETE FROM analyses WHERE patient_id = ?", ["patient-1"]);

    const result = await db.execute("SELECT * FROM analyses");
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]["id"]).toBe("a2");
  });

  it("deletes a patient by id", async () => {
    await db.execute(
      "INSERT INTO patients (id, name, created_at) VALUES (?, ?, ?)",
      ["p1", "Jean", "2024-01-01T00:00:00Z"],
    );

    await db.execute("DELETE FROM patients WHERE id = ?", ["p1"]);

    const result = await db.execute("SELECT * FROM patients");
    expect(result.rows).toHaveLength(0);
  });

  it("selects with OR conditions (search on name or display_label)", async () => {
    await db.execute(
      "INSERT INTO patients (id, name, display_label, created_at) VALUES (?, ?, ?, ?)",
      ["p1", "Jean Dupont", "PAT-0001", "2024-01-01T00:00:00Z"],
    );
    await db.execute(
      "INSERT INTO patients (id, name, display_label, created_at) VALUES (?, ?, ?, ?)",
      ["p2", "Marie Martin", "PAT-0002", "2024-01-02T00:00:00Z"],
    );

    const result = await db.execute(
      "SELECT * FROM patients WHERE name LIKE ? OR display_label LIKE ?",
      ["%zzz%", "%PAT-0002%"],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]["id"]).toBe("p2");
  });

  it("selects with compound AND conditions", async () => {
    await db.execute(
      "INSERT INTO patients (id, name, morphological_profile, created_at) VALUES (?, ?, ?, ?)",
      ["p1", "Jean", "normal", "2024-01-01T00:00:00Z"],
    );
    await db.execute(
      "INSERT INTO patients (id, name, morphological_profile, created_at) VALUES (?, ?, ?, ?)",
      ["p2", "Jean", "autre", "2024-01-02T00:00:00Z"],
    );

    const result = await db.execute(
      "SELECT * FROM patients WHERE name = ? AND morphological_profile = ?",
      ["Jean", "normal"],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]["id"]).toBe("p1");
  });
});
