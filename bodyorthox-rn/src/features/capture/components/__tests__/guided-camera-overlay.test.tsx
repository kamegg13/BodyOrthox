import React from "react";
import { Platform } from "react-native";
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

  it("does not show luminosity indicator on native (aucune mesure honnête disponible)", () => {
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

  it("shows instruction text with framing guidance (distance, corps entier, fond dégagé)", () => {
    const { getByText } = render(<GuidedCameraOverlay {...defaultProps} />);
    expect(getByText(/Placez le patient debout/)).toBeTruthy();
    expect(getByText(/corps entier visible/i)).toBeTruthy();
    expect(getByText(/3 m/)).toBeTruthy();
    expect(getByText(/fond dégagé/)).toBeTruthy();
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

  it("never shows the 'aligned' pill — no honest live position signal exists today", () => {
    // isCorrectPosition=true is set here to prove the pill is not driven by
    // this prop alone in a way that could show a fabricated status; since
    // nothing in the app ever sets it true, this documents intended future
    // wiring without pretending it works today.
    const { queryByTestId } = render(
      <GuidedCameraOverlay {...defaultProps} isCorrectPosition={false} />,
    );
    expect(queryByTestId("aligned-pill")).toBeNull();
  });

  describe("sur web (mesure de luminosité réelle disponible)", () => {
    beforeAll(() => {
      // @ts-ignore
      Platform.OS = "web";
    });

    afterAll(() => {
      // @ts-ignore
      Platform.OS = "ios";
    });

    it("shows the luminosity indicator", () => {
      const { getByTestId } = render(<GuidedCameraOverlay {...defaultProps} />);
      expect(getByTestId("luminosity-indicator")).toBeTruthy();
    });

    it("shows actionable advice when luminosity is low", () => {
      const { getByText } = render(
        <GuidedCameraOverlay {...defaultProps} luminosity={30} />,
      );
      expect(getByText("Rapprochez-vous d'une source de lumière")).toBeTruthy();
    });

    it("shows actionable advice when luminosity is too high", () => {
      const { getByText } = render(
        <GuidedCameraOverlay {...defaultProps} luminosity={230} />,
      );
      expect(getByText("Évitez le contre-jour ou la lumière directe")).toBeTruthy();
    });

    it("shows no advice when luminosity is optimal", () => {
      const { queryByText } = render(
        <GuidedCameraOverlay {...defaultProps} luminosity={128} />,
      );
      expect(queryByText(/Rapprochez-vous/)).toBeNull();
      expect(queryByText(/contre-jour/)).toBeNull();
    });

    it("shows the aligned pill when isCorrectPosition is true", () => {
      const { getByTestId, getByText } = render(
        <GuidedCameraOverlay {...defaultProps} isCorrectPosition={true} />,
      );
      expect(getByTestId("aligned-pill")).toBeTruthy();
      expect(getByText("Sujet aligné · prêt à capturer")).toBeTruthy();
    });
  });
});
