/**
 * LegalScreen affiche les mentions légales + la politique de confidentialité
 * RGPD. On vérifie le rendu des sections attendues, la présence du texte
 * légal officiel (via LEGAL_CONSTANTS — jamais de string en dur, cf.
 * commentaire du composant), et la navigation retour.
 *
 * @react-navigation/native est mocké globalement dans jest.setup.ts avec un
 * useNavigation() par défaut ; on le surcharge ici pour espionner goBack().
 */
import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { LegalScreen } from "../legal-screen";
import { LEGAL_CONSTANTS } from "../../../../core/legal/legal-constants";

const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

describe("LegalScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("affiche le disclaimer non-DM officiel issu de LEGAL_CONSTANTS", () => {
    const { getByText } = render(<LegalScreen />);
    expect(getByText(LEGAL_CONSTANTS.mdrDisclaimer)).toBeTruthy();
  });

  it("affiche les titres des sections légales attendues", () => {
    const { getByText } = render(<LegalScreen />);
    expect(getByText("Statut de l’outil")).toBeTruthy();
    expect(getByText("Éditeur")).toBeTruthy();
    expect(getByText("Politique de confidentialité")).toBeTruthy();
  });

  it("affiche les sous-titres de la politique de confidentialité", () => {
    const { getByText } = render(<LegalScreen />);
    expect(getByText("Données des personnes suivies")).toBeTruthy();
    expect(getByText("Données transmises à nos serveurs")).toBeTruthy();
    expect(getByText("Partage de rapports")).toBeTruthy();
    expect(getByText("Conservation et suppression")).toBeTruthy();
    expect(getByText("Vos droits")).toBeTruthy();
    expect(getByText("Sécurité et absence de traceurs")).toBeTruthy();
  });

  it("affirme que les données patient restent on-device et ne sont jamais transmises", () => {
    const { getByText } = render(<LegalScreen />);
    expect(getByText(/jamais transmis à nos serveurs/)).toBeTruthy();
  });

  it("mentionne l'e-mail de contact pour l'exercice des droits RGPD", () => {
    const { getAllByText } = render(<LegalScreen />);
    expect(getAllByText(/contact@antidote-sport\.fr/).length).toBeGreaterThan(0);
  });

  it("mentionne le droit de réclamation auprès de la CNIL", () => {
    const { getByText } = render(<LegalScreen />);
    expect(getByText(/CNIL/)).toBeTruthy();
  });

  it("rend le testID racine 'legal-screen'", () => {
    const { getByTestId } = render(<LegalScreen />);
    expect(getByTestId("legal-screen")).toBeTruthy();
  });

  it("affiche un bouton retour accessible qui appelle navigation.goBack()", () => {
    const { getByLabelText } = render(<LegalScreen />);
    fireEvent.press(getByLabelText("Retour"));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
