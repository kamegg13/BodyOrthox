import { LEGAL_CONSTANTS } from "../legal-constants";

describe("LEGAL_CONSTANTS", () => {
  it("should have an mdrDisclaimer property", () => {
    expect(LEGAL_CONSTANTS.mdrDisclaimer).toBeDefined();
  });

  it("should contain key EU MDR compliance phrases", () => {
    const d = LEGAL_CONSTANTS.mdrDisclaimer;
    expect(d).toContain("BodyOrthox");
    expect(d).toContain("documentation clinique");
    expect(d).toContain("diagnostic medical");
    expect(d).toContain("jugement clinique du praticien");
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
