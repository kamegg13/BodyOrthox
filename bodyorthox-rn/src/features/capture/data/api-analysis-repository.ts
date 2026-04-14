/**
 * ApiAnalysisRepository — stocke les analyses sur le serveur API.
 * Les images (base64) restent en IndexedDB local, référencées par analysis ID.
 */
import { apiRequest } from "../../../core/api/api-client";
import type { BilateralAngles, PoseLandmarks } from "./angle-calculator";
import type { IAnalysisRepository } from "./analysis-repository";
import type { Analysis, CreateAnalysisInput } from "../domain/analysis";

// ── IndexedDB helpers (images locales) ─────────────────────────────────────

const IDB_NAME = "bodyorthox_images";
const IDB_STORE = "images";

function openImagesIDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) =>
      (e.target as IDBOpenDBRequest).result.createObjectStore(IDB_STORE);
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => resolve(null);
  });
}

async function loadImageFromIDB(id: string): Promise<string | undefined> {
  const db = await openImagesIDB();
  if (!db) return undefined;
  return new Promise((resolve) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(id);
    req.onsuccess = () => resolve(req.result as string | undefined);
    req.onerror = () => resolve(undefined);
  });
}

function saveImageToIDB(id: string, url: string): void {
  openImagesIDB().then((db) => {
    if (!db) return;
    db.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE).put(url, id);
  });
}

function deleteImageFromIDB(id: string): void {
  openImagesIDB().then((db) => {
    if (!db) return;
    db.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE).delete(id);
  });
}

// ── API response type ───────────────────────────────────────────────────────

interface ApiAnalysis {
  id: string;
  patientId: string;
  hkaLeft: number | null;
  hkaRight: number | null;
  landmarksJson: string | null;
  bilateralAnglesJson: string | null;
  analyzedAt: string;
  createdAt: string;
  confidenceScore: number | null;
  kneeAngle: number | null;
  hipAngle: number | null;
  ankleAngle: number | null;
  mlCorrected: boolean;
  manualCorrectionJoint: string | null;
}

function parseLandmarks(json: string | null): PoseLandmarks | undefined {
  if (!json) return undefined;
  try { return JSON.parse(json) as PoseLandmarks; } catch { return undefined; }
}

function parseBilateral(json: string | null): BilateralAngles | undefined {
  if (!json) return undefined;
  try { return JSON.parse(json) as BilateralAngles; } catch { return undefined; }
}

async function apiToAnalysis(
  row: ApiAnalysis,
  capturedImageUrl?: string,
): Promise<Analysis> {
  const image = capturedImageUrl ?? (await loadImageFromIDB(row.id));
  const allLandmarks = parseLandmarks(row.landmarksJson);
  const bilateralAngles = parseBilateral(row.bilateralAnglesJson);

  return {
    id: row.id,
    patientId: row.patientId,
    createdAt: row.createdAt,
    angles: {
      kneeAngle: row.kneeAngle ?? 0,
      hipAngle: row.hipAngle ?? 0,
      ankleAngle: row.ankleAngle ?? 0,
    },
    bilateralAngles,
    confidenceScore: row.confidenceScore ?? 0,
    manualCorrectionApplied: row.mlCorrected,
    manualCorrectionJoint:
      (row.manualCorrectionJoint as Analysis["manualCorrectionJoint"]) ?? null,
    capturedImageUrl: image,
    allLandmarks,
  };
}

// ── Repository ──────────────────────────────────────────────────────────────

export class ApiAnalysisRepository implements IAnalysisRepository {
  async getForPatient(patientId: string): Promise<Analysis[]> {
    const rows = await apiRequest<ApiAnalysis[]>(
      `/patients/${patientId}/analyses`,
    );
    return Promise.all(rows.map((row) => apiToAnalysis(row)));
  }

  async getById(id: string): Promise<Analysis | null> {
    try {
      const row = await apiRequest<ApiAnalysis>(`/analyses/${id}`);
      return apiToAnalysis(row);
    } catch {
      return null;
    }
  }

  async create(input: CreateAnalysisInput): Promise<Analysis> {
    const body = {
      hkaLeft: input.bilateralAngles?.leftHKA ?? null,
      hkaRight: input.bilateralAngles?.rightHKA ?? null,
      landmarksJson: input.allLandmarks
        ? JSON.stringify(input.allLandmarks)
        : null,
      bilateralAnglesJson: input.bilateralAngles
        ? JSON.stringify(input.bilateralAngles)
        : null,
      analyzedAt: new Date().toISOString(),
      confidenceScore: input.confidenceScore,
      kneeAngle: input.angles.kneeAngle,
      hipAngle: input.angles.hipAngle,
      ankleAngle: input.angles.ankleAngle,
      mlCorrected: input.manualCorrectionApplied ?? false,
      manualCorrectionJoint: input.manualCorrectionJoint ?? null,
    };

    const row = await apiRequest<ApiAnalysis>(
      `/patients/${input.patientId}/analyses`,
      { method: "POST", body: JSON.stringify(body) },
    );

    // Sauvegarder l'image localement (IndexedDB) avec l'ID serveur
    if (input.capturedImageUrl) {
      saveImageToIDB(row.id, input.capturedImageUrl);
    }

    return apiToAnalysis(row, input.capturedImageUrl);
  }

  async update(
    id: string,
    partial: Partial<
      Pick<Analysis, "angles" | "manualCorrectionApplied" | "manualCorrectionJoint">
    >,
  ): Promise<void> {
    const body: Record<string, unknown> = {};
    if (partial.angles) {
      body.kneeAngle = partial.angles.kneeAngle;
      body.hipAngle = partial.angles.hipAngle;
      body.ankleAngle = partial.angles.ankleAngle;
    }
    if (partial.manualCorrectionApplied !== undefined) {
      body.mlCorrected = partial.manualCorrectionApplied;
    }
    if (partial.manualCorrectionJoint !== undefined) {
      body.manualCorrectionJoint = partial.manualCorrectionJoint;
    }
    await apiRequest(`/analyses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  async delete(id: string): Promise<void> {
    await apiRequest(`/analyses/${id}`, { method: "DELETE" });
    deleteImageFromIDB(id);
  }
}
