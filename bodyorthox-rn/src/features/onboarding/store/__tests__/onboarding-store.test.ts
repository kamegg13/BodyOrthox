import { Platform } from "react-native";
import { useOnboardingStore } from "../onboarding-store";

// Mock localStorage for web platform
const mockLocalStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: jest.fn((key: string) => mockLocalStorage[key] ?? null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage[key];
  }),
  clear: jest.fn(() => {
    Object.keys(mockLocalStorage).forEach(
      (key) => delete mockLocalStorage[key],
    );
  }),
};

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("useOnboardingStore", () => {
  beforeEach(() => {
    // Reset store state
    useOnboardingStore.setState({
      isCompleted: false,
      isLoading: true,
    });
    // Clear localStorage mock
    localStorageMock.clear();
    Object.keys(mockLocalStorage).forEach(
      (key) => delete mockLocalStorage[key],
    );
    jest.clearAllMocks();

    // Default to web platform for localStorage access
    (Platform as any).OS = "web";
  });

  afterEach(() => {
    (Platform as any).OS = "ios";
  });

  describe("initial state", () => {
    it("starts with isCompleted false and isLoading true", () => {
      const state = useOnboardingStore.getState();
      expect(state.isCompleted).toBe(false);
      expect(state.isLoading).toBe(true);
    });
  });

  describe("checkOnboarding", () => {
    it("reads false from storage when key is absent", async () => {
      await useOnboardingStore.getState().checkOnboarding();
      const state = useOnboardingStore.getState();
      expect(state.isCompleted).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it("reads true from storage when key is set", async () => {
      mockLocalStorage["onboarding_completed"] = "true";
      await useOnboardingStore.getState().checkOnboarding();
      const state = useOnboardingStore.getState();
      expect(state.isCompleted).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('reads false when storage value is not "true"', async () => {
      mockLocalStorage["onboarding_completed"] = "false";
      await useOnboardingStore.getState().checkOnboarding();
      expect(useOnboardingStore.getState().isCompleted).toBe(false);
    });
  });

  describe("completeOnboarding", () => {
    it("writes true to storage and sets isCompleted", async () => {
      await useOnboardingStore.getState().completeOnboarding();
      const state = useOnboardingStore.getState();
      expect(state.isCompleted).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "onboarding_completed",
        "true",
      );
    });

    it("persists so checkOnboarding reads true after", async () => {
      await useOnboardingStore.getState().completeOnboarding();

      // Reset in-memory state
      useOnboardingStore.setState({ isCompleted: false, isLoading: true });

      await useOnboardingStore.getState().checkOnboarding();
      expect(useOnboardingStore.getState().isCompleted).toBe(true);
    });
  });

  describe("native platform fallback", () => {
    it("returns false on native when no AsyncStorage", async () => {
      (Platform as any).OS = "ios";
      await useOnboardingStore.getState().checkOnboarding();
      expect(useOnboardingStore.getState().isCompleted).toBe(false);
      expect(useOnboardingStore.getState().isLoading).toBe(false);
    });
  });
});
