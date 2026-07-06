import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ListRow } from "../ListRow";

describe("ListRow", () => {
  it("renders label and value", () => {
    const { getByText } = render(<ListRow label="Langue" value="Français" />);
    expect(getByText("Langue")).toBeTruthy();
    expect(getByText("Français")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <ListRow label="Compte" onPress={onPress} testID="row-account" />,
    );
    fireEvent.press(getByTestId("row-account"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("has button accessibility role", () => {
    const { getByTestId } = render(
      <ListRow label="Compte" onPress={jest.fn()} testID="row" />,
    );
    expect(getByTestId("row").props.accessibilityRole).toBe("button");
  });

  it("does not fire onPress when disabled", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <ListRow label="Compte" onPress={onPress} disabled testID="row" />,
    );
    fireEvent.press(getByTestId("row"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders destructive variant", () => {
    const { getByText } = render(
      <ListRow label="Supprimer le compte" destructive onPress={jest.fn()} />,
    );
    expect(getByText("Supprimer le compte")).toBeTruthy();
  });
});
