/**
 * Active HKA calibration model — persistence + live access.
 *
 * The model fitted in the calibration screen is persisted here and read back by
 * the capture pipeline (`capture-store`) to correct HKA on every saved analysis.
 *
 * Uses the shared `key-value-storage` seam: localStorage on web with an
 * in-memory fallback for Android/Hermes where localStorage is absent.
 */

import { create } from "zustand";
import type { CalibrationModel } from "./calibration-types";
import { parseModel, serializeModel } from "./calibration-dataset";
import { getKeyValueStorage } from "../../../core/storage/key-value-storage";

const STORAGE_KEY = "hka_calibration_model";

let inMemoryModel: CalibrationModel | null = null;
let loaded = false;

function readFromStorage(): CalibrationModel | null {
  try {
    const raw = getKeyValueStorage().getItem(STORAGE_KEY);
    if (raw) return parseModel(raw);
  } catch {
    // Stockage indisponible ou JSON corrompu — repli sur l'état mémoire.
  }
  return inMemoryModel;
}

function writeToStorage(model: CalibrationModel | null): void {
  inMemoryModel = model;
  if (model) getKeyValueStorage().setItem(STORAGE_KEY, serializeModel(model));
  else getKeyValueStorage().removeItem(STORAGE_KEY);
}

/**
 * Synchronous accessor for non-React consumers (the capture store reads this on
 * every save). Lazily hydrates from storage on first call.
 */
export function getActiveCalibrationModel(): CalibrationModel | null {
  if (!loaded) {
    inMemoryModel = readFromStorage();
    loaded = true;
  }
  return inMemoryModel;
}

/** Reset cached state — test seam only. */
export function __resetCalibrationStoreForTests(): void {
  inMemoryModel = null;
  loaded = false;
}

interface CalibrationStoreState {
  readonly activeModel: CalibrationModel | null;
}

interface CalibrationStoreActions {
  /** Re-hydrate from storage (e.g. on screen focus). */
  load(): void;
  /** Persist a model and make it the live correction. */
  activate(model: CalibrationModel): void;
  /** Remove the active model — measurements return to raw output. */
  deactivate(): void;
}

export const useCalibrationStore = create<
  CalibrationStoreState & CalibrationStoreActions
>()((set) => ({
  activeModel: getActiveCalibrationModel(),

  load() {
    loaded = false;
    set({ activeModel: getActiveCalibrationModel() });
  },

  activate(model) {
    writeToStorage(model);
    loaded = true;
    set({ activeModel: model });
  },

  deactivate() {
    writeToStorage(null);
    loaded = true;
    set({ activeModel: null });
  },
}));
