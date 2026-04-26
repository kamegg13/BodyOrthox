/**
 * Dev mode (web only).
 *
 * Activé via `?dev=1` dans l'URL. Court-circuite l'auth + injecte un repository
 * patient en mémoire avec quelques patients seedés, sans toucher à l'API réelle.
 * Permet de valider l'UI v2 (Dashboard / PatientList / PatientDetail / CreatePatient)
 * de bout en bout en preview sans dépendance backend.
 *
 * NE PAS utiliser en production — gardé pour démos & QA visuelle.
 */
import { Platform } from "react-native";
import { useAuthStore } from "../core/auth/auth-store";
import { useOnboardingStore } from "../features/onboarding/store/onboarding-store";
import { usePatientsStore } from "../features/patients/store/patients-store";
import type {
  CreatePatientInput,
  Patient,
  UpdatePatientInput,
} from "../features/patients/domain/patient";
import {
  createPatient as buildPatient,
  updatePatient as applyUpdate,
} from "../features/patients/domain/patient";
import type { IPatientRepository } from "../features/patients/data/patient-repository";
import { useCaptureStore } from "../features/capture/store/capture-store";
import type { IAnalysisRepository } from "../features/capture/data/analysis-repository";
import {
  createAnalysis as buildAnalysis,
  type Analysis,
  type CreateAnalysisInput,
} from "../features/capture/domain/analysis";

export function isDevMode(): boolean {
  if (Platform.OS !== "web") return false;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("dev") === "1";
}

class InMemoryPatientRepo implements IPatientRepository {
  private store: Patient[];

  constructor(initial: Patient[]) {
    this.store = [...initial];
  }

  async getAll(nameFilter?: string): Promise<Patient[]> {
    if (!nameFilter) return [...this.store];
    const q = nameFilter.toLowerCase();
    return this.store.filter((p) => p.name.toLowerCase().includes(q));
  }

  async getById(id: string): Promise<Patient | null> {
    return this.store.find((p) => p.id === id) ?? null;
  }

  async create(input: CreatePatientInput): Promise<Patient> {
    const p = buildPatient(input);
    this.store = [p, ...this.store];
    return p;
  }

  async update(id: string, input: UpdatePatientInput): Promise<Patient> {
    const idx = this.store.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Patient introuvable");
    const existing = this.store[idx];
    if (!existing) throw new Error("Patient introuvable");
    const updated = applyUpdate(existing, input);
    this.store[idx] = updated;
    return updated;
  }

  async archive(id: string): Promise<Patient> {
    const idx = this.store.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Patient introuvable");
    const existing = this.store[idx];
    if (!existing) throw new Error("Patient introuvable");
    const archived = { ...existing, archivedAt: new Date().toISOString() };
    this.store[idx] = archived;
    return archived;
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((p) => p.id !== id);
  }
}

class InMemoryAnalysisRepo implements IAnalysisRepository {
  private store: Analysis[] = [];

  async getForPatient(patientId: string): Promise<Analysis[]> {
    return this.store.filter((a) => a.patientId === patientId);
  }

  async getById(id: string): Promise<Analysis | null> {
    return this.store.find((a) => a.id === id) ?? null;
  }

  async create(input: CreateAnalysisInput): Promise<Analysis> {
    const a = buildAnalysis(input);
    this.store = [a, ...this.store];
    return a;
  }

  async update(
    id: string,
    partial: Partial<
      Pick<Analysis, "angles" | "manualCorrectionApplied" | "manualCorrectionJoint">
    >,
  ): Promise<void> {
    const idx = this.store.findIndex((a) => a.id === id);
    if (idx === -1) return;
    const existing = this.store[idx];
    if (!existing) return;
    this.store[idx] = { ...existing, ...partial };
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((a) => a.id !== id);
  }
}

let devAnalysisRepo: InMemoryAnalysisRepo | null = null;

/** Permet a `useAnalysisRepository` d'utiliser le repo dev quand actif. */
export function getDevAnalysisRepo(): IAnalysisRepository | null {
  return devAnalysisRepo;
}

const SEED_PATIENTS: Patient[] = [
  buildPatient({
    name: "Sophie Leclerc",
    dateOfBirth: "1991-03-12",
    morphologicalProfile: {
      sex: "female",
      heightCm: 165,
      weightKg: 58,
      pathology: "Scoliose idiopathique adolescente",
      pains: [
        { id: "x", location: "back", side: "left", intensity: 4, type: "chronic" },
      ],
    },
  }),
  buildPatient({
    name: "Marc Dubois",
    dateOfBirth: "1974-09-22",
    morphologicalProfile: {
      sex: "male",
      heightCm: 178,
      weightKg: 82,
      pathology: "Bilan HKA bilateral",
      activityLevel: "active",
    },
  }),
  buildPatient({
    name: "Aicha Benali",
    dateOfBirth: "1998-06-04",
    morphologicalProfile: {
      sex: "female",
      heightCm: 162,
      weightKg: 55,
      pathology: "Suivi post-operatoire genou",
      activityLevel: "moderate",
    },
  }),
];

let booted = false;

export function bootDevMode(): void {
  if (booted) return;
  if (!isDevMode()) return;
  booted = true;

  // Auth bypass — initialize() est aussi neutralise via le guard
  // `isDevMode()` dans AppNavigator, mais on l'override ici en defense en profondeur.
  useAuthStore.setState({
    isAuthenticated: true,
    isLoading: false,
    user: {
      id: "dev-user",
      email: "dev@bodyorthox.local",
      role: "practitioner",
      firstName: "Jean",
      lastName: "Martin",
    },
    initialize: async () => undefined,
  });

  // Onboarding deja complete + checkOnboarding no-op
  useOnboardingStore.setState({
    isCompleted: true,
    isLoading: false,
    checkOnboarding: async () => undefined,
  });

  // Repo en memoire pour les patients
  const repo = new InMemoryPatientRepo(SEED_PATIENTS);
  usePatientsStore.getState().setRepository(repo);
  void usePatientsStore.getState().loadPatients();

  // Repo en memoire pour les analyses + injection captureStore
  devAnalysisRepo = new InMemoryAnalysisRepo();
  useCaptureStore.getState().setRepository(devAnalysisRepo);
}
