import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Results, ResultsRoute } from "../results-route";
import { SAMPLE_RESULTS } from "../../../screens/__fixtures__/results";
import { usePatientsStore } from "../../../features/patients/store/patients-store";
import type { Analysis } from "../../../features/capture/domain/analysis";
import type { Patient } from "../../../features/patients/domain/patient";
import type { PoseLandmarks } from "../../../features/capture/data/angle-calculator";

jest.mock("../../../shared/utils/image-dimensions", () => {
  const actual = jest.requireActual("../../../shared/utils/image-dimensions");
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

const mockNavigate = jest.fn();
const mockPopTo = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
    popTo: mockPopTo,
  }),
  useRoute: () => ({
    params: { analysisId: "analysis-1", patientId: "patient-1" },
  }),
  // Shim : simule un focus initial pour exercer la recharge de l'écran sans
  // dépendre d'un vrai NavigationContainer dans les tests.
  useFocusEffect: (callback: () => void | (() => void)) => {
    const ReactActual = jest.requireActual("react");
    ReactActual.useEffect(() => {
      const cleanup = callback();
      return cleanup;
    }, []);
  },
}));

const mockGetById = jest.fn();
const mockUpdate = jest.fn().mockResolvedValue(undefined);
// Référence stable : sinon useAsyncData (deps: [..., repo]) reprend sa
// requête à chaque render et l'écran reste bloqué en chargement.
const mockRepo = { getById: mockGetById, update: mockUpdate };

jest.mock("../../../shared/hooks/use-analysis-repository", () => ({
  useAnalysisRepository: () => mockRepo,
}));

const mockPatient: Patient = {
  id: "patient-1",
  name: "Jean Dupont",
  dateOfBirth: "1990-01-01",
  morphologicalProfile: null,
  createdAt: "2024-01-01T00:00:00Z",
};

function buildAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  return {
    id: "analysis-1",
    patientId: "patient-1",
    createdAt: "2026-03-19T14:30:00.000Z",
    angles: { kneeAngle: 176.2, hipAngle: 175.0, ankleAngle: 174.5 },
    bilateralAngles: {
      leftHKA: 176.2,
      rightHKA: 177.5,
      left: { kneeAngle: 176.2, hipAngle: 175.0, ankleAngle: 174.5 },
      right: { kneeAngle: 177.5, hipAngle: 176.0, ankleAngle: 175.0 },
    },
    confidenceScore: 0.92,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdate.mockResolvedValue(undefined);
  usePatientsStore.setState({ patients: [mockPatient] } as never);
});

describe("ResultsRoute — notes cliniques", () => {
  it("charge les notes existantes de l'analyse dans le champ", async () => {
    mockGetById.mockResolvedValue(
      buildAnalysis({ clinicalNotes: "Suivi à 3 mois." }),
    );
    const { findByTestId } = render(<ResultsRoute />);
    const input = await findByTestId("clinical-notes-input");
    expect(input.props.value).toBe("Suivi à 3 mois.");
  });

  it("sauvegarde les notes après un court délai suivant la dernière frappe", async () => {
    mockGetById.mockResolvedValue(buildAnalysis());
    const { findByTestId } = render(<ResultsRoute />);
    const input = await findByTestId("clinical-notes-input");

    fireEvent.changeText(input, "Nouvelle observation");
    expect(mockUpdate).not.toHaveBeenCalled();

    await waitFor(
      () => {
        expect(mockUpdate).toHaveBeenCalledWith("analysis-1", {
          clinicalNotes: "Nouvelle observation",
        });
      },
      { timeout: 2000 },
    );
  });

  it("sauvegarde immédiatement (flush) à la perte de focus", async () => {
    mockGetById.mockResolvedValue(buildAnalysis());
    const { findByTestId } = render(<ResultsRoute />);
    const input = await findByTestId("clinical-notes-input");

    fireEvent.changeText(input, "Texte au blur");
    fireEvent(input, "blur");

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith("analysis-1", {
        clinicalNotes: "Texte au blur",
      });
    });
  });

  it("affiche un message d'erreur visible si la sauvegarde échoue", async () => {
    mockGetById.mockResolvedValue(buildAnalysis());
    mockUpdate.mockRejectedValue(new Error("Connexion perdue"));
    const { findByTestId } = render(<ResultsRoute />);
    const input = await findByTestId("clinical-notes-input");

    fireEvent.changeText(input, "Texte");
    fireEvent(input, "blur");

    await waitFor(async () => {
      expect(await findByTestId("clinical-notes-feedback")).toHaveTextContent(
        "Connexion perdue",
      );
    });
  });
});

describe("ResultsRoute — Corriger les points", () => {
  it("navigue vers Replay avec analysisId et patientId", async () => {
    mockGetById.mockResolvedValue(buildAnalysis());
    const { findByTestId } = render(<ResultsRoute />);
    const button = await findByTestId("correct-points-button");

    fireEvent.press(button);

    expect(mockNavigate).toHaveBeenCalledWith("Replay", {
      analysisId: "analysis-1",
      patientId: "patient-1",
    });
  });
});

describe("ResultsRoute — badge de confiance faible", () => {
  it("affiche le badge quand l'analyse a une confidenceScore basse", async () => {
    mockGetById.mockResolvedValue(buildAnalysis({ confidenceScore: 0.35 }));
    const { findByTestId } = render(<ResultsRoute />);
    expect(await findByTestId("low-confidence-badge")).toHaveTextContent(
      "Confiance faible",
    );
  });

  it("n'affiche pas le badge quand la confidenceScore est élevée", async () => {
    mockGetById.mockResolvedValue(buildAnalysis({ confidenceScore: 0.92 }));
    const { findByTestId, queryByTestId } = render(<ResultsRoute />);
    await findByTestId("clinical-notes-input");
    expect(queryByTestId("low-confidence-badge")).toBeNull();
  });
});

describe("ResultsRoute — recharge au focus", () => {
  it("recharge l'analyse quand l'écran regagne le focus", async () => {
    mockGetById.mockResolvedValue(buildAnalysis());
    render(<ResultsRoute />);

    await waitFor(() => {
      expect(mockGetById).toHaveBeenCalledWith("analysis-1");
    });
  });
});

describe("ResultsRoute — retour vers la fiche patient", () => {
  it("utilise popTo vers PatientDetail (jamais de popToTop ni de push dupliqué)", async () => {
    mockGetById.mockResolvedValue(buildAnalysis());
    const { findByLabelText } = render(<ResultsRoute />);
    const backButton = await findByLabelText("Retour");

    fireEvent.press(backButton);

    expect(mockPopTo).toHaveBeenCalledWith("PatientDetail", {
      patientId: "patient-1",
    });
    expect(mockNavigate).not.toHaveBeenCalledWith(
      "PatientDetail",
      expect.anything(),
    );
  });
});

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

  it("superpose le squelette sur la photo quand les landmarks sont fournis", async () => {
    const data = {
      ...SAMPLE_RESULTS,
      capturedImageUrl: "data:image/png;base64,abc",
      skeleton: { landmarks: SKELETON_LANDMARKS },
    };
    const { getByTestId } = render(<Results data={data} />);

    fireEvent(getByTestId("zoomable-image-root"), "layout", {
      nativeEvent: { layout: { width: 320, height: 240 } },
    });

    await waitFor(() => {
      expect(getByTestId("skeleton-overlay")).toBeTruthy();
    });
  });

  it("n'affiche pas de squelette sans landmarks", () => {
    const data = {
      ...SAMPLE_RESULTS,
      capturedImageUrl: "data:image/png;base64,abc",
    };
    const { getByTestId, queryByTestId } = render(<Results data={data} />);

    fireEvent(getByTestId("zoomable-image-root"), "layout", {
      nativeEvent: { layout: { width: 320, height: 240 } },
    });

    expect(queryByTestId("skeleton-overlay")).toBeNull();
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
        "Notes du praticien",
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
