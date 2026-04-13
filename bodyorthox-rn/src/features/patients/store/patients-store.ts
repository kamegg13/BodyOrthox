import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import { Patient, CreatePatientInput, UpdatePatientInput } from "../domain/patient";
import { IPatientRepository } from "../data/patient-repository";

// Required for Immer to handle Set and Map types
enableMapSet();

export type SortBy = "alpha" | "recent" | "last-analyzed";
export type PatientFilter = "male" | "female" | "active" | "sedentary" | "has-pains" | "archived";

function computeFiltered(
  patients: Patient[],
  searchQuery: string,
  sortBy: SortBy,
  activeFilters: Set<PatientFilter>,
): Patient[] {
  const showArchived = activeFilters.has("archived");

  let result = patients.filter((p) => {
    if (showArchived) {
      if (!p.archivedAt) return false;
    } else {
      if (p.archivedAt) return false;
    }

    if (activeFilters.has("male") && p.morphologicalProfile?.sex !== "male") return false;
    if (activeFilters.has("female") && p.morphologicalProfile?.sex !== "female") return false;
    if (
      activeFilters.has("active") &&
      p.morphologicalProfile?.activityLevel !== "active" &&
      p.morphologicalProfile?.activityLevel !== "athlete"
    )
      return false;
    if (activeFilters.has("sedentary") && p.morphologicalProfile?.activityLevel !== "sedentary")
      return false;
    if (activeFilters.has("has-pains") && (p.morphologicalProfile?.pains?.length ?? 0) === 0)
      return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q)) return false;
    }

    return true;
  });

  if (sortBy === "alpha") {
    result = [...result].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  } else if (sortBy === "recent") {
    result = [...result].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  return result;
}

interface PatientsState {
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: SortBy;
  activeFilters: Set<PatientFilter>;
  filteredPatients: Patient[];
}

interface PatientsActions {
  setRepository(repo: IPatientRepository): void;
  loadPatients(): Promise<void>;
  setSearchQuery(query: string): void;
  createPatient(input: CreatePatientInput): Promise<Patient>;
  updatePatient(id: string, input: UpdatePatientInput): Promise<void>;
  archivePatient(id: string): Promise<void>;
  deletePatient(id: string): Promise<void>;
  setSortBy(sort: SortBy): void;
  toggleFilter(filter: PatientFilter): void;
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
    sortBy: "alpha",
    activeFilters: new Set<PatientFilter>(),
    filteredPatients: [],

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
        const patients = await _repository.getAll(get().searchQuery || undefined);
        set((state) => {
          state.patients = patients;
          state.isLoading = false;
          state.filteredPatients = computeFiltered(
            patients,
            state.searchQuery,
            state.sortBy,
            state.activeFilters,
          );
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Erreur de chargement";
          state.isLoading = false;
        });
      }
    },

    setSearchQuery(query: string) {
      set((state) => {
        state.searchQuery = query;
        state.filteredPatients = computeFiltered(
          state.patients,
          query,
          state.sortBy,
          state.activeFilters,
        );
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
          state.filteredPatients = computeFiltered(
            state.patients,
            state.searchQuery,
            state.sortBy,
            state.activeFilters,
          );
        });
        return patient;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Erreur de création";
        set((state) => {
          state.error = msg;
          state.isLoading = false;
        });
        throw error;
      }
    },

    async updatePatient(id: string, input: UpdatePatientInput) {
      if (!_repository) return;
      try {
        const updated = await _repository.update(id, input);
        set((state) => {
          const idx = state.patients.findIndex((p) => p.id === id);
          if (idx !== -1) state.patients[idx] = updated;
          state.filteredPatients = computeFiltered(
            state.patients,
            state.searchQuery,
            state.sortBy,
            state.activeFilters,
          );
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Erreur de mise à jour";
        });
      }
    },

    async archivePatient(id: string) {
      if (!_repository) return;
      try {
        const archived = await _repository.archive(id);
        set((state) => {
          const idx = state.patients.findIndex((p) => p.id === id);
          if (idx !== -1) state.patients[idx] = archived;
          state.filteredPatients = computeFiltered(
            state.patients,
            state.searchQuery,
            state.sortBy,
            state.activeFilters,
          );
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Erreur d'archivage";
        });
      }
    },

    async deletePatient(id: string) {
      if (!_repository) return;
      try {
        await _repository.delete(id);
        set((state) => {
          state.patients = state.patients.filter((p) => p.id !== id);
          state.filteredPatients = computeFiltered(
            state.patients,
            state.searchQuery,
            state.sortBy,
            state.activeFilters,
          );
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Erreur de suppression";
        });
      }
    },

    setSortBy(sort: SortBy) {
      set((state) => {
        state.sortBy = sort;
        state.filteredPatients = computeFiltered(
          state.patients,
          state.searchQuery,
          sort,
          state.activeFilters,
        );
      });
    },

    toggleFilter(filter: PatientFilter) {
      set((state) => {
        const next = new Set(state.activeFilters);
        if (next.has(filter)) {
          next.delete(filter);
        } else {
          next.add(filter);
        }
        state.activeFilters = next;
        state.filteredPatients = computeFiltered(
          state.patients,
          state.searchQuery,
          state.sortBy,
          next,
        );
      });
    },

    clearError() {
      set((state) => {
        state.error = null;
      });
    },
  })),
);
