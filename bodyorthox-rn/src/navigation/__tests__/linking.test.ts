import { getStateFromPath } from "@react-navigation/native";
import { linking } from "../linking";

/** Feuille active (écran le plus profond) d'un état de navigation. */
function deepestRoute(state: ReturnType<typeof getStateFromPath>): {
  name: string;
  params?: Record<string, unknown>;
} {
  let current: any = state;
  let route: any = null;
  while (current?.routes?.length) {
    route = current.routes[current.routes.length - 1];
    current = route.state;
  }
  return route;
}

describe("deep linking bodyorthox://", () => {
  it("résout patient/:patientId vers la fiche patient avec son paramètre", () => {
    const state = getStateFromPath("patient/abc-123", linking.config);
    const route = deepestRoute(state);
    expect(route.name).toBe("PatientDetail");
    expect(route.params).toEqual({ patientId: "abc-123" });
  });

  it("résout patient/:patientId/analyse/:analysisId vers les résultats", () => {
    const state = getStateFromPath("patient/p1/analyse/a9", linking.config);
    const route = deepestRoute(state);
    expect(route.name).toBe("Results");
    expect(route.params).toEqual({ patientId: "p1", analysisId: "a9" });
  });

  it("résout capture/:patientId vers l'écran Capture plein écran", () => {
    const state = getStateFromPath("capture/p1", linking.config);
    const route = deepestRoute(state);
    expect(route.name).toBe("Capture");
    expect(route.params).toEqual({ patientId: "p1" });
  });

  it("résout les destinations top-level (patients, rapports, réglages)", () => {
    expect(deepestRoute(getStateFromPath("patients", linking.config)).name).toBe(
      "PatientsList",
    );
    expect(deepestRoute(getStateFromPath("rapports", linking.config)).name).toBe(
      "RapportsHome",
    );
    expect(deepestRoute(getStateFromPath("reglages", linking.config)).name).toBe(
      "CompteHome",
    );
  });
});
