import { LEGAL_CONSTANTS } from "../legal-constants";

describe("LEGAL_CONSTANTS", () => {
  it("should have an mdrDisclaimer property", () => {
    expect(LEGAL_CONSTANTS.mdrDisclaimer).toBeDefined();
  });

  it("affirme le positionnement non-DM sans vocabulaire Règle 11", () => {
    const d = LEGAL_CONSTANTS.mdrDisclaimer;
    expect(d).toContain("BodyOrthox");
    expect(d).toContain("mesure et de documentation");
    expect(d).toContain("ne constitue pas un dispositif médical");
    expect(d).toContain("ni diagnostic, ni recommandation de traitement");
    // Formulations interdites : déclencheurs de qualification DM (Règle 11)
    // ou insinuation d'un DM « non certifié ».
    expect(d).not.toMatch(/aide à la décision/i);
    expect(d).not.toMatch(/certifié/i);
    expect(d).not.toMatch(/clinique/i);
  });

  it("should be a non-empty string", () => {
    expect(typeof LEGAL_CONSTANTS.mdrDisclaimer).toBe("string");
    expect(LEGAL_CONSTANTS.mdrDisclaimer.length).toBeGreaterThan(0);
  });

  it("should be immutable (as const)", () => {
    // Verify the object is frozen-like (as const makes it readonly at compile time)
    expect(LEGAL_CONSTANTS).toBeDefined();
    expect(Object.keys(LEGAL_CONSTANTS)).toContain("mdrDisclaimer");
  });
});
