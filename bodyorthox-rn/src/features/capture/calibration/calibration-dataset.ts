/**
 * Import / export of calibration datasets.
 *
 * The dataset is deliberately decoupled from the app SQLite store: a flat,
 * human-readable CSV/JSON that can be versioned in git and shared, so the
 * radiographic ground truth lives next to the code that consumes it.
 */

import type { CalibrationModel, CalibrationSample, Side } from "./calibration-types";

const REQUIRED_COLUMNS = [
  "sampleId",
  "side",
  "predictedHKA",
  "groundTruthHKA",
] as const;

const OPTIONAL_NUMERIC = [
  "kneeAngle",
  "cameraTilt",
  "femurTibiaRatio",
  "confidence",
] as const;

const OPTIONAL_STRING = ["patientId", "capturedAt", "notes"] as const;

function parseSide(raw: string, line: number): Side {
  const s = raw.trim().toLowerCase();
  if (s === "left" || s === "right") return s;
  throw new Error(`Ligne ${line}: side invalide "${raw}" (attendu left|right)`);
}

function parseNumber(raw: string, column: string, line: number): number {
  const v = Number(raw.trim());
  if (!Number.isFinite(v)) {
    throw new Error(`Ligne ${line}: ${column} non numérique "${raw}"`);
  }
  return v;
}

/** Split a CSV line on commas, honoring simple double-quote quoting. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/**
 * Parse a CSV string into validated calibration samples.
 *
 * The header row defines the columns; required columns are
 * `sampleId, side, predictedHKA, groundTruthHKA`. Blank lines and lines
 * starting with `#` are ignored. Throws with a 1-based line number on the
 * first invalid row — fail fast, never silently drop a labeled pair.
 */
export function parseCalibrationCsv(csv: string): CalibrationSample[] {
  const rows = csv
    .split(/\r?\n/)
    .map((r, idx) => ({ raw: r, line: idx + 1 }))
    .filter((r) => r.raw.trim() !== "" && !r.raw.trim().startsWith("#"));

  if (rows.length === 0) {
    throw new Error("CSV vide : aucune ligne de données");
  }

  const header = splitCsvLine(rows[0].raw).map((h) => h.trim());
  for (const col of REQUIRED_COLUMNS) {
    if (!header.includes(col)) {
      throw new Error(`Colonne requise manquante : "${col}"`);
    }
  }

  const col = (name: string) => header.indexOf(name);

  return rows.slice(1).map(({ raw, line }) => {
    const cells = splitCsvLine(raw);
    const get = (name: string): string | undefined => {
      const idx = col(name);
      return idx >= 0 ? cells[idx] : undefined;
    };

    const sample: Record<string, unknown> = {
      sampleId: (get("sampleId") ?? "").trim(),
      side: parseSide(get("side") ?? "", line),
      predictedHKA: parseNumber(get("predictedHKA") ?? "", "predictedHKA", line),
      groundTruthHKA: parseNumber(
        get("groundTruthHKA") ?? "",
        "groundTruthHKA",
        line,
      ),
    };

    if (!sample.sampleId) {
      throw new Error(`Ligne ${line}: sampleId vide`);
    }

    for (const name of OPTIONAL_NUMERIC) {
      const v = get(name);
      if (v !== undefined && v.trim() !== "") {
        sample[name] = parseNumber(v, name, line);
      }
    }
    for (const name of OPTIONAL_STRING) {
      const v = get(name);
      if (v !== undefined && v.trim() !== "") {
        sample[name] = v.trim();
      }
    }

    return sample as unknown as CalibrationSample;
  });
}

/** Serialize samples back to CSV (stable column order). */
export function toCalibrationCsv(samples: readonly CalibrationSample[]): string {
  const columns = [
    "sampleId",
    "patientId",
    "side",
    "predictedHKA",
    "groundTruthHKA",
    ...OPTIONAL_NUMERIC,
    "capturedAt",
    "notes",
  ];
  const escape = (v: unknown): string => {
    if (v === undefined || v === null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.join(",")];
  for (const s of samples) {
    lines.push(
      columns
        .map((c) => escape((s as unknown as Record<string, unknown>)[c]))
        .join(","),
    );
  }
  return lines.join("\n") + "\n";
}

/** Serialize a fitted model to pretty JSON for versioning. */
export function serializeModel(model: CalibrationModel): string {
  return JSON.stringify(model, null, 2) + "\n";
}

/** Parse and minimally validate a model JSON. */
export function parseModel(json: string): CalibrationModel {
  const obj = JSON.parse(json) as CalibrationModel;
  if (obj.version !== 1 || !obj.left || !obj.right) {
    throw new Error("Modèle de calibration invalide ou version non supportée");
  }
  return obj;
}
