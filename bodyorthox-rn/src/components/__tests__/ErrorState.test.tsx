import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ErrorState } from "../ErrorState";

describe("ErrorState", () => {
  it("renders the message", () => {
    const { getByText } = render(<ErrorState message="Réseau indisponible" />);
    expect(getByText("Réseau indisponible")).toBeTruthy();
  });

  it("shows the default title", () => {
    const { getByText } = render(<ErrorState message="Erreur" />);
    expect(getByText("Une erreur est survenue")).toBeTruthy();
  });

  it("shows a custom title", () => {
    const { getByText } = render(
      <ErrorState message="Erreur" title="Échec du chargement" />,
    );
    expect(getByText("Échec du chargement")).toBeTruthy();
  });

  it("fires onAction when the action is pressed", () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <ErrorState message="Erreur" actionLabel="Réessayer" onAction={onAction} />,
    );
    fireEvent.press(getByText("Réessayer"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
