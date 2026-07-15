import { AppConfiguration } from '../config/app-config';
// Metro résout `./database` vers database.native.ts (op-sqlite persistant,
// SQLCipher) et webpack vers database.web.ts (shim localStorage, dev) — plus
// besoin de require conditionnel, et op-sqlite reste hors du bundle web.
import { createDatabase, IDatabase } from './database';
import { SqlitePatientRepository } from '../../features/patients/data/sqlite-patient-repository';
import { SqliteAnalysisRepository } from '../../features/capture/data/sqlite-analysis-repository';
import { ApiFeedbackRepository } from '../../features/feedback/data/api-feedback-repository';
import { usePatientsStore } from '../../features/patients/store/patients-store';
import { useCaptureStore } from '../../features/capture/store/capture-store';
import { useFeedbackStore } from '../../features/feedback/store/feedback-store';

let _db: IDatabase | null = null;

/**
 * Repositories par défaut — ON-DEVICE PUR (décision produit du 2026-07-15,
 * validation humaine explicite).
 *
 * Les données de santé (patients, analyses) sont stockées UNIQUEMENT sur
 * l'appareil : SQLite persistant (op-sqlite), chiffré SQLCipher en production
 * (clé en Keychain/Keystore — voir encryption-key.ts). Aucune donnée patient
 * ne part vers le serveur : pas d'hébergement HDS requis, et la promesse de
 * l'écran de capture (« Données enregistrées uniquement sur votre appareil »)
 * est tenue.
 *
 * Restent sur l'API :
 *   - le feedback (pas une donnée de santé, doit parvenir à l'équipe) ;
 *   - l'authentification (compte praticien ; porte d'entrée d'une future
 *     collecte de données ANONYMISÉES, opt-in, à l'étude).
 *
 * Les Api*Repository patients/analyses sont conservés dans le code pour une
 * éventuelle synchronisation serveur future (qui exigerait un hébergement
 * HDS), mais ne sont plus câblés.
 */
export async function initializeDatabase(): Promise<IDatabase> {
  if (_db) return _db;

  // Indépendant de la base locale : câblé d'abord pour que le feedback reste
  // fonctionnel même si l'init SQLite échoue.
  useFeedbackStore.getState().setRepository(new ApiFeedbackRepository());

  const db: IDatabase = createDatabase(AppConfiguration.databaseName, {
    encrypted: AppConfiguration.useEncryptedDatabase,
  });

  // On propage l'erreur sans mettre en cache une base non initialisée : un
  // appel ultérieur pourra retenter. Sans base, pas de repositories santé —
  // App.tsx affiche l'erreur (pas d'écrans vides silencieux).
  await db.initialize();

  usePatientsStore.getState().setRepository(new SqlitePatientRepository(db));
  useCaptureStore.getState().setRepository(new SqliteAnalysisRepository(db));

  _db = db;
  return _db;
}

export function getDatabase(): IDatabase {
  if (!_db) throw new Error('Database not initialized. Call initializeDatabase() first.');
  return _db;
}

/** Réservé aux tests : oublie l'instance en cache pour isoler chaque cas. */
export function __resetDatabaseForTests(): void {
  _db = null;
}
