import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { AccountScreen } from "../account-screen";
import { useAuthStore } from "../../../../core/auth/auth-store";
import { __resetKeyValueStorage } from "../../../../core/storage/key-value-storage";

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("../../../../core/auth/auth-store");

function mockSignedIn(role: "admin" | "practitioner") {
  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: unknown) => unknown) =>
      selector({
        logout: jest.fn(),
        user: { email: "test@bodyorthox.com", role },
        isAuthenticated: true,
      }),
  );
}

function mockSignedOut() {
  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: unknown) => unknown) =>
      selector({ logout: jest.fn(), user: null, isAuthenticated: false }),
  );
}

describe("AccountScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetKeyValueStorage();
  });

  it("déconnecté : propose « Se connecter » et navigue vers Login, sans section session", () => {
    mockSignedOut();
    const { getByTestId, queryByTestId } = render(<AccountScreen />);

    expect(getByTestId("account-signed-out-info")).toBeTruthy();
    expect(queryByTestId("logout-button")).toBeNull();

    fireEvent.press(getByTestId("login-button"));

    expect(mockNavigate).toHaveBeenCalledWith("Login");
  });

  it("connecté praticien : mention Calibration gérée par l'admin, pas de lien", () => {
    mockSignedIn("practitioner");
    const { getByTestId, queryByTestId } = render(<AccountScreen />);

    expect(getByTestId("calibration-admin-only-info")).toBeTruthy();
    expect(queryByTestId("calibration-button")).toBeNull();
    expect(getByTestId("logout-button")).toBeTruthy();
  });

  it("connecté admin : garde le lien Calibration HKA cliquable, sans la mention", () => {
    mockSignedIn("admin");
    const { getByTestId, queryByTestId } = render(<AccountScreen />);

    expect(getByTestId("calibration-button")).toBeTruthy();
    expect(queryByTestId("calibration-admin-only-info")).toBeNull();
  });

  it("propose « Revoir l'introduction » et navigue vers Onboarding en mode révision", () => {
    mockSignedIn("practitioner");
    const { getByTestId } = render(<AccountScreen />);

    fireEvent.press(getByTestId("review-onboarding-button"));

    expect(mockNavigate).toHaveBeenCalledWith("Onboarding", { mode: "review" });
  });

  it("le toggle Face ID / Touch ID persiste l'activation du verrou biométrique", () => {
    mockSignedOut();
    const { getByTestId } = render(<AccountScreen />);

    // Opt-in : off par défaut → on l'active.
    fireEvent(getByTestId("faceid-toggle"), "valueChange", true);

    // Un nouveau montage lit l'état persisté.
    const second = render(<AccountScreen />);
    expect(second.getByTestId("faceid-toggle").props.value).toBe(true);
  });
});
