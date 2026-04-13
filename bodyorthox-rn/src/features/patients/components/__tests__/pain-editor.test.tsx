import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { PainEditor } from "../pain-editor";
import { PainEntry } from "../../domain/patient";

const pain1: PainEntry = {
  id: "pain1",
  location: "knee",
  side: "left",
  intensity: 7,
  type: "chronic",
};

describe("PainEditor", () => {
  it("renders existing pains as pills", () => {
    const { getByText } = render(
      <PainEditor pains={[pain1]} onChange={jest.fn()} />
    );
    expect(getByText(/Genou/i)).toBeTruthy();
  });

  it("calls onChange when a pain is removed", () => {
    const onChange = jest.fn();
    const { getAllByRole } = render(
      <PainEditor pains={[pain1]} onChange={onChange} />
    );
    const buttons = getAllByRole("button");
    const removeButton = buttons.find(b => b.props.accessibilityLabel === "Supprimer douleur");
    fireEvent.press(removeButton!);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("shows add form when + button pressed", () => {
    const { getByTestId, getByText } = render(
      <PainEditor pains={[]} onChange={jest.fn()} />
    );
    fireEvent.press(getByTestId("add-pain-button"));
    expect(getByText(/Localisation/i)).toBeTruthy();
  });

  it("calls onChange with new pain when form submitted", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PainEditor pains={[]} onChange={onChange} />
    );
    fireEvent.press(getByTestId("add-pain-button"));
    fireEvent.press(getByTestId("confirm-pain-button"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toHaveLength(1);
  });
});
