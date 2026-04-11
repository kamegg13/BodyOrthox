import { Platform } from 'react-native';
import { AppConfiguration } from '../config/app-config';
import { IDatabase } from './database';
import { ApiPatientRepository } from '../../features/patients/data/api-patient-repository';
import { SqliteAnalysisRepository } from '../../features/capture/data/sqlite-analysis-repository';
import { usePatientsStore } from '../../features/patients/store/patients-store';
import { useCaptureStore } from '../../features/capture/store/capture-store';

let _db: IDatabase | null = null;

export async function initializeDatabase(): Promise<IDatabase> {
  if (_db) return _db;

  const { createDatabase } =
    Platform.OS === 'web'
      ? require('./database.web')
      : require('./database.native');

  _db = createDatabase(AppConfiguration.databaseName) as IDatabase;
  await _db.initialize();

  usePatientsStore.getState().setRepository(new ApiPatientRepository());
  useCaptureStore.getState().setRepository(new SqliteAnalysisRepository(_db));

  return _db;
}

export function getDatabase(): IDatabase {
  if (!_db) throw new Error('Database not initialized. Call initializeDatabase() first.');
  return _db;
}
