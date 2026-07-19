import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ChoiceChips } from "../ChoiceChips";

const OPTIONS = [
  { value: "left" as const, label: "Gaucher" },
  { value: "right" as const, label: "Droitier" },
];

describe("ChoiceChips", () => {
  it("rend une option par valeur avec son label", () => {
    const { getByText } = render(
      <ChoiceChips options={OPTIONS} value={null} onChange={jest.fn()} />,
    );
    expect(getByText("Gaucher")).toBeTruthy();
    expect(getByText("Droitier")).toBeTruthy();
  });

  it("dérive le testID de chaque option depuis testIDPrefix", () => {
    const { getByTestId } = render(
      <ChoiceChips
        options={OPTIONS}
        value={null}
        onChange={jest.fn()}
        testIDPrefix="np-laterality"
      />,
    );
    expect(getByTestId("np-laterality-left")).toBeTruthy();
    expect(getByTestId("np-laterality-right")).toBeTruthy();
  });

  it("marque l'option sélectionnée comme checked", () => {
    const { getByTestId } = render(
      <ChoiceChips
        options={OPTIONS}
        value="left"
        onChange={jest.fn()}
        testIDPrefix="np-laterality"
      />,
    );
    expect(getByTestId("np-laterality-left").props.accessibilityState.checked).toBe(true);
    expect(getByTestId("np-laterality-right").props.accessibilityState.checked).toBe(false);
  });

  it("appelle onChange avec la valeur pressée", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <ChoiceChips
        options={OPTIONS}
        value={null}
        onChange={onChange}
        testIDPrefix="np-laterality"
      />,
    );
    fireEvent.press(getByTestId("np-laterality-right"));
    expect(onChange).toHaveBeenCalledWith("right");
  });

  describe("variante chips (déselectionnable par défaut)", () => {
    it("déselectionne (onChange(null)) quand on rappuie sur l'option déjà active", () => {
      const onChange = jest.fn();
      const { getByTestId } = render(
        <ChoiceChips
          options={OPTIONS}
          value="left"
          onChange={onChange}
          testIDPrefix="np-laterality"
        />,
      );
      fireEvent.press(getByTestId("np-laterality-left"));
      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe("variante segmented (jamais déselectionnable par défaut)", () => {
    const MODE_OPTIONS = [
      { value: "byAnalysis" as const, label: "Par analyse", testID: "toggle-by-analysis" },
      { value: "byDate" as const, label: "Par date", testID: "toggle-by-date" },
    ];

    it("garde la valeur active quand on rappuie dessus", () => {
      const onChange = jest.fn();
      const { getByTestId } = render(
        <ChoiceChips
          variant="segmented"
          options={MODE_OPTIONS}
          value="byAnalysis"
          onChange={onChange}
          testID="x-axis-toggle"
        />,
      );
      fireEvent.press(getByTestId("toggle-by-analysis"));
      expect(onChange).toHaveBeenCalledWith("byAnalysis");
    });

    it("expose le testID explicite par option et le testID du conteneur", () => {
      const { getByTestId } = render(
        <ChoiceChips
          variant="segmented"
          options={MODE_OPTIONS}
          value="byAnalysis"
          onChange={jest.fn()}
          testID="x-axis-toggle"
        />,
      );
      expect(getByTestId("x-axis-toggle")).toBeTruthy();
      expect(getByTestId("toggle-by-analysis")).toBeTruthy();
      expect(getByTestId("toggle-by-date")).toBeTruthy();
    });
  });
});
