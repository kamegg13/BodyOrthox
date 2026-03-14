import { Analysis, CreateAnalysisInput } from '../domain/analysis';

export interface IAnalysisRepository {
  getForPatient(patientId: string): Promise<Analysis[]>;
  getById(id: string): Promise<Analysis | null>;
  create(input: CreateAnalysisInput): Promise<Analysis>;
  delete(id: string): Promise<void>;
}
