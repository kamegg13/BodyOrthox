import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
  act,
} from "@testing-library/react-native";
import { PatientsScreen } from "../patients-screen";
import type { Patient } from "../../domain/patient";

// ---------------------------------------------------------------------------
// Mock navigation
// ---------------------------------------------------------------------------
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    replace: jest.fn(),
    push: jest.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Mock patients store
// ---------------------------------------------------------------------------
const mockLoadPatients = jest.fn();
const mockSetSearchQuery = jest.fn();
const mockClearError = jest.fn();

let mockStoreState: {
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  loadPatients: jest.Mock;
  setSearchQuery: jest.Mock;
  clearError: jest.Mock;
};

jest.mock("../../store/patients-store", () => ({
  usePatientsStore: () => mockStoreState,
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
function buildPatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: "patient-1",
    name: "Dupont Jean",
    dateOfBirth: "1990-01-15",
    morphologicalProfile: null,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const patient1 = buildPatient({ id: "patient-1", name: "Dupont Jean" });
const patient2 = buildPatient({
  id: "patient-2",
  name: "Martin Sophie",
  dateOfBirth: "1985-06-20",
});
const patient3 = buildPatient({
  id: "patient-3",
  name: "Bernard Pierre",
  dateOfBirth: "1975-03-10",
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderScreen() {
  return render(<PatientsScreen />);
}

function defaultStoreState(): typeof mockStoreState {
  return {
    patients: [patient1, patient2],
    isLoading: false,
    error: null,
    searchQuery: "",
    loadPatients: mockLoadPatients,
    setSearchQuery: mockSetSearchQuery,
    clearError: mockClearError,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("PatientsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockStoreState = defaultStoreState();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // AC1: Patient list rendering
  // -------------------------------------------------------------------------
  describe("AC1 — patient list display", () => {
    it("calls loadPatients on mount", () => {
      renderScreen();

      expect(mockLoadPatients).toHaveBeenCalledTimes(1);
    });

    it("renders patient list with PatientListTile for each patient", () => {
      renderScreen();

      expect(screen.getByTestId("patients-list")).toBeTruthy();
      expect(screen.getByTestId("patient-tile-patient-1")).toBeTruthy();
      expect(screen.getByTestId("patient-tile-patient-2")).toBeTruthy();
    });

    it("renders patient names in the list", () => {
      renderScreen();

      expect(screen.getByText("Dupont Jean")).toBeTruthy();
      expect(screen.getByText("Martin Sophie")).toBeTruthy();
    });

    it("renders the screen title", () => {
      renderScreen();

      expect(screen.getByText("Antidote Sport")).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // AC2: Loading state
  // -------------------------------------------------------------------------
  describe("AC2 — loading state", () => {
    it("shows LoadingSpinner when loading and no patients", () => {
      mockStoreState = {
        ...defaultStoreState(),
        patients: [],
        isLoading: true,
      };
      renderScreen();

      expect(screen.getByText("Chargement des patients...")).toBeTruthy();
    });

    it("does not show loading spinner when patients are already loaded", () => {
      mockStoreState = {
        ...defaultStoreState(),
        isLoading: true,
      };
      renderScreen();

      expect(screen.queryByText("Chargement des patients...")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // AC3: Search/filter
  // -------------------------------------------------------------------------
  describe("AC3 — search with debounce", () => {
    it("renders search input", () => {
      renderScreen();

      expect(screen.getByTestId("search-input")).toBeTruthy();
    });

    it("calls setSearchQuery after debounce delay", () => {
      renderScreen();

      fireEvent.changeText(screen.getByTestId("search-input"), "Dupont");

      // Before debounce fires
      expect(mockSetSearchQuery).not.toHaveBeenCalled();

      // After debounce (200ms)
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockSetSearchQuery).toHaveBeenCalledWith("Dupont");
    });

    it("debounces multiple keystrokes, only calling setSearchQuery once", () => {
      renderScreen();

      fireEvent.changeText(screen.getByTestId("search-input"), "D");
      act(() => {
        jest.advanceTimersByTime(100);
      });
      fireEvent.changeText(screen.getByTestId("search-input"), "Du");
      act(() => {
        jest.advanceTimersByTime(100);
      });
      fireEvent.changeText(screen.getByTestId("search-input"), "Dup");

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Only the last query should have been sent
      expect(mockSetSearchQuery).toHaveBeenCalledTimes(1);
      expect(mockSetSearchQuery).toHaveBeenCalledWith("Dup");
    });

    it("shows 'no match' message when search returns empty with searchQuery set", () => {
      mockStoreState = {
        ...defaultStoreState(),
        patients: [],
        searchQuery: "xyz",
      };
      renderScreen();

      expect(
        screen.getByText("Aucun patient ne correspond à votre recherche."),
      ).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // AC4: Patient selection and navigation
  // -------------------------------------------------------------------------
  describe("AC4 — patient selection", () => {
    it("navigates to PatientDetail with patientId when patient tile is pressed", () => {
      renderScreen();

      fireEvent.press(screen.getByTestId("patient-tile-patient-1"));

      expect(mockNavigate).toHaveBeenCalledWith("PatientDetail", {
        patientId: "patient-1",
      });
    });

    it("navigates to PatientDetail for second patient", () => {
      renderScreen();

      fireEvent.press(screen.getByTestId("patient-tile-patient-2"));

      expect(mockNavigate).toHaveBeenCalledWith("PatientDetail", {
        patientId: "patient-2",
      });
    });
  });

  // -------------------------------------------------------------------------
  // AC5: Empty state
  // -------------------------------------------------------------------------
  describe("AC5 — empty state", () => {
    it('shows "Aucun patient" when no patients and no search query', () => {
      mockStoreState = {
        ...defaultStoreState(),
        patients: [],
        searchQuery: "",
      };
      renderScreen();

      expect(screen.getByText("Aucun patient")).toBeTruthy();
      expect(
        screen.getByText("Ajoutez votre premier patient pour commencer."),
      ).toBeTruthy();
    });

    it("shows add button in empty state", () => {
      mockStoreState = {
        ...defaultStoreState(),
        patients: [],
      };
      renderScreen();

      expect(screen.getByTestId("add-patient-button")).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // AC6: Error state
  // -------------------------------------------------------------------------
  describe("AC6 — error handling", () => {
    it("shows ErrorWidget with error message when error is set", () => {
      mockStoreState = {
        ...defaultStoreState(),
        error: "Impossible de charger les patients",
      };
      renderScreen();

      expect(
        screen.getByText("Impossible de charger les patients"),
      ).toBeTruthy();
    });

    it('shows a "Réessayer" button on error', () => {
      mockStoreState = {
        ...defaultStoreState(),
        error: "DB error",
      };
      renderScreen();

      expect(screen.getByText("Réessayer")).toBeTruthy();
    });

    it("calls clearError and loadPatients when retry button is pressed", () => {
      mockStoreState = {
        ...defaultStoreState(),
        error: "DB error",
      };
      renderScreen();

      fireEvent.press(screen.getByText("Réessayer"));

      expect(mockClearError).toHaveBeenCalledTimes(1);
      // loadPatients is called once on mount and once on retry
      expect(mockLoadPatients).toHaveBeenCalledTimes(2);
    });

    it("does not show patient list when error is set", () => {
      mockStoreState = {
        ...defaultStoreState(),
        error: "DB error",
      };
      renderScreen();

      expect(screen.queryByTestId("patients-list")).toBeNull();
      expect(screen.queryByTestId("search-input")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Add patient button / navigation to CreatePatient
  // -------------------------------------------------------------------------
  describe("add patient button", () => {
    it('navigates to CreatePatient when "+" button is pressed', () => {
      renderScreen();

      fireEvent.press(screen.getByTestId("add-patient-button"));

      expect(mockNavigate).toHaveBeenCalledWith("CreatePatient");
    });

    it("has correct accessibility label", () => {
      renderScreen();

      const button = screen.getByTestId("add-patient-button");
      expect(button.props.accessibilityLabel).toBe("Ajouter un patient");
    });
  });

  // -------------------------------------------------------------------------
  // Multiple patients
  // -------------------------------------------------------------------------
  describe("multiple patients rendering", () => {
    it("renders all three patients when provided", () => {
      mockStoreState = {
        ...defaultStoreState(),
        patients: [patient1, patient2, patient3],
      };
      renderScreen();

      expect(screen.getByTestId("patient-tile-patient-1")).toBeTruthy();
      expect(screen.getByTestId("patient-tile-patient-2")).toBeTruthy();
      expect(screen.getByTestId("patient-tile-patient-3")).toBeTruthy();
    });
  });
});
