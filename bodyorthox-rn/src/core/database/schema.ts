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

export const ADD_LANDMARKS_JSON_COLUMN = `
  ALTER TABLE analyses ADD COLUMN landmarks_json TEXT;
`;

export const ADD_CAPTURED_IMAGE_URL_COLUMN = `
  ALTER TABLE analyses ADD COLUMN captured_image_url TEXT;
`;

// --- Minimisation des données (RGPD / privacy by design) ---
// Identité optionnelle + alternatives minimisées + consentement.
export const ADD_PATIENT_DISPLAY_LABEL_COLUMN = `
  ALTER TABLE patients ADD COLUMN display_label TEXT;
`;

export const ADD_PATIENT_BIRTH_YEAR_COLUMN = `
  ALTER TABLE patients ADD COLUMN birth_year INTEGER;
`;

export const ADD_PATIENT_ARCHIVED_AT_COLUMN = `
  ALTER TABLE patients ADD COLUMN archived_at TEXT;
`;

export const ADD_PATIENT_CONSENT_GIVEN_COLUMN = `
  ALTER TABLE patients ADD COLUMN consent_given INTEGER;
`;

export const ADD_PATIENT_CONSENT_DATE_COLUMN = `
  ALTER TABLE patients ADD COLUMN consent_date TEXT;
`;

// Consentement granulaire — preuve RGPD par finalité (stockage / capture photo / export PDF).
export const ADD_PATIENT_CONSENT_STORAGE_COLUMN = `
  ALTER TABLE patients ADD COLUMN consent_storage INTEGER;
`;

export const ADD_PATIENT_CONSENT_PHOTO_CAPTURE_COLUMN = `
  ALTER TABLE patients ADD COLUMN consent_photo_capture INTEGER;
`;

export const ADD_PATIENT_CONSENT_PDF_EXPORT_COLUMN = `
  ALTER TABLE patients ADD COLUMN consent_pdf_export INTEGER;
`;

export const ADD_PATIENT_REFERRING_PHYSICIAN_COLUMN = `
  ALTER TABLE patients ADD COLUMN referring_physician TEXT;
`;

// Interprétation clinique du praticien — jamais générée automatiquement,
// affichée dans Résultats et reprise telle quelle dans le rapport PDF.
export const ADD_ANALYSIS_CLINICAL_NOTES_COLUMN = `
  ALTER TABLE analyses ADD COLUMN clinical_notes TEXT;
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
  ADD_LANDMARKS_JSON_COLUMN,
  ADD_CAPTURED_IMAGE_URL_COLUMN,
  ADD_PATIENT_DISPLAY_LABEL_COLUMN,
  ADD_PATIENT_BIRTH_YEAR_COLUMN,
  ADD_PATIENT_ARCHIVED_AT_COLUMN,
  ADD_PATIENT_CONSENT_GIVEN_COLUMN,
  ADD_PATIENT_CONSENT_DATE_COLUMN,
  ADD_PATIENT_CONSENT_STORAGE_COLUMN,
  ADD_PATIENT_CONSENT_PHOTO_CAPTURE_COLUMN,
  ADD_PATIENT_CONSENT_PDF_EXPORT_COLUMN,
  ADD_PATIENT_REFERRING_PHYSICIAN_COLUMN,
  ADD_ANALYSIS_CLINICAL_NOTES_COLUMN,
];
