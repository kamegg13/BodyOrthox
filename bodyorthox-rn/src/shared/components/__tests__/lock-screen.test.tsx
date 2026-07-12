import React from "react";
import { Alert, Platform } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { BiometricLockScreen_Screen } from "../lock-screen";
import { useAuthStore } from "../../../core/auth/auth-store";

const mockReplace = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ replace: mockReplace }),
}));

const mockUnlock = jest.fn();
let mockUseBiometricAuth = {
  unlock: mockUnlock,
  isAuthenticating: false,
  error: null as string | null,
  isUnlocked: false,
};
jest.mock("../../../core/auth/use-biometric-auth", () => ({
  useBiometricAuth: () => mockUseBiometricAuth,
}));

jest.mock("../../../features/onboarding/store/onboarding-store", () => ({
  useOnboardingStore: (selector: (s: { isCompleted: boolean }) => unknown) =>
    selector({ isCompleted: true }),
}));

jest.mock("../../../core/auth/auth-store");

describe("BiometricLockScreen_Screen (lock-screen wrapper)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBiometricAuth = {
      unlock: mockUnlock,
      isAuthenticating: false,
      error: null,
      isUnlocked: false,
    };
    (useAuthStore as unknown as jest.Mock).mockImplementation(
      (selector: (s: { logout: () => void }) => unknown) =>
        selector({ logout: mockLogout }),
    );
  });

  const mockLogout = jest.fn();

  it("renders the logout link always, with no fallback other than it", () => {
    const { getByTestId } = render(<BiometricLockScreen_Screen />);
    expect(getByTestId("lock-logout-button")).toBeTruthy();
  });

  it("asks for confirmation before logging out (native)", () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getByTestId } = render(<BiometricLockScreen_Screen />);

    fireEvent.press(getByTestId("lock-logout-button"));

    expect(alertSpy).toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("calls the auth store logout once the user confirms (native)", () => {
    jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons) => {
      const confirmButton = buttons?.find((b) => b.text === "Se déconnecter");
      confirmButton?.onPress?.();
    });
    const { getByTestId } = render(<BiometricLockScreen_Screen />);

    fireEvent.press(getByTestId("lock-logout-button"));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("does not log out if the user cancels the confirmation (native)", () => {
    jest.spyOn(Alert, "alert").mockImplementation(() => {
      // simulate cancel: no button pressed
    });
    const { getByTestId } = render(<BiometricLockScreen_Screen />);

    fireEvent.press(getByTestId("lock-logout-button"));

    expect(mockLogout).not.toHaveBeenCalled();
  });

  it("confirms via window.confirm on web and logs out on accept", () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, "OS", { get: () => "web" });
    (global as unknown as { confirm: jest.Mock }).confirm = jest
      .fn()
      .mockReturnValue(true);

    const { getByTestId } = render(<BiometricLockScreen_Screen />);
    fireEvent.press(getByTestId("lock-logout-button"));

    expect(mockLogout).toHaveBeenCalledTimes(1);
    Object.defineProperty(Platform, "OS", { get: () => originalOS });
  });
});
