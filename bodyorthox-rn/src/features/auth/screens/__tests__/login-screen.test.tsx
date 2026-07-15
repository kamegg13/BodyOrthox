/**
 * Branding de l'écran de connexion — décision 2026-07-15 : le héro porte le
 * titre « Antidote Boost » (remplace le logo BodyOrthox, lui-même successeur
 * du titre « Antidote Sport »).
 */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { LoginScreen } from "../login-screen";

describe("LoginScreen", () => {
  it("affiche le titre de marque « Antidote Boost »", () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText("Antidote Boost")).toBeTruthy();
  });

  it("garde la tagline sous le titre", () => {
    const { getByText } = render(<LoginScreen />);
    expect(
      getByText("Orthopédie · Performance · Réathlétisation"),
    ).toBeTruthy();
  });

  it("signale une erreur quand email et mot de passe sont vides", () => {
    const { getByTestId, getByText } = render(<LoginScreen />);

    fireEvent.press(getByTestId("login-submit"));

    expect(getByText("Email et mot de passe requis")).toBeTruthy();
  });
});
