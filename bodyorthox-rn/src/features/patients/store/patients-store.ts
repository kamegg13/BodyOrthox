import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Patient, CreatePatientInput } from "../domain/patient";
import { IPatientRepository } from "../data/patient-repository";

interface PatientsState {
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
}

interface PatientsActions {
  setRepository(repo: IPatientRepository): void;
  loadPatients(): Promise<void>;
  setSearchQuery(query: string): void;
  createPatient(input: CreatePatientInput): Promise<Patient>;
  updatePatient(
    id: string,
    partial: Partial<
      Pick<Patient, "name" | "dateOfBirth" | "morphologicalProfile">
    >,
  ): Promise<void>;
  deletePatient(id: string): Promise<void>;
  clearError(): void;
}

// Module-level (non-reactive) — this doesn't trigger re-renders and is
// intentionally outside the Zustand store to avoid serialization issues.
let _repository: IPatientRepository | null = null;

export const usePatientsStore = create<PatientsState & PatientsActions>()(
  immer((set, get) => ({
    patients: [],
    isLoading: false,
    error: null,
    searchQuery: "",

    setRepository(repo: IPatientRepository) {
      _repository = repo;
    },

    async loadPatients() {
      if (!_repository) return;
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const patients = await _repository.getAll(
          get().searchQuery || undefined,
        );
        set((state) => {
          state.patients = patients;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Erreur de chargement";
          state.isLoading = false;
        });
      }
    },

    setSearchQuery(query: string) {
      set((state) => {
        state.searchQuery = query;
      });
      get().loadPatients();
    },

    async createPatient(input: CreatePatientInput) {
      if (!_repository) throw new Error("Repository non initialisé");
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const patient = await _repository.create(input);
        set((state) => {
          state.patients.unshift(patient);
          state.isLoading = false;
        });
        return patient;
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Erreur de création";
        set((state) => {
          state.error = msg;
          state.isLoading = false;
        });
        throw error;
      }
    },

    async updatePatient(id, partial) {
      if (!_repository) return;
      try {
        const updated = await _repository.update(id, partial);
        set((state) => {
          const idx = state.patients.findIndex((p) => p.id === id);
          if (idx !== -1) state.patients[idx] = updated;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Erreur de mise à jour";
        });
      }
    },

    async deletePatient(id: string) {
      if (!_repository) return;
      try {
        await _repository.delete(id);
        set((state) => {
          state.patients = state.patients.filter((p) => p.id !== id);
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Erreur de suppression";
        });
      }
    },

    clearError() {
      set((state) => {
        state.error = null;
      });
    },
  })),
);
