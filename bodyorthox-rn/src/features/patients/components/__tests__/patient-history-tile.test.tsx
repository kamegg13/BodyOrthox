import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { PatientHistoryTile } from "../patient-history-tile";
import { Analysis } from "../../../capture/domain/analysis";
import { Colors } from "../../../../shared/design-system/colors";

const highConfidenceAnalysis: Analysis = {
  id: "a1",
  patientId: "p1",
  createdAt: "2026-03-19T10:00:00Z",
  angles: { kneeAngle: 5.2, hipAngle: 170.1, ankleAngle: 90.5 },
  confidenceScore: 0.92,
  manualCorrectionApplied: false,
  manualCorrectionJoint: null,
};

const mediumConfidenceAnalysis: Analysis = {
  ...highConfidenceAnalysis,
  id: "a2",
  confidenceScore: 0.72,
};

const lowConfidenceAnalysis: Analysis = {
  ...highConfidenceAnalysis,
  id: "a3",
  confidenceScore: 0.45,
};

describe("PatientHistoryTile", () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it("renders the analysis date", () => {
    const { getByText } = render(
      <PatientHistoryTile
        analysis={highConfidenceAnalysis}
        onPress={mockOnPress}
      />,
    );
    // Date formatted via formatDisplayDateTime - just check it renders something date-like
    expect(getByText(/2026/)).toBeTruthy();
  });

  it("renders knee angle", () => {
    const { getByText } = render(
      <PatientHistoryTile
        analysis={highConfidenceAnalysis}
        onPress={mockOnPress}
      />,
    );
    expect(getByText("5.2°")).toBeTruthy();
    expect(getByText("Genou")).toBeTruthy();
  });

  it("renders hip angle", () => {
    const { getByText } = render(
      <PatientHistoryTile
        analysis={highConfidenceAnalysis}
        onPress={mockOnPress}
      />,
    );
    expect(getByText("170.1°")).toBeTruthy();
    expect(getByText("Hanche")).toBeTruthy();
  });

  it("renders ankle angle", () => {
    const { getByText } = render(
      <PatientHistoryTile
        analysis={highConfidenceAnalysis}
        onPress={mockOnPress}
      />,
    );
    expect(getByText("90.5°")).toBeTruthy();
    expect(getByText("Cheville")).toBeTruthy();
  });

  it("renders confidence percentage", () => {
    const { getByText } = render(
      <PatientHistoryTile
        analysis={highConfidenceAnalysis}
        onPress={mockOnPress}
      />,
    );
    expect(getByText(/92%/)).toBeTruthy();
  });

  it("shows green badge for high confidence (>= 0.85)", () => {
    const { getByTestId } = render(
      <PatientHistoryTile
        analysis={highConfidenceAnalysis}
        onPress={mockOnPress}
      />,
    );
    const badge = getByTestId("confidence-badge");
    const bgColor = badge.props.style.find(
      (s: any) => s && s.backgroundColor,
    )?.backgroundColor;
    expect(bgColor).toBe(Colors.confidenceHigh);
  });

  it("shows orange badge for medium confidence (>= 0.60)", () => {
    const { getByTestId } = render(
      <PatientHistoryTile
        analysis={mediumConfidenceAnalysis}
        onPress={mockOnPress}
      />,
    );
    const badge = getByTestId("confidence-badge");
    const bgColor = badge.props.style.find(
      (s: any) => s && s.backgroundColor,
    )?.backgroundColor;
    expect(bgColor).toBe(Colors.confidenceMedium);
  });

  it("shows red badge for low confidence (< 0.60)", () => {
    const { getByTestId } = render(
      <PatientHistoryTile
        analysis={lowConfidenceAnalysis}
        onPress={mockOnPress}
      />,
    );
    const badge = getByTestId("confidence-badge");
    const bgColor = badge.props.style.find(
      (s: any) => s && s.backgroundColor,
    )?.backgroundColor;
    expect(bgColor).toBe(Colors.confidenceLow);
  });

  it('shows "Élevée" label for high confidence', () => {
    const { getByText } = render(
      <PatientHistoryTile
        analysis={highConfidenceAnalysis}
        onPress={mockOnPress}
      />,
    );
    expect(getByText(/Élevée/)).toBeTruthy();
  });

  it('shows "Moyenne" label for medium confidence', () => {
    const { getByText } = render(
      <PatientHistoryTile
        analysis={mediumConfidenceAnalysis}
        onPress={mockOnPress}
      />,
    );
    expect(getByText(/Moyenne/)).toBeTruthy();
  });

  it('shows "Faible" label for low confidence', () => {
    const { getByText } = render(
      <PatientHistoryTile
        analysis={lowConfidenceAnalysis}
        onPress={mockOnPress}
      />,
    );
    expect(getByText(/Faible/)).toBeTruthy();
  });

  it("calls onPress with the analysis when pressed", () => {
    const { getByTestId } = render(
      <PatientHistoryTile
        analysis={highConfidenceAnalysis}
        onPress={mockOnPress}
        testID="tile-1"
      />,
    );
    fireEvent.press(getByTestId("tile-1"));
    expect(mockOnPress).toHaveBeenCalledWith(highConfidenceAnalysis);
  });

  it("has accessibility role of button", () => {
    const { getByTestId } = render(
      <PatientHistoryTile
        analysis={highConfidenceAnalysis}
        onPress={mockOnPress}
        testID="tile-1"
      />,
    );
    expect(getByTestId("tile-1").props.accessibilityRole).toBe("button");
  });
});
