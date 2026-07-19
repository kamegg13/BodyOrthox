import {
  hkaDeviation,
  hkaRangeLabel,
  hkaRangeShortLabel,
  hkaRangeStatus,
} from "../hka-range";

describe("hkaDeviation", () => {
  it("retourne 0 dans la plage de référence", () => {
    expect(hkaDeviation(175)).toBe(0);
    expect(hkaDeviation(177.5)).toBe(0);
    expect(hkaDeviation(180)).toBe(0);
  });

  it("retourne l'écart signé sous la plage", () => {
    expect(hkaDeviation(173)).toBe(-2);
    expect(hkaDeviation(174.9)).toBeCloseTo(-0.1);
  });

  it("retourne l'écart signé au-dessus de la plage", () => {
    expect(hkaDeviation(182.4)).toBeCloseTo(2.4);
  });

  it("retourne null quand l'angle n'est pas mesurable", () => {
    expect(hkaDeviation(null)).toBeNull();
    expect(hkaDeviation(undefined)).toBeNull();
    expect(hkaDeviation(0)).toBeNull();
    expect(hkaDeviation(Number.NaN)).toBeNull();
  });
});

describe("hkaRangeStatus", () => {
  it("in_range quand les deux côtés sont dans la plage", () => {
    expect(hkaRangeStatus(176, 179)).toBe("in_range");
  });

  it("out_of_range dès qu'un côté sort de la plage", () => {
    expect(hkaRangeStatus(176, 183)).toBe("out_of_range");
    expect(hkaRangeStatus(172, 178)).toBe("out_of_range");
  });

  it("ignore un côté non mesuré si l'autre est mesuré", () => {
    expect(hkaRangeStatus(null, 178)).toBe("in_range");
    expect(hkaRangeStatus(0, 172)).toBe("out_of_range");
  });

  it("unavailable quand aucun côté n'est mesuré", () => {
    expect(hkaRangeStatus(null, null)).toBe("unavailable");
    expect(hkaRangeStatus(0, undefined)).toBe("unavailable");
  });
});

describe("libellés neutres", () => {
  it("ne contient jamais de vocabulaire de gravité clinique", () => {
    const statuses = ["in_range", "out_of_range", "unavailable"] as const;
    for (const s of statuses) {
      for (const label of [hkaRangeLabel(s), hkaRangeShortLabel(s)]) {
        expect(label).not.toMatch(/normal|modéré|sévère|pathologi/i);
      }
    }
  });

  it("décrit factuellement la position par rapport à la plage", () => {
    expect(hkaRangeLabel("in_range")).toBe("Dans la plage 175–180°");
    expect(hkaRangeLabel("out_of_range")).toBe("Hors plage 175–180°");
    expect(hkaRangeLabel("unavailable")).toBe("HKA non mesuré");
    expect(hkaRangeShortLabel("out_of_range")).toBe("Hors plage");
  });
});
