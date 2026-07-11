import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import {
  Patient,
  CreatePatientInput,
  UpdatePatientInput,
  patientDisplayName,
} from "../domain/patient";
import { IPatientRepository } from "../data/patient-repository";

// Required for Immer to handle Set and Map types
enableMapSet();

export type SortBy = "alpha" | "recent" | "last-analyzed";
// "notArchived" reflète le statut d'archivage (opposé de "archived"), distinct
// d'un éventuel filtre de niveau d'activité sportive — les deux ne doivent
// jamais être confondus (cf. chip "Actifs" de la liste patients).
export type PatientFilter = "male" | "female" | "notArchived" | "sedentary" | "has-pains" | "archived";

/**
 * Identifiant court affiché sur la fiche patient (`#P-XXXX`). Dupliqué ici
 * (plutôt qu'importé) car la recherche doit matcher exactement ce que
 * l'utilisateur voit à l'écran — voir patient-detail-route.tsx::shortId.
 */
function shortPatientId(id: string): string {
  if (id.length <= 8) return id;
  return `P-${id.slice(0, 4).toUpperCase()}`;
}

function computeFiltered(
  patients: Patient[],
  searchQuery: string,
  sortBy: SortBy,
  activeFilters: Set<PatientFilter>,
): Patient[] {
  const showArchived = activeFilters.has("archived");

  let result = patients.filter((p) => {
    // Le statut non-archivé se lit uniquement sur `archivedAt` — jamais sur
    // `morphologicalProfile.activityLevel` (c'était le bug du chip "Actifs").
    // "notArchived" (chip "Actifs") est donc cohérent avec le comportement
    // par défaut : sans le chip "Archivés", les patients archivés restent
    // masqués de la liste principale.
    if (showArchived) {
      if (!p.archivedAt) return false;
    } else {
      if (p.archivedAt) return false;
    }

    if (activeFilters.has("male") && p.morphologicalProfile?.sex !== "male") return false;
    if (activeFilters.has("female") && p.morphologicalProfile?.sex !== "female") return false;
    if (activeFilters.has("sedentary") && p.morphologicalProfile?.activityLevel !== "sedentary")
      return false;
    if (activeFilters.has("has-pains") && (p.morphologicalProfile?.pains?.length ?? 0) === 0)
      return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = patientDisplayName(p).toLowerCase().includes(q);
      const matchesId =
        p.id.toLowerCase().includes(q) || shortPatientId(p.id).toLowerCase().includes(q);
      if (!matchesName && !matchesId) return false;
    }

    return true;
  });

  if (sortBy === "alpha") {
    result = [...result].sort((a, b) =>
      patientDisplayName(a).localeCompare(patientDisplayName(b), "fr"),
    );
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
  clearFilters(): void;
  clearError(): void;
}

// Module-level (non-reactive) — this doesn't trigger re-renders and is
// intentionally outside the Zustand store to avoid serialization issues.
let _repository: IPatientRepository | null = null;
// Monotonic token guarding against out-of-order search responses: a slow
// response for "ab" must never overwrite the newer response for "abc". Each
// loadPatients captures the token it started with and drops its result if a
// newer load has been issued since.
let _loadSeq = 0;

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
      const seq = ++_loadSeq;
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const patients = await _repository.getAll(get().searchQuery || undefined);
        // A newer load was issued while this one was in flight — drop this
        // (possibly stale) result so it can't overwrite the fresher response.
        if (seq !== _loadSeq) return;
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
        if (seq !== _loadSeq) return;
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
      if (!_repository) throw new Error("Repository non initialisé");
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
        // Ne PAS avaler l'erreur : un appelant qui `await`e updatePatient() doit
        // savoir que la persistance a échoué (ex. ne pas quitter l'écran d'édition).
        const msg = error instanceof Error ? error.message : "Erreur de mise à jour";
        set((state) => {
          state.error = msg;
        });
        throw error;
      }
    },

    async archivePatient(id: string) {
      if (!_repository) return;
      // Purge d'une éventuelle erreur antérieure : les appelants lisent
      // `error` après l'await pour distinguer succès et échec.
      set((state) => {
        state.error = null;
      });
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
      // Même contrat que archivePatient : error nulle ⇔ opération réussie.
      set((state) => {
        state.error = null;
      });
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

    clearFilters() {
      set((state) => {
        state.activeFilters = new Set();
        state.filteredPatients = computeFiltered(
          state.patients,
          state.searchQuery,
          state.sortBy,
          new Set(),
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
