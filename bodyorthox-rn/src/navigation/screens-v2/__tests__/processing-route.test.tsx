import React from "react";
import { render, act, cleanup } from "@testing-library/react-native";
import { ProcessingRoute } from "../processing-route";

const mockReset = jest.fn();
// Params mutables : chaque test définit son point d'entrée (originTab).
let mockParams: Record<string, unknown> = {};

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ reset: mockReset }),
  useRoute: () => ({ params: mockParams }),
}));

function advanceToNavigation() {
  act(() => {
    jest.advanceTimersByTime(999);
  });
}

describe("ProcessingRoute", () => {
  beforeEach(() => {
    // Ne faker que les timers macro : patcher nextTick/queueMicrotask/
    // setImmediate corrompt l'objet `process` partagé entre les fichiers du
    // worker Jest et fait pendre le cleanup des suites suivantes.
    jest.useFakeTimers({
      doNotFake: ["nextTick", "queueMicrotask", "setImmediate"],
    });
    jest.clearAllMocks();
    mockParams = {
      analysisId: "a1",
      patientId: "p1",
      capturedImageUrl: "data:image/png;base64,xxx",
    };
  });

  afterEach(() => {
    // Démonte PENDANT que les fake timers sont actifs, puis purge les timers
    // en attente (timer de navigation 900 ms + frames d'animation du badge) :
    // restaurer les vrais timers avec des timers factices encore pendants
    // corrompt le cleanup des suites suivantes du même worker Jest.
    cleanup();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("navigue automatiquement vers Results en moins d'une seconde, sans intervention utilisateur", () => {
    render(<ProcessingRoute />);
    expect(mockReset).not.toHaveBeenCalled();

    advanceToNavigation();

    expect(mockReset).toHaveBeenCalledTimes(1);
    const call = mockReset.mock.calls[0][0];
    const analysesRoutes = call.routes[0].state.routes[0].state.routes;
    const resultsRoute = analysesRoutes.find((r: { name: string }) => r.name === "Results");
    expect(resultsRoute.params).toEqual(
      expect.objectContaining({ analysisId: "a1", patientId: "p1" }),
    );
  });

  it("cible AnalysesTab (Accueil → PatientDetail → Results) par défaut", () => {
    render(<ProcessingRoute />);
    advanceToNavigation();

    const tabRoute = mockReset.mock.calls[0][0].routes[0].state.routes[0];
    expect(tabRoute.name).toBe("AnalysesTab");
    expect(tabRoute.state.routes.map((r: { name: string }) => r.name)).toEqual(
      ["AnalysesHome", "PatientDetail", "Results"],
    );
  });

  it("préserve le tab d'origine : capture lancée depuis PatientsTab", () => {
    mockParams = { ...mockParams, originTab: "PatientsTab" };
    render(<ProcessingRoute />);
    advanceToNavigation();

    const tabRoute = mockReset.mock.calls[0][0].routes[0].state.routes[0];
    expect(tabRoute.name).toBe("PatientsTab");
    expect(tabRoute.state.routes.map((r: { name: string }) => r.name)).toEqual(
      ["PatientsList", "PatientDetail", "Results"],
    );
  });

  it("ne propose aucun bouton Annuler", () => {
    const { queryByText } = render(<ProcessingRoute />);
    expect(queryByText("Annuler")).toBeNull();
  });
});
