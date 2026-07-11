import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { AccountScreen } from "../account-screen";
import { useAuthStore } from "../../../../core/auth/auth-store";

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("../../../../core/auth/auth-store");

function mockUser(role: "admin" | "practitioner") {
  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: unknown) => unknown) =>
      selector({
        logout: jest.fn(),
        user: { email: "test@bodyorthox.com", role },
      }),
  );
}

describe("AccountScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("praticien non-admin : affiche la mention Calibration HKA gérée par l'administrateur, sans lien cliquable", () => {
    mockUser("practitioner");
    const { getByTestId, queryByTestId } = render(<AccountScreen />);

    expect(getByTestId("calibration-admin-only-info")).toBeTruthy();
    expect(queryByTestId("calibration-button")).toBeNull();
  });

  it("admin : garde le lien Calibration HKA cliquable, sans la mention informative", () => {
    mockUser("admin");
    const { getByTestId, queryByTestId } = render(<AccountScreen />);

    expect(getByTestId("calibration-button")).toBeTruthy();
    expect(queryByTestId("calibration-admin-only-info")).toBeNull();
  });

  it("propose « Revoir l'introduction » et navigue vers Onboarding en mode révision", () => {
    mockUser("practitioner");
    const { getByTestId } = render(<AccountScreen />);

    fireEvent.press(getByTestId("review-onboarding-button"));

    expect(mockNavigate).toHaveBeenCalledWith("Onboarding", { mode: "review" });
  });
});
