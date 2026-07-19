import { escapeHtml, angleColor, fmt } from "../report-html-helpers";

// ─── escapeHtml ─────────────────────────────────────────────────

describe("escapeHtml", () => {
  it("escapes the five HTML-sensitive characters", () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#039;&lt;/a&gt;",
    );
  });

  it("leaves plain text untouched", () => {
    expect(escapeHtml("Jean Dupont")).toBe("Jean Dupont");
  });

  it("handles an empty string", () => {
    expect(escapeHtml("")).toBe("");
  });
});

// ─── angleColor ─────────────────────────────────────────────────

describe("angleColor", () => {
  it("returns green when the value is within range", () => {
    expect(angleColor(177, 175, 180)).toBe("#059669");
  });

  it("returns green at the exact bounds", () => {
    expect(angleColor(175, 175, 180)).toBe("#059669");
    expect(angleColor(180, 175, 180)).toBe("#059669");
  });

  it("returns orange for a deviation of 5° or less below the range", () => {
    expect(angleColor(170, 175, 180)).toBe("#b45309");
  });

  it("returns orange for a deviation of 5° or less above the range", () => {
    expect(angleColor(185, 175, 180)).toBe("#b45309");
  });

  it("returns red for a deviation greater than 5°", () => {
    expect(angleColor(160, 175, 180)).toBe("#DC2626");
    expect(angleColor(200, 175, 180)).toBe("#DC2626");
  });

  it("returns grey for an unmeasured value (0)", () => {
    expect(angleColor(0, 175, 180)).toBe("#46707F");
  });

  it("returns grey for a non-finite value (NaN / Infinity), never a fabricated color", () => {
    expect(angleColor(NaN, 175, 180)).toBe("#46707F");
    expect(angleColor(Infinity, 175, 180)).toBe("#46707F");
    expect(angleColor(-Infinity, 175, 180)).toBe("#46707F");
  });
});

// ─── fmt ────────────────────────────────────────────────────────

describe("fmt", () => {
  it("formats a valid angle with one decimal and the degree sign", () => {
    expect(fmt(176.234)).toBe("176.2°");
  });

  it("renders an em-dash for an unmeasured value (0)", () => {
    expect(fmt(0)).toBe("—");
  });

  it("renders an em-dash for a non-finite value, never 'NaN°'", () => {
    expect(fmt(NaN)).toBe("—");
    expect(fmt(Infinity)).toBe("—");
  });
});
