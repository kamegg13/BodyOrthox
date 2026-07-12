import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { DashboardRoute } from "../dashboard-route";
import { useAuthStore } from "../../../core/auth/auth-store";
import { usePatientsStore } from "../../../features/patients/store/patients-store";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe("DashboardRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePatientsStore.setState({ patients: [], isLoading: false, error: null, searchQuery: "" });
    useAuthStore.setState({
      user: { firstName: "Marie", lastName: "Curie", email: "marie@example.com" },
    } as any);
  });

  it("ouvre le sélecteur rapide de patient au tap sur « Nouvelle capture » (sans naviguer)", () => {
    const { getByLabelText } = render(<DashboardRoute />);
    fireEvent.press(getByLabelText("Capture"));
    expect(getByLabelText("Rechercher un patient")).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("navigue directement vers Capture avec le bon patientId depuis le sélecteur", () => {
    usePatientsStore.setState({
      patients: [
        { id: "p1", name: "Jean Dupont", morphologicalProfile: null, createdAt: new Date().toISOString() },
      ],
      isLoading: false,
      error: null,
      searchQuery: "",
    } as any);
    const { getByLabelText, getAllByLabelText } = render(<DashboardRoute />);
    fireEvent.press(getByLabelText("Capture"));
    // Le même patient apparaît aussi dans « Patients récents » : on cible la
    // ligne du picker, la dernière dans l'arbre rendu.
    const rows = getAllByLabelText("Jean Dupont");
    fireEvent.press(rows[rows.length - 1]!);
    expect(mockNavigate).toHaveBeenCalledWith("Capture", { patientId: "p1" });
  });

  it("« Nouveau patient » depuis le sélecteur navigue vers CreatePatient", () => {
    const { getByLabelText, getAllByLabelText } = render(<DashboardRoute />);
    fireEvent.press(getByLabelText("Capture"));
    const newPatientButtons = getAllByLabelText("Nouveau patient");
    fireEvent.press(newPatientButtons[newPatientButtons.length - 1]!);
    expect(mockNavigate).toHaveBeenCalledWith("CreatePatient");
  });

  it("navigue vers CreatePatient pour l'action « Nouveau patient »", () => {
    const { getByLabelText } = render(<DashboardRoute />);
    fireEvent.press(getByLabelText("Nouveau patient"));
    expect(mockNavigate).toHaveBeenCalledWith("CreatePatient");
  });
});
