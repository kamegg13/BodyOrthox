import { create } from "zustand";

const STORAGE_KEY = "onboarding_completed";

/** In-memory fallback when localStorage is unavailable (Android Hermes). */
let inMemoryCompleted = false;

interface OnboardingState {
  isCompleted: boolean;
  isLoading: boolean;
}

interface OnboardingActions {
  checkOnboarding(): Promise<void>;
  completeOnboarding(): Promise<void>;
}

function readFromStorage(): boolean {
  try {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) === "true";
    }
  } catch {
    // localStorage not available on Android — in-memory only
  }
  return inMemoryCompleted;
}

function writeToStorage(value: boolean): void {
  inMemoryCompleted = value;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(value));
    }
  } catch {
    // localStorage not available on Android — in-memory only
  }
}

export const useOnboardingStore = create<OnboardingState & OnboardingActions>()(
  (set) => ({
    isCompleted: false,
    isLoading: true,

    async checkOnboarding() {
      const completed = readFromStorage();
      set({ isCompleted: completed, isLoading: false });
    },

    async completeOnboarding() {
      writeToStorage(true);
      set({ isCompleted: true });
    },
  }),
);
