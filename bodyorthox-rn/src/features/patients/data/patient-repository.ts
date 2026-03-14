import { Patient, CreatePatientInput } from '../domain/patient';

export interface IPatientRepository {
  getAll(nameFilter?: string): Promise<Patient[]>;
  getById(id: string): Promise<Patient | null>;
  create(input: CreatePatientInput): Promise<Patient>;
  update(id: string, partial: Partial<Pick<Patient, 'name' | 'dateOfBirth' | 'morphologicalProfile'>>): Promise<Patient>;
  delete(id: string): Promise<void>;
}
