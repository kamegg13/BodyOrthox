/**
 * Écran de connexion — désormais OPTIONNEL (modal depuis Réglages › Compte).
 * Branding « Antidote Boost », fermeture possible, retour après connexion.
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { LoginScreen } from "../login-screen";
import { useAuthStore } from "../../../../core/auth/auth-store";

const mockGoBack = jest.fn();
let mockCanGoBack = true;
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    canGoBack: () => mockCanGoBack,
  }),
}));

jest.mock("../../../../core/auth/auth-store");

const mockLogin = jest.fn();

describe("LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack = true;
    mockLogin.mockResolvedValue(undefined);
    (useAuthStore as unknown as jest.Mock).mockImplementation(
      (selector: (s: { login: jest.Mock }) => unknown) =>
        selector({ login: mockLogin }),
    );
  });

  it("affiche le titre de marque « Antidote Boost »", () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText("Antidote Boost")).toBeTruthy();
  });

  it("précise que l'app fonctionne sans compte", () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText(/fonctionne sans compte/i)).toBeTruthy();
  });

  it("offre une fermeture quand on peut revenir en arrière (modal)", () => {
    const { getByTestId } = render(<LoginScreen />);

    fireEvent.press(getByTestId("login-close"));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("masque la fermeture s'il n'y a pas d'écran précédent", () => {
    mockCanGoBack = false;
    const { queryByTestId } = render(<LoginScreen />);
    expect(queryByTestId("login-close")).toBeNull();
  });

  it("signale une erreur quand email et mot de passe sont vides", () => {
    const { getByTestId, getByText } = render(<LoginScreen />);

    fireEvent.press(getByTestId("login-submit"));

    expect(getByText("Email et mot de passe requis")).toBeTruthy();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("revient à l'écran appelant après une connexion réussie", async () => {
    const { getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId("login-email"), "ortho@antidotesport.local");
    fireEvent.changeText(getByTestId("login-password"), "ChangeMe456!");
    fireEvent.press(getByTestId("login-submit"));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        "ortho@antidotesport.local",
        "ChangeMe456!",
      );
      expect(mockGoBack).toHaveBeenCalled();
    });
  });
});
