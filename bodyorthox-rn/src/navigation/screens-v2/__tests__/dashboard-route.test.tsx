import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Dashboard, DashboardRoute, formatPractitionerName } from "../dashboard-route";
import { useAuthStore } from "../../../core/auth/auth-store";
import { usePatientsStore } from "../../../features/patients/store/patients-store";
import { countAnalysesToday } from "../../../features/capture/data/analysis-metrics";
import type { Patient } from "../../../features/patients/domain/patient";

jest.mock("../../../features/capture/data/analysis-metrics", () => ({
  countAnalysesToday: jest.fn(() => Promise.resolve(0)),
}));

const mockCountAnalysesToday = countAnalysesToday as jest.Mock;

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
    fireEvent.press(getByLabelText("Nouvelle capture"));
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
    fireEvent.press(getByLabelText("Nouvelle capture"));
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
    fireEvent.press(getByLabelText("Nouvelle capture"));
    const newPatientButtons = getAllByLabelText("Nouveau patient");
    // Le dernier est celui du picker (le premier est la grille d'actions).
    fireEvent.press(newPatientButtons[newPatientButtons.length - 1]!);
    expect(onQuickAction).toHaveBeenCalledWith("new-patient");
    expect(queryByLabelText("Rechercher un patient")).toBeNull();
  });

  it("affiche le nombre d'analyses du jour (vraie métrique du cabinet, pas les nouveaux patients)", async () => {
    mockCountAnalysesToday.mockResolvedValueOnce(3);
    const { findByText, getByText, queryByText } = render(<Dashboard />);
    expect(await findByText("3")).toBeTruthy();
    expect(getByText("Analyses")).toBeTruthy();
    expect(getByText("Aujourd’hui")).toBeTruthy();
    // L'ancienne stat « Nouveaux patients » (souvent 0, faible valeur) a disparu.
    expect(queryByText("Nouveaux patients")).toBeNull();
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

  it("n'affiche plus la cloche de notifications (promesse morte : aucun centre de notifications)", () => {
    const { queryByLabelText } = render(<Dashboard />);
    expect(queryByLabelText("Notifications — bientôt disponible")).toBeNull();
  });

  it("propose « Nouveau patient » et « Protocoles » en actions rapides, sans doublons de la tab bar", () => {
    const onQuickAction = jest.fn();
    const { getByText, queryByText, getAllByLabelText } = render(
      <Dashboard onQuickAction={onQuickAction} />,
    );
    // « Rapport » doublait l'onglet Rapports ; « Analyse » doublait le bouton
    // capture central. Remplacés par Protocoles (guide de positionnement).
    expect(queryByText("Rapport")).toBeNull();
    expect(queryByText("Analyse")).toBeNull();
    fireEvent.press(getByText("Protocoles"));
    expect(onQuickAction).toHaveBeenCalledWith("protocols");
    fireEvent.press(getAllByLabelText("Nouveau patient")[0]!);
    expect(onQuickAction).toHaveBeenCalledWith("new-patient");
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
    fireEvent.press(getByLabelText("Nouvelle capture"));
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
    fireEvent.press(getByLabelText("Nouvelle capture"));
    // Le même patient apparaît aussi dans « Patients récents » : on cible la
    // ligne du picker, la dernière dans l'arbre rendu.
    const rows = getAllByLabelText("Jean Dupont");
    fireEvent.press(rows[rows.length - 1]!);
    expect(mockNavigate).toHaveBeenCalledWith("Capture", { patientId: "p1" });
  });

  it("« Nouveau patient » depuis le sélecteur navigue vers CreatePatient", () => {
    const { getByLabelText, getAllByLabelText } = render(<DashboardRoute />);
    fireEvent.press(getByLabelText("Nouvelle capture"));
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

describe("formatPractitionerName", () => {
  it("préfixe Dr. sur un nom simple", () => {
    expect(
      formatPractitionerName({ firstName: "Marie", lastName: "Curie", email: "m@x.fr" }),
    ).toBe("Dr. Marie Curie");
  });

  it("ne double pas le préfixe quand le prénom contient déjà « Dr. »", () => {
    expect(
      formatPractitionerName({ firstName: "Dr.", lastName: "Orthopédiste", email: "o@x.fr" }),
    ).toBe("Dr. Orthopédiste");
    expect(
      formatPractitionerName({ firstName: "Dr. Jean", lastName: "Martin", email: "j@x.fr" }),
    ).toBe("Dr. Jean Martin");
  });

  it("ne double pas le préfixe dérivé de l'email", () => {
    expect(formatPractitionerName({ email: "dr.martin@exemple.fr" })).toBe("Dr Martin");
  });

  it("retombe sur « Praticien » sans utilisateur", () => {
    expect(formatPractitionerName(null)).toBe("Praticien");
  });
});
