import { Patient, CreatePatientInput, UpdatePatientInput } from '../domain/patient';

export interface IPatientRepository {
  getAll(nameFilter?: string): Promise<Patient[]>;
  getById(id: string): Promise<Patient | null>;
  create(input: CreatePatientInput): Promise<Patient>;
  update(id: string, input: UpdatePatientInput): Promise<Patient>;
  archive(id: string): Promise<Patient>;
  delete(id: string): Promise<void>;
}
