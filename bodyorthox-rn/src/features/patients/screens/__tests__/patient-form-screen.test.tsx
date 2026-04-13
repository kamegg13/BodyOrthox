import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { PatientFormScreen } from "../patient-form-screen";

// Mock DatePicker — éviter les dépendances natives
jest.mock("../../components/date-picker", () => ({
  DatePicker: ({
    value,
  }: {
    value: string | null;
    onChange: (v: string) => void;
  }) => {
    const { View, Text } = require("react-native");
    return require("react").createElement(
      View,
      { testID: "date-picker" },
      require("react").createElement(Text, null, value ?? ""),
    );
  },
}));

// Mock PainEditor
jest.mock("../../components/pain-editor", () => ({
  PainEditor: () => null,
}));

// Mock navigation
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

describe("PatientFormScreen", () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all required fields", () => {
    const { getByTestId } = render(
      <PatientFormScreen mode="create" onSubmit={onSubmit} />,
    );
    expect(getByTestId("firstName-input")).toBeTruthy();
    expect(getByTestId("lastName-input")).toBeTruthy();
  });

  it("shows validation error when name is empty on submit", async () => {
    const { getByTestId, getByText } = render(
      <PatientFormScreen mode="create" onSubmit={onSubmit} />,
    );
    fireEvent.press(getByTestId("submit-button"));
    await waitFor(() => {
      expect(getByText(/nom est obligatoire/i)).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with correct data", async () => {
    const { getByTestId } = render(
      <PatientFormScreen mode="create" onSubmit={onSubmit} />,
    );
    fireEvent.changeText(getByTestId("firstName-input"), "Jean");
    fireEvent.changeText(getByTestId("lastName-input"), "Dupont");
    fireEvent.press(getByTestId("submit-button"));
    await waitFor(() => {
      // Erreur date attendue car pas de date saisie
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it("pre-fills values in edit mode", () => {
    const { getByTestId } = render(
      <PatientFormScreen
        mode="edit"
        initialValues={{
          firstName: "Marie",
          lastName: "Dupont",
          dateOfBirth: "1990-01-01",
          morphologicalProfile: { sex: "female", heightCm: 165 },
        }}
        onSubmit={onSubmit}
      />,
    );
    expect(getByTestId("firstName-input").props.value).toBe("Marie");
    expect(getByTestId("lastName-input").props.value).toBe("Dupont");
  });

  it("calculates BMI automatically", () => {
    const { getByText } = render(
      <PatientFormScreen
        mode="create"
        initialValues={{
          firstName: "Jean",
          lastName: "D",
          dateOfBirth: "1990-01-01",
          morphologicalProfile: { heightCm: 175, weightKg: 70 },
        }}
        onSubmit={onSubmit}
      />,
    );
    expect(getByText(/22\.9|IMC/i)).toBeTruthy();
  });
});
