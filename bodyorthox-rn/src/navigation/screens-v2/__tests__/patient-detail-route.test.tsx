import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { PatientDetailRoute, buildDetailData } from "../patient-detail-route";
import { usePatientsStore } from "../../../features/patients/store/patients-store";
import type { Patient } from "../../../features/patients/domain/patient";

const mockPatient: Patient = {
  id: "p1",
  name: "Jean Dupont",
  dateOfBirth: "1990-01-01",
  morphologicalProfile: null,
  createdAt: "2024-01-01T00:00:00Z",
};

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    canGoBack: mockCanGoBack,
  }),
  useRoute: () => ({ params: { patientId: "p1" } }),
}));

jest.mock("../../../shared/hooks/use-analysis-repository", () => ({
  useAnalysisRepository: () => ({
    getForPatient: jest.fn().mockResolvedValue([]),
  }),
}));

function resetStore(overrides?: Record<string, unknown>) {
  usePatientsStore.setState({
    patients: [mockPatient],
    isLoading: false,
    error: null,
    deletePatient: jest.fn().mockResolvedValue(undefined),
    archivePatient: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as never);
}

describe("PatientDetailRoute — suppression/archivage RGPD", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
  });

  it("deletes the patient and navigates back to the patients list on success", async () => {
    const deletePatient = jest.fn().mockResolvedValue(undefined);
    resetStore({ deletePatient });
    jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
      const confirmBtn = buttons?.find((b) => b.style === "destructive");
      confirmBtn?.onPress?.();
    });

    const { getByTestId } = render(<PatientDetailRoute />);
    await waitFor(() => expect(getByTestId("delete-button")).toBeTruthy());
    fireEvent.press(getByTestId("delete-button"));

    await waitFor(() => expect(deletePatient).toHaveBeenCalledWith("p1"));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("MainTabs", { screen: "PatientsTab" }),
    );
  });

  it("shows an error and does not navigate when the store reports a deletion failure", async () => {
    const deletePatient = jest.fn().mockImplementation(async () => {
      usePatientsStore.setState({ error: "Erreur de suppression" } as never);
    });
    resetStore({ deletePatient });
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
      const confirmBtn = buttons?.find((b) => b.style === "destructive");
      confirmBtn?.onPress?.();
    });

    const { getByTestId } = render(<PatientDetailRoute />);
    await waitFor(() => expect(getByTestId("delete-button")).toBeTruthy());
    fireEvent.press(getByTestId("delete-button"));

    await waitFor(() => expect(deletePatient).toHaveBeenCalledWith("p1"));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Erreur", "Erreur de suppression"),
    );
    expect(mockNavigate).not.toHaveBeenCalledWith("MainTabs", { screen: "PatientsTab" });
  });

  it("archives the patient and navigates back to the patients list on success", async () => {
    const archivePatient = jest.fn().mockResolvedValue(undefined);
    resetStore({ archivePatient });
    jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
      const confirmBtn = buttons?.find((b) => b.text !== "Annuler");
      confirmBtn?.onPress?.();
    });

    const { getByTestId } = render(<PatientDetailRoute />);
    await waitFor(() => expect(getByTestId("archive-button")).toBeTruthy());
    fireEvent.press(getByTestId("archive-button"));

    await waitFor(() => expect(archivePatient).toHaveBeenCalledWith("p1"));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("MainTabs", { screen: "PatientsTab" }),
    );
  });
});

describe("buildDetailData — médecin référent & consentement RGPD", () => {
  it("omits referringPhysician and consentDate when absent", () => {
    const data = buildDetailData(mockPatient, []);
    expect(data.referringPhysician).toBeUndefined();
    expect(data.consentDate).toBeUndefined();
  });

  it("maps referringPhysician through", () => {
    const data = buildDetailData({ ...mockPatient, referringPhysician: "Dr. Martin" }, []);
    expect(data.referringPhysician).toBe("Dr. Martin");
  });

  it("formats consentDate for display instead of exposing the raw ISO string", () => {
    const data = buildDetailData(
      { ...mockPatient, consentDate: "2026-01-15T10:00:00.000Z" },
      [],
    );
    expect(data.consentDate).toEqual(expect.any(String));
    expect(data.consentDate).not.toBe("2026-01-15T10:00:00.000Z");
  });
});
