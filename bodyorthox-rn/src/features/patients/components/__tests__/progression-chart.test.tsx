import React from "react";
import { render, fireEvent, within } from "@testing-library/react-native";
import { ProgressionChart } from "../progression-chart";
import type { Analysis } from "../../../capture/domain/analysis";

// Le point de données appelle `e.stopPropagation?.()` (pour ne pas fermer le
// tooltip via le `onPress` du conteneur) — RTL n'injecte pas cette méthode
// par défaut, on la fournit explicitement.
const PRESS_EVENT = { stopPropagation: jest.fn() };

// Le tooltip ne s'affiche qu'après layout (chartWidth > 0) — RTL ne déclenche
// pas onLayout automatiquement, on le simule.
const LAYOUT_EVENT = { nativeEvent: { layout: { width: 300, height: 250, x: 0, y: 0 } } };

function buildAnalysis(id: string, createdAt: string, kneeAngle: number): Analysis {
  return {
    id,
    patientId: "p1",
    createdAt,
    angles: { kneeAngle, hipAngle: 176, ankleAngle: 90 },
    confidenceScore: 0.9,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
  };
}

describe("ProgressionChart — wording neutre aligné sur hka-range (non-DM)", () => {
  it("n'affiche pas le wording clinique « Zone normale » dans la légende", () => {
    const analyses = [buildAnalysis("a1", "2026-01-01T00:00:00Z", 178)];
    const { queryByText, getByText } = render(<ProgressionChart analyses={analyses} />);

    expect(queryByText("Zone normale")).toBeNull();
    expect(getByText("Dans la plage")).toBeTruthy();
  });

  it("le tooltip affiche « Dans la plage » (pas « Normal ») pour un angle dans la plage de référence", () => {
    const analyses = [buildAnalysis("a1", "2026-01-01T00:00:00Z", 178)];
    const { getByTestId } = render(<ProgressionChart analyses={analyses} />);

    fireEvent(getByTestId("progression-chart-area"), "layout", LAYOUT_EVENT);
    fireEvent.press(getByTestId("knee-dot-0"), PRESS_EVENT);

    const tooltip = within(getByTestId("chart-tooltip"));
    expect(tooltip.getByText("Dans la plage")).toBeTruthy();
    expect(tooltip.queryByText("Normal")).toBeNull();
  });

  it("le tooltip affiche « Hors plage » (pas « Hors norme ») pour un angle hors plage de référence", () => {
    const analyses = [buildAnalysis("a1", "2026-01-01T00:00:00Z", 160)];
    const { getByTestId } = render(<ProgressionChart analyses={analyses} />);

    fireEvent(getByTestId("progression-chart-area"), "layout", LAYOUT_EVENT);
    fireEvent.press(getByTestId("knee-dot-0"), PRESS_EVENT);

    const tooltip = within(getByTestId("chart-tooltip"));
    expect(tooltip.getByText("Hors plage")).toBeTruthy();
    expect(tooltip.queryByText("Hors norme")).toBeNull();
  });
});
