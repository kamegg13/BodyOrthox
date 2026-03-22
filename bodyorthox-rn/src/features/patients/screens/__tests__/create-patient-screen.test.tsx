import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
  act,
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
  fireEvent.changeText(screen.getByTestId("name-input"), "Jean");
  fireEvent.changeText(screen.getByTestId("lastname-input"), "Dupont");
  fireEvent.changeText(screen.getByTestId("dob-input"), "1990-01-15");
}

function pressSubmit() {
  fireEvent.press(screen.getByTestId("submit-button"));
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
  describe("AC2 \u2014 form fields rendering", () => {
    it("renders all required and optional fields", () => {
      renderScreen();

      expect(screen.getByTestId("name-input")).toBeTruthy();
      expect(screen.getByTestId("lastname-input")).toBeTruthy();
      expect(screen.getByTestId("dob-input")).toBeTruthy();
      expect(screen.getByTestId("height-input")).toBeTruthy();
      expect(screen.getByTestId("weight-input")).toBeTruthy();
      expect(screen.getByTestId("notes-input")).toBeTruthy();
      expect(screen.getByTestId("submit-button")).toBeTruthy();
    });

    it("renders field labels", () => {
      renderScreen();

      expect(screen.getByText(/Pr\u00e9nom/)).toBeTruthy();
      expect(screen.getByText("Nom")).toBeTruthy();
      expect(screen.getByText("Date de naissance")).toBeTruthy();
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

      expect(screen.getByText(/Cr\u00e9er le patient/)).toBeTruthy();
    });

    it("renders iOS-style navigation header", () => {
      renderScreen();

      expect(screen.getByText("Annuler")).toBeTruthy();
      expect(screen.getByTestId("nav-create-button")).toBeTruthy();
    });

    it("renders RGPD notice", () => {
      renderScreen();

      expect(
        screen.getByText(/stock\u00e9es uniquement sur cet appareil/),
      ).toBeTruthy();
    });

    it("renders illustration text", () => {
      renderScreen();

      expect(
        screen.getByText(/Compl\u00e9tez le formulaire pour commencer/),
      ).toBeTruthy();
    });

    it("renders section header", () => {
      renderScreen();

      expect(screen.getByText("INFORMATIONS PERSONNELLES")).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // AC3: Required field validation
  // -------------------------------------------------------------------------
  describe("AC3 \u2014 required field validation", () => {
    it("shows error when name is empty on submit", async () => {
      renderScreen();

      fireEvent.changeText(screen.getByTestId("dob-input"), "1990-01-15");
      pressSubmit();

      expect(screen.getByText("Le nom est obligatoire.")).toBeTruthy();
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });

    it("shows error when date of birth is empty on submit", async () => {
      renderScreen();

      fireEvent.changeText(screen.getByTestId("name-input"), "Jean");
      fireEvent.changeText(screen.getByTestId("lastname-input"), "Dupont");
      pressSubmit();

      expect(
        screen.getByText("La date de naissance est obligatoire."),
      ).toBeTruthy();
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });

    it("shows error when date of birth is in the future", async () => {
      renderScreen();

      fireEvent.changeText(screen.getByTestId("name-input"), "Jean");
      fireEvent.changeText(screen.getByTestId("lastname-input"), "Dupont");
      fireEvent.changeText(screen.getByTestId("dob-input"), "2099-01-01");
      pressSubmit();

      expect(screen.getByText(/Ne peut pas/)).toBeTruthy();
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });

    it("shows error when date of birth is invalid format", async () => {
      renderScreen();

      fireEvent.changeText(screen.getByTestId("name-input"), "Jean");
      fireEvent.changeText(screen.getByTestId("lastname-input"), "Dupont");
      fireEvent.changeText(screen.getByTestId("dob-input"), "not-a-date");
      pressSubmit();

      expect(screen.getByText(/Date invalide/)).toBeTruthy();
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });

    it("shows both errors when both name and date are empty", async () => {
      renderScreen();

      pressSubmit();

      expect(screen.getByText("Le nom est obligatoire.")).toBeTruthy();
      expect(
        screen.getByText("La date de naissance est obligatoire."),
      ).toBeTruthy();
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // AC4: Optional field validation
  // -------------------------------------------------------------------------
  describe("AC4 \u2014 optional field validation", () => {
    it("shows error when height is below 50 cm", async () => {
      renderScreen();

      fillValidForm();
      fireEvent.changeText(screen.getByTestId("height-input"), "30");
      pressSubmit();

      expect(screen.getByText(/Taille invalide/)).toBeTruthy();
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });

    it("shows error when height is above 250 cm", async () => {
      renderScreen();

      fillValidForm();
      fireEvent.changeText(screen.getByTestId("height-input"), "300");
      pressSubmit();

      expect(screen.getByText(/Taille invalide/)).toBeTruthy();
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });

    it("shows error when weight is below 10 kg", async () => {
      renderScreen();

      fillValidForm();
      fireEvent.changeText(screen.getByTestId("weight-input"), "5");
      pressSubmit();

      expect(screen.getByText(/Poids invalide/)).toBeTruthy();
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });

    it("shows error when weight is above 300 kg", async () => {
      renderScreen();

      fillValidForm();
      fireEvent.changeText(screen.getByTestId("weight-input"), "400");
      pressSubmit();

      expect(screen.getByText(/Poids invalide/)).toBeTruthy();
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });

    it("shows error when height is not a number", async () => {
      renderScreen();

      fillValidForm();
      fireEvent.changeText(screen.getByTestId("height-input"), "abc");
      pressSubmit();

      expect(screen.getByText(/Taille invalide/)).toBeTruthy();
      expect(mockCreatePatient).not.toHaveBeenCalled();
    });

    it("accepts valid optional height and weight", async () => {
      renderScreen();

      fillValidForm();
      fireEvent.changeText(screen.getByTestId("height-input"), "175");
      fireEvent.changeText(screen.getByTestId("weight-input"), "70");
      pressSubmit();

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
  describe("AC5 \u2014 patient creation", () => {
    it("calls createPatient with correct input for minimal form", async () => {
      renderScreen();

      fillValidForm();
      pressSubmit();

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
      pressSubmit();

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

      fireEvent.changeText(screen.getByTestId("name-input"), "  Jean  ");
      fireEvent.changeText(screen.getByTestId("lastname-input"), "  Dupont  ");
      fireEvent.changeText(screen.getByTestId("dob-input"), "1990-01-15");
      pressSubmit();

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
  describe("AC6 \u2014 navigation after creation", () => {
    it("navigates back after successful patient creation", async () => {
      renderScreen();

      fillValidForm();
      pressSubmit();

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalledTimes(1);
      });
    });

    it("navigates back when cancel button is pressed", () => {
      renderScreen();

      fireEvent.press(screen.getByTestId("cancel-button"));

      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // AC7: Error handling during creation
  // -------------------------------------------------------------------------
  describe("AC7 \u2014 error handling", () => {
    it("shows alert when createPatient throws an Error", async () => {
      mockCreatePatient.mockRejectedValue(new Error("Database error"));
      renderScreen();

      fillValidForm();
      pressSubmit();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Erreur", "Database error");
      });
    });

    it("shows generic alert when createPatient throws a non-Error", async () => {
      mockCreatePatient.mockRejectedValue("unknown error");
      renderScreen();

      fillValidForm();
      pressSubmit();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Erreur",
          expect.stringContaining("Impossible"),
        );
      });
    });

    it("does not navigate back on creation error", async () => {
      mockCreatePatient.mockRejectedValue(new Error("DB error"));
      renderScreen();

      fillValidForm();
      pressSubmit();

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
      pressSubmit();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      expect(screen.getByTestId("name-input").props.value).toBe("Jean");
      expect(screen.getByTestId("lastname-input").props.value).toBe("Dupont");
      expect(screen.getByTestId("dob-input").props.value).toBe("1990-01-15");
      expect(screen.getByTestId("height-input").props.value).toBe("175");
    });
  });

  // -------------------------------------------------------------------------
  // Submitting state
  // -------------------------------------------------------------------------
  describe("submitting state", () => {
    it('shows "Enregistrement..." text while submitting', async () => {
      mockCreatePatient.mockReturnValue(new Promise(() => {}));
      renderScreen();

      fillValidForm();
      pressSubmit();

      await waitFor(() => {
        expect(screen.getByText("Enregistrement...")).toBeTruthy();
      });
    });

    it("disables submit button while submitting", async () => {
      mockCreatePatient.mockReturnValue(new Promise(() => {}));
      renderScreen();

      fillValidForm();
      pressSubmit();

      await waitFor(() => {
        const button = screen.getByTestId("submit-button");
        const isDisabled =
          button.props.accessibilityState?.disabled ?? button.props.disabled;
        expect(isDisabled).toBeTruthy();
      });
    });
  });
});
