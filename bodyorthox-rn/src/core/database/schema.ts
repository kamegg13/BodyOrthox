/**
 * Database schema definitions (SQL DDL).
 * Shared between native (expo-sqlite) and web (IndexedDB) implementations.
 */

export const CREATE_PATIENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    morphological_profile TEXT,
    created_at TEXT NOT NULL
  );
`;

export const CREATE_ANALYSES_TABLE = `
  CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY NOT NULL,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    knee_angle REAL NOT NULL,
    hip_angle REAL NOT NULL,
    ankle_angle REAL NOT NULL,
    confidence_score REAL NOT NULL,
    ml_corrected INTEGER NOT NULL DEFAULT 0,
    manual_correction_joint TEXT,
    created_at TEXT NOT NULL
  );
`;

export const CREATE_IDX_PATIENTS_NAME = `
  CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
`;

export const CREATE_IDX_ANALYSES_PATIENT = `
  CREATE INDEX IF NOT EXISTS idx_analyses_patient
  ON analyses(patient_id, created_at DESC);
`;

export const ALL_MIGRATIONS = [
  CREATE_PATIENTS_TABLE,
  CREATE_ANALYSES_TABLE,
  CREATE_IDX_PATIENTS_NAME,
  CREATE_IDX_ANALYSES_PATIENT,
];
