import { Platform } from 'react-native';
import { apiRequest } from '../../../core/api/api-client';

const MIGRATION_KEY = 'bodyorthox_migration_done';
const WEB_DB_KEY = 'bodyorthox_db';

interface RawPatient {
  id?: string;
  name?: string;
  date_of_birth?: string;
  height_cm?: number;
  weight_kg?: number;
  notes?: string;
}

/**
 * One-shot migration: uploads existing localStorage patients to the API server.
 * Only runs on web, only once (guarded by MIGRATION_KEY flag).
 * Silent on failure — will retry on next login.
 */
export async function migrateLocalPatients(): Promise<void> {
  if (Platform.OS !== 'web') return;

  try {
    const done = localStorage.getItem(MIGRATION_KEY) === 'true';
    if (done) return;

    // Read patients from legacy localStorage-backed WebDatabase
    const raw = localStorage.getItem(WEB_DB_KEY);
    if (!raw) {
      localStorage.setItem(MIGRATION_KEY, 'true');
      return;
    }

    const parsed = JSON.parse(raw) as Record<string, RawPatient[]>;
    const patients: RawPatient[] = parsed['patients'] ?? [];

    if (patients.length === 0) {
      localStorage.setItem(MIGRATION_KEY, 'true');
      return;
    }

    // Map to API shape
    const payload = patients
      .filter((p) => p.name && p.date_of_birth)
      .map((p) => ({
        name: p.name!,
        dateOfBirth: p.date_of_birth!,
        heightCm: p.height_cm,
        weightKg: p.weight_kg,
        notes: p.notes,
      }));

    if (payload.length > 0) {
      await apiRequest('/patients/batch', {
        method: 'POST',
        body: JSON.stringify({ patients: payload }),
      });
      console.log(`Migration: ${payload.length} patients transférés vers l'API`);
    }

    localStorage.setItem(MIGRATION_KEY, 'true');
  } catch (e) {
    // Silent — will retry on next login
    console.warn('Migration silently failed:', e);
  }
}
