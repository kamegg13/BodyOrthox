import React from "react";
import { Alert, type AlertButton } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { AccountScreen } from "../account-screen";
import { useAuthStore } from "../../../../core/auth/auth-store";
import {
  __resetKeyValueStorage,
  getKeyValueStorage,
} from "../../../../core/storage/key-value-storage";
import { buildExportPayload, exportFileName } from "../../domain/data-export";
import { shareExportFile } from "../../data/export-service";
import { deleteAllData } from "../../../../core/database/data-erasure";

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("../../../../core/auth/auth-store");

// La base réelle n'est jamais atteinte sous Jest : loadCounts / export /
// suppression passent toutes par ces repositories (mockés), jamais par du
// SQL brut dans l'écran.
jest.mock("../../../../core/database/init", () => ({
  getDatabase: jest.fn(() => ({})),
}));

const mockPatientCount = jest.fn().mockResolvedValue(0);
jest.mock("../../../patients/data/sqlite-patient-repository", () => ({
  SqlitePatientRepository: jest.fn().mockImplementation(() => ({
    count: mockPatientCount,
  })),
}));

const mockAnalysisCount = jest.fn().mockResolvedValue(0);
jest.mock("../../../capture/data/sqlite-analysis-repository", () => ({
  SqliteAnalysisRepository: jest.fn().mockImplementation(() => ({
    count: mockAnalysisCount,
  })),
}));

jest.mock("../../domain/data-export", () => ({
  buildExportPayload: jest.fn(),
  exportFileName: jest.fn(() => "bodyorthox-export-2026-07-20.json"),
}));

jest.mock("../../data/export-service", () => ({
  shareExportFile: jest.fn(),
}));

jest.mock("../../../../core/database/data-erasure", () => ({
  deleteAllData: jest.fn(),
}));

const mockBuildExportPayload = buildExportPayload as jest.Mock;
const mockExportFileName = exportFileName as jest.Mock;
const mockShareExportFile = shareExportFile as jest.Mock;
const mockDeleteAllData = deleteAllData as jest.Mock;

function mockSignedIn(role: "admin" | "practitioner") {
  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: unknown) => unknown) =>
      selector({
        logout: jest.fn(),
        user: { email: "test@bodyorthox.com", role },
        isAuthenticated: true,
      }),
  );
}

function mockSignedOut() {
  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: unknown) => unknown) =>
      selector({ logout: jest.fn(), user: null, isAuthenticated: false }),
  );
}

/** Simule l'appui sur le bouton destructif d'un `showConfirm` (natif). */
function autoConfirmDestructive() {
  return jest
    .spyOn(Alert, "alert")
    .mockImplementation(
      (_title?: string, _message?: string, buttons?: AlertButton[]) => {
        buttons?.find((b) => b.style === "destructive")?.onPress?.();
      },
    );
}

describe("AccountScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetKeyValueStorage();
    mockExportFileName.mockReturnValue("bodyorthox-export-2026-07-20.json");
  });

  it("déconnecté : propose « Se connecter » et navigue vers Login, sans section session", () => {
    mockSignedOut();
    const { getByTestId, queryByTestId } = render(<AccountScreen />);

    expect(getByTestId("account-signed-out-info")).toBeTruthy();
    expect(queryByTestId("logout-button")).toBeNull();

    fireEvent.press(getByTestId("login-button"));

    expect(mockNavigate).toHaveBeenCalledWith("Login");
  });

  it("connecté praticien : mention Calibration gérée par l'admin, pas de lien", () => {
    mockSignedIn("practitioner");
    const { getByTestId, queryByTestId } = render(<AccountScreen />);

    expect(getByTestId("calibration-admin-only-info")).toBeTruthy();
    expect(queryByTestId("calibration-button")).toBeNull();
    expect(getByTestId("logout-button")).toBeTruthy();
  });

  it("connecté admin : garde le lien Calibration HKA cliquable, sans la mention", () => {
    mockSignedIn("admin");
    const { getByTestId, queryByTestId } = render(<AccountScreen />);

    expect(getByTestId("calibration-button")).toBeTruthy();
    expect(queryByTestId("calibration-admin-only-info")).toBeNull();
  });

  it("propose « Revoir l'introduction » et navigue vers Onboarding en mode révision", () => {
    mockSignedIn("practitioner");
    const { getByTestId } = render(<AccountScreen />);

    fireEvent.press(getByTestId("review-onboarding-button"));

    expect(mockNavigate).toHaveBeenCalledWith("Onboarding", { mode: "review" });
  });

  it("le toggle Face ID / Touch ID persiste l'activation du verrou biométrique", () => {
    mockSignedOut();
    const { getByTestId } = render(<AccountScreen />);

    // Opt-in : off par défaut → on l'active.
    fireEvent(getByTestId("faceid-toggle"), "valueChange", true);

    // Un nouveau montage lit l'état persisté.
    const second = render(<AccountScreen />);
    expect(second.getByTestId("faceid-toggle").props.value).toBe(true);
  });

  describe("Profil praticien (persistance cross-plateforme)", () => {
    it("persiste la saisie via getKeyValueStorage, pas localStorage direct (cassé sur natif)", () => {
      mockSignedOut();
      const { getByTestId } = render(<AccountScreen />);

      fireEvent.changeText(
        getByTestId("input-practitioner_name"),
        "Dr. Rossi",
      );

      expect(getKeyValueStorage().getItem("practitioner_name")).toBe(
        "Dr. Rossi",
      );
    });

    it("relit la valeur persistée à un nouveau montage (survit sur iOS/Android)", () => {
      mockSignedOut();
      const first = render(<AccountScreen />);
      fireEvent.changeText(
        first.getByTestId("input-practitioner_cabinet"),
        "Cabinet Antidote",
      );

      const second = render(<AccountScreen />);
      expect(
        second.getByTestId("input-practitioner_cabinet").props.value,
      ).toBe("Cabinet Antidote");
    });
  });

  describe("Compteurs (Données) — via les repositories", () => {
    it("affiche les compteurs renvoyés par SqlitePatientRepository/SqliteAnalysisRepository", async () => {
      mockSignedOut();
      mockPatientCount.mockResolvedValueOnce(3);
      mockAnalysisCount.mockResolvedValueOnce(7);

      const { findByText } = render(<AccountScreen />);

      expect(await findByText("3")).toBeTruthy();
      expect(await findByText("7")).toBeTruthy();
      expect(mockPatientCount).toHaveBeenCalledTimes(1);
      expect(mockAnalysisCount).toHaveBeenCalledTimes(1);
    });

    it("garde les compteurs à 0 sans planter quand la base n'est pas encore prête", async () => {
      mockSignedOut();
      mockPatientCount.mockRejectedValueOnce(new Error("not ready"));

      const { findAllByText } = render(<AccountScreen />);

      expect(await findAllByText("0")).toHaveLength(2);
    });
  });

  describe("Export complet (art. 20 RGPD)", () => {
    const payload = {
      exportVersion: 1 as const,
      exportedAt: "2026-07-20T00:00:00.000Z",
      app: "BodyOrthox" as const,
      patients: [],
    };

    it("construit le payload via les repositories et le partage", async () => {
      mockSignedOut();
      mockBuildExportPayload.mockResolvedValueOnce(payload);
      mockShareExportFile.mockResolvedValueOnce({ kind: "exported" });

      const { getByTestId } = render(<AccountScreen />);
      fireEvent.press(getByTestId("export-data-button"));

      await waitFor(() => {
        expect(mockShareExportFile).toHaveBeenCalledWith(
          JSON.stringify(payload, null, 2),
          "bodyorthox-export-2026-07-20.json",
        );
      });
      expect(mockBuildExportPayload).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.any(String),
      );
    });

    it("affiche et logue l'erreur quand le service de partage échoue", async () => {
      mockSignedOut();
      mockBuildExportPayload.mockResolvedValueOnce(payload);
      mockShareExportFile.mockResolvedValueOnce({
        kind: "error",
        message: "Espace insuffisant",
      });
      const alertSpy = jest
        .spyOn(Alert, "alert")
        .mockImplementation(() => undefined);
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      const { getByTestId } = render(<AccountScreen />);
      fireEvent.press(getByTestId("export-data-button"));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("Export", "Espace insuffisant");
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[AccountScreen]"),
        "Espace insuffisant",
      );
    });

    it("affiche une alerte générique et logue la trace quand l'export lève une exception", async () => {
      mockSignedOut();
      const error = new Error("DB indisponible");
      mockBuildExportPayload.mockRejectedValueOnce(error);
      const alertSpy = jest
        .spyOn(Alert, "alert")
        .mockImplementation(() => undefined);
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      const { getByTestId } = render(<AccountScreen />);
      fireEvent.press(getByTestId("export-data-button"));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "Export",
          "Impossible d'exporter les données.",
        );
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[AccountScreen]"),
        error,
      );
    });
  });

  describe("Suppression complète (art. 17 RGPD)", () => {
    it("demande confirmation avant de supprimer quoi que ce soit", () => {
      mockSignedOut();
      const alertSpy = jest
        .spyOn(Alert, "alert")
        .mockImplementation(() => undefined);

      const { getByTestId } = render(<AccountScreen />);
      fireEvent.press(getByTestId("delete-data-button"));

      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(mockDeleteAllData).not.toHaveBeenCalled();
    });

    it("supprime via deleteAllData (atomique) et rafraîchit les compteurs depuis les repositories", async () => {
      mockSignedOut();
      mockPatientCount.mockResolvedValueOnce(3).mockResolvedValueOnce(0);
      mockAnalysisCount.mockResolvedValueOnce(7).mockResolvedValueOnce(0);
      mockDeleteAllData.mockResolvedValueOnce(undefined);
      const alertSpy = autoConfirmDestructive();

      const { getByTestId, findByText, findAllByText } = render(
        <AccountScreen />,
      );
      expect(await findByText("3")).toBeTruthy();

      fireEvent.press(getByTestId("delete-data-button"));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "Succès",
          "Toutes les données ont été supprimées.",
        );
      });
      expect(mockDeleteAllData).toHaveBeenCalledTimes(1);
      // Les compteurs sont relus (pas remis à zéro localement) : deux appels
      // chacun (chargement initial + rafraîchissement post-suppression).
      expect(mockPatientCount).toHaveBeenCalledTimes(2);
      expect(mockAnalysisCount).toHaveBeenCalledTimes(2);
      expect(await findAllByText("0")).toHaveLength(2);
    });

    it("échec de la suppression : alerte, log, et ne touche pas aux compteurs affichés", async () => {
      mockSignedOut();
      mockPatientCount.mockResolvedValue(4);
      mockAnalysisCount.mockResolvedValue(9);
      const error = new Error("crash simulé entre les deux DELETE");
      mockDeleteAllData.mockRejectedValueOnce(error);
      const alertSpy = autoConfirmDestructive();
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      const { getByTestId, findByText } = render(<AccountScreen />);
      expect(await findByText("4")).toBeTruthy();
      expect(await findByText("9")).toBeTruthy();

      fireEvent.press(getByTestId("delete-data-button"));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "Erreur",
          "Impossible de supprimer les données.",
        );
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[AccountScreen]"),
        error,
      );
      // Pas de rafraîchissement après un échec : les compteurs restent ceux
      // déjà chargés (aucune remise à zéro locale trompeuse).
      expect(mockPatientCount).toHaveBeenCalledTimes(1);
      expect(mockAnalysisCount).toHaveBeenCalledTimes(1);
      expect(getByTestId("account-screen")).toBeTruthy();
    });
  });
});
