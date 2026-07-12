import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { EditPatientScreen } from "../edit-patient-screen";

// NewPatient (le vrai composant, non mocké ici) importe PainEditor — on le
// mocke pour garder ce test focalisé sur le flux d'erreur, et on laisse le
// vrai NewPatient actif pour vérifier bout en bout que son `catch` (Alert +
// pas de goBack) se déclenche bien maintenant que le store propage l'erreur
// de mise à jour.
jest.mock("../../components/pain-editor", () => ({
  PainEditor: () => null,
}));

const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    dispatch: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  }),
  useRoute: () => ({ params: { patientId: "p1" } }),
}));

const mockPatient = {
  id: "p1",
  name: "Jean Dupont",
  dateOfBirth: "1990-01-01",
  morphologicalProfile: { sex: "male" as const },
  createdAt: "2024-01-01T00:00:00Z",
};

const mockUpdatePatient = jest.fn();
jest.mock("../../store/patients-store", () => ({
  usePatientsStore: jest.fn((selector: any) =>
    selector({ patients: [mockPatient], updatePatient: mockUpdatePatient }),
  ),
}));

describe("EditPatientScreen — gestion de l'échec de mise à jour", () => {
  beforeEach(() => {
    mockGoBack.mockClear();
    mockUpdatePatient.mockReset();
  });

  it("reste sur l'écran et affiche une alerte quand updatePatient échoue (ne navigue pas en arrière)", async () => {
    mockUpdatePatient.mockRejectedValue(new Error("Erreur réseau"));
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

    const { getByTestId } = render(<EditPatientScreen />);
    fireEvent.press(getByTestId("np-submit"));

    await waitFor(() => {
      expect(mockUpdatePatient).toHaveBeenCalledWith("p1", expect.any(Object));
    });
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Erreur", "Erreur réseau");
    });
    expect(mockGoBack).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it("navigue en arrière quand updatePatient réussit", async () => {
    mockUpdatePatient.mockResolvedValue(undefined);

    const { getByTestId } = render(<EditPatientScreen />);
    fireEvent.press(getByTestId("np-submit"));

    await waitFor(() => {
      expect(mockUpdatePatient).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockGoBack).toHaveBeenCalled();
    });
  });
});
