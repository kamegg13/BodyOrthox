import React from "react";
import { render } from "@testing-library/react-native";
import { GuidedCameraOverlay } from "../guided-camera-overlay";
import { CapturePhase } from "../../domain/capture-state";

describe("GuidedCameraOverlay", () => {
  const defaultProps = {
    phase: { type: "ready" } as CapturePhase,
    frameCount: 0,
    luminosity: 128,
    isCorrectPosition: true,
  };

  it("renders with testID", () => {
    const { getByTestId } = render(<GuidedCameraOverlay {...defaultProps} />);
    expect(getByTestId("guided-camera-overlay")).toBeTruthy();
  });

  it("does not show luminosity indicator", () => {
    const { queryByTestId } = render(<GuidedCameraOverlay {...defaultProps} />);
    expect(queryByTestId("luminosity-indicator")).toBeNull();
  });

  it("shows frame count when recording", () => {
    const { getByText } = render(
      <GuidedCameraOverlay
        {...defaultProps}
        phase={{ type: "recording", frameCount: 25 }}
        frameCount={25}
      />,
    );
    expect(getByText("25 frames")).toBeTruthy();
  });

  it("shows RGPD banner at the top", () => {
    const { getByTestId } = render(<GuidedCameraOverlay {...defaultProps} />);
    expect(getByTestId("rgpd-banner")).toBeTruthy();
  });

  it("shows instruction text", () => {
    const { getByText } = render(<GuidedCameraOverlay {...defaultProps} />);
    expect(getByText(/Placez le patient debout/)).toBeTruthy();
    expect(getByText(/Corps entier visible/)).toBeTruthy();
  });

  it("shows processing text when processing", () => {
    const { getByText } = render(
      <GuidedCameraOverlay {...defaultProps} phase={{ type: "processing" }} />,
    );
    expect(getByText(/Analyse en cours/)).toBeTruthy();
  });

  it("shows error text when error phase", () => {
    const { getByText } = render(
      <GuidedCameraOverlay
        {...defaultProps}
        phase={{ type: "error", message: "Camera error" }}
      />,
    );
    expect(getByText(/Camera error/)).toBeTruthy();
  });
});
