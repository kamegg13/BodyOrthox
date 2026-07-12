import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { CapturePreview } from "../capture-preview";

const baseProps = {
  previewUrl: "data:image/png;base64,xxx",
  isRecording: false,
  mlLoading: false,
  detectionError: null,
  lowConfidenceWarning: null,
  onAnalyze: jest.fn(),
  onRetake: jest.fn(),
};

describe("CapturePreview — états d'analyse", () => {
  it("affiche l'erreur ML dans son style erreur avec recommencement possible", () => {
    const onRetake = jest.fn();
    const { getByTestId } = render(
      <CapturePreview
        {...baseProps}
        detectionError="Le modèle d'analyse n'a pas pu être chargé."
        onRetake={onRetake}
      />,
    );
    expect(getByTestId("detection-error")).toBeTruthy();
    fireEvent.press(getByTestId("retake-after-error-button"));
    expect(onRetake).toHaveBeenCalledTimes(1);
  });

  it("propose l'analyse quand aucune erreur n'est présente (toutes plateformes)", () => {
    const onAnalyze = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <CapturePreview {...baseProps} onAnalyze={onAnalyze} />,
    );
    // Plus de bloc "limite plateforme" : l'analyse est disponible partout.
    expect(queryByTestId("platform-limitation")).toBeNull();
    fireEvent.press(getByTestId("analyze-button"));
    expect(onAnalyze).toHaveBeenCalledTimes(1);
  });
});
