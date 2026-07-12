import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { CapturePreview } from "../capture-preview";

const baseProps = {
  previewUrl: "data:image/png;base64,xxx",
  isRecording: false,
  mlLoading: false,
  detectionError: null,
  platformLimitation: null,
  lowConfidenceWarning: null,
  onAnalyze: jest.fn(),
  onRetake: jest.fn(),
};

describe("CapturePreview — limite plateforme vs erreur", () => {
  it("affiche la limite mobile dans un bloc informatif distinct du style erreur", () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <CapturePreview
        {...baseProps}
        platformLimitation="L'analyse automatique n'est pas disponible sur mobile pour le moment. Utilisez BodyOrthox sur navigateur pour analyser cette capture."
      />,
    );
    expect(getByTestId("platform-limitation")).toBeTruthy();
    expect(
      getByText(
        "L'analyse automatique n'est pas disponible sur mobile pour le moment. Utilisez BodyOrthox sur navigateur pour analyser cette capture.",
      ),
    ).toBeTruthy();
    // Pas affiché comme une erreur ML générique.
    expect(queryByTestId("detection-error")).toBeNull();
  });

  it("permet de recommencer la capture depuis le bloc de limite plateforme", () => {
    const onRetake = jest.fn();
    const { getByTestId } = render(
      <CapturePreview {...baseProps} platformLimitation="Non disponible sur mobile." onRetake={onRetake} />,
    );
    fireEvent.press(getByTestId("retake-after-platform-limitation-button"));
    expect(onRetake).toHaveBeenCalledTimes(1);
  });

  it("affiche toujours l'erreur ML générique dans son style erreur quand ce n'est pas une limite plateforme", () => {
    const { getByTestId, queryByTestId } = render(
      <CapturePreview {...baseProps} detectionError="Le modèle d'analyse n'a pas pu être chargé." />,
    );
    expect(getByTestId("detection-error")).toBeTruthy();
    expect(queryByTestId("platform-limitation")).toBeNull();
  });
});
