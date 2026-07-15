import { AppConfiguration } from '../config/app-config';
// Metro résout `./database` vers database.native.ts (op-sqlite persistant,
// SQLCipher) et webpack vers database.web.ts (shim localStorage, dev) — plus
// besoin de require conditionnel, et op-sqlite reste hors du bundle web.
import { createDatabase, IDatabase } from './database';
import { ApiPatientRepository } from '../../features/patients/data/api-patient-repository';
import { ApiAnalysisRepository } from '../../features/capture/data/api-analysis-repository';
import { ApiFeedbackRepository } from '../../features/feedback/data/api-feedback-repository';
import { usePatientsStore } from '../../features/patients/store/patients-store';
import { useCaptureStore } from '../../features/capture/store/capture-store';
import { useFeedbackStore } from '../../features/feedback/store/feedback-store';

let _db: IDatabase | null = null;

/**
 * Choix du repository par défaut — RGPD / privacy by design.
 *
 * ÉTAT ACTUEL : les stores sont câblés sur les repositories *API* (Api*Repository),
 * ce qui envoie les données patient (PHI) vers le serveur distant. Ce choix est
 * conservé par défaut car :
 *   - l'authentification, le `userId` et la synchronisation multi-appareils
 *     dépendent de l'API ;
 *   - le store on-device actuel (`database.web.ts` / `database.native.ts`) est un
 *     shim Map EN MÉMOIRE : DDL/PRAGMA sont ignorés, et le natif n'a PAS de
 *     persistance fiable (AsyncStorage non câblé). Basculer le défaut vers
 *     `SqlitePatientRepository` exposerait à des pertes de données.
 *
 * POUR FORCER LE MODE LOCAL ON-DEVICE (à valider par un humain) : remplacer
 * `new ApiPatientRepository()` par `new SqlitePatientRepository(_db)` (idem pour
 * analyses / feedback). Le `SqlitePatientRepository` est volontairement conservé
 * et maintenu à jour (minimisation + suppression réelle avec effacement des
 * analyses) pour préparer ce basculement.
 *
 * DÉCISION : non basculé ici — changement de défaut jugé risqué tant que la
 * persistance on-device et le chiffrement au repos ne sont pas en place.
 * Voir `app-config.ts#useEncryptedDatabase` (flag défini, non encore consommé).
 */
export async function initializeDatabase(): Promise<IDatabase> {
  if (_db) return _db;

  const db: IDatabase = createDatabase(AppConfiguration.databaseName, {
    encrypted: AppConfiguration.useEncryptedDatabase,
  });

  // Les repositories API ne dépendent pas du shim on-device : on les câble
  // d'abord pour qu'un échec d'`initialize()` (shim indisponible) ne laisse pas
  // les écrans sans repository — sinon écrans vides silencieux.
  usePatientsStore.getState().setRepository(new ApiPatientRepository());
  useCaptureStore.getState().setRepository(new ApiAnalysisRepository());
  useFeedbackStore.getState().setRepository(new ApiFeedbackRepository());

  // On propage proprement l'erreur d'init sans mettre en cache un shim non
  // initialisé : un appel ultérieur pourra retenter.
  await db.initialize();

  _db = db;
  return _db;
}

export function getDatabase(): IDatabase {
  if (!_db) throw new Error('Database not initialized. Call initializeDatabase() first.');
  return _db;
}
