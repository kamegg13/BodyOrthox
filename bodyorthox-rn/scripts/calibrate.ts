#!/usr/bin/env node
/**
 * CLI: fit + evaluate an HKA calibration model from a labeled CSV.
 *
 * Usage (no install needed):
 *   npx tsx scripts/calibrate.ts data/calibration/samples.csv
 *   npx tsx scripts/calibrate.ts data/calibration/samples.csv --out model.json
 *
 * Reads a CSV of (predictedHKA, groundTruthHKA) pairs, prints the calibration
 * report, and optionally writes the fitted model JSON to --out.
 *
 * The report is written to stdout; pass --json to emit the full report object
 * instead of the human-readable text.
 */

import { readFileSync, writeFileSync } from "node:fs";
import {
  parseCalibrationCsv,
  buildCalibrationReport,
  formatCalibrationReport,
  serializeModel,
} from "../src/features/capture/calibration";

function parseArgs(argv: string[]): {
  input?: string;
  out?: string;
  json: boolean;
} {
  const args = argv.slice(2);
  const result: { input?: string; out?: string; json: boolean } = {
    json: false,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--out") {
      result.out = args[++i];
    } else if (a === "--json") {
      result.json = true;
    } else if (!a.startsWith("--")) {
      result.input = a;
    }
  }
  return result;
}

function main(): void {
  const { input, out, json } = parseArgs(process.argv);
  if (!input) {
    console.error(
      "Usage: npx tsx scripts/calibrate.ts <samples.csv> [--out model.json] [--json]",
    );
    process.exit(1);
  }

  const csv = readFileSync(input, "utf8");
  const samples = parseCalibrationCsv(csv);

  // Fixed timestamp from the environment keeps reruns reproducible/diffable.
  const generatedAt = new Date().toISOString();
  const report = buildCalibrationReport(samples, generatedAt);

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatCalibrationReport(report));
  }

  if (out) {
    writeFileSync(out, serializeModel(report.model), "utf8");
    console.error(`\nModèle écrit : ${out}`);
  }
}

main();
