import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Report, SAMPLE_REPORT } from "../Report";
import type { PoseLandmarks } from "../../features/capture/data/angle-calculator";

jest.mock("../../shared/utils/image-dimensions", () => {
  const actual = jest.requireActual("../../shared/utils/image-dimensions");
  return {
    ...actual,
    getNaturalImageSize: jest.fn().mockResolvedValue({ width: 300, height: 400 }),
  };
});

const SKELETON_LANDMARKS: PoseLandmarks = {
  23: { x: 0.4, y: 0.5, z: 0, visibility: 0.95 },
  24: { x: 0.6, y: 0.5, z: 0, visibility: 0.95 },
  25: { x: 0.4, y: 0.7, z: 0, visibility: 0.95 },
  26: { x: 0.6, y: 0.7, z: 0, visibility: 0.95 },
  27: { x: 0.4, y: 0.9, z: 0, visibility: 0.95 },
  28: { x: 0.6, y: 0.9, z: 0, visibility: 0.95 },
};

describe("Report", () => {
  it("rend un AngleScale sous chaque ligne HKA du tableau de mesures", () => {
    const { getByTestId } = render(<Report data={SAMPLE_REPORT} />);
    expect(getByTestId("angle-scale-report-row-0")).toBeTruthy();
    expect(getByTestId("angle-scale-report-row-1")).toBeTruthy();
  });

  it("n'affiche pas de scale sous les lignes non-HKA", () => {
    const { queryByTestId } = render(<Report data={SAMPLE_REPORT} />);
    // Index 2 = "Inclin. épaules", sans angleRefMin/angleRefMax.
    expect(queryByTestId("angle-scale-report-row-2")).toBeNull();
  });

  describe("badge de confiance faible", () => {
    it("n'affiche pas de mention quand confidenceScore est absent", () => {
      const { queryByTestId } = render(<Report data={SAMPLE_REPORT} />);
      expect(queryByTestId("report-low-confidence-badge")).toBeNull();
    });

    it("n'affiche pas de mention quand confidenceScore est élevé", () => {
      const data = { ...SAMPLE_REPORT, confidenceScore: 0.9 };
      const { queryByTestId } = render(<Report data={data} />);
      expect(queryByTestId("report-low-confidence-badge")).toBeNull();
    });

    it("affiche une mention 'Confiance faible' quand confidenceScore est sous le seuil", () => {
      const data = { ...SAMPLE_REPORT, confidenceScore: 0.4 };
      const { getByTestId } = render(<Report data={data} />);
      expect(getByTestId("report-low-confidence-badge")).toHaveTextContent(
        "Confiance faible",
        { exact: false },
      );
    });
  });

  describe("squelette superposé à la capture", () => {
    it("superpose le squelette quand landmarks + photo sont fournis", async () => {
      const data = {
        ...SAMPLE_REPORT,
        capturedImageUrl: "data:image/png;base64,abc",
        skeleton: { landmarks: SKELETON_LANDMARKS },
      };
      const { getByTestId } = render(<Report data={data} />);

      fireEvent(getByTestId("report-capture-block"), "layout", {
        nativeEvent: { layout: { width: 320, height: 180 } },
      });

      await waitFor(() => {
        expect(getByTestId("skeleton-overlay")).toBeTruthy();
      });
    });

    it("pas de squelette sans landmarks", () => {
      const data = {
        ...SAMPLE_REPORT,
        capturedImageUrl: "data:image/png;base64,abc",
      };
      const { getByTestId, queryByTestId } = render(<Report data={data} />);

      fireEvent(getByTestId("report-capture-block"), "layout", {
        nativeEvent: { layout: { width: 320, height: 180 } },
      });

      expect(queryByTestId("skeleton-overlay")).toBeNull();
    });
  });

  describe("conclusion clinique", () => {
    it("affiche une mention honnête quand aucune note n'a été saisie", () => {
      const { getByTestId, queryByTestId } = render(
        <Report data={SAMPLE_REPORT} />,
      );
      expect(getByTestId("report-conclusion-empty")).toHaveTextContent(
        "Aucune note du praticien saisie.",
      );
      expect(queryByTestId("report-conclusion-text")).toBeNull();
    });

    it("affiche le texte réel des notes cliniques du praticien quand elles existent", () => {
      const data = {
        ...SAMPLE_REPORT,
        clinicalNotes: "Discrète asymétrie, réévaluation dans 3 mois.",
      };
      const { getByTestId, queryByTestId } = render(<Report data={data} />);
      expect(getByTestId("report-conclusion-text")).toHaveTextContent(
        "Discrète asymétrie, réévaluation dans 3 mois.",
      );
      expect(queryByTestId("report-conclusion-empty")).toBeNull();
    });
  });
});
