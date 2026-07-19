import React from "react";
import { Alert, Platform } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import {
  PatientDetail,
  PatientDetailRoute,
  buildDetailData,
  buildHeroMeta,
} from "../patient-detail-route";
import { SAMPLE_PATIENT_DETAIL } from "../../../screens/__fixtures__/patient-detail";
import { usePatientsStore } from "../../../features/patients/store/patients-store";
import type { Patient } from "../../../features/patients/domain/patient";

const mockPatient: Patient = {
  id: "p1",
  name: "Jean Dupont",
  dateOfBirth: "1990-01-01",
  morphologicalProfile: null,
  createdAt: "2024-01-01T00:00:00Z",
};

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);
const mockPopToTop = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    canGoBack: mockCanGoBack,
    popToTop: mockPopToTop,
  }),
  useRoute: () => ({ params: { patientId: "p1" } }),
}));

const mockAnalysisRepo = { getForPatient: jest.fn().mockResolvedValue([]) };
jest.mock("../../../shared/hooks/use-analysis-repository", () => ({
  useAnalysisRepository: () => mockAnalysisRepo,
}));

// Évite la pollution inter-tests : Alert.alert espionné garde son historique
// d'appels tant qu'il n'est pas restauré (jest.spyOn réutilise le même mock).
afterEach(() => {
  Platform.OS = "ios";
  jest.restoreAllMocks();
});

function resetStore(overrides?: Record<string, unknown>) {
  usePatientsStore.setState({
    patients: [mockPatient],
    isLoading: false,
    error: null,
    deletePatient: jest.fn().mockResolvedValue(undefined),
    archivePatient: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as never);
}

describe("PatientDetailRoute — suppression/archivage RGPD", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
  });

  it("deletes the patient and navigates back to the patients list on success", async () => {
    const deletePatient = jest.fn().mockResolvedValue(undefined);
    resetStore({ deletePatient });
    jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
      const confirmBtn = buttons?.find((b) => b.style === "destructive");
      confirmBtn?.onPress?.();
    });

    const { getByTestId } = render(<PatientDetailRoute />);
    await waitFor(() => expect(getByTestId("delete-button")).toBeTruthy());
    fireEvent.press(getByTestId("delete-button"));

    await waitFor(() => expect(deletePatient).toHaveBeenCalledWith("p1"));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("MainTabs", { screen: "PatientsTab" }),
    );
  });

  it("shows an error and does not navigate when the store reports a deletion failure", async () => {
    const deletePatient = jest.fn().mockImplementation(async () => {
      usePatientsStore.setState({ error: "Erreur de suppression" } as never);
    });
    resetStore({ deletePatient });
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
      const confirmBtn = buttons?.find((b) => b.style === "destructive");
      confirmBtn?.onPress?.();
    });

    const { getByTestId } = render(<PatientDetailRoute />);
    await waitFor(() => expect(getByTestId("delete-button")).toBeTruthy());
    fireEvent.press(getByTestId("delete-button"));

    await waitFor(() => expect(deletePatient).toHaveBeenCalledWith("p1"));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Erreur", "Erreur de suppression"),
    );
    expect(mockNavigate).not.toHaveBeenCalledWith("MainTabs", { screen: "PatientsTab" });
  });

  it("archives the patient and navigates back to the patients list on success", async () => {
    const archivePatient = jest.fn().mockResolvedValue(undefined);
    resetStore({ archivePatient });
    jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
      const confirmBtn = buttons?.find((b) => b.text !== "Annuler");
      confirmBtn?.onPress?.();
    });

    const { getByTestId } = render(<PatientDetailRoute />);
    await waitFor(() => expect(getByTestId("archive-button")).toBeTruthy());
    fireEvent.press(getByTestId("archive-button"));

    await waitFor(() => expect(archivePatient).toHaveBeenCalledWith("p1"));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("MainTabs", { screen: "PatientsTab" }),
    );
  });
});

describe("PatientDetailRoute — entrée vers la sélection du rapport de progression", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("navigue vers ProgressionSelection avec le patient et toutes ses analyses quand il y en a au moins 2", async () => {
    const analyses = [
      { id: "a1", patientId: "p1", createdAt: "2026-01-01T00:00:00.000Z", angles: { kneeAngle: 176, hipAngle: 175, ankleAngle: 174 }, confidenceScore: 0.9, manualCorrectionApplied: false, manualCorrectionJoint: null },
      { id: "a2", patientId: "p1", createdAt: "2026-02-01T00:00:00.000Z", angles: { kneeAngle: 176, hipAngle: 175, ankleAngle: 174 }, confidenceScore: 0.9, manualCorrectionApplied: false, manualCorrectionJoint: null },
    ];
    mockAnalysisRepo.getForPatient.mockResolvedValueOnce(analyses);
    resetStore();

    const { getByTestId } = render(<PatientDetailRoute />);
    await waitFor(() => expect(getByTestId("progression-report-link")).toBeTruthy());

    fireEvent.press(getByTestId("progression-report-link"));

    expect(mockNavigate).toHaveBeenCalledWith("ProgressionSelection", {
      patient: mockPatient,
      analyses,
    });
  });
});

describe("buildDetailData — médecin référent & consentement RGPD", () => {
  it("omits referringPhysician and consentDate when absent", () => {
    const data = buildDetailData(mockPatient, []);
    expect(data.referringPhysician).toBeUndefined();
    expect(data.consentDate).toBeUndefined();
  });

  it("maps referringPhysician through", () => {
    const data = buildDetailData({ ...mockPatient, referringPhysician: "Dr. Martin" }, []);
    expect(data.referringPhysician).toBe("Dr. Martin");
  });

  it("formats consentDate for display instead of exposing the raw ISO string", () => {
    const data = buildDetailData(
      { ...mockPatient, consentDate: "2026-01-15T10:00:00.000Z" },
      [],
    );
    expect(data.consentDate).toEqual(expect.any(String));
    expect(data.consentDate).not.toBe("2026-01-15T10:00:00.000Z");
  });
});

describe("PatientDetailRoute — retour vers la racine de l'onglet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("le bouton `<` appelle popToTop (jamais un cast non-sûr sur navigation)", async () => {
    resetStore();
    const { findByLabelText } = render(<PatientDetailRoute />);
    const backButton = await findByLabelText("Retour");

    fireEvent.press(backButton);

    expect(mockPopToTop).toHaveBeenCalledTimes(1);
    expect(mockGoBack).not.toHaveBeenCalled();
  });
});

describe("PatientDetailRoute — états unifiés (LoadingState/ErrorState)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
  });

  it("affiche l'état de chargement pendant que les patients sont en cours de chargement", () => {
    resetStore({ patients: [], isLoading: true });

    const { getByText } = render(<PatientDetailRoute />);

    expect(getByText("Chargement...")).toBeTruthy();
  });

  it("affiche une ErrorState avec un bouton Réessayer quand le patient est introuvable, et revient en arrière au clic", async () => {
    resetStore({ patients: [{ ...mockPatient, id: "autre-id" }], isLoading: false });

    const { getByText } = render(<PatientDetailRoute />);

    await waitFor(() => expect(getByText("Patient introuvable.")).toBeTruthy());
    expect(getByText("Réessayer")).toBeTruthy();

    fireEvent.press(getByText("Réessayer"));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});

describe("buildDetailData — mesures non renseignées", () => {
  it("mappe taille/poids absents vers null (jamais 0)", () => {
    const data = buildDetailData(
      { ...mockPatient, morphologicalProfile: undefined },
      [],
    );
    expect(data.heightCm).toBeNull();
    expect(data.weightKg).toBeNull();
  });

  it("mappe taille/poids à 0 (valeur sentinelle legacy) vers null", () => {
    const data = buildDetailData(
      {
        ...mockPatient,
        morphologicalProfile: {
          ...(mockPatient.morphologicalProfile ?? {}),
          heightCm: 0,
          weightKg: 0,
        },
      },
      [],
    );
    expect(data.heightCm).toBeNull();
    expect(data.weightKg).toBeNull();
  });

  it("conserve les mesures réellement renseignées", () => {
    const data = buildDetailData(
      {
        ...mockPatient,
        morphologicalProfile: {
          ...(mockPatient.morphologicalProfile ?? {}),
          heightCm: 172,
          weightKg: 64,
        },
      },
      [],
    );
    expect(data.heightCm).toBe(172);
    expect(data.weightKg).toBe(64);
  });
});

describe("PatientDetail — zone dangereuse", () => {
  it("renders the archive and delete actions, separated from normal actions", () => {
    const { getByTestId, getByText } = render(<PatientDetail data={SAMPLE_PATIENT_DETAIL} />);
    expect(getByText("Zone dangereuse")).toBeTruthy();
    expect(getByTestId("archive-button")).toBeTruthy();
    expect(getByTestId("delete-button")).toBeTruthy();
  });

  it("asks for confirmation before deleting, mentioning the patient's name and irreversibility", () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const onDelete = jest.fn();
    const { getByTestId } = render(
      <PatientDetail data={SAMPLE_PATIENT_DETAIL} onDelete={onDelete} />,
    );

    fireEvent.press(getByTestId("delete-button"));

    expect(alertSpy).toHaveBeenCalledTimes(1);
    const [title, message] = alertSpy.mock.calls[0];
    expect(title).toMatch(/supprimer/i);
    expect(message).toContain(SAMPLE_PATIENT_DETAIL.name);
    expect(message).toMatch(/irréversible/i);
    // onDelete must not fire until the user confirms.
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("calls onDelete only when the destructive confirmation button is pressed", () => {
    const onDelete = jest.fn();
    jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons) => {
      const confirmBtn = buttons?.find((b) => b.style === "destructive");
      confirmBtn?.onPress?.();
    });
    const { getByTestId } = render(
      <PatientDetail data={SAMPLE_PATIENT_DETAIL} onDelete={onDelete} />,
    );

    fireEvent.press(getByTestId("delete-button"));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("does not call onDelete when the confirmation is cancelled", () => {
    const onDelete = jest.fn();
    jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons) => {
      const cancelBtn = buttons?.find((b) => b.style === "cancel");
      cancelBtn?.onPress?.();
    });
    const { getByTestId } = render(
      <PatientDetail data={SAMPLE_PATIENT_DETAIL} onDelete={onDelete} />,
    );

    fireEvent.press(getByTestId("delete-button"));

    expect(onDelete).not.toHaveBeenCalled();
  });

  it("asks for confirmation before archiving, mentioning the patient's name", () => {
    const onArchive = jest.fn();
    jest.spyOn(Alert, "alert").mockImplementation((_title, message, buttons) => {
      expect(message).toContain(SAMPLE_PATIENT_DETAIL.name);
      const confirmBtn = buttons?.find((b) => b.text !== "Annuler");
      confirmBtn?.onPress?.();
    });
    const { getByTestId } = render(
      <PatientDetail data={SAMPLE_PATIENT_DETAIL} onArchive={onArchive} />,
    );

    fireEvent.press(getByTestId("archive-button"));

    expect(onArchive).toHaveBeenCalledTimes(1);
  });
});

describe("PatientDetail — zone dangereuse sur web (Alert.alert est un no-op sur react-native-web)", () => {
  it("archive via window.confirm, sans passer par Alert.alert", () => {
    Platform.OS = "web";
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const windowConfirmSpy = jest.fn().mockReturnValue(true);
    (global as unknown as { confirm: jest.Mock }).confirm = windowConfirmSpy;
    const onArchive = jest.fn();
    const { getByTestId } = render(
      <PatientDetail data={SAMPLE_PATIENT_DETAIL} onArchive={onArchive} />,
    );

    fireEvent.press(getByTestId("archive-button"));

    expect(windowConfirmSpy).toHaveBeenCalledWith(
      expect.stringContaining(SAMPLE_PATIENT_DETAIL.name),
    );
    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("supprime via window.confirm, sans passer par Alert.alert", () => {
    Platform.OS = "web";
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const windowConfirmSpy = jest.fn().mockReturnValue(true);
    (global as unknown as { confirm: jest.Mock }).confirm = windowConfirmSpy;
    const onDelete = jest.fn();
    const { getByTestId } = render(
      <PatientDetail data={SAMPLE_PATIENT_DETAIL} onDelete={onDelete} />,
    );

    fireEvent.press(getByTestId("delete-button"));

    expect(windowConfirmSpy).toHaveBeenCalledWith(
      expect.stringContaining(SAMPLE_PATIENT_DETAIL.name),
    );
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("n'archive ni ne supprime quand window.confirm est refusé", () => {
    Platform.OS = "web";
    (global as unknown as { confirm: jest.Mock }).confirm = jest.fn().mockReturnValue(false);
    const onArchive = jest.fn();
    const onDelete = jest.fn();
    const { getByTestId } = render(
      <PatientDetail data={SAMPLE_PATIENT_DETAIL} onArchive={onArchive} onDelete={onDelete} />,
    );

    fireEvent.press(getByTestId("archive-button"));
    fireEvent.press(getByTestId("delete-button"));

    expect(onArchive).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });
});

describe("PatientDetail — entrée vers le rapport de progression", () => {
  it("affiche le lien quand le patient a au moins 2 analyses et un handler est fourni", () => {
    const onProgressionReport = jest.fn();
    const { getByTestId } = render(
      <PatientDetail
        data={{ ...SAMPLE_PATIENT_DETAIL, analysisCount: 2 }}
        onProgressionReport={onProgressionReport}
      />,
    );
    expect(getByTestId("progression-report-link")).toBeTruthy();
  });

  it("masque le lien quand le patient a moins de 2 analyses", () => {
    const { queryByTestId } = render(
      <PatientDetail
        data={{ ...SAMPLE_PATIENT_DETAIL, analysisCount: 1 }}
        onProgressionReport={jest.fn()}
      />,
    );
    expect(queryByTestId("progression-report-link")).toBeNull();
  });

  it("masque le lien quand aucun handler n'est fourni, même avec assez d'analyses", () => {
    const { queryByTestId } = render(
      <PatientDetail data={{ ...SAMPLE_PATIENT_DETAIL, analysisCount: 5 }} />,
    );
    expect(queryByTestId("progression-report-link")).toBeNull();
  });

  it("appelle onProgressionReport au clic sur le lien", () => {
    const onProgressionReport = jest.fn();
    const { getByTestId } = render(
      <PatientDetail
        data={{ ...SAMPLE_PATIENT_DETAIL, analysisCount: 3 }}
        onProgressionReport={onProgressionReport}
      />,
    );

    fireEvent.press(getByTestId("progression-report-link"));

    expect(onProgressionReport).toHaveBeenCalledTimes(1);
  });
});

describe("PatientDetail — données non renseignées", () => {
  it("affiche « — » sans unité pour taille et poids null (jamais 0 cm / 0 kg)", () => {
    const { getAllByText, queryByText } = render(
      <PatientDetail
        data={{ ...SAMPLE_PATIENT_DETAIL, heightCm: null, weightKg: null }}
      />,
    );
    expect(getAllByText("—").length).toBeGreaterThanOrEqual(2);
    expect(queryByText(/0\s*cm/)).toBeNull();
    expect(queryByText(/0\s*kg/)).toBeNull();
  });

  it("n'affiche « Motif / contexte » qu'une seule fois (eyebrow, pas de doublon)", () => {
    const { getAllByText } = render(<PatientDetail data={SAMPLE_PATIENT_DETAIL} />);
    expect(getAllByText("Motif / contexte")).toHaveLength(1);
  });
});

describe("buildHeroMeta — méta d'identité sans valeurs cryptiques", () => {
  it("écrit l'âge en toutes lettres et garde l'identifiant", () => {
    expect(buildHeroMeta({ sex: "F", age: 34, id: "P-0041" })).toBe("F · 34 ans · #P-0041");
  });

  it("omet le sexe inconnu (X) et l'âge nul au lieu de les afficher", () => {
    expect(buildHeroMeta({ sex: "X", age: 0, id: "P-42DF" })).toBe("#P-42DF");
  });
});
