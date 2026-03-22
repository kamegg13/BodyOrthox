import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { PatientListTile } from "../patient-list-tile";
import { Patient } from "../../domain/patient";

const mockPatient: Patient = {
  id: "p1",
  name: "Jean Dupont",
  dateOfBirth: "1990-05-15",
  morphologicalProfile: null,
  createdAt: "2024-01-01T00:00:00Z",
};

describe("PatientListTile", () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it("renders patient name", () => {
    const { getByText } = render(
      <PatientListTile patient={mockPatient} onPress={mockOnPress} />,
    );
    expect(getByText("Jean Dupont")).toBeTruthy();
  });

  it("renders patient age when no last analysis date", () => {
    const tree = render(
      <PatientListTile patient={mockPatient} onPress={mockOnPress} />,
    );
    expect(tree.getByText(/ans/)).toBeTruthy();
  });

  it("calls onPress with patient when pressed", () => {
    const { getByTestId } = render(
      <PatientListTile
        patient={mockPatient}
        onPress={mockOnPress}
        testID="tile-1"
      />,
    );

    fireEvent.press(getByTestId("tile-1"));
    expect(mockOnPress).toHaveBeenCalledWith(mockPatient);
  });

  it("renders initials in avatar", () => {
    const { getByText } = render(
      <PatientListTile patient={mockPatient} onPress={mockOnPress} />,
    );
    // "Jean Dupont" -> "JD"
    expect(getByText("JD")).toBeTruthy();
  });

  it("has accessibility role of button", () => {
    const { getByTestId } = render(
      <PatientListTile
        patient={mockPatient}
        onPress={mockOnPress}
        testID="tile-1"
      />,
    );
    const tile = getByTestId("tile-1");
    expect(tile.props.accessibilityRole).toBe("button");
  });

  it("has accessibility label with patient name and age", () => {
    const { getByTestId } = render(
      <PatientListTile
        patient={mockPatient}
        onPress={mockOnPress}
        testID="tile-1"
      />,
    );
    const tile = getByTestId("tile-1");
    expect(tile.props.accessibilityLabel).toContain("Jean Dupont");
  });

  it("renders chevron indicator", () => {
    const { getByText } = render(
      <PatientListTile patient={mockPatient} onPress={mockOnPress} />,
    );
    expect(getByText("\u203A")).toBeTruthy();
  });

  it("renders NORMAL badge when statusBadge is NORMAL", () => {
    const { getByText } = render(
      <PatientListTile
        patient={mockPatient}
        onPress={mockOnPress}
        statusBadge="NORMAL"
      />,
    );
    expect(getByText("NORMAL")).toBeTruthy();
  });

  it("renders A SURVEILLER badge when statusBadge is A_SURVEILLER", () => {
    const { getByText } = render(
      <PatientListTile
        patient={mockPatient}
        onPress={mockOnPress}
        statusBadge="A_SURVEILLER"
      />,
    );
    expect(getByText("A SURVEILLER")).toBeTruthy();
  });

  it("renders HORS NORME badge when statusBadge is HORS_NORME", () => {
    const { getByText } = render(
      <PatientListTile
        patient={mockPatient}
        onPress={mockOnPress}
        statusBadge="HORS_NORME"
      />,
    );
    expect(getByText("HORS NORME")).toBeTruthy();
  });

  it("does not render badge when statusBadge is null", () => {
    const { queryByText } = render(
      <PatientListTile patient={mockPatient} onPress={mockOnPress} />,
    );
    expect(queryByText("NORMAL")).toBeNull();
    expect(queryByText("A SURVEILLER")).toBeNull();
    expect(queryByText("HORS NORME")).toBeNull();
  });

  it("shows last analysis info when lastAnalysisDate is provided", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { getByText } = render(
      <PatientListTile
        patient={mockPatient}
        onPress={mockOnPress}
        lastAnalysisDate={yesterday.toISOString()}
        lastAnalysisType="Analyse marche"
      />,
    );
    expect(getByText(/Analyse marche/)).toBeTruthy();
    expect(getByText(/Hier/)).toBeTruthy();
  });
});
