import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { PatientList } from "../PatientList";
import { usePatientsStore } from "../../features/patients/store/patients-store";
import type { Patient } from "../../features/patients/domain/patient";

const mockPatient: Patient = {
  id: "p1",
  name: "Jean Dupont",
  dateOfBirth: "1990-01-01",
  morphologicalProfile: { sex: "male" },
  createdAt: "2024-01-01T00:00:00Z",
};

function resetStore(overrides?: Partial<ReturnType<typeof usePatientsStore.getState>>) {
  usePatientsStore.setState({
    patients: [],
    filteredPatients: [],
    isLoading: false,
    error: null,
    searchQuery: "",
    sortBy: "alpha",
    activeFilters: new Set(),
    loadPatients: jest.fn(),
    setSearchQuery: jest.fn(),
    toggleFilter: jest.fn(),
    clearFilters: jest.fn(),
    setSortBy: jest.fn(),
    ...overrides,
  });
}

describe("PatientList", () => {
  beforeEach(() => {
    resetStore();
  });

  it('does not render a redundant "Actifs" chip (default view already hides archived)', () => {
    resetStore({});
    const { queryByText, getByText } = render(<PatientList />);
    expect(queryByText("Actifs")).toBeNull();
    expect(getByText(/Tous/)).toBeTruthy();
    expect(getByText("Archivés")).toBeTruthy();
  });

  it('binds the "Archivés" chip to the archived filter (never a sport activity-level filter)', () => {
    const toggleFilter = jest.fn();
    resetStore({ toggleFilter });
    const { getByText } = render(<PatientList />);
    fireEvent.press(getByText("Archivés"));
    expect(toggleFilter).toHaveBeenCalledWith("archived");
  });

  it("renders the shared EmptyState with a CTA when there are no patients at all", () => {
    const onAddPatient = jest.fn();
    resetStore({ patients: [], filteredPatients: [] });
    const { getByText } = render(<PatientList onAddPatient={onAddPatient} />);
    expect(getByText("Aucun patient")).toBeTruthy();
    fireEvent.press(getByText("Nouveau patient"));
    expect(onAddPatient).toHaveBeenCalled();
  });

  it("renders an EmptyState without CTA when filters exclude every patient", () => {
    resetStore({ patients: [mockPatient], filteredPatients: [] });
    const { getByText, queryByText } = render(<PatientList />);
    expect(getByText("Aucun résultat")).toBeTruthy();
    expect(queryByText("Nouveau patient")).toBeNull();
  });

  it("exposes a discreet sort control that cycles through sort modes", () => {
    const setSortBy = jest.fn();
    resetStore({ patients: [mockPatient], filteredPatients: [mockPatient], sortBy: "alpha", setSortBy });
    const { getByLabelText } = render(<PatientList />);
    fireEvent.press(getByLabelText("Trier les patients"));
    expect(setSortBy).toHaveBeenCalledWith("recent");
  });

  it("gives the add-patient button a hitSlop so its touch target reaches 44px", () => {
    resetStore();
    const { getByLabelText } = render(<PatientList />);
    const btn = getByLabelText("Nouveau patient");
    expect(btn.props.hitSlop).toBeTruthy();
  });

  describe("virtualisation (FlatList)", () => {
    const patient2: Patient = {
      id: "p2",
      name: "Alice Martin",
      dateOfBirth: "1985-05-05",
      morphologicalProfile: { sex: "female" },
      createdAt: "2024-01-02T00:00:00Z",
    };

    it("rend la liste des patients via une FlatList avec un keyExtractor stable", () => {
      resetStore({
        patients: [mockPatient, patient2],
        filteredPatients: [mockPatient, patient2],
      });
      const { getByTestId } = render(<PatientList />);
      const list = getByTestId("patient-list");
      expect(list.props.data).toEqual([mockPatient, patient2]);
      expect(list.props.keyExtractor(mockPatient)).toBe("p1");
    });

    it("garde keyboardShouldPersistTaps pour que la recherche reste utilisable", () => {
      resetStore({
        patients: [mockPatient],
        filteredPatients: [mockPatient],
      });
      const { getByTestId } = render(<PatientList />);
      expect(getByTestId("patient-list").props.keyboardShouldPersistTaps).toBe(
        "handled",
      );
    });

    it("affiche chaque patient de la liste filtrée", () => {
      resetStore({
        patients: [mockPatient, patient2],
        filteredPatients: [mockPatient, patient2],
      });
      const { getByText } = render(<PatientList />);
      expect(getByText("Jean Dupont")).toBeTruthy();
      expect(getByText("Alice Martin")).toBeTruthy();
    });

    it("déclenche onPatientPress au tap sur une ligne", () => {
      const onPatientPress = jest.fn();
      resetStore({
        patients: [mockPatient],
        filteredPatients: [mockPatient],
      });
      const { getByText } = render(<PatientList onPatientPress={onPatientPress} />);
      fireEvent.press(getByText("Jean Dupont"));
      expect(onPatientPress).toHaveBeenCalledWith(mockPatient);
    });
  });
});
