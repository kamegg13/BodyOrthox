import {
  createEmptyRow,
  isRowComplete,
  isRowStarted,
  parseFormRows,
  exampleRows,
  type FormRow,
} from "../calibration-form";

const row = (over: Partial<FormRow>): FormRow => ({
  id: "r",
  side: "left",
  predicted: "",
  groundTruth: "",
  ...over,
});

describe("createEmptyRow", () => {
  it("creates a blank row with a unique id and the given side", () => {
    const a = createEmptyRow("right");
    const b = createEmptyRow("right");
    expect(a.side).toBe("right");
    expect(a.predicted).toBe("");
    expect(a.id).not.toBe(b.id);
  });
});

describe("isRowComplete / isRowStarted", () => {
  it("complete needs both numeric fields", () => {
    expect(isRowComplete(row({ predicted: "180", groundTruth: "177" }))).toBe(true);
    expect(isRowComplete(row({ predicted: "180", groundTruth: "" }))).toBe(false);
    expect(isRowComplete(row({ predicted: "abc", groundTruth: "177" }))).toBe(false);
  });
  it("accepts comma decimals", () => {
    expect(isRowComplete(row({ predicted: "180,5", groundTruth: "177,2" }))).toBe(
      true,
    );
  });
  it("started means any field touched", () => {
    expect(isRowStarted(row({ predicted: "1" }))).toBe(true);
    expect(isRowStarted(row({}))).toBe(false);
  });
});

describe("parseFormRows", () => {
  it("converts complete rows to samples and counts sides", () => {
    const r = parseFormRows([
      row({ id: "1", side: "left", predicted: "178.2", groundTruth: "174.5" }),
      row({ id: "2", side: "right", predicted: "179", groundTruth: "176.1" }),
    ]);
    expect(r.samples).toHaveLength(2);
    expect(r.leftCount).toBe(1);
    expect(r.rightCount).toBe(1);
    expect(r.invalidCount).toBe(0);
    expect(r.samples[0]).toMatchObject({
      side: "left",
      predictedHKA: 178.2,
      groundTruthHKA: 174.5,
    });
  });

  it("ignores blank rows but counts started-incomplete ones", () => {
    const r = parseFormRows([
      row({ id: "1" }), // blank → ignored
      row({ id: "2", predicted: "180" }), // started, incomplete → invalid
      row({ id: "3", predicted: "180", groundTruth: "177" }), // valid
    ]);
    expect(r.samples).toHaveLength(1);
    expect(r.invalidCount).toBe(1);
  });

  it("parses comma decimals into numbers", () => {
    const r = parseFormRows([
      row({ id: "1", predicted: "180,5", groundTruth: "177,2" }),
    ]);
    expect(r.samples[0].predictedHKA).toBeCloseTo(180.5, 9);
  });
});

describe("exampleRows", () => {
  it("yields completed left/right rows", () => {
    const rows = exampleRows();
    const parsed = parseFormRows(rows);
    expect(parsed.samples.length).toBe(rows.length);
    expect(parsed.leftCount).toBeGreaterThan(0);
    expect(parsed.rightCount).toBeGreaterThan(0);
  });
});
