import {
  parseCalibrationCsv,
  toCalibrationCsv,
  serializeModel,
  parseModel,
} from "../calibration-dataset";
import type { CalibrationModel } from "../calibration-types";

describe("parseCalibrationCsv", () => {
  it("parses required and optional columns", () => {
    const csv = [
      "sampleId,patientId,side,predictedHKA,groundTruthHKA,confidence,notes",
      "S1,P1,left,178.2,174.5,0.91,varum",
      "S2,P1,right,179.0,176.1,,",
    ].join("\n");
    const out = parseCalibrationCsv(csv);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({
      sampleId: "S1",
      patientId: "P1",
      side: "left",
      predictedHKA: 178.2,
      groundTruthHKA: 174.5,
      confidence: 0.91,
      notes: "varum",
    });
    // empty optional cells are omitted, not stored as NaN/""
    expect(out[1].confidence).toBeUndefined();
    expect(out[1].notes).toBeUndefined();
  });

  it("ignores blank lines and # comments", () => {
    const csv = [
      "# header comment",
      "sampleId,side,predictedHKA,groundTruthHKA",
      "",
      "S1,left,180,177",
      "# trailing comment",
    ].join("\n");
    expect(parseCalibrationCsv(csv)).toHaveLength(1);
  });

  it("handles quoted fields containing commas", () => {
    const csv = [
      "sampleId,side,predictedHKA,groundTruthHKA,notes",
      'S1,left,180,177,"varum, post-trauma"',
    ].join("\n");
    expect(parseCalibrationCsv(csv)[0].notes).toBe("varum, post-trauma");
  });

  it("throws when a required column is missing", () => {
    const csv = "sampleId,side,predictedHKA\nS1,left,180";
    expect(() => parseCalibrationCsv(csv)).toThrow(/groundTruthHKA/);
  });

  it("throws on an invalid side", () => {
    const csv = "sampleId,side,predictedHKA,groundTruthHKA\nS1,middle,180,177";
    expect(() => parseCalibrationCsv(csv)).toThrow(/side invalide/);
  });

  it("throws on a non-numeric angle with the line number", () => {
    const csv =
      "sampleId,side,predictedHKA,groundTruthHKA\nS1,left,abc,177";
    expect(() => parseCalibrationCsv(csv)).toThrow(/Ligne 2/);
  });

  it("throws on an empty sampleId", () => {
    const csv = "sampleId,side,predictedHKA,groundTruthHKA\n,left,180,177";
    expect(() => parseCalibrationCsv(csv)).toThrow(/sampleId vide/);
  });

  it("throws on an empty dataset", () => {
    expect(() => parseCalibrationCsv("# only comments")).toThrow(/vide/);
  });
});

describe("toCalibrationCsv", () => {
  it("round-trips through parse", () => {
    const csv = toCalibrationCsv([
      {
        sampleId: "S1",
        patientId: "P1",
        side: "left",
        predictedHKA: 180,
        groundTruthHKA: 177,
        notes: "with, comma",
      },
    ]);
    const back = parseCalibrationCsv(csv);
    expect(back[0]).toMatchObject({
      sampleId: "S1",
      side: "left",
      predictedHKA: 180,
      groundTruthHKA: 177,
      notes: "with, comma",
    });
  });
});

describe("model serialization", () => {
  const model: CalibrationModel = {
    version: 1,
    createdAt: "2026-06-06T00:00:00.000Z",
    left: { kind: "offset", coefficients: { a: 1, b: -3 }, n: 12 },
    right: { kind: "linear", coefficients: { a: 1.1, b: -20 }, n: 12 },
  };

  it("round-trips serialize/parse", () => {
    expect(parseModel(serializeModel(model))).toEqual(model);
  });

  it("rejects an unsupported version", () => {
    const bad = JSON.stringify({ version: 2, left: {}, right: {} });
    expect(() => parseModel(bad)).toThrow(/version/);
  });
});
