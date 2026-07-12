import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Dashboard } from "../Dashboard";
import { usePatientsStore } from "../../features/patients/store/patients-store";
import type { Patient } from "../../features/patients/domain/patient";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function makePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: overrides.id ?? "p1",
    name: "Jean Dupont",
    morphologicalProfile: null,
    createdAt: isoDaysAgo(10),
    ...overrides,
  };
}

describe("Dashboard", () => {
  beforeEach(() => {
    usePatientsStore.setState({
      patients: [],
      isLoading: false,
      error: null,
      searchQuery: "",
    });
  });

  it("ne promet plus un démarrage automatique de l'analyse sur le CTA de capture", () => {
    const { getByText, queryByText } = render(<Dashboard />);
    expect(getByText("Nouvelle capture")).toBeTruthy();
    expect(getByText("Choisissez le patient et la capture démarre")).toBeTruthy();
    expect(queryByText("L’analyse HKA démarre automatiquement")).toBeNull();
    expect(queryByText("Choisissez un patient pour démarrer")).toBeNull();
  });

  it("ouvre le sélecteur rapide de patient au tap sur le CTA hero « Capture »", () => {
    const { getByLabelText, queryByLabelText } = render(<Dashboard />);
    expect(queryByLabelText("Rechercher un patient")).toBeNull();
    fireEvent.press(getByLabelText("Capture"));
    expect(getByLabelText("Rechercher un patient")).toBeTruthy();
  });

  it("sélectionner un patient dans le sélecteur déclenche onCaptureForPatient et referme le picker", () => {
    usePatientsStore.setState({
      patients: [makePatient({ id: "p1", name: "Jean Dupont" })],
    });
    const onCaptureForPatient = jest.fn();
    const { getByLabelText, getAllByLabelText, queryByLabelText } = render(
      <Dashboard onCaptureForPatient={onCaptureForPatient} />,
    );
    fireEvent.press(getByLabelText("Capture"));
    // Le même patient apparaît aussi dans « Patients récents » : on cible la
    // ligne du picker, la dernière dans l'arbre rendu.
    const rows = getAllByLabelText("Jean Dupont");
    fireEvent.press(rows[rows.length - 1]!);
    expect(onCaptureForPatient).toHaveBeenCalledWith(
      expect.objectContaining({ id: "p1" }),
    );
    expect(queryByLabelText("Rechercher un patient")).toBeNull();
  });

  it("« Nouveau patient » dans le sélecteur déclenche onQuickAction et referme le picker", () => {
    const onQuickAction = jest.fn();
    const { getByLabelText, queryByLabelText, getAllByLabelText } = render(
      <Dashboard onQuickAction={onQuickAction} />,
    );
    fireEvent.press(getByLabelText("Capture"));
    const newPatientButtons = getAllByLabelText("Nouveau patient");
    // Le dernier est celui du picker (le premier est la grille d'actions).
    fireEvent.press(newPatientButtons[newPatientButtons.length - 1]!);
    expect(onQuickAction).toHaveBeenCalledWith("new-patient");
    expect(queryByLabelText("Rechercher un patient")).toBeNull();
  });

  it("calcule les nouveaux patients du jour à partir des vrais timestamps", () => {
    usePatientsStore.setState({
      patients: [
        makePatient({ id: "today-1", createdAt: isoDaysAgo(0) }),
        makePatient({ id: "old-1", createdAt: isoDaysAgo(15) }),
      ],
    });
    const { getByText } = render(<Dashboard />);
    expect(getByText("1")).toBeTruthy();
    expect(getByText("Nouveaux patients")).toBeTruthy();
  });

  it("remplace la carte Rapports (aucune source fiable) par une stat honnête de patients suivis", () => {
    usePatientsStore.setState({
      patients: [
        makePatient({
          id: "with-pain",
          createdAt: isoDaysAgo(20),
          morphologicalProfile: {
            pains: [{ id: "pain-1", location: "knee", side: "left", intensity: 4, type: "chronic" }],
          },
        }),
        makePatient({ id: "no-pain", createdAt: isoDaysAgo(20) }),
      ],
    });
    const { getByText, queryByText } = render(<Dashboard />);
    expect(getByText("Suivis")).toBeTruthy();
    expect(getByText("Avec douleurs")).toBeTruthy();
    // L'ancienne stat inventée ("Rapports" / "Générés") a disparu — on vérifie
    // "Générés" seul : "Rapports" seul existe légitimement ailleurs (label de
    // l'onglet bas de page RapportsTab), donc pas un bon signal ici.
    expect(queryByText("Générés")).toBeNull();
  });

  it("affiche un état vide actionnable quand il n'y a aucun patient récent", () => {
    const onQuickAction = jest.fn();
    const { getByText } = render(<Dashboard onQuickAction={onQuickAction} />);
    expect(getByText("Aucun patient")).toBeTruthy();
    const action = getByText("Ajouter un patient");
    fireEvent.press(action);
    expect(onQuickAction).toHaveBeenCalledWith("new-patient");
  });

  it("désactive visuellement la cloche de notifications (aucun handler disponible)", () => {
    const { getByLabelText } = render(<Dashboard />);
    const bell = getByLabelText("Notifications — bientôt disponible");
    expect(bell.props.accessibilityState?.disabled).toBe(true);
  });

  it("expose « Voir tout » comme un bouton accessible", () => {
    const onSeeAllPatients = jest.fn();
    const { getByLabelText } = render(<Dashboard onSeeAllPatients={onSeeAllPatients} />);
    const seeAll = getByLabelText("Voir tous les patients");
    expect(seeAll.props.accessibilityRole).toBe("button");
    fireEvent.press(seeAll);
    expect(onSeeAllPatients).toHaveBeenCalledTimes(1);
  });
});
