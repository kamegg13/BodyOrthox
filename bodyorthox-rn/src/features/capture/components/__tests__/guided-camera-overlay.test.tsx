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

  it("shows luminosity indicator", () => {
    const { getByTestId } = render(<GuidedCameraOverlay {...defaultProps} />);
    expect(getByTestId("luminosity-indicator")).toBeTruthy();
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

  it("shows RGPD banner at the top of the screen", () => {
    const { getByTestId, getByText } = render(
      <GuidedCameraOverlay {...defaultProps} />,
    );
    expect(getByTestId("rgpd-banner")).toBeTruthy();
    expect(
      getByText(/enregistr\u00e9es uniquement sur votre appareil/),
    ).toBeTruthy();
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

  it("shows silhouette icon inside frame", () => {
    const { getByText } = render(<GuidedCameraOverlay {...defaultProps} />);
    expect(getByText("\u267F")).toBeTruthy();
  });

  it("always shows silhouette guidance text", () => {
    const { getAllByText, getByText } = render(
      <GuidedCameraOverlay {...defaultProps} isCorrectPosition={true} />,
    );
    expect(getAllByText(/Placez le patient/).length).toBeGreaterThanOrEqual(1);
    expect(getByText(/Corps entier visible/)).toBeTruthy();
  });

  it("shows additional position hint when not in correct position", () => {
    const { getAllByText } = render(
      <GuidedCameraOverlay {...defaultProps} isCorrectPosition={false} />,
    );
    expect(getAllByText(/Placez le patient/).length).toBeGreaterThanOrEqual(2);
  });
});
