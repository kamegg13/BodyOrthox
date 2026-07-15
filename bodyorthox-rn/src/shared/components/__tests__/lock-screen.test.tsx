import React from "react";
import { render } from "@testing-library/react-native";
import { BiometricLockScreen_Screen } from "../lock-screen";

const mockReplace = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ replace: mockReplace }),
}));

let mockUseBiometricAuth = {
  unlock: jest.fn(),
  isAuthenticating: false,
  error: null as string | null,
  isUnlocked: false,
};
jest.mock("../../../core/auth/use-biometric-auth", () => ({
  useBiometricAuth: () => mockUseBiometricAuth,
}));

let mockOnboardingCompleted = true;
jest.mock("../../../features/onboarding/store/onboarding-store", () => ({
  useOnboardingStore: (selector: (s: { isCompleted: boolean }) => unknown) =>
    selector({ isCompleted: mockOnboardingCompleted }),
}));

describe("BiometricLockScreen_Screen (wrapper) — verrou découplé du compte", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBiometricAuth = {
      unlock: jest.fn(),
      isAuthenticating: false,
      error: null,
      isUnlocked: false,
    };
    mockOnboardingCompleted = true;
  });

  it("affiche le verrou et n'expose AUCUNE échappatoire de déconnexion", () => {
    const { getByTestId, queryByTestId } = render(
      <BiometricLockScreen_Screen />,
    );

    expect(getByTestId("biometric-lock-screen")).toBeTruthy();
    expect(queryByTestId("lock-logout-button")).toBeNull();
  });

  it("une fois déverrouillé, enchaîne vers MainTabs (onboarding déjà fait)", () => {
    mockUseBiometricAuth = { ...mockUseBiometricAuth, isUnlocked: true };

    render(<BiometricLockScreen_Screen />);

    expect(mockReplace).toHaveBeenCalledWith("MainTabs", {
      screen: "AnalysesTab",
    });
  });

  it("une fois déverrouillé sans onboarding, redirige vers Onboarding", () => {
    mockOnboardingCompleted = false;
    mockUseBiometricAuth = { ...mockUseBiometricAuth, isUnlocked: true };

    render(<BiometricLockScreen_Screen />);

    expect(mockReplace).toHaveBeenCalledWith("Onboarding");
  });
});
