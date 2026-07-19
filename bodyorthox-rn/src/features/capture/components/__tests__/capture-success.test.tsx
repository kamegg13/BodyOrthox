import React from "react";
import { StyleSheet } from "react-native";
import { render } from "@testing-library/react-native";
import { CaptureSuccess } from "../capture-success";
import { LEGAL_CONSTANTS } from "../../../../core/legal/legal-constants";
import { colors } from "../../../../theme/tokens";
import type { BilateralAngles } from "../../data/angle-calculator";

const BILATERAL_ANGLES: BilateralAngles = {
  left: { kneeAngle: 178, hipAngle: 175, ankleAngle: 90 },
  right: { kneeAngle: 178, hipAngle: 175, ankleAngle: 90 },
  leftHKA: 178,
  rightHKA: 178,
};

function renderCaptureSuccess() {
  return render(
    <CaptureSuccess
      capturedImageUrl={null}
      confidenceScore={0.9}
      angles={{ kneeAngle: 178, hipAngle: 175, ankleAngle: 90 }}
      bilateralAngles={BILATERAL_ANGLES}
      landmarks={null}
      onSave={jest.fn()}
      onDiscard={jest.fn()}
    />,
  );
}

describe("CaptureSuccess — mention légale", () => {
  it("affiche la mention légale partagée", () => {
    const { getByTestId } = renderCaptureSuccess();

    const disclaimer = getByTestId("capture-success-disclaimer");

    expect(disclaimer.props.children).toBe(LEGAL_CONSTANTS.mdrDisclaimer);
  });

  it("réutilise le style du composant partagé LegalDisclaimer (couleur textMuted), pas un style local dupliqué", () => {
    const { getByTestId } = renderCaptureSuccess();

    const disclaimer = getByTestId("capture-success-disclaimer");
    const flatStyle = StyleSheet.flatten(disclaimer.props.style);

    expect(flatStyle.color).toBe(colors.textMuted);
  });
});
