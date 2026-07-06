import { create } from "zustand";
import { getKeyValueStorage } from "../../../core/storage/key-value-storage";

const STORAGE_KEY = "onboarding_completed";

interface OnboardingState {
  isCompleted: boolean;
  isLoading: boolean;
}

interface OnboardingActions {
  checkOnboarding(): Promise<void>;
  completeOnboarding(): Promise<void>;
}

function readFromStorage(): boolean {
  return getKeyValueStorage().getItem(STORAGE_KEY) === "true";
}

function writeToStorage(value: boolean): void {
  getKeyValueStorage().setItem(STORAGE_KEY, String(value));
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
