/**
 * Pure helpers for the calibration UI's editable table.
 *
 * Kept separate from the React screen so the row → sample conversion and its
 * validation are unit-testable without rendering.
 */

import type { CalibrationSample, Side } from "./calibration-types";

export interface FormRow {
  readonly id: string;
  readonly side: Side;
  /** Raw text from the input — validated on conversion. */
  readonly predicted: string;
  readonly groundTruth: string;
}

let rowCounter = 0;

/** A blank row. `id` is monotonic (no Date/random — keeps things deterministic). */
export function createEmptyRow(side: Side = "left"): FormRow {
  rowCounter += 1;
  return { id: `row-${rowCounter}`, side, predicted: "", groundTruth: "" };
}

function parseAngle(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return null;
  const v = Number(trimmed);
  return Number.isFinite(v) ? v : null;
}

/** True when both angle fields parse to finite numbers. */
export function isRowComplete(row: FormRow): boolean {
  return parseAngle(row.predicted) !== null && parseAngle(row.groundTruth) !== null;
}

/** True when a row has at least one non-empty field (i.e. user started it). */
export function isRowStarted(row: FormRow): boolean {
  return row.predicted.trim() !== "" || row.groundTruth.trim() !== "";
}

export interface ParsedRows {
  readonly samples: CalibrationSample[];
  /** Rows the user started but that are incomplete / non-numeric. */
  readonly invalidCount: number;
  readonly leftCount: number;
  readonly rightCount: number;
}

/**
 * Convert form rows to validated calibration samples.
 *
 * Completely blank rows are ignored. Started-but-incomplete rows are counted in
 * `invalidCount` so the UI can warn rather than silently dropping data.
 */
export function parseFormRows(rows: readonly FormRow[]): ParsedRows {
  const samples: CalibrationSample[] = [];
  let invalidCount = 0;
  let leftCount = 0;
  let rightCount = 0;

  for (const row of rows) {
    const predicted = parseAngle(row.predicted);
    const groundTruth = parseAngle(row.groundTruth);

    if (predicted === null && groundTruth === null) continue; // blank → ignore

    if (predicted === null || groundTruth === null) {
      invalidCount += 1;
      continue;
    }

    samples.push({
      sampleId: row.id,
      side: row.side,
      predictedHKA: predicted,
      groundTruthHKA: groundTruth,
    });
    if (row.side === "left") leftCount += 1;
    else rightCount += 1;
  }

  return { samples, invalidCount, leftCount, rightCount };
}

/** Seed rows from the bundled example dataset values, for a quick demo. */
export function exampleRows(): FormRow[] {
  const data: Array<[Side, string, string]> = [
    ["left", "178.2", "174.5"],
    ["right", "179.0", "176.1"],
    ["left", "181.4", "178.9"],
    ["right", "182.0", "179.4"],
    ["left", "176.5", "172.0"],
    ["right", "177.1", "173.2"],
    ["left", "184.2", "182.5"],
    ["right", "185.0", "183.8"],
    ["left", "180.1", "177.0"],
    ["right", "179.6", "176.4"],
  ];
  return data.map(([side, predicted, groundTruth]) => {
    rowCounter += 1;
    return { id: `row-${rowCounter}`, side, predicted, groundTruth };
  });
}
