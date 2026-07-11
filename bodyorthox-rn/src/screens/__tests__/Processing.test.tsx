import React from "react";
import { AccessibilityInfo } from "react-native";
import { render, waitFor, act } from "@testing-library/react-native";
import { Processing } from "../Processing";

describe("Processing", () => {
  it("affiche une confirmation courte sans étapes factices ni bouton Annuler", () => {
    const { getByText, queryByText } = render(<Processing />);
    expect(getByText("Analyse enregistrée")).toBeTruthy();
    expect(queryByText("Annuler")).toBeNull();
    expect(queryByText("Détection des landmarks")).toBeNull();
    expect(queryByText("Analyse ML en cours")).toBeNull();
  });

  it("annonce la confirmation aux lecteurs d'écran", () => {
    const announceSpy = jest.spyOn(AccessibilityInfo, "announceForAccessibility");
    render(<Processing title="Analyse enregistrée" />);
    expect(announceSpy).toHaveBeenCalledWith("Analyse enregistrée");
  });

  it("respecte reduced-motion : pas d'animation bloquante, le contenu reste visible immédiatement", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    const { getByText } = render(<Processing />);
    await act(async () => {
      await waitFor(() => expect(getByText("Analyse enregistrée")).toBeTruthy());
    });
  });
});
