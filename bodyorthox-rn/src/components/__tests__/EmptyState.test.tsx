import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("renders title and message", () => {
    const { getByText } = render(
      <EmptyState title="Aucun patient" message="Ajoutez votre premier patient." />,
    );
    expect(getByText("Aucun patient")).toBeTruthy();
    expect(getByText("Ajoutez votre premier patient.")).toBeTruthy();
  });

  it("renders an action button and fires onAction", () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState title="Vide" actionLabel="Ajouter" onAction={onAction} />,
    );
    fireEvent.press(getByText("Ajouter"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("does not render an action without both label and handler", () => {
    const { queryByText } = render(
      <EmptyState title="Vide" actionLabel="Ajouter" />,
    );
    expect(queryByText("Ajouter")).toBeNull();
  });

  it("exposes testID", () => {
    const { getByTestId } = render(
      <EmptyState title="Vide" testID="empty" />,
    );
    expect(getByTestId("empty")).toBeTruthy();
  });
});
