import { create } from "zustand";
import { Platform } from "react-native";

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
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  }
  // On native, AsyncStorage would be used — for MVP/web-first, localStorage suffices
  return false;
}

function writeToStorage(value: boolean): void {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // Storage not available — fail silently
    }
    return;
  }
  // On native, AsyncStorage would be used
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
