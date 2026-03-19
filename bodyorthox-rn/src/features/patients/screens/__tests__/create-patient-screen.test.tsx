import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
} from "@testing-library/react-native";
import { Alert } from "react-native";
import { CreatePatientScreen } from "../create-patient-screen";

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
const mockCreatePatient = jest.fn();

jest.mock("../../store/patients-store", () => ({
  usePatientsStore: () => ({
    createPatient: mockCreatePatient,
  }),
}));

// ---------------------------------------------------------------------------
// Mock Alert.alert
// ---------------------------------------------------------------------------
jest.spyOn(Alert, "alert");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderScreen() {
  return render(<CreatePatientScreen />);
}

function fillValidForm() {
  fireEvent.changeText(screen.getByTestId("name-input"), "Jean Dupont");
  fireEvent.changeText(screen.getByTestId("dob-input"), "1990-01-15");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("CreatePatientScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreatePatient.mockResolvedValue({
      id: "test-uuid-1234",
      name: "Jean Dupont",
      dateOfBirth: "1990-01-15",
      morphologicalProfile: {},
      createdAt: "2026-03-19T00:00:00.000Z",
    });
  });

  // -------------------------------------------------------------------------
  // AC2: Form fields visible
  // -------------------------------------------------------------------------
  describe("AC2 — form fields rendering", () => {
    it("renders all required and optional fields", () => {
      renderScreen();

      expect(screen.getByTestId("name-input")).toBeTruthy();
      expect(screen.getByTestId("dob-input")).toBeTruthy();
      expect(screen.getByTestId("height-input")).toBeTruthy();
      expect(screen.getByTestId("weight-input")).toBeTruthy();
      expect(screen.getByTestId("notes-input")).toBeTruthy();
      expect(screen.getByTestId("submit-button")).toBeTruthy();
    });

    it("renders field labels", () => {
      renderScreen();

      expect(screen.getByText("Nom complet *")).toBeTruthy();
      expect(screen.getByText("Date de naissance *")).toBeTruthy();
      expect(screen.getByText("Taille (cm)")).toBeTruthy();
      expect(screen.getByText("Poids (kg)")).toBeTruthy();
      expect(screen.getByText("Notes")).toBeTruthy();
    });

    it("renders the screen title", () => {
      renderScreen();

      expect(screen.getByText("Nouveau patient")).toBeTruthy();
    });

    it("renders the submit button text", () => {
      renderScreen();

      expect(screen.getByText("Créer le patient")).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // AC3: Required field validation
  // -------------------------------------------------------------------------
  describe("AC3 — required field validation", () => {
    it("shows error when name is empty on submit", async () => {
      renderScreen();

      fireEvent.changeText(screen.getByTestId("dob-input"), "1990-01-15");
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByText("Le nom est obligatoire.")).toBeTruthy();
      });
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });

    it("shows error when date of birth is empty on submit", async () => {
      renderScreen();

      fireEvent.changeText(screen.getByTestId("name-input"), "Jean Dupont");
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(
          screen.getByText("La date de naissance est obligatoire."),
        ).toBeTruthy();
      });
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });

    it("shows error when date of birth is in the future", async () => {
      renderScreen();

      fireEvent.changeText(screen.getByTestId("name-input"), "Jean Dupont");
      fireEvent.changeText(screen.getByTestId("dob-input"), "2099-01-01");
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByText(/Ne peut pas/)).toBeTruthy();
      });
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });

    it("shows error when date of birth is invalid format", async () => {
      renderScreen();

      fireEvent.changeText(screen.getByTestId("name-input"), "Jean Dupont");
      fireEvent.changeText(screen.getByTestId("dob-input"), "not-a-date");
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByText(/Date invalide/)).toBeTruthy();
      });
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });

    it("shows both errors when both name and date are empty", async () => {
      renderScreen();

      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByText("Le nom est obligatoire.")).toBeTruthy();
        expect(
          screen.getByText("La date de naissance est obligatoire."),
        ).toBeTruthy();
      });
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // AC4: Optional field validation (height and weight ranges)
  // -------------------------------------------------------------------------
  describe("AC4 — optional field validation", () => {
    it("shows error when height is below 50 cm", async () => {
      renderScreen();

      fillValidForm();
      fireEvent.changeText(screen.getByTestId("height-input"), "30");
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByText(/Taille invalide/)).toBeTruthy();
      });
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });

    it("shows error when height is above 250 cm", async () => {
      renderScreen();

      fillValidForm();
      fireEvent.changeText(screen.getByTestId("height-input"), "300");
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByText(/Taille invalide/)).toBeTruthy();
      });
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });

    it("shows error when weight is below 10 kg", async () => {
      renderScreen();

      fillValidForm();
      fireEvent.changeText(screen.getByTestId("weight-input"), "5");
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByText(/Poids invalide/)).toBeTruthy();
      });
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });

    it("shows error when weight is above 300 kg", async () => {
      renderScreen();

      fillValidForm();
      fireEvent.changeText(screen.getByTestId("weight-input"), "400");
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByText(/Poids invalide/)).toBeTruthy();
      });
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });

    it("shows error when height is not a number", async () => {
      renderScreen();

      fillValidForm();
      fireEvent.changeText(screen.getByTestId("height-input"), "abc");
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByText(/Taille invalide/)).toBeTruthy();
      });
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });

    it("accepts valid optional height and weight", async () => {
      renderScreen();

      fillValidForm();
      fireEvent.changeText(screen.getByTestId("height-input"), "175");
      fireEvent.changeText(screen.getByTestId("weight-input"), "70");
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(mockCreatePatient).toHaveBeenCalledWith({
          name: "Jean Dupont",
          dateOfBirth: "1990-01-15",
          morphologicalProfile: {
            heightCm: 175,
            weightKg: 70,
          },
        });
      });
    });
  });

  // -------------------------------------------------------------------------
  // AC5: Patient creation and persistence
  // -------------------------------------------------------------------------
  describe("AC5 — patient creation", () => {
    it("calls createPatient with correct input for minimal form", async () => {
      renderScreen();

      fillValidForm();
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(mockCreatePatient).toHaveBeenCalledWith({
          name: "Jean Dupont",
          dateOfBirth: "1990-01-15",
          morphologicalProfile: {},
        });
      });
    });

    it("calls createPatient with all fields filled", async () => {
      renderScreen();

      fillValidForm();
      fireEvent.changeText(screen.getByTestId("height-input"), "180");
      fireEvent.changeText(screen.getByTestId("weight-input"), "85");
      fireEvent.changeText(screen.getByTestId("notes-input"), "Patient notes");
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(mockCreatePatient).toHaveBeenCalledWith({
          name: "Jean Dupont",
          dateOfBirth: "1990-01-15",
          morphologicalProfile: {
            heightCm: 180,
            weightKg: 85,
            notes: "Patient notes",
          },
        });
      });
    });

    it("trims the patient name before submission", async () => {
      renderScreen();

      fireEvent.changeText(screen.getByTestId("name-input"), "  Jean Dupont  ");
      fireEvent.changeText(screen.getByTestId("dob-input"), "1990-01-15");
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(mockCreatePatient).toHaveBeenCalledWith(
          expect.objectContaining({ name: "Jean Dupont" }),
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // AC6: Navigation back after successful creation
  // -------------------------------------------------------------------------
  describe("AC6 — navigation after creation", () => {
    it("navigates back after successful patient creation", async () => {
      renderScreen();

      fillValidForm();
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalledTimes(1);
      });
    });
  });

  // -------------------------------------------------------------------------
  // AC7: Error handling during creation
  // -------------------------------------------------------------------------
  describe("AC7 — error handling", () => {
    it("shows alert when createPatient throws an Error", async () => {
      mockCreatePatient.mockRejectedValue(new Error("Database error"));
      renderScreen();

      fillValidForm();
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Erreur", "Database error");
      });
    });

    it("shows generic alert when createPatient throws a non-Error", async () => {
      mockCreatePatient.mockRejectedValue("unknown error");
      renderScreen();

      fillValidForm();
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Erreur",
          "Impossible de créer le patient.",
        );
      });
    });

    it("does not navigate back on creation error", async () => {
      mockCreatePatient.mockRejectedValue(new Error("DB error"));
      renderScreen();

      fillValidForm();
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });
      expect(mockGoBack).not.toHaveBeenCalled();
    });

    it("keeps form data intact after creation error", async () => {
      mockCreatePatient.mockRejectedValue(new Error("DB error"));
      renderScreen();

      fillValidForm();
      fireEvent.changeText(screen.getByTestId("height-input"), "175");
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Form fields should still have their values
      expect(screen.getByTestId("name-input").props.value).toBe("Jean Dupont");
      expect(screen.getByTestId("dob-input").props.value).toBe("1990-01-15");
      expect(screen.getByTestId("height-input").props.value).toBe("175");
    });
  });

  // -------------------------------------------------------------------------
  // Submitting state
  // -------------------------------------------------------------------------
  describe("submitting state", () => {
    it('shows "Enregistrement..." text while submitting', async () => {
      // Make createPatient hang to keep submitting state
      mockCreatePatient.mockReturnValue(new Promise(() => {}));
      renderScreen();

      fillValidForm();
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByText("Enregistrement...")).toBeTruthy();
      });
    });

    it("disables submit button while submitting", async () => {
      mockCreatePatient.mockReturnValue(new Promise(() => {}));
      renderScreen();

      fillValidForm();
      fireEvent.press(screen.getByTestId("submit-button"));

      await waitFor(() => {
        const button = screen.getByTestId("submit-button");
        const isDisabled =
          button.props.accessibilityState?.disabled ?? button.props.disabled;
        expect(isDisabled).toBeTruthy();
      });
    });
  });
});
