import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { ReportsList, ReportsListRoute, type ReportListItem } from "../reports-list-route";
import { usePatientsStore } from "../../../features/patients/store/patients-store";
import type { Analysis } from "../../../features/capture/domain/analysis";
import type { Patient } from "../../../features/patients/domain/patient";

const items: readonly ReportListItem[] = [
  {
    analysisId: "a1",
    patientId: "patient-1",
    patientName: "Jean Dupont",
    date: "24 avr 2026",
    range: "in_range",
  },
  {
    analysisId: "a2",
    patientId: "patient-2",
    patientName: "Sophie Leclerc",
    date: "20 avr 2026",
    range: "out_of_range",
  },
];

const noop = () => undefined;

describe("ReportsList", () => {
  describe("recherche", () => {
    it("affiche la barre de recherche", () => {
      const { getByTestId } = render(
        <ReportsList
          items={items}
          hasAnyReports
          searchQuery=""
          onSearchChange={noop}
          rangeFilter="all"
          onRangeFilterChange={noop}
        />,
      );
      expect(getByTestId("reports-search-input")).toBeTruthy();
    });

    it("appelle onSearchChange à la saisie", () => {
      const onSearchChange = jest.fn();
      const { getByTestId } = render(
        <ReportsList
          items={items}
          hasAnyReports
          searchQuery=""
          onSearchChange={onSearchChange}
          rangeFilter="all"
          onRangeFilterChange={noop}
        />,
      );
      fireEvent.changeText(getByTestId("reports-search-input"), "Sophie");
      expect(onSearchChange).toHaveBeenCalledWith("Sophie");
    });

    it("affiche 'Aucun résultat' quand la recherche ne matche rien mais qu'il existe des rapports", () => {
      const { getByTestId, queryByTestId } = render(
        <ReportsList
          items={[]}
          hasAnyReports
          searchQuery="zzz"
          onSearchChange={noop}
          rangeFilter="all"
          onRangeFilterChange={noop}
        />,
      );
      expect(getByTestId("reports-empty-search")).toBeTruthy();
      expect(queryByTestId("reports-empty-none")).toBeNull();
    });

    it("affiche 'Aucun rapport' (message distinct) quand il n'existe aucun rapport du tout", () => {
      const { getByTestId, queryByTestId } = render(
        <ReportsList
          items={[]}
          hasAnyReports={false}
          searchQuery=""
          onSearchChange={noop}
          rangeFilter="all"
          onRangeFilterChange={noop}
        />,
      );
      expect(getByTestId("reports-empty-none")).toBeTruthy();
      expect(queryByTestId("reports-empty-search")).toBeNull();
    });
  });

  describe("filtre plage de référence", () => {
    it("affiche les chips avec 'Tous' actif par défaut", () => {
      const { getByTestId } = render(
        <ReportsList
          items={items}
          hasAnyReports
          searchQuery=""
          onSearchChange={noop}
          rangeFilter="all"
          onRangeFilterChange={noop}
        />,
      );
      expect(getByTestId("reports-range-chip-all").props.accessibilityState.selected).toBe(
        true,
      );
      expect(
        getByTestId("reports-range-chip-out_of_range").props.accessibilityState.selected,
      ).toBe(false);
    });

    it("appelle onRangeFilterChange au tap sur un chip", () => {
      const onRangeFilterChange = jest.fn();
      const { getByTestId } = render(
        <ReportsList
          items={items}
          hasAnyReports
          searchQuery=""
          onSearchChange={noop}
          rangeFilter="all"
          onRangeFilterChange={onRangeFilterChange}
        />,
      );
      fireEvent.press(getByTestId("reports-range-chip-out_of_range"));
      expect(onRangeFilterChange).toHaveBeenCalledWith("out_of_range");
    });
  });

  describe("liste", () => {
    it("affiche les rapports fournis et déclenche onItemPress", () => {
      const onItemPress = jest.fn();
      const { getByText } = render(
        <ReportsList
          items={items}
          hasAnyReports
          searchQuery=""
          onSearchChange={noop}
          rangeFilter="all"
          onRangeFilterChange={noop}
          onItemPress={onItemPress}
        />,
      );
      fireEvent.press(getByText("Jean Dupont"));
      expect(onItemPress).toHaveBeenCalledWith(items[0]);
    });
  });
});

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockGetForPatient = jest.fn();
const mockGetById = jest.fn();
// Référence stable : sinon l'effet (deps: [patients, repo]) reprend sa
// requête à chaque render et l'écran reste bloqué en chargement (cf. le
// même commentaire dans results-route.test.tsx).
const mockRepo = { getForPatient: mockGetForPatient, getById: mockGetById };
jest.mock("../../../shared/hooks/use-analysis-repository", () => ({
  useAnalysisRepository: () => mockRepo,
}));

const patients: Patient[] = [
  {
    id: "patient-1",
    name: "Jean Dupont",
    dateOfBirth: "1990-01-01",
    morphologicalProfile: null,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "patient-2",
    name: "Sophie Leclerc",
    dateOfBirth: "1985-05-05",
    morphologicalProfile: null,
    createdAt: "2024-01-01T00:00:00Z",
  },
];

function buildAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  return {
    id: "analysis-1",
    patientId: "patient-1",
    createdAt: "2026-03-19T14:30:00.000Z",
    angles: { kneeAngle: 176.2, hipAngle: 175.0, ankleAngle: 174.5 },
    confidenceScore: 0.9,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  usePatientsStore.setState({
    patients,
    isLoading: false,
    error: null,
  } as never);
  mockGetForPatient.mockImplementation(async (patientId: string) => {
    if (patientId === "patient-1") {
      return [
        buildAnalysis({
          id: "a1",
          patientId: "patient-1",
          bilateralAngles: {
            leftHKA: 179,
            rightHKA: 179,
            left: { kneeAngle: 176.2, hipAngle: 175.0, ankleAngle: 174.5 },
            right: { kneeAngle: 176.2, hipAngle: 175.0, ankleAngle: 174.5 },
          },
        }),
      ];
    }
    if (patientId === "patient-2") {
      return [
        buildAnalysis({
          id: "a2",
          patientId: "patient-2",
          bilateralAngles: {
            leftHKA: 165,
            rightHKA: 165,
            left: { kneeAngle: 165, hipAngle: 165, ankleAngle: 165 },
            right: { kneeAngle: 165, hipAngle: 165, ankleAngle: 165 },
          },
        }),
      ];
    }
    return [];
  });
});

describe("ReportsListRoute — recherche et filtre", () => {
  it("filtre les rapports par nom de patient", async () => {
    const { findByText, queryByText, getByTestId } = render(<ReportsListRoute />);
    await findByText("Jean Dupont");
    expect(await findByText("Sophie Leclerc")).toBeTruthy();

    fireEvent.changeText(getByTestId("reports-search-input"), "Sophie");

    await waitFor(() => {
      expect(queryByText("Jean Dupont")).toBeNull();
    });
  });

  it("filtre les rapports par position vs plage de référence", async () => {
    const { getByTestId, findByText, queryByText } = render(<ReportsListRoute />);
    await findByText("Jean Dupont");

    fireEvent.press(getByTestId("reports-range-chip-out_of_range"));

    await waitFor(() => {
      expect(queryByText("Jean Dupont")).toBeNull();
      expect(queryByText("Sophie Leclerc")).toBeTruthy();
    });
  });

  it("affiche un état vide distinct pour une recherche sans résultat", async () => {
    const { getByTestId, findByText, findByTestId } = render(<ReportsListRoute />);
    await findByText("Jean Dupont");

    fireEvent.changeText(getByTestId("reports-search-input"), "zzz-inconnu");

    expect(await findByTestId("reports-empty-search")).toBeTruthy();
  });

  it("affiche l'état 'Aucun rapport' quand il n'y a aucun rapport", async () => {
    mockGetForPatient.mockResolvedValue([]);
    const { findByTestId } = render(<ReportsListRoute />);
    expect(await findByTestId("reports-empty-none")).toBeTruthy();
  });

  it("navigue vers le rapport sélectionné", async () => {
    mockGetById.mockResolvedValue(buildAnalysis({ id: "a1", patientId: "patient-1" }));
    const { findByText } = render(<ReportsListRoute />);
    const row = await findByText("Jean Dupont");
    fireEvent.press(row);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "Report",
        expect.objectContaining({ patient: patients[0] }),
      );
    });
  });
});

describe("ReportsListRoute — états loading/erreur", () => {
  it("affiche un état d'erreur quand le chargement des patients échoue", async () => {
    usePatientsStore.setState({ patients: [], isLoading: false, error: "Erreur réseau" } as never);
    const { findByText } = render(<ReportsListRoute />);
    expect(await findByText("Erreur réseau")).toBeTruthy();
  });
});
