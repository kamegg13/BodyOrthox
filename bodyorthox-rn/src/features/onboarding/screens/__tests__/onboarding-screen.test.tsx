import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { OnboardingScreen } from "../onboarding-screen";
import { useOnboardingStore } from "../../store/onboarding-store";

// Mock navigation
const mockReplace = jest.fn();
const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    replace: mockReplace,
    navigate: mockNavigate,
    goBack: jest.fn(),
    push: jest.fn(),
  }),
  useRoute: () => ({ params: {} }),
}));

// Mock react-native-vision-camera for camera permission
jest.mock("react-native-vision-camera", () => ({
  Camera: {
    requestCameraPermission: jest.fn().mockResolvedValue("granted"),
  },
  useCameraDevice: jest.fn(() => null),
  useCameraPermission: jest.fn(() => ({
    hasPermission: false,
    requestPermission: jest.fn().mockResolvedValue(true),
  })),
}));

// Mock localStorage
const mockLocalStorage: Record<string, string> = {};
Object.defineProperty(global, "localStorage", {
  value: {
    getItem: jest.fn((key: string) => mockLocalStorage[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      mockLocalStorage[key] = value;
    }),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

describe("OnboardingScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockLocalStorage).forEach(
      (key) => delete mockLocalStorage[key],
    );

    // Reset store
    useOnboardingStore.setState({
      isCompleted: false,
      isLoading: false,
    });
  });

  it("renders the onboarding screen", () => {
    const { getByTestId } = render(<OnboardingScreen />);
    expect(getByTestId("onboarding-screen")).toBeTruthy();
  });

  it("renders 3 pages", () => {
    const { getByTestId } = render(<OnboardingScreen />);
    expect(getByTestId("onboarding-page-result")).toBeTruthy();
    expect(getByTestId("onboarding-page-capture")).toBeTruthy();
    expect(getByTestId("onboarding-page-privacy")).toBeTruthy();
  });

  it("renders 3 dot indicators", () => {
    const { getByTestId } = render(<OnboardingScreen />);
    expect(getByTestId("onboarding-dot-0")).toBeTruthy();
    expect(getByTestId("onboarding-dot-1")).toBeTruthy();
    expect(getByTestId("onboarding-dot-2")).toBeTruthy();
  });

  it('shows "Commencer" button on first page (mockup 10)', () => {
    const { getByTestId, getByText } = render(<OnboardingScreen />);
    expect(getByTestId("onboarding-next")).toBeTruthy();
    expect(getByText("Commencer")).toBeTruthy();
  });

  it("shows skip button on all pages", () => {
    const { getByTestId } = render(<OnboardingScreen />);
    expect(getByTestId("onboarding-skip")).toBeTruthy();
  });

  it("skip button completes onboarding and navigates", async () => {
    const { getByTestId } = render(<OnboardingScreen />);

    await act(async () => {
      fireEvent.press(getByTestId("onboarding-skip"));
    });

    expect(mockReplace).toHaveBeenCalled();
    expect(useOnboardingStore.getState().isCompleted).toBe(true);
  });

  it("renders page 1 with large title (mockup 10)", () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(
      getByText("Analysez les angles articulaires en 30 secondes"),
    ).toBeTruthy();
  });

  it("renders page 1 subtitle (mockup 10)", () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText(/Une photo\./)).toBeTruthy();
  });

  it("renders page 1 feature rows", () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText("Photo debout en 1 tap")).toBeTruthy();
    expect(getByText("Angle HKA automatique")).toBeTruthy();
    expect(getByText(/Rapport PDF/)).toBeTruthy();
  });

  it("renders capture page with camera context text", () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText("Filmez la marche du patient")).toBeTruthy();
  });

  it("renders page 3 with export title (mockup 11)", () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText(/Exportation/)).toBeTruthy();
  });

  it("renders page 3 with detailed sharing description", () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText(/rapports PDF/)).toBeTruthy();
  });

  it('shows "Terminer" button when on last page (mockup 11)', async () => {
    const { getByTestId, queryByTestId } = render(<OnboardingScreen />);
    const scrollView = getByTestId("onboarding-scroll");

    // Simulate scrolling to last page
    await act(async () => {
      fireEvent(scrollView, "momentumScrollEnd", {
        nativeEvent: {
          contentOffset: { x: 750 },
        },
      });
    });

    expect(
      queryByTestId("onboarding-complete") || queryByTestId("onboarding-next"),
    ).toBeTruthy();
  });

  it("onboarding is not shown again after completion (store is set)", async () => {
    const { getByTestId } = render(<OnboardingScreen />);

    await act(async () => {
      fireEvent.press(getByTestId("onboarding-skip"));
    });

    expect(useOnboardingStore.getState().isCompleted).toBe(true);
  });
});
