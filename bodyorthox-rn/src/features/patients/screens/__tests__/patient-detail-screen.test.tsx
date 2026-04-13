import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import { PatientDetailScreen } from "../patient-detail-screen";
import { usePatientsStore } from "../../store/patients-store";
import { Analysis } from "../../../capture/domain/analysis";
import { Patient } from "../../domain/patient";

// --- Mock data ---

const mockPatient: Patient = {
  id: "p1",
  name: "Jean Dupont",
  dateOfBirth: "1990-05-15",
  morphologicalProfile: null,
  createdAt: "2024-01-01T00:00:00Z",
};

const mockAnalyses: Analysis[] = [
  {
    id: "a1",
    patientId: "p1",
    createdAt: "2026-03-19T10:00:00Z",
    angles: { kneeAngle: 5.2, hipAngle: 170.1, ankleAngle: 90.5 },
    confidenceScore: 0.92,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
  },
  {
    id: "a2",
    patientId: "p1",
    createdAt: "2026-03-18T10:00:00Z",
    angles: { kneeAngle: 6.1, hipAngle: 168.3, ankleAngle: 89.2 },
    confidenceScore: 0.55,
    manualCorrectionApplied: true,
    manualCorrectionJoint: "knee",
  },
];

// --- Mocks ---

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    replace: jest.fn(),
    push: jest.fn(),
  }),
  useRoute: () => ({
    params: { patientId: "p1" },
  }),
}));

const mockGetForPatient = jest.fn();

jest.mock("../../../capture/data/sqlite-analysis-repository", () => ({
  SqliteAnalysisRepository: jest.fn().mockImplementation(() => ({
    getForPatient: mockGetForPatient,
  })),
}));

jest.mock("../../../../core/database/init", () => ({
  getDatabase: () => ({}),
}));

// --- Tests ---

describe("PatientDetailScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetForPatient.mockResolvedValue(mockAnalyses);

    // Reset store with mock patient
    const store = usePatientsStore.getState();
    usePatientsStore.setState({
      patients: [mockPatient],
      isLoading: false,
      error: null,
      searchQuery: "",
    });
  });

  it("renders patient name and age", async () => {
    const { getByText } = render(<PatientDetailScreen />);
    await waitFor(() => {
      expect(getByText("Jean Dupont")).toBeTruthy();
      expect(getByText(/ans/)).toBeTruthy();
    });
  });

  it("renders patient initials in avatar", async () => {
    const { getByText } = render(<PatientDetailScreen />);
    await waitFor(() => {
      expect(getByText("JD")).toBeTruthy();
    });
  });

  it("shows loading indicator while analyses are loading", async () => {
    // Create a promise that we control to keep loading state active
    let resolvePromise: (value: Analysis[]) => void;
    const pendingPromise = new Promise<Analysis[]>((resolve) => {
      resolvePromise = resolve;
    });
    mockGetForPatient.mockReturnValue(pendingPromise);

    const { getByText } = render(<PatientDetailScreen />);

    await waitFor(() => {
      expect(getByText("Chargement des analyses...")).toBeTruthy();
    });

    // Resolve to clean up
    await act(async () => {
      resolvePromise!(mockAnalyses);
    });
  });

  it("displays analysis history section title", async () => {
    const { getByText } = render(<PatientDetailScreen />);
    await waitFor(() => {
      expect(getByText("Historique des analyses")).toBeTruthy();
    });
  });

  it("displays analysis entries after loading", async () => {
    const { getByTestId } = render(<PatientDetailScreen />);
    await waitFor(() => {
      expect(getByTestId("analysis-tile-a1")).toBeTruthy();
      expect(getByTestId("analysis-tile-a2")).toBeTruthy();
    });
  });

  it("displays angles for each analysis entry", async () => {
    const { getByText } = render(<PatientDetailScreen />);
    await waitFor(() => {
      // First analysis angles
      expect(getByText("5.2°")).toBeTruthy();
      expect(getByText("170.1°")).toBeTruthy();
      expect(getByText("90.5°")).toBeTruthy();
    });
  });

  it("displays confidence badge with correct label", async () => {
    const { getByText } = render(<PatientDetailScreen />);
    await waitFor(() => {
      // 0.92 = Élevée, 0.55 = Faible
      expect(getByText(/Élevée/)).toBeTruthy();
      expect(getByText(/Faible/)).toBeTruthy();
    });
  });

  it("navigates to ResultsScreen when analysis is pressed", async () => {
    const { getByTestId } = render(<PatientDetailScreen />);
    await waitFor(() => {
      expect(getByTestId("analysis-tile-a1")).toBeTruthy();
    });

    fireEvent.press(getByTestId("analysis-tile-a1"));
    expect(mockNavigate).toHaveBeenCalledWith("Results", {
      analysisId: "a1",
      patientId: "p1",
    });
  });

  it("shows empty state when no analyses exist", async () => {
    mockGetForPatient.mockResolvedValue([]);

    const { getByText, getByTestId } = render(<PatientDetailScreen />);
    await waitFor(() => {
      expect(getByText("Aucune analyse")).toBeTruthy();
      expect(getByTestId("empty-analyses")).toBeTruthy();
    });
  });

  it('shows "Démarrer une analyse" button in empty state', async () => {
    mockGetForPatient.mockResolvedValue([]);

    const { getByTestId, getByText } = render(<PatientDetailScreen />);
    await waitFor(() => {
      expect(getByText("Démarrer une analyse")).toBeTruthy();
    });

    fireEvent.press(getByTestId("start-analysis-button"));
    expect(mockNavigate).toHaveBeenCalledWith("Capture", { patientId: "p1" });
  });

  it('navigates to Timeline when "Progression clinique" is pressed', async () => {
    const { getByTestId } = render(<PatientDetailScreen />);
    await waitFor(() => {
      expect(getByTestId("timeline-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("timeline-button"));
    expect(mockNavigate).toHaveBeenCalledWith("Timeline", { patientId: "p1" });
  });

  it('navigates to Capture when "Nouvelle analyse" is pressed', async () => {
    const { getByTestId } = render(<PatientDetailScreen />);
    await waitFor(() => {
      expect(getByTestId("start-capture")).toBeTruthy();
    });

    fireEvent.press(getByTestId("start-capture"));
    expect(mockNavigate).toHaveBeenCalledWith("Capture", { patientId: "p1" });
  });

  describe("Patient Deletion", () => {
    it("shows confirmation alert when delete button is pressed", async () => {
      const alertSpy = jest.spyOn(Alert, "alert");

      const { getByTestId } = render(<PatientDetailScreen />);
      await waitFor(() => {
        expect(getByTestId("delete-button")).toBeTruthy();
      });

      fireEvent.press(getByTestId("delete-button"));

      expect(alertSpy).toHaveBeenCalledWith(
        "Supprimer le patient",
        "Voulez-vous vraiment supprimer Jean Dupont ?",
        expect.arrayContaining([
          expect.objectContaining({ text: "Annuler", style: "cancel" }),
          expect.objectContaining({ text: "Supprimer", style: "destructive" }),
        ]),
      );

      alertSpy.mockRestore();
    });

    it("calls deletePatient and navigates to Patients on confirm", async () => {
      const mockDeletePatient = jest.fn().mockResolvedValue(undefined);
      usePatientsStore.setState({
        patients: [mockPatient],
        deletePatient: mockDeletePatient,
      } as any);

      const alertSpy = jest
        .spyOn(Alert, "alert")
        .mockImplementation((_title, _message, buttons) => {
          const destructiveButton = buttons?.find(
            (b: any) => b.style === "destructive",
          );
          destructiveButton?.onPress?.();
        });

      const { getByTestId } = render(<PatientDetailScreen />);
      await waitFor(() => {
        expect(getByTestId("delete-button")).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByTestId("delete-button"));
      });

      await waitFor(() => {
        expect(mockDeletePatient).toHaveBeenCalledWith("p1");
        expect(mockNavigate).toHaveBeenCalledWith("MainTabs", {
          screen: "AnalysesTab",
        });
      });

      alertSpy.mockRestore();
    });

    it("does not delete when cancel is pressed", async () => {
      const mockDeletePatient = jest.fn();
      usePatientsStore.setState({
        patients: [mockPatient],
        deletePatient: mockDeletePatient,
      } as any);

      const alertSpy = jest
        .spyOn(Alert, "alert")
        .mockImplementation((_title, _message, buttons) => {
          const cancelButton = buttons?.find((b: any) => b.style === "cancel");
          cancelButton?.onPress?.();
        });

      const { getByTestId } = render(<PatientDetailScreen />);
      await waitFor(() => {
        expect(getByTestId("delete-button")).toBeTruthy();
      });

      fireEvent.press(getByTestId("delete-button"));

      expect(mockDeletePatient).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalledWith("MainTabs");

      alertSpy.mockRestore();
    });

    it("shows error banner when store has an error", async () => {
      usePatientsStore.setState({
        patients: [mockPatient],
        error: "Erreur de suppression",
      } as any);

      const { getByTestId, getByText } = render(<PatientDetailScreen />);
      await waitFor(() => {
        expect(getByTestId("error-banner")).toBeTruthy();
        expect(getByText("Erreur de suppression")).toBeTruthy();
      });
    });
  });

  it("shows error widget when patient is not found", async () => {
    usePatientsStore.setState({
      patients: [],
      isLoading: false,
      error: null,
    } as any);

    const { getByText } = render(<PatientDetailScreen />);
    await waitFor(() => {
      expect(getByText("Patient introuvable.")).toBeTruthy();
    });
  });

  it("calls getForPatient with the correct patientId", async () => {
    render(<PatientDetailScreen />);
    await waitFor(() => {
      expect(mockGetForPatient).toHaveBeenCalledWith("p1");
    });
  });

  it("renders Modifier button", () => {
    const { getByTestId } = render(<PatientDetailScreen />);
    expect(getByTestId("edit-button")).toBeTruthy();
  });

  it("renders Archiver button", () => {
    const { getByTestId } = render(<PatientDetailScreen />);
    expect(getByTestId("archive-button")).toBeTruthy();
  });

  it("navigates to EditPatient on Modifier press", () => {
    const { getByTestId } = render(<PatientDetailScreen />);
    fireEvent.press(getByTestId("edit-button"));
    expect(mockNavigate).toHaveBeenCalledWith("EditPatient", { patientId: "p1" });
  });
});
