import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Results, SAMPLE_RESULTS } from "../Results";

describe("Results", () => {
  it("rend un AngleScale sous chaque mesure HKA", () => {
    const { getByTestId } = render(<Results data={SAMPLE_RESULTS} />);
    expect(getByTestId("angle-scale-hka-l")).toBeTruthy();
    expect(getByTestId("angle-scale-hka-r")).toBeTruthy();
  });

  it("n'affiche pas de curseur quand la mesure HKA est indisponible", () => {
    const data = {
      ...SAMPLE_RESULTS,
      hka: {
        left: { ...SAMPLE_RESULTS.hka.left, value: null },
        right: SAMPLE_RESULTS.hka.right,
      },
    };
    const { getByTestId } = render(<Results data={data} />);
    expect(getByTestId("angle-scale-hka-l-empty")).toBeTruthy();
  });

  it("affiche les deux côtés pour chaque mesure posturale", () => {
    const { getByTestId } = render(<Results data={SAMPLE_RESULTS} />);
    for (const m of SAMPLE_RESULTS.postural) {
      expect(getByTestId(`postural-${m.key}-left`)).toBeTruthy();
      expect(getByTestId(`postural-${m.key}-right`)).toBeTruthy();
    }
  });

  it("affiche — quand un côté postural est indisponible", () => {
    const first = SAMPLE_RESULTS.postural[0];
    const data = {
      ...SAMPLE_RESULTS,
      postural: [{ ...first, right: null }],
    };
    const { getByTestId } = render(<Results data={data} />);
    expect(getByTestId(`postural-${first.key}-right`)).toHaveTextContent("—");
  });

  it("rend la photo dans une image zoomable quand elle est fournie", () => {
    const data = {
      ...SAMPLE_RESULTS,
      capturedImageUrl: "data:image/png;base64,abc",
    };
    const { getByTestId } = render(<Results data={data} />);
    expect(getByTestId("zoomable-image")).toBeTruthy();
    expect(getByTestId("zoomable-image-slider")).toBeTruthy();
  });

  describe("notes cliniques", () => {
    it("pré-remplit le champ avec les notes existantes de l'analyse", () => {
      const data = { ...SAMPLE_RESULTS, clinicalNotes: "Suivi à 3 mois." };
      const { getByTestId } = render(<Results data={data} />);
      expect(getByTestId("clinical-notes-input").props.value).toBe(
        "Suivi à 3 mois.",
      );
    });

    it("expose un label accessible sur le champ de notes", () => {
      const { getByTestId } = render(<Results data={SAMPLE_RESULTS} />);
      expect(getByTestId("clinical-notes-input").props.accessibilityLabel).toBe(
        "Notes cliniques du praticien",
      );
    });

    it("appelle onNotesChange à chaque frappe", () => {
      const onNotesChange = jest.fn();
      const { getByTestId } = render(
        <Results data={SAMPLE_RESULTS} onNotesChange={onNotesChange} />,
      );
      fireEvent.changeText(getByTestId("clinical-notes-input"), "Nouvelle note");
      expect(onNotesChange).toHaveBeenCalledWith("Nouvelle note");
    });

    it("appelle onNotesBlur avec la valeur courante à la perte de focus", () => {
      const onNotesBlur = jest.fn();
      const { getByTestId } = render(
        <Results data={SAMPLE_RESULTS} onNotesBlur={onNotesBlur} />,
      );
      const input = getByTestId("clinical-notes-input");
      fireEvent.changeText(input, "Texte final");
      fireEvent(input, "blur");
      expect(onNotesBlur).toHaveBeenCalledWith("Texte final");
    });

    it("n'affiche aucun feedback par défaut", () => {
      const { queryByTestId } = render(<Results data={SAMPLE_RESULTS} />);
      expect(queryByTestId("clinical-notes-feedback")).toBeNull();
    });

    it("affiche 'Enregistré' une fois la sauvegarde confirmée", () => {
      const { getByTestId } = render(
        <Results data={SAMPLE_RESULTS} notesSaveStatus="saved" />,
      );
      expect(getByTestId("clinical-notes-feedback")).toHaveTextContent(
        "Enregistré",
      );
    });

    it("affiche un message d'erreur visible si la sauvegarde échoue", () => {
      const { getByTestId } = render(
        <Results
          data={SAMPLE_RESULTS}
          notesSaveStatus="error"
          notesSaveError="Connexion perdue"
        />,
      );
      expect(getByTestId("clinical-notes-feedback")).toHaveTextContent(
        "Connexion perdue",
      );
    });
  });

  describe("badge de confiance faible", () => {
    it("n'affiche pas de badge quand confidenceScore est absent", () => {
      const { queryByTestId } = render(<Results data={SAMPLE_RESULTS} />);
      expect(queryByTestId("low-confidence-badge")).toBeNull();
    });

    it("n'affiche pas de badge quand confidenceScore est élevé", () => {
      const data = { ...SAMPLE_RESULTS, confidenceScore: 0.92 };
      const { queryByTestId } = render(<Results data={data} />);
      expect(queryByTestId("low-confidence-badge")).toBeNull();
    });

    it("affiche un badge 'Confiance faible' quand confidenceScore est sous le seuil", () => {
      const data = { ...SAMPLE_RESULTS, confidenceScore: 0.42 };
      const { getByTestId } = render(<Results data={data} />);
      expect(getByTestId("low-confidence-badge")).toHaveTextContent(
        "Confiance faible",
      );
      expect(getByTestId("low-confidence-subtext")).toHaveTextContent(
        "Détection à vérifier",
        { exact: false },
      );
    });

    it("affiche le badge à la limite exacte du seuil (0.6 exclu)", () => {
      const data = { ...SAMPLE_RESULTS, confidenceScore: 0.6 };
      const { queryByTestId } = render(<Results data={data} />);
      expect(queryByTestId("low-confidence-badge")).toBeNull();
    });
  });

  describe("Corriger les points", () => {
    it("n'affiche pas l'action quand onCorrectPoints est absent", () => {
      const { queryByTestId } = render(<Results data={SAMPLE_RESULTS} />);
      expect(queryByTestId("correct-points-button")).toBeNull();
    });

    it("navigue vers la relecture experte au tap", () => {
      const onCorrectPoints = jest.fn();
      const { getByTestId } = render(
        <Results data={SAMPLE_RESULTS} onCorrectPoints={onCorrectPoints} />,
      );
      fireEvent.press(getByTestId("correct-points-button"));
      expect(onCorrectPoints).toHaveBeenCalledTimes(1);
    });
  });
});
